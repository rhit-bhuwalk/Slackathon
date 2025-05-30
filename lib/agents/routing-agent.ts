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
  system: `You are a routing supervisor for a multi-agent system that can generate charts, UI components, manage emails, help pick visualizations, provide data, and clean data.

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

5. **Email Agent** - Route here for:
   - Email sending and composing
   - Email searching and reading
   - Email management (labels, drafts, etc.)
   - Gmail-related operations
   - Email automation requests

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
        agent: z.enum(["Chart Generator Agent", "Chart Picker Agent", "BEM Data Cleaner Agent", "Data Agent", "Email Agent", "UI Generator Agent"]).describe("The agent to route the request to"),
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
      const pickedChart = network?.state.kv.get("picked_chart");
      const dataResult = network?.state.kv.get("data_result");
      const cleanedData = network?.state.kv.get("cleaned_data");
      const preparedChartData = network?.state.kv.get("prepared_chart_data");
      
      // Check for final results
      if (chartResult || uiResult) {
        console.log('Task already completed - final result exists in state');
        // Set completion flags
        network?.state.kv.set("completed", true);
        network?.state.kv.set("task_completed", true);
        if (chartResult) {
          network?.state.kv.set("completion_message", "Chart has been successfully generated!");
          network?.state.kv.set("final_summary", "Chart generation completed");
        } else if (uiResult) {
          network?.state.kv.set("completion_message", "UI component has been successfully generated!");
          network?.state.kv.set("final_summary", "UI generation completed");
        }
        // Return undefined to stop routing
        return undefined;
      }
      
      // Check pipeline progress for visualization workflow
      if (pickedChart && !dataResult) {
        console.log('Chart type picked, routing to Data Agent for data generation');
        return ["Data Agent"];
      }
      
      if (pickedChart && dataResult && !cleanedData) {
        console.log('Chart type and raw data available, routing to BEM Data Cleaner for transformation');
        return ["BEM Data Cleaner Agent"];
      }
      
      if (preparedChartData && !chartResult) {
        console.log('Data cleaned and prepared, routing to Chart Agent for visualization');
        return ["Chart Generator Agent"];
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