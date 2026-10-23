import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/panel/Status";
import PreviewAction from "@/components/panel/PreviewAction";
import { requirePreviewAdmin } from "@/lib/previewIdentity";
import { listCitizenshipReviews } from "@/lib/data/admin";
import { CIT_CHECK, CIT_STATUS } from "@/lib/labels";
import { date, tl } from "@/lib/format";

export const metadata: Metadata = { title: "Vatandaşlık inceleme" };

export default async function CitizenshipReviewPage() {
  await requirePreviewAdmin();
  const list = listCitizenshipReviews();
  return (
    <>
      <header className="pnl-head">
        <div>
          <h1>Vatandaşlık ön incelemesi</h1>
          <p>
            Bir mülk koleksiyonda yalnızca <strong>“Ön uygun”</strong> durumunda <strong>ve</strong> sizin onayınızla görünür. Fiyat tek başına yeterli
            değildir; sabit bir eşik kodlanmaz, güncel mevzuat kontrol listesiyle değerlendirilir.
          </p>
        </div>
      </header>
      <div className="stack" style={{ gap: 14 }}>
        {list.map((c) => {
          const done = Object.values(c.checklist).filter(Boolean).length;
          const total = Object.keys(c.checklist).length;
          const visible = c.status === "preliminarily_eligible" && c.adminApproved;
          return (
            <section key={c.propertyId} className="card stack" style={{ gap: 12 }}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div>
                  <Link href={`/admin/portfoyler/${c.propertyId}`}>
                    <strong>
                      {c.property.code} · {c.property.title}
                    </strong>
                  </Link>
                  <div className="small muted">
                    {tl(c.property.price)} · kontrol {done}/{total}
                    {c.expiresAt && ` · inceleme geçerliliği ${date(c.expiresAt)}`}
                  </div>
                </div>
                <div className="row">
                  <Badge status={c.status} labels={CIT_STATUS} />
                  {visible ? <span className="st st-published">Koleksiyonda</span> : <span className="st st-draft">Koleksiyonda değil</span>}
                </div>
              </div>
              <ul className="checklist" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))" }}>
                {Object.entries(c.checklist).map(([k, ok]) => (
                  <li key={k} data-ok={ok}>
                    {CIT_CHECK[k]}
                  </li>
                ))}
              </ul>
              {c.note && <p className="small muted">Not: {c.note}</p>}
              <div className="row">
                {c.status === "preliminarily_eligible" && !c.adminApproved && (
                  <PreviewAction label="Onayla — koleksiyona al" variant="btn-ok" done="koleksiyon değişmedi" />
                )}
                {c.adminApproved && <PreviewAction label="Onayı geri al" variant="btn-danger" done="koleksiyon değişmedi" />}
                <PreviewAction label="Belge iste" done="ofise bildirim gönderilmedi" />
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
