'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield, TrendingUp, PieChart, Calculator, GraduationCap,
  FileText, Users, ChevronRight, ChevronDown, Target, BarChart3,
  ArrowRight, CheckCircle2, Lock, Award, Upload, Heart, Zap,
  DollarSign, Percent, Clock, CreditCard, Sparkles, Star,
  Play, Minus, Plus
} from 'lucide-react';

// ─── Features ──────────────────────────────────────────────
const features = [
  {
    icon: PieChart,
    title: 'Investment Planning',
    description: 'FINRA-aligned risk profiling, asset allocation models, and rebalancing recommendations.',
    gradient: 'from-[#0071e3] to-[#5ac8fa]',
  },
  {
    icon: Calculator,
    title: 'Tax Optimization',
    description: 'Federal tax analysis, Roth conversion strategies, tax-loss harvesting, and deduction optimization.',
    gradient: 'from-[#34c759] to-[#30d158]',
  },
  {
    icon: TrendingUp,
    title: 'Retirement Planning',
    description: 'Social Security optimization, Monte Carlo simulations, and withdrawal strategy planning.',
    gradient: 'from-[#af52de] to-[#bf5af2]',
  },
  {
    icon: Shield,
    title: 'Insurance Analysis',
    description: 'Life, disability, and long-term care needs analysis with coverage gap identification.',
    gradient: 'from-[#ff9500] to-[#ffb340]',
  },
  {
    icon: FileText,
    title: 'Estate Planning',
    description: 'Document checklist, estate tax projections, beneficiary review, and trust analysis.',
    gradient: 'from-[#ff3b30] to-[#ff6961]',
  },
  {
    icon: GraduationCap,
    title: 'Education Planning',
    description: '529 plan optimization, cost projections, and funding gap analysis for each child.',
    gradient: 'from-[#5ac8fa] to-[#70d7ff]',
  },
];

const cfpAreas = [
  'Financial Statement Analysis', 'Cash Flow Management',
  'Risk Tolerance Assessment', 'Asset Allocation Strategy',
  'Tax Bracket Optimization', 'Retirement Income Planning',
  'Social Security Maximization', 'Insurance Needs Analysis',
  'Estate Document Review', 'Education Funding Strategy',
  'Debt Management Plan', 'Emergency Fund Analysis',
];

const testimonials = [
  {
    quote: 'Identified $4,200 in annual tax savings I was missing',
    author: 'Software Engineer, 35',
    stars: 5,
  },
  {
    quote: 'Finally understood my retirement gap — now I\'m on track',
    author: 'Marketing Director, 42',
    stars: 5,
  },
  {
    quote: 'The scenario comparison helped me decide to max out my 401(k)',
    author: 'Product Manager, 29',
    stars: 5,
  },
];

const faqs = [
  {
    q: 'Is my financial data secure?',
    a: 'Absolutely. All data processing happens entirely in your browser. Nothing is sent to any server. Your financial information never leaves your device.',
  },
  {
    q: 'How accurate are the recommendations?',
    a: 'Our engines use current IRS 2025 tax brackets, FINRA suitability guidelines, and CFP Board planning standards. The same methodology used by professional financial planners.',
  },
  {
    q: 'Do I need to create an account?',
    a: 'No. You can start building your financial plan immediately — no sign-up, no email, no account required. Your data is saved locally in your browser.',
  },
  {
    q: 'Can I upload my bank statements?',
    a: 'Yes. You can drag and drop PDF or CSV bank statements, tax returns, and investment reports. The app extracts financial data automatically — all processing happens on your device.',
  },
  {
    q: 'Is this a replacement for a financial advisor?',
    a: 'WealthMap is a planning tool for educational purposes. It provides the same analytical framework that CFP professionals use, but we recommend consulting with a qualified advisor for complex situations.',
  },
];

const comparisonData = [
  { feature: 'Comprehensive Plan', wealthmap: true, advisor: true, diy: false },
  { feature: 'Tax Optimization', wealthmap: true, advisor: true, diy: false },
  { feature: 'Monte Carlo Simulation', wealthmap: true, advisor: true, diy: false },
  { feature: 'Instant Results', wealthmap: true, advisor: false, diy: false },
  { feature: 'Document Upload', wealthmap: true, advisor: false, diy: false },
  { feature: 'Zero Cost', wealthmap: true, advisor: false, diy: true },
  { feature: '100% Private', wealthmap: true, advisor: false, diy: true },
];

// ─── Quick Score Calculator ────────────────────────────────
function QuickScoreCalculator() {
  const [income, setIncome] = useState('');
  const [savings, setSavings] = useState('');
  const [debt, setDebt] = useState('');
  const [retirement, setRetirement] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [calculating, setCalculating] = useState(false);

  const calculate = () => {
    setCalculating(true);
    setTimeout(() => {
      const inc = parseFloat(income) || 0;
      const sav = parseFloat(savings) || 0;
      const dbt = parseFloat(debt) || 0;
      const ret = parseFloat(retirement) || 0;

      let s = 50;

      // Savings rate score (0-25 pts)
      const savingsRate = inc > 0 ? (sav * 12) / inc : 0;
      s += Math.min(savingsRate * 100, 25);

      // Debt-to-income (0-25 pts penalty)
      const dti = inc > 0 ? (dbt / inc) * 100 : 0;
      s -= Math.min(dti * 0.5, 25);

      // Retirement savings ratio (0-20 pts)
      const retRatio = inc > 0 ? ret / inc : 0;
      s += Math.min(retRatio * 5, 20);

      // Emergency fund (bonus)
      if (sav >= inc * 0.5) s += 5;

      setScore(Math.round(Math.max(0, Math.min(100, s))));
      setCalculating(false);
    }, 800);
  };

  const getScoreColor = (s: number) => {
    if (s >= 80) return '#34c759';
    if (s >= 60) return '#ff9500';
    return '#ff3b30';
  };

  const getScoreLabel = (s: number) => {
    if (s >= 80) return 'Excellent';
    if (s >= 60) return 'Good';
    if (s >= 40) return 'Fair';
    return 'Needs Attention';
  };

  return (
    <div className="max-w-2xl mx-auto">
      {score === null ? (
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#6e6e73] mb-2">Annual Income</label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b]" />
              <input
                type="number"
                placeholder="85,000"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                className="calculator-input pl-10"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#6e6e73] mb-2">Monthly Savings</label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b]" />
              <input
                type="number"
                placeholder="1,500"
                value={savings}
                onChange={(e) => setSavings(e.target.value)}
                className="calculator-input pl-10"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#6e6e73] mb-2">Total Debt</label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b]" />
              <input
                type="number"
                placeholder="25,000"
                value={debt}
                onChange={(e) => setDebt(e.target.value)}
                className="calculator-input pl-10"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#6e6e73] mb-2">Retirement Savings</label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b]" />
              <input
                type="number"
                placeholder="150,000"
                value={retirement}
                onChange={(e) => setRetirement(e.target.value)}
                className="calculator-input pl-10"
              />
            </div>
          </div>
          <div className="sm:col-span-2">
            <button
              onClick={calculate}
              disabled={!income}
              className="w-full py-4 rounded-2xl bg-[#0071e3] text-white font-semibold text-lg hover:bg-[#0077ed] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Calculate My Score
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center fade-in">
          <div className="relative w-40 h-40 mx-auto mb-6">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#e8e8ed" strokeWidth="6" />
              <circle
                cx="50" cy="50" r="45" fill="none"
                stroke={getScoreColor(score)}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray="283"
                strokeDashoffset={283 - (283 * score) / 100}
                className="score-ring"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold financial-figure" style={{ color: getScoreColor(score) }}>{score}</span>
              <span className="text-sm text-[#86868b]">/ 100</span>
            </div>
          </div>
          <p className="text-xl font-semibold mb-2" style={{ color: getScoreColor(score) }}>
            {getScoreLabel(score)}
          </p>
          <p className="text-[#6e6e73] mb-6 max-w-md mx-auto">
            Get a detailed breakdown across 12 planning areas with actionable recommendations.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setScore(null)}
              className="px-6 py-3 rounded-full border border-[#d2d2d7] text-[#6e6e73] font-medium hover:border-[#6e6e73]"
            >
              Recalculate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── FAQ Item ──────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#e8e8ed]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full py-5 flex items-center justify-between text-left group"
      >
        <span className="text-lg font-semibold text-[#1d1d1f] group-hover:text-[#0071e3]">{q}</span>
        {open
          ? <Minus className="w-5 h-5 text-[#86868b] flex-shrink-0" />
          : <Plus className="w-5 h-5 text-[#86868b] flex-shrink-0" />
        }
      </button>
      <div className={`faq-answer ${open ? 'open' : ''}`}>
        <p className="text-[#6e6e73] leading-relaxed pb-5">{a}</p>
      </div>
    </div>
  );
}

// ─── Landing Page ──────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-[#e8e8ed]">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0071e3] to-[#af52de] flex items-center justify-center">
              <BarChart3 className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-[#1d1d1f]">WealthMap</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-[#6e6e73] hover:text-[#1d1d1f]">Features</a>
            <a href="#calculator" className="text-sm text-[#6e6e73] hover:text-[#1d1d1f]">Calculator</a>
            <a href="#compare" className="text-sm text-[#6e6e73] hover:text-[#1d1d1f]">Compare</a>
            <a href="#faq" className="text-sm text-[#6e6e73] hover:text-[#1d1d1f]">FAQ</a>
            <button
              onClick={() => router.push('/questionnaire')}
              className="btn-primary text-sm !py-2 !px-5"
            >
              Get Started
            </button>
          </div>
          <button
            onClick={() => router.push('/questionnaire')}
            className="md:hidden px-4 py-2 bg-[#0071e3] text-white text-sm font-medium rounded-full"
          >
            Start
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-28 pb-16 px-6 bg-hero-gradient overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial-blue" />
        <div className="absolute top-20 left-1/4 w-[600px] h-[600px] bg-[#0071e3]/[0.04] rounded-full blur-3xl float-slow" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#af52de]/[0.03] rounded-full blur-3xl float-delayed" />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0071e3]/[0.06] border border-[#0071e3]/[0.12] mb-8 fade-in">
            <Sparkles className="w-3.5 h-3.5 text-[#0071e3]" />
            <span className="text-sm font-medium text-[#0071e3]">Powered by CFP & FINRA Standards</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-[80px] font-bold tracking-[-0.04em] leading-[0.95] mb-6 fade-in-delay-1">
            <span className="text-[#1d1d1f]">Your complete</span>
            <br />
            <span className="gradient-text">financial plan.</span>
          </h1>

          <p className="text-xl md:text-2xl text-[#6e6e73] max-w-2xl mx-auto mb-10 leading-relaxed font-light fade-in-delay-2">
            Professional-grade financial planning — investments, taxes, retirement, insurance — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 fade-in-delay-3">
            <button
              onClick={() => router.push('/questionnaire')}
              className="group px-8 py-4 bg-[#0071e3] text-white font-semibold rounded-full hover:bg-[#0077ed] shadow-lg shadow-[#0071e3]/20 flex items-center justify-center gap-2.5 text-lg"
            >
              Build My Plan
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => router.push('/advisor')}
              className="px-8 py-4 border border-[#d2d2d7] text-[#1d1d1f] font-semibold rounded-full hover:bg-[#f5f5f7] flex items-center justify-center gap-2.5 text-lg"
            >
              <Users className="w-5 h-5" />
              Advisor Portal
            </button>
          </div>

          {/* Trust Row */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-[#86868b] mb-16">
            {[
              { icon: Lock, text: 'Data stays on device' },
              { icon: Award, text: 'CFP Board standards' },
              { icon: Shield, text: 'FINRA aligned' },
              { icon: CheckCircle2, text: 'No account required' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-1.5">
                <item.icon className="w-3.5 h-3.5" />
                <span>{item.text}</span>
              </div>
            ))}
          </div>

          {/* Dashboard Preview */}
          <div className="max-w-3xl mx-auto rounded-2xl bg-[#1d1d1f] p-5 shadow-2xl shadow-black/10 ring-1 ring-black/5">
            <div className="flex items-center gap-1.5 mb-4">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <div className="w-3 h-3 rounded-full bg-[#28c840]" />
              <span className="ml-3 text-xs text-white/30 font-mono">WealthMap Dashboard</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Net Worth', value: '$847,200', color: '#34c759' },
                { label: 'Health Score', value: '82/100', color: '#0071e3' },
                { label: 'Retirement', value: '74% Funded', color: '#ff9500' },
              ].map((kpi) => (
                <div key={kpi.label} className="rounded-xl bg-white/[0.06] p-3.5">
                  <div className="text-[11px] text-white/40 mb-1">{kpi.label}</div>
                  <div className="text-lg font-bold financial-figure" style={{ color: kpi.color }}>{kpi.value}</div>
                </div>
              ))}
            </div>
            <div className="h-28 rounded-xl bg-white/[0.03] flex items-end px-4 pb-3 gap-1.5">
              {[30, 45, 35, 55, 50, 65, 60, 75, 70, 85, 80, 90].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm"
                  style={{
                    height: `${h}%`,
                    background: `linear-gradient(180deg, #0071e3 0%, #af52de 100%)`,
                    opacity: 0.6 + (h / 250),
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="py-12 px-6 border-b border-[#e8e8ed]">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '12', label: 'Planning Areas', icon: Target },
            { value: '50+', label: 'Tax Jurisdictions', icon: Calculator },
            { value: '1,000', label: 'Monte Carlo Runs', icon: BarChart3 },
            { value: '100%', label: 'Client-Side', icon: Lock },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <stat.icon className="w-5 h-5 text-[#0071e3] mx-auto mb-2" />
              <div className="text-3xl font-bold text-[#1d1d1f] financial-figure">{stat.value}</div>
              <div className="text-sm text-[#86868b] mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[#1d1d1f] mb-4">
              Three simple steps.
            </h2>
            <p className="text-xl text-[#6e6e73] font-light">
              From data to plan in minutes, not months.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Upload or enter',
                description: 'Drop your bank statements, tax returns, or investment reports — or answer a guided questionnaire.',
                icon: Upload,
                color: '#0071e3',
              },
              {
                step: '2',
                title: 'We analyze',
                description: '12 financial engines crunch your numbers across tax, retirement, insurance, estate, and more.',
                icon: Zap,
                color: '#af52de',
              },
              {
                step: '3',
                title: 'Get your plan',
                description: 'Comprehensive plan with actionable recommendations, scenario comparisons, and exportable PDF.',
                icon: FileText,
                color: '#34c759',
              },
            ].map((item) => (
              <div key={item.step} className="text-center group">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform"
                  style={{ background: `${item.color}12` }}
                >
                  <item.icon className="w-7 h-7" style={{ color: item.color }} />
                </div>
                <div className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: item.color }}>
                  Step {item.step}
                </div>
                <h3 className="text-2xl font-semibold text-[#1d1d1f] mb-3">{item.title}</h3>
                <p className="text-[#6e6e73] leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6 section-alt">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[#1d1d1f] mb-4">
              Everything you need.
            </h2>
            <p className="text-xl text-[#6e6e73] font-light max-w-2xl mx-auto">
              Every area a Certified Financial Planner would address, powered by sophisticated analysis engines.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="card-premium p-7 group cursor-default"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg`}
                  style={{ boxShadow: '0 4px 14px rgba(0,0,0,0.08)' }}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-[#1d1d1f] mb-2">{feature.title}</h3>
                <p className="text-[#6e6e73] text-[15px] leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Interactive Calculator ── */}
      <section id="calculator" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#34c759]/[0.08] border border-[#34c759]/[0.15] mb-6">
              <Zap className="w-3.5 h-3.5 text-[#34c759]" />
              <span className="text-sm font-medium text-[#34c759]">Try it now</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[#1d1d1f] mb-4">
              Quick health check.
            </h2>
            <p className="text-xl text-[#6e6e73] font-light max-w-lg mx-auto">
              Get an instant financial health score in 30 seconds.
            </p>
          </div>
          <QuickScoreCalculator />
        </div>
      </section>

      {/* ── Comparison Table ── */}
      <section id="compare" className="py-24 px-6 section-alt">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[#1d1d1f] mb-4">
              See the difference.
            </h2>
            <p className="text-xl text-[#6e6e73] font-light">
              Professional-grade analysis without the professional-grade price tag.
            </p>
          </div>

          <div className="card-premium overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e8e8ed]">
                  <th className="text-left py-4 px-6 text-sm font-medium text-[#86868b]">Feature</th>
                  <th className="py-4 px-4 text-center">
                    <div className="text-sm font-bold text-[#0071e3]">WealthMap</div>
                    <div className="text-xs text-[#86868b]">Free</div>
                  </th>
                  <th className="py-4 px-4 text-center">
                    <div className="text-sm font-semibold text-[#1d1d1f]">Advisor</div>
                    <div className="text-xs text-[#86868b]">$2-5k+/yr</div>
                  </th>
                  <th className="py-4 px-4 text-center">
                    <div className="text-sm font-semibold text-[#1d1d1f]">DIY</div>
                    <div className="text-xs text-[#86868b]">Spreadsheets</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row) => (
                  <tr key={row.feature} className="border-b border-[#e8e8ed] last:border-0">
                    <td className="py-3.5 px-6 text-sm text-[#1d1d1f]">{row.feature}</td>
                    <td className="py-3.5 px-4 text-center">
                      {row.wealthmap
                        ? <CheckCircle2 className="w-5 h-5 text-[#34c759] mx-auto" />
                        : <div className="w-5 h-5 rounded-full border-2 border-[#d2d2d7] mx-auto" />
                      }
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {row.advisor
                        ? <CheckCircle2 className="w-5 h-5 text-[#86868b] mx-auto" />
                        : <div className="w-5 h-5 rounded-full border-2 border-[#d2d2d7] mx-auto" />
                      }
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {row.diy
                        ? <CheckCircle2 className="w-5 h-5 text-[#86868b] mx-auto" />
                        : <div className="w-5 h-5 rounded-full border-2 border-[#d2d2d7] mx-auto" />
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[#1d1d1f] mb-4">
              Real results.
            </h2>
            <p className="text-xl text-[#6e6e73] font-light">What users discover with WealthMap.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="card-premium p-7">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-[#ff9500] text-[#ff9500]" />
                  ))}
                </div>
                <p className="text-lg font-medium text-[#1d1d1f] mb-4 leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <p className="text-sm text-[#86868b]">
                  &mdash; WealthMap User, {t.author}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trusted Framework ── */}
      <section className="py-16 px-6 section-alt border-y border-[#e8e8ed]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Award, label: 'CFP Board Standards', sub: 'Certified planner methodology' },
              { icon: Shield, label: 'FINRA Reg BI', sub: 'Best interest aligned' },
              { icon: FileText, label: 'IRS 2025 Data', sub: 'Current brackets & credits' },
              { icon: Heart, label: 'DIME Method', sub: 'Insurance needs framework' },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#0071e3]/[0.06] flex items-center justify-center mx-auto mb-3">
                  <item.icon className="w-5 h-5 text-[#0071e3]" />
                </div>
                <p className="text-sm font-semibold text-[#1d1d1f]">{item.label}</p>
                <p className="text-xs text-[#86868b] mt-1">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CFP Coverage ── */}
      <section id="cfp" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[#1d1d1f] mb-6">
                Built on CFP Board&nbsp;standards.
              </h2>
              <p className="text-lg text-[#6e6e73] mb-8 leading-relaxed">
                Our platform follows the same comprehensive planning methodology used by Certified Financial Planners.
              </p>
              <button
                onClick={() => router.push('/questionnaire')}
                className="group px-7 py-3.5 bg-[#0071e3] text-white font-semibold rounded-full hover:bg-[#0077ed] flex items-center gap-2"
              >
                Start Your Plan
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {cfpAreas.map((area) => (
                <div
                  key={area}
                  className="flex items-center gap-2.5 p-3.5 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed]"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#34c759] flex-shrink-0" />
                  <span className="text-sm text-[#1d1d1f]">{area}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 px-6 section-alt">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[#1d1d1f] mb-4">
              Questions? Answers.
            </h2>
          </div>
          <div className="card-premium px-8 py-2">
            {faqs.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Advisor Section ── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#af52de]/[0.06] border border-[#af52de]/[0.12] mb-6">
            <Users className="w-3.5 h-3.5 text-[#af52de]" />
            <span className="text-sm font-medium text-[#af52de]">For Financial Advisors</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[#1d1d1f] mb-6">
            Power your practice.
          </h2>
          <p className="text-lg text-[#6e6e73] mb-10 max-w-2xl mx-auto leading-relaxed">
            Use WealthMap as your client-facing planning platform. Generate comprehensive financial plans
            and deliver institutional-quality recommendations.
          </p>
          <button
            onClick={() => router.push('/advisor')}
            className="px-8 py-4 bg-[#af52de] text-white font-semibold rounded-full hover:bg-[#bf5af2] shadow-lg shadow-[#af52de]/20"
          >
            Explore Advisor Portal
          </button>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 px-6 bg-[#1d1d1f]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Start building your
            <br />
            <span className="bg-gradient-to-r from-[#0071e3] to-[#af52de] bg-clip-text text-transparent">financial future.</span>
          </h2>
          <p className="text-lg text-white/50 mb-10">
            No sign-up required. Your data stays on your device.
          </p>
          <button
            onClick={() => router.push('/questionnaire')}
            className="group px-10 py-5 bg-white text-[#1d1d1f] font-bold rounded-full text-lg flex items-center gap-3 mx-auto hover:bg-white/90 shadow-2xl"
          >
            Build My Financial Plan — Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 px-6 border-t border-[#e8e8ed] bg-[#f5f5f7]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#0071e3] to-[#af52de] flex items-center justify-center">
              <BarChart3 className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-[#6e6e73]">WealthMap</span>
          </div>
          <p className="text-xs text-[#86868b] text-center max-w-xl">
            WealthMap provides financial planning tools for educational purposes. This is not financial advice.
            Consult with a qualified financial professional before making financial decisions.
          </p>
          <div className="text-xs text-[#86868b]">
            Built with CFP & FINRA Standards
          </div>
        </div>
      </footer>
    </div>
  );
}
