
import React, { useState, useEffect } from 'react';
import { HealthProfile, DietPhaseChart, Phase, AssessmentData, Language, Supplement, User, WeatherData } from '../types';
import { GeminiService } from '../services/geminiService';
import { WeatherService } from '../services/weatherService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { translations } from '../i18n';

interface Props {
  profile: HealthProfile;
  lang: Language;
  darkMode?: boolean;
  currentPhase: Phase;
  onPhaseChange: (p: Phase) => void;
  onWeekComplete: () => void;
  user: User | null;
  onShowPaywall: () => void;
  onUpdateProfile: (p: HealthProfile) => void;
  initialChart: DietPhaseChart | null;
}

const ExerciseAnimation: React.FC<{ type: string; color: string }> = ({ type, color }) => {
  const cue = type.toLowerCase();
  
  if (cue.includes('breathing') || cue.includes('relaxation') || cue.includes('pranayama')) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="absolute w-12 h-12 rounded-full opacity-40 animate-ping" style={{ backgroundColor: color }} />
        <div className="w-16 h-16 rounded-full border-4 transition-all duration-[4s] animate-pulse" style={{ borderColor: color, transform: 'scale(1.2)' }} />
      </div>
    );
  }

  if (cue.includes('stretching') || cue.includes('yoga') || cue.includes('asana')) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-16 h-16">
          <path d="M50 20 L50 40 M30 60 L50 40 L70 60 M50 40 L50 80" stroke={color} strokeWidth="6" fill="none" strokeLinecap="round" className="animate-bounce" />
          <circle cx="50" cy="15" r="8" fill={color} />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center text-4xl animate-bounce">🧘</div>
  );
};

const DietView: React.FC<Props> = ({ profile, lang, darkMode, currentPhase, onPhaseChange, onWeekComplete, user, onShowPaywall, onUpdateProfile, initialChart }) => {
  const t = translations[lang];
  const [chart, setChart] = useState<DietPhaseChart | null>(initialChart);
  const [loading, setLoading] = useState(!initialChart);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [weather, setWeather] = useState<WeatherData | null>(null);

  const gemini = new GeminiService();
  const weatherService = new WeatherService();

  const fetchChart = async (assessment?: AssessmentData, week: number = 1) => {
    setLoading(true);
    try {
      let currentWeather = weather;
      if (!currentWeather && profile.location) {
         currentWeather = await weatherService.getCurrentWeather(profile.location.latitude, profile.location.longitude);
         setWeather(currentWeather);
      }
      const result = await gemini.analyzeHealthAndPhase(profile, currentPhase, week, lang, assessment, currentWeather || undefined);
      setChart(result);
      setCurrentDayIndex(0);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialChart) {
      setCurrentWeek(1);
      fetchChart(undefined, 1);
    } else {
      setChart(initialChart);
      setLoading(false);
      if (profile.location) {
         weatherService.getCurrentWeather(profile.location.latitude, profile.location.longitude).then(setWeather);
      }
    }
  }, [currentPhase, lang, initialChart]);

  const handleNextWeek = () => {
    const nextWeek = currentWeek + 1;
    if (nextWeek > 1 && !user?.isPro) {
      onShowPaywall();
      return;
    }
    onWeekComplete();
    if (nextWeek <= 3) {
       setCurrentWeek(nextWeek);
       fetchChart(undefined, nextWeek);
       window.scrollTo(0,0);
    } else {
       if (!user?.isPro) {
         onShowPaywall();
         return;
       }
       onPhaseChange((Math.min(currentPhase + 1, 4)) as Phase);
    }
  };

  const handlePhaseClick = (p: number) => {
    if (p !== currentPhase) {
      if (!user?.isPro) {
        onShowPaywall();
        return;
      }
      onPhaseChange(p as Phase);
    }
  };

  const macroData = chart?.macros ? [
    { name: t.macro_protein, value: chart.macros.protein, color: '#10b981' },
    { name: t.macro_fats, value: chart.macros.fats, color: '#f59e0b' },
    { name: t.macro_carbs, value: chart.macros.carbs, color: '#3b82f6' }
  ] : [];

  return (
    <div className="space-y-10 relative">
      <div className={`p-4 rounded-[32px] border flex justify-center sticky top-24 z-40 backdrop-blur-md ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-100 shadow-sm'}`}>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(p => (
            <button key={p} onClick={() => handlePhaseClick(p)} className={`px-6 py-2.5 rounded-2xl font-bold text-sm transition-all relative ${currentPhase === p ? (darkMode ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white shadow-lg') : (darkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-800 hover:bg-slate-50')}`}>
              {t.phase} {p}
              {p > 1 && !user?.isPro && <span className="absolute -top-1 -right-1 text-[10px]">🔒</span>}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-6">
          <div className="w-20 h-20 border-4 border-slate-800 border-t-emerald-500 rounded-full animate-spin" />
          <p className="font-bold italic animate-pulse opacity-50">{t.calc_supps}</p>
        </div>
      ) : chart ? (
        <div className="flex flex-col gap-10 pb-32">
          
          {/* Medical & Guardian Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {chart.medicalSafetyNote && (
              <div className={`p-6 rounded-[32px] border-2 animate-in fade-in duration-500 ${darkMode ? 'bg-red-950/20 border-red-900/50 text-red-400' : 'bg-red-50 border-red-100 text-red-800'}`}>
                <div className="flex items-start gap-4">
                  <span className="text-3xl">⚠️</span>
                  <div>
                    <h3 className="font-black uppercase tracking-widest text-[10px] mb-2">{t.medical_notice}</h3>
                    <p className="text-sm font-medium leading-relaxed italic">{chart.medicalSafetyNote}</p>
                  </div>
                </div>
              </div>
            )}

            {chart.drugFoodInteractions && chart.drugFoodInteractions.length > 0 && (
              <div className={`p-6 rounded-[32px] border-2 shadow-xl animate-in slide-in-from-top duration-500 ${darkMode ? 'bg-slate-900 border-orange-900/50' : 'bg-orange-50 border-orange-200'}`}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl text-xl">💊</div>
                    <h3 className={`font-bold text-base leading-none ${darkMode ? 'text-orange-400' : 'text-orange-700'}`}>{t.med_guardian_title}</h3>
                </div>
                <div className="space-y-3">
                    {chart.drugFoodInteractions?.map((warn, i) => (
                      <div key={i} className={`p-3 rounded-xl border text-xs ${warn.severity === 'High' ? (darkMode ? 'bg-red-950/20 border-red-900/50 text-red-300' : 'bg-red-50 border-red-200 text-red-800') : (darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700')}`}>
                        <span className="font-black uppercase mr-2">[{warn.severity}]</span>
                        <strong>{warn.medication} + {warn.foodInteraction}:</strong> {warn.guidance}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-10">
              {/* Header Card */}
              <div className={`p-10 rounded-[40px] border shadow-sm transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <h2 className={`text-4xl font-bold mb-4 serif italic ${darkMode ? 'text-emerald-400' : 'text-slate-900'}`}>{chart.phaseName}</h2>
                <p className="text-lg opacity-80 font-medium leading-relaxed">{chart.focus}</p>
              </div>

              {/* Weekly Schedule */}
              <div className={`rounded-[40px] border shadow-sm overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <div className="px-10 py-6 border-b flex justify-between items-center border-inherit overflow-x-auto scrollbar-hide">
                  <div className="flex items-center gap-4 flex-nowrap">
                    <h3 className="font-bold text-xl italic whitespace-nowrap">{t.daily_schedule}</h3>
                    <div className="flex gap-2">
                      {chart.weeklySchedule?.map((day, idx) => (
                        <button key={idx} onClick={() => setCurrentDayIndex(idx)} className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap ${currentDayIndex === idx ? 'bg-emerald-500 text-white' : (darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500')}`}>{day.day}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-10 space-y-12 min-h-[400px]">
                  {chart.weeklySchedule?.[currentDayIndex]?.meals?.map((meal, idx) => (
                    <div key={idx} className="flex gap-8 group animate-in slide-in-from-right duration-300">
                      <div className="w-24 flex-shrink-0 pt-2 text-xs font-black uppercase tracking-widest text-emerald-500">{meal.time}</div>
                      <div className="space-y-3 flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-2xl group-hover:text-emerald-500 transition">{meal.mealName}</h4>
                          <div className="flex flex-col items-end gap-1">
                             <span className={`text-xs font-bold px-3 py-1 rounded-lg ${darkMode ? 'bg-slate-800 text-emerald-400' : 'bg-slate-100 text-emerald-600'}`}>{meal.quantity}</span>
                             {meal.calories && (
                                <span className="text-[10px] font-black text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                                   🔥 {meal.calories}
                                </span>
                             )}
                          </div>
                        </div>
                        <p className={`text-sm font-medium leading-relaxed italic border p-3 rounded-xl ${darkMode ? 'text-slate-300 bg-slate-800/50 border-slate-700/50' : 'text-slate-600 bg-slate-50 border-slate-100'}`}>{meal.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Aggressive Supplement Protocol */}
              <div className="space-y-6">
                <h3 className={`text-2xl font-bold italic serif px-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{t.aggressive_supp}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {chart.supplements?.map((supp, i) => (
                    <div key={i} className={`p-6 rounded-[32px] border shadow-sm transition-all hover:scale-[1.02] ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-bold text-lg text-emerald-500">{supp.name}</h4>
                          <span className="text-xs font-black uppercase tracking-widest opacity-40">{supp.dosage}</span>
                        </div>
                        <span className="text-2xl">💊</span>
                      </div>
                      <p className="text-xs font-medium opacity-70 mb-4 italic leading-relaxed">"{supp.rationale}"</p>
                      <div className="flex flex-wrap gap-2">
                        {supp.tags?.map(tag => (
                          <span key={tag} className={`text-[8px] font-black uppercase px-2 py-1 rounded-md ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-10">
              {/* Macros Card */}
              <div className={`p-10 rounded-[40px] border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <h3 className="font-bold mb-8 text-xl italic">{t.macro_dist}</h3>
                <div className="h-48 mb-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={macroData} innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value">
                        {macroData.map((entry, index) => <Cell key={index} fill={entry.color} strokeWidth={0} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {macroData.map(m => (
                    <div key={m.name} className={`flex justify-between items-center px-5 py-2 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                      <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} /><span className="text-[10px] font-bold uppercase">{m.name}</span></div>
                      <span className="font-black text-sm">{m.value}g</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Movement / Physical Activity Section */}
              <div className={`p-10 rounded-[40px] border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <h3 className="font-bold mb-6 text-xl italic">{t.movement_plan_title}</h3>
                <div className="space-y-6">
                  {chart.activities?.map((act, i) => (
                    <div key={i} className="flex gap-4 items-center group">
                      <div className={`w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center border shadow-inner ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                        <ExerciseAnimation type={act.type} color="#10b981" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                           <h4 className="font-bold text-sm truncate">{act.name}</h4>
                           <span className="text-[10px] font-black opacity-40 whitespace-nowrap">{act.duration}</span>
                        </div>
                        <p className="text-[10px] opacity-60 leading-tight line-clamp-2 mt-0.5">{act.instructions}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Staples Card */}
              <div className={`p-10 rounded-[40px] border shadow-sm ${darkMode ? 'bg-emerald-950/10 border-emerald-900/30' : 'bg-emerald-50 border-emerald-100'}`}>
                <h3 className="font-bold mb-6 text-xl italic text-emerald-600">{t.staples_title}</h3>
                <div className="space-y-4">
                  <div className="flex gap-4 items-start">
                     <span className="text-xl">🧂</span>
                     <div className="text-xs">
                        <span className="font-black uppercase tracking-widest block opacity-50 mb-1">{t.staple_salt}</span>
                        <p className="font-medium">{chart.staplesAdvice?.salt}</p>
                     </div>
                  </div>
                  <div className="flex gap-4 items-start">
                     <span className="text-xl">🫗</span>
                     <div className="text-xs">
                        <span className="font-black uppercase tracking-widest block opacity-50 mb-1">{t.staple_oil}</span>
                        <p className="font-medium">{chart.staplesAdvice?.oil}</p>
                     </div>
                  </div>
                  <div className="flex gap-4 items-start">
                     <span className="text-xl">💧</span>
                     <div className="text-xs">
                        <span className="font-black uppercase tracking-widest block opacity-50 mb-1">{t.staple_water}</span>
                        <p className="font-medium">{chart.staplesAdvice?.water}</p>
                     </div>
                  </div>
                </div>
              </div>

              {/* Lifestyle & Habits Card */}
              {chart.recommendations && chart.recommendations.length > 0 && (
                <div className={`p-10 rounded-[40px] border shadow-sm ${darkMode ? 'bg-indigo-950/10 border-indigo-900/30' : 'bg-indigo-50 border-indigo-100'}`}>
                  <h3 className={`font-bold mb-6 text-xl italic ${darkMode ? 'text-indigo-400' : 'text-indigo-800'}`}>
                    {t.lifestyle_title}
                  </h3>
                  <ul className="space-y-4">
                    {chart.recommendations.map((rec, i) => (
                      <li key={i} className="flex gap-4 items-start">
                        <span className="text-xl mt-1">🌿</span>
                        <p className={`text-sm font-medium leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{rec}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Forbidden Card */}
              <div className={`p-10 rounded-[40px] border shadow-sm ${darkMode ? 'bg-red-950/10 border-red-900/30 text-red-400' : 'bg-red-50 border-red-100 text-red-800'}`}>
                <h3 className="font-bold mb-6 text-xl italic">{t.foods_avoid}</h3>
                <ul className="space-y-4">
                  {chart.forbiddenFoods?.map((f, i) => <li key={i} className="flex gap-3 items-center text-sm font-bold uppercase tracking-tight"><span className="text-xl">×</span> {f}</li>)}
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-12">
            <button onClick={handleNextWeek} className="bg-slate-900 text-white dark:bg-emerald-600 px-12 py-5 rounded-[30px] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-2xl flex items-center gap-4 relative">
              <span>{t.complete_week} {currentWeek}</span>
              {!user?.isPro && currentWeek >= 1 && <span className="absolute -top-2 -right-2 text-xl">🔒</span>}
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default DietView;
