import React, { useState } from 'react';
import { HealthProfile, Language, ProfileRoleType, User } from '../types';

export type DietMakerFeature = 'diet' | 'cookbook' | 'checklist' | 'family_pot';

interface Props {
  user: User | null;
  profile: HealthProfile | null;
  lang: Language;
  darkMode?: boolean;
  onSelectFeature: (feature: DietMakerFeature) => void;
  onStartProfileAndAssessment: (targetFeature: DietMakerFeature, preferredRole?: ProfileRoleType) => void;
}

const DietMakerHub: React.FC<Props> = ({
  user,
  profile,
  lang,
  darkMode,
  onSelectFeature,
  onStartProfileAndAssessment,
}) => {
  const isBn = lang === 'bn';
  const isUnlocked = Boolean(user && profile);
  const [gatedFeaturePrompt, setGatedFeaturePrompt] = useState<DietMakerFeature | null>(null);

  const primaryOptions: {
    id: DietMakerFeature;
    icon: string;
    titleBn: string;
    titleEn: string;
    subtitleBn: string;
    subtitleEn: string;
    badgeBn: string;
    badgeEn: string;
    accentColor: string;
    borderAccent: string;
  }[] = [
    {
      id: 'diet',
      icon: '🥗',
      titleBn: 'মেক ইউর ডায়েট চার্ট',
      titleEn: 'Make Your Diet Chart',
      subtitleBn:
        'ক্লিনিকাল রিপোর্ট, ট্রাফিক লাইট ফুড গাইড সিলেকশন এবং ৪-ফেজের পার্সোনালাইজড ডায়েট চার্ট তৈরি করুন।',
      subtitleEn:
        'Generate your clinical report, customize your Traffic Light food guide, and build a 4-phase diet chart.',
      badgeBn: 'অপশন ১ • ক্লিনিকাল ডায়েট প্ল্যানার',
      badgeEn: 'Option 1 • Clinical Diet Planner',
      accentColor: 'bg-emerald-600',
      borderAccent: 'hover:border-emerald-500',
    },
    {
      id: 'cookbook',
      icon: '👨‍🍳',
      titleBn: 'কুকবুক (Cookbook)',
      titleEn: 'Cookbook',
      subtitleBn:
        'আপনার ডায়েট চার্ট ও শারীরিক কন্ডিশন অনুযায়ী স্বাস্থ্যকর রান্নার রেসিপি এবং ভয়েস গাইডেড কুকিং অ্যাসিস্ট্যান্ট।',
      subtitleEn:
        'Therapeutic recipes and step-by-step voice-guided cooking instructions tailored to your clinical diet chart.',
      badgeBn: 'অপশন ২ • থেরাপিউটিক রেসিপি ও কুকবুক',
      badgeEn: 'Option 2 • Therapeutic Recipes & Cookbook',
      accentColor: 'bg-orange-600',
      borderAccent: 'hover:border-orange-500',
    },
    {
      id: 'checklist',
      icon: '📝',
      titleBn: 'ডেইলি চেক লিস্ট',
      titleEn: 'Daily Checklist',
      subtitleBn:
        'প্রতিদিনের খাবার, পানির হিসাব, ওজন, এনার্জি ও হজম শক্তি লগ করুন এবং সাপ্তাহিক ও মাসিক প্রগ্রেস চার্ট দেখুন।',
      subtitleEn:
        'Log daily meals, water intake, weight, energy & digestion, and view daily, weekly, and monthly progress charts.',
      badgeBn: 'অপশন ৩ • ডেইলি ট্র্যাকার ও প্রগ্রেস চার্ট',
      badgeEn: 'Option 3 • Daily Tracker & Progress Charts',
      accentColor: 'bg-rose-600',
      borderAccent: 'hover:border-rose-500',
    },
  ];

  const handleCardClick = (feature: DietMakerFeature) => {
    if (!isUnlocked) {
      setGatedFeaturePrompt(feature);
      return;
    }
    onSelectFeature(feature);
  };

  const getFeatureLabel = (feature: DietMakerFeature) => {
    if (feature === 'diet') return isBn ? 'মেক ইউর ডায়েট চার্ট' : 'Make Your Diet Chart';
    if (feature === 'cookbook') return isBn ? 'কুকবুক' : 'Cookbook';
    if (feature === 'checklist') return isBn ? 'ডেইলি চেক লিস্ট' : 'Daily Checklist';
    return isBn ? 'ফ্যামিলি পট' : 'Family Pot';
  };

  return (
    <div className="max-w-5xl mx-auto py-4 md:py-8 space-y-8 animate-in fade-in duration-500">
      {/* Header Banner */}
      <div
        className={`p-6 md:p-10 rounded-[36px] border shadow-xl relative overflow-hidden ${
          darkMode
            ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border-slate-800'
            : 'bg-gradient-to-br from-white via-emerald-50/40 to-teal-50/40 border-emerald-100'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
              <span>🍱</span>
              <span>{isBn ? 'ডায়েট মেকার হাব' : 'Clinical Diet Maker Hub'}</span>
            </div>
            <h1 className={`text-3xl md:text-4xl font-bold serif italic ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {isBn ? 'ডায়েট মেকার (Diet Maker)' : 'Diet Maker Studio'}
            </h1>
            <p className={`text-sm md:text-base leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              {isBn
                ? 'এখানে ৩টি প্রধান অপশন রয়েছে: মেক ইউর ডায়েট চার্ট, কুকবুক এবং ডেইলি চেক লিস্ট (সাথে ফ্যামিলি পট)। প্রোফাইল তৈরি এবং অ্যাসেসমেন্ট ফর্ম পূরণ করলেই এই সব ফিচার আনলক হয়ে যাবে।'
                : 'Choose from 3 core clinical tools: Make Your Diet Chart, Cookbook, and Daily Checklist (plus Family Pot). Complete your profile and health assessment to unlock all features.'}
            </p>
          </div>

          {/* Lock / Unlock Status Pill */}
          <div className="shrink-0">
            {isUnlocked ? (
              <div
                className={`p-4 rounded-3xl border flex items-center gap-3.5 ${
                  darkMode ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}
              >
                <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-xl shadow-md">
                  🔓
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider">
                    {isBn ? 'সব ফিচার আনলকড' : 'All Features Unlocked'}
                  </div>
                  <div className="text-xs opacity-75">
                    {user?.name} • {profile?.dosha}
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setGatedFeaturePrompt('diet')}
                className={`p-4 rounded-3xl border flex items-center gap-3.5 text-left transition-all hover:scale-105 active:scale-95 ${
                  darkMode ? 'bg-amber-950/30 border-amber-700/50 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-900 shadow-md'
                }`}
              >
                <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-xl shadow-md">
                  🔒
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider">
                    {isBn ? 'প্রোফাইল ও অ্যাসেসমেন্ট প্রয়োজন' : 'Profile & Assessment Required'}
                  </div>
                  <div className="text-[11px] opacity-80 underline">
                    {isBn ? 'আনলক করতে এখানে ক্লিক করুন →' : 'Click here to unlock →'}
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3 Primary Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {primaryOptions.map((item) => (
          <button
            key={item.id}
            onClick={() => handleCardClick(item.id)}
            className={`group relative p-6 md:p-8 rounded-[32px] border-2 text-left flex flex-col justify-between transition-all hover:-translate-y-1 active:scale-[0.99] shadow-lg ${
              item.borderAccent
            } ${
              darkMode
                ? 'bg-slate-900 border-slate-800 hover:bg-slate-900/90'
                : 'bg-white border-slate-100 hover:shadow-xl'
            }`}
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-2">
                <div
                  className={`w-16 h-16 rounded-2xl ${item.accentColor} text-white flex items-center justify-center text-3xl shadow-lg transition-transform group-hover:scale-110`}
                >
                  {item.icon}
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 border ${
                    isUnlocked
                      ? darkMode
                        ? 'bg-emerald-950/50 border-emerald-700/50 text-emerald-400'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : darkMode
                      ? 'bg-amber-950/50 border-amber-700/50 text-amber-400'
                      : 'bg-amber-50 border-amber-200 text-amber-700'
                  }`}
                >
                  <span>{isUnlocked ? '🔓' : '🔒'}</span>
                  <span>{isUnlocked ? (isBn ? 'আনলকড' : 'Unlocked') : isBn ? 'লকড' : 'Locked'}</span>
                </span>
              </div>

              <div>
                <div className="text-[11px] font-black uppercase tracking-wider opacity-50 mb-1">
                  {isBn ? item.badgeBn : item.badgeEn}
                </div>
                <h2 className={`text-xl md:text-2xl font-bold serif italic mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {isBn ? item.titleBn : item.titleEn}
                </h2>
                <p className={`text-xs md:text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  {isBn ? item.subtitleBn : item.subtitleEn}
                </p>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
              <span className={`text-xs font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                {isUnlocked
                  ? isBn
                    ? 'ওপেন করুন'
                    : 'Open Tool'
                  : isBn
                  ? 'প্রোফাইল ও অ্যাসেসমেন্ট করে আনলক করুন'
                  : 'Complete Profile & Assessment'}
              </span>
              <span className="text-lg transition-transform group-hover:translate-x-1">→</span>
            </div>
          </button>
        ))}
      </div>

      {/* Secondary Integrated Tool inside Diet Maker: Family Pot */}
      <div
        className={`p-6 md:p-8 rounded-[32px] border-2 flex flex-col md:flex-row items-center justify-between gap-6 transition-all ${
          darkMode ? 'bg-slate-900/90 border-slate-800 hover:border-purple-500/60' : 'bg-white border-slate-100 shadow-md hover:border-purple-300'
        }`}
      >
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center text-2xl shadow-lg shrink-0">
            🍲
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`text-lg md:text-xl font-bold serif italic ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {isBn ? 'ফ্যামিলি পট (Family Pot)' : 'Family Pot (One-Pot Family Meals)'}
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  isUnlocked
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                }`}
              >
                {isUnlocked ? (isBn ? '🔓 আনলকড' : '🔓 Unlocked') : isBn ? '🔒 লকড' : '🔒 Locked'}
              </span>
            </div>
            <p className={`text-xs md:text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {isBn
                ? 'ডায়েট মেকারের অংশ হিসেবে পরিবারের সবার জন্য এক হাঁড়িতে রান্না ও সদস্যদের কন্ডিশন অনুযায়ী খাবার মডিফিকেশন।'
                : 'Modify a single family meal to suit both your clinical diet protocol and the rest of your household.'}
            </p>
          </div>
        </div>
        <button
          onClick={() => handleCardClick('family_pot')}
          className="w-full md:w-auto px-6 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-all active:scale-95 shrink-0"
        >
          {isBn ? 'ফ্যামিলি পট খুলুন →' : 'Open Family Pot →'}
        </button>
      </div>

      {/* Gated Prompt Modal when User Clicks Any Option Without Profile + Assessment */}
      {gatedFeaturePrompt && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className={`w-full max-w-xl p-6 md:p-8 rounded-[36px] border-2 shadow-2xl space-y-6 relative ${
              darkMode ? 'bg-slate-900 border-emerald-500/40 text-white' : 'bg-white border-emerald-200 text-slate-900'
            }`}
          >
            <button
              onClick={() => setGatedFeaturePrompt(null)}
              className={`absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
              aria-label="Close"
            >
              ✕
            </button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-3xl shadow-lg shrink-0">
                🔒
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-500 block">
                  {getFeatureLabel(gatedFeaturePrompt)}
                </span>
                <h3 className="text-xl md:text-2xl font-bold serif italic">
                  {isBn ? 'প্রোফাইল এবং অ্যাসেসমেন্ট প্রয়োজন' : 'Profile & Assessment Required'}
                </h3>
              </div>
            </div>

            <div
              className={`p-5 rounded-2xl border-l-4 border-emerald-500 text-sm md:text-base font-medium leading-relaxed ${
                darkMode ? 'bg-slate-800/80 text-slate-200' : 'bg-emerald-50/70 text-slate-800'
              }`}
            >
              {isBn
                ? 'আপনাকে প্রোফাইল করতে হবে এবং একটা অ্যাসেসমেন্ট ফর্ম পূরণ করতে হবে। যখন আপনি প্রোফাইল করবেন এবং অ্যাসেসমেন্ট ফর্ম পূরণ করবেন, এরপর আপনার মেক ইউর ডায়েট চার্ট, কুকবুক এবং ডেইলি চেক লিস্ট ফিচারগুলো আনলক হবে।'
                : 'You must create a profile and complete the clinical assessment form first. Once you create your profile and finish the assessment form, Make Your Diet Chart, Cookbook, and Daily Checklist will be unlocked.'}
            </div>

            {/* Direct 3 Profile Type Selection right in the prompt */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider opacity-70">
                {isBn ? 'আপনি কোন ধরনের প্রোফাইল তৈরি করতে চান বেছে নিন:' : 'Select your profile type to begin:'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => onStartProfileAndAssessment(gatedFeaturePrompt, 'self')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all hover:border-emerald-500 ${
                    darkMode ? 'bg-slate-800/70 border-slate-700' : 'bg-slate-50 border-slate-200 hover:bg-emerald-50/40'
                  }`}
                >
                  <div className="text-2xl mb-1.5">👤</div>
                  <div className="font-bold text-sm">{isBn ? 'নিজের জন্য' : 'For Myself'}</div>
                  <div className="text-[11px] opacity-65 mt-0.5">
                    {isBn ? 'পার্সোনাল ডায়েট ও হেলথ ইন্টারফেস' : 'Personal Diet & Health'}
                  </div>
                </button>

                <button
                  onClick={() => onStartProfileAndAssessment(gatedFeaturePrompt, 'family')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all hover:border-purple-500 ${
                    darkMode ? 'bg-slate-800/70 border-slate-700' : 'bg-slate-50 border-slate-200 hover:bg-purple-50/40'
                  }`}
                >
                  <div className="text-2xl mb-1.5">👨‍👩‍👧‍👦</div>
                  <div className="font-bold text-sm">{isBn ? 'ফ্যামিলির জন্য' : 'For Family'}</div>
                  <div className="text-[11px] opacity-65 mt-0.5">
                    {isBn ? 'ফ্যামিলি পট ও সদস্যদের ডায়েট ইন্টারফেস' : 'Family Diet & Members'}
                  </div>
                </button>

                <button
                  onClick={() => onStartProfileAndAssessment(gatedFeaturePrompt, 'doctor')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all hover:border-blue-500 ${
                    darkMode ? 'bg-slate-800/70 border-slate-700' : 'bg-slate-50 border-slate-200 hover:bg-blue-50/40'
                  }`}
                >
                  <div className="text-2xl mb-1.5">🩺</div>
                  <div className="font-bold text-sm">{isBn ? 'ডাক্তার হিসেবে' : 'As a Doctor'}</div>
                  <div className="text-[11px] opacity-65 mt-0.5">
                    {isBn ? 'রোগী ব্যবস্থাপনা ও ক্লিনিকাল ইন্টারফেস' : 'Clinical Patient Portal'}
                  </div>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => onStartProfileAndAssessment(gatedFeaturePrompt)}
                className="flex-1 py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl transition-all active:scale-95"
              >
                {isBn ? 'প্রোফাইল তৈরি ও অ্যাসেসমেন্ট শুরু করুন →' : 'Create Profile & Start Assessment →'}
              </button>
              <button
                onClick={() => setGatedFeaturePrompt(null)}
                className={`px-5 py-4 rounded-2xl font-bold text-xs uppercase tracking-wider border ${
                  darkMode ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {isBn ? 'পরে করব' : 'Later'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DietMakerHub;
