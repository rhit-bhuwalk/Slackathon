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
  system: `You are a routing supervisor for a multi-agent system that can generate charts and UI components.

Your role is to analyze user requests and route them to the appropriate specialist agent:

1. **Email Agent** - Route here for:
   - Email management requests
   - Gmail communication workflows
   - Email organization and search
   - Email sending and composition
   - Label and folder management

2. **Chart Generator Agent** - Route here for:
   - Data visualization requests
   - Chart creation (bar, line, pie, area, radar, etc.)
   - Graph generation
   - Statistical visualizations
   - Data analysis displays

3. **UI Generator Agent** - Route here for:
   - User interface creation
   - Component generation (forms, cards, modals, tables, etc.)
   - Layout design  
   - Dashboard creation
   - Navigation elements
   - Settings pages
   - Authentication interfaces

Decision process:
1. Analyze the user's request
2. Determine if they want email management, data visualization (charts), or interface components (UI)
3. Route to the appropriate agent using the route_to_agent tool
4. If the appropriate agent has completed their work, call the done tool

Always route to exactly one agent based on the primary intent of the request.`,
  
  // Using Claude Haiku for fast routing decisions
  model: anthropic({
    model: "claude-sonnet-4-20250514",
    apiKey: process.env.ANTHROPIC_API_KEY,
    defaultParameters: {
      max_tokens: 20000,
    },
  }),
  
  
  tools: [
    createTool({
      name: "route_to_agent",
      description: "Route the request to the appropriate specialist agent",
      parameters: z.object({
        agent: z.enum(["Email Agent", "Chart Generator Agent", "UI Generator Agent"]).describe("The agent to route the request to"),
      }),
      handler: async ({ agent }, { network }) => {
        return `Routing to ${agent}`;
      },
    }),
    
    
    createTool({
      name: "done",
      description: "Call this when the task is completed by the appropriate agent",
      parameters: z.object({
        summary: z.string().describe("Summary of what was accomplished")
      }),
      handler: async ({ summary }, { network }) => {
        // Mark task as completed and store final summary
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
      // Extract the first tool call from the routing agent's response
      const toolCall = result.toolCalls?.[0];
      
      // If the routing agent called route_to_agent, extract the target agent name
      if (toolCall?.tool.name === "route_to_agent" && toolCall.content) {
        if (
          typeof toolCall.content === "object" &&
          toolCall.content !== null &&
          "data" in toolCall.content &&
          typeof toolCall.content.data === "string"
        ) {
          return [toolCall.content.data];
        }
      }
      
      // If the routing agent called done, don't route anywhere (end the workflow)
      if (toolCall?.tool.name === "done") {
        return;
      }
      
      // Default: don't route anywhere
      return;
    },
  },
}); 