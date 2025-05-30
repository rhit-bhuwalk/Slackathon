import { createNetwork, anthropic } from "@inngest/agent-kit";
import { routingAgent } from "./agents/routing-agent";
import { emailAgent } from "./agents/email-agent";

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
  // Specifies the type of result produced ("chart" or "component")
  result_type?: "chart" | "component";
  // Stores chart configuration and data when a chart is generated
  chart_result?: any;
  // Stores UI component configuration when a UI component is generated
  ui_result?: any;
  
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
 * - UI Agent: Specializes in creating UI components using shadcn/ui
 * - Routing Agent: Analyzes requests and routes them to the appropriate specialist
 * 
 * The network uses Anthropic's Claude model for natural language processing
 * and maintains shared state to coordinate between agents.
 */
export const assistantNetwork = createNetwork<NetworkState>({
  name: "Kush's Support System",
  // Array of specialist agents that can be invoked by the router
  agents: [emailAgent],
  // The routing agent that analyzes requests and directs them to specialists
  router: routingAgent,
  // Default model configuration used by agents that don't specify their own model
  defaultModel: anthropic({
    model: "claude-sonnet-4-20250514",
    apiKey: process.env.ANTHROPIC_API_KEY,
    defaultParameters: {
      max_tokens: 1000,
    },
  }),
}); 