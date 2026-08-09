# 🎨 ZenStudio — Dokumentasi Lingkungan Sistem (Environment)

> [!NOTE]
> **Pembaruan Terakhir:** 6 Agustus 2026 · **Produk:** Fotografi produk e-commerce berbasis AI (Shopee, Tokopedia)
> **Tujuan:** Referensi teknis full-stack lengkap untuk developer, DevOps, dan proses *onboarding*.

---

## 📋 Daftar Isi

| # | Bagian |
|---|---------|
| 1 | [Gambaran Umum Proyek](#1-gambaran-umum-proyek) |
| 2 | [Struktur Monorepo](#2-struktur-monorepo) |
| 3 | [Tech Stack — Frontend](#3-tech-stack--frontend) |
| 4 | [Tech Stack — Backend](#4-tech-stack--backend) |
| 5 | [Skema Database](#5-skema-database) |
| 6 | [Endpoint API](#6-endpoint-api) |
| 7 | [Autentikasi & Otorisasi](#7-autentikasi--otorisasi) |
| 8 | [Pipeline AI & Generate Gambar](#8-pipeline-ai--generate-gambar) |
| 9 | [Sistem Pembayaran (Xendit)](#9-sistem-pembayaran-xendit) |
| 10 | [Sistem Kredit & Saldo](#10-sistem-kredit--saldo) |
| 11 | [Agen AI SRE (Self-Healing)](#11-agen-ai-sre-self-healing) |
| 12 | [Telemetri & Pemantauan](#12-telemetri--pemantauan) |
| 13 | [Integrasi Bot Telegram](#13-integrasi-bot-telegram) |
| 14 | [Penjadwal (Cron Scheduler)](#14-penjadwal-cron-scheduler) |
| 15 | [Penyimpanan File](#15-penyimpanan-file) |
| 16 | [Arsitektur Keamanan](#16-arsitektur-keamanan) |
| 17 | [Environment Variables](#17-environment-variables) |
| 18 | [Infrastruktur Testing](#18-infrastruktur-testing) |
| 19 | [Build & Deployment](#19-build--deployment) |
| 20 | [Integrasi Pihak Ketiga](#20-integrasi-pihak-ketiga) |
| 21 | [Feature Flags](#21-feature-flags) |
| 22 | [Infrastruktur & Hosting](#22-infrastruktur--hosting) |
| 23 | [Agent Skills (AI Dev Tools)](#23-agent-skills-ai-dev-tools) |
| 24 | [Riwayat Versi & Changelog](#24-riwayat-versi--changelog) |

---

## 1. Gambaran Umum Proyek

**ZenStudio** adalah aplikasi web full-stack yang mengubah foto produk mentah menjadi gambar profesional yang siap dipajang di *marketplace* menggunakan teknologi AI. Target utama aplikasi ini adalah penjual *e-commerce* di Indonesia (seperti Tokopedia, Shopee, dan TikTok Shop).

### ✨ Fitur Utama

- 🖼️ **Generasi Gambar AI**: Penggantian latar belakang, peningkatan resolusi, dan penyesuaian gaya (restyling).
- 🤖 **Multi-AI Providers**: Integrasi API Replicate (Nano Banana Pro, Nano Banana 2, GPT Image 2).
- 💳 **Sistem Monetisasi Kredit**: Pembayaran otomatis menggunakan *payment gateway* Xendit.
- 💰 **Paket *Pay-as-you-go***: **Starter** (10 kredit = Rp 75.000) dan **Pro** (30 kredit = Rp 215.000).
- 🛡️ **Agen AI SRE (*Self-Healing*)**: Deteksi anomali mandiri, notifikasi Telegram, dan perbaikan otomatis (remediasi interaktif).
- 📊 **Observabilitas Penuh**: Telemetri klien, *health checks* cron, dan rekonsiliasi data otomatis.
- 🧾 **Sistem Top Up Terintegrasi**: Pemberian kredit idempoten, *polling* pembayaran, dan rekonsiliasi (V.1.1 Production-Ready).

### 🌐 URL Produksi

**➜ https://zenstudio.my.id**

---

## 2. Struktur Monorepo

```text
zen-dev/
├── index.html                          # Entry point aplikasi SPA (Frontend)
├── package.json                        # Root workspace (Frontend)
├── tsconfig.json                       # Konfigurasi TypeScript Frontend (Bundler)
├── vite.config.ts                      # Konfigurasi Vite & Code Splitting
├── tailwind.config.js                  # Tema Tailwind CSS
├── postcss.config.js                   # Plugin PostCSS
├── .env                                # Environment Variables Frontend
│
├── .agents/                            # Direktori Agent Skills (AI)
│   └── skills/
│       ├── agent-browser/
│       ├── find-skills/
│       ├── frontend-design/
│       └── grill-me/
│
├── server/
│   ├── package.json                    # Workspace Backend (CommonJS)
│   ├── tsconfig.json                   # Konfigurasi TypeScript Backend (Node16)
│   ├── .env                            # Environment Variables Server
│   ├── uploads/                        # Penyimpanan gambar hasil generate (Lokal)
│   └── prisma/
│       └── schema.prisma               # Skema Database (PostgreSQL)
│
├── src/                                # Source Code Frontend
│   ├── main.tsx                        # Entry React (ClerkProvider)
│   ├── App.tsx                         # Router Aplikasi
│   ├── index.css                       # Gaya Global (Global Styles)
│   ├── pages/                          # Halaman (LandingPage, StudioDashboard)
│   ├── components/                     # Komponen UI React
│   ├── context/                        # React Context (TopUpContext)
│   ├── hooks/                          # Custom Hooks (usePaymentStatus)
│   ├── services/                       # API Client Wrapper
│   └── lib/                            # Fungsi utilitas (credits, promptBuilder)
│
└── server/src/                         # Source Code Backend
    ├── index.ts                        # Entry point server Express
    ├── app.ts                          # Pabrik (Factory) Express App
    ├── config/                         # Konfigurasi Prisma Client
    ├── middleware/                     # Middleware Auth, Error, Telemetri
    ├── routes/                         # Endpoint API (health, user, generate, payments)
    ├── services/                       # Logika Bisnis (AI, Xendit, Storage)
    ├── agent/                          # Sistem AI SRE (Gemini 2.0, Telegram Bot)
    └── reconciliation/                 # Cron Rekonsiliasi Pembayaran
```

---

## 3. Tech Stack — Frontend

| Kategori | Teknologi | Versi | Tujuan |
|----------|-----------|-------|--------|
| **Framework** | React | ^19.2.8 | Library UI |
| **Bahasa** | TypeScript | ^7.0.2 | Pengembangan *type-safe* |
| **Build Tool** | Vite | ^8.1.5 | Dev server & *bundler* |
| **Routing** | React Router DOM | ^7.18.2 | Routing *Client-side* |
| **Auth** | Clerk React | ^5.61.9 | Manajemen Autentikasi UI |
| **Styling CSS** | Tailwind CSS | ^3.4.19 | *Utility-first CSS* |
| **Animasi** | Framer Motion | ^12.43.0 | Animasi deklaratif & transisi |
| **Ikon** | Lucide React | ^1.27.0 | Kumpulan ikon minimalis |
| **Testing** | Vitest & RTL | ^4.1.10 | *Test runner* dan integrasi |

### 🎨 Sistem Desain (Tailwind)

Sistem warna menggunakan tema modern dengan varian terang dan gelap (Glassmorphism siap).

- **Primary**: Indigo (`#4F46E5`)
- **Secondary**: Sky Blue (`#0EA5E9`)
- **Typography**: Inter (Google Fonts)

### 📄 Halaman & Rute Utama

- `/` → `LandingPage.tsx` (Halaman *marketing*, *pricing*, dan testimoni)
- `/studio` → `StudioDashboard.tsx` (Dashboard AI Editor yang memerlukan login)

---

## 4. Tech Stack — Backend

| Kategori | Teknologi | Versi | Tujuan |
|----------|-----------|-------|--------|
| **Runtime** | Node.js | — | Lingkungan eksekusi |
| **Framework** | Express | ^5.2.1 | HTTP Web Server |
| **Bahasa** | TypeScript | ^7.0.2 | Pengembangan *type-safe* |
| **ORM** | Prisma | ^5.22.0 | Akses database dan skema |
| **Database** | PostgreSQL (Neon)| — | Database utama (Serverless) |
| **Auth** | Clerk Express | ^2.1.48 | *Middleware* keamanan API |
| **Validasi** | Zod | ^4.4.3 | Validasi *schema* & data masuk |
| **AI SRE** | @google/genai | ^2.15.0 | Otomatisasi agen Gemini 2.0 Flash |
| **Pembayaran**| Xendit API | — | Proses webhook & penagihan IDR |

### 🔄 Alur Pipeline Express (`app.ts`)

1. Proxy Trust (Untuk Nginx)
2. Middleware Telemetri (Pemantauan latensi)
3. Rate Limiter Global (300 req/15mnt)
4. Helmet (Header Keamanan HTTP) & CORS
5. Parser Body (50MB untuk `/generate`, 1MB untuk lainnya + *rawBody*)
6. Clerk Middleware (Validasi sesi JWT)
7. Static File Server (Untuk direktori `/uploads/generations`)
8. Rute API Publik & Terproteksi

---

## 5. Skema Database

> [!NOTE]
> Database menggunakan PostgreSQL dari **Neon** (Serverless). ORM menggunakan Prisma.

### Tabel Utama

1. **`User`**: Data pengguna (terhubung dengan Clerk ID, unik).
2. **`UserCredit`**: Saldo kredit pengguna dengan optimisme *locking* (`version`) untuk keamanan konkuensi ganda.
3. **`Generation`**: Riwayat gambar hasil AI, ID Replicate, prompt, dan status (*pending, completed, failed*).
4. **`PaymentOrder`**: Status pesanan/invoice dari Xendit (*creating, pending, paid, settled*). Termasuk `idempotencyKey` yang aman.
5. **`CreditTransaction`**: Log audit kekal (tidak dapat diubah) dari seluruh pergerakan saldo kredit (+ dan -) untuk transparansi historis.

### Indeks (Indexing) Kritis

- `[userId, idempotencyKey]` pada `PaymentOrder` (Untuk menghindari pembayaran atau pemberian kredit ganda).
- `[status, createdAt]` pada `PaymentOrder` (Digunakan secara intensif oleh Cron Rekonsiliasi).

---

## 6. Endpoint API

**Base URL API:** `https://zenstudio.my.id/api/v1`

| Metode | Endpoint | Keterangan | Rate Limit |
|--------|----------|------------|------------|
| `GET` | `/health` | Pemeriksaan kesehatan (Publik) | Standar |
| `POST` | `/webhooks/clerk` | Sinkronisasi pendaftaran akun | Standar |
| `POST` | `/webhooks/xendit`| *Callback* notifikasi pembayaran | Standar |
| `POST` | `/telemetry` | Penerima log error dari Frontend | 10/mnt |
| `GET` | `/user/me` | Profil + Saldo Kredit | Autentikasi |
| `POST` | `/generate` | Eksekusi AI (Replicate) | 30/15mnt |
| `POST` | `/payments/orders`| Buat tagihan baru (Xendit) | 5/mnt |
| `GET` | `/payments/orders/:id`| *Polling* status pesanan UI | 5/mnt |

---

## 7. Autentikasi & Otorisasi

- **Frontend**: Menggunakan `@clerk/clerk-react`. Sesi diamankan di memori klien dan disematkan di setiap *header* permintaan via `services/api.ts`.
- **Backend**: Menggunakan `@clerk/express` dan *middleware* otorisasi khusus. Ekstraksi otomatis `userId` untuk pencarian ke tabel `User`.
- **User Sync**: Melalui Webhook Clerk, divalidasi menggunakan pustaka kriptografi **Svix** via `rawBody` request.

---

## 8. Pipeline AI & Generate Gambar

1. **Klien** mengirim: `{ imageUrl, prompt, provider }`.
2. **Server** memvalidasi *body* menggunakan **Zod** dan ukuran Base64 gambar (Maks. ~15MB encoded / 50MB request).
3. Mengunduh dan menyalin gambar asli ke penyimpanan lokal (`saveBase64Locally()`).
4. Eksekusi API **Replicate** (*Long-polling* otomatis tiap 3 detik selama maksimal 3 menit).
5. Hasil dari AI diunduh dan disimpan kembali di server VPS secara lokal.
6. **Transaksi Atomik (Prisma)**: Kredit dipotong dan riwayat `Generation` dicatat dalam satu transaksi DB yang sama.
7. Jika transaksi gagal, saldo pengguna tetap utuh.

---

## 9. Sistem Pembayaran (Xendit)

> [!NOTE]
> Terintegrasi penuh dengan Xendit Invoice API v2. Menggunakan mata uang IDR (Rupiah).

### 🛡️ 3 Lapis Ketahanan Webhook

1. **Idempotensi**: Menggunakan relasi `userId + idempotencyKey` pada tabel transaksi. Jika terjadi *request* ganda akibat sinyal buruk, database akan menolaknya.
2. **Webhook CAS (*Compare-And-Swap*)**: Sistem webhook Xendit memverifikasi token dan hanya mengubah status DB dari `pending` ke `settled`. Pemberian kredit disalurkan LEBIH DULU sebelum status pesanan diperbarui.
3. **Rekonsiliasi Berkala**: Jika Webhook gagal masuk, fitur rekonsiliasi yang berjalan setiap 15 menit otomatis memindai pesanan yang menggantung (*hung orders*) dan menyelesaikan kredit.

---

## 10. Sistem Kredit & Saldo

- **Tier Gratis**: Akun baru otomatis menerima **3 Kredit Gratis**.
- **Logika Pemotongan**:
  - GPT Image 1K/2K: 1 Kredit
  - GPT Image 4K: 2 Kredit
  - Nano Banana Pro: 2 Kredit (3 Kredit pada resolusi 4K)
  - Nano Banana 2: 2 Kredit
- **Audit Transaksi**: Semua pengeluaran dan pemasukan dicatat ke `CreditTransaction` yang menjadi buku besar mutlak (*ledger*).

---

## 11. Agen AI SRE (Self-Healing)

Sistem menggunakan **Gemini 2.0 Flash** untuk memantau diri sendiri secara otomatis.

1. Middleware menangkap *error* (Mis. HTTP 500, *High Latency* > 2000ms, *Out of Memory*).
2. Data PII dan *Secret Key* otomatis **dibersihkan (Sanitized)**.
3. Gemini AI mendiagnosis akar masalah.
4. Gemini mengeluarkan perintah mitigasi: `RESTART_PM2`, `AUTO_FIX_PUSH`, `GITHUB_ISSUE`, atau `NO_ACTION`.
5. Administrator dimintai persetujuan (*approval*) langsung dari **Telegram** sebelum tindakan sensitif seperti *restart* dilakukan.

---

## 12. Telemetri & Pemantauan

- Telemetri Server internal dikelola oleh kelas global `EventEmitter`.
- **Frontend Telemetri**: Klien Web dapat mengirim kejadian error atau kegagalan asinkron ke server `/telemetry` untuk ditindaklanjuti. Data klien diamankan dengan variabel khusus (`TELEMETRY_INGEST_SECRET`).

---

## 13. Integrasi Bot Telegram

Bot memantau server 24/7 dan mendengarkan perintah khusus dari Administrator:

| Perintah | Deskripsi |
|----------|-----------|
| `/health` | Memeriksa ketersediaan Database, Memori, CPU |
| `/restart`| Merestart aplikasi menggunakan layanan PM2 secara paksa |
| `/credit check <email>`| Mengecek dan melacak transaksi pengguna tertentu |
| `/order <id>`| Mendapatkan detail transaksi pesanan dari ID secara spesifik |

---

## 14. Penjadwal (Cron Scheduler)

Digunakan untuk operasi di balik layar secara asinkron menggunakan Node-cron.

- **Setiap 4 Menit**: Ping Database (Menghindari fitur auto-suspend Neon DB di tier gratis).
- **Setiap 15 Menit**: Pengecekan limit pemakaian RAM (>90% akan men-trigger Gemini SRE).
- **Setiap 15 Menit**: Rekonsiliasi sinkronisasi Xendit API.
- **Pukul 08:00 Pagi**: Mengirimkan rangkuman (*Daily Summary*) harian ke grup Telegram.

---

## 15. Penyimpanan File

- File tidak bergantung pada S3 AWS secara penuh untuk mengurangi *cost*.
- Gambar hasil *generate* disimpan secara terstruktur di VPS Server lokal pada path:
  `{process.cwd()}/uploads/generations/`
- Nama file dikodifikasi untuk menghindari tubrukan: `{timestamp}-{6-byte-hex}.{ext}`

---

## 16. Arsitektur Keamanan

> [!CAUTION]
> **Kebijakan Konten (CSP)** sudah diterapkan secara penuh di Frontend dengan integrasi Helmet di sisi API.

- **CORS**: Dibatasi ketat hanya pada domain resmi `https://zenstudio.my.id` dan *localhost* untuk keamanan.
- **Webhook Signature**: Clerk menggunakan *Svix signature*, Xendit menggunakan *timingSafeEqual* untuk menangkal *Timing Attack*.
- **Rate Limit Berlapis**: API publik menggunakan batas ketat (contoh: *Generate AI* hanya bisa dilakukan 30 kali per 15 menit per alamat IP).

---

## 17. Environment Variables

| Variabel | Keterangan | Letak |
|----------|------------|-------|
| `DATABASE_URL` | URL PostgreSQL Neon | Backend |
| `CLERK_SECRET_KEY` | Autentikasi Clerk | Backend |
| `VITE_CLERK_PUBLISHABLE_KEY` | Kunci Publik Clerk | Frontend |
| `REPLICATE_API_TOKEN` | Token layanan *AI Engine* | Backend |
| `GEMINI_API_KEY` | Otak agen AI SRE sistem | Backend |
| `XENDIT_API_KEY` | Gateway pembayaran Xendit | Backend |
| `TELEGRAM_BOT_TOKEN`| Bot pemantauan | Backend |

---

## 18. Infrastruktur Testing

- Menggunakan **Vitest**.
- Tersedia integrasi dengan `Supertest` untuk *Backend HTTP assertions*.
- `Puppeteer` & `jsdom` dipakai untuk DOM Simulasi klien.
- Eksekusi cepat melalui `npm test`.

---

## 19. Build & Deployment

- **VPS Server (Linux)** menggunakan **Nginx** sebagai *Reverse Proxy* dan mengatur SSL/TLS (HTTPS).
- Nginx melayani statis bundel Vite di Port 80/443, serta meneruskan *(proxy pass)* rute `/api/v1/*` ke port `5000` (Node.js/Express).
- `scripts/deploy.sh` adalah jalur deploy VPS yang canonical: checkout di-reset ke `origin/<branch>`, artefak deployment wajib tracked dan blob-nya diverifikasi, lalu dependency direproduksi dengan `npm ci`.
- Lock bersama berada di `/run/zen-deploy/deploy.lock` sebagai `deploy.lock/pid`. DeployManager membuat lock lebih dulu; shell script hanya mengadopsinya dari parent PID yang tepat. `--force` tidak melewati lock aktif.
- **PM2** dijalankan sebagai user non-root `zen-deploy` melalui `server/ecosystem.config.js` dengan script, cwd, Node interpreter, dan lokasi log absolute. Lifecycle menggunakan `startOrRestart` lalu `pm2 save`.
- Setelah build, permission `dist` dinormalisasi ke direktori `0755` dan file `0644` agar Nginx dapat membaca tanpa write access.
- Setiap deploy memiliki health gate lokal dan eksternal (`/api/v1/health/ready`). Kegagalan memulihkan backup artifact atomik yang tervalidasi dan mengulang kedua gate. Rollback binary tidak membatalkan perubahan database.
- Bot `zen-deploy-bot.service` berjalan sebagai `zen-deploy` dengan hardening systemd (`ProtectSystem`, `ProtectHome`, `NoNewPrivileges`, `PrivateTmp`, dan capability kosong). Provisioning serta prosedur operasional lengkap ada di `deploy-bot/README.md`.

---

## 20. Integrasi Pihak Ketiga

1. **Clerk**: Autentikasi Pengguna
2. **Neon**: Database Serverless PostgreSQL
3. **Replicate**: Eksekusi Model AI Berat
4. **Xendit**: Agregator pembayaran Indonesia (OVO, Dana, ShopeePay, VA, QRIS)
5. **Google Gemini**: Agen *Self-Healing* dan asisten pemeliharaan Server
6. **Telegram**: Alat pelaporan notifikasi instan.

---

## 21. Feature Flags

Seluruh kendali aplikasi berbasis lingkungan (Environment):
- `ENABLE_AUTO_RESTART_PM2`: Izinkan SRE untuk restart (default: true).
- `ENABLE_AUTO_GITHUB_ISSUE`: Pembuatan tiket laporan otomatis (default: true).
- `XENDIT_IS_PRODUCTION`: Tombol penentu antara *Sandbox* dan lingkungan penagihan uang nyata.

---

## 22. Infrastruktur & Hosting

- Infrastruktur disederhanakan melalui *Virtual Private Server* (VPS) Linux, terhubung langsung dengan domain resmi. Database tetap terpisah menggunakan Neon guna memecah beban I/O.

---

## 23. Agent Skills (AI Dev Tools)

Terdaftar dalam `.agents/skills` dan diawasi oleh `skills-lock.json`. Memungkinkan Agen AI untuk berinteraksi langsung menggunakan spesifikasi internal seperti pemahaman UI/UX, eksplorasi repositori, hingga eksekusi browser otonom untuk E2E *testing*.

---

## 24. Riwayat Versi & Changelog

- **V.1.1 (6 Agustus 2026)**: Peningkatan stabilisasi sistem Top Up, mitigasi kebocoran memori Frontend (Blob URL), optimasi CSS CSP & *Lazy-loading*, dan implementasi agen *Self-Healing* (SRE).
- **V.1.0 (Juli 2026)**: Rilis inisiasi *Monorepo*, penggabungan React dan Express, konfigurasi integrasi Replicate AI & Clerk.
