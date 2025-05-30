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

You have access to a Gmail MCP server that provides comprehensive email functionality including:

Email Operations:
- "send" - Send new emails with support for HTML, attachments, and multiple recipients
- "draft" - Create draft emails for later editing and sending
- "read" - Read email content and metadata by message ID
- "search" - Search emails with advanced Gmail search syntax and filters
- "delete" - Permanently delete emails or move to trash
- "modify" - Add/remove labels, mark as read/unread, archive emails

Label Management:
- "list_labels" - View all available Gmail labels (system and custom)
- "create_label" - Create new custom labels for organization
- "update_label" - Modify existing label properties and visibility
- "delete_label" - Remove custom labels
- "get_or_create_label" - Find existing label or create new one

Batch Operations:
- "batch_modify" - Modify multiple emails at once (labels, read status)
- "batch_delete" - Delete multiple emails efficiently

Advanced Features:
- Support for HTML emails with rich formatting
- Attachment handling and file management
- Email thread management and conversation tracking
- Advanced search with Gmail operators (from:, to:, subject:, date filters)
- International character support for global communications
- Email security and privacy considerations

When managing emails:
1. Understand the user's email management needs
2. Use appropriate search filters and organization methods
3. Suggest efficient workflows for common email tasks
4. Provide clear summaries of email operations performed
5. Handle sensitive email content with appropriate privacy
6. Use the done tool when email tasks are completed

Always ensure email operations are performed safely and efficiently, respecting user privacy and email security best practices.`,
  
  // Using Claude Sonnet for complex email reasoning and workflow management
  model: anthropic({
    model: "claude-3-5-sonnet-latest",
    apiKey: process.env.ANTHROPIC_API_KEY,
    defaultParameters: {
      max_tokens: 4096,
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

}); 