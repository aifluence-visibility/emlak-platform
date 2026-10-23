import type { Metadata } from "next";
import { requirePreviewPartner } from "@/lib/previewIdentity";
import { getPartnerAvailability } from "@/lib/data/partner";
import AvailabilityForm from "./AvailabilityForm";

export const metadata: Metadata = { title: "Gösterim müsaitliği" };

export default async function AvailabilityPage() {
  const partnerId = await requirePreviewPartner();
  return (
    <>
      <header className="pnl-head">
        <div>
          <h1>Gösterim müsaitliği</h1>
          <p>Mülklerinizi hangi gün ve saatlerde gösterebileceğinizi bildirin. Platform ekibi görüntülemeleri buna göre planlar.</p>
        </div>
      </header>
      <div className="notice notice-sea">
        <span>
          Görüntüleme talepleri ve randevular platform ekibi tarafından yönetilir. Alıcı bilgileri ve randevu ayrıntıları bu panelde gösterilmez;
          bir gösterim gerektiğinde ekip sizinle doğrudan iletişime geçer.
        </span>
      </div>
      <div style={{ maxWidth: 720 }}>
        <AvailabilityForm initial={getPartnerAvailability(partnerId)} />
      </div>
    </>
  );
}
