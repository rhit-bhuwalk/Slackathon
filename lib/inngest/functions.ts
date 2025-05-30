import { inngest } from "./client";
import { assistantNetwork } from "@/lib/network";

export const networkFunction = inngest.createFunction(
  { id: "agentkit-chat" },
  { event: "agentkit/chat.request" },
  async ({ event, step }) => {
    const result = await assistantNetwork.run(event.data.input);
    
    // Extract all the state values
    const state = {
      resultType: result.state.kv.get("result_type"),
      completed: result.state.kv.get("completed"),
      completionMessage: result.state.kv.get("completion_message"),
      finalSummary: result.state.kv.get("final_summary"),
      chartResult: result.state.kv.get("chart_result"),
      uiResult: result.state.kv.get("ui_result"),
      routedTo: result.state.kv.get("routed_to"),
      taskCompleted: result.state.kv.get("task_completed")
    };
    
    return { 
      success: true,
      state
    };
  }
);