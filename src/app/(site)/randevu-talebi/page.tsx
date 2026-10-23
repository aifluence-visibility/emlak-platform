import type { Metadata } from "next";
import Link from "next/link";
import Scene from "@/components/Scene";
import InquiryForm from "@/components/InquiryForm";
import { getPublicPropertiesByCodes } from "@/lib/data/public";
import { DISTRICT } from "@/lib/labels";
import { tlShort } from "@/lib/format";

export const metadata: Metadata = { title: "Randevu talebi" };

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function ViewingRequestPage({ searchParams }: { searchParams: SP }) {
  const k = (await searchParams).k;
  const codes = (Array.isArray(k) ? k.join(",") : k ?? "").split(",").filter(Boolean).slice(0, 10);
  const list = getPublicPropertiesByCodes(codes);

  return (
    <div className="container" style={{ paddingBottom: 40 }}>
      <header className="page-head">
        <h1>Randevu talebi</h1>
        <p className="lead">
          Seçtiğiniz evleri tek bir programda görmeniz için uygun olduğunuz zamanları paylaşın. Tarihleri iş ortaklarıyla platform ekibi
          planlar ve onaylı programı size iletir.
        </p>
      </header>
      {list.length === 0 ? (
        <div className="empty stack" style={{ justifyItems: "center" }}>
          <p className="muted">Randevu için ilan seçilmedi.</p>
          <Link href="/favoriler" className="btn btn-primary">
            Favorilerimden seç
          </Link>
        </div>
      ) : (
        <div className="detail-layout" style={{ marginTop: 0 }}>
          <div className="stack" style={{ gap: 12 }}>
            {list.map((p) => (
              <Link key={p.id} href={`/satilik/${p.slug}`} className="match-row" style={{ gridTemplateColumns: "160px 1fr" }}>
                <div className="media" style={{ minHeight: 120 }}>
                  <Scene spec={p.scene} label={p.title} />
                </div>
                <div className="body">
                  <p className="pcard-loc">
                    {p.neighborhood}, {DISTRICT[p.district]}
                  </p>
                  <h3 className="pcard-title">{p.title}</h3>
                  <p className="pcard-price" style={{ fontSize: "1.1rem" }}>
                    {tlShort(p.price)}
                  </p>
                </div>
              </Link>
            ))}
            <p className="small muted">
              Görüntüleme sırası ve saatleri, iş ortaklarının uygunluğu teyit edildikten sonra planlanır. Yolculuk süreleri tahmin edilerek
              değil, onaylı programla paylaşılır.
            </p>
          </div>
          <aside className="side">
            <div className="card">
              <InquiryForm codes={list.map((p) => p.code)} mode="viewing" compact />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
