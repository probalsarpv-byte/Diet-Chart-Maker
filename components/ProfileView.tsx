
import React, { useState } from 'react';
import { HealthProfile, Language, Phase, User } from '../types';
import { translations } from '../i18n';
import HealthPortal from './HealthPortal';
import FamilyManagerDashboard from './FamilyManagerDashboard';

interface Props {
  user: User;
  profile: HealthProfile;
  currentPhase: Phase;
  lang: Language;
  darkMode?: boolean;
  onNavigateToDiet: () => void;
  onNavigateToDashboard?: () => void;
}

const ProfileView: React.FC<Props> = ({ user, profile, currentPhase, lang, darkMode, onNavigateToDiet, onNavigateToDashboard }) => {
  const t = translations[lang];
  const [copied, setCopied] = useState(false);
  const [showPortal, setShowPortal] = useState(false);
  const [showFamilyDash, setShowFamilyDash] = useState(false);

  const isDoctor = user.id.startsWith('DOC-');
  const prof = user.professionalProfile;

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Render Doctor Profile View
  if (isDoctor && prof) {
    return (
      <div className="space-y-10 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom duration-500 pb-32">
        {/* Doctor Hero Card */}
        <div className={`p-8 md:p-12 rounded-[48px] border shadow-2xl flex flex-col md:flex-row gap-10 items-center relative overflow-hidden transition-colors ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
        }`}>
          <div className={`absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32`} />
          
          <div className={`w-32 h-32 rounded-[40px] flex items-center justify-center font-bold text-5xl serif italic shadow-2xl transition-transform hover:scale-105 ${
            darkMode ? 'bg-blue-600 text-white shadow-blue-600/20' : 'bg-slate-900 text-white'
          }`}>
            {prof.fullName[0]}
          </div>

          <div className="text-center md:text-left flex-1 space-y-4">
            <div>
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">
                    {t.verified_practitioner}
                  </span>
                  <button 
                      onClick={() => handleCopyId(user.id)}
                      className={`text-xs font-mono font-bold px-3 py-1 rounded-full border flex items-center gap-2 transition-all ${
                          darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white shadow-sm'
                      }`}
                  >
                      ID: {user.id}
                      {copied ? <span className="text-emerald-500">✓</span> : <span className="opacity-40 text-[10px]">COPY</span>}
                  </button>
              </div>
              
              <h2 className={`text-4xl md:text-5xl font-bold serif italic leading-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {prof.fullName}
              </h2>
              <p className="text-sm font-bold opacity-60 italic">{prof.role} • {prof.specialty}</p>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-3">
               <div className={`px-4 py-2 rounded-2xl border text-xs font-bold ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  {prof.institution}
               </div>
               <div className={`px-4 py-2 rounded-2xl border text-xs font-bold ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  {prof.experienceYears}+ Years Exp.
               </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full md:w-auto">
            <button 
              onClick={onNavigateToDashboard}
              className={`w-full px-10 py-5 rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-xl transition-all active:scale-95 bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20`}
            >
              {t.open_dashboard}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Professional Stats */}
          <div className={`md:col-span-2 p-10 rounded-[48px] border shadow-sm space-y-8 transition-colors ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          }`}>
             <h3 className={`text-2xl font-bold serif italic ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{t.clinical_overview}</h3>
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                <div className="p-6 rounded-3xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 text-center">
                   <div className="text-3xl font-black text-blue-600">12</div>
                   <div className="text-[10px] font-black uppercase tracking-widest opacity-50">{t.active_patients}</div>
                </div>
                <div className="p-6 rounded-3xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 text-center">
                   <div className="text-3xl font-black text-emerald-600">94%</div>
                   <div className="text-[10px] font-black uppercase tracking-widest opacity-50">{t.adherence_avg}</div>
                </div>
                <div className="p-6 rounded-3xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 text-center">
                   <div className="text-3xl font-black text-amber-600">450</div>
                   <div className="text-[10px] font-black uppercase tracking-widest opacity-50">{t.metabolic_insights}</div>
                </div>
             </div>
             
             <div className={`p-6 rounded-[32px] border-2 border-dashed ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-3">Verification Badge</h4>
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xl shadow-lg">✓</div>
                   <div>
                      <p className="text-sm font-bold">{t.med_license_verified}</p>
                      <p className="text-xs opacity-60">Credentials synced with clinical database.</p>
                   </div>
                </div>
             </div>
          </div>

          <div className={`p-8 rounded-[48px] border shadow-sm transition-colors ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          }`}>
             <h3 className="font-bold mb-6 italic serif text-lg">Quick Actions</h3>
             <div className="space-y-3">
                <button 
                  onClick={onNavigateToDashboard}
                  className={`w-full p-4 rounded-2xl flex items-center gap-3 transition-all ${darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100 border'}`}
                >
                   <span className="text-xl">📋</span>
                   <span className="text-sm font-bold">{t.manage_roster}</span>
                </button>
                <button className={`w-full p-4 rounded-2xl flex items-center gap-3 transition-all ${darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100 border'}`}>
                   <span className="text-xl">📔</span>
                   <span className="text-sm font-bold">{t.clinical_notes}</span>
                </button>
             </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback / Patient Logic
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

  const healthId = `AM-${profile.dosha?.toUpperCase()}-${(profile.age * 1234).toString().slice(0,4)}`;

  return (
    <div className="space-y-10 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom duration-500 pb-32">
      
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

      {showFamilyDash && (
        <FamilyManagerDashboard 
          user={user}
          lang={lang}
          darkMode={darkMode}
          onClose={() => setShowFamilyDash(false)}
        />
      )}

      {/* Hero Section: Identity & Quick Stats */}
      <div className={`p-8 md:p-12 rounded-[48px] border shadow-2xl flex flex-col md:flex-row gap-10 items-center relative overflow-hidden transition-colors ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
      }`}>
        <div className={`absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-32 -mt-32`} />
        
        <div className={`w-32 h-32 rounded-[40px] flex items-center justify-center font-bold text-5xl serif italic shadow-2xl transition-transform hover:scale-105 ${
          darkMode ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/10' : 'bg-slate-900 text-white'
        }`}>
          {profile.dosha?.[0] || 'P'}
        </div>

        <div className="text-center md:text-left flex-1 space-y-4">
          <div>
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  {t.verified_bio}
                </span>
                <button 
                    onClick={() => handleCopyId(healthId)}
                    className={`text-xs font-mono font-bold px-3 py-1 rounded-full border flex items-center gap-2 transition-all ${
                        darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white shadow-sm'
                    }`}
                >
                    ID: {healthId}
                    {copied ? <span className="text-emerald-500">✓</span> : <span className="opacity-40 text-[10px]">COPY</span>}
                </button>
            </div>
            
            <h2 className={`text-4xl md:text-5xl font-bold serif italic leading-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {t.welcome.replace('{dosha}', profile.dosha || 'Patient')}
            </h2>
          </div>

          <div className="flex flex-wrap justify-center md:justify-start gap-3">
             <div className={`px-4 py-2 rounded-2xl border text-xs font-bold ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                {profile.age} yrs • {profile.gender} • {profile.weight}kg
             </div>
             <div className="bg-amber-500 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
                {user.points} {t.pts} <span className="text-sm">⭐</span>
             </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full md:w-auto">
          <div className="flex gap-2 w-full">
             <button 
                onClick={() => setShowPortal(true)}
                className={`flex-1 px-6 py-4 rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-xl transition-all active:scale-95 ${
                  darkMode ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20' : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                {t.patient_portal}
              </button>
              <button 
                onClick={() => setShowFamilyDash(true)}
                className={`flex-1 px-6 py-4 rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-xl transition-all active:scale-95 bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/20`}
              >
                {t.family_pkg_btn}
              </button>
          </div>
          <button 
            onClick={onNavigateToDiet}
            className={`w-full px-8 py-4 rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-xl transition-all active:scale-95 bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/20`}
          >
            {t.diet_chart}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Health Synthesis Dashboard */}
        <div className={`md:col-span-2 p-10 rounded-[48px] border shadow-sm space-y-8 transition-colors ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
        }`}>
          <div className="flex justify-between items-center border-b border-inherit pb-6">
            <h3 className={`text-2xl font-bold serif italic ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{t.clinical_synthesis}</h3>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Overall Health Condition</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="space-y-6">
               <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-3">{t.microbiome} Diversity</h4>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-4xl font-black">{profile.microbiomeScore}%</span>
                    <span className="text-[10px] font-bold opacity-50 pb-1">Excellent</span>
                  </div>
                  <div className="h-1.5 bg-slate-700/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${profile.microbiomeScore}%` }} />
                  </div>
               </div>
               <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-3">{t.inflam_status} Index</h4>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-4xl font-black">{profile.inflammatoryIndex}/10</span>
                    <span className="text-[10px] font-bold opacity-50 pb-1">{profile.inflammatoryIndex < 4 ? 'Optimal' : 'High Risk'}</span>
                  </div>
                  <div className="h-1.5 bg-slate-700/10 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 transition-all duration-1000" style={{ width: `${profile.inflammatoryIndex * 10}%` }} />
                  </div>
               </div>
            </div>

            <div className={`p-6 rounded-[32px] border ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
               <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500 font-black text-xs">pH</div>
                  <h4 className="text-xs font-black uppercase tracking-widest opacity-60">{t.alkaline_score}</h4>
               </div>
               <div className="text-5xl font-black mb-2 text-indigo-500">
                  {profile.analysis?.alkalineScore || 7.4}
               </div>
               <p className="text-[10px] font-medium leading-relaxed opacity-60 italic">
                  "{profile.analysis?.alkalineScore && profile.analysis.alkalineScore > 7.3 ? 'Cellular environment is optimally alkaline, supporting metabolic detox.' : 'Metabolic acidity detected; protocol focuses on shift to alkalinity.'}"
               </p>
            </div>
          </div>

          <div className={`p-6 rounded-[32px] border-2 border-dashed ${darkMode ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50/50 border-amber-200'}`}>
             <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2">Ayurvedic Perspective</h4>
             <p className={`text-sm leading-relaxed font-medium italic ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                {profile.analysis?.healthSummary || `Profile synthesis suggests dominant ${profile.dosha} Dosha with good cellular resilience.`}
             </p>
          </div>
        </div>

        {/* Shakti or Secondary Sidebar */}
        <div className="space-y-8">
           {profile.gender === 'Female' && profile.cycleData ? (
             <div className={`p-8 rounded-[48px] border shadow-sm relative overflow-hidden transition-colors ${
               darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
             }`}>
               <div className={`absolute top-0 right-0 p-4 opacity-10 font-serif italic text-7xl ${phaseColor}`}>
                 {cycleDay}
               </div>
               <div className="relative z-10">
                 <div className="flex items-center gap-2 mb-6">
                   <span className="text-3xl">🌺</span>
                   <h3 className="font-bold text-lg serif italic">{t.cycle_sync}</h3>
                 </div>
                 
                 <div className="mb-8">
                   <div className={`text-3xl font-black ${phaseColor} mb-1`}>{cyclePhase}</div>
                   <div className="text-[10px] font-black uppercase tracking-widest opacity-50">Day {cycleDay} of {profile.cycleData.cycleLength}</div>
                 </div>

                 <div className={`p-5 rounded-3xl text-xs font-bold leading-relaxed ${darkMode ? 'bg-slate-800 text-emerald-400' : 'bg-emerald-50 text-emerald-800'}`}>
                   {advice}
                 </div>
               </div>
             </div>
           ) : (
             <div className={`p-8 rounded-[48px] border shadow-sm transition-colors ${
               darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
             }`}>
               <h3 className="font-bold mb-6 italic serif text-lg">{t.goal_tracking}</h3>
               <div className="space-y-4">
                  <div className={`p-4 rounded-3xl ${darkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                     <span className="text-[9px] font-black uppercase opacity-40 block mb-1">{t.primary_target}</span>
                     <span className="text-sm font-bold">{profile.dietGoals || 'Phase 1 Recalibration'}</span>
                  </div>
                  <div className={`p-4 rounded-3xl ${darkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                     <span className="text-[9px] font-black uppercase opacity-40 block mb-1">{t.metabolic_type}</span>
                     <span className="text-sm font-bold">{profile.metabolicType}</span>
                  </div>
               </div>
             </div>
           )}

           {/* Quick Stats Grid */}
           <div className="grid grid-cols-2 gap-4">
              <div className={`p-6 rounded-[32px] border text-center ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                 <div className="text-2xl font-black text-emerald-500">{profile.adherenceHistory?.length || 0}</div>
                 <div className="text-[8px] font-black uppercase tracking-widest opacity-40">{t.healing_streak}</div>
              </div>
              <div className={`p-6 rounded-[32px] border text-center ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                 <div className="text-2xl font-black text-blue-500">#{currentPhase}</div>
                 <div className="text-[8px] font-black uppercase tracking-widest opacity-40">{t.active_phase_label}</div>
              </div>
           </div>
        </div>
      </div>

      {/* Rewards Hub */}
      <div className={`p-10 rounded-[48px] border shadow-sm space-y-10 transition-colors ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
      }`}>
         <div className="flex justify-between items-center">
            <h3 className={`text-2xl font-bold italic serif ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{t.rewards_hub}</h3>
            <div className="px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-black uppercase tracking-widest border border-amber-500/20">{t.points_label}</div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Badges Display */}
            <div className="space-y-6">
               <h4 className="text-[10px] font-black uppercase tracking-widest opacity-50">{t.badges_title}</h4>
               <div className="grid grid-cols-4 gap-4">
                  {user.badges?.map(badge => (
                    <div 
                      key={badge.id} 
                      title={badge.description}
                      className={`aspect-square rounded-3xl flex flex-col items-center justify-center gap-2 border transition-all hover:translate-y-[-4px] ${
                         badge.unlocked 
                          ? (darkMode ? 'bg-amber-500/10 border-amber-500/40 grayscale-0' : 'bg-amber-50 border-amber-200 grayscale-0 shadow-lg')
                          : 'opacity-10 grayscale'
                      }`}
                    >
                       <span className="text-2xl md:text-3xl">{badge.icon}</span>
                       <span className="text-[8px] font-black uppercase text-center px-1 leading-tight">{badge.name}</span>
                    </div>
                  ))}
               </div>
            </div>

            {/* Daily Adherence Heatmap Summary */}
            <div className={`p-8 rounded-[40px] border flex flex-col ${darkMode ? 'bg-slate-800/20 border-slate-700' : 'bg-slate-50 border-slate-100 shadow-inner'}`}>
               <h4 className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-6">{t.metabolic_consistency}</h4>
               <div className="flex gap-2 flex-wrap flex-1 content-start">
                  {[...Array(28)].map((_, i) => {
                    const history = profile.adherenceHistory?.[i];
                    const score = history?.score || 0;
                    return (
                      <div 
                        key={i} 
                        className={`w-6 h-6 rounded-md transition-all ${
                          !history ? 'bg-slate-200 dark:bg-slate-800 opacity-30' : 
                          score > 80 ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 
                          score > 50 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        title={history ? `Day ${i+1}: ${score}%` : 'Future Day'}
                      />
                    );
                  })}
               </div>
               <p className="mt-6 text-[10px] font-bold opacity-40 leading-relaxed italic">
                 Consistency in Phase {currentPhase} protocol determines your progression to Phase {currentPhase + 1}.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default ProfileView;
