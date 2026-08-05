# Product Requirements Document (PRD)
**Nama Produk:** Agent Secretary (Local Knowledge Base, File Watcher, & Auto-Rollback)  
**Versi:** 1.4.0  
**Target Platform:** Local Environment / OpenCode Terminal  
**Dokumen Status:** Updated (Draft)  

---

## 1. Ringkasan Eksekutif (Overview)
**Agent Secretary** adalah layanan *background* lokal yang cerdas untuk memantau, mencatat, dan mendistribusikan konteks perubahan file di ruang kerja pengguna. Agen ini mengombinasikan pencatatan presisi (*Content Diffing*), komunikasi proaktif (*Webhooks*), jaring pengaman (*Auto-Rollback*), serta dibekali arsitektur **Graceful Degradation** untuk memastikan agen tidak pernah merusak *workspace* meskipun terjadi kegagalan sistem internal.

## 2. Masalah yang Diselesaikan (Problem Statement)
1. **Kurangnya Konteks Mikro bagi AI:** AI tidak tahu baris spesifik mana yang diubah.
2. **Pemborosan Token & Latensi:** Membaca file utuh memboroskan memori AI.
3. **Inefisiensi Polling:** Polling (HTTP GET) terus-menerus memboroskan sumber daya.
4. **Risiko Modifikasi Berbahaya:** Kode yang *error* sulit dikembalikan tanpa *commit* Git.
5. **Kerapuhan Background Process:** Script watcher konvensional sering *crash* saat bertemu file biner besar, I/O *error*, atau saat koneksi API terputus.

## 3. Tujuan Produk (Objectives)
* Menyediakan log riwayat perubahan file yang kaya konteks (*Real-Time Content Diffing*).
* Mengubah arsitektur komunikasi menjadi proaktif menggunakan *Webhooks*.
* Menyediakan fitur *Auto-Rollback* untuk pemulihan instan.
* **Memastikan stabilitas 99.9%:** Menjamin bahwa kegagalan satu fungsi tidak akan menghentikan fungsi utama pemantauan file.

---

## 4. Fitur Utama (Functional Requirements)

### 4.1. Real-Time Directory Monitoring & Filtering
* Mendeteksi aktivitas file/folder secara *real-time*.
* **Smart Filter:** Mengabaikan sistem cache (`.git`, `node_modules`) dan memverifikasi perubahan file menggunakan *hash* MD5.

### 4.2. Real-Time Content Diffing
* Membandingkan isi file yang baru disimpan dengan *snapshot* memori secara *real-time* (`difflib`).
* Mencatat baris yang ditambah (`+`) dan dihapus (`-`).

### 4.3. Proactive Webhooks
* Mengirim *payload* data secara otomatis ke *listener* (misal: OpenCode AI) setelah *diffing* selesai.
* Menggunakan *Delay Buffer* 2 detik untuk mengelompokkan *event* beruntun (mencegah *spam*).

### 4.4. Auto-Rollback & Shadow Backup
* **Shadow Backup:** Menyimpan maksimal 60 *snapshot* fisik file di folder lokal `.cache/secretary_backups/` sebelum modifikasi diterapkan (cap otomatis — snapshot tertua dihapus saat melebihi 60).
* **Granular Restoring:** Memulihkan file spesifik ke titik waktu (*timestamp*) tertentu berdasarkan instruksi API.

---

## 5. Safety Nets & Fallback Mechanisms (Sistem Proteksi)

Agen menerapkan prinsip **Graceful Degradation**, di mana sistem akan menggunakan jalur cadangan jika fitur utama gagal:

| Fitur Utama | Potensi Kegagalan | Mekanisme Fallback / Safety Guard |
| :--- | :--- | :--- |
| **Auto-Rollback** | File cadangan korup / konflik disk | Menggunakan *Atomic Write* (tulis ke `.tmp` dulu). Jika gagal, rollback dibatalkan. |
| **Webhook Push** | AI *Offline* / *Network Timeout* | Dieksekusi di *background thread*. Jika gagal, *retry* 3x secara eksponensial, lalu simpan log di RAM. |
| **Content Diffing**| CPU hang karena file raksasa | **File Guard:** Bypass otomatis untuk file > 1MB atau biner. Beralih ke log dasar tanpa *diff*. |
| **JSON Database** | `Notulensi.json` korup | JSON rusak dipindah ke `.corrupted`, lalu membuat JSON baru dari RAM. |

---

## 6. Spesifikasi API & Data Model

### Rest API Endpoints
| Endpoint | Method | Parameter/Body | Deskripsi |
| :--- | :--- | :--- | :--- |
| `/notulensi/terakhir` | `GET` | `limit` (int) | Mengambil riwayat modifikasi terbaru. |
| `/notulensi/filter` | `GET` | `menit` / `kata_kunci`| Mencari riwayat perubahan spesifik. |
| `/notulensi/rollback`| `POST`| JSON (*target_file*, *timestamp*) | Mengeksekusi pemulihan file. |

---

## 7. Persyaratan Teknis (Tech Stack & Limits)
* **Bahasa Pemrograman:** Python 3.8+
* **Core Libraries:** `watchdog`, `difflib`, `hashlib`, `shutil`, `requests`, `collections.deque`
* **API Framework:** `fastapi` & `uvicorn`
* **Batasan Performa:**
  * CPU `idle`: < 1%
  * Maksimal ukuran `.cache/secretary_backups/`: ~50 MB.

---

## 8. Fase Pengembangan Selanjutnya (Future Roadmap)
* **Language-Aware Diffing (AST):** Mengurai perubahan kode berdasarkan struktur logika (Python AST).
* **Deep Git Integration:** Otomatis melakukan `git stash` atau `git add` pada eksekusi *rollback*.
