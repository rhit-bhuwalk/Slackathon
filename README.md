# ShadCN Assistant with AgentKit Integration

A Next.js chat application that can generate charts and UI components using both traditional API calls and AgentKit multi-agent architecture.

## Features

- **Dual Architecture Support**: Toggle between traditional Anthropic API calls and AgentKit multi-agent network
- **Chart Generation**: Create various chart types (bar, line, pie, area, radar) with real data
- **UI Component Generation**: Generate functional shadcn/ui components and layouts
- **Real-time Switching**: Switch between architectures without restarting the app

## Architecture Comparison

### Traditional Approach
- Direct API calls to Anthropic Claude
- Single agent handles all tasks
- Simpler but less specialized

### AgentKit Approach
- Multi-agent network with specialized agents:
  - **Chart Generator Agent**: Specialized in data visualization
  - **UI Generator Agent**: Expert in shadcn/ui component creation
  - **Routing Agent**: Intelligent routing between specialized agents
- Better task specialization and routing
- More scalable and maintainable

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- Anthropic API key

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
# Create .env.local file
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### Running the Application

#### Option 1: Traditional API Only
```bash
npm run dev
```
Then toggle off "AgentKit Network" in the UI.

#### Option 2: AgentKit + Traditional (Recommended)
```bash
npm run dev:agentkit
```
This runs both the Next.js dev server and the AgentKit server concurrently.

#### Option 3: AgentKit Server Only
```bash
npm run agentkit
```

## Usage

1. Open [http://localhost:3000](http://localhost:3000) in your browser
2. Use the toggle in the header to switch between:
   - **Traditional API**: Direct Anthropic API calls
   - **AgentKit Network**: Multi-agent specialized routing
3. Try different prompts:
   - **Charts**: "Create a bar chart showing sales data"
   - **UI**: "Create a contact form with validation"
   - **Complex**: "Build a dashboard with charts and user profile cards"

## AgentKit Architecture

### Agents

1. **Chart Generator Agent** (`lib/agents/chart-agent.ts`)
   - Specialized in data visualization
   - Supports 15+ chart types
   - Handles data formatting and configuration

2. **UI Generator Agent** (`lib/agents/ui-agent.ts`) 
   - Expert in shadcn/ui components
   - Supports 11+ UI types (forms, cards, dashboards, etc.)
   - Validates component structure

3. **Routing Agent** (`lib/agents/routing-agent.ts`)
   - Analyzes user requests
   - Routes to appropriate specialist agent
   - Handles task completion

### Network

The `assistantNetwork` (`lib/agents/network.ts`) orchestrates all agents with:
- Shared state management
- Intelligent routing logic
- Result aggregation

## API Endpoints

- `/api/chat` - Traditional Anthropic API
- `/api/agentkit-chat` - AgentKit multi-agent network

## Scripts

- `npm run dev` - Start Next.js development server
- `npm run agentkit` - Start AgentKit server only  
- `npm run dev:agentkit` - Start both servers concurrently
- `npm run build` - Build for production
- `npm run start` - Start production server

## Environment Variables

```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
AGENTKIT_PORT=3010  # Optional: AgentKit server port
```

## Tech Stack

- **Frontend**: Next.js 13, React, Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI
- **Charts**: Recharts
- **AI**: Anthropic Claude, AgentKit by Inngest
- **Architecture**: Multi-agent network with routing

## Key Files

```
lib/
├── agents/
│   ├── chart-agent.ts      # Chart generation specialist
│   ├── ui-agent.ts         # UI component specialist  
│   ├── routing-agent.ts    # Request routing logic
│   └── network.ts          # Agent network orchestration
├── agentkit-server.ts      # AgentKit HTTP server
└── inngest.ts              # Inngest client configuration

app/api/
├── chat/route.ts           # Traditional API endpoint
└── agentkit-chat/route.ts  # AgentKit network endpoint

components/
├── Chat.tsx                # Main chat interface with toggle
├── ChatContainer.tsx       # Message display
├── ChatInput.tsx           # Input handling
└── charts/                 # Chart rendering components

scripts/
└── start-agentkit.ts       # AgentKit server startup
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test both traditional and AgentKit modes
5. Submit a pull request

## License

MIT License - see LICENSE file for details. 