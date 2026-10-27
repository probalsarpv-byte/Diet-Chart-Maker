import React, { useState, useEffect } from 'react';
import { HealthProfile, Language, DietPhaseChart, ChecklistItem, DailyAdherence } from '../types';
import { translations } from '../i18n';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { CheckCircle, Droplets, Activity, Scale, Utensils, Calendar } from 'lucide-react';

interface Props {
  profile: HealthProfile;
  chart: DietPhaseChart;
  lang: Language;
  darkMode?: boolean;
  onUpdate: (adherence: DailyAdherence) => void;
}

const ProgressTracker: React.FC<Props> = ({ profile, chart, lang, darkMode, onUpdate }) => {
  const t = translations[lang];
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [waterIntake, setWaterIntake] = useState(0);
  const [weight, setWeight] = useState<number | ''>('');
  const [energyLevel, setEnergyLevel] = useState(5);
  const [digestionRating, setDigestionRating] = useState(5);
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [pointsAwarded, setPointsAwarded] = useState(0);
  const [activeTab, setActiveTab] = useState<'log' | 'history'>('log');

  useEffect(() => {
    // Generate checklist based on current day's diet chart
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const todayPlan = chart.weeklySchedule.find(d => d.day === today) || chart.weeklySchedule[0];
    
    const checklist: ChecklistItem[] = [];
    
    // 1. Meals
    todayPlan.meals.forEach(m => {
      checklist.push({ id: `meal-${m.mealName}`, label: m.mealName, completed: false });
    });
    
    // 2. Supplements
    chart.supplements.forEach(s => {
      checklist.push({ id: `supp-${s.name}`, label: s.name, completed: false });
    });
    
    // 3. Movement
    chart.activities.forEach(a => {
      checklist.push({ id: `act-${a.name}`, label: a.name, completed: false });
    });
    
    // 4. Staples (Water/Salt) - Removed generic water item, now tracked separately
    // checklist.push({ id: 'staple-water', label: 'Recommended Water Intake', completed: false });

    setItems(checklist);
    
    // Pre-fill weight if available from profile
    if (profile.weight) {
        setWeight(profile.weight);
    }
  }, [chart, profile.weight]);

  const toggleItem = (id: string) => {
    setItems(items.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const handleSubmit = () => {
    const completedCount = items.filter(i => i.completed).length;
    // Base score from checklist completion
    let score = Math.round((completedCount / items.length) * 100);
    
    // Bonus points for tracking other metrics
    let bonusPoints = 0;
    if (waterIntake >= 8) bonusPoints += 5;
    if (weight) bonusPoints += 5;
    if (notes.length > 10) bonusPoints += 5;

    // Gamification Logic: 10 base + score/10 + bonuses
    const points = 10 + Math.floor(score / 10) + bonusPoints;
    setPointsAwarded(points);
    
    const adherence: DailyAdherence = {
      date: new Date().toISOString().split('T')[0],
      score,
      items,
      pointsEarned: points,
      waterIntake,
      weight: typeof weight === 'number' ? weight : undefined,
      energyLevel,
      digestionRating,
      notes
    };
    
    onUpdate(adherence);
    setSubmitted(true);
  };

    const renderHistory = () => {
    const history = profile.adherenceHistory || [];
    if (history.length === 0) {
        return (
            <div className="text-center py-12 opacity-50">
                <Calendar className="w-12 h-12 mx-auto mb-4" />
                <p>{t.log_no_history}</p>
            </div>
        );
    }

    const data = history.map(h => ({
        date: new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        score: h.score,
        weight: h.weight,
        energy: h.energyLevel,
        digestion: h.digestionRating,
        water: h.waterIntake
    })).slice(-7); // Last 7 entries

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className={`p-6 rounded-3xl ${darkMode ? 'bg-slate-800' : 'bg-white shadow-lg'}`}>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-500" />
                    {t.log_score_trend}
                </h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                            <XAxis dataKey="date" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                            <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: darkMode ? '#1f2937' : '#fff',
                                    borderColor: darkMode ? '#374151' : '#e5e7eb',
                                    color: darkMode ? '#fff' : '#000'
                                }} 
                            />
                            <Area type="monotone" dataKey="score" stroke="#10b981" fillOpacity={1} fill="url(#colorScore)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`p-6 rounded-3xl ${darkMode ? 'bg-slate-800' : 'bg-white shadow-lg'}`}>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Scale className="w-5 h-5 text-blue-500" />
                        {t.log_weight_trend}
                    </h3>
                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.filter(d => d.weight)}>
                                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                                <XAxis dataKey="date" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                                <YAxis domain={['auto', 'auto']} stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: darkMode ? '#1f2937' : '#fff',
                                        borderColor: darkMode ? '#374151' : '#e5e7eb',
                                        color: darkMode ? '#fff' : '#000'
                                    }} 
                                />
                                <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className={`p-6 rounded-3xl ${darkMode ? 'bg-slate-800' : 'bg-white shadow-lg'}`}>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-amber-500" />
                        {t.log_energy_trend}
                    </h3>
                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                                <XAxis dataKey="date" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                                <YAxis domain={[0, 10]} stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: darkMode ? '#1f2937' : '#fff',
                                        borderColor: darkMode ? '#374151' : '#e5e7eb',
                                        color: darkMode ? '#fff' : '#000'
                                    }} 
                                />
                                <Legend />
                                <Line type="monotone" dataKey="energy" stroke="#f59e0b" strokeWidth={2} name="Energy" />
                                <Line type="monotone" dataKey="digestion" stroke="#8b5cf6" strokeWidth={2} name="Digestion" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
  };

  if (submitted) {
    return (
      <div className={`p-8 rounded-[40px] border shadow-xl text-center animate-in zoom-in duration-500 ${darkMode ? 'bg-slate-900 border-emerald-500/30' : 'bg-white border-emerald-100'}`}>
        <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg animate-bounce">✓</div>
        <h3 className="text-2xl font-bold serif italic mb-2">{t.checklist_success}</h3>
        <div className="inline-flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest shadow-lg animate-in slide-in-from-bottom duration-1000">
           <span>+{pointsAwarded} {t.pts}</span>
           <span>⭐</span>
        </div>
        <button 
            onClick={() => { setSubmitted(false); setActiveTab('history'); }}
            className="mt-6 text-emerald-500 hover:text-emerald-600 font-bold underline"
        >
            {t.log_view_progress}
        </button>
      </div>
    );
  }

  return (
    <div className={`rounded-[40px] border shadow-2xl transition-all overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        <button 
            onClick={() => setActiveTab('log')}
            className={`flex-1 py-4 font-bold text-sm uppercase tracking-widest transition-colors ${activeTab === 'log' ? (darkMode ? 'bg-slate-800 text-emerald-400' : 'bg-slate-50 text-emerald-600') : (darkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')}`}
        >
            {t.log_tab_daily}
        </button>
        <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-4 font-bold text-sm uppercase tracking-widest transition-colors ${activeTab === 'history' ? (darkMode ? 'bg-slate-800 text-emerald-400' : 'bg-slate-50 text-emerald-600') : (darkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')}`}
        >
            {t.log_tab_history}
        </button>
      </div>

      <div className="p-6 md:p-10">
        {activeTab === 'log' ? (
            <div className="space-y-10 animate-in fade-in slide-in-from-left duration-300">
                <div>
                    <h2 className={`text-2xl font-bold serif italic mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{t.daily_checklist}</h2>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.checklist_subtitle}</p>
                </div>

                {/* Checklist Section */}
                <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Utensils className="w-4 h-4" /> {t.log_meals}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {items.map(item => (
                        <button
                            key={item.id}
                            onClick={() => toggleItem(item.id)}
                            className={`p-4 rounded-2xl border-2 text-left flex items-center gap-4 transition-all ${
                            item.completed 
                                ? (darkMode ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-emerald-50 border-emerald-500 text-emerald-700 font-bold')
                                : (darkMode ? 'bg-slate-800/50 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500')
                            }`}
                        >
                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
                            item.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-400'
                            }`}>
                            {item.completed && <span className="text-white text-xs">✓</span>}
                            </div>
                            <span className="text-sm">{item.label}</span>
                        </button>
                        ))}
                    </div>
                </div>

                {/* Water Tracking */}
                <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Droplets className="w-4 h-4" /> {t.log_water}
                    </h3>
                    <div className={`p-6 rounded-3xl flex items-center justify-between ${darkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-100'}`}>
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setWaterIntake(Math.max(0, waterIntake - 1))}
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-white shadow hover:bg-slate-50'}`}
                            >-</button>
                            <div className="text-center">
                                <span className={`text-3xl font-black ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{waterIntake}</span>
                                <p className="text-xs uppercase tracking-widest opacity-60">{t.log_glasses}</p>
                            </div>
                            <button 
                                onClick={() => setWaterIntake(waterIntake + 1)}
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-white shadow hover:bg-slate-50'}`}
                            >+</button>
                        </div>
                        <div className="flex gap-1">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className={`w-2 h-8 rounded-full transition-all ${i < waterIntake ? 'bg-blue-500' : (darkMode ? 'bg-slate-700' : 'bg-slate-200')}`} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Metrics: Weight, Energy, Digestion */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest opacity-60">{t.log_weight}</label>
                        <div className={`flex items-center px-4 py-3 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                            <Scale className="w-5 h-5 opacity-50 mr-3" />
                            <input 
                                type="number" 
                                value={weight} 
                                onChange={(e) => setWeight(parseFloat(e.target.value) || '')}
                                placeholder="0.0"
                                className="bg-transparent w-full outline-none font-bold"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest opacity-60">{t.log_energy}</label>
                        <input 
                            type="range" 
                            min="1" 
                            max="10" 
                            value={energyLevel} 
                            onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                            className="w-full accent-emerald-500"
                        />
                        <div className="flex justify-between text-xs opacity-50">
                            <span>Low</span>
                            <span className="font-bold text-emerald-500">{energyLevel}</span>
                            <span>High</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest opacity-60">{t.log_digestion}</label>
                        <input 
                            type="range" 
                            min="1" 
                            max="10" 
                            value={digestionRating} 
                            onChange={(e) => setDigestionRating(parseInt(e.target.value))}
                            className="w-full accent-purple-500"
                        />
                        <div className="flex justify-between text-xs opacity-50">
                            <span>Poor</span>
                            <span className="font-bold text-purple-500">{digestionRating}</span>
                            <span>Great</span>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest opacity-60">{t.log_notes}</label>
                    <textarea 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={t.log_notes_placeholder}
                        className={`w-full p-4 rounded-2xl border min-h-[100px] outline-none focus:ring-2 ring-emerald-500/50 transition-all ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                    />
                </div>

                <button
                    onClick={handleSubmit}
                    className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[30px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                    <CheckCircle className="w-6 h-6" />
                    {t.submit_checklist}
                </button>
            </div>
        ) : (
            renderHistory()
        )}
      </div>
    </div>
  );
};

export default ProgressTracker;
