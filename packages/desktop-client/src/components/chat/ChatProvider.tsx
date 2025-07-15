import type React from 'react';
import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { useSelector } from '../../redux';
import { useCategories } from '../../hooks/useCategories';
import { useAccounts } from '../../hooks/useAccounts';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  actions?: FinancialAction[];
}

interface FinancialAction {
  type: string;
  title: string;
  description: string;
  parameters: Record<string, unknown>;
}

interface ChatContextValue {
  messages: ChatMessage[];
  isLoading: boolean;
  sendMessage: (message: string) => Promise<void>;
  executeAction: (action: FinancialAction) => Promise<void>;
  clearChat: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Usar hooks EXISTENTES del proyecto
  const categories = useCategories();
  const accounts = useAccounts();
  const transactions = useSelector((state: unknown) => {
    const typedState = state as Record<string, unknown>;
    return typedState.queries && typeof typedState.queries === 'object'
      ? (typedState.queries as Record<string, unknown>).transactions
      : null;
  });

  const sendMessage = useCallback(async (message: string) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          context: {
            categories,
            accounts,
            transactions
          }
        })
      });

      const data = await response.json();

      setMessages(prev => [...prev,
      { id: Date.now().toString(), content: message, role: 'user', timestamp: new Date() },
      { id: (Date.now() + 1).toString(), content: data.content, role: 'assistant', timestamp: new Date(), actions: data.actions }
      ]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [categories, accounts, transactions]);

  const executeAction = async (action: FinancialAction) => {
    // Implementar usando acciones existentes del proyecto
    console.log('Executing action:', action);
  };

  const clearChat = () => setMessages([]);

  const value = useMemo(() => ({
    messages,
    isLoading,
    sendMessage,
    executeAction,
    clearChat
  }), [messages, isLoading, sendMessage]);

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within ChatProvider');
  return context;
};
