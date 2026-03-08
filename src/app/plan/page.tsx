'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFinancialStore } from '@/store/financial-store';
import {
  ArrowLeft, Download, Printer, BarChart3, CheckCircle2,
  AlertTriangle, ChevronDown, ChevronUp, Clock, DollarSign,
  Shield, TrendingUp, Heart, GraduationCap, FileText, Target,
  PieChart, Calculator
} from 'lucide-react';

// Analysis engine imports
import { calculateCashFlowSummary, calculateNetWorthSummary, calculateFinancialHealthScore } from '@/lib/engines/financial-health-engine';
import { calculateRiskProfile, buildAssetAllocation, generateInvestmentRecommendations } from '@/lib/engines/investment-engine';
import { calculateFullTaxSituation, generateTaxStrategies } from '@/lib/engines/tax-engine';
import { buildRetirementPlan, calculateAge, runMonteCarlo } from '@/lib/engines/retirement-engine';
import { analyzeInsuranceNeeds } from '@/lib/engines/insurance-engine';
import { buildEstatePlan } from '@/lib/engines/estate-engine';
import { buildEducationPlan } from '@/lib/engines/education-engine';
import { generatePlanPDF } from '@/lib/pdf-export';

type SectionId = 'executive' | 'networth' | 'cashflow' | 'investments' | 'tax' | 'retirement' | 'insurance' | 'estate' | 'education' | 'actions';

interface PlanSection {
  id: SectionId;
  title: string;
  icon: React.ElementType;
}

const sections: PlanSection[] = [
  { id: 'executive', title: 'Executive Summary', icon: FileText },
  { id: 'networth', title: 'Net Worth Analysis', icon: DollarSign },
  { id: 'cashflow', title: 'Cash Flow Analysis', icon: TrendingUp },
  { id: 'investments', title: 'Investment Strategy', icon: PieChart },
  { id: 'tax', title: 'Tax Planning', icon: Calculator },
  { id: 'retirement', title: 'Retirement Planning', icon: Target },
  { id: 'insurance', title: 'Risk Management', icon: Shield },
  { id: 'estate', title: 'Estate Planning', icon: FileText },
  { id: 'education', title: 'Education Planning', icon: GraduationCap },
  { id: 'actions', title: 'Action Items', icon: CheckCircle2 },
];

function PriorityBadge({ priority }: { priority: string }) {
  const config: Record<string, { bg: string; text: string }> = {
    critical: { bg: 'bg-red-500/10', text: 'text-red-400' },
    high: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
    medium: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
    low: { bg: 'bg-slate-500/10', text: 'text-slate-400' },
  };
  const c = config[priority] || config.medium;
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${c.bg} ${c.text}`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
}

function Metric({ label, value, sublabel }: { label: string; value: string; sublabel?: string }) {
  return (
    <div className="p-4 rounded-lg bg-slate-800/50">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className="text-lg font-bold text-white">{value}</div>
      {sublabel && <div className="text-xs text-slate-500 mt-0.5">{sublabel}</div>}
    </div>
  );
}

export default function FinancialPlanPage() {
  const router = useRouter();
  const store = useFinancialStore();
  const [expandedSections, setExpandedSections] = useState<Set<SectionId>>(new Set(['executive', 'actions']));

  const toggleSection = (id: SectionId) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedSections(new Set(sections.map(s => s.id)));
  const collapseAll = () => setExpandedSections(new Set());

  // Run all engines (matching dashboard)
  useEffect(() => {
    try {
      const age = store.personalInfo.dateOfBirth ? calculateAge(store.personalInfo.dateOfBirth) : 30;
      const annualIncome = store.incomeSources.reduce((s, i) => s + i.annualAmount, 0);
      const totalAssets = store.assets.reduce((s, a) => s + a.currentValue, 0);
      const totalLiabilities = store.liabilities.reduce((s, l) => s + l.currentBalance, 0);
      const nwVal = totalAssets - totalLiabilities;
      const hasEmergencyFund = store.assets.some(a => a.category === 'cash' && a.currentValue >= 5000);

      const cf = calculateCashFlowSummary(store.incomeSources, store.expenses, store.assets, store.liabilities);
      store.setCashFlowSummary(cf);
      const nw = calculateNetWorthSummary(store.assets, store.liabilities);
      store.setNetWorthSummary(nw);

      if (Object.keys(store.riskAnswers).length > 0) {
        const riskProfile = calculateRiskProfile(store.riskAnswers, age, annualIncome, nwVal, hasEmergencyFund);
        store.setRiskProfile(riskProfile);
        const allocation = buildAssetAllocation(riskProfile.riskTolerance, store.assets);
        store.setAssetAllocation(allocation);
        const recs = generateInvestmentRecommendations(riskProfile, allocation, store.assets, age, nwVal);
        store.setInvestmentRecommendations(recs);
      }

      const tax = calculateFullTaxSituation(store.personalInfo, store.incomeSources, store.expenses, undefined, undefined, {
        mortgageInterest: store.taxDeductions.mortgageInterest,
        stateLocalTaxes: store.taxDeductions.stateLocalTaxes,
        charitable: store.taxDeductions.charitableDonations,
        medical: store.taxDeductions.medicalExpenses,
      });
      store.setTaxSituation(tax);

      const retirementContribs = store.assets.filter(a => a.category === 'retirement').reduce((s, a) => s + (a.annualContribution ?? 0), 0);
      const hasHSA = store.assets.some(a => a.accountType === 'hsa');
      store.setTaxStrategies(generateTaxStrategies(tax, retirementContribs, hasHSA, age, store.incomeSources));

      const rp2 = store.retirementPreferences;
      const retirement = buildRetirementPlan(store.personalInfo, store.incomeSources, store.assets.filter(a => a.category === 'retirement'), rp2.targetRetirementAge || 65, (rp2.incomeReplacementRatio || 80) / 100);
      store.setRetirementPlan(retirement);

      if (retirement.yearsToRetirement > 0) {
        store.setMonteCarloResults(runMonteCarlo(retirement.currentRetirementSavings, retirement.annualContributions + retirement.employerMatch, retirement.yearsToRetirement, retirement.yearsInRetirement, retirement.desiredAnnualIncome));
      }

      store.setInsuranceAnalysis(analyzeInsuranceNeeds(store.personalInfo, store.incomeSources, store.assets, store.liabilities, store.insurancePolicies));
      store.setEstatePlan(buildEstatePlan(store.personalInfo, store.assets, store.liabilities, store.insurancePolicies, store.estateInfo));

      const eduSavingsMap: Record<string, { savings: number; monthly: number; accountType: any; schoolType?: any }> = {};
      for (const [depId, es] of Object.entries(store.educationSavings)) {
        eduSavingsMap[depId] = { savings: es.currentSavings, monthly: es.monthlyContribution, accountType: es.accountType, schoolType: es.schoolType };
      }
      store.setEducationPlan(buildEducationPlan(store.personalInfo.dependents ?? [], eduSavingsMap));

      store.setFinancialHealthScore(calculateFinancialHealthScore(cf, nw, retirement, store.insuranceAnalysis!, store.estatePlan!, tax, store.goals, age));
    } catch (e) {
      console.error('Plan page engine error:', e);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { cashFlowSummary: cf, netWorthSummary: nw, taxSituation: tax, retirementPlan: rp } = store;
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const fmtCurrency = (n: number | undefined | null) => {
    if (n == null) return '$0';
    return n < 0 ? `-$${Math.abs(n).toLocaleString()}` : `$${n.toLocaleString()}`;
  };

  const fmtPct = (n: number | undefined | null) => {
    if (n == null) return '0%';
    return `${(n * 100).toFixed(1)}%`;
  };

  return (
    <div className="min-h-screen bg-slate-950 theme-dark">
      {/* Header */}
      <div className="glass border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/dashboard')} className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white">Comprehensive Financial Plan</h1>
              <p className="text-xs text-slate-500">
                Prepared for {store.personalInfo.firstName || 'Client'} {store.personalInfo.lastName} | {today}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white border border-slate-700 rounded-lg"
            >
              Expand All
            </button>
            <button
              onClick={() => generatePlanPDF(store)}
              className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg flex items-center gap-2 hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download PDF</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-2 bg-slate-800 text-slate-300 text-sm rounded-lg flex items-center gap-2 hover:bg-slate-700"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Plan Cover */}
        <div className="text-center mb-12 py-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">WealthMap Financial Plan</h1>
          <p className="text-slate-400 text-lg">
            Prepared for {store.personalInfo.firstName || 'Client'} {store.personalInfo.lastName}
          </p>
          <p className="text-slate-500 text-sm mt-2">{today}</p>
          <div className="flex justify-center gap-6 mt-6 text-xs text-slate-500">
            <span>Based on CFP Board Standards</span>
            <span>|</span>
            <span>FINRA Suitability Aligned</span>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {sections.map((section) => {
            const isExpanded = expandedSections.has(section.id);
            return (
              <div key={section.id} className="rounded-xl bg-slate-900/50 border border-slate-800 overflow-hidden">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800/30"
                >
                  <div className="flex items-center gap-3">
                    <section.icon className="w-5 h-5 text-blue-400" />
                    <span className="font-semibold text-white">{section.title}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-6 pb-6 fade-in">
                    <div className="border-t border-slate-800 pt-4">
                      {section.id === 'executive' && (
                        <div className="space-y-4">
                          <p className="text-slate-300 leading-relaxed">
                            This comprehensive financial plan has been prepared based on the information you provided
                            and analyzed using CFP Board planning methodology. Below you will find detailed analysis
                            across all major planning areas with specific, prioritized recommendations.
                          </p>
                          {store.financialHealthScore && (
                            <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/10">
                              <div className="text-sm font-medium text-blue-400 mb-2">Financial Health Score</div>
                              <div className="text-3xl font-bold text-white mb-1">{store.financialHealthScore.overall}/100</div>
                              <p className="text-sm text-slate-400">
                                {store.financialHealthScore.overall >= 80 ? 'Excellent financial health. Continue maintaining your current strategies.' :
                                 store.financialHealthScore.overall >= 60 ? 'Good financial health with some areas needing attention.' :
                                 store.financialHealthScore.overall >= 40 ? 'Several areas need improvement. Review action items below.' :
                                 'Significant gaps identified. Prioritize critical action items.'}
                              </p>
                            </div>
                          )}
                          <div className="grid md:grid-cols-3 gap-4">
                            <Metric label="Net Worth" value={fmtCurrency(nw?.netWorth)} />
                            <Metric label="Monthly Surplus" value={fmtCurrency(cf?.monthlySurplus)} />
                            <Metric label="Savings Rate" value={fmtPct(cf?.savingsRate)} />
                          </div>
                        </div>
                      )}

                      {section.id === 'networth' && (
                        <div className="space-y-4">
                          <div className="grid md:grid-cols-3 gap-4">
                            <Metric label="Total Assets" value={fmtCurrency(nw?.totalAssets)} />
                            <Metric label="Total Liabilities" value={fmtCurrency(nw?.totalLiabilities)} />
                            <Metric label="Net Worth" value={fmtCurrency(nw?.netWorth)} />
                          </div>
                          <div className="grid md:grid-cols-4 gap-4">
                            <Metric label="Liquid Assets" value={fmtCurrency(nw?.totalLiquidAssets)} sublabel="Cash & equivalents" />
                            <Metric label="Investments" value={fmtCurrency(nw?.totalInvestmentAssets)} sublabel="Brokerage accounts" />
                            <Metric label="Retirement" value={fmtCurrency(nw?.totalRetirementAssets)} sublabel="401k, IRA, etc." />
                            <Metric label="Real Estate" value={fmtCurrency(nw?.totalRealEstateAssets)} sublabel="Property equity" />
                          </div>
                          {nw && nw.debtToAssetRatio > 0.5 && (
                            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-slate-300">
                                Your debt-to-asset ratio of {(nw.debtToAssetRatio * 100).toFixed(1)}% is elevated. Focus on debt reduction.
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {section.id === 'cashflow' && (
                        <div className="space-y-4">
                          <div className="grid md:grid-cols-4 gap-4">
                            <Metric label="Monthly Income" value={fmtCurrency(cf?.totalMonthlyIncome)} />
                            <Metric label="Monthly Expenses" value={fmtCurrency(cf?.totalMonthlyExpenses)} />
                            <Metric label="Monthly Surplus" value={fmtCurrency(cf?.monthlySurplus)} />
                            <Metric label="Emergency Fund" value={`${cf?.emergencyFundMonths?.toFixed(1) || 0} months`} />
                          </div>
                          <div className="grid md:grid-cols-3 gap-4">
                            <Metric label="Savings Rate" value={fmtPct(cf?.savingsRate)} sublabel={
                              cf && cf.savingsRate >= 0.20 ? 'Excellent' : cf && cf.savingsRate >= 0.15 ? 'Good' : 'Needs improvement'
                            } />
                            <Metric label="Debt-to-Income" value={fmtPct(cf?.debtToIncomeRatio)} sublabel={
                              cf && cf.debtToIncomeRatio <= 0.36 ? 'Within guidelines' : 'Exceeds recommended 36%'
                            } />
                            <Metric label="Annual Surplus" value={fmtCurrency(cf?.annualSurplus)} />
                          </div>
                        </div>
                      )}

                      {section.id === 'investments' && (
                        <div className="space-y-4">
                          {store.riskProfile ? (
                            <>
                              <div className="grid md:grid-cols-3 gap-4">
                                <Metric label="Risk Tolerance" value={store.riskProfile.riskTolerance.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} />
                                <Metric label="Composite Score" value={`${store.riskProfile.compositeScore}/100`} />
                                <Metric label="Time Horizon" value={store.riskProfile.timeHorizon === 'short' ? '< 5 years' : store.riskProfile.timeHorizon === 'medium' ? '5-15 years' : '15+ years'} />
                              </div>
                              {store.investmentRecommendations.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-medium text-slate-300 mb-3">Recommendations</h4>
                                  <div className="space-y-2">
                                    {store.investmentRecommendations.map((rec) => (
                                      <div key={rec.id} className="p-3 rounded-lg bg-slate-800/50 flex items-start gap-3">
                                        <PriorityBadge priority={rec.priority} />
                                        <div>
                                          <div className="text-sm font-medium text-white">{rec.title}</div>
                                          <div className="text-xs text-slate-400 mt-0.5">{rec.description}</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <p className="text-slate-400 text-sm">Complete the risk assessment questionnaire to receive investment recommendations.</p>
                          )}
                        </div>
                      )}

                      {section.id === 'tax' && (
                        <div className="space-y-4">
                          {tax ? (
                            <>
                              <div className="grid md:grid-cols-3 gap-4">
                                <Metric label="Gross Income" value={fmtCurrency(tax.grossIncome)} />
                                <Metric label="Taxable Income" value={fmtCurrency(tax.taxableIncome)} />
                                <Metric label="Total Tax Liability" value={fmtCurrency(tax.totalTaxLiability)} />
                              </div>
                              <div className="grid md:grid-cols-3 gap-4">
                                <Metric label="Effective Rate" value={fmtPct(tax.effectiveTaxRate)} />
                                <Metric label="Marginal Rate" value={`${(tax.marginalTaxRate * 100).toFixed(0)}%`} />
                                <Metric label="Deduction Method" value={tax.useItemized ? 'Itemized' : 'Standard'} sublabel={fmtCurrency(tax.useItemized ? tax.itemizedDeductions.total : tax.standardDeduction)} />
                              </div>
                              {store.taxStrategies.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-medium text-slate-300 mb-3">Tax Optimization Strategies</h4>
                                  <div className="space-y-2">
                                    {store.taxStrategies.map((s) => (
                                      <div key={s.id} className="p-3 rounded-lg bg-slate-800/50 flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                          <PriorityBadge priority={s.priority} />
                                          <div>
                                            <div className="text-sm font-medium text-white">{s.title}</div>
                                            <div className="text-xs text-slate-400 mt-0.5">{s.description}</div>
                                          </div>
                                        </div>
                                        <div className="text-sm font-semibold text-emerald-400 whitespace-nowrap ml-4">
                                          {fmtCurrency(s.estimatedSavings)}/yr
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <p className="text-slate-400 text-sm">Add income sources to generate tax analysis.</p>
                          )}
                        </div>
                      )}

                      {section.id === 'retirement' && (
                        <div className="space-y-4">
                          {rp ? (
                            <>
                              <div className="grid md:grid-cols-4 gap-4">
                                <Metric label="Current Age" value={rp.currentAge.toString()} />
                                <Metric label="Target Retirement" value={`Age ${rp.targetRetirementAge}`} sublabel={`${rp.yearsToRetirement} years away`} />
                                <Metric label="Projected Fund" value={fmtCurrency(rp.projectedRetirementFund)} />
                                <Metric label="Funded Ratio" value={`${Math.round(rp.fundedRatio * 100)}%`} sublabel={rp.fundedRatio >= 1 ? 'On track' : 'Gap exists'} />
                              </div>
                              <div className="grid md:grid-cols-3 gap-4">
                                <Metric label="Current Savings" value={fmtCurrency(rp.currentRetirementSavings)} />
                                <Metric label="Annual Contributions" value={fmtCurrency(rp.annualContributions)} />
                                <Metric label="Withdrawal Rate" value={`${(rp.withdrawalRate * 100).toFixed(1)}%`} sublabel={`${fmtCurrency(rp.sustainableWithdrawalAmount)}/year`} />
                              </div>
                              <div className="p-4 rounded-lg bg-slate-800/50">
                                <h4 className="text-sm font-medium text-slate-300 mb-3">Social Security Estimates</h4>
                                <div className="grid grid-cols-3 gap-4">
                                  <div>
                                    <div className="text-xs text-slate-500">At Age 62</div>
                                    <div className="font-semibold text-white">{fmtCurrency(rp.socialSecurityEstimate.estimatedMonthlyAt62)}/mo</div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-slate-500">At FRA ({rp.socialSecurityEstimate.fullRetirementAge})</div>
                                    <div className="font-semibold text-emerald-400">{fmtCurrency(rp.socialSecurityEstimate.estimatedMonthlyAtFRA)}/mo</div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-slate-500">At Age 70</div>
                                    <div className="font-semibold text-blue-400">{fmtCurrency(rp.socialSecurityEstimate.estimatedMonthlyAt70)}/mo</div>
                                  </div>
                                </div>
                              </div>
                              {rp.retirementGap > 0 && (
                                <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 flex items-start gap-2">
                                  <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5" />
                                  <p className="text-sm text-slate-300">
                                    Retirement gap of {fmtCurrency(rp.retirementGap)}/year. Consider increasing savings by {fmtCurrency(rp.additionalSavingsNeeded)}/year.
                                  </p>
                                </div>
                              )}
                            </>
                          ) : (
                            <p className="text-slate-400 text-sm">Add your date of birth and income to generate retirement projections.</p>
                          )}
                        </div>
                      )}

                      {section.id === 'insurance' && (
                        <div className="space-y-4">
                          {store.insuranceAnalysis ? (
                            <>
                              <div className="grid md:grid-cols-3 gap-4">
                                <Metric label="Life Insurance Need" value={fmtCurrency(store.insuranceAnalysis.lifeInsuranceNeed)} />
                                <Metric label="Current Coverage" value={fmtCurrency(store.insuranceAnalysis.currentLifeCoverage)} />
                                <Metric label="Coverage Gap" value={fmtCurrency(store.insuranceAnalysis.lifeInsuranceGap)} sublabel={store.insuranceAnalysis.lifeInsuranceGap > 0 ? 'Action needed' : 'Adequate'} />
                              </div>
                              {store.insuranceAnalysis.recommendations.map((rec) => (
                                <div key={rec.id} className="p-3 rounded-lg bg-slate-800/50 flex items-start gap-3">
                                  <PriorityBadge priority={rec.priority} />
                                  <div className="flex-1">
                                    <div className="text-sm font-medium text-white">{rec.title}</div>
                                    <div className="text-xs text-slate-400 mt-0.5">{rec.description}</div>
                                    <div className="text-xs text-emerald-400 mt-1">Est. cost: {rec.estimatedCost}</div>
                                  </div>
                                </div>
                              ))}
                            </>
                          ) : (
                            <p className="text-slate-400 text-sm">Complete the insurance section to receive risk management analysis.</p>
                          )}
                        </div>
                      )}

                      {section.id === 'estate' && (
                        <div className="space-y-4">
                          {store.estatePlan ? (
                            <>
                              <div className="grid md:grid-cols-2 gap-4">
                                <Metric label="Gross Estate Value" value={fmtCurrency(store.estatePlan.grossEstateValue)} />
                                <Metric label="Est. Estate Tax" value={fmtCurrency(store.estatePlan.estimateEstateTax)} />
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-slate-300 mb-3">Document Status</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                  {[
                                    { label: 'Will', has: store.estatePlan.hasWill },
                                    { label: 'Trust', has: store.estatePlan.hasTrust },
                                    { label: 'Power of Attorney', has: store.estatePlan.hasPowerOfAttorney },
                                    { label: 'Healthcare Directive', has: store.estatePlan.hasHealthcareDirective },
                                    { label: 'Beneficiary Designations', has: store.estatePlan.hasBeneficiaryDesignations },
                                  ].map(doc => (
                                    <div key={doc.label} className={`p-2 rounded-lg text-sm flex items-center gap-2 ${doc.has ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                      {doc.has ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                                      {doc.label}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              {store.estatePlan.recommendations.map((rec) => (
                                <div key={rec.id} className="p-3 rounded-lg bg-slate-800/50 flex items-start gap-3">
                                  <PriorityBadge priority={rec.priority} />
                                  <div>
                                    <div className="text-sm font-medium text-white">{rec.title}</div>
                                    <div className="text-xs text-slate-400 mt-0.5">{rec.description}</div>
                                  </div>
                                </div>
                              ))}
                            </>
                          ) : (
                            <p className="text-slate-400 text-sm">Complete the estate planning section for recommendations.</p>
                          )}
                        </div>
                      )}

                      {section.id === 'education' && (
                        <div className="space-y-4">
                          {store.educationPlan && store.educationPlan.children.length > 0 ? (
                            <>
                              <div className="grid md:grid-cols-3 gap-4">
                                <Metric label="Total Projected Cost" value={fmtCurrency(store.educationPlan.totalProjectedCost)} />
                                <Metric label="Current Savings" value={fmtCurrency(store.educationPlan.totalCurrentSavings)} />
                                <Metric label="Funding Gap" value={fmtCurrency(store.educationPlan.totalGap)} />
                              </div>
                              {store.educationPlan.children.map((child) => (
                                <div key={child.id} className="p-4 rounded-lg bg-slate-800/50">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-white">{child.childName}</span>
                                    <span className="text-sm text-slate-400">{child.yearsToCollege} years to college</span>
                                  </div>
                                  <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
                                    <div
                                      className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full"
                                      style={{ width: `${Math.min(100, child.fundedPercent)}%` }}
                                    />
                                  </div>
                                  <div className="flex justify-between text-xs text-slate-400">
                                    <span>{child.fundedPercent.toFixed(0)}% funded</span>
                                    <span>Goal: {fmtCurrency(child.projectedTotalCost)}</span>
                                  </div>
                                </div>
                              ))}
                            </>
                          ) : (
                            <p className="text-slate-400 text-sm">No dependent children listed. Add dependents to receive education planning.</p>
                          )}
                        </div>
                      )}

                      {section.id === 'actions' && (
                        <div className="space-y-3">
                          <p className="text-slate-400 text-sm mb-4">
                            Below are your prioritized action items across all planning areas. Tackle critical items first.
                          </p>
                          {store.actionItems.length > 0 ? (
                            store.actionItems.map((item, i) => (
                              <div key={item.id} className="p-3 rounded-lg bg-slate-800/50 flex items-start gap-3">
                                <span className="text-xs text-slate-500 mt-1 w-6">{i + 1}.</span>
                                <PriorityBadge priority={item.priority} />
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-white">{item.title}</div>
                                  <div className="text-xs text-slate-400 mt-0.5">{item.description}</div>
                                  <div className="text-xs text-slate-500 mt-1">
                                    Category: {item.category.replace(/_/g, ' ')} | Assigned to: {item.assignedTo.replace(/_/g, ' ')}
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8">
                              <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                              <p className="text-slate-400 text-sm">Complete the questionnaire and view your dashboard to generate action items.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Disclaimers */}
        <div className="mt-12 p-6 rounded-xl bg-slate-900/30 border border-slate-800">
          <h4 className="text-sm font-medium text-slate-400 mb-3">Important Disclosures</h4>
          <div className="space-y-2 text-xs text-slate-500 leading-relaxed">
            <p>
              This financial plan is generated based on the information you provided and is for educational and planning purposes only.
              It does not constitute financial advice, investment advice, tax advice, or legal advice.
            </p>
            <p>
              Projections and estimates are based on assumptions about future market conditions, tax rates, and personal circumstances
              that may not be accurate. Past performance does not guarantee future results. All investments involve risk.
            </p>
            <p>
              Consult with qualified professionals (CFP, CPA, attorney) before implementing any financial strategies.
              Tax laws and regulations change frequently; verify current rates and limits before making decisions.
            </p>
            <p>
              WealthMap follows CFP Board planning methodology and FINRA suitability guidelines.
              Investment recommendations are aligned with Regulation Best Interest (Reg BI) standards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
