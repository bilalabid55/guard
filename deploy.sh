#!/bin/bash

# SiteGround Deployment Script
# This script automates the deployment process

echo "🚀 Starting deployment process..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first using NVM.${NC}"
    echo "Run: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    exit 1
fi

echo -e "${GREEN}✓ Node.js found: $(node --version)${NC}"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⚠ PM2 is not installed. Installing PM2...${NC}"
    npm install -g pm2
fi

echo -e "${GREEN}✓ PM2 found${NC}"

# Install server dependencies
echo -e "${YELLOW}📦 Installing server dependencies...${NC}"
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install server dependencies${NC}"
    exit 1
fi

# Install client dependencies
echo -e "${YELLOW}📦 Installing client dependencies...${NC}"
cd client
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install client dependencies${NC}"
    exit 1
fi

# Build React app
echo -e "${YELLOW}🔨 Building React application...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to build React application${NC}"
    exit 1
fi

cd ..

# Create logs directory
mkdir -p logs

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠ .env file not found. Creating from env.example...${NC}"
    if [ -f env.example ]; then
        cp env.example .env
        echo -e "${YELLOW}⚠ Please edit .env file with your production values${NC}"
    else
        echo -e "${RED}❌ env.example file not found. Please create .env manually${NC}"
        exit 1
    fi
fi

# Stop existing PM2 process if running
echo -e "${YELLOW}🛑 Stopping existing PM2 processes...${NC}"
pm2 stop guardss-app 2>/dev/null || true
pm2 delete guardss-app 2>/dev/null || true

# Start application with PM2
echo -e "${YELLOW}🚀 Starting application with PM2...${NC}"
pm2 start ecosystem.config.js --env production

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to start application with PM2${NC}"
    exit 1
fi

# Save PM2 configuration
pm2 save

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo "📊 Application status:"
pm2 status
echo ""
echo "📝 Useful commands:"
echo "  - View logs: pm2 logs"
echo "  - Monitor: pm2 monit"
echo "  - Restart: pm2 restart guardss-app"
echo "  - Stop: pm2 stop guardss-app"
echo ""
echo -e "${YELLOW}⚠ Don't forget to:${NC}"
echo "  1. Configure Apache .htaccess for reverse proxy"
echo "  2. Set up PM2 startup script: pm2 startup"
echo "  3. Verify your .env file has correct production values"



