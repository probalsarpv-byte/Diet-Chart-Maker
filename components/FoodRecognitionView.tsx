
import React, { useState, useEffect } from 'react';
import { HealthProfile, Language, FoodItem } from '../types';
import { GeminiService } from '../services/geminiService';
import { translations } from '../i18n';

interface Props {
  profile: HealthProfile | null;
  lang: Language;
  darkMode?: boolean;
}

const FoodRecognitionView: React.FC<Props> = ({ profile, lang, darkMode }) => {
  const t = translations[lang];
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItemName, setSelectedItemName] = useState<string | null>(null);
  const [location, setLocation] = useState<{ latitude: number, longitude: number } | null>(profile?.location || null);
  
  const gemini = new GeminiService();

  const categories = [
    { id: 'fruits', label: t.fruits, icon: '🍉' },
    { id: 'vegetables', label: t.vegetables, icon: '🥦' },
    { id: 'lentils', label: t.lentils, icon: '🍲' },
    { id: 'herbs', label: t.herbs, icon: '🌿' },
    { id: 'animal_sourced', label: t.animal_food, icon: '🥩' },
  ];

  useEffect(() => {
    if (!location && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => console.error("Location error:", err)
      );
    }
  }, [location]);

  const handleCategorySelect = async (catId: string) => {
    setSelectedCategory(catId);
    setSelectedItemName(null);
    setLoading(true);
    try {
      const contextProfile = profile || (location ? { location } as HealthProfile : null);
      const results = await gemini.fetchLocalFoods(contextProfile, catId, lang);
      setFoods(results);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleItemToggle = (foodName: string) => {
    setSelectedItemName(prev => prev === foodName ? null : foodName);
  };

  const getTranslatedCompLabel = (key: string) => {
    const map: Record<string, string> = {
      energy: t.comp_energy,
      protein: t.comp_protein,
      fat: t.comp_fat,
      carbohydrate: t.comp_carbs,
      fiber: t.comp_fiber,
      iron: t.comp_iron,
      calcium: t.comp_calcium
    };
    return map[key.toLowerCase()] || key;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500 pb-32 px-4">
      {/* Header */}
      <div className={`p-10 rounded-[40px] border shadow-sm text-center ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-4xl mb-4 shadow-xl ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
          📖
        </div>
        <h2 className={`text-3xl font-bold serif italic mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{t.food_rec_title}</h2>
        <p className={`max-w-lg mx-auto ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          {t.food_rec_subtitle}
        </p>
        {!location && (
           <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-amber-500 animate-pulse">
             {t.loc_required}
           </p>
        )}
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategorySelect(cat.id)}
            className={`p-6 rounded-[32px] border flex flex-col items-center gap-3 transition-all hover:scale-105 active:scale-95 ${
              selectedCategory === cat.id 
                ? (darkMode ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg' : 'bg-slate-900 text-white border-slate-800 shadow-xl')
                : (darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-100 text-slate-800 shadow-sm')
            }`}
          >
            <span className="text-3xl">{cat.icon}</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-center">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Results Section */}
      {selectedCategory && (
        <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
               <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
               <p className="text-sm font-bold animate-pulse opacity-50">{t.fetching_foods}</p>
            </div>
          ) : (
            <div className="space-y-4">
               {foods.map((food, i) => {
                 const isSelected = selectedItemName === food.name;
                 return (
                   <div key={i} className="space-y-2">
                     <button
                       onClick={() => handleItemToggle(food.name)}
                       className={`w-full p-6 rounded-3xl border text-left transition-all flex justify-between items-center group ${
                         isSelected
                           ? (darkMode ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-white shadow-xl')
                           : (darkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-100 text-slate-700 shadow-sm hover:border-indigo-400')
                       }`}
                     >
                       <div className="flex flex-col">
                          <span className="font-bold text-lg">{food.name}</span>
                          {!isSelected && <span className="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">
                            {lang === 'bn' ? 'বিস্তারিত দেখুন' : lang === 'hi' ? 'विवरण देखें' : lang === 'es' ? 'Ver detalles' : 'View Details'}
                          </span>}
                       </div>
                       <span className={`text-xl transition-transform duration-300 ${isSelected ? 'rotate-90' : ''}`}>›</span>
                     </button>

                     {isSelected && (
                       <div className={`p-8 rounded-[32px] border shadow-inner animate-in slide-in-from-top duration-300 ${
                         darkMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-50 border-slate-200'
                       }`}>
                         <div className="space-y-8">
                           <div>
                             <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-2">{t.food_description}</h4>
                             <p className="text-sm leading-relaxed text-black font-medium">{food.description}</p>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-3">{t.food_benefits}</h4>
                                <ul className="space-y-2">
                                   {food.benefits.map((b, idx) => (
                                     <li key={idx} className="flex items-start gap-3 text-sm font-bold text-black">
                                       <span className="text-indigo-600 mt-1">✦</span>
                                       <span>{b}</span>
                                     </li>
                                   ))}
                                </ul>
                              </div>

                              <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">{t.food_ayurveda}</h4>
                                <div className="p-4 rounded-2xl border bg-white border-indigo-200">
                                  <p className="text-xs font-black text-black">{food.ayurvedicProperty}</p>
                                </div>
                                
                                <div>
                                  <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">{t.food_nutrition}</h4>
                                  <p className="text-xs text-black font-medium leading-relaxed">{food.nutrition}</p>
                                </div>
                              </div>
                           </div>

                           {/* Food Composition Table */}
                           <div className="pt-6 border-t border-slate-300">
                             <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-4">{t.composition_title}</h4>
                             <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white">
                               <table className="w-full text-xs">
                                 <thead className="bg-slate-100">
                                   <tr>
                                     <th className="px-4 py-2 text-left font-black uppercase text-indigo-900">{t.comp_parameter}</th>
                                     <th className="px-4 py-2 text-left font-black uppercase text-indigo-900">{t.comp_value}</th>
                                   </tr>
                                 </thead>
                                 <tbody className="divide-y divide-slate-200">
                                   {Object.entries(food.composition).map(([key, value]) => (
                                     <tr key={key} className="hover:bg-slate-50 transition-colors">
                                       <td className="px-4 py-2 font-black text-black capitalize">{getTranslatedCompLabel(key)}</td>
                                       <td className="px-4 py-2 font-black text-black">{value || 'N/A'}</td>
                                     </tr>
                                   ))}
                                 </tbody>
                               </table>
                             </div>
                             <p className="mt-2 text-[10px] text-slate-600 font-bold italic">
                                {lang === 'bn' ? "উৎস: বাংলাদেশ ফুড কম্পোজিশন টেবিল (BFCT) এবং ক্লিনিকাল ম্যাপিং।" : 
                                 lang === 'hi' ? "स्रोत: स्थानीय डेटाबेस और नैदानिक मैपिंग।" :
                                 lang === 'es' ? "Fuente: Bases de datos locales y mapeo clínico." :
                                 "Data source: Integrated with local agricultural databases (BFCT for BD region)."}
                             </p>
                           </div>
                         </div>
                       </div>
                     )}
                   </div>
                 );
               })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FoodRecognitionView;
