"""Regression tests for Telegram deploy confirmation and message contracts."""
import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest

from bot import (
    PENDING,
    build_progress_text,
    cmd_deploy,
    on_confirm,
)
from config import Config
from deploy import DeployManager, DeployResult


class FakeMessage:
    def __init__(self, text: str):
        self.text = text
        self.chat_id = 123
        self.message_id = 900
        self.replies: list[tuple[str, dict]] = []

    async def reply_text(self, text: str, **kwargs):
        self.replies.append((text, kwargs))
        return SimpleNamespace(message_id=self.message_id)


class FakeUpdate:
    def __init__(self, text: str, user_id: int = 42, chat_type: str = "private"):
        self.message = FakeMessage(text)
        self.effective_user = SimpleNamespace(id=user_id)
        self.effective_chat = SimpleNamespace(id=123, type=chat_type)
        self.callback_query = None


class FakeQuery:
    def __init__(self, data: str, user_id: int = 42):
        self.data = data
        self.message = SimpleNamespace(chat_id=123)
        self._user_id = user_id
        self.answers: list[tuple[tuple, dict]] = []
        self.edits: list[tuple[tuple, dict]] = []

    async def answer(self, *args, **kwargs):
        self.answers.append((args, kwargs))

    async def edit_message_reply_markup(self, **kwargs):
        self.edits.append(((), kwargs))

    async def edit_message_text(self, *args, **kwargs):
        self.edits.append((args, kwargs))


def context_for(manager, deploy_db_enabled: bool = False) -> SimpleNamespace:
    cfg = Config(
        bot_token="test-token",
        allowed_user_ids=[42],
        require_private_chat=True,
        deploy_db_enabled=deploy_db_enabled,
    )
    return SimpleNamespace(
        application=SimpleNamespace(bot_data={"cfg": cfg, "manager": manager})
    )


@pytest.fixture(autouse=True)
def clear_pending():
    PENDING.clear()
    yield
    PENDING.clear()


@pytest.mark.asyncio
async def test_unknown_deploy_flag_is_rejected_without_creating_confirmation():
    update = FakeUpdate("/deploy --skip-build --not-a-real-flag")
    manager = MagicMock()

    await cmd_deploy(update, context_for(manager))

    assert len(update.message.replies) == 1
    text, kwargs = update.message.replies[0]
    assert "Flag tidak dikenal" in text
    assert "not-a-real-flag" not in PENDING
    assert manager.run.call_count == 0
    assert kwargs["parse_mode"] == "HTML"


@pytest.mark.asyncio
async def test_unknown_flag_is_html_escaped_in_rejection_message():
    update = FakeUpdate("/deploy <b>forged</b>")

    await cmd_deploy(update, context_for(MagicMock()))

    text, _ = update.message.replies[0]
    assert "&lt;b&gt;forged&lt;/b&gt;" in text
    assert "<b>forged</b>" not in text


@pytest.mark.asyncio
async def test_db_flag_rejected_when_deploy_db_enabled_false():
    """--db ditolak (fail-closed) tanpa izin eksplisit DEPLOY_DB_ENABLED=true."""
    update = FakeUpdate("/deploy --db")
    manager = MagicMock()

    await cmd_deploy(update, context_for(manager, deploy_db_enabled=False))

    assert len(update.message.replies) == 1
    text, kwargs = update.message.replies[0]
    assert "--db" in text
    assert "dinonaktifkan" in text
    assert "DEPLOY_DB_ENABLED=true" in text
    assert "/deploy --no-db" in text
    assert kwargs["parse_mode"] == "HTML"
    assert PENDING == {}
    assert manager.run.call_count == 0


@pytest.mark.asyncio
async def test_db_flag_reaches_confirmation_when_deploy_db_enabled_true():
    """--db diteruskan ke konfirmasi hanya bila DEPLOY_DB_ENABLED=true."""
    update = FakeUpdate("/deploy --db")
    manager = MagicMock()
    manager.is_running.return_value = False
    manager.external_lock_active.return_value = False

    await cmd_deploy(update, context_for(manager, deploy_db_enabled=True))

    assert any(
        "Prisma db push: YES" in text for text, _ in update.message.replies
    )
    assert len(PENDING) == 1
    flags = next(iter(PENDING.values()))["flags"]
    assert flags["db_push"] is True
    assert manager.run.call_count == 0  # belum ada konfirmasi


@pytest.mark.asyncio
async def test_no_db_still_works_when_deploy_db_enabled_false():
    """Alur rutin --no-db tidak berubah: tetap membuat konfirmasi."""
    update = FakeUpdate("/deploy --no-db")
    manager = MagicMock()
    manager.is_running.return_value = False
    manager.external_lock_active.return_value = False

    await cmd_deploy(update, context_for(manager, deploy_db_enabled=False))

    assert any(
        "Prisma db push: NO" in text for text, _ in update.message.replies
    )
    assert len(PENDING) == 1


def test_progress_tail_is_html_escaped():
    rendered = build_progress_text(
        {"phase": "deploy", "elapsed_s": 2},
        ["<b>forged</b> & unsafe"],
    )

    assert "&lt;b&gt;forged&lt;/b&gt; &amp; unsafe" in rendered
    assert "<b>forged</b> & unsafe" not in rendered


@pytest.mark.asyncio
async def test_same_callback_replay_and_race_execute_deploy_once():
    manager = MagicMock(spec=DeployManager)
    manager.run = AsyncMock(
        return_value=DeployResult(ok=True, exit_code=0, tail=["[SUCCESS] done"])
    )
    ctx = context_for(manager)
    run_id = "d-replay-test"
    PENDING[run_id] = {
        "chat_id": 123,
        "user_id": 42,
        "expires": 9999999999,
        "flags": {"skip_build": True, "skip_test": False, "no_db": True, "db_push": False, "force": False},
        "message_id": 900,
    }

    first = FakeQuery(f"ok:{run_id}")
    second = FakeQuery(f"ok:{run_id}")
    update_one = FakeUpdate("", user_id=42)
    update_one.message = None
    update_one.callback_query = first
    update_two = FakeUpdate("", user_id=42)
    update_two.message = None
    update_two.callback_query = second

    await asyncio.gather(on_confirm(update_one, ctx), on_confirm(update_two, ctx))

    manager.run.assert_awaited_once()
    assert run_id not in PENDING
    assert any("kadaluarsa" in args[0] for args, _ in second.answers)


@pytest.mark.asyncio
async def test_callback_from_different_user_cannot_consume_confirmation():
    manager = MagicMock(spec=DeployManager)
    manager.run = AsyncMock()
    ctx = context_for(manager)
    run_id = "d-owner-test"
    PENDING[run_id] = {
        "chat_id": 123,
        "user_id": 42,
        "expires": 9999999999,
        "flags": {},
        "message_id": 900,
    }

    query = FakeQuery(f"ok:{run_id}", user_id=99)
    update = FakeUpdate("", user_id=99)
    update.message = None
    update.callback_query = query

    await on_confirm(update, ctx)

    manager.run.assert_not_awaited()
    assert run_id in PENDING
    assert any("Unauthorized" in args[0] for args, _ in query.answers)
