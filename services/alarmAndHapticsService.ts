import { DietPhaseChart, HealthProfile, Language, Meal } from '../types';

export type HapticPatternType =
  | 'item_check'
  | 'item_uncheck'
  | 'water_drink'
  | 'milestone_100'
  | 'checkin_submit'
  | 'alarm_ring';

export type CanonicalMealSlot = 'Morning' | 'Mid-day' | 'Afternoon' | 'Evening';

export interface DietFoodMenuItem {
  name: string;
  portion: string;
  calories: string;
  benefit: string;
}

export interface DietMealAlarm {
  id: string;
  slotKey: 'morning_detox' | 'breakfast' | 'lunch' | 'afternoon_snack' | 'dinner' | 'custom';
  canonicalSlot?: CanonicalMealSlot;
  time: string; // HH:mm (24h)
  enabled: boolean;
  labelBn: string;
  labelEn: string;
  menuTitleBn: string;
  menuTitleEn: string;
  menuItems: DietFoodMenuItem[];
  waterBeforeMealNoteBn: string;
  waterBeforeMealNoteEn: string;
  lastTriggeredDate?: string; // YYYY-MM-DD
}

export interface ScheduledMealSlotNotification {
  id: string;
  canonicalSlot: CanonicalMealSlot;
  slotBadgeBn: string;
  slotBadgeEn: string;
  scheduledTime: string; // HH:mm (24h)
  originalChartTime?: string;
  enabled: boolean;
  mealNameBn: string;
  mealNameEn: string;
  menuSummaryBn: string;
  menuSummaryEn: string;
  portion: string;
  calories: string;
  waterRuleBn: string;
  waterRuleEn: string;
  menuItems: DietFoodMenuItem[];
  nextTriggerTimestamp: number;
  minutesUntilNext: number;
}

export interface LocalPushNotificationPayload {
  id: string;
  canonicalSlot: CanonicalMealSlot | 'Water';
  titleBn: string;
  titleEn: string;
  bodyBn: string;
  bodyEn: string;
  portion?: string;
  calories?: string;
  scheduledTime: string;
  triggeredAt: string;
  menuItems?: DietFoodMenuItem[];
}

export interface LocalPushSchedulerConfig {
  pushEnabled: boolean;
  browserPermission: 'granted' | 'denied' | 'default' | 'unsupported';
  autoSyncFromDietChart: boolean;
  slotOverrides: Partial<Record<CanonicalMealSlot, { time: string; enabled: boolean }>>;
}

export interface WaterReminderConfig {
  enabled: boolean;
  intervalMinutes: 30 | 60 | 90 | 120;
  startHour: string; // "07:00"
  endHour: string; // "22:00"
  dailyTargetGlasses: number;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  lastReminderTimestamp?: number;
}

export interface ActiveAlarmAlert {
  type: 'diet_meal' | 'water_reminder';
  id: string;
  titleBn: string;
  titleEn: string;
  subtitleBn: string;
  subtitleEn: string;
  time: string;
  mealAlarm?: DietMealAlarm;
  triggeredAt: string;
}

const DIET_ALARMS_STORAGE_KEY = 'precision_diet_meal_alarms_v1';
const WATER_REMINDER_STORAGE_KEY = 'precision_water_reminder_config_v1';
const LOCAL_PUSH_SCHEDULER_KEY = 'precision_local_push_scheduler_v1';

// Active timeout handles and subscribers for the Local Push Notification Scheduler
let activeSlotTimeoutHandles: number[] = [];
const pushSubscribers = new Set<(payload: LocalPushNotificationPayload) => void>();

export function subscribeToLocalPushNotifications(
  listener: (payload: LocalPushNotificationPayload) => void
): () => void {
  pushSubscribers.add(listener);
  return () => {
    pushSubscribers.delete(listener);
  };
}

function notifyPushSubscribers(payload: LocalPushNotificationPayload): void {
  pushSubscribers.forEach((listener) => {
    try {
      listener(payload);
    } catch {
      // Ignore subscriber errors
    }
  });
}

/**
 * Converts Bengali numerals (০-৯) to ASCII digits (0-9) and parses natural meal times
 * (e.g., "08:30 AM", "1:30 PM", "সকাল ৮:৩০", "দুপুর ১:৩০", "বিকেল ৫:০০", "রাত ৮:০০") into "HH:mm" 24-hour format.
 */
export function parseMealTimeTo24Hr(rawTime: string | undefined, fallback24Hr: string): string {
  if (!rawTime) return fallback24Hr;
  const bnDigits = '০১২৩৪৫৬৭৮৯';
  const normalized = rawTime
    .replace(/[০-৯]/g, (d) => String(bnDigits.indexOf(d)))
    .trim();

  // Extract first HH:MM or H:MM or H pattern
  const timeMatch = normalized.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|এএম|পিএম)?/i);
  if (!timeMatch) return fallback24Hr;

  let hours = parseInt(timeMatch[1], 10);
  const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
  const meridiem = (timeMatch[3] || '').toLowerCase();
  const lowerText = normalized.toLowerCase();

  if (Number.isNaN(hours) || Number.isNaN(minutes) || hours > 23 || minutes > 59) {
    return fallback24Hr;
  }

  const isPMKeyword =
    meridiem === 'pm' ||
    meridiem === 'পিএম' ||
    lowerText.includes('দুপুর') ||
    lowerText.includes('বিকেল') ||
    lowerText.includes('সন্ধ্যা') ||
    lowerText.includes('রাত') ||
    lowerText.includes('lunch') ||
    lowerText.includes('afternoon') ||
    lowerText.includes('evening') ||
    lowerText.includes('dinner') ||
    lowerText.includes('night');

  const isAMKeyword =
    meridiem === 'am' ||
    meridiem === 'এএম' ||
    lowerText.includes('সকাল') ||
    lowerText.includes('ভোর') ||
    lowerText.includes('morning') ||
    lowerText.includes('breakfast');

  if (isPMKeyword && hours < 12) {
    hours += 12;
  } else if (isAMKeyword && hours === 12) {
    hours = 0;
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Computes the next Date timestamp and minutes remaining for a given "HH:mm" 24-hour time.
 */
export function computeNextOccurrence(time24Hr: string): {
  nextTimestamp: number;
  msUntilNext: number;
  minutesUntilNext: number;
} {
  const [hStr, mStr] = (time24Hr || '08:30').split(':');
  const targetH = parseInt(hStr, 10) || 8;
  const targetM = parseInt(mStr, 10) || 30;

  const now = new Date();
  const next = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    targetH,
    targetM,
    0,
    0
  );

  // If the time has already passed today (by more than 30 seconds), schedule for tomorrow
  if (next.getTime() <= now.getTime() + 1000) {
    next.setDate(next.getDate() + 1);
  }

  const msUntilNext = Math.max(1000, next.getTime() - now.getTime());
  const minutesUntilNext = Math.max(1, Math.round(msUntilNext / 60000));

  return {
    nextTimestamp: next.getTime(),
    msUntilNext,
    minutesUntilNext,
  };
}

export function getBrowserNotificationPermission():
  | 'granted'
  | 'denied'
  | 'default'
  | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestLocalPushPermission(): Promise<
  'granted' | 'denied' | 'default' | 'unsupported'
> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const result = await Notification.requestPermission();
    const cfg = loadLocalPushSchedulerConfig();
    saveLocalPushSchedulerConfig({
      ...cfg,
      pushEnabled: true,
      browserPermission: result,
    });
    return result;
  } catch {
    return Notification.permission || 'default';
  }
}

export function loadLocalPushSchedulerConfig(): LocalPushSchedulerConfig {
  const defaultCfg: LocalPushSchedulerConfig = {
    pushEnabled: true,
    browserPermission: getBrowserNotificationPermission(),
    autoSyncFromDietChart: true,
    slotOverrides: {},
  };
  if (typeof window === 'undefined') return defaultCfg;
  try {
    const raw = localStorage.getItem(LOCAL_PUSH_SCHEDULER_KEY);
    if (!raw) return defaultCfg;
    const parsed = JSON.parse(raw) as LocalPushSchedulerConfig;
    return {
      ...defaultCfg,
      ...parsed,
      browserPermission: getBrowserNotificationPermission(),
    };
  } catch {
    return defaultCfg;
  }
}

export function saveLocalPushSchedulerConfig(config: LocalPushSchedulerConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_PUSH_SCHEDULER_KEY, JSON.stringify(config));
  } catch {
    // ignore storage errors
  }
}

/**
 * Dispatches a Local Push Notification via Web Notification API / ServiceWorker (when permitted)
 * AND triggers in-app push banner + haptic vibration + chime.
 */
export function dispatchLocalPushNotification(
  payload: LocalPushNotificationPayload,
  lang: Language = 'bn'
): void {
  const waterCfg = loadWaterReminderConfig();
  triggerHapticFeedback('alarm_ring', {
    soundEnabled: waterCfg.soundEnabled,
    hapticEnabled: waterCfg.hapticEnabled,
  });

  // 1. Trigger in-app push notification banner for immediate visual + interactive response
  notifyPushSubscribers(payload);

  // 2. Trigger OS / Browser Local Push Notification if granted
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    const title = lang === 'bn' ? payload.titleBn : payload.titleEn;
    const body = lang === 'bn' ? payload.bodyBn : payload.bodyEn;
    try {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
          .then((reg) => {
            reg.showNotification(title, {
              body,
              tag: payload.id,
              badge: '/favicon.ico',
              icon: '/favicon.ico',
            });
          })
          .catch(() => {
            new Notification(title, { body, tag: payload.id });
          });
      } else {
        new Notification(title, { body, tag: payload.id });
      }
    } catch {
      // Fallback already handled by in-app push subscriber
    }
  }
}

/**
 * Extracts the 4 canonical meal slots (Morning, Mid-day, Afternoon, Evening) directly from the active DietPhaseChart
 * (or clinical fallback when chart is not yet generated) and computes their scheduled push notification times.
 */
export function getScheduledMealSlotsFromChart(
  chart: DietPhaseChart | null,
  profile: HealthProfile | null,
  lang: Language = 'bn'
): ScheduledMealSlotNotification[] {
  const pushCfg = loadLocalPushSchedulerConfig();
  const alarms = loadDietMealAlarms(chart, profile, lang);

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDayName = days[new Date().getDay()];
  const todayPlan =
    chart?.weeklySchedule?.find((d) => d.day.toLowerCase() === currentDayName.toLowerCase()) ||
    chart?.weeklySchedule?.[0];

  const meals = todayPlan?.meals || [];

  const matchChartMealForSlot = (slot: CanonicalMealSlot): Meal | undefined => {
    if (!meals.length) return undefined;
    const slotKeywords: Record<CanonicalMealSlot, string[]> = {
      Morning: ['morning', 'breakfast', 'সকাল', 'নাস্তা', '8:', '08:', '7:', '07:', '9:'],
      'Mid-day': ['mid-day', 'midday', 'lunch', 'দুপুর', '1:', '13:', '2:', '14:', '12:'],
      Afternoon: ['afternoon', 'snack', 'বিকেল', '4:', '16:', '5:', '17:'],
      Evening: ['evening', 'dinner', 'night', 'supper', 'রাত', 'সন্ধ্যা', '8:', '20:', '9:', '21:'],
    };
    const kws = slotKeywords[slot];
    const matched = meals.find((m) => {
      const hay = `${m.mealSlot || ''} ${m.time || ''} ${m.mealName || ''}`.toLowerCase();
      return kws.some((k) => hay.includes(k));
    });
    if (matched) return matched;

    // Positional fallback if chart has 3 or 4 meals
    const idxMap: Record<CanonicalMealSlot, number> = {
      Morning: 0,
      'Mid-day': 1,
      Afternoon: meals.length >= 4 ? 2 : -1,
      Evening: meals.length >= 4 ? 3 : meals.length - 1,
    };
    const idx = idxMap[slot];
    return idx >= 0 && idx < meals.length ? meals[idx] : undefined;
  };

  const slotDefinitions: Array<{
    canonicalSlot: CanonicalMealSlot;
    alarmId: string;
    defaultTime: string;
    slotBadgeBn: string;
    slotBadgeEn: string;
  }> = [
    {
      canonicalSlot: 'Morning',
      alarmId: 'alarm-breakfast',
      defaultTime: '08:30',
      slotBadgeBn: 'সকাল (Morning Slot)',
      slotBadgeEn: 'Morning Slot',
    },
    {
      canonicalSlot: 'Mid-day',
      alarmId: 'alarm-lunch',
      defaultTime: '13:30',
      slotBadgeBn: 'দুপুর (Mid-day Slot)',
      slotBadgeEn: 'Mid-day Slot',
    },
    {
      canonicalSlot: 'Afternoon',
      alarmId: 'alarm-afternoon-snack',
      defaultTime: '17:00',
      slotBadgeBn: 'বিকেল (Afternoon Slot)',
      slotBadgeEn: 'Afternoon Slot',
    },
    {
      canonicalSlot: 'Evening',
      alarmId: 'alarm-dinner',
      defaultTime: '20:00',
      slotBadgeBn: 'সন্ধ্যা/রাত (Evening Slot)',
      slotBadgeEn: 'Evening Slot',
    },
  ];

  return slotDefinitions.map((def) => {
    const chartMeal = matchChartMealForSlot(def.canonicalSlot);
    const matchingAlarm = alarms.find((a) => a.id === def.alarmId);
    const override = pushCfg.slotOverrides?.[def.canonicalSlot];

    const parsedChartTime = chartMeal
      ? parseMealTimeTo24Hr(chartMeal.time, def.defaultTime)
      : matchingAlarm?.time || def.defaultTime;

    const scheduledTime = override?.time || matchingAlarm?.time || parsedChartTime;
    const enabled =
      typeof override?.enabled === 'boolean'
        ? override.enabled
        : typeof matchingAlarm?.enabled === 'boolean'
        ? matchingAlarm.enabled
        : true;

    const { nextTimestamp, minutesUntilNext } = computeNextOccurrence(scheduledTime);

    const mealNameBn =
      chartMeal?.mealName ||
      matchingAlarm?.menuTitleBn ||
      `${def.slotBadgeBn}-এর নির্ধারিত খাবার`;
    const mealNameEn =
      chartMeal?.mealName ||
      matchingAlarm?.menuTitleEn ||
      `${def.slotBadgeEn} Prescribed Meal`;

    const menuSummaryBn =
      chartMeal?.description ||
      matchingAlarm?.menuItems.map((i) => `${i.name} (${i.portion})`).join(' + ') ||
      mealNameBn;
    const menuSummaryEn =
      chartMeal?.description ||
      matchingAlarm?.menuItems.map((i) => `${i.name} (${i.portion})`).join(' + ') ||
      mealNameEn;

    const portion =
      chartMeal?.quantity ||
      matchingAlarm?.menuItems[0]?.portion ||
      (lang === 'bn' ? '১ সার্ভিং' : '1 Serving');
    const calories =
      chartMeal?.calories ||
      matchingAlarm?.menuItems[0]?.calories ||
      (lang === 'bn' ? 'ব্যালেন্সড' : 'Balanced');

    return {
      id: `push-slot-${def.canonicalSlot.toLowerCase()}`,
      canonicalSlot: def.canonicalSlot,
      slotBadgeBn: def.slotBadgeBn,
      slotBadgeEn: def.slotBadgeEn,
      scheduledTime,
      originalChartTime: chartMeal?.time,
      enabled,
      mealNameBn,
      mealNameEn,
      menuSummaryBn,
      menuSummaryEn,
      portion,
      calories,
      waterRuleBn:
        matchingAlarm?.waterBeforeMealNoteBn ||
        'খাবারের ২৫-৩০ মিনিট আগে ১ গ্লাস পানি পান করুন।',
      waterRuleEn:
        matchingAlarm?.waterBeforeMealNoteEn ||
        'Drink 1 glass of water 25-30 minutes before your meal.',
      menuItems:
        matchingAlarm?.menuItems || [
          {
            name: mealNameBn,
            portion,
            calories,
            benefit:
              chartMeal?.benefits?.[0] ||
              (lang === 'bn'
                ? 'ডায়েট চার্ট অনুযায়ী মেটাবলিক ও গাট ব্যালেন্স বজায় রাখে'
                : 'Supports metabolic & gut balance per your diet chart'),
          },
        ],
      nextTriggerTimestamp: nextTimestamp,
      minutesUntilNext,
    };
  });
}

/**
 * Updates a specific canonical meal slot's time or enabled status and syncs with both
 * the Local Push Scheduler config and the Diet Meal Alarms storage.
 */
export function updateCanonicalMealSlotSchedule(
  slot: CanonicalMealSlot,
  updates: { time?: string; enabled?: boolean },
  chart: DietPhaseChart | null,
  profile: HealthProfile | null,
  lang: Language = 'bn'
): ScheduledMealSlotNotification[] {
  const cfg = loadLocalPushSchedulerConfig();
  const prevSlot = cfg.slotOverrides?.[slot] || { time: '08:30', enabled: true };
  const currentSlots = getScheduledMealSlotsFromChart(chart, profile, lang);
  const existing = currentSlots.find((s) => s.canonicalSlot === slot);

  const nextTime = updates.time ?? existing?.scheduledTime ?? prevSlot.time;
  const nextEnabled =
    typeof updates.enabled === 'boolean'
      ? updates.enabled
      : existing?.enabled ?? prevSlot.enabled;

  const nextCfg: LocalPushSchedulerConfig = {
    ...cfg,
    slotOverrides: {
      ...cfg.slotOverrides,
      [slot]: {
        time: nextTime,
        enabled: nextEnabled,
      },
    },
  };
  saveLocalPushSchedulerConfig(nextCfg);

  // Also sync with DietMealAlarms so both views stay 100% consistent
  const slotToAlarmId: Record<CanonicalMealSlot, string> = {
    Morning: 'alarm-breakfast',
    'Mid-day': 'alarm-lunch',
    Afternoon: 'alarm-afternoon-snack',
    Evening: 'alarm-dinner',
  };
  const alarms = loadDietMealAlarms(chart, profile, lang).map((a) =>
    a.id === slotToAlarmId[slot]
      ? { ...a, time: nextTime, enabled: nextEnabled, lastTriggeredDate: undefined }
      : a
  );
  saveDietMealAlarms(alarms);

  return getScheduledMealSlotsFromChart(chart, profile, lang);
}

/**
 * Schedules local push notifications (setTimeout timers) for all enabled meal slots
 * defined in the diet chart (Morning, Mid-day, Afternoon, Evening).
 * Returns a cleanup function that clears scheduled timers.
 */
export function scheduleDietChartLocalPushNotifications(
  chart: DietPhaseChart | null,
  profile: HealthProfile | null,
  lang: Language = 'bn'
): () => void {
  // Clear previous timers
  activeSlotTimeoutHandles.forEach((id) => window.clearTimeout(id));
  activeSlotTimeoutHandles = [];

  if (typeof window === 'undefined') {
    return () => {};
  }

  const cfg = loadLocalPushSchedulerConfig();
  if (!cfg.pushEnabled) {
    return () => {};
  }

  const slots = getScheduledMealSlotsFromChart(chart, profile, lang);

  slots.forEach((slot) => {
    if (!slot.enabled) return;

    const { msUntilNext } = computeNextOccurrence(slot.scheduledTime);

    const handle = window.setTimeout(() => {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;

      const payload: LocalPushNotificationPayload = {
        id: `${slot.id}-${now.toISOString().split('T')[0]}`,
        canonicalSlot: slot.canonicalSlot,
        titleBn: `🍽️ ${slot.slotBadgeBn} ডায়েট রিমাইন্ডার (${slot.scheduledTime})`,
        titleEn: `🍽️ ${slot.slotBadgeEn} Diet Reminder (${slot.scheduledTime})`,
        bodyBn: `${slot.mealNameBn} • পরিমাণ: ${slot.portion} (${slot.calories})`,
        bodyEn: `${slot.mealNameEn} • Portion: ${slot.portion} (${slot.calories})`,
        portion: slot.portion,
        calories: slot.calories,
        scheduledTime: slot.scheduledTime,
        triggeredAt: hhmm,
        menuItems: slot.menuItems,
      };

      dispatchLocalPushNotification(payload, lang);
    }, msUntilNext);

    activeSlotTimeoutHandles.push(handle);
  });

  return () => {
    activeSlotTimeoutHandles.forEach((id) => window.clearTimeout(id));
    activeSlotTimeoutHandles = [];
  };
}

/**
 * Triggers an immediate test Local Push Notification for a specific meal slot (Morning, Mid-day, Afternoon, Evening).
 */
export function triggerSlotPushNotificationNow(
  slot: ScheduledMealSlotNotification,
  lang: Language = 'bn'
): void {
  const now = new Date();
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`;

  const payload: LocalPushNotificationPayload = {
    id: `${slot.id}-test-${Date.now()}`,
    canonicalSlot: slot.canonicalSlot,
    titleBn: `🔔 ${slot.slotBadgeBn}: ${slot.mealNameBn}`,
    titleEn: `🔔 ${slot.slotBadgeEn}: ${slot.mealNameEn}`,
    bodyBn: `${slot.menuSummaryBn} • পরিমাণ: ${slot.portion} (${slot.calories})`,
    bodyEn: `${slot.menuSummaryEn} • Portion: ${slot.portion} (${slot.calories})`,
    portion: slot.portion,
    calories: slot.calories,
    scheduledTime: slot.scheduledTime,
    triggeredAt: hhmm,
    menuItems: slot.menuItems,
  };

  dispatchLocalPushNotification(payload, lang);
}

/**
 * Triggers hardware haptic vibration (navigator.vibrate) when supported,
 * and optional Web Audio API tactile/achievement micro-chime.
 */
export function triggerHapticFeedback(
  type: HapticPatternType,
  options: { soundEnabled?: boolean; hapticEnabled?: boolean } = {
    soundEnabled: true,
    hapticEnabled: true,
  }
): boolean {
  let vibrated = false;

  if (options.hapticEnabled !== false && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      switch (type) {
        case 'item_check':
          vibrated = navigator.vibrate([35, 30, 65]);
          break;
        case 'item_uncheck':
          vibrated = navigator.vibrate([18]);
          break;
        case 'water_drink':
          vibrated = navigator.vibrate([25, 25, 50]);
          break;
        case 'milestone_100':
          vibrated = navigator.vibrate([50, 40, 80, 40, 140]);
          break;
        case 'checkin_submit':
          vibrated = navigator.vibrate([70, 45, 100, 45, 180]);
          break;
        case 'alarm_ring':
          vibrated = navigator.vibrate([200, 100, 200, 100, 320]);
          break;
      }
    } catch {
      // Ignore if blocked by browser autoplay/gesture policy
    }
  }

  if (options.soundEnabled !== false && typeof window !== 'undefined') {
    playTactileTone(type);
  }

  return vibrated;
}

function playTactileTone(type: HapticPatternType): void {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const createNote = (freq: number, startOffset: number, duration: number, gainVal = 0.08, oscType: OscillatorType = 'sine') => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = oscType;
      osc.frequency.setValueAtTime(freq, now + startOffset);
      gain.gain.setValueAtTime(0.001, now + startOffset);
      gain.gain.exponentialRampToValueAtTime(gainVal, now + startOffset + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + startOffset);
      osc.stop(now + startOffset + duration + 0.02);
    };

    switch (type) {
      case 'item_check':
        createNote(587.33, 0, 0.09, 0.07, 'sine');
        createNote(880, 0.07, 0.14, 0.09, 'triangle');
        break;
      case 'item_uncheck':
        createNote(392, 0, 0.08, 0.05, 'sine');
        break;
      case 'water_drink':
        createNote(523.25, 0, 0.08, 0.06, 'sine');
        createNote(659.25, 0.06, 0.09, 0.07, 'sine');
        createNote(783.99, 0.12, 0.14, 0.08, 'sine');
        break;
      case 'milestone_100':
        createNote(523.25, 0, 0.1, 0.08, 'triangle');
        createNote(659.25, 0.09, 0.1, 0.08, 'triangle');
        createNote(783.99, 0.18, 0.1, 0.09, 'triangle');
        createNote(1046.5, 0.27, 0.25, 0.11, 'triangle');
        break;
      case 'checkin_submit':
        createNote(523.25, 0, 0.11, 0.09, 'triangle');
        createNote(659.25, 0.1, 0.11, 0.09, 'triangle');
        createNote(783.99, 0.2, 0.11, 0.1, 'triangle');
        createNote(1046.5, 0.3, 0.32, 0.12, 'sine');
        break;
      case 'alarm_ring':
        createNote(659.25, 0, 0.16, 0.11, 'triangle');
        createNote(783.99, 0.18, 0.16, 0.11, 'triangle');
        createNote(987.77, 0.36, 0.22, 0.12, 'sine');
        createNote(1046.5, 0.6, 0.35, 0.12, 'sine');
        break;
    }

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 1200);
  } catch {
    // Ignore audio context errors
  }
}

/**
 * Builds default Diet Alarms with rich Food Menu derived from the user's active DietPhaseChart & HealthProfile.
 */
export function buildDefaultDietAlarms(
  chart: DietPhaseChart | null,
  profile: HealthProfile | null,
  _lang: Language = 'bn'
): DietMealAlarm[] {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDayName = days[new Date().getDay()];
  const todayPlan =
    chart?.weeklySchedule?.find((d) => d.day.toLowerCase() === currentDayName.toLowerCase()) ||
    chart?.weeklySchedule?.[0];

  const findChartMeal = (keywords: string[]): Meal | undefined => {
    if (!todayPlan?.meals?.length) return undefined;
    return todayPlan.meals.find((m) => {
      const hay = `${m.time} ${m.mealSlot || ''} ${m.mealName}`.toLowerCase();
      return keywords.some((k) => hay.includes(k));
    });
  };

  const breakfastMeal = findChartMeal(['breakfast', 'morning', 'নাস্তা', 'সকাল', '8:', '08:']);
  const lunchMeal = findChartMeal(['lunch', 'mid', 'দুপুর', '1:', '13:', '2:']);
  const snackMeal = findChartMeal(['snack', 'afternoon', 'বিকেল', '4:', '5:', '16:', '17:']);
  const dinnerMeal = findChartMeal(['dinner', 'evening', 'night', 'supper', 'রাত', '8:', '20:', '9:']);

  const hasHypoacidity = Boolean(profile?.hasHypoacidity);
  const dinnerNoCereal = profile?.dinnerCarbRule !== 'cereal_allowed';

  return [
    {
      id: 'alarm-morning-detox',
      slotKey: 'morning_detox',
      time: '07:00',
      enabled: true,
      labelBn: 'সকালের ডিটক্স ও ওয়েক-আপ ড্রিংক',
      labelEn: 'Morning Detox & Wake-Up Elixir',
      menuTitleBn: chart?.detoxWaterProtocol?.[0]?.name || 'উষ্ণ জিরা-ধনে বা লেবু-আদা ডিটক্স ওয়াটার',
      menuTitleEn: chart?.detoxWaterProtocol?.[0]?.name || 'Warm Cumin-Coriander or Lemon-Ginger Detox Elixir',
      menuItems: [
        {
          name: chart?.detoxWaterProtocol?.[0]?.name || 'উষ্ণ ডিটক্স ওয়াটার (খালি পেটে)',
          portion: '১ গ্লাস (২৫০ মি.লি.)',
          calories: '১০ ক্যালরি',
          benefit: chart?.detoxWaterProtocol?.[0]?.clinicalBenefit || 'গাট মাইক্রোবায়োম জাগ্রত করে ও লিভার ডিটক্স শুরু করে',
        },
        {
          name: 'ভেজানো কাঠবাদাম ও আখরোট / চিয়া সিড',
          portion: '৪-৫টি বাদাম + ১ চামচ বীজ',
          calories: '৬৫ ক্যালরি',
          benefit: 'সকালের কর্টিসল ও ব্লাড সুগার স্পাইক নিয়ন্ত্রণে রাখে',
        },
      ],
      waterBeforeMealNoteBn: 'ঘুম থেকে উঠে খালি পেটে ১ গ্লাস কুসুম গরম পানি পান করুন।',
      waterBeforeMealNoteEn: 'Drink 1 glass of lukewarm water on an empty stomach after waking up.',
    },
    {
      id: 'alarm-breakfast',
      slotKey: 'breakfast',
      canonicalSlot: 'Morning',
      time: breakfastMeal ? parseMealTimeTo24Hr(breakfastMeal.time, '08:30') : '08:30',
      enabled: true,
      labelBn: 'সকাল (Morning) • সকালের নাস্তা',
      labelEn: 'Morning • Breakfast Menu',
      menuTitleBn: breakfastMeal?.mealName || 'হাই-প্রোটিন ও ফাইবার সমৃদ্ধ সকালের নাস্তা',
      menuTitleEn: breakfastMeal?.mealName || 'High-Protein & Fiber Morning Breakfast',
      menuItems: breakfastMeal
        ? [
            {
              name: breakfastMeal.mealName,
              portion: breakfastMeal.quantity || '১ বাটি / ২টি রুটি + সবজি + ডিম',
              calories: breakfastMeal.calories || '৩২০ ক্যালরি',
              benefit: breakfastMeal.benefits?.[0] || 'সারাদিনের মেটাবলিক এনার্জি ও হরমোন ব্যালেন্স বজায় রাখে',
            },
            {
              name: breakfastMeal.description || 'সিদ্ধ ডিম / মুগ ডাল ও মৌসুমি সবজি',
              portion: '১ সার্ভিং',
              calories: '১১০ ক্যালরি',
              benefit: 'পেশি ও গাট লাইনিং মেরামত করে',
            },
          ]
        : [
            {
              name: 'লাল আটার রুটি / ওটস-চিয়া পরিজ + দেশি ডিম সিদ্ধ বা পোচ',
              portion: '২টি পাতলা রুটি / ১ বাটি + ১-২টি ডিম',
              calories: '২৮০ ক্যালরি',
              benefit: 'ধীরে শক্তি নিঃসরণ করে এবং দীর্ঘক্ষণ পেট ভরা রাখে',
            },
            {
              name: 'মৌসুমি সবজি ভাজি (কম তেলে) ও শসা',
              portion: '১ কাপ সবজি',
              calories: '৭০ ক্যালরি',
              benefit: 'প্রিবায়োটিক ফাইবার ও মাইক্রোনিউট্রিয়েন্ট সরবরাহ করে',
            },
          ],
      waterBeforeMealNoteBn: 'নাস্তার ২৫-৩০ মিনিট আগে ১ গ্লাস পানি পান করুন; খাওয়ার ঠিক মাঝখানে অতিরিক্ত পানি এড়িয়ে চলুন।',
      waterBeforeMealNoteEn: 'Drink 1 glass of water 25-30 mins before breakfast; avoid heavy water intake mid-meal.',
    },
    {
      id: 'alarm-lunch',
      slotKey: 'lunch',
      canonicalSlot: 'Mid-day',
      time: lunchMeal ? parseMealTimeTo24Hr(lunchMeal.time, '13:30') : '13:30',
      enabled: true,
      labelBn: 'দুপুর (Mid-day) • দুপুরের খাবার',
      labelEn: 'Mid-day • Lunch Menu',
      menuTitleBn: lunchMeal?.mealName || 'কমপ্লিট ক্লিনিক্যাল ব্যালেন্সড লাঞ্চ প্লেট',
      menuTitleEn: lunchMeal?.mealName || 'Complete Clinical Balanced Lunch Plate',
      menuItems: lunchMeal
        ? [
            {
              name: lunchMeal.mealName,
              portion: lunchMeal.quantity || '১ কাপ ভাত + মাছ/মুরগি + সবজি + ডাল',
              calories: lunchMeal.calories || '৪৮০ ক্যালরি',
              benefit: lunchMeal.benefits?.[0] || 'দুপুরের সর্বোচ্চ হজমশক্তি (Pitta Peak) কাজে লাগায়',
            },
            {
              name: lunchMeal.description || 'সালাদ ও ফার্মেন্টেড প্রোবায়োটিক (টক দই/ঘোল)',
              portion: '১ ছোট বাটি',
              calories: '৭৫ ক্যালরি',
              benefit: 'গাট ফ্লোরা ও হজম এনজাইম সক্রিয় করে',
            },
          ]
        : [
            {
              name: 'ঢেঁকিছাঁটা লাল চালের ভাত / পরিমিত সাদা ভাত',
              portion: '১ কাপ (১২০ গ্রাম রান্না করা)',
              calories: '১৫০ ক্যালরি',
              benefit: 'কম গ্লাইসেমিক কার্বোহাইড্রেট ও বি-ভিটামিন উৎস',
            },
            {
              name: 'দেশি মাছের ঝোল (রুই/শিং/মাগুর) বা দেশি মুরগি + পাতলা ডাল',
              portion: '১০০ গ্রাম প্রোটিন + ১ বাটি ডাল',
              calories: '২৪০ ক্যালরি',
              benefit: 'উচ্চ জৈব-লভ্য প্রোটিন ও ওমেগা-৩ ফ্যাটি অ্যাসিড',
            },
            {
              name: 'সবুজ শাক-সবজি ও টক দই (প্রোবায়োটিক)',
              portion: '১ কাপ সবজি + ১/২ কাপ টক দই',
              calories: '৯০ ক্যালরি',
              benefit: 'অন্ত্রের প্রদাহ কমায় এবং আয়রন ও ক্যালসিয়াম শোষণ বাড়ায়',
            },
          ],
      waterBeforeMealNoteBn: hasHypoacidity
        ? 'হাইপোঅ্যাসিডিটি প্রটোকল: দুপুরের খাবারের ১৫ মিনিট আগে আদা-লেবু-পিংক সল্ট শট নিন।'
        : 'দুপুরের খাবারের ৩০ মিনিট আগে ১ গ্লাস পানি পান করুন।',
      waterBeforeMealNoteEn: hasHypoacidity
        ? 'Hypoacidity Protocol: Take Ginger-Lemon-Pink Salt digestive shot 15 mins before lunch.'
        : 'Drink 1 glass of water 30 mins before lunch.',
    },
    {
      id: 'alarm-afternoon-snack',
      slotKey: 'afternoon_snack',
      canonicalSlot: 'Afternoon',
      time: snackMeal ? parseMealTimeTo24Hr(snackMeal.time, '17:00') : '17:00',
      enabled: true,
      labelBn: 'বিকেল (Afternoon) • বিকেলের নাস্তা',
      labelEn: 'Afternoon • Metabolic Snack Menu',
      menuTitleBn: snackMeal?.mealName || 'অ্যান্টি-ইনফ্ল্যামেটরি বিকেলের নাস্তা ও হার্বাল টি',
      menuTitleEn: snackMeal?.mealName || 'Anti-Inflammatory Afternoon Snack & Herbal Tea',
      menuItems: snackMeal
        ? [
            {
              name: snackMeal.mealName,
              portion: snackMeal.quantity || '১ মুঠো রোস্টেড ছোলা/বাদাম + গ্রিন টি',
              calories: snackMeal.calories || '১৬০ ক্যালরি',
              benefit: snackMeal.benefits?.[0] || 'সন্ধ্যার ক্ষুধা ও সুগার ক্রেভিং নিয়ন্ত্রণ করে',
            },
          ]
        : [
            {
              name: 'ভাজা ছোলা বা মাখানা + কুমড়োর বীজ ও সূর্যমুখী বীজ',
              portion: '১ ছোট বাটি (৩০ গ্রাম)',
              calories: '১৩০ ক্যালরি',
              benefit: 'ম্যাগনেসিয়াম ও জিঙ্ক সরবরাহ করে এবং সন্ধ্যার ক্লান্তি দূর করে',
            },
            {
              name: 'চিনি ছাড়া আদা-তুলসী চা / গ্রিন টি বা মৌসুমি টক ফল (পেয়ারা/আমলকী)',
              portion: '১ কাপ চা + ১টি ছোট ফল',
              calories: '৪৫ ক্যালরি',
              benefit: 'অ্যান্টিঅক্সিডেন্ট বুস্ট ও হজম সহায়ক',
            },
          ],
      waterBeforeMealNoteBn: 'বিকেলে চায়ের আগে ১ গ্লাস সাধারণ পানি পান করে হাইড্রেশন বজায় রাখুন।',
      waterBeforeMealNoteEn: 'Drink 1 glass of water in the afternoon to stay hydrated.',
    },
    {
      id: 'alarm-dinner',
      slotKey: 'dinner',
      canonicalSlot: 'Evening',
      time: dinnerMeal ? parseMealTimeTo24Hr(dinnerMeal.time, '20:00') : '20:00',
      enabled: true,
      labelBn: 'সন্ধ্যা/রাত (Evening) • রাতের খাবার',
      labelEn: 'Evening • Early Dinner Menu',
      menuTitleBn: dinnerMeal?.mealName || (dinnerNoCereal ? 'শস্যমুক্ত হালকা ভেজিটেবল-প্রোটিন ডিনার' : 'হালকা সুপাচ্য রাতের খাবার'),
      menuTitleEn: dinnerMeal?.mealName || (dinnerNoCereal ? 'Grain-Free Light Vegetable-Protein Dinner' : 'Light Easily Digestible Dinner'),
      menuItems: dinnerMeal
        ? [
            {
              name: dinnerMeal.mealName,
              portion: dinnerMeal.quantity || '১ বড় বাটি স্যুপ/সবজি + গ্রিলড/ঝোল মাছ বা মুরগি',
              calories: dinnerMeal.calories || '৩১০ ক্যালরি',
              benefit: dinnerMeal.benefits?.[0] || 'রাতের ইনসুলিন স্পাইক রোধ করে এবং গভীর ঘুম নিশ্চিত করে',
            },
          ]
        : [
            {
              name: dinnerNoCereal
                ? 'পেঁপে, লাউ, চালকুমড়া বা মিষ্টি কুমড়ার হালকা সবজি স্যুপ / স্টু (ভাত/রুটি ছাড়া)'
                : '১টি লাল আটার রুটি বা অল্প জাউ ভাত + লাউ/পেঁপে সবজি',
              portion: '১ বড় বাটি (২৫০ গ্রাম)',
              calories: '১৪০ ক্যালরি',
              benefit: 'রাতে অন্ত্রের ওপর চাপ কমায় এবং ফ্যাট বার্নিং ত্বরান্বিত করে',
            },
            {
              name: 'মাছের পাতলা ঝোল / দেশি মুরগির স্টু বা মুগ ডালের স্যুপ (ঘি ১ চামচ)',
              portion: '১০০ গ্রাম প্রোটিন',
              calories: '১৮০ ক্যালরি',
              benefit: 'রাতের সেলুলার রিপেয়ার ও গাট হিলিং সম্পন্ন করে',
            },
          ],
      waterBeforeMealNoteBn: 'ঘুমানোর অন্তত ২-৩ ঘণ্টা আগে রাতের খাবার শেষ করুন এবং খাবারের ৩০ মিনিট পর অল্প উষ্ণ পানি পান করুন।',
      waterBeforeMealNoteEn: 'Finish dinner 2-3 hours before sleep and sip warm water 30 mins after meal.',
    },
  ];
}

export function loadDietMealAlarms(
  chart: DietPhaseChart | null,
  profile: HealthProfile | null,
  lang: Language = 'bn'
): DietMealAlarm[] {
  const defaults = buildDefaultDietAlarms(chart, profile, lang);
  if (typeof window === 'undefined') return defaults;

  try {
    const raw = localStorage.getItem(DIET_ALARMS_STORAGE_KEY);
    if (!raw) return defaults;
    const saved = JSON.parse(raw) as DietMealAlarm[];
    if (!Array.isArray(saved) || saved.length === 0) return defaults;

    const merged = defaults.map((def) => {
      const existing = saved.find((s) => s.id === def.id);
      if (!existing) return def;
      return {
        ...def,
        time: existing.time || def.time,
        enabled: typeof existing.enabled === 'boolean' ? existing.enabled : def.enabled,
        lastTriggeredDate: existing.lastTriggeredDate,
      };
    });

    const customAlarms = saved.filter((s) => s.slotKey === 'custom');
    return [...merged, ...customAlarms];
  } catch {
    return defaults;
  }
}

export function saveDietMealAlarms(alarms: DietMealAlarm[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DIET_ALARMS_STORAGE_KEY, JSON.stringify(alarms));
  } catch {
    // ignore storage errors
  }
}

export function loadWaterReminderConfig(): WaterReminderConfig {
  const defaultConfig: WaterReminderConfig = {
    enabled: true,
    intervalMinutes: 60,
    startHour: '07:00',
    endHour: '22:00',
    dailyTargetGlasses: 8,
    soundEnabled: true,
    hapticEnabled: true,
  };
  if (typeof window === 'undefined') return defaultConfig;
  try {
    const raw = localStorage.getItem(WATER_REMINDER_STORAGE_KEY);
    if (!raw) return defaultConfig;
    return { ...defaultConfig, ...JSON.parse(raw) };
  } catch {
    return defaultConfig;
  }
}

export function saveWaterReminderConfig(config: WaterReminderConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WATER_REMINDER_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore storage errors
  }
}

export function getHydrationScheduleSlots(lang: Language = 'bn'): Array<{
  time: string;
  glassNumber: number;
  label: string;
  clinicalTip: string;
}> {
  const isBn = lang === 'bn';
  return [
    {
      time: '07:00',
      glassNumber: 1,
      label: isBn ? '১ম গ্লাস: ঘুম থেকে উঠে (উষ্ণ পানি)' : 'Glass 1: Wake-up Warm Hydration',
      clinicalTip: isBn ? 'মেটাবলিজম ও বাওয়েল মুভমেন্ট সক্রিয় করে' : 'Activates metabolism & bowel motility',
    },
    {
      time: '09:30',
      glassNumber: 2,
      label: isBn ? '২য় গ্লাস: সকালের নাস্তার ৪৫ মিনিট পর' : 'Glass 2: 45m Post-Breakfast',
      clinicalTip: isBn ? 'পুষ্টি পরিবহন ও মস্তিষ্কের একাগ্রতা বাড়ায়' : 'Supports nutrient transport & focus',
    },
    {
      time: '11:30',
      glassNumber: 3,
      label: isBn ? '৩য় গ্লাস: মধ্য-সকালের হাইড্রেশন' : 'Glass 3: Mid-Morning Hydration',
      clinicalTip: isBn ? 'অকাল ক্ষুধা ও অ্যাসিডিটি রোধ করে' : 'Prevents false hunger & acidity',
    },
    {
      time: '13:00',
      glassNumber: 4,
      label: isBn ? '৪র্থ গ্লাস: দুপুরের খাবারের ৩০ মিনিট আগে' : 'Glass 4: 30m Pre-Lunch',
      clinicalTip: isBn ? 'পাচক রস নিঃসরণ ও ওভার-ইটিং নিয়ন্ত্রণ করে' : 'Primes digestive enzymes & portion control',
    },
    {
      time: '15:30',
      glassNumber: 5,
      label: isBn ? '৫ম গ্লাস: দুপুরের খাবারের পর' : 'Glass 5: Mid-Afternoon Refresh',
      clinicalTip: isBn ? 'দুপুরের পরের অবসাদ ও ক্লান্তি দূর করে' : 'Prevents afternoon energy slump',
    },
    {
      time: '17:30',
      glassNumber: 6,
      label: isBn ? '৬ষ্ঠ গ্লাস: বিকেলের নাস্তা/হাঁটার পর' : 'Glass 6: Evening Activity Recovery',
      clinicalTip: isBn ? 'ইলেক্ট্রোলাইট ও কোষের আর্দ্রতা বজায় রাখে' : 'Restores cellular hydration',
    },
    {
      time: '19:30',
      glassNumber: 7,
      label: isBn ? '৭ম গ্লাস: রাতের খাবারের ৩০ মিনিট আগে' : 'Glass 7: 30m Pre-Dinner',
      clinicalTip: isBn ? 'রাতের হজম প্রক্রিয়া সহজ করে' : 'Supports light evening digestion',
    },
    {
      time: '21:15',
      glassNumber: 8,
      label: isBn ? '৮ম গ্লাস: ঘুমানোর ১ ঘণ্টা আগে (অল্প উষ্ণ চুমুক)' : 'Glass 8: 1h Before Sleep (Small Warm Sips)',
      clinicalTip: isBn ? 'রাতের ডিটক্স ও কিডনি ফিলট্রেশন সহায়ক' : 'Aids overnight cellular detox',
    },
  ];
}
