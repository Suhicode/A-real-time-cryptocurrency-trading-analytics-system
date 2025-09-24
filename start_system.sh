#!/bin/bash

# Fullstack Trading Analytics System Startup Script
# This script helps you start all components of the system

echo "🚀 Starting Cryptocurrency Trading Analytics System"
echo "=================================================="

# Function to check if a service is running
check_service() {
    local service=$1
    local port=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null; then
        echo "✅ $service is running on port $port"
        return 0
    else
        echo "❌ $service is not running on port $port"
        return 1
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local service=$1
    local port=$2
    local timeout=30
    local count=0

    echo "⏳ Waiting for $service to be ready on port $port..."

    while ! check_service "$service" "$port" >/dev/null 2>&1; do
        sleep 2
        count=$((count + 2))
        if [ $count -ge $timeout ]; then
            echo "❌ Timeout waiting for $service"
            return 1
        fi
    done

    echo "✅ $service is ready!"
    return 0
}

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✅ Docker is running"

# Phase 1: Start Infrastructure (Redpanda)
echo ""
echo "📦 Phase 1: Starting Infrastructure"
echo "=================================="

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down -v >/dev/null 2>&1

# Start Redpanda
echo "🐳 Starting Redpanda and Console..."
docker-compose up -d

# Wait for Redpanda to be ready
if wait_for_service "Redpanda" "9092"; then
    echo "✅ Redpanda is ready!"
    echo "📊 Redpanda Console available at: http://localhost:8080"
else
    echo "❌ Failed to start Redpanda"
    exit 1
fi

# Phase 2: Start Data Ingestion
echo ""
echo "📥 Phase 2: Starting Data Ingestion"
echo "================================="

# Check if Python dependencies are installed
if [ ! -d "venv" ]; then
    echo "🐍 Creating Python virtual environment..."
    python3 -m venv venv
fi

echo "🐍 Activating virtual environment..."
source venv/bin/activate

echo "📦 Installing Python dependencies..."
pip install -r requirements.txt >/dev/null 2>&1

echo "▶️  Starting data ingestion script..."
python3 ingestion_script.py &
INGESTION_PID=$!

echo "✅ Data ingestion started (PID: $INGESTION_PID)"

# Phase 3: Start Rust Backend
echo ""
echo "⚡ Phase 3: Starting Rust Backend"
echo "================================"

# Check if Rust target is built
if [ ! -f "target/debug/rsi-calculator" ]; then
    echo "🔨 Building Rust project..."
    cargo build >/dev/null 2>&1
fi

echo "▶️  Starting RSI calculator..."
cargo run &
RUST_PID=$!

echo "✅ Rust backend started (PID: $RUST_PID)"

# Phase 4: Start Frontend
echo ""
echo "🌐 Phase 4: Starting Frontend"
echo "============================"

cd frontend

# Check if Node.js dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install >/dev/null 2>&1
fi

echo "▶️  Starting Next.js development server..."
npm run dev &
FRONTEND_PID=$!

cd ..

echo "✅ Frontend started (PID: $FRONTEND_PID)"
echo "📱 Dashboard available at: http://localhost:3000"

# Summary
echo ""
echo "🎉 System startup complete!"
echo "=========================="
echo "📊 Redpanda Console: http://localhost:8080"
echo "🌐 Trading Dashboard: http://localhost:3000"
echo ""
echo "📈 Data Flow:"
echo "   CSV → ingestion_script.py → Redpanda (trade-data)"
echo "   Redpanda (trade-data) → rsi-calculator → Redpanda (rsi-data)"
echo "   Redpanda (rsi-data) → Next.js Dashboard"
echo ""
echo "🛑 To stop all services:"
echo "   docker-compose down"
echo "   kill $INGESTION_PID $RUST_PID $FRONTEND_PID"
echo ""
echo "✅ System is ready for use!"
