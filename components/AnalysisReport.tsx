import React, { useState, useEffect, useMemo } from 'react';
import { HealthProfile, Language, TrafficLightGuide, TrafficLightFoodItem, FoodCategory } from '../types';
import { translations } from '../i18n';
import { GeminiService } from '../services/geminiService';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import PregnancyMilestonesDashboard from './PregnancyMilestonesDashboard';
import ChildDevelopmentMilestones from './ChildDevelopmentMilestones';
import {
  BD_FCT_CATEGORIES,
  BD_FCT_NUTRIENTS,
  BD_FCT_RAW_FOODS,
  BD_FCT_SOURCE_LINE_BN,
  BD_FCT_SOURCE_LINE_EN,
  BdFctFoodRecord,
  fmtNutrient,
  getDefaultSelectedFoodIds,
  getExternalFunctionalProfile,
} from '../data/bdFoodCompositionDatabase';

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
  const defaultGuide: TrafficLightGuide = useMemo(() => {
    const freshGuide = gemini.getDefaultTrafficLightGuide(profile);
    if (profile.trafficLightGuide && profile.trafficLightGuide.items.length >= 100) {
      return profile.trafficLightGuide;
    }
    if (profile.trafficLightGuide && profile.trafficLightGuide.items.length > 0) {
      const existingIds = new Set(profile.trafficLightGuide.items.map((i) => i.id));
      return {
        ...freshGuide,
        items: [
          ...profile.trafficLightGuide.items,
          ...freshGuide.items.filter((i) => !existingIds.has(i.id)),
        ],
      };
    }
    return freshGuide;
  }, [profile]);

  const [selectedFoods, setSelectedFoods] = useState<string[]>(() => {
    if (profile.selectedFoods && profile.selectedFoods.length >= 8) {
      return profile.selectedFoods;
    }
    return getDefaultSelectedFoodIds(defaultGuide);
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
  const [activeSubCatFilter, setActiveSubCatFilter] = useState<string>('all');
  const [foodSearchQuery, setFoodSearchQuery] = useState<string>('');
  const [inspectingBdFood, setInspectingBdFood] = useState<{
    item: TrafficLightFoodItem;
    raw?: BdFctFoodRecord;
  } | null>(null);

  useEffect(() => {
    setScreenStep(initialStep);
  }, [initialStep]);

  useEffect(() => {
    if (!profile.selectedFoods || profile.selectedFoods.length < 8) {
      setSelectedFoods(getDefaultSelectedFoodIds(defaultGuide));
    }
  }, [profile, defaultGuide]);

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

  // Subcategories available inside the active clinical category
  const availableSubCats = useMemo(() => {
    return BD_FCT_CATEGORIES.filter(
      (c) => c.id !== 'all' && c.clinicalCategory === activeCategoryTab
    );
  }, [activeCategoryTab]);

  // Base items for active category (or across all categories if user is typing a search query)
  const categoryBaseItems = useMemo(() => {
    const q = foodSearchQuery.trim().toLowerCase();
    return defaultGuide.items.filter((item) => {
      if (!q && item.category !== activeCategoryTab) return false;
      if (activeSubCatFilter !== 'all' && item.bdSubCategory !== activeSubCatFilter) return false;
      if (q) {
        const hay = `${item.nameBn} ${item.nameEn} ${item.bdFctCode || ''} ${item.bdSubCategoryBn || ''} ${item.scientific || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [defaultGuide.items, activeCategoryTab, activeSubCatFilter, foodSearchQuery]);

  const greenCountInView = useMemo(
    () => categoryBaseItems.filter((i) => i.zone === 'green').length,
    [categoryBaseItems]
  );
  const yellowCountInView = useMemo(
    () => categoryBaseItems.filter((i) => i.zone === 'yellow').length,
    [categoryBaseItems]
  );
  const redCountInView = useMemo(
    () => categoryBaseItems.filter((i) => i.zone === 'red').length,
    [categoryBaseItems]
  );

  const filteredCategoryItems = useMemo(() => {
    return categoryBaseItems.filter(
      (item) => activeZoneFilter === 'all' || item.zone === activeZoneFilter
    );
  }, [categoryBaseItems, activeZoneFilter]);

  const handleSelectAllGreenInCategory = () => {
    const greenIds = categoryBaseItems.filter((i) => i.zone === 'green').map((i) => i.id);
    setSelectedFoods((prev) => Array.from(new Set([...prev, ...greenIds])));
  };

  const handleClearCategorySelection = () => {
    const catIds = new Set(categoryBaseItems.map((i) => i.id));
    setSelectedFoods((prev) => prev.filter((id) => !catIds.has(id)));
  };

  const handleOpenFoodDetail = (e: React.MouseEvent, item: TrafficLightFoodItem) => {
    e.stopPropagation();
    const raw = item.bdFctCode
      ? BD_FCT_RAW_FOODS.find((f) => f.code === item.bdFctCode)
      : undefined;
    setInspectingBdFood({ item, raw });
  };

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

          {/* Traffic Light Interactive Card with Category Tabs & Full 381+ BD FCT Foods */}
          <div
            className={`p-4 md:p-7 rounded-3xl border ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            {/* Header & Zone Filter with Live BD FCT Counts */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    {isBn
                      ? `বাংলাদেশ ফুড কম্পোজিশন টেবিল (BD FCT) • ${defaultGuide.items.length}টি খাবার`
                      : `Bangladesh Food Composition Table (BD FCT) • ${defaultGuide.items.length} Foods`}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                    {isBn
                      ? `${selectedFoods.length}টি খাবার আপনার ডায়েট চার্টে নির্বাচিত`
                      : `${selectedFoods.length} Foods Selected for Diet Chart`}
                  </span>
                </div>
                <h2 className="text-lg md:text-2xl font-bold serif italic">
                  {isBn
                    ? '🚦 ট্রাফিক লাইট ফুড গাইড (গ্রিন ও ইয়েলো জোন থেকে খাবার সিলেক্ট করুন)'
                    : '🚦 Traffic Light Food Guide (Select Your Green & Yellow Foods)'}
                </h2>
                <p className="text-xs opacity-75 mt-0.5">
                  {isBn
                    ? '🟢 গ্রিন জোন = অবাধে ও নিয়মিত খাবেন · 🟡 ইয়েলো জোন = পরিমিত খাবেন · 🔴 রেড জোন = সম্পূর্ণ নিষিদ্ধ'
                    : '🟢 Green = Optimal Daily Foods · 🟡 Yellow = Moderate Portion · 🔴 Red = Strictly Avoid'}
                </p>
              </div>

              <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-x-auto scrollbar-hide">
                <button
                  type="button"
                  onClick={() => setActiveZoneFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                    activeZoneFilter === 'all'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {isBn ? `সব (${categoryBaseItems.length})` : `All (${categoryBaseItems.length})`}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveZoneFilter('green')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                    activeZoneFilter === 'green'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  🟢 {isBn ? `গ্রিন (${greenCountInView})` : `Green (${greenCountInView})`}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveZoneFilter('yellow')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                    activeZoneFilter === 'yellow'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  🟡 {isBn ? `ইয়েলো (${yellowCountInView})` : `Yellow (${yellowCountInView})`}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveZoneFilter('red')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                    activeZoneFilter === 'red'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  🔴 {isBn ? `রেড (${redCountInView})` : `Red (${redCountInView})`}
                </button>
              </div>
            </div>

            {/* 5 Main Clinical Category Tabs */}
            <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide border-b border-slate-200/70 dark:border-slate-800">
              {CATEGORIES.map((cat) => {
                const totalInCat = defaultGuide.items.filter((i) => i.category === cat).length;
                const selectedInCat = defaultGuide.items.filter(
                  (i) => i.category === cat && selectedFoods.includes(i.id)
                ).length;
                const isActive = activeCategoryTab === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setActiveCategoryTab(cat);
                      setActiveSubCatFilter('all');
                    }}
                    className={`px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : darkMode
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{isBn ? CATEGORY_SHORT_BN[cat] : CATEGORY_SHORT_EN[cat]}</span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {selectedInCat}/{totalInCat}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* BD FCT Sub-Category Filter Pills + Instant Search + Bulk Select Toolbar */}
            <div className="py-3 space-y-3 border-b border-slate-200/70 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveSubCatFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                    activeSubCatFilter === 'all'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : darkMode
                      ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  ✨ {isBn ? 'এই বিভাগের সব খাবার' : 'All Sub-Groups'}
                </button>
                {availableSubCats.map((sub) => {
                  const subCount = defaultGuide.items.filter(
                    (i) => i.category === activeCategoryTab && i.bdSubCategory === sub.id
                  ).length;
                  const isSubActive = activeSubCatFilter === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setActiveSubCatFilter(sub.id)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                        isSubActive
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : darkMode
                          ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span>{sub.icon}</span>
                      <span>{isBn ? sub.nameBn : sub.nameEn}</span>
                      <span className="opacity-75 font-mono text-[10px]">({subCount})</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    value={foodSearchQuery}
                    onChange={(e) => setFoodSearchQuery(e.target.value)}
                    placeholder={
                      isBn
                        ? '🔎 বাংলা বা ইংরেজিতে খাবার খুঁজুন (যেমন: রুই, লাউ, মসুর, ডিম, পেয়ারা)...'
                        : '🔎 Search 381+ BD FCT foods (e.g., Rohu, Lau, Egg, Lentil, Guava)...'
                    }
                    className={`w-full px-3.5 py-2 rounded-xl text-xs border outline-none transition-all ${
                      darkMode
                        ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
                    }`}
                  />
                  {foodSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setFoodSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs opacity-60 hover:opacity-100"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Quick Bulk Selection Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllGreenInCategory}
                    className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors"
                  >
                    ✓ {isBn ? 'সব গ্রিন জোন মার্ক করুন' : 'Select All Green'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFoods(getDefaultSelectedFoodIds(defaultGuide))}
                    className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/25 transition-colors"
                  >
                    ↺ {isBn ? 'প্রস্তাবিত ডিফল্ট সিলেকশন' : 'Recommended Selection'}
                  </button>
                  <button
                    type="button"
                    onClick={handleClearCategorySelection}
                    className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
                  >
                    ✕ {isBn ? 'এই বিভাগ ক্লিয়ার' : 'Clear Category'}
                  </button>
                </div>
              </div>
            </div>

            {/* Active Category Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mt-4 mb-3">
              <h3 className="text-sm md:text-base font-bold text-emerald-600 dark:text-emerald-400">
                {foodSearchQuery
                  ? isBn
                    ? `🔎 "${foodSearchQuery}" অনুসন্ধানের ফলাফল (${filteredCategoryItems.length}টি খাবার)`
                    : `🔎 Search Results for "${foodSearchQuery}" (${filteredCategoryItems.length} foods)`
                  : isBn
                  ? `${CATEGORY_LABELS_BN[activeCategoryTab]} (${filteredCategoryItems.length}টি খাবার)`
                  : `${activeCategoryTab} (${filteredCategoryItems.length} foods)`}
              </h3>
              <span className="text-xs opacity-65">
                {isBn
                  ? 'খাবারে ক্লিক করে ডায়েট চার্টের জন্য টিক (✓) দিন বা বাদ দিন'
                  : 'Tap any Green or Yellow food card to include/exclude from your Diet Chart'}
              </span>
            </div>

            {/* Food Grid for the Active Category */}
            {filteredCategoryItems.length === 0 ? (
              <div className="py-12 text-center space-y-2 opacity-75">
                <div className="text-3xl">🔎</div>
                <div className="font-bold text-sm">
                  {isBn ? 'এই ফিল্টারে কোনো খাবার পাওয়া যায়নি' : 'No foods matched this filter'}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveZoneFilter('all');
                    setActiveSubCatFilter('all');
                    setFoodSearchQuery('');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white"
                >
                  {isBn ? 'সব খাবার দেখুন' : 'Reset Filters'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[640px] overflow-y-auto pr-1">
                {filteredCategoryItems.map((item) => {
                  const isSelected = selectedFoods.includes(item.id);
                  const isRed = item.zone === 'red';
                  const isGreen = item.zone === 'green';

                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleFoodSelection(item)}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 ${
                        isRed
                          ? darkMode
                            ? 'bg-red-950/15 border-red-900/40 opacity-80 cursor-not-allowed'
                            : 'bg-red-50/50 border-red-200 opacity-85 cursor-not-allowed'
                          : isSelected
                          ? isGreen
                            ? darkMode
                              ? 'bg-emerald-950/35 border-emerald-500 cursor-pointer shadow-sm'
                              : 'bg-emerald-50/90 border-emerald-500 cursor-pointer shadow-sm'
                            : darkMode
                            ? 'bg-amber-950/35 border-amber-500 cursor-pointer shadow-sm'
                            : 'bg-amber-50/90 border-amber-500 cursor-pointer shadow-sm'
                          : darkMode
                          ? 'bg-slate-800/40 border-slate-700/80 hover:border-slate-500 cursor-pointer'
                          : 'bg-slate-50/80 border-slate-200 hover:border-slate-400 cursor-pointer'
                      }`}
                    >
                      <div className="space-y-2">
                        {/* Top row: Icon, Category/Code tag, Checkbox */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <span className="text-xl shrink-0 mt-0.5">{item.icon || '🥗'}</span>
                            <div>
                              <span className="font-bold text-xs md:text-sm leading-snug block">
                                {isBn ? item.nameBn : item.nameEn}
                              </span>
                              <span className="text-[10px] opacity-65 block">
                                {isBn ? item.nameEn : item.nameBn}
                                {item.bdFctCode ? ` • BD FCT #${item.bdFctCode}` : ''}
                              </span>
                            </div>
                          </div>

                          {isRed ? (
                            <span className="px-2 py-0.5 rounded-md bg-red-500/15 text-[10px] font-bold text-red-600 dark:text-red-400 shrink-0">
                              {isBn ? 'নিষিদ্ধ ✕' : 'Avoid ✕'}
                            </span>
                          ) : (
                            <span
                              className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 border transition-transform ${
                                isSelected
                                  ? isGreen
                                    ? 'bg-emerald-600 border-emerald-600 text-white scale-105'
                                    : 'bg-amber-500 border-amber-500 text-white scale-105'
                                  : 'border-slate-400 dark:border-slate-600'
                              }`}
                            >
                              {isSelected ? '✓' : '+'}
                            </span>
                          )}
                        </div>

                        {/* BD FCT Per-100g Macro & Micro Strip */}
                        <div
                          className={`grid grid-cols-4 gap-1 p-2 rounded-xl text-center tabular-nums text-[10px] ${
                            darkMode ? 'bg-slate-900/70' : 'bg-white/90 border border-slate-200/60'
                          }`}
                        >
                          <div>
                            <b className="block text-xs font-mono text-emerald-600 dark:text-emerald-400">
                              {item.caloriesPer100g}
                            </b>
                            <span className="opacity-65">kcal</span>
                          </div>
                          <div>
                            <b className="block text-xs font-mono">
                              {item.proteinG !== undefined ? `${item.proteinG}g` : '—'}
                            </b>
                            <span className="opacity-65">{isBn ? 'প্রোটিন' : 'Prot'}</span>
                          </div>
                          <div>
                            <b className="block text-xs font-mono">
                              {item.carbsG !== undefined ? `${item.carbsG}g` : '—'}
                            </b>
                            <span className="opacity-65">{isBn ? 'কার্ব' : 'Carb'}</span>
                          </div>
                          <div>
                            <b className="block text-xs font-mono">
                              {item.fiberG !== undefined ? `${item.fiberG}g` : '—'}
                            </b>
                            <span className="opacity-65">{isBn ? 'ফাইবার' : 'Fibre'}</span>
                          </div>
                        </div>

                        {/* Functional V6 Badges */}
                        {item.functionalBadges && item.functionalBadges.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.functionalBadges.slice(0, 3).map((b, bIdx) => (
                              <span
                                key={bIdx}
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  darkMode
                                    ? 'bg-slate-800 text-slate-300 border border-slate-700'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200/80'
                                }`}
                              >
                                {b.icon} {b.label}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Clinical Reason */}
                        <p className="text-[11px] opacity-80 leading-relaxed">
                          {isBn ? item.clinicalReasonBn : item.clinicalReasonEn}
                        </p>
                      </div>

                      {/* Card Footer: Zone Label + BD FCT 26-Nutrient Popup Trigger */}
                      <div className="flex items-center justify-between text-[10px] pt-2 border-t border-slate-200/50 dark:border-slate-700/50 tabular-nums">
                        <span className="font-bold">
                          {item.zone === 'green'
                            ? isBn
                              ? '🟢 গ্রিন জোন (অবাধে)'
                              : '🟢 Green Zone'
                            : item.zone === 'yellow'
                            ? isBn
                              ? '🟡 ইয়েলো জোন (পরিমিত)'
                              : '🟡 Yellow Zone'
                            : isBn
                            ? '🔴 রেড জোন (বর্জনীয়)'
                            : '🔴 Red Zone'}
                        </span>

                        {item.bdFctCode ? (
                          <button
                            type="button"
                            onClick={(e) => handleOpenFoodDetail(e, item)}
                            className="px-2 py-0.5 rounded-md font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                          >
                            {isBn ? '🔬 পুষ্টিমান (BD FCT) ↗' : '🔬 BD FCT Info ↗'}
                          </button>
                        ) : (
                          <span className="opacity-60">100g edible</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

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
                    onClick={() => {
                      setActiveCategoryTab(CATEGORIES[currentCatIndex + 1]);
                      setActiveSubCatFilter('all');
                    }}
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

      {/* =================================================================== */}
      {/* MODAL: 26-NUTRIENT BD FCT & FUNCTIONAL V6 DETAIL POPUP              */}
      {/* =================================================================== */}
      {inspectingBdFood && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setInspectingBdFood(null)}
          />
          <div
            className={`relative w-full max-w-2xl max-h-[88vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden ${
              darkMode
                ? 'bg-slate-900 border-slate-700 text-white'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div
              className={`p-4 md:p-6 border-b flex items-center justify-between gap-3 ${
                darkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-2xl">
                  {inspectingBdFood.item.icon || '🥗'}
                </div>
                <div>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block">
                    {inspectingBdFood.item.bdSubCategoryBn} • BD FCT #{inspectingBdFood.item.bdFctCode}
                  </span>
                  <h3 className="text-lg md:text-xl font-bold leading-snug">
                    {isBn ? inspectingBdFood.item.nameBn : inspectingBdFood.item.nameEn}
                  </h3>
                  <p className="text-xs opacity-70">{inspectingBdFood.item.nameEn}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingBdFood(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white"
              >
                ✕ {isBn ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>

            <div className="p-5 md:p-6 overflow-y-auto space-y-5">
              {/* Clinical Reason Banner */}
              <div
                className={`p-4 rounded-2xl border ${
                  inspectingBdFood.item.zone === 'green'
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : inspectingBdFood.item.zone === 'yellow'
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                <div className="text-xs font-bold mb-1">
                  {inspectingBdFood.item.zone === 'green'
                    ? isBn
                      ? '🟢 গ্রিন জোন (আপনার জন্য আদর্শ পথ্য)'
                      : '🟢 Green Zone (Optimal for You)'
                    : inspectingBdFood.item.zone === 'yellow'
                    ? isBn
                      ? '🟡 ইয়েলো জোন (পরিমিত পোরশনে গ্রহণযোগ্য)'
                      : '🟡 Yellow Zone (Portion Controlled)'
                    : isBn
                    ? '🔴 রেড জোন (বর্জনীয়)'
                    : '🔴 Red Zone (Avoid)'}
                </div>
                <p className="text-xs leading-relaxed">
                  {isBn ? inspectingBdFood.item.clinicalReasonBn : inspectingBdFood.item.clinicalReasonEn}
                </p>
              </div>

              {/* 26 Official BD FCT Nutrients Table */}
              {inspectingBdFood.raw && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
                    {isBn
                      ? '📊 বাংলাদেশ ফুড কম্পোজিশন টেবিল (প্রতি ১০০ গ্রাম ভক্ষণযোগ্য অংশ)'
                      : '📊 Bangladesh Food Composition Table (Per 100g Edible Portion)'}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {BD_FCT_NUTRIENTS.map(([key, labelBn, labelEn, unit, icon]) => (
                      <div
                        key={key}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs tabular-nums ${
                          darkMode ? 'bg-slate-800/70 border-slate-700' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <span className="opacity-80 truncate pr-1">
                          {icon} {isBn ? labelBn : labelEn}
                        </span>
                        <b className="font-mono text-emerald-600 dark:text-emerald-400 shrink-0">
                          {fmtNutrient(inspectingBdFood.raw?.[key], 1, isBn)} {unit}
                        </b>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Functional Nutrition V6 Evidence Layer */}
              {inspectingBdFood.raw && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">
                    {isBn
                      ? '🧬 ফাংশনাল নিউট্রিশন এভিডেন্স লেয়ার (GI, FODMAP, Gluten, Purine, Oxalate)'
                      : '🧬 Functional Nutrition V6 Evidence Layer'}
                  </h4>
                  {(() => {
                    const ext = getExternalFunctionalProfile(inspectingBdFood.raw!);
                    const rows = [
                      ['📈', 'Glycemic Index (GI)', ext.gi.status, ext.gi.note],
                      ['🫘', 'FODMAP (Gut)', ext.fodmap.status, ext.fodmap.note],
                      ['🌾', 'Gluten Status', ext.gluten.status, ext.gluten.note],
                      ['🌙', 'Nightshade', ext.nightshade.status, ext.nightshade.note],
                      ['🧬', 'Purine (Uric Acid)', ext.purine.status, ext.purine.note],
                      ['💎', 'Oxalate (Kidney)', ext.oxalate.status, ext.oxalate.note],
                      ['🧪', 'Histamine / Allergy', ext.histamine.status, ext.histamine.note],
                    ];
                    return (
                      <div className="space-y-2">
                        {rows.map(([ic, title, status, note], rIdx) => (
                          <div
                            key={rIdx}
                            className={`p-3 rounded-xl border text-xs ${
                              darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between font-bold mb-0.5">
                              <span>
                                {ic} {title}
                              </span>
                              <span className="text-indigo-600 dark:text-indigo-400">{status}</span>
                            </div>
                            <p className="text-[11px] opacity-75">{note}</p>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              <p className="text-[11px] opacity-60 italic">
                {isBn ? BD_FCT_SOURCE_LINE_BN : BD_FCT_SOURCE_LINE_EN}
              </p>
            </div>

            <div
              className={`p-4 border-t flex items-center justify-between gap-3 ${
                darkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'
              }`}
            >
              {inspectingBdFood.item.zone !== 'red' ? (
                <button
                  type="button"
                  onClick={() => {
                    toggleFoodSelection(inspectingBdFood.item);
                    setInspectingBdFood(null);
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  {selectedFoods.includes(inspectingBdFood.item.id)
                    ? isBn
                      ? '✓ ডায়েট চার্টে নির্বাচিত (বাদ দিতে ক্লিক করুন)'
                      : '✓ Selected in Diet Chart (Tap to Remove)'
                    : isBn
                    ? '+ ডায়েট চার্টে যুক্ত করুন'
                    : '+ Add to My Diet Chart'}
                </button>
              ) : (
                <span className="text-xs font-bold text-red-500">
                  {isBn ? '🔴 রেড জোন খাবার ডায়েট চার্টে নিষিদ্ধ' : '🔴 Red Zone food restricted'}
                </span>
              )}
              <button
                type="button"
                onClick={() => setInspectingBdFood(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700"
              >
                {isBn ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisReport;
