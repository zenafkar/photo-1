import os
import json
import re
import time
import shutil
import hashlib
import secrets
import threading
from datetime import datetime, timedelta, timezone
from collections import deque
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from fastapi import FastAPI, HTTPException, Query, Header, BackgroundTasks
from pydantic import BaseModel
import uvicorn
import requests

# ==========================================
# TIMEZONE: WIB (UTC+7)
# ==========================================
WIB = timezone(timedelta(hours=7))

# ==========================================
# KONFIGURASI KUNCI (PRD v1.5.0)
# ==========================================
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
WATCH_DIRECTORY = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
DATABASE_FILE = os.path.join(SCRIPT_DIR, "Notulensi.json")
BACKUP_DIR = os.path.join(SCRIPT_DIR, ".cache", "secretary_backups")
MAX_HISTORY = 1000
MAX_FILE_SIZE_DIFF_BYTES = 1024 * 1024  # 1 MB Limit
MAX_BACKUPS = 60  # Cap jumlah snapshot fisik di .cache/secretary_backups/
# WEBHOOK_URL: Baca dari environment variable SECRETARY_WEBHOOK_URL
# Format otomatis dideteksi dari URL:
#   - discord.com/api/webhooks  → Discord Embed
#   - hooks.slack.com           → Slack Block
#   - URL lainnya               → Raw JSON (existing)
WEBHOOK_URL = os.getenv("SECRETARY_WEBHOOK_URL")
# Auth token untuk endpoint rollback. Wajib diset — server fail-close jika kosong.
AUTH_TOKEN = os.getenv("SECRETARY_AUTH_TOKEN", "")

# File yang dilarang di-diff / dikirim ke webhook karena bisa memuat secret.
# .env* dan *.pem/*.key berpotensi memuat kredensial; test-* mengarah ke prod.
SENSITIVE_FILENAMES = (
    ".env", ".env.local", ".env.production", ".env.development",
    ".env.example", ".pem", ".key", ".p12", ".pfx",
    "test-clerk.js", "test-ui.js", "*.tsbuildinfo",
)

DATABASE_BASENAME = os.path.basename(DATABASE_FILE)

IGNORE_LIST = [
    ".git", "__pycache__", ".DS_Store", "node_modules", ".venv", "dist",
    DATABASE_BASENAME, DATABASE_BASENAME + ".tmp", "agent_log.txt", ".cache",
    ".env", ".env.local", ".env.production", ".env.development",
    ".env.example", "*.pem", "*.key", "*.p12", "*.pfx",
    "test-clerk.js", "test-ui.js", "*.tsbuildinfo",
]

def is_sensitive_path(rel_path):
    """True jika path memuat nama file yang berpotensi memuat secret."""
    base = os.path.basename(rel_path).lower()
    if base in (".env", ".env.local", ".env.production", ".env.development", ".env.example"):
        return True
    if base.endswith((".pem", ".key", ".p12", ".pfx", ".tsbuildinfo")):
        return True
    return False

def sanitize_target_for_backup(target):
    """Sanitasi nama file untuk nama backup — aman untuk lintas-OS (bukan hanya \\)."""
    return re.sub(r'[^A-Za-z0-9_\-.]', '_', target)

def is_safe_target(target):
    """Validasi path rollback: relatif, tanpa traversal, dan masih di dalam WATCH_DIRECTORY."""
    if not target:
        return False
    if os.path.isabs(target):
        return False
    # Tolak traversal (Unix maupun Windows) dan path dengan null byte
    if ".." in target.replace("\\", "/").split("/"):
        return False
    if "\x00" in target:
        return False
    resolved = os.path.realpath(os.path.join(WATCH_DIRECTORY, target))
    watch_root = os.path.realpath(WATCH_DIRECTORY)
    try:
        return os.path.commonpath([resolved, watch_root]) == watch_root
    except ValueError:
        return False

def is_authenticated(token):
    """Perbandingan token constant-time."""
    return bool(AUTH_TOKEN) and secrets.compare_digest(token or "", AUTH_TOKEN)

# In-Memory Database & Cache
history = deque(maxlen=MAX_HISTORY)
file_cache = {}  # {rel_path: {"hash": str, "lines": list[str]}}

# Buat folder backup jika belum ada
os.makedirs(BACKUP_DIR, exist_ok=True)

# ==========================================
# HELPER FUNCTIONS & SAFETY NETS
# ==========================================
def safe_read_file_lines(filepath):
    """Safety Net: Membaca file dengan aman tanpa crash jika encoding/binary error."""
    if not os.path.exists(filepath) or os.path.getsize(filepath) > MAX_FILE_SIZE_DIFF_BYTES:
        return None
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            return f.readlines()
    except Exception:
        return None

def compute_hash(lines):
    if lines is None:
        return None
    return hashlib.md5("".join(lines).encode('utf-8')).hexdigest()

def make_shadow_backup(rel_path, lines):
    """Shadow Backup: Menyimpan snapshot fisik file sebelum modifikasi baru."""
    if lines is None:
        return
    safe_name = rel_path.replace(os.sep, "_")
    timestamp = datetime.now(WIB).strftime("%Y%m%d_%H%M%S")
    backup_filename = f"{timestamp}__{safe_name}"
    backup_path = os.path.join(BACKUP_DIR, backup_filename)

    try:
        with open(backup_path, 'w', encoding='utf-8') as f:
            f.writelines(lines)
    except Exception:
        pass  # Graceful Degradation: Jangan crash jika gagal backup
    prune_backups()

def prune_backups():
    """Prune: Batasi jumlah snapshot fisik di BACKUP_DIR sesuai MAX_BACKUPS.

    Backup diurutkan berdasarkan nama file (prefix timestamp %Y%m%d_%H%M%S
    selalu zero-padded sehingga sort lexicographic == sort kronologis).
    Snapshot paling lama (paling atas urutan) dihapus hingga tersisa
    maksimal MAX_BACKUPS. Kegagalan apa pun diabaikan (Graceful Degradation).
    """
    try:
        backups = [f for f in os.listdir(BACKUP_DIR) if os.path.isfile(os.path.join(BACKUP_DIR, f))]
        backups.sort()
        excess = len(backups) - MAX_BACKUPS
        if excess > 0:
            for old in backups[:excess]:
                try:
                    os.remove(os.path.join(BACKUP_DIR, old))
                except OSError:
                    pass  # File mungkin sudah dihapus proses lain — abaikan
    except OSError:
        pass  # Folder backup belum ada / tidak bisa diakses — abaikan

def parse_wib_time(value):
    """Parse timestamp WIB dari format lama (%Y-%m-%d %H:%M:%S) maupun ISO 8601."""
    for fmt in ("%Y-%m-%dT%H:%M:%S%z", "%Y-%m-%d %H:%M:%S"):
        try:
            return datetime.strptime(value, fmt)
        except (ValueError, TypeError):
            continue
    raise ValueError(f"Timestamp tidak dikenal: {value}")

def save_db():
    """Atomic Save untuk mencegah corrupt file Notulensi.json"""
    tmp_db = DATABASE_FILE + ".tmp"
    try:
        with open(tmp_db, "w", encoding="utf-8") as f:
            json.dump(list(history), f, ensure_ascii=False, indent=2)
        os.replace(tmp_db, DATABASE_FILE)
    except Exception:
        pass

def load_db():
    if os.path.exists(DATABASE_FILE):
        try:
            with open(DATABASE_FILE, "r", encoding="utf-8") as f:
                history.extend(json.load(f))
        except Exception:
            # Fallback jika JSON rusak
            if os.path.exists(DATABASE_FILE):
                os.rename(DATABASE_FILE, DATABASE_FILE + ".corrupted")

def detect_webhook_type(url):
    """Auto-deteksi format webhook berdasarkan URL pattern."""
    if not url:
        return "raw"
    url_lower = url.lower()
    if "discord.com/api/webhooks" in url_lower:
        return "discord"
    if "hooks.slack.com" in url_lower:
        return "slack"
    return "raw"

def format_wib_iso(dt):
    """Format datetime WIB ke ISO 8601 dengan offset +07:00 untuk Discord."""
    return dt.strftime("%Y-%m-%dT%H:%M:%S+07:00")

def format_discord_payload(entry):
    """Bungkus entry jadi Discord Embed format."""
    aksi = entry.get("aksi", "unknown")
    target = entry.get("target", "?")
    waktu = entry.get("waktu", "?")
    jenis = entry.get("jenis", "file")

    # Warna embed berdasarkan jenis aksi
    color_map = {
        "dibuat": 0x57F287,   # hijau
        "diubah": 0xFEE75C,   # kuning
        "dihapus": 0xED4245,  # merah
        "rollback": 0x5865F2, # biru
    }
    color = color_map.get(aksi.split(" ke")[0], 0x95A5A6)  # abu-abu default

    embed = {
        "title": f"{aksi.upper()} — {target}",
        "color": color,
        "timestamp": waktu,
        "fields": [
            {"name": "Target", "value": f"`{target}`", "inline": True},
            {"name": "Jenis", "value": jenis, "inline": True},
        ],
    }

    # Tambah diff stat jika ada
    diff_stat = entry.get("diff_stat")
    if diff_stat and isinstance(diff_stat, dict):
        embed["fields"].append({
            "name": "Diff",
            "value": f"+{diff_stat.get('ditambah', 0)} / -{diff_stat.get('dihapus', 0)} baris",
            "inline": True
        })

    # Tambah detail perubahan (ringkas, maks 10 baris)
    detail = entry.get("perubahan_detail", [])
    if detail:
        detail_text = "\n".join(detail[:10])
        if len(detail) > 10:
            detail_text += f"\n... dan {len(detail) - 10} baris lainnya"
        embed["description"] = f"```diff\n{detail_text}\n```"

    # Keterangan khusus (rollback)
    keterangan = entry.get("keterangan")
    if keterangan:
        embed["fields"].append({"name": "Keterangan", "value": keterangan, "inline": False})

    return {
        "embeds": [embed],
        "username": "Agent Secretary",
    }

def format_slack_payload(entry):
    """Bungkus entry jadi Slack Block Kit format."""
    aksi = entry.get("aksi", "unknown")
    target = entry.get("target", "?")
    waktu = entry.get("waktu", "?")

    # Emoji berdasarkan aksi
    emoji_map = {
        "dibuat": ":heavy_plus_sign:",
        "diubah": ":pencil2:",
        "dihapus": ":wastebasket:",
        "rollback": ":rewind:",
    }
    emoji = emoji_map.get(aksi.split(" ke")[0], ":information_source:")

    blocks = [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"{emoji} *{aksi.upper()}* — `{target}`"
            }
        },
        {
            "type": "context",
            "elements": [
                {"type": "mrkdwn", "text": f":clock3: {waktu}  |  :file_folder: {entry.get('jenis', 'file')}"}
            ]
        }
    ]

    # Diff stat
    diff_stat = entry.get("diff_stat")
    if diff_stat and isinstance(diff_stat, dict):
        blocks.append({
            "type": "context",
            "elements": [
                {"type": "mrkdwn", "text": f":bar_chart: `+{diff_stat.get('ditambah', 0)}` / `-{diff_stat.get('dihapus', 0)}` baris"}
            ]
        })

    # Detail perubahan (ringkas)
    detail = entry.get("perubahan_detail", [])
    if detail:
        detail_text = "\n".join(detail[:10])
        if len(detail) > 10:
            detail_text += f"\n... dan {len(detail) - 10} baris lainnya"
        blocks.append({
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"```{detail_text}```"
            }
        })

    # Keterangan rollback
    keterangan = entry.get("keterangan")
    if keterangan:
        blocks.append({
            "type": "context",
            "elements": [{"type": "mrkdwn", "text": f":memo: {keterangan}"}]
        })

    return {
        "blocks": blocks,
        "username": "Agent Secretary",
    }

def send_webhook_async(payload):
    """Webhook Pusher Non-blocking dengan 3x Retry + Auto-format Discord/Slack"""
    if not WEBHOOK_URL:
        return

    webhook_type = detect_webhook_type(WEBHOOK_URL)
    if webhook_type == "discord":
        formatted = format_discord_payload(payload)
    elif webhook_type == "slack":
        formatted = format_slack_payload(payload)
    else:
        formatted = payload  # Raw JSON untuk generic webhook

    for attempt in range(3):
        try:
            res = requests.post(WEBHOOK_URL, json=formatted, timeout=3)
            if res.status_code in (200, 204):
                break
            # Discord/Slack return non-200 on malformed payload — jangan retry
            if webhook_type in ("discord", "slack") and 400 <= res.status_code < 500:
                break
        except Exception:
            if attempt < 2:
                time.sleep(1)

# ==========================================
# CORE FILE WATCHER & CONTENT DIFFING
# ==========================================
class UltimateSecretaryHandler(FileSystemEventHandler):
    def __init__(self):
        self.last_event_time = {}

    def is_ignored(self, rel_path):
        parts = rel_path.replace(os.sep, "/").split("/")
        for ignored in IGNORE_LIST:
            if ignored.startswith("*."):
                if any(p.endswith(ignored[1:]) for p in parts):
                    return True
            elif ignored in parts or rel_path == ignored:
                return True
        return is_sensitive_path(rel_path)

    def process_change(self, event_type, src_path, is_dir, dest_path=None):
        rel_path = os.path.relpath(src_path, WATCH_DIRECTORY)
        if self.is_ignored(rel_path):
            return

        # Debouncing 1 detik
        now = time.time()
        if rel_path in self.last_event_time and (now - self.last_event_time[rel_path]) < 1.0:
            return
        self.last_event_time[rel_path] = now

        entry = {
            "waktu": format_wib_iso(datetime.now(WIB)),
            "aksi": event_type,
            "target": rel_path,
            "jenis": "folder" if is_dir else "file"
        }

        # Real-Time Content Diffing (Khusus File Modified/Created)
        if not is_dir and event_type in ["diubah", "dibuat"]:
            current_lines = safe_read_file_lines(src_path)
            current_hash = compute_hash(current_lines)

            old_data = file_cache.get(rel_path, {})
            old_lines = old_data.get("lines", [])

            # Jika hash sama, abaikan (mencegah log palsu)
            if event_type == "diubah" and old_data.get("hash") == current_hash and current_hash is not None:
                return

            # Defense-in-depth: file sensitif (mis. .env) tidak pernah di-diff/di-log
            # isinya, meski lolos IGNORE_LIST. Mencegah kebocoran secret via webhook.
            if is_sensitive_path(rel_path):
                entry["diff_stat"] = "SENSITIVE_FILE_SKIPPED"
                entry["perubahan_detail"] = ["[konten disembunyikan: file sensitif]"]

            if current_lines is not None and old_lines and not is_sensitive_path(rel_path):
                # Simpan Shadow Backup dari kondisi lama sebelum ditimpa
                make_shadow_backup(rel_path, old_lines)

                import difflib
                diff = list(difflib.unified_diff(old_lines, current_lines, lineterm=''))

                added = [line[1:].strip() for line in diff if line.startswith('+') and not line.startswith('+++')]
                removed = [line[1:].strip() for line in diff if line.startswith('-') and not line.startswith('---')]

                entry["diff_stat"] = {"ditambah": len(added), "dihapus": len(removed)}

                # Mode Ringkas jika perubahan > 20 baris
                if (len(added) + len(removed)) <= 20:
                    entry["perubahan_detail"] = [f"+ {l}" for l in added] + [f"- {l}" for l in removed]
                else:
                    entry["perubahan_detail"] = [f"SUMMARY: +{len(added)} lines, -{len(removed)} lines"]
            else:
                entry["diff_stat"] = "NEW_OR_BINARY_FILE"

            # Update In-Memory Cache
            if current_lines is not None:
                file_cache[rel_path] = {"hash": current_hash, "lines": current_lines}

        elif event_type == "dihapus":
            file_cache.pop(rel_path, None)

        history.append(entry)
        save_db()

        # Trigger Proactive Webhook di Background Thread
        threading.Thread(target=send_webhook_async, args=(entry,), daemon=True).start()

    def on_created(self, event):
        self.process_change("dibuat", event.src_path, event.is_directory)

    def on_modified(self, event):
        self.process_change("diubah", event.src_path, event.is_directory)

    def on_deleted(self, event):
        self.process_change("dihapus", event.src_path, event.is_directory)

    def on_moved(self, event):
        dest_rel = os.path.relpath(event.dest_path, WATCH_DIRECTORY)
        self.process_change(f"dipindah ke {dest_rel}", event.src_path, event.is_directory)

# ==========================================
# FASTAPI ENDPOINTS & AUTO-ROLLBACK
# ==========================================
app = FastAPI(title="Secretary Agent API v1.5.0")

@app.get("/health")
def health_check():
    return {
        "status": "healthy" if observer_alive else "degraded",
        "observer_alive": observer_alive,
        "history_count": len(history),
    }

class RollbackRequest(BaseModel):
    target_file: str
    rollback_to_timestamp: str = ""  # Format: YYYY-MM-DD HH:MM:SS — opsional, selalu pakai backup terbaru

@app.get("/notulensi/terakhir")
def get_terakhir(limit: int = Query(default=10, le=100)):
    return {"total": len(history), "data": list(history)[-limit:]}

@app.get("/notulensi/filter")
def filter_notulensi(menit: int = None, kata_kunci: str = None):
    hasil = list(history)
    if menit:
        batas = datetime.now(WIB) - timedelta(minutes=menit)
        filtered = []
        for e in hasil:
            try:
                if parse_wib_time(e["waktu"]) >= batas:
                    filtered.append(e)
            except (ValueError, TypeError):
                pass  # Abaikan entry dengan timestamp tidak dikenal
        hasil = filtered
    if kata_kunci:
        hasil = [e for e in hasil if kata_kunci.lower() in e["target"].lower()]
    return {"total": len(hasil), "data": hasil}

@app.post("/notulensi/rollback")
def execute_rollback(req: RollbackRequest, authorization: str = Header(default="")):
    """Auto-Rollback API: Memulihkan file dari Shadow Backup"""
    # Autentikasi: fail-close jika token tidak diset di env, atau mismatch.
    if not AUTH_TOKEN:
        raise HTTPException(status_code=503, detail="Server misconfiguration: SECRETARY_AUTH_TOKEN not set.")
    provided = authorization[7:] if authorization.lower().startswith("bearer ") else ""
    if not is_authenticated(provided):
        raise HTTPException(status_code=401, detail="Unauthorized.")

    # Validasi path: tolak traversal keluar dari WATCH_DIRECTORY.
    if not is_safe_target(req.target_file):
        raise HTTPException(status_code=400, detail="Invalid target_file.")

    safe_target = sanitize_target_for_backup(req.target_file)

    # Cari file backup terdekat di folder .cache/secretary_backups/
    if not os.path.exists(BACKUP_DIR):
        raise HTTPException(status_code=404, detail="Folder backup tidak ditemukan.")

    backups = [f for f in os.listdir(BACKUP_DIR) if safe_target in f]
    if not backups:
        raise HTTPException(status_code=404, detail=f"Tidak ada backup untuk file {req.target_file}")

    # Urutkan backup berdasarkan timestamp nama file
    backups.sort()
    selected_backup = backups[-1]  # Ambil backup fisik paling akhir sebelum error
    backup_file_path = os.path.join(BACKUP_DIR, selected_backup)

    try:
        target_full_path = os.path.join(WATCH_DIRECTORY, req.target_file)

        # Pre-Snapshot saat ini untuk Safety Net sebelum overwriting
        current_lines = safe_read_file_lines(target_full_path)
        make_shadow_backup(req.target_file + ".pre_rollback", current_lines)

        # Timpa kembali file target dengan data backup
        shutil.copyfile(backup_file_path, target_full_path)

        # Catat Log Rollback
        rollback_entry = {
            "waktu": format_wib_iso(datetime.now(WIB)),
            "aksi": "rollback",
            "target": req.target_file,
            "jenis": "file",
            "keterangan": f"Restored from backup {selected_backup}"
        }
        history.append(rollback_entry)
        save_db()

        return {
            "status": "SUCCESS",
            "message": f"File {req.target_file} berhasil dikembalikan ke versi backup.",
            "backup_used": selected_backup
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal melakukan rollback: {str(e)}")

# ==========================================
# MAIN EXECUTION
# ==========================================
observer_alive = False

def run_observer():
    global observer_alive
    RESTART_DELAY = 5

    while True:
        event_handler = UltimateSecretaryHandler()
        observer = Observer()
        observer.schedule(event_handler, WATCH_DIRECTORY, recursive=True)
        try:
            observer.start()
            observer_alive = True
            print(f"[Secretary] Observer started — watching {WATCH_DIRECTORY}")

            while observer.is_alive():
                time.sleep(1)

            # observer.is_alive() returned False but no exception — unexpected exit
            print("[Secretary] Observer stopped unexpectedly, restarting...")
        except Exception as e:
            print(f"[Secretary] Observer crashed: {e}")
        finally:
            observer_alive = False
            try:
                observer.stop()
            except Exception:
                pass
            observer.join()

        print(f"[Secretary] Restarting observer in {RESTART_DELAY}s...")
        time.sleep(RESTART_DELAY)

if __name__ == "__main__":
    load_db()

    # Jalankan File Watcher di Background Thread
    watcher_thread = threading.Thread(target=run_observer, daemon=True)
    watcher_thread.start()

    wh_type = detect_webhook_type(WEBHOOK_URL) if WEBHOOK_URL else None
    wh_status = f"Webhook: {wh_type.upper()}" if wh_type else "Webhook: OFF"
    print(f"Agent Secretary v1.5.0 Aktif [Port 8000] | {wh_status}")
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="error")
