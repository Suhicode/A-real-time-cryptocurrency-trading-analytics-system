# Fullstack Developer Technical Assignment

## Overview

This assignment evaluates your ability to **rapidly learn new technologies** and **solve complex problems using AI tools**. We expect you to leverage AI assistants (ChatGPT, Claude, Copilot, etc.) throughout this process, as this reflects real-world development practices.

**Technologies:** Docker, Redpanda, Rust, NextJS, TypeScript

---

## 🚀 Quick Start Guide

### Prerequisites

Before starting, ensure you have the following installed:
- **Docker & Docker Compose** (for Redpanda infrastructure)
- **Node.js 18+** (for Next.js frontend)
- **Rust** (for RSI calculation backend)
- **Python 3.8+** (for data ingestion)
- **Git** (for cloning the repository)

### Step 1: Clone and Setup

```bash
# Clone the repository
cd /path/to/your/workspace

# Navigate to project directory
cd assignment-1-main
```

### Step 2: Start Infrastructure (Redpanda)

```bash
# Start Redpanda and Redpanda Console
# This creates the required topics: trade-data and rsi-data
docker-compose up -d

# Verify services are running
# You should see: redpanda, redpanda-console, topic-creator all as 'Up'
docker-compose ps

# Check if topics were created successfully
docker-compose exec redpanda rpk topic list
```

**Expected Output:**
```
NAME        PARTITIONS  REPLICAS
rsi-data    3           1
trade-data  3           1
```

### Step 3: Install Python Dependencies

```bash
# Install Python packages for data ingestion
pip install -r requirements.txt
```

### Step 4: Start Data Ingestion

```bash
# Run the Python script to ingest CSV data into Redpanda
python ingestion_script.py
```

**What this does:**
- Reads `trades_data.csv` file
- Publishes each trade as JSON messages to the `trade-data` topic
- Keep this running in a separate terminal

### Step 5: Start Rust Backend (RSI Calculator)

```bash
# Compile and run the Rust RSI calculation service
cargo run
```

**What this does:**
- Consumes messages from `trade-data` topic
- Calculates 14-period RSI for each token
- Publishes RSI values to `rsi-data` topic
- Keep this running in a separate terminal

### Step 6: Start Frontend Dashboard

```bash
# Navigate to frontend directory
cd frontend

# Install Node.js dependencies
npm install

# Start the Next.js development server
npm run dev
```

**Expected Output:**
```
▲ Next.js 14.0.4 development server started
- Local: http://localhost:3000
- Ready in 2.3s
```

### Step 7: Verify Everything is Working

1. **Open your browser** and go to http://localhost:3000
2. **Check Redpanda Console** at http://localhost:8081
3. **Verify data flow**:
   ```bash
   # Check if data is flowing in Redpanda
   docker-compose exec redpanda rpk topic consume rsi-data --num 5
   ```

### Step 8: Monitor the System

**Keep these services running:**
- ✅ Docker containers (Redpanda + Console)
- ✅ Python ingestion script
- ✅ Rust RSI calculator
- ✅ Next.js frontend

**System Status Check:**
```bash
# Check all services
curl "http://localhost:3000/api/rsi?token=FCuk4XWLR6fAJFTcQoMrm3KeywSt2X6wK4Ufh4Xjpump"
```

---

## 📊 What You Should See

### Frontend Dashboard
- **Real-time price and RSI charts** for 5 different tokens
- **Token selector dropdown** with 5 pump.fun tokens
- **Live updates every 5 seconds**
- **Connection status indicator**

### Redpanda Console
- **Topics**: `trade-data` and `rsi-data`
- **Messages flowing** in real-time
- **Consumer groups** and lag information

---

## 🛠️ Troubleshooting

### Problem: Services not starting
```bash
# Check logs for errors
docker-compose logs redpanda
docker-compose logs topic-creator
```

### Problem: No data in frontend
```bash
# Check if Python ingestion is running
python ingestion_script.py

# Check if Rust backend is running
cargo run

# Verify data in Redpanda
docker-compose exec redpanda rpk topic consume rsi-data --num 5
```

### Problem: Frontend not loading
```bash
# Restart frontend
cd frontend
npm run dev

# Check if API endpoint works
curl "http://localhost:3000/api/rsi?token=FCuk4XWLR6fAJFTcQoMrm3KeywSt2X6wK4Ufh4Xjpump"
```

### Problem: Port conflicts
```bash
# Kill processes on ports 3000, 8081, 9092
# Then restart services in order
```

---

## 📁 Project Structure

```
assignment-1-main/
├── docker-compose.yml     # Redpanda infrastructure
├── ingestion_script.py    # Python data ingestion
├── src/main.rs           # Rust RSI calculator
├── frontend/             # Next.js dashboard
│   ├── app/
│   │   ├── api/rsi/      # API endpoint
│   │   ├── page.tsx      # Main dashboard
│   │   └── layout.tsx    # App layout
│   ├── package.json      # Frontend dependencies
│   └── next.config.js    # Next.js configuration
├── Cargo.toml           # Rust dependencies
├── requirements.txt     # Python dependencies
└── trades_data.csv      # Trading data
```

---

## 🎯 Success Indicators

✅ **Redpanda Console** shows active topics and message flow
✅ **Frontend dashboard** displays real-time charts
✅ **RSI calculations** update every 5 seconds
✅ **All 5 tokens** available in dropdown selector
✅ **Connection status** shows as "Connected to Redpanda"

---

## 📝 Submission

1. **Record a 1-2 minute video** demonstrating:
   - System running with live data
   - Frontend dashboard with charts
   - Redpanda Console showing data flow

2. **Submit your GitHub repository** with all code

3. things that i have learned from AI 
      "Communicate Complex Technical Concepts Effectively: You've learned to explain a sophisticated, multi-component system in a professional and accessible way. You can now articulate the purpose of each technology—like why Redpanda is the "data backbone" and why Rust is the "high-performance analytic engine"—to both technical and non-technical audiences.

      Structure and Present a Professional Demo: I helped you organize your project story into a clear, compelling narrative. From a powerful opening hook to a detailed walkthrough of the system's architecture, data flow, and key features, you now have a proven framework for presenting your work in a polished, professional manner, which is crucial for interviews and portfolio showcases.

      Translate Technical Decisions into Business Value: You learned to connect your specific technical choices (e.g., using Rust for its speed, Redpanda for its reliability) to the project's practical benefits (e.g., providing real-time, accurate analytics for traders). This ability to link a "what" (the code) with a "why" (the value) is a highly sought-after skill in the industry.

      Create Strategic Content for a Broader Audience: I guided you in crafting a comprehensive YouTube description that not only explains the project but also uses effective marketing techniques like hooks, key highlights, and relevant hashtags to attract and engage viewers. This shows an understanding of how to package and share your work beyond the confines of a codebase."

---

**🎉 You're ready to start!** Follow the steps above in order, and you'll have a fully functional cryptocurrency trading analytics system running in minutes.

i have uploaded the Demo video in youtube link: https://youtu.be/gMDBAPcT5js