# Product Requirements Document (PRD)

**Nama Fitur:** Studio-Grade Auto Prompt (Mannequin Edition)  
**Status:** Draft  
**Target Rilis:** Q3/Q4  

## 1. Ringkasan Eksekutif
Fitur **Studio-Grade Auto Prompt** dirancang untuk membantu penjual fashion, pemilik butik, dan *brand* pakaian untuk mengubah foto produk mentah (menggunakan patung/mannequin atau gantungan) menjadi foto produk profesional berskala studio. Sistem akan secara otomatis menganalisis foto asli, mengekstrak elemen penting dari pakaian, dan menyusun *prompt* AI (serta parameter kontrol) untuk menghasilkan gambar akhir berkualitas tinggi. 

**Prioritas Mutlak:** Tidak boleh ada halusinasi AI pada bentuk, motif, tekstur, dan warna pakaian asli. AI hanya diizinkan untuk berkreasi pada *lighting*, bayangan, sudut pandang kamera, dan latar belakang (*background*).

## 2. Tujuan & Metrik Kesuksesan (Goals & Metrics)
### Tujuan:
*   **Efisiensi:** Memberikan efisiensi biaya dan waktu bagi *seller* tanpa perlu menyewa studio foto atau fotografer profesional.
*   **Otomatisasi:** Mengotomatiskan pembuatan *prompt* yang kompleks menjadi satu kali klik (One-Click Studio).
*   **Akurasi Inti:** Menjamin akurasi 100% pada elemen inti produk (Bentuk, Motif, Tekstur, Warna).

### Metrik Kesuksesan (KPI):
*   **Fidelity Score:** >98% tingkat kesamaan warna, tekstur, dan motif (berdasarkan evaluasi sistem dan *feedback* pengguna).
*   **Conversion Rate:** Persentase pengguna yang menyimpan atau mengunduh hasil *generate* gambar (>70%).
*   **Processing Time:** Waktu dari *upload* hingga hasil akhir <15 detik.

## 3. Prioritas & Persyaratan Inti (Core Requirements)
Untuk mencapai prioritas yang telah ditetapkan, fitur ini membutuhkan kombinasi *prompt engineering* otomatis dan sistem kontrol gambar tingkat lanjut (seperti ControlNet pada Stable Diffusion atau teknologi referensi gambar sejenis).

*   **Color Retention (Kunci Warna):** Sistem harus mengunci *hex code* atau profil warna dominan dari baju asli agar tidak berubah saat terkena simulasi *lighting* studio.
*   **Texture & Pattern Lock (Kunci Tekstur & Motif):** AI dilarang keras untuk "menghaluskan" atau merusak motif (misal: garis-garis, kotak, logo, atau tekstur rajut/linen).
*   **Shape Preservation & Mannequin Removal:** Sistem harus mampu mendeteksi batas baju (*edge detection*) dan secara cerdas menghapus patung/mannequin (*ghost mannequin effect*) atau menyamarkannya menjadi bentuk 3D alami tanpa mengubah siluet baju asli.

## 4. Spesifikasi Fungsional Fitur

### A. Sistem Analisis Gambar & Auto-Prompting (Backend)
Ketika pengguna mengunggah foto baju di patung, sistem akan memproses hal berikut di latar belakang:
1.  **Vision Analysis:** AI mendeteksi jenis pakaian (kemeja, gaun, celana), jenis bahan (katun, satin, denim), dan warna.
2.  **Prompt Assembly:** Sistem merakit *prompt* teks secara dinamis berdasarkan hasil analisis.
    *   *Contoh Struktur Prompt Otomatis:* `[Tipe Baju] berbahan [Tekstur], [Warna/Motif], ghost mannequin photography, flat front view, 8k resolution, highly detailed, macro texture photography, professional studio lighting, soft shadows, neutral aesthetic backdrop, shot on Hasselblad, commercial fashion photography.`
3.  **Creative Freedom (Untuk Latar & Cahaya):** AI akan menambahkan elemen *prompt* secara acak (atau berdasarkan tema yang dipilih pengguna) seperti: `soft gradient background`, `dramatic rim lighting`, atau `minimalist studio setup`.

### B. User Interface / Alur Pengguna (Frontend)
1.  **Upload:** Pengguna mengunggah foto mentah (baju di patung/gantungan).
2.  **Auto-Detect & Crop:** Sistem otomatis memisahkan baju dari *background* asli (*background removal*).
3.  **Pilihan Vibe (Opsional):** Pengguna dapat memilih "Nuansa Studio" (misal: *Minimalist White*, *Moody Dark*, *Warm E-commerce*). Jika tidak memilih, sistem akan menggunakan *default prompt*.
4.  **Generate:** Menampilkan *loading screen* saat AI memproses *auto-prompt* dan melakukan *image generation*.
5.  **Output:** Pengguna menerima 3-4 variasi foto produk studio dengan *lighting* dan *background* berbeda, tetapi detail baju tetap 100% identik dengan aslinya.

## 5. Kebutuhan Teknis (Technical Requirements)
*   **Image-to-Image / Inpainting Pipeline:** Menggunakan arsitektur AI generatif yang mendukung *masking*. Area baju asli di-*mask* (dilindungi sepenuhnya dari perubahan tekstur/bentuk), sementara sisa kanvas (patung yang terlihat, latar belakang) di-*generate* ulang oleh AI.
*   **ControlNet (Canny/Depth/Tile):** Wajib diimplementasikan di *backend* untuk memastikan bentuk kerah, lipatan baju, dan proporsi tidak terdistorsi selama proses generasi.
*   **Upscaler / Detail Refiner:** Hasil akhir harus melewati proses *upscaling* untuk mempertegas serat kain agar terlihat seperti difoto dengan kamera makro profesional, menghindari efek "lukisan AI" (AI smoothing).

## 6. Batasan, Risiko & Mitigasi

| Risiko | Tingkat Dampak | Mitigasi |
| :--- | :--- | :--- |
| **Halusinasi Motif** (Motif terdistorsi) | Tinggi | Menggunakan metode *strict masking*. AI tidak boleh merender ulang bagian kain baju, melainkan hanya memberikan *filter lighting* (*overlay* bayangan/cahaya) pada bagian tersebut. |
| **Pencahayaan Tidak Realistis** | Sedang | *Auto-prompt* wajib menyertakan parameter `consistent global illumination` dan menyesuaikan kecerahan baju asli dengan lingkungan AI. |
| **Sisa Mannequin Terlihat** | Tinggi | Integrasikan model segmentasi gambar (seperti SAM - *Segment Anything Model*) untuk mendeteksi tepi patung dan memotongnya dengan presisi sebelum masuk *generator*. |

## 7. Fase Pengembangan (Roadmap)
*   **Fase 1 (Proof of Concept):** Fokus pada *background removal* presisi dan penerapan *strict masking* agar baju tidak berubah sama sekali. *Auto-prompt* di-set ke satu gaya studio standar (latar putih terang).
*   **Fase 2 (Beta):** Memasukkan deteksi otomatis jenis kain (Vision AI) dan menyesuaikan *prompt* secara dinamis (contoh: jika terdeteksi kain satin, otomatis mendapatkan *prompt lighting* yang lebih reflektif).
*   **Fase 3 (V1 Launch):** Penambahan opsi tema studio (*creative freedom* pengguna) dan implementasi penghapusan patung (*ghost mannequin*) secara cerdas dengan *inpainting*.