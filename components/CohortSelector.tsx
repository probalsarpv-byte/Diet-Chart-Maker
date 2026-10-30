import React, { useState } from 'react';
import {
  Baby,
  HeartPulse,
  Activity,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Apple,
  AlertTriangle,
  Calendar,
  Flame,
} from 'lucide-react';
import { CohortType, Language } from '../types';

interface Props {
  lang: Language;
  darkMode?: boolean;
  onSelectCohort: (cohort: CohortType, selectedMonth?: number) => void;
  onBack?: () => void;
}

export const CohortSelector: React.FC<Props> = ({
  lang,
  darkMode,
  onSelectCohort,
  onBack,
}) => {
  const isBn = lang === 'bn';
  const [activeCohort, setActiveCohort] = useState<CohortType>('pregnancy_lactation');
  const [selectedPregnancyMonth, setSelectedPregnancyMonth] = useState<number>(3);

  const cohorts: {
    id: CohortType;
    icon: React.ElementType;
    badgeBn: string;
    badgeEn: string;
    titleBn: string;
    titleEn: string;
    descriptionBn: string;
    descriptionEn: string;
    featuresBn: string[];
    featuresEn: string[];
    gradient: string;
    borderActive: string;
  }[] = [
    {
      id: 'pregnancy_lactation',
      icon: Baby,
      badgeBn: 'আয়ুর্বেদিক মাসানুক্রমিক + ফাংশনাল নিউট্রিশন',
      badgeEn: 'Ayurvedic Masanumasika + Functional Nutrition',
      titleBn: 'গর্ভবতী বা স্তন্যদাত্রী মা (Pregnancy & Lactation)',
      titleEn: 'Pregnant & Lactating Mother',
      descriptionBn:
        'শিশুর মাসিক বিকাশ (১ম থেকে ৯ম মাস) অনুযায়ী আয়ুর্বেদিক মাসানুক্রমিক পথ্য ও ফাংশনাল পুষ্টি। কোনো ঔষধি হার্বস ছাড়া ১০০% নিরাপদ রান্নাঘরের খাবার।',
      descriptionEn:
        'Month-by-month (1st to 9th month) fetal organogenesis diet harmonizing classical Ayurveda and functional nutrition. Zero medicinal herbs.',
      featuresBn: [
        '১ম থেকে ৯ম মাসের ভ্রূণের বিকাশ অনুযায়ী পথ্য',
        'কোনো হার্বস নয় — ১০০% ঘরোয়া নিরাপদ খাবার',
        'মর্নিং সিকনেস, জিডিএম ও পা ফোলা নিরাময়',
        'প্রসব সহজ করতে ৯ম মাসের স্নিগ্ধ খাদ্য',
      ],
      featuresEn: [
        'Fetal-milestone tailored 1-9 month menus',
        'Zero medicinal herbs — 100% wholesome kitchen foods',
        'Hyperemesis, GDM, and preeclampsia safeguards',
        '9th month Apana Vayu & smooth labor prep',
      ],
      gradient: 'from-pink-500 via-rose-500 to-amber-500',
      borderActive: 'border-pink-500 ring-2 ring-pink-500/20',
    },
    {
      id: 'child_pediatric',
      icon: Apple,
      badgeBn: 'বয়সভিত্তিক গ্রোথ ও টিফিন প্ল্যানার',
      badgeEn: 'Age-Tailored Pediatric Growth Engine',
      titleBn: 'শিশু পুষ্টি (Child / Pediatric Nutrition)',
      titleEn: 'Child & Pediatric Nutrition (Ages 1–12)',
      descriptionBn:
        'পিকি ইটিং দূরীকরণ, উচ্চতা ও ওজন বৃদ্ধি, স্কুলের পুষ্টিকর টিফিন বক্স রেসিপি এবং রোগ প্রতিরোধ ক্ষমতা বাড়ানোর বিশেষায়িত পথ্য।',
      descriptionEn:
        'Overcoming fussy/picky eating, linear height spurts, healthy colorful school tiffin planners, and micronutrient density.',
      featuresBn: [
        'টডলার ও স্কুলগামী শিশুর সঠিক পুষ্টি',
        'রঙিন ও সুস্বাদু টিফিন বক্স রেসিপি',
        'জিংক, আয়রন ও ওমেগা-৩ ব্রেন বুস্টার',
        'ঘন ঘন সর্দি-কাশি ও অসুস্থতা প্রতিরোধ',
      ],
      featuresEn: [
        'Toddler & school age dietary transitions',
        'Kid-approved school tiffin snack ideas',
        'Zinc, iron & DHA for cognitive stamina',
        'Immunity building without junk snacks',
      ],
      gradient: 'from-amber-500 via-orange-500 to-yellow-500',
      borderActive: 'border-amber-500 ring-2 ring-amber-500/20',
    },
    {
      id: 'oncology_cancer',
      icon: HeartPulse,
      badgeBn: 'কেমো-রিকভারি ও নিউট্রোপেনিক সতর্কতা',
      badgeEn: 'Chemo-Radiation Convalescence & ANC Shield',
      titleBn: 'ক্যান্সার ও অনকোলজি (Cancer / Oncology Recovery)',
      titleEn: 'Cancer & Oncology Nutrition',
      descriptionBn:
        'কেমোথেরাপি ও রেডিয়েশনের ক্লান্তি দূরীকরণ, মুখে ধাতব স্বাদ ও ঘা প্রশমন, পেশি ক্ষয় (Cachexia) রোধ এবং কঠোর নিউট্রোপেনিক খাদ্য নিরাপত্তা।',
      descriptionEn:
        'Managing chemo-induced dysgeusia, oral mucositis, cachexia prevention, and strict sterile cooking guidelines for low neutrophil counts.',
      featuresBn: [
        'কঠোর নিউট্রোপেনিক খাদ্য নিরাপত্তা অ্যালার্ট',
        'ধাতব স্বাদ দূর করার প্রাকৃতিক লেবু-পুদিনা টিপস',
        'উচ্চ-ক্যালোরি হাই-প্রোটিন নিরাময়কারী ব্রথ',
        'মুখের ঘায়ে সহজে গেলার মতো নরম খাবার',
      ],
      featuresEn: [
        'Strict neutropenic pathogen-free protocols',
        'Dysgeusia & metallic taste neutralizing tips',
        'High-calorie, high-protein mucosal repair broths',
        'Dysphagia-friendly purees and soothing textures',
      ],
      gradient: 'from-purple-600 via-indigo-600 to-cyan-600',
      borderActive: 'border-purple-500 ring-2 ring-purple-500/20',
    },
    {
      id: 'adolescent_growth',
      icon: Activity,
      badgeBn: 'গ্রোথ স্পার্ট, রক্তস্বল্পতা ও স্পোর্টস নিউট্রিশন',
      badgeEn: 'Peak Growth Spurt & Hormonal Equilibrium',
      titleBn: 'কিশোর ও কৈশোর (Adolescent Boys & Girls)',
      titleEn: 'Adolescent Nutrition (Ages 10–19)',
      descriptionBn:
        'দ্রুত উচ্চতা ও পেশি বৃদ্ধির পুষ্টি, কিশোরীদের মাসিকের রক্তাল্পতা দূরীকরণ, হরমোনাল ব্রণের সমাধান এবং পড়ালেখায় মনোযোগ ধরে রাখার ডায়েট।',
      descriptionEn:
        'Powering teenage growth spurts, resolving menstrual anemia, clearing inflammatory acne, and sustaining study focus.',
      featuresBn: [
        'কিশোরীদের রক্তস্বল্পতা ও পিসিওএস প্রতিরোধ',
        'স্পোর্টস ও অ্যাথলেটিক এনার্জি মিল্কশেক',
        'ব্রণ দূরকারী অ্যান্টি-ইনফ্ল্যামেটরি খাবার',
        'বিকেলের ক্লান্তি ও এনার্জি ক্র্যাশ দূরীকরণ',
      ],
      featuresEn: [
        'Menstrual iron recovery and hormone balance',
        'Athletic training glycogen replenishment',
        'Skin clarity and anti-acne functional meals',
        'Zero brain fog during exam preparations',
      ],
      gradient: 'from-emerald-500 via-teal-500 to-blue-500',
      borderActive: 'border-emerald-500 ring-2 ring-emerald-500/20',
    },
    {
      id: 'adult_metabolic',
      icon: Sparkles,
      badgeBn: 'ডায়াবেটিস, ফ্যাটি লিভার ও রক্তচাপ রিভার্সাল',
      badgeEn: 'T2D, NAFLD & Cardiometabolic Reversal',
      titleBn: 'অ্যাডাল্ট মেটাবলিক রোগ (Adult Metabolic Conditions)',
      titleEn: 'Adult Metabolic & Cardiovascular Health',
      descriptionBn:
        'টাইপ-২ ডায়াবেটিস, ফ্যাটি লিভার, ডিসলিপিডেমিয়া, হাইপারটেনশন ও পেটের চর্বি কমানোর বৈজ্ঞানিক কার্ব-সাইক্লিং ও মেটাবলিক রিভার্সাল ডায়েট।',
      descriptionEn:
        'Evidence-based carbohydrate cycling and hepatic de-steatosis for T2D, Grade 1/2/3 Fatty Liver, and hypertension.',
      featuresBn: [
        'HbA1c ও খালি পেটে সুগার নিয়ন্ত্রণ',
        'ফ্যাটি লিভার ও SGPT স্বাভাবিক করার পথ্য',
        'কার্বোহাইড্রেট খাওয়ার পর ক্লান্তি প্রতিরোধ',
        'পেটের অতিরিক্ত ভিসেরাল চর্বি হ্রাস',
      ],
      featuresEn: [
        'HbA1c & fasting insulin stabilization',
        'Liver de-steatosis and SGPT normalization',
        'Elimination of post-meal somnolence (food coma)',
        'Visceral belly fat & lipid optimization',
      ],
      gradient: 'from-cyan-600 via-blue-600 to-indigo-700',
      borderActive: 'border-cyan-500 ring-2 ring-cyan-500/20',
    },
    {
      id: 'underweight_nutrition',
      icon: Flame,
      badgeBn: 'হেলদি ক্যালোরিক সারপ্লাস + লিন মাসল + গাট অগ্নি দীপন',
      badgeEn: 'Healthy Caloric Surplus + Lean Mass + Agni Deepana',
      titleBn: 'আন্ডারওয়েট ও পুষ্টিহীনতা রিকভারি (Underweight & Healthy Weight Gain)',
      titleEn: 'Clinical Underweight, Malabsorption & Lean Mass Gain',
      descriptionBn:
        'অতিরিক্ত শুকিয়ে যাওয়া (BMI < 18.5), রুচিহীনতা, আইবিএস/ম্যালঅ্যাবজর্পশন, হাইপারথাইরয়েড বা অসুস্থতা-পরবর্তী পেশিক্ষয় দূর করে স্বাস্থ্যকর ওজন ও পেশি বৃদ্ধির (Brumhana) বিশেষায়িত ডায়েট।',
      descriptionEn:
        'Integrative Brumhana (nourishing) caloric surplus, gut enzyme restoration, and lean muscle building for underweight patients (BMI < 18.5), malabsorption, hyperthyroidism, and post-illness sarcopenia.',
      featuresBn: [
        '৩০–৩২টি মূল প্রশ্নের সাথে ১০টি বিশেষ আন্ডারওয়েট ক্লিনিক্যাল স্ক্রিনিং',
        'হাইপারথাইরয়েড, আইবিএস/ম্যালঅ্যাবজর্পশন ও পোস্ট-ইনফেকশন কারণ বিশ্লেষণ',
        'গাট অগ্নি দীপন + লিন মাসল বিল্ডিং + হেলদি ক্যালোরিক সারপ্লাস মিল প্ল্যান',
        'ঐচ্ছিক ল্যাব মার্কার (Hb, TSH, Albumin, Vit D3) ও ক্যালোরি-ডেন্স বুস্টার',
      ],
      featuresEn: [
        '30–32 foundational questions + 10 specialized underweight clinical questions',
        'Screens hyperthyroidism, gut malabsorption/IBS, and post-infection sarcopenia',
        'Healthy Caloric Surplus + Lean Muscle Building + Gut Agni Deepana plan',
        'Optional lab markers (Hb, TSH, Albumin, Vit D3) & high-calorie Brumhana boosters',
      ],
      gradient: 'from-teal-500 via-emerald-500 to-lime-600',
      borderActive: 'border-teal-500 ring-2 ring-teal-500/20',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in pb-12">
      {/* Header Banner */}
      <div
        className={`p-6 rounded-3xl border shadow-xl relative overflow-hidden ${
          darkMode
            ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950/40 border-slate-700'
            : 'bg-gradient-to-br from-emerald-50 via-teal-50 to-white border-emerald-200'
        }`}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-600 text-white mb-3 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isBn ? 'ক্লিনিক্যাল স্পেশালাইজেশন' : 'Clinical Specialization'}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {isBn ? 'আপনার স্বাস্থ্য দল (Cohort) নির্বাচন করুন' : 'Select Your Clinical Cohort'}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              {isBn
                ? 'গর্ভবতী মা, শিশু, কিশোর, ক্যান্সার রোগী কিংবা মেটাবলিক স্বাস্থ্য — যার যার শারীরিক অবস্থা অনুযায়ী সম্পূর্ণ ভিন্ন প্রশ্নমালা ও সুনির্দিষ্ট ক্লিনিক্যাল ডায়েট চার্ট তৈরি হবে।'
                : 'Customized clinical questionnaires, specialized lab monitoring, and tailored nutrition regimens for distinct physiological stages.'}
            </p>
          </div>

          {onBack && (
            <button
              onClick={onBack}
              className="self-start md:self-center px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              {isBn ? '← ফিরে যান' : '← Back'}
            </button>
          )}
        </div>
      </div>

      {/* Cohorts Card Grid */}
      <div className="grid grid-cols-1 gap-4">
        {cohorts.map((c) => {
          const isSelected = activeCohort === c.id;
          const IconComp = c.icon;

          return (
            <div
              key={c.id}
              onClick={() => setActiveCohort(c.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
                isSelected
                  ? `${c.borderActive} shadow-lg ${
                      darkMode ? 'bg-slate-800/90' : 'bg-white'
                    }`
                  : darkMode
                  ? 'bg-slate-800/40 border-slate-700/80 hover:bg-slate-800/70 hover:border-slate-600'
                  : 'bg-white/80 border-slate-200 hover:bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md bg-gradient-to-tr ${c.gradient}`}
                  >
                    <IconComp className="w-6 h-6" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
                        {isBn ? c.badgeBn : c.badgeEn}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {isBn ? c.titleBn : c.titleEn}
                    </h3>

                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                      {isBn ? c.descriptionBn : c.descriptionEn}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>
              </div>

              {/* Special Pregnancy Month Picker when selected */}
              {isSelected && c.id === 'pregnancy_lactation' && (
                <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-pink-600 dark:text-pink-400">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {isBn
                        ? 'গর্ভাবস্থার বর্তমান মাস নির্বাচন করুন (১ম থেকে ৯ম মাস):'
                        : 'Select exact gestational month (1st to 9th month):'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPregnancyMonth(m);
                        }}
                        className={`py-2 px-1 rounded-xl text-xs font-bold text-center border transition-all ${
                          selectedPregnancyMonth === m
                            ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white border-pink-600 shadow-md scale-105'
                            : darkMode
                            ? 'bg-slate-700/60 border-slate-600 text-slate-200 hover:bg-slate-700'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-pink-50 hover:border-pink-300'
                        }`}
                      >
                        <div>{isBn ? `${m}ম মাস` : `M ${m}`}</div>
                        <div className="text-[10px] font-normal opacity-80">
                          {m <= 3 ? (isBn ? '১ম ট্রাইম' : '1st Tri') : m <= 6 ? (isBn ? '২য় ট্রাইম' : '2nd Tri') : (isBn ? '৩য় ট্রাইম' : '3rd Tri')}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Zero Herbs Reassurance Tag */}
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">
                        {isBn ? 'আয়ুর্বেদিক মাসানুক্রমিক ও ফাংশনাল নিউট্রিশন নীতি:' : 'Ayurvedic & Functional Policy:'}
                      </span>{' '}
                      {isBn
                        ? 'শিশুর মাসের বৃদ্ধির সাথে সামঞ্জস্যপূর্ণ খাদ্য। কোনো শতাবরী, অশ্বগন্ধা বা ক্ষতিকর ঔষধি হার্বস নেই — সম্পূর্ণ ১০০% নিরাপদ ঘরোয়া পুষ্টিকর খাদ্য।'
                        : 'Pure kitchen nutrition synced with fetal developmental improvement. Zero medicinal herbs.'}
                    </div>
                  </div>
                </div>
              )}

              {/* Bullet Features Checklist */}
              {isSelected && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                  {(isBn ? c.featuresBn : c.featuresEn).map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {isBn
            ? activeCohort === 'child_pediatric'
              ? 'নির্বাচনের পর অ্যানথ্রোপোমেট্রি ও শিশুদের বিশেষ ৩২টি পেডিয়াট্রিক প্রশ্ন ও ল্যাব ডাটা নেওয়া হবে।'
              : 'নির্বাচনের পর ৩০–৩২টি মৌলিক ক্লিনিক্যাল প্রশ্ন (অ্যানথ্রোপোমেট্রি, বিকৃতি, মাইক্রোবায়োম, ফিমেল চক্র, ওষুধের ইতিহাস) + ১০টি রোগভিত্তিক বিশেষ প্রশ্ন নেওয়া হবে।'
            : activeCohort === 'child_pediatric'
            ? 'Next step: 32-question pediatric growth, gut, immunity & nutrition assessment.'
            : 'Next step: Complete 38–42 question clinical package (Anthropometrics, Vikriti, Microbiome, Female Cycle, Medications + 10 Condition Questions).'}
        </div>

        <button
          onClick={() =>
            onSelectCohort(
              activeCohort,
              activeCohort === 'pregnancy_lactation' ? selectedPregnancyMonth : undefined
            )
          }
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/25 flex items-center gap-2 transform active:scale-95 transition-all"
        >
          <span>{isBn ? 'প্রশ্নোত্তর শুরু করুন' : 'Proceed to Assessment'}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default CohortSelector;
