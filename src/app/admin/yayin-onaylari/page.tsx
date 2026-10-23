import type { Metadata } from "next";
import { requirePreviewAdmin } from "@/lib/previewIdentity";
import { approvalQueue } from "@/lib/data/admin";
import AdminPropertyTable from "@/components/panel/AdminPropertyTable";

export const metadata: Metadata = { title: "Yayın onayları" };

export default async function ApprovalsPage() {
  await requirePreviewAdmin();
  const rows = approvalQueue();
  return (
    <>
      <header className="pnl-head">
        <div>
          <h1>Yayın onayları</h1>
          <p>Yetki belgesi, EİDS doğrulaması ve içerik incelemesi tamamlanmadan hiçbir ilan yayına ve eşleştirmeye girmez.</p>
        </div>
      </header>
      <div className="notice">
        <span>
          EİDS resmî entegrasyonu henüz doğrulanmadı. Bu ekrandaki EİDS durumları <strong>simülasyondur</strong>; canlıya simüle doğrulamayla çıkılmaz.
        </span>
      </div>
      <section className="card" style={{ padding: 0 }}>
        {rows.length ? <AdminPropertyTable rows={rows} showStats={false} /> : <div className="empty" style={{ border: 0 }}>Onay bekleyen ilan yok.</div>}
      </section>
    </>
  );
}
