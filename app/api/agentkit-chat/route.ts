import { NextResponse } from 'next/server';
import { Message } from '@/types/chat';
import { assistantNetwork } from '@/lib/network';

// Force dynamic rendering for this route to ensure fresh responses
export const dynamic = 'force-dynamic';

/**
 * AgentKit Chat API Route
 * 
 * This API endpoint serves as the bridge between the frontend chat interface
 * and the AgentKit multi-agent system. It processes user messages through
 * the agent network and returns structured responses that can include:
 * - Text responses from agents
 * - Chart generation data
 * - UI component specifications
 * - Email composition and sending
 * 
 * Flow:
 * 1. Validates incoming message array
 * 2. Extracts the latest user message
 * 3. Runs the message through the AgentKit network
 * 4. Processes the network response
 * 5. Formats the response with appropriate tool call data
 * 6. Returns structured response for frontend consumption
 */
export async function POST(req: Request) {
  try {
    // Parse the incoming request body containing chat messages
    const { messages }: { messages: Message[] } = await req.json();
    
    // === Input Validation ===
    // Ensure messages array is present and valid
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: messages array is required' },
        { status: 400 }
      );
    }
    
    // Extract the most recent message from the conversation
    const latestMessage = messages[messages.length - 1];
    
    // Validate that the latest message is from the user
    if (!latestMessage || latestMessage.role !== 'user') {
      return NextResponse.json(
        { error: 'Invalid message format: latest message must be from user' },
        { status: 400 }
      );
    }

    try {
      console.log('Running AgentKit network with message:', latestMessage.content);
      
      // === Agent Network Execution ===
      // Run the user's message through the multi-agent system
      // This will trigger the routing agent to analyze the request and
      // direct it to the appropriate specialist (chart, UI, or email agent)
      const result = await assistantNetwork.run(latestMessage.content);
      
      console.log('AgentKit result:', result);
      
      // === Response Processing ===
      // For now, we'll provide a simple response while the email agent handles the actual work
      // TODO: Enhance this once we understand the email agent's response structure better
      const response = "I've processed your email request! The email agent has handled your request.";
      
      // Create the base assistant response
      let botMessage: Message = {
        role: 'assistant',
        content: response
      };

      // === Tool Call Data Attachment ===
      // For now, email operations will be handled through the agent's natural response
      // In the future, you can add specific email tool call data here if needed
      
      // Example structure for future email tool calls:
      // if (result.emailAction) {
      //   botMessage.toolCall = {
      //     type: 'email',
      //     name: 'email_operation',
      //     data: result.emailAction
      //   };
      // }
      
      // Return the structured response to the frontend
      return NextResponse.json({ message: botMessage });
      
    } catch (agentError: any) {
      // === AgentKit Error Handling ===
      // Handle errors specific to the agent network execution
      console.error('AgentKit error:', agentError);
      
      return NextResponse.json(
        { error: 'Failed to process request with AgentKit: ' + (agentError.message || 'Unknown error') },
        { status: 500 }
      );
    }
    
  } catch (error) {
    // === General Error Handling ===
    // Handle any other errors (parsing, validation, etc.)
    console.error('Error in agentkit-chat API:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
} 