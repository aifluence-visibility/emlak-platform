import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/panel/Status";
import PreviewAction from "@/components/panel/PreviewAction";
import { requirePreviewAdmin } from "@/lib/previewIdentity";
import { getAppointment, VIEWING_FLOW } from "@/lib/data/admin";
import { VIEWING_STATUS } from "@/lib/labels";

export const metadata: Metadata = { title: "Randevu" };

const dt = (s: string) => new Intl.DateTimeFormat("tr-TR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" }).format(new Date(s));

type Params = Promise<{ id: string }>;

export default async function AppointmentPage({ params }: { params: Params }) {
  await requirePreviewAdmin();
  const a = getAppointment((await params).id);
  if (!a) notFound();
  const idx = VIEWING_FLOW.indexOf(a.status);

  return (
    <>
      <header className="pnl-head">
        <div>
          <p className="small muted">
            <Link href="/admin/randevular">Randevular</Link> / {a.code}
          </p>
          <h1>
            {a.code} · {a.items.length} mülk
          </h1>
          <div className="row" style={{ marginTop: 6 }}>
            <Badge status={a.status} labels={VIEWING_STATUS} />
            <Link href={`/admin/alici-talepleri/${a.request.id}`} className="chip">
              Talep {a.request.code}
            </Link>
          </div>
        </div>
        <div className="row">
          <PreviewAction label="Ofisten teyit iste" done="ofise bildirim gönderilmedi" />
          <PreviewAction label="Programı alıcıya gönder" variant="btn-primary" done="alıcıya mesaj gönderilmedi" />
        </div>
      </header>

      {idx >= 0 && (
        <div className="steps-line" style={{ "--steps": VIEWING_FLOW.length } as React.CSSProperties}>
          {VIEWING_FLOW.map((s, i) => (
            <div key={s} data-state={i < idx ? "done" : i === idx ? "current" : "todo"}>
              {VIEWING_STATUS[s]}
            </div>
          ))}
        </div>
      )}

      <div className="two-col">
        <section className="card" style={{ padding: 0 }}>
          <div style={{ padding: "18px 20px 6px" }}>
            <h2 style={{ fontSize: "1.15rem" }}>Görüntüleme programı</h2>
            <p className="small muted">Alıcının uygunluğu: {a.buyerAvailability}</p>
          </div>
          <div className="table-wrap">
            <table className="ptable">
              <thead>
                <tr>
                  <th>Mülk</th>
                  <th>Ofis</th>
                  <th>Saat</th>
                  <th>Ofis teyidi</th>
                </tr>
              </thead>
              <tbody>
                {a.items.map((i) => (
                  <tr key={i.propertyCode}>
                    <td>
                      <strong>{i.propertyCode}</strong>
                      <div className="small muted">{i.title}</div>
                    </td>
                    <td className="small">{i.partnerName}</td>
                    <td className="small nowrap">{i.slot ? dt(i.slot) : "—"}</td>
                    <td>{i.partnerConfirmed ? <span className="st st-confirmed">Teyit edildi</span> : <span className="st st-awaiting_partner_confirmation">Bekleniyor</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="small muted" style={{ padding: "8px 20px 18px" }}>
            Yolculuk süreleri tahmin edilmez; ofis teyitleri gelince program alıcıya iletilir. Ofislere yalnızca mülk ve saat bildirilir; alıcı
            iletişim bilgisi paylaşılmaz.
          </p>
        </section>
        <aside className="stack" style={{ gap: 16 }}>
          <section className="pii stack" style={{ gap: 6 }}>
            <span className="pii-label">Alıcı · yalnızca yönetici</span>
            <strong>{a.buyer.name}</strong>
            <span className="small">
              {a.buyer.phone} · {a.buyer.email}
            </span>
          </section>
          <section className="card stack" style={{ gap: 12 }}>
            <h2 style={{ fontSize: "1.05rem" }}>Durum geçmişi</h2>
            <ol className="timeline">
              {a.history.map((h, i) => (
                <li key={i}>
                  <strong>{VIEWING_STATUS[h.status]}</strong> · <span className="muted">{dt(h.at)}</span>
                  <div className="small muted">
                    {h.by}
                    {h.note ? ` — ${h.note}` : ""}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </>
  );
}
