// ============================================================================
// Tax Planning Engine
// Calculates federal tax liability, marginal/effective rates, strategies
// ============================================================================

import {
  FilingStatus, TaxSituation, ItemizedDeductions, TaxCredit, TaxStrategy,
  IncomeSource, Expense, Dependent, PersonalInfo
} from '../types';
import {
  FEDERAL_TAX_BRACKETS_2025, STANDARD_DEDUCTIONS_2025, FICA_2025,
  LONG_TERM_CAPITAL_GAINS_BRACKETS, NIIT_THRESHOLDS, RETIREMENT_LIMITS_2025
} from '../constants';
import { calculateStateTax } from './state-tax-data';

export function calculateFederalTax(taxableIncome: number, filingStatus: FilingStatus): number {
  const brackets = FEDERAL_TAX_BRACKETS_2025[filingStatus];
  let tax = 0;
  let remainingIncome = taxableIncome;

  for (const bracket of brackets) {
    const taxableAtBracket = Math.min(remainingIncome, bracket.max - bracket.min);
    if (taxableAtBracket <= 0) break;
    tax += taxableAtBracket * bracket.rate;
    remainingIncome -= taxableAtBracket;
  }

  return Math.max(0, tax);
}

export function getMarginalTaxRate(taxableIncome: number, filingStatus: FilingStatus): number {
  const brackets = FEDERAL_TAX_BRACKETS_2025[filingStatus];
  for (const bracket of brackets) {
    if (taxableIncome <= bracket.max) {
      return bracket.rate;
    }
  }
  return brackets[brackets.length - 1].rate;
}

export function calculateFICA(
  earnings: number,
  isSelfEmployed: boolean,
  filingStatus: FilingStatus
): { socialSecurity: number; medicare: number; total: number } {
  const ssWages = Math.min(earnings, FICA_2025.socialSecurityWageBase);
  const multiplier = isSelfEmployed ? 2 : 1;

  const socialSecurity = ssWages * FICA_2025.socialSecurityRate * multiplier;
  let medicare = earnings * FICA_2025.medicareRate * multiplier;

  // Additional Medicare tax
  const threshold = FICA_2025.additionalMedicareThreshold[
    filingStatus === 'head_of_household' || filingStatus === 'qualifying_widow' ? 'single' : filingStatus
  ] || 200000;

  if (earnings > threshold) {
    medicare += (earnings - threshold) * FICA_2025.additionalMedicareRate;
  }

  // Self-employed deduction for employer half
  const seDeduction = isSelfEmployed ? (socialSecurity + medicare) * 0.5 : 0;

  return {
    socialSecurity,
    medicare,
    total: socialSecurity + medicare - seDeduction,
  };
}

export function calculateItemizedDeductions(
  mortgageInterest: number,
  stateLocalTaxes: number,
  charitableDonations: number,
  medicalExpenses: number,
  agi: number,
  investmentInterest: number = 0,
  other: number = 0
): ItemizedDeductions {
  // SALT cap at $10,000
  const cappedSALT = Math.min(stateLocalTaxes, 10000);
  // Medical expenses: only amount exceeding 7.5% of AGI
  const deductibleMedical = Math.max(0, medicalExpenses - agi * 0.075);

  const total = mortgageInterest + cappedSALT + charitableDonations + deductibleMedical + investmentInterest + other;

  return {
    mortgageInterest,
    stateLocalTaxes: cappedSALT,
    charitableDonations,
    medicalExpenses: deductibleMedical,
    investmentInterest,
    other,
    total,
  };
}

export function calculateCapitalGainsTax(
  capitalGains: number,
  taxableIncome: number,
  filingStatus: FilingStatus
): number {
  if (capitalGains <= 0) return 0;
  const brackets = LONG_TERM_CAPITAL_GAINS_BRACKETS[filingStatus];
  if (!brackets) return capitalGains * 0.15;

  let tax = 0;
  let remainingGains = capitalGains;
  let incomeBase = taxableIncome - capitalGains;

  for (const bracket of brackets) {
    if (incomeBase >= bracket.max) continue;
    const start = Math.max(bracket.min, incomeBase);
    const end = bracket.max;
    const taxableInBracket = Math.min(remainingGains, end - start);
    if (taxableInBracket <= 0) continue;
    tax += taxableInBracket * bracket.rate;
    remainingGains -= taxableInBracket;
    incomeBase += taxableInBracket;
    if (remainingGains <= 0) break;
  }

  // NIIT (3.8%) on investment income above threshold
  const niitThreshold = NIIT_THRESHOLDS[filingStatus] || 200000;
  if (taxableIncome > niitThreshold) {
    const niitableAmount = Math.min(capitalGains, taxableIncome - niitThreshold);
    if (niitableAmount > 0) tax += niitableAmount * 0.038;
  }

  return tax;
}

export function calculateRothConversionBenefit(
  currentAGI: number,
  filingStatus: FilingStatus,
  traditionalIRABalance: number,
  currentAge: number,
  retirementAge: number = 65
): { optimalConversionAmount: number; taxCostNow: number; estimatedFutureSavings: number; netBenefit: number; currentBracketRoom: number } {
  const brackets = FEDERAL_TAX_BRACKETS_2025[filingStatus];
  const standardDeduction = STANDARD_DEDUCTIONS_2025[filingStatus];
  const taxableIncome = Math.max(0, currentAGI - standardDeduction);

  // Find current bracket and room to next bracket
  let currentBracketRoom = 0;
  for (const bracket of brackets) {
    if (taxableIncome <= bracket.max) {
      currentBracketRoom = bracket.max - taxableIncome;
      break;
    }
  }

  // Optimal conversion: fill current bracket (don't jump to next)
  const optimalConversionAmount = Math.min(currentBracketRoom, traditionalIRABalance);
  if (optimalConversionAmount <= 0) {
    return { optimalConversionAmount: 0, taxCostNow: 0, estimatedFutureSavings: 0, netBenefit: 0, currentBracketRoom };
  }

  // Tax cost now at current marginal rate
  const currentRate = getMarginalTaxRate(taxableIncome, filingStatus);
  const taxCostNow = optimalConversionAmount * currentRate;

  // Estimate future tax savings: assume higher bracket in retirement (RMDs + SS)
  const yearsToGrow = Math.max(0, retirementAge - currentAge);
  const growthFactor = Math.pow(1.07, yearsToGrow);
  const futureValue = optimalConversionAmount * growthFactor;
  const estimatedFutureRate = Math.min(currentRate + 0.10, 0.37);
  const estimatedFutureSavings = futureValue * estimatedFutureRate;

  return {
    optimalConversionAmount: Math.round(optimalConversionAmount),
    taxCostNow: Math.round(taxCostNow),
    estimatedFutureSavings: Math.round(estimatedFutureSavings),
    netBenefit: Math.round(estimatedFutureSavings - taxCostNow),
    currentBracketRoom: Math.round(currentBracketRoom),
  };
}

export function calculateFullTaxSituation(
  personalInfo: PersonalInfo,
  incomeSources: IncomeSource[],
  expenses: Expense[],
  retirementContributions: number = 0,
  hsaContributions: number = 0,
  itemizedAmounts?: {
    mortgageInterest: number;
    stateLocalTaxes: number;
    charitable: number;
    medical: number;
  }
): TaxSituation {
  const { filingStatus } = personalInfo;
  const taxYear = new Date().getFullYear();

  // Calculate gross income
  const grossIncome = incomeSources.reduce((sum, s) => sum + s.annualAmount, 0);

  // Calculate AGI (above-the-line deductions)
  const selfEmploymentIncome = incomeSources
    .filter(s => s.type === 'self_employment')
    .reduce((sum, s) => sum + s.annualAmount, 0);

  const seFICA = selfEmploymentIncome > 0
    ? calculateFICA(selfEmploymentIncome, true, filingStatus)
    : { total: 0, socialSecurity: 0, medicare: 0 };

  const aboveLineDeductions = retirementContributions + hsaContributions +
    (selfEmploymentIncome > 0 ? seFICA.total * 0.5 : 0);

  const adjustedGrossIncome = grossIncome - aboveLineDeductions;

  // Standard vs Itemized deduction
  const standardDeduction = STANDARD_DEDUCTIONS_2025[filingStatus];
  const itemized = itemizedAmounts
    ? calculateItemizedDeductions(
      itemizedAmounts.mortgageInterest,
      itemizedAmounts.stateLocalTaxes,
      itemizedAmounts.charitable,
      itemizedAmounts.medical,
      adjustedGrossIncome
    )
    : calculateItemizedDeductions(0, 0, 0, 0, adjustedGrossIncome);

  const useItemized = itemized.total > standardDeduction;
  const deduction = useItemized ? itemized.total : standardDeduction;

  // Taxable income
  const taxableIncome = Math.max(0, adjustedGrossIncome - deduction);

  // Federal tax
  const federalTaxLiability = calculateFederalTax(taxableIncome, filingStatus);

  // FICA (for employed income)
  const employedIncome = incomeSources
    .filter(s => s.type === 'salary' || s.type === 'bonus')
    .reduce((sum, s) => sum + s.annualAmount, 0);
  const ficaTax = calculateFICA(employedIncome, false, filingStatus).total + seFICA.total;

  // State tax (real state-specific calculation)
  const stateTaxLiability = personalInfo.state
    ? calculateStateTax(adjustedGrossIncome, personalInfo.state.toUpperCase(), filingStatus)
    : adjustedGrossIncome * 0.05;

  // Capital gains tax
  const capitalGains = incomeSources
    .filter(s => s.type === 'capital_gains')
    .reduce((sum, s) => sum + s.annualAmount, 0);
  const capitalGainsTax = capitalGains > 0
    ? calculateCapitalGainsTax(capitalGains, taxableIncome, filingStatus)
    : 0;

  // Tax credits
  const taxCredits: TaxCredit[] = [];
  const dependentChildren = (personalInfo.dependents || []).filter(d => {
    const age = new Date().getFullYear() - new Date(d.dateOfBirth).getFullYear();
    return d.relationship === 'child' && age < 17;
  });
  if (dependentChildren.length > 0) {
    taxCredits.push({
      name: 'Child Tax Credit',
      amount: Math.min(dependentChildren.length * 2000, federalTaxLiability),
      isRefundable: true,
    });
  }

  const totalCredits = taxCredits.reduce((sum, c) => sum + c.amount, 0);
  const adjustedFederalTax = Math.max(0, federalTaxLiability - totalCredits);
  const totalTaxLiability = adjustedFederalTax + stateTaxLiability + ficaTax + capitalGainsTax;

  return {
    filingStatus,
    taxYear,
    grossIncome,
    adjustedGrossIncome,
    taxableIncome,
    standardDeduction,
    itemizedDeductions: itemized,
    useItemized,
    taxCredits,
    federalTaxLiability: adjustedFederalTax,
    stateTaxLiability,
    ficaTax,
    capitalGainsTax,
    totalTaxLiability,
    effectiveTaxRate: grossIncome > 0 ? totalTaxLiability / grossIncome : 0,
    marginalTaxRate: getMarginalTaxRate(taxableIncome, filingStatus),
  };
}

export function generateTaxStrategies(
  taxSituation: TaxSituation,
  currentRetirementContributions: number,
  hasHSA: boolean,
  age: number,
  incomeSources: IncomeSource[]
): TaxStrategy[] {
  const strategies: TaxStrategy[] = [];
  const { marginalTaxRate, adjustedGrossIncome, filingStatus } = taxSituation;

  // 1. Maximize retirement contributions
  const max401k = age >= 50 ? RETIREMENT_LIMITS_2025['401k'] + RETIREMENT_LIMITS_2025['401k_catchup'] : RETIREMENT_LIMITS_2025['401k'];
  if (currentRetirementContributions < max401k) {
    const additionalContribution = max401k - currentRetirementContributions;
    strategies.push({
      id: 'max_retirement',
      type: 'retirement_contribution',
      title: 'Maximize 401(k) Contributions',
      description: `You can contribute an additional $${additionalContribution.toLocaleString()} to your 401(k). This reduces your taxable income at your ${(marginalTaxRate * 100).toFixed(0)}% marginal rate.`,
      estimatedSavings: additionalContribution * marginalTaxRate,
      timeframe: 'this_year',
      priority: 'high',
    });
  }

  // 2. HSA Contribution
  if (hasHSA) {
    const hsaLimit = age >= 55 ? RETIREMENT_LIMITS_2025.hsa_family + RETIREMENT_LIMITS_2025.hsa_catchup : RETIREMENT_LIMITS_2025.hsa_family;
    strategies.push({
      id: 'max_hsa',
      type: 'hsa_contribution',
      title: 'Maximize HSA Contributions',
      description: `Contribute the maximum $${hsaLimit.toLocaleString()} to your HSA for triple tax advantage: tax-deductible contribution, tax-free growth, and tax-free qualified withdrawals.`,
      estimatedSavings: hsaLimit * marginalTaxRate,
      timeframe: 'this_year',
      priority: 'high',
    });
  }

  // 3. Roth Conversion opportunity
  if (marginalTaxRate <= 0.22) {
    const rothBenefit = calculateRothConversionBenefit(adjustedGrossIncome, filingStatus, 50000, age);
    strategies.push({
      id: 'roth_conversion',
      type: 'roth_conversion',
      title: 'Consider Roth IRA Conversion',
      description: `Your current marginal rate of ${(marginalTaxRate * 100).toFixed(0)}% is relatively low. You have $${rothBenefit.currentBracketRoom.toLocaleString()} of room in your current bracket. Consider converting up to $${rothBenefit.optimalConversionAmount.toLocaleString()} from traditional IRA to Roth IRA.`,
      estimatedSavings: rothBenefit.netBenefit,
      timeframe: 'this_year',
      priority: rothBenefit.netBenefit > 5000 ? 'high' : 'medium',
    });
  }

  // 4. Tax-Loss Harvesting
  strategies.push({
    id: 'tax_loss_harvest',
    type: 'tax_loss_harvest',
    title: 'Tax-Loss Harvesting',
    description: 'Review investment portfolio for positions with unrealized losses. Sell to realize losses that can offset capital gains and up to $3,000 of ordinary income.',
    estimatedSavings: 3000 * marginalTaxRate,
    timeframe: 'ongoing',
    priority: 'medium',
  });

  // 5. Charitable Giving Strategy (Bunching)
  if (!taxSituation.useItemized) {
    strategies.push({
      id: 'charitable_bunching',
      type: 'bunching',
      title: 'Charitable Donation Bunching Strategy',
      description: 'You currently use the standard deduction. Consider bunching 2 years of charitable donations into 1 year using a Donor-Advised Fund to exceed the standard deduction and itemize.',
      estimatedSavings: taxSituation.standardDeduction * 0.1 * marginalTaxRate,
      timeframe: 'this_year',
      priority: 'low',
    });
  }

  // 6. QBI Deduction for self-employed
  const hasSelfEmployment = incomeSources.some(s => s.type === 'self_employment');
  if (hasSelfEmployment) {
    strategies.push({
      id: 'qbi',
      type: 'qbi_deduction',
      title: 'Qualified Business Income Deduction (Section 199A)',
      description: 'As a self-employed individual, you may qualify for up to 20% deduction on qualified business income.',
      estimatedSavings: adjustedGrossIncome * 0.2 * marginalTaxRate * 0.5,
      timeframe: 'this_year',
      priority: 'high',
    });
  }

  return strategies.sort((a, b) => b.estimatedSavings - a.estimatedSavings);
}
