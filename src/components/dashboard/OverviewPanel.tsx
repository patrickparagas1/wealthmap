'use client';
import { useFinancialStore } from '@/store/financial-store';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { formatCurrency } from '@/lib/utils';
import { DollarSign, TrendingUp, Target, AlertTriangle } from 'lucide-react';
import QuickInsights from './QuickInsights';

export default function OverviewPanel() {
  const { personalInfo, financialHealthScore, cashFlowSummary, netWorthSummary, retirementPlan, actionItems } = useFinancialStore();

  const score = financialHealthScore?.overall ?? 0;
  const criticalItems = actionItems.filter(a => a.priority === 'critical');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Welcome{personalInfo.firstName ? `, ${personalInfo.firstName}` : ''}</h1>
        <p className="text-sm text-slate-400 mt-1">Your financial health dashboard</p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex items-center gap-4">
          <ProgressRing value={score} size={64} strokeWidth={6} />
          <div>
            <div className="text-xs text-slate-400">Health Score</div>
            <div className="text-lg font-bold text-white financial-figure">{score}/100</div>
          </div>
        </div>
        <KpiCard icon={DollarSign} label="Net Worth" value={formatCurrency(netWorthSummary?.netWorth ?? 0)} color="text-emerald-400" bg="bg-emerald-500/10" />
        <KpiCard icon={TrendingUp} label="Monthly Surplus" value={formatCurrency(cashFlowSummary?.monthlySurplus ?? 0)} color={(cashFlowSummary?.monthlySurplus ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'} bg={(cashFlowSummary?.monthlySurplus ?? 0) >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'} />
        <KpiCard icon={Target} label="Retirement Funded" value={`${Math.round((retirementPlan?.fundedRatio ?? 0) * 100)}%`} color="text-blue-400" bg="bg-blue-500/10" />
      </div>

      {criticalItems.length > 0 && (
        <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-sm font-semibold text-red-400">Action Required</span>
          </div>
          <div className="space-y-2">
            {criticalItems.slice(0, 3).map(item => (
              <div key={item.id} className="text-sm text-slate-300">
                <span className="font-medium">{item.title}</span>
                <span className="text-slate-500 ml-2 text-xs">{item.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {financialHealthScore && (
        <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
          <h2 className="text-sm font-semibold text-white mb-4">Financial Health Breakdown</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {financialHealthScore.breakdown.map(cat => (
              <div key={cat.category} className="flex items-center gap-3">
                <ProgressRing value={(cat.score / cat.maxScore) * 100} size={44} strokeWidth={4} />
                <div>
                  <div className="text-xs text-slate-400 capitalize">{cat.category}</div>
                  <div className="text-sm font-medium text-white">{cat.score}/{cat.maxScore}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <QuickStat label="Savings Rate" value={`${((cashFlowSummary?.savingsRate ?? 0) * 100).toFixed(1)}%`} target="Target: 20%+" />
        <QuickStat label="Debt-to-Income" value={`${((cashFlowSummary?.debtToIncomeRatio ?? 0) * 100).toFixed(1)}%`} target="Target: <36%" />
        <QuickStat label="Emergency Fund" value={`${(cashFlowSummary?.emergencyFundMonths ?? 0).toFixed(1)} months`} target="Target: 3-6 months" />
      </div>

      <QuickInsights />
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, color, bg }: { icon: any; label: string; value: string; color: string; bg: string }) {
  return (
    <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
      <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-3`}><Icon className={`w-4 h-4 ${color}`} /></div>
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`text-lg font-bold financial-figure ${color}`}>{value}</div>
    </div>
  );
}

function QuickStat({ label, value, target }: { label: string; value: string; target: string }) {
  return (
    <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-lg font-bold text-white financial-figure">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{target}</div>
    </div>
  );
}
