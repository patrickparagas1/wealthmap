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
      <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0071e3]/5 border border-[#0071e3]/10">
        <div>
          <div className="text-xs text-[#0071e3] font-medium">Total Annual Income</div>
          <div className="text-2xl font-bold text-[#1d1d1f] financial-figure">${totalIncome.toLocaleString()}</div>
        </div>
        <DollarSign className="w-8 h-8 text-[#0071e3]/20" />
      </div>

      {incomeSources.map((source) => (
        <div key={source.id} className="p-4 rounded-2xl bg-white border border-[#e8e8ed] shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs text-[#86868b] font-medium">Income Source</span>
            <button onClick={() => removeIncomeSource(source.id)} className="text-[#ff3b30] hover:text-[#ff3b30]/80"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#1d1d1f]">Type</label>
              <select value={source.type} onChange={e => update(source.id, 'type', e.target.value)} className="h-10 bg-white text-[#1d1d1f] border border-[#d2d2d7] focus:border-[#0071e3] rounded-xl px-4 outline-none text-sm">
                {incomeTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#1d1d1f]">Description</label>
              <input value={source.description} onChange={e => update(source.id, 'description', e.target.value)} placeholder="e.g., Primary salary" className="h-10 bg-white text-[#1d1d1f] border border-[#d2d2d7] focus:border-[#0071e3] rounded-xl px-4 outline-none text-sm placeholder:text-[#86868b]" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#1d1d1f]">Annual Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b] text-sm">$</span>
                <input type="number" value={source.annualAmount || ''} onChange={e => update(source.id, 'annualAmount', Number(e.target.value))} className="h-10 w-full bg-white text-[#1d1d1f] border border-[#d2d2d7] focus:border-[#0071e3] rounded-xl pl-8 pr-4 outline-none text-sm" />
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-3 mt-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#1d1d1f]">Owner</label>
              <select value={source.owner} onChange={e => update(source.id, 'owner', e.target.value)} className="h-10 bg-white text-[#1d1d1f] border border-[#d2d2d7] rounded-xl px-4 outline-none text-sm">
                <option value="client">Client</option><option value="spouse">Spouse</option><option value="joint">Joint</option>
              </select>
            </div>
            <div className="flex items-center gap-2 mt-6">
              <input type="checkbox" checked={source.isTaxable} onChange={e => update(source.id, 'isTaxable', e.target.checked)} className="rounded border-[#d2d2d7] accent-[#0071e3]" />
              <label className="text-sm text-[#1d1d1f]">Taxable income</label>
            </div>
          </div>
        </div>
      ))}

      <button onClick={handleAdd} className="w-full py-3 rounded-2xl border-2 border-dashed border-[#d2d2d7] text-[#86868b] hover:text-[#0071e3] hover:border-[#0071e3]/40 text-sm flex items-center justify-center gap-2 transition-colors">
        <Plus className="w-4 h-4" /> Add Income Source
      </button>
    </div>
  );
}
