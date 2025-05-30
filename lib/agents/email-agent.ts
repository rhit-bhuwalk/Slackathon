import { 
  createAgent, 
  createTool, 
  anthropic 
} from "@inngest/agent-kit";
import { z } from "zod";

/**
 * Email Agent
 * 
 * A specialist agent focused on managing email communications through Gmail.
 * This agent leverages the Gmail MCP server to provide comprehensive email management:
 * - Sending and composing emails (with HTML support and attachments)
 * - Reading and searching emails with advanced filters
 * - Managing drafts and email threads
 * - Label and folder management
 * - Batch operations for bulk email processing
 * - Email organization and filtering
 * 
 * The agent handles:
 * 1. Analyzing email requests from user input
 * 2. Selecting appropriate email actions and operations
 * 3. Managing complex email workflows and automations
 * 4. Providing intelligent email organization and search
 * 5. Handling email security and privacy considerations
 */
export const emailAgent = createAgent({
  name: "Email Agent",
  description: "An expert at managing Gmail communications and email workflows",
  
  // Detailed system prompt defining email capabilities and operations
  system: `You are an email management specialist. Your role is to help users manage their Gmail communications effectively and efficiently.

You have access to a Gmail MCP server that provides comprehensive email functionality. The available tools are:

Email Operations:
- "search_emails" - Search emails with Gmail search syntax and filters
- "read_email" - Read email content and metadata by message ID
- "send_email" - Send new emails with HTML support, attachments, and multiple recipients
- "draft_email" - Create draft emails for later editing and sending
- "delete_email" - Permanently delete emails or move to trash
- "modify_email" - Add/remove labels, mark as read/unread, archive emails

Label Management:
- "list_email_labels" - View all available Gmail labels (system and custom)
- "create_label" - Create new custom labels for organization
- "update_label" - Modify existing label properties and visibility
- "delete_label" - Remove custom labels
- "get_or_create_label" - Find existing label or create new one

Batch Operations:
- "batch_modify_emails" - Modify multiple emails at once (labels, read status)
- "batch_delete_emails" - Delete multiple emails efficiently

To read recent emails:
1. Use search_emails with queries like "in:inbox" to find recent emails
2. Use read_email with the message IDs to get email content
3. Provide clear summaries of email content

When managing emails:
1. Understand the user's email management needs
2. Use appropriate search filters and organization methods
3. Suggest efficient workflows for common email tasks
4. Provide clear summaries of email operations performed
5. Handle sensitive email content with appropriate privacy
6. Always call the done tool when email tasks are completed

For reading recent emails, start by searching for emails in the inbox, then read the specific messages the user requested.

IMPORTANT: Always use the done tool when you have completed the user's request to signal that the task is finished.`,
  
  // Using Claude Sonnet for complex email reasoning and workflow management
  model: anthropic({
    model: "claude-sonnet-4-20250514",
    apiKey: process.env.ANTHROPIC_API_KEY,
    defaultParameters: {
      max_tokens: 20000,
    },
  }),

  // MCP server configuration for Gmail integration
  mcpServers: [
    {
      name: "gmail",
      transport: {
        type: "streamable-http",
        url: "https://server.smithery.ai/@gongrzhe/server-gmail-autoauth-mcp"
      }
    }
  ],

  // Tools for email management and task completion
  tools: [
    createTool({
      name: "done",
      description: "Call this when the email task is completed successfully",
      parameters: z.object({
        summary: z.string().describe("Summary of what was accomplished with the emails"),
        emailsProcessed: z.number().optional().describe("Number of emails that were processed"),
        details: z.string().optional().describe("Additional details about the email operation")
      }),
      handler: async ({ summary, emailsProcessed, details }) => {
        return {
          success: true,
          message: summary,
          emailsProcessed,
          details
        };
      },
    }),
  ],

}); 