# Deploy Bot ZenDev (Telegram)

Bot yang memicu deploy ZenDev ke VPS dengan satu perintah dari Telegram:
`/deploy`. Bot berjalan sebagai service systemd di VPS dan menjalankan
`scripts/deploy.sh` secara lokal.

## Alur singkat

```
[Telegram]  --long-polling-->  [VPS: zen-deploy-bot.service]
                                  |  subprocess: bash scripts/deploy.sh
                                  |  shared lock + local health gates
                                  v
                        [VPS 160.19.166.129: /var/www/zen-dev]
                                  pm2 startOrRestart ecosystem.config.js
```

## Runbook provisioning VPS (sekali saja)

1. **Buat bot Telegram BARU** via `@BotFather` → `/newbot` → simpan token.
   > Wajib bot terpisah dari bot SRE backend. Telegram hanya mengizinkan 1
   > polling per token — memakai token yang sama akan merusak kedua bot (error 409).

2. **Dapatkan Telegram user ID Anda** — kirim pesan apa pun ke bot, lalu cek
   `https://api.telegram.org/bot<TOKEN>/getUpdates` atau tanya `@userinfobot`.

3. **Siapkan user service non-root di VPS**. Jalankan sebagai administrator VPS
   (bukan dari bot) dan sesuaikan path binary bila distro berbeda:
   ```bash
   sudo useradd --system --create-home --shell /usr/sbin/nologin zen-deploy || true
   sudo install -d -o zen-deploy -g zen-deploy -m 0750 /opt/zen-deploy-bot
   sudo install -d -o zen-deploy -g zen-deploy -m 0750 /var/lib/zen-deploy
   sudo install -d -o zen-deploy -g zen-deploy -m 0750 /var/www/zen-dev
   sudo apt-get install -y nodejs npm nginx pm2 curl git unzip
   ```
   Salin checkout repository ke `/var/www/zen-dev` dan bot ke
   `/opt/zen-deploy-bot`. Seluruh checkout harus dimiliki `zen-deploy`; Nginx
   cukup mendapat akses baca/traverse ke `dist`, bukan akses tulis.

4. **Siapkan PM2 untuk user yang sama dengan service**:
   ```bash
   sudo -u zen-deploy env PM2_HOME=/var/lib/zen-deploy/pm2 pm2 ping
   command -v node
   command -v pm2
   ```
   Jika hasil binary bukan `/usr/bin/node` atau `/usr/bin/pm2`, ubah
   `NODE_BIN`/`PM2_BIN` pada unit systemd dan `.env.example` sebelum instalasi.

5. **Buat `.env`** dari template dan isi nilainya. Jangan menaruh token di
   unit systemd atau dokumentasi:
   ```bash
   cp /var/www/zen-dev/deploy-bot/.env.example /opt/zen-deploy-bot/.env
   chown zen-deploy:zen-deploy /opt/zen-deploy-bot/.env
   chmod 0600 /opt/zen-deploy-bot/.env
   ```
    Salin file itu ke `/opt/zen-deploy-bot/.env` dengan mode `0600`, lalu isi
    `TELEGRAM_BOT_TOKEN` dan `ALLOWED_USER_IDS` (wajib). Deploy bot dan SRE bot
    harus memakai token Telegram yang berbeda.

6. **Pasang dependency Python** pada VPS:
    ```bash
    cd /opt/zen-deploy-bot
    python3 -m venv .venv
    .venv/bin/pip install -r requirements.txt
    ```
    Dependency Python pada file ini belum hash-pinned; lakukan review versi
    dependency pada provisioning yang diawasi. Lock reproducibility deploy
    aplikasi tetap berasal dari `package-lock.json` melalui `npm ci`.

7. **Pasang konfigurasi Nginx**. `root` harus menunjuk ke
   `/var/www/zen-dev/dist`; proxy `/api/v1/` ke `http://127.0.0.1:5000`.
   Setelah setiap release, script menormalisasi direktori static menjadi `0755`
   dan file menjadi `0644`, sehingga Nginx dapat membaca tanpa write access.

8. **Aktifkan unit systemd** setelah file bot, `.env`, repository, Node, PM2,
   dan permission selesai diverifikasi:
   ```bash
   sudo install -m 0644 deploy-bot/zen-deploy-bot.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable --now zen-deploy-bot
   ```
   Verifikasi hanya dengan status/log (tidak menjalankan deploy otomatis):
   ```bash
   systemctl status zen-deploy-bot --no-pager
   journalctl -u zen-deploy-bot -n 100 --no-pager
   ```

## Menjalankan bot

```powershell
cd deploy-bot
.\start_bot.bat
```

## Perintah bot

| Perintah | Fungsi |
|---|---|
| `/deploy` | Mulai deploy → muncul tombol `✅ Deploy` / `❌ Batal` (kadaluarsa 5 menit) |
| `/deploy --skip-build` | Deploy tanpa build ulang (pakai `dist` yang sudah ada) |
| `/deploy --no-db` | Deploy tanpa menjalankan prisma db push |
| `/deploy --db` | Sertakan `prisma db push` — **NONAKTIF secara default** (fail-closed). Set `DEPLOY_DB_ENABLED=true` untuk mengaktifkan. Menyentuh skema produksi; backup `pg_dump` wajib sukses dulu |
| `/deploy --force` | Hanya kompatibilitas; **TIDAK membunuh/menggantikan deploy aktif** |
| `/status` | Status deploy (idle / sedang jalan / fase aktif) |
| `/cancel` | Batalkan konfirmasi deploy yang belum disetujui |
| `/logs [N]` | Lihat N baris log deploy terakhir |
| `/rollback` | Mengembalikan artifact dan dependency dari backup terakhir |
| `/ping` | Cek bot hidup |
| `/help` | Daftar perintah |

Hanya `ALLOWED_USER_IDS` yang bisa memakai bot. Pengguna lain tidak mendapat
balasan apa pun.

## Keamanan

- Token hanya di `deploy-bot/.env` (tidak di-commit).
- Tidak ada password VPS yang disimpan — autentikasi murni SSH key.
- Konfirmasi inline keyboard + TTL 5 menit mencegah deploy tidak sengaja.
- Lock directory berbagi dengan `scripts/deploy.sh` dalam format directory
  `deploy.lock/pid`. DeployManager memegang lock lebih dulu dan shell script
  mengadopsinya hanya jika PID lock adalah parent langsungnya; deploy manual
  membuat lock sendiri. Lock aktif tidak dapat dilewati dengan `--force`.
- Service berjalan sebagai user `zen-deploy`, bukan `root`.
- Unit memakai `ProtectSystem=strict`, `ProtectHome`, `NoNewPrivileges`,
  `PrivateTmp`, dan pembatasan capability/network.

## Safety gates dan rollback

- Sebelum install, deploy melakukan `git fetch` + `git reset --hard` ke
  `origin/<branch>` lalu memeriksa blob exact untuk seluruh artefak deployment
  yang wajib tracked, termasuk mode executable `scripts/deploy.sh`.
- Dependency dipasang dengan `npm ci` dari lockfile. Build wajib menghasilkan
  `dist/index.html` dan `server/dist/index.js`.
- Setelah PM2 lifecycle melalui ecosystem config absolute path, readiness lokal
  dan readiness eksternal harus sama-sama HTTP 200.
- Backup dipublikasikan atomik dan hanya dianggap valid jika frontend, backend,
  serta `server/node_modules` tersedia. Kegagalan health gate memicu restore
  atomik dan mengulang kedua health gate.
- Rollback aplikasi tidak membatalkan perubahan database dari `--db`/Prisma.
  Gunakan backup database dan prosedur migrasi terpisah; jangan menganggap
  rollback binary sebagai rollback schema.
- Guardrail `DEPLOY_DB_ENABLED`: `--db` ditolak secara default (fail-closed),
  baik oleh bot maupun `scripts/deploy.sh` (exit 26). Set `DEPLOY_DB_ENABLED=true`
  hanya bila perubahan schema produksi memang diizinkan. `--no-db` selalu menang
  atas `--db`; rollback tidak pernah menyentuh database.

## Menjalankan deploy secara manual (safety net)

Script `scripts/deploy.sh` tetap bisa dipakai manual di VPS:

```bash
./scripts/deploy.sh                      # build + deploy, tanpa db push
./scripts/deploy.sh --skip-build --no-db # hotfix cepat
./scripts/deploy.sh --db                 # prisma db push (WAJIB DEPLOY_DB_ENABLED=true)
```

Deployment memerlukan commit yang sudah dipush ke `origin`. Jalankan sebagai
`zen-deploy`, bukan root, dan pastikan `DEPLOY_LOCK_PATH` sama dengan unit
systemd. Log dan backup mengikuti `DEPLOY_LOG_DIR` serta `DEPLOY_BACKUP_DIR`.
Backup database terpisah mengikuti `DEPLOY_DATABASE_BACKUP_DIR` agar tidak ikut
terhapus saat release artifact diganti.

## Diagnostik aman

```bash
systemctl is-active zen-deploy-bot
sudo -u zen-deploy env PM2_HOME=/var/lib/zen-deploy/pm2 pm2 status
curl -fsS http://localhost:5000/api/v1/health/ready >/dev/null
curl -fsS https://zenstudio.my.id/api/v1/health/ready >/dev/null
```

Jangan mencetak `.env`, token Telegram, URL database, atau environment PM2 ke
chat/log. `--force` tidak membunuh proses deploy aktif dan hanya diteruskan
untuk kompatibilitas CLI.
