import Link from "next/link";
import { Badge } from "@/components/panel/Status";
import { requirePreviewAdmin } from "@/lib/previewIdentity";
import { adminDashboard } from "@/lib/data/admin";
import { REQUEST_SOURCE, VIEWING_STATUS } from "@/lib/labels";
import { date } from "@/lib/format";

const dt = (s: string) => new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(s));

export default async function AdminHome() {
  await requirePreviewAdmin();
  const d = adminDashboard();
  return (
    <>
      <header className="pnl-head">
        <div>
          <h1>Yönetici özeti</h1>
          <p>Bugün ilgilenmeniz gerekenler</p>
        </div>
      </header>

      <div className="tiles">
        <Link href="/admin/alici-talepleri?durum=acik" className="tile">
          <span>Açık alıcı talebi</span>
          <strong>{d.openRequests}</strong>
          <small>{d.newRequests.length} yeni</small>
        </Link>
        <Link href="/admin/randevular" className="tile">
          <span>Aktif randevu süreci</span>
          <strong>{d.upcoming.length}</strong>
          <small>Talep → onay arası</small>
        </Link>
        <Link href="/admin/yayin-onaylari" className="tile">
          <span>Yayın onayı bekleyen</span>
          <strong>{d.pendingApprovals}</strong>
          <small>EİDS + yönetici incelemesi</small>
        </Link>
        <Link href="/admin/vatandaslik-inceleme" className="tile">
          <span>Vatandaşlık onayı bekleyen</span>
          <strong>{d.citizenshipPending}</strong>
          <small>{d.published} yayında ilan</small>
        </Link>
      </div>

      <div className="two-col">
        <section className="card" style={{ padding: 0 }}>
          <div className="row" style={{ justifyContent: "space-between", padding: "18px 20px 6px" }}>
            <h2 style={{ fontSize: "1.2rem" }}>Yeni alıcı talepleri</h2>
            <Link href="/admin/alici-talepleri" className="btn btn-sm btn-light">
              Müşteri havuzu
            </Link>
          </div>
          <div className="table-wrap">
            <table className="ptable">
              <tbody>
                {d.newRequests.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link href={`/admin/alici-talepleri/${r.id}`}>
                        <strong>{r.code}</strong> · {r.buyer.name}
                      </Link>
                      <div className="small muted">{REQUEST_SOURCE[r.source]}</div>
                    </td>
                    <td className="small">{r.matchCount} uygun ilan</td>
                    <td className="small muted nowrap">{date(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="card" style={{ padding: 0 }}>
          <div className="row" style={{ justifyContent: "space-between", padding: "18px 20px 6px" }}>
            <h2 style={{ fontSize: "1.2rem" }}>Randevu süreçleri</h2>
            <Link href="/admin/randevular" className="btn btn-sm btn-light">
              Tümü
            </Link>
          </div>
          <div className="table-wrap">
            <table className="ptable">
              <tbody>
                {d.upcoming.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <Link href={`/admin/randevular/${a.id}`}>
                        <strong>{a.code}</strong> · {a.items.length} mülk
                      </Link>
                      <div className="small muted">{a.items.find((i) => i.slot) ? dt(a.items.find((i) => i.slot)!.slot!) : a.buyerAvailability}</div>
                    </td>
                    <td>
                      <Badge status={a.status} labels={VIEWING_STATUS} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="card stack" style={{ gap: 10 }}>
        <h2 style={{ fontSize: "1.2rem" }}>Son denetim kayıtları</h2>
        <ul className="stack small" style={{ listStyle: "none", padding: 0, margin: 0, gap: 6 }}>
          {d.audit.map((e, i) => (
            <li key={i} className="row" style={{ justifyContent: "space-between" }}>
              <span>
                <strong>{e.action}</strong> · {e.target}
              </span>
              <span className="muted">
                {e.actor} · {dt(e.at)}
              </span>
            </li>
          ))}
        </ul>
        <p className="small muted">Canlıda alıcı bilgisi görüntüleme, dışa aktarma, yayın ve sözleşme değişiklikleri otomatik olarak kaydedilir.</p>
      </section>
    </>
  );
}
