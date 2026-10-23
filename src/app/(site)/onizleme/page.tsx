import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Önizleme hakkında" };

export default function PreviewInfo() {
  return (
    <div className="container" style={{ maxWidth: 820, paddingBottom: 48 }}>
      <header className="page-head">
        <h1>Bu bir önizleme sürümüdür</h1>
        <p className="lead">Tasarım ve akışları değerlendirmek için hazırlanmıştır. Gerçek bir hizmet sunmaz.</p>
      </header>
      <ul className="reasons" style={{ gap: 12 }}>
        <li data-t="warn">Tüm ilanlar, projeler, ofis adları ve kişiler kurgusaldır.</li>
        <li data-t="warn">Görseller kodla üretilmiş temsilî çizimlerdir; gerçek mülkleri göstermez.</li>
        <li data-t="warn">Formlar hiçbir veri kaydetmez veya göndermez.</li>
        <li data-t="warn">Gerçek kullanıcı girişi ve veritabanı güvenliği (RLS) henüz devrede değildir.</li>
        <li data-t="warn">“Belgeyle doğrulandı” ve EİDS durumları örnektir; gerçek bir doğrulama yapılmamıştır.</li>
        <li data-t="ok">Favoriler ve karşılaştırma yalnızca bu tarayıcıda saklanır.</li>
      </ul>
      <p style={{ marginTop: 24 }}>
        <Link href="/" className="btn btn-primary">
          Ana sayfaya dön
        </Link>
      </p>
    </div>
  );
}
