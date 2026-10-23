import type { Metadata } from "next";
import ListingForm from "@/components/panel/ListingForm";
import { requirePreviewPartner } from "@/lib/previewIdentity";

export const metadata: Metadata = { title: "Yeni ilan" };

export default async function NewListingPage() {
  await requirePreviewPartner();
  return (
    <>
      <header className="pnl-head">
        <div>
          <h1>Yeni ilan</h1>
          <p>İlan önce taslak olarak oluşur. Belgeler, EİDS doğrulaması ve yönetici onayı tamamlanınca yayına çıkar.</p>
        </div>
      </header>
      <div style={{ maxWidth: 920 }}>
        <ListingForm />
      </div>
    </>
  );
}
