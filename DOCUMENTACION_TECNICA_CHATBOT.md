# 🛠️ Chatbot Moonshot Kimi K2 - Guía Técnica para Desarrolladores

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico

```
Frontend (React/TypeScript)
# OpenRouter + Moonshot Kimi K2
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-[TU-API-KEY-AQUI]
OPENROUTER_MODEL=moonshotai/kimi-k2:free
OPENROUTER_SITE_URL=https://actual-budget.com
OPENROUTER_APP_NAME=Actual-Budget-AIHTTP/JSON
Express Server (Node.js)
    ↓ REST API
OpenRouter API
    ↓ AI Model
Moonshot Kimi K2
```

### Componentes Principales

| Componente                   | Tecnología       | Responsabilidad               |
| ---------------------------- | ---------------- | ----------------------------- |
| **ChatProvider**             | React Context    | Estado global del chat        |
| **ChatSidebar**              | React/TypeScript | UI del chat resizable         |
| **ChatButton**               | React Component  | Trigger en titlebar           |
| **actual-ai-chat-extension** | Express/Node.js  | Backend AI server             |
| **OpenRouter Integration**   | REST API         | Conexión con Moonshot Kimi K2 |

---

## 📁 Estructura de Archivos

```
/actual/
├── 🚀 Backend
│   ├── actual-ai-chat-extension.js     # Servidor principal AI
│   ├── chat-server-simple.js           # Servidor mock para testing
│   ├── .env.ai                         # Variables OpenRouter/Moonshot
│   └── .env.development                # Variables frontend
│
├── 🎨 Frontend
│   └── packages/desktop-client/src/
│       ├── components/
│       │   ├── ChatButton.tsx          # Botón trigger
│       │   ├── ChatSidebar.tsx         # UI principal
│       │   ├── Titlebar.tsx            # Integración en titlebar
│       │   └── chat/
│       │       └── ChatProvider.tsx    # Context y lógica
│       └── hooks/chat/
│           └── useChatServerStatus.ts  # Estado del servidor
│
└── 🐳 Docker
    └── docker-compose.full.yml         # Configuración con puertos
```

---

## 🔌 API del Backend

### Endpoint Principal: `/api/ai/chat`

```typescript
// Request
interface ChatRequest {
  message: string;
  context: {
    accounts?: Account[];
    categories?: Category[];
    transactions?: Transaction[];
  };
}

// Response
interface ChatResponse {
  content: string; // Respuesta del AI
  actions?: FinancialAction[]; // Acciones sugeridas
  timestamp: string; // ISO timestamp
}

// Financial Action
interface FinancialAction {
  type: string; // create_transaction, adjust_budget, etc.
  title: string; // Título para mostrar
  description: string; // Descripción de la acción
  parameters: Record<string, unknown>; // Parámetros de ejecución
}
```

### Health Check: `/api/ai/chat/health`

```bash
curl http://localhost:3000/api/ai/chat/health
# Response:
{
  "status": "healthy",
  "service": "actual-ai-chat",
  "timestamp": "2025-07-17T17:01:45.000Z"
}
```

---

## ⚛️ Frontend Components

### ChatProvider.tsx

**Responsabilidades:**

- Gestión del estado global del chat
- Comunicación con el backend
- Manejo de errores y loading states
- Integración con Redux para contexto financiero

**Hooks utilizados:**

- `useCategories()` - Categorías de Actual Budget
- `useAccounts()` - Cuentas configuradas
- `useSelector()` - Transacciones desde Redux

**API del Context:**

```typescript
interface ChatContextValue {
  messages: ChatMessage[];
  isLoading: boolean;
  sendMessage: (message: string) => Promise<void>;
  executeAction: (action: FinancialAction) => Promise<void>;
  clearChat: () => void;
}
```

### ChatSidebar.tsx

**Características:**

- Panel resizable con localStorage persistence
- Auto-scroll a nuevos mensajes
- Indicador de estado del servidor
- UI responsiva con límites min/max width

**Estado local:**

```typescript
const [sidebarWidth, setSidebarWidth] = useState(420);
const [isResizing, setIsResizing] = useState(false);
const [inputValue, setInputValue] = useState('');
```

### ChatButton.tsx

**Integración:**

- Botón en `Titlebar.tsx` línea 350
- Estado local para open/close del sidebar
- Icono 💬 con aria-label para accesibilidad

---

## 🔧 Configuración de Desarrollo

### Variables de Entorno

#### `.env.ai` (Backend)

```bash
# OpenRouter + Moonshot Kimi K2
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-[tu-api-key]
OPENROUTER_MODEL=moonshotai/kimi-k2:free
OPENROUTER_SITE_URL=https://actual-budget.com
OPENROUTER_APP_NAME=Actual-Budget-AI

# Server config
CHAT_PORT=3000
CHAT_ENABLED=true
NODE_ENV=development
```

#### `.env.development` (Frontend)

```bash
# Chat server URL
REACT_APP_CHAT_URL=http://localhost:3000
REACT_APP_CHAT_ENABLED=true
REACT_APP_CHAT_MODEL=actual-ai-integration
REACT_APP_DEBUG_CHAT=true
```

### Docker Configuration

#### Puertos mapeados en `docker-compose.full.yml`:

```yaml
ports:
  - '3001:3001' # Frontend development
  - '5006:5006' # Backend API
  - '3000:3000' # AI Chat API ← NUEVO
  - '9229:9229' # Node.js debug port
```

---

## 🚀 Deployment y Ejecución

### Desarrollo Local

```bash
# 1. Iniciar Docker environment
docker-compose -f docker-compose.full.yml up -d

# 2. Verificar contenedores
docker ps
# Debe mostrar: actual-dev, actual-postgres, actual-redis

# 3. Iniciar chat server (se hace automáticamente)
docker exec -d actual-dev node /app/actual-ai-chat-extension.js

# 4. Verificar funcionamiento
curl http://localhost:3000/api/ai/chat/health
```

### Testing

```bash
# Test del backend
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Test message","context":{}}'

# Test del frontend
# Abrir http://localhost:3001 y probar el botón 💬
```

### Debugging

```bash
# Logs del servidor
docker logs actual-dev --tail 50

# Procesos del chat
docker exec actual-dev ps aux | grep chat

# Logs específicos del chat (si se implementa logging)
docker exec actual-dev tail -f /app/chat-server.log
```

---

## 🔄 Flujo de Datos

### 1. User Input

```
Usuario escribe mensaje → ChatSidebar → ChatProvider.sendMessage()
```

### 2. Context Building

```typescript
const context = {
  categories: useCategories(),
  accounts: useAccounts(),
  transactions: useSelector(state => state.queries.transactions),
};
```

### 3. API Call

```typescript
const response = await fetch(`${chatUrl}/api/ai/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message, context }),
});
```

### 4. AI Processing

```
Express Server → OpenRouter API → Moonshot Kimi K2 → Response
```

### 5. UI Update

```typescript
setMessages(prev => [
  ...prev,
  {
    id: Date.now().toString(),
    content: message,
    role: 'user',
    timestamp: new Date(),
  },
  {
    id: (Date.now() + 1).toString(),
    content: data.content,
    role: 'assistant',
    timestamp: new Date(),
    actions: data.actions,
  },
]);
```

---

## 🎯 Extensibilidad

### Agregar Nuevos Modelos AI

```typescript
// En actual-ai-chat-extension.js
const getAIResponse = async (prompt, context) => {
  switch (process.env.LLM_PROVIDER) {
    case 'openrouter':
      return await callOpenRouter(prompt, context);
    case 'openai':
      return await callOpenAI(prompt, context);
    case 'anthropic':
      return await callAnthropic(prompt, context);
    case 'local':
      return await callLocalLLM(prompt, context);
    default:
      throw new Error('Unsupported LLM provider');
  }
};
```

### Agregar Nuevas Acciones

```typescript
// En extractActionsFromResponse()
if (response.includes('crear presupuesto')) {
  actions.push({
    type: 'create_budget',
    title: 'Crear Presupuesto',
    description: 'Crear un nuevo presupuesto basado en la conversación',
    parameters: { category: extractedCategory, amount: extractedAmount },
  });
}
```

### Integrar con Redux Actions

```typescript
// En ChatProvider.executeAction()
const executeAction = async (action: FinancialAction) => {
  switch (action.type) {
    case 'create_transaction':
      dispatch(createTransaction(action.parameters));
      break;
    case 'adjust_budget':
      dispatch(updateBudget(action.parameters));
      break;
    // ... más acciones
  }
};
```

---

## 🔍 Monitoring y Logging

### Health Monitoring

```typescript
// Implementar en actual-ai-chat-extension.js
app.get('/api/ai/chat/metrics', (req, res) => {
  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    requests: requestCount,
    errors: errorCount,
    lastRequest: lastRequestTime,
  });
});
```

### Error Tracking

```typescript
// Implementar logging estructurado
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'chat-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'chat-combined.log' }),
  ],
});
```

---

## 🔒 Seguridad

### Validación de Input

```typescript
// Validar mensajes del usuario
const validateMessage = (message: string): boolean => {
  if (!message || message.length > 1000) return false;
  if (message.includes('<script>')) return false; // XSS basic protection
  return true;
};
```

### Rate Limiting

```typescript
// Implementar rate limiting por IP
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 10, // 10 requests por minuto
  message: 'Too many requests, please try again later.',
});

app.use('/api/ai/chat', limiter);
```

### Sanitización de Context

```typescript
// Limpiar datos sensibles antes de enviar a AI
const sanitizeContext = context => {
  return {
    accountCount: context.accounts?.length || 0,
    categoryNames: context.categories?.map(c => c.name) || [],
    transactionCount: context.transactions?.length || 0,
    // NO enviar: balances, números de cuenta, datos personales
  };
};
```

---

## 📊 Performance Optimization

### Caching de Respuestas

```typescript
// Cache simple en memoria
const responseCache = new Map();
const getCachedResponse = messageHash => {
  return responseCache.get(messageHash);
};
```

### Lazy Loading de Componentes

```typescript
// Cargar ChatSidebar solo cuando se necesite
const ChatSidebar = React.lazy(() => import('./ChatSidebar'));

// En ChatButton.tsx
{isChatOpen && (
  <Suspense fallback={<div>Loading chat...</div>}>
    <ChatSidebar isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
  </Suspense>
)}
```

### Debouncing de Input

```typescript
// En ChatSidebar.tsx
const debouncedSendMessage = useMemo(
  () => debounce(sendMessage, 500),
  [sendMessage],
);
```

---

## 🧪 Testing

### Unit Tests

```typescript
// ChatProvider.test.tsx
describe('ChatProvider', () => {
  it('should send message and update state', async () => {
    const { result } = renderHook(() => useChat(), {
      wrapper: ({ children }) => <ChatProvider>{children}</ChatProvider>
    });

    await act(async () => {
      await result.current.sendMessage('Test message');
    });

    expect(result.current.messages).toHaveLength(2);
  });
});
```

### Integration Tests

```bash
# Test completo del flujo
npm run test:integration

# Test manual con curl
./scripts/test-chat-flow.sh
```

---

## 📈 Métricas y Analytics

### Métricas Útiles

- Tiempo de respuesta del AI
- Tasa de errores por tipo
- Patrones de uso más comunes
- Satisfacción del usuario (implícita)

### Implementación

```typescript
// En actual-ai-chat-extension.js
const metrics = {
  requestCount: 0,
  responseTime: [],
  errorCount: 0,
  popularQueries: new Map(),
};

// Middleware para tracking
app.use('/api/ai/chat', (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    metrics.responseTime.push(Date.now() - start);
    metrics.requestCount++;
  });
  next();
});
```

---

_Última actualización: 17 de julio de 2025_
_Versión: Moonshot Kimi K2 en Docker - Completamente funcional_
