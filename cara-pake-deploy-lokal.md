# Panduan Penggunaan Script Deploy Lokal (Safety Net)

Dokumen ini berisi panduan singkat untuk merilis/memperbarui (deploy) aplikasi ZenDev secara manual langsung dari komputer Anda. Ini sangat berguna sebagai "jaring pengaman" (safety net) jika GitHub Actions sedang *down*, kuota bulanan gratisnya habis, atau jika Anda ingin deploy secara instan tanpa harus melakukan Git Push.

## Prasyarat
- Pastikan kode Anda sudah selesai dan berfungsi dengan baik di komputer lokal.
- Pastikan komputer Anda terhubung ke internet.

---

## Langkah-langkah Deploy

### 1. Buka Terminal
1. Buka **VS Code**.
2. Buka Terminal terintegrasi dengan menekan tombol **`Ctrl + \``** (Ctrl + Backtick) atau pilih menu **Terminal > New Terminal**.
3. Pastikan jenis terminal yang terbuka adalah **PowerShell**.

### 2. Jalankan Script
Ketikkan perintah berikut di dalam terminal, lalu tekan **Enter**:

```powershell
.\scripts\deploy.ps1
```
# IP VPS: 160.19.166.129

*(Jika Anda menemui error berwarna merah bertuliskan "running scripts is disabled", lihat bagian **Troubleshooting** di bawah).*

### 3. Masukkan Detail VPS
Script akan otomatis berjalan dan meminta 2 informasi dasar:
1. **IP VPS**: Ketik alamat IP VPS Anda (misal: `103.xxx.xxx.xxx`) lalu tekan Enter.
2. **Username VPS**: Ketik username VPS Anda (biasanya `root`) lalu tekan Enter.

*(Script akan mulai mem-build aplikasi dan membuat file kompresi zip. Tunggu sekitar 1-2 menit).*

### 4. Masukkan Password VPS (Transfer File)
Saat proses kompresi selesai, script akan mulai mengirim file (via SCP) ke VPS Anda. Terminal akan berhenti sejenak dan memunculkan tulisan seperti:
`root@103.xxx.xxx.xxx's password: `

- **Ketikkan password VPS Anda**, lalu tekan Enter.
- *Catatan Penting: Saat mengetik, kursor tidak akan bergerak dan huruf tidak akan muncul di layar. Ini adalah fitur keamanan standar. Teruskan saja mengetik dan tekan Enter.*

### 5. Masukkan Password VPS (Restart Server)
Setelah file terkirim (hanya butuh beberapa detik), script akan mengeksekusi perintah jarak jauh (via SSH) untuk me-restart aplikasi Anda di VPS menggunakan PM2.
- Terminal akan kembali meminta password VPS Anda.
- **Ketikkan ulang password Anda**, lalu tekan Enter.

**Selesai!** Jika muncul tulisan berwarna hijau "Deploy Selesai dan Berhasil! 🎉", berarti website Anda sudah berhasil di-update dengan versi kode yang paling baru.

---

## Troubleshooting (Mengatasi Error)

**Error:** `deploy.ps1 cannot be loaded because running scripts is disabled on this system.`
**Solusi:** Windows secara *default* memblokir eksekusi script eksternal demi keamanan. Anda harus memberikan izin sementara.
1. *Copy* (salin) dan *Paste* (tempel) perintah ini di terminal PowerShell:
   ```powershell
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   ```
2. Tekan Enter. (Jika ditanya Y/N, ketik `Y` lalu Enter).
3. Setelah itu, jalankan kembali `.\scripts\deploy.ps1`.

