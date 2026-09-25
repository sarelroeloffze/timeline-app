#!/bin/bash

# Check Prerequisites for Timeline App Development
# Run this before starting development

echo "🔍 Checking Prerequisites for Timeline App..."
echo ""

# Track if all checks pass
ALL_GOOD=true

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
echo -n "Node.js: "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ $NODE_VERSION${NC}"

    # Check if version is >= 18
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$MAJOR_VERSION" -lt 18 ]; then
        echo -e "${YELLOW}  ⚠ Warning: Node.js 18+ recommended${NC}"
    fi
else
    echo -e "${RED}✗ Not installed${NC}"
    echo -e "${YELLOW}  Install: https://nodejs.org/${NC}"
    ALL_GOOD=false
fi

# Check npm
echo -n "npm: "
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓ $NPM_VERSION${NC}"
else
    echo -e "${RED}✗ Not installed${NC}"
    ALL_GOOD=false
fi

# Check Git
echo -n "Git: "
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version | awk '{print $3}')
    echo -e "${GREEN}✓ $GIT_VERSION${NC}"
else
    echo -e "${RED}✗ Not installed${NC}"
    echo -e "${YELLOW}  Install: https://git-scm.com/${NC}"
    ALL_GOOD=false
fi

# Check Rust (optional but needed for Tauri)
echo -n "Rust: "
if command -v cargo &> /dev/null; then
    CARGO_VERSION=$(cargo --version | awk '{print $2}')
    echo -e "${GREEN}✓ $CARGO_VERSION${NC}"
else
    echo -e "${YELLOW}✗ Not installed (optional)${NC}"
    echo -e "${YELLOW}  Install: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh${NC}"
    echo -e "${YELLOW}  Required for: Tauri desktop builds${NC}"
fi

# Check if in project directory
echo ""
echo -n "Project directory: "
if [ -f "package.json" ]; then
    echo -e "${GREEN}✓ Found${NC}"
else
    echo -e "${RED}✗ Not in project root${NC}"
    echo -e "${YELLOW}  Run this script from timeline-v2/ directory${NC}"
    ALL_GOOD=false
fi

# Check if node_modules exists
echo -n "Dependencies: "
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓ Installed${NC}"
else
    echo -e "${RED}✗ Not installed${NC}"
    echo -e "${YELLOW}  Run: npm install${NC}"
    ALL_GOOD=false
fi

# Check for .env.local
echo -n "Firebase config: "
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✓ .env.local found${NC}"
else
    echo -e "${YELLOW}⚠ .env.local missing${NC}"
    echo -e "${YELLOW}  Copy .env.example to .env.local and add Firebase credentials${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$ALL_GOOD" = true ]; then
    echo -e "${GREEN}✓ All required prerequisites installed!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Configure Firebase: cp .env.example .env.local"
    echo "  2. Start dev server: npm run dev"
    echo "  3. Run type check: npx tsc --noEmit"
    echo ""
    echo "For Tauri desktop builds:"
    echo "  1. Install Rust (see above)"
    echo "  2. Run: npm run tauri:dev"
else
    echo -e "${RED}✗ Some prerequisites are missing${NC}"
    echo -e "${YELLOW}Please install missing items before continuing${NC}"
    exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
