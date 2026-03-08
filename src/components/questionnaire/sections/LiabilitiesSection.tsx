'use client';
import { useFinancialStore } from '@/store/financial-store';
import { generateId } from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';
import type { Liability, LiabilityCategory } from '@/lib/types';

const liabilityTypes: { label: string; value: LiabilityCategory }[] = [
  { label: 'Mortgage', value: 'mortgage' }, { label: 'Auto Loan', value: 'auto_loan' },
  { label: 'Student Loan', value: 'student_loan' }, { label: 'Credit Card', value: 'credit_card' },
  { label: 'Personal Loan', value: 'personal_loan' }, { label: 'HELOC', value: 'heloc' },
  { label: 'Business Loan', value: 'business_loan' }, { label: 'Other', value: 'other' },
];

export default function LiabilitiesSection() {
  const { liabilities, addLiability, removeLiability, setLiabilities } = useFinancialStore();

  const handleAdd = () => {
    addLiability({
      id: generateId(), name: '', category: 'credit_card', currentBalance: 0,
      originalBalance: 0, interestRate: 0, minimumPayment: 0, monthlyPayment: 0,
      remainingTermMonths: 0, isDeductible: false, owner: 'client',
    });
  };

  const update = (id: string, field: keyof Liability, value: any) => {
    setLiabilities(liabilities.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const totalDebt = liabilities.reduce((sum, l) => sum + l.currentBalance, 0);
  const monthlyPayments = liabilities.reduce((sum, l) => sum + l.monthlyPayment, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
          <div className="text-xs text-red-400">Total Debt</div>
          <div className="text-2xl font-bold text-white">${totalDebt.toLocaleString()}</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
          <div className="text-xs text-slate-400">Monthly Payments</div>
          <div className="text-2xl font-bold text-white">${monthlyPayments.toLocaleString()}</div>
        </div>
      </div>

      {liabilities.map((liability) => (
        <div key={liability.id} className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs text-slate-400">Debt</span>
            <button onClick={() => removeLiability(liability.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Name</label>
              <input value={liability.name} onChange={e => update(liability.id, 'name', e.target.value)} placeholder="e.g., Chase Visa" className="h-10 bg-slate-800/60 text-white border border-slate-700 rounded-xl px-4 outline-none text-sm placeholder:text-slate-500" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Type</label>
              <select value={liability.category} onChange={e => update(liability.id, 'category', e.target.value)} className="h-10 bg-slate-800/60 text-white border border-slate-700 rounded-xl px-4 outline-none text-sm">
                {liabilityTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Current Balance</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input type="number" value={liability.currentBalance || ''} onChange={e => update(liability.id, 'currentBalance', Number(e.target.value))} className="h-10 w-full bg-slate-800/60 text-white border border-slate-700 rounded-xl pl-8 pr-4 outline-none text-sm" />
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-3 mt-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Interest Rate (%)</label>
              <input type="number" step="0.1" value={liability.interestRate || ''} onChange={e => update(liability.id, 'interestRate', Number(e.target.value))} className="h-10 bg-slate-800/60 text-white border border-slate-700 rounded-xl px-4 outline-none text-sm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Monthly Payment</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input type="number" value={liability.monthlyPayment || ''} onChange={e => update(liability.id, 'monthlyPayment', Number(e.target.value))} className="h-10 w-full bg-slate-800/60 text-white border border-slate-700 rounded-xl pl-8 pr-4 outline-none text-sm" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Remaining Term (months)</label>
              <input type="number" value={liability.remainingTermMonths || ''} onChange={e => update(liability.id, 'remainingTermMonths', Number(e.target.value))} className="h-10 bg-slate-800/60 text-white border border-slate-700 rounded-xl px-4 outline-none text-sm" />
            </div>
          </div>
        </div>
      ))}

      <button onClick={handleAdd} className="w-full py-3 rounded-xl border-2 border-dashed border-slate-700 text-slate-400 hover:text-blue-400 hover:border-blue-500/50 text-sm flex items-center justify-center gap-2">
        <Plus className="w-4 h-4" /> Add Debt
      </button>
    </div>
  );
}
