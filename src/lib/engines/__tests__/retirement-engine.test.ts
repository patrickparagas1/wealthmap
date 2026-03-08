import { describe, it, expect } from 'vitest';
import { calculateAge, estimateSocialSecurity, projectRetirementSavings, runMonteCarlo } from '../retirement-engine';
import { SOCIAL_SECURITY_2025 } from '../../constants';

describe('Retirement Engine', () => {
  describe('calculateAge', () => {
    it('calculates age correctly', () => {
      const today = new Date();
      const tenYearsAgo = new Date(today.getFullYear() - 30, today.getMonth(), today.getDate());
      const dob = tenYearsAgo.toISOString().split('T')[0];
      expect(calculateAge(dob)).toBe(30);
    });

    it('handles birthday not yet reached this year', () => {
      const today = new Date();
      // Set DOB to next month, 25 years ago
      const futureMonth = today.getMonth() + 2 > 11 ? 0 : today.getMonth() + 2;
      const year = futureMonth < today.getMonth() ? today.getFullYear() - 24 : today.getFullYear() - 25;
      const dob = `${year}-${String(futureMonth + 1).padStart(2, '0')}-15`;
      const age = calculateAge(dob);
      expect(age).toBe(24);
    });
  });

  describe('estimateSocialSecurity', () => {
    it('follows PIA bend points', () => {
      // $20k/yr earner: AIME = 20000/12 = 1666.67
      // Bend points: first $1174 at 90%, $1174-$7078 at 32%
      // PIA = 1174*0.90 + (1666.67-1174)*0.32 = 1056.6 + 157.65 = 1214.25
      const lowEarner = estimateSocialSecurity(62, 20000, 35);
      const aime = 20000 / 12;
      const expectedPIA = 1174 * 0.90 + (aime - 1174) * 0.32;
      expect(lowEarner.estimatedMonthlyAtFRA).toBe(Math.round(expectedPIA));
    });

    it('caps at max monthly benefit', () => {
      const highEarner = estimateSocialSecurity(45, 500000, 35);
      expect(highEarner.estimatedMonthlyAtFRA).toBeLessThanOrEqual(SOCIAL_SECURITY_2025.maxMonthlyBenefit2025);
    });

    it('applies early claiming reduction at 62', () => {
      const ss = estimateSocialSecurity(45, 100000, 35);
      expect(ss.estimatedMonthlyAt62).toBeLessThan(ss.estimatedMonthlyAtFRA);
    });

    it('provides delayed credits at 70', () => {
      const ss = estimateSocialSecurity(45, 100000, 35);
      expect(ss.estimatedMonthlyAt70).toBeGreaterThan(ss.estimatedMonthlyAtFRA);
    });

    it('adjusts for fewer than 35 years worked', () => {
      const full = estimateSocialSecurity(45, 100000, 35);
      const partial = estimateSocialSecurity(45, 100000, 20);
      expect(partial.estimatedMonthlyAtFRA).toBeLessThan(full.estimatedMonthlyAtFRA);
    });

    it('calculates spousal benefit at 50% of PIA', () => {
      const ss = estimateSocialSecurity(45, 100000, 35);
      expect(ss.spousalBenefit).toBe(Math.round(ss.estimatedMonthlyAtFRA * 0.5));
    });
  });

  describe('projectRetirementSavings', () => {
    it('grows savings with compound interest', () => {
      const result = projectRetirementSavings(100000, 10000, 5000, 0.07, 20);
      // Should be more than just contributions
      expect(result).toBeGreaterThan(100000 + 15000 * 20);
    });

    it('returns current balance when years is 0', () => {
      const result = projectRetirementSavings(100000, 10000, 5000, 0.07, 0);
      expect(result).toBe(100000);
    });
  });

  describe('runMonteCarlo', () => {
    it('produces reasonable success rates for well-funded scenario', () => {
      const result = runMonteCarlo(1000000, 50000, 20, 25, 60000);
      expect(result.successRate).toBeGreaterThan(0);
      expect(result.successRate).toBeLessThanOrEqual(100);
      expect(result.medianBalance).toBeGreaterThan(0);
    });

    it('produces lower success rate for underfunded scenario', () => {
      const underfunded = runMonteCarlo(10000, 1000, 5, 30, 80000);
      const wellFunded = runMonteCarlo(2000000, 100000, 20, 25, 60000);
      expect(underfunded.successRate).toBeLessThan(wellFunded.successRate);
    });

    it('returns percentile values in correct order', () => {
      const result = runMonteCarlo(500000, 30000, 15, 20, 50000);
      expect(result.percentile10).toBeLessThanOrEqual(result.medianBalance);
      expect(result.medianBalance).toBeLessThanOrEqual(result.percentile90);
    });
  });
});
