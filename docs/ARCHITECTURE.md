# Mimari (ARCHITECTURE)

## 1. Genel bakış

```
Ziyaretçi / Alıcı ──► Next.js (Vercel) ──► Public katman ──► public_* görünümleri / RPC
Partner (davetli) ──► /partner        ──► Partner katmanı ──► yalnızca kendi partner_id kayıtları
Yönetici          ──► /admin          ──► Admin katmanı   ──► tüm tablolar + private şema (alıcı PII)
```

- **Şimdi (önizleme):** veriler `src/lib/mock/*` dosyalarında (sunucu tarafında, `server-only`). Her rol için ayrı veri katmanı var: `src/lib/data/public.ts`, sonraki aşamada `partner.ts` ve `admin.ts`.
- **Supabase aşamasında:** bu fonksiyonların içi Supabase sorgularıyla değişir; sayfalar değişmez. Yetki kontrolü veritabanında (RLS) ve sunucuda (server action) **ikisinde birden** yapılır.

## 2. Roller

| Rol | Erişim |
|---|---|
| `platform_superadmin` | Her şey: partnerler, ilanlar, alıcılar, yetkiler, yayın, randevular, anlaşmalar, denetim kayıtları |
| `platform_operator` | Atanan yönetim işleri; alıcı PII'sine yalnızca yetki verilirse |
| `partner_owner` / `partner_manager` | Yalnızca kendi organizasyonu, personeli ve kendi portföy bağlantıları |
| `partner_staff` | Kendi organizasyonu içinde sınırlı oluşturma/düzenleme |
| `buyer` (kayıtlı) | Kendi profili, favorileri, kayıtlı aramaları, talepleri |
| `guest` | Yayındaki envanter, filtreler, eşleştirme anketi, talep formu |

Rol bilgisi **kullanıcının düzenleyebildiği metadata'dan okunmaz**. `platform_roles` ve `partner_memberships` tablolarından, sunucuda doğrulanır.

## 3. Gizlilik kuralları (pazarlığa kapalı)

1. Partner hiçbir koşulda alıcı adı, telefonu, e-postası veya alıcı talep havuzunu göremez.
2. Partner diğer partnerlerin kimliğini, ilanlarını, taslaklarını, ticari veya komisyon verisini göremez.
3. Alıcı iletişim bilgisi yalnızca yetkili platform yöneticisindedir.
4. Public API, URL, JSON-LD, görsel metadata ve hata mesajlarında partner kimliği bulunmaz.
5. Yayında olmayan (taslak, inceleme bekleyen, süresi dolmuş) ilan hiçbir alıcı akışında görünmez.

### Sahip kararı: partnerin göreceği "uygun talep sayısı" (brief §9'dan bilinçli sapma)

Brief V1'de partnerin alıcı talebini **anonim olarak bile** sorgulayamamasını öneriyordu. Platform sahibi (2026-10-23) şu kararı verdi: **partner, kendi ilanlarının her birine kaç uygun talep olduğunu sayı olarak görebilir.** Uygulama sınırları:

- Yalnızca **toplam sayı** gösterilir (ör. "4 uygun talep"). Talep içeriği, kriterler, bütçe, tarih veya alıcı kimliği gösterilmez.
- Sayı, yöneticinin eşleştirme motorunun ürettiği `property_matches` tablosundan, **security definer bir RPC** ile hesaplanır: `partner_listing_demand_counts()`. Partner `property_matches` veya `buyer_requests` tablosunu doğrudan okuyamaz.
- RPC yalnızca çağıranın aktif partner bağlantısı olan mülkleri döndürür.
- **Küçük sayılarda tahmin riski:** 1–2 gibi değerler tek bir alıcıyı ima edebilir. Öneri: 3'ün altını "1–2" olarak göstermek. Sahip onayı bekleniyor.

### Sahip kararı: vatandaşlık koleksiyonu

Bir mülk koleksiyonda yalnızca `citizenship_reviews.status = 'preliminarily_eligible'` **ve** `admin_approved = true` olduğunda görünür. Fiyat tek başına hiçbir zaman yeterli değildir. Sabit bir TL/USD eşiği kodlanmaz; kontrol listesi kalemlerinden biri "güncel mevzuattaki asgari yatırım tutarı"dır.

## 4. Alan modeli (önerilen şema)

Ayrıntılı tipler: `src/lib/types.ts`. Tablo adları brief §10 ile birebir aynı.

**Kimlik ve organizasyon:** `profiles`, `platform_roles`, `partner_organizations`, `partner_memberships`, `partner_invitations`

**Envanter:**
- `properties` (kanonik mülk)
- `property_features`
- `property_media` (public bucket)
- `property_translations` (TR/EN/RU)
- `partner_property_links` (partner + yetki + iç fiyat; **public'e asla çıkmaz**)
- `property_authorization_checks` (EİDS ve belge kanıt metadata'sı)
- `property_price_history`
- `property_merge_reviews` (mükerrer kayıt kuyruğu)

**Projeler:** `developments`, `development_units` (opsiyonel `property_id` ile kanonik mülke bağlanır, böylece mükerrer envanter oluşmaz), `development_media` (render/fotoğraf türü), `development_partner_links`

**Vatandaşlık:** `citizenship_reviews`, `citizenship_evidence_metadata` (kanıt dosyaları private bucket'ta)

**Alıcı (private şema):** `private.buyers`, `private.buyer_contacts`, `buyer_requests`, `buyer_request_preferences`, `buyer_favorites`, `saved_searches`, `notification_preferences`

**Eşleştirme ve randevu:** `property_matches`, `viewing_requests`, `viewing_request_items`, `appointments`, `appointment_partner_assignments` (partnere giden **anonim** görünüm: mülk, tarih ve saat; alıcı yok), `appointment_status_history`

**Ticari (yalnızca yönetici):** `partner_agreements`, `referral_attributions`, `deal_progress`, `admin_tasks`, `audit_events`

**İlan yaşam döngüsü:** `draft → pending_partner_documents → pending_eids_verification → pending_admin_review → published → paused / expired / sold / archived`

## 5. Veri akışları

1. **İlan yayını:** Partner taslak oluşturur → belge yükler (private bucket) → EİDS doğrulaması (yöntem henüz doğrulanmadı) → yönetici incelemesi → `published`. Yetkinin süresi dolarsa ilan otomatik olarak `expired` olur ve eşleştirmeden çıkar.
2. **Alıcı talebi:** Form → server action (rate limit, rıza kaydı) → `private.buyers` + `buyer_requests` → eşleştirme motoru → `property_matches` (yalnızca yönetici okur) → partner yalnızca sayıyı görür.
3. **Randevu:** Alıcı bir veya birden çok ilan seçer → `viewing_requests` + `viewing_request_items` → yönetici partnerle iletişime geçer → `appointments` + `appointment_partner_assignments` (partner kendi mülkü için yalnızca saati görür) → durum geçmişi tutulur.

## 6. Kod yapısı

```
src/
  app/(site)/          Herkese açık site
    satilik/            Arama + [slug] detay
    projeler/           Proje listesi + [slug]
    vatandaslik/        TR/EN/RU koleksiyon + bana-uygun (koleksiyon içinde eşleştirme)
    eslestirme/         Bana Uygun Evi Bul
    favoriler/ karsilastir/ randevu-talebi/
  app/api/ilanlar       Public projeksiyon (favoriler/karşılaştırma için)
  components/           Scene (telifsiz SVG görsel), PropertyCard, MatchWizard, InquiryForm…
  lib/
    types.ts            Alan modeli
    data/public.ts      Ziyaretçi katmanı (izinli alanları tek tek seçer)
    mock/               ÖRNEK veri (server-only, kurgusal)
    matching.ts         Deterministik eşleştirme motoru
    filters.ts          URL tabanlı arama filtreleri
    i18n.ts, citizenshipCopy.ts   TR/EN/RU metinler
    store.ts            Önizleme: favori ve karşılaştırma (localStorage)
docs/                   Bu belgeler
supabase/migrations/    (Supabase aşamasında eklenecek)
```

## 7. RLS test matrisi (Supabase aşamasında otomatik test olacak)

Kimlikler: `admin`, `partner_a`, `partner_b`, `buyer_a`, `buyer_b`, `anon`.

| # | İşlem | admin | partner_a | partner_b | buyer_a | anon |
|---|---|---|---|---|---|---|
| 1 | `properties` yayındaki satırlar (public görünüm) | ✅ | ✅ | ✅ | ✅ | ✅ |
| 2 | Taslak / inceleme bekleyen mülk | ✅ | yalnızca kendi bağlantısı | yalnızca kendi bağlantısı | ❌ | ❌ |
| 3 | `partner_property_links` | ✅ | yalnızca `partner_id = A` | yalnızca B | ❌ | ❌ |
| 4 | Partner B'nin bağlantısını güncelleme | ✅ | ❌ (0 satır) | ✅ | ❌ | ❌ |
| 5 | `partner_organizations` listesi | ✅ | yalnızca kendisi | yalnızca kendisi | ❌ | ❌ |
| 6 | `private.buyers` / `buyer_contacts` | ✅ | ❌ (şema erişimi yok) | ❌ | yalnızca kendisi | ❌ |
| 7 | `buyer_requests` | ✅ | ❌ | ❌ | yalnızca kendisi | ❌ |
| 8 | `property_matches` doğrudan okuma | ✅ | ❌ | ❌ | ❌ | ❌ |
| 9 | `partner_listing_demand_counts()` RPC | — | yalnızca A'nın ilanları, yalnızca sayı | yalnızca B'ninkiler | ❌ | ❌ |
| 10 | `appointments` | ✅ | kendi mülkleri, alıcı alanları yok | kendi mülkleri | kendi randevuları | ❌ |
| 11 | `buyer_favorites` | ✅ | ❌ | ❌ | yalnızca kendisi | ❌ |
| 12 | Private bucket (tapu, yetki belgesi) | ✅ | yalnızca kendi klasörü | yalnızca kendi klasörü | ❌ | ❌ |
| 13 | `partner_agreements`, komisyon | ✅ | ❌ | ❌ | ❌ | ❌ |
| 14 | `citizenship_reviews` (kanıt notları) | ✅ | ❌ | ❌ | ❌ | ❌ |
| 15 | `audit_events` | ✅ | ❌ | ❌ | ❌ | ❌ |
| 16 | Hata mesajı / realtime kanalı sızıntısı | — | B verisi 0 | A verisi 0 | PII 0 | PII 0 |

Kabul ölçütü: partner_a, API, RPC, storage, realtime veya hata yanıtlarından partner_b'ye ait **sıfır** kayıt ve **sıfır** alıcı PII'si alır.
