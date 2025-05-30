# AgentKit Setup Guide

## 🚀 Quick Start

To get the full AgentKit multi-agent system working with real responses:

```bash
npm run dev:all
```

This single command starts everything you need:
- ✅ Next.js app (port 3000)
- ✅ AgentKit server (port 3010) 
- ✅ Inngest dev server (port 8288)

## 🔑 Prerequisites

1. **Anthropic API Key** - Already configured in `.env.local` ✅
2. **Node.js** - Version 20.x or higher
3. **All dependencies installed** - Run `npm install` if needed

## 🎯 Testing the System

1. **Open your browser** to http://localhost:3000
2. **Try these example queries:**
   - "Create a bar chart of monthly sales data"
   - "Generate a pie chart showing user demographics"
   - "Create a line chart for quarterly revenue"

3. **Monitor the execution** at http://localhost:8288/functions
   - You'll see the routing agent analyzing your request
   - Watch as it routes to the appropriate specialist agent
   - See the final response being generated

## 🔧 Understanding the Components

### 1. **Next.js App** (Port 3000)
- Your frontend application
- Sends requests to `/api/agentkit-chat`

### 2. **AgentKit Server** (Port 3010)
- Hosts your multi-agent network
- Manages agent orchestration
- Exposes network as HTTP endpoints

### 3. **Inngest Dev Server** (Port 8288)
- Provides orchestration engine
- Enables tracing and debugging
- Handles retries and state management
- **REQUIRED** for AgentKit to function properly

## 🐛 Troubleshooting

### "Getting boilerplate responses"
- Make sure **all three services** are running
- Check http://localhost:8288 - Inngest dashboard should be accessible
- Verify your API key is set in `.env.local`

### "Agent not responding"
- Check the Inngest dashboard for function executions
- Look for errors in the console where you ran `npm run dev:all`
- Ensure the chart agent is properly added to the network (it is ✅)

### "API key errors"
- Your key should start with `sk-ant-api03-`
- Make sure there are no extra spaces in `.env.local`
- Restart all services after changing the API key

## 📊 Current Network Configuration

Your network includes:
- **Routing Agent** - Analyzes requests and routes to specialists
- **Chart Agent** - Creates data visualizations

## 🔍 Viewing Agent Execution

1. Open http://localhost:8288/functions
2. Click on "Assistant Router" or "Kush's Support System"
3. Watch real-time execution of your multi-agent system
4. See detailed logs, state changes, and agent decisions

## 💡 How It Works

1. **User sends message** → Next.js API (`/api/agentkit-chat`)
2. **API calls** → `assistantNetwork.run(message)`
3. **Routing Agent** → Analyzes request with Anthropic Claude
4. **Routes to specialist** → Chart Agent
5. **Specialist executes** → Makes its own Anthropic API call
6. **Stores results** → In network state (key-value store)
7. **Returns to frontend** → Structured response with chart/UI data

## 🛑 Stopping the Services

Press `Ctrl+C` in the terminal where you ran `npm run dev:all`. All services will shut down gracefully. 