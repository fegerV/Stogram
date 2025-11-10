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
