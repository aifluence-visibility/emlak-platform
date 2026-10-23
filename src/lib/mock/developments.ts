import "server-only";
import type { Development, DevelopmentUnit } from "@/lib/types";

/** ÖRNEK VERİ — kurgusal projeler. */
export const developments: Development[] = [
  {
    id: "dev-ege-teras",
    slug: "ege-teras-konaklari",
    name: "Ege Teras Konakları",
    district: "bodrum",
    neighborhood: "Konacık",
    concept: "Yıl boyu yaşam için teraslı, düşük yoğunluklu konut projesi",
    description:
      "Bodrum merkeze dakikalar mesafede, yamaç boyunca kademelenen üç bloktan oluşur. Ortak havuz, yürüyüş yolları ve kapalı otopark sunar. Tüm görseller mimari görselleştirmedir.",
    developerLabel: "Örnek Proje Geliştirici D",
    status: "under_construction",
    deliveryEstimate: "2027 2. çeyrek (tahmini)",
    amenities: ["Ortak havuz", "Kapalı otopark", "Fitness alanı", "Peyzajlı yürüyüş yolu", "7/24 güvenlik"],
    paymentPlan: "Peşinat ve teslime kadar taksit seçenekleri sunulmaktadır. Güncel koşullar için bilgi alın.",
    scene: { seed: 811, time: "day", kind: "project" },
    mediaKinds: ["render", "render", "render", "photo"],
    publishedAt: "2026-10-05",
  },
  {
    id: "dev-yali-koru",
    slug: "yali-koru-evleri",
    name: "Yalı Koru Evleri",
    district: "bodrum",
    neighborhood: "Yalıkavak",
    concept: "Özel havuzlu, sınırlı sayıda villadan oluşan butik proje",
    description:
      "Yalıkavak'ın yamaçlarında, her villası farklı açıdan deniz manzarası alacak şekilde konumlandırılmış 8 villalık butik proje.",
    developerLabel: "Örnek Proje Geliştirici D",
    status: "pre_launch",
    deliveryEstimate: "2028 1. çeyrek (tahmini)",
    amenities: ["Özel havuz", "Akıllı ev altyapısı", "Peyzaj tasarımı", "Misafir evi opsiyonu"],
    paymentPlan: null,
    scene: { seed: 977, time: "golden", kind: "project" },
    mediaKinds: ["render", "render", "render"],
    publishedAt: "2026-10-12",
  },
  {
    id: "dev-gulluk-bay",
    slug: "gulluk-koy-rezidans",
    name: "Güllük Koy Rezidans",
    district: "milas",
    neighborhood: "Güllük",
    concept: "Körfez manzaralı, havalimanına yakın rezidans",
    description: "Teslim edilmiş, iskânı alınmış iki bloktan oluşan rezidans projesi. Görseller gerçek fotoğraf ve görselleştirme karışıktır.",
    developerLabel: "Örnek Proje Geliştirici D",
    status: "completed",
    deliveryEstimate: "Teslim edildi",
    amenities: ["Açık havuz", "Çocuk oyun alanı", "Otopark", "Jeneratör"],
    paymentPlan: null,
    scene: { seed: 1201, time: "dusk", kind: "project" },
    mediaKinds: ["photo", "photo", "render"],
    publishedAt: "2026-09-28",
  },
];

export const developmentUnits: DevelopmentUnit[] = [
  { id: "u-et-a1", developmentId: "dev-ege-teras", label: "A Blok · 1+1", rooms: "1+1", netSqm: 58, grossSqm: 70, price: 6_900_000, availability: "available", propertyId: null },
  { id: "u-et-a2", developmentId: "dev-ege-teras", label: "A Blok · 2+1", rooms: "2+1", netSqm: 94, grossSqm: 112, price: 10_400_000, availability: "available", propertyId: "prop-bd-3001" },
  { id: "u-et-b1", developmentId: "dev-ege-teras", label: "B Blok · 2+1 bahçe", rooms: "2+1", netSqm: 98, grossSqm: 118, price: 11_300_000, availability: "reserved", propertyId: null },
  { id: "u-et-c1", developmentId: "dev-ege-teras", label: "C Blok · 3+1 dubleks", rooms: "3+1", netSqm: 145, grossSqm: 172, price: 16_200_000, availability: "available", propertyId: null },
  { id: "u-et-c2", developmentId: "dev-ege-teras", label: "C Blok · 3+1 çatı", rooms: "3+1", netSqm: 150, grossSqm: 178, price: null, availability: "sold", propertyId: null },
  { id: "u-yk-v1", developmentId: "dev-yali-koru", label: "Villa 1", rooms: "4+1", netSqm: 230, grossSqm: 280, price: null, availability: "available", propertyId: null },
  { id: "u-yk-v4", developmentId: "dev-yali-koru", label: "Villa 4", rooms: "4+1", netSqm: 230, grossSqm: 280, price: 62_000_000, availability: "available", propertyId: "prop-bd-3002" },
  { id: "u-yk-v7", developmentId: "dev-yali-koru", label: "Villa 7", rooms: "5+1", netSqm: 290, grossSqm: 350, price: null, availability: "reserved", propertyId: null },
  { id: "u-gk-a", developmentId: "dev-gulluk-bay", label: "A Blok · 2+1", rooms: "2+1", netSqm: 86, grossSqm: 104, price: 5_600_000, availability: "available", propertyId: null },
  { id: "u-gk-b", developmentId: "dev-gulluk-bay", label: "B Blok · 3+1", rooms: "3+1", netSqm: 120, grossSqm: 142, price: 7_350_000, availability: "available", propertyId: null },
];
