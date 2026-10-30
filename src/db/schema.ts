import { relations } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// 1. Authenticated Users Table (linked via Firebase Auth UID)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  name: text('name').notNull().default('User'),
  role: text('role').notNull().default('user'),
  isSubscribed: boolean('is_subscribed').notNull().default(false),
  region: text('region').notNull().default('BD'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 2. Nutritionists & Consultation Schedules Table
export const nutritionists = pgTable('nutritionists', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  fullNameBn: text('full_name_bn').notNull(),
  fullNameEn: text('full_name_en').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  roleTitleBn: text('role_title_bn').notNull(),
  roleTitleEn: text('role_title_en').notNull(),
  licenseNumber: text('license_number').notNull(),
  specialtyBn: text('specialty_bn').notNull(),
  specialtyEn: text('specialty_en').notNull(),
  institutionBn: text('institution_bn').notNull(),
  institutionEn: text('institution_en').notNull(),
  experienceYears: integer('experience_years').notNull().default(5),
  consultationFeeBdt: integer('consultation_fee_bdt').notNull().default(800),
  availableDaysBn: text('available_days_bn').notNull(),
  availableDaysEn: text('available_days_en').notNull(),
  availableSlotsJson: text('available_slots_json').notNull().default('[]'),
  bioBn: text('bio_bn').notNull(),
  bioEn: text('bio_en').notNull(),
  avatarEmoji: text('avatar_emoji').notNull().default('👩‍⚕️'),
  photoUrl: text('photo_url').default(''),
  rating: doublePrecision('rating').notNull().default(4.9),
  reviewsCount: integer('reviews_count').notNull().default(1),
  status: text('status').notNull().default('approved'),
  isFeatured: boolean('is_featured').notNull().default(false),
  defaultMeetUrl: text('default_meet_url').notNull().default('https://meet.google.com/new'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 3. Nutritionist Consultation Bookings Table
export const nutritionistBookings = pgTable('nutritionist_bookings', {
  id: text('id').primaryKey(),
  nutritionistId: text('nutritionist_id')
    .references(() => nutritionists.id)
    .notNull(),
  nutritionistNameBn: text('nutritionist_name_bn').notNull(),
  nutritionistNameEn: text('nutritionist_name_en').notNull(),
  nutritionistEmail: text('nutritionist_email').notNull(),
  patientUserId: text('patient_user_id').notNull(),
  patientName: text('patient_name').notNull(),
  patientEmail: text('patient_email').notNull(),
  patientPhone: text('patient_phone').notNull(),
  appointmentDate: text('appointment_date').notNull(),
  appointmentSlot: text('appointment_slot').notNull(),
  healthConcern: text('health_concern').notNull(),
  consultationFeeBdt: integer('consultation_fee_bdt').notNull(),
  paymentMethod: text('payment_method').notNull(),
  senderNumber: text('sender_number').notNull(),
  transactionId: text('transaction_id').notNull(),
  paymentId: text('payment_id').notNull(),
  status: text('status').notNull().default('pending_admin'),
  paymentStatus: text('payment_status').notNull().default('pending'),
  sessionReadiness: text('session_readiness').notNull().default('awaiting_payment'),
  clinicalBriefPrepared: boolean('clinical_brief_prepared').notNull().default(true),
  nutritionistReady: boolean('nutritionist_ready').notNull().default(false),
  patientReady: boolean('patient_ready').notNull().default(false),
  durationMinutes: integer('duration_minutes').notNull().default(45),
  sessionRating: doublePrecision('session_rating').notNull().default(4.9),
  adminNotes: text('admin_notes').default(''),
  googleMeetLink: text('google_meet_link').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  approvedAt: timestamp('approved_at'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 4. Premium Subscriptions & Manual Payment Transactions Table
export const paymentTransactions = pgTable('payment_transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  userName: text('user_name').notNull(),
  userEmail: text('user_email').notNull(),
  paymentType: text('payment_type').notNull().default('subscription'),
  planName: text('plan_name').notNull(),
  amountBdt: integer('amount_bdt').notNull(),
  method: text('method').notNull(),
  senderNumber: text('sender_number').notNull(),
  transactionId: text('transaction_id').notNull(),
  notes: text('notes').default(''),
  status: text('status').notNull().default('pending'),
  relatedBookingId: text('related_booking_id'),
  approvalEmailSent: boolean('approval_email_sent').notNull().default(false),
  submittedAt: timestamp('submitted_at').defaultNow(),
  reviewedAt: timestamp('reviewed_at'),
});

// 5. Patient Clinical Assessments & Phase Progress Logs (Phases 1-4)
export const clinicalAssessments = pgTable('clinical_assessments', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  userEmail: text('user_email').notNull(),
  currentPhase: integer('current_phase').notNull(),
  targetPhase: integer('target_phase').notNull(),
  improved: boolean('improved').notNull().default(false),
  improvementScore: doublePrecision('improvement_score').notNull().default(0),
  baselineConditionsJson: text('baseline_conditions_json').notNull().default('[]'),
  answersJson: text('answers_json').notNull().default('{}'),
  recommendationBn: text('recommendation_bn').notNull().default(''),
  recommendationEn: text('recommendation_en').notNull().default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

// 6. Food Guide Catalog Table
export const foodCatalog = pgTable('food_catalog', {
  id: text('id').primaryKey(),
  nameBn: text('name_bn').notNull(),
  nameEn: text('name_en').notNull(),
  category: text('category').notNull(),
  caloriesPer100g: doublePrecision('calories_per_100g').notNull().default(100),
  proteinG: doublePrecision('protein_g').notNull().default(0),
  carbsG: doublePrecision('carbs_g').notNull().default(0),
  fatG: doublePrecision('fat_g').notNull().default(0),
  fiberG: doublePrecision('fiber_g').notNull().default(0),
  trafficZone: text('traffic_zone').notNull().default('green'),
  healthBenefitsBn: text('health_benefits_bn').notNull(),
  healthBenefitsEn: text('health_benefits_en').notNull(),
  status: text('status').notNull().default('approved'),
  submittedByEmail: text('submitted_by_email').notNull().default('admin@precision.com'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 7. Clinical Supplement Inventory Table
export const supplementInventory = pgTable('supplement_inventory', {
  id: text('id').primaryKey(),
  nameBn: text('name_bn').notNull(),
  nameEn: text('name_en').notNull(),
  dosage: text('dosage').notNull(),
  timingBn: text('timing_bn').notNull(),
  timingEn: text('timing_en').notNull(),
  clinicalPurposeBn: text('clinical_purpose_bn').notNull(),
  clinicalPurposeEn: text('clinical_purpose_en').notNull(),
  phaseEligibility: text('phase_eligibility').notNull().default('1,2,3,4'),
  isPremiumOnly: boolean('is_premium_only').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Drizzle Relations
export const nutritionistsRelations = relations(nutritionists, ({ many }) => ({
  bookings: many(nutritionistBookings),
}));

export const nutritionistBookingsRelations = relations(nutritionistBookings, ({ one }) => ({
  nutritionist: one(nutritionists, {
    fields: [nutritionistBookings.nutritionistId],
    references: [nutritionists.id],
  }),
}));
