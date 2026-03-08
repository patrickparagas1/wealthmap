// ============================================================================
// Insurance & Risk Management Engine
// Life insurance needs, disability analysis, coverage gap analysis
// ============================================================================

import {
  InsuranceNeedsAnalysis, InsurancePolicy, InsuranceRecommendation,
  PersonalInfo, IncomeSource, Liability, Asset, Dependent
} from '../types';
import { LIFE_INSURANCE_MULTIPLIER, DISABILITY_REPLACEMENT_RATIO } from '../constants';
import { calculateAge } from './retirement-engine';

export function calculateLifeInsuranceNeed(
  annualIncome: number,
  spouseIncome: number,
  totalLiabilities: number,
  futureLiabilities: number, // education costs, etc.
  liquidAssets: number,
  existingCoverage: number,
  dependents: Dependent[],
  yearsOfIncomeNeeded: number = 10
): { need: number; coverage: number; gap: number; method: string; breakdown: Record<string, number> } {
  // Human Life Value Method (Income replacement approach)
  const incomeNeed = annualIncome * yearsOfIncomeNeeded;

  // DIME Method: Debt + Income + Mortgage + Education
  const debtPayoff = totalLiabilities;
  const educationFund = dependents.filter(d => d.relationship === 'child').length * 100000; // $100k per child estimate
  const finalExpenses = 15000; // Funeral, estate settlement

  const totalNeed = incomeNeed + debtPayoff + educationFund + finalExpenses + futureLiabilities;
  const adjustedNeed = totalNeed - liquidAssets - spouseIncome * yearsOfIncomeNeeded * 0.5;

  const need = Math.max(0, adjustedNeed);
  const gap = Math.max(0, need - existingCoverage);

  return {
    need: Math.round(need),
    coverage: existingCoverage,
    gap: Math.round(gap),
    method: 'Income Replacement + DIME',
    breakdown: {
      incomeReplacement: Math.round(incomeNeed),
      debtPayoff: Math.round(debtPayoff),
      educationFund: Math.round(educationFund),
      finalExpenses,
      lessLiquidAssets: -Math.round(liquidAssets),
      lessSpouseIncome: -Math.round(spouseIncome * yearsOfIncomeNeeded * 0.5),
    },
  };
}

export function calculateDisabilityNeed(
  annualIncome: number,
  existingCoverage: number, // Monthly benefit from employer/existing policies
  monthlyExpenses: number
): { monthlyNeed: number; currentCoverage: number; gap: number } {
  const monthlyIncome = annualIncome / 12;
  const monthlyNeed = monthlyIncome * DISABILITY_REPLACEMENT_RATIO;
  const gap = Math.max(0, monthlyNeed - existingCoverage);

  return {
    monthlyNeed: Math.round(monthlyNeed),
    currentCoverage: existingCoverage,
    gap: Math.round(gap),
  };
}

export function analyzeInsuranceNeeds(
  personalInfo: PersonalInfo,
  incomeSources: IncomeSource[],
  assets: Asset[],
  liabilities: Liability[],
  policies: InsurancePolicy[]
): InsuranceNeedsAnalysis {
  const age = calculateAge(personalInfo.dateOfBirth);
  const annualIncome = incomeSources
    .filter(s => s.owner === 'client' || s.owner === 'joint')
    .reduce((sum, s) => sum + s.annualAmount, 0);
  const spouseIncome = incomeSources
    .filter(s => s.owner === 'spouse')
    .reduce((sum, s) => sum + s.annualAmount, 0);
  const totalLiabilities = liabilities.reduce((sum, l) => sum + l.currentBalance, 0);
  const liquidAssets = assets
    .filter(a => a.category === 'cash')
    .reduce((sum, a) => sum + a.currentValue, 0);

  // Life insurance analysis
  const lifePolicies = policies.filter(p => p.type === 'life');
  const existingLifeCoverage = lifePolicies.reduce((sum, p) => sum + p.coverageAmount, 0);
  const lifeAnalysis = calculateLifeInsuranceNeed(
    annualIncome, spouseIncome, totalLiabilities, 0,
    liquidAssets, existingLifeCoverage, personalInfo.dependents || []
  );

  // Disability analysis
  const disabilityPolicies = policies.filter(p => p.type === 'disability');
  const existingDisabilityCoverage = disabilityPolicies.reduce((sum, p) => sum + (p.benefitAmount || 0), 0);
  const disabilityAnalysis = calculateDisabilityNeed(annualIncome, existingDisabilityCoverage, 0);

  // Long-term care need
  const ltcNeed = age >= 40 ? 200000 : 0; // Start considering at 40

  // Umbrella recommendation
  const totalAssets = assets.reduce((sum, a) => sum + a.currentValue, 0);
  const umbrellaRecommendation = totalAssets > 500000 ? Math.ceil(totalAssets / 1000000) * 1000000 : 0;

  // Generate recommendations
  const recommendations: InsuranceRecommendation[] = [];

  if (lifeAnalysis.gap > 0 && (personalInfo.hasSpouse || (personalInfo.dependents || []).length > 0)) {
    recommendations.push({
      id: 'life_gap',
      type: 'life',
      priority: 'critical',
      title: `Life Insurance Gap: $${(lifeAnalysis.gap / 1000).toFixed(0)}K Coverage Needed`,
      description: `Based on income replacement, debt payoff, and education funding, you need $${lifeAnalysis.need.toLocaleString()} in coverage but only have $${existingLifeCoverage.toLocaleString()}. A ${age < 50 ? '20-year' : '10-year'} term policy would be most cost-effective.`,
      estimatedCost: `$${Math.round(lifeAnalysis.gap / 1000 * (age < 40 ? 0.5 : age < 50 ? 0.8 : 1.5))}/month`,
    });
  }

  if (disabilityAnalysis.gap > 0) {
    recommendations.push({
      id: 'disability_gap',
      type: 'disability',
      priority: 'high',
      title: 'Insufficient Disability Coverage',
      description: `You need $${disabilityAnalysis.monthlyNeed.toLocaleString()}/month in disability coverage but only have $${disabilityAnalysis.currentCoverage.toLocaleString()}/month. Consider an own-occupation long-term disability policy.`,
      estimatedCost: `$${Math.round(annualIncome * 0.02 / 12)}/month (est. 1-3% of income)`,
    });
  }

  if (age >= 50 && !policies.some(p => p.type === 'long_term_care')) {
    recommendations.push({
      id: 'ltc',
      type: 'long_term_care',
      priority: 'medium',
      title: 'Consider Long-Term Care Insurance',
      description: 'At your age, long-term care insurance becomes increasingly important. The average cost of a nursing home is over $100K/year. Consider a hybrid life/LTC policy for flexibility.',
      estimatedCost: '$200-500/month depending on coverage',
    });
  }

  if (umbrellaRecommendation > 0 && !policies.some(p => p.type === 'umbrella')) {
    recommendations.push({
      id: 'umbrella',
      type: 'umbrella',
      priority: 'medium',
      title: `Consider $${(umbrellaRecommendation / 1000000).toFixed(0)}M Umbrella Policy`,
      description: `With $${totalAssets.toLocaleString()} in total assets, an umbrella liability policy provides crucial protection against lawsuits that exceed your auto/home policy limits.`,
      estimatedCost: `$${Math.round(umbrellaRecommendation / 1000000 * 300)}/year`,
    });
  }

  // Check for missing essential coverage
  if (!policies.some(p => p.type === 'health')) {
    recommendations.push({
      id: 'health',
      type: 'health',
      priority: 'critical',
      title: 'Health Insurance Required',
      description: 'No health insurance policy found. Health insurance is essential to protect against catastrophic medical costs.',
      estimatedCost: 'Varies by plan',
    });
  }

  return {
    lifeInsuranceNeed: lifeAnalysis.need,
    currentLifeCoverage: existingLifeCoverage,
    lifeInsuranceGap: lifeAnalysis.gap,
    disabilityNeed: disabilityAnalysis.monthlyNeed,
    currentDisabilityCoverage: disabilityAnalysis.currentCoverage,
    disabilityGap: disabilityAnalysis.gap,
    longTermCareNeed: ltcNeed,
    umbrellaRecommendation,
    recommendations,
  };
}
