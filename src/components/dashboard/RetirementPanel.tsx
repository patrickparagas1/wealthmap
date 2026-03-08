'use client';
import { useFinancialStore } from '@/store/financial-store';
import { formatCurrency } from '@/lib/utils';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell } from 'recharts';
import { Clock } from 'lucide-react';

export default function RetirementPanel() {
  const { retirementPlan, personalInfo, monteCarloResults } = useFinancialStore();

  if (!retirementPlan) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Retirement Planning</h1>
        <div className="p-8 rounded-2xl bg-slate-800/40 border border-slate-700/50 text-center">
          <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Complete your financial questionnaire to see retirement projections.</p>
        </div>
      </div>
    );
  }

  const r = retirementPlan;
  const fundedPct = Math.min(100, Math.round(r.fundedRatio * 100));

  // Generate simple projection data
  const projectionData: { age: number; savings: number }[] = [];
  let savings = r.currentRetirementSavings;
  const annualReturn = 0.07;
  for (let age = r.currentAge; age <= 90; age++) {
    projectionData.push({ age, savings: Math.round(savings) });
    if (age < r.targetRetirementAge) {
      savings = savings * (1 + annualReturn) + r.annualContributions + r.employerMatch;
    } else {
      savings = savings * (1 + 0.04) - r.desiredAnnualIncome;
    }
    if (savings < 0) savings = 0;
  }

  // SS claiming comparison data
  const ssData = [
    { age: 'Age 62', monthly: r.socialSecurityEstimate?.estimatedMonthlyAt62 ?? 0, annual: (r.socialSecurityEstimate?.estimatedMonthlyAt62 ?? 0) * 12 },
    { age: `FRA (${r.socialSecurityEstimate?.fullRetirementAge ?? 67})`, monthly: r.socialSecurityEstimate?.estimatedMonthlyAtFRA ?? 0, annual: (r.socialSecurityEstimate?.estimatedMonthlyAtFRA ?? 0) * 12 },
    { age: 'Age 70', monthly: r.socialSecurityEstimate?.estimatedMonthlyAt70 ?? 0, annual: (r.socialSecurityEstimate?.estimatedMonthlyAt70 ?? 0) * 12 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Retirement Planning</h1>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex items-center gap-4">
          <ProgressRing value={fundedPct} size={64} strokeWidth={6} />
          <div>
            <div className="text-xs text-slate-400">Funded</div>
            <div className="text-lg font-bold text-white">{fundedPct}%</div>
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
          <div className="text-xs text-slate-400 mb-1">Target Age</div>
          <div className="text-xl font-bold text-white">{r.targetRetirementAge}</div>
          <div className="text-xs text-slate-500">{r.yearsToRetirement} years away</div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
          <div className="text-xs text-slate-400 mb-1">Current Savings</div>
          <div className="text-xl font-bold text-blue-400">{formatCurrency(r.currentRetirementSavings)}</div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
          <div className="text-xs text-slate-400 mb-1">Projected at Retirement</div>
          <div className="text-xl font-bold text-emerald-400">{formatCurrency(r.projectedRetirementFund)}</div>
        </div>
      </div>

      {/* Monte Carlo Results */}
      {monteCarloResults && (
        <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
          <h2 className="text-sm font-semibold text-white mb-4">Monte Carlo Simulation (1,000 trials)</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <ProgressRing value={Math.round(monteCarloResults.successRate * 100)} size={56} strokeWidth={5} />
              <div>
                <div className="text-xs text-slate-400">Success Rate</div>
                <div className="text-lg font-bold text-white">{Math.round(monteCarloResults.successRate * 100)}%</div>
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">10th Percentile</div>
              <div className="text-lg font-bold text-red-400">{formatCurrency(monteCarloResults.percentile10)}</div>
              <div className="text-xs text-slate-500">Worst case</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">Median Balance</div>
              <div className="text-lg font-bold text-white">{formatCurrency(monteCarloResults.medianBalance)}</div>
              <div className="text-xs text-slate-500">50th percentile</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">90th Percentile</div>
              <div className="text-lg font-bold text-emerald-400">{formatCurrency(monteCarloResults.percentile90)}</div>
              <div className="text-xs text-slate-500">Best case</div>
            </div>
          </div>
        </div>
      )}

      <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
        <h2 className="text-sm font-semibold text-white mb-4">Retirement Savings Projection</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={projectionData}>
              <defs>
                <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="age" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000000).toFixed(1)}M`} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }} formatter={(v: any) => formatCurrency(v)} labelFormatter={l => `Age ${l}`} />
              <ReferenceLine x={r.targetRetirementAge} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: 'Retire', fill: '#f59e0b', fontSize: 12 }} />
              <Area type="monotone" dataKey="savings" stroke="#3b82f6" fill="url(#retGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
          <h2 className="text-sm font-semibold text-white mb-3">Income in Retirement</h2>
          <div className="space-y-3">
            <Row label="Desired Annual Income" value={formatCurrency(r.desiredAnnualIncome)} />
            <Row label="Social Security (at FRA)" value={formatCurrency((r.socialSecurityEstimate?.estimatedMonthlyAtFRA ?? 0) * 12)} />
            <Row label="Pension Income" value={formatCurrency(r.pensionIncome)} />
            <Row label="Safe Withdrawal (4%)" value={formatCurrency(r.sustainableWithdrawalAmount)} />
            <div className="border-t border-slate-700 pt-2">
              <Row label="Retirement Gap" value={formatCurrency(r.retirementGap)} highlight={r.retirementGap > 0} />
            </div>
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
          <h2 className="text-sm font-semibold text-white mb-3">Social Security Claiming Comparison</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ssData}>
                <XAxis dataKey="age" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }} formatter={(v: any) => formatCurrency(v)} />
                <Bar dataKey="annual" name="Annual Benefit" radius={[6, 6, 0, 0]}>
                  {ssData.map((_, i) => <Cell key={i} fill={['#f59e0b', '#3b82f6', '#10b981'][i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1 mt-2">
            {ssData.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-slate-400">{s.age}</span>
                <span className="text-white font-medium">{formatCurrency(s.monthly)}/mo</span>
              </div>
            ))}
          </div>
          {r.additionalSavingsNeeded > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="text-xs text-amber-400 font-medium">Additional Monthly Savings Needed</div>
              <div className="text-lg font-bold text-amber-400">{formatCurrency(r.additionalSavingsNeeded / 12)}/mo</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={`text-sm font-medium ${highlight ? 'text-red-400' : 'text-white'}`}>{value}</span>
    </div>
  );
}
