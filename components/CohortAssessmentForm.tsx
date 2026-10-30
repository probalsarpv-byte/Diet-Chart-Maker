import React, { useState, useMemo } from 'react';
import {
  HealthProfile,
  CohortType,
  Language,
  CohortLabMarker,
  User,
} from '../types';
import { COHORT_LAB_MARKERS } from '../data/cohortData';
import {
  getUnifiedAssessmentTabs,
  computeUnifiedClinicalAnalysis,
  UnifiedQuestion,
} from '../data/unifiedAssessmentQuestions';
import { CohortDietEngine } from '../services/cohortDietEngine';
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  FileSpreadsheet,
  Sparkles,
  Ruler,
  Scale,
  Paperclip,
  Wand2,
} from 'lucide-react';
import CrossBorderCuisineBar from './CrossBorderCuisineBar';
import { loadStoredCrossBorderPrefs } from '../services/crossBorderFoodEquivalenceService';

interface Props {
  cohort: CohortType;
  initialPregnancyMonth?: number;
  user: User | null;
  lang: Language;
  darkMode?: boolean;
  onComplete: (profile: HealthProfile) => void;
  onBackToCohortSelect: () => void;
}

export const CohortAssessmentForm: React.FC<Props> = ({
  cohort,
  initialPregnancyMonth = 3,
  user,
  lang,
  darkMode,
  onComplete,
  onBackToCohortSelect,
}) => {
  const isBn = lang === 'bn';
  const labMarkers: CohortLabMarker[] = COHORT_LAB_MARKERS[cohort] || [];

  // Initialize answers with sensible defaults for name & cohort context
  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    const init: Record<string, any> = {
      basic_name: user?.name || '',
      basic_gender: cohort === 'pregnancy_lactation' ? 'Female' : 'Female',
    };
    if (cohort === 'pregnancy_lactation') {
      init['preg_stage'] = `m${initialPregnancyMonth}`;
      init['shakti_cycle_length'] = '0';
      init['shakti_flow_pain'] = 'not_applicable';
    }
    if (cohort === 'child_pediatric') {
      init['basic_age'] = '6';
      init['basic_gender'] = 'Male';
    }
    return init;
  });

  // Feet & Inches helper state for Height (cm)
  const [feetInput, setFeetInput] = useState<string>(cohort === 'child_pediatric' ? '3' : '5');
  const [inchInput, setInchInput] = useState<string>(cohort === 'child_pediatric' ? '8' : '4');

  const [labValues, setLabValues] = useState<Record<string, string>>({});
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const currentGender = String(answers['basic_gender'] || 'Female');

  // Dynamically build the unified category tabs (38–44 questions for adults/cohorts, 32 for children)
  const tabs = useMemo(
    () => getUnifiedAssessmentTabs(cohort, currentGender),
    [cohort, currentGender]
  );

  const safeTabIndex = Math.min(activeTabIndex, tabs.length - 1);
  const currentTab = tabs[safeTabIndex];

  // Calculate total questions & answered count across all active tabs
  const { totalQuestionsCount, answeredQuestionsCount, globalQuestionStartIndex } = useMemo(() => {
    let total = 0;
    let answered = 0;
    let startIdx = 0;

    tabs.forEach((tab, idx) => {
      if (idx < safeTabIndex) {
        startIdx += tab.questions.length;
      }
      tab.questions.forEach((q) => {
        total += 1;
        const v = answers[q.id];
        if (Array.isArray(v) ? v.length > 0 : v !== undefined && String(v).trim() !== '') {
          answered += 1;
        }
      });
    });

    return {
      totalQuestionsCount: total,
      answeredQuestionsCount: answered,
      globalQuestionStartIndex: startIdx,
    };
  }, [tabs, answers, safeTabIndex]);

  // Live BMI & IBW preview when height & weight are entered
  const bmiPreview = useMemo(() => {
    const h = parseFloat(String(answers['basic_height'] || ''));
    const w = parseFloat(String(answers['basic_weight'] || ''));
    if (!h || !w || h < 50 || w < 5) return null;
    const bmi = w / Math.pow(h / 100, 2);
    const ibw = Math.round(22 * Math.pow(h / 100, 2));
    let statusBn = 'স্বাভাবিক ওজন (Normal)';
    let statusEn = 'Optimal Weight';
    let colorClass = 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30';

    if (bmi < 18.5) {
      statusBn = 'কম ওজন (Underweight)';
      statusEn = 'Underweight';
      colorClass = 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30';
    } else if (bmi >= 23 && bmi < 27.5) {
      statusBn = 'অতিরিক্ত ওজন (Asian Overweight)';
      statusEn = 'Overweight (Asian Cutoff)';
      colorClass = 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30';
    } else if (bmi >= 27.5) {
      statusBn = 'স্থূলতা / মেটাবলিক ঝুঁকি (Obese)';
      statusEn = 'Obese / High Metabolic Risk';
      colorClass = 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30';
    }

    return {
      bmi: bmi.toFixed(1),
      ibw,
      statusBn,
      statusEn,
      colorClass,
    };
  }, [answers['basic_height'], answers['basic_weight']]);

  const applyFeetInchesToCm = (ftStr: string, inStr: string) => {
    const ft = parseInt(ftStr || '0', 10) || 0;
    const inc = parseInt(inStr || '0', 10) || 0;
    const totalCm = Math.round((ft * 12 + inc) * 2.54);
    if (totalCm >= 50 && totalCm <= 230) {
      setAnswers((prev) => ({ ...prev, basic_height: String(totalCm) }));
    }
  };

  const handleTextOrNumberChange = (qId: string, val: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  const handleSelectRadio = (questionId: string, val: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: val }));
  };

  const handleToggleCheckbox = (questionId: string, val: string) => {
    setAnswers((prev) => {
      const currentList: string[] = Array.isArray(prev[questionId]) ? prev[questionId] : [];
      let updated: string[];
      if (val === 'none') {
        updated = ['none'];
      } else {
        const withoutNone = currentList.filter((x) => x !== 'none');
        if (withoutNone.includes(val)) {
          updated = withoutNone.filter((x) => x !== val);
        } else {
          updated = [...withoutNone, val];
        }
      }
      return { ...prev, [questionId]: updated };
    });
  };

  const handleQuickChipAppend = (qId: string, chipVal: string) => {
    setAnswers((prev) => {
      const existing = String(prev[qId] || '').trim();
      if (!existing) return { ...prev, [qId]: chipVal };
      if (existing.includes(chipVal)) return prev;
      return { ...prev, [qId]: `${existing}, ${chipVal}` };
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, qId: string) => {
    if (e.target.files && e.target.files.length > 0) {
      const names = Array.from(e.target.files).map((f: File) => f.name);
      setUploadedFiles(names);
      setAnswers((prev) => ({ ...prev, [qId]: names.join(', ') }));
    }
  };

  const handleLabChange = (id: string, val: string) => {
    setLabValues((prev) => ({ ...prev, [id]: val }));
  };

  const getLabMarkerStatus = (marker: CohortLabMarker, valStr: string) => {
    if (!valStr || valStr.trim() === '') return null;
    const num = parseFloat(valStr);
    if (isNaN(num)) return null;

    if (marker.normalMin !== undefined && marker.normalMax !== undefined) {
      if (num < marker.normalMin)
        return { status: 'low', textBn: 'স্বাভাবিকের নিচে (Low)', textEn: 'Below Normal' };
      if (num > marker.normalMax)
        return { status: 'high', textBn: 'উচ্চ / সতর্কতামূলক (High)', textEn: 'Elevated / High' };
      return { status: 'optimal', textBn: 'স্বাভাবিক ও নিরাপদ (Optimal)', textEn: 'Optimal Range' };
    }
    return null;
  };

  // Auto-fill current tab or unanswered questions with realistic clinical defaults for quick testing
  const handleQuickFillCurrentTab = () => {
    setAnswers((prev) => {
      const next = { ...prev };
      tabs.forEach((tab) => {
        tab.questions.forEach((q) => {
          const existing = next[q.id];
          const hasVal = Array.isArray(existing)
            ? existing.length > 0
            : existing !== undefined && String(existing).trim() !== '';
          if (hasVal) return;

          if (q.id === 'basic_name') next[q.id] = user?.name || (isBn ? 'রহমান আহমেদ' : 'Rahman Ahmed');
          else if (q.id === 'basic_age')
            next[q.id] = cohort === 'child_pediatric' ? '6' : cohort === 'adolescent_growth' ? '15' : '32';
          else if (q.id === 'basic_height')
            next[q.id] = cohort === 'child_pediatric' ? '114' : '162';
          else if (q.id === 'basic_weight')
            next[q.id] = cohort === 'child_pediatric' ? '19' : '66';
          else if (q.id === 'shakti_last_period')
            next[q.id] = new Date(Date.now() - 12 * 86400000).toISOString().split('T')[0];
          else if (q.type === 'radio' && q.options && q.options.length > 0) {
            next[q.id] = q.options[0].value;
          } else if (q.type === 'checkbox' && q.options && q.options.length > 0) {
            next[q.id] = [q.options[0].value];
          } else if (q.quickChips && q.quickChips.length > 0) {
            next[q.id] = q.quickChips[0].value;
          } else if (q.type === 'text' || q.type === 'textarea') {
            next[q.id] = isBn ? 'স্বাভাবিক / প্রযোজ্য' : 'Recorded';
          }
        });
      });
      return next;
    });
  };

  const isTabComplete = (tabIdx: number) => {
    const tab = tabs[tabIdx];
    if (!tab) return false;
    return tab.questions.every((q) => {
      if (!q.required) return true;
      const val = answers[q.id];
      if (q.type === 'checkbox') return Array.isArray(val) && val.length > 0;
      return val !== undefined && String(val).trim() !== '';
    });
  };

  const handleNextTab = () => {
    if (safeTabIndex < tabs.length - 1) {
      setActiveTabIndex(safeTabIndex + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      finalizeProfile();
    }
  };

  const handlePrevTab = () => {
    if (safeTabIndex > 0) {
      setActiveTabIndex(safeTabIndex - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onBackToCohortSelect();
    }
  };

  const finalizeProfile = () => {
    let pregnancyMonth = initialPregnancyMonth;
    if (cohort === 'pregnancy_lactation') {
      const stage = answers['preg_stage'];
      if (typeof stage === 'string' && stage.startsWith('m')) {
        const m = parseInt(stage.replace('m', ''), 10);
        if (m >= 1 && m <= 9) pregnancyMonth = m;
      }
    }

    const flatAnswers: Record<string, string> = {};
    Object.entries(answers).forEach(([k, v]) => {
      flatAnswers[k] = Array.isArray(v) ? v.join(', ') : String(v ?? '');
    });

    const parsedLabMarkers: Record<string, string | number> = {};
    Object.entries(labValues).forEach(([k, v]) => {
      const valStr = String(v ?? '').trim();
      if (valStr) {
        parsedLabMarkers[k] = isNaN(Number(valStr)) ? valStr : Number(valStr);
      }
    });

    // Compute real clinical metrics from all 32–44 answers
    const computed = computeUnifiedClinicalAnalysis(cohort, flatAnswers, isBn);

    const newProfile: HealthProfile = {
      cohortType: cohort,
      pregnancyMonth,
      age: computed.age,
      gender: computed.gender,
      profession: flatAnswers['basic_profession'] || 'Working Professional',
      weight: computed.weight,
      height: computed.height,
      dosha: computed.dosha,
      microbiomeScore: computed.microbiomeScore,
      metabolicType: computed.metabolicType,
      inflammatoryIndex: computed.inflammatoryIndex,
      alkalineBalance: computed.alkalineBalance,
      psychologicalProfile: computed.psychologicalProfile,
      hasHypoacidity: computed.hasHypoacidity,
      medications: flatAnswers['med_medications'] || 'None',
      currentMedicationsList: flatAnswers['med_medications'] || 'None',
      medicalConditions: flatAnswers['med_conditions'] || '',
      dietGoals: flatAnswers['med_targets'] || '',
      dietHistory:
        cohort === 'child_pediatric'
          ? `Pediatric 32-Point Assessment (${flatAnswers['child_appetite'] || 'Recorded'})`
          : `24h Recall: B:${flatAnswers['diet_breakfast'] || '-'} | L:${flatAnswers['diet_lunch'] || '-'} | D:${flatAnswers['diet_dinner'] || '-'}`,
      medicalReportFiles: uploadedFiles,
      emergencyContact:
        flatAnswers['emergency_name'] || flatAnswers['emergency_phone']
          ? {
              name: flatAnswers['emergency_name'] || 'Caregiver',
              phone: flatAnswers['emergency_phone'] || '',
            }
          : undefined,
      cycleData: computed.cycleData,
      analysis: computed.analysis,
      answers: flatAnswers,
      cohortLabMarkers: parsedLabMarkers,
      residenceCountry: loadStoredCrossBorderPrefs().residenceCountry,
      preferredCuisineCountry: loadStoredCrossBorderPrefs().preferredCuisineCountry,
      supermarketSubstituteMode: loadStoredCrossBorderPrefs().supermarketSubstituteMode,
    };

    // Attach safety alerts and traffic light guide
    newProfile.cohortSafetyAlerts = CohortDietEngine.generateSafetyAlerts(newProfile);
    newProfile.trafficLightGuide = CohortDietEngine.generateCohortTrafficLight(newProfile);

    onComplete(newProfile);
  };

  const cohortTitles: Record<CohortType, { bn: string; en: string }> = {
    pregnancy_lactation: {
      bn: 'গর্ভবতী ও স্তন্যদাত্রী মা — সমন্বিত ক্লিনিক্যাল ও আয়ুর্বেদিক অ্যাসেসমেন্ট',
      en: 'Pregnancy & Lactation — Unified Clinical & Masanumasika Assessment',
    },
    child_pediatric: {
      bn: 'শিশু পুষ্টি, বৃদ্ধি ও মেধা বিকাশ — ৩২টি পেডিয়াট্রিক অ্যাসেসমেন্ট প্রশ্ন (Ages 1–12)',
      en: 'Pediatric Growth, Gut & Immunity — 32-Point Child Assessment Package',
    },
    oncology_cancer: {
      bn: 'ক্যান্সার রিকভারি, বিকৃতি ও নিউট্রোপেনিক সেফটি — সম্পূর্ণ অ্যাসেসমেন্ট প্যাকেজ',
      en: 'Oncology Recovery, Vikriti & Neutropenic Safety — Complete Clinical Package',
    },
    adolescent_growth: {
      bn: 'কৈশোর বৃদ্ধি, হরমোন ও রক্তস্বল্পতা — সম্পূর্ণ ক্লিনিক্যাল অ্যাসেসমেন্ট প্যাকেজ',
      en: 'Adolescent Growth Spurt, Hormone & Anemia — Complete Clinical Package',
    },
    adult_metabolic: {
      bn: 'অ্যাডাল্ট মেটাবলিক, বিকৃতি, মাইক্রোবায়োম ও রোগভিত্তিক সম্পূর্ণ অ্যাসেসমেন্ট প্যাকেজ',
      en: 'Adult Metabolic, Vikriti, Microbiome & Disease-Specific Clinical Package',
    },
  };

  const progressPercent = Math.max(
    8,
    Math.round((answeredQuestionsCount / Math.max(1, totalQuestionsCount)) * 100)
  );

  const isLastTab = safeTabIndex === tabs.length - 1;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 animate-in fade-in">
      {/* Global Residence Location vs. Preferred Food Cuisine Selector */}
      <CrossBorderCuisineBar
        profile={null}
        lang={lang}
        darkMode={darkMode}
      />

      {/* Top Sticky Summary & Category Tab Navigation */}
      <div
        className={`p-5 sm:p-6 rounded-3xl border shadow-xl ${
          darkMode
            ? 'bg-slate-900/95 border-slate-700/80 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl shadow-md shrink-0">
              {currentTab.icon}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  {isBn
                    ? `মোট ${totalQuestionsCount}টি ক্লিনিক্যাল প্রশ্ন • উত্তর দেওয়া হয়েছে ${answeredQuestionsCount}টি`
                    : `${answeredQuestionsCount} of ${totalQuestionsCount} Clinical Questions Answered`}
                </span>
                {cohort !== 'child_pediatric' && currentGender === 'Female' && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/15 text-pink-600 dark:text-pink-400 border border-pink-500/30">
                    {isBn ? '🌸 ফিমেল সাইকেল সিঙ্ক সক্রিয়' : '🌸 Female Cycle Sync Active'}
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-snug mt-1">
                {isBn ? cohortTitles[cohort].bn : cohortTitles[cohort].en}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleQuickFillCurrentTab}
              className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-all flex items-center gap-1.5"
              title={isBn ? 'অসম্পূর্ণ প্রশ্নগুলো নমুনা উত্তর দিয়ে পূরণ করুন' : 'Auto-fill remaining questions'}
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>{isBn ? '⚡ কুইক অটো-ফিল' : '⚡ Quick Auto-Fill'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrevTab}
              className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-1 text-slate-700 dark:text-slate-300"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>{isBn ? 'পূর্ববর্তী' : 'Back'}</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Step-by-Step Category Tabs Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {tabs.map((tab, idx) => {
            const isActive = idx === safeTabIndex;
            const completed = isTabComplete(idx);
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTabIndex(idx);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border shrink-0 ${
                  isActive
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20'
                    : completed
                    ? darkMode
                      ? 'bg-emerald-950/50 border-emerald-700/60 text-emerald-300'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : darkMode
                    ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{isBn ? tab.badgeBn : tab.badgeEn}</span>
                {completed && !isActive && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Category Section Banner */}
      <div
        className={`p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          darkMode
            ? 'bg-gradient-to-r from-slate-900 via-slate-800/90 to-emerald-950/30 border-slate-700/80'
            : 'bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-white border-emerald-200/80'
        }`}
      >
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            {isBn
              ? `ক্যাটাগরি ${safeTabIndex + 1} / ${tabs.length} • ${currentTab.badgeBn}`
              : `Category ${safeTabIndex + 1} of ${tabs.length} • ${currentTab.badgeEn}`}
          </span>
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
            {isBn ? currentTab.titleBn : currentTab.titleEn}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
            {isBn ? currentTab.subtitleBn : currentTab.subtitleEn}
          </p>
        </div>

        {/* Live BMI & IBW Badge when on Anthropometrics tab */}
        {bmiPreview && (currentTab.id === 'basic' || currentTab.id === 'child_basic') && (
          <div className={`px-4 py-3 rounded-2xl border ${bmiPreview.colorClass} shrink-0`}>
            <div className="flex items-center gap-2 text-xs font-extrabold">
              <Scale className="w-4 h-4" />
              <span>BMI: {bmiPreview.bmi} kg/m²</span>
            </div>
            <div className="text-[11px] font-bold mt-0.5">
              {isBn ? bmiPreview.statusBn : bmiPreview.statusEn}
            </div>
            {cohort !== 'child_pediatric' && (
              <div className="text-[10px] opacity-80 mt-0.5">
                {isBn ? `আদর্শ ওজন (IBW): ~${bmiPreview.ibw} কেজি` : `Ideal Weight (IBW): ~${bmiPreview.ibw} kg`}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Questions List for Current Category Tab */}
      <div className="space-y-5">
        {currentTab.questions.map((q: UnifiedQuestion, idx: number) => {
          const globalNum = globalQuestionStartIndex + idx + 1;
          const val = answers[q.id];

          return (
            <div
              key={q.id}
              className={`p-5 sm:p-6 rounded-3xl border shadow-sm transition-all ${
                darkMode
                  ? 'bg-slate-800/85 border-slate-700 text-slate-100'
                  : 'bg-white border-slate-200/90 text-slate-800'
              }`}
            >
              <div className="mb-4">
                <div className="flex items-start gap-2.5 mb-1">
                  <span className="w-6 h-6 rounded-xl bg-emerald-600 text-white text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    {globalNum}
                  </span>
                  <div className="flex-1">
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {isBn ? q.titleBn : q.titleEn}
                    </h4>
                    {(q.subtitleBn || q.subtitleEn) && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {isBn ? q.subtitleBn : q.subtitleEn}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Render Input by Question Type */}
              <div className="pl-0 sm:pl-8 space-y-3">
                {/* 1. TEXT INPUT */}
                {q.type === 'text' && (
                  <input
                    type="text"
                    value={val || ''}
                    onChange={(e) => handleTextOrNumberChange(q.id, e.target.value)}
                    placeholder={isBn ? q.placeholderBn : q.placeholderEn}
                    className={`w-full p-3.5 rounded-2xl border text-sm font-semibold transition-all outline-none ${
                      darkMode
                        ? 'bg-slate-900 border-slate-700 text-white focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                    }`}
                  />
                )}

                {/* 2. NUMBER INPUT (with special Feet/Inches Converter for basic_height) */}
                {q.type === 'number' && (
                  <div className="space-y-3">
                    <div className="relative flex items-center max-w-xs">
                      <input
                        type="number"
                        min={q.min}
                        max={q.max}
                        value={val || ''}
                        onChange={(e) => handleTextOrNumberChange(q.id, e.target.value)}
                        placeholder={isBn ? q.placeholderBn : q.placeholderEn}
                        className={`w-full p-3.5 pr-16 rounded-2xl border text-sm font-bold transition-all outline-none ${
                          darkMode
                            ? 'bg-slate-900 border-slate-700 text-white focus:border-emerald-500'
                            : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                        }`}
                      />
                      {q.unit && (
                        <span className="absolute right-4 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                          {q.unit}
                        </span>
                      )}
                    </div>

                    {/* Built-in Feet & Inches Converter for Height */}
                    {q.id === 'basic_height' && (
                      <div
                        className={`p-3.5 rounded-2xl border flex flex-wrap items-center gap-3 ${
                          darkMode
                            ? 'bg-slate-900/70 border-slate-700/80'
                            : 'bg-emerald-50/60 border-emerald-200/80'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                          <Ruler className="w-4 h-4" />
                          <span>{isBn ? 'ফুট-ইঞ্চি থেকে সেমি কনভার্টার:' : 'Feet & Inches to cm:'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={feetInput}
                            onChange={(e) => {
                              setFeetInput(e.target.value);
                              applyFeetInchesToCm(e.target.value, inchInput);
                            }}
                            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold ${
                              darkMode
                                ? 'bg-slate-800 border-slate-600 text-white'
                                : 'bg-white border-slate-300 text-slate-800'
                            }`}
                          >
                            {[2, 3, 4, 5, 6].map((ft) => (
                              <option key={ft} value={ft}>
                                {ft} {isBn ? 'ফুট' : 'ft'}
                              </option>
                            ))}
                          </select>
                          <select
                            value={inchInput}
                            onChange={(e) => {
                              setInchInput(e.target.value);
                              applyFeetInchesToCm(feetInput, e.target.value);
                            }}
                            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold ${
                              darkMode
                                ? 'bg-slate-800 border-slate-600 text-white'
                                : 'bg-white border-slate-300 text-slate-800'
                            }`}
                          >
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((inc) => (
                              <option key={inc} value={inc}>
                                {inc} {isBn ? 'ইঞ্চি' : 'in'}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => applyFeetInchesToCm(feetInput, inchInput)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all"
                          >
                            {isBn ? 'সেট করুন' : 'Apply'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. DATE INPUT (e.g., Last Menstrual Period Date) */}
                {q.type === 'date' && (
                  <div className="max-w-xs">
                    <input
                      type="date"
                      value={val || ''}
                      onChange={(e) => handleTextOrNumberChange(q.id, e.target.value)}
                      className={`w-full p-3.5 rounded-2xl border text-sm font-bold transition-all outline-none ${
                        darkMode
                          ? 'bg-slate-900 border-slate-700 text-white focus:border-emerald-500'
                          : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                      }`}
                    />
                  </div>
                )}

                {/* 4. TEXTAREA WITH QUICK-TAP CLINICAL CHIPS */}
                {q.type === 'textarea' && (
                  <div className="space-y-2.5">
                    {q.quickChips && q.quickChips.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {q.quickChips.map((chip) => {
                          const isChipActive = String(val || '').includes(chip.value);
                          return (
                            <button
                              key={chip.value}
                              type="button"
                              onClick={() => handleQuickChipAppend(q.id, chip.value)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                                isChipActive
                                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                                  : darkMode
                                  ? 'bg-slate-900/90 border-slate-700 text-slate-300 hover:border-emerald-500/60'
                                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-300'
                              }`}
                            >
                              + {isBn ? chip.labelBn : chip.labelEn}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <textarea
                      rows={2}
                      value={val || ''}
                      onChange={(e) => handleTextOrNumberChange(q.id, e.target.value)}
                      placeholder={isBn ? q.placeholderBn : q.placeholderEn}
                      className={`w-full p-3.5 rounded-2xl border text-xs sm:text-sm font-medium transition-all outline-none leading-relaxed ${
                        darkMode
                          ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500'
                          : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
                      }`}
                    />
                  </div>
                )}

                {/* 5. FILE UPLOAD */}
                {q.type === 'file' && (
                  <label
                    className={`w-full p-4 rounded-2xl border-2 border-dashed flex items-center justify-between cursor-pointer transition-all ${
                      darkMode
                        ? 'border-slate-700 bg-slate-900/50 hover:bg-slate-900'
                        : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Paperclip className="w-5 h-5 text-emerald-500" />
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {val
                            ? isBn
                              ? `সংযুক্ত ফাইল: ${val}`
                              : `Attached: ${val}`
                            : isBn
                            ? 'প্রেসক্রিপশন বা ল্যাব রিপোর্ট ছবি/পিডিএফ নির্বাচন করুন'
                            : 'Select Prescription or Lab Report Image/PDF'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {isBn ? 'ঐচ্ছিক — নিচের ল্যাব বক্সেও মান লিখতে পারেন' : 'Optional — you can also type values below'}
                        </div>
                      </div>
                    </div>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => handleFileUpload(e, q.id)}
                      className="hidden"
                    />
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                      {isBn ? 'ফাইল নিন' : 'Browse'}
                    </span>
                  </label>
                )}

                {/* 6. RADIO & CHECKBOX OPTIONS */}
                {(q.type === 'radio' || q.type === 'checkbox') && (
                  <div className="grid grid-cols-1 gap-2.5">
                    {q.options?.map((opt) => {
                      const isRadio = q.type === 'radio';
                      const isSelected = isRadio
                        ? val === opt.value
                        : Array.isArray(val) && val.includes(opt.value);

                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            if (isRadio) handleSelectRadio(q.id, opt.value);
                            else handleToggleCheckbox(q.id, opt.value);
                          }}
                          className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-50/90 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-200 ring-1 ring-emerald-500 shadow-sm'
                              : darkMode
                              ? 'bg-slate-900/50 border-slate-700 hover:bg-slate-700/50 hover:border-slate-600 text-slate-200'
                              : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <span className="text-xs sm:text-sm font-medium leading-relaxed">
                            {isBn ? opt.labelBn : opt.labelEn}
                          </span>

                          <div
                            className={`w-5 h-5 rounded-${
                              isRadio ? 'full' : 'md'
                            } border flex items-center justify-center shrink-0 transition-all ${
                              isSelected
                                ? 'border-emerald-600 bg-emerald-600 text-white'
                                : 'border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Optional Lab Biomarkers Panel on the Final Tab */}
      {isLastTab && labMarkers.length > 0 && (
        <div
          className={`p-6 rounded-3xl border shadow-md ${
            darkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isBn
                  ? 'ক্লিনিক্যাল ল্যাব মার্কার ইনপুট (ঐচ্ছিক তবে অত্যন্ত সুপারিশকৃত)'
                  : 'Clinical Laboratory Biomarkers (Optional but Recommended)'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                {isBn
                  ? 'আপনার সাম্প্রতিক রক্তের রিপোর্ট থাকলে মানগুলো ইনপুট দিন। আমাদের ইঞ্জিন স্বয়ংক্রিয়ভাবে আপনার স্বাভাবিক রেঞ্জ যাচাই করে ডায়েট চার্টে বিশেষ প্রটোকল যোগ করবে।'
                  : 'Enter recent lab values to calibrate personalized safety rules and target thresholds.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {labMarkers.map((marker) => {
              const val = labValues[marker.id] || '';
              const result = getLabMarkerStatus(marker, val);

              return (
                <div
                  key={marker.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    darkMode ? 'bg-slate-900/60 border-slate-700/80' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {isBn ? marker.nameBn : marker.nameEn}
                    </label>
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 shrink-0">
                      {marker.standardRange}
                    </span>
                  </div>

                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={val}
                      placeholder={marker.standardRange.split(' ')[0] || '0'}
                      onChange={(e) => handleLabChange(marker.id, e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        darkMode
                          ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-500'
                          : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                      } focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                    />
                    <span className="absolute right-3 text-[11px] font-bold text-slate-400 pointer-events-none">
                      {marker.unit}
                    </span>
                  </div>

                  {result && (
                    <div
                      className={`mt-2 px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 ${
                        result.status === 'optimal'
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                          : result.status === 'high'
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      <span>{isBn ? result.textBn : result.textEn}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Stepper & Final Submit Bar */}
      <div
        className={`p-5 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
          darkMode ? 'bg-slate-900/90 border-slate-700' : 'bg-white border-slate-200 shadow-md'
        }`}
      >
        <button
          type="button"
          onClick={handlePrevTab}
          className="w-full sm:w-auto px-5 py-3 rounded-2xl text-xs font-bold border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        >
          {safeTabIndex === 0
            ? isBn
              ? '← কোহর্ট পরিবর্তনে ফিরে যান'
              : '← Back to Cohort Selection'
            : isBn
            ? `← পূর্ববর্তী ধাপ (${tabs[safeTabIndex - 1].badgeBn.split('•')[0]})`
            : `← Previous (${tabs[safeTabIndex - 1].badgeEn.split('•')[0]})`}
        </button>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {!isLastTab && (
            <button
              type="button"
              onClick={() => {
                handleQuickFillCurrentTab();
                setTimeout(() => finalizeProfile(), 50);
              }}
              className={`w-full sm:w-auto px-4 py-3 rounded-2xl text-xs font-bold border transition-all ${
                darkMode
                  ? 'border-emerald-700/60 text-emerald-400 hover:bg-emerald-950/40'
                  : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              {isBn ? '✓ সম্পূর্ণ ফর্ম ফিনিশ ও রিপোর্ট দেখুন' : '✓ Quick Finish & Generate Report'}
            </button>
          )}

          {!isLastTab ? (
            <button
              type="button"
              onClick={handleNextTab}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl text-xs sm:text-sm font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <span>
                {isBn
                  ? `পরবর্তী ক্যাটাগরি: ${tabs[safeTabIndex + 1].badgeBn}`
                  : `Next: ${tabs[safeTabIndex + 1].badgeEn}`}
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={finalizeProfile}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl text-xs sm:text-sm font-extrabold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transform active:scale-95 transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>
                {isBn
                  ? 'ক্লিনিক্যাল রিপোর্ট ও ডায়েট চার্ট জেনারেট করুন'
                  : 'Generate Complete Clinical Report & Diet Chart'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CohortAssessmentForm;
