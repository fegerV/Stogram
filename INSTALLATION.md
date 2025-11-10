# Ubuntu Installation Guide for Stogram Messenger

This guide provides comprehensive instructions for installing Stogram Messenger on Ubuntu systems for both development (test) and production environments.

## Overview

The installation process includes:
- System dependencies installation (Node.js, Docker, etc.)
- Application setup and configuration
- Database initialization
- Service configuration (production only)
- SSL setup (production only)

## Prerequisites

- Ubuntu 20.04, 22.04, or newer
- sudo privileges
- Internet connection
- At least 2GB RAM
- At least 10GB free disk space

## Quick Start

### Development Environment

```bash
# Clone the repository
git clone https://github.com/fegerV/Stogram.git
cd stogram

# Run the installation script
./install-ubuntu.sh --test

# Start the development environment
./start-dev.sh
```

### Production Environment

```bash
# Clone the repository
git clone https://github.com/fegerV/Stogram.git
cd stogram

# Run the installation script
./install-ubuntu.sh --prod

# Start the production environment
sudo systemctl start stogram
```

## Detailed Instructions

### 1. Installation Script

The main installation script `install-ubuntu.sh` supports the following options:

```bash
./install-ubuntu.sh [OPTIONS]

Options:
  --test      Install for development/testing environment
  --prod      Install for production environment
  --skip-deps Skip system dependency installation
  --help      Show help message
```

### 2. System Dependencies

The script automatically installs the following dependencies:

#### For All Environments:
- **Node.js 20.x** - JavaScript runtime
- **npm** - Package manager
- **Docker** - Container platform
- **Docker Compose** - Container orchestration
- **Git** - Version control
- **Basic utilities** (curl, wget, unzip, etc.)

#### Additional for Production:
- **PM2** - Process manager
- **Nginx** - Web server/reverse proxy

### 3. Environment Configuration

The script sets up environment configuration based on the selected mode:

#### Development Environment:
- Domain: `localhost`
- Auto-generated JWT secret
- Default database credentials
- Development-optimized settings

#### Production Environment:
- Custom domain (prompted during installation)
- Secure JWT secret generation
- Custom database credentials (prompted)
- Production-optimized settings
- SSL-ready configuration

### 4. Application Installation

The script performs these steps:

1. **Root Dependencies**: Installs workspace dependencies
2. **Server Dependencies**: Installs backend dependencies
3. **Client Dependencies**: Installs frontend dependencies
4. **Prisma Setup**: Generates database client
5. **Database Migration**: Sets up database schema

### 5. Build Process (Production Only)

For production environments, the script builds:
- **Server**: TypeScript compilation
- **Client**: Vite build process

### 6. Service Configuration (Production Only)

#### Systemd Service
Creates a systemd service `stogram.service` for:
- Automatic startup on boot
- Process management
- Log management

#### Nginx Configuration
Sets up Nginx with:
- HTTP to HTTPS redirection
- SSL certificate support
- Reverse proxy configuration
- WebSocket support
- Security headers
- Static file caching

## File Structure After Installation

```
stogram/
├── install-ubuntu.sh          # Main installation script
├── check-installation.sh      # Installation verification script
├── start-dev.sh              # Development startup script
├── start-prod.sh             # Production startup script
├── .env                      # Environment configuration
├── docker-compose.yml        # Docker configuration
├── client/                   # Frontend application
│   ├── dist/                 # Built client files (prod)
│   ├── node_modules/         # Client dependencies
│   └── package.json          # Client configuration
├── server/                   # Backend application
│   ├── dist/                 # Built server files (prod)
│   ├── node_modules/         # Server dependencies
│   └── package.json          # Server configuration
└── install.log              # Installation log
```

## Usage Instructions

### Development Environment

#### Starting the Application
```bash
./start-dev.sh
```

This will:
- Start PostgreSQL and Redis containers
- Run database migrations
- Start development servers

#### Access Points
- **Client**: http://localhost:5173
- **Server**: http://localhost:3001
- **Database**: localhost:5432
- **Redis**: localhost:6379

#### Stopping the Application
```bash
docker-compose down
```

### Production Environment

#### Starting the Application
```bash
# Using systemd (recommended)
sudo systemctl start stogram

# Or using the script
./start-prod.sh
```

#### Managing the Service
```bash
# Check status
sudo systemctl status stogram

# View logs
sudo journalctl -u stogram -f

# Stop the service
sudo systemctl stop stogram

# Restart the service
sudo systemctl restart stogram
```

#### Access Points
- **Application**: https://yourdomain.com
- **API**: https://yourdomain.com/api/
- **WebSocket**: https://yourdomain.com/socket.io/

## SSL Certificate Setup (Production)

After installation, set up SSL certificates:

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

## Database Management

### Development
```bash
# Access database
docker exec -it stogram-postgres psql -U stogram -d stogram_db

# View database
cd server
npx prisma studio

# Run migrations
npx prisma migrate dev

# Reset database
npx prisma migrate reset
```

### Production
```bash
# Access database
docker exec -it stogram-postgres psql -U <username> -d <database>

# View database
cd server
npx prisma studio

# Deploy migrations
npx prisma migrate deploy
```

## Troubleshooting

### Installation Issues

#### Permission Denied
```bash
# Make scripts executable
chmod +x install-ubuntu.sh check-installation.sh
```

#### Docker Permission Issues
```bash
# Add user to docker group
sudo usermod -aG docker $USER
# Log out and log back in
```

#### Port Conflicts
```bash
# Check what's using ports
sudo netstat -tulpn | grep :3001
sudo netstat -tulpn | grep :5173
```

### Runtime Issues

#### Database Connection Errors
```bash
# Check database container
docker ps | grep postgres

# Check database logs
docker logs stogram-postgres

# Restart database
docker-compose restart postgres
```

#### Application Not Starting
```bash
# Check logs
./check-installation.sh

# View application logs
docker-compose logs server
docker-compose logs client
```

### Performance Issues

#### High Memory Usage
```bash
# Check system resources
htop
df -h

# Check Docker resource usage
docker stats
```

#### Slow Database Queries
```bash
# Enable query logging
# Add to docker-compose.yml in postgres service:
# command: postgres -c log_statement=all
```

## Maintenance

### Regular Updates

#### System Updates
```bash
sudo apt update && sudo apt upgrade -y
```

#### Application Updates
```bash
# Pull latest changes
git pull origin main

# Update dependencies
npm run install:all

# Rebuild (production)
npm run build

# Restart services
sudo systemctl restart stogram
```

#### Docker Updates
```bash
# Update Docker images
docker-compose pull

# Restart containers
docker-compose up -d
```

### Backup Procedures

#### Database Backup
```bash
# Create backup
docker exec stogram-postgres pg_dump -U <username> <database> > backup.sql

# Restore backup
docker exec -i stogram-postgres psql -U <username> <database> < backup.sql
```

#### Application Backup
```bash
# Backup application files
tar -czf stogram-backup-$(date +%Y%m%d).tar.gz \
  --exclude=node_modules \
  --exclude=dist \
  --exclude=.git \
  .
```

### Log Management

#### Log Rotation (Production)
```bash
# Configure logrotate for systemd logs
sudo nano /etc/logrotate.d/stogram
```

Content:
```
/var/log/stogram/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 root root
}
```

## Security Considerations

### Production Security Checklist

- [ ] Change default passwords
- [ ] Use strong JWT secrets
- [ ] Configure firewall rules
- [ ] Set up SSL certificates
- [ ] Implement rate limiting
- [ ] Regular security updates
- [ ] Monitor access logs
- [ ] Backup encryption
- [ ] Security headers configuration
- [ ] CORS configuration

### Firewall Configuration
```bash
# Allow HTTP/HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Allow SSH (if needed)
sudo ufw allow 22

# Enable firewall
sudo ufw enable
```

## Monitoring

### Basic Monitoring
```bash
# Check system resources
top
htop
iotop

# Check Docker containers
docker ps
docker stats

# Check application logs
sudo journalctl -u stogram -f
```

### Advanced Monitoring Setup
Consider setting up:
- Prometheus + Grafana for metrics
- ELK stack for log analysis
- Uptime monitoring
- Alert systems

## Support

### Getting Help

1. **Check Installation**: Run `./check-installation.sh`
2. **Review Logs**: Check `install.log` and application logs
3. **Documentation**: Read this guide and other documentation
4. **Community**: Check GitHub issues and discussions

### Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| Port already in use | Change port in .env or stop conflicting service |
| Permission denied | Check file permissions and user groups |
| Docker not running | Start Docker service: `sudo systemctl start docker` |
| Database connection failed | Check database container and credentials |
| Build fails | Check Node.js version and clear npm cache |

## Advanced Configuration

### Custom Domains
Edit `.env` file:
```bash
DOMAIN=your-custom-domain.com
```

### Custom Ports
Edit `docker-compose.yml`:
```yaml
services:
  server:
    ports:
      - "3002:3001"  # Change external port
```

### Environment Variables
Available environment variables:
- `NODE_ENV`: development/production
- `PORT`: Server port
- `JWT_SECRET`: JWT signing secret
- `DOMAIN`: Application domain
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string

### Docker Customization
Edit `docker-compose.yml` for:
- Resource limits
- Volume mounts
- Network configuration
- Environment variables

## Contributing

To contribute to the installation scripts:
1. Fork the repository
2. Create a feature branch
3. Test on multiple Ubuntu versions
4. Submit a pull request

## License

This installation script is part of the Stogram project and follows the same license terms.
