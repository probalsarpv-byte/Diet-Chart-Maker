
import React, { useState } from 'react';
import { HealthProfile, Language, Phase, ShoppingList } from '../types';
import { GeminiService } from '../services/geminiService';
import { translations } from '../i18n';

interface Props {
  profile: HealthProfile;
  currentPhase: Phase;
  lang: Language;
  darkMode?: boolean;
}

const SmartBazaar: React.FC<Props> = ({ profile, currentPhase, lang, darkMode }) => {
  const t = translations[lang];
  const [list, setList] = useState<ShoppingList | null>(null);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const gemini = new GeminiService();

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await gemini.generateGroceryList(profile, currentPhase, lang);
      setList(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOrder = () => {
    setRedirecting(true);
    // Simulate API redirect
    setTimeout(() => {
        window.open('https://chaldal.com/', '_blank');
        setRedirecting(false);
    }, 1500);
  };

  const toggleItem = (category: 'freshMarket' | 'groceryStore', index: number) => {
    if (!list) return;
    const newList = { ...list };
    if (newList[category] && newList[category][index]) {
      newList[category][index].checked = !newList[category][index].checked;
      setList(newList);
    }
  };

  return (
    <div className={`mx-4 md:mx-auto max-w-7xl rounded-[40px] border shadow-xl overflow-hidden mb-12 transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
      <div className="p-8 md:p-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
           <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-lg ${darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                🛍️
              </div>
              <div>
                <h2 className={`text-2xl font-bold serif italic ${darkMode ? 'text-white' : 'text-slate-900'}`}>{t.bazaar_title}</h2>
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.bazaar_subtitle}</p>
              </div>
           </div>
           
           {!list && (
             <button
               onClick={handleGenerate}
               disabled={loading}
               className={`px-8 py-3 rounded-2xl font-bold uppercase tracking-widest text-sm transition-all shadow-lg active:scale-95 ${
                 darkMode 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
               }`}
             >
               {loading ? (
                 <span className="flex items-center gap-2">
                   <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                   {t.bazaar_generating}
                 </span>
               ) : (
                 t.bazaar_gen_btn
               )}
             </button>
           )}
        </div>

        {list && (
          <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
             
             {/* Pantry Check Alert */}
             <div className={`p-4 rounded-2xl flex items-start gap-4 border ${darkMode ? 'bg-amber-900/20 border-amber-900/50' : 'bg-amber-50 border-amber-100'}`}>
               <span className="text-2xl">💡</span>
               <div>
                 <h4 className={`font-bold text-sm uppercase mb-1 ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>{t.bazaar_pantry_tip}</h4>
                 <p className={`text-sm italic ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{list.pantryTip}</p>
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Fresh Market Column */}
                <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                   <h3 className={`font-bold text-lg mb-4 flex items-center gap-2 ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                     <span>🥦</span> {t.bazaar_fresh}
                   </h3>
                   <ul className="space-y-3">
                     {list.freshMarket?.map((item, i) => (
                       <li key={i} className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${
                         item.checked 
                           ? (darkMode ? 'bg-emerald-900/20 text-emerald-700 line-through' : 'bg-emerald-100/50 text-emerald-800/50 line-through') 
                           : (darkMode ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-700 shadow-sm')
                       }`}
                       onClick={() => toggleItem('freshMarket', i)}>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                             item.checked ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 dark:border-slate-600'
                          }`}>
                            {item.checked && <span className="text-white text-xs font-bold">✓</span>}
                          </div>
                          <div className="flex-1 font-medium">{item.name}</div>
                          <div className="text-xs font-bold opacity-60">{item.quantity}</div>
                       </li>
                     ))}
                   </ul>
                </div>

                {/* Grocery Store Column */}
                <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                   <h3 className={`font-bold text-lg mb-4 flex items-center gap-2 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                     <span>🥫</span> {t.bazaar_dry}
                   </h3>
                   <ul className="space-y-3">
                     {list.groceryStore?.map((item, i) => (
                       <li key={i} className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${
                         item.checked 
                           ? (darkMode ? 'bg-blue-900/20 text-blue-700 line-through' : 'bg-blue-100/50 text-blue-800/50 line-through') 
                           : (darkMode ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-700 shadow-sm')
                       }`}
                       onClick={() => toggleItem('groceryStore', i)}>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                             item.checked ? 'border-blue-500 bg-blue-500' : 'border-slate-300 dark:border-slate-600'
                          }`}>
                            {item.checked && <span className="text-white text-xs font-bold">✓</span>}
                          </div>
                          <div className="flex-1 font-medium">{item.name}</div>
                          <div className="text-xs font-bold opacity-60">{item.quantity}</div>
                       </li>
                     ))}
                   </ul>
                </div>
             </div>

             {/* Order Integration */}
             <div className="flex justify-center pt-4">
               <button 
                 onClick={handleOrder}
                 className={`w-full md:w-auto px-12 py-4 rounded-[30px] font-black uppercase tracking-widest text-white shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 ${
                   redirecting ? 'bg-slate-500 cursor-wait' : 'bg-gradient-to-r from-orange-500 to-red-500'
                 }`}
               >
                 {redirecting ? (
                   t.bazaar_order_confirm
                 ) : (
                   <>
                     🛒 {t.bazaar_order_btn}
                   </>
                 )}
               </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartBazaar;
