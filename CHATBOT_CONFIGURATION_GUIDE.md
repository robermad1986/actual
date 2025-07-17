# 🤖 Chatbot Moonshot Kimi K2 - Guía Completa

## 📋 Resumen del Sistema

El chatbot financiero integrado en Actual Budget utiliza **Moonshot Kimi K2** a través de OpenRouter API, funcionando completamente en Docker para compatibilidad con Kubernetes.

### 🎯 Estado Actual: ✅ COMPLETAMENTE FUNCIONAL

- **Modelo AI**: Moonshot Kimi K2 (moonshotai/kimi-k2:free)
- **Provider**: OpenRouter API
- **Arquitectura**: Docker containerizado
- **Frontend**: React/TypeScript sidebar resizable
- **Backend**: Express server en contenedor actual-dev

---

## 🔐 Configuración Segura

### Archivos de Configuración

**⚠️ IMPORTANTE**: Los archivos `.env.ai` y `.env.development` contienen información sensible y NO deben subirse a Git.

#### Configuración Inicial Segura

```bash
# 1. Copiar archivos de ejemplo
cp .env.ai.example .env.ai
cp .env.development.example .env.development

# 2. Editar con tus API keys reales
nano .env.ai  # Agregar tu OPENROUTER_API_KEY real

# 3. Verificar que estén en .gitignore
echo ".env.ai" >> .gitignore
echo ".env.development" >> .gitignore
```

#### Variables Sensibles a Proteger

- `OPENROUTER_API_KEY`: API key de OpenRouter
- `ACTUAL_PASSWORD`: Contraseña de tu instancia
- `ACTUAL_BUDGET_ID`: ID de tu presupuesto
- Cualquier token o credential de servicios externos

### Verificación de Seguridad

```bash
# Verificar que archivos sensibles no están en Git
git status | grep -E "\.env\.(ai|development)$"
# No debería mostrar nada

# Verificar .gitignore
grep -E "\.env" .gitignore
# Debería mostrar las exclusiones
```

---

## 🚀 Configuración Rápida

### 1. Verificar que Docker está corriendo

```bash
# Verificar contenedores activos
docker ps

# Deberías ver:
# - actual-dev (puertos 3001, 5006, 3000)
# - actual-postgres
# - actual-redis
```

### 2. Iniciar el chatbot

```bash
# El chatbot ya está integrado y se inicia automáticamente
# Si necesitas reiniciarlo manualmente:
docker exec -d actual-dev node /app/actual-ai-chat-extension.js
```

### 3. Verificar funcionamiento

```bash
# Health check
curl http://localhost:3000/api/ai/chat/health

# Test de chat
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"¿Cuánto gasté este mes?","context":{"accounts":["Banco"],"categories":["Comida"]}}'
```

---

## 🛠 Configuración Técnica

### Puertos y Servicios

| Puerto | Servicio    | Descripción                          |
| ------ | ----------- | ------------------------------------ |
| `3001` | Frontend    | Interfaz web de Actual Budget        |
| `5006` | Backend API | API principal de Actual Budget       |
| `3000` | AI Chat     | Servidor de chatbot Moonshot Kimi K2 |

### Archivos de Configuración

#### `.env.ai` (Variables del chatbot)

```bash
# Configuración OpenRouter + Moonshot Kimi K2
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-[TU-API-KEY-AQUI]
OPENROUTER_MODEL=moonshotai/kimi-k2:free
OPENROUTER_SITE_URL=https://actual-budget.com
OPENROUTER_APP_NAME=Actual-Budget-AI

# Configuración del chat
CHAT_PORT=3000
CHAT_ENABLED=true
```

#### `.env.development` (Variables del frontend)

```bash
# URL del servidor de chat
REACT_APP_CHAT_URL=http://localhost:3000
REACT_APP_CHAT_ENABLED=true
REACT_APP_CHAT_MODEL=actual-ai-integration
REACT_APP_DEBUG_CHAT=true
```

### Estructura de Archivos

```
/actual/
├── actual-ai-chat-extension.js          # Servidor AI principal
├── chat-server-simple.js                # Servidor de pruebas
├── .env.ai                              # Configuración AI
├── .env.development                     # Configuración frontend
├── docker-compose.full.yml             # Docker con puertos mapeados
└── packages/desktop-client/src/components/
    ├── ChatButton.tsx                   # Botón en titlebar
    ├── ChatSidebar.tsx                  # Sidebar resizable
    └── chat/
        └── ChatProvider.tsx             # Context y lógica
```

---

## 💻 Uso de la Interfaz

### Acceder al Chat

1. **Abrir Actual Budget**: http://localhost:3001
2. **Click en el botón 💬**: Ubicado en la barra de título (titlebar)
3. **Sidebar se abre**: Panel resizable a la derecha

### Funcionalidades de la UI

- **Sidebar Resizable**: Arrastra el borde izquierdo para ajustar ancho
- **Persistencia**: El ancho se guarda en localStorage
- **Estado del Servidor**: Indicador de conexión en tiempo real
- **Historial**: Conversación completa con timestamps
- **Acciones Sugeridas**: Botones para acciones financieras

### Comandos de Ejemplo

```
"¿Cuánto gasté en comida este mes?"
"Muéstrame mis ingresos del último trimestre"
"¿Cuáles son mis gastos más altos?"
"Ayúdame a crear un presupuesto"
"¿Cómo puedo ahorrar más dinero?"
```

---

## 🔧 Desarrollo y Debugging

### Logs del Servidor

```bash
# Ver logs del contenedor principal
docker logs actual-dev

# Ver logs específicos del chat
docker exec actual-dev ps aux | grep actual-ai-chat-extension
```

### Debugging del Frontend

```bash
# Abrir las herramientas de desarrollador en el navegador
# Console → Network → buscar llamadas a localhost:3000
```

### Reiniciar Servicios

```bash
# Reiniciar todo el entorno Docker
docker-compose -f docker-compose.full.yml down
docker-compose -f docker-compose.full.yml up -d

# Reiniciar solo el chatbot
docker exec actual-dev pkill -f actual-ai-chat-extension
docker exec -d actual-dev node /app/actual-ai-chat-extension.js
```

---

## 🔍 Troubleshooting

### Problema: El botón 💬 no aparece

**Solución**: Verificar que ChatButton esté importado en Titlebar.tsx

### Problema: "No se pudo conectar con el servidor"

**Solución**:

```bash
# Verificar que el servidor esté corriendo
curl http://localhost:3000/api/ai/chat/health

# Si no responde, reiniciar:
docker exec -d actual-dev node /app/actual-ai-chat-extension.js
```

### Problema: Respuestas genéricas del AI

**Solución**: Verificar que `.env.ai` tenga la API key correcta de OpenRouter

### Problema: Sidebar no se abre

**Solución**: Verificar en Console del navegador si hay errores de JavaScript

---

## 🚀 Próximas Mejoras

### Funcionalidades Planificadas

1. **Acciones Automáticas**: Ejecutar transacciones desde el chat
2. **Análisis Visual**: Gráficos generados por IA
3. **Integraciones**: Conectar con bancos via IA
4. **Notificaciones**: Alertas proactivas de gastos
5. **Modelos Avanzados**: Soporte para GPT-4, Claude, etc.

### Configuración Avanzada

Para usar modelos más potentes, actualizar `.env.ai`:

```bash
# Para GPT-4 (requiere API key de OpenAI)
OPENROUTER_MODEL=openai/gpt-4-turbo-preview

# Para Claude (requiere API key de Anthropic)
OPENROUTER_MODEL=anthropic/claude-3-sonnet

# Para modelos locales (requiere servidor local)
LLM_PROVIDER=local
LOCAL_LLM_URL=http://localhost:11434
```

---

## 📞 Soporte

- **Logs de Error**: Revisar `docker logs actual-dev`
- **Estado del Sistema**: `docker ps` y `curl localhost:3000/api/ai/chat/health`
- **Configuración**: Verificar `.env.ai` y `.env.development`
- **Frontend**: Herramientas de desarrollador del navegador

---

_Última actualización: 17 de julio de 2025_
_Estado: Chatbot Moonshot Kimi K2 completamente funcional en Docker_
