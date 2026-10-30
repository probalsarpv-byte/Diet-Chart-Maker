import React, { useState, useEffect } from 'react';
import { Bell, BellRing, Clock, CheckCircle2, Play, Sparkles, Utensils, ShieldCheck } from 'lucide-react';
import { DietPhaseChart, HealthProfile, Language } from '../types';
import {
  CanonicalMealSlot,
  ScheduledMealSlotNotification,
  getScheduledMealSlotsFromChart,
  updateCanonicalMealSlotSchedule,
  scheduleDietChartLocalPushNotifications,
  triggerSlotPushNotificationNow,
  requestLocalPushPermission,
  loadLocalPushSchedulerConfig,
  saveLocalPushSchedulerConfig,
  triggerHapticFeedback,
} from '../services/alarmAndHapticsService';

interface Props {
  chart: DietPhaseChart | null;
  profile: HealthProfile | null;
  lang: Language;
  darkMode?: boolean;
  compact?: boolean;
  onSlotsUpdated?: () => void;
}

const SLOT_COLORS: Record<
  CanonicalMealSlot,
  {
    badgeBg: string;
    iconBg: string;
    borderActive: string;
    emoji: string;
  }
> = {
  Morning: {
    badgeBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30',
    iconBg: 'from-amber-500 to-orange-500',
    borderActive: 'border-amber-400/50 dark:border-amber-500/40',
    emoji: '🌅',
  },
  'Mid-day': {
    badgeBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30',
    iconBg: 'from-emerald-500 to-teal-600',
    borderActive: 'border-emerald-400/50 dark:border-emerald-500/40',
    emoji: '☀️',
  },
  Afternoon: {
    badgeBg: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border-cyan-500/30',
    iconBg: 'from-cyan-500 to-blue-600',
    borderActive: 'border-cyan-400/50 dark:border-cyan-500/40',
    emoji: '🍵',
  },
  Evening: {
    badgeBg: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30',
    iconBg: 'from-indigo-500 to-purple-600',
    borderActive: 'border-indigo-400/50 dark:border-indigo-500/40',
    emoji: '🌙',
  },
};

const MealSlotPushSchedulerCard: React.FC<Props> = ({
  chart,
  profile,
  lang,
  darkMode = false,
  compact = false,
  onSlotsUpdated,
}) => {
  const isBn = lang === 'bn';
  const [slots, setSlots] = useState<ScheduledMealSlotNotification[]>(() =>
    getScheduledMealSlotsFromChart(chart, profile, lang)
  );
  const [pushConfig, setPushConfig] = useState(() => loadLocalPushSchedulerConfig());
  const [statusNote, setStatusNote] = useState<string | null>(null);

  useEffect(() => {
    const refreshed = getScheduledMealSlotsFromChart(chart, profile, lang);
    setSlots(refreshed);
  }, [chart, profile, lang]);

  // Refresh countdown every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      setSlots(getScheduledMealSlotsFromChart(chart, profile, lang));
    }, 30000);
    return () => clearInterval(interval);
  }, [chart, profile, lang]);

  const formatCountdown = (mins: number): string => {
    if (mins < 60) {
      return isBn ? `${mins} মিনিট পর` : `in ${mins}m`;
    }
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    if (rem === 0) {
      return isBn ? `${hrs} ঘণ্টা পর` : `in ${hrs}h`;
    }
    return isBn ? `${hrs} ঘণ্টা ${rem} মিনিট পর` : `in ${hrs}h ${rem}m`;
  };

  const handleEnableBrowserPush = async () => {
    triggerHapticFeedback('item_check');
    const perm = await requestLocalPushPermission();
    const updatedCfg = loadLocalPushSchedulerConfig();
    setPushConfig(updatedCfg);
    scheduleDietChartLocalPushNotifications(chart, profile, lang);

    if (perm === 'granted') {
      setStatusNote(
        isBn
          ? '✓ ব্রাউজার ও লোকাল পুশ নোটিফিকেশন সক্রিয় হয়েছে!'
          : '✓ Browser & Local Push Notifications Activated!'
      );
    } else {
      setStatusNote(
        isBn
          ? '✓ ইন-অ্যাপ লোকাল পুশ ও হ্যাপটিক রিমাইন্ডার সক্রিয় রয়েছে!'
          : '✓ In-App Local Push & Haptic Reminders Active!'
      );
    }
    setTimeout(() => setStatusNote(null), 4000);
  };

  const handleToggleMasterPush = () => {
    const nextCfg = { ...pushConfig, pushEnabled: !pushConfig.pushEnabled };
    saveLocalPushSchedulerConfig(nextCfg);
    setPushConfig(nextCfg);
    scheduleDietChartLocalPushNotifications(chart, profile, lang);
    triggerHapticFeedback('item_check');
  };

  const handleSlotTimeChange = (slotKey: CanonicalMealSlot, newTime: string) => {
    const updated = updateCanonicalMealSlotSchedule(
      slotKey,
      { time: newTime },
      chart,
      profile,
      lang
    );
    setSlots(updated);
    scheduleDietChartLocalPushNotifications(chart, profile, lang);
    onSlotsUpdated?.();
  };

  const handleSlotToggle = (slotKey: CanonicalMealSlot, currentEnabled: boolean) => {
    const updated = updateCanonicalMealSlotSchedule(
      slotKey,
      { enabled: !currentEnabled },
      chart,
      profile,
      lang
    );
    setSlots(updated);
    scheduleDietChartLocalPushNotifications(chart, profile, lang);
    triggerHapticFeedback('item_check');
    onSlotsUpdated?.();
  };

  return (
    <div
      className={`rounded-3xl border p-4 md:p-6 transition-all space-y-4 ${
        darkMode
          ? 'bg-gradient-to-br from-slate-900 via-emerald-950/30 to-slate-900 border-emerald-500/30'
          : 'bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/50 border-emerald-200/80 shadow-sm'
      }`}
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-extrabold text-sm md:text-base">
                {isBn
                  ? 'ডায়েট চার্ট মিল-স্লট লোকাল পুশ নোটিফিকেশন শিডিউলার'
                  : 'Diet Chart Meal-Slot Local Push Scheduler'}
              </h4>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {isBn ? '৪টি স্লট অটো-সিঙ্কড' : '4 Slots Auto-Synced'}
              </span>
            </div>
            <p className="text-xs opacity-75 mt-0.5">
              {isBn
                ? 'আপনার ডায়েট চার্টের ৪টি মিল স্লট (Morning, Mid-day, Afternoon, Evening) অনুযায়ী স্বয়ংক্রিয় লোকাল পুশ নোটিফিকেশন ও হ্যাপটিক রিমাইন্ডার।'
                : 'Automatically schedules local push notifications for the 4 meal slots in your diet chart (Morning, Mid-day, Afternoon, Evening).'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          {pushConfig.browserPermission !== 'granted' ? (
            <button
              type="button"
              onClick={handleEnableBrowserPush}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{isBn ? 'পুশ পারমিশন চালু করুন' : 'Enable Push Alerts'}</span>
            </button>
          ) : (
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-black flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              {isBn ? 'পুশ নোটিফিকেশন সক্রিয়' : 'Push Active'}
            </span>
          )}

          <button
            type="button"
            onClick={handleToggleMasterPush}
            className={`w-12 h-7 rounded-full p-1 transition-colors flex items-center ${
              pushConfig.pushEnabled
                ? 'bg-emerald-600 justify-end'
                : darkMode
                ? 'bg-slate-700 justify-start'
                : 'bg-slate-300 justify-start'
            }`}
            title={isBn ? 'পুশ শিডিউলার অন/অফ' : 'Toggle Push Scheduler'}
          >
            <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
          </button>
        </div>
      </div>

      {statusNote && (
        <div className="px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusNote}</span>
        </div>
      )}

      {/* 4 Canonical Meal Slots Grid: Morning, Mid-day, Afternoon, Evening */}
      <div className={`grid grid-cols-1 ${compact ? 'md:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-4'} gap-3`}>
        {slots.map((slot) => {
          const style = SLOT_COLORS[slot.canonicalSlot];
          return (
            <div
              key={slot.id}
              className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                slot.enabled && pushConfig.pushEnabled
                  ? darkMode
                    ? `bg-slate-800/90 ${style.borderActive}`
                    : `bg-white ${style.borderActive} shadow-xs`
                  : darkMode
                  ? 'bg-slate-900/50 border-slate-800 opacity-60'
                  : 'bg-slate-50 border-slate-200 opacity-65'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border inline-flex items-center gap-1 ${style.badgeBg}`}
                  >
                    <span>{style.emoji}</span>
                    <span>{isBn ? slot.slotBadgeBn : slot.slotBadgeEn}</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => handleSlotToggle(slot.canonicalSlot, slot.enabled)}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors flex items-center ${
                      slot.enabled
                        ? 'bg-emerald-500 justify-end'
                        : darkMode
                        ? 'bg-slate-700 justify-start'
                        : 'bg-slate-300 justify-start'
                    }`}
                    aria-label={`Toggle ${slot.canonicalSlot} push reminder`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                  </button>
                </div>

                <div>
                  <h5 className="font-black text-xs md:text-sm line-clamp-1 flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{isBn ? slot.mealNameBn : slot.mealNameEn}</span>
                  </h5>
                  <p className="text-[11px] opacity-75 line-clamp-2 mt-0.5 leading-snug">
                    {isBn ? slot.menuSummaryBn : slot.menuSummaryEn}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-[11px] font-bold opacity-75">
                    <Clock className="w-3.5 h-3.5 text-emerald-500" />
                    <span>
                      {slot.enabled && pushConfig.pushEnabled
                        ? formatCountdown(slot.minutesUntilNext)
                        : isBn
                        ? 'বন্ধ আছে'
                        : 'Paused'}
                    </span>
                  </div>

                  <input
                    type="time"
                    value={slot.scheduledTime}
                    onChange={(e) => handleSlotTimeChange(slot.canonicalSlot, e.target.value)}
                    className={`px-2 py-1 rounded-lg border text-[11px] font-black outline-none ${
                      darkMode
                        ? 'bg-slate-900 border-slate-700 text-emerald-400'
                        : 'bg-slate-100 border-slate-200 text-emerald-700'
                    }`}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => triggerSlotPushNotificationNow(slot, lang)}
                  className={`w-full py-1.5 px-2.5 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 border transition-all active:scale-95 ${
                    darkMode
                      ? 'bg-emerald-950/50 border-emerald-700/50 text-emerald-300 hover:bg-emerald-900/60'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>
                    {isBn
                      ? `${slot.canonicalSlot} পুশ টেস্ট`
                      : `Test ${slot.canonicalSlot} Push`}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MealSlotPushSchedulerCard;
