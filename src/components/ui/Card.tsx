'use client';

import React from 'react';
import { cn } from '@/lib/utils';

type CardVariant = 'default' | 'outlined' | 'glass';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  noPadding?: boolean;
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-slate-900/50 border border-slate-800',
  outlined: 'bg-transparent border border-slate-700',
  glass: 'bg-slate-900/30 backdrop-blur-xl border border-slate-700/50',
};

export function Card({ variant = 'default', header, footer, noPadding, className, children, ...props }: CardProps) {
  return (
    <div className={cn('rounded-xl', variantStyles[variant], className)} {...props}>
      {header && (
        <div className="px-5 py-4 border-b border-slate-800/50">
          {typeof header === 'string' ? <h3 className="text-sm font-semibold text-white">{header}</h3> : header}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
      {footer && (
        <div className="px-5 py-3 border-t border-slate-800/50 bg-slate-900/30 rounded-b-xl">{footer}</div>
      )}
    </div>
  );
}

export default Card;
