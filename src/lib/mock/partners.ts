import "server-only";
import type { PartnerOrganization, PartnerPropertyLink } from "@/lib/types";
import { properties } from "./properties";

/** ÖRNEK VERİ — kurgusal ofis adları. Gerçek bir işletmeyle ilgisi yoktur. */
export const partners: PartnerOrganization[] = [
  { id: "partner-a", name: "Örnek Emlak Ofisi A", district: "bodrum", status: "active", joinedAt: "2026-09-01" },
  { id: "partner-b", name: "Örnek Emlak Ofisi B", district: "bodrum", status: "active", joinedAt: "2026-09-12" },
  { id: "partner-c", name: "Örnek Emlak Ofisi C", district: "milas", status: "active", joinedAt: "2026-09-20" },
  { id: "partner-d", name: "Örnek Proje Geliştirici D", district: "bodrum", status: "active", joinedAt: "2026-10-02" },
];

/** Hangi partner hangi mülkü temsil ediyor. Bir mülkün birden çok partneri olabilir (brief §8). */
const assignments: Record<string, string[]> = {
  "partner-a": ["BD-1001", "BD-1003", "BD-1005", "BD-1007", "BD-1009", "BD-1012", "BD-1014", "BD-9001", "BD-9003"],
  "partner-b": ["BD-1002", "BD-1004", "BD-1006", "BD-1008", "BD-1010", "BD-1011", "BD-1013", "BD-1015", "BD-9002", "BD-1003"],
  "partner-c": ["ML-2001", "ML-2002", "ML-2003", "ML-2004", "ML-2005", "ML-9004"],
  "partner-d": ["BD-3001", "BD-3002"],
};

const byCode = new Map(properties.map((p) => [p.code, p]));

export const partnerPropertyLinks: PartnerPropertyLink[] = Object.entries(assignments).flatMap(([partnerId, codes]) =>
  codes.map((code, i) => {
    const p = byCode.get(code)!;
    const live = p.status === "published";
    return {
      id: `link-${partnerId}-${code.toLowerCase()}`,
      partnerId,
      propertyId: p.id,
      internalRef: `${partnerId.slice(-1).toUpperCase()}-${String(100 + i)}`,
      authorizationStatus: live ? "active" : p.status === "sold" ? "expired" : "pending",
      eidsStatus: live ? "simulated_verified" : p.status === "pending_eids_verification" ? "pending" : "not_started",
      authorizedFrom: "2026-09-15",
      authorizedUntil: "2027-03-15",
      partnerAskingPrice: p.price,
    } satisfies PartnerPropertyLink;
  }),
);

/** ÖRNEK: partnerlerin gösterim müsaitliği (alıcı/randevu bilgisi içermez) */
export const partnerAvailability: Record<string, { day: string; from: string; to: string }[]> = {
  "partner-a": [
    { day: "Pazartesi–Cuma", from: "10:00", to: "18:00" },
    { day: "Cumartesi", from: "11:00", to: "15:00" },
  ],
  "partner-b": [{ day: "Salı–Cumartesi", from: "09:30", to: "17:30" }],
  "partner-c": [{ day: "Pazartesi–Cumartesi", from: "10:00", to: "17:00" }],
  "partner-d": [{ day: "Her gün", from: "10:00", to: "19:00" }],
};

/** ÖRNEK: kurgusal ofis çalışanları */
export const partnerStaff: Record<string, { name: string; role: "owner" | "manager" | "staff" }[]> = {
  "partner-a": [
    { name: "Örnek Yönetici A", role: "owner" },
    { name: "Örnek Danışman A1", role: "staff" },
  ],
  "partner-b": [{ name: "Örnek Yönetici B", role: "owner" }],
  "partner-c": [
    { name: "Örnek Yönetici C", role: "owner" },
    { name: "Örnek Danışman C1", role: "staff" },
  ],
  "partner-d": [{ name: "Örnek Proje Sorumlusu D", role: "manager" }],
};
