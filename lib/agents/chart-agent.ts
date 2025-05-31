import { 
  createAgent, 
  createTool, 
  anthropic 
} from "@inngest/agent-kit";
import { z } from "zod";

/**
 * Chart Generator Agent
 * 
 * A specialist agent focused on creating data visualizations and charts.
 * This agent can generate various types of charts including:
 * - Bar charts (standard, horizontal, stacked, multiple)
 * - Line charts (standard, multiple series, step)
 * - Area charts (standard, stacked, step)
 * - Pie charts (standard, donut, with text)
 * - Advanced charts (radar, radial)
 * 
 * The agent handles:
 * 1. Analyzing user requests for chart requirements
 * 2. Determining the most appropriate chart type
 * 3. Structuring and formatting data for visualization
 * 4. Generating chart configurations compatible with the UI system
 */
export const chartAgent = createAgent({
  name: "Chart Generator Agent",
  description: "An expert at generating charts and visualizations",
  
  // Comprehensive system prompt defining the agent's capabilities and workflow
  system: `You are a chart generation specialist. Your role is to create various types of charts and visualizations based on user requests.

Available chart types:
- BAR CHARTS: bar, bar-horizontal, bar-stacked, bar-multiple
- LINE CHARTS: line, line-multiple, line-step  
- AREA CHARTS: area, area-stacked, area-step
- PIE CHARTS: pie, pie-donut, pie-donut-text
- ADVANCED: radar, radial

When generating a chart:
1. First check if prepared_chart_data exists in the network state (from BEM Data Cleaner)
2. If prepared data exists, use it directly with generate_chart_from_prepared_data
3. Otherwise, use the standard generate_chart tool
4. IMPORTANT: Always call the 'done' tool after generating the chart
5. Provide helpful context about the chart

The prepared data from BEM will already have the correct structure and format.`,
  
  // Using Claude Sonnet for more complex reasoning about data visualization
  model: anthropic({
    model: "claude-sonnet-4-20250514",
    apiKey: process.env.ANTHROPIC_API_KEY,
    defaultParameters: {
      max_tokens: 4096,
    },
  }),
  
  // Tools available to the chart agent
  tools: [
    /**
     * Generate Chart from Prepared Data Tool
     * 
     * Uses pre-cleaned and structured data from BEM Data Cleaner Agent
     */
    createTool({
      name: "generate_chart_from_prepared_data",
      description: "Generate a chart using prepared data from BEM Data Cleaner Agent",
      parameters: z.object({
        useNetworkData: z.boolean().describe("Whether to use prepared_chart_data from network state")
      }),
      handler: async ({ useNetworkData }, { network }) => {
        if (!useNetworkData) {
          return "Please set useNetworkData to true to use prepared data.";
        }
        
        const preparedData = network?.state.kv.get("prepared_chart_data");
        if (!preparedData) {
          return "No prepared chart data found. Please use the standard generate_chart tool.";
        }
        
        // Store chart result in network state for API to retrieve
        network?.state.kv.set("chart_result", preparedData);
        // Mark result type as chart for proper handling in the API
        network?.state.kv.set("result_type", "chart");
        
        return `Created ${preparedData.type} chart titled "${preparedData.title}" with ${preparedData.data.length} cleaned data points from BEM.`;
      },
    }),
    
    /**
     * Generate Chart Tool
     * 
     * The primary tool for creating charts. It handles:
     * - Chart type selection and validation
     * - Data structuring and formatting
     * - Configuration generation for rendering
     * - Storage in network state for frontend consumption
     */
    createTool({
      name: "generate_chart",
      description: "Generate a chart with various types including bar, line, area, pie, donut, stacked variants, and more",
      parameters: z.object({
        type: z.enum([
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
        ]).describe("Type of chart to generate"),
        title: z.string().describe("Title for the chart"),
        data: z.array(z.record(z.any())).describe("Array of data points for the chart"),
        xKey: z.string().describe("Key for X-axis data"),
        yKey: z.string().describe("Key for Y-axis data")
      }),
      handler: async ({ type, title, data, xKey, yKey }, { network }) => {
        // Generate chart configuration with appropriate styling
        const chartConfig = {
          [yKey]: {
            label: yKey.charAt(0).toUpperCase() + yKey.slice(1),
            color: "hsl(var(--chart-1))", // Uses CSS custom properties for theming
          },
        };

        // Structure chart data for frontend consumption
        const chartData = {
          type,
          title,
          data,
          xKey,
          yKey,
          config: chartConfig
        };

        // Store chart result in network state for API to retrieve
        network?.state.kv.set("chart_result", chartData);
        // Mark result type as chart for proper handling in the API
        network?.state.kv.set("result_type", "chart");
        
        return `Created ${type} chart titled "${title}" with ${data.length} data points.`;
      },
    }),
    
    /**
     * Generate Pie Chart Tool (Alias)
     *
     * Some model outputs may attempt to directly call a `generate_pie_chart` tool.  This
     * helper simply delegates to the generic `generate_chart` handler with the `pie`
     * type pre-selected so that these calls do not error at runtime.
     */
    createTool({
      name: "generate_pie_chart",
      description: "Alias for generate_chart with type fixed to 'pie' to prevent missing tool errors.",
      parameters: z.object({
        title: z.string().describe("Title for the chart"),
        data: z.array(z.record(z.any())).describe("Array of data points for the chart"),
        xKey: z.string().describe("Key for X-axis data"),
        yKey: z.string().describe("Key for Y-axis data")
      }),
      handler: async ({ title, data, xKey, yKey }, { network }) => {
        // Delegate to the core chart generation logic with the type preset to 'pie'.
        const chartConfig = {
          [yKey]: {
            label: yKey.charAt(0).toUpperCase() + yKey.slice(1),
            color: "hsl(var(--chart-1))",
          },
        };

        const chartData = {
          type: "pie",
          title,
          data,
          xKey,
          yKey,
          config: chartConfig,
        };

        network?.state.kv.set("chart_result", chartData);
        network?.state.kv.set("result_type", "chart");

        return `Created pie chart titled "${title}" with ${data.length} data points.`;
      },
    }),
    
    /**
     * Done Tool
     * 
     * Signals completion of the chart generation task.
     * Updates network state to indicate the agent has finished its work.
     */
    createTool({
      name: "done",
      description: "Call this when the chart is complete and ready",
      parameters: z.object({
        message: z.string().describe("Completion message to user")
      }),
      handler: async ({ message }, { network }) => {
        // Mark the task as completed
        network?.state.kv.set("completed", true);
        // Store completion message for user feedback
        network?.state.kv.set("completion_message", message);
        return message;
      },
    }),
  ],
}); 