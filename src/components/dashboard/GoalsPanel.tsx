'use client';
import { useFinancialStore } from '@/store/financial-store';
import { formatCurrency } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Target, CheckCircle, Clock } from 'lucide-react';

export default function GoalsPanel() {
  const { goals } = useFinancialStore();

  if (goals.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Financial Goals</h1>
        <div className="p-8 rounded-2xl bg-slate-800/40 border border-slate-700/50 text-center">
          <Target className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Add financial goals in the questionnaire to track progress.</p>
        </div>
      </div>
    );
  }

  const chartData = goals.map(g => ({
    name: g.name.length > 15 ? g.name.slice(0, 15) + '...' : g.name,
    progress: Math.round(g.percentComplete),
  }));

  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalCurrent = goals.reduce((s, g) => s + g.currentAmount, 0);
  const onTrackCount = goals.filter(g => g.onTrack).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Financial Goals</h1>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
          <div className="text-xs text-slate-400 mb-1">Total Goals</div>
          <div className="text-xl font-bold text-white">{goals.length}</div>
          <div className="text-xs text-emerald-400">{onTrackCount} on track</div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
          <div className="text-xs text-slate-400 mb-1">Total Target</div>
          <div className="text-xl font-bold text-white">{formatCurrency(totalTarget)}</div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
          <div className="text-xs text-slate-400 mb-1">Total Saved</div>
          <div className="text-xl font-bold text-blue-400">{formatCurrency(totalCurrent)}</div>
          <div className="text-xs text-slate-500">{totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0}% overall</div>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
        <h2 className="text-sm font-semibold text-white mb-4">Goal Progress</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={120} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }} formatter={(v: any) => `${v}%`} />
              <Bar dataKey="progress" radius={[0, 6, 6, 0]}>
                {chartData.map((d, i) => <Cell key={i} fill={d.progress >= 75 ? '#10b981' : d.progress >= 40 ? '#f59e0b' : '#3b82f6'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-3">
        {goals.map(goal => (
          <div key={goal.id} className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    goal.priority === 'essential' ? 'bg-red-500/20 text-red-400' :
                    goal.priority === 'important' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-slate-700 text-slate-400'
                  }`}>{goal.priority}</span>
                  <span className="text-sm font-medium text-white">{goal.name}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{goal.type.replace(/_/g, ' ')} • Target: {goal.targetDate}</p>
              </div>
              {goal.onTrack ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <Clock className="w-5 h-5 text-amber-400" />}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-slate-700 rounded-full">
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, goal.percentComplete)}%`, backgroundColor: goal.percentComplete >= 75 ? '#10b981' : goal.percentComplete >= 40 ? '#f59e0b' : '#3b82f6' }} />
              </div>
              <span className="text-xs text-slate-400 w-12 text-right">{Math.round(goal.percentComplete)}%</span>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-slate-400">Saved: {formatCurrency(goal.currentAmount)}</span>
              <span className="text-slate-400">Target: {formatCurrency(goal.targetAmount)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
