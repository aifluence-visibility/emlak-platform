import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePreviewPartner } from "@/lib/previewIdentity";
import { listPartnerDevelopments } from "@/lib/data/partner";
import { AVAILABILITY, DEV_STATUS, DISTRICT } from "@/lib/labels";
import { sqm, tl } from "@/lib/format";

export const metadata: Metadata = { title: "Projelerim" };

export default async function PartnerProjects() {
  const partnerId = await requirePreviewPartner();
  const devs = listPartnerDevelopments(partnerId);
  if (!devs.length) notFound();

  return (
    <>
      <header className="pnl-head">
        <div>
          <h1>Projelerim</h1>
          <p>Proje ve birim bilgileri. Satışa açılan her birim kendi yetki ve ilan kurallarıyla ayrıca yayınlanır.</p>
        </div>
      </header>
      {devs.map((d) => (
        <section key={d.id} className="card" style={{ padding: 0 }}>
          <div className="row" style={{ justifyContent: "space-between", padding: "18px 20px 8px" }}>
            <div>
              <h2 style={{ fontSize: "1.3rem" }}>{d.name}</h2>
              <p className="small muted">
                {d.neighborhood}, {DISTRICT[d.district]} · {DEV_STATUS[d.status]} · Teslim: {d.deliveryEstimate}
              </p>
            </div>
            <a className="btn btn-sm btn-light" href={`/projeler/${d.slug}`} target="_blank">
              Sitede gör ↗
            </a>
          </div>
          <div className="table-wrap">
            <table className="ptable">
              <thead>
                <tr>
                  <th>Birim</th>
                  <th>Oda</th>
                  <th>Net</th>
                  <th className="num">Fiyat</th>
                  <th>Durum</th>
                  <th>Aramada ilan</th>
                </tr>
              </thead>
              <tbody>
                {d.units.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.label}</strong>
                    </td>
                    <td>{u.rooms}</td>
                    <td>{sqm(u.netSqm)}</td>
                    <td className="num">{u.price ? tl(u.price) : "—"}</td>
                    <td>{AVAILABILITY[u.availability]}</td>
                    <td>{u.listed ? <span className="st st-published">Yayında</span> : <span className="st st-draft">Yok</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </>
  );
}
