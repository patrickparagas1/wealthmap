'use client';
import { useFinancialStore } from '@/store/financial-store';
import { formatCurrency } from '@/lib/utils';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertCircle, CheckCircle } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#a855f7'];

export default function InvestmentPanel() {
  const { riskProfile, assetAllocation, investmentRecommendations, assets } = useFinancialStore();

  const investmentAssets = assets.filter(a => a.category === 'investment' || a.category === 'retirement');
  const totalInvested = investmentAssets.reduce((s, a) => s + a.currentValue, 0);

  const targetData = assetAllocation?.targetAllocation
    .filter(a => a.targetPercent > 0)
    .map(a => ({ name: a.assetClass.replace(/_/g, ' '), value: a.targetPercent })) ?? [];

  const currentData = assetAllocation?.currentAllocation
    .filter(a => a.currentPercent > 0)
    .map(a => ({ name: a.assetClass.replace(/_/g, ' '), value: Math.round(a.currentPercent * 10) / 10 })) ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Investment Analysis</h1>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
          <div className="text-xs text-slate-400 mb-1">Total Invested</div>
          <div className="text-xl font-bold text-blue-400">{formatCurrency(totalInvested)}</div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
          <div className="text-xs text-slate-400 mb-1">Risk Profile</div>
          <div className="text-xl font-bold text-white capitalize">{riskProfile?.riskTolerance?.replace(/_/g, ' ') ?? 'Not assessed'}</div>
          {riskProfile && <div className="text-xs text-slate-500">Score: {riskProfile.compositeScore}/100</div>}
        </div>
        <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
          <div className="text-xs text-slate-400 mb-1">Rebalancing</div>
          <div className="flex items-center gap-2">
            {assetAllocation?.rebalancingNeeded ? (
              <><AlertCircle className="w-5 h-5 text-amber-400" /><span className="text-amber-400 font-bold">Needed</span></>
            ) : (
              <><CheckCircle className="w-5 h-5 text-emerald-400" /><span className="text-emerald-400 font-bold">On Track</span></>
            )}
          </div>
          {assetAllocation && <div className="text-xs text-slate-500">Drift: {assetAllocation.driftPercentage.toFixed(1)}%</div>}
        </div>
      </div>

      {(targetData.length > 0 || currentData.length > 0) && (
        <div className="grid md:grid-cols-2 gap-6">
          <AllocationChart title="Target Allocation" data={targetData} />
          <AllocationChart title="Current Allocation" data={currentData} />
        </div>
      )}

      {investmentRecommendations.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
          <h2 className="text-sm font-semibold text-white mb-4">Recommendations</h2>
          <div className="space-y-3">
            {investmentRecommendations.map(rec => (
              <div key={rec.id} className={`p-3 rounded-lg border ${rec.priority === 'high' ? 'border-red-500/20 bg-red-500/5' : rec.priority === 'medium' ? 'border-amber-500/20 bg-amber-500/5' : 'border-slate-700/50 bg-slate-800/30'}`}>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${rec.priority === 'high' ? 'bg-red-500/20 text-red-400' : rec.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400'}`}>{rec.priority}</span>
                  <span className="text-sm font-medium text-white">{rec.title}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{rec.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AllocationChart({ title, data }: { title: string; data: { name: string; value: number }[] }) {
  return (
    <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
      <h2 className="text-sm font-semibold text-white mb-4">{title}</h2>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart><Pie data={data} cx="50%" cy="50%" outerRadius={70} innerRadius={35} dataKey="value" paddingAngle={2}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie><Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }} formatter={(v: any) => `${v}%`} /></PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-1 mt-2">{data.map((d, i) => (
        <div key={d.name} className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} /><span className="text-slate-400 capitalize">{d.name}</span></div>
          <span className="text-slate-300">{d.value}%</span>
        </div>
      ))}</div>
    </div>
  );
}
