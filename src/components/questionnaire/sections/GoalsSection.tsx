'use client';
import { useFinancialStore } from '@/store/financial-store';
import { generateId } from '@/lib/utils';
import { Plus, Trash2, Target } from 'lucide-react';
import type { FinancialGoal, GoalType, GoalPriority } from '@/lib/types';

const goalTypes: { label: string; value: GoalType }[] = [
  { label: 'Retirement', value: 'retirement' }, { label: 'Education Fund', value: 'education' },
  { label: 'Home Purchase', value: 'home_purchase' }, { label: 'Emergency Fund', value: 'emergency_fund' },
  { label: 'Debt Payoff', value: 'debt_payoff' }, { label: 'Vacation', value: 'vacation' },
  { label: 'Car Purchase', value: 'car_purchase' }, { label: 'Wedding', value: 'wedding' },
  { label: 'Start Business', value: 'business' }, { label: 'Charitable Giving', value: 'charitable' },
  { label: 'Other', value: 'other' },
];

export default function GoalsSection() {
  const { goals, addGoal, removeGoal, setGoals, retirementPreferences, setRetirementPreferences } = useFinancialStore();

  const handleAdd = () => {
    addGoal({
      id: generateId(), type: 'other', name: '', description: '', targetAmount: 0,
      currentAmount: 0, targetDate: '', priority: 'important', monthlyContribution: 0,
      expectedReturn: 0.07, projectedValue: 0, onTrack: false, percentComplete: 0,
    });
  };

  const update = (id: string, field: keyof FinancialGoal, value: any) => {
    setGoals(goals.map(g => {
      if (g.id !== id) return g;
      const updated = { ...g, [field]: value };
      updated.percentComplete = updated.targetAmount > 0 ? Math.min(100, (updated.currentAmount / updated.targetAmount) * 100) : 0;
      return updated;
    }));
  };

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/10 flex items-center gap-3">
        <Target className="w-6 h-6 text-violet-400" />
        <div>
          <div className="text-sm font-medium text-white">Financial Goals</div>
          <div className="text-xs text-slate-400">Define your short-term and long-term financial objectives.</div>
        </div>
      </div>

      {/* Retirement Planning Preferences */}
      <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 space-y-4">
        <div className="text-sm font-medium text-white">Retirement Planning</div>
        <div className="grid md:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Target Retirement Age</label>
            <input type="number" value={retirementPreferences.targetRetirementAge || ''} onChange={e => setRetirementPreferences({ targetRetirementAge: Number(e.target.value) })} placeholder="65" className="h-10 bg-slate-800/60 text-white border border-slate-700 rounded-xl px-4 outline-none text-sm placeholder:text-slate-500" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Desired Annual Income</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <input type="number" value={retirementPreferences.desiredRetirementIncome || ''} onChange={e => setRetirementPreferences({ desiredRetirementIncome: Number(e.target.value) })} placeholder="0 = auto-calculate" className="h-10 w-full bg-slate-800/60 text-white border border-slate-700 rounded-xl pl-8 pr-4 outline-none text-sm placeholder:text-slate-500" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Income Replacement %</label>
            <div className="relative">
              <input type="number" value={retirementPreferences.incomeReplacementRatio || ''} onChange={e => setRetirementPreferences({ incomeReplacementRatio: Number(e.target.value) })} placeholder="80" className="h-10 w-full bg-slate-800/60 text-white border border-slate-700 rounded-xl px-4 pr-8 outline-none text-sm placeholder:text-slate-500" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
            </div>
          </div>
        </div>
        <div className="text-xs text-slate-500">If desired income is $0, it will be auto-calculated using the replacement ratio applied to your current income.</div>
      </div>

      {goals.map((goal) => (
        <div key={goal.id} className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs text-slate-400">Goal</span>
            <button onClick={() => removeGoal(goal.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Goal Type</label>
              <select value={goal.type} onChange={e => update(goal.id, 'type', e.target.value)} className="h-10 bg-slate-800/60 text-white border border-slate-700 rounded-xl px-4 outline-none text-sm">
                {goalTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Goal Name</label>
              <input value={goal.name} onChange={e => update(goal.id, 'name', e.target.value)} placeholder="e.g., Down payment" className="h-10 bg-slate-800/60 text-white border border-slate-700 rounded-xl px-4 outline-none text-sm placeholder:text-slate-500" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Priority</label>
              <select value={goal.priority} onChange={e => update(goal.id, 'priority', e.target.value)} className="h-10 bg-slate-800/60 text-white border border-slate-700 rounded-xl px-4 outline-none text-sm">
                <option value="essential">Essential</option><option value="important">Important</option><option value="aspirational">Aspirational</option>
              </select>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-3 mt-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Target Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input type="number" value={goal.targetAmount || ''} onChange={e => update(goal.id, 'targetAmount', Number(e.target.value))} className="h-10 w-full bg-slate-800/60 text-white border border-slate-700 rounded-xl pl-8 pr-4 outline-none text-sm" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Current Savings</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input type="number" value={goal.currentAmount || ''} onChange={e => update(goal.id, 'currentAmount', Number(e.target.value))} className="h-10 w-full bg-slate-800/60 text-white border border-slate-700 rounded-xl pl-8 pr-4 outline-none text-sm" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Target Date</label>
              <input type="date" value={goal.targetDate} onChange={e => update(goal.id, 'targetDate', e.target.value)} className="h-10 bg-slate-800/60 text-white border border-slate-700 rounded-xl px-4 outline-none text-sm" />
            </div>
          </div>
          {goal.targetAmount > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>{goal.percentComplete.toFixed(0)}% complete</span>
                <span>${goal.currentAmount.toLocaleString()} / ${goal.targetAmount.toLocaleString()}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full transition-all" style={{ width: `${Math.min(100, goal.percentComplete)}%` }} />
              </div>
            </div>
          )}
        </div>
      ))}

      <button onClick={handleAdd} className="w-full py-3 rounded-xl border-2 border-dashed border-slate-700 text-slate-400 hover:text-blue-400 hover:border-blue-500/50 text-sm flex items-center justify-center gap-2">
        <Plus className="w-4 h-4" /> Add Goal
      </button>
    </div>
  );
}
