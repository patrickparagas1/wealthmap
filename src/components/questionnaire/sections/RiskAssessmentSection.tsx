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
      <div className="p-5 rounded-2xl bg-[#0071e3]/5 border border-[#0071e3]/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-[#0071e3]" />
            <div>
              <div className="text-sm font-medium text-[#1d1d1f]">Risk Tolerance Assessment</div>
              <div className="text-xs text-[#6e6e73]">{answeredCount} of {totalQuestions} questions answered</div>
            </div>
          </div>
          {answeredCount > 0 && (
            <div className="text-right">
              <div className="text-sm font-semibold text-[#0071e3]">{riskLabel}</div>
              <div className="text-xs text-[#86868b]">Preliminary result</div>
            </div>
          )}
        </div>
        <div className="w-full bg-[#e8e8ed] rounded-full h-2">
          <div className="bg-[#0071e3] h-2 rounded-full transition-all" style={{ width: `${(answeredCount / totalQuestions) * 100}%` }} />
        </div>
      </div>

      {RISK_ASSESSMENT_QUESTIONS.map((q, idx) => (
        <div key={q.id} className="p-5 rounded-2xl bg-white border border-[#e8e8ed] shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-[#f5f5f7] border border-[#e8e8ed] flex items-center justify-center text-xs font-semibold text-[#1d1d1f]">{idx + 1}</span>
            <p className="text-sm font-medium text-[#1d1d1f] leading-relaxed">{q.question}</p>
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
                      ? 'bg-[#0071e3]/8 border-[#0071e3]/25 text-[#0071e3] font-medium'
                      : 'bg-[#f5f5f7] border-[#e8e8ed] text-[#6e6e73] hover:text-[#1d1d1f] hover:border-[#d2d2d7]'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                      isSelected ? 'border-[#0071e3]' : 'border-[#d2d2d7]'
                    )}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-[#0071e3]" />}
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
