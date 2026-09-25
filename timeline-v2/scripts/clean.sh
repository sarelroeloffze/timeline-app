#!/bin/bash

# Clean Build Artifacts
# Remove all build outputs and caches

echo "🧹 Cleaning build artifacts..."
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Navigate to project directory
cd "$(dirname "$0")/.." || exit 1

# Function to remove directory if it exists
remove_dir() {
    local dir=$1
    local name=$2

    if [ -d "$dir" ]; then
        echo -e "${BLUE}  Removing $name...${NC}"
        rm -rf "$dir"
        echo -e "${GREEN}  ✓ Removed $name${NC}"
    else
        echo -e "${YELLOW}  ⊘ $name not found (already clean)${NC}"
    fi
}

# Function to remove file if it exists
remove_file() {
    local file=$1
    local name=$2

    if [ -f "$file" ]; then
        echo -e "${BLUE}  Removing $name...${NC}"
        rm -f "$file"
        echo -e "${GREEN}  ✓ Removed $name${NC}"
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Next.js Build Artifacts"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

remove_dir ".next" "Next.js build cache"
remove_dir "out" "Static export output"
remove_file "next-env.d.ts" "Next.js environment types"
remove_file ".tsbuildinfo" "TypeScript build info"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Tauri Build Artifacts"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

remove_dir "src-tauri/target" "Rust build artifacts"
remove_file "src-tauri/Cargo.lock" "Cargo lock file"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Dependencies (Optional)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Ask before removing node_modules (it's large)
read -p "Remove node_modules? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    remove_dir "node_modules" "Node.js dependencies"
    echo -e "${YELLOW}  ⚠ Run 'npm install' before next build${NC}"
else
    echo -e "${BLUE}  ⊘ Keeping node_modules${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Temporary Files"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Remove temp files
remove_file "/tmp/timeline-check.log" "Validation check log"

# Clean macOS files
find . -name ".DS_Store" -type f -delete 2>/dev/null && echo -e "${GREEN}  ✓ Removed .DS_Store files${NC}" || echo -e "${YELLOW}  ⊘ No .DS_Store files found${NC}"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✓ Cleanup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. npm install (if you removed node_modules)"
echo "  2. npm run build (to rebuild)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
