#!/usr/bin/env tsx

import { agentKitServer } from '../lib/agentkit-server';

console.log('🤖 Starting AgentKit server...');

// Start AgentKit server on a different port for development
const port = process.env.AGENTKIT_PORT || 3010;

agentKitServer.listen(Number(port), () => {
  console.log(`🚀 AgentKit server running on port ${port}`);
  console.log(`📊 Chart Agent ready`);
  console.log(`🎨 UI Agent ready`);
  console.log(`📧 Email Agent ready`);
  console.log(`🧭 Routing Agent ready`);
}); 