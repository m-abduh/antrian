# PRD — Antriin

## 1. Ringkasan

Aplikasi antrean berbasis web dengan alur **Scan QR → Pilih Layanan → Bayar (QRIS) → Dapat Nomor Antrean**. Target: restoran, barbershop, salon, klinik, laundry UMKM di Indonesia. Tidak perlu install aplikasi, cukup scan QR atau buka link.

---

## 2. Arsitektur Proyek

3 proyek terpisah dalam satu repo:

| Proyek | Stack | Fungsi |
|--------|-------|--------|
| `server/` | Express.js + Mongoose + Midtrans | Backend API |
| `client/` | Next.js + Tailwind + PWA | Customer web app (scan, order, queue) |
| `admin/` | Next.js + Tailwind | Admin dashboard (login, manage queue) |

### Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | Next.js (App Router) + Tailwind CSS |
| Backend | Express.js (Node.js) |
| Database | MongoDB (Mongoose) |
| Payment | Midtrans Snap (QRIS) |
| Notifikasi | PWA Push Notification (Web Push API) |
| Auth | JWT (admin) |

---

## 3. Alur Utama (Customer)

```
Scan QR / Buka Link
    ↓
Lihat daftar layanan + harga
    ↓
Pilih 1 layanan
    ↓
Input nama + no WA (opsional)
    ↓
Checkout → Midtrans Snap (QRIS / Virtual Account)
    ↓
Pembayaran sukses
    ↓
Dapat nomor antrean + estimasi waktu
    ↓
Live tracking antrean (progress bar / posisi)
    ↓
Push notification saat tinggal 2-3 antrean lagi
    ↓
Selesai → Rating
```

---

## 4. Fitur MVP

### 4.1 Customer (Public Web)

| Fitur | Keterangan |
|-------|-----------|
| Scan QR | QR langsung ke halaman antrean cabang tertentu |
| Daftar Layanan | Nama layanan + durasi + harga |
| Pilih Layanan | Single select (1x antrean = 1 layanan) |
| Input Data | Nama (wajib), No WA (opsional) |
| Pembayaran QRIS | Midtrans Snap popup |
| Nomor Antrean | Tampil setelah bayar, format: `A001` |
| Estimasi Waktu | Berdasarkan rata-rata durasi layanan x antrean di depan |
| Live Status | Posisi antrean real-time (auto-refresh tiap 10s) |
| Push Notification | Kirim notifikasi ke browser saat tinggal 3 antrean lagi |
| Rating | 1-5 bintang setelah selesai |

### 4.2 Admin Dashboard

| Fitur | Keterangan |
|-------|-----------|
| Login | JWT, multi-cabang support |
| Dashboard Antrean Hari Ini | List antrean, status (menunggu / dipanggil / selesai / lewat) |
| Tombol Aksi | Panggil, Lewati, Selesai |
| Atur Layanan | CRUD layanan (nama, durasi, harga) |
| Ubah Status Antrean | Manual override jika perlu |
| Statistik Harian | Total pelanggan, rata-rata waktu tunggu, jam sibuk |
| Riwayat Antrean | Filter by tanggal |

---

## 5. Model Data (MongoDB)

### 5.1 `Merchant`
```
{
  _id, name, slug, address, phone,
  waGateway: { provider, apiKey, phoneNumber },
  midtrans: { serverKey, clientKey },
  isActive, createdAt, updatedAt
}
```

### 5.2 `Service`
```
{
  _id, merchantId, name, description,
  duration (menit), price (rupiah), isActive
}
```

### 5.3 `Queue`
```
{
  _id, merchantId, serviceId,
  queueNumber: "A001",
  customerName, customerPhone,
  status: "waiting" | "called" | "serving" | "done" | "skipped",
  paymentStatus: "pending" | "paid" | "expired",
  midtransOrderId, midtransTransactionId,
  rating: Number (1-5),
  estimatedStartTime, startedAt, finishedAt,
  createdAt
}
```

### 5.4 `Admin`
```
{
  _id, merchantId, name, email, password (bcrypt), role
}
```

---

## 6. API Endpoints

### Public
| Method | Endpoint | Fungsi |
|--------|----------|--------|
| GET | `/api/merchant/:slug` | Ambil data merchant |
| GET | `/api/merchant/:slug/services` | Daftar layanan |
| POST | `/api/merchant/:slug/queue` | Buat antrean + Midtrans transaction |
| POST | `/api/midtrans/notification` | Webhook Midtrans (update payment status) |
| GET | `/api/merchant/:slug/queue/live` | Live antrean (pending + current) |

### Admin (auth required)
| Method | Endpoint | Fungsi |
|--------|----------|--------|
| POST | `/api/admin/login` | Login |
| GET | `/api/admin/queues` | Antrean hari ini |
| PATCH | `/api/admin/queue/:id/call` | Panggil |
| PATCH | `/api/admin/queue/:id/skip` | Lewati |
| PATCH | `/api/admin/queue/:id/done` | Selesai |
| GET | `/api/admin/services` | CRUD service |
| POST/PUT/DELETE | `/api/admin/services/:id` | CRUD service |

---

## 7. Alur Midtrans

```
Customer checkout
    ↓
Backend create Midtrans Snap transaction (gross_amount = service.price)
    ↓
Return snap_token ke frontend
    ↓
Frontend open Midtrans Snap popup (QRIS)
    ↓
Customer scan & bayar
    ↓
Midtrans kirim webhook ke /api/midtrans/notification
    ↓
Backend update paymentStatus → "paid"
    ↓
Queue status → "waiting"
```

- **Handle expired**: cron tiap 5 menit cek queue dengan status `pending` > 30 menit → hapus.
- **Security**: verifikasi webhook signature Midtrans (`transaction_status`, `order_id`, `status_code`, `gross_amount`).

---

## 8. Notifikasi (PWA Push)

- **Web Push API**: gratis, unlimited, tanpa provider pihak ketiga.
- Customer cukup tap "Allow" sekali saat pertama buka halaman.
- Kirim notifikasi via `service worker` + `push event` dari backend.
- Trigger: `paid` → "Antrean A001, estimasi 20 menit"
- Trigger: saat dipanggil → "Antrean A001, silakan ke lokasi"
- Fallback: halaman web tetap bisa di-refresh customer untuk lihat status.

---

## 9. Non-Functional

- **PWA**: Bisa di-save ke home screen, push notification (fallback).
- **Responsive**: Mobile-first (95% traffic dari HP).
- **Loading**: Skeleton screen, form submit button disabled + spinner.
- **Error**: Midtrans gagal → tampilkan pesan jelas, data tetap tersimpan.
- **Rate limit**: 1 nomor WA per 5 menit untuk cegah spam antrean.

---

## 10. Roadmap

| Fase | Fitur |
|------|-------|
| **MVP** | Core flow: scan → pilih → bayar → antre. Admin dashboard dasar. |
| **Fase 2** | Notifikasi WA, rating, multi-layanan per antrean, multi-barber |
| **Fase 3** | Multi-cabang, laporan omzet, loyalty program |
| **Fase 4** | Mode offline (service worker), custom branding, white-label |

---

## 11. Arsitektur Folder

```
antrian/
├── server/          — Express.js API
│   ├── models/      — Mongoose schemas
│   ├── routes/      — Express routers
│   ├── controllers/ — Business logic
│   ├── middleware/   — Auth, error handler
│   ├── utils/       — Midtrans helper, queue helper
│   └── config/      — DB connection, env
│
├── client/          — Next.js (customer)
│   └── src/
│       ├── app/
│       │   ├── [slug]/         — Landing, Order, Queue status
│       │   └── api/            — Proxy ke server (opsional)
│       ├── components/         — Reusable UI
│       ├── lib/                — API client, utils
│       └── public/             — PWA assets
│
├── admin/            — Next.js (admin dashboard)
│   └── src/
│       ├── app/
│       │   ├── login/          — Admin login
│       │   ├── dashboard/      — Manage queues
│       │   └── api/            — Proxy ke server
│       ├── components/         — Admin UI components
│       └── lib/                — API client, auth context
│
├── prd.md
└── package.json     — Root workspace (scripts, shared config)
```

---

## 12. Pricing (Target)

| Paket | Harga/bulan | Fitur |
|-------|-------------|-------|
| Gratis | Rp0 | 1 cabang, max 50 antrean/hari, 1 admin |
| Starter | Rp49.000 | 1 cabang, unlimited, push notif, QRIS |
| Pro | Rp149.000 | 3 cabang, laporan, loyalty, prioritas support |
