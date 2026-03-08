'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFinancialStore } from '@/store/financial-store';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import OverviewPanel from '@/components/dashboard/OverviewPanel';
import CashFlowPanel from '@/components/dashboard/CashFlowPanel';
import NetWorthPanel from '@/components/dashboard/NetWorthPanel';
import InvestmentPanel from '@/components/dashboard/InvestmentPanel';
import TaxPanel from '@/components/dashboard/TaxPanel';
import RetirementPanel from '@/components/dashboard/RetirementPanel';
import InsurancePanel from '@/components/dashboard/InsurancePanel';
import EstatePanel from '@/components/dashboard/EstatePanel';
import EducationPanel from '@/components/dashboard/EducationPanel';
import GoalsPanel from '@/components/dashboard/GoalsPanel';
import DebtPanel from '@/components/dashboard/DebtPanel';
import ScenarioPanel from '@/components/dashboard/ScenarioPanel';

// Engines
import { calculateCashFlowSummary, calculateNetWorthSummary, calculateFinancialHealthScore } from '@/lib/engines/financial-health-engine';
import { calculateRiskProfile, buildAssetAllocation, generateInvestmentRecommendations } from '@/lib/engines/investment-engine';
import { calculateFullTaxSituation, generateTaxStrategies } from '@/lib/engines/tax-engine';
import { buildRetirementPlan, calculateAge, runMonteCarlo, analyzeSocialSecurityClaiming } from '@/lib/engines/retirement-engine';
import { analyzeInsuranceNeeds } from '@/lib/engines/insurance-engine';
import { buildEstatePlan } from '@/lib/engines/estate-engine';
import { buildEducationPlan } from '@/lib/engines/education-engine';

const panels: Record<string, React.ComponentType> = {
  overview: OverviewPanel,
  cashflow: CashFlowPanel,
  networth: NetWorthPanel,
  investments: InvestmentPanel,
  tax: TaxPanel,
  retirement: RetirementPanel,
  debt: DebtPanel,
  insurance: InsurancePanel,
  estate: EstatePanel,
  education: EducationPanel,
  goals: GoalsPanel,
  scenarios: ScenarioPanel,
};

export default function DashboardPage() {
  const router = useRouter();
  const store = useFinancialStore();
  const [activePanel, setActivePanel] = useState('overview');
  const [analysisRun, setAnalysisRun] = useState(false);

  // Run all engines on mount
  useEffect(() => {
    if (analysisRun) return;
    setAnalysisRun(true);

    try {
      const age = store.personalInfo.dateOfBirth ? calculateAge(store.personalInfo.dateOfBirth) : 30;
      const annualIncome = store.incomeSources.reduce((s, i) => s + i.annualAmount, 0);
      const totalAssets = store.assets.reduce((s, a) => s + a.currentValue, 0);
      const totalLiabilities = store.liabilities.reduce((s, l) => s + l.currentBalance, 0);
      const nw = totalAssets - totalLiabilities;
      const hasEmergencyFund = store.assets.some(a => a.category === 'cash' && a.currentValue >= 5000);

      // Cash flow & net worth
      const cashFlow = calculateCashFlowSummary(
        store.incomeSources, store.expenses, store.assets, store.liabilities
      );
      store.setCashFlowSummary(cashFlow);

      const netWorth = calculateNetWorthSummary(store.assets, store.liabilities);
      store.setNetWorthSummary(netWorth);

      // Risk profile & investments
      if (Object.keys(store.riskAnswers).length > 0) {
        const riskProfile = calculateRiskProfile(store.riskAnswers, age, annualIncome, nw, hasEmergencyFund);
        store.setRiskProfile(riskProfile);

        const allocation = buildAssetAllocation(riskProfile.riskTolerance, store.assets);
        store.setAssetAllocation(allocation);

        const recs = generateInvestmentRecommendations(riskProfile, allocation, store.assets, age, nw);
        store.setInvestmentRecommendations(recs);
      }

      // Tax
      const taxSituation = calculateFullTaxSituation(
        store.personalInfo, store.incomeSources, store.expenses,
        undefined, undefined, {
          mortgageInterest: store.taxDeductions.mortgageInterest,
          stateLocalTaxes: store.taxDeductions.stateLocalTaxes,
          charitable: store.taxDeductions.charitableDonations,
          medical: store.taxDeductions.medicalExpenses,
        }
      );
      store.setTaxSituation(taxSituation);

      const retirementContribs = store.assets
        .filter(a => a.category === 'retirement')
        .reduce((s, a) => s + (a.annualContribution ?? 0), 0);
      const hasHSA = store.assets.some(a => a.accountType === 'hsa');
      const taxStrategies = generateTaxStrategies(
        taxSituation, retirementContribs, hasHSA, age, store.incomeSources
      );
      store.setTaxStrategies(taxStrategies);

      // Retirement
      const retirementAssets = store.assets.filter(a => a.category === 'retirement');
      const rp = store.retirementPreferences;
      const retirement = buildRetirementPlan(
        store.personalInfo, store.incomeSources, retirementAssets,
        rp.targetRetirementAge || 65,
        (rp.incomeReplacementRatio || 80) / 100
      );
      store.setRetirementPlan(retirement);

      // Monte Carlo simulation
      if (retirement.yearsToRetirement > 0) {
        const mcResults = runMonteCarlo(
          retirement.currentRetirementSavings,
          retirement.annualContributions + retirement.employerMatch,
          retirement.yearsToRetirement,
          retirement.yearsInRetirement,
          retirement.desiredAnnualIncome
        );
        store.setMonteCarloResults(mcResults);
      }

      // Insurance
      const insurance = analyzeInsuranceNeeds(
        store.personalInfo, store.incomeSources, store.assets, store.liabilities, store.insurancePolicies
      );
      store.setInsuranceAnalysis(insurance);

      // Estate
      const estate = buildEstatePlan(
        store.personalInfo, store.assets, store.liabilities, store.insurancePolicies, store.estateInfo
      );
      store.setEstatePlan(estate);

      // Education - pass per-child education savings from store
      const eduSavingsMap: Record<string, { savings: number; monthly: number; accountType: any; schoolType?: any }> = {};
      for (const [depId, es] of Object.entries(store.educationSavings)) {
        eduSavingsMap[depId] = { savings: es.currentSavings, monthly: es.monthlyContribution, accountType: es.accountType, schoolType: es.schoolType };
      }
      const education = buildEducationPlan(store.personalInfo.dependents ?? [], eduSavingsMap);
      store.setEducationPlan(education);

      // Financial health score
      const healthScore = calculateFinancialHealthScore(
        cashFlow, netWorth, retirement, insurance, estate, taxSituation, store.goals, age
      );
      store.setFinancialHealthScore(healthScore);
    } catch (e) {
      console.error('Analysis engine error:', e);
    }
  }, [analysisRun]);

  const ActiveComponent = panels[activePanel] || OverviewPanel;

  return (
    <DashboardLayout activePanel={activePanel} onPanelChange={setActivePanel}>
      <ActiveComponent />
    </DashboardLayout>
  );
}
