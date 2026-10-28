import React, { useState, useEffect } from 'react';
import {
  Baby,
  Sparkles,
  AlertTriangle,
  UtensilsCrossed,
  Clock,
  Heart,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Check,
  Ban,
  Layers,
  CheckCircle2,
  Circle,
  Calendar,
  Activity,
  Scale,
  Ruler,
  Flame,
} from 'lucide-react';
import { AyurvedicMasanumasikaMonth, Language } from '../types';
import { AYURVEDIC_MASANUMASIKA_MONTHS } from '../data/cohortData';

interface Props {
  currentPregnancyMonth?: number;
  lang: Language;
  darkMode?: boolean;
  onSyncPregnancyMonth?: (newMonth: number) => void;
}

interface MonthFetalMeta {
  sizeBn: string;
  sizeEn: string;
  lengthCm: string;
  weightGrams: string;
  keyOrganBn: string;
  keyOrganEn: string;
  keyNutrients: {
    nameBn: string;
    nameEn: string;
    target: string;
    sourceBn: string;
    sourceEn: string;
  }[];
  monthlyCheckpointsBn: string[];
  monthlyCheckpointsEn: string[];
}

const MONTH_FETAL_META: Record<number, MonthFetalMeta> = {
  1: {
    sizeBn: 'পোস্তদানার সমান (Poppy Seed)',
    sizeEn: 'Poppy Seed Size',
    lengthCm: '0.2 – 0.4 cm',
    weightGrams: '< 1 g',
    keyOrganBn: 'নিউরাল টিউব ও প্রাথমিক হৃদস্পন্দন কোষ গঠন',
    keyOrganEn: 'Neural Tube & Primitive Heart Cell Formation',
    keyNutrients: [
      {
        nameBn: 'ন্যাচারাল ফোলেট (Vitamin B9)',
        nameEn: 'Natural Folate (B9)',
        target: '600 mcg/day',
        sourceBn: 'মুগ ডাল, পালং শাক, ডালিম ও বিটরুট',
        sourceEn: 'Moong dal, spinach, pomegranate & beetroot',
      },
      {
        nameBn: 'ভিটামিন B6 ও স্নিগ্ধ কার্ব',
        nameEn: 'Vitamin B6 & Cooling Carbs',
        target: '1.9 mg/day',
        sourceBn: 'জাউ ভাত, পাকা কলা, ভেজানো কাঠবাদাম',
        sourceEn: 'Soft rice congee, ripe banana, soaked almonds',
      },
      {
        nameBn: 'ইলেক্ট্রোলাইট ও ফ্লুইড',
        nameEn: 'Electrolytes & Hydration',
        target: '2.5 L/day',
        sourceBn: 'কচি ডাবের পানি, মৌরি-ধনে ভেজানো জল',
        sourceEn: 'Tender coconut water, fennel-coriander infusion',
      },
    ],
    monthlyCheckpointsBn: [
      'প্রতিদিন ৪০০–৬০০ মাইক্রোগ্রাম ফোলেট সমৃদ্ধ খাবার গ্রহণ নিশ্চিত করা',
      'সকালে বমি ভাব রোধে খালি পেটে মৌরি ভেজানো পানি ও ভেজানো কাঠবাদাম খাওয়া',
      'কাঁচা পেঁপে, আনারস ও যেকোনো ঔষধি হার্বস সম্পূর্ণ বর্জন করা',
      'প্রথম প্রিনাটাল চেকআপ ও রক্তের বেসলাইন পরীক্ষা সম্পন্ন করা',
    ],
    monthlyCheckpointsEn: [
      'Ensure daily folate-rich foods (600 mcg natural folate target)',
      'Take soaked fennel water & peeled almonds on waking to curb nausea',
      'Strictly avoid raw papaya, pineapple, and all medicinal herbs',
      'Complete first prenatal consultation and baseline blood tests',
    ],
  },
  2: {
    sizeBn: 'রসুন কোয়া বা স্ট্রবেরির সমান',
    sizeEn: 'Raspberry / Small Strawberry',
    lengthCm: '1.6 – 2.5 cm',
    weightGrams: '2 – 4 g',
    keyOrganBn: 'মস্তিষ্কের গোলার্ধ, চোখ-কান ও হাত-পায়ের কুঁড়ি গঠন',
    keyOrganEn: 'Brain Hemispheres, Eyes, Ears & Limb Buds',
    keyNutrients: [
      {
        nameBn: 'কোলিন (Choline)',
        nameEn: 'Choline',
        target: '450 mg/day',
        sourceBn: 'সুসিদ্ধ দেশি ডিমের কুসুম, দুধ ও ছানা',
        sourceEn: 'Fully cooked egg yolk, pasteurized milk & chhana',
      },
      {
        nameBn: 'সহজপাচ্য প্রোটিন',
        nameEn: 'Bioavailable Protein',
        target: '60 g/day',
        sourceBn: 'মুগ ডালের ঝোল, দেশি শিং ও মাগুর মাছ',
        sourceEn: 'Moong dal broth, indigenous shing & magur fish',
      },
      {
        nameBn: 'ম্যাগনেসিয়াম ও ক্যালসিয়াম',
        nameEn: 'Magnesium & Calcium',
        target: '1000 mg/day',
        sourceBn: 'সাদা তিল বাটা, দুধ ও মিষ্টি কুমড়ার বীজ',
        sourceEn: 'White sesame paste, milk & pumpkin seeds',
      },
    ],
    monthlyCheckpointsBn: [
      'দীর্ঘ সময় খালি পেটে না থাকা (প্রতি ২.৫–৩ ঘণ্টা পর পর ছোট খাবার)',
      'মধুর রসযুক্ত দুধ, ছানা ও খেজুর দিয়ে পেশী ও ভ্রূণের টিস্যু পুষ্ট করা',
      'ভ্রূণের হৃদস্পন্দন (Fetal Cardiac Activity) আল্ট্রাসাউন্ডে নিশ্চিত করা',
      'অতিরিক্ত ঝাল ও ভাজাপোড়া খাবার এড়িয়ে অম্ল-পিত্ত নিয়ন্ত্রণে রাখা',
    ],
    monthlyCheckpointsEn: [
      'Avoid fasting gaps; eat small nourishing meals every 2.5–3 hours',
      'Include sweet Madhura dairy, chhana, and dates for tissue stability',
      'Confirm fetal cardiac heartbeat via early viability ultrasound',
      'Keep Pitta acidity calm by avoiding deep-fried and spicy foods',
    ],
  },
  3: {
    sizeBn: 'পাতিলেবু বা পাকা বরইয়ের সমান',
    sizeEn: 'Lime / Plum Size',
    lengthCm: '5.5 – 7.5 cm',
    weightGrams: '18 – 28 g',
    keyOrganBn: 'হাড়ের তরুণাস্থি, আঙুলের ছাপ ও সংবেদনশীল অঙ্গের বিকাশ',
    keyOrganEn: 'Cartilage Skeleton, Fingerprints & Sensory Organs',
    keyNutrients: [
      {
        nameBn: 'ওমেগা-৩ (DHA) ও হেলদি ফ্যাট',
        nameEn: 'Omega-3 DHA & Healthy Fats',
        target: '300 mg DHA',
        sourceBn: 'ভেজানো আখরোট, খাঁটি গাওয়া ঘি ও দেশি মাছ',
        sourceEn: 'Soaked walnuts, pure A2 ghee & river fish',
      },
      {
        nameBn: 'ক্যালসিয়াম ও ফসফরাস',
        nameEn: 'Calcium & Phosphorus',
        target: '1000 mg/day',
        sourceBn: 'দুধের ক্ষীর, রাগি/লাল চালের জাউ, দই',
        sourceEn: 'Milk porridge, red rice/ragi, fresh yogurt',
      },
      {
        nameBn: 'প্রাকৃতিক অ্যান্টিঅক্সিডেন্ট',
        nameEn: 'Natural Antioxidants',
        target: '75 mg Vit C',
        sourceBn: 'পাকা পেয়ারা, কমলালেবু ও বেদানা',
        sourceEn: 'Ripe guava, sweet orange & pomegranate',
      },
    ],
    monthlyCheckpointsBn: [
      '১ম ট্রাইমেস্টারের শেষ ধাপে দুধ-মধু-ঘি মিশ্রিত স্নিগ্ধ ষষ্টিক শালি ভাত/জাউ গ্রহণ',
      'স্নায়ুতন্ত্রের বিকাশে প্রতিদিন ২টি ভেজানো আখরোট ও ৪টি কাঠবাদাম খাওয়া',
      'NT Scan ও ১ম ট্রাইমেস্টার স্ক্রিনিং রিপোর্ট চিকিৎসকের সাথে পর্যালোচনা',
      'দিনের বেলা পর্যাপ্ত বিশ্রাম ও রাত ১০টার মধ্যে ঘুমের অভ্যাস করা',
    ],
    monthlyCheckpointsEn: [
      'Nourish sensory development with warm rice-milk-ghee preparations',
      'Consume 2 soaked walnuts & 4 peeled almonds daily for neural growth',
      'Review First Trimester NT Scan screening with your obstetrician',
      'Maintain restful sleep schedule before 10:30 PM',
    ],
  },
  4: {
    sizeBn: 'মাঝারি অ্যাভোকাডো বা নাশপাতির সমান',
    sizeEn: 'Avocado / Pear Size',
    lengthCm: '11 – 13 cm',
    weightGrams: '100 – 140 g',
    keyOrganBn: 'হৃদপিণ্ডের ৪টি প্রকোষ্ঠ, কিডনির কার্যকারিতা ও পেশী টিস্যু গঠন',
    keyOrganEn: 'Four Heart Chambers, Active Kidneys & Muscle Tissue',
    keyNutrients: [
      {
        nameBn: 'প্রোটিন ও অ্যামিনো অ্যাসিড',
        nameEn: 'High-Quality Protein',
        target: '70 g/day',
        sourceBn: 'ঘরে পাতা টক-মিষ্টি দই, ছানা, দেশি মাছ ও মুরগির স্টু',
        sourceEn: 'Homemade curd, chhana, river fish & chicken stew',
      },
      {
        nameBn: 'হিম ও নন-হিম আয়রন',
        nameEn: 'Heme & Non-Heme Iron',
        target: '27 mg/day',
        sourceBn: 'শিং মাছ, ডালিম, কচু শাক (লেবুর রসসহ), খেজুর',
        sourceEn: 'Shing fish, pomegranate, taro greens with lemon, dates',
      },
      {
        nameBn: 'প্রোবায়োটিক ও গাট এনজাইম',
        nameEn: 'Probiotics & Gut Support',
        target: '1 bowl/day',
        sourceBn: 'দুপুরের খাবারে ঘরে পাতা তাজা দই বা ঘোল',
        sourceEn: 'Fresh homemade yogurt or spiced buttermilk at lunch',
      },
    ],
    monthlyCheckpointsBn: [
      '৪র্থ মাসের আয়ুর্বেদিক প্রোটোকল অনুযায়ী দুপুরে ঘরে পাতা তাজা দই ও ভাত গ্রহণ',
      'রক্তস্বল্পতা রোধে আয়রন সমৃদ্ধ খাবারের সাথে ভিটামিন-সি (পাতিলেবুর রস) যোগ করা',
      'হালকা হাঁটাহাঁটি ও গভীর শ্বাস-প্রশ্বাসের ব্যায়াম (প্রাণায়াম) শুরু করা',
      'হিমোগ্লোবিন ও ব্লাড প্রেসার নিয়মিত মনিটর করা',
    ],
    monthlyCheckpointsEn: [
      'Include fresh homemade curd with lunch per Month 4 Masanumasika rules',
      'Pair iron-rich foods with fresh lemon juice to maximize absorption',
      'Practice gentle prenatal walking and deep breathing exercises',
      'Monitor Hemoglobin and blood pressure levels regularly',
    ],
  },
  5: {
    sizeBn: 'পাকা কলা বা মাঝারি পেঁপের সমান',
    sizeEn: 'Banan / Medium Cantaloupe',
    lengthCm: '16 – 25 cm',
    weightGrams: '300 – 350 g',
    keyOrganBn: 'শিশুর প্রথম নড়াচড়া (Quickening), অস্থিমজ্জা ও চেতনার উন্মেষ',
    keyOrganEn: 'First Fetal Kicks (Quickening), Bone Marrow & Mind',
    keyNutrients: [
      {
        nameBn: 'ক্যালসিয়াম ও ভিটামিন D3',
        nameEn: 'Calcium & Vitamin D3',
        target: '1200 mg/day',
        sourceBn: 'দুধ, ছানা, খাঁটি গাওয়া ঘি, ছোট মাছ ও সকালের রোদ',
        sourceEn: 'Milk, paneer/chhana, pure ghee, small fish & sunlight',
      },
      {
        nameBn: 'মস্তিষ্কের লিপিড ও DHA',
        nameEn: 'Brain Lipids & DHA',
        target: '350 mg DHA',
        sourceBn: 'ডিমের কুসুম, আখরোট, কুমড়ার বীজ ও দেশি ঘি',
        sourceEn: 'Egg yolk, walnuts, pumpkin seeds & pure ghee',
      },
      {
        nameBn: 'রক্তবর্ধক আয়রন ও ফোলেট',
        nameEn: 'Blood-Building Iron',
        target: '27–30 mg/day',
        sourceBn: 'বিটরুট-গাজর স্যুপ, ডালিম ও সবুজ শাকসবজি',
        sourceEn: 'Beetroot-carrot soup, pomegranate & leafy greens',
      },
    ],
    monthlyCheckpointsBn: [
      'গর্ভস্থ শিশুর প্রথম মৃদু নড়াচড়া (Quickening) খেয়াল করা ও ডায়েরিতে নোট রাখা',
      '৫ম মাসের মেধা ও রক্ত গঠনে দুধ, ছানা ও ১ চামচ খাঁটি গাওয়া ঘি নিয়মিত খাওয়া',
      '২০ সপ্তাহের Anomaly Scan (টিউমার/অঙ্গ গঠন পরীক্ষা) সম্পন্ন করা',
      'প্রতিদিন সকাল ৮–৯টার মিষ্টি রোদে ১৫–২০ মিনিট থাকা (ভিটামিন D3)',
    ],
    monthlyCheckpointsEn: [
      'Notice and log baby’s first gentle flutters/movements (Quickening)',
      'Consume pure milk, chhana, and 1 tsp A2 ghee daily for mind & marrow',
      'Complete the 20-week fetal Anomaly Scan with your specialist',
      'Get 15–20 minutes of morning sunlight daily for Vitamin D synthesis',
    ],
  },
  6: {
    sizeBn: 'ভুট্টার মোচা বা বড় আমের সমান',
    sizeEn: 'Ear of Corn / Large Mango',
    lengthCm: '28 – 30 cm',
    weightGrams: '600 – 700 g',
    keyOrganBn: 'ফুসফুসের বায়ুথলি, শ্রবণশক্তি (শব্দ শোনা) ও ত্বকের রঙ গঠন',
    keyOrganEn: 'Lung Sacs, Active Hearing & Skin Pigmentation',
    keyNutrients: [
      {
        nameBn: 'পটাশিয়াম ও প্রাকৃতিক ডাইইউরেটিক',
        nameEn: 'Potassium & Fluid Balance',
        target: '2900 mg/day',
        sourceBn: 'লাউ, চালকুমড়া, ডাবের পানি ও ধনে ভেজানো জল',
        sourceEn: 'Bottle gourd, ash gourd, coconut water & coriander water',
      },
      {
        nameBn: 'স্নায়ু ও বুদ্ধির ওমেগা ফ্যাট',
        nameEn: 'Neuro-Development Fats',
        target: '65 g Fat/day',
        sourceBn: 'খাঁটি ঘি, কাঠবাদাম বাটা, দেশি মাছের ঝোল',
        sourceEn: 'Pure ghee, almond paste, indigenous fish broth',
      },
      {
        nameBn: 'অ্যান্টি-এডিমা প্রোটিন',
        nameEn: 'Albumin-Supporting Protein',
        target: '75 g/day',
        sourceBn: 'মুগ ডাল, ডিমের সাদা ও কুসুম, মুরগির স্যুপ',
        sourceEn: 'Moong dal, whole egg, light chicken soup',
      },
    ],
    monthlyCheckpointsBn: [
      'পায়ে বা মুখে পানি আসা (Edema) রোধে পাতে কাঁচা লবণ ও প্যাকেটজাত খাবার বর্জন',
      'শিশু এখন মায়ের কণ্ঠস্বর শুনতে পায়—শান্ত সংগীত বা ইতিবাচক কথা বলা',
      '২৪–২৮ সপ্তাহের মধ্যে গর্ভকালীন ডায়াবেটিস (OGTT) পরীক্ষা সম্পন্ন করা',
      '৬ষ্ঠ মাসের ওজঃ ও বুদ্ধির বিকাশে ঘি-দুধ ও লাউ-ঝিঙের হালকা তরকারি গ্রহণ',
    ],
    monthlyCheckpointsEn: [
      'Prevent ankle swelling (edema) by avoiding raw table salt & packaged snacks',
      'Baby responds to sounds—speak softly and maintain a calm environment',
      'Complete Gestational Diabetes screening (OGTT) between weeks 24–28',
      'Support intellect (Buddhi) with pure ghee, milk, and hydrating gourds',
    ],
  },
  7: {
    sizeBn: 'বড় ফুলকপি বা আনারসের সমান',
    sizeEn: 'Large Cauliflower / Pineapple',
    lengthCm: '36 – 38 cm',
    weightGrams: '1.0 – 1.3 kg',
    keyOrganBn: 'মস্তিষ্কের দ্রুত ভাঁজ (Cerebral Cortex) ও ত্বকের নিচে ফ্যাট জমা',
    keyOrganEn: 'Rapid Brain Folding & Subcutaneous Fat Deposition',
    keyNutrients: [
      {
        nameBn: 'উচ্চ ঘনত্বের প্রোটিন ও ক্যালসিয়াম',
        nameEn: 'Dense Protein & Calcium',
        target: '80 g Protein',
        sourceBn: 'মাছ, ছানা, তিল-বাদামের লাড্ডু ও সজনে পাতা',
        sourceEn: 'Fish, paneer/chhana, sesame-nut balls & moringa leaves',
      },
      {
        nameBn: 'ভিটামিন E ও এসেনশিয়াল ফ্যাট',
        nameEn: 'Vitamin E & Essential Lipids',
        target: '15 mg/day',
        sourceBn: 'সূর্যমুখী ও কুমড়ার বীজ, কাঠবাদাম ও ঘি',
        sourceEn: 'Sunflower & pumpkin seeds, almonds & ghee',
      },
      {
        nameBn: 'লো-সোডিয়াম ফাইবার কার্ব',
        nameEn: 'Low-Sodium Complex Carbs',
        target: '175 g/day',
        sourceBn: 'লাল চালের ভাত, ওটস-সবজি পরিজ, পেঁপে তরকারি (পাকা)',
        sourceEn: 'Red parboiled rice, vegetable oats, ripe papaya fruit',
      },
    ],
    monthlyCheckpointsBn: [
      '৩য় ট্রাইমেস্টার শুরু: বুকজ্বালা এড়াতে রাতের খাবার ঘুমানোর ২.৫ ঘণ্টা আগে খাওয়া',
      'পেটের চামড়ায় টান ও চুলকানি রোধে নারকেল তেল/অলিভ অয়েল ম্যাসাজ ও হাইড্রেশন',
      'প্রতিদিন খাবার পর শিশুর কিক কাউন্ট (২ ঘণ্টায় অন্তত ১০ বার নড়াচড়া) খেয়াল করা',
      'অতিরিক্ত লবণ, আচার ও চিনি বর্জন করে রক্তচাপ স্বাভাবিক রাখা',
    ],
    monthlyCheckpointsEn: [
      'Start of 3rd Trimester: Eat dinner 2.5 hours before bed to prevent reflux',
      'Keep skin hydrated and apply gentle coconut/almond oil externally',
      'Track daily fetal kick counts (at least 10 movements within 2 hours)',
      'Keep blood pressure optimal by avoiding pickles, excess salt, and sugar',
    ],
  },
  8: {
    sizeBn: 'মিষ্টি কুমড়া বা মাঝারি তরমুজের সমান',
    sizeEn: 'Butternut Squash / Honeydew Melon',
    lengthCm: '42 – 45 cm',
    weightGrams: '1.8 – 2.3 kg',
    keyOrganBn: 'অঙ্গপ্রত্যঙ্গের চূড়ান্ত পরিপক্বতা ও মা-শিশুর ওজঃ (Ojas) বিনিময়',
    keyOrganEn: 'Final Organ Maturation & Maternal-Fetal Ojas Transfer',
    keyNutrients: [
      {
        nameBn: 'ওজঃ বর্ধক স্নিগ্ধ কার্ব ও ঘি',
        nameEn: 'Ojas-Building Unctuous Diet',
        target: '2200 kcal/day',
        sourceBn: 'দুধ-ঘি দিয়ে তৈরি নরম ক্ষীর/জাউ, খেজুর ও মাখানা',
        sourceEn: 'Warm milk-ghee rice yavagu, soft dates & roasted makhana',
      },
      {
        nameBn: 'বাত-অনুলোমন ফাইবার',
        nameEn: 'Vata-Pacifying Gentle Fiber',
        target: '28 g Fiber',
        sourceBn: 'পাকা বেল/পেঁপে, ভেজানো কিশমিশ ও লাউ-পালং ঝোল',
        sourceEn: 'Ripe papaya, soaked black raisins & bottle gourd spinach soup',
      },
      {
        nameBn: 'আয়রন ও ভিটামিন K',
        nameEn: 'Iron & Vitamin K Reserves',
        target: '30 mg Iron',
        sourceBn: 'ডালিম, মোচা/থোড়, সবুজ শাক ও দেশি মাছ',
        sourceEn: 'Pomegranate, banana blossom, leafy greens & river fish',
      },
    ],
    monthlyCheckpointsBn: [
      '৮ম মাসে ওজঃ স্থির রাখতে অতিরিক্ত ভ্রমণ, মানসিক চাপ ও রাত জাগা সম্পূর্ণ এড়িয়ে চলা',
      'কোষ্ঠকাঠিন্য (Apana Vata বাধা) রোধে প্রতিদিন রাতে দুধে ভেজানো কিশমিশ/খেজুর খাওয়া',
      'বাম কাত হয়ে ঘুমানো (Left Lateral Position) যাতে প্লাসেন্টায় রক্তপ্রবাহ সর্বোচ্চ থাকে',
      'প্রসবকালীন হাসপাতালের ব্যাগ ও জরুরি নম্বর প্রস্তুত রাখা',
    ],
    monthlyCheckpointsEn: [
      'Stabilize Ojas in Month 8 by avoiding travel, heavy exertion, and late nights',
      'Prevent constipation with warm milk and soaked black raisins/dates',
      'Sleep on your left side to maximize placental blood flow to the baby',
      'Prepare your hospital maternity bag and emergency contacts',
    ],
  },
  9: {
    sizeBn: 'পূর্ণাঙ্গ তরমুজ বা পাকা কাঁঠালের কোষের মতো পুষ্ট',
    sizeEn: 'Full-Term Watermelon Size',
    lengthCm: '48 – 52 cm',
    weightGrams: '2.8 – 3.4 kg',
    keyOrganBn: 'ফুসফুসের সম্পূর্ণ পরিপক্বতা, মাথা নিচের দিকে আসা ও প্রসব প্রস্তুতি',
    keyOrganEn: 'Full Lung Maturity, Head Engagement & Labor Readiness',
    keyNutrients: [
      {
        nameBn: 'প্রসব শক্তিদায়ক খেজুর ও কার্ব',
        nameEn: 'Labor-Prepping Dates & Energy',
        target: '4–6 Dates/day',
        sourceBn: 'নরম খেজুর (ডায়াবেটিস না থাকলে), লাল চালের জাউ ও ঘি',
        sourceEn: 'Soft dates (if normoglycemic), red rice yavagu & pure ghee',
      },
      {
        nameBn: 'পেলভিক ও জরায়ু স্নিগ্ধকারী ফ্যাট',
        nameEn: 'Pelvic Lubricating Healthy Fats',
        target: '2 tsp Ghee/day',
        sourceBn: 'খাঁটি গাওয়া ঘি, তিল ও কাঠবাদাম বাটা, উষ্ণ দুধ',
        sourceEn: 'Pure A2 cow ghee, sesame-almond paste, warm milk',
      },
      {
        nameBn: 'স্তন্যদুগ্ধ প্রস্তুতির পুষ্টি',
        nameEn: 'Lactation Priming Nutrients',
        target: '80 g Protein',
        sourceBn: 'রসুন-জিরা ফোড়নে মুগ ডাল, লাউ, সজনে পাতা ও মাছের ঝোল',
        sourceEn: 'Garlic-cumin tempered moong dal, bottle gourd, moringa & fish broth',
      },
    ],
    monthlyCheckpointsBn: [
      'সহজ প্রসব ও জরায়ু পথের স্নিগ্ধতার জন্য প্রতিদিন খাবারে খাঁটি গাওয়া ঘি ও পাতলা জাউ রাখা',
      'ডায়াবেটিস না থাকলে জরায়ুমুখ নরম করতে প্রতিদিন ৪–৬টি নরম খেজুর খাওয়া',
      'পেলভিক ফ্লোর রিল্যাক্সেশন ও গভীর শ্বাস-প্রশ্বাসের অনুশীলন করা',
      'শিশুর নড়াচড়া ও প্রসব বেদনার লক্ষণ সম্পর্কে সচেতন থাকা',
    ],
    monthlyCheckpointsEn: [
      'Include warm rice yavagu with pure A2 ghee daily for pelvic lubrication',
      'Eat 4–6 soft dates daily (if blood sugar is normal) to support cervical ripening',
      'Practice pelvic relaxation and slow birth-breathing techniques',
      'Monitor fetal movements closely and stay ready for labor signs',
    ],
  },
};

export const PregnancyMilestonesDashboard: React.FC<Props> = ({
  currentPregnancyMonth = 1,
  lang,
  darkMode,
  onSyncPregnancyMonth,
}) => {
  const isBn = lang === 'bn';
  const normalizedUserMonth =
    currentPregnancyMonth >= 1 && currentPregnancyMonth <= 9 ? currentPregnancyMonth : 1;

  const [selectedMonth, setSelectedMonth] = useState<number>(normalizedUserMonth);
  const [activeViewTab, setActiveViewTab] = useState<'overview' | 'nutrition' | 'meals'>('overview');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('ayur_pregnancy_milestones_checks');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    setSelectedMonth(normalizedUserMonth);
  }, [normalizedUserMonth]);

  const currentData: AyurvedicMasanumasikaMonth =
    AYURVEDIC_MASANUMASIKA_MONTHS[selectedMonth] || AYURVEDIC_MASANUMASIKA_MONTHS[1];
  const currentMeta: MonthFetalMeta =
    MONTH_FETAL_META[selectedMonth] || MONTH_FETAL_META[1];

  const handleMonthClick = (m: number) => {
    setSelectedMonth(m);
  };

  const handleSyncToProfile = () => {
    if (onSyncPregnancyMonth) {
      onSyncPregnancyMonth(selectedMonth);
    }
  };

  const toggleCheckpoint = (month: number, idx: number) => {
    const key = `m${month}_c${idx}`;
    const updated = { ...checkedItems, [key]: !checkedItems[key] };
    setCheckedItems(updated);
    try {
      localStorage.setItem('ayur_pregnancy_milestones_checks', JSON.stringify(updated));
    } catch {
      // ignore storage quota errors
    }
  };

  const checkpointsList = isBn ? currentMeta.monthlyCheckpointsBn : currentMeta.monthlyCheckpointsEn;
  const completedCount = checkpointsList.filter((_, idx) => checkedItems[`m${selectedMonth}_c${idx}`]).length;
  const progressPct = Math.round((completedCount / checkpointsList.length) * 100);
  const overallPregnancyPct = Math.round((normalizedUserMonth / 9) * 100);

  return (
    <div className="space-y-6">
      {/* Top Synchronized Pregnancy Stage Header & 9-Month Masanumasika Timeline */}
      <div
        className={`p-5 md:p-7 rounded-3xl border shadow-lg relative overflow-hidden ${
          darkMode
            ? 'bg-gradient-to-br from-slate-900 via-pink-950/30 to-rose-950/30 border-pink-800/40'
            : 'bg-gradient-to-br from-pink-50/90 via-white to-rose-50/70 border-pink-200'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-pink-200/60 dark:border-pink-900/40">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-pink-600 dark:text-pink-400">
              <Baby className="w-4 h-4" />
              <span>
                {isBn
                  ? 'প্রেগন্যান্সি মাইলস্টোনস ড্যাশবোর্ড • আয়ুর্বেদিক মাসানুক্রমিক (১–৯ মাস)'
                  : 'Pregnancy Milestones Dashboard • Ayurvedic Masanumasika (Months 1–9)'}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {isBn
                  ? `আপনার বর্তমান স্টেজ: ${normalizedUserMonth}ম মাস (${overallPregnancyPct}% সম্পূর্ণ)`
                  : `Your Current Stage: Month ${normalizedUserMonth} (${overallPregnancyPct}% Journey)`}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {isBn
                ? 'মাসানুক্রমিক গর্ভস্থ শিশুর বিকাশ ও পুষ্টি গাইড'
                : 'Month-by-Month Fetal Growth & Masanumasika Nutrition'}
            </h2>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
              {isBn
                ? 'প্রাচীন আয়ুর্বেদিক গর্ভিণী পরিচর্যা এবং আধুনিক ফাংশনাল নিউট্রিশনের সমন্বয়ে প্রতি মাসে শিশুর যে অঙ্গের বিকাশ ঘটে, সেই অনুযায়ী শতভাগ নিরাপদ ঘরোয়া খাবার (কোনো হার্বস ছাড়া)।'
                : 'Synchronized with your pregnancy stage: combines classical Ayurvedic Masanumasika care and modern functional nutrition using 100% kitchen foods (Strictly Zero Herbs).'}
            </p>
          </div>

          {/* Sync Current Stage Button if browsing another month */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {selectedMonth !== normalizedUserMonth ? (
              <button
                type="button"
                onClick={handleSyncToProfile}
                className="px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span>
                  {isBn
                    ? `${selectedMonth}ম মাসকে আমার বর্তমান মাস হিসেবে সিঙ্ক করুন`
                    : `Sync Month ${selectedMonth} as My Current Stage`}
                </span>
              </button>
            ) : (
              <div className="px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isBn
                    ? `আপনার বর্তমান গর্ভকাল (${normalizedUserMonth}ম মাস) সিঙ্ক করা আছে`
                    : `Synced with Your Active Stage (Month ${normalizedUserMonth})`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 9-Month Interactive Selector Grid */}
        <div className="pt-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2.5">
            <span>
              {isBn
                ? 'যেকোনো মাসে ক্লিক করে সেই মাসের মাইলস্টোন ও ডায়েট ফোকাস দেখুন:'
                : 'Select any month (1–9) to inspect fetal milestones & nutritional focus:'}
            </span>
            <span className="font-semibold text-pink-600 dark:text-pink-400">
              {isBn ? `নির্বাচিত: ${selectedMonth}ম মাস` : `Viewing: Month ${selectedMonth}`}
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((m) => {
              const isSelected = selectedMonth === m;
              const isUserCurrent = normalizedUserMonth === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleMonthClick(m)}
                  className={`relative py-2.5 px-2 rounded-2xl text-xs font-bold border transition-all text-center flex flex-col items-center justify-center ${
                    isSelected
                      ? 'bg-gradient-to-r from-pink-600 via-rose-600 to-amber-600 text-white border-pink-600 shadow-md scale-[1.03]'
                      : isUserCurrent
                      ? darkMode
                        ? 'bg-pink-950/60 border-pink-500 text-pink-300'
                        : 'bg-pink-100/80 border-pink-400 text-pink-900'
                      : darkMode
                      ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-pink-50/70 hover:border-pink-300'
                  }`}
                >
                  {isUserCurrent && (
                    <span
                      className={`text-[9px] font-extrabold uppercase tracking-wider mb-0.5 ${
                        isSelected ? 'text-amber-200' : 'text-pink-600 dark:text-pink-400'
                      }`}
                    >
                      {isBn ? '★ বর্তমান' : '★ Current'}
                    </span>
                  )}
                  <span className="text-xs sm:text-sm font-black">
                    {isBn ? `${m}ম মাস` : `Month ${m}`}
                  </span>
                  <span className="text-[10px] font-normal opacity-80 mt-0.5">
                    {m <= 3
                      ? isBn
                        ? '১ম ট্রাইম'
                        : '1st Tri'
                      : m <= 6
                      ? isBn
                        ? '২য় ট্রাইম'
                        : '2nd Tri'
                      : isBn
                      ? '৩য় ট্রাইম'
                      : '3rd Tri'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Active Month Milestone & Nutritional Dashboard Card */}
      <div
        className={`rounded-3xl border shadow-xl overflow-hidden ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        {/* Month Banner Header */}
        <div className="p-6 bg-gradient-to-r from-pink-600 via-rose-600 to-amber-600 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-pink-100">
                <span>
                  {isBn
                    ? `ট্রাইমেস্টার ${currentData.trimester}`
                    : `Trimester ${currentData.trimester}`}
                </span>
                <span aria-hidden="true">·</span>
                <span>{currentData.dhatuFocus}</span>
                {selectedMonth === normalizedUserMonth && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="underline decoration-amber-300">
                      {isBn ? 'আপনার সক্রিয় গর্ভকাল' : 'Your Active Pregnancy Stage'}
                    </span>
                  </>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                {isBn ? currentData.monthNameBn : currentData.monthNameEn}
              </h3>
            </div>

            {/* Prev / Next Month & Section Switcher */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center p-1 rounded-xl bg-black/20 backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setActiveViewTab('overview')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    activeViewTab === 'overview'
                      ? 'bg-white text-rose-700 shadow-xs'
                      : 'text-white/90 hover:text-white'
                  }`}
                >
                  {isBn ? 'শিশুর বিকাশ ও চেকলিস্ট' : 'Milestones & Growth'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveViewTab('nutrition')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    activeViewTab === 'nutrition'
                      ? 'bg-white text-rose-700 shadow-xs'
                      : 'text-white/90 hover:text-white'
                  }`}
                >
                  {isBn ? 'পুষ্টি ও পথ্য ফোকাস' : 'Nutritional Focus'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveViewTab('meals')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    activeViewTab === 'meals'
                      ? 'bg-white text-rose-700 shadow-xs'
                      : 'text-white/90 hover:text-white'
                  }`}
                >
                  {isBn ? '৭-বেলার মিল রুটিন' : '7-Meal Schedule'}
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={selectedMonth <= 1}
                  onClick={() => handleMonthClick(selectedMonth - 1)}
                  className="p-2 rounded-xl bg-white/20 hover:bg-white/30 disabled:opacity-40 transition-all"
                  aria-label="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={selectedMonth >= 9}
                  onClick={() => handleMonthClick(selectedMonth + 1)}
                  className="p-2 rounded-xl bg-white/20 hover:bg-white/30 disabled:opacity-40 transition-all"
                  aria-label="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Fetal Biometrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-white/20">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xs rounded-2xl p-3">
              <Sparkles className="w-5 h-5 text-amber-200 shrink-0" />
              <div>
                <div className="text-[11px] opacity-80">
                  {isBn ? 'ভ্রূণের তুলনামূলক আকার' : 'Estimated Fetal Size'}
                </div>
                <div className="text-xs sm:text-sm font-extrabold">
                  {isBn ? currentMeta.sizeBn : currentMeta.sizeEn}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xs rounded-2xl p-3">
              <Ruler className="w-5 h-5 text-amber-200 shrink-0" />
              <div>
                <div className="text-[11px] opacity-80">
                  {isBn ? 'আনুমানিক দৈর্ঘ্য ও ওজন' : 'Length & Weight'}
                </div>
                <div className="text-xs sm:text-sm font-extrabold tabular-nums">
                  {currentMeta.lengthCm} · {currentMeta.weightGrams}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xs rounded-2xl p-3">
              <Activity className="w-5 h-5 text-amber-200 shrink-0" />
              <div>
                <div className="text-[11px] opacity-80">
                  {isBn ? 'প্রধান অঙ্গের বিকাশ' : 'Primary Organ Milestone'}
                </div>
                <div className="text-xs sm:text-sm font-extrabold">
                  {isBn ? currentMeta.keyOrganBn : currentMeta.keyOrganEn}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6">
          {/* Mandatory Zero Herbs Safety Reminder */}
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200">
                {isBn
                  ? 'কঠোর চিকিৎসা সতর্কতা: কোনো ঔষধি হার্বস গ্রহণ করবেন না (Strict Zero Herbs Rule)'
                  : 'Clinical Safety Rule: Strictly No Medicinal Herbs in Pregnancy'}
              </h4>
              <p className="mt-1 text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
                {isBn ? currentData.zeroHerbsReminderBn : currentData.zeroHerbsReminderEn}
              </p>
            </div>
          </div>

          {activeViewTab === 'overview' && (
            <div className="space-y-6">
              {/* Fetal Development & Ayurvedic Masanumasika 2-Column */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className={`p-5 rounded-2xl border ${
                    darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-pink-50/60 border-pink-200/80'
                  }`}
                >
                  <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400 font-bold text-xs mb-2">
                    <Baby className="w-4 h-4" />
                    <span>
                      {isBn
                        ? `${selectedMonth}ম মাসে গর্ভস্থ শিশুর শারীরিক ও মস্তিষ্কের বিকাশ:`
                        : `Month ${selectedMonth} Fetal Physiological Development:`}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                    {isBn ? currentData.fetusDevBn : currentData.fetusDevEn}
                  </p>
                </div>

                <div
                  className={`p-5 rounded-2xl border ${
                    darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-amber-50/60 border-amber-200/80'
                  }`}
                >
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs mb-2">
                    <Layers className="w-4 h-4" />
                    <span>
                      {isBn
                        ? 'আয়ুর্বেদিক মাসানুক্রমিক ধাতুপুষ্টি ও শারীরবৃত্তীয় লক্ষ্য:'
                        : 'Ayurvedic Masanumasika Dhatu & Physiological Focus:'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                    {isBn ? currentData.ayurvedicFocusBn : currentData.ayurvedicFocusEn}
                  </p>
                </div>
              </div>

              {/* Nutrient Focus Cards for Current Month */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Flame className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      {isBn
                        ? `${selectedMonth}ম মাসের প্রধান ৩টি নিউট্রিশনাল ফোকাস এরিয়া`
                        : `Month ${selectedMonth} Top 3 Nutritional Focus Areas`}
                    </span>
                  </h4>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {isBn ? 'ফাংশনাল নিউট্রিশন টার্গেট' : 'Functional Nutrition Targets'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {currentMeta.keyNutrients.map((nut, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-2xl border ${
                        darkMode
                          ? 'bg-slate-800/50 border-slate-700'
                          : 'bg-emerald-50/40 border-emerald-200/80'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                          {isBn ? nut.nameBn : nut.nameEn}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 tabular-nums">
                          {nut.target}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        <strong className="text-slate-800 dark:text-slate-100">
                          {isBn ? 'খাদ্য উৎস: ' : 'Kitchen Sources: '}
                        </strong>
                        {isBn ? nut.sourceBn : nut.sourceEn}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Monthly Milestone & Care Checklist */}
              <div
                className={`p-5 rounded-2xl border ${
                  darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {isBn
                        ? `${selectedMonth}ম মাসের মাতৃত্ব ও মাইলস্টোন চেকলিস্ট`
                        : `Month ${selectedMonth} Maternal & Fetal Milestone Checklist`}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {isBn
                        ? 'আপনার মাসিক অগ্রগতি ট্র্যাক করতে নিচের পয়েন্টগুলোতে টিক দিন'
                        : 'Check off completed monthly nutritional and prenatal care milestones'}
                    </p>
                  </div>
                  <div className="text-xs font-bold text-pink-600 dark:text-pink-400 tabular-nums">
                    {completedCount}/{checkpointsList.length} ({progressPct}%)
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {checkpointsList.map((item, idx) => {
                    const isChecked = Boolean(checkedItems[`m${selectedMonth}_c${idx}`]);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleCheckpoint(selectedMonth, idx)}
                        className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                          isChecked
                            ? darkMode
                              ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200'
                              : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                            : darkMode
                            ? 'bg-slate-900/70 border-slate-700 text-slate-300 hover:border-pink-500/50'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-pink-300'
                        }`}
                      >
                        {isChecked ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        )}
                        <span className="text-xs font-medium leading-relaxed">{item}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeViewTab === 'nutrition' && (
            <div className="space-y-5">
              {/* Functional Nutrition Targets */}
              <div
                className={`p-5 rounded-2xl border ${
                  darkMode ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-emerald-50/70 border-emerald-200'
                }`}
              >
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs mb-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {isBn
                      ? 'ফাংশনাল নিউট্রিশন ও বায়োমেডিকেল টার্গেট:'
                      : 'Functional Nutrition & Biomedical Targets:'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                  {isBn ? currentData.functionalNutritionBn : currentData.functionalNutritionEn}
                </p>
              </div>

              {/* Recommended Kitchen Foods vs Prohibited Foods */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className={`p-5 rounded-2xl border ${
                    darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs mb-3">
                    <Check className="w-4 h-4" />
                    <span>
                      {isBn
                        ? `${selectedMonth}ম মাসের প্রধান পথ্য ও পুষ্টিকর ঘরোয়া খাবার:`
                        : `Key Kitchen Dietary Staples (Month ${selectedMonth}):`}
                    </span>
                  </div>
                  <ul className="space-y-2.5">
                    {(isBn ? currentData.keyKitchenFoodsBn : currentData.keyKitchenFoodsEn).map(
                      (food, i) => (
                        <li
                          key={i}
                          className="text-xs text-slate-700 dark:text-slate-200 flex items-start gap-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                          <span className="leading-relaxed">{food}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>

                <div
                  className={`p-5 rounded-2xl border ${
                    darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs mb-3">
                    <Ban className="w-4 h-4" />
                    <span>
                      {isBn
                        ? 'গর্ভকালীন বর্জনীয় ও ঝুঁকিপূর্ণ খাবারসমূহ:'
                        : 'Strictly Prohibited & Contraindicated Foods:'}
                    </span>
                  </div>
                  <ul className="space-y-2.5">
                    {(isBn ? currentData.prohibitedFoodsBn : currentData.prohibitedFoodsEn).map(
                      (food, i) => (
                        <li
                          key={i}
                          className="text-xs text-slate-700 dark:text-slate-200 flex items-start gap-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                          <span className="leading-relaxed font-medium">{food}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeViewTab === 'meals' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {isBn
                      ? `${selectedMonth}ম মাসের আদর্শ দৈনিক খাদ্য তালিকা ও সময়সূচি (৭টি মিল স্লট)`
                      : `Month ${selectedMonth} Tailored 7-Meal Daily Schedule`}
                  </h4>
                </div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {isBn ? 'ছোট ছোট ঘন ঘন আহার' : 'Small, frequent feeds'}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {currentData.sampleDayMenu.map((m, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      darkMode
                        ? 'bg-slate-800/40 border-slate-700/80'
                        : 'bg-slate-50/70 border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="px-2.5 py-1 rounded-xl bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 font-bold text-xs shrink-0 flex items-center gap-1 tabular-nums">
                        <Clock className="w-3 h-3" />
                        <span>{m.time}</span>
                      </div>

                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {isBn ? m.mealNameBn : m.mealNameEn}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                          <span className="font-semibold text-slate-700 dark:text-slate-200">
                            {isBn ? 'উপাদান: ' : 'Ingredients: '}
                          </span>
                          {isBn ? m.ingredientsBn : m.ingredientsEn}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400 sm:text-right shrink-0 max-w-xs">
                      {isBn ? m.benefitsBn : m.benefitsEn}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PregnancyMilestonesDashboard;
