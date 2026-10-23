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
