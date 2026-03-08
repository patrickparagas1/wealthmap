// ============================================================================
// WealthMap Financial Planning - Core Type System
// Based on CFP Board Principal Knowledge Topics & FINRA Guidelines
// ============================================================================

// ---------------------------------------------------------------------------
// Personal & Demographic Information
// ---------------------------------------------------------------------------
export type FilingStatus = 'single' | 'married_filing_jointly' | 'married_filing_separately' | 'head_of_household' | 'qualifying_widow';
export type EmploymentStatus = 'employed' | 'self_employed' | 'unemployed' | 'retired' | 'student' | 'homemaker';
export type RiskTolerance = 'conservative' | 'moderately_conservative' | 'moderate' | 'moderately_aggressive' | 'aggressive';
export type TimeHorizon = 'short' | 'medium' | 'long'; // <5, 5-15, 15+

export interface PersonalInfo {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  state: string;
  filingStatus: FilingStatus;
  employmentStatus: EmploymentStatus;
  employer: string;
  occupation: string;
  hasSpouse: boolean;
  spouse?: SpouseInfo;
  dependents: Dependent[];
  createdAt: string;
  updatedAt: string;
}

export interface SpouseInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  employmentStatus: EmploymentStatus;
  employer: string;
  occupation: string;
  annualIncome: number;
}

export interface Dependent {
  id: string;
  name: string;
  dateOfBirth: string;
  relationship: 'child' | 'parent' | 'other';
  isStudent: boolean;
  hasDisability: boolean;
}

// ---------------------------------------------------------------------------
// Income & Cash Flow
// ---------------------------------------------------------------------------
export interface IncomeSource {
  id: string;
  type: 'salary' | 'bonus' | 'self_employment' | 'rental' | 'dividend' | 'interest' | 'capital_gains' | 'social_security' | 'pension' | 'annuity' | 'alimony' | 'other';
  description: string;
  annualAmount: number;
  frequency: 'monthly' | 'quarterly' | 'annually' | 'one_time';
  isTaxable: boolean;
  owner: 'client' | 'spouse' | 'joint';
}

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  monthlyAmount: number;
  isFixed: boolean;
  isDiscretionary: boolean;
  isDeductible: boolean;
}

export type ExpenseCategory =
  | 'housing' | 'mortgage' | 'rent' | 'property_tax' | 'home_insurance'
  | 'utilities' | 'transportation' | 'auto_payment' | 'auto_insurance'
  | 'food' | 'healthcare' | 'health_insurance' | 'childcare' | 'education'
  | 'debt_payments' | 'entertainment' | 'clothing' | 'personal_care'
  | 'charitable' | 'subscriptions' | 'travel' | 'pets' | 'savings'
  | 'investment_contributions' | 'other';

export interface CashFlowSummary {
  totalMonthlyIncome: number;
  totalMonthlyExpenses: number;
  totalMonthlyFixedExpenses: number;
  totalMonthlyDiscretionary: number;
  monthlySurplus: number;
  annualSurplus: number;
  savingsRate: number;
  emergencyFundMonths: number;
  debtToIncomeRatio: number;
}

// ---------------------------------------------------------------------------
// Assets & Liabilities (Net Worth / Balance Sheet)
// ---------------------------------------------------------------------------
export type AssetCategory = 'cash' | 'investment' | 'retirement' | 'real_estate' | 'personal_property' | 'business' | 'other';
export type LiabilityCategory = 'mortgage' | 'auto_loan' | 'student_loan' | 'credit_card' | 'personal_loan' | 'heloc' | 'business_loan' | 'other';

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  currentValue: number;
  costBasis?: number;
  owner: 'client' | 'spouse' | 'joint';
  accountType?: AccountType;
  // Investment details
  holdings?: InvestmentHolding[];
  annualReturn?: number;
  // Retirement account details
  annualContribution?: number;
  employerMatchAmount?: number;
  // Real estate details
  purchaseDate?: string;
  purchasePrice?: number;
  monthlyRentalIncome?: number;
}

export type AccountType =
  | 'checking' | 'savings' | 'money_market' | 'cd'
  | 'brokerage' | 'traditional_ira' | 'roth_ira' | 'sep_ira' | 'simple_ira'
  | '401k' | 'roth_401k' | '403b' | '457b' | 'tsp'
  | 'hsa' | 'fsa' | '529' | 'coverdell'
  | 'trust' | 'custodial' | 'annuity'
  | 'stock_options' | 'espp' | 'rsu';

export interface InvestmentHolding {
  id: string;
  symbol: string;
  name: string;
  assetClass: AssetClass;
  shares: number;
  pricePerShare: number;
  totalValue: number;
  costBasis: number;
  annualExpenseRatio?: number;
}

export type AssetClass =
  | 'us_large_cap' | 'us_mid_cap' | 'us_small_cap'
  | 'international_developed' | 'emerging_markets'
  | 'us_bonds' | 'international_bonds' | 'high_yield_bonds' | 'tips'
  | 'reits' | 'commodities' | 'cash_equivalents'
  | 'alternatives' | 'crypto' | 'other';

export interface Liability {
  id: string;
  name: string;
  category: LiabilityCategory;
  currentBalance: number;
  originalBalance: number;
  interestRate: number;
  minimumPayment: number;
  monthlyPayment: number;
  remainingTermMonths: number;
  isDeductible: boolean;
  owner: 'client' | 'spouse' | 'joint';
}

export interface NetWorthSummary {
  totalAssets: number;
  totalLiquidAssets: number;
  totalInvestmentAssets: number;
  totalRetirementAssets: number;
  totalRealEstateAssets: number;
  totalLiabilities: number;
  netWorth: number;
  liquidityRatio: number;
  debtToAssetRatio: number;
}

// ---------------------------------------------------------------------------
// Investment Planning (FINRA/CFP aligned)
// ---------------------------------------------------------------------------
export interface RiskProfile {
  riskTolerance: RiskTolerance;
  riskCapacity: RiskTolerance;
  investmentExperience: 'none' | 'beginner' | 'intermediate' | 'advanced';
  timeHorizon: TimeHorizon;
  investmentObjective: 'preservation' | 'income' | 'growth_income' | 'growth' | 'aggressive_growth';
  compositeScore: number; // 1-100
}

export interface AssetAllocation {
  targetAllocation: AllocationTarget[];
  currentAllocation: AllocationTarget[];
  rebalancingNeeded: boolean;
  driftPercentage: number;
}

export interface AllocationTarget {
  assetClass: AssetClass;
  targetPercent: number;
  currentPercent: number;
  currentValue: number;
  difference: number;
}

export interface InvestmentRecommendation {
  id: string;
  type: 'rebalance' | 'new_investment' | 'tax_loss_harvest' | 'consolidate' | 'reduce_fees' | 'diversify';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  action: string;
}

// ---------------------------------------------------------------------------
// Tax Planning
// ---------------------------------------------------------------------------
export interface TaxSituation {
  filingStatus: FilingStatus;
  taxYear: number;
  // Income
  grossIncome: number;
  adjustedGrossIncome: number;
  taxableIncome: number;
  // Deductions
  standardDeduction: number;
  itemizedDeductions: ItemizedDeductions;
  useItemized: boolean;
  // Credits
  taxCredits: TaxCredit[];
  // Tax calculations
  federalTaxLiability: number;
  stateTaxLiability: number;
  ficaTax: number;
  capitalGainsTax?: number;
  totalTaxLiability: number;
  effectiveTaxRate: number;
  marginalTaxRate: number;
}

export interface ItemizedDeductions {
  mortgageInterest: number;
  stateLocalTaxes: number; // SALT cap $10,000
  charitableDonations: number;
  medicalExpenses: number; // >7.5% AGI
  investmentInterest: number;
  other: number;
  total: number;
}

export interface TaxCredit {
  name: string;
  amount: number;
  isRefundable: boolean;
}

export interface TaxStrategy {
  id: string;
  type: 'roth_conversion' | 'tax_loss_harvest' | 'charitable_giving' | 'income_shifting' | 'retirement_contribution' | 'hsa_contribution' | 'bunching' | 'qbi_deduction' | 'capital_gains_management';
  title: string;
  description: string;
  estimatedSavings: number;
  timeframe: 'immediate' | 'this_year' | 'next_year' | 'ongoing';
  priority: 'high' | 'medium' | 'low';
}

// ---------------------------------------------------------------------------
// Retirement Planning
// ---------------------------------------------------------------------------
export interface RetirementPlan {
  targetRetirementAge: number;
  currentAge: number;
  yearsToRetirement: number;
  lifeExpectancy: number;
  yearsInRetirement: number;
  // Income needs
  desiredAnnualIncome: number;
  incomeReplacementRatio: number;
  inflationAdjustedNeed: number;
  // Sources
  socialSecurityEstimate: SocialSecurityEstimate;
  pensionIncome: number;
  annuityIncome: number;
  // Savings
  currentRetirementSavings: number;
  annualContributions: number;
  employerMatch: number;
  // Projections
  projectedRetirementFund: number;
  retirementGap: number;
  fundedRatio: number;
  additionalSavingsNeeded: number;
  // Withdrawal strategy
  withdrawalRate: number;
  sustainableWithdrawalAmount: number;
}

export interface SocialSecurityEstimate {
  estimatedMonthlyAt62: number;
  estimatedMonthlyAtFRA: number;
  estimatedMonthlyAt70: number;
  fullRetirementAge: number;
  claimingAge: number;
  spousalBenefit?: number;
}

export interface RetirementAccount {
  id: string;
  accountType: AccountType;
  balance: number;
  annualContribution: number;
  employerMatch: number;
  employerMatchPercent: number;
  vestingPercent: number;
  expectedReturn: number;
}

// ---------------------------------------------------------------------------
// Insurance & Risk Management
// ---------------------------------------------------------------------------
export type InsuranceType = 'life' | 'health' | 'disability' | 'long_term_care' | 'auto' | 'homeowners' | 'renters' | 'umbrella' | 'professional_liability';

export interface InsurancePolicy {
  id: string;
  type: InsuranceType;
  provider: string;
  policyNumber: string;
  coverageAmount: number;
  annualPremium: number;
  deductible: number;
  // Life insurance specific
  lifeInsuranceType?: 'term' | 'whole' | 'universal' | 'variable';
  termLength?: number;
  cashValue?: number;
  // Disability specific
  eliminationPeriod?: number;
  benefitPeriod?: string;
  benefitAmount?: number;
  ownOccupation?: boolean;
}

export interface InsuranceNeedsAnalysis {
  lifeInsuranceNeed: number;
  currentLifeCoverage: number;
  lifeInsuranceGap: number;
  disabilityNeed: number;
  currentDisabilityCoverage: number;
  disabilityGap: number;
  longTermCareNeed: number;
  umbrellaRecommendation: number;
  recommendations: InsuranceRecommendation[];
}

export interface InsuranceRecommendation {
  id: string;
  type: InsuranceType;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  estimatedCost: string;
}

// ---------------------------------------------------------------------------
// Estate Planning
// ---------------------------------------------------------------------------
export interface EstatePlan {
  hasWill: boolean;
  hasTrust: boolean;
  hasPowerOfAttorney: boolean;
  hasHealthcareDirective: boolean;
  hasBeneficiaryDesignations: boolean;
  // Estate value
  grossEstateValue: number;
  estimateEstateTax: number;
  // Documents
  documents: EstateDocument[];
  beneficiaries: Beneficiary[];
  recommendations: EstateRecommendation[];
}

export interface EstateDocument {
  type: 'will' | 'revocable_trust' | 'irrevocable_trust' | 'poa_financial' | 'poa_healthcare' | 'living_will' | 'hipaa_authorization' | 'beneficiary_designation';
  exists: boolean;
  lastUpdated?: string;
  needsUpdate: boolean;
  notes: string;
}

export interface Beneficiary {
  id: string;
  name: string;
  relationship: string;
  percentage: number;
  isPrimary: boolean;
  accountsAssigned: string[];
}

export interface EstateRecommendation {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  category: 'documents' | 'beneficiaries' | 'tax_planning' | 'asset_protection' | 'charitable';
}

// ---------------------------------------------------------------------------
// Education Planning
// ---------------------------------------------------------------------------
export interface EducationPlan {
  children: EducationGoal[];
  totalProjectedCost: number;
  totalCurrentSavings: number;
  totalGap: number;
  recommendations: EducationRecommendation[];
}

export interface EducationGoal {
  id: string;
  childName: string;
  currentAge: number;
  yearsToCollege: number;
  collegeDuration: number;
  schoolType: 'public_in_state' | 'public_out_state' | 'private' | 'community_college' | 'trade_school';
  annualCostToday: number;
  projectedTotalCost: number;
  currentSavings: number;
  monthlyContribution: number;
  accountType: '529' | 'coverdell' | 'custodial' | 'savings' | 'none';
  projectedSavings: number;
  gap: number;
  fundedPercent: number;
}

export interface EducationRecommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  monthlySavingsNeeded: number;
}

// ---------------------------------------------------------------------------
// Debt Payoff Planning
// ---------------------------------------------------------------------------
export interface DebtPayoffMonth {
  month: number;
  debtName: string;
  payment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
}

export interface DebtPayoffPlan {
  strategy: 'avalanche' | 'snowball';
  debts: {
    name: string;
    originalBalance: number;
    interestRate: number;
    minimumPayment: number;
    payoffMonth: number;
    totalInterestPaid: number;
  }[];
  totalMonths: number;
  totalInterestPaid: number;
  totalPaid: number;
  debtFreeDate: string;
  monthlyTimeline: DebtPayoffMonth[];
}

// ---------------------------------------------------------------------------
// Financial Goals
// ---------------------------------------------------------------------------
export type GoalType = 'retirement' | 'education' | 'home_purchase' | 'emergency_fund' | 'debt_payoff' | 'vacation' | 'car_purchase' | 'wedding' | 'business' | 'charitable' | 'other';
export type GoalPriority = 'essential' | 'important' | 'aspirational';

export interface FinancialGoal {
  id: string;
  type: GoalType;
  name: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  priority: GoalPriority;
  monthlyContribution: number;
  expectedReturn: number;
  projectedValue: number;
  onTrack: boolean;
  percentComplete: number;
}

// ---------------------------------------------------------------------------
// Comprehensive Financial Plan
// ---------------------------------------------------------------------------
export interface FinancialPlan {
  id: string;
  clientId: string;
  advisorId?: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'in_progress' | 'complete' | 'reviewed';
  // All sections
  personalInfo: PersonalInfo;
  incomeSources: IncomeSource[];
  expenses: Expense[];
  assets: Asset[];
  liabilities: Liability[];
  goals: FinancialGoal[];
  // Analysis
  cashFlowSummary: CashFlowSummary;
  netWorthSummary: NetWorthSummary;
  riskProfile: RiskProfile;
  assetAllocation: AssetAllocation;
  taxSituation: TaxSituation;
  retirementPlan: RetirementPlan;
  insuranceAnalysis: InsuranceNeedsAnalysis;
  estatePlan: EstatePlan;
  educationPlan: EducationPlan;
  // Recommendations
  investmentRecommendations: InvestmentRecommendation[];
  taxStrategies: TaxStrategy[];
  actionItems: ActionItem[];
  // Score
  financialHealthScore: FinancialHealthScore;
}

export interface ActionItem {
  id: string;
  category: 'cash_flow' | 'investments' | 'tax' | 'retirement' | 'insurance' | 'estate' | 'education' | 'debt';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  deadline?: string;
  status: 'pending' | 'in_progress' | 'completed';
  assignedTo: 'client' | 'advisor' | 'attorney' | 'cpa' | 'insurance_agent';
}

export interface FinancialHealthScore {
  overall: number; // 0-100
  cashFlow: number;
  savings: number;
  debt: number;
  investments: number;
  insurance: number;
  retirement: number;
  estate: number;
  tax: number;
  breakdown: ScoreBreakdown[];
}

export interface ScoreBreakdown {
  category: string;
  score: number;
  maxScore: number;
  weight: number;
  details: string;
  status: 'excellent' | 'good' | 'needs_attention' | 'critical';
}

// ---------------------------------------------------------------------------
// Advisor Portal Types
// ---------------------------------------------------------------------------
export interface AdvisorProfile {
  id: string;
  name: string;
  credentials: string[]; // CFP, CFA, ChFC, etc.
  firm: string;
  email: string;
  phone: string;
  crdNumber: string; // FINRA Central Registration Depository
  clients: string[];
}

export interface ClientNote {
  id: string;
  clientId: string;
  advisorId: string;
  date: string;
  subject: string;
  content: string;
  tags: string[];
  isCompliance: boolean;
}

// ---------------------------------------------------------------------------
// Questionnaire Types
// ---------------------------------------------------------------------------
export type QuestionType = 'text' | 'number' | 'currency' | 'select' | 'multi_select' | 'date' | 'yes_no' | 'slider' | 'percentage';

export interface Question {
  id: string;
  section: QuestionnaireSection;
  question: string;
  helpText?: string;
  type: QuestionType;
  options?: { label: string; value: string }[];
  required: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  condition?: {
    dependsOn: string;
    value: string | boolean | number;
  };
}

export type QuestionnaireSection =
  | 'personal_info'
  | 'income'
  | 'expenses'
  | 'assets'
  | 'liabilities'
  | 'goals'
  | 'risk_assessment'
  | 'insurance'
  | 'estate'
  | 'education'
  | 'tax';
