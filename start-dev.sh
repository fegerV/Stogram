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
