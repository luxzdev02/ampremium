# ALIGHTMOTION SCRAPER - VERCEL + LOCAL

Website panel scraper AlightMotion. Bisa run lokal di port 3000, bisa deploy ke Vercel.

## 🖥️ RUN LOKAL (PORT 3000)

```bash
# 1. Install dependencies
npm install

# 2. Jalankan server
npm start

# 3. Buka browser
http://localhost:3000
```

Server akan jalan di `http://localhost:3000` dengan semua API endpoint aktif.

## ☁️ DEPLOY KE VERCEL

### Opsi 1: Vercel CLI
```bash
npm i -g vercel
vercel login
vercel --prod
```

### Opsi 2: GitHub + Vercel Dashboard
1. Upload folder ini ke GitHub repo
2. Buka vercel.com → New Project → Import repo
3. **Build Command**: `npm run vercel-build`
4. **Output Directory**: `public`
5. **Install Command**: `npm install`
6. Deploy!

## ⚡ ENDPOINTS (SAMA DI LOKAL & VERCEL)

| Method | URL | Kegunaan |
|--------|-----|----------|
| POST | `/api/create` | Buat 1 akun |
| POST | `/api/bulk` | Bulk create akun |
| POST | `/api/tempmail` | Kelola temp mail |
| GET | `/api/tempmail` | Generate temp mail via GET |

**Contoh request lokal:**
```bash
curl -X POST http://localhost:3000/api/create \
  -H "Content-Type: application/json" \
  -d '{"timeoutSeconds": 45, "autoActivate": true}'
```

## 📂 STRUKTUR

```
├── server.js          # Express server lokal (port 3000)
├── api/
│   ├── create.js      # Single create endpoint
│   ├── bulk.js        # Bulk create endpoint
│   └── tempmail.js    # Temp mail endpoint
├── lib/
│   └── scraper.js     # Core scraper (puppeteer + chromium serverless)
├── public/
│   ├── css/style.css  # Styling
│   ├── js/app.js      # Frontend logic
│   └── index.html     # Main page
├── package.json       # Dependencies + scripts
├── vercel.json        # Vercel config
└── README.md          # Ini
```

## 🔧 FITUR PANEL WEB
- **Single Create** — buat 1 akun dengan opsi kustom
- **Bulk Create** — buat multiple akun sekaligus
- **Temp Mail** — generate email sementara & cek pesan
- **API Docs** — dokumentasi endpoint
- Dark theme modern + responsive

## ⚠️ CATATAN
- **Lokal**: Full akses port 3000, tidak ada batasan duration
- **Vercel Free**: Max 10 detik per function (kurang untuk scraper)
- **Vercel Pro**: Max 60 detik per function (cukup)
- **Alternatif**: Railway, Render, Fly.io untuk timeout lebih panjang
