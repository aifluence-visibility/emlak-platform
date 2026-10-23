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

### Sahip kararı: partner ilan istatistikleri (2026-10-23, önceki "uygun talep sayısı" kararının yerine)

Partner, **yalnızca kendi portföyündeki** her ilan için şu üç sayıyı görür:

| Gösterge | Tanım | Tekilleştirme |
|---|---|---|
| Görüntülenme | İlan detay sayfası görüntülemesi | Aynı kişinin aynı gündeki tekrarları 1 sayılır (kişi-gün) |
| Favoriye eklenme | Şu an favorisinde tutan kişi sayısı | Ekle-çıkar-ekle döngüsü sayıyı artırmaz; kişinin son durumu esas alınır |
| İlgilenen alıcı | Bilgi veya randevu talebi gönderen kişi | Aynı kişinin birden çok talebi 1 sayılır; **1–2 ise "1–2"** gösterilir |

- **Gecikmeli:** yalnızca önceki gün sonuna kadarki olaylar sayılır; anlık hareket partnere yansımaz.
- **Anonim ve toplulaştırılmış:** partner ham olayları, alıcı adını, telefonunu, e-postasını, arama kriterlerini, taleplerini, eşleşme ayrıntılarını ve randevu bilgilerini **görmez**.
- **İzolasyon:** başka partnerin ilanı veya istatistiği hiçbir yanıtta yer almaz. Partnerin bağlantısı olmayan bir mülk "bulunamadı" (404) döner; varlığı bile sızmaz.
- **Uygulama (önizleme):** `src/lib/stats.ts` (`aggregate`, `bucketInterested`) ve `src/lib/data/partner.ts`. Ham ilgilenen sayısı partner katmanına hiç çıkmaz; yalnızca kova değeri çıkar.
- **Uygulama (canlı):** ham olaylar `private.interest_events` tablosunda (saklama süreli; anonim ziyaretçi anahtarı dönen ve tuzlu hash). Gece çalışan bir iş `listing_interest_daily` tablosunu doldurur. Partner yalnızca `public.partner_listing_stats()` RPC'sini çağırabilir (security definer, `auth.uid()` → partner üyeliği → yalnızca aktif bağlantılı mülkler; kova uygulanmış değer).
- **Randevular:** sahip kararıyla partner panelinde randevu bilgisi **gösterilmez**. Partner yalnızca genel **gösterim müsaitliğini** bildirir; görüntüleme gerektiğinde platform ekibi partnerle doğrudan iletişime geçer.

### Sahip kararı: vatandaşlık koleksiyonu

Bir mülk koleksiyonda yalnızca `citizenship_reviews.status = 'preliminarily_eligible'` **ve** `admin_approved = true` olduğunda görünür. Fiyat tek başına hiçbir zaman yeterli değildir. Sabit bir TL/USD eşiği kodlanmaz; kontrol listesi kalemlerinden biri "güncel mevzuattaki asgari yatırım tutarı"dır.

### Eşleştirme kuralları (galeri `score_pair` uyarlaması)

- Ağırlıklar (toplam 100): bölge 25, bütçe 25, tür 15, oda 12, alan 8, özellikler 10, güncellik 5. Alt sınır %60.
- **Öneri dışı (kesin işaretlenmese bile):** ilgisiz tür (ör. villa arayana daire; benzer tür villa↔müstakil, daire↔rezidans yarım puan alır) ve bütçeyi **%25'ten fazla** aşan ilan.
- "Kesin" işaretli kriter: 1 birim uymayan bile elenir.
- "Tam uyum" yalnızca belirtilen tüm kriterler birebir uyduğunda verilir.
- Testler: `tests/matching.test.ts`.

### Veritabanı seviyesinde izolasyon (supabase/migrations)

Müşteri verisinin emlakçılardan ayrılması üç bağımsız katmanla sağlanır. Herhangi biri hatalı olsa bile diğerleri veriyi korur:

1. **Şema yetkisi:** Alıcı kişisel verileri, talepler, eşleşmeler, randevular, ham ilgi olayları, sözleşmeler ve denetim kayıtları `private` şemasındadır. `anon` ve `authenticated` rollerinin bu şemada `USAGE` yetkisi bile yoktur. Tablo adı bilinse de sorgu "permission denied for schema private" ile reddedilir. Bu şema Supabase Data API'de açılmaz.
2. **RLS (varsayılan reddet):** `public` şemadaki her tabloda RLS açıktır. İstemci yetkileri önce tamamen kaldırılır, sonra tablo ve sütun bazında yalnızca gerekenler verilir. Partner koşulları her zaman `app.my_partner_ids()` ile sunucuda hesaplanır; kullanıcının değiştirebileceği metadata kullanılmaz. RLS yardımcıları Data API'de açık olmayan `app` şemasındadır.
3. **Fonksiyon sınırı:** Yönetici alıcı verisine yalnızca `admin_*` RPC'leriyle ulaşır. Bu fonksiyonlar yöneticiliği doğrular; kişisel veri için ayrıca `can_view_pii` yetkisi arar ve her okumayı `private.audit_events` tablosuna yazar. Partner RPC'leri (`partner_*`) alıcı tablolarını hiç okumaz. İstatistik fonksiyonu yalnızca kova uygulanmış sayı döndürür.

Ek kurallar (tetikleyicilerle):
- Partner ilanını kendisi yayınlayamaz, "doğrulandı" işaretini koyamaz, yetki veya EİDS durumunu değiştiremez.
- Çoklu partnerli ilanın kanonik kaydını tek bir partner değiştiremez.
- Yayın için aktif yetki, doğrulanmış EİDS ve doğrulanmış yetki belgesi zorunludur.

**Security definer:** Yalnızca gerektiği yerde kullanılır; her fonksiyonun gerekçesi `docs/SECURITY_DEFINER.md` içindedir.

**Testler:** `supabase/tests/rls_isolation.test.sql` 123 kontrol içerir; bunların bir kısmı definer listesinin ve yetkilerinin değişmediğini denetler. Yerelde `npm run db:test` ile çalışır. Kasıtlı açık eklenerek denendi: herkese açık partner bağlantısı, `private` şemanın açılması, taslakların ziyaretçiye açılması, ofis listesinin açılması ve kovanın kaldırılması. Beşi de yakalandı. Definer denetimi için ayrıca 3 kasıtlı ihlal denendi: ziyaretçiye yönetici fonksiyonu açma, `search_path`'siz yeni fonksiyon ve yardımcıyı ziyaretçiye açma. Üçü de yakalandı.

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

**Eşleştirme ve randevu:** `property_matches`, `viewing_requests`, `viewing_request_items`, `appointments`, `appointment_partner_assignments` (yalnızca yönetici; partner randevu görmez), `partner_availability`, `appointment_status_history`

**Ticari (yalnızca yönetici):** `partner_agreements`, `referral_attributions`, `deal_progress`, `admin_tasks`, `audit_events`

**İlan yaşam döngüsü:** `draft → pending_partner_documents → pending_eids_verification → pending_admin_review → published → paused / expired / sold / archived`

## 5. Veri akışları

1. **İlan yayını:** Partner taslak oluşturur → belge yükler (private bucket) → EİDS doğrulaması (yöntem henüz doğrulanmadı) → yönetici incelemesi → `published`. Yetkinin süresi dolarsa ilan otomatik olarak `expired` olur ve eşleştirmeden çıkar.
2. **Alıcı talebi:** Form → server action (rate limit, rıza kaydı) → `private.buyers` + `buyer_requests` → eşleştirme motoru → `property_matches` (yalnızca yönetici okur). Partner bu akıştan hiçbir şey görmez; yalnızca gecikmeli ilgi istatistikleri.
3. **Randevu:** Alıcı bir veya birden çok ilan seçer → `viewing_requests` + `viewing_request_items` → yönetici partnerle iletişime geçer → `appointments` + `appointment_partner_assignments` → durum geçmişi tutulur. Partner randevu kaydını görmez.

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

Önizlemede kod katmanı sınırı `tests/isolation.test.ts` ile korunur: `src/app/(site)`, `src/app/partner` ve `src/app/api` altındaki hiçbir dosya, dolaylı import zinciriyle bile `src/lib/mock/buyers.ts` veya `src/lib/data/admin.ts` dosyasına ulaşamaz.

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
| 9 | `partner_listing_stats()` RPC | — | yalnızca A'nın ilanları; görüntülenme, favori, ilgilenen (1–2 kovası) | yalnızca B'ninkiler | ❌ | ❌ |
| 10 | `appointments` | ✅ | ❌ (sahip kararı) | ❌ | kendi randevuları | ❌ |
| 11 | `buyer_favorites` | ✅ | ❌ | ❌ | yalnızca kendisi | ❌ |
| 12 | Private bucket (tapu, yetki belgesi) | ✅ | yalnızca kendi klasörü | yalnızca kendi klasörü | ❌ | ❌ |
| 13 | `partner_agreements`, komisyon | ✅ | ❌ | ❌ | ❌ | ❌ |
| 14 | `citizenship_reviews` (kanıt notları) | ✅ | ❌ | ❌ | ❌ | ❌ |
| 15 | `audit_events` | ✅ | ❌ | ❌ | ❌ | ❌ |
| 16 | Hata mesajı / realtime kanalı sızıntısı | — | B verisi 0 | A verisi 0 | PII 0 | PII 0 |

Kabul ölçütü: partner_a, API, RPC, storage, realtime veya hata yanıtlarından partner_b'ye ait **sıfır** kayıt ve **sıfır** alıcı PII'si alır.
