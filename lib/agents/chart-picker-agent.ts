import { 
  createAgent, 
  createTool, 
  anthropic 
} from "@inngest/agent-kit";
import { z } from "zod";

/**
 * Chart Picker Agent
 * 
 * A specialist agent that analyzes user requests to determine:
 * 1. The most appropriate chart type for their data/needs
 * 2. The complete schema/args required to create that chart
 * 
 * This agent understands various data visualization best practices:
 * - Bar charts: Best for comparing categories, showing rankings
 * - Line charts: Best for showing trends over time, continuous data
 * - Area charts: Best for showing cumulative totals and trends
 * - Pie charts: Best for showing parts of a whole, proportions
 * 
 * The agent outputs a complete schema that can be used directly
 * by the chart generation system.
 */
export const chartPickerAgent = createAgent({
  name: "Chart Picker Agent",
  description: "An expert at selecting the right chart type and providing the schema needed to create it",
  
  system: `You are a data visualization expert who specializes in selecting the perfect chart type for any data scenario.

Your role is to:
1. Analyze the user's request to understand their data and goals
2. Consider what story they want to tell with their data
3. Select the most appropriate chart type and variant
4. Output the complete schema/args needed to create that chart

CHART SELECTION GUIDELINES:

BAR CHARTS (bar, bar-horizontal, bar-stacked, bar-multiple):
- Use for: Comparing categories, showing rankings, discrete comparisons
- bar: Standard vertical bars for basic comparisons
- bar-horizontal: When category names are long or you have many categories
- bar-stacked: To show composition of categories
- bar-multiple: To compare multiple series across categories

LINE CHARTS (line, line-multiple, line-step):
- Use for: Showing trends over time, continuous data changes
- line: Single data series over time
- line-multiple: Multiple trends to compare
- line-step: When data changes happen at discrete intervals

AREA CHARTS (area, area-stacked, area-step):
- Use for: Showing cumulative totals, emphasizing magnitude of change
- area: Single series with filled area
- area-stacked: Multiple series showing total and composition
- area-step: Step changes with filled areas

PIE CHARTS (pie, pie-donut, pie-donut-text):
- Use for: Showing parts of a whole, proportions (max 5-7 slices)
- pie: Standard pie chart
- pie-donut: Modern look with center space
- pie-donut-text: Donut with summary text in center

ADVANCED CHARTS:
- radar: Multi-dimensional comparisons (3+ variables)
- radial: Circular bar chart for cyclical data

When you pick a chart, ALWAYS use the pick_chart tool to output the complete schema.`,
  
  model: anthropic({
    model: "claude-sonnet-4-20250514",
    apiKey: process.env.ANTHROPIC_API_KEY,
    defaultParameters: {
      max_tokens: 2048,
    },
  }),
  
  tools: [
    /**
     * Pick Chart Tool
     * 
     * Outputs the selected chart type and complete schema needed to create it.
     * This includes all required fields and appropriate default values.
     */
    createTool({
      name: "pick_chart",
      description: "Output the selected chart type and complete schema needed to create it",
      parameters: z.object({
        chartType: z.enum([
          "bar", 
          "bar-horizontal", 
          "bar-stacked", 
          "bar-multiple",
          "line", 
          "line-multiple", 
          "line-step",
          "area", 
          "area-stacked", 
          "area-step",
          "pie", 
          "pie-donut", 
          "pie-donut-text",
          "radar",
          "radial"
        ]).describe("The selected chart type based on the user's needs"),
        
        reasoning: z.string().describe("Brief explanation of why this chart type was chosen"),
        
        schema: z.object({
          type: z.string().describe("The chart type (same as chartType)"),
          title: z.string().describe("Suggested title for the chart"),
          data: z.array(z.record(z.any())).describe("Example data structure array"),
          xKey: z.string().describe("Key for X-axis data (e.g., 'month', 'category', 'date')"),
          yKey: z.string().describe("Key for Y-axis data (e.g., 'value', 'amount', 'count')"),
          config: z.record(z.any()).describe("Chart configuration object with color and label info"),
          variant: z.string().optional().describe("Chart variant (if different from base type)"),
        }).describe("Complete schema required to create the chart"),
        
        dataRequirements: z.object({
          minimumDataPoints: z.number().describe("Minimum number of data points needed"),
          requiredFields: z.array(z.string()).describe("Required fields in each data object"),
          optionalFields: z.array(z.string()).optional().describe("Optional fields that enhance the chart"),
          dataExample: z.array(z.record(z.any())).describe("Example of properly formatted data"),
        }).describe("Data requirements and format for this chart type"),
      }),
      
      handler: async ({ chartType, reasoning, schema, dataRequirements }, { network }) => {
        // Store the chart selection in network state
        network?.state.kv.set("picked_chart", {
          chartType,
          reasoning,
          schema,
          dataRequirements,
        });
        
        network?.state.kv.set("chart_picked", true);
        network?.state.kv.set("picked_chart_type", chartType);
        
        return `Selected ${chartType} chart. ${reasoning}

Chart Schema:
- Type: ${schema.type}
- Title: ${schema.title}
- X-axis key: ${schema.xKey}
- Y-axis key: ${schema.yKey}
- Minimum data points: ${dataRequirements.minimumDataPoints}
- Required fields: ${dataRequirements.requiredFields.join(', ')}`;
      },
    }),
    
    /**
     * Done Tool
     * 
     * Signals completion of the chart picking task.
     */
    createTool({
      name: "done",
      description: "Call this when chart selection is complete",
      parameters: z.object({
        summary: z.string().describe("Summary of the chart selection")
      }),
      handler: async ({ summary }, { network }) => {
        network?.state.kv.set("completed", true);
        network?.state.kv.set("completion_message", summary);
        return summary;
      },
    }),
    
    /**
     * Generate Data Tool (Placeholder)
     * 
     * Some model versions may incorrectly try to invoke a "generate_data" tool
     * directly from the Chart Picker Agent. To avoid runtime errors, we expose
     * a lightweight stub that simply records the need for data generation in
     * the shared network state.  The Routing Agent will subsequently notice
     * that a chart has been picked but no data_result exists and will route
     * the request to the Data Agent, which owns the real data-generation
     * capabilities ("provide_data" or "no_data_needed").
     */
    createTool({
      name: "generate_data",
      description: "Placeholder tool – records that data generation is required and signals the Routing Agent to invoke the Data Agent.",
      parameters: z.object({
        reason: z.string().describe("Why data generation is needed")
      }),
      handler: async ({ reason }, { network }) => {
        // Mark in state that data generation is required
        network?.state.kv.set("need_data_generation", true);
        network?.state.kv.set("data_generation_reason", reason);
        return `Acknowledged data generation requirement: ${reason}. The Routing Agent should now route to the Data Agent.`;
      },
    }),
    
    /**
     * Clean Data Tool
     * 
     * Placeholder tool to provide feedback and avoid runtime errors when the agent mistakenly calls it.
     */
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