// ============================================================================
// Zustand Store - Central State Management
// ============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  PersonalInfo, IncomeSource, Expense, Asset, Liability,
  FinancialGoal, InsurancePolicy, RiskProfile, FinancialPlan,
  CashFlowSummary, NetWorthSummary, AssetAllocation, TaxSituation,
  RetirementPlan, InsuranceNeedsAnalysis, EstatePlan, EducationPlan,
  InvestmentRecommendation, TaxStrategy, FinancialHealthScore,
  ActionItem, Beneficiary, QuestionnaireSection
} from '../lib/types';

export type AppView = 'landing' | 'questionnaire' | 'dashboard' | 'plan' | 'advisor';

interface FinancialStore {
  // App state
  currentView: AppView;
  currentSection: QuestionnaireSection;
  isLoading: boolean;
  hasCompletedQuestionnaire: boolean;

  // Personal data
  personalInfo: PersonalInfo;
  incomeSources: IncomeSource[];
  expenses: Expense[];
  assets: Asset[];
  liabilities: Liability[];
  goals: FinancialGoal[];
  insurancePolicies: InsurancePolicy[];

  // Risk assessment
  riskAnswers: Record<string, number>;
  riskProfile: RiskProfile | null;

  // Tax deductions
  taxDeductions: {
    mortgageInterest: number;
    stateLocalTaxes: number;
    charitableDonations: number;
    medicalExpenses: number;
  };
  taxStrategiesUsed: Record<string, boolean>;

  // Education savings per child
  educationSavings: Record<string, { schoolType: string; currentSavings: number; monthlyContribution: number; accountType: string }>;

  // Retirement preferences
  retirementPreferences: {
    targetRetirementAge: number;
    desiredRetirementIncome: number;
    incomeReplacementRatio: number;
  };

  // Estate info
  estateInfo: {
    hasWill: boolean;
    hasTrust: boolean;
    hasPOA: boolean;
    hasHealthcareDirective: boolean;
    hasBeneficiaryDesignations: boolean;
    beneficiaries: Beneficiary[];
  };

  // Computed / Analysis results
  cashFlowSummary: CashFlowSummary | null;
  netWorthSummary: NetWorthSummary | null;
  assetAllocation: AssetAllocation | null;
  taxSituation: TaxSituation | null;
  retirementPlan: RetirementPlan | null;
  monteCarloResults: { successRate: number; medianBalance: number; percentile10: number; percentile90: number } | null;
  insuranceAnalysis: InsuranceNeedsAnalysis | null;
  estatePlan: EstatePlan | null;
  educationPlan: EducationPlan | null;
  investmentRecommendations: InvestmentRecommendation[];
  taxStrategies: TaxStrategy[];
  financialHealthScore: FinancialHealthScore | null;
  actionItems: ActionItem[];

  // Actions
  setView: (view: AppView) => void;
  setSection: (section: QuestionnaireSection) => void;
  setLoading: (loading: boolean) => void;
  setHasCompletedQuestionnaire: (completed: boolean) => void;

  updatePersonalInfo: (info: Partial<PersonalInfo>) => void;
  setIncomeSources: (sources: IncomeSource[]) => void;
  addIncomeSource: (source: IncomeSource) => void;
  removeIncomeSource: (id: string) => void;
  setExpenses: (expenses: Expense[]) => void;
  addExpense: (expense: Expense) => void;
  removeExpense: (id: string) => void;
  setAssets: (assets: Asset[]) => void;
  addAsset: (asset: Asset) => void;
  removeAsset: (id: string) => void;
  setLiabilities: (liabilities: Liability[]) => void;
  addLiability: (liability: Liability) => void;
  removeLiability: (id: string) => void;
  setGoals: (goals: FinancialGoal[]) => void;
  addGoal: (goal: FinancialGoal) => void;
  removeGoal: (id: string) => void;
  setInsurancePolicies: (policies: InsurancePolicy[]) => void;
  addInsurancePolicy: (policy: InsurancePolicy) => void;
  removeInsurancePolicy: (id: string) => void;

  setRiskAnswers: (answers: Record<string, number>) => void;
  setRiskProfile: (profile: RiskProfile | null) => void;
  setTaxDeductions: (deductions: Partial<FinancialStore['taxDeductions']>) => void;
  setTaxStrategiesUsed: (strategies: Record<string, boolean>) => void;
  setEstateInfo: (info: Partial<FinancialStore['estateInfo']>) => void;
  setEducationSavings: (savings: FinancialStore['educationSavings']) => void;
  setRetirementPreferences: (prefs: Partial<FinancialStore['retirementPreferences']>) => void;

  // Analysis results setters
  setCashFlowSummary: (summary: CashFlowSummary | null) => void;
  setNetWorthSummary: (summary: NetWorthSummary | null) => void;
  setAssetAllocation: (allocation: AssetAllocation | null) => void;
  setTaxSituation: (situation: TaxSituation | null) => void;
  setRetirementPlan: (plan: RetirementPlan | null) => void;
  setMonteCarloResults: (results: { successRate: number; medianBalance: number; percentile10: number; percentile90: number } | null) => void;
  setInsuranceAnalysis: (analysis: InsuranceNeedsAnalysis | null) => void;
  setEstatePlan: (plan: EstatePlan | null) => void;
  setEducationPlan: (plan: EducationPlan | null) => void;
  setInvestmentRecommendations: (recs: InvestmentRecommendation[]) => void;
  setTaxStrategies: (strategies: TaxStrategy[]) => void;
  setFinancialHealthScore: (score: FinancialHealthScore | null) => void;
  setActionItems: (items: ActionItem[]) => void;

  // Batch import (document upload)
  batchAddIncomeSources: (sources: IncomeSource[]) => void;
  batchAddExpenses: (expenses: Expense[]) => void;
  batchAddAssets: (assets: Asset[]) => void;
  batchAddLiabilities: (liabilities: Liability[]) => void;

  // Utility
  resetAll: () => void;
}

const defaultPersonalInfo: PersonalInfo = {
  id: '',
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  email: '',
  phone: '',
  state: '',
  filingStatus: 'single',
  employmentStatus: 'employed',
  employer: '',
  occupation: '',
  hasSpouse: false,
  dependents: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const useFinancialStore = create<FinancialStore>()(
  persist(
    (set) => ({
      // Initial state
      currentView: 'landing',
      currentSection: 'personal_info',
      isLoading: false,
      hasCompletedQuestionnaire: false,

      personalInfo: { ...defaultPersonalInfo },
      incomeSources: [],
      expenses: [],
      assets: [],
      liabilities: [],
      goals: [],
      insurancePolicies: [],

      riskAnswers: {},
      riskProfile: null,

      taxDeductions: {
        mortgageInterest: 0,
        stateLocalTaxes: 0,
        charitableDonations: 0,
        medicalExpenses: 0,
      },
      taxStrategiesUsed: {},

      educationSavings: {},
      retirementPreferences: {
        targetRetirementAge: 65,
        desiredRetirementIncome: 0,
        incomeReplacementRatio: 80,
      },

      estateInfo: {
        hasWill: false,
        hasTrust: false,
        hasPOA: false,
        hasHealthcareDirective: false,
        hasBeneficiaryDesignations: false,
        beneficiaries: [],
      },

      cashFlowSummary: null,
      netWorthSummary: null,
      assetAllocation: null,
      taxSituation: null,
      retirementPlan: null,
      monteCarloResults: null,
      insuranceAnalysis: null,
      estatePlan: null,
      educationPlan: null,
      investmentRecommendations: [],
      taxStrategies: [],
      financialHealthScore: null,
      actionItems: [],

      // Actions
      setView: (view) => set({ currentView: view }),
      setSection: (section) => set({ currentSection: section }),
      setLoading: (loading) => set({ isLoading: loading }),
      setHasCompletedQuestionnaire: (completed) => set({ hasCompletedQuestionnaire: completed }),

      updatePersonalInfo: (info) => set((state) => ({
        personalInfo: { ...state.personalInfo, ...info, updatedAt: new Date().toISOString() },
      })),

      setIncomeSources: (sources) => set({ incomeSources: sources }),
      addIncomeSource: (source) => set((state) => ({
        incomeSources: [...state.incomeSources, source],
      })),
      removeIncomeSource: (id) => set((state) => ({
        incomeSources: state.incomeSources.filter((s) => s.id !== id),
      })),

      setExpenses: (expenses) => set({ expenses }),
      addExpense: (expense) => set((state) => ({
        expenses: [...state.expenses, expense],
      })),
      removeExpense: (id) => set((state) => ({
        expenses: state.expenses.filter((e) => e.id !== id),
      })),

      setAssets: (assets) => set({ assets }),
      addAsset: (asset) => set((state) => ({
        assets: [...state.assets, asset],
      })),
      removeAsset: (id) => set((state) => ({
        assets: state.assets.filter((a) => a.id !== id),
      })),

      setLiabilities: (liabilities) => set({ liabilities }),
      addLiability: (liability) => set((state) => ({
        liabilities: [...state.liabilities, liability],
      })),
      removeLiability: (id) => set((state) => ({
        liabilities: state.liabilities.filter((l) => l.id !== id),
      })),

      setGoals: (goals) => set({ goals }),
      addGoal: (goal) => set((state) => ({
        goals: [...state.goals, goal],
      })),
      removeGoal: (id) => set((state) => ({
        goals: state.goals.filter((g) => g.id !== id),
      })),

      setInsurancePolicies: (policies) => set({ insurancePolicies: policies }),
      addInsurancePolicy: (policy) => set((state) => ({
        insurancePolicies: [...state.insurancePolicies, policy],
      })),
      removeInsurancePolicy: (id) => set((state) => ({
        insurancePolicies: state.insurancePolicies.filter((p) => p.id !== id),
      })),

      setRiskAnswers: (answers) => set({ riskAnswers: answers }),
      setRiskProfile: (profile) => set({ riskProfile: profile }),
      setTaxDeductions: (deductions) => set((state) => ({
        taxDeductions: { ...state.taxDeductions, ...deductions },
      })),
      setTaxStrategiesUsed: (strategies) => set({ taxStrategiesUsed: strategies }),
      setEstateInfo: (info) => set((state) => ({
        estateInfo: { ...state.estateInfo, ...info },
      })),
      setEducationSavings: (savings) => set({ educationSavings: savings }),
      setRetirementPreferences: (prefs) => set((state) => ({
        retirementPreferences: { ...state.retirementPreferences, ...prefs },
      })),

      setCashFlowSummary: (summary) => set({ cashFlowSummary: summary }),
      setNetWorthSummary: (summary) => set({ netWorthSummary: summary }),
      setAssetAllocation: (allocation) => set({ assetAllocation: allocation }),
      setTaxSituation: (situation) => set({ taxSituation: situation }),
      setRetirementPlan: (plan) => set({ retirementPlan: plan }),
      setMonteCarloResults: (results) => set({ monteCarloResults: results }),
      setInsuranceAnalysis: (analysis) => set({ insuranceAnalysis: analysis }),
      setEstatePlan: (plan) => set({ estatePlan: plan }),
      setEducationPlan: (plan) => set({ educationPlan: plan }),
      setInvestmentRecommendations: (recs) => set({ investmentRecommendations: recs }),
      setTaxStrategies: (strategies) => set({ taxStrategies: strategies }),
      setFinancialHealthScore: (score) => set({ financialHealthScore: score }),
      setActionItems: (items) => set({ actionItems: items }),

      // Batch import — merge with existing data, avoid duplicates by description/name
      batchAddIncomeSources: (sources) => set((state) => {
        const existingDescs = new Set(state.incomeSources.map((s) => s.description.toLowerCase()));
        const newOnes = sources.filter((s) => !existingDescs.has(s.description.toLowerCase()));
        return { incomeSources: [...state.incomeSources, ...newOnes] };
      }),
      batchAddExpenses: (expenses) => set((state) => {
        const existingDescs = new Set(state.expenses.map((e) => e.description.toLowerCase()));
        const newOnes = expenses.filter((e) => !existingDescs.has(e.description.toLowerCase()));
        return { expenses: [...state.expenses, ...newOnes] };
      }),
      batchAddAssets: (assets) => set((state) => {
        const existingNames = new Set(state.assets.map((a) => a.name.toLowerCase()));
        const newOnes = assets.filter((a) => !existingNames.has(a.name.toLowerCase()));
        return { assets: [...state.assets, ...newOnes] };
      }),
      batchAddLiabilities: (liabilities) => set((state) => {
        const existingNames = new Set(state.liabilities.map((l) => l.name.toLowerCase()));
        const newOnes = liabilities.filter((l) => !existingNames.has(l.name.toLowerCase()));
        return { liabilities: [...state.liabilities, ...newOnes] };
      }),

      resetAll: () => set({
        currentView: 'landing',
        currentSection: 'personal_info',
        hasCompletedQuestionnaire: false,
        personalInfo: { ...defaultPersonalInfo },
        incomeSources: [],
        expenses: [],
        assets: [],
        liabilities: [],
        goals: [],
        insurancePolicies: [],
        riskAnswers: {},
        riskProfile: null,
        taxDeductions: {
          mortgageInterest: 0, stateLocalTaxes: 0,
          charitableDonations: 0, medicalExpenses: 0,
        },
        taxStrategiesUsed: {},
        educationSavings: {},
        retirementPreferences: {
          targetRetirementAge: 65, desiredRetirementIncome: 0, incomeReplacementRatio: 80,
        },
        estateInfo: {
          hasWill: false, hasTrust: false, hasPOA: false,
          hasHealthcareDirective: false, hasBeneficiaryDesignations: false,
          beneficiaries: [],
        },
        cashFlowSummary: null,
        netWorthSummary: null,
        assetAllocation: null,
        taxSituation: null,
        retirementPlan: null,
        monteCarloResults: null,
        insuranceAnalysis: null,
        estatePlan: null,
        educationPlan: null,
        investmentRecommendations: [],
        taxStrategies: [],
        financialHealthScore: null,
        actionItems: [],
      }),
    }),
    {
      name: 'wealthmap-financial-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        personalInfo: state.personalInfo,
        incomeSources: state.incomeSources,
        expenses: state.expenses,
        assets: state.assets,
        liabilities: state.liabilities,
        goals: state.goals,
        insurancePolicies: state.insurancePolicies,
        riskAnswers: state.riskAnswers,
        taxDeductions: state.taxDeductions,
        taxStrategiesUsed: state.taxStrategiesUsed,
        educationSavings: state.educationSavings,
        retirementPreferences: state.retirementPreferences,
        estateInfo: state.estateInfo,
        hasCompletedQuestionnaire: state.hasCompletedQuestionnaire,
      }),
    }
  )
);
