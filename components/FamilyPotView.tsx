
import React, { useState } from 'react';
import { HealthProfile, Language, Phase } from '../types';
import { GeminiService } from '../services/geminiService';
import { translations } from '../i18n';

interface Props {
  profile: HealthProfile;
  currentPhase: Phase;
  lang: Language;
  darkMode?: boolean;
}

interface FamilyRecipe {
  dishName: string;
  totalIngredients: string[];
  cookingInstructions: string[];
  patientPortion: string;
  familyPortion: string;
}

const FamilyPotView: React.FC<Props> = ({ profile, currentPhase, lang, darkMode }) => {
  const t = translations[lang];
  const [adults, setAdults] = useState(1);
  const [kids, setKids] = useState(0);
  const [mealType, setMealType] = useState('Lunch');
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<FamilyRecipe | null>(null);

  const gemini = new GeminiService();

  const handleCalculate = async () => {
    setLoading(true);
    setRecipe(null);
    try {
      const result = await gemini.generateFamilyPot(profile, currentPhase, adults, kids, mealType, lang);
      setRecipe(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom duration-500 pb-32">
      {/* Header */}
      <div className={`p-10 rounded-[40px] border shadow-sm text-center ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-4xl mb-4 shadow-xl ${darkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-50 text-orange-500'}`}>
          🍲
        </div>
        <h2 className={`text-3xl font-bold serif italic mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{t.family_pot_title}</h2>
        <p className={`max-w-lg mx-auto ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          {t.family_pot_subtitle}
        </p>
      </div>

      {/* Configuration Controls */}
      <div className={`p-8 rounded-[40px] border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          
          {/* Member Counters */}
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 rounded-2xl border transition-colors border-slate-100 dark:border-slate-800">
              <span className={`font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{t.members_adults}</span>
              <div className="flex items-center gap-3">
                <button onClick={() => setAdults(Math.max(0, adults - 1))} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors ${darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'}`}>-</button>
                <span className={`w-4 text-center font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{adults}</span>
                <button onClick={() => setAdults(adults + 1)} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors ${darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'}`}>+</button>
              </div>
            </div>
            <div className="flex justify-between items-center p-4 rounded-2xl border transition-colors border-slate-100 dark:border-slate-800">
              <span className={`font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{t.members_kids}</span>
              <div className="flex items-center gap-3">
                <button onClick={() => setKids(Math.max(0, kids - 1))} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors ${darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'}`}>-</button>
                <span className={`w-4 text-center font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{kids}</span>
                <button onClick={() => setKids(kids + 1)} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors ${darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'}`}>+</button>
              </div>
            </div>
          </div>

          {/* Meal Type Selector */}
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => setMealType('Lunch')}
              className={`p-4 rounded-2xl font-bold border transition-all ${mealType === 'Lunch' ? (darkMode ? 'bg-orange-500 text-white border-orange-600' : 'bg-orange-500 text-white border-orange-600 shadow-lg shadow-orange-500/30') : (darkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500')}`}
            >
              Lunch
            </button>
            <button 
              onClick={() => setMealType('Dinner')}
              className={`p-4 rounded-2xl font-bold border transition-all ${mealType === 'Dinner' ? (darkMode ? 'bg-indigo-500 text-white border-indigo-600' : 'bg-indigo-500 text-white border-indigo-600 shadow-lg shadow-indigo-500/30') : (darkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500')}`}
            >
              Dinner
            </button>
          </div>

          {/* Calculate Button */}
          <button 
            onClick={handleCalculate}
            disabled={loading}
            className={`h-full min-h-[80px] rounded-[30px] font-black uppercase tracking-widest text-lg shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-2 ${darkMode ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}
          >
            {loading ? (
              <>
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="text-xs">{t.generating_recipe}</span>
              </>
            ) : (
              <>
                <span>🚀 {t.calc_pot}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Display */}
      {recipe && (
        <div className={`rounded-[40px] overflow-hidden border shadow-2xl animate-in slide-in-from-bottom duration-700 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          {/* Recipe Header */}
          <div className={`p-8 text-center border-b ${darkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
            <h3 className={`text-3xl font-bold serif italic mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{recipe.dishName}</h3>
            <span className="text-xs font-black uppercase tracking-widest text-emerald-500">
               {adults + kids + 1} Servings • Phase {currentPhase} Compliant
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2">
             {/* Ingredients */}
             <div className={`p-8 border-r ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
               <h4 className={`text-xs font-black uppercase tracking-widest mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.ingredients_list}</h4>
               <ul className="space-y-3">
                 {recipe.totalIngredients.map((ing, i) => (
                   <li key={i} className={`flex items-start gap-3 text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                     <span className="text-emerald-500 mt-1">•</span> {ing}
                   </li>
                 ))}
               </ul>
             </div>

             {/* Instructions */}
             <div className="p-8">
               <h4 className={`text-xs font-black uppercase tracking-widest mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.cooking_instructions}</h4>
               <ol className="space-y-4">
                 {recipe.cookingInstructions.map((step, i) => (
                   <li key={i} className="flex gap-4">
                     <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>{i + 1}</span>
                     <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{step}</p>
                   </li>
                 ))}
               </ol>
             </div>
          </div>

          {/* Serving Strategy */}
          <div className={`p-8 border-t flex flex-col md:flex-row gap-8 ${darkMode ? 'bg-emerald-900/10 border-slate-800' : 'bg-emerald-50/50 border-slate-100'}`}>
             <div className="flex-1">
               <h5 className={`font-bold mb-2 flex items-center gap-2 ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                 {t.patient_portion}
               </h5>
               <p className={`text-sm italic ${darkMode ? 'text-emerald-200/70' : 'text-emerald-800/80'}`}>{recipe.patientPortion}</p>
             </div>
             <div className="flex-1">
               <h5 className={`font-bold mb-2 flex items-center gap-2 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                 {t.family_portion}
               </h5>
               <p className={`text-sm italic ${darkMode ? 'text-blue-200/70' : 'text-blue-800/80'}`}>{recipe.familyPortion}</p>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyPotView;
