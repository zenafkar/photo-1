param (
    [string]$VpsIp = "160.19.166.129",
    [string]$VpsUser = "zen-deploy",
    [string]$KnownHostsFile = ""
)

# ==========================================
# Setup SSH Key (SEKALI SAJA) - menggantikan password interaktif
# 1. Membuat kunci ed25519 jika belum ada
# 2. Menyalin public key ke VPS (satu-satunya saat Anda diminta password)
# 3. Verifikasi passwordless (harus cetak OK_PASSWORDLESS tanpa minta password)
# ==========================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$sshDir = Join-Path $env:USERPROFILE ".ssh"
$keyPath = Join-Path $sshDir "id_ed25519"
$pubPath = "$keyPath.pub"
$KnownHostsFile = if ($KnownHostsFile) { $KnownHostsFile } else { Join-Path $sshDir "known_hosts" }
if (-not (Test-Path -LiteralPath $KnownHostsFile -PathType Leaf)) {
    Write-Error "Known-hosts file tidak ditemukan. Verifikasi fingerprint VPS secara out-of-band lalu provision file ini sebelum menjalankan setup."
    exit 2
}
$SshTrustOpts = @("-o", "StrictHostKeyChecking=yes", "-o", "UserKnownHostsFile=$KnownHostsFile")

# 1. Buat kunci jika belum ada
if (-not (Test-Path $keyPath)) {
    New-Item -ItemType Directory -Path $sshDir -Force | Out-Null
    Write-Host "[1/3] Membuat SSH key ed25519..." -ForegroundColor Yellow
    # CATATAN: jangan pakai `-N ""` di PowerShell 5.1 - string kosong di-drop
    # oleh PowerShell saat dipanggil ke native exe, membuat ssh-keygen error
    # "Too many arguments". Pakai literal '""' (dua tanda kutip) yang
    # diinterpretasi ssh-keygen sebagai passphrase kosong.
    ssh-keygen -t ed25519 -f $keyPath -N '""' -C "zen-dev-deploy-bot"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "GAGAL membuat SSH key." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[1/3] SSH key sudah ada - dilewati." -ForegroundColor Green
}

# 2. Salin public key ke VPS (minta password SEKALI ini saja)
Write-Host "[2/3] Menyalin public key ke $VpsUser@$VpsIp ..." -ForegroundColor Yellow
Write-Host "Ketik password VPS Anda SEKALI ini saja. Ketikan tidak akan terlihat." -ForegroundColor Cyan
type $pubPath | ssh $SshTrustOpts ${VpsUser}@${VpsIp} "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys"
if ($LASTEXITCODE -ne 0) {
    Write-Host "GAGAL menyalin key ke VPS." -ForegroundColor Red
    exit 1
}
Write-Host "Public key terkirim." -ForegroundColor Green

# 3. Verifikasi passwordless
Write-Host "[3/3] Verifikasi passwordless..." -ForegroundColor Yellow
$result = ssh $SshTrustOpts -o BatchMode=yes -o ConnectTimeout=10 ${VpsUser}@${VpsIp} "echo OK_PASSWORDLESS" 2>&1
if ($LASTEXITCODE -eq 0 -and $result.Trim() -eq "OK_PASSWORDLESS") {
    Write-Host "SUKSES! SSH key berfungsi. Tidak akan diminta password lagi." -ForegroundColor Green
} else {
    Write-Host "GAGAL verifikasi passwordless. Output: $result" -ForegroundColor Red
    exit 1
}
