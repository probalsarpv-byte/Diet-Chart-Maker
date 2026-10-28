import React, { useState, useMemo } from 'react';
import {
  Flame,
  Utensils,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  Scale,
  Droplets,
  TrendingUp,
  AlertCircle,
  BarChart3,
  Clock,
  ChevronRight,
  Award,
  HeartPulse,
  Zap,
} from 'lucide-react';
import {
  DailyCalorieLog,
  DietPhaseChart,
  HealthProfile,
  Language,
  LoggedFoodItem,
  MealSlotKey,
  User,
} from '../types';

interface Props {
  user: User | null;
  profile: HealthProfile | null;
  currentChart: DietPhaseChart | null;
  lang: Language;
  darkMode?: boolean;
  dailyLogs: DailyCalorieLog[];
  onUpdateTodayLog: (updatedLog: DailyCalorieLog) => void;
  onNavigateToAnalytics: () => void;
  onNavigateToDietMaker: () => void;
}

interface PresetFood {
  id: string;
  nameBn: string;
  nameEn: string;
  defaultPortionBn: string;
  defaultPortionEn: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  slotHint: MealSlotKey[];
}

const REGIONAL_FOOD_PRESETS: PresetFood[] = [
  {
    id: 'egg_boiled',
    nameBn: 'সিদ্ধ ডিম বা পোচ (২টি)',
    nameEn: 'Boiled / Poached Eggs (2 pcs)',
    defaultPortionBn: '২টি ডিম (১০০ গ্রাম)',
    defaultPortionEn: '2 Eggs (100g)',
    grams: 100,
    calories: 155,
    protein: 13,
    carbs: 1.1,
    fats: 11,
    fiber: 0,
    slotHint: ['morning', 'afternoon'],
  },
  {
    id: 'mixed_veg',
    nameBn: 'মিক্সড সবজি ও শাক ভাজি',
    nameEn: 'Sautéed Mixed Greens & Vegetables',
    defaultPortionBn: '১ বাটি (১৫০ গ্রাম)',
    defaultPortionEn: '1 Bowl (150g)',
    grams: 150,
    calories: 110,
    protein: 3.5,
    carbs: 14,
    fats: 4.5,
    fiber: 5.2,
    slotHint: ['morning', 'midDay', 'evening'],
  },
  {
    id: 'red_rice',
    nameBn: 'লাল চালের ভাত / ঢেঁকি ছাঁটা ভাত',
    nameEn: 'Red / Brown Steamed Rice',
    defaultPortionBn: '১ কাপ (১২০ গ্রাম)',
    defaultPortionEn: '1 Cup (120g)',
    grams: 120,
    calories: 135,
    protein: 3.2,
    carbs: 28,
    fats: 1.1,
    fiber: 2.4,
    slotHint: ['midDay'],
  },
  {
    id: 'white_rice',
    nameBn: 'সাদা ভাত (পরিমিত)',
    nameEn: 'Steamed White Rice',
    defaultPortionBn: '১ কাপ (১৫০ গ্রাম)',
    defaultPortionEn: '1 Cup (150g)',
    grams: 150,
    calories: 195,
    protein: 4.0,
    carbs: 42,
    fats: 0.4,
    fiber: 0.6,
    slotHint: ['midDay'],
  },
  {
    id: 'roti_wheat',
    nameBn: 'লাল আটার রুটি (১টি)',
    nameEn: 'Whole Wheat Flatbread / Roti (1 pc)',
    defaultPortionBn: '১টি রুটি (৪৫ গ্রাম)',
    defaultPortionEn: '1 Roti (45g)',
    grams: 45,
    calories: 110,
    protein: 3.5,
    carbs: 22,
    fats: 0.9,
    fiber: 2.8,
    slotHint: ['morning', 'evening'],
  },
  {
    id: 'fish_curry',
    nameBn: 'দেশি মাছের ঝোল (রুই/কাতলা/শিং/মাগুর)',
    nameEn: 'Bengali Fish Curry (Rohu / Catfish)',
    defaultPortionBn: '২ টুকরা (১২০ গ্রাম)',
    defaultPortionEn: '2 Pieces (120g)',
    grams: 120,
    calories: 210,
    protein: 24,
    carbs: 3,
    fats: 11,
    fiber: 0.5,
    slotHint: ['midDay', 'evening'],
  },
  {
    id: 'chicken_curry',
    nameBn: 'দেশি মুরগির মাংস / গ্রিলড চিকেন',
    nameEn: 'Deshi Chicken Curry / Grilled Chicken',
    defaultPortionBn: '১ বাটি (১৩০ গ্রাম)',
    defaultPortionEn: '1 Bowl (130g)',
    grams: 130,
    calories: 235,
    protein: 28,
    carbs: 4,
    fats: 12,
    fiber: 0.5,
    slotHint: ['midDay', 'evening'],
  },
  {
    id: 'lentil_dal',
    nameBn: 'মসুর বা মুগ ডাল (ঘন)',
    nameEn: 'Thick Red / Moong Lentil Soup',
    defaultPortionBn: '১ কাপ (১৪০ গ্রাম)',
    defaultPortionEn: '1 Cup (140g)',
    grams: 140,
    calories: 145,
    protein: 9,
    carbs: 20,
    fats: 3,
    fiber: 4.5,
    slotHint: ['morning', 'midDay', 'evening'],
  },
  {
    id: 'chia_nuts',
    nameBn: 'ভেজানো চিয়া সিড ও কাঠবাদাম',
    nameEn: 'Soaked Chia Seeds & Almonds',
    defaultPortionBn: '৩০ গ্রাম',
    defaultPortionEn: '30g Serving',
    grams: 30,
    calories: 165,
    protein: 6,
    carbs: 7,
    fats: 13,
    fiber: 5.5,
    slotHint: ['morning', 'afternoon'],
  },
  {
    id: 'sour_curd',
    nameBn: 'টক দই ও শসা সালাদ',
    nameEn: 'Probiotic Sour Yogurt & Cucumber Salad',
    defaultPortionBn: '১ কাপ (১৫০ গ্রাম)',
    defaultPortionEn: '1 Cup (150g)',
    grams: 150,
    calories: 95,
    protein: 6.5,
    carbs: 8,
    fats: 4,
    fiber: 1.8,
    slotHint: ['midDay', 'afternoon', 'evening'],
  },
  {
    id: 'guava_apple',
    nameBn: 'পেয়ারা / জাম্বুরা / গ্রিন আপেল',
    nameEn: 'Fresh Guava / Pomelo / Green Apple',
    defaultPortionBn: '১টি মাঝারি (১৩০ গ্রাম)',
    defaultPortionEn: '1 Medium (130g)',
    grams: 130,
    calories: 85,
    protein: 1.5,
    carbs: 19,
    fats: 0.5,
    fiber: 5.4,
    slotHint: ['afternoon'],
  },
  {
    id: 'soup_veg_chicken',
    nameBn: 'চিকেন ও সবজি ক্লিয়ার স্যুপ',
    nameEn: 'Clear Chicken & Vegetable Soup',
    defaultPortionBn: '১ বড় বাটি (২৫০ মিলি)',
    defaultPortionEn: '1 Large Bowl (250ml)',
    grams: 250,
    calories: 160,
    protein: 16,
    carbs: 11,
    fats: 5.5,
    fiber: 3.2,
    slotHint: ['evening'],
  },
];

const SLOT_META: {
  key: MealSlotKey;
  labelBn: string;
  labelEn: string;
  timeBn: string;
  timeEn: string;
  gradient: string;
  badgeColor: string;
}[] = [
  {
    key: 'morning',
    labelBn: 'সকালের নাস্তা (Breakfast)',
    labelEn: 'Morning / Breakfast',
    timeBn: 'সকাল ৮:০০ - ৯:৩০',
    timeEn: '8:00 AM - 9:30 AM',
    gradient: 'from-amber-500 to-orange-600',
    badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30',
  },
  {
    key: 'midDay',
    labelBn: 'দুপুরের খাবার (Lunch)',
    labelEn: 'Mid-Day / Lunch',
    timeBn: 'দুপুর ১:০০ - ২:৩০',
    timeEn: '1:00 PM - 2:30 PM',
    gradient: 'from-emerald-500 to-teal-600',
    badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30',
  },
  {
    key: 'afternoon',
    labelBn: 'বিকালের নাস্তা (Snacks)',
    labelEn: 'Afternoon Snack',
    timeBn: 'বিকাল ৪:৩০ - ৫:৩০',
    timeEn: '4:30 PM - 5:30 PM',
    gradient: 'from-violet-500 to-purple-600',
    badgeColor: 'bg-violet-500/15 text-violet-600 dark:text-violet-300 border-violet-500/30',
  },
  {
    key: 'evening',
    labelBn: 'রাতের খাবার (Dinner)',
    labelEn: 'Evening / Dinner',
    timeBn: 'রাত ৭:৩০ - ৮:৩০',
    timeEn: '7:30 PM - 8:30 PM',
    gradient: 'from-blue-600 to-indigo-700',
    badgeColor: 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30',
  },
];

const parseNumberFromText = (str: string | undefined, fallback: number): number => {
  if (!str) return fallback;
  const match = str.match(/(\d+(\.\d+)?)/);
  return match ? Math.round(parseFloat(match[1])) : fallback;
};

const CalorieTrackerView: React.FC<Props> = ({
  user,
  profile,
  currentChart,
  lang,
  darkMode,
  dailyLogs,
  onUpdateTodayLog,
  onNavigateToAnalytics,
  onNavigateToDietMaker,
}) => {
  const isBn = lang === 'bn';
  const hasDietChart = Boolean(profile && currentChart && currentChart.weeklySchedule?.length > 0);

  // Allow user with a chart to view Comparison Mode (default) or switch to Standalone Analysis Mode to preview both
  const [viewMode, setViewMode] = useState<'comparison' | 'standalone'>(
    hasDietChart ? 'comparison' : 'standalone'
  );
  const activeComparisonMode = hasDietChart && viewMode === 'comparison';

  const [activeSlot, setActiveSlot] = useState<MealSlotKey>('morning');
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);

  // Custom Food Form State
  const [customFoodName, setCustomFoodName] = useState('');
  const [customPortion, setCustomPortion] = useState('');
  const [customGrams, setCustomGrams] = useState('100');
  const [customCalories, setCustomCalories] = useState('180');
  const [customProtein, setCustomProtein] = useState('12');
  const [customCarbs, setCustomCarbs] = useState('20');
  const [customFats, setCustomFats] = useState('6');
  const [portionMultiplier, setPortionMultiplier] = useState<number>(1);

  // Get today's log (last item in dailyLogs)
  const todayLog: DailyCalorieLog = dailyLogs[dailyLogs.length - 1] || {
    date: new Date().toISOString().split('T')[0],
    dayLabelBn: 'আজ',
    dayLabelEn: 'Today',
    targetCalories: currentChart?.totalDailyCalories || (profile ? Math.round(profile.weight * 24 + 100) : 1650),
    targetProtein: profile ? Math.round(profile.weight * 1.0) : 65,
    targetCarbs: 165,
    targetFats: 55,
    waterGlasses: 6,
    items: [],
  };

  // Extract Suggested Meals from Diet Chart if available
  const suggestedMealsBySlot = useMemo(() => {
    const map: Record<
      MealSlotKey,
      {
        mealName: string;
        description: string;
        quantity: string;
        calories: number;
        protein: number;
        carbs: number;
        fats: number;
      } | null
    > = {
      morning: null,
      midDay: null,
      afternoon: null,
      evening: null,
    };

    if (!currentChart || !currentChart.weeklySchedule?.length) return map;
    const dayPlan = currentChart.weeklySchedule[selectedDayIdx] || currentChart.weeklySchedule[0];
    if (!dayPlan?.meals) return map;

    dayPlan.meals.forEach((m, idx) => {
      const slotText = `${m.mealSlot || ''} ${m.time || ''}`.toLowerCase();
      let key: MealSlotKey = 'morning';
      if (slotText.includes('lunch') || slotText.includes('mid') || slotText.includes('দুপুর') || idx === 1) {
        key = 'midDay';
      } else if (
        slotText.includes('snack') ||
        slotText.includes('afternoon') ||
        slotText.includes('বিকাল') ||
        (dayPlan.meals.length === 4 && idx === 2)
      ) {
        key = 'afternoon';
      } else if (
        slotText.includes('dinner') ||
        slotText.includes('evening') ||
        slotText.includes('night') ||
        slotText.includes('রাত') ||
        idx === dayPlan.meals.length - 1
      ) {
        key = 'evening';
      }

      const cal = parseNumberFromText(m.calories, key === 'midDay' ? 520 : key === 'afternoon' ? 220 : 420);
      const prot = parseNumberFromText(m.macroBreakdown?.protein, Math.round((cal * 0.3) / 4));
      const carb = parseNumberFromText(m.macroBreakdown?.carbs, Math.round((cal * 0.4) / 4));
      const fat = parseNumberFromText(m.macroBreakdown?.fats, Math.round((cal * 0.3) / 9));

      map[key] = {
        mealName: m.mealName,
        description: m.description,
        quantity: m.quantity,
        calories: cal,
        protein: prot,
        carbs: carb,
        fats: fat,
      };
    });

    return map;
  }, [currentChart, selectedDayIdx]);

  // Totals eaten today
  const totals = useMemo(() => {
    return todayLog.items.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: Math.round((acc.protein + item.protein) * 10) / 10,
        carbs: Math.round((acc.carbs + item.carbs) * 10) / 10,
        fats: Math.round((acc.fats + item.fats) * 10) / 10,
        fiber: Math.round((acc.fiber + (item.fiber || 2)) * 10) / 10,
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 }
    );
  }, [todayLog.items]);

  const targetCalories = currentChart?.totalDailyCalories || todayLog.targetCalories || 1650;
  const targetProtein = profile?.weight ? Math.round(profile.weight) : todayLog.targetProtein || 65;
  const targetCarbs = Math.round((targetCalories * 0.4) / 4);
  const targetFats = Math.round((targetCalories * 0.3) / 9);

  const caloriePercent = Math.min(100, Math.round((totals.calories / Math.max(1, targetCalories)) * 100));
  const calorieDiff = totals.calories - targetCalories;

  const handleAddPresetFood = (preset: PresetFood, slot: MealSlotKey = activeSlot) => {
    const mult = portionMultiplier;
    const newItem: LoggedFoodItem = {
      id: `food-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      slot,
      nameBn: preset.nameBn,
      nameEn: preset.nameEn,
      portion:
        mult === 1
          ? isBn
            ? preset.defaultPortionBn
            : preset.defaultPortionEn
          : `${mult}x (${Math.round(preset.grams * mult)}g)`,
      grams: Math.round(preset.grams * mult),
      calories: Math.round(preset.calories * mult),
      protein: Math.round(preset.protein * mult * 10) / 10,
      carbs: Math.round(preset.carbs * mult * 10) / 10,
      fats: Math.round(preset.fats * mult * 10) / 10,
      fiber: Math.round(preset.fiber * mult * 10) / 10,
      matchedChartMeal: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    onUpdateTodayLog({
      ...todayLog,
      targetCalories,
      targetProtein,
      targetCarbs,
      targetFats,
      items: [...todayLog.items, newItem],
    });
  };

  const handleLogSuggestedChartMeal = (slot: MealSlotKey) => {
    const suggested = suggestedMealsBySlot[slot];
    if (!suggested) return;

    const newItem: LoggedFoodItem = {
      id: `chart-meal-${Date.now()}`,
      slot,
      nameBn: suggested.mealName,
      nameEn: suggested.mealName,
      portion: suggested.quantity,
      grams: 200,
      calories: suggested.calories,
      protein: suggested.protein,
      carbs: suggested.carbs,
      fats: suggested.fats,
      fiber: 4.5,
      matchedChartMeal: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    onUpdateTodayLog({
      ...todayLog,
      targetCalories,
      targetProtein,
      targetCarbs,
      targetFats,
      items: [...todayLog.items, newItem],
    });
  };

  const handleAddCustomFood = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFoodName.trim()) return;

    const newItem: LoggedFoodItem = {
      id: `custom-${Date.now()}`,
      slot: activeSlot,
      nameBn: customFoodName.trim(),
      nameEn: customFoodName.trim(),
      portion: customPortion.trim() || `${customGrams}g`,
      grams: Number(customGrams) || 100,
      calories: Number(customCalories) || 150,
      protein: Number(customProtein) || 8,
      carbs: Number(customCarbs) || 18,
      fats: Number(customFats) || 5,
      fiber: 2.5,
      matchedChartMeal: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    onUpdateTodayLog({
      ...todayLog,
      targetCalories,
      targetProtein,
      targetCarbs,
      targetFats,
      items: [...todayLog.items, newItem],
    });

    setCustomFoodName('');
    setCustomPortion('');
  };

  const handleRemoveFood = (id: string) => {
    onUpdateTodayLog({
      ...todayLog,
      items: todayLog.items.filter((i) => i.id !== id),
    });
  };

  const handleWaterChange = (delta: number) => {
    const nextWater = Math.max(0, Math.min(16, (todayLog.waterGlasses || 0) + delta));
    onUpdateTodayLog({
      ...todayLog,
      waterGlasses: nextWater,
    });
  };

  // Standalone Daily Analysis Insights (for Free users or Standalone mode)
  const standaloneInsights = useMemo(() => {
    const totalMacroCals = totals.protein * 4 + totals.carbs * 4 + totals.fats * 9 || 1;
    const proteinPct = Math.round(((totals.protein * 4) / totalMacroCals) * 100);
    const carbsPct = Math.round(((totals.carbs * 4) / totalMacroCals) * 100);
    const fatsPct = Math.max(0, 100 - proteinPct - carbsPct);

    const eveningCalories = todayLog.items
      .filter((i) => i.slot === 'evening')
      .reduce((s, i) => s + i.calories, 0);

    const insights: { titleBn: string; titleEn: string; descBn: string; descEn: string; status: 'good' | 'warn' | 'info' }[] = [];

    if (totals.protein >= targetProtein * 0.85) {
      insights.push({
        titleBn: 'প্রোটিন চাহিদা পূরণ হচ্ছে (Optimal Protein)',
        titleEn: 'Protein Target Well Supported',
        descBn: `আপনি আজ ${totals.protein}g প্রোটিন নিয়েছেন যা আপনার পেশী ও মেটাবলিজম ধরে রাখতে সাহায্য করবে।`,
        descEn: `You have logged ${totals.protein}g protein today, supporting muscle & metabolic repair.`,
        status: 'good',
      });
    } else {
      insights.push({
        titleBn: 'প্রোটিনের পরিমাণ আরও বাড়ানো প্রয়োজন',
        titleEn: 'Protein Intake Below Daily Requirement',
        descBn: `আজ এখন পর্যন্ত ${totals.protein}g প্রোটিন যোগ হয়েছে (টার্গেট ${targetProtein}g)। খাবার তালিকায় ডিম, দেশি মাছ, মুরগি বা ডাল যোগ করুন।`,
        descEn: `Logged ${totals.protein}g protein vs ${targetProtein}g target. Consider adding eggs, fish, chicken, or lentils.`,
        status: 'warn',
      });
    }

    if (carbsPct > 50) {
      insights.push({
        titleBn: 'কার্বোহাইড্রেটের অনুপাত বেশি (${carbsPct}%)',
        titleEn: `High Carbohydrate Ratio (${carbsPct}%)`,
        descBn: 'খাবারে ভাতের বা শর্করার পরিমাণ কিছুটা বেশি। ইনসুলিন ব্যালেন্স রাখতে ৪০% কার্ব, ৩০% প্রোটিন ও ৩০% স্বাস্থ্যকর ফ্যাট বজায় রাখুন।',
        descEn: 'Carbohydrate share is above 40%. Pair grains with fibrous greens and quality protein.',
        status: 'warn',
      });
    } else {
      insights.push({
        titleBn: 'সুষম ম্যাক্রো ব্যালেন্স (৪০:৩০:৩০ অনুপাতের কাছাকাছি)',
        titleEn: 'Balanced Metabolic Macro Ratio',
        descBn: `আপনার কার্ব (${carbsPct}%), প্রোটিন (${proteinPct}%) এবং ফ্যাট (${fatsPct}%) অনুপাত মেটাবলিক স্বাস্থ্যের অনুকূলে রয়েছে।`,
        descEn: `Your Carbs (${carbsPct}%), Protein (${proteinPct}%), and Fats (${fatsPct}%) align well with metabolic nutrition.`,
        status: 'good',
      });
    }

    if (eveningCalories > targetCalories * 0.35) {
      insights.push({
        titleBn: 'রাতের খাবারে ক্যালোরির চাপ বেশি',
        titleEn: 'Heavy Evening Calorie Load',
        descBn: 'রাতে হালকা ও সবজি-প্রধান খাবার খেলে হজম ও ঘুমের মান উন্নত হয় এবং ফ্যাট বার্নিং ত্বরান্বিত হয়।',
        descEn: 'Keeping dinner lighter and vegetable-focused improves circadian digestion and overnight fat oxidation.',
        status: 'info',
      });
    }

    return { proteinPct, carbsPct, fatsPct, eveningCalories, insights };
  }, [totals, targetProtein, targetCalories, todayLog.items]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Figma-Style Colorful Hero Header */}
      <div
        className={`relative rounded-[36px] p-6 md:p-9 border overflow-hidden shadow-2xl ${
          darkMode
            ? 'bg-gradient-to-br from-slate-900 via-orange-950/40 to-rose-950/40 border-orange-500/30'
            : 'bg-gradient-to-br from-orange-50 via-amber-50/70 to-rose-50 border-orange-200/80'
        }`}
      >
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-orange-500/20 to-rose-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-gradient-to-tr from-emerald-500/15 to-amber-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow-md">
                <Flame className="w-3.5 h-3.5" />
                <span>{isBn ? 'ডেইলি ক্যালোরি ও ডায়েট ট্র্যাকার' : 'Daily Calorie & Diet Tracker'}</span>
              </span>

              <span
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border ${
                  activeComparisonMode
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                    : 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {activeComparisonMode
                    ? isBn
                      ? 'প্রো মোড: ডায়েট চার্ট বনাম আজকের খাবার কম্পারিজন'
                      : 'Pro Mode: Diet Chart vs. Daily Food Comparison'
                    : isBn
                    ? 'সবার জন্য উন্মুক্ত: সারাদিনের খাবারের পুষ্টি অ্যানালাইসিস'
                    : 'Open Mode: Full-Day Food & Macro Analysis'}
                </span>
              </span>
            </div>

            <h1 className={`text-2xl md:text-4xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {activeComparisonMode
                ? isBn
                  ? 'ডায়েট চার্টের সাজেস্টেড খাবার বনাম আজকে যা খেয়েছেন'
                  : 'Suggested Diet Chart vs. What You Ate Today'
                : isBn
                ? 'ডেইলি ক্যালোরি ট্র্যাকার ও পুষ্টি অ্যানালাইসিস'
                : 'Daily Calorie Tracker & Nutrition Analysis'}
            </h1>

            <p className={`text-xs md:text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              {activeComparisonMode
                ? isBn
                  ? 'আপনার ডায়েট চার্টে প্রতি বেলায় যে খাবার ও পরিমাণ সাজেস্ট করা হয়েছে তার তুলনায় আজ কতটুকু খেয়েছেন তা সরাসরি তুলনা করুন।'
                  : 'Compare every meal suggested in your clinical diet chart against what and how much you actually ate today.'
                : isBn
                ? 'ডায়েট চার্ট বা প্রো সাবস্ক্রিপশন না থাকলেও আপনি সারাদিন কী খেয়েছেন তা এখানে লগ করুন। আপনার খাবারের ওপর ভিত্তি করে তাৎক্ষণিক ক্যালোরি ও পুষ্টি অ্যানালাইসিস দেওয়া হবে।'
                : 'Even without a Pro subscription or diet chart, log everything you eat today to receive a complete calorie, macro, and metabolic analysis.'}
            </p>
          </div>

          {/* Mode Switcher & Quick Link to Weekly Analytics */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
            {hasDietChart ? (
              <div
                className={`p-1.5 rounded-2xl border flex items-center gap-1 ${
                  darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200 shadow-sm'
                }`}
              >
                <button
                  onClick={() => setViewMode('comparison')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    viewMode === 'comparison'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {isBn ? 'ডায়েট চার্ট কম্পারিজন' : 'Chart Comparison'}
                </button>
                <button
                  onClick={() => setViewMode('standalone')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    viewMode === 'standalone'
                      ? 'bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow-md'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {isBn ? 'ফ্রি অ্যানালাইসিস ভিউ' : 'Free Analysis View'}
                </button>
              </div>
            ) : (
              <button
                onClick={onNavigateToDietMaker}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isBn ? 'ডায়েট চার্ট তৈরি করতে চান? ডায়েট মেকারে যান →' : 'Want a Diet Chart Comparison? Open Diet Maker →'}</span>
              </button>
            )}

            <button
              onClick={onNavigateToAnalytics}
              className={`px-4 py-2.5 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                darkMode
                  ? 'bg-slate-800/90 border-slate-700 text-indigo-300 hover:bg-slate-800'
                  : 'bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50 shadow-sm'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>{isBn ? 'সাপ্তাহিক প্রগ্রেস ও অ্যানালিটিক্স দেখুন →' : 'View Weekly Progress & Analytics →'}</span>
            </button>
          </div>
        </div>

        {/* Top Summary Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-7">
          {/* Card 1: Calories Consumed vs Target */}
          <div
            className={`p-4 md:p-5 rounded-3xl border backdrop-blur-md ${
              darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/90 border-white shadow-md'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-60">
                {activeComparisonMode
                  ? isBn
                    ? 'সাজেস্টেড বনাম গ্রহণকৃত ক্যালোরি'
                    : 'Suggested vs Eaten Calories'
                  : isBn
                  ? 'আজকের মোট ক্যালোরি'
                  : 'Total Calories Today'}
              </span>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 text-white flex items-center justify-center shadow-md">
                <Flame className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 tabular-nums">
              <span className="text-2xl md:text-3xl font-black">{totals.calories}</span>
              <span className="text-xs font-bold opacity-60">/ {targetCalories} kcal</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden mt-3">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-rose-600 transition-all duration-500"
                style={{ width: `${caloriePercent}%` }}
              />
            </div>
            <p className="text-[11px] font-bold mt-2 opacity-75 tabular-nums">
              {calorieDiff === 0
                ? isBn
                  ? 'একদম টার্গেট অনুযায়ী আছে!'
                  : 'Exact target reached!'
                : calorieDiff < 0
                ? isBn
                  ? `আরও ${Math.abs(calorieDiff)} kcal বাকি আছে`
                  : `${Math.abs(calorieDiff)} kcal remaining`
                : isBn
                ? `টার্গেটের চেয়ে ${calorieDiff} kcal বেশি`
                : `${calorieDiff} kcal over target`}
            </p>
          </div>

          {/* Card 2: Protein (30% / 1g per kg) */}
          <div
            className={`p-4 md:p-5 rounded-3xl border backdrop-blur-md ${
              darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/90 border-white shadow-md'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-60">
                {isBn ? 'প্রোটিন (১ গ্রাম/কেজি)' : 'Protein (1g/kg Target)'}
              </span>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 tabular-nums">
              <span className="text-2xl md:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {totals.protein}g
              </span>
              <span className="text-xs font-bold opacity-60">/ {targetProtein}g</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden mt-3">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((totals.protein / Math.max(1, targetProtein)) * 100))}%` }}
              />
            </div>
            <p className="text-[11px] font-bold mt-2 opacity-75 tabular-nums">
              {Math.round((totals.protein / Math.max(1, targetProtein)) * 100)}% {isBn ? 'পূরণ হয়েছে' : 'fulfilled'}
            </p>
          </div>

          {/* Card 3: Carbs & Healthy Fats */}
          <div
            className={`p-4 md:p-5 rounded-3xl border backdrop-blur-md ${
              darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/90 border-white shadow-md'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-60">
                {isBn ? 'কার্ব ও স্বাস্থ্যকর ফ্যাট' : 'Carbs & Healthy Fats'}
              </span>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
                <Scale className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-center justify-between text-xs font-bold tabular-nums mt-1">
              <div>
                <span className="block text-[10px] opacity-60">{isBn ? 'কার্বোহাইড্রেট (৪০%)' : 'Carbs (40%)'}</span>
                <span className="text-lg font-black text-violet-600 dark:text-violet-400">
                  {totals.carbs}g <span className="text-[11px] opacity-60">/ {targetCarbs}g</span>
                </span>
              </div>
              <div className="text-right">
                <span className="block text-[10px] opacity-60">{isBn ? 'ফ্যাট (৩০%)' : 'Fats (30%)'}</span>
                <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                  {totals.fats}g <span className="text-[11px] opacity-60">/ {targetFats}g</span>
                </span>
              </div>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden mt-3 flex">
              <div
                className="h-full bg-violet-500"
                style={{ width: `${Math.min(100, Math.round((totals.carbs / Math.max(1, targetCarbs)) * 50))}%` }}
              />
              <div
                className="h-full bg-amber-500"
                style={{ width: `${Math.min(100, Math.round((totals.fats / Math.max(1, targetFats)) * 50))}%` }}
              />
            </div>
            <p className="text-[11px] font-bold mt-2 opacity-75 tabular-nums">
              {isBn ? `ফাইবার: ${totals.fiber}g` : `Dietary Fiber: ${totals.fiber}g`}
            </p>
          </div>

          {/* Card 4: Daily Water Intake */}
          <div
            className={`p-4 md:p-5 rounded-3xl border backdrop-blur-md ${
              darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/90 border-white shadow-md'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-60">
                {isBn ? 'পানি পান (Hydration)' : 'Water Intake'}
              </span>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-md">
                <Droplets className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-center justify-between mt-1">
              <div className="tabular-nums">
                <span className="text-2xl md:text-3xl font-black text-sky-500">{todayLog.waterGlasses || 0}</span>
                <span className="text-xs font-bold opacity-60"> / 10 {isBn ? 'গ্লাস' : 'glasses'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleWaterChange(-1)}
                  className={`w-8 h-8 rounded-xl font-black text-sm border ${
                    darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
                  }`}
                >
                  -
                </button>
                <button
                  onClick={() => handleWaterChange(1)}
                  className="w-8 h-8 rounded-xl font-black text-sm bg-sky-500 text-white shadow-md"
                >
                  +
                </button>
              </div>
            </div>
            <p className="text-[11px] font-bold mt-3 opacity-75 tabular-nums">
              {((todayLog.waterGlasses || 0) * 0.25).toFixed(2)} {isBn ? 'লিটার সম্পন্ন' : 'Liters logged'}
            </p>
          </div>
        </div>
      </div>

      {/* MODE A: DIET CHART VS EATEN COMPARISON SECTION (Only shown when user has Diet Chart & Comparison Mode is active) */}
      {activeComparisonMode && currentChart && (
        <div
          className={`p-6 md:p-8 rounded-[32px] border space-y-6 shadow-xl ${
            darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-500 block">
                {isBn ? 'ডায়েট চার্ট কম্পারিজন টেবিল' : 'Diet Chart Meal-by-Meal Comparison'}
              </span>
              <h2 className="text-xl md:text-2xl font-bold">
                {isBn
                  ? 'আপনাকে সাজেস্ট করা খাবার বনাম আজকে যা খেয়েছেন'
                  : 'Prescribed Diet Chart Meals vs. Your Logged Intake'}
              </h2>
            </div>

            {/* Day selector from weekly diet chart */}
            {currentChart.weeklySchedule?.length > 1 && (
              <div className="flex flex-wrap gap-1.5">
                {currentChart.weeklySchedule.map((d, idx) => (
                  <button
                    key={d.day || idx}
                    onClick={() => setSelectedDayIdx(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedDayIdx === idx
                        ? 'bg-emerald-600 text-white shadow-md'
                        : darkMode
                        ? 'bg-slate-800 text-slate-400 hover:text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {d.day}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {SLOT_META.map((slot) => {
              const suggested = suggestedMealsBySlot[slot.key];
              const eatenInSlot = todayLog.items.filter((i) => i.slot === slot.key);
              const eatenCalories = eatenInSlot.reduce((s, i) => s + i.calories, 0);
              const suggestedCalories = suggested?.calories || 0;
              const diff = eatenCalories - suggestedCalories;

              return (
                <div
                  key={slot.key}
                  className={`p-5 rounded-3xl border-2 flex flex-col justify-between gap-4 transition-all ${
                    darkMode
                      ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      : 'bg-slate-50/70 border-slate-200/80 hover:border-emerald-300'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Slot Title & Calorie Comparison Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${slot.gradient} text-white flex items-center justify-center shadow-md`}
                        >
                          <Utensils className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm md:text-base">
                            {isBn ? slot.labelBn : slot.labelEn}
                          </h3>
                          <span className="text-[11px] opacity-60 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {isBn ? slot.timeBn : slot.timeEn}
                          </span>
                        </div>
                      </div>

                      <div className="text-right tabular-nums">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${
                            eatenCalories === 0
                              ? 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                              : Math.abs(diff) <= 80
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                              : diff > 80
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {eatenCalories} / {suggestedCalories || 400} kcal
                        </span>
                      </div>
                    </div>

                    {/* Box 1: Suggested in Diet Chart */}
                    <div
                      className={`p-4 rounded-2xl border ${
                        darkMode
                          ? 'bg-emerald-950/25 border-emerald-800/40'
                          : 'bg-emerald-50/80 border-emerald-200/70'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          {isBn ? '📋 ডায়েট চার্টে সাজেস্ট করা খাবার' : '📋 Suggested in Your Diet Chart'}
                        </span>
                        {suggested && (
                          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
                            {suggested.quantity} • {suggested.calories} kcal
                          </span>
                        )}
                      </div>
                      {suggested ? (
                        <>
                          <p className="font-bold text-xs md:text-sm">{suggested.mealName}</p>
                          <p className="text-[11px] opacity-75 mt-0.5 line-clamp-2">{suggested.description}</p>
                        </>
                      ) : (
                        <p className="text-xs opacity-60">
                          {isBn ? 'এই বেলায় ফাস্টিং বা হালকা ডিটক্স ওয়াটার' : 'Fasting window / Light detox hydration'}
                        </p>
                      )}
                    </div>

                    {/* Box 2: What User Actually Ate in This Slot */}
                    <div
                      className={`p-4 rounded-2xl border ${
                        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-orange-500">
                          {isBn ? '🍽️ আপনি আজ যা খেয়েছেন' : '🍽️ What You Ate Today'}
                        </span>
                        <span className="text-[11px] font-bold opacity-70 tabular-nums">
                          {eatenInSlot.length} {isBn ? 'টি আইটেম' : 'items'}
                        </span>
                      </div>

                      {eatenInSlot.length === 0 ? (
                        <p className="text-xs opacity-50 py-2">
                          {isBn
                            ? 'এখনো কোনো খাবার লগ করা হয়নি। নিচে বাটনে ক্লিক করে যোগ করুন।'
                            : 'No food logged for this slot yet.'}
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {eatenInSlot.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between gap-2 text-xs py-1.5 border-b last:border-b-0 border-slate-100 dark:border-slate-800"
                            >
                              <div>
                                <span className="font-bold">{isBn ? item.nameBn : item.nameEn}</span>
                                <span className="text-[11px] opacity-60 ml-1.5">({item.portion})</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 tabular-nums">
                                <span className="font-bold text-orange-500">{item.calories} kcal</span>
                                <button
                                  onClick={() => handleRemoveFood(item.id)}
                                  className="text-rose-500 hover:bg-rose-500/10 p-1 rounded-lg"
                                  title="Remove"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Comparison Verdict + Quick Action Buttons */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[11px] font-bold">
                      {eatenCalories === 0 ? (
                        <span className="opacity-60">
                          {isBn ? 'তুলনা দেখতে খাবার লগ করুন' : 'Log meal to compare'}
                        </span>
                      ) : Math.abs(diff) <= 80 ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {isBn ? 'ডায়েট চার্টের সাথে চমৎকার মিল আছে!' : 'Matches Diet Chart target!'}
                        </span>
                      ) : diff > 80 ? (
                        <span className="text-rose-500 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {isBn
                            ? `সাজেস্টেড খাবারের চেয়ে ${diff} kcal বেশি খেয়েছেন`
                            : `${diff} kcal above suggested meal`}
                        </span>
                      ) : (
                        <span className="text-amber-500 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {isBn
                            ? `সাজেস্টেড খাবারের চেয়ে ${Math.abs(diff)} kcal কম খেয়েছেন`
                            : `${Math.abs(diff)} kcal below suggested meal`}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {suggested && (
                        <button
                          onClick={() => handleLogSuggestedChartMeal(slot.key)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-sm transition-all active:scale-95"
                        >
                          {isBn ? '✓ চার্ট অনুযায়ী খেয়েছি' : '✓ Ate As Suggested'}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setActiveSlot(slot.key);
                          const el = document.getElementById('food-logger-panel');
                          el?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
                          darkMode
                            ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {isBn ? '+ অন্য খাবার যোগ করুন' : '+ Log Other Food'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FOOD LOGGER PANEL (Works for BOTH Comparison Mode and Free/Standalone Mode) */}
      <div
        id="food-logger-panel"
        className={`p-6 md:p-8 rounded-[32px] border shadow-xl space-y-6 ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-orange-500 block">
              {isBn ? 'খাবার লগ করুন (বাংলাদেশি ও গ্লোবাল ফুড ডাটাবেস)' : 'Quick Food Logger'}
            </span>
            <h2 className="text-xl md:text-2xl font-bold">
              {isBn ? 'আজ সারাদিন কী খেয়েছেন যোগ করুন' : 'Log What You Ate Today'}
            </h2>
          </div>

          {/* Portion Multiplier Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold opacity-70">{isBn ? 'পরিমাণ (Portion):' : 'Portion Size:'}</span>
            {[0.5, 1, 1.5, 2].map((mult) => (
              <button
                key={mult}
                onClick={() => setPortionMultiplier(mult)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold tabular-nums transition-all ${
                  portionMultiplier === mult
                    ? 'bg-orange-500 text-white shadow-md'
                    : darkMode
                    ? 'bg-slate-800 text-slate-300'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {mult}x
              </button>
            ))}
          </div>
        </div>

        {/* Meal Slot Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SLOT_META.map((slot) => {
            const count = todayLog.items.filter((i) => i.slot === slot.key).length;
            const isSelected = activeSlot === slot.key;
            return (
              <button
                key={slot.key}
                onClick={() => setActiveSlot(slot.key)}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                  isSelected
                    ? `bg-gradient-to-r ${slot.gradient} text-white border-transparent shadow-lg`
                    : darkMode
                    ? 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="text-xs font-extrabold">{isBn ? slot.labelBn : slot.labelEn}</div>
                  <div className={`text-[10px] ${isSelected ? 'text-white/80' : 'opacity-60'}`}>
                    {isBn ? slot.timeBn : slot.timeEn}
                  </div>
                </div>
                <span
                  className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center tabular-nums ${
                    isSelected ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick-Add Regional Food Cards */}
        <div>
          <p className="text-xs font-bold opacity-70 mb-3">
            {isBn
              ? '১-ক্লিকে প্রতিদিনের পরিচিত খাবার যোগ করুন (সিলেক্টেড বেলায় যুক্ত হবে):'
              : '1-Click Add Common Foods to Selected Meal Slot:'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {REGIONAL_FOOD_PRESETS.map((food) => (
              <button
                key={food.id}
                onClick={() => handleAddPresetFood(food, activeSlot)}
                className={`p-3.5 rounded-2xl border text-left transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-between gap-3 ${
                  darkMode
                    ? 'bg-slate-950/70 border-slate-800 hover:border-orange-500/50'
                    : 'bg-slate-50/80 border-slate-200/80 hover:border-orange-400 hover:bg-orange-50/30'
                }`}
              >
                <div className="space-y-1">
                  <div className="font-bold text-xs md:text-sm">{isBn ? food.nameBn : food.nameEn}</div>
                  <div className="text-[11px] opacity-65">
                    {isBn ? food.defaultPortionBn : food.defaultPortionEn}
                    {portionMultiplier !== 1 ? ` × ${portionMultiplier}` : ''}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold tabular-nums opacity-80">
                    <span className="text-emerald-500">P: {Math.round(food.protein * portionMultiplier)}g</span>
                    <span className="text-violet-500">C: {Math.round(food.carbs * portionMultiplier)}g</span>
                    <span className="text-amber-500">F: {Math.round(food.fats * portionMultiplier)}g</span>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span className="text-xs font-black text-orange-500 tabular-nums">
                    {Math.round(food.calories * portionMultiplier)} kcal
                  </span>
                  <span className="mt-1 w-7 h-7 rounded-xl bg-orange-500/15 text-orange-500 flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Food Input Form */}
        <form
          onSubmit={handleAddCustomFood}
          className={`p-4 md:p-5 rounded-3xl border ${
            darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="text-xs font-bold mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4 text-orange-500" />
            <span>
              {isBn
                ? 'তালিকায় নেই এমন যেকোনো খাবার নিজে যোগ করুন:'
                : 'Add Custom Food Item & Portion:'}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <input
              type="text"
              value={customFoodName}
              onChange={(e) => setCustomFoodName(e.target.value)}
              placeholder={isBn ? 'খাবারের নাম (যেমন: খিচুড়ি)' : 'Food name'}
              className={`col-span-2 px-3.5 py-2.5 rounded-xl border text-xs font-medium ${
                darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
            <input
              type="text"
              value={customPortion}
              onChange={(e) => setCustomPortion(e.target.value)}
              placeholder={isBn ? 'পরিমাণ (১ বাটি / ১৫০ গ্রাম)' : 'Portion (1 bowl)'}
              className={`px-3.5 py-2.5 rounded-xl border text-xs font-medium ${
                darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
            <input
              type="number"
              value={customCalories}
              onChange={(e) => setCustomCalories(e.target.value)}
              placeholder={isBn ? 'ক্যালোরি (kcal)' : 'Calories'}
              className={`px-3.5 py-2.5 rounded-xl border text-xs font-medium tabular-nums ${
                darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
            <input
              type="number"
              value={customProtein}
              onChange={(e) => setCustomProtein(e.target.value)}
              placeholder={isBn ? 'প্রোটিন (g)' : 'Protein (g)'}
              className={`px-3.5 py-2.5 rounded-xl border text-xs font-medium tabular-nums ${
                darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 text-white font-bold text-xs shadow-md hover:opacity-95 transition-all"
            >
              {isBn ? '+ খাবারে যুক্ত করুন' : '+ Add Food'}
            </button>
          </div>
        </form>
      </div>

      {/* MODE B (AND FULL-DAY SUMMARY): DAILY NUTRITIONAL ANALYSIS BASED ON WHAT USER ATE TODAY */}
      <div
        className={`p-6 md:p-8 rounded-[32px] border shadow-xl space-y-6 ${
          darkMode
            ? 'bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 border-indigo-500/30'
            : 'bg-gradient-to-br from-white via-indigo-50/40 to-emerald-50/40 border-indigo-100'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-500 block">
                {isBn
                  ? 'সারাদিনের খাবারের পুষ্টি ও মেটাবলিক অ্যানালাইসিস'
                  : 'Full-Day Nutritional & Metabolic Analysis'}
              </span>
              <h2 className="text-xl md:text-2xl font-bold">
                {isBn
                  ? 'আজকে আপনি যা খেয়েছেন তার ওপর ভিত্তি করে রিপোর্ট'
                  : 'Personalized Analysis Based on What You Ate Today'}
              </h2>
            </div>
          </div>

          <div className="text-xs font-bold px-3.5 py-2 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20 tabular-nums">
            {isBn
              ? `মোট লগ করা খাবার: ${todayLog.items.length} টি আইটেম`
              : `Total Logged Today: ${todayLog.items.length} items`}
          </div>
        </div>

        {/* All Logged Foods List by Slot (Especially helpful when in Free/Standalone mode) */}
        {!activeComparisonMode && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {SLOT_META.map((slot) => {
              const items = todayLog.items.filter((i) => i.slot === slot.key);
              const slotCals = items.reduce((s, i) => s + i.calories, 0);
              return (
                <div
                  key={slot.key}
                  className={`p-4 rounded-2xl border ${
                    darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs">{isBn ? slot.labelBn : slot.labelEn}</span>
                    <span className="text-xs font-black text-orange-500 tabular-nums">{slotCals} kcal</span>
                  </div>
                  {items.length === 0 ? (
                    <p className="text-[11px] opacity-50 py-2">
                      {isBn ? 'কোনো খাবার যোগ করা হয়নি' : 'Nothing logged'}
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between text-[11px] py-1 border-b last:border-b-0 border-slate-100 dark:border-slate-800"
                        >
                          <span className="font-medium truncate pr-2">{isBn ? item.nameBn : item.nameEn}</span>
                          <div className="flex items-center gap-1.5 shrink-0 tabular-nums">
                            <span className="font-bold">{item.calories}</span>
                            <button
                              onClick={() => handleRemoveFood(item.id)}
                              className="text-rose-500 hover:opacity-80"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Macro Ratio Bar & Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {standaloneInsights.insights.map((ins, i) => (
            <div
              key={i}
              className={`p-5 rounded-3xl border flex flex-col justify-between gap-3 ${
                ins.status === 'good'
                  ? darkMode
                    ? 'bg-emerald-950/30 border-emerald-700/40'
                    : 'bg-emerald-50/90 border-emerald-200'
                  : ins.status === 'warn'
                  ? darkMode
                    ? 'bg-amber-950/30 border-amber-700/40'
                    : 'bg-amber-50/90 border-amber-200'
                  : darkMode
                  ? 'bg-blue-950/30 border-blue-700/40'
                  : 'bg-blue-50/90 border-blue-200'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  {ins.status === 'good' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                  <h4 className="font-bold text-sm">{isBn ? ins.titleBn : ins.titleEn}</h4>
                </div>
                <p className="text-xs opacity-80 leading-relaxed">{isBn ? ins.descBn : ins.descEn}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalorieTrackerView;
