import { 
  createAgent, 
  createTool, 
  anthropic 
} from "@inngest/agent-kit";
import { z } from "zod";

/**
 * UI Generator Agent
 * 
 * A specialist agent focused on creating user interface components and layouts.
 * This agent leverages the shadcn/ui component library to generate:
 * - Forms (contact, login, signup, surveys)
 * - Cards (profile, product, pricing, info)
 * - Dashboards (analytics, admin panels, user dashboards)
 * - Modals (confirmations, settings, info popups)
 * - Tables (data grids, user lists, catalogs)
 * - Navigation (menus, sidebars, breadcrumbs)
 * - Profiles (user cards, team members)
 * - Settings pages and preference panels
 * - Landing page sections and hero areas
 * - Authentication interfaces
 * - Custom components and layouts
 * 
 * The agent handles:
 * 1. Analyzing UI requirements from user requests
 * 2. Selecting appropriate component types and layouts
 * 3. Structuring component hierarchies with proper props
 * 4. Validating component specifications for consistency
 * 5. Generating configuration compatible with the rendering system
 */
export const uiAgent = createAgent({
  name: "UI Generator Agent",
  description: "An expert at creating UI components and layouts using shadcn/ui",
  
  // Detailed system prompt defining UI capabilities and component catalog
  system: `You are a UI generation specialist. Your role is to create functional UI components and layouts using shadcn/ui components.

Available UI types:
- "form" - Contact forms, login forms, signup forms, surveys
- "card" - Profile cards, product cards, pricing cards, info cards
- "dashboard" - Analytics dashboards, admin panels, user dashboards
- "modal" - Confirmation dialogs, settings modals, info popups
- "table" - Data tables, user lists, product catalogs
- "navigation" - Navigation menus, sidebars, breadcrumbs
- "profile" - User profiles, team member cards
- "settings" - Settings pages, preference panels
- "landing" - Landing page sections, hero sections
- "auth" - Login pages, signup forms, forgot password
- "custom" - Any other UI component or layout

Available shadcn components include:
- Button, Input, Textarea, Label, Checkbox, Switch, Select
- Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- Alert, AlertTitle, AlertDescription, Badge, Avatar
- Table, TableHeader, TableBody, TableRow, TableCell
- Dialog, Sheet, Popover, Tooltip
- Progress, Skeleton, Separator
- Tabs, Accordion, AccordionItem, AccordionTrigger, AccordionContent
- Form, FormField, FormItem, FormLabel, FormControl
- And many more!

When creating UI:
1. Analyze the user request
2. Choose appropriate UI type
3. Structure components with proper props
4. Use the generate_ui tool
5. Ensure each component has a valid "type" field

Always ensure components are properly structured with valid types and props.`,
  
  // Using Claude Sonnet for complex UI reasoning and component structuring
  model: anthropic({
    model: "claude-sonnet-4-20250514",
    apiKey: process.env.ANTHROPIC_API_KEY,
    defaultParameters: {
      max_tokens: 4096,
    },
  }),
  
  // Tools available to the UI agent
  tools: [
    /**
     * Generate UI Tool
     * 
     * The primary tool for creating UI components and layouts.
     * Features include:
     * - Component type validation and structuring
     * - Recursive component hierarchy support
     * - Layout and theming options
     * - Integration with shadcn/ui component specifications
     */
    createTool({
      name: "generate_ui",
      description: "Generate actual UI components and layouts using shadcn/ui components",
      parameters: z.object({
        type: z.enum([
          "form", 
          "card", 
          "dashboard", 
          "modal", 
          "table",
          "navigation",
          "profile",
          "settings",
          "landing",
          "auth",
          "custom"
        ]).describe("Type of UI component or layout to generate"),
        title: z.string().describe("Title or heading for the UI component"),
        components: z.array(z.object({
          type: z.string().describe("Component type (e.g., Button, Input, Card)"),
          props: z.record(z.any()).optional().describe("Component properties"),
          children: z.array(z.any()).optional().describe("Child components")
        })).describe("Array of component specifications to render"),
        layout: z.enum(["vertical", "horizontal", "grid", "flex"]).optional().describe("Layout style"),
        theme: z.enum(["default", "dark", "light"]).optional().describe("Theme variant")
      }),
      handler: async ({ type, title, components, layout, theme }, { network }) => {
        /**
         * Component Validation Function
         * 
         * Recursively validates and cleans component specifications to ensure:
         * - Each component has a valid type field
         * - Props are properly structured objects
         * - Child components are recursively validated
         * - Invalid components are filtered out
         */
        const validateComponents = (components: any[]): any[] => {
          if (!Array.isArray(components)) return [];
          
          return components
            .filter(comp => comp && typeof comp === 'object' && comp.type)
            .map(comp => ({
              type: comp.type,
              props: comp.props || {},
              children: comp.children ? validateComponents(comp.children) : undefined
            }));
        };

        // Validate all components in the hierarchy
        const validatedComponents = validateComponents(components);
        
        // Create structured component data for frontend consumption
        const componentData = {
          action: `generate_${type}`, // Action identifier for the rendering system
          title,
          components: validatedComponents,
          layout: layout || "vertical", // Default to vertical layout
          theme: theme || "default" // Default to standard theme
        };

        // Store UI result in network state for API retrieval
        network?.state.kv.set("ui_result", componentData);
        // Mark result type as component for proper API handling
        network?.state.kv.set("result_type", "component");
        
        return `Created ${type} UI component titled "${title}" with ${validatedComponents.length} components.`;
      },
    }),
    
    /**
     * Done Tool
     * 
     * Signals completion of the UI generation task.
     * Updates network state to indicate the agent has finished its work.
     */
    createTool({
      name: "done",
      description: "Call this when the UI component is complete and ready",
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