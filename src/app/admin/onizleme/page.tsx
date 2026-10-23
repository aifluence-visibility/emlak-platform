import type { Metadata } from "next";
import Link from "next/link";
import { enterAdminPreview } from "../actions";

export const metadata: Metadata = { title: "Yönetici önizlemesi" };

export default function AdminPreviewGate() {
  return (
    <div className="container" style={{ maxWidth: 640, padding: "64px var(--gutter)" }}>
      <div className="card stack" style={{ gap: 16 }}>
        <span className="eyebrow">Önizleme</span>
        <h1 style={{ fontSize: "1.9rem" }}>Yönetici paneli önizlemesi</h1>
        <p className="muted">
          Bu bir giriş ekranı <strong>değildir</strong>. Önizlemede bu sayfaya ulaşan herkes yönetici görünümünü açabilir; içerideki tüm alıcılar ve
          kişisel bilgiler <strong>kurgusaldır</strong>. Canlı sürümde yönetici paneli yalnızca doğrulanmış platform yöneticisi hesabıyla açılır ve alıcı
          bilgisi görüntülemeleri denetim kaydına yazılır.
        </p>
        <form action={enterAdminPreview}>
          <button className="btn btn-primary">Yönetici önizlemesini aç</button>
        </form>
        <p className="small muted">
          <Link href="/" style={{ textDecoration: "underline" }}>
            Siteye dön
          </Link>
        </p>
      </div>
    </div>
  );
}
