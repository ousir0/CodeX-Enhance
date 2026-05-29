from __future__ import annotations

import argparse
import os
import plistlib
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACKAGE = ROOT / "codex_session_delete"
DIST = ROOT / "dist"
BUILD = ROOT / "build"
PRODUCT_NAME = "CodeX 增强"
ASCII_NAME = "CodeX-Enhance"


def run(command: list[str], *, cwd: Path = ROOT) -> None:
    print("+", " ".join(command))
    subprocess.run(command, cwd=cwd, check=True)


def version() -> str:
    namespace: dict[str, str] = {}
    exec((PACKAGE / "__init__.py").read_text(encoding="utf-8"), namespace)
    return namespace.get("__version__", "0.0.0")


def remove_path(path: Path) -> None:
    if path.is_dir() and not path.is_symlink():
        shutil.rmtree(path)
    elif path.exists() or path.is_symlink():
        path.unlink()


def ensure_pyinstaller() -> str:
    path = shutil.which("pyinstaller")
    if path:
        return path
    raise SystemExit("未找到 pyinstaller，请先运行：python -m pip install pyinstaller")


def build_icns() -> Path:
    source = PACKAGE / "assets" / "codex-plus-plus.png"
    iconset = BUILD / "codex-plus-plus.iconset"
    icns = BUILD / "codex-plus-plus.icns"
    remove_path(iconset)
    iconset.mkdir(parents=True, exist_ok=True)
    sizes = [16, 32, 64, 128, 256, 512]
    for size in sizes:
        run(["sips", "-z", str(size), str(size), str(source), "--out", str(iconset / f"icon_{size}x{size}.png")])
        run(
            [
                "sips",
                "-z",
                str(size * 2),
                str(size * 2),
                str(source),
                "--out",
                str(iconset / f"icon_{size}x{size}@2x.png"),
            ]
        )
    remove_path(icns)
    run(["iconutil", "-c", "icns", str(iconset), "-o", str(icns)])
    return icns


def patch_macos_plist(app: Path) -> None:
    plist_path = app / "Contents" / "Info.plist"
    data = plistlib.loads(plist_path.read_bytes())
    data.update(
        {
            "CFBundleDisplayName": PRODUCT_NAME,
            "CFBundleIdentifier": "com.codexenhance.desktop",
            "CFBundleShortVersionString": version(),
            "CFBundleVersion": version(),
            "LSUIElement": True,
            "LSMinimumSystemVersion": "12.0",
        }
    )
    plist_path.write_bytes(plistlib.dumps(data))


def build_macos_app() -> Path:
    if sys.platform != "darwin":
        raise SystemExit("macOS .app/.dmg 只能在 macOS 上构建")
    pyinstaller = ensure_pyinstaller()
    icon = build_icns()
    app = DIST / f"{PRODUCT_NAME}.app"
    remove_path(app)
    run(
        [
            pyinstaller,
            "--noconfirm",
            "--clean",
            "--windowed",
            "--name",
            PRODUCT_NAME,
            "--specpath",
            str(BUILD),
            "--icon",
            str(icon),
            "--add-data",
            f"{PACKAGE / 'assets'}:codex_session_delete/assets",
            "--add-data",
            f"{PACKAGE / 'inject'}:codex_session_delete/inject",
            str(PACKAGE / "__main__.py"),
        ]
    )
    patch_macos_plist(app)
    return app


def build_dmg() -> Path:
    app = build_macos_app()
    dmg = DIST / f"{ASCII_NAME}-macOS-{version()}.dmg"
    remove_path(dmg)
    with tempfile.TemporaryDirectory(prefix="codex-enhance-dmg-") as temp:
        staging = Path(temp) / f"{PRODUCT_NAME} {version()}"
        staging.mkdir(parents=True)
        shutil.copytree(app, staging / app.name, symlinks=True)
        (staging / "Applications").symlink_to("/Applications")
        run(["hdiutil", "create", "-volname", f"{PRODUCT_NAME} {version()}", "-srcfolder", str(staging), "-ov", "-format", "UDZO", str(dmg)])
    return dmg


def build_windows_exe_if_possible() -> Path | None:
    if sys.platform != "win32":
        return None
    pyinstaller = ensure_pyinstaller()
    exe = DIST / f"{PRODUCT_NAME}.exe"
    remove_path(exe)
    run(
        [
            pyinstaller,
            "--noconfirm",
            "--clean",
            "--onefile",
            "--windowed",
            "--name",
            PRODUCT_NAME,
            "--specpath",
            str(BUILD),
            "--icon",
            str(PACKAGE / "assets" / "codex-plus-plus.ico"),
            "--add-data",
            f"{PACKAGE / 'assets'};codex_session_delete/assets",
            "--add-data",
            f"{PACKAGE / 'inject'};codex_session_delete/inject",
            str(PACKAGE / "__main__.py"),
        ]
    )
    return exe


def copy_distribution_source(staging: Path) -> None:
    shutil.copytree(PACKAGE, staging / "codex_session_delete", ignore=shutil.ignore_patterns("__pycache__", "*.pyc", "user_scripts"))
    shutil.copytree(ROOT / "assets", staging / "assets")
    for name in ("README.md", "pyproject.toml", "setup.bat"):
        shutil.copy2(ROOT / name, staging / name)
    (staging / "install.bat").write_text("@echo off\r\ncall \"%~dp0setup.bat\"\r\n", encoding="utf-8")


def build_windows_zip() -> Path:
    zip_base = DIST / f"{ASCII_NAME}-Windows-{version()}"
    archive = Path(f"{zip_base}.zip")
    remove_path(archive)
    with tempfile.TemporaryDirectory(prefix="codex-enhance-win-") as temp:
        staging = Path(temp) / f"{ASCII_NAME}-Windows-{version()}"
        staging.mkdir(parents=True)
        exe = build_windows_exe_if_possible()
        if exe:
            shutil.copy2(exe, staging / exe.name)
        copy_distribution_source(staging)
        shutil.make_archive(str(zip_base), "zip", root_dir=staging.parent, base_dir=staging.name)
    return archive


def main() -> int:
    parser = argparse.ArgumentParser(description="Build CodeX Enhance distribution packages")
    parser.add_argument("--macos", action="store_true", help="Build macOS .app and .dmg")
    parser.add_argument("--windows", action="store_true", help="Build Windows zip, and .exe when running on Windows")
    parser.add_argument("--all", action="store_true", help="Build every package supported by this machine")
    args = parser.parse_args()

    if not (args.macos or args.windows or args.all):
        args.all = True

    DIST.mkdir(parents=True, exist_ok=True)
    artifacts: list[Path] = []
    if args.all or args.macos:
        artifacts.append(build_dmg())
    if args.all or args.windows:
        artifacts.append(build_windows_zip())
    print("\n构建完成：")
    for artifact in artifacts:
        print(artifact)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
