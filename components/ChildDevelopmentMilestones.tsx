import React, { useState, useEffect } from 'react';
import {
  Baby,
  Scale,
  Ruler,
  Brain,
  Activity,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Sparkles,
  UtensilsCrossed,
  HeartHandshake,
  Stethoscope,
} from 'lucide-react';
import { Language } from '../types';

export type ChildAgeBracket = '1-3' | '4-6' | '7-12';
export type MilestoneStatus = 'on_track' | 'slow' | 'low';

interface Props {
  childAgeGroup?: ChildAgeBracket;
  childAgeYears?: number;
  childWeightKg?: number;
  childHeightCm?: number;
  lang: Language;
  darkMode?: boolean;
  onSyncAgeGroup?: (ageGroup: ChildAgeBracket) => void;
}

interface DevelopmentalDomain {
  id: string;
  icon: React.ElementType;
  titleBn: string;
  titleEn: string;
  expectedNormBn: string;
  expectedNormEn: string;
  milestonesBn: string[];
  milestonesEn: string[];
  catchUpFoodsBn: string[];
  catchUpFoodsEn: string[];
  motherActionStepsBn: string[];
  motherActionStepsEn: string[];
  clinicalNoteBn: string;
  clinicalNoteEn: string;
}

const AGE_GROUP_DOMAINS: Record<ChildAgeBracket, DevelopmentalDomain[]> = {
  '1-3': [
    {
      id: 'weight_growth',
      icon: Scale,
      titleBn: 'শারীরিক ওজন ও মাংসপেশির বৃদ্ধি',
      titleEn: 'Weight Gain & Healthy Muscle Mass',
      expectedNormBn: '১–৩ বছর বয়সে প্রতি বছর গড়ে ২–২.৫ কেজি ওজন বৃদ্ধি (আদর্শ ওজন: ৯.৫–১৪.৫ কেজি)',
      expectedNormEn: 'Expected steady gain of 2–2.5 kg/year between ages 1–3 (Ideal range: 9.5–14.5 kg)',
      milestonesBn: [
        'জন্মের ওজনের তুলনায় ১ বছরে ওজন ৩ গুণ এবং ২ বছরে ৪ গুণ হওয়া',
        'প্রতি ৩ মাসে ওজন অন্তত ৪০০–৬০০ গ্রাম বৃদ্ধি পাওয়া',
        'শরীরের চামড়া ও পেশী সজীব থাকা (পাঁজরের হাড় অতিরিক্ত ভেসে না ওঠা)',
      ],
      milestonesEn: [
        'Birth weight triples by age 1 and quadruples by age 2',
        'Gains at least 400–600g every 3 months consistently',
        'Healthy subcutaneous tissue without visible rib wasting',
      ],
      catchUpFoodsBn: [
        'ক্যালোরি-ঘন খিচুড়ি: মুগ ডাল, চাল, মিষ্টি কুমড়া ও নামানোর আগে ১ চা চামচ খাঁটি গাওয়া ঘি ও আধা চামচ কাঠবাদাম বাটা',
        'পাকা কলা ও সাদা তিল বা চিনাবাদাম মাখনের নরম এনার্জি ম্যাশ (বিকেলের নাস্তায়)',
        'প্রতিদিন ১টি সুসিদ্ধ দেশি ডিমের কুসুম (অথবা গোটা ডিম) ও দেশি শিং/মাগুর মাছের নরম ঝোল',
        'ফুল-ক্রিম দুধ ও ঘরে পাতা মিষ্টি দই বা ছানার ক্ষীর',
      ],
      catchUpFoodsEn: [
        'Calorie-dense Khichuri enriched with 1 tsp pure A2 ghee & 1/2 tsp soaked almond paste',
        'Mashed ripe banana with white sesame paste or smooth peanut butter',
        '1 soft-boiled egg yolk/whole egg daily and indigenous shing/magur fish broth',
        'Full-cream pasteurized milk, homemade sweet curd, or soft chhana pudding',
      ],
      motherActionStepsBn: [
        'শিশুর পাকস্থলী ছোট তাই ৩ বেলার বদলে দিনে ৫–৬ বার অল্প অল্প করে ঘন পুষ্টিকর খাবার দিন',
        'খাবারের ঠিক আগে পানি বা ফলের জুস দেবেন না—এতে পেট ভরে গিয়ে আসল খাবার কম খাবে',
        'মোবাইল বা কার্টুন দেখিয়ে জোর করে না খাইয়ে পরিবারের সবার সাথে বসিয়ে আনন্দের সাথে খাওয়ান',
      ],
      motherActionStepsEn: [
        'Feed 5–6 small high-density meals daily instead of 3 large watery meals',
        'Avoid giving water or juice 30 minutes before meals so stomach capacity is saved for solids',
        'Practice responsive, screen-free feeding alongside family mealtime',
      ],
      clinicalNoteBn: 'টানা ৩ মাস ওজন একেবারেই না বাড়লে কৃমির সংক্রমণ বা আয়রন ঘাটতি (Hb%) পরীক্ষা করান।',
      clinicalNoteEn: 'If weight plateaus for >3 months, check for worm infestation or iron-deficiency anemia.',
    },
    {
      id: 'height_bone',
      icon: Ruler,
      titleBn: 'উচ্চতা, হাড় ও দাঁতের গঠন',
      titleEn: 'Height Velocity, Bone & Teeth Growth',
      expectedNormBn: '১–৩ বছর বয়সে বছরে গড়ে ৭–১০ সেমি উচ্চতা বৃদ্ধি এবং ১৬–২০টি দুধদাঁত ওঠা',
      expectedNormEn: 'Expected linear growth of 7–10 cm/year and eruption of 16–20 primary teeth',
      milestonesBn: [
        'বয়স অনুযায়ী বছরে অন্তত ৭–৮ সেন্টিমিটার লম্বা হওয়া',
        'মাথার তালু (Fontanelle) ১৮ মাসের মধ্যে স্বাভাবিকভাবে বন্ধ হওয়া ও পা সোজা থাকা',
        'সময়মতো দুধদাঁত ওঠা এবং দাঁতের এনামেল মজবুত থাকা',
      ],
      milestonesEn: [
        'Grows at least 7–8 cm in height per year',
        'Anterior fontanelle closes by 18 months with straight, sturdy legs',
        'Timely eruption of milk teeth with strong enamel',
      ],
      catchUpFoodsBn: [
        'ক্যালসিয়াম বুস্টার: প্রতিদিন সাদা তিল গুঁড়া (১ চামচ), ছানা ও দুধের তৈরি খাবার',
        'কাঁটাসহ ছোট মাছ (মলা-ঢেলা) ভালোভাবে বেটে বা চচ্চড়ি করে ভাতের সাথে খাওয়ানো',
        'সজনে পাতার পাতলা স্যুপ বা ডালের সাথে সজনে পাতা সিদ্ধ (উচ্চ ক্যালসিয়াম ও মিনারেল)',
        'রাগি (Finger Millet) বা লাল চালের সুজি দুধ ও খেজুর বাটা দিয়ে রান্না',
      ],
      catchUpFoodsEn: [
        'Calcium Booster: 1 tsp roasted white sesame powder, fresh chhana, and milk daily',
        'Paste of calcium-rich small indigenous fish (Mola/Dhela) cooked softly',
        'Moringa leaf clear soup or moong dal cooked with tender moringa leaves',
        'Ragi (finger millet) porridge sweetened naturally with mashed dates',
      ],
      motherActionStepsBn: [
        'প্রতিদিন সকাল ৮টা–৯:৩০টার হালকা রোদে শিশুকে অন্তত ১৫–২০ মিনিট খেলাধুলা করতে দিন (ভিটামিন D3)',
        'ঘুমানোর সময় গ্রোথ হরমোন নিঃসৃত হয়—তাই রাত ৯টার মধ্যে গভীর ঘুম নিশ্চিত করুন',
        'রাতে ঘুমানোর আগে দাঁত ব্রাশ করানো ও বোতলে দুধ মুখে নিয়ে ঘুমানোর অভ্যাস বন্ধ করা',
      ],
      motherActionStepsEn: [
        'Ensure 15–20 minutes of morning sunlight exposure daily for natural Vitamin D3',
        'Prioritize deep sleep by 9:00 PM to maximize nocturnal Growth Hormone secretion',
        'Avoid bottle-feeding at bedtime to protect emerging milk teeth',
      ],
      clinicalNoteBn: 'পা বাঁকা মনে হলে বা উচ্চতা না বাড়লে ভিটামিন D3 এবং সিরাম ক্যালসিয়াম পরীক্ষা করুন।',
      clinicalNoteEn: 'Evaluate Serum Vitamin D3 and Alkaline Phosphatase if height lags or legs bow.',
    },
    {
      id: 'motor_stamina',
      icon: Activity,
      titleBn: 'হাঁটাচলা, মোটর স্কিল ও শারীরিক শক্তি',
      titleEn: 'Motor Skills, Walking & Active Stamina',
      expectedNormBn: 'নিজে হাঁটা, দৌড়ানো, সিঁড়ি বেয়ে ওঠা এবং চামচ/খেলনা শক্তভাবে ধরা',
      expectedNormEn: 'Independent walking, running, climbing stairs with support, and holding a spoon',
      milestonesBn: [
        'কারো সাহায্য ছাড়াই একা একা হাঁটা ও ধীরে ধীরে দৌড়াতে পারা',
        'নিজের হাতে খাবার তুলে খাওয়ার চেষ্টা করা ও ব্লক দিয়ে টাওয়ার বানানো',
        'খেলাধুলা করার সময় দ্রুত ক্লান্ত না হয়ে পড়া বা হাঁপিয়ে না ওঠা',
      ],
      milestonesEn: [
        'Walks alone steadily and begins running and kicking a ball',
        'Attempts self-feeding with fingers/spoon and stacks 3–4 blocks',
        'Plays actively without rapid exhaustion or breathlessness',
      ],
      catchUpFoodsBn: [
        'আয়রন ও এনার্জি প্যাক: বিটরুট-গাজর-মুরগির কলিজা বা মাংসের নরম স্টু',
        'ডালিমের রস, কালো কিশমিশ ভেজানো পানি ও খেজুর বাটা (হিমোগ্লোবিন বাড়াতে)',
        'ভাতের সাথে মুগ-মসুর ডাল ও কয়েক ফোঁটা পাতিলেবুর রস (আয়রন শোষণ দ্বিগুণ করতে)',
      ],
      catchUpFoodsEn: [
        'Iron & Stamina Stew: Chicken liver/meat slow-cooked with beetroot and carrot',
        'Fresh pomegranate juice, soaked black raisin water, and date paste',
        'Mixed moong-masoor dal with a squeeze of fresh lemon juice for iron uptake',
      ],
      motherActionStepsBn: [
        'সারাদিন কোলে বা স্ট্রলারে বসিয়ে না রেখে মেঝেতে বা ঘাসে খালি পায়ে হাঁটতে ও দৌড়াতে উৎসাহিত করুন',
        'সরিষার তেল বা নারকেল তেল হালকা গরম করে প্রতিদিন গোসলের আগে হাত-পা মালিশ করুন',
      ],
      motherActionStepsEn: [
        'Encourage barefoot floor and grass play rather than prolonged stroller sitting',
        'Perform daily gentle warm oil massage (Abhyanga) before bath to tone muscles',
      ],
      clinicalNoteBn: '১৮ মাস বয়সের মধ্যেও একা হাঁটতে না পারলে শিশু বিশেষজ্ঞের পরামর্শ নিন।',
      clinicalNoteEn: 'Consult a pediatrician if independent walking is not achieved by 18 months.',
    },
    {
      id: 'speech_brain',
      icon: Brain,
      titleBn: 'কথা বলা, মেধা ও মনোযোগের বিকাশ',
      titleEn: 'Speech, Brain & Cognitive Milestones',
      expectedNormBn: 'নাম ধরে ডাকলে সাড়া দেওয়া, ৫০+ শব্দ বলা এবং ২–৩ শব্দের ছোট বাক্য তৈরি করা',
      expectedNormEn: 'Responds to name, uses 50+ words, and combines 2–3 words into simple phrases',
      milestonesBn: [
        'নাম ধরে ডাকলে সাথে সাথে চোখের দিকে তাকানো (Eye Contact) ও সাড়া দেওয়া',
        '২ বছর বয়সের মধ্যে অন্তত ২ শব্দের বাক্য বলা (যেমন: "মা পানি দাও")',
        'শরীরের অঙ্গপ্রত্যঙ্গ (চোখ, নাক, হাত) ও পরিচিত ছবির নাম চিনতে পারা',
      ],
      milestonesEn: [
        'Maintains strong eye contact and responds immediately when called by name',
        'Speaks 2-word phrases by age 2 and 3-word sentences by age 3',
        'Points to body parts and recognizes familiar objects and pictures',
      ],
      catchUpFoodsBn: [
        'ব্রেইন বুস্টার ফ্যাট (DHA & Choline): প্রতিদিন ১টি দেশি ডিমের কুসুম ও খাঁটি গাওয়া ঘি',
        'ভেজানো আখরোট (১টি) ও কাঠবাদাম (২টি) মিহি করে বেটে দুধ বা সুজির সাথে মেশানো',
        'দেশি নদীর মাছ (রুই, কাতলা, পাবদা, ইলিশের কাঁটা ছাড়া পেটি) সপ্তাহে ৪–৫ দিন',
      ],
      catchUpFoodsEn: [
        'Brain Lipid Protocol: 1 cooked egg yolk and 1 tsp pure A2 ghee daily',
        'Fine paste of 1 soaked walnut + 2 peeled almonds mixed into warm porridge',
        'Omega-3 rich boneless river fish (Rohu, Pabda, Hilsa belly) 4–5 times/week',
      ],
      motherActionStepsBn: [
        'শিশুর স্ক্রিন টাইম (মোবাইল, টিভি, রিলস) সম্পূর্ণ শূন্য (Zero Screen Time) করুন—স্ক্রিন কথা বলা ধীর করে দেয়',
        'শিশুর সাথে সারাদিন স্পষ্ট ভাষায় কথা বলুন, ছড়া শোনান এবং রঙিন ছবির বই পড়ে শোনান',
        'শিশু ইশারায় কিছু চাইলে সাথে সাথে না দিয়ে শব্দটি উচ্চারণ করতে উৎসাহ দিন',
      ],
      motherActionStepsEn: [
        'Enforce strictly ZERO screen time (phones/TV delay expressive speech development)',
        'Narrate daily activities, sing rhymes, and read colorful picture books together',
        'Encourage verbal requests instead of immediately fulfilling silent gestures',
      ],
      clinicalNoteBn: '২ বছর বয়সে অর্থপূর্ণ শব্দ না বললে বা চোখের দিকে না তাকালে অডিওলজি/স্পিচ অ্যাসেসমেন্ট করান।',
      clinicalNoteEn: 'Seek early speech and hearing evaluation if no meaningful words by 24 months.',
    },
    {
      id: 'gut_immunity',
      icon: ShieldCheck,
      titleBn: 'ক্ষুধা, হজম ও রোগ প্রতিরোধ ক্ষমতা',
      titleEn: 'Appetite, Digestion & Immunity',
      expectedNormBn: 'স্বাভাবিক ক্ষুধা থাকা, প্রতিদিন নিয়মিত মলত্যাগ এবং ঘন ঘন সর্দি-কাশি না হওয়া',
      expectedNormEn: 'Healthy natural appetite, regular soft bowel movements, and resilience against colds',
      milestonesBn: [
        'খাবারের সময় নিজে থেকে ক্ষুধা প্রকাশ করা ও আনন্দের সাথে খাওয়া',
        'কোষ্ঠকাঠিন্য বা ঘন ঘন পেট খারাপ ছাড়া প্রতিদিন স্বাভাবিক মলত্যাগ',
        'আবহাওয়া পরিবর্তনে প্রতি মাসে সর্দি-জ্বর বা অ্যান্টিবায়োটিকের প্রয়োজন না হওয়া',
      ],
      milestonesEn: [
        'Shows natural hunger cues at mealtimes without severe food refusal',
        'Passes comfortable daily stools without chronic constipation or loose motion',
        'Recovers quickly from minor seasonal changes without frequent antibiotics',
      ],
      catchUpFoodsBn: [
        'অগ্নি-দীপন (ক্ষুধা বৃদ্ধিকারক): খাবার রান্নায় সামান্য ভাজা জিরা গুঁড়া, মৌরি ও আদা রসের ছোঁয়া',
        'গাট প্রোবায়োটিক: প্রতিদিন দুপুরে ২–৩ চামচ ঘরে পাতা তাজা দই বা পাতলা ঘোল',
        'জিঙ্ক ও ভিটামিন-সি: মিষ্টি কুমড়ার বীজ বাটা, পাকা পেঁপে, পেয়ারা বা কমলার রস',
      ],
      catchUpFoodsEn: [
        'Agni-Kindling Digestives: Mild roasted cumin, fennel, and a drop of ginger in dal',
        'Gut Probiotic: 2–3 tbsp fresh homemade yogurt or buttermilk with lunch',
        'Zinc & Vitamin C: Pumpkin seed paste, ripe papaya, and sweet citrus/guava',
      ],
      motherActionStepsBn: [
        'প্যাকেটজাত চিপস, জুস, বিস্কুট ও চকলেট সম্পূর্ণ বন্ধ করুন—এগুলো শিশুর স্বাভাবিক ক্ষুধা নষ্ট করে দেয়',
        'কোষ্ঠকাঠিন্য থাকলে রাতে ঘুমানোর আগে কুসুম গরম দুধে ৪–৫টি ভেজানো কিশমিশ চটকে দিন',
      ],
      motherActionStepsEn: [
        'Eliminate packaged biscuits, chips, and sugary juices that blunt natural hunger',
        'For constipation, give 4–5 soaked mashed black raisins in warm milk at night',
      ],
      clinicalNoteBn: 'দীর্ঘদিন ক্ষুধামন্দা থাকলে জিঙ্ক (Zinc) সাপ্লিমেন্টেশন ও পেডিয়াট্রিক চেকআপ বিবেচনা করুন।',
      clinicalNoteEn: 'Persistent anorexia in toddlers often responds rapidly to Zinc & Iron repletion.',
    },
  ],
  '4-6': [
    {
      id: 'weight_growth',
      icon: Scale,
      titleBn: 'প্রিস্কুল ওজন ও শারীরিক গঠন (৪–৬ বছর)',
      titleEn: 'Preschool Weight & Lean Body Mass (4–6 Yrs)',
      expectedNormBn: '৪–৬ বছর বয়সে প্রতি বছর গড়ে ২ কেজি ওজন বৃদ্ধি (আদর্শ ওজন: ১৬–২১ কেজি)',
      expectedNormEn: 'Steady gain of ~2 kg/year during ages 4–6 (Ideal weight range: 16–21 kg)',
      milestonesBn: [
        'বয়স অনুযায়ী ওজন ১৬–২১ কেজির মধ্যে থাকা ও শরীর চনমনে থাকা',
        'সকালের নাস্তা ও টিফিন পুরোপুরি শেষ করতে পারা',
        'অসুস্থতার পর দ্রুত ওজন ফিরে পাওয়া',
      ],
      milestonesEn: [
        'Maintains healthy weight between 16–21 kg with energetic body tone',
        'Finishes morning breakfast and school tiffin regularly',
        'Recovers weight rapidly after minor childhood illnesses',
      ],
      catchUpFoodsBn: [
        'হাই-এনার্জি টিফিন: ডিম-সবজি পরোটা বা পিনাট বাটার-কলা রোল ও খেজুর-বাদামের লাড্ডু',
        'দুপুরে ভাতের সাথে ১ চামচ খাঁটি গাওয়া ঘি, ঘন ডাল ও দেশি মাছ বা মুরগির মাংস',
        'বিকেলে ছানা বা পনির ভুর্জি, সুজি-দুধের হালুয়া বা মিষ্টি আলু সিদ্ধ',
      ],
      catchUpFoodsEn: [
        'High-Energy Tiffin: Egg-veggie wholewheat roll or peanut-banana wrap + date-nut ball',
        'Lunch with 1 tsp pure A2 ghee, thick lentil dal, and fish or chicken curry',
        'Evening snack of fresh chhana/paneer scramble or sweet potato mash',
      ],
      motherActionStepsBn: [
        'স্কুলে যাওয়ার আগে খালি পেটে না পাঠিয়ে প্রোটিন ও হেলদি ফ্যাট সমৃদ্ধ সকালের নাস্তা নিশ্চিত করুন',
        'খাবারের মাঝে অতিরিক্ত পানি পান না করিয়ে খাওয়ার ৩০ মিনিট পর পানি দিন',
      ],
      motherActionStepsEn: [
        'Never send the child to school on an empty stomach; serve a protein-rich breakfast',
        'Space water intake 30 minutes away from main meals to optimize caloric intake',
      ],
      clinicalNoteBn: 'ওজন বয়সের তুলনায় অনেক কম হলে বছরে ২ বার বয়স অনুযায়ী কৃমিনাশক (Albendazole) কোর্স নিশ্চিত করুন।',
      clinicalNoteEn: 'Ensure biannual deworming protocol if weight gain remains suboptimal.',
    },
    {
      id: 'height_bone',
      icon: Ruler,
      titleBn: 'উচ্চতা বৃদ্ধি ও কঙ্কালতন্ত্রের বিস্তার',
      titleEn: 'Linear Height & Skeletal Stretching',
      expectedNormBn: '৪–৬ বছর বয়সে বছরে ৬–৮ সেমি উচ্চতা বৃদ্ধি (আদর্শ উচ্চতা: ১০২–১১৮ সেমি)',
      expectedNormEn: 'Gains 6–8 cm in height annually (Ideal height range: 102–118 cm)',
      milestonesBn: [
        'প্রতি ৬ মাসে জামাকাপড় ও জুতার সাইজ পরিবর্তন হওয়া (লম্বা হওয়ার লক্ষণ)',
        'হাঁটু বা পায়ের গোড়ালিতে ব্যথা (Growing Pains) ছাড়া দৌড়ঝাঁপ করতে পারা',
        'সোজা হয়ে দাঁড়ানো ও মেরুদণ্ডের ভঙ্গি ঠিক থাকা',
      ],
      milestonesEn: [
        'Outgrows trouser length and shoe sizes every 6–8 months',
        'Runs and jumps without frequent night-time leg cramps or bone pain',
        'Maintains upright posture and strong dental alignment',
      ],
      catchUpFoodsBn: [
        'ক্যালসিয়াম-প্রোটিন কম্বো: প্রতিদিন ২ গ্লাস দুধ/দই, ১টি গোটা ডিম ও কাঁটাসহ ছোট মাছ',
        'তিল-গুড়-চিনাবাদামের বারফি বা লাড্ডু (হাড়ের ঘনত্ব বাড়াতে দারুণ কার্যকর)',
        'সজনে ডাঁটা ও পাতার ঝোল এবং সবুজ শাকসবজি',
      ],
      catchUpFoodsEn: [
        'Calcium-Protein Combo: 2 servings of dairy (milk/curd), 1 whole egg & small fish daily',
        'Sesame-jaggery-peanut energy barfi for dense bone mineralization',
        'Drumstick (Moringa) pods and leafy greens in daily dal',
      ],
      motherActionStepsBn: [
        'প্রতিদিন বিকেলে অন্তত ৪৫ মিনিট লাফানো, দৌড়ানো বা সাইকেল চালানোর মতো খেলাধুলা করান',
        'রাতে পা ব্যথা করলে কুসুম গরম তেল মালিশ ও রাতে এক গ্লাস হলুদ-দুধ (সামান্য ঘিসহ) দিন',
      ],
      motherActionStepsEn: [
        'Include 45 minutes of outdoor jumping, cycling, or running daily to stimulate bone plates',
        'Give warm milk with a pinch of turmeric and ghee at night if leg cramps occur',
      ],
      clinicalNoteBn: 'রাতে পায়ে অতিরিক্ত ব্যথা হলে ভিটামিন D3 ও ক্যালসিয়াম লেভেল পরীক্ষা করান।',
      clinicalNoteEn: 'Night-time shin cramps often indicate Vitamin D3 and Calcium insufficiency.',
    },
    {
      id: 'motor_stamina',
      icon: Activity,
      titleBn: 'শারীরিক স্ট্যামিনা, ভারসাম্য ও হাতের দক্ষতা',
      titleEn: 'Physical Stamina, Balance & Fine Motor Skills',
      expectedNormBn: 'এক পায়ে লাফানো, পেন্সিল দিয়ে লেখা/ছবি আঁকা এবং নিজে জামার বোতাম লাগানো',
      expectedNormEn: 'Hops on one foot, holds pencil with tripod grip, draws shapes, and dresses self',
      milestonesBn: [
        'পেন্সিল সঠিকভাবে ধরে অক্ষর লেখা ও ছবিতে রঙ করতে পারা',
        'নিজের হাতে ভাত মেখে খাওয়া ও জামাকাপড় পরতে পারা',
        'সমবয়সীদের সাথে সমান তালে দৌড়াদৌড়ি ও খেলাধুলায় অংশ নেওয়া',
      ],
      milestonesEn: [
        'Holds crayon/pencil properly to write letters and color within lines',
        'Eats independently with hand/spoon and dresses without help',
        'Keeps up with peers on the playground without fatigue',
      ],
      catchUpFoodsBn: [
        'হিমোগ্লোবিন ও এনার্জি বুস্টার: খেজুর, কালো কিশমিশ, ডালিম ও বিটরুট সালাদ',
        'দেশি মুরগির স্যুপ, শিং মাছের ঝোল ও অঙ্কুরিত ছোলা/মুগ ডাল',
        'কলা ও ওটস-দুধের স্মুদি (খেলাধুলার আগে বা পরে)',
      ],
      catchUpFoodsEn: [
        'Hemoglobin & Stamina Booster: Dates, black raisins, pomegranate & beetroot',
        'Free-range chicken soup, shing fish broth, and sprouted moong',
        'Banana-oats-milk smoothie before or after outdoor play',
      ],
      motherActionStepsBn: [
        'হাতের পেশী শক্ত করতে মাটি/ক্লে দিয়ে খেলা, কাগজ ভাঁজ করা ও ছবি আঁকার অভ্যাস করান',
        'নিজের কাজ (যেমন খেলনা গোছানো, জুতা পরা) নিজেকে করতে উৎসাহ দিন',
      ],
      motherActionStepsEn: [
        'Provide clay modeling, drawing, and buttoning tasks to refine hand muscles',
        'Encourage independence in self-care routines like putting away toys',
      ],
      clinicalNoteBn: 'শিশু খুব দ্রুত ক্লান্ত হয়ে পড়লে সিবিসি (CBC) ও সিরাম ফেরিটিন পরীক্ষা করান।',
      clinicalNoteEn: 'Check CBC and Serum Ferritin if the child tires easily during play.',
    },
    {
      id: 'speech_brain',
      icon: Brain,
      titleBn: 'বুদ্ধিমত্তা, স্মৃতিশক্তি ও স্কুলের মনোযোগ',
      titleEn: 'Memory, Storytelling & Classroom Focus',
      expectedNormBn: 'গল্প বলা, প্রশ্ন করা, ছড়া মুখস্থ রাখা এবং ১৫–২০ মিনিট একটানা মনোযোগ দেওয়া',
      expectedNormEn: 'Tells stories, asks "why" questions, recalls rhymes, and focuses for 15–20 mins',
      milestonesBn: [
        'স্কুল বা সারাদিনের ঘটনা গুছিয়ে মা-বাবাকে গল্প করে শোনানো',
        'বর্ণমালা, সংখ্যা ও ছড়া সহজে মনে রাখতে পারা',
        'অতিরিক্ত চঞ্চলতা ছাড়া ক্লাসে বা পড়ার টেবিলে ১৫–২০ মিনিট মনোযোগ ধরে রাখা',
      ],
      milestonesEn: [
        'Narrates daily school events clearly in full sentences',
        'Remembers alphabets, numbers, and rhymes effortlessly',
        'Sustains calm attention on a task or story for 15–20 minutes',
      ],
      catchUpFoodsBn: [
        'মেধা ও মনোযোগের খাবার: প্রতিদিন সকালে ৪টি ভেজানো কাঠবাদাম, ২টি আখরোট ও ১ চামচ কুমড়ার বীজ',
        'দেশি ডিমের কুসুম, সামুদ্রিক বা নদীর তৈলাক্ত মাছ এবং খাঁটি গাওয়া ঘি',
        'অতিরিক্ত চিনি ও কৃত্রিম রঙ দেওয়া খাবার বর্জন (যা চঞ্চলতা বা Hyperactivity বাড়ায়)',
      ],
      catchUpFoodsEn: [
        'Neuro-Focus Pack: 4 soaked peeled almonds, 2 walnuts & 1 tsp pumpkin seeds every morning',
        'Whole egg, fatty river fish, and 1 tsp pure A2 ghee daily',
        'Strictly eliminate artificial food dyes and refined sugar spikes',
      ],
      motherActionStepsBn: [
        'পড়ার সময় বা খাওয়ার সময় টিভি/মোবাইল সম্পূর্ণ বন্ধ রাখুন; প্রতিদিন ১ ঘণ্টাের কম স্ক্রিন টাইম রাখুন',
        'শিশুর সাথে পাজল মেলানো, মেমোরি গেম ও গল্পের বই পড়ার রুটিন তৈরি করুন',
      ],
      motherActionStepsEn: [
        'Keep total recreational screen time under 45 minutes/day and zero during meals',
        'Engage in jigsaw puzzles, storytelling, and memory games every evening',
      ],
      clinicalNoteBn: 'মনোযোগ খুব কম হলে বা অতিরিক্ত চঞ্চল হলে চিনিযুক্ত খাবার বন্ধ করে ঘুমের রুটিন ঠিক করুন।',
      clinicalNoteEn: 'High sugar intake and sleep deprivation frequently mimic attention deficits.',
    },
    {
      id: 'gut_immunity',
      icon: ShieldCheck,
      titleBn: 'হজমশক্তি, রুচি ও সিজনাল ইমিউনিটি',
      titleEn: 'Digestive Fire (Agni) & Seasonal Immunity',
      expectedNormBn: 'সব ধরনের ঘরের খাবার খাওয়া, টনসিল/সর্দি কম হওয়া এবং পেট পরিষ্কার থাকা',
      expectedNormEn: 'Eats diverse home foods, rare tonsil/respiratory infections, and daily bowel habit',
      milestonesBn: [
        'মাছ, ডিম, সবজি ও ফলমূল কোনো বাছবিচার ছাড়াই পরিমিত খাওয়া',
        'স্কুলে বা আবহাওয়া বদলে বারবার সর্দি-কাশি বা টনসিলের সমস্যা না হওয়া',
        'পেট ব্যথা, গ্যাস বা কোষ্ঠকাঠিন্য না থাকা',
      ],
      milestonesEn: [
        'Accepts family vegetables, fish, eggs, and fruits without extreme pickiness',
        'Attends school consistently without monthly respiratory/tonsil flare-ups',
        'Free from chronic constipation or recurrent tummy aches',
      ],
      catchUpFoodsBn: [
        'ইমিউনিটি শিল্ড: সকালে ১ চামচ খাঁটি মধুতে সামান্য গোলমরিচ বা তুলসী পাতার রস (ঠান্ডা লাগার প্রবণতা থাকলে)',
        'দুপুরে টক-মিষ্টি দই, মৌসুমি টক ফল (আমলকী, পেয়ারা, কমলা) ও রঙিন সবজির স্যুপ',
        'প্যাকেটজাত চিপস, ইনস্ট্যান্ট নুডলস ও কোমল পানীয় সম্পূর্ণ বর্জন',
      ],
      catchUpFoodsEn: [
        'Immunity Shield: Raw honey with a drop of ginger/tulsi juice in the morning',
        'Probiotic homemade curd at lunch, Vitamin-C rich amla/guava, and rainbow vegetable soup',
        'Replace instant noodles and packaged crisps with homemade roasted makhana/chira',
      ],
      motherActionStepsBn: [
        'শিশুকে সবজি খাওয়াতে সবজি দিয়ে কাটলেট, পরোটা বা ডালের সাথে মিশিয়ে আকর্ষণীয়ভাবে পরিবেশন করুন',
        'বাইরে থেকে এসে ও খাওয়ার আগে সাবান দিয়ে হাত ধোয়ার অভ্যাস গড়ে তুলুন',
      ],
      motherActionStepsEn: [
        'Incorporate grated vegetables into parathas, cutlets, and dal for picky eaters',
        'Maintain strict hand-washing habits after school and playground time',
      ],
      clinicalNoteBn: 'ঘন ঘন টনসিল বা অ্যালার্জি হলে ফ্রিজের ঠান্ডা পানি ও আইসক্রিম সম্পূর্ণ বন্ধ রাখুন।',
      clinicalNoteEn: 'Avoid chilled refrigerator water and ice creams if prone to tonsillitis.',
    },
  ],
  '7-12': [
    {
      id: 'weight_growth',
      icon: Scale,
      titleBn: 'স্কুল-বয়সী ওজন ও মেটাবলিক ব্যালেন্স (৭–১২ বছর)',
      titleEn: 'School-Age Weight & Healthy BMI Balance (7–12 Yrs)',
      expectedNormBn: '৭–১২ বছর বয়সে বছরে ২.৫–৩.৫ কেজি সুষম ওজন বৃদ্ধি (পেশী ও হাড়ের ওজন)',
      expectedNormEn: 'Balanced gain of 2.5–3.5 kg/year driven by lean muscle and bone mass',
      milestonesBn: [
        'বয়স ও উচ্চতা অনুযায়ী বিএমআই (BMI) সঠিক থাকা (অতিরিক্ত শুকনো বা মেদবহুল না হওয়া)',
        'স্কুল ও কোচিংয়ের পরও শরীর সতেজ ও কর্মক্ষম থাকা',
        'সুষম প্রোটিন ও শর্করা জাতীয় খাবার প্রতিদিন পরিমিত গ্রহণ করা',
      ],
      milestonesEn: [
        'Maintains healthy age-appropriate BMI (neither underweight nor central obesity)',
        'Sustains high energy throughout school hours and evening studies',
        'Consumes balanced protein and complex carbohydrates daily',
      ],
      catchUpFoodsBn: [
        'ওজন কম হলে: দুধ-কলা-খেজুর-বাদাম শেক, ডিম-পরোটা, দেশি মাছ, মুরগি ও ভাতের সাথে খাঁটি ঘি',
        'ওজন বেশি হলে: ফাস্টফুড ও কোমল পানীয় বন্ধ করে লাল আটার রুটি, প্রচুর সালাদ, ডাল ও গ্রিলড/ঝোল মাছ-মাংস',
        'স্কুলের টিফিনে ঘরে তৈরি ডিম-সবজি স্যান্ডউইচ, ফল ও ভাজা বাদাম-ছোলা',
      ],
      catchUpFoodsEn: [
        'If Underweight: Milk-banana-date-almond shake, whole eggs, fish, chicken & A2 ghee',
        'If Overweight: Replace fast food/soda with whole grains, salads, dal & lean fish/chicken',
        'Pack wholesome homemade egg-veggie sandwiches, fruits, and roasted nuts for tiffin',
      ],
      motherActionStepsBn: [
        'সকালের নাস্তা কখনোই বাদ দেওয়া যাবে না—সকালে ভারী ও পুষ্টিকর নাস্তা মেটাবলিজম ঠিক রাখে',
        'সপ্তাহে অন্তত ৬ দিন ঘরের রান্না করা খাবার এবং বাইরের ফাস্টফুড মাসে ১ বারের কম রাখা',
      ],
      motherActionStepsEn: [
        'Never skip breakfast before school; include high-biological-value protein every morning',
        'Limit ultra-processed fast food and sugary beverages strictly',
      ],
      clinicalNoteBn: 'গলার কাছে কালো দাগ (Acanthosis) বা পেটে মেদ জমলে ইনসুলিন ও ফাস্টিং সুগার খেয়াল রাখুন।',
      clinicalNoteEn: 'Watch for dark neck folds (Acanthosis) if rapid central weight gain occurs.',
    },
    {
      id: 'height_bone',
      icon: Ruler,
      titleBn: 'বয়ঃসন্ধিপূর্ব উচ্চতা ও গ্রোথ স্পার্ট (Growth Spurt)',
      titleEn: 'Pre-Pubertal Height Velocity & Peak Bone Mass',
      expectedNormBn: '৭–১২ বছর হলো জীবনের সবচেয়ে গুরুত্বপূর্ণ গ্রোথ স্পার্ট সময় (বছরে ৬–৯ সেমি বৃদ্ধি)',
      expectedNormEn: 'Critical pre-pubertal growth spurt window (6–9 cm height gain per year)',
      milestonesBn: [
        'প্রতি বছর দৃশ্যমানভাবে উচ্চতা বৃদ্ধি পাওয়া (গ্রোথ চার্টের পার্সেন্টাইল বজায় থাকা)',
        'স্থায়ী দাঁতগুলো সুশৃঙ্খল ও মজবুতভাবে ওঠা',
        'খেলাধুলা ও পিটি (PT) করার সময় হাড় ও জয়েন্টে শক্তি পাওয়া',
      ],
      milestonesEn: [
        'Consistent annual height jump tracking along pediatric growth percentiles',
        'Healthy eruption of permanent teeth with strong mineralization',
        'Strong joints and posture during sports and physical education',
      ],
      catchUpFoodsBn: [
        'গ্রোথ স্পার্ট প্রোটোকল: প্রতিদিন ২টি ডিম (বা ১টি ডিম + ১ টুকরো মাছ/মাংস), ২ গ্লাস দুধ/দই ও সজনে পাতা',
        'তিল, চিনাবাদাম, কাঠবাদাম ও মিষ্টি কুমড়ার বীজের মিক্সড পাউডার (দুধের সাথে ১ চামচ)',
        'কাঁটাসহ ছোট মাছ, ছোলা সিদ্ধ ও পনির/ছানা',
      ],
      catchUpFoodsEn: [
        'Growth Spurt Protocol: 2 eggs (or 1 egg + fish/chicken), 2 dairy servings & moringa daily',
        '1 tbsp homemade roasted sesame, almond, peanut & pumpkin seed powder in warm milk',
        'Small bone-in indigenous fish, boiled chickpeas, and fresh chhana',
      ],
      motherActionStepsBn: [
        'লম্বা হওয়ার জন্য প্রতিদিন সাঁতার, বাস্কেটবল, ব্যাডমিন্টন, দড়িলাফ বা সাইকেল চালানোয় উৎসাহ দিন',
        'স্কুলের ব্যাগ যেন শিশুর ওজনের ১০% এর বেশি ভারী না হয় এবং রাত ১০টার মধ্যে ঘুম নিশ্চিত করুন',
      ],
      motherActionStepsEn: [
        'Encourage stretching sports: swimming, badminton, skipping rope, cycling, or basketball',
        'Ensure 8–9 hours of uninterrupted night sleep before 10:00 PM for peak Growth Hormone',
      ],
      clinicalNoteBn: '১০–১২ বছর বয়সের গ্রোথ স্পার্ট মিস হলে পরবর্তীতে উচ্চতা বাড়ানো কঠিন হয়—তাই এখনই পুষ্টি নিশ্চিত করুন।',
      clinicalNoteEn: 'Optimize Calcium, Protein, and Vitamin D3 before epiphyseal growth plates close.',
    },
    {
      id: 'motor_stamina',
      icon: Activity,
      titleBn: 'শারীরিক সক্ষমতা, রক্তস্বল্পতা প্রতিরোধ ও স্পোর্টস স্ট্যামিনা',
      titleEn: 'Physical Stamina, Hemoglobin & Athletic Endurance',
      expectedNormBn: 'দীর্ঘ সময় খেলাধুলা ও পড়াশোনায় ক্লান্ত না হওয়া এবং রক্তে পর্যাপ্ত হিমোগ্লোবিন থাকা',
      expectedNormEn: 'High physical endurance in sports and studies with optimal Hemoglobin (>12 g/dL)',
      milestonesBn: [
        '৪৫–৬০ মিনিট আউটডোর খেলাধুলা করার পরও স্বাভাবিক শ্বাস-প্রশ্বাস ও শক্তি থাকা',
        'চোখের নিচে ফ্যাকাশে ভাব না থাকা ও হাতের নখ গোলাপি থাকা',
        'সকালে ঘুম থেকে ওঠার পর শরীর ঝরঝরে ও সতেজ লাগা',
      ],
      milestonesEn: [
        'Participates in 45–60 mins of outdoor sports without dizziness or exhaustion',
        'Pink nail beds and conjunctiva without pallor or dark under-eye circles',
        'Wakes up refreshed in the morning without chronic lethargy',
      ],
      catchUpFoodsBn: [
        'অ্যানিমিয়া প্রতিরোধক খাবার: শিং মাছ, মুরগির কলিজা, ডালিম, বিটরুট, খেজুর ও কচু/পালং শাক',
        'প্রতিদিন দুপুরে ডাল ও শাকসবজির সাথে এক টুকরো কাগজি লেবু (ভিটামিন-সি আয়রন শোষণ বাড়ায়)',
        'খেলার পর গ্লুকোজ বা কোমল পানীয়র বদলে ডাবের পানি বা লেবু-গুড়ের শরবত',
      ],
      catchUpFoodsEn: [
        'Iron-Rich Builders: Shing fish, chicken liver, pomegranate, beetroot, dates & leafy greens',
        'Always pair iron-rich meals with fresh lemon or guava for Vitamin C absorption',
        'Rehydrate after sports with tender coconut water instead of commercial energy drinks',
      ],
      motherActionStepsBn: [
        'খাবারের সাথে বা খাবারের পরপরই চা/কফি সম্পূর্ণ নিষিদ্ধ (ট্যানিন শরীরের আয়রন নষ্ট করে দেয়)',
        'বিশেষ করে ১০–১২ বছর বয়সী মেয়েদের মাসিক শুরুর প্রাক্কালে আয়রন ও ফলিক অ্যাসিড সমৃদ্ধ খাবার বাড়িয়ে দিন',
      ],
      motherActionStepsEn: [
        'Never serve tea or coffee around meals as tannins block 60% of dietary iron',
        'Increase iron and folate intake proactively for pre-adolescent girls (ages 10–12)',
      ],
      clinicalNoteBn: 'অল্পতেই হাঁপিয়ে উঠলে বা চুল পড়লে Hemoglobin ও Serum Ferritin টেস্ট করান।',
      clinicalNoteEn: 'Screen Hemoglobin and Serum Ferritin annually during school years.',
    },
    {
      id: 'speech_brain',
      icon: Brain,
      titleBn: 'পড়াশোনায় মনোযোগ, আইকিউ ও মানসিক প্রশান্তি',
      titleEn: 'Academic Focus, Memory & Emotional Resilience',
      expectedNormBn: 'পড়াশোনায় গভীর মনোযোগ, বিশ্লেষণী ক্ষমতা এবং মানসিক চাপ বা খিটখিটে মেজাজ না থাকা',
      expectedNormEn: 'Strong reading comprehension, mathematical logic, and calm emotional balance',
      milestonesBn: [
        '৪০–৪৫ মিনিট একটানা মনোযোগ দিয়ে পড়াশোনা করতে পারা ও পড়া মনে থাকা',
        'পরীক্ষা বা স্কুলের কাজ নিয়ে অতিরিক্ত ভয়, মাথাব্যথা বা পেটব্যথা না হওয়া',
        'পরিবারের সদস্য ও বন্ধুদের সাথে সুন্দরভাবে কথা বলা ও আবেগ নিয়ন্ত্রণ করা',
      ],
      milestonesEn: [
        'Studies with sustained focus for 40–45 minute blocks with strong recall',
        'Handles schoolwork without frequent tension headaches or exam anxiety',
        'Communicates feelings calmly without severe irritability or mood swings',
      ],
      catchUpFoodsBn: [
        'মেধাবর্ধক মেধ্য রসায়ন (খাদ্য): ভেজানো আখরোট, কাঠবাদাম, কুমড়ার বীজ ও সূর্যমুখীর বীজ',
        'ওমেগা-৩ ও ভিটামিন B12: সামুদ্রিক ও নদীর মাছ, দেশি ডিম এবং দুধ-দই',
        'ডার্ক চকলেট (অল্প পরিমাণে) বা কোকো-বাদাম মিল্ক ও মৌসুমি জাম/বেরি ফল',
      ],
      catchUpFoodsEn: [
        'Brain Food Matrix: Soaked walnuts, almonds, pumpkin seeds & sunflower seeds daily',
        'Omega-3 & B12 Sources: Fatty river/sea fish, whole eggs, and fermented curd',
        'Antioxidant berries, pomegranate, and homemade cocoa-almond milk',
      ],
      motherActionStepsBn: [
        'রাতে ঘুমানোর অন্তত ১ ঘণ্টা আগে মোবাইল, ট্যাব ও কম্পিউটার স্ক্রিন বন্ধ করে দিন',
        'অতিরিক্ত কোচিংয়ের চাপে না রেখে প্রতিদিন ১০ মিনিট গভীর শ্বাস-প্রশ্বাস (প্রাণায়াম) ও খোলা মাঠে খেলার সুযোগ দিন',
      ],
      motherActionStepsEn: [
        'Turn off all digital screens 60 minutes before bedtime to protect melatonin and memory consolidation',
        'Practice 10 minutes of deep breathing and outdoor relaxation daily to prevent burnout',
      ],
      clinicalNoteBn: 'পড়ার সময় মাথাব্যথা বা মনোযোগের অভাব হলে চোখের পাওয়ার এবং ভিটামিন B12 ও D3 পরীক্ষা করান।',
      clinicalNoteEn: 'Check vision acuity, Vitamin B12, and Vitamin D3 if headaches or focus issues arise.',
    },
    {
      id: 'gut_immunity',
      icon: ShieldCheck,
      titleBn: 'হজম, গাট মাইক্রোবায়োম ও দীর্ঘমেয়াদী রোগ প্রতিরোধ',
      titleEn: 'Gut Microbiome, Hydration & Immune Strength',
      expectedNormBn: 'গ্যাস্ট্রিক বা অ্যাসিডিটি না থাকা, পর্যাপ্ত পানি পান এবং শক্তিশালী রোগ প্রতিরোধ ক্ষমতা',
      expectedNormEn: 'Strong digestion without acidity/constipation, adequate water intake, and high immunity',
      milestonesBn: [
        'স্কুলে থাকা অবস্থায় প্রতিদিন অন্তত ১–১.৫ লিটার বিশুদ্ধ পানি পান করা',
        'বাইরের ভাজাপোড়া বা ফাস্টফুডের প্রতি অতিরিক্ত আসক্তি না থাকা',
        'গ্যাস্ট্রিক, পেট ফাঁপা বা কোষ্ঠকাঠিন্য ছাড়া নিয়মিত হজম হওয়া',
      ],
      milestonesEn: [
        'Drinks 1.5–2 liters of clean water daily including school water bottle',
        'Free from early-onset gastritis, bloating, or chronic constipation',
        'Rarely misses school days due to seasonal viral or stomach infections',
      ],
      catchUpFoodsBn: [
        'প্রোবায়োটিক ও ফাইবার: ঘরে পাতা দই, বোরহানি/ঘোল, শসা-গাজর-টমেটো সালাদ ও আঁশযুক্ত ফল',
        'হজম বৃদ্ধিকারক পানীয়: জিরা-ধনে-মৌরি ফোটানো পানি ও পাতিলেবুর শরবত',
        'হলুদ, আদা ও রসুনযুক্ত ঘরের তাজা রান্না (প্রাকৃতিক অ্যান্টি-ইনফ্ল্যামেটরি)',
      ],
      catchUpFoodsEn: [
        'Probiotic & Prebiotic Fiber: Homemade yogurt, spiced buttermilk, fresh salad & whole fruits',
        'Digestive Hydration: Cumin-fennel infused water and fresh lemon water',
        'Home-cooked meals with turmeric, ginger, and garlic for natural immune defense',
      ],
      motherActionStepsBn: [
        'স্কুলে যাওয়ার সময় প্রতিদিন পরিষ্কার পানির বোতল দিন এবং ফিরে আসার পর কতটুকু পানি খেয়েছে তা দেখুন',
        'রাতের খাবার রাত ৮:৩০-এর মধ্যে শেষ করে অন্তত ৩০ মিনিট হাঁটাহাঁটির অভ্যাস গড়ে তুলুন',
      ],
      motherActionStepsEn: [
        'Track school water bottle completion daily to prevent dehydration headaches and constipation',
        'Serve dinner by 8:30 PM followed by light family conversation rather than late-night snacks',
      ],
      clinicalNoteBn: 'ছোট বয়সে গ্যাস্ট্রিকের ওষুধ (PPI) না খাইয়ে খাদ্যাভ্যাস ও ঘুমের সময় ঠিক করুন।',
      clinicalNoteEn: 'Resolve childhood acidity through meal timing and fiber rather than chronic antacids.',
    },
  ],
};

export const ChildDevelopmentMilestones: React.FC<Props> = ({
  childAgeGroup = '1-3',
  childAgeYears,
  childWeightKg,
  childHeightCm,
  lang,
  darkMode,
  onSyncAgeGroup,
}) => {
  const isBn = lang === 'bn';

  const deriveInitialBracket = (): ChildAgeBracket => {
    if (childAgeGroup === '1-3' || childAgeGroup === '4-6' || childAgeGroup === '7-12') {
      return childAgeGroup;
    }
    if (childAgeYears !== undefined) {
      if (childAgeYears <= 3) return '1-3';
      if (childAgeYears <= 6) return '4-6';
      return '7-12';
    }
    return '1-3';
  };

  const [selectedBracket, setSelectedBracket] = useState<ChildAgeBracket>(deriveInitialBracket);
  const [domainStatuses, setDomainStatuses] = useState<Record<string, MilestoneStatus>>(() => {
    try {
      const saved = localStorage.getItem('ayur_child_milestone_statuses');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [checkedMilestones, setCheckedMilestones] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('ayur_child_milestone_checks');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (childAgeGroup === '1-3' || childAgeGroup === '4-6' || childAgeGroup === '7-12') {
      setSelectedBracket(childAgeGroup);
    }
  }, [childAgeGroup]);

  const handleSelectBracket = (bracket: ChildAgeBracket) => {
    setSelectedBracket(bracket);
    if (onSyncAgeGroup) {
      onSyncAgeGroup(bracket);
    }
  };

  const handleStatusChange = (domainId: string, status: MilestoneStatus) => {
    const key = `${selectedBracket}_${domainId}`;
    const updated = { ...domainStatuses, [key]: status };
    setDomainStatuses(updated);
    try {
      localStorage.setItem('ayur_child_milestone_statuses', JSON.stringify(updated));
    } catch {
      // ignore storage quota errors
    }
  };

  const toggleMilestoneCheck = (domainId: string, idx: number) => {
    const key = `${selectedBracket}_${domainId}_m${idx}`;
    const updated = { ...checkedMilestones, [key]: !checkedMilestones[key] };
    setCheckedMilestones(updated);
    try {
      localStorage.setItem('ayur_child_milestone_checks', JSON.stringify(updated));
    } catch {
      // ignore storage quota errors
    }
  };

  const domains = AGE_GROUP_DOMAINS[selectedBracket] || AGE_GROUP_DOMAINS['1-3'];

  const getDomainStatus = (domainId: string): MilestoneStatus => {
    const key = `${selectedBracket}_${domainId}`;
    return domainStatuses[key] || 'on_track';
  };

  // Identify domains that need Catch-Up Suggestions (marked 'slow' or 'low')
  const laggingDomains = domains.filter((d) => {
    const st = getDomainStatus(d.id);
    return st === 'slow' || st === 'low';
  });

  return (
    <div className="space-y-6">
      {/* Header & Age Group Selector */}
      <div
        className={`p-5 md:p-7 rounded-3xl border shadow-lg relative overflow-hidden ${
          darkMode
            ? 'bg-gradient-to-br from-slate-900 via-sky-950/35 to-indigo-950/30 border-sky-800/40'
            : 'bg-gradient-to-br from-sky-50/90 via-white to-indigo-50/60 border-sky-200'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-sky-200/60 dark:border-sky-900/40">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-sky-600 dark:text-sky-400">
              <Baby className="w-4 h-4" />
              <span>
                {isBn
                  ? 'শিশুর বিকাশ ও গ্রোথ মাইলস্টোন ট্র্যাকার (Child Development Milestones)'
                  : 'Child Development & Growth Milestone Tracker'}
              </span>
              {(childWeightKg || childHeightCm) && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">
                    {childWeightKg ? `${childWeightKg} kg` : ''}{' '}
                    {childHeightCm ? `· ${childHeightCm} cm` : ''}
                  </span>
                </>
              )}
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {isBn
                ? 'সন্তানের শারীরিক ও মানসিক অগ্রগতি যাচাই এবং পুষ্টি সাজেশন'
                : 'Evaluate Your Child’s Developmental Progress & Catch-Up Nutrition'}
            </h2>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
              {isBn
                ? 'মা যাতে সহজেই বুঝতে পারেন সন্তানের ওজন, উচ্চতা, কথা বলা ও মেধার অগ্রগতি কেমন। কোনো ক্ষেত্রে অগ্রগতি কম বা ধীর হলে নিচে থাকা অপশনে ক্লিক করলেই অ্যাপ সাথে সাথে করণীয় ও বিশেষ পুষ্টি সাজেশন দেবে।'
                : 'Track your child’s weight, height, motor skills, speech, and immunity. Mark any domain as "Slightly Slow" or "Needs Catch-Up" to unlock personalized nutritional & care action plans.'}
            </p>
          </div>

          {/* Age Group Switcher */}
          <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {isBn ? 'শিশুর বয়সসীমা নির্বাচন করুন:' : 'Select Child Age Group:'}
            </span>
            <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              {(
                [
                  { id: '1-3', labelBn: '১–৩ বছর (টডলার)', labelEn: '1–3 Yrs (Toddler)' },
                  { id: '4-6', labelBn: '৪–৬ বছর (প্রিস্কুল)', labelEn: '4–6 Yrs (Preschool)' },
                  { id: '7-12', labelBn: '৭–১২ বছর (স্কুল এইজ)', labelEn: '7–12 Yrs (School)' },
                ] as { id: ChildAgeBracket; labelBn: string; labelEn: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleSelectBracket(tab.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    selectedBracket === tab.id
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  {isBn ? tab.labelBn : tab.labelEn}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Instruction Strip for Mothers */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              {isBn
                ? 'নির্দেশনা: নিচের ৫টি বিকাশের ক্ষেত্রে আপনার সন্তানের অগ্রগতি কেমন তা নির্বাচন করুন ("সঠিক অগ্রগতি", "কিছুটা ধীর", অথবা "অগ্রগতি কম")।'
                : 'Tip: Rate each of the 5 developmental domains below ("On Track", "Slightly Slow", or "Needs Catch-Up") to generate targeted advice.'}
            </span>
          </div>
          <div className="font-bold text-sky-700 dark:text-sky-300 shrink-0">
            {laggingDomains.length === 0
              ? isBn
                ? '✓ সব ক্ষেত্রে সঠিক অগ্রগতি রয়েছে'
                : '✓ All domains marked On Track'
              : isBn
              ? `⚡ ${laggingDomains.length}টি ক্ষেত্রে বিশেষ পুষ্টি সাজেশন তৈরি হয়েছে`
              : `⚡ ${laggingDomains.length} Catch-Up Action Plan(s) Active`}
          </div>
        </div>
      </div>

      {/* 5 Developmental Domains Evaluation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {domains.map((domain) => {
          const IconComp = domain.icon;
          const currentStatus = getDomainStatus(domain.id);
          const milestones = isBn ? domain.milestonesBn : domain.milestonesEn;

          return (
            <div
              key={domain.id}
              className={`p-5 rounded-3xl border shadow-sm transition-all flex flex-col justify-between gap-4 ${
                currentStatus === 'low'
                  ? darkMode
                    ? 'bg-rose-950/25 border-rose-700/70'
                    : 'bg-rose-50/50 border-rose-300'
                  : currentStatus === 'slow'
                  ? darkMode
                    ? 'bg-amber-950/25 border-amber-700/70'
                    : 'bg-amber-50/50 border-amber-300'
                  : darkMode
                  ? 'bg-slate-900 border-slate-800'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="space-y-3.5">
                {/* Domain Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                        currentStatus === 'low'
                          ? 'bg-rose-600 text-white'
                          : currentStatus === 'slow'
                          ? 'bg-amber-500 text-white'
                          : 'bg-sky-600 text-white'
                      }`}
                    >
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                        {isBn ? domain.titleBn : domain.titleEn}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {isBn ? domain.expectedNormBn : domain.expectedNormEn}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Expected Milestones Checklist */}
                <div className="space-y-2 pt-1">
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    {isBn
                      ? 'বয়স অনুযায়ী প্রত্যাশিত মাইলস্টোন (টিক দিয়ে মেলান):'
                      : 'Expected Age Milestones (Click to check):'}
                  </div>
                  {milestones.map((ms, i) => {
                    const checkKey = `${selectedBracket}_${domain.id}_m${i}`;
                    const isChecked =
                      checkedMilestones[checkKey] !== undefined
                        ? checkedMilestones[checkKey]
                        : currentStatus === 'on_track';
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleMilestoneCheck(domain.id, i)}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-start gap-2.5 text-xs transition-colors ${
                          isChecked
                            ? darkMode
                              ? 'bg-slate-800/70 border-slate-700 text-slate-200'
                              : 'bg-slate-50 border-slate-200 text-slate-800'
                            : darkMode
                            ? 'bg-slate-900/50 border-slate-800 text-slate-400'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        {isChecked ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        )}
                        <span className="leading-relaxed">{ms}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mother's Progress Rating Selector */}
              <div className="pt-3 border-t border-slate-200/70 dark:border-slate-800">
                <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-2">
                  {isBn
                    ? 'মায়ের মূল্যায়ন — এই ক্ষেত্রে শিশুর অগ্রগতি কেমন?'
                    : 'Mother’s Assessment — How is your child’s progress here?'}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleStatusChange(domain.id, 'on_track')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                      currentStatus === 'on_track'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : darkMode
                        ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-emerald-50'
                    }`}
                  >
                    {isBn ? '✓ সঠিক অগ্রগতি' : '✓ On Track'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange(domain.id, 'slow')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                      currentStatus === 'slow'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                        : darkMode
                        ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-amber-50'
                    }`}
                  >
                    {isBn ? '⚡ কিছুটা ধীর' : '⚡ Slightly Slow'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange(domain.id, 'low')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                      currentStatus === 'low'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : darkMode
                        ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-rose-50'
                    }`}
                  >
                    {isBn ? '⚠️ অগ্রগতি কম' : '⚠️ Needs Catch-Up'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dynamic Catch-Up Action Plan & Nutritional Suggestions Engine */}
      {laggingDomains.length > 0 ? (
        <div
          className={`p-6 md:p-8 rounded-3xl border-2 shadow-xl space-y-6 ${
            darkMode
              ? 'bg-gradient-to-br from-slate-900 via-amber-950/25 to-rose-950/25 border-amber-600/50'
              : 'bg-gradient-to-br from-amber-50/80 via-white to-rose-50/60 border-amber-300'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-amber-200/70 dark:border-amber-800/40">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-extrabold text-amber-700 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                <span>
                  {isBn
                    ? 'অগ্রগতি কম হলে করণীয় • স্মার্ট ক্যাচ-আপ পুষ্টি ও যত্ন ইঞ্জিন'
                    : 'Catch-Up Growth & Developmental Action Plan'}
                </span>
              </div>
              <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white">
                {isBn
                  ? `আপনার সন্তানের অগ্রগতি দ্রুত বাড়াতে করণীয় (${laggingDomains.length}টি ক্ষেত্র)`
                  : `Personalized Action Plan to Boost Your Child’s Progress (${laggingDomains.length} Area${
                      laggingDomains.length > 1 ? 's' : ''
                    })`}
              </h3>
            </div>
          </div>

          <div className="space-y-5">
            {laggingDomains.map((domain) => {
              const st = getDomainStatus(domain.id);
              const foods = isBn ? domain.catchUpFoodsBn : domain.catchUpFoodsEn;
              const actions = isBn ? domain.motherActionStepsBn : domain.motherActionStepsEn;
              const IconComp = domain.icon;

              return (
                <div
                  key={domain.id}
                  className={`p-5 rounded-2xl border space-y-4 ${
                    darkMode ? 'bg-slate-900/90 border-slate-700' : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <IconComp
                        className={`w-5 h-5 ${
                          st === 'low' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
                        }`}
                      />
                      <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                        {isBn ? domain.titleBn : domain.titleEn}
                      </h4>
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        st === 'low' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {st === 'low'
                        ? isBn
                          ? 'অগ্রগতি কম — নিবিড় পুষ্টি প্রয়োজন'
                          : 'Needs Intensive Catch-Up'
                        : isBn
                        ? 'কিছুটা ধীর — বাড়তি যত্ন প্রয়োজন'
                        : 'Slightly Slow — Needs Nutritional Boost'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Foods to Add Immediately */}
                    <div
                      className={`p-4 rounded-xl border ${
                        darkMode
                          ? 'bg-emerald-950/20 border-emerald-800/40'
                          : 'bg-emerald-50/60 border-emerald-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs mb-2.5">
                        <UtensilsCrossed className="w-4 h-4" />
                        <span>
                          {isBn
                            ? 'প্রতিদিনের খাবারে যা যা অবশ্যই যোগ করবেন:'
                            : 'Targeted Catch-Up Foods to Feed Daily:'}
                        </span>
                      </div>
                      <ul className="space-y-2">
                        {foods.map((f, i) => (
                          <li
                            key={i}
                            className="text-xs text-slate-700 dark:text-slate-200 flex items-start gap-2"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                            <span className="leading-relaxed">{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Mother's Daily Care & Lifestyle Actions */}
                    <div
                      className={`p-4 rounded-xl border ${
                        darkMode ? 'bg-sky-950/20 border-sky-800/40' : 'bg-sky-50/60 border-sky-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-sky-700 dark:text-sky-400 font-bold text-xs mb-2.5">
                        <HeartHandshake className="w-4 h-4" />
                        <span>
                          {isBn
                            ? 'মায়ের জন্য দৈনিক করণীয় ও যত্ন রুটিন:'
                            : 'Daily Care & Lifestyle Steps for Mother:'}
                        </span>
                      </div>
                      <ul className="space-y-2">
                        {actions.map((act, i) => (
                          <li
                            key={i}
                            className="text-xs text-slate-700 dark:text-slate-200 flex items-start gap-2"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0 mt-1.5" />
                            <span className="leading-relaxed">{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Clinical Advice Note */}
                  <div className="flex items-start gap-2.5 pt-1 text-xs text-slate-600 dark:text-slate-300">
                    <Stethoscope className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <p>
                      <strong className="text-slate-800 dark:text-slate-100">
                        {isBn ? 'চিকিৎসা পরামর্শ: ' : 'Clinical Checkpoint: '}
                      </strong>
                      {isBn ? domain.clinicalNoteBn : domain.clinicalNoteEn}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div
          className={`p-5 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
            darkMode
              ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
              : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <h4 className="text-sm font-extrabold">
                {isBn
                  ? 'অভিনন্দন! আপনার সন্তানের সব মাইলস্টোন সঠিক পথে আছে।'
                  : 'Great Job! All Developmental Domains Are Currently Marked On Track.'}
              </h4>
              <p className="text-xs opacity-80 mt-0.5">
                {isBn
                  ? 'যেকোনো ক্ষেত্রে অগ্রগতি কম মনে হলে উপরের কার্ড থেকে "কিছুটা ধীর" বা "অগ্রগতি কম" বাটনে ক্লিক করুন—অ্যাপ সাথে সাথে করণীয় ও খাবারের সাজেশন দেখাবে।'
                  : 'If you notice slow progress in weight, height, speech, or appetite, select "Slightly Slow" or "Needs Catch-Up" on any card above to view tailored action steps.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChildDevelopmentMilestones;
