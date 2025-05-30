import { 
  createAgent, 
  createTool, 
  anthropic 
} from "@inngest/agent-kit";
import { z } from "zod";
import { bemCreatePipeline, bemTransform } from "../bem";

/**
 * BEM Data Cleaner Agent
 * 
 * This agent specializes in transforming raw data into structured formats
 * using BEM.ai's pipeline system. It works in tandem with the Chart Picker
 * Agent to ensure data is properly formatted for visualization.
 * 
 * Workflow:
 * 1. Receives chart schema from Chart Picker Agent
 * 2. Creates a BEM pipeline with the appropriate data structure
 * 3. Transforms raw data through the pipeline
 * 4. Outputs clean, structured data ready for chart generation
 */
export const bemDataCleanerAgent = createAgent({
  name: "BEM Data Cleaner Agent",
  description: "Transforms raw data into structured formats for visualization using BEM pipelines",
  
  system: `You are a data transformation specialist using BEM.ai pipelines.

Your responsibilities:
1. Take chart schemas from the Chart Picker Agent
2. Create BEM pipelines that match the required data structure
3. Transform raw data to fit the chart requirements
4. Ensure data is clean and properly formatted

When you are invoked:
1. Check for picked_chart in network state (contains the chart schema)
2. Check for data_result in network state (contains raw data)
3. Create a BEM pipeline based on the chart schema using create_bem_pipeline_from_state
4. Transform the raw data using transform_data_from_state
5. Prepare the final chart data using prepare_chart_data_from_state
6. Call done when complete

The pipeline will automatically use data from the network state.`,
  
  model: anthropic({
    model: "claude-sonnet-4-20250514",
    apiKey: process.env.ANTHROPIC_API_KEY,
    defaultParameters: {
      max_tokens: 2048,
    },
  }),
  
  tools: [
    /**
     * Create BEM Pipeline from State Tool
     * 
     * Automatically creates a pipeline using chart schema from network state
     */
    createTool({
      name: "create_bem_pipeline_from_state",
      description: "Create a BEM pipeline using the chart schema from network state",
      parameters: z.object({
        confirmCreation: z.boolean().describe("Confirm you want to create the pipeline")
      }),
      
      handler: async ({ confirmCreation }, { network }) => {
        if (!confirmCreation) return "Please confirm pipeline creation.";
        
        const pickedChart = network?.state.kv.get("picked_chart");
        if (!pickedChart) {
          return "No chart schema found. Chart Picker Agent must run first.";
        }
        
        // Create JSON Schema based on chart requirements
        const dataSchema = {
          type: "array",
          items: {
            type: "object",
            properties: {
              [pickedChart.schema.xKey]: { type: "string" },
              [pickedChart.schema.yKey]: { type: "number" },
              ...pickedChart.dataRequirements.optionalFields?.reduce((acc: any, field: string) => {
                acc[field] = { type: "string" };
                return acc;
              }, {})
            },
            required: pickedChart.dataRequirements.requiredFields
          }
        };
        
        try {
          const result = await bemCreatePipeline.execute({
            name: `${pickedChart.chartType} - ${pickedChart.schema.title}`,
            outputSchema: dataSchema
          });
          
          network?.state.kv.set("bem_pipeline_id", result.pipelineID);
          network?.state.kv.set("bem_pipeline_info", {
            id: result.pipelineID,
            name: `${pickedChart.chartType} - ${pickedChart.schema.title}`,
            chartType: pickedChart.chartType,
            schema: dataSchema,
            inboxEmail: result.inboxEmail
          });
          
          return `Created BEM pipeline for ${pickedChart.chartType} chart with ID: ${result.pipelineID}`;
        } catch (error) {
          return `Failed to create pipeline: ${error}`;
        }
      },
    }),
    
    /**
     * Transform Data from State Tool
     * 
     * Automatically transforms data from network state through BEM
     */
    createTool({
      name: "transform_data_from_state",
      description: "Transform raw data from network state through BEM pipeline",
      parameters: z.object({
        confirmTransform: z.boolean().describe("Confirm you want to transform the data")
      }),
      
      handler: async ({ confirmTransform }, { network }) => {
        if (!confirmTransform) return "Please confirm data transformation.";
        
        const pipelineId = network?.state.kv.get("bem_pipeline_id");
        const dataResult = network?.state.kv.get("data_result");
        
        if (!pipelineId) {
          return "No BEM pipeline found. Please create a pipeline first.";
        }
        
        if (!dataResult || !dataResult.data) {
          return "No raw data found. Data Agent must provide data first.";
        }
        
        try {
          // Convert data to JSON string for BEM
          const rawDataString = JSON.stringify(dataResult.data);
          
          const result = await bemTransform.execute({
            pipelineID: pipelineId,
            referenceID: `transform-${Date.now()}`,
            inputType: "text",
            inputContent: rawDataString
          });
          
          const transformedData = result.outputJson || result;
          network?.state.kv.set("cleaned_data", transformedData);
          network?.state.kv.set("data_cleaned", true);
          
          return `Data transformed successfully. ${Array.isArray(transformedData) ? transformedData.length : 1} records processed.`;
        } catch (error) {
          return `Failed to transform data: ${error}`;
        }
      },
    }),
    
    /**
     * Prepare Chart Data from State Tool
     * 
     * Automatically prepares chart data using schema and cleaned data from state
     */
    createTool({
      name: "prepare_chart_data_from_state",
      description: "Prepare final chart data using schema and cleaned data from network state",
      parameters: z.object({
        confirmPreparation: z.boolean().describe("Confirm you want to prepare the chart data")
      }),
      
      handler: async ({ confirmPreparation }, { network }) => {
        if (!confirmPreparation) return "Please confirm chart data preparation.";
        
        const pickedChart = network?.state.kv.get("picked_chart");
        const cleanedData = network?.state.kv.get("cleaned_data");
        
        if (!pickedChart) {
          return "No chart schema found.";
        }
        
        if (!cleanedData) {
          return "No cleaned data available. Please transform data first.";
        }
        
        // Prepare the final chart data
        const chartData = {
          ...pickedChart.schema,
          data: Array.isArray(cleanedData) ? cleanedData : [cleanedData],
          variant: pickedChart.schema.type
        };
        
        // Store for Chart Agent
        network?.state.kv.set("prepared_chart_data", chartData);
        network?.state.kv.set("data_ready_for_chart", true);
        
        return `Chart data prepared with ${chartData.data.length} data points. Ready for visualization as ${pickedChart.chartType} chart.`;
      },
    }),
    
    /**
     * Done Tool
     * 
     * Signals completion of data cleaning process
     */
    createTool({
      name: "done",
      description: "Call this when data cleaning is complete",
      parameters: z.object({
        summary: z.string().describe("Summary of the data cleaning process")
      }),
      handler: async ({ summary }, { network }) => {
        network?.state.kv.set("completed", true);
        network?.state.kv.set("completion_message", summary);
        return summary;
      },
    }),
  ],
}); 