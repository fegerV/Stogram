#!/bin/bash

# Railway Deployment Setup Script for Stogram
# This script helps set up Railway deployment

set -e

echo "🚀 Stogram Railway Deployment Setup"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "ℹ️  $1"
}

# Check if Railway CLI is installed
check_railway_cli() {
    if ! command -v railway &> /dev/null; then
        print_warning "Railway CLI not found. Installing..."
        npm install -g @railway/cli
        print_success "Railway CLI installed"
    else
        print_success "Railway CLI found"
    fi
}

# Generate JWT secret
generate_jwt_secret() {
    print_info "Generating JWT secret..."
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    echo "Your JWT Secret: $JWT_SECRET"
    echo "Please save this secret in your Railway environment variables."
}

# Check if required files exist
check_required_files() {
    print_info "Checking required files..."
    
    required_files=("railway.json" "Procfile" "package.json")
    
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            print_success "$file found"
        else
            print_error "$file not found"
            exit 1
        fi
    done
}

# Install dependencies
install_dependencies() {
    print_info "Installing dependencies..."
    npm run install:all
    print_success "Dependencies installed"
}

# Build application
build_application() {
    print_info "Building application..."
    npm run build
    print_success "Application built"
}

# Main setup flow
main() {
    echo "Starting Railway setup for Stogram..."
    echo
    
    # Check prerequisites
    check_required_files
    check_railway_cli
    
    echo
    print_info "Installing dependencies and building application..."
    install_dependencies
    build_application
    
    echo
    print_info "Generating configuration..."
    generate_jwt_secret
    
    echo
    print_success "Setup complete! 🎉"
    echo
    echo "Next steps:"
    echo "1. Run 'railway login' to authenticate"
    echo "2. Run 'railway new' to create a new project"
    echo "3. Run 'railway up' to deploy"
    echo "4. Add PostgreSQL service in Railway dashboard"
    echo "5. Set environment variables in Railway dashboard"
    echo
    echo "Required environment variables:"
    echo "- NODE_ENV=production"
    echo "- JWT_SECRET=your-generated-secret"
    echo "- DOMAIN=your-app.railway.app"
    echo "- DATABASE_URL (auto-added by Railway)"
    echo
    echo "For detailed instructions, see RAILWAY_DEPLOYMENT.md"
}

# Run main function
main "$@"