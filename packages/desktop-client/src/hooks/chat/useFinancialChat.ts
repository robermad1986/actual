import { useState, useCallback } from 'react';
import { useSelector } from '../../redux';

export function useFinancialChat() {
  const [messages, setMessages] = useState<Array<{
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: string;
  }>>([]);

  const [isLoading, setIsLoading] = useState(false);

  // Use unknown type and proper casting to avoid TypeScript issues
  const budget = useSelector((state: unknown) => (state as Record<string, unknown>).budgets?.current);
  const accounts = useSelector((state: unknown) => (state as Record<string, unknown>).accounts?.accounts || []);
  const categories = useSelector((state: unknown) => (state as Record<string, unknown>).categories?.categories || []);

  const sendMessage = useCallback(async (message: string) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context: {
            budget,
            accounts,
            categories,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      const userMessage = {
        id: Date.now().toString(),
        content: message,
        role: 'user' as const,
        timestamp: new Date().toISOString(),
      };

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        content: data.content || 'I received your message',
        role: 'assistant' as const,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, userMessage, assistantMessage]);

      return data;
    } catch (error) {
      console.error('Error sending message:', error);

      const errorMessage = {
        id: (Date.now() + 2).toString(),
        content: 'Sorry, I encountered an error processing your message.',
        role: 'assistant' as const,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: message,
        role: 'user' as const,
        timestamp: new Date().toISOString(),
      }, errorMessage]);

      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [budget, accounts, categories]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
  };
}
