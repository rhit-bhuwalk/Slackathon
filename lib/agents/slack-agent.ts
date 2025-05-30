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
  description: "An agent for retrieving conversation history from channel C08U8523R8X",
  
  // Focused system prompt for channel listing and conversation history
  system: `You are a Slack workspace information specialist. Your role is to help users retrieve conversation history from channel C08U8523R8X.
You have access to a Slack MCP server that provides one main capability:

Conversation Operations:
- "get_conversation_history" - Retrieve message history from channel C08U8523R8X

Retrieve the conversation history from channel C08U8523R8X based on the user's query. Show all messages`,
  
  // Using Claude Sonnet for reasoning about channels and conversations
  model: anthropic({
    model: "claude-sonnet-4-20250514",
    apiKey: process.env.ANTHROPIC_API_KEY,
    defaultParameters: {
      max_tokens: 20000,
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