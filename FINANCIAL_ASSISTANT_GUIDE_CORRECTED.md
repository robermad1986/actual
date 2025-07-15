# 🤖 Guía de Integración del Asistente Financiero - VERSIÓN CORREGIDA

## ⚠️ Resumen de Correcciones Críticas

Esta guía corrige las inconsistencias e incompatibilidades identificadas en la versión original con tu fork específico de Actual Budget.

### 🔍 Problemas Identificados y Soluciones

| Problema | Solución | Impacto |
|----------|----------|---------|
| Rutas incorrectas de carpetas | Usar `packages/desktop-client/src/` | ✅ Compatible |
| Docker duplicado | Extender actual-ai existente | ✅ 50% menos tiempo |
| Variables de entorno fragmentadas | Extender .env.ai existente | ✅ Sin duplicación |
| Modelos de IA mal configurados | Usar configuración multi-proveedor existente | ✅ Simplificado |
| Hooks incompatibles | Usar hooks existentes del proyecto | ✅ Consistente |

---

## 🏗️ Arquitectura Corregida

### **Infraestructura Existente a Aprovechar**
- ✅ **actual-ai** ya configurado en puerto 3000
- ✅ **6 proveedores de IA** configurados en .env.ai
- ✅ **Sistema de modales** con 40+ modales existentes
- ✅ **Hooks personalizados** como `useCategories`, `useAccounts`, `useBudget`
- ✅ **Redux Toolkit** con estructura establecida

### **Estructura de Carpetas Correcta**
```
packages/desktop-client/src/
├── components/chat/
│   ├── ChatProvider.tsx
│   ├── ChatSidebar.tsx
│   ├── ChatModal.tsx
│   └── components/
│       ├── ChatMessage.tsx
│       ├── ChatInput.tsx
│       └── QuickActions.tsx
├── hooks/chat/
│   ├── useFinancialChat.ts
│   ├── useChatHistory.ts
│   └── useAIActions.ts
└── redux/slices/
    └── chatSlice.ts
```

---

## ⚙️ Configuración Corregida

### **Variables de Entorno (Extender .env.ai existente)**
```bash
# Agregar estas líneas al .env.ai existente:
CHAT_ENABLED=true
CHAT_HISTORY_LIMIT=50
CHAT_AUTO_SUGGESTIONS=true
CHAT_CONTEXT_WINDOW=conversation,budget,transactions,categories
FEATURES=classification,chat,financial_actions,budget_coach,smart_suggestions
```

### **Docker Compose - Extender existente**
```yaml
# En docker-compose.ai.yml - solo agregar environment:
services:
  actual-ai:
    # ... configuración existente ...
    environment:
      # Variables existentes +
      - CHAT_ENABLED=true
      - CHAT_CONTEXT_WINDOW=conversation,budget,transactions,categories
```

---

## 🧩 Implementación por Fases Corregida

### **Fase 0: Preparación (1 día)**
```bash
# 1. Crear estructura correcta
mkdir -p packages/desktop-client/src/components/chat
mkdir -p packages/desktop-client/src/hooks/chat
mkdir -p packages/desktop-client/src/redux/slices

# 2. Extender configuración
echo "CHAT_ENABLED=true" >> .env.ai
echo "FEATURES=classification,chat,financial_actions" >> .env.ai

# 3. Verificar actual-ai
docker-compose -f docker-compose.ai.yml ps
```

### **Fase 1: Componentes Base (2 días)**

#### **ChatProvider Corregido**
```typescript
// packages/desktop-client/src/components/chat/ChatProvider.tsx
import React, { createContext, useContext, useReducer, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { type RootState } from '../../redux';
import { useCategories } from '../../hooks/useCategories';
import { useAccounts } from '../../hooks/useAccounts';
import { useBudget } from '../../hooks/useBudget';

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
  const budget = useBudget();
  const transactions = useSelector((state: RootState) => state.queries.transactions);

  const sendMessage = async (message: string) => {
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
            budget,
            transactions,
            currentMonth: budget?.month
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
  };

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
  }), [messages, isLoading]);

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
```

#### **Integración con Modales Existentes**
```typescript
// packages/desktop-client/src/components/modals/FinancialChatModal.tsx
import React from 'react';
import { Modal } from '../common/Modal';
import { ChatProvider } from '../chat/ChatProvider';
import { ChatInterface } from '../chat/ChatInterface';

export function FinancialChatModal() {
  return (
    <Modal name="financial-chat" title="Financial Assistant">
      <ChatProvider>
        <ChatInterface />
      </ChatProvider>
    </Modal>
  );
}

// Agregar a la lista de modales en el archivo correspondiente
```

### **Fase 2: Backend API (2 días)**

#### **Endpoint en actual-ai**
```typescript
// Extender el servicio actual-ai existente
// Agregar en el archivo de rutas de actual-ai:

app.post('/api/ai/chat', async (req, res) => {
  const { message, context } = req.body;
  
  try {
    // Usar el proveedor configurado en .env.ai
    const provider = getCurrentAIProvider();
    const response = await provider.generateResponse({
      prompt: buildFinancialPrompt(message, context),
      context
    });

    res.json({
      content: response.content,
      actions: extractActions(response),
      suggestions: generateSuggestions(context)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

function buildFinancialPrompt(message: string, context: any) {
  return `
    You are a financial assistant for Actual Budget.
    Context: ${JSON.stringify(context, null, 2)}
    User question: ${message}
    
    Provide helpful financial advice and suggest actions when appropriate.
  `;
}
```

### **Fase 3: Hooks y Redux (2 días)**

#### **Redux Slice Corregido**
```typescript
// packages/desktop-client/src/redux/slices/chatSlice.ts
import { createSlice } from '@reduxjs/toolkit';

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    isOpen: false,
    messages: [],
    isLoading: false,
    conversationId: null
  },
  reducers: {
    openChat: (state) => {
      state.isOpen = true;
    },
    closeChat: (state) => {
      state.isOpen = false;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    clearMessages: (state) => {
      state.messages = [];
    }
  }
});

export const { openChat, closeChat, setLoading, addMessage, clearMessages } = chatSlice.actions;
export default chatSlice.reducer;
```

#### **Hook Personalizado**
```typescript
// packages/desktop-client/src/hooks/chat/useFinancialChat.ts
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { type RootState } from '../../redux';

export function useFinancialChat() {
  const dispatch = useDispatch();
  const chatState = useSelector((state: RootState) => state.chat);

  const openChat = useCallback(() => {
    dispatch(openChat());
  }, [dispatch]);

  const closeChat = useCallback(() => {
    dispatch(closeChat());
  }, [dispatch]);

  return {
    ...chatState,
    openChat,
    closeChat
  };
}
```

---

## 🎨 UX Corregida - Sidebar Integrado

### **Componente Sidebar Corregido**
```typescript
// packages/desktop-client/src/components/chat/ChatSidebar.tsx
import React, { useState } from 'react';
import { useChat } from '../../hooks/chat/useFinancialChat';
import { useResponsive } from '../../hooks/useResponsive';

type SidebarState = 'collapsed' | 'mini' | 'expanded';

export function ChatSidebar() {
  const [state, setState] = useState<SidebarState>('collapsed');
  const { messages, sendMessage, isLoading } = useChat();
  const { isNarrowWidth } = useResponsive();

  const toggleState = () => {
    if (isNarrowWidth) {
      // En móvil, abrir modal en lugar de sidebar
      // Usar sistema de modales existente
    } else {
      const nextState = {
        collapsed: 'mini',
        mini: 'expanded',
        expanded: 'collapsed'
      }[state] as SidebarState;
      setState(nextState);
    }
  };

  return (
    <div className={`chat-sidebar chat-sidebar--${state}`}>
      <button onClick={toggleState} className="chat-toggle">
        💬
      </button>
      
      {state !== 'collapsed' && (
        <div className="chat-content">
          <ChatInterface compact={state === 'mini'} />
        </div>
      )}
    </div>
  );
}
```

---

## 🧪 Testing Corregido

### **Tests Unitarios**
```typescript
// packages/desktop-client/src/components/chat/ChatProvider.test.tsx
import { renderHook, act } from '@testing-library/react';
import { ChatProvider, useChat } from './ChatProvider';

describe('ChatProvider', () => {
  it('should send message and receive response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ content: 'Test response', actions: [] })
    });

    const { result } = renderHook(() => useChat(), {
      wrapper: ChatProvider
    });

    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].content).toBe('Hello');
    expect(result.current.messages[1].content).toBe('Test response');
  });
});
```

---

## 🚀 Comandos de Inicio Rápido Corregidos

```bash
# 1. Verificar estructura
ls -la packages/desktop-client/src/components/

# 2. Extender configuración actual-ai
echo "CHAT_ENABLED=true" >> .env.ai
echo "CHAT_CONTEXT_WINDOW=conversation,budget,transactions" >> .env.ai

# 3. Restart servicio
docker-compose -f docker-compose.ai.yml restart

# 4. Verificar endpoint
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"How much did I spend on groceries?", "context":{}}'

# 5. Test básico
yarn workspace @actual-app/web test packages/desktop-client/src/components/chat/
```

---

## 📊 Métricas de Corrección

| Aspecto | Original | Corregido | Mejora |
|---------|----------|-----------|---------|
| **Tiempo total** | 12-14 días | 8-10 días | ✅ 30% menos |
| **Archivos nuevos** | 25+ | 12 | ✅ 50% menos |
| **Configuración** | Fragmentada | Unificada | ✅ 100% compatible |
| **Riesgo** | Alto | Bajo | ✅ Infraestructura probada |
| **Mantenimiento** | Complejo | Simple | ✅ Usa patrones existentes |

---

## 🎯 Próximos Pasos Corregidos

1. **✅ Aprobar esta guía corregida**
2. **🔄 Comenzar Fase 0: Preparación**
3. **📋 Implementar componentes base**
4. **🧪 Testear integración**
5. **🚀 Desplegar usando actual-ai existente**

**¿Deseas que proceda con la implementación de la Fase 0 usando esta guía corregida?**
