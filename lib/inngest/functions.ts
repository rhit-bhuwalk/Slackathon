import { inngest } from "./client";
import { assistantNetwork } from "@/lib/network";

export const networkFunction = inngest.createFunction(
  { id: "support-system-email-agent" },
  { event: "email.agent" },
  async ({ event, step }) => {
    await assistantNetwork.run(event.data.input);
    return { success: true };
  }
);