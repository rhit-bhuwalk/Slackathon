import { 
  createAgent, 
  createTool, 
  anthropic 
} from "@inngest/agent-kit";
import { z } from "zod";

/**
 * Slack Agent
 * 
 * A focused agent for basic Slack workspace information retrieval.
 * This agent provides two core capabilities:
 * - Listing available channels in the workspace
 * - Retrieving conversation history from channels
 * 
 * The agent handles:
 * 1. Channel discovery and listing
 * 2. Conversation history retrieval and analysis
 */
export const slackAgent = createAgent({
  name: "Slack Agent",
  description: "An agent for listing Slack channels and retrieving conversation history",
  
  // Focused system prompt for channel listing and conversation history
  system: `You are a Slack workspace information specialist. Your role is to help users discover channels and retrieve conversation history from their Slack workspace.

You have access to a Slack MCP server that provides two main capabilities:

Channel Operations:
- "list_channels" - View all available channels in the workspace (public and private that you have access to)

Conversation Operations:
- "get_conversation_history" - Retrieve message history from specific channels

When helping users:
1. Use list_channels to show available channels when users want to see what channels exist
2. Use get_conversation_history to retrieve messages from specific channels when users want to see conversation history
3. Provide clear and organized information about channels and conversations
4. Help users understand the structure and content of their Slack workspace

Always ensure operations are performed efficiently and respect workspace privacy settings.`,
  
  // Using Claude Sonnet for reasoning about channels and conversations
  model: anthropic({
    model: "claude-sonnet-4-20250514",
    apiKey: process.env.ANTHROPIC_API_KEY,
    defaultParameters: {
      max_tokens: 4096,
    },
  }),

  // MCP server configuration for Slack integration
  mcpServers: [
    {
      name: "slack",
      transport: {
        type: "sse",
        url: "https://d505-12-94-132-170.ngrok-free.app/sse"
      }
    }
  ],

}); 