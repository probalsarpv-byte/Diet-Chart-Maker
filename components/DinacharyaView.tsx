
import React, { useState, useEffect, useRef } from 'react';
import { HealthProfile, Language, DinacharyaSchedule, DinacharyaActivity, WeatherData } from '../types';
import { translations } from '../i18n';
import { GeminiService } from '../services/geminiService';
import { WeatherService } from '../services/weatherService';

interface Props {
  profile: HealthProfile;
  lang: Language;
  darkMode?: boolean;
}

const DinacharyaView: React.FC<Props> = ({ profile, lang, darkMode }) => {
  const t = translations[lang];
  const [schedule, setSchedule] = useState<DinacharyaSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRamadan, setIsRamadan] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [activeTimer, setActiveTimer] = useState<{ id: string, seconds: number } | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const gemini = new GeminiService();
  const weatherService = new WeatherService();
  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    const clock = setInterval(() => setCurrentTime(new Date()), 60000);
    loadSchedule();
    return () => clearInterval(clock);
  }, [isRamadan]);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      let localWeather = weather;
      if (!localWeather && profile.location) {
        localWeather = await weatherService.getCurrentWeather(profile.location.latitude, profile.location.longitude);
        setWeather(localWeather);
      }
      
      const sunrise = localWeather?.sunrise ? new Date(localWeather.sunrise).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "06:00 AM";
      const sunset = localWeather?.sunset ? new Date(localWeather.sunset).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "06:00 PM";
      
      const result = await gemini.generateDinacharyaSchedule(profile, sunrise, sunset, isRamadan, lang);
      setSchedule(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const speak = (text: string) => {
    if (synthRef.current.speaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'bn' ? 'bn-BD' : 'en-US';
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    synthRef.current.speak(utterance);
  };

  const startRitualTimer = (id: string, seconds: number) => {
    if (activeTimer?.id === id) {
      clearInterval(timerRef.current);
      setActiveTimer(null);
      return;
    }
    setActiveTimer({ id, seconds });
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveTimer(prev => {
        if (prev && prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        clearInterval(timerRef.current);
        speak("Ritual complete.");
        return null;
      });
    }, 1000);
  };

  const getTimeGradient = () => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 8) return 'from-orange-400 to-blue-400'; // Dawn
    if (hour >= 8 && hour < 17) return 'from-blue-400 to-sky-200'; // Day
    if (hour >= 17 && hour < 20) return 'from-orange-600 to-indigo-900'; // Dusk
    return 'from-slate-950 to-slate-900'; // Night
  };

  return (
    <div className={`min-h-screen transition-all duration-1000 bg-gradient-to-b ${getTimeGradient()} text-white p-6 pb-32`}>
      <div className="max-w-xl mx-auto space-y-8 animate-in fade-in">
        
        {/* Top Header */}
        <div className="flex justify-between items-center bg-white/10 backdrop-blur-md p-6 rounded-[32px] border border-white/20 shadow-2xl">
           <div>
              <h2 className="text-3xl font-bold serif italic mb-1">{t.dinacharya_title}</h2>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest opacity-70">
                 <span>{profile.dosha || 'Ayurvedic'} {t.flow}</span>
                 <span className="w-1 h-1 rounded-full bg-white/40" />
                 <span>{isRamadan ? "Ramadan" : "Standard"}</span>
              </div>
           </div>
           <div className="text-right">
              <div className="text-4xl font-light font-mono leading-none">
                 {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <button 
                onClick={() => setIsRamadan(!isRamadan)}
                className="mt-2 text-[10px] font-bold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full hover:bg-white/30 transition-all"
              >
                {isRamadan ? "🌙 Ramadan Active" : "☀️ Standard Mode"}
              </button>
           </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
             <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
             <p className="font-bold animate-pulse uppercase tracking-widest text-xs">Aligning Circadian Logic...</p>
          </div>
        ) : schedule && (
          <div className="space-y-8">
            {/* Brahma Muhurta Insight */}
            <div className="bg-emerald-500/20 backdrop-blur-lg border border-emerald-500/30 p-6 rounded-[32px] flex items-center gap-4">
               <span className="text-4xl">✨</span>
               <div>
                  <h4 className="font-black uppercase tracking-widest text-[10px] text-emerald-400">{t.bio_awakening}</h4>
                  <p className="text-sm font-bold">Brahma Muhurta: {schedule.brahmaMuhurta}</p>
                  <p className="text-xs opacity-70 mt-1 italic">"{schedule.doshaFocus}"</p>
               </div>
            </div>

            {/* Timeline */}
            <div className="relative space-y-6">
               <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-white/10" />
               
               {schedule.activities?.map((act, i) => (
                 <div key={i} className="relative pl-16 group">
                    <div className={`absolute left-0 top-1 w-14 h-14 rounded-2xl flex items-center justify-center text-xl transition-all shadow-lg ${
                       act.type === 'Wake' ? 'bg-amber-400 text-amber-900' :
                       act.type === 'Meal' ? 'bg-emerald-500 text-white' :
                       act.type === 'Ritual' ? 'bg-indigo-500 text-white' :
                       'bg-white/10 text-white'
                    }`}>
                       {act.type === 'Wake' ? '🌅' : act.type === 'Meal' ? '🥗' : act.type === 'Ritual' ? '🧘' : '🌙'}
                    </div>
                    
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-5 rounded-[24px] hover:bg-white/10 transition-all group-hover:translate-x-2">
                       <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-black font-mono text-white/50">{act.time}</span>
                          <button 
                            onClick={() => speak(act.voiceScript)}
                            className={`p-2 rounded-full transition-all ${isSpeaking ? 'bg-blue-500 text-white' : 'hover:bg-white/20'}`}
                          >
                             {isSpeaking ? '🔊' : '🔈'}
                          </button>
                       </div>
                       <h4 className="text-lg font-bold mb-1">{act.name}</h4>
                       <p className="text-xs opacity-70 leading-relaxed italic">{act.description}</p>
                       
                       {act.timerSeconds && (
                          <button 
                            onClick={() => startRitualTimer(act.name, act.timerSeconds!)}
                            className={`mt-4 w-full py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 ${
                               activeTimer?.id === act.name ? 'bg-red-500 text-white animate-pulse' : 'bg-white/10 text-white'
                            }`}
                          >
                             {activeTimer?.id === act.name ? (
                                <>⏹ {t.stop_ritual} ({Math.floor(activeTimer.seconds / 60)}:{String(activeTimer.seconds % 60).padStart(2, '0')})</>
                             ) : (
                                <>⏱ {t.start_timer} ({Math.floor(act.timerSeconds / 60)}m)</>
                             )}
                          </button>
                       )}
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DinacharyaView;
