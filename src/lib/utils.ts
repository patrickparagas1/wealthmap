// Utility functions

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatCurrency(amount: number | undefined | null): string {
  if (amount == null) return '$0';
  const abs = Math.abs(amount);
  const formatted = abs >= 1000000
    ? `$${(abs / 1000000).toFixed(1)}M`
    : `$${abs.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  return amount < 0 ? `-${formatted}` : formatted;
}

export function formatCurrencyFull(amount: number | undefined | null): string {
  if (amount == null) return '$0';
  return amount < 0
    ? `-$${Math.abs(amount).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
    : `$${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export function formatPercent(value: number | undefined | null, decimals: number = 1): string {
  if (value == null) return '0%';
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}
