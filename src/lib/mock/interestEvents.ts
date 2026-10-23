import "server-only";
import { properties } from "./properties";

/**
 * ÖRNEK VERİ — sentetik, anonim ilgi olayları.
 * Canlı sürümde kaynak: sayfa görüntüleme olayları (anonim ziyaretçi anahtarı, saklama süreli),
 * `buyer_favorites`, `buyer_requests` ve `viewing_request_items`. Bu ham olaylar partnere ASLA gösterilmez;
 * partner yalnızca `stats.ts` içindeki toplulaştırılmış sonucu görür.
 *
 * actorKey: anonim kişi anahtarı. Aynı kişi birden fazla cihazdan gelse bile giriş yaptığında
 * aynı anahtara bağlanır (canlıda: buyer_id; girişsiz ziyaretçide: dönen, tuzlu hash).
 */
export type InterestEvent = {
  propertyId: string;
  actorKey: string;
  type: "view" | "favorite_add" | "favorite_remove" | "inquiry" | "viewing_request";
  at: string; // ISO
};

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BASE = Date.parse("2026-10-21T21:00:00Z"); // örnek verinin "dün sonu"

export const interestEvents: InterestEvent[] = properties
  .filter((p) => p.status === "published")
  .flatMap((p, i) => {
    const r = rng(9000 + i * 131);
    const visitors = 12 + Math.floor(r() * 140);
    const out: InterestEvent[] = [];
    for (let v = 0; v < visitors; v++) {
      const actorKey = `anon-${i}-${v}`;
      const day = Math.floor(r() * 21);
      const t0 = BASE - day * 86_400_000 - Math.floor(r() * 80_000_000);
      // Aynı gün tekrar eden görüntülemeler (tekilleştirme testi)
      const repeats = 1 + Math.floor(r() * 4);
      for (let k = 0; k < repeats; k++) out.push({ propertyId: p.id, actorKey, type: "view", at: new Date(t0 + k * 60_000).toISOString() });
      if (r() < 0.12) {
        out.push({ propertyId: p.id, actorKey, type: "favorite_add", at: new Date(t0 + 300_000).toISOString() });
        // Ekle-çıkar-ekle döngüsü sayıyı şişirmemeli
        if (r() < 0.3) {
          out.push({ propertyId: p.id, actorKey, type: "favorite_remove", at: new Date(t0 + 400_000).toISOString() });
          out.push({ propertyId: p.id, actorKey, type: "favorite_add", at: new Date(t0 + 500_000).toISOString() });
        } else if (r() < 0.2) {
          out.push({ propertyId: p.id, actorKey, type: "favorite_remove", at: new Date(t0 + 400_000).toISOString() });
        }
      }
    }
    // İlgilenen alıcılar: bazıları birden çok talep gönderir (tek kişi sayılmalı)
    const interested = Math.floor(r() * r() * 9);
    for (let b = 0; b < interested; b++) {
      const actorKey = `anon-${i}-${b}`;
      const t = BASE - Math.floor(r() * 14) * 86_400_000;
      out.push({ propertyId: p.id, actorKey, type: "inquiry", at: new Date(t).toISOString() });
      if (r() < 0.5) out.push({ propertyId: p.id, actorKey, type: "viewing_request", at: new Date(t + 3_600_000).toISOString() });
      if (r() < 0.3) out.push({ propertyId: p.id, actorKey, type: "inquiry", at: new Date(t + 7_200_000).toISOString() });
    }
    // Gecikme testi: kesim anından SONRAKİ olaylar istatistiğe girmemeli
    out.push({ propertyId: p.id, actorKey: `anon-${i}-late`, type: "inquiry", at: new Date(BASE + 3_600_000).toISOString() });
    return out;
  });

export const STATS_CUTOFF = new Date(BASE).toISOString();
