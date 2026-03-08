'use client';
import { useFinancialStore } from '@/store/financial-store';
import { generateId } from '@/lib/utils';
import { Plus, Trash2, Landmark } from 'lucide-react';
import type { Asset, AssetCategory, AccountType } from '@/lib/types';

const assetCategories: { label: string; value: AssetCategory }[] = [
  { label: 'Cash/Savings', value: 'cash' }, { label: 'Investment Account', value: 'investment' },
  { label: 'Retirement Account', value: 'retirement' }, { label: 'Real Estate', value: 'real_estate' },
  { label: 'Personal Property', value: 'personal_property' }, { label: 'Business', value: 'business' },
  { label: 'Other', value: 'other' },
];

const accountTypes: { label: string; value: AccountType }[] = [
  { label: 'Checking', value: 'checking' }, { label: 'Savings', value: 'savings' },
  { label: 'Money Market', value: 'money_market' }, { label: 'CD', value: 'cd' },
  { label: 'Brokerage', value: 'brokerage' }, { label: 'Traditional IRA', value: 'traditional_ira' },
  { label: 'Roth IRA', value: 'roth_ira' }, { label: '401(k)', value: '401k' },
  { label: 'Roth 401(k)', value: 'roth_401k' }, { label: '403(b)', value: '403b' },
  { label: 'HSA', value: 'hsa' }, { label: '529 Plan', value: '529' },
  { label: 'SEP IRA', value: 'sep_ira' }, { label: 'Annuity', value: 'annuity' },
];

export default function AssetsSection() {
  const { assets, addAsset, removeAsset, setAssets } = useFinancialStore();

  const handleAdd = () => {
    addAsset({
      id: generateId(), name: '', category: 'cash', currentValue: 0, owner: 'client',
    });
  };

  const update = (id: string, field: keyof Asset, value: any) => {
    setAssets(assets.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const totalAssets = assets.reduce((sum, a) => sum + a.currentValue, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
        <div>
          <div className="text-xs text-emerald-400">Total Assets</div>
          <div className="text-2xl font-bold text-white">${totalAssets.toLocaleString()}</div>
        </div>
        <Landmark className="w-8 h-8 text-emerald-400/30" />
      </div>

      {assets.map((asset) => (
        <div key={asset.id} className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs text-slate-400">Asset</span>
            <button onClick={() => removeAsset(asset.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Name</label>
              <input value={asset.name} onChange={e => update(asset.id, 'name', e.target.value)} placeholder="e.g., Chase Savings" className="h-10 bg-slate-800/60 text-white border border-slate-700 rounded-xl px-4 outline-none text-sm placeholder:text-slate-500" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Category</label>
              <select value={asset.category} onChange={e => update(asset.id, 'category', e.target.value)} className="h-10 bg-slate-800/60 text-white border border-slate-700 rounded-xl px-4 outline-none text-sm">
                {assetCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Current Value</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input type="number" value={asset.currentValue || ''} onChange={e => update(asset.id, 'currentValue', Number(e.target.value))} className="h-10 w-full bg-slate-800/60 text-white border border-slate-700 rounded-xl pl-8 pr-4 outline-none text-sm" />
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-3 mt-3">
            {(asset.category === 'retirement' || asset.category === 'investment' || asset.category === 'cash') && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">Account Type</label>
                <select value={asset.accountType || ''} onChange={e => update(asset.id, 'accountType', e.target.value)} className="h-10 bg-slate-800/60 text-white border border-slate-700 rounded-xl px-4 outline-none text-sm">
                  <option value="">Select type</option>
                  {accountTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Owner</label>
              <select value={asset.owner} onChange={e => update(asset.id, 'owner', e.target.value)} className="h-10 bg-slate-800/60 text-white border border-slate-700 rounded-xl px-4 outline-none text-sm">
                <option value="client">Client</option><option value="spouse">Spouse</option><option value="joint">Joint</option>
              </select>
            </div>
          </div>
          {asset.category === 'retirement' && (
            <div className="grid md:grid-cols-2 gap-3 mt-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">Annual Contribution</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <input type="number" value={asset.annualContribution || ''} onChange={e => update(asset.id, 'annualContribution', Number(e.target.value))} placeholder="e.g., 23500" className="h-10 w-full bg-slate-800/60 text-white border border-slate-700 rounded-xl pl-8 pr-4 outline-none text-sm placeholder:text-slate-500" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">Employer Match (Annual)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <input type="number" value={asset.employerMatchAmount || ''} onChange={e => update(asset.id, 'employerMatchAmount', Number(e.target.value))} placeholder="e.g., 5000" className="h-10 w-full bg-slate-800/60 text-white border border-slate-700 rounded-xl pl-8 pr-4 outline-none text-sm placeholder:text-slate-500" />
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      <button onClick={handleAdd} className="w-full py-3 rounded-xl border-2 border-dashed border-slate-700 text-slate-400 hover:text-blue-400 hover:border-blue-500/50 text-sm flex items-center justify-center gap-2">
        <Plus className="w-4 h-4" /> Add Asset
      </button>
    </div>
  );
}
