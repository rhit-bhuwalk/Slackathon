"use client";

import { Message, ChartData, ComponentData } from '@/types/chat';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import ChartRenderer from './ChartRenderer';
import UIRenderer from './UIRenderer';

interface ChatMessageProps {
  message: Message;
  isLastMessage: boolean;
}

export default function ChatMessage({ message, isLastMessage }: ChatMessageProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const isUser = message.role === 'user';
  
  return (
    <div 
      className={cn(
        "mb-4 transition-opacity",
        isVisible ? "opacity-100" : "opacity-0",
        isUser ? "flex justify-end" : "flex justify-start",
        "message-appear"
      )}
    >
      <div 
        className={cn(
          "max-w-[85%] px-4 py-3",
          isUser 
            ? "bg-zinc-950 border border-zinc-900 rounded-3xl text-right" 
            : "rounded-3xl text-left"
        )}
      >
        <p className="text-white">{message.content}</p>
        
        {/* Render chart if tool call is present */}
        {message.toolCall && message.toolCall.type === 'chart' && (
          <div className="mt-4">
            <ChartRenderer chartData={message.toolCall.data as ChartData} />
          </div>
        )}
        
        {/* Render UI component */}
        {message.toolCall && message.toolCall.type === 'component' && (
          <div className="mt-4">
            <UIRenderer componentData={message.toolCall.data as ComponentData} />
          </div>
        )}
      </div>
    </div>
  );
}