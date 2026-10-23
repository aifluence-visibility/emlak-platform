import "server-only";
import type { Features, Property, PropertyType, District, PropertyStatus, FactSource } from "@/lib/types";

/**
 * ÖRNEK VERİ — tamamen kurgusal. Gerçek mülk, kişi veya ofisle ilgisi yoktur.
 * Supabase aşamasında bu dosyanın yerini `supabase/seed.sql` (sentetik) alır.
 */

const F = (on: Partial<Features> = {}): Features => ({
  pool: false,
  garden: false,
  seaView: false,
  parking: false,
  furnished: false,
  inSite: false,
  creditEligible: false,
  ...on,
});

type Seed = {
  code: string;
  title: string;
  summary: string;
  district: District;
  neighborhood: string;
  type: PropertyType;
  price: number;
  rooms?: string;
  gross?: number;
  net?: number;
  land?: number;
  age?: number;
  floor?: string;
  baths?: number;
  features: Features;
  deed?: string;
  sea?: number;
  time?: "day" | "golden" | "dusk";
  status?: PropertyStatus;
  dev?: string;
  publishedDaysAgo?: number;
  verified?: ("grossSqm" | "netSqm" | "landSqm" | "buildingAge" | "rooms" | "titleDeed")[];
};

const slugify = (s: string) =>
  s
    .toLocaleLowerCase("tr")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const NOW = Date.parse("2026-10-20T09:00:00Z");
const daysAgo = (n: number) => new Date(NOW - n * 86_400_000).toISOString();

const seeds: Seed[] = [
  {
    code: "BD-1001", title: "Yalıkavak'ta marina manzaralı müstakil villa", district: "bodrum", neighborhood: "Yalıkavak",
    summary: "Sonsuzluk havuzu, geniş teraslar ve gün batımına bakan yaşam alanları.",
    type: "villa", price: 118_000_000, rooms: "5+1", gross: 420, net: 340, land: 1150, age: 3, baths: 5,
    features: F({ pool: true, garden: true, seaView: true, parking: true }), deed: "Kat mülkiyeti", sea: 900, time: "golden",
    publishedDaysAgo: 4, verified: ["grossSqm", "landSqm", "titleDeed"],
  },
  {
    code: "BD-1002", title: "Göltürkbükü'nde koy manzaralı tasarım villa", district: "bodrum", neighborhood: "Göltürkbükü",
    summary: "Denize yürüme mesafesinde, taş ve ahşap dokulu, özel havuzlu villa.",
    type: "villa", price: 145_000_000, rooms: "4+1", gross: 360, net: 300, land: 820, age: 1, baths: 4,
    features: F({ pool: true, garden: true, seaView: true, parking: true, furnished: true }), deed: "Kat mülkiyeti", sea: 350, time: "day",
    publishedDaysAgo: 9, verified: ["grossSqm", "titleDeed"],
  },
  {
    code: "BD-1003", title: "Bitez'de site içinde bahçe katı daire", district: "bodrum", neighborhood: "Bitez",
    summary: "Ortak havuzlu, bakımlı sitede bahçe kullanımlı ferah daire.",
    type: "apartment", price: 13_900_000, rooms: "2+1", gross: 110, net: 92, age: 6, floor: "Bahçe katı", baths: 2,
    features: F({ pool: true, garden: true, parking: true, inSite: true, creditEligible: true }), deed: "Kat mülkiyeti", sea: 1200, time: "day",
    publishedDaysAgo: 2, verified: ["netSqm", "titleDeed", "buildingAge"],
  },
  {
    code: "BD-1004", title: "Gümüşlük'te taş ev, geniş bahçe", district: "bodrum", neighborhood: "Gümüşlük",
    summary: "Zeytin ağaçları arasında, restore edilmiş geleneksel taş ev.",
    type: "detached", price: 32_500_000, rooms: "3+1", gross: 190, net: 160, land: 1400, age: 22, baths: 2,
    features: F({ garden: true, seaView: true, parking: true }), deed: "Müstakil tapu", sea: 1500, time: "golden",
    publishedDaysAgo: 15, verified: ["landSqm"],
  },
  {
    code: "BD-1005", title: "Torba'da deniz manzaralı rezidans dairesi", district: "bodrum", neighborhood: "Torba",
    summary: "Concierge hizmetli rezidansta, panoramik teraslı daire.",
    type: "residence", price: 27_800_000, rooms: "3+1", gross: 165, net: 135, age: 2, floor: "2. kat", baths: 2,
    features: F({ pool: true, seaView: true, parking: true, inSite: true, furnished: true, creditEligible: true }), deed: "Kat mülkiyeti", sea: 600, time: "dusk",
    publishedDaysAgo: 6, verified: ["grossSqm", "netSqm", "titleDeed"],
  },
  {
    code: "BD-1006", title: "Gündoğan'da yeni teslim ikiz villa", district: "bodrum", neighborhood: "Gündoğan",
    summary: "Özel havuzlu, akıllı ev sistemli, plaja kısa mesafede ikiz villa.",
    type: "villa", price: 54_000_000, rooms: "4+1", gross: 260, net: 215, land: 480, age: 0, baths: 4,
    features: F({ pool: true, garden: true, seaView: true, parking: true, inSite: true }), deed: "Kat mülkiyeti", sea: 700, time: "day",
    publishedDaysAgo: 1, verified: ["grossSqm", "titleDeed"],
  },
  {
    code: "BD-1007", title: "Ortakent'te bahçeli müstakil ev", district: "bodrum", neighborhood: "Ortakent",
    summary: "Mandalina bahçesi içinde, aileler için sakin müstakil yaşam.",
    type: "detached", price: 24_500_000, rooms: "4+1", gross: 210, net: 180, land: 950, age: 9, baths: 3,
    features: F({ garden: true, parking: true, creditEligible: true }), deed: "Müstakil tapu", sea: 2100, time: "day",
    publishedDaysAgo: 21, verified: ["landSqm", "titleDeed"],
  },
  {
    code: "BD-1008", title: "Turgutreis'te denize sıfır site dairesi", district: "bodrum", neighborhood: "Turgutreis",
    summary: "Özel plajlı sitede, yazlık ya da yıl boyu kullanıma uygun daire.",
    type: "apartment", price: 11_200_000, rooms: "2+1", gross: 95, net: 80, age: 12, floor: "1. kat", baths: 1,
    features: F({ pool: true, seaView: true, parking: true, inSite: true, creditEligible: true }), deed: "Kat mülkiyeti", sea: 40, time: "golden",
    publishedDaysAgo: 11, verified: ["netSqm"],
  },
  {
    code: "BD-1009", title: "Konacık'ta yıl boyu yaşam için 3+1 daire", district: "bodrum", neighborhood: "Konacık",
    summary: "Okul, hastane ve merkeze yakın, yeni binada geniş daire.",
    type: "apartment", price: 8_900_000, rooms: "3+1", gross: 140, net: 118, age: 4, floor: "3. kat", baths: 2,
    features: F({ parking: true, inSite: true, creditEligible: true }), deed: "Kat mülkiyeti", time: "day",
    publishedDaysAgo: 3, verified: ["netSqm", "titleDeed", "buildingAge"],
  },
  {
    code: "BD-1010", title: "Mumcular'da köy içinde taş ev ve bağ", district: "bodrum", neighborhood: "Mumcular",
    summary: "Doğayla iç içe, sakin köy yaşamı için geniş arazili taş ev.",
    type: "detached", price: 9_750_000, rooms: "3+1", gross: 150, net: 125, land: 2600, age: 30, baths: 2,
    features: F({ garden: true, parking: true }), deed: "Müstakil tapu", time: "golden",
    publishedDaysAgo: 18, verified: ["landSqm"],
  },
  {
    code: "BD-1011", title: "Mumcular'da imarlı bahçe arsası", district: "bodrum", neighborhood: "Mumcular",
    summary: "Konut imarlı, elektrik ve suya yakın düz arazi.",
    type: "land", price: 4_600_000, land: 1800,
    features: F({}), deed: "Müstakil tapu", time: "day",
    publishedDaysAgo: 26, verified: ["landSqm"],
  },
  {
    code: "BD-1012", title: "Yalıkavak'ta site içinde dubleks villa", district: "bodrum", neighborhood: "Yalıkavak",
    summary: "Ortak havuz ve peyzajlı bahçeli sitede, deniz manzaralı dubleks.",
    type: "villa", price: 46_000_000, rooms: "3+1", gross: 210, net: 175, land: 350, age: 7, baths: 3,
    features: F({ pool: true, garden: true, seaView: true, parking: true, inSite: true }), deed: "Kat mülkiyeti", sea: 1100, time: "dusk",
    publishedDaysAgo: 8, verified: ["grossSqm", "titleDeed"],
  },
  {
    code: "BD-1013", title: "Akyarlar'da gün batımı manzaralı villa", district: "bodrum", neighborhood: "Akyarlar",
    summary: "Kos adası manzarasına bakan, rüzgâr korumalı teraslı villa.",
    type: "villa", price: 39_500_000, rooms: "4+1", gross: 240, net: 200, land: 700, age: 10, baths: 3,
    features: F({ pool: true, garden: true, seaView: true, parking: true }), deed: "Kat mülkiyeti", sea: 450, time: "golden",
    publishedDaysAgo: 13,
  },
  {
    code: "BD-1014", title: "Gürece'de bahçeli ikiz ev", district: "bodrum", neighborhood: "Gürece",
    summary: "Merkeze yakın, sakin konumda ailelere uygun ikiz ev.",
    type: "detached", price: 16_800_000, rooms: "3+1", gross: 170, net: 145, land: 400, age: 5, baths: 2,
    features: F({ garden: true, parking: true, creditEligible: true }), deed: "Kat mülkiyeti", sea: 2800, time: "day",
    publishedDaysAgo: 5, verified: ["grossSqm", "titleDeed"],
  },
  {
    code: "BD-1015", title: "Kumbahçe'de yürüyerek merkeze 1+1", district: "bodrum", neighborhood: "Kumbahçe",
    summary: "Kaleye ve marinaya yürüme mesafesinde, yenilenmiş daire.",
    type: "apartment", price: 7_400_000, rooms: "1+1", gross: 62, net: 50, age: 18, floor: "Giriş katı", baths: 1,
    features: F({ furnished: true }), deed: "Kat mülkiyeti", sea: 250, time: "dusk",
    publishedDaysAgo: 30,
  },
  // ---- Milas ----
  {
    code: "ML-2001", title: "Güllük'te körfez manzaralı daire", district: "milas", neighborhood: "Güllük",
    summary: "Körfeze bakan balkonlu, havalimanına yakın yeni daire.",
    type: "apartment", price: 5_950_000, rooms: "2+1", gross: 105, net: 88, age: 2, floor: "2. kat", baths: 1,
    features: F({ seaView: true, parking: true, inSite: true, creditEligible: true }), deed: "Kat mülkiyeti", sea: 500, time: "golden",
    publishedDaysAgo: 7, verified: ["netSqm", "titleDeed"],
  },
  {
    code: "ML-2002", title: "Boğaziçi'nde havuzlu sitede villa", district: "milas", neighborhood: "Boğaziçi",
    summary: "Ortak havuzlu sitede, denize kısa mesafede müstakil bahçeli villa.",
    type: "villa", price: 21_500_000, rooms: "4+1", gross: 230, net: 190, land: 520, age: 6, baths: 3,
    features: F({ pool: true, garden: true, seaView: true, parking: true, inSite: true }), deed: "Kat mülkiyeti", sea: 800, time: "day",
    publishedDaysAgo: 10, verified: ["grossSqm", "landSqm", "titleDeed"],
  },
  {
    code: "ML-2003", title: "Milas merkezde geniş aile dairesi", district: "milas", neighborhood: "Milas Merkez",
    summary: "Okul ve çarşıya yakın, asansörlü binada 3+1.",
    type: "apartment", price: 3_850_000, rooms: "3+1", gross: 145, net: 125, age: 8, floor: "4. kat", baths: 2,
    features: F({ parking: true, creditEligible: true }), deed: "Kat mülkiyeti", time: "day",
    publishedDaysAgo: 4, verified: ["netSqm", "buildingAge"],
  },
  {
    code: "ML-2004", title: "Ören'de denize yakın müstakil yazlık", district: "milas", neighborhood: "Ören",
    summary: "Sakin sahil kasabasında bahçeli, deniz esintili yazlık ev.",
    type: "detached", price: 7_250_000, rooms: "3+1", gross: 135, net: 115, land: 600, age: 14, baths: 2,
    features: F({ garden: true, seaView: true, parking: true }), deed: "Müstakil tapu", sea: 400, time: "golden",
    publishedDaysAgo: 19,
  },
  {
    code: "ML-2005", title: "Kıyıkışlacık'ta zeytinlik arazi", district: "milas", neighborhood: "Kıyıkışlacık",
    summary: "Antik İassos'a yakın, zeytin ağaçlı tarla vasıflı arazi.",
    type: "land", price: 2_900_000, land: 4200,
    features: F({ seaView: true }), deed: "Müstakil tapu", time: "golden",
    publishedDaysAgo: 24, verified: ["landSqm"],
  },
  // ---- Proje daireleri (kanonik mülk olarak aramaya da çıkar) ----
  {
    code: "BD-3001", title: "Ege Teras Konakları · A2 · 2+1", district: "bodrum", neighborhood: "Konacık",
    summary: "Ege Teras Konakları projesinde teslime hazır 2+1 daire.",
    type: "apartment", price: 10_400_000, rooms: "2+1", gross: 112, net: 94, age: 0, floor: "1. kat", baths: 2,
    features: F({ pool: true, parking: true, inSite: true, creditEligible: true }), deed: "Kat mülkiyeti", time: "day",
    dev: "dev-ege-teras", publishedDaysAgo: 3, verified: ["grossSqm", "netSqm"],
  },
  {
    code: "BD-3002", title: "Yalı Koru Evleri · Villa 4", district: "bodrum", neighborhood: "Yalıkavak",
    summary: "Yalı Koru Evleri projesinde özel havuzlu villa.",
    type: "villa", price: 62_000_000, rooms: "4+1", gross: 280, net: 230, land: 600, age: 0, baths: 4,
    features: F({ pool: true, garden: true, seaView: true, parking: true, inSite: true }), deed: "Kat mülkiyeti", sea: 1300, time: "golden",
    dev: "dev-yali-koru", publishedDaysAgo: 2, verified: ["grossSqm"],
  },
  // ---- Yayında OLMAYAN kayıtlar: ziyaretçi bunları asla görmez (test için) ----
  {
    code: "BD-9001", title: "Taslak: Bitez villa", district: "bodrum", neighborhood: "Bitez",
    summary: "Partner taslağı.", type: "villa", price: 40_000_000, rooms: "4+1", gross: 250, net: 200, land: 600, age: 2,
    features: F({ pool: true, garden: true }), status: "draft",
  },
  {
    code: "BD-9002", title: "EİDS bekliyor: Türkbükü daire", district: "bodrum", neighborhood: "Göltürkbükü",
    summary: "Yetki belgesi doğrulaması bekleniyor.", type: "apartment", price: 19_000_000, rooms: "2+1", gross: 100, net: 85, age: 3,
    features: F({ seaView: true }), status: "pending_eids_verification",
  },
  {
    code: "BD-9003", title: "Satıldı: Ortakent daire", district: "bodrum", neighborhood: "Ortakent",
    summary: "Satıldı.", type: "apartment", price: 9_000_000, rooms: "2+1", gross: 100, net: 85, age: 5,
    features: F({}), status: "sold",
  },
  {
    code: "ML-9004", title: "İnceleme bekliyor: Güllük villa", district: "milas", neighborhood: "Güllük",
    summary: "Yönetici incelemesi bekliyor.", type: "villa", price: 18_000_000, rooms: "3+1", gross: 180, net: 150, land: 450, age: 4,
    features: F({ pool: true }), status: "pending_admin_review",
  },
];

const describe = (s: Seed) =>
  [
    s.summary,
    `${s.neighborhood} (${s.district === "bodrum" ? "Bodrum" : "Milas"}) konumundaki bu ${
      s.type === "land" ? "arsa" : "mülk"
    }, platform ekibinin ön incelemesinden geçmiş örnek bir ilandır.`,
    s.features.seaView ? "Yaşam alanlarının büyük bölümü deniz manzarasına bakar." : "Sakin bir konumda, gündelik ihtiyaçlara yakındır.",
    "Kesin adres ve tapu bilgileri, randevu onayından sonra platform yöneticisi tarafından paylaşılır.",
  ].join("\n\n");

export const properties: Property[] = seeds.map((s, i) => {
  const factSources: Property["factSources"] = {};
  for (const k of ["grossSqm", "netSqm", "landSqm", "buildingAge", "rooms", "titleDeed"] as const) {
    factSources[k] = (s.verified?.includes(k) ? "verified" : "declared") as FactSource;
  }
  const status = s.status ?? "published";
  return {
    id: `prop-${s.code.toLowerCase()}`,
    code: s.code,
    slug: `${slugify(s.title)}-${s.code.toLowerCase()}`,
    title: s.title,
    summary: s.summary,
    description: describe(s),
    district: s.district,
    neighborhood: s.neighborhood,
    type: s.type,
    status,
    price: s.price,
    rooms: s.rooms ?? null,
    grossSqm: s.gross ?? null,
    netSqm: s.net ?? null,
    landSqm: s.land ?? null,
    buildingAge: s.age ?? null,
    floor: s.floor ?? null,
    bathrooms: s.baths ?? null,
    features: s.features,
    factSources,
    titleDeed: s.deed ?? null,
    seaDistanceM: s.sea ?? null,
    scene: { seed: 101 + i * 37, time: s.time ?? "day", kind: s.type },
    sceneCount: s.type === "land" ? 3 : 5,
    developmentId: s.dev ?? null,
    publishedAt: status === "published" ? daysAgo(s.publishedDaysAgo ?? 10) : null,
    updatedAt: daysAgo(Math.max(0, (s.publishedDaysAgo ?? 10) - 1)),
  };
});
