import { describe, it, expect } from 'vitest';
import {
  calculateCashFlowSummary, calculateNetWorthSummary, calculateFinancialHealthScore
} from '../financial-health-engine';

describe('Financial Health Engine', () => {
  describe('calculateCashFlowSummary', () => {
    it('calculates monthly surplus correctly', () => {
      const income = [{ id: '1', name: 'Salary', type: 'salary' as const, annualAmount: 120000, frequency: 'annually' as const, isTaxable: true, isActive: true }];
      const expenses = [{ id: '1', name: 'Rent', category: 'housing' as const, monthlyAmount: 2000, isEssential: true }];
      const result = calculateCashFlowSummary(income, expenses, [], []);
      expect(result.totalMonthlyIncome).toBe(10000);
      expect(result.totalMonthlyExpenses).toBe(2000);
      expect(result.monthlySurplus).toBe(8000);
    });

    it('computes savings rate', () => {
      const income = [{ id: '1', name: 'S', type: 'salary' as const, annualAmount: 120000, frequency: 'annually' as const, isTaxable: true, isActive: true }];
      const expenses = [{ id: '1', name: 'R', category: 'housing' as const, monthlyAmount: 8000, isEssential: true }];
      const result = calculateCashFlowSummary(income, expenses, [], []);
      // Surplus 2000 / 10000 = 0.20
      expect(result.savingsRate).toBeCloseTo(0.20, 2);
    });
  });

  describe('calculateNetWorthSummary', () => {
    it('calculates net worth as assets minus liabilities', () => {
      const assets = [
        { id: '1', name: 'Savings', category: 'cash' as const, currentValue: 50000, accountType: 'savings' as const, annualReturn: 0.04 },
        { id: '2', name: '401k', category: 'retirement' as const, currentValue: 200000, accountType: '401k' as const, annualReturn: 0.07 },
      ];
      const liabilities = [
        { id: '1', name: 'Mortgage', type: 'mortgage' as const, currentBalance: 150000, originalBalance: 250000, interestRate: 4.5, minimumPayment: 1200, monthlyPayment: 1200, term: 360 },
      ];
      const result = calculateNetWorthSummary(assets, liabilities);
      expect(result.totalAssets).toBe(250000);
      expect(result.totalLiabilities).toBe(150000);
      expect(result.netWorth).toBe(100000);
    });
  });

  describe('calculateFinancialHealthScore', () => {
    const makeCashFlow = (overrides = {}) => ({
      totalMonthlyIncome: 10000,
      totalMonthlyExpenses: 6000,
      monthlySurplus: 4000,
      savingsRate: 0.40,
      emergencyFundMonths: 12,
      debtToIncomeRatio: 0.05,
      expenseBreakdown: {},
      topExpenses: [],
      essentialVsDiscretionary: { essential: 4000, discretionary: 2000, ratio: 0.67 },
      ...overrides,
    });

    const makeNetWorth = (overrides = {}) => ({
      totalAssets: 1000000,
      totalLiabilities: 100000,
      netWorth: 900000,
      debtToAssetRatio: 0.10,
      liquidAssets: 100000,
      totalInvestmentAssets: 300000,
      totalRetirementAssets: 500000,
      totalRealEstate: 0,
      assetGrowthRate: 0.08,
      ...overrides,
    });

    const makeInsurance = (overrides = {}) => ({
      lifeInsuranceGap: 0,
      disabilityGap: 0,
      recommendations: [],
      ...overrides,
    });

    const makeEstate = (overrides = {}) => ({
      hasWill: true,
      hasPowerOfAttorney: true,
      hasHealthcareDirective: true,
      hasBeneficiaryDesignations: true,
      hasTrust: true,
      completenessScore: 100,
      ...overrides,
    });

    const makeTax = (overrides = {}) => ({
      effectiveTaxRate: 0.18,
      marginalTaxRate: 0.24,
      useItemized: false,
      taxCredits: [],
      ...overrides,
    });

    it('produces score between 0 and 100', () => {
      const score = calculateFinancialHealthScore(
        makeCashFlow(), makeNetWorth(),
        { fundedRatio: 0.8 } as any,
        makeInsurance() as any,
        makeEstate() as any,
        makeTax() as any,
        [], 35
      );
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
    });

    it('does not give free investment points', () => {
      // No investments, no savings rate => investment score should be 0
      const score = calculateFinancialHealthScore(
        makeCashFlow({ savingsRate: 0 }),
        makeNetWorth({ totalInvestmentAssets: 0, totalRetirementAssets: 0, totalAssets: 100000 }),
        null, null, null, null, [], 30
      );
      const investmentBreakdown = score.breakdown.find(b => b.category === 'Investments');
      expect(investmentBreakdown).toBeDefined();
      expect(investmentBreakdown!.score).toBe(0);
    });

    it('max scores sum to 100', () => {
      const score = calculateFinancialHealthScore(
        makeCashFlow(), makeNetWorth(),
        { fundedRatio: 1.5 } as any,
        makeInsurance() as any,
        makeEstate() as any,
        makeTax() as any,
        [{ id: '1', name: 'G', targetAmount: 100000, currentAmount: 100000, deadline: '', priority: 'high' as const, category: 'savings' as const }],
        35
      );
      const maxTotal = score.breakdown.reduce((sum, b) => sum + b.maxScore, 0);
      expect(maxTotal).toBe(100);
    });

    it('gives higher scores for better financial health', () => {
      const goodScore = calculateFinancialHealthScore(
        makeCashFlow(), makeNetWorth(),
        { fundedRatio: 1.0 } as any,
        makeInsurance() as any,
        makeEstate() as any,
        makeTax() as any,
        [], 35
      );

      const poorScore = calculateFinancialHealthScore(
        makeCashFlow({ monthlySurplus: -500, savingsRate: -0.05, emergencyFundMonths: 0, debtToIncomeRatio: 0.55 }),
        makeNetWorth({ totalInvestmentAssets: 0, totalRetirementAssets: 0, debtToAssetRatio: 0.80, totalAssets: 10000 }),
        null, null, null, null, [], 35
      );

      expect(goodScore.overall).toBeGreaterThan(poorScore.overall);
    });
  });
});
