# Yeniden Kullanım Denetimi (REUSE_AUDIT)

**Tarih:** 2026-10-23
**Kaynak (yalnızca okundu):** `aifluence-visibility/otogaleri-havuz` @ `3301f79` (main, shallow clone)
**Kural:** Galeri projesinde hiçbir dosya, dal, Supabase projesi veya Vercel dağıtımı değiştirilmedi. Eski Supabase'e bağlanılmadı.

## 1. İncelenen yığın

| Katman | Galeri projesi | Not |
|---|---|---|
| Framework | Next.js 15.5 (App Router), React 19 | Yeni projede aynı ana sürüm (15.5.28) |
| Dil | TypeScript (strict) | Aynı |
| Stil | CSS Modules + düz CSS, UI kütüphanesi yok | Brief Tailwind'i "doğrulandıktan sonra" öneriyordu; gerçek yığın CSS olduğu için **CSS + tasarım değişkenleri** ile devam edildi |
| Veri | `@supabase/ssr` 0.12, `@supabase/supabase-js` 2.117 | Yeni projede **henüz yok** (önizleme modu) |
| Kimlik | Supabase Auth, `middleware.ts` ile `/panel` koruması | Desen yeniden kullanılacak (Faz 1) |
| Sunucu işlevleri | `supabase/functions/admin-users`, `parse-listing` (AI) | Şimdilik alınmadı |
| Veritabanı | 13 migration: şema, RLS, eşleştirme, public API, seed, storage, admin, ai_usage | Desenler aktarılır, tablolar aktarılmaz |

İncelenen başlıca dosyalar: `src/middleware.ts`, `src/lib/{panel,site,format,constants,env,embed}.ts`, `src/lib/supabase/{client,server}.ts`, `src/app/panel/(app)/*`, `src/app/s/[key]/*`, `supabase/migrations/20261012000001…20261015000013`.

## 2. Yeniden kullanılan / uyarlanan modüller

| Galeri kaynağı | Yeni projedeki karşılığı | Durum |
|---|---|---|
| `migrations/…003_matching.sql` → `score_pair()` | `src/lib/matching.ts` | **Uyarlandı.** Zorunlu kriterler, "tam/yakın" ayrımı, okunur gerekçeler, `min_score = 60` korunarak emlak kriterlerine (bölge, bütçe, tür, oda, m², özellikler, güncellik) çevrildi. Supabase aşamasında SQL'e geri taşınacak |
| `app_settings` (puan ağırlıkları) | `DEFAULT_WEIGHTS` → ileride `match_settings` tablosu | Desen aynı |
| `request_contacts` ayrı tablo | `buyers` / `buyer_contacts` (özel şema) | Desen aynı, kural **daha sıkı**: yalnızca platform yöneticisi |
| `my_gallery_id()`, `is_super_admin()` (security definer, `search_path=''`) | `my_partner_id()`, `is_platform_admin()` | Faz 1 migration'larında |
| `guard_owner_change()` tetikleyicisi | Partner sahipliği değişmesin | Faz 1 |
| `guard_match_update()` | Eşleşme kaydını yalnızca motor yazar | Faz 4 |
| `revoke all … from anon` + `site_*` RPC'leri | Ziyaretçi yalnızca public görünüm/RPC | `src/lib/data/public.ts` aynı sınırı uyguluyor |
| `lib/format.ts` (`tl`, `tarih`) | `src/lib/format.ts` | Kopyalandı/uyarlandı |
| `KVKK_VERSION` + rıza zamanı | Form rıza alanı (önizlemede kayıt yok) | Faz 3 |
| Panel düzeni (`Nav.tsx`, alt menü), `PoolTable`, `MatchCard`, `MatchFilters` | Partner ve yönetici panelleri | Yapı örnek alınacak (sonraki aşama) |

## 3. Bilerek alınmayanlar

- **Ortak havuz modeli.** Galeride her üye diğer galerilerin araç ve taleplerini görüyor. Bu proje tam tersini istiyor: partnerler birbirini ve alıcı havuzunu görmez.
- **Araca özgü tablolar** (`vehicles`, `model_catalog`, kasa/vites/yakıt).
- **Sabit proje adresi ve anahtar.** `src/lib/env.ts` ve `.env.example` dosyalarında eski Supabase URL'i ve publishable anahtar varsayılan olarak yazılı. Publishable anahtar gizli değildir ama yeni projeye kesinlikle taşınmadı. Yeni projede değişken yoksa uygulama açıkça önizleme modunda çalışır.
- **Alan adına göre site yönlendirme (`middleware`).** Tek markalı site için gereksiz.
- **`contacts_admin_select` istisnası.** Galeride süper yöneticinin müşteri iletişimini okuması sonradan eklenmiş. Burada zaten varsayılan kural bu: alıcı verisini yalnızca yönetici okur.

## 4. Riskler

1. `otogaleri-havuz` içindeki sabit Supabase URL'i ve anahtarı kopyalanırsa yeni uygulama yanlışlıkla eski veritabanına bağlanabilir. **Önlem:** yeni projede varsayılan değer yok.
2. Galeri RLS'i "aynı galeri" bazlı. Burada aynı mülkü birden çok partner temsil edebiliyor (`partner_property_links`). Sahiplik kontrolü link üzerinden yapılmalı, mülk satırı üzerinden değil.
3. Eşleştirme galeride tetikleyiciyle çalışıyor. Emlakta alıcı talepleri yalnızca yöneticiye açık olduğundan motor `security definer` olarak çalışmalı ve sonuçları yalnızca yöneticiye yazmalı.
4. EİDS entegrasyonu doğrulanmadı. Önizlemedeki tüm EİDS durumları `simulated_verified` olarak işaretli ve gerçekmiş gibi gösterilmiyor.

## 5. Eksik erişim / açık konular

- Yeni GitHub reposu (`aifluence-visibility/emlak-platform`): bu oturumda oluşturma izni yok, kullanıcı oluşturacak.
- Yeni Supabase projesi: kullanıcı kararıyla henüz yok.
- Galeri Supabase şemasının canlı hâli incelenmedi; yalnızca repodaki migration'lar okundu (canlı veritabanına erişilmedi).
