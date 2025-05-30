import { createServer } from "@inngest/agent-kit/server";
import { assistantNetwork } from "./network";

export const agentKitServer = createServer({
  networks: [assistantNetwork],
});

agentKitServer.listen(3010, () => console.log("Agent kit running!"));