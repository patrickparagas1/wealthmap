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
      <div className="p-4 rounded-2xl bg-[#af52de]/5 border border-[#af52de]/10 flex items-center gap-3">
        <ScrollText className="w-6 h-6 text-[#af52de]" />
        <div>
          <div className="text-sm font-medium text-[#1d1d1f]">Estate Planning Checklist</div>
          <div className="text-xs text-[#6e6e73]">Track your essential estate planning documents. These protect you and your family.</div>
        </div>
      </div>

      <div className="space-y-2">
        {documents.map((doc) => (
          <button
            key={doc.key}
            onClick={() => toggleDoc(doc.key)}
            className={`w-full p-4 rounded-2xl border text-left flex items-center gap-3 transition-all ${
              estateInfo[doc.key]
                ? 'bg-[#34c759]/5 border-[#34c759]/15 shadow-sm'
                : 'bg-white border-[#e8e8ed] hover:border-[#d2d2d7] shadow-sm'
            }`}
          >
            {estateInfo[doc.key] ? (
              <CheckCircle className="w-5 h-5 text-[#34c759] shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-[#d2d2d7] shrink-0" />
            )}
            <div className="flex-1">
              <div className="text-sm font-medium text-[#1d1d1f]">{doc.label}</div>
              <div className="text-xs text-[#6e6e73]">{doc.desc}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="pt-4">
        <div className="text-sm font-semibold text-[#1d1d1f] mb-3">Beneficiaries</div>
        {estateInfo.beneficiaries.map((ben) => (
          <div key={ben.id} className="p-4 rounded-2xl bg-white border border-[#e8e8ed] shadow-sm mb-3">
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs text-[#86868b] font-medium">Beneficiary</span>
              <button onClick={() => removeBeneficiary(ben.id)} className="text-[#ff3b30] hover:text-[#ff3b30]/80">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid md:grid-cols-4 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#1d1d1f]">Name</label>
                <input
                  value={ben.name}
                  onChange={e => updateBeneficiary(ben.id, 'name', e.target.value)}
                  placeholder="Full name"
                  className="h-10 bg-white text-[#1d1d1f] border border-[#d2d2d7] focus:border-[#0071e3] rounded-xl px-4 outline-none text-sm placeholder:text-[#86868b]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#1d1d1f]">Relationship</label>
                <select
                  value={ben.relationship}
                  onChange={e => updateBeneficiary(ben.id, 'relationship', e.target.value)}
                  className="h-10 bg-white text-[#1d1d1f] border border-[#d2d2d7] focus:border-[#0071e3] rounded-xl px-4 outline-none text-sm"
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
                <label className="text-sm font-medium text-[#1d1d1f]">Percentage</label>
                <div className="relative">
                  <input
                    type="number"
                    value={ben.percentage || ''}
                    onChange={e => updateBeneficiary(ben.id, 'percentage', Number(e.target.value))}
                    min={0}
                    max={100}
                    className="h-10 w-full bg-white text-[#1d1d1f] border border-[#d2d2d7] focus:border-[#0071e3] rounded-xl px-4 pr-8 outline-none text-sm"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868b] text-sm">%</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#1d1d1f]">Type</label>
                <select
                  value={ben.isPrimary ? 'primary' : 'contingent'}
                  onChange={e => updateBeneficiary(ben.id, 'isPrimary', e.target.value === 'primary')}
                  className="h-10 bg-white text-[#1d1d1f] border border-[#d2d2d7] focus:border-[#0071e3] rounded-xl px-4 outline-none text-sm"
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
          className="w-full py-3 rounded-2xl border-2 border-dashed border-[#d2d2d7] text-[#86868b] hover:text-[#af52de] hover:border-[#af52de]/40 text-sm flex items-center justify-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Beneficiary
        </button>
      </div>
    </div>
  );
}
