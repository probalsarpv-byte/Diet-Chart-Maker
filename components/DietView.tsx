import React, { useState, useEffect } from 'react';
import { HealthProfile, DietPhaseChart, Phase, AssessmentData, Language, User, WeatherData } from '../types';
import { GeminiService } from '../services/geminiService';
import { WeatherService } from '../services/weatherService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { translations } from '../i18n';
import SmartBazaar from './SmartBazaar';
import { AlertTriangle, ShieldCheck, Sparkles, CheckCircle2, ClipboardCheck, Lock, Crown } from 'lucide-react';
import PregnancyMilestonesDashboard from './PregnancyMilestonesDashboard';
import ChildDevelopmentMilestones from './ChildDevelopmentMilestones';
import PhaseTransitionModal from './PhaseTransitionModal';
import {
  getUserGeminiAccount,
  subscribeUserGeminiAccount,
  MakerCheckerEngine,
} from '../services/aiModeService';

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
  initialSubTab?: DietSubTab;
  onOpenTrafficLightGuide?: () => void;
}

export type DietSubTab =
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
  initialSubTab = 'meals',
  onOpenTrafficLightGuide,
}) => {
  const t = translations[lang];
  const isBn = lang === 'bn';
  const isPremiumUser = Boolean(user?.isPro || user?.isSubscribed || user?.isAdmin);
  const [chart, setChart] = useState<DietPhaseChart | null>(initialChart);
  const [loading, setLoading] = useState(!initialChart);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<DietSubTab>(initialSubTab);
  const [geminiAccount, setGeminiAccount] = useState(getUserGeminiAccount);
  const [showVerificationDetails, setShowVerificationDetails] = useState(false);
  const [pendingTargetPhase, setPendingTargetPhase] = useState<Phase | null>(null);

  const unlockedPhases: Phase[] = profile.unlockedPhases?.length
    ? profile.unlockedPhases
    : [Phase.DETOX];

  useEffect(() => {
    setActiveSubTab(initialSubTab);
  }, [initialSubTab]);

  const gemini = new GeminiService();
  const weatherService = new WeatherService();

  useEffect(() => {
    return subscribeUserGeminiAccount((cfg) => {
      setGeminiAccount(cfg);
      setChart((prev) =>
        prev
          ? {
              ...prev,
              verification: MakerCheckerEngine.buildVerificationStamp(profile),
            }
          : prev
      );
    });
  }, [profile]);

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
    week: number = 1,
    phaseOverride?: Phase
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
      const activePhaseToLoad = phaseOverride || currentPhase;
      const result = await gemini.analyzeHealthAndPhase(
        customProfile,
        activePhaseToLoad,
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
      fetchChart(profile, undefined, 1, currentPhase);
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
    onWeekComplete();
    if (nextWeek <= 3) {
      setCurrentWeek(nextWeek);
      fetchChart(profile, undefined, nextWeek);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentPhase < 4) {
      const nextPhase = Math.min(currentPhase + 1, 4) as Phase;
      setPendingTargetPhase(nextPhase);
    }
  };

  const handlePhaseClick = (p: number) => {
    if (p === currentPhase) return;
    const target = p as Phase;
    if (target === Phase.DETOX || unlockedPhases.includes(target)) {
      onPhaseChange(target);
      return;
    }
    setPendingTargetPhase(target);
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

  // Helper to render any locked/covered output section for non-premium users
  const renderCoveredPremiumSection = (
    titleBn: string,
    titleEn: string,
    descBn: string,
    descEn: string,
    children: React.ReactNode,
    secondaryAction?: { labelBn: string; labelEn: string; onClick: () => void }
  ) => {
    if (isPremiumUser) {
      return <>{children}</>;
    }
    return (
      <div className="relative rounded-3xl overflow-hidden border border-amber-500/30 dark:border-amber-500/30">
        <div
          aria-hidden="true"
          className="blur-[6px] select-none pointer-events-none opacity-50 transition-all"
        >
          {children}
        </div>
        <div
          className={` inset-0 absolute z-10 flex flex-col items-center justify-center p-5 text-center backdrop-blur-[2px] ${
            darkMode
              ? 'bg-gradient-to-b from-slate-950/65 via-slate-900/85 to-slate-950/95'
              : 'bg-gradient-to-b from-white/65 via-white/88 to-amber-50/95'
          }`}
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/25 mb-2.5">
            <Lock className="w-5 h-5" />
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 mb-1.5">
            {isBn ? '🔒 প্রিমিয়াম কন্টেন্ট ঢাকা রয়েছে' : '🔒 Covered for Free Users'}
          </span>
          <h4 className="font-extrabold text-sm md:text-base max-w-md">
            {isBn ? titleBn : titleEn}
          </h4>
          <p className="text-xs opacity-80 max-w-md mt-1 leading-relaxed">
            {isBn ? descBn : descEn}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-3.5">
            <button
              type="button"
              onClick={onShowPaywall}
              className="px-4 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Crown className="w-4 h-4" />
              <span>
                {isBn ? 'প্রিমিয়াম আনলক করুন' : 'Unlock with Premium'}
              </span>
            </button>
            {secondaryAction && (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {isBn ? secondaryAction.labelBn : secondaryAction.labelEn}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Reusable Oil, Fat & Water Summary Sidebar/Panel (Partially shown for non-premium users)
  const renderOilAndWaterPanel = () => {
    if (!chart) return null;
    return (
      <div className="space-y-5">
        {/* Cooking Oil, Ghee & Fat Allocation Card (Visible Part) */}
        {chart.fatOilAllocation && (
          <div
            className={`p-5 md:p-6 rounded-3xl border ${
              darkMode
                ? 'bg-slate-900 border-amber-900/40'
                : 'bg-amber-50/40 border-amber-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                {isBn ? 'রান্নার তেল, ঘি ও ফ্যাট বণ্টন' : 'Lipid & Cooking Oil Protocol'}
              </span>
              {!isPremiumUser && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  {isBn ? 'আংশিক প্রিভিউ' : 'Partial Preview'}
                </span>
              )}
            </div>
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

              {isPremiumUser && (
                <>
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
                </>
              )}
            </div>
          </div>
        )}

        {/* Remaining Oil, Salt, Water & Macro Distribution (Covered for non-premium users) */}
        {renderCoveredPremiumSection(
          'পানি, লবণ ও ম্যাক্রো বণ্টনের বিস্তারিত গাইড প্রিমিয়াম ইউজারদের জন্য ঢাকা রয়েছে',
          'Full Water, Salt & Macro Distribution Protocol is Reserved for Premium Users',
          'তেলের ক্লিনিক্যাল নির্দেশিকা, দৈনিক পিংক সল্ট ও পানির সুনির্দিষ্ট মাত্রা এবং ম্যাক্রো চার্ট সম্পূর্ণ দেখতে প্রিমিয়াম মেম্বারশিপ নিন।',
          'Upgrade to Premium to view full cooking oil clinical instructions, quantitative salt/water prescription, and macro breakdown.',
          <div className="space-y-5">
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
        )}
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
          {[1, 2, 3, 4].map((p) => {
            const isUnlocked = p === 1 || unlockedPhases.includes(p as Phase);
            const evalRec = profile.phaseEvaluations?.[p];
            return (
              <button
                key={p}
                type="button"
                onClick={() => handlePhaseClick(p)}
                className={`px-4 py-2 rounded-xl font-bold text-xs md:text-sm transition-all relative whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  currentPhase === p
                    ? darkMode
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-900 text-white shadow-sm'
                    : isUnlocked
                    ? darkMode
                      ? 'text-emerald-300 hover:text-white bg-emerald-950/60 border border-emerald-700/50'
                      : 'text-emerald-800 hover:text-slate-900 bg-emerald-50 border border-emerald-200'
                    : darkMode
                    ? 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
                    : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                }`}
              >
                <span>
                  {t.phase} {p}
                </span>
                {p > 1 && (
                  <span className="text-[10px]">
                    {isUnlocked ? (evalRec ? `✓ ${evalRec.scorePercent}%` : '✓') : '📋'}
                  </span>
                )}
              </button>
            );
          })}
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

      {/* Phase Transition Assessment Callout Banner */}
      <div
        className={`p-3.5 md:p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
          darkMode
            ? 'bg-gradient-to-r from-slate-900 via-emerald-950/40 to-teal-950/30 border-emerald-500/30'
            : 'bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-white border-emerald-200/80 shadow-xs'
        }`}
      >
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-extrabold">
              {currentPhase < 4
                ? isBn
                  ? `ফেজ ${currentPhase} শেষ হয়েছে? পরবর্তী ফেজ (ফেজ ${currentPhase + 1})-এ যেতে শারীরিক উন্নতি যাচাই করুন`
                  : `Finished Phase ${currentPhase}? Verify Improvement to Unlock Phase ${currentPhase + 1} Diet Chart`
                : isBn
                ? 'আপনি সর্বোচ্চ ফেজ ৪ (লংজেভিটি ও মেইনটেন্যান্স) ডায়েট চার্টে আছেন'
                : 'You have unlocked Phase 4 (Longevity & Cellular Optimization)'}
            </div>
            <p className="text-[11px] opacity-75">
              {profile.phaseEvaluations?.[currentPhase]
                ? isBn
                  ? `✓ পূর্ববর্তী অ্যাসেসমেন্টের আলোকে আপনার উন্নতির স্কোর: ${profile.phaseEvaluations[currentPhase].scorePercent}%`
                  : `✓ Verified Improvement Score from baseline assessment: ${profile.phaseEvaluations[currentPhase].scorePercent}%`
                : isBn
                ? 'পূর্বে করা অ্যাসেসমেন্ট ফর্মের আলোকে কয়েকটি প্রশ্নের উত্তর দিয়ে উন্নতি নিশ্চিত হলে পরবর্তী ফেজের ডায়েট চার্ট পাবেন।'
                : 'Answer follow-up questions based on your initial Assessment Form to unlock the next Phase Diet Chart.'}
            </p>
          </div>
        </div>

        {currentPhase < 4 && (
          <button
            type="button"
            onClick={() => setPendingTargetPhase((currentPhase + 1) as Phase)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold whitespace-nowrap shrink-0 shadow-md transition-all active:scale-95"
          >
            {isBn
              ? `📋 ফেজ ${currentPhase} ➔ ফেজ ${currentPhase + 1} মূল্যায়ন প্রশ্নোত্তর →`
              : `📋 Take Phase ${currentPhase} ➔ ${currentPhase + 1} Evaluation →`}
          </button>
        )}
      </div>

      {/* Phase Transition Clinical Evaluation Modal */}
      {pendingTargetPhase !== null && (
        <PhaseTransitionModal
          isOpen={true}
          fromPhase={currentPhase}
          targetPhase={pendingTargetPhase}
          profile={profile}
          lang={lang}
          darkMode={darkMode}
          onClose={() => setPendingTargetPhase(null)}
          onApprovedTransition={(approvedPhase, updatedProf) => {
            onUpdateProfile(updatedProf);
            setPendingTargetPhase(null);
            setCurrentWeek(1);
            onPhaseChange(approvedPhase);
            fetchChart(updatedProf, undefined, 1, approvedPhase);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-28 gap-4">
          <div className="w-14 h-14 border-4 border-slate-800 border-t-emerald-500 rounded-full animate-spin" />
          <p className="font-bold italic animate-pulse opacity-80 text-sm text-center px-4">
            {isBn
              ? 'ধাপ ১ (Maker): ডায়েট চার্ট তৈরি হচ্ছে → ধাপ ২ (Checker): অ্যাপের জেমিনি দ্বারা ক্লিনিক্যাল ভেরিফিকেশন সম্পন্ন হচ্ছে...'
              : 'Stage 1 (Maker): Drafting Diet Chart → Stage 2 (Checker): App Gemini Clinical Verification in progress...'}
          </p>
        </div>
      ) : chart ? (
        <div className="space-y-6">
          {/* Pregnancy Milestones Dashboard (Strictly visible ONLY for pregnancy_lactation cohort) */}
          {profile.cohortType === 'pregnancy_lactation' && (
            <PregnancyMilestonesDashboard
              currentPregnancyMonth={profile.pregnancyMonth || 1}
              lang={lang}
              darkMode={darkMode}
              onSyncPregnancyMonth={(newMonth) => {
                const updated: HealthProfile = { ...profile, pregnancyMonth: newMonth };
                onUpdateProfile(updated);
                fetchChart(updated, undefined, currentWeek);
              }}
            />
          )}

          {/* Child Development Milestones & Catch-Up Suggestion Engine (Strictly visible ONLY for child_pediatric cohort) */}
          {profile.cohortType === 'child_pediatric' && (
            <ChildDevelopmentMilestones
              childAgeGroup={profile.childAgeGroup || '1-3'}
              childAgeYears={profile.age}
              childWeightKg={profile.weight}
              childHeightCm={profile.height}
              lang={lang}
              darkMode={darkMode}
              onSyncAgeGroup={(newBracket) => {
                const updated: HealthProfile = { ...profile, childAgeGroup: newBracket };
                onUpdateProfile(updated);
              }}
            />
          )}

          {/* Clinical Safety Alerts Banner (Strict Zero Herbs, Papaya, BP, Neutropenia) */}
          {profile.cohortSafetyAlerts && profile.cohortSafetyAlerts.length > 0 && (
            <div className="space-y-3">
              {profile.cohortSafetyAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 md:p-5 rounded-3xl border shadow-sm flex items-start gap-3.5 transition-all ${
                    alert.severity === 'critical'
                      ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200'
                      : alert.severity === 'warning'
                      ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200'
                      : 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-950 dark:text-blue-200'
                  }`}
                >
                  <div
                    className={`p-2.5 rounded-2xl shrink-0 ${
                      alert.severity === 'critical'
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                        : 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                    }`}
                  >
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs sm:text-sm font-extrabold tracking-tight">
                      {isBn ? alert.titleBn : alert.titleEn}
                    </h4>
                    <p className="text-xs mt-1 leading-relaxed opacity-90">
                      {isBn ? alert.descriptionBn : alert.descriptionEn}
                    </p>
                    {alert.prohibitedFoods && alert.prohibitedFoods.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {alert.prohibitedFoods.map((f, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-xl bg-white/80 dark:bg-slate-800/80 text-[11px] font-bold border border-current opacity-85 shadow-xs"
                          >
                            ✕ {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

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
                {(() => {
                  const verification =
                    chart.verification || MakerCheckerEngine.buildVerificationStamp(profile);
                  return (
                    <div className="mt-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[11px] font-extrabold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          {isBn
                            ? 'মেকার-চেকার কমপ্লিট: অ্যাপের জেমিনি দ্বারা ভেরিফাইড'
                            : 'Maker-Checker Complete: Verified by App Gemini'}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          {geminiAccount.enabled
                            ? isBn
                              ? '• উৎস: আপনার Gemini অ্যাকাউন্ট'
                              : '• Source: Your Personal Gemini Account'
                            : isBn
                            ? '• উৎস: অ্যাপ প্রোফাইল ও ক্লিনিক্যাল চেকার'
                            : '• Source: App Profile & Clinical Checker'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowVerificationDetails((v) => !v)}
                          className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 underline hover:opacity-80"
                        >
                          {showVerificationDetails
                            ? isBn
                              ? 'চেকার রিপোর্ট লুকান'
                              : 'Hide Checker Report'
                            : isBn
                            ? 'চেকার রিপোর্ট দেখুন'
                            : 'View Checker Report'}
                        </button>
                      </div>
                      {showVerificationDetails && (
                        <div
                          className={`mt-2 p-3 rounded-2xl border text-[11px] space-y-1 ${
                            darkMode
                              ? 'bg-slate-800/70 border-slate-700 text-slate-300'
                              : 'bg-emerald-50/60 border-emerald-200/70 text-slate-700'
                          }`}
                        >
                          <div className="font-extrabold text-emerald-700 dark:text-emerald-400">
                            {isBn
                              ? `${verification.makerLabelBn} ➔ ${verification.checkerLabelBn}`
                              : `${verification.makerLabelEn} ➔ ${verification.checkerLabelEn}`}
                          </div>
                          <ul className="space-y-0.5 pt-1">
                            {(isBn ? verification.checksPassedBn : verification.checksPassedEn).map(
                              (chk, idx) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                  <span className="text-emerald-500 font-bold">✓</span>
                                  <span>{chk}</span>
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })()}
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

            {/* Free vs Premium Access Notice Strip */}
            {!isPremiumUser && (
              <div
                className={`mt-3 p-3.5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  darkMode
                    ? 'bg-amber-950/30 border-amber-500/30 text-amber-200'
                    : 'bg-amber-50/90 border-amber-200 text-amber-950'
                }`}
              >
                <div className="flex items-start sm:items-center gap-2.5 text-xs">
                  <Lock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 sm:mt-0" />
                  <span>
                    {isBn
                      ? 'ফ্রি ইউজার প্রিভিউ: আপনি প্রথম ২ দিনের ডায়েট চার্ট, ১টি সাপ্লিমেন্ট এবং অন্যান্য আউটপুটের আংশিক অংশ দেখতে পাচ্ছেন। বাকি ৫ দিনের চার্ট, সম্পূর্ণ সাপ্লিমেন্ট লিস্ট ও পূর্ণাঙ্গ প্রোটোকল প্রিমিয়াম ইউজারদের জন্য ঢাকা রয়েছে।'
                      : 'Free Preview Mode: Viewing first 2 days of Diet Chart, 1 supplement, and partial outputs. Remaining 5 days, full supplement list, and complete protocols are covered for Premium users.'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onShowPaywall}
                  className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-sm shrink-0 flex items-center gap-1.5"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>{isBn ? 'প্রিমিয়াম নিন' : 'Go Premium'}</span>
                </button>
              </div>
            )}
          </div>

          {/* ================================================================= */}
          {/* TAB 1: MEAL PLAN (ডায়েট চার্ট — ২ দিন ফ্রি, বাকি দিন প্রিমিয়াম)   */}
          {/* ================================================================= */}
          {activeSubTab === 'meals' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
              {/* Left 8 Cols on Desktop / Full Width on Mobile: Daily Meal Schedule */}
              <div className="lg:col-span-8 space-y-4">
                {/* BD FCT Traffic Light Selected Foods Summary Strip */}
                {(() => {
                  const fullGuide = gemini.getDefaultTrafficLightGuide(profile);
                  const guideItems = Array.isArray(fullGuide)
                    ? fullGuide
                    : fullGuide?.items || [];
                  const selectedSet = new Set(profile.selectedFoods || []);
                  const selectedItems = guideItems.filter(
                    (item) => selectedSet.has(item.id) && item.zone !== 'red'
                  );
                  const greenTotal = guideItems.filter((i) => i.zone === 'green').length;
                  const yellowTotal = guideItems.filter((i) => i.zone === 'yellow').length;
                  const redTotal = guideItems.filter((i) => i.zone === 'red').length;

                  return (
                    <div
                      className={`p-4 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        darkMode
                          ? 'bg-slate-900/90 border-emerald-500/30'
                          : 'bg-emerald-50/60 border-emerald-200/80 shadow-xs'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold">
                          <span className="text-emerald-700 dark:text-emerald-300">
                            🚦{' '}
                            {isBn
                              ? `বিডি ফুড কম্পোজিশন ট্রাফিক লাইট গাইড (${guideItems.length}টি খাবার)`
                              : `BD FCT Traffic Light Guide (${guideItems.length} Foods)`}
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono text-[11px]">
                            🟢 {greenTotal} · 🟡 {yellowTotal} · 🔴 {redTotal}
                          </span>
                          {selectedItems.length > 0 && (
                            <span className="px-2 py-0.5 rounded-lg bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-mono text-[11px]">
                              ✓ {isBn ? `নির্বাচিত: ${selectedItems.length}টি` : `Selected: ${selectedItems.length}`}
                            </span>
                          )}
                        </div>
                        {selectedItems.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {selectedItems.slice(0, 8).map((it) => (
                              <span
                                key={it.id}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  darkMode
                                    ? 'bg-slate-800 text-slate-200'
                                    : 'bg-white text-slate-700 border border-emerald-200/70'
                                }`}
                              >
                                {it.icon || '🥗'} {isBn ? it.nameBn : it.nameEn}
                              </span>
                            ))}
                            {selectedItems.length > 8 && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono opacity-70">
                                +{selectedItems.length - 8} {isBn ? 'টি আরও' : 'more'}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {onOpenTrafficLightGuide && (
                        <button
                          type="button"
                          onClick={onOpenTrafficLightGuide}
                          className="px-4 py-2 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs shrink-0 transition-all"
                        >
                          {isBn ? '🚦 খাবার পরিবর্তন করুন (৩৮১+ তালিকা)' : '🚦 Customize Foods (381+ List)'}
                        </button>
                      )}
                    </div>
                  );
                })()}

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
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-lg md:text-xl serif italic">
                          {isBn
                            ? `দৈনিক বাঙালি ডায়েট মেনু (${activeMealFreq} বেলা)`
                            : `${t.daily_schedule} (${activeMealFreq} Meals)`}
                        </h3>
                        {!isPremiumUser && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            {isBn ? '১ম ও ২য় দিন ফ্রি · ৩য়-৭ম দিন প্রিমিয়াম' : 'Days 1-2 Free · Days 3-7 Premium'}
                          </span>
                        )}
                      </div>
                      {chart.dinnerCarbStrategy && (
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                          {chart.dinnerCarbStrategy}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-hide">
                      {chart.weeklySchedule?.map((day, idx) => {
                        const isDayLocked = !isPremiumUser && idx >= 2;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setCurrentDayIndex(idx)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1 ${
                              currentDayIndex === idx
                                ? isDayLocked
                                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                                  : 'bg-emerald-600 text-white shadow-sm'
                                : isDayLocked
                                ? darkMode
                                  ? 'bg-slate-800/80 text-amber-400/90 border border-amber-500/30 hover:bg-slate-800'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                                : darkMode
                                ? 'bg-slate-800 text-slate-300 hover:text-white'
                                : 'bg-slate-100 text-slate-700 hover:text-slate-900'
                            }`}
                          >
                            {isDayLocked && <span className="text-[11px]">🔒</span>}
                            <span>{day.day}</span>
                            {!isPremiumUser && idx < 2 && (
                              <span
                                className={`text-[9px] px-1 rounded ${
                                  currentDayIndex === idx
                                    ? 'bg-white/20 text-white'
                                    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                }`}
                              >
                                {isBn ? 'ফ্রি' : 'Free'}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Meals for Selected Day (Unlocked for Day 1 & Day 2, Covered for Days 3–7 if not Premium) */}
                  <div className="p-4 md:p-6 space-y-4">
                    {!isPremiumUser && currentDayIndex >= 2 ? (
                      renderCoveredPremiumSection(
                        `${chart.weeklySchedule?.[currentDayIndex]?.day || '৩য়-৭ম দিন'}-এর সম্পূর্ণ ডায়েট চার্ট শুধুমাত্র প্রিমিয়াম ইউজারদের জন্য`,
                        `${chart.weeklySchedule?.[currentDayIndex]?.day || 'Days 3–7'} Diet Chart is Reserved for Premium Users`,
                        'ফ্রি ইউজাররা শুধুমাত্র ১ম ও ২য় দিনের ডায়েট চার্ট দেখতে পারবেন। ৩য় থেকে ৭ম দিনের সম্পূর্ণ ডায়েট চার্ট আনলক করতে প্রিমিয়াম মেম্বারশিপ নিন।',
                        'Free users can view the first 2 days of the Diet Chart. Upgrade to Premium to unlock Days 3 to 7.',
                        <div className="space-y-4">
                          {chart.weeklySchedule?.[currentDayIndex]?.meals?.map((meal, idx) => (
                            <div
                              key={idx}
                              className={`p-4 md:p-5 rounded-2xl border ${
                                darkMode
                                  ? 'bg-slate-800/40 border-slate-800'
                                  : 'bg-slate-50/70 border-slate-200/80'
                              }`}
                            >
                              <div className="flex justify-between text-xs font-bold text-emerald-600">
                                <span>{meal.time} · {meal.mealSlot}</span>
                                <span>{meal.quantity} · {meal.calories}</span>
                              </div>
                              <h4 className="font-bold text-base md:text-lg mt-2">{meal.mealName}</h4>
                              <p className="text-xs md:text-sm opacity-85 mt-1">{meal.description}</p>
                            </div>
                          ))}
                        </div>,
                        {
                          labelBn: '← ১ম ও ২য় দিনের ফ্রি চার্ট দেখুন',
                          labelEn: '← View Free Day 1 & Day 2 Chart',
                          onClick: () => setCurrentDayIndex(0),
                        }
                      )
                    ) : (
                      <>
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

                        {/* Covered Preview of Remaining Days (Days 3–7) for Free Users when viewing Day 1 or Day 2 */}
                        {!isPremiumUser &&
                          chart.weeklySchedule &&
                          chart.weeklySchedule.length > 2 && (
                            <div className="pt-2">
                              {renderCoveredPremiumSection(
                                '৩য় থেকে ৭ম দিনের ডায়েট চার্ট প্রিমিয়াম ইউজারদের জন্য ঢাকা রয়েছে',
                                'Days 3 to 7 Diet Chart is Covered for Premium Users',
                                'আপনি ১ম ও ২য় দিনের ডায়েট চার্ট দেখছেন। বাকি ৫ দিনের (৩য়–৭ম দিন) সম্পূর্ণ সাপ্তাহিক ডায়েট চার্ট দেখতে প্রিমিয়াম মেম্বারশিপ আনলক করুন।',
                                'You are viewing Day 1 & Day 2. Upgrade to Premium to unlock the remaining 5 days (Days 3–7) of your weekly Diet Chart.',
                                <div className="p-4 space-y-3">
                                  {chart.weeklySchedule.slice(2, 4).map((lockedDay, dIdx) => (
                                    <div
                                      key={dIdx}
                                      className={`p-4 rounded-2xl border ${
                                        darkMode
                                          ? 'bg-slate-800/50 border-slate-700'
                                          : 'bg-slate-50 border-slate-200'
                                      }`}
                                    >
                                      <div className="text-xs font-extrabold text-amber-500 mb-1">
                                        {lockedDay.day}
                                      </div>
                                      <div className="text-sm font-bold">
                                        {lockedDay.meals?.[0]?.mealName || 'Clinical Meal Plan'}
                                      </div>
                                      <p className="text-xs opacity-75 mt-0.5">
                                        {lockedDay.meals?.[0]?.description}
                                      </p>
                                    </div>
                                  ))}
                                </div>,
                                currentDayIndex === 0
                                  ? {
                                      labelBn: '২য় দিনের ফ্রি চার্ট দেখুন →',
                                      labelEn: 'View Free Day 2 Chart →',
                                      onClick: () => setCurrentDayIndex(1),
                                    }
                                  : {
                                      labelBn: '← ১ম দিনের ফ্রি চার্ট দেখুন',
                                      labelEn: '← View Free Day 1 Chart',
                                      onClick: () => setCurrentDayIndex(0),
                                    }
                              )}
                            </div>
                          )}
                      </>
                    )}
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
                      {isPremiumUser ? chart.staplesAdvice?.waterLitersPerDay || '2.5 L' : '🔒 প্রিমিয়াম'}
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
                      {isPremiumUser ? chart.staplesAdvice?.saltGramsPerDay || '5g' : '🔒 প্রিমিয়াম'}
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
              {/* Detox Water & Hypoacidity Pre-Meal Shot Protocol (1st shown, rest covered for non-premium) */}
              {chart.detoxWaterProtocol && chart.detoxWaterProtocol.length > 0 && (
                <div
                  className={`p-5 md:p-7 rounded-3xl border ${
                    darkMode
                      ? 'bg-slate-900 border-slate-800'
                      : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <div>
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
                    {!isPremiumUser && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        {isBn ? '১টি উন্মুক্ত · বাকিগুলো ঢাকা' : '1 Shown · Rest Covered'}
                      </span>
                    )}
                  </div>

                  {isPremiumUser ? (
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
                  ) : (
                    <div className="space-y-4">
                      {/* First Detox Water clearly visible */}
                      {chart.detoxWaterProtocol.slice(0, 1).map((dw, i) => (
                        <div
                          key={i}
                          className={`p-4 md:p-5 rounded-2xl border flex flex-col justify-between gap-3 ${
                            darkMode
                              ? 'bg-slate-800/50 border-emerald-500/30'
                              : 'bg-emerald-50/40 border-emerald-200'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                {dw.timing}
                              </span>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                {isBn ? 'ফ্রি প্রিভিউ' : 'Free Preview'}
                              </span>
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

                      {/* Remaining Detox Water protocols covered */}
                      {chart.detoxWaterProtocol.length > 1 &&
                        renderCoveredPremiumSection(
                          'বাকি ডিটক্স ওয়াটার ও ডাইজেস্টিভ শট প্রোটোকল প্রিমিয়াম ইউজারদের জন্য ঢাকা রয়েছে',
                          'Remaining Detox Water & Pre-Meal Digestive Shots are Covered for Premium Users',
                          'হাইপোঅ্যাসিডিটি শট ও রাতের মেটাবলিক ইনফিউশনসহ সম্পূর্ণ পানীয় প্রোটোকল দেখতে প্রিমিয়াম মেম্বারশিপ নিন।',
                          'Upgrade to Premium to unlock all targeted digestive shots and nighttime metabolic infusions.',
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                            {chart.detoxWaterProtocol.slice(1).map((dw, i) => (
                              <div
                                key={i}
                                className={`p-4 rounded-2xl border ${
                                  darkMode
                                    ? 'bg-slate-800/50 border-slate-700'
                                    : 'bg-slate-50 border-slate-200'
                                }`}
                              >
                                <div className="text-xs font-bold text-emerald-600 mb-1">
                                  {dw.timing}
                                </div>
                                <h4 className="font-bold text-sm">{dw.name}</h4>
                                <p className="text-xs opacity-80 mt-2">{dw.preparation}</p>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  )}
                </div>
              )}

              {/* Clinical Food Exchange Table (1st row shown, remaining rows covered for non-premium) */}
              {chart.foodExchangeTable && chart.foodExchangeTable.length > 0 && (
                <div
                  className={`p-5 md:p-7 rounded-3xl border ${
                    darkMode
                      ? 'bg-slate-900 border-slate-800'
                      : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <div>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {isBn ? 'খাবারের বৈচিত্র্য ও বিকল্প তালিকা' : 'Clinical Dietary Substitutions'}
                      </span>
                      <h3 className="text-xl md:text-2xl font-bold serif italic mt-0.5">
                        {isBn
                          ? 'ক্লিনিক্যাল ফুড এক্সচেঞ্জ টেবিল (কোন খাবারের পরিবর্তে কোন খাবার খাবেন)'
                          : 'Clinical Traffic Light Food Exchange Table'}
                      </h3>
                    </div>
                    {!isPremiumUser && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        {isBn ? 'আংশিক প্রিভিউ (১টি ক্যাটাগরি উন্মুক্ত)' : 'Partial Preview (1 Category Shown)'}
                      </span>
                    )}
                  </div>

                  {/* Visible Food Exchange Rows (All for Premium, First 1 for Free) */}
                  <div className="grid grid-cols-1 gap-3 md:hidden">
                    {(isPremiumUser
                      ? chart.foodExchangeTable
                      : chart.foodExchangeTable.slice(0, 1)
                    ).map((row, i) => (
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
                        {(isPremiumUser
                          ? chart.foodExchangeTable
                          : chart.foodExchangeTable.slice(0, 1)
                        ).map((row, i) => (
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

                  {/* Covered remaining Food Exchange rows for non-premium users */}
                  {!isPremiumUser && chart.foodExchangeTable.length > 1 && (
                    <div className="mt-4">
                      {renderCoveredPremiumSection(
                        'বাকি ফুড এক্সচেঞ্জ টেবিল প্রিমিয়াম ইউজারদের জন্য ঢাকা রয়েছে',
                        'Remaining Food Exchange Categories are Covered for Premium Users',
                        'মাছ, মাংস, ডাল, সবজি ও ফ্যাট সোর্সের সম্পূর্ণ বিকল্প তালিকা দেখতে প্রিমিয়াম মেম্বারশিপ আনলক করুন।',
                        'Unlock Premium to access the complete clinical food exchange substitutions across all food groups.',
                        <div className="p-4 space-y-3">
                          {chart.foodExchangeTable.slice(1).map((row, i) => (
                            <div
                              key={i}
                              className={`p-3.5 rounded-2xl border flex justify-between items-center ${
                                darkMode
                                  ? 'bg-slate-800/50 border-slate-700'
                                  : 'bg-slate-50 border-slate-200'
                              }`}
                            >
                              <div>
                                <div className="font-bold text-sm">{row.primaryFood}</div>
                                <div className="text-xs opacity-75">
                                  {row.greenSubstitutes?.join(' · ')}
                                </div>
                              </div>
                              <span className="text-xs font-mono">{row.primaryPortion}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 4: CLINICAL SUPPLEMENTATION PROTOCOL (১টি ফ্রি, বাকি ঢাকা)    */}
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
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">💊</span>
                          <h3
                            className={`font-bold text-sm ${
                              darkMode ? 'text-amber-400' : 'text-amber-800'
                            }`}
                          >
                            {t.med_guardian_title}
                          </h3>
                        </div>
                        {!isPremiumUser && chart.drugFoodInteractions.length > 1 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
                            {isBn ? 'আংশিক প্রিভিউ' : 'Partial Preview'}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {(isPremiumUser
                          ? chart.drugFoodInteractions
                          : chart.drugFoodInteractions.slice(0, 1)
                        ).map((warn, i) => (
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
                        {!isPremiumUser && chart.drugFoodInteractions.length > 1 && (
                          <button
                            type="button"
                            onClick={onShowPaywall}
                            className="w-full p-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-300 text-xs font-extrabold flex items-center justify-center gap-1.5"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>
                              {isBn
                                ? `+ আরও ${chart.drugFoodInteractions.length - 1}টি ওষুধ-খাবার ইন্টারেকশন আনলক করুন`
                                : `+ Unlock ${chart.drugFoodInteractions.length - 1} more Drug-Food Interactions`}
                            </span>
                          </button>
                        )}
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
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div>
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
                  {!isPremiumUser && (
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      {isBn
                        ? '১টি সাপ্লিমেন্ট উন্মুক্ত · বাকি তালিকা প্রিমিয়াম ইউজারদের জন্য ঢাকা'
                        : '1 Supplement Shown · Remaining List Covered for Premium'}
                    </span>
                  )}
                </div>

                {(() => {
                  const allSupps = chart.supplements && chart.supplements.length > 0 ? chart.supplements : [];
                  const firstSupp = allSupps[0];
                  const remainingSupps =
                    allSupps.length > 1
                      ? allSupps.slice(1)
                      : [
                          {
                            name: isBn ? 'ম্যাগনেসিয়াম গ্লাইসিনেট (Magnesium Glycinate)' : 'Magnesium Glycinate',
                            dosage: '400 mg',
                            timing: isBn ? 'রাতে ঘুমানোর ৩০ মিনিট আগে' : '30 mins before bedtime',
                            rationale: isBn
                              ? 'ইনসুলিন সেন্সিটিভিটি বৃদ্ধি, স্নায়বিক প্রশান্তি ও গভীর ঘুমের জন্য।'
                              : 'Supports cellular insulin sensitivity, nervous system calm, and restorative sleep.',
                            phaseRole: 'Metabolic & Cellular Repair',
                            tags: ['Sleep', 'Metabolic'],
                          },
                          {
                            name: isBn ? 'ওমেগা-৩ ইপিএ/ডিএইচএ (Omega-3 EPA/DHA)' : 'Omega-3 EPA/DHA',
                            dosage: '1000 mg',
                            timing: isBn ? 'দুপুরের খাবারের সাথে' : 'With Lunch',
                            rationale: isBn
                              ? 'সিস্টেমিক ইনফ্লামেশন ও ট্রাইগ্লিসারাইড কমাতে সহায়ক।'
                              : 'Reduces systemic inflammation and optimizes lipid profile.',
                            phaseRole: 'Anti-Inflammatory',
                            tags: ['Lipids', 'Heart'],
                          },
                        ];

                  if (isPremiumUser) {
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {allSupps.map((supp, i) => (
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
                    );
                  }

                  return (
                    <div className="space-y-5">
                      {/* 1st Supplement Visible for Everyone */}
                      {firstSupp && (
                        <div
                          className={`p-5 rounded-2xl border-2 flex flex-col justify-between gap-3 ${
                            darkMode
                              ? 'bg-slate-800/70 border-emerald-500/40'
                              : 'bg-emerald-50/50 border-emerald-300'
                          }`}
                        >
                          <div>
                            <div className="flex justify-between items-start gap-2 mb-1.5">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-600 text-white">
                                    {isBn ? 'ফ্রি সাপ্লিমেন্ট #১' : 'Free Supplement #1'}
                                  </span>
                                  <h4 className="font-bold text-sm md:text-base text-emerald-600 dark:text-emerald-400">
                                    {firstSupp.name}
                                  </h4>
                                </div>
                                <div className="text-xs font-semibold opacity-80 mt-1">
                                  {firstSupp.dosage} {firstSupp.timing ? `· ${firstSupp.timing}` : ''}
                                </div>
                              </div>
                              <span className="text-xl">💊</span>
                            </div>
                            <p className="text-xs opacity-85 leading-relaxed mt-2">
                              {firstSupp.rationale}
                            </p>
                            {firstSupp.medicationSynergy && (
                              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-2 font-medium">
                                ⚕️ {firstSupp.medicationSynergy}
                              </p>
                            )}
                          </div>
                          <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700 text-[11px] opacity-70">
                            {firstSupp.phaseRole}{' '}
                            {firstSupp.tags?.length ? `· ${firstSupp.tags.join(' · ')}` : ''}
                          </div>
                        </div>
                      )}

                      {/* Remaining Supplements Covered/Blurred */}
                      {renderCoveredPremiumSection(
                        `বাকি ${remainingSupps.length}টি সাপ্লিমেন্ট লিস্ট প্রিমিয়াম ইউজারদের জন্য ঢাকা রয়েছে`,
                        `Remaining ${remainingSupps.length} Supplements are Covered for Premium Users`,
                        'সাপ্লিমেন্ট লিস্ট প্রিমিয়াম ইউজারদের জন্য সংরক্ষিত। অন্যদের শুধুমাত্র ১টি সাপ্লিমেন্ট দেখানো হচ্ছে—বাকি সাপ্লিমেন্ট ও সঠিক ডোজ দেখতে প্রিমিয়াম মেম্বারশিপ নিন।',
                        'The full supplement protocol is exclusive to Premium members. Upgrade now to uncover all remaining supplements, dosages, and medication synergies.',
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                          {remainingSupps.map((supp, i) => (
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
                                <p className="text-xs opacity-80 leading-relaxed mt-2">
                                  {supp.rationale}
                                </p>
                              </div>
                              <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700 text-[11px] opacity-60">
                                {supp.phaseRole}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 5: ANIMATED EXERCISE & MOVEMENT PROTOCOL (আংশিক প্রিভিউ)      */}
          {/* ================================================================= */}
          {activeSubTab === 'exercise' && (
            <div
              className={`p-5 md:p-7 rounded-3xl border animate-in fade-in duration-300 ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
                <div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {isBn ? 'অ্যানিমেটেড ফিজিক্যাল মুভমেন্ট গাইড' : 'Animated Movement Prescription'}
                  </span>
                  <h3 className="font-bold mt-0.5 text-xl md:text-2xl serif italic">
                    {isBn ? 'এক্সারসাইজ ও মুভমেন্ট প্রোটোকল' : t.movement_plan_title}
                  </h3>
                </div>
                {!isPremiumUser && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    {isBn ? '১টি এক্সারসাইজ উন্মুক্ত · বাকিগুলো ঢাকা' : '1 Exercise Shown · Rest Covered'}
                  </span>
                )}
              </div>

              {isPremiumUser ? (
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
              ) : (
                <div className="space-y-5">
                  {chart.activities?.slice(0, 1).map((act, i) => (
                    <div
                      key={i}
                      className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 ${
                        darkMode
                          ? 'bg-slate-800/60 border-emerald-500/40'
                          : 'bg-emerald-50/40 border-emerald-200'
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
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-600 text-white inline-block mb-1">
                            {isBn ? 'ফ্রি প্রিভিউ #১' : 'Free Preview #1'}
                          </span>
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

                  {chart.activities && chart.activities.length > 1 &&
                    renderCoveredPremiumSection(
                      'বাকি এক্সারসাইজ ও মুভমেন্ট গাইড প্রিমিয়াম ইউজারদের জন্য ঢাকা রয়েছে',
                      'Remaining Exercise & Movement Protocols are Covered for Premium Users',
                      'আপনার শারীরিক কন্ডিশন অনুযায়ী সম্পূর্ণ মুভমেন্ট ও প্রাণায়াম প্রোটোকল দেখতে প্রিমিয়াম মেম্বারশিপ নিন।',
                      'Upgrade to Premium to view all personalized movement, yoga, and metabolic exercise prescriptions.',
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                        {chart.activities.slice(1).map((act, i) => (
                          <div
                            key={i}
                            className={`p-5 rounded-2xl border ${
                              darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <h4 className="font-bold text-sm">{act.name}</h4>
                            <span className="text-xs font-mono text-emerald-600 block mt-0.5">
                              {act.duration}
                            </span>
                            <p className="text-xs opacity-80 mt-2">{act.instructions}</p>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 6: LIFESTYLE TIPS, FORBIDDEN FOODS & SMART BAZAAR (আংশিক)    */}
          {/* ================================================================= */}
          {activeSubTab === 'lifestyle' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Lifestyle & Habits Card */}
                {chart.recommendations && chart.recommendations.length > 0 && (
                  <div
                    className={`p-6 rounded-3xl border flex flex-col justify-between gap-4 ${
                      darkMode
                        ? 'bg-indigo-950/15 border-indigo-900/30'
                        : 'bg-indigo-50/60 border-indigo-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <h3
                          className={`font-bold text-xl serif italic ${
                            darkMode ? 'text-indigo-400' : 'text-indigo-900'
                          }`}
                        >
                          {t.lifestyle_title}
                        </h3>
                        {!isPremiumUser && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                            {isBn ? 'আংশিক প্রিভিউ' : 'Partial Preview'}
                          </span>
                        )}
                      </div>
                      <ul className="space-y-3">
                        {(isPremiumUser
                          ? chart.recommendations
                          : chart.recommendations.slice(0, 1)
                        ).map((rec, i) => (
                          <li key={i} className="flex gap-3 items-start text-xs md:text-sm leading-relaxed">
                            <span className="font-bold text-indigo-500">0{i + 1}.</span>
                            <span className={darkMode ? 'text-slate-300' : 'text-slate-700'}>
                              {rec}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {!isPremiumUser && chart.recommendations.length > 1 &&
                      renderCoveredPremiumSection(
                        'বাকি লাইফস্টাইল ও সার্কাডিয়ান নির্দেশিকা ঢাকা রয়েছে',
                        'Remaining Lifestyle & Circadian Rules are Covered',
                        'সম্পূর্ণ লাইফস্টাইল ও ঘুমের রুটিন দেখতে প্রিমিয়াম মেম্বারশিপ নিন।',
                        'Upgrade to Premium to view all lifestyle and circadian rhythm guidelines.',
                        <ul className="space-y-2.5 p-4">
                          {chart.recommendations.slice(1).map((rec, i) => (
                            <li key={i} className="flex gap-3 items-start text-xs">
                              <span className="font-bold text-indigo-500">0{i + 2}.</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                  </div>
                )}

                {/* Red Zone Forbidden Foods Card */}
                <div
                  className={`p-6 rounded-3xl border flex flex-col justify-between gap-4 ${
                    darkMode
                      ? 'bg-red-950/15 border-red-900/30 text-red-300'
                      : 'bg-red-50/70 border-red-200 text-red-900'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <h3 className="font-bold text-xl serif italic">
                        🔴 {isBn ? 'রেড জোন — সম্পূর্ণ বর্জনীয় খাবার' : t.foods_avoid}
                      </h3>
                      {!isPremiumUser && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/15 text-red-600 dark:text-red-400">
                          {isBn ? 'আংশিক প্রিভিউ' : 'Partial Preview'}
                        </span>
                      )}
                    </div>
                    <ul className="space-y-2.5">
                      {(isPremiumUser
                        ? chart.forbiddenFoods || []
                        : (chart.forbiddenFoods || []).slice(0, 1)
                      ).map((f, i) => (
                        <li key={i} className="flex gap-2.5 items-center text-xs md:text-sm font-bold">
                          <span className="text-red-500">✕</span> {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {!isPremiumUser && (chart.forbiddenFoods?.length || 0) > 1 &&
                    renderCoveredPremiumSection(
                      'বাকি বর্জনীয় খাবারের তালিকা ঢাকা রয়েছে',
                      'Remaining Forbidden Foods List is Covered',
                      'আপনার রোগ অনুযায়ী সম্পূর্ণ নিষিদ্ধ খাবারের তালিকা দেখতে প্রিমিয়াম মেম্বারশিপ নিন।',
                      'Upgrade to Premium to view the complete list of restricted Red Zone foods.',
                      <ul className="space-y-2 p-4">
                        {(chart.forbiddenFoods || []).slice(1).map((f, i) => (
                          <li key={i} className="flex gap-2 items-center text-xs font-bold">
                            <span className="text-red-500">✕</span> {f}
                          </li>
                        ))}
                      </ul>
                    )}
                </div>
              </div>

              {renderCoveredPremiumSection(
                'স্মার্ট বাজার ও অর্গানিক শপিং গাইড প্রিমিয়াম ইউজারদের জন্য ঢাকা রয়েছে',
                'Smart Bazaar & Clinical Grocery List is Reserved for Premium Users',
                'আপনার ডায়েট চার্ট অনুযায়ী সাপ্তাহিক বাজারের তালিকা ও অর্গানিক সোর্সিং গাইড আনলক করতে প্রিমিয়াম মেম্বারশিপ নিন।',
                'Unlock your personalized weekly Smart Bazaar shopping list with a Premium subscription.',
                <SmartBazaar
                  profile={profile}
                  currentPhase={currentPhase}
                  lang={lang}
                  darkMode={darkMode}
                />
              )}
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

          {/* ================================================================= */}
          {/* FLOATING QUICK-SWITCH BAR (DIET CHART, SUPPLEMENTS, EXERCISE)     */}
          {/* ================================================================= */}
          <div className="fixed bottom-16 md:bottom-4 left-1/2 -translate-x-1/2 z-40 w-[96%] max-w-5xl pointer-events-none">
            <div
              className={`pointer-events-auto p-2.5 md:p-3 rounded-2xl border shadow-2xl backdrop-blur-xl flex flex-wrap items-center justify-between gap-2 ${
                darkMode
                  ? 'bg-slate-900/95 border-emerald-500/40 text-white'
                  : 'bg-white/95 border-emerald-500/40 text-slate-900'
              }`}
            >
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                {onOpenTrafficLightGuide && (
                  <button
                    type="button"
                    onClick={onOpenTrafficLightGuide}
                    className={`px-3 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all shrink-0 border ${
                      darkMode
                        ? 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700'
                        : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                    }`}
                  >
                    🚦 {isBn ? 'ফুড গাইড' : 'Food Guide'}
                  </button>
                )}
                {SUB_TABS.map((tab) => {
                  const isActive = activeSubTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleSubTabChange(tab.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all shrink-0 ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-md'
                          : darkMode
                          ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {isBn ? tab.labelBn : tab.labelEn}
                    </button>
                  );
                })}
              </div>

              {currentTabIndex < SUB_TABS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => handleSubTabChange(SUB_TABS[currentTabIndex + 1].id)}
                  className="px-4 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md whitespace-nowrap shrink-0"
                >
                  {isBn
                    ? `পরবর্তী: ${SUB_TABS[currentTabIndex + 1].labelBn} →`
                    : `Next: ${SUB_TABS[currentTabIndex + 1].labelEn} →`}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSubTabChange('meals')}
                  className="px-4 py-2 rounded-xl text-xs font-extrabold bg-slate-800 text-white whitespace-nowrap shrink-0"
                >
                  {isBn ? '🥗 ডায়েট চার্টে ফিরুন' : '🥗 Back to Diet Chart'}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default DietView;
