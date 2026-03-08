'use client';

import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, HelpCircle, DollarSign, TrendingUp, Building, CreditCard, ChevronDown, ChevronUp } from 'lucide-react';
import { MappedItem } from '@/lib/parsers';
import { IncomeSource, Expense, Asset, Liability } from '@/lib/types';

interface ReviewExtractedDataProps {
  items: MappedItem[];
  documentType: string;
  fileName: string;
  onImport: (items: MappedItem[]) => void;
  onCancel: () => void;
}

function ConfidenceBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  if (level === 'high') {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#34c759]/10 text-[#34c759] font-medium">
        <CheckCircle2 className="w-3 h-3" /> High
      </span>
    );
  }
  if (level === 'medium') {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#ff9500]/10 text-[#ff9500] font-medium">
        <AlertTriangle className="w-3 h-3" /> Medium
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#ff3b30]/10 text-[#ff3b30] font-medium">
      <HelpCircle className="w-3 h-3" /> Low
    </span>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function getItemValue(item: MappedItem): number {
  switch (item.type) {
    case 'income': return (item.data as IncomeSource).annualAmount;
    case 'expense': return (item.data as Expense).monthlyAmount;
    case 'asset': return (item.data as Asset).currentValue;
    case 'liability': return (item.data as Liability).currentBalance;
  }
}

function getItemDescription(item: MappedItem): string {
  switch (item.type) {
    case 'income': return (item.data as IncomeSource).description;
    case 'expense': return (item.data as Expense).description;
    case 'asset': return (item.data as Asset).name;
    case 'liability': return (item.data as Liability).name;
  }
}

function getValueLabel(type: string): string {
  switch (type) {
    case 'income': return '/yr';
    case 'expense': return '/mo';
    default: return '';
  }
}

const CATEGORY_CONFIG = {
  income: { icon: DollarSign, label: 'Income', color: 'text-[#34c759]', bg: 'bg-[#34c759]/10' },
  asset: { icon: TrendingUp, label: 'Assets', color: 'text-[#0071e3]', bg: 'bg-[#0071e3]/10' },
  liability: { icon: CreditCard, label: 'Liabilities', color: 'text-[#ff3b30]', bg: 'bg-[#ff3b30]/10' },
  expense: { icon: Building, label: 'Expenses', color: 'text-[#ff9500]', bg: 'bg-[#ff9500]/10' },
};

type CategoryKey = keyof typeof CATEGORY_CONFIG;

export default function ReviewExtractedData({ items, documentType, fileName, onImport, onCancel }: ReviewExtractedDataProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    new Set(items.map((_, i) => i))
  );
  const [editedValues, setEditedValues] = useState<Record<number, number>>({});
  const [expandedCategories, setExpandedCategories] = useState<Set<CategoryKey>>(
    new Set(['income', 'asset', 'liability', 'expense'])
  );

  const grouped = items.reduce<Record<CategoryKey, { index: number; item: MappedItem }[]>>(
    (acc, item, index) => {
      const key = item.type as CategoryKey;
      if (!acc[key]) acc[key] = [];
      acc[key].push({ index, item });
      return acc;
    },
    { income: [], asset: [], liability: [], expense: [] }
  );

  const toggleCategory = (cat: CategoryKey) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const toggleItem = (index: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleAllInCategory = (cat: CategoryKey) => {
    const catItems = grouped[cat];
    const allSelected = catItems.every(({ index }) => selectedIds.has(index));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      catItems.forEach(({ index }) => {
        if (allSelected) next.delete(index);
        else next.add(index);
      });
      return next;
    });
  };

  const handleValueChange = (index: number, value: string) => {
    const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
    if (!isNaN(num)) {
      setEditedValues((prev) => ({ ...prev, [index]: num }));
    }
  };

  const handleImport = () => {
    const selected = items
      .map((item, index) => {
        if (!selectedIds.has(index)) return null;
        if (editedValues[index] !== undefined) {
          const clone = { ...item, data: { ...item.data } };
          const val = editedValues[index];
          switch (clone.type) {
            case 'income': (clone.data as IncomeSource).annualAmount = val; break;
            case 'expense': (clone.data as Expense).monthlyAmount = val; break;
            case 'asset': (clone.data as Asset).currentValue = val; break;
            case 'liability': (clone.data as Liability).currentBalance = val; break;
          }
          return clone;
        }
        return item;
      })
      .filter((item): item is MappedItem => item !== null);

    onImport(selected);
  };

  const selectedCount = selectedIds.size;
  const hasItems = items.length > 0;

  if (!hasItems) {
    return (
      <div className="bg-white rounded-2xl border border-[#e8e8ed] p-8 text-center shadow-sm">
        <HelpCircle className="w-12 h-12 text-[#86868b] mx-auto mb-3" />
        <p className="text-[#1d1d1f] font-semibold mb-1">No financial data found</p>
        <p className="text-sm text-[#6e6e73] mb-4">
          We couldn&apos;t extract structured data from &quot;{fileName}&quot;. Try a different document.
        </p>
        <button onClick={onCancel} className="text-sm text-[#0071e3] font-medium hover:underline">
          Try another file
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#e8e8ed] overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-5 border-b border-[#e8e8ed] flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-[#1d1d1f]">Review Extracted Data</h3>
          <p className="text-xs text-[#6e6e73] mt-0.5">
            {fileName} — {documentType.replace(/_/g, ' ')} — {items.length} items found
          </p>
        </div>
        <span className="text-xs text-[#6e6e73] bg-[#f5f5f7] px-3 py-1 rounded-full font-medium">{selectedCount} selected</span>
      </div>

      {/* Categories */}
      <div className="divide-y divide-[#e8e8ed]">
        {(Object.keys(CATEGORY_CONFIG) as CategoryKey[]).map((cat) => {
          const config = CATEGORY_CONFIG[cat];
          const catItems = grouped[cat];
          if (catItems.length === 0) return null;

          const Icon = config.icon;
          const isExpanded = expandedCategories.has(cat);
          const allSelected = catItems.every(({ index }) => selectedIds.has(index));

          return (
            <div key={cat}>
              <div
                className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-[#f5f5f7]"
                onClick={() => toggleCategory(cat)}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl ${config.bg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <span className="text-sm font-semibold text-[#1d1d1f]">
                    {config.label}
                  </span>
                  <span className="text-xs text-[#86868b]">({catItems.length})</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleAllInCategory(cat); }}
                    className="text-xs text-[#0071e3] font-medium hover:underline"
                  >
                    {allSelected ? 'Deselect all' : 'Select all'}
                  </button>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-[#86868b]" /> : <ChevronDown className="w-4 h-4 text-[#86868b]" />}
                </div>
              </div>

              {isExpanded && (
                <div className="px-5 pb-4 space-y-2">
                  {catItems.map(({ index, item }) => {
                    const value = editedValues[index] ?? getItemValue(item);
                    const description = getItemDescription(item);
                    const isSelected = selectedIds.has(index);

                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          isSelected
                            ? 'border-[#d2d2d7] bg-[#f5f5f7]'
                            : 'border-transparent bg-[#fafafa] opacity-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleItem(index)}
                          className="w-4 h-4 rounded border-[#d2d2d7] text-[#0071e3] focus:ring-[#0071e3]/30 accent-[#0071e3]"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#1d1d1f] truncate font-medium">{description}</p>
                          <p className="text-xs text-[#86868b]">{item.source}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[#86868b]">$</span>
                            <input
                              type="text"
                              value={value.toLocaleString()}
                              onChange={(e) => handleValueChange(index, e.target.value)}
                              className="w-28 pl-5 pr-2 py-1.5 text-right text-sm font-mono bg-white border border-[#d2d2d7] rounded-lg text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/15"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#86868b]">
                              {getValueLabel(item.type)}
                            </span>
                          </div>
                          <ConfidenceBadge level={item.confidence} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="p-5 border-t border-[#e8e8ed] flex items-center justify-between bg-[#fafafa]">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-[#6e6e73] hover:text-[#1d1d1f] font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleImport}
          disabled={selectedCount === 0}
          className="px-6 py-2.5 text-sm font-semibold bg-[#0071e3] text-white rounded-full hover:bg-[#0077ed] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Import {selectedCount} Items to Plan
        </button>
      </div>
    </div>
  );
}
