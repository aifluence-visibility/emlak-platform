import "server-only";
import { interestEvents, STATS_CUTOFF } from "./mock/interestEvents";
import { aggregate, bucketInterested, type ListingStats, type PublicListingStats } from "./statsCore";

export type { PublicListingStats };

/**
 * Partner ilan istatistikleri — sahip kararı (2026-10-23):
 *  - Yalnızca partnerin KENDİ ilanları için; anonim ve toplulaştırılmış.
 *  - Gecikmeli: yalnızca kesim anına (önceki gün sonu) kadar olan olaylar sayılır.
 *  - Tekilleştirilmiş: aynı kişinin tekrarları sayıyı şişirmez.
 *  - İlgilenen alıcı sayısı 1 veya 2 ise "1–2" olarak gösterilir.
 * Canlıda: gece çalışan bir iş `listing_interest_daily` tablosunu doldurur; partner yalnızca
 * `partner_listing_stats()` RPC'si ile kendi satırlarını okur (ham olay tablosuna erişimi yoktur).
 */

let cache: Map<string, ListingStats> | null = null;

/** Partnere giden tek biçim: ham ilgilenen sayısı dışarı çıkmaz */
export function statsForProperties(propertyIds: string[]): Map<string, PublicListingStats> {
  cache ??= aggregate(interestEvents, STATS_CUTOFF);
  return new Map(
    propertyIds.map((id) => {
      const s = cache!.get(id) ?? { views: 0, favorites: 0, interestedBuyers: 0 };
      return [id, { views: s.views, favorites: s.favorites, interested: bucketInterested(s.interestedBuyers) }];
    }),
  );
}

export const statsCutoff = () => STATS_CUTOFF;
