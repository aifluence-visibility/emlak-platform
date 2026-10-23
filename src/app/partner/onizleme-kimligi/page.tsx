import type { Metadata } from "next";
import Link from "next/link";
import { previewPartnerChoices } from "@/lib/data/partner";
import { choosePreviewPartner } from "../actions";

export const metadata: Metadata = { title: "Önizleme kimliği" };

export default function PreviewIdentityPage() {
  const choices = previewPartnerChoices();
  return (
    <div className="container" style={{ maxWidth: 640, padding: "64px var(--gutter)" }}>
      <div className="card stack" style={{ gap: 18 }}>
        <span className="eyebrow">Önizleme</span>
        <h1 style={{ fontSize: "1.9rem" }}>Paneli hangi örnek ofis gözünden görmek istersiniz?</h1>
        <p className="muted">
          Bu bir giriş ekranı <strong>değildir</strong>. Gerçek kullanıcı girişi ve veri güvenliği Supabase aşamasında eklenecek. Burada yalnızca
          her ofisin kendi portföyünü gördüğünü ve diğer ofisleri göremediğini denemek için kurgusal bir ofis seçersiniz.
        </p>
        <form action={choosePreviewPartner} className="stack" style={{ gap: 10 }}>
          {choices.map((c, i) => (
            <label key={c.id} className="check" style={{ borderRadius: 12, padding: "12px 14px" }}>
              <input type="radio" name="partner" value={c.id} defaultChecked={i === 0} />
              {c.name}
            </label>
          ))}
          <button className="btn btn-primary" style={{ marginTop: 6 }}>
            Bu örnek ofisle devam et
          </button>
        </form>
        <p className="small muted">
          Canlı sürümde ofis listesi hiçbir partnere gösterilmez; herkes yalnızca kendi hesabıyla giriş yapar. <Link href="/" style={{ textDecoration: "underline" }}>Siteye dön</Link>
        </p>
      </div>
    </div>
  );
}
