'use client';

import { useFinancialStore } from '@/store/financial-store';
import { generateId } from '@/lib/utils';
import { US_STATES } from '@/lib/constants';
import { Plus, Trash2 } from 'lucide-react';

const spouseDefault = { firstName: '', lastName: '', dateOfBirth: '', employmentStatus: 'employed' as const, employer: '', occupation: '', annualIncome: 0 };

export default function PersonalInfoSection() {
  const { personalInfo, updatePersonalInfo, educationSavings, setEducationSavings } = useFinancialStore();

  const addDependent = () => {
    updatePersonalInfo({
      dependents: [...(personalInfo.dependents || []), {
        id: generateId(), name: '', dateOfBirth: '', relationship: 'child', isStudent: false, hasDisability: false,
      }],
    });
  };

  const removeDependent = (id: string) => {
    updatePersonalInfo({ dependents: (personalInfo.dependents || []).filter(d => d.id !== id) });
  };

  const updateDependent = (id: string, field: string, value: string | boolean) => {
    updatePersonalInfo({
      dependents: (personalInfo.dependents || []).map(d => d.id === id ? { ...d, [field]: value } : d),
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <FormField label="First Name" value={personalInfo.firstName} onChange={v => updatePersonalInfo({ firstName: v })} placeholder="John" />
        <FormField label="Last Name" value={personalInfo.lastName} onChange={v => updatePersonalInfo({ lastName: v })} placeholder="Smith" />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <FormField label="Date of Birth" type="date" value={personalInfo.dateOfBirth} onChange={v => updatePersonalInfo({ dateOfBirth: v })} />
        <FormField label="Email" type="email" value={personalInfo.email} onChange={v => updatePersonalInfo({ email: v })} placeholder="john@example.com" />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <FormField label="Phone" value={personalInfo.phone} onChange={v => updatePersonalInfo({ phone: v })} placeholder="(555) 123-4567" />
        <SelectField label="State" value={personalInfo.state} onChange={v => updatePersonalInfo({ state: v })} options={[{ label: 'Select State', value: '' }, ...US_STATES]} />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <SelectField label="Filing Status" value={personalInfo.filingStatus} onChange={v => updatePersonalInfo({ filingStatus: v as any, hasSpouse: v.includes('married') })} options={[
          { label: 'Single', value: 'single' }, { label: 'Married Filing Jointly', value: 'married_filing_jointly' },
          { label: 'Married Filing Separately', value: 'married_filing_separately' }, { label: 'Head of Household', value: 'head_of_household' },
        ]} />
        <SelectField label="Employment Status" value={personalInfo.employmentStatus} onChange={v => updatePersonalInfo({ employmentStatus: v as any })} options={[
          { label: 'Employed', value: 'employed' }, { label: 'Self-Employed', value: 'self_employed' },
          { label: 'Unemployed', value: 'unemployed' }, { label: 'Retired', value: 'retired' },
        ]} />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <FormField label="Employer" value={personalInfo.employer} onChange={v => updatePersonalInfo({ employer: v })} placeholder="Company Name" />
        <FormField label="Occupation" value={personalInfo.occupation} onChange={v => updatePersonalInfo({ occupation: v })} placeholder="Software Engineer" />
      </div>

      {personalInfo.hasSpouse && (
        <div className="p-5 rounded-2xl bg-white border border-[#e8e8ed] shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-[#1d1d1f]">Spouse Information</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <FormField label="First Name" value={personalInfo.spouse?.firstName || ''} onChange={v => updatePersonalInfo({ spouse: { ...(personalInfo.spouse || spouseDefault), firstName: v } })} />
            <FormField label="Last Name" value={personalInfo.spouse?.lastName || ''} onChange={v => updatePersonalInfo({ spouse: { ...(personalInfo.spouse || spouseDefault), lastName: v } })} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <FormField label="Date of Birth" type="date" value={personalInfo.spouse?.dateOfBirth || ''} onChange={v => updatePersonalInfo({ spouse: { ...(personalInfo.spouse || spouseDefault), dateOfBirth: v } })} />
            <SelectField label="Employment Status" value={personalInfo.spouse?.employmentStatus || 'employed'} onChange={v => updatePersonalInfo({ spouse: { ...(personalInfo.spouse || spouseDefault), employmentStatus: v as any } })} options={[
              { label: 'Employed', value: 'employed' }, { label: 'Self-Employed', value: 'self_employed' },
              { label: 'Unemployed', value: 'unemployed' }, { label: 'Retired', value: 'retired' },
            ]} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <FormField label="Occupation" value={personalInfo.spouse?.occupation || ''} onChange={v => updatePersonalInfo({ spouse: { ...(personalInfo.spouse || spouseDefault), occupation: v } })} placeholder="e.g., Teacher" />
            <CurrencyField label="Annual Income" value={personalInfo.spouse?.annualIncome || 0} onChange={v => updatePersonalInfo({ spouse: { ...(personalInfo.spouse || spouseDefault), annualIncome: v } })} />
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#1d1d1f]">Dependents</h3>
          <button onClick={addDependent} className="flex items-center gap-1.5 text-xs text-[#0071e3] font-medium hover:underline"><Plus className="w-3.5 h-3.5" /> Add Dependent</button>
        </div>
        {(personalInfo.dependents || []).map(dep => (
          <div key={dep.id} className="p-4 rounded-2xl bg-white border border-[#e8e8ed] shadow-sm mb-3">
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs text-[#86868b] font-medium">Dependent</span>
              <button onClick={() => removeDependent(dep.id)} className="text-[#ff3b30] hover:text-[#ff3b30]/80"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              <FormField label="Name" value={dep.name} onChange={v => updateDependent(dep.id, 'name', v)} />
              <FormField label="DOB" type="date" value={dep.dateOfBirth} onChange={v => updateDependent(dep.id, 'dateOfBirth', v)} />
              <SelectField label="Relationship" value={dep.relationship} onChange={v => updateDependent(dep.id, 'relationship', v)} options={[
                { label: 'Child', value: 'child' }, { label: 'Parent', value: 'parent' }, { label: 'Other', value: 'other' },
              ]} />
            </div>
            {dep.relationship === 'child' && (
              <div className="mt-3 p-3 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] space-y-3">
                <div className="text-xs font-medium text-[#6e6e73]">Education Savings</div>
                <div className="grid md:grid-cols-2 gap-3">
                  <SelectField label="School Type" value={educationSavings[dep.id]?.schoolType || 'public_in_state'} onChange={v => setEducationSavings({ ...educationSavings, [dep.id]: { ...(educationSavings[dep.id] || { currentSavings: 0, monthlyContribution: 0, accountType: '529' }), schoolType: v } })} options={[
                    { label: 'Public (In-State)', value: 'public_in_state' }, { label: 'Public (Out-of-State)', value: 'public_out_state' },
                    { label: 'Private', value: 'private' }, { label: 'Community College', value: 'community_college' }, { label: 'Trade School', value: 'trade_school' },
                  ]} />
                  <SelectField label="Account Type" value={educationSavings[dep.id]?.accountType || '529'} onChange={v => setEducationSavings({ ...educationSavings, [dep.id]: { ...(educationSavings[dep.id] || { schoolType: 'public_in_state', currentSavings: 0, monthlyContribution: 0 }), accountType: v } })} options={[
                    { label: '529 Plan', value: '529' }, { label: 'Coverdell ESA', value: 'coverdell' },
                    { label: 'Custodial (UGMA/UTMA)', value: 'custodial' }, { label: 'Savings Account', value: 'savings' }, { label: 'None', value: 'none' },
                  ]} />
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <CurrencyField label="Current Savings" value={educationSavings[dep.id]?.currentSavings || 0} onChange={v => setEducationSavings({ ...educationSavings, [dep.id]: { ...(educationSavings[dep.id] || { schoolType: 'public_in_state', monthlyContribution: 0, accountType: '529' }), currentSavings: v } })} />
                  <CurrencyField label="Monthly Contribution" value={educationSavings[dep.id]?.monthlyContribution || 0} onChange={v => setEducationSavings({ ...educationSavings, [dep.id]: { ...(educationSavings[dep.id] || { schoolType: 'public_in_state', currentSavings: 0, accountType: '529' }), monthlyContribution: v } })} />
                </div>
              </div>
            )}
          </div>
        ))}
        {(personalInfo.dependents || []).length === 0 && <p className="text-sm text-[#86868b]">No dependents added yet.</p>}
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-[#1d1d1f]">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="h-10 bg-white text-[#1d1d1f] border border-[#d2d2d7] focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/15 rounded-xl px-4 outline-none text-sm placeholder:text-[#86868b]" />
    </div>
  );
}

function CurrencyField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-[#1d1d1f]">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b] text-sm">$</span>
        <input type="number" value={value || ''} onChange={e => onChange(Number(e.target.value))} className="h-10 w-full bg-white text-[#1d1d1f] border border-[#d2d2d7] focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/15 rounded-xl pl-8 pr-4 outline-none text-sm" />
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { label: string; value: string }[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-[#1d1d1f]">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="h-10 bg-white text-[#1d1d1f] border border-[#d2d2d7] focus:border-[#0071e3] rounded-xl px-4 outline-none text-sm appearance-none cursor-pointer">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
