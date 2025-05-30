import { createServer } from "@inngest/agent-kit/server";
import { assistantNetwork } from "./agents/network";

export const agentKitServer = createServer({
  networks: [assistantNetwork],
});

// Only start the server if we're not in a serverless environment
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  const port = process.env.AGENTKIT_PORT || 3010;
  
  agentKitServer.listen(Number(port), () => {
    console.log(`AgentKit server running on port ${port}`);
  });
} 