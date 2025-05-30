"use client";

import { useState, useRef, useEffect } from 'react';
import { ArrowUp, Bot } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isWaitingForResponse: boolean;
}

export default function ChatInput({ onSendMessage, isWaitingForResponse }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSendMessage = () => {
    if (message.trim() && !isWaitingForResponse) {
      onSendMessage(message);
      setMessage('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 pb-6 pt-4 bg-black">
      <div className="w-[70%] mx-auto">
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-3">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="w-full bg-transparent border-none outline-none resize-none text-white placeholder:text-gray-400 py-1 px-2 max-h-[120px] min-h-[28px]"
            rows={1}
            disabled={isWaitingForResponse}
          />
          
          <div className="flex justify-between items-center mt-2 px-2">
            <div className="text-white">
              <Bot size={20} />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!message.trim() || isWaitingForResponse}
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                message.trim() && !isWaitingForResponse 
                  ? 'bg-white hover:bg-gray-200 transition-colors' 
                  : 'bg-gray-600 cursor-not-allowed'
              }`}
            >
              <ArrowUp 
                size={18} 
                className={message.trim() && !isWaitingForResponse ? 'text-black' : 'text-gray-400'} 
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}