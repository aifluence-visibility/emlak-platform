import type { Metadata } from "next";
import Link from "next/link";
import Scene from "@/components/Scene";
import { AuthBadge, StatusBadge } from "@/components/panel/Status";
import { requirePreviewPartner } from "@/lib/previewIdentity";
import { listPartnerPortfolio } from "@/lib/data/partner";
import { statsCutoff } from "@/lib/stats";
import { date, tlShort } from "@/lib/format";
import { TYPE } from "@/lib/labels";

export const metadata: Metadata = { title: "Portföyüm" };

const TABS = [
  { key: "tumu", label: "Tümü", test: () => true },
  { key: "yayinda", label: "Yayında", test: (s: string) => s === "published" },
  { key: "hazirlik", label: "Hazırlıkta", test: (s: string) => s === "draft" || s.startsWith("pending_") },
  { key: "kapali", label: "Kapanmış", test: (s: string) => ["paused", "expired", "sold", "archived"].includes(s) },
] as const;

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function PortfolioPage({ searchParams }: { searchParams: SP }) {
  const partnerId = await requirePreviewPartner();
  const tabKey = (await searchParams).durum;
  const tab = TABS.find((t) => t.key === tabKey) ?? TABS[0];
  const all = listPartnerPortfolio(partnerId);
  const list = all.filter((l) => tab.test(l.status));

  return (
    <>
      <header className="pnl-head">
        <div>
          <h1>Portföyüm</h1>
          <p>Yalnızca ofisinize ait ilanlar. İstatistikler {date(statsCutoff())} sonuna kadar.</p>
        </div>
        <Link href="/partner/portfoyler/yeni" className="btn btn-primary">
          + Yeni ilan
        </Link>
      </header>

      <nav className="lang-switch" aria-label="Durum filtresi" style={{ justifySelf: "start" }}>
        {TABS.map((t) => (
          <Link key={t.key} href={t.key === "tumu" ? "/partner/portfoyler" : `/partner/portfoyler?durum=${t.key}`} aria-current={t.key === tab.key}>
            {t.label} ({all.filter((l) => t.test(l.status)).length})
          </Link>
        ))}
      </nav>

      <section className="card" style={{ padding: 0 }}>
        {list.length === 0 ? (
          <div className="empty" style={{ border: 0 }}>
            Bu durumda ilanınız yok.
          </div>
        ) : (
          <div className="table-wrap">
            <table className="ptable">
              <thead>
                <tr>
                  <th>İlan</th>
                  <th>Durum</th>
                  <th>Yetki</th>
                  <th className="num">Fiyat</th>
                  <th className="num" title="Tekil kişi-gün görüntülemesi">Görüntülenme</th>
                  <th className="num" title="Şu an favorisinde tutan tekil kişi">Favori</th>
                  <th className="num" title="Bilgi veya randevu talebi gönderen tekil kişi">İlgilenen alıcı</th>
                </tr>
              </thead>
              <tbody>
                {list.map((l) => (
                  <tr key={l.propertyId}>
                    <td>
                      <Link href={`/partner/portfoyler/${l.propertyId}`} className="cell-title">
                        <span className="thumb">
                          <Scene spec={l.scene} label="" />
                        </span>
                        <span>
                          <strong>{l.title}</strong>
                          <small>
                            {l.code} · {l.link.internalRef} · {TYPE[l.type]} · {l.neighborhood}
                          </small>
                        </span>
                      </Link>
                    </td>
                    <td>
                      <StatusBadge status={l.status} />
                    </td>
                    <td className="nowrap">
                      <AuthBadge status={l.link.authorizationStatus} />
                      <div className="small muted">{date(l.link.authorizedUntil)}&apos;e kadar</div>
                    </td>
                    <td className="num">{tlShort(l.price)}</td>
                    <td className="num">{l.stats ? l.stats.views.toLocaleString("tr-TR") : "—"}</td>
                    <td className="num">{l.stats ? l.stats.favorites : "—"}</td>
                    <td className="num">
                      <strong>{l.stats ? l.stats.interested : "—"}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <p className="small muted">
        “—”: ilan yayında olmadığı için istatistik yok. İlgilenen alıcı 1 veya 2 ise “1–2” olarak gösterilir. Tüm sayılar anonim ve
        tekilleştirilmiştir; alıcı kimliği, kriterleri, talepleri ve randevuları bu panelde yer almaz.
      </p>
    </>
  );
}
