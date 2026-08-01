# Tunggu — Queue Management System

Sistem antrian online untuk UMKM. Pelanggan ambil nomor via web dan pantau antrian real-time. Admin dashboard untuk call/skip/done queue, kelola layanan, dan lihat statistik.

## Architecture

```
├── server/      Express + MongoDB (:4000)
├── client/      Next.js — Customer facing (:3000)
├── admin/       Next.js — Admin dashboard (:3001)
└── docker-compose.yml  — All services + MongoDB
```

## Quick Start (Local)

```bash
# Setup
cp server/.env.example server/.env   # edit isinya
cp client/.env.example client/.env
cp admin/.env.example admin/.env

# Install deps
cd server && npm install && cd ..
cd client && npm install && cd ..
cd admin && npm install && cd ..

# Run (all 3 services)
npm run dev
```

## Quick Start (Docker)

```bash
cp .env.example .env        # edit isinya (semua var deploy + secret)
cp server/.env.example server/.env   # edit isinya
docker compose up -d --build
```

> `docker compose` otomatis membaca `.env` di root repo untuk var-var produksi.

### First-time setup

After services are running, create the first merchant + admin:

```bash
docker compose exec server node scripts/seed-admin.js
```

Or insert manually into MongoDB:

```javascript
// merchant
db.merchants.insertOne({ name: "...", slug: "...", isActive: true })

// admin (password hashed with bcrypt)
db.admins.insertOne({ name: "...", email: "...", password: "<bcrypt hash>", merchantId: "<merchant._id>", role: "admin" })
```

## Environment Variables

> Untuk **deployment Docker**, var-var produksi ditaruh di `.env` root (lihat `.env.example`), bukan di `server/.env`. Var di bawah hanya untuk development lokal.

### Server (`server/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string (Docker: `mongodb://mongo:27017/tunggu`) |
| `JWT_SECRET` | Yes | Min 16 chars |
| `CORS_ORIGIN` | No | Default `*`, set eksplisit di production |
| `API_URL` | Yes | Base URL API publik, dipakai CSP + URL upload |
| `VAPID_PUBLIC_KEY` | No | Untuk push notification |
| `VAPID_PRIVATE_KEY` | No | Untuk push notification |

Generate VAPID keys: `node server/scripts/generate-vapid.js`

### Client (`client/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:4000/api` (dev) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | No | VAPID public key |

### Admin (`admin/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:4000` (dev) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | No | VAPID public key |
| `NEXTAUTH_SECRET` | Yes | Min 32 chars |
| `NEXTAUTH_URL` | Yes | `http://localhost:3001` (dev) |

## Deployment

Build & start production images:

```bash
cp .env.example .env        # isi semua value
docker compose up -d --build
```

Var penting di `.env` root (dibaca otomatis oleh `docker compose`):

| Variable | Contoh | Keterangan |
|----------|--------|-----------|
| `MONGODB_URI` | `mongodb://mongo:27017/tunggu` | Pakai hostname `mongo` (network compose) |
| `API_URL` | `https://api.tunggu.id` | URL API publik, dipakai CSP server |
| `CORS_ORIGIN` | `https://tunggu.id,https://dash.tunggu.id` | Origin yang diizinkan |
| `CLIENT_API_URL` | `https://api.tunggu.id/api` | Base URL browser → API (di-bake di build client) |
| `ADMIN_API_URL` | `https://api.tunggu.id` | Base URL browser → API (di-bake di build admin) |
| `NEXTAUTH_SECRET` | random ≥32 char | Wajib, dipakai NextAuth admin |
| `NEXTAUTH_URL` | `https://dash.tunggu.id` | URL publik admin |
| `ROOT_DOMAIN` | `tunggu.id` | Subdomain routing client |

> `NEXT_PUBLIC_*` values are baked at build time — they must point to your **public domain**, not internal Docker hostnames. Setiap ganti value-nya, jalankan ulang `docker compose build`.

## CI/CD

GitHub Actions on push/PR to master:
- `test-server` — runs Jest tests with real MongoDB
- `lint-client` / `lint-admin` — ESLint
- `build-client` / `build-admin` — Next.js build

## Tech Stack

- **Backend**: Express.js, Mongoose, JWT, web-push
- **Frontend**: Next.js 16, TanStack Query, Zustand, Framer Motion, Tailwind v4, react-hook-form
- **Infra**: Docker, Compose, GitHub Actions, MongoDB 7
