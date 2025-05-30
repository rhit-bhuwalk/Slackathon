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
  system: `You are a routing supervisor for a multi-agent system that can generate charts, UI components, manage emails, help pick visualizations, provide data, clean data, and manage Slack.

Your role is to analyze user requests and route them to the appropriate specialist agent:

1. **Chart Agent** - Route here for:
   - Direct chart creation when clean, prepared data is already available
   - Final chart generation after data has been cleaned
   - When prepared_chart_data exists in state

2. **Chart Picker Agent** - Route here for:
   - When user asks what type of chart they should use
   - Questions about which visualization is best for their data
   - Initial requests for data visualization (starts the pipeline)
   - When user wants to understand chart schema/requirements

3. **Data Agent** - Route here for:
   - When user needs sample data for visualization
   - Data generation requests
   - After chart type is picked but before BEM cleaning
   - When picked_chart exists but no raw data is available

4. **BEM Data Cleaner Agent** - Route here for:
   - After Data Agent has provided raw data
   - When raw data needs to be transformed to match chart requirements
   - Data cleaning and structuring tasks
   - When both picked_chart and data_result exist

5. **Slack Agent** - Route here for:
    - Slack channel listing
    - Slack conversation history retrieval

6. **UI Agent** - Route here for:
   - User interface creation
   - Component generation (forms, cards, modals, tables, etc.)
   - Layout design
   - Dashboard creation
   - Navigation elements
   - Settings pages
   - Authentication interfaces

DATA VISUALIZATION PIPELINE:
1. User requests visualization → Chart Picker Agent (determines chart type & schema)
2. Chart schema exists → Data Agent (generates or fetches raw data)
3. Raw data available → BEM Data Cleaner Agent (creates pipeline & transforms data)
4. Clean data ready → Chart Agent (generates the final visualization)

Decision process:
1. Check the network state for existing results and progress
2. For visualization requests, follow the pipeline sequence
3. Route to the next appropriate agent in the workflow
4. If the agent has completed their work, check if more steps are needed
5. Call the done tool only when the entire pipeline is complete

Always route to exactly one agent based on the current state and workflow progress.`,
  
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
        agent: z.enum(["Chart Generator Agent", "Chart Picker Agent", "BEM Data Cleaner Agent", "Data Agent", "Slack Agent", "UI Generator Agent"]).describe("The agent to route the request to"),
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
      const pickedChart = network?.state.kv.get("picked_chart");
      const dataResult = network?.state.kv.get("data_result");
      const cleanedData = network?.state.kv.get("cleaned_data");
      const preparedChartData = network?.state.kv.get("prepared_chart_data");
      
      // Check for final results
      if (chartResult || uiResult || conversationResult) {
        console.log('Task already completed - final result exists in state');
        // Set completion flags
        network?.state.kv.set("completed", true);
        network?.state.kv.set("task_completed", true);
        if (chartResult) {
          network?.state.kv.set("result_type", "chart");
        } else if (uiResult) {
          network?.state.kv.set("result_type", "component"); 
        } else if (conversationResult) {
          network?.state.kv.set("result_type", "conversation");
        }
        return undefined;
      }

      // Process tool calls to determine routing
      const routeCall = result.toolCalls?.find(call => call.tool.name === "route_to_agent");
      const doneCall = result.toolCalls?.find(call => call.tool.name === "done");

      if (doneCall) {
        console.log('Done call detected - marking task as completed');
        return undefined;
      }

      if (!routeCall) {
        console.log('No route call found');
        return undefined;
      }

      const agentName = (routeCall as any).arguments?.agent;
      console.log(`Routing to agent: ${agentName}`);

      // Map agent names to actual agent instances
      switch (agentName) {
        case "Chart Generator Agent":
          return ["chartAgent"];
        case "Chart Picker Agent":
          return ["chartPickerAgent"];
        case "BEM Data Cleaner Agent":
          return ["bemDataCleanerAgent"];
        case "Data Agent":
          return ["dataAgent"];
        case "Slack Agent":
          return ["slackAgent"];
        case "UI Generator Agent":
          return ["uiAgent"];
        default:
          console.log(`Unknown agent: ${agentName}`);
          return undefined;
      }
    }
  }
}); 