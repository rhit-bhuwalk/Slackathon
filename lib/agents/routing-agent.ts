import { 
  createRoutingAgent, 
  createTool, 
  anthropic 
} from "@inngest/agent-kit";
import { z } from "zod";

/**
 * Routing Agent
 * 
 * This is the main orchestrator of the multi-agent system. It analyzes incoming user
 * requests and intelligently routes them to the appropriate specialist agent.
 * 
 * The routing agent uses natural language processing to:
 * 1. Understand the user's intent (chart generation vs UI creation)
 * 2. Route to the most suitable specialist agent
 * 3. Track completion status and provide final summaries
 * 
 * Routing Logic:
 * - Chart requests → Chart Agent (data visualization, graphs, statistical displays)
 * - UI requests → UI Agent (components, layouts, forms, dashboards)
 */
export const routingAgent = createRoutingAgent({
  name: "Assistant Router",
  description: "Routes user requests to appropriate specialist agents",
  
  // Detailed system prompt that defines the routing behavior and decision criteria
  system: `You are a routing supervisor for a multi-agent system that can generate charts, UI components, and manage Slack.

Your role is to analyze user requests and route them to the appropriate specialist agent:

1. **Chart Agent** - Route here for:
   - Data visualization requests
   - Chart creation (bar, line, pie, area, radar, etc.)
   - Graph generation
   - Statistical visualizations
   - Data analysis displays

2. **Slack Agent** - Route here for:
    - Slack channel listing
    - Slack conversation history retrieval

3. **UI Agent** - Route here for:
   - User interface creation
   - Component generation (forms, cards, modals, tables, etc.)
   - Layout design
   - Dashboard creation
   - Navigation elements
   - Settings pages
   - Authentication interfaces

Decision process:
1. Analyze the user's request
2. Determine if they want data visualization (charts) or interface components (UI)
3. Route to the appropriate agent using the route_to_agent tool
4. If the agent has completed their work, call the done tool

Always route to exactly one agent based on the primary intent of the request.`,
  
  // Using Claude Haiku for fast routing decisions
  model: anthropic({
    model: "claude-sonnet-4-20250514",
    apiKey: process.env.ANTHROPIC_API_KEY,
    defaultParameters: {
      max_tokens: 1000,
    },
  }),
  
  // Tools available to the routing agent for coordination
  tools: [
    /**
     * Route to Agent Tool
     * 
     * This tool directs the request to a specific specialist agent.
     * It updates the network state to track routing decisions and reasoning.
     */
    createTool({
      name: "route_to_agent",
      description: "Route the request to the appropriate specialist agent",
      parameters: z.object({
        agent: z.enum(["Chart Generator Agent", "UI Generator Agent", "Slack Agent"]).describe("The agent to route the request to"),
        reasoning: z.string().describe("Explanation for why this agent was chosen")
      }),
      handler: async ({ agent, reasoning }, { network }) => {
        // Store routing decision in shared network state for tracking
        network?.state.kv.set("routed_to", agent);
        network?.state.kv.set("routing_reason", reasoning);
        return `Routing to ${agent}: ${reasoning}`;
      },
    }),
    
    /**
     * Done Tool
     * 
     * Called when the routing agent determines that the task has been completed
     * by the appropriate specialist agent. This marks the end of the workflow.
     */
    createTool({
      name: "done",
      description: "Call this when the task is completed by the appropriate agent",
      parameters: z.object({
        summary: z.string().describe("Summary of what was accomplished")
      }),
      handler: async ({ summary }, { network }) => {
        // Mark task as completed and store final summary
        network?.state.kv.set("task_completed", true);
        network?.state.kv.set("final_summary", summary);
        
        // Also set the completed flag for consistency
        network?.state.kv.set("completed", true);
        network?.state.kv.set("completion_message", summary);
        
        return summary;
      },
    }),
  ],
  
  /**
   * Lifecycle Hook: onRoute
   * 
   * This determines which agent should be called next based on the routing
   * agent's tool calls. It implements the actual routing logic after the
   * routing agent makes its decision.
   */
  lifecycle: {
    onRoute: ({ result, network }) => {
      console.log('=== ROUTING DEBUG ===');
      console.log('Result:', JSON.stringify(result, null, 2));
      console.log('Tool calls:', result.toolCalls);
      
      // Check if we already have a result in the network state
      const chartResult = network?.state.kv.get("chart_result");
      const uiResult = network?.state.kv.get("ui_result");
      const conversationResult = network?.state.kv.get("conversation_result");
      
      if (chartResult || uiResult || conversationResult) {
        console.log('Task already completed - result exists in state');
        // Set completion flags
        network?.state.kv.set("completed", true);
        network?.state.kv.set("task_completed", true);
        if (chartResult) {
          network?.state.kv.set("completion_message", "Chart has been successfully generated!");
          network?.state.kv.set("final_summary", "Chart generation completed");
        } else if (uiResult) {
          network?.state.kv.set("completion_message", "UI component has been successfully generated!");
          network?.state.kv.set("final_summary", "UI generation completed");
        } else if (conversationResult) {
          network?.state.kv.set("completion_message", "Slack conversation history has been retrieved!");
          network?.state.kv.set("final_summary", "Slack conversation retrieval completed");
        }
        // Return undefined to stop routing
        return undefined;
      }
      
      // Extract the first tool call from the routing agent's response
      const toolCall = result.toolCalls?.[0];
      
      // If the routing agent called route_to_agent, extract the target agent name
      if (toolCall?.tool.name === "route_to_agent") {
        // The agent name is in the original tool input from the LLM response
        // We need to look at the actual tool use in the output
        const toolUse = result.output?.find((o: any) => o.type === 'tool_call');
        const agentName = (toolUse as any)?.tools?.[0]?.input?.agent as string | undefined;
        
        console.log('Tool use found:', toolUse);
        console.log('Agent name extracted:', agentName);
        console.log('Available agents:', Array.from(network?.agents.keys() || []));
        
        if (agentName) {
          // Return array with agent name to invoke that specific agent
          return [agentName] as string[];
        }
      }
      
      // If the routing agent called done, don't route anywhere (end the workflow)
      if (toolCall?.tool.name === "done") {
        console.log('Routing complete - done tool called');
        return undefined;
      }
      
      // Default: don't route anywhere
      console.log('No routing - no valid agent name found');
      return undefined;
    },
  },
}); 