import { createAgent, createTool, anthropic } from "@inngest/agent-kit";
import { z } from "zod";

/**
 * UI Generation Agent
 * Decides whether to generate UI components and what type
 * Works with data from the Data Agent when needed
 */
export const uiGenAgent = createAgent({
  name: "UI Generation Agent",
  description: "Generates UI components and charts based on user requests",
  
  system: `You are a UI generation specialist that creates charts and components.

Your job is to:
1. Analyze if the user's request needs a UI component
2. If no UI is needed (like "hi" or general chat), respond with text only
3. If UI is needed, determine the best type (chart or component)
4. For charts, use data from the Data Agent to create visualizations
5. For components, generate appropriate UI configurations

Chart types available:
- bar, bar-horizontal, bar-stacked, bar-multiple
- line, line-multiple, line-step
- area, area-stacked, area-step
- pie, pie-donut, pie-donut-text
- radar, radial

Component types available:
- form, card, table, alert, dialog
- dashboard layouts, settings pages
- Any shadcn/ui component

Always check if data is available from the Data Agent before generating charts.`,
  
  model: anthropic({
    model: "claude-sonnet-4-20250514",
    apiKey: process.env.ANTHROPIC_API_KEY,
    defaultParameters: {
      max_tokens: 4096,
    },
  }),
  
  tools: [
    createTool({
      name: "generate_chart",
      description: "Generate a chart visualization",
      parameters: z.object({
        type: z.enum([
          "bar", "bar-horizontal", "bar-stacked", "bar-multiple",
          "line", "line-multiple", "line-step",
          "area", "area-stacked", "area-step",
          "pie", "pie-donut", "pie-donut-text",
          "radar", "radial"
        ]).describe("Type of chart"),
        title: z.string().describe("Chart title"),
        config: z.record(z.object({
          label: z.string(),
          color: z.string(),
        })).describe("Chart configuration for data keys"),
      }),
      handler: async ({ type, title, config }, { network }) => {
        // Get data from the Data Agent
        const dataResult = network?.state.kv.get("data_result");
        
        if (!dataResult || !dataResult.data) {
          return "No data available for chart generation";
        }
        
        const chartData = {
          type,
          title,
          data: dataResult.data,
          xKey: dataResult.metadata?.keys?.x || Object.keys(dataResult.data[0])[0],
          yKey: dataResult.metadata?.keys?.y || Object.keys(dataResult.data[0])[1],
          config,
        };
        
        network?.state.kv.set("ui_result", {
          type: "chart",
          data: chartData,
        });
        network?.state.kv.set("requires_ui", true);
        
        return `Generated ${type} chart: "${title}"`;
      },
    }),
    
    createTool({
      name: "generate_component",
      description: "Generate a UI component",
      parameters: z.object({
        componentType: z.string().describe("Type of component (form, card, table, etc.)"),
        title: z.string().describe("Component title or heading"),
        config: z.record(z.any()).describe("Component configuration"),
      }),
      handler: async ({ componentType, title, config }, { network }) => {
        const componentData = {
          componentType,
          title,
          config,
        };
        
        network?.state.kv.set("ui_result", {
          type: "component",
          data: componentData,
        });
        network?.state.kv.set("requires_ui", true);
        
        return `Generated ${componentType} component: "${title}"`;
      },
    }),
    
    createTool({
      name: "respond_with_text",
      description: "Respond with text only, no UI generation needed",
      parameters: z.object({
        message: z.string().describe("The text response"),
      }),
      handler: async ({ message }, { network }) => {
        network?.state.kv.set("final_message", message);
        network?.state.kv.set("requires_ui", false);
        return message;
      },
    }),
  ],
}); 