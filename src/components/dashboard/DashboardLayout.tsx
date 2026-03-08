'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, TrendingUp, DollarSign, PieChart, Receipt,
  Clock, Shield, ScrollText, GraduationCap, Target, CreditCard, Lightbulb,
  FileText, BarChart3, LogOut, Menu, X
} from 'lucide-react';

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'cashflow', label: 'Cash Flow', icon: DollarSign },
  { id: 'networth', label: 'Net Worth', icon: TrendingUp },
  { id: 'investments', label: 'Investments', icon: PieChart },
  { id: 'tax', label: 'Tax', icon: Receipt },
  { id: 'retirement', label: 'Retirement', icon: Clock },
  { id: 'debt', label: 'Debt Payoff', icon: CreditCard },
  { id: 'insurance', label: 'Insurance', icon: Shield },
  { id: 'estate', label: 'Estate', icon: ScrollText },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'scenarios', label: 'Scenarios', icon: Lightbulb },
];

interface DashboardLayoutProps {
  activePanel: string;
  onPanelChange: (panel: string) => void;
  children: React.ReactNode;
}

export default function DashboardLayout({ activePanel, onPanelChange, children }: DashboardLayoutProps) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 flex theme-dark">
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-60 bg-slate-900/80 backdrop-blur-xl border-r border-slate-800 transform transition-transform lg:translate-x-0 lg:static lg:z-auto',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">WealthMap</span>
          </div>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-3 space-y-0.5">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = activePanel === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { onPanelChange(item.id); setMobileOpen(false); }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                  active
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-800 space-y-1">
          <button onClick={() => router.push('/plan')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800/50">
            <FileText className="w-4 h-4" /> Full Plan Report
          </button>
          <button onClick={() => router.push('/')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800/50">
            <LogOut className="w-4 h-4" /> Back to Home
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 glass border-b border-slate-800 px-6 py-3 flex items-center justify-between lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="text-slate-400"><Menu className="w-5 h-5" /></button>
          <span className="text-sm font-semibold text-white">{navItems.find(n => n.id === activePanel)?.label}</span>
          <div className="w-5" />
        </header>
        <main className="p-6 lg:p-8 [&>div]:space-y-6">{children}</main>
      </div>

      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}
    </div>
  );
}
