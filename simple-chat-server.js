// Servidor de chat simple para desarrollo y pruebas del chatbot

const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Endpoint principal del chat
app.post('/api/ai/chat', (req, res) => {
    try {
        const { message, context } = req.body;

        console.log('Chat request received:', { message, context });

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Respuesta simulada inteligente basada en el mensaje
        let response = generateResponse(message, context);
        let actions = extractPossibleActions(message, response);

        res.json({
            content: response,
            actions: actions,
            timestamp: new Date().toISOString(),
            model: 'Moonshot Kimi K2 (Simulated)'
        });

    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({
            error: 'Failed to process chat message',
            details: error.message
        });
    }
});

// Health check
app.get('/api/ai/chat/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'simple-chat-server',
        timestamp: new Date().toISOString()
    });
});

function generateResponse(message, context) {
    const lowerMessage = message.toLowerCase();

    // Análisis de patrones en el mensaje
    if (lowerMessage.includes('gasto') || lowerMessage.includes('spend') || lowerMessage.includes('spent')) {
        return `Entiendo que quieres analizar tus gastos. Basado en tu contexto actual:

🔍 **Análisis de Gastos**
- Tienes ${context?.accounts?.length || 0} cuentas configuradas
- ${context?.categories?.length || 0} categorías disponibles
- ${context?.transactions?.length || 0} transacciones registradas

💡 **Sugerencias:**
1. Revisar gastos por categoría del último mes
2. Identificar patrones de gasto inusuales
3. Establecer límites presupuestarios
4. Crear reglas de categorización automática

¿Te gustaría que profundice en alguno de estos análisis?`;
    }

    if (lowerMessage.includes('presupuesto') || lowerMessage.includes('budget')) {
        return `Te ayudo con tu presupuesto personal 📊

**Estado actual de tu presupuesto:**
- Cuentas activas: ${context?.accounts?.length || 0}
- Categorías: ${context?.categories?.length || 0}

**Acciones recomendadas:**
• Establecer límites mensuales por categoría
• Revisar variaciones vs presupuesto planificado
• Configurar alertas de gastos
• Optimizar distribución de ingresos

¿Quieres que ajustemos alguna categoría específica?`;
    }

    if (lowerMessage.includes('categoria') || lowerMessage.includes('category')) {
        return `Perfecto, hablemos de tus categorías 🏷️

**Gestión de Categorías:**
- Total de categorías: ${context?.categories?.length || 0}
- Puedo ayudarte a crear nuevas categorías
- Optimizar la organización existente
- Crear reglas de asignación automática

**¿Qué necesitas?**
• Crear nueva categoría
• Reorganizar categorías existentes  
• Establecer reglas automáticas
• Analizar distribución de gastos por categoría`;
    }

    if (lowerMessage.includes('transaccion') || lowerMessage.includes('transaction')) {
        return `Hablemos de tus transacciones 💳

**Estado de Transacciones:**
- Total registradas: ${context?.transactions?.length || 0}
- Puedo ayudarte a categorizarlas automáticamente
- Detectar duplicados o errores
- Crear transacciones recurrentes

**Servicios disponibles:**
✅ Categorización inteligente
✅ Detección de patrones
✅ Creación de reglas
✅ Análisis de tendencias`;
    }

    // Respuesta general amigable
    return `¡Hola! Soy tu asistente financiero con Moonshot Kimi K2 🤖💰

**Puedo ayudarte con:**
• 📊 Análisis de gastos e ingresos
• 🏷️ Gestión de categorías y etiquetas
• 💳 Organización de transacciones
• 📈 Planificación presupuestaria
• 🔍 Reportes personalizados
• ⚙️ Automatización de reglas

**Tu contexto actual:**
- Cuentas: ${context?.accounts?.length || 0}
- Categorías: ${context?.categories?.length || 0}  
- Transacciones: ${context?.transactions?.length || 0}

¿En qué aspecto de tus finanzas te gustaría que te ayude hoy?`;
}

function extractPossibleActions(message, response) {
    const actions = [];
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('crear') || lowerMessage.includes('nueva')) {
        if (lowerMessage.includes('categoria')) {
            actions.push({
                type: 'create_category',
                title: '➕ Crear Categoría',
                description: 'Crear una nueva categoría basada en la conversación',
                parameters: { suggestedName: 'Nueva Categoría' }
            });
        }

        if (lowerMessage.includes('transaccion')) {
            actions.push({
                type: 'create_transaction',
                title: '💳 Nueva Transacción',
                description: 'Registrar una nueva transacción',
                parameters: {}
            });
        }
    }

    if (lowerMessage.includes('regla') || lowerMessage.includes('automatica')) {
        actions.push({
            type: 'create_rule',
            title: '⚙️ Crear Regla',
            description: 'Configurar regla de categorización automática',
            parameters: {}
        });
    }

    if (lowerMessage.includes('reporte') || lowerMessage.includes('analisis')) {
        actions.push({
            type: 'generate_report',
            title: '📊 Generar Reporte',
            description: 'Crear reporte personalizado de finanzas',
            parameters: {}
        });
    }

    return actions;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Simple Chat Server running on port ${PORT}`);
    console.log(`📍 Chat endpoint: http://localhost:${PORT}/api/ai/chat`);
    console.log(`💬 Using Moonshot Kimi K2 simulation for development`);
});
