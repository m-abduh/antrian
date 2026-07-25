# Antriin — Queue Management System

Sistem antrian online untuk UMKM. Pelanggan ambil nomor via web, bayar QRIS (Midtrans), dan pantau antrian real-time. Admin dashboard untuk call/skip/done queue, kelola layanan, dan lihat statistik.

## Architecture

```
├── server/      Express + MongoDB + Midtrans (:4000)
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
cp server/.env.example server/.env   # edit isinya
export MIDTRANS_CLIENT_KEY=your_key
export VAPID_PUBLIC_KEY=your_vapid_public
docker compose up -d
```

### First-time setup

After services are running, create the first merchant + admin:

```bash
cd server && node scripts/seed-admin.js
```

Or insert manually into MongoDB:

```javascript
// merchant
db.merchants.insertOne({ name: "...", slug: "...", isActive: true, midtrans: { serverKey: "...", clientKey: "..." } })

// admin (password hashed with bcrypt)
db.admins.insertOne({ name: "...", email: "...", password: "<bcrypt hash>", merchantId: "<merchant._id>", role: "admin" })
```

## Environment Variables

### Server (`server/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Min 16 chars |
| `MIDTRANS_SERVER_KEY` | Yes | Midtrans server key (rahasia) |
| `MIDTRANS_CLIENT_KEY` | Yes | Midtrans client key (publik) |
| `CORS_ORIGIN` | No | Default `*`, set eksplisit di production |
| `VAPID_PUBLIC_KEY` | No | Untuk push notification |
| `VAPID_PRIVATE_KEY` | No | Untuk push notification |

Generate VAPID keys: `node server/scripts/generate-vapid.js`

### Client (`client/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:4000/api` (dev) |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | Yes | Midtrans client key |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | No | VAPID public key |

### Admin (`admin/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:4000` (dev) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | No | VAPID public key |

## Deployment

Build production images:

```bash
docker compose -f docker-compose.yml build
docker compose up -d
```

For production, set `COMPOSE_FILE` vars or pass via `.env`:

```bash
CLIENT_API_URL=https://api.antriin.com \
ADMIN_API_URL=https://admin.antriin.com \
MIDTRANS_CLIENT_KEY=... \
VAPID_PUBLIC_KEY=... \
docker compose up -d
```

> `NEXT_PUBLIC_*` values are baked at build time — they must point to your **public domain**, not internal Docker hostnames.

## CI/CD

GitHub Actions on push/PR to master:
- `test-server` — runs Jest tests with real MongoDB
- `lint-client` / `lint-admin` — ESLint
- `build-client` / `build-admin` — Next.js build

## Tech Stack

- **Backend**: Express.js, Mongoose, JWT, Midtrans client, web-push
- **Frontend**: Next.js 16, TanStack Query, Zustand, Framer Motion, Tailwind v4, react-hook-form
- **Infra**: Docker, Compose, GitHub Actions, MongoDB 7
