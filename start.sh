#!/bin/bash

# How to run this script:
# bash start.sh
# source start.sh

# Khmer Sign Language Platform - Startup Script

echo "🚀 Starting Khmer Sign Language Platform..."
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed!"
    echo "📥 Please install Docker from: https://docs.docker.com/get-docker/"
    exit 1
fi

echo "✅ Docker found"

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo "❌ Docker daemon is not running!"
    echo ""
    echo "📝 Instructions to start Docker:"
    echo "  • Docker Desktop: Open the Docker Desktop application"
    echo "  • Linux (systemd): sudo systemctl start docker"
    echo "  • macOS (brew): brew services start docker"
    exit 1
fi

echo "✅ Docker daemon is running"
echo ""

# Start PostgreSQL
echo "🐘 Starting PostgreSQL container..."
docker compose up -d

if [ $? -eq 0 ]; then
    echo "✅ PostgreSQL container started successfully!"
    echo ""
    echo "⏳ Waiting for PostgreSQL to be ready (up to 15 seconds)..."
    sleep 5
    
    # Test connection
    echo ""
    echo "🔍 Testing database connection..."
    cd backend
    source venv/bin/activate 2>/dev/null || echo "⚠️ Virtual environment not activated"
    python test_db_connection.py
    cd ..
else
    echo "❌ Failed to start PostgreSQL container"
    exit 1
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Terminal 1 - Start Backend:"
echo "     cd backend && source venv/bin/activate && uvicorn main:app --reload"
echo ""
echo "  2. Terminal 2 - Start Frontend:"
echo "     cd frontend && npm run dev"
echo ""
echo "  3. Backend: http://localhost:8000"
echo "  4. Frontend: http://localhost:3000"
