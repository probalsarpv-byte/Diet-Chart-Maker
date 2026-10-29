import React from 'react';
import {
  UtensilsCrossed,
  ChefHat,
  ClipboardCheck,
  Soup,
  UserCircle2,
  Trophy,
  Calculator,
  BookOpen,
  ShoppingBag,
  Users,
  Flame,
  BarChart3,
  Sparkles,
  Lock,
  Unlock,
  ArrowRight,
  Stethoscope,
  HeartHandshake,
  Bot,
} from 'lucide-react';
import { HealthProfile, Language, User } from '../types';
import { translations } from '../i18n';
import { isAdminEmail } from '../firebase';

interface Props {
  onNavigate: (view: any) => void;
  lang: Language;
  darkMode?: boolean;
  user?: User | null;
  profile?: HealthProfile | null;
}

const HomeGrid: React.FC<Props> = ({ onNavigate, lang, darkMode, user, profile }) => {
  const t = translations[lang];
  const isBn = lang === 'bn';
  const isUnlocked = Boolean(user && profile);
  const isAuthenticatedAdmin = Boolean(
    user?.isAdmin && user?.firebaseUid && isAdminEmail(user?.email)
  );

  const getRoleBadge = () => {
    if (!user) return isBn ? 'গেস্ট মোড (প্রোফাইল ঐচ্ছিক)' : 'Guest Mode (Profile Optional)';
    const r = user.profileType || (user.id.startsWith('DOC-') ? 'doctor' : user.isFamilyManager ? 'family' : 'self');
    if (r === 'doctor') return isBn ? 'ডাক্তার প্রোফাইল' : 'Doctor Profile';
    if (r === 'family') return isBn ? 'ফ্যামিলি প্রোফাইল' : 'Family Profile';
    return isBn ? 'নিজের প্রোফাইল (Self)' : 'Personal Profile (Self)';
  };

  // Colorful Figma-styled feature cards outside Diet Maker
  const allMenuItems = [
    {
      id: 'calorie_tracker',
      icon: Flame,
      label: isBn ? 'ডেইলি ক্যালোরি ট্র্যাকার' : 'Daily Calorie Tracker',
      sub: isUnlocked
        ? isBn
          ? 'ডায়েট চার্ট বনাম আজকের খাবার কম্পারিজন'
          : 'Diet Chart vs. Daily Food Comparison'
        : isBn
        ? 'প্রোফাইল ছাড়াও সারাদিনের খাবার অ্যানালাইসিস'
        : 'Full-Day Food & Macro Analysis',
      badge: isBn ? 'নতুন • ফ্রি ও প্রো' : 'New • Free & Pro',
      iconGradient: 'from-orange-500 via-amber-500 to-rose-600',
      shadowColor: 'shadow-orange-500/30',
      surfaceLight: 'from-orange-50/90 via-white to-amber-50/60 border-orange-200/80 hover:border-orange-400',
      surfaceDark: 'from-orange-950/35 via-slate-900 to-rose-950/25 border-orange-500/30 hover:border-orange-400',
      badgeStyle: 'bg-orange-500/15 text-orange-600 dark:text-orange-300 border-orange-500/30',
    },
    {
      id: 'analytics',
      icon: BarChart3,
      label: isBn ? 'সাপ্তাহিক প্রগ্রেস ও অ্যানালিটিক্স' : 'Weekly Progress & Analytics',
      sub: isBn ? 'কোন দিন কত ক্যালোরি ও রিকোয়ারমেন্ট চার্ট' : '7-Day Calorie & Macro Requirement Charts',
      badge: isBn ? 'উইকলি চার্ট' : 'Weekly Charts',
      iconGradient: 'from-indigo-500 via-purple-500 to-violet-600',
      shadowColor: 'shadow-indigo-500/30',
      surfaceLight: 'from-indigo-50/90 via-white to-purple-50/60 border-indigo-200/80 hover:border-indigo-400',
      surfaceDark: 'from-indigo-950/35 via-slate-900 to-purple-950/25 border-indigo-500/30 hover:border-indigo-400',
      badgeStyle: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30',
    },
    {
      id: 'messages',
      icon: Bot,
      label: isBn ? 'AI নিউট্রিশন ও ক্লিনিক্যাল চ্যাটবট' : 'AI Nutrition & Clinical Coach',
      sub: isBn
        ? 'আপনার প্রোফাইল, ডায়েট চার্ট ও মাইলস্টোন অনুযায়ী উত্তর (Gemini Free)'
        : 'Personalized Answers from Your Profile & Diet Chart (Gemini Free)',
      badge: isBn ? 'ব্যক্তিগতকৃত AI' : 'Individualized AI',
      iconGradient: 'from-emerald-500 via-teal-500 to-cyan-600',
      shadowColor: 'shadow-emerald-500/30',
      surfaceLight: 'from-emerald-50/90 via-white to-teal-50/60 border-emerald-200/80 hover:border-emerald-400',
      surfaceDark: 'from-emerald-950/35 via-slate-900 to-teal-950/25 border-emerald-500/30 hover:border-emerald-400',
      badgeStyle: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    },
    {
      id: 'profile',
      icon: UserCircle2,
      label: isBn ? 'প্রোফাইল (নিজের / ফ্যামিলি / ডাক্তার)' : t.nav_profile,
      sub: isUnlocked
        ? getRoleBadge()
        : isBn
        ? '৩ ধরনের প্রোফাইল ইন্টারফেস'
        : '3 Profile Interfaces',
      badge: isBn ? '৩টি রোল' : '3 Role Portals',
      iconGradient: 'from-blue-500 via-sky-500 to-cyan-600',
      shadowColor: 'shadow-blue-500/30',
      surfaceLight: 'from-blue-50/90 via-white to-cyan-50/60 border-blue-200/80 hover:border-blue-400',
      surfaceDark: 'from-blue-950/35 via-slate-900 to-cyan-950/25 border-blue-500/30 hover:border-blue-400',
      badgeStyle: 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30',
    },
    {
      id: 'leaderboard',
      icon: Trophy,
      label: isBn ? 'লিডারবোর্ড (Leaderboard)' : t.nav_leaderboard,
      sub: isBn ? 'সবার জন্য উন্মুক্ত হেলথ র‍্যাঙ্কিং' : 'Public Health Streak Rankings',
      badge: isBn ? 'সবার জন্য উন্মুক্ত' : 'Open Access',
      iconGradient: 'from-amber-400 via-yellow-500 to-orange-500',
      shadowColor: 'shadow-amber-500/30',
      surfaceLight: 'from-amber-50/90 via-white to-yellow-50/60 border-amber-200/80 hover:border-amber-400',
      surfaceDark: 'from-amber-950/35 via-slate-900 to-yellow-950/25 border-amber-500/30 hover:border-amber-400',
      badgeStyle: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    },
    {
      id: 'calculator',
      icon: Calculator,
      label: isBn ? 'হেলথ ক্যালকুলেটর ও অ্যাসেসমেন্ট' : `${t.nav_calculator} & Assessments`,
      sub: isBn ? 'বিএমআই, বিএমআর, ওয়েট ও হেলথ টেস্ট বক্স' : 'BMI, BMR & Clinical Health Checks',
      badge: isBn ? 'ফ্রি হেলথ টুলস' : 'Free Tools',
      iconGradient: 'from-pink-500 via-rose-500 to-fuchsia-600',
      shadowColor: 'shadow-pink-500/30',
      surfaceLight: 'from-pink-50/90 via-white to-rose-50/60 border-pink-200/80 hover:border-pink-400',
      surfaceDark: 'from-pink-950/35 via-slate-900 to-fuchsia-950/25 border-pink-500/30 hover:border-pink-400',
      badgeStyle: 'bg-pink-500/15 text-pink-600 dark:text-pink-300 border-pink-500/30',
    },
    {
      id: 'food_recognition',
      icon: BookOpen,
      label: isBn ? 'ফুড গ্লোসারি ও পুষ্টি গাইড' : t.nav_food_rec,
      sub: isBn ? 'দেশি খাবারের ক্যালোরি ও উপকারিতা' : 'Bangladesh Food Composition Guide',
      badge: isBn ? 'ফুড ডাটাবেস' : 'Food DB',
      iconGradient: 'from-teal-500 via-emerald-500 to-cyan-600',
      shadowColor: 'shadow-teal-500/30',
      surfaceLight: 'from-teal-50/90 via-white to-emerald-50/60 border-teal-200/80 hover:border-teal-400',
      surfaceDark: 'from-teal-950/35 via-slate-900 to-emerald-950/25 border-teal-500/30 hover:border-teal-400',
      badgeStyle: 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30',
    },
    {
      id: 'marketplace',
      icon: ShoppingBag,
      label: isBn ? 'অর্গানিক মার্কেটপ্লেস' : t.nav_marketplace,
      sub: isBn ? 'থেরাপিউটিক ফুড, সিডস ও সাপ্লিমেন্ট' : 'Therapeutic Foods & Supplements',
      badge: isBn ? 'শপ' : 'Store',
      iconGradient: 'from-rose-500 via-orange-500 to-amber-500',
      shadowColor: 'shadow-rose-500/30',
      surfaceLight: 'from-rose-50/90 via-white to-orange-50/60 border-rose-200/80 hover:border-rose-400',
      surfaceDark: 'from-rose-950/35 via-slate-900 to-orange-950/25 border-rose-500/30 hover:border-rose-400',
      badgeStyle: 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30',
    },
    {
      id: 'community',
      icon: Users,
      label: isBn ? 'কমিউনিটি হাব (AI মডারেটেড)' : t.nav_community,
      sub: isBn ? 'অভিজ্ঞতা শেয়ার, সাপোর্ট ও সেফ কমিউনিটি' : 'Patient Stories & AI-Moderated Hub',
      badge: isBn ? 'কমিউনিটি' : 'Community',
      iconGradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
      shadowColor: 'shadow-violet-500/30',
      surfaceLight: 'from-violet-50/90 via-white to-fuchsia-50/60 border-violet-200/80 hover:border-violet-400',
      surfaceDark: 'from-violet-950/35 via-slate-900 to-fuchsia-950/25 border-violet-500/30 hover:border-violet-400',
      badgeStyle: 'bg-violet-500/15 text-violet-600 dark:text-violet-300 border-violet-500/30',
    },
    {
      id: 'nutritionist_hub',
      icon: Stethoscope,
      label: isBn ? 'পুষ্টিবিদ ও ডায়েটিশিয়ান হাব' : 'Nutritionist & Dietitian Hub',
      sub: isBn
        ? 'ফিচার্ড ডায়েটিশিয়ান বুকিং ও সরাসরি Google Meet কনসালটেশন'
        : 'Featured Dietitians, Appointment Booking & Google Meet',
      badge: isBn ? 'Google Meet যুক্ত' : 'Google Meet',
      iconGradient: 'from-teal-500 via-cyan-500 to-blue-600',
      shadowColor: 'shadow-teal-500/30',
      surfaceLight: 'from-cyan-50/90 via-white to-teal-50/60 border-cyan-200/80 hover:border-cyan-400',
      surfaceDark: 'from-cyan-950/35 via-slate-900 to-teal-950/25 border-cyan-500/30 hover:border-cyan-400',
      badgeStyle: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
    },
    {
      id: 'admin_panel',
      icon: HeartHandshake,
      label: isBn ? 'অ্যাডমিন প্যানেল ও গেটওয়ে' : 'Admin Panel & Gateway',
      sub: isBn
        ? 'পেমেন্ট অ্যাপ্রুভাল, মেইল, স্টোর, ফুড সাজেশন, বুকিং ও ইউজার ব্যান'
        : 'Payment Approvals, Email, Stores, Food Box, Bookings & Moderation',
      badge: isBn ? 'অ্যাডমিন কন্ট্রোল' : 'Admin Control',
      iconGradient: 'from-slate-800 via-indigo-600 to-purple-700',
      shadowColor: 'shadow-indigo-500/30',
      surfaceLight: 'from-indigo-50/90 via-white to-slate-100 border-indigo-300 hover:border-indigo-500',
      surfaceDark: 'from-indigo-950/50 via-slate-900 to-purple-950/40 border-indigo-500/40 hover:border-indigo-400',
      badgeStyle: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
    },
  ];

  const menuItems = allMenuItems.filter(
    (item) => item.id !== 'admin_panel' || isAuthenticatedAdmin
  );

  return (
    <div className="animate-in fade-in duration-500 max-w-6xl mx-auto py-3 md:py-6 space-y-8">
      {/* Figma-Style Vibrant Top Hero Banner */}
      <div
        className={`relative rounded-[36px] p-6 md:p-10 border overflow-hidden shadow-2xl ${
          darkMode
            ? 'bg-gradient-to-br from-slate-900 via-emerald-950/45 to-indigo-950/45 border-emerald-500/30'
            : 'bg-gradient-to-br from-emerald-50/90 via-teal-50/60 to-indigo-50/80 border-emerald-200/80'
        }`}
      >
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-gradient-to-br from-emerald-400/25 to-teal-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-gradient-to-tr from-indigo-400/20 to-purple-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{getRoleBadge()}</span>
          </div>

          <h1
            className={`text-3xl md:text-5xl font-extrabold tracking-tight ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            {t.home_welcome}
          </h1>

          <p className={`text-xs md:text-sm max-w-2xl mx-auto leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            {isBn
              ? 'ফুংশনাল মেডিসিন, মেটাবলিক নিউট্রিশন এবং আয়ুর্বেদিক বিজ্ঞানের সমন্বয়ে আপনার পার্সোনালাইজড হেলথ ও ডায়েট প্ল্যাটফর্ম।'
              : t.home_subtitle}
          </p>
        </div>
      </div>

      {/* Dedicated Flagship Studio Box: DIET MAKER (ডায়েট মেকার) */}
      <div>
        <button
          onClick={() => onNavigate('diet_maker')}
          className={`w-full p-6 md:p-9 rounded-[36px] border-2 text-left transition-all hover:scale-[1.005] active:scale-[0.995] shadow-2xl relative overflow-hidden group ${
            darkMode
              ? 'bg-gradient-to-r from-emerald-950/80 via-teal-950/60 to-slate-900 border-emerald-500/40 hover:border-emerald-400'
              : 'bg-gradient-to-r from-emerald-50 via-teal-50/80 to-cyan-50/70 border-emerald-300 hover:border-emerald-500 shadow-emerald-500/15'
          }`}
        >
          <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full bg-gradient-to-br from-emerald-400/25 to-teal-500/25 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start md:items-center gap-5">
              {/* Glowing 3D Figma Icon Container */}
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white flex items-center justify-center shadow-xl shadow-emerald-500/30 shrink-0 transition-transform group-hover:scale-105">
                <UtensilsCrossed className="w-8 h-8 md:w-10 md:h-10" strokeWidth={2.2} />
              </div>

              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm">
                    {isBn ? 'প্রধান স্টুডিও • ডায়েট মেকার' : 'Flagship Studio • Diet Maker'}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${
                      isUnlocked
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {isUnlocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    <span>
                      {isUnlocked
                        ? isBn
                          ? 'প্রোফাইল ও অ্যাসেসমেন্ট সম্পন্ন (আনলকড)'
                          : 'Unlocked'
                        : isBn
                        ? 'প্রোফাইল ও অ্যাসেসমেন্ট আবশ্যক'
                        : 'Requires Profile & Assessment'}
                    </span>
                  </span>
                </div>

                <h2 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {isBn ? 'ডায়েট মেকার (Clinical Diet Maker)' : 'Clinical Diet Maker Studio'}
                </h2>
                <p className={`text-xs md:text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  {isBn
                    ? 'ডায়েট মেকারের ভিতরে রয়েছে ৪টি প্রিমিয়াম টুল: মেক ইউর ডায়েট চার্ট, থেরাপিউটিক কুকবুক, ডেইলি চেক লিস্ট এবং ফ্যামিলি পট।'
                    : 'Includes 4 clinical tools: Make Your Diet Chart, Therapeutic Cookbook, Daily Checklist & Family Pot.'}
                </p>

                {/* Colorful Vector Chips of the 4 options inside Diet Maker */}
                <div className="flex flex-wrap gap-2.5 pt-1">
                  <span
                    className={`px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 border ${
                      darkMode
                        ? 'bg-emerald-950/70 border-emerald-700/60 text-emerald-300'
                        : 'bg-white border-emerald-200 text-emerald-800 shadow-sm'
                    }`}
                  >
                    <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center">
                      <UtensilsCrossed className="w-3.5 h-3.5" />
                    </span>
                    <span>{isBn ? 'মেক ইউর ডায়েট চার্ট' : 'Make Your Diet Chart'}</span>
                  </span>

                  <span
                    className={`px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 border ${
                      darkMode
                        ? 'bg-orange-950/70 border-orange-700/60 text-orange-300'
                        : 'bg-white border-orange-200 text-orange-800 shadow-sm'
                    }`}
                  >
                    <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center">
                      <ChefHat className="w-3.5 h-3.5" />
                    </span>
                    <span>{isBn ? 'কুকবুক' : 'Cookbook'}</span>
                  </span>

                  <span
                    className={`px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 border ${
                      darkMode
                        ? 'bg-rose-950/70 border-rose-700/60 text-rose-300'
                        : 'bg-white border-rose-200 text-rose-800 shadow-sm'
                    }`}
                  >
                    <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center">
                      <ClipboardCheck className="w-3.5 h-3.5" />
                    </span>
                    <span>{isBn ? 'ডেইলি চেক লিস্ট' : 'Daily Checklist'}</span>
                  </span>

                  <span
                    className={`px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 border ${
                      darkMode
                        ? 'bg-purple-950/70 border-purple-700/60 text-purple-300'
                        : 'bg-white border-purple-200 text-purple-800 shadow-sm'
                    }`}
                  >
                    <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center">
                      <Soup className="w-3.5 h-3.5" />
                    </span>
                    <span>{isBn ? 'ফ্যামিলি পট' : 'Family Pot'}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end shrink-0">
              <div className="px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 group-hover:from-emerald-500 group-hover:to-teal-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-xl shadow-emerald-600/25 flex items-center gap-2 transition-all">
                <span>{isBn ? 'ডায়েট মেকারে প্রবেশ করুন' : 'Enter Diet Maker'}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Colorful Figma-Styled Feature Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3
            className={`text-xs md:text-sm font-black uppercase tracking-wider ${
              darkMode ? 'text-slate-300' : 'text-slate-700'
            }`}
          >
            {isBn
              ? 'ক্যালোরি ট্র্যাকার, অ্যানালিটিক্স ও উন্মুক্ত ফিচারসমূহ (প্রোফাইল ছাড়াও ব্যবহারযোগ্য)'
              : 'Calorie Tracker, Analytics & Open Features'}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`group relative p-6 rounded-[30px] border-2 text-left flex flex-col justify-between gap-4 transition-all hover:-translate-y-1 active:scale-[0.98] shadow-lg bg-gradient-to-br ${
                  darkMode ? item.surfaceDark : item.surfaceLight
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.iconGradient} text-white flex items-center justify-center shadow-lg ${item.shadowColor} transition-transform group-hover:scale-110`}
                    >
                      <IconComponent className="w-7 h-7" strokeWidth={2.2} />
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${item.badgeStyle}`}>
                      {item.badge}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className={`font-extrabold text-base tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {item.label}
                    </h4>
                    <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      {item.sub}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold">
                  <span className={darkMode ? 'text-slate-300' : 'text-slate-700'}>
                    {isBn ? 'ওপেন করুন' : 'Explore'}
                  </span>
                  <ArrowRight className="w-4 h-4 opacity-70 transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HomeGrid;
