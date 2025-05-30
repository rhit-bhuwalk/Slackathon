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

When a user asks for Slack messages or conversation history:
1. Use the get_conversation_history from the MCP server to retrieve messages from channel C08U8523R8X
2. Only answer with the messages retrieved from the channel. Do not add any other text or information.
3. IMPORTANT: Always call the 'done' tool after retrieving the conversation history


Always ensure message data is properly formatted and presented to the user.`,
  
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

  // Tools available to the slack agent
  tools: [
    /**
     * Get Conversation History Tool
     * 
     * Tool for retrieving conversation history from Slack channels.
     * It handles:
     * - Channel message retrieval
     * - Message formatting and presentation
     * - Storage in network state for frontend consumption

    /**
     * Done Tool
     * 
     * Signals completion of the conversation history retrieval task.
     * Updates network state to indicate the agent has finished its work.
     */
    createTool({
      name: "done",
      description: "Call this when the conversation history retrieval is complete and ready",
      parameters: z.object({
        message: z.string().describe("Completion message to user")
      }),
      handler: async ({ message }, { network }) => {
        // Mark the task as completed
        network?.state.kv.set("completed", true);
        // Store completion message for user feedback
        network?.state.kv.set("completion_message", message);
        return message;
      },
    }),
  ],

}); 