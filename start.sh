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

# Check if PostgreSQL is running
if [ "$(docker inspect -f '{{.State.Running}}' khmer_sign_postgres 2>/dev/null)" = "true" ]; then
    echo "🐘 PostgreSQL is already running!"
else
    echo "🐘 Starting PostgreSQL container..."
    docker compose up -d

    if [ $? -eq 0 ]; then
        echo "✅ PostgreSQL container started successfully!"
        echo "⏳ Waiting for PostgreSQL to be ready (up to 15 seconds)..."
        sleep 5
    else
        echo "❌ Failed to start PostgreSQL container"
        exit 1
    fi
fi

# Test connection
echo ""
echo "🔍 Testing database connection..."
cd backend
source venv/bin/activate 2>/dev/null || echo "⚠️ Virtual environment not activated"
python test_db_connection.py
cd ..

echo ""
echo "✨ Database Setup complete!"
echo ""
echo "🚀 Starting backend and frontend simultaneously..."

# Trap ctrl-c and kill all child processes
trap "kill 0" EXIT

echo "▶️  Starting Backend (Port 8000)..."
(cd backend && source venv/bin/activate && uvicorn src.main:app --reload --host 0.0.0.0 --port 8000) &

echo "▶️  Starting Frontend (Port 3000)..."
(cd frontend && npm run dev) &

echo ""
echo "✨ Both services are running in this terminal!"
echo "   Backend:  http://localhost:8000"
echo "   Frontend: http://localhost:3000"
echo "   ⚠️ Press Ctrl+C to stop both services."
echo "--------------------------------------------------------"

# Wait for background processes to finish
wait
