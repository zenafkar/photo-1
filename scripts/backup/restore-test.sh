#!/usr/bin/env bash
# Restore-test mingguan: restore dump terbaru ke target scratch (Neon branch /
# postgres scratch), ukur RTO, alert bila gagal. TARGET_URL tidak boleh produksi.
set -euo pipefail

DB_BACKUP_DIR="${DB_BACKUP_DIR:-/var/lib/zen-deploy/database-backups}"
STATUS_DIR="${STATUS_DIR:-/var/lib/zen-deploy/status}"
LOG_DIR="${LOG_DIR:-/var/lib/zen-deploy/logs}"
RTO_BUDGET_S="${RTO_BUDGET_S:-1800}"
TARGET_URL="${RESTORE_TARGET_URL:-}"   # WAJIB di-set oleh operator; bukan production
LOG_FILE="$LOG_DIR/restore-test.log"
mkdir -p "$STATUS_DIR" "$LOG_DIR"

log() { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $*" | tee -a "$LOG_FILE"; }
alert() { [ -n "${ALERT_WEBHOOK_URL:-}" ] && curl -fsS -X POST "$ALERT_WEBHOOK_URL" -H 'Content-Type: application/json' -d "{\"text\":\"$*\"}" >/dev/null 2>&1 || true; }
fail() { echo "{\"ok\":false,\"error\":\"$1\",\"dump\":\"$2\"}" > "$STATUS_DIR/restore-test.json"; alert "RESTORE-TEST FAILED: $1 ($2)"; log "FAILED: $1 $2"; exit "$3"; }

[ -n "$TARGET_URL" ] || fail "RESTORE_TARGET_URL belum diset (Neon branch scratch, bukan production)" "" 1

DUMP="$(ls -1t "$DB_BACKUP_DIR"/db-*.dump 2>/dev/null | head -1)"
[ -n "${DUMP:-}" ] || fail "no_dump" "" 2
pg_restore -l "$DUMP" >/dev/null 2>>"$LOG_FILE" || fail "bad_toc" "$DUMP" 3

START=$(date +%s)
if ! pg_restore --exit-on-error --no-owner --no-privileges -d "$TARGET_URL" "$DUMP" 2>>"$LOG_FILE"; then
    fail "restore_error" "$DUMP" 4
fi

for t in "User" "UserCredit" "Generation" "PaymentOrder" "CreditTransaction"; do
    c=$(psql "$TARGET_URL" -tAc "SELECT count(*) FROM \"$t\"" 2>>"$LOG_FILE" || echo ERR)
    log "rowcount $t = $c"
    [ "$c" != "ERR" ] || fail "smoke_failed_$t" "$DUMP" 5
done

RTO=$(( $(date +%s) - START ))
[ "$RTO" -le "$RTO_BUDGET_S" ] || fail "rto_exceeded (${RTO}s>${RTO_BUDGET_S}s)" "$DUMP" 6

echo "{\"ok\":true,\"rto_s\":$RTO,\"dump\":\"$DUMP\",\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > "$STATUS_DIR/restore-test.json"
log "OK: restore test lolos, RTO=${RTO}s, dump=$DUMP"
alert "RESTORE-TEST OK: RTO ${RTO}s (budget ${RTO_BUDGET_S}s)"
exit 0
