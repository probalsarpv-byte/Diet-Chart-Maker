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
import DietMakerHub, { DietMakerFeature } from './components/DietMakerHub';
import {
  HealthProfile,
  Language,
  Phase,
  User,
  Badge,
  DietPhaseChart,
  ProfileRoleType,
} from './types';
import { translations } from './i18n';
import { GeminiService } from './services/geminiService';

type View =
  | 'home'
  | 'diet_maker'
  | 'profile'
  | 'diet'
  | 'checklist'
  | 'family_pot'
  | 'ar_guide'
  | 'community'
  | 'messages'
  | 'login'
  | 'food_recognition'
  | 'leaderboard'
  | 'dashboard'
  | 'assessment_gate'
  | 'cookbook'
  | 'calculator'
  | 'dinacharya'
  | 'marketplace';

type AppState = 'onboarding' | 'analysis' | 'dashboard';

const languages: { code: Language; native: string }[] = [
  { code: 'en', native: 'English' },
  { code: 'hi', native: 'हिन्दी' },
  { code: 'es', native: 'Español' },
  { code: 'bn', native: 'বাংলা' },
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
  const [lang, setLang] = useState<Language>('bn');
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
  const [analysisStep, setAnalysisStep] = useState<'report' | 'traffic_light'>('report');

  // Remembers which Diet Maker sub-feature user wanted before completing Profile + Assessment
  const [pendingDietMakerTarget, setPendingDietMakerTarget] = useState<DietMakerFeature | null>(null);
  const [preferredRole, setPreferredRole] = useState<ProfileRoleType | null>(null);

  const gemini = new GeminiService();

  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  const t = translations[lang];
  const isBn = lang === 'bn';

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
      const alreadySubmitted = profile.adherenceHistory?.some((h) => h.date === todayStr);
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
      console.error('Chart fetch error:', error);
    }
  };

  const handleAssessmentComplete = (p: HealthProfile, patientName?: string, createdUser?: User) => {
    if (createdUser) {
      setUser({
        ...createdUser,
        points: createdUser.points || 100,
        badges: createdUser.badges?.length ? createdUser.badges : INITIAL_BADGES,
      });
    } else if (!user) {
      setUser({
        id: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
        name: patientName || (isBn ? 'ব্যক্তিগত ইউজার' : 'Personal User'),
        email: 'user@precision.com',
        isPro: true,
        profileType: preferredRole || 'self',
        trialStartDate: new Date().toISOString(),
        points: 100,
        badges: INITIAL_BADGES,
      });
    }

    setProfile(p);
    fetchChart(p, currentPhase);

    // If user wanted Cookbook or Daily Checklist directly after unlocking, still let them review clinical report/Traffic Light or jump directly
    setAnalysisStep('report');
    setAppState('analysis');
    setCurrentView('diet');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogin = (loggedInUser: User, doctorProfile?: HealthProfile) => {
    const enrichedUser: User = {
      ...loggedInUser,
      points: loggedInUser.points || 100,
      badges: loggedInUser.badges?.length ? loggedInUser.badges : INITIAL_BADGES,
    };
    setUser(enrichedUser);

    if (loggedInUser.id.startsWith('DOC-') || loggedInUser.profileType === 'doctor') {
      const resolvedProfile: HealthProfile = doctorProfile ||
        profile || {
          dosha: 'Pitta',
          age: 38,
          gender: 'Male',
          weight: 70,
          height: 170,
          microbiomeScore: 90,
          inflammatoryIndex: 2,
          metabolicType: 'Optimal',
          alkalineBalance: 'Optimal',
          psychologicalProfile: 'Calm/Steady',
          medications: 'None',
          dietHistory: 'Clinical Practitioner',
          answers: {},
          analysis: null,
        };
      setProfile(resolvedProfile);
      fetchChart(resolvedProfile, currentPhase);
      setAppState('dashboard');
      setCurrentView(pendingDietMakerTarget || 'profile');
      setPendingDietMakerTarget(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // 1. Public views accessible WITH OR WITHOUT a profile:
    // Home, Diet Maker Hub, Leaderboard, Calculator, Food Glossary, Marketplace, Community, Messages
    const publicViews: View[] = [
      'home',
      'diet_maker',
      'leaderboard',
      'calculator',
      'food_recognition',
      'marketplace',
      'community',
      'messages',
      'assessment_gate',
      'login',
    ];

    if (publicViews.includes(view)) {
      setCurrentView(view);
      return;
    }

    // 2. Diet Maker sub-features (Make Your Diet Chart, Cookbook, Daily Checklist, Family Pot):
    // If not unlocked (!user || !profile), route to Diet Maker Hub where the requirement prompt is shown
    const dietMakerFeatures: View[] = ['diet', 'cookbook', 'checklist', 'family_pot'];
    if (dietMakerFeatures.includes(view) && (!user || !profile)) {
      setCurrentView('diet_maker');
      return;
    }

    // 3. Profile view: if user hasn't created a profile yet, open Assessment/Profile creation gate
    if (view === 'profile' && (!user || !profile)) {
      setPreferredRole(null);
      setPendingDietMakerTarget(null);
      setCurrentView('assessment_gate');
      return;
    }

    if (view === 'dashboard') {
      setShowDoctorDashboard(true);
      return;
    }

    setCurrentView(view);
  };

  const handleBack = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (['diet', 'cookbook', 'checklist', 'family_pot'].includes(currentView)) {
      setCurrentView('diet_maker');
      return;
    }
    setCurrentView('home');
  };

  const handlePointsUpdate = (newPoints: number, badgeId?: string) => {
    if (user) {
      const updatedUser = { ...user, points: user.points + newPoints };
      if (badgeId && updatedUser.badges) {
        updatedUser.badges = updatedUser.badges.map((b) => (b.id === badgeId ? { ...b, unlocked: true } : b));
      }
      setUser(updatedUser);
    }
  };

  const NavItem = ({ view, label, icon }: { view: View; label: string; icon: React.ReactNode }) => {
    const isActive =
      currentView === view ||
      (view === 'diet_maker' && ['diet', 'cookbook', 'checklist', 'family_pot'].includes(currentView));
    return (
      <button
        onClick={() => handleNavigation(view)}
        className={`flex flex-col items-center gap-1 transition-all px-2.5 py-1.5 rounded-2xl ${
          isActive
            ? darkMode
              ? 'bg-emerald-500/15 text-emerald-400'
              : 'bg-slate-900 text-white shadow-md'
            : darkMode
            ? 'text-slate-400 hover:text-slate-200'
            : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <div className="relative">{icon}</div>
        <span className="text-[10px] font-bold tracking-tight whitespace-nowrap">{label}</span>
      </button>
    );
  };

  // Sub-navigation bar inside Diet Maker tools (Make Your Diet Chart, Cookbook, Daily Checklist, Family Pot)
  const renderDietMakerSubNav = () => {
    if (!['diet', 'cookbook', 'checklist', 'family_pot'].includes(currentView)) return null;
    return (
      <div
        className={`mb-6 p-2.5 rounded-2xl border flex flex-wrap items-center justify-between gap-2 ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
        }`}
      >
        <button
          onClick={() => setCurrentView('diet_maker')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
            darkMode ? 'bg-slate-800 text-slate-300 hover:text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <span>←</span>
          <span>{isBn ? 'ডায়েট মেকার হাব' : 'Diet Maker Hub'}</span>
        </button>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => {
              setAppState('dashboard');
              setCurrentView('diet');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              currentView === 'diet'
                ? 'bg-emerald-600 text-white shadow-md'
                : darkMode
                ? 'text-slate-400 hover:bg-slate-800'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>🥗</span>
            <span>{isBn ? 'মেক ইউর ডায়েট চার্ট' : 'Make Diet Chart'}</span>
          </button>

          <button
            onClick={() => {
              setAppState('dashboard');
              setCurrentView('cookbook');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              currentView === 'cookbook'
                ? 'bg-orange-600 text-white shadow-md'
                : darkMode
                ? 'text-slate-400 hover:bg-slate-800'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>👨‍🍳</span>
            <span>{isBn ? 'কুকবুক' : 'Cookbook'}</span>
          </button>

          <button
            onClick={() => {
              setAppState('dashboard');
              setCurrentView('checklist');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              currentView === 'checklist'
                ? 'bg-rose-600 text-white shadow-md'
                : darkMode
                ? 'text-slate-400 hover:bg-slate-800'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>📝</span>
            <span>{isBn ? 'ডেইলি চেক লিস্ট' : 'Daily Checklist'}</span>
          </button>

          <button
            onClick={() => {
              setAppState('dashboard');
              setCurrentView('family_pot');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              currentView === 'family_pot'
                ? 'bg-purple-600 text-white shadow-md'
                : darkMode
                ? 'text-slate-400 hover:bg-slate-800'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>🍲</span>
            <span>{isBn ? 'ফ্যামিলি পট' : 'Family Pot'}</span>
          </button>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (currentView === 'home') {
      return (
        <HomeGrid
          onNavigate={handleNavigation}
          lang={lang}
          darkMode={darkMode}
          user={user}
          profile={profile}
        />
      );
    }

    if (currentView === 'diet_maker') {
      return (
        <DietMakerHub
          user={user}
          profile={profile}
          lang={lang}
          darkMode={darkMode}
          onSelectFeature={(feature) => {
            setAppState('dashboard');
            if (profile && !currentChart) {
              fetchChart(profile, currentPhase);
            }
            setCurrentView(feature);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onStartProfileAndAssessment={(targetFeature, role) => {
            setPendingDietMakerTarget(targetFeature);
            setPreferredRole(role || null);
            setCurrentView('assessment_gate');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      );
    }

    if (currentView === 'assessment_gate') {
      return (
        <div className="max-w-4xl mx-auto animate-in fade-in">
          <AssessmentStep
            user={user}
            initialRole={preferredRole}
            onComplete={handleAssessmentComplete}
            onLoginAsDoctor={handleLogin}
            onSelfLogin={(u) => setUser({ ...u, badges: INITIAL_BADGES })}
            lang={lang}
            darkMode={darkMode}
            onCancel={() => setCurrentView('diet_maker')}
          />
        </div>
      );
    }

    // Publicly accessible views (No profile required)
    if (currentView === 'leaderboard') {
      return <Leaderboard lang={lang} darkMode={darkMode} />;
    }

    if (currentView === 'food_recognition') {
      return <FoodRecognitionView profile={profile} lang={lang} darkMode={darkMode} />;
    }

    if (currentView === 'marketplace') {
      return (
        <EcommerceView
          user={user}
          profile={profile}
          lang={lang}
          darkMode={darkMode}
          onUpdateUser={setUser}
        />
      );
    }

    if (currentView === 'calculator') {
      return <HealthCalculator lang={lang} darkMode={darkMode} />;
    }

    if (currentView === 'community') {
      const safeProfile = profile || {
        dosha: 'Guest',
        age: 0,
        gender: 'N/A',
        weight: 0,
        height: 0,
        microbiomeScore: 50,
        inflammatoryIndex: 5,
        metabolicType: 'Normal',
        alkalineBalance: 'Neutral',
        psychologicalProfile: 'Neutral',
        medications: '',
        dietHistory: '',
        answers: {},
        analysis: null,
      };
      return <CommunityHub profile={safeProfile} currentPhase={currentPhase} lang={lang} darkMode={darkMode} />;
    }

    if (currentView === 'messages') {
      const safeProfile = profile || {
        dosha: 'Guest',
        age: 0,
        gender: 'N/A',
        weight: 0,
        height: 0,
        microbiomeScore: 50,
        inflammatoryIndex: 5,
        metabolicType: 'Normal',
        alkalineBalance: 'Neutral',
        psychologicalProfile: 'Neutral',
        medications: '',
        dietHistory: '',
        answers: {},
        analysis: null,
      };
      return <MessagesView profile={safeProfile} currentPhase={currentPhase} lang={lang} darkMode={darkMode} />;
    }

    if (currentView === 'login') {
      return <LoginScreen onLogin={handleLogin} lang={lang} darkMode={darkMode} />;
    }

    if (!profile && !user?.id?.startsWith('DOC-')) {
      return (
        <AssessmentStep
          user={user}
          initialRole={preferredRole}
          onComplete={handleAssessmentComplete}
          onLoginAsDoctor={handleLogin}
          onSelfLogin={(u) => setUser({ ...u, badges: INITIAL_BADGES })}
          lang={lang}
          darkMode={darkMode}
        />
      );
    }

    if (appState === 'analysis' && profile && currentView === 'diet') {
      return (
        <div className="space-y-4">
          {renderDietMakerSubNav()}
          <AnalysisReport
            profile={profile}
            lang={lang}
            darkMode={darkMode}
            initialStep={analysisStep}
            onProceed={(customizedProfile) => {
              const finalProfile = customizedProfile || profile;
              setProfile(finalProfile);
              setCurrentChart(null);
              setAppState('dashboard');
              const target = pendingDietMakerTarget || 'diet';
              setCurrentView(target);
              setPendingDietMakerTarget(null);
              fetchChart(finalProfile, currentPhase);
            }}
          />
        </div>
      );
    }

    if (appState === 'dashboard' || profile || user?.id?.startsWith('DOC-')) {
      return (
        <div className="animate-in fade-in duration-500">
          {renderDietMakerSubNav()}

          {currentView === 'profile' && user && profile && (
            <ProfileView
              user={user}
              profile={profile}
              currentPhase={currentPhase}
              lang={lang}
              darkMode={darkMode}
              onNavigateToDiet={() => handleNavigation('diet')}
              onNavigateToDietMaker={() => handleNavigation('diet_maker')}
              onNavigateToFamilyPot={() => handleNavigation('family_pot')}
              onNavigateToDashboard={() => setShowDoctorDashboard(true)}
              onUpdateUser={setUser}
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
              onShowPaywall={() => {
                setBlockedFeature(t.diet_chart);
                setShowPaywall(true);
              }}
              onUpdateProfile={setProfile}
              initialChart={currentChart}
              onOpenTrafficLightGuide={() => {
                setAnalysisStep('traffic_light');
                setAppState('analysis');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}

          {currentView === 'checklist' && profile && (
            <div className="max-w-4xl mx-auto space-y-6">
              <ProgressTracker
                profile={profile}
                chart={currentChart}
                lang={lang}
                darkMode={darkMode}
                onUpdate={(updated) => {
                  const existingHistory = profile.adherenceHistory || [];
                  const today = new Date().toISOString().split('T')[0];
                  const existingIndex = existingHistory.findIndex((h) => h.date === today);

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

          {currentView === 'family_pot' && profile && (
            <FamilyPotView profile={profile} currentPhase={currentPhase} lang={lang} darkMode={darkMode} />
          )}
          {currentView === 'cookbook' && profile && (
            <VoiceCookbookView profile={profile} lang={lang} darkMode={darkMode} currentChart={currentChart} />
          )}
          {currentView === 'dinacharya' && profile && (
            <DinacharyaView profile={profile} lang={lang} darkMode={darkMode} />
          )}
          {currentView === 'ar_guide' && <ARPortionGuideView lang={lang} darkMode={darkMode} />}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-300 ${
        darkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#fdfdfd] text-slate-900'
      }`}
    >
      {showPaywall && (
        <PaywallModal
          lang={lang}
          darkMode={darkMode}
          featureName={blockedFeature}
          onClose={() => setShowPaywall(false)}
          onSubscribe={handleSubscribe}
        />
      )}
      {showSOS && (
        <SOSModal
          lang={lang}
          onDismiss={() => setShowSOS(false)}
          emergencyContact={profile?.emergencyContact}
        />
      )}
      {showDoctorDashboard && user && (
        <DoctorDashboard
          user={user}
          profile={profile || ({} as HealthProfile)}
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
              <button
                onClick={() => {
                  setShowReminder(false);
                  handleNavigation('checklist');
                }}
                className="px-6 py-2 bg-white text-blue-600 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg"
              >
                Complete Now
              </button>
              <button
                onClick={() => setShowReminder(false)}
                className="px-4 py-2 bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Navigation Bar */}
      <nav
        className={`sticky top-0 z-50 border-b py-2.5 px-3 md:px-8 backdrop-blur-md transition-colors duration-300 ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-100'
        }`}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-2 md:gap-4">
          <div className="flex items-center gap-2.5">
            {currentView !== 'home' && (
              <button
                onClick={handleBack}
                className={`p-2 rounded-xl transition-all hover:scale-105 active:scale-95 ${
                  darkMode
                    ? 'bg-slate-800 text-slate-300 hover:text-white'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
                aria-label="Back"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
            )}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('home')}>
              <div
                className={`w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center font-bold text-base md:text-lg serif italic shadow-md ${
                  darkMode ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-white'
                }`}
              >
                {profile ? profile.dosha[0] : 'P'}
              </div>
              <span
                className={`text-base md:text-lg font-bold tracking-tight serif italic ${
                  darkMode ? 'text-white' : 'text-slate-800'
                }`}
              >
                Precision Nutrition
              </span>
            </div>
          </div>

          {/* Desktop Horizontal Navigation Links */}
          <div className="hidden lg:flex items-center gap-5 text-xs font-bold">
            <button
              onClick={() => handleNavigation('home')}
              className={`py-1 border-b-2 transition-colors ${
                currentView === 'home'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              {isBn ? 'হোম' : 'Home'}
            </button>
            <button
              onClick={() => handleNavigation('diet_maker')}
              className={`py-1 border-b-2 transition-colors ${
                ['diet_maker', 'diet', 'cookbook', 'checklist', 'family_pot'].includes(currentView)
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              🍱 {isBn ? 'ডায়েট মেকার' : 'Diet Maker'}
            </button>
            <button
              onClick={() => handleNavigation('leaderboard')}
              className={`py-1 border-b-2 transition-colors ${
                currentView === 'leaderboard'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              🏆 {isBn ? 'লিডারবোর্ড' : 'Leaderboard'}
            </button>
            <button
              onClick={() => handleNavigation('calculator')}
              className={`py-1 border-b-2 transition-colors ${
                currentView === 'calculator'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              {t.nav_calculator}
            </button>
            <button
              onClick={() => handleNavigation('food_recognition')}
              className={`py-1 border-b-2 transition-colors ${
                currentView === 'food_recognition'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              {t.nav_food_rec}
            </button>
            <button
              onClick={() => handleNavigation('profile')}
              className={`py-1 border-b-2 transition-colors ${
                currentView === 'profile'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              👤 {isBn ? 'প্রোফাইল' : 'Profile'}
            </button>
          </div>

          <div className="flex items-center gap-1.5 md:gap-3">
            {user && (
              <div className="hidden sm:flex flex-col items-end mr-1">
                <span className="text-[9px] font-bold text-amber-500 tabular-nums">{user.points} Credits</span>
                <span className="text-[10px] font-semibold opacity-70">
                  {user.profileType === 'doctor' || user.id?.startsWith('DOC-')
                    ? isBn
                      ? 'ডাক্তার'
                      : 'Doctor'
                    : user.profileType === 'family'
                    ? isBn
                      ? 'ফ্যামিলি'
                      : 'Family'
                    : isBn
                    ? 'পার্সোনাল'
                    : 'Personal'}
                </span>
              </div>
            )}
            <button
              onClick={() => setShowSOS(true)}
              className="bg-red-600 hover:bg-red-500 text-white px-2.5 md:px-4 py-1.5 rounded-xl font-bold text-[10px] md:text-xs transition-all active:scale-95 whitespace-nowrap"
            >
              {t.sos_button}
            </button>
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <button
                  onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                  className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border ${
                    darkMode
                      ? 'bg-slate-800 border-slate-700 text-emerald-400'
                      : 'bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  <span className="text-sm">🌐</span>
                  <span className="hidden sm:inline uppercase text-[10px]">{lang}</span>
                </button>
                {showLanguageMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowLanguageMenu(false)} />
                    <div
                      className={`absolute top-full mt-2 right-0 z-20 w-40 rounded-xl shadow-2xl border overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${
                        darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
                      }`}
                    >
                      {languages.map((l) => (
                        <button
                          key={l.code}
                          onClick={() => {
                            setLang(l.code);
                            setShowLanguageMenu(false);
                          }}
                          className={`w-full px-4 py-3 text-left flex justify-between items-center transition-colors border-b last:border-0 ${
                            darkMode ? 'border-slate-700 hover:bg-slate-700' : 'border-slate-50 hover:bg-slate-50'
                          } ${lang === l.code ? (darkMode ? 'bg-slate-700/50' : 'bg-slate-50') : ''}`}
                        >
                          <span className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {l.native}
                          </span>
                          {lang === l.code && <span className="text-emerald-500 font-bold">✓</span>}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-xl transition-all border ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-yellow-400'
                    : 'bg-white border-slate-200 text-slate-600 shadow-sm'
                }`}
              >
                {darkMode ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="3" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                )}
              </button>
            </div>
            {user && (
              <button
                onClick={() => {
                  setProfile(null);
                  setUser(null);
                  setAppState('onboarding');
                  setCurrentView('home');
                  setShowDoctorDashboard(false);
                }}
                className={`p-2 md:px-3 md:py-1.5 text-xs font-bold rounded-xl transition-colors border ${
                  darkMode
                    ? 'text-red-400 hover:bg-red-950/30 border-red-900/50'
                    : 'text-red-600 hover:bg-red-50 border-red-100'
                }`}
              >
                <span className="hidden md:inline">{isBn ? 'লগআউট' : 'Logout'}</span>
                <span className="md:hidden">🚪</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Container */}
      <main className="flex-1 py-4 md:py-8 px-3 md:px-8 max-w-7xl mx-auto w-full pb-24 lg:pb-12">
        {renderContent()}
      </main>

      {/* Mobile App Bottom Navigation Dock */}
      {currentView !== 'login' && (
        <div
          className={`lg:hidden fixed bottom-0 inset-x-0 z-[60] border-t backdrop-blur-xl py-2 px-3 transition-colors duration-300 ${
            darkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200 shadow-lg'
          }`}
        >
          <div className="max-w-md mx-auto flex justify-between items-center gap-1">
            <NavItem
              view="home"
              label={isBn ? 'হোম' : 'Home'}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              }
            />
            <NavItem
              view="diet_maker"
              label={isBn ? 'ডায়েট মেকার' : 'Diet Maker'}
              icon={<span className="text-base leading-none">🍱</span>}
            />
            <NavItem
              view="leaderboard"
              label={isBn ? 'লিডারবোর্ড' : 'Leaders'}
              icon={<span className="text-base leading-none">🏆</span>}
            />
            <NavItem
              view="calculator"
              label={isBn ? 'ক্যালকুলেটর' : 'Calc'}
              icon={<span className="text-base leading-none">🧮</span>}
            />
            <NavItem
              view="profile"
              label={isBn ? 'প্রোফাইল' : t.nav_profile}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              }
            />
          </div>
        </div>
      )}

      {/* Desktop Footer */}
      <footer
        className={`hidden md:block py-10 transition-colors duration-300 ${
          darkMode ? 'bg-slate-900 text-slate-400' : 'bg-slate-900 text-slate-500'
        }`}
      >
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
          <div className="space-y-2">
            <h4 className="text-white font-bold text-base serif italic">Precision Nutrition Science</h4>
            <p className="leading-relaxed">Clinical-grade biological mapping for sustainable health.</p>
          </div>
          <div className="space-y-2">
            <h4 className="text-white font-bold text-base">Legal</h4>
            <p className="leading-relaxed italic">
              Consult a medical professional. This clinical nutrition tool supports personalized dietary planning.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
