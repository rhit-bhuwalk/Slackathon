"use client";

import { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import { Message } from '@/types/chat';

interface ChatContainerProps {
  messages: Message[];
}

export default function ChatContainer({ messages }: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="w-full h-[calc(100vh-120px)] overflow-y-auto chat-container px-4 py-6">
      <div className="w-full max-w-[70%] mx-auto">
        {messages.map((message, index) => (
          <ChatMessage 
            key={index} 
            message={message} 
            isLastMessage={index === messages.length - 1} 
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}