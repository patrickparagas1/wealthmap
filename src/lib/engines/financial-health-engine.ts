// ============================================================================
// Financial Health Scoring Engine
// Comprehensive financial health score based on CFP planning areas
// ============================================================================

import {
  FinancialHealthScore, ScoreBreakdown, CashFlowSummary, NetWorthSummary,
  RetirementPlan, InsuranceNeedsAnalysis, EstatePlan, TaxSituation,
  AssetAllocation, IncomeSource, Expense, Asset, Liability, FinancialGoal
} from '../types';
import { BENCHMARKS, PLANNING_ASSUMPTIONS } from '../constants';
import { calculateAge } from './retirement-engine';

export function calculateCashFlowSummary(
  incomeSources: IncomeSource[],
  expenses: Expense[],
  assets: Asset[],
  liabilities: Liability[]
): CashFlowSummary {
  const totalMonthlyIncome = incomeSources.reduce((sum, s) => {
    switch (s.frequency) {
      case 'monthly': return sum + s.annualAmount / 12;
      case 'quarterly': return sum + s.annualAmount / 12;
      case 'annually': return sum + s.annualAmount / 12;
      case 'one_time': return sum;
      default: return sum + s.annualAmount / 12;
    }
  }, 0);

  const totalMonthlyExpenses = expenses.reduce((sum, e) => sum + e.monthlyAmount, 0);
  const totalMonthlyFixedExpenses = expenses.filter(e => e.isFixed).reduce((sum, e) => sum + e.monthlyAmount, 0);
  const totalMonthlyDiscretionary = expenses.filter(e => e.isDiscretionary).reduce((sum, e) => sum + e.monthlyAmount, 0);

  const monthlySurplus = totalMonthlyIncome - totalMonthlyExpenses;
  const annualSurplus = monthlySurplus * 12;
  const savingsRate = totalMonthlyIncome > 0 ? monthlySurplus / totalMonthlyIncome : 0;

  // Emergency fund calculation
  const liquidAssets = assets.filter(a => a.category === 'cash').reduce((sum, a) => sum + a.currentValue, 0);
  const essentialExpenses = totalMonthlyFixedExpenses + expenses
    .filter(e => ['food', 'healthcare', 'utilities', 'transportation'].includes(e.category))
    .reduce((sum, e) => sum + e.monthlyAmount, 0);
  const emergencyFundMonths = essentialExpenses > 0 ? liquidAssets / essentialExpenses : 0;

  // Debt-to-income
  const monthlyDebtPayments = liabilities.reduce((sum, l) => sum + l.monthlyPayment, 0);
  const debtToIncomeRatio = totalMonthlyIncome > 0 ? monthlyDebtPayments / totalMonthlyIncome : 0;

  return {
    totalMonthlyIncome: Math.round(totalMonthlyIncome),
    totalMonthlyExpenses: Math.round(totalMonthlyExpenses),
    totalMonthlyFixedExpenses: Math.round(totalMonthlyFixedExpenses),
    totalMonthlyDiscretionary: Math.round(totalMonthlyDiscretionary),
    monthlySurplus: Math.round(monthlySurplus),
    annualSurplus: Math.round(annualSurplus),
    savingsRate: Math.round(savingsRate * 1000) / 1000,
    emergencyFundMonths: Math.round(emergencyFundMonths * 10) / 10,
    debtToIncomeRatio: Math.round(debtToIncomeRatio * 1000) / 1000,
  };
}

export function calculateNetWorthSummary(
  assets: Asset[],
  liabilities: Liability[]
): NetWorthSummary {
  const totalAssets = assets.reduce((sum, a) => sum + a.currentValue, 0);
  const totalLiquidAssets = assets
    .filter(a => a.category === 'cash')
    .reduce((sum, a) => sum + a.currentValue, 0);
  const totalInvestmentAssets = assets
    .filter(a => a.category === 'investment')
    .reduce((sum, a) => sum + a.currentValue, 0);
  const totalRetirementAssets = assets
    .filter(a => a.category === 'retirement')
    .reduce((sum, a) => sum + a.currentValue, 0);
  const totalRealEstateAssets = assets
    .filter(a => a.category === 'real_estate')
    .reduce((sum, a) => sum + a.currentValue, 0);
  const totalLiabilities = liabilities.reduce((sum, l) => sum + l.currentBalance, 0);
  const netWorth = totalAssets - totalLiabilities;

  return {
    totalAssets,
    totalLiquidAssets,
    totalInvestmentAssets,
    totalRetirementAssets,
    totalRealEstateAssets,
    totalLiabilities,
    netWorth,
    liquidityRatio: totalAssets > 0 ? totalLiquidAssets / totalAssets : 0,
    debtToAssetRatio: totalAssets > 0 ? totalLiabilities / totalAssets : 0,
  };
}

export function calculateFinancialHealthScore(
  cashFlow: CashFlowSummary,
  netWorth: NetWorthSummary,
  retirementPlan: RetirementPlan | null,
  insuranceAnalysis: InsuranceNeedsAnalysis | null,
  estatePlan: EstatePlan | null,
  taxSituation: TaxSituation | null,
  goals: FinancialGoal[],
  age: number
): FinancialHealthScore {
  const breakdown: ScoreBreakdown[] = [];

  // 1. Cash Flow Score (15 points)
  let cashFlowScore = 0;
  if (cashFlow.monthlySurplus > 0) cashFlowScore += 5;
  if (cashFlow.savingsRate >= 0.10) cashFlowScore += 3;
  if (cashFlow.savingsRate >= 0.15) cashFlowScore += 2;
  if (cashFlow.savingsRate >= 0.20) cashFlowScore += 3;
  if (cashFlow.savingsRate >= 0.25) cashFlowScore += 2;
  cashFlowScore = Math.min(15, cashFlowScore);
  breakdown.push({
    category: 'Cash Flow',
    score: cashFlowScore,
    maxScore: 15,
    weight: 0.15,
    details: cashFlow.savingsRate >= 0.20 ? 'Excellent savings rate' :
      cashFlow.savingsRate >= 0.15 ? 'Good savings rate' :
      cashFlow.monthlySurplus > 0 ? 'Positive cash flow but could save more' : 'Spending exceeds income',
    status: cashFlowScore >= 12 ? 'excellent' : cashFlowScore >= 8 ? 'good' : cashFlowScore >= 5 ? 'needs_attention' : 'critical',
  });

  // 2. Emergency Fund Score (10 points)
  let emergencyScore = 0;
  if (cashFlow.emergencyFundMonths >= 1) emergencyScore += 2;
  if (cashFlow.emergencyFundMonths >= 3) emergencyScore += 3;
  if (cashFlow.emergencyFundMonths >= 6) emergencyScore += 3;
  if (cashFlow.emergencyFundMonths >= 9) emergencyScore += 2;
  emergencyScore = Math.min(10, emergencyScore);
  breakdown.push({
    category: 'Emergency Fund',
    score: emergencyScore,
    maxScore: 10,
    weight: 0.10,
    details: `${cashFlow.emergencyFundMonths.toFixed(1)} months of expenses covered`,
    status: emergencyScore >= 8 ? 'excellent' : emergencyScore >= 5 ? 'good' : emergencyScore >= 2 ? 'needs_attention' : 'critical',
  });

  // 3. Debt Management Score (15 points)
  let debtScore = 15;
  if (cashFlow.debtToIncomeRatio > 0.10) debtScore -= 3;
  if (cashFlow.debtToIncomeRatio > 0.20) debtScore -= 3;
  if (cashFlow.debtToIncomeRatio > 0.36) debtScore -= 4;
  if (cashFlow.debtToIncomeRatio > 0.50) debtScore -= 5;
  if (netWorth.debtToAssetRatio > 0.50) debtScore -= 2;
  debtScore = Math.max(0, debtScore);
  breakdown.push({
    category: 'Debt Management',
    score: debtScore,
    maxScore: 15,
    weight: 0.15,
    details: `DTI: ${(cashFlow.debtToIncomeRatio * 100).toFixed(1)}%, Debt-to-Asset: ${(netWorth.debtToAssetRatio * 100).toFixed(1)}%`,
    status: debtScore >= 12 ? 'excellent' : debtScore >= 8 ? 'good' : debtScore >= 5 ? 'needs_attention' : 'critical',
  });

  // 4. Investment Score (15 points)
  let investmentScore = 0;
  const hasInvestments = netWorth.totalInvestmentAssets > 0 || netWorth.totalRetirementAssets > 0;
  if (hasInvestments) investmentScore += 5;
  const totalInvested = netWorth.totalInvestmentAssets + netWorth.totalRetirementAssets;
  if (totalInvested > netWorth.totalAssets * 0.3) investmentScore += 3;
  if (totalInvested > netWorth.totalAssets * 0.5) investmentScore += 3;
  if (cashFlow.savingsRate >= 0.15) investmentScore += 2;
  investmentScore = Math.min(15, investmentScore);
  breakdown.push({
    category: 'Investments',
    score: investmentScore,
    maxScore: 15,
    weight: 0.15,
    details: hasInvestments ? `$${totalInvested.toLocaleString()} invested` : 'No investments detected',
    status: investmentScore >= 12 ? 'excellent' : investmentScore >= 8 ? 'good' : investmentScore >= 5 ? 'needs_attention' : 'critical',
  });

  // 5. Retirement Score (15 points)
  let retirementScore = 0;
  if (retirementPlan) {
    if (retirementPlan.fundedRatio >= 1.0) retirementScore = 15;
    else if (retirementPlan.fundedRatio >= 0.8) retirementScore = 12;
    else if (retirementPlan.fundedRatio >= 0.6) retirementScore = 9;
    else if (retirementPlan.fundedRatio >= 0.4) retirementScore = 6;
    else if (retirementPlan.fundedRatio >= 0.2) retirementScore = 3;
    else retirementScore = 1;
  }
  breakdown.push({
    category: 'Retirement',
    score: retirementScore,
    maxScore: 15,
    weight: 0.15,
    details: retirementPlan ? `${Math.round(retirementPlan.fundedRatio * 100)}% funded` : 'No retirement plan data',
    status: retirementScore >= 12 ? 'excellent' : retirementScore >= 8 ? 'good' : retirementScore >= 5 ? 'needs_attention' : 'critical',
  });

  // 6. Insurance Score (10 points)
  let insuranceScore = 5; // Baseline
  if (insuranceAnalysis) {
    if (insuranceAnalysis.lifeInsuranceGap <= 0) insuranceScore += 2;
    if (insuranceAnalysis.disabilityGap <= 0) insuranceScore += 2;
    if (insuranceAnalysis.recommendations.filter(r => r.priority === 'critical').length === 0) insuranceScore += 1;
    const criticalMissing = insuranceAnalysis.recommendations.filter(r => r.priority === 'critical').length;
    insuranceScore -= criticalMissing * 2;
  }
  insuranceScore = Math.max(0, Math.min(10, insuranceScore));
  breakdown.push({
    category: 'Insurance',
    score: insuranceScore,
    maxScore: 10,
    weight: 0.10,
    details: insuranceAnalysis
      ? (insuranceAnalysis.lifeInsuranceGap <= 0 ? 'Adequate coverage' : `Life insurance gap: $${insuranceAnalysis.lifeInsuranceGap.toLocaleString()}`)
      : 'Insurance data needed',
    status: insuranceScore >= 8 ? 'excellent' : insuranceScore >= 5 ? 'good' : insuranceScore >= 3 ? 'needs_attention' : 'critical',
  });

  // 7. Estate Score (10 points)
  let estateScore = 0;
  if (estatePlan) {
    if (estatePlan.hasWill) estateScore += 3;
    if (estatePlan.hasPowerOfAttorney) estateScore += 2;
    if (estatePlan.hasHealthcareDirective) estateScore += 2;
    if (estatePlan.hasBeneficiaryDesignations) estateScore += 2;
    if (estatePlan.hasTrust) estateScore += 1;
  }
  estateScore = Math.min(10, estateScore);
  breakdown.push({
    category: 'Estate Planning',
    score: estateScore,
    maxScore: 10,
    weight: 0.10,
    details: estatePlan
      ? `${[estatePlan.hasWill && 'Will', estatePlan.hasPowerOfAttorney && 'POA', estatePlan.hasHealthcareDirective && 'Healthcare Directive'].filter(Boolean).join(', ') || 'No documents in place'}`
      : 'Estate planning data needed',
    status: estateScore >= 8 ? 'excellent' : estateScore >= 5 ? 'good' : estateScore >= 3 ? 'needs_attention' : 'critical',
  });

  // 8. Tax Efficiency Score (10 points)
  let taxScore = 5; // Baseline
  if (taxSituation) {
    if (taxSituation.effectiveTaxRate < taxSituation.marginalTaxRate * 0.6) taxScore += 2;
    if (taxSituation.useItemized) taxScore += 1;
    if (taxSituation.taxCredits.length > 0) taxScore += 2;
  }
  taxScore = Math.min(10, taxScore);
  breakdown.push({
    category: 'Tax Efficiency',
    score: taxScore,
    maxScore: 10,
    weight: 0.10,
    details: taxSituation
      ? `Effective rate: ${(taxSituation.effectiveTaxRate * 100).toFixed(1)}%, Marginal: ${(taxSituation.marginalTaxRate * 100).toFixed(0)}%`
      : 'Tax data needed',
    status: taxScore >= 8 ? 'excellent' : taxScore >= 5 ? 'good' : taxScore >= 3 ? 'needs_attention' : 'critical',
  });

  // Calculate overall score (weighted)
  const overall = breakdown.reduce((sum, b) => sum + b.score, 0);

  return {
    overall,
    cashFlow: cashFlowScore,
    savings: emergencyScore,
    debt: debtScore,
    investments: investmentScore,
    insurance: insuranceScore,
    retirement: retirementScore,
    estate: estateScore,
    tax: taxScore,
    breakdown,
  };
}
