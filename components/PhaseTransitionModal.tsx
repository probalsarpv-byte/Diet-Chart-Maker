import React, { useState, useMemo } from 'react';
import { HealthProfile, Language, Phase, PhaseEvaluationRecord } from '../types';
import { recordPhaseAssessmentProgress } from '../services/platformHubService';
import {
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ClipboardCheck,
  ShieldCheck,
  RefreshCw,
  X,
  Activity,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  fromPhase: Phase;
  targetPhase: Phase;
  profile: HealthProfile;
  lang: Language;
  darkMode?: boolean;
  onClose: () => void;
  onApprovedTransition: (
    targetPhase: Phase,
    updatedProfile: HealthProfile,
    evaluationRecord: PhaseEvaluationRecord
  ) => void;
}

interface DynamicTransitionQuestion {
  id: string;
  baselineContextBn: string;
  baselineContextEn: string;
  questionBn: string;
  questionEn: string;
  options: {
    score: 2 | 1 | 0;
    labelBn: string;
    labelEn: string;
    tagBn: string;
    tagEn: string;
  }[];
  remediationTipBn: string;
  remediationTipEn: string;
}

const PHASE_NAMES_BN: Record<number, string> = {
  1: 'ফেজ ১: এলিমিনেশন ও সেলুলার ডিটক্স (Detox)',
  2: 'ফেজ ২: মাইক্রোবায়োম ও গাট রিস্টোরেশন (Microbiome Restoration)',
  3: 'ফেজ ৩: মেটাবলিক ও ইনসুলিন স্ট্যাবিলাইজেশন (Metabolic Stabilization)',
  4: 'ফেজ ৪: লংজেভিটি ও সেলুলার অপ্টিমাইজেশন (Longevity & Maintenance)',
};

const PHASE_NAMES_EN: Record<number, string> = {
  1: 'Phase 1: Elimination & Cellular Detox',
  2: 'Phase 2: Microbiome & Gut Restoration',
  3: 'Phase 3: Metabolic & Insulin Stabilization',
  4: 'Phase 4: Longevity & Cellular Optimization',
};

const PhaseTransitionModal: React.FC<Props> = ({
  isOpen,
  fromPhase,
  targetPhase,
  profile,
  lang,
  darkMode,
  onClose,
  onApprovedTransition,
}) => {
  const isBn = lang === 'bn';
  const [selectedScores, setSelectedScores] = useState<Record<string, 2 | 1 | 0>>({});
  const [submittedResult, setSubmittedResult] = useState<{
    scorePercent: number;
    improved: boolean;
    unimprovedItems: DynamicTransitionQuestion[];
    summaryBn: string;
    summaryEn: string;
  } | null>(null);

  // Check if user is trying to skip an intermediate phase (e.g., Phase 1 -> Phase 3 when Phase 2 is not unlocked)
  const unlockedList = profile.unlockedPhases || [Phase.DETOX];
  const requiredPrerequisitePhase = (targetPhase - 1) as Phase;
  const isSkippingPhase =
    targetPhase > 1 && !unlockedList.includes(requiredPrerequisitePhase) && fromPhase < requiredPrerequisitePhase;

  // Build personalized questions dynamically from the user's pre-Phase 1 Assessment Form
  const questions: DynamicTransitionQuestion[] = useMemo(() => {
    const condText =
      profile.medicalConditions ||
      profile.metabolicCondition ||
      profile.answers?.['med_conditions'] ||
      (isBn ? 'মেটাবলিক ও ডাইজেস্টিভ রিক্যালিব্রেশন' : 'Metabolic & Digestive Recalibration');

    const doshaLabel = profile.dosha || 'Tridoshic';
    const hasHypo = Boolean(
      profile.hasHypoacidity ||
        profile.answers?.['digestion_1'] === 'c' ||
        profile.answers?.['digestion_2'] === 'c'
    );
    const baselineInflam = profile.inflammatoryIndex ?? 5;
    const baselineMicrobiome = profile.microbiomeScore ?? 65;
    const psychProfile = profile.psychologicalProfile || 'Moderate Stress';
    const mealFreq = profile.mealFrequency || 3;
    const dinnerRule =
      profile.dinnerCarbRule === 'cereal_allowed'
        ? isBn
          ? 'রাতের পরিমিত শস্য শর্করা'
          : 'Measured Night Cereal Carb'
        : isBn
        ? 'রাতে শস্যবিহীন সবজি শর্করা'
        : 'Night Vegetable-Only Carb';

    // Cohort-specific question builder based on prior assessment
    const buildCohortQuestion = (transitionStage: 1 | 2 | 3): DynamicTransitionQuestion => {
      if (profile.cohortType === 'pregnancy_lactation') {
        const pregMonth = profile.pregnancyMonth || 3;
        return {
          id: `q_cohort_${transitionStage}`,
          baselineContextBn: `প্রাথমিক অ্যাসেসমেন্ট: গর্ভাবস্থা/ল্যাক্টেশন প্রোফাইল (মাস ${pregMonth})`,
          baselineContextEn: `Initial Assessment: Pregnancy/Lactation Cohort (Month ${pregMonth})`,
          questionBn:
            transitionStage === 1
              ? `আপনার প্রাথমিক অ্যাসেসমেন্টের গর্ভাবস্থা প্রোটোকল (মাস ${pregMonth}) অনুযায়ী বমি ভাব, বুক জ্বালাপোড়া ও দুর্বলতা এখন কতটা নিয়ন্ত্রণে এসেছে?`
              : transitionStage === 2
              ? `ফেজ ২-এর আয়ুর্বেদিক মাসানুমাসিক পুষ্টি ও আয়রন-ক্যালসিয়াম খাবার গ্রহণের পর আপনার শারীরিক শক্তি ও হিমোগ্লোবিন/প্রেশার স্থিতিশীলতা কেমন?`
              : `ফেজ ৩ শেষে আপনার রক্তচাপ, রক্তে শর্করার মাত্রা এবং গর্ভস্থ শিশুর বৃদ্ধি ও আপনার ঘুম কেমন অনুভব করছেন?`,
          questionEn:
            transitionStage === 1
              ? `Based on your Pregnancy Assessment (Month ${pregMonth}), how well have morning nausea, acidity, and fatigue improved after Phase 1?`
              : transitionStage === 2
              ? `After Phase 2 Masanumasika & micronutrient restoration, how is your maternal stamina, digestion, and iron/calcium tolerance?`
              : `At the end of Phase 3, how stable are your blood pressure, glycemic response, and maternal energy for Phase 4?`,
          options: [
            {
              score: 2,
              labelBn: 'অনেক ভালো — অ্যাসিডিটি/দুর্বলতা কমেছে এবং খাবার সহজে হজম হচ্ছে',
              labelEn: 'Significantly Improved — Acidity/fatigue reduced & meals digest smoothly',
              tagBn: 'উন্নত (Improved)',
              tagEn: 'Improved',
            },
            {
              score: 1,
              labelBn: 'কিছুটা উন্নতি হয়েছে, তবে মাঝে মাঝে ক্লান্তি বা অ্যাসিডিটি থাকে',
              labelEn: 'Moderately Improved — Occasional mild fatigue or acidity remains',
              tagBn: 'আংশিক উন্নতি',
              tagEn: 'Partial',
            },
            {
              score: 0,
              labelBn: 'এখনো উন্নতি হয়নি — আগের মতোই বমি ভাব বা তীব্র দুর্বলতা আছে',
              labelEn: 'Not Improved Yet — Persistent nausea, acidity, or weakness',
              tagBn: 'আরও যত্ন প্রয়োজন',
              tagEn: 'Needs Stabilization',
            },
          ],
          remediationTipBn:
            'গর্ভাবস্থায় পেঁপে, আনারস ও কাঁচা হার্বস সম্পূর্ণ বর্জন রেখে অল্প অল্প করে ৪ বেলা উষ্ণ ও সহজপাচ্য খাবার এবং ডালিম/ডাবের পানি বজায় রাখুন।',
          remediationTipEn:
            'Maintain strict exclusion of raw papaya/herbs and take small, warm nutrient-dense meals with pomegranate and tender coconut water.',
        };
      }

      if (profile.cohortType === 'child_pediatric') {
        const ageGrp = profile.childAgeGroup || '1-3';
        return {
          id: `q_cohort_${transitionStage}`,
          baselineContextBn: `প্রাথমিক অ্যাসেসমেন্ট: পেডিয়াট্রিক চাইল্ড প্রোফাইল (${ageGrp} বছর, ওজন ${profile.weight}kg)`,
          baselineContextEn: `Initial Assessment: Pediatric Child Profile (${ageGrp} yrs, Weight ${profile.weight}kg)`,
          questionBn:
            transitionStage === 1
              ? `শিশুর প্রাথমিক অ্যাসেসমেন্টের তুলনায় এখন শিশুর ক্ষুধা, পেটের আরাম এবং বাইরের প্যাকেটজাত খাবার ছাড়ার অভ্যাস কেমন?`
              : transitionStage === 2
              ? `ফেজ ২-এর প্রোবায়োটিক ও গাট-ফ্রেন্ডলি খাবারের পর শিশুর হজমশক্তি, মলের স্বাভাবিকতা এবং রোগ প্রতিরোধ ক্ষমতা কেমন দেখছেন?`
              : `ফেজ ৩ শেষে শিশুর মনোযোগ, শারীরিক চঞ্চলতা/শক্তি এবং ওজন-উচ্চতার বৃদ্ধি কেমন পরিলক্ষিত হচ্ছে?`,
          questionEn:
            transitionStage === 1
              ? `Compared to your child's initial assessment, how are their natural appetite, tummy comfort, and reduction of packaged snacks?`
              : transitionStage === 2
              ? `After Phase 2 gut restoration, how are your child's digestion, stool consistency, and immunity markers?`
              : `Following Phase 3 growth stabilization, how are your child's play stamina, focus, and healthy weight/height progress?`,
          options: [
            {
              score: 2,
              labelBn: 'স্পষ্ট উন্নতি — শিশু আনন্দের সাথে ঘরের পুষ্টিকর খাবার খাচ্ছে ও হজম ভালো',
              labelEn: 'Clear Improvement — Eating home meals well with happy digestion',
              tagBn: 'উন্নত (Improved)',
              tagEn: 'Improved',
            },
            {
              score: 1,
              labelBn: 'মোটামুটি ভালো — খাওয়ার আগ্রহ কিছুটা বেড়েছে',
              labelEn: 'Moderate Improvement — Appetite and digestion partially better',
              tagBn: 'আংশিক উন্নতি',
              tagEn: 'Partial',
            },
            {
              score: 0,
              labelBn: 'উন্নতি হয়নি — এখনো পেটের সমস্যা বা খাওয়ায় অরুচি রয়ে গেছে',
              labelEn: 'Not Improved Yet — Persistent picky eating or tummy discomfort',
              tagBn: 'আরও সময় প্রয়োজন',
              tagEn: 'Continue Phase',
            },
          ],
          remediationTipBn:
            'শিশুর খাবারে ঘি, ডিমের কুসুম/মাছের কিমা ও রঙিন সবজির পিউরি বা খিচুড়ি আকর্ষণীয়ভাবে পরিবেশন করুন এবং চিনিযুক্ত জুস বন্ধ রাখুন।',
          remediationTipEn:
            'Serve warm ghee-enriched khichuri, egg yolk/fish mince, and colorful vegetable purees while avoiding sugary beverages.',
        };
      }

      if (profile.gender === 'Female' && profile.cycleData) {
        return {
          id: `q_cohort_${transitionStage}`,
          baselineContextBn: `প্রাথমিক অ্যাসেসমেন্ট: ফিমেল হরমোনাল ও সাইকেল প্রোফাইল (${
            profile.cycleData.hasPCOS ? 'PCOS/Hormonal' : `সাইকেল ${profile.cycleData.cycleLength} দিন`
          })`,
          baselineContextEn: `Initial Assessment: Female Hormonal & Cycle Profile (${
            profile.cycleData.hasPCOS ? 'PCOS/Hormonal' : `${profile.cycleData.cycleLength}-Day Cycle`
          })`,
          questionBn:
            transitionStage === 1
              ? `আপনার প্রাথমিক অ্যাসেসমেন্টে দেওয়া ফিমেল হরমোনাল তথ্যের আলোকে ফেজ ১ শেষে তলপেটে ভারী ভাব, ওয়াটার রিটেনশন ও মুড সুইং কতটা কমেছে?`
              : transitionStage === 2
              ? `ফেজ ২-এর সিড সাইক্লিং ও গাট-ইস্ট্রোজেন ডিটক্স অনুসরণের পর আপনার পিরিয়ড সাইকেল ও হরমোনাল ব্রণ/চুল পড়ার প্রবণতা কেমন?`
              : `ফেজ ৩-এর ইনসুলিন ও হরমোন ব্যালেন্সিং শেষে আপনার মাসিক চক্রের নিয়মিততা এবং সারাদিনের মেটাবলিক এনার্জি কেমন?`,
          questionEn:
            transitionStage === 1
              ? `Based on your Female Hormonal Assessment, how much have pelvic heaviness, water retention, and mood swings improved after Phase 1?`
              : transitionStage === 2
              ? `After Phase 2 gut-estrogen detox and seed nutrition, how are your cycle comfort, skin clarity, and hormonal symptoms?`
              : `Following Phase 3 insulin-hormone stabilization, how balanced are your cycle rhythm and sustained daily vitality?`,
          options: [
            {
              score: 2,
              labelBn: 'উল্লেখযোগ্য উন্নতি — পেট ফাঁপা/ওয়াটার রিটেনশন কমেছে ও হরমোনাল স্বস্তি পাচ্ছি',
              labelEn: 'Significant Improvement — Bloating/water retention reduced & cycle feels balanced',
              tagBn: 'উন্নত (Improved)',
              tagEn: 'Improved',
            },
            {
              score: 1,
              labelBn: 'আংশিক উন্নতি — আগের চেয়ে কিছুটা হালকা অনুভব করছি',
              labelEn: 'Partial Improvement — Symptoms are milder than before Phase 1',
              tagBn: 'আংশিক উন্নতি',
              tagEn: 'Partial',
            },
            {
              score: 0,
              labelBn: 'কোনো পরিবর্তন নেই — এখনো তীব্র হরমোনাল অস্বস্তি বা ক্র্যাম্পিং হচ্ছে',
              labelEn: 'No Improvement Yet — Hormonal discomfort and bloating persist',
              tagBn: 'আরও স্থিতিশীলতা প্রয়োজন',
              tagEn: 'Needs Stabilization',
            },
          ],
          remediationTipBn:
            'প্রতিদিন তিসি/কুমড়ার বীজ (Seed Cycling), পর্যাপ্ত ম্যাগনেসিয়াম সমৃদ্ধ শাক এবং রাত ৮টার মধ্যে রাতের খাবার সম্পন্ন করার নিয়মটি আরও ৭ দিন মেনে চলুন।',
          remediationTipEn:
            'Continue daily seed cycling (flax/pumpkin seeds), leafy greens, and early vegetable-carb dinners before 8 PM for 7 more days.',
        };
      }

      // Default Adult Metabolic / Chronic / Oncology condition question
      return {
        id: `q_cohort_${transitionStage}`,
        baselineContextBn: `প্রাথমিক অ্যাসেসমেন্টের প্রধান কন্ডিশন: ${condText}`,
        baselineContextEn: `Initial Assessment Primary Condition: ${condText}`,
        questionBn:
          transitionStage === 1
            ? `আপনার প্রাথমিক অ্যাসেসমেন্টে উল্লিখিত '${condText}'-এর প্রধান উপসর্গগুলো (যেমন: ক্লান্তি, সুগার/প্রেশার ওঠানামা বা অস্বস্তি) ফেজ ১ শেষে কতটা উন্নত হয়েছে?`
            : transitionStage === 2
            ? `ফেজ ২-এর মাইক্রোবায়োম রিস্টোরেশন শেষে আপনার '${condText}' কন্ডিশনের বায়োমার্কার ও দৈনন্দিন শারীরিক সক্ষমতা কেমন?`
            : `ফেজ ৩-এর মেটাবলিক স্ট্যাবিলাইজেশন শেষে আপনার '${condText}' কি এখন দীর্ঘমেয়াদী লংজেভিটি ফেজ (ফেজ ৪)-এর জন্য স্থিতিশীল?`,
        questionEn:
          transitionStage === 1
            ? `Regarding '${condText}' recorded in your initial assessment, how much have your primary symptoms (fatigue, glycemic/BP swings, or discomfort) improved after Phase 1?`
            : transitionStage === 2
            ? `After Phase 2 Microbiome Restoration, how is your clinical stability and daily stamina regarding '${condText}'?`
            : `Following Phase 3 Metabolic Stabilization, how well-controlled is '${condText}' for transitioning to Phase 4 Longevity?`,
        options: [
          {
            score: 2,
            labelBn: 'স্পষ্ট উন্নতি — উপসর্গ ও শারীরিক অস্বস্তি আগের চেয়ে অনেক কমেছে',
            labelEn: 'Significant Improvement — Symptoms and clinical markers are much more stable',
            tagBn: 'উন্নত (Improved)',
            tagEn: 'Improved',
          },
          {
            score: 1,
            labelBn: 'মাঝারি উন্নতি — কিছুটা নিয়ন্ত্রণে এসেছে তবে আরও উন্নতি দরকার',
            labelEn: 'Moderate Improvement — Noticeable relief, progressing steadily',
            tagBn: 'আংশিক উন্নতি',
            tagEn: 'Partial',
          },
          {
            score: 0,
            labelBn: 'উন্নতি হয়নি — উপসর্গ এখনো প্রাথমিক অ্যাসেসমেন্টের মতোই তীব্র আছে',
            labelEn: 'No Improvement Yet — Symptoms remain as intense as baseline',
            tagBn: 'ফেজ চালিয়ে যান',
            tagEn: 'Continue Phase',
          },
        ],
        remediationTipBn: `আপনার '${condText}' প্রোটোকলের গ্রিন-জোন খাবার, রান্নার তেলের নির্দিষ্ট মাপ এবং খাওয়ার পর ১৫ মিনিট হাঁটার নিয়মটি আরও কয়েকদিন কঠোরভাবে অনুসরণ করুন।`,
        remediationTipEn: `Strictly follow your Green-Zone food selections, measured cooking oil limit, and 15-minute post-meal walks for '${condText}'.`,
      };
    };

    // =========================================================================
    // TRANSITION 1 -> 2: Detox & Elimination -> Microbiome Restoration
    // =========================================================================
    if (targetPhase === Phase.RESTORATION) {
      return [
        {
          id: 'p1_q1_digestion',
          baselineContextBn: `পূর্বের অ্যাসেসমেন্ট: ${
            hasHypo
              ? 'হাইপোঅ্যাসিডিটি, পেট ফাঁপা ও গ্যাসের প্রবণতা শনাক্ত হয়েছিল'
              : `আয়ুর্বেদিক বিকৃতি: ${doshaLabel} দোষ ও হজম বিশ্লেষণ`
          }`,
          baselineContextEn: `Baseline Assessment: ${
            hasHypo
              ? 'Hypoacidity, post-meal bloating & gas detected'
              : `Ayurvedic Vikriti: ${doshaLabel} Dosha digestive profile`
          }`,
          questionBn: hasHypo
            ? 'আপনার প্রাথমিক অ্যাসেসমেন্টে খাবার পর পেট ফাঁপা, গ্যাস ও হাইপোঅ্যাসিডিটি পাওয়া গিয়েছিল। ফেজ ১-এর ডিটক্স ডায়েট ও ভারী খাবারের আগে আদা-লেবু শট নেওয়ার পর এখন হজমের কী অবস্থা?'
            : `আপনার প্রাথমিক অ্যাসেসমেন্টের (${doshaLabel} দোষ) তুলনায় ফেজ ১ শেষে খাবার পর পেটের ভারী ভাব, অ্যাসিডিটি বা ঢেকুর ওঠার সমস্যা কতটা কমেছে?`,
          questionEn: hasHypo
            ? 'Your initial assessment indicated hypoacidity and post-meal bloating. After Phase 1 Detox & pre-meal ginger-lime shots, how is your digestion now?'
            : `Compared to your initial assessment (${doshaLabel} Dosha), how much have post-meal heaviness, reflux, or bloating reduced after Phase 1?`,
          options: [
            {
              score: 2,
              labelBn: '৭০-১০০% কমেছে — খাবার পর পেট হালকা থাকে এবং গ্যাস/অ্যাসিডিটি প্রায় নেই',
              labelEn: '70–100% Improved — Stomach feels light after meals with minimal gas/acidity',
              tagBn: 'উন্নত (Improved)',
              tagEn: 'Improved',
            },
            {
              score: 1,
              labelBn: '৪০-৬০% কমেছে — আগের চেয়ে ভালো, তবে মাঝে মাঝে হালকা গ্যাস হয়',
              labelEn: '40–60% Improved — Better than baseline, occasional mild bloating',
              tagBn: 'আংশিক উন্নতি',
              tagEn: 'Partial',
            },
            {
              score: 0,
              labelBn: 'কোনো উন্নতি হয়নি — এখনো খাবার পর তীব্র পেট ফাঁপা বা অ্যাসিডিটি হচ্ছে',
              labelEn: 'No Improvement — Severe bloating or acidity still occurs after meals',
              tagBn: 'উন্নতি প্রয়োজন',
              tagEn: 'Needs Work',
            },
          ],
          remediationTipBn:
            'খাবারের সাথে সাথে পানি পান বন্ধ রাখুন (খাবারের ৩০ মিনিট পর কুসুম গরম পানি পান করুন) এবং দুপুরের খাবারের ১৫ মিনিট আগে ১ চামচ আদা-লেবু-পিংক সল্ট শট নিন।',
          remediationTipEn:
            'Avoid drinking water immediately with meals (drink warm water 30 mins after) and take the pre-meal ginger-lime-pink salt shot 15 mins before lunch.',
        },
        {
          id: 'p1_q2_inflammation',
          baselineContextBn: `পূর্বের অ্যাসেসমেন্ট: ইনফ্লামেশন ইনডেক্স ${baselineInflam}/10 (${
            profile.analysis?.inflammatoryStatus || 'Systemic'
          })`,
          baselineContextEn: `Baseline Assessment: Inflammatory Index ${baselineInflam}/10 (${
            profile.analysis?.inflammatoryStatus || 'Systemic'
          })`,
          questionBn: `আপনার প্রথম অ্যাসেসমেন্টে প্রদাহ বা ইনফ্লামেশন স্কোর ছিল ${baselineInflam}/10। ফেজ ১-এর অ্যান্টি-ইনফ্লামেটরি ডায়েট করার পর সকালের শরীর ব্যথা, জয়েন্টের জড়তা বা মুখ-হাত ফোলাভাব কতটা কমেছে?`,
          questionEn: `Your baseline Inflammatory Index was ${baselineInflam}/10. After Phase 1 anti-inflammatory elimination, how much have morning stiffness, joint/muscle ache, or puffiness improved?`,
          options: [
            {
              score: 2,
              labelBn: 'উল্লেখযোগ্যভাবে কমেছে — শরীর অনেক ঝরঝরে ও হালকা লাগছে',
              labelEn: 'Significantly Reduced — Body feels lighter with minimal morning stiffness',
              tagBn: 'উন্নত (Improved)',
              tagEn: 'Improved',
            },
            {
              score: 1,
              labelBn: 'কিছুটা কমেছে — ব্যথা বা ফোলাভাব আগের চেয়ে কম',
              labelEn: 'Moderately Reduced — Aches and puffiness are noticeably less than baseline',
              tagBn: 'আংশিক উন্নতি',
              tagEn: 'Partial',
            },
            {
              score: 0,
              labelBn: 'কমেনি — এখনো শরীরে তীব্র প্রদাহ, ব্যথা বা জড়তা রয়ে গেছে',
              labelEn: 'Unchanged — Systemic inflammation, stiffness, or pain still persists',
              tagBn: 'ফেজ ১ চালিয়ে যান',
              tagEn: 'Continue Phase 1',
            },
          ],
          remediationTipBn:
            'সয়াবিন/রাইস ব্র্যান তেল ও চিনি ১০০% বর্জন নিশ্চিত করুন এবং সকালে খালি পেটে কাঁচা হলুদ-গোলমরিচ ডিটক্স ওয়াটার নিয়মিত গ্রহণ করুন।',
          remediationTipEn:
            'Ensure 100% elimination of refined seed oils and sugar, and take the morning turmeric-black pepper anti-inflammatory detox water daily.',
        },
        {
          id: 'p1_q3_bowel_microbiome',
          baselineContextBn: `পূর্বের অ্যাসেসমেন্ট: মাইক্রোবায়োম স্কোর ${baselineMicrobiome}% ও গাট ক্লিয়ারেন্স`,
          baselineContextEn: `Baseline Assessment: Microbiome Score ${baselineMicrobiome}% & Gut Clearance`,
          questionBn: `ফেজ ২-তে প্রোবায়োটিক ও ফার্মেন্টেড খাবার যুক্ত করার আগে গাট ক্লিয়ারেন্স জরুরি। ফেজ ১ শেষে আপনার প্রতিদিন সকালে মলত্যাগ (Bowel Movement) কি ক্লিয়ার ও নিয়মিত হচ্ছে?`,
          questionEn: `Before introducing Phase 2 probiotics, gut clearance is essential. Compared to your baseline (${baselineMicrobiome}% microbiome score), is your daily bowel movement now regular and complete?`,
          options: [
            {
              score: 2,
              labelBn: 'হ্যাঁ, প্রতিদিন সকালে স্বাভাবিকভাবে ও ক্লিয়ার মলত্যাগ হচ্ছে',
              labelEn: 'Yes, daily regular and complete bowel movement without straining',
              tagBn: 'ফেজ ২-এর জন্য প্রস্তুত',
              tagEn: 'Ready for Phase 2',
            },
            {
              score: 1,
              labelBn: 'আগের চেয়ে ভালো, তবে মাঝে মাঝে কোষ্ঠকাঠিন্য বা অনিয়ম হয়',
              labelEn: 'Better than before, though occasional irregularity happens',
              tagBn: 'আংশিক উন্নতি',
              tagEn: 'Partial',
            },
            {
              score: 0,
              labelBn: 'না, এখনো তীব্র কোষ্ঠকাঠিন্য বা ডায়রিয়া/মিউকাস সমস্যা আছে',
              labelEn: 'No, severe constipation or loose/irritable bowel still persists',
              tagBn: 'গাট ডিটক্স প্রয়োজন',
              tagEn: 'Needs Gut Detox',
            },
          ],
          remediationTipBn:
            'প্রতিদিন পর্যাপ্ত ফাইবারযুক্ত সবজি, ভেজানো চিয়া সিড/ইসবগুল এবং কমপক্ষে ২.৫ লিটার পানি ও রাতের ত্রিফলা/ম্যাগনেসিয়াম রুটিন বজায় রাখুন।',
          remediationTipEn:
            'Increase cooked leafy greens, soaked chia seeds, and 2.5L hydration to clear gut stagnation before starting Phase 2 probiotics.',
        },
        {
          id: 'p1_q4_cravings_redzone',
          baselineContextBn: `পূর্বের অ্যাসেসমেন্ট: খাদ্যাভ্যাস ও রেড-জোন ট্রিগার এলিমিনেশন (${mealFreq} বেলা প্রোটোকল)`,
          baselineContextEn: `Baseline Assessment: Dietary Trigger Elimination (${mealFreq}-Meal Protocol)`,
          questionBn:
            'ফেজ ১-এ ট্রাফিক লাইট ফুড গাইডের রেড-জোন খাবার (চিনি, বেকারি, ভাজাপোড়া ও প্রসেসড খাবার) বন্ধ করার পর আপনার অসময়ে ক্ষুধা ও মিষ্টি/জাঙ্ক ফুডের তীব্র আসক্তি (Cravings) কতটা কমেছে?',
          questionEn:
            'After eliminating Red-Zone trigger foods (sugar, bakery, deep-fried items) in Phase 1, how well have your sugar cravings and between-meal hunger stabilized?',
          options: [
            {
              score: 2,
              labelBn: 'নিরাপদে নিয়ন্ত্রণে — রেড জোন খাবার ছাড়াই সন্তুষ্ট থাকছি ও ক্রেভিংস নেই',
              labelEn: 'Well Controlled — Satisfied on clean meals with minimal junk/sugar cravings',
              tagBn: 'উন্নত (Improved)',
              tagEn: 'Improved',
            },
            {
              score: 1,
              labelBn: 'অনেকটা কমেছে — বিকেলে সামান্য ইচ্ছা হলেও কন্ট্রোল করতে পারি',
              labelEn: 'Mostly Controlled — Occasional mild cravings but easily manageable',
              tagBn: 'আংশিক উন্নতি',
              tagEn: 'Partial',
            },
            {
              score: 0,
              labelBn: 'কন্ট্রোল হচ্ছে না — এখনো চিনি, চা-বিস্কুট বা ভাজাপোড়া খাওয়া হয়ে যাচ্ছে',
              labelEn: 'Not Controlled — Still consuming Red-Zone sugar, bakery, or fried foods',
              tagBn: 'ডিটক্স অসম্পূর্ণ',
              tagEn: 'Detox Incomplete',
            },
          ],
          remediationTipBn:
            'প্রতি বেলা খাবারে পর্যাপ্ত প্রোটিন (মাছ/ডিম/ডাল) ও নির্ধারিত সুস্থ ফ্যাট (ঘি/সরিষা বা অলিভ অয়েল) রাখুন, তাহলে সুগার ক্র্যাশ ও ক্রেভিংস বন্ধ হবে।',
          remediationTipEn:
            'Include adequate protein and allocated healthy fats (ghee/mustard oil) at each meal to prevent blood sugar dips and cravings.',
        },
        {
          id: 'p1_q5_sleep_energy',
          baselineContextBn: `পূর্বের অ্যাসেসমেন্ট: মানসিক ও নার্ভাস সিস্টেম প্রোফাইল (${psychProfile})`,
          baselineContextEn: `Baseline Assessment: Psychological & Circadian Profile (${psychProfile})`,
          questionBn: `আপনার প্রাথমিক অ্যাসেসমেন্টে মানসিক ও ঘুমের প্রোফাইল ছিল '${psychProfile}'। ফেজ ১ শেষে আপনার রাতের ঘুমের গভীরতা এবং সকালে ঘুম থেকে ওঠার পর ফ্রেশনেস কেমন?`,
          questionEn: `Your baseline stress/sleep profile was '${psychProfile}'. After Phase 1, how are your deep sleep quality and morning energy levels?`,
          options: [
            {
              score: 2,
              labelBn: 'অনেক উন্নত — রাতে ভালো ঘুম হচ্ছে এবং সকালে সতেজ হয়ে উঠছি',
              labelEn: 'Much Better — Restful night sleep and waking up refreshed',
              tagBn: 'উন্নত (Improved)',
              tagEn: 'Improved',
            },
            {
              score: 1,
              labelBn: 'মাঝারি উন্নতি — ঘুমের মান আগের চেয়ে কিছুটা ভালো হয়েছে',
              labelEn: 'Moderately Better — Sleep and daytime energy are improving',
              tagBn: 'আংশিক উন্নতি',
              tagEn: 'Partial',
            },
            {
              score: 0,
              labelBn: 'উন্নতি হয়নি — এখনো অনিদ্রা বা সারাদিন তীব্র অবসাদ কাজ করে',
              labelEn: 'No Improvement — Poor sleep and severe daytime exhaustion persist',
              tagBn: 'আরও বিশ্রাম প্রয়োজন',
              tagEn: 'Needs Rest',
            },
          ],
          remediationTipBn:
            'রাত ৮:৩০-এর মধ্যে রাতের খাবার শেষ করুন, ঘুমানোর ১ ঘণ্টা আগে মোবাইল স্ক্রিন বন্ধ রাখুন এবং ১০ মিনিট অনুলোম-বিলোম প্রাণায়াম করুন।',
          remediationTipEn:
            'Finish dinner by 8:30 PM, disconnect screens 1 hour before bed, and practice 10 minutes of evening Anulom-Vilom breathing.',
        },
        buildCohortQuestion(1),
      ];
    }

    // =========================================================================
    // TRANSITION 2 -> 3: Microbiome Restoration -> Metabolic & Insulin Stabilization
    // =========================================================================
    if (targetPhase === Phase.STABILIZATION) {
      return [
        {
          id: 'p2_q1_probiotic_tolerance',
          baselineContextBn: `পূর্বের অ্যাসেসমেন্ট: মাইক্রোবায়োম স্কোর ${baselineMicrobiome}% (${
            profile.analysis?.microbiomeStatus || 'Gut Flora'
          })`,
          baselineContextEn: `Baseline Assessment: Microbiome Score ${baselineMicrobiome}% (${
            profile.analysis?.microbiomeStatus || 'Gut Flora'
          })`,
          questionBn:
            'ফেজ ২-এ প্রোবায়োটিক ও প্রিবায়োটিক খাবার (টক দই, ঘোল, ফার্মেন্টেড খাবার ও শাকসবজির ফাইবার) যুক্ত করার পর আপনার পেটে কি সেগুলো সহজে সহ্য হচ্ছে?',
          questionEn:
            'After introducing probiotic and prebiotic foods (sour yogurt, buttermilk, fermentable fibers) in Phase 2, how well is your gut tolerating them?',
          options: [
            {
              score: 2,
              labelBn: 'চমৎকার — প্রোবায়োটিক ও ফাইবার খাবার পর পেট একদম আরামদায়ক থাকে',
              labelEn: 'Excellent — Probiotics and prebiotic fibers digest comfortably without gas',
              tagBn: 'মাইক্রোবায়োম উন্নত',
              tagEn: 'Microbiome Restored',
            },
            {
              score: 1,
              labelBn: 'মোটামুটি ভালো — অল্প পরিমাণে খেলে কোনো সমস্যা হয় না',
              labelEn: 'Good in Moderation — Well tolerated in standard portions',
              tagBn: 'আংশিক উন্নতি',
              tagEn: 'Partial',
            },
            {
              score: 0,
              labelBn: 'সহ্য হচ্ছে না — দই বা ফাইবার খেলেই পেট ফাঁপা বা অস্বস্তি শুরু হয়',
              labelEn: 'Poor Tolerance — Probiotics or fibers still trigger bloating/discomfort',
              tagBn: 'ফেজ ২ চালিয়ে যান',
              tagEn: 'Continue Phase 2',
            },
          ],
          remediationTipBn:
            'দই বা ঘোল শুধুমাত্র দুপুরে ভাজা জিরা ও বিট লবণ দিয়ে অল্প পরিমাণে খান (রাতে দই খাবেন না) এবং সবজি ভালোভাবে রান্না করে গ্রহণ করুন।',
          remediationTipEn:
            'Take homemade sour yogurt/buttermilk only at lunch with roasted cumin (never at night) and ensure all high-fiber vegetables are well-cooked.',
        },
        {
          id: 'p2_q2_postmeal_insulin',
          baselineContextBn: `পূর্বের অ্যাসেসমেন্ট: মেটাবলিক টাইপ '${profile.metabolicType}'`,
          baselineContextEn: `Baseline Assessment: Metabolic Efficiency '${profile.metabolicType}'`,
          questionBn: `আপনার প্রাথমিক অ্যাসেসমেন্টে মেটাবলিক দক্ষতা ছিল '${profile.metabolicType}'। ফেজ ২ শেষে দুপুরের খাবারের পর অতিরিক্ত ঘুম ভাব (Post-meal crash) বা বিকেলের দুর্বলতা কতটা কমেছে?`,
          questionEn: `Your baseline metabolic efficiency was '${profile.metabolicType}'. After Phase 2, how much has post-lunch drowsiness (insulin spike crash) or afternoon brain fog improved?`,
          options: [
            {
              score: 2,
              labelBn: 'অনেক কমেছে — দুপুরের খাবারের পরও শরীর ও মন সক্রিয় থাকে',
              labelEn: 'Greatly Improved — Steady energy after lunch without sugar crashes',
              tagBn: 'ইনসুলিন সংবেদনশীলতা উন্নত',
              tagEn: 'Insulin Improving',
            },
            {
              score: 1,
              labelBn: 'কিছুটা কমেছে — আগের মতো তীব্র ঘুম ভাব আর আসে না',
              labelEn: 'Moderately Improved — Post-meal sluggishness is milder than baseline',
              tagBn: 'আংশিক উন্নতি',
              tagEn: 'Partial',
            },
            {
              score: 0,
              labelBn: 'এখনো আগের মতোই — ভাত বা খাবার খেলেই তীব্র ঝিমুনি ও ক্লান্তি আসে',
              labelEn: 'No Improvement — Severe post-meal lethargy and sugar crashes persist',
              tagBn: 'মেটাবলিক সাপোর্ট প্রয়োজন',
              tagEn: 'Needs Support',
            },
          ],
          remediationTipBn:
            'খাবারের প্লেটে প্রথমে সালাদ/সবজি ও প্রোটিন খেয়ে সবশেষে শর্করা (ভাত/রুটি) খান এবং খাওয়ার পর অবশ্যই ১৫ মিনিট হাঁটুন।',
          remediationTipEn:
            'Follow meal sequencing (eat fiber/vegetables and protein first, carbs last) and walk briskly for 15 minutes after lunch and dinner.',
        },
        {
          id: 'p2_q3_weight_waist',
          baselineContextBn: `পূর্বের অ্যাসেসমেন্ট: প্রাথমিক ওজন ${profile.weight} kg, উচ্চতা ${profile.height} cm`,
          baselineContextEn: `Baseline Assessment: Weight ${profile.weight} kg, Height ${profile.height} cm`,
          questionBn: `আপনার প্রাথমিক ওজন ছিল ${profile.weight} কেজি। ফেজ ১ ও ২ অনুসরণের পর আপনার পেটের মেদ (Waistline), শরীরের মেটাবলিক শেপ ও ওজনের লক্ষ্যে কি ইতিবাচক পরিবর্তন এসেছে?`,
          questionEn: `Your baseline weight was ${profile.weight} kg. Following Phases 1 & 2, have you noticed positive changes in waist circumference, belly bloating, or healthy weight trajectory?`,
          options: [
            {
              score: 2,
              labelBn: 'হ্যাঁ, পেটের ভুঁড়ি/ফোলাভাব কমেছে এবং ওজন সঠিক লক্ষ্যের দিকে যাচ্ছে',
              labelEn: 'Yes, waistline feels trimmer and weight is moving toward the clinical goal',
              tagBn: 'উন্নত (Improved)',
              tagEn: 'Improved',
            },
            {
              score: 1,
              labelBn: 'সামান্য পরিবর্তন এসেছে — কাপড়চোপড় আগের চেয়ে কিছুটা ঢিলা লাগছে',
              labelEn: 'Slight Improvement — Clothes fit slightly better with less water retention',
              tagBn: 'আংশিক উন্নতি',
              tagEn: 'Partial',
            },
            {
              score: 0,
              labelBn: 'কোনো পরিবর্তন হয়নি — ওজন বা পেটের পরিধি একদম স্থির বা বেড়েছে',
              labelEn: 'No Change — Weight and waist circumference have not improved at all',
              tagBn: 'ক্যালোরি ও কার্ব রিভিউ প্রয়োজন',
              tagEn: 'Needs Review',
            },
          ],
          remediationTipBn: `আপনার ${dinnerRule} নিয়মটি কঠোরভাবে বজায় রাখুন এবং দুই খাবারের মাঝখানে বারবার স্ন্যাকিং বা চিনিযুক্ত চা খাওয়া বন্ধ রাখুন।`,
          remediationTipEn: `Strictly maintain your ${dinnerRule} protocol and avoid grazing between your ${mealFreq} scheduled meals.`,
        },
        {
          id: 'p2_q4_alkaline_skin_tongue',
          baselineContextBn: `পূর্বের অ্যাসেসমেন্ট: অ্যালকালাইন ব্যালেন্স '${profile.alkalineBalance}' (pH ${
            profile.analysis?.alkalineScore || 7.3
          })`,
          baselineContextEn: `Baseline Assessment: Alkaline Balance '${profile.alkalineBalance}' (pH ${
            profile.analysis?.alkalineScore || 7.3
          })`,
          questionBn:
            'সকালে ঘুম থেকে ওঠার পর জিহ্বার সাদা প্রলেপ (Ama/Toxin), মুখের দুর্গন্ধ বা ত্বকের উজ্জ্বলতায় কি ফেজ ২ শেষে উন্নতি লক্ষ্য করেছেন?',
          questionEn:
            'Compared to your initial assessment, have morning tongue coating (Ama), oral freshness, and skin clarity improved after Phase 2?',
          options: [
            {
              score: 2,
              labelBn: 'হ্যাঁ, জিহ্বা পরিষ্কার থাকে এবং ত্বক ও শরীর অনেক সতেজ লাগছে',
              labelEn: 'Yes, tongue is cleaner in the morning and skin/vitality look healthier',
              tagBn: 'টক্সিন মুক্ত',
              tagEn: 'Ama Cleared',
            },
            {
              score: 1,
              labelBn: 'আগের চেয়ে প্রলেপ ও অম্লতা কিছুটা কমেছে',
              labelEn: 'Partially Improved — Less acidity and morning coating than baseline',
              tagBn: 'আংশিক উন্নতি',
              tagEn: 'Partial',
            },
            {
              score: 0,
              labelBn: 'না, এখনো জিহ্বায় পুরু প্রলেপ ও শরীরে অম্লভাব রয়ে গেছে',
              labelEn: 'No, heavy tongue coating and systemic acidity remain unchanged',
              tagBn: 'আরও ক্ষারীয় পুষ্টি প্রয়োজন',
              tagEn: 'Needs Alkalinity',
            },
          ],
          remediationTipBn:
            'প্রতিদিন সবুজ শাকসবজি, লেবু পানি এবং রাতের খাবারের পর মৌরি-জিরা-ধনিয়া চা গ্রহণ অব্যাহত রাখুন।',
          remediationTipEn:
            'Continue daily green vegetables, morning lemon water, and post-dinner CCF (cumin-coriander-fennel) digestive tea.',
        },
        {
          id: 'p2_q5_adherence_rhythm',
          baselineContextBn: `পূর্বের অ্যাসেসমেন্ট: দৈনিক ${mealFreq} বেলা খাবার ও রান্নার তেলের মাপ`,
          baselineContextEn: `Baseline Assessment: ${mealFreq} Meals/Day & Measured Cooking Oil Protocol`,
          questionBn: `ফেজ ৩-এ মেটাবলিক স্ট্যাবিলাইজেশনের জন্য নিয়মানুবর্তিতা জরুরি। আপনি কি দিনে ${mealFreq} বেলা নির্দিষ্ট সময়ে খাবার এবং রান্নার তেল/ঘি-এর নির্ধারিত মাপ ৭৫%+ সময় মেনে চলতে পেরেছেন?`,
          questionEn: `Phase 3 requires metabolic rhythm. Have you consistently followed your ${mealFreq}-meal schedule and measured cooking oil/ghee allocation at least 75% of the time?`,
          options: [
            {
              score: 2,
              labelBn: 'হ্যাঁ, ৮০-১০০% সময় নিয়ম মেনে খাবার ও তেলের মাপ অনুসরণ করেছি',
              labelEn: 'Yes, followed meal timing and oil allocation 80–100% of the time',
              tagBn: 'নিয়মিত (Consistent)',
              tagEn: 'Consistent',
            },
            {
              score: 1,
              labelBn: '৬০-৭৫% সময় মেনে চলেছি, দু-এক দিন অনিয়ম হয়েছে',
              labelEn: 'Followed 60–75% of the time with minor deviations',
              tagBn: 'মাঝারি নিয়মানুবর্তিতা',
              tagEn: 'Moderate',
            },
            {
              score: 0,
              labelBn: 'না, সময়ের অভাবে বা বাইরে খাওয়ার কারণে নিয়মিত মানা হয়নি',
              labelEn: 'No, frequent skipped schedules or unmeasured outside meals',
              tagBn: 'নিয়মিত হওয়া প্রয়োজন',
              tagEn: 'Needs Consistency',
            },
          ],
          remediationTipBn:
            'ফেজ ৩-এ যাওয়ার আগে অন্তত ৫-৭ দিন ডেইলি চেকলিস্ট ও নির্ধারিত সময়ের খাবার রুটিনটি নিয়মিত অনুসরণ করুন।',
          remediationTipEn:
            'Practice 5–7 consistent days of scheduled meals and daily checklist logging before advancing to Phase 3.',
        },
        buildCohortQuestion(2),
      ];
    }

    // =========================================================================
    // TRANSITION 3 -> 4: Metabolic Stabilization -> Longevity & Optimization
    // =========================================================================
    return [
      {
        id: 'p3_q1_metabolic_flexibility',
        baselineContextBn: `পূর্বের অ্যাসেসমেন্ট: মেটাবলিক টাইপ '${profile.metabolicType}' ও কন্ডিশন '${condText}'`,
        baselineContextEn: `Baseline Assessment: Metabolic Type '${profile.metabolicType}' & '${condText}'`,
        questionBn:
          'ফেজ ৩ শেষে এক বেলা খাবার থেকে পরের বেলার খাবারের মধ্যবর্তী সময়ে (৪-৫ ঘণ্টা) আপনার কি মাথা ঘোরা, হাত-পা কাঁপা বা তীব্র ক্ষুধা ছাড়াই স্থির এনার্জি বজায় থাকে?',
        questionEn:
          'At the end of Phase 3, can you comfortably go 4–5 hours between meals and overnight (12–14h circadian fast) with steady energy and zero hypoglycemic shakiness?',
        options: [
          {
            score: 2,
            labelBn: 'হ্যাঁ, ৪-৫ ঘণ্টা এবং রাতের ১২-১৪ ঘণ্টা ফাস্টিং উইন্ডোতে এনার্জি একদম স্থির থাকে',
            labelEn: 'Yes, completely steady energy between meals and during 12–14h overnight fast',
            tagBn: 'মেটাবলিক ফ্লেক্সিবিলিটি অর্জিত',
            tagEn: 'Metabolically Flexible',
          },
          {
            score: 1,
            labelBn: 'প্রায় সময় স্থির থাকে, তবে ভারী কাজের দিন কিছুটা ক্ষুধা লাগে',
            labelEn: 'Mostly steady, with mild hunger only on high-activity days',
            tagBn: 'আংশিক স্থিতিশীল',
            tagEn: 'Mostly Stable',
          },
          {
            score: 0,
            labelBn: 'না, ৩ ঘণ্টা পরই মাথা ব্যথা, সুগার ড্রপ বা তীব্র ক্ষুধা শুরু হয়',
            labelEn: 'No, still experiencing energy crashes or intense hunger every 2–3 hours',
            tagBn: 'ফেজ ৩ চালিয়ে যান',
            tagEn: 'Continue Phase 3',
          },
        ],
        remediationTipBn:
          'দুপুর ও রাতের খাবারে প্রোটিন ও ফাইবারের পরিমাণ বাড়িয়ে দিন এবং রিফাইনড কার্বোহাইড্রেট কমিয়ে মেটাবলিক ফ্লেক্সিবিলিটি তৈরি করুন।',
        remediationTipEn:
          'Increase protein and soluble fiber at main meals while reducing high-glycemic starches to build true metabolic flexibility.',
      },
      {
        id: 'p3_q2_dinner_carb_mastery',
        baselineContextBn: `পূর্বের অ্যাসেসমেন্ট: রাতের শর্করা নিয়ম (${dinnerRule})`,
        baselineContextEn: `Baseline Assessment: Dinner Carbohydrate Strategy (${dinnerRule})`,
        questionBn: `আপনার প্রোফাইলের '${dinnerRule}' নিয়মটি অনুসরণ করার পর সকালে খালি পেটে ওজন, সুগার বা পেটের স্বস্তি কেমন থাকছে?`,
        questionEn: `After following your '${dinnerRule}' protocol in Phase 3, how are your morning fasting markers, morning lightness, and digestive comfort?`,
        options: [
          {
            score: 2,
            labelBn: 'অত্যন্ত ভালো — সকালে পেট একদম হালকা থাকে এবং ফাস্টিং মার্কার উন্নত হয়েছে',
            labelEn: 'Excellent — Waking up light with improved morning fasting markers',
            tagBn: 'উন্নত (Improved)',
            tagEn: 'Improved',
          },
          {
            score: 1,
            labelBn: 'ভালো — বেশিরভাগ দিনই সকালে সতেজ অনুভব করি',
            labelEn: 'Good — Feeling lighter on most mornings',
            tagBn: 'আংশিক উন্নতি',
            tagEn: 'Partial',
          },
          {
            score: 0,
            labelBn: 'সকালে এখনো শরীর ভারী লাগে বা ফাস্টিং সুগার/ওজন নিয়ন্ত্রণে আসেনি',
            labelEn: 'Still waking up heavy or morning fasting levels remain elevated',
            tagBn: 'রাতের ডায়েট সংশোধন প্রয়োজন',
            tagEn: 'Adjust Dinner',
          },
        ],
        remediationTipBn:
          'রাতের খাবারে ভাত/রুটির বদলে লাউ, পেঁপে, ঝিঙে, পালং শাক ও মাছ/ডিমের স্যুপ বা সবজি কার্ব গ্রহণ করে ঘুমানোর ৩ ঘণ্টা আগে খাবার শেষ করুন।',
        remediationTipEn:
          'Switch strictly to low-glycemic vegetable carbs plus lean fish/egg at dinner at least 3 hours before sleep.',
      },
      {
        id: 'p3_q3_stamina_exercise',
        baselineContextBn: `পূর্বের অ্যাসেসমেন্ট: পেশা (${
          profile.profession || 'Active'
        }) ও ফিজিক্যাল স্ট্যামিনা`,
        baselineContextEn: `Baseline Assessment: Profession (${
          profile.profession || 'Active'
        }) & Physical Stamina`,
        questionBn:
          'প্রাথমিক অ্যাসেসমেন্টের তুলনায় এখন আপনার হাঁটাচলা, সিঁড়ি ভাঙা, ব্যায়াম এবং দৈনন্দিন কাজের শারীরিক স্ট্যামিনা কতটা বেড়েছে?',
        questionEn:
          'Compared to your initial assessment before Phase 1, how much have your physical stamina, exercise recovery, and daily work endurance improved?',
        options: [
          {
            score: 2,
            labelBn: 'দ্বিগুণ ভালো — সহজে হাঁপিয়ে উঠি না এবং ব্যায়াম ও কাজ আনন্দের সাথে করছি',
            labelEn: 'Significantly Stronger — High endurance and quick recovery after activity',
            tagBn: 'উন্নত স্ট্যামিনা',
            tagEn: 'High Stamina',
          },
          {
            score: 1,
            labelBn: 'আগের চেয়ে স্ট্যামিনা ও কাজের শক্তি বেশ কিছুটা বেড়েছে',
            labelEn: 'Moderately Improved — Better stamina than before Phase 1',
            tagBn: 'আংশিক উন্নতি',
            tagEn: 'Partial',
          },
          {
            score: 0,
            labelBn: 'এখনো অল্প পরিশ্রমেই হাঁপিয়ে যাই বা পেশিতে দুর্বলতা লাগে',
            labelEn: 'Low Stamina — Still experiencing rapid fatigue or muscle weakness',
            tagBn: 'পুষ্টি ও প্রোটিন বৃদ্ধি প্রয়োজন',
            tagEn: 'Boost Protein',
          },
        ],
        remediationTipBn:
          'প্রতিদিনের প্রোটিন লক্ষ্যমাত্রা পূরণ করুন এবং সাপ্লিমেন্ট ট্যাবের নির্দেশিত ভিটামিন ডি, ম্যাগনেসিয়াম ও ইলেকট্রোলাইট ব্যালেন্স বজায় রাখুন।',
        remediationTipEn:
          'Meet your daily protein gram target and maintain electrolyte, Vitamin D, and magnesium support alongside daily movement.',
      },
      {
        id: 'p3_q4_clinical_labs_meds',
        baselineContextBn: `পূর্বের অ্যাসেসমেন্ট: ওষুধ ও হেলথ গোল (${profile.dietGoals || 'Clinical Optimization'})`,
        baselineContextEn: `Baseline Assessment: Medications & Goal (${profile.dietGoals || 'Clinical Optimization'})`,
        questionBn: `আপনার প্রাথমিক অ্যাসেসমেন্টের লক্ষ্য ছিল '${
          profile.dietGoals || 'স্বাস্থ্য উন্নয়ন'
        }'। ফেজ ১, ২ ও ৩ শেষে আপনার সামগ্রিক শারীরিক উন্নতিতে আপনি কতটা সন্তুষ্ট?`,
        questionEn: `Your initial assessment goal was '${
          profile.dietGoals || 'Metabolic Optimization'
        }'. After completing Phases 1, 2, and 3, how much overall clinical progress have you achieved?`,
        options: [
          {
            score: 2,
            labelBn: '৭৫-১০০% সফল — হজম, এনার্জি, ঘুম ও স্বাস্থ্য সূচকগুলোতে স্পষ্ট উন্নতি হয়েছে',
            labelEn: '75–100% Progress — Clear improvement across digestion, energy, and biomarkers',
            tagBn: 'ফেজ ৪-এর জন্য প্রস্তুত',
            tagEn: 'Ready for Phase 4',
          },
          {
            score: 1,
            labelBn: '৫০-৭০% সফল — বেশ ভালো উন্নতি হয়েছে এবং লংজেভিটি রুটিনে যেতে আগ্রহী',
            labelEn: '50–70% Progress — Solid improvement and ready to build long-term habits',
            tagBn: 'আংশিক উন্নতি',
            tagEn: 'Good Progress',
          },
          {
            score: 0,
            labelBn: '৫০%-এর কম — এখনো মূল লক্ষ্যগুলো পূরণ হয়নি, ফেজ ৩ আরও কিছুদিন করা উচিত',
            labelEn: 'Under 50% — Core goals still need more stabilization in Phase 3',
            tagBn: 'ফেজ ৩ চালিয়ে যান',
            tagEn: 'Stay in Phase 3',
          },
        ],
        remediationTipBn:
          'তাড়াহুড়ো না করে ফেজ ৩-এর মেটাবলিক স্ট্যাবিলাইজেশন চার্টটি আরও ১-২ সপ্তাহ অনুসরণ করুন যাতে ফলাফল স্থায়ী হয়।',
        remediationTipEn:
          'Continue Phase 3 Metabolic Stabilization for another 1–2 weeks to lock in your cellular and metabolic gains.',
      },
      {
        id: 'p3_q5_self_regulation',
        baselineContextBn: `পূর্বের অ্যাসেসমেন্ট: বাংলাদেশ ফুড কম্পোজিশন ট্রাফিক লাইট ফুড গাইড অভ্যস্ততা`,
        baselineContextEn: `Baseline Assessment: BD Food Composition Traffic Light Self-Mastery`,
        questionBn:
          'ফেজ ৪ (লংজেভিটি ও মেইনটেন্যান্স)-এ আপনি নিজেই কোন খাবার গ্রিন জোন আর কোন খাবার রেড জোন তা বুঝে চলতে পারবেন কি?',
        questionEn:
          'For Phase 4 (Longevity & Maintenance), do you feel confident identifying your Green-Zone vs. Red-Zone foods and self-correcting after social meals?',
        options: [
          {
            score: 2,
            labelBn: 'হ্যাঁ, কোন খাবার আমার শরীরের জন্য ভালো ও কোনটি ক্ষতিকর তা এখন স্পষ্ট বুঝতে পারি',
            labelEn: 'Yes, I clearly understand my body’s food responses and exchange rules',
            tagBn: 'স্বয়ংসম্পূর্ণ',
            tagEn: 'Self-Reliant',
          },
          {
            score: 1,
            labelBn: 'হ্যাঁ, ডায়েট চার্ট ও এক্সচেঞ্জ লিস্ট দেখে সহজেই মেনে চলতে পারি',
            labelEn: 'Yes, with the Phase 4 chart and exchange list I can maintain it easily',
            tagBn: 'প্রস্তুত',
            tagEn: 'Ready',
          },
          {
            score: 0,
            labelBn: 'না, এখনো খাবারের পরিমাপ ও সিলেকশন নিয়ে দ্বিধায় থাকি',
            labelEn: 'No, I still struggle with food portions and trigger identification',
            tagBn: 'আরও অনুশীলন প্রয়োজন',
            tagEn: 'Needs Practice',
          },
        ],
        remediationTipBn:
          'ডায়েট ভিউয়ের এক্সচেঞ্জ ও ডিটক্স ট্যাব এবং ট্রাফিক লাইট ফুড গাইডটি আরেকবার দেখে আপনার পছন্দের গ্রিন জোন খাবারগুলো সিলেক্ট করে নিন।',
        remediationTipEn:
          'Review the Food Exchange tab and Traffic Light Guide to master your Green-Zone food substitutions.',
      },
      buildCohortQuestion(3),
    ];
  }, [profile, targetPhase, isBn]);

  if (!isOpen) return null;

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(selectedScores).length;
  const allAnswered = answeredCount === totalQuestions;

  const handleSelectOption = (qId: string, score: 2 | 1 | 0) => {
    setSelectedScores((prev) => ({ ...prev, [qId]: score }));
    if (submittedResult) {
      setSubmittedResult(null);
    }
  };

  const handleEvaluateImprovement = () => {
    if (!allAnswered) return;
    const maxPoints = totalQuestions * 2;
    const earnedPoints = questions.reduce((sum, q) => sum + (selectedScores[q.id] ?? 0), 0);
    const scorePercent = Math.round((earnedPoints / maxPoints) * 100);
    const zeroCount = questions.filter((q) => selectedScores[q.id] === 0).length;

    // Improved if score >= 65% and at most 1 unimproved (0-score) marker
    const improved = scorePercent >= 65 && zeroCount <= 1;
    const unimprovedItems = questions.filter((q) => (selectedScores[q.id] ?? 0) < 2);

    const summaryBn = improved
      ? `অভিনন্দন! আপনার পূর্বে করা অ্যাসেসমেন্ট ফর্মের তুলনায় ${
          PHASE_NAMES_BN[fromPhase] || `ফেজ ${fromPhase}`
        }-এ আপনার শারীরিক উপসর্গ ও বায়োমার্কারে ${scorePercent}% উন্নতি পরিলক্ষিত হয়েছে। আপনি এখন ${
          PHASE_NAMES_BN[targetPhase] || `ফেজ ${targetPhase}`
        }-এর ডায়েট চার্ট পাওয়ার জন্য সম্পূর্ণ প্রস্তুত।`
      : `আপনার পূর্বে করা অ্যাসেসমেন্ট ফর্মের আলোকে বর্তমান উন্নতির হার ${scorePercent}% (পরবর্তী ফেজে যেতে ন্যূনতম ৬৫% উন্নতি প্রয়োজন)। আপনার হজম, প্রদাহ বা মেটাবলিক সূচকগুলো আরও স্থিতিশীল করতে বর্তমান ফেজ (${
          PHASE_NAMES_BN[fromPhase] || `ফেজ ${fromPhase}`
        }) আরও কয়েকদিন অনুসরণ করার পরামর্শ দেওয়া হচ্ছে।`;

    const summaryEn = improved
      ? `Congratulations! Compared to your initial Assessment Form, you achieved a ${scorePercent}% clinical improvement in ${
          PHASE_NAMES_EN[fromPhase] || `Phase ${fromPhase}`
        }. You are now clinically ready to unlock your ${
          PHASE_NAMES_EN[targetPhase] || `Phase ${targetPhase}`
        } Diet Chart.`
      : `Based on your initial Assessment Form markers, your current improvement score is ${scorePercent}% (minimum 65% required to advance). We recommend continuing ${
          PHASE_NAMES_EN[fromPhase] || `Phase ${fromPhase}`
        } for a few more days with the targeted adjustments below before moving to Phase ${targetPhase}.`;

    setSubmittedResult({
      scorePercent,
      improved,
      unimprovedItems,
      summaryBn,
      summaryEn,
    });

    void recordPhaseAssessmentProgress({
      currentPhase: fromPhase,
      targetPhase,
      improved,
      improvementScore: scorePercent / 100,
      baselineConditions: [profile.medicalConditions || profile.dosha || 'Metabolic'],
      answers: Object.fromEntries(
        Object.entries(selectedScores).map(([k, v]) => [k, String(v)])
      ),
      recommendationBn: summaryBn,
      recommendationEn: summaryEn,
    });
  };

  const handleConfirmUnlockNextPhase = () => {
    if (!submittedResult || !submittedResult.improved) return;

    const existingUnlocked = profile.unlockedPhases || [Phase.DETOX];
    const nextUnlocked = Array.from(new Set([...existingUnlocked, fromPhase, targetPhase])).sort(
      (a, b) => a - b
    ) as Phase[];

    const record: PhaseEvaluationRecord = {
      fromPhase,
      toPhase: targetPhase,
      completedAt: new Date().toISOString(),
      scorePercent: submittedResult.scorePercent,
      improved: true,
      answers: selectedScores,
      clinicalSummaryBn: submittedResult.summaryBn,
      clinicalSummaryEn: submittedResult.summaryEn,
    };

    const updatedProfile: HealthProfile = {
      ...profile,
      unlockedPhases: nextUnlocked,
      phaseEvaluations: {
        ...(profile.phaseEvaluations || {}),
        [targetPhase]: record,
      },
      microbiomeScore: Math.min(98, (profile.microbiomeScore || 65) + 5),
      inflammatoryIndex: Math.max(1, (profile.inflammatoryIndex || 5) - 1),
    };

    onApprovedTransition(targetPhase, updatedProfile, record);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-[32px] border-2 shadow-2xl p-5 sm:p-8 space-y-6 ${
          darkMode
            ? 'bg-slate-900 border-emerald-500/40 text-white'
            : 'bg-white border-emerald-200 text-slate-900'
        }`}
      >
        {/* Top Modal Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>
                {isBn
                  ? `ফেজ পরিবর্তন ক্লিনিক্যাল মূল্যায়ন (ফেজ ${fromPhase} ➔ ফেজ ${targetPhase})`
                  : `Phase Transition Clinical Evaluation (Phase ${fromPhase} ➔ Phase ${targetPhase})`}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              {isBn
                ? `${PHASE_NAMES_BN[targetPhase] || `ফেজ ${targetPhase}`}-এ উত্তরণের পূর্বে শারীরিক উন্নতি যাচাই`
                : `Verify Clinical Improvement Before Unlocking Phase ${targetPhase}`}
            </h2>
            <p className="text-xs opacity-75 leading-relaxed">
              {isBn
                ? 'আপনার প্রথম ফেজের পূর্বে করা অ্যাসেসমেন্ট ফর্মের তথ্যের আলোকে নিচের প্রশ্নগুলোর উত্তর দিন। আপনার শারীরিক উন্নতি (Improvement) নিশ্চিত হলেই পরবর্তী ফেজের ডায়েট চার্ট আনলক হবে।'
                : 'Answer the clinical follow-up questions below generated from your initial Assessment Form. Once improvement is verified, your next phase Diet Chart will be unlocked.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl border transition-colors shrink-0 ${
              darkMode
                ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sequential Phase Gate Warning if user tries to skip a phase */}
        {isSkippingPhase ? (
          <div
            className={`p-6 rounded-3xl border-2 space-y-4 ${
              darkMode
                ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                : 'bg-amber-50 border-amber-300 text-amber-950'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-2xl bg-amber-500 text-white shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base sm:text-lg font-extrabold">
                  {isBn
                    ? `ফেজ ${targetPhase}-এ যাওয়ার আগে ফেজ ${requiredPrerequisitePhase} সম্পন্ন করা আবশ্যক`
                    : `Complete Phase ${requiredPrerequisitePhase} Before Advancing to Phase ${targetPhase}`}
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed opacity-90">
                  {isBn
                    ? `ক্লিনিক্যাল প্রোটোকল অনুযায়ী ধাপে ধাপে শারীরিক উন্নতি যাচাই করে পরবর্তী ফেজে যেতে হয়। অনুগ্রহ করে প্রথমে ফেজ ${requiredPrerequisitePhase} (${PHASE_NAMES_BN[requiredPrerequisitePhase]}) সম্পন্ন ও মূল্যায়ন করুন।`
                    : `Our clinical protocol requires sequential phase progression. Please complete and verify improvement in Phase ${requiredPrerequisitePhase} (${PHASE_NAMES_EN[requiredPrerequisitePhase]}) first.`}
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-extrabold"
              >
                {isBn ? 'ঠিক আছে, বর্তমান ফেজে ফিরুন' : 'Return to Current Phase'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Baseline Assessment Summary Strip */}
            <div
              className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
                darkMode
                  ? 'bg-slate-800/70 border-slate-700'
                  : 'bg-emerald-50/70 border-emerald-200/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Activity className="w-5 h-5 text-emerald-500 shrink-0" />
                <div>
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    {isBn
                      ? 'আপনার পূর্ববর্তী অ্যাসেসমেন্ট ফর্মের বেসলাইন রেকর্ড'
                      : 'Your Pre-Phase 1 Baseline Assessment Record'}
                  </div>
                  <div className="text-xs font-bold mt-0.5">
                    {isBn
                      ? `দোষ: ${profile.dosha} • মাইক্রোবায়োম: ${profile.microbiomeScore}% • প্রদাহ সূচক: ${profile.inflammatoryIndex}/10 • ওজন: ${profile.weight}kg`
                      : `Dosha: ${profile.dosha} • Microbiome: ${profile.microbiomeScore}% • Inflammation: ${profile.inflammatoryIndex}/10 • Weight: ${profile.weight}kg`}
                  </div>
                </div>
              </div>
              <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-emerald-600 text-white tabular-nums">
                {answeredCount} / {totalQuestions} {isBn ? 'উত্তর প্রদান' : 'Answered'}
              </span>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {questions.map((q, idx) => {
                const currentScore = selectedScores[q.id];
                return (
                  <div
                    key={q.id}
                    className={`p-4 sm:p-5 rounded-3xl border transition-all space-y-3 ${
                      currentScore !== undefined
                        ? darkMode
                          ? 'bg-slate-800/80 border-emerald-500/40'
                          : 'bg-emerald-50/30 border-emerald-300'
                        : darkMode
                        ? 'bg-slate-800/40 border-slate-800'
                        : 'bg-slate-50/70 border-slate-200/80'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/25">
                        📋 {isBn ? q.baselineContextBn : q.baselineContextEn}
                      </span>
                      <span className="text-xs font-mono font-bold opacity-60">
                        #{idx + 1}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-extrabold leading-snug">
                      {isBn ? q.questionBn : q.questionEn}
                    </h3>

                    <div className="grid grid-cols-1 gap-2 pt-1">
                      {q.options.map((opt) => {
                        const isSelected = currentScore === opt.score;
                        const activeColors =
                          opt.score === 2
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                            : opt.score === 1
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                            : 'bg-rose-600 text-white border-rose-500 shadow-md';

                        return (
                          <button
                            key={opt.score}
                            type="button"
                            onClick={() => handleSelectOption(q.id, opt.score)}
                            className={`w-full p-3 rounded-2xl border text-left text-xs sm:text-sm font-bold flex items-center justify-between gap-3 transition-all ${
                              isSelected
                                ? activeColors
                                : darkMode
                                ? 'bg-slate-900 border-slate-700 text-slate-200 hover:border-slate-600'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <span>{isBn ? opt.labelBn : opt.labelEn}</span>
                            <span
                              className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold shrink-0 ${
                                isSelected
                                  ? 'bg-black/20 text-white'
                                  : opt.score === 2
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                  : opt.score === 1
                                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                              }`}
                            >
                              {isBn ? opt.tagBn : opt.tagEn}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Evaluation Result Banner */}
            {submittedResult && (
              <div
                className={`p-5 sm:p-6 rounded-3xl border-2 space-y-4 animate-in fade-in duration-300 ${
                  submittedResult.improved
                    ? darkMode
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-100'
                      : 'bg-emerald-50 border-emerald-400 text-emerald-950'
                    : darkMode
                    ? 'bg-rose-950/40 border-rose-500/60 text-rose-100'
                    : 'bg-rose-50 border-rose-300 text-rose-950'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-3 rounded-2xl text-white shrink-0 ${
                        submittedResult.improved ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}
                    >
                      {submittedResult.improved ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : (
                        <AlertTriangle className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <span className="text-[11px] font-black uppercase tracking-wider opacity-75 block">
                        {submittedResult.improved
                          ? isBn
                            ? '✓ শারীরিক উন্নতি নিশ্চিত হয়েছে (Improvement Verified)'
                            : '✓ Clinical Improvement Verified'
                          : isBn
                          ? '⚠️ আরও স্থিতিশীলতা প্রয়োজন (More Stabilization Needed)'
                          : '⚠️ Current Phase Stabilization Needed'}
                      </span>
                      <h4 className="text-lg sm:text-xl font-extrabold">
                        {isBn
                          ? `উন্নতির স্কোর: ${submittedResult.scorePercent}%`
                          : `Clinical Improvement Score: ${submittedResult.scorePercent}%`}
                      </h4>
                    </div>
                  </div>

                  <div className="px-4 py-2 rounded-2xl font-mono text-sm font-black bg-black/10 dark:bg-white/10 tabular-nums self-start sm:self-center">
                    {submittedResult.improved
                      ? isBn
                        ? `ফেজ ${targetPhase} আনলক প্রস্তুত`
                        : `Phase ${targetPhase} Ready`
                      : isBn
                      ? `ফেজ ${fromPhase} চালিয়ে যান`
                      : `Continue Phase ${fromPhase}`}
                  </div>
                </div>

                <p className="text-xs sm:text-sm leading-relaxed font-medium">
                  {isBn ? submittedResult.summaryBn : submittedResult.summaryEn}
                </p>

                {/* Specific Clinical Adjustments if Not Improved or Partial */}
                {submittedResult.unimprovedItems.length > 0 && (
                  <div
                    className={`p-4 rounded-2xl border space-y-2 ${
                      darkMode ? 'bg-slate-900/80 border-slate-700' : 'bg-white/90 border-slate-200'
                    }`}
                  >
                    <div className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
                      {isBn
                        ? '🩺 আপনার অ্যাসেসমেন্টের আলোকে বিশেষ ক্লিনিক্যাল পরামর্শ:'
                        : '🩺 Personalized Clinical Recommendations Based on Your Assessment:'}
                    </div>
                    <ul className="space-y-1.5 text-xs">
                      {submittedResult.unimprovedItems.map((item) => (
                        <li key={item.id} className="flex items-start gap-2">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span>{isBn ? item.remediationTipBn : item.remediationTipEn}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {submittedResult.improved ? (
                  <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleConfirmUnlockNextPhase}
                      className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>
                        {isBn
                          ? `ফেজ ${targetPhase}-এর ডায়েট চার্ট নিন (${PHASE_NAMES_BN[targetPhase]}) →`
                          : `Unlock & Generate Phase ${targetPhase} Diet Chart →`}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setSubmittedResult(null)}
                      className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
                        darkMode
                          ? 'border-slate-700 bg-slate-800 text-slate-200'
                          : 'border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{isBn ? 'উত্তরগুলো পুনরায় যাচাই করুন' : 'Review Answers'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold"
                    >
                      {isBn
                        ? `ফেজ ${fromPhase}-এর ডায়েট চার্ট আরও কয়েকদিন চালিয়ে যান`
                        : `Continue Phase ${fromPhase} Diet Chart`}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Modal Footer Action */}
            {!submittedResult && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-xs opacity-70">
                  {allAnswered
                    ? isBn
                      ? '✓ সবগুলো প্রশ্নের উত্তর দেওয়া হয়েছে। এখন উন্নতি যাচাই করুন।'
                      : '✓ All questions answered. Click to evaluate clinical improvement.'
                    : isBn
                    ? `পরবর্তী ফেজে যেতে সবগুলো (${totalQuestions}টি) প্রশ্নের উত্তর দিন।`
                    : `Please answer all ${totalQuestions} questions to evaluate phase readiness.`}
                </span>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className={`px-4 py-3 rounded-xl border text-xs font-bold ${
                      darkMode
                        ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {isBn ? 'বাতিল' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    disabled={!allAnswered}
                    onClick={handleEvaluateImprovement}
                    className={`flex-1 sm:flex-initial px-6 py-3 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all shadow-lg ${
                      allAnswered
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-95'
                        : 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>
                      {isBn
                        ? `উন্নতি যাচাই করুন ও ফেজ ${targetPhase} মূল্যায়ন দেখুন`
                        : `Evaluate Improvement for Phase ${targetPhase}`}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PhaseTransitionModal;
