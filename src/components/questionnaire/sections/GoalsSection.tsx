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
      <div className="p-4 rounded-2xl bg-[#af52de]/5 border border-[#af52de]/10 flex items-center gap-3">
        <Target className="w-6 h-6 text-[#af52de]" />
        <div>
          <div className="text-sm font-medium text-[#1d1d1f]">Financial Goals</div>
          <div className="text-xs text-[#6e6e73]">Define your short-term and long-term financial objectives.</div>
        </div>
      </div>

      {/* Retirement Planning Preferences */}
      <div className="p-4 rounded-2xl bg-white border border-[#e8e8ed] shadow-sm space-y-4">
        <div className="text-sm font-semibold text-[#1d1d1f]">Retirement Planning</div>
        <div className="grid md:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#1d1d1f]">Target Retirement Age</label>
            <input type="number" value={retirementPreferences.targetRetirementAge || ''} onChange={e => setRetirementPreferences({ targetRetirementAge: Number(e.target.value) })} placeholder="65" className="h-10 bg-white text-[#1d1d1f] border border-[#d2d2d7] focus:border-[#0071e3] rounded-xl px-4 outline-none text-sm placeholder:text-[#86868b]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#1d1d1f]">Desired Annual Income</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b] text-sm">$</span>
              <input type="number" value={retirementPreferences.desiredRetirementIncome || ''} onChange={e => setRetirementPreferences({ desiredRetirementIncome: Number(e.target.value) })} placeholder="0 = auto-calculate" className="h-10 w-full bg-white text-[#1d1d1f] border border-[#d2d2d7] focus:border-[#0071e3] rounded-xl pl-8 pr-4 outline-none text-sm placeholder:text-[#86868b]" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#1d1d1f]">Income Replacement %</label>
            <div className="relative">
              <input type="number" value={retirementPreferences.incomeReplacementRatio || ''} onChange={e => setRetirementPreferences({ incomeReplacementRatio: Number(e.target.value) })} placeholder="80" className="h-10 w-full bg-white text-[#1d1d1f] border border-[#d2d2d7] focus:border-[#0071e3] rounded-xl px-4 pr-8 outline-none text-sm placeholder:text-[#86868b]" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868b] text-sm">%</span>
            </div>
          </div>
        </div>
        <div className="text-xs text-[#86868b]">If desired income is $0, it will be auto-calculated using the replacement ratio applied to your current income.</div>
      </div>

      {goals.map((goal) => (
        <div key={goal.id} className="p-4 rounded-2xl bg-white border border-[#e8e8ed] shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs text-[#86868b] font-medium">Goal</span>
            <button onClick={() => removeGoal(goal.id)} className="text-[#ff3b30] hover:text-[#ff3b30]/80"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#1d1d1f]">Goal Type</label>
              <select value={goal.type} onChange={e => update(goal.id, 'type', e.target.value)} className="h-10 bg-white text-[#1d1d1f] border border-[#d2d2d7] focus:border-[#0071e3] rounded-xl px-4 outline-none text-sm">
                {goalTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#1d1d1f]">Goal Name</label>
              <input value={goal.name} onChange={e => update(goal.id, 'name', e.target.value)} placeholder="e.g., Down payment" className="h-10 bg-white text-[#1d1d1f] border border-[#d2d2d7] focus:border-[#0071e3] rounded-xl px-4 outline-none text-sm placeholder:text-[#86868b]" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#1d1d1f]">Priority</label>
              <select value={goal.priority} onChange={e => update(goal.id, 'priority', e.target.value)} className="h-10 bg-white text-[#1d1d1f] border border-[#d2d2d7] focus:border-[#0071e3] rounded-xl px-4 outline-none text-sm">
                <option value="essential">Essential</option><option value="important">Important</option><option value="aspirational">Aspirational</option>
              </select>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-3 mt-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#1d1d1f]">Target Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b] text-sm">$</span>
                <input type="number" value={goal.targetAmount || ''} onChange={e => update(goal.id, 'targetAmount', Number(e.target.value))} className="h-10 w-full bg-white text-[#1d1d1f] border border-[#d2d2d7] focus:border-[#0071e3] rounded-xl pl-8 pr-4 outline-none text-sm" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#1d1d1f]">Current Savings</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b] text-sm">$</span>
                <input type="number" value={goal.currentAmount || ''} onChange={e => update(goal.id, 'currentAmount', Number(e.target.value))} className="h-10 w-full bg-white text-[#1d1d1f] border border-[#d2d2d7] focus:border-[#0071e3] rounded-xl pl-8 pr-4 outline-none text-sm" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#1d1d1f]">Target Date</label>
              <input type="date" value={goal.targetDate} onChange={e => update(goal.id, 'targetDate', e.target.value)} className="h-10 bg-white text-[#1d1d1f] border border-[#d2d2d7] focus:border-[#0071e3] rounded-xl px-4 outline-none text-sm" />
            </div>
          </div>
          {goal.targetAmount > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-[#6e6e73] mb-1">
                <span>{goal.percentComplete.toFixed(0)}% complete</span>
                <span className="financial-figure">${goal.currentAmount.toLocaleString()} / ${goal.targetAmount.toLocaleString()}</span>
              </div>
              <div className="w-full bg-[#e8e8ed] rounded-full h-2">
                <div className="bg-[#0071e3] h-2 rounded-full transition-all" style={{ width: `${Math.min(100, goal.percentComplete)}%` }} />
              </div>
            </div>
          )}
        </div>
      ))}

      <button onClick={handleAdd} className="w-full py-3 rounded-2xl border-2 border-dashed border-[#d2d2d7] text-[#86868b] hover:text-[#0071e3] hover:border-[#0071e3]/40 text-sm flex items-center justify-center gap-2 transition-colors">
        <Plus className="w-4 h-4" /> Add Goal
      </button>
    </div>
  );
}
