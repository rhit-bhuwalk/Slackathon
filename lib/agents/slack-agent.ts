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

1. Call the MCP tool: conversations_history
   - Set channel_id to "C08U8523R8X" 
   - Set limit to the number requested (default "10")

2. Parse the CSV response which will be in this format:
   UserID,UserName,RealName,Channel,Text,Time,Cursor
   U07NVG47L3S,kushbhuwalka,Kush Bhuwalka,C08U8523R8X,i troubleshooting issue ,1748641049.115259,

3. Extract EACH message row and create an array of message objects:
   - username: from RealName column (e.g., "Kush Bhuwalka")
   - text: from Text column (e.g., "i troubleshooting issue")
   - timestamp: from Time column (e.g., "1748641049.115259")

4. CRITICAL: Call the done tool with BOTH parameters. Here is the EXACT format you must use:

done tool call:
{
  "summary": "Retrieved X messages from Slack channel",
  "messages": [
    {
      "username": "Kush Bhuwalka",
      "text": "actual message text from CSV",
      "timestamp": "actual timestamp from CSV"
    },
    {
      "username": "Kush Bhuwalka", 
      "text": "next message text",
      "timestamp": "next timestamp"
    }
  ]
}

DO NOT:
- Just describe the messages in your response text
- Call done with only a summary
- Skip the messages array

YOU MUST:
- Parse each row of the CSV into the messages array
- Include BOTH summary AND messages in the done tool call
- Use the exact structure shown above

Example for "show me my last 2 slack messages":
1. Call conversations_history with channel_id="C08U8523R8X" and limit="2"
2. Receive CSV:
   UserID,UserName,RealName,Channel,Text,Time,Cursor
   U07NVG47L3S,kushbhuwalka,Kush Bhuwalka,C08U8523R8X,working on bug fix,1748641049.115259,
   U07NVG47L3S,kushbhuwalka,Kush Bhuwalka,C08U8523R8X,meeting at 3pm,1748641044.150759,
3. Call done with:
   {
     "summary": "Retrieved 2 messages from Slack channel",
     "messages": [
       {"username": "Kush Bhuwalka", "text": "working on bug fix", "timestamp": "1748641049.115259"},
       {"username": "Kush Bhuwalka", "text": "meeting at 3pm", "timestamp": "1748641044.150759"}
     ]
   }`,
  
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
     * Done Tool
     * 
     * Signals completion of the conversation history retrieval task.
     * Updates network state to indicate the agent has finished its work.
     */
    createTool({
      name: "done",
      description: "Call this when the conversation history retrieval is complete. MUST include the messages array with parsed CSV data.",
      parameters: z.object({
        summary: z.string().describe("Summary of what was accomplished"),
        messages: z.array(z.object({
          username: z.string(),
          text: z.string(),
          timestamp: z.string()
        })).describe("REQUIRED: Array of formatted messages parsed from the CSV response")
      }),
      handler: async ({ summary, messages }, { network }) => {
        // Mark the task as completed
        network.state.data.completed = true;
        network.state.data.task_completed = true;
        network.state.data.result_type = "conversation";
        
        // Store completion message for user feedback (using API expected keys)
        network.state.data.completion_message = summary;
        network.state.data.final_summary = summary;
        
        // Store formatted messages - this is now always provided
        network.state.data.conversation_result = messages;
        
        return summary;
      },
    }),
  ],

}); 