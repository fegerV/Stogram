#!/bin/bash

# Test Data Setup Script
# This script sets up test users and chats for development

set -e

echo "🚀 Stogram Test Data Setup Script"
echo "=================================="
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if we're in the server directory
if [ ! -f "package.json" ] || [ ! -d "src" ]; then
    print_error "Please run this script from the server directory"
    exit 1
fi

print_status "Running from server directory ✓"

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found"
    print_info "Creating .env from .env.example..."
    cp .env.example .env
    print_status "Created .env file ✓"
    print_warning "Please edit .env file with your database configuration"
    echo
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_info "Installing dependencies..."
    npm install
    print_status "Dependencies installed ✓"
    echo
fi

# Check if Prisma client is generated
if [ ! -d "node_modules/.prisma" ]; then
    print_info "Generating Prisma client..."
    npm run prisma:generate
    print_status "Prisma client generated ✓"
    echo
fi

# Test database connection
print_info "Testing database connection..."
if npm run list-test-users 2>/dev/null | grep -q "Database connection established"; then
    print_status "Database connection successful ✓"
else
    print_error "Database connection failed"
    print_info "Please ensure:"
    echo "  1. PostgreSQL server is running"
    echo "  2. DATABASE_URL in .env is correct"
    echo "  3. Database exists and migrations are applied"
    echo
    print_info "Try running: npm run prisma:migrate"
    exit 1
fi

echo

# Ask what to do
echo "What would you like to do?"
echo "1) Create test users only"
echo "2) Create test chats only (requires users)"
echo "3) Create both users and chats"
echo "4) List current test users"
echo "5) Clean up test data (delete all test users and chats)"
echo
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        print_info "Creating test users..."
        npm run create-test-users
        ;;
    2)
        print_info "Creating test chats..."
        npm run create-test-chats
        ;;
    3)
        print_info "Creating test users and chats..."
        npm run setup-test-data
        ;;
    4)
        print_info "Listing test users..."
        npm run list-test-users
        ;;
    5)
        print_warning "This will delete all test users (@test.com emails) and related data!"
        read -p "Are you sure? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            print_info "Cleaning up test data..."
            # This would require a cleanup script
            print_error "Cleanup script not implemented yet"
        else
            print_info "Cleanup cancelled"
        fi
        ;;
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

echo
print_status "Script completed! ✓"

# Show next steps
echo
echo "Next steps:"
echo "- Start the development server: npm run dev"
echo "- View test users: npm run list-test-users"
echo "- Use any test user with password: password123"
echo
print_info "Test Login Credentials:"
echo "  Email: john.doe@test.com"
echo "  Password: password123"
echo
print_info "For more options, see: src/scripts/README.md"