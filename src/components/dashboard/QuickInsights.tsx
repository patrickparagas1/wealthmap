'use client';

import { useFinancialStore } from '@/store/financial-store';
import { Lightbulb, TrendingUp, Shield, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';

interface Insight {
  icon: React.ElementType;
  title: string;
  description: string;
  type: 'success' | 'warning' | 'tip' | 'action';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generateInsights(store: any): Insight[] {
  const insights: Insight[] = [];
  const cf = store.cashFlowSummary;
  const nw = store.netWorthSummary;
  const rp = store.retirementPlan;
  const tax = store.taxSituation;
  const annualIncome = store.incomeSources.reduce((s: number, i: { annualAmount: number }) => s + i.annualAmount, 0);

  // Savings rate insights
  if (cf) {
    if (cf.savingsRate >= 0.20) {
      insights.push({
        icon: CheckCircle2, type: 'success',
        title: 'Great savings rate',
        description: `You're saving ${(cf.savingsRate * 100).toFixed(0)}% of income — above the recommended 20%.`,
      });
    } else if (cf.savingsRate < 0.10 && annualIncome > 0) {
      insights.push({
        icon: AlertTriangle, type: 'warning',
        title: 'Low savings rate',
        description: `Your ${(cf.savingsRate * 100).toFixed(0)}% savings rate is below 10%. Try to increase to at least 15%.`,
      });
    }

    // Emergency fund
    if (cf.emergencyFundMonths < 3) {
      insights.push({
        icon: Shield, type: 'action',
        title: 'Build emergency fund',
        description: `You have ${cf.emergencyFundMonths.toFixed(1)} months of expenses saved. Target 3-6 months.`,
      });
    } else if (cf.emergencyFundMonths >= 6) {
      insights.push({
        icon: CheckCircle2, type: 'success',
        title: 'Strong emergency fund',
        description: `${cf.emergencyFundMonths.toFixed(1)} months of expenses covered — well above the 3-6 month target.`,
      });
    }
  }

  // Retirement insights
  if (rp) {
    if (rp.fundedRatio >= 1) {
      insights.push({
        icon: TrendingUp, type: 'success',
        title: 'Retirement on track',
        description: `You're ${Math.round(rp.fundedRatio * 100)}% funded for retirement at age ${rp.targetRetirementAge}.`,
      });
    } else if (rp.fundedRatio < 0.5) {
      insights.push({
        icon: Zap, type: 'action',
        title: 'Retirement gap',
        description: `Only ${Math.round(rp.fundedRatio * 100)}% funded.${rp.additionalSavingsNeeded > 0 ? ` Consider increasing contributions by $${Math.round(rp.additionalSavingsNeeded / 12).toLocaleString()}/mo.` : ' Consider increasing your retirement contributions.'}`,
      });
    }
  }

  // Tax insights
  if (tax && tax.grossIncome > 0) {
    if (tax.effectiveTaxRate > 0.25) {
      insights.push({
        icon: Lightbulb, type: 'tip',
        title: 'Tax optimization opportunity',
        description: `Your ${(tax.effectiveTaxRate * 100).toFixed(1)}% effective rate suggests room for tax-advantaged strategies.`,
      });
    }

    // Roth conversion opportunity
    if (tax.marginalTaxRate <= 0.22 && store.assets.some((a: { accountType?: string }) => a.accountType === 'traditional_ira' || a.accountType === '401k')) {
      insights.push({
        icon: Lightbulb, type: 'tip',
        title: 'Consider Roth conversion',
        description: 'Your current tax bracket is relatively low — a partial Roth conversion could save taxes long-term.',
      });
    }
  }

  // Debt insights
  if (cf && cf.debtToIncomeRatio > 0.36) {
    insights.push({
      icon: AlertTriangle, type: 'warning',
      title: 'High debt-to-income',
      description: `Your ${(cf.debtToIncomeRatio * 100).toFixed(0)}% DTI exceeds the 36% guideline. Focus on debt reduction.`,
    });
  }

  // Net worth milestone
  if (nw && nw.netWorth > 0) {
    const milestones = [1000000, 500000, 250000, 100000];
    for (const m of milestones) {
      if (nw.netWorth >= m) {
        insights.push({
          icon: CheckCircle2, type: 'success',
          title: `Net worth milestone`,
          description: `You've passed the $${(m / 1000).toFixed(0)}k mark. Keep building wealth.`,
        });
        break;
      }
    }
  }

  // If no data yet
  if (insights.length === 0) {
    insights.push({
      icon: Lightbulb, type: 'tip',
      title: 'Complete your profile',
      description: 'Add income, assets, and expenses to receive personalized financial insights.',
    });
  }

  return insights.slice(0, 4);
}

const typeStyles = {
  success: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: 'text-emerald-400' },
  warning: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: 'text-amber-400' },
  tip: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: 'text-blue-400' },
  action: { bg: 'bg-violet-500/10', border: 'border-violet-500/20', icon: 'text-violet-400' },
};

export default function QuickInsights() {
  const store = useFinancialStore();
  const insights = generateInsights(store);

  return (
    <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-4 h-4 text-amber-400" />
        <h2 className="text-sm font-semibold text-white">Smart Insights</h2>
      </div>
      <div className="space-y-3">
        {insights.map((insight, i) => {
          const style = typeStyles[insight.type];
          return (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${style.bg} border ${style.border}`}>
              <insight.icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${style.icon}`} />
              <div>
                <div className="text-sm font-medium text-white">{insight.title}</div>
                <div className="text-xs text-slate-400 mt-0.5">{insight.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
