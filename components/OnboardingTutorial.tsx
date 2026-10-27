
import React, { useState } from 'react';
import { Language } from '../types';
import { translations } from '../i18n';

interface Props {
  lang: Language;
  darkMode?: boolean;
  onComplete: () => void;
}

const OnboardingTutorial: React.FC<Props> = ({ lang, darkMode, onComplete }) => {
  const t = translations[lang];
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: '🌱',
      title: t.tutorial_p1_title,
      desc: t.tutorial_p1_desc,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-500'
    },
    {
      icon: '🧬',
      title: t.tutorial_p2_title,
      desc: t.tutorial_p2_desc,
      color: 'bg-blue-500',
      textColor: 'text-blue-500'
    },
    {
      icon: '⚡',
      title: t.tutorial_p3_title,
      desc: t.tutorial_p3_desc,
      color: 'bg-amber-500',
      textColor: 'text-amber-500'
    },
    {
      icon: '🕊️',
      title: t.tutorial_p4_title,
      desc: t.tutorial_p4_desc,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-500'
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-500">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl" />
      
      <div className="relative w-full max-w-4xl flex flex-col items-center">
        <div className="text-center mb-12">
           <h2 className="text-4xl md:text-5xl font-bold serif italic text-white mb-4">
             {t.tutorial_title}
           </h2>
           <p className="text-slate-400 max-w-md mx-auto">
             {t.tutorial_subtitle}
           </p>
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          {steps.map((step, idx) => {
            const isActive = currentStep === idx;
            const isPast = idx < currentStep;
            
            return (
              <div 
                key={idx}
                className={`relative p-8 rounded-[40px] border-2 transition-all duration-500 cursor-pointer ${
                  isActive 
                    ? `bg-white scale-105 shadow-2xl border-white translate-y-[-10px]` 
                    : `bg-slate-900 border-slate-800 opacity-40 scale-95`
                }`}
                onClick={() => setCurrentStep(idx)}
              >
                <div className={`w-16 h-16 rounded-3xl mb-6 flex items-center justify-center text-3xl shadow-lg ${
                  isActive ? step.color + ' text-white' : 'bg-slate-800 text-slate-500'
                }`}>
                  {step.icon}
                </div>
                <h3 className={`text-xl font-bold serif italic mb-3 transition-colors ${
                  isActive ? 'text-slate-900' : 'text-slate-500'
                }`}>
                  {step.title}
                </h3>
                {isActive && (
                  <p className="text-sm font-medium text-slate-600 leading-relaxed animate-in slide-in-from-bottom-2 duration-300">
                    {step.desc}
                  </p>
                )}
                {isPast && (
                   <div className="absolute top-4 right-4 text-emerald-500 font-black">✓</div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col items-center gap-6">
          <button
            onClick={handleNext}
            className="group relative px-12 py-5 rounded-[30px] bg-white text-slate-950 font-black uppercase tracking-widest transition-all hover:scale-110 active:scale-95 shadow-2xl overflow-hidden"
          >
            <span className="relative z-10">
              {currentStep === steps.length - 1 ? t.tutorial_cta : t.next}
            </span>
            <div className="absolute inset-0 bg-emerald-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300 opacity-10" />
          </button>
          
          <button 
            onClick={onComplete}
            className="text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors"
          >
            {t.tutorial_skip}
          </button>
        </div>

        {/* Progress dots for mobile view */}
        <div className="flex gap-2 mt-8 md:hidden">
          {steps.map((_, i) => (
             <div 
               key={i} 
               className={`w-2 h-2 rounded-full transition-all ${
                 currentStep === i ? 'bg-white w-6' : 'bg-slate-700'
               }`}
             />
          ))}
        </div>
      </div>
    </div>
  );
};

export default OnboardingTutorial;
