# emlak-platform

Bodrum, Mumcular ve Milas odaklı, davetli iş ortaklarıyla çalışan özel gayrimenkul keşif ve alıcı eşleştirme platformu.

> **Önizleme sürümü:** Tüm veriler kurgusaldır. Gerçek giriş, veritabanı ve güvenlik (RLS) henüz devrede değildir.
> Supabase bağlantısı sonraki aşamada, migration dosyalarıyla yapılacaktır.

## Çalıştırma

```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck
npm run build
npm test           # eşleştirme, istatistik ve izolasyon testleri
npm run db:test    # migration + RLS testleri (yalnızca YEREL PostgreSQL; PGHOST/PGPORT/PGUSER gerekir)
```

## Önizleme ekranları

| Adres | İçerik |
|---|---|
| `/` | Herkese açık site |
| `/partner` | Emlakçı paneli: önce **örnek** bir ofis seçilir (giriş değildir) |
| `/admin` | Yönetici paneli: önizleme kapısından açılır (giriş değildir; tüm alıcılar kurgusal) |

Gerçek giriş ve veritabanı güvenliği (Supabase Auth + RLS) sonraki aşamada eklenecek.

Ortam değişkeni gerekmez (bkz. `.env.example`).

## Belgeler

- [Ürün briefi](docs/REAL_ESTATE_MASTER_BRIEF.md)
- [Yeniden kullanım denetimi](docs/REUSE_AUDIT.md): `otogaleri-havuz` analizi
- [Mimari](docs/ARCHITECTURE.md): roller, gizlilik kuralları, şema, RLS test matrisi
- [Uygulama planı](docs/IMPLEMENTATION_PLAN.md)
- [Vercel önizleme kurulumu](docs/VERCEL_KURULUM.md)
- [Supabase kurulum yol haritası](docs/SUPABASE_KURULUM.md)

## Veritabanı (`supabase/`)

- `migrations/`: sırayla uygulanacak 8 SQL dosyası (henüz hiçbir Supabase projesine uygulanmadı)
- `tests/rls_isolation.test.sql`: rol bazlı izolasyon testleri (ROLLBACK ile biter)
- `tests/local/00_supabase_shim.sql`: yalnızca yerel test için Supabase rollerini/şemalarını taklit eder; Supabase'e uygulanmaz

## Kurallar

- `otogaleri-havuz` projesi yalnızca referanstır; değiştirilmez, veritabanına erişilmez.
- Gerçek kişi, ofis veya müşteri verisi repoya yazılmaz. Gizli anahtarlar yalnızca Vercel/Supabase ortam değişkenlerinde tutulur.
- Partnerler alıcı bilgisini ve diğer partnerleri hiçbir koşulda göremez.
