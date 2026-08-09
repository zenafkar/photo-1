"""Manajer proses deploy dengan lock lintas proses milik deploy script."""
import asyncio
import logging
import os
import queue
import re
import signal
import subprocess
import threading
import time
from dataclasses import dataclass, field
from pathlib import Path

from config import Config, LOG_DIR, LOCK_FILE

PHASE_RE = re.compile(r"^\[PHASE\]\s+(\S+)")
FAILED_RE = re.compile(r"^\[FAILED\]\s*(.*)$")
SUCCESS_RE = re.compile(r"^\[SUCCESS\]\s*(.*)$")

MAX_DEPLOY_SECONDS = 30 * 60
PROCESS_CLEANUP_SECONDS = 10
logger = logging.getLogger("deploy-bot.deploy")


@dataclass
class DeployResult:
    ok: bool
    exit_code: int
    tail: list[str] = field(default_factory=list)
    last_phase: str = ""
    error: str = ""
    timed_out: bool = False


class DeployManager:
    """Menjalankan satu deploy pada satu waktu.

    ``scripts/deploy.sh`` adalah satu-satunya pemilik lock lintas proses. Bot
    hanya mengamati lock tersebut dan memakai asyncio.Lock untuk mencegah dua
    permintaan Telegram berjalan bersamaan. Dengan begitu proses dari bot tidak
    mengambil lock lebih dulu lalu membuat script gagal mengunci dirinya
    sendiri.
    """

    def __init__(self, cfg: Config):
        self.cfg = cfg
        self._running = False
        self._last_phase = ""
        self._started_at = 0.0
        self._finished_at = 0.0
        self._state = "idle"
        self._last_result: DeployResult | None = None
        self._ring: list[str] = []
        self._run_lock = asyncio.Lock()
        self._log_dir = cfg.log_dir or LOG_DIR
        self._lock_file = cfg.lock_path or LOCK_FILE

    @staticmethod
    def _lock_pid_for(lock_file: Path) -> int | None:
        try:
            if lock_file.exists():
                pid_file = lock_file / "pid" if lock_file.is_dir() else lock_file
                raw = pid_file.read_text(encoding="utf-8").strip()
                if raw.isdigit():
                    return int(raw)
        except OSError:
            pass
        return None

    @staticmethod
    def _lock_pid() -> int | None:
        """Read the default lock path; retained for status/test compatibility."""
        return DeployManager._lock_pid_for(LOCK_FILE)

    @staticmethod
    def _pid_alive(pid: int) -> bool:
        try:
            if os.name == "nt":
                import ctypes
                import ctypes.wintypes

                PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
                h = ctypes.windll.kernel32.OpenProcess(
                    PROCESS_QUERY_LIMITED_INFORMATION, False, pid
                )
                if not h:
                    return False
                exit_code = ctypes.wintypes.DWORD()
                alive = bool(
                    ctypes.windll.kernel32.GetExitCodeProcess(h, ctypes.byref(exit_code))
                    and exit_code.value == 259
                )
                ctypes.windll.kernel32.CloseHandle(h)
                return alive
            os.kill(pid, 0)
            return True
        except OSError:
            return False

    def acquire_lock(self, force: bool = False) -> bool:
        """Compatibility helper: report whether the external lock is free.

        This method deliberately does not create, remove, or take over a lock.
        A check is not a reservation; ``run`` uses ``_run_lock`` and the shell
        script performs the atomic cross-process acquisition.
        """
        return not self.external_lock_active()

    @staticmethod
    def release_lock() -> None:
        """No-op kept for callers from the previous Python-owned lock API."""

    @staticmethod
    def _is_locked_for(lock_file: Path) -> bool:
        pid = DeployManager._lock_pid_for(lock_file)
        if pid is None:
            return lock_file.exists()
        return DeployManager._pid_alive(pid)

    def is_locked(self=None) -> bool:
        """Observe this manager's configured lock (or the default on class call)."""
        lock_file = self._lock_file if isinstance(self, DeployManager) else LOCK_FILE
        return DeployManager._is_locked_for(lock_file)

    def external_lock_active(self) -> bool:
        """Observe the lock path loaded from this manager's configuration."""
        return self.is_locked()

    def is_running(self) -> bool:
        return self._running

    def status(self) -> dict:
        if self._running:
            elapsed = round(time.time() - self._started_at, 1)
        elif self._finished_at and self._started_at:
            elapsed = round(self._finished_at - self._started_at, 1)
        else:
            elapsed = 0

        last_result = None
        if self._last_result is not None:
            last_result = {
                "ok": self._last_result.ok,
                "exit_code": self._last_result.exit_code,
                "last_phase": self._last_result.last_phase,
                "error": self._last_result.error,
                "timed_out": self._last_result.timed_out,
            }
        return {
            "running": self._running,
            "phase": self._last_phase,
            "elapsed_s": elapsed,
            "state": self._state,
            "last_result": last_result,
        }

    async def run(self, skip_build: bool = False, skip_test: bool = False,
                  no_db: bool = False, db_push: bool = False,
                  force: bool = False, progress_cb=None,
                  rollback: bool = False, error_cb=None) -> DeployResult:
        # Do not wait behind another Telegram request. The shell lock remains
        # the authority for manual deploys and other bot processes.
        if self._running or self._run_lock.locked():
            raise RuntimeError("Deploy sudah berjalan.")
        await self._run_lock.acquire()

        try:
            if self.external_lock_active():
                raise RuntimeError("Ada deploy lain yang sedang berjalan (lock aktif).")

            self._running = True
            self._state = "running"
            self._last_phase = "starting"
            self._started_at = time.time()
            self._finished_at = 0.0
            self._last_result = None
            self._ring.clear()

            loop = asyncio.get_running_loop()
            cancel_event = threading.Event()
            worker = asyncio.create_task(asyncio.to_thread(
                self._run_sync, skip_build, skip_test, no_db, db_push, progress_cb, loop,
                rollback, force, error_cb, cancel_event
            ))
            try:
                result = await asyncio.shield(worker)
            except asyncio.CancelledError:
                # Keep the in-process guard until the worker has killed its
                # process group; otherwise a cancelled deploy could overlap a
                # new Telegram deploy.
                cancel_event.set()
                await asyncio.shield(worker)
                raise
            self._last_result = result
            self._state = "succeeded" if result.ok else "failed"
            return result
        except RuntimeError as exc:
            if error_cb is not None:
                await self._invoke_async_callback(error_cb, str(exc))
            self._state = "blocked"
            raise
        except Exception as exc:
            # Keep the public result and status deterministic even when an
            # unexpected Python/subprocess error escapes the worker thread.
            message = f"Deploy error: {exc}"
            result = DeployResult(
                ok=False,
                exit_code=-1,
                tail=list(self._ring),
                last_phase=self._last_phase,
                error=message,
            )
            self._last_result = result
            self._state = "failed"
            self._append(f"[FAILED] {message}")
            if error_cb is not None:
                await self._invoke_async_callback(error_cb, message)
            return result
        finally:
            self._running = False
            if self._started_at:
                self._finished_at = time.time()
            self._run_lock.release()

    def _run_sync(self, skip_build: bool, skip_test: bool,
                  no_db: bool, db_push: bool, progress_cb, loop,
                  rollback: bool = False, force: bool = False,
                  error_cb=None, cancel_event: threading.Event | None = None) -> DeployResult:
        script = str(self.cfg.deploy_script)
        self._log_dir.mkdir(parents=True, exist_ok=True)
        log_path = self._log_dir / f"deploy-{time.strftime('%Y%m%d-%H%M%S')}-{time.time_ns()}.log"

        if script.lower().endswith(".ps1"):
            args = ["powershell", "-ExecutionPolicy", "Bypass", "-File", script]
            if skip_build:
                args.append("-SkipBuild")
            if skip_test:
                args.append("-SkipTest")
            if no_db:
                args.append("-NoDb")
            elif db_push:
                args.append("-DbPush")
            if force:
                args.append("-Force")
            args += ["-LogFile", str(log_path)]
        else:
            args = ["bash", script]
            if rollback:
                args.append("--rollback")
            elif skip_build:
                args.append("--skip-build")
            if not rollback and skip_test:
                args.append("--skip-test")
            if not rollback and no_db:
                args.append("--no-db")
            elif not rollback and db_push:
                args.append("--db")
            if force:
                args.append("--force")
            args += ["--log-file", str(log_path)]

        if rollback and script.lower().endswith(".ps1"):
            args = ["powershell", "-ExecutionPolicy", "Bypass", "-File", script,
                    "-Rollback", "-LogFile", str(log_path)]

        result = DeployResult(ok=False, exit_code=-1)
        error_reported = False

        def report_error(message: str) -> None:
            nonlocal error_reported
            error_reported = True
            result.error = message
            self._append(f"[FAILED] {message}")
            self._schedule_callback(error_cb, message, loop=loop)

        popen_kwargs: dict = dict(
            cwd=str(self.cfg.repo_dir),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
        if os.name == "nt":
            popen_kwargs["creationflags"] = 0x08000000 | subprocess.CREATE_NEW_PROCESS_GROUP
        else:
            popen_kwargs["start_new_session"] = True

        try:
            proc = subprocess.Popen(args, **popen_kwargs)
        except (FileNotFoundError, OSError) as e:
            report_error(f"Tidak bisa menjalankan deploy script: {e}")
            result.tail = list(self._ring)
            result.last_phase = self._last_phase
            return result

        assert proc.stdout is not None
        last_push = 0.0
        start_time = time.time()
        timed_out = False
        timeout_seconds = self.cfg.deploy_timeout_seconds or MAX_DEPLOY_SECONDS

        lines: queue.Queue[str | None] = queue.Queue()

        def read_output() -> None:
            try:
                for output_line in proc.stdout or ():
                    lines.put(output_line.rstrip("\r\n"))
            finally:
                lines.put(None)

        reader = threading.Thread(target=read_output, daemon=True)
        reader.start()

        deadline = start_time + timeout_seconds
        while True:
            if cancel_event is not None and cancel_event.is_set():
                self._terminate_process_tree(proc)
                report_error("Deploy dibatalkan dan process tree dihentikan")
                break
            remaining = deadline - time.time()
            if remaining <= 0:
                self._terminate_process_tree(proc)
                report_error(f"Deploy timed out after {timeout_seconds}s")
                result.timed_out = True
                timed_out = True
                break

            try:
                line = lines.get(timeout=min(1.0, remaining))
            except queue.Empty:
                if proc.poll() is not None:
                    break
                continue

            if line is None:
                break
            self._append(line)
            self._update_phase(line)
            now = time.time()
            if progress_cb and (now - last_push >= 1.0 or SUCCESS_RE.match(line) or FAILED_RE.match(line)):
                last_push = now
                status = dict(self.status())
                tail = list(self._ring)
                try:
                    self._schedule_callback(progress_cb, status, tail, loop=loop)
                except Exception as exc:
                    logger.warning("Progress callback could not be scheduled: %s", exc)

        if not timed_out:
            try:
                remaining = max(0.0, deadline - time.time())
                exit_code = proc.wait(timeout=remaining)
            except subprocess.TimeoutExpired:
                self._terminate_process_tree(proc)
                exit_code = -1
                report_error("Deploy process hung after completion, killed")
            except OSError as exc:
                self._terminate_process_tree(proc)
                exit_code = -1
                report_error(f"Tidak bisa menunggu deploy process: {exc}")
        else:
            exit_code = -1

        # A child can keep stdout open after the shell exits. Do not leave the
        # reader thread or pipe behind, but also do not block shutdown forever.
        reader.join(timeout=PROCESS_CLEANUP_SECONDS)
        if reader.is_alive():
            self._terminate_process_tree(proc)
            reader.join(timeout=1)

        if proc.stdout is not None:
            try:
                close = getattr(proc.stdout, "close", None)
                if close is not None:
                    close()
            except OSError:
                pass

        result.exit_code = exit_code

        if exit_code == 0:
            result.ok = True
            self._append(f"[INFO] Proses selesai dengan exit code 0. Log: {log_path.name}")
        else:
            if not result.error:
                result.error = f"Deploy gagal (exit code {exit_code})"
            if not error_reported:
                self._schedule_callback(error_cb, result.error, loop=loop)
            self._append(f"[FAILED] {result.error}. Log: {log_path.name}")
        result.last_phase = self._last_phase
        result.tail = list(self._ring)
        return result

    @staticmethod
    def _terminate_process_tree(proc: subprocess.Popen) -> None:
        try:
            if os.name == "nt":
                subprocess.run(
                    ["taskkill", "/T", "/F", "/PID", str(proc.pid)],
                    capture_output=True,
                    timeout=PROCESS_CLEANUP_SECONDS,
                )
            else:
                os.killpg(proc.pid, signal.SIGTERM)
                try:
                    proc.wait(timeout=PROCESS_CLEANUP_SECONDS)
                except subprocess.TimeoutExpired:
                    pass
                # SIGTERM can let a child escape after its shell parent exits;
                # make the process-group cleanup deterministic.
                try:
                    os.killpg(proc.pid, signal.SIGKILL)
                except OSError:
                    pass
                try:
                    proc.wait(timeout=PROCESS_CLEANUP_SECONDS)
                except subprocess.TimeoutExpired:
                    pass
        except (OSError, subprocess.TimeoutExpired):
            try:
                proc.kill()
            except OSError:
                pass

    @staticmethod
    async def _invoke_async_callback(callback, *args) -> None:
        try:
            value = callback(*args)
            if hasattr(value, "__await__"):
                await value
        except Exception as exc:
            logger.warning("Deploy callback failed: %s", exc)

    @staticmethod
    def _schedule_callback(callback, *args, loop=None) -> None:
        if callback is None:
            return
        if loop is None or not loop.is_running():
            logger.warning("Deploy callback skipped because event loop is unavailable")
            return
        coroutine = DeployManager._invoke_async_callback(callback, *args)
        try:
            future = asyncio.run_coroutine_threadsafe(coroutine, loop)
        except RuntimeError:
            coroutine.close()
            logger.warning("Deploy callback skipped because event loop stopped")
            return
        # Consume the future so callback exceptions never become unobserved.
        def consume_callback_error(completed) -> None:
            try:
                completed.result()
            except Exception as exc:
                logger.warning("Deploy callback future failed: %s", exc)

        future.add_done_callback(consume_callback_error)

    def _append(self, line: str) -> None:
        self._ring.append(line)
        if len(self._ring) > 200:
            self._ring.pop(0)

    def _update_phase(self, line: str) -> None:
        m = PHASE_RE.match(line)
        if m:
            self._last_phase = m.group(1)
