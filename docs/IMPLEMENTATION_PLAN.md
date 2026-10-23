# Uygulama Planı (IMPLEMENTATION_PLAN)

Sahip talimatı: önce web sitesi ve paneller **örnek verilerle** hazırlanır, ardından yeni Supabase hesabına geçilir. Her aşama ayrı bir PR'dır ve sahibin onayıyla birleştirilir.

| # | Aşama | Durum | Kabul ölçütü |
|---|---|---|---|
| 0 | Galeri analizi, repo iskeleti, belgeler | ✅ Yapıldı | `REUSE_AUDIT.md`, `ARCHITECTURE.md`, bu dosya |
| 1 | Tasarım sistemi | ✅ Yapıldı | Tokenlar, kartlar, formlar; mobil 390 px'te yatay taşma yok |
| 2 | Örnek veri katmanı | ✅ Yapıldı | Kurgusal 26 mülk (4'ü yayında değil), 3 proje, 4 partner, vatandaşlık incelemeleri |
| 3 | Herkese açık site | ✅ Yapıldı | Ana sayfa, Satılık Evler, ilan detayı, Yeni Projeler, Vatandaşlık (TR/EN/RU) |
| 4 | Filtre, favori, karşılaştırma, eşleştirme | ✅ Yapıldı | URL filtreleri; favoriler; 4 ilana kadar karşılaştırma; Bana Uygun Evi Bul; vatandaşlık için ayrı bulucu; çoklu randevu talebi |
| 5 | Partner (emlakçı) paneli | ⏳ Sıradaki | Kendi portföyü, ilan formu (taslak → yayın akışı), belge yükleme alanı, ilan başına **uygun talep sayısı**, anonim randevu takvimi. Alıcı ve diğer partner verisi sunucudan **hiç** dönmez |
| 6 | Yönetici paneli | ⏳ | Partnerler, yayın onayları, EİDS ve belge kontrolü (simüle olduğu açıkça yazılı), alıcı havuzu, eşleştirme ekranı, randevular (çoklu ilan), vatandaşlık inceleme kontrol listesi ve onay, eşleştirme ağırlık ayarları, mükerrer kayıt kuyruğu |
| 7 | Vercel önizleme | ⏳ | Yeni repoya bağlı ayrı Vercel projesi, Preview dağıtımı, `noindex` |
| 8 | Supabase migration hazırlığı | ⏳ | `supabase/migrations/*.sql`: şema, private şema, RLS, RPC'ler, sentetik seed, `supabase/tests` RLS testleri. **Hiçbiri çalıştırılmaz** |
| 9 | Supabase kurulumu (sahiple adım adım) | ⏳ | Ekran ekran Türkçe rehber; her adımdan sonra onay |
| 10 | Gerçek giriş ve güvenlik testleri | ⏳ | RLS matrisi (`ARCHITECTURE.md` §7) geçer; partner A, B'yi ve alıcı PII'sini göremez |
| 11 | Yayın öncesi sertleştirme | ⏳ | Hukuki inceleme (ilan zorunlu bilgileri, KVKK, aracılık/komisyon), EİDS erişim doğrulaması, rate limit, erişilebilirlik ve performans |

## Açık riskler

- **EİDS:** resmî entegrasyon veya API erişimi doğrulanmadı. Gerçek doğrulama olmadan canlıya çıkılmaz.
- **Zorunlu ilan bilgileri:** Türk mevzuatında ilan üzerinde yetkili aracı bilgisinin gösterilmesi gerekebilir. Bu, "partner anonim" tasarımıyla çakışabilir; hukuki incelemeye bırakıldı.
- **Fiyat gösterimi:** TL zorunluluğu ve diğer kurallar yayından önce kontrol edilmeli.
- **Partner talep sayısı:** küçük sayılarda alıcı tahmin edilebilir (bkz. `ARCHITECTURE.md` §3).
- **Görseller:** şu an kodla üretilmiş temsilî SVG'ler. Gerçek fotoğraflar partner yüklemesiyle ve köken (provenance) kaydıyla gelecek.
