#!/bin/bash

# Verification Script for Study Abroad Destination Intelligence
# Checks that everything is set up correctly before running the app

echo "🔍 Verifying Setup..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js version
echo -n "Checking Node.js version... "
NODE_VERSION=$(node --version 2>/dev/null)
if [ $? -eq 0 ]; then
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -ge 18 ]; then
        echo -e "${GREEN}✓${NC} $NODE_VERSION"
    else
        echo -e "${RED}✗${NC} $NODE_VERSION (need v18.0.0+)"
        exit 1
    fi
else
    echo -e "${RED}✗${NC} Node.js not found"
    exit 1
fi

# Check npm version
echo -n "Checking npm version... "
NPM_VERSION=$(npm --version 2>/dev/null)
if [ $? -eq 0 ]; then
    NPM_MAJOR=$(echo $NPM_VERSION | cut -d'.' -f1)
    if [ "$NPM_MAJOR" -ge 9 ]; then
        echo -e "${GREEN}✓${NC} $NPM_VERSION"
    else
        echo -e "${RED}✗${NC} $NPM_VERSION (need 9.0.0+)"
        exit 1
    fi
else
    echo -e "${RED}✗${NC} npm not found"
    exit 1
fi

# Check if node_modules exists
echo -n "Checking dependencies... "
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} Installed"
else
    echo -e "${YELLOW}⚠${NC} Not installed - run 'npm install'"
fi

# Check if .env.local exists
echo -n "Checking .env.local... "
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✓${NC} Found"

    # Check for required API keys
    echo ""
    echo "Checking API keys in .env.local:"

    # OpenAI
    if grep -q "CHATGPT_API_KEY=sk-" .env.local 2>/dev/null; then
        echo -e "  OpenAI:      ${GREEN}✓${NC} Configured"
    else
        echo -e "  OpenAI:      ${YELLOW}⚠${NC} Not configured"
    fi

    # Anthropic
    if grep -q "ANTHROPIC_API_KEY=sk-ant-" .env.local 2>/dev/null; then
        echo -e "  Anthropic:   ${GREEN}✓${NC} Configured"
    else
        echo -e "  Anthropic:   ${YELLOW}⚠${NC} Not configured"
    fi

    # Perplexity (optional)
    if grep -q "PERPLEXITY_API_KEY=pplx-" .env.local 2>/dev/null; then
        echo -e "  Perplexity:  ${GREEN}✓${NC} Configured"
    else
        echo -e "  Perplexity:  ${YELLOW}⚠${NC} Not configured (optional)"
    fi

    # Currency (optional)
    if grep -q "OPENEXCHANGERATES_API_KEY=" .env.local 2>/dev/null && ! grep -q "OPENEXCHANGERATES_API_KEY=$" .env.local; then
        echo -e "  Currency:    ${GREEN}✓${NC} Configured"
    else
        echo -e "  Currency:    ${YELLOW}⚠${NC} Not configured (optional)"
    fi

else
    echo -e "${YELLOW}⚠${NC} Not found"
    echo -e "  ${YELLOW}→${NC} Copy .env.example to .env.local and add your API keys"
fi

# Check if port 3000 is available
echo ""
echo -n "Checking port 3000... "
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠${NC} Port in use"
    echo -e "  ${YELLOW}→${NC} Kill with: lsof -ti:3000 | xargs kill"
else
    echo -e "${GREEN}✓${NC} Available"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if at least one AI API key is configured
HAS_OPENAI=$(grep -q "CHATGPT_API_KEY=sk-" .env.local 2>/dev/null && echo "yes" || echo "no")
HAS_ANTHROPIC=$(grep -q "ANTHROPIC_API_KEY=sk-ant-" .env.local 2>/dev/null && echo "yes" || echo "no")

if [ "$HAS_OPENAI" = "yes" ] || [ "$HAS_ANTHROPIC" = "yes" ]; then
    echo -e "${GREEN}✓ Ready to run!${NC}"
    echo ""
    echo "Start the app with:"
    echo "  npm run dev"
    echo ""
    echo "Optional: Seed cache for faster demo"
    echo "  npm run cache:seed"
else
    echo -e "${YELLOW}⚠ Setup incomplete${NC}"
    echo ""
    echo "You need at least one AI API key:"
    echo "  1. Copy: cp .env.example .env.local"
    echo "  2. Edit .env.local and add:"
    echo "     - CHATGPT_API_KEY (OpenAI)"
    echo "     OR"
    echo "     - ANTHROPIC_API_KEY (Anthropic)"
    echo ""
    echo "Get keys from:"
    echo "  • OpenAI: https://platform.openai.com/api-keys"
    echo "  • Anthropic: https://console.anthropic.com/"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
