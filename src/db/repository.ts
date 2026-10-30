import { eq, and, desc } from 'drizzle-orm';
import { db, isSqlConfigured } from './index.ts';
import {
  users,
  nutritionists,
  nutritionistBookings,
  paymentTransactions,
  clinicalAssessments,
  foodCatalog,
  supplementInventory,
} from './schema.ts';

// ============================================================================
// ZERO-COST ($0) IN-MEMORY RELATIONAL STORE & EDGE CACHE FALLBACK
// Automatically backs all relational tables when running in a $0 zero-billing
// environment without incurring any cloud compute or database charges.
// ============================================================================

export interface ClinicalAssessmentRecord {
  id: string;
  userId: string;
  userEmail: string;
  currentPhase: number;
  targetPhase: number;
  improved: boolean;
  improvementScore: number;
  baselineConditionsJson: string;
  answersJson: string;
  recommendationBn: string;
  recommendationEn: string;
  createdAt: string;
}

export interface SupplementCatalogRecord {
  id: string;
  nameBn: string;
  nameEn: string;
  dosage: string;
  timingBn: string;
  timingEn: string;
  clinicalPurposeBn: string;
  clinicalPurposeEn: string;
  phaseEligibility: string;
  isPremiumOnly: boolean;
  createdAt: string;
}

const zeroCostMemoryStore = {
  users: new Map<string, { uid: string; email: string; name: string; role: string; isSubscribed: boolean; region: string }>(),
  nutritionists: new Map<string, any>(),
  bookings: new Map<string, any>(),
  payments: new Map<string, any>(),
  assessments: new Map<string, ClinicalAssessmentRecord>(),
  foods: new Map<string, any>(),
  supplements: new Map<string, SupplementCatalogRecord>(),
};

// Seed default clinical supplements & initial catalog items into the zero-cost store
const seedInitialZeroCostStore = () => {
  if (zeroCostMemoryStore.supplements.size > 0) return;

  const initialSupplements: SupplementCatalogRecord[] = [
    {
      id: 'SUPP-101',
      nameBn: 'এল-গ্লুটামিন পাউডার (L-Glutamine Clinical Grade)',
      nameEn: 'L-Glutamine Powder (Pharmaceutical Gut Repair)',
      dosage: '5g daily',
      timingBn: 'সকালে খালি পেটে হালকা কুসুম গরম পানির সাথে',
      timingEn: 'Morning on an empty stomach with lukewarm water',
      clinicalPurposeBn: 'অন্ত্রের মিউকোসাল লাইনিং মেরামত ও লিকি গাট নিরাময়ে প্রথম ধাপের মূল সাপ্লিমেন্ট।',
      clinicalPurposeEn: 'Primary fuel for enterocytes to seal leaky gut junctions in Phase 1.',
      phaseEligibility: '1,2,3,4',
      isPremiumOnly: false, // First supplement visible to free users
      createdAt: new Date().toISOString(),
    },
    {
      id: 'SUPP-102',
      nameBn: 'মাল্টি-স্ট্রেইন প্রোবায়োটিক ৫০ বিলিয়ন সিএফইউ (S. Boulardii + L. Rhamnosus)',
      nameEn: 'Multi-Strain Spore Probiotic (50 Billion CFU)',
      dosage: '1 capsule daily',
      timingBn: 'রাতের খাবারের ৩০ মিনিট পর',
      timingEn: '30 minutes after dinner',
      clinicalPurposeBn: 'গাট মাইক্রোবায়োম পুনর্গঠন ও আইবিএস-জনিত পেট ফাঁপা দূর করতে কার্যকর।',
      clinicalPurposeEn: 'Rebuilds beneficial gut flora and reduces bloating in Phase 2 & 3.',
      phaseEligibility: '2,3,4',
      isPremiumOnly: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'SUPP-103',
      nameBn: 'ম্যাগনেসিয়াম গ্লাইসিনেট (Magnesium Bisglycinate Chelate)',
      nameEn: 'Magnesium Bisglycinate (400mg Elemental)',
      dosage: '400mg nightly',
      timingBn: 'ঘুমানোর ৪৫ মিনিট আগে',
      timingEn: '45 minutes before sleep',
      clinicalPurposeBn: 'ইনসুলিন সেন্সিটিভিটি বৃদ্ধি, কর্টিসল নিয়ন্ত্রণ এবং গভীর ঘুমের জন্য।',
      clinicalPurposeEn: 'Enhances insulin sensitivity, lowers evening cortisol, and supports vagus nerve tone.',
      phaseEligibility: '1,2,3,4',
      isPremiumOnly: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'SUPP-104',
      nameBn: 'ওমেগা-৩ ট্রাইগ্লিসারাইড ফিশ অয়েল (EPA 1000mg / DHA 500mg)',
      nameEn: 'High-Potency Omega-3 Triglyceride Fish Oil',
      dosage: '2 softgels daily',
      timingBn: 'দুপুরের খাবারের সাথে',
      timingEn: 'With lunch containing healthy fats',
      clinicalPurposeBn: 'ফ্যাটি লিভার ও মেটাবলিক প্রদাহ (CRP) কমাতে ক্লিনিক্যালি প্রমাণিত।',
      clinicalPurposeEn: 'Reduces hepatic steatosis, triglycerides, and systemic inflammation.',
      phaseEligibility: '1,2,3,4',
      isPremiumOnly: true,
      createdAt: new Date().toISOString(),
    },
  ];

  for (const supp of initialSupplements) {
    zeroCostMemoryStore.supplements.set(supp.id, supp);
  }
};

seedInitialZeroCostStore();

// Simple TTL read cache to minimize database wakeups (Scale-to-Zero optimization)
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}
const readCache = new Map<string, CacheEntry<any>>();
const CACHE_TTL_MS = 60 * 1000; // 60s server memory cache

function getCached<T>(key: string): T | null {
  const hit = readCache.get(key);
  if (hit && hit.expiresAt > Date.now()) {
    return hit.data as T;
  }
  readCache.delete(key);
  return null;
}

function setCached<T>(key: string, data: T): void {
  readCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

export function invalidateCache(prefix?: string): void {
  if (!prefix) {
    readCache.clear();
    return;
  }
  for (const k of readCache.keys()) {
    if (k.startsWith(prefix)) {
      readCache.delete(k);
    }
  }
}

// ============================================================================
// 1. USER REGISTRATION & UPSERT (Linked to Firebase Auth UID)
// ============================================================================

export async function getOrCreateUser(uid: string, email: string, name = 'User') {
  const fallbackUser = {
    uid,
    email,
    name,
    role: email.trim().toLowerCase() === 'ramkrisna97@gmail.com' ? 'admin' : 'user',
    isSubscribed: email.trim().toLowerCase() === 'ramkrisna97@gmail.com',
    region: 'BD',
  };
  zeroCostMemoryStore.users.set(uid, fallbackUser);

  if (!isSqlConfigured()) {
    return fallbackUser;
  }

  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        name,
        role: fallbackUser.role,
        isSubscribed: fallbackUser.isSubscribed,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          name,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0] || fallbackUser;
  } catch (error) {
    console.error('Database query failed in getOrCreateUser:', error);
    return fallbackUser;
  }
}

// ============================================================================
// 2. NUTRITIONISTS & CONSULTATION BOOKINGS (With Conflict Detection)
// ============================================================================

export async function getNutritionistsList() {
  const cached = getCached<any[]>('nutritionists:all');
  if (cached) return cached;

  if (!isSqlConfigured()) {
    const list = Array.from(zeroCostMemoryStore.nutritionists.values());
    setCached('nutritionists:all', list);
    return list;
  }

  try {
    const rows = await db.select().from(nutritionists).orderBy(desc(nutritionists.createdAt));
    const formatted = rows.map((r) => ({
      ...r,
      availableSlots: (() => {
        try {
          return JSON.parse(r.availableSlotsJson || '[]');
        } catch {
          return [];
        }
      })(),
    }));
    setCached('nutritionists:all', formatted);
    return formatted;
  } catch (error) {
    console.error('Database query failed in getNutritionistsList:', error);
    return Array.from(zeroCostMemoryStore.nutritionists.values());
  }
}

export async function upsertNutritionistRecord(item: any) {
  invalidateCache('nutritionists:');
  zeroCostMemoryStore.nutritionists.set(item.id, item);

  if (!isSqlConfigured()) {
    return item;
  }

  try {
    const slotsJson = JSON.stringify(item.availableSlots || []);
    await db
      .insert(nutritionists)
      .values({
        id: item.id,
        userId: item.userId || item.id,
        fullNameBn: item.fullNameBn,
        fullNameEn: item.fullNameEn,
        email: item.email,
        phone: item.phone || '',
        roleTitleBn: item.roleTitleBn || '',
        roleTitleEn: item.roleTitleEn || '',
        licenseNumber: item.licenseNumber || '',
        specialtyBn: item.specialtyBn || '',
        specialtyEn: item.specialtyEn || '',
        institutionBn: item.institutionBn || '',
        institutionEn: item.institutionEn || '',
        experienceYears: Number(item.experienceYears) || 5,
        consultationFeeBdt: Number(item.consultationFeeBdt) || 800,
        availableDaysBn: item.availableDaysBn || '',
        availableDaysEn: item.availableDaysEn || '',
        availableSlotsJson: slotsJson,
        bioBn: item.bioBn || '',
        bioEn: item.bioEn || '',
        avatarEmoji: item.avatarEmoji || '👩‍⚕️',
        photoUrl: item.photoUrl || '',
        rating: Number(item.rating) || 4.9,
        reviewsCount: Number(item.reviewsCount) || 1,
        status: item.status || 'approved',
        isFeatured: Boolean(item.isFeatured),
        defaultMeetUrl: item.defaultMeetUrl || 'https://meet.google.com/new',
      })
      .onConflictDoUpdate({
        target: nutritionists.id,
        set: {
          fullNameBn: item.fullNameBn,
          fullNameEn: item.fullNameEn,
          email: item.email,
          phone: item.phone || '',
          roleTitleBn: item.roleTitleBn || '',
          roleTitleEn: item.roleTitleEn || '',
          licenseNumber: item.licenseNumber || '',
          specialtyBn: item.specialtyBn || '',
          specialtyEn: item.specialtyEn || '',
          institutionBn: item.institutionBn || '',
          institutionEn: item.institutionEn || '',
          experienceYears: Number(item.experienceYears) || 5,
          consultationFeeBdt: Number(item.consultationFeeBdt) || 800,
          availableDaysBn: item.availableDaysBn || '',
          availableDaysEn: item.availableDaysEn || '',
          availableSlotsJson: slotsJson,
          bioBn: item.bioBn || '',
          bioEn: item.bioEn || '',
          avatarEmoji: item.avatarEmoji || '👩‍⚕️',
          photoUrl: item.photoUrl || '',
          status: item.status || 'approved',
          isFeatured: Boolean(item.isFeatured),
          defaultMeetUrl: item.defaultMeetUrl || 'https://meet.google.com/new',
        },
      });
    return item;
  } catch (error) {
    console.error('Database query failed in upsertNutritionistRecord:', error);
    return item;
  }
}

export async function getBookingsList() {
  if (!isSqlConfigured()) {
    return Array.from(zeroCostMemoryStore.bookings.values());
  }

  try {
    const rows = await db
      .select()
      .from(nutritionistBookings)
      .orderBy(desc(nutritionistBookings.createdAt));
    return rows;
  } catch (error) {
    console.error('Database query failed in getBookingsList:', error);
    return Array.from(zeroCostMemoryStore.bookings.values());
  }
}

export async function checkBookingSlotConflict(
  nutritionistId: string,
  appointmentDate: string,
  appointmentSlot: string,
  excludeBookingId?: string
): Promise<{ hasConflict: boolean; conflictingBookingId?: string }> {
  const memBookings = Array.from(zeroCostMemoryStore.bookings.values());
  const memHit = memBookings.find(
    (b) =>
      b.nutritionistId === nutritionistId &&
      b.appointmentDate === appointmentDate &&
      b.appointmentSlot === appointmentSlot &&
      b.status !== 'rejected' &&
      b.id !== excludeBookingId
  );

  if (!isSqlConfigured()) {
    return {
      hasConflict: Boolean(memHit),
      conflictingBookingId: memHit?.id,
    };
  }

  try {
    const rows = await db
      .select()
      .from(nutritionistBookings)
      .where(
        and(
          eq(nutritionistBookings.nutritionistId, nutritionistId),
          eq(nutritionistBookings.appointmentDate, appointmentDate),
          eq(nutritionistBookings.appointmentSlot, appointmentSlot)
        )
      );
    const activeConflict = rows.find(
      (r) => r.status !== 'rejected' && r.id !== excludeBookingId
    );
    return {
      hasConflict: Boolean(activeConflict),
      conflictingBookingId: activeConflict?.id,
    };
  } catch (error) {
    console.error('Database query failed in checkBookingSlotConflict:', error);
    return {
      hasConflict: Boolean(memHit),
      conflictingBookingId: memHit?.id,
    };
  }
}

export async function upsertBookingRecord(booking: any) {
  zeroCostMemoryStore.bookings.set(booking.id, booking);

  if (!isSqlConfigured()) {
    return booking;
  }

  try {
    await db
      .insert(nutritionistBookings)
      .values({
        id: booking.id,
        nutritionistId: booking.nutritionistId,
        nutritionistNameBn: booking.nutritionistNameBn || '',
        nutritionistNameEn: booking.nutritionistNameEn || '',
        nutritionistEmail: booking.nutritionistEmail || '',
        patientUserId: booking.patientUserId || 'USR-ANON',
        patientName: booking.patientName,
        patientEmail: booking.patientEmail,
        patientPhone: booking.patientPhone || '',
        appointmentDate: booking.appointmentDate,
        appointmentSlot: booking.appointmentSlot,
        healthConcern: booking.healthConcern || '',
        consultationFeeBdt: Number(booking.consultationFeeBdt) || 800,
        paymentMethod: booking.paymentMethod || 'bkash',
        senderNumber: booking.senderNumber || '',
        transactionId: booking.transactionId || '',
        paymentId: booking.paymentId || '',
        status: booking.status || 'pending_admin',
        paymentStatus: booking.paymentStatus || 'pending',
        sessionReadiness: booking.sessionReadiness || 'awaiting_payment',
        clinicalBriefPrepared: Boolean(booking.clinicalBriefPrepared ?? true),
        nutritionistReady: Boolean(booking.nutritionistReady),
        patientReady: Boolean(booking.patientReady),
        durationMinutes: Number(booking.durationMinutes) || 45,
        sessionRating: Number(booking.sessionRating) || 4.9,
        adminNotes: booking.adminNotes || '',
        googleMeetLink: booking.googleMeetLink || 'https://meet.google.com/new',
      })
      .onConflictDoUpdate({
        target: nutritionistBookings.id,
        set: {
          nutritionistId: booking.nutritionistId,
          nutritionistNameBn: booking.nutritionistNameBn || '',
          nutritionistNameEn: booking.nutritionistNameEn || '',
          nutritionistEmail: booking.nutritionistEmail || '',
          patientName: booking.patientName,
          patientEmail: booking.patientEmail,
          patientPhone: booking.patientPhone || '',
          appointmentDate: booking.appointmentDate,
          appointmentSlot: booking.appointmentSlot,
          healthConcern: booking.healthConcern || '',
          consultationFeeBdt: Number(booking.consultationFeeBdt) || 800,
          senderNumber: booking.senderNumber || '',
          transactionId: booking.transactionId || '',
          status: booking.status || 'pending_admin',
          paymentStatus: booking.paymentStatus || 'pending',
          sessionReadiness: booking.sessionReadiness || 'awaiting_payment',
          clinicalBriefPrepared: Boolean(booking.clinicalBriefPrepared ?? true),
          nutritionistReady: Boolean(booking.nutritionistReady),
          patientReady: Boolean(booking.patientReady),
          durationMinutes: Number(booking.durationMinutes) || 45,
          sessionRating: Number(booking.sessionRating) || 4.9,
          adminNotes: booking.adminNotes || '',
          googleMeetLink: booking.googleMeetLink || 'https://meet.google.com/new',
          updatedAt: new Date(),
        },
      });
    return booking;
  } catch (error) {
    console.error('Database query failed in upsertBookingRecord:', error);
    return booking;
  }
}

// ============================================================================
// 3. SUBSCRIPTIONS & MANUAL PAYMENT TRANSACTIONS
// ============================================================================

export async function getPaymentTransactionsList() {
  if (!isSqlConfigured()) {
    return Array.from(zeroCostMemoryStore.payments.values());
  }

  try {
    return await db
      .select()
      .from(paymentTransactions)
      .orderBy(desc(paymentTransactions.submittedAt));
  } catch (error) {
    console.error('Database query failed in getPaymentTransactionsList:', error);
    return Array.from(zeroCostMemoryStore.payments.values());
  }
}

export async function upsertPaymentTransactionRecord(payment: any) {
  zeroCostMemoryStore.payments.set(payment.id, payment);

  if (!isSqlConfigured()) {
    return payment;
  }

  try {
    await db
      .insert(paymentTransactions)
      .values({
        id: payment.id,
        userId: payment.userId || 'USR-ANON',
        userName: payment.userName,
        userEmail: payment.userEmail,
        paymentType: payment.paymentType || 'subscription',
        planName: payment.planName,
        amountBdt: Number(payment.amountBdt) || 0,
        method: payment.method || 'bkash',
        senderNumber: payment.senderNumber || '',
        transactionId: payment.transactionId || '',
        notes: payment.notes || '',
        status: payment.status || 'pending',
        relatedBookingId: payment.relatedBookingId || null,
        approvalEmailSent: Boolean(payment.approvalEmailSent),
      })
      .onConflictDoUpdate({
        target: paymentTransactions.id,
        set: {
          userName: payment.userName,
          userEmail: payment.userEmail,
          planName: payment.planName,
          amountBdt: Number(payment.amountBdt) || 0,
          senderNumber: payment.senderNumber || '',
          transactionId: payment.transactionId || '',
          notes: payment.notes || '',
          status: payment.status || 'pending',
          approvalEmailSent: Boolean(payment.approvalEmailSent),
          reviewedAt: payment.status !== 'pending' ? new Date() : null,
        },
      });
    return payment;
  } catch (error) {
    console.error('Database query failed in upsertPaymentTransactionRecord:', error);
    return payment;
  }
}

// ============================================================================
// 4. CLINICAL ASSESSMENTS & PHASE PROGRESS LOGS (Phases 1 -> 2 -> 3 -> 4)
// ============================================================================

export async function recordClinicalAssessmentLog(
  payload: Omit<ClinicalAssessmentRecord, 'id' | 'createdAt'> & { id?: string }
): Promise<ClinicalAssessmentRecord> {
  const record: ClinicalAssessmentRecord = {
    id: payload.id || `ASSESS-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    userId: payload.userId || 'USR-ANON',
    userEmail: payload.userEmail || 'anonymous@precision.com',
    currentPhase: Number(payload.currentPhase) || 1,
    targetPhase: Number(payload.targetPhase) || 2,
    improved: Boolean(payload.improved),
    improvementScore: Number(payload.improvementScore) || 0,
    baselineConditionsJson: payload.baselineConditionsJson || '[]',
    answersJson: payload.answersJson || '{}',
    recommendationBn: payload.recommendationBn || '',
    recommendationEn: payload.recommendationEn || '',
    createdAt: new Date().toISOString(),
  };

  zeroCostMemoryStore.assessments.set(record.id, record);

  if (!isSqlConfigured()) {
    return record;
  }

  try {
    await db
      .insert(clinicalAssessments)
      .values({
        id: record.id,
        userId: record.userId,
        userEmail: record.userEmail,
        currentPhase: record.currentPhase,
        targetPhase: record.targetPhase,
        improved: record.improved,
        improvementScore: record.improvementScore,
        baselineConditionsJson: record.baselineConditionsJson,
        answersJson: record.answersJson,
        recommendationBn: record.recommendationBn,
        recommendationEn: record.recommendationEn,
      })
      .onConflictDoUpdate({
        target: clinicalAssessments.id,
        set: {
          improved: record.improved,
          improvementScore: record.improvementScore,
          answersJson: record.answersJson,
        },
      });
    return record;
  } catch (error) {
    console.error('Database query failed in recordClinicalAssessmentLog:', error);
    return record;
  }
}

export async function getClinicalAssessmentLogs(userId?: string) {
  if (!isSqlConfigured()) {
    const all = Array.from(zeroCostMemoryStore.assessments.values());
    return userId ? all.filter((a) => a.userId === userId) : all;
  }

  try {
    if (userId) {
      return await db
        .select()
        .from(clinicalAssessments)
        .where(eq(clinicalAssessments.userId, userId))
        .orderBy(desc(clinicalAssessments.createdAt));
    }
    return await db
      .select()
      .from(clinicalAssessments)
      .orderBy(desc(clinicalAssessments.createdAt));
  } catch (error) {
    console.error('Database query failed in getClinicalAssessmentLogs:', error);
    const all = Array.from(zeroCostMemoryStore.assessments.values());
    return userId ? all.filter((a) => a.userId === userId) : all;
  }
}

// ============================================================================
// 5. FOOD GUIDE CATALOG & SUPPLEMENT INVENTORY (Edge-Cached)
// ============================================================================

export async function getFoodCatalogList() {
  const cached = getCached<any[]>('catalog:foods');
  if (cached) return cached;

  if (!isSqlConfigured()) {
    const list = Array.from(zeroCostMemoryStore.foods.values());
    setCached('catalog:foods', list);
    return list;
  }

  try {
    const rows = await db.select().from(foodCatalog).orderBy(desc(foodCatalog.createdAt));
    setCached('catalog:foods', rows);
    return rows;
  } catch (error) {
    console.error('Database query failed in getFoodCatalogList:', error);
    return Array.from(zeroCostMemoryStore.foods.values());
  }
}

export async function upsertFoodCatalogItem(food: any) {
  invalidateCache('catalog:foods');
  zeroCostMemoryStore.foods.set(food.id, food);

  if (!isSqlConfigured()) {
    return food;
  }

  try {
    await db
      .insert(foodCatalog)
      .values({
        id: food.id,
        nameBn: food.nameBn,
        nameEn: food.nameEn,
        category: food.category || 'General',
        caloriesPer100g: Number(food.caloriesPer100g) || 100,
        proteinG: Number(food.proteinG) || 0,
        carbsG: Number(food.carbsG) || 0,
        fatG: Number(food.fatG) || 0,
        fiberG: Number(food.fiberG) || 0,
        trafficZone: food.suggestedZone || food.trafficZone || 'green',
        healthBenefitsBn: food.healthBenefitsBn || '',
        healthBenefitsEn: food.healthBenefitsEn || '',
        status: food.status || 'approved',
        submittedByEmail: food.submittedByEmail || 'admin@precision.com',
      })
      .onConflictDoUpdate({
        target: foodCatalog.id,
        set: {
          status: food.status || 'approved',
          trafficZone: food.suggestedZone || food.trafficZone || 'green',
          healthBenefitsBn: food.healthBenefitsBn || '',
          healthBenefitsEn: food.healthBenefitsEn || '',
        },
      });
    return food;
  } catch (error) {
    console.error('Database query failed in upsertFoodCatalogItem:', error);
    return food;
  }
}

export async function getSupplementInventoryList() {
  const cached = getCached<SupplementCatalogRecord[]>('catalog:supplements');
  if (cached) return cached;

  if (!isSqlConfigured()) {
    const list = Array.from(zeroCostMemoryStore.supplements.values());
    setCached('catalog:supplements', list);
    return list;
  }

  try {
    const rows = await db
      .select()
      .from(supplementInventory)
      .orderBy(supplementInventory.id);
    if (rows.length === 0) {
      return Array.from(zeroCostMemoryStore.supplements.values());
    }
    const formatted: SupplementCatalogRecord[] = rows.map((r) => ({
      ...r,
      createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
    }));
    setCached('catalog:supplements', formatted);
    return formatted;
  } catch (error) {
    console.error('Database query failed in getSupplementInventoryList:', error);
    return Array.from(zeroCostMemoryStore.supplements.values());
  }
}

// Sync bulk platform state into the relational tables (or zero-cost memory store)
export async function syncPlatformStateToRelationalTables(state: any) {
  if (!state) return;

  if (Array.isArray(state.nutritionists)) {
    for (const n of state.nutritionists) {
      await upsertNutritionistRecord(n);
    }
  }
  if (Array.isArray(state.bookings)) {
    for (const b of state.bookings) {
      await upsertBookingRecord(b);
    }
  }
  if (Array.isArray(state.payments)) {
    for (const p of state.payments) {
      await upsertPaymentTransactionRecord(p);
    }
  }
  if (Array.isArray(state.foodSuggestions)) {
    for (const f of state.foodSuggestions) {
      await upsertFoodCatalogItem(f);
    }
  }
}
