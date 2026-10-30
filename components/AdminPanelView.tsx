import React, { useState, useEffect } from 'react';
import {
  Language,
  ManualPaymentSubmission,
  NutritionistBooking,
  NutritionistProfileListing,
  SessionReadinessStatus,
  TrafficLightZone,
  User,
} from '../types';
import {
  loadPlatformState,
  subscribePlatformState,
  approveManualPaymentByAdmin,
  rejectManualPaymentByAdmin,
  reviewMarketplaceStoreByAdmin,
  reviewFoodSuggestionByAdmin,
  adminDeleteContentAndBanUser,
  adminUnbanUser,
  adminUpdateNutritionistStatus,
  adminUpdateNutritionistDetails,
  adminUpdatePaymentSubmission,
  adminUpdateBookingManagement,
  adminDispatchBookingReadinessAlert,
  pullFromFirestoreOrServer,
  getCloudflareD1SqlSchema,
  getCloudflareWorkerScript,
} from '../services/platformHubService';
import {
  formatByteSize,
} from '../services/imageCompressionService';
import ProfilePhotoCropModal from './ProfilePhotoCropModal';
import { ADMIN_EMAIL, signInWithGoogleAccount } from '../firebase';
import {
  Camera,
  Upload,
  Activity,
  AlertTriangle,
  Award,
  Ban,
  BarChart3,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Cloud,
  Copy,
  CreditCard,
  Database,
  Edit3,
  ExternalLink,
  Filter,
  LayoutGrid,
  List,
  Mail,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Star,
  Store,
  Trash2,
  TrendingUp,
  UserCheck,
  Utensils,
  Video,
  XCircle,
} from 'lucide-react';

interface Props {
  user: User | null;
  lang: Language;
  darkMode?: boolean;
  onUserUpdated?: (user: User) => void;
}

type AdminTab =
  | 'payments'
  | 'bookings'
  | 'nutritionists'
  | 'stores'
  | 'foods'
  | 'moderation'
  | 'cloudflare';

const AdminPanelView: React.FC<Props> = ({ user, lang, darkMode, onUserUpdated }) => {
  const isBn = lang === 'bn';
  const [state, setState] = useState(() => loadPlatformState());
  const [activeTab, setActiveTab] = useState<AdminTab>('payments');
  const [emailModalData, setEmailModalData] = useState<{
    to: string;
    subject: string;
    body: string;
    payment: ManualPaymentSubmission;
  } | null>(null);
  const [customMeetLinks, setCustomMeetLinks] = useState<Record<string, string>>({});
  const [foodZoneOverrides, setFoodZoneOverrides] = useState<Record<string, TrafficLightZone>>({});
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [syncingCloud, setSyncingCloud] = useState(false);

  // Booking Management Sub-Section State
  const [bookingFilter, setBookingFilter] = useState<
    'all' | 'active' | 'pending_payment' | 'session_ready' | 'completed'
  >('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<
    'all' | 'verified' | 'pending' | 'rejected'
  >('all');
  const [bookingSearchQuery, setBookingSearchQuery] = useState('');
  const [bookingNotesDraft, setBookingNotesDraft] = useState<Record<string, string>>({});
  const [bookingScheduleDraft, setBookingScheduleDraft] = useState<
    Record<string, { date: string; slot: string }>
  >({});
  const [selectedSlotFilter, setSelectedSlotFilter] = useState<string>('all');
  const [dispatchedAlertBookingId, setDispatchedAlertBookingId] = useState<string | null>(null);

  // Toggleable Calendar View & Schedule Conflict Overlay State
  const [bookingViewMode, setBookingViewMode] = useState<'split' | 'calendar' | 'list'>('split');
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<string>(
    () => loadPlatformState().bookings[0]?.appointmentDate || new Date().toISOString().split('T')[0]
  );
  const [calendarDateScope, setCalendarDateScope] = useState<'selected_date' | 'all_dates'>(
    'selected_date'
  );
  const [calendarNutritionistFilter, setCalendarNutritionistFilter] = useState<string>('all');
  const [calendarStatusMessage, setCalendarStatusMessage] = useState<string | null>(null);

  // Admin Panel Data & Pricing Editor Modals State
  const [editingBooking, setEditingBooking] = useState<{
    id: string;
    patientName: string;
    patientPhone: string;
    patientEmail: string;
    healthConcern: string;
    nutritionistId: string;
    appointmentDate: string;
    appointmentSlot: string;
    consultationFeeBdt: number;
    durationMinutes: number;
    sessionRating: number;
    senderNumber: string;
    transactionId: string;
    adminNotes: string;
  } | null>(null);

  const [editingNutritionist, setEditingNutritionist] = useState<{
    id: string;
    fullNameBn: string;
    fullNameEn: string;
    roleTitleBn: string;
    roleTitleEn: string;
    specialtyBn: string;
    specialtyEn: string;
    institutionBn: string;
    institutionEn: string;
    experienceYears: number;
    consultationFeeBdt: number;
    availableDaysBn: string;
    availableDaysEn: string;
    availableSlotsText: string;
    defaultMeetUrl: string;
    phone: string;
    email: string;
    licenseNumber: string;
    photoUrl?: string;
    photoCompressionNote?: string;
  } | null>(null);
  const [pendingAdminCropFile, setPendingAdminCropFile] = useState<File | null>(null);

  const [editingPayment, setEditingPayment] = useState<{
    id: string;
    userName: string;
    userEmail: string;
    planName: string;
    amountBdt: number;
    senderNumber: string;
    transactionId: string;
    notes: string;
  } | null>(null);

  useEffect(() => {
    return subscribePlatformState((st) => {
      setState(st);
    });
  }, []);

  const pendingPaymentsCount = state.payments.filter((p) => p.status === 'pending').length;
  const pendingBookingsCount = state.bookings.filter((b) => b.status === 'pending_admin').length;
  const activeBookingsCount = state.bookings.filter(
    (b) => b.status === 'pending_admin' || b.status === 'confirmed_for_nutritionist'
  ).length;
  const readySessionsCount = state.bookings.filter((b) => {
    const r =
      b.sessionReadiness ||
      (b.status === 'confirmed_for_nutritionist' ? 'ready_for_session' : 'awaiting_payment');
    return r === 'ready_for_session' || r === 'in_progress';
  }).length;
  const verifiedBookingsRevenueBdt = state.bookings
    .filter(
      (b) =>
        b.paymentStatus === 'verified' ||
        b.status === 'confirmed_for_nutritionist' ||
        b.status === 'completed'
    )
    .reduce((acc, b) => acc + (b.consultationFeeBdt || 0), 0);
  const pendingNutritionistsCount = state.nutritionists.filter((n) => n.status === 'pending').length;
  const pendingStoresCount = state.stores.filter((s) => s.status === 'pending').length;
  const pendingFoodsCount = state.foodSuggestions.filter((f) => f.status === 'pending').length;
  const pendingReportsCount = state.moderationIncidents.filter(
    (m) => m.status === 'pending_review'
  ).length;

  const getResolvedPaymentStatus = (
    bk: NutritionistBooking
  ): 'verified' | 'pending' | 'rejected' => {
    if (bk.paymentStatus) return bk.paymentStatus;
    if (bk.status === 'confirmed_for_nutritionist' || bk.status === 'completed') return 'verified';
    if (bk.status === 'rejected') return 'rejected';
    return 'pending';
  };

  const getResolvedSessionReadiness = (bk: NutritionistBooking): SessionReadinessStatus => {
    if (bk.sessionReadiness) return bk.sessionReadiness;
    if (bk.status === 'completed') return 'completed';
    if (bk.status === 'confirmed_for_nutritionist') return 'ready_for_session';
    return 'awaiting_payment';
  };

  // Nutritionist Productivity Telemetry Helpers (derived from current booking data)
  const getResolvedBookingDurationMinutes = (bk: NutritionistBooking): number => {
    if (typeof bk.durationMinutes === 'number' && bk.durationMinutes > 0) {
      return bk.durationMinutes;
    }
    if (bk.consultationFeeBdt >= 1000) return 60;
    return 45;
  };

  const getResolvedBookingRating = (bk: NutritionistBooking): number => {
    if (typeof bk.sessionRating === 'number' && bk.sessionRating > 0) {
      return bk.sessionRating;
    }
    const assignedNutri = state.nutritionists.find((n) => n.id === bk.nutritionistId);
    if (assignedNutri && assignedNutri.rating > 0) {
      return assignedNutri.rating;
    }
    return 4.9;
  };

  const nonRejectedBookings = state.bookings.filter(
    (b) => b.status !== 'rejected' && getResolvedPaymentStatus(b) !== 'rejected'
  );

  const totalConsultationMinutes = nonRejectedBookings.reduce(
    (sum, bk) => sum + getResolvedBookingDurationMinutes(bk),
    0
  );
  const totalConsultationHours = Number((totalConsultationMinutes / 60).toFixed(1));

  const verifiedConsultationMinutes = nonRejectedBookings
    .filter(
      (bk) =>
        getResolvedPaymentStatus(bk) === 'verified' ||
        bk.status === 'confirmed_for_nutritionist' ||
        bk.status === 'completed'
    )
    .reduce((sum, bk) => sum + getResolvedBookingDurationMinutes(bk), 0);
  const verifiedConsultationHours = Number((verifiedConsultationMinutes / 60).toFixed(1));

  const averageSessionDurationMinutes =
    nonRejectedBookings.length > 0
      ? Math.round(totalConsultationMinutes / nonRejectedBookings.length)
      : 45;

  const averageSessionRating =
    nonRejectedBookings.length > 0
      ? Number(
          (
            nonRejectedBookings.reduce((sum, bk) => sum + getResolvedBookingRating(bk), 0) /
            nonRejectedBookings.length
          ).toFixed(2)
        )
      : 4.9;

  // Compute Popular Time Slots from current booking data
  const popularTimeSlots = (() => {
    const slotMap = new Map<
      string,
      { slot: string; count: number; totalMinutes: number; verifiedCount: number }
    >();
    nonRejectedBookings.forEach((bk) => {
      const slotKey = (bk.appointmentSlot || '06:00 PM').trim();
      const existing = slotMap.get(slotKey) || {
        slot: slotKey,
        count: 0,
        totalMinutes: 0,
        verifiedCount: 0,
      };
      existing.count += 1;
      existing.totalMinutes += getResolvedBookingDurationMinutes(bk);
      if (getResolvedPaymentStatus(bk) === 'verified') {
        existing.verifiedCount += 1;
      }
      slotMap.set(slotKey, existing);
    });

    const totalCount = Math.max(1, nonRejectedBookings.length);
    return Array.from(slotMap.values())
      .sort((a, b) => b.count - a.count || b.totalMinutes - a.totalMinutes)
      .map((item) => ({
        ...item,
        sharePercent: Math.round((item.count / totalCount) * 100),
        hours: Number((item.totalMinutes / 60).toFixed(1)),
      }));
  })();

  // Per-Nutritionist Productivity Breakdown
  const nutritionistProductivityList = (() => {
    const map = new Map<
      string,
      {
        nutritionistId: string;
        nameBn: string;
        nameEn: string;
        bookingsCount: number;
        verifiedCount: number;
        totalMinutes: number;
        ratingSum: number;
        slots: Record<string, number>;
      }
    >();

    nonRejectedBookings.forEach((bk) => {
      const current = map.get(bk.nutritionistId) || {
        nutritionistId: bk.nutritionistId,
        nameBn: bk.nutritionistNameBn,
        nameEn: bk.nutritionistNameEn,
        bookingsCount: 0,
        verifiedCount: 0,
        totalMinutes: 0,
        ratingSum: 0,
        slots: {},
      };
      current.bookingsCount += 1;
      if (getResolvedPaymentStatus(bk) === 'verified') {
        current.verifiedCount += 1;
      }
      current.totalMinutes += getResolvedBookingDurationMinutes(bk);
      current.ratingSum += getResolvedBookingRating(bk);
      const s = bk.appointmentSlot || '06:00 PM';
      current.slots[s] = (current.slots[s] || 0) + 1;
      map.set(bk.nutritionistId, current);
    });

    return Array.from(map.values())
      .map((item) => {
        const topSlotEntry = Object.entries(item.slots).sort((a, b) => b[1] - a[1])[0];
        return {
          ...item,
          hours: Number((item.totalMinutes / 60).toFixed(1)),
          avgRating: Number((item.ratingSum / Math.max(1, item.bookingsCount)).toFixed(2)),
          topSlot: topSlotEntry ? topSlotEntry[0] : '06:00 PM',
        };
      })
      .sort((a, b) => b.totalMinutes - a.totalMinutes);
  })();

  const getReadinessProgressPercent = (readiness: SessionReadinessStatus): number => {
    switch (readiness) {
      case 'awaiting_payment':
        return 20;
      case 'payment_verified':
        return 45;
      case 'room_configured':
        return 75;
      case 'ready_for_session':
        return 100;
      case 'in_progress':
        return 100;
      case 'completed':
        return 100;
      default:
        return 20;
    }
  };

  const handleDispatchReadiness = (bookingId: string) => {
    adminDispatchBookingReadinessAlert(bookingId);
    setDispatchedAlertBookingId(bookingId);
    setTimeout(() => {
      setDispatchedAlertBookingId((prev) => (prev === bookingId ? null : prev));
    }, 3000);
  };

  // Parse time strings like '10:30 AM', '06:00 PM' into minutes since midnight for chronological sorting
  const parseTimeSlotToMinutes = (slotStr: string): number => {
    const clean = (slotStr || '').trim().toUpperCase();
    const match = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
    if (!match) return 9999;
    let hours = parseInt(match[1], 10);
    const mins = parseInt(match[2], 10);
    const period = match[3];
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + mins;
  };

  const openBookingEditor = (bk: NutritionistBooking) => {
    setEditingBooking({
      id: bk.id,
      patientName: bk.patientName,
      patientPhone: bk.patientPhone,
      patientEmail: bk.patientEmail,
      healthConcern: bk.healthConcern,
      nutritionistId: bk.nutritionistId,
      appointmentDate: bk.appointmentDate,
      appointmentSlot: bk.appointmentSlot,
      consultationFeeBdt: bk.consultationFeeBdt,
      durationMinutes: getResolvedBookingDurationMinutes(bk),
      sessionRating: getResolvedBookingRating(bk),
      senderNumber: bk.senderNumber,
      transactionId: bk.transactionId,
      adminNotes: bk.adminNotes || '',
    });
  };

  const openNutritionistEditor = (nutri: NutritionistProfileListing) => {
    setEditingNutritionist({
      id: nutri.id,
      fullNameBn: nutri.fullNameBn,
      fullNameEn: nutri.fullNameEn,
      roleTitleBn: nutri.roleTitleBn,
      roleTitleEn: nutri.roleTitleEn,
      specialtyBn: nutri.specialtyBn,
      specialtyEn: nutri.specialtyEn,
      institutionBn: nutri.institutionBn,
      institutionEn: nutri.institutionEn,
      experienceYears: nutri.experienceYears,
      consultationFeeBdt: nutri.consultationFeeBdt,
      availableDaysBn: nutri.availableDaysBn,
      availableDaysEn: nutri.availableDaysEn,
      availableSlotsText: (nutri.availableSlots || []).join(', '),
      defaultMeetUrl: nutri.defaultMeetUrl || 'https://meet.google.com/new',
      phone: nutri.phone,
      email: nutri.email,
      licenseNumber: nutri.licenseNumber,
      photoUrl: nutri.photoUrl,
    });
  };

  const openPaymentEditor = (pay: ManualPaymentSubmission) => {
    setEditingPayment({
      id: pay.id,
      userName: pay.userName,
      userEmail: pay.userEmail,
      planName: pay.planName,
      amountBdt: pay.amountBdt,
      senderNumber: pay.senderNumber,
      transactionId: pay.transactionId,
      notes: pay.notes || '',
    });
  };

  // Calendar Schedule Overlay Telemetry (Master Slots, Schedule Gaps & Double-Bookings)
  const calendarOverlayData = (() => {
    const displayedNutritionists =
      calendarNutritionistFilter === 'all'
        ? state.nutritionists
        : state.nutritionists.filter((n) => n.id === calendarNutritionistFilter);

    const bookingsInScope = nonRejectedBookings.filter((bk) =>
      calendarDateScope === 'all_dates' ? true : bk.appointmentDate === calendarSelectedDate
    );

    // Collect all unique time slots from nutritionists' availableSlots + bookings
    const slotSet = new Set<string>();
    displayedNutritionists.forEach((n) => {
      (n.availableSlots || []).forEach((s) => {
        if (s && s.trim()) slotSet.add(s.trim());
      });
    });
    bookingsInScope.forEach((bk) => {
      if (bk.appointmentSlot && bk.appointmentSlot.trim()) {
        slotSet.add(bk.appointmentSlot.trim());
      }
    });

    const masterSlots = Array.from(slotSet).sort(
      (a, b) => parseTimeSlotToMinutes(a) - parseTimeSlotToMinutes(b)
    );

    // Build per-nutritionist schedule map, open gaps, and double-booking conflicts
    const doubleBookings: {
      nutritionist: NutritionistProfileListing;
      slot: string;
      bookings: NutritionistBooking[];
      suggestedGapSlot?: string;
    }[] = [];

    let totalScheduleGaps = 0;
    let totalOccupiedSlots = 0;

    const nutritionistColumns = displayedNutritionists.map((nutri) => {
      const nutriBookings = bookingsInScope.filter((bk) => bk.nutritionistId === nutri.id);
      const standardSlots = new Set<string>((nutri.availableSlots || []).map((s) => s.trim()));

      // Identify open gaps for this nutritionist first so conflicts can suggest a gap
      const openGapSlots: string[] = Array.from(standardSlots).filter(
        (slot) => !nutriBookings.some((bk) => (bk.appointmentSlot || '').trim() === slot)
      );

      totalScheduleGaps += openGapSlots.length;

      const slotCells = masterSlots.map((slot) => {
        const matchingBookings = nutriBookings.filter(
          (bk) => (bk.appointmentSlot || '').trim() === slot
        );
        const isStandardAvailable = standardSlots.has(slot);
        const isDoubleBooked = matchingBookings.length > 1;
        const isGap = isStandardAvailable && matchingBookings.length === 0;

        if (matchingBookings.length > 0) {
          totalOccupiedSlots += 1;
        }

        if (isDoubleBooked) {
          doubleBookings.push({
            nutritionist: nutri,
            slot,
            bookings: matchingBookings,
            suggestedGapSlot: openGapSlots[0],
          });
        }

        return {
          slot,
          matchingBookings,
          isStandardAvailable,
          isDoubleBooked,
          isGap,
        };
      });

      return {
        nutritionist: nutri,
        nutriBookings,
        openGapSlots,
        slotCells,
      };
    });

    // Collect distinct dates for quick date switcher strip
    const todayIso = new Date().toISOString().split('T')[0];
    const tomorrowDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const dayAfterDate = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];
    const dateSet = new Set<string>([todayIso, tomorrowDate, dayAfterDate]);
    state.bookings.forEach((bk) => {
      if (bk.appointmentDate) dateSet.add(bk.appointmentDate);
    });
    const quickDates = Array.from(dateSet).sort();

    return {
      displayedNutritionists,
      bookingsInScope,
      masterSlots,
      nutritionistColumns,
      doubleBookings,
      totalScheduleGaps,
      totalOccupiedSlots,
      quickDates,
    };
  })();

  const handleResolveConflictToGap = (bookingId: string, targetSlot: string) => {
    adminUpdateBookingManagement(bookingId, {
      appointmentSlot: targetSlot,
    });
    setCalendarStatusMessage(
      isBn
        ? `✓ বুকিং ${bookingId}-কে ফাঁকা স্লট (${targetSlot})-এ স্থানান্তর করে ডাবল-বুকিং সমাধান করা হয়েছে!`
        : `✓ Resolved conflict: Moved ${bookingId} to open gap slot (${targetSlot})!`
    );
    setTimeout(() => setCalendarStatusMessage(null), 4000);
  };

  const handleApprovePayment = async (payment: ManualPaymentSubmission) => {
    const customLink = payment.relatedBookingId
      ? customMeetLinks[payment.relatedBookingId]
      : undefined;
    const res = await approveManualPaymentByAdmin(payment.id, customLink);
    if (res.payment) {
      setEmailModalData({
        to: res.payment.userEmail,
        subject: res.emailSubject,
        body: res.emailBody,
        payment: res.payment,
      });

      if (
        user &&
        res.payment.userEmail.toLowerCase() === user.email?.toLowerCase() &&
        onUserUpdated
      ) {
        onUserUpdated({ ...user, isPro: true });
      }
    }
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCloudSync = async () => {
    setSyncingCloud(true);
    await pullFromFirestoreOrServer();
    setTimeout(() => setSyncingCloud(false), 600);
  };

  const isVerifiedAdmin = Boolean(
    user?.isAdmin && user?.firebaseUid && user?.email && user.email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()
  );

  const handleAdminGoogleSignIn = async () => {
    try {
      const fbUser = await signInWithGoogleAccount();
      const matchedAdmin =
        Boolean(fbUser.email) &&
        fbUser.email!.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
      if (onUserUpdated) {
        onUserUpdated({
          id: user?.id || `USR-${fbUser.uid.slice(0, 6)}`,
          name: fbUser.displayName || user?.name || 'User',
          email: fbUser.email || '',
          photoUrl: fbUser.photoURL || undefined,
          firebaseUid: fbUser.uid,
          isPro: matchedAdmin ? true : user?.isPro,
          isAdmin: matchedAdmin,
          trialStartDate: user?.trialStartDate || new Date().toISOString(),
          points: user?.points || 150,
          badges: user?.badges || [],
        });
      }
    } catch (err) {
      console.error('Google Sign-In error:', err);
    }
  };

  if (!isVerifiedAdmin) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 animate-in fade-in duration-300">
        <div
          className={`p-8 rounded-[32px] border-2 text-center space-y-4 shadow-xl ${
            darkMode
              ? 'bg-slate-900 border-slate-800 text-white'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/15 text-indigo-500 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold">
            {isBn
              ? 'অ্যাডমিন ফিচার শুধুমাত্র অ্যাডমিন Google মেইল লগইনের জন্য সংরক্ষিত'
              : 'Admin Features Require Admin Google Account Login'}
          </h2>
          <p className="text-xs opacity-75 leading-relaxed">
            {isBn
              ? 'আপনার ইউজার প্রোফাইলে গিয়ে অ্যাডমিনের অনুমোদিত Google ইমেইল দিয়ে লগইন করলে কেবল অ্যাডমিন প্যানেল ও ফিচারগুলো উন্মুক্ত হবে।'
              : 'Please sign in with the authorized Admin Google account inside your User Profile to unlock Admin features.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-28">
      {/* Admin Top Header */}
      <div
        className={`p-6 md:p-8 rounded-[36px] border-2 relative overflow-hidden shadow-2xl ${
          darkMode
            ? 'bg-gradient-to-r from-slate-900 via-indigo-950/60 to-emerald-950/50 border-indigo-500/40'
            : 'bg-gradient-to-r from-indigo-50 via-white to-emerald-50 border-indigo-200'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isBn ? 'অ্যাডমিন কন্ট্রোল প্যানেল' : 'Admin Control Panel'}</span>
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                Admin: {ADMIN_EMAIL}
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/30">
                Cloudflare Free-Tier D1 + Firebase Active
              </span>
            </div>

            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
              {isBn
                ? 'অ্যাডমিন গেটওয়ে ও প্ল্যাটফর্ম গভর্ন্যান্স'
                : 'Admin Gateway & Platform Governance'}
            </h1>
            <p className="text-xs md:text-sm opacity-75 max-w-3xl">
              {isBn
                ? 'ম্যানুয়াল পেমেন্ট ও প্রিমিয়াম মেইল নোটিফিকেশন, পুষ্টিবিদ বুকিং ও Google Meet, মার্কেটপ্লেস স্টোর রেজিস্ট্রেশন, ফুড সাজেশন বক্স এবং কমিউনিটি মডারেশন ও ইউজার ব্যান এখান থেকে নিয়ন্ত্রণ করুন।'
                : 'Approve manual payments with email dispatch, activate nutritionist bookings with Google Meet, verify marketplace stores, approve food suggestions, and moderate community posts.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {(!user || user.email?.toLowerCase() !== ADMIN_EMAIL) && (
              <button
                onClick={handleAdminGoogleSignIn}
                className="px-4 py-2.5 rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-md text-xs font-extrabold flex items-center gap-2 hover:bg-slate-50"
              >
                <span>🔐</span>
                <span>{isBn ? 'Google (Admin) সাইন-ইন' : 'Google Admin Sign-In'}</span>
              </button>
            )}
            <button
              onClick={handleCloudSync}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg"
            >
              <RefreshCw className={`w-4 h-4 ${syncingCloud ? 'animate-spin' : ''}`} />
              <span>{isBn ? 'ডাটাবেস সিঙ্ক' : 'Sync DB'}</span>
            </button>
          </div>
        </div>

        {/* Summary KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
          {[
            {
              label: isBn ? 'পেন্ডিং পেমেন্ট' : 'Pending Payments',
              val: pendingPaymentsCount,
              color: 'text-amber-500',
              tab: 'payments' as AdminTab,
            },
            {
              label: isBn ? 'বুকিং ম্যানেজমেন্ট' : 'Booking Management',
              val: activeBookingsCount,
              color: 'text-teal-500',
              tab: 'bookings' as AdminTab,
            },
            {
              label: isBn ? 'পুষ্টিবিদ আবেদন' : 'Dietitian Requests',
              val: pendingNutritionistsCount,
              color: 'text-blue-500',
              tab: 'nutritionists' as AdminTab,
            },
            {
              label: isBn ? 'স্টোর আবেদন' : 'Store Requests',
              val: pendingStoresCount,
              color: 'text-purple-500',
              tab: 'stores' as AdminTab,
            },
            {
              label: isBn ? 'নতুন খাবার সাজেশন' : 'Food Suggestions',
              val: pendingFoodsCount,
              color: 'text-emerald-500',
              tab: 'foods' as AdminTab,
            },
            {
              label: isBn ? 'রিপোর্ট ও ব্যান' : 'Reports & Bans',
              val: pendingReportsCount,
              color: 'text-rose-500',
              tab: 'moderation' as AdminTab,
            },
          ].map((stat) => (
            <button
              key={stat.tab}
              onClick={() => setActiveTab(stat.tab)}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                activeTab === stat.tab
                  ? 'border-indigo-500 bg-indigo-500/10 shadow-md'
                  : darkMode
                  ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  : 'bg-white border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className={`text-2xl font-black ${stat.color}`}>{stat.val}</div>
              <div className="text-[11px] font-bold opacity-75">{stat.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation Pill Bar */}
      <div className="flex flex-wrap gap-2">
        {[
          {
            id: 'payments' as AdminTab,
            icon: CreditCard,
            labelBn: '১. পেমেন্ট ও প্রিমিয়াম মেইল',
            labelEn: '1. Payments & Email',
            badge: pendingPaymentsCount,
          },
          {
            id: 'bookings' as AdminTab,
            icon: Calendar,
            labelBn: '২. বুকিং ম্যানেজমেন্ট (Booking Management)',
            labelEn: '2. Booking Management',
            badge: activeBookingsCount,
          },
          {
            id: 'nutritionists' as AdminTab,
            icon: Award,
            labelBn: '৩. ফিচার্ড ডায়েটিশিয়ান অনুমোদন',
            labelEn: '3. Featured Dietitians',
            badge: pendingNutritionistsCount,
          },
          {
            id: 'stores' as AdminTab,
            icon: Store,
            labelBn: '৪. মার্কেটপ্লেস স্টোর অ্যাপ্রুভাল',
            labelEn: '4. Marketplace Stores',
            badge: pendingStoresCount,
          },
          {
            id: 'foods' as AdminTab,
            icon: Utensils,
            labelBn: '৫. ফুড সাজেশন বক্স',
            labelEn: '5. Food Suggestions',
            badge: pendingFoodsCount,
          },
          {
            id: 'moderation' as AdminTab,
            icon: ShieldAlert,
            labelBn: '৬. কমিউনিটি মডারেশন ও ব্যান',
            labelEn: '6. Community & Ban',
            badge: pendingReportsCount,
          },
          {
            id: 'cloudflare' as AdminTab,
            icon: Cloud,
            labelBn: '৭. Cloudflare ফ্রি ডাটাবেস',
            labelEn: '7. Cloudflare Free Tier DB',
            badge: 0,
          },
        ].map((tItem) => {
          const Icon = tItem.icon;
          const active = activeTab === tItem.id;
          return (
            <button
              key={tItem.id}
              onClick={() => setActiveTab(tItem.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                active
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                  : darkMode
                  ? 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{isBn ? tItem.labelBn : tItem.labelEn}</span>
              {tItem.badge > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
                  {tItem.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: MANUAL PAYMENTS & SUBSCRIPTION EMAIL APPROVAL */}
      {/* ===================================================================== */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold">
              {isBn
                ? '💳 ম্যানুয়াল পেমেন্ট ও প্রিমিয়াম সাবস্ক্রিপশন অ্যাপ্রুভাল'
                : '💳 Manual Payment & Premium Subscription Approvals'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {state.payments.map((pay) => (
              <div
                key={pay.id}
                className={`p-6 rounded-3xl border-2 space-y-4 ${
                  pay.status === 'pending'
                    ? darkMode
                      ? 'bg-slate-900 border-amber-500/40'
                      : 'bg-amber-50/40 border-amber-300'
                    : pay.status === 'approved'
                    ? darkMode
                      ? 'bg-slate-900 border-emerald-500/40'
                      : 'bg-emerald-50/40 border-emerald-300'
                    : darkMode
                    ? 'bg-slate-900 border-slate-800 opacity-60'
                    : 'bg-white border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          pay.status === 'pending'
                            ? 'bg-amber-500 text-slate-950'
                            : pay.status === 'approved'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-red-500 text-white'
                        }`}
                      >
                        {pay.status === 'pending'
                          ? isBn
                            ? 'পেন্ডিং (অ্যাপ্রুভালের অপেক্ষায়)'
                            : 'Pending Approval'
                          : pay.status === 'approved'
                          ? isBn
                            ? '✓ অ্যাপ্রুভড ও মেইল পাঠানো হয়েছে'
                            : '✓ Approved & Email Sent'
                          : isBn
                          ? 'বাতিল'
                          : 'Rejected'}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-500/15 text-indigo-500">
                        {pay.method.toUpperCase()}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold mt-2">{pay.userName}</h3>
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      ✉️ {pay.userEmail}
                    </p>
                  </div>

                  <div className="text-right tabular-nums">
                    <div className="text-2xl font-black text-amber-500">৳{pay.amountBdt}</div>
                    <div className="text-[10px] font-mono opacity-60">{pay.id}</div>
                    <button
                      type="button"
                      onClick={() => openPaymentEditor(pay)}
                      className={`mt-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-extrabold inline-flex items-center gap-1 transition-all ${
                        darkMode
                          ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{isBn ? 'ডাটা ও ফি এডিট' : 'Edit Data & Fee'}</span>
                    </button>
                  </div>
                </div>

                <div
                  className={`p-3.5 rounded-2xl text-xs space-y-1.5 ${
                    darkMode ? 'bg-slate-800/80' : 'bg-white border border-slate-200/70'
                  }`}
                >
                  <div className="flex justify-between">
                    <span className="opacity-65">{isBn ? 'প্ল্যান / সার্ভিস:' : 'Plan:'}</span>
                    <span className="font-bold">{pay.planName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-65">{isBn ? 'প্রেরকের নম্বর:' : 'Sender Number:'}</span>
                    <span className="font-mono font-bold">{pay.senderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-65">{isBn ? 'ট্রানজেকশন আইডি (TrxID):' : 'TrxID:'}</span>
                    <span className="font-mono font-black text-amber-600 dark:text-amber-400">
                      {pay.transactionId}
                    </span>
                  </div>
                  {pay.notes && (
                    <div className="pt-1 border-t border-slate-200/60 dark:border-slate-700 text-[11px] italic opacity-80">
                      "{pay.notes}"
                    </div>
                  )}
                </div>

                {pay.status === 'pending' ? (
                  <div className="flex flex-wrap gap-2.5 pt-1">
                    <button
                      onClick={() => handleApprovePayment(pay)}
                      className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {isBn
                          ? 'অ্যাপ্রুভ করুন ও কনফার্মেশন মেইল পাঠান'
                          : 'Approve & Send Confirmation Email'}
                      </span>
                    </button>
                    <button
                      onClick={() => rejectManualPaymentByAdmin(pay.id)}
                      className="py-3 px-4 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-500 font-extrabold text-xs flex items-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>{isBn ? 'বাতিল' : 'Reject'}</span>
                    </button>
                  </div>
                ) : (
                  pay.status === 'approved' && (
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" />
                        {isBn
                          ? 'ইউজারের কাছে প্রিমিয়াম অ্যাপ্রুভাল মেইল পাঠানো হয়েছে'
                          : 'Approval email dispatched to user'}
                      </span>
                      <a
                        href={`mailto:${encodeURIComponent(pay.userEmail)}?subject=${encodeURIComponent(
                          pay.approvalEmailSubject || 'Premium Subscription Approved'
                        )}&body=${encodeURIComponent(pay.approvalEmailBody || '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-extrabold text-indigo-500 underline flex items-center gap-1"
                      >
                        <span>{isBn ? 'পুনরায় মেইল খুলুন' : 'Open in Mail'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* DEDICATED SUB-SECTION: BOOKING MANAGEMENT (ACTIVE CONSULTATIONS)      */}
      {/* ===================================================================== */}
      {activeTab === 'bookings' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Sub-Section Header & Clinical Workflow Banner */}
          <div
            className={`p-6 rounded-3xl border ${
              darkMode
                ? 'bg-slate-900 border-slate-800 text-white'
                : 'bg-white border-slate-200 text-slate-900 shadow-sm'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-500 text-[11px] font-black uppercase tracking-wider">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {isBn
                      ? 'Booking Management • কনসালটেশন কন্ট্রোল সেন্টার'
                      : 'Booking Management • Consultation Control Center'}
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-black tracking-tight">
                  {isBn
                    ? 'ইউজার ও পুষ্টিবিদ কনসালটেশন অ্যাপয়েন্টমেন্ট ট্র্যাকার'
                    : 'Active User & Nutritionist Consultation Appointments'}
                </h2>
                <p className="text-xs opacity-75 max-w-3xl">
                  {isBn
                    ? 'রোগী ও ক্লিনিক্যাল ডায়েটিশিয়ানদের মধ্যকার সক্রিয় অ্যাপয়েন্টমেন্ট, পেমেন্ট স্ট্যাটাস, শিডিউল গ্যাপ, সম্ভাব্য ডাবল-বুকিং ও কনসালটেশন ফি এখান থেকে রিয়েল-টাইমে পরিচালনা করুন।'
                    : 'Monitor and manage active consultation appointments, overlay nutritionist schedules to spot gaps and double-bookings, and edit booking or dietitian pricing in real time.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {/* Toggleable Calendar View Switcher */}
                <div
                  className={`p-1 rounded-2xl border flex items-center gap-1 ${
                    darkMode
                      ? 'bg-slate-950/80 border-slate-800'
                      : 'bg-slate-100 border-slate-200/80'
                  }`}
                >
                  {[
                    {
                      id: 'split' as const,
                      icon: LayoutGrid,
                      labelBn: 'ক্যালেন্ডার + তালিকা',
                      labelEn: 'Calendar + List',
                    },
                    {
                      id: 'calendar' as const,
                      icon: Calendar,
                      labelBn: 'শিডিউল ক্যালেন্ডার ভিউ',
                      labelEn: 'Schedule Calendar',
                    },
                    {
                      id: 'list' as const,
                      icon: List,
                      labelBn: 'শুধু কার্ড তালিকা',
                      labelEn: 'Card List Only',
                    },
                  ].map((mode) => {
                    const ModeIcon = mode.icon;
                    const active = bookingViewMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setBookingViewMode(mode.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                          active
                            ? 'bg-teal-600 text-white shadow-sm'
                            : darkMode
                            ? 'text-slate-400 hover:text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <ModeIcon className="w-3.5 h-3.5" />
                        <span>{isBn ? mode.labelBn : mode.labelEn}</span>
                      </button>
                    );
                  })}
                </div>

                <div
                  className={`px-3.5 py-2 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                    darkMode
                      ? 'bg-slate-800/90 border-slate-700 text-slate-200'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="whitespace-nowrap tabular-nums">
                    {isBn
                      ? `সেশন প্রস্তুত: ${readySessionsCount}/${state.bookings.length}`
                      : `Sessions Ready: ${readySessionsCount}/${state.bookings.length}`}
                  </span>
                </div>
              </div>
            </div>

            {/* 4 Booking Management Telemetry KPIs (Tabular Numerals) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5">
              <div
                className={`p-4 rounded-2xl border ${
                  darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/80 border-slate-200/80'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold opacity-70">
                  <span>{isBn ? 'সক্রিয় কনসালটেশন' : 'Active Appointments'}</span>
                  <Calendar className="w-4 h-4 text-teal-500" />
                </div>
                <div className="text-2xl font-black text-teal-500 mt-1 tabular-nums">
                  {activeBookingsCount}
                </div>
                <div className="text-[11px] opacity-70 mt-0.5 tabular-nums">
                  {isBn
                    ? `মোট বুকিং: ${state.bookings.length}টি`
                    : `Total logged: ${state.bookings.length} bookings`}
                </div>
              </div>

              <div
                className={`p-4 rounded-2xl border ${
                  darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/80 border-slate-200/80'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold opacity-70">
                  <span>{isBn ? 'পেমেন্ট ভেরিফিকেশন' : 'Payment Status'}</span>
                  <CreditCard className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-emerald-500 tabular-nums">
                    {
                      state.bookings.filter((b) => getResolvedPaymentStatus(b) === 'verified')
                        .length
                    }{' '}
                    {isBn ? 'ভেরিফাইড' : 'Verified'}
                  </span>
                  <span className="text-xs font-extrabold text-amber-500 tabular-nums">
                    • {pendingBookingsCount} {isBn ? 'পেন্ডিং' : 'Pending'}
                  </span>
                </div>
                <div className="text-[11px] opacity-70 mt-0.5 tabular-nums">
                  {isBn
                    ? `ভেরিফাইড কনসালটেশন ফি: ৳${verifiedBookingsRevenueBdt.toLocaleString()}`
                    : `Verified Consultation Fee: ৳${verifiedBookingsRevenueBdt.toLocaleString()}`}
                </div>
              </div>

              <div
                className={`p-4 rounded-2xl border ${
                  darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/80 border-slate-200/80'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold opacity-70">
                  <span>{isBn ? 'সেশন রেডিনেস (Meet)' : 'Session Readiness'}</span>
                  <Video className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="text-2xl font-black text-indigo-500 mt-1 tabular-nums">
                  {readySessionsCount}{' '}
                  <span className="text-xs font-extrabold text-emerald-500">
                    {isBn ? 'সেশন প্রস্তুত / লাইভ' : 'Ready / Live'}
                  </span>
                </div>
                <div className="text-[11px] opacity-70 mt-0.5 tabular-nums">
                  {isBn
                    ? `${
                        state.bookings.filter(
                          (b) => getResolvedSessionReadiness(b) === 'in_progress'
                        ).length
                      }টি লাইভ সেশন চলমান`
                    : `${
                        state.bookings.filter(
                          (b) => getResolvedSessionReadiness(b) === 'in_progress'
                        ).length
                      } live session(s) in progress`}
                </div>
              </div>

              <div
                className={`p-4 rounded-2xl border ${
                  darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/80 border-slate-200/80'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold opacity-70">
                  <span>{isBn ? 'সম্পন্ন ও আর্কাইভ' : 'Completed Sessions'}</span>
                  <UserCheck className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-black text-emerald-500 mt-1 tabular-nums">
                  {
                    state.bookings.filter(
                      (b) =>
                        b.status === 'completed' ||
                        getResolvedSessionReadiness(b) === 'completed'
                    ).length
                  }
                </div>
                <div className="text-[11px] opacity-70 mt-0.5">
                  {isBn
                    ? 'পুষ্টিবিদ ও রোগীর ফলো-আপ রেকর্ডকৃত'
                    : 'Clinical consultation follow-up logged'}
                </div>
              </div>
            </div>
          </div>

          {/* NUTRITIONIST PRODUCTIVITY SUMMARY DASHBOARD */}
          <div
            className={`p-5 md:p-6 rounded-3xl border space-y-5 ${
              darkMode
                ? 'bg-slate-900/95 border-teal-500/30'
                : 'bg-white border-teal-200 shadow-sm'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200/70 dark:border-slate-800 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-teal-500">
                  <BarChart3 className="w-4 h-4" />
                  <span>
                    {isBn
                      ? 'পুষ্টিবিদ প্রোডাক্টিভিটি সামারি ড্যাশবোর্ড'
                      : 'Nutritionist Productivity Summary Dashboard'}
                  </span>
                </div>
                <h3 className="text-base md:text-lg font-black mt-0.5">
                  {isBn
                    ? 'কনসালটেশন ঘণ্টা, গড় সেশন রেটিং এবং জনপ্রিয় টাইম স্লট বিশ্লেষণ'
                    : 'Consultation Hours, Average Session Ratings & Popular Time Slots'}
                </h3>
                <p className="text-xs opacity-70 mt-0.5">
                  {isBn
                    ? 'বর্তমান বুকিং ডাটার ওপর ভিত্তি করে পুষ্টিবিদদের কর্মঘণ্টা, রোগীদের সন্তুষ্টি এবং ব্যস্ততম স্লটগুলো রিয়েল-টাইমে পর্যবেক্ষণ করুন।'
                    : 'Real-time productivity telemetry derived from active and completed booking records to optimize dietitian scheduling.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                {selectedSlotFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedSlotFilter('all')}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30 text-xs font-extrabold flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {isBn
                        ? `স্লট ফিল্টার: ${selectedSlotFilter} (রিসেট)`
                        : `Slot Filter: ${selectedSlotFilter} (Reset)`}
                    </span>
                  </button>
                )}
                <div
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 tabular-nums ${
                    darkMode
                      ? 'bg-slate-950 border-slate-800 text-teal-400'
                      : 'bg-teal-50/80 border-teal-200 text-teal-800'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 text-teal-500" />
                  <span>
                    {isBn
                      ? `${nutritionistProductivityList.length} জন সক্রিয় পুষ্টিবিদ • ${nonRejectedBookings.length}টি সেশন`
                      : `${nutritionistProductivityList.length} Active Dietitians • ${nonRejectedBookings.length} Sessions`}
                  </span>
                </div>
              </div>
            </div>

            {/* 3 Primary Productivity Pillars: Total Consultation Hours | Average Session Ratings | Popular Time Slots */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* PILLAR 1: Total Consultation Hours */}
              <div
                className={`p-4 rounded-2xl border flex flex-col justify-between space-y-4 ${
                  darkMode
                    ? 'bg-slate-950/70 border-slate-800'
                    : 'bg-slate-50/70 border-slate-200/80'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-teal-500">
                      {isBn ? '১. মোট কনসালটেশন ঘণ্টা' : '1. Total Consultation Hours'}
                    </span>
                    <span className="p-2 rounded-xl bg-teal-500/10 text-teal-500">
                      <Clock className="w-4 h-4" />
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2 tabular-nums">
                    <span className="text-3xl font-black text-teal-500">
                      {totalConsultationHours}
                    </span>
                    <span className="text-sm font-extrabold opacity-80">
                      {isBn ? 'ঘণ্টা (Hours)' : 'hrs total'}
                    </span>
                    <span className="text-xs opacity-60 font-mono">
                      ({totalConsultationMinutes} {isBn ? 'মিনিট' : 'mins'})
                    </span>
                  </div>

                  <p className="text-[11px] opacity-75">
                    {isBn
                      ? `প্রতি সেশনে গড় সময় ${averageSessionDurationMinutes} মিনিট • ভেরিফাইড সেশন ঘণ্টা: ${verifiedConsultationHours} ঘণ্টা`
                      : `Avg ${averageSessionDurationMinutes} mins/session • Verified active/completed: ${verifiedConsultationHours} hrs`}
                  </p>
                </div>

                {/* Hours Breakdown Progress & Stats */}
                <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center justify-between text-[11px] font-bold tabular-nums">
                    <span className="opacity-75">
                      {isBn ? 'ভেরিফাইড বনাম মোট ঘণ্টা:' : 'Verified vs Scheduled Hours:'}
                    </span>
                    <span className="text-emerald-500 font-black">
                      {totalConsultationMinutes > 0
                        ? Math.round((verifiedConsultationMinutes / totalConsultationMinutes) * 100)
                        : 0}
                      % {isBn ? 'ভেরিফাইড' : 'Verified'}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-teal-500 transition-all duration-300"
                      style={{
                        width: `${
                          totalConsultationMinutes > 0
                            ? Math.min(
                                100,
                                Math.round(
                                  (verifiedConsultationMinutes / totalConsultationMinutes) * 100
                                )
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] tabular-nums">
                    <div
                      className={`p-2 rounded-xl border ${
                        darkMode
                          ? 'bg-slate-900 border-slate-800'
                          : 'bg-white border-slate-200/80'
                      }`}
                    >
                      <div className="opacity-60">{isBn ? 'নিশ্চিত ঘণ্টা' : 'Verified Hours'}</div>
                      <div className="font-black text-emerald-500">
                        {verifiedConsultationHours} {isBn ? 'ঘণ্টা' : 'hrs'}
                      </div>
                    </div>
                    <div
                      className={`p-2 rounded-xl border ${
                        darkMode
                          ? 'bg-slate-900 border-slate-800'
                          : 'bg-white border-slate-200/80'
                      }`}
                    >
                      <div className="opacity-60">{isBn ? 'গড় সেশন দৈর্ঘ্য' : 'Avg Session'}</div>
                      <div className="font-black text-indigo-500">
                        {averageSessionDurationMinutes} {isBn ? 'মিনিট' : 'mins'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PILLAR 2: Average Session Ratings */}
              <div
                className={`p-4 rounded-2xl border flex flex-col justify-between space-y-4 ${
                  darkMode
                    ? 'bg-slate-950/70 border-slate-800'
                    : 'bg-slate-50/70 border-slate-200/80'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-500">
                      {isBn ? '২. গড় সেশন রেটিং' : '2. Average Session Ratings'}
                    </span>
                    <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                      <Star className="w-4 h-4 fill-amber-500" />
                    </span>
                  </div>

                  <div className="flex items-center gap-3 tabular-nums">
                    <span className="text-3xl font-black text-amber-500">
                      {averageSessionRating.toFixed(2)}
                    </span>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {[1, 2, 3, 4, 5].map((starIdx) => (
                          <Star
                            key={starIdx}
                            className={`w-3.5 h-3.5 ${
                              starIdx <= Math.round(averageSessionRating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'opacity-30'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="text-[11px] font-bold opacity-75">
                        {isBn
                          ? `৫.০০ স্কেলে (${nonRejectedBookings.length}টি সেশন মূল্যায়ন)`
                          : `Out of 5.0 (${nonRejectedBookings.length} sessions evaluated)`}
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] opacity-75">
                    {isBn
                      ? 'রোগীদের কনসালটেশন ফিডব্যাক এবং ক্লিনিক্যাল সেশন কোয়ালিটি স্কোর।'
                      : 'Aggregated from patient consultation feedback and clinical session quality scores.'}
                  </p>
                </div>

                {/* Per-Nutritionist Rating Snapshot */}
                <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                  <div className="text-[11px] font-bold opacity-75">
                    {isBn
                      ? 'পুষ্টিবিদ অনুযায়ী সেশন রেটিং ও ঘণ্টা:'
                      : 'Dietitian Productivity & Rating Leaderboard:'}
                  </div>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {nutritionistProductivityList.map((np) => (
                      <div
                        key={np.nutritionistId}
                        className={`px-2.5 py-1.5 rounded-xl border text-xs flex items-center justify-between gap-2 tabular-nums ${
                          darkMode
                            ? 'bg-slate-900 border-slate-800'
                            : 'bg-white border-slate-200/80'
                        }`}
                      >
                        <div className="truncate font-bold">
                          {isBn ? np.nameBn : np.nameEn}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-500 text-[10px] font-black">
                            {np.hours}h ({np.bookingsCount})
                          </span>
                          <span className="flex items-center gap-0.5 font-black text-amber-500">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {np.avgRating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* PILLAR 3: Popular Time Slots */}
              <div
                className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 ${
                  darkMode
                    ? 'bg-slate-950/70 border-slate-800'
                    : 'bg-slate-50/70 border-slate-200/80'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-indigo-500">
                      {isBn ? '৩. জনপ্রিয় কনসালটেশন টাইম স্লট' : '3. Popular Time Slots'}
                    </span>
                    <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                      <Calendar className="w-4 h-4" />
                    </span>
                  </div>

                  {popularTimeSlots.length > 0 && (
                    <div className="flex items-baseline justify-between gap-2 tabular-nums">
                      <div>
                        <span className="text-[11px] font-bold opacity-65 block">
                          {isBn ? 'সবচেয়ে জনপ্রিয় স্লট (Peak Slot):' : 'Peak Demand Time Slot:'}
                        </span>
                        <span className="text-2xl font-black text-indigo-500">
                          {popularTimeSlots[0].slot}
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-xl bg-indigo-500/15 text-indigo-400 text-xs font-black">
                        {popularTimeSlots[0].count} {isBn ? 'টি বুকিং' : 'Bookings'} (
                        {popularTimeSlots[0].sharePercent}%)
                      </span>
                    </div>
                  )}
                </div>

                {/* Interactive Time Slot Distribution List (Click to Filter Bookings) */}
                <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase opacity-65">
                    <span>
                      {isBn
                        ? 'স্লটে ক্লিক করে বুকিং ফিল্টার করুন'
                        : 'Click any slot to filter bookings below'}
                    </span>
                    <span>{isBn ? 'বুকিং ও শেয়ার' : 'Count & Share'}</span>
                  </div>
                  <div className="space-y-1.5">
                    {popularTimeSlots.map((slotItem, idx) => {
                      const isSelected = selectedSlotFilter === slotItem.slot;
                      return (
                        <button
                          key={slotItem.slot}
                          type="button"
                          onClick={() =>
                            setSelectedSlotFilter(isSelected ? 'all' : slotItem.slot)
                          }
                          className={`w-full p-2 rounded-xl border text-left transition-all space-y-1 tabular-nums ${
                            isSelected
                              ? 'bg-indigo-600/15 border-indigo-500 text-indigo-400'
                              : darkMode
                              ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                              : 'bg-white border-slate-200/80 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs font-extrabold">
                            <span className="flex items-center gap-1.5">
                              <span
                                className={`w-4 h-4 rounded-md text-[10px] font-black inline-flex items-center justify-center ${
                                  idx === 0
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-500/20 text-slate-400'
                                }`}
                              >
                                #{idx + 1}
                              </span>
                              <span className="font-mono">{slotItem.slot}</span>
                            </span>
                            <span className="text-[11px] font-bold">
                              {slotItem.count} {isBn ? 'টি সেশন' : 'sessions'} • {slotItem.hours}h (
                              {slotItem.sharePercent}%)
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                idx === 0 ? 'bg-indigo-500' : 'bg-teal-500'
                              }`}
                              style={{ width: `${Math.max(12, slotItem.sharePercent)}%` }}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search & Segmented Filter Toolbar */}
          <div
            className={`p-4 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            {/* Segmented Readiness / Lifecycle Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                {
                  id: 'all' as const,
                  labelBn: 'সব অ্যাপয়েন্টমেন্ট',
                  labelEn: 'All Bookings',
                  count: state.bookings.length,
                },
                {
                  id: 'active' as const,
                  labelBn: 'সক্রিয় কনসালটেশন',
                  labelEn: 'Active Appointments',
                  count: activeBookingsCount,
                },
                {
                  id: 'pending_payment' as const,
                  labelBn: 'পেমেন্ট যাচাই বাকি',
                  labelEn: 'Pending Payment',
                  count: state.bookings.filter((b) => getResolvedPaymentStatus(b) === 'pending')
                    .length,
                },
                {
                  id: 'session_ready' as const,
                  labelBn: 'সেশন প্রস্তুত / লাইভ',
                  labelEn: 'Session Ready / Live',
                  count: readySessionsCount,
                },
                {
                  id: 'completed' as const,
                  labelBn: 'সম্পন্ন সেশন',
                  labelEn: 'Completed',
                  count: state.bookings.filter(
                    (b) =>
                      b.status === 'completed' || getResolvedSessionReadiness(b) === 'completed'
                  ).length,
                },
              ].map((flt) => (
                <button
                  key={flt.id}
                  onClick={() => setBookingFilter(flt.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                    bookingFilter === flt.id
                      ? 'bg-teal-600 text-white shadow-sm'
                      : darkMode
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{isBn ? flt.labelBn : flt.labelEn}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] font-black tabular-nums ${
                      bookingFilter === flt.id
                        ? 'bg-white/20 text-white'
                        : darkMode
                        ? 'bg-slate-900 text-slate-400'
                        : 'bg-white text-slate-600'
                    }`}
                  >
                    {flt.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Right Controls: Payment Filter + Search Box */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 opacity-60" />
                <select
                  value={paymentStatusFilter}
                  onChange={(e) =>
                    setPaymentStatusFilter(
                      e.target.value as 'all' | 'verified' | 'pending' | 'rejected'
                    )
                  }
                  className={`px-3 py-2 rounded-xl border text-xs font-bold ${
                    darkMode
                      ? 'bg-slate-800 border-slate-700 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="all">
                    {isBn ? 'পেমেন্ট: সব স্ট্যাটাস' : 'Payment: All Statuses'}
                  </option>
                  <option value="verified">
                    {isBn ? '✓ পেমেন্ট ভেরিফাইড' : '✓ Payment Verified'}
                  </option>
                  <option value="pending">
                    {isBn ? '⏳ পেমেন্ট পেন্ডিং' : '⏳ Payment Pending'}
                  </option>
                  <option value="rejected">
                    {isBn ? '✕ পেমেন্ট বাতিল' : '✕ Payment Rejected'}
                  </option>
                </select>
              </div>

              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                <input
                  type="text"
                  value={bookingSearchQuery}
                  onChange={(e) => setBookingSearchQuery(e.target.value)}
                  placeholder={
                    isBn
                      ? 'রোগী, পুষ্টিবিদ, BK-ID বা TrxID খুঁজুন...'
                      : 'Search patient, dietitian, BK-ID or TrxID...'
                  }
                  className={`w-full pl-8 pr-3 py-2 rounded-xl border text-xs font-medium ${
                    darkMode
                      ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* TOGGLEABLE NUTRITIONIST SCHEDULE CALENDAR & CONFLICT OVERLAY          */}
          {/* ===================================================================== */}
          {(bookingViewMode === 'calendar' || bookingViewMode === 'split') && (
            <div
              className={`p-5 md:p-6 rounded-3xl border space-y-5 ${
                darkMode
                  ? 'bg-slate-900 border-slate-800 text-white'
                  : 'bg-white border-slate-200 text-slate-900 shadow-sm'
              }`}
            >
              {/* Calendar Top Bar: Title, Date Picker, Quick Dates & Nutritionist Selector */}
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-slate-200/70 dark:border-slate-800">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-500 text-[10px] font-black uppercase tracking-wider">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {isBn
                          ? 'পুষ্টিবিদ শিডিউল ক্যালেন্ডার ওভারলে'
                          : 'Nutritionist Schedule Calendar Overlay'}
                      </span>
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tabular-nums ${
                        calendarOverlayData.doubleBookings.length > 0
                          ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                          : 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                      }`}
                    >
                      {calendarOverlayData.doubleBookings.length > 0
                        ? isBn
                          ? `⚠️ ${calendarOverlayData.doubleBookings.length}টি ডাবল-বুকিং কনফ্লিক্ট শনাক্ত`
                          : `⚠️ ${calendarOverlayData.doubleBookings.length} Double-Booking Conflict(s)`
                        : isBn
                        ? '✓ কোনো ডাবল-বুকিং নেই'
                        : '✓ Zero Double-Bookings'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-500 border border-teal-500/30 text-[10px] font-black uppercase tabular-nums">
                      {isBn
                        ? `🟢 ${calendarOverlayData.totalScheduleGaps}টি ফাঁকা স্লট (Schedule Gaps)`
                        : `🟢 ${calendarOverlayData.totalScheduleGaps} Open Schedule Gaps`}
                    </span>
                  </div>
                  <h3 className="text-base md:text-lg font-black tracking-tight">
                    {isBn
                      ? 'পুষ্টিবিদ ভিত্তিক অ্যাপয়েন্টমেন্ট ক্যালেন্ডার, শিডিউল গ্যাপ ও ডাবল-বুকিং ডিটেক্টর'
                      : 'Multi-Nutritionist Schedule Matrix, Gap Finder & Double-Booking Detector'}
                  </h3>
                  <p className="text-xs opacity-70">
                    {isBn
                      ? 'প্রতিটি পুষ্টিবিদের নির্ধারিত স্লটের সাথে বুক করা অ্যাপয়েন্টমেন্ট ওভারলে করে ফাঁকা স্লট (Schedule Gaps) এবং একই সময়ে একাধিক বুকিং (Double-Bookings) শনাক্ত ও এডিট করুন।'
                      : 'Overlay scheduled appointments across each nutritionist to identify open schedule gaps, resolve potential double-bookings, and edit consultation pricing or data.'}
                  </p>
                </div>

                {/* Date & Nutritionist Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Date Scope Toggle */}
                  <div
                    className={`p-1 rounded-xl border flex items-center gap-1 ${
                      darkMode
                        ? 'bg-slate-950 border-slate-800'
                        : 'bg-slate-100 border-slate-200'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setCalendarDateScope('selected_date')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all ${
                        calendarDateScope === 'selected_date'
                          ? 'bg-indigo-600 text-white'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {isBn ? 'নির্দিষ্ট তারিখ' : 'Selected Date'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalendarDateScope('all_dates')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all ${
                        calendarDateScope === 'all_dates'
                          ? 'bg-indigo-600 text-white'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {isBn ? 'সব তারিখ ওভারলে' : 'Overlay All Dates'}
                    </button>
                  </div>

                  {/* Date Input & Quick Date Pills */}
                  {calendarDateScope === 'selected_date' && (
                    <input
                      type="date"
                      value={calendarSelectedDate}
                      onChange={(e) => setCalendarSelectedDate(e.target.value)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold tabular-nums ${
                        darkMode
                          ? 'bg-slate-950 border-slate-700 text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  )}

                  {/* Nutritionist Filter Dropdown */}
                  <select
                    value={calendarNutritionistFilter}
                    onChange={(e) => setCalendarNutritionistFilter(e.target.value)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold ${
                      darkMode
                        ? 'bg-slate-950 border-slate-700 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="all">
                      {isBn ? 'সব পুষ্টিবিদ (All Nutritionists)' : 'All Nutritionists'}
                    </option>
                    {state.nutritionists.map((n) => (
                      <option key={n.id} value={n.id}>
                        {isBn ? n.fullNameBn : n.fullNameEn} (৳{n.consultationFeeBdt})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Date Strip & Legend */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {calendarDateScope === 'selected_date' ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold opacity-70 mr-1">
                      {isBn ? 'দ্রুত তারিখ নির্বাচন:' : 'Quick Dates:'}
                    </span>
                    {calendarOverlayData.quickDates.map((dt) => {
                      const countOnDate = nonRejectedBookings.filter(
                        (b) => b.appointmentDate === dt
                      ).length;
                      const isSelected = calendarSelectedDate === dt;
                      return (
                        <button
                          key={dt}
                          type="button"
                          onClick={() => setCalendarSelectedDate(dt)}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold font-mono tabular-nums flex items-center gap-1.5 border transition-all ${
                            isSelected
                              ? 'bg-teal-600 text-white border-teal-500 shadow-sm'
                              : darkMode
                              ? 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span>{dt}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : countOnDate > 0
                                ? 'bg-teal-500/20 text-teal-500'
                                : 'opacity-50'
                            }`}
                          >
                            {countOnDate}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-xs font-bold text-indigo-400">
                    {isBn
                      ? 'সব তারিখের অ্যাপয়েন্টমেন্ট একত্রে টাইম-স্লটে ওভারলে করা হচ্ছে'
                      : 'Showing all scheduled appointments overlaid across time slots'}
                  </div>
                )}

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
                    <span>{isBn ? 'ডাবল-বুকিং (Conflict)' : 'Double-Booking Conflict'}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" />
                    <span>{isBn ? 'বুক করা সেশন (Booked)' : 'Scheduled Session'}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm border border-dashed border-emerald-500 bg-emerald-500/20 inline-block" />
                    <span>{isBn ? 'ফাঁকা স্লট (Schedule Gap)' : 'Schedule Gap (Open)'}</span>
                  </span>
                </div>
              </div>

              {/* Status Feedback Banner */}
              {calendarStatusMessage && (
                <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-xs font-extrabold flex items-center justify-between">
                  <span>{calendarStatusMessage}</span>
                  <button
                    type="button"
                    onClick={() => setCalendarStatusMessage(null)}
                    className="text-[11px] underline opacity-80"
                  >
                    {isBn ? 'বন্ধ করুন' : 'Dismiss'}
                  </button>
                </div>
              )}

              {/* Potential Double-Booking Alert Banner with 1-Click Auto-Resolve */}
              {calendarOverlayData.doubleBookings.length > 0 && (
                <div
                  className={`p-4 rounded-2xl border space-y-3 ${
                    darkMode
                      ? 'bg-rose-950/25 border-rose-500/40 text-rose-200'
                      : 'bg-rose-50/80 border-rose-300 text-rose-950'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-black text-rose-500 uppercase tracking-wider">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>
                        {isBn
                          ? `সম্ভাব্য ডাবল-বুকিং সতর্কতা (${calendarOverlayData.doubleBookings.length}টি স্লটে একাধিক অ্যাপয়েন্টমেন্ট)`
                          : `Potential Double-Booking Alert (${calendarOverlayData.doubleBookings.length} Slot Conflict Detected)`}
                      </span>
                    </div>
                    <span className="text-[11px] opacity-80">
                      {isBn
                        ? 'যেকোনো একটি অ্যাপয়েন্টমেন্ট ফাঁকা স্লটে (Schedule Gap) স্থানান্তর করুন বা এডিট করুন'
                        : 'Reassign conflicting booking to an open schedule gap or edit slot/nutritionist'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {calendarOverlayData.doubleBookings.map((conflict, idx) => (
                      <div
                        key={`${conflict.nutritionist.id}-${conflict.slot}-${idx}`}
                        className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2.5 text-xs ${
                          darkMode
                            ? 'bg-slate-900/90 border-rose-500/30'
                            : 'bg-white border-rose-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-extrabold text-sm">
                              {isBn
                                ? conflict.nutritionist.fullNameBn
                                : conflict.nutritionist.fullNameEn}
                            </div>
                            <div className="text-[11px] font-mono font-bold text-rose-500 tabular-nums">
                              ⏰ {conflict.slot} • {conflict.bookings.length}{' '}
                              {isBn ? 'টি বুকিং একসাথে' : 'overlapping bookings'}
                            </div>
                          </div>
                          {conflict.suggestedGapSlot && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-500 text-[10px] font-black tabular-nums">
                              {isBn
                                ? `প্রস্তাবিত ফাঁকা স্লট: ${conflict.suggestedGapSlot}`
                                : `Next Open Gap: ${conflict.suggestedGapSlot}`}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          {conflict.bookings.map((cbk) => (
                            <div
                              key={cbk.id}
                              className={`p-2 rounded-lg border flex flex-wrap items-center justify-between gap-2 ${
                                darkMode
                                  ? 'bg-slate-950 border-slate-800'
                                  : 'bg-slate-50 border-slate-200/70'
                              }`}
                            >
                              <div className="tabular-nums">
                                <span className="font-mono font-black text-amber-500 mr-1.5">
                                  {cbk.id}
                                </span>
                                <span className="font-bold">{cbk.patientName}</span>
                                <span className="opacity-70 ml-1.5">
                                  (৳{cbk.consultationFeeBdt})
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {conflict.suggestedGapSlot && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleResolveConflictToGap(
                                        cbk.id,
                                        conflict.suggestedGapSlot!
                                      )
                                    }
                                    className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-extrabold whitespace-nowrap"
                                  >
                                    {isBn
                                      ? `↪ ${conflict.suggestedGapSlot}-এ নিন`
                                      : `↪ Move to ${conflict.suggestedGapSlot}`}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => openBookingEditor(cbk)}
                                  className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-extrabold inline-flex items-center gap-1"
                                >
                                  <Edit3 className="w-2.5 h-2.5" />
                                  <span>{isBn ? 'এডিট' : 'Edit'}</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Schedule Calendar Overlay Matrix (Time Slots × Nutritionists) */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <table className="w-full text-left border-collapse min-w-[760px]">
                  <thead>
                    <tr
                      className={`border-b text-xs ${
                        darkMode
                          ? 'bg-slate-950/90 border-slate-800 text-slate-300'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <th className="p-3.5 font-black uppercase tracking-wider w-36 border-r border-slate-200/70 dark:border-slate-800">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-teal-500" />
                          <span>{isBn ? 'টাইম স্লট' : 'Time Slot'}</span>
                        </div>
                      </th>
                      {calendarOverlayData.nutritionistColumns.map((col) => (
                        <th
                          key={col.nutritionist.id}
                          className="p-3.5 align-top border-r last:border-r-0 border-slate-200/70 dark:border-slate-800 min-w-[230px]"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{col.nutritionist.avatarEmoji}</span>
                              <div>
                                <div className="font-extrabold text-xs md:text-sm text-slate-900 dark:text-white">
                                  {isBn
                                    ? col.nutritionist.fullNameBn
                                    : col.nutritionist.fullNameEn}
                                </div>
                                <div className="text-[11px] font-bold text-teal-500 tabular-nums">
                                  {isBn ? 'কনসালটেশন ফি:' : 'Fee:'} ৳
                                  {col.nutritionist.consultationFeeBdt} •{' '}
                                  {col.nutriBookings.length}{' '}
                                  {isBn ? 'বুকড' : 'Booked'} / {col.openGapSlots.length}{' '}
                                  {isBn ? 'ফাঁকা' : 'Open'}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => openNutritionistEditor(col.nutritionist)}
                              className={`px-2 py-1 rounded-lg border text-[10px] font-extrabold inline-flex items-center gap-1 shrink-0 transition-all ${
                                darkMode
                                  ? 'bg-slate-900 border-slate-700 text-amber-400 hover:bg-slate-800'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                              title={
                                isBn
                                  ? 'পুষ্টিবিদের তথ্য, স্লট ও ফি এডিট করুন'
                                  : 'Edit Nutritionist Data, Slots & Fee'
                              }
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>{isBn ? 'ফি ও স্লট এডিট' : 'Edit Fee/Data'}</span>
                            </button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/80 text-xs">
                    {calendarOverlayData.masterSlots.map((slot) => (
                      <tr
                        key={slot}
                        className={
                          darkMode ? 'hover:bg-slate-950/40' : 'hover:bg-slate-50/70'
                        }
                      >
                        {/* Row Header: Time Slot */}
                        <td className="p-3.5 font-mono font-black tabular-nums align-top border-r border-slate-200/70 dark:border-slate-800">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-500 border border-teal-500/20">
                            <Clock className="w-3 h-3" />
                            <span>{slot}</span>
                          </div>
                        </td>

                        {/* Per-Nutritionist Overlay Cell */}
                        {calendarOverlayData.nutritionistColumns.map((col) => {
                          const cell = col.slotCells.find((c) => c.slot === slot);
                          if (!cell) return <td key={col.nutritionist.id} className="p-3" />;

                          // CASE 1: DOUBLE-BOOKING CONFLICT (2+ bookings in same slot)
                          if (cell.isDoubleBooked) {
                            return (
                              <td
                                key={col.nutritionist.id}
                                className="p-3 align-top border-r last:border-r-0 border-slate-200/70 dark:border-slate-800 bg-rose-500/5"
                              >
                                <div className="p-3 rounded-xl border border-rose-500/50 bg-rose-500/10 space-y-2">
                                  <div className="flex items-center justify-between text-[10px] font-black uppercase text-rose-500">
                                    <span className="flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3" />
                                      {isBn
                                        ? `ডাবল-বুকিং (${cell.matchingBookings.length})`
                                        : `Double-Booked (${cell.matchingBookings.length})`}
                                    </span>
                                    {col.openGapSlots[0] && (
                                      <span className="text-emerald-500 tabular-nums">
                                        {isBn
                                          ? `গ্যাপ: ${col.openGapSlots[0]}`
                                          : `Gap: ${col.openGapSlots[0]}`}
                                      </span>
                                    )}
                                  </div>

                                  {cell.matchingBookings.map((bk) => (
                                    <div
                                      key={bk.id}
                                      className={`p-2 rounded-lg border space-y-1.5 ${
                                        darkMode
                                          ? 'bg-slate-900 border-slate-800'
                                          : 'bg-white border-slate-200'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-1 tabular-nums">
                                        <span className="font-mono font-black text-[10px] px-1.5 py-0.5 rounded bg-rose-600 text-white">
                                          {bk.id}
                                        </span>
                                        <span className="font-black text-teal-500">
                                          ৳{bk.consultationFeeBdt}
                                        </span>
                                      </div>
                                      <div className="font-extrabold truncate">
                                        {bk.patientName}
                                      </div>
                                      <div className="text-[10px] opacity-70 truncate">
                                        {bk.healthConcern}
                                      </div>
                                      <div className="flex flex-wrap items-center gap-1 pt-1">
                                        {col.openGapSlots[0] && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleResolveConflictToGap(
                                                bk.id,
                                                col.openGapSlots[0]
                                              )
                                            }
                                            className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold"
                                          >
                                            {isBn
                                              ? `↪ ${col.openGapSlots[0]}-এ নিন`
                                              : `↪ Move to ${col.openGapSlots[0]}`}
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => openBookingEditor(bk)}
                                          className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold inline-flex items-center gap-1"
                                        >
                                          <Edit3 className="w-2.5 h-2.5" />
                                          <span>
                                            {isBn ? 'ডাটা ও ফি এডিট' : 'Edit Data/Fee'}
                                          </span>
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            );
                          }

                          // CASE 2: SINGLE SCHEDULED APPOINTMENT
                          if (cell.matchingBookings.length === 1) {
                            const bk = cell.matchingBookings[0];
                            const pStatus = getResolvedPaymentStatus(bk);
                            return (
                              <td
                                key={col.nutritionist.id}
                                className="p-3 align-top border-r last:border-r-0 border-slate-200/70 dark:border-slate-800"
                              >
                                <div
                                  className={`p-3 rounded-xl border space-y-1.5 ${
                                    pStatus === 'verified'
                                      ? darkMode
                                        ? 'bg-emerald-950/20 border-emerald-500/40'
                                        : 'bg-emerald-50/70 border-emerald-200'
                                      : darkMode
                                      ? 'bg-amber-950/20 border-amber-500/40'
                                      : 'bg-amber-50/70 border-amber-200'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-1 tabular-nums">
                                    <span className="font-mono font-black text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-white">
                                      {bk.id}
                                    </span>
                                    <span className="font-black text-teal-500 text-xs">
                                      ৳{bk.consultationFeeBdt}
                                    </span>
                                  </div>
                                  <div className="font-extrabold text-xs">{bk.patientName}</div>
                                  <div className="text-[10px] opacity-75 line-clamp-1">
                                    {bk.healthConcern}
                                  </div>
                                  <div className="flex items-center justify-between pt-1">
                                    <span
                                      className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${
                                        pStatus === 'verified'
                                          ? 'bg-emerald-500/20 text-emerald-500'
                                          : 'bg-amber-500/20 text-amber-500'
                                      }`}
                                    >
                                      {pStatus === 'verified'
                                        ? isBn
                                          ? '✓ ভেরিফাইড'
                                          : '✓ Verified'
                                        : isBn
                                        ? '⏳ পেন্ডিং'
                                        : '⏳ Pending'}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => openBookingEditor(bk)}
                                      className={`px-2 py-0.5 rounded border text-[10px] font-extrabold inline-flex items-center gap-1 ${
                                        darkMode
                                          ? 'bg-slate-900 border-slate-700 text-indigo-400 hover:bg-slate-800'
                                          : 'bg-white border-slate-200 text-indigo-600 hover:bg-slate-50'
                                      }`}
                                    >
                                      <Edit3 className="w-2.5 h-2.5" />
                                      <span>{isBn ? 'এডিট ও ফি' : 'Edit & Fee'}</span>
                                    </button>
                                  </div>
                                </div>
                              </td>
                            );
                          }

                          // CASE 3: OPEN SCHEDULE GAP (Slot is in nutritionist.availableSlots and has 0 bookings)
                          if (cell.isGap) {
                            const nutriConflict = calendarOverlayData.doubleBookings.find(
                              (d) => d.nutritionist.id === col.nutritionist.id
                            );
                            const conflictingBookingToMove = nutriConflict?.bookings[1] || nutriConflict?.bookings[0];

                            return (
                              <td
                                key={col.nutritionist.id}
                                className="p-3 align-top border-r last:border-r-0 border-slate-200/70 dark:border-slate-800"
                              >
                                <div
                                  className={`p-3 rounded-xl border border-dashed space-y-1.5 ${
                                    darkMode
                                      ? 'bg-emerald-950/10 border-emerald-500/30 text-emerald-400'
                                      : 'bg-emerald-50/40 border-emerald-300 text-emerald-800'
                                  }`}
                                >
                                  <div className="flex items-center justify-between text-[10px] font-black uppercase">
                                    <span>
                                      {isBn ? '🟢 ফাঁকা স্লট (Schedule Gap)' : '🟢 Open Schedule Gap'}
                                    </span>
                                    <span className="tabular-nums">
                                      ৳{col.nutritionist.consultationFeeBdt}
                                    </span>
                                  </div>
                                  <div className="text-[10px] opacity-75">
                                    {isBn
                                      ? 'নতুন বুকিং বা রিশিডিউলের জন্য উন্মুক্ত'
                                      : 'Available for booking or conflict reassignment'}
                                  </div>
                                  {conflictingBookingToMove && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleResolveConflictToGap(
                                          conflictingBookingToMove.id,
                                          slot
                                        )
                                      }
                                      className="w-full mt-1 py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-extrabold text-center"
                                    >
                                      {isBn
                                        ? `↪ ডাবল-বুকিং (${conflictingBookingToMove.id}) এখানে আনুন`
                                        : `↪ Move Conflict (${conflictingBookingToMove.id}) Here`}
                                    </button>
                                  )}
                                </div>
                              </td>
                            );
                          }

                          // CASE 4: OFF-SCHEDULE / UNLISTED SLOT
                          return (
                            <td
                              key={col.nutritionist.id}
                              className="p-3 align-top border-r last:border-r-0 border-slate-200/70 dark:border-slate-800"
                            >
                              <div
                                className={`p-3 rounded-xl border text-[11px] flex items-center justify-between opacity-55 hover:opacity-100 transition-opacity ${
                                  darkMode
                                    ? 'bg-slate-950/40 border-slate-800/70 text-slate-500'
                                    : 'bg-slate-50/60 border-slate-200/60 text-slate-400'
                                }`}
                              >
                                <span>{isBn ? 'তালিকাভুক্ত স্লট নয়' : 'Off-Schedule'}</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    adminUpdateNutritionistDetails(col.nutritionist.id, {
                                      availableSlots: [
                                        ...(col.nutritionist.availableSlots || []),
                                        slot,
                                      ],
                                    })
                                  }
                                  className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 hover:bg-teal-600 hover:text-white text-[10px] font-bold inline-flex items-center gap-0.5"
                                  title={
                                    isBn
                                      ? 'এই স্লটটি পুষ্টিবিদের শিডিউলে যুক্ত করুন'
                                      : 'Add this time slot to nutritionist schedule'
                                  }
                                >
                                  <Plus className="w-2.5 h-2.5" />
                                  <span>{isBn ? 'স্লট যোগ' : 'Add Slot'}</span>
                                </button>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Filtered Active Consultation Appointments List */}
          {(bookingViewMode === 'list' || bookingViewMode === 'split') &&
            (() => {
              const filteredBookings = state.bookings.filter((bk) => {
                const pStatus = getResolvedPaymentStatus(bk);
                const sReadiness = getResolvedSessionReadiness(bk);

                if (bookingFilter === 'active') {
                  if (bk.status !== 'pending_admin' && bk.status !== 'confirmed_for_nutritionist') {
                    return false;
                  }
                } else if (bookingFilter === 'pending_payment') {
                  if (pStatus !== 'pending') return false;
                } else if (bookingFilter === 'session_ready') {
                  if (sReadiness !== 'ready_for_session' && sReadiness !== 'in_progress') {
                    return false;
                  }
                } else if (bookingFilter === 'completed') {
                  if (bk.status !== 'completed' && sReadiness !== 'completed') return false;
                }

                if (paymentStatusFilter !== 'all' && pStatus !== paymentStatusFilter) {
                  return false;
                }

                if (
                  selectedSlotFilter !== 'all' &&
                  (bk.appointmentSlot || '06:00 PM').trim() !== selectedSlotFilter
                ) {
                  return false;
                }

                if (bookingSearchQuery.trim()) {
                  const q = bookingSearchQuery.trim().toLowerCase();
                  const match =
                    bk.id.toLowerCase().includes(q) ||
                    bk.patientName.toLowerCase().includes(q) ||
                    bk.patientEmail.toLowerCase().includes(q) ||
                    bk.patientPhone.toLowerCase().includes(q) ||
                    bk.nutritionistNameBn.toLowerCase().includes(q) ||
                    bk.nutritionistNameEn.toLowerCase().includes(q) ||
                    bk.transactionId.toLowerCase().includes(q) ||
                    bk.healthConcern.toLowerCase().includes(q);
                  if (!match) return false;
                }

                return true;
              });

              if (filteredBookings.length === 0) {
                return (
                  <div
                    className={`p-10 rounded-3xl border text-center space-y-3 ${
                      darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    <Calendar className="w-10 h-10 text-teal-500 mx-auto opacity-60" />
                    <h3 className="text-base font-extrabold">
                      {isBn
                        ? 'এই ফিল্টারে কোনো কনসালটেশন অ্যাপয়েন্টমেন্ট পাওয়া যায়নি'
                        : 'No consultation appointments match the current filter'}
                    </h3>
                    <p className="text-xs opacity-70 max-w-md mx-auto">
                      {isBn
                        ? 'সবগুলো অ্যাপয়েন্টমেন্ট দেখতে ফিল্টার রিসেট করুন অথবা অন্য কি-ওয়ার্ড দিয়ে অনুসন্ধান করুন।'
                        : 'Reset the active filters or search query to view all consultation bookings.'}
                    </p>
                    <button
                      onClick={() => {
                        setBookingFilter('all');
                        setPaymentStatusFilter('all');
                        setSelectedSlotFilter('all');
                        setBookingSearchQuery('');
                      }}
                      className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-extrabold whitespace-nowrap"
                    >
                      {isBn ? 'ফিল্টার রিসেট করুন' : 'Reset Filters'}
                    </button>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {filteredBookings.map((bk) => {
                    const paymentStatus = getResolvedPaymentStatus(bk);
                    const sessionReadiness = getResolvedSessionReadiness(bk);
                    const readinessPercent = getReadinessProgressPercent(sessionReadiness);
                    const isConfirmedForNutritionist = bk.status === 'confirmed_for_nutritionist';
                    const isCompleted =
                      bk.status === 'completed' || sessionReadiness === 'completed';

                    const scheduleDraft = bookingScheduleDraft[bk.id] || {
                      date: bk.appointmentDate,
                      slot: bk.appointmentSlot,
                    };

                    const currentMeetInput =
                      customMeetLinks[bk.id] !== undefined
                        ? customMeetLinks[bk.id]
                        : bk.googleMeetLink && bk.googleMeetLink !== 'https://meet.google.com/new'
                        ? bk.googleMeetLink
                        : `https://meet.google.com/lookup/precision-${bk.id.toLowerCase()}`;

                    const readinessSteps: {
                      id: SessionReadinessStatus;
                      labelBn: string;
                      labelEn: string;
                    }[] = [
                      {
                        id: 'awaiting_payment',
                        labelBn: 'পেমেন্ট অপেক্ষমাণ',
                        labelEn: 'Awaiting Payment',
                      },
                      {
                        id: 'payment_verified',
                        labelBn: 'পেমেন্ট নিশ্চিত',
                        labelEn: 'Payment Verified',
                      },
                      {
                        id: 'room_configured',
                        labelBn: 'রুম কনফিগারড',
                        labelEn: 'Room Configured',
                      },
                      {
                        id: 'ready_for_session',
                        labelBn: 'সেশন প্রস্তুত',
                        labelEn: 'Session Ready',
                      },
                      {
                        id: 'in_progress',
                        labelBn: 'লাইভ সেশন চলমান',
                        labelEn: 'In Live Session',
                      },
                      {
                        id: 'completed',
                        labelBn: 'সেশন সম্পন্ন',
                        labelEn: 'Completed',
                      },
                    ];

                    return (
                      <div
                        key={bk.id}
                        className={`p-5 md:p-6 rounded-3xl border transition-all space-y-5 ${
                          sessionReadiness === 'in_progress'
                            ? darkMode
                              ? 'bg-slate-900 border-teal-500/60'
                              : 'bg-white border-teal-400 shadow-sm'
                            : paymentStatus === 'verified'
                            ? darkMode
                              ? 'bg-slate-900 border-emerald-500/40'
                              : 'bg-white border-emerald-300 shadow-sm'
                            : paymentStatus === 'rejected'
                            ? darkMode
                              ? 'bg-slate-900 border-rose-500/40'
                              : 'bg-white border-rose-300'
                            : darkMode
                            ? 'bg-slate-900 border-amber-500/40'
                            : 'bg-white border-amber-300 shadow-sm'
                        }`}
                      >
                        {/* Top Status Header Bar */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-200/60 dark:border-slate-800">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-white text-xs font-mono font-black tabular-nums">
                              {bk.id}
                            </span>

                            {/* Payment Status Badge */}
                            <span
                              className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wide flex items-center gap-1.5 ${
                                paymentStatus === 'verified'
                                  ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                                  : paymentStatus === 'rejected'
                                  ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                                  : 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                              }`}
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>
                                {paymentStatus === 'verified'
                                  ? isBn
                                    ? 'পেমেন্ট ভেরিফাইড'
                                    : 'Payment Verified'
                                  : paymentStatus === 'rejected'
                                  ? isBn
                                    ? 'পেমেন্ট বাতিল'
                                    : 'Payment Rejected'
                                  : isBn
                                  ? 'পেমেন্ট যাচাই বাকি'
                                  : 'Payment Pending'}
                              </span>
                            </span>

                            {/* Session Readiness Status Badge */}
                            <span
                              className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wide flex items-center gap-1.5 ${
                                sessionReadiness === 'in_progress'
                                  ? 'bg-teal-600 text-white'
                                  : sessionReadiness === 'ready_for_session'
                                  ? 'bg-indigo-600 text-white'
                                  : sessionReadiness === 'completed'
                                  ? 'bg-emerald-700 text-white'
                                  : 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                            >
                              <Activity className="w-3.5 h-3.5" />
                              <span className="tabular-nums">
                                {sessionReadiness === 'in_progress'
                                  ? isBn
                                    ? '🔴 লাইভ সেশন চলমান (LIVE)'
                                    : '🔴 Live Session Active'
                                  : sessionReadiness === 'ready_for_session'
                                  ? isBn
                                    ? '✓ সেশন প্রস্তুত (100%)'
                                    : '✓ Session Ready (100%)'
                                  : sessionReadiness === 'room_configured'
                                  ? isBn
                                    ? '⚙️ রুম কনফিগারড (75%)'
                                    : '⚙️ Room Configured (75%)'
                                  : sessionReadiness === 'payment_verified'
                                  ? isBn
                                    ? 'পেমেন্ট নিশ্চিত (45%)'
                                    : 'Payment Verified (45%)'
                                  : sessionReadiness === 'completed'
                                  ? isBn
                                    ? '✓ কনসালটেশন সম্পন্ন'
                                    : '✓ Session Completed'
                                  : isBn
                                  ? '⏳ পেমেন্টের অপেক্ষায় (20%)'
                                  : '⏳ Awaiting Payment (20%)'}
                              </span>
                            </span>

                            {/* Nutritionist Dashboard Sync Indicator */}
                            <span
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                                isConfirmedForNutritionist || isCompleted
                                  ? 'bg-teal-500/10 text-teal-500 border border-teal-500/20'
                                  : 'bg-slate-500/10 text-slate-400'
                              }`}
                            >
                              {isConfirmedForNutritionist || isCompleted
                                ? isBn
                                  ? '👨‍⚕️ পুষ্টিবিদ প্রোফাইলে দৃশ্যমান'
                                  : '👨‍⚕️ Visible on Nutritionist Profile'
                                : isBn
                                ? '🔒 পুষ্টিবিদ প্রোফাইলে লুকানো (অ্যাপ্রুভাল প্রয়োজন)'
                                : '🔒 Hidden from Nutritionist until Approved'}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 self-end md:self-auto">
                            <div className="text-right tabular-nums">
                              <div className="text-xs font-bold opacity-70 flex items-center justify-end gap-1">
                                <Clock className="w-3.5 h-3.5 text-teal-500" />
                                <span>
                                  {bk.appointmentDate} • {bk.appointmentSlot}
                                </span>
                              </div>
                              <div className="text-lg font-black text-teal-500">
                                ৳{bk.consultationFeeBdt.toLocaleString()}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => openBookingEditor(bk)}
                              className={`px-3 py-2 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                                darkMode
                                  ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700'
                                  : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                              }`}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>{isBn ? 'ডাটা ও ফি এডিট' : 'Edit Data & Pricing'}</span>
                            </button>
                          </div>
                        </div>

                      {/* 3-Column Appointment Management Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* COLUMN 1: Patient & Nutritionist Pairing + Schedule */}
                        <div
                          className={`p-4 rounded-2xl border space-y-3 ${
                            darkMode
                              ? 'bg-slate-950/60 border-slate-800'
                              : 'bg-slate-50/70 border-slate-200/80'
                          }`}
                        >
                          <div className="text-[11px] font-black uppercase tracking-wider text-teal-500">
                            {isBn
                              ? '১. রোগী ও পুষ্টিবিদ অ্যাপয়েন্টমেন্ট তথ্য'
                              : '1. Patient & Nutritionist Pairing'}
                          </div>

                          <div className="space-y-2 text-xs">
                            <div
                              className={`p-3 rounded-xl border ${
                                darkMode
                                  ? 'bg-slate-900 border-slate-800'
                                  : 'bg-white border-slate-200/80'
                              }`}
                            >
                              <div className="text-[10px] font-bold uppercase opacity-60">
                                {isBn ? 'রোগী (User / Patient)' : 'Patient'}
                              </div>
                              <div className="font-extrabold text-sm mt-0.5">{bk.patientName}</div>
                              <div className="opacity-75 tabular-nums">
                                {bk.patientPhone} • {bk.patientEmail}
                              </div>
                              <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 dark:border-slate-800 text-[11px]">
                                <span className="font-bold opacity-70">
                                  {isBn ? 'স্বাস্থ্য সমস্যা: ' : 'Clinical Concern: '}
                                </span>
                                <span>{bk.healthConcern}</span>
                              </div>
                            </div>

                            <div
                              className={`p-3 rounded-xl border ${
                                darkMode
                                  ? 'bg-slate-900 border-slate-800'
                                  : 'bg-white border-slate-200/80'
                              }`}
                            >
                              <div className="text-[10px] font-bold uppercase opacity-60">
                                {isBn ? 'পুষ্টিবিদ (Assigned Nutritionist)' : 'Assigned Nutritionist'}
                              </div>
                              <div className="font-extrabold text-sm mt-0.5">
                                {isBn ? bk.nutritionistNameBn : bk.nutritionistNameEn}
                              </div>
                              <div className="opacity-75 tabular-nums">
                                {bk.nutritionistEmail} • ID: {bk.nutritionistId}
                              </div>
                            </div>
                          </div>

                          {/* Inline Schedule / Slot Rescheduler */}
                          <div className="pt-1 space-y-1.5">
                            <label className="text-[11px] font-bold opacity-75 block">
                              {isBn
                                ? 'অ্যাপয়েন্টমেন্ট তারিখ ও স্লট পরিবর্তন:'
                                : 'Appointment Date & Slot:'}
                            </label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="date"
                                value={scheduleDraft.date}
                                onChange={(e) =>
                                  setBookingScheduleDraft({
                                    ...bookingScheduleDraft,
                                    [bk.id]: { ...scheduleDraft, date: e.target.value },
                                  })
                                }
                                className={`px-2.5 py-1.5 rounded-xl border text-xs font-mono tabular-nums flex-1 ${
                                  darkMode
                                    ? 'bg-slate-900 border-slate-700 text-white'
                                    : 'bg-white border-slate-200'
                                }`}
                              />
                              <input
                                type="text"
                                value={scheduleDraft.slot}
                                onChange={(e) =>
                                  setBookingScheduleDraft({
                                    ...bookingScheduleDraft,
                                    [bk.id]: { ...scheduleDraft, slot: e.target.value },
                                  })
                                }
                                className={`px-2.5 py-1.5 rounded-xl border text-xs font-mono tabular-nums w-28 ${
                                  darkMode
                                    ? 'bg-slate-900 border-slate-700 text-white'
                                    : 'bg-white border-slate-200'
                                }`}
                              />
                              <button
                                onClick={() =>
                                  adminUpdateBookingManagement(bk.id, {
                                    appointmentDate: scheduleDraft.date,
                                    appointmentSlot: scheduleDraft.slot,
                                  })
                                }
                                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold whitespace-nowrap"
                              >
                                {isBn ? 'সেভ' : 'Save'}
                              </button>
                            </div>
                          </div>

                          {/* Inline Consultation Duration & Session Rating Controls (Updates Productivity Summary Live) */}
                          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold opacity-70 block mb-1">
                                {isBn ? 'সেশন সময়কাল (Duration):' : 'Session Duration:'}
                              </label>
                              <select
                                value={getResolvedBookingDurationMinutes(bk)}
                                onChange={(e) =>
                                  adminUpdateBookingManagement(bk.id, {
                                    durationMinutes: Number(e.target.value),
                                  })
                                }
                                className={`w-full px-2 py-1.5 rounded-xl border text-xs font-extrabold tabular-nums ${
                                  darkMode
                                    ? 'bg-slate-900 border-slate-700 text-teal-400'
                                    : 'bg-white border-slate-200 text-teal-700'
                                }`}
                              >
                                {[30, 45, 60, 90].map((mins) => (
                                  <option key={mins} value={mins}>
                                    {mins} {isBn ? 'মিনিট' : 'mins'} ({(mins / 60).toFixed(1)}h)
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="text-[10px] font-bold opacity-70 block mb-1">
                                {isBn ? 'সেশন রেটিং (Rating):' : 'Session Rating:'}
                              </label>
                              <select
                                value={getResolvedBookingRating(bk)}
                                onChange={(e) =>
                                  adminUpdateBookingManagement(bk.id, {
                                    sessionRating: Number(e.target.value),
                                  })
                                }
                                className={`w-full px-2 py-1.5 rounded-xl border text-xs font-extrabold tabular-nums ${
                                  darkMode
                                    ? 'bg-slate-900 border-slate-700 text-amber-400'
                                    : 'bg-white border-slate-200 text-amber-600'
                                }`}
                              >
                                {[5.0, 4.9, 4.8, 4.7, 4.5, 4.0].map((rt) => (
                                  <option key={rt} value={rt}>
                                    ★ {rt.toFixed(1)} / 5.0
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* COLUMN 2: Payment Status & Verification Controls */}
                        <div
                          className={`p-4 rounded-2xl border space-y-3 flex flex-col justify-between ${
                            darkMode
                              ? 'bg-slate-950/60 border-slate-800'
                              : 'bg-slate-50/70 border-slate-200/80'
                          }`}
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-black uppercase tracking-wider text-amber-500">
                                {isBn
                                  ? '২. পেমেন্ট স্ট্যাটাস ও ভেরিফিকেশন'
                                  : '2. Payment Status & Verification'}
                              </span>
                              <span className="text-[11px] font-mono opacity-65 tabular-nums">
                                {bk.paymentId}
                              </span>
                            </div>

                            <div
                              className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                                darkMode
                                  ? 'bg-slate-900 border-slate-800'
                                  : 'bg-white border-slate-200/80'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="opacity-70">
                                  {isBn ? 'পেমেন্ট মাধ্যম:' : 'Payment Method:'}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-400 font-black uppercase">
                                  {bk.paymentMethod}
                                </span>
                              </div>
                              <div className="flex items-center justify-between tabular-nums">
                                <span className="opacity-70">
                                  {isBn ? 'প্রেরকের নম্বর:' : 'Sender Number:'}
                                </span>
                                <span className="font-bold font-mono">{bk.senderNumber}</span>
                              </div>
                              <div className="flex items-center justify-between tabular-nums">
                                <span className="opacity-70">
                                  {isBn ? 'ট্রানজেকশন আইডি:' : 'Transaction ID:'}
                                </span>
                                <span className="font-mono font-black text-amber-500">
                                  {bk.transactionId}
                                </span>
                              </div>
                              <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60 dark:border-slate-800 tabular-nums">
                                <span className="opacity-70">
                                  {isBn ? 'কনসালটেশন ফি:' : 'Consultation Fee:'}
                                </span>
                                <span className="text-sm font-black text-emerald-500">
                                  ৳{bk.consultationFeeBdt.toLocaleString()} BDT
                                </span>
                              </div>
                            </div>

                            {/* Direct Payment Status Switcher */}
                            <div className="space-y-1.5">
                              <div className="text-[11px] font-bold opacity-75">
                                {isBn
                                  ? 'পেমেন্ট স্ট্যাটাস নিয়ন্ত্রণ:'
                                  : 'Set Payment Verification Status:'}
                              </div>
                              <div className="grid grid-cols-3 gap-1.5">
                                {(
                                  [
                                    {
                                      id: 'verified',
                                      labelBn: '✓ ভেরিফাইড',
                                      labelEn: '✓ Verified',
                                      activeCls: 'bg-emerald-600 text-white',
                                    },
                                    {
                                      id: 'pending',
                                      labelBn: '⏳ পেন্ডিং',
                                      labelEn: '⏳ Pending',
                                      activeCls: 'bg-amber-500 text-slate-950',
                                    },
                                    {
                                      id: 'rejected',
                                      labelBn: '✕ বাতিল',
                                      labelEn: '✕ Rejected',
                                      activeCls: 'bg-rose-600 text-white',
                                    },
                                  ] as const
                                ).map((stBtn) => (
                                  <button
                                    key={stBtn.id}
                                    onClick={() =>
                                      adminUpdateBookingManagement(bk.id, {
                                        paymentStatus: stBtn.id,
                                      })
                                    }
                                    className={`py-2 px-2 rounded-xl text-[11px] font-extrabold transition-all whitespace-nowrap ${
                                      paymentStatus === stBtn.id
                                        ? stBtn.activeCls
                                        : darkMode
                                        ? 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
                                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                                    }`}
                                  >
                                    {isBn ? stBtn.labelBn : stBtn.labelEn}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Primary 1-Click Payment Approval & Activation CTA */}
                          <div className="pt-2">
                            {paymentStatus !== 'verified' ? (
                              <button
                                onClick={() => {
                                  const linkedPay = state.payments.find(
                                    (p) => p.id === bk.paymentId || p.relatedBookingId === bk.id
                                  );
                                  if (linkedPay) {
                                    void handleApprovePayment(linkedPay);
                                  } else {
                                    adminUpdateBookingManagement(bk.id, {
                                      paymentStatus: 'verified',
                                      status: 'confirmed_for_nutritionist',
                                      sessionReadiness: 'ready_for_session',
                                      googleMeetLink: currentMeetInput,
                                      nutritionistReady: true,
                                      patientReady: true,
                                      clinicalBriefPrepared: true,
                                    });
                                  }
                                }}
                                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
                              >
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                                <span>
                                  {isBn
                                    ? 'পেমেন্ট ভেরিফাই ও বুকিং সক্রিয় করুন'
                                    : 'Verify Payment & Activate Booking'}
                                </span>
                              </button>
                            ) : (
                              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[11px] font-bold flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                  <span>
                                    {isBn
                                      ? 'পেমেন্ট নিশ্চিত ও পুষ্টিবিদ প্রোফাইলে যুক্ত'
                                      : 'Payment verified & active for Dietitian'}
                                  </span>
                                </span>
                                {bk.approvedAt && (
                                  <span className="font-mono text-[10px] opacity-80 tabular-nums">
                                    {new Date(bk.approvedAt).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* COLUMN 3: Session Readiness Pipeline & Live Meet Room Controls */}
                        <div
                          className={`p-4 rounded-2xl border space-y-3 flex flex-col justify-between ${
                            darkMode
                              ? 'bg-slate-950/60 border-slate-800'
                              : 'bg-slate-50/70 border-slate-200/80'
                          }`}
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-500">
                                {isBn
                                  ? '৩. সেশন রেডিনেস ও ভিডিও রুম'
                                  : '3. Session Readiness & Live Room'}
                              </span>
                              <span className="text-xs font-black text-indigo-500 tabular-nums">
                                {readinessPercent}% {isBn ? 'প্রস্তুত' : 'Ready'}
                              </span>
                            </div>

                            {/* Visual Progress Bar */}
                            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  sessionReadiness === 'in_progress'
                                    ? 'bg-teal-500'
                                    : readinessPercent === 100
                                    ? 'bg-emerald-500'
                                    : 'bg-indigo-500'
                                }`}
                                style={{ width: `${readinessPercent}%` }}
                              />
                            </div>

                            {/* Session Readiness Stage Selector */}
                            <div>
                              <label className="text-[11px] font-bold opacity-75 block mb-1">
                                {isBn ? 'সেশন রেডিনেস ধাপ:' : 'Session Readiness Stage:'}
                              </label>
                              <select
                                value={sessionReadiness}
                                onChange={(e) =>
                                  adminUpdateBookingManagement(bk.id, {
                                    sessionReadiness: e.target.value as SessionReadinessStatus,
                                  })
                                }
                                className={`w-full px-3 py-2 rounded-xl border text-xs font-extrabold ${
                                  darkMode
                                    ? 'bg-slate-900 border-slate-700 text-white'
                                    : 'bg-white border-slate-200 text-slate-900'
                                }`}
                              >
                                {readinessSteps.map((step) => (
                                  <option key={step.id} value={step.id}>
                                    {isBn ? step.labelBn : step.labelEn}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* 3 Interactive Session Readiness Checkboxes */}
                            <div className="space-y-1.5">
                              {[
                                {
                                  key: 'clinicalBriefPrepared' as const,
                                  checked: Boolean(bk.clinicalBriefPrepared ?? true),
                                  labelBn: 'ক্লিনিক্যাল ব্রিফ ও হেলথ প্রোফাইল সংযুক্ত',
                                  labelEn: 'Clinical Brief & Health Profile Attached',
                                },
                                {
                                  key: 'nutritionistReady' as const,
                                  checked: Boolean(
                                    bk.nutritionistReady ?? isConfirmedForNutritionist
                                  ),
                                  labelBn: 'পুষ্টিবিদ ড্যাশবোর্ডে সক্রিয় ও অবহিত',
                                  labelEn: 'Nutritionist Dashboard Synced & Ready',
                                },
                                {
                                  key: 'patientReady' as const,
                                  checked: Boolean(bk.patientReady ?? isConfirmedForNutritionist),
                                  labelBn: 'রোগীর কাছে Meet লিংক ও রিমাইন্ডার প্রেরিত',
                                  labelEn: 'Patient Meet Link & Reminder Dispatched',
                                },
                              ].map((chk) => (
                                <button
                                  key={chk.key}
                                  type="button"
                                  onClick={() =>
                                    adminUpdateBookingManagement(bk.id, {
                                      [chk.key]: !chk.checked,
                                    })
                                  }
                                  className={`w-full px-3 py-1.5 rounded-xl border text-left text-[11px] font-bold flex items-center justify-between transition-all ${
                                    chk.checked
                                      ? darkMode
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                        : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                      : darkMode
                                      ? 'bg-slate-900 border-slate-800 text-slate-400'
                                      : 'bg-white border-slate-200 text-slate-600'
                                  }`}
                                >
                                  <span>{isBn ? chk.labelBn : chk.labelEn}</span>
                                  <span className="font-mono font-black">
                                    {chk.checked ? '✓' : '○'}
                                  </span>
                                </button>
                              ))}
                            </div>

                            {/* Google Meet Link Configuration */}
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold opacity-75 block">
                                {isBn
                                  ? 'Google Meet কনসালটেশন রুম লিংক:'
                                  : 'Google Meet Consultation Room Link:'}
                              </label>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="url"
                                  value={currentMeetInput}
                                  onChange={(e) =>
                                    setCustomMeetLinks({
                                      ...customMeetLinks,
                                      [bk.id]: e.target.value,
                                    })
                                  }
                                  className={`flex-1 px-2.5 py-1.5 rounded-xl border text-xs font-mono ${
                                    darkMode
                                      ? 'bg-slate-900 border-slate-700 text-white'
                                      : 'bg-white border-slate-200'
                                  }`}
                                />
                                <button
                                  onClick={() =>
                                    adminUpdateBookingManagement(bk.id, {
                                      googleMeetLink: currentMeetInput,
                                      sessionReadiness:
                                        sessionReadiness === 'awaiting_payment'
                                          ? 'room_configured'
                                          : sessionReadiness,
                                    })
                                  }
                                  className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold whitespace-nowrap"
                                >
                                  {isBn ? 'আপডেট' : 'Update'}
                                </button>
                                <button
                                  onClick={() =>
                                    handleCopyText(currentMeetInput, `meet-${bk.id}`)
                                  }
                                  className={`p-1.5 rounded-xl border ${
                                    darkMode
                                      ? 'bg-slate-900 border-slate-700 text-slate-300'
                                      : 'bg-white border-slate-200 text-slate-700'
                                  }`}
                                  title={isBn ? 'লিংক কপি করুন' : 'Copy Meet Link'}
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              {copiedCode === `meet-${bk.id}` && (
                                <div className="text-[10px] font-bold text-emerald-500">
                                  {isBn ? '✓ Meet লিংক কপি হয়েছে!' : '✓ Meet link copied!'}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Bottom Action Buttons: Launch Room & Dispatch Session Readiness Alert */}
                          <div className="pt-2 flex flex-wrap items-center gap-2">
                            <a
                              href={currentMeetInput}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
                            >
                              <Video className="w-3.5 h-3.5 shrink-0" />
                              <span>{isBn ? 'Meet রুম খুলুন' : 'Join / Test Meet'}</span>
                            </a>

                            <button
                              type="button"
                              onClick={() => handleDispatchReadiness(bk.id)}
                              className="flex-1 py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
                            >
                              <Bell className="w-3.5 h-3.5 shrink-0" />
                              <span>
                                {dispatchedAlertBookingId === bk.id
                                  ? isBn
                                    ? '✓ অ্যালার্ট পাঠানো হয়েছে'
                                    : '✓ Readiness Sent'
                                  : isBn
                                  ? 'সেশন রেডি অ্যালার্ট পাঠান'
                                  : 'Send Readiness Alert'}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Admin Clinical / Operational Notes Bar */}
                      <div
                        className={`p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                          darkMode
                            ? 'bg-slate-950/40 border-slate-800/80'
                            : 'bg-slate-50 border-slate-200/70'
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <span className="font-bold opacity-70 whitespace-nowrap">
                            {isBn ? 'অ্যাডমিন নোট:' : 'Admin Note:'}
                          </span>
                          <input
                            type="text"
                            value={
                              bookingNotesDraft[bk.id] !== undefined
                                ? bookingNotesDraft[bk.id]
                                : bk.adminNotes || ''
                            }
                            onChange={(e) =>
                              setBookingNotesDraft({
                                ...bookingNotesDraft,
                                [bk.id]: e.target.value,
                              })
                            }
                            placeholder={
                              isBn
                                ? 'পেমেন্ট বা সেশন প্রস্তুতির নোট লিখুন...'
                                : 'Add session readiness or payment verification note...'
                            }
                            className={`flex-1 px-2.5 py-1 rounded-lg border text-xs ${
                              darkMode
                                ? 'bg-slate-900 border-slate-800 text-white'
                                : 'bg-white border-slate-200 text-slate-800'
                            }`}
                          />
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() =>
                              adminUpdateBookingManagement(bk.id, {
                                adminNotes:
                                  bookingNotesDraft[bk.id] !== undefined
                                    ? bookingNotesDraft[bk.id]
                                    : bk.adminNotes,
                              })
                            }
                            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold whitespace-nowrap"
                          >
                            {isBn ? 'নোট সংরক্ষণ' : 'Save Note'}
                          </button>
                          {sessionReadiness !== 'completed' && (
                            <button
                              type="button"
                              onClick={() =>
                                adminUpdateBookingManagement(bk.id, {
                                  status: 'completed',
                                  sessionReadiness: 'completed',
                                })
                              }
                              className="px-3 py-1 rounded-lg bg-emerald-600/20 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white text-[11px] font-extrabold whitespace-nowrap transition-all"
                            >
                              {isBn ? '✓ সেশন সম্পন্ন মার্ক করুন' : '✓ Mark Completed'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: NUTRITIONISTS & FEATURED DIETITIAN APPROVAL */}
      {/* ===================================================================== */}
      {activeTab === 'nutritionists' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {state.nutritionists.map((nutri) => (
            <div
              key={nutri.id}
              className={`p-6 rounded-3xl border-2 space-y-4 ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-teal-500/15 flex items-center justify-center text-3xl">
                    {nutri.avatarEmoji}
                  </div>
                  <div>
                    <div className="flex flex-wrap gap-1.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          nutri.status === 'approved'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-amber-500 text-slate-950'
                        }`}
                      >
                        {nutri.status}
                      </span>
                      {nutri.isFeatured && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-400 text-slate-950">
                          🌟 Featured Dietitian
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-extrabold mt-1">
                      {isBn ? nutri.fullNameBn : nutri.fullNameEn}
                    </h3>
                    <p className="text-xs opacity-70 tabular-nums">
                      {nutri.licenseNumber} • ৳{nutri.consultationFeeBdt}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openNutritionistEditor(nutri)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold inline-flex items-center gap-1.5 transition-all ${
                    darkMode
                      ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700'
                      : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isBn ? 'ডাটা ও ফি এডিট' : 'Edit Data & Pricing'}</span>
                </button>
              </div>

              <p className="text-xs opacity-80">{isBn ? nutri.specialtyBn : nutri.specialtyEn}</p>

              {/* Available Days & Time Slots Preview */}
              <div
                className={`p-3 rounded-2xl border text-xs space-y-1.5 ${
                  darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200/70'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] opacity-75">
                  <span>{isBn ? 'চেম্বার / সেশন দিন:' : 'Available Days:'}</span>
                  <span className="font-bold">
                    {isBn ? nutri.availableDaysBn : nutri.availableDaysEn}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] opacity-70">
                    {isBn ? 'টাইম স্লট:' : 'Time Slots:'}
                  </span>
                  {(nutri.availableSlots || []).map((sl) => (
                    <span
                      key={sl}
                      className="px-2 py-0.5 rounded-lg bg-teal-500/15 text-teal-500 text-[10px] font-mono font-bold tabular-nums"
                    >
                      {sl}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {nutri.status !== 'approved' && (
                  <button
                    onClick={() =>
                      adminUpdateNutritionistStatus(nutri.id, 'approved', nutri.featuredRequested)
                    }
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-extrabold flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isBn ? 'পুষ্টিবিদ অ্যাপ্রুভ করুন' : 'Approve Dietitian'}</span>
                  </button>
                )}

                <button
                  onClick={() =>
                    adminUpdateNutritionistStatus(nutri.id, 'approved', !nutri.isFeatured)
                  }
                  className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border ${
                    nutri.isFeatured
                      ? 'bg-amber-500 text-slate-950 border-amber-500'
                      : darkMode
                      ? 'bg-slate-800 border-slate-700 text-amber-400'
                      : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}
                >
                  <Award className="w-4 h-4" />
                  <span>
                    {nutri.isFeatured
                      ? isBn
                        ? 'ফিচার্ড ব্যাজ সরান'
                        : 'Remove Featured'
                      : isBn
                      ? '🌟 ফিচার্ড ডায়েটিশিয়ান করুন'
                      : '🌟 Make Featured Dietitian'}
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: MARKETPLACE STORE REGISTRATION APPROVALS */}
      {/* ===================================================================== */}
      {activeTab === 'stores' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {state.stores.map((st) => (
            <div
              key={st.id}
              className={`p-6 rounded-3xl border-2 space-y-4 ${
                st.status === 'pending'
                  ? darkMode
                    ? 'bg-slate-900 border-amber-500/40'
                    : 'bg-amber-50/40 border-amber-300'
                  : darkMode
                  ? 'bg-slate-900 border-emerald-500/30'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      st.status === 'pending'
                        ? 'bg-amber-500 text-slate-950'
                        : st.status === 'approved'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-red-500 text-white'
                    }`}
                  >
                    {st.status}
                  </span>
                  <h3 className="text-base font-extrabold mt-2">🏪 {st.storeName}</h3>
                  <p className="text-xs opacity-75">
                    {st.ownerName} • {st.ownerPhone} • {st.ownerEmail}
                  </p>
                </div>
                <span className="text-xs font-mono font-bold opacity-70">{st.licenseNumber}</span>
              </div>

              <p className="text-xs opacity-80">{st.description}</p>
              <div className="text-[11px] opacity-65">
                📍 {st.location} • 📦 {st.categoryFocus}
              </div>

              {st.status === 'pending' && (
                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={() => reviewMarketplaceStoreByAdmin(st.id, 'approved')}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-extrabold flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isBn ? 'দোকান অ্যাপ্রুভ করুন' : 'Approve Store'}</span>
                  </button>
                  <button
                    onClick={() => reviewMarketplaceStoreByAdmin(st.id, 'rejected')}
                    className="px-4 py-2.5 rounded-xl bg-red-500/15 text-red-500 text-xs font-extrabold"
                  >
                    {isBn ? 'বাতিল' : 'Reject'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 5: FOOD SUGGESTION BOX APPROVALS */}
      {/* ===================================================================== */}
      {activeTab === 'foods' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {state.foodSuggestions.map((f) => {
            const currentZone = foodZoneOverrides[f.id] || f.suggestedZone;
            return (
              <div
                key={f.id}
                className={`p-6 rounded-3xl border-2 space-y-4 ${
                  f.status === 'pending'
                    ? darkMode
                      ? 'bg-slate-900 border-amber-500/40'
                      : 'bg-amber-50/40 border-amber-300'
                    : darkMode
                    ? 'bg-slate-900 border-emerald-500/30'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        f.status === 'pending'
                          ? 'bg-amber-500 text-slate-950'
                          : f.status === 'approved'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-red-500 text-white'
                      }`}
                    >
                      {f.status === 'approved'
                        ? isBn
                          ? '✓ ফুড ডাটাবেসে যুক্ত হয়েছে'
                          : '✓ Added to Food DB'
                        : f.status}
                    </span>
                    <h3 className="text-base font-extrabold mt-2">{f.nameBn}</h3>
                    <p className="text-xs opacity-70">{f.nameEn}</p>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-black text-emerald-500">
                      {f.caloriesPer100g} kcal/100g
                    </div>
                    <div className="text-[10px] opacity-65">
                      P:{f.proteinG}g • C:{f.carbsG}g • F:{f.fatG}g
                    </div>
                  </div>
                </div>

                <p className="text-xs opacity-80">{f.healthBenefitsBn}</p>
                <div className="text-[11px] opacity-60">
                  {isBn ? 'পরামর্শদাতা:' : 'Suggested By:'} {f.submittedByName} ({f.category})
                </div>

                {f.status === 'pending' && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold opacity-75">
                        {isBn ? 'ট্রাফিক লাইট জোন নির্ধারণ:' : 'Traffic Light Zone:'}
                      </span>
                      {(['green', 'yellow', 'red'] as TrafficLightZone[]).map((z) => (
                        <button
                          key={z}
                          type="button"
                          onClick={() => setFoodZoneOverrides({ ...foodZoneOverrides, [f.id]: z })}
                          className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
                            currentZone === z
                              ? z === 'green'
                                ? 'bg-emerald-600 text-white'
                                : z === 'yellow'
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-red-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-800 opacity-60'
                          }`}
                        >
                          {z}
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2.5">
                      <button
                        onClick={() => reviewFoodSuggestionByAdmin(f.id, 'approved', currentZone)}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-extrabold flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          {isBn
                            ? 'অ্যাপ্রুভ করে ফুড গাইডে যুক্ত করুন'
                            : 'Approve & Add to Food Guide'}
                        </span>
                      </button>
                      <button
                        onClick={() => reviewFoodSuggestionByAdmin(f.id, 'rejected')}
                        className="px-4 py-2.5 rounded-xl bg-red-500/15 text-red-500 text-xs font-extrabold"
                      >
                        {isBn ? 'বাতিল' : 'Reject'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 6: COMMUNITY HUB MODERATION (AI AUTO-DELETED + USER REPORTS & BAN) */}
      {/* ===================================================================== */}
      {activeTab === 'moderation' && (
        <div className="space-y-6">
          {/* Banned Users List */}
          {state.bannedUsers.length > 0 && (
            <div
              className={`p-5 rounded-3xl border-2 ${
                darkMode ? 'bg-red-950/20 border-red-500/40' : 'bg-red-50 border-red-200'
              }`}
            >
              <h3 className="text-sm font-extrabold text-red-500 mb-3 flex items-center gap-2">
                <Ban className="w-4 h-4" />
                <span>{isBn ? 'ব্যান করা ইউজার তালিকা (Banned Users)' : 'Banned Users List'}</span>
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {state.bannedUsers.map((bu) => (
                  <div
                    key={bu.id}
                    className="px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-red-500/30 text-xs flex items-center gap-3"
                  >
                    <span className="font-extrabold text-red-500">🚫 {bu.userName}</span>
                    <button
                      onClick={() => adminUnbanUser(bu.id)}
                      className="text-[10px] font-bold underline opacity-75 hover:opacity-100"
                    >
                      {isBn ? 'আনব্যান করুন' : 'Unban'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {state.moderationIncidents.map((inc) => (
              <div
                key={inc.id}
                className={`p-6 rounded-3xl border-2 space-y-4 ${
                  inc.type === 'ai_auto_deleted'
                    ? darkMode
                      ? 'bg-slate-900 border-purple-500/40'
                      : 'bg-purple-50/40 border-purple-200'
                    : darkMode
                    ? 'bg-slate-900 border-rose-500/40'
                    : 'bg-rose-50/40 border-rose-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      inc.type === 'ai_auto_deleted'
                        ? 'bg-purple-600 text-white'
                        : 'bg-rose-600 text-white'
                    }`}
                  >
                    {inc.type === 'ai_auto_deleted'
                      ? isBn
                        ? '🤖 AI অটো-ডিলিটেড (পুষ্টি বহির্ভূত / ক্ষতিকর)'
                        : '🤖 AI Auto-Deleted'
                      : isBn
                      ? '🚩 ইউজার রিপোর্ট করেছেন'
                      : '🚩 User Reported Content'}
                  </span>
                  <span className="text-[11px] font-bold opacity-60">{inc.status}</span>
                </div>

                <div>
                  <h4 className="text-sm font-extrabold">
                    {isBn ? 'অভিযুক্ত ইউজার:' : 'Offender:'} {inc.offenderName}{' '}
                    {inc.offenderEmail && `(${inc.offenderEmail})`}
                  </h4>
                  <p className="text-xs text-rose-500 font-bold mt-0.5">{inc.reason}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 text-xs italic">
                  "{inc.contentSnippet}"
                </div>

                {inc.status !== 'deleted_and_banned' && (
                  <div className="flex flex-wrap gap-2.5 pt-1">
                    <button
                      onClick={() => adminDeleteContentAndBanUser(inc.id, true)}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <Ban className="w-4 h-4" />
                      <span>
                        {isBn
                          ? 'পোস্ট/কমেন্ট ডিলিট করুন ও ইউজারকে ব্যান করুন'
                          : 'Delete Content & Ban User'}
                      </span>
                    </button>
                    <button
                      onClick={() => adminDeleteContentAndBanUser(inc.id, false)}
                      className="py-2.5 px-4 rounded-xl bg-slate-800 text-white text-xs font-bold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isBn ? 'শুধু ডিলিট' : 'Delete Only'}</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 7: CLOUDFLARE FREE-TIER D1 / KV DATABASE ARCHITECTURE */}
      {/* ===================================================================== */}
      {activeTab === 'cloudflare' && (
        <div className="space-y-6">
          <div
            className={`p-6 rounded-3xl border-2 space-y-4 ${
              darkMode
                ? 'bg-slate-900 border-sky-500/40'
                : 'bg-sky-50/50 border-sky-200'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold">
                    {isBn
                      ? 'Cloudflare Free-Tier (D1 SQLite + Workers KV) ডাটাবেস আর্কিটেকচার'
                      : 'Cloudflare Free-Tier (D1 SQLite + Workers KV) Database Architecture'}
                  </h3>
                  <p className="text-xs opacity-75">
                    {isBn
                      ? 'ডোমেইন বা পেইড প্ল্যান ছাড়াই Cloudflare-এর ফ্রি টিয়ারে (5GB D1 SQL + ফ্রি workers.dev সাবডোমেইন) ইউজারের সব ডাটা সেভ রাখার জন্য প্রস্তুত এবং ভবিষ্যতে পেইড ভার্সনে গেলে সব ডাটা অক্ষুণ্ণ থাকবে।'
                      : 'Ready for Cloudflare Free Tier (5GB D1 SQL + free workers.dev subdomain without buying a domain) with zero data loss when upgrading to paid later.'}
                  </p>
                </div>
              </div>

              <div className="text-right text-xs font-bold text-emerald-500">
                ✓ {state.cloudflareSyncMeta.totalRowsSynced} Rows Synced
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold">
                    1. Cloudflare D1 SQL Schema (`schema.sql`)
                  </span>
                  <button
                    onClick={() => handleCopyText(getCloudflareD1SqlSchema(), 'sql')}
                    className="px-3 py-1 rounded-lg bg-sky-600 text-white text-[11px] font-bold flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedCode === 'sql' ? 'Copied!' : 'Copy SQL'}</span>
                  </button>
                </div>
                <pre className="p-4 rounded-2xl bg-slate-950 text-emerald-400 text-[11px] font-mono overflow-x-auto max-h-72">
                  {getCloudflareD1SqlSchema()}
                </pre>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold">
                    2. Cloudflare Free-Tier Worker (`worker.ts`)
                  </span>
                  <button
                    onClick={() => handleCopyText(getCloudflareWorkerScript(), 'worker')}
                    className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-[11px] font-bold flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedCode === 'worker' ? 'Copied!' : 'Copy Worker'}</span>
                  </button>
                </div>
                <pre className="p-4 rounded-2xl bg-slate-950 text-sky-300 text-[11px] font-mono overflow-x-auto max-h-72">
                  {getCloudflareWorkerScript()}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EMAIL SENT PREVIEW MODAL */}
      {emailModalData && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-lg rounded-[32px] border-2 p-6 md:p-8 space-y-5 shadow-2xl ${
              darkMode ? 'bg-slate-900 border-emerald-500/50 text-white' : 'bg-white border-emerald-400 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500">
                  {isBn ? 'অ্যাপ্রুভাল মেইল পাঠানো হয়েছে' : 'Approval Email Sent'}
                </span>
                <h3 className="text-lg font-extrabold mt-0.5">
                  {isBn
                    ? 'ইউজারের কাছে প্রিমিয়াম কনফার্মেশন মেইল গেছে!'
                    : 'Premium Approval Email Dispatched!'}
                </h3>
              </div>
            </div>

            <div
              className={`p-4 rounded-2xl border text-xs space-y-2 ${
                darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div>
                <span className="opacity-60">To: </span>
                <span className="font-extrabold text-emerald-500">{emailModalData.to}</span>
              </div>
              <div>
                <span className="opacity-60">Subject: </span>
                <span className="font-bold">{emailModalData.subject}</span>
              </div>
              <pre className="whitespace-pre-wrap font-sans text-xs pt-2 border-t border-slate-200 dark:border-slate-700 leading-relaxed">
                {emailModalData.body}
              </pre>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <a
                href={`mailto:${encodeURIComponent(emailModalData.to)}?subject=${encodeURIComponent(
                  emailModalData.subject
                )}&body=${encodeURIComponent(emailModalData.body)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-extrabold inline-flex items-center gap-1.5"
              >
                <Mail className="w-4 h-4" />
                <span>{isBn ? 'Gmail / Mail অ্যাপেও পাঠান' : 'Send via Mail Client'}</span>
              </a>

              <button
                onClick={() => setEmailModalData(null)}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-extrabold"
              >
                {isBn ? 'সম্পন্ন' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 1: BOOKING DATA, SCHEDULE & PRICING EDITOR                      */}
      {/* ===================================================================== */}
      {editingBooking && (
        <div className="fixed inset-0 z-[260] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-2xl rounded-3xl border p-6 md:p-7 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto ${
              darkMode
                ? 'bg-slate-900 border-slate-700 text-white'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200/70 dark:border-slate-800">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-500 text-[10px] font-black uppercase">
                  {editingBooking.id} • {isBn ? 'অ্যাডমিন ডাটা ও ফি এডিটর' : 'Admin Data & Pricing Editor'}
                </span>
                <h3 className="text-lg font-black mt-1">
                  {isBn
                    ? 'কনসালটেশন অ্যাপয়েন্টমেন্ট ডাটা, শিডিউল ও ফি আপডেট করুন'
                    : 'Update Consultation Booking Data, Schedule & Pricing'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingBooking(null)}
                className="p-1.5 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Consultation Fee / Pricing (BDT) */}
              <div className="space-y-1.5 sm:col-span-2 p-3.5 rounded-2xl border border-teal-500/30 bg-teal-500/5">
                <label className="font-extrabold text-teal-500 block">
                  {isBn
                    ? '💰 কনসালটেশন ফি / প্রাইসিং (BDT ৳) — পেমেন্ট রেকর্ডেও সিঙ্ক হবে:'
                    : '💰 Consultation Fee / Pricing (BDT ৳) — Syncs with Linked Payment:'}
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    step={50}
                    value={editingBooking.consultationFeeBdt}
                    onChange={(e) =>
                      setEditingBooking({
                        ...editingBooking,
                        consultationFeeBdt: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                    className={`w-36 px-3 py-2 rounded-xl border text-sm font-black font-mono tabular-nums ${
                      darkMode
                        ? 'bg-slate-950 border-slate-700 text-teal-400'
                        : 'bg-white border-slate-300 text-teal-700'
                    }`}
                  />
                  {[500, 600, 800, 1000, 1200, 1500].map((presetFee) => (
                    <button
                      key={presetFee}
                      type="button"
                      onClick={() =>
                        setEditingBooking({
                          ...editingBooking,
                          consultationFeeBdt: presetFee,
                        })
                      }
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold font-mono tabular-nums border transition-all ${
                        editingBooking.consultationFeeBdt === presetFee
                          ? 'bg-teal-600 text-white border-teal-500'
                          : darkMode
                          ? 'bg-slate-900 border-slate-800 text-slate-300'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      ৳{presetFee}
                    </button>
                  ))}
                </div>
              </div>

              {/* Assigned Nutritionist */}
              <div className="space-y-1">
                <label className="font-bold opacity-75 block">
                  {isBn ? 'নির্ধারিত পুষ্টিবিদ (Assigned Nutritionist):' : 'Assigned Nutritionist:'}
                </label>
                <select
                  value={editingBooking.nutritionistId}
                  onChange={(e) => {
                    const selectedNutri = state.nutritionists.find((n) => n.id === e.target.value);
                    setEditingBooking({
                      ...editingBooking,
                      nutritionistId: e.target.value,
                      consultationFeeBdt: selectedNutri
                        ? selectedNutri.consultationFeeBdt
                        : editingBooking.consultationFeeBdt,
                    });
                  }}
                  className={`w-full px-3 py-2 rounded-xl border font-bold ${
                    darkMode
                      ? 'bg-slate-950 border-slate-700 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  {state.nutritionists.map((n) => (
                    <option key={n.id} value={n.id}>
                      {isBn ? n.fullNameBn : n.fullNameEn} (৳{n.consultationFeeBdt})
                    </option>
                  ))}
                </select>
              </div>

              {/* Appointment Date */}
              <div className="space-y-1">
                <label className="font-bold opacity-75 block">
                  {isBn ? 'অ্যাপয়েন্টমেন্ট তারিখ:' : 'Appointment Date:'}
                </label>
                <input
                  type="date"
                  value={editingBooking.appointmentDate}
                  onChange={(e) =>
                    setEditingBooking({
                      ...editingBooking,
                      appointmentDate: e.target.value,
                    })
                  }
                  className={`w-full px-3 py-2 rounded-xl border font-mono font-bold tabular-nums ${
                    darkMode
                      ? 'bg-slate-950 border-slate-700 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              {/* Appointment Slot + Quick Open Schedule Gap Picker */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="font-bold opacity-75 block">
                  {isBn
                    ? 'টাইম স্লট (ফাঁকা স্লটে ক্লিক করে ডাবল-বুকিং এড়াতে পারেন):'
                    : 'Appointment Time Slot (Click any open schedule gap below):'}
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={editingBooking.appointmentSlot}
                    onChange={(e) =>
                      setEditingBooking({
                        ...editingBooking,
                        appointmentSlot: e.target.value,
                      })
                    }
                    className={`w-40 px-3 py-2 rounded-xl border font-mono font-bold tabular-nums ${
                      darkMode
                        ? 'bg-slate-950 border-slate-700 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                  {(() => {
                    const targetNutri = state.nutritionists.find(
                      (n) => n.id === editingBooking.nutritionistId
                    );
                    const nutriSlots = targetNutri?.availableSlots || [
                      '10:30 AM',
                      '12:00 PM',
                      '05:30 PM',
                      '06:00 PM',
                      '07:00 PM',
                      '08:00 PM',
                    ];
                    return nutriSlots.map((sl) => {
                      const otherBookingsInSlot = nonRejectedBookings.filter(
                        (b) =>
                          b.id !== editingBooking.id &&
                          b.nutritionistId === editingBooking.nutritionistId &&
                          b.appointmentDate === editingBooking.appointmentDate &&
                          (b.appointmentSlot || '').trim() === sl.trim()
                      );
                      const isOccupied = otherBookingsInSlot.length > 0;
                      const isCurrent = editingBooking.appointmentSlot.trim() === sl.trim();

                      return (
                        <button
                          key={sl}
                          type="button"
                          onClick={() =>
                            setEditingBooking({
                              ...editingBooking,
                              appointmentSlot: sl,
                            })
                          }
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-extrabold tabular-nums border transition-all ${
                            isCurrent
                              ? 'bg-indigo-600 text-white border-indigo-500'
                              : isOccupied
                              ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                          }`}
                        >
                          {sl}{' '}
                          {isOccupied
                            ? isBn
                              ? '(বুকড)'
                              : '(Booked)'
                            : isBn
                            ? '(ফাঁকা)'
                            : '(Open)'}
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Patient Name */}
              <div className="space-y-1">
                <label className="font-bold opacity-75 block">
                  {isBn ? 'রোগীর নাম (Patient Name):' : 'Patient Name:'}
                </label>
                <input
                  type="text"
                  value={editingBooking.patientName}
                  onChange={(e) =>
                    setEditingBooking({ ...editingBooking, patientName: e.target.value })
                  }
                  className={`w-full px-3 py-2 rounded-xl border font-bold ${
                    darkMode
                      ? 'bg-slate-950 border-slate-700 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              {/* Patient Phone */}
              <div className="space-y-1">
                <label className="font-bold opacity-75 block">
                  {isBn ? 'রোগীর ফোন নম্বর:' : 'Patient Phone:'}
                </label>
                <input
                  type="text"
                  value={editingBooking.patientPhone}
                  onChange={(e) =>
                    setEditingBooking({ ...editingBooking, patientPhone: e.target.value })
                  }
                  className={`w-full px-3 py-2 rounded-xl border font-mono tabular-nums ${
                    darkMode
                      ? 'bg-slate-950 border-slate-700 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              {/* Patient Email */}
              <div className="space-y-1">
                <label className="font-bold opacity-75 block">
                  {isBn ? 'রোগীর ইমেইল:' : 'Patient Email:'}
                </label>
                <input
                  type="email"
                  value={editingBooking.patientEmail}
                  onChange={(e) =>
                    setEditingBooking({ ...editingBooking, patientEmail: e.target.value })
                  }
                  className={`w-full px-3 py-2 rounded-xl border ${
                    darkMode
                      ? 'bg-slate-950 border-slate-700 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              {/* Transaction ID & Sender Number */}
              <div className="space-y-1">
                <label className="font-bold opacity-75 block">
                  {isBn ? 'ট্রানজেকশন আইডি (TrxID):' : 'Transaction ID (TrxID):'}
                </label>
                <input
                  type="text"
                  value={editingBooking.transactionId}
                  onChange={(e) =>
                    setEditingBooking({ ...editingBooking, transactionId: e.target.value })
                  }
                  className={`w-full px-3 py-2 rounded-xl border font-mono font-bold tabular-nums ${
                    darkMode
                      ? 'bg-slate-950 border-slate-700 text-amber-400'
                      : 'bg-slate-50 border-slate-200 text-amber-700'
                  }`}
                />
              </div>

              {/* Health Concern */}
              <div className="space-y-1 sm:col-span-2">
                <label className="font-bold opacity-75 block">
                  {isBn ? 'স্বাস্থ্য সমস্যা / ক্লিনিক্যাল বিবরণ:' : 'Clinical Health Concern:'}
                </label>
                <input
                  type="text"
                  value={editingBooking.healthConcern}
                  onChange={(e) =>
                    setEditingBooking({ ...editingBooking, healthConcern: e.target.value })
                  }
                  className={`w-full px-3 py-2 rounded-xl border ${
                    darkMode
                      ? 'bg-slate-950 border-slate-700 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200/70 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingBooking(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-500/15 text-xs font-extrabold"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  adminUpdateBookingManagement(editingBooking.id, {
                    patientName: editingBooking.patientName,
                    patientPhone: editingBooking.patientPhone,
                    patientEmail: editingBooking.patientEmail,
                    healthConcern: editingBooking.healthConcern,
                    nutritionistId: editingBooking.nutritionistId,
                    appointmentDate: editingBooking.appointmentDate,
                    appointmentSlot: editingBooking.appointmentSlot,
                    consultationFeeBdt: editingBooking.consultationFeeBdt,
                    durationMinutes: editingBooking.durationMinutes,
                    sessionRating: editingBooking.sessionRating,
                    senderNumber: editingBooking.senderNumber,
                    transactionId: editingBooking.transactionId,
                    adminNotes: editingBooking.adminNotes,
                  });
                  setEditingBooking(null);
                  setCalendarStatusMessage(
                    isBn
                      ? `✓ অ্যাপয়েন্টমেন্ট (${editingBooking.id})-এর ডাটা ও ফি (৳${editingBooking.consultationFeeBdt}) সফলভাবে আপডেট হয়েছে!`
                      : `✓ Updated booking (${editingBooking.id}) data and consultation fee (৳${editingBooking.consultationFeeBdt})!`
                  );
                  setTimeout(() => setCalendarStatusMessage(null), 4000);
                }}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold shadow-md"
              >
                {isBn ? '✓ ডাটা ও ফি সংরক্ষণ করুন' : '✓ Save Data & Pricing'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: NUTRITIONIST PROFILE DATA, SLOTS & PRICING EDITOR            */}
      {/* ===================================================================== */}
      {editingNutritionist && (
        <div className="fixed inset-0 z-[260] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-2xl rounded-3xl border p-6 md:p-7 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto ${
              darkMode
                ? 'bg-slate-900 border-slate-700 text-white'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200/70 dark:border-slate-800">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 text-[10px] font-black uppercase">
                  {editingNutritionist.id} • {isBn ? 'পুষ্টিবিদ ডাটা ও ফি এডিটর' : 'Dietitian Data & Pricing Editor'}
                </span>
                <h3 className="text-lg font-black mt-1">
                  {isBn
                    ? 'পুষ্টিবিদের প্রোফাইল তথ্য, কনসালটেশন ফি ও টাইম স্লট আপডেট করুন'
                    : 'Update Nutritionist Profile Data, Consultation Fee & Time Slots'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingNutritionist(null)}
                className="p-1.5 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Profile Photo Uploader (Free-Tier Smart HD Optimizer) */}
              <div className="sm:col-span-2 p-3.5 rounded-2xl border border-teal-500/30 bg-teal-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-2xl overflow-hidden shrink-0 border-2 border-teal-400/50">
                    {editingNutritionist.photoUrl ? (
                      <img
                        src={editingNutritionist.photoUrl}
                        alt={editingNutritionist.fullNameEn}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      '👩‍⚕️'
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <div className="font-extrabold text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5" />
                      <span>
                        {isBn
                          ? 'ডাক্তার / নিউট্রিশনিস্ট প্রোফাইল ফটো (Free-Tier Smart HD)'
                          : 'Doctor / Nutritionist Profile Photo (Free-Tier Smart HD)'}
                      </span>
                    </div>
                    <p className="text-[11px] opacity-75">
                      {isBn
                        ? 'যেকোনো সাইজের ছবি আপলোড করলে কোয়ালিটি ঠিক রেখে অটো-রিসাইজ (~15-24 KB) হবে।'
                        : 'Any image size is automatically optimized (~15-24 KB) while preserving crisp HD quality.'}
                    </p>
                    {editingNutritionist.photoCompressionNote && (
                      <div className="text-[10px] font-extrabold text-emerald-500">
                        {editingNutritionist.photoCompressionNote}
                      </div>
                    )}
                  </div>
                </div>

                <label className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold cursor-pointer inline-flex items-center gap-1.5 shrink-0 shadow-sm">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isBn ? 'ফটো আপলোড ও ক্রপ' : 'Upload & Crop Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setPendingAdminCropFile(file);
                      }
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>

              {/* Consultation Fee (BDT) */}
              <div className="space-y-1.5 sm:col-span-2 p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/5">
                <label className="font-extrabold text-amber-500 block">
                  {isBn
                    ? '💰 পুষ্টিবিদের কনসালটেশন ফি (Consultation Fee in BDT ৳):'
                    : '💰 Dietitian Consultation Fee (BDT ৳):'}
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    step={50}
                    value={editingNutritionist.consultationFeeBdt}
                    onChange={(e) =>
                      setEditingNutritionist({
                        ...editingNutritionist,
                        consultationFeeBdt: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                    className={`w-36 px-3 py-2 rounded-xl border text-sm font-black font-mono tabular-nums ${
                      darkMode
                        ? 'bg-slate-950 border-slate-700 text-amber-400'
                        : 'bg-white border-slate-300 text-amber-700'
                    }`}
                  />
                  {[500, 600, 800, 1000, 1200, 1500].map((fee) => (
                    <button
                      key={fee}
                      type="button"
                      onClick={() =>
                        setEditingNutritionist({
                          ...editingNutritionist,
                          consultationFeeBdt: fee,
                        })
                      }
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold font-mono tabular-nums border ${
                        editingNutritionist.consultationFeeBdt === fee
                          ? 'bg-amber-500 text-slate-950 border-amber-500'
                          : darkMode
                          ? 'bg-slate-900 border-slate-800 text-slate-300'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      ৳{fee}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name (Bangla & English) */}
              <div className="space-y-1">
                <label className="font-bold opacity-75 block">
                  {isBn ? 'নাম (বাংলা):' : 'Full Name (Bangla):'}
                </label>
                <input
                  type="text"
                  value={editingNutritionist.fullNameBn}
                  onChange={(e) =>
                    setEditingNutritionist({ ...editingNutritionist, fullNameBn: e.target.value })
                  }
                  className={`w-full px-3 py-2 rounded-xl border font-bold ${
                    darkMode
                      ? 'bg-slate-950 border-slate-700 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold opacity-75 block">
                  {isBn ? 'নাম (English):' : 'Full Name (English):'}
                </label>
                <input
                  type="text"
                  value={editingNutritionist.fullNameEn}
                  onChange={(e) =>
                    setEditingNutritionist({ ...editingNutritionist, fullNameEn: e.target.value })
                  }
                  className={`w-full px-3 py-2 rounded-xl border font-bold ${
                    darkMode
                      ? 'bg-slate-950 border-slate-700 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              {/* Specialty (Bangla & English) */}
              <div className="space-y-1">
                <label className="font-bold opacity-75 block">
                  {isBn ? 'বিশেষজ্ঞতা (বাংলা):' : 'Specialty (Bangla):'}
                </label>
                <input
                  type="text"
                  value={editingNutritionist.specialtyBn}
                  onChange={(e) =>
                    setEditingNutritionist({ ...editingNutritionist, specialtyBn: e.target.value })
                  }
                  className={`w-full px-3 py-2 rounded-xl border ${
                    darkMode
                      ? 'bg-slate-950 border-slate-700 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold opacity-75 block">
                  {isBn ? 'বিশেষজ্ঞতা (English):' : 'Specialty (English):'}
                </label>
                <input
                  type="text"
                  value={editingNutritionist.specialtyEn}
                  onChange={(e) =>
                    setEditingNutritionist({ ...editingNutritionist, specialtyEn: e.target.value })
                  }
                  className={`w-full px-3 py-2 rounded-xl border ${
                    darkMode
                      ? 'bg-slate-950 border-slate-700 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              {/* Available Days (BN & EN) */}
              <div className="space-y-1">
                <label className="font-bold opacity-75 block">
                  {isBn ? 'সেশন দিনসমূহ (বাংলা):' : 'Available Days (Bangla):'}
                </label>
                <input
                  type="text"
                  value={editingNutritionist.availableDaysBn}
                  onChange={(e) =>
                    setEditingNutritionist({
                      ...editingNutritionist,
                      availableDaysBn: e.target.value,
                    })
                  }
                  className={`w-full px-3 py-2 rounded-xl border ${
                    darkMode
                      ? 'bg-slate-950 border-slate-700 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold opacity-75 block">
                  {isBn ? 'সেশন দিনসমূহ (English):' : 'Available Days (English):'}
                </label>
                <input
                  type="text"
                  value={editingNutritionist.availableDaysEn}
                  onChange={(e) =>
                    setEditingNutritionist({
                      ...editingNutritionist,
                      availableDaysEn: e.target.value,
                    })
                  }
                  className={`w-full px-3 py-2 rounded-xl border ${
                    darkMode
                      ? 'bg-slate-950 border-slate-700 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              {/* Available Time Slots (comma separated) */}
              <div className="space-y-1 sm:col-span-2">
                <label className="font-bold opacity-75 block">
                  {isBn
                    ? 'নির্ধারিত টাইম স্লটসমূহ (কমা দিয়ে লিখুন — ক্যালেন্ডার ভিউতে সাথে সাথে আপডেট হবে):'
                    : 'Scheduled Time Slots (comma-separated — updates Calendar Matrix live):'}
                </label>
                <input
                  type="text"
                  value={editingNutritionist.availableSlotsText}
                  onChange={(e) =>
                    setEditingNutritionist({
                      ...editingNutritionist,
                      availableSlotsText: e.target.value,
                    })
                  }
                  placeholder="10:30 AM, 12:00 PM, 06:00 PM, 07:30 PM"
                  className={`w-full px-3 py-2 rounded-xl border font-mono font-bold tabular-nums ${
                    darkMode
                      ? 'bg-slate-950 border-slate-700 text-teal-400'
                      : 'bg-slate-50 border-slate-200 text-teal-700'
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200/70 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingNutritionist(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-500/15 text-xs font-extrabold"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const parsedSlots = editingNutritionist.availableSlotsText
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean);
                  adminUpdateNutritionistDetails(editingNutritionist.id, {
                    fullNameBn: editingNutritionist.fullNameBn,
                    fullNameEn: editingNutritionist.fullNameEn,
                    roleTitleBn: editingNutritionist.roleTitleBn,
                    roleTitleEn: editingNutritionist.roleTitleEn,
                    specialtyBn: editingNutritionist.specialtyBn,
                    specialtyEn: editingNutritionist.specialtyEn,
                    institutionBn: editingNutritionist.institutionBn,
                    institutionEn: editingNutritionist.institutionEn,
                    experienceYears: editingNutritionist.experienceYears,
                    consultationFeeBdt: editingNutritionist.consultationFeeBdt,
                    availableDaysBn: editingNutritionist.availableDaysBn,
                    availableDaysEn: editingNutritionist.availableDaysEn,
                    availableSlots: parsedSlots,
                    defaultMeetUrl: editingNutritionist.defaultMeetUrl,
                    phone: editingNutritionist.phone,
                    email: editingNutritionist.email,
                    licenseNumber: editingNutritionist.licenseNumber,
                    photoUrl: editingNutritionist.photoUrl,
                  });
                  setEditingNutritionist(null);
                  setCalendarStatusMessage(
                    isBn
                      ? `✓ পুষ্টিবিদ (${editingNutritionist.fullNameBn})-এর প্রোফাইল ডাটা, স্লট ও ফি (৳${editingNutritionist.consultationFeeBdt}) আপডেট হয়েছে!`
                      : `✓ Updated dietitian (${editingNutritionist.fullNameEn}) data, slots, and fee (৳${editingNutritionist.consultationFeeBdt})!`
                  );
                  setTimeout(() => setCalendarStatusMessage(null), 4000);
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-md"
              >
                {isBn ? '✓ প্রোফাইল ও ফি সংরক্ষণ করুন' : '✓ Save Profile & Pricing'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: MANUAL PAYMENT DATA & PRICING EDITOR                         */}
      {/* ===================================================================== */}
      {editingPayment && (
        <div className="fixed inset-0 z-[260] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-lg rounded-3xl border p-6 md:p-7 space-y-5 shadow-2xl ${
              darkMode
                ? 'bg-slate-900 border-slate-700 text-white'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200/70 dark:border-slate-800">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-500 text-[10px] font-black uppercase">
                  {editingPayment.id} • {isBn ? 'পেমেন্ট ও প্রাইসিং এডিটর' : 'Payment Data & Pricing Editor'}
                </span>
                <h3 className="text-lg font-black mt-1">
                  {isBn
                    ? 'পেমেন্ট অ্যামাউন্ট ও ট্রানজেকশন ডাটা আপডেট করুন'
                    : 'Update Payment Amount & Transaction Details'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingPayment(null)}
                className="p-1.5 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-extrabold text-amber-500 block">
                  {isBn ? 'পেমেন্ট অ্যামাউন্ট / ফি (BDT ৳):' : 'Payment Amount / Fee (BDT ৳):'}
                </label>
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={editingPayment.amountBdt}
                  onChange={(e) =>
                    setEditingPayment({
                      ...editingPayment,
                      amountBdt: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                  className={`w-full px-3 py-2 rounded-xl border text-sm font-black font-mono tabular-nums ${
                    darkMode
                      ? 'bg-slate-950 border-slate-700 text-amber-400'
                      : 'bg-slate-50 border-slate-200 text-amber-700'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold opacity-75 block">
                  {isBn ? 'প্ল্যান / সার্ভিস নাম:' : 'Plan / Service Name:'}
                </label>
                <input
                  type="text"
                  value={editingPayment.planName}
                  onChange={(e) =>
                    setEditingPayment({ ...editingPayment, planName: e.target.value })
                  }
                  className={`w-full px-3 py-2 rounded-xl border font-bold ${
                    darkMode
                      ? 'bg-slate-950 border-slate-700 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold opacity-75 block">
                    {isBn ? 'ইউজারের নাম:' : 'User Name:'}
                  </label>
                  <input
                    type="text"
                    value={editingPayment.userName}
                    onChange={(e) =>
                      setEditingPayment({ ...editingPayment, userName: e.target.value })
                    }
                    className={`w-full px-3 py-2 rounded-xl border ${
                      darkMode
                        ? 'bg-slate-950 border-slate-700 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold opacity-75 block">
                    {isBn ? 'ট্রানজেকশন আইডি (TrxID):' : 'Transaction ID (TrxID):'}
                  </label>
                  <input
                    type="text"
                    value={editingPayment.transactionId}
                    onChange={(e) =>
                      setEditingPayment({ ...editingPayment, transactionId: e.target.value })
                    }
                    className={`w-full px-3 py-2 rounded-xl border font-mono font-bold tabular-nums ${
                      darkMode
                        ? 'bg-slate-950 border-slate-700 text-amber-400'
                        : 'bg-slate-50 border-slate-200 text-amber-700'
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200/70 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingPayment(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-500/15 text-xs font-extrabold"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  adminUpdatePaymentSubmission(editingPayment.id, {
                    amountBdt: editingPayment.amountBdt,
                    planName: editingPayment.planName,
                    userName: editingPayment.userName,
                    userEmail: editingPayment.userEmail,
                    senderNumber: editingPayment.senderNumber,
                    transactionId: editingPayment.transactionId,
                    notes: editingPayment.notes,
                  });
                  setEditingPayment(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-md"
              >
                {isBn ? '✓ পেমেন্ট ডাটা ও ফি সংরক্ষণ' : '✓ Save Payment & Pricing'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CIRCULAR FACE CROP MODAL FOR ADMIN NUTRITIONIST PHOTO EDITOR */}
      <ProfilePhotoCropModal
        file={pendingAdminCropFile}
        lang={lang}
        darkMode={darkMode}
        onCancel={() => setPendingAdminCropFile(null)}
        onConfirm={(res) => {
          setPendingAdminCropFile(null);
          setEditingNutritionist((prev) =>
            prev
              ? {
                  ...prev,
                  photoUrl: res.dataUrl,
                  photoCompressionNote: `✓ ${formatByteSize(res.originalBytes)} ➔ ${formatByteSize(res.compressedBytes)} (${res.savingsPercent}% সাশ্রয় • ${res.width}×${res.height}px)`,
                }
              : null
          );
        }}
      />
    </div>
  );
};

export default AdminPanelView;
