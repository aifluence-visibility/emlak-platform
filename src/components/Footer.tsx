import Link from "next/link";
import { BRAND } from "@/lib/brand";

export default function Footer() {
  return (
    <footer className="ftr">
      <div className="container ftr-grid">
        <div className="stack">
          <strong className="ftr-brand">{BRAND.name}</strong>
          <p className="muted small">
            Bodrum ve Milas&apos;ta seçilmiş, yetki belgesi incelenmiş satılık gayrimenkuller. Davetli iş ortaklarıyla çalışan özel bir
            eşleştirme platformu.
          </p>
        </div>
        <div className="stack small">
          <strong>Keşfet</strong>
          <Link href="/satilik">Satılık Evler</Link>
          <Link href="/projeler">Yeni Projeler</Link>
          <Link href="/vatandaslik">Vatandaşlığa Uygun Gayrimenkuller</Link>
          <Link href="/eslestirme">Bana Uygun Evi Bul</Link>
        </div>
        <div className="stack small">
          <strong>Bölgeler</strong>
          <Link href="/satilik?ilce=bodrum">Bodrum</Link>
          <Link href="/satilik?ilce=bodrum&mahalle=Mumcular">Mumcular</Link>
          <Link href="/satilik?ilce=milas">Milas</Link>
        </div>
        <div className="stack small">
          <strong>Kurumsal</strong>
          <Link href="/gizlilik">Gizlilik ve KVKK</Link>
          <Link href="/onizleme">Önizleme hakkında</Link>
          <Link href="/partner">İş ortağı paneli (önizleme)</Link>
        </div>
      </div>
      <div className="container ftr-bottom small muted">
        <span>© 2026 {BRAND.name} (geçici marka adı)</span>
        <span>Önizleme sürümü · Tüm ilanlar ve görseller örnektir</span>
      </div>
    </footer>
  );
}
