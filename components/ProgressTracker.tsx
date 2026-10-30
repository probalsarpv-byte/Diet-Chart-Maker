import React, { useState, useEffect } from 'react';
import { HealthProfile, DailyAdherence, ChecklistItem, Language, DietPhaseChart } from '../types';
import { translations } from '../i18n';
import {
  Droplets,
  Scale,
  Zap,
  Activity,
  FileText,
  CheckCircle,
  TrendingUp,
  Calendar,
  Award,
  Bell,
  BellRing,
  Clock,
  Utensils,
  Volume2,
  VolumeX,
  Smartphone,
  Plus,
  Trash2,
  Sparkles,
  Check,
  X,
  Play,
  Share2,
} from 'lucide-react';
import {
  DietMealAlarm,
  WaterReminderConfig,
  ActiveAlarmAlert,
  triggerHapticFeedback,
  loadDietMealAlarms,
  saveDietMealAlarms,
  loadWaterReminderConfig,
  saveWaterReminderConfig,
  getHydrationScheduleSlots,
  subscribeToLocalPushNotifications,
} from '../services/alarmAndHapticsService';
import MealSlotPushSchedulerCard from './MealSlotPushSchedulerCard';
import SocialShareModal, { SharePayload } from './SocialShareModal';

interface Props {
  profile: HealthProfile;
  chart: DietPhaseChart | null;
  onUpdate: (updatedAdherence: DailyAdherence) => void;
  lang: Language;
  darkMode: boolean;
}

const ProgressTracker: React.FC<Props> = ({ profile, chart, onUpdate, lang, darkMode }) => {
  const t = translations[lang];
  const isBn = lang === 'bn';

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDayName = days[new Date().getDay()];
  const todayPlan =
    chart?.weeklySchedule?.find((d) => d.day.toLowerCase() === currentDayName.toLowerCase()) ||
    chart?.weeklySchedule?.[0];

  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [waterIntake, setWaterIntake] = useState(0);
  const [weight, setWeight] = useState<number | ''>(profile.weight || '');
  const [energyLevel, setEnergyLevel] = useState(5);
  const [digestionRating, setDigestionRating] = useState(5);
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<'log' | 'alarms' | 'water' | 'history'>('log');

  // Haptic & Achievement visual feedback state
  const [lastCheckedId, setLastCheckedId] = useState<string | null>(null);
  const [hapticToast, setHapticToast] = useState<{
    message: string;
    subtext: string;
    badge: string;
  } | null>(null);
  const [sharePayload, setSharePayload] = useState<SharePayload | null>(null);

  // Diet Alarms with Food Menu & Water Reminder Config
  const [dietAlarms, setDietAlarms] = useState<DietMealAlarm[]>(() =>
    loadDietMealAlarms(chart, profile, lang)
  );
  const [waterConfig, setWaterConfig] = useState<WaterReminderConfig>(() =>
    loadWaterReminderConfig()
  );
  const [activeAlarmAlert, setActiveAlarmAlert] = useState<ActiveAlarmAlert | null>(null);
  const [expandedAlarmId, setExpandedAlarmId] = useState<string | null>('alarm-breakfast');

  // New Custom Diet Alarm form state
  const [showAddCustomAlarm, setShowAddCustomAlarm] = useState(false);
  const [customAlarmTime, setCustomAlarmTime] = useState('11:00');
  const [customAlarmTitle, setCustomAlarmTitle] = useState('');
  const [customAlarmMenu, setCustomAlarmMenu] = useState('');
  const [customAlarmPortion, setCustomAlarmPortion] = useState('');

  // Re-sync default meal menus if chart updates
  useEffect(() => {
    const loaded = loadDietMealAlarms(chart, profile, lang);
    setDietAlarms(loaded);
  }, [chart, profile, lang]);

  // Listen to Local Push Notification triggers from MealSlotPushSchedulerCard or background scheduler
  useEffect(() => {
    const unsub = subscribeToLocalPushNotifications((payload) => {
      const matchedAlarm = dietAlarms.find(
        (a) => a.canonicalSlot === payload.canonicalSlot
      );
      setActiveAlarmAlert({
        type: payload.canonicalSlot === 'Water' ? 'water_reminder' : 'diet_meal',
        id: payload.id,
        titleBn: payload.titleBn,
        titleEn: payload.titleEn,
        subtitleBn: payload.bodyBn,
        subtitleEn: payload.bodyEn,
        time: payload.scheduledTime,
        mealAlarm: matchedAlarm,
        triggeredAt: payload.triggeredAt,
      });
    });
    return () => unsub();
  }, [dietAlarms]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const existingLog = profile.adherenceHistory?.find((h) => h.date === today);

    if (existingLog) {
      setItems(existingLog.items);
      setWaterIntake(existingLog.waterIntake || 0);
      setWeight(existingLog.weight || profile.weight || '');
      setEnergyLevel(existingLog.energyLevel || 5);
      setDigestionRating(existingLog.digestionRating || 5);
      setNotes(existingLog.notes || '');
      setSubmitted(true);
    } else {
      const dynamicItems: ChecklistItem[] = [
        {
          id: '1',
          label: isBn
            ? 'সকালের উষ্ণ ডিটক্স ওয়াটার ও খালি পেটের নিয়ম পালন'
            : 'Completed Morning Warm Detox Elixir Protocol',
          completed: false,
        },
        ...(todayPlan
          ? todayPlan.meals.map((m, idx) => ({
              id: `meal-${idx}`,
              label: `${m.time}: ${m.mealName} (${m.quantity})`,
              completed: false,
            }))
          : [
              {
                id: 'meal-0',
                label: isBn
                  ? '০৮:৩০ - সকালের নাস্তা (হাই-প্রোটিন ও ফাইবার মেনু)'
                  : '08:30 - Morning Breakfast (High-Protein & Fiber Menu)',
                completed: false,
              },
              {
                id: 'meal-1',
                label: isBn
                  ? '১৩:৩০ - দুপুরের ব্যালেন্সড লাঞ্চ প্লেট (মাছ/মুরগি + সবজি + ভাত)'
                  : '13:30 - Mid-Day Balanced Lunch Plate',
                completed: false,
              },
              {
                id: 'meal-2',
                label: isBn
                  ? '১৭:০০ - বিকেলের মেটাবলিক স্ন্যাকস ও হার্বাল টি'
                  : '17:00 - Afternoon Metabolic Snack & Herbal Tea',
                completed: false,
              },
              {
                id: 'meal-3',
                label: isBn
                  ? '২০:০০ - রাতের হালকা সুপাচ্য ডিনার (ঘুমানোর ৩ ঘণ্টা আগে)'
                  : '20:00 - Early Light Gut-Calm Dinner',
                completed: false,
              },
            ]),
        {
          id: 'supp',
          label: isBn
            ? `বায়ো-অ্যাক্টিভ সাপ্লিমেন্ট ও ন্যাচারাল বুস্টার গ্রহণ (${chart?.supplements?.length || 0}টি)`
            : `Took Prescribed Bio-Actives (${chart?.supplements?.length || 0} items)`,
          completed: false,
        },
        {
          id: 'move',
          label: isBn
            ? `শারীরিক ব্যায়াম / যোগব্যায়াম ও প্রাণায়াম (${chart?.activities?.[0]?.name || '৩০ মিনিট হাঁটা'})`
            : `Completed Physical Activity (${chart?.activities?.[0]?.name || '30m Walk & Breathwork'})`,
          completed: false,
        },
        {
          id: '5',
          label: isBn
            ? 'রাতের খাবারের পর ২ ঘণ্টা স্ক্রিন-ফ্রি বিশ্রাম ও সময়মতো ঘুম'
            : 'Observed 2-hour Post-Dinner Fasting & Sleep Window',
          completed: false,
        },
      ];
      setItems(dynamicItems);
      setSubmitted(false);
    }
  }, [todayPlan, chart, profile.adherenceHistory, profile.weight, isBn]);

  // Background checker for Diet Alarms & Water Reminders while in Checklist view
  useEffect(() => {
    const checkAlarmsAndWater = () => {
      const now = new Date();
      const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;
      const todayDate = now.toISOString().split('T')[0];

      // 1. Check Diet Meal Alarms
      const matchingMealAlarm = dietAlarms.find(
        (alarm) =>
          alarm.enabled &&
          alarm.time === currentHHMM &&
          alarm.lastTriggeredDate !== todayDate
      );

      if (matchingMealAlarm) {
        const updated = dietAlarms.map((a) =>
          a.id === matchingMealAlarm.id ? { ...a, lastTriggeredDate: todayDate } : a
        );
        setDietAlarms(updated);
        saveDietMealAlarms(updated);

        triggerHapticFeedback('alarm_ring', {
          soundEnabled: waterConfig.soundEnabled,
          hapticEnabled: waterConfig.hapticEnabled,
        });

        setActiveAlarmAlert({
          type: 'diet_meal',
          id: matchingMealAlarm.id,
          titleBn: `⏰ ডায়েট অ্যালার্ম: ${matchingMealAlarm.labelBn}`,
          titleEn: `⏰ Diet Alarm: ${matchingMealAlarm.labelEn}`,
          subtitleBn: matchingMealAlarm.menuTitleBn,
          subtitleEn: matchingMealAlarm.menuTitleEn,
          time: matchingMealAlarm.time,
          mealAlarm: matchingMealAlarm,
          triggeredAt: currentHHMM,
        });
        return;
      }

      // 2. Check Water Reminder interval within active window
      if (
        waterConfig.enabled &&
        currentHHMM >= waterConfig.startHour &&
        currentHHMM <= waterConfig.endHour &&
        waterIntake < waterConfig.dailyTargetGlasses
      ) {
        const lastTs = waterConfig.lastReminderTimestamp || 0;
        const elapsedMinutes = (Date.now() - lastTs) / (1000 * 60);
        if (lastTs > 0 && elapsedMinutes >= waterConfig.intervalMinutes) {
          const nextConfig = { ...waterConfig, lastReminderTimestamp: Date.now() };
          setWaterConfig(nextConfig);
          saveWaterReminderConfig(nextConfig);

          triggerHapticFeedback('alarm_ring', {
            soundEnabled: waterConfig.soundEnabled,
            hapticEnabled: waterConfig.hapticEnabled,
          });

          setActiveAlarmAlert({
            type: 'water_reminder',
            id: `water-${Date.now()}`,
            titleBn: '💧 পানির রিমাইন্ডার (Hydration Alert)',
            titleEn: '💧 Hydration & Water Reminder',
            subtitleBn: `আপনার আজকের লক্ষ্য ${waterConfig.dailyTargetGlasses} গ্লাসের মধ্যে ${waterIntake} গ্লাস সম্পন্ন হয়েছে। এখন ১ গ্লাস (২৫০ মি.লি.) পানি পান করুন!`,
            subtitleEn: `You have logged ${waterIntake} of ${waterConfig.dailyTargetGlasses} glasses today. Time for 1 glass (250ml) of water!`,
            time: currentHHMM,
            triggeredAt: currentHHMM,
          });
        }
      }
    };

    const timer = setInterval(checkAlarmsAndWater, 20000);
    return () => clearInterval(timer);
  }, [dietAlarms, waterConfig, waterIntake]);

  const showAchievementToast = (message: string, subtext: string, badge: string) => {
    setHapticToast({ message, subtext, badge });
    setTimeout(() => {
      setHapticToast((prev) => (prev?.message === message ? null : prev));
    }, 3200);
  };

  const toggleItem = (id: string) => {
    const targetItem = items.find((i) => i.id === id);
    const willComplete = targetItem ? !targetItem.completed : false;

    const nextItems = items.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setItems(nextItems);
    setSubmitted(false);

    const completedCount = nextItems.filter((i) => i.completed).length;
    const allCompleted = nextItems.length > 0 && completedCount === nextItems.length;

    if (willComplete) {
      setLastCheckedId(id);
      setTimeout(() => setLastCheckedId(null), 650);

      if (allCompleted) {
        triggerHapticFeedback('milestone_100', {
          soundEnabled: waterConfig.soundEnabled,
          hapticEnabled: waterConfig.hapticEnabled,
        });
        showAchievementToast(
          isBn ? 'অভিনন্দন! ১০০% ডেইলি চেকলিস্ট সম্পন্ন!' : '100% Daily Checklist Complete!',
          isBn
            ? 'হ্যাপটিক ভাইব্রেশন অ্যাক্টিভেটেড • এখন সাবমিট করে ৫০ পয়েন্ট সংগ্রহ করুন'
            : 'Haptic Milestone Unlocked • Submit now to claim +50 Points',
          '🏆'
        );
      } else {
        triggerHapticFeedback('item_check', {
          soundEnabled: waterConfig.soundEnabled,
          hapticEnabled: waterConfig.hapticEnabled,
        });
        showAchievementToast(
          isBn ? `চেক-ইন সফল! (${completedCount}/${nextItems.length} সম্পন্ন)` : `Check-in Recorded! (${completedCount}/${nextItems.length} Done)`,
          isBn
            ? 'হ্যাপটিক ফিডব্যাক পালস • আপনার ডেইলি স্ট্রিক এগিয়ে যাচ্ছে'
            : 'Haptic Feedback Active • Keep building your health streak',
          '✨'
        );
      }
    } else {
      triggerHapticFeedback('item_uncheck', {
        soundEnabled: false,
        hapticEnabled: waterConfig.hapticEnabled,
      });
    }
  };

  const handleWaterChange = (delta: number) => {
    const nextVal = Math.max(0, Math.min(16, waterIntake + delta));
    setWaterIntake(nextVal);
    setSubmitted(false);

    if (delta > 0) {
      triggerHapticFeedback('water_drink', {
        soundEnabled: waterConfig.soundEnabled,
        hapticEnabled: waterConfig.hapticEnabled,
      });
      const updatedWaterCfg = { ...waterConfig, lastReminderTimestamp: Date.now() };
      setWaterConfig(updatedWaterCfg);
      saveWaterReminderConfig(updatedWaterCfg);

      showAchievementToast(
        isBn
          ? `💧 +১ গ্লাস পানি যুক্ত হয়েছে (${nextVal}/${waterConfig.dailyTargetGlasses} গ্লাস)`
          : `💧 +1 Glass Logged (${nextVal}/${waterConfig.dailyTargetGlasses} Glasses)`,
        isBn
          ? `মোট ${nextVal * 250} মি.লি. হাইড্রেশন সম্পন্ন`
          : `Total ${nextVal * 250}ml hydration recorded today`,
        '💧'
      );
    }
  };

  const handleSubmit = () => {
    const completedCount = items.filter((i) => i.completed).length;
    const score = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;
    const points = completedCount * 10 + (score === 100 ? 50 : 0);

    triggerHapticFeedback('checkin_submit', {
      soundEnabled: waterConfig.soundEnabled,
      hapticEnabled: waterConfig.hapticEnabled,
    });

    const newAdherence: DailyAdherence = {
      date: new Date().toISOString().split('T')[0],
      score,
      items,
      pointsEarned: points,
      waterIntake,
      weight: weight === '' ? undefined : Number(weight),
      energyLevel,
      digestionRating,
      notes,
    };

    onUpdate(newAdherence);
    setSubmitted(true);

    showAchievementToast(
      isBn
        ? `🎉 ডেইলি চেক-ইন সাবমিট সফল! +${points} পয়েন্ট অর্জন করেছেন!`
        : `🎉 Daily Check-in Submitted! +${points} Points Earned!`,
      isBn
        ? `আজকের অ্যাডহারেন্স স্কোর: ${score}% • হ্যাপটিক অ্যাচিভমেন্ট আনলকড`
        : `Today's Adherence Score: ${score}% • Haptic Achievement Unlocked`,
      '🏅'
    );
  };

  const handleToggleAlarm = (alarmId: string) => {
    const updated = dietAlarms.map((a) =>
      a.id === alarmId ? { ...a, enabled: !a.enabled } : a
    );
    setDietAlarms(updated);
    saveDietMealAlarms(updated);
    triggerHapticFeedback('item_check', {
      soundEnabled: waterConfig.soundEnabled,
      hapticEnabled: waterConfig.hapticEnabled,
    });
  };

  const handleAlarmTimeChange = (alarmId: string, newTime: string) => {
    const updated = dietAlarms.map((a) =>
      a.id === alarmId ? { ...a, time: newTime, lastTriggeredDate: undefined } : a
    );
    setDietAlarms(updated);
    saveDietMealAlarms(updated);
  };

  const handleTriggerPreviewAlarm = (alarm: DietMealAlarm) => {
    triggerHapticFeedback('alarm_ring', {
      soundEnabled: waterConfig.soundEnabled,
      hapticEnabled: waterConfig.hapticEnabled,
    });
    setActiveAlarmAlert({
      type: 'diet_meal',
      id: alarm.id,
      titleBn: `⏰ ডায়েট অ্যালার্ম: ${alarm.labelBn}`,
      titleEn: `⏰ Diet Alarm: ${alarm.labelEn}`,
      subtitleBn: alarm.menuTitleBn,
      subtitleEn: alarm.menuTitleEn,
      time: alarm.time,
      mealAlarm: alarm,
      triggeredAt: alarm.time,
    });
  };

  const handleTriggerPreviewWaterReminder = () => {
    triggerHapticFeedback('alarm_ring', {
      soundEnabled: waterConfig.soundEnabled,
      hapticEnabled: waterConfig.hapticEnabled,
    });
    const now = new Date();
    const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
    setActiveAlarmAlert({
      type: 'water_reminder',
      id: `water-preview-${Date.now()}`,
      titleBn: '💧 পানির রিমাইন্ডার (Hydration Reminder)',
      titleEn: '💧 Water & Hydration Reminder',
      subtitleBn: `আপনার শরীরের কোষ ও গাট ডিটক্স সচল রাখতে এখন ১ গ্লাস (২৫০ মি.লি.) পানি পান করুন। (${waterIntake}/${waterConfig.dailyTargetGlasses} গ্লাস সম্পন্ন)`,
      subtitleEn: `Time to drink 1 glass (250ml) of water to support gut detox & cellular hydration. (${waterIntake}/${waterConfig.dailyTargetGlasses} glasses done)`,
      time: hhmm,
      triggeredAt: hhmm,
    });
  };

  const handleAddCustomAlarm = () => {
    if (!customAlarmTitle.trim() || !customAlarmMenu.trim()) return;
    const newAlarm: DietMealAlarm = {
      id: `custom-${Date.now()}`,
      slotKey: 'custom',
      time: customAlarmTime || '11:00',
      enabled: true,
      labelBn: customAlarmTitle.trim(),
      labelEn: customAlarmTitle.trim(),
      menuTitleBn: customAlarmMenu.trim(),
      menuTitleEn: customAlarmMenu.trim(),
      menuItems: [
        {
          name: customAlarmMenu.trim(),
          portion: customAlarmPortion.trim() || (isBn ? '১ সার্ভিং' : '1 Serving'),
          calories: isBn ? 'পরিমিত' : 'Balanced',
          benefit: isBn ? 'কাস্টম ডায়েট ও পুষ্টি রুটিন' : 'Custom Personalized Diet Routine',
        },
      ],
      waterBeforeMealNoteBn: 'খাবারের ২৫-৩০ মিনিট আগে ১ গ্লাস পানি পান করুন।',
      waterBeforeMealNoteEn: 'Drink 1 glass of water 25-30 minutes before your meal.',
    };
    const updated = [...dietAlarms, newAlarm];
    setDietAlarms(updated);
    saveDietMealAlarms(updated);
    setCustomAlarmTitle('');
    setCustomAlarmMenu('');
    setCustomAlarmPortion('');
    setShowAddCustomAlarm(false);
    triggerHapticFeedback('item_check', {
      soundEnabled: waterConfig.soundEnabled,
      hapticEnabled: waterConfig.hapticEnabled,
    });
  };

  const handleDeleteCustomAlarm = (alarmId: string) => {
    const updated = dietAlarms.filter((a) => a.id !== alarmId);
    setDietAlarms(updated);
    saveDietMealAlarms(updated);
  };

  const handleMarkMealDoneFromAlarm = (alarm: DietMealAlarm) => {
    // Match a checklist item by slot or first uncompleted meal item
    const slotMatchMap: Record<string, string[]> = {
      morning_detox: ['1', 'detox', 'সকালের উষ্ণ'],
      breakfast: ['meal-0', 'breakfast', 'নাস্তা'],
      lunch: ['meal-1', 'lunch', 'দুপুর'],
      afternoon_snack: ['meal-2', 'snack', 'বিকেল'],
      dinner: ['meal-3', 'dinner', 'রাত'],
    };
    const hints = slotMatchMap[alarm.slotKey] || [];
    const matchedItem =
      items.find(
        (i) =>
          hints.some(
            (h) => i.id.toLowerCase() === h || i.label.toLowerCase().includes(h.toLowerCase())
          ) && !i.completed
      ) || items.find((i) => !i.completed);

    if (matchedItem) {
      toggleItem(matchedItem.id);
    } else {
      triggerHapticFeedback('checkin_submit', {
        soundEnabled: waterConfig.soundEnabled,
        hapticEnabled: waterConfig.hapticEnabled,
      });
    }
    setActiveAlarmAlert(null);
  };

  const completedCount = items.filter((i) => i.completed).length;
  const currentProgressPercent =
    items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  const historyList = profile.adherenceHistory || [];
  const streakDaysCount = Math.max(1, historyList.length + (completedCount > 0 ? 1 : 0));

  const openStreakShareModal = (customLog?: DailyAdherence) => {
    const score = customLog ? customLog.score : currentProgressPercent;
    const glasses = customLog ? customLog.waterIntake || 0 : waterIntake;
    const totalStreak = historyList.length > 0 ? historyList.length : 1;
    const avgScore =
      historyList.length > 0
        ? Math.round(historyList.reduce((acc, h) => acc + h.score, 0) / historyList.length)
        : score;

    const milestoneLabelBn =
      score === 100
        ? '🏆 ১০০% গোল্ডেন ডেইলি কমপ্লায়েন্স অর্জন!'
        : totalStreak >= 7
        ? `🔥 ${totalStreak} দিনের ধারাবাহিক ডায়েট স্ট্রিক!`
        : '✨ ডেইলি ক্লিনিক্যাল নিউট্রিশন চেক-ইন';
    const milestoneLabelEn =
      score === 100
        ? '🏆 100% Golden Daily Compliance Milestone!'
        : totalStreak >= 7
        ? `🔥 ${totalStreak}-Day Nutrition Compliance Streak!`
        : '✨ Daily Clinical Nutrition Check-in';

    const shareTitle = isBn
      ? `${milestoneLabelBn} — আজকের অগ্রগতি ${score}%`
      : `${milestoneLabelEn} — Today's Adherence ${score}%`;

    const shareSubtitle = isBn
      ? `নিউট্রিশন প্রটোকল স্ট্রিক: ${totalStreak} দিন • গড় কমপ্লায়েন্স: ${avgScore}%`
      : `Nutrition Protocol Streak: ${totalStreak} Days • Avg Adherence: ${avgScore}%`;

    const shareText = isBn
      ? `🌿 আমার আজকের ক্লিনিক্যাল নিউট্রিশন ও ডায়েট ট্র্যাকার অর্জন!\n` +
        `✅ প্রটোকল কমপ্লায়েন্স স্কোর: ${score}% (${completedCount}/${items.length} সম্পন্ন)\n` +
        `🔥 ধারাবাহিক স্ট্রিক: ${totalStreak} দিন (গড় স্কোর: ${avgScore}%)\n` +
        `💧 হাইড্রেশন: ${glasses}/${waterConfig.dailyTargetGlasses} গ্লাস পানি\n` +
        `⚡ এনার্জি লেভেল: ${customLog ? customLog.energyLevel : energyLevel}/10\n` +
        `#PrecisionNutrition #HealthyStreak #DietCompliance #ClinicalWellness`
      : `🌿 My Daily Clinical Nutrition & Diet Compliance Achievement!\n` +
        `✅ Protocol Adherence Score: ${score}% (${completedCount}/${items.length} completed)\n` +
        `🔥 Active Compliance Streak: ${totalStreak} Days (Avg: ${avgScore}%)\n` +
        `💧 Hydration: ${glasses}/${waterConfig.dailyTargetGlasses} Glasses\n` +
        `⚡ Energy Level: ${customLog ? customLog.energyLevel : energyLevel}/10\n` +
        `#PrecisionNutrition #HealthyStreak #DietCompliance #ClinicalWellness`;

    setSharePayload({
      badge: isBn ? milestoneLabelBn : milestoneLabelEn,
      title: shareTitle,
      subtitle: shareSubtitle,
      stats: [
        {
          label: isBn ? 'আজকের স্কোর' : 'Daily Score',
          value: `${score}%`,
        },
        {
          label: isBn ? 'ধারাবাহিক স্ট্রিক' : 'Active Streak',
          value: isBn ? `${totalStreak} দিন` : `${totalStreak} Days`,
        },
        {
          label: isBn ? 'হাইড্রেশন' : 'Hydration',
          value: isBn
            ? `${glasses}/${waterConfig.dailyTargetGlasses} গ্লাস`
            : `${glasses}/${waterConfig.dailyTargetGlasses}G`,
        },
      ],
      shareText,
    });
  };

  const renderHistory = () => {
    const history = profile.adherenceHistory || [];
    if (history.length === 0) {
      return (
        <div className="text-center py-20 opacity-50">
          <Calendar className="w-16 h-16 mx-auto mb-4" />
          <p className="font-bold">
            {isBn ? 'এখনও কোনো চেক-ইন হিস্ট্রি নেই। আজকের লগ দিয়ে শুরু করুন!' : 'No logs recorded yet. Start by logging your day!'}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-3xl border border-emerald-500/30 bg-emerald-500/10">
          <div>
            <h4 className="font-black text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <Award className="w-4 h-4" />
              {isBn
                ? `🔥 আপনার ${history.length} দিনের কমপ্লায়েন্স স্ট্রিক ও মাইলস্টোন শেয়ার করুন`
                : `🔥 Share Your ${history.length}-Day Compliance Streak & Milestone`}
            </h4>
            <p className="text-xs opacity-75 mt-0.5">
              {isBn
                ? 'হোয়াটসঅ্যাপ, ফেসবুক বা বন্ধুদের সাথে আপনার স্বাস্থ্যকর অভ্যাসের অর্জন শেয়ার করুন'
                : 'Share your daily nutrition streak and milestone achievements to WhatsApp or Facebook'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => openStreakShareModal()}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md shrink-0 transition-all active:scale-95"
          >
            <Share2 className="w-4 h-4" />
            {isBn ? 'শেয়ার স্ট্রিক (WhatsApp / FB)' : 'Share Streak (WhatsApp / FB)'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-emerald-50 border-emerald-100'}`}>
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <span className="text-xs font-black uppercase tracking-widest opacity-60">Avg. Adherence</span>
            </div>
            <div className="text-3xl font-black text-emerald-600">
              {Math.round(history.reduce((acc, h) => acc + h.score, 0) / history.length)}%
            </div>
          </div>
          <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-blue-50 border-blue-100'}`}>
            <div className="flex items-center gap-3 mb-2">
              <Droplets className="w-5 h-5 text-blue-500" />
              <span className="text-xs font-black uppercase tracking-widest opacity-60">Avg. Hydration</span>
            </div>
            <div className="text-3xl font-black text-blue-600">
              {(history.reduce((acc, h) => acc + (h.waterIntake || 0), 0) / history.length).toFixed(1)} Glasses
            </div>
          </div>
          <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-purple-50 border-purple-100'}`}>
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-5 h-5 text-purple-500" />
              <span className="text-xs font-black uppercase tracking-widest opacity-60">Total Logs</span>
            </div>
            <div className="text-3xl font-black text-purple-600">{history.length} Days</div>
          </div>
        </div>

        <div className="space-y-4">
          {[...history].reverse().map((log, idx) => (
            <div key={idx} className={`p-6 rounded-3xl border transition-all ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
              <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black text-xs">
                    {log.score}%
                  </div>
                  <div>
                    <h4 className="font-black text-sm">{new Date(log.date).toLocaleDateString(lang, { weekday: 'long', month: 'short', day: 'numeric' })}</h4>
                    <span className="text-[10px] opacity-50 uppercase font-bold">+{log.pointsEarned} Points Earned</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex gap-3 text-xs font-bold opacity-70">
                    {log.weight && <span>⚖️ {log.weight}kg</span>}
                    <span>💧 {log.waterIntake || 0}G</span>
                    <span>⚡ {log.energyLevel}/10</span>
                    <span>🧘 {log.digestionRating}/10</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openStreakShareModal(log)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-300 text-[11px] font-black flex items-center gap-1.5 transition-all"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    {isBn ? 'শেয়ার' : 'Share'}
                  </button>
                </div>
              </div>
              {log.notes && (
                <p className="text-xs italic opacity-70 bg-black/5 p-3 rounded-xl border-l-2 border-emerald-500">
                  "{log.notes}"
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDietAlarmsTab = () => {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* 4-Slot Diet Chart Local Push Notification Scheduler (Morning, Mid-day, Afternoon, Evening) */}
        <MealSlotPushSchedulerCard
          chart={chart}
          profile={profile}
          lang={lang}
          darkMode={darkMode}
          onSlotsUpdated={() => {
            setDietAlarms(loadDietMealAlarms(chart, profile, lang));
          }}
        />

        {/* Header Banner */}
        <div
          className={`p-5 rounded-3xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
            darkMode
              ? 'bg-gradient-to-r from-emerald-950/60 to-teal-950/50 border-emerald-800/50'
              : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200'
          }`}
        >
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-600/25">
              <BellRing className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-black text-base md:text-lg flex items-center gap-2">
                {isBn ? 'ডায়েট অ্যালার্ম ও প্রতি বেলার খাদ্যতালিকা' : 'Smart Diet Alarms with Live Food Menu'}
              </h4>
              <p className="text-xs opacity-75 mt-0.5 leading-relaxed">
                {isBn
                  ? 'নির্ধারিত সময়ে হ্যাপটিক ভাইব্রেশন ও অ্যালার্ম বাজবে এবং সাথে সাথে ঐ বেলার নির্ধারিত খাবার মেনু, পরিমাণ ও পানির নিয়ম ভেসে উঠবে।'
                  : 'Triggers haptic vibration & audio chime at mealtime with your exact prescribed food menu, portion sizes, and pre-meal hydration rule.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddCustomAlarm(!showAddCustomAlarm)}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shrink-0 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            {isBn ? 'নতুন খাবার অ্যালার্ম' : 'Add Custom Alarm'}
          </button>
        </div>

        {/* Add Custom Diet Alarm Form */}
        {showAddCustomAlarm && (
          <div
            className={`p-5 rounded-3xl border space-y-4 ${
              darkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <h5 className="font-black text-sm flex items-center gap-2 text-emerald-500">
              <Utensils className="w-4 h-4" />
              {isBn ? 'কাস্টম ডায়েট অ্যালার্ম ও খাবার মেনু যোগ করুন' : 'Create Custom Meal Alarm & Food Menu'}
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-bold opacity-70 block mb-1">
                  {isBn ? 'সময় (Time)' : 'Alarm Time'}
                </label>
                <input
                  type="time"
                  value={customAlarmTime}
                  onChange={(e) => setCustomAlarmTime(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border font-bold text-sm ${
                    darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                  }`}
                />
              </div>
              <div>
                <label className="text-[11px] font-bold opacity-70 block mb-1">
                  {isBn ? 'বেলার নাম (যেমন: মিড-মর্নিং স্ন্যাকস)' : 'Meal Slot Title'}
                </label>
                <input
                  type="text"
                  value={customAlarmTitle}
                  onChange={(e) => setCustomAlarmTitle(e.target.value)}
                  placeholder={isBn ? 'মিড-মর্নিং ফলের সময়' : 'Mid-Morning Fruit Slot'}
                  className={`w-full px-3 py-2.5 rounded-xl border font-bold text-sm ${
                    darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                  }`}
                />
              </div>
              <div>
                <label className="text-[11px] font-bold opacity-70 block mb-1">
                  {isBn ? 'খাবারের মেনু (Food Menu)' : 'Food Menu Items'}
                </label>
                <input
                  type="text"
                  value={customAlarmMenu}
                  onChange={(e) => setCustomAlarmMenu(e.target.value)}
                  placeholder={isBn ? '১টি পেয়ারা + ৫টি কাঠবাদাম' : '1 Guava + 5 Soaked Almonds'}
                  className={`w-full px-3 py-2.5 rounded-xl border font-bold text-sm ${
                    darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                  }`}
                />
              </div>
              <div>
                <label className="text-[11px] font-bold opacity-70 block mb-1">
                  {isBn ? 'পরিমাণ (Portion)' : 'Portion Size'}
                </label>
                <input
                  type="text"
                  value={customAlarmPortion}
                  onChange={(e) => setCustomAlarmPortion(e.target.value)}
                  placeholder={isBn ? '১ বাটি (১৫০ গ্রাম)' : '1 Small Bowl (150g)'}
                  className={`w-full px-3 py-2.5 rounded-xl border font-bold text-sm ${
                    darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                  }`}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddCustomAlarm(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold opacity-70 hover:opacity-100"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={handleAddCustomAlarm}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black shadow-md hover:bg-emerald-500"
              >
                {isBn ? 'অ্যালার্ম সেভ করুন' : 'Save Alarm'}
              </button>
            </div>
          </div>
        )}

        {/* Meal Alarms List with Expandable Food Menu */}
        <div className="space-y-4">
          {dietAlarms.map((alarm) => {
            const isExpanded = expandedAlarmId === alarm.id;
            return (
              <div
                key={alarm.id}
                className={`rounded-3xl border transition-all overflow-hidden ${
                  alarm.enabled
                    ? darkMode
                      ? 'bg-slate-800/90 border-emerald-500/40 shadow-lg'
                      : 'bg-white border-emerald-200 shadow-md'
                    : darkMode
                    ? 'bg-slate-900/50 border-slate-800 opacity-60'
                    : 'bg-slate-50 border-slate-200 opacity-65'
                }`}
              >
                <div className="p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div
                    className="flex items-center gap-3.5 cursor-pointer flex-1"
                    onClick={() => setExpandedAlarmId(isExpanded ? null : alarm.id)}
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black shrink-0 ${
                        alarm.enabled
                          ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                          : 'bg-slate-500/10 text-slate-400'
                      }`}
                    >
                      <Clock className="w-4 h-4 mb-0.5" />
                      <span className="text-[11px] leading-none">{alarm.time}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className="font-black text-sm md:text-base">
                          {isBn ? alarm.labelBn : alarm.labelEn}
                        </h5>
                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          {alarm.menuItems.length} {isBn ? 'টি খাবার আইটেম' : 'Menu Items'}
                        </span>
                      </div>
                      <p className="text-xs opacity-75 truncate mt-0.5 font-medium">
                        🍽️ {isBn ? alarm.menuTitleBn : alarm.menuTitleEn}
                      </p>
                    </div>
                  </div>

                  {/* Alarm Controls: Time Picker, Test Button, ON/OFF Switch */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <input
                      type="time"
                      value={alarm.time}
                      onChange={(e) => handleAlarmTimeChange(alarm.id, e.target.value)}
                      className={`px-2.5 py-1.5 rounded-xl border text-xs font-black outline-none focus:ring-2 ring-emerald-500/40 ${
                        darkMode
                          ? 'bg-slate-900 border-slate-700 text-emerald-400'
                          : 'bg-slate-100 border-slate-200 text-emerald-700'
                      }`}
                      aria-label="Alarm time"
                    />

                    <button
                      onClick={() => handleTriggerPreviewAlarm(alarm)}
                      title={isBn ? 'অ্যালার্ম ও ফুড মেনু প্রিভিউ দেখুন' : 'Test Alarm with Food Menu'}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1 transition-all active:scale-95 ${
                        darkMode
                          ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30'
                          : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                      }`}
                    >
                      <Play className="w-3 h-3 fill-current" />
                      {isBn ? 'মেনু অ্যালার্ম টেস্ট' : 'Test Menu'}
                    </button>

                    <button
                      onClick={() => handleToggleAlarm(alarm.id)}
                      className={`w-12 h-7 rounded-full p-1 transition-colors flex items-center ${
                        alarm.enabled
                          ? 'bg-emerald-500 justify-end'
                          : darkMode
                          ? 'bg-slate-700 justify-start'
                          : 'bg-slate-300 justify-start'
                      }`}
                      aria-label="Toggle alarm"
                    >
                      <div className="w-5 h-5 rounded-full bg-white shadow-md" />
                    </button>

                    {alarm.slotKey === 'custom' && (
                      <button
                        onClick={() => handleDeleteCustomAlarm(alarm.id)}
                        className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-500/10"
                        title={isBn ? 'মুছে ফেলুন' : 'Delete custom alarm'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Food Menu Card */}
                {isExpanded && (
                  <div
                    className={`px-4 pb-4 md:px-5 md:pb-5 pt-2 border-t space-y-3 ${
                      darkMode ? 'border-slate-700/70 bg-slate-900/40' : 'border-slate-100 bg-emerald-50/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
                        <Utensils className="w-3.5 h-3.5" />
                        {isBn ? 'এই বেলার নির্ধারিত খাদ্যতালিকা (Prescribed Food Menu)' : 'Prescribed Meal Menu & Portions'}
                      </span>
                      <button
                        onClick={() => handleMarkMealDoneFromAlarm(alarm)}
                        className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        {isBn ? 'চেকলিস্টে সম্পন্ন মার্ক করুন' : 'Mark Completed in Checklist'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {alarm.menuItems.map((food, fIdx) => (
                        <div
                          key={fIdx}
                          className={`p-3.5 rounded-2xl border ${
                            darkMode
                              ? 'bg-slate-800/80 border-slate-700'
                              : 'bg-white border-emerald-100 shadow-xs'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-black text-xs md:text-sm leading-snug">{food.name}</p>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-500 shrink-0">
                              {food.calories}
                            </span>
                          </div>
                          <div className="text-[11px] font-bold text-amber-500 mt-1">
                            ⚖️ {isBn ? 'পরিমাণ:' : 'Portion:'} {food.portion}
                          </div>
                          <p className="text-[11px] opacity-70 mt-1 leading-relaxed">
                            ✨ {food.benefit}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div
                      className={`p-3 rounded-2xl flex items-center gap-2.5 text-xs font-bold ${
                        darkMode
                          ? 'bg-blue-950/50 text-blue-300 border border-blue-800/40'
                          : 'bg-blue-50 text-blue-800 border border-blue-200'
                      }`}
                    >
                      <Droplets className="w-4 h-4 text-blue-500 shrink-0" />
                      <span>
                        {isBn ? alarm.waterBeforeMealNoteBn : alarm.waterBeforeMealNoteEn}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWaterReminderTab = () => {
    const hydrationSlots = getHydrationScheduleSlots(lang);
    const hydrationPercent = Math.min(
      100,
      Math.round((waterIntake / Math.max(1, waterConfig.dailyTargetGlasses)) * 100)
    );

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Hydration Progress & Quick Drink Hero */}
        <div
          className={`p-6 rounded-3xl border ${
            darkMode
              ? 'bg-gradient-to-br from-blue-950/70 via-slate-900 to-cyan-950/60 border-blue-800/50'
              : 'bg-gradient-to-br from-blue-50 via-cyan-50/60 to-white border-blue-200'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 text-blue-500 text-xs font-black">
                <Droplets className="w-4 h-4" />
                {isBn ? 'স্মার্ট ওয়াটার রিমাইন্ডার ও হাইড্রেশন ট্র্যাকার' : 'Smart Water Reminder & Hydration Tracker'}
              </div>
              <h4 className="text-2xl font-black">
                {waterIntake} / {waterConfig.dailyTargetGlasses}{' '}
                {isBn ? 'গ্লাস সম্পন্ন' : 'Glasses Completed'}{' '}
                <span className="text-sm font-bold text-blue-500">
                  ({waterIntake * 250} / {waterConfig.dailyTargetGlasses * 250} ml)
                </span>
              </h4>
              <p className="text-xs opacity-75">
                {isBn
                  ? 'প্রতি গ্লাস পানি পানের পর "+১ গ্লাস পানি" বাটনে ট্যাপ করলে হ্যাপটিক ভাইব্রেশন ও প্রোগ্রেস আপডেট হবে।'
                  : 'Tap "+1 Glass Water" after drinking to feel haptic confirmation and update your daily cellular hydration.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleWaterChange(1)}
                className="px-5 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs md:text-sm flex items-center gap-2 shadow-lg shadow-blue-600/25 active:scale-95 transition-all"
              >
                <Droplets className="w-5 h-5" />
                {isBn ? '+১ গ্লাস পানি পান করেছি (250ml)' : '+1 Glass Water (250ml)'}
              </button>
              <button
                onClick={handleTriggerPreviewWaterReminder}
                className={`px-4 py-3.5 rounded-2xl font-black text-xs flex items-center gap-1.5 border transition-all active:scale-95 ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-blue-300 hover:bg-slate-700'
                    : 'bg-white border-blue-200 text-blue-700 hover:bg-blue-50'
                }`}
              >
                <Bell className="w-4 h-4" />
                {isBn ? 'রিমাইন্ডার টেস্ট' : 'Test Alert'}
              </button>
            </div>
          </div>

          {/* Visual Glass Bars */}
          <div className="mt-5 space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span>{isBn ? 'দৈনিক হাইড্রেশন অগ্রগতি' : 'Daily Hydration Progress'}</span>
              <span className="text-blue-500 font-black">{hydrationPercent}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500 rounded-full"
                style={{ width: `${hydrationPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Water Reminder Interval & Window Settings */}
        <div
          className={`p-5 rounded-3xl border space-y-4 ${
            darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <BellRing className="w-5 h-5 text-blue-500" />
              <h5 className="font-black text-sm md:text-base">
                {isBn ? 'অটোমেটিক পানির রিমাইন্ডার সেটিংস' : 'Automatic Water Reminder Settings'}
              </h5>
            </div>
            <button
              onClick={() => {
                const next = {
                  ...waterConfig,
                  enabled: !waterConfig.enabled,
                  lastReminderTimestamp: Date.now(),
                };
                setWaterConfig(next);
                saveWaterReminderConfig(next);
                triggerHapticFeedback('item_check', {
                  soundEnabled: next.soundEnabled,
                  hapticEnabled: next.hapticEnabled,
                });
              }}
              className={`w-12 h-7 rounded-full p-1 transition-colors flex items-center ${
                waterConfig.enabled ? 'bg-blue-600 justify-end' : 'bg-slate-400 justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-md" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] font-bold opacity-70 block mb-1.5">
                {isBn ? 'রিমাইন্ডার বিরতি (Interval)' : 'Reminder Interval'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {([30, 60, 90, 120] as const).map((mins) => (
                  <button
                    key={mins}
                    onClick={() => {
                      const next = {
                        ...waterConfig,
                        intervalMinutes: mins,
                        lastReminderTimestamp: Date.now(),
                      };
                      setWaterConfig(next);
                      saveWaterReminderConfig(next);
                      triggerHapticFeedback('item_check', {
                        soundEnabled: next.soundEnabled,
                        hapticEnabled: next.hapticEnabled,
                      });
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-black border transition-all ${
                      waterConfig.intervalMinutes === mins
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                        : darkMode
                        ? 'bg-slate-900 border-slate-700 text-slate-300'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    {mins === 30
                      ? isBn
                        ? '৩০ মিনিট পর'
                        : 'Every 30m'
                      : mins === 60
                      ? isBn
                        ? '১ ঘণ্টা পর'
                        : 'Every 1h'
                      : mins === 90
                      ? isBn
                        ? '১.৫ ঘণ্টা পর'
                        : 'Every 1.5h'
                      : isBn
                      ? '২ ঘণ্টা পর'
                      : 'Every 2h'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold opacity-70 block mb-1.5">
                {isBn ? 'সক্রিয় সময়সীমা (Active Window)' : 'Active Hours Window'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={waterConfig.startHour}
                  onChange={(e) => {
                    const next = { ...waterConfig, startHour: e.target.value };
                    setWaterConfig(next);
                    saveWaterReminderConfig(next);
                  }}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-black ${
                    darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                />
                <span className="text-xs font-bold opacity-50">{isBn ? 'থেকে' : 'to'}</span>
                <input
                  type="time"
                  value={waterConfig.endHour}
                  onChange={(e) => {
                    const next = { ...waterConfig, endHour: e.target.value };
                    setWaterConfig(next);
                    saveWaterReminderConfig(next);
                  }}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-black ${
                    darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold opacity-70 block mb-1.5">
                {isBn ? 'দৈনিক লক্ষ্য (Daily Target Glasses)' : 'Daily Target (Glasses)'}
              </label>
              <div className="flex items-center gap-2">
                {[8, 10, 12].map((target) => (
                  <button
                    key={target}
                    onClick={() => {
                      const next = { ...waterConfig, dailyTargetGlasses: target };
                      setWaterConfig(next);
                      saveWaterReminderConfig(next);
                      triggerHapticFeedback('item_check', {
                        soundEnabled: next.soundEnabled,
                        hapticEnabled: next.hapticEnabled,
                      });
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-black border ${
                      waterConfig.dailyTargetGlasses === target
                        ? 'bg-blue-600 text-white border-blue-500'
                        : darkMode
                        ? 'bg-slate-900 border-slate-700'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    {target} {isBn ? 'গ্লাস' : 'G'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Clinical 8-Glass Hydration Schedule */}
        <div className="space-y-3">
          <h5 className="font-black text-xs uppercase tracking-widest opacity-70">
            {isBn
              ? 'ক্লিনিক্যাল পানি পানের সময়সূচি (Clinical Hydration Schedule)'
              : 'Recommended Clinical Hydration Schedule'}
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {hydrationSlots.map((slot) => {
              const isDone = waterIntake >= slot.glassNumber;
              return (
                <div
                  key={slot.glassNumber}
                  onClick={() => {
                    if (!isDone) handleWaterChange(1);
                  }}
                  className={`p-4 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    isDone
                      ? darkMode
                        ? 'bg-blue-950/40 border-blue-500/40 text-blue-300'
                        : 'bg-blue-50/80 border-blue-200 text-blue-900'
                      : darkMode
                      ? 'bg-slate-800/70 border-slate-700 hover:border-blue-500/40'
                      : 'bg-white border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                        isDone
                          ? 'bg-blue-600 text-white shadow-sm'
                          : darkMode
                          ? 'bg-slate-700 text-slate-300'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {isDone ? '✓' : slot.time}
                    </div>
                    <div>
                      <p className="font-black text-xs md:text-sm">{slot.label}</p>
                      <p className="text-[11px] opacity-70">{slot.clinicalTip}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-500 shrink-0">
                    250 ml
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`p-6 md:p-8 rounded-[40px] border transition-all duration-300 relative ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 shadow-xl text-slate-900'
      }`}
    >
      {/* Floating Haptic Achievement Toast */}
      {hapticToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[120] w-[92%] max-w-md animate-in slide-in-from-bottom-5 duration-300 pointer-events-none">
          <div className="p-4 rounded-2xl bg-slate-900/95 text-white border border-emerald-500/50 shadow-2xl flex items-center gap-3.5 backdrop-blur-xl">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-2xl shrink-0 animate-bounce">
              {hapticToast.badge}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-black text-xs md:text-sm text-emerald-400 truncate">
                {hapticToast.message}
              </p>
              <p className="text-[11px] text-slate-300 truncate">{hapticToast.subtext}</p>
            </div>
          </div>
        </div>
      )}

      {/* Live Diet Alarm with Food Menu / Water Reminder Popup Modal */}
      {activeAlarmAlert && (
        <div className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className={`w-full max-w-lg rounded-[32px] border-2 p-6 shadow-2xl space-y-5 ${
              activeAlarmAlert.type === 'diet_meal'
                ? darkMode
                  ? 'bg-slate-900 border-emerald-500 text-white'
                  : 'bg-white border-emerald-500 text-slate-900'
                : darkMode
                ? 'bg-slate-900 border-blue-500 text-white'
                : 'bg-white border-blue-500 text-slate-900'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg animate-pulse ${
                    activeAlarmAlert.type === 'diet_meal' ? 'bg-emerald-600' : 'bg-blue-600'
                  }`}
                >
                  {activeAlarmAlert.type === 'diet_meal' ? (
                    <Utensils className="w-6 h-6" />
                  ) : (
                    <Droplets className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500">
                    {activeAlarmAlert.time} • {isBn ? 'হ্যাপটিক অ্যালার্ম সক্রিয়' : 'Haptic Alarm Active'}
                  </span>
                  <h4 className="text-lg font-black mt-1">
                    {isBn ? activeAlarmAlert.titleBn : activeAlarmAlert.titleEn}
                  </h4>
                </div>
              </div>
              <button
                onClick={() => setActiveAlarmAlert(null)}
                className="p-2 rounded-xl opacity-60 hover:opacity-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs md:text-sm font-bold opacity-85">
              {isBn ? activeAlarmAlert.subtitleBn : activeAlarmAlert.subtitleEn}
            </p>

            {/* Food Menu Items when it's a Diet Meal Alarm */}
            {activeAlarmAlert.mealAlarm && (
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                <div className="text-[11px] font-black uppercase tracking-wider text-emerald-500">
                  🍽️ {isBn ? 'আজকের এই বেলার খাবার মেনু:' : 'Scheduled Food Menu for This Meal:'}
                </div>
                {activeAlarmAlert.mealAlarm.menuItems.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl border ${
                      darkMode ? 'bg-slate-800 border-slate-700' : 'bg-emerald-50/60 border-emerald-200'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-black text-xs md:text-sm">{item.name}</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-500 shrink-0">
                        {item.calories}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-amber-500 mt-1">
                      ⚖️ {isBn ? 'পরিমাণ:' : 'Portion:'} {item.portion}
                    </p>
                    <p className="text-[11px] opacity-75 mt-0.5">✨ {item.benefit}</p>
                  </div>
                ))}

                <div
                  className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                    darkMode ? 'bg-blue-950/60 text-blue-300' : 'bg-blue-50 text-blue-800'
                  }`}
                >
                  <Droplets className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>
                    {isBn
                      ? activeAlarmAlert.mealAlarm.waterBeforeMealNoteBn
                      : activeAlarmAlert.mealAlarm.waterBeforeMealNoteEn}
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              {activeAlarmAlert.type === 'diet_meal' && activeAlarmAlert.mealAlarm ? (
                <button
                  onClick={() => handleMarkMealDoneFromAlarm(activeAlarmAlert.mealAlarm!)}
                  className="flex-1 py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                >
                  <CheckCircle className="w-4 h-4" />
                  {isBn ? 'খাবার সম্পন্ন (হ্যাপটিক চেক-ইন)' : 'Mark Meal Eaten (Haptic Check-in)'}
                </button>
              ) : (
                <button
                  onClick={() => {
                    handleWaterChange(1);
                    setActiveAlarmAlert(null);
                  }}
                  className="flex-1 py-3.5 px-5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                >
                  <Droplets className="w-4 h-4" />
                  {isBn ? '+১ গ্লাস পানি পান করেছি (250ml)' : '+1 Glass Water Drunk (250ml)'}
                </button>
              )}
              <button
                onClick={() => setActiveAlarmAlert(null)}
                className={`py-3.5 px-5 rounded-2xl font-black text-xs uppercase tracking-wider border ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                {isBn ? 'পরে মনে করান' : 'Dismiss'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header & Navigation Tabs */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">📋</span>
              {t.daily_checklist}
            </h3>
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
              <Smartphone className="w-3 h-3" />
              {isBn ? 'হ্যাপটিক ভাইব্রেশন সক্রিয়' : 'Haptic Feedback Ready'}
            </span>
          </div>
          <p className="text-xs opacity-60 mt-1">
            {isBn
              ? 'চেকলিস্ট পূরণ করলে হ্যাপটিক ভাইব্রেশন ফিডব্যাক পাবেন • সাথে ডায়েট মেনু অ্যালার্ম ও পানির রিমাইন্ডার সেট করুন'
              : 'Feel tactile haptic feedback on every check-in • Manage your mealtime food menu alarms & hydration reminders'}
          </p>
        </div>

        {/* Haptic & Sound quick toggles + Sub-tab Switcher */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <button
            onClick={() => {
              const next = { ...waterConfig, hapticEnabled: !waterConfig.hapticEnabled };
              setWaterConfig(next);
              saveWaterReminderConfig(next);
              if (next.hapticEnabled) {
                triggerHapticFeedback('item_check', {
                  soundEnabled: next.soundEnabled,
                  hapticEnabled: true,
                });
              }
            }}
            title={isBn ? 'হ্যাপটিক ভাইব্রেশন অন/অফ' : 'Toggle Haptic Vibration'}
            className={`px-3 py-2 rounded-xl text-[11px] font-black border flex items-center gap-1.5 transition-all ${
              waterConfig.hapticEnabled
                ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                : 'opacity-50 border-slate-500/30'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            {isBn ? 'ভাইব্রেশন' : 'Haptics'}
          </button>

          <button
            onClick={() => {
              const next = { ...waterConfig, soundEnabled: !waterConfig.soundEnabled };
              setWaterConfig(next);
              saveWaterReminderConfig(next);
            }}
            title={isBn ? 'অ্যালার্ম ও চেক-ইন সাউন্ড অন/অফ' : 'Toggle Sound Feedback'}
            className={`px-3 py-2 rounded-xl text-[11px] font-black border flex items-center gap-1.5 transition-all ${
              waterConfig.soundEnabled
                ? 'bg-blue-500/15 text-blue-500 border-blue-500/30'
                : 'opacity-50 border-slate-500/30'
            }`}
          >
            {waterConfig.soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
            {isBn ? 'সাউন্ড' : 'Sound'}
          </button>
          <button
            type="button"
            onClick={() => openStreakShareModal()}
            className="px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 border bg-emerald-600 text-white border-emerald-500 shadow-sm hover:bg-emerald-500 transition-all active:scale-95"
            title={isBn ? 'হোয়াটসঅ্যাপ বা ফেসবুকে স্ট্রিক শেয়ার করুন' : 'Share Streak to WhatsApp or Facebook'}
          >
            <Share2 className="w-3.5 h-3.5" />
            {isBn ? 'শেয়ার স্ট্রিক' : 'Share Streak'}
          </button>
        </div>
      </div>

      {/* 4-Tab Bar: Daily Checklist | Diet Alarm + Menu | Water Reminder | History */}
      <div
        className={`grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 rounded-2xl mb-8 ${
          darkMode ? 'bg-slate-800/90' : 'bg-slate-100'
        }`}
      >
        <button
          onClick={() => setActiveTab('log')}
          className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'log'
              ? 'bg-emerald-600 text-white shadow-lg'
              : 'opacity-65 hover:opacity-100'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          {isBn ? 'ডেইলি চেকলিস্ট' : 'Daily Check-in'}
        </button>
        <button
          onClick={() => setActiveTab('alarms')}
          className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'alarms'
              ? 'bg-emerald-600 text-white shadow-lg'
              : 'opacity-65 hover:opacity-100'
          }`}
        >
          <BellRing className="w-4 h-4" />
          {isBn ? 'ডায়েট অ্যালার্ম ও মেনু' : 'Diet Alarm & Menu'}
        </button>
        <button
          onClick={() => setActiveTab('water')}
          className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'water'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'opacity-65 hover:opacity-100'
          }`}
        >
          <Droplets className="w-4 h-4" />
          {isBn ? `পানির রিমাইন্ডার (${waterIntake}G)` : `Water Reminder (${waterIntake}G)`}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'history'
              ? 'bg-emerald-600 text-white shadow-lg'
              : 'opacity-65 hover:opacity-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          {t.view_history}
        </button>
      </div>

      <div className="flex-1">
        {activeTab === 'alarms' && renderDietAlarmsTab()}
        {activeTab === 'water' && renderWaterReminderTab()}
        {activeTab === 'history' && renderHistory()}

        {activeTab === 'log' && (
          <div className="space-y-8">
            {/* Achievement Progress Bar + Social Media Streak Sharing */}
            <div
              className={`p-5 rounded-3xl border space-y-4 ${
                darkMode
                  ? 'bg-slate-800/60 border-slate-700'
                  : 'bg-gradient-to-r from-emerald-50/80 to-teal-50/80 border-emerald-100'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <Sparkles className="w-4 h-4" />
                    {isBn
                      ? `আজকের অগ্রগতি: ${completedCount}/${items.length} সম্পন্ন • 🔥 ${streakDaysCount} দিনের স্ট্রিক`
                      : `Today's Progress: ${completedCount}/${items.length} Completed • 🔥 ${streakDaysCount}-Day Streak`}
                  </span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                    {currentProgressPercent}%
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-full"
                    style={{ width: `${currentProgressPercent}%` }}
                  />
                </div>
              </div>

              {/* Social Media Sharing Strip for Streaks & Milestones */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-emerald-500/20">
                <div className="text-xs font-bold opacity-85 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>
                    {isBn
                      ? 'আপনার ডেইলি কমপ্লায়েন্স স্ট্রিক ও মাইলস্টোন শেয়ার করুন:'
                      : 'Share your daily compliance streak & milestone achievement:'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openStreakShareModal()}
                    className="px-3.5 py-2 rounded-xl text-xs font-black bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <span>💬</span>
                    <span>WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openStreakShareModal()}
                    className="px-3.5 py-2 rounded-xl text-xs font-black bg-[#1877F2] hover:bg-[#166fe5] text-white shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <span>📘</span>
                    <span>Facebook</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openStreakShareModal()}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black border flex items-center gap-1.5 transition-all active:scale-95 ${
                      darkMode
                        ? 'bg-slate-900 border-slate-700 text-emerald-400 hover:bg-slate-800'
                        : 'bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{isBn ? 'সব শেয়ার অপশন' : 'All Share Options'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Diet Alarm & Water Reminder Strip inside Checklist */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div
                onClick={() => setActiveTab('alarms')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                  darkMode
                    ? 'bg-slate-800/70 border-emerald-500/30 hover:border-emerald-500'
                    : 'bg-emerald-50/60 border-emerald-200 hover:bg-emerald-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <BellRing className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h5 className="font-black text-xs md:text-sm truncate">
                      {isBn ? 'ডায়েট অ্যালার্ম ও ফুড মেনু' : 'Diet Alarms & Food Menu'}
                    </h5>
                    <p className="text-[11px] opacity-75 truncate">
                      {dietAlarms.filter((a) => a.enabled).length}{' '}
                      {isBn ? 'টি বেলার খাবার অ্যালার্ম চালু আছে' : 'active meal alarms with menu'}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 shrink-0">
                  {isBn ? 'মেনু দেখুন →' : 'Open →'}
                </span>
              </div>

              <div
                onClick={() => setActiveTab('water')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                  darkMode
                    ? 'bg-slate-800/70 border-blue-500/30 hover:border-blue-500'
                    : 'bg-blue-50/60 border-blue-200 hover:bg-blue-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Droplets className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h5 className="font-black text-xs md:text-sm truncate">
                      {isBn ? 'পানির রিমাইন্ডার ও হাইড্রেশন' : 'Water Reminder & Hydration'}
                    </h5>
                    <p className="text-[11px] opacity-75 truncate">
                      {isBn
                        ? `প্রতি ${waterConfig.intervalMinutes} মিনিটে রিমাইন্ডার • ${waterIntake}/${waterConfig.dailyTargetGlasses} গ্লাস`
                        : `Every ${waterConfig.intervalMinutes}m alert • ${waterIntake}/${waterConfig.dailyTargetGlasses} glasses`}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-black text-blue-600 dark:text-blue-400 shrink-0">
                  {isBn ? 'সেটিংস →' : 'Open →'}
                </span>
              </div>
            </div>

            {/* Checklist Items with Haptic Feedback */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-widest opacity-50 mb-4">
                {isBn
                  ? 'প্রটোকল চেকলিস্ট (ট্যাপ করলেই হ্যাপটিক ভাইব্রেশন)'
                  : 'Protocol Adherence (Tap for Haptic Check-in)'}
              </h4>
              {items.map((item) => {
                const isJustChecked = lastCheckedId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={`p-5 rounded-3xl border cursor-pointer transition-all flex items-center justify-between group ${
                      isJustChecked ? 'scale-[1.02] ring-4 ring-emerald-500/40' : ''
                    } ${
                      item.completed
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                        : darkMode
                        ? 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                        : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-sm font-bold pr-4 leading-relaxed">{item.label}</span>
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                        item.completed
                          ? 'bg-emerald-500 text-white scale-110 shadow-lg shadow-emerald-500/30'
                          : 'border-2 border-slate-300 dark:border-slate-600 group-hover:border-emerald-500'
                      }`}
                    >
                      {item.completed && <span className="text-sm font-black">✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Water Intake Counter with Haptic Ripple */}
            <div
              className={`p-6 rounded-3xl border ${
                darkMode ? 'bg-slate-800/30 border-slate-700' : 'bg-blue-50/50 border-blue-100'
              }`}
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <Droplets className="w-6 h-6 text-blue-500" />
                  <div>
                    <h4 className="font-black text-sm">{t.water_intake}</h4>
                    <p className="text-[10px] opacity-60">
                      {isBn
                        ? `লক্ষ্য: ${waterConfig.dailyTargetGlasses} গ্লাস (${waterConfig.dailyTargetGlasses * 250} মি.লি.)`
                        : `Target: ${waterConfig.dailyTargetGlasses} Glasses (${waterConfig.dailyTargetGlasses * 250} ml)`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleWaterChange(-1)}
                    className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-black text-lg shadow-sm active:scale-90 transition-all"
                  >
                    -
                  </button>
                  <span className="text-2xl font-black text-blue-600 w-8 text-center">
                    {waterIntake}
                  </span>
                  <button
                    onClick={() => handleWaterChange(1)}
                    className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-lg active:scale-90 transition-all"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="flex gap-1.5">
                {[...Array(waterConfig.dailyTargetGlasses)].map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-3 rounded-full transition-all ${
                      i < waterIntake
                        ? 'bg-blue-500 shadow-xs shadow-blue-500/50'
                        : darkMode
                        ? 'bg-slate-700'
                        : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Metrics: Weight, Energy, Digestion */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest opacity-60">
                  {t.log_weight}
                </label>
                <div
                  className={`flex items-center px-4 py-3 rounded-2xl border ${
                    darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <Scale className="w-5 h-5 opacity-50 mr-3" />
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(parseFloat(e.target.value) || '')}
                    placeholder="0.0"
                    className="bg-transparent w-full outline-none font-bold"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest opacity-60">
                  {t.log_energy}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={energyLevel}
                  onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <div className="flex justify-between text-xs opacity-50">
                  <span>Low</span>
                  <span className="font-bold text-emerald-500">{energyLevel}</span>
                  <span>High</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest opacity-60">
                  {t.log_digestion}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={digestionRating}
                  onChange={(e) => setDigestionRating(parseInt(e.target.value))}
                  className="w-full accent-purple-500"
                />
                <div className="flex justify-between text-xs opacity-50">
                  <span>Poor</span>
                  <span className="font-bold text-purple-500">{digestionRating}</span>
                  <span>Great</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest opacity-60">
                {t.log_notes}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t.log_notes_placeholder}
                className={`w-full p-4 rounded-2xl border min-h-[100px] outline-none focus:ring-2 ring-emerald-500/50 transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSubmit}
                className="flex-1 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[30px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <CheckCircle className="w-6 h-6" />
                {submitted
                  ? isBn
                    ? '✓ ডেইলি চেকলিস্ট আপডেট করুন (হ্যাপটিক ফিডব্যাক)'
                    : '✓ Update Daily Check-in (Haptic Feedback)'
                  : t.submit_checklist}
              </button>
              <button
                type="button"
                onClick={() => openStreakShareModal()}
                className="sm:w-auto px-6 py-5 bg-gradient-to-r from-[#25D366] to-[#1877F2] hover:opacity-95 text-white rounded-[30px] font-black text-xs uppercase tracking-wider shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2.5"
              >
                <Share2 className="w-5 h-5" />
                {isBn ? '🏆 স্ট্রিক শেয়ার (WhatsApp / FB)' : '🏆 Share Streak (WhatsApp / FB)'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Social Media Share Modal for Streaks & Milestones */}
      <SocialShareModal
        isOpen={Boolean(sharePayload)}
        onClose={() => setSharePayload(null)}
        payload={sharePayload}
        lang={lang}
        darkMode={darkMode}
      />
    </div>
  );
};

export default ProgressTracker;
