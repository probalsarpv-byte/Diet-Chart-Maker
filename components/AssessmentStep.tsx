import React, { useState, useEffect } from 'react';
import {
  HealthProfile,
  Language,
  AssessmentAnalysis,
  User,
  ProfessionalProfile,
  ProfileRoleType,
  FamilyMember,
} from '../types';
import { ALL_QUESTIONS } from '../questions';
import { translations } from '../i18n';

interface Props {
  user?: User | null;
  initialRole?: ProfileRoleType | null;
  onComplete: (profile: HealthProfile, patientName?: string, createdUser?: User) => void;
  onLoginAsDoctor?: (user: User, doctorProfile?: HealthProfile) => void;
  onSelfLogin?: (user: User) => void;
  lang: Language;
  darkMode?: boolean;
  isDoctorMode?: boolean;
  onCancel?: () => void;
}

const QUESTIONS_PER_PAGE = 8;

const AssessmentStep: React.FC<Props> = ({
  user,
  initialRole,
  onComplete,
  onLoginAsDoctor,
  onSelfLogin,
  lang,
  darkMode,
  isDoctorMode,
  onCancel,
}) => {
  const t = translations[lang];
  const isBn = lang === 'bn';

  // Flow stage:
  // 'choose_role' -> 'profile_form' (for self, family, or doctor) -> 'assessment_questions' (or 'referral_id')
  const [selectedRole, setSelectedRole] = useState<ProfileRoleType | 'referral_id' | null>(() => {
    if (isDoctorMode) return 'self';
    if (initialRole) return initialRole;
    if (user?.profileType) return user.profileType;
    return null;
  });

  const [stepStage, setStepStage] = useState<'role_select' | 'profile_setup' | 'questions' | 'referral_id'>(() => {
    if (isDoctorMode) return 'questions';
    if (initialRole) return 'profile_setup';
    if (user) return 'questions';
    return 'role_select';
  });

  useEffect(() => {
    if (initialRole && !isDoctorMode) {
      setSelectedRole(initialRole);
      setStepStage('profile_setup');
    }
  }, [initialRole, isDoctorMode]);

  // Basic Profile fields for Self & Family
  const [fullName, setFullName] = useState(user?.name || '');
  const [emailOrPhone, setEmailOrPhone] = useState(user?.email || '');
  const [familyName, setFamilyName] = useState(user?.familyName || '');
  const [primaryRelation, setPrimaryRelation] = useState(isBn ? 'পরিবার প্রধান (Self)' : 'Family Head (Self)');

  // Doctor / Practitioner fields
  const [profProfile, setProfProfile] = useState<ProfessionalProfile>({
    fullName: user?.professionalProfile?.fullName || '',
    role: user?.professionalProfile?.role || 'Doctor',
    licenseNumber: user?.professionalProfile?.licenseNumber || '',
    specialty: user?.professionalProfile?.specialty || 'Clinical Nutrition & Metabolic Medicine',
    institution: user?.professionalProfile?.institution || '',
    experienceYears: user?.professionalProfile?.experienceYears || 5,
  });

  // Referral ID state
  const [uniqueIdInput, setUniqueIdInput] = useState('');
  const [isFetchingId, setIsFetchingId] = useState(false);
  const [idError, setIdError] = useState(false);

  // Assessment Question State
  const [currentPage, setCurrentPage] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | undefined>();
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [fileNames, setFileNames] = useState<string[]>([]);

  // Pending user created during step 1 before completing assessment
  const [pendingUser, setPendingUser] = useState<User | null>(user || null);

  const getFilteredQuestions = () => {
    const isFemale = answers['basic_gender'] === 'Female';
    const conditions = (answers['med_conditions'] || '').toLowerCase();
    const isDiabetic =
      conditions.includes('diabetes') ||
      conditions.includes('diab') ||
      conditions.includes('sugar') ||
      conditions.includes('insulin');

    return ALL_QUESTIONS.filter((q) => {
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

  const currentQuestions = filteredQuestions.slice(
    currentPage * QUESTIONS_PER_PAGE,
    (currentPage + 1) * QUESTIONS_PER_PAGE
  );

  const requestLocation = () => {
    setLoadingLocation(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
          setLoadingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLoadingLocation(false);
        }
      );
    } else {
      setLoadingLocation(false);
    }
  };

  const handleAnswer = (qId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, qId: string) => {
    if (e.target.files && e.target.files.length > 0) {
      const names = Array.from(e.target.files).map((f: File) => f.name);
      setFileNames(names);
      setAnswers((prev) => ({ ...prev, [qId]: names.join(', ') }));
    }
  };

  const progress = Math.round((Object.keys(answers).length / filteredQuestions.length) * 100);

  const calculateAnalysis = (): AssessmentAnalysis => {
    const vata = Object.values(answers).filter((v) => v === 'Vata' || v === 'a').length;
    const pitta = Object.values(answers).filter((v) => v === 'Pitta' || v === 'b').length;
    const kapha = Object.values(answers).filter((v) => v === 'Kapha' || v === 'c').length;
    const total = vata + pitta + kapha || 1;

    const digestionAns = Object.entries(answers).filter(([k]) => k.startsWith('digestion'));
    const microbiomeScore = 100 - digestionAns.filter(([_, v]) => v === 'c').length * 10;
    const metabolicAns = Object.entries(answers).filter(([k]) => k.startsWith('metabolism'));
    const insulinResistanceProb = metabolicAns.filter(([_, v]) => v === 'c').length;
    const inflamAns = Object.entries(answers).filter(([k]) => k.startsWith('inflammation'));
    const inflamScore =
      inflamAns.filter(([_, v]) => v === 'c').length * 2 + inflamAns.filter(([_, v]) => v === 'b').length;

    let calculatedAlkaline = 7.4 - inflamScore * 0.04 - insulinResistanceProb * 0.02;
    calculatedAlkaline = Math.max(6.9, Math.min(7.6, calculatedAlkaline));

    const dietImpactMsg = isBn
      ? 'আপনার বিস্তারিত খাদ্যাভ্যাসের বর্ণনাটি আমাদের ক্লিনিকাল ইঞ্জিন বিশ্লেষণ করছে। মেটাবলিক স্ট্রেস এবং ইনসুলিন স্পাইক শনাক্ত করে আপনার জন্য নিখুঁত পরিকল্পনা তৈরি করা হবে।'
      : 'Our clinical engine is analyzing your detailed dietary narrative to identify metabolic stressors and insulin spikes specific to your daily routine.';

    let healthSummary = '';
    if (isBn) {
      const inflamStatus = inflamScore > 8 ? 'উচ্চ সিস্টেমিক প্রদাহ' : 'ভাল কোষীয় প্রতিরোধ ক্ষমতা';
      healthSummary = `প্রোফাইল বিশ্লেষণে আপনার প্রধান দোষ এবং ${inflamStatus} পরিলক্ষিত হয়েছে।`;
    } else {
      healthSummary = `Profile synthesis suggests dominant Dosha with ${
        inflamScore > 8 ? 'high systemic inflammation' : 'good cellular resilience'
      }.`;
    }

    return {
      doshaBreakdown: {
        vata: Math.round((vata / total) * 100),
        pitta: Math.round((pitta / total) * 100),
        kapha: Math.round((kapha / total) * 100),
      },
      microbiomeStatus:
        microbiomeScore > 70
          ? isBn
            ? 'বৈচিত্র্যময় ও সুস্থ'
            : 'Diverse & Healthy'
          : microbiomeScore > 40
          ? isBn
            ? 'স্থবির'
            : 'Dysbiotic/Stagnant'
          : isBn
          ? 'সঙ্কটপূর্ণ'
          : 'Critically Depleted',
      metabolicEfficiency:
        insulinResistanceProb < 3
          ? isBn
            ? 'নমনীয়'
            : 'Highly Flexible'
          : insulinResistanceProb < 7
          ? isBn
            ? 'ইনসুলিন রেজিস্ট্যান্স'
            : 'Sluggish/Insulin Resistant'
          : isBn
          ? 'অকার্যকর'
          : 'Dysfunctional',
      inflammatoryStatus:
        inflamScore < 5
          ? isBn
            ? 'ন্যূনতম'
            : 'Minimal'
          : inflamScore < 12
          ? isBn
            ? 'দীর্ঘস্থায়ী'
            : 'Systemic/Chronic'
          : isBn
          ? 'উচ্চ ঝুঁকি'
          : 'Acute/High Risk',
      psychologicalProfile:
        vata > pitta && vata > kapha ? 'Anxious/Creative' : pitta > vata && pitta > kapha ? 'Driven/Intense' : 'Calm/Steady',
      alkalineScore: parseFloat(calculatedAlkaline.toFixed(2)),
      healthSummary,
      dietImpact: dietImpactMsg,
    };
  };

  const constructProfile = (isDoctorReferred = false): HealthProfile => {
    const analysis = calculateAnalysis();
    let dosha = 'Tridoshic';
    if (
      analysis.doshaBreakdown.vata > analysis.doshaBreakdown.pitta &&
      analysis.doshaBreakdown.vata > analysis.doshaBreakdown.kapha
    )
      dosha = 'Vata';
    else if (
      analysis.doshaBreakdown.pitta > analysis.doshaBreakdown.vata &&
      analysis.doshaBreakdown.pitta > analysis.doshaBreakdown.kapha
    )
      dosha = 'Pitta';
    else if (
      analysis.doshaBreakdown.kapha > analysis.doshaBreakdown.vata &&
      analysis.doshaBreakdown.kapha > analysis.doshaBreakdown.pitta
    )
      dosha = 'Kapha';

    return {
      age: parseInt(answers['basic_age']) || 35,
      gender: answers['basic_gender'] || 'Male',
      profession: answers['basic_profession'] || 'Professional',
      weight: parseInt(answers['basic_weight']) || 68,
      height: parseInt(answers['basic_height']) || 168,
      dosha,
      answers,
      microbiomeScore:
        analysis.microbiomeStatus.includes('Healthy') || analysis.microbiomeStatus.includes('সুস্থ') ? 85 : 55,
      metabolicType: analysis.metabolicEfficiency,
      inflammatoryIndex:
        analysis.inflammatoryStatus === 'Minimal' || analysis.inflammatoryStatus === 'ন্যূনতম' ? 2 : 6,
      alkalineBalance: analysis.alkalineScore > 7.3 ? 'Optimal' : 'Acidic',
      psychologicalProfile: analysis.psychologicalProfile,
      medications: answers['med_medications'] || 'Recorded',
      dietHistory: 'Narrative Recorded',
      medicalConditions: answers['med_conditions'] || '',
      currentMedicationsList: answers['med_medications'] || '',
      dietGoals: answers['med_targets'] || (isDoctorReferred ? '12-Week Clinical Protocol' : 'Metabolic Optimization'),
      medicalReportFiles: fileNames,
      analysis,
      location,
    };
  };

  const handleProfileStepContinue = () => {
    if (selectedRole === 'doctor') {
      const docName = profProfile.fullName.trim() || (isBn ? 'ডা. আরিফুল ইসলাম' : 'Dr. Ariful Islam');
      const finalProf: ProfessionalProfile = {
        ...profProfile,
        fullName: docName,
        licenseNumber: profProfile.licenseNumber.trim() || 'BMDC-48291',
        specialty: profProfile.specialty.trim() || 'Clinical Nutrition & Functional Medicine',
        institution: profProfile.institution.trim() || 'Precision Clinical Center',
      };
      const mockDoctor: User = {
        id: `DOC-${Math.floor(1000 + Math.random() * 9000)}`,
        name: docName,
        email: emailOrPhone || 'doctor@precision.com',
        isPro: true,
        profileType: 'doctor',
        trialStartDate: new Date().toISOString(),
        points: 150,
        badges: [],
        professionalProfile: finalProf,
      };
      setPendingUser(mockDoctor);
      setAnswers((prev) => ({ ...prev, basic_name: docName }));
      // Let doctor either go straight to assessment or complete clinical baseline
      setStepStage('questions');
      if (onSelfLogin) onSelfLogin(mockDoctor);
      return;
    }

    if (selectedRole === 'family') {
      const displayName = fullName.trim() || (isBn ? 'ফ্যামিলি মেম্বার' : 'Family Manager');
      const famTitle = familyName.trim() || `${displayName}${isBn ? '-এর পরিবার' : "'s Family"}`;
      const newFamilyUser: User = {
        id: `FAMUSER-${Math.floor(1000 + Math.random() * 9000)}`,
        name: displayName,
        email: emailOrPhone.trim() || 'family@precision.com',
        isPro: true,
        profileType: 'family',
        isFamilyManager: true,
        familyName: famTitle,
        familyMembers: [],
        trialStartDate: new Date().toISOString(),
        points: 100,
        badges: [],
      };
      setPendingUser(newFamilyUser);
      setAnswers((prev) => ({ ...prev, basic_name: displayName }));
      if (onSelfLogin) onSelfLogin(newFamilyUser);
      setStepStage('questions');
      return;
    }

    // Default: 'self'
    const displayName = fullName.trim() || (isBn ? 'ব্যক্তিগত ইউজার' : 'Personal User');
    const newSelfUser: User = {
      id: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
      name: displayName,
      email: emailOrPhone.trim() || 'user@precision.com',
      isPro: true,
      profileType: 'self',
      trialStartDate: new Date().toISOString(),
      points: 100,
      badges: [],
    };
    setPendingUser(newSelfUser);
    setAnswers((prev) => ({ ...prev, basic_name: displayName }));
    if (onSelfLogin) onSelfLogin(newSelfUser);
    setStepStage('questions');
  };

  const handleDoctorInstantLaunch = () => {
    const docName = profProfile.fullName.trim() || (isBn ? 'ডা. আরিফুল ইসলাম' : 'Dr. Ariful Islam');
    const finalProf: ProfessionalProfile = {
      ...profProfile,
      fullName: docName,
      licenseNumber: profProfile.licenseNumber.trim() || 'BMDC-48291',
      specialty: profProfile.specialty.trim() || 'Clinical Nutrition & Functional Medicine',
      institution: profProfile.institution.trim() || 'Precision Clinical Center',
    };
    const mockDoctor: User = {
      id: `DOC-${Math.floor(1000 + Math.random() * 9000)}`,
      name: docName,
      email: emailOrPhone || 'doctor@precision.com',
      isPro: true,
      profileType: 'doctor',
      trialStartDate: new Date().toISOString(),
      points: 150,
      badges: [],
      professionalProfile: finalProf,
    };
    const docProfile = constructProfile(false);
    if (onLoginAsDoctor) {
      onLoginAsDoctor(mockDoctor, docProfile);
    } else {
      onComplete(docProfile, docName, mockDoctor);
    }
  };

  const handleFinishAssessment = () => {
    const finalProfile = constructProfile(false);
    const resolvedName =
      answers['basic_name'] || fullName.trim() || pendingUser?.name || (isBn ? 'রোগী' : 'Patient');

    let finalUser: User | undefined = pendingUser ? { ...pendingUser, name: resolvedName } : undefined;

    if (!isDoctorMode && !finalUser) {
      finalUser = {
        id: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
        name: resolvedName,
        email: emailOrPhone || 'user@precision.com',
        isPro: true,
        profileType: (selectedRole as ProfileRoleType) || 'self',
        trialStartDate: new Date().toISOString(),
        points: 100,
        badges: [],
      };
    }

    if (finalUser && finalUser.profileType === 'family') {
      const primaryMember: FamilyMember = {
        id: `FAM-${Date.now()}`,
        name: resolvedName,
        relation: primaryRelation || (isBn ? 'পরিবার প্রধান' : 'Self'),
        profile: finalProfile,
      };
      finalUser = {
        ...finalUser,
        isFamilyManager: true,
        familyName: familyName.trim() || `${resolvedName}${isBn ? '-এর পরিবার' : "'s Family"}`,
        familyMembers: [primaryMember],
      };
    }

    onComplete(finalProfile, resolvedName, finalUser);
  };

  const handleIdFetch = () => {
    setIsFetchingId(true);
    setIdError(false);
    setTimeout(() => {
      if (uniqueIdInput.startsWith('AM-') && uniqueIdInput.length > 6) {
        const fakeProfile = constructProfile(true);
        const refUser: User = {
          id: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
          name: isBn ? 'রেফার্ড পেশেন্ট' : 'Referred Patient',
          email: 'patient@precision.com',
          isPro: true,
          profileType: 'self',
          trialStartDate: new Date().toISOString(),
          points: 100,
          badges: [],
        };
        onComplete(
          {
            ...fakeProfile,
            age: 38,
            gender: 'Male',
            dosha: 'Pitta',
            medicalConditions: 'T2 Diabetes, High BP',
          },
          refUser.name,
          refUser
        );
      } else {
        setIdError(true);
      }
      setIsFetchingId(false);
    }, 1000);
  };

  // ============================================================================
  // STAGE 1: 3 PROFILE ROLES SELECTION (নিজের জন্য, ফ্যামিলির জন্য, ডাক্তার হিসেবে)
  // ============================================================================
  if (stepStage === 'role_select' && !isDoctorMode) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 py-4 animate-in zoom-in duration-300">
        <div className="text-center space-y-2 mb-8">
          <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            {isBn ? 'ধাপ ১: প্রোফাইল নির্বাচন করুন' : 'Step 1: Choose Your Profile Type'}
          </span>
          <h2 className={`text-2xl md:text-4xl font-bold serif italic ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            {isBn ? 'আপনি কোন ধরনের প্রোফাইল তৈরি করতে চান?' : 'Select Your Profile Interface'}
          </h2>
          <p className={`text-xs md:text-sm max-w-xl mx-auto ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            {isBn
              ? 'আমাদের অ্যাপে ৩ ধরনের প্রোফাইল ও ৩ ধরনের ডেডিকেটেড ইন্টারফেস রয়েছে। প্রোফাইল ও অ্যাসেসমেন্ট সম্পন্ন করলেই ডায়েট মেকারের সব ফিচার আনলক হবে।'
              : 'Choose from 3 specialized profile types, each unlocking its own dedicated interface plus full access to the Diet Maker.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Option 1: নিজের জন্য (Self) */}
          <button
            onClick={() => {
              setSelectedRole('self');
              setStepStage('profile_setup');
            }}
            className={`p-6 md:p-7 rounded-[32px] border-2 text-left flex flex-col justify-between transition-all hover:-translate-y-1 hover:border-emerald-500 active:scale-95 shadow-lg ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
            }`}
          >
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-3xl shadow-lg">
                👤
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500">
                  {isBn ? 'প্রোফাইল ১ • ব্যক্তিগত' : 'Profile 1 • Individual'}
                </span>
                <h3 className={`text-xl font-bold serif italic mt-1 mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {isBn ? 'নিজের জন্য (For Myself)' : 'For Myself (Personal)'}
                </h3>
                <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  {isBn
                    ? 'আপনার নিজের শারীরিক কন্ডিশন বিশ্লেষণ, ট্রাফিক লাইট ফুড গাইড, পার্সোনাল ডায়েট চার্ট, কুকবুক ও ডেইলি চেক লিস্ট ইন্টারফেস।'
                    : 'Personal health bio-dashboard, clinical Traffic Light food guide, 4-phase diet chart, cookbook, and daily checklist.'}
                </p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span>{isBn ? 'নিজের প্রোফাইল করুন' : 'Create Personal Profile'}</span>
              <span>→</span>
            </div>
          </button>

          {/* Option 2: ফ্যামিলির জন্য (Family) */}
          <button
            onClick={() => {
              setSelectedRole('family');
              setStepStage('profile_setup');
            }}
            className={`p-6 md:p-7 rounded-[32px] border-2 text-left flex flex-col justify-between transition-all hover:-translate-y-1 hover:border-purple-500 active:scale-95 shadow-lg ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
            }`}
          >
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-purple-600 text-white flex items-center justify-center text-3xl shadow-lg">
                👨‍👩‍👧‍👦
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-500">
                  {isBn ? 'প্রোফাইল ২ • পারিবারিক' : 'Profile 2 • Household'}
                </span>
                <h3 className={`text-xl font-bold serif italic mt-1 mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {isBn ? 'ফ্যামিলির জন্য (For Family)' : 'For Family (Household)'}
                </h3>
                <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  {isBn
                    ? 'পরিবারের একাধিক সদস্যের অ্যাসেসমেন্ট, এক হাঁড়িতে রান্না (ফ্যামিলি পট) এবং সবার কন্ডিশন অনুযায়ী সমন্বিত ফ্যামিলি ডায়েট ইন্টারফেস।'
                    : 'Family manager dashboard to add household members, generate unified family diet charts, and manage Family Pot meals.'}
                </p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-purple-600 dark:text-purple-400">
              <span>{isBn ? 'ফ্যামিলি প্রোফাইল করুন' : 'Create Family Profile'}</span>
              <span>→</span>
            </div>
          </button>

          {/* Option 3: ডাক্তার হিসেবে (Doctor) */}
          <button
            onClick={() => {
              setSelectedRole('doctor');
              setStepStage('profile_setup');
            }}
            className={`p-6 md:p-7 rounded-[32px] border-2 text-left flex flex-col justify-between transition-all hover:-translate-y-1 hover:border-blue-500 active:scale-95 shadow-lg ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
            }`}
          >
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-3xl shadow-lg">
                🩺
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-500">
                  {isBn ? 'প্রোফাইল ৩ • ক্লিনিকাল' : 'Profile 3 • Practitioner'}
                </span>
                <h3 className={`text-xl font-bold serif italic mt-1 mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {isBn ? 'ডাক্তার হিসেবে (As a Doctor)' : 'As a Doctor / Nutritionist'}
                </h3>
                <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  {isBn
                    ? 'ডাক্তার ও নিউট্রিশনিস্টদের জন্য ডেডিকেটেড ক্লিনিকাল ইন্টারফেস: রোগী যুক্ত করা, প্রেসক্রিপশন চার্ট তৈরি ও ডেইলি কমপ্লায়েন্স ট্র্যাকিং।'
                    : 'Dedicated practitioner workspace to register patients, review clinical analysis, and monitor daily patient compliance.'}
                </p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
              <span>{isBn ? 'ডাক্তার প্রোফাইল করুন' : 'Create Doctor Profile'}</span>
              <span>→</span>
            </div>
          </button>
        </div>

        {/* Secondary Option: Doctor Referral ID */}
        <div
          className={`p-5 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
            darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200/80'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <span className="text-2xl">🆔</span>
            <div>
              <div className="text-xs font-bold">
                {isBn ? 'ডাক্তারের দেওয়া হেলথ আইডি (Health ID) আছে?' : 'Have a Doctor Referral Health ID?'}
              </div>
              <div className="text-[11px] opacity-60">
                {isBn
                  ? 'আপনার ডাক্তারের দেওয়া AM-XXXX কোড দিয়ে সরাসরি আপনার ডায়েট চার্ট লোড করুন।'
                  : 'Load your clinical plan directly using the unique AM-XXXX ID from your physician.'}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedRole('referral_id');
              setStepStage('referral_id');
            }}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shrink-0"
          >
            {isBn ? 'হেলথ আইডি দিন' : 'Enter Health ID'}
          </button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // STAGE 2: PROFILE CREATION FORM (Tailored to Self, Family, or Doctor)
  // ============================================================================
  if (stepStage === 'profile_setup' && !isDoctorMode) {
    if (selectedRole === 'doctor') {
      return (
        <div
          className={`max-w-2xl mx-auto p-6 md:p-10 rounded-[36px] border shadow-2xl animate-in slide-in-from-bottom duration-300 ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          }`}
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl mx-auto flex items-center justify-center text-3xl mb-3 shadow-lg">
              🩺
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">
              {isBn ? 'ডাক্তার / নিউট্রিশনিস্ট প্রোফাইল' : 'Practitioner Profile Setup'}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold serif italic mt-1">
              {isBn ? 'ডাক্তার হিসেবে প্রোফাইল তৈরি করুন' : t.prof_reg_title}
            </h2>
            <p className="text-xs opacity-60 mt-1">
              {isBn
                ? 'রোগীদের ডায়েট চার্ট তৈরি ও ক্লিনিকাল ড্যাশবোর্ড ব্যবহারের জন্য আপনার তথ্য দিন।'
                : t.prof_reg_subtitle}
            </p>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider opacity-70 px-1">
                  {isBn ? 'পূর্ণ নাম (ডা.)' : t.prof_full_name}
                </label>
                <input
                  type="text"
                  value={profProfile.fullName}
                  onChange={(e) => setProfProfile({ ...profProfile, fullName: e.target.value })}
                  className={`w-full p-3.5 rounded-2xl border-2 outline-none focus:border-blue-500 transition-all ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                  placeholder={isBn ? 'যেমন: ডা. আরিফুল ইসলাম' : 'e.g. Dr. Ariful Islam'}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider opacity-70 px-1">
                  {isBn ? 'পেশাগত ভূমিকা' : t.prof_role}
                </label>
                <select
                  value={profProfile.role}
                  onChange={(e) => setProfProfile({ ...profProfile, role: e.target.value as any })}
                  className={`w-full p-3.5 rounded-2xl border-2 outline-none focus:border-blue-500 transition-all ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <option value="Doctor">{isBn ? 'ডাক্তার (Clinical Doctor)' : t.prof_doc}</option>
                  <option value="Nutritionist">{isBn ? 'নিউট্রিশনিস্ট / ডায়েটিশিয়ান' : t.prof_nutri}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider opacity-70 px-1">
                  {isBn ? 'বিএমডিসি / রেজিস্ট্রেশন নম্বর' : t.prof_license}
                </label>
                <input
                  type="text"
                  value={profProfile.licenseNumber}
                  onChange={(e) => setProfProfile({ ...profProfile, licenseNumber: e.target.value })}
                  className={`w-full p-3.5 rounded-2xl border-2 outline-none focus:border-blue-500 transition-all ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                  placeholder="BMDC Reg #123456"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider opacity-70 px-1">
                  {isBn ? 'বিশেষজ্ঞতা (Specialty)' : t.prof_specialty}
                </label>
                <input
                  type="text"
                  value={profProfile.specialty}
                  onChange={(e) => setProfProfile({ ...profProfile, specialty: e.target.value })}
                  className={`w-full p-3.5 rounded-2xl border-2 outline-none focus:border-blue-500 transition-all ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                  placeholder={isBn ? 'যেমন: ফাংশনাল মেডিসিন ও মেটাবলিক নিউট্রিশন' : 'e.g. Functional Medicine'}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider opacity-70 px-1">
                  {isBn ? 'চেম্বার / হাসপাতাল / প্রতিষ্ঠান' : t.prof_institution}
                </label>
                <input
                  type="text"
                  value={profProfile.institution}
                  onChange={(e) => setProfProfile({ ...profProfile, institution: e.target.value })}
                  className={`w-full p-3.5 rounded-2xl border-2 outline-none focus:border-blue-500 transition-all ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                  placeholder={isBn ? 'যেমন: স্কয়ার হাসপাতাল / প্রিসিশন ক্লিনিক' : 'e.g. Square Hospital'}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider opacity-70 px-1">
                  {isBn ? 'অভিজ্ঞতা (বছর)' : t.prof_experience}
                </label>
                <input
                  type="number"
                  value={profProfile.experienceYears || ''}
                  onChange={(e) => setProfProfile({ ...profProfile, experienceYears: parseInt(e.target.value) || 0 })}
                  className={`w-full p-3.5 rounded-2xl border-2 outline-none focus:border-blue-500 transition-all ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                  placeholder="5"
                />
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <button
                onClick={handleDoctorInstantLaunch}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-sm shadow-xl active:scale-95 transition-all"
              >
                {isBn
                  ? '🩺 ডাক্তার ড্যাশবোর্ড ও ক্লিনিকাল ইন্টারফেস খুলুন →'
                  : '🩺 Open Doctor Interface & Clinical Workspace →'}
              </button>
              <button
                onClick={handleProfileStepContinue}
                className={`w-full py-3.5 rounded-2xl font-bold text-xs border transition-all ${
                  darkMode
                    ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {isBn
                  ? 'অথবা প্রথমে অ্যাসেসমেন্ট ফর্ম পূরণ করে ডায়েট মেকার আনলক করুন →'
                  : 'Or Complete Clinical Assessment Form First →'}
              </button>
              <button
                onClick={() => setStepStage('role_select')}
                className="w-full text-center text-xs font-bold opacity-50 hover:opacity-100 py-2"
              >
                ← {isBn ? 'প্রোফাইল ধরন পরিবর্তন করুন' : t.back}
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Self or Family Profile Setup
    const isFamily = selectedRole === 'family';
    return (
      <div
        className={`max-w-xl mx-auto p-6 md:p-10 rounded-[36px] border shadow-2xl animate-in slide-in-from-bottom duration-300 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
        }`}
      >
        <div className="text-center mb-8">
          <div
            className={`w-16 h-16 ${
              isFamily ? 'bg-purple-600' : 'bg-emerald-600'
            } text-white rounded-2xl mx-auto flex items-center justify-center text-3xl mb-3 shadow-lg`}
          >
            {isFamily ? '👨‍👩‍👧‍👦' : '👤'}
          </div>
          <span
            className={`text-[10px] font-black uppercase tracking-widest ${
              isFamily ? 'text-purple-500' : 'text-emerald-500'
            }`}
          >
            {isFamily
              ? isBn
                ? 'ফ্যামিলির জন্য প্রোফাইল (Family Profile)'
                : 'Family Profile Setup'
              : isBn
              ? 'নিজের জন্য প্রোফাইল (Personal Profile)'
              : 'Personal Profile Setup'}
          </span>
          <h2 className="text-2xl md:text-3xl font-bold serif italic mt-1">
            {isFamily
              ? isBn
                ? 'ফ্যামিলি প্রোফাইল তৈরি করুন'
                : 'Create Your Family Profile'
              : isBn
              ? 'নিজের প্রোফাইল তৈরি করুন'
              : 'Create Your Personal Profile'}
          </h2>
          <p className="text-xs opacity-60 mt-1">
            {isBn
              ? 'প্রোফাইল তথ্যের পর আপনি ক্লিনিকাল অ্যাসেসমেন্ট ফর্মটি পূরণ করবেন, যা আপনার ডায়েট মেকার আনলক করবে।'
              : 'After entering your basic profile details, complete the clinical assessment to unlock Diet Maker.'}
          </p>
        </div>

        <div className="space-y-4">
          {isFamily && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider opacity-70 px-1">
                {isBn ? 'পরিবারের নাম (Family Name)' : 'Family Name'}
              </label>
              <input
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                className={`w-full p-3.5 rounded-2xl border-2 outline-none focus:border-purple-500 transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                }`}
                placeholder={isBn ? 'যেমন: রহমান পরিবার (Rahman Family)' : 'e.g. Rahman Family'}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider opacity-70 px-1">
              {isFamily
                ? isBn
                  ? 'আপনার নাম (ফ্যামিলি ম্যানেজার / প্রধান সদস্য)'
                  : 'Your Name (Primary Member)'
                : isBn
                ? 'আপনার পূর্ণ নাম'
                : 'Your Full Name'}
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={`w-full p-3.5 rounded-2xl border-2 outline-none focus:border-emerald-500 transition-all ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
              }`}
              placeholder={isBn ? 'আপনার নাম লিখুন...' : 'Enter your name...'}
            />
          </div>

          {isFamily && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider opacity-70 px-1">
                {isBn ? 'পরিবারে আপনার সম্পর্ক' : 'Your Relation in Family'}
              </label>
              <input
                type="text"
                value={primaryRelation}
                onChange={(e) => setPrimaryRelation(e.target.value)}
                className={`w-full p-3.5 rounded-2xl border-2 outline-none focus:border-purple-500 transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                }`}
                placeholder={isBn ? 'যেমন: বাবা / মা / নিজে' : 'e.g. Father / Mother / Self'}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider opacity-70 px-1">
              {isBn ? 'ইমেইল অথবা মোবাইল নম্বর (ঐচ্ছিক)' : 'Email or Phone (Optional)'}
            </label>
            <input
              type="text"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              className={`w-full p-3.5 rounded-2xl border-2 outline-none focus:border-emerald-500 transition-all ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
              }`}
              placeholder="name@example.com / 017XXXXXXXX"
            />
          </div>

          <div className="pt-4 space-y-3">
            <button
              onClick={handleProfileStepContinue}
              className={`w-full py-4 rounded-2xl font-bold text-sm text-white shadow-xl active:scale-95 transition-all ${
                isFamily ? 'bg-purple-600 hover:bg-purple-500' : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              {isBn
                ? 'প্রোফাইল সেভ করে অ্যাসেসমেন্ট ফর্মে যান →'
                : 'Save Profile & Continue to Assessment Form →'}
            </button>
            <button
              onClick={() => setStepStage('role_select')}
              className="w-full text-center text-xs font-bold opacity-50 hover:opacity-100 py-2"
            >
              ← {isBn ? 'প্রোফাইল ধরন পরিবর্তন করুন' : t.back}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // STAGE 3: REFERRED PATIENT HEALTH ID ENTRY
  // ============================================================================
  if (stepStage === 'referral_id') {
    return (
      <div
        className={`max-w-md mx-auto p-10 rounded-[40px] border-2 shadow-2xl animate-in slide-in-from-bottom duration-500 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
        }`}
      >
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-blue-50 rounded-full mx-auto flex items-center justify-center text-4xl mb-4 shadow-inner">
            🔑
          </div>
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
              darkMode
                ? 'bg-slate-800 border-slate-700 text-white focus:ring-blue-500/20'
                : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-blue-500/10'
            }`}
          />
          {idError && <p className="text-red-500 text-center text-xs font-bold">{t.unique_id_invalid}</p>}

          <button
            onClick={handleIdFetch}
            disabled={isFetchingId || !uniqueIdInput}
            className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-white transition-all active:scale-95 shadow-xl ${
              isFetchingId ? 'bg-slate-500' : 'bg-blue-600 hover:bg-blue-500'
            }`}
          >
            {isFetchingId ? t.finding_id : t.fetch_chart}
          </button>

          <button
            onClick={() => setStepStage('role_select')}
            className="w-full text-center text-xs font-bold opacity-40 hover:opacity-100 transition-opacity"
          >
            {t.back}
          </button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // STAGE 4: CLINICAL ASSESSMENT FORM (120-Point Mapping)
  // ============================================================================
  return (
    <div
      className={`max-w-4xl mx-auto rounded-[40px] shadow-2xl border transition-colors duration-300 overflow-hidden ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
      }`}
    >
      <div className={`${darkMode ? 'bg-slate-800' : 'bg-slate-900'} p-6 md:p-8 text-white`}>
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={onCancel || (() => setStepStage('profile_setup'))}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            ←
          </button>
          <div className="text-center">
            <div className="text-[10px] uppercase font-black tracking-widest text-emerald-400 mb-0.5">
              {selectedRole === 'family'
                ? isBn
                  ? '👨‍👩‍👧‍👦 ফ্যামিলি প্রোফাইল অ্যাসেসমেন্ট'
                  : '👨‍👩‍👧‍👦 Family Profile Assessment'
                : selectedRole === 'doctor'
                ? isBn
                  ? '🩺 ডাক্তার প্রোফাইল অ্যাসেসমেন্ট'
                  : '🩺 Doctor Clinical Assessment'
                : isBn
                ? '👤 নিজের প্রোফাইল অ্যাসেসমেন্ট'
                : '👤 Personal Clinical Assessment'}
            </div>
            <h2 className="text-xl md:text-2xl font-bold serif italic">{t.questions_header}</h2>
          </div>
          <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-emerald-500/30">
            {t.accuracy}: {progress}%
          </span>
        </div>

        <div
          className={`mb-6 flex items-center justify-between p-4 rounded-2xl border ${
            darkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-800/50 border-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${location ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
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
          <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-4 text-slate-400 text-xs md:text-sm flex justify-between items-center">
          <span>
            {t.step} {currentPage + 1} {t.of} {totalPages}
          </span>
          <button
            onClick={handleFinishAssessment}
            className="text-emerald-400 hover:text-emerald-300 font-bold underline text-xs"
          >
            {isBn ? '⚡ দ্রুত সম্পন্ন করুন (Quick Complete)' : '⚡ Quick Complete Assessment'}
          </button>
        </div>
      </div>

      <div className="p-6 md:p-10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {currentQuestions.map((q) => (
            <div key={q.id} className="space-y-2.5">
              <p
                className={`text-sm font-semibold leading-snug min-h-[2.5rem] ${
                  darkMode ? 'text-slate-200' : 'text-slate-700'
                }`}
              >
                {q.text[lang] || q.text.en}
              </p>
              <div className="flex flex-col gap-2">
                {q.type === 'text' ? (
                  <input
                    type="text"
                    value={answers[q.id] || ''}
                    onChange={(e) => handleAnswer(q.id, e.target.value)}
                    className={`w-full p-3.5 rounded-xl border-2 font-bold transition-all outline-none ${
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
                    className={`w-full p-3.5 rounded-xl border-2 font-bold transition-all outline-none ${
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
                    className={`w-full p-3.5 rounded-xl border-2 font-bold transition-all outline-none ${
                      darkMode
                        ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'
                    }`}
                  />
                ) : q.type === 'textarea' ? (
                  <textarea
                    value={answers[q.id] || ''}
                    onChange={(e) => handleAnswer(q.id, e.target.value)}
                    rows={3}
                    className={`w-full p-3.5 rounded-xl border-2 font-medium text-sm transition-all outline-none leading-relaxed ${
                      darkMode
                        ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500 placeholder-slate-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 placeholder-slate-400 shadow-inner'
                    }`}
                    placeholder={isBn ? 'বিস্তারিত লিখুন...' : 'Type details here...'}
                  />
                ) : q.type === 'file' ? (
                  <div
                    className={`w-full p-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                      darkMode
                        ? 'border-slate-700 bg-slate-800/50 hover:bg-slate-800'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
                    }`}
                  >
                    <label className="cursor-pointer flex flex-col items-center w-full">
                      <span className="text-2xl mb-1 opacity-50">📎</span>
                      <span
                        className={`text-xs font-bold uppercase tracking-widest ${
                          darkMode ? 'text-emerald-400' : 'text-emerald-600'
                        }`}
                      >
                        {answers[q.id] ? 'Reports Attached' : 'Choose Files'}
                      </span>
                      <input type="file" multiple onChange={(e) => handleFileUpload(e, q.id)} className="hidden" />
                      {answers[q.id] && (
                        <span className={`text-[10px] text-center mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {answers[q.id]}
                        </span>
                      )}
                    </label>
                  </div>
                ) : (
                  q.options?.map((opt: any) => (
                    <button
                      key={opt.value}
                      onClick={() => handleAnswer(q.id, opt.value)}
                      className={`text-left px-4 py-2.5 rounded-xl border-2 text-sm transition-all ${
                        answers[q.id] === opt.value
                          ? darkMode
                            ? 'border-emerald-500 bg-emerald-950/30 text-emerald-400 font-bold'
                            : 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold'
                          : darkMode
                          ? 'border-slate-800 hover:border-slate-700 text-slate-400 bg-slate-800/50'
                          : 'border-slate-100 hover:border-slate-200 text-slate-600 bg-slate-50/50'
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

        <div
          className={`pt-6 border-t flex flex-col sm:flex-row gap-4 justify-between items-center ${
            darkMode ? 'border-slate-800' : 'border-slate-100'
          }`}
        >
          <div className="flex gap-4 items-center">
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className={`px-5 py-3 font-bold disabled:opacity-30 transition ${
                darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              ← {t.back}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {currentPage < totalPages - 1 && (
              <button
                onClick={handleFinishAssessment}
                className={`px-6 py-3.5 rounded-2xl font-bold text-xs border transition-all ${
                  darkMode
                    ? 'border-emerald-700/60 text-emerald-400 hover:bg-emerald-950/40'
                    : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                {isBn ? '✓ অ্যাসেসমেন্ট সম্পন্ন করুন' : '✓ Finish & Unlock Now'}
              </button>
            )}
            <button
              onClick={() => {
                if (currentPage < totalPages - 1) setCurrentPage((p) => p + 1);
                else handleFinishAssessment();
              }}
              className={`px-8 py-4 rounded-2xl font-bold shadow-xl transition-all active:scale-95 ${
                darkMode ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-emerald-600'
              }`}
            >
              {currentPage === totalPages - 1 ? t.finish : t.next} →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentStep;
