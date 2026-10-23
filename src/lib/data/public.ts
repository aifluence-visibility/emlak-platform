import "server-only";
import type { Property, PublicDevelopment, PublicProperty } from "@/lib/types";
import { properties } from "@/lib/mock/properties";
import { developments, developmentUnits } from "@/lib/mock/developments";
import { citizenshipReviews } from "@/lib/mock/citizenship";
import { partnerPropertyLinks } from "@/lib/mock/partners";

/**
 * Ziyaretçiye açık veri katmanı.
 * - Yalnızca `published` ve en az bir AKTİF partner yetkisi olan mülkler döner (brief §8).
 * - Partner kimliği, iç referans, partner fiyatı, yetki/EİDS kayıtları ASLA dönmez.
 * Supabase aşamasında bu fonksiyonlar `public_properties` görünümü / RPC'lerine bağlanır.
 */

const devName = new Map(developments.map((d) => [d.id, d.name]));

function inCollection(propertyId: string) {
  const r = citizenshipReviews.find((c) => c.propertyId === propertyId);
  return !!r && r.status === "preliminarily_eligible" && r.adminApproved;
}

function hasActiveAuthorization(propertyId: string) {
  return partnerPropertyLinks.some((l) => l.propertyId === propertyId && l.authorizationStatus === "active");
}

/** Açıkça izin verilen alanları kopyalar (yasak alanların sızmaması için "omit" yerine "pick") */
function toPublic(p: Property): PublicProperty {
  return {
    id: p.id,
    code: p.code,
    slug: p.slug,
    title: p.title,
    summary: p.summary,
    description: p.description,
    district: p.district,
    neighborhood: p.neighborhood,
    type: p.type,
    price: p.price,
    rooms: p.rooms,
    grossSqm: p.grossSqm,
    netSqm: p.netSqm,
    landSqm: p.landSqm,
    buildingAge: p.buildingAge,
    floor: p.floor,
    bathrooms: p.bathrooms,
    features: p.features,
    factSources: p.factSources,
    titleDeed: p.titleDeed,
    seaDistanceM: p.seaDistanceM,
    scene: p.scene,
    sceneCount: p.sceneCount,
    developmentId: p.developmentId,
    publishedAt: p.publishedAt,
    updatedAt: p.updatedAt,
    inCitizenshipCollection: inCollection(p.id),
    developmentName: p.developmentId ? devName.get(p.developmentId) ?? null : null,
  };
}

export function listPublicProperties(): PublicProperty[] {
  return properties.filter((p) => p.status === "published" && hasActiveAuthorization(p.id)).map(toPublic);
}

export function getPublicProperty(slug: string) {
  return listPublicProperties().find((p) => p.slug === slug) ?? null;
}

export function getPublicPropertiesByCodes(codes: string[]) {
  const set = new Set(codes.map((c) => c.toUpperCase()));
  return listPublicProperties().filter((p) => set.has(p.code));
}

export function listCitizenshipCollection() {
  return listPublicProperties().filter((p) => p.inCitizenshipCollection);
}

export function listPublicDevelopments(): PublicDevelopment[] {
  return developments.map((d) => {
    const units = developmentUnits.filter((u) => u.developmentId === d.id);
    const prices = units.filter((u) => u.availability === "available" && u.price).map((u) => u.price!);
    return {
      ...d,
      unitCount: units.length,
      availableCount: units.filter((u) => u.availability === "available").length,
      priceFrom: prices.length ? Math.min(...prices) : null,
    };
  });
}

export function getPublicDevelopment(slug: string) {
  const d = listPublicDevelopments().find((x) => x.slug === slug);
  if (!d) return null;
  const published = new Map(listPublicProperties().map((p) => [p.id, p.slug]));
  const units = developmentUnits
    .filter((u) => u.developmentId === d.id)
    .map((u) => ({
      id: u.id,
      label: u.label,
      rooms: u.rooms,
      netSqm: u.netSqm,
      grossSqm: u.grossSqm,
      price: u.price,
      availability: u.availability,
      // Yalnızca yayında olan kanonik mülke bağlantı verilir
      propertySlug: u.propertyId ? published.get(u.propertyId) ?? null : null,
    }));
  return { development: d, units };
}

export function neighborhoods() {
  const map: Record<string, Set<string>> = { bodrum: new Set(), milas: new Set() };
  for (const p of listPublicProperties()) map[p.district].add(p.neighborhood);
  return { bodrum: [...map.bodrum].sort((a, b) => a.localeCompare(b, "tr")), milas: [...map.milas].sort((a, b) => a.localeCompare(b, "tr")) };
}
