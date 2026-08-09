"""Bot Telegram ZenDev Deploy.

Perintah:
  /deploy [--skip-build] [--no-db] [--db] [--force] -- deploy dengan konfirmasi
  /status  -- status deploy (idle / sedang jalan / hasil terakhir)
  /health  -- cek kesehatan VPS (PM2, API, RAM, disk)
  /logs [N] -- N baris log terakhir
  /rollback -- kembalikan ke versi sebelumnya
  /ping    -- cek bot hidup
  /help    -- panduan
"""
import asyncio
import html
import json
import logging
import subprocess
import time
import uuid
from logging.handlers import RotatingFileHandler

from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.constants import ChatAction
from telegram.error import TelegramError
from telegram.ext import (
    AIORateLimiter,
    Application,
    ApplicationBuilder,
    CallbackQueryHandler,
    CommandHandler,
    ContextTypes,
)

from config import Config, LOG_DIR, load_config
from deploy import DeployManager

PENDING: dict[str, dict] = {}
CONFIRM_TTL_S = 300

PHASE_LABELS = {
    "preflight": "Pemeriksaan awal",
    "test": "Menjalankan test",
    "pull": "Pull kode terbaru",
    "install": "Install dependencies",
    "frontend-build": "Build frontend",
    "backend-build": "Build backend",
    "backup": "Backup versi lama",
    "deploy": "Deploy versi baru",
    "database": "Database migration",
    "restart": "Restart PM2",
    "health-check": "Cek kesehatan",
    "rollback": "Rollback",
    "starting": "Memulai",
}

logger = logging.getLogger("deploy-bot")


def setup_logging(log_dir=None):
    logger.setLevel(logging.INFO)

    console = logging.StreamHandler()
    console.setLevel(logging.INFO)
    console.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s"))
    logger.addHandler(console)

    log_dir = log_dir or LOG_DIR
    log_dir.mkdir(parents=True, exist_ok=True)
    file_handler = RotatingFileHandler(
        log_dir / "bot.log",
        maxBytes=10 * 1024 * 1024,
        backupCount=5,
        encoding="utf-8",
    )
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s"))
    logger.addHandler(file_handler)


def is_authorized(update: Update, cfg: Config) -> bool:
    user = update.effective_user
    chat = update.effective_chat
    if user is None or chat is None:
        return False
    if cfg.require_private_chat and chat.type != "private":
        return False
    return user.id in cfg.allowed_user_ids


def fmt_tail(tail: list[str], n: int = 30) -> str:
    lines = tail[-(n):] if n > 0 else tail
    return "\n".join(lines[-n:]) if lines else "(belum ada output)"


def escaped_tail(tail: list[str], n: int) -> str:
    return html.escape(fmt_tail(tail, n))


def build_progress_text(status: dict, tail: list[str]) -> str:
    phase = status.get("phase", "")
    label = PHASE_LABELS.get(phase, phase)
    elapsed = status.get("elapsed_s", 0)
    head = f"🚀 <b>Deploy sedang berjalan...</b>\n• Fase: <b>{html.escape(label)}</b>\n• Durasi: {elapsed:.0f} detik\n"
    body = escaped_tail(tail, 20)
    if body:
        head += f"```\n{body[:3000]}\n```"
    return head[:4000]


def format_deploy_help() -> str:
    return (
        "🚀 <b>ZENDEV DEPLOY BOT</b>\n\n"
        "• /deploy — Mulai deploy ke VPS (muncul tombol konfirmasi)\n"
        "• /deploy --skip-build — Deploy tanpa build ulang\n"
        "• /deploy --no-db — Deploy tanpa menyentuh database\n"
        "• /deploy --db — Jalankan prisma db push (NONAKTIF secara default; "
        "set DEPLOY_DB_ENABLED=true untuk mengaktifkan)\n"
        "• /deploy --skip-test — Lewati npm test\n"
        "• /deploy --force — Tidak melewati deploy aktif; hanya kompatibilitas\n"
        "• /status — Cek status deploy\n"
        "• /health — Cek kesehatan VPS (PM2, API, RAM, disk)\n"
        "• /cancel — Batalkan deploy di sela-sela langkah\n"
        "• /logs [N] — Lihat N baris log terakhir\n"
        "• /rollback — Kembalikan ke versi sebelumnya\n"
        "• /ping — Cek bot hidup\n"
        "• /help — Tampilkan panduan ini\n\n"
        "Contoh: <code>/deploy --skip-build --no-db</code>"
    )


async def cleanup_pending():
    while True:
        await asyncio.sleep(60)
        now = time.time()
        expired = [k for k, v in PENDING.items() if now > v["expires"]]
        for k in expired:
            PENDING.pop(k, None)
            logger.info(f"Cleaned up expired pending: {k}")


async def cmd_help(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    if not is_authorized(update, ctx.application.bot_data["cfg"]):
        return
    await update.message.reply_text(format_deploy_help(), parse_mode="HTML")


async def cmd_ping(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    cfg: Config = ctx.application.bot_data["cfg"]
    logger.info("PING received, authorized=%s", is_authorized(update, cfg))
    if not is_authorized(update, cfg):
        return
    await update.message.reply_text("pong — bot deploy online ✅")


async def cmd_status(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    if not is_authorized(update, ctx.application.bot_data["cfg"]):
        return
    mgr: DeployManager = ctx.application.bot_data["manager"]
    st = mgr.status()
    if st["running"]:
        label = PHASE_LABELS.get(st["phase"], st["phase"])
        await update.message.reply_text(
            f"⚙️ Sedang deploy...\nFase: <b>{html.escape(label)}</b>\nDurasi: {st['elapsed_s']:.0f} detik",
            parse_mode="HTML",
        )
    elif mgr.external_lock_active():
        await update.message.reply_text("🔒 Ada deploy lain yang sedang berjalan (lock aktif).")
    elif st["state"] == "succeeded":
        await update.message.reply_text(
            f"✅ Idle. Deploy terakhir berhasil (durasi {st['elapsed_s']:.0f} detik)."
        )
    elif st["state"] == "failed":
        last = st.get("last_result") or {}
        detail = last.get("error") or f"exit {last.get('exit_code', -1)}"
        await update.message.reply_text(
            f"❌ Idle. Deploy terakhir gagal: {html.escape(detail[:200])}"
        )
    elif st["state"] == "blocked":
        await update.message.reply_text("⚠️ Idle. Deploy terakhir tidak dijalankan karena lock aktif.")
    else:
        await update.message.reply_text("🟢 Idle. Siap menerima /deploy.")


async def cmd_health(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    if not is_authorized(update, ctx.application.bot_data["cfg"]):
        return

    cfg: Config = ctx.application.bot_data["cfg"]
    await update.message.reply_text("🏥 Mengecek kesehatan VPS...")

    lines = []
    ssh_target = f"{cfg.vps_user}@{cfg.vps_ip}"
    ssh_opts = ["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=10", "-o", "StrictHostKeyChecking=accept-new", ssh_target]

    def run_vps(command: str, timeout: int):
        if cfg.vps_local:
            return subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=timeout,
            )
        return subprocess.run(
            ssh_opts + [command],
            capture_output=True,
            text=True,
            timeout=timeout,
        )

    # PM2
    try:
        pm2 = run_vps("pm2 jlist", 15)
        if pm2.returncode == 0:
            processes = json.loads(pm2.stdout)
            backend = next((p for p in processes if p["name"] == "backend-api"), None)
            if backend:
                status = backend["pm2_env"]["status"]
                mem_mb = backend["monit"]["memory"] / (1024 * 1024)
                uptime_ms = time.time() * 1000 - backend["pm2_env"]["pm_uptime"]
                uptime_h = uptime_ms / (1000 * 3600)
                lines.append(f"• <b>PM2:</b> {html.escape(status)} | RAM: {mem_mb:.0f}MB | Uptime: {uptime_h:.1f}h")
            else:
                lines.append("• <b>PM2:</b> ❌ backend-api not found")
        else:
            lines.append("• <b>PM2:</b> ❌ pm2 command failed")
    except Exception as e:
        lines.append(f"• <b>PM2:</b> ❌ {html.escape(str(e)[:100])}")

    # API
    try:
        curl = run_vps("curl -s -o /dev/null -w '%{http_code}' --max-time 10 http://localhost:5000/api/v1/health/ready", 20)
        code = curl.stdout.strip()
        if code == "200":
            lines.append("• <b>API:</b> ✅ 200 OK")
        else:
            lines.append(f"• <b>API:</b> ❌ HTTP {html.escape(code)}")
    except Exception as e:
        lines.append(f"• <b>API:</b> ❌ {html.escape(str(e)[:100])}")

    # RAM
    try:
        ram = run_vps("free -m | awk 'NR==2{print $2 \" \" $3}'", 10)
        if ram.returncode == 0 and ram.stdout.strip():
            parts = ram.stdout.strip().split()
            if len(parts) == 2:
                total, used = parts
                pct = int(used) / int(total) * 100
                lines.append(f"• <b>RAM:</b> {used}MB / {total}MB ({pct:.0f}%)")
    except Exception:
        pass

    # Disk
    try:
        disk = run_vps("df -h / | awk 'NR==2{print $3\"/\"$2\" (\"$5\")\"}'", 10)
        if disk.returncode == 0 and disk.stdout.strip():
            lines.append(f"• <b>Disk:</b> {html.escape(disk.stdout.strip())}")
    except Exception:
        pass

    text = "🏥 <b>VPS Health Report</b>\n\n" + "\n".join(lines)
    await update.message.reply_text(text, parse_mode="HTML")


async def cmd_logs(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    if not is_authorized(update, ctx.application.bot_data["cfg"]):
        return
    n = 30
    if update.message.text and update.message.text.strip().split()[-1].isdigit():
        n = min(int(update.message.text.strip().split()[-1]), 200)
    cfg: Config = ctx.application.bot_data["cfg"]
    log_dir = cfg.log_dir or LOG_DIR
    log_files = sorted(log_dir.glob("deploy-*.log"))
    if not log_files:
        await update.message.reply_text("Belum ada log deploy.")
        return
    content = log_files[-1].read_text(encoding="utf-8", errors="replace")
    lines = content.splitlines()[-n:]
    text = "```\n" + html.escape("\n".join(lines))[:3800] + "\n```"
    await update.message.reply_text(text, parse_mode="HTML")


async def cmd_rollback(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    if not is_authorized(update, ctx.application.bot_data["cfg"]):
        return

    await update.message.reply_text("🔙 <b>Rolling back to previous version...</b>", parse_mode="HTML")

    logger.info(f"Rollback initiated by {update.effective_user.id}")

    try:
        mgr: DeployManager = ctx.application.bot_data["manager"]

        async def on_error(message: str) -> None:
            logger.error("Rollback process error: %s", message)

        result = await mgr.run(rollback=True, error_cb=on_error)
        tail = escaped_tail(result.tail, 15)

        if result.ok:
            await update.message.reply_text(
                f"✅ <b>Rollback berhasil!</b>\n\n```\n{tail[:3000]}\n```",
                parse_mode="HTML",
            )
            logger.info("Rollback completed successfully")
        else:
            await update.message.reply_text(
                f"❌ <b>Rollback gagal</b> (exit {result.exit_code})\n\n```\n{tail[:3000]}\n```",
                parse_mode="HTML",
            )
            logger.error(f"Rollback failed with exit code {result.exit_code}")
    except RuntimeError as e:
        await update.message.reply_text(f"❌ Rollback tidak dapat dimulai: {html.escape(str(e))}")
        logger.error("Rollback could not start: %s", e)
    except Exception as e:
        await update.message.reply_text(f"❌ Rollback error: {html.escape(str(e)[:200])}")
        logger.error(f"Rollback error: {e}")


async def cmd_deploy(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    cfg: Config = ctx.application.bot_data["cfg"]
    if not is_authorized(update, cfg):
        return
    if not update.message or not update.message.text:
        return

    parts = update.message.text.split()
    raw_flags = parts[1:]
    known_flags = {"--skip-build", "--skip-test", "--no-db", "--db", "--force"}
    unknown = [f for f in raw_flags if f not in known_flags]
    if unknown:
        await update.message.reply_text(
            f"⚠️ Flag tidak dikenal: <code>{html.escape(', '.join(unknown))}</code>\n"
            "Ketik /help untuk daftar flag yang valid.",
            parse_mode="HTML",
        )
        return

    flags = set(raw_flags)
    skip_build = "--skip-build" in flags
    skip_test = "--skip-test" in flags
    no_db = "--no-db" in flags
    db_push = "--db" in flags
    force = "--force" in flags

    if db_push and no_db:
        await update.message.reply_text(
            "⚠️ Flag <code>--db</code> dan <code>--no-db</code> saling bertentangan. Gunakan salah satu saja.",
            parse_mode="HTML",
        )
        return

    # Guardrail F3 (fail-closed): perubahan schema produksi tidak boleh terjadi
    # tanpa izin eksplisit DEPLOY_DB_ENABLED=true. Flag --db tetap dikenal,
    # tetapi ditolak sebelum konfirmasi dibuat selama belum diaktifkan.
    if db_push and not cfg.deploy_db_enabled:
        await update.message.reply_text(
            "⛔ <b><code>--db</code> dinonaktifkan</b> (fail-closed).\n\n"
            "Flag <code>--db</code> TIDAK mengizinkan perubahan schema produksi "
            "selama <code>DEPLOY_DB_ENABLED</code> belum bernilai "
            "<code>true</code> di <code>deploy-bot/.env</code>.\n\n"
            "Untuk mengaktifkan: set <code>DEPLOY_DB_ENABLED=true</code>, lalu "
            "restart bot. Tanpa izin itu, gunakan <code>/deploy</code> atau "
            "<code>/deploy --no-db</code>.",
            parse_mode="HTML",
        )
        return

    mgr: DeployManager = ctx.application.bot_data["manager"]
    if mgr.is_running():
        await update.message.reply_text("⚠️ Deploy sedang berjalan. Ketik /status.")
        return

    lock_warn = ""
    if mgr.external_lock_active():
        lock_warn = "\n\n⚠️ Lock deploy aktif — deploy lain terdeteksi. Tunggu sampai selesai."

    summary = (
        f"🚀 <b>Konfirmasi Deploy</b>\n"
        f"• Build: {'SKIP' if skip_build else 'YES'}\n"
        f"• Test: {'SKIP' if skip_test else 'YES'}\n"
        f"• Prisma db push: {'YES (hati-hati)' if db_push else 'NO'}\n"
        f"• Target: VPS local deploy{lock_warn}\n\n"
        f"Konfirmasi berlaku 5 menit."
    )
    run_id = f"d{uuid.uuid4().hex}"
    PENDING[run_id] = {
        "chat_id": update.message.chat_id,
        "user_id": update.effective_user.id,
        "expires": time.time() + CONFIRM_TTL_S,
        "flags": {
            "skip_build": skip_build,
            "skip_test": skip_test,
            "no_db": no_db,
            "db_push": db_push,
            "force": force,
        },
        "message_id": None,
    }
    keyboard = InlineKeyboardMarkup([
        [
            InlineKeyboardButton("✅ Deploy", callback_data=f"ok:{run_id}"),
            InlineKeyboardButton("❌ Batal", callback_data=f"no:{run_id}"),
        ]
    ])
    msg = await update.message.reply_text(summary, parse_mode="HTML", reply_markup=keyboard)
    PENDING[run_id]["message_id"] = msg.message_id
    logger.info(f"Deploy confirmation created: {run_id} by user {update.effective_user.id}")


async def on_confirm(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    cfg: Config = ctx.application.bot_data["cfg"]
    query = update.callback_query
    if query is None or not query.data or ":" not in query.data:
        return
    action, run_id = query.data.split(":", 1)

    user = update.effective_user
    chat = update.effective_chat
    if user is None or chat is None or user.id not in cfg.allowed_user_ids:
        await query.answer("Unauthorized", show_alert=True)
        return
    if cfg.require_private_chat and chat.type != "private":
        await query.answer("Hanya chat pribadi", show_alert=True)
        return

    pending = PENDING.get(run_id)
    if pending is None:
        await query.answer("Konfirmasi sudah kadaluarsa / tidak dikenal.", show_alert=True)
        return
    if pending["user_id"] != user.id:
        await query.answer("Bukan pengirim perintah ini.", show_alert=True)
        return
    if time.time() > pending["expires"]:
        PENDING.pop(run_id, None)
        await query.answer("Konfirmasi kadaluarsa — ketik /deploy lagi.", show_alert=True)
        return

    PENDING.pop(run_id, None)

    await query.answer("OK")
    try:
        await query.edit_message_reply_markup(reply_markup=None)
    except TelegramError:
        pass

    if action != "ok":
        await query.edit_message_text("❌ Deploy dibatalkan.")
        logger.info(f"Deploy {run_id} cancelled by user {user.id}")
        return

    await query.edit_message_text("🚀 Deploy dimulai...")
    mgr: DeployManager = ctx.application.bot_data["manager"]
    flags = pending["flags"]
    done = asyncio.Event()

    async def on_progress(status: dict, tail: list[str]):
        if done.is_set():
            return
        try:
            await query.edit_message_text(
                build_progress_text(status, tail), parse_mode="HTML"
            )
        except TelegramError:
            pass
        except Exception as exc:
            logger.warning("Progress message update failed for %s: %s", run_id, exc)

    async def on_error(message: str):
        if done.is_set():
            return
        try:
            await query.edit_message_text(
                f"⚠️ <b>Deploy mengalami error</b>\n{html.escape(message[:500])}",
                parse_mode="HTML",
            )
        except TelegramError:
            pass
        except Exception as exc:
            logger.warning("Error message update failed for %s: %s", run_id, exc)

    logger.info(f"Deploy {run_id} started with flags: {flags}")
    try:
        result = await mgr.run(**flags, progress_cb=on_progress, error_cb=on_error)
    except Exception as e:
        done.set()
        logger.exception("Deploy %s could not start", run_id)
        try:
            await query.edit_message_text(
                f"❌ <b>Deploy tidak dapat dimulai</b>\n\n{html.escape(str(e)[:500])}",
                parse_mode="HTML",
            )
        except TelegramError:
            pass
        return
    done.set()

    if result.ok:
        await query.edit_message_text(
            "✅ <b>Deploy berhasil!</b>\n\n"
            + escaped_tail(result.tail, 15)[:3800],
            parse_mode="HTML",
        )
        logger.info(f"Deploy {run_id} succeeded")
    else:
        await query.edit_message_text(
            f"❌ <b>Deploy GAGAL</b> (exit {result.exit_code})\n\n"
            + escaped_tail(result.tail, 25)[:3800],
            parse_mode="HTML",
        )
        logger.error(f"Deploy {run_id} failed with exit code {result.exit_code}")


async def cmd_cancel(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    if not is_authorized(update, ctx.application.bot_data["cfg"]):
        return
    user = update.effective_user
    removed = [rid for rid, p in PENDING.items() if p["user_id"] == user.id]
    for rid in removed:
        PENDING.pop(rid, None)
    if removed:
        await update.message.reply_text("Konfirmasi deploy dibatalkan.")
    else:
        mgr: DeployManager = ctx.application.bot_data["manager"]
        if mgr.is_running():
            await update.message.reply_text(
                "Proses deploy sedang berjalan dan tidak bisa dihentikan paksa. "
                "Ketik /status untuk melihat progres."
            )
        else:
            await update.message.reply_text("Tidak ada deploy aktif untuk dibatalkan.")


def main() -> None:
    cfg = load_config()
    setup_logging(cfg.log_dir)
    (cfg.log_dir or LOG_DIR).mkdir(parents=True, exist_ok=True)
    manager = DeployManager(cfg)

    async def post_init(app: Application) -> None:
        asyncio.create_task(cleanup_pending())

    app: Application = (
        ApplicationBuilder()
        .token(cfg.bot_token)
        .rate_limiter(AIORateLimiter())
        .post_init(post_init)
        .build()
    )
    app.bot_data["cfg"] = cfg
    app.bot_data["manager"] = manager

    app.add_handler(CommandHandler("help", cmd_help))
    app.add_handler(CommandHandler("start", cmd_help))
    app.add_handler(CommandHandler("ping", cmd_ping))
    app.add_handler(CommandHandler("status", cmd_status))
    app.add_handler(CommandHandler("health", cmd_health))
    app.add_handler(CommandHandler("logs", cmd_logs))
    app.add_handler(CommandHandler("rollback", cmd_rollback))
    app.add_handler(CommandHandler("cancel", cmd_cancel))
    app.add_handler(CommandHandler("deploy", cmd_deploy))
    app.add_handler(CallbackQueryHandler(on_confirm))

    logger.info(f"[Deploy Bot] Start. Allowlist: {cfg.allowed_user_ids}")
    app.run_polling(drop_pending_updates=True, allowed_updates=["message", "callback_query"])


if __name__ == "__main__":
    main()
