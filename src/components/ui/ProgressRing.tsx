'use client';

import { cn } from '@/lib/utils';

interface ProgressRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  subLabel?: string;
  color?: string;
  className?: string;
}

function getAutoColor(value: number): string {
  if (value >= 70) return '#10b981';
  if (value >= 40) return '#f59e0b';
  return '#ef4444';
}

export function ProgressRing({ value, size = 120, strokeWidth = 10, label, subLabel, color, className }: ProgressRingProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const activeColor = color ?? getAutoColor(clamped);

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-slate-700/60" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={activeColor}
          strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
          style={{ filter: `drop-shadow(0 0 6px ${activeColor}55)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-bold text-white leading-none" style={{ fontSize: size * 0.22 }}>
          {label ?? `${Math.round(clamped)}`}
        </span>
        {subLabel && <span className="text-slate-400 mt-0.5" style={{ fontSize: size * 0.11 }}>{subLabel}</span>}
      </div>
    </div>
  );
}

export default ProgressRing;
