import React, { useState, useEffect } from 'react';
import { HealthProfile, DietPhaseChart, Phase, AssessmentData, Language, User, WeatherData } from '../types';
import { GeminiService } from '../services/geminiService';
import { WeatherService } from '../services/weatherService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { translations } from '../i18n';
import SmartBazaar from './SmartBazaar';

interface Props {
  profile: HealthProfile;
  lang: Language;
  darkMode?: boolean;
  currentPhase: Phase;
  onPhaseChange: (p: Phase) => void;
  onWeekComplete: () => void;
  user: User | null;
  onShowPaywall: () => void;
  onUpdateProfile: (p: HealthProfile) => void;
  initialChart: DietPhaseChart | null;
  onOpenTrafficLightGuide?: () => void;
}

type DietSubTab =
  | 'meals'
  | 'oil_water'
  | 'exchange_detox'
  | 'supplements'
  | 'exercise'
  | 'lifestyle';

const ExerciseAnimation: React.FC<{ type: string; cue?: string; color: string }> = ({
  type,
  cue,
  color,
}) => {
  const combined = `${type} ${cue || ''}`.toLowerCase();

  // 1. Pranayama / Breathing Rhythm Animation
  if (
    combined.includes('breathing') ||
    combined.includes('relaxation') ||
    combined.includes('pranayama') ||
    combined.includes('anulom')
  ) {
    return (
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        <div
          className="absolute w-12 h-12 rounded-full opacity-25 animate-ping"
          style={{ backgroundColor: color, animationDuration: '3s' }}
        />
        <div
          className="w-12 h-12 rounded-full border-2 flex items-center justify-center transition-transform duration-1000 animate-pulse"
          style={{ borderColor: color }}
        >
          <svg
            viewBox="0 0 64 64"
            className="w-8 h-8"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
          >
            <path d="M12 32 C20 20, 28 20, 32 32 C36 44, 44 44, 52 32" />
            <path d="M16 42 C24 34, 40 34, 48 42" opacity="0.6" />
          </svg>
        </div>
      </div>
    );
  }

  // 2. Walking / Brisk Walk / Post-Meal Movement Animation
  if (combined.includes('walk') || combined.includes('exercise') || combined.includes('cardio')) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-14 h-14">
          <circle cx="52" cy="18" r="8" fill={color} />
          <line x1="50" y1="28" x2="46" y2="56" stroke={color} strokeWidth="6" strokeLinecap="round" />
          <path
            d="M48 34 L32 48 M48 34 L64 46"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
            className="origin-center animate-pulse"
          />
          <path
            d="M46 56 L32 82 M46 56 L64 82"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            className="animate-bounce"
          />
          <line
            x1="20"
            y1="88"
            x2="80"
            y2="88"
            stroke={color}
            strokeWidth="3"
            strokeDasharray="6 6"
            opacity="0.5"
          />
        </svg>
      </div>
    );
  }

  // 3. Yoga / Surya Namaskar / Spinal Twist Animation
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-14 h-14">
        <circle
          cx="50"
          cy="50"
          r="38"
          stroke={color}
          strokeWidth="2"
          strokeDasharray="4 4"
          fill="none"
          opacity="0.35"
        />
        <circle cx="50" cy="22" r="7" fill={color} />
        <path
          d="M28 26 Q50 42 72 26"
          stroke={color}
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          className="animate-pulse"
        />
        <line x1="50" y1="30" x2="50" y2="60" stroke={color} strokeWidth="6" strokeLinecap="round" />
        <path
          d="M50 60 L30 76 L50 76 M50 60 L70 76 L50 76"
          stroke={color}
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-bounce"
        />
      </svg>
    </div>
  );
};

const DietView: React.FC<Props> = ({
  profile,
  lang,
  darkMode,
  currentPhase,
  onPhaseChange,
  onWeekComplete,
  user,
  onShowPaywall,
  onUpdateProfile,
  initialChart,
  onOpenTrafficLightGuide,
}) => {
  const t = translations[lang];
  const isBn = lang === 'bn';
  const [chart, setChart] = useState<DietPhaseChart | null>(initialChart);
  const [loading, setLoading] = useState(!initialChart);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<DietSubTab>('meals');

  const gemini = new GeminiService();
  const weatherService = new WeatherService();

  const SUB_TABS: { id: DietSubTab; labelBn: string; labelEn: string }[] = [
    { id: 'meals', labelBn: '🥗 ডায়েট চার্ট', labelEn: '🥗 Diet Chart' },
    { id: 'oil_water', labelBn: '🫗 তেল, ফ্যাট ও পানি', labelEn: '🫗 Oil, Fat & Water' },
    { id: 'exchange_detox', labelBn: '🔄 এক্সচেঞ্জ ও ডিটক্স', labelEn: '🔄 Exchange & Detox' },
    { id: 'supplements', labelBn: '💊 সাপ্লিমেন্ট', labelEn: '💊 Supplements' },
    { id: 'exercise', labelBn: '🏃 এক্সারসাইজ', labelEn: '🏃 Exercise' },
    { id: 'lifestyle', labelBn: '🌿 লাইফস্টাইল টিপস', labelEn: '🌿 Lifestyle Tips' },
  ];

  const fetchChart = async (
    customProfile: HealthProfile = profile,
    assessment?: AssessmentData,
    week: number = 1
  ) => {
    setLoading(true);
    try {
      let currentWeather = weather;
      if (!currentWeather && customProfile.location) {
        currentWeather = await weatherService.getCurrentWeather(
          customProfile.location.latitude,
          customProfile.location.longitude
        );
        setWeather(currentWeather);
      }
      const result = await gemini.analyzeHealthAndPhase(
        customProfile,
        currentPhase,
        week,
        lang,
        assessment,
        currentWeather || undefined
      );
      setChart(result);
      setCurrentDayIndex(0);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialChart) {
      setCurrentWeek(1);
      fetchChart(profile, undefined, 1);
    } else {
      setChart(initialChart);
      setLoading(false);
      if (profile.location) {
        weatherService
          .getCurrentWeather(profile.location.latitude, profile.location.longitude)
          .then(setWeather);
      }
    }
  }, [currentPhase, lang, initialChart]);

  const handleMealFrequencyToggle = (freq: 3 | 4) => {
    const updated: HealthProfile = { ...profile, mealFrequency: freq };
    onUpdateProfile(updated);
    fetchChart(updated, undefined, currentWeek);
  };

  const handleDinnerCarbToggle = (rule: 'vegetable_carbs' | 'cereal_allowed') => {
    const updated: HealthProfile = { ...profile, dinnerCarbRule: rule };
    onUpdateProfile(updated);
    fetchChart(updated, undefined, currentWeek);
  };

  const handleNextWeek = () => {
    const nextWeek = currentWeek + 1;
    if (nextWeek > 1 && !user?.isPro) {
      onShowPaywall();
      return;
    }
    onWeekComplete();
    if (nextWeek <= 3) {
      setCurrentWeek(nextWeek);
      fetchChart(profile, undefined, nextWeek);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      if (!user?.isPro) {
        onShowPaywall();
        return;
      }
      onPhaseChange(Math.min(currentPhase + 1, 4) as Phase);
    }
  };

  const handlePhaseClick = (p: number) => {
    if (p !== currentPhase) {
      if (!user?.isPro) {
        onShowPaywall();
        return;
      }
      onPhaseChange(p as Phase);
    }
  };

  const handleSubTabChange = (tab: DietSubTab) => {
    setActiveSubTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const macroData = chart?.macros
    ? [
        { name: t.macro_protein, value: chart.macros.protein, color: '#10b981' },
        { name: t.macro_fats, value: chart.macros.fats, color: '#f59e0b' },
        { name: t.macro_carbs, value: chart.macros.carbs, color: '#3b82f6' },
      ]
    : [];

  const activeMealFreq = chart?.mealFrequency || profile.mealFrequency || 3;
  const activeDinnerRule = profile.dinnerCarbRule || 'vegetable_carbs';
  const currentTabIndex = SUB_TABS.findIndex((item) => item.id === activeSubTab);

  // Reusable Oil, Fat & Water Summary Sidebar/Panel
  const renderOilAndWaterPanel = () => {
    if (!chart) return null;
    return (
      <div className="space-y-5">
        {/* Cooking Oil, Ghee & Fat Allocation Card */}
        {chart.fatOilAllocation && (
          <div
            className={`p-5 md:p-6 rounded-3xl border ${
              darkMode
                ? 'bg-slate-900 border-amber-900/40'
                : 'bg-amber-50/40 border-amber-200 shadow-sm'
            }`}
          >
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
              {isBn ? 'রান্নার তেল, ঘি ও ফ্যাট বণ্টন' : 'Lipid & Cooking Oil Protocol'}
            </span>
            <h3 className="font-bold text-lg md:text-xl serif italic mt-0.5 mb-3">
              {isBn
                ? 'রান্নার তেল ও ফ্যাটের ব্যবহার নির্দেশিকা'
                : 'Cooking Oil, Ghee & Fat Allocation'}
            </h3>

            <div className="space-y-3 tabular-nums">
              <div
                className={`p-3.5 rounded-2xl border flex justify-between items-center ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-amber-200'
                }`}
              >
                <span className="text-xs font-bold">
                  {isBn ? 'মোট দৈনিক ফ্যাট চাহিদা' : 'Total Daily Fat Requirement'}
                </span>
                <span className="text-lg font-black text-amber-500 font-mono">
                  {chart.fatOilAllocation.totalDailyFatGrams}g
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div
                  className={`p-3 rounded-2xl border ${
                    darkMode ? 'bg-slate-800/70 border-slate-700' : 'bg-white border-slate-200'
                  }`}
                >
                  <span className="text-[11px] font-semibold opacity-70 block">
                    {isBn ? 'ঘি ও রান্নার তেল থেকে' : 'Ghee & Cooking Oil'}
                  </span>
                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {chart.fatOilAllocation.cookingFatGrams}g
                  </span>
                  <span className="text-[10px] opacity-65 block mt-0.5">
                    {isBn
                      ? `ঘি ${chart.fatOilAllocation.gheeGrams}g + তেল ${chart.fatOilAllocation.cookingOilGrams}g`
                      : `Ghee ${chart.fatOilAllocation.gheeGrams}g + Oil ${chart.fatOilAllocation.cookingOilGrams}g`}
                  </span>
                </div>

                <div
                  className={`p-3 rounded-2xl border ${
                    darkMode ? 'bg-slate-800/70 border-slate-700' : 'bg-white border-slate-200'
                  }`}
                >
                  <span className="text-[11px] font-semibold opacity-70 block">
                    {isBn ? 'ডায়েটারি সোর্স থেকে' : 'From Dietary Sources'}
                  </span>
                  <span className="text-base font-bold text-blue-500 font-mono">
                    {chart.fatOilAllocation.dietarySourceFatGrams}g
                  </span>
                  <span className="text-[10px] opacity-65 block mt-0.5">
                    {isBn ? 'ডিম, মাছ, সিডস ও বাদাম' : 'Eggs, Fish, Seeds & Nuts'}
                  </span>
                </div>
              </div>

              <p className="text-xs leading-relaxed opacity-85 pt-1">
                {chart.fatOilAllocation.clinicalInstruction}
              </p>

              <div className="pt-2 border-t border-amber-200/50 dark:border-slate-800 text-xs space-y-1">
                <div className="font-bold opacity-75">
                  {isBn ? 'ডায়েটারি ফ্যাট সোর্স:' : 'Natural Dietary Fat Sources:'}
                </div>
                {chart.fatOilAllocation.dietaryFatSources?.map((src, idx) => (
                  <div key={idx} className="opacity-80">
                    • {src}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Daily Salt & Water Quantitative Prescription Card */}
        <div
          className={`p-5 md:p-6 rounded-3xl border ${
            darkMode
              ? 'bg-emerald-950/15 border-emerald-900/40'
              : 'bg-emerald-50/60 border-emerald-200 shadow-sm'
          }`}
        >
          <h3 className="font-bold mb-3.5 text-lg md:text-xl serif italic text-emerald-700 dark:text-emerald-400">
            {isBn ? 'দৈনিক পানি ও লবণের সুনির্দিষ্ট মাত্রা' : t.staples_title}
          </h3>
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-emerald-200/60 dark:border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase tracking-wider opacity-60">
                  🧂 {t.staple_salt}
                </span>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {chart.staplesAdvice?.saltGramsPerDay || '5g / Day'}
                </span>
              </div>
              <p className="text-xs font-medium leading-relaxed">{chart.staplesAdvice?.salt}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-emerald-200/60 dark:border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase tracking-wider opacity-60">
                  💧 {t.staple_water}
                </span>
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                  {chart.staplesAdvice?.waterLitersPerDay || '2.5 Liters / Day'}
                </span>
              </div>
              <p className="text-xs font-medium leading-relaxed">{chart.staplesAdvice?.water}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-emerald-200/60 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider opacity-60 block mb-1">
                🫗 {t.staple_oil}
              </span>
              <p className="text-xs font-medium leading-relaxed">{chart.staplesAdvice?.oil}</p>
            </div>
          </div>
        </div>

        {/* Macros Distribution Chart */}
        <div
          className={`p-5 md:p-6 rounded-3xl border ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <h3 className="font-bold mb-3 text-lg serif italic">{t.macro_dist}</h3>
          <div className="h-36 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={macroData}
                  innerRadius={44}
                  outerRadius={62}
                  paddingAngle={6}
                  dataKey="value"
                >
                  {macroData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 tabular-nums">
            {macroData.map((m) => (
              <div
                key={m.name}
                className={`p-2.5 rounded-xl text-center ${
                  darkMode ? 'bg-slate-800' : 'bg-slate-50'
                }`}
              >
                <span className="text-[11px] font-bold block" style={{ color: m.color }}>
                  {m.name}
                </span>
                <span className="font-mono font-bold text-sm">{m.value}g</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6 relative pb-24 md:pb-12">
      {/* Phase & Quick Clinical Toolbar */}
      <div
        className={`p-3 md:p-4 rounded-2xl md:rounded-3xl border flex flex-col lg:flex-row items-center justify-between gap-3 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex gap-1.5 overflow-x-auto w-full lg:w-auto justify-start lg:justify-center scrollbar-hide">
          {[1, 2, 3, 4].map((p) => (
            <button
              key={p}
              onClick={() => handlePhaseClick(p)}
              className={`px-4 py-2 rounded-xl font-bold text-xs md:text-sm transition-all relative whitespace-nowrap shrink-0 ${
                currentPhase === p
                  ? darkMode
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 text-white shadow-sm'
                  : darkMode
                  ? 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-100'
              }`}
            >
              {t.phase} {p}
              {p > 1 && !user?.isPro && <span className="ml-1 text-[10px]">🔒</span>}
            </button>
          ))}
        </div>

        {/* Interactive 3 vs 4 Meal Switcher & Traffic Light Guide Button */}
        <div className="flex flex-wrap items-center justify-between sm:justify-center gap-2 w-full lg:w-auto">
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => handleMealFrequencyToggle(3)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                activeMealFreq === 3
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {isBn ? '৩ বেলা' : '3 Meals'}
            </button>
            <button
              type="button"
              onClick={() => handleMealFrequencyToggle(4)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                activeMealFreq === 4
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {isBn ? '৪ বেলা' : '4 Meals'}
            </button>
          </div>

          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => handleDinnerCarbToggle('vegetable_carbs')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                activeDinnerRule === 'vegetable_carbs'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {isBn ? 'রাত: সবজি শর্করা' : 'Night: Veg Carbs'}
            </button>
            <button
              type="button"
              onClick={() => handleDinnerCarbToggle('cereal_allowed')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                activeDinnerRule === 'cereal_allowed'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {isBn ? 'রাত: শস্য' : 'Night: Cereal'}
            </button>
          </div>

          {onOpenTrafficLightGuide && (
            <button
              type="button"
              onClick={onOpenTrafficLightGuide}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-colors whitespace-nowrap shrink-0"
            >
              🚦 {isBn ? 'ট্রাফিক লাইট গাইড' : 'Food Guide'}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-28 gap-4">
          <div className="w-14 h-14 border-4 border-slate-800 border-t-emerald-500 rounded-full animate-spin" />
          <p className="font-bold italic animate-pulse opacity-60 text-sm text-center px-4">
            {isBn
              ? 'আপনার নির্বাচিত ট্রাফিক লাইট খাবার ও ক্যালোরি অনুযায়ী বাঙালি ডায়েট চার্ট তৈরি হচ্ছে...'
              : t.calc_supps}
          </p>
        </div>
      ) : chart ? (
        <div className="space-y-5">
          {/* Compact Phase Header & Section Tab Navigation Bar */}
          <div
            className={`p-4 md:p-6 rounded-3xl border ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
                  <span>
                    {isBn
                      ? `দিনে ${activeMealFreq} বেলা খাবার`
                      : `${activeMealFreq} Meals/Day Protocol`}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {isBn
                      ? `মোট ক্যালোরি: ${chart.totalDailyCalories || 1600} kcal/day`
                      : `Target: ${chart.totalDailyCalories || 1600} kcal/day`}
                  </span>
                </div>
                <h2
                  className={`text-xl md:text-3xl font-bold mt-1 serif italic ${
                    darkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {chart.phaseName}
                </h2>
              </div>

              {chart.calorieSplitSummary && (
                <div
                  className={`px-3.5 py-2 rounded-xl border text-xs font-mono tabular-nums ${
                    darkMode
                      ? 'bg-slate-800/70 border-slate-700 text-emerald-300'
                      : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                  }`}
                >
                  {chart.calorieSplitSummary}
                </div>
              )}
            </div>

            {/* Interactive Clinical Tabs (Eliminates Endless Vertical Scrolling!) */}
            <div className="pt-3 flex gap-2 overflow-x-auto scrollbar-hide">
              {SUB_TABS.map((tab) => {
                const isActive = activeSubTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleSubTabChange(tab.id)}
                    className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-all shrink-0 ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-md'
                        : darkMode
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isBn ? tab.labelBn : tab.labelEn}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ================================================================= */}
          {/* TAB 1: MEAL PLAN (ডায়েট চার্ট)                                    */}
          {/* ================================================================= */}
          {activeSubTab === 'meals' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
              {/* Left 8 Cols on Desktop / Full Width on Mobile: Daily Meal Schedule */}
              <div className="lg:col-span-8 space-y-4">
                <div
                  className={`rounded-3xl border overflow-hidden ${
                    darkMode
                      ? 'bg-slate-900 border-slate-800'
                      : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  {/* Day Selector Header */}
                  <div className="px-4 md:px-6 py-4 border-b border-inherit flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h3 className="font-bold text-lg md:text-xl serif italic">
                        {isBn
                          ? `দৈনিক বাঙালি ডায়েট মেনু (${activeMealFreq} বেলা)`
                          : `${t.daily_schedule} (${activeMealFreq} Meals)`}
                      </h3>
                      {chart.dinnerCarbStrategy && (
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                          {chart.dinnerCarbStrategy}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-hide">
                      {chart.weeklySchedule?.map((day, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCurrentDayIndex(idx)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                            currentDayIndex === idx
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : darkMode
                              ? 'bg-slate-800 text-slate-400 hover:text-white'
                              : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {day.day}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Meals for Selected Day */}
                  <div className="p-4 md:p-6 space-y-4">
                    {chart.weeklySchedule?.[currentDayIndex]?.meals?.map((meal, idx) => (
                      <div
                        key={idx}
                        className={`p-4 md:p-5 rounded-2xl border transition-all ${
                          darkMode
                            ? 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
                            : 'bg-slate-50/70 border-slate-200/80 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200/60 dark:border-slate-700/60">
                          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                            <span>{meal.time}</span>
                            {meal.mealSlot && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>{meal.mealSlot}</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs font-mono tabular-nums">
                            <span className="font-semibold opacity-75">{meal.quantity}</span>
                            {meal.calories && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-bold text-amber-600 dark:text-amber-400">
                                  {meal.calories}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <h4 className="font-bold text-base md:text-lg mt-2.5">{meal.mealName}</h4>
                        <p className="text-xs md:text-sm opacity-85 leading-relaxed mt-1.5">
                          {meal.description}
                        </p>

                        {meal.macroBreakdown && (
                          <div className="mt-2.5 pt-2.5 border-t border-slate-200/50 dark:border-slate-700/50 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] opacity-75 tabular-nums">
                            <span>
                              <strong>{isBn ? 'প্রোটিন:' : 'Protein:'}</strong>{' '}
                              {meal.macroBreakdown.protein}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>
                              <strong>{isBn ? 'শর্করা:' : 'Carbs:'}</strong>{' '}
                              {meal.macroBreakdown.carbs}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>
                              <strong>{isBn ? 'ফ্যাট:' : 'Fats:'}</strong>{' '}
                              {meal.macroBreakdown.fats}
                            </span>
                            {meal.macroBreakdown.carbSourceType && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                  {meal.macroBreakdown.carbSourceType}
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mobile Quick Summary Strip for Oil, Water & Salt */}
                <div className="grid grid-cols-3 gap-2.5 lg:hidden tabular-nums">
                  <button
                    type="button"
                    onClick={() => handleSubTabChange('oil_water')}
                    className={`p-3 rounded-2xl border text-left ${
                      darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    <span className="text-[10px] opacity-60 block">
                      {isBn ? 'ঘি ও তেল' : 'Ghee & Oil'}
                    </span>
                    <span className="text-sm font-bold text-amber-500 font-mono">
                      {chart.fatOilAllocation?.cookingFatGrams || 20}g/day
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubTabChange('oil_water')}
                    className={`p-3 rounded-2xl border text-left ${
                      darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    <span className="text-[10px] opacity-60 block">
                      {isBn ? 'দৈনিক পানি' : 'Daily Water'}
                    </span>
                    <span className="text-sm font-bold text-blue-500 font-mono">
                      {chart.staplesAdvice?.waterLitersPerDay || '2.5 L'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubTabChange('oil_water')}
                    className={`p-3 rounded-2xl border text-left ${
                      darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    <span className="text-[10px] opacity-60 block">
                      {isBn ? 'পিংক সল্ট' : 'Pink Salt'}
                    </span>
                    <span className="text-sm font-bold text-emerald-500 font-mono">
                      {chart.staplesAdvice?.saltGramsPerDay || '5g'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Right 4 Cols on Desktop Only: Oil/Fat, Water/Salt & Macro Pie Chart */}
              <div className="hidden lg:block lg:col-span-4">{renderOilAndWaterPanel()}</div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 2: COOKING OIL, FAT, WATER & SALT GUIDE                       */}
          {/* ================================================================= */}
          {activeSubTab === 'oil_water' && (
            <div className="animate-in fade-in duration-300 max-w-4xl mx-auto">
              {renderOilAndWaterPanel()}
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 3: CLINICAL FOOD EXCHANGE TABLE & DETOX WATER PROTOCOL        */}
          {/* ================================================================= */}
          {activeSubTab === 'exchange_detox' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Detox Water & Hypoacidity Pre-Meal Shot Protocol */}
              {chart.detoxWaterProtocol && chart.detoxWaterProtocol.length > 0 && (
                <div
                  className={`p-5 md:p-7 rounded-3xl border ${
                    darkMode
                      ? 'bg-slate-900 border-slate-800'
                      : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="mb-4">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {isBn
                        ? 'সকাল, ভারী খাবারের পূর্বে (হাইপোঅ্যাসিডিটি) ও রাতের পানীয়'
                        : 'Targeted Digestive & Metabolic Infusions'}
                    </span>
                    <h3 className="text-xl md:text-2xl font-bold serif italic mt-0.5">
                      {isBn
                        ? 'ডিটক্স ওয়াটার ও হাইপোঅ্যাসিডিটি ডাইজেস্টিভ শট প্রোটোকল'
                        : 'Detox Water & Pre-Meal Hypoacidity Shot Protocol'}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {chart.detoxWaterProtocol.map((dw, i) => (
                      <div
                        key={i}
                        className={`p-4 md:p-5 rounded-2xl border flex flex-col justify-between gap-3 ${
                          dw.isHypoaciditySpecific
                            ? darkMode
                              ? 'bg-amber-950/25 border-amber-800/60'
                              : 'bg-amber-50/80 border-amber-200'
                            : darkMode
                            ? 'bg-slate-800/50 border-slate-700'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                            {dw.timing}
                          </div>
                          <h4 className="font-bold text-sm md:text-base leading-snug">{dw.name}</h4>
                          <div className="mt-2.5 text-xs space-y-1 opacity-85">
                            <div className="font-semibold">
                              {isBn ? 'উপকরণ:' : 'Ingredients:'}{' '}
                              <span className="font-normal">{dw.ingredients?.join(', ')}</span>
                            </div>
                            <div className="font-semibold pt-1">
                              {isBn ? 'প্রস্তুত প্রণালী:' : 'Preparation:'}{' '}
                              <span className="font-normal">{dw.preparation}</span>
                            </div>
                          </div>
                        </div>
                        <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 text-xs italic opacity-80">
                          {dw.clinicalBenefit}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clinical Food Exchange Table */}
              {chart.foodExchangeTable && chart.foodExchangeTable.length > 0 && (
                <div
                  className={`p-5 md:p-7 rounded-3xl border ${
                    darkMode
                      ? 'bg-slate-900 border-slate-800'
                      : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="mb-4">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {isBn ? 'খাবারের বৈচিত্র্য ও বিকল্প তালিকা' : 'Clinical Dietary Substitutions'}
                    </span>
                    <h3 className="text-xl md:text-2xl font-bold serif italic mt-0.5">
                      {isBn
                        ? 'ক্লিনিক্যাল ফুড এক্সচেঞ্জ টেবিল (কোন খাবারের পরিবর্তে কোন খাবার খাবেন)'
                        : 'Clinical Traffic Light Food Exchange Table'}
                    </h3>
                  </div>

                  {/* Mobile Card View + Desktop Table View */}
                  <div className="grid grid-cols-1 gap-3 md:hidden">
                    {chart.foodExchangeTable.map((row, i) => (
                      <div
                        key={i}
                        className={`p-4 rounded-2xl border space-y-2 ${
                          darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between border-b pb-2 border-slate-200/60 dark:border-slate-700">
                          <span className="font-bold text-sm">{row.primaryFood}</span>
                          <span className="text-xs font-mono opacity-70">{row.primaryPortion}</span>
                        </div>
                        <div className="text-xs">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                            🟢 {isBn ? 'গ্রিন বিকল্প:' : 'Green Substitutes:'}
                          </span>
                          <span>{row.greenSubstitutes?.join(' · ')}</span>
                        </div>
                        <div className="text-xs">
                          <span className="font-bold text-amber-600 dark:text-amber-400 block">
                            🟡 {isBn ? 'ইয়েলো বিকল্প:' : 'Yellow Substitutes:'}
                          </span>
                          <span>{row.yellowSubstitutes?.join(' · ')}</span>
                        </div>
                        <p className="text-[11px] opacity-75 italic pt-1">{row.clinicalNote}</p>
                      </div>
                    ))}
                  </div>

                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr
                          className={`border-b ${
                            darkMode
                              ? 'border-slate-800 text-slate-400'
                              : 'border-slate-200 text-slate-600'
                          }`}
                        >
                          <th className="py-3 pr-4 font-bold">
                            {isBn ? 'মূল খাবার ও পরিমাণ' : 'Primary Food & Portion'}
                          </th>
                          <th className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                            {isBn ? '🟢 গ্রিন জোন বিকল্প (সেরা এক্সচেঞ্জ)' : '🟢 Green Zone Substitutes'}
                          </th>
                          <th className="py-3 px-4 font-bold text-amber-600 dark:text-amber-400">
                            {isBn ? '🟡 ইয়েলো জোন বিকল্প (পরিমিত)' : '🟡 Yellow Zone Substitutes'}
                          </th>
                          <th className="py-3 pl-4 font-bold">
                            {isBn ? 'ক্লিনিক্যাল নির্দেশিকা' : 'Clinical Guidance'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800">
                        {chart.foodExchangeTable.map((row, i) => (
                          <tr key={i} className="align-top">
                            <td className="py-3.5 pr-4">
                              <div className="font-bold">{row.primaryFood}</div>
                              <div className="text-xs opacity-60 font-mono tabular-nums mt-0.5">
                                {row.primaryPortion} · {row.category}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <ul className="space-y-1">
                                {row.greenSubstitutes?.map((sub, idx) => (
                                  <li key={idx} className="font-medium">
                                    • {sub}
                                  </li>
                                ))}
                              </ul>
                            </td>
                            <td className="py-3.5 px-4">
                              <ul className="space-y-1 opacity-85">
                                {row.yellowSubstitutes?.map((sub, idx) => (
                                  <li key={idx}>• {sub}</li>
                                ))}
                              </ul>
                            </td>
                            <td className="py-3.5 pl-4 text-xs opacity-80 leading-relaxed">
                              {row.clinicalNote}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 4: CLINICAL SUPPLEMENTATION PROTOCOL                          */}
          {/* ================================================================= */}
          {activeSubTab === 'supplements' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Medical Notice & Drug-Food Guardian */}
              {(chart.medicalSafetyNote ||
                (chart.drugFoodInteractions && chart.drugFoodInteractions.length > 0)) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {chart.medicalSafetyNote && (
                    <div
                      className={`p-5 rounded-3xl border ${
                        darkMode
                          ? 'bg-red-950/20 border-red-900/50 text-red-300'
                          : 'bg-red-50/80 border-red-200 text-red-900'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl">⚠️</span>
                        <div>
                          <h3 className="font-bold text-xs uppercase tracking-wider mb-1">
                            {t.medical_notice}
                          </h3>
                          <p className="text-xs md:text-sm font-medium leading-relaxed">
                            {chart.medicalSafetyNote}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {chart.drugFoodInteractions && chart.drugFoodInteractions.length > 0 && (
                    <div
                      className={`p-5 rounded-3xl border ${
                        darkMode
                          ? 'bg-slate-900 border-amber-900/50'
                          : 'bg-amber-50/80 border-amber-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2.5">
                        <span className="text-lg">💊</span>
                        <h3
                          className={`font-bold text-sm ${
                            darkMode ? 'text-amber-400' : 'text-amber-800'
                          }`}
                        >
                          {t.med_guardian_title}
                        </h3>
                      </div>
                      <div className="space-y-2">
                        {chart.drugFoodInteractions.map((warn, i) => (
                          <div
                            key={i}
                            className={`p-3 rounded-xl border text-xs ${
                              darkMode
                                ? 'bg-slate-800 border-slate-700 text-slate-200'
                                : 'bg-white border-slate-200 text-slate-700'
                            }`}
                          >
                            <strong className="mr-1">
                              [{warn.severity}] {warn.medication} + {warn.foodInteraction}:
                            </strong>
                            {warn.guidance}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div
                className={`p-5 md:p-7 rounded-3xl border ${
                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <div className="mb-4">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {isBn
                      ? 'রোগীর কন্ডিশন ও ওষুধ অনুযায়ী ক্লিনিক্যাল সাপ্লিমেন্টেশন'
                      : 'Condition & Medication-Aligned Nutraceuticals'}
                  </span>
                  <h3 className="text-xl md:text-2xl font-bold italic serif mt-0.5">
                    {isBn
                      ? 'সাপ্লিমেন্টেশন প্রোটোকল (Supplementation Protocol)'
                      : t.aggressive_supp}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {chart.supplements?.map((supp, i) => (
                    <div
                      key={i}
                      className={`p-5 rounded-2xl border flex flex-col justify-between gap-3 ${
                        darkMode
                          ? 'bg-slate-800/50 border-slate-700'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-1.5">
                          <div>
                            <h4 className="font-bold text-sm md:text-base text-emerald-600 dark:text-emerald-400">
                              {supp.name}
                            </h4>
                            <div className="text-xs font-semibold opacity-75 mt-0.5">
                              {supp.dosage} {supp.timing ? `· ${supp.timing}` : ''}
                            </div>
                          </div>
                          <span className="text-lg">💊</span>
                        </div>
                        <p className="text-xs opacity-80 leading-relaxed mt-2">{supp.rationale}</p>
                        {supp.medicationSynergy && (
                          <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-2 font-medium">
                            ⚕️ {supp.medicationSynergy}
                          </p>
                        )}
                      </div>
                      <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700 text-[11px] opacity-60">
                        {supp.phaseRole} {supp.tags?.length ? `· ${supp.tags.join(' · ')}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 5: ANIMATED EXERCISE & MOVEMENT PROTOCOL                      */}
          {/* ================================================================= */}
          {activeSubTab === 'exercise' && (
            <div
              className={`p-5 md:p-7 rounded-3xl border animate-in fade-in duration-300 ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="mb-5">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {isBn ? 'অ্যানিমেটেড ফিজিক্যাল মুভমেন্ট গাইড' : 'Animated Movement Prescription'}
                </span>
                <h3 className="font-bold mt-0.5 text-xl md:text-2xl serif italic">
                  {isBn ? 'এক্সারসাইজ ও মুভমেন্ট প্রোটোকল' : t.movement_plan_title}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {chart.activities?.map((act, i) => (
                  <div
                    key={i}
                    className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 ${
                      darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center border ${
                          darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                        }`}
                      >
                        <ExerciseAnimation type={act.type} cue={act.visualCue} color="#10b981" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm md:text-base leading-snug">{act.name}</h4>
                        <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums block mt-0.5">
                          {act.duration}
                        </span>
                        {act.frequency && (
                          <span className="text-[11px] font-semibold opacity-60 block">
                            {act.frequency}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs opacity-85 leading-relaxed">{act.instructions}</p>
                      {act.clinicalReason && (
                        <p className="text-[11px] italic text-emerald-600 dark:text-emerald-400 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                          ✓ {act.clinicalReason}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 6: LIFESTYLE TIPS, FORBIDDEN FOODS & SMART BAZAAR             */}
          {/* ================================================================= */}
          {activeSubTab === 'lifestyle' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Lifestyle & Habits Card */}
                {chart.recommendations && chart.recommendations.length > 0 && (
                  <div
                    className={`p-6 rounded-3xl border ${
                      darkMode
                        ? 'bg-indigo-950/15 border-indigo-900/30'
                        : 'bg-indigo-50/60 border-indigo-200'
                    }`}
                  >
                    <h3
                      className={`font-bold mb-4 text-xl serif italic ${
                        darkMode ? 'text-indigo-400' : 'text-indigo-900'
                      }`}
                    >
                      {t.lifestyle_title}
                    </h3>
                    <ul className="space-y-3">
                      {chart.recommendations.map((rec, i) => (
                        <li key={i} className="flex gap-3 items-start text-xs md:text-sm leading-relaxed">
                          <span className="font-bold text-indigo-500">0{i + 1}.</span>
                          <span className={darkMode ? 'text-slate-300' : 'text-slate-700'}>
                            {rec}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Red Zone Forbidden Foods Card */}
                <div
                  className={`p-6 rounded-3xl border ${
                    darkMode
                      ? 'bg-red-950/15 border-red-900/30 text-red-300'
                      : 'bg-red-50/70 border-red-200 text-red-900'
                  }`}
                >
                  <h3 className="font-bold mb-4 text-xl serif italic">
                    🔴 {isBn ? 'রেড জোন — সম্পূর্ণ বর্জনীয় খাবার' : t.foods_avoid}
                  </h3>
                  <ul className="space-y-2.5">
                    {chart.forbiddenFoods?.map((f, i) => (
                      <li key={i} className="flex gap-2.5 items-center text-xs md:text-sm font-bold">
                        <span className="text-red-500">✕</span> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <SmartBazaar
                profile={profile}
                currentPhase={currentPhase}
                lang={lang}
                darkMode={darkMode}
              />
            </div>
          )}

          {/* ================================================================= */}
          {/* BOTTOM STEP-BY-STEP TAB NAVIGATION BAR                            */}
          {/* ================================================================= */}
          <div
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
              {currentTabIndex > 0 ? (
                <button
                  type="button"
                  onClick={() => handleSubTabChange(SUB_TABS[currentTabIndex - 1].id)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold border ${
                    darkMode
                      ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  ← {isBn ? 'পূর্ববর্তী ট্যাব' : 'Previous Tab'}
                </button>
              ) : onOpenTrafficLightGuide ? (
                <button
                  type="button"
                  onClick={onOpenTrafficLightGuide}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold border ${
                    darkMode
                      ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  ← {isBn ? 'ট্রাফিক লাইট গাইড' : 'Traffic Light Guide'}
                </button>
              ) : null}

              <span className="text-xs opacity-60 font-mono">
                {isBn
                  ? `ট্যাব ${currentTabIndex + 1} / ${SUB_TABS.length}`
                  : `Section ${currentTabIndex + 1} of ${SUB_TABS.length}`}
              </span>
            </div>

            {currentTabIndex < SUB_TABS.length - 1 ? (
              <button
                type="button"
                onClick={() => handleSubTabChange(SUB_TABS[currentTabIndex + 1].id)}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-7 py-3 rounded-xl font-bold text-xs md:text-sm tracking-wide transition-all shadow-md active:scale-95 whitespace-nowrap"
              >
                {isBn
                  ? `পরবর্তী: ${SUB_TABS[currentTabIndex + 1].labelBn} →`
                  : `Next: ${SUB_TABS[currentTabIndex + 1].labelEn} →`}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNextWeek}
                className="w-full sm:w-auto bg-slate-900 text-white dark:bg-emerald-600 px-8 py-3 rounded-xl font-bold text-xs md:text-sm tracking-wide hover:scale-105 transition-transform shadow-md flex items-center justify-center gap-2"
              >
                <span>
                  {t.complete_week} {currentWeek}
                </span>
                {!user?.isPro && currentWeek >= 1 && <span className="text-sm">🔒</span>}
                <span>→</span>
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default DietView;
