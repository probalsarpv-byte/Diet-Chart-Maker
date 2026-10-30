import { WeatherData } from '../types';
import { WeatherService } from './weatherService';
import {
  getEffectiveResidenceAndCuisine,
  getCountryCuisineProfile,
  saveStoredCrossBorderPrefs,
} from './crossBorderFoodEquivalenceService';
import { syncLocalHarvestDatabaseToServiceWorker } from './offlineDietCacheService';

export type GeoDetectionSource =
  | 'gps_live'
  | 'timezone_smart'
  | 'manual_city'
  | 'cached_offline';

export interface SmartGeoCityPreset {
  id: string;
  cityNameBn: string;
  cityNameEn: string;
  countryCode: string;
  countryNameBn: string;
  countryNameEn: string;
  flag: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface SmartGeoLocationSnapshot {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  cityNameBn: string;
  cityNameEn: string;
  regionState?: string;
  countryCode: string;
  countryNameBn: string;
  countryNameEn: string;
  flag: string;
  timezone: string;
  hemisphere: 'Northern' | 'Southern' | 'Tropical';
  detectedBy: GeoDetectionSource;
  weather?: WeatherData;
  updatedAt: string;
}

const SMART_GEO_STORAGE_KEY = 'precision_smart_geolocation_v1';

export const GLOBAL_SMART_CITY_PRESETS: SmartGeoCityPreset[] = [
  {
    id: 'dhaka-bd',
    cityNameBn: 'ঢাকা',
    cityNameEn: 'Dhaka',
    countryCode: 'BD',
    countryNameBn: 'বাংলাদেশ',
    countryNameEn: 'Bangladesh',
    flag: '🇧🇩',
    latitude: 23.8103,
    longitude: 90.4125,
    timezone: 'Asia/Dhaka',
  },
  {
    id: 'chattogram-bd',
    cityNameBn: 'চট্টগ্রাম',
    cityNameEn: 'Chattogram',
    countryCode: 'BD',
    countryNameBn: 'বাংলাদেশ',
    countryNameEn: 'Bangladesh',
    flag: '🇧🇩',
    latitude: 22.3569,
    longitude: 91.7832,
    timezone: 'Asia/Dhaka',
  },
  {
    id: 'newyork-us',
    cityNameBn: 'নিউ ইয়র্ক (জ্যাকসন হাইটস/কুইন্স)',
    cityNameEn: 'New York (Queens/NYC)',
    countryCode: 'US',
    countryNameBn: 'আমেরিকা (USA)',
    countryNameEn: 'United States (USA)',
    flag: '🇺🇸',
    latitude: 40.7128,
    longitude: -74.006,
    timezone: 'America/New_York',
  },
  {
    id: 'losangeles-us',
    cityNameBn: 'লস অ্যাঞ্জেলেস, ক্যালিফোর্নিয়া',
    cityNameEn: 'Los Angeles, CA',
    countryCode: 'US',
    countryNameBn: 'আমেরিকা (USA)',
    countryNameEn: 'United States (USA)',
    flag: '🇺🇸',
    latitude: 34.0522,
    longitude: -118.2437,
    timezone: 'America/Los_Angeles',
  },
  {
    id: 'london-gb',
    cityNameBn: 'লন্ডন (টাওয়ার হ্যামলেটস)',
    cityNameEn: 'London (East London)',
    countryCode: 'GB',
    countryNameBn: 'যুক্তরাজ্য (UK)',
    countryNameEn: 'United Kingdom (UK)',
    flag: '🇬🇧',
    latitude: 51.5072,
    longitude: -0.1276,
    timezone: 'Europe/London',
  },
  {
    id: 'toronto-ca',
    cityNameBn: 'টরন্টো (ড্যানফোর্থ)',
    cityNameEn: 'Toronto (Danforth)',
    countryCode: 'CA',
    countryNameBn: 'কানাডা',
    countryNameEn: 'Canada',
    flag: '🇨🇦',
    latitude: 43.6532,
    longitude: -79.3832,
    timezone: 'America/Toronto',
  },
  {
    id: 'dubai-ae',
    cityNameBn: 'দুবাই / আবুধাবি',
    cityNameEn: 'Dubai / Abu Dhabi',
    countryCode: 'AE',
    countryNameBn: 'সংযুক্ত আরব আমিরাত ও মধ্যপ্রাচ্য',
    countryNameEn: 'UAE & Middle East (GCC)',
    flag: '🇦🇪',
    latitude: 25.2048,
    longitude: 55.2708,
    timezone: 'Asia/Dubai',
  },
  {
    id: 'sydney-au',
    cityNameBn: 'সিডনি / মেলবোর্ন',
    cityNameEn: 'Sydney / Melbourne',
    countryCode: 'AU',
    countryNameBn: 'অস্ট্রেলিয়া',
    countryNameEn: 'Australia',
    flag: '🇦🇺',
    latitude: -33.8688,
    longitude: 151.2093,
    timezone: 'Australia/Sydney',
  },
  {
    id: 'kolkata-in',
    cityNameBn: 'কলকাতা / দিল্লি',
    cityNameEn: 'Kolkata / New Delhi',
    countryCode: 'IN',
    countryNameBn: 'ভারত',
    countryNameEn: 'India',
    flag: '🇮🇳',
    latitude: 22.5726,
    longitude: 88.3639,
    timezone: 'Asia/Kolkata',
  },
  {
    id: 'berlin-eu',
    cityNameBn: 'বার্লিন / প্যারিস / রোম',
    cityNameEn: 'Berlin / Paris / Rome',
    countryCode: 'EU',
    countryNameBn: 'ইউরোপ (EU)',
    countryNameEn: 'Europe (EU)',
    flag: '🇪🇺',
    latitude: 52.52,
    longitude: 13.405,
    timezone: 'Europe/Berlin',
  },
  {
    id: 'tokyo-ea',
    cityNameBn: 'টোকিও / সিঙ্গাপুর / কুয়ালালামপুর',
    cityNameEn: 'Tokyo / Singapore / KL',
    countryCode: 'EA',
    countryNameBn: 'পূর্ব ও দক্ষিণ-পূর্ব এশিয়া',
    countryNameEn: 'East & Southeast Asia',
    flag: '🌏',
    latitude: 35.6762,
    longitude: 139.6503,
    timezone: 'Asia/Tokyo',
  },
];

function getHemisphereForLatitude(lat: number, countryCode: string): 'Northern' | 'Southern' | 'Tropical' {
  if (countryCode === 'BD' || countryCode === 'IN' || (lat >= -23.5 && lat <= 26.5)) {
    return 'Tropical';
  }
  return lat < 0 ? 'Southern' : 'Northern';
}

/**
 * Offline-capable Coordinate Bounding Box & Nearest City Resolver
 * Resolves country code and nearest city from latitude & longitude even without internet.
 */
export function resolveLocationFromCoordinatesOffline(
  lat: number,
  lng: number
): {
  cityNameBn: string;
  cityNameEn: string;
  countryCode: string;
  countryNameBn: string;
  countryNameEn: string;
  flag: string;
  timezone: string;
} {
  // 1. Check distance to known global presets first
  let closestPreset = GLOBAL_SMART_CITY_PRESETS[0];
  let minDistanceSq = Number.POSITIVE_INFINITY;

  for (const preset of GLOBAL_SMART_CITY_PRESETS) {
    const dLat = lat - preset.latitude;
    const dLng = lng - preset.longitude;
    const distSq = dLat * dLat + dLng * dLng;
    if (distSq < minDistanceSq) {
      minDistanceSq = distSq;
      closestPreset = preset;
    }
  }

  // If within ~8 degrees (~850 km) of a known preset, use its country and city
  if (minDistanceSq <= 64) {
    return {
      cityNameBn: closestPreset.cityNameBn,
      cityNameEn: closestPreset.cityNameEn,
      countryCode: closestPreset.countryCode,
      countryNameBn: closestPreset.countryNameBn,
      countryNameEn: closestPreset.countryNameEn,
      flag: closestPreset.flag,
      timezone: closestPreset.timezone,
    };
  }

  // 2. Broad Geographic Bounding Boxes
  // Bangladesh
  if (lat >= 20.5 && lat <= 26.7 && lng >= 88.0 && lng <= 92.7) {
    return {
      cityNameBn: 'ঢাকা অঞ্চল',
      cityNameEn: 'Dhaka Region',
      countryCode: 'BD',
      countryNameBn: 'বাংলাদেশ',
      countryNameEn: 'Bangladesh',
      flag: '🇧🇩',
      timezone: 'Asia/Dhaka',
    };
  }
  // India
  if (lat >= 8.0 && lat <= 35.5 && lng >= 68.0 && lng <= 97.4) {
    return {
      cityNameBn: 'ভারত অঞ্চল',
      cityNameEn: 'India Region',
      countryCode: 'IN',
      countryNameBn: 'ভারত',
      countryNameEn: 'India',
      flag: '🇮🇳',
      timezone: 'Asia/Kolkata',
    };
  }
  // Canada
  if (lat >= 43.0 && lat <= 75.0 && lng >= -141.0 && lng <= -52.0) {
    return {
      cityNameBn: 'টরন্টো / কানাডা অঞ্চল',
      cityNameEn: 'Canada Region',
      countryCode: 'CA',
      countryNameBn: 'কানাডা',
      countryNameEn: 'Canada',
      flag: '🇨🇦',
      timezone: 'America/Toronto',
    };
  }
  // USA
  if (lat >= 24.0 && lat <= 49.5 && lng >= -125.0 && lng <= -66.0) {
    return {
      cityNameBn: 'আমেরিকা (USA) অঞ্চল',
      cityNameEn: 'United States Region',
      countryCode: 'US',
      countryNameBn: 'আমেরিকা (USA)',
      countryNameEn: 'United States (USA)',
      flag: '🇺🇸',
      timezone: 'America/New_York',
    };
  }
  // UK & Ireland
  if (lat >= 49.9 && lat <= 60.9 && lng >= -8.6 && lng <= 1.8) {
    return {
      cityNameBn: 'লন্ডন / যুক্তরাজ্য অঞ্চল',
      cityNameEn: 'United Kingdom Region',
      countryCode: 'GB',
      countryNameBn: 'যুক্তরাজ্য (UK)',
      countryNameEn: 'United Kingdom (UK)',
      flag: '🇬🇧',
      timezone: 'Europe/London',
    };
  }
  // UAE & GCC Middle East
  if (lat >= 16.0 && lat <= 32.0 && lng >= 34.5 && lng <= 60.0) {
    return {
      cityNameBn: 'মধ্যপ্রাচ্য / দুবাই অঞ্চল',
      cityNameEn: 'GCC / Middle East Region',
      countryCode: 'AE',
      countryNameBn: 'সংযুক্ত আরব আমিরাত ও মধ্যপ্রাচ্য',
      countryNameEn: 'UAE & Middle East (GCC)',
      flag: '🇦🇪',
      timezone: 'Asia/Dubai',
    };
  }
  // Europe
  if (lat >= 35.0 && lat <= 70.0 && lng >= -10.0 && lng <= 35.0) {
    return {
      cityNameBn: 'ইউরোপ অঞ্চল',
      cityNameEn: 'European Region',
      countryCode: 'EU',
      countryNameBn: 'ইউরোপ (EU)',
      countryNameEn: 'Europe (EU)',
      flag: '🇪🇺',
      timezone: 'Europe/Berlin',
    };
  }
  // Australia & NZ
  if (lat >= -47.0 && lat <= -10.0 && lng >= 112.0 && lng <= 179.0) {
    return {
      cityNameBn: 'অস্ট্রেলিয়া অঞ্চল',
      cityNameEn: 'Australia Region',
      countryCode: 'AU',
      countryNameBn: 'অস্ট্রেলিয়া',
      countryNameEn: 'Australia',
      flag: '🇦🇺',
      timezone: 'Australia/Sydney',
    };
  }

  return {
    cityNameBn: closestPreset.cityNameBn,
    cityNameEn: closestPreset.cityNameEn,
    countryCode: closestPreset.countryCode,
    countryNameBn: closestPreset.countryNameBn,
    countryNameEn: closestPreset.countryNameEn,
    flag: closestPreset.flag,
    timezone: closestPreset.timezone,
  };
}

/**
 * Maps ISO-2 Country Code from reverse geocoding to our supported Cross-Border/Local Harvest Country Code
 */
function mapIsoCountryToAppCode(isoCode: string, rawCountryName?: string): string {
  const upper = (isoCode || '').toUpperCase().trim();
  if (upper === 'BD') return 'BD';
  if (upper === 'IN') return 'IN';
  if (upper === 'US') return 'US';
  if (upper === 'GB' || upper === 'UK' || upper === 'IE') return 'GB';
  if (upper === 'CA') return 'CA';
  if (['AE', 'SA', 'QA', 'KW', 'OM', 'BH'].includes(upper)) return 'AE';
  if (['AU', 'NZ'].includes(upper)) return 'AU';
  if (
    [
      'DE',
      'FR',
      'IT',
      'ES',
      'PT',
      'NL',
      'BE',
      'SE',
      'NO',
      'DK',
      'FI',
      'CH',
      'AT',
      'PL',
    ].includes(upper)
  ) {
    return 'EU';
  }
  if (['JP', 'SG', 'MY', 'TH', 'KR', 'ID', 'VN', 'PH'].includes(upper)) {
    return 'EA';
  }
  if (['TR', 'GR', 'EG', 'MA', 'LB'].includes(upper)) {
    return 'MED';
  }
  if (['MX', 'BR', 'AR', 'CO', 'CL', 'PE'].includes(upper)) {
    return 'LATAM';
  }
  return rawCountryName || upper || 'BD';
}

/**
 * Smart Timezone-Based Passive Geo Inference (Zero-permission instant detection)
 */
export function inferLocationFromSystemTimezone(): SmartGeoCityPreset {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Dhaka';
    const lowerTz = tz.toLowerCase();

    if (lowerTz.includes('dhaka') || lowerTz.includes('dacca')) {
      return GLOBAL_SMART_CITY_PRESETS[0]; // Dhaka, BD
    }
    if (lowerTz.includes('kolkata') || lowerTz.includes('calcutta') || lowerTz.includes('india')) {
      return GLOBAL_SMART_CITY_PRESETS.find((p) => p.countryCode === 'IN')!;
    }
    if (
      lowerTz.includes('toronto') ||
      lowerTz.includes('vancouver') ||
      lowerTz.includes('montreal') ||
      lowerTz.includes('edmonton') ||
      lowerTz.includes('winnipeg') ||
      lowerTz.includes('halifax')
    ) {
      return GLOBAL_SMART_CITY_PRESETS.find((p) => p.countryCode === 'CA')!;
    }
    if (lowerTz.includes('los_angeles') || lowerTz.includes('phoenix') || lowerTz.includes('denver')) {
      return GLOBAL_SMART_CITY_PRESETS.find((p) => p.id === 'losangeles-us')!;
    }
    if (
      lowerTz.includes('new_york') ||
      lowerTz.includes('chicago') ||
      lowerTz.includes('detroit') ||
      lowerTz.includes('america/')
    ) {
      return GLOBAL_SMART_CITY_PRESETS.find((p) => p.id === 'newyork-us')!;
    }
    if (lowerTz.includes('london') || lowerTz.includes('dublin') || lowerTz.includes('belfast')) {
      return GLOBAL_SMART_CITY_PRESETS.find((p) => p.countryCode === 'GB')!;
    }
    if (
      lowerTz.includes('dubai') ||
      lowerTz.includes('riyadh') ||
      lowerTz.includes('qatar') ||
      lowerTz.includes('kuwait') ||
      lowerTz.includes('muscat') ||
      lowerTz.includes('bahrain')
    ) {
      return GLOBAL_SMART_CITY_PRESETS.find((p) => p.countryCode === 'AE')!;
    }
    if (
      lowerTz.includes('sydney') ||
      lowerTz.includes('melbourne') ||
      lowerTz.includes('brisbane') ||
      lowerTz.includes('perth') ||
      lowerTz.includes('auckland')
    ) {
      return GLOBAL_SMART_CITY_PRESETS.find((p) => p.countryCode === 'AU')!;
    }
    if (lowerTz.startsWith('europe/')) {
      return GLOBAL_SMART_CITY_PRESETS.find((p) => p.countryCode === 'EU')!;
    }
    if (
      lowerTz.includes('tokyo') ||
      lowerTz.includes('singapore') ||
      lowerTz.includes('kuala_lumpur') ||
      lowerTz.includes('bangkok') ||
      lowerTz.includes('seoul')
    ) {
      return GLOBAL_SMART_CITY_PRESETS.find((p) => p.countryCode === 'EA')!;
    }
  } catch {
    // Fallback to Dhaka
  }
  return GLOBAL_SMART_CITY_PRESETS[0];
}

export function loadSavedSmartGeoLocation(): SmartGeoLocationSnapshot | null {
  try {
    const raw = localStorage.getItem(SMART_GEO_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SmartGeoLocationSnapshot;
    if (parsed && typeof parsed.latitude === 'number' && parsed.countryCode) {
      return parsed;
    }
  } catch {
    // Ignore storage read errors
  }
  return null;
}

export function saveSmartGeoLocation(snapshot: SmartGeoLocationSnapshot): void {
  try {
    localStorage.setItem(SMART_GEO_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore storage write errors
  }
}

/**
 * Syncs a resolved SmartGeoLocationSnapshot with Cross-Border preferences & Offline Local Harvest DB,
 * preserving the user's Preferred Food Country (`preferredCuisineCountry`).
 */
export async function syncSmartGeoWithAppEcosystem(
  snapshot: SmartGeoLocationSnapshot,
  existingPreferredCuisine?: string
): Promise<void> {
  const effective = getEffectiveResidenceAndCuisine(null);
  const preservedCuisine =
    existingPreferredCuisine || effective.preferredCuisineCountry || 'BD';

  saveStoredCrossBorderPrefs({
    residenceCountry: snapshot.countryCode,
    preferredCuisineCountry: preservedCuisine,
    supermarketSubstituteMode: effective.supermarketSubstituteMode || 'show_equivalents',
  });

  await syncLocalHarvestDatabaseToServiceWorker(snapshot.countryCode).catch(() => {});
}

/**
 * Reverse geocodes coordinates using BigDataCloud's fast, no-key client API,
 * falling back to our offline bounding-box resolver when offline or blocked.
 */
async function reverseGeocodeCoordinates(
  lat: number,
  lng: number
): Promise<{
  cityNameBn: string;
  cityNameEn: string;
  regionState?: string;
  countryCode: string;
  countryNameBn: string;
  countryNameEn: string;
  flag: string;
  timezone: string;
}> {
  const offlineFallback = resolveLocationFromCoordinatesOffline(lat, lng);

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return offlineFallback;
  }

  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    );
    if (!res.ok) return offlineFallback;
    const data = await res.json();

    const rawCity =
      data.city ||
      data.locality ||
      data.principalSubdivision ||
      offlineFallback.cityNameEn;
    const mappedCode = mapIsoCountryToAppCode(
      data.countryCode || offlineFallback.countryCode,
      data.countryName
    );
    const countryProf = getCountryCuisineProfile(mappedCode);

    // Also try fetching Bangla locality name if available, else format cleanly
    let cityBn = offlineFallback.cityNameBn;
    if (rawCity && rawCity.toLowerCase() !== offlineFallback.cityNameEn.toLowerCase()) {
      cityBn = `${rawCity} (${countryProf.countryNameBn})`;
    }

    return {
      cityNameBn: cityBn,
      cityNameEn: rawCity,
      regionState: data.principalSubdivision || undefined,
      countryCode: countryProf.code,
      countryNameBn: countryProf.countryNameBn,
      countryNameEn: countryProf.countryNameEn,
      flag: countryProf.flag,
      timezone:
        Intl.DateTimeFormat().resolvedOptions().timeZone || offlineFallback.timezone,
    };
  } catch {
    return offlineFallback;
  }
}

/**
 * Passive Smart Geo-Location Initialization:
 * Restores cached location or infers from system timezone without triggering a browser permission popup on first load,
 * OR if permission is already 'granted', silently refreshes GPS coordinates.
 */
export async function initPassiveSmartGeoLocation(): Promise<SmartGeoLocationSnapshot> {
  const cached = loadSavedSmartGeoLocation();
  if (cached) {
    return cached;
  }

  // Check if geolocation permission is already granted
  if (
    typeof navigator !== 'undefined' &&
    'permissions' in navigator &&
    'geolocation' in navigator
  ) {
    try {
      const perm = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      if (perm.state === 'granted') {
        return await detectLiveSmartGeoLocation();
      }
    } catch {
      // Ignore permission query errors in restrictive iframes
    }
  }

  const preset = inferLocationFromSystemTimezone();
  const weatherService = new WeatherService();
  let weather: WeatherData | undefined;
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      weather = await weatherService.getCurrentWeather(preset.latitude, preset.longitude);
    } catch {
      // Ignore weather errors
    }
  }

  const snapshot: SmartGeoLocationSnapshot = {
    latitude: Number(preset.latitude.toFixed(4)),
    longitude: Number(preset.longitude.toFixed(4)),
    cityNameBn: preset.cityNameBn,
    cityNameEn: preset.cityNameEn,
    countryCode: preset.countryCode,
    countryNameBn: preset.countryNameBn,
    countryNameEn: preset.countryNameEn,
    flag: preset.flag,
    timezone: preset.timezone,
    hemisphere: getHemisphereForLatitude(preset.latitude, preset.countryCode),
    detectedBy: 'timezone_smart',
    weather,
    updatedAt: new Date().toISOString(),
  };

  saveSmartGeoLocation(snapshot);
  return snapshot;
}

/**
 * Active 1-Click Live GPS Smart Geo-Location Detection:
 * Requests live browser coordinates, reverse geocodes city + country, fetches live weather/AQI,
 * and falls back gracefully to Smart Timezone inference if GPS is blocked in an iframe.
 */
export async function detectLiveSmartGeoLocation(
  existingPreferredCuisine?: string
): Promise<SmartGeoLocationSnapshot> {
  const weatherService = new WeatherService();

  const getPositionPromise = (): Promise<GeolocationPosition> =>
    new Promise((resolve, reject) => {
      if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000,
      });
    });

  try {
    const pos = await getPositionPromise();
    const lat = Number(pos.coords.latitude.toFixed(4));
    const lng = Number(pos.coords.longitude.toFixed(4));
    const accuracyMeters = Math.round(pos.coords.accuracy || 0);

    const [geoMeta, weather] = await Promise.all([
      reverseGeocodeCoordinates(lat, lng),
      weatherService.getCurrentWeather(lat, lng),
    ]);

    const snapshot: SmartGeoLocationSnapshot = {
      latitude: lat,
      longitude: lng,
      accuracyMeters,
      cityNameBn: geoMeta.cityNameBn,
      cityNameEn: geoMeta.cityNameEn,
      regionState: geoMeta.regionState,
      countryCode: geoMeta.countryCode,
      countryNameBn: geoMeta.countryNameBn,
      countryNameEn: geoMeta.countryNameEn,
      flag: geoMeta.flag,
      timezone: geoMeta.timezone,
      hemisphere: getHemisphereForLatitude(lat, geoMeta.countryCode),
      detectedBy: 'gps_live',
      weather,
      updatedAt: new Date().toISOString(),
    };

    saveSmartGeoLocation(snapshot);
    await syncSmartGeoWithAppEcosystem(snapshot, existingPreferredCuisine);
    return snapshot;
  } catch {
    // Graceful fallback if GPS permission is denied or blocked by iframe sandbox
    const tzPreset = inferLocationFromSystemTimezone();
    const weather = await weatherService.getCurrentWeather(
      tzPreset.latitude,
      tzPreset.longitude
    );

    const fallbackSnapshot: SmartGeoLocationSnapshot = {
      latitude: Number(tzPreset.latitude.toFixed(4)),
      longitude: Number(tzPreset.longitude.toFixed(4)),
      cityNameBn: tzPreset.cityNameBn,
      cityNameEn: tzPreset.cityNameEn,
      countryCode: tzPreset.countryCode,
      countryNameBn: tzPreset.countryNameBn,
      countryNameEn: tzPreset.countryNameEn,
      flag: tzPreset.flag,
      timezone: tzPreset.timezone,
      hemisphere: getHemisphereForLatitude(tzPreset.latitude, tzPreset.countryCode),
      detectedBy: 'timezone_smart',
      weather,
      updatedAt: new Date().toISOString(),
    };

    saveSmartGeoLocation(fallbackSnapshot);
    await syncSmartGeoWithAppEcosystem(fallbackSnapshot, existingPreferredCuisine);
    return fallbackSnapshot;
  }
}

/**
 * Sets Smart Geo-Location to a specific City Preset or Country Code and fetches live weather for those coordinates.
 */
export async function applyCityPresetSmartGeoLocation(
  presetOrCountryCode: string,
  existingPreferredCuisine?: string
): Promise<SmartGeoLocationSnapshot> {
  const matchedPreset =
    GLOBAL_SMART_CITY_PRESETS.find(
      (p) => p.id === presetOrCountryCode || p.countryCode === presetOrCountryCode
    ) || GLOBAL_SMART_CITY_PRESETS[0];

  const weatherService = new WeatherService();
  let weather: WeatherData | undefined;
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      weather = await weatherService.getCurrentWeather(
        matchedPreset.latitude,
        matchedPreset.longitude
      );
    } catch {
      // Ignore weather errors
    }
  }

  const snapshot: SmartGeoLocationSnapshot = {
    latitude: matchedPreset.latitude,
    longitude: matchedPreset.longitude,
    cityNameBn: matchedPreset.cityNameBn,
    cityNameEn: matchedPreset.cityNameEn,
    countryCode: matchedPreset.countryCode,
    countryNameBn: matchedPreset.countryNameBn,
    countryNameEn: matchedPreset.countryNameEn,
    flag: matchedPreset.flag,
    timezone: matchedPreset.timezone,
    hemisphere: getHemisphereForLatitude(
      matchedPreset.latitude,
      matchedPreset.countryCode
    ),
    detectedBy: 'manual_city',
    weather,
    updatedAt: new Date().toISOString(),
  };

  saveSmartGeoLocation(snapshot);
  await syncSmartGeoWithAppEcosystem(snapshot, existingPreferredCuisine);
  return snapshot;
}
