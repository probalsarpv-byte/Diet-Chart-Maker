import React, { useState, useMemo } from 'react';
import { Language } from '../types';
import {
  EquivalenceCategoryKey,
  GLOBAL_COUNTRIES_AND_CUISINES,
  getCountryCuisineProfile,
  getNutritionalEquivalenceComparisons,
} from '../services/crossBorderFoodEquivalenceService';
import { getLocalHarvestSnapshotForCountry } from '../services/localHarvestDatabaseService';
import {
  SmartGeoLocationSnapshot,
  applyCityPresetSmartGeoLocation,
  detectLiveSmartGeoLocation,
} from '../services/smartGeoLocationService';
import {
  X,
  Scale,
  MapPin,
  LocateFixed,
  Loader2,
  CheckCircle2,
  ShoppingBag,
  Utensils,
  Sprout,
  Search,
  Sparkles,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  residenceCountryCode: string;
  preferredCuisineCode: string;
  geoSnapshot: SmartGeoLocationSnapshot | null;
  lang: Language;
  darkMode?: boolean;
  initialCategory?: EquivalenceCategoryKey | 'all';
  onGeoLocationUpdated?: (nextGeo: SmartGeoLocationSnapshot) => void;
}

const CATEGORY_TABS: {
  id: EquivalenceCategoryKey | 'all';
  labelBn: string;
  labelEn: string;
}[] = [
  { id: 'all', labelBn: 'সব ক্যাটাগরি (All)', labelEn: 'All Categories' },
  { id: 'fish_protein', labelBn: '🐟 মাছ ও প্রোটিন', labelEn: '🐟 Fish & Protein' },
  { id: 'grains_carbs', labelBn: '🌾 লাল চাল ও শর্করা', labelEn: '🌾 Grains & Carbs' },
  { id: 'leafy_greens', labelBn: '🥬 শাক-পাতা', labelEn: '🥬 Leafy Greens' },
  { id: 'gourds_squash', labelBn: '🥒 লাউ, পেঁপে ও সবজি', labelEn: '🥒 Gourds & Veg' },
  { id: 'lentils_legumes', labelBn: '🥣 ডাল ও লেগিউম', labelEn: '🥣 Lentils & Dal' },
  { id: 'probiotics_oils', labelBn: '🥛 টক দই ও ফ্যাট', labelEn: '🥛 Probiotics & Oils' },
];

const NutritionalEquivalenceComparisonModal: React.FC<Props> = ({
  isOpen,
  onClose,
  residenceCountryCode,
  preferredCuisineCode,
  geoSnapshot,
  lang,
  darkMode = false,
  initialCategory = 'all',
  onGeoLocationUpdated,
}) => {
  const isBn = lang === 'bn';
  const [activeResCode, setActiveResCode] = useState<string>(residenceCountryCode || 'US');
  const [activeCuiCode, setActiveCuiCode] = useState<string>(preferredCuisineCode || 'BD');
  const [selectedCategory, setSelectedCategory] = useState<EquivalenceCategoryKey | 'all'>(
    initialCategory
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [localGeo, setLocalGeo] = useState<SmartGeoLocationSnapshot | null>(geoSnapshot);
  const [detectingGps, setDetectingGps] = useState<boolean>(false);

  const residenceProfile = getCountryCuisineProfile(activeResCode);
  const cuisineProfile = getCountryCuisineProfile(activeCuiCode);
  const localHarvestSnapshot = useMemo(
    () => getLocalHarvestSnapshotForCountry(activeResCode),
    [activeResCode]
  );

  const allPairs = useMemo(
    () => getNutritionalEquivalenceComparisons(activeResCode, activeCuiCode),
    [activeResCode, activeCuiCode]
  );

  const filteredPairs = useMemo(() => {
    return allPairs.filter((pair) => {
      if (selectedCategory !== 'all' && pair.category !== selectedCategory) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const haystack = `${pair.traditionalFood.nameBn} ${pair.traditionalFood.nameEn} ${pair.localSupermarketSubstitute.nameBn} ${pair.localSupermarketSubstitute.nameEn} ${pair.categoryLabelBn} ${pair.categoryLabelEn}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [allPairs, selectedCategory, searchQuery]);

  if (!isOpen) return null;

  const handleRefreshLiveGps = async () => {
    setDetectingGps(true);
    try {
      const snap = await detectLiveSmartGeoLocation(activeCuiCode);
      setLocalGeo(snap);
      setActiveResCode(snap.countryCode);
      if (onGeoLocationUpdated) {
        onGeoLocationUpdated(snap);
      }
    } finally {
      setDetectingGps(false);
    }
  };

  const handleSwitchResidenceCountry = async (nextCode: string) => {
    setActiveResCode(nextCode);
    try {
      const snap = await applyCityPresetSmartGeoLocation(nextCode, activeCuiCode);
      setLocalGeo(snap);
      if (onGeoLocationUpdated) {
        onGeoLocationUpdated(snap);
      }
    } catch {
      // Ignore fallback error
    }
  };

  return (
    <div className="fixed inset-0 z-[170] flex items-center justify-center bg-black/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div
        className={`w-full max-w-5xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
          darkMode
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Top Modal Header */}
        <div
          className={`px-4 sm:px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 ${
            darkMode
              ? 'bg-slate-950/70 border-slate-800'
              : 'bg-slate-50/90 border-slate-200'
          }`}
        >
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-emerald-600 text-white">
                <Scale className="w-3.5 h-3.5" />
                {isBn
                  ? '১:১ সাইড-বাই-সাইড পুষ্টি সমতা তুলনা'
                  : '1:1 Side-by-Side Nutritional Equivalence'}
              </span>
              {localGeo && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 tabular-nums">
                  <MapPin className="w-3 h-3" />
                  {localGeo.flag} {isBn ? localGeo.cityNameBn : localGeo.cityNameEn} (
                  {localGeo.latitude.toFixed(2)}°, {localGeo.longitude.toFixed(2)}°)
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-xl font-black tracking-tight">
              {isBn
                ? `${cuisineProfile.flag} ঐতিহ্যবাহী দেশি খাবার বনাম ${residenceProfile.flag} ${residenceProfile.countryNameBn}-এর স্থানীয় সুপারমার্কেট বিকল্প`
                : `${cuisineProfile.flag} Traditional Cultural Foods vs. ${residenceProfile.flag} ${residenceProfile.countryNameEn} Supermarket Substitutes`}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={handleRefreshLiveGps}
              disabled={detectingGps}
              className="px-3 py-2 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-60"
            >
              {detectingGps ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LocateFixed className="w-3.5 h-3.5" />
              )}
              <span>{isBn ? 'লাইভ GPS সিঙ্ক' : 'Sync Live GPS'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-xl border transition-colors ${
                darkMode
                  ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Interactive Toolbar: Country Pair Selectors + Category Filter + Search */}
        <div
          className={`px-4 sm:px-6 py-3 border-b space-y-3 shrink-0 ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {/* Left Selector: Traditional Food Heritage */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                🍲 {isBn ? 'ঐতিহ্যবাহী খাবার:' : 'Traditional Food:'}
              </span>
              <select
                value={activeCuiCode}
                onChange={(e) => setActiveCuiCode(e.target.value)}
                className={`flex-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold outline-none ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                {GLOBAL_COUNTRIES_AND_CUISINES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {isBn ? c.cuisineNameBn : c.cuisineNameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Middle Selector: Current Geo-Location Supermarket Country */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                🛒 {isBn ? 'বর্তমান জিও-লোকেশন:' : 'Current Geo-Location:'}
              </span>
              <select
                value={activeResCode}
                onChange={(e) => handleSwitchResidenceCountry(e.target.value)}
                className={`flex-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold outline-none ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                {GLOBAL_COUNTRIES_AND_CUISINES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {isBn ? c.countryNameBn : c.countryNameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isBn
                    ? 'খাবার খুঁজুন (যেমন: রুই, লাল চাল, লাউ, স্যামন)...'
                    : 'Search food (e.g., Rui, Red Rice, Lau, Chayote)...'
                }
                className={`w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs outline-none ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORY_TABS.map((tab) => {
              const active = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-colors border ${
                    active
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : darkMode
                      ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {isBn ? tab.labelBn : tab.labelEn}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Comparison Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {filteredPairs.map((pair) => (
            <div
              key={pair.id}
              className={`rounded-2xl border overflow-hidden transition-all ${
                darkMode
                  ? 'bg-slate-800/40 border-slate-700/80'
                  : 'bg-slate-50/60 border-slate-200 shadow-xs'
              }`}
            >
              {/* Category & Parity Score Top Strip */}
              <div
                className={`px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-2 ${
                  darkMode
                    ? 'bg-slate-800/90 border-slate-700'
                    : 'bg-slate-100/90 border-slate-200'
                }`}
              >
                <span className="text-xs sm:text-sm font-extrabold">
                  {isBn ? pair.categoryLabelBn : pair.categoryLabelEn}
                </span>
                <div className="flex items-center gap-2 tabular-nums">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" />
                    {pair.parityScorePercent}%{' '}
                    {isBn ? 'পুষ্টি ও মেটাবলিক সমতা' : 'Nutritional & Glycemic Match'}
                  </span>
                </div>
              </div>

              {/* Side-by-Side Split Grid */}
              <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                {/* LEFT COLUMN: Traditional Cultural Food */}
                <div
                  className={`lg:col-span-5 p-4 rounded-xl border space-y-3 flex flex-col justify-between ${
                    darkMode
                      ? 'bg-slate-900/90 border-emerald-800/50'
                      : 'bg-white border-emerald-200/90'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">
                        <Utensils className="w-3.5 h-3.5" />
                        {isBn
                          ? 'ঐতিহ্যবাহী দেশি খাবার (Traditional)'
                          : 'Traditional Cultural Food'}
                      </span>
                      <span className="text-[10px] font-mono opacity-70">
                        {isBn
                          ? pair.traditionalFood.portionLabelBn
                          : pair.traditionalFood.portionLabelEn}
                      </span>
                    </div>
                    <h4 className="text-sm sm:text-base font-extrabold leading-snug">
                      {isBn ? pair.traditionalFood.nameBn : pair.traditionalFood.nameEn}
                    </h4>
                    <p className="text-[11px] opacity-75">
                      {isBn
                        ? pair.traditionalFood.sourceStoreOrOriginBn
                        : pair.traditionalFood.sourceStoreOrOriginEn}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 tabular-nums">
                    <div className="grid grid-cols-5 gap-1.5 text-center">
                      <div className="p-1.5 rounded-lg bg-slate-500/10">
                        <span className="text-[9px] opacity-65 block">Kcal</span>
                        <span className="text-xs font-extrabold font-mono">
                          {pair.traditionalFood.caloriesKcal}
                        </span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <span className="text-[9px] opacity-75 block">
                          {isBn ? 'প্রোটিন' : 'Prot'}
                        </span>
                        <span className="text-xs font-extrabold font-mono">
                          {pair.traditionalFood.proteinGrams}g
                        </span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <span className="text-[9px] opacity-75 block">
                          {isBn ? 'শর্করা' : 'Carbs'}
                        </span>
                        <span className="text-xs font-extrabold font-mono">
                          {pair.traditionalFood.carbsGrams}g
                        </span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                        <span className="text-[9px] opacity-75 block">
                          {isBn ? 'ফাইবার' : 'Fiber'}
                        </span>
                        <span className="text-xs font-extrabold font-mono">
                          {pair.traditionalFood.fiberGrams}g
                        </span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <span className="text-[9px] opacity-75 block">GI</span>
                        <span className="text-xs font-extrabold font-mono">
                          {pair.traditionalFood.glycemicIndex}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] opacity-85">
                      <strong>{isBn ? 'প্রধান মাইক্রোনিউট্রিয়েন্ট:' : 'Key Micronutrients:'}</strong>{' '}
                      {isBn
                        ? pair.traditionalFood.keyMicronutrientsBn
                        : pair.traditionalFood.keyMicronutrientsEn}
                    </div>
                  </div>
                </div>

                {/* CENTER BRIDGE: 1:1 Nutritional Delta & Parity Indicator */}
                <div className="lg:col-span-2 flex flex-col items-center justify-center p-2 text-center gap-1.5 tabular-nums">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-sm">
                    1:1
                  </div>
                  <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">
                    {isBn ? 'সমতুল্য পুষ্টিমান' : 'Macro & GI Parity'}
                  </span>
                  <div className="text-[10px] font-mono opacity-75 space-y-0.5">
                    <div>
                      ΔProt:{' '}
                      {Math.abs(
                        pair.localSupermarketSubstitute.proteinGrams -
                          pair.traditionalFood.proteinGrams
                      ).toFixed(1)}
                      g
                    </div>
                    <div>
                      ΔGI:{' '}
                      {Math.abs(
                        pair.localSupermarketSubstitute.glycemicIndex -
                          pair.traditionalFood.glycemicIndex
                      )}
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Local Supermarket Substitute (Geo-Location Matched) */}
                <div
                  className={`lg:col-span-5 p-4 rounded-xl border space-y-3 flex flex-col justify-between ${
                    darkMode
                      ? 'bg-slate-900/90 border-indigo-700/60'
                      : 'bg-white border-indigo-200/90'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400">
                        <ShoppingBag className="w-3.5 h-3.5" />
                        {isBn
                          ? `${residenceProfile.flag} স্থানীয় সুপারমার্কেট বিকল্প`
                          : `${residenceProfile.flag} Local Supermarket Substitute`}
                      </span>
                      <span className="text-[10px] font-mono opacity-70">
                        {isBn
                          ? pair.localSupermarketSubstitute.portionLabelBn
                          : pair.localSupermarketSubstitute.portionLabelEn}
                      </span>
                    </div>
                    <h4 className="text-sm sm:text-base font-extrabold leading-snug text-indigo-700 dark:text-indigo-300">
                      {isBn
                        ? pair.localSupermarketSubstitute.nameBn
                        : pair.localSupermarketSubstitute.nameEn}
                    </h4>
                    <p className="text-[11px] opacity-80">
                      {isBn
                        ? pair.localSupermarketSubstitute.sourceStoreOrOriginBn
                        : pair.localSupermarketSubstitute.sourceStoreOrOriginEn}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 tabular-nums">
                    <div className="grid grid-cols-5 gap-1.5 text-center">
                      <div className="p-1.5 rounded-lg bg-slate-500/10">
                        <span className="text-[9px] opacity-65 block">Kcal</span>
                        <span className="text-xs font-extrabold font-mono">
                          {pair.localSupermarketSubstitute.caloriesKcal}
                        </span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <span className="text-[9px] opacity-75 block">
                          {isBn ? 'প্রোটিন' : 'Prot'}
                        </span>
                        <span className="text-xs font-extrabold font-mono">
                          {pair.localSupermarketSubstitute.proteinGrams}g
                        </span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <span className="text-[9px] opacity-75 block">
                          {isBn ? 'শর্করা' : 'Carbs'}
                        </span>
                        <span className="text-xs font-extrabold font-mono">
                          {pair.localSupermarketSubstitute.carbsGrams}g
                        </span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                        <span className="text-[9px] opacity-75 block">
                          {isBn ? 'ফাইবার' : 'Fiber'}
                        </span>
                        <span className="text-xs font-extrabold font-mono">
                          {pair.localSupermarketSubstitute.fiberGrams}g
                        </span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <span className="text-[9px] opacity-75 block">GI</span>
                        <span className="text-xs font-extrabold font-mono">
                          {pair.localSupermarketSubstitute.glycemicIndex}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] opacity-85">
                      <strong>{isBn ? 'প্রধান মাইক্রোনিউট্রিয়েন্ট:' : 'Key Micronutrients:'}</strong>{' '}
                      {isBn
                        ? pair.localSupermarketSubstitute.keyMicronutrientsBn
                        : pair.localSupermarketSubstitute.keyMicronutrientsEn}
                    </div>
                  </div>
                </div>
              </div>

              {/* Clinical Equivalence & Culinary Cooking Adaptation Footer */}
              <div
                className={`px-4 py-3 border-t text-xs grid grid-cols-1 md:grid-cols-2 gap-3 ${
                  darkMode
                    ? 'bg-slate-900/50 border-slate-800'
                    : 'bg-emerald-50/40 border-slate-200/80'
                }`}
              >
                <div>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">
                    ✓ {isBn ? 'ক্লিনিক্যাল পুষ্টি বিশ্লেষণ:' : 'Clinical Nutritional Equivalence:'}
                  </span>
                  <p className="opacity-85 leading-relaxed">
                    {isBn ? pair.clinicalParitySummaryBn : pair.clinicalParitySummaryEn}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-0.5">
                    👩‍🍳 {isBn ? 'দেশি স্বাদে রান্নার টিপস ও এথনিক স্টোর:' : 'Traditional Cooking Tip & Ethnic Store:'}
                  </span>
                  <p className="opacity-85 leading-relaxed">
                    {isBn ? pair.culinaryAdaptationTipBn : pair.culinaryAdaptationTipEn}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Live Geo-Location Seasonal Local Harvest Equivalence Section */}
          <div
            className={`p-4 rounded-2xl border space-y-3 ${
              darkMode
                ? 'bg-emerald-950/20 border-emerald-600/30'
                : 'bg-emerald-50/70 border-emerald-200'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-extrabold text-xs sm:text-sm text-emerald-700 dark:text-emerald-300">
                <Sprout className="w-4 h-4" />
                <span>
                  {isBn
                    ? `🌱 আপনার জিও-লোকেশনের মৌসুমি সবজি বনাম দেশি সমতুল্য (${localHarvestSnapshot.flag} ${localHarvestSnapshot.countryNameBn} — ${localHarvestSnapshot.activeSeasonNameBn})`
                    : `🌱 Geo-Matched In-Season Local Harvest vs. Traditional Equivalents (${localHarvestSnapshot.flag} ${localHarvestSnapshot.countryNameEn} — ${localHarvestSnapshot.activeSeasonNameEn})`}
                </span>
              </div>
              <span className="text-[11px] font-mono opacity-75">
                <Sparkles className="w-3 h-3 inline mr-1" />
                {isBn ? 'অফলাইন ক্যাশড ডাটাবেস' : 'Offline Cached Harvest DB'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs tabular-nums">
              {localHarvestSnapshot.prioritizedVegetables.map((veg) => (
                <div
                  key={veg.id}
                  className={`p-3 rounded-xl border space-y-1 ${
                    darkMode
                      ? 'bg-slate-900 border-slate-800'
                      : 'bg-white border-emerald-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      🌱 {isBn ? veg.nameBn : veg.nameEn}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                      GI {veg.glycemicIndex} · {veg.fiberPer100g}g Fiber
                    </span>
                  </div>
                  <div className="text-[11px] opacity-80">{veg.keyMicronutrients}</div>
                  <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium pt-0.5 border-t border-slate-200/60 dark:border-slate-800">
                    {isBn ? veg.heritageEquivalentBn : veg.heritageEquivalentEn}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NutritionalEquivalenceComparisonModal;
