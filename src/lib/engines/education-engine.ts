// ============================================================================
// Education Planning Engine
// 529 planning, cost projections, funding gap analysis
// ============================================================================

import {
  EducationPlan, EducationGoal, EducationRecommendation, Dependent
} from '../types';
import { EDUCATION_COSTS, PLANNING_ASSUMPTIONS } from '../constants';
import { calculateAge } from './retirement-engine';

export function projectEducationCost(
  annualCostToday: number,
  yearsToCollege: number,
  collegeDuration: number = 4,
  inflationRate: number = EDUCATION_COSTS.annualInflationRate
): number {
  let totalCost = 0;
  for (let year = 0; year < collegeDuration; year++) {
    totalCost += annualCostToday * Math.pow(1 + inflationRate, yearsToCollege + year);
  }
  return totalCost;
}

export function projectSavings(
  currentSavings: number,
  monthlyContribution: number,
  yearsToGoal: number,
  expectedReturn: number = 0.06
): number {
  const monthlyRate = expectedReturn / 12;
  const totalMonths = yearsToGoal * 12;

  // Future value of current savings
  const fvCurrent = currentSavings * Math.pow(1 + monthlyRate, totalMonths);

  // Future value of annuity (monthly contributions)
  const fvContributions = monthlyRate > 0
    ? monthlyContribution * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate)
    : monthlyContribution * totalMonths;

  return fvCurrent + fvContributions;
}

export function calculateMonthlySavingsNeeded(
  targetAmount: number,
  currentSavings: number,
  yearsToGoal: number,
  expectedReturn: number = 0.06
): number {
  const monthlyRate = expectedReturn / 12;
  const totalMonths = yearsToGoal * 12;

  // How much the current savings will grow to
  const fvCurrent = currentSavings * Math.pow(1 + monthlyRate, totalMonths);
  const remainingNeed = Math.max(0, targetAmount - fvCurrent);

  if (monthlyRate === 0 || totalMonths === 0) {
    return totalMonths > 0 ? remainingNeed / totalMonths : remainingNeed;
  }

  // PMT to reach remaining need
  return remainingNeed * monthlyRate / (Math.pow(1 + monthlyRate, totalMonths) - 1);
}

export function getAnnualCostByType(schoolType: EducationGoal['schoolType']): number {
  return EDUCATION_COSTS[schoolType];
}

export function buildEducationGoal(
  childName: string,
  dateOfBirth: string,
  schoolType: EducationGoal['schoolType'] = 'public_in_state',
  currentSavings: number = 0,
  monthlyContribution: number = 0,
  accountType: EducationGoal['accountType'] = '529'
): EducationGoal {
  const currentAge = calculateAge(dateOfBirth);
  const yearsToCollege = Math.max(0, 18 - currentAge);
  const collegeDuration = schoolType === 'community_college' ? 2 : schoolType === 'trade_school' ? 2 : 4;
  const annualCostToday = getAnnualCostByType(schoolType);
  const projectedTotalCost = projectEducationCost(annualCostToday, yearsToCollege, collegeDuration);

  // Use a more conservative return for education savings (shorter time horizon)
  const expectedReturn = yearsToCollege > 10 ? 0.07 : yearsToCollege > 5 ? 0.05 : 0.03;
  const projectedSavings = projectSavings(currentSavings, monthlyContribution, yearsToCollege, expectedReturn);
  const gap = Math.max(0, projectedTotalCost - projectedSavings);
  const fundedPercent = projectedTotalCost > 0 ? Math.min(100, (projectedSavings / projectedTotalCost) * 100) : 0;

  return {
    id: `edu_${childName.toLowerCase().replace(/\s/g, '_')}`,
    childName,
    currentAge,
    yearsToCollege,
    collegeDuration,
    schoolType,
    annualCostToday,
    projectedTotalCost: Math.round(projectedTotalCost),
    currentSavings,
    monthlyContribution,
    accountType,
    projectedSavings: Math.round(projectedSavings),
    gap: Math.round(gap),
    fundedPercent: Math.round(fundedPercent * 10) / 10,
  };
}

export function buildEducationPlan(
  dependents: Dependent[],
  existingSavings: Record<string, { savings: number; monthly: number; accountType: EducationGoal['accountType']; schoolType?: EducationGoal['schoolType'] }> = {}
): EducationPlan {
  const children = dependents
    .filter(d => d.relationship === 'child')
    .map(d => {
      const saved = existingSavings[d.id] || { savings: 0, monthly: 0, accountType: '529' as const };
      const schoolType = (saved as any).schoolType as EducationGoal['schoolType'] || 'public_in_state';
      return buildEducationGoal(
        d.name,
        d.dateOfBirth,
        schoolType,
        saved.savings,
        saved.monthly,
        saved.accountType
      );
    });

  const totalProjectedCost = children.reduce((sum, c) => sum + c.projectedTotalCost, 0);
  const totalCurrentSavings = children.reduce((sum, c) => sum + c.currentSavings, 0);
  const totalGap = children.reduce((sum, c) => sum + c.gap, 0);

  // Generate recommendations
  const recommendations: EducationRecommendation[] = [];

  for (const child of children) {
    if (child.gap > 0 && child.yearsToCollege > 0) {
      const monthlySavingsNeeded = calculateMonthlySavingsNeeded(
        child.projectedTotalCost,
        child.currentSavings,
        child.yearsToCollege
      );

      recommendations.push({
        id: `rec_${child.id}`,
        priority: child.yearsToCollege < 5 ? 'high' : 'medium',
        title: `Increase Savings for ${child.childName}`,
        description: `${child.childName}'s education is projected to cost $${child.projectedTotalCost.toLocaleString()}, but current trajectory only covers $${child.projectedSavings.toLocaleString()} (${child.fundedPercent}%). ${child.accountType === 'none' ? 'Consider opening a 529 plan for tax-advantaged savings.' : ''}`,
        monthlySavingsNeeded: Math.round(monthlySavingsNeeded),
      });
    }
  }

  // General 529 recommendation
  if (children.some(c => c.accountType === 'none' || c.accountType === 'savings')) {
    recommendations.push({
      id: 'rec_529',
      priority: 'high',
      title: 'Open 529 Education Savings Plan',
      description: '529 plans offer tax-free growth and withdrawals for qualified education expenses. Many states also offer a state income tax deduction for contributions.',
      monthlySavingsNeeded: 0,
    });
  }

  return {
    children,
    totalProjectedCost: Math.round(totalProjectedCost),
    totalCurrentSavings,
    totalGap: Math.round(totalGap),
    recommendations,
  };
}
