import Link from "next/link";

/** Önizlemenin gerçek bir sistem gibi algılanmaması için her sayfada görünür (kullanıcı kuralı). */
export default function PreviewBanner() {
  return (
    <div className="preview-banner" role="note">
      <div className="container">
        <strong>Önizleme sürümü.</strong> İlanlar, kişiler ve görseller örnektir. Gerçek giriş, veri kaydı ve güvenlik henüz
        devrede değil. <Link href="/onizleme">Ayrıntılar</Link>
      </div>
    </div>
  );
}
