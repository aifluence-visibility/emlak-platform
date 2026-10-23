# Vercel önizleme kurulumu (yaklaşık 3 dakika)

Bu adımlar yalnızca **yeni** `emlak-platform` projesi içindir. Galeri projesine dokunmayın.

## 1. Yeni proje ekranı
1. https://vercel.com adresine girip giriş yapın.
2. Sol üstte ekip olarak **"aifluence-visibility's projects"** seçili olsun.
3. Sağ üstteki **"Add New…"** düğmesine, ardından **"Project"** seçeneğine tıklayın.

## 2. Repoyu içe aktarma
4. **"Import Git Repository"** listesinde `emlak-platform` satırındaki **"Import"** düğmesine tıklayın.
   - Repo listede yoksa **"Adjust GitHub App Permissions"** bağlantısına tıklayın ve GitHub'da Vercel uygulamasına `emlak-platform` reposu için erişim verin.

## 3. Ayarlar ("Configure Project" ekranı)
5. **Project Name:** `emlak-platform`
6. **Framework Preset:** `Next.js` (otomatik seçilir)
7. **Root Directory:** `./` (değiştirmeyin)
8. **Build and Output Settings:** dokunmayın.
9. **Environment Variables:** **boş bırakın.** Önizleme sürümü hiçbir anahtar kullanmaz; Supabase anahtarları sonraki aşamada eklenecek.
10. **"Deploy"** düğmesine tıklayın.

> `main` dalında şu an yalnızca README olduğu için bu ilk dağıtım **hata verebilir. Bu normaldir.**
> Asıl önizlemeler PR dallarından oluşacak.

## 4. Bana haber verin
11. Sohbete **"Vercel tamam"** yazın. Sonraki commit'imle birlikte Vercel her PR için bir önizleme linki oluşturur; link PR sayfasında Vercel yorumu olarak görünür.

## Önemli
- **Deployment Protection:** Vercel'in varsayılan "Vercel Authentication" ayarını açık bırakın. Böylece önizleme linklerini yalnızca Vercel ekibinizde oturum açmış kişiler görür.
- Bu proje için ayrı bir alan adı şimdilik **gerekmiyor**.
