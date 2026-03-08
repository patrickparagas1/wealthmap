'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useFinancialStore } from '@/store/financial-store';
import { cn } from '@/lib/utils';
import { validateSection, ValidationError } from '@/lib/validation';
import {
  User, DollarSign, CreditCard, Landmark, TrendingDown, Target,
  BarChart3, Shield, FileText, Calculator, ChevronLeft, ChevronRight,
  CheckCircle2, ArrowLeft, Upload
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
  { id: 'personal_info', label: 'Personal Info', icon: User, component: PersonalInfoSection },
  { id: 'income', label: 'Income', icon: DollarSign, component: IncomeSection },
  { id: 'expenses', label: 'Expenses', icon: CreditCard, component: ExpenseSection },
  { id: 'assets', label: 'Assets', icon: Landmark, component: AssetsSection },
  { id: 'liabilities', label: 'Debts', icon: TrendingDown, component: LiabilitiesSection },
  { id: 'goals', label: 'Goals', icon: Target, component: GoalsSection },
  { id: 'risk_assessment', label: 'Risk Profile', icon: BarChart3, component: RiskAssessmentSection },
  { id: 'insurance', label: 'Insurance', icon: Shield, component: InsuranceSection },
  { id: 'estate', label: 'Estate', icon: FileText, component: EstateSection },
  { id: 'tax', label: 'Tax Info', icon: Calculator, component: TaxSection },
] as const;

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
    <div className="min-h-screen bg-slate-950 theme-dark">
      {/* Top bar */}
      <div className="glass border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/')} className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-white text-sm">WealthMap</span>
            </div>
          </div>
          <div className="text-sm text-slate-400">
            Step {currentStep + 1} of {steps.length}
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
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
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                    isActive ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                    isComplete ? 'text-emerald-400 hover:bg-slate-800/50' :
                    'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
                  )}
                >
                  {isComplete ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
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
          {/* Quick Import Banner */}
          {uploadPhase === 'idle' && (
            <button
              onClick={() => setUploadPhase('upload')}
              className="w-full mb-6 flex items-center gap-3 p-4 rounded-xl border border-dashed border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/50 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <Upload className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-blue-400">Quick Import</p>
                <p className="text-xs text-slate-500">Upload bank statements, tax returns, or investment reports for instant data entry</p>
              </div>
            </button>
          )}

          {uploadPhase === 'upload' && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-white">Upload Documents</h2>
                <button onClick={() => setUploadPhase('idle')} className="text-xs text-slate-400 hover:text-slate-200">
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

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-1">{step.label}</h1>
            <p className="text-sm text-slate-400">
              {currentStep === 0 && "Let's start with your basic information."}
              {currentStep === 1 && "Tell us about all your sources of income."}
              {currentStep === 2 && "Track your monthly expenses by category."}
              {currentStep === 3 && "List your assets including savings, investments, and property."}
              {currentStep === 4 && "List any outstanding debts and loans."}
              {currentStep === 5 && "What are your financial goals?"}
              {currentStep === 6 && "Help us understand your investment risk tolerance."}
              {currentStep === 7 && "Review your current insurance coverage."}
              {currentStep === 8 && "Estate planning document status."}
              {currentStep === 9 && "Additional tax planning information."}
            </p>
          </div>

          {errors.length > 0 && (
            <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="text-sm font-medium text-red-400 mb-2">Please fix the following:</div>
              <ul className="space-y-1">
                {errors.map((e, i) => (
                  <li key={i} className="text-xs text-red-300">- {e.message}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="fade-in">
            <StepComponent />
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-800">
            <button
              onClick={goPrev}
              disabled={currentStep === 0}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                currentStep === 0
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-300 hover:bg-slate-800 border border-slate-700'
              )}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            {currentStep < steps.length - 1 ? (
              <button
                onClick={goNext}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-xl hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/20"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/20"
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
