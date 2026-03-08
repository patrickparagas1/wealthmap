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
        <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
          <div className="text-xs text-slate-400">Monthly Expenses</div>
          <div className="text-xl font-bold text-white">${totalMonthly.toLocaleString()}</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
          <div className="text-xs text-slate-400">Annual Expenses</div>
          <div className="text-xl font-bold text-white">${totalAnnual.toLocaleString()}</div>
        </div>
      </div>

      {expenses.map((expense) => (
        <div key={expense.id} className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs text-slate-400">Expense</span>
            <button onClick={() => removeExpense(expense.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Category</label>
              <select value={expense.category} onChange={e => update(expense.id, 'category', e.target.value)} className="h-10 bg-slate-800/60 text-white border border-slate-700 rounded-xl px-4 outline-none text-sm">
                {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Description</label>
              <input value={expense.description} onChange={e => update(expense.id, 'description', e.target.value)} placeholder="Details" className="h-10 bg-slate-800/60 text-white border border-slate-700 rounded-xl px-4 outline-none text-sm placeholder:text-slate-500" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Monthly Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input type="number" value={expense.monthlyAmount || ''} onChange={e => update(expense.id, 'monthlyAmount', Number(e.target.value))} className="h-10 w-full bg-slate-800/60 text-white border border-slate-700 rounded-xl pl-8 pr-4 outline-none text-sm" />
              </div>
            </div>
          </div>
          <div className="flex gap-6 mt-3">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={expense.isFixed} onChange={e => update(expense.id, 'isFixed', e.target.checked)} className="rounded border-slate-600" /> Fixed
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={expense.isDiscretionary} onChange={e => update(expense.id, 'isDiscretionary', e.target.checked)} className="rounded border-slate-600" /> Discretionary
            </label>
          </div>
        </div>
      ))}

      <button onClick={handleAdd} className="w-full py-3 rounded-xl border-2 border-dashed border-slate-700 text-slate-400 hover:text-blue-400 hover:border-blue-500/50 text-sm flex items-center justify-center gap-2">
        <Plus className="w-4 h-4" /> Add Expense
      </button>
    </div>
  );
}
