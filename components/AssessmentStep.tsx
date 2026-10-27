
import React, { useState, useEffect } from 'react';
import { HealthProfile, Language, AssessmentAnalysis, User, ProfessionalProfile } from '../types';
import { ALL_QUESTIONS } from '../questions';
import { translations } from '../i18n';
import LoginScreen from './LoginScreen';

interface Props {
  user?: User | null;
  onComplete: (profile: HealthProfile, patientName?: string) => void;
  onLoginAsDoctor?: (user: User) => void;
  onSelfLogin?: (user: User) => void;
  lang: Language;
  darkMode?: boolean;
  isDoctorMode?: boolean;
  onCancel?: () => void;
}

const QUESTIONS_PER_PAGE = 8;

const AssessmentStep: React.FC<Props> = ({ user, onComplete, onLoginAsDoctor, onSelfLogin, lang, darkMode, isDoctorMode, onCancel }) => {
  const t = translations[lang];
  
  // Initialize state based on whether a user is already logged in
  const [assessmentType, setAssessmentType] = useState<'self' | 'doctor' | 'professional' | 'professional_form' | null>(() => {
    if (isDoctorMode) return 'self';
    if (user && !user.id.startsWith('DOC-')) return 'self';
    return null;
  });

  const [patientName, setPatientName] = useState('');
  const [uniqueIdInput, setUniqueIdInput] = useState('');
  const [isFetchingId, setIsFetchingId] = useState(false);
  const [idError, setIdError] = useState(false);
  
  // Professional Profile State
  const [profProfile, setProfProfile] = useState<ProfessionalProfile>({
    fullName: '',
    role: 'Doctor',
    licenseNumber: '',
    specialty: '',
    institution: '',
    experienceYears: 0
  });

  const [currentPage, setCurrentPage] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [location, setLocation] = useState<{ latitude: number, longitude: number } | undefined>();
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [fileNames, setFileNames] = useState<string[]>([]);

  const [showLogin, setShowLogin] = useState(false);
  
  // Dynamic question filtering
  const getFilteredQuestions = () => {
    const isFemale = answers['basic_gender'] === 'Female';
    const conditions = (answers['med_conditions'] || '').toLowerCase();
    const isDiabetic = conditions.includes('diabetes') || conditions.includes('diab') || conditions.includes('sugar') || conditions.includes('insulin');

    return ALL_QUESTIONS.filter(q => {
      if (q.category === 'shakti' && !isFemale) return false;
      if ((q.id === 'emergency_name' || q.id === 'emergency_phone') && !isDiabetic) return false;
      return true;
    });
  };

  const filteredQuestions = getFilteredQuestions();
  const totalPages = Math.ceil(filteredQuestions.length / QUESTIONS_PER_PAGE);

  useEffect(() => {
    if (currentPage >= totalPages && totalPages > 0) {
      setCurrentPage(totalPages - 1);
    }
  }, [totalPages, currentPage]);

  const currentQuestions = filteredQuestions.slice(currentPage * QUESTIONS_PER_PAGE, (currentPage + 1) * QUESTIONS_PER_PAGE);

  const requestLocation = () => {
    setLoadingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
          setLoadingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLoadingLocation(false);
        }
      );
    } else {
      setLoadingLocation(false);
    }
  };

  const handleAnswer = (qId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, qId: string) => {
    if (e.target.files && e.target.files.length > 0) {
      const names = Array.from(e.target.files).map((f: File) => f.name);
      setFileNames(names);
      setAnswers(prev => ({ ...prev, [qId]: names.join(', ') }));
    }
  };

  const progress = Math.round((Object.keys(answers).length / filteredQuestions.length) * 100);

  const calculateAnalysis = (): AssessmentAnalysis => {
    const vata = Object.values(answers).filter(v => v === 'Vata' || v === 'a').length;
    const pitta = Object.values(answers).filter(v => v === 'Pitta' || v === 'b').length;
    const kapha = Object.values(answers).filter(v => v === 'Kapha' || v === 'c').length;
    const total = vata + pitta + kapha || 1;

    const digestionAns = Object.entries(answers).filter(([k]) => k.startsWith('digestion'));
    const microbiomeScore = 100 - (digestionAns.filter(([_, v]) => v === 'c').length * 10);
    const metabolicAns = Object.entries(answers).filter(([k]) => k.startsWith('metabolism'));
    const insulinResistanceProb = metabolicAns.filter(([_, v]) => v === 'c').length;
    const inflamAns = Object.entries(answers).filter(([k]) => k.startsWith('inflammation'));
    const inflamScore = (inflamAns.filter(([_, v]) => v === 'c').length * 2) + (inflamAns.filter(([_, v]) => v === 'b').length);

    let calculatedAlkaline = 7.4 - (inflamScore * 0.04) - (insulinResistanceProb * 0.02);
    calculatedAlkaline = Math.max(6.9, Math.min(7.6, calculatedAlkaline)); 

    const dietImpactMsg = lang === 'bn' ? 
      "আপনার বিস্তারিত খাদ্যাভ্যাসের বর্ণনাটি আমাদের ক্লিনিকাল ইঞ্জিন বিশ্লেষণ করছে। মেটাবলিক স্ট্রেস এবং ইনসুলিন স্পাইক শনাক্ত করে আপনার জন্য নিখুঁত পরিকল্পনা তৈরি করা হবে।" :
      "Our clinical engine is analyzing your detailed dietary narrative to identify metabolic stressors and insulin spikes specific to your daily routine.";

    // Localized Health Summary
    let healthSummary = "";
    if (lang === 'bn') {
        const inflamStatus = inflamScore > 8 ? 'উচ্চ সিস্টেমিক প্রদাহ' : 'ভাল কোষীয় প্রতিরোধ ক্ষমতা';
        healthSummary = `প্রোফাইল বিশ্লেষণে আপনার প্রধান দোষ এবং ${inflamStatus} পরিলক্ষিত হয়েছে।`;
    } else {
        healthSummary = `Profile synthesis suggests dominant Dosha with ${inflamScore > 8 ? 'high systemic inflammation' : 'good cellular resilience'}.`;
    }

    return {
      doshaBreakdown: { vata: Math.round((vata/total)*100), pitta: Math.round((pitta/total)*100), kapha: Math.round((kapha/total)*100) },
      microbiomeStatus: microbiomeScore > 70 ? (lang === 'bn' ? "বৈচিত্র্যময় ও সুস্থ" : "Diverse & Healthy") : microbiomeScore > 40 ? (lang === 'bn' ? "স্থবির" : "Dysbiotic/Stagnant") : (lang === 'bn' ? "সঙ্কটপূর্ণ" : "Critically Depleted"),
      metabolicEfficiency: insulinResistanceProb < 3 ? (lang === 'bn' ? "নমনীয়" : "Highly Flexible") : insulinResistanceProb < 7 ? (lang === 'bn' ? "ইনসুলিন রেজিস্ট্যান্স" : "Sluggish/Insulin Resistant") : (lang === 'bn' ? "অকার্যকর" : "Dysfunctional"),
      inflammatoryStatus: inflamScore < 5 ? (lang === 'bn' ? "ন্যূনতম" : "Minimal") : inflamScore < 12 ? (lang === 'bn' ? "দীর্ঘস্থায়ী" : "Systemic/Chronic") : (lang === 'bn' ? "উচ্চ ঝুঁকি" : "Acute/High Risk"),
      psychologicalProfile: vata > pitta && vata > kapha ? "Anxious/Creative" : pitta > vata && pitta > kapha ? "Driven/Intense" : "Calm/Possessive",
      alkalineScore: parseFloat(calculatedAlkaline.toFixed(2)),
      healthSummary: healthSummary,
      dietImpact: dietImpactMsg
    };
  };

  const constructProfile = (isDoctorReferred = false): HealthProfile => {
    const analysis = calculateAnalysis();
    let dosha = "Tridoshic";
    if (analysis.doshaBreakdown.vata > analysis.doshaBreakdown.pitta && analysis.doshaBreakdown.vata > analysis.doshaBreakdown.kapha) dosha = "Vata";
    else if (analysis.doshaBreakdown.pitta > analysis.doshaBreakdown.vata && analysis.doshaBreakdown.pitta > analysis.doshaBreakdown.kapha) dosha = "Pitta";
    else if (analysis.doshaBreakdown.kapha > analysis.doshaBreakdown.vata && analysis.doshaBreakdown.kapha > analysis.doshaBreakdown.pitta) dosha = "Kapha";

    return {
      age: parseInt(answers['basic_age']) || 35,
      gender: answers['basic_gender'] || 'Mixed',
      profession: answers['basic_profession'] || 'Other',
      weight: parseInt(answers['basic_weight']) || 70,
      height: parseInt(answers['basic_height']) || 170,
      dosha,
      answers,
      microbiomeScore: analysis.microbiomeStatus.includes("Healthy") || analysis.microbiomeStatus.includes("সুস্থ") ? 85 : 45,
      metabolicType: analysis.metabolicEfficiency,
      inflammatoryIndex: (analysis.inflammatoryStatus === "Minimal" || analysis.inflammatoryStatus === "ন্যূনতম") ? 2 : 7,
      alkalineBalance: analysis.alkalineScore > 7.3 ? 'Optimal' : 'Acidic',
      psychologicalProfile: analysis.psychologicalProfile,
      medications: answers['med_medications'] || 'Recorded',
      dietHistory: 'Narrative Recorded',
      medicalConditions: answers['med_conditions'] || '',
      currentMedicationsList: answers['med_medications'] || '',
      dietGoals: answers['med_targets'] || (isDoctorReferred ? '12-Week Clinical Protocol' : ''),
      medicalReportFiles: fileNames,
      analysis,
      location
    };
  };

  const handleIdFetch = () => {
    setIsFetchingId(true);
    setIdError(false);
    setTimeout(() => {
       if (uniqueIdInput.startsWith('AM-') && uniqueIdInput.length > 6) {
          const fakeProfile = constructProfile(true);
          onComplete({
             ...fakeProfile,
             age: 38,
             gender: 'Male',
             dosha: 'Pitta',
             medicalConditions: 'T2 Diabetes, High BP',
          });
       } else {
          setIdError(true);
       }
       setIsFetchingId(false);
    }, 2000);
  };

  const handleProfessionalSubmit = () => {
    const mockDoctor: User = {
      id: `DOC-${Math.floor(1000 + Math.random() * 9000)}`,
      name: profProfile.fullName,
      email: 'professional@precision.com',
      isPro: true,
      trialStartDate: new Date().toISOString(),
      points: 0,
      badges: [],
      professionalProfile: profProfile
    };
    if (onLoginAsDoctor) onLoginAsDoctor(mockDoctor);
  };

  const handleSelfLoginSuccess = (loggedInUser: User) => {
    setShowLogin(false);
    setAssessmentType('self'); // Explicitly set to 'self' to trigger question form
    if (onSelfLogin) onSelfLogin(loggedInUser);
  };

  // 1. Initial Screen: 3 Choices
  if (!assessmentType && !isDoctorMode && !showLogin) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in zoom-in duration-500">
        <h2 className={`text-3xl font-bold serif italic mb-8 text-center ${darkMode ? 'text-white' : 'text-slate-900'}`}>{t.create_profile_prompt}</h2>
        
        <button
          onClick={() => setAssessmentType('professional_form')}
          className={`w-full p-8 rounded-[40px] border-2 text-left group transition-all hover:scale-105 active:scale-95 ${
            darkMode ? 'bg-slate-900 border-slate-800 hover:border-blue-500' : 'bg-white border-slate-100 hover:border-blue-500 shadow-xl'
          }`}
        >
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-3xl bg-blue-600 text-white flex items-center justify-center text-3xl">👨‍⚕️</div>
            <div>
              <h3 className={`text-xl font-bold serif italic mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{t.role_doctor_nutritionist}</h3>
              <p className="text-sm opacity-60">Access clinical dashboards to manage patient metabolic charts.</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => { setAssessmentType('self'); setShowLogin(true); }}
          className={`w-full p-8 rounded-[40px] border-2 text-left group transition-all hover:scale-105 active:scale-95 ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 hover:border-emerald-500 shadow-xl'
          }`}
        >
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500 text-white flex items-center justify-center text-3xl">👤</div>
            <div>
              <h3 className={`text-xl font-bold serif italic mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{t.self_assessment}</h3>
              <p className="text-sm opacity-60">Build your own chart with Gmail login and 120-point mapping.</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setAssessmentType('doctor')}
          className={`w-full p-8 rounded-[40px] border-2 text-left group transition-all hover:scale-105 active:scale-95 ${
            darkMode ? 'bg-slate-900 border-slate-800 hover:border-indigo-500' : 'bg-white border-slate-100 hover:border-indigo-500 shadow-xl'
          }`}
        >
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-3xl bg-indigo-600 text-white flex items-center justify-center text-3xl">🆔</div>
            <div>
              <h3 className={`text-xl font-bold serif italic mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{t.referred_by_doc}</h3>
              <p className="text-sm opacity-60">Access your clinical plan using the unique Health ID from your doctor.</p>
            </div>
          </div>
        </button>
      </div>
    );
  }

  // ... (Rest of the component remains same, using `t` keys)
  
  if (assessmentType === 'professional_form') {
    return (
      <div className={`max-w-2xl mx-auto p-10 rounded-[40px] border shadow-2xl animate-in slide-in-from-bottom duration-500 ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
      }`}>
        <div className="text-center mb-8">
           <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-full mx-auto flex items-center justify-center text-4xl mb-4">🩺</div>
           <h2 className="text-3xl font-bold serif italic mb-2">{t.prof_reg_title}</h2>
           <p className="text-sm opacity-60">{t.prof_reg_subtitle}</p>
        </div>

        <div className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest opacity-60 px-2">{t.prof_full_name}</label>
                 <input 
                   type="text" 
                   value={profProfile.fullName}
                   onChange={e => setProfProfile({...profProfile, fullName: e.target.value})}
                   className={`w-full p-4 rounded-2xl border-2 outline-none focus:border-blue-500 transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'}`}
                   placeholder="e.g. Dr. John Doe"
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest opacity-60 px-2">{t.prof_role}</label>
                 <select 
                   value={profProfile.role}
                   onChange={e => setProfProfile({...profProfile, role: e.target.value as any})}
                   className={`w-full p-4 rounded-2xl border-2 outline-none focus:border-blue-500 transition-all appearance-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'}`}
                 >
                    <option value="Doctor">{t.prof_doc}</option>
                    <option value="Nutritionist">{t.prof_nutri}</option>
                 </select>
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-60 px-2">{t.prof_license}</label>
              <input 
                type="text" 
                value={profProfile.licenseNumber}
                onChange={e => setProfProfile({...profProfile, licenseNumber: e.target.value})}
                className={`w-full p-4 rounded-2xl border-2 outline-none focus:border-blue-500 transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'}`}
                placeholder="Reg #123456"
              />
           </div>

           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-60 px-2">{t.prof_specialty}</label>
              <input 
                type="text" 
                value={profProfile.specialty}
                onChange={e => setProfProfile({...profProfile, specialty: e.target.value})}
                className={`w-full p-4 rounded-2xl border-2 outline-none focus:border-blue-500 transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'}`}
                placeholder="e.g. Clinical Ayurveda"
              />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest opacity-60 px-2">{t.prof_institution}</label>
                 <input 
                   type="text" 
                   value={profProfile.institution}
                   onChange={e => setProfProfile({...profProfile, institution: e.target.value})}
                   className={`w-full p-4 rounded-2xl border-2 outline-none focus:border-blue-500 transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'}`}
                   placeholder="e.g. Apollo Hospital"
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest opacity-60 px-2">{t.prof_experience}</label>
                 <input 
                   type="number" 
                   value={profProfile.experienceYears || ''}
                   onChange={e => setProfProfile({...profProfile, experienceYears: parseInt(e.target.value)})}
                   className={`w-full p-4 rounded-2xl border-2 outline-none focus:border-blue-500 transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'}`}
                   placeholder="Years"
                 />
              </div>
           </div>

           <div className="pt-6">
              <button 
                onClick={handleProfessionalSubmit}
                disabled={!profProfile.fullName || !profProfile.licenseNumber}
                className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50"
              >
                🚀 {t.prof_register_btn}
              </button>
              <button onClick={() => setAssessmentType(null)} className="w-full mt-4 text-center text-xs font-bold opacity-40 uppercase hover:opacity-100 transition-opacity">
                {t.back}
              </button>
           </div>
        </div>
      </div>
    );
  }

  if (showLogin) {
    return <LoginScreen onLogin={handleSelfLoginSuccess} lang={lang} darkMode={darkMode} isSelfFlow={true} onBack={() => setShowLogin(false)} />;
  }

  // 2. Referred Patient ID Entry
  if (assessmentType === 'doctor') {
    return (
      <div className={`max-w-md mx-auto p-10 rounded-[40px] border-2 shadow-2xl animate-in slide-in-from-bottom duration-500 ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
      }`}>
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-blue-50 rounded-full mx-auto flex items-center justify-center text-4xl mb-4 shadow-inner">🔑</div>
          <h2 className="text-2xl font-bold serif italic mb-2">{t.enter_unique_id}</h2>
          <p className="text-xs opacity-50 uppercase tracking-widest">{t.week_limit_msg}</p>
        </div>
        
        <div className="space-y-6">
          <input 
            type="text" 
            value={uniqueIdInput}
            onChange={(e) => setUniqueIdInput(e.target.value.toUpperCase())}
            placeholder="AM-XXXX-XXXX"
            className={`w-full p-5 rounded-2xl border-2 text-center font-mono text-xl tracking-widest focus:ring-4 transition-all outline-none ${
              darkMode ? 'bg-slate-800 border-slate-700 text-white focus:ring-blue-500/20' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-blue-500/10'
            }`}
          />
          {idError && <p className="text-red-500 text-center text-xs font-bold animate-shake">{t.unique_id_invalid}</p>}
          
          <button 
            onClick={handleIdFetch}
            disabled={isFetchingId || !uniqueIdInput}
            className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-white transition-all active:scale-95 shadow-xl ${
              isFetchingId ? 'bg-slate-500' : 'bg-blue-600 hover:bg-blue-500'
            }`}
          >
            {isFetchingId ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t.finding_id}
              </span>
            ) : t.fetch_chart}
          </button>

          <button onClick={() => setAssessmentType(null)} className="w-full text-center text-xs font-bold opacity-40 hover:opacity-100 transition-opacity">
            {t.back}
          </button>
        </div>
      </div>
    );
  }

  // 4. Assessment Path: 120-Point Form
  return (
    <div className={`max-w-4xl mx-auto rounded-[40px] shadow-2xl border transition-colors duration-300 overflow-hidden ${
      darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
    }`}>
      <div className={`${darkMode ? 'bg-slate-800' : 'bg-slate-900'} p-8 text-white`}>
        <div className="flex justify-between items-center mb-6">
          <button onClick={onCancel || (() => setAssessmentType(null))} className="p-2 hover:bg-white/10 rounded-full transition-colors">←</button>
          <div className="text-center">
            <h2 className="text-2xl font-bold serif italic">{t.questions_header}</h2>
            {isDoctorMode && <span className="text-[10px] uppercase font-black tracking-widest opacity-50">Patient: {patientName}</span>}
          </div>
          <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-emerald-500/30">
            {t.accuracy}: {progress}%
          </span>
        </div>
        
        <div className={`mb-6 flex items-center justify-between p-4 rounded-2xl border ${
          darkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-800/50 border-slate-700'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${location ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-300">
              {location ? t.loc_resolved : t.loc_required}
            </span>
          </div>
          {!location && (
            <button 
              onClick={requestLocation}
              disabled={loadingLocation}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase px-4 py-2 rounded-xl transition-all disabled:opacity-50"
            >
              {loadingLocation ? t.locating : t.enable_loc}
            </button>
          )}
        </div>

        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="mt-4 text-slate-400 text-sm flex justify-between">
          <span>{t.step} {currentPage + 1} {t.of} {totalPages}</span>
          <span>{filteredQuestions.length} {t.data_points}</span>
        </div>
      </div>

      <div className="p-8 md:p-12 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {currentQuestions.map((q) => (
            <div key={q.id} className="space-y-3">
              <p className={`text-sm font-semibold leading-tight h-10 overflow-hidden ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                {q.text[lang] || q.text.en}
              </p>
              <div className="flex flex-col gap-2">
                {q.type === 'text' ? (
                   <input
                     type="text"
                     value={answers[q.id] || ''}
                     onChange={(e) => handleAnswer(q.id, e.target.value)}
                     className={`w-full p-4 rounded-xl border-2 font-bold transition-all outline-none ${
                       darkMode 
                         ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' 
                         : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'
                     }`}
                     placeholder="..."
                   />
                ) : q.type === 'number' ? (
                   <input
                     type="number"
                     value={answers[q.id] || ''}
                     onChange={(e) => handleAnswer(q.id, e.target.value)}
                     className={`w-full p-4 rounded-xl border-2 font-bold transition-all outline-none ${
                       darkMode 
                         ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' 
                         : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'
                     }`}
                     placeholder="0"
                   />
                ) : q.type === 'date' ? (
                   <input
                     type="date"
                     value={answers[q.id] || ''}
                     onChange={(e) => handleAnswer(q.id, e.target.value)}
                     className={`w-full p-4 rounded-xl border-2 font-bold transition-all outline-none ${
                       darkMode 
                         ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' 
                         : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'
                     }`}
                   />
                ) : q.type === 'textarea' ? (
                    <textarea
                      value={answers[q.id] || ''}
                      onChange={(e) => handleAnswer(q.id, e.target.value)}
                      rows={4}
                      className={`w-full p-4 rounded-xl border-2 font-medium text-sm transition-all outline-none leading-relaxed ${
                        darkMode 
                          ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500 placeholder-slate-500' 
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 placeholder-slate-400 shadow-inner'
                      }`}
                      placeholder={lang === 'bn' ? "বিস্তারিত লিখুন..." : "Type details here..."}
                    />
                ) : q.type === 'file' ? (
                    <div className={`w-full p-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                        darkMode ? 'border-slate-700 bg-slate-800/50 hover:bg-slate-800' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
                    }`}>
                        <label className="cursor-pointer flex flex-col items-center w-full">
                            <span className="text-3xl mb-2 opacity-50">📎</span>
                            <span className={`text-xs font-bold uppercase tracking-widest mb-1 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                {answers[q.id] ? "Reports Attached" : "Choose Files"}
                            </span>
                            <input type="file" multiple onChange={(e) => handleFileUpload(e, q.id)} className="hidden" />
                            {answers[q.id] && <span className={`text-[10px] text-center mt-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{answers[q.id]}</span>}
                        </label>
                    </div>
                ) : (
                  q.options?.map((opt: any) => (
                    <button
                      key={opt.value}
                      onClick={() => handleAnswer(q.id, opt.value)}
                      className={`text-left px-4 py-2.5 rounded-xl border-2 text-sm transition-all ${
                        answers[q.id] === opt.value 
                          ? (darkMode ? 'border-emerald-500 bg-emerald-950/30 text-emerald-400 font-bold' : 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold')
                          : (darkMode ? 'border-slate-800 hover:border-slate-700 text-slate-400 bg-slate-800/50' : 'border-slate-50 hover:border-slate-200 text-slate-500 bg-slate-50/50')
                      }`}
                    >
                      {opt.label[lang] || opt.label.en}
                    </button>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        <div className={`pt-8 border-t flex flex-col md:flex-row gap-4 justify-between items-center ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <div className="flex gap-4 items-center">
            <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0} className={`px-6 py-3 font-bold disabled:opacity-0 transition ${darkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-800'}`}>← {t.back}</button>
            {user && !isDoctorMode && (
              <button onClick={() => onCancel?.()} className="text-xs font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">Skip for Now</button>
            )}
          </div>
          <button onClick={() => { if (currentPage < totalPages - 1) setCurrentPage(p => p + 1); else onComplete(constructProfile(), answers['basic_name'] || patientName); }} className={`w-full md:w-auto px-10 py-4 rounded-2xl font-bold shadow-xl transition-all active:scale-95 ${darkMode ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-emerald-600'}`}>{currentPage === totalPages - 1 ? t.finish : t.next} →</button>
        </div>
      </div>
    </div>
  );
};

export default AssessmentStep;
