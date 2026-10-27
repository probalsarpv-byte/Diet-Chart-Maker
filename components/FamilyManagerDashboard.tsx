
import React, { useState } from 'react';
import { User, Language, FamilyMember, HealthProfile, UnifiedFamilyDiet } from '../types';
import { translations } from '../i18n';
import AssessmentStep from './AssessmentStep';
import { GeminiService } from '../services/geminiService';

interface Props {
  user: User;
  lang: Language;
  darkMode?: boolean;
  onClose: () => void;
}

const FamilyManagerDashboard: React.FC<Props> = ({ user, lang, darkMode, onClose }) => {
  const t = translations[lang];
  const [view, setView] = useState<'register' | 'list' | 'add_member' | 'unified_chart'>('list');
  const [familyName, setFamilyName] = useState(user.name + "'s Family");
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [newMemberRelation, setNewMemberRelation] = useState('');
  const [unifiedChart, setUnifiedChart] = useState<UnifiedFamilyDiet | null>(null);
  const [loading, setLoading] = useState(false);

  const gemini = new GeminiService();

  // If new user entering family flow, show registration first
  if (view === 'register' && familyMembers.length === 0) {
     // Initial logic if needed
  }

  const handleMemberAssessmentComplete = (profile: HealthProfile, name?: string) => {
    const newMember: FamilyMember = {
      id: `FAM-${Date.now()}`,
      name: name || `Member ${familyMembers.length + 1}`,
      relation: newMemberRelation || 'Relative',
      profile: profile
    };
    setFamilyMembers([...familyMembers, newMember]);
    setView('list');
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

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-500">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={onClose} />
      <div className={`relative w-full max-w-6xl h-[90vh] rounded-[40px] shadow-2xl border flex flex-col overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100'}`}>
        
        {/* Header */}
        <div className={`px-8 py-6 border-b flex justify-between items-center ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100'}`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center text-xl shadow-lg">👨‍👩‍👧‍👦</div>
              <div>
                <h2 className="text-xl font-bold serif italic">{t.family_dashboard}</h2>
                <div className="flex items-center gap-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-purple-500">
                    {familyName}
                  </p>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200/50 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
           {view === 'list' && (
             <div className="space-y-8 animate-in fade-in">
                {/* Family Registration Input if just starting */}
                {familyMembers.length === 0 && (
                   <div className={`p-8 rounded-[32px] border mb-8 text-center ${darkMode ? 'bg-purple-900/10 border-purple-500/30' : 'bg-purple-50 border-purple-100'}`}>
                      <h3 className="text-lg font-bold mb-4">{t.register_family}</h3>
                      <input 
                        type="text" 
                        value={familyName}
                        onChange={(e) => setFamilyName(e.target.value)}
                        placeholder={t.family_name}
                        className={`w-full max-w-md p-3 rounded-xl border text-center font-bold outline-none focus:border-purple-500 ${darkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200'}`}
                      />
                   </div>
                )}

                <div className="flex justify-between items-center">
                   <h3 className="text-xl font-bold italic serif">Family Members ({familyMembers.length})</h3>
                   <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={newMemberRelation}
                        onChange={(e) => setNewMemberRelation(e.target.value)}
                        placeholder={t.member_relation}
                        className={`p-3 rounded-xl border text-xs font-bold outline-none w-32 ${darkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200'}`}
                      />
                      <button 
                        onClick={() => { if(newMemberRelation) setView('add_member'); }}
                        disabled={!newMemberRelation}
                        className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all disabled:opacity-50"
                      >
                        + {t.add_member}
                      </button>
                   </div>
                </div>

                {/* Member List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {familyMembers.map(m => (
                     <div key={m.id} className={`p-6 rounded-[32px] border relative overflow-hidden group ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
                        <div className="relative z-10">
                           <div className="flex justify-between items-start mb-4">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${darkMode ? 'bg-slate-700 text-purple-400' : 'bg-purple-50 text-purple-700'}`}>
                                 {m.name[0]}
                              </div>
                              <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest opacity-60">{m.relation}</span>
                           </div>
                           <h4 className="font-bold text-lg">{m.name}</h4>
                           <div className="flex gap-2 mt-2 text-[10px] font-bold opacity-60">
                              <span>{m.profile.dosha}</span> • 
                              <span>{m.profile.age} yrs</span> • 
                              <span>{m.profile.weight}kg</span>
                           </div>
                           <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-xs italic opacity-70 truncate">
                              {m.profile.medicalConditions || "No major conditions"}
                           </div>
                        </div>
                     </div>
                   ))}
                   
                   {familyMembers.length === 0 && (
                      <div className="col-span-full py-20 text-center opacity-40 border-2 border-dashed rounded-[32px] border-slate-300 dark:border-slate-700">
                         <p>Add family members to generate a unified diet plan.</p>
                      </div>
                   )}
                </div>

                {/* Generate Button */}
                {familyMembers.length > 0 && (
                   <div className="flex justify-center pt-8 border-t border-slate-200 dark:border-slate-700">
                      <button 
                        onClick={generateUnifiedChart}
                        disabled={loading}
                        className={`px-12 py-5 rounded-[30px] font-black uppercase tracking-widest text-sm shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 ${darkMode ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}
                      >
                        {loading ? (
                           <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                           <span>⚡ {t.gen_family_chart}</span>
                        )}
                      </button>
                   </div>
                )}
             </div>
           )}

           {view === 'add_member' && (
              <div className="h-full">
                 <AssessmentStep 
                    onComplete={(profile, name) => handleMemberAssessmentComplete(profile, name)} 
                    lang={lang} 
                    darkMode={darkMode}
                    isDoctorMode={true} // Reusing doctor mode to allow entering another person's data
                    onCancel={() => setView('list')}
                 />
              </div>
           )}

           {view === 'unified_chart' && unifiedChart && (
              <div className="space-y-10 animate-in slide-in-from-bottom">
                 <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => setView('list')} className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-purple-600 hover:text-white transition-all">←</button>
                    <h3 className="text-2xl font-bold serif italic">{t.unified_plan}: {unifiedChart.familyName}</h3>
                 </div>

                 <div className={`p-8 rounded-[32px] border ${darkMode ? 'bg-purple-900/10 border-purple-500/30' : 'bg-purple-50 border-purple-100'}`}>
                    <h4 className="font-bold uppercase tracking-widest text-xs mb-3 opacity-60">Strategy Overview</h4>
                    <p className="italic font-medium leading-relaxed">{unifiedChart.overview}</p>
                 </div>

                 <div className="space-y-8">
                    {unifiedChart.weeklySchedule.map((day, dIdx) => (
                       <div key={dIdx} className={`rounded-[32px] border overflow-hidden ${darkMode ? 'bg-slate-800/20 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
                          <div className="px-8 py-4 bg-slate-100 dark:bg-slate-800 font-bold uppercase tracking-widest text-xs">
                             {day.day}
                          </div>
                          <div className="divide-y divide-slate-100 dark:divide-slate-800">
                             {day.meals.map((meal, mIdx) => (
                                <div key={mIdx} className="p-8">
                                   <div className="flex flex-col md:flex-row gap-8">
                                      <div className="md:w-1/3">
                                         <span className="text-xs font-black text-purple-500 uppercase tracking-widest block mb-1">{meal.time}</span>
                                         <h4 className="text-xl font-bold mb-2">{meal.mealName}</h4>
                                         <p className="text-xs opacity-60 mb-4">{meal.description}</p>
                                         <div className="text-xs font-bold">
                                            <span className="opacity-40 uppercase tracking-widest block mb-1">{t.common_ingredients}</span>
                                            <div className="flex flex-wrap gap-2">
                                               {meal.ingredients.map((ing, i) => (
                                                  <span key={i} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md">{ing}</span>
                                               ))}
                                            </div>
                                         </div>
                                      </div>
                                      
                                      <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                         {meal.portions.map((p, pIdx) => (
                                            <div key={pIdx} className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                                               <div className="flex justify-between items-center mb-2">
                                                  <span className="font-bold text-sm">{p.memberName}</span>
                                                  <span className="text-xs font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full">{p.portion}</span>
                                               </div>
                                               <p className="text-[10px] opacity-60 italic leading-tight">"{p.reason}"</p>
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
    </div>
  );
};

export default FamilyManagerDashboard;
