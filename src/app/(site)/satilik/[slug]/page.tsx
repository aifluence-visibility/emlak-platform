import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Scene from "@/components/Scene";
import PropertyCard from "@/components/PropertyCard";
import InquiryForm from "@/components/InquiryForm";
import { CompareButton, FavoriteButton } from "@/components/SaveButtons";
import { getPublicProperty, listPublicProperties } from "@/lib/data/public";
import { DISTRICT, FEATURE, TYPE } from "@/lib/labels";
import { age, date, meters, sqm, tl } from "@/lib/format";
import { criteriaFromParams, hasCriteria, scoreProperty } from "@/lib/matching";
import type { FactSource, PublicProperty } from "@/lib/types";

type Params = Promise<{ slug: string }>;
type SP = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = getPublicProperty((await params).slug);
  return { title: p ? p.title : "İlan bulunamadı" };
}

const VIEWS = ["Dış cephe", "Teras ve havuz", "Yaşam alanı", "Konum çevresi", "Akşam"];

function Src({ s }: { s?: FactSource }) {
  if (!s) return null;
  return s === "verified" ? <span className="src src-verified">Belgeyle doğrulandı</span> : <span className="src src-declared">Beyan</span>;
}

function similar(p: PublicProperty) {
  return listPublicProperties()
    .filter((x) => x.id !== p.id && (x.neighborhood === p.neighborhood || x.type === p.type))
    .sort((a, b) => Math.abs(a.price - p.price) - Math.abs(b.price - p.price))
    .slice(0, 3);
}

export default async function PropertyPage({ params, searchParams }: { params: Params; searchParams: SP }) {
  const p = getPublicProperty((await params).slug);
  if (!p) notFound();

  const c = criteriaFromParams(await searchParams);
  const match = hasCriteria(c) ? scoreProperty({ ...c, citizenshipOnly: false }, p) : null;

  const facts: { k: string; v: string; s?: FactSource }[] = [
    { k: "Tür", v: TYPE[p.type] },
    ...(p.rooms ? [{ k: "Oda", v: p.rooms, s: p.factSources.rooms }] : []),
    ...(p.grossSqm ? [{ k: "Brüt alan", v: sqm(p.grossSqm), s: p.factSources.grossSqm }] : []),
    ...(p.netSqm ? [{ k: "Net alan", v: sqm(p.netSqm), s: p.factSources.netSqm }] : []),
    ...(p.landSqm ? [{ k: "Arsa alanı", v: sqm(p.landSqm), s: p.factSources.landSqm }] : []),
    ...(p.buildingAge != null ? [{ k: "Bina yaşı", v: age(p.buildingAge), s: p.factSources.buildingAge }] : []),
    ...(p.floor ? [{ k: "Kat", v: p.floor }] : []),
    ...(p.bathrooms ? [{ k: "Banyo", v: String(p.bathrooms) }] : []),
    ...(p.titleDeed ? [{ k: "Tapu", v: p.titleDeed, s: p.factSources.titleDeed }] : []),
    ...(p.seaDistanceM ? [{ k: "Denize uzaklık", v: `yaklaşık ${meters(p.seaDistanceM)}` }] : []),
  ];
  const features = (Object.keys(FEATURE) as (keyof typeof FEATURE)[]).filter((k) => p.features[k]);
  const views = Array.from({ length: p.sceneCount }, (_, i) => i);

  return (
    <div className="container">
      <header className="page-head" style={{ paddingBottom: 20 }}>
        <nav className="crumbs" aria-label="Konum">
          <Link href="/">Ana sayfa</Link>
          <span>/</span>
          <Link href="/satilik">Satılık Evler</Link>
          <span>/</span>
          <Link href={`/satilik?ilce=${p.district}&mahalle=${encodeURIComponent(p.neighborhood)}`}>{p.neighborhood}</Link>
        </nav>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "end" }}>
          <div className="stack" style={{ gap: 8 }}>
            <div className="row">
              <span className="chip">{TYPE[p.type]}</span>
              {p.inCitizenshipCollection && <span className="chip chip-gold">Vatandaşlık ön incelemesi</span>}
              {p.developmentName && <span className="chip chip-sea">{p.developmentName}</span>}
              <span className="chip">İlan no: {p.code}</span>
            </div>
            <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}>{p.title}</h1>
            <p className="muted">
              {p.neighborhood}, {DISTRICT[p.district]} · Güncelleme: {date(p.updatedAt)}
            </p>
          </div>
          <div className="row">
            <FavoriteButton code={p.code} withLabel />
            <CompareButton code={p.code} withLabel />
          </div>
        </div>
      </header>

      <div className="gallery">
        {views.slice(0, 5).map((v) => (
          <div key={v}>
            <Scene spec={p.scene} view={v} label={`${VIEWS[v]} — temsilî görsel`} />
            {v === 0 && <span className="chip chip-dark">Temsilî görsel · {p.sceneCount} görünüm</span>}
          </div>
        ))}
      </div>

      <div className="detail-layout">
        <div className="stack" style={{ gap: 36 }}>
          {match && (
            <section className="card stack" style={{ gap: 14 }} aria-label="Uyum">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <h2 style={{ fontSize: "1.3rem" }}>Kriterlerinize uyumu</h2>
                <span className={`chip ${match.kind === "tam" ? "chip-ok" : "chip-sea"}`}>
                  {match.kind === "tam" ? "Tam uyum" : "Yakın uyum"} · %{match.score}
                </span>
              </div>
              <ul className="reasons">
                {match.reasons.map((r, i) => (
                  <li key={i} data-t={r.t}>
                    {r.m}
                  </li>
                ))}
              </ul>
              <p className="small muted">Yüzde, kriterlerinize iç uyum puanıdır; satın alma olasılığı değildir.</p>
            </section>
          )}

          <section className="stack" style={{ gap: 14 }}>
            <h2 style={{ fontSize: "1.5rem" }}>Öne çıkan bilgiler</h2>
            <dl className="facts">
              {facts.map((f) => (
                <div key={f.k}>
                  <dt>{f.k}</dt>
                  <dd>
                    {f.v} <Src s={f.s} />
                  </dd>
                </div>
              ))}
            </dl>
            <p className="small muted">
              <span className="src src-verified">Belgeyle doğrulandı</span> işaretli bilgiler platform ekibince belgeyle karşılaştırılmıştır.{" "}
              <span className="src src-declared">Beyan</span> işaretli bilgiler iş ortağı beyanıdır.
            </p>
          </section>

          {features.length > 0 && (
            <section className="stack" style={{ gap: 14 }}>
              <h2 style={{ fontSize: "1.5rem" }}>Özellikler</h2>
              <div className="amenities">
                {features.map((k) => (
                  <span key={k} className="chip">
                    {FEATURE[k]}
                  </span>
                ))}
              </div>
            </section>
          )}

          <section className="stack" style={{ gap: 14 }}>
            <h2 style={{ fontSize: "1.5rem" }}>Açıklama</h2>
            <div className="prose">
              {p.description.split("\n\n").map((t, i) => (
                <p key={i}>{t}</p>
              ))}
            </div>
          </section>

          <section className="stack" style={{ gap: 14 }}>
            <h2 style={{ fontSize: "1.5rem" }}>Konum</h2>
            <div className="map-approx">
              <span>
                {p.neighborhood}, {DISTRICT[p.district]} · yaklaşık konum
              </span>
            </div>
            <p className="small muted">Kesin adres, randevu onaylandıktan sonra platform ekibi tarafından paylaşılır.</p>
          </section>

          {p.inCitizenshipCollection && (
            <div className="notice">
              <span>
                Bu mülk vatandaşlık yatırımı için <strong>ön incelemeden</strong> geçmiştir. Ön inceleme resmî uygunluk kararı ya da vatandaşlık
                garantisi değildir; güncel mevzuat ve alıcının uyruğuna göre ayrıca değerlendirilir.{" "}
                <Link href="/vatandaslik" style={{ textDecoration: "underline" }}>
                  Ayrıntılar
                </Link>
              </span>
            </div>
          )}
        </div>

        <aside className="side">
          <div className="card stack" style={{ gap: 16 }}>
            <div>
              <p className="small muted">Satış fiyatı</p>
              <p className="price-xl">{tl(p.price)}</p>
            </div>
            <InquiryForm codes={[p.code]} />
          </div>
        </aside>
      </div>

      <section className="section">
        <div className="section-head">
          <h2>Benzer ilanlar</h2>
        </div>
        <div className="grid-cards">
          {similar(p).map((x) => (
            <PropertyCard key={x.id} p={x} />
          ))}
        </div>
      </section>
    </div>
  );
}
