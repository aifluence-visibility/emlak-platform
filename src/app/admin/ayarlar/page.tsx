import type { Metadata } from "next";
import { requirePreviewAdmin } from "@/lib/previewIdentity";
import { DEFAULT_WEIGHTS } from "@/lib/matching";
import WeightsForm from "./WeightsForm";

export const metadata: Metadata = { title: "Ayarlar" };

export default async function SettingsPage() {
  await requirePreviewAdmin();
  return (
    <>
      <header className="pnl-head">
        <div>
          <h1>Ayarlar</h1>
          <p>Eşleştirme ağırlıkları ve iş ortağı istatistik kuralları</p>
        </div>
      </header>
      <div className="two-col">
        <WeightsForm initial={DEFAULT_WEIGHTS} />
        <section className="card stack" style={{ gap: 12 }}>
          <h2 style={{ fontSize: "1.15rem" }}>İş ortağı istatistikleri</h2>
          <dl className="kv">
            <dt>Gecikme</dt>
            <dd>Önceki gün sonuna kadar (günlük)</dd>
            <dt>Görüntülenme</dt>
            <dd>Tekil kişi-gün</dd>
            <dt>Favori</dt>
            <dd>Kişinin son durumu</dd>
            <dt>İlgilenen alıcı</dt>
            <dd>Tekil kişi; 1–2 → “1–2”</dd>
            <dt>Kapsam</dt>
            <dd>Yalnızca ofisin kendi ilanları</dd>
          </dl>
          <p className="small muted">Bu kurallar sahip kararıyla sabittir; değiştirmek için kod ve RLS güncellemesi gerekir.</p>
        </section>
      </div>
    </>
  );
}
