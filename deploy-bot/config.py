"""Konfigurasi untuk Deploy Bot Telegram ZenDev.

Semua nilai dibaca dari file `.env` (di folder yang sama, TIDAK di-commit).
Saat token/chat-id kosong, bot menolak untuk start (fail-close).
"""
import os
from dataclasses import dataclass, field
from pathlib import Path

import dotenv

BOT_DIR = Path(__file__).resolve().parent
REPO_DIR = BOT_DIR.parent

if os.name == "nt":
    LOCALAPPDATA = Path(os.environ.get("LOCALAPPDATA", REPO_DIR))
    RUN_DIR = LOCALAPPDATA / "zen-deploy"
else:
    RUN_DIR = Path(os.environ.get("XDG_STATE_HOME", str(Path.home() / ".local" / "state")))
    RUN_DIR = Path(RUN_DIR) / "zen-deploy"

LOG_DIR = Path(os.getenv("DEPLOY_LOG_DIR", str(RUN_DIR / "logs")))
# This path is observed by Python and acquired by scripts/deploy.sh. Python
# must never create, remove, or replace it; keeping one owner avoids a
# self-lock when the bot launches the script.
DEFAULT_LOCK_FILE = (
    RUN_DIR / "deploy.lock"
    if os.name == "nt"
    else Path("/var/run/zen-deploy/deploy.lock")
)
LOCK_FILE = Path(os.getenv("DEPLOY_LOCK_PATH", str(DEFAULT_LOCK_FILE)))

DEFAULT_KNOWN_HOSTS_FILE = Path(
    os.getenv("SSH_KNOWN_HOSTS_FILE", str(Path.home() / ".ssh" / "known_hosts"))
)
DEFAULT_SSH_OPTIONS = (
    "-o BatchMode=yes -o ConnectTimeout=15 -o StrictHostKeyChecking=yes"
)


@dataclass
class Config:
    bot_token: str
    allowed_user_ids: list[int] = field(default_factory=list)
    vps_ip: str = "160.19.166.129"
    vps_user: str = "zen-deploy"
    vps_target_dir: str = "/var/www/zen-dev"
    repo_dir: Path = REPO_DIR
    deploy_script: Path = REPO_DIR / "scripts" / "deploy.sh"
    require_private_chat: bool = True
    vps_local: bool = False
    # Guardrail F3 (fail-closed): --db/prisma db push hanya boleh dijalankan
    # bila operator mengeksplisitkan DEPLOY_DB_ENABLED=true di .env.
    deploy_db_enabled: bool = False
    deploy_timeout_seconds: int | None = None
    log_dir: Path | None = None
    lock_path: Path | None = None
    ssh_known_hosts_file: Path = DEFAULT_KNOWN_HOSTS_FILE


def load_config() -> Config:
    env_path = BOT_DIR / ".env"
    dotenv.load_dotenv(env_path)

    token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    if not token:
        raise SystemExit(
            "MISSING CONFIG: TELEGRAM_BOT_TOKEN kosong. "
            "Salin .env.example ke .env dan isi nilainya."
        )

    raw_ids = os.getenv("ALLOWED_USER_IDS", "").strip()
    user_ids: list[int] = []
    if raw_ids:
        for part in raw_ids.split(","):
            part = part.strip()
            if part.isdigit():
                user_ids.append(int(part))
    if not user_ids:
        raise SystemExit(
            "MISSING CONFIG: ALLOWED_USER_IDS kosong. "
            "Isi dengan Telegram user ID Anda (dipisah koma)."
        )

    # Repo & deploy script: default = parent of bot dir (local). Di VPS, override
    # lewat .env (REPO_DIR=/var/www/zen-dev) karena bot dir berada di /opt.
    repo_dir = Path(os.getenv("REPO_DIR", str(REPO_DIR)))
    default_script = "deploy.ps1" if os.name == "nt" else "deploy.sh"
    deploy_script = Path(
        os.getenv("DEPLOY_SCRIPT", str(repo_dir / "scripts" / default_script))
    )
    raw_timeout = os.getenv("DEPLOY_TIMEOUT_SECONDS", "").strip()
    deploy_timeout_seconds: int | None = None
    if raw_timeout:
        try:
            deploy_timeout_seconds = max(1, int(raw_timeout))
        except ValueError:
            raise SystemExit("INVALID CONFIG: DEPLOY_TIMEOUT_SECONDS harus berupa angka positif.")

    return Config(
        bot_token=token,
        allowed_user_ids=user_ids,
        vps_ip=os.getenv("VPS_IP", "160.19.166.129").strip() or "160.19.166.129",
        vps_user=os.getenv("VPS_USER", "zen-deploy").strip() or "zen-deploy",
        vps_target_dir=os.getenv("VPS_TARGET_DIR", "/var/www/zen-dev").strip()
        or "/var/www/zen-dev",
        repo_dir=repo_dir,
        deploy_script=deploy_script,
        vps_local=os.getenv("VPS_LOCAL", "false").strip().lower() in {"1", "true", "yes"},
        deploy_db_enabled=os.getenv("DEPLOY_DB_ENABLED", "false").strip().lower()
        in {"1", "true", "yes"},
        deploy_timeout_seconds=deploy_timeout_seconds,
        log_dir=Path(os.getenv("DEPLOY_LOG_DIR", str(RUN_DIR / "logs"))),
        lock_path=Path(os.getenv("DEPLOY_LOCK_PATH", str(DEFAULT_LOCK_FILE))),
        ssh_known_hosts_file=Path(
            os.getenv("SSH_KNOWN_HOSTS_FILE", str(DEFAULT_KNOWN_HOSTS_FILE))
        ),
    )
