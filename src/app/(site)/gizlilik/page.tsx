import type { Metadata } from "next";

export const metadata: Metadata = { title: "Gizlilik ve KVKK" };

export default function PrivacyPage() {
  return (
    <div className="container" style={{ maxWidth: 820, paddingBottom: 48 }}>
      <header className="page-head">
        <h1>Gizlilik ve KVKK</h1>
        <p className="lead">Taslak metin. Yayından önce hukuk danışmanı tarafından hazırlanacak aydınlatma metniyle değiştirilecektir.</p>
      </header>
      <div className="prose stack" style={{ gap: 18 }}>
        <section className="stack">
          <h2 style={{ fontSize: "1.3rem" }}>Hangi bilgileri topluyoruz?</h2>
          <p>Talep, bilgi ve randevu formlarında paylaştığınız ad, iletişim bilgisi, kriterleriniz ve mesajınız.</p>
        </section>
        <section className="stack">
          <h2 style={{ fontSize: "1.3rem" }}>Kimler görebilir?</h2>
          <p>
            Yalnızca yetkili platform yöneticileri. İş ortağı emlak ofisleri ve proje geliştiriciler adınızı, telefonunuzu, e-postanızı ve
            talep havuzunu görmez. Bir görüntüleme planlandığında iş ortağına yalnızca ilgili mülk ve onaylanan saat bildirilir.
          </p>
        </section>
        <section className="stack">
          <h2 style={{ fontSize: "1.3rem" }}>Haklarınız</h2>
          <p>Bilgilerinize erişme, düzeltme, silinmesini isteme ve ileti izinlerinizi geri alma hakkınız vardır.</p>
        </section>
        <div className="notice">
          <span>Önizleme sürümünde formlar hiçbir veri kaydetmez veya göndermez.</span>
        </div>
      </div>
    </div>
  );
}
