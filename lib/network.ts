import { createNetwork, anthropic } from "@inngest/agent-kit";
import { routingAgent } from "./agents/routing-agent";
import { emailAgent } from "./agents/email-agent";
import { chartAgent } from "./agents/chart-agent";
import { chartPickerAgent } from "./agents/chart-picker-agent";
import { bemDataCleanerAgent } from "./agents/bem-data-cleaner-agent";
import { dataAgent } from "./agents/data-agent";

/**
 * Network State Interface
 * 
 * Defines the shared state structure that all agents in the network can access and modify.
 * This state persists throughout the entire network execution and enables coordination
 * between different agents.
 */
export interface NetworkState {
  // === Routing State ===
  // Tracks which agent the router has directed the request to
  routed_to?: string;
  // Stores the reasoning behind the routing decision
  routing_reason?: string;
  // Indicates if the overall task has been completed by an agent
  task_completed?: boolean;
  // Final summary of what was accomplished
  final_summary?: string;
  
  // === Result States ===
  // Specifies the type of result produced ("chart" or "component" or "chart_selection")
  result_type?: "chart" | "component" | "chart_selection";
  // Stores chart configuration and data when a chart is generated
  chart_result?: any;
  // Stores UI component configuration when a UI component is generated
  ui_result?: any;
  
  // === Chart Picker States ===
  // Stores the selected chart information including type, schema, and requirements
  picked_chart?: {
    chartType: string;
    reasoning: string;
    schema: any;
    dataRequirements: any;
  };
  // Boolean flag indicating if a chart has been picked
  chart_picked?: boolean;
  // The selected chart type
  picked_chart_type?: string;
  
  // === BEM Data Cleaner States ===
  // BEM pipeline ID for data transformation
  bem_pipeline_id?: string;
  // Full BEM pipeline information
  bem_pipeline_info?: {
    id: string;
    name: string;
    chartType: string;
    schema: any;
    inboxEmail?: string;
  };
  // Cleaned data from BEM transformation
  cleaned_data?: any;
  // Flag indicating data has been cleaned
  data_cleaned?: boolean;
  // Prepared chart data ready for visualization
  prepared_chart_data?: any;
  // Flag indicating data is ready for chart generation
  data_ready_for_chart?: boolean;
  
  // === Data States ===
  // Raw data result from data agent
  data_result?: {
    query: string;
    data: any[];
    metadata: any;
  };
  // Data query string
  data_query?: string;
  
  // === Completion States ===
  // Boolean flag indicating if an agent has finished its work
  completed?: boolean;
  // Message from the agent about what was completed
  completion_message?: string;
}

/**
 * ShadCN Assistant Network
 * 
 * A multi-agent system that can generate charts and UI components.
 * The network consists of:
 * - Chart Agent: Specializes in data visualization and chart generation
 * - Chart Picker Agent: Selects appropriate chart types and provides schemas
 * - BEM Data Cleaner Agent: Transforms raw data to match chart requirements
 * - UI Agent: Specializes in creating UI components using shadcn/ui
 * - Email Agent: Handles email operations
 * - Routing Agent: Analyzes requests and routes them to the appropriate specialist
 * 
 * The network uses Anthropic's Claude model for natural language processing
 * and maintains shared state to coordinate between agents.
 */
export const assistantNetwork = createNetwork<NetworkState>({
  name: "Kush's Support System",
  // Array of specialist agents that can be invoked by the router
  agents: [emailAgent, chartAgent, chartPickerAgent, bemDataCleanerAgent, dataAgent],
  // The routing agent that analyzes requests and directs them to specialists
  router: routingAgent,
  // Maximum iterations to prevent infinite loops
  maxIter: 10,
  // Default model configuration used by agents that don't specify their own model
  defaultModel: anthropic({
    model: "claude-sonnet-4-20250514",
    apiKey: process.env.ANTHROPIC_API_KEY,
    defaultParameters: {
      max_tokens: 4000,
    },
  }),
}); 