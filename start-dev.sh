#!/bin/bash

# TCF/TEF Platform Development Startup Script
# This script ensures proper port configuration

echo "🚀 Starting TCF/TEF Platform Development Environment"
echo "=================================================="

# Kill any existing processes on ports 3000 and 3001
echo "🧹 Cleaning up existing processes..."
pkill -f "next dev" 2>/dev/null || true
pkill -f "nodemon" 2>/dev/null || true
pkill -f "ts-node" 2>/dev/null || true

# Wait for ports to be free
sleep 2

# Check if ports are free
if lsof -i:3000 >/dev/null 2>&1; then
    echo "❌ Port 3000 is still in use. Please manually kill the process."
    exit 1
fi

if lsof -i:3001 >/dev/null 2>&1; then
    echo "❌ Port 3001 is still in use. Please manually kill the process."
    exit 1
fi

echo "✅ Ports 3000 and 3001 are free"

# Start backend on port 3001
echo "🔧 Starting Backend on port 3001..."
cd backend && npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Check if backend is running
if ! curl -s http://localhost:3001/api/auth/verify >/dev/null 2>&1; then
    echo "❌ Backend failed to start on port 3001"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

echo "✅ Backend started successfully on port 3001"

# Start frontend on port 3000
echo "🎨 Starting Frontend on port 3000..."
cd .. && npm run dev &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 5

# Check if frontend is running
if ! curl -s http://localhost:3000 >/dev/null 2>&1; then
    echo "❌ Frontend failed to start on port 3000"
    kill $FRONTEND_PID 2>/dev/null || true
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

echo "✅ Frontend started successfully on port 3000"

echo ""
echo "🎉 TCF/TEF Platform is running!"
echo "=================================================="
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:3001"
echo "📊 API Docs: http://localhost:3001/api-docs"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user to stop
wait
