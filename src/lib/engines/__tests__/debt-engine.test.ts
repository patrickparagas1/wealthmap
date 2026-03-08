import { describe, it, expect } from 'vitest';
import { calculateAvalanchePayoff, calculateSnowballPayoff, compareStrategies } from '../debt-engine';

const sampleDebts = [
  { id: '1', name: 'Credit Card', type: 'credit_card' as const, currentBalance: 5000, originalBalance: 5000, interestRate: 18, minimumPayment: 150, monthlyPayment: 150, term: 60 },
  { id: '2', name: 'Car Loan', type: 'auto' as const, currentBalance: 15000, originalBalance: 20000, interestRate: 5, minimumPayment: 300, monthlyPayment: 300, term: 48 },
  { id: '3', name: 'Student Loan', type: 'student' as const, currentBalance: 25000, originalBalance: 30000, interestRate: 6.5, minimumPayment: 280, monthlyPayment: 280, term: 120 },
];

describe('Debt Engine', () => {
  describe('calculateAvalanchePayoff', () => {
    it('prioritizes highest interest rate first', () => {
      const result = calculateAvalanchePayoff(sampleDebts, 0);
      // Credit card (18%) should be paid off first
      expect(result.debts[0].name).toBe('Credit Card');
      expect(result.debts[0].payoffMonth).toBeLessThan(result.debts[1].payoffMonth);
    });

    it('produces valid debt-free date', () => {
      const result = calculateAvalanchePayoff(sampleDebts, 0);
      expect(result.totalMonths).toBeGreaterThan(0);
      expect(result.debtFreeDate).toBeTruthy();
      expect(new Date(result.debtFreeDate).getTime()).toBeGreaterThan(Date.now());
    });

    it('total paid exceeds total balances (includes interest)', () => {
      const result = calculateAvalanchePayoff(sampleDebts, 0);
      const totalBalance = sampleDebts.reduce((s, d) => s + d.currentBalance, 0);
      expect(result.totalPaid).toBeGreaterThan(totalBalance);
      expect(result.totalInterestPaid).toBeGreaterThan(0);
    });
  });

  describe('calculateSnowballPayoff', () => {
    it('prioritizes lowest balance first', () => {
      const result = calculateSnowballPayoff(sampleDebts, 0);
      // Credit card ($5000) has lowest balance, should be first
      expect(result.debts[0].name).toBe('Credit Card');
    });
  });

  describe('compareStrategies', () => {
    it('avalanche saves interest compared to snowball', () => {
      const comparison = compareStrategies(sampleDebts, 0);
      expect(comparison.interestSavings).toBeGreaterThanOrEqual(0);
      expect(comparison.avalanche.totalInterestPaid).toBeLessThanOrEqual(comparison.snowball.totalInterestPaid);
    });

    it('extra payment reduces total months', () => {
      const noExtra = compareStrategies(sampleDebts, 0);
      const withExtra = compareStrategies(sampleDebts, 500);
      expect(withExtra.avalanche.totalMonths).toBeLessThan(noExtra.avalanche.totalMonths);
    });

    it('extra payment reduces total interest', () => {
      const noExtra = compareStrategies(sampleDebts, 0);
      const withExtra = compareStrategies(sampleDebts, 500);
      expect(withExtra.avalanche.totalInterestPaid).toBeLessThan(noExtra.avalanche.totalInterestPaid);
    });

    it('handles single debt', () => {
      const single = [sampleDebts[0]];
      const result = compareStrategies(single, 0);
      // With single debt, avalanche and snowball should be identical
      expect(result.avalanche.totalInterestPaid).toBeCloseTo(result.snowball.totalInterestPaid, 0);
      expect(result.interestSavings).toBeCloseTo(0, 0);
    });

    it('handles empty debt list', () => {
      const result = compareStrategies([], 0);
      expect(result.avalanche.totalMonths).toBe(0);
      expect(result.snowball.totalMonths).toBe(0);
    });
  });
});
