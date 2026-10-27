import React from 'react';
import { HealthProfile, Language, User } from '../types';
import { translations } from '../i18n';

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

  const getRoleBadge = () => {
    if (!user) return isBn ? 'গেস্ট মোড (প্রোফাইল ঐচ্ছিক)' : 'Guest Mode (Profile Optional)';
    const r = user.profileType || (user.id.startsWith('DOC-') ? 'doctor' : user.isFamilyManager ? 'family' : 'self');
    if (r === 'doctor') return isBn ? '🩺 ডাক্তার প্রোফাইল' : '🩺 Doctor Profile';
    if (r === 'family') return isBn ? '👨‍👩‍👧‍👦 ফ্যামিলি প্রোফাইল' : '👨‍👩‍👧‍👦 Family Profile';
    return isBn ? '👤 নিজের প্রোফাইল (Self)' : '👤 Personal Profile (Self)';
  };

  // Public & Main items outside Diet Maker
  const menuItems = [
    {
      id: 'profile',
      icon: '👤',
      label: isBn ? 'প্রোফাইল (নিজের / ফ্যামিলি / ডাক্তার)' : t.nav_profile,
      sub: isUnlocked
        ? getRoleBadge()
        : isBn
        ? '৩ ধরনের প্রোফাইল ইন্টারফেস'
        : '3 Profile Interfaces',
      color: 'bg-blue-600',
    },
    {
      id: 'leaderboard',
      icon: '🏆',
      label: isBn ? 'লিডারবোর্ড' : t.nav_leaderboard,
      sub: isBn ? 'সবার জন্য উন্মুক্ত' : 'Open to All Users',
      color: 'bg-amber-500',
    },
    {
      id: 'calculator',
      icon: '🧮',
      label: isBn ? 'হেলথ ক্যালকুলেটর ও অ্যাসেসমেন্ট' : `${t.nav_calculator} & Assessments`,
      sub: isBn ? 'বিএমআই, বিএমআর ও হেলথ টেস্ট' : 'BMI, BMR & Health Checks',
      color: 'bg-pink-500',
    },
    {
      id: 'food_recognition',
      icon: '📖',
      label: isBn ? 'ফুড গ্লোসারি' : t.nav_food_rec,
      sub: isBn ? 'খাবারের পুষ্টিগুণ ও উপকারিতা' : 'Regional Food Guide',
      color: 'bg-indigo-600',
    },
    {
      id: 'marketplace',
      icon: '🛍️',
      label: isBn ? 'মার্কেটপ্লেস' : t.nav_marketplace,
      sub: isBn ? 'অর্গানিক ও থেরাপিউটিক ফুড' : 'Therapeutic Foods',
      color: 'bg-orange-500',
    },
    {
      id: 'community',
      icon: '🌍',
      label: isBn ? 'কমিউনিটি হাব' : t.nav_community,
      sub: isBn ? 'অভিজ্ঞতা ও সাপোর্ট গ্রুপ' : 'Health Community',
      color: 'bg-purple-600',
    },
  ];

  return (
    <div className="animate-in fade-in zoom-in duration-500 max-w-5xl mx-auto py-4 md:py-8 space-y-8">
      {/* Welcome Header */}
      <div className="text-center space-y-2 px-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
          <span>{getRoleBadge()}</span>
        </div>
        <h1 className={`text-3xl md:text-5xl font-bold serif italic ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          {t.home_welcome}
        </h1>
        <p className={`text-xs md:text-sm max-w-xl mx-auto ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          {isBn
            ? 'আপনি প্রোফাইল ছাড়াও লিডারবোর্ড, ক্যালকুলেটর ও ফুড গ্লোসারি ব্যবহার করতে পারবেন। ডায়েট মেকার ব্যবহার করতে প্রোফাইল ও অ্যাসেসমেন্ট সম্পন্ন করুন।'
            : t.home_subtitle}
        </p>
      </div>

      {/* Dedicated Separate Box: DIET MAKER (ডায়েট মেকার) */}
      <div className="px-2 md:px-4">
        <button
          onClick={() => onNavigate('diet_maker')}
          className={`w-full p-6 md:p-8 rounded-[36px] border-2 text-left transition-all hover:scale-[1.01] active:scale-[0.99] shadow-xl relative overflow-hidden group ${
            darkMode
              ? 'bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/60 border-emerald-500/40 hover:border-emerald-400'
              : 'bg-gradient-to-r from-emerald-50 via-white to-teal-50 border-emerald-300 hover:border-emerald-500 shadow-emerald-500/10'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start md:items-center gap-5">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-emerald-600 text-white flex items-center justify-center text-3xl md:text-4xl shadow-xl shrink-0 transition-transform group-hover:scale-105">
                🍱
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white">
                    {isBn ? 'প্রধান বক্স • ডায়েট মেকার' : 'Featured Hub • Diet Maker'}
                  </span>
                  <span
                    className={`px-3 py-0.5 rounded-full text-[10px] font-bold border ${
                      isUnlocked
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {isUnlocked
                      ? isBn
                        ? '🔓 প্রোফাইল ও অ্যাসেসমেন্ট সম্পন্ন (আনলকড)'
                        : '🔓 Unlocked'
                      : isBn
                      ? '🔒 প্রোফাইল ও অ্যাসেসমেন্ট আবশ্যক'
                      : '🔒 Requires Profile & Assessment'}
                  </span>
                </div>

                <h2 className={`text-2xl md:text-3xl font-bold serif italic ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {isBn ? 'ডায়েট মেকার (Diet Maker)' : 'Clinical Diet Maker'}
                </h2>
                <p className={`text-xs md:text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  {isBn
                    ? 'ডায়েট মেকারের ভিতরে রয়েছে: ১. মেক ইউর ডায়েট চার্ট, ২. কুকবুক, ৩. ডেইলি চেক লিস্ট এবং ফ্যামিলি পট।'
                    : 'Includes: 1. Make Your Diet Chart, 2. Cookbook, 3. Daily Checklist & Family Pot.'}
                </p>

                {/* Preview Chips of the 3 + 1 options inside Diet Maker */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <span
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border ${
                      darkMode ? 'bg-slate-800/90 border-slate-700 text-emerald-300' : 'bg-white border-emerald-200 text-emerald-800 shadow-sm'
                    }`}
                  >
                    <span>🥗</span>
                    <span>{isBn ? 'মেক ইউর ডায়েট চার্ট' : 'Make Your Diet Chart'}</span>
                  </span>
                  <span
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border ${
                      darkMode ? 'bg-slate-800/90 border-slate-700 text-orange-300' : 'bg-white border-orange-200 text-orange-800 shadow-sm'
                    }`}
                  >
                    <span>👨‍🍳</span>
                    <span>{isBn ? 'কুকবুক' : 'Cookbook'}</span>
                  </span>
                  <span
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border ${
                      darkMode ? 'bg-slate-800/90 border-slate-700 text-rose-300' : 'bg-white border-rose-200 text-rose-800 shadow-sm'
                    }`}
                  >
                    <span>📝</span>
                    <span>{isBn ? 'ডেইলি চেক লিস্ট' : 'Daily Checklist'}</span>
                  </span>
                  <span
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border ${
                      darkMode ? 'bg-slate-800/90 border-slate-700 text-purple-300' : 'bg-white border-purple-200 text-purple-800 shadow-sm'
                    }`}
                  >
                    <span>🍲</span>
                    <span>{isBn ? 'ফ্যামিলি পট' : 'Family Pot'}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end shrink-0">
              <div className="px-6 py-3.5 rounded-2xl bg-emerald-600 group-hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 transition-all">
                <span>{isBn ? 'ডায়েট মেকারে প্রবেশ করুন' : 'Enter Diet Maker'}</span>
                <span className="text-base">→</span>
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Outside Grid Boxes: Profile, Leaderboard (Public), Calculator (Public), Food Glossary, Marketplace, Community */}
      <div className="px-2 md:px-4 space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className={`text-sm font-black uppercase tracking-wider opacity-60 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            {isBn ? 'প্রোফাইল ও উন্মুক্ত ফিচারসমূহ (প্রোফাইল ছাড়াও ব্যবহারযোগ্য)' : 'Profile & Open Features'}
          </h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`group relative p-5 md:p-6 rounded-[28px] border shadow-md flex flex-col items-center justify-center gap-2.5 text-center transition-all hover:scale-[1.03] active:scale-95 min-h-[160px] ${
                darkMode
                  ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  : 'bg-white border-slate-100 hover:border-slate-300'
              }`}
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl md:text-3xl text-white shadow-lg ${item.color}`}
              >
                {item.icon}
              </div>
              <span className={`font-bold text-xs md:text-sm tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                {item.label}
              </span>
              <span className={`text-[10px] md:text-xs font-medium opacity-60 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {item.sub}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeGrid;
