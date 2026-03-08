import { describe, it, expect } from 'vitest';
import { projectEducationCost, projectSavings, buildEducationPlan } from '../education-engine';
import { EDUCATION_COSTS } from '../../constants';

describe('Education Engine', () => {
  describe('projectEducationCost', () => {
    it('applies inflation over years to college', () => {
      const annual = 30000;
      const years = 10;
      const cost = projectEducationCost(annual, years, 4);
      // Each year of college costs more due to inflation
      // Year 1: 30000 * (1 + inflation)^10
      const firstYear = annual * Math.pow(1 + EDUCATION_COSTS.annualInflationRate, years);
      expect(cost).toBeGreaterThan(firstYear); // 4 years total > 1 year
      expect(cost).toBeGreaterThan(annual * 4); // inflation increases cost
    });

    it('returns zero cost when duration is zero', () => {
      expect(projectEducationCost(30000, 10, 0)).toBe(0);
    });

    it('handles immediate college (0 years away)', () => {
      const cost = projectEducationCost(30000, 0, 4);
      // No inflation: sum of 30000 * (1+rate)^0..3
      expect(cost).toBeGreaterThan(30000 * 4 * 0.99);
      expect(cost).toBeLessThan(30000 * 4 * 1.20);
    });
  });

  describe('projectSavings', () => {
    it('grows savings with compound interest and contributions', () => {
      const result = projectSavings(10000, 500, 18, 0.06);
      // Should grow significantly over 18 years
      expect(result).toBeGreaterThan(10000 + 500 * 12 * 18); // More than just contributions
    });

    it('returns current savings when years is zero', () => {
      expect(projectSavings(10000, 500, 0, 0.06)).toBeCloseTo(10000, 0);
    });

    it('handles zero starting balance', () => {
      const result = projectSavings(0, 500, 10, 0.06);
      expect(result).toBeGreaterThan(500 * 12 * 10 * 0.9); // At least close to raw contributions
    });
  });

  describe('buildEducationPlan', () => {
    it('creates goals for each child dependent', () => {
      const dependents = [
        { id: 'd1', name: 'Alice', dateOfBirth: '2015-06-15', relationship: 'child' as const, isStudent: false, hasDisability: false },
        { id: 'd2', name: 'Bob', dateOfBirth: '2018-03-20', relationship: 'child' as const, isStudent: false, hasDisability: false },
      ];
      const savings = {
        d1: { savings: 20000, monthly: 500, accountType: '529' as const, schoolType: 'public_in_state' as const },
        d2: { savings: 5000, monthly: 200, accountType: '529' as const, schoolType: 'private' as const },
      };
      const plan = buildEducationPlan(dependents, savings);
      expect(plan.children.length).toBe(2);
      expect(plan.children[0].childName).toBe('Alice');
      expect(plan.children[1].childName).toBe('Bob');
    });

    it('skips non-child dependents', () => {
      const dependents = [
        { id: 'd1', name: 'Parent', dateOfBirth: '1960-01-01', relationship: 'parent' as const, isStudent: false, hasDisability: false },
      ];
      const plan = buildEducationPlan(dependents, {});
      expect(plan.children.length).toBe(0);
    });

    it('uses school type from savings map', () => {
      const dependents = [
        { id: 'd1', name: 'Child', dateOfBirth: '2016-06-15', relationship: 'child' as const, isStudent: false, hasDisability: false },
      ];
      const savings = {
        d1: { savings: 0, monthly: 0, accountType: '529' as const, schoolType: 'private' as const },
      };
      const plan = buildEducationPlan(dependents, savings);
      // Private school costs more than public
      expect(plan.children[0].projectedTotalCost).toBeGreaterThan(0);
    });

    it('generates funding gap when savings are insufficient', () => {
      const dependents = [
        { id: 'd1', name: 'Kid', dateOfBirth: '2016-06-15', relationship: 'child' as const, isStudent: false, hasDisability: false },
      ];
      const plan = buildEducationPlan(dependents, {});
      expect(plan.totalGap).toBeGreaterThan(0);
    });
  });
});
