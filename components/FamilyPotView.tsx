import React, { useState } from 'react';
import {
  Soup,
  Users,
  Lock,
  Unlock,
  CheckCircle2,
  Sparkles,
  UtensilsCrossed,
  Flame,
  ArrowRight,
  Info,
  Layers,
  HeartHandshake,
} from 'lucide-react';
import { HealthProfile, Language, Phase, User } from '../types';
import { GeminiService } from '../services/geminiService';
import { translations } from '../i18n';

interface Props {
  profile: HealthProfile | null;
  currentPhase: Phase;
  lang: Language;
  darkMode?: boolean;
  user?: User | null;
  onSwitchToFamilyProfile?: () => void;
}

interface FamilyRecipe {
  dishName: string;
  totalIngredients: string[];
  cookingInstructions: string[];
  patientPortion: string;
  familyPortion: string;
}

const FamilyPotView: React.FC<Props> = ({
  profile,
  currentPhase,
  lang,
  darkMode,
  user,
  onSwitchToFamilyProfile,
}) => {
  const t = translations[lang];
  const isBn = lang === 'bn';

  // Family Pot is strictly active ONLY for Family Profiles ('family')
  const isFamilyProfile = Boolean(
    user && (user.profileType === 'family' || user.isFamilyManager)
  );

  const [adults, setAdults] = useState(2);
  const [kids, setKids] = useState(1);
  const [mealType, setMealType] = useState<'Lunch' | 'Dinner'>('Lunch');
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<FamilyRecipe | null>(null);

  const gemini = new GeminiService();

  const handleCalculate = async () => {
    if (!isFamilyProfile || !profile) return;
    setLoading(true);
    setRecipe(null);
    try {
      const result = await gemini.generateFamilyPot(
        profile,
        currentPhase,
        adults,
        kids,
        mealType,
        lang
      );
      setRecipe(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-28">
      {/* Hero Banner */}
      <div
        className={`p-7 md:p-10 rounded-3xl border shadow-lg relative overflow-hidden ${
          darkMode
            ? 'bg-gradient-to-br from-slate-900 via-purple-950/35 to-indigo-950/35 border-purple-800/40'
            : 'bg-gradient-to-br from-purple-50/90 via-white to-indigo-50/70 border-purple-200'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shrink-0">
              <Soup className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400">
                <span>{isBn ? 'ফ্যামিলি পট (One-Pot Family Nutrition)' : 'Family Pot System'}</span>
                <span aria-hidden="true">·</span>
                <span>
                  {isFamilyProfile
                    ? isBn
                      ? 'ফ্যামিলি প্রোফাইলের জন্য সক্রিয়'
                      : 'Active for Family Profile'
                    : isBn
                    ? 'ইন্ডিভিজুয়াল প্রিভিউ মোড (শুধুমাত্র ফ্যামিলি প্রোফাইলে চালু)'
                    : 'Individual Preview Mode (Active for Family Profiles Only)'}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {t.family_pot_title}
              </h1>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                {isBn
                  ? 'পরিবারের একেক সদস্যের শারীরিক কন্ডিশন একেক রকম হলেও আলাদা ৪ হাঁড়ি রান্নার প্রয়োজন নেই—এক হাঁড়িতে রান্না করেই সবার পুষ্টি ও পথ্য নিশ্চিত করার স্মার্ট পদ্ধতি।'
                  : t.family_pot_subtitle}
              </p>
            </div>
          </div>

          {/* Access Status Badge */}
          <div className="shrink-0">
            {isFamilyProfile ? (
              <div
                className={`p-4 rounded-2xl border flex items-center gap-3 ${
                  darkMode
                    ? 'bg-emerald-950/50 border-emerald-700/50 text-emerald-300'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                <Unlock className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-extrabold">
                    {isBn ? 'ফ্যামিলি প্রোফাইল সক্রিয়' : 'Family Profile Active'}
                  </div>
                  <div className="text-[11px] opacity-80">
                    {isBn ? 'ফ্যামিলি পট প্ল্যানার চালু আছে' : 'Interactive planner unlocked'}
                  </div>
                </div>
              </div>
            ) : (
              <div
                className={`p-4 rounded-2xl border flex items-center gap-3 ${
                  darkMode
                    ? 'bg-amber-950/40 border-amber-700/50 text-amber-300'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <div className="text-xs font-extrabold">
                    {isBn ? 'শুধুমাত্র ফ্যামিলি প্রোফাইলের জন্য চালু' : 'Family Profile Only'}
                  </div>
                  <div className="text-[11px] opacity-80">
                    {isBn
                      ? 'ইন্ডিভিজুয়াল ইউজাররা নিচে এর কাজ দেখতে পারবেন'
                      : 'Individual users can view how it works below'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 1: What is Family Pot & How Does It Work? (Always visible so Individual users understand what it is and what it does) */}
      <div
        className={`p-6 md:p-8 rounded-3xl border shadow-sm space-y-6 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 mb-1">
              <Info className="w-4 h-4" />
              <span>
                {isBn
                  ? 'ফ্যামিলি পট পরিচিতি ও কার্যপ্রণালী'
                  : 'What is Family Pot & How Does It Work?'}
              </span>
            </div>
            <h2 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white">
              {isBn
                ? 'ফ্যামিলি পট কী এবং এটি কীভাবে কাজ করে?'
                : 'Understanding the One-Pot Family Nutrition Engine'}
            </h2>
          </div>
        </div>

        {/* Core Explanation */}
        <div
          className={`p-5 rounded-2xl border ${
            darkMode
              ? 'bg-slate-800/60 border-slate-700 text-slate-200'
              : 'bg-purple-50/50 border-purple-200/80 text-slate-700'
          }`}
        >
          <p className="text-xs sm:text-sm leading-relaxed">
            {isBn
              ? 'ফ্যামিলি পট (Family Pot) হলো এমন একটি ক্লিনিক্যাল কুকিং সিস্টেম যেখানে পরিবারের ডায়াবেটিস বা প্রেশারের রোগী, গর্ভবতী মা, বাড়ন্ত শিশু এবং সুস্থ সদস্যদের জন্য আলাদা আলাদা হাঁড়িতে রান্না করতে হয় না। একই হাঁড়িতে স্বাস্থ্যকর বেস (Base) রান্না করে রান্নার নির্দিষ্ট ধাপে রোগীর অংশ আলাদা করা হয় এবং বাকি সদস্যদের জন্য প্রয়োজনীয় ফ্যাট বা মশলা যোগ করা হয়।'
              : 'Family Pot is a clinical meal-engineering system designed for multi-generational households. Instead of cooking separate meals for a diabetic parent, a growing child, and healthy adults, you cook one nutrient-dense base meal in a single pot and customize portions at the final stage.'}
          </p>
        </div>

        {/* 3-Step Workflow Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className={`p-5 rounded-2xl border ${
              darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="text-xs font-extrabold text-purple-600 dark:text-purple-400 mb-1">
              {isBn ? 'ধাপ ১ • বেস পট কুকিং' : 'Step 1 • Unified Base Cooking'}
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              {isBn
                ? 'এক হাঁড়িতে ক্লিনিক্যাল বেস তৈরি'
                : 'Cook the Therapeutic Base Together'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {isBn
                ? 'সবার জন্য প্রোটিন (মাছ/মুরগি/ডাল) ও মৌসুমি সবজি পরিমিত তেল, হলুদ, আদা ও জিরা দিয়ে এক হাঁড়িতেই রান্না শুরু করা হয়।'
                : 'Protein (fish, chicken, or lentils) and seasonal vegetables are cooked together in one pot using therapeutic spices and controlled oil.'}
            </p>
          </div>

          <div
            className={`p-5 rounded-2xl border ${
              darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mb-1">
              {isBn ? 'ধাপ ২ • স্মার্ট ডিভিশন ও ফোড়ন' : 'Step 2 • Smart Portion Split'}
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              {isBn
                ? 'রোগী ও পরিবারের অংশ আলাদা করা'
                : 'Separate Patient Portion & Enrich'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {isBn
                ? 'তরকারি নামানোর আগে রোগীর জন্য কম লবণ-তেলের অংশ তুলে রাখা হয়। এরপর বাকি হাঁড়িতে পরিবারের ও বাচ্চাদের জন্য ঘি বা বাগার যোগ করা হয়।'
                : 'Before heavy tempering, the therapeutic portion is plated for the patient, while pure ghee or richer seasoning is added for kids and active adults.'}
            </p>
          </div>

          <div
            className={`p-5 rounded-2xl border ${
              darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="text-xs font-extrabold text-amber-600 dark:text-amber-400 mb-1">
              {isBn ? 'ধাপ ৩ • প্লেট ও পোরশন গাইড' : 'Step 3 • Customized Serving Ratio'}
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              {isBn
                ? 'সদস্যভেদে সঠিক মাপে পরিবেশন'
                : 'Serve Member-Specific Macro Ratios'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {isBn
                ? 'একই রান্না থেকে ডায়াবেটিক সদস্য পান বেশি সবজি ও প্রোটিন, আর বাড়ন্ত শিশু ও সুস্থ বড়রা পান পর্যাপ্ত শর্করা ও ক্যালোরি।'
                : 'The patient receives higher fiber and protein with controlled carbs, while children and active adults get energy-dense grain portions.'}
            </p>
          </div>
        </div>

        {/* Sample Demonstration Table of What Family Pot Does */}
        <div
          className={`p-5 rounded-2xl border ${
            darkMode ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50/70 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-3">
            <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>
              {isBn
                ? 'উদাহরণ: ১টি ফ্যামিলি পট (লাউ-মুরগির স্টু ও মুগ ডাল) কীভাবে পরিবারের ৩ ধরনের সদস্যের কাজে লাগে:'
                : 'Example: How 1 Family Pot (Bottle Gourd Chicken Stew & Moong Dal) Serves 3 Different Members:'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div
              className={`p-3.5 rounded-xl border ${
                darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
              }`}
            >
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                {isBn ? '১. থেরাপিউটিক / ডায়াবেটিক সদস্য' : '1. Therapeutic / Metabolic Member'}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {isBn
                  ? '২ পিস মুরগি + দেড় কাপ লাউ-সবজি ঝোল + ১ বাটি মুগ ডাল (আলু ছাড়া, কম লবণে আগে তুলে রাখা অংশ)।'
                  : '2 pcs chicken + 1.5 cups bottle gourd broth + 1 bowl dal (low-sodium, no potato, high-fiber portion).'}
              </p>
            </div>

            <div
              className={`p-3.5 rounded-xl border ${
                darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
              }`}
            >
              <div className="text-xs font-bold text-sky-600 dark:text-sky-400 mb-1">
                {isBn ? '২. বাড়ন্ত শিশু (Child Growth)' : '2. Growing Child'}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {isBn
                  ? 'নরম মুরগির টুকরো + ডাল-সবজি মাখা ভাত + উপরে ১ চামচ খাঁটি গাওয়া ঘি ও সিদ্ধ আলু (মরিচ ছাড়া অংশ)।'
                  : 'Shredded tender chicken + dal-veggie rice mash + 1 tsp pure A2 ghee & soft potato (non-spicy portion).'}
              </p>
            </div>

            <div
              className={`p-3.5 rounded-xl border ${
                darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
              }`}
            >
              <div className="text-xs font-bold text-purple-600 dark:text-purple-400 mb-1">
                {isBn ? '৩. পরিবারের অন্যান্য প্রাপ্তবয়স্ক সদস্য' : '3. Other Adult Family Members'}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {isBn
                  ? 'স্বাভাবিক ভাত বা রুটি + জিরা-রসুন বাগার দেওয়া পূর্ণ স্বাদের মুরগি-লাউ কারি, ঘন ডাল ও সালাদ।'
                  : 'Regular rice/roti + garlic-cumin tempered chicken curry, thick dal, and fresh salad.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Conditional Interactive Tool (Active ONLY for Family Profile) */}
      {isFamilyProfile ? (
        <div className="space-y-8">
          {/* Configuration Controls */}
          <div
            className={`p-6 md:p-8 rounded-3xl border shadow-sm ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {isBn
                    ? 'ফ্যামিলি প্রোফাইল এক্সক্লুসিভ জেনারেটর'
                    : 'Family Profile Exclusive Generator'}
                </span>
                <h3 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white">
                  {isBn
                    ? 'আজকের ফ্যামিলি পট রেসিপি ও পরিমাপ তৈরি করুন'
                    : 'Generate Today’s One-Pot Family Recipe & Portions'}
                </h3>
              </div>
              {user?.familyMembers && user.familyMembers.length > 0 && (
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {isBn
                    ? `ফ্যামিলি সদস্য যুক্ত আছেন: ${user.familyMembers.length} জন`
                    : `Linked Family Members: ${user.familyMembers.length}`}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Member Counters */}
              <div className="space-y-3">
                <div className="flex justify-between items-center p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <span className={`font-bold text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    {t.members_adults}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setAdults(Math.max(1, adults - 1))}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold transition-colors ${
                        darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'
                      }`}
                    >
                      -
                    </button>
                    <span className="w-5 text-center font-bold tabular-nums">{adults}</span>
                    <button
                      type="button"
                      onClick={() => setAdults(adults + 1)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold transition-colors ${
                        darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'
                      }`}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <span className={`font-bold text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    {t.members_kids}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setKids(Math.max(0, kids - 1))}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold transition-colors ${
                        darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'
                      }`}
                    >
                      -
                    </button>
                    <span className="w-5 text-center font-bold tabular-nums">{kids}</span>
                    <button
                      type="button"
                      onClick={() => setKids(kids + 1)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold transition-colors ${
                        darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'
                      }`}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Meal Type Selector */}
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setMealType('Lunch')}
                  className={`p-4 rounded-2xl font-bold border transition-all text-sm ${
                    mealType === 'Lunch'
                      ? 'bg-orange-500 text-white border-orange-600 shadow-md'
                      : darkMode
                      ? 'bg-slate-800 border-slate-700 text-slate-400'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  {isBn ? '☀️ দুপুরের খাবার (Lunch)' : '☀️ Lunch'}
                </button>
                <button
                  type="button"
                  onClick={() => setMealType('Dinner')}
                  className={`p-4 rounded-2xl font-bold border transition-all text-sm ${
                    mealType === 'Dinner'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                      : darkMode
                      ? 'bg-slate-800 border-slate-700 text-slate-400'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  {isBn ? '🌙 রাতের খাবার (Dinner)' : '🌙 Dinner'}
                </button>
              </div>

              {/* Calculate Button */}
              <button
                type="button"
                onClick={handleCalculate}
                disabled={loading}
                className={`h-full min-h-[96px] rounded-2xl font-extrabold uppercase tracking-wider text-sm shadow-lg transition-all active:scale-95 disabled:opacity-50 flex flex-col items-center justify-center gap-2 ${
                  darkMode
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="text-xs">{t.generating_recipe}</span>
                  </>
                ) : (
                  <>
                    <Soup className="w-6 h-6" />
                    <span>{t.calc_pot}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Display */}
          {recipe && (
            <div
              className={`rounded-3xl overflow-hidden border shadow-xl animate-in slide-in-from-bottom duration-500 ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div
                className={`p-6 md:p-8 text-center border-b ${
                  darkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <h3
                  className={`text-2xl md:text-3xl font-bold serif italic mb-1.5 ${
                    darkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {recipe.dishName}
                </h3>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {adults + kids + 1} {isBn ? 'জনের পরিমাপ' : 'Servings'} · Phase {currentPhase}{' '}
                  Compliant
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2">
                <div
                  className={`p-6 md:p-8 border-b md:border-b-0 md:border-r ${
                    darkMode ? 'border-slate-800' : 'border-slate-200'
                  }`}
                >
                  <h4 className="text-xs font-extrabold uppercase tracking-wider mb-4 text-slate-500">
                    {t.ingredients_list}
                  </h4>
                  <ul className="space-y-2.5">
                    {recipe.totalIngredients.map((ing, i) => (
                      <li
                        key={i}
                        className={`flex items-start gap-2.5 text-xs sm:text-sm font-medium ${
                          darkMode ? 'text-slate-300' : 'text-slate-700'
                        }`}
                      >
                        <span className="text-emerald-500 mt-0.5">•</span>
                        <span>{ing}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-6 md:p-8">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider mb-4 text-slate-500">
                    {t.cooking_instructions}
                  </h4>
                  <ol className="space-y-3.5">
                    {recipe.cookingInstructions.map((step, i) => (
                      <li key={i} className="flex gap-3">
                        <span
                          className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold tabular-nums ${
                            darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {i + 1}
                        </span>
                        <p
                          className={`text-xs sm:text-sm leading-relaxed ${
                            darkMode ? 'text-slate-300' : 'text-slate-600'
                          }`}
                        >
                          {step}
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* Serving Strategy */}
              <div
                className={`p-6 md:p-8 border-t flex flex-col md:flex-row gap-6 ${
                  darkMode
                    ? 'bg-emerald-950/15 border-slate-800'
                    : 'bg-emerald-50/50 border-slate-200'
                }`}
              >
                <div className="flex-1">
                  <h5 className="font-bold text-sm mb-1.5 text-emerald-700 dark:text-emerald-400">
                    {t.patient_portion}
                  </h5>
                  <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {recipe.patientPortion}
                  </p>
                </div>
                <div className="flex-1">
                  <h5 className="font-bold text-sm mb-1.5 text-purple-700 dark:text-purple-400">
                    {t.family_portion}
                  </h5>
                  <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {recipe.familyPortion}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Individual Profile Notice Card (Explaining that interactive Family Pot is only enabled for Family Profiles) */
        <div
          className={`p-6 md:p-8 rounded-3xl border-2 flex flex-col md:flex-row items-center justify-between gap-6 ${
            darkMode
              ? 'bg-slate-900/90 border-amber-700/50 text-white'
              : 'bg-amber-50/70 border-amber-300 text-slate-900'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <Lock className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <div className="text-xs font-extrabold text-amber-700 dark:text-amber-400">
                {isBn
                  ? 'ইন্ডিভিজুয়াল প্রোফাইল ভিউ মোড (View-Only for Individual Profiles)'
                  : 'Individual Profile View-Only Mode'}
              </div>
              <h3 className="text-base md:text-lg font-extrabold">
                {isBn
                  ? 'ফ্যামিলি পট জেনারেটরটি শুধুমাত্র "ফ্যামিলি প্রোফাইল"-এর জন্য চালু থাকে'
                  : 'The Interactive Family Pot Planner is Exclusively Enabled for Family Profiles'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                {isBn
                  ? 'আপনি বর্তমানে ব্যক্তিগত (Individual) মোডে আছেন, তাই উপরে ফ্যামিলি পট কী এবং এটি কীভাবে কাজ করে তা দেখতে পাচ্ছেন। পরিবারের সদস্যদের যোগ করে এক হাঁড়িতে রান্নার কাস্টম রেসিপি ও পরিমাপ তৈরি করতে আপনার প্রোফাইলটি "ফ্যামিলির জন্য (Family Profile)" মোডে সুইচ করুন।'
                  : 'Individual users can explore what Family Pot is and how it works above. To unlock the interactive multi-member recipe generator and portion calculator, switch your profile mode to a Family Profile.'}
              </p>
            </div>
          </div>

          {onSwitchToFamilyProfile && (
            <button
              type="button"
              onClick={onSwitchToFamilyProfile}
              className="w-full md:w-auto px-6 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 shrink-0"
            >
              <Users className="w-4 h-4" />
              <span>
                {isBn ? 'ফ্যামিলি প্রোফাইলে সুইচ করুন' : 'Switch to Family Profile'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FamilyPotView;
