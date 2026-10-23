import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Scene from "@/components/Scene";
import { Badge } from "@/components/panel/Status";
import PreviewAction from "@/components/panel/PreviewAction";
import { requirePreviewAdmin } from "@/lib/previewIdentity";
import { getBuyerRequest } from "@/lib/data/admin";
import { DISTRICT, FEATURE, REQUEST_SOURCE, REQUEST_STATUS, TYPE, VIEWING_STATUS } from "@/lib/labels";
import { date, tl, tlShort } from "@/lib/format";

export const metadata: Metadata = { title: "Alıcı talebi" };

type Params = Promise<{ id: string }>;

export default async function BuyerRequestPage({ params }: { params: Params }) {
  await requirePreviewAdmin();
  const data = getBuyerRequest((await params).id);
  if (!data) notFound();
  const { request: r, buyer: b, matches, appointments, otherRequests } = data;
  const strict = new Set(r.strict);

  return (
    <>
      <header className="pnl-head">
        <div>
          <p className="small muted">
            <Link href="/admin/alici-talepleri">Müşteri havuzu</Link> / {r.code}
          </p>
          <h1>
            {r.code} · {b.name}
          </h1>
          <div className="row" style={{ marginTop: 6 }}>
            <Badge status={r.status} labels={REQUEST_STATUS} />
            <span className="chip">{REQUEST_SOURCE[r.source]}</span>
            {r.citizenship && <span className="chip chip-gold">Vatandaşlık</span>}
          </div>
        </div>
        <div className="row">
          <PreviewAction label="Durumu güncelle" />
          <PreviewAction label="Randevu oluştur" variant="btn-primary" />
        </div>
      </header>

      <div className="two-col">
        <div className="stack" style={{ gap: 20 }}>
          <section className="card stack" style={{ gap: 12 }}>
            <h2 style={{ fontSize: "1.15rem" }}>Kriterler</h2>
            <dl className="kv">
              <dt>Bölge</dt>
              <dd>
                {r.neighborhoods.length ? r.neighborhoods.join(", ") : r.districts.map((d) => DISTRICT[d]).join(", ") || "Fark etmez"}
                {strict.has("bolge") && <span className="chip" style={{ marginLeft: 6 }}>kesin</span>}
              </dd>
              <dt>Bütçe</dt>
              <dd>
                {r.budgetMax ? `En fazla ${tl(r.budgetMax)}` : "Belirtilmedi"}
                {strict.has("butce") && <span className="chip" style={{ marginLeft: 6 }}>kesin</span>}
              </dd>
              <dt>Tür</dt>
              <dd>{r.types.map((t) => TYPE[t]).join(", ") || "Fark etmez"}</dd>
              <dt>Oda</dt>
              <dd>{r.roomsMin ? `${r.roomsMin}+` : "Fark etmez"}</dd>
              <dt>Özellikler</dt>
              <dd>{r.features.map((f) => FEATURE[f]).join(", ") || "—"}</dd>
              <dt>Zamanlama</dt>
              <dd>{r.timing}</dd>
              <dt>Finansman</dt>
              <dd>{r.financing ?? "—"}</dd>
              {r.propertyCodes.length > 0 && (
                <>
                  <dt>İlgilendiği ilanlar</dt>
                  <dd>{r.propertyCodes.join(", ")}</dd>
                </>
              )}
              {r.note && (
                <>
                  <dt>Not</dt>
                  <dd>{r.note}</dd>
                </>
              )}
            </dl>
          </section>

          <section className="stack" style={{ gap: 12 }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <h2 style={{ fontSize: "1.15rem" }}>Uygun ilanlar ({matches.length})</h2>
              <span className="small muted">Yalnızca yayındaki, yetkisi aktif ilanlar · puana göre</span>
            </div>
            {matches.length === 0 ? (
              <div className="empty">Uygun ilan yok. Kriterler gevşetilebilir ya da yeni ilan beklenebilir.</div>
            ) : (
              matches.map((m) => (
                <article key={m.property.id} className="match-row" style={{ gridTemplateColumns: "160px 1fr" }}>
                  <div className="media" style={{ minHeight: 140 }}>
                    <Scene spec={m.property.scene} label="" />
                  </div>
                  <div className="body">
                    <div className="row" style={{ justifyContent: "space-between" }}>
                      <span className={`chip ${m.kind === "tam" ? "chip-ok" : "chip-sea"}`}>
                        {m.kind === "tam" ? "Tam uyum" : "Yakın uyum"} · %{m.score}
                      </span>
                      <Link href={`/admin/portfoyler/${m.property.id}`} className="small" style={{ textDecoration: "underline" }}>
                        {m.property.code}
                      </Link>
                    </div>
                    <strong>{m.property.title}</strong>
                    <ul className="reasons reasons-compact">
                      {m.reasons.map((x, i) => (
                        <li key={i} data-t={x.t}>
                          {x.m}
                        </li>
                      ))}
                    </ul>
                    <span className="pcard-price" style={{ fontSize: "1.1rem" }}>
                      {tlShort(m.property.price)}
                    </span>
                  </div>
                </article>
              ))
            )}
          </section>
        </div>

        <aside className="stack" style={{ gap: 16 }}>
          <section className="pii stack" style={{ gap: 8 }}>
            <span className="pii-label">Kişisel bilgi · yalnızca yönetici</span>
            <dl className="kv">
              <dt>Ad</dt>
              <dd>{b.name}</dd>
              <dt>Telefon</dt>
              <dd>{b.phone}</dd>
              <dt>E-posta</dt>
              <dd>{b.email}</dd>
              <dt>Uyruk</dt>
              <dd>{b.nationality ?? "—"}</dd>
              <dt>Dil</dt>
              <dd>{b.language.toUpperCase()}</dd>
              <dt>KVKK rızası</dt>
              <dd>
                {date(b.consentAt)} · {b.consentVersion}
              </dd>
              <dt>Pazarlama izni</dt>
              <dd>{b.marketingOptIn ? "Var" : "Yok"}</dd>
            </dl>
            <p className="small muted">Canlıda bu kutunun her görüntülenmesi denetim kaydına yazılır.</p>
          </section>

          <section className="card stack" style={{ gap: 10 }}>
            <h2 style={{ fontSize: "1.05rem" }}>Randevular</h2>
            {appointments.length === 0 ? (
              <p className="small muted">Henüz randevu yok.</p>
            ) : (
              appointments.map((a) => (
                <Link key={a.id} href={`/admin/randevular/${a.id}`} className="row" style={{ justifyContent: "space-between" }}>
                  <span>
                    <strong>{a.code}</strong> · {a.items.length} mülk
                  </span>
                  <Badge status={a.status} labels={VIEWING_STATUS} />
                </Link>
              ))
            )}
          </section>

          {otherRequests.length > 0 && (
            <section className="card stack" style={{ gap: 10 }}>
              <h2 style={{ fontSize: "1.05rem" }}>Alıcının diğer talepleri</h2>
              {otherRequests.map((o) => (
                <Link key={o.id} href={`/admin/alici-talepleri/${o.id}`} className="row" style={{ justifyContent: "space-between" }}>
                  <strong>{o.code}</strong>
                  <Badge status={o.status} labels={REQUEST_STATUS} />
                </Link>
              ))}
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
