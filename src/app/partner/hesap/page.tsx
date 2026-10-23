import type { Metadata } from "next";
import { requirePreviewPartner } from "@/lib/previewIdentity";
import { getPartnerOrg, getPartnerStaff } from "@/lib/data/partner";
import { DISTRICT } from "@/lib/labels";
import { date } from "@/lib/format";

export const metadata: Metadata = { title: "Hesap" };

const ROLE = { owner: "Ofis sahibi", manager: "Yönetici", staff: "Danışman" } as const;

export default async function AccountPage() {
  const partnerId = await requirePreviewPartner();
  const org = getPartnerOrg(partnerId)!;
  const staff = getPartnerStaff(partnerId);
  return (
    <>
      <header className="pnl-head">
        <div>
          <h1>Hesap</h1>
          <p>Ofis bilgileri ve kullanıcılar</p>
        </div>
      </header>
      <div className="two-col">
        <section className="card stack" style={{ gap: 14 }}>
          <h2 style={{ fontSize: "1.15rem" }}>Ofis</h2>
          <dl className="kv">
            <dt>Ad</dt>
            <dd>{org.name}</dd>
            <dt>Bölge</dt>
            <dd>{DISTRICT[org.district]}</dd>
            <dt>Durum</dt>
            <dd>
              <span className="st st-active">Aktif iş ortağı</span>
            </dd>
            <dt>Ortaklık başlangıcı</dt>
            <dd>{date(org.joinedAt)}</dd>
          </dl>
          <p className="small muted">İş ortaklığı davetle yapılır. Sözleşme ve ticari koşullar platform yönetimiyle ayrıca düzenlenir.</p>
        </section>
        <section className="card stack" style={{ gap: 14 }}>
          <h2 style={{ fontSize: "1.15rem" }}>Kullanıcılar</h2>
          <ul className="stack" style={{ listStyle: "none", padding: 0, margin: 0, gap: 8 }}>
            {staff.map((s) => (
              <li key={s.name} className="row" style={{ justifyContent: "space-between" }}>
                <span>{s.name}</span>
                <span className="chip">{ROLE[s.role]}</span>
              </li>
            ))}
          </ul>
          <button className="btn btn-light" disabled title="Önizlemede devre dışı">
            Kullanıcı davet et (canlıda)
          </button>
        </section>
      </div>
    </>
  );
}
