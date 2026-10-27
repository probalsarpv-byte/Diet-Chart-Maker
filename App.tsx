
import React, { useState, useEffect } from 'react';
import AssessmentStep from './components/AssessmentStep';
import AnalysisReport from './components/AnalysisReport';
import ProfileView from './components/ProfileView';
import DietView from './components/DietView';
import FamilyPotView from './components/FamilyPotView';
import ARPortionGuideView from './components/ARPortionGuideView';
import CommunityHub from './components/CommunityHub';
import MessagesView from './components/MessagesView';
import SOSModal from './components/SOSModal';
import DoctorDashboard from './components/DoctorDashboard';
import SmartBazaar from './components/SmartBazaar';
import HomeGrid from './components/HomeGrid';
import LoginScreen from './components/LoginScreen';
import PaywallModal from './components/PaywallModal'; 
import FoodRecognitionView from './components/FoodRecognitionView';
import Leaderboard from './components/Leaderboard';
import ProgressTracker from './components/ProgressTracker';
import VoiceCookbookView from './components/VoiceCookbookView';
import HealthCalculator from './components/HealthCalculator'; 
import DinacharyaView from './components/DinacharyaView';
import EcommerceView from './components/EcommerceView';
import { HealthProfile, Language, Phase, User, DailyAdherence, Badge, DietPhaseChart } from './types';
import { translations } from './i18n';
import { GeminiService } from './services/geminiService';

type View = 'home' | 'profile' | 'diet' | 'checklist' | 'family_pot' | 'ar_guide' | 'community' | 'messages' | 'login' | 'food_recognition' | 'leaderboard' | 'dashboard' | 'assessment_gate' | 'cookbook' | 'calculator' | 'dinacharya' | 'marketplace';
type AppState = 'onboarding' | 'analysis' | 'dashboard';

const languages: { code: Language; native: string }[] = [
  { code: 'en', native: 'English' },
  { code: 'hi', native: 'हिन्दी' },
  { code: 'es', native: 'Español' },
  { code: 'bn', native: 'বাংলা' }
];

const INITIAL_BADGES: Badge[] = [
  { id: 'pioneer', name: 'Path Pioneer', icon: '🚀', description: 'Complete your first assessment', unlocked: true },
  { id: 'healer', name: 'Consistent Healer', icon: '✨', description: '7-day compliance streak', unlocked: false },
  { id: 'voice', name: 'Community Voice', icon: '🗣️', description: 'Post in the community hub', unlocked: false },
  { id: 'detox', name: 'Detox Master', icon: '🍃', description: 'Complete Phase 1', unlocked: false },
  { id: 'micro', name: 'Gut Mechanic', icon: '🧬', description: 'Complete Phase 2', unlocked: false },
  { id: 'warrior', name: 'Insulin Warrior', icon: '⚔️', description: 'Complete Phase 3', unlocked: false },
  { id: 'legend', name: 'Longevity Legend', icon: '👑', description: 'Complete Phase 4', unlocked: false },
];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<HealthProfile | null>(null);
  const [lang, setLang] = useState<Language>('en');
  const [appState, setAppState] = useState<AppState>('onboarding');
  const [currentView, setCurrentView] = useState<View>('home');
  const [currentPhase, setCurrentPhase] = useState<Phase>(Phase.DETOX);
  const [currentChart, setCurrentChart] = useState<DietPhaseChart | null>(null);
  const [showSOS, setShowSOS] = useState(false);
  const [showDoctorDashboard, setShowDoctorDashboard] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false); 
  const [blockedFeature, setBlockedFeature] = useState<string>(''); 
  const [showReminder, setShowReminder] = useState(false);

  const gemini = new GeminiService();

  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  const t = translations[lang];

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Global 10 PM Reminder logic
  useEffect(() => {
    if (!profile) return;
    const checkTime = () => {
      const now = new Date();
      const hour = now.getHours();
      const todayStr = now.toISOString().split('T')[0];
      const alreadySubmitted = profile.adherenceHistory?.some(h => h.date === todayStr);
      if (hour >= 22 && !alreadySubmitted) {
        setShowReminder(true);
      }
    };
    checkTime();
    const interval = setInterval(checkTime, 1000 * 60 * 5); 
    return () => clearInterval(interval);
  }, [profile]);

  const fetchChart = async (p: HealthProfile, ph: Phase) => {
    try {
      const result = await gemini.analyzeHealthAndPhase(p, ph, 1, lang);
      setCurrentChart(result);
    } catch (error) {
      console.error("Chart fetch error:", error);
    }
  };

  const handleAssessmentComplete = (p: HealthProfile) => {
    setProfile(p);
    setAppState('analysis'); 
    setCurrentView('diet'); 
    fetchChart(p, Phase.DETOX);
  };

  const handleLogin = (loggedInUser: User) => {
    const enrichedUser = {
        ...loggedInUser,
        points: 100,
        badges: INITIAL_BADGES
    };
    setUser(enrichedUser);
    if (loggedInUser.id.startsWith('DOC-')) {
       if (!profile) {
           setProfile({ dosha: 'Practitioner', age: 35, gender: 'N/A', weight: 0, height: 0, microbiomeScore: 100, inflammatoryIndex: 0, metabolicType: 'Optimal', alkalineBalance: 'Neutral', psychologicalProfile: 'Neutral', medications: '', dietHistory: '', answers: {}, analysis: null });
       }
       setShowDoctorDashboard(true);
       setAppState('dashboard');
       setCurrentView('home');
    }
  };

  const handleSubscribe = () => {
    if (user) {
      const updatedUser = { ...user, isPro: true };
      setUser(updatedUser);
      setShowPaywall(false);
    }
  };

  const handleNavigation = (view: View) => {
    if (view === 'food_recognition') {
        setCurrentView(view);
        return;
    }

    if (!user && view !== 'home' && view !== 'assessment_gate') {
       setCurrentView('assessment_gate');
       return;
    }

    const restrictedFeatures: View[] = ['diet', 'ar_guide', 'checklist', 'profile', 'family_pot', 'dinacharya', 'cookbook'];
    
    // Calculator is intentionally left out of restricted features so all users can access
    if (restrictedFeatures.includes(view) && !profile && !user?.id?.startsWith('DOC-')) {
      setCurrentView('assessment_gate');
      return;
    }

    if (view === 'dashboard' || (view === 'home' && user?.id?.startsWith('DOC-'))) {
        setShowDoctorDashboard(true);
        setCurrentView('home');
        return;
    }

    if (view === 'home' || view === 'leaderboard' || view === 'community' || view === 'messages' || view === 'assessment_gate' || view === 'marketplace' || view === 'calculator') {
      setCurrentView(view);
      return;
    }

    setCurrentView(view);
  };

  const handleBack = () => {
    setCurrentView('home');
  };

  const handlePointsUpdate = (newPoints: number, badgeId?: string) => {
    if (user) {
      const updatedUser = { ...user, points: user.points + newPoints };
      if (badgeId && updatedUser.badges) {
        updatedUser.badges = updatedUser.badges.map(b => b.id === badgeId ? { ...b, unlocked: true } : b);
      }
      setUser(updatedUser);
    }
  };

  const NavItem = ({ view, label, icon }: { view: View, label: string, icon: React.ReactNode }) => {
    const isLocked = false; // Premium features unconditionally unlocked


    const showLock = (view === 'family_pot' || view === 'ar_guide' || view === 'dinacharya' || view === 'cookbook') && isLocked;

    return (
      <button
        onClick={() => handleNavigation(view)}
        className={`flex flex-col items-center gap-1.5 transition-all px-2 md:px-4 py-2 rounded-2xl ${
          currentView === view 
            ? (darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 scale-105')
            : (darkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-900')
        }`}
      >
        <div className="relative">
          {icon}
          {showLock && <span className="absolute -top-2 -right-2 text-[10px]">🔒</span>}
        </div>
        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-tight whitespace-nowrap">{label}</span>
      </button>
    );
  };

  const renderContent = () => {
    if (currentView === 'home') {
      return <HomeGrid onNavigate={handleNavigation} lang={lang} darkMode={darkMode} user={user} />;
    }

    if (currentView === 'assessment_gate') {
      return (
        <div className="max-w-4xl mx-auto animate-in fade-in">
          <AssessmentStep 
            user={user}
            onComplete={handleAssessmentComplete} 
            onLoginAsDoctor={handleLogin}
            onSelfLogin={handleLogin}
            lang={lang} 
            darkMode={darkMode} 
          />
        </div>
      );
    }

    if (currentView === 'leaderboard') {
      return <Leaderboard lang={lang} darkMode={darkMode} />;
    }

    if (currentView === 'food_recognition') {
      return <FoodRecognitionView profile={profile} lang={lang} darkMode={darkMode} />;
    }

    if (currentView === 'marketplace') {
      return <EcommerceView user={user} profile={profile} lang={lang} darkMode={darkMode} onUpdateUser={setUser} />;
    }

    if (currentView === 'calculator') {
      return <HealthCalculator lang={lang} darkMode={darkMode} />;
    }

    if (currentView === 'community') {
      const safeProfile = profile || { dosha: 'Guest', age: 0, gender: 'N/A', weight: 0, height: 0, microbiomeScore: 50, inflammatoryIndex: 5, metabolicType: 'Normal', alkalineBalance: 'Neutral', psychologicalProfile: 'Neutral', medications: '', dietHistory: '', answers: {}, analysis: null };
      return <CommunityHub profile={safeProfile} currentPhase={currentPhase} lang={lang} darkMode={darkMode} />;
    }
    
    if (currentView === 'messages') {
       const safeProfile = profile || { dosha: 'Guest', age: 0, gender: 'N/A', weight: 0, height: 0, microbiomeScore: 50, inflammatoryIndex: 5, metabolicType: 'Normal', alkalineBalance: 'Neutral', psychologicalProfile: 'Neutral', medications: '', dietHistory: '', answers: {}, analysis: null };
       return <MessagesView profile={safeProfile} currentPhase={currentPhase} lang={lang} darkMode={darkMode} />;
    }

    if (currentView === 'login') {
      return <LoginScreen onLogin={handleLogin} lang={lang} darkMode={darkMode} />;
    }

    if (!profile && !user?.id?.startsWith('DOC-')) {
       return <AssessmentStep 
         user={user}
         onComplete={handleAssessmentComplete} 
         onLoginAsDoctor={handleLogin}
         onSelfLogin={handleLogin}
         lang={lang} 
         darkMode={darkMode} 
       />;
    }

    if (appState === 'analysis' && profile && !user?.id.startsWith('DOC-')) {
       return <AnalysisReport profile={profile} lang={lang} darkMode={darkMode} onProceed={() => setAppState('dashboard')} />;
    }

    if (appState === 'dashboard' || profile || user?.id?.startsWith('DOC-')) {
      return (
        <div className="animate-in fade-in slide-in-from-bottom duration-700 gpu-accelerated">
          {currentView === 'profile' && user && (profile || user.id.startsWith('DOC-')) && (
            <ProfileView 
              user={user} 
              profile={profile || {} as HealthProfile} 
              currentPhase={currentPhase} 
              lang={lang} 
              darkMode={darkMode} 
              onNavigateToDiet={() => handleNavigation('diet')}
              onNavigateToDashboard={() => setShowDoctorDashboard(true)}
            />
          )}
          {currentView === 'diet' && profile && (
            <DietView 
              profile={profile} 
              lang={lang} 
              darkMode={darkMode} 
              currentPhase={currentPhase} 
              onPhaseChange={(p) => {
                 setCurrentPhase(p);
                 fetchChart(profile, p);
                 if (p === 2) handlePointsUpdate(200, 'detox');
                 if (p === 3) handlePointsUpdate(200, 'micro');
                 if (p === 4) handlePointsUpdate(200, 'warrior');
              }}
              onWeekComplete={() => handlePointsUpdate(50)}
              user={user} 
              onShowPaywall={() => { setBlockedFeature(t.diet_chart); setShowPaywall(true); }}
              onUpdateProfile={setProfile}
              initialChart={currentChart}
            />
          )}
          {currentView === 'checklist' && currentChart && profile && (
            <div className="max-w-4xl mx-auto space-y-8">
              <ProgressTracker 
                profile={profile} 
                chart={currentChart} 
                lang={lang} 
                darkMode={darkMode} 
                onUpdate={(updated) => {
                  const existingHistory = profile.adherenceHistory || [];
                  const today = new Date().toISOString().split('T')[0];
                  const existingIndex = existingHistory.findIndex(h => h.date === today);
                  
                  let pointsToAdd = updated.pointsEarned;
                  let newHistory;

                  if (existingIndex >= 0) {
                    const previousPoints = existingHistory[existingIndex].pointsEarned || 0;
                    pointsToAdd = updated.pointsEarned - previousPoints;
                    
                    newHistory = [...existingHistory];
                    newHistory[existingIndex] = updated;
                  } else {
                    newHistory = [...existingHistory, updated];
                  }
                  
                  if (pointsToAdd !== 0) {
                      handlePointsUpdate(pointsToAdd);
                  }
                  
                  setProfile({ ...profile, adherenceHistory: newHistory });
                  setShowReminder(false);
                }} 
              />
            </div>
          )}
          {currentView === 'family_pot' && profile && <FamilyPotView profile={profile} currentPhase={currentPhase} lang={lang} darkMode={darkMode} />}
          {currentView === 'cookbook' && profile && <VoiceCookbookView profile={profile} lang={lang} darkMode={darkMode} currentChart={currentChart} />}
          {currentView === 'dinacharya' && profile && <DinacharyaView profile={profile} lang={lang} darkMode={darkMode} />}
          {currentView === 'ar_guide' && <ARPortionGuideView lang={lang} darkMode={darkMode} />}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#fdfdfd] text-slate-900'}`}>
      {showPaywall && <PaywallModal lang={lang} darkMode={darkMode} featureName={blockedFeature} onClose={() => setShowPaywall(false)} onSubscribe={handleSubscribe} />}
      {showSOS && <SOSModal lang={lang} onDismiss={() => setShowSOS(false)} emergencyContact={profile?.emergencyContact} />}
      {showDoctorDashboard && user && (
        <DoctorDashboard 
          user={user}
          profile={profile || {} as HealthProfile} 
          currentPhase={currentPhase} 
          lang={lang} 
          darkMode={darkMode} 
          onClose={() => setShowDoctorDashboard(false)}
          onSubscribeSuccess={handleSubscribe}
        />
      )}

      {showReminder && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-full max-w-2xl px-4 animate-in slide-in-from-top duration-500">
          <div className="bg-blue-600 text-white p-6 rounded-[30px] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 border-4 border-blue-400">
            <div className="flex items-center gap-4">
              <div className="text-4xl">🕙</div>
              <p className="font-bold text-sm md:text-base">{t.checklist_reminder}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setShowReminder(false); handleNavigation('checklist'); }} className="px-6 py-2 bg-white text-blue-600 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg">Complete Now</button>
              <button onClick={() => setShowReminder(false)} className="px-4 py-2 bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest">Later</button>
            </div>
          </div>
        </div>
      )}

      <nav className={`sticky top-0 z-50 border-b py-3 px-4 md:px-8 backdrop-blur-md transition-colors duration-300 ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-100'}`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-2 md:gap-4">
          <div className="flex items-center gap-3">
            {currentView !== 'home' && (
              <button onClick={handleBack} className={`p-2 rounded-xl transition-all hover:scale-105 active:scale-95 ${darkMode ? 'bg-slate-800 text-slate-300 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'}`} aria-label="Back">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
            )}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('home')}>
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center font-bold text-lg md:text-xl serif italic shadow-lg ${darkMode ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/10' : 'bg-slate-900 text-white'}`}>
                {profile ? profile.dosha[0] : 'A'}
              </div>
              <span className={`text-lg md:text-xl font-bold tracking-tight serif italic hidden xs:block ${darkMode ? 'text-white' : 'text-slate-800'}`}>Precision Nutrition</span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {user && (
               <div className="flex flex-col items-end mr-2">
                  <span className="text-[8px] font-black uppercase tracking-tighter text-amber-500">{user.points} Credits</span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${darkMode ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                    {user.id?.startsWith('DOC-') ? 'Doctor' : 'Premium'}
                  </span>
               </div>
            )}
            {user?.id?.startsWith('DOC-') && (
               <button onClick={() => setShowDoctorDashboard(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-3 md:px-5 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] md:text-xs transition-all active:scale-95 shadow-lg">Dashboard</button>
            )}
            <button onClick={() => setShowSOS(true)} className="bg-red-600 hover:bg-red-50 text-white px-3 md:px-5 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] md:text-xs animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all active:scale-95 whitespace-nowrap">{t.sos_button}</button>
            <div className="flex items-center gap-2">
              <div className="relative">
                <button onClick={() => setShowLanguageMenu(!showLanguageMenu)} className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${darkMode ? 'bg-slate-800 border-slate-700 text-emerald-400' : 'bg-white border-slate-200 text-slate-900'}`}><span className="text-lg">🌐</span></button>
                {showLanguageMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowLanguageMenu(false)} />
                    <div className={`absolute top-full mt-2 right-0 z-20 w-40 rounded-xl shadow-2xl border overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                      {languages.map(l => (
                        <button key={l.code} onClick={() => { setLang(l.code); setShowLanguageMenu(false); }} className={`w-full px-4 py-3 text-left flex justify-between items-center transition-colors border-b last:border-0 ${darkMode ? 'border-slate-700 hover:bg-slate-700' : 'border-slate-50 hover:bg-slate-50'} ${lang === l.code ? (darkMode ? 'bg-slate-700/50' : 'bg-slate-50') : ''}`}>
                          <span className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{l.native}</span>
                          {lang === l.code && <span className="text-emerald-500 font-bold">✓</span>}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-xl transition-all border ${darkMode ? 'bg-slate-800 border-slate-700 text-yellow-400' : 'bg-white border-slate-200 text-slate-600 shadow-sm'}`}>
                {darkMode ? <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="3" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>}
              </button>
            </div>
            {user && <button onClick={() => { setProfile(null); setUser(null); setAppState('onboarding'); setCurrentView('home'); setShowDoctorDashboard(false); }} className={`p-2 md:px-4 md:py-2 text-sm font-bold rounded-lg transition-colors border ${darkMode ? 'text-red-400 hover:bg-red-950/30 border-red-900/50' : 'text-red-600 hover:bg-red-50 border-red-100'}`}><span className="hidden md:inline">Logout</span><span className="md:hidden">🚪</span></button>}
          </div>
        </div>
      </nav>

      <main className="flex-1 py-8 md:py-12 px-4 md:px-8 max-w-7xl mx-auto w-full pb-32">
        {renderContent()}
        {profile && currentView !== 'home' && currentView !== 'login' && <SmartBazaar profile={profile} currentPhase={currentPhase} lang={lang} darkMode={darkMode} />}
      </main>

      {(user && currentView !== 'home' && currentView !== 'login') && (
        <div className={`fixed bottom-0 inset-x-0 z-[60] border-t backdrop-blur-xl py-3 px-4 transition-colors duration-300 ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-100 shadow-2xl shadow-black/20'}`}>
          <div className="max-w-xl mx-auto flex justify-between items-center overflow-x-auto gap-1 md:gap-4 scrollbar-hide">
            <button onClick={() => setCurrentView('home')} className="p-2 opacity-50 hover:opacity-100 transition-opacity">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            </button>
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1"></div>
            <NavItem view="profile" label={t.nav_profile} icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>} />
            <NavItem view="ar_guide" label={t.nav_ar} icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>} />
            <NavItem view="dinacharya" label={t.nav_sun} icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>} />
            <NavItem view="messages" label={t.nav_chat} icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>} />
          </div>
        </div>
      )}

      <footer className={`py-16 md:py-32 transition-colors duration-300 ${darkMode ? 'bg-slate-900 text-slate-400' : 'bg-slate-900 text-slate-500'}`}>
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16 text-sm">
          <div className="space-y-4">
            <h4 className="text-white font-bold text-lg serif italic">Precision Nutrition Science</h4>
            <p className="leading-relaxed">Clinical-grade biological mapping for sustainable health.</p>
          </div>
          <div className="space-y-4">
            <h4 className="text-white font-bold text-lg">Legal</h4>
            <p className="leading-relaxed italic">Consult a medical professional. This AI tool is for professional-assisted support.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
