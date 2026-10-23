import type { Metadata } from "next";
import { requirePreviewAdmin } from "@/lib/previewIdentity";
import { listAllProperties } from "@/lib/data/admin";
import AdminPropertyTable from "@/components/panel/AdminPropertyTable";

export const metadata: Metadata = { title: "Tüm ilanlar" };

export default async function AllPropertiesPage() {
  await requirePreviewAdmin();
  const rows = listAllProperties();
  return (
    <>
      <header className="pnl-head">
        <div>
          <h1>Tüm ilanlar</h1>
          <p>Kanonik mülkler ve her mülkü temsil eden iş ortakları. Aynı mülkü birden çok ofis temsil edebilir; sitede tek ilan kartı görünür.</p>
        </div>
      </header>
      <section className="card" style={{ padding: 0 }}>
        <AdminPropertyTable rows={rows} />
      </section>
    </>
  );
}
