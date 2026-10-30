import React, { useState } from 'react';
import {
  UtensilsCrossed,
  ChefHat,
  ClipboardCheck,
  Soup,
  Lock,
  Unlock,
  UserCircle2,
  Users,
  Stethoscope,
  Sparkles,
  ArrowRight,
  X,
} from 'lucide-react';
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
    icon: React.ElementType;
    titleBn: string;
    titleEn: string;
    subtitleBn: string;
    subtitleEn: string;
    badgeBn: string;
    badgeEn: string;
    iconGradient: string;
    shadowColor: string;
    surfaceLight: string;
    surfaceDark: string;
  }[] = [
    {
      id: 'diet',
      icon: UtensilsCrossed,
      titleBn: 'মেক ইউর ডায়েট চার্ট',
      titleEn: 'Make Your Diet Chart',
      subtitleBn:
        'ক্লিনিকাল রিপোর্ট, ট্রাফিক লাইট ফুড গাইড সিলেকশন এবং ৪-ফেজের পার্সোনালাইজড ডায়েট চার্ট তৈরি করুন।',
      subtitleEn:
        'Generate your clinical report, customize your Traffic Light food guide, and build a 4-phase diet chart.',
      badgeBn: 'অপশন ১ • ক্লিনিকাল ডায়েট প্ল্যানার',
      badgeEn: 'Option 1 • Clinical Diet Planner',
      iconGradient: 'from-emerald-500 via-teal-500 to-cyan-600',
      shadowColor: 'shadow-emerald-500/30',
      surfaceLight: 'from-emerald-50/90 via-white to-teal-50/60 border-emerald-200/80 hover:border-emerald-400',
      surfaceDark: 'from-emerald-950/40 via-slate-900 to-teal-950/30 border-emerald-500/30 hover:border-emerald-400',
    },
    {
      id: 'cookbook',
      icon: ChefHat,
      titleBn: 'কুকবুক (Cookbook)',
      titleEn: 'Therapeutic Cookbook',
      subtitleBn:
        'আপনার ডায়েট চার্ট ও শারীরিক কন্ডিশন অনুযায়ী স্বাস্থ্যকর রান্নার রেসিপি এবং ভয়েস গাইডেড কুকিং অ্যাসিস্ট্যান্ট।',
      subtitleEn:
        'Therapeutic recipes and step-by-step voice-guided cooking instructions tailored to your clinical diet chart.',
      badgeBn: 'অপশন ২ • থেরাপিউটিক রেসিপি ও কুকবুক',
      badgeEn: 'Option 2 • Therapeutic Recipes & Cookbook',
      iconGradient: 'from-orange-500 via-amber-500 to-red-500',
      shadowColor: 'shadow-orange-500/30',
      surfaceLight: 'from-orange-50/90 via-white to-amber-50/60 border-orange-200/80 hover:border-orange-400',
      surfaceDark: 'from-orange-950/40 via-slate-900 to-amber-950/30 border-orange-500/30 hover:border-orange-400',
    },
    {
      id: 'checklist',
      icon: ClipboardCheck,
      titleBn: 'ডেইলি চেকলিস্ট, ডায়েট অ্যালার্ম ও পানির রিমাইন্ডার',
      titleEn: 'Daily Checklist, Diet Alarm & Water Reminder',
      subtitleBn:
        'হ্যাপটিক ভাইব্রেশন সহ ডেইলি চেক-ইন, প্রতি বেলার ফুড মেনু সহ ডায়েট অ্যালার্ম, অটোমেটিক পানির রিমাইন্ডার এবং প্রগ্রেস চার্ট।',
      subtitleEn:
        'Haptic vibration daily check-ins, mealtime alarms with prescribed food menus, smart water reminders, and adherence logs.',
      badgeBn: 'অপশন ৩ • হ্যাপটিক চেক-ইন, ফুড অ্যালার্ম ও পানির রিমাইন্ডার',
      badgeEn: 'Option 3 • Haptic Check-in, Food Alarm & Water Reminder',
      iconGradient: 'from-rose-500 via-pink-500 to-fuchsia-600',
      shadowColor: 'shadow-rose-500/30',
      surfaceLight: 'from-rose-50/90 via-white to-pink-50/60 border-rose-200/80 hover:border-rose-400',
      surfaceDark: 'from-rose-950/40 via-slate-900 to-pink-950/30 border-rose-500/30 hover:border-rose-400',
    },
  ];

  const isFamilyProfile = Boolean(
    user && (user.profileType === 'family' || user.isFamilyManager)
  );

  const handleCardClick = (feature: DietMakerFeature) => {
    if (feature === 'family_pot' || feature === 'checklist') {
      // Family Pot and Daily Checklist (with Diet Alarms & Water Reminder) are accessible directly
      onSelectFeature(feature);
      return;
    }
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
      {/* Figma-Grade Vibrant Header Banner */}
      <div
        className={`p-6 md:p-10 rounded-[36px] border shadow-2xl relative overflow-hidden ${
          darkMode
            ? 'bg-gradient-to-br from-slate-900 via-emerald-950/45 to-teal-950/40 border-emerald-500/30'
            : 'bg-gradient-to-br from-emerald-50 via-teal-50/60 to-cyan-50 border-emerald-200/80'
        }`}
      >
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-gradient-to-br from-emerald-400/20 to-teal-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isBn ? 'ডায়েট মেকার হাব' : 'Clinical Diet Maker Hub'}</span>
            </div>
            <h1 className={`text-3xl md:text-4xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {isBn ? 'ডায়েট মেকার (Diet Maker Studio)' : 'Diet Maker Studio'}
            </h1>
            <p className={`text-xs md:text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
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
                  darkMode
                    ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300'
                    : 'bg-white/90 border-emerald-200 text-emerald-800 shadow-md'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg">
                  <Unlock className="w-6 h-6" />
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
                  darkMode
                    ? 'bg-amber-950/40 border-amber-700/60 text-amber-300'
                    : 'bg-white/95 border-amber-300 text-amber-900 shadow-lg'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg">
                  <Lock className="w-6 h-6" />
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
        {primaryOptions.map((item) => {
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleCardClick(item.id)}
              className={`group relative p-6 md:p-8 rounded-[32px] border-2 text-left flex flex-col justify-between transition-all hover:-translate-y-1 active:scale-[0.99] shadow-xl bg-gradient-to-br ${
                darkMode ? item.surfaceDark : item.surfaceLight
              }`}
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-2">
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.iconGradient} text-white flex items-center justify-center shadow-xl ${item.shadowColor} transition-transform group-hover:scale-110`}
                  >
                    <IconComponent className="w-8 h-8" strokeWidth={2.2} />
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 border ${
                      isUnlocked
                        ? darkMode
                          ? 'bg-emerald-950/60 border-emerald-700/50 text-emerald-400'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : darkMode
                        ? 'bg-amber-950/60 border-amber-700/50 text-amber-400'
                        : 'bg-amber-50 border-amber-200 text-amber-700'
                    }`}
                  >
                    {isUnlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    <span>{isUnlocked ? (isBn ? 'আনলকড' : 'Unlocked') : isBn ? 'লকড' : 'Locked'}</span>
                  </span>
                </div>

                <div>
                  <div className="text-[11px] font-black uppercase tracking-wider opacity-60 mb-1">
                    {isBn ? item.badgeBn : item.badgeEn}
                  </div>
                  <h2 className={`text-xl md:text-2xl font-extrabold tracking-tight mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {isBn ? item.titleBn : item.titleEn}
                  </h2>
                  <p className={`text-xs md:text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    {isBn ? item.subtitleBn : item.subtitleEn}
                  </p>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                <span className={`text-xs font-extrabold ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                  {isUnlocked
                    ? isBn
                      ? 'ওপেন করুন'
                      : 'Open Tool'
                    : isBn
                    ? 'প্রোফাইল ও অ্যাসেসমেন্ট করে আনলক করুন'
                    : 'Complete Profile & Assessment'}
                </span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Secondary Integrated Tool inside Diet Maker: Family Pot */}
      <div
        className={`p-6 md:p-8 rounded-[32px] border-2 flex flex-col md:flex-row items-center justify-between gap-6 transition-all bg-gradient-to-r ${
          darkMode
            ? 'from-purple-950/40 via-slate-900 to-indigo-950/35 border-purple-500/30 hover:border-purple-400'
            : 'from-purple-50/90 via-white to-indigo-50/70 border-purple-200 shadow-lg hover:border-purple-400'
        }`}
      >
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-600 text-white flex items-center justify-center shadow-xl shadow-purple-500/30 shrink-0">
            <Soup className="w-8 h-8" strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className={`text-lg md:text-xl font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {isBn ? 'ফ্যামিলি পট (Family Pot)' : 'Family Pot (One-Pot Family Meals)'}
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${
                  isFamilyProfile
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30'
                }`}
              >
                {isFamilyProfile ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                <span>
                  {isFamilyProfile
                    ? isBn
                      ? 'ফ্যামিলি প্রোফাইলে চালু'
                      : 'Active (Family Profile)'
                    : isBn
                    ? 'শুধুমাত্র ফ্যামিলি প্রোফাইলে চালু (ইন্ডিভিজুয়াল প্রিভিউ)'
                    : 'Family Profile Only (Preview Mode)'}
                </span>
              </span>
            </div>
            <p className={`text-xs md:text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              {isFamilyProfile
                ? isBn
                  ? 'পরিবারের সবার জন্য এক হাঁড়িতে রান্না ও সদস্যদের কন্ডিশন অনুযায়ী খাবার মডিফিকেশন প্ল্যানার।'
                  : 'Modify a single family meal to suit both your clinical diet protocol and the rest of your household.'
                : isBn
                ? 'ফ্যামিলি পট শুধুমাত্র ফ্যামিলি প্রোফাইলের জন্য চালু থাকে। ইন্ডিভিজুয়াল ইউজাররা ফ্যামিলি পট কী এবং এর কাজ কী তা দেখতে পারবেন।'
                : 'Active exclusively for Family Profiles. Individual users can view what Family Pot is and how it works.'}
            </p>
          </div>
        </div>
        <button
          onClick={() => handleCardClick('family_pot')}
          className="w-full md:w-auto px-6 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-xl shadow-purple-600/25 transition-all active:scale-95 shrink-0 flex items-center justify-center gap-2"
        >
          <span>
            {isFamilyProfile
              ? isBn
                ? 'ফ্যামিলি পট খুলুন'
                : 'Open Family Pot'
              : isBn
              ? 'ফ্যামিলি পট কী ও কাজ কী দেখুন'
              : 'See What Family Pot Does'}
          </span>
          <ArrowRight className="w-4 h-4" />
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
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg shrink-0">
                <Lock className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-500 block">
                  {getFeatureLabel(gatedFeaturePrompt)}
                </span>
                <h3 className="text-xl md:text-2xl font-extrabold">
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
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center mb-2 shadow-md">
                    <UserCircle2 className="w-5 h-5" />
                  </div>
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
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center mb-2 shadow-md">
                    <Users className="w-5 h-5" />
                  </div>
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
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white flex items-center justify-center mb-2 shadow-md">
                    <Stethoscope className="w-5 h-5" />
                  </div>
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
                className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-xl transition-all active:scale-95"
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
