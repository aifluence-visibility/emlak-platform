import type { Metadata } from "next";
import Link from "next/link";
import Scene from "@/components/Scene";
import { listPublicDevelopments } from "@/lib/data/public";
import { DEV_STATUS, DISTRICT } from "@/lib/labels";
import { tlShort } from "@/lib/format";

export const metadata: Metadata = { title: "Yeni Projeler" };

export default function ProjectsPage() {
  const devs = listPublicDevelopments();
  return (
    <div className="container">
      <header className="page-head">
        <nav className="crumbs" aria-label="Konum">
          <Link href="/">Ana sayfa</Link>
          <span>/</span>
          <span>Yeni Projeler</span>
        </nav>
        <h1>Yeni Projeler</h1>
        <p className="lead">
          Proje bazında incelenmiş konut projeleri. Teslim tarihleri tahmindir; görselleştirme (render) ve gerçek fotoğraflar ayrıca
          belirtilir. Satışa açık daireler, kendi ilan kurallarıyla ayrıca yayınlanır.
        </p>
      </header>
      <div className="stack" style={{ gap: 24, paddingBottom: 40 }}>
        {devs.map((d) => (
          <Link key={d.id} href={`/projeler/${d.slug}`} className="dev-card">
            <div className="media">
              <Scene spec={d.scene} label={`${d.name} — temsilî görselleştirme`} />
            </div>
            <div className="body">
              <div className="row">
                <span className="chip chip-sea">{DEV_STATUS[d.status]}</span>
                <span className="chip">{d.deliveryEstimate}</span>
              </div>
              <p className="pcard-loc">
                {d.neighborhood}, {DISTRICT[d.district]}
              </p>
              <h2 style={{ fontSize: "1.8rem" }}>{d.name}</h2>
              <p className="muted">{d.concept}</p>
              <div className="row small">
                <span>
                  <strong>{d.availableCount}</strong> / {d.unitCount} birim satışta
                </span>
                {d.priceFrom && (
                  <span>
                    · <strong>{tlShort(d.priceFrom)}</strong>&apos;den başlayan
                  </span>
                )}
              </div>
              <span className="btn btn-light" style={{ justifySelf: "start" }}>
                Projeyi incele →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
