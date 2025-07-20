// Extensión para actual-ai - Servidor de chat financiero con capacidades avanzadas
require('dotenv').config({ path: '.env.ai' });

const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');

// Importar la API de Actual Budget para funciones avanzadas
let actualAPI;
let apiAvailable = false;
try {
    // Intentar cargar la API compilada del bundle
    actualAPI = require('./packages/api/app/bundle.api.js');
    apiAvailable = true;
    console.log('✅ API de Actual Budget cargada desde el bundle compilado');
} catch (error) {
    try {
        // Fallback a index
        actualAPI = require('./packages/api');
        apiAvailable = true;
        console.log('✅ API de Actual Budget cargada desde index');
    } catch (error2) {
        try {
            // Fallback a npm
            actualAPI = require('@actual-app/api');
            apiAvailable = true;
            console.log('✅ API de Actual Budget cargada desde npm');
        } catch (error3) {
            console.warn('⚠️ @actual-app/api no está disponible. Funcionalidades de creación deshabilitadas.');
            console.warn('Errores:', error.message, error2.message, error3.message);
            apiAvailable = false;
        }
    }
}

// Configuración de Express
const app = express();
app.use(cors());
app.use(bodyParser.json());

// ==========================================
// FUNCIONES HELPER PARA API
// ==========================================

async function createCategoryIfNeeded(categoryName, groupId) {
    if (!apiAvailable) {
        return { success: false, error: 'API no disponible' };
    }

    try {
        console.log(`🏗️ Creando categoría: ${categoryName} en grupo ${groupId}`);
        const categoryId = await actualAPI.createCategory({
            name: categoryName,
            group_id: groupId
        });
        console.log(`✅ Categoría creada: ${categoryName} (${categoryId})`);
        return { success: true, categoryId, name: categoryName };
    } catch (error) {
        console.error('❌ Error creando categoría:', error);
        return { success: false, error: error.message };
    }
}

async function createCategoryGroupIfNeeded(groupName) {
    if (!apiAvailable) {
        return { success: false, error: 'API no disponible' };
    }

    try {
        console.log(`🏗️ Creando grupo de categorías: ${groupName}`);
        const groupId = await actualAPI.createCategoryGroup({
            name: groupName,
            is_income: false
        });
        console.log(`✅ Grupo creado: ${groupName} (${groupId})`);
        return { success: true, groupId, name: groupName };
    } catch (error) {
        console.error('❌ Error creando grupo:', error);
        return { success: false, error: error.message };
    }
}

async function createAutoCategorizationRule(payeeName, categoryId) {
    if (!apiAvailable) {
        return { success: false, error: 'API no disponible' };
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
        return { success: true, rule, payee: payeeName, categoryId };
    } catch (error) {
        console.error('❌ Error creando regla:', error);
        return { success: false, error: error.message };
    }
}

async function bulkCategorizeTransactions(transactionUpdates) {
    if (!apiAvailable) {
        return { success: false, error: 'API no disponible' };
    }

    const results = { success: 0, failed: 0, errors: [] };

    try {
        await actualAPI.batchBudgetUpdates(async () => {
            for (const update of transactionUpdates) {
                try {
                    await actualAPI.updateTransaction(update.id, { category: update.categoryId });
                    results.success++;
                    console.log(`✅ Transacción ${update.id} categorizada como ${update.categoryId}`);
                } catch (error) {
                    results.failed++;
                    results.errors.push({ transactionId: update.id, error: error.message });
                    console.error(`❌ Error actualizando transacción ${update.id}:`, error);
                }
            }
        });

        return {
            success: true,
            results,
            message: `Categorizadas ${results.success} transacciones, ${results.failed} errores`
        };
    } catch (error) {
        console.error('❌ Error en categorización masiva:', error);
        return { success: false, error: error.message };
    }
}

async function analyzeTransactionPatterns(transactions) {
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

// ==========================================
// ENDPOINTS BÁSICOS
// ==========================================

// Health check
app.get('/api/ai/chat/health', (req, res) => {
    res.json({ status: 'healthy', service: 'actual-ai-chat', apiAvailable });
});

// Endpoint de capacidades
app.get('/api/ai/capabilities', (req, res) => {
    res.json({
        apiAvailable,
        features: {
            chat: true,
            createCategories: apiAvailable,
            createGroups: apiAvailable,
            createRules: apiAvailable,
            bulkCategorize: apiAvailable,
            patternAnalysis: true,
            transactionAnalysis: true
        },
        endpoints: {
            '/api/ai/chat': 'Chat financiero inteligente',
            '/api/ai/create-category': 'Crear categorías automáticamente',
            '/api/ai/create-category-group': 'Crear grupos de categorías',
            '/api/ai/create-rule': 'Crear reglas de categorización automática',
            '/api/ai/bulk-categorize': 'Categorización masiva de transacciones',
            '/api/ai/analyze-patterns': 'Análisis inteligente de patrones y sugerencias',
            '/api/ai/capabilities': 'Obtener capacidades disponibles'
        },
        status: apiAvailable ? '✅ Todas las funcionalidades avanzadas disponibles' : '⚠️ Solo funcionalidades básicas'
    });
});

// ==========================================
// ENDPOINTS AVANZADOS
// ==========================================

// Crear categoría
app.post('/api/ai/create-category', async (req, res) => {
    try {
        const { name, groupId } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Category name is required' });
        }

        const result = await createCategoryIfNeeded(name, groupId);

        if (result.success) {
            res.json({
                success: true,
                category: result,
                message: `Categoría "${name}" creada exitosamente`
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error,
                message: `Error creando categoría "${name}"`
            });
        }

    } catch (error) {
        console.error('Create category endpoint error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Crear grupo de categorías
app.post('/api/ai/create-category-group', async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Group name is required' });
        }

        const result = await createCategoryGroupIfNeeded(name);

        if (result.success) {
            res.json({
                success: true,
                group: result,
                message: `Grupo "${name}" creado exitosamente`
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error,
                message: `Error creando grupo "${name}"`
            });
        }

    } catch (error) {
        console.error('Create group endpoint error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Crear regla automática
app.post('/api/ai/create-rule', async (req, res) => {
    try {
        const { payeeName, categoryId } = req.body;

        if (!payeeName || !categoryId) {
            return res.status(400).json({ error: 'Payee name and category ID are required' });
        }

        const result = await createAutoCategorizationRule(payeeName, categoryId);

        if (result.success) {
            res.json({
                success: true,
                rule: result,
                message: `Regla creada: ${payeeName} → categoría ${categoryId}`
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error,
                message: `Error creando regla para ${payeeName}`
            });
        }

    } catch (error) {
        console.error('Create rule endpoint error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Categorización masiva
app.post('/api/ai/bulk-categorize', async (req, res) => {
    try {
        const { transactionUpdates } = req.body;

        if (!transactionUpdates || !Array.isArray(transactionUpdates)) {
            return res.status(400).json({ error: 'Transaction updates array is required' });
        }

        const result = await bulkCategorizeTransactions(transactionUpdates);

        if (result.success) {
            res.json({
                success: true,
                results: result.results,
                message: result.message
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error,
                message: `Error en categorización masiva`
            });
        }

    } catch (error) {
        console.error('Bulk categorize endpoint error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Análisis inteligente de patrones
app.post('/api/ai/analyze-patterns', async (req, res) => {
    try {
        const { transactions, createMissingCategories = false } = req.body;

        if (!transactions || !Array.isArray(transactions)) {
            return res.status(400).json({ error: 'Transactions array is required' });
        }

        console.log(`🔍 Analizando patrones en ${transactions.length} transacciones...`);

        // Analizar patrones
        const patterns = await analyzeTransactionPatterns(transactions);

        // Preparar sugerencias
        const suggestions = {
            categories: [],
            rules: [],
            actions: []
        };

        // Categorías sugeridas
        Object.entries(patterns).forEach(([payee, data]) => {
            if (data.suggestedCategory && data.count >= 2) {
                suggestions.categories.push({
                    payee,
                    suggestedCategory: data.suggestedCategory,
                    frequency: data.count,
                    avgAmount: data.avgAmount,
                    isRecurring: data.isRecurring
                });

                // Sugerir regla automática si es recurrente
                if (data.isRecurring) {
                    suggestions.rules.push({
                        payee,
                        category: data.suggestedCategory,
                        reason: `Transacción recurrente (${data.count} veces)`,
                        confidence: data.count >= 5 ? 'high' : 'medium'
                    });
                }
            }
        });

        // Si se requiere, crear categorías faltantes
        if (createMissingCategories && apiAvailable) {
            const categoryCreations = [];
            const uniqueCategories = [...new Set(suggestions.categories.map(s => s.suggestedCategory))];

            try {
                const groups = await actualAPI.getCategoryGroups?.() || [];
                const defaultGroupId = groups.find(g => g.name === 'General')?.id || groups[0]?.id;

                for (const categoryName of uniqueCategories) {
                    const result = await createCategoryIfNeeded(categoryName, defaultGroupId);
                    categoryCreations.push({
                        name: categoryName,
                        created: result.success,
                        categoryId: result.categoryId,
                        error: result.error
                    });
                }

                suggestions.actions.push({
                    type: 'categories_created',
                    results: categoryCreations
                });
            } catch (error) {
                console.error('Error creating missing categories:', error);
            }
        }

        res.json({
            success: true,
            analysis: {
                totalTransactions: transactions.length,
                patternsFound: Object.keys(patterns).length,
                suggestions,
                patterns: Object.entries(patterns).slice(0, 10).map(([payee, data]) => ({
                    payee,
                    ...data
                }))
            },
            capabilities: {
                apiAvailable,
                canCreateCategories: apiAvailable,
                canCreateRules: apiAvailable,
                canBulkCategorize: apiAvailable
            }
        });

    } catch (error) {
        console.error('Pattern analysis endpoint error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Test endpoint para verificar conectividad de API
app.get('/api/ai/test-api', async (req, res) => {
    try {
        if (!apiAvailable) {
            return res.json({
                available: false,
                error: 'API no disponible'
            });
        }

        // Intentar operación básica de la API
        const accounts = await actualAPI.getAccounts();
        res.json({
            available: true,
            accountsCount: accounts ? accounts.length : 0,
            message: 'API funcionando correctamente'
        });

    } catch (error) {
        res.json({
            available: false,
            error: error.message,
            message: 'Error al acceder a la API'
        });
    }
});

// Iniciar servidor
const PORT = process.env.CHAT_PORT || 3002;
app.listen(PORT, () => {
    console.log(`✅ Actual AI Chat Extension running on port ${PORT}`);
    console.log(`📍 Endpoints disponibles:`);
    console.log(`   - http://localhost:${PORT}/api/ai/chat/health`);
    console.log(`   - http://localhost:${PORT}/api/ai/capabilities`);
    console.log(`   - http://localhost:${PORT}/api/ai/test-api`);
    if (apiAvailable) {
        console.log(`   ✨ CAPACIDADES AVANZADAS:`);
        console.log(`     - http://localhost:${PORT}/api/ai/create-category`);
        console.log(`     - http://localhost:${PORT}/api/ai/create-category-group`);
        console.log(`     - http://localhost:${PORT}/api/ai/create-rule`);
        console.log(`     - http://localhost:${PORT}/api/ai/bulk-categorize`);
        console.log(`     - http://localhost:${PORT}/api/ai/analyze-patterns`);
    }
});

module.exports = app;
