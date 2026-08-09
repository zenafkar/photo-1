"""Tests for deploy-bot lock file management and deploy logic."""
import asyncio
import os
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from unittest.mock import patch, MagicMock

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import deploy as deploy_module
from deploy import DeployManager
from config import Config


def _to_posix(path: Path) -> str:
    """Konversi path ke bentuk POSIX agar bisa dipakai Git Bash/msys di Windows."""
    s = str(path.resolve()).replace("\\", "/")
    drive, rest = os.path.splitdrive(s)
    if drive:
        return "/" + drive.rstrip(":").lower() + rest
    return s


@pytest.fixture
def temp_dir():
    d = tempfile.mkdtemp()
    yield Path(d)
    import shutil
    shutil.rmtree(d, ignore_errors=True)


@pytest.fixture
def lock_file(temp_dir):
    return temp_dir / "deploy.lock"


@pytest.fixture
def log_dir(temp_dir):
    d = temp_dir / "logs"
    d.mkdir()
    return d


@pytest.fixture
def cfg(temp_dir, lock_file, log_dir):
    return Config(
        bot_token="test-token",
        allowed_user_ids=[12345],
        vps_ip="127.0.0.1",
        vps_user="test",
        vps_target_dir="/tmp/test-deploy",
        repo_dir=temp_dir,
        deploy_script=temp_dir / "deploy.sh",
    )


class TestLockPid:
    def test_returns_none_when_no_lock_file(self, lock_file):
        with patch.object(deploy_module, "LOCK_FILE", lock_file):
            assert DeployManager._lock_pid() is None

    def test_returns_pid_from_file(self, lock_file):
        lock_file.write_text("12345")
        with patch.object(deploy_module, "LOCK_FILE", lock_file):
            assert DeployManager._lock_pid() == 12345

    def test_returns_none_for_non_numeric_content(self, lock_file):
        lock_file.write_text("not-a-pid")
        with patch.object(deploy_module, "LOCK_FILE", lock_file):
            assert DeployManager._lock_pid() is None

    def test_returns_none_for_empty_file(self, lock_file):
        lock_file.write_text("")
        with patch.object(deploy_module, "LOCK_FILE", lock_file):
            assert DeployManager._lock_pid() is None


class TestPidAlive:
    def test_current_process_is_alive(self):
        assert DeployManager._pid_alive(os.getpid()) is True

    def test_nonexistent_pid_is_dead(self):
        assert DeployManager._pid_alive(999999) is False


class TestAcquireLock:
    def test_acquire_when_no_lock(self, cfg, lock_file):
        with patch.object(deploy_module, "LOCK_FILE", lock_file):
            mgr = DeployManager(cfg)
            assert mgr.acquire_lock() is True
            assert not lock_file.exists()

    def test_acquire_when_stale_pid(self, cfg, lock_file):
        lock_file.parent.mkdir(parents=True, exist_ok=True)
        lock_file.write_text("999999")
        with patch.object(deploy_module, "LOCK_FILE", lock_file):
            mgr = DeployManager(cfg)
            assert mgr.acquire_lock() is True
            assert lock_file.exists()

    def test_acquire_fails_when_live_pid_holds_lock(self, cfg, lock_file):
        lock_file.parent.mkdir(parents=True, exist_ok=True)
        lock_file.write_text(str(os.getpid()))
        with patch.object(deploy_module, "LOCK_FILE", lock_file):
            mgr = DeployManager(cfg)
            assert mgr.acquire_lock() is False

    def test_force_does_not_override_live_lock(self, cfg, lock_file):
        lock_file.parent.mkdir(parents=True, exist_ok=True)
        lock_file.write_text(str(os.getpid()))
        with patch.object(deploy_module, "LOCK_FILE", lock_file):
            mgr = DeployManager(cfg)
            assert mgr.acquire_lock(force=True) is False

    def test_acquire_is_observation_only(self, cfg, lock_file):
        """Python never creates a lock owned by scripts/deploy.sh."""
        managers = [DeployManager(cfg), DeployManager(cfg)]
        with patch.object(deploy_module, "LOCK_FILE", lock_file):
            assert managers[0].acquire_lock() is True
            assert managers[1].acquire_lock() is True
            assert not lock_file.exists()

    def test_unreadable_lock_fails_closed(self, cfg, lock_file):
        lock_file.parent.mkdir(parents=True, exist_ok=True)
        lock_file.write_text("not-a-pid")
        with patch.object(deploy_module, "LOCK_FILE", lock_file):
            assert DeployManager(cfg).acquire_lock(force=True) is False


class TestReleaseLock:
    def test_release_never_removes_external_lock(self, cfg, lock_file):
        with patch.object(deploy_module, "LOCK_FILE", lock_file):
            mgr = DeployManager(cfg)
            lock_file.write_text(str(os.getpid()))
            mgr.release_lock()
            assert lock_file.exists()

    def test_release_does_not_remove_other_pid_lock(self, cfg, lock_file):
        lock_file.parent.mkdir(parents=True, exist_ok=True)
        lock_file.write_text("999999")
        with patch.object(deploy_module, "LOCK_FILE", lock_file):
            DeployManager.release_lock()
            assert lock_file.exists()

    def test_release_missing_file_is_noop(self, lock_file):
        with patch.object(deploy_module, "LOCK_FILE", lock_file):
            DeployManager.release_lock()


class TestIsLocked:
    def test_not_locked_when_no_file(self, lock_file):
        with patch.object(deploy_module, "LOCK_FILE", lock_file):
            assert DeployManager.is_locked() is False

    def test_locked_when_alive_pid(self, lock_file):
        lock_file.parent.mkdir(parents=True, exist_ok=True)
        lock_file.write_text(str(os.getpid()))
        with patch.object(deploy_module, "LOCK_FILE", lock_file):
            assert DeployManager.is_locked() is True

    def test_not_locked_when_dead_pid(self, lock_file):
        lock_file.parent.mkdir(parents=True, exist_ok=True)
        lock_file.write_text("999999")
        with patch.object(deploy_module, "LOCK_FILE", lock_file):
            assert DeployManager.is_locked() is False


class TestDeployManagerStatus:
    def test_initial_status(self, cfg):
        mgr = DeployManager(cfg)
        st = mgr.status()
        assert st["running"] is False
        assert st["phase"] == ""
        assert st["elapsed_s"] == 0

    def test_is_running_initially_false(self, cfg):
        mgr = DeployManager(cfg)
        assert mgr.is_running() is False


class TestRingBuffer:
    def test_append_stores_lines(self, cfg):
        mgr = DeployManager(cfg)
        mgr._append("line 1")
        mgr._append("line 2")
        assert mgr._ring == ["line 1", "line 2"]

    def test_ring_buffer_caps_at_200(self, cfg):
        mgr = DeployManager(cfg)
        for i in range(250):
            mgr._append(f"line {i}")
        assert len(mgr._ring) == 200
        assert mgr._ring[0] == "line 50"

    def test_update_phase_from_marker(self, cfg):
        mgr = DeployManager(cfg)
        mgr._update_phase("[PHASE] frontend-build")
        assert mgr._last_phase == "frontend-build"

    def test_update_phase_ignores_non_marker(self, cfg):
        mgr = DeployManager(cfg)
        mgr._last_phase = "existing"
        mgr._update_phase("some random log line")
        assert mgr._last_phase == "existing"


class TestDeployRun:
    def test_run_does_not_create_python_owned_lock(self, cfg, lock_file):
        fake_proc = MagicMock()
        fake_proc.stdout = []
        fake_proc.wait.return_value = 0
        with patch.object(deploy_module, "LOCK_FILE", lock_file), \
             patch("deploy.subprocess.Popen", return_value=fake_proc):
            result = asyncio.run(DeployManager(cfg).run())

        assert result.ok is True
        assert not lock_file.exists()

    def test_error_callback_and_status_are_deterministic(self, cfg):
        fake_proc = MagicMock()
        fake_proc.stdout = []
        fake_proc.wait.return_value = 17
        errors = []

        async def on_error(message):
            errors.append(message)

        manager = DeployManager(cfg)

        async def run_once():
            result = await manager.run(error_cb=on_error)
            await asyncio.sleep(0)
            return result

        with patch("deploy.subprocess.Popen", return_value=fake_proc):
            result = asyncio.run(run_once())

        assert result.ok is False
        assert result.exit_code == 17
        assert result.error == "Deploy gagal (exit code 17)"
        assert errors == ["Deploy gagal (exit code 17)"]
        assert manager.status()["state"] == "failed"
        assert manager.status()["last_result"]["exit_code"] == 17

    def test_run_raises_when_already_running(self, cfg):
        mgr = DeployManager(cfg)
        mgr._running = True
        with pytest.raises(RuntimeError, match="sudah berjalan"):
            asyncio.run(mgr.run())

    def test_force_does_not_bypass_in_process_guard(self, cfg):
        mgr = DeployManager(cfg)
        mgr._running = True
        with pytest.raises(RuntimeError, match="sudah berjalan"):
            asyncio.run(mgr.run(force=True))

    def test_run_raises_when_lock_taken(self, cfg, lock_file):
        lock_file.parent.mkdir(parents=True, exist_ok=True)
        lock_file.write_text(str(os.getpid()))
        with patch.object(deploy_module, "LOCK_FILE", lock_file):
            mgr = DeployManager(cfg)
            with pytest.raises(RuntimeError, match="lock aktif"):
                asyncio.run(mgr.run())


class TestRunSyncArgv:
    """Verify argv passed to deploy.sh is correct for all flag combinations."""

    def _capture_args(self, cfg, **flags):
        mgr = DeployManager(cfg)
        captured = {}

        fake_proc = MagicMock()
        fake_proc.stdout = []
        fake_proc.wait.return_value = 0

        with patch("deploy.subprocess.Popen") as mock_popen:
            mock_popen.return_value = fake_proc
            result = mgr._run_sync(
                flags.get("skip_build", False),
                flags.get("skip_test", False),
                flags.get("no_db", False),
                flags.get("db_push", False),
                None,
                asyncio.new_event_loop(),
                flags.get("rollback", False),
                flags.get("force", False),
            )
            captured["args"] = mock_popen.call_args.args[0]

        assert result.ok
        return captured["args"]

    def test_default_no_flags(self, cfg):
        args = self._capture_args(cfg)
        assert args[0] == "bash"
        assert args[1] == str(cfg.deploy_script)
        assert "--db" not in args
        assert "--no-db" not in args
        assert "--skip-build" not in args
        assert "--log-file" in args

    def test_db_push_flag(self, cfg):
        args = self._capture_args(cfg, db_push=True)
        assert "--db" in args
        assert "--no-db" not in args

    def test_no_db_flag(self, cfg):
        args = self._capture_args(cfg, no_db=True)
        assert "--no-db" in args
        assert "--db" not in args

    def test_db_and_no_db_cannot_both_append(self, cfg):
        args = self._capture_args(cfg, db_push=True, no_db=True)
        assert not ("--db" in args and "--no-db" in args)

    def test_skip_build_flag(self, cfg):
        args = self._capture_args(cfg, skip_build=True)
        assert "--skip-build" in args

    def test_skip_test_flag(self, cfg):
        args = self._capture_args(cfg, skip_test=True)
        assert "--skip-test" in args

    def test_no_db_wins_when_both_values_are_true(self, cfg):
        args = self._capture_args(cfg, db_push=True, no_db=True)
        assert "--no-db" in args
        assert "--db" not in args

    def test_log_file_is_separate_arg(self, cfg):
        args = self._capture_args(cfg, db_push=True)
        idx = args.index("--log-file")
        assert len(args) > idx + 1
        assert args[idx + 1].endswith(".log")

    def test_force_flag_is_forwarded_to_bash(self, cfg):
        args = self._capture_args(cfg, force=True)
        assert "--force" in args

    def test_rollback_flag_is_forwarded_to_bash(self, cfg):
        args = self._capture_args(cfg, rollback=True)
        assert "--rollback" in args

    def test_rollback_does_not_forward_deploy_only_flags(self, cfg):
        args = self._capture_args(
            cfg,
            rollback=True,
            skip_build=True,
            skip_test=True,
            no_db=True,
            db_push=True,
        )
        assert args[:2] == ["bash", str(cfg.deploy_script)]
        assert "--rollback" in args
        assert "--skip-build" not in args
        assert "--skip-test" not in args
        assert "--no-db" not in args
        assert "--db" not in args


class TestTimeoutAndProcessTree:
    def test_silent_subprocess_timeout_is_not_reported_as_success(self, cfg):
        """A child that emits no output must still be killed at the deadline."""
        proc = MagicMock()
        proc.pid = 4242
        proc.poll.return_value = None
        proc.stdout = []

        mgr = DeployManager(cfg)
        with patch("deploy.subprocess.Popen", return_value=proc), \
             patch.object(mgr, "_terminate_process_tree") as terminate, \
             patch.object(deploy_module, "MAX_DEPLOY_SECONDS", 0.05), \
             patch.object(deploy_module.time, "time", side_effect=[100.0, 100.2]):
            result = mgr._run_sync(
                False, False, False, False, None, asyncio.new_event_loop()
            )

        terminate.assert_called_once_with(proc)
        assert result.ok is False
        assert result.exit_code == -1
        assert any("timed out" in line for line in result.tail)

    def test_windows_cleanup_kills_process_tree_not_only_parent(self, cfg):
        proc = MagicMock()
        proc.pid = 4242
        proc.poll.return_value = None

        with patch.object(deploy_module.os, "name", "nt"), \
             patch("deploy.subprocess.run") as run:
            DeployManager._terminate_process_tree(proc)

        run.assert_called_once_with(
            ["taskkill", "/T", "/F", "/PID", "4242"],
            capture_output=True,
            timeout=10,
        )


def _find_bash() -> str | None:
    """Lokasi bash (Git Bash fallback untuk Windows) atau None."""
    p = shutil.which("bash")
    if p:
        return p
    for cand in (
        r"C:\Program Files\Git\bin\bash.exe",
        r"C:\Program Files (x86)\Git\bin\bash.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Programs\Git\bin\bash.exe"),
    ):
        if os.path.exists(cand):
            return cand
    return None


class TestDeployShDbGuardrail:
    """Guardrail fail-closed F3 di scripts/deploy.sh (diuji end-to-end via bash)."""

    def _run_deploy_sh(self, tmp, *args, env_extra=None, timeout=90):
        bash = _find_bash()
        if bash is None:
            pytest.skip("bash tidak tersedia; deploy.sh tidak dapat dijalankan")

        repo = Path(__file__).resolve().parent.parent.parent
        script = repo / "scripts" / "deploy.sh"
        target = Path(tmp) / "target"
        target.mkdir(parents=True, exist_ok=True)

        env = os.environ.copy()
        env.update(
            {
                "TARGET_DIR": _to_posix(target),
                "DEPLOY_LOCK_PATH": _to_posix(Path(tmp) / "lock" / "deploy.lock"),
                "DEPLOY_LOG_DIR": _to_posix(Path(tmp) / "logs"),
                "DEPLOY_BACKUP_DIR": _to_posix(Path(tmp) / "backups"),
                "DEPLOY_DATABASE_BACKUP_DIR": _to_posix(Path(tmp) / "db-backups"),
                "PM2_BIN": "/usr/bin/true",
                "DEPLOY_HEALTH_RETRIES": "6",
                "DEPLOY_HEALTH_INTERVAL": "5",
            }
        )
        env.pop("DEPLOY_DB_ENABLED", None)
        if env_extra:
            env.update(env_extra)

        proc = subprocess.run(
            [bash, _to_posix(script), *args],
            env=env,
            capture_output=True,
            text=True,
            timeout=timeout,
            cwd=str(tmp),
        )
        return proc.returncode, (proc.stdout or "") + (proc.stderr or "")

    def test_db_blocked_without_deploy_db_enabled(self, temp_dir):
        """(a) deploy.sh --db tanpa DEPLOY_DB_ENABLED => blocked (exit 26)."""
        code, out = self._run_deploy_sh(temp_dir, "--db")
        assert code == 26
        assert "diblokir" in out
        assert "DEPLOY_DB_ENABLED=true" in out

    def test_db_allowed_when_deploy_db_enabled_true(self, temp_dir):
        """(b) deploy.sh --db dengan DEPLOY_DB_ENABLED=true => gate lolos."""
        code, out = self._run_deploy_sh(
            temp_dir, "--db", env_extra={"DEPLOY_DB_ENABLED": "true"}
        )
        assert code != 26
        assert "diblokir" not in out

    def test_no_db_wins_even_with_deploy_db_enabled_true(self, temp_dir):
        """(c) --no-db menang walau env true; gate tidak memblokir, db_push=false."""
        code, out = self._run_deploy_sh(
            temp_dir,
            "--db",
            "--no-db",
            env_extra={"DEPLOY_DB_ENABLED": "true"},
        )
        assert "db_push=false" in out
        assert "diblokir" not in out
        assert code != 26

    def test_rollback_does_not_touch_database(self, temp_dir):
        """(d) --rollback tidak menyentuh DB dan tidak terkena gate --db."""
        code, out = self._run_deploy_sh(temp_dir, "--rollback", "--db")
        assert code != 26
        assert "diblokir" not in out
        assert "[PHASE] database" not in out
