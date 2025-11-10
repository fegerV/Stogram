#!/bin/bash

# Installation Check Script for Stogram
# Verifies that all components are properly installed and configured

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Function to check system dependencies
check_system_dependencies() {
    print_header "Checking System Dependencies"
    
    # Check Node.js
    if command_exists node; then
        NODE_VERSION=$(node --version)
        print_status "Node.js: $NODE_VERSION"
        
        # Check version
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_MAJOR" -ge 18 ]; then
            print_status "Node.js version is compatible"
        else
            print_warning "Node.js version should be 18 or higher"
        fi
    else
        print_error "Node.js is not installed"
    fi
    
    # Check npm
    if command_exists npm; then
        NPM_VERSION=$(npm --version)
        print_status "npm: $NPM_VERSION"
    else
        print_error "npm is not installed"
    fi
    
    # Check Docker
    if command_exists docker; then
        DOCKER_VERSION=$(docker --version)
        print_status "Docker: $DOCKER_VERSION"
        
        # Check if Docker is running
        if docker info >/dev/null 2>&1; then
            print_status "Docker daemon is running"
        else
            print_warning "Docker daemon is not running"
        fi
    else
        print_error "Docker is not installed"
    fi
    
    # Check Docker Compose
    if command_exists docker-compose || docker compose version >/dev/null 2>&1; then
        if command_exists docker-compose; then
            COMPOSE_VERSION=$(docker-compose --version)
        else
            COMPOSE_VERSION=$(docker compose version)
        fi
        print_status "Docker Compose: $COMPOSE_VERSION"
    else
        print_error "Docker Compose is not installed"
    fi
    
    # Check PM2 (production only)
    if [ -f "$PROJECT_DIR/.env" ] && grep -q "NODE_ENV=production" "$PROJECT_DIR/.env"; then
        if command_exists pm2; then
            PM2_VERSION=$(pm2 --version)
            print_status "PM2: $PM2_VERSION"
        else
            print_warning "PM2 is not installed (recommended for production)"
        fi
    fi
    
    # Check Nginx (production only)
    if [ -f "$PROJECT_DIR/.env" ] && grep -q "NODE_ENV=production" "$PROJECT_DIR/.env"; then
        if command_exists nginx; then
            NGINX_VERSION=$(nginx -v 2>&1)
            print_status "Nginx: $NGINX_VERSION"
        else
            print_warning "Nginx is not installed (recommended for production)"
        fi
    fi
}

# Function to check project structure
check_project_structure() {
    print_header "Checking Project Structure"
    
    # Check required directories
    local dirs=("client" "server" "docs")
    for dir in "${dirs[@]}"; do
        if [ -d "$PROJECT_DIR/$dir" ]; then
            print_status "Directory '$dir' exists"
        else
            print_error "Directory '$dir' is missing"
        fi
    done
    
    # Check required files
    local files=("package.json" "docker-compose.yml" ".env.example" "install-ubuntu.sh")
    for file in "${files[@]}"; do
        if [ -f "$PROJECT_DIR/$file" ]; then
            print_status "File '$file' exists"
        else
            print_error "File '$file' is missing"
        fi
    done
    
    # Check client package.json
    if [ -f "$PROJECT_DIR/client/package.json" ]; then
        print_status "Client package.json exists"
    else
        print_error "Client package.json is missing"
    fi
    
    # Check server package.json
    if [ -f "$PROJECT_DIR/server/package.json" ]; then
        print_status "Server package.json exists"
    else
        print_error "Server package.json is missing"
    fi
}

# Function to check environment configuration
check_environment() {
    print_header "Checking Environment Configuration"
    
    if [ -f "$PROJECT_DIR/.env" ]; then
        print_status ".env file exists"
        
        # Check required environment variables
        local required_vars=("JWT_SECRET" "DOMAIN" "POSTGRES_USER" "POSTGRES_PASSWORD" "POSTGRES_DB")
        for var in "${required_vars[@]}"; do
            if grep -q "^$var=" "$PROJECT_DIR/.env"; then
                value=$(grep "^$var=" "$PROJECT_DIR/.env" | cut -d'=' -f2)
                if [ "$value" = "your-secret-key-change-in-production" ] || [ -z "$value" ]; then
                    print_warning "Environment variable $var is not configured"
                else
                    print_status "Environment variable $var is configured"
                fi
            else
                print_error "Environment variable $var is missing"
            fi
        done
    else
        print_error ".env file does not exist"
    fi
}

# Function to check node modules
check_node_modules() {
    print_header "Checking Node Modules"
    
    # Check root node_modules
    if [ -d "$PROJECT_DIR/node_modules" ]; then
        print_status "Root node_modules exists"
    else
        print_error "Root node_modules is missing"
        print_warning "Run 'npm install' in project root"
    fi
    
    # Check client node_modules
    if [ -d "$PROJECT_DIR/client/node_modules" ]; then
        print_status "Client node_modules exists"
    else
        print_error "Client node_modules is missing"
        print_warning "Run 'npm install' in client directory"
    fi
    
    # Check server node_modules
    if [ -d "$PROJECT_DIR/server/node_modules" ]; then
        print_status "Server node_modules exists"
    else
        print_error "Server node_modules is missing"
        print_warning "Run 'npm install' in server directory"
    fi
}

# Function to check Docker services
check_docker_services() {
    print_header "Checking Docker Services"
    
    cd "$PROJECT_DIR"
    
    # Check if containers are running
    if command_exists docker && docker info >/dev/null 2>&1; then
        # Check PostgreSQL container
        if docker ps --filter "name=stogram-postgres" --format "table {{.Names}}" | grep -q "stogram-postgres"; then
            print_status "PostgreSQL container is running"
        else
            print_warning "PostgreSQL container is not running"
            print_warning "Run 'docker-compose up -d postgres' to start it"
        fi
        
        # Check Redis container
        if docker ps --filter "name=stogram-redis" --format "table {{.Names}}" | grep -q "stogram-redis"; then
            print_status "Redis container is running"
        else
            print_warning "Redis container is not running"
            print_warning "Run 'docker-compose up -d redis' to start it"
        fi
        
        # Check server container (production)
        if docker ps --filter "name=stogram-server" --format "table {{.Names}}" | grep -q "stogram-server"; then
            print_status "Server container is running"
        else
            print_warning "Server container is not running (production mode)"
        fi
        
        # Check client container (production)
        if docker ps --filter "name=stogram-client" --format "table {{.Names}}" | grep -q "stogram-client"; then
            print_status "Client container is running"
        else
            print_warning "Client container is not running (production mode)"
        fi
    else
        print_warning "Docker is not available"
    fi
}

# Function to check database connection
check_database() {
    print_header "Checking Database Connection"
    
    if [ -d "$PROJECT_DIR/server" ] && [ -f "$PROJECT_DIR/server/node_modules/.prisma/client" ]; then
        cd "$PROJECT_DIR/server"
        
        # Check if Prisma client is generated
        if [ -d "node_modules/.prisma/client" ]; then
            print_status "Prisma client is generated"
        else
            print_error "Prisma client is not generated"
            print_warning "Run 'npx prisma generate' in server directory"
        fi
        
        # Try to connect to database
        if command_exists docker && docker ps --filter "name=stogram-postgres" --format "table {{.Names}}" | grep -q "stogram-postgres"; then
            print_status "Database container is running"
            
            # Try to run a simple database query
            if npx prisma db pull --force >/dev/null 2>&1; then
                print_status "Database connection is working"
            else
                print_warning "Database connection may have issues"
            fi
        else
            print_warning "Database container is not running"
        fi
        
        cd "$PROJECT_DIR"
    else
        print_warning "Cannot check database - server dependencies not installed"
    fi
}

# Function to check built files
check_build_files() {
    print_header "Checking Build Files"
    
    # Check server build
    if [ -d "$PROJECT_DIR/server/dist" ]; then
        print_status "Server build directory exists"
        
        if [ -f "$PROJECT_DIR/server/dist/index.js" ]; then
            print_status "Server build files are present"
        else
            print_warning "Server build files may be incomplete"
        fi
    else
        print_warning "Server build directory does not exist"
        print_warning "Run 'npm run build' in server directory"
    fi
    
    # Check client build
    if [ -d "$PROJECT_DIR/client/dist" ]; then
        print_status "Client build directory exists"
        
        if [ -f "$PROJECT_DIR/client/dist/index.html" ]; then
            print_status "Client build files are present"
        else
            print_warning "Client build files may be incomplete"
        fi
    else
        print_warning "Client build directory does not exist"
        print_warning "Run 'npm run build' in client directory"
    fi
}

# Function to check startup scripts
check_startup_scripts() {
    print_header "Checking Startup Scripts"
    
    # Check development script
    if [ -f "$PROJECT_DIR/start-dev.sh" ]; then
        if [ -x "$PROJECT_DIR/start-dev.sh" ]; then
            print_status "Development startup script exists and is executable"
        else
            print_warning "Development startup script exists but is not executable"
        fi
    else
        print_warning "Development startup script does not exist"
    fi
    
    # Check production script
    if [ -f "$PROJECT_DIR/start-prod.sh" ]; then
        if [ -x "$PROJECT_DIR/start-prod.sh" ]; then
            print_status "Production startup script exists and is executable"
        else
            print_warning "Production startup script exists but is not executable"
        fi
    else
        print_warning "Production startup script does not exist"
    fi
}

# Function to check systemd service (production)
check_systemd_service() {
    print_header "Checking Systemd Service"
    
    if [ -f "/etc/systemd/system/stogram.service" ]; then
        print_status "Systemd service file exists"
        
        # Check if service is enabled
        if systemctl is-enabled stogram >/dev/null 2>&1; then
            print_status "Systemd service is enabled"
        else
            print_warning "Systemd service is not enabled"
        fi
        
        # Check if service is running
        if systemctl is-active stogram >/dev/null 2>&1; then
            print_status "Systemd service is running"
        else
            print_warning "Systemd service is not running"
        fi
    else
        print_warning "Systemd service does not exist (production only)"
    fi
}

# Function to check Nginx configuration (production)
check_nginx_configuration() {
    print_header "Checking Nginx Configuration"
    
    if [ -f "/etc/nginx/sites-available/stogram" ] || [ -f "/etc/nginx/sites-available/localhost" ]; then
        print_status "Nginx configuration exists"
        
        # Test Nginx configuration
        if nginx -t >/dev/null 2>&1; then
            print_status "Nginx configuration is valid"
        else
            print_error "Nginx configuration has errors"
        fi
        
        # Check if Nginx is running
        if systemctl is-active nginx >/dev/null 2>&1; then
            print_status "Nginx is running"
        else
            print_warning "Nginx is not running"
        fi
    else
        print_warning "Nginx configuration does not exist (production only)"
    fi
}

# Function to provide recommendations
provide_recommendations() {
    print_header "Recommendations"
    
    echo -e "${BLUE}Based on the check results, here are some recommendations:${NC}"
    echo
    
    # General recommendations
    echo -e "${YELLOW}General:${NC}"
    echo "- Keep all dependencies updated regularly"
    echo "- Monitor log files for any issues"
    echo "- Set up monitoring and alerting"
    echo "- Regular database backups"
    echo "- Implement proper security measures"
    echo
    
    # Development recommendations
    echo -e "${YELLOW}Development:${NC}"
    echo "- Use 'npm run dev' for development server"
    echo "- Check browser console for any client-side errors"
    echo "- Use 'docker-compose logs' to view container logs"
    echo "- Consider using hot reload for faster development"
    echo
    
    # Production recommendations
    echo -e "${YELLOW}Production:${NC}"
    echo "- Set up SSL certificates with Let's Encrypt"
    echo "- Configure firewall rules"
    echo "- Set up log rotation"
    echo "- Monitor system resources (CPU, memory, disk)"
    echo "- Set up automated backups"
    echo "- Consider using a reverse proxy like CloudFlare"
    echo "- Implement rate limiting"
    echo "- Regular security updates"
    echo
    
    # Security recommendations
    echo -e "${YELLOW}Security:${NC}"
    echo "- Change default passwords"
    echo "- Use strong JWT secrets"
    echo "- Implement proper CORS configuration"
    echo "- Set up security headers"
    echo "- Regular security audits"
    echo "- Keep all packages updated"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Main execution
print_header "Stogram Installation Check"
echo "Project Directory: $PROJECT_DIR"
echo "Timestamp: $(date)"
echo

# Run all checks
check_system_dependencies
check_project_structure
check_environment
check_node_modules
check_docker_services
check_database
check_build_files
check_startup_scripts
check_systemd_service
check_nginx_configuration

provide_recommendations

print_header "Check Complete"
echo -e "${GREEN}Installation check completed!${NC}"
echo -e "${YELLOW}Review the warnings and errors above for any issues that need attention.${NC}"