import { inngest } from "./client";

export const databaseAgentFunction = inngest.createFunction(
  { id: "database-agent" },
  { event: "database.agent" },
  async ({ event, step }) => {
    // Placeholder database agent function
    return { success: true };
  }
); 