# 📋 GUÍA TÉCNICA: ENDPOINTS API DE ACTUAL BUDGET

**Fecha:** 22 de julio de 2025  
**Estado:** DOCUMENTACIÓN TÉCNICA  
**Audiencia:** Desarrolladores, arquitectos de software

## 🎯 PROPÓSITO

Esta guía proporciona documentación técnica detallada de todos los endpoints de la API de Actual Budget, incluyendo ejemplos prácticos, casos de uso y patrones de implementación para el chatbot agente financiero.

---

## 🔄 NAVEGACIÓN DEL WORKFLOW

### **📋 ORIGEN DE ESTE PLAN**

Generado desde: [PLAN MAESTRO API](./ACTUAL_BUDGET_API_MASTER_PLAN.md)

### **🔄 PLANES RELACIONADOS**

- [Plan de Implementación](./PLAN_IMPLEMENTACION_API_FUNCIONALIDADES.md) - Desarrollo específico
- [Plan de Automatización](./PLAN_AUTOMATIZACION_INTELIGENTE.md) - IA y ML
- [Roadmap Avanzado](./ROADMAP_FUNCIONALIDADES_AVANZADAS.md) - Futuras funcionalidades

### **🚨 IMPORTANTE: REFERENCIA TÉCNICA**

Este documento es de consulta técnica. No proceder con implementación sin revisar el plan de implementación correspondiente.

---

## 📊 **1. GESTIÓN DE PRESUPUESTO**

### **Endpoints Disponibles:**

#### `getBudgetMonths()`

```javascript
// Obtener todos los meses disponibles del presupuesto
const months = await getBudgetMonths();
// Retorna: Promise<month[]>
// Ejemplo: ['2024-01', '2024-02', '2024-03']
```

#### `getBudgetMonth(month)`

```javascript
// Obtener datos completos de un mes específico
const budget = await getBudgetMonth('2024-07');
// Retorna: Promise<Budget>
// Estructura: { categories: [...], income: [...], expenses: [...] }
```

#### `setBudgetAmount(month, categoryId, amount)`

```javascript
// Establecer cantidad presupuestada para una categoría
await setBudgetAmount('2024-07', 'cat-food-id', 50000); // $500.00
// Retorna: Promise<null>
```

#### `setBudgetCarryover(month, categoryId, flag)`

```javascript
// Configurar transferencia de saldo entre meses
await setBudgetCarryover('2024-07', 'cat-emergency-id', true);
// Retorna: Promise<null>
```

#### `holdBudgetForNextMonth(month, amount)`

```javascript
// Reservar dinero para el siguiente mes
await holdBudgetForNextMonth('2024-07', 25000); // $250.00
// Retorna: Promise<null>
```

#### `resetBudgetHold(month)`

```javascript
// Resetear reservas del mes
await resetBudgetHold('2024-07');
// Retorna: Promise<null>
```

### **Casos de Uso para el Chatbot:**

```javascript
// Análisis de presupuesto mensual
async function analyzeBudgetPerformance(month) {
  const budget = await getBudgetMonth(month);
  const analysis = {
    totalBudgeted: 0,
    totalSpent: 0,
    categoriesOverBudget: [],
    categoriesUnderBudget: [],
    recommendations: [],
  };

  budget.categories.forEach(category => {
    analysis.totalBudgeted += category.budgeted || 0;
    analysis.totalSpent += Math.abs(category.spent || 0);

    const variance = (category.spent || 0) + (category.budgeted || 0);
    if (variance < 0) {
      analysis.categoriesOverBudget.push({
        name: category.name,
        budgeted: category.budgeted,
        spent: Math.abs(category.spent),
        overage: Math.abs(variance),
      });
    }
  });

  return analysis;
}

// Optimización automática de presupuesto
async function optimizeBudget(month, userGoals) {
  const currentBudget = await getBudgetMonth(month);
  const previousMonth = await getBudgetMonth(getPreviousMonth(month));

  const optimizations = analyzeSpendingPatterns(currentBudget, previousMonth);

  // Aplicar optimizaciones automáticamente
  for (const optimization of optimizations) {
    await setBudgetAmount(
      month,
      optimization.categoryId,
      optimization.suggestedAmount,
    );
  }

  return optimizations;
}
```

---

## 🏷️ **2. CATEGORÍAS Y GRUPOS**

### **Endpoints Disponibles:**

#### `getCategories()`

```javascript
// Obtener todas las categorías
const categories = await getCategories();
// Retorna: Promise<Category[]>
// Estructura: [{ id, name, group_id, is_income }]
```

#### `getCategoryGroups()`

```javascript
// Obtener grupos de categorías
const groups = await getCategoryGroups();
// Retorna: Promise<CategoryGroup[]>
// Estructura: [{ id, name, is_income, categories: [...] }]
```

#### `createCategory(category)`

```javascript
// Crear nueva categoría
const newCategory = await createCategory({
  name: 'Inversiones Crypto',
  group_id: 'investment-group-id',
});
// Retorna: Promise<id>
```

#### `createCategoryGroup(group)`

```javascript
// Crear nuevo grupo de categorías
const newGroup = await createCategoryGroup({
  name: 'Nuevas Inversiones',
});
// Retorna: Promise<id>
```

#### `updateCategory(id, fields)`

```javascript
// Actualizar categoría existente
await updateCategory('category-id', {
  name: 'Comida y Bebidas',
  group_id: 'daily-expenses-group',
});
// Retorna: Promise<null>
```

#### `deleteCategory(id)`

```javascript
// Eliminar categoría
await deleteCategory('unused-category-id');
// Retorna: Promise<null>
```

### **Casos de Uso para el Chatbot:**

```javascript
// Organización inteligente de categorías
async function organizeCategories() {
  const categories = await getCategories();
  const groups = await getCategoryGroups();

  // Análisis de uso de categorías
  const categoryUsage = await analyzeCategoryUsage(categories);

  const recommendations = {
    unused: categoryUsage.filter(cat => cat.transactionCount === 0),
    underused: categoryUsage.filter(cat => cat.transactionCount < 3),
    popular: categoryUsage.filter(cat => cat.transactionCount > 50),
    suggested: await suggestNewCategories(categoryUsage),
  };

  return recommendations;
}

// Creación automática basada en patrones
async function autoCreateCategory(transactionPattern) {
  const suggestedName = generateCategoryName(transactionPattern);
  const appropriateGroup = await findBestGroup(suggestedName);

  const newCategoryId = await createCategory({
    name: suggestedName,
    group_id: appropriateGroup.id,
  });

  // Crear regla automática para futuras transacciones
  await createAutoCategorizationRule(transactionPattern.payee, newCategoryId);

  return newCategoryId;
}
```

---

## 💳 **3. TRANSACCIONES**

### **Endpoints Disponibles:**

#### `getTransactions(accountId, startDate, endDate)`

```javascript
// Obtener transacciones por cuenta y rango de fechas
const transactions = await getTransactions(
  'account-id',
  '2024-07-01',
  '2024-07-31',
);
// Retorna: Promise<Transaction[]>
```

#### `addTransactions(accountId, transactions, options)`

```javascript
// Agregar múltiples transacciones
const newTransactionIds = await addTransactions(
  'account-id',
  [
    {
      date: '2024-07-22',
      amount: -2500, // $25.00 gasto
      payee_name: 'Starbucks',
      category: 'food-category-id',
    },
  ],
  { runTransfers: true, learnCategories: true },
);
// Retorna: Promise<id[]>
```

#### `importTransactions(accountId, transactions)`

```javascript
// Importar con reconciliación automática
const result = await importTransactions('account-id', transactions);
// Retorna: Promise<{ errors, added, updated }>
```

#### `updateTransaction(id, fields)`

```javascript
// Actualizar transacción existente
await updateTransaction('transaction-id', {
  category: 'new-category-id',
  notes: 'Categorización automática por IA',
});
// Retorna: Promise<null>
```

#### `deleteTransaction(id)`

```javascript
// Eliminar transacción
await deleteTransaction('transaction-id');
// Retorna: Promise<null>
```

### **Casos de Uso con ActualQL:**

```javascript
// Análisis de patrones de gasto por comercio
async function analyzeSpendingPatterns() {
  const { data } = await runQuery(
    q('transactions')
      .filter({
        date: { $gte: '2024-01-01' },
        amount: { $lt: 0 }, // Solo gastos
      })
      .groupBy('payee.name')
      .select([
        'payee.name',
        { total: { $sum: 'amount' } },
        { count: { $count: '*' } },
        { avg: { $avg: 'amount' } },
      ])
      .orderBy({ total: 'asc' }), // Más gastos primero
  );

  return data.map(payee => ({
    name: payee['payee.name'],
    totalSpent: Math.abs(payee.total / 100), // Convertir de centavos
    frequency: payee.count,
    avgAmount: Math.abs(payee.avg / 100),
    isRecurring: payee.count >= 3,
  }));
}

// Detección de transacciones anómalas
async function detectAnomalousTransactions() {
  const { data } = await runQuery(
    q('transactions')
      .filter({
        date: { $gte: getDateXMonthsAgo(3) },
        amount: { $lt: 0 },
      })
      .select('*'),
  );

  const anomalies = [];

  // Agrupar por payee para análisis estadístico
  const payeeGroups = groupBy(data, 'payee_id');

  Object.entries(payeeGroups).forEach(([payeeId, transactions]) => {
    if (transactions.length < 3) return;

    const amounts = transactions.map(t => Math.abs(t.amount));
    const mean = amounts.reduce((a, b) => a + b) / amounts.length;
    const stdDev = calculateStandardDeviation(amounts, mean);

    transactions.forEach(transaction => {
      const amount = Math.abs(transaction.amount);
      const zScore = Math.abs((amount - mean) / stdDev);

      if (zScore > 2.5) {
        // Anomalía si está fuera de 2.5 desviaciones estándar
        anomalies.push({
          transaction,
          reason: 'Monto inusual para este comercio',
          zScore,
          meanAmount: mean / 100,
          actualAmount: amount / 100,
        });
      }
    });
  });

  return anomalies;
}

// Búsqueda inteligente de transacciones
async function smartTransactionSearch(query) {
  const searchTerms = query.toLowerCase().split(' ');

  const { data } = await runQuery(
    q('transactions')
      .filter({
        $or: [
          { 'payee.name': { $like: `%${query}%` } },
          { notes: { $like: `%${query}%` } },
          { 'category.name': { $like: `%${query}%` } },
        ],
      })
      .select([
        'id',
        'date',
        'amount',
        'payee.name',
        'category.name',
        'notes',
        'account.name',
      ])
      .orderBy({ date: 'desc' }),
  );

  // Scoring basado en relevancia
  return data
    .map(transaction => {
      let score = 0;
      const payeeName = transaction['payee.name']?.toLowerCase() || '';
      const notes = transaction.notes?.toLowerCase() || '';
      const categoryName = transaction['category.name']?.toLowerCase() || '';

      searchTerms.forEach(term => {
        if (payeeName.includes(term)) score += 3;
        if (categoryName.includes(term)) score += 2;
        if (notes.includes(term)) score += 1;
      });

      return { ...transaction, relevanceScore: score };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}
```

---

## 🏦 **4. CUENTAS**

### **Endpoints Disponibles:**

#### `getAccounts()`

```javascript
// Obtener todas las cuentas
const accounts = await getAccounts();
// Retorna: Promise<Account[]>
// Estructura: [{ id, name, type, offbudget, closed }]
```

#### `createAccount(account, initialBalance)`

```javascript
// Crear nueva cuenta
const accountId = await createAccount(
  {
    name: 'Cuenta Ahorros Emergencia',
    type: 'savings',
    offbudget: false,
  },
  100000,
); // $1,000.00 balance inicial
// Retorna: Promise<id>
```

#### `updateAccount(id, fields)`

```javascript
// Actualizar información de cuenta
await updateAccount('account-id', {
  name: 'Cuenta Corriente Principal',
  type: 'checking',
});
// Retorna: Promise<null>
```

#### `getAccountBalance(id, cutoff)`

```javascript
// Obtener balance de cuenta
const balance = await getAccountBalance('account-id', '2024-07-22');
// Retorna: Promise<number> (en centavos)
```

#### `closeAccount(id, transferAccountId, transferCategoryId)`

```javascript
// Cerrar cuenta con transferencia de fondos
await closeAccount('old-account-id', 'new-account-id', 'transfer-category-id');
// Retorna: Promise<null>
```

### **Casos de Uso para el Chatbot:**

```javascript
// Monitoreo inteligente de cuentas
async function monitorAccounts() {
  const accounts = await getAccounts();
  const alerts = [];

  for (const account of accounts.filter(acc => !acc.closed)) {
    const balance = await getAccountBalance(account.id);
    const balanceUSD = balance / 100;

    // Detectar saldos bajos
    if (account.type === 'checking' && balanceUSD < 100) {
      alerts.push({
        type: 'LOW_BALANCE',
        account: account.name,
        balance: balanceUSD,
        message: `Saldo bajo en ${account.name}: $${balanceUSD.toFixed(2)}`,
      });
    }

    // Detectar cuentas inactivas
    const recentTransactions = await getTransactions(
      account.id,
      getDateXDaysAgo(30),
      new Date().toISOString().split('T')[0],
    );

    if (recentTransactions.length === 0) {
      alerts.push({
        type: 'INACTIVE_ACCOUNT',
        account: account.name,
        message: `${account.name} no ha tenido actividad en 30 días`,
      });
    }
  }

  return alerts;
}

// Análisis de flujo de efectivo
async function analyzeCashFlow(timeframe = 90) {
  const accounts = await getAccounts();
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = getDateXDaysAgo(timeframe);

  const cashFlowAnalysis = {
    totalInflow: 0,
    totalOutflow: 0,
    netFlow: 0,
    accountFlows: [],
    predictions: {},
  };

  for (const account of accounts.filter(acc => !acc.offbudget && !acc.closed)) {
    const transactions = await getTransactions(account.id, startDate, endDate);

    const inflow = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const outflow = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    cashFlowAnalysis.accountFlows.push({
      account: account.name,
      inflow: inflow / 100,
      outflow: outflow / 100,
      netFlow: (inflow - outflow) / 100,
    });

    cashFlowAnalysis.totalInflow += inflow;
    cashFlowAnalysis.totalOutflow += outflow;
  }

  cashFlowAnalysis.totalInflow /= 100;
  cashFlowAnalysis.totalOutflow /= 100;
  cashFlowAnalysis.netFlow =
    cashFlowAnalysis.totalInflow - cashFlowAnalysis.totalOutflow;

  // Predicciones simples basadas en tendencia
  const monthlyNetFlow = cashFlowAnalysis.netFlow / (timeframe / 30);
  cashFlowAnalysis.predictions = {
    nextMonth: monthlyNetFlow,
    nextQuarter: monthlyNetFlow * 3,
    nextYear: monthlyNetFlow * 12,
  };

  return cashFlowAnalysis;
}
```

---

## 👥 **5. BENEFICIARIOS (PAYEES)**

### **Endpoints Disponibles:**

#### `getPayees()`

```javascript
// Obtener todos los beneficiarios
const payees = await getPayees();
// Retorna: Promise<Payee[]>
// Estructura: [{ id, name, category, transfer_acct }]
```

#### `createPayee(payee)`

```javascript
// Crear nuevo beneficiario
const payeeId = await createPayee({
  name: 'Netflix Streaming',
  category: 'entertainment-category-id',
});
// Retorna: Promise<id>
```

#### `updatePayee(id, fields)`

```javascript
// Actualizar beneficiario
await updatePayee('payee-id', {
  name: 'Netflix Premium',
  category: 'new-category-id',
});
// Retorna: Promise<id>
```

#### `mergePayees(targetId, mergeIds)`

```javascript
// Fusionar beneficiarios duplicados
await mergePayees('netflix-main-id', [
  'netflix-duplicate-1',
  'netflix-duplicate-2',
]);
// Retorna: Promise<null>
```

### **Casos de Uso para el Chatbot:**

```javascript
// Detección y fusión automática de duplicados
async function detectDuplicatePayees() {
  const payees = await getPayees();
  const duplicates = [];

  // Algoritmo de similitud para detectar duplicados
  for (let i = 0; i < payees.length; i++) {
    for (let j = i + 1; j < payees.length; j++) {
      const similarity = calculateNameSimilarity(
        payees[i].name,
        payees[j].name,
      );

      if (similarity > 0.8) {
        // 80% similar
        duplicates.push({
          primary: payees[i],
          duplicate: payees[j],
          similarity,
          suggestion: 'merge',
        });
      }
    }
  }

  return duplicates;
}

// Análisis de frecuencia y gastos por beneficiario
async function analyzePayeeSpending() {
  const { data } = await runQuery(
    q('transactions')
      .filter({
        date: { $gte: getDateXMonthsAgo(12) },
        amount: { $lt: 0 },
      })
      .groupBy('payee.name')
      .select([
        'payee.name',
        'payee.category',
        { totalSpent: { $sum: 'amount' } },
        { frequency: { $count: '*' } },
        { avgAmount: { $avg: 'amount' } },
        { lastTransaction: { $max: 'date' } },
      ])
      .orderBy({ totalSpent: 'asc' }),
  );

  return data.map(payee => ({
    name: payee['payee.name'],
    category: payee['payee.category'],
    totalSpent: Math.abs(payee.totalSpent / 100),
    frequency: payee.frequency,
    avgAmount: Math.abs(payee.avgAmount / 100),
    lastTransaction: payee.lastTransaction,
    isRecurring: payee.frequency > 6, // Más de 6 transacciones en el año
    monthlyAverage: Math.abs(payee.totalSpent / 100) / 12,
  }));
}
```

---

## ⚙️ **6. REGLAS Y AUTOMATIZACIÓN**

### **Endpoints Disponibles:**

#### `getRules()`

```javascript
// Obtener todas las reglas
const rules = await getRules();
// Retorna: Promise<Rule[]>
```

#### `getPayeeRules(payeeId)`

```javascript
// Obtener reglas específicas de un beneficiario
const payeeRules = await getPayeeRules('payee-id');
// Retorna: Promise<PayeeRule[]>
```

#### `createRule(rule)`

```javascript
// Crear nueva regla
const newRule = await createRule({
  stage: 'pre',
  conditionsOp: 'and',
  conditions: [{ field: 'payee', op: 'is', value: 'Starbucks' }],
  actions: [{ op: 'set', field: 'category', value: 'food-category-id' }],
});
// Retorna: Promise<Rule>
```

#### `updateRule(id, fields)`

```javascript
// Actualizar regla existente
await updateRule('rule-id', {
  conditions: [
    { field: 'payee', op: 'contains', value: 'Starbucks' },
    { field: 'amount', op: 'lte', value: -1000 }, // Máximo $10.00
  ],
});
// Retorna: Promise<Rule>
```

### **Casos de Uso para el Chatbot:**

```javascript
// Creación automática de reglas basada en patrones
async function createSmartRules() {
  const patterns = await analyzeTransactionPatterns();
  const newRules = [];

  for (const pattern of patterns.suggestions.categories) {
    if (pattern.frequency >= 3 && !(await ruleExistsForPayee(pattern.payee))) {
      const rule = await createRule({
        stage: 'pre',
        conditionsOp: 'and',
        conditions: [{ field: 'payee', op: 'contains', value: pattern.payee }],
        actions: [
          { op: 'set', field: 'category', value: pattern.suggestedCategoryId },
        ],
      });

      newRules.push({
        rule,
        pattern,
        message: `Regla creada: ${pattern.payee} → ${pattern.suggestedCategory}`,
      });
    }
  }

  return newRules;
}

// Optimización de reglas existentes
async function optimizeExistingRules() {
  const rules = await getRules();
  const optimizations = [];

  for (const rule of rules) {
    // Analizar efectividad de la regla
    const effectiveness = await analyzeRuleEffectiveness(rule);

    if (effectiveness.matches === 0) {
      optimizations.push({
        rule,
        suggestion: 'DELETE',
        reason: 'Regla nunca utilizada',
      });
    } else if (effectiveness.falsePositives > effectiveness.matches * 0.2) {
      optimizations.push({
        rule,
        suggestion: 'REFINE',
        reason: 'Demasiados falsos positivos',
        refinement: suggestRuleRefinement(rule, effectiveness),
      });
    }
  }

  return optimizations;
}
```

---

## 🔍 **7. ACTUALQL - CONSULTAS AVANZADAS**

### **Sintaxis y Operadores:**

#### **Operadores de Comparación:**

```javascript
// Operadores disponibles
$eq; // Igual a
$ne; // No igual a
$lt; // Menor que
$lte; // Menor o igual que
$gt; // Mayor que
$gte; // Mayor o igual que
$like; // Contiene texto (SQL LIKE)
$regex; // Expresión regular
$oneof; // Uno de los valores del array
```

#### **Operadores Lógicos:**

```javascript
// Combinaciones lógicas
$and: [condition1, condition2]; // Y lógico
$or: [condition1, condition2]; // O lógico
```

#### **Funciones de Transformación:**

```javascript
// Funciones de fecha
$month   // Extraer mes: '2024-07'
$year    // Extraer año: '2024'
$date    // Formatear fecha

// Uso con $transform
{ date: { $transform: '$month', $eq: '2024-07' }}
```

### **Ejemplos Avanzados:**

#### **Dashboard de Gastos Mensuales:**

```javascript
async function generateMonthlyDashboard(year = '2024') {
  const monthlyData = await runQuery(
    q('transactions')
      .filter({
        date: { $transform: '$year', $eq: year },
        amount: { $lt: 0 },
      })
      .groupBy({ month: { $transform: '$month', field: 'date' } })
      .select([
        'month',
        { totalSpent: { $sum: 'amount' } },
        { transactionCount: { $count: '*' } },
        { avgTransaction: { $avg: 'amount' } },
      ])
      .orderBy('month'),
  );

  return monthlyData.data.map(month => ({
    month: month.month,
    totalSpent: Math.abs(month.totalSpent / 100),
    transactionCount: month.transactionCount,
    avgTransaction: Math.abs(month.avgTransaction / 100),
  }));
}
```

#### **Análisis de Categorías por Trimestre:**

```javascript
async function quarterlyCategoryAnalysis(year = '2024') {
  const { data } = await runQuery(
    q('transactions')
      .filter({
        date: { $transform: '$year', $eq: year },
        amount: { $lt: 0 },
        'category.name': { $ne: null },
      })
      .groupBy([
        'category.name',
        { quarter: { $transform: '$quarter', field: 'date' } },
      ])
      .select([
        'category.name',
        'quarter',
        { spending: { $sum: 'amount' } },
        { count: { $count: '*' } },
      ])
      .orderBy(['quarter', { spending: 'asc' }]),
  );

  // Transformar datos para análisis de tendencias
  const categoryTrends = {};
  data.forEach(row => {
    const category = row['category.name'];
    if (!categoryTrends[category]) {
      categoryTrends[category] = {};
    }
    categoryTrends[category][`Q${row.quarter}`] = {
      spending: Math.abs(row.spending / 100),
      count: row.count,
    };
  });

  return categoryTrends;
}
```

#### **Detección de Gastos Inusuales:**

```javascript
async function detectUnusualSpending(thresholdMultiplier = 2.5) {
  // Primero obtener estadísticas históricas por payee
  const { data: payeeStats } = await runQuery(
    q('transactions')
      .filter({
        date: { $gte: getDateXMonthsAgo(6) },
        amount: { $lt: 0 },
      })
      .groupBy('payee.name')
      .select([
        'payee.name',
        { avgAmount: { $avg: 'amount' } },
        { stdDev: { $stddev: 'amount' } },
        { count: { $count: '*' } },
      ])
      .having({ count: { $gte: 5 } }), // Solo payees con suficiente historial
  );

  // Luego buscar transacciones recientes que sean inusuales
  const recentTransactions = await runQuery(
    q('transactions')
      .filter({
        date: { $gte: getDateXDaysAgo(30) },
        amount: { $lt: 0 },
      })
      .select('*'),
  );

  const unusualTransactions = [];

  recentTransactions.data.forEach(transaction => {
    const payeeStat = payeeStats.data.find(
      stat => stat['payee.name'] === transaction.payee_name,
    );

    if (payeeStat) {
      const zScore = Math.abs(
        (Math.abs(transaction.amount) - Math.abs(payeeStat.avgAmount)) /
          Math.abs(payeeStat.stdDev),
      );

      if (zScore > thresholdMultiplier) {
        unusualTransactions.push({
          ...transaction,
          zScore,
          normalAmount: Math.abs(payeeStat.avgAmount / 100),
          actualAmount: Math.abs(transaction.amount / 100),
          reason: `Gasto ${zScore.toFixed(1)}x superior al promedio`,
        });
      }
    }
  });

  return unusualTransactions;
}
```

---

## 🎯 **PATRONES DE IMPLEMENTACIÓN**

### **1. Patrón de Análisis Temporal:**

```javascript
async function temporalAnalysis(table, field, groupBy, timeframe) {
  return await runQuery(
    q(table)
      .filter({
        date: { $gte: getDateXTimeAgo(timeframe) },
      })
      .groupBy(groupBy)
      .select([
        groupBy,
        { total: { $sum: field } },
        { count: { $count: '*' } },
        { avg: { $avg: field } },
      ])
      .orderBy({ total: 'desc' }),
  );
}
```

### **2. Patrón de Detección de Anomalías:**

```javascript
async function anomalyDetection(table, field, conditions = {}) {
  const stats = await calculateStatistics(table, field, conditions);
  const threshold = stats.mean + stats.stdDev * 2.5;

  return await runQuery(
    q(table)
      .filter({
        ...conditions,
        [field]: { $gt: threshold },
      })
      .select('*'),
  );
}
```

### **3. Patrón de Comparación Periódica:**

```javascript
async function periodicComparison(table, field, period1, period2) {
  const [data1, data2] = await Promise.all([
    runQuery(q(table).filter({ date: period1 }).calculate({ $sum: field })),
    runQuery(q(table).filter({ date: period2 }).calculate({ $sum: field })),
  ]);

  return {
    period1: data1.data,
    period2: data2.data,
    change: data2.data - data1.data,
    percentChange: ((data2.data - data1.data) / data1.data) * 100,
  };
}
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### **Funcionalidades Base**

- [ ] Todos los endpoints principales implementados
- [ ] Manejo de errores robusto
- [ ] Validación de datos de entrada
- [ ] Logging comprehensivo

### **Optimización de Rendimiento**

- [ ] Caching de consultas frecuentes
- [ ] Paginación para datasets grandes
- [ ] Índices optimizados
- [ ] Queries batch cuando sea posible

### **Seguridad y Validación**

- [ ] Sanitización de inputs
- [ ] Validación de permisos
- [ ] Rate limiting
- [ ] Audit trail

### **Testing**

- [ ] Unit tests para cada endpoint
- [ ] Integration tests para workflows
- [ ] Performance tests
- [ ] Error handling tests

---

## 🚀 PRÓXIMOS PASOS

1. **Implementación Gradual:** Comenzar con endpoints críticos
2. **Testing Exhaustivo:** Validar cada funcionalidad
3. **Optimización:** Mejorar rendimiento según métricas
4. **Documentación:** Mantener esta guía actualizada

---

**Autor:** GitHub Copilot Agent  
**Validado:** 22 de julio de 2025  
**Próxima Actualización:** Según evolución de implementación
