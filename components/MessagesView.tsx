import React, { useState } from 'react';
import {
  HealthProfile,
  Phase,
  Language,
  DietPhaseChart,
  DailyCalorieLog,
} from '../types';
import { translations } from '../i18n';
import IndividualizedChatbot from './IndividualizedChatbot';
import { Bot, BookOpen, Calendar, Sparkles } from 'lucide-react';

interface MessagesViewProps {
  profile: HealthProfile;
  currentPhase: Phase;
  lang: Language;
  darkMode?: boolean;
  currentChart?: DietPhaseChart | null;
  todayLog?: DailyCalorieLog | null;
  hasRealProfile?: boolean;
  onStartAssessment?: () => void;
}

const MessagesView: React.FC<MessagesViewProps> = ({
  profile,
  currentPhase,
  lang,
  darkMode = false,
  currentChart = null,
  todayLog = null,
  hasRealProfile = true,
  onStartAssessment,
}) => {
  const t = translations[lang];
  const isBn = lang === 'bn';
  const [activeTab, setActiveTab] = useState<'coach' | 'journal'>('coach');
  const [journalEntries, setJournalEntries] = useState<{ date: string; text: string }[]>([
    {
      date: new Date().toLocaleDateString(),
      text: isBn
        ? 'সকালের ডিটক্স ওয়াটার ও প্রোটিন নাস্তার পর শরীর বেশ হালকা ও চনমনে লাগছে।'
        : 'Started my metabolic detox phase today. Feeling energized and light after the morning routine.',
    },
  ]);
  const [newEntry, setNewEntry] = useState('');

  const handleSaveEntry = () => {
    if (!newEntry.trim()) return;
    setJournalEntries([
      { date: new Date().toLocaleDateString(), text: newEntry },
      ...journalEntries,
    ]);
    setNewEntry('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24">
      {/* Top Section Header & Tab Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {isBn
                ? 'ব্যক্তিগতকৃত পুষ্টি ও স্বাস্থ্য পরামর্শ'
                : 'Personalized Nutrition & Health Guidance'}
            </span>
          </div>
          <h2
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            {isBn ? 'AI নিউট্রিশন কোচ ও হেলথ জার্নাল' : 'AI Nutrition Coach & Health Journal'}
          </h2>
        </div>

        <div
          className={`inline-flex p-1.5 rounded-2xl border self-start ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <button
            onClick={() => setActiveTab('coach')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all ${
              activeTab === 'coach'
                ? 'bg-emerald-600 text-white shadow-sm'
                : darkMode
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>{isBn ? 'AI চ্যাটবট ও ফুড চেকার' : t.messages_ai_coach}</span>
          </button>
          <button
            onClick={() => setActiveTab('journal')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all ${
              activeTab === 'journal'
                ? 'bg-emerald-600 text-white shadow-sm'
                : darkMode
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{isBn ? 'দৈনিক হেলথ জার্নাল' : t.messages_journal}</span>
          </button>
        </div>
      </div>

      {activeTab === 'coach' ? (
        <IndividualizedChatbot
          profile={profile}
          currentPhase={currentPhase}
          lang={lang}
          darkMode={darkMode}
          currentChart={currentChart}
          todayLog={todayLog}
          hasRealProfile={hasRealProfile}
          mode="embedded"
          onStartAssessment={onStartAssessment}
        />
      ) : (
        <div
          className={`${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          } p-6 sm:p-8 rounded-3xl shadow-sm border space-y-6`}
        >
          <div>
            <h3
              className={`text-xl font-extrabold ${
                darkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              {isBn ? 'আপনার দৈনিক শারীরিক অনুভূতি ও নোট' : t.messages_journal}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {isBn
                ? 'প্রতিদিনের খাবার পর আপনার হজম, ঘুম ও এনার্জি লেভেল এখানে লিখে রাখুন।'
                : 'Record your daily digestion, sleep quality, and post-meal energy levels.'}
            </p>
          </div>

          <textarea
            value={newEntry}
            onChange={(e) => setNewEntry(e.target.value)}
            className={`w-full h-36 p-4 rounded-2xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              darkMode
                ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400'
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
            }`}
            placeholder={
              isBn
                ? 'আজ আপনার শরীর কেমন লাগছে? কোনো খাবারের পর গ্যাস বা ক্লান্তি অনুভব করেছেন কি?'
                : t.messages_journal_placeholder
            }
          />
          <button
            onClick={handleSaveEntry}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-extrabold text-sm hover:bg-emerald-700 transition-all shadow-sm"
          >
            {isBn ? 'জার্নাল সংরক্ষণ করুন' : t.messages_save_entry}
          </button>

          <div className="space-y-3 pt-4">
            {journalEntries.map((entry, i) => (
              <div
                key={i}
                className={`p-4 rounded-2xl border ${
                  darkMode
                    ? 'bg-slate-800/60 border-slate-700 text-slate-200'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{entry.date}</span>
                </div>
                <p className="text-sm font-medium leading-relaxed">{entry.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesView;
