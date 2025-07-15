# Actual AI Integration

Este directorio contiene la integración de [actual-ai](https://github.com/sakowicz/actual-ai) para categorización automática de transacciones usando inteligencia artificial.

## 🚀 Inicio Rápido

1. **Configurar variables de entorno:**

   ```bash
   cp .env.ai.example .env.ai
   # Edita .env.ai con tus configuraciones
   ```

2. **Ejecutar setup automático:**

   ```bash
   ./setup-actual-ai.sh
   ```

3. **¡Listo!** Tu Actual Budget ahora tiene categorización automática con IA.

## 🔑 Configuración Mínima:

Solo necesitas:

- **ACTUAL_BUDGET_ID** (lo obtienes de Settings → Show advanced settings → Sync ID)
- **Un proveedor de IA** (OpenAI recomendado para empezar)

### 🌟 Recomendaciones por Proveedor:

- **OpenAI**: Más confiable, mejor para empezar
- **OpenRouter**: Acceso a múltiples modelos, algunos gratuitos
- **Anthropic Claude**: Muy preciso, excelente para categorización
- **Google Gemini**: Económico, buen rendimiento
- **Ollama**: Completamente gratis, funciona offline
- **Groq**: Muy rápido, buena relación calidad-precio

### 📊 Modelos Recomendados por Proveedor:

**OpenRouter (múltiples opciones):**

- `meta-llama/llama-3.1-8b-instruct:free` - Gratuito
- `anthropic/claude-3.5-haiku` - Económico y rápido
- `openai/gpt-4o-mini` - Excelente calidad-precio
- `google/gemini-flash-1.5` - Muy rápido

## 📋 Configuración Completa

Para una configuración más avanzada, edita `.env.ai` con las siguientes variables:

### 1. ID del Presupuesto

Ve a Actual Budget → Settings → Show advanced settings → Sync ID

### 2. Proveedor de IA (elige uno)

**OpenAI (Recomendado):**

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-tu-clave-aqui
OPENAI_MODEL=gpt-4o-mini
```

**Anthropic Claude:**

```env
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-tu-clave-aqui
ANTHROPIC_MODEL=claude-3-5-sonnet-latest
```

**Google Gemini:**

```env
LLM_PROVIDER=google-generative-ai
GOOGLE_GENERATIVE_AI_API_KEY=tu-clave-google-aqui
GOOGLE_GENERATIVE_AI_MODEL=gemini-1.5-flash
```

**Ollama (Local/Gratis):**

```env
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://host.docker.internal:11434/api
OLLAMA_MODEL=llama3.1
```

**OpenRouter (Múltiples modelos):**

```env
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-tu-clave-aqui
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

## 🔧 Configuraciones de Docker Compose

### Básico (Solo Actual + AI)

```bash
docker-compose -f docker-compose.full.yml up actual-dev actual-ai
```

### Con Cache Redis

```bash
docker-compose -f docker-compose.full.yml --profile with-cache up
```

### Con Analytics PostgreSQL

```bash
docker-compose -f docker-compose.full.yml --profile with-analytics up
```

### Con Ollama Local

```bash
docker-compose -f docker-compose.full.yml --profile with-local-ai up
```

### Completo (Todo incluido)

```bash
docker-compose -f docker-compose.full.yml --profile with-cache --profile with-analytics --profile with-local-ai up
```

## 🎛️ Características Disponibles

Configura en `.env.ai` la variable `FEATURES`:

- `"dryRun"`: Solo mostrar cambios, no aplicarlos
- `"classifyOnStartup"`: Clasificar al iniciar
- `"syncAccountsBeforeClassify"`: Sincronizar antes de clasificar
- `"freeWebSearch"`: Búsquedas web para mejor categorización
- `"suggestNewCategories"`: Sugerir nuevas categorías
- `"autoCreateCategories"`: Crear categorías automáticamente
- `"markProcessed"`: Marcar transacciones como procesadas

## 📅 Programación Automática

Configura ejecución automática con cron:

```env
# Cada día a las 9:00 AM
CRON_SCHEDULE=0 9 * * *

# Cada 6 horas
CRON_SCHEDULE=0 */6 * * *

# Domingos a las 9:00 PM
CRON_SCHEDULE=0 21 * * 0
```

## 📊 Monitoreo y Logs

```bash
# Ver logs en tiempo real
docker-compose -f docker-compose.full.yml logs -f actual-ai

# Ver estado de contenedores
docker-compose -f docker-compose.full.yml ps

# Ver logs específicos
docker-compose -f docker-compose.full.yml logs actual-ai --tail=50
```

## 🔒 Seguridad y Privacidad

- **API Keys**: No compartas tu archivo `.env.ai` configurado
- **Datos**: Las transacciones se envían al proveedor de IA elegido
- **Costos**: Servicios comerciales cobran por uso
- **Testing**: Usa `"dryRun"` para probar sin hacer cambios

## 🛠️ Comandos Útiles

```bash
# Parar servicios
docker-compose -f docker-compose.full.yml down

# Reiniciar solo AI
docker-compose -f docker-compose.full.yml restart actual-ai

# Ver configuración actual
docker-compose -f docker-compose.full.yml config

# Limpiar todo
docker-compose -f docker-compose.full.yml down -v
```

## 📁 Estructura de Archivos

```
.
├── docker-compose.full.yml     # Configuración completa de Docker
├── .env.ai.example            # Plantilla de configuración
├── .env.ai                    # Tu configuración (no subir a git)
├── setup-actual-ai.sh         # Script de configuración automática
├── logs/actual-ai/           # Logs del servicio AI
└── sql/init.sql              # Inicialización de base de datos
```

## 🆘 Solución de Problemas

### El servicio AI no se conecta a Actual

- Verifica que `ACTUAL_BUDGET_ID` sea correcto
- Asegúrate de que el contenedor `actual-dev` esté funcionando
- Revisa los logs: `docker-compose -f docker-compose.full.yml logs actual-ai`

### Errores de API Key

- Verifica que la API key sea válida
- Asegúrate de tener créditos/quota disponible
- Revisa que el modelo especificado esté disponible

### Performance lenta

- Considera usar modelos más rápidos (ej: `gpt-4o-mini` en lugar de `gpt-4`)
- Ajusta `BATCH_SIZE` a un valor menor
- Habilita cache Redis con `--profile with-cache`

### Categorización incorrecta

- Ajusta `AI_TEMPERATURE` (menor = más determinista)
- Habilita `"freeWebSearch"` para mejor contexto
- Considera cambiar de proveedor de IA

## 🔄 Actualizaciones

Para actualizar actual-ai:

```bash
docker-compose -f docker-compose.full.yml pull actual-ai
docker-compose -f docker-compose.full.yml up -d actual-ai
```

## 📞 Soporte

- **Actual Budget**: [Documentación oficial](https://actualbudget.org/docs/)
- **Actual AI**: [Repositorio GitHub](https://github.com/sakowicz/actual-ai)
- **Issues**: Reporta problemas en los repositorios respectivos

---

¡Disfruta de la categorización automática de transacciones! 🎉
