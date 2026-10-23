# Uygulama Planı (IMPLEMENTATION_PLAN)

Sahip talimatı: önce web sitesi ve paneller **örnek verilerle** hazırlanır, ardından yeni Supabase hesabına geçilir. Her aşama ayrı bir PR'dır ve sahibin onayıyla birleştirilir.

| # | Aşama | Durum | Kabul ölçütü |
|---|---|---|---|
| 0 | Galeri analizi, repo iskeleti, belgeler | ✅ Yapıldı | `REUSE_AUDIT.md`, `ARCHITECTURE.md`, bu dosya |
| 1 | Tasarım sistemi | ✅ Yapıldı | Tokenlar, kartlar, formlar; mobil 390 px'te yatay taşma yok |
| 2 | Örnek veri katmanı | ✅ Yapıldı | Kurgusal 26 mülk (4'ü yayında değil), 3 proje, 4 partner, vatandaşlık incelemeleri |
| 3 | Herkese açık site | ✅ Yapıldı | Ana sayfa, Satılık Evler, ilan detayı, Yeni Projeler, Vatandaşlık (TR/EN/RU) |
| 4 | Filtre, favori, karşılaştırma, eşleştirme | ✅ Yapıldı | URL filtreleri; favoriler; 4 ilana kadar karşılaştırma; Bana Uygun Evi Bul; vatandaşlık için ayrı bulucu; çoklu randevu talebi |
| 5 | Partner (emlakçı) paneli | ✅ PR #2 | Kendi portföyü, ilan formu (taslak → yayın akışı), belge alanları, ilan başına görüntülenme / favori / ilgilenen alıcı (1–2 kovası, gecikmeli, tekil), gösterim müsaitliği. Alıcı, randevu ve diğer partner verisi partner katmanından **hiç** dönmez |
| 6 | Yönetici paneli | ✅ Bu PR | Müşteri havuzu (PII yalnızca burada), talep detayında gerekçeli eşleşmeler, eşleştirme (ilana/talebe göre), çoklu mülk randevuları ve durum geçmişi, yayın onayları (EİDS simülasyon uyarılı), tüm ilanlar ve çoklu partner bağlantıları, fiyat uyuşmazlığı uyarısı, vatandaşlık kontrol listesi ve onay, iş ortakları, eşleştirme ağırlıkları. Statik izolasyon testi: site ve partner kodu alıcı verisine import zinciriyle ulaşamaz |
| 7 | Vercel önizleme | ⏳ Sahip adımı | Vercel API proje oluşturmaya izin vermedi (403); kurulum `docs/VERCEL_KURULUM.md` ile panelden yapılacak. Ortam değişkeni yok, `noindex` |
| 8 | Supabase migration hazırlığı | ⏳ | `supabase/migrations/*.sql`: şema, private şema, RLS, RPC'ler, sentetik seed, `supabase/tests` RLS testleri. **Hiçbiri çalıştırılmaz** |
| 9 | Supabase kurulumu (sahiple adım adım) | ⏳ | Ekran ekran Türkçe rehber; her adımdan sonra onay |
| 10 | Gerçek giriş ve güvenlik testleri | ⏳ | RLS matrisi (`ARCHITECTURE.md` §7) geçer; partner A, B'yi ve alıcı PII'sini göremez |
| 11 | Yayın öncesi sertleştirme | ⏳ | Hukuki inceleme (ilan zorunlu bilgileri, KVKK, aracılık/komisyon), EİDS erişim doğrulaması, rate limit, erişilebilirlik ve performans |

## Sonraki aşamalarda (yönetici paneli)

- Anlaşmalar (`/admin/anlasmalar`), satış takibi, raporlar ve proje yönetimi ekranları
- Mükerrer kayıt (aynı mülk farklı ofislerden) birleştirme kuyruğu

## Açık riskler

- **EİDS:** resmî entegrasyon veya API erişimi doğrulanmadı. Gerçek doğrulama olmadan canlıya çıkılmaz.
- **Zorunlu ilan bilgileri:** Türk mevzuatında ilan üzerinde yetkili aracı bilgisinin gösterilmesi gerekebilir. Bu, "partner anonim" tasarımıyla çakışabilir; hukuki incelemeye bırakıldı.
- **Fiyat gösterimi:** TL zorunluluğu ve diğer kurallar yayından önce kontrol edilmeli.
- **Partner talep sayısı:** küçük sayılarda alıcı tahmin edilebilir (bkz. `ARCHITECTURE.md` §3).
- **Görseller:** şu an kodla üretilmiş temsilî SVG'ler. Gerçek fotoğraflar partner yüklemesiyle ve köken (provenance) kaydıyla gelecek.
