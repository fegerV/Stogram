#!/bin/bash

echo "🚀 Stogram Quick Start Script"
echo "=============================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    
    # Generate JWT secret
    JWT_SECRET=$(openssl rand -hex 32)
    
    # Update .env file (macOS and Linux compatible)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/your-secret-key-change-in-production/$JWT_SECRET/" .env
    else
        sed -i "s/your-secret-key-change-in-production/$JWT_SECRET/" .env
    fi
    
    echo "✅ Created .env file with generated JWT secret"
else
    echo "✅ .env file already exists"
fi

# Check if server/.env file exists
if [ ! -f server/.env ]; then
    echo "📝 Creating server/.env file from template..."
    cp server/.env.example server/.env
    echo "✅ Created server/.env file"
else
    echo "✅ server/.env file already exists"
fi

# Check if client/.env file exists
if [ ! -f client/.env ]; then
    echo "📝 Creating client/.env file from template..."
    cp client/.env.example client/.env
    echo "✅ Created client/.env file"
else
    echo "✅ client/.env file already exists"
fi

echo ""
echo "🐳 Starting Docker containers..."
docker-compose up -d

echo ""
echo "⏳ Waiting for database to be ready..."
sleep 10

echo ""
echo "📦 Running database migrations..."
docker-compose exec -T server npx prisma migrate deploy || echo "⚠️  Migrations will run on first server start"

echo ""
echo "✅ Stogram is starting up!"
echo ""
echo "🌐 Access the application at:"
echo "   Frontend: http://localhost"
echo "   Backend:  http://localhost:3001"
echo "   Health:   http://localhost:3001/health"
echo ""
echo "📊 View logs with: docker-compose logs -f"
echo "🛑 Stop with: docker-compose down"
echo ""
echo "📚 For more information, see README.md and DEPLOYMENT.md"
echo ""
echo "Happy chatting! 💬"
