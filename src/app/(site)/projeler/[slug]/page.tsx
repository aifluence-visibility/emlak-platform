import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Scene from "@/components/Scene";
import InquiryForm from "@/components/InquiryForm";
import { getPublicDevelopment } from "@/lib/data/public";
import { AVAILABILITY, DEV_STATUS, DISTRICT } from "@/lib/labels";
import { sqm, tl, tlShort } from "@/lib/format";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const r = getPublicDevelopment((await params).slug);
  return { title: r ? r.development.name : "Proje bulunamadı" };
}

export default async function ProjectPage({ params }: { params: Params }) {
  const r = getPublicDevelopment((await params).slug);
  if (!r) notFound();
  const { development: d, units } = r;

  return (
    <div className="container">
      <header className="page-head" style={{ paddingBottom: 20 }}>
        <nav className="crumbs" aria-label="Konum">
          <Link href="/">Ana sayfa</Link>
          <span>/</span>
          <Link href="/projeler">Yeni Projeler</Link>
          <span>/</span>
          <span>{d.name}</span>
        </nav>
        <div className="row">
          <span className="chip chip-sea">{DEV_STATUS[d.status]}</span>
          <span className="chip">Teslim: {d.deliveryEstimate}</span>
        </div>
        <h1 style={{ marginTop: 10 }}>{d.name}</h1>
        <p className="muted">
          {d.neighborhood}, {DISTRICT[d.district]} · Geliştirici: {d.developerLabel}
        </p>
      </header>

      <div className="gallery">
        {d.mediaKinds.slice(0, 5).map((kind, i) => (
          <div key={i}>
            <Scene spec={d.scene} view={i === 0 ? 0 : i === 1 ? 3 : i === 2 ? 1 : 4} label={`${d.name} görsel ${i + 1}`} />
            <span className="chip chip-dark">{kind === "render" ? "Görselleştirme (render)" : "Fotoğraf"} · temsilî</span>
          </div>
        ))}
      </div>

      <div className="detail-layout">
        <div className="stack" style={{ gap: 36 }}>
          <section className="stack" style={{ gap: 12 }}>
            <h2 style={{ fontSize: "1.5rem" }}>Proje hakkında</h2>
            <p className="lead" style={{ fontSize: "1.05rem" }}>
              {d.concept}
            </p>
            <div className="prose">
              <p>{d.description}</p>
            </div>
            <div className="amenities">
              {d.amenities.map((a) => (
                <span key={a} className="chip">
                  {a}
                </span>
              ))}
            </div>
          </section>

          <section className="stack" style={{ gap: 12 }}>
            <h2 style={{ fontSize: "1.5rem" }}>Daire tipleri ve satıştaki birimler</h2>
            <div className="card table-wrap" style={{ padding: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Birim</th>
                    <th>Oda</th>
                    <th>Net / Brüt</th>
                    <th>Fiyat</th>
                    <th>Durum</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {units.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <strong>{u.label}</strong>
                      </td>
                      <td>{u.rooms}</td>
                      <td>
                        {sqm(u.netSqm)} / {sqm(u.grossSqm)}
                      </td>
                      <td>{u.availability === "sold" ? "—" : tl(u.price)}</td>
                      <td>
                        <span className={`chip ${u.availability === "available" ? "chip-ok" : u.availability === "reserved" ? "chip-warn" : ""}`}>
                          {AVAILABILITY[u.availability]}
                        </span>
                      </td>
                      <td>
                        {u.propertySlug && (
                          <Link href={`/satilik/${u.propertySlug}`} className="btn btn-sm btn-light">
                            İlan
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="small muted">
              “İlan” bağlantısı olan birimler, kendi yetki ve ilan kurallarını tamamlayıp ayrıca yayınlanmıştır ve aramada da görünür (aynı
              kayıt, mükerrer ilan yok).
            </p>
          </section>

          {d.paymentPlan && (
            <section className="stack" style={{ gap: 12 }}>
              <h2 style={{ fontSize: "1.5rem" }}>Ödeme planı</h2>
              <p className="prose">{d.paymentPlan}</p>
            </section>
          )}

          <div className="notice">
            <span>
              Teslim tarihi geliştiricinin tahminidir, taahhüt değildir. Görseller temsilîdir; görselleştirme (render) ve gerçek fotoğraf
              ayrımı her görselde belirtilir.
            </span>
          </div>
        </div>

        <aside className="side">
          <div className="card stack" style={{ gap: 16 }}>
            <div>
              <p className="small muted">Başlangıç fiyatı</p>
              <p className="price-xl">{d.priceFrom ? tlShort(d.priceFrom) : "Bilgi alın"}</p>
              <p className="small muted">
                {d.availableCount} / {d.unitCount} birim satışta
              </p>
            </div>
            <InquiryForm codes={[`PRJ:${d.slug}`]} />
          </div>
        </aside>
      </div>
    </div>
  );
}
