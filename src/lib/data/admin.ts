import "server-only";
import { properties } from "@/lib/mock/properties";
import { partners, partnerPropertyLinks } from "@/lib/mock/partners";
import { citizenshipReviews } from "@/lib/mock/citizenship";
import { developments, developmentUnits, developmentPartnerLinks } from "@/lib/mock/developments";
import { buyers, buyerRequests, appointments, auditEvents, type BuyerRequest, type ViewingStatus } from "@/lib/mock/buyers";
import { interestEvents, STATS_CUTOFF } from "@/lib/mock/interestEvents";
import { aggregate } from "@/lib/statsCore";
import { listPublicProperties } from "./public";
import { matchAll, type Criteria } from "@/lib/matching";

/**
 * Yönetici veri katmanı — alıcı kişisel verisine (PII) erişen TEK katman.
 * Partner veya public katmanları bu dosyayı içe aktarmamalıdır (bkz. tests/isolation.test.ts).
 * Canlıda: yalnızca `is_platform_admin()` doğrulanmış oturumla, sunucu tarafında çalışır; PII okumaları audit_events'e yazılır.
 */

const partnerName = new Map(partners.map((p) => [p.id, p.name]));
const propByCode = new Map(properties.map((p) => [p.code, p]));
const propById = new Map(properties.map((p) => [p.id, p]));
const buyerById = new Map(buyers.map((b) => [b.id, b]));

export function criteriaOf(r: BuyerRequest): Criteria {
  return {
    districts: r.districts,
    neighborhoods: r.neighborhoods,
    budgetMax: r.budgetMax,
    types: r.types,
    roomsMin: r.roomsMin,
    netSqmMin: r.netSqmMin,
    features: r.features,
    citizenshipOnly: r.citizenship,
    strict: r.strict as Criteria["strict"],
  };
}

function matchesFor(r: BuyerRequest) {
  // Eşleştirme yalnızca yayındaki ve aktif yetkili envanterle yapılır (taslaklar asla önerilmez)
  return matchAll(criteriaOf(r), listPublicProperties());
}

const OPEN: BuyerRequest["status"][] = ["new", "contacted", "matching", "viewing", "negotiation"];

export function listBuyerRequests(status?: string) {
  return buyerRequests
    .filter((r) => (status === "acik" ? OPEN.includes(r.status) : status === "kapali" ? !OPEN.includes(r.status) : true))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .map((r) => {
      const m = OPEN.includes(r.status) ? matchesFor(r) : [];
      return {
        ...r,
        buyer: buyerById.get(r.buyerId)!,
        matchCount: m.length,
        exactCount: m.filter((x) => x.kind === "tam").length,
        bestScore: m[0]?.score ?? null,
        appointmentCount: appointments.filter((a) => a.requestId === r.id).length,
      };
    });
}

export function getBuyerRequest(id: string) {
  const r = buyerRequests.find((x) => x.id === id);
  if (!r) return null;
  return {
    request: r,
    buyer: buyerById.get(r.buyerId)!,
    matches: matchesFor(r),
    appointments: appointments.filter((a) => a.requestId === r.id),
    otherRequests: buyerRequests.filter((x) => x.buyerId === r.buyerId && x.id !== r.id),
  };
}

/** Eşleşme görünümü: hangi ilan kaç açık talebe uyuyor (yalnızca yönetici) */
export function matchOverview() {
  const open = buyerRequests.filter((r) => OPEN.includes(r.status));
  const perProperty = new Map<string, { exact: number; near: number; best: number; requests: string[] }>();
  for (const r of open) {
    for (const m of matchesFor(r)) {
      const e = perProperty.get(m.property.id) ?? { exact: 0, near: 0, best: 0, requests: [] };
      if (m.kind === "tam") e.exact++;
      else e.near++;
      e.best = Math.max(e.best, m.score);
      e.requests.push(r.code);
      perProperty.set(m.property.id, e);
    }
  }
  return listPublicProperties()
    .map((p) => ({ property: p, ...(perProperty.get(p.id) ?? { exact: 0, near: 0, best: 0, requests: [] }) }))
    .sort((a, b) => b.exact + b.near - (a.exact + a.near) || b.best - a.best);
}

function enrichAppointment(a: (typeof appointments)[number]) {
  const r = buyerRequests.find((x) => x.id === a.requestId)!;
  return {
    ...a,
    request: { id: r.id, code: r.code },
    buyer: buyerById.get(r.buyerId)!,
    items: a.items.map((i) => {
      const p = propByCode.get(i.propertyCode)!;
      return { ...i, title: p.title, slug: p.slug, neighborhood: p.neighborhood, partnerName: partnerName.get(i.partnerId) ?? "—" };
    }),
  };
}

export function listAppointments(status?: string) {
  return appointments
    .filter((a) => !status || a.status === status)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .map(enrichAppointment);
}

export function getAppointment(id: string) {
  const a = appointments.find((x) => x.id === id);
  return a ? enrichAppointment(a) : null;
}

function linksOf(propertyId: string) {
  return partnerPropertyLinks
    .filter((l) => l.propertyId === propertyId)
    .map((l) => ({ ...l, partnerName: partnerName.get(l.partnerId) ?? "—" }));
}

let rawStats: ReturnType<typeof aggregate> | null = null;
export function listAllProperties() {
  rawStats ??= aggregate(interestEvents, STATS_CUTOFF);
  return properties
    .map((p) => ({ ...p, links: linksOf(p.id), stats: rawStats!.get(p.id) ?? null, citizenship: citizenshipReviews.find((c) => c.propertyId === p.id) ?? null }))
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export function approvalQueue() {
  return listAllProperties().filter((p) => p.status.startsWith("pending_") || p.status === "draft");
}

export function getAdminProperty(id: string) {
  return listAllProperties().find((p) => p.id === id) ?? null;
}

export function listPartnersAdmin() {
  return partners.map((p) => {
    const links = partnerPropertyLinks.filter((l) => l.partnerId === p.id);
    return {
      ...p,
      listingCount: links.length,
      published: links.filter((l) => propById.get(l.propertyId)?.status === "published").length,
      activeAuth: links.filter((l) => l.authorizationStatus === "active").length,
      developments: developmentPartnerLinks.filter((d) => d.partnerId === p.id).length,
    };
  });
}

export function listCitizenshipReviews() {
  return citizenshipReviews
    .map((c) => ({ ...c, property: propById.get(c.propertyId)! }))
    .sort((a, b) => Number(a.adminApproved) - Number(b.adminApproved));
}

export function listDevelopmentsAdmin() {
  return developments.map((d) => ({
    ...d,
    units: developmentUnits.filter((u) => u.developmentId === d.id),
    partners: developmentPartnerLinks.filter((l) => l.developmentId === d.id).map((l) => partnerName.get(l.partnerId) ?? "—"),
  }));
}

export function adminDashboard() {
  const reqs = listBuyerRequests("acik");
  const appts = listAppointments();
  const upcoming = appts.filter((a) => ["requested", "contacting", "awaiting_partner_confirmation", "proposed", "confirmed"].includes(a.status));
  const cit = citizenshipReviews.filter((c) => !c.adminApproved && c.status !== "not_eligible");
  const expiring = partnerPropertyLinks.filter((l) => l.authorizationStatus === "active" && Date.parse(l.authorizedUntil) - Date.now() < 180 * 86_400_000);
  return {
    newRequests: reqs.filter((r) => r.status === "new"),
    openRequests: reqs.length,
    pendingApprovals: approvalQueue().filter((p) => p.status === "pending_admin_review" || p.status === "pending_eids_verification").length,
    upcoming,
    citizenshipPending: cit.length,
    expiringCount: expiring.length,
    published: properties.filter((p) => p.status === "published").length,
    audit: auditEvents.slice(0, 5),
  };
}

export function listAudit() {
  return auditEvents;
}

export const VIEWING_FLOW: ViewingStatus[] = ["requested", "contacting", "awaiting_partner_confirmation", "proposed", "confirmed", "completed"];
