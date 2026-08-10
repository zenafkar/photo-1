#!/usr/bin/env bash
# Backup harian PostgreSQL (Neon) — read-only terhadap data produksi.
set -euo pipefail
cd /

TARGET_DIR="${TARGET_DIR:-/var/www/zen-dev}"
DB_BACKUP_DIR="${DB_BACKUP_DIR:-/var/lib/zen-deploy/database-backups}"
STATUS_DIR="${STATUS_DIR:-/var/lib/zen-deploy/status}"
LOG_DIR="${LOG_DIR:-/var/lib/zen-deploy/logs}"
KEEP_DAYS="${KEEP_DAYS:-14}"
MIN_SIZE="${MIN_SIZE:-10240}"     # 10 KB — dump sekecil ini dicurigai korup/gagal
STAMP="$(date +%Y%m%d-%H%M%S)"
DUMP_FILE="$DB_BACKUP_DIR/db-$STAMP.dump"
LOG_FILE="$LOG_DIR/db-backup.log"
mkdir -p "$DB_BACKUP_DIR" "$STATUS_DIR" "$LOG_DIR"

log() { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $*" | tee -a "$LOG_FILE"; }

# Muat DIRECT_DATABASE_URL (fallback DATABASE_URL) dari server/.env tanpa source
if [ -f "$TARGET_DIR/server/.env" ]; then
    DIRECT_DATABASE_URL="$(grep -E '^DIRECT_DATABASE_URL=' "$TARGET_DIR/server/.env" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")"
    DATABASE_URL="$(grep -E '^DATABASE_URL=' "$TARGET_DIR/server/.env" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")"
fi
DB_URL="${DIRECT_DATABASE_URL:-${DATABASE_URL:-}}"
if [ -z "$DB_URL" ]; then
    log "FAILED: DIRECT_DATABASE_URL/DATABASE_URL tidak ditemukan"; exit 11
fi

# Dump ke staging lalu publish atomik
STAGING="$DB_BACKUP_DIR/.db-$STAMP.dump.staging"
if ! pg_dump -Fc "$DB_URL" -f "$STAGING" 2>>"$LOG_FILE"; then
    rm -f "$STAGING"; log "FAILED: pg_dump error"; exit 12
fi

SIZE=$(stat -c%s "$STAGING" 2>/dev/null || echo 0)
if [ "$SIZE" -lt "$MIN_SIZE" ]; then
    rm -f "$STAGING"; log "FAILED: dump terlalu kecil ($SIZE bytes)"; exit 13
fi

if ! pg_restore -l "$STAGING" >/dev/null 2>>"$LOG_FILE"; then
    rm -f "$STAGING"; log "FAILED: TOC rusak"; exit 14
fi

mv "$STAGING" "$DUMP_FILE"
log "OK: $DUMP_FILE ($SIZE bytes, TOC valid)"

# Retensi: hanya file db-*.dump di level root, bukan legacy/
find "$DB_BACKUP_DIR" -maxdepth 1 -type f -name 'db-*.dump' -mtime +"$KEEP_DAYS" -delete
log "Retensi: dump > ${KEEP_DAYS} hari dibersihkan"

# Off-server (opsional, kredensial dari rclone.conf, bukan script)
if [ -n "${RCLONE_REMOTE:-}" ]; then
    if rclone copy "$DUMP_FILE" "$RCLONE_REMOTE" 2>>"$LOG_FILE"; then
        log "OK: copy off-server -> $RCLONE_REMOTE"
    else
        log "WARN: rclone copy gagal (dump tetap aman lokal)"
    fi
fi

echo "{\"ok\":true,\"dump\":\"$DUMP_FILE\",\"size\":$SIZE,\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > "$STATUS_DIR/db-backup.json"
exit 0
