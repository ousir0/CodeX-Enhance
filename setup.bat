@echo off
setlocal
cd /d "%~dp0"

set "VENV_DIR=%~dp0.venv"
set "VENV_PY=%VENV_DIR%\Scripts\python.exe"

:menu
cls
echo ========================================
echo              CodeX Enhance Setup
echo ========================================
echo.
echo [1] Install CodeX Enhance
echo [2] Uninstall CodeX Enhance
echo [3] Update CodeX Enhance
echo [4] Exit
echo.
set /p choice=Please select an option [1-4]:

if "%choice%"=="1" goto install
if "%choice%"=="2" goto uninstall
if "%choice%"=="3" goto update
if "%choice%"=="4" goto end

echo.
echo Invalid choice.
pause
goto menu

:install
echo.
call :ensure_venv
if errorlevel 1 goto error
echo Installing CodeX Enhance into venv...
"%VENV_PY%" -m pip install -e .
if errorlevel 1 goto error
echo.
echo Installing CodeX Enhance shortcut and uninstall entry...
"%VENV_PY%" -m codex_session_delete setup
if errorlevel 1 goto error
echo.
echo CodeX Enhance installed successfully.
echo You can launch it from the CodeX Enhance desktop shortcut.
pause
goto end

:uninstall
echo.
if exist "%VENV_PY%" (
    set "RUNPY=%VENV_PY%"
) else (
    echo CodeX Enhance venv not found, falling back to system python.
    set "RUNPY=python"
)
echo Uninstalling CodeX Enhance shortcut and uninstall entry...
"%RUNPY%" -m codex_session_delete remove
if errorlevel 1 goto error
echo.
echo CodeX Enhance uninstalled successfully.
pause
goto end

:update
echo.
call :ensure_venv
if errorlevel 1 goto error
echo Updating CodeX Enhance from GitHub Release...
"%VENV_PY%" -m codex_session_delete update
if errorlevel 1 goto error
echo.
echo CodeX Enhance update finished.
pause
goto end

:ensure_venv
if exist "%VENV_PY%" exit /b 0
echo.
echo Creating Python virtual environment at "%VENV_DIR%"...
python -m venv "%VENV_DIR%"
if errorlevel 1 (
    echo Failed to create venv. Make sure Python 3.11+ is installed and available on PATH.
    exit /b 1
)
echo Upgrading pip / setuptools / wheel inside venv...
"%VENV_PY%" -m pip install --upgrade pip setuptools wheel
if errorlevel 1 exit /b 1
exit /b 0

:error
echo.
echo Operation failed. Please check the error output above.
pause
exit /b 1

:end
endlocal
