@echo off
REM Fullstack Trading Analytics System Startup Script for Windows
REM This script helps you start all components of the system

echo 🚀 Starting Cryptocurrency Trading Analytics System
echo ==================================================

REM Function to check if a service is running
:check_service
netstat -an | findstr "LISTENING" | findstr ":%2" >nul
if %errorlevel% equ 0 (
    echo ✅ %1 is running on port %2
    exit /b 0
) else (
    echo ❌ %1 is not running on port %2
    exit /b 1
)

REM Function to wait for service to be ready
:wait_for_service
echo ⏳ Waiting for %1 to be ready on port %2...
set count=0
:wait_loop
call :check_service %1 %2
if %errorlevel% equ 0 (
    echo ✅ %1 is ready!
    exit /b 0
)
timeout /t 2 /nobreak >nul
set /a count+=2
if %count% geq 30 (
    echo ❌ Timeout waiting for %1
    exit /b 1
)
goto wait_loop

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

echo ✅ Docker is running

echo.
echo 📦 Phase 1: Starting Infrastructure
echo ==================================

REM Stop any existing containers
echo 🛑 Stopping existing containers...
docker-compose down -v >nul 2>&1

REM Start Redpanda
echo 🐳 Starting Redpanda and Console...
docker-compose up -d

REM Wait for Redpanda to be ready
call :wait_for_service "Redpanda" "9092"
if %errorlevel% neq 0 (
    echo ❌ Failed to start Redpanda
    pause
    exit /b 1
)

echo ✅ Redpanda is ready!
echo 📊 Redpanda Console available at: http://localhost:8080

echo.
echo 📥 Phase 2: Starting Data Ingestion
echo =================================

REM Check if Python virtual environment exists
if not exist "venv" (
    echo 🐍 Creating Python virtual environment...
    python -m venv venv
)

echo 🐍 Activating virtual environment...
call venv\Scripts\activate.bat

echo 📦 Installing Python dependencies...
pip install -r requirements.txt >nul 2>&1

echo ▶️  Starting data ingestion script...
start /B python ingestion_script.py
set INGESTION_PID=%!

echo ✅ Data ingestion started

echo.
echo ⚡ Phase 3: Starting Rust Backend
echo ================================

REM Check if Rust target is built
if not exist "target\debug\rsi-calculator.exe" (
    echo 🔨 Building Rust project...
    cargo build >nul 2>&1
)

echo ▶️  Starting RSI calculator...
start /B cargo run
set RUST_PID=%!

echo ✅ Rust backend started

echo.
echo 🌐 Phase 4: Starting Frontend
echo ============================

cd frontend

REM Check if Node.js dependencies are installed
if not exist "node_modules" (
    echo 📦 Installing Node.js dependencies...
    npm install >nul 2>&1
)

echo ▶️  Starting Next.js development server...
start /B npm run dev
set FRONTEND_PID=%!

cd ..

echo ✅ Frontend started
echo 📱 Dashboard available at: http://localhost:3000

echo.
echo 🎉 System startup complete!
echo ==========================
echo 📊 Redpanda Console: http://localhost:8080
echo 🌐 Trading Dashboard: http://localhost:3000
echo.
echo 📈 Data Flow:
echo    CSV → ingestion_script.py → Redpanda (trade-data)
echo    Redpanda (trade-data) → rsi-calculator → Redpanda (rsi-data)
echo    Redpanda (rsi-data) → Next.js Dashboard
echo.
echo 🛑 To stop all services:
echo    docker-compose down
echo    taskkill /PID %INGESTION_PID% /PID %RUST_PID% /PID %FRONTEND_PID% /T /F
echo.
echo ✅ System is ready for use!
pause
