import type { Metadata } from "next";
import Link from "next/link";
import PropertyCard from "@/components/PropertyCard";
import FilterPanel from "@/components/FilterPanel";
import { listPublicProperties, neighborhoods } from "@/lib/data/public";
import { applyFilters, parseFilters, toQuery, PAGE_SIZE, type Filters } from "@/lib/filters";
import { DISTRICT, FEATURE, ROOMS, SORTS, TYPE } from "@/lib/labels";
import { tlShort } from "@/lib/format";

export const metadata: Metadata = { title: "Satılık Evler" };

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function SalePage({ searchParams }: { searchParams: SP }) {
  const f = parseFilters(await searchParams);
  const results = applyFilters(listPublicProperties(), f);
  const pages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const page = Math.min(f.sayfa, pages);
  const shown = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hoods = neighborhoods();

  // Etkin filtre rozetleri: her biri o filtreyi kaldıran bağlantıdır
  const active: { label: string; without: Partial<Filters> }[] = [];
  if (f.ilce) active.push({ label: DISTRICT[f.ilce], without: { ilce: null, mahalle: null } });
  if (f.mahalle) active.push({ label: f.mahalle, without: { mahalle: null } });
  if (f.fiyatMin != null) active.push({ label: `En az ${tlShort(f.fiyatMin)}`, without: { fiyatMin: null } });
  if (f.fiyatMax != null) active.push({ label: `En çok ${tlShort(f.fiyatMax)}`, without: { fiyatMax: null } });
  f.tip.forEach((t) => active.push({ label: TYPE[t], without: { tip: f.tip.filter((x) => x !== t) } }));
  if (f.oda != null) active.push({ label: `${f.oda}+ oda`, without: { oda: null } });
  if (f.brutMin != null) active.push({ label: `Brüt ${f.brutMin}+ m²`, without: { brutMin: null } });
  if (f.netMin != null) active.push({ label: `Net ${f.netMin}+ m²`, without: { netMin: null } });
  if (f.arsaMin != null) active.push({ label: `Arsa ${f.arsaMin}+ m²`, without: { arsaMin: null } });
  if (f.yasMax != null) active.push({ label: `En fazla ${f.yasMax} yaş`, without: { yasMax: null } });
  f.ozellik.forEach((k) => active.push({ label: FEATURE[k], without: { ozellik: f.ozellik.filter((x) => x !== k) } }));
  if (f.vatandaslik) active.push({ label: "Vatandaşlık koleksiyonu", without: { vatandaslik: false } });

  const title = f.mahalle ? `${f.mahalle} satılık evler` : f.ilce ? `${DISTRICT[f.ilce]} satılık evler` : "Satılık Evler";

  return (
    <div className="container">
      <header className="page-head">
        <nav className="crumbs" aria-label="Konum">
          <Link href="/">Ana sayfa</Link>
          <span>/</span>
          <span>Satılık Evler</span>
        </nav>
        <h1>{title}</h1>
        <p className="lead">Yalnızca yetki belgesi incelenmiş ve yayın onayı almış ilanlar. Konumlar yaklaşık gösterilir.</p>
      </header>

      <div className="search-layout">
        <FilterPanel activeCount={active.length}>
          <form method="get" action="/satilik" className="filters-body">
            <label className="field">
              <span>İlçe</span>
              <select name="ilce" className="select" defaultValue={f.ilce ?? ""}>
                <option value="">Tümü</option>
                <option value="bodrum">Bodrum</option>
                <option value="milas">Milas</option>
              </select>
            </label>
            <label className="field">
              <span>Bölge / mahalle</span>
              <select name="mahalle" className="select" defaultValue={f.mahalle ?? ""}>
                <option value="">Tümü</option>
                <optgroup label="Bodrum">
                  {hoods.bodrum.map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </optgroup>
                <optgroup label="Milas">
                  {hoods.milas.map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </optgroup>
              </select>
            </label>
            <div className="field">
              <span>Fiyat (TL)</span>
              <div className="two">
                <input className="input" name="fiyatMin" inputMode="numeric" placeholder="En az" defaultValue={f.fiyatMin ?? ""} />
                <input className="input" name="fiyatMax" inputMode="numeric" placeholder="En çok" defaultValue={f.fiyatMax ?? ""} />
              </div>
            </div>
            <div className="field">
              <span>Tür</span>
              <div className="chips-input">
                {Object.entries(TYPE).map(([k, v]) => (
                  <label key={k} className="check">
                    <input type="checkbox" name="tip" value={k} defaultChecked={f.tip.includes(k as never)} />
                    {v}
                  </label>
                ))}
              </div>
            </div>
            <label className="field">
              <span>Oda sayısı (en az)</span>
              <select name="oda" className="select" defaultValue={f.oda ?? ""}>
                <option value="">Fark etmez</option>
                {ROOMS.map((r) => (
                  <option key={r} value={parseInt(r, 10)}>
                    {r} ve üzeri
                  </option>
                ))}
              </select>
            </label>
            <div className="field">
              <span>Alan (m², en az)</span>
              <div className="two">
                <input className="input" name="brutMin" inputMode="numeric" placeholder="Brüt" defaultValue={f.brutMin ?? ""} />
                <input className="input" name="netMin" inputMode="numeric" placeholder="Net" defaultValue={f.netMin ?? ""} />
              </div>
              <input className="input" name="arsaMin" inputMode="numeric" placeholder="Arsa alanı" defaultValue={f.arsaMin ?? ""} />
            </div>
            <label className="field">
              <span>Bina yaşı (en fazla)</span>
              <select name="yasMax" className="select" defaultValue={f.yasMax ?? ""}>
                <option value="">Fark etmez</option>
                <option value="0">Sıfır bina</option>
                <option value="5">5 yıl</option>
                <option value="10">10 yıl</option>
                <option value="20">20 yıl</option>
              </select>
            </label>
            <div className="field">
              <span>Özellikler</span>
              <div className="chips-input">
                {Object.entries(FEATURE).map(([k, v]) => (
                  <label key={k} className="check">
                    <input type="checkbox" name="ozellik" value={k} defaultChecked={f.ozellik.includes(k as never)} />
                    {v}
                  </label>
                ))}
              </div>
            </div>
            <label className="check" style={{ borderRadius: 12 }}>
              <input type="checkbox" name="vatandaslik" value="1" defaultChecked={f.vatandaslik} />
              Yalnızca vatandaşlık ön incelemeli koleksiyon
            </label>
            <input type="hidden" name="sirala" value={f.sirala} />
            <button className="btn btn-primary btn-block">Sonuçları göster</button>
            {active.length > 0 && (
              <Link href="/satilik" className="btn btn-ghost btn-block">
                Filtreleri temizle
              </Link>
            )}
          </form>
        </FilterPanel>

        <section aria-label="Sonuçlar">
          <div className="toolbar">
            <p>
              <strong>{results.length}</strong> ilan bulundu
            </p>
            <form method="get" action="/satilik" className="row">
              {Object.entries(Object.fromEntries(new URLSearchParams(toQuery({ ...f, sirala: "onerilen", sayfa: 1 })))).map(([k, v]) => (
                <input key={k} type="hidden" name={k} value={v} />
              ))}
              <label className="row small">
                <span className="muted">Sırala</span>
                <select name="sirala" className="select" defaultValue={f.sirala} style={{ width: "auto", minHeight: 38 }}>
                  {SORTS.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <button className="btn btn-sm btn-light">Uygula</button>
            </form>
          </div>

          {active.length > 0 && (
            <div className="active-filters">
              {active.map((a) => (
                <Link key={a.label} className="chip" href={`/satilik${toQuery({ ...f, ...a.without, sayfa: 1 })}`} aria-label={`${a.label} filtresini kaldır`}>
                  {a.label} ✕
                </Link>
              ))}
            </div>
          )}

          {shown.length ? (
            <div className="grid-cards">
              {shown.map((p) => (
                <PropertyCard key={p.id} p={p} />
              ))}
            </div>
          ) : (
            <div className="empty stack" style={{ justifyItems: "center" }}>
              <h3>Bu kriterlere uyan ilan yok</h3>
              <p className="muted">Filtrelerden birkaçını kaldırın ya da aradığınızı anlatın; uygun ev çıktığında size biz ulaşalım.</p>
              <div className="row" style={{ justifyContent: "center" }}>
                <Link href="/satilik" className="btn btn-light">
                  Filtreleri temizle
                </Link>
                <Link href="/eslestirme" className="btn btn-primary">
                  Bana Uygun Evi Bul
                </Link>
              </div>
            </div>
          )}

          {pages > 1 && (
            <nav className="pager" aria-label="Sayfalar">
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) =>
                n === page ? (
                  <span key={n} aria-current="page">
                    {n}
                  </span>
                ) : (
                  <Link key={n} href={`/satilik${toQuery({ ...f, sayfa: n })}`}>
                    {n}
                  </Link>
                ),
              )}
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}
