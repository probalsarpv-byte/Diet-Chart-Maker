
import React, { useState } from 'react';
import { Language } from '../types';
import { translations } from '../i18n';

interface Props {
  lang: Language;
  darkMode?: boolean;
}

type CalculatorType = 'bmi' | 'bmr' | 'tdee' | 'water' | 'ibw' | 'macro' | 'sleep';

const HealthCalculator: React.FC<Props> = ({ lang, darkMode }) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<CalculatorType>('bmi');

  // Common State
  const [weight, setWeight] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [activity, setActivity] = useState<number>(1.2);

  // Results
  const [result, setResult] = useState<string | number | null>(null);
  const [classification, setClassification] = useState<string>('');
  const [extraDetails, setExtraDetails] = useState<any>(null);

  const calculate = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseFloat(age);

    setExtraDetails(null);

    // Sleep Calculator Logic (Does not require inputs)
    if (activeTab === 'sleep') {
      const now = new Date();
      // Add 15 mins for falling asleep
      const fallAsleepTime = new Date(now.getTime() + 15 * 60000);
      
      const cycles = [4, 5, 6]; // 4 cycles (6h), 5 cycles (7.5h), 6 cycles (9h)
      const wakeTimes = cycles.map(c => {
        const time = new Date(fallAsleepTime.getTime() + c * 90 * 60000);
        return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      });

      setResult("⏰");
      setExtraDetails(wakeTimes);
      setClassification(t.calc_sleep_msg);
      return;
    }

    if (!h) return; // Height is required for most

    let val = 0;
    let cls = '';

    if (activeTab === 'bmi') {
      if (!w) return;
      // BMI = kg / m^2
      const hM = h / 100;
      val = w / (hM * hM);
      if (val < 18.5) cls = t.bmi_underweight;
      else if (val < 24.9) cls = t.bmi_normal;
      else if (val < 29.9) cls = t.bmi_overweight;
      else cls = t.bmi_obese;
      setResult(parseFloat(val.toFixed(1)));
    } 
    else if (activeTab === 'bmr') {
      if (!w || !a) return;
      // Mifflin-St Jeor
      val = (10 * w) + (6.25 * h) - (5 * a);
      val += gender === 'Male' ? 5 : -161;
      cls = "Kcal / Day";
      setResult(Math.round(val));
    } 
    else if (activeTab === 'tdee') {
      if (!w || !a) return;
      let bmr = (10 * w) + (6.25 * h) - (5 * a);
      bmr += gender === 'Male' ? 5 : -161;
      val = bmr * activity;
      cls = "Kcal / Day";
      setResult(Math.round(val));
    } 
    else if (activeTab === 'water') {
      if (!w) return;
      // Basic: 33ml per kg
      let base = w * 0.033; 
      if (activity > 1.2) base += (activity - 1.2) * 1.5; 
      val = base;
      cls = "Liters / Day";
      setResult(parseFloat(val.toFixed(1)));
    }
    else if (activeTab === 'ibw') {
      // Devine Formula
      // Men: 50 + 2.3 * (Height_in - 60)
      // Women: 45.5 + 2.3 * (Height_in - 60)
      const heightInInches = h / 2.54;
      if (heightInInches < 60) {
         val = gender === 'Male' ? 50 : 45.5; // Base fallback
      } else {
         const factor = heightInInches - 60;
         const base = gender === 'Male' ? 50 : 45.5;
         val = base + (2.3 * factor);
      }
      cls = "Kg";
      setResult(parseFloat(val.toFixed(1)));
    }
    else if (activeTab === 'macro') {
      if (!w || !a) return;
      let bmr = (10 * w) + (6.25 * h) - (5 * a);
      bmr += gender === 'Male' ? 5 : -161;
      const tdee = bmr * activity;
      
      // Balanced Split: 30% P, 35% F, 35% C
      const protein = Math.round((tdee * 0.30) / 4);
      const fat = Math.round((tdee * 0.35) / 9);
      const carbs = Math.round((tdee * 0.35) / 4);

      setResult("🍽️");
      setExtraDetails({ protein, fat, carbs });
      setClassification("Balanced Split");
    }

    setClassification(cls);
  };

  const activityOptions = [
    { val: 1.2, label: t.act_sedentary },
    { val: 1.375, label: t.act_light },
    { val: 1.55, label: t.act_moderate },
    { val: 1.725, label: t.act_active },
    { val: 1.9, label: t.act_extra }
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in pb-32 px-4">
      
      {/* Header */}
      <div className={`p-8 rounded-[40px] border shadow-sm text-center ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-3xl mb-4 shadow-xl ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
          🧮
        </div>
        <h2 className={`text-3xl font-bold serif italic mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{t.nav_calculator}</h2>
        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          {t.calc_subtitle}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
        {[
          { id: 'bmi', label: 'BMI', icon: '⚖️' },
          { id: 'ibw', label: 'Ideal Wt', icon: '🎯' }, // New
          { id: 'bmr', label: 'BMR', icon: '🔥' },
          { id: 'tdee', label: 'Calorie', icon: '⚡' },
          { id: 'macro', label: 'Macros', icon: '🥑' }, // New
          { id: 'water', label: 'Water', icon: '💧' },
          { id: 'sleep', label: 'Sleep', icon: '😴' }   // New
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); setResult(null); setExtraDetails(null); }}
            className={`px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest whitespace-nowrap transition-all border ${
              activeTab === tab.id 
                ? (darkMode ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg' : 'bg-slate-900 text-white border-slate-900 shadow-xl')
                : (darkMode ? 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50')
            }`}
          >
            <span className="mr-2">{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* Calculator Body */}
      <div className={`p-8 rounded-[40px] border shadow-xl transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        
        {activeTab === 'sleep' ? (
           <div className="text-center space-y-6 py-4">
              <div className="text-4xl animate-bounce">🌙</div>
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{t.calc_sleep_title}</h3>
              <p className={`text-sm max-w-md mx-auto ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.calc_sleep_desc}</p>
              
              <button 
                onClick={calculate}
                className="px-10 py-4 rounded-[30px] bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-sm shadow-xl active:scale-95 transition-all"
              >
                {t.calc_sleep_btn}
              </button>
           </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {activeTab !== 'ibw' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-50 px-2">{t.weight_kg}</label>
                  <input 
                    type="number" 
                    value={weight} 
                    onChange={e => setWeight(e.target.value)} 
                    className={`w-full p-4 rounded-2xl border-2 outline-none font-bold text-lg focus:border-indigo-500 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`}
                    placeholder="0"
                  />
                </div>
              )}
              
              {(activeTab !== 'water') && ( // Height needed for BMI, BMR, TDEE, IBW, Macros
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-50 px-2">{t.height_cm}</label>
                    <input 
                      type="number" 
                      value={height} 
                      onChange={e => setHeight(e.target.value)} 
                      className={`w-full p-4 rounded-2xl border-2 outline-none font-bold text-lg focus:border-indigo-500 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`}
                      placeholder="0"
                    />
                 </div>
              )}

              {(activeTab === 'bmr' || activeTab === 'tdee' || activeTab === 'macro') && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-50 px-2">{t.age_yrs}</label>
                  <input 
                    type="number" 
                    value={age} 
                    onChange={e => setAge(e.target.value)} 
                    className={`w-full p-4 rounded-2xl border-2 outline-none font-bold text-lg focus:border-indigo-500 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`}
                    placeholder="0"
                  />
                </div>
              )}

              {(activeTab !== 'bmi' && activeTab !== 'water') && ( // Gender needed for BMR, TDEE, IBW, Macro
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-50 px-2">{t.gender}</label>
                  <div className="flex gap-2">
                    <button onClick={() => setGender('Male')} className={`flex-1 p-4 rounded-2xl font-bold transition-all ${gender === 'Male' ? 'bg-blue-500 text-white shadow-lg' : (darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500')}`}>Male</button>
                    <button onClick={() => setGender('Female')} className={`flex-1 p-4 rounded-2xl font-bold transition-all ${gender === 'Female' ? 'bg-pink-500 text-white shadow-lg' : (darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500')}`}>Female</button>
                  </div>
                </div>
              )}

              {(activeTab === 'tdee' || activeTab === 'water' || activeTab === 'macro') && (
                 <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-50 px-2">{t.activity_lvl}</label>
                    <select 
                      value={activity} 
                      onChange={e => setActivity(parseFloat(e.target.value))}
                      className={`w-full p-4 rounded-2xl border-2 outline-none font-bold text-sm focus:border-indigo-500 appearance-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`}
                    >
                       {activityOptions.map(opt => (
                         <option key={opt.val} value={opt.val}>{opt.label}</option>
                       ))}
                    </select>
                 </div>
              )}
            </div>

            <button 
              onClick={calculate}
              className="w-full py-5 rounded-[30px] bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-sm shadow-xl active:scale-95 transition-all"
            >
              {t.calculate_btn}
            </button>
          </>
        )}

        {result !== null && (
          <div className={`mt-8 p-8 rounded-3xl border text-center animate-in slide-in-from-bottom ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
             
             {activeTab === 'sleep' && Array.isArray(extraDetails) ? (
               <div className="space-y-6">
                  <p className="text-xs font-black uppercase tracking-widest opacity-60">Try waking up at one of these times:</p>
                  <div className="flex flex-wrap justify-center gap-4">
                     {extraDetails.map((time, i) => (
                       <div key={i} className={`p-4 rounded-2xl border min-w-[100px] ${i === 1 ? (darkMode ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-emerald-100 border-emerald-500 text-emerald-700') : (darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200')}`}>
                          <div className="text-2xl font-black">{time}</div>
                          <div className="text-[10px] font-bold opacity-50 uppercase">{i === 0 ? "6h Sleep" : i === 1 ? "7.5h Sleep" : "9h Sleep"}</div>
                       </div>
                     ))}
                  </div>
               </div>
             ) : activeTab === 'macro' && extraDetails ? (
               <div className="space-y-6">
                  <p className="text-xs font-black uppercase tracking-widest opacity-60">Balanced Nutrient Split</p>
                  <div className="flex justify-center gap-4">
                     <div className="flex flex-col items-center p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30">
                        <span className="text-2xl font-black text-blue-500">{extraDetails.protein}g</span>
                        <span className="text-[10px] font-bold uppercase opacity-60">{t.macro_p}</span>
                     </div>
                     <div className="flex flex-col items-center p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30">
                        <span className="text-2xl font-black text-orange-500">{extraDetails.fat}g</span>
                        <span className="text-[10px] font-bold uppercase opacity-60">{t.macro_f}</span>
                     </div>
                     <div className="flex flex-col items-center p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                        <span className="text-2xl font-black text-emerald-500">{extraDetails.carbs}g</span>
                        <span className="text-[10px] font-bold uppercase opacity-60">{t.macro_c}</span>
                     </div>
                  </div>
               </div>
             ) : (
               <>
                 <p className="text-xs font-black uppercase tracking-widest opacity-50 mb-2">Result</p>
                 <div className="text-5xl font-black text-indigo-500 mb-2">{result}</div>
                 <div className={`inline-block px-4 py-1 rounded-lg text-xs font-bold uppercase ${darkMode ? 'bg-slate-700 text-white' : 'bg-white text-slate-800 border'}`}>
                   {classification}
                 </div>
               </>
             )}
          </div>
        )}

      </div>
    </div>
  );
};

export default HealthCalculator;
