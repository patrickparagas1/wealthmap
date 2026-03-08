// ============================================================================
// Form Validation
// Per-section validators for the questionnaire wizard
// ============================================================================

import { PersonalInfo, IncomeSource, Expense, Asset, Liability, FinancialGoal } from './types';

export interface ValidationError {
  field: string;
  message: string;
}

export function validatePersonalInfo(info: PersonalInfo): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!info.firstName.trim()) errors.push({ field: 'firstName', message: 'First name is required' });
  if (!info.lastName.trim()) errors.push({ field: 'lastName', message: 'Last name is required' });
  if (!info.dateOfBirth) {
    errors.push({ field: 'dateOfBirth', message: 'Date of birth is required' });
  } else {
    const dob = new Date(info.dateOfBirth);
    const now = new Date();
    if (dob > now) errors.push({ field: 'dateOfBirth', message: 'Date of birth cannot be in the future' });
    const age = now.getFullYear() - dob.getFullYear();
    if (age > 120) errors.push({ field: 'dateOfBirth', message: 'Please enter a valid date of birth' });
  }
  if (info.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(info.email)) {
    errors.push({ field: 'email', message: 'Please enter a valid email address' });
  }
  if (!info.state) errors.push({ field: 'state', message: 'State is required for tax calculations' });

  return errors;
}

export function validateIncome(sources: IncomeSource[]): ValidationError[] {
  const errors: ValidationError[] = [];
  sources.forEach((s, i) => {
    if (s.annualAmount < 0) errors.push({ field: `income_${i}_amount`, message: `Income source "${s.description || i + 1}" cannot be negative` });
  });
  return errors;
}

export function validateExpenses(expenses: Expense[]): ValidationError[] {
  const errors: ValidationError[] = [];
  expenses.forEach((e, i) => {
    if (e.monthlyAmount < 0) errors.push({ field: `expense_${i}_amount`, message: `Expense "${e.description || i + 1}" cannot be negative` });
  });
  return errors;
}

export function validateAssets(assets: Asset[]): ValidationError[] {
  const errors: ValidationError[] = [];
  assets.forEach((a, i) => {
    if (a.currentValue < 0) errors.push({ field: `asset_${i}_value`, message: `Asset "${a.name || i + 1}" value cannot be negative` });
    if (a.annualReturn !== undefined && (a.annualReturn < -1 || a.annualReturn > 1)) {
      errors.push({ field: `asset_${i}_return`, message: `Asset "${a.name || i + 1}" return should be a decimal (e.g., 0.07 for 7%)` });
    }
  });
  return errors;
}

export function validateLiabilities(liabilities: Liability[]): ValidationError[] {
  const errors: ValidationError[] = [];
  liabilities.forEach((l, i) => {
    if (l.currentBalance < 0) errors.push({ field: `liability_${i}_balance`, message: `Debt "${l.name || i + 1}" balance cannot be negative` });
    if (l.interestRate < 0 || l.interestRate > 100) errors.push({ field: `liability_${i}_rate`, message: `Debt "${l.name || i + 1}" interest rate should be 0-100` });
  });
  return errors;
}

export function validateGoals(goals: FinancialGoal[]): ValidationError[] {
  const errors: ValidationError[] = [];
  goals.forEach((g, i) => {
    if (g.targetAmount < 0) errors.push({ field: `goal_${i}_target`, message: `Goal "${g.name || i + 1}" target cannot be negative` });
  });
  return errors;
}

const sectionValidators: Record<string, (store: any) => ValidationError[]> = {
  personal_info: (store) => validatePersonalInfo(store.personalInfo),
  income: (store) => validateIncome(store.incomeSources),
  expenses: (store) => validateExpenses(store.expenses),
  assets: (store) => validateAssets(store.assets),
  liabilities: (store) => validateLiabilities(store.liabilities),
  goals: (store) => validateGoals(store.goals),
};

export function validateSection(sectionId: string, store: any): ValidationError[] {
  const validator = sectionValidators[sectionId];
  return validator ? validator(store) : [];
}
