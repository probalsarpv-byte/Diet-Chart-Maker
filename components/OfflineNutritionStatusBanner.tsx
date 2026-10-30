import React, { useState, useEffect } from 'react';
import {
  WifiOff,
  CheckCircle2,
  Download,
  UtensilsCrossed,
  ClipboardCheck,
  Database,
  X,
  Share,
  LocateFixed,
  Loader2,
} from 'lucide-react';
import { HealthProfile, Language } from '../types';
import { useOnlineStatus, usePWAInstall } from '../services/offlineDietCacheService';
import {
  SmartGeoLocationSnapshot,
  detectLiveSmartGeoLocation,
  initPassiveSmartGeoLocation,
  loadSavedSmartGeoLocation,
} from '../services/smartGeoLocationService';

interface InstallButtonProps {
  lang: Language;
  darkMode?: boolean;
  compact?: boolean;
}

export const PWAInstallButton: React.FC<InstallButtonProps> = ({
  lang,
  darkMode = false,
  compact = false,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const isBn = lang === 'bn';

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={`flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold shadow-sm transition-all active:scale-95 ${
          compact ? 'px-2.5 py-1.5 text-[11px]' : 'px-3.5 py-2 text-xs'
        }`}
        title={isBn ? 'অ্যাপটি ইনস্টল করুন (অফলাইন সাপোর্টসহ)' : 'Install App for Offline Access'}
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span>{isBn ? 'অ্যাপ ইনস্টল' : 'Install App'}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 rounded-xl border font-extrabold transition-all active:scale-95 ${
            compact ? 'px-2.5 py-1.5 text-[11px]' : 'px-3.5 py-2 text-xs'
          } ${
            darkMode
              ? 'border-emerald-700/60 bg-emerald-950/50 text-emerald-300'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span>{isBn ? 'iOS ইনস্টল' : 'Install on iOS'}</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div
              className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl border space-y-4 ${
                darkMode
                  ? 'bg-slate-900 border-slate-800 text-white'
                  : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black flex items-center gap-2">
                  <Share className="w-4 h-4 text-emerald-500" />
                  {isBn ? 'iPhone / iPad-এ ইনস্টল করুন' : 'Install on iPhone / iPad'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1.5 rounded-lg opacity-60 hover:opacity-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs leading-relaxed opacity-85">
                {isBn ? (
                  <>
                    ১. Safari টুলবারে <strong>Share</strong> বাটনে ট্যাপ করুন।
                    <br />
                    ২. নিচে স্ক্রল করে <strong>Add to Home Screen</strong> নির্বাচন করুন। এতে ইন্টারনেট ছাড়াও আপনার ডায়েট চার্ট ও লগ দেখতে পারবেন।
                  </>
                ) : (
                  <>
                    1. Tap the <strong>Share</strong> button in your Safari toolbar.
                    <br />
                    2. Scroll down and tap <strong>Add to Home Screen</strong> for full offline access to your diet chart and logs.
                  </>
                )}
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black"
              >
                {isBn ? 'বুঝেছি' : 'Got It'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

interface OfflineBannerProps {
  lang: Language;
  darkMode?: boolean;
  onOpenDietChart: () => void;
  onOpenChecklistLogs: () => void;
}

export const OfflineNutritionStatusBanner: React.FC<OfflineBannerProps> = ({
  lang,
  darkMode = false,
  onOpenDietChart,
  onOpenChecklistLogs,
}) => {
  const { isOnline, cacheStatus } = useOnlineStatus();
  const isBn = lang === 'bn';

  if (isOnline) {
    return null;
  }

  return (
    <div className="sticky top-[57px] z-40 px-3 py-2 animate-in slide-in-from-top duration-300">
      <div
        className={`max-w-5xl mx-auto rounded-2xl border-2 px-4 py-3 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          darkMode
            ? 'bg-amber-950/95 border-amber-500/60 text-amber-100'
            : 'bg-amber-50/95 border-amber-400 text-amber-950'
        } backdrop-blur-md`}
      >
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-sm">
            <WifiOff className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-xs md:text-sm">
                {isBn
                  ? 'অফলাইন মোড সক্রিয় — সার্ভিস ওয়ার্কার ক্যাশ থেকে ডায়েট প্ল্যান লোড হয়েছে'
                  : 'Offline Mode — Using Cached Diet Chart & Recent Logs'}
              </span>
              {cacheStatus.hasCachedChart && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {isBn ? 'ক্যাশড প্ল্যান রেডি' : 'Cached Plan Ready'}
                </span>
              )}
              {cacheStatus.hasLocalHarvestDb && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  🌱{' '}
                  {isBn
                    ? `লোকাল হারভেস্ট ডাটাবেস (${cacheStatus.cachedHarvestCountry})`
                    : `Local Harvest DB (${cacheStatus.cachedHarvestCountry})`}
                </span>
              )}
            </div>
            <p className="text-[11px] opacity-85 mt-0.5">
              {isBn
                ? `ইন্টারনেট সংযোগ ছাড়াই আপনার ডায়েট চার্ট, বর্তমান দেশের (${cacheStatus.cachedHarvestCountry}) মৌসুমি সবজি ডাটাবেস এবং সাম্প্রতিক ${cacheStatus.adherenceLogsCount + cacheStatus.calorieLogsCount}টি লগ সম্পূর্ণ অ্যাক্সেসযোগ্য রয়েছে।`
                : `Your core nutritional plan, Local Harvest seasonal vegetable DB (${cacheStatus.cachedHarvestCountry}), and ${cacheStatus.adherenceLogsCount + cacheStatus.calorieLogsCount} recent logs are available offline.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenDietChart}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>{isBn ? 'ডায়েট চার্ট' : 'Diet Chart'}</span>
          </button>
          <button
            type="button"
            onClick={onOpenChecklistLogs}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1.5 border transition-all active:scale-95 ${
              darkMode
                ? 'bg-slate-900 border-amber-500/40 text-amber-200'
                : 'bg-white border-amber-300 text-amber-900'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>{isBn ? 'সাম্প্রতিক লগ' : 'Recent Logs'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const OfflineCacheBadge: React.FC<{ lang: Language; darkMode?: boolean }> = ({
  lang,
  darkMode = false,
}) => {
  const { isOnline, cacheStatus } = useOnlineStatus();
  const isBn = lang === 'bn';

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black border ${
        !isOnline
          ? 'bg-amber-500/15 text-amber-500 border-amber-500/30'
          : darkMode
          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-700/50'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
      }`}
      title={
        cacheStatus.lastCachedAt
          ? `${isBn ? 'সর্বশেষ অফলাইন সিঙ্ক (ডায়েট চার্ট + লোকাল হারভেস্ট):' : 'Last cached (Diet Chart + Local Harvest DB):'} ${new Date(
              cacheStatus.lastCachedAt
            ).toLocaleTimeString()}`
          : isBn
          ? 'অফলাইন সার্ভিস ওয়ার্কার ও লোকাল হারভেস্ট ডাটাবেস সক্রিয়'
          : 'Offline Service Worker & Local Harvest DB Active'
      }
    >
      <Database className="w-3 h-3 shrink-0" />
      <span>
        {!isOnline
          ? isBn
            ? 'অফলাইন ক্যাশ + লোকাল হারভেস্ট'
            : 'Offline Cache + Local Harvest'
          : isBn
          ? 'অফলাইন রেডি'
          : 'Offline Ready'}
      </span>
    </div>
  );
};

export const SmartGeoHeaderBadge: React.FC<{
  lang: Language;
  darkMode?: boolean;
  profile: HealthProfile | null;
  onUpdateProfile?: (updated: HealthProfile) => void;
}> = ({ lang, darkMode = false, profile, onUpdateProfile }) => {
  const isBn = lang === 'bn';
  const [geo, setGeo] = useState<SmartGeoLocationSnapshot | null>(() =>
    loadSavedSmartGeoLocation()
  );
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    let active = true;
    initPassiveSmartGeoLocation().then((snap) => {
      if (active && snap) {
        setGeo(snap);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const handleQuickDetect = async () => {
    setDetecting(true);
    try {
      const snap = await detectLiveSmartGeoLocation(profile?.preferredCuisineCountry);
      setGeo(snap);
      if (profile && onUpdateProfile) {
        onUpdateProfile({
          ...profile,
          residenceCountry: snap.countryCode,
          location: {
            latitude: snap.latitude,
            longitude: snap.longitude,
            cityNameBn: snap.cityNameBn,
            cityNameEn: snap.cityNameEn,
            countryCode: snap.countryCode,
            countryNameBn: snap.countryNameBn,
            countryNameEn: snap.countryNameEn,
            timezone: snap.timezone,
            detectedBy: snap.detectedBy,
            updatedAt: snap.updatedAt,
          },
        });
      }
    } finally {
      setDetecting(false);
    }
  };

  if (!geo) return null;

  return (
    <button
      type="button"
      onClick={handleQuickDetect}
      disabled={detecting}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black border tabular-nums transition-all active:scale-95 ${
        darkMode
          ? 'bg-indigo-950/60 text-indigo-300 border-indigo-700/50 hover:bg-indigo-900/60'
          : 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100'
      }`}
      title={
        isBn
          ? `স্মার্ট জিও-লোকেশন (${geo.latitude.toFixed(2)}°, ${geo.longitude.toFixed(2)}° — আপডেট করতে ক্লিক করুন)`
          : `Smart Geo-Location (${geo.latitude.toFixed(2)}°, ${geo.longitude.toFixed(2)}° — Click to refresh live GPS)`
      }
    >
      {detecting ? (
        <Loader2 className="w-3 h-3 animate-spin shrink-0" />
      ) : (
        <LocateFixed className="w-3 h-3 shrink-0 text-indigo-500" />
      )}
      <span className="truncate max-w-[110px] sm:max-w-[160px]">
        {geo.flag} {isBn ? geo.cityNameBn.split(' ')[0] : geo.cityNameEn.split(' ')[0]}
        {geo.weather ? ` · ${Math.round(geo.weather.temp)}°C` : ''}
      </span>
    </button>
  );
};

