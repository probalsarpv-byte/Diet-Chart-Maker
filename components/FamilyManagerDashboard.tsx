import React, { useState } from 'react';
import { User, Language, FamilyMember, HealthProfile, UnifiedFamilyDiet } from '../types';
import { translations } from '../i18n';
import AssessmentStep from './AssessmentStep';
import { GeminiService } from '../services/geminiService';

interface Props {
  user: User;
  primaryProfile?: HealthProfile;
  lang: Language;
  darkMode?: boolean;
  inlineMode?: boolean;
  onClose?: () => void;
  onUpdateUser?: (updated: User) => void;
  onOpenFamilyPot?: () => void;
  onOpenDietMaker?: () => void;
}

const FamilyManagerDashboard: React.FC<Props> = ({
  user,
  primaryProfile,
  lang,
  darkMode,
  inlineMode = false,
  onClose,
  onUpdateUser,
  onOpenFamilyPot,
  onOpenDietMaker,
}) => {
  const t = translations[lang];
  const isBn = lang === 'bn';
  const [view, setView] = useState<'list' | 'add_member' | 'unified_chart'>('list');
  const [familyName, setFamilyName] = useState(
    user.familyName || `${user.name}${isBn ? '-এর পরিবার' : "'s Family"}`
  );

  // Initialize with user's existing familyMembers or seed with primary user if available
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(() => {
    if (user.familyMembers && user.familyMembers.length > 0) {
      return user.familyMembers;
    }
    if (primaryProfile) {
      return [
        {
          id: `FAM-PRIMARY`,
          name: user.name || (isBn ? 'প্রধান সদস্য' : 'Primary Member'),
          relation: isBn ? 'নিজে (Self)' : 'Self (Primary)',
          profile: primaryProfile,
        },
      ];
    }
    return [];
  });

  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRelation, setNewMemberRelation] = useState('');
  const [unifiedChart, setUnifiedChart] = useState<UnifiedFamilyDiet | null>(null);
  const [loading, setLoading] = useState(false);

  const gemini = new GeminiService();

  const handleMemberAssessmentComplete = (profile: HealthProfile, name?: string) => {
    const resolvedName =
      newMemberName.trim() || name || `${isBn ? 'সদস্য' : 'Member'} ${familyMembers.length + 1}`;
    const newMember: FamilyMember = {
      id: `FAM-${Date.now()}`,
      name: resolvedName,
      relation: newMemberRelation.trim() || (isBn ? 'পরিবারের সদস্য' : 'Family Member'),
      profile,
    };
    const updatedList = [...familyMembers, newMember];
    setFamilyMembers(updatedList);
    if (onUpdateUser) {
      onUpdateUser({
        ...user,
        familyName,
        familyMembers: updatedList,
      });
    }
    setView('list');
    setNewMemberName('');
    setNewMemberRelation('');
  };

  const generateUnifiedChart = async () => {
    if (familyMembers.length === 0) return;
    setLoading(true);
    try {
      const chart = await gemini.generateUnifiedFamilyDiet(familyMembers, lang);
      setUnifiedChart(chart);
      setView('unified_chart');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div
      className={`w-full rounded-[36px] border flex flex-col overflow-hidden ${
        inlineMode ? 'shadow-xl' : 'max-w-6xl h-[90vh] shadow-2xl relative'
      } ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}
    >
      {/* Header */}
      <div
        className={`px-6 md:px-8 py-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-purple-50/50 border-purple-100'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center text-2xl shadow-lg">
            👨‍👩‍👧‍👦
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 block">
              {isBn ? 'ফ্যামিলি প্রোফাইল ইন্টারফেস' : 'Family Profile Interface'}
            </span>
            <h2 className="text-xl md:text-2xl font-bold serif italic">
              {familyName} ({familyMembers.length} {isBn ? 'জন সদস্য' : 'Members'})
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenFamilyPot && (
            <button
              onClick={onOpenFamilyPot}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
            >
              🍲 {isBn ? 'ফ্যামিলি পট' : 'Family Pot'}
            </button>
          )}
          {onOpenDietMaker && (
            <button
              onClick={onOpenDietMaker}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
            >
              🍱 {isBn ? 'ডায়েট মেকার' : 'Diet Maker'}
            </button>
          )}
          {!inlineMode && onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-700 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className={`${inlineMode ? 'p-6 md:p-8' : 'flex-1 overflow-y-auto p-6 md:p-8 scrollbar-hide'}`}>
        {view === 'list' && (
          <div className="space-y-8 animate-in fade-in">
            {/* Family Name & Add Member Bar */}
            <div
              className={`p-5 md:p-6 rounded-3xl border grid grid-cols-1 lg:grid-cols-12 gap-4 items-end ${
                darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200/80'
              }`}
            >
              <div className="lg:col-span-4 space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider opacity-70">
                  {isBn ? 'পরিবারের নাম' : t.family_name}
                </label>
                <input
                  type="text"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  className={`w-full p-3 rounded-xl border text-xs font-bold outline-none focus:border-purple-500 ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'
                  }`}
                />
              </div>

              <div className="lg:col-span-3 space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider opacity-70">
                  {isBn ? 'নতুন সদস্যের নাম' : 'New Member Name'}
                </label>
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder={isBn ? 'যেমন: রাহেলা বেগম' : 'e.g. Rahela Begum'}
                  className={`w-full p-3 rounded-xl border text-xs font-bold outline-none focus:border-purple-500 ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'
                  }`}
                />
              </div>

              <div className="lg:col-span-3 space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider opacity-70">
                  {isBn ? 'সম্পর্ক (Relation)' : t.member_relation}
                </label>
                <input
                  type="text"
                  value={newMemberRelation}
                  onChange={(e) => setNewMemberRelation(e.target.value)}
                  placeholder={isBn ? 'মা / বাবা / স্ত্রী / সন্তান' : 'Mother / Father / Spouse / Child'}
                  className={`w-full p-3 rounded-xl border text-xs font-bold outline-none focus:border-purple-500 ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'
                  }`}
                />
              </div>

              <div className="lg:col-span-2">
                <button
                  onClick={() => setView('add_member')}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white px-4 py-3 rounded-xl font-bold text-xs shadow-lg active:scale-95 transition-all"
                >
                  + {isBn ? 'সদস্য যুক্ত করুন' : t.add_member}
                </button>
              </div>
            </div>

            {/* Member Cards Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold serif italic">
                  {isBn ? 'পরিবারের সদস্যদের তালিকা ও স্বাস্থ্য প্রোফাইল' : 'Household Members & Clinical Profiles'}
                </h3>
                {unifiedChart && (
                  <button
                    onClick={() => setView('unified_chart')}
                    className="text-xs font-bold text-purple-600 dark:text-purple-400 underline"
                  >
                    {isBn ? 'সমন্বিত ফ্যামিলি ডায়েট চার্ট দেখুন →' : 'View Unified Family Chart →'}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {familyMembers.map((m) => (
                  <div
                    key={m.id}
                    className={`p-6 rounded-[28px] border relative overflow-hidden transition-all hover:border-purple-500/50 ${
                      darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-100 shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl ${
                          darkMode ? 'bg-purple-950/60 text-purple-300' : 'bg-purple-50 text-purple-700'
                        }`}
                      >
                        {m.name[0]}
                      </div>
                      <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-300 text-[10px] font-black uppercase tracking-wider">
                        {m.relation}
                      </span>
                    </div>
                    <h4 className="font-bold text-lg">{m.name}</h4>
                    <div className="flex flex-wrap gap-2 mt-2 text-xs font-semibold opacity-70">
                      <span>{m.profile.dosha} Dosha</span> • <span>{m.profile.age} yrs</span> •{' '}
                      <span>{m.profile.weight} kg</span>
                    </div>
                    <div
                      className={`mt-4 p-3 rounded-xl border text-xs ${
                        darkMode ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-600'
                      }`}
                    >
                      <span className="font-bold block text-[10px] uppercase opacity-50 mb-0.5">
                        {isBn ? 'শারীরিক কন্ডিশন' : 'Clinical Condition'}
                      </span>
                      {m.profile.medicalConditions || (isBn ? 'স্বাভাবিক মেটাবলিক প্রোফাইল' : 'General Metabolic Wellness')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Unified Family Diet Chart Generator CTA */}
            {familyMembers.length > 0 && (
              <div
                className={`p-6 md:p-8 rounded-[32px] border-2 border-dashed flex flex-col md:flex-row items-center justify-between gap-6 ${
                  darkMode ? 'bg-purple-950/20 border-purple-500/30' : 'bg-purple-50/60 border-purple-200'
                }`}
              >
                <div className="space-y-1 text-center md:text-left">
                  <h4 className="text-lg font-bold serif italic">
                    {isBn
                      ? 'এক হাঁড়িতে পুরো পরিবারের সমন্বিত ডায়েট চার্ট (Unified Family Diet)'
                      : 'Unified Family Diet Plan (One Base Meal, Personalized Portions)'}
                  </h4>
                  <p className="text-xs opacity-70">
                    {isBn
                      ? 'পরিবারের সবার বয়স, ওজন ও রোগ অনুযায়ী কে কতটুকু খাবে তার পূর্ণাঙ্গ ৭ দিনের তালিকা তৈরি করুন।'
                      : 'Generate a 7-day household plan where one base meal is cooked and portions are tailored to each member.'}
                  </p>
                </div>
                <button
                  onClick={generateUnifiedChart}
                  disabled={loading}
                  className="px-8 py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider shadow-xl transition-all active:scale-95 shrink-0 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{isBn ? 'তৈরি হচ্ছে...' : 'Generating...'}</span>
                    </>
                  ) : (
                    <span>⚡ {isBn ? 'ফ্যামিলি ডায়েট চার্ট তৈরি করুন' : t.gen_family_chart}</span>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {view === 'add_member' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold">
                {isBn
                  ? `নতুন সদস্যের অ্যাসেসমেন্ট: ${newMemberName || 'পরিবারের সদস্য'} (${newMemberRelation || 'সদস্য'})`
                  : `Member Assessment: ${newMemberName || 'Family Member'}`}
              </h3>
              <button
                onClick={() => setView('list')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800"
              >
                ← {isBn ? 'তালিকায় ফিরুন' : 'Back to List'}
              </button>
            </div>
            <AssessmentStep
              onComplete={(profile, name) => handleMemberAssessmentComplete(profile, name)}
              lang={lang}
              darkMode={darkMode}
              isDoctorMode={true}
              onCancel={() => setView('list')}
            />
          </div>
        )}

        {view === 'unified_chart' && unifiedChart && (
          <div className="space-y-8 animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setView('list')}
                  className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-purple-600 hover:text-white transition-all"
                >
                  ←
                </button>
                <div>
                  <h3 className="text-2xl font-bold serif italic">
                    {t.unified_plan}: {unifiedChart.familyName}
                  </h3>
                  <p className="text-xs opacity-60">
                    {isBn ? 'সদস্যদের কন্ডিশন অনুযায়ী পোরশন ও মডিফিকেশন গাইড' : 'Per-member portion and modification guide'}
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`p-6 rounded-[28px] border ${
                darkMode ? 'bg-purple-900/10 border-purple-500/30' : 'bg-purple-50 border-purple-100'
              }`}
            >
              <h4 className="font-bold uppercase tracking-widest text-xs mb-2 opacity-60">
                {isBn ? 'ফ্যামিলি নিউট্রিশন কৌশল' : 'Strategy Overview'}
              </h4>
              <p className="italic text-sm font-medium leading-relaxed">{unifiedChart.overview}</p>
            </div>

            <div className="space-y-6">
              {unifiedChart.weeklySchedule.map((day, dIdx) => (
                <div
                  key={dIdx}
                  className={`rounded-[28px] border overflow-hidden ${
                    darkMode ? 'bg-slate-800/20 border-slate-700' : 'bg-white border-slate-100 shadow-sm'
                  }`}
                >
                  <div className="px-6 py-3.5 bg-slate-100 dark:bg-slate-800 font-bold uppercase tracking-widest text-xs">
                    {day.day}
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {day.meals.map((meal, mIdx) => (
                      <div key={mIdx} className="p-6">
                        <div className="flex flex-col md:flex-row gap-6">
                          <div className="md:w-1/3">
                            <span className="text-xs font-black text-purple-500 uppercase tracking-widest block mb-1">
                              {meal.time}
                            </span>
                            <h4 className="text-lg font-bold mb-1.5">{meal.mealName}</h4>
                            <p className="text-xs opacity-70 mb-3">{meal.description}</p>
                            <div className="text-xs font-bold">
                              <span className="opacity-50 uppercase tracking-widest block mb-1 text-[10px]">
                                {t.common_ingredients}
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {meal.ingredients.map((ing, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-[11px]"
                                  >
                                    {ing}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {meal.portions.map((p, pIdx) => (
                              <div
                                key={pIdx}
                                className={`p-4 rounded-2xl border ${
                                  darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'
                                }`}
                              >
                                <div className="flex justify-between items-center mb-1.5">
                                  <span className="font-bold text-sm">{p.memberName}</span>
                                  <span className="text-[11px] font-bold bg-emerald-600 text-white px-2.5 py-0.5 rounded-full">
                                    {p.portion}
                                  </span>
                                </div>
                                <p className="text-xs opacity-70 italic leading-snug">"{p.reason}"</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (inlineMode) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={onClose} />
      {content}
    </div>
  );
};

export default FamilyManagerDashboard;
