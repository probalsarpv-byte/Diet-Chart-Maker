
import React, { useState, useRef, useEffect } from 'react';
import { HealthProfile, Language, Phase, ChatMessage, JournalEntry } from '../types';
import { translations } from '../i18n';
import { GeminiService } from '../services/geminiService';

interface Props {
  profile: HealthProfile;
  currentPhase: Phase;
  lang: Language;
  darkMode?: boolean;
}

const MessagesView: React.FC<Props> = ({ profile, currentPhase, lang, darkMode }) => {
  const t = translations[lang];
  const [tab, setTab] = useState<'coach' | 'journal'>('coach');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [journalInput, setJournalInput] = useState('');

  const coachRef = useRef<HTMLDivElement>(null);
  const journalRef = useRef<HTMLDivElement>(null);
  const gemini = new GeminiService();

  useEffect(() => {
    if (tab === 'coach' && coachRef.current) coachRef.current.scrollTop = coachRef.current.scrollHeight;
    if (tab === 'journal' && journalRef.current) journalRef.current.scrollTop = journalRef.current.scrollHeight;
  }, [messages, journal, isTyping, tab]);

  const sendCoach = async () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: new Date() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput('');
    setIsTyping(true);
    try {
      const response = await gemini.coachChat(profile, currentPhase, newMsgs, lang);
      setMessages([...newMsgs, { role: 'model', text: response, timestamp: new Date() }]);
    } catch (e) { console.error(e); }
    finally { setIsTyping(false); }
  };

  const addJournal = () => {
    if (!journalInput.trim()) return;
    setJournal([...journal, { id: Date.now().toString(), text: journalInput, timestamp: new Date() }]);
    setJournalInput('');
  };

  return (
    <div className="max-w-4xl mx-auto h-[75vh] flex flex-col rounded-[40px] border shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom duration-500 transition-colors bg-white dark:bg-slate-900 dark:border-slate-800 border-slate-100">
      <div className="flex border-b transition-colors dark:border-slate-800 border-slate-100">
        <button onClick={() => setTab('coach')} className={`flex-1 py-6 text-sm font-black uppercase tracking-widest transition-all ${tab === 'coach' ? (darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-900 text-white') : 'text-slate-400 hover:text-slate-600'}`}>
          {t.ai_coach}
        </button>
        <button onClick={() => setTab('journal')} className={`flex-1 py-6 text-sm font-black uppercase tracking-widest transition-all ${tab === 'journal' ? (darkMode ? 'bg-purple-500/10 text-purple-400' : 'bg-slate-900 text-white') : 'text-slate-400 hover:text-slate-600'}`}>
          {t.journal}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
        {tab === 'coach' ? (
          <div ref={coachRef} className="space-y-6 h-full flex flex-col">
            <div className="flex-1 space-y-6">
              {messages.length === 0 && (
                <div className={`p-8 rounded-[32px] border italic text-center text-sm ${darkMode ? 'bg-blue-950/20 border-blue-900/30 text-blue-300' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
                  {t.coach_welcome.replace('{phase}', currentPhase.toString()).replace('{dosha}', profile.dosha)}
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-5 rounded-[24px] text-sm shadow-sm leading-relaxed ${m.role === 'user' ? (darkMode ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white') : (darkMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-50 text-slate-800')}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isTyping && <div className="animate-pulse flex gap-2 p-4"><div className="w-2 h-2 rounded-full bg-blue-500"/><div className="w-2 h-2 rounded-full bg-blue-500 delay-75"/><div className="w-2 h-2 rounded-full bg-blue-500 delay-150"/></div>}
            </div>
            <div className="flex gap-2 pt-4">
              <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && sendCoach()} placeholder={t.type_message} className={`flex-1 p-5 rounded-2xl text-sm border focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'}`} />
              <button onClick={sendCoach} disabled={!input.trim() || isTyping} className="bg-blue-600 text-white px-8 rounded-2xl font-bold transition-all disabled:opacity-50 shadow-xl shadow-blue-500/20">{t.send}</button>
            </div>
          </div>
        ) : (
          <div ref={journalRef} className="space-y-6 h-full flex flex-col">
            <div className="flex-1 space-y-6">
              {journal.length === 0 && (
                <div className={`p-12 rounded-[32px] border text-center flex flex-col items-center gap-4 ${darkMode ? 'bg-purple-950/20 border-purple-900/30 text-purple-400' : 'bg-purple-50 border-purple-100 text-purple-700'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  <p className="text-sm font-bold leading-relaxed">{t.no_notes}</p>
                </div>
              )}
              {journal.map((e) => (
                <div key={e.id} className="flex justify-end">
                  <div className="flex flex-col items-end gap-1 max-w-[90%]">
                    <div className={`p-5 rounded-[24px] text-sm leading-relaxed border ${darkMode ? 'bg-purple-900/40 border-purple-800 text-slate-100' : 'bg-white border-purple-100 text-slate-800 shadow-sm'}`}>
                      {e.text}
                    </div>
                    <span className="text-[9px] font-black uppercase opacity-40 px-2">{e.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-4">
              <input type="text" value={journalInput} onChange={e => setJournalInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && addJournal()} placeholder={t.journal_placeholder} className={`flex-1 p-5 rounded-2xl text-sm border focus:ring-2 focus:ring-purple-500 outline-none transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'}`} />
              <button onClick={addJournal} disabled={!journalInput.trim()} className="bg-purple-600 text-white px-8 rounded-2xl font-bold transition-all disabled:opacity-50 shadow-xl shadow-purple-500/20">{t.message_yourself}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesView;
