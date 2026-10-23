/**
 * Alan modeli. Tablo adları brief §10 ile birebir; Supabase aşamasında migration'lar bu tiplere göre yazılır.
 * Kural: "Public*" tipleri ziyaretçiye gidebilecek TEK biçimdir — partner kimliği, iç fiyat/komisyon,
 * alıcı bilgisi ve kesin adres içermez.
 */

export type District = "bodrum" | "milas";

export type PropertyType = "villa" | "apartment" | "detached" | "residence" | "land";

export type PropertyStatus =
  | "draft"
  | "pending_partner_documents"
  | "pending_eids_verification"
  | "pending_admin_review"
  | "published"
  | "paused"
  | "expired"
  | "sold"
  | "archived";

export type CitizenshipStatus =
  | "not_reviewed"
  | "under_review"
  | "preliminarily_eligible"
  | "needs_documents"
  | "not_eligible"
  | "expired_review";

/** Bir bilginin kaynağı: belgeyle doğrulandı mı, yoksa partner beyanı mı */
export type FactSource = "verified" | "declared";

export type Features = {
  pool: boolean;
  garden: boolean;
  seaView: boolean;
  parking: boolean;
  furnished: boolean;
  inSite: boolean; // site içinde
  creditEligible: boolean; // krediye uygun
};

/** Kanonik mülk (gerçek dünyadaki tek varlık) — brief §8 */
export type Property = {
  id: string;
  code: string; // herkese açık ilan kodu, örn. BD-1024
  slug: string;
  title: string;
  summary: string;
  description: string;
  district: District;
  neighborhood: string;
  type: PropertyType;
  status: PropertyStatus;
  price: number; // TL, ilan fiyatı
  rooms: string | null; // "3+1"
  grossSqm: number | null;
  netSqm: number | null;
  landSqm: number | null;
  buildingAge: number | null;
  floor: string | null;
  bathrooms: number | null;
  features: Features;
  factSources: Partial<Record<"grossSqm" | "netSqm" | "landSqm" | "buildingAge" | "rooms" | "titleDeed", FactSource>>;
  titleDeed: string | null; // tapu türü, ör. "Kat mülkiyeti"
  seaDistanceM: number | null;
  scene: SceneSpec;
  sceneCount: number;
  developmentId: string | null; // proje dairesi ise
  publishedAt: string | null;
  updatedAt: string;
};

/** Partner ile mülk arasındaki yetki ilişkisi — brief §8. Asla public'e çıkmaz. */
export type PartnerPropertyLink = {
  id: string;
  partnerId: string;
  propertyId: string;
  internalRef: string;
  authorizationStatus: "pending" | "active" | "expired" | "revoked";
  eidsStatus: "not_started" | "pending" | "simulated_verified";
  authorizedFrom: string;
  authorizedUntil: string;
  partnerAskingPrice: number;
};

export type PartnerOrganization = {
  id: string;
  name: string; // kurgusal
  district: District;
  status: "invited" | "active" | "suspended";
  joinedAt: string;
};

export type CitizenshipReview = {
  propertyId: string;
  status: CitizenshipStatus;
  adminApproved: boolean; // yönetici son onayı — fiyat tek başına yetmez
  checklist: Record<CitizenshipCheck, boolean>;
  reviewer: string | null;
  reviewedAt: string | null;
  expiresAt: string | null;
  note: string | null;
};

export type CitizenshipCheck =
  | "threshold_current_law"
  | "official_valuation"
  | "title_eligible"
  | "ownership_history"
  | "foreign_ownership_restrictions"
  | "sale_restriction_annotation"
  | "agency_rules";

export type DevelopmentStatus = "pre_launch" | "under_construction" | "completed";

export type Development = {
  id: string;
  slug: string;
  name: string;
  district: District;
  neighborhood: string;
  concept: string;
  description: string;
  developerLabel: string; // public'te gösterilecek kurgusal geliştirici adı
  status: DevelopmentStatus;
  deliveryEstimate: string; // "2027 Q2" — tahmin, taahhüt değil
  amenities: string[];
  paymentPlan: string | null;
  scene: SceneSpec;
  mediaKinds: ("render" | "photo")[]; // görsel türü ayrımı (brief §5)
  publishedAt: string;
};

export type DevelopmentUnit = {
  id: string;
  developmentId: string;
  label: string; // "A Blok · 2+1"
  rooms: string;
  netSqm: number;
  grossSqm: number;
  price: number | null; // null → "Fiyat için bilgi alın"
  availability: "available" | "reserved" | "sold";
  propertyId: string | null; // satışa açık ve onaylı ise kanonik mülke bağlı
};

/** Temsilî SVG sahnesinin parametreleri (telifsiz, kodla üretilir) */
export type SceneSpec = {
  seed: number;
  time: "day" | "golden" | "dusk";
  kind: PropertyType | "project";
};

// ---------------- Public projeksiyonlar ----------------

export type PublicProperty = Omit<Property, "status" | "factSources"> & {
  factSources: Property["factSources"];
  inCitizenshipCollection: boolean;
  developmentName: string | null;
};

export type PublicDevelopment = Development & {
  unitCount: number;
  availableCount: number;
  priceFrom: number | null;
};
