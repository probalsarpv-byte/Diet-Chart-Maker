import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  ArrowRightLeft,
  Clock,
  Maximize2,
  X,
  MessageSquare,
  Search,
  UserCheck,
  Utensils,
  RefreshCw,
  Languages,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  HealthProfile,
  Phase,
  Language,
  ChatMessage,
  DietPhaseChart,
  DailyCalorieLog,
  UserGeminiAccountConfig,
} from '../types';
import { GeminiService, FoodSafetyVerdict } from '../services/geminiService';
import {
  getUserGeminiAccount,
  toggleUserGeminiAccount,
  subscribeUserGeminiAccount,
  MakerCheckerEngine,
} from '../services/aiModeService';

interface IndividualizedChatbotProps {
  profile: HealthProfile;
  currentPhase: Phase;
  lang: Language;
  darkMode?: boolean;
  currentChart?: DietPhaseChart | null;
  todayLog?: DailyCalorieLog | null;
  hasRealProfile?: boolean;
  mode?: 'embedded' | 'floating';
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideFloatingTrigger?: boolean;
  onOpenFullView?: () => void;
  onStartAssessment?: () => void;
}

export const IndividualizedChatbot: React.FC<IndividualizedChatbotProps> = ({
  profile,
  currentPhase,
  lang,
  darkMode = false,
  currentChart = null,
  todayLog = null,
  hasRealProfile = true,
  mode = 'embedded',
  isOpen: controlledIsOpen,
  onOpenChange,
  hideFloatingTrigger = false,
  onOpenFullView,
  onStartAssessment,
}) => {
  const [chatLang, setChatLang] = useState<Language>(lang === 'bn' ? 'bn' : 'en');
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = (nextOpen: boolean) => {
    setInternalIsOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };
  const [activeTab, setActiveTab] = useState<'chat' | 'food_check'>('chat');
  const [userGeminiAccount, setUserGeminiAccountState] = useState<UserGeminiAccountConfig>(() =>
    getUserGeminiAccount()
  );
  const [pipelineStage, setPipelineStage] = useState<'idle' | 'maker' | 'checker'>('idle');
  const [expandedVerificationId, setExpandedVerificationId] = useState<string | null>(null);
  const [showFoodCheckVerification, setShowFoodCheckVerification] = useState(false);

  useEffect(() => {
    if (lang === 'bn' || lang === 'en') {
      setChatLang(lang);
    }
  }, [lang]);

  useEffect(() => {
    return subscribeUserGeminiAccount((cfg) => {
      setUserGeminiAccountState(cfg);
    });
  }, []);

  const isBn = chatLang === 'bn';
  const gemini = new GeminiService();

  const getCohortBadgeText = (): string => {
    const cohort = profile.cohortType || 'adult_metabolic';
    if (cohort === 'pregnancy_lactation') {
      if (profile.lactationStage && (profile.lactationStage as string) !== 'none') {
        return isBn
          ? `স্তন্যদানকারী মা (${profile.lactationStage === '0-6m' ? '০-৬ মাস' : '৬-১২+ মাস'})`
          : `Lactating Mother (${profile.lactationStage})`;
      }
      return isBn
        ? `গর্ভাবস্থা • ${profile.pregnancyMonth || 4}ম মাস (মাসানুমাসিক)`
        : `Pregnancy • Month ${profile.pregnancyMonth || 4} (Masanumasika)`;
    }
    if (cohort === 'child_pediatric') {
      return isBn
        ? `শিশু পুষ্টি • বয়স ${profile.childAgeGroup || '4-6'} বছর`
        : `Pediatric • Age ${profile.childAgeGroup || '4-6'} yrs`;
    }
    if (cohort === 'oncology_cancer') {
      return isBn
        ? `অনকোলজি কেয়ার (${profile.oncologyPhase || 'Active'})`
        : `Oncology Support (${profile.oncologyPhase || 'Active'})`;
    }
    if (cohort === 'adolescent_growth') {
      return isBn ? 'কিশোর-কিশোরী গ্রোথ ও হরমোন' : 'Adolescent Growth & Hormones';
    }
    return isBn
      ? `মেটাবলিক হেলথ (${profile.medicalConditions || profile.dosha})`
      : `Metabolic Health (${profile.medicalConditions || profile.dosha})`;
  };

  const buildInitialGreeting = (targetLang: Language): ChatMessage => {
    const bn = targetLang === 'bn';
    const heightM = (profile.height || 165) / 100;
    const bmi = ((profile.weight || 65) / (heightM * heightM)).toFixed(1);
    const targetCals = currentChart?.dailyCalorieTarget || todayLog?.targetCalories || 1650;
    const loggedCals = todayLog
      ? todayLog.items.reduce((acc, i) => acc + (i.calories || 0), 0)
      : 0;

    const initialVerification = MakerCheckerEngine.buildVerificationStamp(profile);

    if (bn) {
      return {
        id: 'welcome-msg',
        sender: 'ai',
        timestamp: new Date(),
        verification: initialVerification,
        text: `আসসালামু আলাইকুম! আমি আপনার **ব্যক্তিগতকৃত AI নিউট্রিশন ও ক্লিনিক্যাল কোচ**।\n\nআপনার বর্তমান প্রোফাইল (**${profile.dosha} দোষ**, BMI **${bmi}**, **${getCohortBadgeText()}**, দৈনিক লক্ষ্যমাত্রা **${targetCals} kcal**${loggedCals ? `, আজ গ্রহণ করেছেন **${loggedCals} kcal**` : ''}) অনুযায়ী আপনাকে ব্যক্তিগতকৃত পুষ্টি পরামর্শ দিতে প্রস্তুত।`,
      };
    }

    return {
      id: 'welcome-msg',
      sender: 'ai',
      timestamp: new Date(),
      verification: initialVerification,
      text: `Hello! I am your **Individualized AI Nutrition & Clinical Coach**.\n\nSynchronized with your live profile (**${profile.dosha} Dosha**, BMI **${bmi}**, **${getCohortBadgeText()}**, Daily Target **${targetCals} kcal**${loggedCals ? `, Logged Today: **${loggedCals} kcal**` : ''}).`,
    };
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    buildInitialGreeting(lang === 'bn' ? 'bn' : 'en'),
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Instant Food Safety & Swap Checker State
  const [foodQuery, setFoodQuery] = useState('');
  const [isCheckingFood, setIsCheckingFood] = useState(false);
  const [foodVerdict, setFoodVerdict] = useState<FoodSafetyVerdict | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending, pipelineStage, isOpen]);

  // Update welcome message when profile, language, or Gemini account state changes if only welcome message exists
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'welcome-msg') {
        return [buildInitialGreeting(chatLang)];
      }
      return prev;
    });
  }, [
    chatLang,
    profile.dosha,
    profile.cohortType,
    profile.pregnancyMonth,
    profile.childAgeGroup,
    currentChart?.dailyCalorieTarget,
    userGeminiAccount.enabled,
  ]);

  const getCohortQuickQuestions = (): string[] => {
    const cohort = profile.cohortType || 'adult_metabolic';
    if (cohort === 'pregnancy_lactation') {
      const m = profile.pregnancyMonth || 4;
      return isBn
        ? [
            `আমার গর্ভাবস্থার ${m}ম মাসে (মাসানুমাসিক) শিশুর বৃদ্ধির জন্য প্রতিদিন কী খাব?`,
            'গর্ভাবস্থায় বমি ভাব বা অ্যাসিডিটি হলে প্রাকৃতিক খাবারে কী সমাধান নেব?',
            'আমার বর্তমান ডায়েট চার্টে আয়রন, ক্যালসিয়াম ও কোলিন কীভাবে পূরণ হবে?',
            'গর্ভাবস্থায় কোন কোন খাবার সম্পূর্ণ বর্জন (Red Zone) করা উচিত?',
          ]
        : [
            `What are the key Masanumasika foods for my Month ${m} pregnancy?`,
            'How can I naturally manage morning nausea or heartburn with food?',
            'Which foods in my chart boost fetal brain development (Choline & DHA)?',
            'Which Red Zone foods must I strictly avoid during pregnancy?',
          ];
    }

    if (cohort === 'child_pediatric') {
      const ageGrp = profile.childAgeGroup || '4-6';
      return isBn
        ? [
            `আমার ${ageGrp} বছরের শিশুর বয়স অনুযায়ী উচ্চতা ও ওজন বাড়াতে কী খাওয়াব?`,
            'শিশুর মনোযোগ ও স্মৃতিশক্তি (Brain Milestone) বাড়াতে সকালের নাস্তায় কী দেব?',
            'বাচ্চা সবজি বা মাছ খেতে না চাইলে কীভাবে হেলদি রেসিপি তৈরি করব?',
            'শিশুর রোগ প্রতিরোধ ক্ষমতা ও হজমশক্তি বাড়ানোর দৈনিক খাবার কী?',
          ]
        : [
            `Best daily foods to boost height and weight for my ${ageGrp} yr child?`,
            'What breakfast items support child brain development and focus?',
            'Healthy creative swaps for a picky eater who refuses vegetables?',
            'How to strengthen my child’s gut microbiome and immunity naturally?',
          ];
    }

    if (cohort === 'oncology_cancer') {
      return isBn
        ? [
            'কেমোথেরাপি চলাকালীন মুখের রুচি ফেরাতে ও বমি ভাব কমাতে কী খাব?',
            'ওজন ও পেশী ক্ষয় (Cachexia) রোধে সহজপাচ্য হাই-প্রোটিন খাবার কী কী?',
            'ইমিউনিটি কম থাকলে (Neutropenia) খাবার তৈরিতে কী কী সতর্কতা মানতে হবে?',
            'শরীরের প্রদাহ কমাতে আমার জন্য নিরাপদ স্যুপ ও পানীয় কোনটি?',
          ]
        : [
            'What soft foods help with nausea and taste changes during treatment?',
            'Easily digestible high-protein meals to prevent muscle loss?',
            'What neutropenic food safety rules should I follow right now?',
            'Gentle anti-inflammatory soups and hydration for recovery?',
          ];
    }

    if (cohort === 'adolescent_growth') {
      return isBn
        ? [
            'বয়ঃসন্ধিকালে উচ্চতা বৃদ্ধি ও হরমোনের ভারসাম্য রাখতে কী খাওয়া জরুরি?',
            'কিশোরীদের আয়রন ঘাটতি ও পিরিয়ডের ক্লান্তি দূর করার ডায়েট কী?',
            'পড়াশোনায় মনোযোগ ও এনার্জি ধরে রাখতে বিকেলের নাস্তায় কী খাব?',
            'ব্রণ ও ওজন নিয়ন্ত্রণে কোন খাবারগুলো বাদ দেওয়া উচিত?',
          ]
        : [
            'Best foods to maximize adolescent height growth and bone density?',
            'Iron-rich meals to prevent anemia and hormonal fatigue?',
            'Healthy brain-boosting evening snacks for exam focus?',
            'Foods to avoid for clear skin and insulin balance?',
          ];
    }

    // Default Adult Metabolic
    return isBn
      ? [
          `আমার ${profile.dosha} দোষ ও মেটাবলিক প্রোফাইল অনুযায়ী আজ রাতে কী ডিনার করব?`,
          'খাবারের পর ব্লাড সুগার ও ইনসুলিন স্পাইক কমানোর সবচেয়ে কার্যকর উপায় কী?',
          'আমার ট্রাফিক লাইট গাইডে সাদা ভাত ও চিনির সেরা বিকল্প কী?',
          'পেটের গ্যাস, ব্লোটিং ও ফ্যাটি লিভার কমাতে সকালে কীভাবে দিন শুরু করব?',
        ]
      : [
          `What should I eat for dinner tonight based on my ${profile.dosha} profile and carb rule?`,
          'How can I flatten post-meal glucose spikes using my current diet chart?',
          'What are the best Green Zone swaps for white rice and evening tea snacks?',
          'Morning detox routine to improve my gut microbiome score and fatty liver?',
        ];
  };

  const quickFoodSamples = isBn
    ? [
        'পাকা আম (Mango)',
        'সাদা ভাত (White Rice)',
        'লাউ ও ছোট মাছ',
        'ডাবের পানি',
        'দুধ চা ও বিস্কুট',
        'সিদ্ধ ডিম',
        'পাঁপড় / সিঙাড়া',
        'কাঁচা পেঁপে',
      ]
    : [
        'Ripe Mango',
        'White Rice',
        'Bottle Gourd & Fish',
        'Coconut Water',
        'Milk Tea & Biscuits',
        'Boiled Egg',
        'Fried Samosa',
        'Raw Papaya',
      ];

  const handleToggleUserGemini = () => {
    toggleUserGeminiAccount(!userGeminiAccount.enabled);
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt ?? input).trim();
    if (!textToSend || isSending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date(),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    if (!customPrompt) setInput('');
    setIsSending(true);
    setPipelineStage('maker');
    setActiveTab('chat');

    try {
      // Stage 1: Maker generating draft -> Stage 2: App's Gemini Checker verifying clinical safety
      const makerPromise = gemini.coachChatWithVerification(
        profile,
        currentPhase,
        nextMessages,
        chatLang,
        currentChart,
        todayLog
      );

      await new Promise((r) => setTimeout(r, 240));
      setPipelineStage('checker');
      await new Promise((r) => setTimeout(r, 280));

      const { text: verifiedReply, verification } = await makerPromise;

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: verifiedReply,
          timestamp: new Date(),
          verification,
        },
      ]);
    } catch {
      const fallbackVerification = MakerCheckerEngine.buildVerificationStamp(profile);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: isBn
            ? 'দুঃখিত, সংযোগে সাময়িক সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
            : 'Sorry, there was a temporary connection issue. Please try again.',
          timestamp: new Date(),
          verification: fallbackVerification,
        },
      ]);
    } finally {
      setIsSending(false);
      setPipelineStage('idle');
    }
  };

  const handleCheckFoodSafety = async (sampleFood?: string) => {
    const query = (sampleFood ?? foodQuery).trim();
    if (!query || isCheckingFood) return;
    if (sampleFood) setFoodQuery(sampleFood);

    setIsCheckingFood(true);
    setPipelineStage('maker');
    try {
      const verdictPromise = gemini.checkFoodSafetyAndSwap(
        query,
        profile,
        currentPhase,
        chatLang,
        currentChart
      );
      await new Promise((r) => setTimeout(r, 200));
      setPipelineStage('checker');
      await new Promise((r) => setTimeout(r, 240));
      const verdict = await verdictPromise;
      setFoodVerdict(verdict);
    } finally {
      setIsCheckingFood(false);
      setPipelineStage('idle');
    }
  };

  const handleResetChat = () => {
    setMessages([buildInitialGreeting(chatLang)]);
  };

  // Format AI markdown-lite text (**bold** and line breaks) cleanly
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-2" />;

      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={idx} className="leading-relaxed mb-1 last:mb-0">
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-bold">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return <span key={pIdx}>{part}</span>;
          })}
        </p>
      );
    });
  };

  const heightM = (profile.height || 165) / 100;
  const bmi = ((profile.weight || 65) / (heightM * heightM)).toFixed(1);
  const loggedCalories = todayLog
    ? todayLog.items.reduce((acc, i) => acc + (i.calories || 0), 0)
    : 755;
  const targetCalories = currentChart?.dailyCalorieTarget || todayLog?.targetCalories || 1650;

  // When controlled from the footer dock, do not render any floating button over screen text
  if (mode === 'floating' && !isOpen) {
    if (hideFloatingTrigger) {
      return null;
    }
    return null;
  }

  const containerClasses =
    mode === 'floating'
      ? `fixed bottom-20 right-3 sm:bottom-20 sm:right-6 z-50 w-[calc(100vw-1.5rem)] sm:w-[440px] max-h-[80vh] flex flex-col rounded-3xl shadow-2xl border overflow-hidden transition-all ${
          darkMode
            ? 'bg-slate-900 border-slate-700/80 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`
      : `w-full flex flex-col rounded-3xl border overflow-hidden shadow-sm ${
          darkMode
            ? 'bg-slate-900 border-slate-800 text-white'
            : 'bg-white border-slate-200/90 text-slate-900'
        }`;

  return (
    <div className={containerClasses}>
      {/* Top Clinical Context Header */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-teal-950 text-white p-4 sm:p-5 border-b border-white/10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
              <Bot className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                  {isBn
                    ? 'ব্যক্তিগতকৃত AI নিউট্রিশন ও ক্লিনিক্যাল চ্যাটবট'
                    : 'Individualized AI Nutrition & Clinical Coach'}
                </h3>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {isBn
                  ? 'আপনার শারীরিক প্রোফাইল ও ডায়েট চার্ট অনুযায়ী ব্যক্তিগতকৃত পরামর্শ'
                  : 'Personalized guidance tailored to your health profile and diet chart'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Bilingual Switcher */}
            <button
              onClick={() => setChatLang((prev) => (prev === 'bn' ? 'en' : 'bn'))}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors"
              title={isBn ? 'Switch to English' : 'বাংলায় পরিবর্তন করুন'}
            >
              <Languages className="w-3.5 h-3.5 text-emerald-300" />
              <span>{isBn ? 'EN' : 'বাংলা'}</span>
            </button>

            <button
              onClick={handleResetChat}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
              title={isBn ? 'চ্যাট রিসেট করুন' : 'Reset conversation'}
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {mode === 'floating' && onOpenFullView && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenFullView();
                }}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
                title={isBn ? 'বড় স্ক্রিনে খুলুন' : 'Expand to full screen'}
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}

            {mode === 'floating' && (
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-rose-500/30 text-slate-300 hover:text-white transition-colors"
                title={isBn ? 'বন্ধ করুন' : 'Close'}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Single Clean Option: Use My Gemini Toggle */}
        <div className="mt-3 p-2.5 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                userGeminiAccount.enabled
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-white/10 text-slate-300'
              }`}
            >
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-extrabold text-white truncate">
                {isBn
                  ? 'আপনি কি আপনার নিজস্ব Gemini ব্যবহার করতে চান?'
                  : 'Would you like to use your own Gemini?'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleUserGemini}
            role="switch"
            aria-checked={userGeminiAccount.enabled}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              userGeminiAccount.enabled ? 'bg-emerald-500' : 'bg-slate-600'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                userGeminiAccount.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Live Synchronized Biomarker & Cohort Strip */}
        <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
          <div className="px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10">
            <span className="text-slate-400 block text-[10px]">
              {isBn ? 'কোহর্ট ও স্টেজ' : 'Active Cohort'}
            </span>
            <span className="font-bold text-emerald-300 truncate block">
              {getCohortBadgeText()}
            </span>
          </div>

          <div className="px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10">
            <span className="text-slate-400 block text-[10px]">
              {isBn ? 'দোষ ও বিএমআই' : 'Dosha & BMI'}
            </span>
            <span className="font-bold text-white tabular-nums block">
              {profile.dosha} • BMI {bmi}
            </span>
          </div>

          <div className="px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10">
            <span className="text-slate-400 block text-[10px]">
              {isBn ? 'রাতের কার্ব নিয়ম' : 'Dinner Carb Rule'}
            </span>
            <span className="font-bold text-amber-300 truncate block">
              {profile.dinnerCarbRule === 'vegetable_carbs'
                ? isBn
                  ? 'শুধু সবজি কার্ব'
                  : 'Veg Carbs Only'
                : profile.dinnerCarbRule === 'no_carbs'
                ? isBn
                  ? 'লো-কার্ব প্রোটিন'
                  : 'Zero Grain'
                : isBn
                ? 'পরিমিত শস্য কার্ব'
                : 'Complex Grain'}
            </span>
          </div>

          <div className="px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10">
            <span className="text-slate-400 block text-[10px]">
              {isBn ? 'আজকের ক্যালোরি' : 'Today Logged'}
            </span>
            <span className="font-bold text-cyan-300 tabular-nums block">
              {loggedCalories} / {targetCalories} kcal
            </span>
          </div>
        </div>

        {/* Prompt to complete profile if user is browsing as guest */}
        {!hasRealProfile && onStartAssessment && (
          <div className="mt-3 flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-100 text-xs">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-amber-300 shrink-0" />
              <span>
                {isBn
                  ? 'আপনার নিজস্ব প্রোফাইল ও অ্যাসেসমেন্ট সম্পন্ন করলে আরও নিখুঁত পরামর্শ পাবেন।'
                  : 'Complete your clinical assessment for 100% tailored biomarker answers.'}
              </span>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                onStartAssessment();
              }}
              className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-bold text-[11px] whitespace-nowrap shrink-0 hover:bg-amber-300 transition-colors"
            >
              {isBn ? 'অ্যাসেসমেন্ট করুন' : 'Start Assessment'}
            </button>
          </div>
        )}
      </div>

      {/* Mode Switcher Tabs: 1) AI Clinical Chat  2) Instant Food Safety & Swap Checker */}
      <div
        className={`grid grid-cols-2 border-b p-1.5 gap-1.5 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200/80'
        }`}
      >
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all ${
            activeTab === 'chat'
              ? 'bg-emerald-600 text-white shadow-sm'
              : darkMode
              ? 'text-slate-400 hover:text-white hover:bg-slate-800'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>{isBn ? 'AI ক্লিনিক্যাল চ্যাট' : 'Individualized AI Chat'}</span>
        </button>

        <button
          onClick={() => setActiveTab('food_check')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all ${
            activeTab === 'food_check'
              ? 'bg-emerald-600 text-white shadow-sm'
              : darkMode
              ? 'text-slate-400 hover:text-white hover:bg-slate-800'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{isBn ? 'খাদ্য নিরাপত্তা ও বিকল্প যাচাই' : 'Instant Food Safety & Swap'}</span>
        </button>
      </div>

      {/* TAB 1: INDIVIDUALIZED AI CLINICAL CHAT */}
      {activeTab === 'chat' ? (
        <div className="flex flex-col flex-1 min-h-0">
          {/* Cohort-Specific Quick Questions Strip */}
          <div
            className={`px-4 py-2.5 border-b ${
              darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50/70 border-slate-200/60'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                {isBn
                  ? 'আপনার কন্ডিশন অনুযায়ী দ্রুত প্রশ্ন (ট্যাপ করুন):'
                  : 'Personalized Quick Prompts for Your Cohort:'}
              </span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {getCohortQuickQuestions().map((qText, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(qText)}
                  disabled={isSending}
                  className={`text-left text-xs font-semibold px-3 py-1.5 rounded-xl border whitespace-nowrap transition-all shrink-0 ${
                    darkMode
                      ? 'bg-slate-800/90 border-slate-700 text-emerald-300 hover:bg-emerald-950/60 hover:border-emerald-600'
                      : 'bg-white border-emerald-200 text-emerald-800 hover:bg-emerald-50 hover:border-emerald-400'
                  }`}
                >
                  {qText}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Messages Viewport */}
          <div
            className={`flex-1 overflow-y-auto p-4 space-y-4 ${
              mode === 'floating' ? 'h-[320px]' : 'h-[430px]'
            } ${darkMode ? 'bg-slate-950/40' : 'bg-slate-50/40'}`}
          >
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              const msgId = msg.id || String(msg.timestamp);
              const isExpanded = expandedVerificationId === msgId;

              return (
                <div
                  key={msgId}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[90%] sm:max-w-[84%] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm shadow-sm ${
                      isUser
                        ? 'bg-emerald-600 text-white rounded-br-none'
                        : darkMode
                        ? 'bg-slate-800 text-slate-100 border border-slate-700 rounded-bl-none'
                        : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-none'
                    }`}
                  >
                    {!isUser && (
                      <div className="flex items-center gap-1.5 mb-1.5 pb-1.5 border-b border-slate-200/60 dark:border-slate-700/60 flex-wrap">
                        <Bot className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">
                          {isBn ? 'ক্লিনিক্যাল AI কোচ' : 'Clinical AI Coach'}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-auto tabular-nums">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    )}

                    <div className="space-y-1">{renderFormattedText(msg.text)}</div>
                  </div>
                </div>
              );
            })}

            {/* Clean Progress Indicator */}
            {isSending && (
              <div className="flex justify-start">
                <div
                  className={`rounded-2xl rounded-bl-none px-4 py-3 text-xs font-semibold space-y-2 border max-w-xs ${
                    darkMode
                      ? 'bg-slate-800 border-slate-700 text-emerald-300'
                      : 'bg-white border-slate-200 text-emerald-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-500 shrink-0" />
                    <span className="font-bold">
                      {isBn
                        ? 'আপনার প্রোফাইল অনুযায়ী উত্তর তৈরি হচ্ছে...'
                        : 'Preparing your personalized response...'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div
            className={`p-3 sm:p-4 border-t flex items-center gap-2 ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              placeholder={
                isBn
                  ? 'আপনার খাবার, উপসর্গ বা ডায়েট চার্ট নিয়ে যেকোনো প্রশ্ন লিখুন...'
                  : 'Ask anything about your meals, symptoms, or cohort milestones...'
              }
              className={`flex-1 px-4 py-3 rounded-2xl text-xs sm:text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                darkMode
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || isSending}
              className="px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all shrink-0 shadow-sm"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">{isBn ? 'পাঠান' : 'Send'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* TAB 2: INSTANT FOOD SAFETY & SWAP CHECKER */
        <div
          className={`p-4 sm:p-5 space-y-4 overflow-y-auto ${
            mode === 'floating' ? 'max-h-[410px]' : 'min-h-[460px]'
          }`}
        >
          <div>
            <h4 className="font-extrabold text-sm sm:text-base">
              {isBn
                ? 'যেকোনো খাবার আপনার জন্য নিরাপদ কি না তাৎক্ষণিক যাচাই করুন'
                : 'Instant Personalized Food Safety & Healthy Swap Checker'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isBn
                ? `আপনার ${profile.dosha} দোষ, ${getCohortBadgeText()} এবং ট্রাফিক লাইট গাইড অনুযায়ী যেকোনো খাবারের Green/Yellow/Red স্ট্যাটাস ও বিকল্প জানুন।`
                : `Checks how any food interacts with your ${profile.dosha} Dosha, ${getCohortBadgeText()}, and glycemic targets.`}
            </p>
          </div>

          {/* Search Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={foodQuery}
                onChange={(e) => setFoodQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCheckFoodSafety();
                }}
                placeholder={
                  isBn
                    ? 'খাবারের নাম লিখুন (যেমন: পাকা আম, সাদা ভাত, ডাবের পানি, কফি)...'
                    : 'Enter food name (e.g., Ripe Mango, White Rice, Coffee)...'
                }
                className={`w-full pl-10 pr-4 py-3 rounded-2xl text-xs sm:text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>
            <button
              onClick={() => handleCheckFoodSafety()}
              disabled={!foodQuery.trim() || isCheckingFood}
              className="px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm whitespace-nowrap transition-all shrink-0"
            >
              {isCheckingFood
                ? isBn
                  ? 'যাচাই হচ্ছে...'
                  : 'Checking...'
                : isBn
                ? 'যাচাই করুন'
                : 'Check Food'}
            </button>
          </div>

          {/* Sample Food Chips */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 block mb-2">
              {isBn ? 'জনপ্রিয় খাবার (১-ক্লিকে পরীক্ষা করুন):' : 'Popular Foods (1-Click Check):'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickFoodSamples.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleCheckFoodSafety(item)}
                  disabled={isCheckingFood}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    darkMode
                      ? 'bg-slate-800 border-slate-700 text-slate-200 hover:border-emerald-500'
                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Verdict Card */}
          {foodVerdict ? (
            <div
              className={`rounded-2xl p-4 border-2 space-y-3 transition-all ${
                foodVerdict.zone === 'green'
                  ? darkMode
                    ? 'bg-emerald-950/30 border-emerald-600/60'
                    : 'bg-emerald-50/70 border-emerald-300'
                  : foodVerdict.zone === 'yellow'
                  ? darkMode
                    ? 'bg-amber-950/30 border-amber-500/60'
                    : 'bg-amber-50/70 border-amber-300'
                  : darkMode
                  ? 'bg-rose-950/30 border-rose-500/60'
                  : 'bg-rose-50/70 border-rose-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2.5">
                  {foodVerdict.zone === 'green' ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                  ) : foodVerdict.zone === 'yellow' ? (
                    <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 text-rose-500 shrink-0" />
                  )}
                  <div>
                    <h5 className="font-extrabold text-sm sm:text-base">{foodVerdict.foodName}</h5>
                    <span
                      className={`inline-block text-[11px] font-extrabold px-2 py-0.5 rounded-md mt-0.5 ${
                        foodVerdict.zone === 'green'
                          ? 'bg-emerald-600 text-white'
                          : foodVerdict.zone === 'yellow'
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-rose-600 text-white'
                      }`}
                    >
                      {foodVerdict.verdictTitle}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs sm:text-sm pt-1">
                <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-black/5 dark:border-white/5">
                  <span className="font-extrabold block text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                    {isBn ? 'ক্লিনিক্যাল ও মেটাবলিক কারণ:' : 'Clinical & Metabolic Impact:'}
                  </span>
                  <p className="font-medium leading-relaxed">{foodVerdict.clinicalReason}</p>
                </div>

                <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-black/5 dark:border-white/5">
                  <span className="font-extrabold block text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                    {isBn ? 'আয়ুর্বেদিক দোষ ও কোহর্ট নোট:' : 'Ayurvedic & Cohort Note:'}
                  </span>
                  <p className="font-medium leading-relaxed">
                    {foodVerdict.ayurvedicAndCohortNote}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-extrabold text-[11px] uppercase mb-0.5">
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>{isBn ? 'সেরা স্বাস্থ্যকর বিকল্প (Swap):' : 'Healthy Green Swap:'}</span>
                    </div>
                    <p className="font-semibold">{foodVerdict.healthySwap}</p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-extrabold text-[11px] uppercase mb-0.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{isBn ? 'সঠিক পরিমাণ ও সময়:' : 'Portion & Best Timing:'}</span>
                    </div>
                    <p className="font-semibold">{foodVerdict.bestTimingOrPortion}</p>
                  </div>
                </div>
              </div>

              <div className="pt-1 flex justify-end">
                <button
                  onClick={() =>
                    handleSendMessage(
                      isBn
                        ? `${foodVerdict.foodName} কি আমার বর্তমান ডায়েট চার্টে এবং ${getCohortBadgeText()} অবস্থায় কীভাবে বা কোন বিকল্পে খাওয়া সবচেয়ে ভালো হবে?`
                        : `How should I include or swap ${foodVerdict.foodName} in my current diet chart for ${getCohortBadgeText()}?`
                    )
                  }
                  className="inline-flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 transition-opacity"
                >
                  <span>
                    {isBn
                      ? 'এই খাবার নিয়ে চ্যাটে বিস্তারিত জিজ্ঞাসা করুন'
                      : 'Ask AI Coach More About This Food'}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`rounded-2xl p-6 text-center border border-dashed ${
                darkMode
                  ? 'border-slate-800 bg-slate-900/40 text-slate-400'
                  : 'border-slate-200 bg-slate-50/60 text-slate-500'
              }`}
            >
              <Utensils className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-80" />
              <p className="text-xs sm:text-sm font-semibold">
                {isBn
                  ? 'উপরের বক্সে যেকোনো খাবারের নাম লিখুন অথবা জনপ্রিয় খাবারের চিপে ট্যাপ করুন।'
                  : 'Type any food item above or tap a quick chip to see your personalized safety verdict.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IndividualizedChatbot;
