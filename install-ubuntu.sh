#!/bin/bash

# Ubuntu Installation Script for Stogram Messenger
# Supports both test (development) and production environments
# Usage: ./install-ubuntu.sh [--test|--prod] [--skip-deps]

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=""
SKIP_DEPS=false
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$PROJECT_DIR/install.log"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to detect Ubuntu version
get_ubuntu_version() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        echo "$VERSION_ID"
    else
        echo "unknown"
    fi
}

# Function to install system dependencies
install_system_dependencies() {
    print_header "Installing System Dependencies"
    
    # Update package list
    print_status "Updating package list..."
    sudo apt-get update -y
    
    # Install basic utilities
    print_status "Installing basic utilities..."
    sudo apt-get install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
    
    # Install Node.js 20.x
    if ! command_exists node; then
        print_status "Installing Node.js 20.x..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    else
        NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -lt 18 ]; then
            print_warning "Node.js version is too old. Installing Node.js 20.x..."
            curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
            sudo apt-get install -y nodejs
        else
            print_status "Node.js $(node -v) is already installed"
        fi
    fi
    
    # Install Docker
    if ! command_exists docker; then
        print_status "Installing Docker..."
        # Remove old versions
        sudo apt-get remove -y docker docker-engine docker.io containerd runc || true
        
        # Add Docker's official GPG key
        sudo mkdir -p /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        
        # Set up the repository
        echo \
          "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
          $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
        
        # Install Docker Engine
        sudo apt-get update -y
        sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
        
        # Start and enable Docker
        sudo systemctl start docker
        sudo systemctl enable docker
        
        # Add user to docker group
        sudo usermod -aG docker "$USER"
        print_warning "You may need to log out and log back in to use Docker without sudo"
    else
        print_status "Docker $(docker --version) is already installed"
    fi
    
    # Install PM2 for production
    if [ "$ENVIRONMENT" = "prod" ]; then
        if ! command_exists pm2; then
            print_status "Installing PM2 for process management..."
            sudo npm install -g pm2
        else
            print_status "PM2 $(pm2 --version) is already installed"
        fi
    fi
    
    # Install Nginx for production
    if [ "$ENVIRONMENT" = "prod" ]; then
        if ! command_exists nginx; then
            print_status "Installing Nginx..."
            sudo apt-get install -y nginx
            sudo systemctl start nginx
            sudo systemctl enable nginx
        else
            print_status "Nginx $(nginx -v 2>&1) is already installed"
        fi
    fi
}

# Function to setup environment files
setup_environment() {
    print_header "Setting Up Environment Configuration"
    
    # Copy .env.example to .env if it doesn't exist
    if [ ! -f "$PROJECT_DIR/.env" ]; then
        cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"
        print_status "Created .env file from template"
    else
        print_status ".env file already exists"
    fi
    
    if [ "$ENVIRONMENT" = "test" ]; then
        # Development configuration
        print_status "Configuring for development environment..."
        
        # Generate JWT secret if not set
        if ! grep -q "JWT_SECRET=your-secret-key-change-in-production" "$PROJECT_DIR/.env"; then
            print_status "JWT_SECRET is already configured"
        else
            JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
            sed -i "s/JWT_SECRET=your-secret-key-change-in-production/JWT_SECRET=$JWT_SECRET/" "$PROJECT_DIR/.env"
            print_status "Generated new JWT secret"
        fi
        
        # Set development domain
        sed -i "s/DOMAIN=yourdomain.com/DOMAIN=localhost/" "$PROJECT_DIR/.env"
        
        # Add DATABASE_URL for development
        if ! grep -q "^DATABASE_URL=" "$PROJECT_DIR/.env"; then
            echo "" >> "$PROJECT_DIR/.env"
            echo "# Database URL for development" >> "$PROJECT_DIR/.env"
            echo "DATABASE_URL=postgresql://stogram:stogram_password@localhost:5432/stogram_db" >> "$PROJECT_DIR/.env"
            print_status "Added DATABASE_URL for development"
        fi
        
        # Add Redis URL for development
        if ! grep -q "^REDIS_URL=" "$PROJECT_DIR/.env"; then
            echo "" >> "$PROJECT_DIR/.env"
            echo "# Redis URL for development" >> "$PROJECT_DIR/.env"
            echo "REDIS_URL=redis://localhost:6379" >> "$PROJECT_DIR/.env"
            print_status "Added REDIS_URL for development"
        fi
        
        # Add NODE_ENV for development
        if ! grep -q "^NODE_ENV=" "$PROJECT_DIR/.env"; then
            echo "" >> "$PROJECT_DIR/.env"
            echo "# Node environment" >> "$PROJECT_DIR/.env"
            echo "NODE_ENV=development" >> "$PROJECT_DIR/.env"
            print_status "Added NODE_ENV for development"
        fi
        
    elif [ "$ENVIRONMENT" = "prod" ]; then
        # Production configuration
        print_status "Configuring for production environment..."
        
        # Prompt for domain
        read -p "Enter your domain (e.g., example.com): " DOMAIN
        if [ -n "$DOMAIN" ]; then
            sed -i "s/DOMAIN=yourdomain.com/DOMAIN=$DOMAIN/" "$PROJECT_DIR/.env"
            print_status "Set domain to $DOMAIN"
        fi
        
        # Generate JWT secret if not set
        if grep -q "JWT_SECRET=your-secret-key-change-in-production" "$PROJECT_DIR/.env"; then
            JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
            sed -i "s/JWT_SECRET=your-secret-key-change-in-production/JWT_SECRET=$JWT_SECRET/" "$PROJECT_DIR/.env"
            print_status "Generated new JWT secret for production"
        fi
        
        # Prompt for database credentials
        read -p "Enter PostgreSQL username (default: stogram): " DB_USER
        DB_USER=${DB_USER:-stogram}
        
        read -s -p "Enter PostgreSQL password: " DB_PASSWORD
        echo
        if [ -z "$DB_PASSWORD" ]; then
            DB_PASSWORD=$(openssl rand -base64 32)
            print_warning "Generated random database password: $DB_PASSWORD"
        fi
        
        read -p "Enter PostgreSQL database name (default: stogram_db): " DB_NAME
        DB_NAME=${DB_NAME:-stogram_db}
        
        # Update database configuration
        sed -i "s/POSTGRES_USER=stogram/POSTGRES_USER=$DB_USER/" "$PROJECT_DIR/.env"
        sed -i "s/POSTGRES_PASSWORD=stogram_password/POSTGRES_PASSWORD=$DB_PASSWORD/" "$PROJECT_DIR/.env"
        sed -i "s/POSTGRES_DB=stogram_db/POSTGRES_DB=$DB_NAME/" "$PROJECT_DIR/.env"
        
        # Update docker-compose.yml with new credentials
        sed -i "s/POSTGRES_USER: stogram/POSTGRES_USER: $DB_USER/" "$PROJECT_DIR/docker-compose.yml"
        sed -i "s/POSTGRES_PASSWORD: stogram_password/POSTGRES_PASSWORD: $DB_PASSWORD/" "$PROJECT_DIR/docker-compose.yml"
        sed -i "s/POSTGRES_DB: stogram_db/POSTGRES_DB: $DB_NAME/" "$PROJECT_DIR/docker-compose.yml"
        sed -i "s/postgresql:\/\/stogram:stogram_password@postgres:5432\/stogram_db/postgresql:\/\/$DB_USER:$DB_PASSWORD@postgres:5432\/$DB_NAME/" "$PROJECT_DIR/docker-compose.yml"
        
        # Add DATABASE_URL for production
        if ! grep -q "^DATABASE_URL=" "$PROJECT_DIR/.env"; then
            echo "" >> "$PROJECT_DIR/.env"
            echo "# Database URL for production" >> "$PROJECT_DIR/.env"
            echo "DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME" >> "$PROJECT_DIR/.env"
            print_status "Added DATABASE_URL for production"
        fi
        
        # Add Redis URL for production
        if ! grep -q "^REDIS_URL=" "$PROJECT_DIR/.env"; then
            echo "" >> "$PROJECT_DIR/.env"
            echo "# Redis URL for production" >> "$PROJECT_DIR/.env"
            echo "REDIS_URL=redis://localhost:6379" >> "$PROJECT_DIR/.env"
            print_status "Added REDIS_URL for production"
        fi
        
        # Add NODE_ENV for production
        if ! grep -q "^NODE_ENV=" "$PROJECT_DIR/.env"; then
            echo "" >> "$PROJECT_DIR/.env"
            echo "# Node environment" >> "$PROJECT_DIR/.env"
            echo "NODE_ENV=production" >> "$PROJECT_DIR/.env"
            print_status "Added NODE_ENV for production"
        fi
    fi
}

# Function to install application dependencies
install_application() {
    print_header "Installing Application Dependencies"
    
    cd "$PROJECT_DIR"
    
    # Install root dependencies
    print_status "Installing root dependencies..."
    npm install
    
    # Install server dependencies
    print_status "Installing server dependencies..."
    cd server
    npm install
    
    # Generate Prisma client
    print_status "Generating Prisma client..."
    npx prisma generate
    
    cd ..
    
    # Install client dependencies
    print_status "Installing client dependencies..."
    cd client
    npm install
    
    cd "$PROJECT_DIR"
}

# Function to build application
build_application() {
    print_header "Building Application"
    
    cd "$PROJECT_DIR"
    
    # Build server
    print_status "Building server..."
    cd server
    npm run build
    
    cd ..
    
    # Build client
    print_status "Building client..."
    cd client
    npm run build
    
    cd "$PROJECT_DIR"
}

# Function to setup database
setup_database() {
    print_header "Setting Up Database"
    
    cd "$PROJECT_DIR"
    
    # Create symlink to .env file in server directory for Prisma
    if [ ! -f "$PROJECT_DIR/server/.env" ]; then
        ln -sf "$PROJECT_DIR/.env" "$PROJECT_DIR/server/.env"
        print_status "Created symlink to .env file in server directory"
    fi
    
    # Check if database is running before running migrations
    if [ "$ENVIRONMENT" = "test" ]; then
        print_status "Database setup will be performed when starting the development environment"
        print_warning "Run './start-dev.sh' to start the database and run migrations"
    else
        # For production, try to run migrations (database should be running)
        print_status "Running database migrations..."
        cd server
        npx prisma migrate deploy || npx prisma db push || print_warning "Database migrations failed - please run manually when database is available"
        cd "$PROJECT_DIR"
    fi
}

# Function to create systemd service for production
create_systemd_service() {
    if [ "$ENVIRONMENT" = "prod" ]; then
        print_header "Creating Systemd Service"
        
        SERVICE_CONTENT="[Unit]
Description=Stogram Messenger Server
After=network.target docker.service
Requires=docker.service

[Service]
Type=forking
User=$USER
WorkingDirectory=$PROJECT_DIR
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
TimeoutStartSec=0
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target"
        
        echo "$SERVICE_CONTENT" | sudo tee /etc/systemd/system/stogram.service > /dev/null
        sudo systemctl daemon-reload
        sudo systemctl enable stogram
        
        print_status "Created systemd service 'stogram'"
    fi
}

# Function to setup Nginx for production
setup_nginx() {
    if [ "$ENVIRONMENT" = "prod" ]; then
        print_header "Setting Up Nginx"
        
        # Get domain from .env
        DOMAIN=$(grep "^DOMAIN=" "$PROJECT_DIR/.env" | cut -d'=' -f2)
        
        NGINX_CONFIG="server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL Configuration (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection \"1; mode=block\";
    add_header Strict-Transport-Security \"max-age=63072000; includeSubDomains; preload\";
    
    # Client files
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # API routes
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \"upgrade\";
    }
    
    # Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \"upgrade\";
    }
    
    # File uploads
    client_max_body_size 50M;
    
    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control \"public, immutable\";
    }
}"
        
        echo "$NGINX_CONFIG" | sudo tee "/etc/nginx/sites-available/$DOMAIN" > /dev/null
        sudo ln -sf "/etc/nginx/sites-available/$DOMAIN" "/etc/nginx/sites-enabled/"
        sudo rm -f /etc/nginx/sites-enabled/default
        
        # Test Nginx configuration
        sudo nginx -t
        sudo systemctl reload nginx
        
        print_status "Created Nginx configuration for $DOMAIN"
        print_warning "Remember to obtain SSL certificates with: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
    fi
}

# Function to create startup scripts
create_startup_scripts() {
    print_header "Creating Startup Scripts"
    
    if [ "$ENVIRONMENT" = "test" ]; then
        # Development startup script
        DEV_SCRIPT="$PROJECT_DIR/start-dev.sh"
        cat > "$DEV_SCRIPT" << 'EOF'
#!/bin/bash

# Development startup script for Stogram

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo "Starting Stogram in development mode..."

# Start Docker services (database and Redis)
echo "Starting Docker services..."
docker-compose up -d postgres redis

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 10

# Run database migrations
echo "Running database migrations..."
cd server
npx prisma migrate deploy || npx prisma db push

# Start development servers
echo "Starting development servers..."
cd ..
npm run dev

echo "Stogram development environment is running!"
echo "Client: http://localhost:5173"
echo "Server: http://localhost:3001"
EOF
        chmod +x "$DEV_SCRIPT"
        print_status "Created development startup script: start-dev.sh"
        
    elif [ "$ENVIRONMENT" = "prod" ]; then
        # Production startup script
        PROD_SCRIPT="$PROJECT_DIR/start-prod.sh"
        cat > "$PROD_SCRIPT" << 'EOF'
#!/bin/bash

# Production startup script for Stogram

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo "Starting Stogram in production mode..."

# Start all Docker services
echo "Starting Docker services..."
docker-compose up -d

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 15

# Run database migrations
echo "Running database migrations..."
cd server
npx prisma migrate deploy

echo "Stogram production environment is running!"
echo "Use 'sudo systemctl status stogram' to check service status"
echo "Use 'sudo journalctl -u stogram -f' to view logs"
EOF
        chmod +x "$PROD_SCRIPT"
        print_status "Created production startup script: start-prod.sh"
    fi
}

# Function to display final instructions
display_instructions() {
    print_header "Installation Complete!"
    
    echo -e "${GREEN}Stogram has been successfully installed for $ENVIRONMENT environment.${NC}"
    echo
    
    if [ "$ENVIRONMENT" = "test" ]; then
        echo -e "${BLUE}Development Instructions:${NC}"
        echo "1. To start the development environment:"
        echo "   ./start-dev.sh"
        echo
        echo "2. Access the application:"
        echo "   Client: http://localhost:5173"
        echo "   Server: http://localhost:3001"
        echo
        echo "3. To stop the development environment:"
        echo "   docker-compose down"
        echo
        
    elif [ "$ENVIRONMENT" = "prod" ]; then
        echo -e "${BLUE}Production Instructions:${NC}"
        echo "1. To start the production environment:"
        echo "   sudo systemctl start stogram"
        echo "   or"
        echo "   ./start-prod.sh"
        echo
        echo "2. To check service status:"
        echo "   sudo systemctl status stogram"
        echo
        echo "3. To view logs:"
        echo "   sudo journalctl -u stogram -f"
        echo
        echo "4. To stop the service:"
        echo "   sudo systemctl stop stogram"
        echo
        echo "5. Don't forget to obtain SSL certificates:"
        echo "   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com"
        echo
    fi
    
    echo -e "${YELLOW}Important:${NC}"
    echo "- Check the .env file for configuration"
    echo "- Database and Redis are running in Docker containers"
    echo "- Log files are available at: install.log"
    echo
    
    if [ "$ENVIRONMENT" = "prod" ]; then
        echo -e "${RED}Security Reminder:${NC}"
        echo "- Change default passwords"
        echo "- Configure firewall rules"
        echo "- Set up SSL certificates"
        echo "- Regularly update dependencies"
        echo
    fi
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [--test|--prod] [--skip-deps]"
    echo
    echo "Options:"
    echo "  --test      Install for development/testing environment"
    echo "  --prod      Install for production environment"
    echo "  --skip-deps Skip system dependency installation"
    echo
    echo "Examples:"
    echo "  $0 --test               # Install for development"
    echo "  $0 --prod               # Install for production"
    echo "  $0 --test --skip-deps   # Install for development without system deps"
    echo
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --test)
            ENVIRONMENT="test"
            shift
            ;;
        --prod)
            ENVIRONMENT="prod"
            shift
            ;;
        --skip-deps)
            SKIP_DEPS=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate environment selection
if [ -z "$ENVIRONMENT" ]; then
    echo -e "${RED}Error: Please specify either --test or --prod${NC}"
    show_usage
    exit 1
fi

# Check if running on Ubuntu
if [ ! -f /etc/os-release ] || ! grep -q "ubuntu" /etc/os-release; then
    print_error "This script is designed for Ubuntu systems only"
    exit 1
fi

# Start installation
print_header "Stogram Ubuntu Installation Script"
echo "Environment: $ENVIRONMENT"
echo "Skip Dependencies: $SKIP_DEPS"
echo "Project Directory: $PROJECT_DIR"
echo "Ubuntu Version: $(get_ubuntu_version)"
echo

# Create log file
touch "$LOG_FILE"

# Main installation flow
if [ "$SKIP_DEPS" = false ]; then
    install_system_dependencies
else
    print_status "Skipping system dependency installation"
fi

setup_environment
install_application

if [ "$ENVIRONMENT" = "prod" ]; then
    build_application
fi

setup_database
create_startup_scripts

if [ "$ENVIRONMENT" = "prod" ]; then
    create_systemd_service
    setup_nginx
fi

display_instructions

print_status "Installation completed successfully!"
print_status "Log file saved to: $LOG_FILE"