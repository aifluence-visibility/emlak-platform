import type { District, Features, PropertyType } from "./types";

export const DISTRICT: Record<District, string> = { bodrum: "Bodrum", milas: "Milas" };

export const TYPE: Record<PropertyType, string> = {
  villa: "Villa",
  apartment: "Daire",
  detached: "Müstakil ev",
  residence: "Rezidans",
  land: "Arsa",
};

export const FEATURE: Record<keyof Features, string> = {
  pool: "Havuz",
  garden: "Bahçe",
  seaView: "Deniz manzarası",
  parking: "Otopark",
  furnished: "Eşyalı",
  inSite: "Site içinde",
  creditEligible: "Krediye uygun",
};

export const ROOMS = ["1+1", "2+1", "3+1", "4+1", "5+1"] as const;

export const SORTS = [
  { key: "onerilen", label: "Önerilen" },
  { key: "yeni", label: "En yeni" },
  { key: "fiyat-artan", label: "Fiyat (düşükten)" },
  { key: "fiyat-azalan", label: "Fiyat (yüksekten)" },
  { key: "m2", label: "Alan (büyükten)" },
] as const;

export const AVAILABILITY: Record<string, string> = { available: "Satışta", reserved: "Opsiyonlu", sold: "Satıldı" };

export const DEV_STATUS: Record<string, string> = {
  pre_launch: "Ön satış",
  under_construction: "İnşaat sürüyor",
  completed: "Teslim edildi",
};

export const STATUS: Record<string, string> = {
  draft: "Taslak",
  pending_partner_documents: "Belge bekleniyor",
  pending_eids_verification: "EİDS doğrulaması bekleniyor",
  pending_admin_review: "Yönetici incelemesinde",
  published: "Yayında",
  paused: "Durduruldu",
  expired: "Süresi doldu",
  sold: "Satıldı",
  archived: "Arşivde",
};

/** Yaşam döngüsü adımları (brief §7) */
export const LIFECYCLE = [
  "draft",
  "pending_partner_documents",
  "pending_eids_verification",
  "pending_admin_review",
  "published",
] as const;

export const AUTH_STATUS: Record<string, string> = {
  pending: "Yetki bekleniyor",
  active: "Yetki aktif",
  expired: "Yetki süresi doldu",
  revoked: "Yetki geri alındı",
};

export const EIDS_STATUS: Record<string, string> = {
  not_started: "Başlamadı",
  pending: "Bekliyor",
  simulated_verified: "Doğrulandı (simülasyon)",
};

/** Başlangıç bölgeleri (sahip: Bodrum, Mumcular, Milas; yenileri eklenecek) */
export const NEIGHBORHOODS: Record<"bodrum" | "milas", string[]> = {
  bodrum: ["Akyarlar", "Bitez", "Göltürkbükü", "Gümüşlük", "Gündoğan", "Gürece", "Konacık", "Kumbahçe", "Mumcular", "Ortakent", "Torba", "Turgutreis", "Yalıkavak"],
  milas: ["Boğaziçi", "Güllük", "Kıyıkışlacık", "Milas Merkez", "Ören"],
};
