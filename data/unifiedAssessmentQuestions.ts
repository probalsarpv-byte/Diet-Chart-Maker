import { CohortType, CohortQuestion, HealthProfile, AssessmentAnalysis } from '../types';
import { COHORT_QUESTIONS } from './cohortData';

export interface UnifiedQuestionOption {
  value: string;
  labelBn: string;
  labelEn: string;
  clinicalTag?: string;
}

export interface UnifiedQuestion {
  id: string;
  stepId: string;
  titleBn: string;
  titleEn: string;
  subtitleBn?: string;
  subtitleEn?: string;
  type: 'text' | 'number' | 'date' | 'textarea' | 'radio' | 'checkbox' | 'file';
  options?: UnifiedQuestionOption[];
  placeholderBn?: string;
  placeholderEn?: string;
  quickChips?: { labelBn: string; labelEn: string; value: string }[];
  required?: boolean;
  min?: number;
  max?: number;
  unit?: string;
}

export interface UnifiedAssessmentTab {
  id: string;
  badgeBn: string;
  badgeEn: string;
  titleBn: string;
  titleEn: string;
  subtitleBn: string;
  subtitleEn: string;
  icon: string;
  questions: UnifiedQuestion[];
}

// ============================================================================
// 1. FOUNDATIONAL CLINICAL QUESTIONS FOR ADULT / PREGNANCY / ONCOLOGY / ADOLESCENT
// (30–32 Core Questions + Female Focus + 8–10 Cohort/Disease Specific Questions)
// ============================================================================

export const ADULT_FOUNDATIONAL_QUESTIONS: Record<string, UnifiedQuestion[]> = {
  basic: [
    {
      id: 'basic_name',
      stepId: 'basic',
      titleBn: 'রোগী / ইউজারের পূর্ণ নাম',
      titleEn: 'Patient / User Full Name',
      subtitleBn: 'রিপোর্ট ও ডায়েট প্রেসক্রিপশনে এই নাম ব্যবহৃত হবে',
      subtitleEn: 'Used on your personalized clinical report and diet chart',
      type: 'text',
      placeholderBn: 'আপনার পূর্ণ নাম লিখুন...',
      placeholderEn: 'Enter full name...',
      required: true,
    },
    {
      id: 'basic_age',
      stepId: 'basic',
      titleBn: 'বয়স (বছর)',
      titleEn: 'Age (Years)',
      subtitleBn: 'বয়স অনুযায়ী BMR এবং মাইক্রোনিউট্রিয়েন্ট চাহিদা নির্ণয় করা হয়',
      subtitleEn: 'Calibrates basal metabolic rate and age-specific RDA',
      type: 'number',
      min: 1,
      max: 110,
      unit: 'Years',
      placeholderBn: 'যেমন: ৩২',
      placeholderEn: 'e.g. 32',
      required: true,
    },
    {
      id: 'basic_gender',
      stepId: 'basic',
      titleBn: 'লিঙ্গ (Biological Sex)',
      titleEn: 'Biological Sex / Gender',
      subtitleBn: 'মহিলা নির্বাচন করলে হরমোনাল ও পিরিয়ড সাইকেল সিঙ্ক (Shakti) প্রশ্নগুলো যুক্ত হবে',
      subtitleEn: 'Selecting Female unlocks the Shakti Cycle & Reproductive Hormone questions',
      type: 'radio',
      required: true,
      options: [
        { value: 'Female', labelBn: 'মহিলা (Female)', labelEn: 'Female' },
        { value: 'Male', labelBn: 'পুরুষ (Male)', labelEn: 'Male' },
        { value: 'Other', labelBn: 'অন্যান্য (Other)', labelEn: 'Other' },
      ],
    },
    {
      id: 'basic_profession',
      stepId: 'basic',
      titleBn: 'পেশা ও দৈনন্দিন শারীরিক পরিশ্রমের ধরন',
      titleEn: 'Occupation & Daily Physical Activity Level',
      subtitleBn: 'আপনার সারাদিনের ক্যালোরি খরচের মাত্রা বুঝতে সাহায্য করে',
      subtitleEn: 'Determines total daily energy expenditure (TDEE)',
      type: 'radio',
      required: true,
      options: [
        { value: 'Sedentary Desk Job', labelBn: 'ডেস্ক জব / বসে কাজ করা (কম কায়িক পরিশ্রম)', labelEn: 'Sedentary Desk / Office Job' },
        { value: 'Homemaker', labelBn: 'গৃহিণী / ঘরের নিয়মিত কাজ (মাঝারি পরিশ্রম)', labelEn: 'Homemaker / Moderate Household Activity' },
        { value: 'Student', labelBn: 'শিক্ষার্থী / পড়াশোনা ও যাতায়াত', labelEn: 'Student / Academic Routine' },
        { value: 'Working Professional', labelBn: 'ফিল্ড ওয়ার্ক / সক্রিয় পেশাজীবী', labelEn: 'Active / Field Professional' },
        { value: 'Heavy Physical', labelBn: 'উচ্চ শারীরিক পরিশ্রম / অ্যাথলেট', labelEn: 'High Physical Labor / Athlete' },
        { value: 'Retired', labelBn: 'অবসরপ্রাপ্ত / বিশ্রামে থাকা', labelEn: 'Retired / Restorative Routine' },
      ],
    },
    {
      id: 'basic_height',
      stepId: 'basic',
      titleBn: 'উচ্চতা (সেন্টিমিটার - cm)',
      titleEn: 'Height (in cm)',
      subtitleBn: 'নিচের ফুট-ইঞ্চি কনভার্টার ব্যবহার করে সহজেই সেন্টিমিটার বের করতে পারেন',
      subtitleEn: 'Use the built-in Feet/Inches converter below if you know your height in feet',
      type: 'number',
      min: 60,
      max: 230,
      unit: 'cm',
      placeholderBn: 'যেমন: ১৬২',
      placeholderEn: 'e.g. 162',
      required: true,
    },
    {
      id: 'basic_weight',
      stepId: 'basic',
      titleBn: 'বর্তমান ওজন (কেজি - kg)',
      titleEn: 'Current Weight (in kg)',
      subtitleBn: 'BMI, আইডিয়াল বডি ওয়েট ও প্রোটিন চাহিদা নির্ণয়ের জন্য অপরিহার্য',
      subtitleEn: 'Required for BMI, Ideal Body Weight (IBW), and daily protein calculation',
      type: 'number',
      min: 8,
      max: 220,
      unit: 'kg',
      placeholderBn: 'যেমন: ৬৫',
      placeholderEn: 'e.g. 65',
      required: true,
    },
  ],

  shakti: [
    {
      id: 'shakti_last_period',
      stepId: 'shakti',
      titleBn: 'শেষ মাসিকের প্রথম তারিখ (Last Menstrual Period - LMP)',
      titleEn: 'First Day of Last Menstrual Period (LMP Date)',
      subtitleBn: 'আপনার বর্তমান হরমোনাল ফেজ (Follicular / Ovulatory / Luteal / Menstrual) বা গর্ভাবস্থার সপ্তাহ নির্ণয়ে ব্যবহৃত হবে',
      subtitleEn: 'Calculates your active cycle phase or gestational timeline for seed cycling & iron/magnesium sync',
      type: 'date',
      required: false,
    },
    {
      id: 'shakti_cycle_length',
      stepId: 'shakti',
      titleBn: 'মাসিক চক্রের গড় ব্যবধান ও নিয়মিততা (Cycle Length)',
      titleEn: 'Average Menstrual Cycle Length & Regularity',
      subtitleBn: 'ওভুলেশন এবং প্রোজেস্টেরন-ইস্ট্রোজেন ভারসাম্য বোঝার জন্য',
      subtitleEn: 'Assesses ovulatory rhythm and estrogen-progesterone balance',
      type: 'radio',
      required: true,
      options: [
        { value: '28', labelBn: 'নিয়মিত (২৬–৩০ দিন পর পর)', labelEn: 'Regular (Every 26–30 days)' },
        { value: '32', labelBn: 'দেরিতে হয় (৩১–৩৫+ দিন পর পর / Oligomenorrhea)', labelEn: 'Delayed / Long Cycle (31–35+ days)' },
        { value: '22', labelBn: 'খুব দ্রুত হয় (২১–২৪ দিন পর পর)', labelEn: 'Short / Frequent Cycle (21–24 days)' },
        { value: '38', labelBn: 'অনিয়মিত / ২–৩ মাস বন্ধ থাকে (Irregular)', labelEn: 'Highly Irregular / Skips Months' },
        { value: '0', labelBn: 'বর্তমানে গর্ভবতী / স্তন্যদাত্রী অথবা মেনোপজ হয়েছে', labelEn: 'Currently Pregnant / Lactating / Post-Menopause' },
      ],
    },
    {
      id: 'shakti_flow_pain',
      stepId: 'shakti',
      titleBn: 'মাসিকের সময় রক্তক্ষরণের মাত্রা ও ব্যথার ধরন',
      titleEn: 'Menstrual Flow Volume & Cramps Severity',
      subtitleBn: 'আয়রন ঘাটতি এবং পেলভিক ইনফ্লামেশন যাচাইয়ের জন্য',
      subtitleEn: 'Evaluates risk of iron-deficiency anemia and prostaglandin-driven cramps',
      type: 'radio',
      required: true,
      options: [
        { value: 'normal_mild', labelBn: 'স্বাভাবিক প্রবাহ ও সামান্য সহনীয় ব্যথা', labelEn: 'Normal flow with minimal/manageable cramps' },
        { value: 'heavy_clots', labelBn: 'অতিরিক্ত রক্তক্ষরণ বা চাকা চাকা রক্ত (Heavy Flow / Clots)', labelEn: 'Heavy bleeding or blood clots (Menorrhagia)' },
        { value: 'scanty_spotted', labelBn: 'খুবই কম রক্তক্ষরণ বা ১–২ দিনে শেষ (Scanty Flow)', labelEn: 'Very light / scanty flow (1–2 days)' },
        { value: 'severe_dysmenorrhea', labelBn: 'তীব্র পেট-কোমর ব্যথা (ওষুধ ছাড়া চলা যায় না)', labelEn: 'Severe debilitating cramps (Dysmenorrhea)' },
        { value: 'not_applicable', labelBn: 'প্রযোজ্য নয় (গর্ভবতী / মেনোপজ)', labelEn: 'Not Applicable (Pregnant / Menopause)' },
      ],
    },
    {
      id: 'shakti_pcos',
      stepId: 'shakti',
      titleBn: 'হরমোনাল বা গাইনোকোলজিক্যাল সমস্যা আছে কি? (PCOS / থাইরয়েড / অন্যান্য)',
      titleEn: 'Diagnosed Gynecological or Hormonal Conditions',
      subtitleBn: 'ইনসুলিন রেজিস্ট্যান্স ও এন্ড্রোজেন কমানোর বিশেষ ডায়েট প্রটোকল যুক্ত হবে',
      subtitleEn: 'Triggers specialized inositol, spearmint, and low-glycemic hormone protocols',
      type: 'checkbox',
      required: true,
      options: [
        { value: 'Yes_PCOS', labelBn: 'পিসিওএস / পিসিওডি (PCOS / PCOD)', labelEn: 'PCOS / PCOD (Polycystic Ovaries)' },
        { value: 'Thyroid_Cycle', labelBn: 'হাইপোথাইরয়েডিজম ও হরমোনাল ওজন বৃদ্ধি', labelEn: 'Hypothyroidism with Cycle Imbalance' },
        { value: 'Endometriosis_Fibroids', labelBn: 'এন্ডোমেট্রিওসিস / জরায়ুতে ফাইব্রয়েড বা সিস্ট', labelEn: 'Endometriosis / Uterine Fibroids / Ovarian Cyst' },
        { value: 'Facial_Hair_Acne', labelBn: 'মুখে অবাঞ্ছিত লোম (Hirsutism), মাথার চুল পড়া বা হরমোনাল ব্রণ', labelEn: 'Chin hair growth (Hirsutism), hair thinning, or jawline acne' },
        { value: 'Leucorrhea_UTI', labelBn: 'সাদাস্রাব (Leucorrhea) বা বারবার ইউরিন ইনফেকশন', labelEn: 'Recurrent white discharge (Leucorrhea) or UTI' },
        { value: 'none', labelBn: 'কোনোটিই নেই (None)', labelEn: 'None of the above' },
      ],
    },
    {
      id: 'shakti_pms',
      stepId: 'shakti',
      titleBn: 'মাসিকের আগে (PMS / Luteal Phase) কোন লক্ষণগুলো বেশি দেখা দেয়?',
      titleEn: 'Pre-Menstrual (PMS / Luteal Phase) Symptoms',
      subtitleBn: 'ম্যাগনেসিয়াম, ভিটামিন B6 এবং প্রদাহনাশক খাবার নির্বাচনের জন্য',
      subtitleEn: 'Calibrates luteal-phase magnesium, B6, and anti-bloating support',
      type: 'checkbox',
      required: true,
      options: [
        { value: 'mood_irritability', labelBn: 'তীব্র মেজাজ খিটখিটে হওয়া, কান্না পাওয়া বা অস্থিরতা', labelEn: 'Mood swings, irritability, or anxiety' },
        { value: 'bloating_breast_pain', labelBn: 'পেট ফাঁপা, শরীরে পানি জমা বা স্তনে ব্যথা', labelEn: 'Water retention, bloating, or breast tenderness' },
        { value: 'sweet_cravings', labelBn: 'মিষ্টি, চকলেট বা কার্বোহাইড্রেট খাওয়ার তীব্র ইচ্ছা', labelEn: 'Intense cravings for sweets, chocolate, or carbs' },
        { value: 'headache_fatigue', labelBn: 'মাইগ্রেন/মাথাব্যথা ও প্রচণ্ড ক্লান্তি', labelEn: 'Pre-menstrual headache/migraine and fatigue' },
        { value: 'none', labelBn: 'বিশেষ কোনো সমস্যা হয় না', labelEn: 'No significant PMS symptoms' },
      ],
    },
  ],

  diet_habit: [
    {
      id: 'diet_breakfast',
      stepId: 'diet_habit',
      titleBn: 'সকালের নাস্তায় সাধারণত কী খান এবং কয়টায় খান?',
      titleEn: 'What do you typically eat for Breakfast & at what time?',
      subtitleBn: 'নিচের অপশন ট্যাপ করুন অথবা নিজের ভাষায় লিখুন',
      subtitleEn: 'Tap quick presets below or describe in your own words',
      type: 'textarea',
      required: true,
      placeholderBn: 'যেমন: সকাল ৮:৩০ — ২টি লাল আটার রুটি, সবজি ভাজি, ১টি ডিম সিদ্ধ ও দুধ চা...',
      placeholderEn: 'e.g. 8:30 AM — 2 whole wheat rotis, mixed veg, 1 boiled egg, milk tea...',
      quickChips: [
        { labelBn: 'রুটি + সবজি + ডিম', labelEn: 'Roti + Veg + Egg', value: '২টি আটার রুটি, সবজি ও ১টি ডিম (2 Rotis, Veg & 1 Egg)' },
        { labelBn: 'ভাত + ডাল + ভর্তা/ডিম', labelEn: 'Rice + Dal + Egg/Bharta', value: 'সকালে ভাত, ডাল, ভর্তা ও ডিম (Morning Rice, Dal, Bharta & Egg)' },
        { labelBn: 'ওটস / চিড়া + কলা/দুধ', labelEn: 'Oats / Chira + Milk', value: 'ওটস বা চিড়া, দুধ/দই ও কলা (Oats or Flattened Rice with Milk/Curd)' },
        { labelBn: 'পরোটা + ডাল/ভাজি + চা', labelEn: 'Paratha + Bhaji + Tea', value: 'পরোটা/লুচি, ভাজি ও দুধ চা (Paratha, Fried Veg & Milk Tea)' },
        { labelBn: 'সকালে নাস্তা স্কিপ করি', labelEn: 'Usually Skip Breakfast', value: 'সকালে প্রায়ই নাস্তা খাওয়া হয় না, শুধু চা/কফি (Skip breakfast, only tea/coffee)' },
      ],
    },
    {
      id: 'diet_midmorning',
      stepId: 'diet_habit',
      titleBn: 'সকালের মধ্যবর্তী সময়ে (সকাল ১১টা–১২টা) কী খাওয়া হয়?',
      titleEn: 'Mid-Morning Habits (Around 11:00 AM)',
      subtitleBn: 'ফল, বিস্কুট, চা বা খালি পেটে থাকেন কিনা উল্লেখ করুন',
      subtitleEn: 'Mention fruits, biscuits, tea/coffee, or if you fast until lunch',
      type: 'textarea',
      required: true,
      placeholderBn: 'যেমন: ১ কাপ রং চা ও ২টা বিস্কুট অথবা মৌসুমী ফল...',
      placeholderEn: 'e.g. 1 cup tea with biscuits, or seasonal fruit / nuts...',
      quickChips: [
        { labelBn: 'মৌসুমী ফল / ডাবের পানি', labelEn: 'Seasonal Fruit / Coconut Water', value: 'মৌসুমী ফল বা ডাবের পানি (Seasonal fruit or coconut water)' },
        { labelBn: 'চা/কফি + বিস্কুট', labelEn: 'Tea/Coffee + Biscuits', value: 'চা বা কফির সাথে ২-৩টি বিস্কুট (Tea/Coffee with biscuits)' },
        { labelBn: 'বাদাম ও বীজ (Nuts/Seeds)', labelEn: 'Mixed Nuts & Seeds', value: 'কাঠবাদাম, আখরোট বা বীজ (Almonds, walnuts, seeds)' },
        { labelBn: 'কিছুই খাই না', labelEn: 'Nothing between breakfast & lunch', value: 'দুপুরের আগে আর কিছু খাওয়া হয় না (Nothing taken mid-morning)' },
      ],
    },
    {
      id: 'diet_lunch',
      stepId: 'diet_habit',
      titleBn: 'দুপুরের খাবারে সাধারণত কী কী থাকে এবং পরিমাণ কেমন?',
      titleEn: 'Typical Lunch Composition, Portion & Timing',
      subtitleBn: 'ভাতের পরিমাণ (কত কাপ), মাছ/মাংস, ডাল ও শাকসবজির অনুপাত',
      subtitleEn: 'Rice/roti portion, fish/meat source, dal, and vegetable intake',
      type: 'textarea',
      required: true,
      placeholderBn: 'যেমন: দুপুর ২টা — ২ কাপ সাদা ভাত, মাছ/মুরগি ১ টুকরো, ডাল ও শাকসবজি...',
      placeholderEn: 'e.g. 2:00 PM — 2 cups white rice, 1 piece fish/chicken, dal, leafy greens...',
      quickChips: [
        { labelBn: 'বেশি ভাত + মাছ/মাংস + ডাল', labelEn: 'Large Rice + Fish/Meat + Dal', value: '২-৩ কাপ সাদা ভাত, মাছ বা মাংস, ঘন ডাল ও সামান্য সবজি (2-3 cups rice, fish/meat, dal)' },
        { labelBn: 'পরিমিত ভাত (১ কাপ) + প্রচুর সবজি + মাছ', labelEn: '1 Cup Rice + Plenty Veg + Fish', value: '১ কাপ ভাত, প্রচুর শাকসবজি, সালাদ ও মাছ/ডিম (1 cup rice, plenty of veg, salad, fish)' },
        { labelBn: 'অফিস ক্যান্টিন / বাইরের খাবার', labelEn: 'Office Canteen / Outside Meals', value: 'অফিসে বা বাইরে ক্যান্টিনের ভাত/বিরিয়ানি/ফাস্টফুড (Canteen or restaurant lunch)' },
        { labelBn: 'রুটি + সবজি + মুরগি/মাছ', labelEn: 'Roti + Veg + Chicken/Fish', value: 'দুপুরে রুটি, সবজি ও মুরগি/মাছ (Roti, vegetables & lean protein)' },
      ],
    },
    {
      id: 'diet_afternoon',
      stepId: 'diet_habit',
      titleBn: 'বিকেল বা সন্ধ্যার নাস্তায় (৪টা–৬টা) কী খান?',
      titleEn: 'Afternoon / Evening Snack Habits (4:00–6:00 PM)',
      subtitleBn: 'এই সময়ে ভাজাপোড়া বা চিনিযুক্ত চা ইনসুলিন স্পাইকের প্রধান কারণ',
      subtitleEn: 'Evening snacks strongly impact late-day glucose and cortisol curve',
      type: 'textarea',
      required: true,
      placeholderBn: 'যেমন: দুধ চা, সিঙ্গারা/সমুচা, মুড়ি চানাচুর বা ছোলা...',
      placeholderEn: 'e.g. Milk tea, samosa/singara, puffed rice (muri) with chanachur...',
      quickChips: [
        { labelBn: 'দুধ চা + বিস্কুট/চানাচুর/মুড়ি', labelEn: 'Milk Tea + Muri/Chanachur/Biscuit', value: 'দুধ চা, মুড়ি-চানাচুর বা বিস্কুট (Milk tea with muri/chanachur/biscuits)' },
        { labelBn: 'সিঙ্গারা / সমুচা / ভাজাপোড়া / নুডলস', labelEn: 'Fried Snacks / Singara / Noodles', value: 'সিঙ্গারা, সমুচা, পুরি বা নুডলস (Fried snacks or instant noodles)' },
        { labelBn: 'ছোলা / বাদাম / গ্রিন টি / শসা', labelEn: 'Chickpeas / Nuts / Green Tea', value: 'সিদ্ধ ছোলা, বাদাম, শসা বা গ্রিন টি (Boiled chickpeas, nuts, green tea)' },
        { labelBn: 'বিকেলে কিছু খাই না', labelEn: 'Skip Evening Snack', value: 'বিকেলে সাধারণত কিছু খাওয়া হয় না (No evening snacks)' },
      ],
    },
    {
      id: 'diet_dinner',
      stepId: 'diet_habit',
      titleBn: 'রাতের খাবার কয়টায় খান এবং কী কী থাকে?',
      titleEn: 'Dinner Timing & Typical Foods',
      subtitleBn: 'রাতের খাবারের সময় এবং ঘুমানোর সময়ের ব্যবধান ফ্যাটি লিভার ও সুগারের জন্য অত্যন্ত গুরুত্বপূর্ণ',
      subtitleEn: 'Gap between dinner and sleep directly governs nocturnal hepatic glucose output',
      type: 'textarea',
      required: true,
      placeholderBn: 'যেমন: রাত ১০টায় ভাত/রুটি, মাছ বা মাংস, রাত ১২টায় ঘুম...',
      placeholderEn: 'e.g. 10:00 PM rice or roti with curry, sleep around midnight...',
      quickChips: [
        { labelBn: 'রাত ৮–৯টার মধ্যে হালকা রুটি/সবজি/মাছ', labelEn: 'Early Dinner (8–9 PM) Roti/Veg/Fish', value: 'রাত ৮:৩০-এর মধ্যে রুটি বা অল্প ভাত, সবজি ও মাছ (Early light dinner by 8:30 PM)' },
        { labelBn: 'রাত ১০–১১টায় দেরি করে ভাত ও কারি', labelEn: 'Late Dinner (10–11 PM) Rice & Curry', value: 'রাত ১০-১১টায় পেট ভরে ভাত, মাছ/মাংস ও ডাল (Late heavy rice dinner at 10-11 PM)' },
        { labelBn: 'স্যুপ / সালাদ / প্রোটিন ডিনার', labelEn: 'Soup / Salad / Low-Carb Dinner', value: 'রাতের খাবারে স্যুপ, সবজি ও গ্রিলড মাছ/মুরগি (Soup, vegetables & protein)' },
      ],
    },
    {
      id: 'diet_fluid',
      stepId: 'diet_habit',
      titleBn: 'সারাদিনে কত গ্লাস পানি পান করেন এবং চা/কফি/সফট ড্রিংকসের হিসাব',
      titleEn: 'Daily Water Intake & Beverages (Tea, Coffee, Soft Drinks)',
      subtitleBn: 'সেলুলার হাইড্রেশন ও অ্যাসিড-অ্যালকালাইন ব্যালেন্স নির্ণয়ের জন্য',
      subtitleEn: 'Evaluates cellular hydration and liquid sugar load',
      type: 'textarea',
      required: true,
      placeholderBn: 'যেমন: প্রতিদিন ৮–১০ গ্লাস পানি, ২ কাপ দুধ চা, মাঝে মাঝে কোল্ড ড্রিংকস...',
      placeholderEn: 'e.g. 8-10 glasses water, 2 cups milk tea, occasional soda...',
      quickChips: [
        { labelBn: 'পর্যাপ্ত পানি (৮–১২ গ্লাস) + চিনি ছাড়া চা', labelEn: '8–12 Glasses Water + Unsweetened Tea', value: 'প্রতিদিন ৮-১২ গ্লাস পানি এবং চিনি ছাড়া রং চা/গ্রিন টি (8-12 glasses water, no-sugar tea)' },
        { labelBn: 'কম পানি (৪–৬ গ্লাস) + ২–৩ কাপ দুধ-চিনি চা', labelEn: 'Low Water (4–6 Glasses) + 2–3 Cups Sweet Milk Tea', value: 'পানি কম খাওয়া হয় (৪-৬ গ্লাস), দিনে ২-৩ কাপ দুধ-চিনি চা বা কফি (Low water, 2-3 cups sweet milk tea)' },
        { labelBn: 'কোল্ড ড্রিংকস / প্যাকেট জুস নিয়মিত খাই', labelEn: 'Frequent Soft Drinks / Packaged Juice', value: 'মাঝে মাঝেই কোল্ড ড্রিংকস, এনার্জি ড্রিংক বা মিষ্টি পানীয় খাওয়া হয় (Frequent soft drinks/juices)' },
      ],
    },
  ],

  physical: [
    {
      id: 'physical_1',
      stepId: 'physical',
      titleBn: '১. আপনার বর্তমান ঘুমের ধরন কেমন? (Sleep Pattern - Vikriti)',
      titleEn: '1. Current Sleep Pattern & Quality (Ayurvedic Vikriti)',
      subtitleBn: 'দোষের বর্তমান ভারসাম্যহীনতা (বাত / পিত্ত / কফ) নির্ণয়ের প্রশ্ন',
      subtitleEn: 'Identifies current Vata, Pitta, or Kapha predominance in the nervous system',
      type: 'radio',
      required: true,
      options: [
        { value: 'Vata', labelBn: 'হালকা ঘুম, বারবার ভেঙে যায় বা সহজে ঘুম আসতে চায় না (বাতজ)', labelEn: 'Light, interrupted sleep or difficulty falling asleep (Vata)' },
        { value: 'Pitta', labelBn: 'মাঝারি ঘুম, কিন্তু শরীরে গরম লাগা, তৃষ্ণা বা তীব্র স্বপ্নে ঘুম ভাঙে (পিত্তজ)', labelEn: 'Moderate sleep, but wake up feeling hot, thirsty, or restless (Pitta)' },
        { value: 'Kapha', labelBn: 'গভীর ও দীর্ঘ ঘুম, কিন্তু সকালে ঘুম থেকে উঠতে ভারী ও অলস লাগে (কফজ)', labelEn: 'Heavy, prolonged sleep; feel groggy or sluggish waking up (Kapha)' },
      ],
    },
    {
      id: 'physical_2',
      stepId: 'physical',
      titleBn: '২. মানসিক চাপের সময় আপনার আবেগীয় প্রতিক্রিয়া কেমন হয়?',
      titleEn: '2. Current Emotional & Stress Response',
      subtitleBn: 'গاط-ব্রেইন অ্যাক্সিস (Gut-Brain Axis) ও কর্টিসল প্যাটার্ন নির্ণয়ের জন্য',
      subtitleEn: 'Maps HPA-axis cortisol response and Ayurvedic Manas Prakriti',
      type: 'radio',
      required: true,
      options: [
        { value: 'Vata', labelBn: 'দ্রুত উদ্বেগ, দুশ্চিন্তা, ভয় বা অতিরিক্ত চিন্তা (Overthinking - বাত)', labelEn: 'Anxious, worried, fearful, or overthinking (Vata)' },
        { value: 'Pitta', labelBn: 'খিটখিটে মেজাজ, রাগ, অধৈর্য বা সমালোচনামূলক মনোভাব (পিত্ত)', labelEn: 'Irritable, impatient, frustrated, or perfectionist (Pitta)' },
        { value: 'Kapha', labelBn: 'নীরব হয়ে যাওয়া, অলসতা, উদ্যমহীনতা বা বিষণ্ণ ভাব (কফ)', labelEn: 'Withdrawn, unmotivated, emotionally heavy, or sluggish (Kapha)' },
      ],
    },
    {
      id: 'physical_3',
      stepId: 'physical',
      titleBn: '৩. শারীরিক তাপমাত্রা ও আবহাওয়ার প্রতি সংবেদনশীলতা কেমন?',
      titleEn: '3. Body Temperature & Weather Sensitivity',
      subtitleBn: 'থাইরয়েড ও সেলুলার থার্মোজেনেসিস যাচাইয়ের জন্য',
      subtitleEn: 'Reflects cellular thermogenesis and peripheral circulation',
      type: 'radio',
      required: true,
      options: [
        { value: 'Vata', labelBn: 'সহজেই শীত লাগে, হাত ও পায়ের পাতা প্রায়ই ঠান্ডা থাকে (বাত)', labelEn: 'Feel cold easily; hands and feet are often cold (Vata)' },
        { value: 'Pitta', labelBn: 'সবসময় গরম লাগে, অতিরিক্ত ঘাম হয় এবং গরম আবহাওয়া অসহ্য লাগে (পিত্ত)', labelEn: 'Feel warm/hot easily; sweat profusely and dislike heat (Pitta)' },
        { value: 'Kapha', labelBn: 'শরীর স্বাভাবিক বা ঠান্ডা থাকে, কিন্তু বর্ষা বা স্যাঁতসেঁতে আবহাওয়ায় শ্লেষ্মা বাড়ে (কফ)', labelEn: 'Cool/clammy skin; feel congested in damp or cold weather (Kapha)' },
      ],
    },
    {
      id: 'physical_4',
      stepId: 'physical',
      titleBn: '৪. আপনার ত্বক, ঠোঁট ও চুলের বর্তমান অবস্থা কেমন?',
      titleEn: '4. Current Skin, Lip & Hair Texture',
      subtitleBn: 'ফ্যাটি অ্যাসিড ঘাটতি ও পিত্ত প্রদাহের বাহ্যিক লক্ষণ',
      subtitleEn: 'External biomarker of lipid barrier, tissue hydration, and Pitta heat',
      type: 'radio',
      required: true,
      options: [
        { value: 'Vata', labelBn: 'শুষ্ক ও রুক্ষ ত্বক, ঠোঁট/পায়ের গোড়ালি ফাটা, চুল শুষ্ক ও ভঙ্গুর (বাত)', labelEn: 'Dry, rough skin, cracked lips/heels, dry or frizzy hair (Vata)' },
        { value: 'Pitta', labelBn: 'সংবেদনশীল ও লালচে ত্বক, ব্রণ/র‍্যাশ, অকাল পক্বতা বা চুল পড়া (পিত্ত)', labelEn: 'Sensitive, reddish skin, prone to acne/rashes or hair thinning (Pitta)' },
        { value: 'Kapha', labelBn: 'তৈলাক্ত ও পুরু ত্বক, লোমকূপ বন্ধ হওয়া বা মুখে ফোলা ভাব (কফ)', labelEn: 'Oily, thick, or congested skin with occasional puffiness (Kapha)' },
      ],
    },
    {
      id: 'physical_5',
      stepId: 'physical',
      titleBn: '৫. সারাদিনে আপনার শারীরিক শক্তির (Stamina & Energy) ছন্দ কেমন?',
      titleEn: '5. Daily Stamina & Energy Rhythm',
      subtitleBn: 'অ্যাড্রিনাল রিজার্ভ ও মাইটোকন্ড্রিয়াল শক্তির নির্দেশক',
      subtitleEn: 'Evaluates mitochondrial endurance and adrenal rhythm',
      type: 'radio',
      required: true,
      options: [
        { value: 'Vata', labelBn: 'শক্তি হঠাৎ বাড়ে আবার দ্রুত ক্লান্ত হয়ে পড়ি (ওঠানামা করে - বাত)', labelEn: 'Fluctuating bursts of energy followed by sudden exhaustion (Vata)' },
        { value: 'Pitta', labelBn: 'কাজে তীব্র গতি থাকে, কিন্তু অতিরিক্ত চাপে বার্নআউট বা মাথা গরম হয় (পিত্ত)', labelEn: 'Intense, driven energy, but prone to burnout if pushed too hard (Pitta)' },
        { value: 'Kapha', labelBn: 'কাজ শুরু করতে আলস্য লাগে, তবে একবার শুরু করলে দীর্ঘক্ষণ স্থায়ী হয় (কফ)', labelEn: 'Slow to start in the morning, but steady endurance once moving (Kapha)' },
      ],
    },
  ],

  digestion: [
    {
      id: 'digestion_1',
      stepId: 'digestion',
      titleBn: '১. খাবার খাওয়ার পর পেট ফাঁপা, গ্যাস বা ঢেকুর ওঠার হার কেমন?',
      titleEn: '1. Frequency of Bloating, Gas, or Belching After Meals',
      subtitleBn: 'গাট ডিসবায়োসিস (SIBO) এবং হাইপোঅ্যাসিডিটি নির্ণয়ের প্রধান প্রশ্ন',
      subtitleEn: 'Key indicator of gut fermentation, SIBO, or low stomach acid (Hypochlorhydria)',
      type: 'radio',
      required: true,
      options: [
        { value: 'a', labelBn: 'খুবই কম / খাবার সুন্দরভাবে হজম হয়', labelEn: 'Rarely / Meals digest comfortably' },
        { value: 'b', labelBn: 'মাঝে মাঝে (বিশেষ করে ডাল, দুধ বা গুরুপাক খাবারের পর)', labelEn: 'Occasionally (especially after pulses, dairy, or heavy meals)' },
        { value: 'c', labelBn: 'প্রায় প্রতিদিনই পেট ফেঁপে থাকে, গ্যাস বা অম্বল হয়', labelEn: 'Frequently / Almost daily bloating, gas, or acid reflux' },
      ],
    },
    {
      id: 'digestion_2',
      stepId: 'digestion',
      titleBn: '২. সকালে ঘুম থেকে ওঠার পর জিভের ওপর কেমন আস্তরণ (Tongue Coating / Ama) দেখা যায়?',
      titleEn: '2. Morning Tongue Coating (Ayurvedic Ama / Gut Toxin Check)',
      subtitleBn: 'আয়ুর্বেদে জিভের প্রলেপ হলো অন্ত্রের অপাক্ক টক্সিন (আম)-এর সরাসরি আয়না',
      subtitleEn: 'Reflects overnight digestive clearance and microbial biofilm status',
      type: 'radio',
      required: true,
      options: [
        { value: 'a', labelBn: 'জিভ পরিষ্কার ও হালকা গোলাপি থাকে (কোনো আস্তরণ নেই)', labelEn: 'Clean, pink tongue with no noticeable coating' },
        { value: 'b', labelBn: 'পাতলা সাদা আস্তরণ থাকে (মৃদু আম / মন্থর হজম)', labelEn: 'Thin white coating in the morning' },
        { value: 'c', labelBn: 'পুরু সাদা বা হলদেটে প্রলেপ এবং মুখে দুর্গন্ধ বা তিতা ভাব থাকে (তীব্র আম)', labelEn: 'Thick white/yellowish coating with metallic or bitter taste' },
      ],
    },
    {
      id: 'digestion_3',
      stepId: 'digestion',
      titleBn: '৩. আপনার ক্ষুধার ধরন ও হজমশক্তি (Jatharagni) কেমন?',
      titleEn: '3. Appetite Consistency & Digestive Fire (Agni)',
      subtitleBn: 'বিষমাগ্নি (বাত), তীক্ষ্ণাগ্নি (পিত্ত) নাকি মন্দাগ্নি (কফ) যাচাইয়ের জন্য',
      subtitleEn: 'Classifies Agni into Sama, Vishama, Tikshna, or Manda Agni',
      type: 'radio',
      required: true,
      options: [
        { value: 'a', labelBn: 'অনিয়মিত — কখনো প্রচণ্ড ক্ষুধা, আবার কখনো একেবারেই ক্ষুধা থাকে না (বিষমাগ্নি)', labelEn: 'Variable — sometimes ravenous, other times no appetite (Vishama Agni)' },
        { value: 'b', labelBn: 'তীব্র ক্ষুধা — খাবার একটু দেরি হলেই বুক জ্বালাপোড়া বা রাগ হয় (তীক্ষ্ণাগ্নি)', labelEn: 'Strong/Sharp — get acidity or irritable if meals are delayed (Tikshna Agni)' },
        { value: 'c', labelBn: 'কম বা ধীর — অল্প খেলেই পেট অনেকক্ষণ ভারী হয়ে থাকে (মন্দাগ্নি)', labelEn: 'Low/Slow — feel full for hours even after small meals (Manda Agni)' },
      ],
    },
    {
      id: 'digestion_4',
      stepId: 'digestion',
      titleBn: '৪. মলের ঘনত্ব ও বাওয়েল মুভমেন্ট কেমন? (Bristol Stool Scale)',
      titleEn: '4. Stool Consistency & Bowel Regularity (Bristol Scale)',
      subtitleBn: 'মাইক্রোবায়োম ট্রানজিট টাইম ও ফাইবার টলারেন্স নির্ণয়ের জন্য',
      subtitleEn: 'Determines gut motility, soluble vs insoluble fiber needs, and mucosal health',
      type: 'radio',
      required: true,
      options: [
        { value: 'a', labelBn: 'শক্ত বা কষা ভাব, প্রতিদিন পরিষ্কার হয় না (Bristol Type 1–2 / Constipation)', labelEn: 'Hard lumps or constipation; incomplete evacuation (Type 1–2)' },
        { value: 'b', labelBn: 'স্বাভাবিক, মসৃণ ও প্রতিদিন সকালে নিয়মিত পরিষ্কার হয় (Bristol Type 3–4)', labelEn: 'Smooth, well-formed, easy daily bowel movement (Type 3–4 Optimal)' },
        { value: 'c', labelBn: 'নরম, বারবার যাওয়ার প্রবণতা, মিউকাস বা আইবিএস-ডি (Bristol Type 5–7 / Loose)', labelEn: 'Loose, mushy, urgent, or multiple times after eating (Type 5–7 / IBS-D)' },
      ],
    },
    {
      id: 'digestion_5',
      stepId: 'digestion',
      titleBn: '৫. দুধ, টক দই বা ফার্মেন্টেড (গাঁজনযুক্ত) খাবারে পেটের প্রতিক্রিয়া কেমন?',
      titleEn: '5. Reaction to Dairy, Curd & Fermented Probiotic Foods',
      subtitleBn: 'ল্যাকটোজ ইনটলারেন্স ও হিস্টামিন/প্রোবায়োটিক সহনশীলতা যাচাই',
      subtitleEn: 'Screens for lactose intolerance, histamine sensitivity, or probiotic responsiveness',
      type: 'radio',
      required: true,
      options: [
        { value: 'b', labelBn: 'টক দই বা প্রোবায়োটিক খেলে হজম ভালো হয় ও পেট আরাম পায়', labelEn: 'Curd and fermented foods improve my digestion and comfort' },
        { value: 'a', labelBn: 'দুধ বা দুগ্ধজাত খাবার খেলে পেট ফাঁপে, গ্যাস বা পাতলা পায়খানা হয়', labelEn: 'Milk or dairy triggers bloating, gas, cramps, or loose motion' },
        { value: 'c', labelBn: 'তেমন কোনো বিশেষ পরিবর্তন বুঝতে পারি না', labelEn: 'No noticeable discomfort or change' },
      ],
    },
  ],

  metabolism_inflammation: [
    {
      id: 'metabolism_1',
      stepId: 'metabolism_inflammation',
      titleBn: '১. দুপুরের বা ভারী খাবারের ১–২ ঘণ্টা পর আপনার শরীর ও মস্তিষ্কের অনুভূতি কেমন হয়?',
      titleEn: '1. Energy & Mental Clarity 1–2 Hours After a Heavy Meal',
      subtitleBn: 'পোস্ট-প্রান্ডিয়াল ইনসুলিন স্পাইক এবং গ্লুকোজ ক্র্যাশ শনাক্তকরণের প্রশ্ন',
      subtitleEn: 'Detects post-prandial hyperinsulinemia and reactive glucose dips',
      type: 'radio',
      required: true,
      options: [
        { value: 'a', labelBn: 'সতেজ ও কর্মক্ষম থাকি, ঘুম পায় না', labelEn: 'Stable energy and clear mental focus' },
        { value: 'b', labelBn: 'হালকা ক্লান্তি বা শরীর একটু ছেড়ে দেয়', labelEn: 'Mild afternoon energy dip or sluggishness' },
        { value: 'c', labelBn: 'প্রচণ্ড ঘুম পায়, চোখ জড়িয়ে আসে বা মাথা ঝিমঝিম করে (Food Coma / Brain Fog)', labelEn: 'Strong urge to sleep, heavy eyelids, or brain fog (Insulin Spike)' },
      ],
    },
    {
      id: 'metabolism_2',
      stepId: 'metabolism_inflammation',
      titleBn: '২. মিষ্টি, চা-চিনি, ভাত বা স্টার্চ জাতীয় খাবারের প্রতি আকাঙ্ক্ষা (Cravings) কেমন?',
      titleEn: '2. Frequency of Sugar, Sweet, or Refined Carb Cravings',
      subtitleBn: 'লেপটিন ও ইনসুলিন সিগন্যালিং যাচাইয়ের জন্য',
      subtitleEn: 'Measures cellular glucose starvation and leptin resistance',
      type: 'radio',
      required: true,
      options: [
        { value: 'a', labelBn: 'খুব কম / মিষ্টি না খেলেও কোনো সমস্যা হয় না', labelEn: 'Rarely crave sweets or refined starches' },
        { value: 'b', labelBn: 'বিকেলে বা মানসিক চাপে থাকলে মিষ্টি/চা-বিস্কুট খেতে ইচ্ছা করে', labelEn: 'Occasional cravings in the afternoon or during stress' },
        { value: 'c', labelBn: 'প্রায় প্রতিদিনই খাবারের পর বা রাতে তীব্র মিষ্টি/কার্ব খাওয়ার ইচ্ছা হয়', labelEn: 'Frequent, intense cravings for sweets, rice, or snacks' },
      ],
    },
    {
      id: 'metabolism_3',
      stepId: 'metabolism_inflammation',
      titleBn: '৩. কোনো কারণে খাবার খেতে ৩–৪ ঘণ্টা দেরি হলে বা উপবাসে কী প্রতিক্রিয়া হয়?',
      titleEn: '3. Physiological Reaction to Delayed or Skipped Meals',
      subtitleBn: 'মেটাবলিক ফ্লেক্সিবিলিটি (ফ্যাট বার্নিং সক্ষমতা) এবং হাইপোগ্লাইসেমিয়া যাচাই',
      subtitleEn: 'Evaluates metabolic flexibility vs reactive hypoglycemia',
      type: 'radio',
      required: true,
      options: [
        { value: 'a', labelBn: 'সহজেই সহ্য করতে পারি, শক্তি স্বাভাবিক থাকে (Metabolically Flexible)', labelEn: 'Can fast comfortably without dizziness or mood crash' },
        { value: 'b', labelBn: 'ক্ষুধা লাগে এবং হালকা বিরক্তি বা মাথাব্যথা শুরু হয়', labelEn: 'Mild hunger, headache, or slight irritability' },
        { value: 'c', labelBn: 'হাত-পা কাঁপে, মাথা ঘোরে, বুক ধড়ফড় করে বা প্রচণ্ড রাগ হয় (Hangry / Hypoglycemic)', labelEn: 'Shaky, dizzy, sweaty, weak, or intensely irritable' },
      ],
    },
    {
      id: 'metabolism_4',
      stepId: 'metabolism_inflammation',
      titleBn: '৪. আপনার শরীরে ওজন বা মেদ মূলত কোন অংশে বেশি জমে?',
      titleEn: '4. Primary Pattern of Body Fat Distribution',
      subtitleBn: 'ভিসেরাল অ্যাডিপোসিটি (ফ্যাটি লিভার ও ইনসুলিন রেজিস্ট্যান্স) নাকি ইস্ট্রোজেন ডমিনেন্স',
      subtitleEn: 'Distinguishes visceral/hepatic fat from subcutaneous estrogenic fat',
      type: 'radio',
      required: true,
      options: [
        { value: 'a', labelBn: 'কোমর ও উরুর নিচের অংশে অথবা ওজন কম/স্বাভাবিক', labelEn: 'Hips and thighs (Subcutaneous) or naturally lean' },
        { value: 'b', labelBn: 'সারা শরীরে সমানভাবে বাড়ে', labelEn: 'Evenly distributed across the body' },
        { value: 'c', labelBn: 'মূলত পেটে ও কোমরের চারপাশে (Central / Visceral Belly Fat)', labelEn: 'Primarily around the belly, waist, and upper trunk (Visceral Fat)' },
      ],
    },
    {
      id: 'metabolism_5',
      stepId: 'metabolism_inflammation',
      titleBn: '৫. অতিরিক্ত পিপাসা লাগা, গলা শুকিয়ে যাওয়া বা রাতে বারবার প্রস্রাবের বেগ হয় কি?',
      titleEn: '5. Thirst Intensity & Nighttime Urination (Nocturia)',
      subtitleBn: 'গ্লাইসেমিক ওভারলোড এবং ইলেক্ট্রোলাইট ভারসাম্যের লক্ষণ',
      subtitleEn: 'Clinical screen for osmotic diuresis and glycemic dysregulation',
      type: 'radio',
      required: true,
      options: [
        { value: 'a', labelBn: 'না, স্বাভাবিক পিপাসা ও রাতে ঘুমে ব্যাঘাত হয় না', labelEn: 'Normal thirst; rarely wake up at night to urinate' },
        { value: 'b', labelBn: 'মাঝে মাঝে পিপাসা বেশি লাগে বা রাতে ১ বার উঠতে হয়', labelEn: 'Slightly increased thirst or wake up once at night' },
        { value: 'c', labelBn: 'ঘন ঘন গলা শুকিয়ে যায় এবং রাতে ২ বা তার বেশি বার প্রস্রাবের জন্য উঠতে হয়', labelEn: 'Frequent dry mouth/thirst and wake up 2+ times at night to urinate' },
      ],
    },
    {
      id: 'inflammation_1',
      stepId: 'metabolism_inflammation',
      titleBn: '৬. সকালে ঘুম থেকে ওঠার পর হাত-পায়ের গাঁটে ব্যথা, শক্ত ভাব বা পায়ের তলায় ব্যথা হয় কি?',
      titleEn: '6. Morning Joint Stiffness, Body Ache, or Plantar Heel Pain',
      subtitleBn: 'সিস্টেমিক ইনফ্লামেশন (hs-CRP) ও ইউরিক অ্যাসিড/বাত প্রবণতা যাচাই',
      subtitleEn: 'Assesses systemic cytokine inflammation and uric acid/autoimmune joint load',
      type: 'radio',
      required: true,
      options: [
        { value: 'a', labelBn: 'না, শরীর হালকা ও ব্যথামুক্ত থাকে', labelEn: 'None — joints feel flexible and pain-free' },
        { value: 'b', labelBn: 'হালকা আড়ষ্টতা থাকে, হাঁটাচলা করলে ১০–১৫ মিনিটে ঠিক হয়ে যায়', labelEn: 'Mild stiffness that resolves within 15 minutes of moving' },
        { value: 'c', labelBn: 'তীব্র গাঁটে ব্যথা, কোমর/হাঁটু ব্যথা বা দীর্ঘক্ষণ শরীর শক্ত হয়ে থাকে', labelEn: 'Significant joint pain, backache, or prolonged morning stiffness' },
      ],
    },
    {
      id: 'inflammation_2',
      stepId: 'metabolism_inflammation',
      titleBn: '৭. ত্বকে অ্যালার্জি, চুলকানি, অ্যাকানথোসিস (ঘাড়ে কালো দাগ) বা সাইনাসের সমস্যা আছে কি?',
      titleEn: '7. Skin Sensitivity, Dark Neck Fold (Acanthosis), or Sinus/Allergy Issues',
      subtitleBn: 'হিস্টামিন রেসপন্স ও ইনসুলিন রেজিস্ট্যান্সের চর্মরোগ লক্ষণ',
      subtitleEn: 'Checks mast-cell histamine reactivity and cutaneous insulin markers',
      type: 'radio',
      required: true,
      options: [
        { value: 'a', labelBn: 'ত্বক পরিষ্কার এবং অ্যালার্জি বা সাইনাসের সমস্যা নেই', labelEn: 'Clear skin with no chronic allergies or sinus congestion' },
        { value: 'b', labelBn: 'মাঝে মাঝে ধুলোবালি/খাবারে হাঁচি-সর্দি বা হালকা র‍্যাশ হয়', labelEn: 'Occasional seasonal allergy, sinusitis, or mild skin sensitivity' },
        { value: 'c', labelBn: 'ঘাড়ে/বগলে কালো দাগ (Acanthosis), একজিমা, সোরিয়াসিস বা ঘন ঘন র‍্যাশ হয়', labelEn: 'Darkened neck skin fold (Acanthosis), chronic hives, eczema, or acne' },
      ],
    },
    {
      id: 'inflammation_3',
      stepId: 'metabolism_inflammation',
      titleBn: '৮. সামান্য শারীরিক পরিশ্রম বা সিঁড়ি ভাঙলে কেমন ক্লান্তি বা পেশী ব্যথা হয়?',
      titleEn: '8. Recovery from Physical Exertion & Stair Climbing',
      subtitleBn: 'সেলুলার অক্সিজেনেশন, হিমোগ্লোবিন ও ভিটামিন D/B12 স্ট্যাটাস বোঝার জন্য',
      subtitleEn: 'Reflects cellular oxygenation, iron status, and lactic acid clearance',
      type: 'radio',
      required: true,
      options: [
        { value: 'a', labelBn: 'দ্রুত স্বাভাবিক হয়ে যাই, দম বা পেশীতে তেমন কষ্ট হয় না', labelEn: 'Recover quickly with good stamina' },
        { value: 'b', labelBn: 'মাঝারি ক্লান্তি বা হাঁপিয়ে উঠি', labelEn: 'Moderate breathlessness or muscle tiredness' },
        { value: 'c', labelBn: 'অল্প পরিশ্রমেই প্রচণ্ড হাঁপিয়ে যাই এবং পেশীতে দীর্ঘস্থায়ী ব্যথা/ক্র্যাম্প হয়', labelEn: 'Exhausted easily with prolonged muscle soreness or night calf cramps' },
      ],
    },
    {
      id: 'inflammation_4',
      stepId: 'metabolism_inflammation',
      titleBn: '৯. শরীরে পানি জমা (Water Retention), সকালে মুখ বা পায়ের পাতা ফোলা ভাব হয় কি?',
      titleEn: '9. Fluid Retention, Facial Puffiness, or Ankle Edema',
      subtitleBn: 'সোডিয়াম-পটাশিয়াম রেশিও, কিডনি/লিভার ও লিম্ফ্যাটিক ড্রেনেজ যাচাই',
      subtitleEn: 'Evaluates lymphatic stagnation, sodium sensitivity, and renal/thyroid fluid balance',
      type: 'radio',
      required: true,
      options: [
        { value: 'a', labelBn: 'কখনোই ফোলা ভাব থাকে না', labelEn: 'Rarely or never experience swelling/puffiness' },
        { value: 'b', labelBn: 'মাঝে মাঝে ঘুম থেকে উঠলে চোখের নিচে বা হাত-পা একটু ফোলা লাগে', labelEn: 'Occasional morning facial puffiness or tight rings/shoes' },
        { value: 'c', labelBn: 'প্রায়ই পায়ের গোড়ালি, মুখ বা হাত ফুলে থাকে (Edema)', labelEn: 'Frequent or noticeable swelling in feet, ankles, or face' },
      ],
    },
    {
      id: 'inflammation_5',
      stepId: 'metabolism_inflammation',
      titleBn: '১০. সার্বিক ক্লান্তির মাত্রা ও মানসিক মনোযোগ (Focus & Memory) কেমন?',
      titleEn: '10. Overall Cellular Fatigue & Cognitive Focus',
      subtitleBn: 'নিউরো-ইনফ্লামেশন এবং মাইক্রোনিউট্রিয়েন্ট রিজার্ভ নির্ণয়ের প্রশ্ন',
      subtitleEn: 'Measures neuro-inflammation, sleep restoration, and cognitive sharpness',
      type: 'radio',
      required: true,
      options: [
        { value: 'a', labelBn: 'সারাদিন প্রাণবন্ত থাকি এবং স্মৃতিশক্তি ও মনোযোগ তীক্ষ্ণ', labelEn: 'High energy all day with sharp memory and focus' },
        { value: 'b', labelBn: 'সকালে উঠতে অলস লাগে এবং কাজের চাপে মাঝে মাঝে ভুলে যাই', labelEn: 'Sluggish mornings with occasional mental fatigue' },
        { value: 'c', labelBn: 'ঘুমানোর পরও ক্লান্তি কাটে না (Chronic Fatigue) এবং মনোযোগ ধরে রাখা কঠিন', labelEn: 'Wake up unrefreshed; chronic exhaustion and brain fog' },
      ],
    },
  ],

  medical_labs: [
    {
      id: 'med_conditions',
      stepId: 'medical_labs',
      titleBn: 'আপনার নির্ণয়কৃত রোগ বা শারীরিক সমস্যাগুলো নির্বাচন করুন / লিখুন',
      titleEn: 'Diagnosed Medical Conditions or Clinical History',
      subtitleBn: 'একাধিক রোগ থাকলে নিচের চিপসগুলো ট্যাপ করুন অথবা বিস্তারিত লিখুন',
      subtitleEn: 'Tap any applicable conditions below or type full details',
      type: 'textarea',
      required: true,
      placeholderBn: 'যেমন: টাইপ-২ ডায়াবেটিস, ফ্যাটি লিভার গ্রেড-২, উচ্চ রক্তচাপ, হাইপোথাইরয়েডিজম...',
      placeholderEn: 'e.g. Type 2 Diabetes, Fatty Liver Grade 2, Hypertension, Hypothyroidism...',
      quickChips: [
        { labelBn: 'টাইপ-২ ডায়াবেটিস / প্রি-ডায়াবেটিস', labelEn: 'Type 2 Diabetes / Pre-Diabetes', value: 'Type 2 Diabetes / Insulin Resistance' },
        { labelBn: 'ফ্যাটি লিভার (NAFLD Grade 1/2)', labelEn: 'Fatty Liver (NAFLD)', value: 'Fatty Liver (NAFLD)' },
        { labelBn: 'উচ্চ রক্তচাপ (Hypertension)', labelEn: 'Hypertension (High BP)', value: 'Hypertension (High BP)' },
        { labelBn: 'হাই কোলেস্টেরল / ট্রাইগ্লিসারাইড', labelEn: 'High Cholesterol / Triglycerides', value: 'Dyslipidemia (High TG/LDL)' },
        { labelBn: 'হাইপোথাইরয়েডিজম (Hypothyroid)', labelEn: 'Hypothyroidism', value: 'Hypothyroidism' },
        { labelBn: 'পিসিওএস / হরমোনাল সমস্যা', labelEn: 'PCOS / Hormonal Imbalance', value: 'PCOS / Hormonal Imbalance' },
        { labelBn: 'ইউরিক অ্যাসিড / কিডনি সতর্কতা', labelEn: 'High Uric Acid / Mild CKD', value: 'Hyperuricemia / Renal Care' },
        { labelBn: 'গ্যাস্ট্রিক / আইবিএস / কোষ্ঠকাঠিন্য', labelEn: 'Gastritis / IBS / Acid Reflux', value: 'Chronic Gastritis / IBS' },
        { labelBn: 'রক্তস্বল্পতা (Anemia / Low Hb)', labelEn: 'Anemia (Iron Deficiency)', value: 'Iron Deficiency Anemia' },
        { labelBn: 'কোনো দীর্ঘস্থায়ী রোগ নেই', labelEn: 'No Diagnosed Chronic Disease', value: 'None (Preventive Wellness)' },
      ],
    },
    {
      id: 'med_medications',
      stepId: 'medical_labs',
      titleBn: 'আপনি বর্তমানে কী কী ওষুধ বা সাপ্লিমেন্ট খাচ্ছেন? (Food-Drug Interaction Check)',
      titleEn: 'Current Prescription Medications & Supplements',
      subtitleBn: 'আপনার ওষুধের সাথে কোন খাবার খেলে পার্শ্বপ্রতিক্রিয়া হতে পারে তা স্বয়ংক্রিয়ভাবে যাচাই করা হবে',
      subtitleEn: 'Our clinical engine cross-checks your medications for Drug-Nutrient Interactions',
      type: 'textarea',
      required: true,
      placeholderBn: 'যেমন: Metformin 500mg, Thyrox 50mcg, Amlodipine 5mg, Rosuvastatin 10mg, গ্যাস্ট্রিকের ওষুধ...',
      placeholderEn: 'e.g. Metformin 500mg, Levothyroxine 50mcg, Amlodipine 5mg, Statin, Omeprazole...',
      quickChips: [
        { labelBn: 'Metformin (Comet / Nabumet)', labelEn: 'Metformin', value: 'Metformin' },
        { labelBn: 'Insulin / Sulfonylurea (Secrin/Diamicron)', labelEn: 'Insulin / Sulfonylurea', value: 'Insulin / Glimepiride' },
        { labelBn: 'Thyroxine (Thyrox / Euthyrox)', labelEn: 'Levothyroxine (Thyrox)', value: 'Levothyroxine (Thyrox)' },
        { labelBn: 'BP Meds (Amlodipine / Losartan / Telmisartan)', labelEn: 'BP Meds (Amlodipine/Telmisartan)', value: 'Amlodipine / Telmisartan' },
        { labelBn: 'Statin (Atorvastatin / Rosuvastatin)', labelEn: 'Cholesterol Statin', value: 'Rosuvastatin / Atorvastatin' },
        { labelBn: 'Gastric PPI (Omeprazole / Esomeprazole)', labelEn: 'Gastric PPI (Esomeprazole)', value: 'Esomeprazole / Omeprazole' },
        { labelBn: 'Iron / Calcium / Vitamin D', labelEn: 'Iron / Calcium / Vit D', value: 'Iron, Calcium & Vitamin D3 Supplements' },
        { labelBn: 'কোনো ওষুধ খাই না (None)', labelEn: 'No Regular Medications', value: 'None' },
      ],
    },
    {
      id: 'med_targets',
      stepId: 'medical_labs',
      titleBn: 'এই ডায়েট ও লাইফস্টাইল প্রোগ্রামের মাধ্যমে আপনার মূল লক্ষ্য কী?',
      titleEn: 'What is your Primary Clinical Nutrition Goal?',
      subtitleBn: 'আপনার অগ্রাধিকার অনুযায়ী ক্যালোরি ও ম্যাক্রো রেশিও সাজানো হবে',
      subtitleEn: 'Prioritizes macro targets and therapeutic meal rules',
      type: 'textarea',
      required: true,
      placeholderBn: 'যেমন: ৩ মাসে ৬ কেজি ওজন কমানো, সুগার ও ফ্যাটি লিভার রিভার্স করা, গ্যাস্ট্রিক ও ক্লান্তি দূর করা...',
      placeholderEn: 'e.g. Lose 6 kg visceral fat, reverse pre-diabetes/fatty liver, improve gut & energy...',
      quickChips: [
        { labelBn: 'ওজন ও পেটের মেদ কমানো (Fat Loss)', labelEn: 'Visceral Fat & Weight Loss', value: 'Healthy Weight Loss & Visceral Fat Reduction' },
        { labelBn: 'ডায়াবেটিস ও ফ্যাটি লিভার রিভার্সাল', labelEn: 'Diabetes & Fatty Liver Reversal', value: 'Glycemic Control & Fatty Liver Reversal' },
        { labelBn: 'হরমোন ও পিসিওএস ব্যালেন্স', labelEn: 'PCOS & Hormone Balance', value: 'Hormonal Balance & Regular Ovulatory Cycle' },
        { labelBn: 'সুস্থ গর্ভাবস্থা ও শিশুর পুষ্টি', labelEn: 'Healthy Pregnancy & Fetal Growth', value: 'Optimal Maternal & Fetal Nutrition' },
        { labelBn: 'ক্যান্সার রিকভারি ও ইমিউনিটি বৃদ্ধি', labelEn: 'Oncology Recovery & Strength', value: 'Lean Muscle Preservation & Neutropenic Safety' },
        { labelBn: 'হজমশক্তি ও মাইক্রোবায়োম নিরাময়', labelEn: 'Gut Microbiome & Acidity Relief', value: 'Gut Mucosal Healing & Bloating Relief' },
      ],
    },
    {
      id: 'emergency_name',
      stepId: 'medical_labs',
      titleBn: 'জরুরি যোগাযোগের ব্যক্তির নাম (Caregiver / Next of Kin - ঐচ্ছিক)',
      titleEn: 'Emergency Contact / Family Caregiver Name (Optional)',
      subtitleBn: 'হাইপোগ্লাইসেমিয়া বা জরুরি স্বাস্থ্য সতর্কতার জন্য',
      subtitleEn: 'Used for SOS clinical alerts and family caregiver coordination',
      type: 'text',
      placeholderBn: 'অভিভাবক বা নিকটাত্মীয়ের নাম...',
      placeholderEn: 'Caregiver or spouse name...',
    },
    {
      id: 'emergency_phone',
      stepId: 'medical_labs',
      titleBn: 'জরুরি হোয়াটসঅ্যাপ / মোবাইল নম্বর (ঐচ্ছিক)',
      titleEn: 'Emergency WhatsApp / Phone Number (Optional)',
      type: 'text',
      placeholderBn: '017XXXXXXXX',
      placeholderEn: '+88017XXXXXXXX',
    },
    {
      id: 'med_reports',
      stepId: 'medical_labs',
      titleBn: 'প্রেসক্রিপশন বা ল্যাব রিপোর্টের ফাইল যুক্ত করুন (ঐচ্ছিক)',
      titleEn: 'Attach Medical Prescription or Lab Report Files (Optional)',
      subtitleBn: 'পিডিএফ বা ছবি যুক্ত করতে পারেন এবং নিচের ল্যাব বক্সে মানগুলো লিখতে পারেন',
      subtitleEn: 'Attach files for reference and enter numerical values in the Lab Biomarker panel below',
      type: 'file',
    },
  ],
};

// ============================================================================
// EXTRA COHORT-SPECIFIC DEEP-DIVE QUESTIONS (Expanding each cohort to 10 Qs)
// ============================================================================

export const EXTRA_COHORT_QUESTIONS: Record<CohortType, CohortQuestion[]> = {
  pregnancy_lactation: [
    {
      id: 'preg_thyroid_anemia_history',
      cohort: 'pregnancy_lactation',
      category: 'clinical',
      titleBn: 'গর্ভাবস্থায় থাইরয়েড (TSH) বা হিমোগ্লোবিন কমার প্রবণতা আছে কি?',
      titleEn: 'Do you have Gestational Hypothyroidism or Low Hemoglobin?',
      subtitleBn: 'গর্ভাবস্থায় শিশুর মস্তিষ্কের বিকাশে আয়োডিন, সেলেনিয়াম ও আয়রন অত্যন্ত জরুরি',
      subtitleEn: 'Critical for fetal neuro-development and maternal oxygen transport',
      type: 'radio',
      options: [
        { labelBn: 'না, থাইরয়েড ও হিমোগ্লোবিন স্বাভাবিক আছে', labelEn: 'No, TSH and Hemoglobin are normal', value: 'normal' },
        { labelBn: 'হিমোগ্লোবিন কম (Anemia < 11 g/dL)', labelEn: 'Low Hemoglobin / Maternal Anemia (< 11 g/dL)', value: 'maternal_anemia', clinicalTag: 'maternal_anemia' },
        { labelBn: 'গর্ভকালীন থাইরয়েড (Hypothyroidism / TSH > 2.5)', labelEn: 'Gestational Hypothyroidism (On Thyroxine)', value: 'gestational_thyroid', clinicalTag: 'gestational_thyroid' },
        { labelBn: 'দুটোই আছে (রক্তস্বল্পতা ও থাইরয়েড)', labelEn: 'Both Anemia and Hypothyroidism', value: 'both_anemia_thyroid', clinicalTag: 'maternal_anemia' },
      ],
    },
    {
      id: 'preg_sleep_leg_cramps',
      cohort: 'pregnancy_lactation',
      category: 'symptom',
      titleBn: 'রাতে পায়ের পেশীতে টান ধরা (Leg Cramps) বা ঘুমের সমস্যা কেমন?',
      titleEn: 'Nighttime Calf Muscle Cramps & Sleep Posture Comfort',
      subtitleBn: 'ম্যাগনেসিয়াম ও ক্যালসিয়াম রেশিও নির্ধারণের জন্য',
      subtitleEn: 'Guides evening magnesium-rich foods and calcium timing',
      type: 'radio',
      options: [
        { labelBn: 'পায়ের টান বা ঘুমের তেমন সমস্যা নেই', labelEn: 'Minimal cramps and restful sleep', value: 'none' },
        { labelBn: 'মাঝে মাঝে রাতে পায়ের পেশীতে টান ধরে', labelEn: 'Occasional nighttime calf cramps', value: 'mild_cramps', clinicalTag: 'magnesium_need' },
        { labelBn: 'প্রায় রাতেই তীব্র পায়ের টান, কোমর ব্যথা ও অনিদ্রা হয়', labelEn: 'Frequent leg cramps, backache, and disturbed sleep', value: 'severe_cramps', clinicalTag: 'magnesium_need' },
      ],
    },
  ],
  child_pediatric: [],
  oncology_cancer: [
    {
      id: 'onc_weight_loss_percentage',
      cohort: 'oncology_cancer',
      category: 'clinical',
      titleBn: 'গত ৩–৬ মাসে অনিচ্ছাকৃত ওজন হ্রাস বা পেশী ক্ষয় (Cachexia) কেমন হয়েছে?',
      titleEn: 'Unintentional Weight or Muscle Loss Over the Last 3–6 Months',
      subtitleBn: 'ক্যান্সার ক্যাশেক্সিয়া প্রতিরোধ ও ক্যালোরি ডেনসিটি নির্ধারণের জন্য',
      subtitleEn: 'Determines hyper-caloric protein fortification requirements',
      type: 'radio',
      options: [
        { labelBn: 'ওজন স্থিতিশীল আছে (কমেনি)', labelEn: 'Weight is stable (No loss)', value: 'stable' },
        { labelBn: 'সামান্য ওজন কমেছে (২–৪ কেজি)', labelEn: 'Mild weight loss (2–4 kg)', value: 'mild_loss', clinicalTag: 'high_protein_calorie' },
        { labelBn: 'উল্লেখযোগ্য ওজন ও পেশী ক্ষয় হয়েছে (৫ কেজির বেশি)', labelEn: 'Significant weight & muscle loss (> 5 kg / Cachexia risk)', value: 'severe_cachexia', clinicalTag: 'cachexia_protocol' },
      ],
    },
    {
      id: 'onc_hydration_swallowing',
      cohort: 'oncology_cancer',
      category: 'symptom',
      titleBn: 'পানি বা তরল খাবার গিলতে (Swallowing) এবং শরীরে ইলেক্ট্রোলাইট ধরে রাখতে সমস্যা হয় কি?',
      titleEn: 'Swallowing Comfort (Dysphagia) & Daily Hydration Tolerance',
      subtitleBn: 'কেমো পরবর্তী কিডনি ফ্লাশিং ও তরল খাবারের টেক্সচার নির্বাচনের জন্য',
      subtitleEn: 'Calibrates texture-modified broths and renal hydration support',
      type: 'radio',
      options: [
        { labelBn: 'স্বাভাবিকভাবে সব ধরনের খাবার ও পানি গিলতে পারি', labelEn: 'Can swallow solids and liquids comfortably', value: 'normal_swallow' },
        { labelBn: 'শুকনো খাবার গিলতে কষ্ট হয়, নরম/আধা-তরল খাবার সুবিধাজনক', labelEn: 'Dry foods are hard to swallow; prefer soft/moist foods', value: 'soft_moist_needed', clinicalTag: 'soft_texture' },
        { labelBn: 'তরল ছাড়া শক্ত খাবার গিলতে খুব কষ্ট হয় (তরল/পিউরি ডায়েট প্রয়োজন)', labelEn: 'Difficulty swallowing solids; require pureed/liquid nutrition', value: 'pureed_liquid_only', clinicalTag: 'pureed_diet' },
      ],
    },
  ],
  adolescent_growth: [
    {
      id: 'adol_bone_posture_pain',
      cohort: 'adolescent_growth',
      category: 'symptom',
      titleBn: 'হাঁটু/পায়ের হাড়ে ব্যথা (Growing Pains), কুঁজো হয়ে বসা বা দাঁতের সমস্যা আছে কি?',
      titleEn: 'Growing Pains in Legs/Knees, Posture Fatigue, or Dental Issues',
      subtitleBn: 'ক্যালসিয়াম, ভিটামিন D3, K2 এবং ফসফরাস শোষণ যাচাইয়ের জন্য',
      subtitleEn: 'Evaluates osteoblast bone mineralization during peak height velocity',
      type: 'radio',
      options: [
        { labelBn: 'না, হাড় ও পেশী মজবুত আছে', labelEn: 'Strong bones and posture with no leg pain', value: 'strong_bones' },
        { labelBn: 'মাঝে মাঝে খেলাধুলা বা রাতে পায়ে/হাঁটুতে ব্যথা হয়', labelEn: 'Occasional shin/knee pain or fatigue after study/sports', value: 'mild_bone_pain', clinicalTag: 'calcium_vitd_boost' },
        { labelBn: 'প্রায়ই পায়ে ব্যথা, ক্লান্তি ও ভিটামিন D/ক্যালসিয়ামের ঘাটতি রয়েছে', labelEn: 'Frequent bone/leg ache and low Vitamin D/Calcium status', value: 'high_bone_need', clinicalTag: 'calcium_vitd_boost' },
      ],
    },
    {
      id: 'adol_breakfast_tiffin_routine',
      cohort: 'adolescent_growth',
      category: 'lifestyle',
      titleBn: 'স্কুল/কলেজে যাওয়ার আগে সকালের নাস্তা এবং টিফিন খাওয়ার অভ্যাস কেমন?',
      titleEn: 'Morning Pre-School/College Breakfast & Tiffin Consistency',
      subtitleBn: 'সকালের নাস্তা বাদ দিলে গ্রোথ হরমোন ও ক্লাসে মনোযোগ কমে যায়',
      subtitleEn: 'Morning protein intake drives IGF-1 growth factor and neurotransmitter synthesis',
      type: 'radio',
      options: [
        { labelBn: 'প্রতিদিন সকালে পেট ভরে পুষ্টিকর নাস্তা ও বাসার টিফিন খাই', labelEn: 'Eat nutritious breakfast and home tiffin daily', value: 'regular_home_tiffin' },
        { labelBn: 'তাড়াহুড়োয় সকালে অল্প খাই, টিফিনে ক্যান্টিন/বাইরের খাবার খাওয়া হয়', labelEn: 'Rushed light breakfast; mostly eat canteen snacks at school/college', value: 'rushed_canteen' },
        { labelBn: 'প্রায়ই সকালের নাস্তা না খেয়েই ক্লাসে যাই', labelEn: 'Frequently skip morning breakfast before classes', value: 'skip_breakfast', clinicalTag: 'morning_protein_alert' },
      ],
    },
  ],
  adult_metabolic: [
    {
      id: 'met_disease_duration_complications',
      cohort: 'adult_metabolic',
      category: 'clinical',
      titleBn: 'আপনার মেটাবলিক সমস্যাটি কতদিন ধরে আছে এবং পায়ের পাতায় ঝিনঝিন/চোখে ঝাপসা ভাব আছে কি?',
      titleEn: 'Duration of Metabolic Condition & Neuropathy/Microvascular Symptoms',
      subtitleBn: 'ডায়াবেটিক নিউরোপ্যাথি, কিডনি ও রেটিনা সুরক্ষায় আলফা-লাইপোয়িক অ্যাসিড ও B12 প্রটোকল',
      subtitleEn: 'Assesses metabolic disease chronicity and microvascular protection needs',
      type: 'radio',
      options: [
        { labelBn: 'নতুন শনাক্ত হয়েছে (১ বছরের কম) / কোনো জটিলতা নেই', labelEn: 'Newly diagnosed (< 1 year) or preventive stage; no complications', value: 'newly_diagnosed' },
        { labelBn: '১–৫ বছর ধরে আছে, তবে হাত-পা ঝিনঝিন বা অন্য জটিলতা নেই', labelEn: '1–5 years duration; no neuropathy or organ complications', value: 'moderate_duration' },
        { labelBn: '৫ বছরের বেশি অথবা হাত-পায়ের পাতা জ্বালাপোড়া/ঝিনঝিন (Neuropathy) আছে', labelEn: '> 5 years duration or experiencing tingling/burning feet (Neuropathy)', value: 'chronic_neuropathy', clinicalTag: 'neuropathy_care' },
      ],
    },
    {
      id: 'met_cooking_oil_salt_habit',
      cohort: 'adult_metabolic',
      category: 'lifestyle',
      titleBn: 'বাসার রান্নায় কোন তেল ব্যবহার করেন এবং পাতে কাঁচা লবণ খাওয়ার অভ্যাস আছে কি?',
      titleEn: 'Household Cooking Oil Type & Table Salt Habit',
      subtitleBn: 'ওমেগা-৬ প্রদাহ কমানো এবং রক্তচাপ ও লিভার সুরক্ষার জন্য',
      subtitleEn: 'Directly impacts endothelial inflammation, blood pressure, and hepatic lipid oxidation',
      type: 'radio',
      options: [
        { labelBn: 'সরিষার তেল / অলিভ অয়েল (পরিমিত) এবং পাতে কাঁচা লবণ খাই না', labelEn: 'Mustard oil / Olive oil in moderation; no extra table salt', value: 'healthy_oil_no_salt' },
        { labelBn: 'সয়াবিন / রাইস ব্র্যান তেল ব্যবহার করি, তবে কাঁচা লবণ খাই না', labelEn: 'Refined Soybean / Rice Bran oil; no extra raw salt', value: 'refined_oil_used', clinicalTag: 'switch_to_mustard_oil' },
        { labelBn: 'রান্নায় তেল বেশি লাগে অথবা ভাতের সাথে কাঁচা লবণ/আচার খাওয়ার অভ্যাস আছে', labelEn: 'High cooking oil usage or habit of taking raw table salt/pickles', value: 'high_oil_raw_salt', clinicalTag: 'sodium_oil_restriction' },
      ],
    },
  ],
};

// ============================================================================
// 2. DEDICATED 32-QUESTION PEDIATRIC ASSESSMENT PACKAGE (child_pediatric, Ages 1–12)
// Only Anthropometrics is shared in structure; all 26 other clinical questions are
// 100% child-specific (Feeding, Tiffin, Pediatric Gut/Deworming, Immunity/Allergies,
// Pediatric Prakriti/Screen Time/Neuro-Development, and Pediatric Supplements/Labs).
// ============================================================================

export const PEDIATRIC_32_QUESTIONS_BY_TAB: UnifiedAssessmentTab[] = [
  {
    id: 'child_basic',
    badgeBn: 'ধাপ ১ • শারীরিক বৃদ্ধি (৬টি প্রশ্ন)',
    badgeEn: 'Step 1 • Growth & Anthropometrics (6 Qs)',
    titleBn: 'শিশুর শারীরিক মাপ ও গ্রোথ চার্ট (Anthropometrics)',
    titleEn: 'Child Anthropometrics & Growth Trajectory',
    subtitleBn: 'শিশুর বয়স অনুযায়ী ওজন ও উচ্চতার পার্সেন্টাইল (WHO Growth Standard) যাচাই',
    subtitleEn: 'Evaluates weight-for-age, height-for-age, and growth velocity',
    icon: '📏',
    questions: [
      {
        id: 'basic_name',
        stepId: 'child_basic',
        titleBn: '১. শিশুর পূর্ণ নাম (Child Full Name)',
        titleEn: "1. Child's Full Name",
        type: 'text',
        placeholderBn: 'শিশুর নাম লিখুন...',
        placeholderEn: "Enter child's name...",
        required: true,
      },
      {
        id: 'basic_age',
        stepId: 'child_basic',
        titleBn: '২. শিশুর বয়স (বছর — ১ থেকে ১২ বছর)',
        titleEn: "2. Child's Age (Years — Ages 1 to 12)",
        subtitleBn: '১ বছরের নিচে হলে মাসের হিসাব পূর্ণ বছরে বা ১ লিখুন',
        subtitleEn: 'Enter age between 1 and 12 years',
        type: 'number',
        min: 1,
        max: 12,
        unit: 'Years',
        placeholderBn: 'যেমন: ৫',
        placeholderEn: 'e.g. 5',
        required: true,
      },
      {
        id: 'basic_gender',
        stepId: 'child_basic',
        titleBn: '৩. শিশুর লিঙ্গ (Boy / Girl)',
        titleEn: "3. Child's Biological Sex",
        type: 'radio',
        required: true,
        options: [
          { value: 'Male', labelBn: 'ছেলে শিশু (Boy)', labelEn: 'Boy (Male)' },
          { value: 'Female', labelBn: 'মেয়ে শিশু (Girl)', labelEn: 'Girl (Female)' },
        ],
      },
      {
        id: 'basic_height',
        stepId: 'child_basic',
        titleBn: '৪. শিশুর বর্তমান উচ্চতা (সেন্টিমিটার - cm)',
        titleEn: "4. Child's Current Height (cm)",
        subtitleBn: 'নিচের ফুট-ইঞ্চি কনভার্টার দিয়ে সহজেই সেন্টিমিটারে রূপান্তর করতে পারেন',
        subtitleEn: 'Use the Feet/Inches helper below if needed',
        type: 'number',
        min: 50,
        max: 175,
        unit: 'cm',
        placeholderBn: 'যেমন: ১১০',
        placeholderEn: 'e.g. 110',
        required: true,
      },
      {
        id: 'basic_weight',
        stepId: 'child_basic',
        titleBn: '৫. শিশুর বর্তমান ওজন (কেজি - kg)',
        titleEn: "5. Child's Current Weight (kg)",
        type: 'number',
        min: 5,
        max: 80,
        unit: 'kg',
        placeholderBn: 'যেমন: ১৮',
        placeholderEn: 'e.g. 18',
        required: true,
      },
      {
        id: 'child_growth_curve',
        stepId: 'child_basic',
        titleBn: '৬. গত ৬ মাসে শিশুর ওজন ও উচ্চতা বৃদ্ধির গতি কেমন মনে হচ্ছে?',
        titleEn: '6. How has the child’s weight and height progressed over the last 6 months?',
        subtitleBn: 'গ্রোথ ফ্যাল্টারিং (Stunting / Wasting) নাকি স্বাভাবিক বৃদ্ধি যাচাই',
        subtitleEn: 'Identifies growth faltering, underweight, or childhood overweight trends',
        type: 'radio',
        required: true,
        options: [
          { value: 'normal_steady', labelBn: 'বয়স অনুযায়ী স্বাভাবিকভাবে ওজন ও উচ্চতা বাড়ছে', labelEn: 'Growing steadily in both height and weight' },
          { value: 'underweight_stagnant', labelBn: 'ওজন একদম বাড়ছে না বা শুকিয়ে যাচ্ছে (Underweight / Faltering)', labelEn: 'Weight is stagnant or child looks visibly thin/underweight', clinicalTag: 'calorie_dense_pediatric' },
          { value: 'height_slow', labelBn: 'সমবয়সীদের তুলনায় উচ্চতা কম বাড়ছে (Stunting concern)', labelEn: 'Height gain is slower compared to peers of the same age', clinicalTag: 'linear_growth_boost' },
          { value: 'overweight_gain', labelBn: 'বয়সের তুলনায় দ্রুত ওজন বা পেটের মেদ বাড়ছে (Childhood Overweight)', labelEn: 'Rapid weight gain or excess chubbiness for age', clinicalTag: 'pediatric_metabolic' },
        ],
      },
    ],
  },

  {
    id: 'child_feeding',
    badgeBn: 'ধাপ ২ • খাদ্যাভ্যাস ও টিফিন (৬টি প্রশ্ন)',
    badgeEn: 'Step 2 • Feeding & School Tiffin (6 Qs)',
    titleBn: 'শিশুর খাবার গ্রহণের আচরণ ও স্কুল টিফিন রুটিন',
    titleEn: 'Pediatric Feeding Behavior, Protein & School Tiffin Routine',
    subtitleBn: 'শিশুর রুচি, প্রোটিন গ্রহণ এবং জাঙ্ক ফুডের প্রভাব বিশ্লেষণ',
    subtitleEn: 'Assesses picky eating, mealtime struggles, protein adequacy, and processed food load',
    icon: '🍱',
    questions: [
      {
        id: 'child_appetite',
        stepId: 'child_feeding',
        titleBn: '৭. শিশুর খাবারের রুচি ও খাওয়ার সময়ের আচরণ কেমন?',
        titleEn: "7. Child's Appetite & Mealtime Feeding Behavior",
        type: 'radio',
        required: true,
        options: [
          { value: 'good', labelBn: 'ক্ষুধা লাগলে আনন্দের সাথে নিজে বা অল্প সময়ে খেয়ে নেয়', labelEn: 'Eats happily within 20–25 minutes with healthy appetite' },
          { value: 'picky', labelBn: 'খুবই বেছে খায় (Picky Eater) — নির্দিষ্ট ২-৩টি খাবার ছাড়া কিছু খেতে চায় না', labelEn: 'Very picky eater — accepts only a few specific foods', clinicalTag: 'picky_eater' },
          { value: 'mouth_holding', labelBn: 'খাবার গালে জমা করে রাখে, গিলতে চায় না বা জোর করে খাওয়াতে হয়', labelEn: 'Holds food in mouth for long, refuses to chew, or needs force-feeding', clinicalTag: 'zinc_digestive_enzyme' },
          { value: 'excess_appetite', labelBn: 'বারবার ভাজাপোড়া বা কার্বোহাইড্রেট খেতে চায়', labelEn: 'Craves frequent starchy or fried snacks constantly' },
        ],
      },
      {
        id: 'child_breakfast_habit',
        stepId: 'child_feeding',
        titleBn: '৮. সকালে ঘুম থেকে উঠে বা স্কুলে যাওয়ার আগে শিশু সাধারণত কী খায়?',
        titleEn: '8. Typical Morning Breakfast Before School / Play',
        type: 'radio',
        required: true,
        options: [
          { value: 'complete_breakfast', labelBn: 'ডিম, রুটি/পরোটা/ভাত/খিচুড়ি বা ওটস পেট ভরে খায়', labelEn: 'Complete breakfast (Egg, Roti/Khichuri/Oats & Milk)' },
          { value: 'milk_only', labelBn: 'শুধু ১ গ্লাস দুধ/হরলিক্স বা ২টা বিস্কুট খেয়ে স্কুলে যায়', labelEn: 'Only a glass of milk/malt drink or biscuits' },
          { value: 'refuses_morning', labelBn: 'সকালে কিছুই খেতে চায় না বা বমি ভাব করে', labelEn: 'Refuses morning food or feels nauseous early morning' },
        ],
      },
      {
        id: 'child_tiffin_habit',
        stepId: 'child_feeding',
        titleBn: '৯. স্কুল টিফিন বা দুপুরের মধ্যবর্তী নাস্তার অবস্থা কী?',
        titleEn: '9. School Tiffin Box Habit & Completion',
        type: 'radio',
        required: true,
        options: [
          { value: 'finishes_home_tiffin', labelBn: 'বাসা থেকে দেওয়া পুষ্টিকর টিফিন পুরোটা শেষ করে আসে', labelEn: 'Finishes homemade nutritious tiffin box daily' },
          { value: 'brings_back_tiffin', labelBn: 'টিফিন বক্সের খাবার না খেয়ে ফেরত নিয়ে আসে', labelEn: 'Often brings back unconsumed tiffin box' },
          { value: 'packaged_tiffin', labelBn: 'টিফিনে কেক, নুডলস, চিপস, সসেজ বা বাইরের খাবার বেশি দেওয়া হয়', labelEn: 'Mostly takes packaged cakes, instant noodles, sausages, or chips' },
          { value: 'toddler_home', labelBn: 'এখনো স্কুলে যায় না (বাসায় খায়)', labelEn: 'Toddler at home (Not yet in school)' },
        ],
      },
      {
        id: 'child_protein_intake',
        stepId: 'child_feeding',
        titleBn: '১০. শিশুর প্রতিদিনের খাবারে প্রোটিন (ডিম, মাছ, মুরগি, ডাল, দুধ/দই) কতটুকু থাকে?',
        titleEn: '10. Daily First-Class Protein Intake (Egg, Fish, Chicken, Dal, Dairy)',
        type: 'radio',
        required: true,
        options: [
          { value: 'optimal_protein', labelBn: 'প্রতিদিন অন্তত ১টি ডিম, মাছ/মুরগি এবং ডাল/দুধ খায়', labelEn: 'Eats 1 egg + fish/chicken + dal/curd almost every day' },
          { value: 'moderate_protein', labelBn: 'ডিম বা মাছের যেকোনো একটি অল্প পরিমাণে খায়', labelEn: 'Eats only small amounts of either egg or fish/chicken' },
          { value: 'low_protein_carb_heavy', labelBn: 'মাছ-মাংস-ডিম খেতে চায় না, শুধু সাদা ভাত/আলু/নুডলস পছন্দ করে', labelEn: 'Refuses fish/meat/egg; mostly eats plain rice, potato, or noodles', clinicalTag: 'hidden_protein_recipes' },
        ],
      },
      {
        id: 'child_veg_fruit',
        stepId: 'child_feeding',
        titleBn: '১১. শাকসবজি এবং মৌসুমী ফলমূল খাওয়ার প্রবণতা কেমন?',
        titleEn: '11. Acceptance of Vegetables, Greens & Seasonal Fruits',
        type: 'radio',
        required: true,
        options: [
          { value: 'eats_both', labelBn: 'সবজি এবং ফল দুটোই আনন্দের সাথে খায়', labelEn: 'Eats both vegetables and seasonal fruits willingly' },
          { value: 'fruits_only', labelBn: 'ফল খায়, কিন্তু শাকসবজি মুখে দিলে ফেলে দেয়', labelEn: 'Likes fruits, but spits out or refuses green vegetables' },
          { value: 'avoid_both', labelBn: 'সবজি ও ফল কোনোটাই খেতে চায় না (ফাইবার ঘাটতি)', labelEn: 'Refuses both vegetables and fruits (Low fiber/micronutrients)' },
        ],
      },
      {
        id: 'child_junk_sugar',
        stepId: 'child_feeding',
        titleBn: '১২. চিপস, চকলেট, জুস, কোমল পানীয়, বেকারি বা ফাস্টফুড কত ঘন ঘন খায়?',
        titleEn: '12. Frequency of Packaged Snacks, Chocolates, Commercial Juices & Fast Food',
        type: 'radio',
        required: true,
        options: [
          { value: 'rarely_clean', labelBn: 'খুবই কম (সপ্তাহে ১ বারের কম বা শুধু বিশেষ দিনে)', labelEn: 'Rarely (Once a week or less)' },
          { value: '3_4_times_week', labelBn: 'সপ্তাহে ৩–৪ দিন বিস্কুট, চকলেট বা চিপস খায়', labelEn: '3–4 times a week' },
          { value: 'daily_junk', labelBn: 'প্রতিদিনই চিপস, চকলেট, জুস বা বাইরের কিছু না দিলে কান্নাকাটি করে', labelEn: 'Almost daily consumption of packaged snacks/sweets/juices', clinicalTag: 'sugar_detox_child' },
        ],
      },
    ],
  },

  {
    id: 'child_gut',
    badgeBn: 'ধাপ ৩ • শিশুর পেট ও হজম (৫টি প্রশ্ন)',
    badgeEn: 'Step 3 • Pediatric Gut & Deworming (5 Qs)',
    titleBn: 'শিশুর হজমশক্তি, মাইক্রোবায়োম ও কৃমি নিয়ন্ত্রণ',
    titleEn: 'Pediatric Gut Microbiome, Bowel Habits & Deworming Status',
    subtitleBn: 'শিশুর কোষ্ঠকাঠিন্য, পেট ব্যথা, কৃমি এবং অ্যান্টিবায়োটিকের প্রভাব যাচাই',
    subtitleEn: 'Evaluates pediatric constipation, colic, worm infestation signs, and post-antibiotic dysbiosis',
    icon: '🦠',
    questions: [
      {
        id: 'child_gut_status',
        stepId: 'child_gut',
        titleBn: '১৩. শিশুর পায়খানার ধরন ও নিয়মিততা কেমন? (Pediatric Bowel Pattern)',
        titleEn: "13. Child's Stool Consistency & Bowel Frequency",
        type: 'radio',
        required: true,
        options: [
          { value: 'normal', labelBn: 'প্রতিদিন নিয়মিত ও নরম/স্বাভাবিক পায়খানা হয়', labelEn: 'Normal, soft daily bowel movement without pain' },
          { value: 'constipation', labelBn: 'শক্ত গুটি গুটি পায়খানা, ২–৩ দিন পর পর হয় বা পায়খানা করতে ভয় পায়/কান্না করে', labelEn: 'Hard, painful stools every 2–3 days; childwithholds or cries (Constipation)', clinicalTag: 'pediatric_constipation' },
          { value: 'loose_undigested', labelBn: 'খাবার পরপরই পায়খানার বেগ হয় বা মলের সাথে হজম না হওয়া খাবার যায় (চাপড়/আমাশয়)', labelEn: 'Frequent loose stools or undigested food particles after meals' },
        ],
      },
      {
        id: 'child_tummy_ache',
        stepId: 'child_gut',
        titleBn: '১৪. শিশু কি প্রায়ই নাভির চারপাশে পেট ব্যথা, বমি ভাব বা দুধ খেলে পেট ব্যথার কথা বলে?',
        titleEn: '14. Recurrent Tummy Ache Around Naval, Colic, or Post-Milk Discomfort',
        type: 'radio',
        required: true,
        options: [
          { value: 'none', labelBn: 'না, পেট ব্যথা বা বমি ভাব হয় না', labelEn: 'No recurrent tummy aches or nausea' },
          { value: 'milk_triggered', labelBn: 'গরুর দুধ বা ভারী খাবার খেলে পেট ফাঁপে বা পেট ব্যথা বলে', labelEn: 'Tummy ache or gas specifically after drinking cow’s milk' },
          { value: 'frequent_periumbilical', labelBn: 'প্রায়ই নাভির চারপাশে চিনচিনে ব্যথা বা সকালে পেট ব্যথার কথা বলে', labelEn: 'Frequent periumbilical tummy pain or morning nausea' },
        ],
      },
      {
        id: 'child_bloating_gas',
        stepId: 'child_gut',
        titleBn: '১৫. শিশুর পেট কি শক্ত বা ফোলা দেখায়, মুখে দুর্গন্ধ বা জিভে সাদা প্রলেপ থাকে?',
        titleEn: '15. Abdominal Distension (Pot-Belly Look), Bad Breath, or Coated Tongue',
        type: 'radio',
        required: true,
        options: [
          { value: 'clean_flat', labelBn: 'না, পেট নরম ও স্বাভাবিক এবং জিভ পরিষ্কার থাকে', labelEn: 'Soft abdomen and clean tongue' },
          { value: 'mild_gas', labelBn: 'মাঝে মাঝে রাতে পেটে গ্যাস হয় বা ঢেকুর তোলে', labelEn: 'Occasional evening gas or bloating' },
          { value: 'distended_ama', labelBn: 'হাত-পা চিকন কিন্তু পেট ফোলা থাকে এবং মুখে দুর্গন্ধ/সাদা প্রলেপ থাকে', labelEn: 'Thin limbs with bloated tummy and coated tongue (Gut Dysbiosis)' },
        ],
      },
      {
        id: 'child_deworming',
        stepId: 'child_gut',
        titleBn: '১৬. গত ৬ মাসে কৃমির ওষুধ খাওয়ানো হয়েছে কি এবং কৃমির কোনো লক্ষণ আছে কি?',
        titleEn: '16. Last Deworming Status & Signs of Worm Infestation (Krimi)',
        subtitleBn: 'রাতে ঘুমের মধ্যে দাঁত কিড়মিড় করা, পায়ুপথে চুলকানি বা লালা পড়া কৃমির প্রধান লক্ষণ',
        subtitleEn: 'Night teeth grinding (bruxism), anal itching, or drooling indicate parasitic malabsorption',
        type: 'radio',
        required: true,
        options: [
          { value: 'dewormed_no_symptoms', labelBn: 'গত ৬ মাসে কৃমির ওষুধ দেওয়া হয়েছে এবং কোনো লক্ষণ নেই', labelEn: 'Dewormed within last 6 months; no symptoms' },
          { value: 'not_dewormed', labelBn: 'গত ৬ মাসের মধ্যে কৃমির ওষুধ খাওয়ানো হয়নি', labelEn: 'Not dewormed in the last 6 months' },
          { value: 'worm_symptoms_present', labelBn: 'রাতে দাঁত কিড়মিড় করে, পায়ুপথে চুলকায়, ঘুমের মধ্যে লালা পড়ে বা মিষ্টি বেশি চায়', labelEn: 'Shows signs: night teeth grinding, anal itching, drooling, or intense sugar cravings', clinicalTag: 'krimi_worm_alert' },
        ],
      },
      {
        id: 'child_antibiotics',
        stepId: 'child_gut',
        titleBn: '১৭. গত ৬ মাসে শিশুকে কতবার অ্যান্টিবায়োটিক সিরাপ/ওষুধ খাওয়াতে হয়েছে?',
        titleEn: '17. Frequency of Oral Antibiotic Courses in the Last 6 Months',
        subtitleBn: 'ঘন ঘন অ্যান্টিবায়োটিক শিশুর গাট মাইক্রোবায়োম ও ভিটামিন শোষণে বাধা দেয়',
        subtitleEn: 'Repeated antibiotics deplete beneficial Bifidobacteria and reduce nutrient absorption',
        type: 'radio',
        required: true,
        options: [
          { value: 'none', labelBn: 'একবারও অ্যান্টিবায়োটিক লাগেনি', labelEn: 'Zero antibiotic courses in the last 6 months' },
          { value: 'once', labelBn: '১ বার দিতে হয়েছে', labelEn: '1 course in the last 6 months' },
          { value: 'multiple_courses', labelBn: '২ থেকে ৪ বার বা তার বেশি অ্যান্টিবায়োটিক দিতে হয়েছে', labelEn: '2 or more antibiotic courses in the last 6 months (Needs Probiotic Restoration)', clinicalTag: 'post_antibiotic_gut' },
        ],
      },
    ],
  },

  {
    id: 'child_immunity',
    badgeBn: 'ধাপ ৪ • ইমিউনিটি ও অ্যালার্জি (৫টি প্রশ্ন)',
    badgeEn: 'Step 4 • Immunity & Allergies (5 Qs)',
    titleBn: 'শিশুর রোগ প্রতিরোধ ক্ষমতা, অ্যালার্জি ও পুষ্টি ঘাটতি',
    titleEn: 'Pediatric Immunity, Food Allergies & Micronutrient Signs',
    subtitleBn: 'সর্দি-কাশি, টনসিল, ফুড অ্যালার্জি এবং রক্তস্বল্পতা/ভিটামিন ঘাটতি যাচাই',
    subtitleEn: 'Screens for respiratory immunity, atopic allergies, dental health, and iron/calcium deficiency',
    icon: '🛡️',
    questions: [
      {
        id: 'child_immunity_resp',
        stepId: 'child_immunity',
        titleBn: '১৮. শিশুর সর্দি-কাশি, জ্বর, টনসিল বা অ্যাডিনয়েডের সমস্যা কত ঘন ঘন হয়?',
        titleEn: '18. Frequency of Cold, Cough, Fever, Tonsillitis, or Adenoid Issues',
        type: 'radio',
        required: true,
        options: [
          { value: 'strong_immunity', labelBn: 'খুব কম অসুস্থ হয়, আবহাওয়া পরিবর্তনেও সুস্থ থাকে', labelEn: 'Strong immunity; rarely falls sick during season changes' },
          { value: 'every_2_3_months', labelBn: '২–৩ মাস পর পর সর্দি-কাশি বা হালকা জ্বর হয়', labelEn: 'Gets cold/cough every 2–3 months' },
          { value: 'monthly_tonsils', labelBn: 'প্রায় প্রতি মাসেই ঠান্ডা লাগে, টনসিল ফুলে যায় বা নেবুলাইজার দিতে হয়', labelEn: 'Falls sick almost monthly; recurrent tonsillitis, wheezing, or nebulization', clinicalTag: 'pediatric_immunity_boost' },
        ],
      },
      {
        id: 'child_allergy_skin',
        stepId: 'child_immunity',
        titleBn: '১৯. শিশুর কি অ্যাজমা/শ্বাসকষ্ট, একজিমা, ত্বকে র‍্যাশ বা ধুলোবালি অ্যালার্জি আছে?',
        titleEn: '19. Atopic Tendencies: Wheezing/Asthma, Eczema, or Allergic Rhinitis',
        type: 'radio',
        required: true,
        options: [
          { value: 'no_atopy', labelBn: 'না, শ্বাসকষ্ট বা চর্মরোগের কোনো অ্যালার্জি নেই', labelEn: 'No asthma, wheezing, or skin eczema' },
          { value: 'skin_eczema', labelBn: 'ত্বক শুষ্ক থাকে, চুলকানি বা একজিমা/র‍্যাশ ওঠে', labelEn: 'Prone to dry itchy skin, eczema, or hives' },
          { value: 'wheezing_rhinitis', labelBn: 'ঠান্ডা লাগলেই বুকে কফ জমে, বাঁশির মতো শব্দ (Wheezing) বা ক্রমাগত হাঁচি হয়', labelEn: 'Chest congestion, wheezing, or morning sneezing fits' },
        ],
      },
      {
        id: 'child_allergies',
        stepId: 'child_immunity',
        titleBn: '২০. নির্দিষ্ট কোনো খাবারে শিশুর অ্যালার্জি বা অসহিষ্ণুতা আছে কি? (Food Allergies)',
        titleEn: '20. Known Food Allergies or Intolerances (Strictly Excluded from Chart)',
        subtitleBn: 'চিহ্নিত খাবারগুলো শিশুর ডায়েট চার্ট থেকে সম্পূর্ণ বাদ দেওয়া হবে',
        subtitleEn: 'Selected allergens will be strictly excluded from the child’s meal plan',
        type: 'checkbox',
        required: true,
        options: [
          { value: 'none', labelBn: 'কোনো খাবারে অ্যালার্জি নেই (No Food Allergies)', labelEn: 'No known food allergies' },
          { value: 'lactose_milk', labelBn: 'গরুর দুধ / ল্যাকটোজ অসহিষ্ণুতা (Cow Milk / Lactose)', labelEn: "Cow's Milk / Lactose Intolerance", clinicalTag: 'no_cow_milk' },
          { value: 'egg_allergy', labelBn: 'ডিম (Egg Allergy)', labelEn: 'Egg Allergy', clinicalTag: 'no_egg' },
          { value: 'nut_allergy', labelBn: 'চিনাবাদাম বা কাঠবাদাম (Peanut / Tree Nuts)', labelEn: 'Peanuts / Tree Nuts', clinicalTag: 'no_nuts' },
          { value: 'prawn_brinjal_beef', labelBn: 'চিংড়ি মাছ, বেগুন বা গরুর মাংস খেলে চুলকানি হয়', labelEn: 'Prawn, Brinjal, or Beef triggers itching/rashes', clinicalTag: 'no_high_histamine' },
          { value: 'gluten_wheat', labelBn: 'গম বা আটার খাবার (Gluten / Wheat Sensitivity)', labelEn: 'Wheat / Gluten Sensitivity', clinicalTag: 'no_gluten' },
        ],
      },
      {
        id: 'child_dental_oral',
        stepId: 'child_immunity',
        titleBn: '২১. শিশুর দাঁত ও মাড়ির স্বাস্থ্য কেমন? (Dental Caries & Oral Health)',
        titleEn: '21. Dental Health, Cavities, or Bleeding Gums',
        type: 'radio',
        required: true,
        options: [
          { value: 'healthy_teeth', labelBn: 'দাঁত মজবুত ও পরিষ্কার, কোনো ক্যাভিটি নেই', labelEn: 'Strong, healthy teeth with no cavities' },
          { value: 'cavities_chalky', labelBn: 'দাঁতে কালো দাগ/পোকা (Caries) বা দাঁত ক্ষয়ে যাওয়ার সমস্যা আছে', labelEn: 'Dental cavities, black staining, or weak enamel' },
          { value: 'bleeding_gums_ulcer', labelBn: 'মাড়ি থেকে রক্ত পড়ে বা প্রায়ই মুখে ঘা (Mouth Ulcers) হয়', labelEn: 'Bleeding gums or frequent mouth ulcers (Vit C / B-complex need)' },
        ],
      },
      {
        id: 'child_micronutrient_signs',
        stepId: 'child_immunity',
        titleBn: '২২. শিশুর শরীরে পুষ্টি ঘাটতির নিচের কোনো লক্ষণ নজরে পড়ে কি?',
        titleEn: '22. Visible Signs of Pediatric Micronutrient Deficiency',
        type: 'checkbox',
        required: true,
        options: [
          { value: 'none', labelBn: 'এমন কোনো ঘাটতির লক্ষণ নেই', labelEn: 'No visible deficiency signs' },
          { value: 'pale_anemia', labelBn: 'চোখের নিচের পাতা, জিভ বা হাতের তালু ফ্যাকাশে সাদা (আয়রন ঘাটতি)', labelEn: 'Pale lower eyelids, tongue, or palms (Iron deficiency anemia)', clinicalTag: 'pediatric_iron_rich' },
          { value: 'night_leg_pain', labelBn: 'রাতে পায়ের হাড়ে বা গোড়ালিতে ব্যথা করে, মালিশ করে দিতে হয় (ক্যালসিয়াম/Vit D ঘাটতি)', labelEn: 'Nighttime shin/leg aches needing massage (Vit D & Calcium need)', clinicalTag: 'pediatric_calc_vitd' },
          { value: 'pica_mud_chalk', labelBn: 'মাটি, দেয়ালের চুন, কাগজ, পেন্সিল বা বরফ খাওয়ার প্রবণতা (Pica — তীব্র আয়রন/জিংক ঘাটতি)', labelEn: 'Habit of chewing non-food items like chalk, mud, paper, or ice (Pica)', clinicalTag: 'pica_zinc_iron' },
          { value: 'dry_skin_nail_spots', labelBn: 'নখে সাদা দাগ, ঠোঁটের কোণায় ঘা বা চুল পাতলা ও লালচে হওয়া', labelEn: 'White spots on nails, cracked mouth corners, or sparse/brittle hair' },
        ],
      },
    ],
  },

  {
    id: 'child_neuro_prakriti',
    badgeBn: 'ধাপ ৫ • মেধা, ঘুম ও প্রকৃতি (৫টি প্রশ্ন)',
    badgeEn: 'Step 5 • Brain, Sleep & Prakriti (5 Qs)',
    titleBn: 'শিশুর আয়ুর্বেদিক প্রকৃতি, মেধা বিকাশ ও স্ক্রিন টাইম',
    titleEn: 'Pediatric Ayurvedic Prakriti, Neuro-Development & Screen Routine',
    subtitleBn: 'শিশুর মেজাজ, মনোযোগ, ঘুম এবং মোবাইল দেখে খাওয়ার অভ্যাস মূল্যায়ন',
    subtitleEn: 'Assesses temperament, classroom attention, sleep quality, and screen-feeding dependency',
    icon: '🧠',
    questions: [
      {
        id: 'child_prakriti',
        stepId: 'child_neuro_prakriti',
        titleBn: '২৩. শিশুর স্বাভাবিক স্বভাব ও শারীরিক গঠন কেমন? (Pediatric Ayurvedic Prakriti)',
        titleEn: "23. Child's Constitutional Temperament & Body Frame (Ayurvedic Prakriti)",
        type: 'radio',
        required: true,
        options: [
          { value: 'Vata', labelBn: 'চঞ্চল, এক জায়গায় স্থির থাকে না, ছিপছিপে গঠন, ঘুম হালকা ও দ্রুত কথা শেখে (বাত প্রকৃতি)', labelEn: 'Hyperactive/energetic, slender build, light sleeper, quick learner (Vata Child)' },
          { value: 'Pitta', labelBn: 'বুদ্ধিদীপ্ত, জেদি বা দ্রুত রেগে যায়, শরীরে গরম ও ঘাম বেশি, ক্ষুধা তীব্র (পিত্ত প্রকৃতি)', labelEn: 'Sharp-minded, strong-willed, sweats easily on head/neck, strong appetite (Pitta Child)' },
          { value: 'Kapha', labelBn: 'শান্ত ও লক্ষ্মী স্বভাব, গোলগাল গঠন, ঘুম গভীর কিন্তু সহজে সর্দি-কফ জমে (কফ প্রকৃতি)', labelEn: 'Calm, affectionate, sturdy/chubby build, deep sleeper, prone to mucus/cold (Kapha Child)' },
        ],
      },
      {
        id: 'child_sleep_quality',
        stepId: 'child_neuro_prakriti',
        titleBn: '২৪. শিশুর রাতের ঘুমের সময় এবং ঘুমের ধরন কেমন?',
        titleEn: '24. Night Sleep Schedule & Breathing Pattern During Sleep',
        type: 'radio',
        required: true,
        options: [
          { value: 'sound_early_sleep', labelBn: 'রাত ১০টার মধ্যে ঘুমিয়ে পড়ে এবং ৯–১০ ঘণ্টা গভীর ঘুমায়', labelEn: 'Sleeps by 10 PM and gets 9–10 hours of sound sleep' },
          { value: 'late_restless_sleep', labelBn: 'রাত ১১–১২টার আগে ঘুমাতে চায় না এবং ঘুমের মধ্যে ছটফট করে', labelEn: 'Sleeps late (after 11 PM) with restless tossing and turning' },
          { value: 'mouth_breathing_snoring', labelBn: 'ঘুমের মধ্যে মুখ হা করে শ্বাস নেয় (Mouth Breathing) বা নাক ডাকে', labelEn: 'Sleeps with open mouth or snores (Adenoid / Airway inflammation)' },
        ],
      },
      {
        id: 'child_screen_feeding',
        stepId: 'child_neuro_prakriti',
        titleBn: '২৫. মোবাইল/টিভি দেখিয়ে খাওয়ানোর অভ্যাস এবং সারাদিনের স্ক্রিন টাইম কেমন?',
        titleEn: '25. Screen-Feeding Dependency & Daily Mobile/TV Exposure',
        subtitleBn: 'মোবাইল দেখে খেলে মস্তিষ্কের Cephalic Phase হজম রস নিঃসরণ কমে যায়',
        subtitleEn: 'Screen feeding suppresses cephalic digestive enzyme secretion and satiety cues',
        type: 'radio',
        required: true,
        options: [
          { value: 'no_screen_meal', labelBn: 'খাওয়ার সময় কোনো মোবাইল/টিভি দেওয়া হয় না (স্ক্রিন টাইম ১ ঘণ্টার কম)', labelEn: 'Eats without screens; total daily screen time < 1 hour' },
          { value: 'occasional_screen', labelBn: 'মাঝে মাঝে টিভি/কার্টুন চলে, তবে নিজে খেতে পারে', labelEn: 'Occasional TV on during meals; 1–2 hours screen time/day' },
          { value: 'strict_mobile_feeding', labelBn: 'হাতে মোবাইল বা কার্টুন না দিলে এক লোকমাও মুখে নেয় না (Screen Dependency)', labelEn: 'Refuses to open mouth without mobile/YouTube videos during every meal', clinicalTag: 'screen_weaning_protocol' },
        ],
      },
      {
        id: 'child_focus_memory',
        stepId: 'child_neuro_prakriti',
        titleBn: '২৬. পড়াশোনায় মনোযোগ, কথা বলা এবং আচরণগত বিকাশ কেমন? (Neuro-Development)',
        titleEn: '26. Attention Span, Speech/Learning Milestones & Hyperactivity',
        type: 'radio',
        required: true,
        options: [
          { value: 'age_appropriate', labelBn: 'বয়স অনুযায়ী মনোযোগ, স্মৃতিশক্তি ও কথা বলা স্বাভাবিক ও প্রখর', labelEn: 'Age-appropriate focus, memory, and speech milestones' },
          { value: 'distracted_hyper', labelBn: 'মনোযোগ ধরে রাখতে পারে না, অতিরিক্ত অস্থিরতা (Hyperactivity) বা জেদ বেশি', labelEn: 'Short attention span, easily distracted, or frequent tantrums/hyperactivity', clinicalTag: 'omega3_dha_neuro' },
          { value: 'speech_delay_asd', labelBn: 'কথা বলতে দেরি (Speech Delay), আই-কন্টাক্ট কম বা সেন্সরি ফুড অ্যাভার্সন আছে (ASD/ADHD Spectrum)', labelEn: 'Speech delay, sensory food texture aversion, or neuro-developmental support needed', clinicalTag: 'neuro_gut_protocol' },
        ],
      },
      {
        id: 'child_outdoor_sunlight',
        stepId: 'child_neuro_prakriti',
        titleBn: '২৭. শিশু প্রতিদিন রোদে বা খোলা মাঠে দৌড়ঝাঁপ ও খেলাধুলা করার সুযোগ পায় কি?',
        titleEn: '27. Daily Outdoor Physical Play & Natural Sunlight Exposure',
        type: 'radio',
        required: true,
        options: [
          { value: 'daily_outdoor', labelBn: 'প্রতিদিন অন্তত ৪৫–৬০ মিনিট বাইরে বা রোদে খেলাধুলা করে', labelEn: 'Plays outdoors in natural light for 45–60+ minutes daily' },
          { value: 'weekends_only', labelBn: 'সপ্তাহে ১–২ দিন বাইরে যায়, বাকি সময় বাসায় থাকে', labelEn: 'Plays outdoors only 1–2 days a week' },
          { value: 'mostly_indoors', labelBn: 'সারাদিন ঘরের ভেতরেই থাকে, রোদ বা মাঠে খেলার সুযোগ পায় না', labelEn: 'Mostly stays indoors in apartment; minimal sunlight exposure' },
        ],
      },
    ],
  },

  {
    id: 'child_medical_labs',
    badgeBn: 'ধাপ ৬ • মেডিকেল ও ল্যাব (৫টি প্রশ্ন)',
    badgeEn: 'Step 6 • Medical & Lab Markers (5 Qs)',
    titleBn: 'শিশুর চিকিৎসা ইতিহাস, সাপ্লিমেন্ট ও ল্যাব রিপোর্ট',
    titleEn: 'Pediatric Medical History, Supplements & Lab Biomarkers',
    subtitleBn: 'শিশু বিশেষজ্ঞের দেওয়া সিরাপ/সাপ্লিমেন্ট এবং রক্তের রিপোর্ট (যদি থাকে)',
    subtitleEn: 'Current pediatric syrups/drops, caregiver goals, and optional lab values',
    icon: '🩺',
    questions: [
      {
        id: 'med_conditions',
        stepId: 'child_medical_labs',
        titleBn: '২৮. শিশুর নির্ণয়কৃত কোনো শারীরিক সমস্যা বা অতীত ইতিহাস (যেমন: জন্ডিস, কম ওজনে জন্ম, অ্যাজমা) আছে কি?',
        titleEn: '28. Diagnosed Pediatric Conditions or Birth/Medical History',
        type: 'textarea',
        required: true,
        placeholderBn: 'যেমন: রক্তস্বল্পতা, টনসিলের সমস্যা, ল্যাকটোজ অসহিষ্ণুতা অথবা কোনো রোগ নেই...',
        placeholderEn: 'e.g. Mild anemia, recurrent tonsillitis, lactose intolerance, or None...',
        quickChips: [
          { labelBn: 'কম ওজন ও রুচিহীনতা (Underweight)', labelEn: 'Underweight & Poor Appetite', value: 'Pediatric Underweight & Poor Appetite' },
          { labelBn: 'শিশুদের রক্তস্বল্পতা (Pediatric Anemia)', labelEn: 'Pediatric Iron-Deficiency Anemia', value: 'Pediatric Anemia' },
          { labelBn: 'বারবার সর্দি-কাশি / টনসিল / অ্যাজমা', labelEn: 'Recurrent Cold / Tonsillitis / Wheezing', value: 'Recurrent Respiratory Infection / Wheezing' },
          { labelBn: 'কোষ্ঠকাঠিন্য ও পেটের গ্যাস', labelEn: 'Chronic Pediatric Constipation', value: 'Pediatric Constipation & Gut Dysbiosis' },
          { labelBn: 'অতিরিক্ত ওজন (Childhood Obesity)', labelEn: 'Childhood Overweight', value: 'Childhood Overweight' },
          { labelBn: 'কোনো বিশেষ রোগ নেই (সুষম বৃদ্ধি)', labelEn: 'No Chronic Illness (Healthy Growth)', value: 'Healthy Pediatric Growth & Immunity' },
        ],
      },
      {
        id: 'med_medications',
        stepId: 'child_medical_labs',
        titleBn: '২৯. বর্তমানে শিশুকে কোনো ভিটামিন সিরাপ, আয়রন/ক্যালসিয়াম ড্রপ বা ইনহেলার দেওয়া হচ্ছে কি?',
        titleEn: '29. Current Pediatric Syrups, Drops, Vitamins, or Inhalers',
        type: 'textarea',
        required: true,
        placeholderBn: 'যেমন: জিংক সিরাপ, ভিটামিন ডি ড্রপ, ক্যালসিয়াম, মন্টেলুকাস্ট অথবা কিছুই না...',
        placeholderEn: 'e.g. Zinc syrup, Vitamin D3 drops, Iron drops, Montelukast, or None...',
        quickChips: [
          { labelBn: 'মাল্টিভিটামিন / কড লিভার অয়েল সিরাপ', labelEn: 'Multivitamin / Cod Liver Oil', value: 'Multivitamin / Cod Liver Oil Syrup' },
          { labelBn: 'ক্যালসিয়াম ও ভিটামিন D3 সিরাপ/ড্রপ', labelEn: 'Calcium & Vitamin D3', value: 'Calcium & Vitamin D3 Supplement' },
          { labelBn: 'আয়রন বা জিংক সিরাপ', labelEn: 'Iron / Zinc Syrup', value: 'Iron / Zinc Supplement' },
          { labelBn: 'মন্টেলুকাস্ট / ইনহেলার / অ্যালার্জি ওষুধ', labelEn: 'Montelukast / Inhaler', value: 'Montelukast / Pediatric Inhaler' },
          { labelBn: 'কোনো ওষুধ বা সিরাপ চলছে না', labelEn: 'No Medications or Syrups', value: 'None' },
        ],
      },
      {
        id: 'med_targets',
        stepId: 'child_medical_labs',
        titleBn: '৩০. অভিভাবক হিসেবে শিশুর পুষ্টি ও স্বাস্থ্যের প্রধান লক্ষ্য কী?',
        titleEn: "30. Parent's Primary Nutritional Goal for the Child",
        type: 'textarea',
        required: true,
        placeholderBn: 'যেমন: শিশুর খাবারের রুচি বাড়ানো, ওজন ও উচ্চতা বৃদ্ধি, মেধা বিকাশ এবং সর্দি-কাশি কমানো...',
        placeholderEn: 'e.g. Improve appetite, healthy weight & height gain, brain focus, stronger immunity...',
        quickChips: [
          { labelBn: 'খাবারের রুচি ও স্বাস্থ্যকর ওজন বৃদ্ধি', labelEn: 'Boost Appetite & Healthy Weight Gain', value: 'Boost Appetite & Healthy Weight Gain' },
          { labelBn: 'উচ্চতা বৃদ্ধি ও হাড় মজবুত করা', labelEn: 'Height Growth & Bone Strength', value: 'Optimal Height Velocity & Bone Mineralization' },
          { labelBn: 'মেধা, স্মৃতিশক্তি ও মনোযোগ বৃদ্ধি', labelEn: 'Brain Development, Memory & Focus', value: 'Neuro-Development, Memory & Classroom Focus' },
          { labelBn: 'রোগ প্রতিরোধ ক্ষমতা বৃদ্ধি (ঠান্ডা-কাশি রোধ)', labelEn: 'Stronger Immunity Against Cold/Cough', value: 'Respiratory Immunity & Gut Microbiome Strength' },
        ],
      },
      {
        id: 'emergency_name',
        stepId: 'child_medical_labs',
        titleBn: '৩১. অভিভাবকের নাম (বাবা / মা - Parent Name)',
        titleEn: '31. Parent / Primary Caregiver Name',
        type: 'text',
        required: true,
        placeholderBn: 'বাবা অথবা মায়ের নাম...',
        placeholderEn: "Father's or Mother's name...",
      },
      {
        id: 'emergency_phone',
        stepId: 'child_medical_labs',
        titleBn: '৩২. অভিভাবকের মোবাইল / হোয়াটসঅ্যাপ নম্বর (ঐচ্ছিক)',
        titleEn: '32. Parent Mobile / WhatsApp Number (Optional)',
        type: 'text',
        placeholderBn: '017XXXXXXXX',
        placeholderEn: '+88017XXXXXXXX',
      },
    ],
  },
];

// ============================================================================
// BUILD UNIFIED TABS FOR ANY SELECTED COHORT
// ============================================================================

export function getUnifiedAssessmentTabs(
  cohort: CohortType,
  currentGender: string
): UnifiedAssessmentTab[] {
  // 1. Child Cohort gets its dedicated 32-question pediatric 6-tab package
  if (cohort === 'child_pediatric') {
    return PEDIATRIC_32_QUESTIONS_BY_TAB;
  }

  // 2. Adult, Pregnancy, Oncology, and Adolescent Cohorts get the full
  // 30-32 Foundational Clinical Questions + Female Focus (when Female) + 10 Cohort-Specific Questions
  const isFemale =
    cohort === 'pregnancy_lactation' ||
    currentGender === 'Female' ||
    currentGender === 'মহিলা';

  // Convert COHORT_QUESTIONS[cohort] + EXTRA_COHORT_QUESTIONS[cohort] into UnifiedQuestion[]
  const rawCohortQs: CohortQuestion[] = [
    ...(COHORT_QUESTIONS[cohort] || []),
    ...(EXTRA_COHORT_QUESTIONS[cohort] || []),
  ];

  const mappedCohortQuestions: UnifiedQuestion[] = rawCohortQs.map((cq) => ({
    id: cq.id,
    stepId: 'cohort_clinical',
    titleBn: cq.titleBn,
    titleEn: cq.titleEn,
    subtitleBn: cq.subtitleBn,
    subtitleEn: cq.subtitleEn,
    type: cq.type === 'checkbox' ? 'checkbox' : 'radio',
    required: true,
    options: (cq.options || []).map((o) => ({
      value: o.value,
      labelBn: o.labelBn,
      labelEn: o.labelEn,
      clinicalTag: o.clinicalTag,
    })),
  }));

  const cohortTabLabels: Record<CohortType, { titleBn: string; titleEn: string; icon: string }> = {
    pregnancy_lactation: {
      titleBn: 'গর্ভকালীন ও স্তন্যদানকালীন বিশেষ ক্লিনিক্যাল প্রশ্ন (১০টি প্রশ্ন)',
      titleEn: 'Pregnancy & Lactation Clinical Deep-Dive (10 Questions)',
      icon: '🤰',
    },
    child_pediatric: {
      titleBn: 'শিশু পুষ্টি বিশেষ প্রশ্ন',
      titleEn: 'Pediatric Clinical Questions',
      icon: '🧒',
    },
    oncology_cancer: {
      titleBn: 'ক্যান্সার রিকভারি ও নিউট্রোপেনিক সেফটি প্রশ্ন (১০টি প্রশ্ন)',
      titleEn: 'Oncology Recovery & Neutropenic Safety Deep-Dive (10 Questions)',
      icon: '🎗️',
    },
    adolescent_growth: {
      titleBn: 'কৈশোর বৃদ্ধি, অ্যানিমিয়া ও হরমোন বিশেষ প্রশ্ন (১০টি প্রশ্ন)',
      titleEn: 'Adolescent Growth Spurt & Anemia Deep-Dive (10 Questions)',
      icon: '⚡',
    },
    adult_metabolic: {
      titleBn: 'মেটাবলিক ও দীর্ঘস্থায়ী রোগভিত্তিক বিশেষ প্রশ্ন (১০টি প্রশ্ন)',
      titleEn: 'Disease-Specific Metabolic & Organ Deep-Dive (10 Questions)',
      icon: '❤️‍🩹',
    },
  };

  const tabs: UnifiedAssessmentTab[] = [
    {
      id: 'basic',
      badgeBn: 'ধাপ ১ • অ্যানথ্রোপোমেট্রি (৬টি প্রশ্ন)',
      badgeEn: 'Step 1 • Anthropometrics (6 Qs)',
      titleBn: 'অ্যানথ্রোপোমেট্রিক ডাটা ও মৌলিক প্রোফাইল',
      titleEn: 'Anthropometric Data & Vital Profile',
      subtitleBn: 'বয়স, লিঙ্গ, উচ্চতা, ওজন ও দৈনন্দিন শারীরিক পরিশ্রমের হিসাব',
      subtitleEn: 'Name, age, biological sex, height, weight, and activity level',
      icon: '📐',
      questions: ADULT_FOUNDATIONAL_QUESTIONS.basic,
    },
  ];

  if (isFemale) {
    tabs.push({
      id: 'shakti',
      badgeBn: 'ফিমেল ফোকাস • শক্তি চক্র (৫টি প্রশ্ন)',
      badgeEn: 'Female Focus • Shakti Cycle (5 Qs)',
      titleBn: 'ফিমেল ফোকাস — পিরিয়ড সাইকেল, LMP ও হরমোনাল স্বাস্থ্য',
      titleEn: 'Female Focus — Shakti Cycle Sync & Reproductive Health',
      subtitleBn: 'শেষ মাসিকের তারিখ (LMP), চক্রের দৈর্ঘ্য, PCOS ও হরমোনাল ব্যালেন্স নির্ণয়',
      subtitleEn: 'Last period date, cycle regularity, flow characteristics, PCOS, and luteal symptoms',
      icon: '🌸',
      questions: ADULT_FOUNDATIONAL_QUESTIONS.shakti,
    });
  }

  tabs.push(
    {
      id: 'diet_habit',
      badgeBn: 'খাদ্যাভ্যাস (৬টি প্রশ্ন)',
      badgeEn: 'Dietary History (6 Qs)',
      titleBn: 'দৈনন্দিন খাদ্যাভ্যাস ও মিল টাইমিং (২৪ ঘণ্টার ডায়েট রিকল)',
      titleEn: '24-Hour Dietary Recall & Meal Timing Habits',
      subtitleBn: 'সকাল থেকে রাত পর্যন্ত কী খান এবং পানির পরিমাণ',
      subtitleEn: 'Breakfast, mid-morning, lunch, evening snacks, dinner timing, and hydration',
      icon: '🍽️',
      questions: ADULT_FOUNDATIONAL_QUESTIONS.diet_habit,
    },
    {
      id: 'physical',
      badgeBn: 'আয়ুর্বেদিক বিকৃতি (৫টি প্রশ্ন)',
      badgeEn: 'Ayurvedic Vikriti (5 Qs)',
      titleBn: 'আয়ুর্বেদিক বিকৃতি নির্ণয় (বাত • পিত্ত • কফ ভারসাম্য)',
      titleEn: 'Ayurvedic Vikriti Assessment (Vata • Pitta • Kapha Imbalance)',
      subtitleBn: 'ঘুম, মানসিক চাপ, শরীরের তাপমাত্রা, ত্বক ও শক্তির ছন্দ বিশ্লেষণ',
      subtitleEn: 'Sleep architecture, emotional stress response, thermal sensitivity, skin, and stamina',
      icon: '🌿',
      questions: ADULT_FOUNDATIONAL_QUESTIONS.physical,
    },
    {
      id: 'digestion',
      badgeBn: 'মাইক্রোবায়োম ও হজম (৫টি প্রশ্ন)',
      badgeEn: 'Gut Microbiome (5 Qs)',
      titleBn: 'গাট মাইক্রোবায়োম, অগ্নি ও হজমশক্তি মূল্যায়ন',
      titleEn: 'Gut Microbiome, Digestive Agni & Bristol Stool Assessment',
      subtitleBn: 'পেট ফাঁপা, জিভের প্রলেপ (আম), ক্ষুধা, বাওয়েল মুভমেন্ট ও প্রোবায়োটিক সহনশীলতা',
      subtitleEn: 'Post-meal bloating, morning tongue coating (Ama), Agni, stool scale, and dairy/probiotic reaction',
      icon: '🦠',
      questions: ADULT_FOUNDATIONAL_QUESTIONS.digestion,
    },
    {
      id: 'metabolism_inflammation',
      badgeBn: 'মেটাবলিজম ও প্রদাহ (১০টি প্রশ্ন)',
      badgeEn: 'Metabolism & Inflammation (10 Qs)',
      titleBn: 'ফাংশনাল নিউট্রিশন — ইনসুলিন সংবেদনশীলতা ও সিস্টেমিক প্রদাহ',
      titleEn: 'Functional Nutrition — Insulin Sensitivity & Systemic Inflammation',
      subtitleBn: 'খাবার পর ক্লান্তি, সুগার ক্রেভিং, ভিসেরাল ফ্যাট, গাঁটে ব্যথা, ইডিমা ও সেলুলার এনার্জি',
      subtitleEn: 'Post-meal glucose crash, cravings, visceral fat, joint stiffness, edema, and cellular fatigue',
      icon: '🔥',
      questions: ADULT_FOUNDATIONAL_QUESTIONS.metabolism_inflammation,
    },
    {
      id: 'cohort_clinical',
      badgeBn: 'রোগ/কোহর্ট বিশেষ প্রশ্ন (১০টি প্রশ্ন)',
      badgeEn: 'Condition Specific (10 Qs)',
      titleBn: cohortTabLabels[cohort].titleBn,
      titleEn: cohortTabLabels[cohort].titleEn,
      subtitleBn: 'আপনার নির্বাচিত শারীরিক অবস্থা বা রোগের গভীর ক্লিনিক্যাল মূল্যায়ন',
      subtitleEn: 'Targeted clinical questions tailored to your selected life-stage or disease condition',
      icon: cohortTabLabels[cohort].icon,
      questions: mappedCohortQuestions,
    },
    {
      id: 'medical_labs',
      badgeBn: 'ওষুধের ইতিহাস ও ল্যাব (৬টি প্রশ্ন + ল্যাব)',
      badgeEn: 'Medications & Labs (6 Qs + Labs)',
      titleBn: 'মেডিকেশন হিস্ট্রি, ফুড-ড্রাগ ইন্টারঅ্যাকশন ও ল্যাব মার্কার',
      titleEn: 'Medication History, Food-Drug Safety & Clinical Lab Biomarkers',
      subtitleBn: 'বর্তমান ওষুধের তালিকা, রোগের ইতিহাস, ডায়েট লক্ষ্য এবং রক্তের ল্যাব রিপোর্ট',
      subtitleEn: 'Current prescription drugs, diagnosed conditions, primary goal, and lab test values',
      icon: '💊',
      questions: ADULT_FOUNDATIONAL_QUESTIONS.medical_labs,
    }
  );

  return tabs;
}

// ============================================================================
// REAL CLINICAL SCORING ENGINE FROM UNIFIED ASSESSMENT ANSWERS
// ============================================================================

export function computeUnifiedClinicalAnalysis(
  cohort: CohortType,
  flatAnswers: Record<string, string>,
  isBn: boolean
): {
  age: number;
  gender: string;
  weight: number;
  height: number;
  dosha: string;
  microbiomeScore: number;
  metabolicType: string;
  inflammatoryIndex: number;
  alkalineBalance: string;
  psychologicalProfile: string;
  hasHypoacidity: boolean;
  cycleData?: { lastPeriodDate: string; cycleLength: number; hasPCOS: boolean };
  analysis: AssessmentAnalysis;
} {
  const defaultAge = cohort === 'child_pediatric' ? 6 : cohort === 'adolescent_growth' ? 15 : 32;
  const defaultWeight = cohort === 'child_pediatric' ? 20 : cohort === 'adolescent_growth' ? 48 : 65;
  const defaultHeight = cohort === 'child_pediatric' ? 115 : cohort === 'adolescent_growth' ? 158 : 162;

  const age = Math.max(1, parseInt(flatAnswers['basic_age'] || '', 10) || defaultAge);
  const weight = Math.max(5, parseFloat(flatAnswers['basic_weight'] || '') || defaultWeight);
  const height = Math.max(50, parseFloat(flatAnswers['basic_height'] || '') || defaultHeight);
  const gender =
    cohort === 'pregnancy_lactation'
      ? 'Female'
      : flatAnswers['basic_gender'] || 'Female';

  // 1. Dosha Calculation
  let vataCount = 0;
  let pittaCount = 0;
  let kaphaCount = 0;

  if (cohort === 'child_pediatric') {
    const childPrakriti = flatAnswers['child_prakriti'] || 'Vata';
    if (childPrakriti === 'Vata') {
      vataCount = 3;
      pittaCount = 1;
      kaphaCount = 1;
    } else if (childPrakriti === 'Pitta') {
      pittaCount = 3;
      vataCount = 1;
      kaphaCount = 1;
    } else {
      kaphaCount = 3;
      vataCount = 1;
      pittaCount = 1;
    }
    if (flatAnswers['child_gut_status'] === 'constipation') vataCount += 2;
    if (flatAnswers['child_immunity_resp'] === 'monthly_tonsils') kaphaCount += 2;
    if (flatAnswers['child_allergy_skin'] === 'skin_eczema') pittaCount += 2;
  } else {
    ['physical_1', 'physical_2', 'physical_3', 'physical_4', 'physical_5'].forEach((id) => {
      const val = flatAnswers[id];
      if (val === 'Vata') vataCount += 1;
      else if (val === 'Pitta') pittaCount += 1;
      else if (val === 'Kapha') kaphaCount += 1;
    });
    if (flatAnswers['digestion_3'] === 'a') vataCount += 1;
    if (flatAnswers['digestion_3'] === 'b') pittaCount += 1;
    if (flatAnswers['digestion_3'] === 'c') kaphaCount += 1;
  }

  const totalDosha = vataCount + pittaCount + kaphaCount || 1;
  const vataPct = Math.round((vataCount / totalDosha) * 100);
  const pittaPct = Math.round((pittaCount / totalDosha) * 100);
  const kaphaPct = Math.max(0, 100 - vataPct - pittaPct);

  let dosha = 'Tridoshic';
  const sortedDoshas = [
    { name: 'Vata', count: vataCount },
    { name: 'Pitta', count: pittaCount },
    { name: 'Kapha', count: kaphaCount },
  ].sort((a, b) => b.count - a.count);

  if (sortedDoshas[0].count > 0 && sortedDoshas[1].count > 0 && sortedDoshas[0].count - sortedDoshas[1].count <= 1) {
    dosha = `${sortedDoshas[0].name}-${sortedDoshas[1].name}`;
  } else if (sortedDoshas[0].count > 0) {
    dosha = sortedDoshas[0].name;
  }

  // 2. Microbiome Score Calculation (0 to 100)
  let microbiomeScore = 88;
  if (cohort === 'child_pediatric') {
    if (flatAnswers['child_gut_status'] === 'constipation' || flatAnswers['child_gut_status'] === 'loose_undigested') {
      microbiomeScore -= 14;
    }
    if (flatAnswers['child_tummy_ache'] !== 'none') microbiomeScore -= 8;
    if (flatAnswers['child_bloating_gas'] === 'distended_ama') microbiomeScore -= 12;
    if (flatAnswers['child_deworming'] === 'worm_symptoms_present') microbiomeScore -= 12;
    if (flatAnswers['child_antibiotics'] === 'multiple_courses') microbiomeScore -= 14;
    else if (flatAnswers['child_antibiotics'] === 'once') microbiomeScore -= 6;
  } else {
    ['digestion_1', 'digestion_2', 'digestion_3', 'digestion_4'].forEach((id) => {
      const v = flatAnswers[id];
      if (v === 'c') microbiomeScore -= 12;
      else if (v === 'b' && id !== 'digestion_4') microbiomeScore -= 6;
      else if (v === 'a' && id === 'digestion_4') microbiomeScore -= 10; // Constipation Type 1-2
    });
    if (flatAnswers['digestion_5'] === 'a') microbiomeScore -= 8; // Dairy/fermented intolerance
  }
  microbiomeScore = Math.max(35, Math.min(96, microbiomeScore));

  const hasHypoacidity =
    flatAnswers['digestion_1'] === 'c' ||
    flatAnswers['digestion_2'] === 'c' ||
    flatAnswers['digestion_3'] === 'c' ||
    flatAnswers['child_bloating_gas'] === 'distended_ama';

  // 3. Metabolic Efficiency & Inflammatory Index
  let insulinScore = 0;
  let inflamScore = 0;

  if (cohort === 'child_pediatric') {
    if (flatAnswers['child_junk_sugar'] === 'daily_junk') {
      insulinScore += 4;
      inflamScore += 4;
    } else if (flatAnswers['child_junk_sugar'] === '3_4_times_week') {
      insulinScore += 2;
      inflamScore += 2;
    }
    if (flatAnswers['child_growth_curve'] === 'overweight_gain') insulinScore += 3;
    if (flatAnswers['child_immunity_resp'] === 'monthly_tonsils') inflamScore += 4;
    if (flatAnswers['child_allergy_skin'] !== 'no_atopy') inflamScore += 3;
  } else {
    ['metabolism_1', 'metabolism_2', 'metabolism_3', 'metabolism_4', 'metabolism_5'].forEach((id) => {
      const v = flatAnswers[id];
      if (v === 'c') insulinScore += 2;
      else if (v === 'b') insulinScore += 1;
    });
    ['inflammation_1', 'inflammation_2', 'inflammation_3', 'inflammation_4', 'inflammation_5'].forEach((id) => {
      const v = flatAnswers[id];
      if (v === 'c') inflamScore += 2;
      else if (v === 'b') inflamScore += 1;
    });
  }

  const inflammatoryIndex = Math.max(1, Math.min(10, Math.round(inflamScore * 0.9) || 2));
  let calculatedAlkaline = 7.42 - inflamScore * 0.035 - insulinScore * 0.02;
  calculatedAlkaline = Math.max(6.85, Math.min(7.55, calculatedAlkaline));

  const microbiomeStatus =
    microbiomeScore >= 75
      ? isBn
        ? 'বৈচিত্র্যময় ও সুষম মাইক্রোবায়োম'
        : 'Diverse & Resilient Microbiome'
      : microbiomeScore >= 55
      ? isBn
        ? 'মৃদু ডিসবায়োসিস ও ধীর অগ্নি'
        : 'Moderate Dysbiosis & Sluggish Agni'
      : isBn
      ? 'সঙ্কটপূর্ণ ডিসবায়োসিস (মিউকোসাল হিলিং প্রয়োজন)'
      : 'Depleted Microbiome (Mucosal Repair Needed)';

  const metabolicEfficiency =
    insulinScore <= 2
      ? isBn
        ? 'মেটাবলিক ফ্লেক্সিবল (উত্তম)'
        : 'Metabolically Flexible'
      : insulinScore <= 5
      ? isBn
        ? 'মৃদু ইনসুলিন রেজিস্ট্যান্স প্রবণতা'
        : 'Early Insulin Resistance Trend'
      : isBn
      ? 'উচ্চ ইনসুলিন রেজিস্ট্যান্স ও গ্লাইসেমিক স্ট্রেস'
      : 'Significant Insulin Resistance & Glycemic Stress';

  const inflammatoryStatus =
    inflammatoryIndex <= 3
      ? isBn
        ? 'ন্যূনতম প্রদাহ (ভালো সেলুলার সুরক্ষা)'
        : 'Minimal Systemic Inflammation'
      : inflammatoryIndex <= 6
      ? isBn
        ? 'মাঝারি দীর্ঘস্থায়ী প্রদাহ'
        : 'Moderate Chronic Inflammation'
      : isBn
      ? 'উচ্চ সিস্টেমিক প্রদাহ (অ্যান্টি-ইনফ্লামেটরি প্রটোকল আবশ্যক)'
      : 'High Systemic Inflammation (Anti-Inflammatory Protocol Active)';

  const psychologicalProfile =
    vataCount >= pittaCount && vataCount >= kaphaCount
      ? isBn
        ? 'সংবেদনশীল ও সৃজনশীল (বাত প্রবণ)'
        : 'Sensitive & Dynamic (Vata-Dominant)'
      : pittaCount >= vataCount && pittaCount >= kaphaCount
      ? isBn
        ? 'লক্ষ্যভেদী ও তীক্ষ্ণ (পিত্ত প্রবণ)'
        : 'Focused & Driven (Pitta-Dominant)'
      : isBn
      ? 'শান্ত ও স্থিতিশীল (কফ প্রবণ)'
      : 'Calm & Grounded (Kapha-Dominant)';

  const bmi = (weight / Math.pow(height / 100, 2)).toFixed(1);

  const healthSummary = isBn
    ? `BMI ${bmi} kg/m² • প্রধান দোষ: ${dosha} • মাইক্রোবায়োম স্কোর: ${microbiomeScore}% • মেটাবলিক স্ট্যাটাস: ${metabolicEfficiency}। আপনার সম্পূর্ণ উত্তরের ভিত্তিতে পার্সোনালাইজড ক্লিনিক্যাল ডায়েট প্রটোকল তৈরি করা হয়েছে।`
    : `BMI ${bmi} kg/m² • Dominant Dosha: ${dosha} • Microbiome Score: ${microbiomeScore}% • Metabolic Status: ${metabolicEfficiency}. Personalized clinical nutrition protocol calibrated from your full assessment.`;

  const dietImpact = isBn
    ? 'আপনার ২৪ ঘণ্টার খাদ্যাভ্যাস, হজমশক্তি (অগ্নি), মেটাবলিক লক্ষণ এবং বর্তমান ওষুধের তালিকার সমন্বয়ে মেকার-চেকার ভেরিফাইড ডায়েট চার্ট প্রস্তুত করা হয়েছে।'
    : 'Your 24-hour dietary recall, digestive Agni, metabolic markers, and medication history have been synthesized into a Maker-Checker verified clinical plan.';

  // 4. Female Cycle Data (Shakti)
  let cycleData: { lastPeriodDate: string; cycleLength: number; hasPCOS: boolean } | undefined;
  if (gender === 'Female' && cohort !== 'child_pediatric') {
    const lmp = flatAnswers['shakti_last_period'] || new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0];
    const cycLen = parseInt(flatAnswers['shakti_cycle_length'] || '28', 10) || 28;
    const pcosRaw = (flatAnswers['shakti_pcos'] || '').toLowerCase();
    const medRaw = (flatAnswers['med_conditions'] || '').toLowerCase();
    const hasPCOS = pcosRaw.includes('pcos') || medRaw.includes('pcos') || medRaw.includes('pcod');
    cycleData = {
      lastPeriodDate: lmp,
      cycleLength: cycLen > 0 ? cycLen : 28,
      hasPCOS,
    };
  }

  return {
    age,
    gender,
    weight,
    height,
    dosha,
    microbiomeScore,
    metabolicType: metabolicEfficiency,
    inflammatoryIndex,
    alkalineBalance: calculatedAlkaline >= 7.3 ? 'Optimal' : 'Acidic',
    psychologicalProfile,
    hasHypoacidity,
    cycleData,
    analysis: {
      doshaBreakdown: {
        vata: vataPct,
        pitta: pittaPct,
        kapha: kaphaPct,
      },
      microbiomeStatus,
      metabolicEfficiency,
      inflammatoryStatus,
      psychologicalProfile,
      alkalineScore: parseFloat(calculatedAlkaline.toFixed(2)),
      healthSummary,
      dietImpact,
    },
  };
}
