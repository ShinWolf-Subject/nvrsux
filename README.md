# Nv Shortener URL (NvSU)

URL Shortener minimalis dengan Express.js dan MongoDB 

Sebelum menjalankan pastikan sudah mengisi credentials ini

## Environment Variables
```env
# Server PORT
PORT=4056

# Environment
NODE_ENV=production

# MongoDB URI ( PENTING )
MONGO_URI=mongodb+srv://

# MongoDB Database Name ( PENTING )
MONGO_DBNAME=your_database_name

# MongoDB Collection ( PENTING )
MONGO_COLLECTION=your_collection_name

# Admin Key untuk akses endpoint tertentu
ADMIN_KEY=your_secret_key

# App Domain ( Wajib )
APP_DOMAIN=http://localhost:4056

# Rate Limiting, sesuaikan sesuai keinginan
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=135
```

## Cara mendapatkan MongoDB URI 
 - Login di [mongodb.com](https://mongodb.com)
 - Buat Cluster Free (512MB)
 - Tambahkan `0.0.0.0/0` pada akses koneksi
 - Kembali ke Cluster dan klik Connect
 - Ambil URI dan tempel di Environment Variables
 - Selengkapnya cari aja tutorial di YouTube banyak🗿🙏

## Cara menjalankan
```bash
# Clone repository ini
git clone https://github.com/ShinWolf-Subject/nvrsux.git 

# Masuk ke direktory proyek
cd nvrsux

# Install dependensi
npm Install

# Jalankan lokal (development)
npm run dev 

# Jalankan lokal (production)
npm start
```

## Struktur Proyek 
```
 NvSU
├──  index.js
├──  LICENSE
├──  middleware
│   ├──  auth.js
│   └──  rateLimiter.js
├──  package.json
└── 󰂺 README.md
```

## Cara Deploy (Vercel)
```zsh
# Install Vercel CLI 
npm i -g vercel 

# Login dulu 
vercel login 

# lalu deploy 
vercel --prod
```

- Sekian...

### ©2026 — Pake aja bang


