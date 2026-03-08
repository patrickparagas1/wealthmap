'use client';
import { useFinancialStore } from '@/store/financial-store';
import { generateId } from '@/lib/utils';
import { Plus, Trash2, ScrollText, CheckCircle, XCircle } from 'lucide-react';

export default function EstateSection() {
  const { estateInfo, setEstateInfo } = useFinancialStore();

  const toggleDoc = (key: keyof typeof estateInfo) => {
    if (key === 'beneficiaries') return;
    setEstateInfo({ [key]: !estateInfo[key] });
  };

  const addBeneficiary = () => {
    setEstateInfo({
      beneficiaries: [
        ...estateInfo.beneficiaries,
        { id: generateId(), name: '', relationship: '', percentage: 0, isPrimary: true, accountsAssigned: [] },
      ],
    });
  };

  const removeBeneficiary = (id: string) => {
    setEstateInfo({ beneficiaries: estateInfo.beneficiaries.filter(b => b.id !== id) });
  };

  const updateBeneficiary = (id: string, field: string, value: any) => {
    setEstateInfo({
      beneficiaries: estateInfo.beneficiaries.map(b =>
        b.id === id ? { ...b, [field]: value } : b
      ),
    });
  };

  const documents = [
    { key: 'hasWill' as const, label: 'Last Will & Testament', desc: 'Directs how your assets are distributed' },
    { key: 'hasTrust' as const, label: 'Revocable Living Trust', desc: 'Avoids probate, provides privacy' },
    { key: 'hasPOA' as const, label: 'Power of Attorney (Financial)', desc: 'Authorizes someone to manage finances' },
    { key: 'hasHealthcareDirective' as const, label: 'Healthcare Directive / Living Will', desc: 'Specifies medical wishes if incapacitated' },
    { key: 'hasBeneficiaryDesignations' as const, label: 'Beneficiary Designations Updated', desc: 'Retirement accounts, life insurance, TOD/POD' },
  ];

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10 flex items-center gap-3">
        <ScrollText className="w-6 h-6 text-purple-400" />
        <div>
          <div className="text-sm font-medium text-white">Estate Planning Checklist</div>
          <div className="text-xs text-slate-400">Track your essential estate planning documents. These protect you and your family.</div>
        </div>
      </div>

      <div className="space-y-2">
        {documents.map((doc) => (
          <button
            key={doc.key}
            onClick={() => toggleDoc(doc.key)}
            className={`w-full p-4 rounded-xl border text-left flex items-center gap-3 transition-all ${
              estateInfo[doc.key]
                ? 'bg-emerald-500/5 border-emerald-500/20'
                : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600/50'
            }`}
          >
            {estateInfo[doc.key] ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-slate-500 shrink-0" />
            )}
            <div className="flex-1">
              <div className="text-sm font-medium text-white">{doc.label}</div>
              <div className="text-xs text-slate-400">{doc.desc}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="pt-4">
        <div className="text-sm font-medium text-white mb-3">Beneficiaries</div>
        {estateInfo.beneficiaries.map((ben) => (
          <div key={ben.id} className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 mb-3">
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs text-slate-400">Beneficiary</span>
              <button onClick={() => removeBeneficiary(ben.id)} className="text-red-400 hover:text-red-300">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid md:grid-cols-4 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">Name</label>
                <input
                  value={ben.name}
                  onChange={e => updateBeneficiary(ben.id, 'name', e.target.value)}
                  placeholder="Full name"
                  className="h-10 bg-slate-800/60 text-white border border-slate-700 rounded-xl px-4 outline-none text-sm placeholder:text-slate-500"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">Relationship</label>
                <select
                  value={ben.relationship}
                  onChange={e => updateBeneficiary(ben.id, 'relationship', e.target.value)}
                  className="h-10 bg-slate-800/60 text-white border border-slate-700 rounded-xl px-4 outline-none text-sm"
                >
                  <option value="">Select</option>
                  <option value="spouse">Spouse</option>
                  <option value="child">Child</option>
                  <option value="parent">Parent</option>
                  <option value="sibling">Sibling</option>
                  <option value="trust">Trust</option>
                  <option value="charity">Charity</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">Percentage</label>
                <div className="relative">
                  <input
                    type="number"
                    value={ben.percentage || ''}
                    onChange={e => updateBeneficiary(ben.id, 'percentage', Number(e.target.value))}
                    min={0}
                    max={100}
                    className="h-10 w-full bg-slate-800/60 text-white border border-slate-700 rounded-xl px-4 pr-8 outline-none text-sm"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">Type</label>
                <select
                  value={ben.isPrimary ? 'primary' : 'contingent'}
                  onChange={e => updateBeneficiary(ben.id, 'isPrimary', e.target.value === 'primary')}
                  className="h-10 bg-slate-800/60 text-white border border-slate-700 rounded-xl px-4 outline-none text-sm"
                >
                  <option value="primary">Primary</option>
                  <option value="contingent">Contingent</option>
                </select>
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={addBeneficiary}
          className="w-full py-3 rounded-xl border-2 border-dashed border-slate-700 text-slate-400 hover:text-purple-400 hover:border-purple-500/50 text-sm flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Beneficiary
        </button>
      </div>
    </div>
  );
}
