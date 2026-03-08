'use client';
import { useFinancialStore } from '@/store/financial-store';
import { formatCurrency } from '@/lib/utils';
import { CheckCircle, XCircle, ScrollText, AlertTriangle } from 'lucide-react';

export default function EstatePanel() {
  const { estateInfo, estatePlan, assets } = useFinancialStore();

  const documents = [
    { key: 'hasWill' as const, label: 'Last Will & Testament' },
    { key: 'hasTrust' as const, label: 'Revocable Living Trust' },
    { key: 'hasPOA' as const, label: 'Power of Attorney' },
    { key: 'hasHealthcareDirective' as const, label: 'Healthcare Directive' },
    { key: 'hasBeneficiaryDesignations' as const, label: 'Beneficiary Designations' },
  ];

  const completedDocs = documents.filter(d => estateInfo[d.key]).length;
  const totalAssets = assets.reduce((s, a) => s + a.currentValue, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Estate Planning</h1>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
          <div className="text-xs text-slate-400 mb-1">Documents Complete</div>
          <div className="text-xl font-bold text-white">{completedDocs}/{documents.length}</div>
          <div className="w-full h-2 bg-slate-700 rounded-full mt-2">
            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(completedDocs / documents.length) * 100}%` }} />
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
          <div className="text-xs text-slate-400 mb-1">Gross Estate Value</div>
          <div className="text-xl font-bold text-white">{formatCurrency(estatePlan?.grossEstateValue ?? totalAssets)}</div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
          <div className="text-xs text-slate-400 mb-1">Est. Estate Tax</div>
          <div className="text-xl font-bold text-white">{formatCurrency(estatePlan?.estimateEstateTax ?? 0)}</div>
          <div className="text-xs text-slate-500">2025 exemption: $13.99M</div>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
        <h2 className="text-sm font-semibold text-white mb-4">Document Checklist</h2>
        <div className="space-y-2">
          {documents.map(doc => (
            <div key={doc.key} className={`flex items-center gap-3 p-3 rounded-lg ${estateInfo[doc.key] ? 'bg-emerald-500/5 border border-emerald-500/20' : 'bg-slate-800/40 border border-slate-700/30'}`}>
              {estateInfo[doc.key] ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-slate-500" />}
              <span className={`text-sm ${estateInfo[doc.key] ? 'text-white' : 'text-slate-400'}`}>{doc.label}</span>
            </div>
          ))}
        </div>
      </div>

      {estateInfo.beneficiaries.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
          <h2 className="text-sm font-semibold text-white mb-4">Beneficiaries</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-slate-400 border-b border-slate-700">
                <th className="pb-2 pr-4">Name</th><th className="pb-2 pr-4">Relationship</th><th className="pb-2 pr-4">Percentage</th><th className="pb-2">Type</th>
              </tr></thead>
              <tbody>{estateInfo.beneficiaries.map(b => (
                <tr key={b.id} className="border-b border-slate-800/50">
                  <td className="py-2 pr-4 text-white">{b.name || 'Unnamed'}</td>
                  <td className="py-2 pr-4 text-slate-400 capitalize">{b.relationship || '-'}</td>
                  <td className="py-2 pr-4 text-blue-400">{b.percentage}%</td>
                  <td className="py-2 text-slate-400">{b.isPrimary ? 'Primary' : 'Contingent'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {estatePlan && estatePlan.recommendations.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
          <h2 className="text-sm font-semibold text-white mb-4">Recommendations</h2>
          <div className="space-y-3">
            {estatePlan.recommendations.map(rec => (
              <div key={rec.id} className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/30">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${rec.priority === 'critical' ? 'bg-red-500/20 text-red-400' : rec.priority === 'high' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400'}`}>{rec.priority}</span>
                  <span className="text-sm font-medium text-white">{rec.title}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{rec.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
