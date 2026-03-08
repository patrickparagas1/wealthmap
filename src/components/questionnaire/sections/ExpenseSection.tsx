'use client';
import { useFinancialStore } from '@/store/financial-store';
import { generateId } from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';
import type { Expense, ExpenseCategory } from '@/lib/types';

const categories: { label: string; value: ExpenseCategory }[] = [
  { label: 'Housing/Mortgage', value: 'mortgage' }, { label: 'Rent', value: 'rent' },
  { label: 'Property Tax', value: 'property_tax' }, { label: 'Home Insurance', value: 'home_insurance' },
  { label: 'Utilities', value: 'utilities' }, { label: 'Transportation', value: 'transportation' },
  { label: 'Auto Payment', value: 'auto_payment' }, { label: 'Auto Insurance', value: 'auto_insurance' },
  { label: 'Food/Groceries', value: 'food' }, { label: 'Healthcare', value: 'healthcare' },
  { label: 'Health Insurance', value: 'health_insurance' }, { label: 'Childcare', value: 'childcare' },
  { label: 'Education', value: 'education' }, { label: 'Debt Payments', value: 'debt_payments' },
  { label: 'Entertainment', value: 'entertainment' }, { label: 'Clothing', value: 'clothing' },
  { label: 'Charitable', value: 'charitable' }, { label: 'Subscriptions', value: 'subscriptions' },
  { label: 'Travel', value: 'travel' }, { label: 'Savings/Investing', value: 'savings' },
  { label: 'Other', value: 'other' },
];

export default function ExpenseSection() {
  const { expenses, addExpense, removeExpense, setExpenses } = useFinancialStore();

  const handleAdd = () => {
    addExpense({
      id: generateId(), category: 'other', description: '', monthlyAmount: 0,
      isFixed: true, isDiscretionary: false, isDeductible: false,
    });
  };

  const update = (id: string, field: keyof Expense, value: any) => {
    setExpenses(expenses.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const totalMonthly = expenses.reduce((sum, e) => sum + e.monthlyAmount, 0);
  const totalAnnual = totalMonthly * 12;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-[#ff9500]/5 border border-[#ff9500]/10">
          <div className="text-xs text-[#ff9500] font-medium">Monthly Expenses</div>
          <div className="text-xl font-bold text-[#1d1d1f] financial-figure">${totalMonthly.toLocaleString()}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-[#e8e8ed] shadow-sm">
          <div className="text-xs text-[#6e6e73] font-medium">Annual Expenses</div>
          <div className="text-xl font-bold text-[#1d1d1f] financial-figure">${totalAnnual.toLocaleString()}</div>
        </div>
      </div>

      {expenses.map((expense) => (
        <div key={expense.id} className="p-4 rounded-2xl bg-white border border-[#e8e8ed] shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs text-[#86868b] font-medium">Expense</span>
            <button onClick={() => removeExpense(expense.id)} className="text-[#ff3b30] hover:text-[#ff3b30]/80"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#1d1d1f]">Category</label>
              <select value={expense.category} onChange={e => update(expense.id, 'category', e.target.value)} className="h-10 bg-white text-[#1d1d1f] border border-[#d2d2d7] focus:border-[#0071e3] rounded-xl px-4 outline-none text-sm">
                {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#1d1d1f]">Description</label>
              <input value={expense.description} onChange={e => update(expense.id, 'description', e.target.value)} placeholder="Details" className="h-10 bg-white text-[#1d1d1f] border border-[#d2d2d7] focus:border-[#0071e3] rounded-xl px-4 outline-none text-sm placeholder:text-[#86868b]" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#1d1d1f]">Monthly Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b] text-sm">$</span>
                <input type="number" value={expense.monthlyAmount || ''} onChange={e => update(expense.id, 'monthlyAmount', Number(e.target.value))} className="h-10 w-full bg-white text-[#1d1d1f] border border-[#d2d2d7] focus:border-[#0071e3] rounded-xl pl-8 pr-4 outline-none text-sm" />
              </div>
            </div>
          </div>
          <div className="flex gap-6 mt-3">
            <label className="flex items-center gap-2 text-sm text-[#1d1d1f]">
              <input type="checkbox" checked={expense.isFixed} onChange={e => update(expense.id, 'isFixed', e.target.checked)} className="rounded border-[#d2d2d7] accent-[#0071e3]" /> Fixed
            </label>
            <label className="flex items-center gap-2 text-sm text-[#1d1d1f]">
              <input type="checkbox" checked={expense.isDiscretionary} onChange={e => update(expense.id, 'isDiscretionary', e.target.checked)} className="rounded border-[#d2d2d7] accent-[#0071e3]" /> Discretionary
            </label>
          </div>
        </div>
      ))}

      <button onClick={handleAdd} className="w-full py-3 rounded-2xl border-2 border-dashed border-[#d2d2d7] text-[#86868b] hover:text-[#0071e3] hover:border-[#0071e3]/40 text-sm flex items-center justify-center gap-2 transition-colors">
        <Plus className="w-4 h-4" /> Add Expense
      </button>
    </div>
  );
}
