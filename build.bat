@echo off
REM ─────────────────────────────────────────────────────────────
REM Timeline App — Windows build script
REM Builds Windows (.exe) desktop installer
REM ─────────────────────────────────────────────────────────────
REM
REM Prerequisites:
REM   - Node.js 18+ (https://nodejs.org)
REM
REM Usage:
REM   build.bat          — Build for Windows
REM   build.bat mac      — Build for macOS (only works on macOS)
REM   build.bat all      — Build both platforms
REM

cd /d "%~dp0"

echo.
echo   ══════════════════════════════════════════
echo     Timeline App — Desktop Builder (Windows)
echo   ══════════════════════════════════════════
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo ❌ Node.js not found. Install from https://nodejs.org
    pause
    exit /b 1
)

echo ✓ Node.js:
node -v
echo ✓ npm:
npm -v
echo.

if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    echo.
)

set TARGET=%1
if "%TARGET%"=="" set TARGET=win

if "%TARGET%"=="win" (
    echo 🪟 Building for Windows...
    npx electron-builder --win --x64
) else if "%TARGET%"=="mac" (
    echo 🍎 Building for macOS...
    npx electron-builder --mac --x64 --arm64
) else if "%TARGET%"=="all" (
    echo 🪟 Building for Windows...
    npx electron-builder --win --x64
    echo.
    echo 🍎 Building for macOS...
    npx electron-builder --mac --x64 --arm64
) else (
    echo Usage: build.bat [win^|mac^|all]
    pause
    exit /b 1
)

echo.
echo ✅ Build complete! Check the dist\ folder.
dir dist\ 2>nul
echo.
pause
