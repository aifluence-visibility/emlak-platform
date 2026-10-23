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
