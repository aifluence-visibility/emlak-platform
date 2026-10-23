import type { Metadata } from "next";
import CompareClient from "./CompareClient";

export const metadata: Metadata = { title: "İlan karşılaştırma" };

export default function ComparePage() {
  return (
    <div className="container" style={{ paddingBottom: 40 }}>
      <header className="page-head">
        <h1>İlan karşılaştırma</h1>
        <p className="lead">Seçtiğiniz ilanları fiyat, alan, konum ve özellikleriyle yan yana görün.</p>
      </header>
      <CompareClient />
    </div>
  );
}
