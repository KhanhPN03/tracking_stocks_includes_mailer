#!/bin/bash

# 🚀 Vietnamese Stock Tracker - Quick Start Script
# Author: KhanhPN aka Laza

echo "🇻🇳 Vietnamese Stock Tracker - Quick Start Setup"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

print_status "Node.js $(node -v) detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_status "npm $(npm -v) detected"

# Install dependencies
print_info "Installing backend dependencies..."
cd server
if npm install; then
    print_status "Backend dependencies installed successfully"
else
    print_error "Failed to install backend dependencies"
    exit 1
fi

print_info "Installing frontend dependencies..."
cd ../client
if npm install; then
    print_status "Frontend dependencies installed successfully"
else
    print_error "Failed to install frontend dependencies"
    exit 1
fi

# Check if .env file exists
cd ../server
if [ ! -f ".env" ]; then
    print_warning "No .env file found. Creating template..."
    
    cat > .env << EOL
# Database
MONGODB_URI=mongodb://localhost:27017/vietnam_stock_tracker

# Authentication
JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters

# External APIs
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key
DNSE_API_KEY=your_dnse_api_key

# Email Service (for notifications)
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password

# Server Scheduling
SERVER_TIMEZONE=Asia/Ho_Chi_Minh
SERVER_START_HOUR=9
SERVER_END_HOUR=15

# Development
NODE_ENV=development
PORT=5000

# Activity Logging
ACTIVITY_BATCH_SIZE=10
ACTIVITY_BATCH_INTERVAL=5000
EOL

    print_status ".env template created"
    print_warning "Please edit server/.env with your actual configuration before running"
else
    print_status ".env file exists"
fi

# Create startup scripts
print_info "Creating startup scripts..."

# Backend start script
cat > start-backend.sh << 'EOL'
#!/bin/bash
echo "🚀 Starting Vietnamese Stock Tracker Backend..."
echo "Server will be active during Vietnam market hours (9 AM - 3 PM)"
echo "Dashboard: http://localhost:5000"
echo "API Docs: http://localhost:5000/api-docs"
echo ""
cd server
npm run dev
EOL

# Frontend start script
cat > start-frontend.sh << 'EOL'
#!/bin/bash
echo "🖥️ Starting Vietnamese Stock Tracker Frontend..."
echo "Dashboard: http://localhost:3000"
echo ""
cd client
npm run dev
EOL

# Development start script (both)
cat > start-dev.sh << 'EOL'
#!/bin/bash
echo "🚀 Starting Vietnamese Stock Tracker - Full Stack"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:5000"
echo ""

# Function to cleanup background processes
cleanup() {
    echo "Shutting down servers..."
    kill $(jobs -p) 2>/dev/null
    exit
}

# Trap CTRL+C
trap cleanup SIGINT

# Start backend in background
cd server && npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend in background
cd ../client && npm run dev &
FRONTEND_PID=$!

echo "✅ Both servers started!"
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait $BACKEND_PID
wait $FRONTEND_PID
EOL

chmod +x start-backend.sh start-frontend.sh start-dev.sh

print_status "Startup scripts created"

echo ""
echo "🎉 Setup Complete! Your Vietnamese Stock Tracker is ready!"
echo ""
echo "📋 Next Steps:"
echo "1. Edit server/.env with your configuration"
echo "2. Start development:"
echo "   • Full stack: ./start-dev.sh"
echo "   • Backend only: ./start-backend.sh"  
echo "   • Frontend only: ./start-frontend.sh"
echo ""
echo "🌐 Local URLs:"
echo "   • Frontend: http://localhost:3000"
echo "   • Backend: http://localhost:5000"
echo "   • API Docs: http://localhost:5000/api-docs"
echo ""
echo "📖 For deployment guide, see: COMPLETE_DEPLOYMENT_GUIDE.md"
echo ""
print_status "Happy coding! 🚀🇻🇳"
