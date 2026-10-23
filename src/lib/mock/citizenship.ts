import "server-only";
import type { CitizenshipCheck, CitizenshipReview } from "@/lib/types";

const all = (v: boolean): Record<CitizenshipCheck, boolean> => ({
  threshold_current_law: v,
  official_valuation: v,
  title_eligible: v,
  ownership_history: v,
  foreign_ownership_restrictions: v,
  sale_restriction_annotation: v,
  agency_rules: v,
});

/**
 * ÖRNEK VERİ. Koleksiyonda görünmek için İKİ koşul gerekir (sahip kararı):
 *   status === "preliminarily_eligible"  VE  adminApproved === true
 * Fiyat tek başına hiçbir zaman yeterli sayılmaz.
 */
export const citizenshipReviews: CitizenshipReview[] = [
  { propertyId: "prop-bd-1001", status: "preliminarily_eligible", adminApproved: true, checklist: all(true), reviewer: "Yönetici (örnek)", reviewedAt: "2026-10-10", expiresAt: "2027-01-10", note: null },
  { propertyId: "prop-bd-1002", status: "preliminarily_eligible", adminApproved: true, checklist: all(true), reviewer: "Yönetici (örnek)", reviewedAt: "2026-10-11", expiresAt: "2027-01-11", note: null },
  { propertyId: "prop-bd-1005", status: "preliminarily_eligible", adminApproved: true, checklist: all(true), reviewer: "Yönetici (örnek)", reviewedAt: "2026-10-12", expiresAt: "2027-01-12", note: null },
  { propertyId: "prop-bd-1006", status: "preliminarily_eligible", adminApproved: true, checklist: all(true), reviewer: "Yönetici (örnek)", reviewedAt: "2026-10-14", expiresAt: "2027-01-14", note: null },
  { propertyId: "prop-bd-1012", status: "preliminarily_eligible", adminApproved: true, checklist: all(true), reviewer: "Yönetici (örnek)", reviewedAt: "2026-10-15", expiresAt: "2027-01-15", note: null },
  { propertyId: "prop-bd-3002", status: "preliminarily_eligible", adminApproved: true, checklist: all(true), reviewer: "Yönetici (örnek)", reviewedAt: "2026-10-16", expiresAt: "2027-01-16", note: null },
  // Ön uygun ama yönetici onayı bekliyor → koleksiyonda GÖRÜNMEZ
  { propertyId: "prop-bd-1013", status: "preliminarily_eligible", adminApproved: false, checklist: { ...all(true), agency_rules: false }, reviewer: null, reviewedAt: null, expiresAt: null, note: "Son onay bekliyor" },
  { propertyId: "prop-bd-1004", status: "needs_documents", adminApproved: false, checklist: { ...all(false), threshold_current_law: true }, reviewer: null, reviewedAt: null, expiresAt: null, note: "Resmî değerleme raporu bekleniyor" },
  { propertyId: "prop-ml-2002", status: "under_review", adminApproved: false, checklist: all(false), reviewer: null, reviewedAt: null, expiresAt: null, note: null },
  { propertyId: "prop-bd-1015", status: "not_eligible", adminApproved: false, checklist: { ...all(true), threshold_current_law: false }, reviewer: "Yönetici (örnek)", reviewedAt: "2026-10-09", expiresAt: null, note: "Yatırım eşiği altında" },
];
