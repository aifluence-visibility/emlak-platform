import "server-only";
import type { DevelopmentStatus, District, PartnerPropertyLink, PropertyStatus, PropertyType, Features } from "@/lib/types";
import { properties } from "@/lib/mock/properties";
import { partners, partnerPropertyLinks, partnerAvailability, partnerStaff } from "@/lib/mock/partners";
import { developments, developmentUnits, developmentPartnerLinks } from "@/lib/mock/developments";
import { statsForProperties, statsCutoff, type PublicListingStats } from "@/lib/stats";

/**
 * Partner (emlakçı) veri katmanı.
 * KURAL: Her fonksiyon partnerId alır ve yalnızca o partnerin bağlantılı kayıtlarını döndürür.
 * Bu dosya alıcı, talep, eşleşme, randevu veya başka partner verisi İÇE AKTARMAZ — sızdırmak için
 * erişimi de yoktur. Canlıda partnerId oturumdan (sunucuda) okunur; RLS aynı kuralı veritabanında uygular.
 */

export type PartnerOrgView = { id: string; name: string; district: District; status: string; joinedAt: string };

export type PartnerListing = {
  propertyId: string;
  code: string;
  slug: string;
  title: string;
  district: District;
  neighborhood: string;
  type: PropertyType;
  status: PropertyStatus;
  price: number;
  rooms: string | null;
  grossSqm: number | null;
  netSqm: number | null;
  landSqm: number | null;
  buildingAge: number | null;
  floor: string | null;
  bathrooms: number | null;
  titleDeed: string | null;
  summary: string;
  features: Features;
  scene: (typeof properties)[number]["scene"];
  updatedAt: string;
  // Partnerin KENDİ bağlantısı (diğer partnerlerin bağlantıları asla eklenmez)
  link: Pick<PartnerPropertyLink, "internalRef" | "authorizationStatus" | "eidsStatus" | "authorizedFrom" | "authorizedUntil" | "partnerAskingPrice">;
  stats: PublicListingStats | null; // yalnızca yayındaki ilanlar için
};

export function isPartnerId(id: string | undefined | null): id is string {
  return !!id && partners.some((p) => p.id === id && p.status === "active");
}

export function getPartnerOrg(partnerId: string): PartnerOrgView | null {
  const p = partners.find((x) => x.id === partnerId);
  return p ? { id: p.id, name: p.name, district: p.district, status: p.status, joinedAt: p.joinedAt } : null;
}

/** Önizleme kimlik seçici için ad listesi. Canlıda YOKTUR (partner diğer partnerleri göremez). */
export function previewPartnerChoices() {
  return partners.filter((p) => p.status === "active").map((p) => ({ id: p.id, name: p.name }));
}

export function listPartnerPortfolio(partnerId: string): PartnerListing[] {
  const own = partnerPropertyLinks.filter((l) => l.partnerId === partnerId);
  const byId = new Map(properties.map((p) => [p.id, p]));
  const stats = statsForProperties(own.map((l) => l.propertyId));
  return own
    .map((l) => {
      const p = byId.get(l.propertyId)!;
      return {
        propertyId: p.id,
        code: p.code,
        slug: p.slug,
        title: p.title,
        district: p.district,
        neighborhood: p.neighborhood,
        type: p.type,
        status: p.status,
        price: p.price,
        rooms: p.rooms,
        grossSqm: p.grossSqm,
        netSqm: p.netSqm,
        landSqm: p.landSqm,
        buildingAge: p.buildingAge,
        floor: p.floor,
        bathrooms: p.bathrooms,
        titleDeed: p.titleDeed,
        summary: p.summary,
        features: p.features,
        scene: p.scene,
        updatedAt: p.updatedAt,
        link: {
          internalRef: l.internalRef,
          authorizationStatus: l.authorizationStatus,
          eidsStatus: l.eidsStatus,
          authorizedFrom: l.authorizedFrom,
          authorizedUntil: l.authorizedUntil,
          partnerAskingPrice: l.partnerAskingPrice,
        },
        stats: p.status === "published" ? stats.get(p.id)! : null,
      };
    })
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

/** Partnerin bağlantısı yoksa null — başka partnerin ilanı "bulunamadı" olur (varlığı bile sızmaz) */
export function getPartnerListing(partnerId: string, propertyId: string) {
  return listPartnerPortfolio(partnerId).find((l) => l.propertyId === propertyId) ?? null;
}

export function partnerSummary(partnerId: string) {
  const list = listPartnerPortfolio(partnerId);
  const published = list.filter((l) => l.status === "published");
  const pending = list.filter((l) => l.status.startsWith("pending_") || l.status === "draft");
  const expiringSoon = list.filter(
    (l) => l.link.authorizationStatus === "active" && Date.parse(l.link.authorizedUntil) - Date.now() < 60 * 86_400_000,
  );
  return {
    total: list.length,
    published: published.length,
    pending: pending.length,
    expiringSoon,
    views: published.reduce((s, l) => s + (l.stats?.views ?? 0), 0),
    favorites: published.reduce((s, l) => s + (l.stats?.favorites ?? 0), 0),
    cutoff: statsCutoff(),
    recent: list.slice(0, 5),
  };
}

export type PartnerDevelopment = {
  id: string;
  slug: string;
  name: string;
  neighborhood: string;
  district: District;
  status: DevelopmentStatus;
  deliveryEstimate: string;
  units: { id: string; label: string; rooms: string; netSqm: number; price: number | null; availability: string; listed: boolean }[];
};

export function listPartnerDevelopments(partnerId: string): PartnerDevelopment[] {
  const ids = new Set(developmentPartnerLinks.filter((l) => l.partnerId === partnerId).map((l) => l.developmentId));
  return developments
    .filter((d) => ids.has(d.id))
    .map((d) => ({
      id: d.id,
      slug: d.slug,
      name: d.name,
      neighborhood: d.neighborhood,
      district: d.district,
      status: d.status,
      deliveryEstimate: d.deliveryEstimate,
      units: developmentUnits
        .filter((u) => u.developmentId === d.id)
        .map((u) => ({ id: u.id, label: u.label, rooms: u.rooms, netSqm: u.netSqm, price: u.price, availability: u.availability, listed: !!u.propertyId })),
    }));
}

export function getPartnerAvailability(partnerId: string) {
  return partnerAvailability[partnerId] ?? [];
}

export function getPartnerStaff(partnerId: string) {
  return partnerStaff[partnerId] ?? [];
}
