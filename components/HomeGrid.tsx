
import React from 'react';
import { Language, User } from '../types';
import { translations } from '../i18n';

interface Props {
  onNavigate: (view: any) => void;
  lang: Language;
  darkMode?: boolean;
  user?: User | null;
}

const HomeGrid: React.FC<Props> = ({ onNavigate, lang, darkMode, user }) => {
  const t = translations[lang];

  const menuItems = [
    { id: 'profile', icon: '👤', label: t.nav_profile, color: 'bg-blue-500' },
    { id: 'marketplace', icon: '🛍️', label: t.nav_marketplace, color: 'bg-orange-400' },
    { id: 'checklist', icon: '📝', label: t.daily_checklist, color: 'bg-rose-500' },
    { id: 'diet', icon: '🥗', label: t.nav_diet, color: 'bg-emerald-500' },
    { id: 'cookbook', icon: '👨‍🍳', label: t.cookbook_title, color: 'bg-orange-600' }, 
    { id: 'food_recognition', icon: '📖', label: t.nav_food_rec, color: 'bg-indigo-600' },
    { id: 'calculator', icon: '🧮', label: lang === 'bn' ? 'ক্যালকুলেটর ও অ্যাসেসমেন্ট' : `${t.nav_calculator} & Assessments`, color: 'bg-pink-500' }, 
    { id: 'leaderboard', icon: '🏆', label: t.nav_leaderboard, color: 'bg-amber-500' },
    { id: 'community', icon: '🌍', label: t.nav_community, color: 'bg-purple-500' },
    { id: 'family_pot', icon: '🍲', label: t.nav_family, color: 'bg-orange-500' },
  ];

  const isDoctor = user?.id.startsWith('DOC-');

  return (
    <div className="animate-in fade-in zoom-in duration-500 max-w-4xl mx-auto py-8">
      <div className="text-center mb-10">
        <h1 className={`text-4xl md:text-5xl font-bold serif italic mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          {t.home_welcome}
        </h1>
        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          {t.home_subtitle}
        </p>
      </div>

      {isDoctor && (
        <div className="mb-8 px-2 md:px-4">
           <button 
             onClick={() => onNavigate('dashboard')}
             className={`w-full p-8 rounded-[40px] border-4 border-dashed flex items-center justify-between group transition-all hover:border-blue-500 hover:bg-blue-500/5 ${darkMode ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50 border-blue-200 shadow-xl shadow-blue-500/10'}`}
           >
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 rounded-3xl bg-blue-600 text-white flex items-center justify-center text-3xl shadow-xl transition-transform group-hover:scale-110">🩺</div>
                 <div className="text-left">
                    <h3 className={`text-2xl font-bold serif italic ${darkMode ? 'text-blue-400' : 'text-blue-800'}`}>{t.doctor_dashboard}</h3>
                    <p className="text-xs font-black uppercase tracking-widest opacity-60">Manage Patients & View Clinical Monitoring</p>
                 </div>
              </div>
              <span className="text-3xl opacity-20 group-hover:opacity-100 transition-opacity">→</span>
           </button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 px-2 md:px-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`group relative p-4 md:p-6 rounded-[24px] md:rounded-[30px] border shadow-lg flex flex-col items-center justify-center gap-3 md:gap-4 transition-all hover:scale-105 active:scale-95 aspect-square gpu-accelerated ${
              darkMode 
                ? 'bg-slate-900 border-slate-800 hover:border-slate-700' 
                : 'bg-white border-slate-100 hover:border-slate-200'
            }`}
          >
            <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-2xl md:text-3xl text-white shadow-xl mb-1 ${item.color}`}>
              {item.icon}
            </div>
            <span className={`font-bold text-[10px] md:text-xs uppercase tracking-wide text-center ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default HomeGrid;
