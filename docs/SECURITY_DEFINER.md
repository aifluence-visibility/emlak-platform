# SECURITY DEFINER fonksiyonları — gerekçe ve güvenlik kaydı

Sahip kararı (2026-10-23): `security definer` yalnızca gerçekten gerektiğinde kullanılır. Her biri bu belgede gerekçelendirilir.
Supabase Security Advisor uyarıları **görmezden gelinmez ve otomatik olarak güvenli kabul edilmez**; her uyarı kurulumda bu tabloyla tek tek karşılaştırılır (bkz. §6).

Bu belge `supabase/tests/rls_isolation.test.sql` §9 ile **birebir** eşleşir. Listeye fonksiyon eklenir/çıkarılırsa ya da bir fonksiyonun yetkisi genişlerse test başarısız olur.

## 1. Neden "definer"?

`security definer` fonksiyon, onu çağıran kullanıcının değil **sahibinin** (postgres) yetkisiyle çalışır. Üç meşru kullanım var:

1. **RLS yardımcıları:** Bir politika "bu kullanıcı yönetici mi / hangi ofisin üyesi?" diye sormak için `platform_roles` ve `partner_memberships` tablolarını okumalıdır. Bu tabloların kendi RLS'i vardır. Yardımcı invoker olsaydı politika kendi kendini çağırarak sonsuz döngüye girerdi ya da ziyaretçi bağlantı tablosunu okuyamadığı için "ilan canlı mı?" sorusuna cevap verilemezdi.
2. **Özel şemaya kontrollü giriş:** İstemci rollerinin `private` şemaya hiçbir yetkisi yoktur. Talep bırakma, randevu isteme veya yöneticinin alıcı listesini görmesi yalnızca, içinde yetki kontrolü yapan definer fonksiyonla mümkündür.
3. **İstemci yazmasının yan etkisi:** Partner ilan fiyatını değiştirdiğinde fiyat geçmişine ve eşleştirmeye yazılır; alıcı favori eklediğinde anonim ilgi olayı yazılır. İstemcinin bu tablolara doğrudan yazma yetkisi yoktur; tetikleyici definer olmalıdır.

Bu üç durum dışındaki fonksiyonlar **invoker**'dır. Örnek: eşleştirme puanı (`score_pair`), yönetici kontrolü (`require_admin`), denetim kaydı (`audit`), talep oluşturma iç fonksiyonu. Bunlar yalnızca zaten definer olan bir fonksiyonun içinden çağrılır; istemciye açık değildir.

## 2. Tüm definer fonksiyonlarda ortak önlemler

| Önlem | Uygulama | Testle doğrulanıyor mu? |
|---|---|---|
| `search_path` sabit | Hepsinde `set search_path = ''`; tüm nesneler şema adıyla (`public.`, `private.`, `app.`, `auth.`) yazılır. Kötü niyetli bir şemadaki aynı adlı nesneye yönlendirme yapılamaz | ✅ |
| Varsayılan çalıştırma yetkisi kaldırıldı | 006'nın sonunda `public`, `app` ve `private` şemalarındaki TÜM fonksiyonlardan `PUBLIC`, `anon` ve `authenticated` yetkisi kaldırılır; yalnızca aşağıdaki tablodaki roller geri verilir | ✅ |
| Data API'de görünürlük | Yalnızca `public` şeması açıktır. RLS yardımcıları `app`, iç fonksiyonlar `private` şemasındadır; RPC olarak çağrılamazlar | ✅ (public listesi sabit) |
| Çağıran kontrolü | `admin_*` → `private.require_admin()`; `partner_*` → üyelik/bağlantı kontrolü; alıcı → `auth.uid()` | ✅ |
| Kimlik kaynağı | Yalnızca `auth.uid()` (imzalı JWT). Kullanıcının düzenleyebildiği `user_metadata`/`app_metadata` hiç okunmaz | Kod incelemesi |
| View yok | `public`/`app` şemasında view yok (security definer view riski yok) | ✅ |

## 3. `app` şeması — RLS yardımcıları (Data API'de açık değil)

| Fonksiyon | Okuduğu tablolar | Çağırabilen | Döndürdüğü | Neden definer | Gizlilik notu |
|---|---|---|---|---|---|
| `is_platform_admin()` | `platform_roles` | authenticated | bool | `platform_roles` RLS'i bu fonksiyonu kullanır (döngü) | Yalnızca çağıranın kendi durumu |
| `is_superadmin()` | `platform_roles` | authenticated | bool | Aynı | Aynı |
| `my_partner_ids()` | `partner_memberships`, `partner_organizations` | authenticated | uuid kümesi | Üyelik RLS'i bu fonksiyonu kullanır | Yalnızca çağıranın aktif ofisleri; askıdaki ofis dönmez |
| `is_partner_member(uuid)` | `my_partner_ids()` üzerinden | authenticated | bool | Aynı | Başka ofisin üyelerini açığa çıkarmaz |
| `partner_role(uuid)` | `partner_memberships`, `partner_organizations` | authenticated | rol metni | Aynı | Yalnızca çağıranın rolü |
| `property_is_live(uuid)` | `properties`, `partner_property_links`, `partner_organizations` | anon, authenticated | bool | Ziyaretçi bağlantı tablosunu okuyamaz ama "ilan yayında mı?" kontrolü bağlantıya bağlıdır | Partner kimliği, fiyatı veya sayısı dönmez; yalnızca evet/hayır |
| `partner_links_property(uuid)` | `partner_property_links` | authenticated | bool | Bağlantı tablosu RLS'li | Başka ofisin bağlantısını göstermez |
| `partner_can_edit_property(uuid)` | `properties`, `partner_property_links` | authenticated | bool | Bağlantı sayısını (çoklu partner) saymak gerekir; partner diğer bağlantıları göremez | Sayının kendisi dönmez; yalnızca evet/hayır |
| `partner_links_development(uuid)` | `development_partner_links` | authenticated | bool | Aynı | Aynı |

Invoker yardımcılar (`app`): `slugify`, `try_uuid`, `bucket_interested`, `touch_updated_at`, `guard_*` tetikleyicileri.

## 4. `private` şeması — giriş noktaları (istemci çağıramaz)

| Fonksiyon | Tür | Yazdığı/okuduğu | Çağıran | Neden definer |
|---|---|---|---|---|
| `log_favorite_event()` | tetikleyici (`buyer_favorites`) | yazar: `private.interest_events` | alıcının favori ekleme/çıkarma işlemi | Alıcının özel şemaya yazma yetkisi yok. Kayıt yalnızca hash'lenmiş anonim anahtar içerir |
| `log_price_change()` | tetikleyici (`properties`) | yazar: `property_price_history` | fiyat değişikliği | İstemcinin geçmiş tablosuna yazma yetkisi yok (kayıt değiştirilemez) |
| `on_property_change()` / `on_link_change()` | tetikleyici | okur: `private.buyer_requests`; yazar: `private.property_matches` | ilan veya yetki değişikliği | Eşleştirme alıcı taleplerini okumalı. Partner sonucu **görmez**; tetikleyici hiçbir şey döndürmez |
| `on_request_change()` | tetikleyici (`private.buyer_requests`) | yazar: `private.property_matches` | talep değişikliği | Aynı |
| `refresh_interest_snapshot(timestamptz)` | gece işi | okur: `interest_events`; yazar: `listing_interest_snapshot` | pg_cron, service_role | service_role'ün özel tablolarda yetkisi yok |
| `expire_authorizations()` | gece işi | günceller: bağlantılar, ilan durumu | pg_cron, service_role | Aynı |

İç (invoker) fonksiyonlar: `score_pair`, `setting`, `refresh_matches_for_request/property`, `create_buyer_request`, `require_admin`, `can_view_pii`, `audit`, `hash_key`, `fmt_tl`.

## 5. `public` şeması — istemcinin çağırdığı RPC'ler (22 adet)

| RPC | Çağırabilen | Erişim | Çağıran kontrolü | Alıcı kişisel verisi |
|---|---|---|---|---|
| `citizenship_collection()` | anon, authenticated | okur: `citizenship_reviews` | — (herkese açık bilgi) | Yok. Yalnızca onaylı ve canlı mülk kimlikleri |
| `match_weights()` | anon, authenticated | okur: `private.match_settings` | — | Yok. Yalnızca puan ağırlıkları |
| `submit_buyer_request(jsonb)` | anon, authenticated | yazar: `private.buyers`, `buyer_requests`, `interest_events` | Aydınlatma onayı zorunlu; hız sınırı (aynı iletişim saatte 5, sistem dakikada 60); yalnızca canlı ilan kimlikleri kabul; kayıtlar birleştirilmez | Yazar ama **geri döndürmez**; yalnızca talep kodu döner |
| `request_viewing(jsonb)` | anon, authenticated | yazar: yukarıdakiler + `viewing_requests`, `viewing_request_items` | Aynı + en az bir canlı ilan | Aynı |
| `record_listing_view(uuid, text)` | **yalnızca service_role** | yazar: `interest_events` | Anahtar 64 haneli hex olmalı; ilan canlı olmalı | Yok (sunucuda tuzlanmış hash) |
| `my_requests()` | authenticated | okur: kendi `buyer_requests`, `viewing_requests` | `buyers.user_id = auth.uid()` | Yalnızca kendi talep kodları ve durumları |
| `partner_create_property(uuid, jsonb)` | authenticated | yazar: `properties` (taslak), `partner_property_links` (bekliyor), `private.property_private_details` | `app.partner_role()`: çağıran o ofisin aktif üyesi olmalı | Yok |
| `partner_submit_property(uuid)` | authenticated | günceller: ilan durumu | `app.partner_can_edit_property()` | Yok |
| `partner_listing_stats(uuid)` | authenticated | okur: kendi bağlantıları + `listing_interest_snapshot` | `app.is_partner_member()` | Yok. Gecikmeli, tekil, **1–2 kovası**; ham ilgilenen sayısı dönmez |
| `partner_get_private_details(uuid)` | authenticated | okur: `property_private_details` | `app.partner_links_property()` | Yok. Sahip notları (`owner_notes`) çıkarılır |
| `admin_list_buyer_requests(text)` | authenticated | okur: alıcılar ve talepler | `require_admin()`; isimler yalnızca `can_view_pii` ile açık, aksi hâlde maskeli | Evet (yetkiye bağlı) · denetim kaydı |
| `admin_get_buyer_request(uuid)` | authenticated | okur: alıcı, talep, eşleşme, randevu | `require_admin(pii := true)` | Evet · **her görüntüleme denetim kaydına yazılır** |
| `admin_list_viewings(text)` | authenticated | okur: randevular + alıcı adı | `require_admin(pii := true)` | Evet · denetim kaydı |
| `admin_set_request_status(uuid, text)` | authenticated | günceller: talep durumu | `require_admin()` | Hayır · denetim kaydı |
| `admin_set_viewing_status(uuid, text, text)` | authenticated | günceller: randevu + geçmiş | `require_admin()` | Hayır · denetim kaydı |
| `admin_set_property_status(uuid, text, text)` | authenticated | günceller: ilan durumu | `require_admin()`; yayın için aktif yetki + doğrulanmış EİDS + doğrulanmış belge şart | Hayır · denetim kaydı |
| `admin_verify_check(uuid, text, text)` | authenticated | günceller: belge kontrolü | `require_admin()` | Hayır · denetim kaydı |
| `admin_match_overview()` | authenticated | okur: eşleşme sayıları | `require_admin()` | Hayır (yalnızca sayılar) |
| `admin_set_match_setting(text, numeric)` | authenticated | günceller: ağırlıklar | `require_admin()` + süper yönetici | Hayır · denetim kaydı |
| `admin_audit_log(int)` | authenticated | okur: denetim kaydı | `require_admin()` + süper yönetici | Kim neye baktı (kişi verisi değil) |
| `admin_refresh_interest_snapshot()` | authenticated | gece işini elle çalıştırır | `require_admin()` | Hayır |
| `admin_erase_buyer(uuid)` | authenticated | anonimleştirir: alıcı | `require_admin(pii)` + süper yönetici | KVKK silme · denetim kaydı |

> `service_role` RLS'i zaten aşan sunucu anahtarıdır; yalnızca Vercel sunucusunda tutulur. `admin_*` fonksiyonları service_role ile çağrılsa bile `auth.uid()` boş olduğu için yönetici kontrolünden geçemez.

## 6. Supabase Security Advisor kontrol listesi

Kurulumda **her uyarı tek tek** incelenecek ve bu tabloya sonuç yazılacak. Hiçbir uyarı otomatik olarak kabul edilmez.

| Beklenen uyarı türü | Kapsam | İnceleme sorusu | Karar |
|---|---|---|---|
| Ziyaretçinin çalıştırabildiği SECURITY DEFINER fonksiyon | `citizenship_collection`, `match_weights`, `submit_buyer_request`, `request_viewing` | Dönen veri §5'teki gibi mi? Hız sınırı yeterli mi? | Kurulumda |
| Oturum açmış kullanıcının çalıştırabildiği SECURITY DEFINER fonksiyon | §5'teki diğer RPC'ler | Çağıran kontrolü var mı? Partner fonksiyonu alıcı tablosu okuyor mu? | Kurulumda |
| Function search_path mutable | — | Beklenmiyor; çıkarsa hata kabul edilir | — |
| RLS enabled, no policy | `private.*`, `citizenship_reviews` (yalnızca yönetici) | İstemci yetkisi gerçekten yok mu? | Kurulumda |
| Leaked password protection / MFA | Auth ayarları | Açılmalı mı? | Kurulumda |
| Bu listede olmayan herhangi bir uyarı | — | Durulur, birlikte incelenir | — |
