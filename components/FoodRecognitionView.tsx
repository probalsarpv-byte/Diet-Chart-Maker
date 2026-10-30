import React, { useState, useMemo, useEffect } from 'react';
import { HealthProfile, Language, TrafficLightZone } from '../types';
import {
  loadPlatformState,
  subscribePlatformState,
  submitFoodSuggestion,
} from '../services/platformHubService';
import {
  BD_FCT_RAW_FOODS,
  BD_FCT_CATEGORIES,
  BD_FCT_NUTRIENTS,
  BD_FCT_HEALTH_LENSES,
  BD_FCT_EXT_SOURCES,
  BD_FCT_SOURCE_LINE_BN,
  BD_FCT_SOURCE_LINE_EN,
  BdFctFoodRecord,
  HealthLensKey,
  classifyBdFoodToTrafficLight,
  getExternalFunctionalProfile,
  getFoodFlags,
  getHealthLensCue,
  scoreBdFoodSearch,
  matchBdCategory,
  fmtNutrient,
  getBdFoodNameBn,
  getBdFoodNameEn,
  nval,
  getDefaultSelectedFoodIds,
  generateComprehensiveTrafficLightGuide,
} from '../data/bdFoodCompositionDatabase';
import { Share2 } from 'lucide-react';
import SocialShareModal, { SharePayload } from './SocialShareModal';
import CrossBorderCuisineBar from './CrossBorderCuisineBar';
import {
  getEffectiveResidenceAndCuisine,
  resolveFoodOrMealSupermarketSwap,
} from '../services/crossBorderFoodEquivalenceService';

interface Props {
  profile: HealthProfile | null;
  lang: Language;
  darkMode?: boolean;
  onUpdateProfile?: (p: HealthProfile) => void;
}

type GlossaryTab = 'explorer' | 'plate' | 'compare';

interface PlateEntry {
  food: BdFctFoodRecord;
  grams: number;
}

const DEFAULT_FALLBACK_PROFILE: HealthProfile = {
  dosha: 'Pitta-Kapha',
  age: 35,
  gender: 'Male',
  weight: 68,
  height: 165,
  microbiomeScore: 72,
  inflammatoryIndex: 4,
  metabolicType: 'Moderate',
  alkalineBalance: 'Neutral',
  psychologicalProfile: 'Balanced',
  medications: 'None',
  dietHistory: 'Mixed Bengali Diet',
  medicalConditions: 'General Metabolic & Gut Wellness',
  cohortType: 'adult_metabolic',
  mealFrequency: 3,
  dinnerCarbRule: 'vegetable_carbs',
  answers: {},
  analysis: null,
};

const FoodRecognitionView: React.FC<Props> = ({
  profile,
  lang,
  darkMode,
  onUpdateProfile,
}) => {
  const isBn = lang === 'bn';
  const activeProfile = profile || DEFAULT_FALLBACK_PROFILE;

  const [activeTab, setActiveTab] = useState<GlossaryTab>('explorer');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedZone, setSelectedZone] = useState<'all' | TrafficLightZone>('all');
  const [selectedLens, setSelectedLens] = useState<HealthLensKey | ''>('');
  const [selectedFnFilter, setSelectedFnFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('code');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal state with portion scaling (default 100g)
  const [selectedFood, setSelectedFood] = useState<BdFctFoodRecord | null>(null);
  const [modalPortionGrams, setModalPortionGrams] = useState<number>(100);
  const [foodSharePayload, setFoodSharePayload] = useState<SharePayload | null>(null);
  const [crossBorderTick, setCrossBorderTick] = useState<number>(0);

  const crossBorderInfo = useMemo(
    () => getEffectiveResidenceAndCuisine(activeProfile),
    [activeProfile, crossBorderTick]
  );

  // Food Suggestion Box State
  const [hubState, setHubState] = useState(() => loadPlatformState());
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [sugNameBn, setSugNameBn] = useState('');
  const [sugNameEn, setSugNameEn] = useState('');
  const [sugCat, setSugCat] = useState('Vegetables & Greens');
  const [sugCal, setSugCal] = useState('120');
  const [sugProt, setSugProt] = useState('4');
  const [sugCarb, setSugCarb] = useState('18');
  const [sugFat, setSugFat] = useState('2');
  const [sugZone, setSugZone] = useState<TrafficLightZone>('green');
  const [sugBenefits, setSugBenefits] = useState('');
  const [sugBy, setSugBy] = useState('');
  const [sugSuccess, setSugSuccess] = useState(false);

  useEffect(() => {
    return subscribePlatformState((st) => setHubState(st));
  }, []);

  const approvedSuggestedFoods = hubState.foodSuggestions.filter(
    (f) => f.status === 'approved'
  );

  const handleShareFoodCard = (f: BdFctFoodRecord) => {
    const tl = classifyBdFoodToTrafficLight(f, activeProfile);
    const ext = getExternalFunctionalProfile(f);
    const nameBn = getBdFoodNameBn(f);
    const nameEn = getBdFoodNameEn(f);
    const zoneEmoji = tl.zone === 'green' ? '🟢' : tl.zone === 'yellow' ? '🟡' : '🔴';
    const zoneLabel =
      tl.zone === 'green'
        ? isBn
          ? '🟢 নিরাপদ (Green Zone)'
          : '🟢 Safe (Green Zone)'
        : tl.zone === 'yellow'
        ? isBn
          ? '🟡 পরিমিত (Yellow Zone)'
          : '🟡 Moderate (Yellow Zone)'
        : isBn
        ? '🔴 বর্জনীয় (Red Zone)'
        : '🔴 Avoid (Red Zone)';

    const kcal = fmtNutrient(nval(f.kcal), 0, isBn);
    const prot = fmtNutrient(nval(f.prot), 1, isBn);
    const carb = fmtNutrient(nval(f.carb), 1, isBn);
    const fib = fmtNutrient(nval(f.fib), 1, isBn);

    const shareTitle = isBn ? `${nameBn} (${nameEn})` : `${nameEn} (${nameBn})`;
    const shareSubtitle = isBn
      ? `${zoneLabel} • পোরশন গাইড: ${tl.portionLimitBn}`
      : `${zoneLabel} • Portion Guide: ${tl.portionLimitEn}`;

    const shareText = isBn
      ? `🥗 ফুড গ্লোসারি ও পুষ্টি গাইড (প্রতি ১০০ গ্রাম):\n` +
        `📌 খাবার: ${nameBn} (${nameEn}) [BD FCT #${f.code}]\n` +
        `${zoneEmoji} ট্রাফিক লাইট জোন: ${zoneLabel}\n` +
        `🔥 ক্যালরি: ${kcal} kcal | 🥩 প্রোটিন: ${prot}g | 🌾 কার্ব: ${carb}g | 🌿 ফাইবার: ${fib}g\n` +
        `🧬 গ্লাইসেমিক ইনডেক্স (GI): ${ext.gi.status} | FODMAP: ${ext.fodmap.status}\n` +
        `💡 ক্লিনিক্যাল নোট: ${tl.clinicalReasonBn}\n` +
        `🍽️ প্রস্তাবিত পোরশন: ${tl.portionLimitBn}\n` +
        `#FoodGlossary #BDFCT #ClinicalNutrition #HealthyFoodGuide`
      : `🥗 Food Glossary & Nutrition Guide (per 100g):\n` +
        `📌 Food: ${nameEn} (${nameBn}) [BD FCT #${f.code}]\n` +
        `${zoneEmoji} Traffic Light Zone: ${zoneLabel}\n` +
        `🔥 Energy: ${kcal} kcal | 🥩 Protein: ${prot}g | 🌾 Carbs: ${carb}g | 🌿 Fiber: ${fib}g\n` +
        `🧬 Glycemic Index (GI): ${ext.gi.status} | FODMAP: ${ext.fodmap.status}\n` +
        `💡 Clinical Verdict: ${tl.clinicalReasonEn}\n` +
        `🍽️ Suggested Portion: ${tl.portionLimitEn}\n` +
        `#FoodGlossary #BDFCT #ClinicalNutrition #HealthyFoodGuide`;

    setFoodSharePayload({
      badge: `${zoneLabel} • BD FCT #${f.code}`,
      title: shareTitle,
      subtitle: shareSubtitle,
      stats: [
        { label: isBn ? 'ক্যালরি (১০০g)' : 'Energy (100g)', value: `${kcal} kcal` },
        { label: isBn ? 'প্রোটিন / ফাইবার' : 'Protein / Fiber', value: `${prot}g / ${fib}g` },
        { label: 'GI / FODMAP', value: `${ext.gi.status} • ${ext.fodmap.status}` },
      ],
      shareText,
    });
  };

  const handleShareSuggestedFoodCard = (sf: (typeof approvedSuggestedFoods)[number]) => {
    const zoneLabel =
      sf.suggestedZone === 'green'
        ? isBn
          ? '🟢 নিরাপদ (Green Zone)'
          : '🟢 Safe (Green Zone)'
        : sf.suggestedZone === 'yellow'
        ? isBn
          ? '🟡 পরিমিত (Yellow Zone)'
          : '🟡 Moderate (Yellow Zone)'
        : isBn
        ? '🔴 বর্জনীয় (Red Zone)'
        : '🔴 Avoid (Red Zone)';

    const shareText = isBn
      ? `🥗 ফুড গ্লোসারি (কমিউনিটি অনুমোদিত খাবার):\n` +
        `📌 খাবার: ${sf.nameBn} (${sf.nameEn})\n` +
        `🔥 ক্যালরি: ${sf.caloriesPer100g} kcal | P: ${sf.proteinG}g | C: ${sf.carbsG}g | F: ${sf.fatG}g\n` +
        `💡 উপকারিতা: ${sf.healthBenefitsBn}\n` +
        `#FoodGlossary #HealthyFood`
      : `🥗 Food Glossary (Community Approved Food):\n` +
        `📌 Food: ${sf.nameEn} (${sf.nameBn})\n` +
        `🔥 Calories: ${sf.caloriesPer100g} kcal | P: ${sf.proteinG}g | C: ${sf.carbsG}g | F: ${sf.fatG}g\n` +
        `💡 Benefits: ${sf.healthBenefitsEn}\n` +
        `#FoodGlossary #HealthyFood`;

    setFoodSharePayload({
      badge: zoneLabel,
      title: isBn ? `${sf.nameBn} (${sf.nameEn})` : `${sf.nameEn} (${sf.nameBn})`,
      subtitle: isBn ? sf.healthBenefitsBn : sf.healthBenefitsEn,
      stats: [
        { label: isBn ? 'ক্যালরি' : 'Calories', value: `${sf.caloriesPer100g} kcal` },
        { label: isBn ? 'প্রোটিন' : 'Protein', value: `${sf.proteinG}g` },
        { label: isBn ? 'কার্ব / ফ্যাট' : 'Carbs / Fat', value: `${sf.carbsG}g / ${sf.fatG}g` },
      ],
      shareText,
    });
  };

  const handleFoodSuggestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sugNameBn.trim()) return;
    submitFoodSuggestion({
      submittedByName: sugBy.trim() || (isBn ? 'কমিউনিটি সদস্য' : 'Community User'),
      nameBn: sugNameBn.trim(),
      nameEn: sugNameEn.trim() || sugNameBn.trim(),
      category: sugCat,
      caloriesPer100g: parseFloat(sugCal) || 100,
      proteinG: parseFloat(sugProt) || 3,
      carbsG: parseFloat(sugCarb) || 15,
      fatG: parseFloat(sugFat) || 2,
      fiberG: 3.5,
      suggestedZone: sugZone,
      healthBenefitsBn:
        sugBenefits.trim() ||
        (isBn ? 'পুষ্টিগুণ সমৃদ্ধ দেশি খাবার।' : 'Nutritious local food item.'),
      healthBenefitsEn:
        sugBenefits.trim() || 'Nutritious local food item.',
    });
    setSugSuccess(true);
    setSugNameBn('');
    setSugNameEn('');
    setSugBenefits('');
  };

  // My Plate Calculator state
  const [plateItems, setPlateItems] = useState<PlateEntry[]>(() => {
    const rice = BD_FCT_RAW_FOODS.find((f) => f.code === '01_0015') || BD_FCT_RAW_FOODS[0];
    const fish = BD_FCT_RAW_FOODS.find((f) => f.code === '09_0059') || BD_FCT_RAW_FOODS[60];
    const gourd = BD_FCT_RAW_FOODS.find((f) => f.code === '03_0008') || BD_FCT_RAW_FOODS[35];
    const dal = BD_FCT_RAW_FOODS.find((f) => f.code === '02_0015') || BD_FCT_RAW_FOODS[22];
    return [
      { food: rice, grams: 120 },
      { food: fish, grams: 100 },
      { food: gourd, grams: 150 },
      { food: dal, grams: 60 },
    ].filter((x) => Boolean(x.food));
  });

  // Compare state (up to 4 foods)
  const [compareCodes, setCompareCodes] = useState<string[]>([
    '01_0015',
    '09_0059',
    '03_0008',
  ]);

  // Precompute enriched food list with Traffic Light classification & Functional V6 profile
  const enrichedFoods = useMemo(() => {
    return BD_FCT_RAW_FOODS.map((f) => {
      const tl = classifyBdFoodToTrafficLight(f, activeProfile);
      const ext = getExternalFunctionalProfile(f);
      const flags = getFoodFlags(f);
      return {
        raw: f,
        tl,
        ext,
        flags,
      };
    });
  }, [activeProfile]);

  // Diet chart selected food IDs sync
  const selectedDietIds = useMemo(() => {
    if (profile?.selectedFoods && profile.selectedFoods.length > 0) {
      return profile.selectedFoods;
    }
    const guide = generateComprehensiveTrafficLightGuide(activeProfile);
    return getDefaultSelectedFoodIds(guide);
  }, [profile?.selectedFoods, activeProfile]);

  const handleToggleDietFood = (foodCode: string, zone: TrafficLightZone) => {
    if (zone === 'red') return;
    const itemId = `bdfct_${foodCode}`;
    const exists = selectedDietIds.includes(itemId);
    const updatedIds = exists
      ? selectedDietIds.filter((id) => id !== itemId)
      : [...selectedDietIds, itemId];

    if (profile && onUpdateProfile) {
      const fullGuide = generateComprehensiveTrafficLightGuide(profile);
      onUpdateProfile({
        ...profile,
        trafficLightGuide: fullGuide,
        selectedFoods: updatedIds,
      });
    }
  };

  // Category counts
  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = { all: enrichedFoods.length };
    BD_FCT_CATEGORIES.forEach((cat) => {
      if (cat.id === 'all') return;
      map[cat.id] = enrichedFoods.filter((item) => matchBdCategory(item.raw, cat.id)).length;
    });
    return map;
  }, [enrichedFoods]);

  // Zone counts
  const zoneCounts = useMemo(() => {
    let green = 0;
    let yellow = 0;
    let red = 0;
    enrichedFoods.forEach((item) => {
      if (item.tl.zone === 'green') green++;
      else if (item.tl.zone === 'yellow') yellow++;
      else red++;
    });
    return { all: enrichedFoods.length, green, yellow, red };
  }, [enrichedFoods]);

  // Filtered & sorted foods
  const filteredFoods = useMemo(() => {
    const q = searchQuery.trim();
    const list = enrichedFoods.filter((item) => {
      if (selectedCategory !== 'all' && !matchBdCategory(item.raw, selectedCategory)) {
        return false;
      }
      if (selectedZone !== 'all' && item.tl.zone !== selectedZone) {
        return false;
      }
      if (selectedFnFilter !== 'all') {
        if (
          selectedFnFilter === 'low_gi' &&
          item.ext.gi.className !== 'Low' &&
          item.ext.gi.className !== 'Low-Medium' &&
          item.ext.gi.className !== 'Low-Moderate'
        ) {
          return false;
        }
        if (selectedFnFilter === 'low_fodmap' && item.ext.fodmap.className !== 'low') return false;
        if (selectedFnFilter === 'gluten_free' && item.ext.gluten.className !== 'low') return false;
        if (selectedFnFilter === 'low_purine' && item.ext.purine.className !== 'low') return false;
        if (selectedFnFilter === 'low_oxalate' && item.ext.oxalate.className === 'high/variable')
          return false;
        if (selectedFnFilter === 'low_histamine' && item.ext.histamine.className !== 'low')
          return false;
      }
      if (q) {
        return scoreBdFoodSearch(item.raw, q) > 0;
      }
      return true;
    });

    if (q) {
      list.sort((a, b) => scoreBdFoodSearch(b.raw, q) - scoreBdFoodSearch(a.raw, q));
      return list;
    }

    list.sort((a, b) => {
      if (sortBy === 'energy_asc')
        return (nval(a.raw.energy_kcal) ?? 9999) - (nval(b.raw.energy_kcal) ?? 9999);
      if (sortBy === 'energy_desc')
        return (nval(b.raw.energy_kcal) ?? -1) - (nval(a.raw.energy_kcal) ?? -1);
      if (sortBy === 'protein_desc')
        return (nval(b.raw.protein_g) ?? -1) - (nval(a.raw.protein_g) ?? -1);
      if (sortBy === 'fiber_desc') return (nval(b.raw.fibre_g) ?? -1) - (nval(a.raw.fibre_g) ?? -1);
      if (sortBy === 'iron_desc') return (nval(b.raw.iron_mg) ?? -1) - (nval(a.raw.iron_mg) ?? -1);
      if (sortBy === 'calcium_desc')
        return (nval(b.raw.calcium_mg) ?? -1) - (nval(a.raw.calcium_mg) ?? -1);
      if (sortBy === 'vitc_desc')
        return (nval(b.raw.vitamin_c_mg) ?? -1) - (nval(a.raw.vitamin_c_mg) ?? -1);
      if (sortBy === 'gi_asc') return (a.ext.gi.value ?? 50) - (b.ext.gi.value ?? 50);
      return a.raw.code.localeCompare(b.raw.code);
    });

    return list;
  }, [enrichedFoods, selectedCategory, selectedZone, selectedFnFilter, searchQuery, sortBy]);

  // Plate helpers
  const handleAddToPlate = (food: BdFctFoodRecord) => {
    setPlateItems((prev) => {
      const existing = prev.find((p) => p.food.code === food.code);
      if (existing) {
        return prev.map((p) =>
          p.food.code === food.code ? { ...p, grams: p.grams + 50 } : p
        );
      }
      return [...prev, { food, grams: 100 }];
    });
  };

  const handleUpdatePlateGrams = (code: string, grams: number) => {
    if (grams <= 0) {
      setPlateItems((prev) => prev.filter((p) => p.food.code !== code));
      return;
    }
    setPlateItems((prev) =>
      prev.map((p) => (p.food.code === code ? { ...p, grams: Math.min(1000, grams) } : p))
    );
  };

  const plateTotals = useMemo(() => {
    const totals = {
      grams: 0,
      en: 0,
      pr: 0,
      fat: 0,
      ch: 0,
      fb: 0,
      ca: 0,
      fe: 0,
      na: 0,
      k: 0,
      zn: 0,
      vc: 0,
    };
    plateItems.forEach(({ food, grams }) => {
      const ratio = grams / 100;
      totals.grams += grams;
      totals.en += (nval(food.energy_kcal) || 0) * ratio;
      totals.pr += (nval(food.protein_g) || 0) * ratio;
      totals.fat += (nval(food.fat_g) || 0) * ratio;
      totals.ch += (nval(food.carb_g) || 0) * ratio;
      totals.fb += (nval(food.fibre_g) || 0) * ratio;
      totals.ca += (nval(food.calcium_mg) || 0) * ratio;
      totals.fe += (nval(food.iron_mg) || 0) * ratio;
      totals.na += (nval(food.sodium_mg) || 0) * ratio;
      totals.k += (nval(food.potassium_mg) || 0) * ratio;
      totals.zn += (nval(food.zinc_mg) || 0) * ratio;
      totals.vc += (nval(food.vitamin_c_mg) || 0) * ratio;
    });
    return totals;
  }, [plateItems]);

  // Compare helpers
  const handleToggleCompare = (code: string) => {
    setCompareCodes((prev) => {
      if (prev.includes(code)) return prev.filter((c) => c !== code);
      if (prev.length >= 4) return [...prev.slice(1), code];
      return [...prev, code];
    });
  };

  const comparedFoods = useMemo(() => {
    return compareCodes
      .map((code) => enrichedFoods.find((item) => item.raw.code === code))
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
  }, [compareCodes, enrichedFoods]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300 pb-24 md:pb-12 px-2 md:px-4">
      {/* =================================================================== */}
      {/* HERO BANNER: OFFICIAL BD FCT PRO V6 (381 FOODS, 16 GROUPS, 26 NUTR) */}
      {/* =================================================================== */}
      <div
        className={`p-5 md:p-7 rounded-3xl border relative overflow-hidden ${
          darkMode
            ? 'bg-gradient-to-br from-slate-900 via-emerald-950/30 to-slate-900 border-emerald-500/30'
            : 'bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/70 border-emerald-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-600 text-white shadow-xs">
                🇧🇩 Official BD FCT (INFS, DU 2013) + Functional V6
              </span>
              <span
                className={`px-3 py-1 rounded-full text-[11px] font-bold font-mono ${
                  darkMode
                    ? 'bg-slate-800 text-emerald-300'
                    : 'bg-white text-emerald-800 border border-emerald-200'
                }`}
              >
                {isBn
                  ? `${enrichedFoods.length}টি খাবার · ১৬টি বিভাগ · ২৬টি পুষ্টি উপাদান`
                  : `${enrichedFoods.length} Foods · 16 Groups · 26 Nutrients`}
              </span>
            </div>

            <h2
              className={`text-2xl md:text-4xl font-bold serif italic leading-tight ${
                darkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              {isBn
                ? 'বাংলাদেশ ফুড কম্পোজিশন গ্লোসারি ও ট্রাফিক লাইট ফুড গাইড'
                : 'Bangladesh Food Composition Glossary & Traffic Light Guide'}
            </h2>
            <p
              className={`text-xs md:text-sm leading-relaxed ${
                darkMode ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              {isBn
                ? 'ঢাকা বিশ্ববিদ্যালয়ের পুষ্টি ও খাদ্যবিজ্ঞান ইনস্টিটিউট (INFS) প্রকাশিত বাংলাদেশ ফুড কম্পোজিশন টেবিল অনুযায়ী ৩৮১টি দেশি খাবারের প্রতি ১০০ গ্রামের ২৬টি পুষ্টি উপাদান, গ্লাইসেমিক ইনডেক্স, FODMAP, পিউরিন, অক্সালেট এবং আপনার রোগ অনুযায়ী গ্রিন, ইয়েলো ও রেড জোন বিশ্লেষণ।'
                : 'Complete 381-food Bangladesh Food Composition Table (INFS, University of Dhaka) with 26 nutrients per 100g edible portion, Functional V6 metrics (GI, FODMAP, Purine, Oxalate, Histamine), and personalized Green, Yellow & Red Traffic Light zones.'}
            </p>
          </div>

          {/* Top Mode Switcher Tabs */}
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('explorer')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                activeTab === 'explorer'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : darkMode
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>📚</span>
              <span>{isBn ? 'ফুড গ্লোসারি (৩৮১)' : 'Food Glossary (381)'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('plate')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                activeTab === 'plate'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : darkMode
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>🍽️</span>
              <span>
                {isBn
                  ? `মাই প্লেট (${plateItems.length})`
                  : `My Plate (${plateItems.length})`}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('compare')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                activeTab === 'compare'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : darkMode
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>⚖️</span>
              <span>
                {isBn
                  ? `খাবার তুলনা (${compareCodes.length}/4)`
                  : `Compare (${compareCodes.length}/4)`}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSugSuccess(false);
                setShowSuggestModal(true);
              }}
              className="px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md hover:from-amber-400 hover:to-orange-500"
            >
              <span>💡</span>
              <span>{isBn ? '+ নতুন খাবার সাজেশন বক্স' : '+ Suggest a Food'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Residence Location vs. Preferred Food Cuisine Selector */}
      <CrossBorderCuisineBar
        profile={activeProfile}
        lang={lang}
        darkMode={darkMode}
        onUpdateProfile={onUpdateProfile}
        onPreferencesChanged={() => setCrossBorderTick((t) => t + 1)}
      />

      {/* Admin-Approved User Suggested Foods Strip */}
      {approvedSuggestedFoods.length > 0 && (
        <div
          className={`p-4 md:p-5 rounded-3xl border space-y-3 ${
            darkMode
              ? 'bg-emerald-950/20 border-emerald-500/30'
              : 'bg-emerald-50/60 border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {isBn
                ? `✨ ইউজারদের সাজেস্ট করা ও অ্যাডমিন অনুমোদিত নতুন খাবার (${approvedSuggestedFoods.length})`
                : `✨ User Suggested & Admin-Approved Foods (${approvedSuggestedFoods.length})`}
            </h3>
            <button
              type="button"
              onClick={() => {
                setSugSuccess(false);
                setShowSuggestModal(true);
              }}
              className="text-xs font-bold text-amber-600 dark:text-amber-400 underline"
            >
              {isBn ? '+ আরও খাবার সাজেস্ট করুন' : '+ Suggest Another Food'}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {approvedSuggestedFoods.map((sf) => (
              <div
                key={sf.id}
                className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-2 ${
                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                      {sf.suggestedZone.toUpperCase()} ZONE • Admin Approved
                    </span>
                    <span className="text-xs font-black text-amber-500">
                      {sf.caloriesPer100g} kcal
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm mt-1">
                    {isBn ? sf.nameBn : sf.nameEn}
                  </h4>
                  <p className="text-[11px] opacity-75 mt-0.5">
                    {isBn ? sf.healthBenefitsBn : sf.healthBenefitsEn}
                  </p>
                </div>
                <div className="text-[10px] flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="opacity-65">P:{sf.proteinG}g • C:{sf.carbsG}g • F:{sf.fatG}g</span>
                  <button
                    type="button"
                    onClick={() => handleShareSuggestedFoodCard(sf)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-300 font-black flex items-center gap-1 transition-all"
                  >
                    <Share2 className="w-3 h-3" />
                    {isBn ? 'শেয়ার' : 'Share'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Food Suggestion Box Modal */}
      {showSuggestModal && (
        <div className="fixed inset-0 z-[240] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-lg rounded-[32px] border-2 p-6 md:p-8 space-y-4 shadow-2xl ${
              darkMode
                ? 'bg-slate-900 border-amber-500/40 text-white'
                : 'bg-white border-amber-300 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-500">
                  {isBn ? 'ফুড সাজেশন বক্স' : 'Food Suggestion Box'}
                </span>
                <h3 className="text-lg font-extrabold mt-1">
                  {isBn
                    ? '💡 নতুন দেশি বা থেরাপিউটিক খাবার যুক্ত করার পরামর্শ দিন'
                    : '💡 Suggest a New Food for Admin Approval'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSuggestModal(false)}
                className="text-sm font-bold opacity-60 hover:opacity-100"
              >
                ✕
              </button>
            </div>

            {sugSuccess ? (
              <div className="py-6 text-center space-y-3">
                <div className="text-4xl">✅</div>
                <h4 className="font-extrabold text-base">
                  {isBn
                    ? 'আপনার খাবারের সাজেশনটি অ্যাডমিন প্যানেলে পাঠানো হয়েছে!'
                    : 'Your Food Suggestion Has Been Sent to the Admin Panel!'}
                </h4>
                <p className="text-xs opacity-75">
                  {isBn
                    ? 'অ্যাডমিন প্যানেল যাচাই করে অ্যাপ্রুভ করলেই খাবারটি ফুড গ্লোসারি ও ট্রাফিক লাইট ফুড গাইডে যুক্ত হয়ে যাবে।'
                    : 'Once Admin reviews and approves this item, it will appear in the Food Glossary and Traffic Light Guide.'}
                </p>
                <button
                  type="button"
                  onClick={() => setShowSuggestModal(false)}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-extrabold"
                >
                  {isBn ? 'ঠিক আছে' : 'Close'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleFoodSuggestionSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold opacity-75">
                      {isBn ? 'খাবারের নাম (বাংলায়) *' : 'Food Name (Bangla) *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={sugNameBn}
                      onChange={(e) => setSugNameBn(e.target.value)}
                      placeholder={isBn ? 'যেমন: কাউনের চালের জাউ' : 'e.g. Foxtail Millet'}
                      className={`w-full p-2.5 rounded-xl border text-xs mt-1 ${
                        darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold opacity-75">
                      {isBn ? 'খাবারের নাম (ইংরেজিতে)' : 'Food Name (English)'}
                    </label>
                    <input
                      type="text"
                      value={sugNameEn}
                      onChange={(e) => setSugNameEn(e.target.value)}
                      placeholder="e.g. Foxtail Millet Porridge"
                      className={`w-full p-2.5 rounded-xl border text-xs mt-1 ${
                        darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold opacity-75">
                      {isBn ? 'আপনার নাম' : 'Your Name'}
                    </label>
                    <input
                      type="text"
                      value={sugBy}
                      onChange={(e) => setSugBy(e.target.value)}
                      placeholder={isBn ? 'আপনার নাম লিখুন' : 'Your Name'}
                      className={`w-full p-2.5 rounded-xl border text-xs mt-1 ${
                        darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold opacity-75">
                      {isBn ? 'আনুমানিক ক্যালোরি (প্রতি ১০০ গ্রাম)' : 'Approx Calories / 100g'}
                    </label>
                    <input
                      type="number"
                      value={sugCal}
                      onChange={(e) => setSugCal(e.target.value)}
                      className={`w-full p-2.5 rounded-xl border text-xs mt-1 ${
                        darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold opacity-75">
                    {isBn ? 'খাবারটির পুষ্টিগুণ ও উপকারিতা *' : 'Health Benefits & Reason *'}
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={sugBenefits}
                    onChange={(e) => setSugBenefits(e.target.value)}
                    placeholder={
                      isBn
                        ? 'কেন এই খাবারটি ডাটাবেসে যুক্ত করা উচিত এবং কোন রোগের জন্য উপকারী...'
                        : 'Explain the nutritional benefits...'
                    }
                    className={`w-full p-2.5 rounded-xl border text-xs mt-1 ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg"
                >
                  {isBn ? 'অ্যাডমিন প্যানেলে সাজেশন পাঠান' : 'Submit Suggestion to Admin Panel'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 1: FULL 381-FOOD EXPLORER + TRAFFIC LIGHT + 8 HEALTH LENSES     */}
      {/* =================================================================== */}
      {activeTab === 'explorer' && (
        <div className="space-y-5">
          {/* Search + Traffic Light Zone Pills + Sort Bar */}
          <div
            className={`p-4 md:p-5 rounded-3xl border space-y-4 ${
              darkMode
                ? 'bg-slate-900 border-slate-800'
                : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Search Box */}
              <div className="md:col-span-5 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    isBn
                      ? 'বাংলা, English বা Banglish দিয়ে খুঁজুন (যেমন: রুই, লাউ, rui, dal, 01_0015)...'
                      : 'Search in Bangla, English, Banglish or BD FCT code (e.g. rui, gourd, lentil)...'
                  }
                  className={`w-full px-4 py-2.5 rounded-2xl text-xs md:text-sm border outline-none transition-all ${
                    darkMode
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-emerald-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-600'
                  }`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold opacity-60 hover:opacity-100"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Traffic Light Zone Filter Buttons */}
              <div className="md:col-span-4 flex flex-wrap gap-1.5">
                {(['all', 'green', 'yellow', 'red'] as const).map((z) => {
                  const isActive = selectedZone === z;
                  const label =
                    z === 'all'
                      ? isBn
                        ? `সব (${zoneCounts.all})`
                        : `All (${zoneCounts.all})`
                      : z === 'green'
                      ? isBn
                        ? `🟢 গ্রিন (${zoneCounts.green})`
                        : `🟢 Green (${zoneCounts.green})`
                      : z === 'yellow'
                      ? isBn
                        ? `🟡 ইয়েলো (${zoneCounts.yellow})`
                        : `🟡 Yellow (${zoneCounts.yellow})`
                      : isBn
                      ? `🔴 রেড (${zoneCounts.red})`
                      : `🔴 Red (${zoneCounts.red})`;
                  return (
                    <button
                      key={z}
                      type="button"
                      onClick={() => setSelectedZone(z)}
                      className={`px-3 py-2 rounded-xl text-[11px] font-extrabold transition-all ${
                        isActive
                          ? z === 'green'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : z === 'yellow'
                            ? 'bg-amber-500 text-slate-950 shadow-xs'
                            : z === 'red'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-indigo-600 text-white shadow-xs'
                          : darkMode
                          ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Sort Dropdown */}
              <div className="md:col-span-3">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold border outline-none ${
                    darkMode
                      ? 'bg-slate-800 border-slate-700 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="code">
                    {isBn ? 'ক্রম: অফিশিয়াল BD FCT কোড' : 'Sort: Official BD FCT Code'}
                  </option>
                  <option value="protein_desc">
                    {isBn ? 'সর্বোচ্চ প্রোটিন (High Protein)' : 'Highest Protein (g)'}
                  </option>
                  <option value="fiber_desc">
                    {isBn ? 'সর্বোচ্চ ফাইবার (High Fibre)' : 'Highest Dietary Fibre (g)'}
                  </option>
                  <option value="iron_desc">
                    {isBn ? 'সর্বোচ্চ আয়রন (High Iron)' : 'Highest Iron (mg)'}
                  </option>
                  <option value="calcium_desc">
                    {isBn ? 'সর্বোচ্চ ক্যালসিয়াম (High Calcium)' : 'Highest Calcium (mg)'}
                  </option>
                  <option value="vitc_desc">
                    {isBn ? 'সর্বোচ্চ ভিটামিন সি (High Vit C)' : 'Highest Vitamin C (mg)'}
                  </option>
                  <option value="energy_asc">
                    {isBn ? 'সবচেয়ে কম ক্যালোরি (Low Calorie)' : 'Lowest Energy (kcal)'}
                  </option>
                  <option value="energy_desc">
                    {isBn ? 'সবচেয়ে বেশি ক্যালোরি (High Calorie)' : 'Highest Energy (kcal)'}
                  </option>
                  <option value="gi_asc">
                    {isBn ? 'সবচেয়ে কম গ্লাইসেমিক ইনডেক্স (Low GI)' : 'Lowest Glycemic Index (GI)'}
                  </option>
                </select>
              </div>
            </div>

            {/* 16 Official BD FCT Category Pills */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider opacity-65">
                  {isBn
                    ? '১৬টি অফিশিয়াল খাদ্য বিভাগ (BD FCT Categories)'
                    : '16 Official BD FCT Food Groups'}
                </span>
                <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {isBn
                    ? `প্রদর্শিত হচ্ছে: ${filteredFoods.length}টি খাবার`
                    : `Showing: ${filteredFoods.length} foods`}
                </span>
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-hide">
                {BD_FCT_CATEGORIES.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  const count = categoryCounts[cat.id] || 0;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : darkMode
                          ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{isBn ? cat.nameBn : cat.nameEn}</span>
                      <span className="opacity-70 font-mono text-[10px]">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 8 Clinical Health Lenses + Functional V6 Quick Filters */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800">
              {/* 8 Clinical Health Lenses */}
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-60 block mb-1.5">
                  🩺{' '}
                  {isBn
                    ? '৮টি ক্লিনিক্যাল হেলথ লেন্স (রোগভিত্তিক মূল্যায়ন)'
                    : '8 Clinical Health Lenses'}
                </span>
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  <button
                    type="button"
                    onClick={() => setSelectedLens('')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap shrink-0 ${
                      selectedLens === ''
                        ? 'bg-indigo-600 text-white'
                        : darkMode
                        ? 'bg-slate-800 text-slate-400'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isBn ? 'সাধারণ ভিউ' : 'Standard View'}
                  </button>
                  {Object.values(BD_FCT_HEALTH_LENSES).map((lens) => (
                    <button
                      key={lens.id}
                      type="button"
                      onClick={() =>
                        setSelectedLens(selectedLens === lens.id ? '' : lens.id)
                      }
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap shrink-0 flex items-center gap-1 ${
                        selectedLens === lens.id
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : darkMode
                          ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span>{lens.icon}</span>
                      <span>{isBn ? lens.nameBn : lens.nameEn}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Functional Nutrition V6 Filter Pills */}
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-60 block mb-1.5">
                  🧬{' '}
                  {isBn
                    ? 'ফাংশনাল নিউট্রিশন V6 ফিল্টার (GI / FODMAP / Purine)'
                    : 'Functional Nutrition V6 Layer'}
                </span>
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  {[
                    { id: 'all', bn: 'সব খাবার', en: 'All V6' },
                    { id: 'low_gi', bn: '🟢 Low GI', en: '🟢 Low GI' },
                    { id: 'low_fodmap', bn: '🌿 Low FODMAP (IBS)', en: '🌿 Low FODMAP' },
                    { id: 'gluten_free', bn: '🌾 Gluten-Free', en: '🌾 Gluten-Free' },
                    { id: 'low_purine', bn: '🦶 Low Purine (Uric Acid)', en: '🦶 Low Purine' },
                    { id: 'low_oxalate', bn: '🪨 Low Oxalate (Stone)', en: '🪨 Low Oxalate' },
                    { id: 'low_histamine', bn: '🛡️ Low Histamine', en: '🛡️ Low Histamine' },
                  ].map((fn) => (
                    <button
                      key={fn.id}
                      type="button"
                      onClick={() => setSelectedFnFilter(fn.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap shrink-0 ${
                        selectedFnFilter === fn.id
                          ? 'bg-teal-600 text-white shadow-xs'
                          : darkMode
                          ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {isBn ? fn.bn : fn.en}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Grid of BD FCT Food Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredFoods.map(({ raw: f, tl, ext }) => {
              const lensCue = selectedLens
                ? getHealthLensCue(f, selectedLens, isBn)
                : null;
              const isSelectedInDiet = selectedDietIds.includes(`bdfct_${f.code}`);
              const isCompared = compareCodes.includes(f.code);

              return (
                <div
                  key={f.code}
                  className={`p-4 rounded-3xl border flex flex-col justify-between gap-3 transition-all hover:shadow-md ${
                    tl.zone === 'green'
                      ? darkMode
                        ? 'bg-slate-900 border-emerald-500/30 hover:border-emerald-500/60'
                        : 'bg-white border-emerald-200/90 hover:border-emerald-400'
                      : tl.zone === 'yellow'
                      ? darkMode
                        ? 'bg-slate-900 border-amber-500/30 hover:border-amber-500/60'
                        : 'bg-white border-amber-200/90 hover:border-amber-400'
                      : darkMode
                      ? 'bg-slate-900 border-rose-500/30 hover:border-rose-500/60'
                      : 'bg-white border-rose-200/90 hover:border-rose-400'
                  }`}
                >
                  <div>
                    {/* Top Row: Icon + BD FCT Code + Traffic Light Badge */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                            darkMode ? 'bg-slate-800' : 'bg-slate-100'
                          }`}
                        >
                          {f.icon || '🥗'}
                        </div>
                        <div>
                          <span className="text-[10px] font-mono opacity-60 block">
                            #{f.code} · {isBn ? tl.bdSubCategoryBn : tl.bdSubCategory}
                          </span>
                          <h3
                            onClick={() => {
                              setSelectedFood(f);
                              setModalPortionGrams(100);
                            }}
                            className="font-bold text-sm md:text-base leading-snug cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                          >
                            {isBn ? getBdFoodNameBn(f) : getBdFoodNameEn(f)}
                          </h3>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold shrink-0 ${
                          tl.zone === 'green'
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                            : tl.zone === 'yellow'
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                            : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {tl.zone === 'green'
                          ? isBn
                            ? '🟢 গ্রিন'
                            : '🟢 Green'
                          : tl.zone === 'yellow'
                          ? isBn
                            ? '🟡 ইয়েলো'
                            : '🟡 Yellow'
                          : isBn
                          ? '🔴 রেড'
                          : '🔴 Red'}
                      </span>
                    </div>

                    {/* Secondary Name & Scientific Name */}
                    <p className="text-[11px] opacity-65 line-clamp-1">
                      {isBn ? getBdFoodNameEn(f) : getBdFoodNameBn(f)}
                      {f.scientific ? ` · ${f.scientific}` : ''}
                    </p>

                    {/* Per 100g Core Macro & Micro Strip */}
                    <div
                      className={`mt-2.5 p-2.5 rounded-2xl grid grid-cols-4 gap-1.5 text-center font-mono text-[11px] ${
                        darkMode
                          ? 'bg-slate-800/80'
                          : 'bg-slate-50 border border-slate-200/60'
                      }`}
                    >
                      <div>
                        <span className="text-[9px] opacity-60 block">
                          {isBn ? 'শক্তি' : 'Kcal'}
                        </span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          {fmtNutrient(f.energy_kcal, 0, isBn)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] opacity-60 block">
                          {isBn ? 'প্রোটিন' : 'Prot'}
                        </span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {fmtNutrient(f.protein_g, 1, isBn)}g
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] opacity-60 block">
                          {isBn ? 'শর্করা' : 'Carb'}
                        </span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                          {fmtNutrient(f.carb_g, 1, isBn)}g
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] opacity-60 block">
                          {isBn ? 'ফাইবার' : 'Fibre'}
                        </span>
                        <span className="font-bold text-teal-600 dark:text-teal-400">
                          {fmtNutrient(f.fibre_g, 1, isBn)}g
                        </span>
                      </div>
                    </div>

                    {/* Functional V6 Badges */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-500/10">
                        GI: {ext.gi.className}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-500/10">
                        {ext.fodmap.status.split(' ')[0]} FODMAP
                      </span>
                      {nval(f.iron_mg) !== null && (nval(f.iron_mg) ?? 0) >= 2 && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                          Fe {fmtNutrient(f.iron_mg, 1, isBn)}mg
                        </span>
                      )}
                      {nval(f.calcium_mg) !== null && (nval(f.calcium_mg) ?? 0) >= 80 && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          Ca {fmtNutrient(f.calcium_mg, 0, isBn)}mg
                        </span>
                      )}
                    </div>

                    {/* Health Lens Cue or Traffic Light Clinical Reason */}
                    {lensCue ? (
                      <p
                        className={`mt-2 text-[11px] font-bold px-2.5 py-1.5 rounded-xl ${
                          lensCue.tone === 'good'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                            : lensCue.tone === 'bad'
                            ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
                            : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {lensCue.symbol} {lensCue.text}
                      </p>
                    ) : (
                      <p className="mt-2 text-[11px] opacity-80 line-clamp-2 leading-relaxed">
                        {isBn ? tl.clinicalReasonBn : tl.clinicalReasonEn}
                      </p>
                    )}

                    {/* Cross-Border Local Supermarket Equivalent on Food Card */}
                    {crossBorderInfo.isCrossBorder && (() => {
                      const localSwap = resolveFoodOrMealSupermarketSwap(
                        `${getBdFoodNameBn(f)} ${getBdFoodNameEn(f)} ${f.cat || ''}`,
                        crossBorderInfo.residenceCountry,
                        crossBorderInfo.preferredCuisineCountry,
                        crossBorderInfo.supermarketSubstituteMode,
                        lang
                      );
                      return (
                        <div
                          className={`mt-2 p-2 rounded-xl border text-[10px] leading-snug ${
                            darkMode
                              ? 'bg-indigo-950/30 border-indigo-500/30 text-indigo-200'
                              : 'bg-indigo-50/70 border-indigo-200/80 text-indigo-950'
                          }`}
                        >
                          <div className="font-bold text-indigo-600 dark:text-indigo-300">
                            🛒{' '}
                            {isBn
                              ? `${localSwap.residenceCountryLabel} সুপারমার্কেট বিকল্প:`
                              : `${localSwap.residenceCountryLabel} Supermarket Equivalent:`}
                          </div>
                          <p className="opacity-90 mt-0.5 line-clamp-2">
                            {localSwap.equivalentItems}
                          </p>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Card Footer Actions: 26-Nutrient Popup | Add to Diet Chart | Plate | Compare */}
                  <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFood(f);
                        setModalPortionGrams(100);
                      }}
                      className="px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                    >
                      🔬 {isBn ? '২৬ পুষ্টি পপআপ' : '26 Nutrients'}
                    </button>

                    <div className="flex items-center gap-1">
                      {tl.zone !== 'red' && profile && onUpdateProfile && (
                        <button
                          type="button"
                          onClick={() => handleToggleDietFood(f.code, tl.zone)}
                          className={`px-2.5 py-1.5 rounded-xl text-[10px] font-extrabold transition-all ${
                            isSelectedInDiet
                              ? 'bg-emerald-600 text-white'
                              : darkMode
                              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                          title={
                            isBn
                              ? 'ডায়েট চার্টে যুক্ত/বাতিল করুন'
                              : 'Toggle in Diet Chart'
                          }
                        >
                          {isSelectedInDiet
                            ? isBn
                              ? '✓ ডায়েটে যুক্ত'
                              : '✓ In Diet'
                            : isBn
                            ? '+ ডায়েটে নিন'
                            : '+ Add Diet'}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleAddToPlate(f)}
                        className={`px-2 py-1.5 rounded-xl text-[10px] font-bold ${
                          darkMode
                            ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                        title={isBn ? 'মাই প্লেটে যোগ করুন' : 'Add to My Plate'}
                      >
                        🍽️
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleCompare(f.code)}
                        className={`px-2 py-1.5 rounded-xl text-[10px] font-bold ${
                          isCompared
                            ? 'bg-amber-500 text-slate-950'
                            : darkMode
                            ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                        title={isBn ? 'তুলনায় রাখুন' : 'Compare Food'}
                      >
                        ⚖️
                      </button>

                      <button
                        type="button"
                        onClick={() => handleShareFoodCard(f)}
                        className="px-2.5 py-1.5 rounded-xl text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/25 transition-colors flex items-center gap-1"
                        title={
                          isBn
                            ? 'হোয়াটসঅ্যাপ বা ফেসবুকে ফুড কার্ড শেয়ার করুন'
                            : 'Share Food Card to WhatsApp or Facebook'
                        }
                      >
                        <Share2 className="w-3 h-3" />
                        <span>{isBn ? 'শেয়ার' : 'Share'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: MY PLATE PORTION CALCULATOR (BD FCT MACRO & MICRO TOTALS)    */}
      {/* =================================================================== */}
      {activeTab === 'plate' && (
        <div
          className={`p-5 md:p-7 rounded-3xl border space-y-6 ${
            darkMode
              ? 'bg-slate-900 border-slate-800'
              : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-200/70 dark:border-slate-800">
            <div>
              <h3 className="text-xl md:text-2xl font-bold serif italic">
                🍽️{' '}
                {isBn
                  ? 'মাই প্লেট পোরশন ক্যালকুলেটর (BD FCT Standard)'
                  : 'My Plate Portion Calculator'}
              </h3>
              <p className="text-xs opacity-75 mt-0.5">
                {isBn
                  ? 'আপনার এক বেলার খাবারের গ্রাম (g) পরিবর্তন করে মোট ক্যালোরি, প্রোটিন, শর্করা, ফাইবার, আয়রন ও ক্যালসিয়াম হিসাব করুন।'
                  : 'Adjust gram weights of Bangladeshi foods on your plate to calculate exact macro and micronutrient totals.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('explorer')}
              className="px-4 py-2 rounded-xl text-xs font-extrabold bg-emerald-600 text-white hover:bg-emerald-500 self-start sm:self-auto"
            >
              + {isBn ? 'গ্লোসারি থেকে আরও খাবার যোগ করুন' : 'Add More Foods from Glossary'}
            </button>
          </div>

          {/* Total Macro/Micro Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              {
                label: isBn ? 'মোট ওজন' : 'Total Weight',
                val: `${plateTotals.grams} g`,
                color: 'text-slate-500',
              },
              {
                label: isBn ? 'মোট শক্তি' : 'Total Energy',
                val: `${plateTotals.en.toFixed(0)} kcal`,
                color: 'text-amber-500',
              },
              {
                label: isBn ? 'প্রোটিন' : 'Protein',
                val: `${plateTotals.pr.toFixed(1)} g`,
                color: 'text-emerald-500',
              },
              {
                label: isBn ? 'শর্করা (Carb)' : 'Carbohydrate',
                val: `${plateTotals.ch.toFixed(1)} g`,
                color: 'text-indigo-500',
              },
              {
                label: isBn ? 'ডায়েটারি ফাইবার' : 'Dietary Fibre',
                val: `${plateTotals.fb.toFixed(1)} g`,
                color: 'text-teal-500',
              },
              {
                label: isBn ? 'আয়রন ও ক্যালসিয়াম' : 'Iron & Calcium',
                val: `Fe ${plateTotals.fe.toFixed(1)}mg · Ca ${plateTotals.ca.toFixed(0)}mg`,
                color: 'text-rose-500',
              },
            ].map((stat, i) => (
              <div
                key={i}
                className={`p-3.5 rounded-2xl border ${
                  darkMode
                    ? 'bg-slate-800/70 border-slate-700'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className="text-[10px] font-bold uppercase opacity-60 block">
                  {stat.label}
                </span>
                <span
                  className={`text-sm md:text-base font-extrabold font-mono mt-1 block ${stat.color}`}
                >
                  {stat.val}
                </span>
              </div>
            ))}
          </div>

          {/* Plate Items List */}
          <div className="space-y-3">
            {plateItems.map(({ food, grams }) => {
              const ratio = grams / 100;
              return (
                <div
                  key={food.code}
                  className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    darkMode
                      ? 'bg-slate-800/40 border-slate-700'
                      : 'bg-slate-50/70 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{food.icon || '🥗'}</span>
                    <div>
                      <h4 className="font-bold text-sm">
                        {isBn ? getBdFoodNameBn(food) : getBdFoodNameEn(food)}
                      </h4>
                      <span className="text-[11px] font-mono opacity-70">
                        {((nval(food.energy_kcal) || 0) * ratio).toFixed(0)} kcal · P:{' '}
                        {((nval(food.protein_g) || 0) * ratio).toFixed(1)}g · C:{' '}
                        {((nval(food.carb_g) || 0) * ratio).toFixed(1)}g · Fb:{' '}
                        {((nval(food.fibre_g) || 0) * ratio).toFixed(1)}g
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {[50, 100, 150, 200].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleUpdatePlateGrams(food.code, preset)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                          grams === preset
                            ? 'bg-emerald-600 text-white'
                            : darkMode
                            ? 'bg-slate-700 text-slate-300'
                            : 'bg-white border border-slate-200 text-slate-700'
                        }`}
                      >
                        {preset}g
                      </button>
                    ))}
                    <input
                      type="number"
                      min={10}
                      max={1000}
                      value={grams}
                      onChange={(e) =>
                        handleUpdatePlateGrams(food.code, Number(e.target.value) || 0)
                      }
                      className={`w-20 px-2.5 py-1 rounded-lg text-xs font-mono font-bold border text-center ${
                        darkMode
                          ? 'bg-slate-900 border-slate-700 text-white'
                          : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdatePlateGrams(food.code, 0)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/15 text-rose-500 hover:bg-rose-500/25"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: SIDE-BY-SIDE 26-NUTRIENT FOOD COMPARISON (UP TO 4 FOODS)     */}
      {/* =================================================================== */}
      {activeTab === 'compare' && (
        <div
          className={`p-5 md:p-7 rounded-3xl border space-y-5 ${
            darkMode
              ? 'bg-slate-900 border-slate-800'
              : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xl md:text-2xl font-bold serif italic">
                ⚖️{' '}
                {isBn
                  ? 'খাবারের পুষ্টি ও গ্লাইসেমিক তুলনা (প্রতি ১০০ গ্রাম)'
                  : 'Side-by-Side BD FCT Nutrient Comparison'}
              </h3>
              <p className="text-xs opacity-75">
                {isBn
                  ? 'যেকোনো ৪টি বাংলাদেশি খাবারের ২৬টি পুষ্টি উপাদান এবং ফাংশনাল V6 প্রোফাইল পাশাপাশি তুলনা করুন।'
                  : 'Compare up to 4 Bangladeshi foods across all 26 official BD FCT nutrients and Functional V6 metrics.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('explorer')}
              className="px-4 py-2 rounded-xl text-xs font-extrabold bg-emerald-600 text-white"
            >
              + {isBn ? 'তুলনার খাবার পরিবর্তন করুন' : 'Select Foods in Glossary'}
            </button>
          </div>

          {comparedFoods.length === 0 ? (
            <p className="text-sm opacity-70 py-8 text-center">
              {isBn
                ? 'তুলনা করার জন্য গ্লোসারি থেকে যেকোনো খাবারের ⚖️ বাটনে ক্লিক করুন।'
                : 'Click the ⚖️ button on any food card in the Glossary to compare.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse tabular-nums">
                <thead>
                  <tr className={`border-b ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                    <th className="py-3 pr-4 text-left font-bold">
                      {isBn ? 'পুষ্টি উপাদান (প্রতি ১০০ গ্রাম)' : 'Nutrient (per 100g)'}
                    </th>
                    {comparedFoods.map(({ raw: f, tl }) => (
                      <th key={f.code} className="py-3 px-3 text-right min-w-[140px]">
                        <div className="flex items-center justify-end gap-1.5">
                          <span>{f.icon || '🥗'}</span>
                          <span className="font-bold">
                            {isBn ? getBdFoodNameBn(f) : getBdFoodNameEn(f)}
                          </span>
                        </div>
                        <div className="text-[10px] opacity-65 font-mono">
                          #{f.code} · {tl.zone.toUpperCase()}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800">
                  <tr>
                    <td className="py-2 pr-4 font-bold">Glycemic Index (GI)</td>
                    {comparedFoods.map(({ raw: f, ext }) => (
                      <td
                        key={f.code}
                        className="py-2 px-3 text-right font-mono font-bold text-indigo-500"
                      >
                        {ext.gi.status}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-bold">FODMAP / Purine / Oxalate</td>
                    {comparedFoods.map(({ raw: f, ext }) => (
                      <td key={f.code} className="py-2 px-3 text-right font-mono">
                        F:{ext.fodmap.className} · P:{ext.purine.className} · Ox:
                        {ext.oxalate.className}
                      </td>
                    ))}
                  </tr>
                  {BD_FCT_NUTRIENTS.map(([key, bn, en, unit]) => (
                    <tr key={key}>
                      <td className="py-2 pr-4 font-medium">
                        {isBn ? bn : en}{' '}
                        <span className="opacity-50 font-mono">({unit})</span>
                      </td>
                      {comparedFoods.map(({ raw: f }) => (
                        <td
                          key={f.code}
                          className="py-2 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400"
                        >
                          {fmtNutrient(
                            (f as unknown as Record<string, unknown>)[key],
                            1,
                            isBn
                          )}{' '}
                          {unit}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* POPUP MODAL: 26-NUTRIENT OFFICIAL BD FCT + FUNCTIONAL V6 INSPECTOR  */}
      {/* =================================================================== */}
      {selectedFood &&
        (() => {
          const tl = classifyBdFoodToTrafficLight(selectedFood, activeProfile);
          const ext = getExternalFunctionalProfile(selectedFood);
          const isSelectedInDiet = selectedDietIds.includes(`bdfct_${selectedFood.code}`);
          const scale = modalPortionGrams / 100;

          return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
              <div
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
                onClick={() => setSelectedFood(null)}
              />

              <div
                className={`relative w-full max-w-3xl max-h-[90vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden ${
                  darkMode
                    ? 'bg-slate-900 border-slate-700 text-white'
                    : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                {/* Modal Header */}
                <div
                  className={`p-4 md:p-6 border-b flex items-start justify-between gap-3 ${
                    darkMode
                      ? 'border-slate-800 bg-slate-900'
                      : 'border-slate-200 bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm shrink-0 ${
                        darkMode ? 'bg-slate-800' : 'bg-white'
                      }`}
                    >
                      {selectedFood.icon || '🥗'}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-500/15 text-indigo-500">
                          BD FCT #{selectedFood.code}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold ${
                            tl.zone === 'green'
                              ? 'bg-emerald-500/20 text-emerald-500'
                              : tl.zone === 'yellow'
                              ? 'bg-amber-500/20 text-amber-500'
                              : 'bg-rose-500/20 text-rose-500'
                          }`}
                        >
                          {tl.zone === 'green'
                            ? isBn
                              ? '🟢 গ্রিন জোন (অবাধে ভক্ষণীয়)'
                              : '🟢 Green Zone (Freely Allowed)'
                            : tl.zone === 'yellow'
                            ? isBn
                              ? '🟡 ইয়েলো জোন (পরিমিত পোরশন)'
                              : '🟡 Yellow Zone (Portion Controlled)'
                            : isBn
                            ? '🔴 রেড জোন (বর্জনীয়)'
                            : '🔴 Red Zone (Avoid)'}
                        </span>
                      </div>
                      <h3 className="text-lg md:text-2xl font-bold serif italic leading-snug">
                        {isBn
                          ? getBdFoodNameBn(selectedFood)
                          : getBdFoodNameEn(selectedFood)}
                      </h3>
                      <p className="text-xs opacity-70">
                        {isBn
                          ? getBdFoodNameEn(selectedFood)
                          : getBdFoodNameBn(selectedFood)}
                        {selectedFood.scientific ? ` · ${selectedFood.scientific}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleShareFoodCard(selectedFood)}
                      className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      {isBn ? 'শেয়ার কার্ড' : 'Share Food'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedFood(null)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shrink-0"
                    >
                      ✕ {isBn ? 'বন্ধ করুন' : 'Close'}
                    </button>
                  </div>
                </div>

                {/* Scrollable Modal Content */}
                <div className="p-4 md:p-6 overflow-y-auto space-y-5">
                  {/* Personalized Clinical Reason & Diet Chart Toggle */}
                  <div
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      tl.zone === 'green'
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : tl.zone === 'yellow'
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-rose-500/10 border-rose-500/30'
                    }`}
                  >
                    <div className="space-y-1 text-xs">
                      <div className="font-extrabold">
                        {isBn
                          ? 'আপনার প্রোফাইল অনুযায়ী ক্লিনিক্যাল সিদ্ধান্ত:'
                          : 'Personalized Clinical Verdict:'}
                      </div>
                      <p className="opacity-90 leading-relaxed">
                        {isBn ? tl.clinicalReasonBn : tl.clinicalReasonEn}
                      </p>
                      <p className="font-mono text-[11px] opacity-75">
                        {isBn
                          ? `প্রস্তাবিত পোরশন: ${tl.portionLimitBn}`
                          : `Suggested Portion: ${tl.portionLimitEn}`}
                      </p>
                    </div>

                    {tl.zone !== 'red' && profile && onUpdateProfile && (
                      <button
                        type="button"
                        onClick={() => handleToggleDietFood(selectedFood.code, tl.zone)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-extrabold shrink-0 transition-all ${
                          isSelectedInDiet
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        }`}
                      >
                        {isSelectedInDiet
                          ? isBn
                            ? '✓ ডায়েট চার্টে যুক্ত আছে'
                            : '✓ Selected in Diet Chart'
                          : isBn
                          ? '+ ডায়েট চার্টে যোগ করুন'
                          : '+ Add to My Diet Chart'}
                      </button>
                    )}
                  </div>

                  {/* Functional Nutrition V6 Layer */}
                  <div
                    className={`p-4 rounded-2xl border space-y-3 ${
                      darkMode
                        ? 'bg-slate-800/60 border-slate-700'
                        : 'bg-indigo-50/50 border-indigo-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        🧬{' '}
                        {isBn
                          ? 'ফাংশনাল নিউট্রিশন V6 এভিডেন্স লেয়ার'
                          : 'Functional Nutrition V6 Evidence Layer'}
                      </h4>
                      <span className="text-[10px] font-mono opacity-65">
                        Sydney GI · Monash FODMAP · USDA Purine
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      {[
                        { title: 'Glycemic Index (GI)', item: ext.gi },
                        { title: 'Monash FODMAP', item: ext.fodmap },
                        { title: 'Purine (Uric Acid)', item: ext.purine },
                        { title: 'Oxalate (Kidney Stone)', item: ext.oxalate },
                        { title: 'Gluten / Celiac', item: ext.gluten },
                        { title: 'Histamine & Nightshade', item: ext.histamine },
                      ].map((metric, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border ${
                            darkMode
                              ? 'bg-slate-900 border-slate-700'
                              : 'bg-white border-slate-200/70'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold uppercase opacity-60">
                              {metric.title}
                            </span>
                            <span className="font-mono font-extrabold text-indigo-600 dark:text-indigo-400">
                              {metric.item.status}
                            </span>
                          </div>
                          <p className="text-[11px] opacity-80 leading-relaxed">
                            {metric.item.note}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 8 Clinical Health Lenses Summary for this Food */}
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider opacity-70 mb-2">
                      🩺{' '}
                      {isBn
                        ? '৮টি রোগভিত্তিক ক্লিনিক্যাল মূল্যায়ন'
                        : '8 Condition-Specific Clinical Evaluations'}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.values(BD_FCT_HEALTH_LENSES).map((lens) => {
                        const cue = getHealthLensCue(selectedFood, lens.id, isBn);
                        return (
                          <div
                            key={lens.id}
                            className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                              darkMode
                                ? 'bg-slate-800/50 border-slate-700'
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <span className="font-bold">
                              {lens.icon} {isBn ? lens.nameBn : lens.nameEn}
                            </span>
                            <span
                              className={`font-mono font-bold text-[11px] ${
                                cue.tone === 'good'
                                  ? 'text-emerald-500'
                                  : cue.tone === 'bad'
                                  ? 'text-rose-500'
                                  : 'text-amber-500'
                              }`}
                            >
                              {cue.symbol} {cue.text}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 26-Nutrient Official BD FCT Table with Custom Portion Scaler */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div>
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          📊{' '}
                          {isBn
                            ? `সম্পূর্ণ ২৫+ পুষ্টি উপাদান (প্রতি ${modalPortionGrams} গ্রাম ভক্ষণযোগ্য অংশ)`
                            : `Complete BD FCT Nutrients (Per ${modalPortionGrams}g Edible Portion)`}
                        </h4>
                        <span className="text-[10px] opacity-60">
                          {isBn ? BD_FCT_SOURCE_LINE_BN : BD_FCT_SOURCE_LINE_EN}
                        </span>
                      </div>

                      {/* Portion Scaler Pills */}
                      <div className="flex items-center gap-1">
                        {[50, 100, 150, 200, 250].map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setModalPortionGrams(g)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                              modalPortionGrams === g
                                ? 'bg-emerald-600 text-white'
                                : darkMode
                                ? 'bg-slate-800 text-slate-300'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {g}g
                          </button>
                        ))}
                      </div>
                    </div>

                    <div
                      className={`overflow-hidden rounded-2xl border ${
                        darkMode
                          ? 'border-slate-700 bg-slate-800/40'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <table className="w-full text-xs tabular-nums">
                        <thead className={darkMode ? 'bg-slate-800' : 'bg-slate-100'}>
                          <tr>
                            <th className="px-4 py-2.5 text-left font-bold">
                              {isBn ? 'পুষ্টি উপাদান (Nutrient)' : 'Nutrient Parameter'}
                            </th>
                            <th className="px-4 py-2.5 text-right font-bold">
                              {isBn
                                ? `পরিমাণ (${modalPortionGrams}g)`
                                : `Value (${modalPortionGrams}g)`}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
                          {BD_FCT_NUTRIENTS.map(([key, bn, en, unit, icon]) => {
                            const rawVal = nval(
                              (selectedFood as unknown as Record<string, unknown>)[key]
                            );
                            const scaledVal = rawVal !== null ? rawVal * scale : null;
                            return (
                              <tr key={key}>
                                <td className="px-4 py-2 font-medium">
                                  <span className="mr-1.5">{icon}</span>
                                  {isBn ? bn : en}
                                </td>
                                <td className="px-4 py-2 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                  {scaledVal !== null
                                    ? `${fmtNutrient(scaledVal, 1, isBn)} ${unit}`
                                    : '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Evidence Sources Citation */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {Object.entries(BD_FCT_EXT_SOURCES).map(([key, src]) => (
                        <span
                          key={key}
                          className="px-2 py-0.5 rounded-md text-[10px] opacity-65 bg-slate-500/10"
                        >
                          ✓ {src.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      {/* Social Media Share Modal for Food Glossary Cards */}
      <SocialShareModal
        isOpen={Boolean(foodSharePayload)}
        onClose={() => setFoodSharePayload(null)}
        payload={foodSharePayload}
        lang={lang}
        darkMode={Boolean(darkMode)}
      />
    </div>
  );
};

export default FoodRecognitionView;
