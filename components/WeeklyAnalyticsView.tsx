import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  BarChart3,
  Flame,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Zap,
  Droplets,
  Scale,
  Award,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { DailyCalorieLog, DietPhaseChart, HealthProfile, Language, User } from '../types';

interface Props {
  user: User | null;
  profile: HealthProfile | null;
  currentChart: DietPhaseChart | null;
  lang: Language;
  darkMode?: boolean;
  dailyLogs: DailyCalorieLog[];
  onNavigateToTracker: () => void;
}

const WeeklyAnalyticsView: React.FC<Props> = ({
  user,
  profile,
  currentChart,
  lang,
  darkMode,
  dailyLogs,
  onNavigateToTracker,
}) => {
  const isBn = lang === 'bn';

  const weeklyChartData = useMemo(() => {
    return dailyLogs.map((day) => {
      const eatenCalories = day.items.reduce((s, i) => s + i.calories, 0);
      const eatenProtein = Math.round(day.items.reduce((s, i) => s + i.protein, 0));
      const eatenCarbs = Math.round(day.items.reduce((s, i) => s + i.carbs, 0));
      const eatenFats = Math.round(day.items.reduce((s, i) => s + i.fats, 0));
      const eatenFiber = Math.round(day.items.reduce((s, i) => s + (i.fiber || 2.5), 0));

      const calPct = Math.min(125, Math.round((eatenCalories / Math.max(1, day.targetCalories)) * 100));
      const protPct = Math.min(125, Math.round((eatenProtein / Math.max(1, day.targetProtein)) * 100));
      const carbPct = Math.min(125, Math.round((eatenCarbs / Math.max(1, day.targetCarbs)) * 100));
      const fatPct = Math.min(125, Math.round((eatenFats / Math.max(1, day.targetFats)) * 100));
      const waterPct = Math.min(125, Math.round(((day.waterGlasses || 0) / 8) * 100));

      const overallMet =
        calPct >= 85 && calPct <= 110 && protPct >= 85 && waterPct >= 75;

      return {
        date: day.date,
        name: isBn ? day.dayLabelBn : day.dayLabelEn,
        calories: eatenCalories,
        targetCalories: day.targetCalories,
        protein: eatenProtein,
        targetProtein: day.targetProtein,
        carbs: eatenCarbs,
        targetCarbs: day.targetCarbs,
        fats: eatenFats,
        targetFats: day.targetFats,
        fiber: eatenFiber,
        water: day.waterGlasses || 0,
        calPct,
        protPct,
        carbPct,
        fatPct,
        waterPct,
        overallMet,
      };
    });
  }, [dailyLogs, isBn]);

  const summary = useMemo(() => {
    const count = Math.max(1, weeklyChartData.length);
    const avgCalories = Math.round(weeklyChartData.reduce((s, d) => s + d.calories, 0) / count);
    const avgTargetCalories = Math.round(weeklyChartData.reduce((s, d) => s + d.targetCalories, 0) / count);
    const avgProteinPct = Math.round(weeklyChartData.reduce((s, d) => s + Math.min(100, d.protPct), 0) / count);
    const avgCarbPct = Math.round(weeklyChartData.reduce((s, d) => s + Math.min(100, d.carbPct), 0) / count);
    const avgFatPct = Math.round(weeklyChartData.reduce((s, d) => s + Math.min(100, d.fatPct), 0) / count);
    const avgWaterPct = Math.round(weeklyChartData.reduce((s, d) => s + Math.min(100, d.waterPct), 0) / count);
    const daysRequirementMet = weeklyChartData.filter((d) => d.overallMet).length;

    return {
      avgCalories,
      avgTargetCalories,
      avgProteinPct,
      avgCarbPct,
      avgFatPct,
      avgWaterPct,
      daysRequirementMet,
      totalDays: weeklyChartData.length,
    };
  }, [weeklyChartData]);

  const requirementBars = [
    {
      labelBn: 'প্রোটিন রিকোয়ারমেন্ট (১ গ্রাম/কেজি - ৩০%)',
      labelEn: 'Daily Protein Requirement (1g/kg - 30%)',
      pct: summary.avgProteinPct,
      gradient: 'from-emerald-500 to-teal-600',
      textColor: 'text-emerald-500',
      statusBn: summary.avgProteinPct >= 85 ? 'চাহিদা পূরণ হচ্ছে' : 'আরও প্রোটিন প্রয়োজন',
      statusEn: summary.avgProteinPct >= 85 ? 'Requirement Met' : 'Needs Boost',
    },
    {
      labelBn: 'কার্বোহাইড্রেট ব্যালেন্স (৪০% এনার্জি)',
      labelEn: 'Carbohydrate Balance (40% Energy)',
      pct: summary.avgCarbPct,
      gradient: 'from-violet-500 to-purple-600',
      textColor: 'text-violet-500',
      statusBn: summary.avgCarbPct >= 80 && summary.avgCarbPct <= 110 ? 'নিয়ন্ত্রিত ও সুষম' : 'পরিমিত রাখুন',
      statusEn: summary.avgCarbPct >= 80 && summary.avgCarbPct <= 110 ? 'Well Balanced' : 'Monitor Portion',
    },
    {
      labelBn: 'স্বাস্থ্যকর ফ্যাট ও ওমেগা (৩০% লক্ষ্যমাত্রা)',
      labelEn: 'Healthy Fats & Omega (30% Target)',
      pct: summary.avgFatPct,
      gradient: 'from-amber-500 to-orange-600',
      textColor: 'text-amber-500',
      statusBn: summary.avgFatPct >= 80 ? 'সুষম ফ্যাট ইনটেক' : 'বাদাম/বীজ যোগ করুন',
      statusEn: summary.avgFatPct >= 80 ? 'Optimal Healthy Fats' : 'Add Seeds/Nuts',
    },
    {
      labelBn: 'দৈনিক পানি ও হাইড্রেশন (৮-১০ গ্লাস)',
      labelEn: 'Daily Hydration Target (8-10 Glasses)',
      pct: summary.avgWaterPct,
      gradient: 'from-sky-500 to-blue-600',
      textColor: 'text-sky-500',
      statusBn: summary.avgWaterPct >= 80 ? 'হাইড্রেশন সম্পূর্ণ' : 'পানি পান বাড়ান',
      statusEn: summary.avgWaterPct >= 80 ? 'Hydration Optimal' : 'Drink More Water',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Figma-Grade Colorful Analytics Hero Banner */}
      <div
        className={`relative rounded-[36px] p-6 md:p-9 border overflow-hidden shadow-2xl ${
          darkMode
            ? 'bg-gradient-to-br from-slate-900 via-indigo-950/50 to-purple-950/40 border-indigo-500/30'
            : 'bg-gradient-to-br from-indigo-50 via-purple-50/60 to-sky-50 border-indigo-200/80'
        }`}
      >
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-gradient-to-tr from-emerald-500/15 to-sky-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{isBn ? 'সাপ্তাহিক প্রগ্রেস ও পুষ্টি অ্যানালিটিক্স' : 'Weekly Progress & Nutrition Analytics'}</span>
            </div>

            <h1 className={`text-2xl md:text-4xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {isBn
                ? 'সাপ্তাহিক ক্যালোরি ও ডেইলি রিকোয়ারমেন্ট রিপোর্ট'
                : 'Weekly Calorie Intake & Daily Requirement Fulfillment'}
            </h1>

            <p className={`text-xs md:text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              {isBn
                ? 'সপ্তাহের কোন দিন আপনি কত ক্যালোরি গ্রহণ করছেন এবং আপনার শরীরের প্রতিদিনের প্রোটিন, কার্ব, ফ্যাট ও পানির রিকোয়ারমেন্ট পূরণ হচ্ছে কি না তা চার্টের মাধ্যমে দেখুন।'
                : 'Track how many calories you consume each day of the week and verify whether your daily protein, macro, and hydration requirements are consistently met.'}
            </p>
          </div>

          <div className="shrink-0">
            <button
              onClick={onNavigateToTracker}
              className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white font-bold text-xs shadow-xl flex items-center gap-2 transition-all active:scale-95"
            >
              <Flame className="w-4 h-4" />
              <span>{isBn ? 'আজকের খাবার ক্যালোরি ট্র্যাকারে যোগ করুন →' : 'Log Today’s Food in Calorie Tracker →'}</span>
            </button>
          </div>
        </div>

        {/* 4 Key Weekly KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-7">
          <div
            className={`p-4 md:p-5 rounded-3xl border backdrop-blur-md ${
              darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/90 border-white shadow-md'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-60">
                {isBn ? 'সাপ্তাহিক গড় ক্যালোরি' : 'Weekly Avg Calories'}
              </span>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 text-white flex items-center justify-center shadow-md">
                <Flame className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-black tabular-nums">
              {summary.avgCalories} <span className="text-xs font-bold opacity-60">kcal/day</span>
            </div>
            <p className="text-[11px] font-bold mt-1.5 text-emerald-500 tabular-nums">
              {isBn ? `দৈনিক টার্গেট: ${summary.avgTargetCalories} kcal` : `Daily Target: ${summary.avgTargetCalories} kcal`}
            </p>
          </div>

          <div
            className={`p-4 md:p-5 rounded-3xl border backdrop-blur-md ${
              darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/90 border-white shadow-md'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-60">
                {isBn ? 'রিকোয়ারমেন্ট পূরণের দিন' : 'Days Requirement Met'}
              </span>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-black tabular-nums text-emerald-500">
              {summary.daysRequirementMet} / {summary.totalDays}{' '}
              <span className="text-xs font-bold opacity-70">{isBn ? 'দিন' : 'days'}</span>
            </div>
            <p className="text-[11px] font-bold mt-1.5 opacity-75">
              {isBn ? 'ক্যালোরি ও প্রোটিন লক্ষ্যমাত্রা অনুযায়ী' : 'Based on calorie & protein goals'}
            </p>
          </div>

          <div
            className={`p-4 md:p-5 rounded-3xl border backdrop-blur-md ${
              darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/90 border-white shadow-md'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-60">
                {isBn ? 'গড় প্রোটিন পূরণ' : 'Avg Protein Fulfillment'}
              </span>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-black tabular-nums text-indigo-500">
              {summary.avgProteinPct}%
            </div>
            <p className="text-[11px] font-bold mt-1.5 opacity-75">
              {isBn ? '১ গ্রাম/কেজি প্রোটিন স্ট্যান্ডার্ড' : '1g/kg body weight standard'}
            </p>
          </div>

          <div
            className={`p-4 md:p-5 rounded-3xl border backdrop-blur-md ${
              darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/90 border-white shadow-md'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-60">
                {isBn ? 'হাইড্রেশন ও ওয়াটার' : 'Weekly Hydration'}
              </span>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-md">
                <Droplets className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-black tabular-nums text-sky-500">
              {summary.avgWaterPct}%
            </div>
            <p className="text-[11px] font-bold mt-1.5 opacity-75">
              {isBn ? 'দৈনিক ৮ গ্লাস পানির তুলনায়' : 'Compared to 8 glasses/day'}
            </p>
          </div>
        </div>
      </div>

      {/* CHART 1: 7-Day Calorie Intake vs Daily Target */}
      <div
        className={`p-6 md:p-8 rounded-[32px] border shadow-xl space-y-6 ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-orange-500 block">
              {isBn ? 'চার্ট ১ • সাপ্তাহিক ক্যালোরি ট্রেন্ড' : 'Chart 1 • 7-Day Calorie Intake vs Target'}
            </span>
            <h2 className="text-xl md:text-2xl font-bold">
              {isBn
                ? 'কোন দিন কত ক্যালোরি গ্রহণ করেছেন বনাম দৈনিক টার্গেট'
                : 'Daily Calories Consumed vs. Daily Calorie Requirement'}
            </h2>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-orange-500 inline-block" />
              {isBn ? 'গ্রহণকৃত ক্যালোরি (kcal)' : 'Calories Eaten'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              {isBn ? 'দৈনিক ক্যালোরি টার্গেট' : 'Daily Target'}
            </span>
          </div>
        </div>

        <div className="h-72 md:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={weeklyChartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#1e293b' : '#e2e8f0'} />
              <XAxis dataKey="name" stroke={darkMode ? '#94a3b8' : '#475569'} fontSize={12} />
              <YAxis stroke={darkMode ? '#94a3b8' : '#475569'} fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: darkMode ? '#0f172a' : '#ffffff',
                  borderColor: darkMode ? '#334155' : '#e2e8f0',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              />
              <Bar
                dataKey="calories"
                name={isBn ? 'গ্রহণকৃত ক্যালোরি' : 'Calories Eaten'}
                fill="#f97316"
                radius={[10, 10, 0, 0]}
                barSize={36}
              />
              <Line
                type="monotone"
                dataKey="targetCalories"
                name={isBn ? 'টার্গেট ক্যালোরি' : 'Target Calories'}
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 5, fill: '#10b981' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CHART 2 & PROGRESS BARS: Daily Macro & Requirement Fulfillment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Daily Requirement Fulfillment Progress Bars */}
        <div
          className={`p-6 md:p-8 rounded-[32px] border shadow-xl space-y-6 ${
            darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80'
          }`}
        >
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-500 block">
              {isBn ? 'ডেইলি রিকোয়ারমেন্ট চেক' : 'Daily Nutritional Requirement Check'}
            </span>
            <h3 className="text-lg md:text-xl font-bold">
              {isBn
                ? 'আপনার প্রতিদিনের পুষ্টি চাহিদা পূরণ হচ্ছে কি না'
                : 'Are Your Daily Nutritional Requirements Being Met?'}
            </h3>
          </div>

          <div className="space-y-5">
            {requirementBars.map((req, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>{isBn ? req.labelBn : req.labelEn}</span>
                  <div className="flex items-center gap-2 tabular-nums">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] bg-slate-500/10 ${req.textColor}`}>
                      {isBn ? req.statusBn : req.statusEn}
                    </span>
                    <span className="font-black text-sm">{req.pct}%</span>
                  </div>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${req.gradient} transition-all duration-500`}
                    style={{ width: `${Math.min(100, req.pct)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: 7-Day Macro Breakdown Chart (Protein, Carbs, Fats in Grams) */}
        <div
          className={`p-6 md:p-8 rounded-[32px] border shadow-xl space-y-6 ${
            darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80'
          }`}
        >
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-indigo-500 block">
              {isBn ? 'চার্ট ২ • সাপ্তাহিক ম্যাক্রো রিকোয়ারমেন্ট (গ্রাম)' : 'Chart 2 • 7-Day Macro Breakdown (Grams)'}
            </span>
            <h3 className="text-lg md:text-xl font-bold">
              {isBn
                ? 'প্রতিদিনের প্রোটিন, কার্ব ও ফ্যাট গ্রহণের চিত্র'
                : 'Daily Protein, Carbohydrate & Fat Intake Across the Week'}
            </h3>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#1e293b' : '#e2e8f0'} />
                <XAxis dataKey="name" stroke={darkMode ? '#94a3b8' : '#475569'} fontSize={12} />
                <YAxis stroke={darkMode ? '#94a3b8' : '#475569'} fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? '#0f172a' : '#ffffff',
                    borderColor: darkMode ? '#334155' : '#e2e8f0',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 700 }} />
                <Bar
                  dataKey="protein"
                  name={isBn ? 'প্রোটিন (g)' : 'Protein (g)'}
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="carbs"
                  name={isBn ? 'কার্বোহাইড্রেট (g)' : 'Carbs (g)'}
                  fill="#8b5cf6"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="fats"
                  name={isBn ? 'ফ্যাট (g)' : 'Fats (g)'}
                  fill="#f59e0b"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* High-Density 7-Day Tabular Ledger */}
      <div
        className={`p-6 md:p-8 rounded-[32px] border shadow-xl space-y-4 ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-indigo-500 block">
              {isBn ? 'সাপ্তাহিক বিস্তারিত লগ টেবিল' : '7-Day Detailed Nutrition Ledger'}
            </span>
            <h3 className="text-lg md:text-xl font-bold">
              {isBn ? 'দিনভিত্তিক ক্যালোরি ও রিকোয়ারমেন্ট স্ট্যাটাস' : 'Day-by-Day Calorie & Requirement Status'}
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
                className={`border-b text-[11px] font-black uppercase tracking-wider ${
                  darkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
                }`}
              >
                <th className="py-3 px-3">{isBn ? 'দিন' : 'Day'}</th>
                <th className="py-3 px-3 text-right">{isBn ? 'গ্রহণকৃত ক্যালোরি' : 'Eaten kcal'}</th>
                <th className="py-3 px-3 text-right">{isBn ? 'টার্গেট ক্যালোরি' : 'Target kcal'}</th>
                <th className="py-3 px-3 text-right">{isBn ? 'প্রোটিন' : 'Protein'}</th>
                <th className="py-3 px-3 text-right">{isBn ? 'কার্ব / ফ্যাট' : 'Carbs / Fats'}</th>
                <th className="py-3 px-3 text-right">{isBn ? 'পানি' : 'Water'}</th>
                <th className="py-3 px-3 text-right">{isBn ? 'রিকোয়ারমেন্ট স্ট্যাটাস' : 'Requirement Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800 text-xs font-bold tabular-nums">
              {weeklyChartData.map((row, i) => (
                <tr
                  key={row.date + i}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3.5 px-3 font-extrabold">{row.name}</td>
                  <td className="py-3.5 px-3 text-right text-orange-500 font-black">{row.calories} kcal</td>
                  <td className="py-3.5 px-3 text-right opacity-70">{row.targetCalories} kcal</td>
                  <td className="py-3.5 px-3 text-right text-emerald-500">
                    {row.protein}g / {row.targetProtein}g
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <span className="text-violet-500">{row.carbs}g</span> •{' '}
                    <span className="text-amber-500">{row.fats}g</span>
                  </td>
                  <td className="py-3.5 px-3 text-right text-sky-500">{row.water} {isBn ? 'গ্লাস' : 'gl'}</td>
                  <td className="py-3.5 px-3 text-right">
                    {row.overallMet ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        {isBn ? 'চাহিদা পূরণ হয়েছে' : 'Requirement Met'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                        <AlertCircle className="w-3 h-3" />
                        {isBn ? 'আংশিক পূরণ' : 'Partially Met'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WeeklyAnalyticsView;
