// ============================================================================
// Retirement Planning Engine
// Social Security estimation, retirement projections, gap analysis
// ============================================================================

import {
  RetirementPlan, SocialSecurityEstimate, RetirementAccount,
  IncomeSource, Asset, PersonalInfo
} from '../types';
import { SOCIAL_SECURITY_2025, PLANNING_ASSUMPTIONS, BENCHMARKS } from '../constants';

export function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function estimateSocialSecurity(
  currentAge: number,
  currentAnnualIncome: number,
  yearsWorked: number = 20
): SocialSecurityEstimate {
  // Simplified PIA estimation based on AIME
  // Average Indexed Monthly Earnings over 35 highest-earning years
  const aime = Math.min(currentAnnualIncome, 176100) / 12;

  // PIA bend points (2025 approximation)
  let pia = 0;
  if (aime <= 1174) {
    pia = aime * 0.90;
  } else if (aime <= 7078) {
    pia = 1174 * 0.90 + (aime - 1174) * 0.32;
  } else {
    pia = 1174 * 0.90 + (7078 - 1174) * 0.32 + (aime - 7078) * 0.15;
  }

  // Adjust for years worked (less than 35 years means zeros averaged in)
  const yearsFactored = Math.min(yearsWorked, 35);
  const yearAdjustment = yearsFactored / 35;
  pia = pia * yearAdjustment;

  // Cap at maximum benefit
  pia = Math.min(pia, SOCIAL_SECURITY_2025.maxMonthlyBenefit2025);

  const fra = SOCIAL_SECURITY_2025.fullRetirementAge;

  // Early claiming reduction (at age 62)
  const monthsEarly = (fra - 62) * 12;
  const earlyReduction = monthsEarly <= 36
    ? monthsEarly * SOCIAL_SECURITY_2025.earlyReductionPerMonth
    : 36 * SOCIAL_SECURITY_2025.earlyReductionPerMonth + (monthsEarly - 36) * SOCIAL_SECURITY_2025.earlyReductionPerMonthAfter36;

  // Delayed credits (up to age 70)
  const delayedYears = 70 - fra;
  const delayedCredits = delayedYears * SOCIAL_SECURITY_2025.delayedCreditsPerYear;

  return {
    estimatedMonthlyAt62: Math.round(pia * (1 - earlyReduction)),
    estimatedMonthlyAtFRA: Math.round(pia),
    estimatedMonthlyAt70: Math.round(pia * (1 + delayedCredits)),
    fullRetirementAge: fra,
    claimingAge: fra, // Default to FRA
    spousalBenefit: Math.round(pia * 0.5), // 50% of worker PIA
  };
}

export function projectRetirementSavings(
  currentBalance: number,
  annualContribution: number,
  employerMatch: number,
  expectedReturn: number,
  yearsToRetirement: number,
  inflationRate: number = PLANNING_ASSUMPTIONS.inflation
): number {
  let balance = currentBalance;
  const totalAnnualContribution = annualContribution + employerMatch;

  for (let year = 0; year < yearsToRetirement; year++) {
    balance = balance * (1 + expectedReturn) + totalAnnualContribution;
  }

  return balance;
}

export function projectRetirementSavingsYearByYear(
  currentBalance: number,
  annualContribution: number,
  employerMatch: number,
  expectedReturn: number,
  yearsToRetirement: number
): { year: number; balance: number; contributions: number; growth: number }[] {
  const projections = [];
  let balance = currentBalance;
  let totalContributions = currentBalance;
  const currentYear = new Date().getFullYear();
  const totalAnnualContribution = annualContribution + employerMatch;

  for (let year = 0; year <= yearsToRetirement; year++) {
    projections.push({
      year: currentYear + year,
      balance: Math.round(balance),
      contributions: Math.round(totalContributions),
      growth: Math.round(balance - totalContributions),
    });
    const growth = balance * expectedReturn;
    balance += growth + totalAnnualContribution;
    totalContributions += totalAnnualContribution;
  }

  return projections;
}

export function calculateRetirementIncome(
  retirementFund: number,
  withdrawalRate: number,
  socialSecurityMonthly: number,
  pensionMonthly: number,
  otherMonthly: number
): number {
  const investmentIncome = retirementFund * withdrawalRate;
  const ssAnnual = socialSecurityMonthly * 12;
  const pensionAnnual = pensionMonthly * 12;
  const otherAnnual = otherMonthly * 12;
  return investmentIncome + ssAnnual + pensionAnnual + otherAnnual;
}

export function calculateRetirementGap(
  desiredAnnualIncome: number,
  projectedAnnualIncome: number
): number {
  return desiredAnnualIncome - projectedAnnualIncome;
}

export function calculateAdditionalSavingsNeeded(
  retirementGap: number,
  yearsToRetirement: number,
  expectedReturn: number,
  withdrawalRate: number
): number {
  if (retirementGap <= 0) return 0;

  // Amount needed to fund the gap
  const additionalFundNeeded = retirementGap / withdrawalRate;

  // PMT formula: how much per month to reach that target
  const monthlyRate = expectedReturn / 12;
  const totalMonths = yearsToRetirement * 12;

  if (monthlyRate === 0) return additionalFundNeeded / totalMonths;

  const pmt = (additionalFundNeeded * monthlyRate) /
    (Math.pow(1 + monthlyRate, totalMonths) - 1);

  return Math.max(0, pmt * 12); // Annual amount
}

export function runMonteCarlo(
  currentBalance: number,
  annualContribution: number,
  yearsToRetirement: number,
  yearsInRetirement: number,
  annualWithdrawal: number,
  simulations: number = 1000
): { successRate: number; medianBalance: number; percentile10: number; percentile90: number } {
  const results: number[] = [];
  const meanReturn = 0.07;
  const stdDev = 0.15;

  for (let sim = 0; sim < simulations; sim++) {
    let balance = currentBalance;

    // Accumulation phase
    for (let year = 0; year < yearsToRetirement; year++) {
      const annualReturn = meanReturn + stdDev * gaussianRandom();
      balance = balance * (1 + annualReturn) + annualContribution;
    }

    // Distribution phase
    let survived = true;
    for (let year = 0; year < yearsInRetirement; year++) {
      const annualReturn = meanReturn - 0.01 + (stdDev * 0.8) * gaussianRandom(); // Slightly more conservative in retirement
      balance = balance * (1 + annualReturn) - annualWithdrawal * Math.pow(1 + PLANNING_ASSUMPTIONS.inflation, year);
      if (balance <= 0) {
        survived = false;
        break;
      }
    }

    results.push(survived ? balance : 0);
  }

  results.sort((a, b) => a - b);
  const successCount = results.filter(r => r > 0).length;

  return {
    successRate: successCount / simulations,
    medianBalance: results[Math.floor(simulations * 0.5)],
    percentile10: results[Math.floor(simulations * 0.1)],
    percentile90: results[Math.floor(simulations * 0.9)],
  };
}

// Box-Muller transform for Gaussian random numbers
function gaussianRandom(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export function getRetirementReadinessScore(fundedRatio: number): {
  score: number;
  status: string;
  color: string;
} {
  if (fundedRatio >= 1.0) return { score: 100, status: 'On Track', color: '#10b981' };
  if (fundedRatio >= 0.8) return { score: 80, status: 'Nearly There', color: '#3b82f6' };
  if (fundedRatio >= 0.6) return { score: 60, status: 'Needs Attention', color: '#f59e0b' };
  if (fundedRatio >= 0.4) return { score: 40, status: 'Behind Schedule', color: '#f97316' };
  return { score: Math.max(10, Math.round(fundedRatio * 100)), status: 'Critical Gap', color: '#ef4444' };
}


export function analyzeSocialSecurityClaiming(
  currentAge: number,
  annualIncome: number,
  yearsWorked: number,
  hasSpouse: boolean = false,
  spouseIncome: number = 0
): {
  claimingScenarios: { claimingAge: number; monthlyBenefit: number; lifetimeBenefitAt80: number; lifetimeBenefitAt85: number; lifetimeBenefitAt90: number }[];
  breakeven62vsFRA: number;
  breakevenFRAvsAge70: number;
  recommendedClaimingAge: number;
  spousalStrategy?: string;
} {
  const ssEstimate = estimateSocialSecurity(currentAge, annualIncome, yearsWorked);
  
  const scenarios = [
    { claimingAge: 62, monthlyBenefit: ssEstimate.estimatedMonthlyAt62 },
    { claimingAge: ssEstimate.fullRetirementAge, monthlyBenefit: ssEstimate.estimatedMonthlyAtFRA },
    { claimingAge: 70, monthlyBenefit: ssEstimate.estimatedMonthlyAt70 },
  ].map(s => {
    const annual = s.monthlyBenefit * 12;
    return {
      ...s,
      lifetimeBenefitAt80: annual * Math.max(0, 80 - s.claimingAge),
      lifetimeBenefitAt85: annual * Math.max(0, 85 - s.claimingAge),
      lifetimeBenefitAt90: annual * Math.max(0, 90 - s.claimingAge),
    };
  });

  // Breakeven: when cumulative benefits from later claiming exceed earlier claiming
  const fra = ssEstimate.fullRetirementAge;
  const monthly62 = ssEstimate.estimatedMonthlyAt62;
  const monthlyFRA = ssEstimate.estimatedMonthlyAtFRA;
  const monthly70 = ssEstimate.estimatedMonthlyAt70;

  // Breakeven 62 vs FRA
  const monthsDeferred62 = (fra - 62) * 12;
  const lostBenefits62 = monthly62 * monthsDeferred62;
  const monthlyGain62 = monthlyFRA - monthly62;
  const breakeven62vsFRA = monthlyGain62 > 0 ? Math.round(fra + lostBenefits62 / (monthlyGain62 * 12)) : 100;

  // Breakeven FRA vs 70
  const monthsDeferredFRA = (70 - fra) * 12;
  const lostBenefitsFRA = monthlyFRA * monthsDeferredFRA;
  const monthlyGainFRA = monthly70 - monthlyFRA;
  const breakevenFRAvsAge70 = monthlyGainFRA > 0 ? Math.round(70 + lostBenefitsFRA / (monthlyGainFRA * 12)) : 100;

  // Recommendation based on life expectancy
  let recommendedClaimingAge = fra;
  if (breakeven62vsFRA > 85) recommendedClaimingAge = 62;
  else if (breakevenFRAvsAge70 <= 82) recommendedClaimingAge = 70;

  let spousalStrategy: string | undefined;
  if (hasSpouse) {
    if (spouseIncome > annualIncome * 0.5) {
      spousalStrategy = 'Both spouses have significant income. Consider having the lower earner claim at 62 and the higher earner delay to 70 for maximum survivor benefit.';
    } else {
      spousalStrategy = 'Consider having the primary earner delay claiming to maximize both retirement and survivor benefits. Spouse may be eligible for spousal benefit (up to 50% of primary PIA).';
    }
  }

  return { claimingScenarios: scenarios, breakeven62vsFRA, breakevenFRAvsAge70, recommendedClaimingAge, spousalStrategy };
}

export function buildRetirementPlan(
  personalInfo: PersonalInfo,
  incomeSources: IncomeSource[],
  retirementAssets: Asset[],
  targetRetirementAge: number = 65,
  desiredIncomeReplacementRatio: number = 0.80
): RetirementPlan {
  const currentAge = calculateAge(personalInfo.dateOfBirth);
  const yearsToRetirement = Math.max(0, targetRetirementAge - currentAge);
  const lifeExpectancy = PLANNING_ASSUMPTIONS.lifeExpectancy;
  const yearsInRetirement = lifeExpectancy - targetRetirementAge;

  const currentAnnualIncome = incomeSources.reduce((sum, s) => sum + s.annualAmount, 0);
  const desiredAnnualIncome = currentAnnualIncome * desiredIncomeReplacementRatio;
  const inflationAdjustedNeed = desiredAnnualIncome * Math.pow(1 + PLANNING_ASSUMPTIONS.inflation, yearsToRetirement);

  // Social Security estimate
  const yearsWorked = Math.max(0, currentAge - 22);
  const socialSecurityEstimate = estimateSocialSecurity(currentAge, currentAnnualIncome, yearsWorked);

  // Current retirement savings
  const currentRetirementSavings = retirementAssets.reduce((sum, a) => sum + a.currentValue, 0);
  const annualContributions = retirementAssets.reduce((sum, a) => sum + (a.annualContribution || 0), 0) || currentAnnualIncome * 0.10;
  const employerMatch = retirementAssets.reduce((sum, a) => sum + (a.employerMatchAmount || 0), 0);

  // Project retirement fund
  const expectedReturn = PLANNING_ASSUMPTIONS.balancedReturn;
  const projectedRetirementFund = projectRetirementSavings(
    currentRetirementSavings,
    annualContributions,
    employerMatch,
    expectedReturn,
    yearsToRetirement
  );

  // Withdrawal strategy
  const withdrawalRate = PLANNING_ASSUMPTIONS.safeWithdrawalRate;
  const sustainableWithdrawalAmount = projectedRetirementFund * withdrawalRate;

  // Total projected retirement income
  const projectedAnnualIncome = calculateRetirementIncome(
    projectedRetirementFund,
    withdrawalRate,
    socialSecurityEstimate.estimatedMonthlyAtFRA,
    0, 0
  );

  const retirementGap = calculateRetirementGap(inflationAdjustedNeed, projectedAnnualIncome);
  const fundedRatio = inflationAdjustedNeed > 0 ? projectedAnnualIncome / inflationAdjustedNeed : 0;

  const additionalSavingsNeeded = calculateAdditionalSavingsNeeded(
    retirementGap, yearsToRetirement, expectedReturn, withdrawalRate
  );

  return {
    targetRetirementAge,
    currentAge,
    yearsToRetirement,
    lifeExpectancy,
    yearsInRetirement,
    desiredAnnualIncome,
    incomeReplacementRatio: desiredIncomeReplacementRatio,
    inflationAdjustedNeed,
    socialSecurityEstimate,
    pensionIncome: 0,
    annuityIncome: 0,
    currentRetirementSavings,
    annualContributions,
    employerMatch,
    projectedRetirementFund: Math.round(projectedRetirementFund),
    retirementGap: Math.round(retirementGap),
    fundedRatio: Math.round(fundedRatio * 100) / 100,
    additionalSavingsNeeded: Math.round(additionalSavingsNeeded),
    withdrawalRate,
    sustainableWithdrawalAmount: Math.round(sustainableWithdrawalAmount),
  };
}
