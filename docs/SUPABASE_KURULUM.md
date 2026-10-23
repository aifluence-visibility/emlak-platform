# Supabase kurulumu — taslak yol haritası

> Bu belge **taslaktır**. Kurulumu birlikte, ekran ekran yapacağız; her adımdan sonra onayınızı bekleyeceğim.
> Supabase arayüzündeki menü adları zamanla değişebilir; o gün ekranda gördüklerinizi birlikte doğrulayacağız.
> **Galeri projesinin (otogaleri-havuz) Supabase'ine kesinlikle dokunulmaz.** Bu kurulum yeni hesap/yeni projede yapılır.

## Adım 0 — Hazırlık (sizde)
- Yeni Supabase hesabıyla giriş yapın.
- Veritabanı şifresini bir şifre yöneticisinde saklayın. Şifreyi **asla** sohbete, GitHub'a veya e-postaya yazmayın.

## Adım 1 — Yeni proje
- **Menü:** Dashboard → **New project**
- **Ad:** `emlak-platform`
- **Bölge:** Türkiye'ye en yakın AB bölgesi (Frankfurt, `eu-central-1`). KVKK açısından veri konumu not edilmeli.
- **Onay noktası ✋**

## Adım 2 — Eklenti
- **Menü:** Database → **Extensions** → `pg_cron` → Enable
- Bu eklenti partner istatistiklerinin her gece güncellenmesi ve süresi biten yetkilerin kapatılması için gerekli.
- **Onay noktası ✋**

## Adım 3 — Migration'lar (SQL Editor, her dosya ayrı ayrı)
- **Menü:** SQL Editor → New query
- Aşağıdaki dosyaların her birini **sırayla**, ayrı sorgu olarak yapıştırıp **Run** ile çalıştıracağız. Her dosyadan sonra sonucu birlikte kontrol edeceğiz:
  1. `supabase/migrations/20261023000001_foundation.sql`
  2. `supabase/migrations/20261023000002_inventory.sql`
  3. `supabase/migrations/20261023000003_buyers_private.sql`
  4. `supabase/migrations/20261023000004_rls.sql`
  5. `supabase/migrations/20261023000005_matching.sql`
  6. `supabase/migrations/20261023000006_api.sql`
  7. `supabase/migrations/20261023000007_storage.sql`
  8. `supabase/migrations/20261023000008_jobs.sql`
- **Her dosyadan sonra onay noktası ✋**

## Adım 4 — Güvenlik testleri (gerçek veri girilmeden önce)
- **Menü:** SQL Editor → `supabase/tests/rls_isolation.test.sql` içeriği → Run
- Beklenen sonuç: `TÜM TESTLER GEÇTİ: 111 kontrol`
- Test kendi sentetik kayıtlarını oluşturur ve sonunda **ROLLBACK** eder; veritabanında iz bırakmaz.
- **Onay noktası ✋**

## Adım 5 — Güvenlik ayarları
- **Data API'de açık şemalar:** Project Settings → **Data API**. Yalnızca `public` (ve `graphql_public`) açık olmalı. `private` **eklenmemeli**.
- **Kimlik doğrulama:** Authentication → Sign In / Providers. E-posta açık, "Confirm email" açık. İş ortakları yalnızca davetle eklenir; kayıt olmak kimseye iş ortağı veya yönetici yetkisi vermez (yetkiler veritabanı tablolarından gelir).
- **URL ayarları:** Authentication → **URL Configuration**. Site URL ve yönlendirme adresleri olarak Vercel adresleri girilir.
- **Security Advisor:** Advisors → Security Advisor. Çıkan uyarıları birlikte değerlendireceğiz. `public` şemadaki bazı `security definer` fonksiyonlar bilinçli olarak böyle; her birinin gerekçesi `docs/ARCHITECTURE.md` içinde.
- **Storage:** `property-media` ve `partner-documents` bucket'larının **Public: kapalı** olduğu kontrol edilir.
- **Onay noktası ✋**

## Adım 6 — İlk yönetici hesabı
- Sitedeki giriş ekranından kendi e-postanızla kayıt olursunuz (bir sonraki uygulama aşamasında eklenecek).
- Ardından SQL Editor'de, kendi kullanıcı kimliğinizle tek satırlık bir yönetici kaydı ekleriz. Sorguyu o gün birlikte hazırlayacağız.
- **Onay noktası ✋**

## Adım 7 — Vercel bağlantısı
- **Supabase'de:** Project Settings → **API Keys**
- **Vercel'de:** Project → Settings → **Environment Variables**

| Değişken | Nereden | Not |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | Tarayıcıya gider, gizli değildir |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key | Tarayıcıya gider; tüm yetki RLS'te |
| `SUPABASE_SECRET_KEY` | Secret key | **Yalnızca sunucu.** Vercel'de "Sensitive" işaretlenir; asla `NEXT_PUBLIC_` ile başlamaz |

- Secret key yalnızca görüntüleme sayacı ve gece işleri gibi sunucu işlemlerinde kullanılır.
- **Onay noktası ✋**

## Adım 8 — Birlikte test
- Gerçek girişle şunları deneyeceğiz:
  - İki ayrı iş ortağı hesabı birbirini göremiyor mu?
  - İş ortağı müşteri bilgisini göremiyor mu?
  - Ziyaretçi taslak ilanı göremiyor mu?
  - Yönetici her şeyi görüyor ve kişisel veri görüntülemeleri denetim kaydına yazılıyor mu?
