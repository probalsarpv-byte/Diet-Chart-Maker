import React, { useState, useEffect } from 'react';
import {
  CrossBorderSubstitutionMode,
  HealthProfile,
  Language,
} from '../types';
import {
  GLOBAL_COUNTRIES_AND_CUISINES,
  getEffectiveResidenceAndCuisine,
  saveStoredCrossBorderPrefs,
} from '../services/crossBorderFoodEquivalenceService';
import { getLocalHarvestSnapshotForCountry } from '../services/localHarvestDatabaseService';
import { syncLocalHarvestDatabaseToServiceWorker } from '../services/offlineDietCacheService';
import {
  GLOBAL_SMART_CITY_PRESETS,
  SmartGeoLocationSnapshot,
  applyCityPresetSmartGeoLocation,
  detectLiveSmartGeoLocation,
  initPassiveSmartGeoLocation,
  loadSavedSmartGeoLocation,
} from '../services/smartGeoLocationService';
import {
  Globe,
  ShoppingBag,
  Utensils,
  ChevronDown,
  ChevronUp,
  Sprout,
  Database,
  LocateFixed,
  MapPin,
  CloudSun,
  Loader2,
  Scale,
} from 'lucide-react';
import NutritionalEquivalenceComparisonModal from './NutritionalEquivalenceComparisonModal';

interface Props {
  profile: HealthProfile | null;
  lang: Language;
  darkMode?: boolean;
  compact?: boolean;
  onUpdateProfile?: (updated: HealthProfile) => void;
  onPreferencesChanged?: (prefs: {
    residenceCountry: string;
    preferredCuisineCountry: string;
    supermarketSubstituteMode: CrossBorderSubstitutionMode;
  }) => void;
}

const CrossBorderCuisineBar: React.FC<Props> = ({
  profile,
  lang,
  darkMode,
  compact = false,
  onUpdateProfile,
  onPreferencesChanged,
}) => {
  const isBn = lang === 'bn';
  const effective = getEffectiveResidenceAndCuisine(profile);

  const [residenceCode, setResidenceCode] = useState<string>(effective.residenceCountry);
  const [cuisineCode, setCuisineCode] = useState<string>(effective.preferredCuisineCountry);
  const [subMode, setSubMode] = useState<CrossBorderSubstitutionMode>(
    effective.supermarketSubstituteMode
  );
  const [customResidenceInput, setCustomResidenceInput] = useState<string>('');
  const [customCuisineInput, setCustomCuisineInput] = useState<string>('');
  const [showEquivalenceDrawer, setShowEquivalenceDrawer] = useState<boolean>(false);
  const [showLocalHarvestDrawer, setShowLocalHarvestDrawer] = useState<boolean>(false);
  const [showSmartCityPins, setShowSmartCityPins] = useState<boolean>(false);
  const [showComparisonModal, setShowComparisonModal] = useState<boolean>(false);
  const [geoSnapshot, setGeoSnapshot] = useState<SmartGeoLocationSnapshot | null>(() =>
    loadSavedSmartGeoLocation()
  );
  const [isDetectingGeo, setIsDetectingGeo] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    initPassiveSmartGeoLocation().then((snap) => {
      if (active && snap) {
        setGeoSnapshot(snap);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const isCustomResidence =
    residenceCode === 'CUSTOM' ||
    !GLOBAL_COUNTRIES_AND_CUISINES.some((c) => c.code === residenceCode);
  const isCustomCuisine =
    cuisineCode === 'CUSTOM' ||
    !GLOBAL_COUNTRIES_AND_CUISINES.some((c) => c.code === cuisineCode);

  const applyChanges = (
    nextRes: string,
    nextCui: string,
    nextMode: CrossBorderSubstitutionMode,
    resolvedGeo?: SmartGeoLocationSnapshot
  ) => {
    setResidenceCode(nextRes);
    setCuisineCode(nextCui);
    setSubMode(nextMode);

    saveStoredCrossBorderPrefs({
      residenceCountry: nextRes,
      preferredCuisineCountry: nextCui,
      supermarketSubstituteMode: nextMode,
    });

    // Immediately sync the Local Harvest Seasonal Vegetable DB to the Service Worker cache
    syncLocalHarvestDatabaseToServiceWorker(nextRes).catch(() => {});

    if (!resolvedGeo) {
      applyCityPresetSmartGeoLocation(nextRes, nextCui)
        .then((snap) => setGeoSnapshot(snap))
        .catch(() => {});
    }

    if (profile && onUpdateProfile) {
      onUpdateProfile({
        ...profile,
        residenceCountry: nextRes,
        preferredCuisineCountry: nextCui,
        supermarketSubstituteMode: nextMode,
        location: resolvedGeo
          ? {
              latitude: resolvedGeo.latitude,
              longitude: resolvedGeo.longitude,
              cityNameBn: resolvedGeo.cityNameBn,
              cityNameEn: resolvedGeo.cityNameEn,
              countryCode: resolvedGeo.countryCode,
              countryNameBn: resolvedGeo.countryNameBn,
              countryNameEn: resolvedGeo.countryNameEn,
              timezone: resolvedGeo.timezone,
              detectedBy: resolvedGeo.detectedBy,
              updatedAt: resolvedGeo.updatedAt,
            }
          : profile.location,
      });
    }

    if (onPreferencesChanged) {
      onPreferencesChanged({
        residenceCountry: nextRes,
        preferredCuisineCountry: nextCui,
        supermarketSubstituteMode: nextMode,
      });
    }
  };

  const handleLiveGpsAutoDetect = async () => {
    setIsDetectingGeo(true);
    try {
      const snap = await detectLiveSmartGeoLocation(cuisineCode);
      setGeoSnapshot(snap);
      applyChanges(snap.countryCode, cuisineCode, subMode, snap);
    } finally {
      setIsDetectingGeo(false);
    }
  };

  const handleSelectSmartCityPin = async (presetId: string) => {
    setIsDetectingGeo(true);
    try {
      const snap = await applyCityPresetSmartGeoLocation(presetId, cuisineCode);
      setGeoSnapshot(snap);
      applyChanges(snap.countryCode, cuisineCode, subMode, snap);
    } finally {
      setIsDetectingGeo(false);
    }
  };

  const currentEffective = getEffectiveResidenceAndCuisine({
    ...(profile || ({} as HealthProfile)),
    residenceCountry: residenceCode,
    preferredCuisineCountry: cuisineCode,
    supermarketSubstituteMode: subMode,
  });

  const { residenceProfile, cuisineProfile, isCrossBorder } = currentEffective;
  const localHarvestSnapshot = getLocalHarvestSnapshotForCountry(residenceCode);

  const quickPresets = [
    {
      id: 'us-bd',
      labelBn: '🇺🇸 আমেরিকায় অবস্থান · 🇧🇩 বাংলাদেশী খাবার',
      labelEn: '🇺🇸 Living in USA · 🇧🇩 Bangladeshi Food',
      res: 'US',
      cui: 'BD',
    },
    {
      id: 'gb-bd',
      labelBn: '🇬🇧 যুক্তরাজ্যে অবস্থান · 🇧🇩 বাংলাদেশী খাবার',
      labelEn: '🇬🇧 Living in UK · 🇧🇩 Bangladeshi Food',
      res: 'GB',
      cui: 'BD',
    },
    {
      id: 'ca-bd',
      labelBn: '🇨🇦 কানাডায় অবস্থান · 🇧🇩 বাংলাদেশী খাবার',
      labelEn: '🇨🇦 Living in Canada · 🇧🇩 Bangladeshi Food',
      res: 'CA',
      cui: 'BD',
    },
    {
      id: 'ae-bd',
      labelBn: '🇦🇪 মধ্যপ্রাচ্যে অবস্থান · 🇧🇩 বাংলাদেশী খাবার',
      labelEn: '🇦🇪 Living in UAE/GCC · 🇧🇩 Bangladeshi Food',
      res: 'AE',
      cui: 'BD',
    },
    {
      id: 'au-bd',
      labelBn: '🇦🇺 অস্ট্রেলিয়ায় অবস্থান · 🇧🇩 বাংলাদেশী খাবার',
      labelEn: '🇦🇺 Living in Australia · 🇧🇩 Bangladeshi Food',
      res: 'AU',
      cui: 'BD',
    },
    {
      id: 'bd-bd',
      labelBn: '🇧🇩 বাংলাদেশে অবস্থান · 🇧🇩 দেশি খাবার',
      labelEn: '🇧🇩 Living in Bangladesh · 🇧🇩 Deshi Food',
      res: 'BD',
      cui: 'BD',
    },
  ];

  return (
    <div
      className={`p-4 md:p-5 rounded-2xl border transition-all space-y-4 ${
        darkMode
          ? 'bg-slate-900 border-slate-800 text-slate-100'
          : 'bg-white border-slate-200 text-slate-900 shadow-xs'
      }`}
    >
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-3 border-slate-200/70 dark:border-slate-800">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <Globe className="w-4 h-4 shrink-0" />
            <span>
              {isBn
                ? 'স্মার্ট জিও-লোকেশন ও গ্লোবাল খাবার সমন্বয় ইঞ্জিন (প্রবাসী ও যেকোনো দেশের ইউজারদের জন্য)'
                : 'Smart Geo-Location & Global Food Heritage Engine'}
            </span>
          </div>
          <p className="text-xs opacity-75">
            {isBn
              ? 'জিপিএস/টাইমজোন থেকে আপনার বর্তমান শহর, আবহাওয়া ও মৌসুমি সবজি শনাক্ত হবে—কিন্তু পছন্দের খাবারের দেশ অপরিবর্তিত থাকবে।'
              : 'Auto-detects your live city, climate & local seasonal harvest while preserving your preferred dietary heritage.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleLiveGpsAutoDetect}
            disabled={isDetectingGeo}
            className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs flex items-center gap-1.5 whitespace-nowrap transition-all active:scale-95 disabled:opacity-60"
          >
            {isDetectingGeo ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LocateFixed className="w-3.5 h-3.5" />
            )}
            <span>
              {isBn
                ? isDetectingGeo
                  ? 'লোকেশন শনাক্ত হচ্ছে...'
                  : '📍 অটো-ডিটেক্ট স্মার্ট লোকেশন'
                : isDetectingGeo
                ? 'Detecting Geo...'
                : '📍 Smart Geo Auto-Detect'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowComparisonModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-all active:scale-95"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>
              {isBn
                ? '⚖️ ১:১ পুষ্টি সমতা তুলনা (Side-by-Side)'
                : '⚖️ Compare Nutritional Equivalence'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowEquivalenceDrawer(!showEquivalenceDrawer)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
              darkMode
                ? 'bg-slate-800 border-slate-700 text-emerald-300 hover:bg-slate-700'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>
              {isBn
                ? 'সুপারমার্কেট সমতুল্য খাবারের তালিকা'
                : 'Supermarket Equivalent Guide'}
            </span>
            {showEquivalenceDrawer ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Smart Geo-Location Live Telemetry & City Pin Strip */}
      {geoSnapshot && (
        <div
          className={`p-3 rounded-xl border text-xs space-y-2 tabular-nums ${
            darkMode
              ? 'bg-slate-800/60 border-indigo-500/30 text-slate-200'
              : 'bg-indigo-50/50 border-indigo-200/80 text-slate-800'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-extrabold bg-indigo-600 text-white text-[11px]">
                <MapPin className="w-3 h-3" />
                {geoSnapshot.flag}{' '}
                {isBn ? geoSnapshot.cityNameBn : geoSnapshot.cityNameEn},{' '}
                {isBn ? geoSnapshot.countryNameBn : geoSnapshot.countryNameEn}
              </span>

              <span className="px-2 py-0.5 rounded-md font-mono text-[10px] bg-slate-500/10 border border-slate-500/20">
                {geoSnapshot.latitude.toFixed(2)}°, {geoSnapshot.longitude.toFixed(2)}° ·{' '}
                {geoSnapshot.timezone}
              </span>

              <span
                className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                  geoSnapshot.detectedBy === 'gps_live'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                }`}
              >
                {geoSnapshot.detectedBy === 'gps_live'
                  ? isBn
                    ? '✓ লাইভ GPS ভেরিফাইড'
                    : '✓ Live GPS Verified'
                  : geoSnapshot.detectedBy === 'timezone_smart'
                  ? isBn
                    ? '⚡ স্মার্ট টাইমজোন ডিটেক্টেড'
                    : '⚡ Smart Timezone Auto-Inferred'
                  : isBn
                  ? '📌 নির্বাচিত সিটি পিন'
                  : '📌 Selected City Pin'}
              </span>

              {geoSnapshot.weather && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10px] bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30">
                  <CloudSun className="w-3 h-3" />
                  {geoSnapshot.weather.temp}°C · {geoSnapshot.weather.humidity}% RH · AQI{' '}
                  {geoSnapshot.weather.aqi}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowSmartCityPins(!showSmartCityPins)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1 shrink-0 transition-colors ${
                darkMode
                  ? 'bg-slate-900 border-slate-700 text-indigo-300 hover:bg-slate-800'
                  : 'bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50'
              }`}
            >
              <span>{isBn ? 'শহর পরিবর্তন / সিটি পিন' : 'Switch City Pin'}</span>
              {showSmartCityPins ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          </div>

          {showSmartCityPins && (
            <div className="pt-2 border-t border-indigo-200/60 dark:border-slate-700 flex flex-wrap gap-1.5 animate-in fade-in duration-200">
              {GLOBAL_SMART_CITY_PRESETS.map((city) => {
                const isSelectedCity =
                  Math.abs(geoSnapshot.latitude - city.latitude) < 0.5 &&
                  Math.abs(geoSnapshot.longitude - city.longitude) < 0.5;
                return (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => handleSelectSmartCityPin(city.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                      isSelectedCity
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : darkMode
                        ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {city.flag} {isBn ? city.cityNameBn : city.cityNameEn}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Quick Presets Bar */}
      {!compact && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          <span className="text-[11px] font-bold opacity-60 whitespace-nowrap mr-1">
            {isBn ? 'কুইক প্রিসেট:' : 'Quick Presets:'}
          </span>
          {quickPresets.map((preset) => {
            const isActive =
              residenceCode === preset.res && cuisineCode === preset.cui;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyChanges(preset.res, preset.cui, subMode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-colors border ${
                  isActive
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : darkMode
                    ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {isBn ? preset.labelBn : preset.labelEn}
              </button>
            );
          })}
        </div>
      )}

      {/* Dual Independent Selectors: 1. Current Residence Country | 2. Preferred Dietary Cuisine */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Selector 1: Current Country of Residence */}
        <div
          className={`p-3.5 rounded-xl border space-y-2 ${
            darkMode
              ? 'bg-slate-800/50 border-slate-700'
              : 'bg-slate-50/80 border-slate-200/80'
          }`}
        >
          <label className="block text-xs font-bold text-indigo-600 dark:text-indigo-400">
            🌍{' '}
            {isBn
              ? '১. বর্তমান অবস্থানরত দেশ (আবহাওয়া ও সুপারমার্কেট)'
              : '1. Current Country of Residence (Climate & Supermarkets)'}
          </label>
          <select
            value={isCustomResidence ? 'CUSTOM' : residenceCode}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'CUSTOM') {
                setResidenceCode('CUSTOM');
              } else {
                applyChanges(val, cuisineCode, subMode);
              }
            }}
            className={`w-full px-3 py-2 rounded-lg border text-xs font-bold outline-none ${
              darkMode
                ? 'bg-slate-900 border-slate-700 text-white'
                : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            {GLOBAL_COUNTRIES_AND_CUISINES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {isBn ? c.countryNameBn : c.countryNameEn}
              </option>
            ))}
            <option value="CUSTOM">
              🌍 {isBn ? 'অন্যান্য দেশ (নিজে লিখুন)...' : 'Other Country (Type Custom)...'}
            </option>
          </select>

          {isCustomResidence && (
            <div className="flex gap-1.5 pt-1">
              <input
                type="text"
                value={customResidenceInput}
                onChange={(e) => setCustomResidenceInput(e.target.value)}
                placeholder={
                  isBn ? 'দেশের নাম লিখুন (যেমন: Sweden, Qatar)' : 'Enter country (e.g. Sweden)'
                }
                className={`flex-1 px-2.5 py-1.5 rounded-lg border text-xs ${
                  darkMode
                    ? 'bg-slate-900 border-slate-700 text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
              <button
                type="button"
                onClick={() => {
                  if (customResidenceInput.trim()) {
                    applyChanges(customResidenceInput.trim(), cuisineCode, subMode);
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold shrink-0"
              >
                {isBn ? 'সেট' : 'Set'}
              </button>
            </div>
          )}

          <p className="text-[11px] opacity-70 leading-snug">
            {isBn
              ? `স্থানীয় স্টোর: ${residenceProfile.mainstreamSupermarketsBn}`
              : `Local Stores: ${residenceProfile.mainstreamSupermarketsEn}`}
          </p>
        </div>

        {/* Selector 2: Preferred Dietary Cuisine / Food Country */}
        <div
          className={`p-3.5 rounded-xl border space-y-2 ${
            darkMode
              ? 'bg-slate-800/50 border-slate-700'
              : 'bg-slate-50/80 border-slate-200/80'
          }`}
        >
          <label className="block text-xs font-bold text-emerald-600 dark:text-emerald-400">
            🍲{' '}
            {isBn
              ? '২. পছন্দের খাবারের দেশ (কোন দেশের খাবার দিয়ে ডায়েট করবেন)'
              : '2. Preferred Food Country / Dietary Cuisine'}
          </label>
          <select
            value={isCustomCuisine ? 'CUSTOM' : cuisineCode}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'CUSTOM') {
                setCuisineCode('CUSTOM');
              } else {
                applyChanges(residenceCode, val, subMode);
              }
            }}
            className={`w-full px-3 py-2 rounded-lg border text-xs font-bold outline-none ${
              darkMode
                ? 'bg-slate-900 border-slate-700 text-white'
                : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            {GLOBAL_COUNTRIES_AND_CUISINES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {isBn ? c.cuisineNameBn : c.cuisineNameEn}
              </option>
            ))}
            <option value="CUSTOM">
              🍲 {isBn ? 'অন্যান্য কুইজিন (নিজে লিখুন)...' : 'Other Cuisine (Type Custom)...'}
            </option>
          </select>

          {isCustomCuisine && (
            <div className="flex gap-1.5 pt-1">
              <input
                type="text"
                value={customCuisineInput}
                onChange={(e) => setCustomCuisineInput(e.target.value)}
                placeholder={
                  isBn ? 'কুইজিনের নাম লিখুন (যেমন: Thai, Turkish)' : 'Enter cuisine (e.g. Turkish)'
                }
                className={`flex-1 px-2.5 py-1.5 rounded-lg border text-xs ${
                  darkMode
                    ? 'bg-slate-900 border-slate-700 text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
              <button
                type="button"
                onClick={() => {
                  if (customCuisineInput.trim()) {
                    applyChanges(residenceCode, customCuisineInput.trim(), subMode);
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold shrink-0"
              >
                {isBn ? 'সেট' : 'Set'}
              </button>
            </div>
          )}

          <p className="text-[11px] opacity-70 leading-snug">
            {isBn
              ? `ডায়েট মেনু: ${cuisineProfile.cuisineNameBn} অনুযায়ী তৈরি হবে`
              : `Diet Menu built around: ${cuisineProfile.cuisineNameEn}`}
          </p>
        </div>

        {/* Selector 3: Supermarket Substitution Mode */}
        <div
          className={`p-3.5 rounded-xl border space-y-2 ${
            darkMode
              ? 'bg-slate-800/50 border-slate-700'
              : 'bg-slate-50/80 border-slate-200/80'
          }`}
        >
          <label className="block text-xs font-bold text-amber-600 dark:text-amber-400">
            🛒{' '}
            {isBn
              ? '৩. স্থানীয় সুপারমার্কেট বিকল্প মোড'
              : '3. Local Supermarket Substitute Mode'}
          </label>
          <select
            value={subMode}
            onChange={(e) =>
              applyChanges(
                residenceCode,
                cuisineCode,
                e.target.value as CrossBorderSubstitutionMode
              )
            }
            className={`w-full px-3 py-2 rounded-lg border text-xs font-bold outline-none ${
              darkMode
                ? 'bg-slate-900 border-slate-700 text-white'
                : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <option value="show_equivalents">
              {isBn
                ? 'দেশি খাবার + স্থানীয় সুপারমার্কেটের সমতুল্য বিকল্প (Recommended)'
                : 'Heritage Food + Local Supermarket Equivalent (Recommended)'}
            </option>
            <option value="ethnic_frozen_only">
              {isBn
                ? 'শুধুমাত্র খাঁটি দেশি খাবার ও এথনিক/ফ্রোজেন স্টোর গাইড'
                : 'Authentic Heritage Food + Ethnic/Frozen Store Guide Only'}
            </option>
            <option value="hybrid">
              {isBn
                ? 'হাইব্রিড মোড (সকালে স্থানীয় কুইক খাবার · দুপুর ও রাতে দেশি খাবার)'
                : 'Hybrid Mode (Local Quick Breakfast · Heritage Lunch & Dinner)'}
            </option>
          </select>

          <p className="text-[11px] opacity-70 leading-snug">
            {isCrossBorder
              ? isBn
                ? `✓ ক্রস-বর্ডার মোড সক্রিয়: ${residenceProfile.countryNameBn}-এর বাজারে ${cuisineProfile.cuisineNameBn}-এর সমতুল্য বিকল্প দেখানো হচ্ছে`
                : `✓ Cross-Border Active: Showing ${residenceProfile.countryNameEn} supermarket equivalents for ${cuisineProfile.cuisineNameEn}`
              : isBn
              ? 'অবস্থান এবং খাবারের দেশ একই রয়েছে। প্রবাসে থাকলে উপরের দুটি অপশন আলাদা সিলেক্ট করুন।'
              : 'Residence and cuisine country match. Select different countries above if living abroad.'}
          </p>
        </div>
      </div>

      {/* Active Cross-Border Climate & Supermarket Status Strip */}
      {isCrossBorder && (
        <div
          className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
            darkMode
              ? 'bg-indigo-950/30 border-indigo-500/30 text-indigo-200'
              : 'bg-indigo-50/70 border-indigo-200 text-indigo-950'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 font-bold">
            <span>
              {residenceProfile.flag}{' '}
              {isBn ? residenceProfile.countryNameBn : residenceProfile.countryNameEn}
              {'  ·  '}
              {cuisineProfile.flag}{' '}
              {isBn ? cuisineProfile.cuisineNameBn : cuisineProfile.cuisineNameEn}
            </span>
            <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
              {isBn
                ? '১:১ পুষ্টি ও গ্লাইসেমিক সমতা সক্রিয় (Macro & GI Matched)'
                : '1:1 Nutritional & Glycemic Parity Active'}
            </span>
          </div>
          <p className="opacity-85 leading-relaxed">
            <strong>{isBn ? 'আবহাওয়া ও মেটাবলিক সমন্বয়:' : 'Climate & Metabolic Sync:'}</strong>{' '}
            {isBn
              ? residenceProfile.climateMetabolicNoteBn
              : residenceProfile.climateMetabolicNoteEn}
          </p>
        </div>
      )}

      {/* Local Harvest Seasonal Vegetables Strip (Prioritized by Current Country & Cached Offline) */}
      <div
        className={`p-3.5 rounded-xl border text-xs space-y-2.5 ${
          darkMode
            ? 'bg-emerald-950/25 border-emerald-500/30 text-emerald-100'
            : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2 font-bold text-emerald-700 dark:text-emerald-300">
              <Sprout className="w-4 h-4 shrink-0" />
              <span>
                {isBn
                  ? `🌱 লোকাল হারভেস্ট সিজনাল সবজি (${localHarvestSnapshot.flag} ${localHarvestSnapshot.countryNameBn} — ${localHarvestSnapshot.activeSeasonNameBn})`
                  : `🌱 Local Harvest Seasonal Vegetables (${localHarvestSnapshot.flag} ${localHarvestSnapshot.countryNameEn} — ${localHarvestSnapshot.activeSeasonNameEn})`}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                <Database className="w-3 h-3" />
                {isBn ? 'অফলাইন ক্যাশড ডাটাবেস' : 'Cached Offline DB'}
              </span>
            </div>
            <p className="text-[11px] opacity-85">
              {isBn
                ? localHarvestSnapshot.harvestHighlightBn
                : localHarvestSnapshot.harvestHighlightEn}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowLocalHarvestDrawer(!showLocalHarvestDrawer)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
              darkMode
                ? 'bg-slate-900 border-emerald-700 text-emerald-300 hover:bg-slate-800'
                : 'bg-white border-emerald-300 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <Sprout className="w-3.5 h-3.5" />
            <span>
              {isBn
                ? `মৌসুমি সবজি তালিকা (${localHarvestSnapshot.prioritizedVegetables.length})`
                : `In-Season Produce (${localHarvestSnapshot.prioritizedVegetables.length})`}
            </span>
            {showLocalHarvestDrawer ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Quick In-Season Vegetable Pills */}
        <div className="flex flex-wrap gap-1.5">
          {localHarvestSnapshot.prioritizedVegetables.slice(0, 6).map((veg) => (
            <span
              key={veg.id}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border tabular-nums ${
                darkMode
                  ? 'bg-slate-900/90 border-emerald-800/70 text-emerald-200'
                  : 'bg-white border-emerald-200 text-emerald-900'
              }`}
            >
              🌱 {isBn ? veg.nameBn : veg.nameEn}{' '}
              <span className="font-mono text-[10px] opacity-75">
                (GI {veg.glycemicIndex} · {veg.fiberPer100g}g fiber)
              </span>
            </span>
          ))}
        </div>

        {/* Expandable Full Local Harvest Database Drawer */}
        {showLocalHarvestDrawer && (
          <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 animate-in fade-in duration-200">
            {localHarvestSnapshot.prioritizedVegetables.map((veg) => (
              <div
                key={veg.id}
                className={`p-3 rounded-xl border space-y-1 tabular-nums ${
                  darkMode
                    ? 'bg-slate-900 border-slate-800 text-slate-100'
                    : 'bg-white border-emerald-200/80 text-slate-900'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-bold text-emerald-600 dark:text-emerald-400">
                    🌱 {isBn ? veg.nameBn : veg.nameEn}
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shrink-0">
                    GI {veg.glycemicIndex}
                  </span>
                </div>
                <div className="text-[11px] font-mono opacity-75">
                  {veg.localMarketName} · {veg.fiberPer100g}g Fiber/100g
                </div>
                <p className="text-[11px] opacity-85 leading-snug">
                  <strong>{isBn ? 'পুষ্টিগুণ:' : 'Nutrients:'}</strong>{' '}
                  {veg.keyMicronutrients}
                </p>
                <p className="text-[11px] text-indigo-600 dark:text-indigo-400 leading-snug">
                  <strong>{isBn ? 'দেশি সমতুল্য:' : 'Heritage Swap:'}</strong>{' '}
                  {isBn ? veg.heritageEquivalentBn : veg.heritageEquivalentEn}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expandable 1:1 Supermarket Equivalence Cheat-Sheet Drawer */}
      {showEquivalenceDrawer && (
        <div
          className={`p-4 rounded-xl border space-y-3 animate-in fade-in duration-200 ${
            darkMode
              ? 'bg-slate-800/70 border-slate-700'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2.5 border-slate-200/70 dark:border-slate-700">
            <div>
              <h4 className="text-xs md:text-sm font-bold flex items-center gap-1.5">
                <Utensils className="w-4 h-4 text-emerald-500" />
                {isBn
                  ? `${cuisineProfile.cuisineNameBn}-এর পরিবর্তে ${residenceProfile.countryNameBn}-এর সুপারমার্কেটে কী কিনবেন?`
                  : `What to Buy in ${residenceProfile.countryNameEn} Supermarkets for ${cuisineProfile.cuisineNameEn}`}
              </h4>
              <p className="text-[11px] opacity-70 mt-0.5">
                {isBn
                  ? `মেইনস্ট্রিম সুপারমার্কেট (${residenceProfile.mainstreamSupermarketsBn}) ও এথনিক স্টোর (${residenceProfile.ethnicStoresBn})`
                  : `Mainstream Stores (${residenceProfile.mainstreamSupermarketsEn}) & Ethnic Grocers (${residenceProfile.ethnicStoresEn})`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
            {[
              {
                titleBn: '🐟 মাছ ও প্রোটিন (Fish & Protein)',
                titleEn: '🐟 Fish & Lean Protein',
                valBn: residenceProfile.stapleSubstitutes.fishAndProteinBn,
                valEn: residenceProfile.stapleSubstitutes.fishAndProteinEn,
              },
              {
                titleBn: '🌾 চাল, রুটি ও শর্করা (Grains & Carbs)',
                titleEn: '🌾 Unpolished Rice, Bread & Oats',
                valBn: residenceProfile.stapleSubstitutes.grainsAndCarbsBn,
                valEn: residenceProfile.stapleSubstitutes.grainsAndCarbsEn,
              },
              {
                titleBn: '🥬 শাক ও পাতা জাতীয় সবজি (Leafy Greens)',
                titleEn: '🥬 Leafy Greens & Cruciferous',
                valBn: residenceProfile.stapleSubstitutes.greensAndVegBn,
                valEn: residenceProfile.stapleSubstitutes.greensAndVegEn,
              },
              {
                titleBn: '🥒 লাউ, পেঁপে ও সবজি (Gourds & Squash)',
                titleEn: '🥒 Gourds, Squash & Low-GI Veg',
                valBn: residenceProfile.stapleSubstitutes.gourdsAndSquashBn,
                valEn: residenceProfile.stapleSubstitutes.gourdsAndSquashEn,
              },
              {
                titleBn: '🥣 ডাল ও লেগিউম (Lentils & Beans)',
                titleEn: '🥣 Lentils, Dal & Legumes',
                valBn: residenceProfile.stapleSubstitutes.lentilsAndLegumesBn,
                valEn: residenceProfile.stapleSubstitutes.lentilsAndLegumesEn,
              },
              {
                titleBn: '🥛 টক দই, ঘি ও তেল (Probiotics & Oils)',
                titleEn: '🥛 Probiotic Yogurt, Ghee & Healthy Oils',
                valBn: residenceProfile.stapleSubstitutes.oilsAndProbioticsBn,
                valEn: residenceProfile.stapleSubstitutes.oilsAndProbioticsEn,
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border space-y-1 ${
                  darkMode
                    ? 'bg-slate-900 border-slate-700'
                    : 'bg-white border-slate-200/80'
                }`}
              >
                <div className="font-bold text-emerald-600 dark:text-emerald-400">
                  {isBn ? item.titleBn : item.titleEn}
                </div>
                <p className="text-[11px] opacity-85 leading-relaxed">
                  {isBn ? item.valBn : item.valEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Side-by-Side Nutritional Equivalence Comparison Modal */}
      {showComparisonModal && (
        <NutritionalEquivalenceComparisonModal
          isOpen={showComparisonModal}
          onClose={() => setShowComparisonModal(false)}
          residenceCountryCode={residenceCode}
          preferredCuisineCode={cuisineCode}
          geoSnapshot={geoSnapshot}
          lang={lang}
          darkMode={darkMode}
          onGeoLocationUpdated={(nextGeo) => {
            setGeoSnapshot(nextGeo);
            applyChanges(nextGeo.countryCode, cuisineCode, subMode, nextGeo);
          }}
        />
      )}
    </div>
  );
};

export default CrossBorderCuisineBar;
