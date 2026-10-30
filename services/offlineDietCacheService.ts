import { useState, useEffect } from 'react';
import {
  DietPhaseChart,
  HealthProfile,
  DailyAdherence,
  DailyCalorieLog,
  LocalHarvestCountrySeasonSnapshot,
  Phase,
} from '../types';
import {
  getAllCountriesLocalHarvestDatabase,
  getLocalHarvestSnapshotForCountry,
} from './localHarvestDatabaseService';
import { getEffectiveResidenceAndCuisine } from './crossBorderFoodEquivalenceService';

const OFFLINE_DATA_CACHE = 'precision-diet-offline-cache-v1';
const LOCAL_SNAPSHOT_KEY = 'precision_offline_nutrition_snapshot_v1';
const LOCAL_HARVEST_DB_KEY = 'precision_offline_local_harvest_db_v1';

export const OFFLINE_ENDPOINTS = {
  dietChart: '/offline-cache/diet-chart.json',
  recentLogs: '/offline-cache/recent-logs.json',
  healthProfile: '/offline-cache/health-profile.json',
  localHarvestDb: '/offline-cache/local-harvest-db.json',
  snapshotMeta: '/offline-cache/meta.json',
};

export interface OfflineNutritionSnapshot {
  chart: DietPhaseChart | null;
  profile: HealthProfile | null;
  adherenceLogs: DailyAdherence[];
  calorieLogs: DailyCalorieLog[];
  localHarvestSnapshot?: LocalHarvestCountrySeasonSnapshot | null;
  phase: Phase;
  cachedAt: string;
}

export interface OfflineCacheStatus {
  swRegistered: boolean;
  hasCachedChart: boolean;
  cachedPhaseName: string | null;
  adherenceLogsCount: number;
  calorieLogsCount: number;
  hasLocalHarvestDb: boolean;
  cachedHarvestCountry: string | null;
  cachedHarvestVegCount: number;
  lastCachedAt: string | null;
}

const cacheStatusListeners = new Set<(status: OfflineCacheStatus) => void>();

let currentCacheStatus: OfflineCacheStatus = {
  swRegistered: false,
  hasCachedChart: false,
  cachedPhaseName: null,
  adherenceLogsCount: 0,
  calorieLogsCount: 0,
  hasLocalHarvestDb: true,
  cachedHarvestCountry: 'BD',
  cachedHarvestVegCount: 4,
  lastCachedAt: null,
};

function notifyCacheStatus(next: Partial<OfflineCacheStatus>) {
  currentCacheStatus = { ...currentCacheStatus, ...next };
  cacheStatusListeners.forEach((cb) => {
    try {
      cb(currentCacheStatus);
    } catch {
      // ignore listener errors
    }
  });
}

export function subscribeOfflineCacheStatus(
  listener: (status: OfflineCacheStatus) => void
): () => void {
  cacheStatusListeners.add(listener);
  listener(currentCacheStatus);
  return () => {
    cacheStatusListeners.delete(listener);
  };
}

/**
 * Registers the Service Worker (`/diet-offline-sw.js`) and listens for cache confirmation messages.
 */
export async function registerOfflineDietServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    // Listen for messages from the Service Worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'NUTRITION_DATA_CACHED') {
        notifyCacheStatus({
          swRegistered: true,
          lastCachedAt: event.data.cachedAt || new Date().toISOString(),
        });
      }
    });

    // Pre-cache the multi-country Local Harvest seasonal vegetable database immediately
    syncLocalHarvestDatabaseToServiceWorker().catch(() => {});

    // Check if VitePWA or existing SW is already registered, otherwise register /diet-offline-sw.js
    const existingReg = await navigator.serviceWorker.getRegistration();
    if (existingReg) {
      notifyCacheStatus({ swRegistered: true });
      return existingReg;
    }

    const reg = await navigator.serviceWorker.register('/diet-offline-sw.js', {
      scope: '/',
    });
    notifyCacheStatus({ swRegistered: true });
    return reg;
  } catch {
    // Even if SW registration is restricted by iframe sandbox, CacheStorage + localStorage still work
    return null;
  }
}

/**
 * Caches the user's active Diet Chart, Health Profile, and Recent Logs (Daily Checklist adherence + Calorie logs)
 * into both the Service Worker Cache Storage ('precision-diet-offline-cache-v1') and localStorage snapshot.
 */
export async function syncDietChartAndLogsToServiceWorker(params: {
  chart: DietPhaseChart | null;
  profile: HealthProfile | null;
  calorieLogs: DailyCalorieLog[];
  phase: Phase;
}): Promise<void> {
  if (typeof window === 'undefined') return;

  const { chart, profile, calorieLogs, phase } = params;
  const adherenceLogs = profile?.adherenceHistory || [];
  const updatedAt = new Date().toISOString();

  // Merge with existing snapshot so we never overwrite a previously cached chart with null
  const existingSnapshot = loadLocalOfflineSnapshot();
  const effectiveChart = chart || existingSnapshot?.chart || null;
  const effectiveProfile = profile || existingSnapshot?.profile || null;
  const effectiveAdherence =
    adherenceLogs.length > 0
      ? adherenceLogs
      : existingSnapshot?.adherenceLogs || [];
  const effectiveCalorieLogs =
    calorieLogs.length > 0
      ? calorieLogs.slice(-14) // Keep recent 14 days of logs lightweight
      : existingSnapshot?.calorieLogs || [];

  // Resolve Current Country ('residenceCountry') and build the Local Harvest seasonal database snapshot
  const { residenceCountry } = getEffectiveResidenceAndCuisine(effectiveProfile);
  const activeHarvestSnapshot =
    effectiveChart?.localHarvestSnapshot ||
    getLocalHarvestSnapshotForCountry(residenceCountry);
  const fullHarvestCatalog = getAllCountriesLocalHarvestDatabase();

  const snapshot: OfflineNutritionSnapshot = {
    chart: effectiveChart,
    profile: effectiveProfile,
    adherenceLogs: effectiveAdherence,
    calorieLogs: effectiveCalorieLogs,
    localHarvestSnapshot: activeHarvestSnapshot,
    phase: phase || effectiveChart?.phase || Phase.DETOX,
    cachedAt: updatedAt,
  };

  // 1. Save to localStorage mirror for synchronous instant startup
  try {
    localStorage.setItem(LOCAL_SNAPSHOT_KEY, JSON.stringify(snapshot));
    localStorage.setItem(
      LOCAL_HARVEST_DB_KEY,
      JSON.stringify({
        activeSnapshot: activeHarvestSnapshot,
        catalogByCountry: fullHarvestCatalog,
        cachedAt: updatedAt,
      })
    );
  } catch {
    // ignore storage quota errors
  }

  // 2. Write directly to Browser CacheStorage (`precision-diet-offline-cache-v1`)
  if ('caches' in window) {
    try {
      const cache = await window.caches.open(OFFLINE_DATA_CACHE);
      const headers = {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Offline-Cached-At': updatedAt,
      };

      if (effectiveChart) {
        await cache.put(
          OFFLINE_ENDPOINTS.dietChart,
          new Response(
            JSON.stringify({
              chart: effectiveChart,
              phase: snapshot.phase,
              cachedAt: updatedAt,
            }),
            { headers }
          )
        );
      }

      if (effectiveProfile) {
        await cache.put(
          OFFLINE_ENDPOINTS.healthProfile,
          new Response(
            JSON.stringify({
              profile: effectiveProfile,
              cachedAt: updatedAt,
            }),
            { headers }
          )
        );
      }

      await cache.put(
        OFFLINE_ENDPOINTS.recentLogs,
        new Response(
          JSON.stringify({
            adherenceLogs: effectiveAdherence,
            calorieLogs: effectiveCalorieLogs,
            cachedAt: updatedAt,
          }),
          { headers }
        )
      );

      await cache.put(
        OFFLINE_ENDPOINTS.localHarvestDb,
        new Response(
          JSON.stringify({
            activeSnapshot: activeHarvestSnapshot,
            catalogByCountry: fullHarvestCatalog,
            cachedAt: updatedAt,
          }),
          { headers }
        )
      );

      await cache.put(
        OFFLINE_ENDPOINTS.snapshotMeta,
        new Response(
          JSON.stringify({
            hasDietChart: Boolean(effectiveChart),
            phaseName: effectiveChart?.phaseName || null,
            adherenceLogsCount: effectiveAdherence.length,
            calorieLogsCount: effectiveCalorieLogs.length,
            hasLocalHarvestDb: true,
            cachedHarvestCountry: activeHarvestSnapshot.countryCode,
            cachedHarvestVegCount: activeHarvestSnapshot.prioritizedVegetables.length,
            cachedAt: updatedAt,
          }),
          { headers }
        )
      );
    } catch {
      // ignore CacheStorage errors
    }
  }

  // 3. Post message to active Service Worker controller so SW worker thread also updates its cache
  if ('serviceWorker' in navigator) {
    try {
      const payload = {
        chart: effectiveChart,
        profile: effectiveProfile,
        adherenceLogs: effectiveAdherence,
        calorieLogs: effectiveCalorieLogs,
        localHarvestSnapshot: activeHarvestSnapshot,
        localHarvestCatalog: fullHarvestCatalog,
        phase: snapshot.phase,
        updatedAt,
      };

      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CACHE_NUTRITION_DATA',
          payload,
        });
      } else {
        navigator.serviceWorker.ready
          .then((reg) => {
            reg.active?.postMessage({
              type: 'CACHE_NUTRITION_DATA',
              payload,
            });
          })
          .catch(() => {});
      }
    } catch {
      // ignore postMessage errors
    }
  }

  notifyCacheStatus({
    hasCachedChart: Boolean(effectiveChart),
    cachedPhaseName: effectiveChart?.phaseName || null,
    adherenceLogsCount: effectiveAdherence.length,
    calorieLogsCount: effectiveCalorieLogs.length,
    hasLocalHarvestDb: true,
    cachedHarvestCountry: activeHarvestSnapshot.countryCode,
    cachedHarvestVegCount: activeHarvestSnapshot.prioritizedVegetables.length,
    lastCachedAt: updatedAt,
  });
}

/**
 * Syncs the Local Harvest seasonal vegetable database to Service Worker CacheStorage and localStorage
 * whenever the user changes their Current Country ('residenceCountry').
 */
export async function syncLocalHarvestDatabaseToServiceWorker(
  residenceCountry?: string
): Promise<LocalHarvestCountrySeasonSnapshot> {
  const effectiveCode = residenceCountry || getEffectiveResidenceAndCuisine(null).residenceCountry;
  const activeSnapshot = getLocalHarvestSnapshotForCountry(effectiveCode);
  const catalogByCountry = getAllCountriesLocalHarvestDatabase();
  const updatedAt = new Date().toISOString();

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(
        LOCAL_HARVEST_DB_KEY,
        JSON.stringify({
          activeSnapshot,
          catalogByCountry,
          cachedAt: updatedAt,
        })
      );
    } catch {
      // ignore storage error
    }

    if ('caches' in window) {
      try {
        const cache = await window.caches.open(OFFLINE_DATA_CACHE);
        await cache.put(
          OFFLINE_ENDPOINTS.localHarvestDb,
          new Response(
            JSON.stringify({
              activeSnapshot,
              catalogByCountry,
              cachedAt: updatedAt,
            }),
            {
              headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'X-Offline-Cached-At': updatedAt,
              },
            }
          )
        );
      } catch {
        // ignore cache error
      }
    }

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      try {
        navigator.serviceWorker.controller.postMessage({
          type: 'CACHE_LOCAL_HARVEST_DB',
          payload: { activeSnapshot, catalogByCountry, updatedAt },
        });
      } catch {
        // ignore postMessage error
      }
    }
  }

  notifyCacheStatus({
    hasLocalHarvestDb: true,
    cachedHarvestCountry: activeSnapshot.countryCode,
    cachedHarvestVegCount: activeSnapshot.prioritizedVegetables.length,
    lastCachedAt: updatedAt,
  });

  return activeSnapshot;
}

/**
 * Loads the Local Harvest seasonal vegetable snapshot for the user's Current Country
 * from Service Worker Cache Storage (`/offline-cache/local-harvest-db.json`),
 * falling back to localStorage or deterministic calculation when offline.
 */
export async function loadCachedLocalHarvestFromSW(
  residenceCountry?: string
): Promise<LocalHarvestCountrySeasonSnapshot> {
  const targetCode = (
    residenceCountry || getEffectiveResidenceAndCuisine(null).residenceCountry || 'BD'
  )
    .trim()
    .toUpperCase();

  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cache = await window.caches.open(OFFLINE_DATA_CACHE);
      const res = await cache.match(OFFLINE_ENDPOINTS.localHarvestDb);
      if (res) {
        const json = await res.json();
        if (json?.catalogByCountry?.[targetCode]) {
          return json.catalogByCountry[targetCode] as LocalHarvestCountrySeasonSnapshot;
        }
        if (
          json?.activeSnapshot &&
          json.activeSnapshot.countryCode?.toUpperCase() === targetCode
        ) {
          return json.activeSnapshot as LocalHarvestCountrySeasonSnapshot;
        }
      }
    } catch {
      // fall through to localStorage
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_HARVEST_DB_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.catalogByCountry?.[targetCode]) {
          return parsed.catalogByCountry[targetCode] as LocalHarvestCountrySeasonSnapshot;
        }
      }
    } catch {
      // fall through
    }
  }

  return getLocalHarvestSnapshotForCountry(targetCode);
}

/**
 * Synchronously reads the cached nutrition snapshot from localStorage for instant initial render.
 */
export function loadLocalOfflineSnapshot(): OfflineNutritionSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCAL_SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OfflineNutritionSnapshot;
    notifyCacheStatus({
      hasCachedChart: Boolean(parsed.chart),
      cachedPhaseName: parsed.chart?.phaseName || null,
      adherenceLogsCount: parsed.adherenceLogs?.length || 0,
      calorieLogsCount: parsed.calorieLogs?.length || 0,
      lastCachedAt: parsed.cachedAt || null,
    });
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Asynchronously restores the Diet Chart, Health Profile, and Recent Logs directly from
 * the Service Worker Cache Storage (`/offline-cache/*.json`), falling back to localStorage.
 */
export async function loadCachedDietChartAndLogsFromSW(): Promise<OfflineNutritionSnapshot | null> {
  if (typeof window === 'undefined') return null;

  if ('caches' in window) {
    try {
      const cache = await window.caches.open(OFFLINE_DATA_CACHE);
      const [chartRes, profileRes, logsRes, harvestRes] = await Promise.all([
        cache.match(OFFLINE_ENDPOINTS.dietChart),
        cache.match(OFFLINE_ENDPOINTS.healthProfile),
        cache.match(OFFLINE_ENDPOINTS.recentLogs),
        cache.match(OFFLINE_ENDPOINTS.localHarvestDb),
      ]);

      const chartJson = chartRes ? await chartRes.json() : null;
      const profileJson = profileRes ? await profileRes.json() : null;
      const logsJson = logsRes ? await logsRes.json() : null;
      const harvestJson = harvestRes ? await harvestRes.json() : null;

      if (chartJson?.chart || profileJson?.profile || logsJson) {
        const activeHarvest: LocalHarvestCountrySeasonSnapshot | null =
          harvestJson?.activeSnapshot ||
          chartJson?.chart?.localHarvestSnapshot ||
          getLocalHarvestSnapshotForCountry(
            profileJson?.profile?.residenceCountry ||
              getEffectiveResidenceAndCuisine(profileJson?.profile).residenceCountry
          );

        const snapshot: OfflineNutritionSnapshot = {
          chart: chartJson?.chart || null,
          profile: profileJson?.profile || null,
          adherenceLogs: logsJson?.adherenceLogs || profileJson?.profile?.adherenceHistory || [],
          calorieLogs: logsJson?.calorieLogs || [],
          localHarvestSnapshot: activeHarvest,
          phase: chartJson?.phase || chartJson?.chart?.phase || Phase.DETOX,
          cachedAt:
            chartJson?.cachedAt ||
            logsJson?.cachedAt ||
            profileJson?.cachedAt ||
            new Date().toISOString(),
        };

        notifyCacheStatus({
          hasCachedChart: Boolean(snapshot.chart),
          cachedPhaseName: snapshot.chart?.phaseName || null,
          adherenceLogsCount: snapshot.adherenceLogs.length,
          calorieLogsCount: snapshot.calorieLogs.length,
          hasLocalHarvestDb: true,
          cachedHarvestCountry: activeHarvest?.countryCode || 'BD',
          cachedHarvestVegCount: activeHarvest?.prioritizedVegetables?.length || 0,
          lastCachedAt: snapshot.cachedAt,
        });

        return snapshot;
      }
    } catch {
      // Fallback to localStorage below
    }
  }

  return loadLocalOfflineSnapshot();
}

/**
 * React hook for monitoring online/offline connectivity and offline cache status.
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [cacheStatus, setCacheStatus] = useState<OfflineCacheStatus>(currentCacheStatus);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    const unsub = subscribeOfflineCacheStatus(setCacheStatus);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsub();
    };
  }, []);

  return {
    isOnline,
    cacheStatus,
  };
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

/**
 * React hook for in-app PWA installation (Chromium beforeinstallprompt + iOS Safari fallback).
 */
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    install,
  };
}
