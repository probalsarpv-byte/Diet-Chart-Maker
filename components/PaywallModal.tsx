
import React, { useState } from 'react';
import { Language } from '../types';
import { translations } from '../i18n';

interface Props {
  onSubscribe: () => void;
  onClose: () => void;
  lang: Language;
  darkMode?: boolean;
  featureName?: string;
}

const PaywallModal: React.FC<Props> = ({ onSubscribe, onClose, lang, darkMode, featureName }) => {
  const t = translations[lang];
  const [processing, setProcessing] = useState(false);

  const handlePayment = () => {
    setProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      setProcessing(false);
      onSubscribe();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className={`relative w-full max-w-md rounded-[40px] overflow-hidden shadow-2xl border-2 ${
        darkMode ? 'bg-slate-900 border-amber-500/50' : 'bg-white border-amber-400'
      }`}>
        {/* Premium Badge */}
        <div className="absolute top-0 right-0 bg-gradient-to-bl from-amber-400 to-orange-500 text-white px-6 py-2 rounded-bl-[30px] font-black text-xs uppercase tracking-widest shadow-lg">
          Premium
        </div>

        <div className="p-8 text-center">
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-4xl mb-6 shadow-xl bg-gradient-to-br from-amber-100 to-orange-100 border-4 border-white dark:border-slate-800`}>
            👑
          </div>

          <h2 className={`text-2xl font-bold serif italic mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            {t.paywall_title}
          </h2>
          
          <p className={`text-sm mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {featureName ? t.paywall_feature_locked.replace('{feature}', featureName) : t.paywall_desc}
          </p>

          <div className={`text-left p-6 rounded-3xl mb-8 space-y-3 ${darkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
            <div className="flex items-center gap-3">
              <span className="text-green-500 text-lg">✓</span>
              <span className={`text-sm font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{t.paywall_benefit_1}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-500 text-lg">✓</span>
              <span className={`text-sm font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{t.paywall_benefit_2}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-500 text-lg">✓</span>
              <span className={`text-sm font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{t.paywall_benefit_3}</span>
            </div>
          </div>

          <button
            onClick={handlePayment}
            disabled={processing}
            className="w-full py-4 rounded-2xl font-black text-white uppercase tracking-widest shadow-xl active:scale-95 transition-all bg-gradient-to-r from-amber-500 to-orange-600 hover:to-orange-500"
          >
            {processing ? t.processing : t.subscribe_now}
          </button>
          
          <button 
            onClick={onClose}
            className={`mt-4 text-xs font-bold uppercase tracking-widest opacity-50 hover:opacity-100 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}
          >
            {t.maybe_later}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaywallModal;
