"use client";

import { useState, useCallback } from 'react';
import ChatContainer from './ChatContainer';
import ChatInput from './ChatInput';
import { Message } from '@/types/chat';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const INITIAL_MESSAGES: Message[] = [
  { 
    role: 'assistant', 
    content: 'Hello! How can I help you today? I can generate charts and UI components for you.'
  }
];

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [useAgentKit, setUseAgentKit] = useState(true);

  const getBotResponse = useCallback(async (allMessages: Message[]) => {
    setIsWaitingForResponse(true);
    
    try {
      // Choose API endpoint based on toggle
      const apiEndpoint = useAgentKit ? '/api/agentkit-chat' : '/api/chat';
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: allMessages }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();
      setMessages(prev => [...prev, data.message]);
    } catch (error) {
      console.error('Error getting bot response:', error);
      // Add error message to chat
      const errorMessage: Message = {
        role: 'assistant',
        content: `Sorry, I encountered an error with the ${useAgentKit ? 'AgentKit' : 'traditional'} API. Please try again.`
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsWaitingForResponse(false);
    }
  }, [useAgentKit]);

  const handleSendMessage = useCallback(async (message: string) => {
    const userMessage: Message = {
      role: 'user',
      content: message
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    
    // Call the API
    await getBotResponse(updatedMessages);
  }, [messages, getBotResponse]);

  const handleToggleChange = useCallback((checked: boolean) => {
    setUseAgentKit(checked);
    
    // Add a system message about the switch
    const switchMessage: Message = {
      role: 'assistant',
      content: `Switched to ${checked ? 'AgentKit' : 'traditional'} architecture. ${checked ? 'Now using multi-agent network with specialized routing!' : 'Now using direct API calls.'}`
    };
    setMessages(prev => [...prev, switchMessage]);
  }, []);

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header with toggle */}
      <div className="border-b border-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-white">ShadCN Assistant</h1>
          <Badge variant={useAgentKit ? "default" : "secondary"}>
            {useAgentKit ? "AgentKit" : "Traditional"}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <Label htmlFor="agentkit-mode" className="text-sm text-gray-300">
            Traditional API
          </Label>
          <Switch
            id="agentkit-mode"
            checked={useAgentKit}
            onCheckedChange={handleToggleChange}
          />
          <Label htmlFor="agentkit-mode" className="text-sm text-gray-300">
            AgentKit Network
          </Label>
        </div>
      </div>

      <ChatContainer messages={messages} />
      <ChatInput 
        onSendMessage={handleSendMessage}
        isWaitingForResponse={isWaitingForResponse}
      />
    </div>
  );
}