import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Scene from "@/components/Scene";
import { AuthBadge, Badge, StatusBadge } from "@/components/panel/Status";
import PreviewAction from "@/components/panel/PreviewAction";
import { requirePreviewAdmin } from "@/lib/previewIdentity";
import { getAdminProperty } from "@/lib/data/admin";
import { bucketInterested } from "@/lib/statsCore";
import { CIT_STATUS, DISTRICT, EIDS_STATUS, TYPE } from "@/lib/labels";
import { date, sqm, tl } from "@/lib/format";

export const metadata: Metadata = { title: "İlan incelemesi" };

type Params = Promise<{ id: string }>;

export default async function AdminPropertyPage({ params }: { params: Params }) {
  await requirePreviewAdmin();
  const p = getAdminProperty((await params).id);
  if (!p) notFound();
  const activeLink = p.links.some((l) => l.authorizationStatus === "active");
  const eidsOk = p.links.some((l) => l.eidsStatus === "simulated_verified");
  const prices = [...new Set(p.links.map((l) => l.partnerAskingPrice))];

  const checks = [
    { ok: p.links.length > 0, t: "En az bir iş ortağı bağlantısı" },
    { ok: activeLink, t: "Aktif yetki belgesi / sözleşme" },
    { ok: eidsOk, t: "EİDS doğrulaması (simülasyon)" },
    { ok: Object.values(p.factSources).some((s) => s === "verified"), t: "En az bir bilgi belgeyle doğrulandı" },
    { ok: prices.length <= 1, t: "Ofisler arasında fiyat tutarlı" },
  ];

  return (
    <>
      <header className="pnl-head">
        <div className="row" style={{ gap: 16 }}>
          <span className="thumb" style={{ width: 96, height: 68 }}>
            <Scene spec={p.scene} label="" />
          </span>
          <div>
            <p className="small muted">
              <Link href="/admin/portfoyler">Tüm ilanlar</Link> / {p.code}
            </p>
            <h1 style={{ fontSize: "1.6rem" }}>{p.title}</h1>
            <div className="row" style={{ marginTop: 6 }}>
              <StatusBadge status={p.status} />
              {p.citizenship && <Badge status={p.citizenship.status} labels={CIT_STATUS} />}
            </div>
          </div>
        </div>
        <div className="row">
          {p.status === "published" ? (
            <>
              <Link href={`/satilik/${p.slug}`} target="_blank" className="btn btn-sm btn-light">
                Sitede gör ↗
              </Link>
              <PreviewAction label="Yayından kaldır" variant="btn-danger" />
            </>
          ) : (
            <>
              <PreviewAction label="Düzeltme iste" variant="btn-light" done="ofise bildirim gönderilmedi" />
              <PreviewAction label="Onayla ve yayınla" variant="btn-ok" done="ilan yayınlanmadı" />
            </>
          )}
        </div>
      </header>

      <div className="two-col">
        <div className="stack" style={{ gap: 20 }}>
          <section className="card stack" style={{ gap: 12 }}>
            <h2 style={{ fontSize: "1.15rem" }}>Yayın kontrol listesi</h2>
            <ul className="checklist">
              {checks.map((c) => (
                <li key={c.t} data-ok={c.ok}>
                  {c.t}
                </li>
              ))}
            </ul>
            {prices.length > 1 && (
              <div className="notice">
                <span>
                  Fiyat uyuşmazlığı: {prices.map((x) => tl(x)).join(" / ")}. En düşük fiyat otomatik seçilmez; ofislerle teyit edin.
                </span>
              </div>
            )}
          </section>

          <section className="card" style={{ padding: 0 }}>
            <div style={{ padding: "18px 20px 6px" }}>
              <h2 style={{ fontSize: "1.15rem" }}>İş ortağı bağlantıları</h2>
              <p className="small muted">Her ofisin yetkisi, süresi ve fiyatı ayrı tutulur. Ofisler birbirinin bağlantısını görmez.</p>
            </div>
            <div className="table-wrap">
              <table className="ptable">
                <thead>
                  <tr>
                    <th>Ofis</th>
                    <th>Referans</th>
                    <th>Yetki</th>
                    <th>Geçerlilik</th>
                    <th>EİDS</th>
                    <th className="num">Ofis fiyatı</th>
                  </tr>
                </thead>
                <tbody>
                  {p.links.map((l) => (
                    <tr key={l.id}>
                      <td>{l.partnerName}</td>
                      <td>{l.internalRef}</td>
                      <td>
                        <AuthBadge status={l.authorizationStatus} />
                      </td>
                      <td className="small nowrap">
                        {date(l.authorizedFrom)} – {date(l.authorizedUntil)}
                      </td>
                      <td className="small">{EIDS_STATUS[l.eidsStatus]}</td>
                      <td className="num">{tl(l.partnerAskingPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="stack" style={{ gap: 16 }}>
          <section className="card stack" style={{ gap: 10 }}>
            <h2 style={{ fontSize: "1.05rem" }}>Özet</h2>
            <dl className="kv">
              <dt>Konum</dt>
              <dd>
                {p.neighborhood}, {DISTRICT[p.district]}
              </dd>
              <dt>Tür</dt>
              <dd>{TYPE[p.type]}</dd>
              <dt>Oda</dt>
              <dd>{p.rooms ?? "—"}</dd>
              <dt>Net / brüt</dt>
              <dd>
                {sqm(p.netSqm)} / {sqm(p.grossSqm)}
              </dd>
              <dt>Arsa</dt>
              <dd>{sqm(p.landSqm)}</dd>
              <dt>Fiyat</dt>
              <dd>{tl(p.price)}</dd>
            </dl>
          </section>
          {p.stats && (
            <section className="card stack" style={{ gap: 10 }}>
              <h2 style={{ fontSize: "1.05rem" }}>İlgi (yönetici görünümü)</h2>
              <dl className="kv">
                <dt>Görüntülenme</dt>
                <dd>{p.stats.views}</dd>
                <dt>Favori</dt>
                <dd>{p.stats.favorites}</dd>
                <dt>İlgilenen (ham)</dt>
                <dd>{p.stats.interestedBuyers}</dd>
                <dt>Ofisin gördüğü</dt>
                <dd>{bucketInterested(p.stats.interestedBuyers)}</dd>
              </dl>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
