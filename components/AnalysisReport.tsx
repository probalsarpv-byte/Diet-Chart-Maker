import React, { useState, useEffect } from 'react';
import { HealthProfile, Language, TrafficLightGuide, TrafficLightFoodItem, FoodCategory } from '../types';
import { translations } from '../i18n';
import { GeminiService } from '../services/geminiService';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import PregnancyMilestonesDashboard from './PregnancyMilestonesDashboard';
import ChildDevelopmentMilestones from './ChildDevelopmentMilestones';

interface Props {
  profile: HealthProfile;
  lang: Language;
  darkMode?: boolean;
  initialStep?: 'report' | 'traffic_light';
  onProceed: (customizedProfile?: HealthProfile) => void;
}

const CATEGORIES: FoodCategory[] = [
  'Proteins',
  'Vegetables & Greens',
  'Grains & Carbs',
  'Healthy Fats & Seeds',
  'Fruits & Snacks',
];

const CATEGORY_SHORT_BN: Record<FoodCategory, string> = {
  'Proteins': '🐟 প্রোটিন (মাছ/ডিম/ডাল)',
  'Vegetables & Greens': '🥬 শাকসবজি ও লাউ/পেঁপে',
  'Grains & Carbs': '🌾 শর্করা (লাল ভাত/মাখনা)',
  'Healthy Fats & Seeds': '🥥 ফ্যাট, ঘি, তেল ও সিডস',
  'Fruits & Snacks': '🍏 ফলমূল ও নাস্তা',
};

const CATEGORY_SHORT_EN: Record<FoodCategory, string> = {
  'Proteins': '🐟 Proteins',
  'Vegetables & Greens': '🥬 Vegetables & Greens',
  'Grains & Carbs': '🌾 Grains & Carbs',
  'Healthy Fats & Seeds': '🥥 Fats, Oil & Seeds',
  'Fruits & Snacks': '🍏 Fruits & Snacks',
};

const CATEGORY_LABELS_BN: Record<FoodCategory, string> = {
  'Proteins': 'প্রোটিন (মাছ, ডিম, দেশি মুরগি ও ডাল)',
  'Vegetables & Greens': 'শাকসবজি ও রাতের সবজি শর্করা (লাউ, পেঁপে, শাক)',
  'Grains & Carbs': 'শর্করা ও শস্য (লাল ভাত, মাখনা, ওটস)',
  'Healthy Fats & Seeds': 'স্বাস্থ্যকর ফ্যাট, ঘি, তেল ও সিডস (চিয়া, তিসি, বাদাম)',
  'Fruits & Snacks': 'ফলমূল ও হালকা নাস্তা',
};

const AnalysisReport: React.FC<Props> = ({
  profile,
  lang,
  darkMode,
  initialStep = 'report',
  onProceed,
}) => {
  const t = translations[lang];
  const isBn = lang === 'bn';
  const [screenStep, setScreenStep] = useState<'report' | 'traffic_light'>(initialStep);
  const [mobileChartTab, setMobileChartTab] = useState<'dosha' | 'markers'>('dosha');
  const [activeCategoryTab, setActiveCategoryTab] = useState<FoodCategory>('Proteins');

  const analysis = profile.analysis || {
    doshaBreakdown: { vata: 33, pitta: 34, kapha: 33 },
    microbiomeStatus: 'Diverse & Healthy',
    metabolicEfficiency: 'Flexible',
    inflammatoryStatus: 'Minimal',
    psychologicalProfile: 'Balanced',
    alkalineScore: 7.35,
    healthSummary: 'Clinical baseline established.',
    dietImpact: 'Ready for personalized nutrition.',
  };

  const gemini = new GeminiService();
  const defaultGuide: TrafficLightGuide =
    profile.trafficLightGuide || gemini.getDefaultTrafficLightGuide(profile);

  const [selectedFoods, setSelectedFoods] = useState<string[]>(() => {
    if (profile.selectedFoods && profile.selectedFoods.length > 0) {
      return profile.selectedFoods;
    }
    return defaultGuide.items
      .filter((i) => i.zone === 'green' || i.zone === 'yellow')
      .map((i) => i.id);
  });

  const [mealFrequency, setMealFrequency] = useState<3 | 4>(
    profile.mealFrequency || defaultGuide.recommendedMealFrequency
  );

  const [dinnerCarbRule, setDinnerCarbRule] = useState<
    'vegetable_carbs' | 'cereal_allowed' | 'no_carbs'
  >(profile.dinnerCarbRule || defaultGuide.recommendedDinnerCarbRule);

  const [hasHypoacidity, setHasHypoacidity] = useState<boolean>(
    profile.hasHypoacidity !== undefined ? profile.hasHypoacidity : defaultGuide.hasHypoacidity
  );

  const [activeZoneFilter, setActiveZoneFilter] = useState<'all' | 'green' | 'yellow' | 'red'>('all');

  useEffect(() => {
    setScreenStep(initialStep);
  }, [initialStep]);

  useEffect(() => {
    if (!profile.selectedFoods) {
      setSelectedFoods(
        defaultGuide.items
          .filter((i) => i.zone === 'green' || i.zone === 'yellow')
          .map((i) => i.id)
      );
    }
  }, [profile]);

  const toggleFoodSelection = (item: TrafficLightFoodItem) => {
    if (item.zone === 'red') return;
    setSelectedFoods((prev) =>
      prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]
    );
  };

  const goToStep = (next: 'report' | 'traffic_light') => {
    setScreenStep(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const doshaData = [
    { name: 'Vata', value: analysis.doshaBreakdown.vata, color: '#3b82f6' },
    { name: 'Pitta', value: analysis.doshaBreakdown.pitta, color: '#ef4444' },
    { name: 'Kapha', value: analysis.doshaBreakdown.kapha, color: '#10b981' },
  ];

  const markerData = [
    { name: 'Microbiome', value: profile.microbiomeScore },
    { name: 'Metabolic', value: 100 - profile.inflammatoryIndex * 10 },
    { name: 'Alkaline', value: Math.min(100, Math.max(0, (analysis.alkalineScore - 6) * 100)) },
  ];

  // --- Clinical Calculations ---
  const heightM = (profile.height || 165) / 100;
  const bmi = ((profile.weight || 65) / (heightM * heightM)).toFixed(1);

  const minWeight = (18.5 * heightM * heightM).toFixed(1);
  const maxWeight = (24.9 * heightM * heightM).toFixed(1);
  const standardWeightRange = `${minWeight} - ${maxWeight} kg`;

  let bmr =
    10 * (profile.weight || 65) + 6.25 * (profile.height || 165) - 5 * (profile.age || 35);
  bmr += profile.gender === 'Male' ? 5 : -161;
  bmr = Math.round(bmr);

  const tdee = Math.round(bmr * 1.375);
  const phase1TargetCal = bmr + 100;

  const mealSplitPreview =
    mealFrequency === 3
      ? [
          {
            slot: isBn ? 'সকাল (প্রোটিন + সবজি + সিড)' : 'Breakfast (Protein + Greens + Seeds)',
            kcal: Math.round(phase1TargetCal * 0.32),
            pct: '32%',
          },
          {
            slot: isBn ? 'দুপুর (শর্করা + প্রোটিন + সবজি)' : 'Lunch (Carb + Protein + Veggies)',
            kcal: Math.round(phase1TargetCal * 0.42),
            pct: '42%',
          },
          {
            slot: isBn
              ? dinnerCarbRule === 'vegetable_carbs'
                ? 'রাত (প্রোটিন + সবজি শর্করা: লাউ/পেঁপে)'
                : 'রাত (প্রোটিন + সবজি + পরিমিত শস্য)'
              : dinnerCarbRule === 'vegetable_carbs'
              ? 'Dinner (Protein + Boiled Lau/Pepe Carb)'
              : 'Dinner (Protein + Greens + Controlled Carb)',
            kcal:
              phase1TargetCal -
              Math.round(phase1TargetCal * 0.32) -
              Math.round(phase1TargetCal * 0.42),
            pct: '26%',
          },
        ]
      : [
          {
            slot: isBn ? 'সকাল (প্রোটিন + সবজি + সিড)' : 'Breakfast (Protein + Greens + Seeds)',
            kcal: Math.round(phase1TargetCal * 0.26),
            pct: '26%',
          },
          {
            slot: isBn ? 'দুপুর (শর্করা + প্রোটিন + সবজি)' : 'Lunch (Carb + Protein + Veggies)',
            kcal: Math.round(phase1TargetCal * 0.36),
            pct: '36%',
          },
          {
            slot: isBn ? 'বিকেল (মাখনা / বাদাম / পেয়ারা)' : 'Evening (Makhana / Nuts / Guava)',
            kcal: Math.round(phase1TargetCal * 0.13),
            pct: '13%',
          },
          {
            slot: isBn
              ? dinnerCarbRule === 'vegetable_carbs'
                ? 'রাত (প্রোটিন + সবজি শর্করা: লাউ/পেঁপে)'
                : 'রাত (প্রোটিন + সবজি + পরিমিত শস্য)'
              : dinnerCarbRule === 'vegetable_carbs'
              ? 'Dinner (Protein + Boiled Lau/Pepe Carb)'
              : 'Dinner (Protein + Greens + Controlled Carb)',
            kcal:
              phase1TargetCal -
              Math.round(phase1TargetCal * 0.26) -
              Math.round(phase1TargetCal * 0.36) -
              Math.round(phase1TargetCal * 0.13),
            pct: '25%',
          },
        ];

  const handleConfirmAndGenerate = () => {
    const customizedProfile: HealthProfile = {
      ...profile,
      trafficLightGuide: defaultGuide,
      selectedFoods,
      mealFrequency,
      dinnerCarbRule,
      hasHypoacidity,
    };
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onProceed(customizedProfile);
  };

  const currentCatIndex = CATEGORIES.indexOf(activeCategoryTab);
  const filteredCategoryItems = defaultGuide.items.filter(
    (item) =>
      item.category === activeCategoryTab &&
      (activeZoneFilter === 'all' || item.zone === activeZoneFilter)
  );

  return (
    <div className="max-w-7xl mx-auto space-y-5 md:space-y-6 animate-in fade-in duration-500 pb-24 md:pb-12">
      {/* Top Step Progress Header (Desktop & Mobile) */}
      <div
        className={`p-3.5 md:p-5 rounded-2xl md:rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => goToStep('report')}
            className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              screenStep === 'report'
                ? 'bg-emerald-600 text-white shadow-sm'
                : darkMode
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>01.</span>
            <span>{isBn ? 'ক্লিনিক্যাল রিপোর্ট' : 'Clinical Report'}</span>
          </button>

          <span className="text-slate-400 font-bold">→</span>

          <button
            type="button"
            onClick={() => goToStep('traffic_light')}
            className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              screenStep === 'traffic_light'
                ? 'bg-emerald-600 text-white shadow-sm'
                : darkMode
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>02.</span>
            <span>{isBn ? 'ট্রাফিক লাইট ফুড গাইড' : 'Traffic Light Food Guide'}</span>
          </button>
        </div>

        <div className="hidden md:flex items-center gap-3 text-xs font-mono tabular-nums">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
            {isBn ? `দৈনিক লক্ষ্য: ${phase1TargetCal} kcal` : `Daily Target: ${phase1TargetCal} kcal`}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
            {isBn ? `${selectedFoods.length}টি খাবার নির্বাচিত` : `${selectedFoods.length} Foods Selected`}
          </span>
        </div>
      </div>

      {/* =================================================================== */}
      {/* SCREEN 1: CLINICAL REPORT (SINGLE-SCREEN DESKTOP & MOBILE VIEW)     */}
      {/* =================================================================== */}
      {screenStep === 'report' && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Desktop 12-Col Split / Mobile Compact Single-Screen Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Left Column: Biometric & Clinical Baseline (5 cols on Desktop) */}
            <div
              className={`lg:col-span-5 p-5 md:p-7 rounded-3xl border flex flex-col justify-between gap-4 ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {isBn ? 'স্ক্রিন ১/২ · বায়োমেট্রিক রিপোর্ট' : 'Screen 1/2 · Biometric Synthesis'}
                  </span>
                  <span className="text-xs font-mono font-bold opacity-60 tabular-nums">
                    {profile.dosha}
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold serif italic mb-4">
                  {t.clinical_synthesis}
                </h2>

                {/* 2x2 Compact Metric Grid */}
                <div className="grid grid-cols-2 gap-3 tabular-nums">
                  <div
                    className={`p-3.5 rounded-2xl border ${
                      darkMode ? 'bg-slate-800/70 border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-[11px] font-semibold opacity-60 block">{t.metric_bmi}</span>
                    <span
                      className={`text-xl md:text-2xl font-bold ${
                        parseFloat(bmi) > 25 ? 'text-amber-500' : 'text-emerald-500'
                      }`}
                    >
                      {bmi}
                    </span>
                  </div>
                  <div
                    className={`p-3.5 rounded-2xl border ${
                      darkMode ? 'bg-slate-800/70 border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-[11px] font-semibold opacity-60 block">
                      {t.metric_std_weight}
                    </span>
                    <span className="text-base md:text-lg font-bold">{standardWeightRange}</span>
                  </div>
                  <div
                    className={`p-3.5 rounded-2xl border ${
                      darkMode ? 'bg-slate-800/70 border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-[11px] font-semibold opacity-60 block">{t.metric_bmr}</span>
                    <span className="text-xl md:text-2xl font-bold text-indigo-500">
                      {bmr} <span className="text-[10px]">{t.metric_kcal}</span>
                    </span>
                  </div>
                  <div
                    className={`p-3.5 rounded-2xl border ${
                      darkMode ? 'bg-slate-800/70 border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-[11px] font-semibold opacity-60 block">{t.metric_tdee}</span>
                    <span className="text-xl md:text-2xl font-bold text-blue-500">
                      {tdee} <span className="text-[10px]">{t.metric_kcal}</span>
                    </span>
                  </div>
                </div>

                {/* Condition & Diet Impact */}
                <div className="space-y-2.5 mt-4">
                  <div
                    className={`p-3.5 rounded-2xl border ${
                      darkMode ? 'bg-red-950/20 border-red-900/50' : 'bg-red-50/70 border-red-200'
                    }`}
                  >
                    <span className="text-[11px] font-bold text-red-600 dark:text-red-400 block">
                      {t.metric_condition}
                    </span>
                    <p
                      className={`text-xs md:text-sm font-semibold mt-0.5 ${
                        darkMode ? 'text-slate-200' : 'text-slate-800'
                      }`}
                    >
                      {profile.medicalConditions ||
                        (isBn ? 'মেটাবলিক ও গাট রিস্টোরেশন' : 'Metabolic & Gut Restoration')}
                    </p>
                  </div>
                  <div
                    className={`p-3.5 rounded-2xl border ${
                      darkMode
                        ? 'bg-amber-950/20 border-amber-900/50'
                        : 'bg-amber-50/70 border-amber-200'
                    }`}
                  >
                    <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 block">
                      {t.metric_diet_error}
                    </span>
                    <p
                      className={`text-xs md:text-sm font-semibold mt-0.5 line-clamp-2 ${
                        darkMode ? 'text-slate-200' : 'text-slate-800'
                      }`}
                    >
                      {analysis.dietImpact}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="opacity-70">
                  {isBn ? 'ফেজ ১ ক্যালোরি টার্গেট:' : 'Phase 1 Calorie Target:'}
                </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {phase1TargetCal} kcal / day (40% C · 30% P · 30% F)
                </span>
              </div>
            </div>

            {/* Right Column: Dosha & Biological Markers (7 cols on Desktop, Tabbed on Mobile) */}
            <div
              className={`lg:col-span-7 p-5 md:p-7 rounded-3xl border flex flex-col justify-between ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              {/* Mobile Toggle so mobile users don't scroll */}
              <div className="flex md:hidden p-1 rounded-xl bg-slate-100 dark:bg-slate-800 mb-4">
                <button
                  type="button"
                  onClick={() => setMobileChartTab('dosha')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    mobileChartTab === 'dosha'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {t.prakriti_const}
                </button>
                <button
                  type="button"
                  onClick={() => setMobileChartTab('markers')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    mobileChartTab === 'markers'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {t.bio_markers}
                </button>
              </div>

              {/* Desktop Side-by-Side / Mobile Tabbed Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center flex-1">
                {/* Prakriti Chart */}
                <div className={`${mobileChartTab === 'dosha' ? 'block' : 'hidden md:block'}`}>
                  <h3 className="text-base font-bold serif italic mb-2">{t.prakriti_const}</h3>
                  <div className="h-40 md:h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={doshaData}
                          innerRadius={45}
                          outerRadius={68}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {doshaData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-3 gap-2 tabular-nums mt-2">
                    {doshaData.map((d) => (
                      <div
                        key={d.name}
                        className={`p-2 rounded-xl text-center ${
                          darkMode ? 'bg-slate-800/60' : 'bg-slate-50'
                        }`}
                      >
                        <div className="text-[11px] font-semibold opacity-60">{d.name}</div>
                        <div className="text-base font-bold" style={{ color: d.color }}>
                          {d.value}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Biological Markers */}
                <div className={`${mobileChartTab === 'markers' ? 'block' : 'hidden md:block'}`}>
                  <h3 className="text-base font-bold serif italic mb-2">{t.bio_markers}</h3>
                  <div className="h-40 md:h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={markerData} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis
                          dataKey="name"
                          type="category"
                          axisLine={false}
                          tickLine={false}
                          width={85}
                          style={{ fontWeight: 'bold', fontSize: '11px' }}
                        />
                        <Tooltip />
                        <Bar dataKey="value" fill="#10b981" radius={[0, 8, 8, 0]} barSize={22} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 text-xs tabular-nums mt-2">
                    <div className="flex justify-between items-center">
                      <span className="opacity-70">{t.inflam_status}:</span>
                      <span className="font-bold text-red-500">{analysis.inflammatoryStatus}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="opacity-70">{t.alkaline_score}:</span>
                      <span
                        className={`font-bold ${
                          analysis.alkalineScore > 7.3 ? 'text-blue-500' : 'text-red-500'
                        }`}
                      >
                        {analysis.alkalineScore}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="opacity-70">{t.microbiome_type}:</span>
                      <span className="font-bold text-emerald-500">{analysis.microbiomeStatus}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pregnancy Milestones Dashboard (Strictly visible ONLY for pregnancy_lactation) */}
              {profile.cohortType === 'pregnancy_lactation' && (
                <div className="mt-6">
                  <PregnancyMilestonesDashboard
                    currentPregnancyMonth={profile.pregnancyMonth || 1}
                    lang={lang}
                    darkMode={darkMode}
                  />
                </div>
              )}

              {/* Child Development Milestones & Catch-Up Engine (Strictly visible ONLY for child_pediatric) */}
              {profile.cohortType === 'child_pediatric' && (
                <div className="mt-6">
                  <ChildDevelopmentMilestones
                    childAgeGroup={profile.childAgeGroup || '1-3'}
                    childAgeYears={profile.age}
                    childWeightKg={profile.weight}
                    childHeightCm={profile.height}
                    lang={lang}
                    darkMode={darkMode}
                  />
                </div>
              )}

              {/* Next Screen Action Inside Report */}
              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs opacity-75">
                  {isBn
                    ? 'পরবর্তী স্ক্রিনে আপনার জন্য উপযুক্ত খাবার (ট্রাফিক লাইট গাইড) নির্বাচন করুন।'
                    : 'Proceed to the next screen to select your preferred foods from the Traffic Light Guide.'}
                </p>
                <button
                  type="button"
                  onClick={() => goToStep('traffic_light')}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-7 py-3.5 rounded-2xl font-bold text-xs md:text-sm tracking-wide transition-all shadow-lg active:scale-95 whitespace-nowrap"
                >
                  {isBn
                    ? 'পরবর্তী স্ক্রিন: ট্রাফিক লাইট ফুড গাইড →'
                    : 'Next Screen: Traffic Light Food Guide →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SCREEN 2: TRAFFIC LIGHT FOOD GUIDE & MEAL CONFIGURATION             */}
      {/* =================================================================== */}
      {screenStep === 'traffic_light' && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Top Compact Meal Protocol & Night Carb Bar */}
          <div
            className={`p-4 md:p-6 rounded-3xl border ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
              {/* 3 vs 4 Meals */}
              <div className="lg:col-span-4 space-y-2">
                <label className="block text-xs font-bold opacity-80">
                  {isBn
                    ? '১. খাবারের বেলা নির্বাচন (ক্যালোরি স্বয়ংক্রিয়ভাবে ভাগ হবে):'
                    : '1. Daily Meal Frequency:'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMealFrequency(3)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      mealFrequency === 3
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                        : darkMode
                        ? 'border-slate-800 bg-slate-800/50 text-slate-300'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="text-xs md:text-sm font-bold">
                      {isBn ? '৩ বেলা খাবার' : '3 Meals / Day'}
                    </div>
                    <div className="text-[10px] opacity-75 mt-0.5">
                      {isBn ? 'সকাল · দুপুর · রাত' : 'Breakfast · Lunch · Dinner'}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMealFrequency(4)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      mealFrequency === 4
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                        : darkMode
                        ? 'border-slate-800 bg-slate-800/50 text-slate-300'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="text-xs md:text-sm font-bold">
                      {isBn ? '৪ বেলা খাবার' : '4 Meals / Day'}
                    </div>
                    <div className="text-[10px] opacity-75 mt-0.5">
                      {isBn ? 'সকাল · দুপুর · বিকেল · রাত' : 'Includes Evening Snack'}
                    </div>
                  </button>
                </div>
              </div>

              {/* Night Carb Rule & Hypoacidity */}
              <div className="lg:col-span-4 space-y-2">
                <label className="block text-xs font-bold opacity-80">
                  {isBn ? '২. রাতের শর্করা ও হজম প্রোটোকল:' : '2. Night Carb & Digestive Rule:'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDinnerCarbRule('vegetable_carbs')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      dinnerCarbRule === 'vegetable_carbs'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                        : darkMode
                        ? 'border-slate-800 bg-slate-800/50 text-slate-300'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold">
                      {isBn ? 'রাতে সবজি শর্করা' : 'Night: Veg Carbs'}
                    </div>
                    <div className="text-[10px] opacity-75 mt-0.5">
                      {isBn ? 'লাউ/পেঁপে সিদ্ধ + প্রোটিন' : 'Boiled Gourd + Protein'}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDinnerCarbRule('cereal_allowed')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      dinnerCarbRule === 'cereal_allowed'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                        : darkMode
                        ? 'border-slate-800 bg-slate-800/50 text-slate-300'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold">
                      {isBn ? 'রাতে শস্য অনুমোদিত' : 'Night: Cereal Carb'}
                    </div>
                    <div className="text-[10px] opacity-75 mt-0.5">
                      {isBn ? '১টি লাল রুটি/ভাত + প্রোটিন' : '1 Red Roti + Protein'}
                    </div>
                  </button>
                </div>
              </div>

              {/* Calorie Split Summary Badges */}
              <div className="lg:col-span-4">
                <div
                  className={`p-3 rounded-2xl border space-y-1.5 tabular-nums ${
                    darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {isBn
                        ? `${mealFrequency} বেলায় ${phase1TargetCal} kcal বণ্টন`
                        : `${mealFrequency}-Meal Split (${phase1TargetCal} kcal)`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setHasHypoacidity(!hasHypoacidity)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        hasHypoacidity
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300'
                          : 'opacity-60'
                      }`}
                    >
                      {hasHypoacidity
                        ? isBn
                          ? '✓ হাইপোঅ্যাসিডিটি শট'
                          : '✓ Hypoacidity Shot'
                        : isBn
                        ? '+ হাইপোঅ্যাসিডিটি শট'
                        : '+ Hypoacidity Shot'}
                    </button>
                  </div>
                  {mealSplitPreview.map((m, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-[11px] border-t pt-1 border-slate-200/60 dark:border-slate-700/60"
                    >
                      <span className="truncate pr-2 opacity-85">{m.slot}</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                        {m.kcal} kcal
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Traffic Light Interactive Card with Category Tabs (Zero Long Scrolling!) */}
          <div
            className={`p-4 md:p-7 rounded-3xl border ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            {/* Header & Zone Filter */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-lg md:text-2xl font-bold serif italic">
                  {isBn
                    ? '🚦 ট্রাফিক লাইট ফুড গাইড (পছন্দের খাবার মার্ক করুন)'
                    : '🚦 Traffic Light Food Guide (Mark Your Foods)'}
                </h2>
                <p className="text-xs opacity-75 mt-0.5">
                  {isBn
                    ? '🟢 গ্রিন জোন = নিয়মিত খাবেন · 🟡 ইয়েলো জোন = পরিমিত খাবেন · 🔴 রেড জোন = সম্পূর্ণ নিষিদ্ধ'
                    : '🟢 Green = Optimal · 🟡 Yellow = Moderate · 🔴 Red = Strictly Forbidden'}
                </p>
              </div>

              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-x-auto scrollbar-hide">
                <button
                  type="button"
                  onClick={() => setActiveZoneFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                    activeZoneFilter === 'all'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {isBn ? 'সব' : 'All'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveZoneFilter('green')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                    activeZoneFilter === 'green'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  🟢 {isBn ? 'গ্রিন' : 'Green'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveZoneFilter('yellow')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                    activeZoneFilter === 'yellow'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  🟡 {isBn ? 'ইয়েলো' : 'Yellow'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveZoneFilter('red')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                    activeZoneFilter === 'red'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  🔴 {isBn ? 'রেড' : 'Red'}
                </button>
              </div>
            </div>

            {/* Category Tabs (Replaces long vertical stacking of 5 categories) */}
            <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide border-b border-slate-200/70 dark:border-slate-800">
              {CATEGORIES.map((cat) => {
                const countInCat = defaultGuide.items.filter(
                  (i) => i.category === cat && selectedFoods.includes(i.id)
                ).length;
                const isActive = activeCategoryTab === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategoryTab(cat)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : darkMode
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{isBn ? CATEGORY_SHORT_BN[cat] : CATEGORY_SHORT_EN[cat]}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                        isActive ? 'bg-white/20 text-white' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {countInCat}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Category Title */}
            <div className="flex items-center justify-between mt-4 mb-3">
              <h3 className="text-sm md:text-base font-bold text-emerald-600 dark:text-emerald-400">
                {isBn ? CATEGORY_LABELS_BN[activeCategoryTab] : activeCategoryTab}
              </h3>
              <span className="text-xs opacity-60">
                {isBn ? 'খাবারে ক্লিক করে টিক (✓) দিন বা বাদ দিন' : 'Tap to toggle food inclusion'}
              </span>
            </div>

            {/* Food Grid for the Active Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredCategoryItems.map((item) => {
                const isSelected = selectedFoods.includes(item.id);
                const isRed = item.zone === 'red';
                const isGreen = item.zone === 'green';

                return (
                  <div
                    key={item.id}
                    onClick={() => toggleFoodSelection(item)}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2 ${
                      isRed
                        ? darkMode
                          ? 'bg-red-950/15 border-red-900/40 opacity-75 cursor-not-allowed'
                          : 'bg-red-50/50 border-red-200 opacity-80 cursor-not-allowed'
                        : isSelected
                        ? isGreen
                          ? darkMode
                            ? 'bg-emerald-950/30 border-emerald-500 cursor-pointer'
                            : 'bg-emerald-50/80 border-emerald-500 cursor-pointer shadow-sm'
                          : darkMode
                          ? 'bg-amber-950/30 border-amber-500 cursor-pointer'
                          : 'bg-amber-50/80 border-amber-500 cursor-pointer shadow-sm'
                        : darkMode
                        ? 'bg-slate-800/40 border-slate-700 opacity-60 hover:opacity-100 cursor-pointer'
                        : 'bg-slate-50 border-slate-200 opacity-65 hover:opacity-100 cursor-pointer'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-xs md:text-sm leading-snug">
                          {isBn ? item.nameBn : item.nameEn}
                        </span>
                        {isRed ? (
                          <span className="text-[11px] font-bold text-red-600 dark:text-red-400 shrink-0">
                            {isBn ? 'নিষিদ্ধ ✕' : 'Avoid ✕'}
                          </span>
                        ) : (
                          <span
                            className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold shrink-0 border ${
                              isSelected
                                ? isGreen
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'bg-amber-500 border-amber-500 text-white'
                                : 'border-slate-400'
                            }`}
                          >
                            {isSelected ? '✓' : ''}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] opacity-75 mt-1 leading-relaxed">
                        {isBn ? item.clinicalReasonBn : item.clinicalReasonEn}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] opacity-60 pt-1.5 border-t border-slate-200/50 dark:border-slate-700/50 tabular-nums">
                      <span>
                        {item.zone === 'green'
                          ? isBn
                            ? '🟢 গ্রিন জোন'
                            : '🟢 Green Zone'
                          : item.zone === 'yellow'
                          ? isBn
                            ? '🟡 ইয়েলো জোন'
                            : '🟡 Yellow Zone'
                          : isBn
                          ? '🔴 রেড জোন'
                          : '🔴 Red Zone'}
                      </span>
                      <span>~{item.caloriesPer100g} kcal/100g</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Category Stepper & Final Generate Action Bar */}
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                <button
                  type="button"
                  onClick={() => goToStep('report')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold border ${
                    darkMode
                      ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  ← {isBn ? 'রিপোর্ট' : 'Report'}
                </button>

                {currentCatIndex < CATEGORIES.length - 1 && (
                  <button
                    type="button"
                    onClick={() => setActiveCategoryTab(CATEGORIES[currentCatIndex + 1])}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold border ${
                      darkMode
                        ? 'border-emerald-700 text-emerald-400 hover:bg-emerald-950/40'
                        : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    {isBn ? 'পরবর্তী ক্যাটাগরি →' : 'Next Category →'}
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleConfirmAndGenerate}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3.5 rounded-2xl font-bold text-xs md:text-sm tracking-wide transition-all shadow-lg active:scale-95 whitespace-nowrap"
              >
                {isBn
                  ? `পরবর্তী স্ক্রিন: ফেজ ও ডায়েট চার্ট দেখুন (${selectedFoods.length}টি খাবার) →`
                  : `Next Screen: View Phase & Diet Chart (${selectedFoods.length} foods) →`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisReport;
