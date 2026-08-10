#!/usr/bin/env bash
set -euo pipefail

TARGET_DIR="${TARGET_DIR:-/var/www/zen-dev}"
GIT_BRANCH="${GIT_BRANCH:-master}"
LOCK_PATH="${DEPLOY_LOCK_PATH:-/var/run/zen-deploy/deploy.lock}"
LOCK_DIR="$(dirname "$LOCK_PATH")"
LOG_DIR="${DEPLOY_LOG_DIR:-/var/log/zen-deploy}"
BACKUP_DIR="${DEPLOY_BACKUP_DIR:-/var/backups/zen-dev}"
DATABASE_BACKUP_DIR="${DEPLOY_DATABASE_BACKUP_DIR:-${BACKUP_DIR}-database}"
HEALTH_URL="${HEALTH_URL:-http://localhost:5000/api/v1/health/ready}"
EXTERNAL_HEALTH_URL="${EXTERNAL_HEALTH_URL:-https://zenstudio.my.id/api/v1/health/ready}"
HEALTH_RETRIES="${DEPLOY_HEALTH_RETRIES:-6}"
HEALTH_INTERVAL="${DEPLOY_HEALTH_INTERVAL:-5}"
PM2_BIN="${PM2_BIN:-$(command -v pm2 2>/dev/null || true)}"

# These files are part of the deploy contract.  They must be present in the
# fetched commit, not merely left behind as untracked files on the VPS.
REQUIRED_TRACKED_ARTIFACTS=(
    "scripts/deploy.sh"
    "deploy-bot/zen-deploy-bot.service"
    "deploy-bot/.env.example"
    "server/ecosystem.config.js"
    "package.json"
    "package-lock.json"
    "server/package.json"
    "server/package-lock.json"
    "server/prisma/schema.prisma"
)

SKIP_BUILD=false
SKIP_TEST=false
DB_PUSH=false
DO_ROLLBACK=false
LOG_FILE=""
FORCE=false
NO_DB_SEEN=false
BACKUP_READY=false
ROLLBACK_IN_PROGRESS=false
LOCK_OWNER="none"

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-build) SKIP_BUILD=true; shift ;;
        --skip-test) SKIP_TEST=true; shift ;;
        --db) DB_PUSH=true; shift ;;
        --no-db) DB_PUSH=false; NO_DB_SEEN=true; shift ;;
        --rollback) DO_ROLLBACK=true; shift ;;
        --force) FORCE=true; shift ;;
        --log-file) LOG_FILE="$2"; shift 2 ;;
        *) echo "[WARN] Unknown flag: $1"; shift ;;
    esac
done

# Defense-in-depth: --no-db selalu menang terlepas dari urutan argumen
if [ "$NO_DB_SEEN" = true ]; then
    DB_PUSH=false
fi

log() {
    echo "$1"
    if [ -n "$LOG_FILE" ]; then
        echo "$1" >> "$LOG_FILE"
    fi
}

phase() {
    log "[PHASE] $1"
}

fail() {
    log "[FAILED] $1"
    return "${2:-1}"
}

success() {
    log "[SUCCESS] $1"
}

validate_configuration() {
    case "$HEALTH_RETRIES" in ''|*[!0-9]*) fail "DEPLOY_HEALTH_RETRIES harus bilangan bulat positif" 2 ;; esac
    case "$HEALTH_INTERVAL" in ''|*[!0-9]*) fail "DEPLOY_HEALTH_INTERVAL harus bilangan bulat non-negatif" 2 ;; esac
    if [ "$HEALTH_RETRIES" -lt 1 ]; then fail "DEPLOY_HEALTH_RETRIES harus >= 1" 2; fi
    if [ ! -d "$TARGET_DIR" ]; then fail "TARGET_DIR tidak ditemukan: $TARGET_DIR" 1; fi
    if [ "${TARGET_DIR#/}" = "$TARGET_DIR" ]; then fail "TARGET_DIR harus absolute" 2; fi
    if [ -z "$PM2_BIN" ] || [ ! -x "$PM2_BIN" ]; then
        fail "PM2 tidak ditemukan sebagai executable. Set PM2_BIN ke path absolute." 1
    fi
}

lock_pid() {
    local pid_file="$LOCK_PATH"
    if [ -d "$LOCK_PATH" ]; then pid_file="$LOCK_PATH/pid"; fi
    if [ -f "$pid_file" ]; then
        tr -d '[:space:]' < "$pid_file" 2>/dev/null || true
    fi
}

quarantine_stale_lock() {
    # Rename is atomic.  This prevents a second deploy from deleting a newly
    # created lock during stale-lock recovery.
    local quarantine="${LOCK_PATH}.stale.$$"
    if mv "$LOCK_PATH" "$quarantine" 2>/dev/null; then
        rm -rf -- "$quarantine"
        return 0
    fi
    return 1
}

acquire_lock() {
    mkdir -p "$LOCK_DIR"

    if [ -e "$LOCK_PATH" ]; then
        local pid
        pid="$(lock_pid)"

        # DeployManager acquires the shared directory before spawning this
        # shell.  Adopt that lock only when its owner is exactly our parent;
        # this keeps manual and bot deploys mutually exclusive.
        if [ -n "$pid" ] && [ "$pid" = "$PPID" ] && kill -0 "$pid" 2>/dev/null; then
            LOCK_OWNER="deploy-manager"
            log "[LOCK] Menggunakan lock milik DeployManager (PID $pid)"
            return 0
        fi

        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            log "[LOCK] Deploy lain sedang berjalan (PID $pid). --force tidak dapat mengambil alih proses aktif."
            return 75
        fi

        if ! quarantine_stale_lock; then
            log "[LOCK] Lock stale tidak dapat diambil alih secara atomik"
            return 75
        fi
        log "[LOCK] Stale lock diambil alih secara atomik"
    fi

    if mkdir "$LOCK_PATH" 2>/dev/null; then
        echo $$ > "$LOCK_PATH/pid"
        LOCK_OWNER="shell"
        trap 'if [ "$LOCK_OWNER" = "shell" ] && [ -f "$LOCK_PATH/pid" ] && [ "$(cat "$LOCK_PATH/pid" 2>/dev/null)" = "$$" ]; then rmdir "$LOCK_PATH" 2>/dev/null || true; fi' EXIT
    else
        log "[FAILED] Failed to acquire lock - another deploy started"
        return 75
    fi
}

do_rollback() {
    phase "rollback"

    validate_backup || return $?
    cd "$TARGET_DIR"

    restore_backup || return $?
    "$PM2_BIN" startOrRestart "$TARGET_DIR/server/ecosystem.config.js" --update-env
    "$PM2_BIN" save

    health_check || return $?
    external_health_check || return $?
    success "Rollback complete and health gates passed"
}

preflight() {
    phase "preflight"

    # Guardrail F3 (fail-closed): --db hanya boleh berjalan bila operator
    # mengeksplisitkan DEPLOY_DB_ENABLED=true. JANGAN downgrade diam-diam ke
    # --no-db — perubahan schema produksi tanpa izin berarti diblokir.
    # Hierarki argumen sudah diselesaikan di atas (NO_DB_SEEN menang), jadi
    # gate ini hanya berlaku bila DB_PUSH tetap true.
    if [ "$DB_PUSH" = true ] && [ "${DEPLOY_DB_ENABLED:-}" != "true" ] && [ "${DEPLOY_DB_ENABLED:-}" != "1" ]; then
        fail "perubahan schema diblokir: set DEPLOY_DB_ENABLED=true untuk mengizinkan prisma migrate deploy" 26
        return 26
    fi

    local node_ver
    node_ver=$(node --version 2>/dev/null || echo "NOT_FOUND")
    log "Node.js: $node_ver"

    if [ "$node_ver" = "NOT_FOUND" ]; then
        fail "Node.js not found on VPS" 1
    fi
    validate_configuration
    log "Deploy user: $(id -un) (uid=$(id -u))"

    local disk_mb
    disk_mb=$(df -Pm "$TARGET_DIR" | awk 'NR==2{print $4}')
    log "Disk available: ${disk_mb}MB"
    if [ "$disk_mb" -lt 2048 ]; then
        fail "Disk space insufficient (<2GB). Clean up: pm2 flush, remove old backups" 5
    fi

    cd "$TARGET_DIR"
    local git_sha
    git_sha=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
    log "Git SHA: $git_sha"
}

pull_code() {
    phase "pull"
    cd "$TARGET_DIR"
    git fetch origin
    if ! git rev-parse --verify "origin/$GIT_BRANCH^{commit}" >/dev/null 2>&1; then
        fail "origin/$GIT_BRANCH tidak ditemukan" 2
    fi
    git reset --hard "origin/$GIT_BRANCH"
    verify_tracked_artifacts
    log "Pulled latest code from origin/$GIT_BRANCH"
}

verify_tracked_artifacts() {
    phase "artifact-check"
    local artifact blob working_hash
    for artifact in "${REQUIRED_TRACKED_ARTIFACTS[@]}"; do
        if ! git ls-files --error-unmatch -- "$artifact" >/dev/null 2>&1; then
            fail "Artefak belum tracked di Git: $artifact. Commit dan push artefak deployment terlebih dahulu." 2
        fi
        if ! git cat-file -e "origin/$GIT_BRANCH:$artifact" 2>/dev/null; then
            fail "Artefak tidak ada pada origin/$GIT_BRANCH: $artifact" 2
        fi
        blob="$(git rev-parse "origin/$GIT_BRANCH:$artifact")"
        working_hash="$(git hash-object -- "$artifact")"
        if [ "$blob" != "$working_hash" ]; then
            fail "Artefak tidak reproducible terhadap origin/$GIT_BRANCH: $artifact" 2
        fi
    done

    # A tracked deploy script must retain its executable bit after checkout.
    if ! git ls-files --stage -- scripts/deploy.sh | awk '$1 == "100755" { found=1 } END { exit !found }'; then
        fail "scripts/deploy.sh harus tracked dengan mode 100755" 2
    fi
    log "Tracked artifact checks: OK (${#REQUIRED_TRACKED_ARTIFACTS[@]} files, exact origin blobs)"
}

install_deps() {
    phase "install"
    cd "$TARGET_DIR"

    log "Installing root dependencies..."
    npm ci --no-audit --no-fund

    cd server
    log "Installing server dependencies (full, incl. dev — perlu vitest & tsc)..."
    npm ci --no-audit --no-fund

    log "Running prisma generate..."
    npx prisma generate

    log "Dependencies installed"
}

backup_current() {
    phase "backup"
    cd "$TARGET_DIR"

    # Never destroy the last known-good backup before the replacement has been
    # copied and validated.  A missing current release is allowed for first
    # provisioning, but that deploy has no automatic rollback safety net.
    if [ ! -s "dist/index.html" ] || [ ! -s "server/dist/index.js" ] ||
       [ ! -d "server/node_modules" ]; then
        log "[WARN] Release lama/dependency tidak lengkap; deploy ini tidak memiliki rollback otomatis"
        BACKUP_READY=false
        return 0
    fi

    local staging="${BACKUP_DIR}.staging.$$"
    local previous="${BACKUP_DIR}.previous.$$"
    rm -rf -- "$staging"
    mkdir -p "$staging"

    if ! cp -a dist "$staging/dist" || ! cp -a server/dist "$staging/server-dist"; then
        rm -rf -- "$staging"
        fail "Gagal membuat backup artifact secara utuh" 5
    fi
    cp -a server/node_modules "$staging/node_modules" || {
        rm -rf -- "$staging"
        fail "Gagal membuat backup server/node_modules" 5
    }
    {
        printf 'frontend=%s\n' "$(git hash-object -- dist/index.html)"
        printf 'backend=%s\n' "$(git hash-object -- server/dist/index.js)"
        printf 'created_at=%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    } > "$staging/manifest"

    if [ -e "$BACKUP_DIR" ]; then
        mv "$BACKUP_DIR" "$previous" || {
            rm -rf -- "$staging"
            fail "Tidak dapat mengamankan backup lama" 5
        }
    fi
    if ! mv "$staging" "$BACKUP_DIR"; then
        [ -e "$previous" ] && mv "$previous" "$BACKUP_DIR" || true
        rm -rf -- "$staging"
        fail "Tidak dapat mempublikasikan backup baru" 5
    fi
    rm -rf -- "$previous"
    BACKUP_READY=true
    log "Backup artifact atomik: frontend + backend + dependencies"
}

validate_backup() {
    if [ ! -s "$BACKUP_DIR/manifest" ] || [ ! -s "$BACKUP_DIR/dist/index.html" ] ||
       [ ! -s "$BACKUP_DIR/server-dist/index.js" ] || [ ! -d "$BACKUP_DIR/node_modules" ]; then
        log "[FAILED] Backup release lengkap tidak ditemukan di $BACKUP_DIR"
        return 1
    fi
    return 0
}

ensure_frontend_permissions() {
    if [ ! -d "$TARGET_DIR/dist" ]; then
        log "[FAILED] Frontend artifact tidak ditemukan: $TARGET_DIR/dist"
        return 1
    fi
    # systemd deliberately uses a restrictive UMask.  Normalize the generated
    # static release so Nginx (www-data) can traverse/read it without granting
    # write access to other users.
    chmod 711 "$TARGET_DIR" "$TARGET_DIR/dist"
    find "$TARGET_DIR/dist" -type d -exec chmod 755 {} +
    find "$TARGET_DIR/dist" -type f -exec chmod 644 {} +
    log "Frontend permissions normalized for Nginx (directories 755, files 644)"
}

restore_backup() {
    validate_backup || return $?
    local staging="$TARGET_DIR/.rollback-staging.$$"
    local old="$TARGET_DIR/.rollback-old.$$"
    rm -rf -- "$staging" "$old"
    mkdir -p "$staging/server" "$old/server"

    # Stage every component first.  The old release is moved aside rather than
    # deleted, so a failed copy does not turn a rollback into an outage.
    cp -a "$BACKUP_DIR/dist" "$staging/dist" || return 1
    cp -a "$BACKUP_DIR/server-dist" "$staging/server/dist" || return 1
    if [ -d "$BACKUP_DIR/node_modules" ]; then
        cp -a "$BACKUP_DIR/node_modules" "$staging/server/node_modules" || return 1
    fi

    mkdir -p "$old/server"
    [ -e dist ] && mv dist "$old/dist"
    [ -e server/dist ] && mv server/dist "$old/server/dist"
    if [ -d "$BACKUP_DIR/node_modules" ] && [ -e server/node_modules ]; then
        mv server/node_modules "$old/server/node_modules"
    fi

    if ! mv "$staging/dist" dist || ! mv "$staging/server/dist" server/dist; then
        log "[FAILED] Rollback staging tidak dapat dipublikasikan; artifact lama ada di $old"
        return 1
    fi
    if [ -d "$staging/server/node_modules" ]; then
        mv "$staging/server/node_modules" server/node_modules || return 1
    fi
    rm -rf -- "$staging" "$old"
    ensure_frontend_permissions
    log "Restored frontend/backend artifact dan dependency dari backup"
}

build() {
    if [ "$SKIP_BUILD" = true ]; then
        log "Build: SKIP (--skip-build)"
        if [ ! -f "dist/index.html" ]; then fail "--skip-build but dist/index.html missing" 1; fi
        if [ ! -f "server/dist/index.js" ]; then fail "--skip-build but server/dist/index.js missing" 1; fi
        ensure_frontend_permissions
        return
    fi

    phase "frontend-build"
    cd "$TARGET_DIR"
    npm run build
    ensure_frontend_permissions
    log "Frontend build: OK"

    phase "backend-build"
    cd server
    npm run build
    log "Backend build: OK"
}

run_tests() {
    if [ "$SKIP_TEST" = true ]; then
        log "Test: SKIP (--skip-test)"
        return
    fi

    phase "test"
    cd "$TARGET_DIR"
    npm test
    cd server
    npm test
    log "Tests: OK"
}

database() {
    if [ "$DB_PUSH" = false ]; then
        log "Database migration: SKIP"
        return
    fi

    phase "database"
    mkdir -p "$DATABASE_BACKUP_DIR"

    # Load DIRECT_DATABASE_URL dari server/.env untuk pg_dump. Prisma auto-load
    # server/.env (DATABASE_URL + DIRECT_DATABASE_URL) untuk migrate deploy.
    DIRECT_DATABASE_URL=""
    if [ -f "$TARGET_DIR/server/.env" ]; then
        DIRECT_DATABASE_URL="$(grep -E '^DIRECT_DATABASE_URL=' "$TARGET_DIR/server/.env" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")"
    fi

    if command -v pg_dump >/dev/null 2>&1 && [ -n "${DIRECT_DATABASE_URL:-}" ]; then
        local dump_file="$DATABASE_BACKUP_DIR/db-$(date +%Y%m%d-%H%M%S).dump"
        log "Creating database backup via DIRECT_DATABASE_URL: $dump_file"
        if pg_dump -Fc "$DIRECT_DATABASE_URL" -f "$dump_file" 2>/dev/null; then
            log "Database backup OK: $dump_file"
        else
            fail "Database backup gagal; --db dihentikan untuk menjaga rollback safety" 11
        fi
    else
        fail "--db memerlukan pg_dump dan DIRECT_DATABASE_URL di server/.env; tidak ada perubahan schema tanpa backup" 11
    fi

    cd "$TARGET_DIR/server"
    if ! npx prisma migrate deploy --skip-generate; then
        fail "prisma migrate deploy GAGAL. Migration bersifat transaksional; perbaiki file migrasi lalu ulangi." 10
    fi
    log "Database migration: OK"
}

restart_pm2() {
    phase "restart"
    cd "$TARGET_DIR"
    if [ ! -f "$TARGET_DIR/server/ecosystem.config.js" ]; then
        log "[FAILED] server/ecosystem.config.js tidak ditemukan"
        return 1
    fi
    "$PM2_BIN" startOrRestart "$TARGET_DIR/server/ecosystem.config.js" --update-env
    "$PM2_BIN" save
    log "PM2 restarted"
}

health_gate() {
    local label="$1"
    local url="$2"
    local timeout="$3"
    local failure_code="$4"
    local i code

    phase "$label"
    for i in $(seq 1 "$HEALTH_RETRIES"); do
        if code="$(curl --silent --show-error --location --output /dev/null --write-out '%{http_code}' --max-time "$timeout" "$url" 2>/dev/null)"; then
            :
        else
            code="000"
        fi
        if [ "$code" = "200" ]; then
            success "$label passed (attempt $i)"
            return 0
        fi
        log "  $label attempt $i/$HEALTH_RETRIES: HTTP $code"
        [ "$i" -lt "$HEALTH_RETRIES" ] && sleep "$HEALTH_INTERVAL"
    done
    log "[FAILED] $label failed after $HEALTH_RETRIES attempts"
    return "$failure_code"
}

health_check() {
    sleep 2
    health_gate "health-check-local" "$HEALTH_URL" 10 20
}

external_health_check() {
    health_gate "health-check-external" "$EXTERNAL_HEALTH_URL" 15 21
}

auto_rollback() {
    log "[AUTO-ROLLBACK] Health check failed, restoring previous version..."

    cd "$TARGET_DIR"
    restore_backup || {
        log "[AUTO-ROLLBACK] Backup tidak valid atau restore gagal"
        return 1
    }
    "$PM2_BIN" startOrRestart "$TARGET_DIR/server/ecosystem.config.js" --update-env
    "$PM2_BIN" save
    health_check || return $?
    external_health_check || return $?
    success "Auto-rollback successful and both health gates passed"
}

handle_error() {
    local code=$1
    trap - ERR
    if [ "$ROLLBACK_IN_PROGRESS" = true ]; then
        exit "$code"
    fi
    log "[FAILED] Deployment aborted (exit $code)"
    if [ "$BACKUP_READY" = true ]; then
        ROLLBACK_IN_PROGRESS=true
        if auto_rollback; then
            log "[AUTO-ROLLBACK] Completed after deployment failure"
        else
            log "[AUTO-ROLLBACK] Failed; manual intervention required"
        fi
    fi
    exit "$code"
}

main() {
    if [ "$DO_ROLLBACK" = true ]; then
        validate_configuration
        acquire_lock || exit $?
        do_rollback || exit $?
        exit 0
    fi

    trap 'handle_error "$?"' ERR
    acquire_lock || return $?

    log "========================================"
    log "      ZenDev Deploy (VPS Local)         "
    log "========================================"
    log "Target: $TARGET_DIR"
    log "Flags: skip_build=$SKIP_BUILD skip_test=$SKIP_TEST db_push=$DB_PUSH force=$FORCE"

    preflight
    pull_code
    backup_current
    install_deps
    run_tests
    database
    build
    restart_pm2

    if ! health_check; then
        ROLLBACK_IN_PROGRESS=true
        if auto_rollback; then
            ROLLBACK_IN_PROGRESS=false
            exit 20
        fi
        exit 21
    fi

    if ! external_health_check; then
        ROLLBACK_IN_PROGRESS=true
        if auto_rollback; then
            ROLLBACK_IN_PROGRESS=false
            exit 21
        fi
        exit 22
    fi

    success "Deploy selesai dan health check lolos."
}

main "$@"
