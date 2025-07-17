# 🤖 Actual Budget + Moonshot Kimi K2 AI Assistant

## 🎯 Estado Actual: ✅ COMPLETAMENTE FUNCIONAL

Integración completa de **Moonshot Kimi K2** como asistente financiero conversacional en Actual Budget, funcionando en Docker para máxima compatibilidad.

![Demo](demo.png)

---

## 🚀 Inicio Rápido (3 comandos)

```bash
# 1. Iniciar el entorno Docker
docker-compose -f docker-compose.full.yml up -d

# 2. Verificar que todo funciona
curl http://localhost:3000/api/ai/chat/health

# 3. Abrir Actual Budget y buscar el botón 💬
open http://localhost:3001
```

---

## ✨ Características Principales

### 🎨 Interfaz de Usuario

- **Sidebar Resizable**: Panel de chat redimensionable a la derecha
- **Persistencia**: El tamaño del panel se guarda automáticamente
- **Estado en Tiempo Real**: Indicador de conexión con el servidor AI
- **Historial Completo**: Conversación persistente durante la sesión

### 🧠 Inteligencia Artificial

- **Modelo**: Moonshot Kimi K2 (moonshotai/kimi-k2:free)
- **Provider**: OpenRouter API para máxima compatibilidad
- **Contexto Financiero**: Acceso a categorías, cuentas y transacciones
- **Respuestas Contextual**: Análisis inteligente de patrones financieros

### 🐳 Arquitectura Docker

- **Totalmente Containerizado**: Compatibilidad con Kubernetes
- **Puertos Optimizados**: 3001 (Frontend), 5006 (Backend), 3000 (AI Chat)
- **Hot Reload**: Desarrollo con recarga automática
- **Datos Persistentes**: PostgreSQL + Redis integrados

---

## 📋 Servicios y Puertos

| Puerto | Servicio    | Estado    | Descripción                    |
| ------ | ----------- | --------- | ------------------------------ |
| `3001` | Frontend    | ✅ Activo | Interfaz web de Actual Budget  |
| `5006` | Backend API | ✅ Activo | API principal de Actual Budget |
| `3000` | AI Chat     | ✅ Activo | Servidor Moonshot Kimi K2      |

---

## 💬 Ejemplos de Uso

### Análisis Financiero

```
Usuario: "¿Cuánto gasté en comida este mes?"
AI: "Basándome en tus transacciones, gastaste €450 en la categoría 'Comida' este mes,
     lo cual representa un 15% más que el mes anterior. Tu presupuesto mensual es €400,
     por lo que estás €50 por encima del límite."
```

### Planificación de Presupuestos

```
Usuario: "¿Puedo permitirme unas vacaciones de €800?"
AI: "Considerando tu patrón de ahorro actual de €200/mes y tus gastos fijos,
     podrías permitirte esas vacaciones en 4 meses sin afectar tu estabilidad financiera."
```

### Consejos Personalizados

```
Usuario: "¿Cómo puedo ahorrar más dinero?"
AI: "He analizado tus gastos y veo que podrías ahorrar €120/mes reduciendo:
     • Comida fuera: €60 (comes fuera 8 veces/mes vs promedio de 4)
     • Suscripciones: €35 (tienes 5 servicios de streaming activos)
     • Transporte: €25 (considera transporte público vs Uber)"
```

---

## 📚 Documentación Completa

### Para Usuarios

- **[📖 Guía del Usuario](GUIA_USUARIO_CHATBOT.md)**: Cómo usar el asistente financiero
- **[⚙️ Configuración](CHATBOT_CONFIGURATION_GUIDE.md)**: Guía de configuración completa

### Para Desarrolladores

- **[🛠️ Documentación Técnica](DOCUMENTACION_TECNICA_CHATBOT.md)**: Arquitectura y desarrollo
- **[🔧 API Reference](CHAT_BACKEND_SETUP.md)**: Endpoints y configuración backend

### Archivos de Estado

- **[✅ Integración Completa](CHAT_INTEGRATION_COMPLETE.md)**: Resumen de implementación
- **[📝 Checklist](CHAT_INTEGRATION_CHECKLIST.md)**: Estado de todas las tareas

---

## 🛠️ Stack Tecnológico

### Frontend

- **React 19.1.0** con TypeScript
- **Vite 6.3.5** para desarrollo
- **Redux** para gestión de estado
- **CSS-in-JS** con tema personalizado

### Backend

- **Node.js** con Express
- **Docker** containerización completa
- **PostgreSQL** base de datos principal
- **Redis** para caché y sesiones

### AI/ML

- **Moonshot Kimi K2** modelo conversacional
- **OpenRouter API** para máxima compatibilidad
- **Context-aware** respuestas basadas en datos financieros

---

## 🔧 Desarrollo

### Requisitos

- Docker & Docker Compose
- Node.js 18+ (para desarrollo local)
- Git

### Setup de Desarrollo

```bash
# Clonar el repositorio
git clone [tu-repo]
cd actual

# Configurar variables de entorno
cp .env.ai.example .env.ai
# Editar .env.ai con tu API key de OpenRouter

# Iniciar desarrollo
docker-compose -f docker-compose.full.yml up -d

# Verificar funcionamiento
curl http://localhost:3000/api/ai/chat/health
```

### Testing

```bash
# Test del backend AI
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Test","context":{}}'

# Test del frontend
open http://localhost:3001  # Buscar botón 💬
```

---

## 🔐 Seguridad y Privacidad

### Datos Locales

- **100% Local**: Tus datos financieros permanecen en tu dispositivo
- **Contexto Mínimo**: Solo se envía información agregada al AI
- **Sin Persistencia**: Las conversaciones no se almacenan

### API Security

- **Rate Limiting**: Protección contra abuso
- **Input Validation**: Sanitización de mensajes del usuario
- **CORS Configurado**: Acceso controlado desde el frontend

---

## 📞 Soporte y Troubleshooting

### Problemas Comunes

**El botón 💬 no aparece**

```bash
# Verificar que el frontend esté corriendo
curl http://localhost:3001
```

**"No se pudo conectar con el servidor"**

```bash
# Verificar que el chat server esté activo
curl http://localhost:3000/api/ai/chat/health
```

**Respuestas muy genéricas**

- Verifica que `.env.ai` tenga la API key correcta
- Sé más específico en tus preguntas

### Logs y Debugging

```bash
# Ver logs del contenedor principal
docker logs actual-dev

# Ver procesos del chat
docker exec actual-dev ps aux | grep chat

# Reiniciar solo el chatbot
docker exec actual-dev pkill -f actual-ai-chat-extension
docker exec -d actual-dev node /app/actual-ai-chat-extension.js
```

---

## 🚀 Roadmap

### Próximas Funcionalidades

- [ ] **Acciones Automáticas**: Ejecutar transacciones desde el chat
- [ ] **Análisis Visual**: Gráficos generados por IA
- [ ] **Integraciones Bancarias**: Conectar con bancos via IA
- [ ] **Notificaciones Proactivas**: Alertas inteligentes de gastos
- [ ] **Soporte Multi-modelo**: GPT-4, Claude, modelos locales

### Mejoras Técnicas

- [ ] **Caching Inteligente**: Cache de respuestas frecuentes
- [ ] **Streaming Responses**: Respuestas en tiempo real
- [ ] **Offline Mode**: Funcionalidad básica sin conexión
- [ ] **Mobile Responsive**: Optimización para móviles

---

## 📄 Licencia

MIT License - Ver [LICENSE.txt](LICENSE.txt) para detalles.

---

## 🙏 Agradecimientos

- **Actual Budget**: Por la base sólida de gestión financiera
- **Moonshot AI**: Por el modelo Kimi K2 gratuito y potente
- **OpenRouter**: Por la API unificada de modelos AI
- **Docker**: Por la containerización que hace todo esto posible

---

_Construido con ❤️ para hacer las finanzas personales más inteligentes_

**Estado**: ✅ Completamente funcional | **Última actualización**: 17 julio 2025
