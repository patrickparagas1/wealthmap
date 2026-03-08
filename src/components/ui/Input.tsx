'use client';

import React from 'react';
import { cn } from '@/lib/utils';

type InputType = 'text' | 'number' | 'currency' | 'percentage' | 'select' | 'date' | 'email';

interface InputOption { label: string; value: string; }

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  inputType?: InputType;
  label?: string;
  error?: string;
  helpText?: string;
  options?: InputOption[];
  inputSize?: 'sm' | 'md' | 'lg';
}

const sizeMap: Record<string, string> = {
  sm: 'h-8 text-xs',
  md: 'h-10 text-sm',
  lg: 'h-12 text-base',
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ inputType = 'text', label, error, helpText, options = [], inputSize = 'md', className, id: idProp, ...rest }, ref) => {
    const generatedId = React.useId();
    const id = idProp ?? generatedId;
    const htmlType = inputType === 'currency' || inputType === 'percentage' ? 'number' : inputType === 'select' ? 'text' : inputType;
    const hasPrefix = inputType === 'currency';
    const hasSuffix = inputType === 'percentage';

    const fieldStyles = cn(
      'w-full bg-slate-800/60 text-white placeholder:text-slate-500',
      'border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20',
      'rounded-xl outline-none',
      sizeMap[inputSize],
      error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
      hasPrefix ? 'pl-8 pr-4' : hasSuffix ? 'pl-4 pr-8' : 'px-4',
    );

    if (inputType === 'select') {
      return (
        <div className={cn('flex flex-col gap-1.5', className)}>
          {label && <label htmlFor={id} className="text-sm font-medium text-slate-300">{label}</label>}
          <select
            id={id}
            className={cn(
              'w-full bg-slate-800/60 text-white border border-slate-700 focus:border-blue-500',
              'focus:ring-2 focus:ring-blue-500/20 rounded-xl outline-none appearance-none cursor-pointer px-4',
              sizeMap[inputSize], error && 'border-red-500',
            )}
            {...(rest as unknown as React.SelectHTMLAttributes<HTMLSelectElement>)}
          >
            {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          {error && <p className="text-xs text-red-400">{error}</p>}
          {!error && helpText && <p className="text-xs text-slate-500">{helpText}</p>}
        </div>
      );
    }

    return (
      <div className={cn('flex flex-col gap-1.5', className)}>
        {label && <label htmlFor={id} className="text-sm font-medium text-slate-300">{label}</label>}
        <div className="relative">
          {hasPrefix && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">$</span>}
          <input ref={ref} id={id} type={htmlType} className={fieldStyles} {...rest} />
          {hasSuffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">%</span>}
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        {!error && helpText && <p className="text-xs text-slate-500">{helpText}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
export default Input;
