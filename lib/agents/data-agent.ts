import { createAgent, createTool, anthropic } from "@inngest/agent-kit";
import { z } from "zod";

/**
 * Data Agent
 * Handles data fetching and generation for visualizations
 * For now, it generates dummy data but can be extended to fetch real data
 */
export const dataAgent = createAgent({
  name: "Data Agent",
  description: "Fetches or generates data for visualizations and analysis",
  
  system: `You are a data specialist that provides data for visualizations and analysis.

When asked for data:
1. Understand what kind of data is needed
2. Generate appropriate dummy data (later this can fetch from real sources)
3. Structure it properly for the requested visualization
4. Use the provide_data tool to return the data

Common data patterns:
- Time series: Array of {date, value} objects
- Categories: Array of {category, value} objects
- Multi-series: Array of objects with multiple value keys
- Hierarchical: Nested structures for tree/sunburst charts`,
  
  model: anthropic({
    model: "claude-sonnet-4-20250514",
    apiKey: process.env.ANTHROPIC_API_KEY,
    defaultParameters: {
      max_tokens: 2048,
    },
  }),
  
  tools: [
    createTool({
      name: "provide_data",
      description: "Provide data for visualization or analysis",
      parameters: z.object({
        query: z.string().describe("What data was requested"),
        data: z.array(z.record(z.any())).describe("The data array"),
        metadata: z.object({
          description: z.string().describe("Description of the data"),
          suggestedVisualization: z.enum([
            "bar", "line", "area", "pie", "scatter", "radar", "funnel", "treemap"
          ]).optional().describe("Suggested chart type for this data"),
          keys: z.object({
            x: z.string().optional().describe("Key for x-axis"),
            y: z.string().optional().describe("Key for y-axis"),
            value: z.string().optional().describe("Key for values (pie/donut)"),
            category: z.string().optional().describe("Key for categories"),
          }).optional(),
        }),
      }),
      handler: async ({ query, data, metadata }, { network }) => {
        // Store the data in network state
        network?.state.kv.set("data_result", {
          query,
          data,
          metadata,
        });
        network?.state.kv.set("data_query", query);
        
        return `Provided ${data.length} data points for: ${query}`;
      },
    }),
    
    createTool({
      name: "no_data_needed",
      description: "Call this when the request doesn't require data generation",
      parameters: z.object({
        reason: z.string().describe("Why no data is needed"),
      }),
      handler: async ({ reason }, { network }) => {
        network?.state.kv.set("data_result", null);
        return reason;
      },
    }),

    createTool({
      name: "clean_data",
      description: "Placeholder tool – records that data cleaning is required and signals the Routing Agent to invoke the BEM Data Cleaner Agent.",
      parameters: z.object({
        reason: z.string().describe("Why data cleaning is required")
      }),
      handler: async ({ reason }, { network }) => {
        network?.state.kv.set("need_data_cleaning", true);
        network?.state.kv.set("data_cleaning_reason", reason);
        return `Data cleaning requested: ${reason}. The Routing Agent should now route to the BEM Data Cleaner Agent.`;
      },
    }),
  ],
}); 