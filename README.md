# Kurulum (Backend + Frontend)

## Backend (`server/`)

1. Railway → New Project → Deploy from Repository, Root Directory: `server`
2. Start Command: `npm start` (veya `npm install` + `npm start`)
3. Variables (opsiyonel):
   - `PORT` — Railway atar
   - `DATA_DIR` — kalıcı volume yolu (ör. `/data`); yoksa `server/data/snapshot.json`
4. Domain örneği: `https://kar-hesap-backend-production.up.railway.app`

Uçlar:
- `GET /health`
- `GET /sync` — uygulama snapshot
- `POST /sync` — snapshot kaydet

## Frontend

1. Vercel `vercel.json` zaten `/api/*` → Railway backend rewrite eder.
2. İsteğe bağlı `.env`:
```
VITE_API_BASE_URL=https://kar-hesap-backend-production.up.railway.app
```
Boş bırakılırsa production'da `/api` proxy kullanılır.

Yerel geliştirme (backend ayrı):
```
npm --prefix server install
npm --prefix server start
```
```
# .env.local
VITE_API_BASE_URL=http://localhost:3001
```
```
npm install
npm run dev
```

## Veri saklama

- Kaynak: Railway `POST/GET /sync` (altın, gümüş, varyant, e-ticaret milyemi)
- `localStorage` yalnızca önbellek / offline fallback
- Auth yok; tek paylaşımlı snapshot (last-write-wins)
