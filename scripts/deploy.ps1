param (
    [string]$VpsIp = "160.19.166.129",
    [string]$VpsUser = "zen-deploy",
    [string]$TargetDir = "/var/www/zen-dev",
    [switch]$SkipBuild,
    [switch]$SkipTest,
    [switch]$NoDb,
    [switch]$DbPush,
    [switch]$Force,
    [switch]$Rollback,
    [string]$LogFile = ""
)

# ==========================================
# ZenDev Deploy Script (non-interaktif)
# Dijalankan oleh bot Telegram ATAU manual dari terminal.
# Tidak ada prompt interaktif. Semua kredensial via SSH key (~/.ssh).
# ==========================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ProgressPreference = 'SilentlyContinue'

# ---------- Logging (stdout + optional file) ----------
$script:logStream = $null
if ($LogFile) {
    $logDir = Split-Path -Parent $LogFile
    if ($logDir -and -not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }
    $script:logStream = New-Object System.IO.StreamWriter($LogFile, $true, [System.Text.Encoding]::UTF8)
}

function Log([string]$msg) {
    Write-Output $msg
    if ($script:logStream) { $script:logStream.WriteLine($msg); $script:logStream.Flush() }
}

function Phase([string]$name) {
    Log "[PHASE] $name"
}

function Fail([string]$msg, [int]$code = 1) {
    Log "[FAILED] $msg"
    Log "[FAILED] exit_code=$code"
    if ($script:logStream) { $script:logStream.Dispose(); $script:logStream = $null }
    exit $code
}

function Finish-Deploy() {
    Log "[SUCCESS] Deploy selesai dan health check lolos."
    if ($script:logStream) { $script:logStream.Dispose(); $script:logStream = $null }
}

# ---------- Konfigurasi SSH / SCP ----------
$SshOpts = @("-o", "BatchMode=yes", "-o", "ConnectTimeout=15", "-o", "StrictHostKeyChecking=accept-new")
$SshTarget = "${VpsUser}@${VpsIp}"
$HealthUrlLocal = "http://localhost:5000/api/v1/health/ready"
$HealthUrlExternal = "https://zenstudio.my.id/api/v1/health/ready"

Log "========================================"
Log "      ZenDev Deploy (Non-Interaktif)    "
Log "========================================"
Log "Target: $SshTarget : $TargetDir"

# ---------- Lock (satu deploy dalam satu waktu, dibagi bot + manual) ----------
$LockDir = Join-Path $env:LOCALAPPDATA "zen-deploy"
New-Item -ItemType Directory -Path $LockDir -Force | Out-Null
$LockFile = Join-Path $LockDir "deploy.lock"

function Acquire-Lock {
    if (Test-Path $LockFile) {
        $rawLock = (Get-Content $LockFile -Raw).Trim()
        $lockPid = 0
        if ([int]::TryParse($rawLock, [ref]$lockPid) -and $lockPid -gt 0) {
            $alive = Get-Process -Id $lockPid -ErrorAction SilentlyContinue
            if ($alive -and -not $Force) {
                Fail "Deploy lain sedang berjalan (PID $lockPid). Ketik /status atau tunggu. Gunakan -Force untuk memaksa." 75
            }
            if ($alive -and $Force) {
                Log "[LOCK] Deploy lain berjalan (PID $lockPid) - di-bypass karena -Force"
            } else {
                Log "[LOCK] Lock usang (PID $lockPid tidak aktif) - diambil alih"
            }
        }
    }
    "$PID" | Set-Content -Path $LockFile -NoNewline
}

function Release-Lock {
    if (Test-Path $LockFile) {
        try {
            $lockPid = [int]((Get-Content $LockFile -Raw).Trim())
            if ($lockPid -eq $PID) { Remove-Item $LockFile -Force }
        } catch { }
    }
}

try {
    Acquire-Lock

    if ($Rollback) {
        Phase "rollback"
        Log "Melakukan rollback ke versi sebelumnya di VPS..."
        $rollbackScript = @'
set -e
cd __TARGET__
if [ ! -d dist.prev ]; then
    echo "TIDAK ADA BACKUP: dist.prev tidak ditemukan"
    exit 1
fi
rm -rf dist
mv dist.prev dist

if [ -d server/node_modules.bak ]; then
    rm -rf server/node_modules
    mv server/node_modules.bak server/node_modules
fi

pm2 restart backend-api || pm2 start server/dist/index.js --name "backend-api"
pm2 save

sleep 2
READY=""
for i in 1 2 3 4 5 6; do
  READY=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://localhost:5000/api/v1/health/ready || true)
  if [ "$READY" = "200" ]; then break; fi
  sleep 5
done
if [ "$READY" != "200" ]; then echo "HEALTH_LOCAL_FAIL status=$READY"; exit 20; fi
echo "HEALTH_LOCAL_OK"
'@
        $rollbackScript = $rollbackScript.Replace("__TARGET__", $TargetDir)
        & ssh $SshOpts $SshTarget $rollbackScript 2>&1 | ForEach-Object { Log $_ }
        if ($LASTEXITCODE -ne 0) { Fail "Rollback GAGAL (exit $LASTEXITCODE)." 5 }
        Log "Rollback: OK"
        Release-Lock
        Finish-Deploy
        exit 0
    }

    # ---------- PRE-FLIGHT: info repo ----------
    Phase "preflight"
    $gitSha = (& git rev-parse HEAD 2>$null).Trim()
    $dirtyCount = (& git status --porcelain 2>$null | Measure-Object -Line).Lines
    Log "Git SHA: $gitSha"
    Log "Dirty files: $dirtyCount"

    # ---------- PRE-FLIGHT: node & VPS reachability + disk ----------
    $localNode = (& node --version 2>$null).Trim()
    Log "Node lokal: $localNode"

    $connectResult = (& ssh -o BatchMode=yes -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new $SshTarget "echo OK_CONNECT" 2>$null) -join ""
    if ($LASTEXITCODE -ne 0 -or $connectResult.Trim() -ne "OK_CONNECT") {
        Fail "VPS tidak terjangkau atau SSH key belum disetup. Jalankan scripts/setup-ssh.ps1 dulu. Detail: $connectResult" 4
    }
    Log "Koneksi SSH ke VPS: OK (passwordless)"

    $vpsNode = (& ssh $SshOpts $SshTarget "node --version" 2>$null).Trim()
    if ($vpsNode) {
        Log "Node VPS: $vpsNode"
        if ($vpsNode -ne $localNode) {
            Log "[WARN] Versi Node berbeda - build lokal ($localNode) vs VPS ($vpsNode). Jika crash saat start, cek ini dulu."
        }
    }

    $diskMb = (& ssh $SshOpts $SshTarget "df -Pm $TargetDir | awk 'NR==2{print `$4}'" 2>$null).Trim()
    if ($diskMb -match '^\d+$') {
        Log "Disk VPS tersedia: ${diskMb} MB"
        if ([int]$diskMb -lt 2048) {
            Fail "Disk VPS tidak cukup (<2GB). Kosongkan dulu: pm2 flush, hapus .prev / release.zip di VPS." 5
        }
    } else {
        Log "[WARN] Tidak bisa membaca ukuran disk VPS."
    }

    # ---------- TEST ----------
    if (-not $SkipTest) {
        Phase "test"
        Log "Menjalankan npm test..."
        & npm test 2>&1 | ForEach-Object { Log $_ }
        if ($LASTEXITCODE -ne 0) { Fail "Test GAGAL (exit $LASTEXITCODE). Gunakan --skip-test jika ingin melewati." 1 }
        Log "Test: OK"
    } else {
        Log "Test: SKIP (--skip-test)"
    }

    # ---------- BUILD ----------
    if (-not $SkipBuild) {
        Phase "frontend-build"
        Log "Membangun frontend (npm run build)..."
        & npm run build 2>&1 | ForEach-Object { Log $_ }
        if ($LASTEXITCODE -ne 0) { Fail "Build frontend GAGAL (exit $LASTEXITCODE)." 1 }
        Log "Build frontend: OK"

        Phase "backend-build"
        Push-Location "server"
        try {
            Log "Menjalankan prisma generate..."
            & npx prisma generate 2>&1 | ForEach-Object { Log $_ }
            if ($LASTEXITCODE -ne 0) { Fail "prisma generate GAGAL (exit $LASTEXITCODE)." 1 }
            Log "Menjalankan build backend..."
            & npm run build 2>&1 | ForEach-Object { Log $_ }
            if ($LASTEXITCODE -ne 0) { Fail "Build backend GAGAL (exit $LASTEXITCODE)." 1 }
        } finally {
            Pop-Location
        }
        Log "Build backend: OK"
    } else {
        Log "Build: SKIP (--skip-build) - memakai dist yang sudah ada"
        if (-not (Test-Path "dist/index.html")) { Fail "--skip-build tapi dist/index.html tidak ada." 1 }
        if (-not (Test-Path "server/dist/index.js")) { Fail "--skip-build tapi server/dist/index.js tidak ada." 1 }
    }

    # ---------- PACKAGE (ZIP) ----------
    Phase "package"
    $tempDir = "deploy_temp"
    if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
    New-Item -ItemType Directory -Path "$tempDir/server/prisma" -Force | Out-Null
    
    # Destination harus menunjuk ke parent folder agar folder sumber disalin utuh
    Copy-Item -Path "dist" -Destination "$tempDir/" -Recurse -Force
    Copy-Item -Path "server/dist" -Destination "$tempDir/server/" -Recurse -Force
    
    Copy-Item -Path "server/package.json" -Destination "$tempDir/server/" -Force
    if (Test-Path "server/package-lock.json") { Copy-Item -Path "server/package-lock.json" -Destination "$tempDir/server/" -Force }
    Copy-Item -Path "server/prisma/*" -Destination "$tempDir/server/prisma/" -Recurse -Force
    Copy-Item -Path "package.json" -Destination "$tempDir/" -Force

    $schemaHash = (Get-FileHash "server/prisma/schema.prisma" -Algorithm SHA256).Hash
    $manifest = @{
        sha        = $gitSha
        dirtyCount = $dirtyCount
        schemaHash = $schemaHash
        node       = $localNode
        deployedAt = (Get-Date -Format "yyyy-MM-ddTHH:mm:sszzz")
    } | ConvertTo-Json -Compress
    Set-Content -Path "$tempDir/deploy.json" -Value $manifest

    if (Test-Path "release.zip") { Remove-Item "release.zip" -Force }
    Compress-Archive -Path "$tempDir/*" -DestinationPath "release.zip" -Force
    Remove-Item -Path $tempDir -Recurse -Force
    Log "release.zip dibuat: $((Get-Item release.zip).Length) bytes"

    # Verifikasi isi zip (mencegah deploy build kosong)
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path "release.zip"))
    $entryNames = $zip.Entries.FullName
    $zip.Dispose()
    if (-not ($entryNames -contains "dist/index.html")) { Fail "release.zip tidak berisi dist/index.html - build tidak valid." 2 }
    if (-not ($entryNames -contains "server/dist/index.js")) { Fail "release.zip tidak berisi server/dist/index.js - build tidak valid." 2 }
    Log "Isi zip terverifikasi: dist/index.html + server/dist/index.js OK"

    # ---------- UPLOAD (SCP) ----------
    Phase "upload"
    Log "Mengirim release.zip ke VPS..."
    & scp $SshOpts "release.zip" "${SshTarget}:${TargetDir}/release.zip" 2>&1 | ForEach-Object { Log $_ }
    if ($LASTEXITCODE -ne 0) { Fail "SCP upload GAGAL (exit $LASTEXITCODE)." 3 }
    Log "Upload: OK"

    # ---------- REMOTE (pasang + restart) ----------
    Phase "remote"
    # Snippet bash yang dijalankan di VPS dari folder server/ (mirror deploy.sh):
    # backup pg_dump WAJIB sukses sebelum prisma db push; fail bila pg_dump atau
    # DATABASE_URL tidak tersedia.
    $dbCmd = if ($DbPush -and -not $NoDb) {
        @'
# Guardrail F3 (fail-closed): prisma db push hanya boleh jalan setelah backup pg_dump berhasil.
if ! command -v pg_dump >/dev/null 2>&1; then
    echo "DB_GATE_BLOCKED: pg_dump tidak tersedia di VPS; schema produksi tidak boleh berubah tanpa backup"
    exit 26
fi
if [ -z "${DATABASE_URL:-}" ] && [ -f ./.env ]; then
    DATABASE_URL="$(grep -E '^DATABASE_URL=' ./.env | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'" || true)"
    export DATABASE_URL
fi
if [ -z "${DATABASE_URL:-}" ]; then
    echo "DB_GATE_BLOCKED: DATABASE_URL tidak tersedia; schema produksi tidak boleh berubah tanpa backup"
    exit 26
fi
mkdir -p /var/backups/zen-dev-database
BACKUP_FILE="/var/backups/zen-dev-database/db-$(date +%Y%m%d-%H%M%S).dump"
if ! pg_dump -Fc "$DATABASE_URL" -f "$BACKUP_FILE" 2>/dev/null; then
    echo "DB_GATE_BLOCKED: pg_dump gagal; prisma db push dihentikan untuk menjaga rollback safety"
    exit 11
fi
echo "DATABASE_BACKUP_OK: $BACKUP_FILE"
npx prisma db push --skip-generate
'@
    } else { "echo DB_SKIPPED" }

    # Script bash dijalankan di VPS. Gunakan placeholder yang di-replace di bawah.
    $remoteScript = @'
set -e
cd __TARGET__

# Lock remote (melindungi dari deploy dari mesin lain)
if [ -d deploy.lock ]; then echo "LOCKED: deploy lain berjalan di VPS"; exit 75; fi
mkdir deploy.lock
trap 'rmdir deploy.lock 2>/dev/null || true' EXIT

# Validasi zip sebelum menyentuh apa pun
command -v unzip >/dev/null 2>&1 || (apt-get update >/dev/null 2>&1 && apt-get install -y unzip >/dev/null 2>&1)
unzip -tq release.zip >/dev/null 2>&1 || { echo "ZIP_CORRUPT"; exit 3; }

# Backup versi lama untuk rollback
rm -rf dist.prev
[ -d dist ] && mv dist dist.prev
rm -rf server/node_modules.bak
[ -d server/node_modules ] && mv server/node_modules server/node_modules.bak

# Ekstrak versi baru
unzip -o release.zip
rm -f release.zip

cd server
if [ -f package-lock.json ]; then
    npm ci --omit=dev --no-audit --no-fund
else
    npm install --omit=dev --no-audit --no-fund
fi
npx prisma generate
__DB_CMD__
cd ..

pm2 restart backend-api || pm2 start server/dist/index.js --name "backend-api"
pm2 save

# Health gate lokal (backend + DB) dengan toleransi cold-start
sleep 2
READY=""
for i in 1 2 3 4 5 6; do
  READY=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://localhost:5000/api/v1/health/ready || true)
  if [ "$READY" = "200" ]; then break; fi
  sleep 5
done
if [ "$READY" != "200" ]; then echo "HEALTH_LOCAL_FAIL status=$READY"; exit 20; fi
echo "HEALTH_LOCAL_OK"
'@

    $remoteScript = $remoteScript.Replace("__TARGET__", $TargetDir)
    $remoteScript = $remoteScript.Replace("__DB_CMD__", $dbCmd)

    Log "Menjalankan perintah remote di VPS..."
    & ssh $SshOpts $SshTarget $remoteScript 2>&1 | ForEach-Object { Log $_ }
    if ($LASTEXITCODE -ne 0) { Fail "Eksekusi remote GAGAL (exit $LASTEXITCODE). Lihat log di atas." 4 }
    Log "Remote: OK (extract + install + restart + health-lokal lolos)"

    # ---------- HEALTH GATE EKSTERNAL ----------
    Phase "health-check"
    Log "Cek eksternal: $HealthUrlExternal"
    $extOk = $false
    for ($i = 1; $i -le 6; $i++) {
        try {
            $resp = Invoke-WebRequest -Uri $HealthUrlExternal -UseBasicParsing -TimeoutSec 15 -ErrorAction Stop
            if ($resp.StatusCode -eq 200) { $extOk = $true; break }
        } catch {
            $code = "no-response"
            if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
            Log "  percobaan ${i}: HTTP $code (belum siap?)"
        }
        Start-Sleep -Seconds 5
    }
    if (-not $extOk) { Fail "Health check eksternal gagal setelah 6 percobaan." 21 }
    Log "Health check eksternal: OK (200)"

    # Bersihkan release.zip lokal
    if (Test-Path "release.zip") { Remove-Item "release.zip" -Force }

    Release-Lock
    Finish-Deploy
} catch {
    Release-Lock
    Fail "Exception: $($_.Exception.Message)"
}
