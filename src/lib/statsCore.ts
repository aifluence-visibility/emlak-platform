/**
 * İstatistik çekirdeği: saf fonksiyonlar (sunucu bağımlılığı yok, `tests/stats.test.ts` ile test edilir).
 * Kurallar için bkz. `stats.ts` ve docs/ARCHITECTURE.md §3.
 */
import type { InterestEvent } from "./mock/interestEvents";

export type ListingStats = {
  views: number; // tekil (kişi, gün) görüntülemesi
  favorites: number; // şu an favorisinde tutan tekil kişi
  interestedBuyers: number; // bilgi/randevu talebi gönderen tekil kişi (ham değer — partnere gönderilmez)
};

export type PublicListingStats = {
  views: number;
  favorites: number;
  interested: string; // "0", "1–2", "3", "4"…
};

const dayKey = (iso: string) => iso.slice(0, 10);

export function aggregate(events: InterestEvent[], cutoff: string): Map<string, ListingStats> {
  const c = Date.parse(cutoff);
  const views = new Map<string, Set<string>>();
  const favState = new Map<string, Map<string, { at: number; on: boolean }>>();
  const interested = new Map<string, Set<string>>();

  for (const e of events) {
    if (Date.parse(e.at) > c) continue; // gecikme
    if (e.type === "view") {
      (views.get(e.propertyId) ?? views.set(e.propertyId, new Set()).get(e.propertyId)!).add(`${e.actorKey}|${dayKey(e.at)}`);
    } else if (e.type === "favorite_add" || e.type === "favorite_remove") {
      const m = favState.get(e.propertyId) ?? favState.set(e.propertyId, new Map()).get(e.propertyId)!;
      const t = Date.parse(e.at);
      const prev = m.get(e.actorKey);
      if (!prev || prev.at <= t) m.set(e.actorKey, { at: t, on: e.type === "favorite_add" });
    } else {
      (interested.get(e.propertyId) ?? interested.set(e.propertyId, new Set()).get(e.propertyId)!).add(e.actorKey);
    }
  }

  const ids = new Set([...views.keys(), ...favState.keys(), ...interested.keys()]);
  const out = new Map<string, ListingStats>();
  for (const id of ids) {
    out.set(id, {
      views: views.get(id)?.size ?? 0,
      favorites: [...(favState.get(id)?.values() ?? [])].filter((s) => s.on).length,
      interestedBuyers: interested.get(id)?.size ?? 0,
    });
  }
  return out;
}

/** Küçük sayılar tek bir alıcıyı ima etmesin */
export function bucketInterested(n: number) {
  if (n === 0) return "0";
  if (n <= 2) return "1–2";
  return String(n);
}

