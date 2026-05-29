from __future__ import annotations

import ctypes
import os
import re
import signal
import socket
import subprocess
import sys
import threading
import time
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable

from codex_session_delete import cdp
from codex_session_delete.app_paths import resolve_codex_app_dir
from codex_session_delete.api_adapter import ApiAdapter, UnavailableApiAdapter
from codex_session_delete.backup_store import BackupStore
from codex_session_delete.cdp import inject_file
from codex_session_delete.helper_server import HelperServer
from codex_session_delete.markdown_exporter import MarkdownExportService, default_export_directory
from codex_session_delete.models import DeleteResult, DeleteStatus, SessionRef
from codex_session_delete.provider_sync import ProviderSyncStatus, run_provider_sync
from codex_session_delete.relay_config import (
    apply_relay_config,
    clear_relay_config,
    default_codex_home,
    ensure_login_bypass_config,
    login_bypass_status,
    relay_status,
    _root_key_string,
    _table_values,
    _unquote,
)
from codex_session_delete.settings_store import BackendSettings, SettingsStore
from codex_session_delete.storage_adapter import SQLiteStorageAdapter


class ApiFirstDeleteService:
    def __init__(self, api_adapter: ApiAdapter, db_path: Path | None, backup_dir: Path):
        self.api_adapter = api_adapter
        self.local_adapter = SQLiteStorageAdapter(db_path, BackupStore(backup_dir)) if db_path else None

    def delete(self, session: SessionRef) -> DeleteResult:
        api_result = self.api_adapter.delete(session)
        if api_result is not None:
            return api_result
        if self.local_adapter is None:
            return DeleteResult(DeleteStatus.FAILED, session.session_id, "No confirmed server API or local database configured")
        return self.local_adapter.delete_local(session)

    def undo(self, token: str) -> DeleteResult:
        if self.local_adapter is None:
            return DeleteResult(DeleteStatus.FAILED, "", "No local backup adapter configured", undo_token=token)
        return self.local_adapter.undo(token)

    def find_archived_thread_by_title(self, title: str) -> SessionRef | None:
        if self.local_adapter is None:
            return None
        return self.local_adapter.find_archived_thread_by_title(title)

    def move_thread_workspace(self, session: SessionRef, target_cwd: str) -> dict[str, object]:
        if self.local_adapter is None:
            return {"status": DeleteStatus.FAILED.value, "session_id": session.session_id, "message": "No local database configured"}
        return self.local_adapter.move_codex_thread_workspace(session, target_cwd)

    def thread_sort_key(self, session: SessionRef) -> dict[str, object]:
        if self.local_adapter is None:
            return {"status": DeleteStatus.FAILED.value, "session_id": session.session_id, "message": "No local database configured"}
        return self.local_adapter.codex_thread_sort_key(session)

    def thread_sort_keys(self, sessions: list[SessionRef]) -> dict[str, object]:
        if self.local_adapter is None:
            return {"status": DeleteStatus.FAILED.value, "message": "No local database configured", "sort_keys": []}
        return self.local_adapter.codex_thread_sort_keys(sessions)


class InjectedHelperServer(HelperServer):
    bridge_socket: Any = None


@dataclass
class CodexPlusRuntime:
    websocket_url: str | None
    debug_port: int | None = None
    injection_status: str = "starting"
    injection_message: str = "正在等待 Codex 页面…"
    repair_callback: Callable[[], dict[str, object]] | None = None

    def backend_status(self) -> dict[str, object]:
        return {"status": self.injection_status, "message": self.injection_message}

    def repair_backend(self) -> dict[str, object]:
        if self.repair_callback is not None:
            return self.repair_callback()
        return self.backend_status()


def backend_settings() -> BackendSettings:
    return SettingsStore().load()


def choose_export_directory(initial_dir: str | None = None) -> dict[str, object]:
    default_dir = Path(initial_dir or "").expanduser() if initial_dir else default_export_directory()
    default_dir.mkdir(parents=True, exist_ok=True)
    if sys.platform == "darwin":
        script = (
            'set chosenFolder to choose folder with prompt "选择 Markdown 导出目录" '
            f'default location POSIX file "{str(default_dir).replace(chr(34), chr(92) + chr(34))}"\n'
            "POSIX path of chosenFolder"
        )
        result = subprocess.run(["osascript", "-e", script], capture_output=True, text=True, check=False)
        if result.returncode == 0:
            return {"status": "ok", "path": result.stdout.strip().rstrip("/")}
        return {"status": "canceled", "path": str(default_dir), "message": "已取消选择"}
    return {"status": "failed", "path": str(default_dir), "message": "当前系统暂不支持打开目录选择器，可手动输入路径"}


def _can_bind_loopback_port(port: int) -> bool:
    if port == 0:
        return True
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
            if sys.platform == "win32" and hasattr(socket, "SO_EXCLUSIVEADDRUSE"):
                probe.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
            probe.bind(("127.0.0.1", port))
            return True
    except OSError:
        return False


def _find_available_loopback_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
        if sys.platform == "win32" and hasattr(socket, "SO_EXCLUSIVEADDRUSE"):
            probe.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
        probe.bind(("127.0.0.1", 0))
        return int(probe.getsockname()[1])


def select_loopback_port(requested_port: int) -> int:
    if _can_bind_loopback_port(requested_port):
        return requested_port
    return _find_available_loopback_port()


def select_windows_loopback_port(requested_port: int) -> int:
    return select_loopback_port(requested_port)


def build_codex_arguments(debug_port: int) -> list[str]:
    return [
        f"--remote-debugging-port={debug_port}",
        f"--remote-allow-origins=http://127.0.0.1:{debug_port}",
    ]


def has_proxy_environment(env: dict[str, str] | None = None) -> bool:
    source = env or os.environ
    return any(source.get(name) for name in ("HTTPS_PROXY", "HTTP_PROXY", "ALL_PROXY", "https_proxy", "http_proxy", "all_proxy"))


def local_proxy_url() -> str | None:
    for port in (7897, 7890, 10809, 10808, 1080):
        try:
            with socket.create_connection(("127.0.0.1", port), timeout=0.2):
                return f"http://127.0.0.1:{port}"
        except OSError:
            continue
    return None


def codex_process_environment() -> dict[str, str]:
    env = os.environ.copy()
    inject_current_provider_env_key(env)
    if has_proxy_environment(env):
        return env
    proxy = local_proxy_url()
    if proxy:
        env.setdefault("HTTP_PROXY", proxy)
        env.setdefault("HTTPS_PROXY", proxy)
        env.setdefault("ALL_PROXY", proxy)
    return env


def inject_current_provider_env_key(env: dict[str, str]) -> None:
    config_path = default_codex_home() / "config.toml"
    try:
        contents = config_path.read_text(encoding="utf-8")
    except OSError:
        return
    provider = _root_key_string(contents, "model_provider")
    values = _table_values(contents, f"model_providers.{provider}") if provider else None
    env_key = _unquote((values or {}).get("env_key", "")).strip()
    if not env_key or env.get(env_key):
        return
    value = _shell_export_value(env_key)
    if value:
        env[env_key] = value


def _shell_export_value(name: str) -> str | None:
    pattern = re.compile(rf"^\s*(?:export\s+)?{re.escape(name)}=(.*)\s*$")
    for path in (
        Path.home() / ".zshrc",
        Path.home() / ".zprofile",
        Path.home() / ".profile",
        Path.home() / ".bash_profile",
        Path.home() / ".bashrc",
    ):
        try:
            lines = path.read_text(encoding="utf-8").splitlines()
        except OSError:
            continue
        for line in lines:
            match = pattern.match(line)
            if not match:
                continue
            raw = match.group(1).strip()
            if not raw:
                continue
            if raw[0:1] in {"'", '"'} and raw[-1:] == raw[0]:
                raw = raw[1:-1]
            return raw
    return None


def build_codex_executable(app_dir: Path) -> Path:
    if app_dir.suffix == ".app":
        return app_dir / "Contents" / "MacOS" / "Codex"
    candidates = [app_dir / "Codex.exe", app_dir / "codex.exe"]
    return next((path for path in candidates if path.exists()), candidates[-1])


def build_codex_command(app_dir: Path, debug_port: int) -> list[str]:
    return [str(build_codex_executable(app_dir)), *build_codex_arguments(debug_port)]


def macos_restart_existing_codex_enabled() -> bool:
    return sys.platform == "darwin" and os.environ.get("CODEX_PLUS_RESTART_EXISTING") == "1"


def _macos_codex_main_processes() -> list[int]:
    result = subprocess.run(["ps", "-axo", "pid=,command="], capture_output=True, text=True, check=False)
    pids: list[int] = []
    for line in result.stdout.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        pid_text, _, command = stripped.partition(" ")
        if "/Codex.app/Contents/MacOS/Codex" not in command:
            continue
        try:
            pids.append(int(pid_text))
        except ValueError:
            continue
    return pids


def stop_existing_macos_codex_instances(timeout: float = 6.0) -> None:
    if sys.platform != "darwin":
        return
    pids = [pid for pid in _macos_codex_main_processes() if pid != os.getpid()]
    if not pids:
        return
    for pid in pids:
        try:
            os.kill(pid, signal.SIGTERM)
        except OSError:
            pass
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        remaining = set(_macos_codex_main_processes()) & set(pids)
        if not remaining:
            return
        time.sleep(0.2)


def packaged_app_user_model_id(app_dir: Path) -> str | None:
    package_dir = app_dir.parent if app_dir.name.lower() == "app" else app_dir
    if not package_dir.name.startswith("OpenAI.Codex_") or "__" not in package_dir.name:
        return None
    identity_name = package_dir.name.split("_", 1)[0]
    publisher_id = package_dir.name.rsplit("__", 1)[1]
    if not publisher_id:
        return None
    return f"{identity_name}_{publisher_id}!App"


class _GUID(ctypes.Structure):
    _fields_ = [
        ("Data1", ctypes.c_uint32),
        ("Data2", ctypes.c_uint16),
        ("Data3", ctypes.c_uint16),
        ("Data4", ctypes.c_ubyte * 8),
    ]

    def __init__(self, value: str):
        parsed = uuid.UUID(value)
        data4 = bytes([parsed.clock_seq_hi_variant, parsed.clock_seq_low]) + parsed.node.to_bytes(6, "big")
        super().__init__(parsed.time_low, parsed.time_mid, parsed.time_hi_version, (ctypes.c_ubyte * 8)(*data4))


def _raise_for_hresult(hr: int, operation: str) -> None:
    if hr < 0:
        raise OSError(f"{operation} failed with HRESULT 0x{hr & 0xFFFFFFFF:08X}")


def activate_packaged_app(app_user_model_id: str, arguments: str) -> int:
    if sys.platform != "win32":
        raise RuntimeError("Packaged app activation is only supported on Windows")

    ole32 = ctypes.OleDLL("ole32")
    ole32.CoInitializeEx.argtypes = [ctypes.c_void_p, ctypes.c_ulong]
    ole32.CoInitializeEx.restype = ctypes.c_long
    ole32.CoUninitialize.argtypes = []
    ole32.CoUninitialize.restype = None
    ole32.CoCreateInstance.argtypes = [
        ctypes.POINTER(_GUID),
        ctypes.c_void_p,
        ctypes.c_ulong,
        ctypes.POINTER(_GUID),
        ctypes.POINTER(ctypes.c_void_p),
    ]
    ole32.CoCreateInstance.restype = ctypes.c_long

    coinit_hr = ole32.CoInitializeEx(None, 2)
    should_uninitialize = coinit_hr >= 0
    if coinit_hr < 0 and coinit_hr != -2147417850:  # RPC_E_CHANGED_MODE
        _raise_for_hresult(coinit_hr, "CoInitializeEx")

    activation_manager = ctypes.c_void_p()
    try:
        clsid = _GUID("45BA127D-10A8-46EA-8AB7-56EA9078943C")
        iid = _GUID("2e941141-7f97-4756-ba1d-9decde894a3d")
        _raise_for_hresult(
            ole32.CoCreateInstance(ctypes.byref(clsid), None, 1, ctypes.byref(iid), ctypes.byref(activation_manager)),
            "CoCreateInstance(ApplicationActivationManager)",
        )

        activate_application_type = ctypes.WINFUNCTYPE(
            ctypes.c_long,
            ctypes.c_void_p,
            ctypes.c_wchar_p,
            ctypes.c_wchar_p,
            ctypes.c_ulong,
            ctypes.POINTER(ctypes.c_ulong),
        )

        vtable = ctypes.cast(activation_manager, ctypes.POINTER(ctypes.POINTER(ctypes.c_void_p))).contents
        activate_application = activate_application_type(vtable[3])

        process_id = ctypes.c_ulong()
        _raise_for_hresult(
            activate_application(activation_manager, app_user_model_id, arguments, 0, ctypes.byref(process_id)),
            "ActivateApplication",
        )
        return int(process_id.value)
    finally:
        if activation_manager.value:
            release = ctypes.WINFUNCTYPE(ctypes.c_ulong, ctypes.c_void_p)(
                ctypes.cast(activation_manager, ctypes.POINTER(ctypes.POINTER(ctypes.c_void_p))).contents[2]
            )
            release(activation_manager)
        if should_uninitialize:
            ole32.CoUninitialize()


def launch_codex_app(app_dir: Path, debug_port: int) -> Any:
    app_user_model_id = packaged_app_user_model_id(app_dir) if sys.platform == "win32" else None
    env = codex_process_environment()
    if app_user_model_id:
        proxy_keys = ("HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY")
        previous = {key: os.environ.get(key) for key in proxy_keys}
        os.environ.update({key: env[key] for key in proxy_keys if key in env})
        try:
            return activate_packaged_app(app_user_model_id, subprocess.list2cmdline(build_codex_arguments(debug_port)))
        finally:
            for key, value in previous.items():
                if value is None:
                    os.environ.pop(key, None)
                else:
                    os.environ[key] = value
    return subprocess.Popen(build_codex_command(app_dir, debug_port), env=env)


def start_helper(
    service,
    export_service: MarkdownExportService | None = None,
    host: str = "127.0.0.1",
    port: int = 57321,
    runtime: CodexPlusRuntime | None = None,
) -> HelperServer:
    server = InjectedHelperServer(
        host,
        port,
        service,
        export_service=export_service,
        backend_status_handler=runtime.backend_status if runtime else None,
        backend_repair_handler=runtime.repair_backend if runtime else None,
    )
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server


def shutdown_helper(server: HelperServer) -> None:
    server.shutdown()
    server.server_close()


def inject_with_retry(
    debug_port: int,
    script_path: Path,
    helper_port: int,
    service: ApiFirstDeleteService,
    export_service: MarkdownExportService,
    runtime: CodexPlusRuntime,
    attempts: int = 20,
    delay: float = 0.5,
) -> Any:
    last_error: Exception | None = None
    for _ in range(attempts):
        try:
            runtime.injection_status = "checking"
            runtime.injection_message = "正在等待 Codex 页面…"
            injection = inject_file(
                debug_port,
                script_path,
                helper_port,
                lambda path, payload: handle_bridge_request(service, export_service, path, payload, runtime),
            )
            runtime.websocket_url = injection.websocket_url
            runtime.injection_status = "ok"
            runtime.injection_message = "后端已连接"
            return injection.bridge_socket or injection.result
        except Exception as exc:
            last_error = exc
            time.sleep(delay)
    if last_error is not None:
        runtime.injection_status = "failed"
        runtime.injection_message = f"增强注入失败：{last_error}"
        raise last_error
    runtime.injection_status = "failed"
    runtime.injection_message = "增强注入失败"
    raise RuntimeError("Codex injection failed")


def launch_and_inject(app_dir: Path | None, db_path: Path | None, backup_dir: Path, debug_port: int, helper_port: int) -> tuple[HelperServer, Any]:
    resolved_app_dir = resolve_codex_app_dir(app_dir)
    if resolved_app_dir is None:
        raise RuntimeError("Codex App directory not found")
    if macos_restart_existing_codex_enabled():
        stop_existing_macos_codex_instances()
    debug_port = select_loopback_port(debug_port)
    helper_port = select_loopback_port(helper_port)
    service = ApiFirstDeleteService(UnavailableApiAdapter(), db_path, backup_dir)
    export_service = MarkdownExportService(db_path)
    script_path = Path(__file__).parent / "inject" / "renderer-inject.js"
    runtime = CodexPlusRuntime(None, debug_port)
    settings = backend_settings()
    if settings.skip_login_enabled:
        bypass_result = ensure_login_bypass_config()
        if not bypass_result.configured:
            print(f"Login bypass skipped: {bypass_result.message}")
    if settings.provider_sync_enabled:
        sync_result = run_provider_sync()
        if sync_result.status == ProviderSyncStatus.SKIPPED:
            print(f"Provider sync skipped: {sync_result.message}")
    server = start_helper(service, export_service, port=helper_port, runtime=runtime)

    def repair_bridge() -> dict[str, object]:
        runtime.injection_status = "checking"
        runtime.injection_message = "正在重连 Codex 增强…"
        try:
            old_socket = server.bridge_socket
            server.bridge_socket = inject_with_retry(debug_port, script_path, server.port, service, export_service, runtime, attempts=10, delay=0.3)
            if old_socket and old_socket is not server.bridge_socket:
                try:
                    old_socket.close()
                except Exception:
                    pass
            runtime.injection_status = "ok"
            runtime.injection_message = "后端已连接"
        except Exception as exc:
            runtime.injection_status = "failed"
            runtime.injection_message = f"重连失败：{exc}"
        return runtime.backend_status()

    runtime.repair_callback = repair_bridge
    codex_proc = None
    try:
        codex_proc = launch_codex_app(resolved_app_dir, debug_port)
        server.bridge_socket = inject_with_retry(debug_port, script_path, server.port, service, export_service, runtime)
        return server, codex_proc
    except Exception:
        shutdown_helper(server)
        # Kill any Codex process we just activated so the next attempt starts from a clean state
        # instead of staring at a half-rendered white window.
        if sys.platform == "win32":
            try:
                subprocess.run(
                    [
                        "powershell.exe",
                        "-NoProfile",
                        "-NonInteractive",
                        "-Command",
                        "Get-CimInstance Win32_Process -Filter \"Name='Codex.exe' OR Name='codex.exe'\" | "
                        "ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }",
                    ],
                    check=False,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    timeout=6,
                    creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
                )
            except (OSError, subprocess.SubprocessError):
                pass
        raise


def handle_bridge_request(
    service: ApiFirstDeleteService,
    export_service: MarkdownExportService,
    path: str,
    payload: dict[str, object],
    runtime: CodexPlusRuntime | None = None,
) -> dict[str, object]:
    if path == "/settings/get" and runtime:
        return SettingsStore().load().to_dict()
    if path == "/settings/set" and runtime:
        return SettingsStore().update(payload).to_dict()
    if path == "/backend/status" and runtime:
        return runtime.backend_status()
    if path == "/backend/repair" and runtime:
        return runtime.repair_backend()
    if path == "/export-directory/default" and runtime:
        directory = default_export_directory()
        directory.mkdir(parents=True, exist_ok=True)
        return {"status": "ok", "path": str(directory)}
    if path == "/directory/choose" and runtime:
        return choose_export_directory(str(payload.get("initial_dir", "")) or None)
    if path == "/relay/status" and runtime:
        return relay_status().to_dict()
    if path == "/login-bypass/status" and runtime:
        return login_bypass_status().to_dict()
    if path == "/login-bypass/apply" and runtime:
        try:
            return ensure_login_bypass_config().to_dict()
        except OSError as exc:
            return {
                "configured": False,
                "eligible": False,
                "currentProvider": "",
                "message": str(exc),
                "configPath": str(Path.home() / ".codex" / "config.toml"),
            }
    if path == "/relay/apply" and runtime:
        try:
            return apply_relay_config(str(payload.get("base_url", "")), str(payload.get("api_key", ""))).to_dict()
        except (OSError, ValueError) as exc:
            return {"status": "failed", "message": str(exc), "configured": False, "configPath": str(Path.home() / ".codex" / "config.toml")}
    if path == "/relay/clear" and runtime:
        try:
            return clear_relay_config().to_dict()
        except OSError as exc:
            return {"status": "failed", "message": str(exc), "configured": False, "configPath": str(Path.home() / ".codex" / "config.toml")}
    if path == "/delete":
        session = SessionRef(session_id=str(payload.get("session_id", "")), title=str(payload.get("title", "")))
        return service.delete(session).to_dict()
    if path == "/undo":
        return service.undo(str(payload.get("undo_token", ""))).to_dict()
    if path == "/export-markdown":
        session = SessionRef(session_id=str(payload.get("session_id", "")), title=str(payload.get("title", "")))
        return export_service.export(
            session,
            filename=str(payload.get("filename", "")).strip() or None,
            export_dir=str(payload.get("export_dir", "")).strip() or None,
        ).to_dict()
    if path == "/archived-thread":
        session = service.find_archived_thread_by_title(str(payload.get("title", "")))
        return {"session_id": session.session_id, "title": session.title} if session else {"session_id": "", "title": ""}
    if path == "/move-thread-workspace":
        session = SessionRef(session_id=str(payload.get("session_id", "")), title=str(payload.get("title", "")))
        return service.move_thread_workspace(session, str(payload.get("target_cwd", "")))
    if path == "/thread-sort-key":
        session = SessionRef(session_id=str(payload.get("session_id", "")), title=str(payload.get("title", "")))
        return service.thread_sort_key(session)
    if path == "/thread-sort-keys":
        raw_sessions = payload.get("sessions", [])
        sessions = [
            SessionRef(session_id=str(item.get("session_id", "")), title=str(item.get("title", "")))
            for item in raw_sessions
            if isinstance(item, dict)
        ] if isinstance(raw_sessions, list) else []
        return service.thread_sort_keys(sessions)
    return {"status": DeleteStatus.FAILED.value, "session_id": str(payload.get("session_id", "")), "message": "Unknown bridge path"}
