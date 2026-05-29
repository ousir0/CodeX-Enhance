from __future__ import annotations

import os
import plistlib
import shlex
import shutil
import signal
import stat
import subprocess
import sys
import time
from pathlib import Path
from typing import TYPE_CHECKING

from codex_session_delete import ASCII_PRODUCT_NAME, PRODUCT_NAME, PRODUCT_SUBTITLE, __version__
from codex_session_delete.app_paths import find_macos_codex_app

ICON_ASSET = Path(__file__).resolve().parent / "assets" / "codex-plus-plus.png"

if TYPE_CHECKING:
    from codex_session_delete.installers import InstallOptions


DEFAULT_INSTALL_ROOT = Path("/Applications")
APP_NAME = "CodeX 增强.app"
EXECUTABLE_NAME = "CodeXEnhance"


def _launcher_command(options: "InstallOptions") -> str:
    if options.launcher_command:
        return options.launcher_command
    project_root = Path(__file__).resolve().parent.parent
    if (project_root / "pyproject.toml").is_file():
        return f"env CODEX_PLUS_RESTART_EXISTING=1 PYTHONPATH={shlex.quote(str(project_root))} {shlex.quote(sys.executable)} -m codex_session_delete unlock"
    return f"env CODEX_PLUS_RESTART_EXISTING=1 {shlex.quote(sys.executable)} -m codex_session_delete unlock"


def _app_root(options: "InstallOptions") -> Path:
    return (options.install_root or DEFAULT_INSTALL_ROOT) / APP_NAME


def install_macos_app(options: "InstallOptions") -> None:
    _stop_existing_launcher_processes()
    app = _app_root(options)
    contents = app / "Contents"
    macos = contents / "MacOS"
    resources = contents / "Resources"
    macos.mkdir(parents=True, exist_ok=True)
    resources.mkdir(parents=True, exist_ok=True)

    plist = {
        "CFBundleName": PRODUCT_NAME,
        "CFBundleDisplayName": f"{PRODUCT_NAME}（{PRODUCT_SUBTITLE}）",
        "CFBundleIdentifier": "com.codexenhance.desktop",
        "CFBundleVersion": __version__,
        "CFBundleShortVersionString": __version__,
        "CFBundlePackageType": "APPL",
        "CFBundleExecutable": EXECUTABLE_NAME,
        "NSHumanReadableCopyright": ASCII_PRODUCT_NAME,
        "CFBundleIconFile": "codex-plus-plus.png",
        "LSUIElement": True,
        "LSMinimumSystemVersion": "12.0",
    }
    (contents / "Info.plist").write_bytes(plistlib.dumps(plist))

    executable = macos / EXECUTABLE_NAME
    executable.write_text(f"#!/bin/sh\nexec {_launcher_command(options)}\n", encoding="utf-8")
    executable.chmod(executable.stat().st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)

    _copy_codex_icon(resources)


def uninstall_macos_app(options: "InstallOptions") -> None:
    _stop_existing_launcher_processes()
    app = _app_root(options)
    if app.exists():
        shutil.rmtree(app)


def _copy_codex_icon(resources: Path) -> None:
    if ICON_ASSET.is_file():
        shutil.copy2(ICON_ASSET, resources / "codex-plus-plus.png")
        return
    codex_app = find_macos_codex_app()
    if codex_app is None:
        return
    icon_src = codex_app / "Contents" / "Resources" / "electron.icns"
    if icon_src.is_file():
        shutil.copy2(icon_src, resources / "electron.icns")


def _stop_existing_launcher_processes(timeout: float = 4.0) -> None:
    if sys.platform != "darwin":
        return
    result = subprocess.run(["ps", "-axo", "pid=,command="], capture_output=True, text=True, check=False)
    pids: list[int] = []
    for line in result.stdout.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        pid_text, _, command = stripped.partition(" ")
        if "-m codex_session_delete unlock" not in command:
            continue
        try:
            pid = int(pid_text)
        except ValueError:
            continue
        if pid != os.getpid():
            pids.append(pid)
    for pid in pids:
        try:
            os.kill(pid, signal.SIGTERM)
        except OSError:
            pass
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        remaining = []
        for pid in pids:
            try:
                os.kill(pid, 0)
                remaining.append(pid)
            except OSError:
                pass
        if not remaining:
            return
        time.sleep(0.2)
