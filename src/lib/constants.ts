// ============================================================================
// Financial Planning Constants - 2024/2025 Tax Year Data
// Sources: IRS, SSA, CFP Board, FINRA
// ============================================================================

// ---------------------------------------------------------------------------
// Federal Income Tax Brackets (2025)
// ---------------------------------------------------------------------------
export const FEDERAL_TAX_BRACKETS_2025 = {
  single: [
    { min: 0, max: 11925, rate: 0.10 },
    { min: 11925, max: 48475, rate: 0.12 },
    { min: 48475, max: 103350, rate: 0.22 },
    { min: 103350, max: 197300, rate: 0.24 },
    { min: 197300, max: 250525, rate: 0.32 },
    { min: 250525, max: 626350, rate: 0.35 },
    { min: 626350, max: Infinity, rate: 0.37 },
  ],
  married_filing_jointly: [
    { min: 0, max: 23850, rate: 0.10 },
    { min: 23850, max: 96950, rate: 0.12 },
    { min: 96950, max: 206700, rate: 0.22 },
    { min: 206700, max: 394600, rate: 0.24 },
    { min: 394600, max: 501050, rate: 0.32 },
    { min: 501050, max: 751600, rate: 0.35 },
    { min: 751600, max: Infinity, rate: 0.37 },
  ],
  married_filing_separately: [
    { min: 0, max: 11925, rate: 0.10 },
    { min: 11925, max: 48475, rate: 0.12 },
    { min: 48475, max: 103350, rate: 0.22 },
    { min: 103350, max: 197300, rate: 0.24 },
    { min: 197300, max: 250525, rate: 0.32 },
    { min: 250525, max: 375800, rate: 0.35 },
    { min: 375800, max: Infinity, rate: 0.37 },
  ],
  head_of_household: [
    { min: 0, max: 17000, rate: 0.10 },
    { min: 17000, max: 64850, rate: 0.12 },
    { min: 64850, max: 103350, rate: 0.22 },
    { min: 103350, max: 197300, rate: 0.24 },
    { min: 197300, max: 250500, rate: 0.32 },
    { min: 250500, max: 626350, rate: 0.35 },
    { min: 626350, max: Infinity, rate: 0.37 },
  ],
  qualifying_widow: [] as { min: number; max: number; rate: number }[],
};
// Qualifying widow uses same brackets as MFJ
FEDERAL_TAX_BRACKETS_2025.qualifying_widow = [...FEDERAL_TAX_BRACKETS_2025.married_filing_jointly];

// ---------------------------------------------------------------------------
// Standard Deductions (2025)
// ---------------------------------------------------------------------------
export const STANDARD_DEDUCTIONS_2025 = {
  single: 15000,
  married_filing_jointly: 30000,
  married_filing_separately: 15000,
  head_of_household: 22500,
  qualifying_widow: 30000,
};

// Additional standard deduction for age 65+ or blind
export const ADDITIONAL_STANDARD_DEDUCTION_2025 = {
  single: 2000,
  married: 1600,
};

// ---------------------------------------------------------------------------
// Capital Gains Tax Rates (2025)
// ---------------------------------------------------------------------------
export const LONG_TERM_CAPITAL_GAINS_BRACKETS = {
  single: [
    { min: 0, max: 48350, rate: 0 },
    { min: 48350, max: 533400, rate: 0.15 },
    { min: 533400, max: Infinity, rate: 0.20 },
  ],
  married_filing_jointly: [
    { min: 0, max: 96700, rate: 0 },
    { min: 96700, max: 600050, rate: 0.15 },
    { min: 600050, max: Infinity, rate: 0.20 },
  ],
  married_filing_separately: [
    { min: 0, max: 48350, rate: 0 },
    { min: 48350, max: 300025, rate: 0.15 },
    { min: 300025, max: Infinity, rate: 0.20 },
  ],
  head_of_household: [
    { min: 0, max: 64750, rate: 0 },
    { min: 64750, max: 566700, rate: 0.15 },
    { min: 566700, max: Infinity, rate: 0.20 },
  ],
  qualifying_widow: [
    { min: 0, max: 96700, rate: 0 },
    { min: 96700, max: 600050, rate: 0.15 },
    { min: 600050, max: Infinity, rate: 0.20 },
  ],
};

// Net Investment Income Tax (NIIT) - 3.8%
export const NIIT_THRESHOLDS = {
  single: 200000,
  married_filing_jointly: 250000,
  married_filing_separately: 125000,
  head_of_household: 200000,
  qualifying_widow: 250000,
};

// ---------------------------------------------------------------------------
// FICA / Payroll Taxes (2025)
// ---------------------------------------------------------------------------
export const FICA_2025 = {
  socialSecurityRate: 0.062,
  socialSecurityWageBase: 176100,
  medicareRate: 0.0145,
  additionalMedicareRate: 0.009,
  additionalMedicareThreshold: {
    single: 200000,
    married_filing_jointly: 250000,
    married_filing_separately: 125000,
  },
  selfEmploymentTaxRate: 0.153, // 12.4% SS + 2.9% Medicare
};

// ---------------------------------------------------------------------------
// Retirement Contribution Limits (2025)
// ---------------------------------------------------------------------------
export const RETIREMENT_LIMITS_2025 = {
  traditional_ira: 7000,
  traditional_ira_catchup: 1000, // Age 50+
  roth_ira: 7000,
  roth_ira_catchup: 1000,
  '401k': 23500,
  '401k_catchup': 7500, // Age 50-59, 64+
  '401k_super_catchup': 11250, // Age 60-63
  '401k_total': 70000, // Including employer contributions
  '403b': 23500,
  '457b': 23500,
  sep_ira: 70000,
  simple_ira: 16500,
  simple_ira_catchup: 3500,
  hsa_individual: 4300,
  hsa_family: 8550,
  hsa_catchup: 1000, // Age 55+
};

// Roth IRA Income Phase-outs (2025)
export const ROTH_IRA_PHASEOUT_2025 = {
  single: { start: 150000, end: 165000 },
  married_filing_jointly: { start: 236000, end: 246000 },
  married_filing_separately: { start: 0, end: 10000 },
};

// ---------------------------------------------------------------------------
// Social Security (2025)
// ---------------------------------------------------------------------------
export const SOCIAL_SECURITY_2025 = {
  fullRetirementAge: 67, // For those born 1960+
  earlyRetirementAge: 62,
  maxDelayAge: 70,
  earlyReductionPerMonth: 0.00556, // 5/9 of 1% for first 36 months
  earlyReductionPerMonthAfter36: 0.00417, // 5/12 of 1% after 36 months
  delayedCreditsPerYear: 0.08, // 8% per year delay past FRA
  maxMonthlyBenefit2025: 5108,
  averageMonthlyBenefit2025: 1976,
  taxableIncomeThresholds: {
    single: { partial: 25000, full: 34000 },
    married_filing_jointly: { partial: 32000, full: 44000 },
  },
  cola2025: 0.025, // 2.5% COLA
};

// ---------------------------------------------------------------------------
// Insurance Planning Constants
// ---------------------------------------------------------------------------
export const LIFE_INSURANCE_MULTIPLIER = {
  conservative: 15, // 15x income
  moderate: 12,
  minimum: 10,
};

export const DISABILITY_REPLACEMENT_RATIO = 0.60; // 60% income replacement

// ---------------------------------------------------------------------------
// Estate Planning (2025)
// ---------------------------------------------------------------------------
export const ESTATE_TAX_2025 = {
  exemption: 13990000, // Per person
  marriedExemption: 27980000, // Portability
  maxRate: 0.40,
  annualGiftExclusion: 19000,
  lifetimeGiftExemption: 13990000, // Unified with estate
};

// ---------------------------------------------------------------------------
// Education Cost Estimates (2024-2025 average)
// ---------------------------------------------------------------------------
export const EDUCATION_COSTS = {
  public_in_state: 23250, // Tuition + room/board
  public_out_state: 41000,
  private: 58600,
  community_college: 12500,
  trade_school: 15000,
  annualInflationRate: 0.05, // ~5% education inflation
};

// ---------------------------------------------------------------------------
// Financial Planning Assumptions & Benchmarks
// ---------------------------------------------------------------------------
export const PLANNING_ASSUMPTIONS = {
  inflation: 0.03, // 3% general inflation
  educationInflation: 0.05,
  healthcareInflation: 0.065,
  stockMarketReturn: 0.10, // Long-term nominal
  bondMarketReturn: 0.04,
  balancedReturn: 0.07,
  conservativeReturn: 0.05,
  safeWithdrawalRate: 0.04, // 4% rule
  conservativeWithdrawalRate: 0.035,
  lifeExpectancy: 90,
};

// Financial Health Benchmarks
export const BENCHMARKS = {
  emergencyFundMonths: 6,
  savingsRateMinimum: 0.15, // 15% minimum
  savingsRateGood: 0.20,
  savingsRateExcellent: 0.25,
  debtToIncomeMax: 0.36,
  housingExpenseMax: 0.28,
  maxCreditCardUtilization: 0.30,
  retirementSavingsMultiples: [
    { age: 30, multiple: 1 },
    { age: 35, multiple: 2 },
    { age: 40, multiple: 3 },
    { age: 45, multiple: 4 },
    { age: 50, multiple: 6 },
    { age: 55, multiple: 7 },
    { age: 60, multiple: 8 },
    { age: 65, multiple: 10 },
    { age: 67, multiple: 10 },
  ],
};

// ---------------------------------------------------------------------------
// Model Asset Allocations (FINRA Suitability aligned)
// ---------------------------------------------------------------------------
export const MODEL_PORTFOLIOS = {
  conservative: {
    us_large_cap: 15,
    us_mid_cap: 5,
    us_small_cap: 0,
    international_developed: 5,
    emerging_markets: 0,
    us_bonds: 45,
    international_bonds: 5,
    tips: 10,
    reits: 5,
    cash_equivalents: 10,
  },
  moderately_conservative: {
    us_large_cap: 25,
    us_mid_cap: 5,
    us_small_cap: 5,
    international_developed: 10,
    emerging_markets: 0,
    us_bonds: 30,
    international_bonds: 5,
    tips: 5,
    reits: 5,
    cash_equivalents: 10,
  },
  moderate: {
    us_large_cap: 30,
    us_mid_cap: 10,
    us_small_cap: 5,
    international_developed: 15,
    emerging_markets: 5,
    us_bonds: 20,
    international_bonds: 5,
    tips: 0,
    reits: 5,
    cash_equivalents: 5,
  },
  moderately_aggressive: {
    us_large_cap: 35,
    us_mid_cap: 10,
    us_small_cap: 10,
    international_developed: 15,
    emerging_markets: 10,
    us_bonds: 10,
    international_bonds: 5,
    tips: 0,
    reits: 5,
    cash_equivalents: 0,
  },
  aggressive: {
    us_large_cap: 35,
    us_mid_cap: 15,
    us_small_cap: 10,
    international_developed: 15,
    emerging_markets: 15,
    us_bonds: 0,
    international_bonds: 0,
    tips: 0,
    reits: 10,
    cash_equivalents: 0,
  },
};

// ---------------------------------------------------------------------------
// Risk Assessment Questions
// ---------------------------------------------------------------------------
export const RISK_ASSESSMENT_QUESTIONS = [
  {
    id: 'risk_1',
    question: 'How would you react if your investment portfolio lost 20% of its value in a single month?',
    options: [
      { label: 'Sell everything immediately', value: 1 },
      { label: 'Sell some to reduce risk', value: 2 },
      { label: 'Hold and wait for recovery', value: 3 },
      { label: 'Buy more at lower prices', value: 4 },
      { label: 'Aggressively buy more', value: 5 },
    ],
  },
  {
    id: 'risk_2',
    question: 'What is your primary investment goal?',
    options: [
      { label: 'Preserving my capital', value: 1 },
      { label: 'Generating regular income', value: 2 },
      { label: 'Balanced growth and income', value: 3 },
      { label: 'Long-term capital growth', value: 4 },
      { label: 'Maximum capital appreciation', value: 5 },
    ],
  },
  {
    id: 'risk_3',
    question: 'When do you plan to start withdrawing from your investments?',
    options: [
      { label: 'Within 1-3 years', value: 1 },
      { label: '3-5 years', value: 2 },
      { label: '5-10 years', value: 3 },
      { label: '10-20 years', value: 4 },
      { label: 'More than 20 years', value: 5 },
    ],
  },
  {
    id: 'risk_4',
    question: 'How much investment experience do you have?',
    options: [
      { label: 'None - I am new to investing', value: 1 },
      { label: 'Limited - savings accounts and CDs', value: 2 },
      { label: 'Some - stocks and mutual funds', value: 3 },
      { label: 'Experienced - diversified portfolio', value: 4 },
      { label: 'Very experienced - complex strategies', value: 5 },
    ],
  },
  {
    id: 'risk_5',
    question: 'Which scenario best describes your preferred balance between returns and risk?',
    options: [
      { label: 'Minimize losses even if returns are very low', value: 1 },
      { label: 'Keep losses small, accept modest returns', value: 2 },
      { label: 'Accept moderate losses for moderate returns', value: 3 },
      { label: 'Accept higher losses for potentially higher returns', value: 4 },
      { label: 'Accept significant losses for maximum potential returns', value: 5 },
    ],
  },
  {
    id: 'risk_6',
    question: 'How stable is your current income?',
    options: [
      { label: 'Very unstable - irregular income', value: 1 },
      { label: 'Somewhat unstable', value: 2 },
      { label: 'Moderately stable', value: 3 },
      { label: 'Very stable - steady employment', value: 4 },
      { label: 'Extremely stable - multiple income sources', value: 5 },
    ],
  },
  {
    id: 'risk_7',
    question: 'What percentage of your monthly income could you invest without affecting your lifestyle?',
    options: [
      { label: 'Less than 5%', value: 1 },
      { label: '5-10%', value: 2 },
      { label: '10-20%', value: 3 },
      { label: '20-30%', value: 4 },
      { label: 'More than 30%', value: 5 },
    ],
  },
];

// US States for dropdown
export const US_STATES = [
  { label: 'Alabama', value: 'AL' }, { label: 'Alaska', value: 'AK' },
  { label: 'Arizona', value: 'AZ' }, { label: 'Arkansas', value: 'AR' },
  { label: 'California', value: 'CA' }, { label: 'Colorado', value: 'CO' },
  { label: 'Connecticut', value: 'CT' }, { label: 'Delaware', value: 'DE' },
  { label: 'Florida', value: 'FL' }, { label: 'Georgia', value: 'GA' },
  { label: 'Hawaii', value: 'HI' }, { label: 'Idaho', value: 'ID' },
  { label: 'Illinois', value: 'IL' }, { label: 'Indiana', value: 'IN' },
  { label: 'Iowa', value: 'IA' }, { label: 'Kansas', value: 'KS' },
  { label: 'Kentucky', value: 'KY' }, { label: 'Louisiana', value: 'LA' },
  { label: 'Maine', value: 'ME' }, { label: 'Maryland', value: 'MD' },
  { label: 'Massachusetts', value: 'MA' }, { label: 'Michigan', value: 'MI' },
  { label: 'Minnesota', value: 'MN' }, { label: 'Mississippi', value: 'MS' },
  { label: 'Missouri', value: 'MO' }, { label: 'Montana', value: 'MT' },
  { label: 'Nebraska', value: 'NE' }, { label: 'Nevada', value: 'NV' },
  { label: 'New Hampshire', value: 'NH' }, { label: 'New Jersey', value: 'NJ' },
  { label: 'New Mexico', value: 'NM' }, { label: 'New York', value: 'NY' },
  { label: 'North Carolina', value: 'NC' }, { label: 'North Dakota', value: 'ND' },
  { label: 'Ohio', value: 'OH' }, { label: 'Oklahoma', value: 'OK' },
  { label: 'Oregon', value: 'OR' }, { label: 'Pennsylvania', value: 'PA' },
  { label: 'Rhode Island', value: 'RI' }, { label: 'South Carolina', value: 'SC' },
  { label: 'South Dakota', value: 'SD' }, { label: 'Tennessee', value: 'TN' },
  { label: 'Texas', value: 'TX' }, { label: 'Utah', value: 'UT' },
  { label: 'Vermont', value: 'VT' }, { label: 'Virginia', value: 'VA' },
  { label: 'Washington', value: 'WA' }, { label: 'West Virginia', value: 'WV' },
  { label: 'Wisconsin', value: 'WI' }, { label: 'Wyoming', value: 'WY' },
  { label: 'District of Columbia', value: 'DC' },
];
