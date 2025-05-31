import { NextResponse } from 'next/server';
import { Message } from '@/types/chat';
import Anthropic from '@anthropic-ai/sdk';
import { 
  componentRegistry, 
  getComponentNames, 
  getComponentInfo,
  getComponentsByFile,
  getForwardRefComponents,
  componentCount 
} from '@/src/registry/components';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Get API key from environment
const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  console.error('ANTHROPIC_API_KEY is not set in environment variables');
}

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: apiKey || '',
});

// Define tools
const tools = [
  {
    name: "generate_chart",
    description: "Generate a chart with various types including bar, line, area, pie, donut, stacked variants, and more",
    input_schema: {
      type: "object" as const,
      properties: {
        type: {
          type: "string" as const,
          enum: [
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
          ],
          description: "Type of chart to generate - supports various chart types and their variants"
        },
        title: {
          type: "string" as const,
          description: "Title for the chart"
        },
        data: {
          type: "array" as const,
          items: {
            type: "object" as const
          },
          description: "Array of data points for the chart"
        },
        xKey: {
          type: "string" as const,
          description: "Key for X-axis data"
        },
        yKey: {
          type: "string" as const,
          description: "Key for Y-axis data"
        }
      },
      required: ["type", "title", "data", "xKey", "yKey"]
    }
  },
  {
    name: "generate_ui",
    description: "Generate actual UI components and layouts using shadcn/ui components. Can create forms, dashboards, cards, modals, and complete interfaces.",
    input_schema: {
      type: "object" as const,
      properties: {
        type: {
          type: "string" as const,
          enum: [
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
          ],
          description: "Type of UI component or layout to generate"
        },
        title: {
          type: "string" as const,
          description: "Title or heading for the UI component"
        },
        components: {
          type: "array" as const,
          items: {
            type: "object" as const,
            properties: {
              type: { type: "string" as const },
              props: { type: "object" as const },
              children: { type: "array" as const }
            }
          },
          description: "Array of component specifications to render"
        },
        layout: {
          type: "string" as const,
          enum: ["vertical", "horizontal", "grid", "flex"],
          description: "Layout style for arranging components"
        },
        theme: {
          type: "string" as const,
          enum: ["default", "dark", "light"],
          description: "Theme variant for the components"
        }
      },
      required: ["type", "title", "components"]
    }
  }
];

export async function POST(req: Request) {
  try {
    // Check if API key is available
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured. Please set ANTHROPIC_API_KEY in your environment variables.' },
        { status: 500 }
      );
    }

    const { messages }: { messages: Message[] } = await req.json();
    
    // Validate input
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: messages array is required' },
        { status: 400 }
      );
    }
    
    // Get the latest user message
    const latestMessage = messages[messages.length - 1];
    
    if (!latestMessage || latestMessage.role !== 'user') {
      return NextResponse.json(
        { error: 'Invalid message format: latest message must be from user' },
        { status: 400 }
      );
    }
    
    // Convert messages to Anthropic format (exclude tool calls from message history)
    const anthropicMessages = messages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }));
    
    try {
      console.log('Calling Anthropic API with', anthropicMessages.length, 'messages');
      
      // Call Anthropic API with tools
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: anthropicMessages,
        tools: tools,
        system: `You are a helpful assistant that can generate charts and visualizations AND create actual UI components and layouts.

## CHART CAPABILITIES
When a user asks for a chart or visualization, use the generate_chart tool to create it. 

Available chart types and examples:

BAR CHARTS:
- "bar" - Basic vertical bar chart
- "bar-horizontal" - Horizontal bar chart
- "bar-stacked" - Stacked bar chart with multiple data series
- "bar-multiple" - Multiple bar chart with grouped bars

LINE CHARTS:
- "line" - Basic line chart
- "line-multiple" - Multiple line chart with multiple data series
- "line-step" - Step line chart

AREA CHARTS:
- "area" - Basic area chart
- "area-stacked" - Stacked area chart
- "area-step" - Step area chart

PIE CHARTS:
- "pie" - Basic pie chart
- "pie-donut" - Donut chart with center hole
- "pie-donut-text" - Donut chart with center text

ADVANCED CHARTS:
- "radar" - Radar/spider chart
- "radial" - Radial/circular progress chart

## UI GENERATION CAPABILITIES
You can generate actual, functional UI components using shadcn/ui! Use the generate_ui tool when users ask for:
- Forms (contact, login, signup, survey, etc.)
- Cards (profile, product, pricing, etc.)
- Dashboards (analytics, admin, user)
- Modals (confirmation, settings, info)
- Tables (data display, user lists, etc.)
- Navigation (menus, sidebars, breadcrumbs)
- Settings pages
- Landing pages
- Authentication interfaces
- Any custom UI layouts

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

Component specification format:
Each component should have a type (the shadcn component name) and props (properties like variant, size, children, etc.)

IMPORTANT: Every component MUST have a "type" field that specifies the component name. Examples:
- { type: "Button", props: { variant: "default", children: "Click me" } }
- { type: "Input", props: { placeholder: "Enter text", type: "text" } }
- { type: "Card", props: {}, children: [...] }

Available shadcn components include:
- Button, Input, Textarea, Label, Checkbox, Switch, Select
- Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- Alert, AlertTitle, AlertDescription, Badge, Avatar
- Table, TableHeader, TableBody, TableRow, TableCell
- Dialog, Sheet, Popover, Tooltip
- Progress, Skeleton, Separator
- Tabs, Accordion, AccordionItem, AccordionTrigger, AccordionContent
- Form, FormField, FormItem, FormLabel, FormControl
- And 200+ more components!

Examples:
- "Create a contact form" → Use type="form" with Input, Textarea, Button components
- "I need a user profile card" → Use type="card" with Avatar, Badge, Button components  
- "Make a pricing table" → Use type="table" with TableHeader, TableBody, TableRow, TableCell components
- "Create a login modal" → Use type="modal" with Form, Input, Button components
- "Build a dashboard" → Use type="dashboard" with Cards, Charts, Tables, etc.

Always ensure each component has a valid "type" field. Never create components without a type.

Respond naturally and conversationally, then use the appropriate tool when needed.`,
      });
      
      // Handle tool use response
      if (response.content.some(block => block.type === 'tool_use')) {
        const toolUse = response.content.find(block => block.type === 'tool_use') as any;
        
        if (toolUse && toolUse.name === 'generate_chart') {
          const toolInput = toolUse.input;
          
          // Create chart config
          const chartConfig = {
            [toolInput.yKey]: {
              label: toolInput.yKey.charAt(0).toUpperCase() + toolInput.yKey.slice(1),
              color: "hsl(var(--chart-1))",
            },
          };
          
          // Extract text content from response
          const textContent = response.content
            .filter(block => block.type === 'text')
            .map(block => (block as any).text)
            .join('');
          
          const botMessage: Message = {
            role: 'assistant',
            content: textContent || "I've generated a chart for you!",
            toolCall: {
              type: 'chart',
              name: 'generate_chart',
              data: {
                type: toolInput.type,
                title: toolInput.title,
                data: toolInput.data,
                xKey: toolInput.xKey,
                yKey: toolInput.yKey,
                config: chartConfig
              }
            }
          };
          
          return NextResponse.json({ message: botMessage });
        }
        
        if (toolUse && toolUse.name === 'generate_ui') {
          const toolInput = toolUse.input;
          
          // Validate and clean components
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
          
          // Handle different component lookup actions
          let componentData: any = {};
          
          switch (toolInput.type) {
            case 'form':
              componentData = { action: 'generate_form', title: toolInput.title, components: validateComponents(toolInput.components || []) };
              break;
            case 'card':
              componentData = { action: 'generate_card', title: toolInput.title, components: validateComponents(toolInput.components || []) };
              break;
            case 'dashboard':
              componentData = { action: 'generate_dashboard', title: toolInput.title, components: validateComponents(toolInput.components || []) };
              break;
            case 'modal':
              componentData = { action: 'generate_modal', title: toolInput.title, components: validateComponents(toolInput.components || []) };
              break;
            case 'table':
              componentData = { action: 'generate_table', title: toolInput.title, components: validateComponents(toolInput.components || []) };
              break;
            case 'navigation':
              componentData = { action: 'generate_navigation', title: toolInput.title, components: validateComponents(toolInput.components || []) };
              break;
            case 'profile':
              componentData = { action: 'generate_profile', title: toolInput.title, components: validateComponents(toolInput.components || []) };
              break;
            case 'settings':
              componentData = { action: 'generate_settings', title: toolInput.title, components: validateComponents(toolInput.components || []) };
              break;
            case 'landing':
              componentData = { action: 'generate_landing', title: toolInput.title, components: validateComponents(toolInput.components || []) };
              break;
            case 'auth':
              componentData = { action: 'generate_auth', title: toolInput.title, components: validateComponents(toolInput.components || []) };
              break;
            case 'custom':
              componentData = { action: 'generate_custom', title: toolInput.title, components: validateComponents(toolInput.components || []) };
              break;
          }
          
          // Extract text content from response
          const textContent = response.content
            .filter(block => block.type === 'text')
            .map(block => (block as any).text)
            .join('');
          
          const botMessage: Message = {
            role: 'assistant',
            content: textContent || "I've generated a UI component for you!",
            toolCall: {
              type: 'component',
              name: 'generate_ui',
              data: componentData
            }
          };
          
          return NextResponse.json({ message: botMessage });
        }
      }
      
      // Regular text response (no tool use)
      const responseContent = response.content
        .filter(block => block.type === 'text')
        .map(block => (block as any).text)
        .join('');
      
      const botMessage: Message = {
        role: 'assistant',
        content: responseContent || "I'm sorry, I couldn't generate a response."
      };
      
      return NextResponse.json({ message: botMessage });
      
    } catch (apiError: any) {
      console.error('Anthropic API error:', apiError);
      
      // Handle specific API errors
      if (apiError.status === 401) {
        return NextResponse.json(
          { error: 'Invalid API key. Please check your ANTHROPIC_API_KEY.' },
          { status: 401 }
        );
      }
      
      if (apiError.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to generate response: ' + (apiError.message || 'Unknown error') },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}