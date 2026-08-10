#!/usr/bin/env bash
# Backup harian uploads/ (gambar hasil generate) + copy off-server.
set -euo pipefail
cd /
[ -f /var/lib/zen-deploy/backup.env ] && set -a && . /var/lib/zen-deploy/backup.env && set +a

TARGET_DIR="${TARGET_DIR:-/var/www/zen-dev}"
UPLOADS_DIR="${UPLOADS_DIR:-$TARGET_DIR/server/uploads}"
LOCAL_BACKUP_DIR="${LOCAL_BACKUP_DIR:-/var/lib/zen-deploy/uploads-backups}"
LOG_DIR="${LOG_DIR:-/var/lib/zen-deploy/logs}"
KEEP_LOCAL_DAYS="${KEEP_LOCAL_DAYS:-3}"
STAMP="$(date +%Y%m%d-%H%M%S)"
ARCHIVE="$LOCAL_BACKUP_DIR/uploads-$STAMP.tar.gz"
LOG_FILE="$LOG_DIR/uploads-backup.log"
mkdir -p "$LOCAL_BACKUP_DIR" "$LOG_DIR"

log() { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $*" | tee -a "$LOG_FILE"; }

[ -d "$UPLOADS_DIR" ] || { log "FAILED: $UPLOADS_DIR tidak ada"; exit 21; }

STAGING="$LOCAL_BACKUP_DIR/.uploads-$STAMP.tar.gz.staging"
if ! tar czf "$STAGING" -C "$(dirname "$UPLOADS_DIR")" "$(basename "$UPLOADS_DIR")" 2>>"$LOG_FILE"; then
    rm -f "$STAGING"; log "FAILED: tar error"; exit 22
fi

if ! tar tzf "$STAGING" >/dev/null 2>>"$LOG_FILE"; then
    rm -f "$STAGING"; log "FAILED: arsip rusak"; exit 23
fi

SRC_N=$(find "$UPLOADS_DIR" -type f | wc -l)
ARC_N=$(tar tzf "$STAGING" | grep -cv '/$')
if [ "$SRC_N" -ne "$ARC_N" ]; then
    rm -f "$STAGING"; log "FAILED: jumlah file beda src=$SRC_N arc=$ARC_N"; exit 24
fi

mv "$STAGING" "$ARCHIVE"
log "OK: $ARCHIVE ($ARC_N files, size=$(stat -c%s "$ARCHIVE" 2>/dev/null || echo 0))"

find "$LOCAL_BACKUP_DIR" -maxdepth 1 -name 'uploads-*.tar.gz' -mtime +"$KEEP_LOCAL_DAYS" -delete

if [ -n "${RCLONE_REMOTE_UPLOADS:-}" ]; then
    if rclone copy "$ARCHIVE" "$RCLONE_REMOTE_UPLOADS" 2>>"$LOG_FILE"; then
        log "OK: copy off-server -> $RCLONE_REMOTE_UPLOADS"
    else
        log "WARN: rclone uploads gagal"
    fi
fi
exit 0
