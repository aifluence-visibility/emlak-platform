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

## Kurallar

- `otogaleri-havuz` projesi yalnızca referanstır; değiştirilmez, veritabanına erişilmez.
- Gerçek kişi, ofis veya müşteri verisi repoya yazılmaz. Gizli anahtarlar yalnızca Vercel/Supabase ortam değişkenlerinde tutulur.
- Partnerler alıcı bilgisini ve diğer partnerleri hiçbir koşulda göremez.
