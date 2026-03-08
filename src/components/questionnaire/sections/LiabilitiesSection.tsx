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
        <div className="p-4 rounded-2xl bg-[#ff3b30]/5 border border-[#ff3b30]/10">
          <div className="text-xs text-[#ff3b30] font-medium">Total Debt</div>
          <div className="text-2xl font-bold text-[#1d1d1f] financial-figure">${totalDebt.toLocaleString()}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-[#e8e8ed] shadow-sm">
          <div className="text-xs text-[#6e6e73] font-medium">Monthly Payments</div>
          <div className="text-2xl font-bold text-[#1d1d1f] financial-figure">${monthlyPayments.toLocaleString()}</div>
        </div>
      </div>

      {liabilities.map((liability) => (
        <div key={liability.id} className="p-4 rounded-2xl bg-white border border-[#e8e8ed] shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs text-[#86868b] font-medium">Debt</span>
            <button onClick={() => removeLiability(liability.id)} className="text-[#ff3b30] hover:text-[#ff3b30]/80"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#1d1d1f]">Name</label>
              <input value={liability.name} onChange={e => update(liability.id, 'name', e.target.value)} placeholder="e.g., Chase Visa" className="h-10 bg-white text-[#1d1d1f] border border-[#d2d2d7] focus:border-[#0071e3] rounded-xl px-4 outline-none text-sm placeholder:text-[#86868b]" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#1d1d1f]">Type</label>
              <select value={liability.category} onChange={e => update(liability.id, 'category', e.target.value)} className="h-10 bg-white text-[#1d1d1f] border border-[#d2d2d7] focus:border-[#0071e3] rounded-xl px-4 outline-none text-sm">
                {liabilityTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#1d1d1f]">Current Balance</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b] text-sm">$</span>
                <input type="number" value={liability.currentBalance || ''} onChange={e => update(liability.id, 'currentBalance', Number(e.target.value))} className="h-10 w-full bg-white text-[#1d1d1f] border border-[#d2d2d7] focus:border-[#0071e3] rounded-xl pl-8 pr-4 outline-none text-sm" />
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-3 mt-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#1d1d1f]">Interest Rate (%)</label>
              <input type="number" step="0.1" value={liability.interestRate || ''} onChange={e => update(liability.id, 'interestRate', Number(e.target.value))} className="h-10 bg-white text-[#1d1d1f] border border-[#d2d2d7] focus:border-[#0071e3] rounded-xl px-4 outline-none text-sm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#1d1d1f]">Monthly Payment</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b] text-sm">$</span>
                <input type="number" value={liability.monthlyPayment || ''} onChange={e => update(liability.id, 'monthlyPayment', Number(e.target.value))} className="h-10 w-full bg-white text-[#1d1d1f] border border-[#d2d2d7] focus:border-[#0071e3] rounded-xl pl-8 pr-4 outline-none text-sm" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#1d1d1f]">Remaining Term (months)</label>
              <input type="number" value={liability.remainingTermMonths || ''} onChange={e => update(liability.id, 'remainingTermMonths', Number(e.target.value))} className="h-10 bg-white text-[#1d1d1f] border border-[#d2d2d7] focus:border-[#0071e3] rounded-xl px-4 outline-none text-sm" />
            </div>
          </div>
        </div>
      ))}

      <button onClick={handleAdd} className="w-full py-3 rounded-2xl border-2 border-dashed border-[#d2d2d7] text-[#86868b] hover:text-[#0071e3] hover:border-[#0071e3]/40 text-sm flex items-center justify-center gap-2 transition-colors">
        <Plus className="w-4 h-4" /> Add Debt
      </button>
    </div>
  );
}
