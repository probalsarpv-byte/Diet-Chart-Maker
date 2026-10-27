
import React from 'react';
import { HealthProfile, Language } from '../types';
import { translations } from '../i18n';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

interface Props {
  profile: HealthProfile;
  lang: Language;
  darkMode?: boolean;
  onProceed: () => void;
}

const AnalysisReport: React.FC<Props> = ({ profile, lang, darkMode, onProceed }) => {
  const t = translations[lang];
  const analysis = profile.analysis!;

  const doshaData = [
    { name: 'Vata', value: analysis.doshaBreakdown.vata, color: '#3b82f6' },
    { name: 'Pitta', value: analysis.doshaBreakdown.pitta, color: '#ef4444' },
    { name: 'Kapha', value: analysis.doshaBreakdown.kapha, color: '#10b981' }
  ];

  const markerData = [
    { name: 'Microbiome', value: profile.microbiomeScore },
    { name: 'Metabolic', value: 100 - (profile.inflammatoryIndex * 10) },
    { name: 'Alkaline', value: Math.min(100, Math.max(0, (analysis.alkalineScore - 6) * 100)) } // Normalize pH for bar chart
  ];

  // --- Clinical Calculations ---
  const heightM = profile.height / 100;
  const bmi = (profile.weight / (heightM * heightM)).toFixed(1);
  
  // Standard Weight (Ideal Body Weight) based on BMI 18.5 - 24.9
  const minWeight = (18.5 * heightM * heightM).toFixed(1);
  const maxWeight = (24.9 * heightM * heightM).toFixed(1);
  const standardWeightRange = `${minWeight} - ${maxWeight} kg`;

  // BMR Calculation (Mifflin-St Jeor Equation)
  let bmr = (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age);
  bmr += profile.gender === 'Male' ? 5 : -161;
  bmr = Math.round(bmr);

  // TDEE (Total Daily Energy Expenditure) - Assuming Sedentary/Light Active (1.375) for patients needing diet correction
  const tdee = Math.round(bmr * 1.375);

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-1000 pb-32">
      <div className="text-center space-y-4">
        <h1 className={`text-4xl md:text-6xl font-bold serif italic ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          {t.clinical_synthesis}
        </h1>
        <p className={`text-lg font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          A deep biological mapping based on your 120-point assessment.
        </p>
      </div>

      {/* Biometric & Metabolic Baseline Grid */}
      <div className={`p-8 rounded-[40px] border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
         <h3 className="text-xl font-bold serif mb-6 italic text-blue-500">Biometric & Metabolic Baseline</h3>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
               <span className="text-[10px] font-black uppercase tracking-widest opacity-50 block mb-1">{t.metric_bmi}</span>
               <span className={`text-2xl font-black ${parseFloat(bmi) > 25 ? 'text-orange-500' : 'text-emerald-500'}`}>{bmi}</span>
            </div>
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
               <span className="text-[10px] font-black uppercase tracking-widest opacity-50 block mb-1">{t.metric_std_weight}</span>
               <span className="text-xl font-black">{standardWeightRange}</span>
            </div>
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
               <span className="text-[10px] font-black uppercase tracking-widest opacity-50 block mb-1">{t.metric_bmr}</span>
               <span className="text-2xl font-black text-indigo-500">{bmr} <span className="text-xs">{t.metric_kcal}</span></span>
            </div>
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
               <span className="text-[10px] font-black uppercase tracking-widest opacity-50 block mb-1">{t.metric_tdee}</span>
               <span className="text-2xl font-black text-blue-500">{tdee} <span className="text-xs">{t.metric_kcal}</span></span>
            </div>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className={`p-5 rounded-2xl border-l-4 border-red-500 ${darkMode ? 'bg-red-900/10' : 'bg-red-50'}`}>
               <span className="text-[10px] font-black uppercase tracking-widest text-red-500 block mb-2">{t.metric_condition}</span>
               <p className={`text-sm font-bold ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                 {profile.medicalConditions || "None Reported"}
               </p>
            </div>
            <div className={`p-5 rounded-2xl border-l-4 border-amber-500 ${darkMode ? 'bg-amber-900/10' : 'bg-amber-50'}`}>
               <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 block mb-2">{t.metric_diet_error}</span>
               <p className={`text-sm font-bold ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                 {analysis.dietImpact || "Analysis Pending..."}
               </p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Dosha Analysis */}
        <div className={`p-10 rounded-[40px] border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <h3 className="text-xl font-bold serif mb-8 italic">{t.prakriti_const}</h3>
          <div className="h-64 mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={doshaData} innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                  {doshaData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {doshaData.map(d => (
              <div key={d.name} className="text-center">
                <div className="text-xs font-black uppercase tracking-widest opacity-40 mb-1">{d.name}</div>
                <div className="text-2xl font-black" style={{ color: d.color }}>{d.value}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Biological Markers */}
        <div className={`p-10 rounded-[40px] border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <h3 className="text-xl font-bold serif mb-8 italic">{t.bio_markers}</h3>
          <div className="h-64 mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={markerData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} style={{ fontWeight: 'bold', fontSize: '12px' }} />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" radius={[0, 10, 10, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="font-bold opacity-60">{t.inflam_status}:</span>
              <span className="font-black text-red-500">{analysis.inflammatoryStatus}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="font-bold opacity-60">{t.alkaline_score}:</span>
              <span className={`font-black ${analysis.alkalineScore > 7.3 ? 'text-blue-500' : 'text-red-500'}`}>{analysis.alkalineScore}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="font-bold opacity-60">{t.microbiome_type}:</span>
              <span className="font-black text-emerald-500">{analysis.microbiomeStatus}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Diet Causality Report */}
      <div className={`p-10 rounded-[40px] border-2 border-dashed ${darkMode ? 'bg-amber-950/20 border-amber-900/50' : 'bg-amber-50/50 border-amber-200'}`}>
         <div className="flex items-start gap-4">
            <div className={`mt-1 p-3 rounded-xl ${darkMode ? 'bg-amber-900/50' : 'bg-amber-100'} text-2xl`}>🍽️</div>
            <div>
               <h3 className={`text-xl font-bold serif mb-2 italic ${darkMode ? 'text-amber-400' : 'text-amber-800'}`}>
                 {t.diet_causality}
               </h3>
               <p className={`text-base leading-relaxed font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                 {analysis.dietImpact}
               </p>
            </div>
         </div>
      </div>

      {/* Summary Box */}
      <div className={`p-12 rounded-[50px] border-2 shadow-2xl ${darkMode ? 'bg-slate-900 border-emerald-900/30' : 'bg-emerald-50/30 border-emerald-100'}`}>
        <h3 className="text-2xl font-bold serif mb-6 italic text-emerald-600">{t.patient_synthesis}</h3>
        <p className={`text-xl leading-relaxed italic ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
          "{analysis.healthSummary}"
        </p>
        <div className="mt-10 pt-10 border-t border-emerald-200/20 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="font-black text-[10px] uppercase tracking-widest text-emerald-600 mb-2">{t.key_challenge}</h4>
            <p className="text-sm opacity-80">Managing systemic inflammatory load while stabilizing glucose variability associated with your {profile.dosha} prakriti.</p>
          </div>
          <div>
            <h4 className="font-black text-[10px] uppercase tracking-widest text-emerald-600 mb-2">{t.primary_goal}</h4>
            <p className="text-sm opacity-80">Phase 1 will focus heavily on alkaline restoration to neutralize inflammatory markers detected in your screening.</p>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button 
          onClick={onProceed}
          className="bg-slate-900 text-white dark:bg-emerald-600 px-16 py-6 rounded-[30px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-2xl active:scale-95"
        >
          {t.enter_journey} →
        </button>
      </div>
    </div>
  );
};

export default AnalysisReport;
