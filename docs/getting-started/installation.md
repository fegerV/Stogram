# Installation Guide

This guide covers the system requirements and installation steps for Stogram.

## Prerequisites

- **Node.js** 18+
- **npm** 9+
- **PostgreSQL** 14+ (or SQLite for development)
- **Redis** 7+ (optional, for caching)

## Quick Installation

### Docker (recommended for all environments)

```bash
# Clone the repository
git clone https://github.com/fegerV/Stogram.git
cd stogram

# Start all services
docker-compose up -d
```

### Ubuntu / Debian

```bash
# Clone and run the installation script
git clone https://github.com/fegerV/Stogram.git
cd stogram
./install-ubuntu.sh --test  # for development
./start-dev.sh
```

For production:

```bash
./install-ubuntu.sh --prod
# Follow prompts for domain and database setup
sudo systemctl start stogram
```

### Manual Installation

```bash
# Clone the repository
git clone https://github.com/fegerV/Stogram.git
cd stogram

# Install all dependencies
npm run install:all

# Set up environment files
cp server/.env.example server/.env
cp client/.env.example client/.env

# Generate Prisma client and run migrations
cd server
npx prisma generate
npx prisma migrate dev
cd ..

# Start development servers
npm run dev
```

## Verification

Run the verification script to check your installation:

```bash
./check-installation.sh
```

## Troubleshooting

See [INSTALLATION.md](../../INSTALLATION.md) for detailed troubleshooting and advanced configuration.