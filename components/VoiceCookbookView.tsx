
import React, { useState, useEffect, useRef } from 'react';
import { HealthProfile, Language, Phase, CookingSession, CookingStep, DietPhaseChart } from '../types';
import { translations } from '../i18n';
import { GeminiService } from '../services/geminiService';

interface Props {
  profile: HealthProfile;
  lang: Language;
  darkMode?: boolean;
  currentChart: DietPhaseChart | null;
}

const VoiceCookbookView: React.FC<Props> = ({ profile, lang, darkMode, currentChart }) => {
  const t = translations[lang];
  const gemini = new GeminiService();
  
  // State
  const [session, setSession] = useState<CookingSession | null>(null);
  const [activeRecipe, setActiveRecipe] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [substituteResult, setSubstituteResult] = useState<string | null>(null);
  const [isSubmittingSub, setIsSubmittingSub] = useState(false);

  // Refs
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);
  const timerRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = lang === 'bn' ? 'bn-BD' : lang === 'hi' ? 'hi-IN' : lang === 'es' ? 'es-ES' : 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
        console.log("Voice Command:", transcript);
        handleVoiceCommand(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
    }
  }, [lang]);

  // Timer Logic
  useEffect(() => {
    if (timeLeft === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      speak(lang === 'bn' ? "সময় শেষ! পরবর্তী ধাপের জন্য প্রস্তুত হন।" : "Timer done! Ready for the next step.");
      setTimeLeft(null);
    }
  }, [timeLeft]);

  const startTimer = (seconds: number) => {
    setTimeLeft(seconds);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => (prev && prev > 0 ? prev - 1 : 0));
    }, 1000);
  };

  const speak = (text: string) => {
    if (synthRef.current.speaking) synthRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    // Attempt to select a voice suitable for the language
    const voices = synthRef.current.getVoices();
    const voice = voices.find(v => v.lang.startsWith(lang === 'bn' ? 'bn' : lang === 'hi' ? 'hi' : lang === 'es' ? 'es' : 'en'));
    if (voice) utterance.voice = voice;
    
    utterance.rate = 0.9;
    synthRef.current.speak(utterance);
  };

  const handleVoiceCommand = (command: string) => {
    // Multi-lingual command mapping
    const nextCmds = ['next', 'next step', 'done', 'okay', 'পরবর্তী', 'হয়ে গেছে', 'siguiente'];
    const prevCmds = ['back', 'previous', 'wait', 'আগে', 'atrás'];
    const repeatCmds = ['repeat', 'say again', 'what', 'আবার বল', 'repetir'];
    const stopCmds = ['stop', 'pause', 'থামুন', 'parar'];

    if (nextCmds.some(c => command.includes(c))) nextStep();
    else if (prevCmds.some(c => command.includes(c))) prevStep();
    else if (repeatCmds.some(c => command.includes(c))) repeatStep();
    else if (stopCmds.some(c => command.includes(c))) {
        if (synthRef.current.speaking) synthRef.current.cancel();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const loadRecipe = async (mealName: string) => {
    setLoading(true);
    setActiveRecipe(mealName);
    try {
      const result = await gemini.generateCookingSession(mealName, profile, lang);
      setSession(result);
      setCurrentStepIndex(0);
      setIsPlaying(true);
      // Auto-start reading first step
      if (result?.steps?.[0]) {
        setTimeout(() => speak(result.steps[0].spokenText), 1000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (session && session.steps && currentStepIndex < session.steps.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      speak(session.steps[nextIdx].spokenText);
      // Check for timer
      if (session.steps[nextIdx].timerSeconds) {
        startTimer(session.steps[nextIdx].timerSeconds!);
      } else {
        setTimeLeft(null);
      }
    } else {
      speak(lang === 'bn' ? "রান্না শেষ! উপভোগ করুন।" : "Cooking complete! Enjoy your meal.");
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0 && session?.steps) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      speak(session.steps[prevIdx].spokenText);
    }
  };

  const repeatStep = () => {
    if (session?.steps?.[currentStepIndex]) {
      speak(session.steps[currentStepIndex].spokenText);
    }
  };

  const getSubstitute = async () => {
    if (!session || !session.steps?.[currentStepIndex]) return;
    setIsSubmittingSub(true);
    const currentInstruction = session.steps[currentStepIndex].instruction;
    try {
        const sub = await gemini.suggestIngredientSubstitute(currentInstruction, session.recipeName, profile, lang);
        setSubstituteResult(sub);
        speak(sub);
    } catch (e) {
        console.error(e);
    } finally {
        setIsSubmittingSub(false);
    }
  };

  // Get current meal recommendations from chart
  const availableRecipes = currentChart?.weeklySchedule
    ?.flatMap(d => d.meals)
    .filter((m, i, self) => m && self.findIndex(t => t.mealName === m.mealName) === i) // unique
    .slice(0, 6) || [];

  if (!activeRecipe) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in pb-32 px-4">
        <div className={`p-10 rounded-[40px] border shadow-sm text-center ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <div className="w-20 h-20 mx-auto rounded-full bg-rose-500 text-white flex items-center justify-center text-4xl mb-6 shadow-xl">👨‍🍳</div>
          <h2 className={`text-3xl font-bold serif italic mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{t.cookbook_title}</h2>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.cookbook_subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {availableRecipes.map((meal, idx) => (
            <button
              key={idx}
              onClick={() => loadRecipe(meal.mealName)}
              className={`p-6 rounded-[32px] border text-left transition-all hover:scale-[1.02] active:scale-95 group ${
                darkMode ? 'bg-slate-800 border-slate-700 hover:border-rose-500' : 'bg-white border-slate-100 shadow-sm hover:border-rose-500'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className={`font-bold text-lg mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{meal.mealName}</h3>
                  <p className="text-xs opacity-60 line-clamp-2">{meal.description}</p>
                </div>
                <span className="text-2xl group-hover:scale-125 transition-transform">🍳</span>
              </div>
            </button>
          ))}
        </div>
        {availableRecipes.length === 0 && (
            <div className="text-center opacity-50 py-10">No recipes found in your current plan. Generate a diet chart first.</div>
        )}
      </div>
    );
  }

  if (loading || !session || !session.steps) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
        <div className="w-20 h-20 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
        <p className="font-bold text-lg animate-pulse">{t.cookbook_loading}</p>
      </div>
    );
  }

  const currentStep = session.steps[currentStepIndex];

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col ${darkMode ? 'bg-slate-950' : 'bg-white'}`}>
      {/* Top Bar */}
      <div className="p-6 flex justify-between items-center border-b border-inherit">
        <button onClick={() => { setActiveRecipe(null); setSession(null); }} className="p-3 rounded-full bg-slate-100 dark:bg-slate-800">✕</button>
        <div className="text-center">
           <h2 className="font-bold text-lg leading-tight">{session.recipeName}</h2>
           <span className="text-xs font-black uppercase tracking-widest text-rose-500">Step {currentStepIndex + 1} of {session.steps.length}</span>
        </div>
        <button 
          onClick={toggleListening} 
          className={`p-3 rounded-full transition-all ${isListening ? 'bg-rose-600 text-white animate-pulse shadow-[0_0_20px_rgba(225,29,72,0.6)]' : 'bg-slate-100 dark:bg-slate-800'}`}
        >
          {isListening ? '🎙️' : '🔇'}
        </button>
      </div>

      {/* Main Content Area - Optimized for distance viewing */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 text-center space-y-8 relative overflow-hidden">
         {/* Background Visual Cue */}
         <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center">
            <span className="text-[20rem]">{currentStep?.visualCue === 'boil' ? '🔥' : currentStep?.visualCue === 'chop' ? '🔪' : '🥣'}</span>
         </div>

         <div className="relative z-10 max-w-2xl">
            <h1 className={`text-3xl md:text-5xl font-black leading-tight mb-6 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {currentStep?.instruction}
            </h1>
            
            {/* Timer Display */}
            {timeLeft !== null && (
               <div className="my-8 inline-block px-10 py-6 rounded-3xl bg-rose-500 text-white font-mono text-6xl font-bold shadow-2xl animate-pulse">
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
               </div>
            )}

            {/* Substitution Result */}
            {substituteResult && (
               <div className="mt-6 p-6 rounded-3xl bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-400 text-amber-800 dark:text-amber-200 animate-in slide-in-from-top">
                  <span className="block text-xs font-black uppercase mb-2">💡 BioSync Tip</span>
                  {substituteResult}
               </div>
            )}
         </div>
      </div>

      {/* Control Deck */}
      <div className={`p-8 pb-12 border-t rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
         <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
            <button onClick={prevStep} className="p-6 rounded-3xl bg-white dark:bg-slate-800 shadow-lg active:scale-95 transition-transform text-2xl">
               ⏮
            </button>
            
            <button 
              onClick={repeatStep}
              className="flex-1 py-6 rounded-3xl bg-blue-600 text-white font-black text-lg uppercase tracking-widest shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-3"
            >
               <span>↺</span> {t.voice_repeat}
            </button>

            <button onClick={nextStep} className="p-6 rounded-3xl bg-emerald-500 text-white shadow-lg active:scale-95 transition-transform text-2xl">
               ⏭
            </button>
         </div>
         
         <div className="mt-6 flex justify-center gap-4">
            <button 
              onClick={getSubstitute}
              disabled={isSubmittingSub}
              className="text-xs font-bold uppercase tracking-widest opacity-60 hover:opacity-100 border-b-2 border-transparent hover:border-rose-500 transition-all"
            >
               {isSubmittingSub ? "Thinking..." : "Missing Ingredient?"}
            </button>
            {session.steps?.[currentStepIndex]?.timerSeconds && timeLeft === null && (
               <button 
                 onClick={() => startTimer(session.steps[currentStepIndex].timerSeconds!)}
                 className="text-xs font-bold uppercase tracking-widest text-rose-500 border-b-2 border-rose-500"
               >
                 Start Timer
               </button>
            )}
         </div>
      </div>
    </div>
  );
};

export default VoiceCookbookView;
