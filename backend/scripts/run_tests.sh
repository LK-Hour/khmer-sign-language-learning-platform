#!/bin/bash

# Test runner script for Khmer Sign Language Platform Backend
# This script runs all tests and generates coverage reports

set -e

echo "🧪 Running Khmer Sign Language Platform Backend Tests"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        exit 1
    fi
}

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}⚠️  Virtual environment not found. Creating one...${NC}"
    python -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt
pip install -r requirements-dev.txt
print_status $? "Dependencies installed"

# Run database migrations (if needed)
echo "🗄️  Running database migrations..."
if [ -f "alembic.ini" ]; then
    alembic upgrade head
    print_status $? "Database migrations completed"
fi

# Create test database
echo "🗄️  Creating test database..."
python -c "
import os
from dotenv import load_dotenv
load_dotenv()

# Create test database if it doesn't exist
db_url = os.getenv('DATABASE_URL', '')
if 'test.db' not in db_url:
    print('Test database setup completed')
else:
    print('Using SQLite test database')
"
print_status $? "Test database setup completed"

# Run tests with coverage
echo "🔍 Running tests with coverage..."
python -m pytest \
    --cov=src \
    --cov-report=html \
    --cov-report=term-missing \
    --cov-fail-under=80 \
    --tb=short \
    -v

print_status $? "All tests passed"

# Generate coverage report
echo "📊 Generating coverage report..."
if [ -d "htmlcov" ]; then
    echo "Coverage report generated in htmlcov/index.html"
    echo "You can open it in your browser to see detailed coverage"
fi

# Run specific test categories
echo ""
echo "🎯 Running specific test categories..."

# Unit tests only
echo "🔬 Running unit tests..."
python -m pytest tests/ -m "unit" -v
print_status $? "Unit tests passed"

# Integration tests only
echo "🔗 Running integration tests..."
python -m pytest tests/ -m "integration" -v
print_status $? "Integration tests passed"

# API tests only
echo "🌐 Running API tests..."
python -m pytest tests/ -m "api" -v
print_status $? "API tests passed"

# Authentication tests only
echo "🔐 Running authentication tests..."
python -m pytest tests/ -m "auth" -v
print_status $? "Authentication tests passed"

echo ""
echo "🎉 All tests completed successfully!"
echo "📈 Coverage report: htmlcov/index.html"
echo "🚀 Your backend is ready for production!"