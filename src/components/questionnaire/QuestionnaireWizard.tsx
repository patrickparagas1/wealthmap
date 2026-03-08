'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useFinancialStore } from '@/store/financial-store';
import { cn } from '@/lib/utils';
import { validateSection, ValidationError } from '@/lib/validation';
import {
  User, DollarSign, CreditCard, Landmark, TrendingDown, Target,
  BarChart3, Shield, FileText, Calculator, ChevronLeft, ChevronRight,
  CheckCircle2, ArrowLeft, Upload, Clock, Sparkles
} from 'lucide-react';
import PersonalInfoSection from './sections/PersonalInfoSection';
import IncomeSection from './sections/IncomeSection';
import ExpenseSection from './sections/ExpenseSection';
import AssetsSection from './sections/AssetsSection';
import LiabilitiesSection from './sections/LiabilitiesSection';
import GoalsSection from './sections/GoalsSection';
import RiskAssessmentSection from './sections/RiskAssessmentSection';
import InsuranceSection from './sections/InsuranceSection';
import EstateSection from './sections/EstateSection';
import TaxSection from './sections/TaxSection';
import DocumentUploadZone from '@/components/upload/DocumentUploadZone';
import ReviewExtractedData from '@/components/upload/ReviewExtractedData';
import ImportSummary from '@/components/upload/ImportSummary';
import type { ParseResult, MappedItem } from '@/lib/parsers';
import type { IncomeSource, Expense, Asset, Liability } from '@/lib/types';

const steps = [
  {
    id: 'personal_info', label: 'Personal Info', icon: User, component: PersonalInfoSection,
    subtitle: 'Let\u2019s get to know you so we can personalize your financial plan.',
    estimate: '2 min',
  },
  {
    id: 'income', label: 'Income', icon: DollarSign, component: IncomeSection,
    subtitle: 'Understanding your income helps us build projections you can trust.',
    estimate: '2 min',
  },
  {
    id: 'expenses', label: 'Expenses', icon: CreditCard, component: ExpenseSection,
    subtitle: 'Knowing where your money goes is the first step to optimizing it.',
    estimate: '3 min',
  },
  {
    id: 'assets', label: 'Assets', icon: Landmark, component: AssetsSection,
    subtitle: 'Let\u2019s take stock of what you\u2019ve built so far \u2014 savings, investments, and property.',
    estimate: '3 min',
  },
  {
    id: 'liabilities', label: 'Debts', icon: TrendingDown, component: LiabilitiesSection,
    subtitle: 'Everyone has obligations \u2014 let\u2019s factor them into your complete picture.',
    estimate: '2 min',
  },
  {
    id: 'goals', label: 'Goals', icon: Target, component: GoalsSection,
    subtitle: 'What does financial success look like for you? Define your short and long-term objectives.',
    estimate: '3 min',
  },
  {
    id: 'risk_assessment', label: 'Risk Profile', icon: BarChart3, component: RiskAssessmentSection,
    subtitle: 'How do you feel about market ups and downs? This helps us tailor your investment strategy.',
    estimate: '2 min',
  },
  {
    id: 'insurance', label: 'Insurance', icon: Shield, component: InsuranceSection,
    subtitle: 'Review your current coverage to identify any gaps in protection.',
    estimate: '2 min',
  },
  {
    id: 'estate', label: 'Estate', icon: FileText, component: EstateSection,
    subtitle: 'Ensure your legacy is protected with proper estate planning documents.',
    estimate: '1 min',
  },
  {
    id: 'tax', label: 'Tax Info', icon: Calculator, component: TaxSection,
    subtitle: 'Additional details that help us find tax optimization opportunities for you.',
    estimate: '2 min',
  },
] as const;

// Encouragement messages shown between sections
const encouragements = [
  '', // Step 0 has no encouragement (first step)
  'Great start! Your personal info is set.',
  'Nice \u2014 your income details will power accurate projections.',
  'Expenses tracked! This helps identify savings opportunities.',
  'Your asset picture is taking shape.',
  'Debts factored in \u2014 now let\u2019s set your goals.',
  'Love your ambition! Now let\u2019s understand your risk comfort.',
  'Almost there \u2014 a few more details to complete your plan.',
  'Insurance reviewed! Just two more steps.',
  'Nearly done! One final section remaining.',
];

type UploadPhase = 'idle' | 'upload' | 'review' | 'done';

export default function QuestionnaireWizard() {
  const router = useRouter();
  const store = useFinancialStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  // Document upload state
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>('idle');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [importCounts, setImportCounts] = useState({ income: 0, expenses: 0, assets: 0, liabilities: 0 });

  const handleDocumentProcessed = useCallback((result: ParseResult) => {
    setParseResult(result);
    setUploadPhase('review');
  }, []);

  const handleImport = useCallback((items: MappedItem[]) => {
    const incomes = items.filter((i) => i.type === 'income').map((i) => i.data as IncomeSource);
    const expenses = items.filter((i) => i.type === 'expense').map((i) => i.data as Expense);
    const assets = items.filter((i) => i.type === 'asset').map((i) => i.data as Asset);
    const liabilities = items.filter((i) => i.type === 'liability').map((i) => i.data as Liability);

    if (incomes.length) store.batchAddIncomeSources(incomes);
    if (expenses.length) store.batchAddExpenses(expenses);
    if (assets.length) store.batchAddAssets(assets);
    if (liabilities.length) store.batchAddLiabilities(liabilities);

    setImportCounts({ income: incomes.length, expenses: expenses.length, assets: assets.length, liabilities: liabilities.length });
    setUploadPhase('done');
  }, [store]);

  const progress = ((currentStep + 1) / steps.length) * 100;
  const step = steps[currentStep];
  const StepComponent = step.component;

  const goNext = useCallback(() => {
    const validationErrors = validateSection(step.id, store);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      window.scrollTo(0, 0);
      return;
    }
    setErrors([]);
    if (currentStep < steps.length - 1) {
      setCurrentStep(s => s + 1);
      window.scrollTo(0, 0);
    }
  }, [currentStep, step.id, store]);

  const goPrev = useCallback(() => {
    if (currentStep > 0) {
      setErrors([]);
      setCurrentStep(s => s - 1);
      window.scrollTo(0, 0);
    }
  }, [currentStep]);

  const handleFinish = () => {
    store.setHasCompletedQuestionnaire(true);
    store.setView('dashboard');
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Top bar — clean glass effect */}
      <div className="glass border-b border-[#e8e8ed] sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/')} className="text-[#86868b] hover:text-[#1d1d1f] transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0071e3] to-[#af52de] flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-[#1d1d1f] text-sm">WealthMap</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-[#86868b]">
              <Clock className="w-3.5 h-3.5" />
              <span>~{step.estimate}</span>
            </div>
            <div className="text-sm text-[#6e6e73] font-medium">
              {currentStep + 1} of {steps.length}
            </div>
          </div>
        </div>
        {/* Segmented progress bar */}
        <div className="h-1 bg-[#e8e8ed] flex">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                'flex-1 transition-all duration-500',
                i <= currentStep ? 'bg-[#0071e3]' : 'bg-transparent',
                i < steps.length - 1 ? 'mr-px' : ''
              )}
            />
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 flex gap-8">
        {/* Sidebar nav */}
        <div className="hidden lg:block w-56 flex-shrink-0">
          <nav className="sticky top-24 space-y-1">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === currentStep;
              const isComplete = i < currentStep;
              return (
                <button
                  key={s.id}
                  onClick={() => { setErrors([]); setCurrentStep(i); window.scrollTo(0, 0); }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all',
                    isActive ? 'bg-[#0071e3]/8 text-[#0071e3] font-medium shadow-sm border border-[#0071e3]/15' :
                    isComplete ? 'text-[#34c759] hover:bg-[#f5f5f7]' :
                    'text-[#86868b] hover:text-[#1d1d1f] hover:bg-white'
                  )}
                >
                  {isComplete ? (
                    <CheckCircle2 className="w-4 h-4 text-[#34c759] flex-shrink-0" />
                  ) : (
                    <Icon className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span className="truncate">{s.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Encouragement banner */}
          {currentStep > 0 && encouragements[currentStep] && (
            <div className="flex items-center gap-2 mb-4 px-4 py-2.5 rounded-xl bg-[#34c759]/8 border border-[#34c759]/15">
              <Sparkles className="w-4 h-4 text-[#34c759]" />
              <p className="text-sm text-[#1d1d1f] font-medium">{encouragements[currentStep]}</p>
            </div>
          )}

          {/* Quick Import Banner */}
          {uploadPhase === 'idle' && (
            <button
              onClick={() => setUploadPhase('upload')}
              className="w-full mb-6 flex items-center gap-3 p-4 rounded-2xl border border-dashed border-[#0071e3]/25 bg-[#0071e3]/4 hover:bg-[#0071e3]/8 hover:border-[#0071e3]/40 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#0071e3]/10 flex items-center justify-center group-hover:bg-[#0071e3]/15 transition-colors">
                <Upload className="w-5 h-5 text-[#0071e3]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-[#0071e3]">Quick Import</p>
                <p className="text-xs text-[#6e6e73]">Upload bank statements, tax returns, or investment reports for instant data entry</p>
              </div>
            </button>
          )}

          {uploadPhase === 'upload' && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-[#1d1d1f]">Upload Documents</h2>
                <button onClick={() => setUploadPhase('idle')} className="text-xs text-[#6e6e73] hover:text-[#1d1d1f] font-medium">
                  Close
                </button>
              </div>
              <DocumentUploadZone onProcessed={handleDocumentProcessed} />
            </div>
          )}

          {uploadPhase === 'review' && parseResult && (
            <div className="mb-6">
              <ReviewExtractedData
                items={parseResult.items}
                documentType={parseResult.documentType}
                fileName={parseResult.fileName}
                onImport={handleImport}
                onCancel={() => { setUploadPhase('upload'); setParseResult(null); }}
              />
            </div>
          )}

          {uploadPhase === 'done' && (
            <div className="mb-6">
              <ImportSummary
                counts={importCounts}
                onViewQuestionnaire={() => { setUploadPhase('idle'); setCurrentStep(1); }}
                onUploadMore={() => { setUploadPhase('upload'); setParseResult(null); }}
              />
            </div>
          )}

          {/* Section header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#1d1d1f] mb-2">{step.label}</h1>
            <p className="text-[15px] text-[#6e6e73] leading-relaxed">{step.subtitle}</p>
          </div>

          {errors.length > 0 && (
            <div className="mb-6 p-4 rounded-2xl bg-[#ff3b30]/5 border border-[#ff3b30]/15">
              <div className="text-sm font-semibold text-[#ff3b30] mb-2">Please fix the following:</div>
              <ul className="space-y-1">
                {errors.map((e, i) => (
                  <li key={i} className="text-sm text-[#ff3b30]/80">- {e.message}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="fade-in">
            <StepComponent />
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-[#e8e8ed]">
            <button
              onClick={goPrev}
              disabled={currentStep === 0}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all',
                currentStep === 0
                  ? 'text-[#d2d2d7] cursor-not-allowed'
                  : 'text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-white border border-[#d2d2d7]'
              )}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            {currentStep < steps.length - 1 ? (
              <button
                onClick={goNext}
                className="flex items-center gap-2 px-7 py-2.5 bg-[#0071e3] text-white text-sm font-semibold rounded-full hover:bg-[#0077ed] shadow-lg shadow-[#0071e3]/20 transition-all"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="flex items-center gap-2 px-8 py-3 bg-[#34c759] text-white font-semibold rounded-full hover:bg-[#30d158] shadow-lg shadow-[#34c759]/20 transition-all"
              >
                <CheckCircle2 className="w-5 h-5" />
                Generate My Financial Plan
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
