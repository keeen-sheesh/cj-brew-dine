#!/bin/bash
# Quick Setup Script for Restaurant Inventory Management System

echo "🍽️  Restaurant Inventory Management System - Setup"
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Install dependencies
echo -e "\n${BLUE}Step 1: Installing dependencies...${NC}"
composer install
npm install

# Step 2: Environment setup
echo -e "\n${BLUE}Step 2: Setting up environment...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✓${NC} .env file created"
else
    echo -e "${YELLOW}!${NC} .env file already exists"
fi

# Step 3: Generate app key
echo -e "\n${BLUE}Step 3: Generating application key...${NC}"
php artisan key:generate

# Step 4: Database setup
echo -e "\n${BLUE}Step 4: Setting up database...${NC}"
php artisan migrate --force
echo -e "${GREEN}✓${NC} Database migrations completed"

# Step 5: Seed demo data (optional)
read -p "Would you like to seed demo data? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    php artisan db:seed
    echo -e "${GREEN}✓${NC} Demo data seeded"
fi

# Step 6: Build frontend assets
echo -e "\n${BLUE}Step 5: Building frontend assets...${NC}"
npm run build
echo -e "${GREEN}✓${NC} Frontend build completed"

echo -e "\n${GREEN}✓ Setup Complete!${NC}"
echo -e "\n${BLUE}Next Steps:${NC}"
echo "1. Start Laravel: php artisan serve"
echo "2. Start Vite: npm run dev"
echo "3. Start Queue: php artisan queue:listen"
echo "4. Or use: npm run dev-server (requires concurrently)"
echo -e "\n${BLUE}Access Application:${NC}"
echo "URL: http://localhost:8000"
echo "Default Admin: admin@example.com / password"
echo -e "\n${YELLOW}Documentation: Read INVENTORY_SYSTEM_DOCS.md${NC}"
