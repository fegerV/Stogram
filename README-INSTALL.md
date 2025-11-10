# 🚀 Quick Ubuntu Installation for Stogram

## One-Command Installation

### For Development (Test)
```bash
git clone <repository-url>
cd stogram
./install-ubuntu.sh --test
./start-dev.sh
```

### For Production
```bash
git clone <repository-url>
cd stogram
./install-ubuntu.sh --prod
# Follow prompts for domain and database setup
sudo systemctl start stogram
```

## 📋 What Gets Installed

**System Dependencies:**
- Node.js 20.x
- Docker & Docker Compose
- PM2 & Nginx (production only)

**Application:**
- Stogram Messenger (client + server)
- PostgreSQL database
- Redis cache
- All dependencies configured

## 🔧 Additional Commands

**Check Installation:**
```bash
./check-installation.sh
```

**Development:**
- Start: `./start-dev.sh`
- Stop: `docker-compose down`
- Access: http://localhost:5173

**Production:**
- Start: `sudo systemctl start stogram`
- Status: `sudo systemctl status stogram`
- Logs: `sudo journalctl -u stogram -f`

## 🔒 Production Setup

After installation:
```bash
# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## 📖 Full Documentation

See `INSTALLATION.md` for detailed instructions, troubleshooting, and advanced configuration.

## ⚠️ Requirements

- Ubuntu 20.04+ 
- 2GB+ RAM
- 10GB+ disk space
- sudo privileges

## 🆘 Need Help?

1. Run `./check-installation.sh` to diagnose issues
2. Check `install.log` for installation details
3. Read `INSTALLATION.md` for comprehensive guide