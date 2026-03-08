'use client';
import { useState } from 'react';
import { useFinancialStore } from '@/store/financial-store';
import { formatCurrency } from '@/lib/utils';
import { compareStrategies } from '@/lib/engines/debt-engine';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { CreditCard, TrendingDown } from 'lucide-react';

export default function DebtPanel() {
  const { liabilities } = useFinancialStore();
  const [extraPayment, setExtraPayment] = useState(0);

  const debtsWithBalance = liabilities.filter(l => l.currentBalance > 0);

  if (debtsWithBalance.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Debt Payoff</h1>
        <div className="p-8 rounded-2xl bg-slate-800/40 border border-slate-700/50 text-center">
          <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No debts to display. Add liabilities in the questionnaire to see payoff strategies.</p>
        </div>
      </div>
    );
  }

  const comparison = compareStrategies(liabilities, extraPayment);
  const { avalanche, snowball } = comparison;
  const [strategy, setStrategy] = useState<'avalanche' | 'snowball'>('avalanche');
  const active = strategy === 'avalanche' ? avalanche : snowball;

  // Build balance-over-time chart data (monthly totals)
  const chartData: { month: number; balance: number }[] = [];
  const debtNames = active.debts.map(d => d.name);
  for (let m = 0; m <= active.totalMonths; m++) {
    const totalAtMonth = debtNames.reduce((sum, name) => {
      const entry = active.monthlyTimeline.filter(t => t.month === m && t.debtName === name).pop();
      if (entry) return sum + entry.remainingBalance;
      // If no entry for this month, check if it was already paid off
      const lastEntry = active.monthlyTimeline.filter(t => t.debtName === name && t.month <= m).pop();
      return sum + (lastEntry ? lastEntry.remainingBalance : 0);
    }, 0);
    if (m % Math.max(1, Math.floor(active.totalMonths / 60)) === 0 || m === active.totalMonths) {
      chartData.push({ month: m, balance: Math.round(totalAtMonth) });
    }
  }

  // Debt breakdown for bar chart
  const debtBreakdown = active.debts.map(d => ({
    name: d.name.length > 15 ? d.name.slice(0, 12) + '...' : d.name,
    balance: d.originalBalance,
    interest: d.totalInterestPaid,
  }));

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  const debtFreeDate = new Date(active.debtFreeDate);
  const debtFreeDateStr = debtFreeDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Debt Payoff</h1>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
          <div className="text-xs text-slate-400 mb-1">Total Debt</div>
          <div className="text-xl font-bold text-red-400">
            {formatCurrency(debtsWithBalance.reduce((s, l) => s + l.currentBalance, 0))}
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
          <div className="text-xs text-slate-400 mb-1">Debt-Free Date</div>
          <div className="text-xl font-bold text-emerald-400">{debtFreeDateStr}</div>
          <div className="text-xs text-slate-500">{active.totalMonths} months</div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
          <div className="text-xs text-slate-400 mb-1">Total Interest</div>
          <div className="text-xl font-bold text-amber-400">{formatCurrency(active.totalInterestPaid)}</div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
          <div className="text-xs text-slate-400 mb-1">Extra Payment</div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
            <input
              type="number"
              value={extraPayment || ''}
              onChange={e => setExtraPayment(Number(e.target.value))}
              placeholder="0"
              className="h-10 w-full bg-slate-800/60 text-white border border-slate-700 rounded-xl pl-8 pr-4 outline-none text-sm"
            />
          </div>
        </div>
      </div>

      {/* Strategy Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setStrategy('avalanche')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${strategy === 'avalanche' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 border border-slate-700 hover:text-white'}`}
        >
          Avalanche (Lowest Interest)
        </button>
        <button
          onClick={() => setStrategy('snowball')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${strategy === 'snowball' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 border border-slate-700 hover:text-white'}`}
        >
          Snowball (Lowest Balance)
        </button>
      </div>

      {/* Interest Savings Comparison */}
      {comparison.interestSavings > 0 && (
        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-center gap-3">
          <TrendingDown className="w-5 h-5 text-blue-400 shrink-0" />
          <div className="text-sm text-slate-300">
            Avalanche saves <span className="text-blue-400 font-semibold">{formatCurrency(comparison.interestSavings)}</span> in interest
            {comparison.timeSavingsMonths > 0 && <> and pays off <span className="text-blue-400 font-semibold">{comparison.timeSavingsMonths} months</span> faster</>}
            {' '}compared to snowball.
          </div>
        </div>
      )}

      {/* Balance Over Time Chart */}
      <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
        <h2 className="text-sm font-semibold text-white mb-4">Balance Over Time</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="debtGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} label={{ value: 'Months', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }} formatter={(v: any) => formatCurrency(v)} labelFormatter={l => `Month ${l}`} />
              <Area type="monotone" dataKey="balance" stroke="#ef4444" fill="url(#debtGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Debt Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
          <h2 className="text-sm font-semibold text-white mb-3">Payoff Order</h2>
          <div className="space-y-3">
            {active.debts.map((d, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: colors[i % colors.length] }}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="text-sm text-white font-medium">{d.name}</div>
                  <div className="text-xs text-slate-400">{formatCurrency(d.originalBalance)} at {d.interestRate.toFixed(1)}%</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white">{d.payoffMonth} mo</div>
                  <div className="text-xs text-amber-400">{formatCurrency(d.totalInterestPaid)} interest</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
          <h2 className="text-sm font-semibold text-white mb-3">Interest Cost by Debt</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={debtBreakdown}>
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }} formatter={(v: any) => formatCurrency(v)} />
                <Bar dataKey="interest" name="Interest Paid" radius={[6, 6, 0, 0]}>
                  {debtBreakdown.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
