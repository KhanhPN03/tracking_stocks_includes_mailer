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
