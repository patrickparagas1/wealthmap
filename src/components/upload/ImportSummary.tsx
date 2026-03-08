'use client';

import React from 'react';
import { CheckCircle2, ArrowRight, DollarSign, TrendingUp, CreditCard, Building } from 'lucide-react';

interface ImportCounts {
  income: number;
  expenses: number;
  assets: number;
  liabilities: number;
}

interface ImportSummaryProps {
  counts: ImportCounts;
  onViewQuestionnaire: () => void;
  onUploadMore: () => void;
}

export default function ImportSummary({ counts, onViewQuestionnaire, onUploadMore }: ImportSummaryProps) {
  const total = counts.income + counts.expenses + counts.assets + counts.liabilities;

  const categories = [
    { label: 'Income Sources', count: counts.income, icon: DollarSign, color: 'text-emerald-400' },
    { label: 'Assets', count: counts.assets, icon: TrendingUp, color: 'text-blue-400' },
    { label: 'Liabilities', count: counts.liabilities, icon: CreditCard, color: 'text-red-400' },
    { label: 'Expenses', count: counts.expenses, icon: Building, color: 'text-amber-400' },
  ].filter((c) => c.count > 0);

  return (
    <div className="bg-slate-900/50 rounded-xl border border-slate-700 p-6 text-center">
      <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
      </div>

      <h3 className="text-lg font-semibold text-slate-200 mb-1">Import Complete</h3>
      <p className="text-sm text-slate-400 mb-5">
        Successfully added {total} items to your financial plan
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
        {categories.map(({ label, count, icon: Icon, color }) => (
          <div
            key={label}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 text-sm"
          >
            <Icon className={`w-3.5 h-3.5 ${color}`} />
            <span className="text-slate-300">{count} {label}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={onUploadMore}
          className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg hover:border-slate-500 transition-colors"
        >
          Upload More
        </button>
        <button
          onClick={onViewQuestionnaire}
          className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
        >
          View in Questionnaire <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
