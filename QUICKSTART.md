# ⚡ Stogram Quick Start Guide

Get Stogram up and running in 5 minutes!

## 🚀 Fastest Way to Start

### One-Command Setup (Recommended)

```bash
./quick-start.sh
```

That's it! The script will:
- ✅ Create environment files
- ✅ Generate secure JWT secret
- ✅ Start all Docker containers
- ✅ Run database migrations
- ✅ Launch the application

**Access at:**
- 🌐 Application: http://localhost
- 🔧 API: http://localhost:3001

---

## 🐳 Manual Docker Setup

If you prefer manual control:

```bash
# 1. Create environment files
cp .env.example .env
cp server/.env.example server/.env
cp client/.env.example client/.env

# 2. Generate JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Add the output to server/.env as JWT_SECRET

# 3. Start containers
docker-compose up -d

# 4. Run migrations
docker-compose exec server npx prisma migrate deploy

# 5. Open your browser
open http://localhost
```

---

## 💻 Local Development Setup

For active development without Docker:

```bash
# 1. Install dependencies
npm run install:all

# 2. Setup environment
cp server/.env.example server/.env
cp client/.env.example client/.env
# Edit server/.env with your configuration

# 3. Start PostgreSQL & Redis
docker-compose up -d postgres redis

# 4. Setup database
cd server
npx prisma generate
npx prisma migrate dev
cd ..

# 5. Start dev servers
npm run dev
```

**Access at:**
- 🌐 Frontend: http://localhost:5173
- 🔧 Backend: http://localhost:3001

---

## ✅ Verify Installation

Run the verification script to check everything:

```bash
./verify-setup.sh
```

This will check:
- Prerequisites (Node.js, npm, Docker)
- Project structure
- Configuration files
- Dependencies

---

## 📝 First Steps

### 1. Create Your Account

1. Open http://localhost (or http://localhost:5173 for dev)
2. Click "Sign up"
3. Fill in:
   - Email
   - Username
   - Password (min 8 characters)
4. Click "Create Account"

### 2. Start Chatting

1. Click "New Chat"
2. Search for a user
3. Select and create chat
4. Start messaging!

### 3. Try Features

- 💬 Send messages
- 📁 Upload files (drag & drop)
- 📞 Make audio calls
- 📹 Start video calls
- 👥 Create group chats
- 🔍 Search users and chats

---

## 🛠️ Common Commands

### Docker Commands

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f

# Restart service
docker-compose restart server

# Rebuild
docker-compose up -d --build
```

### Development Commands

```bash
# Start dev servers
npm run dev

# Build for production
npm run build

# Run server only
npm run dev:server

# Run client only
npm run dev:client
```

### Database Commands

```bash
cd server

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Reset database
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio
```

---

## 🔧 Configuration

### Essential Environment Variables

**server/.env:**
```bash
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://stogram:stogram_password@localhost:5432/stogram_db
JWT_SECRET=your-generated-secret-here
```

**client/.env:**
```bash
VITE_API_URL=http://localhost:3001
VITE_WS_URL=http://localhost:3001
```

---

## 📚 Next Steps

- 📖 Read the [User Guide](USER_GUIDE.md) for features
- 🚀 See [Deployment Guide](DEPLOYMENT.md) for production
- 🤝 Check [Contributing Guide](CONTRIBUTING.md) to contribute
- 🎯 View [Features Roadmap](FEATURES.md) for upcoming features

---

## ❓ Troubleshooting

### Port Already in Use

```bash
# Find process using port 3001
lsof -i :3001

# Kill process
kill -9 <PID>
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### Build Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules client/node_modules server/node_modules
npm run install:all

# Clear Docker cache
docker-compose down -v
docker-compose up -d --build
```

---

## 💬 Need Help?

- 📧 Email: support@stogram.com
- 💬 Discord: [Join Community](https://discord.gg/stogram)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/stogram/issues)
- 📖 Docs: See all `.md` files in the root directory

---

## 🎉 You're Ready!

Start building your messaging community with Stogram!

**Happy chatting! 💬**
