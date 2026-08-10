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
    [string]$LogFile = "",
    [string]$KnownHostsFile = "",
    [switch]$AllowDirty,
    [string]$ChangeTicket = ""
)

# ==========================================
# ZenDev Deploy Script (non-interaktif)
# Dijalankan oleh bot Telegram ATAU manual dari terminal.
# Tidak ada prompt interaktif. Semua kredensial via SSH key (~/.ssh).
# ==========================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ProgressPreference = 'SilentlyContinue'
$KnownHostsFile = if ($KnownHostsFile) { $KnownHostsFile } else { Join-Path $HOME '.ssh/known_hosts' }
$script:evidence = [ordered]@{
    contract = 'scripts/deploy.ps1'
    status = 'STARTED'
    startedAt = (Get-Date).ToUniversalTime().ToString('o')
    phases = @()
}
$script:evidenceFile = $null

function Write-Evidence {
    if (-not $script:evidenceFile) { return }
    try {
        $script:evidence | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $script:evidenceFile -Encoding UTF8
    } catch { Write-Output "[WARN] Evidence write failed: $($_.Exception.Message)" }
}

function Validate-Input {
    if ([string]::IsNullOrWhiteSpace($VpsIp) -or $VpsIp -notmatch '^[A-Za-z0-9][A-Za-z0-9.:-]*$') { Fail "VpsIp tidak valid." 2 }
    if ([string]::IsNullOrWhiteSpace($VpsUser) -or $VpsUser -notmatch '^[A-Za-z_][A-Za-z0-9_-]{0,31}$') { Fail "VpsUser tidak valid." 2 }
    if ([string]::IsNullOrWhiteSpace($TargetDir) -or $TargetDir -notmatch '^/[A-Za-z0-9._/-]+$' -or $TargetDir -match '/\.\.?(/|$)') { Fail "TargetDir harus absolute dan path-safe." 2 }
    if ($TargetDir -ne '/var/www/zen-dev') { Fail "TargetDir harus /var/www/zen-dev karena ecosystem.config.js memakai app root production tersebut." 2 }
    if ($DbPush -and $NoDb) { Fail "-DbPush dan -NoDb tidak boleh dipakai bersamaan." 2 }
    if ($Rollback -and ($SkipBuild -or $SkipTest -or $DbPush -or $NoDb)) { Fail "-Rollback tidak boleh digabung dengan flag build/test/database." 2 }
    if ($AllowDirty -and $ChangeTicket -notmatch '^(CHG|INC|RFC)-[A-Za-z0-9._-]+$') { Fail "-AllowDirty wajib disertai -ChangeTicket CHG/INC/RFC yang dapat diaudit." 2 }
    if (-not $AllowDirty -and $ChangeTicket) { Fail "-ChangeTicket hanya boleh dipakai bersama -AllowDirty." 2 }
    if (-not (Test-Path -LiteralPath $KnownHostsFile -PathType Leaf)) { Fail "Known-hosts file tidak ditemukan: $KnownHostsFile. Provision host key terlebih dahulu." 2 }
    foreach ($tool in @('ssh','scp')) { if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) { Fail "$tool tidak ditemukan." 2 } }
    if ($DbPush -and $env:DEPLOY_DB_ENABLED -notin @('1','true','TRUE')) { Fail "Migrasi database diblokir. Set DEPLOY_DB_ENABLED=true secara eksplisit untuk opt-in." 26 }
}

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
    if ($script:evidence) { $script:evidence.phases += $name; Write-Evidence }
}

function Fail([string]$msg, [int]$code = 1) {
    Log "[FAILED] $msg"
    Log "[FAILED] exit_code=$code"
    Release-RemoteLock
    if ($script:evidence) { $script:evidence.status = 'FAILED'; $script:evidence.failure = $msg; $script:evidence.exitCode = $code; Write-Evidence }
    if ($script:logStream) { $script:logStream.Dispose(); $script:logStream = $null }
    exit $code
}

function Finish-Deploy() {
    Log "[SUCCESS] Deploy selesai dan health check lolos."
    if ($script:evidence) { $script:evidence.status = 'SUCCEEDED'; $script:evidence.finishedAt = (Get-Date).ToUniversalTime().ToString('o'); Write-Evidence }
    if ($script:logStream) { $script:logStream.Dispose(); $script:logStream = $null }
}

# ---------- Konfigurasi SSH / SCP ----------
$SshOpts = @("-o", "BatchMode=yes", "-o", "ConnectTimeout=15", "-o", "StrictHostKeyChecking=yes", "-o", "UserKnownHostsFile=$KnownHostsFile")
$SshTarget = "${VpsUser}@${VpsIp}"
$HealthUrlLocal = "http://localhost:5000/api/v1/health/ready"
$HealthUrlExternal = "https://zenstudio.my.id/api/v1/health/ready"
$script:remoteLockAcquired = $false
$script:remoteLock = $null
$script:lockToken = $null

function Release-RemoteLock {
    if (-not $script:remoteLockAcquired -or -not $script:remoteLock) { return }
    $release = "token=`$(cat '$script:remoteLock/token' 2>/dev/null || true); if [ `$token = '$script:lockToken' ]; then rm -rf '$script:remoteLock'; fi"
    & ssh $SshOpts $SshTarget $release 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        $script:remoteLockAcquired = $false
    } else {
        Log "[WARN] Remote lock cleanup gagal (exit $LASTEXITCODE); operator harus memeriksa lock secara aman."
    }
}

Log "========================================"
Log "      ZenDev Deploy (Non-Interaktif)    "
Log "========================================"
Log "Target: $SshTarget : $TargetDir"
Validate-Input

# ---------- Lock (satu deploy dalam satu waktu, dibagi bot + manual) ----------
$LockDir = Join-Path $env:LOCALAPPDATA "zen-deploy"
New-Item -ItemType Directory -Path $LockDir -Force | Out-Null
$LockFile = Join-Path $LockDir "deploy.lock"

function Acquire-Lock {
    $stream = $null
    try {
        $stream = [System.IO.File]::Open($LockFile, [System.IO.FileMode]::CreateNew, [System.IO.FileAccess]::ReadWrite, [System.IO.FileShare]::None)
    } catch [System.IO.IOException] {
        $rawLock = ""
        try { $rawLock = (Get-Content $LockFile -Raw -ErrorAction Stop).Trim() } catch { }
        $lockPid = 0
        $alive = $null
        if ([int]::TryParse($rawLock, [ref]$lockPid) -and $lockPid -gt 0) {
            $alive = Get-Process -Id $lockPid -ErrorAction SilentlyContinue
        }
        if ($alive) {
            if (-not $Force) {
                Fail "Deploy lain sedang berjalan (PID $lockPid). Ketik /status atau tunggu. Gunakan -Force untuk memaksa." 75
            }
            Log "[LOCK] Deploy lain berjalan (PID $lockPid) - di-bypass karena -Force"
        } else {
            Log "[LOCK] Lock usang (PID $lockPid tidak aktif) - diambil alih"
        }
        # Lock lama dihapus lalu dibuat ulang secara atomik (stale atau di-bypass).
        # Baca ulang isi lock sebelum hapus: jika sudah kosong (pemilik selesai)
        # langsung lanjut buat; jika berubah ke PID lain, deploy lain baru saja
        # mengambil alih -> tolak (mencegah menghapus lock milik proses lain).
        $currentLock = ""
        try { $currentLock = (Get-Content $LockFile -Raw -ErrorAction Stop).Trim() } catch { }
        if ($currentLock -ne "" -and $currentLock -ne $rawLock) {
            Fail "Deploy lain sedang berjalan (lock berubah saat akuisisi)." 75
        }
        if ($currentLock -ne "") {
            try {
                Remove-Item $LockFile -Force -ErrorAction Stop
            } catch {
                if (Test-Path $LockFile) { Fail "Deploy lain sedang berjalan (lock file dibuat ulang)." 75 }
            }
        }
        try {
            $stream = [System.IO.File]::Open($LockFile, [System.IO.FileMode]::CreateNew, [System.IO.FileAccess]::ReadWrite, [System.IO.FileShare]::None)
        } catch [System.IO.IOException] {
            if ($stream) { $stream.Dispose() }
            Fail "Deploy lain sedang berjalan (lock file dibuat ulang)." 75
        }
    }
    $writer = New-Object System.IO.StreamWriter($stream)
    $writer.Write($PID)
    $writer.Flush()
    $writer.Dispose()
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
# backend-api dipegang daemon PM2 milik bot systemd (PM2_HOME=/var/lib/zen-deploy/pm2)
export PM2_HOME=${PM2_HOME:-/var/lib/zen-deploy/pm2}
cd __TARGET__
if [ ! -d dist.prev ]; then
    echo "TIDAK ADA BACKUP: dist.prev tidak ditemukan"
    exit 1
fi
rm -rf dist
mv dist.prev dist

if [ -d server/dist.prev ]; then
    rm -rf server/dist
    mv server/dist.prev server/dist
fi

if [ -d server/node_modules.bak ]; then
    rm -rf server/node_modules
    mv server/node_modules.bak server/node_modules
fi

META_BACKUP="__TARGET__/.deploy/metadata.prev"
if [ ! -d "$META_BACKUP" ]; then
    echo "TIDAK ADA BACKUP: release metadata tidak ditemukan"
    exit 1
fi
rm -f package.json deploy.json manifest.sha256 server/package.json server/package-lock.json server/ecosystem.config.js
rm -rf server/prisma
[ -f "$META_BACKUP/package.json" ] && cp -a "$META_BACKUP/package.json" package.json
[ -f "$META_BACKUP/deploy.json" ] && cp -a "$META_BACKUP/deploy.json" deploy.json
[ -f "$META_BACKUP/manifest.sha256" ] && cp -a "$META_BACKUP/manifest.sha256" manifest.sha256
[ -f "$META_BACKUP/server/package.json" ] && cp -a "$META_BACKUP/server/package.json" server/package.json
[ -f "$META_BACKUP/server/package-lock.json" ] && cp -a "$META_BACKUP/server/package-lock.json" server/package-lock.json
[ -f "$META_BACKUP/server/ecosystem.config.js" ] && cp -a "$META_BACKUP/server/ecosystem.config.js" server/ecosystem.config.js
[ -d "$META_BACKUP/server/prisma" ] && cp -a "$META_BACKUP/server/prisma" server/prisma

pm2 startOrRestart __TARGET__/server/ecosystem.config.js --update-env
pm2 save

sleep 2
READY=""
for i in 1 2 3 4 5 6; do
  READY_BODY=$(curl -fsS --max-time 10 http://localhost:5000/api/v1/health/ready 2>/dev/null || true)
  READY=$(printf '%s' "$READY_BODY" | grep -Eq '"status"[[:space:]]*:[[:space:]]*"ready"' && echo 200 || echo 000)
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
    $releaseId = "{0}-{1}-{2}" -f $gitSha.Substring(0, [Math]::Min(12, $gitSha.Length)), (Get-Date -Format 'yyyyMMddHHmmss'), ([guid]::NewGuid().ToString('N').Substring(0,8))
    $script:evidenceFile = Join-Path (Get-Location) "deployment-evidence-$releaseId.json"
    $script:evidence.releaseId = $releaseId
    $script:evidence.gitSha = $gitSha
    $script:evidence.target = "${SshTarget}:$TargetDir"
    $script:evidence.hostKeyPolicy = 'StrictHostKeyChecking=yes'
    $script:evidence.dirtyWorkingTree = ($dirtyCount -gt 0)
    Write-Evidence
    Log "Git SHA: $gitSha"
    Log "Dirty files: $dirtyCount"
    if ($dirtyCount -gt 0) {
        if (-not $AllowDirty) { Fail "Working tree dirty ($dirtyCount file). Deploy diblokir; commit/stash dahulu atau gunakan -AllowDirty -ChangeTicket CHG-... yang diaudit." 12 }
        $script:evidence.dirtyOverride = $ChangeTicket
        Write-Evidence
        Log "[AUDIT] Dirty-tree override disetujui untuk ticket $ChangeTicket"
    }

    # ---------- PRE-FLIGHT: node & VPS reachability + disk ----------
    $localNode = (& node --version 2>$null).Trim()
    Log "Node lokal: $localNode"

    $connectResult = (& ssh $SshOpts $SshTarget "echo OK_CONNECT" 2>$null) -join ""
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
    Copy-Item -Path "server/ecosystem.config.js" -Destination "$tempDir/server/" -Force

    $schemaHash = (Get-FileHash "server/prisma/schema.prisma" -Algorithm SHA256).Hash
    $manifest = [ordered]@{
        releaseId  = $releaseId
        sha        = $gitSha
        dirtyCount = $dirtyCount
        schemaHash = $schemaHash
        node       = $localNode
        deployedAt = (Get-Date -Format "yyyy-MM-ddTHH:mm:sszzz")
    }
    $manifest.manifestFile = 'manifest.sha256'
    $manifest | ConvertTo-Json -Compress | Set-Content -Path "$tempDir/deploy.json" -Encoding UTF8
    $tempRoot = (Resolve-Path $tempDir).Path.TrimEnd('\') + '\'
    $checksums = Get-ChildItem -LiteralPath $tempDir -File -Recurse | Sort-Object FullName | ForEach-Object {
        $relative = $_.FullName.Substring($tempRoot.Length).Replace('\','/')
        $hash = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
        "$hash  $relative"
    }
    $checksums | Set-Content -Path "$tempDir/manifest.sha256" -Encoding ASCII

    if (Test-Path "release.zip") { Remove-Item "release.zip" -Force }
    Compress-Archive -Path "$tempDir/*" -DestinationPath "release.zip" -Force
    Remove-Item -Path $tempDir -Recurse -Force
    $artifactName = "release-$releaseId.zip"
    $archiveHash = (Get-FileHash -LiteralPath "release.zip" -Algorithm SHA256).Hash.ToLowerInvariant()
    "$archiveHash  $artifactName" | Set-Content -Path "$artifactName.sha256" -Encoding ASCII
    Log "release.zip dibuat: $((Get-Item release.zip).Length) bytes, SHA256=$archiveHash"

    # Verifikasi isi zip (mencegah deploy build kosong)
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path "release.zip"))
    $entryNames = @($zip.Entries | ForEach-Object { $_.FullName.Replace('\', '/') })
    $zip.Dispose()
    # ZipArchive.Entries can expose FullName as a scalar when the archive has
    # one entry or as a collection with PowerShell-specific comparison rules.
    # Normalize the check through the pipeline so valid root-level artifacts
    # are not rejected before upload.
    if (-not ($entryNames | Where-Object { $_ -eq "dist/index.html" })) { Fail "release.zip tidak berisi dist/index.html - build tidak valid." 2 }
    if (-not ($entryNames | Where-Object { $_ -eq "server/dist/index.js" })) { Fail "release.zip tidak berisi server/dist/index.js - build tidak valid." 2 }
    if (-not ($entryNames | Where-Object { $_ -eq "server/ecosystem.config.js" })) { Fail "release.zip tidak berisi ecosystem config." 2 }
    if (-not ($entryNames | Where-Object { $_ -eq "manifest.sha256" })) { Fail "release.zip tidak berisi manifest checksum." 2 }
    $script:evidence.artifact = [ordered]@{ file = $artifactName; bytes = (Get-Item release.zip).Length; archiveSha256 = $archiveHash; manifest = 'manifest.sha256' }
    Write-Evidence
    Log "Isi zip terverifikasi: build, ecosystem config, manifest checksum OK"

    # ---------- UPLOAD (SCP) ----------
    Phase "upload"
    $remoteDeployRoot = "$TargetDir/.deploy"
    $remoteArtifact = "$remoteDeployRoot/releases/$artifactName"
    $remoteChecksum = "$remoteDeployRoot/releases/$artifactName.sha256"
    $remoteLock = "$remoteDeployRoot/deploy.lock"
    $lockToken = [guid]::NewGuid().ToString('N')
    $script:remoteLock = $remoteLock
    $script:lockToken = $lockToken
    $lockAcquire = "set -eu; umask 077; mkdir -p '$remoteDeployRoot/releases'; if ! mkdir '$remoteLock' 2>/dev/null; then echo REMOTE_LOCKED; exit 75; fi; printf '%s\n' '$lockToken' > '$remoteLock/token'"
    & ssh $SshOpts $SshTarget $lockAcquire 2>&1 | ForEach-Object { Log $_ }
    if ($LASTEXITCODE -ne 0) { Fail "Remote lock tidak dapat diambil; upload dibatalkan." 75 }
    $script:remoteLockAcquired = $true
    Log "Remote lock: OK (sebelum upload)"
    Log "Mengirim artifact unik $releaseId ke VPS..."
    & scp $SshOpts "release.zip" "${SshTarget}:${remoteArtifact}" 2>&1 | ForEach-Object { Log $_ }
    if ($LASTEXITCODE -ne 0) { Fail "SCP upload GAGAL (exit $LASTEXITCODE)." 3 }
    & scp $SshOpts "$artifactName.sha256" "${SshTarget}:${remoteChecksum}" 2>&1 | ForEach-Object { Log $_ }
    if ($LASTEXITCODE -ne 0) { Fail "SCP checksum sidecar GAGAL (exit $LASTEXITCODE)." 3 }
    Log "Upload: OK"

    # ---------- REMOTE (pasang + restart) ----------
    Phase "remote"
    # Snippet bash yang dijalankan di VPS dari folder server/ (mirror deploy.sh):
    # backup pg_dump WAJIB sukses sebelum prisma migrate deploy; fail bila pg_dump atau
    # DIRECT_DATABASE_URL tidak tersedia.
    $dbCmd = if ($DbPush -and -not $NoDb) {
        @'
# Guardrail F3 (fail-closed): prisma migrate deploy hanya boleh jalan setelah backup pg_dump berhasil.
if ! command -v pg_dump >/dev/null 2>&1; then
    echo "DB_GATE_BLOCKED: pg_dump tidak tersedia di VPS; schema produksi tidak boleh berubah tanpa backup"
    exit 26
fi
if [ -z "${DIRECT_DATABASE_URL:-}" ] && [ -f ./.env ]; then
    DIRECT_DATABASE_URL="$(grep -E '^DIRECT_DATABASE_URL=' ./.env | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'" || true)"
    export DIRECT_DATABASE_URL
fi
if [ -z "${DIRECT_DATABASE_URL:-}" ]; then
    if [ -z "${DATABASE_URL:-}" ] && [ -f ./.env ]; then
        DATABASE_URL="$(grep -E '^DATABASE_URL=' ./.env | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'" || true)"
        export DATABASE_URL
    fi
    if [ -z "${DATABASE_URL:-}" ]; then
        echo "DB_GATE_BLOCKED: DIRECT_DATABASE_URL tidak tersedia; schema produksi tidak boleh berubah tanpa backup"
        exit 26
    fi
fi
mkdir -p /var/lib/zen-deploy/database-backups
BACKUP_FILE="/var/lib/zen-deploy/database-backups/db-$(date +%Y%m%d-%H%M%S).dump"
DB_DUMP_URL="${DIRECT_DATABASE_URL:-${DATABASE_URL:-}}"
if ! pg_dump -Fc "$DB_DUMP_URL" -f "$BACKUP_FILE" 2>/dev/null; then
    echo "DB_GATE_BLOCKED: pg_dump gagal; prisma migrate deploy dihentikan untuk menjaga rollback safety"
    exit 11
fi
echo "DATABASE_BACKUP_OK: $BACKUP_FILE"
npx prisma migrate deploy
'@
    } else { "echo DB_SKIPPED" }

    # Script bash dijalankan di VPS. Gunakan placeholder yang di-replace di bawah.
$remoteScript = @'
set -Eeuo pipefail
# backend-api dipegang daemon PM2 milik bot systemd (PM2_HOME=/var/lib/zen-deploy/pm2)
export PM2_HOME=${PM2_HOME:-/var/lib/zen-deploy/pm2}
cd __TARGET__

# Remote lock sudah diambil atomik sebelum upload. Token mencegah proses lain
# menghapus lock ini saat deploy berjalan.
if [ ! -f "__LOCK__/token" ] || [ "$(cat "__LOCK__/token")" != "__TOKEN__" ]; then echo "REMOTE_LOCK_LOST"; exit 75; fi
trap 'if [ -f "__LOCK__/token" ] && [ "$(cat "__LOCK__/token")" = "__TOKEN__" ]; then rm -rf "__LOCK__"; fi' EXIT

# Validasi artifact dan manifest sebelum current release disentuh.
command -v unzip >/dev/null 2>&1 || { echo "UNZIP_MISSING"; exit 3; }
command -v sha256sum >/dev/null 2>&1 || { echo "SHA256SUM_MISSING"; exit 3; }
RELEASE_NAME="__ARTIFACT_NAME__"
(cd "__TARGET__/.deploy/releases" && sha256sum -c "$RELEASE_NAME.sha256" >/dev/null)
unzip -tq "__ARTIFACT__" >/dev/null 2>&1 || { echo "ZIP_CORRUPT"; exit 3; }
STAGE="__TARGET__/.deploy/staging/__RELEASE__"
rm -rf "$STAGE"
mkdir -p "$STAGE"
unzip -q "__ARTIFACT__" -d "$STAGE"
(cd "$STAGE" && sha256sum -c manifest.sha256 >/dev/null)
[ -s "$STAGE/deploy.json" ] || { echo "MANIFEST_MISSING"; exit 3; }
grep -Eq '"releaseId"[[:space:]]*:[[:space:]]*"__RELEASE__"' "$STAGE/deploy.json" || { echo "MANIFEST_RELEASE_MISMATCH"; exit 3; }
[ -s "$STAGE/dist/index.html" ] || { echo "MANIFEST_INVALID_FRONTEND"; exit 3; }
[ -s "$STAGE/server/dist/index.js" ] || { echo "MANIFEST_INVALID_BACKEND"; exit 3; }
[ -s "$STAGE/server/ecosystem.config.js" ] || { echo "MANIFEST_INVALID_ECOSYSTEM"; exit 3; }

ROLLBACK_IN_PROGRESS=false
restore_release_metadata() {
    local backup="__TARGET__/.deploy/metadata.prev"
    if [ ! -d "$backup" ]; then echo "ROLLBACK_METADATA_UNAVAILABLE"; return 1; fi
    rm -f package.json deploy.json manifest.sha256 server/package.json server/package-lock.json server/ecosystem.config.js
    rm -rf server/prisma
    [ -f "$backup/package.json" ] && cp -a "$backup/package.json" package.json
    [ -f "$backup/deploy.json" ] && cp -a "$backup/deploy.json" deploy.json
    [ -f "$backup/manifest.sha256" ] && cp -a "$backup/manifest.sha256" manifest.sha256
    [ -f "$backup/server/package.json" ] && cp -a "$backup/server/package.json" server/package.json
    [ -f "$backup/server/package-lock.json" ] && cp -a "$backup/server/package-lock.json" server/package-lock.json
    [ -f "$backup/server/ecosystem.config.js" ] && cp -a "$backup/server/ecosystem.config.js" server/ecosystem.config.js
    [ -d "$backup/server/prisma" ] && cp -a "$backup/server/prisma" server/prisma
}
rollback() {
    echo "ROLLBACK: memulihkan versi sebelumnya"
    # ERR trap bisa terpicu saat CWD berada di server/ (mis. npm install gagal);
    # pindah dulu ke root target agar semua path relatif benar.
    cd __TARGET__ || return 1
    # Hanya restore jika backup tersedia; tanpa backup (first deploy), rilis baru
    # tetap dibiarkan utuh agar tidak menghancurkan satu-satunya salinan.
    if [ ! -d dist.prev ]; then echo "ROLLBACK_UNAVAILABLE"; return 1; fi
    if [ -d dist.prev ]; then
        rm -rf dist
        mv dist.prev dist
    fi
    if [ -d server/dist.prev ]; then
        rm -rf server/dist
        mv server/dist.prev server/dist
    fi
    if [ -d server/node_modules.bak ]; then
        rm -rf server/node_modules
        mv server/node_modules.bak server/node_modules
    fi
    restore_release_metadata || return 1
    pm2 restart backend-api || pm2 start server/dist/index.js --name "backend-api"
    pm2 save
    sleep 2
    READY=""
    for i in 1 2 3 4 5 6; do
      READY_BODY=$(curl -fsS --max-time 10 http://localhost:5000/api/v1/health/ready 2>/dev/null || true)
      READY=$(printf '%s' "$READY_BODY" | grep -Eq '"status"[[:space:]]*:[[:space:]]*"ready"' && echo 200 || echo 000)
      if [ "$READY" = "200" ]; then break; fi
      sleep 5
    done
    if [ "$READY" != "200" ]; then echo "ROLLBACK_HEALTH_FAIL status=$READY"; return 1; fi
    echo "ROLLBACK_HEALTH_OK"
    return 0
}
handle_error() {
    local code=$1
    trap - ERR
    if [ "$ROLLBACK_IN_PROGRESS" = "true" ]; then
        exit "$code"
    fi
    echo "DEPLOY_FAILED: exit $code, mencoba rollback otomatis"
    ROLLBACK_IN_PROGRESS=true
    rollback || exit 22
    exit "$code"
}
# Auto-rollback pada SEMUA error (install, prisma, build, db) - bukan hanya health gate
trap 'handle_error $?' ERR

# Install dependencies in the validated staging release, never in current.
if [ -f server/.env ]; then cp server/.env "$STAGE/server/.env"; fi
cd "$STAGE/server"
if [ -f package-lock.json ]; then
    npm ci --omit=dev --no-audit --no-fund
else
    npm install --omit=dev --no-audit --no-fund
fi
npx prisma generate
__DB_CMD__
cd ..

# Promote only after extraction, checksum, dependency install and optional DB
# gate succeeded. Existing current is moved aside, never deleted first.
cd __TARGET__
META_BACKUP="__TARGET__/.deploy/metadata.prev"
rm -rf "$META_BACKUP"
mkdir -p "$META_BACKUP/server"
[ -f package.json ] && cp -a package.json "$META_BACKUP/package.json"
[ -f deploy.json ] && cp -a deploy.json "$META_BACKUP/deploy.json"
[ -f manifest.sha256 ] && cp -a manifest.sha256 "$META_BACKUP/manifest.sha256"
[ -f server/package.json ] && cp -a server/package.json "$META_BACKUP/server/package.json"
[ -f server/package-lock.json ] && cp -a server/package-lock.json "$META_BACKUP/server/package-lock.json"
[ -f server/ecosystem.config.js ] && cp -a server/ecosystem.config.js "$META_BACKUP/server/ecosystem.config.js"
[ -d server/prisma ] && cp -a server/prisma "$META_BACKUP/server/prisma"
rm -rf dist.prev server/dist.prev server/node_modules.bak
[ -d dist ] && mv dist dist.prev
[ -d server/dist ] && mv server/dist server/dist.prev
[ -d server/node_modules ] && mv server/node_modules server/node_modules.bak
mv "$STAGE/dist" dist
mv "$STAGE/server/dist" server/dist
mv "$STAGE/server/node_modules" server/node_modules
cp "$STAGE/package.json" package.json
cp "$STAGE/deploy.json" deploy.json
cp "$STAGE/manifest.sha256" manifest.sha256
cp "$STAGE/server/package.json" server/package.json
[ -f "$STAGE/server/package-lock.json" ] && cp "$STAGE/server/package-lock.json" server/package-lock.json
cp "$STAGE/server/ecosystem.config.js" server/ecosystem.config.js
rm -rf server/prisma
cp -a "$STAGE/server/prisma" server/prisma
rm -rf "$STAGE" "__ARTIFACT__"

pm2 startOrRestart __TARGET__/server/ecosystem.config.js --update-env
pm2 save

# Health gate lokal (backend + DB) dengan toleransi cold-start
sleep 2
READY=""
for i in 1 2 3 4 5 6; do
      READY_BODY=$(curl -fsS --max-time 10 http://localhost:5000/api/v1/health/ready 2>/dev/null || true)
      READY=$(printf '%s' "$READY_BODY" | grep -Eq '"status"[[:space:]]*:[[:space:]]*"ready"' && echo 200 || echo 000)
  if [ "$READY" = "200" ]; then break; fi
  sleep 5
done
if [ "$READY" != "200" ]; then
    echo "HEALTH_LOCAL_FAIL status=$READY"
    rollback || exit 22
    exit 20
fi
echo "HEALTH_LOCAL_OK"

# Health gate eksternal (full stack via Nginx/HTTPS) dengan auto-rollback
EXT=""
for i in 1 2 3 4 5 6; do
  EXT_BODY=$(curl -fsS --max-time 15 https://zenstudio.my.id/api/v1/health/ready 2>/dev/null || true)
  EXT=$(printf '%s' "$EXT_BODY" | grep -Eq '"status"[[:space:]]*:[[:space:]]*"ready"' && echo 200 || echo 000)
  if [ "$EXT" = "200" ]; then break; fi
  sleep 5
done
if [ "$EXT" != "200" ]; then
    echo "HEALTH_EXTERNAL_FAIL status=$EXT"
    rollback || exit 22
    exit 21
fi
echo "HEALTH_EXTERNAL_OK"
'@

    $remoteScript = $remoteScript.Replace("__TARGET__", $TargetDir)
    $remoteScript = $remoteScript.Replace("__DB_CMD__", $dbCmd)
    $remoteScript = $remoteScript.Replace("__ARTIFACT__", $remoteArtifact)
    $remoteScript = $remoteScript.Replace("__ARTIFACT_NAME__", $artifactName)
    $remoteScript = $remoteScript.Replace("__LOCK__", $remoteLock)
    $remoteScript = $remoteScript.Replace("__TOKEN__", $lockToken)
    $remoteScript = $remoteScript.Replace("__RELEASE__", $releaseId)
    # PowerShell source files may carry a UTF-8 BOM and CRLF line endings;
    # normalize both before piping the script to Linux Bash.
    $remoteScript = $remoteScript.Replace("`r`n", "`n")

    Log "Menjalankan perintah remote di VPS..."
    # PowerShell 5.1 adds a BOM when piping text to native processes. Write a
    # BOM-less UTF-8 temp file and let cmd.exe perform raw stdin redirection.
    $remoteScriptPath = [System.IO.Path]::GetTempFileName()
    try {
        $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
        [System.IO.File]::WriteAllText($remoteScriptPath, $remoteScript, $utf8NoBom)
        $sshCommand = "ssh $($SshOpts -join ' ') $SshTarget bash -s < `"$remoteScriptPath`""
        & cmd.exe /d /c $sshCommand 2>&1 | ForEach-Object { Log $_ }
    } finally {
        if (Test-Path $remoteScriptPath) { Remove-Item $remoteScriptPath -Force -ErrorAction SilentlyContinue }
    }
    if ($LASTEXITCODE -ne 0) { Fail "Eksekusi remote GAGAL (exit $LASTEXITCODE). Lihat log di atas." 4 }
    Release-RemoteLock
    Log "Remote: OK (extract + install + restart + health-lokal lolos)"

    # ---------- HEALTH GATE EKSTERNAL (ADVISORY) ----------
    # Check eksternal sudah diverifikasi + auto-rollback dari sisi VPS (remote
    # script di atas). Check dari mesin lokal ini hanya informasional karena
    # jaringan lokal (proxy/DNS/CDN edge) bisa menghasilkan false-negative.
    Phase "health-check"
    Log "Cek eksternal (advisory): $HealthUrlExternal"
    $extOk = $false
    for ($i = 1; $i -le 6; $i++) {
        try {
            $resp = Invoke-WebRequest -Uri $HealthUrlExternal -UseBasicParsing -TimeoutSec 15 -ErrorAction Stop
            if ($resp.StatusCode -eq 200 -and $resp.Content -match '"status"\s*:\s*"ready"') { $extOk = $true; break }
        } catch {
            $code = "no-response"
            if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
            Log "  percobaan ${i}: HTTP $code (belum siap?)"
        }
        Start-Sleep -Seconds 5
    }
    if ($extOk) {
        Log "Health check eksternal: OK (200)"
        if ($script:evidence) { $script:evidence.externalHealth = 'READY'; Write-Evidence }
    } else {
        Log "[WARN] Health check eksternal dari mesin lokal gagal - tidak menggagalkan deploy (sudah diverifikasi dari VPS)."
        if ($script:evidence) { $script:evidence.externalHealth = 'ADVISORY_FAILED'; Write-Evidence }
    }

    # Bersihkan release.zip lokal
    if (Test-Path "release.zip") { Remove-Item "release.zip" -Force }

    Release-Lock
    Finish-Deploy
} catch {
    Release-Lock
    Fail "Exception: $($_.Exception.Message)"
}
