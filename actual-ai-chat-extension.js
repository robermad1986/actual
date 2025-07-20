// Extensión para actual-ai - Endpoint de chat financiero
// Este script se ejecuta junto con actual-ai para agregar el endpoint /api/ai/chat

// Cargar variables de entorno desde .env.ai
require('dotenv').config({ path: '.env.ai' });

const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');

// Importar la API de Actual Budget para funciones avanzadas
let actualAPI;
try {
  // Intentar cargar desde el path local del proyecto Actual
  actualAPI = require('./packages/api');
  console.log('✅ API de Actual Budget cargada desde el repositorio local');
} catch (error) {
  try {
    // Fallback a la instalación npm
    actualAPI = require('@actual-app/api');
    console.log('✅ API de Actual Budget cargada desde npm');
  } catch (error2) {
    console.warn('⚠️ @actual-app/api no está disponible. Funcionalidades de creación deshabilitadas.');
  }
}

// Configuración de Express para el endpoint de chat
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Funciones helper para gestión avanzada de categorías
async function createCategoryIfNeeded(categoryName, groupId) {
  if (!actualAPI) {
    console.log('⚠️ No se puede crear categoría - API no disponible');
    return null;
  }

  try {
    console.log(`🏗️ Creando categoría: ${categoryName} en grupo ${groupId}`);
    const categoryId = await actualAPI.createCategory({
      name: categoryName,
      group_id: groupId
    });
    console.log(`✅ Categoría creada: ${categoryName} (${categoryId})`);
    return categoryId;
  } catch (error) {
    console.error('❌ Error creando categoría:', error);
    return null;
  }
}

async function createAutoCategorizationRule(payeeName, categoryId) {
  if (!actualAPI) {
    console.log('⚠️ No se puede crear regla - API no disponible');
    return null;
  }

  try {
    console.log(`🔧 Creando regla automática: ${payeeName} → categoría ${categoryId}`);
    const rule = await actualAPI.createRule({
      stage: 'pre',
      conditionsOp: 'and',
      conditions: [{
        field: 'payee',
        op: 'is',
        value: payeeName
      }],
      actions: [{
        op: 'set',
        field: 'category',
        value: categoryId
      }]
    });
    console.log(`✅ Regla creada para ${payeeName}`);
    return rule;
  } catch (error) {
    console.error('❌ Error creando regla:', error);
    return null;
  }
}

function analyzeTransactionPatterns(transactions) {
  const patterns = {};

  transactions.forEach(transaction => {
    if (!transaction.payee?.name) return;

    const payee = transaction.payee.name;
    const amount = Math.abs(transaction.amount || 0);

    if (!patterns[payee]) {
      patterns[payee] = {
        count: 0,
        totalAmount: 0,
        avgAmount: 0,
        suggestedCategory: null,
        isRecurring: false
      };
    }

    patterns[payee].count++;
    patterns[payee].totalAmount += amount;
    patterns[payee].avgAmount = patterns[payee].totalAmount / patterns[payee].count;

    // Marcar como recurrente si aparece 3+ veces
    if (patterns[payee].count >= 3) {
      patterns[payee].isRecurring = true;
    }
  });

  // Sugerir categorías basadas en patrones de nombres
  Object.keys(patterns).forEach(payee => {
    const lowerPayee = payee.toLowerCase();
    if (lowerPayee.includes('supermarket') || lowerPayee.includes('grocery') || lowerPayee.includes('food')) {
      patterns[payee].suggestedCategory = 'Comida y Supermercado';
    } else if (lowerPayee.includes('gas') || lowerPayee.includes('fuel') || lowerPayee.includes('combustible')) {
      patterns[payee].suggestedCategory = 'Transporte y Combustible';
    } else if (lowerPayee.includes('restaurant') || lowerPayee.includes('cafe') || lowerPayee.includes('food')) {
      patterns[payee].suggestedCategory = 'Restaurantes y Comidas';
    } else if (lowerPayee.includes('bank') || lowerPayee.includes('fee') || lowerPayee.includes('commission')) {
      patterns[payee].suggestedCategory = 'Tarifas Bancarias';
    }
  });

  return patterns;
}

// Endpoint de chat financiero
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, context } = req.body;

    console.log('=== DEBUG SERVER CHAT ===');
    console.log('Message:', message);
    console.log('Context structure:', {
      categories: context?.categories ? Object.keys(context.categories).length : 'No data',
      accounts: context?.accounts ? context.accounts.length : 'No data',
      transactions: context?.transactions ? (Array.isArray(context.transactions) ? context.transactions.length : 'Data present but not array') : 'No data'
    });

    if (context?.transactions && Array.isArray(context.transactions)) {
      // Show detailed sample transactions
      const sampleTransactions = context.transactions.slice(0, 3).map(t => ({
        id: t.id,
        amount: (t.amount / 100).toFixed(2),
        date: t.date,
        payee: t.payee?.name || 'Unknown',
        account: t.account?.name || 'Unknown',
        category: t.category?.name || 'Uncategorized'
      }));
      console.log('Sample transactions with details:', JSON.stringify(sampleTransactions, null, 2));

      // Transaction statistics  
      const amounts = context.transactions.map(t => (t.amount || 0) / 100);
      const totalAmount = amounts.reduce((sum, amt) => sum + amt, 0);
      const uncategorizedCount = context.transactions.filter(t => !t.category).length;

      console.log('Transaction statistics:', {
        total: amounts.length,
        uncategorized: uncategorizedCount,
        totalAmount: totalAmount.toFixed(2),
        avgAmount: (totalAmount / amounts.length).toFixed(2),
        minAmount: Math.min(...amounts).toFixed(2),
        maxAmount: Math.max(...amounts).toFixed(2)
      });
    }
    console.log('=== END DEBUG SERVER ===');

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Construir prompt contextual para el asistente financiero
    const systemPrompt = buildFinancialPrompt(context);
    const fullPrompt = `${systemPrompt}\n\nUsuario: ${message}\n\nAsistente:`;

    // Obtener respuesta del modelo configurado
    const response = await getAIResponse(fullPrompt, context);

    // Extraer acciones sugeridas
    const actions = extractActionsFromResponse(response);

    res.json({
      content: response,
      actions,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({
      error: 'Failed to process chat message',
      details: error.message
    });
  }
});

// Construir prompt contextual para finanzas personales
function buildFinancialPrompt(context) {
  const { categories, accounts, transactions } = context || {};

  // Determinar el número de elementos según el tipo de dato
  const categoriesCount = categories ?
    (Array.isArray(categories) ? categories.length : Object.keys(categories).length) : 0;
  const accountsCount = accounts ?
    (Array.isArray(accounts) ? accounts.length : Object.keys(accounts).length) : 0;
  const transactionsCount = transactions ?
    (Array.isArray(transactions) ? transactions.length : 'Datos disponibles') : 'Sin datos';

  let contextInfo = `Contexto actual del usuario en Actual Budget:
- Categorías: ${categoriesCount} configuradas
- Cuentas: ${accountsCount} configuradas  
- Transacciones: ${transactionsCount}

🤖 CAPACIDADES AVANZADAS DEL ASISTENTE:
1. ✅ Puedo CREAR NUEVAS CATEGORÍAS automáticamente cuando sea necesario
2. ✅ Puedo CREAR REGLAS de categorización automática basadas en patrones
3. ✅ Puedo ANALIZAR patrones de gastos y sugerir categorías personalizadas
4. ✅ Puedo IDENTIFICAR transacciones recurrentes y automatizar su clasificación
5. ✅ Puedo ACTUALIZAR categorías de transacciones existentes
6. ✅ Tengo acceso completo a ${transactionsCount} transacciones con montos reales

INSTRUCCIONES IMPORTANTES:
- Si el usuario pide crear categorías, PUEDO hacerlo usando la API de Actual Budget
- Si el usuario quiere automatizar categorizaciones, PUEDO crear reglas automáticas
- Si veo transacciones sin categorizar, PUEDO sugerir y crear categorías apropiadas
- SIEMPRE mostrar montos reales de las transacciones (no $0.00)
- ANALIZAR patrones de gastos para hacer sugerencias inteligentes`;

  // Si hay cuentas disponibles, agregar información detallada
  if (accounts && accountsCount > 0) {
    contextInfo += '\n\nCuentas disponibles:';
    const accountList = Array.isArray(accounts) ? accounts : Object.values(accounts);
    accountList.slice(0, 5).forEach(account => {
      if (account && account.name) {
        const balance = account.balance ? ` (Saldo: $${account.balance})` : '';
        contextInfo += `\n- ${account.name}${balance}`;
      }
    });
  }

  // Si hay categorías disponibles, agregar información detallada
  if (categories && categoriesCount > 0) {
    contextInfo += '\n\nCategorías principales:';
    const categoryList = Array.isArray(categories) ? categories : Object.values(categories);
    categoryList.slice(0, 10).forEach(category => {
      if (category && category.name) {
        contextInfo += `\n- ${category.name}`;
      }
    });
  }

  // Si hay transacciones disponibles, separar categorizadas y sin categorizar
  if (transactions && Array.isArray(transactions) && transactions.length > 0) {
    // Separar transacciones categorizadas y sin categorizar
    const categorizedTransactions = transactions.filter(trans => trans.category);
    const uncategorizedTransactions = transactions.filter(trans => !trans.category);

    contextInfo += `\n\nResumen de transacciones:\n- Categorizadas: ${categorizedTransactions.length}\n- Sin categorizar: ${uncategorizedTransactions.length}`;

    // Calcular totales por categoría (solo categorizadas)
    const categoryTotals = {};
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    categorizedTransactions.forEach(transaction => {
      if (transaction && transaction.category && transaction.amount) {
        const transactionDate = new Date(transaction.date);
        // Solo incluir transacciones del mes actual para totales
        if (transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear) {
          if (!categoryTotals[transaction.category]) {
            categoryTotals[transaction.category] = 0;
          }
          categoryTotals[transaction.category] += Math.abs(transaction.amount) / 100;
        }
      }
    });

    // Mostrar totales calculados del mes actual
    if (Object.keys(categoryTotals).length > 0) {
      contextInfo += `\n\nTotales por categoría (mes actual):`;
      Object.entries(categoryTotals).forEach(([categoryId, total]) => {
        const categoryName = getCategoryName(categoryId, categories);
        contextInfo += `\n- ${categoryName}: $${total.toFixed(2)}`;
      });
    }

    // Mostrar transacciones sin categorizar para ayudar con clasificación
    if (uncategorizedTransactions.length > 0) {
      contextInfo += `\n\n⚠️ TRANSACCIONES SIN CATEGORIZAR (${uncategorizedTransactions.length} total):`;
      // Mostrar las 10 más recientes sin categorizar
      uncategorizedTransactions.slice(0, 10).forEach(transaction => {
        const date = transaction.date || 'Fecha desconocida';
        const payee = transaction.payee?.name || transaction.payee || 'Comercio desconocido';
        // Convertir de enteros (céntimos) a formato decimal
        const amount = Math.abs(transaction.amount || 0) / 100;
        const type = (transaction.amount > 0) ? 'Ingreso' : 'Gasto';
        contextInfo += `\n- ${date}: ${payee} - $${amount.toFixed(2)} (${type}) [NECESITA CATEGORÍA]`;
      });

      if (uncategorizedTransactions.length > 10) {
        contextInfo += `\n... y ${uncategorizedTransactions.length - 10} más sin categorizar`;
      }
    }
  }

  return `Eres un asistente financiero experto para Actual Budget. Ayudas a los usuarios a entender sus finanzas personales y sugerir acciones específicas.

${contextInfo}

IMPORTANTE: 
- Utiliza SIEMPRE la información real del contexto del usuario para dar respuestas personalizadas y específicas. 
- Si el usuario pregunta sobre gastos, saldos, transacciones, o cuentas específicas, calcula y proporciona los números exactos basados en los datos reales que tienes disponibles. NO digas "puedes revisar" - proporciona la información directamente.
- Si hay transacciones sin categorizar, ayuda al usuario sugiriendo categorías apropiadas basándote en el nombre del comercio (payee) y el monto de la transacción.
- Puedes ayudar a identificar patrones de gasto y sugerir reglas de categorización automática.

Proporciona respuestas útiles, concisas y accionables. Cuando sea relevante, sugiere acciones específicas como:
- Crear transacciones en cuentas específicas
- Ajustar presupuestos por categoría
- Crear reglas de categorización para comercios específicos
- Generar reportes personalizados
- Clasificar transacciones sin categorizar

Mantén un tono amigable y profesional.`;
}

// Función auxiliar para obtener el nombre de una categoría por su ID
function getCategoryName(categoryId, categories) {
  if (!categories) return categoryId;

  if (Array.isArray(categories)) {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : categoryId;
  } else {
    const category = categories[categoryId];
    return category ? category.name : categoryId;
  }
}// Función para obtener respuesta del modelo configurado
async function getAIResponse(prompt, context) {
  const llmProvider = process.env.LLM_PROVIDER || 'openrouter';
  try {
    switch (llmProvider) {
      case 'ollama':
        return await getOllamaResponse(prompt, context);
      case 'openrouter':
        return await getOpenRouterResponse(prompt, context);
      default:
        throw new Error(`Unsupported LLM provider: ${llmProvider} `);
    }
  } catch (error) {
    console.error(`Error with ${llmProvider}: `, error.message);
    return 'Lo siento, no pude procesar tu consulta en este momento. Por favor intenta de nuevo más tarde.';
  }
}

// Función para Ollama
async function getOllamaResponse(prompt, context) {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'https://ollama.heima.casa:443';
  const model = process.env.OLLAMA_MODEL || 'qwen3:4b-q4_K_M';
  const apiKey = process.env.OLLAMA_API_KEY;
  const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'Eres un asistente financiero experto que ayuda con Actual Budget.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status} ${response.statusText} `);
  }

  const data = await response.json();
  let content = data.choices[0].message.content;
  if (model.includes('qwen3')) {
    content = content.replace(/<think>.*?<\/think>/gs, '').trim();
  }
  return content || 'No pude generar una respuesta apropiada.';
}

// Función para OpenRouter (fallback)
async function getOpenRouterResponse(prompt, context) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured');
  }
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey} `,
      'HTTP-Referer': 'http://localhost:3001',
      'X-Title': 'Actual Budget AI Assistant'
    },
    body: JSON.stringify({
      model: 'mistralai/mistral-7b-instruct:free',
      messages: [
        { role: 'system', content: 'Eres un asistente financiero experto que ayuda con Actual Budget.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 800
    })
  });
  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} `);
  }
  const data = await response.json();
  return data.choices[0].message.content || 'No pude generar una respuesta apropiada.';
}

// Extraer acciones sugeridas de la respuesta
function extractActionsFromResponse(response) {
  const actions = [];

  // Detectar patrones de acciones en la respuesta
  if (response.includes('crear transacción') || response.includes('create transaction')) {
    actions.push({
      type: 'create_transaction',
      title: 'Crear Transacción',
      description: 'Crear una nueva transacción basada en la conversación',
      parameters: {}
    });
  }

  if (response.includes('ajustar presupuesto') || response.includes('adjust budget')) {
    actions.push({
      type: 'adjust_budget',
      title: 'Ajustar Presupuesto',
      description: 'Modificar el presupuesto de una categoría',
      parameters: {}
    });
  }

  if (response.includes('crear regla') || response.includes('create rule')) {
    actions.push({
      type: 'create_rule',
      title: 'Crear Regla',
      description: 'Crear una regla de categorización automática',
      parameters: {}
    });
  }

  return actions;
}

// Health check endpoint
app.get('/api/ai/chat/health', (req, res) => {
  res.json({ status: 'healthy', service: 'actual-ai-chat' });
});

// Puerto configurado
const PORT = process.env.CHAT_PORT || 3002;
app.listen(PORT, () => {
  console.log(`✅ Actual AI Chat Extension running on port ${PORT}`);
  console.log(`📍 Chat endpoint: http://localhost:${PORT}/api/ai/chat`);
});

module.exports = app;
