'use client';
import { useFinancialStore } from '@/store/financial-store';
import { formatCurrency } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';

export default function InsurancePanel() {
  const { insurancePolicies, insuranceAnalysis } = useFinancialStore();

  const coverageData = insurancePolicies
    .filter(p => p.coverageAmount > 0)
    .map(p => ({ name: p.type.replace(/_/g, ' '), coverage: p.coverageAmount, premium: p.annualPremium }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Insurance & Risk Management</h1>

      {insuranceAnalysis ? (
        <>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
              <div className="text-xs text-slate-400 mb-1">Life Coverage Need</div>
              <div className="text-xl font-bold text-white">{formatCurrency(insuranceAnalysis.lifeInsuranceNeed)}</div>
              <div className="text-xs text-slate-500">Current: {formatCurrency(insuranceAnalysis.currentLifeCoverage)}</div>
            </div>
            <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
              <div className="text-xs text-slate-400 mb-1">Life Insurance Gap</div>
              <div className={`text-xl font-bold ${insuranceAnalysis.lifeInsuranceGap > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {insuranceAnalysis.lifeInsuranceGap > 0 ? formatCurrency(insuranceAnalysis.lifeInsuranceGap) : 'Covered'}
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
              <div className="text-xs text-slate-400 mb-1">Disability Need</div>
              <div className="text-xl font-bold text-white">{formatCurrency(insuranceAnalysis.disabilityNeed)}/mo</div>
              <div className={`text-xs ${insuranceAnalysis.disabilityGap > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                Gap: {insuranceAnalysis.disabilityGap > 0 ? `${formatCurrency(insuranceAnalysis.disabilityGap)}/mo` : 'None'}
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
              <div className="text-xs text-slate-400 mb-1">Active Policies</div>
              <div className="text-xl font-bold text-blue-400">{insurancePolicies.length}</div>
              <div className="text-xs text-slate-500">Annual premiums: {formatCurrency(insurancePolicies.reduce((s, p) => s + p.annualPremium, 0))}</div>
            </div>
          </div>

          {insuranceAnalysis.recommendations.length > 0 && (
            <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
              <h2 className="text-sm font-semibold text-white mb-4">Recommendations</h2>
              <div className="space-y-3">
                {insuranceAnalysis.recommendations.map(rec => (
                  <div key={rec.id} className={`p-3 rounded-lg border flex items-start gap-3 ${
                    rec.priority === 'critical' ? 'border-red-500/20 bg-red-500/5' :
                    rec.priority === 'high' ? 'border-amber-500/20 bg-amber-500/5' :
                    'border-slate-700/50 bg-slate-800/30'
                  }`}>
                    {rec.priority === 'critical' ? <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" /> : <Shield className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />}
                    <div>
                      <div className="text-sm font-medium text-white">{rec.title}</div>
                      <p className="text-xs text-slate-400 mt-0.5">{rec.description}</p>
                      {rec.estimatedCost && <p className="text-xs text-blue-400 mt-1">Est. cost: {rec.estimatedCost}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="p-8 rounded-2xl bg-slate-800/40 border border-slate-700/50 text-center">
          <Shield className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Insurance analysis will appear after completing your financial plan.</p>
        </div>
      )}

      {coverageData.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
          <h2 className="text-sm font-semibold text-white mb-4">Coverage Summary</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={coverageData}>
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }} formatter={(v: any) => formatCurrency(v)} />
                <Bar dataKey="coverage" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Coverage" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {insurancePolicies.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
          <h2 className="text-sm font-semibold text-white mb-4">Policy Details</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-slate-400 border-b border-slate-700">
                <th className="pb-2 pr-4">Type</th><th className="pb-2 pr-4">Provider</th><th className="pb-2 pr-4">Coverage</th><th className="pb-2 pr-4">Premium</th><th className="pb-2">Deductible</th>
              </tr></thead>
              <tbody>{insurancePolicies.map(p => (
                <tr key={p.id} className="border-b border-slate-800/50">
                  <td className="py-2 pr-4 text-white capitalize">{p.type.replace(/_/g, ' ')}</td>
                  <td className="py-2 pr-4 text-slate-400">{p.provider || '-'}</td>
                  <td className="py-2 pr-4 text-blue-400">{formatCurrency(p.coverageAmount)}</td>
                  <td className="py-2 pr-4 text-slate-300">{formatCurrency(p.annualPremium)}/yr</td>
                  <td className="py-2 text-slate-300">{formatCurrency(p.deductible)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
