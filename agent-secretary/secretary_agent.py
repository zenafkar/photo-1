import os
import json
import time
import shutil
import hashlib
import threading
from datetime import datetime, timedelta
from collections import deque
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from pydantic import BaseModel
import uvicorn
import requests

# ==========================================
# KONFIGURASI KUNCI (PRD v1.4.0)
# ==========================================
WATCH_DIRECTORY = "."
DATABASE_FILE = "Notulensi.json"
BACKUP_DIR = ".cache/secretary_backups"
MAX_HISTORY = 1000
MAX_FILE_SIZE_DIFF_BYTES = 1024 * 1024  # 1 MB Limit
WEBHOOK_URL = None  # Ganti dengan URL listener OpenCode AI jika ada (cth: "http://127.0.0.1:9000/webhook")

IGNORE_LIST = [
    ".git", "__pycache__", ".DS_Store", "node_modules", ".venv",
    DATABASE_FILE, "agent_log.txt", ".cache"
]

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
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"{timestamp}__{safe_name}"
    backup_path = os.path.join(BACKUP_DIR, backup_filename)

    try:
        with open(backup_path, 'w', encoding='utf-8') as f:
            f.writelines(lines)
    except Exception:
        pass  # Graceful Degradation: Jangan crash jika gagal backup

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

def send_webhook_async(payload):
    """Webhook Pusher Non-blocking dengan 3x Retry"""
    if not WEBHOOK_URL:
        return
    for _ in range(3):
        try:
            res = requests.post(WEBHOOK_URL, json=payload, timeout=2)
            if res.status_code == 200:
                break
        except Exception:
            time.sleep(1)

# ==========================================
# CORE FILE WATCHER & CONTENT DIFFING
# ==========================================
class UltimateSecretaryHandler(FileSystemEventHandler):
    def __init__(self):
        self.last_event_time = {}

    def is_ignored(self, rel_path):
        parts = rel_path.split(os.sep)
        return any(ignored in parts or rel_path == ignored for ignored in IGNORE_LIST)

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
            "waktu": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
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

            if current_lines is not None and old_lines:
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
app = FastAPI(title="Secretary Agent API v1.4.0")

class RollbackRequest(BaseModel):
    target_file: str
    rollback_to_timestamp: str  # Format: YYYY-MM-DD HH:MM:SS

@app.get("/notulensi/terakhir")
def get_terakhir(limit: int = Query(default=10, le=100)):
    return {"total": len(history), "data": list(history)[-limit:]}

@app.get("/notulensi/filter")
def filter_notulensi(menit: int = None, kata_kunci: str = None):
    hasil = list(history)
    if menit:
        batas = datetime.now() - timedelta(minutes=menit)
        hasil = [e for e in hasil if datetime.strptime(e["waktu"], "%Y-%m-%d %H:%M:%S") >= batas]
    if kata_kunci:
        hasil = [e for e in hasil if kata_kunci.lower() in e["target"].lower()]
    return {"total": len(hasil), "data": hasil}

@app.post("/notulensi/rollback")
def execute_rollback(req: RollbackRequest):
    """Auto-Rollback API: Memulihkan file dari Shadow Backup"""
    safe_target = req.target_file.replace(os.sep, "_")

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
            "waktu": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
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
def run_observer():
    event_handler = UltimateSecretaryHandler()
    observer = Observer()
    observer.schedule(event_handler, WATCH_DIRECTORY, recursive=True)
    observer.start()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()

if __name__ == "__main__":
    load_db()

    # Jalankan File Watcher di Background Thread
    watcher_thread = threading.Thread(target=run_observer, daemon=True)
    watcher_thread.start()

    print("Agent Secretary v1.4.0 Aktif [Port 8000]")
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="error")
