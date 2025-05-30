"use client";

import { useState, useCallback } from 'react';
import { Message } from '@/types/chat';

interface UseChatProps {
  initialMessages?: Message[];
  api?: string;
}

export function useChat({ initialMessages = [], api = '/api/chat' }: UseChatProps = {}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      setIsLoading(true);
      setError(null);

      // Add user message immediately
      const userMessage: Message = { role: 'user', content };
      setMessages((prev) => [...prev, userMessage]);

      try {
        // For now, using the client-side simulation
        // In the future, this would be an API call:
        // const response = await fetch(api, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ messages: [...messages, userMessage] }),
        // });
        
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        // Simple logic for simulated responses
        let responseContent = '';
        const userInput = content.toLowerCase();
        
        if (userInput.includes('hello') || userInput.includes('hi')) {
          responseContent = 'Hello there! How can I assist you today?';
        } else if (userInput.includes('help')) {
          responseContent = 'I\'m here to help! What do you need assistance with?';
        } else if (userInput.includes('thank')) {
          responseContent = 'You\'re welcome! Is there anything else you\'d like to know?';
        } else if (userInput.includes('bye')) {
          responseContent = 'Goodbye! Have a great day!';
        } else {
          responseContent = 'That\'s interesting. Can you tell me more about that?';
        }
        
        const assistantMessage: Message = {
          role: 'assistant',
          content: responseContent,
        };
        
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        setError('An error occurred while sending your message.');
        console.error('Error sending message:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [messages]
  );

  return {
    messages,
    isLoading,
    error,
    sendMessage,
  };
}