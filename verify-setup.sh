#!/bin/bash

echo "🔍 Stogram Setup Verification"
echo "=============================="
echo ""

ERRORS=0
WARNINGS=0

# Color codes
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        ERRORS=$((ERRORS + 1))
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    WARNINGS=$((WARNINGS + 1))
}

print_info() {
    echo -e "ℹ️  $1"
}

# Check Node.js
echo "📦 Checking Prerequisites..."
echo ""

if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    print_status 0 "Node.js installed: $NODE_VERSION"
    
    # Check if version is 18 or higher
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
    if [ $NODE_MAJOR -lt 18 ]; then
        print_warning "Node.js version should be 18 or higher"
    fi
else
    print_status 1 "Node.js not installed"
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    print_status 0 "npm installed: $NPM_VERSION"
else
    print_status 1 "npm not installed"
fi

# Check Docker
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    print_status 0 "Docker installed: $DOCKER_VERSION"
else
    print_warning "Docker not installed (optional for development)"
fi

# Check Docker Compose
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    print_status 0 "Docker Compose installed: $COMPOSE_VERSION"
else
    print_warning "Docker Compose not installed (optional for development)"
fi

echo ""
echo "📁 Checking Project Structure..."
echo ""

# Check root files
[ -f "package.json" ] && print_status 0 "Root package.json exists" || print_status 1 "Root package.json missing"
[ -f "docker-compose.yml" ] && print_status 0 "docker-compose.yml exists" || print_status 1 "docker-compose.yml missing"
[ -f ".gitignore" ] && print_status 0 ".gitignore exists" || print_status 1 ".gitignore missing"

echo ""
echo "🖥️  Checking Server..."
echo ""

# Check server structure
[ -d "server" ] && print_status 0 "Server directory exists" || print_status 1 "Server directory missing"
[ -f "server/package.json" ] && print_status 0 "Server package.json exists" || print_status 1 "Server package.json missing"
[ -f "server/tsconfig.json" ] && print_status 0 "Server tsconfig.json exists" || print_status 1 "Server tsconfig.json missing"
[ -f "server/prisma/schema.prisma" ] && print_status 0 "Prisma schema exists" || print_status 1 "Prisma schema missing"
[ -f "server/src/index.ts" ] && print_status 0 "Server entry point exists" || print_status 1 "Server entry point missing"

# Check server environment
if [ -f "server/.env" ]; then
    print_status 0 "Server .env file exists"
    
    # Check for required variables
    if grep -q "JWT_SECRET" server/.env; then
        print_status 0 "JWT_SECRET configured"
    else
        print_warning "JWT_SECRET not found in server/.env"
    fi
    
    if grep -q "DATABASE_URL" server/.env; then
        print_status 0 "DATABASE_URL configured"
    else
        print_warning "DATABASE_URL not found in server/.env"
    fi
else
    print_warning "Server .env file missing (copy from .env.example)"
fi

# Check if node_modules exists
if [ -d "server/node_modules" ]; then
    print_status 0 "Server dependencies installed"
else
    print_warning "Server dependencies not installed (run: cd server && npm install)"
fi

echo ""
echo "💻 Checking Client..."
echo ""

# Check client structure
[ -d "client" ] && print_status 0 "Client directory exists" || print_status 1 "Client directory missing"
[ -f "client/package.json" ] && print_status 0 "Client package.json exists" || print_status 1 "Client package.json missing"
[ -f "client/tsconfig.json" ] && print_status 0 "Client tsconfig.json exists" || print_status 1 "Client tsconfig.json missing"
[ -f "client/vite.config.ts" ] && print_status 0 "Vite config exists" || print_status 1 "Vite config missing"
[ -f "client/src/main.tsx" ] && print_status 0 "Client entry point exists" || print_status 1 "Client entry point missing"
[ -f "client/src/App.tsx" ] && print_status 0 "App component exists" || print_status 1 "App component missing"

# Check client environment
if [ -f "client/.env" ]; then
    print_status 0 "Client .env file exists"
else
    print_warning "Client .env file missing (copy from .env.example)"
fi

# Check if node_modules exists
if [ -d "client/node_modules" ]; then
    print_status 0 "Client dependencies installed"
else
    print_warning "Client dependencies not installed (run: cd client && npm install)"
fi

echo ""
echo "📚 Checking Documentation..."
echo ""

[ -f "README.md" ] && print_status 0 "README.md exists" || print_status 1 "README.md missing"
[ -f "USER_GUIDE.md" ] && print_status 0 "USER_GUIDE.md exists" || print_warning "USER_GUIDE.md missing"
[ -f "DEPLOYMENT.md" ] && print_status 0 "DEPLOYMENT.md exists" || print_warning "DEPLOYMENT.md missing"
[ -f "FEATURES.md" ] && print_status 0 "FEATURES.md exists" || print_warning "FEATURES.md missing"

echo ""
echo "🔧 Checking Configuration Files..."
echo ""

[ -f ".env.example" ] && print_status 0 ".env.example exists" || print_warning ".env.example missing"
[ -f "server/.env.example" ] && print_status 0 "server/.env.example exists" || print_warning "server/.env.example missing"
[ -f "client/.env.example" ] && print_status 0 "client/.env.example exists" || print_warning "client/.env.example missing"

echo ""
echo "=============================="
echo "📊 Verification Summary"
echo "=============================="
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ Perfect! Everything looks good!${NC}"
    echo ""
    echo "🚀 You're ready to start:"
    echo ""
    echo "   Option 1 - Docker:"
    echo "   $ ./quick-start.sh"
    echo ""
    echo "   Option 2 - Local:"
    echo "   $ npm run install:all"
    echo "   $ docker-compose up -d postgres redis"
    echo "   $ cd server && npx prisma migrate dev && cd .."
    echo "   $ npm run dev"
    echo ""
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Setup is mostly complete with $WARNINGS warning(s)${NC}"
    echo ""
    echo "Please review the warnings above."
    echo "Most warnings are optional or can be fixed easily."
    echo ""
elif [ $ERRORS -gt 0 ]; then
    echo -e "${RED}❌ Found $ERRORS error(s) and $WARNINGS warning(s)${NC}"
    echo ""
    echo "Please fix the errors above before proceeding."
    echo ""
    echo "Common fixes:"
    echo "  • Install Node.js 18+: https://nodejs.org/"
    echo "  • Install missing dependencies: npm run install:all"
    echo "  • Copy environment files: cp server/.env.example server/.env"
    echo "  • Check project structure: ensure all files are present"
    echo ""
fi

echo "📖 For more help, see:"
echo "   • README.md - Project overview"
echo "   • DEPLOYMENT.md - Setup instructions"
echo "   • USER_GUIDE.md - Usage guide"
echo ""

exit $ERRORS
