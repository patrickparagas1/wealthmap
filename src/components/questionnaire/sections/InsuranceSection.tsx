'use client';
import { useFinancialStore } from '@/store/financial-store';
import { generateId } from '@/lib/utils';
import { Plus, Trash2, Shield } from 'lucide-react';
import type { InsurancePolicy, InsuranceType } from '@/lib/types';

const insuranceTypes: { label: string; value: InsuranceType }[] = [
  { label: 'Life Insurance', value: 'life' }, { label: 'Health Insurance', value: 'health' },
  { label: 'Disability Insurance', value: 'disability' }, { label: 'Long-Term Care', value: 'long_term_care' },
  { label: 'Auto Insurance', value: 'auto' }, { label: 'Homeowners', value: 'homeowners' },
  { label: 'Renters', value: 'renters' }, { label: 'Umbrella', value: 'umbrella' },
];

export default function InsuranceSection() {
  const { insurancePolicies, addInsurancePolicy, removeInsurancePolicy, setInsurancePolicies } = useFinancialStore();

  const handleAdd = () => {
    addInsurancePolicy({
      id: generateId(), type: 'life', provider: '', policyNumber: '',
      coverageAmount: 0, annualPremium: 0, deductible: 0,
    });
  };

  const update = (id: string, field: keyof InsurancePolicy, value: any) => {
    setInsurancePolicies(insurancePolicies.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-center gap-3">
        <Shield className="w-6 h-6 text-amber-400" />
        <div>
          <div className="text-sm font-medium text-white">Insurance Coverage Review</div>
          <div className="text-xs text-slate-400">List all your current insurance policies for a comprehensive risk analysis.</div>
        </div>
      </div>

      {insurancePolicies.map((policy) => (
        <div key={policy.id} className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs text-slate-400">Policy</span>
            <button onClick={() => removeInsurancePolicy(policy.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Type</label>
              <select value={policy.type} onChange={e => update(policy.id, 'type', e.target.value)} className="h-10 bg-slate-800/60 text-white border border-slate-700 rounded-xl px-4 outline-none text-sm">
                {insuranceTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Provider</label>
              <input value={policy.provider} onChange={e => update(policy.id, 'provider', e.target.value)} placeholder="e.g., State Farm" className="h-10 bg-slate-800/60 text-white border border-slate-700 rounded-xl px-4 outline-none text-sm placeholder:text-slate-500" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Coverage Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input type="number" value={policy.coverageAmount || ''} onChange={e => update(policy.id, 'coverageAmount', Number(e.target.value))} className="h-10 w-full bg-slate-800/60 text-white border border-slate-700 rounded-xl pl-8 pr-4 outline-none text-sm" />
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-3 mt-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Annual Premium</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input type="number" value={policy.annualPremium || ''} onChange={e => update(policy.id, 'annualPremium', Number(e.target.value))} className="h-10 w-full bg-slate-800/60 text-white border border-slate-700 rounded-xl pl-8 pr-4 outline-none text-sm" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Deductible</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input type="number" value={policy.deductible || ''} onChange={e => update(policy.id, 'deductible', Number(e.target.value))} className="h-10 w-full bg-slate-800/60 text-white border border-slate-700 rounded-xl pl-8 pr-4 outline-none text-sm" />
              </div>
            </div>
          </div>
          {policy.type === 'life' && (
            <div className="grid md:grid-cols-2 gap-3 mt-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">Life Insurance Type</label>
                <select value={policy.lifeInsuranceType || ''} onChange={e => update(policy.id, 'lifeInsuranceType', e.target.value)} className="h-10 bg-slate-800/60 text-white border border-slate-700 rounded-xl px-4 outline-none text-sm">
                  <option value="">Select</option><option value="term">Term</option><option value="whole">Whole Life</option>
                  <option value="universal">Universal</option><option value="variable">Variable</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">Term Length (years)</label>
                <input type="number" value={policy.termLength || ''} onChange={e => update(policy.id, 'termLength', Number(e.target.value))} className="h-10 bg-slate-800/60 text-white border border-slate-700 rounded-xl px-4 outline-none text-sm" />
              </div>
            </div>
          )}
          {policy.type === 'disability' && (
            <div className="grid md:grid-cols-2 gap-3 mt-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">Monthly Benefit</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <input type="number" value={policy.benefitAmount || ''} onChange={e => update(policy.id, 'benefitAmount', Number(e.target.value))} className="h-10 w-full bg-slate-800/60 text-white border border-slate-700 rounded-xl pl-8 pr-4 outline-none text-sm" />
                </div>
              </div>
              <label className="flex items-center gap-2 mt-7 text-sm text-slate-300">
                <input type="checkbox" checked={policy.ownOccupation || false} onChange={e => update(policy.id, 'ownOccupation', e.target.checked)} className="rounded border-slate-600" /> Own-Occupation
              </label>
            </div>
          )}
        </div>
      ))}

      <button onClick={handleAdd} className="w-full py-3 rounded-xl border-2 border-dashed border-slate-700 text-slate-400 hover:text-blue-400 hover:border-blue-500/50 text-sm flex items-center justify-center gap-2">
        <Plus className="w-4 h-4" /> Add Insurance Policy
      </button>
    </div>
  );
}
