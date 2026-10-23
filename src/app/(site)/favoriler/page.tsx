import type { Metadata } from "next";
import FavoritesClient from "./FavoritesClient";

export const metadata: Metadata = { title: "Favorilerim" };

export default function FavoritesPage() {
  return (
    <div className="container" style={{ paddingBottom: 40 }}>
      <header className="page-head">
        <h1>Favorilerim</h1>
        <p className="lead">Beğendiğiniz evleri bir arada görün, karşılaştırın ve tek seferde randevu talep edin.</p>
        <div className="notice notice-sea" style={{ marginTop: 16 }}>
          <span>
            Önizleme: favoriler yalnızca bu tarayıcıda saklanır. Canlı sürümde favoriler ve kayıtlı aramalar için giriş yapmanız gerekecek.
          </span>
        </div>
      </header>
      <FavoritesClient />
    </div>
  );
}
