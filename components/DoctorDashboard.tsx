
import React, { useState, useEffect } from 'react';
import { HealthProfile, Language, Phase, User, DailyAdherence, DietPhaseChart } from '../types';
import { translations } from '../i18n';
import { GeminiService } from '../services/geminiService';
import AssessmentStep from './AssessmentStep';
import AnalysisReport from './AnalysisReport';
import DietView from './DietView';

interface Props {
  user: User;
  profile: HealthProfile;
  currentPhase: Phase;
  lang: Language;
  darkMode?: boolean;
  onClose: () => void;
  onSubscribeSuccess: () => void;
}

interface PatientSummary {
  id: string;
  name: string;
  dosha: string;
  phase: number;
  profile: HealthProfile;
}

const DoctorDashboard: React.FC<Props> = ({ user, profile, currentPhase, lang, darkMode, onClose, onSubscribeSuccess }) => {
  const t = translations[lang];
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'subscribe' | 'monitoring' | 'result'>('list');
  const [isSubscribed, setIsSubscribed] = useState(user.isPro);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientSummary | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [activeTab, setActiveTab] = useState<'report' | 'diet' | 'compliance'>('compliance');
  const [patientChart, setPatientChart] = useState<DietPhaseChart | null>(null);

  const gemini = new GeminiService();

  // Calculate Trial Status
  const trialStart = new Date(user.trialStartDate).getTime();
  const now = new Date().getTime();
  const daysDiff = (now - trialStart) / (1000 * 60 * 60 * 24);
  const isTrialActive = daysDiff <= 7;

  const [patients, setPatients] = useState<PatientSummary[]>([
    { 
      id: 'AM-VATA-9921', 
      name: 'Ariful Islam', 
      dosha: 'Vata', 
      phase: 1, 
      profile: { 
        ...profile, 
        dosha: 'Vata', 
        age: 42,
        adherenceHistory: [
          { date: '2023-11-01', score: 92, items: [], pointsEarned: 19 },
          { date: '2023-11-02', score: 88, items: [], pointsEarned: 18 },
          { date: '2023-11-03', score: 45, items: [], pointsEarned: 14 },
          { date: '2023-11-04', score: 95, items: [], pointsEarned: 20 },
          { date: '2023-11-05', score: 90, items: [], pointsEarned: 19 }
        ]
      } 
    },
    { 
        id: 'AM-PITTA-3142', 
        name: 'Sultana Begum', 
        dosha: 'Pitta', 
        phase: 2, 
        profile: { 
          ...profile, 
          dosha: 'Pitta', 
          age: 38,
          adherenceHistory: [
            { date: '2023-11-01', score: 80, items: [], pointsEarned: 18 },
            { date: '2023-11-02', score: 75, items: [], pointsEarned: 17 }
          ]
        } 
      }
  ]);

  const handleSubscribe = (plan: string) => {
    setLoading(true);
    setTimeout(() => {
      setIsSubscribed(true);
      setLoading(false);
      setViewMode('list');
      onSubscribeSuccess();
    }, 1500);
  };

  const handleCompletePatientAssessment = async (pProfile: HealthProfile, pName?: string) => {
    setLoading(true);
    const newId = `AM-${pProfile.dosha.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPatient: PatientSummary = {
      id: newId,
      name: pName || 'Guest Patient',
      dosha: pProfile.dosha,
      phase: 1,
      profile: pProfile
    };

    // Prefetch diet chart for result screen
    try {
      const chart = await gemini.analyzeHealthAndPhase(pProfile, 1, 1, lang);
      setPatientChart(chart);
    } catch (e) {
      console.error(e);
    }

    setPatients([newPatient, ...patients]);
    setSelectedPatient(newPatient);
    setViewMode('result');
    setActiveTab('compliance');
    setLoading(false);
  };

  const handlePatientClick = async (patient: PatientSummary) => {
    setLoading(true);
    setSelectedPatient(patient);
    
    // Fetch their current phase chart for monitoring view
    try {
        const chart = await gemini.analyzeHealthAndPhase(patient.profile, patient.phase, 1, lang);
        setPatientChart(chart);
    } catch (e) {
        console.error(e);
    }
    
    setViewMode('monitoring');
    setActiveTab('compliance');
    setLoading(false);
  };

  const handleCopyId = () => {
    if (selectedPatient) {
      navigator.clipboard.writeText(selectedPatient.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  if (!isTrialActive && !isSubscribed) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-500">
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={onClose} />
        <div className={`relative w-full max-w-xl p-10 rounded-[40px] shadow-2xl border text-center ${darkMode ? 'bg-slate-900 border-blue-500/30' : 'bg-white border-blue-100'}`}>
          <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-xl">💳</div>
          <h2 className="text-3xl font-bold serif italic mb-4">{t.doc_subscription_title}</h2>
          <p className="text-sm opacity-60 mb-4 leading-relaxed">Your 7-day professional trial has ended.</p>
          <div className="space-y-4">
             {[
               { id: '3m', label: t.doc_plan_3m, price: '$149' },
               { id: '6m', label: t.doc_plan_6m, price: '$249' },
               { id: '1y', label: t.doc_plan_1y, price: '$399' }
             ].map(plan => (
               <button 
                 key={plan.id}
                 onClick={() => handleSubscribe(plan.id)}
                 disabled={loading}
                 className={`w-full p-6 rounded-3xl border-2 text-left flex justify-between items-center transition-all hover:border-blue-500 group ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}
               >
                 <div>
                    <h4 className="font-bold text-sm mb-1">{plan.label}</h4>
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">Select Plan</span>
                 </div>
                 <span className="text-lg font-black text-blue-600">{plan.price}</span>
               </button>
             ))}
          </div>
          <button onClick={onClose} className="mt-8 text-xs font-bold opacity-40 uppercase hover:opacity-100">{t.cancel}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-500">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={onClose} />
      <div className={`relative w-full max-w-6xl h-[90vh] rounded-[40px] shadow-2xl border flex flex-col overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100'}`}>
        
        {viewMode !== 'create' && (
          <div className={`px-8 py-6 border-b flex justify-between items-center ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100'}`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xl shadow-lg">🩺</div>
              <div>
                <h2 className="text-xl font-bold serif italic">{t.doctor_dashboard}</h2>
                <div className="flex items-center gap-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-blue-500">
                    {isSubscribed ? 'Medical License: Professional Plus' : `Trial Active: ${7 - Math.floor(daysDiff)} Days Left`}
                  </p>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200/50 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
           {viewMode === 'list' ? (
             <div className="space-y-8 animate-in fade-in duration-300">
                <div className="flex justify-between items-center">
                   <h3 className="text-xl font-bold italic serif">{t.my_patients}</h3>
                   <button 
                     onClick={() => setViewMode('create')}
                     className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all"
                   >
                     + {t.add_patient_title}
                   </button>
                </div>

                <div className="grid gap-6">
                   {patients.map(p => (
                     <div key={p.id} onClick={() => handlePatientClick(p)} className={`p-6 rounded-[32px] border flex justify-between items-center cursor-pointer transition-all hover:translate-x-2 group ${darkMode ? 'bg-slate-800/40 border-slate-700 hover:border-blue-500/50' : 'bg-white border-slate-100 shadow-sm hover:border-blue-500'}`}>
                        <div className="flex items-center gap-6">
                           <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl ${darkMode ? 'bg-slate-700 text-blue-400' : 'bg-blue-50 text-blue-700 shadow-inner'}`}>{p.name[0]}</div>
                           <div>
                              <div className="font-bold text-lg group-hover:text-blue-500 transition-colors">{p.name}</div>
                              <div className="text-[10px] font-mono opacity-50 uppercase tracking-widest">Health ID: {p.id}</div>
                           </div>
                        </div>
                        <div className="flex gap-8 items-center">
                           <div className="flex flex-col items-end">
                              <span className="text-[8px] font-black uppercase opacity-40">Adherence</span>
                              <span className={`text-sm font-black ${p.profile.adherenceHistory && p.profile.adherenceHistory.length > 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                                {p.profile.adherenceHistory?.length ? `${Math.round(p.profile.adherenceHistory.reduce((acc, curr) => acc + curr.score, 0) / p.profile.adherenceHistory.length)}%` : 'New'}
                              </span>
                           </div>
                           <div className="flex flex-col items-center">
                              <span className="text-[8px] font-black uppercase opacity-40">Phase</span>
                              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase">{p.phase}</span>
                           </div>
                           <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                              <span className="text-xl">›</span>
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
           ) : viewMode === 'create' ? (
             <div className="animate-in slide-in-from-right duration-500 h-full">
                <AssessmentStep 
                   onComplete={handleCompletePatientAssessment}
                   lang={lang}
                   darkMode={darkMode}
                   isDoctorMode={true}
                   onCancel={() => setViewMode('list')}
                />
             </div>
           ) : (viewMode === 'monitoring' || viewMode === 'result') && selectedPatient ? (
             <div className="animate-in slide-in-from-bottom duration-500 space-y-10 pb-20">
               {/* Context Header for Monitoring/Result */}
               <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                     <button onClick={() => setViewMode('list')} className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white transition-all">←</button>
                     <div>
                        <h3 className="text-3xl font-bold serif italic">{selectedPatient.name}</h3>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">ID: {selectedPatient.id}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-50">{selectedPatient.dosha} Type</span>
                        </div>
                     </div>
                  </div>
                  
                  <div className="flex gap-2">
                     <div className={`px-6 py-3 rounded-2xl font-mono text-lg font-black tracking-widest border-2 ${darkMode ? 'bg-slate-900 border-emerald-500/50 text-white' : 'bg-white border-emerald-500 text-emerald-900'}`}>
                        {selectedPatient.id}
                     </div>
                     <button 
                       onClick={handleCopyId}
                       className={`px-6 py-3 rounded-2xl transition-all active:scale-95 font-black uppercase tracking-widest text-[10px] ${darkMode ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg'}`}
                     >
                        {copiedId ? "✓ Copied" : "📋 Copy ID"}
                     </button>
                  </div>
               </div>

               {/* Tabs */}
               <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800">
                  <button 
                    onClick={() => setActiveTab('compliance')}
                    className={`px-8 py-4 font-black uppercase tracking-widest text-[10px] border-b-2 transition-all ${activeTab === 'compliance' ? 'border-blue-600 text-blue-600' : 'border-transparent opacity-50'}`}
                  >
                     Patient Compliance
                  </button>
                  <button 
                    onClick={() => setActiveTab('report')}
                    className={`px-8 py-4 font-black uppercase tracking-widest text-[10px] border-b-2 transition-all ${activeTab === 'report' ? 'border-blue-600 text-blue-600' : 'border-transparent opacity-50'}`}
                  >
                     Clinical Analysis
                  </button>
                  <button 
                    onClick={() => setActiveTab('diet')}
                    className={`px-8 py-4 font-black uppercase tracking-widest text-[10px] border-b-2 transition-all ${activeTab === 'diet' ? 'border-blue-600 text-blue-600' : 'border-transparent opacity-50'}`}
                  >
                     Active Diet Chart
                  </button>
               </div>

               {/* Tab Content */}
               <div className="animate-in fade-in duration-500">
                  {activeTab === 'compliance' ? (
                     <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                           <div className={`p-8 rounded-[40px] border shadow-sm ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-100'}`}>
                              <h4 className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-4">{t.total_compliance}</h4>
                              <div className="text-5xl font-black text-emerald-500">
                                {selectedPatient.profile.adherenceHistory?.length ? 
                                  `${Math.round(selectedPatient.profile.adherenceHistory.reduce((acc, curr) => acc + curr.score, 0) / selectedPatient.profile.adherenceHistory.length)}%` : 
                                  '0%'}
                              </div>
                              <p className="text-[10px] mt-2 font-bold uppercase opacity-40">Clinical Average</p>
                           </div>
                           <div className={`p-8 rounded-[40px] border col-span-2 shadow-sm ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-100'}`}>
                              <h4 className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-6">{t.adherence_report}</h4>
                              <div className="flex gap-3 flex-wrap">
                                {selectedPatient.profile.adherenceHistory?.map((h, i) => (
                                  <div 
                                    key={i} 
                                    title={`${h.date}: ${h.score}%`}
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-[10px] font-black text-white transition-all hover:scale-110 shadow-lg ${
                                      h.score > 80 ? 'bg-emerald-500 shadow-emerald-500/20' : h.score > 50 ? 'bg-amber-500 shadow-amber-500/20' : 'bg-red-500 shadow-red-500/20'
                                    }`}
                                  >
                                    {h.score}%
                                  </div>
                                ))}
                              </div>
                           </div>
                        </div>

                        <div className={`p-8 rounded-[40px] border shadow-sm ${darkMode ? 'bg-slate-800/20 border-slate-700' : 'bg-white border-slate-100'}`}>
                           <h4 className="text-sm font-black uppercase tracking-widest opacity-50 mb-8 italic">Patient Daily Submission Logs</h4>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {selectedPatient.profile.adherenceHistory?.slice().reverse().map((h, i) => (
                                <div key={i} className={`p-5 rounded-2xl border flex justify-between items-center transition-all hover:scale-[1.02] ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100 shadow-sm'}`}>
                                   <div>
                                      <div className="font-bold text-sm">{new Date(h.date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}</div>
                                      <div className="text-[9px] font-black uppercase opacity-40 tracking-widest mt-1">{h.items.filter(it => it.completed).length} checklist items verified</div>
                                   </div>
                                   <div className={`text-xl font-black ${h.score > 80 ? 'text-emerald-500' : 'text-amber-500'}`}>{h.score}%</div>
                                </div>
                              ))}
                           </div>
                        </div>
                     </div>
                  ) : activeTab === 'report' ? (
                     <div className="p-8 bg-slate-50/50 dark:bg-slate-800/20 rounded-[40px] border border-inherit">
                        <AnalysisReport 
                          profile={selectedPatient.profile} 
                          lang={lang} 
                          darkMode={darkMode} 
                          onProceed={() => setActiveTab('compliance')} 
                        />
                     </div>
                  ) : (
                     <div className="p-8 bg-slate-50/50 dark:bg-slate-800/20 rounded-[40px] border border-inherit">
                        {patientChart ? (
                            <DietView 
                                profile={selectedPatient.profile}
                                lang={lang}
                                darkMode={darkMode}
                                currentPhase={selectedPatient.phase as Phase}
                                onPhaseChange={() => {}}
                                onWeekComplete={() => {}}
                                user={user}
                                onShowPaywall={() => {}}
                                onUpdateProfile={(updated) => {
                                    setSelectedPatient({ ...selectedPatient, profile: updated });
                                }}
                                initialChart={patientChart}
                            />
                        ) : (
                            <div className="py-20 text-center">
                                <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
                                <p className="font-bold opacity-50">Fetching patient metabolic chart...</p>
                            </div>
                        )}
                     </div>
                  )}
               </div>

               <div className="flex justify-center pt-10 border-t border-slate-100 dark:border-slate-800">
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`px-12 py-5 rounded-[30px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 ${darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                  >
                     Exit Patient View
                  </button>
               </div>
             </div>
           ) : null}
        </div>
      </div>
      
      {loading && (
        <div className="absolute inset-0 z-[300] bg-slate-950/20 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] shadow-2xl flex flex-col items-center gap-6 border border-blue-500/20">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="font-black uppercase tracking-widest text-xs animate-pulse italic">Synchronizing Medical Data...</p>
            </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
