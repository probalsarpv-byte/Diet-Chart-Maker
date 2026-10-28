import React, { useState, useEffect } from 'react';
import { HealthProfile, Language, Phase, ProfileRoleType, User, UserGeminiAccountConfig } from '../types';
import { translations } from '../i18n';
import HealthPortal from './HealthPortal';
import FamilyManagerDashboard from './FamilyManagerDashboard';
import DoctorDashboard from './DoctorDashboard';
import PregnancyMilestonesDashboard from './PregnancyMilestonesDashboard';
import ChildDevelopmentMilestones from './ChildDevelopmentMilestones';
import {
  getUserGeminiAccount,
  toggleUserGeminiAccount,
  subscribeUserGeminiAccount,
} from '../services/aiModeService';
import { ShieldCheck, Sparkles } from 'lucide-react';

interface Props {
  user: User;
  profile: HealthProfile;
  currentPhase: Phase;
  lang: Language;
  darkMode?: boolean;
  onNavigateToDiet: () => void;
  onNavigateToDietMaker?: () => void;
  onNavigateToFamilyPot?: () => void;
  onNavigateToDashboard?: () => void;
  onUpdateUser?: (updated: User) => void;
  onUpdateProfile?: (updated: HealthProfile) => void;
}

const ProfileView: React.FC<Props> = ({
  user,
  profile,
  currentPhase,
  lang,
  darkMode,
  onNavigateToDiet,
  onNavigateToDietMaker,
  onNavigateToFamilyPot,
  onNavigateToDashboard,
  onUpdateUser,
  onUpdateProfile,
}) => {
  const t = translations[lang];
  const isBn = lang === 'bn';
  const [copied, setCopied] = useState(false);
  const [showPortal, setShowPortal] = useState(false);
  const [geminiAccount, setGeminiAccount] = useState<UserGeminiAccountConfig>(() =>
    getUserGeminiAccount()
  );

  useEffect(() => {
    return subscribeUserGeminiAccount((cfg) => {
      setGeminiAccount(cfg);
    });
  }, []);

  const initialRole: ProfileRoleType =
    user.profileType || (user.id.startsWith('DOC-') ? 'doctor' : user.isFamilyManager ? 'family' : 'self');

  const [activeRoleTab, setActiveRoleTab] = useState<ProfileRoleType>(initialRole);

  useEffect(() => {
    setActiveRoleTab(initialRole);
  }, [initialRole]);

  const handleRoleSwitch = (role: ProfileRoleType) => {
    setActiveRoleTab(role);
    if (onUpdateUser) {
      onUpdateUser({
        ...user,
        profileType: role,
        isFamilyManager: role === 'family' ? true : user.isFamilyManager,
      });
    }
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const prof = user.professionalProfile || {
    fullName: user.name || (isBn ? 'ডা. আরিফুল ইসলাম' : 'Dr. Ariful Islam'),
    role: 'Doctor' as const,
    licenseNumber: 'BMDC-48291',
    specialty: isBn ? 'ফাংশনাল মেডিসিন ও ক্লিনিকাল নিউট্রিশন' : 'Functional Medicine & Clinical Nutrition',
    institution: isBn ? 'প্রিসিশন ক্লিনিকাল সেন্টার' : 'Precision Clinical Center',
    experienceYears: 8,
  };

  // User Gemini Account & Maker-Checker Verification Card (No Free AI / API labels shown)
  const renderGeminiAccountCard = () => (
    <div
      className={`p-5 md:p-6 rounded-[28px] border shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
        darkMode
          ? 'bg-gradient-to-r from-slate-900 via-emerald-950/40 to-teal-950/40 border-emerald-800/50'
          : 'bg-gradient-to-r from-emerald-50/70 via-teal-50/50 to-white border-emerald-200/80'
      }`}
    >
      <div className="flex items-start gap-3.5">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
            geminiAccount.enabled
              ? 'bg-emerald-600 text-white'
              : darkMode
              ? 'bg-slate-800 text-emerald-400 border border-slate-700'
              : 'bg-white text-emerald-700 border border-emerald-200'
          }`}
        >
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm md:text-base font-extrabold">
              {isBn
                ? 'আমার Gemini অ্যাকাউন্ট ব্যবহার করুন'
                : 'Use My Personal Gemini Account'}
            </h3>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-500/15 text-teal-600 dark:text-teal-300 border border-teal-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              {isBn ? 'মেকার-চেকার ভেরিফাইড' : 'Maker-Checker Active'}
            </span>
          </div>
          <p className="text-xs opacity-75 leading-relaxed max-w-2xl">
            {geminiAccount.enabled
              ? isBn
                ? `আপনার Gemini অ্যাকাউন্ট (${user.email || 'সংযুক্ত অ্যাকাউন্ট'}) এখন অ্যাপের সব জায়গায় (ডায়েট চার্ট, চ্যাটবট, ফুড সেফটি, কুকবুক ও ফ্যামিলি পট) ব্যবহৃত হচ্ছে। যেকোনো আউটপুট দেখানোর আগে অ্যাপের জেমিনি ক্লিনিক্যাল চেকার তা ভেরিফাই করে দেখাচ্ছে।`
                : `Your Gemini account (${user.email || 'Connected Account'}) is active across all app features. Every output is verified by the App's Gemini Clinical Checker before display.`
              : isBn
              ? 'আপনি কি আপনার নিজস্ব Gemini অ্যাকাউন্ট ব্যবহার করতে চান? এটি চালু করলে অ্যাপের সব জায়গায় আপনার Gemini ব্যবহৃত হবে এবং প্রতিটি আউটপুট অ্যাপের জেমিনি চেকার দ্বারা ভেরিফাই হয়ে আসবে।'
              : "Would you like to use your own Gemini account? When enabled, your Gemini account is used everywhere in the app, and every output is verified by the App's Gemini Checker before display."}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 self-end md:self-center shrink-0">
        <span
          className={`text-xs font-extrabold ${
            geminiAccount.enabled ? 'text-emerald-600 dark:text-emerald-400' : 'opacity-60'
          }`}
        >
          {geminiAccount.enabled
            ? isBn
              ? 'চালু আছে (ON)'
              : 'Connected (ON)'
            : isBn
            ? 'বন্ধ আছে (OFF)'
            : 'Off'}
        </span>
        <button
          type="button"
          onClick={() =>
            toggleUserGeminiAccount(!geminiAccount.enabled, user.email, user.name)
          }
          role="switch"
          aria-checked={geminiAccount.enabled}
          className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            geminiAccount.enabled ? 'bg-emerald-600' : 'bg-slate-400 dark:bg-slate-700'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
              geminiAccount.enabled ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );

  // Role Switcher Header (3 Profile Types -> 3 Distinct Interfaces)
  const renderRoleSwitcher = () => (
    <div className="space-y-4">
      {renderGeminiAccountCard()}
      <div
        className={`p-4 md:p-5 rounded-[28px] border shadow-md flex flex-col md:flex-row items-center justify-between gap-4 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">🎛️</span>
          <div>
            <h3 className="text-xs md:text-sm font-bold">
              {isBn ? 'প্রোফাইল ইন্টারফেস মোড (৩ ধরনের প্রোফাইল)' : 'Profile Interface Mode (3 Profile Types)'}
            </h3>
            <p className="text-[11px] opacity-60">
              {isBn
                ? 'নিজের জন্য, ফ্যামিলির জন্য অথবা ডাক্তার হিসেবে আপনার ইন্টারফেস দেখুন'
                : 'Switch between Personal, Family, and Clinical Doctor interfaces'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 w-full md:w-auto">
          <button
            onClick={() => handleRoleSwitch('self')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeRoleTab === 'self'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : darkMode
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>👤</span>
            <span>{isBn ? 'নিজের জন্য' : 'For Myself'}</span>
          </button>

          <button
            onClick={() => handleRoleSwitch('family')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeRoleTab === 'family'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : darkMode
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>👨‍👩‍👧‍👦</span>
            <span>{isBn ? 'ফ্যামিলির জন্য' : 'For Family'}</span>
          </button>

          <button
            onClick={() => handleRoleSwitch('doctor')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeRoleTab === 'doctor'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : darkMode
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>🩺</span>
            <span>{isBn ? 'ডাক্তার হিসেবে' : 'As Doctor'}</span>
          </button>
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // INTERFACE 3: DOCTOR PROFILE INTERFACE (ডাক্তার হিসেবে)
  // ============================================================================
  if (activeRoleTab === 'doctor') {
    return (
      <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom duration-500 pb-24">
        {renderRoleSwitcher()}

        {/* Doctor Hero Card */}
        <div
          className={`p-6 md:p-10 rounded-[40px] border shadow-xl flex flex-col md:flex-row gap-8 items-center relative overflow-hidden transition-colors ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          }`}
        >
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-[32px] flex items-center justify-center font-bold text-4xl serif italic shadow-xl bg-blue-600 text-white shrink-0">
            {prof.fullName[0] || 'D'}
          </div>

          <div className="text-center md:text-left flex-1 space-y-3">
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-2.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full">
                🩺 {isBn ? 'ডাক্তার প্রোফাইল ইন্টারফেস' : t.verified_practitioner}
              </span>
              <button
                onClick={() => handleCopyId(user.id)}
                className={`text-xs font-mono font-bold px-3 py-1 rounded-full border flex items-center gap-2 transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                ID: {user.id}
                {copied ? <span className="text-emerald-500">✓</span> : <span className="opacity-40 text-[10px]">COPY</span>}
              </button>
            </div>

            <h2 className={`text-3xl md:text-4xl font-bold serif italic leading-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {prof.fullName}
            </h2>
            <p className="text-xs md:text-sm font-bold opacity-60 italic">
              {prof.role} • {prof.specialty} • {prof.institution} ({prof.experienceYears}+ Yrs)
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
            <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/40 text-center">
              <div className="text-2xl font-black text-blue-600">12</div>
              <div className="text-[9px] font-black uppercase tracking-wider opacity-60">{t.active_patients}</div>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/40 text-center">
              <div className="text-2xl font-black text-emerald-600">94%</div>
              <div className="text-[9px] font-black uppercase tracking-wider opacity-60">{t.adherence_avg}</div>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/40 text-center">
              <div className="text-2xl font-black text-amber-600">✓</div>
              <div className="text-[9px] font-black uppercase tracking-wider opacity-60">
                {isBn ? 'ভেরিফাইড' : 'Verified'}
              </div>
            </div>
          </div>
        </div>

        {/* Inline Clinical Doctor Workspace */}
        <DoctorDashboard
          user={user}
          profile={profile}
          currentPhase={currentPhase}
          lang={lang}
          darkMode={darkMode}
          inlineMode={true}
          onSubscribeSuccess={() => {}}
        />
      </div>
    );
  }

  // ============================================================================
  // INTERFACE 2: FAMILY PROFILE INTERFACE (ফ্যামিলির জন্য)
  // ============================================================================
  if (activeRoleTab === 'family') {
    return (
      <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom duration-500 pb-24">
        {renderRoleSwitcher()}

        <FamilyManagerDashboard
          user={user}
          primaryProfile={profile}
          lang={lang}
          darkMode={darkMode}
          inlineMode={true}
          onUpdateUser={onUpdateUser}
          onOpenFamilyPot={onNavigateToFamilyPot}
          onOpenDietMaker={onNavigateToDietMaker || onNavigateToDiet}
        />
      </div>
    );
  }

  // ============================================================================
  // INTERFACE 1: SELF / PERSONAL PROFILE INTERFACE (নিজের জন্য)
  // ============================================================================
  let cycleDay = 1;
  let cyclePhase = t.cycle_menstrual;
  let phaseColor = 'text-red-500';
  let advice = '';

  if (profile.gender === 'Female' && profile.cycleData) {
    const today = new Date();
    const lastPeriod = new Date(profile.cycleData.lastPeriodDate);
    const diffTime = Math.abs(today.getTime() - lastPeriod.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    cycleDay = (diffDays % profile.cycleData.cycleLength) + 1;

    if (cycleDay <= 5) {
      cyclePhase = t.cycle_menstrual;
      phaseColor = 'text-red-500';
      advice = t.shakti_menstrual_advice;
    } else if (cycleDay <= 13) {
      cyclePhase = t.cycle_follicular;
      phaseColor = 'text-pink-400';
      advice = t.shakti_follicular_advice;
    } else if (cycleDay <= 16) {
      cyclePhase = t.cycle_ovulatory;
      phaseColor = 'text-purple-500';
      advice = t.shakti_ovulatory_advice;
    } else {
      cyclePhase = t.cycle_luteal;
      phaseColor = 'text-amber-500';
      advice = t.shakti_luteal_advice;
    }
  }

  const healthId = `AM-${(profile.dosha || 'VATA').toUpperCase()}-${((profile.age || 35) * 1234).toString().slice(0, 4)}`;

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom duration-500 pb-24">
      {renderRoleSwitcher()}

      {showPortal && (
        <HealthPortal
          user={user}
          profile={profile}
          currentPhase={currentPhase}
          lang={lang}
          darkMode={darkMode}
          onClose={() => setShowPortal(false)}
        />
      )}

      {/* Hero Section: Personal Identity & Quick Actions */}
      <div
        className={`p-6 md:p-10 rounded-[40px] border shadow-xl flex flex-col md:flex-row gap-8 items-center relative overflow-hidden transition-colors ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
        }`}
      >
        <div
          className={`w-24 h-24 md:w-28 md:h-28 rounded-[32px] flex items-center justify-center font-bold text-4xl serif italic shadow-xl shrink-0 ${
            darkMode ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-white'
          }`}
        >
          {profile.dosha?.[0] || 'P'}
        </div>

        <div className="text-center md:text-left flex-1 space-y-3">
          <div>
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-2.5 mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full">
                👤 {isBn ? 'নিজের জন্য প্রোফাইল ইন্টারফেস' : t.verified_bio}
              </span>
              <button
                onClick={() => handleCopyId(healthId)}
                className={`text-xs font-mono font-bold px-3 py-1 rounded-full border flex items-center gap-2 transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                ID: {healthId}
                {copied ? <span className="text-emerald-500">✓</span> : <span className="opacity-40 text-[10px]">COPY</span>}
              </button>
            </div>

            <h2 className={`text-3xl md:text-4xl font-bold serif italic leading-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {user.name || t.welcome.replace('{dosha}', profile.dosha || 'Patient')}
            </h2>
          </div>

          <div className="flex flex-wrap justify-center md:justify-start gap-2.5">
            <div
              className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold ${
                darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}
            >
              {profile.age} yrs • {profile.gender} • {profile.weight}kg • {profile.dosha}
            </div>
            <div className="bg-amber-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-md flex items-center gap-1.5">
              {user.points} {t.pts} <span>⭐</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 w-full md:w-auto">
          <button
            onClick={onNavigateToDietMaker || onNavigateToDiet}
            className="w-full px-7 py-3.5 rounded-2xl font-bold uppercase tracking-wider text-xs shadow-lg transition-all active:scale-95 bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            🍱 {isBn ? 'ডায়েট মেকার ও চার্ট খুলুন' : t.diet_chart}
          </button>
          <button
            onClick={() => setShowPortal(true)}
            className={`w-full px-6 py-3 rounded-2xl font-bold uppercase tracking-wider text-xs shadow-md transition-all active:scale-95 ${
              darkMode ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            {t.patient_portal}
          </button>
        </div>
      </div>

      {/* Pregnancy Milestones Dashboard (Strictly visible ONLY when profile.cohortType === 'pregnancy_lactation') */}
      {profile.cohortType === 'pregnancy_lactation' && (
        <PregnancyMilestonesDashboard
          currentPregnancyMonth={profile.pregnancyMonth || 1}
          lang={lang}
          darkMode={darkMode}
          onSyncPregnancyMonth={(newMonth) => {
            if (onUpdateProfile) {
              onUpdateProfile({ ...profile, pregnancyMonth: newMonth });
            }
          }}
        />
      )}

      {/* Child Development Milestones & Catch-Up Engine (Strictly visible ONLY when profile.cohortType === 'child_pediatric') */}
      {profile.cohortType === 'child_pediatric' && (
        <ChildDevelopmentMilestones
          childAgeGroup={profile.childAgeGroup || '1-3'}
          childAgeYears={profile.age}
          childWeightKg={profile.weight}
          childHeightCm={profile.height}
          lang={lang}
          darkMode={darkMode}
          onSyncAgeGroup={(newBracket) => {
            if (onUpdateProfile) {
              onUpdateProfile({ ...profile, childAgeGroup: newBracket });
            }
          }}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Health Synthesis Dashboard */}
        <div
          className={`md:col-span-2 p-6 md:p-8 rounded-[36px] border shadow-sm space-y-6 transition-colors ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          }`}
        >
          <div className="flex justify-between items-center border-b border-inherit pb-4">
            <h3 className={`text-xl font-bold serif italic ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
              {t.clinical_synthesis}
            </h3>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-40">
              {isBn ? 'শারীরিক বিশ্লেষণ' : 'Overall Health Condition'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-5">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2">
                  {t.microbiome} Diversity
                </h4>
                <div className="flex items-end gap-2 mb-1.5">
                  <span className="text-3xl font-black">{profile.microbiomeScore}%</span>
                  <span className="text-[10px] font-bold opacity-50 pb-1">Optimal</span>
                </div>
                <div className="h-1.5 bg-slate-700/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-1000"
                    style={{ width: `${profile.microbiomeScore}%` }}
                  />
                </div>
              </div>
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-2">
                  {t.inflam_status} Index
                </h4>
                <div className="flex items-end gap-2 mb-1.5">
                  <span className="text-3xl font-black">{profile.inflammatoryIndex}/10</span>
                  <span className="text-[10px] font-bold opacity-50 pb-1">
                    {profile.inflammatoryIndex < 4 ? 'Optimal' : 'Attention'}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-700/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all duration-1000"
                    style={{ width: `${profile.inflammatoryIndex * 10}%` }}
                  />
                </div>
              </div>
            </div>

            <div
              className={`p-5 rounded-3xl border ${
                darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500 font-black text-xs">pH</div>
                <h4 className="text-xs font-black uppercase tracking-widest opacity-60">{t.alkaline_score}</h4>
              </div>
              <div className="text-4xl font-black mb-2 text-indigo-500">{profile.analysis?.alkalineScore || 7.4}</div>
              <p className="text-[11px] font-medium leading-relaxed opacity-65 italic">
                {profile.analysis?.alkalineScore && profile.analysis.alkalineScore > 7.3
                  ? isBn
                    ? 'কোষীয় পরিবেশ ক্ষারীয় ও মেটাবলিক ডিটক্সের জন্য অনুকূল।'
                    : 'Cellular environment is optimally alkaline, supporting metabolic detox.'
                  : isBn
                  ? 'মেটাবলিক অ্যাসিডিটি কমাতে ক্ষারীয় শাকসবজি ও খাবারের ওপর জোর দেওয়া হয়েছে।'
                  : 'Metabolic acidity detected; protocol focuses on shift to alkalinity.'}
              </p>
            </div>
          </div>

          <div
            className={`p-5 rounded-3xl border-2 border-dashed ${
              darkMode ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50/50 border-amber-200'
            }`}
          >
            <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1.5">
              {isBn ? 'ক্লিনিকাল ও আয়ুর্বেদিক সারসংক্ষেপ' : 'Ayurvedic Perspective'}
            </h4>
            <p className={`text-xs md:text-sm leading-relaxed font-medium italic ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              {profile.analysis?.healthSummary ||
                `Profile synthesis suggests dominant ${profile.dosha} Dosha with good cellular resilience.`}
            </p>
          </div>
        </div>

        {/* Secondary Sidebar */}
        <div className="space-y-6">
          {profile.gender === 'Female' && profile.cycleData ? (
            <div
              className={`p-6 rounded-[36px] border shadow-sm relative overflow-hidden transition-colors ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
              }`}
            >
              <div className={`absolute top-0 right-0 p-4 opacity-10 font-serif italic text-6xl ${phaseColor}`}>
                {cycleDay}
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">🌺</span>
                  <h3 className="font-bold text-base serif italic">{t.cycle_sync}</h3>
                </div>
                <div className="mb-4">
                  <div className={`text-2xl font-black ${phaseColor} mb-1`}>{cyclePhase}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest opacity-50">
                    Day {cycleDay} of {profile.cycleData.cycleLength}
                  </div>
                </div>
                <div
                  className={`p-4 rounded-2xl text-xs font-bold leading-relaxed ${
                    darkMode ? 'bg-slate-800 text-emerald-400' : 'bg-emerald-50 text-emerald-800'
                  }`}
                >
                  {advice}
                </div>
              </div>
            </div>
          ) : (
            <div
              className={`p-6 rounded-[36px] border shadow-sm transition-colors ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
              }`}
            >
              <h3 className="font-bold mb-4 italic serif text-lg">{t.goal_tracking}</h3>
              <div className="space-y-3">
                <div className={`p-4 rounded-2xl ${darkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <span className="text-[9px] font-black uppercase opacity-40 block mb-1">{t.primary_target}</span>
                  <span className="text-sm font-bold">{profile.dietGoals || 'Phase 1 Recalibration'}</span>
                </div>
                <div className={`p-4 rounded-2xl ${darkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <span className="text-[9px] font-black uppercase opacity-40 block mb-1">{t.metabolic_type}</span>
                  <span className="text-sm font-bold">{profile.metabolicType}</span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div
              className={`p-5 rounded-3xl border text-center ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
              }`}
            >
              <div className="text-2xl font-black text-emerald-500">{profile.adherenceHistory?.length || 0}</div>
              <div className="text-[9px] font-black uppercase tracking-widest opacity-50">{t.healing_streak}</div>
            </div>
            <div
              className={`p-5 rounded-3xl border text-center ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
              }`}
            >
              <div className="text-2xl font-black text-blue-500">#{currentPhase}</div>
              <div className="text-[9px] font-black uppercase tracking-widest opacity-50">{t.active_phase_label}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
