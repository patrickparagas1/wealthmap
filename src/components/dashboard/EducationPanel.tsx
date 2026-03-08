'use client';
import { useFinancialStore } from '@/store/financial-store';
import { formatCurrency } from '@/lib/utils';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { GraduationCap } from 'lucide-react';

export default function EducationPanel() {
  const { educationPlan, personalInfo } = useFinancialStore();

  const children = personalInfo.dependents?.filter(d => d.relationship === 'child') ?? [];

  if (!educationPlan && children.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Education Planning</h1>
        <div className="p-8 rounded-2xl bg-slate-800/40 border border-slate-700/50 text-center">
          <GraduationCap className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Add dependents to see education planning projections.</p>
        </div>
      </div>
    );
  }

  const goals = educationPlan?.children ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Education Planning</h1>

      {educationPlan && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
            <div className="text-xs text-slate-400 mb-1">Total Projected Cost</div>
            <div className="text-xl font-bold text-white">{formatCurrency(educationPlan.totalProjectedCost)}</div>
          </div>
          <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
            <div className="text-xs text-slate-400 mb-1">Current Savings</div>
            <div className="text-xl font-bold text-blue-400">{formatCurrency(educationPlan.totalCurrentSavings)}</div>
          </div>
          <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
            <div className="text-xs text-slate-400 mb-1">Funding Gap</div>
            <div className={`text-xl font-bold ${educationPlan.totalGap > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {educationPlan.totalGap > 0 ? formatCurrency(educationPlan.totalGap) : 'Fully Funded'}
            </div>
          </div>
        </div>
      )}

      {goals.length > 0 && (
        <div className="space-y-4">
          {goals.map(goal => (
            <div key={goal.id} className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">{goal.childName}</h3>
                  <p className="text-xs text-slate-400">Age {goal.currentAge} • {goal.yearsToCollege} years to college • {goal.schoolType.replace(/_/g, ' ')}</p>
                </div>
                <ProgressRing value={goal.fundedPercent} size={52} strokeWidth={5} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><div className="text-xs text-slate-400">Projected Cost</div><div className="text-sm font-bold text-white">{formatCurrency(goal.projectedTotalCost)}</div></div>
                <div><div className="text-xs text-slate-400">Current Savings</div><div className="text-sm font-bold text-blue-400">{formatCurrency(goal.currentSavings)}</div></div>
                <div><div className="text-xs text-slate-400">Monthly Needed</div><div className="text-sm font-bold text-amber-400">{formatCurrency(goal.monthlyContribution)}</div></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {educationPlan && educationPlan.recommendations.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
          <h2 className="text-sm font-semibold text-white mb-4">Recommendations</h2>
          <div className="space-y-3">
            {educationPlan.recommendations.map(rec => (
              <div key={rec.id} className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/30">
                <span className="text-sm font-medium text-white">{rec.title}</span>
                <p className="text-xs text-slate-400 mt-1">{rec.description}</p>
                {rec.monthlySavingsNeeded > 0 && <p className="text-xs text-blue-400 mt-1">Monthly: {formatCurrency(rec.monthlySavingsNeeded)}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
