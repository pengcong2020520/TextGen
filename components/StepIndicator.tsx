import React from 'react';
import { AppStep } from '../types';

interface Props {
  currentStep: AppStep;
}

const steps = [
  { id: AppStep.TopicAndOutline, label: 'Topic & Outline' },
  { id: AppStep.ChapterDetails, label: 'Content Plan' },
  { id: AppStep.Drafting, label: 'Drafting' },
  { id: AppStep.Finalize, label: 'Finalize' },
];

export const StepIndicator: React.FC<Props> = ({ currentStep }) => {
  return (
    <div className="w-full py-6 mb-8">
      <div className="flex items-center justify-center w-full">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;

          return (
            <div key={step.id} className="flex items-center">
              <div className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-bold
                ${isActive ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-200' : ''}
                ${isCompleted ? 'border-emerald-500 bg-emerald-500 text-white' : ''}
                ${!isActive && !isCompleted ? 'border-slate-300 bg-white text-slate-400' : ''}
                transition-all duration-300
              `}>
                {isCompleted ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.id
                )}
                
                <span className={`absolute -bottom-6 w-32 text-center text-xs font-medium 
                  ${isActive ? 'text-indigo-600' : 'text-slate-500'}
                `}>
                  {step.label}
                </span>
              </div>
              
              {index < steps.length - 1 && (
                <div className={`w-12 sm:w-24 h-1 mx-2 rounded
                  ${isCompleted ? 'bg-emerald-500' : 'bg-slate-200'}
                `} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
