# Analisis Mobile: Konflik Klik "Login with Google" di Form Clerk

Terima kasih atas tambahan informasinya! Fakta bahwa ini terjadi di **versi mobile** memberikan petunjuk krusial. Masalah ini merupakan kombinasi klasik dari konflik *Tailwind Preflight* dan penanganan tata letak (*layouting*) pada tampilan *mobile* (Bottom Sheet) dari Clerk.

## Akar Masalah di Mobile (Root Causes)

1. **Invisible SVG Overlap (Tailwind Preflight Bug)**:
   Pada tampilan mobile, Clerk merender elemen-elemennya dalam satu kolom penuh (*full width*). Tailwind CSS secara *default* (melalui preflight-nya) mereset semua elemen `<svg>` menjadi `display: block`. 
   Jika Clerk tidak secara eksplisit mengunci ukuran ikon `<svg>` pada tombol "Login with Google", ikon tersebut dapat "memuai" (*stretch*) dan menutupi lapisan atas seluruh form secara transparan. Saat Anda mengklik "Use another method" atau tombol "X", secara fisik jari Anda menekan kanvas SVG milik tombol Google yang merentang secara tak kasat mata.

2. **Ghost Clicks (Click Bleeding) di iOS/Mobile**:
   Saat layar *mobile* melakukan transisi berat (seperti merender *bottom sheet* Clerk saat `overflow: hidden` ditambahkan ke `body`), kadang hit-area (*clickable area*) pada layar mengalami desinkronisasi dari tampilan visualnya, menyebabkan klik Anda menembus atau ditangkap oleh elemen yang salah.

## Proposed Changes & Troubleshooting Plan

Fokus utama kita adalah mengisolasi komponen Clerk dari intervensi *style* global Tailwind, dan memastikan tidak ada elemen yang tumpang tindih secara tidak terlihat.

### 1. Clerk CSS Isolation (Fix SVG Stretch)
Kita akan menambahkan *scoped CSS* di `index.css` secara eksklusif untuk melindungi komponen internal Clerk (yang kelas utamanya selalu berawalan `.cl-`). Ini akan menormalkan kembali SVG dan mereset tumpukan *z-index* agar tidak menutupi tombol lain di *mobile*:

```css
/* src/index.css */
/* Melindungi Clerk dari Tailwind Preflight di Mobile */
.cl-rootBox svg, 
.cl-component svg {
  display: inline-block !important;
  max-width: 100% !important;
}

.cl-rootBox button {
  position: relative;
  z-index: 50; /* Memastikan tombol selalu ada di atas */
}
```

### 2. Menonaktifkan Sementara `ClerkModalFix` (Langkah Verifikasi)
Untuk memastikan bahwa pendengar klik (click listener) `document.addEventListener('click', ...)` yang kita tambahkan tidak menyebabkan anomali event di *mobile browser* (seperti Safari di iOS), saya akan mem- *bypass* sementara intervensi klik `href="#"` pada kode tersebut.

## User Review Required
> [!IMPORTANT]
> Fakta bahwa ini terjadi di *mobile* sangat menguatkan dugaan **Invisible SVG Overlap**. Kita akan mengaplikasikan *CSS Isolation* terlebih dahulu. Jika masalah tersebut terselesaikan, kita akan tahu pasti bahwa Tailwind yang mendistorsi komponen Clerk. Apakah Anda setuju untuk mengeksekusi rencana perlindungan CSS ini?

## Verification Plan
- Buka aplikasi di perangkat *mobile* (atau *device emulator* di *browser*).
- Buka form Clerk (klik Coba Gratis / Masuk).
- Ketuk / *tap* tombol "Use another method" atau "X" (Close).
- Form seharusnya merespons tombol yang Anda ketuk secara akurat, bukan malah memicu *Login with Google*.
