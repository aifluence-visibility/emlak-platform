// Galeri projesindeki (otogaleri-havuz/src/lib/format.ts) biçimleyicilerden uyarlandı.

const nf = new Intl.NumberFormat("tr-TR");

export const tl = (n: number | null | undefined) => (n == null ? "Fiyat için bilgi alın" : nf.format(n) + " TL");

/** Kartlarda kısa fiyat: 118 Milyon TL, 13,9 Milyon TL */
export function tlShort(n: number | null | undefined) {
  if (n == null) return "Fiyat için bilgi alın";
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: m >= 100 ? 0 : 1 }).format(m)} Milyon TL`;
  }
  return tl(n);
}

export const sqm = (n: number | null | undefined) => (n == null ? "—" : nf.format(n) + " m²");

export const meters = (n: number | null | undefined) =>
  n == null ? null : n >= 1000 ? `${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 1 }).format(n / 1000)} km` : `${n} m`;

export const date = (d: string | null | undefined) =>
  d ? new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(d)) : "—";

export const age = (n: number | null) => (n == null ? "—" : n === 0 ? "Sıfır bina" : `${n} yıllık`);
