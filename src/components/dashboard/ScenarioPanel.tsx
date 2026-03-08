'use client';
import { useState } from 'react';
import { useFinancialStore } from '@/store/financial-store';
import { formatCurrency } from '@/lib/utils';
import { runScenario, ScenarioOverrides, ScenarioResult } from '@/lib/engines/scenario-engine';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Lightbulb, Plus, Trash2, Play } from 'lucide-react';

interface SavedScenario {
  id: string;
  name: string;
  overrides: ScenarioOverrides;
  result?: ScenarioResult;
}

const presets: { name: string; overrides: ScenarioOverrides }[] = [
  { name: 'Raise (+$20k income)', overrides: { incomeChange: 20000 } },
  { name: 'Cut spending (-$500/mo)', overrides: { expenseChange: -500 } },
  { name: 'Max out 401k (+$10k)', overrides: { extraSavings: 10000 } },
  { name: 'Early retirement (age 60)', overrides: { retirementAge: 60 } },
  { name: 'Delayed retirement (age 70)', overrides: { retirementAge: 70 } },
];

export default function ScenarioPanel() {
  const store = useFinancialStore();
  const [scenarios, setScenarios] = useState<SavedScenario[]>([]);
  const [baseline, setBaseline] = useState<ScenarioResult | null>(null);

  const runBaseline = () => {
    const result = runScenario(store, 'Current Plan', {});
    setBaseline(result);
  };

  const addPreset = (preset: typeof presets[0]) => {
    const id = `sc_${Date.now()}`;
    const result = runScenario(store, preset.name, preset.overrides);
    setScenarios([...scenarios, { id, name: preset.name, overrides: preset.overrides, result }]);
    if (!baseline) runBaseline();
  };

  const addCustom = () => {
    const id = `sc_${Date.now()}`;
    setScenarios([...scenarios, { id, name: 'Custom Scenario', overrides: {} }]);
    if (!baseline) runBaseline();
  };

  const removeScenario = (id: string) => {
    setScenarios(scenarios.filter(s => s.id !== id));
  };

  const updateOverride = (id: string, field: keyof ScenarioOverrides, value: number) => {
    setScenarios(scenarios.map(s => s.id === id ? { ...s, overrides: { ...s.overrides, [field]: value } } : s));
  };

  const updateName = (id: string, name: string) => {
    setScenarios(scenarios.map(s => s.id === id ? { ...s, name } : s));
  };

  const runAll = () => {
    runBaseline();
    setScenarios(scenarios.map(s => ({
      ...s,
      result: runScenario(store, s.name, s.overrides),
    })));
  };

  const allResults = [
    ...(baseline ? [baseline] : []),
    ...scenarios.filter(s => s.result).map(s => s.result!),
  ];

  const colors = ['#64748b', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">What-If Scenarios</h1>

      <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-center gap-3">
        <Lightbulb className="w-5 h-5 text-blue-400 shrink-0" />
        <div className="text-sm text-slate-300">
          Compare different financial scenarios side-by-side. Add presets or create custom scenarios to see how changes impact your plan.
        </div>
      </div>

      {/* Preset Buttons */}
      <div>
        <div className="text-xs text-slate-400 mb-2">Quick Scenarios</div>
        <div className="flex flex-wrap gap-2">
          {presets.map((p, i) => (
            <button key={i} onClick={() => addPreset(p)} className="px-3 py-1.5 rounded-lg text-xs border border-slate-700 text-slate-300 hover:border-blue-500/50 hover:text-blue-400 transition-all">
              {p.name}
            </button>
          ))}
          <button onClick={addCustom} className="px-3 py-1.5 rounded-lg text-xs border border-dashed border-slate-700 text-slate-400 hover:border-blue-500/50 hover:text-blue-400 flex items-center gap-1">
            <Plus className="w-3 h-3" /> Custom
          </button>
        </div>
      </div>

      {/* Custom Scenarios Editor */}
      {scenarios.length > 0 && (
        <div className="space-y-3">
          {scenarios.map(sc => (
            <div key={sc.id} className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <div className="flex items-center justify-between mb-3">
                <input value={sc.name} onChange={e => updateName(sc.id, e.target.value)} className="text-sm font-medium text-white bg-transparent outline-none border-b border-transparent focus:border-blue-500 w-48" />
                <button onClick={() => removeScenario(sc.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <div className="grid md:grid-cols-5 gap-3">
                <OverrideInput label="Income Change" value={sc.overrides.incomeChange || 0} onChange={v => updateOverride(sc.id, 'incomeChange', v)} prefix="$" suffix="/yr" />
                <OverrideInput label="Expense Change" value={sc.overrides.expenseChange || 0} onChange={v => updateOverride(sc.id, 'expenseChange', v)} prefix="$" suffix="/mo" />
                <OverrideInput label="Extra Savings" value={sc.overrides.extraSavings || 0} onChange={v => updateOverride(sc.id, 'extraSavings', v)} prefix="$" suffix="/yr" />
                <OverrideInput label="Retirement Age" value={sc.overrides.retirementAge || 0} onChange={v => updateOverride(sc.id, 'retirementAge', v)} placeholder="Default" />
                <div className="flex items-end">
                  <button onClick={runAll} className="h-10 px-4 bg-blue-600 text-white text-xs font-medium rounded-xl hover:bg-blue-700 flex items-center gap-1.5">
                    <Play className="w-3 h-3" /> Run
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Run All Button */}
      {scenarios.length > 0 && (
        <button onClick={runAll} className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-xl hover:from-blue-600 hover:to-blue-700 flex items-center gap-2 mx-auto">
          <Play className="w-4 h-4" /> Run All Scenarios
        </button>
      )}

      {/* Comparison Charts */}
      {allResults.length > 1 && (
        <div className="grid md:grid-cols-2 gap-6">
          <ComparisonChart title="Projected Retirement Fund" data={allResults} dataKey="retirementFund" colors={colors} />
          <ComparisonChart title="Monte Carlo Success Rate" data={allResults} dataKey="monteCarloSuccess" colors={colors} isPercent />
          <ComparisonChart title="Monthly Surplus" data={allResults} dataKey="monthlySurplus" colors={colors} />
          <ComparisonChart title="Total Tax" data={allResults} dataKey="totalTax" colors={colors} />
        </div>
      )}
    </div>
  );
}

function OverrideInput({ label, value, onChange, prefix, suffix, placeholder }: { label: string; value: number; onChange: (v: number) => void; prefix?: string; suffix?: string; placeholder?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-400">{label}</label>
      <div className="relative">
        {prefix && <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">{prefix}</span>}
        <input type="number" value={value || ''} onChange={e => onChange(Number(e.target.value))} placeholder={placeholder || '0'} className={`h-10 w-full bg-slate-800/60 text-white border border-slate-700 rounded-lg outline-none text-sm ${prefix ? 'pl-7' : 'pl-3'} ${suffix ? 'pr-10' : 'pr-3'}`} />
        {suffix && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">{suffix}</span>}
      </div>
    </div>
  );
}

function ComparisonChart({ title, data, dataKey, colors, isPercent }: { title: string; data: ScenarioResult[]; dataKey: keyof ScenarioResult; colors: string[]; isPercent?: boolean }) {
  const chartData = data.map(d => ({
    name: d.name.length > 15 ? d.name.slice(0, 12) + '...' : d.name,
    value: isPercent ? (d[dataKey] as number) * 100 : d[dataKey] as number,
  }));

  return (
    <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
      <h3 className="text-sm font-semibold text-white mb-3">{title}</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => isPercent ? `${v.toFixed(0)}%` : `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }} formatter={(v: any) => isPercent ? `${v.toFixed(1)}%` : formatCurrency(v)} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {chartData.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
