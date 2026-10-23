import "server-only";
import type { District, PropertyType } from "@/lib/types";
import type { FeatureKey } from "@/lib/matching";

/**
 * ÖRNEK VERİ — TAMAMEN KURGUSAL ALICILAR.
 * Adlar "Örnek Alıcı" biçiminde, telefonlar 555 000 00 xx (kullanılmayan aralık), e-postalar @example.invalid.
 * Canlıda bu bilgiler `private` şemada tutulur ve YALNIZCA platform yöneticisi okur (brief §3, §9).
 * Bu dosyayı yalnızca `src/lib/data/admin.ts` içe aktarabilir.
 */

export type Buyer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  nationality: string | null;
  language: "tr" | "en" | "ru";
  consentAt: string;
  consentVersion: string;
  marketingOptIn: boolean;
  createdAt: string;
};

export type BuyerRequestStatus = "new" | "contacted" | "matching" | "viewing" | "negotiation" | "closed_won" | "closed_lost";

export type BuyerRequest = {
  id: string;
  code: string;
  buyerId: string;
  source: "site_form" | "match_wizard" | "citizenship_wizard" | "listing_inquiry" | "phone";
  status: BuyerRequestStatus;
  districts: District[];
  neighborhoods: string[];
  budgetMax: number | null;
  types: PropertyType[];
  roomsMin: number | null;
  netSqmMin: number | null;
  features: FeatureKey[];
  strict: string[];
  citizenship: boolean;
  timing: string;
  financing: string | null;
  note: string | null;
  propertyCodes: string[]; // talep bir ilandan geldiyse
  createdAt: string;
  assignedAdmin: string;
};

export type ViewingStatus =
  | "requested"
  | "contacting"
  | "awaiting_partner_confirmation"
  | "proposed"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export type Appointment = {
  id: string;
  code: string;
  requestId: string;
  status: ViewingStatus;
  buyerAvailability: string;
  items: { propertyCode: string; partnerId: string; slot: string | null; partnerConfirmed: boolean }[];
  history: { at: string; status: ViewingStatus; by: string; note?: string }[];
  createdAt: string;
};

export type AuditEvent = { at: string; actor: string; action: string; target: string };

const d = (s: string) => new Date(s).toISOString();

export const buyers: Buyer[] = [
  { id: "b-01", name: "Örnek Alıcı 01", phone: "+90 555 000 00 01", email: "alici01@example.invalid", nationality: "TR", language: "tr", consentAt: d("2026-10-02T10:12:00Z"), consentVersion: "v1-2026-10", marketingOptIn: false, createdAt: d("2026-10-02T10:12:00Z") },
  { id: "b-02", name: "Örnek Alıcı 02", phone: "+90 555 000 00 02", email: "alici02@example.invalid", nationality: "DE", language: "en", consentAt: d("2026-10-05T14:40:00Z"), consentVersion: "v1-2026-10", marketingOptIn: true, createdAt: d("2026-10-05T14:40:00Z") },
  { id: "b-03", name: "Örnek Alıcı 03", phone: "+90 555 000 00 03", email: "alici03@example.invalid", nationality: "TR", language: "tr", consentAt: d("2026-10-07T09:05:00Z"), consentVersion: "v1-2026-10", marketingOptIn: false, createdAt: d("2026-10-07T09:05:00Z") },
  { id: "b-04", name: "Örnek Alıcı 04", phone: "+90 555 000 00 04", email: "alici04@example.invalid", nationality: "KZ", language: "ru", consentAt: d("2026-10-09T17:22:00Z"), consentVersion: "v1-2026-10", marketingOptIn: false, createdAt: d("2026-10-09T17:22:00Z") },
  { id: "b-05", name: "Örnek Alıcı 05", phone: "+90 555 000 00 05", email: "alici05@example.invalid", nationality: "GB", language: "en", consentAt: d("2026-10-11T11:00:00Z"), consentVersion: "v1-2026-10", marketingOptIn: true, createdAt: d("2026-10-11T11:00:00Z") },
  { id: "b-06", name: "Örnek Alıcı 06", phone: "+90 555 000 00 06", email: "alici06@example.invalid", nationality: "TR", language: "tr", consentAt: d("2026-10-13T08:30:00Z"), consentVersion: "v1-2026-10", marketingOptIn: false, createdAt: d("2026-10-13T08:30:00Z") },
  { id: "b-07", name: "Örnek Alıcı 07", phone: "+90 555 000 00 07", email: "alici07@example.invalid", nationality: "TR", language: "tr", consentAt: d("2026-10-15T19:45:00Z"), consentVersion: "v1-2026-10", marketingOptIn: false, createdAt: d("2026-10-15T19:45:00Z") },
  { id: "b-08", name: "Örnek Alıcı 08", phone: "+90 555 000 00 08", email: "alici08@example.invalid", nationality: "UA", language: "ru", consentAt: d("2026-10-17T12:10:00Z"), consentVersion: "v1-2026-10", marketingOptIn: false, createdAt: d("2026-10-17T12:10:00Z") },
  { id: "b-09", name: "Örnek Alıcı 09", phone: "+90 555 000 00 09", email: "alici09@example.invalid", nationality: "TR", language: "tr", consentAt: d("2026-10-19T15:15:00Z"), consentVersion: "v1-2026-10", marketingOptIn: true, createdAt: d("2026-10-19T15:15:00Z") },
  { id: "b-10", name: "Örnek Alıcı 10", phone: "+90 555 000 00 10", email: "alici10@example.invalid", nationality: "NL", language: "en", consentAt: d("2026-10-21T10:00:00Z"), consentVersion: "v1-2026-10", marketingOptIn: false, createdAt: d("2026-10-21T10:00:00Z") },
];

const base = { districts: [] as District[], neighborhoods: [] as string[], budgetMax: null, types: [] as PropertyType[], roomsMin: null, netSqmMin: null, features: [] as FeatureKey[], strict: [] as string[], citizenship: false, financing: null, note: null, propertyCodes: [] as string[], assignedAdmin: "Yönetici (örnek)" };

export const buyerRequests: BuyerRequest[] = [
  { ...base, id: "r-01", code: "T-0001", buyerId: "b-01", source: "match_wizard", status: "viewing", districts: ["bodrum"], budgetMax: 30_000_000, types: ["villa", "detached"], roomsMin: 3, features: ["pool", "garden"], strict: ["butce"], timing: "3 ay içinde", financing: "Peşin", createdAt: d("2026-10-02T10:12:00Z") },
  { ...base, id: "r-02", code: "T-0002", buyerId: "b-02", source: "citizenship_wizard", status: "matching", districts: ["bodrum"], budgetMax: 60_000_000, types: ["villa"], roomsMin: 4, features: ["pool", "seaView"], citizenship: true, timing: "6 ay içinde", note: "Vatandaşlık başvurusu planlıyor; hukuk danışmanı var.", createdAt: d("2026-10-05T14:40:00Z") },
  { ...base, id: "r-03", code: "T-0003", buyerId: "b-03", source: "site_form", status: "contacted", neighborhoods: ["Konacık", "Gürece"], budgetMax: 12_000_000, types: ["apartment"], roomsMin: 3, features: ["parking"], strict: ["bolge"], timing: "Hemen", financing: "Konut kredisi", createdAt: d("2026-10-07T09:05:00Z") },
  { ...base, id: "r-04", code: "T-0004", buyerId: "b-04", source: "citizenship_wizard", status: "viewing", districts: ["bodrum"], budgetMax: 35_000_000, types: ["residence", "apartment"], roomsMin: 2, features: ["seaView"], citizenship: true, timing: "1 ay içinde", createdAt: d("2026-10-09T17:22:00Z") },
  { ...base, id: "r-05", code: "T-0005", buyerId: "b-05", source: "listing_inquiry", status: "negotiation", propertyCodes: ["BD-1001"], districts: ["bodrum"], budgetMax: 125_000_000, types: ["villa"], roomsMin: 4, features: ["pool", "seaView"], timing: "Hemen", createdAt: d("2026-10-11T11:00:00Z") },
  { ...base, id: "r-06", code: "T-0006", buyerId: "b-06", source: "match_wizard", status: "new", districts: ["milas"], budgetMax: 7_000_000, types: ["apartment", "detached"], roomsMin: 2, features: ["seaView"], timing: "Yaz öncesi", createdAt: d("2026-10-13T08:30:00Z") },
  { ...base, id: "r-07", code: "T-0007", buyerId: "b-07", source: "site_form", status: "new", neighborhoods: ["Mumcular"], budgetMax: 12_000_000, types: ["detached", "land"], features: ["garden"], strict: ["bolge"], timing: "Acelesi yok", note: "Bağ evi / hobi bahçesi arıyor.", createdAt: d("2026-10-15T19:45:00Z") },
  { ...base, id: "r-08", code: "T-0008", buyerId: "b-08", source: "match_wizard", status: "matching", districts: ["bodrum"], budgetMax: 15_000_000, types: ["apartment"], roomsMin: 2, features: ["pool", "inSite"], timing: "3 ay içinde", createdAt: d("2026-10-17T12:10:00Z") },
  { ...base, id: "r-09", code: "T-0009", buyerId: "b-09", source: "listing_inquiry", status: "contacted", propertyCodes: ["BD-1003", "BD-1014"], districts: ["bodrum"], budgetMax: 18_000_000, types: ["apartment", "detached"], roomsMin: 2, features: ["garden"], timing: "1 ay içinde", financing: "Konut kredisi", createdAt: d("2026-10-19T15:15:00Z") },
  { ...base, id: "r-10", code: "T-0010", buyerId: "b-10", source: "phone", status: "new", districts: ["milas", "bodrum"], budgetMax: 25_000_000, types: ["villa"], roomsMin: 3, features: ["pool"], timing: "6 ay içinde", createdAt: d("2026-10-21T10:00:00Z") },
  { ...base, id: "r-11", code: "T-0011", buyerId: "b-01", source: "phone", status: "closed_lost", neighborhoods: ["Bitez"], budgetMax: 10_000_000, types: ["apartment"], roomsMin: 2, timing: "—", note: "Önceki arama; bütçe artırıldı ve T-0001 açıldı.", createdAt: d("2026-09-20T10:00:00Z") },
];

export const appointments: Appointment[] = [
  {
    id: "a-01", code: "R-0001", requestId: "r-01", status: "confirmed", buyerAvailability: "24–26 Ekim, öğleden sonra", createdAt: d("2026-10-16T10:00:00Z"),
    items: [
      { propertyCode: "BD-1007", partnerId: "partner-a", slot: "2026-10-25T11:00:00Z", partnerConfirmed: true },
      { propertyCode: "BD-1004", partnerId: "partner-b", slot: "2026-10-25T12:30:00Z", partnerConfirmed: true },
    ],
    history: [
      { at: d("2026-10-16T10:00:00Z"), status: "requested", by: "Alıcı (site)" },
      { at: d("2026-10-16T13:00:00Z"), status: "contacting", by: "Yönetici (örnek)" },
      { at: d("2026-10-17T09:00:00Z"), status: "awaiting_partner_confirmation", by: "Yönetici (örnek)", note: "İki ofise müsaitlik soruldu" },
      { at: d("2026-10-18T15:00:00Z"), status: "proposed", by: "Yönetici (örnek)" },
      { at: d("2026-10-19T08:30:00Z"), status: "confirmed", by: "Yönetici (örnek)", note: "Alıcıya program iletildi" },
    ],
  },
  {
    id: "a-02", code: "R-0002", requestId: "r-04", status: "awaiting_partner_confirmation", buyerAvailability: "28 Ekim tüm gün", createdAt: d("2026-10-18T09:00:00Z"),
    items: [
      { propertyCode: "BD-1005", partnerId: "partner-a", slot: null, partnerConfirmed: false },
      { propertyCode: "BD-1012", partnerId: "partner-a", slot: null, partnerConfirmed: false },
    ],
    history: [
      { at: d("2026-10-18T09:00:00Z"), status: "requested", by: "Alıcı (site)" },
      { at: d("2026-10-18T11:00:00Z"), status: "contacting", by: "Yönetici (örnek)" },
      { at: d("2026-10-19T10:00:00Z"), status: "awaiting_partner_confirmation", by: "Yönetici (örnek)" },
    ],
  },
  {
    id: "a-03", code: "R-0003", requestId: "r-05", status: "completed", buyerAvailability: "Esnek", createdAt: d("2026-10-12T09:00:00Z"),
    items: [{ propertyCode: "BD-1001", partnerId: "partner-a", slot: "2026-10-14T10:00:00Z", partnerConfirmed: true }],
    history: [
      { at: d("2026-10-12T09:00:00Z"), status: "requested", by: "Alıcı (ilan)" },
      { at: d("2026-10-12T12:00:00Z"), status: "confirmed", by: "Yönetici (örnek)" },
      { at: d("2026-10-14T12:00:00Z"), status: "completed", by: "Yönetici (örnek)", note: "Alıcı ikinci görüşme istiyor" },
    ],
  },
  {
    id: "a-04", code: "R-0004", requestId: "r-09", status: "requested", buyerAvailability: "Hafta sonu", createdAt: d("2026-10-21T16:00:00Z"),
    items: [
      { propertyCode: "BD-1003", partnerId: "partner-a", slot: null, partnerConfirmed: false },
      { propertyCode: "BD-1014", partnerId: "partner-a", slot: null, partnerConfirmed: false },
    ],
    history: [{ at: d("2026-10-21T16:00:00Z"), status: "requested", by: "Alıcı (favoriler)" }],
  },
  {
    id: "a-05", code: "R-0005", requestId: "r-02", status: "proposed", buyerAvailability: "2–4 Kasım", createdAt: d("2026-10-20T09:00:00Z"),
    items: [
      { propertyCode: "BD-1002", partnerId: "partner-b", slot: "2026-11-02T10:00:00Z", partnerConfirmed: true },
      { propertyCode: "BD-3002", partnerId: "partner-d", slot: "2026-11-02T13:00:00Z", partnerConfirmed: true },
      { propertyCode: "BD-1006", partnerId: "partner-b", slot: null, partnerConfirmed: false },
    ],
    history: [
      { at: d("2026-10-20T09:00:00Z"), status: "requested", by: "Alıcı (vatandaşlık)" },
      { at: d("2026-10-21T10:00:00Z"), status: "proposed", by: "Yönetici (örnek)", note: "Üçüncü mülk için ofis dönüşü bekleniyor" },
    ],
  },
  {
    id: "a-06", code: "R-0006", requestId: "r-11", status: "cancelled", buyerAvailability: "—", createdAt: d("2026-09-22T09:00:00Z"),
    items: [{ propertyCode: "BD-1015", partnerId: "partner-b", slot: null, partnerConfirmed: false }],
    history: [
      { at: d("2026-09-22T09:00:00Z"), status: "requested", by: "Alıcı (telefon)" },
      { at: d("2026-09-23T09:00:00Z"), status: "cancelled", by: "Yönetici (örnek)", note: "Alıcı bütçeyi değiştirdi" },
    ],
  },
];

export const auditEvents: AuditEvent[] = [
  { at: d("2026-10-21T10:05:00Z"), actor: "Yönetici (örnek)", action: "Alıcı iletişim bilgisi görüntülendi", target: "T-0010" },
  { at: d("2026-10-20T16:00:00Z"), actor: "Yönetici (örnek)", action: "Vatandaşlık ön incelemesi onaylandı", target: "BD-3002" },
  { at: d("2026-10-19T08:30:00Z"), actor: "Yönetici (örnek)", action: "Randevu onaylandı", target: "R-0001" },
  { at: d("2026-10-18T12:00:00Z"), actor: "Yönetici (örnek)", action: "İlan yayına alındı", target: "BD-1006" },
  { at: d("2026-10-17T09:40:00Z"), actor: "Yönetici (örnek)", action: "İlan reddedildi: yetki belgesi okunaksız", target: "BD-9002" },
];
