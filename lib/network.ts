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
  
  // === Email Result States ===
  // Specifies the type of email operation performed
  email_action?: "send" | "draft" | "read" | "search" | "compose" | "list";
  // Stores email operation results
  email_result?: any;
  // Email operation status
  email_status?: "success" | "error" | "pending";
  // Email operation message
  email_message?: string;
  
  // === Completion States ===
  // Boolean flag indicating if an agent has finished its work
  completed?: boolean;
  // Message from the agent about what was completed
  completion_message?: string;
}

/**
 * Email Support System Network
 * 
 * A multi-agent system focused on email management and communications.
 * The network consists of:
 * - Email Agent: Specializes in Gmail operations (send, read, search, manage)
 * - Routing Agent: Analyzes requests and routes them to the appropriate specialist
 * 
 * The network uses Anthropic's Claude model for natural language processing
 * and maintains shared state to coordinate between agents.
 */
export const assistantNetwork = createNetwork<NetworkState>({
  name: "Kush's Support System",
  agents: [emailAgent],
  router: routingAgent,
  defaultModel: anthropic({
    model: "claude-sonnet-4-20250514",
    apiKey: process.env.ANTHROPIC_API_KEY,
    defaultParameters: {
      max_tokens: 1000,
    },
  }),
}); 