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
      <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/10 flex items-center gap-3">
        <Receipt className="w-6 h-6 text-green-400" />
        <div>
          <div className="text-sm font-medium text-white">Tax Planning Information</div>
          <div className="text-xs text-slate-400">Additional details for tax optimization. Income and expenses are captured in earlier sections.</div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 space-y-4">
        <div className="text-sm font-medium text-white">Filing Information</div>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Filing Status</label>
            <select
              value={personalInfo.filingStatus}
              onChange={e => updatePersonalInfo({ filingStatus: e.target.value as any })}
              className="h-10 bg-slate-800/60 text-white border border-slate-700 rounded-xl px-4 outline-none text-sm"
            >
              <option value="single">Single</option>
              <option value="married_filing_jointly">Married Filing Jointly</option>
              <option value="married_filing_separately">Married Filing Separately</option>
              <option value="head_of_household">Head of Household</option>
              <option value="qualifying_widow">Qualifying Widow(er)</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">State of Residence</label>
            <input
              value={personalInfo.state}
              onChange={e => updatePersonalInfo({ state: e.target.value })}
              placeholder="e.g., California"
              className="h-10 bg-slate-800/60 text-white border border-slate-700 rounded-xl px-4 outline-none text-sm placeholder:text-slate-500"
            />
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 space-y-4">
        <div className="text-sm font-medium text-white">Itemized Deductions</div>
        <div className="text-xs text-slate-400 -mt-2">If these exceed the standard deduction, you may benefit from itemizing.</div>
        <TaxInput label="Mortgage Interest" value={taxDeductions.mortgageInterest} onChange={v => handleDeductionChange('mortgageInterest', v)} />
        <TaxInput label="State & Local Taxes (SALT)" value={taxDeductions.stateLocalTaxes} onChange={v => handleDeductionChange('stateLocalTaxes', v)} help="Capped at $10,000 federally" />
        <TaxInput label="Charitable Contributions" value={taxDeductions.charitableDonations} onChange={v => handleDeductionChange('charitableDonations', v)} />
        <TaxInput label="Medical Expenses (above 7.5% AGI)" value={taxDeductions.medicalExpenses} onChange={v => handleDeductionChange('medicalExpenses', v)} />
      </div>

      <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 space-y-4">
        <div className="text-sm font-medium text-white">Tax Strategies Currently Used</div>
        <div className="space-y-2">
          {TAX_STRATEGIES.map(item => (
            <label key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/40 border border-slate-700/30 cursor-pointer hover:border-slate-600/50 transition-all">
              <input
                type="checkbox"
                className="rounded border-slate-600 text-blue-500"
                checked={taxStrategiesUsed[item.id] || false}
                onChange={e => handleStrategyToggle(item.id, e.target.checked)}
              />
              <span className="text-sm text-slate-300">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
        <div className="text-sm font-medium text-white mb-1">Auto-Calculated</div>
        <div className="text-xs text-slate-400">
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
      <label className="text-sm font-medium text-slate-300">{label}</label>
      {help && <span className="text-xs text-slate-500">{help}</span>}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
        <input
          type="number"
          value={value || ''}
          onChange={e => onChange(Number(e.target.value))}
          placeholder="0"
          className="h-10 w-full bg-slate-800/60 text-white border border-slate-700 rounded-xl pl-8 pr-4 outline-none text-sm placeholder:text-slate-500"
        />
      </div>
    </div>
  );
}
