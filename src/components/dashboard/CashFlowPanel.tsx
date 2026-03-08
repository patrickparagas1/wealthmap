'use client';
import { useFinancialStore } from '@/store/financial-store';
import { formatCurrency } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowUp, ArrowDown } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export default function CashFlowPanel() {
  const { incomeSources, expenses } = useFinancialStore();

  const totalIncome = incomeSources.reduce((s, i) => s + i.annualAmount / 12, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.monthlyAmount, 0);
  const surplus = totalIncome - totalExpenses;

  const expenseByCategory = expenses.reduce((acc, e) => {
    const cat = e.category.replace(/_/g, ' ');
    acc[cat] = (acc[cat] || 0) + e.monthlyAmount;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(expenseByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value: Math.round(value) }));

  const barData = [
    { name: 'Income', amount: Math.round(totalIncome) },
    { name: 'Fixed', amount: Math.round(expenses.filter(e => e.isFixed).reduce((s, e) => s + e.monthlyAmount, 0)) },
    { name: 'Discretionary', amount: Math.round(expenses.filter(e => e.isDiscretionary).reduce((s, e) => s + e.monthlyAmount, 0)) },
    { name: 'Surplus', amount: Math.round(surplus) },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Cash Flow Analysis</h1>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-1"><ArrowUp className="w-4 h-4 text-emerald-400" /><span className="text-xs text-slate-400">Monthly Income</span></div>
          <div className="text-xl font-bold text-emerald-400">{formatCurrency(totalIncome)}</div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-1"><ArrowDown className="w-4 h-4 text-red-400" /><span className="text-xs text-slate-400">Monthly Expenses</span></div>
          <div className="text-xl font-bold text-red-400">{formatCurrency(totalExpenses)}</div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
          <div className="text-xs text-slate-400 mb-1">Monthly Surplus</div>
          <div className={`text-xl font-bold ${surplus >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(surplus)}</div>
          <div className="text-xs text-slate-500">Savings rate: {totalIncome > 0 ? ((surplus / totalIncome) * 100).toFixed(1) : 0}%</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
          <h2 className="text-sm font-semibold text-white mb-4">Income vs Expenses</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }} formatter={(v: any) => formatCurrency(v)} />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                  {barData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
          <h2 className="text-sm font-semibold text-white mb-4">Expense Breakdown</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} innerRadius={40} dataKey="value" paddingAngle={2}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }} formatter={(v: any) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-1 mt-2">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-slate-400 capitalize truncate">{d.name}</span>
                <span className="text-slate-300 ml-auto">{formatCurrency(d.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
