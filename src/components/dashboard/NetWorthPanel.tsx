'use client';
import { useFinancialStore } from '@/store/financial-store';
import { formatCurrency } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#ef4444'];

export default function NetWorthPanel() {
  const { assets, liabilities } = useFinancialStore();

  const totalAssets = assets.reduce((s, a) => s + a.currentValue, 0);
  const totalLiabilities = liabilities.reduce((s, l) => s + l.currentBalance, 0);
  const netWorth = totalAssets - totalLiabilities;

  const assetsByCategory = assets.reduce((acc, a) => {
    const cat = a.category.replace(/_/g, ' ');
    acc[cat] = (acc[cat] || 0) + a.currentValue;
    return acc;
  }, {} as Record<string, number>);
  const assetPie = Object.entries(assetsByCategory).map(([name, value]) => ({ name, value }));

  const liabsByCategory = liabilities.reduce((acc, l) => {
    const cat = l.category.replace(/_/g, ' ');
    acc[cat] = (acc[cat] || 0) + l.currentBalance;
    return acc;
  }, {} as Record<string, number>);
  const liabPie = Object.entries(liabsByCategory).map(([name, value]) => ({ name, value }));

  const balanceSheet = [
    { name: 'Total Assets', amount: totalAssets },
    { name: 'Total Liabilities', amount: -totalLiabilities },
    { name: 'Net Worth', amount: netWorth },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Net Worth Statement</h1>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50"><div className="text-xs text-slate-400 mb-1">Total Assets</div><div className="text-xl font-bold text-emerald-400">{formatCurrency(totalAssets)}</div></div>
        <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50"><div className="text-xs text-slate-400 mb-1">Total Liabilities</div><div className="text-xl font-bold text-red-400">{formatCurrency(totalLiabilities)}</div></div>
        <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50"><div className="text-xs text-slate-400 mb-1">Net Worth</div><div className={`text-xl font-bold ${netWorth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(netWorth)}</div></div>
      </div>

      <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
        <h2 className="text-sm font-semibold text-white mb-4">Balance Sheet</h2>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={balanceSheet} layout="vertical">
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} width={120} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }} formatter={(v: any) => formatCurrency(Math.abs(v))} />
              <Bar dataKey="amount" radius={[0, 6, 6, 0]}>{balanceSheet.map((entry, i) => <Cell key={i} fill={entry.amount >= 0 ? '#10b981' : '#ef4444'} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <PieSection title="Asset Allocation" data={assetPie} emptyMsg="No assets entered" />
        <PieSection title="Debt Breakdown" data={liabPie} emptyMsg="No liabilities entered" />
      </div>

      {assets.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
          <h2 className="text-sm font-semibold text-white mb-4">Assets Detail</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-slate-400 border-b border-slate-700"><th className="pb-2 pr-4">Name</th><th className="pb-2 pr-4">Category</th><th className="pb-2 pr-4">Owner</th><th className="pb-2 text-right">Value</th></tr></thead>
              <tbody>{assets.map(a => (
                <tr key={a.id} className="border-b border-slate-800/50">
                  <td className="py-2 pr-4 text-white">{a.name || 'Unnamed'}</td>
                  <td className="py-2 pr-4 text-slate-400 capitalize">{a.category.replace(/_/g, ' ')}</td>
                  <td className="py-2 pr-4 text-slate-400 capitalize">{a.owner}</td>
                  <td className="py-2 text-right text-emerald-400">{formatCurrency(a.currentValue)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function PieSection({ title, data, emptyMsg }: { title: string; data: { name: string; value: number }[]; emptyMsg: string }) {
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#ef4444'];
  return (
    <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
      <h2 className="text-sm font-semibold text-white mb-4">{title}</h2>
      {data.length > 0 ? (<>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart><Pie data={data} cx="50%" cy="50%" outerRadius={70} innerRadius={35} dataKey="value" paddingAngle={2}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie><Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }} formatter={(v: any) => formatCurrency(v)} /></PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-1 mt-2">{data.map((d, i) => (
          <div key={d.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} /><span className="text-slate-400 capitalize">{d.name}</span></div>
            <span className="text-slate-300">{formatCurrency(d.value)}</span>
          </div>
        ))}</div>
      </>) : <p className="text-sm text-slate-500">{emptyMsg}</p>}
    </div>
  );
}
