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
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
        <CheckCircle2 className="w-3 h-3" /> High
      </span>
    );
  }
  if (level === 'medium') {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400">
        <AlertTriangle className="w-3 h-3" /> Medium
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">
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
  income: { icon: DollarSign, label: 'Income', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  asset: { icon: TrendingUp, label: 'Assets', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  liability: { icon: CreditCard, label: 'Liabilities', color: 'text-red-400', bg: 'bg-red-500/10' },
  expense: { icon: Building, label: 'Expenses', color: 'text-amber-400', bg: 'bg-amber-500/10' },
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
        // Apply edited values
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
      <div className="bg-slate-900/50 rounded-xl border border-slate-700 p-8 text-center">
        <HelpCircle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <p className="text-slate-300 font-medium mb-1">No financial data found</p>
        <p className="text-sm text-slate-500 mb-4">
          We couldn&apos;t extract structured data from &quot;{fileName}&quot;. Try a different document.
        </p>
        <button onClick={onCancel} className="text-sm text-blue-400 hover:underline">
          Try another file
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 rounded-xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Review Extracted Data</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {fileName} — {documentType.replace(/_/g, ' ')} — {items.length} items found
          </p>
        </div>
        <span className="text-xs text-slate-500">{selectedCount} selected</span>
      </div>

      {/* Categories */}
      <div className="divide-y divide-slate-800">
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
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-800/50"
                onClick={() => toggleCategory(cat)}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg ${config.bg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <span className="text-sm font-medium text-slate-200">
                    {config.label}
                  </span>
                  <span className="text-xs text-slate-500">({catItems.length})</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleAllInCategory(cat); }}
                    className="text-xs text-blue-400 hover:underline"
                  >
                    {allSelected ? 'Deselect all' : 'Select all'}
                  </button>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-3 space-y-2">
                  {catItems.map(({ index, item }) => {
                    const value = editedValues[index] ?? getItemValue(item);
                    const description = getItemDescription(item);
                    const isSelected = selectedIds.has(index);

                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
                          isSelected
                            ? 'border-slate-600 bg-slate-800/40'
                            : 'border-transparent bg-slate-800/20 opacity-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleItem(index)}
                          className="w-4 h-4 rounded border-slate-600 text-blue-500 focus:ring-blue-500/30 bg-slate-700"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-300 truncate">{description}</p>
                          <p className="text-xs text-slate-500">{item.source}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-500">$</span>
                            <input
                              type="text"
                              value={value.toLocaleString()}
                              onChange={(e) => handleValueChange(index, e.target.value)}
                              className="w-28 pl-5 pr-2 py-1 text-right text-sm font-mono bg-slate-700/50 border border-slate-600 rounded text-slate-200 focus:outline-none focus:border-blue-500"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500">
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
      <div className="p-4 border-t border-slate-700 flex items-center justify-between">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleImport}
          disabled={selectedCount === 0}
          className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Import {selectedCount} Items to Plan
        </button>
      </div>
    </div>
  );
}
