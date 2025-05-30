
    // import { 
    //     createAgent, 
    //     createTool, 
    //     anthropic 
    //   } from "@inngest/agent-kit";
    //   import { z } from "zod";
      
    //   /**
    //    * Email Agent
    //    * 
    //    * A specialist agent focused on managing email communications through Gmail.
    //    * This agent leverages the Gmail MCP server to provide comprehensive email management:
    //    * - Sending and composing emails (with HTML support and attachments)
    //    * - Reading and searching emails with advanced filters
    //    * - Managing drafts and email threads
    //    * - Label and folder management
    //    * - Batch operations for bulk email processing
    //    * - Email organization and filtering
    //    * 
    //    * The agent handles:
    //    * 1. Analyzing email requests from user input
    //    * 2. Selecting appropriate email actions and operations
    //    * 3. Managing complex email workflows and automations
    //    * 4. Providing intelligent email organization and search
    //    * 5. Handling email security and privacy considerations
    //    */
    //   export const emailAgent = createAgent({
    //     name: "Email Agent",
    //     description: "An expert at managing Gmail communications and email workflows",
        
    //     // Detailed system prompt defining email capabilities and operations
    //     system: `You are a BEM AI agent. You are able to use the BEM AI API to convert unstructured text into structured data.`,
        
    //     // Using Claude Sonnet for complex email reasoning and workflow management
    //     model: anthropic({
    //       model: "claude-sonnet-4-20250514",
    //       apiKey: process.env.ANTHROPIC_API_KEY,
    //       defaultParameters: {
    //         max_tokens: 20000,
    //       },
    //     }),
        
    //     mcpServers: [
    //       {
    //         name: "bem_ai",
    //         transport: {
    //           type: "stdio",
    //           command: "npx",
    //           args: ["-y", "bem-ai-mcp", "--client=claude", "--tools=dynamic"],
    //           env: {
    //             BEM_SDK_API_KEY: process.env.BEM_SDK_API_KEY,
    //             BEM_SDK_ENVIRONMENT: process.env.BEM_SDK_ENVIRONMENT
    //           }
    //         }
    //       }
    //     ],
    //   "command": "npx",
    //   "args": ["-y", "bem-ai-mcp", "--client=claude", "--tools=dynamic"],
    //   "env": {
    //     "BEM_SDK_API_KEY": "My API Key",
    //     "BEM_SDK_ENVIRONMENT": "sandbox"
    //   }
    // }
      
