import { createServer } from "@inngest/agent-kit/server";
import { assistantNetwork } from "./agents/network";

export const agentKitServer = createServer({
  networks: [assistantNetwork],
});

// Note: Server is started by scripts/start-agentkit.ts, not automatically 