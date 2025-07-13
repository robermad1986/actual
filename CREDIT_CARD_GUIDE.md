# Credit Card Management Guide for Actual Budget

## Overview

This enhanced version of Actual Budget includes comprehensive credit card support based on the official Actual documentation and best practices. This guide will help you set up and manage credit cards effectively while avoiding debt accumulation.

## Table of Contents

1. [Credit Card Philosophy](#credit-card-philosophy)
2. [Account Setup](#account-setup)
3. [Transaction Import](#transaction-import)
4. [Monthly Workflow](#monthly-workflow)
5. [Debt Management](#debt-management)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

## Credit Card Philosophy

### "Within the Budget" Strategy (Recommended)

Actual Budget recommends the "Within the Budget" approach for credit cards:

- **Credit cards are "on-budget" accounts** (not off-budget)
- **Every purchase is pre-funded** from existing budget categories
- **Payments are transfers** between checking and credit card accounts
- **Transfers don't affect your budget** - money was already allocated

### How It Works

1. **Budget money into categories** (groceries, gas, entertainment, etc.)
2. **Spend with credit card** from those pre-funded categories
3. **Pay credit card bill** as a transfer (checking → credit card)
4. **Since money was already budgeted**, payment is fully covered

## Account Setup

### Setting Up a New Credit Card

1. **Create the account as "on-budget"**
   ```
   Account Type: Checking/Savings (On-Budget)
   Starting Balance: Current balance (negative if you have debt)
   ```

2. **For existing debt**: Create a "Credit Card Debt" category
   - Set category to "Rollover overspending"
   - Import existing balance to this category
   - Use for tracking debt paydown progress

### Account Configuration Options

- **On-Budget (Recommended)**: Full integration with budget tracking
- **Off-Budget (Not Recommended)**: Transactions don't affect budget

## Transaction Import

### Supported File Formats

- **XLSX files** from Icelandic banks (Arion Banki) and international banks
- **Credit card statements** in XLSX format
- **CSV exports** from credit card companies

### Enhanced Field Mapping

The system automatically detects and maps:

- **Date fields**: Various formats including DD.MM.YYYY and Excel dates
- **Amount fields**: Negative for purchases, positive for payments/refunds
- **Payee fields**: Merchant names, automatically standardized
- **Description fields**: Additional transaction details

### Transaction Type Detection

The system automatically identifies:

- **Purchases**: Regular spending (negative amounts)
- **Payments**: Bill payments (positive amounts) → handled as transfers
- **Refunds**: Merchant refunds (positive amounts)
- **Fees**: Interest, annual fees (negative amounts)
- **Cashback**: Rewards (positive amounts)

## Monthly Workflow

### Step 1: Budget Allocation

```
Monthly Income: $3,000

Budget Categories:
- Groceries: $400
- Gas: $150
- Dining Out: $200
- Entertainment: $100
- Credit Card Payment: $500 (if paying down debt)
```

### Step 2: Spend from Categories

When you buy groceries with your credit card:
- Transaction: -$85 from "Groceries" category
- Account balance: Credit card debt increases by $85
- Budget impact: Only affects the "Groceries" category

### Step 3: Pay Credit Card Bill

When your bill arrives:
- Create transfer: Checking → Credit Card ($500)
- Account balances update (no budget impact)
- Money was already allocated, so payment is covered

### Step 4: Import and Reconcile

1. **Import credit card transactions** (XLSX file)
2. **Review automatically detected categories**
3. **Adjust any incorrect categorizations**
4. **Reconcile with your budget**

## Debt Management

### For Existing Credit Card Debt

If you have existing debt when starting:

1. **Create "Credit Card Debt" category**
2. **Set to "Rollover overspending"**
3. **Import existing balance** to this category
4. **Monthly allocation**: Budget extra money for debt paydown

### Debt Paydown Calculation

```javascript
Payment Amount = |Account Balance| + Category Balance

Example:
- Credit Card Balance: -$2,500 (debt)
- Credit Card Debt Category: +$200 (allocated for paydown)
- Total Payment: $2,500 + $200 = $2,700
```

### Debt Paydown Strategy

```
Month 1:
- Existing Debt: $2,500
- Budget for paydown: $200
- New purchases: $800 (from budget categories)
- Total payment: $800 + $200 = $1,000
- Remaining debt: $1,700

Month 2:
- Existing Debt: $1,700  
- Budget for paydown: $200
- New purchases: $750 (from budget categories)
- Total payment: $750 + $200 = $950
- Remaining debt: $950
```

## Best Practices

### 1. Budget First, Spend Second

- **Always budget money into categories first**
- **Only spend from funded categories**
- **Avoid overspending in any category**

### 2. Pay in Full Monthly

- **Transfer full balance monthly** to avoid interest
- **Treat credit cards as cash substitutes**, not loans
- **Use debt category only for existing debt**

### 3. Category Management

- **Create specific categories** for different spending types
- **Use merchant auto-categorization** for efficiency
- **Review and adjust** categories monthly

### 4. Transaction Tracking

- **Import transactions regularly** (weekly or monthly)
- **Review merchant names** for accuracy
- **Split transactions** when necessary (gas + snacks)

### 5. Emergency Handling

If you overspend in a category:
- **Move money from another category** to cover the overspending
- **Don't ignore negative balances**
- **Adjust next month's budget** based on actual spending

## Advanced Features

### Automated Categorization

The system includes smart merchant recognition:

```javascript
// Automatically categorized merchants
Amazon → Shopping
Kroger → Groceries  
Shell → Gas
Netflix → Entertainment
Starbucks → Dining Out
```

### Scheduled Payments

Set up automatic payment reminders:
- **Monthly payment dates**
- **Minimum payment amounts**
- **Full balance payment options**

### Multi-Currency Support

For international users:
- **Icelandic Króna (ISK)** support
- **Field mapping** for Icelandic bank exports
- **Multi-language** merchant detection

## Troubleshooting

### Common Issues

**1. Import fails to detect headers**
- Ensure XLSX file has clear column headers
- Check for merged cells or formatting issues
- Try saving as CSV if XLSX import fails

**2. Incorrect amount signs**
- Credit card purchases should be negative (debt increase)
- Payments should be positive (debt decrease)
- Use "Flip amount" option if needed

**3. Poor merchant categorization**
- Review and manually adjust categories
- Create rules for recurring merchants
- Use payee name standardization

**4. Budget overspending**
- Move money between categories as needed
- Don't let negative balances persist
- Adjust future budgets based on actual spending

### Getting Help

For technical issues:
1. Check console logs for detailed error messages
2. Verify file format matches supported types
3. Test with a small sample file first
4. Review field mapping for accuracy

## File Examples

### Icelandic Bank (Arion Banki) Format
```
Dagsetning | Nafn viðtakanda eða greiðanda | Upphæð | Skýring
15.01.2024 | Hagkaup                      | -4500   | Matvörur
16.01.2024 | N1                           | -2300   | Bensín
```

### International Bank Format  
```
Created At | Description | Amount | Type
2024-01-15 | Amazon.com  | -89.99 | Purchase
2024-01-16 | Payment     | 500.00 | Payment
```

This enhanced credit card system will help you maintain better financial control while leveraging the benefits of credit card usage without accumulating debt.
