// Credit Card Management Utilities for Actual Budget
// Implements best practices from official Actual documentation

/**
 * Credit Card Account Types
 */
export const CREDIT_CARD_ACCOUNT_TYPES = {
    ON_BUDGET: 'on-budget',  // Recommended approach - treats credit card as regular account
    OFF_BUDGET: 'off-budget' // Not recommended for active credit cards
};

/**
 * Credit Card Transaction Types
 */
export const CREDIT_CARD_TRANSACTION_TYPES = {
    PURCHASE: 'purchase',     // Regular spending with credit card
    PAYMENT: 'payment',       // Payment from checking to credit card
    REFUND: 'refund',        // Merchant refund
    FEE: 'fee',              // Interest, annual fees, etc.
    CASHBACK: 'cashback'     // Rewards, cashback
};

/**
 * Detects if a transaction is a credit card payment vs purchase
 * Based on amount patterns and payee names
 */
export function detectCreditCardTransactionType(transaction) {
    const { payee_name, amount, notes } = transaction;
    const payeeLower = (payee_name || '').toLowerCase();
    const notesLower = (notes || '').toLowerCase();

    // Payment indicators
    const paymentIndicators = [
        'payment',
        'autopay',
        'online payment',
        'bill pay',
        'transfer',
        'payment thank you',
        'greiðsla', // Icelandic: payment
        'sjálfvirk greiðsla', // Icelandic: automatic payment
        'millifærsla' // Icelandic: transfer
    ];

    // Fee indicators
    const feeIndicators = [
        'interest',
        'fee',
        'annual fee',
        'late fee',
        'overlimit',
        'finance charge',
        'vextir', // Icelandic: interest
        'gjald', // Icelandic: fee
        'árgjald' // Icelandic: annual fee
    ];

    // Refund indicators
    const refundIndicators = [
        'refund',
        'return',
        'credit',
        'reversal',
        'endurgreiðsla', // Icelandic: refund
        'inneign' // Icelandic: credit
    ];

    // Cashback indicators
    const cashbackIndicators = [
        'cashback',
        'rewards',
        'cash back',
        'bonus',
        'points redemption',
        'afsláttur', // Icelandic: discount
        'bónus' // Icelandic: bonus
    ];

    const hasPaymentIndicator = paymentIndicators.some(indicator =>
        payeeLower.includes(indicator) || notesLower.includes(indicator)
    );

    const hasFeeIndicator = feeIndicators.some(indicator =>
        payeeLower.includes(indicator) || notesLower.includes(indicator)
    );

    const hasRefundIndicator = refundIndicators.some(indicator =>
        payeeLower.includes(indicator) || notesLower.includes(indicator)
    );

    const hasCashbackIndicator = cashbackIndicators.some(indicator =>
        payeeLower.includes(indicator) || notesLower.includes(indicator)
    );

    // Determine transaction type
    if (hasPaymentIndicator) {
        return CREDIT_CARD_TRANSACTION_TYPES.PAYMENT;
    } else if (hasFeeIndicator) {
        return CREDIT_CARD_TRANSACTION_TYPES.FEE;
    } else if (hasRefundIndicator || (amount > 0 && !hasCashbackIndicator)) {
        return CREDIT_CARD_TRANSACTION_TYPES.REFUND;
    } else if (hasCashbackIndicator) {
        return CREDIT_CARD_TRANSACTION_TYPES.CASHBACK;
    } else {
        return CREDIT_CARD_TRANSACTION_TYPES.PURCHASE;
    }
}

/**
 * Suggests appropriate categories for credit card transactions
 */
export function suggestCreditCardCategory(transaction, existingCategories = []) {
    const { payee_name } = transaction;
    const transactionType = detectCreditCardTransactionType(transaction);

    // If it's a payment, it should be a transfer, not a category
    if (transactionType === CREDIT_CARD_TRANSACTION_TYPES.PAYMENT) {
        return null; // Will be handled as transfer
    }

    const payeeLower = (payee_name || '').toLowerCase();

    // Category mapping based on merchant patterns
    const categoryMappings = {
        // Groceries
        groceries: [
            'grocery', 'supermarket', 'market', 'food', 'kroger', 'walmart', 'target',
            'bonus', 'netto', 'krónan', 'hagkaup', 'costco', 'matvörur' // Icelandic: groceries
        ],
        // Gas/Fuel
        gas: [
            'gas', 'fuel', 'station', 'shell', 'exxon', 'bp', 'mobil', 'esso',
            'olís', 'n1', 'costco gas', 'bensín' // Icelandic: gasoline
        ],
        // Restaurants
        dining: [
            'restaurant', 'cafe', 'pizza', 'burger', 'coffee', 'bar', 'grill',
            'mcdonald', 'subway', 'starbucks', 'veitingastaður', 'kaffihús' // Icelandic: restaurant, cafe
        ],
        // Shopping
        shopping: [
            'amazon', 'ebay', 'store', 'shop', 'retail', 'clothing', 'fashion',
            'verslunar', 'búð' // Icelandic: store, shop
        ],
        // Utilities
        utilities: [
            'electric', 'power', 'water', 'gas utility', 'internet', 'phone',
            'orka', 'vatn', 'rafmagn', 'síminn' // Icelandic: energy, water, electricity, phone company
        ],
        // Entertainment
        entertainment: [
            'netflix', 'spotify', 'cinema', 'theater', 'game', 'movie',
            'kvikmynda', 'tónlist', 'leikir' // Icelandic: movies, music, games
        ]
    };

    // Find best category match
    for (const [category, keywords] of Object.entries(categoryMappings)) {
        if (keywords.some(keyword => payeeLower.includes(keyword))) {
            // Look for existing category with similar name
            const existingCategory = existingCategories.find(cat =>
                cat.name.toLowerCase().includes(category) ||
                category.includes(cat.name.toLowerCase())
            );

            return existingCategory ? existingCategory.id : category;
        }
    }

    // Default for unrecognized merchants
    return 'misc';
}

/**
 * Calculates credit card payment amount based on Actual's documentation
 * Formula: Payment = |Account Balance| + Category Balance
 */
export function calculateCreditCardPayment(accountBalance, categoryBalance) {
    // Account balance is negative for debt, convert to positive
    const debtAmount = Math.abs(accountBalance);

    // Category balance represents additional money allocated for debt paydown
    const additionalPayment = Math.max(0, categoryBalance);

    return debtAmount + additionalPayment;
}

/**
 * Validates credit card setup according to Actual best practices
 */
export function validateCreditCardSetup(account, categories) {
    const issues = [];

    // Check if credit card is on-budget (recommended)
    if (account.offbudget) {
        issues.push({
            type: 'warning',
            message: 'Credit card accounts should be "on-budget" for better tracking'
        });
    }

    // Check for credit card debt category if there's existing debt
    if (account.balance < 0) {
        const debtCategory = categories.find(cat =>
            cat.name.toLowerCase().includes('credit card') &&
            cat.name.toLowerCase().includes('debt')
        );

        if (!debtCategory) {
            issues.push({
                type: 'suggestion',
                message: 'Consider creating a "Credit Card Debt" category to track existing debt'
            });
        }
    }

    return issues;
}

/**
 * Creates transaction object formatted for Actual import
 */
export function formatCreditCardTransaction(rawTransaction, fieldMappings) {
    const transactionType = detectCreditCardTransactionType(rawTransaction);

    // Base transaction structure
    const transaction = {
        date: rawTransaction[fieldMappings.date],
        amount: parseFloat(rawTransaction[fieldMappings.amount]) || 0,
        payee_name: rawTransaction[fieldMappings.payee],
        imported_payee: rawTransaction[fieldMappings.payee],
        notes: rawTransaction[fieldMappings.notes],
        credit_card_type: transactionType
    };

    // For credit card purchases, amount should be negative (debt increase)
    if (transactionType === CREDIT_CARD_TRANSACTION_TYPES.PURCHASE && transaction.amount > 0) {
        transaction.amount = -transaction.amount;
    }

    // For payments, amount should be positive (debt decrease)
    if (transactionType === CREDIT_CARD_TRANSACTION_TYPES.PAYMENT && transaction.amount < 0) {
        transaction.amount = -transaction.amount;
    }

    return transaction;
}

/**
 * Merchant name standardization for better categorization
 */
export function standardizeMerchantName(payeeName) {
    if (!payeeName) return '';

    // Common merchant patterns to clean up
    const cleanupPatterns = [
        // Remove location codes
        { pattern: /\s+#\d+.*$/, replacement: '' },
        { pattern: /\s+\d{4}$/, replacement: '' }, // Remove 4-digit store numbers

        // Standardize common merchants
        { pattern: /^AMAZON\.COM.*/, replacement: 'Amazon' },
        { pattern: /^WALMART.*/, replacement: 'Walmart' },
        { pattern: /^TARGET.*/, replacement: 'Target' },
        { pattern: /^MCDONALD.*/, replacement: 'McDonald\'s' },
        { pattern: /^STARBUCKS.*/, replacement: 'Starbucks' },

        // Remove common prefixes/suffixes
        { pattern: /^TST\*\s*/, replacement: '' },
        { pattern: /^SQ\*\s*/, replacement: '' },
        { pattern: /\s*\*.*$/, replacement: '' },

        // Clean up excessive spaces
        { pattern: /\s+/g, replacement: ' ' }
    ];

    let cleanName = payeeName.trim();

    cleanupPatterns.forEach(({ pattern, replacement }) => {
        cleanName = cleanName.replace(pattern, replacement);
    });

    return cleanName.trim();
}

// Export all utilities
export default {
    CREDIT_CARD_ACCOUNT_TYPES,
    CREDIT_CARD_TRANSACTION_TYPES,
    detectCreditCardTransactionType,
    suggestCreditCardCategory,
    calculateCreditCardPayment,
    validateCreditCardSetup,
    formatCreditCardTransaction,
    standardizeMerchantName
};
