
import React, { useState, useRef, useEffect } from 'react';
import { HealthProfile, Language, Phase, ChatMessage, JournalEntry, User } from '../types';
import { translations } from '../i18n';
import { GeminiService } from '../services/geminiService';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area 
} from 'recharts';

interface Props {
  user: User;
  profile: HealthProfile;
  currentPhase: Phase;
  lang: Language;
  darkMode?: boolean;
  onClose: () => void;
}

const HealthPortal: React.FC<Props> = ({ user, profile, currentPhase, lang, darkMode, onClose }) => {
  const t = translations[lang];
  const [activePortalTab, setActivePortalTab] = useState<'progress' | 'chat' | 'journal'>('progress');
  
  // AI Coach Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Personal Journal State (Self-Messages)
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [journalInput, setJournalInput] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const journalScrollRef = useRef<HTMLDivElement>(null);
  const gemini = new GeminiService();

  useEffect(() => {
    if (activePortalTab === 'chat' && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    if (activePortalTab === 'journal' && journalScrollRef.current) {
      journalScrollRef.current.scrollTop = journalScrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, journalEntries, activePortalTab]);

  const handleSendCoach = async () => {
    if (!inputValue.trim()) return;
    const userMsg: ChatMessage = { role: 'user', text: inputValue, timestamp: new Date() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await gemini.coachChat(profile, currentPhase, newMessages, lang);
      setMessages([...newMessages, { role: 'model', text: response, timestamp: new Date() }]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(false);
    }
  };

  const handleAddJournal = () => {
    if (!journalInput.trim()) return;
    const entry: JournalEntry = {
      id: Date.now().toString(),
      text: journalInput,
      timestamp: new Date()
    };
    setJournalEntries([...journalEntries, entry]);
    setJournalInput('');
  };

  // Prepare data for charts
  const adherenceData = profile.adherenceHistory?.map(h => ({
    date: new Date(h.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
    score: h.score,
    points: h.pointsEarned
  })) || [];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-500">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={onClose} />
      
      <div className={`relative w-full max-w-5xl h-[90vh] rounded-[40px] shadow-2xl border flex flex-col overflow-hidden transition-colors ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
      }`}>
        {/* Portal Header */}
        <div className={`p-8 border-b flex justify-between items-center ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl serif italic shadow-lg ${
              darkMode ? 'bg-emerald-500 text-slate-900' : 'bg-slate-900 text-white'
            }`}>
              {profile.dosha[0]}
            </div>
            <div>
              <h2 className={`text-2xl font-bold serif italic ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {t.patient_portal}
              </h2>
              <p className="text-xs font-black uppercase tracking-widest text-emerald-500">
                {t.health_id}: AM-{profile.dosha?.toUpperCase()}-{(profile.age * 1234).toString().slice(0,4)}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-slate-50 text-slate-400'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex px-8 py-4 gap-8">
          <button 
            onClick={() => setActivePortalTab('progress')}
            className={`text-sm font-bold pb-2 border-b-2 transition-all ${
              activePortalTab === 'progress' 
                ? (darkMode ? 'text-emerald-400 border-emerald-400' : 'text-slate-900 border-slate-900')
                : (darkMode ? 'text-slate-500 border-transparent hover:text-slate-300' : 'text-slate-400 border-transparent hover:text-slate-600')
            }`}
          >
            {t.my_progress}
          </button>
          <button 
            onClick={() => setActivePortalTab('chat')}
            className={`text-sm font-bold pb-2 border-b-2 transition-all ${
              activePortalTab === 'chat' 
                ? (darkMode ? 'text-blue-400 border-blue-400' : 'text-slate-900 border-slate-900')
                : (darkMode ? 'text-slate-500 border-transparent hover:text-slate-300' : 'text-slate-400 border-transparent hover:text-slate-600')
            }`}
          >
            {t.ai_coach}
          </button>
          <button 
            onClick={() => setActivePortalTab('journal')}
            className={`text-sm font-bold pb-2 border-b-2 transition-all ${
              activePortalTab === 'journal' 
                ? (darkMode ? 'text-purple-400 border-purple-400' : 'text-slate-900 border-slate-900')
                : (darkMode ? 'text-slate-500 border-transparent hover:text-slate-300' : 'text-slate-400 border-transparent hover:text-slate-600')
            }`}
          >
            {t.journal}
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
          {activePortalTab === 'progress' ? (
            <div className="space-y-12 animate-in slide-in-from-right duration-500">
              
              {/* Top Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-100 shadow-sm'}`}>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-50 block mb-1">Total Credits</span>
                    <span className="text-3xl font-black text-amber-500">{user.points}</span>
                 </div>
                 <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-100 shadow-sm'}`}>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-50 block mb-1">Current Streak</span>
                    <span className="text-3xl font-black text-emerald-500">{profile.adherenceHistory?.length || 0} Days</span>
                 </div>
                 <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-100 shadow-sm'}`}>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-50 block mb-1">Dosha Balance</span>
                    <span className="text-3xl font-black text-blue-500">{profile.dosha}</span>
                 </div>
                 <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-100 shadow-sm'}`}>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-50 block mb-1">Alkalinity</span>
                    <span className="text-3xl font-black text-indigo-500">{profile.alkalineBalance}</span>
                 </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className={`p-8 rounded-[40px] border shadow-sm ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-100'}`}>
                  <h3 className="text-xs font-black uppercase tracking-widest mb-8 opacity-50">Adherence Trend (%)</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={adherenceData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                        <XAxis dataKey="date" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: darkMode ? '#0f172a' : '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                          itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                        />
                        <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={4} dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className={`p-8 rounded-[40px] border shadow-sm ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-100'}`}>
                  <h3 className="text-xs font-black uppercase tracking-widest mb-8 opacity-50">Metabolic Credits Earned</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={adherenceData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                        <XAxis dataKey="date" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: darkMode ? '#0f172a' : '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                          itemStyle={{ color: '#f59e0b', fontWeight: 'bold' }}
                        />
                        <Area type="monotone" dataKey="points" stroke="#f59e0b" fill="#f59e0b20" strokeWidth={4} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-6">
                <h3 className={`text-lg font-bold italic ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{t.journey_timeline}</h3>
                <div className="grid grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map(p => (
                    <div key={p} className="space-y-3">
                      <div className={`h-2 rounded-full transition-all duration-1000 ${
                        p < currentPhase ? 'bg-emerald-500' : p === currentPhase ? 'bg-blue-500 animate-pulse' : 'bg-slate-700/30'
                      }`} />
                      <div className="flex flex-col">
                        <span className={`text-[10px] font-black uppercase tracking-tighter ${
                          p === currentPhase ? 'text-blue-400' : 'text-slate-500'
                        }`}>
                          {p < currentPhase ? t.completed : p === currentPhase ? t.active_phase : t.upcoming}
                        </span>
                        <span className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{t.phase} {p}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Badges Gallery */}
              <div className="space-y-6">
                 <h3 className={`text-lg font-bold italic ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{t.badges_title}</h3>
                 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    {user.badges?.map(badge => (
                      <div 
                        key={badge.id}
                        className={`p-4 rounded-3xl border flex flex-col items-center gap-2 transition-all ${
                          badge.unlocked 
                            ? (darkMode ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-100 shadow-sm')
                            : 'opacity-30 grayscale'
                        }`}
                      >
                         <span className="text-3xl">{badge.icon}</span>
                         <span className="text-[8px] font-black uppercase tracking-widest text-center leading-tight">{badge.name}</span>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          ) : activePortalTab === 'chat' ? (
            <div className="flex flex-col h-full animate-in slide-in-from-left duration-500">
              <div ref={scrollRef} className="flex-1 space-y-6 mb-4 px-2 overflow-y-auto">
                {messages.length === 0 && (
                   <div className={`p-6 rounded-3xl border italic text-sm text-center ${darkMode ? 'bg-blue-950/20 border-blue-900/50 text-blue-300' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
                     {t.coach_welcome.replace('{phase}', currentPhase.toString()).replace('{dosha}', profile.dosha)}
                   </div>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-3xl text-sm leading-relaxed shadow-sm ${
                      m.role === 'user' 
                        ? (darkMode ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white')
                        : (darkMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-800')
                    }`}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className={`p-4 rounded-3xl animate-pulse ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" />
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce delay-75" />
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce delay-150" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleSendCoach()}
                  placeholder={t.type_message}
                  className={`flex-1 p-4 rounded-2xl text-sm border focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'
                  }`}
                />
                <button 
                  onClick={handleSendCoach}
                  disabled={!inputValue.trim() || isTyping}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 rounded-2xl font-bold transition-all disabled:opacity-50"
                >
                  {t.send}
                </button>
              </div>
            </div>
          ) : (
            /* Personal Journal (Message Yourself) Tab */
            <div className="flex flex-col h-full animate-in slide-in-from-bottom duration-500">
              <div ref={journalScrollRef} className="flex-1 space-y-6 mb-4 px-2 overflow-y-auto">
                {journalEntries.length === 0 && (
                  <div className={`p-10 rounded-[30px] border flex flex-col items-center text-center gap-4 ${
                    darkMode ? 'bg-purple-950/10 border-purple-900/30 text-purple-400' : 'bg-purple-50 border-purple-100 text-purple-700'
                  }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    <p className="text-sm font-medium leading-relaxed max-w-xs">{t.no_notes}</p>
                  </div>
                )}
                {journalEntries.map((entry) => (
                  <div key={entry.id} className="flex justify-end group">
                    <div className="flex flex-col items-end gap-1 max-w-[90%]">
                      <div className={`p-4 rounded-3xl text-sm leading-relaxed shadow-sm border transition-all ${
                        darkMode 
                          ? 'bg-purple-900/40 border-purple-800 text-slate-100' 
                          : 'bg-white border-purple-100 text-slate-800 shadow-purple-900/5'
                      }`}>
                        {entry.text}
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 px-2">
                        {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 p-1">
                <input 
                  type="text"
                  value={journalInput}
                  onChange={e => setJournalInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleAddJournal()}
                  placeholder={t.journal_placeholder}
                  className={`flex-1 p-4 rounded-2xl text-sm border focus:ring-2 focus:ring-purple-500 outline-none transition-colors ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'
                  }`}
                />
                <button 
                  onClick={handleAddJournal}
                  disabled={!journalInput.trim()}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-6 rounded-2xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-purple-500/20 active:scale-95"
                >
                  {t.message_yourself}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HealthPortal;
