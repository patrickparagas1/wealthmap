// ============================================================================
// Field Mapper — Maps extracted financial data to Zustand store types
// Converts parser output into IncomeSource, Expense, Asset, Liability
// ============================================================================

import { IncomeSource, Expense, Asset, Liability, ExpenseCategory, AssetCategory, LiabilityCategory } from '../types';
import { ExtractedField } from './financial-patterns';
import { NormalizedTransaction } from './csv-parser';
import { categorizeTransaction } from './financial-patterns';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface MappedData {
  incomeSources: IncomeSource[];
  expenses: Expense[];
  assets: Asset[];
  liabilities: Liability[];
}

export interface MappedItem {
  type: 'income' | 'expense' | 'asset' | 'liability';
  data: IncomeSource | Expense | Asset | Liability;
  confidence: 'high' | 'medium' | 'low';
  source: string; // which field/document it came from
}

let _idCounter = 0;
function genId(prefix: string): string {
  return `${prefix}-import-${Date.now()}-${++_idCounter}`;
}

// ---------------------------------------------------------------------------
// Map extracted PDF fields to store types
// ---------------------------------------------------------------------------
export function mapExtractedFields(fields: ExtractedField[], docType: string): MappedItem[] {
  const items: MappedItem[] = [];

  for (const field of fields) {
    switch (field.category) {
      case 'income':
        items.push(mapToIncome(field, docType));
        break;
      case 'asset':
        items.push(mapToAsset(field, docType));
        break;
      case 'liability':
        items.push(mapToLiability(field, docType));
        break;
      case 'expense':
        items.push(mapToExpense(field, docType));
        break;
    }
  }

  return items;
}

function numVal(v: string | number): number {
  return typeof v === 'number' ? v : parseFloat(v) || 0;
}

function mapToIncome(field: ExtractedField, source: string): MappedItem {
  const incomeType = inferIncomeType(field.label);
  const val = numVal(field.value);
  return {
    type: 'income',
    data: {
      id: genId('inc'),
      type: incomeType,
      description: field.label,
      annualAmount: field.label.toLowerCase().includes('monthly')
        ? val * 12
        : val,
      frequency: 'annually',
      isTaxable: true,
      owner: 'client',
    } as IncomeSource,
    confidence: field.confidence,
    source,
  };
}

function mapToExpense(field: ExtractedField, source: string): MappedItem {
  const category = inferExpenseCategory(field.label);
  const val = numVal(field.value);
  return {
    type: 'expense',
    data: {
      id: genId('exp'),
      category,
      description: field.label,
      monthlyAmount: field.label.toLowerCase().includes('annual')
        ? Math.round(val / 12)
        : val,
      isFixed: true,
      isDiscretionary: false,
      isDeductible: false,
    } as Expense,
    confidence: field.confidence,
    source,
  };
}

function mapToAsset(field: ExtractedField, source: string): MappedItem {
  const category = inferAssetCategory(field.label);
  return {
    type: 'asset',
    data: {
      id: genId('ast'),
      name: field.label,
      category,
      currentValue: numVal(field.value),
      owner: 'client',
    } as Asset,
    confidence: field.confidence,
    source,
  };
}

function mapToLiability(field: ExtractedField, source: string): MappedItem {
  const category = inferLiabilityCategory(field.label);
  const val = numVal(field.value);
  return {
    type: 'liability',
    data: {
      id: genId('lia'),
      name: field.label,
      category,
      currentBalance: val,
      originalBalance: val,
      interestRate: 0,
      minimumPayment: 0,
      monthlyPayment: 0,
      remainingTermMonths: 0,
      isDeductible: category === 'mortgage',
      owner: 'client',
    } as Liability,
    confidence: field.confidence,
    source,
  };
}

// ---------------------------------------------------------------------------
// Map CSV transactions to income/expense items
// ---------------------------------------------------------------------------
export function mapTransactions(transactions: NormalizedTransaction[]): MappedItem[] {
  const items: MappedItem[] = [];
  const incomeByCategory: Record<string, number> = {};
  const expenseByCategory: Record<string, number> = {};

  for (const txn of transactions) {
    const { category, isIncome } = categorizeTransaction(txn.description, txn.amount);
    if (isIncome) {
      incomeByCategory[category] = (incomeByCategory[category] || 0) + txn.amount;
    } else {
      expenseByCategory[category] = (expenseByCategory[category] || 0) + Math.abs(txn.amount);
    }
  }

  // Estimate monthly from total — assume statement covers 1 month
  for (const [cat, total] of Object.entries(incomeByCategory)) {
    const incomeType = inferIncomeType(cat);
    items.push({
      type: 'income',
      data: {
        id: genId('inc'),
        type: incomeType,
        description: `${cat} (from statement)`,
        annualAmount: Math.round(total * 12),
        frequency: 'annually',
        isTaxable: true,
        owner: 'client',
      } as IncomeSource,
      confidence: 'medium',
      source: 'CSV Bank Statement',
    });
  }

  for (const [cat, total] of Object.entries(expenseByCategory)) {
    const expCategory = inferExpenseCategory(cat);
    items.push({
      type: 'expense',
      data: {
        id: genId('exp'),
        category: expCategory,
        description: `${cat} (from statement)`,
        monthlyAmount: Math.round(total),
        isFixed: false,
        isDiscretionary: !['housing', 'utilities', 'healthcare', 'food'].includes(expCategory),
        isDeductible: false,
      } as Expense,
      confidence: 'medium',
      source: 'CSV Bank Statement',
    });
  }

  return items;
}

// ---------------------------------------------------------------------------
// Inference helpers
// ---------------------------------------------------------------------------
function inferIncomeType(label: string): IncomeSource['type'] {
  const l = label.toLowerCase();
  if (l.includes('salary') || l.includes('wage') || l.includes('gross pay') || l.includes('net pay')) return 'salary';
  if (l.includes('bonus')) return 'bonus';
  if (l.includes('self') || l.includes('freelance') || l.includes('1099')) return 'self_employment';
  if (l.includes('rent')) return 'rental';
  if (l.includes('dividend')) return 'dividend';
  if (l.includes('interest')) return 'interest';
  if (l.includes('capital gain')) return 'capital_gains';
  if (l.includes('social security') || l.includes('ssa')) return 'social_security';
  if (l.includes('pension')) return 'pension';
  return 'other';
}

function inferExpenseCategory(label: string): ExpenseCategory {
  const l = label.toLowerCase();
  if (l.includes('mortgage') || l.includes('rent') || l.includes('housing')) return 'housing';
  if (l.includes('utilit')) return 'utilities';
  if (l.includes('transport') || l.includes('gas') || l.includes('fuel') || l.includes('uber') || l.includes('lyft')) return 'transportation';
  if (l.includes('food') || l.includes('grocer') || l.includes('restaurant') || l.includes('dining')) return 'food';
  if (l.includes('health') || l.includes('medical') || l.includes('pharmacy') || l.includes('doctor')) return 'healthcare';
  if (l.includes('insurance')) return 'health_insurance';
  if (l.includes('education') || l.includes('tuition') || l.includes('school')) return 'education';
  if (l.includes('entertainment') || l.includes('streaming') || l.includes('netflix')) return 'entertainment';
  if (l.includes('subscri')) return 'subscriptions';
  if (l.includes('travel') || l.includes('hotel') || l.includes('flight') || l.includes('airline')) return 'travel';
  if (l.includes('cloth') || l.includes('apparel')) return 'clothing';
  if (l.includes('charit') || l.includes('donat')) return 'charitable';
  if (l.includes('pet') || l.includes('vet')) return 'pets';
  if (l.includes('child') || l.includes('daycare')) return 'childcare';
  return 'other';
}

function inferAssetCategory(label: string): AssetCategory {
  const l = label.toLowerCase();
  if (l.includes('check') || l.includes('saving') || l.includes('cash') || l.includes('bank') || l.includes('ending balance')) return 'cash';
  if (l.includes('401k') || l.includes('ira') || l.includes('retirement') || l.includes('pension') || l.includes('403b') || l.includes('tsp')) return 'retirement';
  if (l.includes('invest') || l.includes('brokerage') || l.includes('portfolio') || l.includes('stock') || l.includes('mutual fund')) return 'investment';
  if (l.includes('real estate') || l.includes('property') || l.includes('home')) return 'real_estate';
  return 'other';
}

function inferLiabilityCategory(label: string): LiabilityCategory {
  const l = label.toLowerCase();
  if (l.includes('mortgage')) return 'mortgage';
  if (l.includes('auto') || l.includes('car')) return 'auto_loan';
  if (l.includes('student')) return 'student_loan';
  if (l.includes('credit card')) return 'credit_card';
  if (l.includes('heloc') || l.includes('home equity')) return 'heloc';
  return 'personal_loan';
}
