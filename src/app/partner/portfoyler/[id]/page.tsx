import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Scene from "@/components/Scene";
import ListingForm from "@/components/panel/ListingForm";
import { AuthBadge, StatusBadge } from "@/components/panel/Status";
import { requirePreviewPartner } from "@/lib/previewIdentity";
import { getPartnerListing } from "@/lib/data/partner";
import { statsCutoff } from "@/lib/stats";
import { EIDS_STATUS, LIFECYCLE, STATUS } from "@/lib/labels";
import { date, tl } from "@/lib/format";

export const metadata: Metadata = { title: "İlan" };

type Params = Promise<{ id: string }>;

export default async function PartnerListingPage({ params }: { params: Params }) {
  const partnerId = await requirePreviewPartner();
  // Başka partnerin ilanı → 404 (varlığı da sızdırılmaz)
  const l = getPartnerListing(partnerId, (await params).id);
  if (!l) notFound();

  const idx = LIFECYCLE.indexOf(l.status as (typeof LIFECYCLE)[number]);
  const closed = idx === -1;

  return (
    <>
      <header className="pnl-head">
        <div className="row" style={{ gap: 16, alignItems: "center" }}>
          <span className="thumb" style={{ width: 96, height: 68 }}>
            <Scene spec={l.scene} label="" />
          </span>
          <div>
            <p className="small muted">
              <Link href="/partner/portfoyler">Portföyüm</Link> / {l.code}
            </p>
            <h1 style={{ fontSize: "1.7rem" }}>{l.title}</h1>
            <div className="row" style={{ marginTop: 6 }}>
              <StatusBadge status={l.status} />
              <AuthBadge status={l.link.authorizationStatus} />
            </div>
          </div>
        </div>
        {l.status === "published" && (
          <Link href={`/satilik/${l.slug}`} className="btn btn-light" target="_blank">
            Sitede gör ↗
          </Link>
        )}
      </header>

      <section className="stack" style={{ gap: 10 }}>
        <h2 style={{ fontSize: "1.1rem" }}>Yayın süreci</h2>
        {closed ? (
          <div className="notice">
            <span>
              İlan “{STATUS[l.status]}” durumunda; aramada ve eşleştirmede görünmez.
            </span>
          </div>
        ) : (
          <div className="steps-line">
            {LIFECYCLE.map((s, i) => (
              <div key={s} data-state={i < idx ? "done" : i === idx ? "current" : "todo"}>
                {STATUS[s]}
              </div>
            ))}
          </div>
        )}
      </section>

      {l.stats && (
        <section className="stack" style={{ gap: 10 }}>
          <h2 style={{ fontSize: "1.1rem" }}>İlgi istatistikleri</h2>
          <div className="tiles">
            <div className="tile">
              <span>Görüntülenme</span>
              <strong>{l.stats.views.toLocaleString("tr-TR")}</strong>
              <small>Tekil kişi-gün</small>
            </div>
            <div className="tile">
              <span>Favoriye eklenme</span>
              <strong>{l.stats.favorites}</strong>
              <small>Şu an favorisinde tutan</small>
            </div>
            <div className="tile">
              <span>İlgilenen alıcı</span>
              <strong>{l.stats.interested}</strong>
              <small>Bilgi/randevu talebi, tekil</small>
            </div>
          </div>
          <p className="small muted">
            {date(statsCutoff())} sonuna kadar · anonim ve toplulaştırılmış. Alıcıların kimliği, iletişim bilgileri, kriterleri ve randevuları
            platform ekibindedir; görüntüleme gerekirse ekip sizinle iletişime geçer.
          </p>
        </section>
      )}

      <div className="two-col">
        <section className="stack" style={{ gap: 10 }}>
          <h2 style={{ fontSize: "1.1rem" }}>İlanı düzenle</h2>
          <ListingForm
            status={l.status}
            initial={{
              title: l.title,
              district: l.district,
              neighborhood: l.neighborhood,
              type: l.type,
              price: l.price,
              rooms: l.rooms,
              grossSqm: l.grossSqm,
              netSqm: l.netSqm,
              landSqm: l.landSqm,
              buildingAge: l.buildingAge,
              floor: l.floor,
              bathrooms: l.bathrooms,
              titleDeed: l.titleDeed,
              summary: l.summary,
              features: l.features,
              internalRef: l.link.internalRef,
            }}
          />
        </section>
        <aside className="card stack" style={{ gap: 14, position: "sticky", top: 20 }}>
          <h2 style={{ fontSize: "1.1rem" }}>Yetki kaydınız</h2>
          <dl className="kv">
            <dt>Ofis referansı</dt>
            <dd>{l.link.internalRef}</dd>
            <dt>Yetki</dt>
            <dd>
              <AuthBadge status={l.link.authorizationStatus} />
            </dd>
            <dt>Geçerlilik</dt>
            <dd>
              {date(l.link.authorizedFrom)} – {date(l.link.authorizedUntil)}
            </dd>
            <dt>EİDS</dt>
            <dd>{EIDS_STATUS[l.link.eidsStatus]}</dd>
            <dt>Talep ettiğiniz fiyat</dt>
            <dd>{tl(l.link.partnerAskingPrice)}</dd>
          </dl>
          <p className="small muted">Yetki süresi dolan ilan otomatik olarak yayından ve eşleştirmeden çıkar.</p>
        </aside>
      </div>
    </>
  );
}
