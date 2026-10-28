import React, { useState } from 'react';
import {
  Baby,
  Sparkles,
  AlertTriangle,
  UtensilsCrossed,
  Clock,
  Heart,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Check,
  Ban,
  Layers,
} from 'lucide-react';
import { AyurvedicMasanumasikaMonth, Language, MasanumasikaSampleMeal } from '../types';
import { AYURVEDIC_MASANUMASIKA_MONTHS } from '../data/cohortData';

interface Props {
  initialMonth?: number;
  lang: Language;
  darkMode?: boolean;
  onMonthChange?: (newMonth: number) => void;
}

export const MasanumasikaMonthCard: React.FC<Props> = ({
  initialMonth = 1,
  lang,
  darkMode,
  onMonthChange,
}) => {
  const isBn = lang === 'bn';
  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    return initialMonth >= 1 && initialMonth <= 9 ? initialMonth : 1;
  });

  const currentData: AyurvedicMasanumasikaMonth =
    AYURVEDIC_MASANUMASIKA_MONTHS[selectedMonth] || AYURVEDIC_MASANUMASIKA_MONTHS[1];

  const handleSelectMonth = (m: number) => {
    setSelectedMonth(m);
    if (onMonthChange) onMonthChange(m);
  };

  return (
    <div className="space-y-6">
      {/* 9-Month Horizontal Navigator Tabs */}
      <div
        className={`p-4 rounded-3xl border shadow-sm ${
          darkMode ? 'bg-slate-900/90 border-slate-700/80' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Baby className="w-5 h-5 text-pink-500" />
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              {isBn
                ? 'আয়ুর্বেদিক মাসানুক্রমিক পথ্য ও শিশুর বৃদ্ধি ব্রাউজার'
                : 'Ayurvedic Masanumasika & Fetal Growth Progression'}
            </h3>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300">
            {isBn ? `বর্তমান: ${selectedMonth}ম মাস` : `Viewing: Month ${selectedMonth}`}
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((m) => {
            const isCur = selectedMonth === m;
            return (
              <button
                key={m}
                onClick={() => handleSelectMonth(m)}
                className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all text-center ${
                  isCur
                    ? 'bg-gradient-to-r from-pink-600 via-rose-600 to-amber-600 text-white border-pink-600 shadow-md scale-105'
                    : darkMode
                    ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-pink-50 hover:border-pink-300'
                }`}
              >
                <div>{isBn ? `${m}ম মাস` : `Month ${m}`}</div>
                <div className="text-[9px] font-normal opacity-80 mt-0.5">
                  {m <= 3
                    ? isBn
                      ? '১ম ট্রাইম'
                      : '1st Tri'
                    : m <= 6
                    ? isBn
                      ? '২য় ট্রাইম'
                      : '2nd Tri'
                    : isBn
                    ? '৩য় ট্রাইম'
                    : '3rd Tri'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Month Showcase Card */}
      <div
        className={`rounded-3xl border shadow-xl overflow-hidden transition-all ${
          darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
        }`}
      >
        {/* Banner with gradient header */}
        <div className="p-6 bg-gradient-to-r from-pink-600 via-rose-600 to-amber-600 text-white relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>
                  {isBn
                    ? `ট্রাইমেস্টার ${currentData.trimester} • ${currentData.dhatuFocus}`
                    : `Trimester ${currentData.trimester} • ${currentData.dhatuFocus}`}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                {isBn ? currentData.monthNameBn : currentData.monthNameEn}
              </h2>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                disabled={selectedMonth <= 1}
                onClick={() => handleSelectMonth(selectedMonth - 1)}
                className="p-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={selectedMonth >= 9}
                onClick={() => handleSelectMonth(selectedMonth + 1)}
                className="p-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Fetal Milestone & Ayurvedic Focus 2-Column Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fetal Development */}
            <div
              className={`p-4 rounded-2xl border ${
                darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-pink-50/60 border-pink-200/80'
              }`}
            >
              <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400 font-bold text-xs mb-2">
                <Baby className="w-4 h-4" />
                <span>{isBn ? 'গর্ভস্থ শিশুর শারীরিক ও অঙ্গের বিকাশ:' : 'Fetal Growth & Milestones:'}</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                {isBn ? currentData.fetusDevBn : currentData.fetusDevEn}
              </p>
            </div>

            {/* Ayurvedic Masanumasika Focus */}
            <div
              className={`p-4 rounded-2xl border ${
                darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-amber-50/60 border-amber-200/80'
              }`}
            >
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs mb-2">
                <Layers className="w-4 h-4" />
                <span>{isBn ? 'আয়ুর্বেদিক ধাতুপুষ্টি ও শারীরবৃত্তীয় লক্ষ্য:' : 'Ayurvedic Dhatu & Physiological Goal:'}</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                {isBn ? currentData.ayurvedicFocusBn : currentData.ayurvedicFocusEn}
              </p>
            </div>
          </div>

          {/* Functional Nutrition Targets */}
          <div
            className={`p-4 rounded-2xl border ${
              darkMode ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-emerald-50/70 border-emerald-200'
            }`}
          >
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs mb-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>{isBn ? 'ফাংশনাল নিউট্রিশন টার্গেট (Functional Targets):' : 'Functional Nutrition Targets:'}</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
              {isBn ? currentData.functionalNutritionBn : currentData.functionalNutritionEn}
            </p>
          </div>

          {/* ZERO HERBS MANDATORY SAFETY BANNER */}
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200">
                {isBn ? 'কঠোর চিকিৎসা সতর্কতা: কোনো ঔষধি হার্বস গ্রহণ করবেন না (Zero Herbs Rule)' : 'Zero Herbs Safety Warning'}
              </h4>
              <p className="mt-1 text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
                {isBn ? currentData.zeroHerbsReminderBn : currentData.zeroHerbsReminderEn}
              </p>
            </div>
          </div>

          {/* Key Kitchen Foods vs Prohibited Foods Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Green - Recommended Kitchen Foods */}
            <div
              className={`p-4 rounded-2xl border ${
                darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs mb-3">
                <Check className="w-4 h-4" />
                <span>
                  {isBn
                    ? `এই মাসের প্রধান পুষ্টিকর খাদ্য উপাদান (১০০% নিরাপদ ঘরোয়া খাবার):`
                    : `Key Kitchen Dietary Staples (Month ${selectedMonth}):`}
                </span>
              </div>
              <ul className="space-y-2">
                {(isBn ? currentData.keyKitchenFoodsBn : currentData.keyKitchenFoodsEn).map((food, i) => (
                  <li key={i} className="text-xs text-slate-700 dark:text-slate-200 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                    <span className="leading-relaxed">{food}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Red - Prohibited Foods */}
            <div
              className={`p-4 rounded-2xl border ${
                darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs mb-3">
                <Ban className="w-4 h-4" />
                <span>
                  {isBn ? 'বর্জনীয় ও ঝুঁকিপূর্ণ খাবারসমূহ:' : 'Strictly Prohibited & Contraindicated Foods:'}
                </span>
              </div>
              <ul className="space-y-2">
                {(isBn ? currentData.prohibitedFoodsBn : currentData.prohibitedFoodsEn).map((food, i) => (
                  <li key={i} className="text-xs text-slate-700 dark:text-slate-200 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                    <span className="leading-relaxed font-medium">{food}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sample Daily 7-Meal Timeline */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isBn
                    ? `${selectedMonth}ম মাসের আদর্শ দৈনিক খাদ্য তালিকা ও সময়সূচি (৭টি মিল স্লট)`
                    : `Month ${selectedMonth} Tailored 7-Meal Daily Schedule`}
                </h4>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {isBn ? 'ছোট ছোট ঘন ঘন আহার' : 'Small, frequent feeds'}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {currentData.sampleDayMenu.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    darkMode ? 'bg-slate-800/40 border-slate-700/80' : 'bg-slate-50/70 border-slate-200/80'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="px-2.5 py-1 rounded-xl bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 font-bold text-xs shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{m.time}</span>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {isBn ? m.mealNameBn : m.mealNameEn}
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          {isBn ? 'উপাদান: ' : 'Ingredients: '}
                        </span>
                        {isBn ? m.ingredientsBn : m.ingredientsEn}
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 sm:text-right shrink-0 max-w-xs">
                    {isBn ? m.benefitsBn : m.benefitsEn}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasanumasikaMonthCard;
