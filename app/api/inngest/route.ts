import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { assistantNetwork } from "@/lib/network";


export const { GET, POST, PUT } = serve({
  client: inngest,
  networks: [assistantNetwork],
});
