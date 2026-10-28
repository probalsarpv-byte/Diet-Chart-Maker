import React, { useState } from 'react';
import {
  HealthProfile,
  CohortType,
  Language,
  CohortLabMarker,
  CohortQuestion,
  User,
} from '../types';
import {
  COHORT_QUESTIONS,
  COHORT_LAB_MARKERS,
  AYURVEDIC_MASANUMASIKA_MONTHS,
} from '../data/cohortData';
import { CohortDietEngine } from '../services/cohortDietEngine';
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Activity,
  AlertCircle,
  FileSpreadsheet,
  Stethoscope,
  Sparkles,
  Info,
} from 'lucide-react';

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
  initialPregnancyMonth = 1,
  user,
  lang,
  darkMode,
  onComplete,
  onBackToCohortSelect,
}) => {
  const isBn = lang === 'bn';
  const questions: CohortQuestion[] = COHORT_QUESTIONS[cohort] || [];
  const labMarkers: CohortLabMarker[] = COHORT_LAB_MARKERS[cohort] || [];

  // Stepping: Step 0 to N-1 (pages of questions), then final Lab Markers step
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    const init: Record<string, any> = {};
    if (cohort === 'pregnancy_lactation') {
      init['preg_stage'] = `m${initialPregnancyMonth}`;
    }
    return init;
  });

  const [labValues, setLabValues] = useState<Record<string, string>>({});
  const [showLabStep, setShowLabStep] = useState(false);

  // Group questions into manageable steps (e.g., 2-3 per screen on mobile)
  const QUESTIONS_PER_STEP = 3;
  const totalQuestionSteps = Math.ceil(questions.length / QUESTIONS_PER_STEP);

  const currentQuestions = questions.slice(
    currentStepIndex * QUESTIONS_PER_STEP,
    (currentStepIndex + 1) * QUESTIONS_PER_STEP
  );

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

  const handleLabChange = (id: string, val: string) => {
    setLabValues((prev) => ({ ...prev, [id]: val }));
  };

  const getLabMarkerStatus = (marker: CohortLabMarker, valStr: string) => {
    if (!valStr || valStr.trim() === '') return null;
    const num = parseFloat(valStr);
    if (isNaN(num)) return null;

    if (marker.normalMin !== undefined && marker.normalMax !== undefined) {
      if (num < marker.normalMin) return { status: 'low', textBn: 'স্বাভাবিকের নিচে', textEn: 'Below Normal' };
      if (num > marker.normalMax) return { status: 'high', textBn: 'উচ্চ / সতর্কতামূলক', textEn: 'Elevated' };
      return { status: 'optimal', textBn: 'স্বাভাবিক ও নিরাপদ', textEn: 'Optimal' };
    }
    return null;
  };

  const isCurrentStepValid = () => {
    return currentQuestions.every((q) => {
      const val = answers[q.id];
      if (q.type === 'radio') return Boolean(val);
      if (q.type === 'checkbox') return Boolean(val && (val as string[]).length > 0);
      return true;
    });
  };

  const handleNext = () => {
    if (currentStepIndex < totalQuestionSteps - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setShowLabStep(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (showLabStep) {
      setShowLabStep(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onBackToCohortSelect();
    }
  };

  const finalizeProfile = () => {
    // Resolve pregnancy month
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
      flatAnswers[k] = Array.isArray(v) ? v.join(', ') : String(v);
    });

    const parsedLabMarkers: Record<string, string | number> = {};
    Object.entries(labValues).forEach(([k, v]) => {
      const valStr = String(v ?? '').trim();
      if (valStr) {
        parsedLabMarkers[k] = isNaN(Number(valStr)) ? valStr : Number(valStr);
      }
    });

    const newProfile: HealthProfile = {
      cohortType: cohort,
      pregnancyMonth,
      age: 28,
      gender: cohort === 'pregnancy_lactation' ? 'Female' : 'Other',
      weight: 65,
      height: 162,
      dosha: 'Pitta-Vata',
      microbiomeScore: 80,
      metabolicType: 'Adaptive',
      inflammatoryIndex: 3,
      alkalineBalance: 'Optimal',
      psychologicalProfile: 'Focused & Nurturing',
      medications: 'None',
      dietHistory: 'Cohort Specialized Intake',
      answers: flatAnswers,
      cohortLabMarkers: parsedLabMarkers,
    };

    // Attach safety alerts and traffic light
    newProfile.cohortSafetyAlerts = CohortDietEngine.generateSafetyAlerts(newProfile);
    newProfile.trafficLightGuide = CohortDietEngine.generateCohortTrafficLight(newProfile);

    onComplete(newProfile);
  };

  const cohortTitles: Record<CohortType, { bn: string; en: string }> = {
    pregnancy_lactation: {
      bn: 'গর্ভবতী ও স্তন্যদাত্রী মা — আয়ুর্বেদিক মাসানুক্রমিক অ্যাসেসমেন্ট',
      en: 'Pregnancy & Lactation — Ayurvedic Masanumasika Assessment',
    },
    child_pediatric: {
      bn: 'শিশু পুষ্টি ও বৃদ্ধি অ্যাসেসমেন্ট (Ages 1–12)',
      en: 'Pediatric Growth & Nutrition Assessment',
    },
    oncology_cancer: {
      bn: 'ক্যান্সার রিকভারি ও নিউট্রোপেনিক সেফটি অ্যাসেসমেন্ট',
      en: 'Oncology Recovery & Neutropenic Safety Assessment',
    },
    adolescent_growth: {
      bn: 'কৈশোর পুষ্টি, রক্তস্বল্পতা ও গ্রোথ স্পার্ট অ্যাসেসমেন্ট',
      en: 'Adolescent Nutrition & Growth Spurt Assessment',
    },
    adult_metabolic: {
      bn: 'অ্যাডাল্ট মেটাবলিক ও কার্ডিও-ভাস্কুলার অ্যাসেসমেন্ট',
      en: 'Adult Metabolic & Reversal Assessment',
    },
  };

  const progressPercent = showLabStep
    ? 100
    : Math.round(((currentStepIndex + 1) / (totalQuestionSteps + 1)) * 100);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-in fade-in">
      {/* Top Header Card */}
      <div
        className={`p-5 rounded-3xl border shadow-lg ${
          darkMode
            ? 'bg-slate-900/90 border-slate-700/80 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
              {showLabStep ? totalQuestionSteps + 1 : currentStepIndex + 1}
            </span>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                {isBn ? cohortTitles[cohort].bn : cohortTitles[cohort].en}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {showLabStep
                  ? isBn
                    ? 'ক্লিনিক্যাল ল্যাব রিপোর্ট ও মার্কার (ঐচ্ছিক)'
                    : 'Clinical Lab Biomarkers (Optional)'
                  : isBn
                  ? `ধাপ ${currentStepIndex + 1} এর ${totalQuestionSteps} • লক্ষণ ও শারীরিক অবস্থা`
                  : `Step ${currentStepIndex + 1} of ${totalQuestionSteps} • Symptoms & Physiology`}
              </p>
            </div>
          </div>

          <button
            onClick={handlePrev}
            className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-1 text-slate-700 dark:text-slate-300"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>{isBn ? 'পূর্ববর্তী' : 'Back'}</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Form Body */}
      {!showLabStep ? (
        <div className="space-y-5">
          {currentQuestions.map((q, idx) => {
            const isRadio = q.type === 'radio';
            const isCheckbox = q.type === 'checkbox';

            return (
              <div
                key={q.id}
                className={`p-6 rounded-3xl border shadow-sm transition-all ${
                  darkMode
                    ? 'bg-slate-800/80 border-slate-700 text-slate-100'
                    : 'bg-white border-slate-200/90 text-slate-800'
                }`}
              >
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold flex items-center justify-center">
                      {currentStepIndex * QUESTIONS_PER_STEP + idx + 1}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {isBn ? q.titleBn : q.titleEn}
                    </h3>
                  </div>
                  {(q.subtitleBn || q.subtitleEn) && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 pl-7">
                      {isBn ? q.subtitleBn : q.subtitleEn}
                    </p>
                  )}
                </div>

                {/* Options List */}
                <div className="grid grid-cols-1 gap-2.5 pl-2 sm:pl-7">
                  {q.options?.map((opt) => {
                    const isSelected = isRadio
                      ? answers[q.id] === opt.value
                      : Array.isArray(answers[q.id]) && answers[q.id].includes(opt.value);

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
                            ? 'border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500 shadow-sm'
                            : darkMode
                            ? 'bg-slate-800/40 border-slate-700 hover:bg-slate-700/50 hover:border-slate-600 text-slate-200'
                            : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300 text-slate-700'
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
              </div>
            );
          })}

          {/* Stepper Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handlePrev}
              className="px-5 py-2.5 rounded-2xl text-xs font-bold border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              {isBn ? '← পূর্ববর্তী প্রশ্ন' : '← Previous'}
            </button>

            <button
              onClick={handleNext}
              disabled={!isCurrentStepValid()}
              className={`px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg transition-all ${
                isCurrentStepValid()
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/20 active:scale-95'
                  : 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>{isBn ? 'পরবর্তী ধাপে যান' : 'Continue'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Final Lab Markers Step */
        <div className="space-y-6">
          <div
            className={`p-6 rounded-3xl border shadow-sm ${
              darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
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
                      darkMode ? 'bg-slate-900/50 border-slate-700/80' : 'bg-slate-50 border-slate-200'
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

                    {/* Instant Status Cue */}
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

          {/* Complete Assessment Button */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setShowLabStep(false)}
              className="px-5 py-2.5 rounded-2xl text-xs font-bold border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              {isBn ? '← প্রশ্নে ফিরে যান' : '← Back to Questions'}
            </button>

            <button
              onClick={finalizeProfile}
              className="px-8 py-3.5 rounded-2xl text-xs sm:text-sm font-extrabold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-xl shadow-emerald-600/30 flex items-center gap-2 transform active:scale-95 transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{isBn ? 'ক্লিনিক্যাল চার্ট ও রিপোর্ট জেনারেট করুন' : 'Generate Diet Chart & Report'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CohortAssessmentForm;
