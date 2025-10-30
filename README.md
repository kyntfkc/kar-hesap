# Kurulum (Backend + Frontend)

## Backend (server/)
1) Railway → New Project → Deploy from Repository (bu repo) ve `server/` klasörünü seçin.
2) Build gerekmez. Start Command:
   - Windows PowerShell'de komutları ayrı çalıştırın:
     - `npm --prefix server install`
     - `npm --prefix server start`
3) Variables gerekmez. PORT otomatik atanır.
4) Domain'i kopyalayın (ör: https://api-xxx.up.railway.app).

## Frontend
1) Proje köküne `.env` dosyası ekleyin:
```
VITE_API_BASE_URL=https://api-xxx.up.railway.app
```
2) Çalıştırma:
```
npm install
npm run dev
```

Not: `VITE_API_BASE_URL` boş bırakılırsa uygulama yerel hesaplama modunda çalışır (backend'e istek atmaz).
