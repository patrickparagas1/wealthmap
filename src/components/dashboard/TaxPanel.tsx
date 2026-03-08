'use client';
import { useFinancialStore } from '@/store/financial-store';
import { formatCurrency } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingDown, Lightbulb } from 'lucide-react';

export default function TaxPanel() {
  const { taxSituation, taxStrategies } = useFinancialStore();

  const taxBreakdown = taxSituation ? [
    { name: 'Federal Tax', amount: taxSituation.federalTaxLiability },
    { name: 'State Tax', amount: taxSituation.stateTaxLiability },
    { name: 'FICA', amount: taxSituation.ficaTax },
  ] : [];

  const incomeBreakdown = taxSituation ? [
    { name: 'Gross Income', amount: taxSituation.grossIncome },
    { name: 'AGI', amount: taxSituation.adjustedGrossIncome },
    { name: 'Taxable Income', amount: taxSituation.taxableIncome },
    { name: 'Total Tax', amount: taxSituation.totalTaxLiability },
  ] : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Tax Analysis</h1>

      {taxSituation ? (
        <>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
              <div className="text-xs text-slate-400 mb-1">Total Tax Liability</div>
              <div className="text-xl font-bold text-red-400">{formatCurrency(taxSituation.totalTaxLiability)}</div>
            </div>
            <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
              <div className="text-xs text-slate-400 mb-1">Effective Rate</div>
              <div className="text-xl font-bold text-white">{(taxSituation.effectiveTaxRate * 100).toFixed(1)}%</div>
            </div>
            <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
              <div className="text-xs text-slate-400 mb-1">Marginal Rate</div>
              <div className="text-xl font-bold text-amber-400">{(taxSituation.marginalTaxRate * 100).toFixed(0)}%</div>
            </div>
            <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
              <div className="text-xs text-slate-400 mb-1">Deduction Method</div>
              <div className="text-xl font-bold text-white">{taxSituation.useItemized ? 'Itemized' : 'Standard'}</div>
              <div className="text-xs text-slate-500">{formatCurrency(taxSituation.useItemized ? taxSituation.itemizedDeductions.total : taxSituation.standardDeduction)}</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
              <h2 className="text-sm font-semibold text-white mb-4">Income to Tax Waterfall</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={incomeBreakdown}>
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }} formatter={(v: any) => formatCurrency(v)} />
                    <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                      {incomeBreakdown.map((_, i) => <Cell key={i} fill={i === 3 ? '#ef4444' : '#3b82f6'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
              <h2 className="text-sm font-semibold text-white mb-4">Tax Breakdown</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={taxBreakdown} layout="vertical">
                    <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} width={90} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }} formatter={(v: any) => formatCurrency(v)} />
                    <Bar dataKey="amount" fill="#ef4444" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="p-8 rounded-2xl bg-slate-800/40 border border-slate-700/50 text-center">
          <TrendingDown className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Tax analysis will appear after completing your financial plan.</p>
        </div>
      )}

      {taxStrategies.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-semibold text-white">Tax Optimization Strategies</h2>
          </div>
          <div className="space-y-3">
            {taxStrategies.map(s => (
              <div key={s.id} className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{s.title}</span>
                  <span className="text-xs font-medium text-emerald-400">Save {formatCurrency(s.estimatedSavings)}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
