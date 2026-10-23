import type { Metadata } from "next";
import PreviewAction from "@/components/panel/PreviewAction";
import { requirePreviewAdmin } from "@/lib/previewIdentity";
import { listPartnersAdmin } from "@/lib/data/admin";
import { DISTRICT } from "@/lib/labels";
import { date } from "@/lib/format";

export const metadata: Metadata = { title: "İş ortakları" };

export default async function PartnersAdminPage() {
  await requirePreviewAdmin();
  const list = listPartnersAdmin();
  return (
    <>
      <header className="pnl-head">
        <div>
          <h1>İş ortakları</h1>
          <p>Yalnızca davet edilen ve doğrulanan ofisler panele erişebilir. Genel kayıt yoktur.</p>
        </div>
        <PreviewAction label="+ Ofis davet et" variant="btn-primary" done="davet gönderilmedi" />
      </header>
      <section className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table className="ptable">
            <thead>
              <tr>
                <th>Ofis</th>
                <th>Bölge</th>
                <th>Durum</th>
                <th className="num">İlan</th>
                <th className="num">Yayında</th>
                <th className="num">Aktif yetki</th>
                <th className="num">Proje</th>
                <th>Katılım</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.name}</strong>
                  </td>
                  <td>{DISTRICT[p.district]}</td>
                  <td>
                    <span className={`st st-${p.status === "active" ? "active" : "pending"}`}>{p.status === "active" ? "Aktif" : p.status}</span>
                  </td>
                  <td className="num">{p.listingCount}</td>
                  <td className="num">{p.published}</td>
                  <td className="num">{p.activeAuth}</td>
                  <td className="num">{p.developments || "—"}</td>
                  <td className="small nowrap">{date(p.joinedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <p className="small muted">
        İş birliği, yetki ve komisyon/yönlendirme sözleşmeleri ayrıca yazılı olarak yapılır; EİDS yetkisi tek başına ticari hak doğurmaz. Sözleşme
        modülü sonraki aşamada eklenecek.
      </p>
    </>
  );
}
