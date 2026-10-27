import React, { useState } from 'react';
import { Language } from '../types';
import { translations } from '../i18n';

interface Props {
  lang: Language;
  darkMode?: boolean;
}

type ScreenLevel = 'hub' | 'calculators_grid' | 'assessments_grid' | 'calculator_detail' | 'assessment_detail';

type CalculatorId =
  | 'bmi'
  | 'ibw'
  | 'bmr'
  | 'tdee'
  | 'whr'
  | 'bodyfat'
  | 'macro'
  | 'water'
  | 'glycemic'
  | 'sleep';

type AssessmentId =
  | 'pcos'
  | 'gut'
  | 'microbiome'
  | 'metabolic'
  | 'liver'
  | 'thyroid'
  | 'inflammation'
  | 'micronutrient';

interface CalculatorMeta {
  id: CalculatorId;
  icon: string;
  categoryBn: string;
  categoryEn: string;
  titleBn: string;
  titleEn: string;
  descBn: string;
  descEn: string;
  accent: string;
}

interface AssessmentQuestion {
  qBn: string;
  qEn: string;
}

interface AssessmentMeta {
  id: AssessmentId;
  icon: string;
  categoryBn: string;
  categoryEn: string;
  titleBn: string;
  titleEn: string;
  descBn: string;
  descEn: string;
  accent: string;
  questions: AssessmentQuestion[];
  rootCauseBn: string;
  rootCauseEn: string;
  eatFoodsBn: string[];
  eatFoodsEn: string[];
  avoidFoodsBn: string[];
  avoidFoodsEn: string[];
  protocolBn: string[];
  protocolEn: string[];
}

interface CalcReport {
  primaryValue: string;
  unit: string;
  statusLabel: string;
  statusZone: 'green' | 'yellow' | 'red';
  referenceRange: string;
  summary: string;
  metrics?: { label: string; value: string }[];
  recommendations: string[];
}

const CALCULATORS: CalculatorMeta[] = [
  {
    id: 'bmi',
    icon: '⚖️',
    categoryBn: 'অ্যানথ্রোপোমেট্রিক ইনডেক্স',
    categoryEn: 'Anthropometric Index',
    titleBn: 'বিএমআই ক্যালকুলেটর (BMI)',
    titleEn: 'BMI & Asian Cutoff Calculator',
    descBn: 'উচ্চতা ও ওজনের অনুপাতে শরীরের ভর সূচক এবং এশিয়ান মেটাবলিক স্ট্যান্ডার্ড অনুযায়ী ঝুঁকি নির্ণয়।',
    descEn: 'Calculate Body Mass Index with South Asian clinical cutoffs and metabolic risk analysis.',
    accent: 'border-indigo-500/30 hover:border-indigo-500'
  },
  {
    id: 'ibw',
    icon: '🎯',
    categoryBn: 'টার্গেট বডি কম্পোজিশন',
    categoryEn: 'Target Body Composition',
    titleBn: 'আইডিয়াল ওয়েট (Ideal Weight)',
    titleEn: 'Ideal Body Weight (IBW)',
    descBn: 'আপনার উচ্চতা ও লিঙ্গ অনুযায়ী আদর্শ ওজন এবং নিরাপদ ওজন সীমা (Frame Range) জানুন।',
    descEn: 'Determine your clinically optimal body weight and healthy weight range for your height.',
    accent: 'border-emerald-500/30 hover:border-emerald-500'
  },
  {
    id: 'bmr',
    icon: '🔥',
    categoryBn: 'মেটাবলিক এনার্জি',
    categoryEn: 'Metabolic Energy',
    titleBn: 'বিএমআর ক্যালকুলেটর (BMR)',
    titleEn: 'BMR & 4-Phase Calorie Target',
    descBn: 'বিশ্রাম অবস্থায় শরীরের ন্যূনতম ক্যালোরি চাহিদা এবং ৪টি ফেজের থেরাপিউটিক ক্যালোরি চার্ট।',
    descEn: 'Basal Metabolic Rate plus Functional Medicine Phase 1–4 calorie targets.',
    accent: 'border-amber-500/30 hover:border-amber-500'
  },
  {
    id: 'tdee',
    icon: '⚡',
    categoryBn: 'দৈনিক শক্তি ব্যয়',
    categoryEn: 'Daily Energy Expenditure',
    titleBn: 'দৈনিক ক্যালোরি চাহিদা (TDEE)',
    titleEn: 'TDEE & Daily Calorie Burn',
    descBn: 'শারীরিক পরিশ্রম অনুযায়ী সারাদিনে মোট কত ক্যালোরি খরচ হয় এবং ওজন কমানোর লক্ষ্যমাত্রা।',
    descEn: 'Total Daily Energy Expenditure based on physical activity and lifestyle intensity.',
    accent: 'border-blue-500/30 hover:border-blue-500'
  },
  {
    id: 'whr',
    icon: '📏',
    categoryBn: 'ভিসেরাল ফ্যাট ও কার্ডিও রিস্ক',
    categoryEn: 'Visceral Fat & Cardio Risk',
    titleBn: 'ওয়েস্ট-টু-হিপ রেশিও (WHR)',
    titleEn: 'Waist-to-Hip & Visceral Fat Risk',
    descBn: 'কোমর ও নিতম্বের অনুপাত থেকে পেটের ভেতরের চর্বি (Visceral Fat) ও ইনসুলিন রেজিস্ট্যান্স ঝুঁকি নির্ণয়।',
    descEn: 'Assess abdominal obesity, fatty liver risk, and insulin resistance via waist-to-hip ratio.',
    accent: 'border-rose-500/30 hover:border-rose-500'
  },
  {
    id: 'bodyfat',
    icon: '🧬',
    categoryBn: 'বডি কম্পোজিশন',
    categoryEn: 'Body Composition',
    titleBn: 'বডি ফ্যাট পার্সেন্টেজ (Body Fat %)',
    titleEn: 'Clinical Body Fat & Lean Mass',
    descBn: 'শরীরে চর্বির শতকরা হার এবং পেশীর ওজন (Lean Body Mass) নিখুঁতভাবে হিসাব করুন।',
    descEn: 'Estimate total body fat percentage, fat mass (kg), and metabolically active lean mass.',
    accent: 'border-purple-500/30 hover:border-purple-500'
  },
  {
    id: 'macro',
    icon: '🥑',
    categoryBn: 'ফাংশনাল নিউট্রিশন রেশিও',
    categoryEn: 'Functional Macro Split',
    titleBn: 'ম্যাক্রো, প্রোটিন ও তেল ক্যালকুলেটর',
    titleEn: 'Macro (40:30:30), Protein & Oil Split',
    descBn: '৪০% কার্ব, ৩০% প্রোটিন, ৩০% ফ্যাট, ১ গ্রাম/কেজি প্রোটিন এবং রান্নার তেলের সঠিক মাপ।',
    descEn: 'Calculate exact 40:30:30 macros, 1g/kg protein split, and daily cooking oil allowance.',
    accent: 'border-teal-500/30 hover:border-teal-500'
  },
  {
    id: 'water',
    icon: '💧',
    categoryBn: 'সেলুলার হাইড্রেশন',
    categoryEn: 'Cellular Hydration',
    titleBn: 'পানি ও ইলেক্ট্রোলাইট ক্যালকুলেটর',
    titleEn: 'Hydration & Electrolyte Needs',
    descBn: 'ওজন ও আবহাওয়া অনুযায়ী দৈনিক কত লিটার পানি, গ্লাসের হিসাব এবং ডিটক্স ওয়াটার গাইড।',
    descEn: 'Daily water intake in liters, glass count, and Ayurvedic electrolyte hydration schedule.',
    accent: 'border-cyan-500/30 hover:border-cyan-500'
  },
  {
    id: 'glycemic',
    icon: '🌾',
    categoryBn: 'ব্লাড সুগার ও ইনসুলিন',
    categoryEn: 'Blood Sugar & Insulin',
    titleBn: 'গ্লাইসেমিক লোড ক্যালকুলেটর (GL)',
    titleEn: 'Glycemic Load & Glucose Spike',
    descBn: 'যেকোনো খাবারের গ্লাইসেমিক ইনডেক্স ও কার্বোহাইড্রেট থেকে ইনসুলিন স্পাইক ঝুঁকি মাপুন।',
    descEn: 'Evaluate how a meal impacts blood glucose and insulin levels using Glycemic Load.',
    accent: 'border-orange-500/30 hover:border-orange-500'
  },
  {
    id: 'sleep',
    icon: '🌙',
    categoryBn: 'সার্কাডিয়ান বায়োরিদম',
    categoryEn: 'Circadian Biorhythm',
    titleBn: 'স্লিপ সাইকেল ও হরমোন রিসেট',
    titleEn: 'Circadian Sleep Cycle Calculator',
    descBn: '৯০ মিনিটের ঘুমের সাইকেল অনুযায়ী কখন ঘুমালে ও উঠলে শরীর ঝরঝরে থাকবে তা জানুন।',
    descEn: 'Optimize 90-minute REM/Deep sleep cycles and cortisol-melatonin circadian rhythm.',
    accent: 'border-violet-500/30 hover:border-violet-500'
  }
];

const ASSESSMENTS: AssessmentMeta[] = [
  {
    id: 'pcos',
    icon: '🌸',
    categoryBn: 'হরমোনাল ও এন্ডোক্রাইন হেলথ',
    categoryEn: 'Hormonal & Endocrine Health',
    titleBn: 'পিসিওএস ও হরমোনাল অ্যাসেসমেন্ট',
    titleEn: 'PCOS & Hormonal Balance Assessment',
    descBn: 'অনিয়মিত পিরিয়ড, অতিরিক্ত লোম, ব্রণ, ওজন বৃদ্ধি ও ইনসুলিন রেজিস্ট্যান্সের ফাংশনাল মূল্যায়ন।',
    descEn: 'Evaluate androgen excess, ovulatory regularity, insulin resistance, and hormonal harmony.',
    accent: 'border-pink-500/30 hover:border-pink-500',
    questions: [
      {
        qBn: '১. আপনার পিরিয়ড কি অনিয়মিত হয় (৩৫ দিনের বেশি গ্যাপ বা বছরে ৮ বারের কম)?',
        qEn: '1. Are your menstrual cycles irregular (more than 35 days apart or fewer than 8 cycles/year)?'
      },
      {
        qBn: '২. মুখ, থুতনি বা শরীরে অবাঞ্ছিত লোম (Hirsutism) বা তীব্র ব্রণের সমস্যা আছে কি?',
        qEn: '2. Do you experience excess facial/body hair, jawline acne, or scalp hair thinning?'
      },
      {
        qBn: '৩. পেটের নিচের অংশে চর্বি জমেছে এবং চেষ্টা করেও ওজন কমানো কঠিন হচ্ছে কি?',
        qEn: '3. Do you struggle with stubborn lower-belly weight gain and difficulty losing weight?'
      },
      {
        qBn: '৪. ঘাড়ের পেছনে বা বগলে কালচে দাগ (Acanthosis Nigricans) বা মিষ্টি খাওয়ার তীব্র ক্রেভিং হয় কি?',
        qEn: '4. Do you have dark velvety skin patches on the neck/underarms or intense sugar cravings?'
      },
      {
        qBn: '৫. পিরিয়ডের আগে তীব্র মুড সুইং, খিটখিটে মেজাজ বা স্তনে ব্যথা অনুভব করেন কি?',
        qEn: '5. Do you experience severe PMS, mood swings, anxiety, or breast tenderness before periods?'
      },
      {
        qBn: '৬. দুপুরে খাবারের পর তীব্র ক্লান্তি বা ঘুম ঘুম ভাব এবং হরমোনজনিত অবসাদ থাকে কি?',
        qEn: '6. Do you feel extreme post-meal fatigue, brain fog, or afternoon energy crashes?'
      }
    ],
    rootCauseBn: 'পিসিওএস-এর প্রধান রুট কজ হলো ইনসুলিন রেজিস্ট্যান্স (৭০% ক্ষেত্রে), ক্রনিক প্রদাহ এবং অ্যাড্রেনাল অ্যান্ড্রোজেন আধিক্য। রক্তে অতিরিক্ত ইনসুলিন ওভারিকে টেস্টোস্টেরন তৈরিতে উদ্দীপিত করে ডিম্বস্ফোটন বাধাগ্রস্ত করে।',
    rootCauseEn: 'The primary root drivers of PCOS are cellular insulin resistance, chronic low-grade inflammation, and adrenal androgen excess, which disrupt ovarian follicular maturation.',
    eatFoodsBn: ['তিসি ও চিয়া সিড (Seed Cycling)', 'দারুচিনি ও মেথি ভেজানো পানি', 'করলা, ব্রকলি, পালং শাক ও দেশি সবজি', 'দেশি ডিম, ছোট মাছ ও অলিভ অয়েল/ঘি'],
    eatFoodsEn: ['Flaxseeds & Chia Seeds (Seed Cycling)', 'Ceylon Cinnamon & Fenugreek water', 'Bitter gourd, cruciferous greens & local vegetables', 'Free-range eggs, small fish & cold-pressed fats'],
    avoidFoodsBn: ['সাদা চিনি, মিষ্টি, বেকারি ও সাদা ময়দা', 'গরুর দুধ ও প্রসেসড ডেইরি (IGF-1 বাড়ায়)', 'সয়াবিন তেল ও ভাজাপোড়া খাবার'],
    avoidFoodsEn: ['Refined sugar, sweets, bakery & white flour', 'Conventional A1 dairy (triggers IGF-1 & acne)', 'Refined soybean oil & deep-fried snacks'],
    protocolBn: [
      '১৬:৮ বা ১৪:১০ ইন্টারমিটেন্ট ফাস্টিং অনুসরণ করুন (সন্ধ্যার পর কার্বোহাইড্রেট বন্ধ)।',
      'প্রতিদিন সকালে খালি পেটে মেথি ও দারুচিনি ভেজানো পানি পান করুন।',
      'মায়ো-ইনোসিটল (Myo-Inositol), ভিটামিন ডি৩ এবং ম্যাগনেসিয়াম গ্লাইসিনেট যুক্ত করুন।'
    ],
    protocolEn: [
      'Practice 14:10 or 16:8 Intermittent Fasting to lower fasting insulin.',
      'Start mornings with warm fenugreek and cinnamon infused water.',
      'Consider Myo-Inositol, Vitamin D3+K2, and Magnesium Glycinate alongside strength training.'
    ]
  },
  {
    id: 'gut',
    icon: '🌿',
    categoryBn: 'ডাইজেস্টিভ ও অগ্নি অ্যাসেসমেন্ট',
    categoryEn: 'Digestive Fire (Agni) & Leaky Gut',
    titleBn: 'গাট হেলথ ও হজমশক্তি অ্যাসেসমেন্ট',
    titleEn: 'Gut Health & Digestive Agni Assessment',
    descBn: 'গ্যাস, ব্লোটিং, অ্যাসিডিটি, আইবিএস (IBS), কোষ্ঠকাঠিন্য ও লিকি গাট লক্ষণের ফাংশনাল স্ক্রিনিং।',
    descEn: 'Assess stomach acid (HCl), digestive enzymes, bloating, IBS symptoms, and intestinal permeability.',
    accent: 'border-emerald-500/30 hover:border-emerald-500',
    questions: [
      {
        qBn: '১. খাবার খাওয়ার ৩০-৬০ মিনিটের মধ্যে পেট ফাঁপা (Bloating) বা পেটে গ্যাস জমে শক্ত হয়ে যায় কি?',
        qEn: '1. Do you experience abdominal bloating, distension, or gas within 30–60 minutes after eating?'
      },
      {
        qBn: '২. বুক জ্বালাপোড়া (Acidity/GERD), টক ঢেকুর বা গলায় খাবার উঠে আসার অনুভূতি হয় কি?',
        qEn: '2. Do you suffer from acid reflux, heartburn, burping, or indigestion regularly?'
      },
      {
        qBn: '৩. আপনার কি প্রতিদিন ক্লিয়ার বাওয়েল মুভমেন্ট হয় না (কোষ্ঠকাঠিন্য বা দিনে বারবার নরম পায়খানা/IBS)?',
        qEn: '3. Do you have irregular bowel movements (constipation, incomplete evacuation, or loose IBS stools)?'
      },
      {
        qBn: '৪. দুধ, গমের রুটি (Gluten), ডাল বা শাকসবজি খেলে পেটে অস্বস্তি বা কামড় দেয় কি?',
        qEn: '4. Do specific foods like wheat/roti, milk, pulses, or raw salads trigger stomach cramping?'
      },
      {
        qBn: '৫. জিহ্বার ওপর সাদা প্রলেপ (Ama/Toxin coating) বা মুখে দুর্গন্ধ থাকে কি?',
        qEn: '5. Do you notice a white coating on your tongue in the morning or bad breath?'
      },
      {
        qBn: '৬. হজমের সমস্যার পাশাপাশি ত্বকে অ্যালার্জি, একজিমা বা মাথা ঝিমঝিম (Brain Fog) করে কি?',
        qEn: '6. Do you experience skin rashes, food sensitivities, or brain fog alongside digestive issues?'
      }
    ],
    rootCauseBn: 'আয়ুর্বেদ ও ফাংশনাল মেডিসিন অনুযায়ী "মন্দাগ্নি" (কম স্টমাক অ্যাসিড ও ডাইজেস্টিভ এনজাইম) এবং অন্ত্রের দেয়ালে প্রদাহ (Leaky Gut) হলে খাবার পচে গ্যাস, টক্সিন (Ama) এবং অটোইমিউন সংবেদনশীলতা তৈরি করে।',
    rootCauseEn: 'Low stomach acid (Hypochlorhydria), sluggish bile flow, and compromised intestinal tight junctions (Leaky Gut) lead to fermentation, gas, and systemic endotoxemia.',
    eatFoodsBn: ['লাউ, পেঁপে, ঝিঙে, পটল ও সহজপাচ্য রান্না করা সবজি', 'আদা, জিরা, মৌরি ও জোয়ান ফোটানো পানি (CCF Tea)', 'হাড়ের স্যুপ (Bone Broth) ও দেশি ঘি (Butyrate উৎস)'],
    eatFoodsEn: ['Cooked bottle gourd, green papaya, ridge gourd & soft steamed greens', 'Ginger, Cumin, Coriander & Fennel (CCF) digestive tea', 'Bone broth & pure A2 Ghee (rich in gut-healing butyrate)'],
    avoidFoodsBn: ['গমের আটা/ময়দা (Gluten) ও পাস্তুরিত দুধ', 'কাঁচা সালাদ (রাতে) ও অতিরিক্ত ডাল/ছোলা', 'অতিরিক্ত চা-কফি, কোল্ড ড্রিংকস ও অ্যান্টিবায়োটিকের অপব্যবহার'],
    avoidFoodsEn: ['Refined wheat/gluten & pasteurized dairy during flare-ups', 'Raw cold salads at night & heavy unsoaked legumes', 'Carbonated drinks, excess caffeine & ultra-processed foods'],
    protocolBn: [
      'খাবারের ১৫ মিনিট আগে ১ চামচ অ্যাপেল সাইডার ভিনেগার বা আদা-লেবুর রস কুসুম গরম পানিতে খান।',
      'খাবার খাওয়ার সময় পানি পান করবেন না; খাবারের ৩০ মিনিট পর কুসুম গরম পানি পান করুন।',
      'রাতে ঘুমানোর আগে ত্রিফলা চূর্ণ বা ম্যাগনেসিয়াম সাইট্রেট (কোষ্ঠকাঠিন্য থাকলে) গ্রহণ করুন।'
    ],
    protocolEn: [
      'Take warm water with ginger & lemon or 1 tsp Apple Cider Vinegar 15 mins before main meals.',
      'Chew each bite 25–30 times and avoid drinking cold water during meals.',
      'Use CCF (Cumin-Coriander-Fennel) tea after meals to restore digestive Agni.'
    ]
  },
  {
    id: 'microbiome',
    icon: '🦠',
    categoryBn: 'গাট ফ্লোরা ও ইমিউনিটি',
    categoryEn: 'Gut Flora & Dysbiosis',
    titleBn: 'মাইক্রোবায়োম ও ডিসবায়োসিস অ্যাসেসমেন্ট',
    titleEn: 'Microbiome Diversity & Dysbiosis Screener',
    descBn: 'অন্ত্রের উপকারী ব্যাকটেরিয়ার ভারসাম্যহীনতা, ক্যানডিডা/ফাঙ্গাল ওভারগ্রোথ ও ইমিউনিটি মূল্যায়ন।',
    descEn: 'Evaluate beneficial gut flora diversity, antibiotic aftermath, candida overgrowth, and gut-brain axis.',
    accent: 'border-teal-500/30 hover:border-teal-500',
    questions: [
      {
        qBn: '১. গত ১-২ বছরে আপনি কি একাধিকবার অ্যান্টিবায়োটিক বা গ্যাসের ওষুধ (PPI/Omeprazole) খেয়েছেন?',
        qEn: '1. Have you taken multiple courses of antibiotics or acid-blockers (PPIs) in the past 1–2 years?'
      },
      {
        qBn: '২. আপনার কি মিষ্টি, চকলেট, ভাত বা বেকারির খাবারের প্রতি তীব্র আসক্তি (Sugar/Yeast Craving) আছে?',
        qEn: '2. Do you experience intense, uncontrollable cravings for sugar, bread, or starchy carbs?'
      },
      {
        qBn: '৩. আপনার ডায়েটে কি ফার্মেন্টেড খাবার (টক দই, পান্তা, আচার) এবং শাকসবজির ফাইবার খুব কম থাকে?',
        qEn: '3. Does your daily diet lack diverse plant fibers and natural probiotic fermented foods?'
      },
      {
        qBn: '৪. আপনার কি ঘন ঘন সর্দি-কাশি, ফাঙ্গাল ইনফেকশন, খুশকি বা ত্বকে চুলকানি হয়?',
        qEn: '4. Do you suffer from recurrent fungal infections, dandruff, sinus congestion, or low immunity?'
      },
      {
        qBn: '৫. মানসিক চাপ বা দুশ্চিন্তা বাড়লে কি আপনার পেটের সমস্যা বা বাওয়েল মুভমেন্ট সাথে সাথে খারাপ হয়ে যায়?',
        qEn: '5. Does emotional stress or anxiety immediately trigger stomach upset or bowel urgency?'
      },
      {
        qBn: '৬. খাবার খাওয়ার পর পেটে অতিরিক্ত গ্যাস তৈরি হওয়া বা দুর্গন্ধযুক্ত বায়ু নির্গমনের সমস্যা আছে কি?',
        qEn: '6. Do you experience excessive intestinal fermentation, foul-smelling gas, or SIBO-like fullness?'
      }
    ],
    rootCauseBn: 'অতিরিক্ত অ্যান্টিবায়োটিক, গ্যাসের ওষুধ (PPI), চিনি এবং ফাইবারহীন খাবারের কারণে অন্ত্রের ভালো ব্যাকটেরিয়া (Lactobacillus & Bifidobacteria) কমে গিয়ে ক্ষতিকর ব্যাকটেরিয়া ও ইস্ট (Candida) বৃদ্ধি পায়, যাকে Dysbiosis বলে।',
    rootCauseEn: 'Depletion of keystone probiotic strains and short-chain fatty acid (SCFA) producers allows opportunistic pathogens and yeast to overgrow, impairing immunity and serotonin production.',
    eatFoodsBn: ['ঘরে পাতা প্রোবায়োটিক টক দই ও ঘোল (Buttermilk)', 'প্রিবায়োটিক খাবার: রসুন, পেঁয়াজ, কাঁচা কলা ও ওটস', 'সপ্তাহে অন্তত ২০-২৫ পদের রঙিন দেশি শাকসবজি ও মসলা'],
    eatFoodsEn: ['Homemade probiotic sour curd & spiced buttermilk (Takra)', 'Prebiotic fibers: garlic, onion, green banana (resistant starch)', '20+ diverse colorful seasonal vegetables, herbs & polyphenols weekly'],
    avoidFoodsBn: ['কৃত্রিম সুইটেনার, কোমল পানীয় ও প্যাকেটজাত জুস', 'চিকিৎসকের পরামর্শ ছাড়া অ্যান্টিবায়োটিক ও গ্যাসের ওষুধ', 'অতিরিক্ত চিনি ও আল্ট্রা-প্রসেসড ফাস্টফুড'],
    avoidFoodsEn: ['Artificial sweeteners, sodas & packaged juices', 'Unnecessary antibiotics & chronic proton-pump inhibitors', 'Refined sugars that feed pathogenic yeast and Candida'],
    protocolBn: [
      'প্রতিদিন দুপুরে খাবারের সাথে বা শেষে ১ বাটি ঘরে পাতা টক দই বা ঘোল (জিরা-বিটলবণ সহ) খান।',
      'রেজিস্ট্যান্ট স্টার্চ (যেমন কাঁচা কলার তরকারি বা ঠান্ডা করা লাল চালের ভাত) পরিমিত পরিমাণে যুক্ত করুন।',
      'প্রয়োজনে মাল্টি-স্ট্রেইন প্রোবায়োটিক এবং এল-গ্লুটামিন (L-Glutamine) কোর্স সম্পন্ন করুন।'
    ],
    protocolEn: [
      'Include 1 bowl of homemade probiotic curd or spiced buttermilk with lunch daily.',
      'Feed beneficial microbes with cooked-and-cooled resistant starches (green banana, red rice).',
      'Restore gut barrier integrity with spore-based probiotics and polyphenol-rich herbs.'
    ]
  },
  {
    id: 'metabolic',
    icon: '🔥',
    categoryBn: 'কার্ডিও-মেটাবলিক ও ইনসুলিন',
    categoryEn: 'Cardio-Metabolic & Insulin Sensitivity',
    titleBn: 'মেটাবলিক হেলথ ও ইনসুলিন অ্যাসেসমেন্ট',
    titleEn: 'Metabolic Syndrome & Insulin Resistance',
    descBn: 'প্রি-ডায়াবেটিস, পেটের মেদ, উচ্চ রক্তচাপ, কোলেস্টেরল ও মেটাবলিক ফ্লেক্সিবিলিটি মূল্যায়ন।',
    descEn: 'Screen for hyperinsulinemia, abdominal adiposity, lipid imbalance, and metabolic inflexibility.',
    accent: 'border-amber-500/30 hover:border-amber-500',
    questions: [
      {
        qBn: '১. আপনার কোমরের মাপ কি পুরুষদের ক্ষেত্রে ৩৫ ইঞ্চি এবং নারীদের ক্ষেত্রে ৩১.৫ ইঞ্চির বেশি?',
        qEn: '1. Is your waist circumference over 35 inches (Men) or 31.5 inches (Women)?'
      },
      {
        qBn: '২. ২-৩ ঘণ্টা না খেয়ে থাকলে কি মাথা ঘোরা, হাত-পা কাঁপা, খিটখিটে মেজাজ বা তীব্র ক্ষুধা লাগে?',
        qEn: '2. Do you get shaky, irritable ("hangry"), or lightheaded if a meal is delayed by 2–3 hours?'
      },
      {
        qBn: '৩. ভাত বা ভারী খাবার খাওয়ার পর কি প্রচণ্ড ঘুম পায় এবং কাজ করার এনার্জি কমে যায়?',
        qEn: '3. Do you experience heavy drowsiness or a sharp energy crash right after eating carbohydrate meals?'
      },
      {
        qBn: '৪. আপনার রক্তে কি ট্রাইগ্লিসারাইড বেশি (>১৫০), এইচডিএল কম বা প্রি-ডায়াবেটিস/ডায়াবেটিস ধরা পড়েছে?',
        qEn: '4. Do you have elevated Triglycerides (>150 mg/dL), low HDL, borderline HbA1c, or high blood pressure?'
      },
      {
        qBn: '৫. রাতে বারবার প্রস্রাবের বেগ হওয়া বা গলা শুকিয়ে তৃষ্ণা লাগার প্রবণতা আছে কি?',
        qEn: '5. Do you wake up at night to urinate frequently or feel unquenchable thirst?'
      },
      {
        qBn: '৬. আপনার পরিবারে কি ডায়াবেটিস, উচ্চ রক্তচাপ বা হৃদরোগের ইতিহাস রয়েছে এবং আপনার শারীরিক হাঁটাচলা কম?',
        qEn: '6. Do you have a family history of diabetes/heart disease combined with a sedentary desk lifestyle?'
      }
    ],
    rootCauseBn: 'বারবার অতিরিক্ত শর্করা (ভাত, চিনি, রুটি) এবং সয়াবিন তেল খাওয়ার ফলে কোষে ইনসুলিন রিসেপ্টরগুলো অকেজো হয়ে পড়ে (Insulin Resistance)। ফলে শরীর ফ্যাট পোড়াতে পারে না এবং রক্তে গ্লুকোজ ও ট্রাইগ্লিসারাইড জমতে থাকে।',
    rootCauseEn: 'Chronic hyperinsulinemia from frequent high-glycemic meals and seed oils locks fat stores, blocks mitochondrial fat oxidation, and drives visceral fat accumulation.',
    eatFoodsBn: ['লো-গ্লাইসেমিক সবজি, শাক, শসা, টমেটো ও করলা', 'পর্যাপ্ত প্রোটিন (১ গ্রাম/কেজি): মাছ, ডিম, মুরগি, ডাল ও বাদাম', 'অলিভ অয়েল, সরিষার তেল, ঘি ও ওমেগা-৩ সমৃদ্ধ মাছ'],
    eatFoodsEn: ['Low-glycemic non-starchy greens, bitter gourd, cucumber & crucifers', 'Adequate protein (1g/kg): local fish, eggs, poultry, nuts & seeds', 'Extra virgin olive oil, cold-pressed mustard oil & omega-3 fats'],
    avoidFoodsBn: ['সাদা ভাত (অতিরিক্ত), সাদা আটার রুটি, আলু ও চিনি', 'দিনে ৪-৫ বার স্ন্যাকিং বা বারবার চা-বিস্কুট খাওয়া', 'প্যাকেটজাত ফলের রস, কোমল পানীয় ও ট্রান্স ফ্যাট'],
    avoidFoodsEn: ['Large portions of polished white rice, refined flour & sugary drinks', 'Frequent grazing/snacking between meals (keeps insulin elevated)', 'Industrial seed oils (soybean/canola) and trans fats'],
    protocolBn: [
      'খাবারের সিকোয়েন্স মেনে চলুন: প্রথমে সালাদ/সবজি -> এরপর প্রোটিন ও ফ্যাট -> সবশেষে অল্প কার্বোহাইড্রেট।',
      'প্রতিটি প্রধান খাবারের পর ১০-১৫ মিনিট হাঁটার অভ্যাস করুন (Post-meal walk ব্লাড সুগার ৩০% কমায়)।',
      'ফেজ অনুযায়ী ১৪:১০ বা ১৬:৮ ইন্টারমিটেন্ট ফাস্টিং ও ৪০:৩০:৩০ ম্যাক্রো রেশিও মেনে চলুন।'
    ],
    protocolEn: [
      'Follow Meal Sequencing: Eat fiber/vegetables first, protein/fats second, and complex carbs last.',
      'Walk briskly for 10–15 minutes immediately after lunch and dinner to clear blood glucose.',
      'Implement 16:8 Intermittent Fasting with our strict 40% Carb : 30% Protein : 30% Fat ratio.'
    ]
  },
  {
    id: 'liver',
    icon: '🛡️',
    categoryBn: 'হেপাটিক ও মেটাবলিক ডিটক্স',
    categoryEn: 'Hepatic Detox & Fatty Liver',
    titleBn: 'ফ্যাটি লিভার ও ডিটক্স অ্যাসেসমেন্ট',
    titleEn: 'Fatty Liver (NAFLD) & Hepatic Detox',
    descBn: 'ফ্যাটি লিভার (Grade 1/2), পিত্তথলির কার্যকারিতা, কোলেস্টেরল ও শরীরের টক্সিন ক্লিয়ারেন্স মূল্যায়ন।',
    descEn: 'Assess Non-Alcoholic Fatty Liver risk, sluggish bile flow, phase 1 & 2 liver detox pathways.',
    accent: 'border-orange-500/30 hover:border-orange-500',
    questions: [
      {
        qBn: '১. আল্ট্রাসনোগ্রামে কি আপনার ফ্যাটি লিভার (Grade 1/2) বা রক্তে SGPT/ALT বেশি ধরা পড়েছে?',
        qEn: '1. Have you been diagnosed with Fatty Liver on ultrasound or elevated SGPT/ALT liver enzymes?'
      },
      {
        qBn: '২. পেটের ডান দিকে পাঁজরের নিচে ভারী ভাব বা চর্বিযুক্ত খাবার খেলে বমি ভাব/অস্বস্তি হয় কি?',
        qEn: '2. Do you feel fullness under your right ribcage or nausea after eating oily/fatty meals?'
      },
      {
        qBn: '৩. আপনার কি মাঝরাতে (রাত ১টা থেকে ৩টার মধ্যে) হঠাৎ ঘুম ভেঙে যায় বা অতিরিক্ত গরম লাগে?',
        qEn: '3. Do you frequently wake up between 1:00 AM and 3:00 AM (traditional liver detox window)?'
      },
      {
        qBn: '৪. ত্বকে মেছতা, কালচে ছোপ, চুলকানি বা চোখের নিচে ডার্ক সার্কেল ও হলদে ভাব আছে কি?',
        qEn: '4. Do you notice skin hyperpigmentation, dark circles, itchy skin, or sluggish morning energy?'
      },
      {
        qBn: '৫. আপনার কি কোলেস্টেরল/ট্রাইগ্লিসারাইড বেশি এবং পেটের সামনের অংশে শক্ত চর্বি (Pot Belly) আছে?',
        qEn: '5. Do you have high triglycerides, elevated LDL, or central abdominal hardness?'
      },
      {
        qBn: '৬. আপনি কি নিয়মিত পেইনকিলার, ওষুধ, ফাস্টফুড, কোল্ড ড্রিংকস বা অতিরিক্ত ফ্রুক্টোজ/মিষ্টি খান?',
        qEn: '6. Do you regularly consume sugary beverages, bakery items, fried foods, or frequent medications?'
      }
    ],
    rootCauseBn: 'ফ্যাটি লিভার চর্বি খাওয়ার চেয়ে অতিরিক্ত ফ্রুক্টোজ (চিনি, কোল্ড ড্রিংকস), রিফাইন্ড কার্বোহাইড্রেট এবং সয়াবিন তেলের কারণে বেশি হয় (De Novo Lipogenesis)। এছাড়া কোলিন ও অ্যান্টিঅক্সিডেন্টের অভাবে লিভার থেকে ফ্যাট বের হতে পারে না।',
    rootCauseEn: 'Hepatic steatosis is driven primarily by excess dietary fructose, refined carbohydrates, and oxidized seed oils via De Novo Lipogenesis, alongside choline deficiency.',
    eatFoodsBn: ['ব্রকলি, বাঁধাকপি, ফুলকপি, মুলা ও করলা (সালফোরাফেন সমৃদ্ধ)', 'হলুদ (Curcumin), কালোজিরা, আমলকী ও লেবু পানি', 'ডিমের কুসুম ও মাছ (কোলিন লিভার থেকে ফ্যাট গলাতে সাহায্য করে)'],
    eatFoodsEn: ['Cruciferous vegetables (broccoli, cabbage, radish) & bitter greens', 'Raw turmeric, black seed (Kalojira), Amla & warm lemon water', 'Egg yolks & fish (rich in Choline to export trapped liver fat)'],
    avoidFoodsBn: ['কোল্ড ড্রিংকস, প্যাকেটজাত জুস ও হাই-ফ্রুক্টোজ মিষ্টি', 'সয়াবিন তেল, রাইস ব্র্যান তেল ও পোড়া তেলের ভাজাপোড়া', 'অতিরিক্ত সাদা ভাত, ময়দা ও প্রসেসড মাংস'],
    avoidFoodsEn: ['High-fructose corn syrup, sodas, packaged fruit juices & sweets', 'Refined soybean/corn oil & reheated deep-fried street foods', 'Excess polished white rice, refined flour & alcohol/toxins'],
    protocolBn: [
      'সকালে খালি পেটে ১ গ্লাস কুসুম গরম পানিতে অর্ধেক লেবুর রস ও ১ চিমটি কাঁচা হলুদ মিশিয়ে পান করুন।',
      'রাত ৮টার মধ্যে রাতের খাবার শেষ করুন যাতে রাত ১টা-৩টায় লিভার নিরবচ্ছিন্নভাবে ডিটক্স করতে পারে।',
      'মিল্ক থিসল (Milk Thistle / Silymarin), ওমেগা-৩ এবং ভিটামিন ই সমৃদ্ধ খাবার গ্রহণ করুন।'
    ],
    protocolEn: [
      'Drink warm lemon and raw turmeric water first thing every morning to stimulate bile flow.',
      'Finish dinner before 8:00 PM so the liver can execute deep hepatic autophagy between 1–3 AM.',
      'Prioritize Choline, Omega-3 fatty acids, and cruciferous sulfur compounds daily.'
    ]
  },
  {
    id: 'thyroid',
    icon: '🦋',
    categoryBn: 'থাইরয়েড ও অ্যাড্রেনাল অ্যাক্সিস',
    categoryEn: 'Thyroid & HPA-Axis Adrenal',
    titleBn: 'থাইরয়েড ও অ্যাড্রেনাল ফ্যাটিগ অ্যাসেসমেন্ট',
    titleEn: 'Thyroid & Adrenal Fatigue Assessment',
    descBn: 'হাইপোথাইরয়েডিজম, অতিরিক্ত চুল পড়া, হাত-পা ঠান্ডা থাকা, কর্টিসল স্ট্রেস ও ক্রনিক ক্লান্তি মূল্যায়ন।',
    descEn: 'Evaluate cellular thyroid hormone conversion (T4 to T3), Hashimoto triggers, and cortisol burnout.',
    accent: 'border-purple-500/30 hover:border-purple-500',
    questions: [
      {
        qBn: '১. পর্যাপ্ত ঘুমানোর পরও কি সকালে ঘুম থেকে উঠতে কষ্ট হয় এবং সারাদিন শরীর অবসন্ন লাগে?',
        qEn: '1. Do you wake up exhausted even after 7–8 hours of sleep and feel drained all day?'
      },
      {
        qBn: '২. আপনার কি অতিরিক্ত চুল পড়া, ত্বক শুষ্ক হয়ে যাওয়া বা ভ্রুর বাইরের অংশ পাতলা হয়ে যাওয়ার সমস্যা আছে?',
        qEn: '2. Do you experience heavy hair fall, dry skin, brittle nails, or thinning of outer eyebrows?'
      },
      {
        qBn: '৩. অন্যদের তুলনায় আপনার কি শীত বেশি লাগে বা হাত-পায়ের পাতা প্রায়ই ঠান্ডা হয়ে থাকে?',
        qEn: '3. Do you feel unusually cold or have cold hands and feet compared to others around you?'
      },
      {
        qBn: '৪. খুব কম খাবার খেয়েও কি আপনার ওজন বেড়ে যাচ্ছে এবং মুখে বা পায়ে পানি জমা (Puffiness) দেখা দেয়?',
        qEn: '4. Do you gain weight easily despite eating little, or notice morning facial/ankle puffiness?'
      },
      {
        qBn: '৫. আপনার কি দীর্ঘমেয়াদী মানসিক চাপ, বুক ধড়ফড়ানি, হতাশা বা মনোযোগ ধরে রাখতে সমস্যা (Brain Fog) হয়?',
        qEn: '5. Do you suffer from chronic stress, anxiety, brain fog, or afternoon dizzy spells?'
      },
      {
        qBn: '৬. রাতে ঘুমানোর সময় কি হঠাৎ মাথায় অনেক চিন্তা ঘোরে ("Tired but Wired") এবং ঘুম গভীর হয় না?',
        qEn: '6. Do you feel exhausted in the evening yet "tired but wired" when trying to fall asleep at night?'
      }
    ],
    rootCauseBn: 'দীর্ঘমেয়াদী মানসিক চাপ (উচ্চ কর্টিসল), সেলেনিয়াম-জিংক-আয়োডিনের ঘাটতি এবং গ্লুটেন/লিকি গাটের কারণে নিষ্ক্রিয় T4 হরমোন সক্রিয় T3 হরমোনে রূপান্তরিত হতে পারে না, ফলে মেটাবলিজম ধীর হয়ে যায়।',
    rootCauseEn: 'Chronic cortisol stress, gut inflammation, and deficiencies in Selenium, Zinc, and Iron block the conversion of inactive T4 into metabolically active T3 thyroid hormone.',
    eatFoodsBn: ['সামুদ্রিক মাছ, দেশি ডিম, কুমড়ার বিচি (জিংক ও সেলেনিয়াম)', 'নারকেল তেল বা ঘি (এমসিটি ফ্যাট মেটাবলিজম বাড়ায়)', 'ধনিয়া বীজ ভেজানো পানি ও রান্না করা শাকসবজি'],
    eatFoodsEn: ['Wild fish, eggs, pumpkin seeds & Brazil nuts (Selenium & Zinc)', 'Virgin coconut oil & A2 Ghee (MCTs support basal body temperature)', 'Coriander seed infused water & thoroughly cooked nutrient-dense greens'],
    avoidFoodsBn: ['কাঁচা বাঁধাকপি, ফুলকপি ও ব্রকলি (রান্না ছাড়া গয়ট্রোজেন থাকে)', 'গমের রুটি/ময়দা (Gluten থাইরয়েড অ্যান্টিবডি বাড়ায়)', 'সয়াবিন তেল, সয়া নাগেট ও অতিরিক্ত ক্যাফেইন'],
    avoidFoodsEn: ['Raw goitrogenic crucifers (always steam or cook cabbage/cauliflower)', 'Gluten/wheat products (molecular mimicry triggers thyroid antibodies)', 'Unfermented soy products, soybean oil & excess coffee on an empty stomach'],
    protocolBn: [
      'সকালে খালি পেটে ১ গ্লাস ধনিয়া বীজ (Coriander seeds) সারারাত ভেজানো পানি ফুটিয়ে পান করুন।',
      'সকালে ঘুম থেকে উঠে সরাসরি কফি/চা না খেয়ে আগে প্রোটিন সমৃদ্ধ নাস্তা ও রোদ (Vitamin D) নিন।',
      'সেলেনিয়াম, জিংক, ভিটামিন ডি৩ এবং অশ্বগন্ধা (অ্যাড্রেনাল ব্যালেন্সের জন্য) যুক্ত করুন।'
    ],
    protocolEn: [
      'Drink warm coriander-seed infused water on an empty stomach every morning.',
      'Get 15 minutes of morning sunlight and eat protein within 60 minutes of waking (no coffee on empty stomach).',
      'Support T4-to-T3 conversion with Selenium, Zinc, Vitamin D3, and stress-modulating Ashwagandha.'
    ]
  },
  {
    id: 'inflammation',
    icon: '🛡️',
    categoryBn: 'সেলুলার ও ইমিউন ব্যালেন্স',
    categoryEn: 'Systemic Inflammation & Alkaline Balance',
    titleBn: 'ক্রনিক ইনফ্ল্যামেশন ও অ্যালকালাইন অ্যাসেসমেন্ট',
    titleEn: 'Chronic Inflammation & Acid-Alkaline Screener',
    descBn: 'জয়েন্টে ব্যথা, ইউরিক অ্যাসিড, অ্যালার্জি, অটোইমিউন প্রবণতা ও শরীরে সুপ্ত প্রদাহের মূল্যায়ন।',
    descEn: 'Evaluate joint stiffness, uric acid, oxidative stress, cellular acidity, and inflammatory load.',
    accent: 'border-rose-500/30 hover:border-rose-500',
    questions: [
      {
        qBn: '১. সকালে ঘুম থেকে ওঠার পর শরীরের গিঁটে ব্যথা, পেশী শক্ত হয়ে থাকা বা কোমর/হাঁটু ব্যথা করে কি?',
        qEn: '1. Do you wake up with morning joint stiffness, muscle aches, back pain, or plantar heel pain?'
      },
      {
        qBn: '২. আপনার কি রক্তে ইউরিক অ্যাসিড, ESR বা hs-CRP বেশি অথবা বাতের সমস্যা আছে?',
        qEn: '2. Do you have elevated Uric Acid, hs-CRP, ESR, or recurrent inflammatory flare-ups?'
      },
      {
        qBn: '৩. আপনার কি ঘন ঘন সাইনাস, অ্যালার্জি, হাঁচি, অ্যাজমা বা ত্বকে র‍্যাশ/সোরিয়াসিস দেখা দেয়?',
        qEn: '3. Do you suffer from chronic sinusitis, dust allergies, asthma, eczema, or skin flare-ups?'
      },
      {
        qBn: '৪. আপনার খাদ্যতালিকায় কি ভাজাপোড়া, সয়াবিন তেল, চিনি ও লাল মাংস বেশি এবং সবুজ শাকসবজি কম?',
        qEn: '4. Is your diet high in fried foods, seed oils, and sugar while low in fresh leafy greens?'
      },
      {
        qBn: '৫. সামান্য পরিশ্রমেই কি শরীর প্রচণ্ড ক্লান্ত হয়ে পড়ে এবং রিকভারি হতে অনেক সময় লাগে?',
        qEn: '5. Do you experience delayed recovery after physical activity or persistent cellular fatigue?'
      },
      {
        qBn: '৬. আপনার কি মাড়ি থেকে রক্ত পড়া, ঘন ঘন মাথাব্যথা বা মাইগ্রেনের সমস্যা আছে?',
        qEn: '6. Do you experience frequent headaches, migraines, puffiness, or bleeding gums?'
      }
    ],
    rootCauseBn: 'ওমেগা-৬ সমৃদ্ধ সয়াবিন/সানফ্লাওয়ার তেল, চিনি, আল্ট্রা-প্রসেসড খাবার এবং মানসিক চাপের ফলে শরীরে সাইটোকাইন (Cytokines) ও অ্যাসিডিক লোড বেড়ে যায়, যা জয়েন্ট, রক্তনালী ও কোষে দীর্ঘমেয়াদী প্রদাহ সৃষ্টি করে।',
    rootCauseEn: 'Excess Omega-6 linoleic acid from seed oils, glycation from refined sugars, and poor lymphatic drainage drive systemic NF-kB inflammatory cascades.',
    eatFoodsBn: ['কাঁচা হলুদ ও গোলমরিচ, আদা, রসুন ও কালোজিরা', 'সামুদ্রিক ও ছোট মাছ, তিসি ও চিয়া সিড (ওমেগা-৩)', 'শসা, লাউ, পালং শাক, লেবু পানি ও বেরি/আমলকী (অ্যালকালাইন খাবার)'],
    eatFoodsEn: ['Turmeric with black pepper, ginger, garlic & black seed (Kalojira)', 'Omega-3 rich fish, flaxseeds, chia seeds & walnuts', 'Alkalizing greens: bottle gourd, cucumber, lemon water & Amla'],
    avoidFoodsBn: ['সয়াবিন তেল, মার্জারিন ও সব ধরনের বেকারি/ভাজাপোড়া', 'চিনি, কোমল পানীয় ও প্রসেসড সসেজ/মাংস', 'অতিরিক্ত পিউরিন ও ইউরিক অ্যাসিড বাড়ায় এমন ফ্রুক্টোজ পানীয়'],
    avoidFoodsEn: ['Soybean, corn & sunflower oils (high inflammatory Omega-6)', 'Refined sugar, bakery trans-fats & processed meats', 'Sugary fructose drinks that spike uric acid and joint inflammation'],
    protocolBn: [
      'রান্নায় সয়াবিন তেল সম্পূর্ণ বর্জন করে কোল্ড-প্রেসড সরিষার তেল, অলিভ অয়েল ও দেশি ঘি ব্যবহার করুন।',
      'প্রতিদিন রাতে বা সকালে গোল্ডেন মিল্ক/হলুদ-আদা-গোলমরিচ চা পান করুন।',
      'ওমেগা-৩ ফিশ অয়েল (EPA/DHA) এবং কারকিউমিন (Curcumin) সাপ্লিমেন্ট প্রোটোকলে রাখুন।'
    ],
    protocolEn: [
      'Eliminate industrial seed oils completely; cook exclusively with mustard oil, olive oil, or A2 ghee.',
      'Drink anti-inflammatory Turmeric-Ginger-Black Pepper infusion daily.',
      'Rebalance your Omega-6 to Omega-3 ratio with high-potency Omega-3 EPA/DHA and Curcumin.'
    ]
  },
  {
    id: 'micronutrient',
    icon: '💊',
    categoryBn: 'ভিটামিন ও মিনারেল স্ক্রিনিং',
    categoryEn: 'Vitamin & Mineral Deficiency Screener',
    titleBn: 'মাইক্রোনিউট্রিয়েন্ট ও ভিটামিন ঘাটতি অ্যাসেসমেন্ট',
    titleEn: 'Micronutrient Deficiency Assessment',
    descBn: 'ভিটামিন ডি, বি১২, আয়রন, ম্যাগনেসিয়াম, জিংক ও ক্যালসিয়ামের ঘাটতির ক্লিনিক্যাল লক্ষণ মূল্যায়ন।',
    descEn: 'Identify clinical signs of Vitamin D3, B12, Iron/Ferritin, Magnesium, and Zinc deficiencies.',
    accent: 'border-indigo-500/30 hover:border-indigo-500',
    questions: [
      {
        qBn: '১. আপনার কি কোমর, হাঁটু বা হাড়ে ব্যথা করে এবং আপনি প্রতিদিন ১৫-২০ মিনিট কড়া রোদে থাকেন না (Vitamin D)?',
        qEn: '1. Do you have bone/back aches and get less than 20 minutes of direct midday sunlight daily (Vit D)?'
      },
      {
        qBn: '২. পায়ের পেশীতে টান ধরা (Muscle Cramps), চোখের পাতা লাফানো বা ঘুমের সমস্যা হয় কি (Magnesium)?',
        qEn: '2. Do you experience night leg cramps, eyelid twitching, tension headaches, or poor sleep (Magnesium)?'
      },
      {
        qBn: '৩. হাত-পা ঝিনঝিন করা, অবশ ভাব, স্মৃতিশক্তি কমে যাওয়া বা মুখের ভেতর ঘা হয় কি (Vitamin B12)?',
        qEn: '3. Do you feel tingling/numbness in hands or feet, memory fog, or recurrent mouth ulcers (Vit B12)?'
      },
      {
        qBn: '৪. সিঁড়ি দিয়ে উঠলে হাঁপিয়ে যাওয়া, ফ্যাকাসে ত্বক/চোখ, মাথা ঘোরা বা অতিরিক্ত চুল পড়া আছে কি (Iron/Ferritin)?',
        qEn: '4. Do you get breathless easily, feel dizzy on standing, have pale skin, or heavy hair fall (Iron)?'
      },
      {
        qBn: '৫. নখে সাদা দাগ, ক্ষত শুকাতে দেরি হওয়া, ঘন ঘন সর্দি-কাশি বা খাবারের স্বাদ-গন্ধ কম পান কি (Zinc)?',
        qEn: '5. Do you notice white spots on nails, slow wound healing, or frequent colds/infections (Zinc)?'
      },
      {
        qBn: '৬. খাবারের সাথে সাথেই চা বা কফি পানের অভ্যাস আছে কি (যা আয়রন ও ক্যালসিয়াম শোষণ ৭০% কমিয়ে দেয়)?',
        qEn: '6. Do you drink tea or coffee within 45 minutes of meals (which blocks iron and mineral absorption)?'
      }
    ],
    rootCauseBn: 'আধুনিক মাটিতে খনিজের স্বল্পতা, রোদে না যাওয়া, রিফাইন্ড খাবার, অন্ত্রের দুর্বল শোষণ ক্ষমতা (Low Stomach Acid) এবং খাবারের পরপরই চা/কফি পানের কারণে শরীরে গুরুতর মাইক্রোনিউট্রিয়েন্ট ঘাটতি তৈরি হয়।',
    rootCauseEn: 'Soil depletion, indoor lifestyles, low stomach acid, phytate-heavy unsoaked grains, and post-meal tannins (tea/coffee) create subclinical cellular nutrient starvation.',
    eatFoodsBn: ['কলিজা, দেশি ডিম, ছোট মাছ (কাঁটাসহ মলা-ঢেলা) ও সামুদ্রিক মাছ', 'কুমড়ার বিচি, সূর্যমুখীর বিচি, কাঠবাদাম ও কালো কিশমিশ', 'পালং শাক, কচু শাক, সজনে পাতা (Moringa) ও ভিটামিন সি যুক্ত লেবু/আমলকী'],
    eatFoodsEn: ['Organ meats (liver), whole eggs, small indigenous fish with bones', 'Pumpkin seeds, sunflower seeds, soaked almonds & black raisins', 'Moringa leaves, spinach, taro leaves paired with Vitamin C (lemon/amla)'],
    avoidFoodsBn: ['খাবারের ১ ঘণ্টা আগে ও পরে চা বা কফি পান করা', 'না ভিজিয়ে শস্য, ডাল বা বাদাম খাওয়া (Phytic acid মিনারেল আটকে দেয়)', 'অতিরিক্ত চিনি ও গ্যাসের ওষুধ (যা B12 ও ম্যাগনেসিয়াম শোষণ বন্ধ করে)'],
    avoidFoodsEn: ['Tea or coffee within 60 minutes before/after main meals', 'Unsoaked nuts, seeds, and legumes (high phytic acid binds minerals)', 'Chronic antacids/PPIs which block Vitamin B12, Iron, and Magnesium uptake'],
    protocolBn: [
      'আয়রন সমৃদ্ধ খাবারের সাথে অবশ্যই লেবুর রস বা ভিটামিন সি রাখুন (শোষণ ৩ গুণ বাড়ায়)।',
      'প্রতিদিন সকাল ১০টা থেকে দুপুর ১টার মধ্যে ১৫-২০ মিনিট শরীরে রোদ লাগান।',
      'রক্ত পরীক্ষার ভিত্তিতে ভিটামিন D3+K2, মিথাইলকোবালামিন (B12) ও ম্যাগনেসিয়াম গ্লাইসিনেট গ্রহণ করুন।'
    ],
    protocolEn: [
      'Always pair plant iron sources with fresh lemon juice or Amla to triple bioavailability.',
      'Soak nuts, seeds, and lentils for 6–8 hours before consumption to neutralize phytates.',
      'Supplement strategically with Vitamin D3+K2, Methylated B12, and Magnesium Glycinate.'
    ]
  }
];

const HealthCalculator: React.FC<Props> = ({ lang, darkMode }) => {
  const t = translations[lang];
  const isBn = lang === 'bn';

  // Navigation State
  const [screen, setScreen] = useState<ScreenLevel>('hub');
  const [selectedCalcId, setSelectedCalcId] = useState<CalculatorId>('bmi');
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<AssessmentId>('pcos');

  // Shared Calculator Form Inputs (with helpful clinical defaults so users can calculate right away or edit)
  const [weight, setWeight] = useState<string>('68');
  const [height, setHeight] = useState<string>('165');
  const [age, setAge] = useState<string>('32');
  const [gender, setGender] = useState<'Male' | 'Female'>('Female');
  const [activity, setActivity] = useState<number>(1.375);
  const [waist, setWaist] = useState<string>('86');
  const [hip, setHip] = useState<string>('98');
  const [neck, setNeck] = useState<string>('36');
  const [giValue, setGiValue] = useState<string>('65');
  const [netCarbs, setNetCarbs] = useState<string>('45');
  const [bedTime, setBedTime] = useState<string>('22:30');

  // Calculator Result State
  const [calcReport, setCalcReport] = useState<CalcReport | null>(null);

  // Assessment Answers State: array of 6 scores (0 to 3)
  const [answers, setAnswers] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [assessmentSubmitted, setAssessmentSubmitted] = useState<boolean>(false);

  const openCalculatorCard = (id: CalculatorId) => {
    setSelectedCalcId(id);
    setCalcReport(null);
    setScreen('calculator_detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openAssessmentCard = (id: AssessmentId) => {
    setSelectedAssessmentId(id);
    setAnswers([0, 0, 0, 0, 0, 0]);
    setAssessmentSubmitted(false);
    setScreen('assessment_detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const runCalculator = () => {
    const w = parseFloat(weight) || 65;
    const h = parseFloat(height) || 165;
    const a = parseFloat(age) || 30;
    const waistCm = parseFloat(waist) || 85;
    const hipCm = parseFloat(hip) || 98;
    const neckCm = parseFloat(neck) || 36;
    const gi = parseFloat(giValue) || 60;
    const carbsG = parseFloat(netCarbs) || 40;

    const hMeters = h / 100;
    const bmiVal = w / (hMeters * hMeters);
    const bmrVal = Math.round(10 * w + 6.25 * h - 5 * a + (gender === 'Male' ? 5 : -161));
    const tdeeVal = Math.round(bmrVal * activity);

    if (selectedCalcId === 'bmi') {
      let zone: 'green' | 'yellow' | 'red' = 'green';
      let label = isBn ? 'স্বাভাবিক ওজন (Optimal Asian BMI)' : 'Optimal Weight (Asian Standard)';
      let summary = isBn
        ? 'আপনার বিএমআই এশিয়ান ক্লিনিক্যাল মানদণ্ড অনুযায়ী আদর্শ সীমায় রয়েছে। মেটাবলিক সুস্থতা ধরে রাখতে সুষম ৪০:৩০:৩০ ডায়েট ও নিয়মিত হাঁটাচলা বজায় রাখুন।'
        : 'Your BMI is within the healthy Asian clinical range. Maintain metabolic flexibility with whole foods and daily movement.';

      if (bmiVal < 18.5) {
        zone = 'yellow';
        label = isBn ? 'কম ওজন (Underweight / পুষ্টিহীনতা ঝুঁকি)' : 'Underweight (Nutritional Deficit)';
        summary = isBn
          ? 'আপনার ওজন উচ্চতার তুলনায় কম। পেশী ও হাড়ের ঘনত্ব বাড়াতে প্রোটিন (১.২ গ্রাম/কেজি), স্বাস্থ্যকর ফ্যাট (ঘি, বাদাম, ডিম) এবং ডাইজেস্টিভ অগ্নি উন্নত করা প্রয়োজন।'
          : 'Your body mass is below optimal range. Focus on nutrient-dense proteins, healthy fats, and improving gut absorption.';
      } else if (bmiVal >= 23 && bmiVal < 25) {
        zone = 'yellow';
        label = isBn ? 'অতিরিক্ত ওজন ঝুঁকি (Asian Overweight: 23–24.9)' : 'Overweight (South Asian Cutoff 23–24.9)';
        summary = isBn
          ? 'দক্ষিণ এশিয়ানদের ক্ষেত্রে বিএমআই ২৩-এর ওপরে গেলেই ইনসুলিন রেজিস্ট্যান্স ও ফ্যাটি লিভারের ঝুঁকি শুরু হয়। রিফাইন্ড কার্বোহাইড্রেট কমিয়ে ১৪:১০ ফাস্টিং শুরু করুন।'
          : 'For South Asians, a BMI above 23 signals early visceral fat and insulin resistance risk. Begin 14:10 fasting and reduce refined carbs.';
      } else if (bmiVal >= 25) {
        zone = 'red';
        label = isBn ? 'স্থূলতা ও মেটাবলিক ঝুঁকি (Obesity / High Risk ≥25)' : 'Clinical Obesity (High Metabolic Risk ≥25)';
        summary = isBn
          ? 'আপনার বিএমআই উচ্চ মেটাবলিক ঝুঁকির নির্দেশ করছে। ইনসুলিন রেজিস্ট্যান্স, প্রদাহ ও পেটের চর্বি কমাতে থেরাপিউটিক ফেজ ডায়েট এবং ১৬:৮ ইন্টারমিটেন্ট ফাস্টিং অত্যন্ত জরুরি।'
          : 'Your BMI indicates significant metabolic load. Follow our structured Phase 1–3 caloric protocol with 40:30:30 macros to reverse insulin resistance.';
      }

      setCalcReport({
        primaryValue: bmiVal.toFixed(1),
        unit: 'kg/m²',
        statusLabel: label,
        statusZone: zone,
        referenceRange: isBn ? '১৮.৫ – ২২.৯ kg/m² (Asian Optimal)' : '18.5 – 22.9 kg/m² (Asian Optimal)',
        summary,
        metrics: [
          { label: isBn ? 'বর্তমান ওজন' : 'Current Weight', value: `${w} kg` },
          { label: isBn ? 'আদর্শ ওজন সীমা' : 'Healthy Weight Range', value: `${(18.5 * hMeters * hMeters).toFixed(1)} – ${(22.9 * hMeters * hMeters).toFixed(1)} kg` },
          { label: isBn ? 'ওজন পার্থক্য' : 'Weight Delta', value: bmiVal > 22.9 ? `-${(w - 22 * hMeters * hMeters).toFixed(1)} kg` : 'Optimal' }
        ],
        recommendations: isBn
          ? [
              'সাদা ভাত ও চিনির পরিবর্তে লাল চালের ভাত, শাকসবজি ও পর্যাপ্ত প্রোটিন (১ গ্রাম/কেজি) গ্রহণ করুন।',
              'প্রতিদিন খাবারের পর ১৫ মিনিট হাঁটুন যাতে রক্তে গ্লুকোজ স্পাইক না হয়।',
              'সয়াবিন তেল বাদ দিয়ে সরিষার তেল ও দেশি ঘি পরিমিত পরিমাণে ব্যবহার করুন।'
            ]
          : [
              'Prioritize 1g protein per kg body weight from fish, eggs, and lentils at every meal.',
              'Walk 15 minutes after meals to flatten post-prandial glucose curves.',
              'Replace refined seed oils with cold-pressed mustard oil, olive oil, or A2 ghee.'
            ]
      });
    } else if (selectedCalcId === 'ibw') {
      const heightInInches = h / 2.54;
      const base = gender === 'Male' ? 50 : 45.5;
      const ibw = heightInInches > 60 ? base + 2.3 * (heightInInches - 60) : base;
      const minW = (ibw * 0.9).toFixed(1);
      const maxW = (ibw * 1.1).toFixed(1);
      const diff = w - ibw;

      let zone: 'green' | 'yellow' | 'red' = 'green';
      let label = isBn ? 'আদর্শ ওজনের কাছাকাছি (Within Ideal Frame)' : 'Within Ideal Body Weight Frame';
      if (Math.abs(diff) > 10) {
        zone = 'red';
        label = diff > 0
          ? (isBn ? `আদর্শ ওজনের চেয়ে ${diff.toFixed(1)} কেজি বেশি` : `${diff.toFixed(1)} kg Above Ideal Weight`)
          : (isBn ? `আদর্শ ওজনের চেয়ে ${Math.abs(diff).toFixed(1)} কেজি কম` : `${Math.abs(diff).toFixed(1)} kg Below Ideal Weight`);
      } else if (Math.abs(diff) > 4) {
        zone = 'yellow';
        label = diff > 0
          ? (isBn ? `সামান্য বেশি (+${diff.toFixed(1)} কেজি)` : `Slightly Above (+${diff.toFixed(1)} kg)`)
          : (isBn ? `সামান্য কম (${diff.toFixed(1)} কেজি)` : `Slightly Below (${diff.toFixed(1)} kg)`);
      }

      setCalcReport({
        primaryValue: ibw.toFixed(1),
        unit: 'kg',
        statusLabel: label,
        statusZone: zone,
        referenceRange: `${minW} – ${maxW} kg`,
        summary: isBn
          ? `আপনার উচ্চতা (${h} সে.মি.) অনুযায়ী আদর্শ ওজন হলো ${ibw.toFixed(1)} কেজি। শরীরের হাড়ের গঠন (Small/Large Frame) ভেদে ${minW} থেকে ${maxW} কেজি পর্যন্ত নিরাপদ সীমা ধরা হয়।`
          : `Based on the clinical Devine formula for ${h} cm height, your target Ideal Body Weight is ${ibw.toFixed(1)} kg (healthy frame window: ${minW}–${maxW} kg).`,
        metrics: [
          { label: isBn ? 'টার্গেট আইডিয়াল ওজন' : 'Target Ideal Weight', value: `${ibw.toFixed(1)} kg` },
          { label: isBn ? 'নিরাপদ ফ্রেম রেঞ্জ' : 'Safe Frame Window', value: `${minW} – ${maxW} kg` },
          { label: isBn ? 'দৈনিক প্রোটিন লক্ষ্যমাত্রা' : 'Target Daily Protein', value: `${Math.round(ibw)} g/day` }
        ],
        recommendations: isBn
          ? [
              'ওজন কমানোর সময় পেশী (Muscle Mass) ধরে রাখতে প্রতিদিন অন্তত ১ গ্রাম/কেজি প্রোটিন নিশ্চিত করুন।',
              'সপ্তাহে ০.৫ থেকে ১ কেজির বেশি ওজন দ্রুত কমানোর চেষ্টা করবেন না (এতে মেটাবলিজম কমে যায়)।',
              'ওজনের পাশাপাশি কোমরের মাপ (Waist Circumference) কমানোর দিকে মনোযোগ দিন।'
            ]
          : [
              'Anchor your daily protein intake to your ideal body weight (~1g per kg) to preserve lean muscle.',
              'Aim for a sustainable 0.5–1.0 kg fat loss per week without starving basal metabolism.',
              'Track waist circumference alongside scale weight for true visceral fat progress.'
            ]
      });
    } else if (selectedCalcId === 'bmr') {
      const phase1 = bmrVal + 100;
      const phase2 = bmrVal;
      const phase3 = bmrVal - 100;
      const phase4 = Math.round(bmrVal * 1.2);

      setCalcReport({
        primaryValue: `${bmrVal}`,
        unit: 'kcal/day',
        statusLabel: isBn ? 'বেসাল মেটাবলিক রেট ও ৪-ফেজ ক্যালোরি চার্ট' : 'Basal Metabolic Rate & 4-Phase Targets',
        statusZone: 'green',
        referenceRange: `${phase3} – ${phase4} kcal/day`,
        summary: isBn
          ? `সারাদিন সম্পূর্ণ বিশ্রামে থাকলেও আপনার শরীরের অঙ্গপ্রত্যঙ্গ (মস্তিষ্ক, হার্ট, লিভার) সচল রাখতে প্রতিদিন ${bmrVal} ক্যালোরি প্রয়োজন। ফাংশনাল নিউট্রিশন প্রোটোকল অনুযায়ী আপনার ৪টি ফেজের ক্যালোরি নিচে দেওয়া হলো:`
          : `Your body burns ${bmrVal} kcal/day at complete rest to sustain vital organ functions. Below are your exact Functional Medicine Phase 1–4 calorie targets:`,
        metrics: [
          { label: isBn ? 'ফেজ ১ (BMR + 100 | 14:10 IF)' : 'Phase 1 (BMR+100 | 14:10 IF)', value: `${phase1} kcal` },
          { label: isBn ? 'ফেজ ২ (BMR | 16:8 IF)' : 'Phase 2 (BMR | 16:8 IF)', value: `${phase2} kcal` },
          { label: isBn ? 'ফেজ ৩ (BMR - 100 | Autophagy)' : 'Phase 3 (BMR-100 | Autophagy)', value: `${phase3} kcal` },
          { label: isBn ? 'ফেজ ৪ (Maintenance BMR×1.2)' : 'Phase 4 (Maintenance BMR×1.2)', value: `${phase4} kcal` }
        ],
        recommendations: isBn
          ? [
              'কখনোই BMR - 100 ক্যালোরির নিচে ক্র্যাশ ডায়েট করবেন না; এতে থাইরয়েড ও বিএমআর স্থায়ীভাবে ধীর হয়ে যায়।',
              'প্রতিটি ফেজেই ৪০% কার্বোহাইড্রেট, ৩০% প্রোটিন এবং ৩০% স্বাস্থ্যকর ফ্যাট রেশিও বজায় রাখুন।',
              'বিএমআর বাড়াতে পর্যাপ্ত ঘুম, ভিটামিন ডি এবং হালকা রেজিস্ট্যান্স এক্সারসাইজ করুন।'
            ]
          : [
              'Never crash-diet far below BMR, as severe restriction downregulates thyroid T3 and metabolic rate.',
              'Follow the 4-Phase progression paired with 40% Carb, 30% Protein, and 30% Fat macro distribution.',
              'Preserve mitochondrial density with resistance exercises and adequate protein.'
            ]
      });
    } else if (selectedCalcId === 'tdee') {
      const fatLossTarget = Math.max(bmrVal, tdeeVal - 400);
      setCalcReport({
        primaryValue: `${tdeeVal}`,
        unit: 'kcal/day',
        statusLabel: isBn ? 'মোট দৈনিক ক্যালোরি ব্যয় (TDEE)' : 'Total Daily Energy Expenditure',
        statusZone: 'green',
        referenceRange: isBn ? `বিএমআর: ${bmrVal} kcal | ফ্যাট লস: ${fatLossTarget} kcal` : `BMR: ${bmrVal} kcal | Fat Loss: ${fatLossTarget} kcal`,
        summary: isBn
          ? `আপনার বর্তমান শারীরিক পরিশ্রম অনুযায়ী সারাদিনে মোট ${tdeeVal} ক্যালোরি খরচ হয়। ওজন ধরে রাখতে ${tdeeVal} ক্যালোরি এবং নিরাপদে চর্বি কমাতে প্রতিদিন প্রায় ${fatLossTarget} ক্যালোরি গ্রহণ করা আদর্শ।`
          : `Accounting for your physical activity multiplier (${activity}x), you expend ${tdeeVal} kcal/day. Eat ~${fatLossTarget} kcal/day for steady fat loss without muscle catabolism.`,
        metrics: [
          { label: isBn ? 'বিশ্রামে ব্যয় (BMR)' : 'Resting Burn (BMR)', value: `${bmrVal} kcal` },
          { label: isBn ? 'চলাফেরায় ব্যয় (Activity Burn)' : 'Activity Burn', value: `${tdeeVal - bmrVal} kcal` },
          { label: isBn ? 'ফ্যাট লস টার্গেট' : 'Fat Loss Target', value: `${fatLossTarget} kcal` }
        ],
        recommendations: isBn
          ? [
              'সারাদিনে ৩ বেলা বা ৪ বেলা খাবারে এই ক্যালোরি ভাগ করে নিন (মাঝখানে স্ন্যাকিং বন্ধ রাখুন)।',
              'লিফটের বদলে সিঁড়ি ব্যবহার ও দিনে ৮,০০০–১০,০০০ কদম হাঁটলে NEAT ক্যালোরি বার্ন বাড়ে।',
              'রাতে ঘুমানোর অন্তত ৩ ঘণ্টা আগে রাতের খাবার শেষ করুন।'
            ]
          : [
              'Divide your daily calories across 3 or 4 structured meals with zero grazing in between.',
              'Increase Non-Exercise Activity Thermogenesis (NEAT) by walking 8,000–10,000 steps daily.',
              'Finish your last meal 3 hours before bedtime to optimize overnight fat oxidation.'
            ]
      });
    } else if (selectedCalcId === 'whr') {
      const whrVal = waistCm / hipCm;
      const limit = gender === 'Male' ? 0.90 : 0.85;
      let zone: 'green' | 'yellow' | 'red' = 'green';
      let label = isBn ? 'নিরাপদ ভিসেরাল ফ্যাট জোন (Low Risk)' : 'Low Visceral Fat Risk';

      if (whrVal > limit + 0.05) {
        zone = 'red';
        label = isBn ? 'উচ্চ পেটের চর্বি ও ইনসুলিন ঝুঁকি (High Visceral Adiposity)' : 'High Visceral Fat & Cardiometabolic Risk';
      } else if (whrVal > limit) {
        zone = 'yellow';
        label = isBn ? 'মাঝারি ঝুঁকি (Moderate Central Obesity)' : 'Moderate Visceral Fat Risk';
      }

      setCalcReport({
        primaryValue: whrVal.toFixed(2),
        unit: 'WHR Ratio',
        statusLabel: label,
        statusZone: zone,
        referenceRange: gender === 'Male' ? '< 0.90 (Male)' : '< 0.85 (Female)',
        summary: isBn
          ? `আপনার কোমর (${waistCm} cm) ও নিতম্বের (${hipCm} cm) অনুপাত ${whrVal.toFixed(2)}। এটি পেটের ভেতরের অঙ্গপ্রত্যঙ্গের চারপাশের চর্বি (Visceral Fat), ফ্যাটি লিভার ও ইনসুলিন রেজিস্ট্যান্সের সবচেয়ে নির্ভরযোগ্য সূচক।`
          : `Your Waist-to-Hip Ratio is ${whrVal.toFixed(2)} (Waist: ${waistCm} cm, Hip: ${hipCm} cm). WHR is a stronger predictor of insulin resistance and fatty liver than BMI alone.`,
        metrics: [
          { label: isBn ? 'কোমরের মাপ' : 'Waist Circumference', value: `${waistCm} cm (${(waistCm / 2.54).toFixed(1)} in)` },
          { label: isBn ? 'উচ্চতা ও কোমরের অনুপাত (WHtR)' : 'Waist-to-Height Ratio', value: `${(waistCm / h).toFixed(2)} (Target < 0.50)` },
          { label: isBn ? 'ইনসুলিন রিস্ক স্ট্যাটাস' : 'Insulin Risk Profile', value: zone === 'green' ? 'Optimal' : zone === 'yellow' ? 'Elevated' : 'High Priority' }
        ],
        recommendations: isBn
          ? [
              'পেটের ভিসেরাল ফ্যাট কমাতে সাদা ভাত, চিনি ও বেকারি খাবার সম্পূর্ণ বাদ দিন।',
              'রাত ৮টার পর খাবার বন্ধ করে ১৬:৮ ইন্টারমিটেন্ট ফাস্টিং অনুশীলন করুন।',
              'মানসিক চাপ ও রাত জাগা কমান (উচ্চ কর্টিসল হরমোন সরাসরি পেটে চর্বি জমায়)।'
            ]
          : [
              'Eliminate refined carbohydrates and liquid sugars to rapidly mobilize visceral liver/belly fat.',
              'Practice 16:8 Intermittent Fasting to keep fasting insulin low overnight.',
              'Prioritize deep sleep before 11 PM to lower cortisol-driven abdominal fat storage.'
            ]
      });
    } else if (selectedCalcId === 'bodyfat') {
      // Clinical BMI + Age/Sex Deurenberg & Navy hybrid estimation
      const isMale = gender === 'Male' ? 1 : 0;
      const bfPercent = Math.max(8, Math.min(55, 1.20 * bmiVal + 0.23 * a - 10.8 * isMale - 5.4));
      const fatMassKg = (w * (bfPercent / 100)).toFixed(1);
      const leanMassKg = (w - parseFloat(fatMassKg)).toFixed(1);

      let zone: 'green' | 'yellow' | 'red' = 'green';
      const highCutoff = gender === 'Male' ? 25 : 32;
      const borderlineCutoff = gender === 'Male' ? 20 : 28;
      let label = isBn ? 'স্বাস্থ্যকর বডি ফ্যাট পার্সেন্টেজ (Healthy Composition)' : 'Healthy Body Fat Composition';

      if (bfPercent >= highCutoff) {
        zone = 'red';
        label = isBn ? 'অতিরিক্ত বডি ফ্যাট (High Adiposity)' : 'Elevated Body Fat Percentage';
      } else if (bfPercent >= borderlineCutoff) {
        zone = 'yellow';
        label = isBn ? 'মাঝারি বডি ফ্যাট (Borderline Fat %)' : 'Moderate Body Fat Percentage';
      }

      setCalcReport({
        primaryValue: `${bfPercent.toFixed(1)}%`,
        unit: 'Body Fat',
        statusLabel: label,
        statusZone: zone,
        referenceRange: gender === 'Male' ? '12% – 20% (Male)' : '20% – 28% (Female)',
        summary: isBn
          ? `আপনার শরীরে আনুমানিক চর্বির পরিমাণ ${bfPercent.toFixed(1)}% (${fatMassKg} কেজি) এবং চর্বিহীন পেশী ও হাড়ের ওজন (Lean Mass) ${leanMassKg} কেজি। সুস্থ মেটাবলিজমের জন্য পেশী ধরে রেখে শুধু ফ্যাট মাস কমানো জরুরি।`
          : `Your estimated body fat is ${bfPercent.toFixed(1)}% (${fatMassKg} kg fat mass) with ${leanMassKg} kg of metabolically active Lean Body Mass.`,
        metrics: [
          { label: isBn ? 'মোট চর্বির ওজন (Fat Mass)' : 'Total Fat Mass', value: `${fatMassKg} kg` },
          { label: isBn ? 'পেশী ও লীন মাস (Lean Mass)' : 'Lean Body Mass', value: `${leanMassKg} kg` },
          { label: isBn ? 'প্রোটিন চাহিদা' : 'Muscle Maintenance Protein', value: `${Math.round(w)} g/day` }
        ],
        recommendations: isBn
          ? [
              'শুধু ওজন না কমিয়ে বডি ফ্যাট কমাতে প্রতি বেলায় প্রোটিন (ডিম, মাছ, মুরগি, ডাল) রাখুন।',
              'সপ্তাহে অন্তত ৩ দিন ২০-৩০ মিনিট ফ্রি-হ্যান্ড বা রেজিস্ট্যান্স ব্যায়াম করুন।',
              'পর্যাপ্ত পানি ও ইলেক্ট্রোলাইট পান করুন যাতে সেলুলার মেটাবলিজম সচল থাকে।'
            ]
          : [
              'Consume 1g/kg protein daily split across meals to prevent muscle loss during fat reduction.',
              'Incorporate 20–30 minutes of bodyweight or resistance training 3–4 times a week.',
              'Avoid ultra-low-calorie starvation diets that burn muscle instead of adipose tissue.'
            ]
      });
    } else if (selectedCalcId === 'macro') {
      const targetCal = bmrVal + 100; // Phase 1 baseline
      const carbGrams = Math.round((targetCal * 0.40) / 4);
      const proteinTarget = Math.round(w * 1.0); // Strict 1g per kg rule
      const animalProtein = Math.round(proteinTarget * 0.6);
      const plantProtein = proteinTarget - animalProtein;
      const totalFatGrams = Math.round((targetCal * 0.30) / 9);
      const visibleCookingOilMl = Math.min(30, Math.max(15, Math.round(totalFatGrams * 0.45)));

      setCalcReport({
        primaryValue: '40 : 30 : 30',
        unit: 'C : P : F Ratio',
        statusLabel: isBn ? 'ফাংশনাল ম্যাক্রো, প্রোটিন ও রান্নার তেলের নিখুঁত হিসাব' : 'Functional 40:30:30 Macro & Cooking Fat Split',
        statusZone: 'green',
        referenceRange: `${targetCal} kcal/day (Phase 1 Target)`,
        summary: isBn
          ? `আপনার ওজন (${w} কেজি) ও বিএমআর অনুযায়ী ৪০% কার্বোহাইড্রেট, ৩০% প্রোটিন এবং ৩০% ফ্যাট অনুপাতে দৈনিক খাবারের নিখুঁত বণ্টন নিচে দেওয়া হলো:`
          : `Based on your ${w} kg body weight and Functional Medicine 40:30:30 rule, here is your exact daily macronutrient and cooking oil breakdown:`,
        metrics: [
          { label: isBn ? 'কার্বোহাইড্রেট (৪০%)' : 'Carbohydrates (40%)', value: `${carbGrams} g/day` },
          { label: isBn ? 'মোট প্রোটিন (১ গ্রাম/কেজি)' : 'Exact Protein (1g/kg)', value: `${proteinTarget} g (${animalProtein}g Animal + ${plantProtein}g Plant)` },
          { label: isBn ? 'মোট ফ্যাট (৩০%)' : 'Total Healthy Fat (30%)', value: `${totalFatGrams} g/day` },
          { label: isBn ? 'রান্নার তেল/ঘি সীমা' : 'Visible Cooking Oil/Ghee', value: `${visibleCookingOilMl} ml (${Math.round(visibleCookingOilMl / 5)} tsp/day)` }
        ],
        recommendations: isBn
          ? [
              `প্রোটিনের জন্য প্রতিদিন ${animalProtein} গ্রাম প্রাণিজ উৎস (মাছ, দেশি ডিম, মুরগি) এবং ${plantProtein} গ্রাম উদ্ভিজ্জ উৎস (ডাল, বিচি, বাদাম) গ্রহণ করুন।`,
              `সারাদিনে রান্নার জন্য মোট ${Math.round(visibleCookingOilMl / 5)} চা চামচ (${visibleCookingOilMl} ml) সরিষার তেল/অলিভ অয়েল/ঘি ব্যবহার করুন; বাকি ফ্যাট আসবে খাবার, বাদাম ও সিড থেকে।`,
              'কার্বোহাইড্রেট হিসেবে সাদা চিনির বদলে লাল চালের ভাত, ওটস ও শাকসবজি বেছে নিন।'
            ]
          : [
              `Combine ${animalProtein}g animal protein (fish, eggs, poultry) with ${plantProtein}g plant protein (lentils, seeds, nuts) daily.`,
              `Limit visible cooking oil/ghee to ${visibleCookingOilMl} ml (~${Math.round(visibleCookingOilMl / 5)} tsp/day); obtain remaining fats from whole eggs, fish, and seeds.`,
              'Source 40% carbohydrates strictly from low-GI vegetables, red rice, and fiber-rich greens.'
            ]
      });
    } else if (selectedCalcId === 'water') {
      let liters = w * 0.035;
      if (activity >= 1.55) liters += 0.5;
      const glasses = Math.round((liters * 1000) / 250);

      setCalcReport({
        primaryValue: liters.toFixed(1),
        unit: isBn ? 'লিটার / দিন' : 'Liters / Day',
        statusLabel: isBn ? `দৈনিক প্রায় ${glasses} গ্লাস (২৫০ মি.লি.) পানি প্রয়োজন` : `Approx. ${glasses} Glasses (250ml) Daily`,
        statusZone: 'green',
        referenceRange: `${(w * 0.033).toFixed(1)} – ${(w * 0.040).toFixed(1)} L/day`,
        summary: isBn
          ? `আপনার ${w} কেজি ওজনের কোষীয় হাইড্রেশন, কিডনি ডিটক্স এবং হজমশক্তি সচল রাখতে প্রতিদিন ${liters.toFixed(1)} লিটার (${glasses} গ্লাস) পানি প্রয়োজন।`
          : `To maintain optimal cellular hydration, lymphatic drainage, and metabolic rate at ${w} kg, target ${liters.toFixed(1)} liters (${glasses} glasses) of water daily.`,
        metrics: [
          { label: isBn ? 'সকালের ডিটক্স পানি' : 'Morning Awakening Water', value: '500 ml (2 Glasses warm)' },
          { label: isBn ? 'মোট গ্লাস (২৫০ মি.লি.)' : 'Total 250ml Glasses', value: `${glasses} Glasses` },
          { label: isBn ? 'হারবাল/ইলেক্ট্রোলাইট পানি' : 'Electrolyte / CCF Tea', value: '500 ml included' }
        ],
        recommendations: isBn
          ? [
              'খাবার খাওয়ার ঠিক মাঝখানে বা পরপরই অনেক পানি পান করবেন না (এতে পাচক রস পাতলা হয়ে গ্যাস হয়); খাবারের ৩০ মিনিট আগে বা পরে পান করুন।',
              'সকালে ঘুম থেকে উঠে বাসি মুখে ২ গ্লাস কুসুম গরম পানি (লেবু বা মেথি/জিরা ভেজানো) পান করুন।',
              'রাত ৮টার পর পানির পরিমাণ কমিয়ে আনুন যাতে রাতে বারবার ঘুম না ভাঙে।'
            ]
          : [
              'Avoid gulping large amounts of water during meals to protect stomach acid (HCl) concentration; drink 30 mins before or after.',
              'Start your morning with 500ml warm water infused with lemon, ginger, or fenugreek seeds.',
              'Taper hydration after 8:00 PM to ensure uninterrupted deep sleep.'
            ]
      });
    } else if (selectedCalcId === 'glycemic') {
      const gl = (gi * carbsG) / 100;
      let zone: 'green' | 'yellow' | 'red' = 'green';
      let label = isBn ? 'লো গ্লাইসেমিক লোড (Low GL ≤ 10 — নিরাপদ)' : 'Low Glycemic Load (≤ 10 — Insulin Safe)';

      if (gl >= 20) {
        zone = 'red';
        label = isBn ? 'হাই গ্লাইসেমিক লোড (High GL ≥ 20 — তীব্র ইনসুলিন স্পাইক)' : 'High Glycemic Load (≥ 20 — Glucose Spike Risk)';
      } else if (gl > 10) {
        zone = 'yellow';
        label = isBn ? 'মাঝারি গ্লাইসেমিক লোড (Moderate GL 11–19)' : 'Moderate Glycemic Load (11–19)';
      }

      setCalcReport({
        primaryValue: gl.toFixed(1),
        unit: 'GL Score',
        statusLabel: label,
        statusZone: zone,
        referenceRange: isBn ? 'লো: ০–১০ | মাঝারি: ১১–১৯ | হাই: ২০+' : 'Low: 0–10 | Med: 11–19 | High: 20+',
        summary: isBn
          ? `খাবারটির গ্লাইসেমিক ইনডেক্স (${gi}) এবং কার্বোহাইড্রেট পরিমাণ (${carbsG} গ্রাম) অনুযায়ী এর গ্লাইসেমিক লোড হলো ${gl.toFixed(1)}। ${gl >= 20 ? 'এটি রক্তে দ্রুত সুগার ও ইনসুলিন বাড়িয়ে চর্বি জমাতে পারে।' : 'এটি পরিমিত পরিমাণে প্রোটিন ও ফাইবারের সাথে খাওয়া নিরাপদ।'}`
          : `With a Glycemic Index of ${gi} and ${carbsG}g net carbohydrates, this meal carries a Glycemic Load of ${gl.toFixed(1)}.`,
        metrics: [
          { label: isBn ? 'গ্লাইসেমিক ইনডেক্স (GI)' : 'Glycemic Index (GI)', value: `${gi}` },
          { label: isBn ? 'নেট কার্বোহাইড্রেট' : 'Net Carbohydrates', value: `${carbsG} g` },
          { label: isBn ? 'ইনসুলিন রেসপন্স' : 'Insulin Impact', value: zone === 'green' ? 'Minimal' : zone === 'yellow' ? 'Moderate' : 'High Spike' }
        ],
        recommendations: isBn
          ? [
              'গ্লাইসেমিক লোড কমাতে ভাতের পরিমাণ অর্ধেক করে তার সাথে প্রচুর শাকসবজি, ডিম/মাছ ও ১ চামচ ঘি বা অলিভ অয়েল যুক্ত করুন।',
              'খাবারের শুরুতে আগে সালাদ ও সবজি খেলে একই খাবারের ব্লাড সুগার স্পাইক ৪০% পর্যন্ত কমে যায়।',
              'সাদা ভাত বা আলুর বদলে লাল চালের ভাত, কিনোয়া বা কাঁচা কলা বেছে নিন।'
            ]
          : [
              'Pair carbohydrate foods with protein, fiber, and healthy fats (ghee/olive oil) to slow gastric emptying and blunt glucose spikes.',
              'Eat fibrous vegetables before starches to reduce post-meal insulin excursion by up to 40%.',
              'Keep single-meal Glycemic Load under 15 for diabetes reversal and PCOS management.'
            ]
      });
    } else if (selectedCalcId === 'sleep') {
      const [hh, mm] = (bedTime || '22:30').split(':').map(Number);
      const baseMinutes = (isNaN(hh) ? 22 : hh) * 60 + (isNaN(mm) ? 30 : mm) + 15; // +15m to fall asleep
      const formatTime = (totalMins: number) => {
        const normalized = ((totalMins % 1440) + 1440) % 1440;
        const h24 = Math.floor(normalized / 60);
        const m = normalized % 60;
        const period = h24 >= 12 ? 'PM' : 'AM';
        const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
        return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
      };

      const cycle4 = formatTime(baseMinutes + 4 * 90); // 6h
      const cycle5 = formatTime(baseMinutes + 5 * 90); // 7.5h (Optimal)
      const cycle6 = formatTime(baseMinutes + 6 * 90); // 9h

      setCalcReport({
        primaryValue: cycle5,
        unit: isBn ? '৫ সাইকেল (৭.৫ ঘণ্টা ঘুম)' : '5 Cycles (7.5h Optimal)',
        statusLabel: isBn ? 'সার্কাডিয়ান ডিপ স্লিপ ও হরমোন রিকভারি টাইম' : 'Optimal Circadian Wake-Up Window',
        statusZone: 'green',
        referenceRange: `${cycle4} (6h) — ${cycle5} (7.5h)`,
        summary: isBn
          ? `মানুষের ঘুম ৯০ মিনিটের সাইকেলে সম্পন্ন হয়। আপনি রাত ${bedTime}-এ বিছানায় গেলে (ঘুমাতে ১৫ মিনিট সময় ধরে) সাইকেলের শেষ ধাপে ঘুম থেকে উঠলে মস্তিষ্ক সবচেয়ে সতেজ থাকে এবং কর্টিসল হরমোন ব্যালেন্স থাকে।`
          : `Human sleep progresses in 90-minute REM/Deep cycles. Going to bed at ${bedTime} (+15 mins sleep onset), waking up at the end of a full cycle prevents sleep inertia and balances morning cortisol.`,
        metrics: [
          { label: isBn ? '৪ সাইকেল (৬ ঘণ্টা - সর্বনিম্ন)' : '4 Cycles (6.0 hrs)', value: cycle4 },
          { label: isBn ? '৫ সাইকেল (৭.৫ ঘণ্টা - সেরা)' : '5 Cycles (7.5 hrs - Best)', value: cycle5 },
          { label: isBn ? '৬ সাইকেল (৯ ঘণ্টা - ডিপ রিকভারি)' : '6 Cycles (9.0 hrs)', value: cycle6 }
        ],
        recommendations: isBn
          ? [
              'রাত ১০টা থেকে ২টার মধ্যে গ্রোথ হরমোন ও লিভার ডিটক্স সবচেয়ে বেশি হয়, তাই রাত ১০:৩০-এর মধ্যে ঘুমিয়ে পড়ুন।',
              'ঘুমানোর ১ ঘণ্টা আগে মোবাইল ও ব্লু-লাইট স্ক্রিন বন্ধ করুন যাতে মেলাটোনিন হরমোন নিঃসৃত হতে পারে।',
              'ভালো ঘুমের জন্য রাতের খাবার ঘুমানোর অন্তত ৩ ঘণ্টা আগে শেষ করুন।'
            ]
          : [
              'Sleep before 10:30 PM to capture the peak Growth Hormone and hepatic repair window (10 PM – 2 AM).',
              'Turn off blue-light screens 60 minutes before bed to protect pineal melatonin secretion.',
              'Finish dinner 3 hours prior to sleep so digestion does not interfere with deep restorative sleep.'
            ]
      });
    }
  };

  const currentCalc = CALCULATORS.find(c => c.id === selectedCalcId) || CALCULATORS[0];
  const currentAssessment = ASSESSMENTS.find(a => a.id === selectedAssessmentId) || ASSESSMENTS[0];

  // Assessment Score Calculation
  const maxRawScore = currentAssessment.questions.length * 3; // 18
  const rawScore = answers.reduce((acc, v) => acc + v, 0);
  const riskPercent = Math.round((rawScore / maxRawScore) * 100);
  const healthZone: 'green' | 'yellow' | 'red' =
    riskPercent <= 25 ? 'green' : riskPercent <= 55 ? 'yellow' : 'red';

  const activityOptions = [
    { val: 1.2, label: isBn ? 'ডেস্ক জব / শারীরিক ব্যায়াম নেই (Sedentary)' : t.act_sedentary },
    { val: 1.375, label: isBn ? 'হালকা পরিশ্রম / সপ্তাহে ১-৩ দিন হাঁটা (Light)' : t.act_light },
    { val: 1.55, label: isBn ? 'মাঝারি পরিশ্রম / সপ্তাহে ৩-৫ দিন ব্যায়াম (Moderate)' : t.act_moderate },
    { val: 1.725, label: isBn ? 'ভারী পরিশ্রম / প্রতিদিন ব্যায়াম (Active)' : t.act_active },
    { val: 1.9, label: isBn ? 'অ্যাথলেট / অত্যন্ত পরিশ্রমী (Extra Active)' : t.act_extra }
  ];

  return (
    <div className="max-w-5xl mx-auto pb-28 px-3 sm:px-6 animate-in fade-in duration-300">
      {/* =====================================================================
          LEVEL 1: MASTER 2-BOX HUB (Calculators Box vs Assessment Forms Box)
         ===================================================================== */}
      {screen === 'hub' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className={`p-6 sm:p-8 rounded-3xl border text-center ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'}`}>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-2">
              {isBn ? 'ক্লিনিক্যাল হেলথ টুলকিট ও ডায়াগনস্টিক হাব' : 'Clinical Health Toolkit & Self-Assessment Hub'}
            </p>
            <h2 className={`text-2xl sm:text-4xl font-bold serif italic mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {isBn ? 'হেলথ ক্যালকুলেটর ও অ্যাসেসমেন্ট বক্স' : 'Health Calculators & Functional Assessments'}
            </h2>
            <p className={`text-xs sm:text-sm max-w-2xl mx-auto ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {isBn
                ? 'নিচের যেকোনো একটি বক্সে ক্লিক করুন। ক্যালকুলেটর বক্সে পাবেন ১০টি ক্লিনিক্যাল ক্যালকুলেটর এবং অ্যাসেসমেন্ট বক্সে পাবেন ৮টি ফাংশনাল নিউট্রিশন হেলথ অ্যাসেসমেন্ট ফর্ম।'
                : 'Select a clinical box below: explore 10 precision metabolic calculators or take 8 root-cause Functional Nutrition self-assessments.'}
            </p>
          </div>

          {/* TWO PRIMARY MASTER BOXES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {/* BOX 1: HEALTH CALCULATORS BOX */}
            <div
              onClick={() => {
                setScreen('calculators_grid');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setScreen('calculators_grid')}
              className={`group cursor-pointer rounded-3xl p-6 sm:p-8 border-2 transition-all duration-200 flex flex-col justify-between text-left ${
                darkMode
                  ? 'bg-slate-900/90 border-indigo-500/30 hover:border-indigo-400 hover:bg-slate-900'
                  : 'bg-white border-indigo-100 hover:border-indigo-500 shadow-md hover:shadow-xl'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-3xl shadow-md transition-transform group-hover:scale-105 ${
                    darkMode ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-600 text-white'
                  }`}>
                    🧮
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                    {isBn ? 'বক্স ১ · ১০টি ক্যালকুলেটর' : 'Box 1 · 10 Calculators'}
                  </span>
                </div>

                <h3 className={`text-xl sm:text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {isBn ? 'হেলথ ক্যালকুলেটর বক্স' : 'Health Calculators Box'}
                </h3>
                <p className={`text-xs sm:text-sm leading-relaxed mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  {isBn
                    ? 'বিএমআই, আইডিয়াল ওয়েট, বিএমআর, দৈনিক ক্যালোরি, ওয়েস্ট-টু-হিপ রেশিও, বডি ফ্যাট %, ম্যাক্রো ও তেলের মাপ, পানি এবং স্লিপ সাইকেল ক্যালকুলেটর।'
                    : 'BMI, Ideal Weight, BMR Phase Targets, TDEE, Waist-to-Hip Visceral Risk, Body Fat %, 40:30:30 Macros, Hydration & Sleep Cycle.'}
                </p>

                {/* Preview List inside Box 1 */}
                <div className={`p-4 rounded-2xl border mb-6 ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200/70'}`}>
                  <p className={`text-[11px] font-bold uppercase tracking-wider mb-2.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {isBn ? 'এই বক্সে যা যা থাকছে:' : 'Included Calculators:'}
                  </p>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-xs font-semibold">
                    <span className="truncate">⚖️ {isBn ? 'বিএমআই (BMI)' : 'BMI Calculator'}</span>
                    <span className="truncate">🎯 {isBn ? 'আইডিয়াল ওয়েট' : 'Ideal Weight'}</span>
                    <span className="truncate">🔥 {isBn ? 'বিএমআর ও ৪ ফেজ' : 'BMR & Phases'}</span>
                    <span className="truncate">⚡ {isBn ? 'দৈনিক ক্যালোরি (TDEE)' : 'Daily Calorie'}</span>
                    <span className="truncate">📏 {isBn ? 'ওয়েস্ট-টু-হিপ (WHR)' : 'Waist-to-Hip'}</span>
                    <span className="truncate">🧬 {isBn ? 'বডি ফ্যাট %' : 'Body Fat %'}</span>
                    <span className="truncate">🥑 {isBn ? 'ম্যাক্রো ও তেলের মাপ' : 'Macros & Oil'}</span>
                    <span className="truncate">💧 {isBn ? 'পানি ও গ্লাইসেমিক লোড' : 'Water & Glycemic'}</span>
                  </div>
                </div>
              </div>

              <div className="w-full py-3.5 px-5 rounded-2xl bg-indigo-600 group-hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-between transition-colors">
                <span>{isBn ? 'সব ক্যালকুলেটর কার্ড দেখুন' : 'Open Calculator Cards'}</span>
                <span className="text-lg transition-transform group-hover:translate-x-1">→</span>
              </div>
            </div>

            {/* BOX 2: FUNCTIONAL NUTRITION ASSESSMENT FORMS BOX */}
            <div
              onClick={() => {
                setScreen('assessments_grid');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setScreen('assessments_grid')}
              className={`group cursor-pointer rounded-3xl p-6 sm:p-8 border-2 transition-all duration-200 flex flex-col justify-between text-left ${
                darkMode
                  ? 'bg-slate-900/90 border-emerald-500/30 hover:border-emerald-400 hover:bg-slate-900'
                  : 'bg-white border-emerald-100 hover:border-emerald-500 shadow-md hover:shadow-xl'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-3xl shadow-md transition-transform group-hover:scale-105 ${
                    darkMode ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-600 text-white'
                  }`}>
                    🩺
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                    {isBn ? 'বক্স ২ · ৮টি অ্যাসেসমেন্ট ফর্ম' : 'Box 2 · 8 Assessments'}
                  </span>
                </div>

                <h3 className={`text-xl sm:text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {isBn ? 'ফাংশনাল নিউট্রিশন অ্যাসেসমেন্ট ফর্ম' : 'Functional Health Assessments Box'}
                </h3>
                <p className={`text-xs sm:text-sm leading-relaxed mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  {isBn
                    ? 'পিসিওএস (PCOS), গাট হেলথ, মাইক্রোবায়োম, মেটাবলিক ও ইনসুলিন রেজিস্ট্যান্স, ফ্যাটি লিভার, থাইরয়েড, প্রদাহ এবং ভিটামিন ঘাটতি অ্যাসেসমেন্ট করে নিজের হেলথ স্ট্যাটাস জানুন।'
                    : 'Self-assess PCOS, Gut Health, Microbiome, Metabolic & Insulin Resistance, Fatty Liver, Thyroid/Adrenal, Inflammation, and Micronutrient status.'}
                </p>

                {/* Preview List inside Box 2 */}
                <div className={`p-4 rounded-2xl border mb-6 ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200/70'}`}>
                  <p className={`text-[11px] font-bold uppercase tracking-wider mb-2.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {isBn ? 'এই বক্সে যা যা থাকছে:' : 'Included Clinical Forms:'}
                  </p>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-xs font-semibold">
                    <span className="truncate">🌸 {isBn ? 'পিসিওএস অ্যাসেসমেন্ট' : 'PCOS Assessment'}</span>
                    <span className="truncate">🌿 {isBn ? 'গাট হেলথ অ্যাসেসমেন্ট' : 'Gut Health Form'}</span>
                    <span className="truncate">🦠 {isBn ? 'মাইক্রোবায়োম হেলথ' : 'Microbiome Check'}</span>
                    <span className="truncate">🔥 {isBn ? 'মেটাবলিক ও ইনসুলিন' : 'Metabolic Health'}</span>
                    <span className="truncate">🛡️ {isBn ? 'ফ্যাটি লিভার ও ডিটক্স' : 'Fatty Liver Form'}</span>
                    <span className="truncate">🦋 {isBn ? 'থাইরয়েড ও অ্যাড্রেনাল' : 'Thyroid & Adrenal'}</span>
                    <span className="truncate">⚡ {isBn ? 'ক্রনিক ইনফ্ল্যামেশন' : 'Inflammation Check'}</span>
                    <span className="truncate">💊 {isBn ? 'ভিটামিন ও মিনারেল ঘাটতি' : 'Vitamin Screener'}</span>
                  </div>
                </div>
              </div>

              <div className="w-full py-3.5 px-5 rounded-2xl bg-emerald-600 group-hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-between transition-colors">
                <span>{isBn ? 'সব অ্যাসেসমেন্ট ফর্ম দেখুন' : 'Open Assessment Forms'}</span>
                <span className="text-lg transition-transform group-hover:translate-x-1">→</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          LEVEL 2A: HEALTH CALCULATOR CARDS GRID (Inside Box 1)
         ===================================================================== */}
      {screen === 'calculators_grid' && (
        <div className="space-y-5">
          {/* Top Bar */}
          <div className={`p-4 sm:p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'}`}>
            <button
              onClick={() => setScreen('hub')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors ${
                darkMode ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
              }`}
            >
              <span>←</span>
              <span>{isBn ? 'মেইন বক্সে ফিরুন' : 'Back to Boxes'}</span>
            </button>

            <div className="text-center flex-1 min-w-[180px]">
              <h2 className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                🧮 {isBn ? 'হেলথ ক্যালকুলেটর কার্ডসমূহ' : 'Health Calculator Cards'}
              </h2>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {isBn ? 'যেকোনো কার্ডে ক্লিক করে ডাটা দিন এবং তাৎক্ষণিক রিপোর্ট পান' : 'Click any calculator card below to enter data and get your clinical report'}
              </p>
            </div>

            <button
              onClick={() => setScreen('assessments_grid')}
              className="px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
            >
              🩺 {isBn ? 'অ্যাসেসমেন্ট ফর্ম বক্স →' : 'Assessments Box →'}
            </button>
          </div>

          {/* 10 Calculator Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CALCULATORS.map((calc) => (
              <button
                key={calc.id}
                onClick={() => openCalculatorCard(calc.id)}
                className={`group p-5 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col justify-between hover:-translate-y-0.5 ${calc.accent} ${
                  darkMode ? 'bg-slate-900/90 hover:bg-slate-900' : 'bg-white hover:shadow-lg'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-3xl">{calc.icon}</span>
                    <span className={`text-[11px] font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {isBn ? calc.categoryBn : calc.categoryEn}
                    </span>
                  </div>
                  <h3 className={`text-base sm:text-lg font-bold mb-1.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {isBn ? calc.titleBn : calc.titleEn}
                  </h3>
                  <p className={`text-xs leading-relaxed mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    {isBn ? calc.descBn : calc.descEn}
                  </p>
                </div>

                <div className={`pt-3 border-t flex items-center justify-between text-xs font-bold uppercase tracking-wider ${
                  darkMode ? 'border-slate-800 text-indigo-400 group-hover:text-indigo-300' : 'border-slate-100 text-indigo-600 group-hover:text-indigo-700'
                }`}>
                  <span>{isBn ? 'ক্যালকুলেট ও রিপোর্ট দেখুন' : 'Calculate & View Report'}</span>
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          LEVEL 2B: FUNCTIONAL ASSESSMENT CARDS GRID (Inside Box 2)
         ===================================================================== */}
      {screen === 'assessments_grid' && (
        <div className="space-y-5">
          {/* Top Bar */}
          <div className={`p-4 sm:p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'}`}>
            <button
              onClick={() => setScreen('hub')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors ${
                darkMode ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
              }`}
            >
              <span>←</span>
              <span>{isBn ? 'মেইন বক্সে ফিরুন' : 'Back to Boxes'}</span>
            </button>

            <div className="text-center flex-1 min-w-[180px]">
              <h2 className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                🩺 {isBn ? 'ফাংশনাল নিউট্রিশন অ্যাসেসমেন্ট কার্ডসমূহ' : 'Functional Nutrition Assessment Cards'}
              </h2>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {isBn ? 'যেকোনো অ্যাসেসমেন্ট কার্ডে ক্লিক করে ৬টি প্রশ্নের উত্তর দিন এবং নিজের হেলথ স্ট্যাটাস জানুন' : 'Select any clinical assessment below to evaluate your root-cause health status'}
              </p>
            </div>

            <button
              onClick={() => setScreen('calculators_grid')}
              className="px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              🧮 {isBn ? 'ক্যালকুলেটর বক্স →' : 'Calculators Box →'}
            </button>
          </div>

          {/* 8 Assessment Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ASSESSMENTS.map((item) => (
              <button
                key={item.id}
                onClick={() => openAssessmentCard(item.id)}
                className={`group p-5 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col justify-between hover:-translate-y-0.5 ${item.accent} ${
                  darkMode ? 'bg-slate-900/90 hover:bg-slate-900' : 'bg-white hover:shadow-lg'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-3xl">{item.icon}</span>
                    <span className={`text-[11px] font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {isBn ? item.categoryBn : item.categoryEn}
                    </span>
                  </div>
                  <h3 className={`text-base sm:text-lg font-bold mb-1.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {isBn ? item.titleBn : item.titleEn}
                  </h3>
                  <p className={`text-xs leading-relaxed mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    {isBn ? item.descBn : item.descEn}
                  </p>
                </div>

                <div className={`pt-3 border-t flex items-center justify-between text-xs font-bold uppercase tracking-wider ${
                  darkMode ? 'border-slate-800 text-emerald-400 group-hover:text-emerald-300' : 'border-slate-100 text-emerald-700 group-hover:text-emerald-800'
                }`}>
                  <span>{isBn ? 'অ্যাসেসমেন্ট শুরু করুন (৬টি প্রশ্ন)' : 'Start Assessment (6 Qs)'}</span>
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          LEVEL 3A: INDIVIDUAL CALCULATOR DATA ENTRY & CLINICAL REPORT
         ===================================================================== */}
      {screen === 'calculator_detail' && (
        <div className="space-y-6">
          {/* Top Navigation */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'}`}>
            <button
              onClick={() => {
                setScreen('calculators_grid');
                setCalcReport(null);
              }}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors ${
                darkMode ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
              }`}
            >
              <span>←</span>
              <span>{isBn ? 'সব ক্যালকুলেটর কার্ড' : 'All Calculator Cards'}</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-2xl">{currentCalc.icon}</span>
              <span className={`font-bold text-sm sm:text-base ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {isBn ? currentCalc.titleBn : currentCalc.titleEn}
              </span>
            </div>

            <button
              onClick={() => setScreen('hub')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
            >
              {isBn ? 'মেইন বক্স' : 'Main Hub'}
            </button>
          </div>

          {/* Data Entry Card */}
          <div className={`p-6 sm:p-8 rounded-3xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'}`}>
            <div className="mb-6">
              <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                {isBn ? currentCalc.categoryBn : currentCalc.categoryEn}
              </p>
              <h3 className={`text-xl sm:text-2xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {isBn ? currentCalc.titleBn : currentCalc.titleEn}
              </h3>
              <p className={`text-xs sm:text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {isBn ? currentCalc.descBn : currentCalc.descEn}
              </p>
            </div>

            {/* Dynamic Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {/* Weight */}
              {['bmi', 'ibw', 'bmr', 'tdee', 'bodyfat', 'macro', 'water'].includes(selectedCalcId) && (
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    {isBn ? 'আপনার ওজন (কেজি / Kg)' : 'Weight (kg)'}
                  </label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="68"
                    className={`w-full p-3.5 rounded-xl border font-bold text-base outline-none focus:border-indigo-500 ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              )}

              {/* Height */}
              {['bmi', 'ibw', 'bmr', 'tdee', 'whr', 'bodyfat', 'macro'].includes(selectedCalcId) && (
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    {isBn ? 'উচ্চতা (সেন্টিমিটার / cm — ৫ ফুট ৫ ইঞ্চি ≈ ১৬৫ সে.মি.)' : 'Height (cm)'}
                  </label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="165"
                    className={`w-full p-3.5 rounded-xl border font-bold text-base outline-none focus:border-indigo-500 ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              )}

              {/* Age */}
              {['bmr', 'tdee', 'bodyfat', 'macro'].includes(selectedCalcId) && (
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    {isBn ? 'বয়স (বছর / Years)' : 'Age (Years)'}
                  </label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="32"
                    className={`w-full p-3.5 rounded-xl border font-bold text-base outline-none focus:border-indigo-500 ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              )}

              {/* Gender */}
              {['ibw', 'bmr', 'tdee', 'whr', 'bodyfat', 'macro'].includes(selectedCalcId) && (
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    {isBn ? 'লিঙ্গ (Gender)' : 'Biological Sex'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setGender('Male')}
                      className={`p-3.5 rounded-xl font-bold text-sm transition-colors ${
                        gender === 'Male'
                          ? 'bg-indigo-600 text-white'
                          : darkMode
                          ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {isBn ? 'পুরুষ (Male)' : 'Male'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('Female')}
                      className={`p-3.5 rounded-xl font-bold text-sm transition-colors ${
                        gender === 'Female'
                          ? 'bg-pink-600 text-white'
                          : darkMode
                          ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {isBn ? 'নারী (Female)' : 'Female'}
                    </button>
                  </div>
                </div>
              )}

              {/* Waist & Hip for WHR */}
              {selectedCalcId === 'whr' && (
                <>
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      {isBn ? 'কোমরের মাপ (Waist in cm — নাভির সমান্তরালে)' : 'Waist Circumference (cm)'}
                    </label>
                    <input
                      type="number"
                      value={waist}
                      onChange={(e) => setWaist(e.target.value)}
                      placeholder="86"
                      className={`w-full p-3.5 rounded-xl border font-bold text-base outline-none focus:border-indigo-500 ${
                        darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      {isBn ? 'নিতম্বের মাপ (Hip in cm — সবচেয়ে চওড়া অংশ)' : 'Hip Circumference (cm)'}
                    </label>
                    <input
                      type="number"
                      value={hip}
                      onChange={(e) => setHip(e.target.value)}
                      placeholder="98"
                      className={`w-full p-3.5 rounded-xl border font-bold text-base outline-none focus:border-indigo-500 ${
                        darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                </>
              )}

              {/* Neck for Body Fat */}
              {selectedCalcId === 'bodyfat' && (
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    {isBn ? 'গলার মাপ (Neck in cm - ঐচ্ছিক)' : 'Neck Circumference (cm)'}
                  </label>
                  <input
                    type="number"
                    value={neck}
                    onChange={(e) => setNeck(e.target.value)}
                    placeholder="36"
                    className={`w-full p-3.5 rounded-xl border font-bold text-base outline-none focus:border-indigo-500 ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              )}

              {/* Activity Level for TDEE & Water */}
              {['tdee', 'water'].includes(selectedCalcId) && (
                <div className="sm:col-span-2">
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    {isBn ? 'দৈনিক শারীরিক পরিশ্রমের মাত্রা (Activity Level)' : 'Daily Physical Activity Level'}
                  </label>
                  <select
                    value={activity}
                    onChange={(e) => setActivity(parseFloat(e.target.value))}
                    className={`w-full p-3.5 rounded-xl border font-bold text-sm outline-none focus:border-indigo-500 ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    {activityOptions.map((opt) => (
                      <option key={opt.val} value={opt.val}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Glycemic Load Inputs */}
              {selectedCalcId === 'glycemic' && (
                <>
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      {isBn ? 'খাবারের গ্লাইসেমিক ইনডেক্স (GI — যেমন সাদা ভাত ৭৩, লাল চাল ৫৫, ডাল ৩২)' : 'Food Glycemic Index (GI: 0–100)'}
                    </label>
                    <input
                      type="number"
                      value={giValue}
                      onChange={(e) => setGiValue(e.target.value)}
                      placeholder="65"
                      className={`w-full p-3.5 rounded-xl border font-bold text-base outline-none focus:border-indigo-500 ${
                        darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      {isBn ? 'খাবারে নেট কার্বোহাইড্রেট পরিমাণ (গ্রাম / Grams)' : 'Net Carbohydrates in Portion (grams)'}
                    </label>
                    <input
                      type="number"
                      value={netCarbs}
                      onChange={(e) => setNetCarbs(e.target.value)}
                      placeholder="45"
                      className={`w-full p-3.5 rounded-xl border font-bold text-base outline-none focus:border-indigo-500 ${
                        darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                  <div className="sm:col-span-2 flex flex-wrap gap-2 pt-1">
                    {[
                      { nameBn: '১ প্লেট সাদা ভাত (GI 73, 55g)', nameEn: 'White Rice Bowl (GI 73, 55g)', gi: '73', c: '55' },
                      { nameBn: '১ কাপ লাল চালের ভাত (GI 55, 35g)', nameEn: 'Red Rice Cup (GI 55, 35g)', gi: '55', c: '35' },
                      { nameBn: '১ বাটি ডাল ও সবজি (GI 32, 20g)', nameEn: 'Lentils & Greens (GI 32, 20g)', gi: '32', c: '20' },
                      { nameBn: 'মিষ্টি / কোল্ড ড্রিংকস (GI 80, 45g)', nameEn: 'Sweet / Soda (GI 80, 45g)', gi: '80', c: '45' }
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setGiValue(preset.gi);
                          setNetCarbs(preset.c);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                          darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {isBn ? preset.nameBn : preset.nameEn}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Sleep Bedtime Input */}
              {selectedCalcId === 'sleep' && (
                <div className="sm:col-span-2">
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    {isBn ? 'আপনি রাতে কয়টায় ঘুমাতে যান? (Bedtime)' : 'Target Bedtime'}
                  </label>
                  <input
                    type="time"
                    value={bedTime}
                    onChange={(e) => setBedTime(e.target.value)}
                    className={`w-full sm:w-64 p-3.5 rounded-xl border font-bold text-base outline-none focus:border-indigo-500 ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              )}
            </div>

            <button
              onClick={runCalculator}
              className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm uppercase tracking-wider shadow-lg transition-all active:scale-[0.99]"
            >
              {isBn ? 'ক্লিনিক্যাল রিপোর্ট তৈরি করুন (Generate Report)' : 'Calculate & Generate Clinical Report'}
            </button>
          </div>

          {/* Generated Clinical Report Card */}
          {calcReport && (
            <div className={`p-6 sm:p-8 rounded-3xl border-2 space-y-6 animate-in slide-in-from-bottom-4 duration-300 ${
              calcReport.statusZone === 'green'
                ? darkMode ? 'bg-emerald-950/20 border-emerald-500/40' : 'bg-emerald-50/60 border-emerald-300'
                : calcReport.statusZone === 'yellow'
                ? darkMode ? 'bg-amber-950/20 border-amber-500/40' : 'bg-amber-50/60 border-amber-300'
                : darkMode ? 'bg-rose-950/20 border-rose-500/40' : 'bg-rose-50/60 border-rose-300'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-500/20">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">
                    {isBn ? 'ক্লিনিক্যাল ক্যালকুলেশন রিপোর্ট' : 'Clinical Calculation Report'} · {isBn ? 'রেফারেন্স:' : 'Ref:'} {calcReport.referenceRange}
                  </p>
                  <h4 className={`text-lg sm:text-xl font-bold ${
                    calcReport.statusZone === 'green'
                      ? darkMode ? 'text-emerald-400' : 'text-emerald-800'
                      : calcReport.statusZone === 'yellow'
                      ? darkMode ? 'text-amber-400' : 'text-amber-800'
                      : darkMode ? 'text-rose-400' : 'text-rose-800'
                  }`}>
                    {calcReport.statusZone === 'green' ? '🟢 ' : calcReport.statusZone === 'yellow' ? '🟡 ' : '🔴 '}
                    {calcReport.statusLabel}
                  </h4>
                </div>

                <div className={`px-5 py-3 rounded-2xl text-right ${darkMode ? 'bg-slate-900/90' : 'bg-white shadow-sm'}`}>
                  <div className="text-3xl sm:text-4xl font-black text-indigo-500">
                    {calcReport.primaryValue}
                  </div>
                  <div className="text-[11px] font-bold uppercase tracking-wider opacity-60">
                    {calcReport.unit}
                  </div>
                </div>
              </div>

              {/* Clinical Interpretation */}
              <p className={`text-sm sm:text-base leading-relaxed font-medium ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                {calcReport.summary}
              </p>

              {/* Breakdown Metrics Grid */}
              {calcReport.metrics && calcReport.metrics.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {calcReport.metrics.map((m, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200/80'}`}
                    >
                      <div className="text-[11px] font-bold uppercase tracking-wider opacity-60 mb-1">
                        {m.label}
                      </div>
                      <div className={`text-base sm:text-lg font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        {m.value}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Actionable Functional Nutrition Advice */}
              <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80'}`}>
                <h5 className={`text-xs font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-indigo-400' : 'text-indigo-700'}`}>
                  🩺 {isBn ? 'ফাংশনাল নিউট্রিশন করণীয় ও পরামর্শ:' : 'Functional Nutrition Action Plan:'}
                </h5>
                <ul className="space-y-2 text-xs sm:text-sm">
                  {calcReport.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span className={darkMode ? 'text-slate-300' : 'text-slate-700'}>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          LEVEL 3B: INTERACTIVE FUNCTIONAL NUTRITION ASSESSMENT FORM & REPORT
         ===================================================================== */}
      {screen === 'assessment_detail' && (
        <div className="space-y-6">
          {/* Top Bar */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'}`}>
            <button
              onClick={() => {
                setScreen('assessments_grid');
                setAssessmentSubmitted(false);
              }}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors ${
                darkMode ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
              }`}
            >
              <span>←</span>
              <span>{isBn ? 'সব অ্যাসেসমেন্ট কার্ড' : 'All Assessment Cards'}</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-2xl">{currentAssessment.icon}</span>
              <span className={`font-bold text-sm sm:text-base ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {isBn ? currentAssessment.titleBn : currentAssessment.titleEn}
              </span>
            </div>

            <button
              onClick={() => setScreen('hub')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
            >
              {isBn ? 'মেইন বক্স' : 'Main Hub'}
            </button>
          </div>

          {/* Questionnaire Form */}
          <div className={`p-6 sm:p-8 rounded-3xl border shadow-sm space-y-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'}`}>
            <div>
              <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                {isBn ? currentAssessment.categoryBn : currentAssessment.categoryEn}
              </p>
              <h3 className={`text-xl sm:text-2xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {isBn ? currentAssessment.titleBn : currentAssessment.titleEn}
              </h3>
              <p className={`text-xs sm:text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {isBn
                  ? 'নিচের ৬টি ক্লিনিক্যাল প্রশ্নের প্রতিটির জন্য আপনার বর্তমান শারীরিক অবস্থা অনুযায়ী সঠিক অপশনটি সিলেক্ট করুন:'
                  : 'Rate each of the 6 clinical symptom questions below based on how frequently you experience them:'}
              </p>
            </div>

            <div className="space-y-4">
              {currentAssessment.questions.map((q, qIdx) => (
                <div
                  key={qIdx}
                  className={`p-4 sm:p-5 rounded-2xl border ${
                    darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/80 border-slate-200/70'
                  }`}
                >
                  <p className={`text-sm sm:text-base font-bold mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {isBn ? q.qBn : q.qEn}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { score: 0, labelBn: 'কখনোই না (0)', labelEn: 'Never (0)' },
                      { score: 1, labelBn: 'মাঝে মাঝে (1)', labelEn: 'Mild / Sometimes (1)' },
                      { score: 2, labelBn: 'প্রায়ই হয় (2)', labelEn: 'Often / Moderate (2)' },
                      { score: 3, labelBn: 'তীব্র / প্রতিদিন (3)', labelEn: 'Severe / Daily (3)' }
                    ].map((opt) => {
                      const isSelected = answers[qIdx] === opt.score;
                      return (
                        <button
                          key={opt.score}
                          type="button"
                          onClick={() => {
                            const updated = [...answers];
                            updated[qIdx] = opt.score;
                            setAnswers(updated);
                          }}
                          className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all border ${
                            isSelected
                              ? opt.score === 0
                                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                                : opt.score === 1
                                ? 'bg-amber-500 text-white border-amber-400 shadow-sm'
                                : opt.score === 2
                                ? 'bg-orange-600 text-white border-orange-500 shadow-sm'
                                : 'bg-rose-600 text-white border-rose-500 shadow-sm'
                              : darkMode
                              ? 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {isBn ? opt.labelBn : opt.labelEn}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setAssessmentSubmitted(true)}
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm uppercase tracking-wider shadow-lg transition-all active:scale-[0.99]"
            >
              {isBn ? 'হেলথ স্ট্যাটাস ও ফাংশনাল রিপোর্ট দেখুন' : 'Generate Functional Health Status Report'}
            </button>
          </div>

          {/* Functional Nutrition Diagnostic Report */}
          {assessmentSubmitted && (
            <div className={`p-6 sm:p-8 rounded-3xl border-2 space-y-6 animate-in slide-in-from-bottom-4 duration-300 ${
              healthZone === 'green'
                ? darkMode ? 'bg-emerald-950/20 border-emerald-500/40' : 'bg-emerald-50/70 border-emerald-300'
                : healthZone === 'yellow'
                ? darkMode ? 'bg-amber-950/20 border-amber-500/40' : 'bg-amber-50/70 border-amber-300'
                : darkMode ? 'bg-rose-950/20 border-rose-500/40' : 'bg-rose-50/70 border-rose-300'
            }`}>
              {/* Score Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-500/20">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">
                    {isBn ? 'ফাংশনাল নিউট্রিশন অ্যাসেসমেন্ট রিপোর্ট' : 'Functional Nutrition Diagnostic Report'} · {rawScore}/{maxRawScore} pts
                  </p>
                  <h4 className={`text-xl sm:text-2xl font-bold ${
                    healthZone === 'green'
                      ? darkMode ? 'text-emerald-400' : 'text-emerald-800'
                      : healthZone === 'yellow'
                      ? darkMode ? 'text-amber-400' : 'text-amber-800'
                      : darkMode ? 'text-rose-400' : 'text-rose-800'
                  }`}>
                    {healthZone === 'green'
                      ? isBn ? '🟢 স্বাভাবিক ও ভালো হেলথ স্ট্যাটাস (Optimal Balance)' : '🟢 Optimal Functional Balance (Low Risk)'
                      : healthZone === 'yellow'
                      ? isBn ? '🟡 মাঝারি ফাংশনাল ইমব্যালেন্স (Moderate Priority)' : '🟡 Moderate Functional Imbalance (Action Needed)'
                      : isBn ? '🔴 উচ্চ ক্লিনিক্যাল ঝুঁকি — থেরাপিউটিক ডায়েট জরুরি (High Priority)' : '🔴 High Clinical Priority — Therapeutic Protocol Recommended'}
                  </h4>
                </div>

                <div className={`px-5 py-3 rounded-2xl text-right ${darkMode ? 'bg-slate-900/90' : 'bg-white shadow-sm'}`}>
                  <div className={`text-3xl font-black ${
                    healthZone === 'green' ? 'text-emerald-500' : healthZone === 'yellow' ? 'text-amber-500' : 'text-rose-500'
                  }`}>
                    {riskPercent}%
                  </div>
                  <div className="text-[11px] font-bold uppercase tracking-wider opacity-60">
                    {isBn ? 'ইমব্যালেন্স ইনডেক্স' : 'Symptom Load'}
                  </div>
                </div>
              </div>

              {/* Root-Cause Analysis */}
              <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200/80'}`}>
                <h5 className={`text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-700'}`}>
                  🧬 {isBn ? 'রুট-কজ বিশ্লেষণ (কেন এই সমস্যা হচ্ছে):' : 'Root-Cause Functional Mechanism:'}
                </h5>
                <p className={`text-xs sm:text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  {isBn ? currentAssessment.rootCauseBn : currentAssessment.rootCauseEn}
                </p>
              </div>

              {/* Green vs Red Foods for this Assessment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900/90 border-emerald-500/30' : 'bg-white border-emerald-200'}`}>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-3">
                    🟢 {isBn ? 'যা খাবেন (থেরাপিউটিক খাবার):' : 'Therapeutic Foods to Include:'}
                  </h5>
                  <ul className="space-y-2 text-xs sm:text-sm">
                    {(isBn ? currentAssessment.eatFoodsBn : currentAssessment.eatFoodsEn).map((food, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-500 font-bold">✓</span>
                        <span className={darkMode ? 'text-slate-200' : 'text-slate-800'}>{food}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900/90 border-rose-500/30' : 'bg-white border-rose-200'}`}>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-3">
                    🔴 {isBn ? 'যা বর্জন করবেন (ট্রিগার খাবার):' : 'Inflammatory Triggers to Avoid:'}
                  </h5>
                  <ul className="space-y-2 text-xs sm:text-sm">
                    {(isBn ? currentAssessment.avoidFoodsBn : currentAssessment.avoidFoodsEn).map((food, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-rose-500 font-bold">✕</span>
                        <span className={darkMode ? 'text-slate-200' : 'text-slate-800'}>{food}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Actionable Protocol */}
              <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80'}`}>
                <h5 className={`text-xs font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                  📋 {isBn ? 'ফাংশনাল লাইফস্টাইল ও সাপ্লিমেন্ট গাইডলাইন:' : 'Recommended Functional Protocol:'}
                </h5>
                <ul className="space-y-2 text-xs sm:text-sm">
                  {(isBn ? currentAssessment.protocolBn : currentAssessment.protocolEn).map((step, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="font-bold text-indigo-500">{i + 1}.</span>
                      <span className={darkMode ? 'text-slate-300' : 'text-slate-700'}>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HealthCalculator;
