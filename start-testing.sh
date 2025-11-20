#!/bin/bash

# Directus Usage Analytics - Testing Environment Setup Script
# This script builds the extension and starts a local Directus instance for testing

set -e  # Exit on error

echo "🚀 Directus Usage Analytics - Testing Environment Setup"
echo "======================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check prerequisites
echo -e "${BLUE}📋 Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18.x or higher.${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. Please install npm.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites met${NC}"
echo ""

# Step 2: Install dependencies (if needed)
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installing dependencies...${NC}"
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
    echo ""
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
    echo ""
fi

# Step 3: Build extension
echo -e "${BLUE}🔨 Building extension...${NC}"
npm run build

if [ ! -f "dist/api.js" ] || [ ! -f "dist/app.js" ]; then
    echo -e "${RED}❌ Build failed - dist files not created${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Extension built successfully${NC}"
echo -e "   - dist/api.js ($(du -h dist/api.js | cut -f1))"
echo -e "   - dist/app.js ($(du -h dist/app.js | cut -f1))"
echo ""

# Step 4: Stop any existing containers
echo -e "${BLUE}🛑 Stopping existing containers (if any)...${NC}"
docker-compose down 2>/dev/null || true
echo ""

# Step 5: Start Docker containers
echo -e "${BLUE}🐳 Starting Docker containers...${NC}"
docker-compose up -d

echo -e "${GREEN}✅ Containers started${NC}"
echo ""

# Step 6: Wait for Directus to be ready
echo -e "${BLUE}⏳ Waiting for Directus to be ready...${NC}"
echo -e "${YELLOW}   This may take 30-60 seconds for first-time setup...${NC}"

MAX_ATTEMPTS=60
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -s http://localhost:8055/server/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Directus is ready!${NC}"
        break
    fi

    ATTEMPT=$((ATTEMPT + 1))
    echo -ne "   Attempt $ATTEMPT/$MAX_ATTEMPTS...\r"
    sleep 2
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo -e "${RED}❌ Directus failed to start within timeout${NC}"
    echo -e "${YELLOW}📋 Check logs with: docker-compose logs directus${NC}"
    exit 1
fi

echo ""
echo ""
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo "======================================================="
echo ""
echo -e "${BLUE}📍 Access Points:${NC}"
echo -e "   Directus Admin: ${YELLOW}http://localhost:8055${NC}"
echo -e "   Database:       ${YELLOW}localhost:5432${NC}"
echo ""
echo -e "${BLUE}🔑 Login Credentials:${NC}"
echo -e "   Email:    ${YELLOW}admin@example.com${NC}"
echo -e "   Password: ${YELLOW}admin123${NC}"
echo ""
echo -e "${BLUE}📊 Find the Extension:${NC}"
echo "   1. Open http://localhost:8055 in your browser"
echo "   2. Login with credentials above"
echo "   3. Go to Settings (gear icon) → Usage Analytics"
echo ""
echo -e "${BLUE}📖 Testing Guide:${NC}"
echo -e "   Read ${YELLOW}TESTING.md${NC} for comprehensive testing checklist"
echo ""
echo -e "${BLUE}🛠️  Useful Commands:${NC}"
echo -e "   View logs:      ${YELLOW}docker-compose logs -f directus${NC}"
echo -e "   Restart:        ${YELLOW}docker-compose restart directus${NC}"
echo -e "   Stop:           ${YELLOW}docker-compose down${NC}"
echo -e "   Rebuild:        ${YELLOW}npm run build && docker-compose restart directus${NC}"
echo ""
echo -e "${GREEN}Happy Testing! 🚀${NC}"
