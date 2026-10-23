import type { District, Features, PropertyType, PublicProperty } from "./types";
import { DISTRICT, FEATURE, TYPE } from "./labels";
import { FEATURES, REASONS, TYPES, money, type Lang } from "./i18n";

/**
 * Kural tabanlı (deterministik) eşleştirme motoru — brief §9.
 * otogaleri-havuz `score_pair()` (supabase/migrations/20261012000003_matching.sql) mantığından uyarlandı:
 *  - Zorunlu kriterlere uymayan ilan hiç önerilmez.
 *  - "Tam uyum" yalnızca belirtilen TÜM kriterler birebir uyduğunda verilir; yüksek puan tek başına yetmez.
 *  - Her sonuç okunur gerekçeler taşır (Neden uyuyor / Hangi kriterlerde farklı).
 *  - Yüzde, satın alma olasılığı DEĞİL; iç uyum puanıdır.
 * Supabase aşamasında aynı kurallar SQL fonksiyonuna taşınır; ağırlıklar `match_settings` tablosundan okunur.
 */

export type FeatureKey = keyof Features;

export type Criteria = {
  districts: District[];
  neighborhoods: string[];
  budgetMax: number | null;
  types: PropertyType[];
  roomsMin: number | null; // yatak odası sayısı (3+1 → 3)
  netSqmMin: number | null;
  features: FeatureKey[];
  citizenshipOnly: boolean;
  /** Kesin kriterler: uymayan ilan elenir */
  strict: ("bolge" | "butce" | "tip" | "oda" | "alan" | FeatureKey)[];
};

export type Reason = { t: "ok" | "warn" | "alt"; m: string };
export type MatchResult = { property: PublicProperty; score: number; kind: "tam" | "yakin"; reasons: Reason[] };

/** Varsayılan ağırlıklar (toplam 100). Yönetici panelinde düzenlenebilir olacak. */
export const DEFAULT_WEIGHTS = {
  region: 25,
  budget: 25,
  type: 15,
  rooms: 12,
  sqm: 8,
  features: 10,
  recency: 5,
  budgetTolerance: 0.1, // bütçenin %10 üstüne kadar kısmi puan
  budgetHardLimit: 0.25, // bütçeyi %25'ten fazla aşan ilan hiç önerilmez (kesin işaretlenmese bile)
  minScore: 60, // bunun altı gösterilmez (galeri projesindeki min_score ile aynı)
};
export type Weights = typeof DEFAULT_WEIGHTS;

const bedrooms = (rooms: string | null) => (rooms ? parseInt(rooms, 10) : null);

const SIMILAR_TYPES: Partial<Record<PropertyType, PropertyType[]>> = {
  villa: ["detached"],
  detached: ["villa"],
  apartment: ["residence"],
  residence: ["apartment"],
};

export function scoreProperty(
  c: Criteria,
  p: PublicProperty,
  w: Weights = DEFAULT_WEIGHTS,
  now = Date.now(),
  lang: Lang = "tr",
): MatchResult | null {
  const R = REASONS[lang];
  const place = `${p.neighborhood}, ${DISTRICT[p.district]}`;
  const typeName = TYPES[lang][p.type];
  // Temel (her zaman kesin) filtreler: yalnızca yayındaki satılık envanter zaten public katmandan gelir
  if (c.citizenshipOnly && !p.inCitizenshipCollection) return null;

  let s = 0;
  let exact = true;
  const rs: Reason[] = [];
  const strict = new Set(c.strict);

  // ---- Bölge ----
  const anyRegion = c.districts.length === 0 && c.neighborhoods.length === 0;
  if (anyRegion) {
    s += w.region;
  } else if (c.neighborhoods.includes(p.neighborhood) || (c.neighborhoods.length === 0 && c.districts.includes(p.district))) {
    s += w.region;
    rs.push({ t: "ok", m: R.region_ok({ place }) });
  } else {
    exact = false;
    if (strict.has("bolge")) return null;
    const sameDistrict =
      c.districts.includes(p.district) ||
      c.neighborhoods.some((n) => n !== p.neighborhood && p.district === districtOfNeighborhood(n));
    if (sameDistrict) {
      s += w.region * 0.5;
      rs.push({ t: "alt", m: R.region_alt({ place: p.neighborhood }) });
    } else {
      rs.push({ t: "warn", m: R.region_warn({ place }) });
    }
  }

  // ---- Bütçe ----
  if (c.budgetMax == null || p.price <= c.budgetMax) {
    s += w.budget;
    if (c.budgetMax != null) rs.push({ t: "ok", m: R.budget_ok({ price: money(lang, p.price) }) });
  } else {
    exact = false;
    if (strict.has("butce")) return null;
    if (p.price > c.budgetMax * (1 + w.budgetHardLimit)) return null;
    const over = p.price - c.budgetMax;
    if (p.price <= c.budgetMax * (1 + w.budgetTolerance)) s += w.budget * 0.5;
    rs.push({ t: "warn", m: R.budget_warn({ over: money(lang, over) }) });
  }

  // ---- Tür ----
  if (c.types.length === 0 || c.types.includes(p.type)) {
    s += w.type;
    if (c.types.length) rs.push({ t: "ok", m: R.type_ok({ type: typeName }) });
  } else {
    exact = false;
    if (strict.has("tip")) return null;
    if (c.types.some((t) => SIMILAR_TYPES[t]?.includes(p.type))) {
      s += w.type * 0.5;
      rs.push({ t: "alt", m: R.type_alt({ type: typeName }) });
    } else {
      return null; // ne aynı ne benzer tür: öneri değil (galeri: "ne model, ne segment, ne marka")
    }
  }

  // ---- Oda ----
  const b = bedrooms(p.rooms);
  if (c.roomsMin == null || (b != null && b >= c.roomsMin)) {
    s += w.rooms;
    if (c.roomsMin != null) rs.push({ t: "ok", m: R.rooms_ok({ rooms: p.rooms!, min: c.roomsMin }) });
  } else {
    exact = false;
    if (strict.has("oda")) return null;
    if (b != null && b === c.roomsMin - 1) s += w.rooms * 0.5;
    rs.push({ t: "warn", m: b == null ? R.rooms_none({}) : R.rooms_warn({ rooms: p.rooms!, diff: c.roomsMin - b }) });
  }

  // ---- Alan ----
  if (c.netSqmMin == null || (p.netSqm != null && p.netSqm >= c.netSqmMin)) {
    s += w.sqm;
    if (c.netSqmMin != null) rs.push({ t: "ok", m: R.sqm_ok({ sqm: p.netSqm!, min: c.netSqmMin }) });
  } else {
    exact = false;
    if (strict.has("alan")) return null;
    if (p.netSqm != null && p.netSqm >= c.netSqmMin * 0.85) s += w.sqm * 0.5;
    rs.push({ t: "warn", m: p.netSqm == null ? R.sqm_none({}) : R.sqm_warn({ sqm: p.netSqm, min: c.netSqmMin }) });
  }

  // ---- Özellikler ----
  if (c.features.length === 0) {
    s += w.features;
  } else {
    const per = w.features / c.features.length;
    for (const f of c.features) {
      if (p.features[f]) {
        s += per;
        rs.push({ t: "ok", m: R.feat_ok({ f: FEATURES[lang][f] }) });
      } else {
        exact = false;
        if (strict.has(f)) return null;
        rs.push({ t: "warn", m: R.feat_warn({ f: FEATURES[lang][f] }) });
      }
    }
  }

  // ---- Güncellik ----
  const days = p.publishedAt ? (now - Date.parse(p.publishedAt)) / 86_400_000 : 999;
  s += days <= 14 ? w.recency : w.recency * 0.5;

  const score = Math.round(s);
  if (score < w.minScore) return null;
  return { property: p, score, kind: exact ? "tam" : "yakin", reasons: rs };
}

/** Uygun olan TÜM sonuçlar, puana göre sıralı (keyfî "ilk 3" yok — brief §9) */
export function matchAll(c: Criteria, list: PublicProperty[], lang: Lang = "tr", w: Weights = DEFAULT_WEIGHTS) {
  const now = Date.now();
  return list
    .map((p) => scoreProperty(c, p, w, now, lang))
    .filter((r): r is MatchResult => r !== null)
    .sort((a, b) => b.score - a.score || (a.kind === "tam" ? -1 : 1) || a.property.price - b.property.price);
}

const BODRUM = new Set([
  "Yalıkavak", "Göltürkbükü", "Gündoğan", "Torba", "Gümüşlük", "Bitez", "Ortakent", "Turgutreis",
  "Konacık", "Gürece", "Mumcular", "Akyarlar", "Kumbahçe",
]);
function districtOfNeighborhood(n: string): District {
  return BODRUM.has(n) ? "bodrum" : "milas";
}

// ---------------- URL ↔ kriter ----------------

type SP = Record<string, string | string[] | undefined>;
const list = (v: string | string[] | undefined) => (v == null ? [] : (Array.isArray(v) ? v : v.split(",")).filter(Boolean));
const num = (v: string | string[] | undefined) => {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export function criteriaFromParams(sp: SP): Criteria {
  return {
    districts: list(sp.ilce).filter((d): d is District => d === "bodrum" || d === "milas"),
    neighborhoods: list(sp.mahalle),
    budgetMax: num(sp.butce),
    types: list(sp.tip).filter((t): t is PropertyType => t in TYPE),
    roomsMin: num(sp.oda),
    netSqmMin: num(sp.m2),
    features: list(sp.ozellik).filter((f): f is FeatureKey => f in FEATURE),
    citizenshipOnly: sp.vatandaslik === "1",
    strict: list(sp.kesin).flatMap((k) => (k === "ozellik" ? list(sp.ozellik) : [k])) as Criteria["strict"],
  };
}

export function hasCriteria(c: Criteria) {
  return !!(c.districts.length || c.neighborhoods.length || c.budgetMax || c.types.length || c.roomsMin || c.netSqmMin || c.features.length);
}
