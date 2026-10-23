import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/panel/Status";
import { requirePreviewAdmin } from "@/lib/previewIdentity";
import { listAppointments } from "@/lib/data/admin";
import { VIEWING_STATUS } from "@/lib/labels";
import { date } from "@/lib/format";

export const metadata: Metadata = { title: "Randevular" };

const dt = (s: string) => new Intl.DateTimeFormat("tr-TR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" }).format(new Date(s));

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function AppointmentsPage({ searchParams }: { searchParams: SP }) {
  await requirePreviewAdmin();
  const s = (await searchParams).durum;
  const status = typeof s === "string" && s in VIEWING_STATUS ? s : undefined;
  const all = listAppointments();
  const list = status ? all.filter((a) => a.status === status) : all;

  return (
    <>
      <header className="pnl-head">
        <div>
          <h1>Randevular</h1>
          <p>Çoklu mülk görüntüleme talepleri. Ofislerle iletişim ve alıcıya program bildirimi platform ekibi tarafından yapılır.</p>
        </div>
      </header>
      <nav className="row" aria-label="Durum filtresi">
        <Link href="/admin/randevular" className={`chip ${!status ? "chip-dark" : ""}`}>
          Tümü ({all.length})
        </Link>
        {Object.entries(VIEWING_STATUS).map(([k, l]) => {
          const n = all.filter((a) => a.status === k).length;
          return n ? (
            <Link key={k} href={`/admin/randevular?durum=${k}`} className={`chip ${status === k ? "chip-dark" : ""}`}>
              {l} ({n})
            </Link>
          ) : null;
        })}
      </nav>
      <section className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table className="ptable">
            <thead>
              <tr>
                <th>Randevu</th>
                <th>Alıcı</th>
                <th>Mülkler ve saatler</th>
                <th>Durum</th>
                <th>Oluşturma</th>
              </tr>
            </thead>
            <tbody>
              {list.map((a) => (
                <tr key={a.id}>
                  <td>
                    <Link href={`/admin/randevular/${a.id}`}>
                      <strong>{a.code}</strong>
                    </Link>
                    <div className="small muted">{a.request.code}</div>
                  </td>
                  <td>{a.buyer.name}</td>
                  <td className="small">
                    {a.items.map((i) => (
                      <div key={i.propertyCode}>
                        {i.propertyCode} · {i.slot ? dt(i.slot) : <span className="muted">saat bekleniyor</span>}
                        {i.partnerConfirmed ? " ✓" : ""}
                      </div>
                    ))}
                  </td>
                  <td>
                    <Badge status={a.status} labels={VIEWING_STATUS} />
                  </td>
                  <td className="small nowrap">{date(a.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
