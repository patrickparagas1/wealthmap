'use client';
import { useFinancialStore } from '@/store/financial-store';
import { RISK_ASSESSMENT_QUESTIONS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { BarChart3 } from 'lucide-react';

export default function RiskAssessmentSection() {
  const { riskAnswers, setRiskAnswers } = useFinancialStore();

  const handleAnswer = (questionId: string, value: number) => {
    setRiskAnswers({ ...riskAnswers, [questionId]: value });
  };

  const answeredCount = Object.keys(riskAnswers).length;
  const totalQuestions = RISK_ASSESSMENT_QUESTIONS.length;
  const avgScore = answeredCount > 0
    ? Object.values(riskAnswers).reduce((a, b) => a + b, 0) / answeredCount
    : 0;

  const riskLabel = avgScore <= 1.5 ? 'Conservative' : avgScore <= 2.5 ? 'Moderately Conservative' : avgScore <= 3.5 ? 'Moderate' : avgScore <= 4.5 ? 'Moderately Aggressive' : 'Aggressive';

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-xl bg-blue-500/5 border border-blue-500/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <div>
              <div className="text-sm font-medium text-white">Risk Tolerance Assessment</div>
              <div className="text-xs text-slate-400">{answeredCount} of {totalQuestions} questions answered</div>
            </div>
          </div>
          {answeredCount > 0 && (
            <div className="text-right">
              <div className="text-sm font-semibold text-blue-400">{riskLabel}</div>
              <div className="text-xs text-slate-500">Preliminary result</div>
            </div>
          )}
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full transition-all" style={{ width: `${(answeredCount / totalQuestions) * 100}%` }} />
        </div>
      </div>

      {RISK_ASSESSMENT_QUESTIONS.map((q, idx) => (
        <div key={q.id} className="p-5 rounded-xl bg-slate-800/30 border border-slate-700/50">
          <div className="flex items-start gap-3 mb-4">
            <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-300">{idx + 1}</span>
            <p className="text-sm font-medium text-white leading-relaxed">{q.question}</p>
          </div>
          <div className="space-y-2 ml-10">
            {q.options.map((opt) => {
              const isSelected = riskAnswers[q.id] === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleAnswer(q.id, opt.value)}
                  className={cn(
                    'w-full text-left px-4 py-3 rounded-xl text-sm transition-all border',
                    isSelected
                      ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                      : 'bg-slate-800/30 border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                      isSelected ? 'border-blue-500' : 'border-slate-600'
                    )}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                    </div>
                    {opt.label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
