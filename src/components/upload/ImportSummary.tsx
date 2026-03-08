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
    { label: 'Income Sources', count: counts.income, icon: DollarSign, color: 'text-[#34c759]', bg: 'bg-[#34c759]/10' },
    { label: 'Assets', count: counts.assets, icon: TrendingUp, color: 'text-[#0071e3]', bg: 'bg-[#0071e3]/10' },
    { label: 'Liabilities', count: counts.liabilities, icon: CreditCard, color: 'text-[#ff3b30]', bg: 'bg-[#ff3b30]/10' },
    { label: 'Expenses', count: counts.expenses, icon: Building, color: 'text-[#ff9500]', bg: 'bg-[#ff9500]/10' },
  ].filter((c) => c.count > 0);

  return (
    <div className="bg-white rounded-2xl border border-[#e8e8ed] p-8 text-center shadow-sm">
      <div className="w-16 h-16 rounded-full bg-[#34c759]/10 flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 className="w-9 h-9 text-[#34c759]" />
      </div>

      <h3 className="text-xl font-semibold text-[#1d1d1f] mb-1">Import Complete</h3>
      <p className="text-sm text-[#6e6e73] mb-6">
        Successfully added {total} items to your financial plan
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
        {categories.map(({ label, count, icon: Icon, color, bg }) => (
          <div
            key={label}
            className={`flex items-center gap-2 px-4 py-2 rounded-full ${bg} border border-[#e8e8ed]`}
          >
            <Icon className={`w-4 h-4 ${color}`} />
            <span className="text-sm font-medium text-[#1d1d1f]">{count} {label}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={onUploadMore}
          className="px-5 py-2.5 text-sm font-medium text-[#0071e3] border border-[#d2d2d7] rounded-full hover:bg-[#f5f5f7] transition-colors"
        >
          Upload More
        </button>
        <button
          onClick={onViewQuestionnaire}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold bg-[#0071e3] text-white rounded-full hover:bg-[#0077ed] transition-colors"
        >
          View in Questionnaire <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
