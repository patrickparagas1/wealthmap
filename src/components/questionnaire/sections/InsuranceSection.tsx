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
      <div className="p-4 rounded-2xl bg-[#ff9500]/5 border border-[#ff9500]/10 flex items-center gap-3">
        <Shield className="w-6 h-6 text-[#ff9500]" />
        <div>
          <div className="text-sm font-medium text-[#1d1d1f]">Insurance Coverage Review</div>
          <div className="text-xs text-[#6e6e73]">List all your current insurance policies for a comprehensive risk analysis.</div>
        </div>
      </div>

      {insurancePolicies.map((policy) => (
        <div key={policy.id} className="p-4 rounded-2xl bg-white border border-[#e8e8ed] shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs text-[#86868b] font-medium">Policy</span>
            <button onClick={() => removeInsurancePolicy(policy.id)} className="text-[#ff3b30] hover:text-[#ff3b30]/80"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#1d1d1f]">Type</label>
              <select value={policy.type} onChange={e => update(policy.id, 'type', e.target.value)} className="h-10 bg-white text-[#1d1d1f] border border-[#d2d2d7] focus:border-[#0071e3] rounded-xl px-4 outline-none text-sm">
                {insuranceTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#1d1d1f]">Provider</label>
              <input value={policy.provider} onChange={e => update(policy.id, 'provider', e.target.value)} placeholder="e.g., State Farm" className="h-10 bg-white text-[#1d1d1f] border border-[#d2d2d7] focus:border-[#0071e3] rounded-xl px-4 outline-none text-sm placeholder:text-[#86868b]" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#1d1d1f]">Coverage Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b] text-sm">$</span>
                <input type="number" value={policy.coverageAmount || ''} onChange={e => update(policy.id, 'coverageAmount', Number(e.target.value))} className="h-10 w-full bg-white text-[#1d1d1f] border border-[#d2d2d7] focus:border-[#0071e3] rounded-xl pl-8 pr-4 outline-none text-sm" />
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-3 mt-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#1d1d1f]">Annual Premium</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b] text-sm">$</span>
                <input type="number" value={policy.annualPremium || ''} onChange={e => update(policy.id, 'annualPremium', Number(e.target.value))} className="h-10 w-full bg-white text-[#1d1d1f] border border-[#d2d2d7] focus:border-[#0071e3] rounded-xl pl-8 pr-4 outline-none text-sm" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#1d1d1f]">Deductible</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b] text-sm">$</span>
                <input type="number" value={policy.deductible || ''} onChange={e => update(policy.id, 'deductible', Number(e.target.value))} className="h-10 w-full bg-white text-[#1d1d1f] border border-[#d2d2d7] focus:border-[#0071e3] rounded-xl pl-8 pr-4 outline-none text-sm" />
              </div>
            </div>
          </div>
          {policy.type === 'life' && (
            <div className="grid md:grid-cols-2 gap-3 mt-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#1d1d1f]">Life Insurance Type</label>
                <select value={policy.lifeInsuranceType || ''} onChange={e => update(policy.id, 'lifeInsuranceType', e.target.value)} className="h-10 bg-white text-[#1d1d1f] border border-[#d2d2d7] focus:border-[#0071e3] rounded-xl px-4 outline-none text-sm">
                  <option value="">Select</option><option value="term">Term</option><option value="whole">Whole Life</option>
                  <option value="universal">Universal</option><option value="variable">Variable</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#1d1d1f]">Term Length (years)</label>
                <input type="number" value={policy.termLength || ''} onChange={e => update(policy.id, 'termLength', Number(e.target.value))} className="h-10 bg-white text-[#1d1d1f] border border-[#d2d2d7] focus:border-[#0071e3] rounded-xl px-4 outline-none text-sm" />
              </div>
            </div>
          )}
          {policy.type === 'disability' && (
            <div className="grid md:grid-cols-2 gap-3 mt-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#1d1d1f]">Monthly Benefit</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b] text-sm">$</span>
                  <input type="number" value={policy.benefitAmount || ''} onChange={e => update(policy.id, 'benefitAmount', Number(e.target.value))} className="h-10 w-full bg-white text-[#1d1d1f] border border-[#d2d2d7] focus:border-[#0071e3] rounded-xl pl-8 pr-4 outline-none text-sm" />
                </div>
              </div>
              <label className="flex items-center gap-2 mt-7 text-sm text-[#1d1d1f]">
                <input type="checkbox" checked={policy.ownOccupation || false} onChange={e => update(policy.id, 'ownOccupation', e.target.checked)} className="rounded border-[#d2d2d7] accent-[#0071e3]" /> Own-Occupation
              </label>
            </div>
          )}
        </div>
      ))}

      <button onClick={handleAdd} className="w-full py-3 rounded-2xl border-2 border-dashed border-[#d2d2d7] text-[#86868b] hover:text-[#0071e3] hover:border-[#0071e3]/40 text-sm flex items-center justify-center gap-2 transition-colors">
        <Plus className="w-4 h-4" /> Add Insurance Policy
      </button>
    </div>
  );
}
