'use client';
import { useFinancialStore } from '@/store/financial-store';
import { Receipt } from 'lucide-react';

const TAX_STRATEGIES = [
  { id: 'roth', label: 'Contributing to Roth IRA/401k' },
  { id: 'hsa', label: 'Contributing to HSA' },
  { id: 'fsa', label: 'Using Flexible Spending Account' },
  { id: '529', label: 'Contributing to 529 Plan' },
  { id: 'harvest', label: 'Tax-Loss Harvesting' },
  { id: 'charitable_bunching', label: 'Charitable Giving / Donor-Advised Fund' },
] as const;

export default function TaxSection() {
  const { personalInfo, updatePersonalInfo, taxDeductions, setTaxDeductions, taxStrategiesUsed, setTaxStrategiesUsed } = useFinancialStore();

  const handleDeductionChange = (field: keyof typeof taxDeductions, value: number) => {
    setTaxDeductions({ [field]: value });
  };

  const handleStrategyToggle = (id: string, checked: boolean) => {
    setTaxStrategiesUsed({ ...taxStrategiesUsed, [id]: checked });
  };

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-[#34c759]/5 border border-[#34c759]/10 flex items-center gap-3">
        <Receipt className="w-6 h-6 text-[#34c759]" />
        <div>
          <div className="text-sm font-medium text-[#1d1d1f]">Tax Planning Information</div>
          <div className="text-xs text-[#6e6e73]">Additional details for tax optimization. Income and expenses are captured in earlier sections.</div>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-white border border-[#e8e8ed] shadow-sm space-y-4">
        <div className="text-sm font-semibold text-[#1d1d1f]">Filing Information</div>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#1d1d1f]">Filing Status</label>
            <select
              value={personalInfo.filingStatus}
              onChange={e => updatePersonalInfo({ filingStatus: e.target.value as any })}
              className="h-10 bg-white text-[#1d1d1f] border border-[#d2d2d7] focus:border-[#0071e3] rounded-xl px-4 outline-none text-sm"
            >
              <option value="single">Single</option>
              <option value="married_filing_jointly">Married Filing Jointly</option>
              <option value="married_filing_separately">Married Filing Separately</option>
              <option value="head_of_household">Head of Household</option>
              <option value="qualifying_widow">Qualifying Widow(er)</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#1d1d1f]">State of Residence</label>
            <input
              value={personalInfo.state}
              onChange={e => updatePersonalInfo({ state: e.target.value })}
              placeholder="e.g., California"
              className="h-10 bg-white text-[#1d1d1f] border border-[#d2d2d7] focus:border-[#0071e3] rounded-xl px-4 outline-none text-sm placeholder:text-[#86868b]"
            />
          </div>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-white border border-[#e8e8ed] shadow-sm space-y-4">
        <div className="text-sm font-semibold text-[#1d1d1f]">Itemized Deductions</div>
        <div className="text-xs text-[#86868b] -mt-2">If these exceed the standard deduction, you may benefit from itemizing.</div>
        <TaxInput label="Mortgage Interest" value={taxDeductions.mortgageInterest} onChange={v => handleDeductionChange('mortgageInterest', v)} />
        <TaxInput label="State & Local Taxes (SALT)" value={taxDeductions.stateLocalTaxes} onChange={v => handleDeductionChange('stateLocalTaxes', v)} help="Capped at $10,000 federally" />
        <TaxInput label="Charitable Contributions" value={taxDeductions.charitableDonations} onChange={v => handleDeductionChange('charitableDonations', v)} />
        <TaxInput label="Medical Expenses (above 7.5% AGI)" value={taxDeductions.medicalExpenses} onChange={v => handleDeductionChange('medicalExpenses', v)} />
      </div>

      <div className="p-4 rounded-2xl bg-white border border-[#e8e8ed] shadow-sm space-y-4">
        <div className="text-sm font-semibold text-[#1d1d1f]">Tax Strategies Currently Used</div>
        <div className="space-y-2">
          {TAX_STRATEGIES.map(item => (
            <label key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] cursor-pointer hover:border-[#d2d2d7] transition-all">
              <input
                type="checkbox"
                className="rounded border-[#d2d2d7] accent-[#0071e3]"
                checked={taxStrategiesUsed[item.id] || false}
                onChange={e => handleStrategyToggle(item.id, e.target.checked)}
              />
              <span className="text-sm text-[#1d1d1f]">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-[#0071e3]/5 border border-[#0071e3]/10">
        <div className="text-sm font-medium text-[#1d1d1f] mb-1">Auto-Calculated</div>
        <div className="text-xs text-[#6e6e73]">
          Your tax situation will be fully analyzed in your financial plan, including federal &amp; state tax estimates,
          effective and marginal rates, and personalized tax optimization strategies based on CFP guidelines.
        </div>
      </div>
    </div>
  );
}

function TaxInput({ label, value, onChange, help }: { label: string; value: number; onChange: (v: number) => void; help?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-[#1d1d1f]">{label}</label>
      {help && <span className="text-xs text-[#86868b]">{help}</span>}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b] text-sm">$</span>
        <input
          type="number"
          value={value || ''}
          onChange={e => onChange(Number(e.target.value))}
          placeholder="0"
          className="h-10 w-full bg-white text-[#1d1d1f] border border-[#d2d2d7] focus:border-[#0071e3] rounded-xl pl-8 pr-4 outline-none text-sm placeholder:text-[#86868b]"
        />
      </div>
    </div>
  );
}
