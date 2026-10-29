import React, { useState, useEffect } from 'react';
import {
  Home,
  Flame,
  BarChart3,
  UserCircle2,
  UtensilsCrossed,
  ChefHat,
  ClipboardCheck,
  Soup,
  Globe,
  Sun,
  Moon,
  LogOut,
  ChevronLeft,
  Bot,
  ShieldCheck,
  Stethoscope,
  Crown,
  Lock,
} from 'lucide-react';
import AssessmentStep from './components/AssessmentStep';
import AnalysisReport from './components/AnalysisReport';
import ProfileView from './components/ProfileView';
import DietView, { DietSubTab } from './components/DietView';
import FamilyPotView from './components/FamilyPotView';
import ARPortionGuideView from './components/ARPortionGuideView';
import CommunityHub from './components/CommunityHub';
import MessagesView from './components/MessagesView';
import IndividualizedChatbot from './components/IndividualizedChatbot';
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
import CalorieTrackerView from './components/CalorieTrackerView';
import WeeklyAnalyticsView from './components/WeeklyAnalyticsView';
import NutritionistHubView from './components/NutritionistHubView';
import AdminPanelView from './components/AdminPanelView';
import SecurityPrivacySeoModal from './components/SecurityPrivacySeoModal';
import {
  auth,
  onAuthStateChanged,
  isAdminEmail,
  signOutGoogleAccount,
  testFirestoreConnection,
} from './firebase';
import {
  HealthProfile,
  Language,
  Phase,
  User,
  Badge,
  DietPhaseChart,
  ProfileRoleType,
  DailyCalorieLog,
} from './types';
import { translations } from './i18n';
import { GeminiService } from './services/geminiService';
import {
  applyDynamicRegionalSeo,
  encryptHealthProfileToVault,
  loadEncryptedHealthProfileFromVault,
  loadPrivacySettings,
  savePrivacySettings,
  REGIONAL_SEO_CONFIGS,
  SupportedRegionCode,
} from './services/securityPrivacyService';

type View =
  | 'home'
  | 'diet_maker'
  | 'calorie_tracker'
  | 'analytics'
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
  | 'marketplace'
  | 'nutritionist_hub'
  | 'admin_panel';

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

const buildInitialWeeklyLogs = (): DailyCalorieLog[] => {
  const dayNamesBn = ['শনিবার', 'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'আজ'];
  const dayNamesEn = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Today'];
  const today = new Date();

  const presets = [
    { cals: 1580, prot: 64, carbs: 152, fats: 52, water: 8 },
    { cals: 1640, prot: 68, carbs: 160, fats: 54, water: 9 },
    { cals: 1490, prot: 58, carbs: 145, fats: 49, water: 7 },
    { cals: 1660, prot: 70, carbs: 158, fats: 55, water: 8 },
    { cals: 1610, prot: 66, carbs: 155, fats: 53, water: 8 },
    { cals: 1550, prot: 62, carbs: 148, fats: 51, water: 9 },
  ];

  const logs: DailyCalorieLog[] = presets.map((p, idx) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - idx));
    const dateStr = d.toISOString().split('T')[0];
    return {
      date: dateStr,
      dayLabelBn: dayNamesBn[idx],
      dayLabelEn: dayNamesEn[idx],
      targetCalories: 1650,
      targetProtein: 65,
      targetCarbs: 165,
      targetFats: 55,
      waterGlasses: p.water,
      items: [
        {
          id: `seed-${idx}-1`,
          slot: 'morning',
          nameBn: 'সিদ্ধ ডিম (২টি), লাল আটার রুটি ও সবজি',
          nameEn: 'Boiled Eggs (2), Whole Wheat Roti & Greens',
          portion: '১ প্লেট (২৫০ গ্রাম)',
          grams: 250,
          calories: Math.round(p.cals * 0.28),
          protein: Math.round(p.prot * 0.3),
          carbs: Math.round(p.carbs * 0.28),
          fats: Math.round(p.fats * 0.3),
          fiber: 6,
          matchedChartMeal: true,
          timestamp: '08:30 AM',
        },
        {
          id: `seed-${idx}-2`,
          slot: 'midDay',
          nameBn: 'লাল চালের ভাত, দেশি মাছের ঝোল, ডাল ও শাক ভাজি',
          nameEn: 'Red Rice, Bengali Fish Curry, Lentils & Greens',
          portion: '১ মিল (৩৮০ গ্রাম)',
          grams: 380,
          calories: Math.round(p.cals * 0.38),
          protein: Math.round(p.prot * 0.4),
          carbs: Math.round(p.carbs * 0.42),
          fats: Math.round(p.fats * 0.35),
          fiber: 8,
          matchedChartMeal: true,
          timestamp: '01:30 PM',
        },
        {
          id: `seed-${idx}-3`,
          slot: 'afternoon',
          nameBn: 'ভেজানো চিয়া সিড, কাঠবাদাম ও পেয়ারা',
          nameEn: 'Soaked Chia Seeds, Almonds & Guava',
          portion: '১ কাপ (১৫০ গ্রাম)',
          grams: 150,
          calories: Math.round(p.cals * 0.12),
          protein: Math.round(p.prot * 0.1),
          carbs: Math.round(p.carbs * 0.12),
          fats: Math.round(p.fats * 0.15),
          fiber: 5,
          matchedChartMeal: true,
          timestamp: '05:00 PM',
        },
        {
          id: `seed-${idx}-4`,
          slot: 'evening',
          nameBn: 'গ্রিলড চিকেন/মাছ ও মিক্সড সবজি স্যুপ',
          nameEn: 'Grilled Chicken/Fish & Mixed Vegetable Soup',
          portion: '১ বড় বাটি (২৮০ গ্রাম)',
          grams: 280,
          calories: Math.round(p.cals * 0.22),
          protein: Math.round(p.prot * 0.2),
          carbs: Math.round(p.carbs * 0.18),
          fats: Math.round(p.fats * 0.2),
          fiber: 6,
          matchedChartMeal: true,
          timestamp: '08:00 PM',
        },
      ],
    };
  });

  // Today's initial log (interactive)
  const todayStr = today.toISOString().split('T')[0];
  logs.push({
    date: todayStr,
    dayLabelBn: 'আজ',
    dayLabelEn: 'Today',
    targetCalories: 1650,
    targetProtein: 65,
    targetCarbs: 165,
    targetFats: 55,
    waterGlasses: 6,
    items: [
      {
        id: 'today-1',
        slot: 'morning',
        nameBn: 'সিদ্ধ ডিম (২টি) ও মিক্সড সবজি ভাজি',
        nameEn: 'Boiled Eggs (2 pcs) & Sautéed Mixed Greens',
        portion: '২৫০ গ্রাম',
        grams: 250,
        calories: 265,
        protein: 16.5,
        carbs: 15,
        fats: 15.5,
        fiber: 5.2,
        matchedChartMeal: true,
        timestamp: '08:45 AM',
      },
      {
        id: 'today-2',
        slot: 'midDay',
        nameBn: 'লাল চালের ভাত, দেশি মাছের ঝোল ও মুগ ডাল',
        nameEn: 'Red Rice, Bengali Fish Curry & Moong Dal',
        portion: '৩৮০ গ্রাম',
        grams: 380,
        calories: 490,
        protein: 36,
        carbs: 51,
        fats: 15,
        fiber: 7.4,
        matchedChartMeal: true,
        timestamp: '01:40 PM',
      },
    ],
  });

  return logs;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<HealthProfile | null>(() => loadEncryptedHealthProfileFromVault());
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
  const [initialDietSubTab, setInitialDietSubTab] = useState<DietSubTab>('meals');
  const [showSecuritySeoModal, setShowSecuritySeoModal] = useState(false);
  const [securitySeoTab, setSecuritySeoTab] = useState<'privacy' | 'vault' | 'seo'>('privacy');
  const [activeRegion, setActiveRegion] = useState<SupportedRegionCode>(() => loadPrivacySettings().selectedRegion);

  // Shared Daily Calorie Logs for CalorieTrackerView and WeeklyAnalyticsView
  const [dailyCalorieLogs, setDailyCalorieLogs] = useState<DailyCalorieLog[]>(() => buildInitialWeeklyLogs());

  const isAuthenticatedAdmin = Boolean(
    user?.isAdmin && user?.firebaseUid && isAdminEmail(user?.email)
  );

  useEffect(() => {
    testFirestoreConnection();
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser && fbUser.email) {
        const adminMatched = isAdminEmail(fbUser.email);
        setUser((prev) => {
          if (prev) {
            return {
              ...prev,
              email: fbUser.email || prev.email,
              name: prev.name || fbUser.displayName || 'Google User',
              photoUrl: fbUser.photoURL || prev.photoUrl,
              avatar: fbUser.photoURL || prev.avatar,
              firebaseUid: fbUser.uid,
              isAdmin: adminMatched,
              isPro: adminMatched ? true : prev.isPro,
            };
          }
          return {
            id: `G-${fbUser.uid.slice(0, 8)}`,
            name: fbUser.displayName || fbUser.email.split('@')[0],
            email: fbUser.email,
            photoUrl: fbUser.photoURL || undefined,
            avatar: fbUser.photoURL || undefined,
            firebaseUid: fbUser.uid,
            isAdmin: adminMatched,
            isPro: adminMatched,
            isSubscribed: adminMatched,
            points: 150,
            streak: 1,
            badges: INITIAL_BADGES,
            profileType: 'self',
          };
        });
      } else {
        setUser((prev) =>
          prev
            ? {
                ...prev,
                firebaseUid: undefined,
                isAdmin: false,
              }
            : null
        );
      }
    });
    return () => unsub();
  }, []);

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

  // Encrypt profile into client-side Health Vault whenever it updates
  useEffect(() => {
    if (profile) {
      encryptHealthProfileToVault(profile);
    }
  }, [profile]);

  // Synchronize Multi-Region SEO (USA, UK, India, Australia, Spain, Bangladesh) on URL/view/region change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlRegion = params.get('region')?.toUpperCase();
      const mappedRegion: SupportedRegionCode | null =
        urlRegion === 'UK'
          ? 'GB'
          : urlRegion && ['US', 'GB', 'IN', 'AU', 'ES', 'BD'].includes(urlRegion)
          ? (urlRegion as SupportedRegionCode)
          : null;
      if (mappedRegion && mappedRegion !== activeRegion) {
        const currentSettings = loadPrivacySettings();
        savePrivacySettings({ ...currentSettings, selectedRegion: mappedRegion });
        setActiveRegion(mappedRegion);
        applyDynamicRegionalSeo(mappedRegion, currentView);
        return;
      }
    }
    applyDynamicRegionalSeo(activeRegion, currentView);
  }, [activeRegion, currentView]);

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

  const handleUpdateTodayCalorieLog = (updatedToday: DailyCalorieLog) => {
    setDailyCalorieLogs((prev) => {
      if (prev.length === 0) return [updatedToday];
      const next = [...prev];
      next[next.length - 1] = updatedToday;
      return next;
    });
  };

  const handleNavigation = (view: View) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Strict Admin Panel Guard: Only accessible when logged in with Admin's Google Mail in User Profile
    if (view === 'admin_panel') {
      if (isAuthenticatedAdmin) {
        setCurrentView('admin_panel');
      } else {
        setCurrentView('profile');
      }
      return;
    }

    // 1. Public views accessible WITH OR WITHOUT a profile or Pro subscription:
    // Home, Profile (allows direct Google Mail login in User Profile), Calorie Tracker, Weekly Analytics, Diet Maker Hub, Leaderboard, Calculator, Food Glossary, Marketplace, Community, Messages
    const publicViews: View[] = [
      'home',
      'profile',
      'calorie_tracker',
      'analytics',
      'diet_maker',
      'leaderboard',
      'calculator',
      'food_recognition',
      'marketplace',
      'community',
      'messages',
      'assessment_gate',
      'login',
      'nutritionist_hub',
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

  const FooterDockItem = ({
    view,
    label,
    icon: Icon,
    activeGradient,
  }: {
    view: View;
    label: string;
    icon: React.ElementType;
    activeGradient: string;
  }) => {
    const isActive = currentView === view;
    return (
      <button
        onClick={() => handleNavigation(view)}
        className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl transition-all ${
          isActive
            ? `bg-gradient-to-r ${activeGradient} text-white shadow-lg scale-[1.02]`
            : darkMode
            ? 'text-slate-400 hover:text-white hover:bg-slate-800/70'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
        }`}
      >
        <Icon className="w-5 h-5 shrink-0" strokeWidth={2.3} />
        <span className="text-[11px] sm:text-xs font-extrabold tracking-tight whitespace-nowrap">{label}</span>
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
          <ChevronLeft className="w-4 h-4" />
          <span>{isBn ? 'ডায়েট মেকার হাব' : 'Diet Maker Hub'}</span>
        </button>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => {
              setAnalysisStep('traffic_light');
              setAppState('analysis');
              setCurrentView('diet');
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              currentView === 'diet' && appState === 'analysis'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
                : darkMode
                ? 'text-slate-400 hover:bg-slate-800'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>🚦</span>
            <span>{isBn ? 'ফুড গাইড' : 'Food Guide'}</span>
          </button>

          <button
            onClick={() => {
              setInitialDietSubTab('meals');
              setAppState('dashboard');
              setCurrentView('diet');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              currentView === 'diet' && appState === 'dashboard' && initialDietSubTab === 'meals'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                : darkMode
                ? 'text-slate-400 hover:bg-slate-800'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>{isBn ? 'ডায়েট চার্ট' : 'Diet Chart'}</span>
          </button>

          <button
            onClick={() => {
              setInitialDietSubTab('supplements');
              setAppState('dashboard');
              setCurrentView('diet');
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              currentView === 'diet' && appState === 'dashboard' && initialDietSubTab === 'supplements'
                ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-md'
                : darkMode
                ? 'text-slate-400 hover:bg-slate-800'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>💊</span>
            <span>{isBn ? 'সাপ্লিমেন্ট' : 'Supplements'}</span>
          </button>

          <button
            onClick={() => {
              setInitialDietSubTab('exercise');
              setAppState('dashboard');
              setCurrentView('diet');
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              currentView === 'diet' && appState === 'dashboard' && initialDietSubTab === 'exercise'
                ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-md'
                : darkMode
                ? 'text-slate-400 hover:bg-slate-800'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>🏃</span>
            <span>{isBn ? 'এক্সারসাইজ' : 'Exercise'}</span>
          </button>

          <button
            onClick={() => {
              setAppState('dashboard');
              setCurrentView('cookbook');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              currentView === 'cookbook'
                ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md'
                : darkMode
                ? 'text-slate-400 hover:bg-slate-800'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span>{isBn ? 'কুকবুক' : 'Cookbook'}</span>
          </button>

          <button
            onClick={() => {
              setAppState('dashboard');
              setCurrentView('checklist');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              currentView === 'checklist'
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md'
                : darkMode
                ? 'text-slate-400 hover:bg-slate-800'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>{isBn ? 'ডেইলি চেক লিস্ট' : 'Daily Checklist'}</span>
          </button>

          <button
            onClick={() => {
              setAppState('dashboard');
              setCurrentView('family_pot');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              currentView === 'family_pot'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md'
                : darkMode
                ? 'text-slate-400 hover:bg-slate-800'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Soup className="w-3.5 h-3.5" />
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

    if (currentView === 'calorie_tracker') {
      return (
        <CalorieTrackerView
          user={user}
          profile={profile}
          currentChart={currentChart}
          lang={lang}
          darkMode={darkMode}
          dailyLogs={dailyCalorieLogs}
          onUpdateTodayLog={handleUpdateTodayCalorieLog}
          onNavigateToAnalytics={() => handleNavigation('analytics')}
          onNavigateToDietMaker={() => handleNavigation('diet_maker')}
        />
      );
    }

    if (currentView === 'analytics') {
      return (
        <WeeklyAnalyticsView
          user={user}
          profile={profile}
          currentChart={currentChart}
          lang={lang}
          darkMode={darkMode}
          dailyLogs={dailyCalorieLogs}
          onNavigateToTracker={() => handleNavigation('calorie_tracker')}
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
      return (
        <FoodRecognitionView
          profile={profile}
          lang={lang}
          darkMode={darkMode}
          onUpdateProfile={setProfile}
        />
      );
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

    if (currentView === 'nutritionist_hub') {
      return <NutritionistHubView user={user} lang={lang} darkMode={darkMode} />;
    }

    if (currentView === 'profile') {
      const effectiveUser: User = user || {
        id: 'USR-GUEST',
        name: isBn ? 'ইউজার প্রোফাইল' : 'User Profile',
        email: '',
        isPro: false,
        isAdmin: false,
        profileType: 'self',
        points: 100,
        badges: INITIAL_BADGES,
      };
      const effectiveProfile: HealthProfile = profile || {
        dosha: 'Pitta-Kapha',
        age: 32,
        gender: 'Male',
        weight: 66,
        height: 168,
        microbiomeScore: 76,
        inflammatoryIndex: 3,
        metabolicType: 'Balanced',
        alkalineBalance: 'Optimal',
        psychologicalProfile: 'Calm/Steady',
        medications: 'None',
        dietHistory: 'Bengali Whole Foods',
        medicalConditions: isBn ? 'সাধারণ মেটাবলিক ও গাট হেলথ' : 'General Metabolic & Gut Wellness',
        cohortType: 'adult_metabolic',
        mealFrequency: 3,
        dinnerCarbRule: 'vegetable_carbs',
        unlockedPhases: [Phase.DETOX],
        answers: {},
        analysis: null,
      };
      return (
        <ProfileView
          user={effectiveUser}
          profile={effectiveProfile}
          currentPhase={currentPhase}
          lang={lang}
          darkMode={darkMode}
          onNavigateToDiet={() => handleNavigation('diet')}
          onNavigateToDietMaker={() => handleNavigation('diet_maker')}
          onNavigateToFamilyPot={() => handleNavigation('family_pot')}
          onNavigateToDashboard={() => setShowDoctorDashboard(true)}
          onUpdateUser={setUser}
          onUpdateProfile={setProfile}
          onOpenPaywall={() => setShowPaywall(true)}
          onNavigateToAdmin={() => handleNavigation('admin_panel')}
          onNavigateToNutritionistHub={() => handleNavigation('nutritionist_hub')}
        />
      );
    }

    if (currentView === 'admin_panel') {
      return <AdminPanelView user={user} lang={lang} darkMode={darkMode} onUserUpdated={setUser} />;
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
      return <CommunityHub profile={safeProfile} currentPhase={currentPhase} lang={lang} darkMode={darkMode} user={user} />;
    }

    if (currentView === 'messages') {
      const safeProfile: HealthProfile = profile || {
        dosha: 'Pitta-Kapha',
        age: 32,
        gender: 'Female',
        weight: 64,
        height: 162,
        microbiomeScore: 74,
        inflammatoryIndex: 4,
        metabolicType: 'Moderate',
        alkalineBalance: 'Neutral',
        psychologicalProfile: 'Balanced',
        medications: 'None',
        dietHistory: 'Mixed Bengali Diet',
        medicalConditions: isBn ? 'সাধারণ মেটাবলিক ও গাট হেলথ' : 'General Metabolic & Gut Wellness',
        cohortType: 'adult_metabolic',
        mealFrequency: 3,
        dinnerCarbRule: 'vegetable_carbs',
        answers: {},
        analysis: null,
      };
      const todayLog =
        dailyCalorieLogs.length > 0 ? dailyCalorieLogs[dailyCalorieLogs.length - 1] : null;
      return (
        <MessagesView
          profile={safeProfile}
          currentPhase={currentPhase}
          lang={lang}
          darkMode={darkMode}
          currentChart={currentChart}
          todayLog={todayLog}
          hasRealProfile={Boolean(profile)}
          onStartAssessment={() => setCurrentView('assessment_gate')}
        />
      );
    }

    if (currentView === 'login') {
      return <LoginScreen onLogin={handleLogin} lang={lang} darkMode={darkMode} />;
    }

    if (currentView === 'family_pot') {
      return (
        <div className="animate-in fade-in duration-500">
          {renderDietMakerSubNav()}
          <FamilyPotView
            profile={profile}
            currentPhase={currentPhase}
            lang={lang}
            darkMode={darkMode}
            user={user}
            onSwitchToFamilyProfile={() => {
              if (user && profile) {
                setUser({
                  ...user,
                  profileType: 'family',
                  isFamilyManager: true,
                });
              } else {
                setPendingDietMakerTarget('family_pot');
                setPreferredRole('family');
                setCurrentView('assessment_gate');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
          />
        </div>
      );
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
            user={user}
            onShowPaywall={() => setShowPaywall(true)}
            onProceed={(customizedProfile, targetSubTab) => {
              const finalProfile = customizedProfile || profile;
              setProfile(finalProfile);
              setInitialDietSubTab(targetSubTab || 'meals');
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
              onUpdateProfile={setProfile}
              onOpenPaywall={() => setShowPaywall(true)}
              onNavigateToAdmin={() => handleNavigation('admin_panel')}
              onNavigateToNutritionistHub={() => handleNavigation('nutritionist_hub')}
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
              initialSubTab={initialDietSubTab}
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
        darkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#f8fafc] text-slate-900'
      }`}
    >
      {showPaywall && (
        <PaywallModal
          lang={lang}
          darkMode={darkMode}
          featureName={blockedFeature}
          onClose={() => setShowPaywall(false)}
          onSubscribe={handleSubscribe}
          user={user}
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
      <SecurityPrivacySeoModal
        isOpen={showSecuritySeoModal}
        onClose={() => {
          setShowSecuritySeoModal(false);
          setActiveRegion(loadPrivacySettings().selectedRegion);
        }}
        lang={lang}
        darkMode={darkMode}
        user={user}
        profile={profile}
        currentView={currentView}
        onSelectLanguage={(newLang) => setLang(newLang)}
        onEraseProfileData={() => {
          setProfile(null);
          setCurrentChart(null);
          setAppState('onboarding');
        }}
        initialTab={securitySeoTab}
      />

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
        className={`sticky top-0 z-50 border-b py-2.5 px-3 md:px-8 backdrop-blur-xl transition-colors duration-300 ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200/70 shadow-sm'
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
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setCurrentView('home')}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white flex items-center justify-center font-extrabold text-base shadow-md shadow-emerald-500/20">
                {profile ? profile.dosha[0] : 'P'}
              </div>
              <span
                className={`text-base md:text-lg font-extrabold tracking-tight ${
                  darkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                Precision Nutrition
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 md:gap-3">
            {user && (
              <div className="hidden sm:flex flex-col items-end mr-1">
                <span className="text-[10px] font-extrabold text-amber-500 tabular-nums">{user.points} Credits</span>
                <span className="text-[10px] font-bold opacity-70">
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
              onClick={() => handleNavigation('nutritionist_hub')}
              className={`hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl font-extrabold text-[11px] transition-all border ${
                currentView === 'nutritionist_hub'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20'
                  : darkMode
                  ? 'bg-slate-800 border-slate-700 text-emerald-400 hover:bg-slate-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>{isBn ? 'পুষ্টিবিদ হাব' : 'Nutritionist Hub'}</span>
            </button>
            <button
              onClick={() => setShowPaywall(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl font-extrabold text-[11px] bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-md shadow-amber-500/20 transition-all"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>{user?.isSubscribed ? (isBn ? 'প্রিমিয়াম' : 'Premium') : isBn ? 'সাবস্ক্রিপশন' : 'Upgrade'}</span>
            </button>
            {isAuthenticatedAdmin && (
              <button
                onClick={() => handleNavigation('admin_panel')}
                className={`flex items-center gap-1.5 px-2.5 md:px-3 py-2 rounded-xl font-extrabold text-[10px] md:text-[11px] transition-all border ${
                  currentView === 'admin_panel'
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                    : darkMode
                    ? 'bg-slate-800 border-slate-700 text-indigo-400 hover:bg-slate-700'
                    : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isBn ? 'অ্যাডমিন' : 'Admin'}</span>
              </button>
            )}
            <button
              onClick={() => {
                setSecuritySeoTab('privacy');
                setShowSecuritySeoModal(true);
              }}
              className={`flex items-center gap-1.5 px-2.5 md:px-3 py-2 rounded-xl font-extrabold text-[10px] md:text-[11px] transition-all border ${
                darkMode
                  ? 'bg-emerald-950/60 border-emerald-700/70 text-emerald-300 hover:bg-emerald-900/70'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
              }`}
              title="Security, Data Privacy (HIPAA/GDPR/DPDP) & 6-Country SEO"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden lg:inline">
                {REGIONAL_SEO_CONFIGS[activeRegion]?.flag} {isBn ? 'প্রাইভেসি ও এসইও' : 'Privacy & SEO'}
              </span>
              <span className="lg:hidden">{REGIONAL_SEO_CONFIGS[activeRegion]?.flag}</span>
            </button>
            <button
              onClick={() => setShowSOS(true)}
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white px-3 md:px-4 py-2 rounded-xl font-extrabold text-[10px] md:text-xs shadow-md shadow-red-600/20 transition-all active:scale-95 whitespace-nowrap"
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
                      : 'bg-white border-slate-200 text-slate-900 shadow-sm'
                  }`}
                >
                  <Globe className="w-4 h-4 text-emerald-500" />
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
                    ? 'bg-slate-800 border-slate-700 text-amber-400'
                    : 'bg-white border-slate-200 text-slate-600 shadow-sm'
                }`}
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
            {user && (
              <button
                onClick={() => {
                  signOutGoogleAccount();
                  setProfile(null);
                  setUser(null);
                  setAppState('onboarding');
                  setCurrentView('home');
                  setShowDoctorDashboard(false);
                }}
                className={`p-2 md:px-3 md:py-2 text-xs font-bold rounded-xl transition-colors border flex items-center gap-1.5 ${
                  darkMode
                    ? 'text-red-400 hover:bg-red-950/30 border-red-900/50'
                    : 'text-red-600 hover:bg-red-50 border-red-100'
                }`}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">{isBn ? 'লগআউট' : 'Logout'}</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Container */}
      <main className="flex-1 py-4 md:py-8 px-3 md:px-8 max-w-7xl mx-auto w-full pb-8">
        {renderContent()}
      </main>

      {/* Global Security, Data Privacy & 6-Country SEO Compliance Footer Strip */}
      {currentView !== 'login' && (
        <footer
          className={`mb-24 border-t py-4 px-3 md:px-8 text-xs transition-colors ${
            darkMode
              ? 'bg-slate-900/70 border-slate-800 text-slate-400'
              : 'bg-slate-100/80 border-slate-200/80 text-slate-600'
          }`}
        >
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
              <span className="inline-flex items-center gap-1.5 font-extrabold text-emerald-600 dark:text-emerald-400">
                <Lock className="w-3.5 h-3.5" />
                <span>
                  {isBn
                    ? 'হেলথ ডাটা প্রাইভেসি শিল্ড:'
                    : 'Clinical Data Privacy & Security:'}
                </span>
              </span>
              <span className="text-[11px]">
                HIPAA (USA) • UK-GDPR (UK) • DPDP 2023 (India) • Privacy Act (Australia) • RGPD/LOPDGDD (Spain) • Data Protection (Bangladesh)
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {(['US', 'GB', 'IN', 'AU', 'ES', 'BD'] as SupportedRegionCode[]).map((code) => {
                const cfg = REGIONAL_SEO_CONFIGS[code];
                const isSelected = activeRegion === code;
                return (
                  <button
                    key={code}
                    onClick={() => {
                      const currentSettings = loadPrivacySettings();
                      savePrivacySettings({ ...currentSettings, selectedRegion: code });
                      setActiveRegion(code);
                      applyDynamicRegionalSeo(code, currentView);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 border transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                        : darkMode
                        ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                    title={`${cfg.countryNameEn} — ${cfg.dietaryStandard}`}
                  >
                    <span>{cfg.flag}</span>
                    <span>{cfg.countryNameEn}</span>
                  </button>
                );
              })}
              <button
                onClick={() => {
                  setSecuritySeoTab('privacy');
                  setShowSecuritySeoModal(true);
                }}
                className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-indigo-600 hover:bg-indigo-500 text-white transition-all"
              >
                {isBn ? 'ডাটা ভল্ট ও এসইও সেটিংস' : 'Privacy Vault & SEO Hub'}
              </button>
            </div>
          </div>
        </footer>
      )}

      {/* Global Floating Individualized Gemini AI Assistant on all screens except full messages view and login */}
      {currentView !== 'messages' && currentView !== 'login' && (
        <IndividualizedChatbot
          profile={
            profile || {
              dosha: 'Pitta-Kapha',
              age: 32,
              gender: 'Female',
              weight: 64,
              height: 162,
              microbiomeScore: 74,
              inflammatoryIndex: 4,
              metabolicType: 'Moderate',
              alkalineBalance: 'Neutral',
              psychologicalProfile: 'Balanced',
              medications: 'None',
              dietHistory: 'Mixed Bengali Diet',
              medicalConditions: isBn ? 'সাধারণ মেটাবলিক ও গাট হেলথ' : 'General Metabolic & Gut Wellness',
              cohortType: 'adult_metabolic',
              mealFrequency: 3,
              dinnerCarbRule: 'vegetable_carbs',
              answers: {},
              analysis: null,
            }
          }
          currentPhase={currentPhase}
          lang={lang}
          darkMode={darkMode}
          currentChart={currentChart}
          todayLog={
            dailyCalorieLogs.length > 0 ? dailyCalorieLogs[dailyCalorieLogs.length - 1] : null
          }
          hasRealProfile={Boolean(profile)}
          mode="floating"
          onOpenFullView={() => handleNavigation('messages')}
          onStartAssessment={() => setCurrentView('assessment_gate')}
        />
      )}

      {/* Redesigned Figma-Style Footer Dock (Diet Maker, Leaderboard, Calculator removed; Daily Calorie Tracker & Analytics added) */}
      {currentView !== 'login' && (
        <div
          className={`fixed bottom-0 inset-x-0 z-[60] border-t backdrop-blur-2xl py-2 px-3 transition-colors duration-300 ${
            darkMode
              ? 'bg-slate-900/95 border-slate-800 shadow-2xl'
              : 'bg-white/95 border-slate-200/80 shadow-[0_-10px_30px_rgba(15,23,42,0.06)]'
          }`}
        >
          <div className="max-w-2xl mx-auto flex justify-between items-center gap-2">
            <FooterDockItem
              view="home"
              label={isBn ? 'হোম' : 'Home'}
              icon={Home}
              activeGradient="from-emerald-500 to-teal-600"
            />
            <FooterDockItem
              view="calorie_tracker"
              label={isBn ? 'ডেইলি ক্যালোরি ট্র্যাকার' : 'Calorie Tracker'}
              icon={Flame}
              activeGradient="from-orange-500 to-rose-600"
            />
            <FooterDockItem
              view="analytics"
              label={isBn ? 'অ্যানালিটিক্স' : 'Analytics'}
              icon={BarChart3}
              activeGradient="from-indigo-500 to-purple-600"
            />
            <FooterDockItem
              view="profile"
              label={isBn ? 'প্রোফাইল' : t.nav_profile}
              icon={UserCircle2}
              activeGradient="from-blue-500 to-cyan-600"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
