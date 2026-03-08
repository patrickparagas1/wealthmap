'use client';
import { useFinancialStore } from '@/store/financial-store';
import { generateId } from '@/lib/utils';
import { Plus, Trash2, DollarSign } from 'lucide-react';
import type { IncomeSource } from '@/lib/types';

const incomeTypes = [
  { label: 'Salary/Wages', value: 'salary' }, { label: 'Bonus', value: 'bonus' },
  { label: 'Self-Employment', value: 'self_employment' }, { label: 'Rental Income', value: 'rental' },
  { label: 'Dividends', value: 'dividend' }, { label: 'Interest', value: 'interest' },
  { label: 'Capital Gains', value: 'capital_gains' }, { label: 'Social Security', value: 'social_security' },
  { label: 'Pension', value: 'pension' }, { label: 'Other', value: 'other' },
];

export default function IncomeSection() {
  const { incomeSources, addIncomeSource, removeIncomeSource, setIncomeSources } = useFinancialStore();

  const handleAdd = () => {
    addIncomeSource({
      id: generateId(), type: 'salary', description: '', annualAmount: 0,
      frequency: 'annually', isTaxable: true, owner: 'client',
    });
  };

  const update = (id: string, field: keyof IncomeSource, value: any) => {
    setIncomeSources(incomeSources.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const totalIncome = incomeSources.reduce((sum, s) => sum + s.annualAmount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
        <div>
          <div className="text-xs text-blue-400">Total Annual Income</div>
          <div className="text-2xl font-bold text-white">${totalIncome.toLocaleString()}</div>
        </div>
        <DollarSign className="w-8 h-8 text-blue-400/30" />
      </div>

      {incomeSources.map((source) => (
        <div key={source.id} className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs text-slate-400 font-medium">Income Source</span>
            <button onClick={() => removeIncomeSource(source.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Type</label>
              <select value={source.type} onChange={e => update(source.id, 'type', e.target.value)} className="h-10 bg-slate-800/60 text-white border border-slate-700 focus:border-blue-500 rounded-xl px-4 outline-none text-sm">
                {incomeTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Description</label>
              <input value={source.description} onChange={e => update(source.id, 'description', e.target.value)} placeholder="e.g., Primary salary" className="h-10 bg-slate-800/60 text-white border border-slate-700 focus:border-blue-500 rounded-xl px-4 outline-none text-sm placeholder:text-slate-500" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Annual Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input type="number" value={source.annualAmount || ''} onChange={e => update(source.id, 'annualAmount', Number(e.target.value))} className="h-10 w-full bg-slate-800/60 text-white border border-slate-700 focus:border-blue-500 rounded-xl pl-8 pr-4 outline-none text-sm" />
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-3 mt-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Owner</label>
              <select value={source.owner} onChange={e => update(source.id, 'owner', e.target.value)} className="h-10 bg-slate-800/60 text-white border border-slate-700 rounded-xl px-4 outline-none text-sm">
                <option value="client">Client</option><option value="spouse">Spouse</option><option value="joint">Joint</option>
              </select>
            </div>
            <div className="flex items-center gap-2 mt-6">
              <input type="checkbox" checked={source.isTaxable} onChange={e => update(source.id, 'isTaxable', e.target.checked)} className="rounded border-slate-600" />
              <label className="text-sm text-slate-300">Taxable income</label>
            </div>
          </div>
        </div>
      ))}

      <button onClick={handleAdd} className="w-full py-3 rounded-xl border-2 border-dashed border-slate-700 text-slate-400 hover:text-blue-400 hover:border-blue-500/50 text-sm flex items-center justify-center gap-2">
        <Plus className="w-4 h-4" /> Add Income Source
      </button>
    </div>
  );
}
