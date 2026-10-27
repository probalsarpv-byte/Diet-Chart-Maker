
import React from 'react';
import { Language } from '../types';
import { translations } from '../i18n';

interface Props {
  lang: Language;
  darkMode?: boolean;
}

const Leaderboard: React.FC<Props> = ({ lang, darkMode }) => {
  const t = translations[lang];

  const leaders = [
    { name: 'Arif Hossain', points: 1450, dosha: 'Pitta', rank: 1, avatar: '👤' },
    { name: 'Elena Gomez', points: 1320, dosha: 'Vata', rank: 2, avatar: '👤' },
    { name: 'Rajesh Kumar', points: 1280, dosha: 'Kapha', rank: 3, avatar: '👤' },
    { name: 'Sarah Wilson', points: 1150, dosha: 'Vata', rank: 4, avatar: '👤' },
    { name: 'You', points: 450, dosha: 'Pitta', rank: 12, avatar: '🌟' }
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom duration-500 pb-32 px-4">
      <div className={`p-10 rounded-[40px] border shadow-sm text-center ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <div className="w-20 h-20 mx-auto rounded-full bg-amber-500 text-white flex items-center justify-center text-4xl mb-4 shadow-xl">🏆</div>
        <h2 className={`text-3xl font-bold serif italic mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{t.leaderboard_title}</h2>
        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>See how you compare to other pathfinders on their 12-week journey.</p>
      </div>

      <div className={`rounded-[40px] border overflow-hidden shadow-2xl ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <div className="divide-y divide-inherit">
           {leaders.map((leader, i) => (
             <div key={i} className={`p-6 flex items-center justify-between transition-colors ${leader.name === 'You' ? (darkMode ? 'bg-emerald-500/10' : 'bg-emerald-50') : (darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50')}`}>
                <div className="flex items-center gap-6">
                   <span className={`w-8 text-center font-black italic text-lg ${i < 3 ? 'text-amber-500' : 'opacity-40'}`}>#{leader.rank}</span>
                   <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl shadow-inner">{leader.avatar}</div>
                   <div>
                      <div className="font-bold text-sm">{leader.name}</div>
                      <div className="text-[10px] font-black uppercase tracking-widest opacity-40">{leader.dosha} • Phase 2</div>
                   </div>
                </div>
                <div className="text-right">
                   <div className="font-black text-lg text-emerald-500">{leader.points}</div>
                   <div className="text-[8px] font-black uppercase opacity-40">{t.pts}</div>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
