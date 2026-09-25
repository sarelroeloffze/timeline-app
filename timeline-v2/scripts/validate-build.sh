#!/bin/bash

# Validate Build - Run all quality checks
# This script runs the same checks as CI/CD pipeline

echo "🔨 Running Build Validation..."
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track failures
FAILURES=0

# Function to run a check
run_check() {
    local name=$1
    local command=$2

    echo -e "${BLUE}▶ $name${NC}"

    if eval $command > /tmp/timeline-check.log 2>&1; then
        echo -e "${GREEN}  ✓ Passed${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}  ✗ Failed${NC}"
        echo -e "${YELLOW}  See details: /tmp/timeline-check.log${NC}"
        tail -20 /tmp/timeline-check.log | sed 's/^/    /'
        echo ""
        FAILURES=$((FAILURES + 1))
        return 1
    fi
}

# Navigate to project directory
cd "$(dirname "$0")/.." || exit 1

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Build Validation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. TypeScript Type Check
run_check "TypeScript Type Check" "npx tsc --noEmit"

# 2. ESLint
run_check "ESLint" "npm run lint"

# 3. Next.js Build
run_check "Next.js Build" "npm run build"

# 4. Check for TODO/FIXME comments (informational only)
echo -e "${BLUE}▶ Code Comments Scan${NC}"
TODO_COUNT=$(grep -r "TODO\|FIXME" src/ 2>/dev/null | wc -l | tr -d ' ')
if [ "$TODO_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}  ⚠ Found $TODO_COUNT TODO/FIXME comments${NC}"
else
    echo -e "${GREEN}  ✓ No TODO/FIXME comments${NC}"
fi
echo ""

# 5. Check for console.log statements (warning only)
echo -e "${BLUE}▶ Console Statements Scan${NC}"
CONSOLE_COUNT=$(grep -r "console\\.log" src/ 2>/dev/null | grep -v "// console" | wc -l | tr -d ' ')
if [ "$CONSOLE_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}  ⚠ Found $CONSOLE_COUNT console.log statements${NC}"
else
    echo -e "${GREEN}  ✓ No console.log statements${NC}"
fi
echo ""

# 6. Check bundle size (informational)
echo -e "${BLUE}▶ Bundle Size${NC}"
if [ -d ".next" ]; then
    BUNDLE_SIZE=$(du -sh .next 2>/dev/null | awk '{print $1}')
    echo -e "${GREEN}  ✓ Build size: $BUNDLE_SIZE${NC}"
else
    echo -e "${YELLOW}  ⚠ No build found${NC}"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}✓ All validation checks passed!${NC}"
    echo ""
    echo "Build is ready for:"
    echo "  • Development (npm run dev)"
    echo "  • Production (npm start)"
    echo "  • Tauri build (npm run tauri:build)"
    echo ""
    exit 0
else
    echo -e "${RED}✗ $FAILURES validation check(s) failed${NC}"
    echo ""
    echo "Fix the issues above before:"
    echo "  • Committing code"
    echo "  • Creating pull requests"
    echo "  • Deploying to production"
    echo ""
    exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
