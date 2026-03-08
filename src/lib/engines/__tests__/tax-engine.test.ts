import { describe, it, expect } from 'vitest';
import { calculateFederalTax, calculateFICA, calculateFullTaxSituation } from '../tax-engine';
import { FEDERAL_TAX_BRACKETS_2025, STANDARD_DEDUCTIONS_2025 } from '../../constants';

describe('Tax Engine', () => {
  describe('calculateFederalTax', () => {
    it('computes 10% bracket correctly for single filer', () => {
      // $10,000 taxable income => all in 10% bracket
      const tax = calculateFederalTax(10000, 'single');
      expect(tax).toBe(1000);
    });

    it('computes across two brackets for single filer', () => {
      // $30,000 taxable income: 11925 * 0.10 + (30000 - 11925) * 0.12
      const expected = 11925 * 0.10 + (30000 - 11925) * 0.12;
      const tax = calculateFederalTax(30000, 'single');
      expect(tax).toBeCloseTo(expected, 2);
    });

    it('handles zero income', () => {
      expect(calculateFederalTax(0, 'single')).toBe(0);
    });

    it('handles MFJ brackets correctly', () => {
      // $20,000 taxable => all in 10% for MFJ (bracket goes to 23,850)
      const tax = calculateFederalTax(20000, 'married_filing_jointly');
      expect(tax).toBe(2000);
    });

    it('handles high income across all brackets for single', () => {
      // $700,000 taxable income - should hit the 37% bracket
      const brackets = FEDERAL_TAX_BRACKETS_2025.single;
      let expected = 0;
      let remaining = 700000;
      for (const b of brackets) {
        const taxable = Math.min(remaining, b.max - b.min);
        if (taxable <= 0) break;
        expected += taxable * b.rate;
        remaining -= taxable;
      }
      const tax = calculateFederalTax(700000, 'single');
      expect(tax).toBeCloseTo(expected, 2);
    });

    it('computes correct tax for all five filing statuses', () => {
      const statuses = ['single', 'married_filing_jointly', 'married_filing_separately', 'head_of_household', 'qualifying_widow'] as const;
      for (const status of statuses) {
        const tax = calculateFederalTax(100000, status);
        expect(tax).toBeGreaterThan(0);
        expect(tax).toBeLessThan(100000);
      }
    });
  });

  describe('calculateFICA', () => {
    it('calculates employee FICA on typical income', () => {
      const fica = calculateFICA(100000, false, 'single');
      // SS: 100000 * 0.062 = 6200, Medicare: 100000 * 0.0145 = 1450
      expect(fica.socialSecurity).toBeCloseTo(6200, 0);
      expect(fica.medicare).toBeCloseTo(1450, 0);
      expect(fica.total).toBeCloseTo(7650, 0);
    });

    it('caps Social Security at wage base', () => {
      const fica = calculateFICA(200000, false, 'single');
      // SS capped at 176100 * 0.062
      expect(fica.socialSecurity).toBeCloseTo(176100 * 0.062, 0);
    });

    it('applies Additional Medicare Tax above threshold', () => {
      const fica = calculateFICA(300000, false, 'single');
      // Medicare: base + additional above 200k threshold
      const baseMedicare = 300000 * 0.0145;
      const additionalMedicare = (300000 - 200000) * 0.009;
      expect(fica.medicare).toBeCloseTo(baseMedicare + additionalMedicare, 0);
    });
  });

  describe('calculateFullTaxSituation', () => {
    it('produces a valid tax situation for simple case', () => {
      const personalInfo = {
        id: '1', firstName: 'Test', lastName: 'User', dateOfBirth: '1990-01-01',
        email: '', phone: '', state: 'CA', filingStatus: 'single' as const,
        employmentStatus: 'employed' as const, employer: '', occupation: '',
        hasSpouse: false, dependents: [], createdAt: '', updatedAt: '',
      };
      const income = [{ id: '1', name: 'Salary', type: 'salary' as const, annualAmount: 100000, frequency: 'annually' as const, isTaxable: true, isActive: true }];

      const result = calculateFullTaxSituation(personalInfo, income, []);
      expect(result.adjustedGrossIncome).toBe(100000);
      expect(result.federalTaxLiability).toBeGreaterThan(0);
      expect(result.effectiveTaxRate).toBeGreaterThan(0);
      expect(result.effectiveTaxRate).toBeLessThan(0.37);
      expect(result.totalTaxLiability).toBeGreaterThan(result.federalTaxLiability); // includes FICA + state
    });

    it('uses standard deduction when no itemized amounts', () => {
      const personalInfo = {
        id: '1', firstName: 'T', lastName: 'U', dateOfBirth: '1990-01-01',
        email: '', phone: '', state: 'TX', filingStatus: 'single' as const,
        employmentStatus: 'employed' as const, employer: '', occupation: '',
        hasSpouse: false, dependents: [], createdAt: '', updatedAt: '',
      };
      const income = [{ id: '1', name: 'Salary', type: 'salary' as const, annualAmount: 80000, frequency: 'annually' as const, isTaxable: true, isActive: true }];

      const result = calculateFullTaxSituation(personalInfo, income, []);
      // Taxable income = 80000 - 15000 standard deduction = 65000
      expect(result.taxableIncome).toBe(80000 - STANDARD_DEDUCTIONS_2025.single);
    });
  });
});
