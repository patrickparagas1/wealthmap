// ============================================================================
// Scenario Comparison Engine
// What-if analysis by applying overrides to current financial state
// ============================================================================

import { buildRetirementPlan, calculateAge, runMonteCarlo } from './retirement-engine';
import { calculateFullTaxSituation } from './tax-engine';
import { calculateCashFlowSummary, calculateNetWorthSummary } from './financial-health-engine';

export interface ScenarioOverrides {
  incomeChange?: number;         // +/- dollar amount
  expenseChange?: number;        // +/- dollar amount per month
  extraSavings?: number;         // additional annual retirement contribution
  retirementAge?: number;        // override target retirement age
  investmentReturn?: number;     // override expected return (decimal)
}

export interface ScenarioResult {
  name: string;
  overrides: ScenarioOverrides;
  netWorth: number;
  monthlySurplus: number;
  savingsRate: number;
  totalTax: number;
  retirementFund: number;
  fundedRatio: number;
  retirementGap: number;
  monteCarloSuccess: number;
}

export function runScenario(
  store: any,
  name: string,
  overrides: ScenarioOverrides
): ScenarioResult {
  // Clone income sources with modification
  const incomeSources = store.incomeSources.map((s: any) => ({
    ...s,
    annualAmount: s.annualAmount + (overrides.incomeChange ? overrides.incomeChange / store.incomeSources.length : 0),
  }));

  // Clone expenses with modification
  const expenses = store.expenses.map((e: any) => ({
    ...e,
    monthlyAmount: e.monthlyAmount + (overrides.expenseChange ? overrides.expenseChange / Math.max(1, store.expenses.length) : 0),
  }));

  // Cash flow
  const cashFlow = calculateCashFlowSummary(incomeSources, expenses, store.assets, store.liabilities);
  const netWorth = calculateNetWorthSummary(store.assets, store.liabilities);

  // Tax
  const tax = calculateFullTaxSituation(store.personalInfo, incomeSources, expenses);

  // Retirement
  const retirementAge = overrides.retirementAge || store.retirementPreferences?.targetRetirementAge || 65;
  const retirementAssets = store.assets.filter((a: any) => a.category === 'retirement');
  const retirement = buildRetirementPlan(
    store.personalInfo, incomeSources, retirementAssets, retirementAge
  );

  // Monte Carlo with adjusted contributions
  let mcSuccess = 0;
  if (retirement.yearsToRetirement > 0) {
    const extraAnnual = overrides.extraSavings || 0;
    const mc = runMonteCarlo(
      retirement.currentRetirementSavings,
      retirement.annualContributions + retirement.employerMatch + extraAnnual,
      retirement.yearsToRetirement,
      retirement.yearsInRetirement,
      retirement.desiredAnnualIncome
    );
    mcSuccess = mc.successRate;
  }

  return {
    name,
    overrides,
    netWorth: netWorth.netWorth,
    monthlySurplus: cashFlow.monthlySurplus,
    savingsRate: cashFlow.savingsRate,
    totalTax: tax.totalTaxLiability,
    retirementFund: retirement.projectedRetirementFund,
    fundedRatio: retirement.fundedRatio,
    retirementGap: retirement.retirementGap,
    monteCarloSuccess: mcSuccess,
  };
}
