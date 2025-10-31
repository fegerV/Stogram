# 🚀 Stogram Deployment Guide

This comprehensive guide covers deploying Stogram in various environments, from local development to production cloud infrastructure.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Local Development](#local-development)
4. [Docker Deployment](#docker-deployment)
5. [Production Deployment](#production-deployment)
6. [Cloud Platforms](#cloud-platforms)
7. [Database Setup](#database-setup)
8. [SSL/TLS Configuration](#ssltls-configuration)
9. [Monitoring & Maintenance](#monitoring--maintenance)
10. [Troubleshooting](#troubleshooting)

---

## 📦 Prerequisites

### Required Software

- **Node.js** 18.x or higher
- **npm** 9.x or higher
- **PostgreSQL** 15.x or higher
- **Redis** 7.x or higher (recommended)
- **Docker** 24.x or higher (for containerized deployment)
- **Docker Compose** 2.x or higher
- **Git** for version control

### System Requirements

#### Minimum (Development)
- 2 CPU cores
- 4GB RAM
- 10GB storage
- Ubuntu 20.04 / macOS 11+ / Windows 10+

#### Recommended (Production)
- 4+ CPU cores
- 8GB+ RAM
- 50GB+ SSD storage
- Ubuntu 22.04 LTS (server)

---

## ⚙️ Environment Configuration

### Server Environment Variables

Create `server/.env` file:

```bash
# Server Configuration
NODE_ENV=production
PORT=3001
CLIENT_URL=https://yourdomain.com

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/stogram_db

# Redis Configuration (Optional)
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
JWT_EXPIRES_IN=7d

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# WebRTC Configuration (Optional)
TURN_SERVER_URL=turn:yourturnserver.com:3478
TURN_SERVER_USERNAME=username
TURN_SERVER_CREDENTIAL=password

# SMTP Configuration (Optional - for email features)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@stogram.com
```

### Client Environment Variables

Create `client/.env` file:

```bash
# API Configuration
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=https://api.yourdomain.com

# Optional: Analytics
VITE_ANALYTICS_ID=your-analytics-id
```

### Generate Secure JWT Secret

```bash
# Generate a secure random string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 💻 Local Development

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd stogram
```

### Step 2: Install Dependencies

```bash
# Install root dependencies
npm install

# Install all workspace dependencies
npm run install:all
```

### Step 3: Set Up Environment Files

```bash
# Server environment
cp server/.env.example server/.env

# Client environment
cp client/.env.example client/.env

# Edit the files with your configuration
nano server/.env
nano client/.env
```

### Step 4: Start Database Services

#### Option A: Using Docker Compose

```bash
# Start PostgreSQL and Redis only
docker-compose up -d postgres redis
```

#### Option B: Local Installation

**PostgreSQL:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS (Homebrew)
brew install postgresql@15
brew services start postgresql@15

# Create database
psql postgres
CREATE DATABASE stogram_db;
CREATE USER stogram WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE stogram_db TO stogram;
\q
```

**Redis:**
```bash
# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis-server

# macOS (Homebrew)
brew install redis
brew services start redis
```

### Step 5: Set Up Database Schema

```bash
cd server

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# (Optional) Seed database with test data
npx prisma db seed

cd ..
```

### Step 6: Start Development Servers

```bash
# Start both client and server concurrently
npm run dev
```

Or start them separately:

```bash
# Terminal 1 - Server
npm run dev:server

# Terminal 2 - Client
npm run dev:client
```

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/health
- **Prisma Studio** (Database GUI): `cd server && npx prisma studio`

---

## 🐳 Docker Deployment

### Quick Start with Docker Compose

#### Step 1: Configure Environment

```bash
# Copy and edit environment file
cp .env.example .env
nano .env
```

#### Step 2: Build and Start Containers

```bash
# Build images and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

#### Step 3: Run Database Migrations

```bash
# Run migrations inside server container
docker-compose exec server npx prisma migrate deploy
```

#### Step 4: Access Application

- **Application**: http://localhost
- **API**: http://localhost:3001

### Docker Compose Services

The `docker-compose.yml` includes:

1. **postgres**: PostgreSQL database
2. **redis**: Redis cache (optional)
3. **server**: Node.js backend API
4. **client**: React frontend (Nginx)

### Docker Commands Reference

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart a service
docker-compose restart server

# View logs
docker-compose logs -f server

# Execute command in container
docker-compose exec server sh

# Remove all containers and volumes
docker-compose down -v

# Rebuild specific service
docker-compose up -d --build server
```

### Production Docker Configuration

For production, update `docker-compose.yml`:

```yaml
services:
  server:
    environment:
      NODE_ENV: production
      # Use secrets management
    restart: always
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

---

## 🌐 Production Deployment

### Server Setup (Ubuntu 22.04)

#### Step 1: Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y git curl wget ufw

# Configure firewall
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Create application user
sudo adduser stogram
sudo usermod -aG sudo stogram
```

#### Step 2: Install Node.js

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

#### Step 3: Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start and enable service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
CREATE DATABASE stogram_db;
CREATE USER stogram WITH PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE stogram_db TO stogram;
\q
```

#### Step 4: Install Redis (Optional)

```bash
sudo apt install -y redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

#### Step 5: Clone and Setup Application

```bash
# Switch to application user
su - stogram

# Clone repository
git clone <repository-url> /home/stogram/stogram
cd /home/stogram/stogram

# Install dependencies
npm run install:all

# Configure environment
cp server/.env.example server/.env
cp client/.env.example client/.env

# Edit with production values
nano server/.env
nano client/.env
```

#### Step 6: Build Application

```bash
# Build client
cd client
npm run build
cd ..

# Build server
cd server
npm run build
npx prisma generate
npx prisma migrate deploy
cd ..
```

#### Step 7: Set Up Process Manager (PM2)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start server
cd server
pm2 start dist/index.js --name stogram-server

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup
# Run the command that PM2 outputs

# Monitor application
pm2 status
pm2 logs stogram-server
```

#### Step 8: Set Up Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/stogram
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect to HTTPS (after SSL setup)
    # return 301 https://$server_name$request_uri;

    # Client files
    root /home/stogram/stogram/client/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # Client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket proxy
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads
    location /uploads {
        proxy_pass http://localhost:3001;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

Enable the site:

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/stogram /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## ☁️ Cloud Platforms

### AWS Deployment

#### Using EC2

1. **Launch EC2 Instance**
   - Amazon Linux 2 or Ubuntu 22.04
   - t3.medium or larger
   - Configure security groups (80, 443, 22)

2. **Set Up RDS PostgreSQL**
   - Create RDS instance
   - Configure security group
   - Note connection string

3. **Set Up ElastiCache Redis** (Optional)
   - Create Redis cluster
   - Note connection endpoint

4. **Deploy Application**
   - Follow [Server Setup](#server-setup-ubuntu-2204) steps
   - Use RDS and ElastiCache endpoints

5. **Configure Load Balancer** (Optional)
   - Create Application Load Balancer
   - Add SSL certificate
   - Point domain to ALB

#### Using Docker on ECS

1. Push images to ECR
2. Create ECS cluster
3. Define task definitions
4. Create services
5. Configure ALB

### DigitalOcean Deployment

#### Using Droplet

1. **Create Droplet**
   - Ubuntu 22.04
   - $12/month or higher
   - Add SSH key

2. **Set Up Database**
   - Create Managed PostgreSQL database
   - Or install on droplet

3. **Deploy Application**
   - Follow [Server Setup](#server-setup-ubuntu-2204)
   - Configure firewall

4. **Add Domain**
   - Point DNS to droplet IP
   - Configure SSL with Let's Encrypt

### Heroku Deployment

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Create app
heroku create stogram-app

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Add Redis (optional)
heroku addons:create heroku-redis:hobby-dev

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -hex 32)

# Deploy
git push heroku main

# Run migrations
heroku run npx prisma migrate deploy

# Open app
heroku open
```

### Vercel Deployment (Frontend Only)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from client directory
cd client
vercel

# Set environment variables in Vercel dashboard
# Configure API backend URL
```

---

## 🗄️ Database Setup

### PostgreSQL Configuration

#### Performance Tuning

Edit `/etc/postgresql/15/main/postgresql.conf`:

```conf
# Memory Settings
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
work_mem = 16MB

# Connection Settings
max_connections = 100

# Write Ahead Log
wal_buffers = 8MB
checkpoint_completion_target = 0.9
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

#### Backup Strategy

**Automated Daily Backups:**

```bash
# Create backup script
sudo nano /usr/local/bin/backup-stogram-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/backups/stogram"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="stogram_db"
DB_USER="stogram"

mkdir -p $BACKUP_DIR

# Create backup
pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/stogram_$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "stogram_*.sql.gz" -mtime +7 -delete

echo "Backup completed: stogram_$DATE.sql.gz"
```

Make executable and schedule:

```bash
sudo chmod +x /usr/local/bin/backup-stogram-db.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
0 2 * * * /usr/local/bin/backup-stogram-db.sh
```

**Restore from Backup:**

```bash
gunzip < /backups/stogram/stogram_YYYYMMDD_HHMMSS.sql.gz | psql -U stogram stogram_db
```

---

## 🔒 SSL/TLS Configuration

### Using Let's Encrypt (Certbot)

#### Step 1: Install Certbot

```bash
# Ubuntu
sudo apt install -y certbot python3-certbot-nginx
```

#### Step 2: Obtain Certificate

```bash
# Stop Nginx temporarily
sudo systemctl stop nginx

# Obtain certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Start Nginx
sudo systemctl start nginx
```

#### Step 3: Update Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/stogram
```

Add HTTPS server block:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # ... rest of configuration ...
}
```

#### Step 4: Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Renewal happens automatically via cron
```

---

## 📊 Monitoring & Maintenance

### Application Monitoring

#### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# View logs
pm2 logs stogram-server

# Restart on high memory
pm2 start ecosystem.config.js --max-memory-restart 500M
```

#### Log Rotation

Create `/home/stogram/stogram/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'stogram-server',
    script: './dist/index.js',
    cwd: '/home/stogram/stogram/server',
    instances: 2,
    exec_mode: 'cluster',
    max_memory_restart: '500M',
    error_file: '/var/log/stogram/error.log',
    out_file: '/var/log/stogram/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    env: {
      NODE_ENV: 'production'
    }
  }]
};
```

### System Monitoring

#### Install Monitoring Tools

```bash
# htop for process monitoring
sudo apt install -y htop

# netdata for comprehensive monitoring
bash <(curl -Ss https://my-netdata.io/kickstart.sh)
```

### Health Checks

```bash
# API health check
curl https://api.yourdomain.com/health

# Database check
psql -U stogram -d stogram_db -c "SELECT 1;"

# Redis check
redis-cli ping
```

### Maintenance Tasks

#### Update Application

```bash
cd /home/stogram/stogram

# Pull latest changes
git pull origin main

# Install dependencies
npm run install:all

# Build
cd client && npm run build && cd ..
cd server && npm run build && cd ..

# Run migrations
cd server && npx prisma migrate deploy && cd ..

# Restart
pm2 restart stogram-server
```

#### Database Maintenance

```bash
# Vacuum database
psql -U stogram -d stogram_db -c "VACUUM ANALYZE;"

# Check database size
psql -U stogram -d stogram_db -c "SELECT pg_size_pretty(pg_database_size('stogram_db'));"
```

---

## 🔧 Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Find process using port
sudo lsof -i :3001

# Kill process
sudo kill -9 <PID>
```

#### Database Connection Error

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U stogram -d stogram_db -h localhost

# Check firewall
sudo ufw status
```

#### Out of Memory

```bash
# Check memory usage
free -h

# Add swap space
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

#### Nginx Configuration Error

```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log
```

### Performance Issues

#### Slow API Responses

1. Check database queries
2. Add database indexes
3. Enable Redis caching
4. Optimize Prisma queries
5. Use connection pooling

#### High CPU Usage

1. Check PM2 logs for errors
2. Profile Node.js application
3. Optimize WebSocket connections
4. Scale horizontally with load balancer

---

## 📞 Support

For deployment issues:
- 📧 Email: devops@stogram.com
- 💬 Discord: [Stogram Dev Community](https://discord.gg/stogram-dev)
- 📖 Docs: [docs.stogram.com](https://docs.stogram.com)

---

<div align="center">
  <p><strong>Happy Deploying! 🚀</strong></p>
</div>
