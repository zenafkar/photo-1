[CmdletBinding()]
param (
    [Parameter(Mandatory = $true)][ValidateSet('development')][string]$Environment,
    [Parameter(Mandatory = $true)][string]$VpsIp,
    [Parameter(Mandatory = $true)][string]$VpsUser,
    [Parameter(Mandatory = $true)][string]$TargetDir,
    [Parameter(Mandatory = $true)][ValidateScript({ Test-Path -LiteralPath $_ -PathType Leaf })][string]$KnownHostsFile,
    [Parameter(Mandatory = $true)][ValidatePattern('^[A-Za-z0-9._-]+$')][string]$Operator,
    [Parameter(Mandatory = $true)][ValidateRange(1,65535)][int]$DevPort,
    [ValidatePattern('^(CHG|INC|RFC)-[A-Za-z0-9._-]+$')][string]$ChangeTicket = '',
    [string]$EvidenceDirectory = (Join-Path (Get-Location) 'deployment-evidence')
)

# Development-only deployment contract. Do not add production flags here and
# do not use this file as a compatibility wrapper around the production path.
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$script:Evidence = [ordered]@{
    contract = 'scripts/deploy-dev.ps1'
    environment = $Environment
    operator = $Operator
    status = 'STARTED'
    startedAt = (Get-Date).ToUniversalTime().ToString('o')
    database = [ordered]@{ policy = 'NO_DB'; migration = 'DENIED'; seed = 'DENIED' }
}
$script:EvidenceFile = $null
$script:RemoteLock = $null
$script:LockToken = $null
$script:RemoteLockAcquired = $false

function Write-Evidence {
    if ($script:EvidenceFile) {
        $script:Evidence | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $script:EvidenceFile -Encoding UTF8
    }
}
function Phase([string]$Name) {
    Write-Output "[PHASE] $Name"
    $script:Evidence.lastPhase = $Name
    Write-Evidence
}
function Stop-Deploy([string]$Message, [int]$Code = 1) {
    Write-Output "[FAILED] $Message"
    Release-RemoteLock
    $script:Evidence.status = 'FAILED'
    $script:Evidence.failure = $Message
    $script:Evidence.exitCode = $Code
    Write-Evidence
    exit $Code
}
function Assert-Command([string]$Name) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) { Stop-Deploy "$Name tidak tersedia secara lokal." 2 }
}
function Invoke-Local([string]$File, [string[]]$Arguments) {
    & $File @Arguments
    if ($LASTEXITCODE -ne 0) { Stop-Deploy "Command lokal gagal: $File $($Arguments -join ' ') (exit $LASTEXITCODE)." 3 }
}
function Get-GitDirtyPaths {
    @(git status --porcelain=v1 --untracked-files=all | ForEach-Object {
        if ($_.Length -ge 4) { $_.Substring(3).Trim('"') }
    })
}
function Release-RemoteLock {
    if (-not $script:RemoteLockAcquired) { return }
    $release = "if [ -f '$script:RemoteLock/token' ] && [ \`$(cat '$script:RemoteLock/token') = '$script:LockToken' ]; then rm -rf '$script:RemoteLock'; fi"
    & ssh $script:SshOptions $script:SshTarget $release 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) { $script:RemoteLockAcquired = $false }
}
function Assert-DevTarget {
    if ($Environment -ne 'development') { Stop-Deploy 'Environment bukan development; target ditolak.' 2 }
    $allowedDevelopmentTargets = @('/var/www/zen-dev')
    if ($allowedDevelopmentTargets -notcontains $TargetDir) {
        Stop-Deploy "TargetDir tidak ada dalam development allowlist: $TargetDir" 2
    }
    # The dedicated development identity is explicitly allowed; do not use a
    # broad `deploy$` suffix check because it rejects `zenstudio-deploy` while
    # still relying on the exact target/environment gates below.
    if ($VpsUser -notin @('zenstudio-deploy') -and $VpsUser -match '(?i)prod|root') { Stop-Deploy 'VpsUser tidak memenuhi kebijakan operator development.' 2 }
    if ($VpsIp -match '^(127\.|0\.0\.0\.0|localhost$)') { Stop-Deploy 'Target VPS tidak valid untuk deployment.' 2 }
    if ([string]::IsNullOrWhiteSpace($Operator)) { Stop-Deploy 'Operator wajib dicatat.' 2 }
}

Assert-DevTarget
Assert-Command git; Assert-Command npm; Assert-Command ssh; Assert-Command scp
$knownHostsHash = (Get-FileHash -LiteralPath $KnownHostsFile -Algorithm SHA256).Hash.ToLowerInvariant()
$script:SshOptions = @('-o', 'BatchMode=yes', '-o', 'ConnectTimeout=15', '-o', 'StrictHostKeyChecking=yes', '-o', "UserKnownHostsFile=$KnownHostsFile")
$script:SshTarget = "$VpsUser@$VpsIp"
$releaseId = "dev-{0}-{1}-{2}" -f ((git rev-parse HEAD).Trim().Substring(0, 12)), (Get-Date -Format 'yyyyMMddHHmmss'), ([guid]::NewGuid().ToString('N').Substring(0, 8))
New-Item -ItemType Directory -Path $EvidenceDirectory -Force | Out-Null
$script:EvidenceFile = Join-Path (Resolve-Path $EvidenceDirectory) "$releaseId.json"
$script:Evidence.releaseId = $releaseId
$script:Evidence.gitSha = (git rev-parse HEAD).Trim()
$script:Evidence.target = "$script:SshTarget`:$TargetDir"
$script:Evidence.devPort = $DevPort
$script:Evidence.knownHostsSha256 = $knownHostsHash
Write-Evidence

try {
    Phase 'preflight'
    $dirty = @(Get-GitDirtyPaths)
    $script:Evidence.dirtyPaths = @($dirty)
    $script:Evidence.dirtyCount = $dirty.Count
    $protected = '(?i)(schema\.prisma|datasource|connection|(^|/)(server/prisma/|migrations?/|seed|database|db/|pool|driver|timeout|read.?write|routing)(/|\.|$)|(^|/)(\.env($|\.)|.*(database|connection|pool|driver|timeout|read.?write|routing).*(config|env|json|ts|js)$)|(^|/)(scripts/deploy|deploy-bot/|\.opencode/|\.git/)|(^|/)(prisma|postgres|pg|mysql|typeorm|sequelize|knex|drizzle)(/|\.|$))'
    $protectedDirty = @($dirty | Where-Object { $_ -match $protected })
    if ($protectedDirty.Count -gt 0) {
        Stop-Deploy "Perubahan protected/database ditemukan; -NoDb menolak deploy: $($protectedDirty -join ', ')" 12
    }
    if ($dirty.Count -gt 0 -and $ChangeTicket -notmatch '^(CHG|INC|RFC)-') {
        Stop-Deploy 'Working tree application dirty; ChangeTicket CHG/INC/RFC wajib.' 12
    }
    if ($dirty.Count -gt 0) { $script:Evidence.changeTicket = $ChangeTicket }
    foreach ($required in @('dist/index.html', 'server/dist/index.js', 'package.json', 'package-lock.json', 'server/package.json', 'server/package-lock.json', 'server/prisma/schema.prisma', 'server/ecosystem.dev.config.js')) {
        if (-not (Test-Path -LiteralPath $required -PathType Leaf)) { Stop-Deploy "Artifact/input wajib tidak tersedia: $required" 2 }
    }

    Phase 'local-test-build'
    Invoke-Local 'npm' @('test', '--', '--run')
    Invoke-Local 'npm' @('run', 'build')
    Invoke-Local 'npm' @('--prefix', 'server', 'test', '--', '--run')
    Invoke-Local 'npm' @('--prefix', 'server', 'run', 'build')

    Phase 'package-allowlist'
    $stage = Join-Path ([IO.Path]::GetTempPath()) "zen-dev-$releaseId"
    New-Item -ItemType Directory -Path "$stage/dist", "$stage/server/dist", "$stage/server/prisma" -Force | Out-Null
    Copy-Item 'dist/*' "$stage/dist" -Recurse -Force
    Copy-Item 'server/dist/*' "$stage/server/dist" -Recurse -Force
    Copy-Item 'package.json','package-lock.json','server/package.json','server/package-lock.json' $stage -Force
    Copy-Item 'server/ecosystem.dev.config.js' "$stage/server/ecosystem.dev.config.js" -Force
    Copy-Item 'server/prisma/schema.prisma' "$stage/server/prisma/schema.prisma" -Force
    $forbidden = @('.env', '.env.*', '.git', '.opencode', 'uploads', 'cache', 'node_modules', 'migrations', 'seed*', '*database*')
    $entries = @(Get-ChildItem $stage -Recurse -Force | ForEach-Object { $_.FullName.Substring($stage.Length + 1).Replace('\','/') })
    foreach ($entry in $entries) { if ($forbidden | Where-Object { $entry -like "$_*" -or $entry -like "*/$_*" }) { Stop-Deploy "Artifact melanggar exclusion: $entry" 12 } }
    $artifactAllowlist = 'dist/**,server/dist/**,package.json,package-lock.json,server/package.json,server/package-lock.json,server/prisma/schema.prisma,server/ecosystem.dev.config.js,deploy.json,manifest.sha256'
    $manifest = [ordered]@{ releaseId = $releaseId; gitSha = $script:Evidence.gitSha; dirtyPaths = @($dirty); noDb = $true; schemaPolicy = 'byte-identical-to-target-baseline'; artifactAllowlist = $artifactAllowlist; manifest = 'manifest.sha256' }
    $manifest | ConvertTo-Json -Compress | Set-Content (Join-Path $stage 'deploy.json') -Encoding UTF8
    $entries = @(Get-ChildItem $stage -Recurse -Force -File | ForEach-Object { $_.FullName.Substring($stage.Length + 1).Replace('\','/') })
    $manifestLines = @($entries | Where-Object { $_ -ne 'manifest.sha256' } | Sort-Object | ForEach-Object { $f = Join-Path $stage $_; "$( (Get-FileHash $f -Algorithm SHA256).Hash.ToLowerInvariant())  $($_)" })
    $manifestLines | Set-Content (Join-Path $stage 'manifest.sha256') -Encoding ASCII
    $archive = Join-Path (Get-Location) "$releaseId.zip"
    Compress-Archive -Path "$stage/*" -DestinationPath $archive -Force
    $archiveHash = (Get-FileHash $archive -Algorithm SHA256).Hash.ToLowerInvariant()
    "$archiveHash  $releaseId.zip" | Set-Content "$archive.sha256" -Encoding ASCII
    $script:Evidence.artifact = [ordered]@{ name = "$releaseId.zip"; archiveSha256 = $archiveHash; bytes = (Get-Item $archive).Length; allowlist = $artifactAllowlist; manifest = 'manifest.sha256' }
    Remove-Item $stage -Recurse -Force
    Write-Evidence

    Phase 'remote-lock-upload-promote'
    $remoteRoot = "$TargetDir/.deploy"
    $remoteArtifact = "$remoteRoot/releases/$releaseId.zip"
    $script:RemoteLock = "$remoteRoot/deploy.lock"
    $script:LockToken = [guid]::NewGuid().ToString('N')
    $lock = "set -eu; umask 077; mkdir -p '$remoteRoot/releases' '$remoteRoot/staging'; mkdir '$script:RemoteLock'; printf '%s\n' '$script:LockToken' > '$script:RemoteLock/token'"
    & ssh $script:SshOptions $script:SshTarget $lock
    if ($LASTEXITCODE -ne 0) { Stop-Deploy 'Remote lock gagal; upload tidak dilakukan.' 75 }
    $script:RemoteLockAcquired = $true
    & scp $script:SshOptions $archive "$script:SshTarget`:$remoteArtifact"; if ($LASTEXITCODE -ne 0) { Stop-Deploy 'Upload artifact gagal.' 3 }
    & scp $script:SshOptions "$archive.sha256" "$script:SshTarget`:$remoteArtifact.sha256"; if ($LASTEXITCODE -ne 0) { Stop-Deploy 'Upload checksum gagal.' 3 }
    $remoteScript = @'
set -Eeuo pipefail
export PM2_HOME=${PM2_HOME:-/var/lib/zen-deploy/pm2}
ROOT='__TARGET__'; RELEASE='__RELEASE__'; LOCK="$ROOT/.deploy/deploy.lock"; ARCHIVE="$ROOT/.deploy/releases/$RELEASE.zip"
export ZEN_DEV_APP_ROOT="$ROOT/server"; export ZEN_DEV_ALLOWED_ROOT="$ROOT/server"; export ZEN_DEV_PORT='__PORT__'
PROMOTION_STARTED=0
ROLLBACK_FAILED=0
cleanup() { if [ -f "$LOCK/token" ] && [ "$(cat "$LOCK/token")" = '__TOKEN__' ]; then rm -rf "$LOCK"; fi; }
wait_health() { local live='' ready=''; for i in 1 2 3 4 5 6; do live=$(curl -fsS --max-time 10 "http://localhost:${ZEN_DEV_PORT}/api/v1/health/live" 2>/dev/null || true); ready=$(curl -fsS --max-time 10 "http://localhost:${ZEN_DEV_PORT}/api/v1/health/ready" 2>/dev/null || true); if echo "$live" | grep -q '"status"[[:space:]]*:[[:space:]]*"alive"' && echo "$ready" | grep -q '"status"[[:space:]]*:[[:space:]]*"ready"'; then return 0; fi; sleep 5; done; return 1; }
rollback_app() {
  if [ "$PROMOTION_STARTED" != 1 ]; then return 0; fi
  PREV="$ROOT/.deploy/previous-$RELEASE"
  test -d "$PREV" && test -d "$PREV/dist" && test -d "$PREV/server-dist" && test -d "$PREV/node_modules" && test -f "$PREV/package.json" && test -f "$PREV/deploy.json" && test -f "$PREV/server-ecosystem.dev.config.js"
  cd "$ROOT"
  rm -rf dist server/dist server/node_modules
  rm -f package.json deploy.json server/ecosystem.dev.config.js
  mv "$PREV/dist" dist
  mv "$PREV/server-dist" server/dist
  mv "$PREV/node_modules" server/node_modules
  mv "$PREV/package.json" package.json
  mv "$PREV/deploy.json" deploy.json
  mv "$PREV/server-ecosystem.dev.config.js" server/ecosystem.dev.config.js
  pm2 startOrRestart server/ecosystem.dev.config.js --update-env
  pm2 save
  wait_health
}
on_error() { rc=$?; trap - ERR; if ! rollback_app; then echo '[FAILED] ROLLBACK_FAILED'; ROLLBACK_FAILED=1; fi; cleanup; if [ "$ROLLBACK_FAILED" = 1 ]; then exit 70; fi; exit "$rc"; }
trap on_error ERR
test "$(cat "$LOCK/token")" = '__TOKEN__'; (cd "$ROOT/.deploy/releases" && sha256sum -c "$RELEASE.zip.sha256")
STAGE="$ROOT/.deploy/staging/$RELEASE"; rm -rf "$STAGE"; mkdir -p "$STAGE"; unzip -q "$ARCHIVE" -d "$STAGE"
(cd "$STAGE" && sha256sum -c manifest.sha256); grep -q '"releaseId"[[:space:]]*:[[:space:]]*"__RELEASE__"' "$STAGE/deploy.json"
test -s "$STAGE/dist/index.html"; test -s "$STAGE/server/dist/index.js"
test -f "$ROOT/server/prisma/schema.prisma"; test -f "$STAGE/server/prisma/schema.prisma"
test "$(sha256sum "$ROOT/server/prisma/schema.prisma" | awk '{print $1}')" = "$(sha256sum "$STAGE/server/prisma/schema.prisma" | awk '{print $1}')"
cd "$STAGE/server"; npm ci --omit=dev --no-audit --no-fund; npx prisma generate
cd "$ROOT"; PREV="$ROOT/.deploy/previous-$RELEASE"; rm -rf "$PREV"; mkdir -p "$PREV"
if [ -d dist ]; then mv dist "$PREV/dist"; fi
if [ -d server/dist ]; then mv server/dist "$PREV/server-dist"; fi
if [ -d server/node_modules ]; then mv server/node_modules "$PREV/node_modules"; fi
cp package.json "$PREV/package.json"; cp deploy.json "$PREV/deploy.json"; cp server/ecosystem.dev.config.js "$PREV/server-ecosystem.dev.config.js"
PROMOTION_STARTED=1
mv "$STAGE/dist" dist; mv "$STAGE/server/dist" server/dist; mv "$STAGE/server/node_modules" server/node_modules
cp "$STAGE/package.json" package.json; cp "$STAGE/deploy.json" deploy.json; cp "$STAGE/server/ecosystem.dev.config.js" server/ecosystem.dev.config.js
pm2 startOrRestart server/ecosystem.dev.config.js --update-env; pm2 save
wait_health
rm -rf "$STAGE" "$ARCHIVE" "$ARCHIVE.sha256"; cleanup
'@
    $remoteScript = $remoteScript.Replace('__TARGET__', $TargetDir).Replace('__RELEASE__', $releaseId).Replace('__TOKEN__', $script:LockToken).Replace('__PORT__', [string]$DevPort).Replace("`r`n", "`n")
    $tmp = [IO.Path]::GetTempFileName(); [IO.File]::WriteAllText($tmp, $remoteScript, (New-Object Text.UTF8Encoding($false)))
    try { Get-Content -LiteralPath $tmp -Raw | & ssh $script:SshOptions $script:SshTarget 'bash -s'; if ($LASTEXITCODE -ne 0) { Stop-Deploy 'Remote promotion/health gagal.' 4 } } finally { Remove-Item $tmp -Force -ErrorAction SilentlyContinue }
    $script:RemoteLockAcquired = $false
    $script:Evidence.health = [ordered]@{ liveness = 'alive'; readiness = 'ready'; port = $DevPort; rollback = 'application-only' }
    $script:Evidence.status = 'SUCCEEDED'; $script:Evidence.finishedAt = (Get-Date).ToUniversalTime().ToString('o'); Write-Evidence
    Write-Output '[SUCCESS] Development deploy contract completed.'
} catch {
    Release-RemoteLock
    Stop-Deploy $_.Exception.Message 1
}
