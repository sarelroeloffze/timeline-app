#!/bin/bash
# ─────────────────────────────────────────────────────────────
# Timeline App — Local build script
# Builds Windows (.exe) and/or macOS (.dmg) desktop installers
# ─────────────────────────────────────────────────────────────
#
# Prerequisites:
#   - Node.js 18+ (https://nodejs.org)
#   - npm (comes with Node.js)
#
# Usage:
#   ./build.sh          # Build for current platform
#   ./build.sh win      # Build Windows installer
#   ./build.sh mac      # Build macOS app
#   ./build.sh all      # Build both (Mac builds only work on macOS)
#

set -e
cd "$(dirname "$0")"

echo ""
echo "  ╔═══════════════════════════════════════╗"
echo "  ║     Timeline App — Desktop Builder    ║"
echo "  ╚═══════════════════════════════════════╝"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install from https://nodejs.org"
    exit 1
fi

NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VER" -lt 18 ]; then
    echo "❌ Node.js 18+ required (found v$(node -v))"
    exit 1
fi

echo "✓ Node.js $(node -v)"
echo "✓ npm $(npm -v)"
echo ""

# Install dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

TARGET="${1:-current}"

case "$TARGET" in
    win|windows)
        echo "🪟 Building for Windows..."
        npx electron-builder --win --x64
        ;;
    mac|macos)
        echo "🍎 Building for macOS..."
        npx electron-builder --mac --x64 --arm64
        ;;
    all)
        echo "🪟 Building for Windows..."
        npx electron-builder --win --x64
        echo ""
        echo "🍎 Building for macOS..."
        npx electron-builder --mac --x64 --arm64
        ;;
    current)
        echo "🔨 Building for current platform..."
        npx electron-builder
        ;;
    *)
        echo "Usage: ./build.sh [win|mac|all]"
        exit 1
        ;;
esac

echo ""
echo "✅ Build complete! Check the dist/ folder:"
ls -lh dist/ 2>/dev/null || echo "  (no output found)"
echo ""
