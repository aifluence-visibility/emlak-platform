import type { District, PropertyType, PublicProperty } from "./types";
import type { FeatureKey } from "./matching";
import { FEATURE, TYPE } from "./labels";

/** /satilik arama filtreleri. Tümü URL'de tutulur → paylaşılabilir arama. */
export type Filters = {
  ilce: District | null;
  mahalle: string | null;
  fiyatMin: number | null;
  fiyatMax: number | null;
  tip: PropertyType[];
  oda: number | null;
  brutMin: number | null;
  netMin: number | null;
  arsaMin: number | null;
  yasMax: number | null;
  ozellik: FeatureKey[];
  vatandaslik: boolean;
  sirala: string;
  sayfa: number;
};

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const num = (v: string | string[] | undefined) => {
  const s = one(v).replace(/\./g, "");
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
};
const many = (v: string | string[] | undefined) => (v == null ? [] : Array.isArray(v) ? v : [v]).flatMap((x) => x.split(",")).filter(Boolean);

export function parseFilters(sp: SP): Filters {
  const ilce = one(sp.ilce);
  return {
    ilce: ilce === "bodrum" || ilce === "milas" ? ilce : null,
    mahalle: one(sp.mahalle) || null,
    fiyatMin: num(sp.fiyatMin),
    fiyatMax: num(sp.fiyatMax),
    tip: many(sp.tip).filter((t): t is PropertyType => t in TYPE),
    oda: num(sp.oda),
    brutMin: num(sp.brutMin),
    netMin: num(sp.netMin),
    arsaMin: num(sp.arsaMin),
    yasMax: num(sp.yasMax),
    ozellik: many(sp.ozellik).filter((f): f is FeatureKey => f in FEATURE),
    vatandaslik: one(sp.vatandaslik) === "1",
    sirala: one(sp.sirala) || "onerilen",
    sayfa: Math.max(1, num(sp.sayfa) ?? 1),
  };
}

export function applyFilters(list: PublicProperty[], f: Filters) {
  const out = list.filter((p) => {
    if (f.ilce && p.district !== f.ilce) return false;
    if (f.mahalle && p.neighborhood !== f.mahalle) return false;
    if (f.fiyatMin != null && p.price < f.fiyatMin) return false;
    if (f.fiyatMax != null && p.price > f.fiyatMax) return false;
    if (f.tip.length && !f.tip.includes(p.type)) return false;
    if (f.oda != null && (p.rooms == null || parseInt(p.rooms, 10) < f.oda)) return false;
    if (f.brutMin != null && (p.grossSqm ?? 0) < f.brutMin) return false;
    if (f.netMin != null && (p.netSqm ?? 0) < f.netMin) return false;
    if (f.arsaMin != null && (p.landSqm ?? 0) < f.arsaMin) return false;
    if (f.yasMax != null && (p.buildingAge == null || p.buildingAge > f.yasMax)) return false;
    if (f.ozellik.some((k) => !p.features[k])) return false;
    if (f.vatandaslik && !p.inCitizenshipCollection) return false;
    return true;
  });

  const by: Record<string, (a: PublicProperty, b: PublicProperty) => number> = {
    yeni: (a, b) => Date.parse(b.publishedAt ?? "0") - Date.parse(a.publishedAt ?? "0"),
    "fiyat-artan": (a, b) => a.price - b.price,
    "fiyat-azalan": (a, b) => b.price - a.price,
    m2: (a, b) => (b.grossSqm ?? b.landSqm ?? 0) - (a.grossSqm ?? a.landSqm ?? 0),
    // Önerilen: doğrulanmış bilgi oranı yüksek ve yeni ilanlar öne
    onerilen: (a, b) => verifiedRatio(b) - verifiedRatio(a) || Date.parse(b.publishedAt ?? "0") - Date.parse(a.publishedAt ?? "0"),
  };
  return out.sort(by[f.sirala] ?? by.onerilen);
}

function verifiedRatio(p: PublicProperty) {
  const v = Object.values(p.factSources);
  return v.length ? v.filter((x) => x === "verified").length / v.length : 0;
}

export const PAGE_SIZE = 12;

/** Filtre nesnesini URL sorgusuna çevirir (sayfalama ve "filtreyi kaldır" bağlantıları için) */
export function toQuery(f: Partial<Filters>) {
  const q = new URLSearchParams();
  const set = (k: string, v: unknown) => {
    if (v == null || v === "" || v === false || (Array.isArray(v) && !v.length)) return;
    q.set(k, Array.isArray(v) ? v.join(",") : v === true ? "1" : String(v));
  };
  set("ilce", f.ilce);
  set("mahalle", f.mahalle);
  set("fiyatMin", f.fiyatMin);
  set("fiyatMax", f.fiyatMax);
  set("tip", f.tip);
  set("oda", f.oda);
  set("brutMin", f.brutMin);
  set("netMin", f.netMin);
  set("arsaMin", f.arsaMin);
  set("yasMax", f.yasMax);
  set("ozellik", f.ozellik);
  set("vatandaslik", f.vatandaslik);
  if (f.sirala && f.sirala !== "onerilen") set("sirala", f.sirala);
  if (f.sayfa && f.sayfa > 1) set("sayfa", f.sayfa);
  const s = q.toString();
  return s ? `?${s}` : "";
}
