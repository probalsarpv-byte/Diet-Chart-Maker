import {
  ManualPaymentSubmission,
  MarketplaceStoreRegistration,
  FoodSuggestionSubmission,
  CommunityModerationIncident,
  BannedCommunityUser,
  CommunityPost,
  NutritionistProfileListing,
  NutritionistBooking,
  SessionReadinessStatus,
  UserNotificationItem,
  PaymentMethodType,
  TrafficLightZone,
} from '../types';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const STORAGE_KEY = 'precision_platform_hub_v2';

export interface PlatformHubState {
  payments: ManualPaymentSubmission[];
  stores: MarketplaceStoreRegistration[];
  foodSuggestions: FoodSuggestionSubmission[];
  moderationIncidents: CommunityModerationIncident[];
  bannedUsers: BannedCommunityUser[];
  communityPosts: CommunityPost[];
  nutritionists: NutritionistProfileListing[];
  bookings: NutritionistBooking[];
  notifications: UserNotificationItem[];
  approvedPremiumEmails: string[];
  cloudflareSyncMeta: {
    lastSyncedAt: string;
    d1TablesCount: number;
    totalRowsSynced: number;
    workerEndpoint: string;
    tierStatus: 'Cloudflare Free Tier (D1 + KV Ready)' | 'Cloudflare Paid Tier';
  };
}

const todayIsoDate = () => new Date().toISOString().split('T')[0];

const getInitialPlatformState = (): PlatformHubState => ({
  payments: [
    {
      id: 'PAY-1001',
      userId: 'USR-4821',
      userName: 'তানভীর আহমেদ (Tanvir Ahmed)',
      userEmail: 'tanvir.ahmed@gmail.com',
      paymentType: 'subscription',
      planName: '৬ মাস প্রিমিয়াম ক্লিনিক্যাল প্ল্যান (6 Months Pro)',
      amountBdt: 1299,
      method: 'bkash',
      senderNumber: '01711-482910',
      transactionId: 'BKX94M28LP',
      notes: 'ডায়েট মেকার ও ফ্যামিলি পট আনলক করার জন্য বিকাশ পেমেন্ট করেছি।',
      status: 'pending',
      submittedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    },
    {
      id: 'PAY-1002',
      userId: 'USR-7912',
      userName: 'নুসরাত জাহান (Nusrat Jahan)',
      userEmail: 'nusrat.jahan@gmail.com',
      paymentType: 'consultation',
      planName: 'পুষ্টিবিদ কনসালটেশন বুকিং (ডা. ফারহানা রহমান)',
      amountBdt: 800,
      method: 'nagad',
      senderNumber: '01819-339102',
      transactionId: 'NGD77K19QA',
      notes: 'পিসিওএস এবং ইনসুলিন রেজিস্ট্যান্স ডায়েট পরামর্শের জন্য।',
      status: 'pending',
      submittedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      relatedBookingId: 'BK-2001',
    },
    {
      id: 'PAY-1000',
      userId: 'USR-3100',
      userName: 'কামরুল হাসান (Kamrul Hasan)',
      userEmail: 'kamrul.hasan@gmail.com',
      paymentType: 'consultation',
      planName: 'পুষ্টিবিদ কনসালটেশন বুকিং (ডা. আরিফুল ইসলাম)',
      amountBdt: 1000,
      method: 'bkash',
      senderNumber: '01713-556677',
      transactionId: 'BKX55P10ZZ',
      notes: 'গ্রেড-২ ফ্যাটি লিভার এবং উচ্চ ট্রাইগ্লিসারাইড কমানোর জন্য।',
      status: 'approved',
      submittedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      reviewedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      approvalEmailSent: true,
      relatedBookingId: 'BK-2000',
    },
    {
      id: 'PAY-1003',
      userId: 'USR-8840',
      userName: 'ফারজানা করিম (Farzana Karim)',
      userEmail: 'farzana.karim@gmail.com',
      paymentType: 'consultation',
      planName: 'পুষ্টিবিদ কনসালটেশন বুকিং (পুষ্টিবিদ তাসনিমা চৌধুরী)',
      amountBdt: 600,
      method: 'bkash',
      senderNumber: '01618-445566',
      transactionId: 'BKX88M12TR',
      notes: 'গর্ভকালীন ৭ম মাসের মাসানুমাসিক ডায়েট ও আয়রন ঘাটতি পরামর্শ।',
      status: 'approved',
      submittedAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
      reviewedAt: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
      approvalEmailSent: true,
      relatedBookingId: 'BK-2002',
    },
  ],
  stores: [
    {
      id: 'STR-301',
      ownerUserId: 'SELLER-101',
      ownerName: 'মাহমুদুল হাসান (Mahmudulul Hasan)',
      ownerEmail: 'greenharvest.bd@gmail.com',
      ownerPhone: '01712-998877',
      storeName: 'গ্রিন হারভেস্ট অর্গানিক ফুডস (Green Harvest BD)',
      licenseNumber: 'TRAD/DNCC/049281/2024',
      location: 'ধানমন্ডি, ঢাকা (Dhanmondi, Dhaka)',
      categoryFocus: 'Grains & Cold-Pressed Oils',
      description: 'দিনাজপুরের ঢেঁকিছাঁটা লাল চাল, কাঠের ঘানির সরিষার তেল এবং সুন্দরবনের খাঁটি মধু সরবরাহকারী।',
      status: 'pending',
      submittedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    },
    {
      id: 'STR-300',
      ownerUserId: 'SELLER-100',
      ownerName: 'আনোয়ার হোসেন',
      ownerEmail: 'dhaka.ayur@gmail.com',
      ownerPhone: '01911-223344',
      storeName: 'Dhaka Ayurvedic & Bio Labs',
      licenseNumber: 'TRAD/DSCC/019283/2023',
      location: 'বনানী, ঢাকা',
      categoryFocus: 'Supplements & A2 Ghee',
      description: 'ক্লিনিক্যালি পরীক্ষিত এ২ ঘি, ত্রিফলা এবং গাট রিস্টোর স্প্রাউট মিক্স।',
      status: 'approved',
      submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      reviewedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    },
  ],
  foodSuggestions: [
    {
      id: 'FSUG-401',
      submittedByUserId: 'USR-5120',
      submittedByName: 'সাদিয়া ইসলাম (Sadia Islam)',
      submittedByEmail: 'sadia.nutrition@gmail.com',
      nameBn: 'কাউনের চালের জাউ / পায়েস (চিনি ছাড়া)',
      nameEn: 'Foxtail Millet Porridge (Sugar-Free Kaon Rice)',
      category: 'Grains & Carbs',
      caloriesPer100g: 342,
      proteinG: 11.2,
      carbsG: 63.0,
      fatG: 4.1,
      fiberG: 6.7,
      suggestedZone: 'green',
      healthBenefitsBn: 'লো-গ্লাইসেমিক ইনডেক্স, ডায়াবেটিস ও ফ্যাটি লিভার রোগীদের জন্য সাদা ভাতের চমৎকার বিকল্প এবং উচ্চ ফাইবার সমৃদ্ধ।',
      healthBenefitsEn: 'Low glycemic index, rich in dietary fiber and plant protein; ideal rice substitute for diabetes and fatty liver.',
      status: 'pending',
      submittedAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    },
    {
      id: 'FSUG-402',
      submittedByUserId: 'USR-6011',
      submittedByName: 'রাশেদুল করিম',
      submittedByEmail: 'rashed.k@gmail.com',
      nameBn: 'সজনে পাতার গুঁড়া / ভর্তা (Moringa Leaf)',
      nameEn: 'Moringa Leaf Mash / Powder (Sajna Pata)',
      category: 'Vegetables & Greens',
      caloriesPer100g: 64,
      proteinG: 9.4,
      carbsG: 8.3,
      fatG: 1.4,
      fiberG: 2.0,
      suggestedZone: 'green',
      healthBenefitsBn: 'আয়রন, ক্যালসিয়াম ও অ্যান্টি-অক্সিডেন্টের খনি; রক্তস্বল্পতা ও প্রদাহ কমাতে অত্যন্ত কার্যকর।',
      healthBenefitsEn: 'Rich in bioavailable iron, calcium, and polyphenols; potent anti-inflammatory and anemia booster.',
      status: 'approved',
      submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
      reviewedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    },
  ],
  moderationIncidents: [
    {
      id: 'MOD-501',
      type: 'ai_auto_deleted',
      targetType: 'post',
      postId: 'AUTO-DEL-1',
      offenderName: 'CryptoKing99',
      offenderEmail: 'spammer99@mail.com',
      contentSnippet: ' ঘরে বসে প্রতিদিন ৫০০০ টাকা আয় করুন ক্রিপ্টো ও বেটিং সাইটে জয়েন করে...',
      reason: 'AI Auto-Moderation: পুষ্টি ও স্বাস্থ্য বহির্ভূত স্প্যাম/জুয়া সংক্রান্ত পোস্ট (Off-topic & Commercial Spam)',
      status: 'auto_removed',
      createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    },
    {
      id: 'MOD-502',
      type: 'user_reported',
      targetType: 'comment',
      postId: '1',
      commentId: 'c-rep-1',
      offenderName: 'ToxicUser_BD',
      offenderUserId: 'USR-9991',
      offenderEmail: 'toxic.bd@gmail.com',
      contentSnippet: 'এসব ডায়েট ফায়েট সব ভুয়া, আপনারা না জেনে মানুষকে বোকা বানাচ্ছেন!',
      reason: 'অন্য সদস্যকে ছোট করা ও আক্রমণাত্মক মন্তব্য (Harassment / Disrespectful Comment)',
      reportedByName: 'Aria S.',
      status: 'pending_review',
      createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    },
  ],
  bannedUsers: [],
  communityPosts: [
    {
      id: '1',
      author: 'Aria S.',
      authorId: 'USR-101',
      authorEmail: 'aria.s@gmail.com',
      dosha: 'Pitta',
      phase: 2,
      experience:
        'ধাপ ২ আমার হজমের জন্য দারুণ কাজ করেছে। পেট ফাঁপা ৮০% কমেছে! এই পর্যায়ে সবাইকে সকালে হালকা গরম আদা-জিরা পানি খাওয়ার পরামর্শ দিচ্ছি।',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      likes: 14,
      comments: [
        {
          id: 'c1',
          author: 'Dr. Holistic',
          authorId: 'DOC-101',
          text: 'অসাধারণ উন্নতি! পিত্ত-জনিত হজমের প্রদাহ কমাতে আদা ও ধনে ভেজানো পানি দারুণ কাজ করে।',
          timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
        },
        {
          id: 'c-rep-1',
          author: 'ToxicUser_BD',
          authorId: 'USR-9991',
          authorEmail: 'toxic.bd@gmail.com',
          text: 'এসব ডায়েট ফায়েট সব ভুয়া, আপনারা না জেনে মানুষকে বোকা বানাচ্ছেন!',
          timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        },
      ],
    },
    {
      id: '2',
      author: 'রাকিবুল হাসান (Rakibul H.)',
      authorId: 'USR-102',
      authorEmail: 'rakibul.h@gmail.com',
      dosha: 'Kapha',
      phase: 1,
      experience:
        'ট্রাফিক লাইট ফুড গাইড মেনে লাল চালের ভাত আর সজনে পাতার ঝোল খাওয়া শুরু করার পর আমার ফাস্টিং সুগার ৭.৮ থেকে ৫.৯ এ নেমে এসেছে। ধন্যবাদ প্রিসিশন নিউট্রিশন টিমকে!',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      likes: 19,
      comments: [
        {
          id: 'c2',
          author: 'ডা. ফারহানা রহমান',
          authorId: 'NUTRI-1',
          text: 'অভিনন্দন রাকিবুল! রাতের বেলা শস্য কার্ব কমিয়ে সবজি কার্ব চালু রাখলে ইনসুলিন সেন্সিটিভিটি আরও ভালো হবে।',
          timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        },
      ],
    },
  ],
  nutritionists: [
    {
      id: 'NUTRI-1',
      userId: 'DOC-FARHANA',
      fullNameBn: 'ডা. ফারহানা রহমান (Dr. Farhana Rahman)',
      fullNameEn: 'Dr. Farhana Rahman, Clinical Dietitian',
      email: 'dr.farhana@precision.com',
      phone: '01715-001122',
      roleTitleBn: 'চিফ ক্লিনিক্যাল ডায়েটিশিয়ান ও ফাংশনাল নিউট্রিশনিস্ট',
      roleTitleEn: 'Chief Clinical Dietitian & Functional Nutritionist',
      licenseNumber: 'BMDC-54920 / BDA-1042',
      specialtyBn: 'ডায়াবেটিস রিভার্সাল, পিসিওএস (PCOS), থাইরয়েড ও গাট মাইক্রোবায়োম',
      specialtyEn: 'Diabetes Reversal, PCOS, Thyroid & Gut Microbiome',
      institutionBn: 'স্কয়ার হসপিটাল ও প্রিসিশন মেটাবলিক সেন্টার, ঢাকা',
      institutionEn: 'Square Hospital & Precision Metabolic Center, Dhaka',
      experienceYears: 11,
      consultationFeeBdt: 800,
      availableDaysBn: 'শনি - বৃহস্পতি (বিকাল ৫:০০ - রাত ৯:৩০)',
      availableDaysEn: 'Sat - Thu (5:00 PM - 9:30 PM)',
      availableSlots: ['05:00 PM', '06:00 PM', '07:30 PM', '08:30 PM'],
      bioBn: '১১ বছরেরও বেশি সময় ধরে ফাংশনাল মেডিসিন ও বাংলাদেশি দেশি খাবারের মাধ্যমে মেটাবলিক রোগ নিরাময়ে কাজ করছেন।',
      bioEn: '11+ years of clinical experience in reversing metabolic disorders using Bangladeshi functional foods.',
      avatarEmoji: '👩‍⚕️',
      rating: 4.9,
      reviewsCount: 148,
      status: 'approved',
      isFeatured: true,
      featuredRequested: true,
      defaultMeetUrl: 'https://meet.google.com/new',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    },
    {
      id: 'NUTRI-2',
      userId: 'DOC-ARIFUL',
      fullNameBn: 'ডা. আরিফুল ইসলাম (Dr. Ariful Islam)',
      fullNameEn: 'Dr. Ariful Islam, Metabolic & Renal Nutritionist',
      email: 'dr.ariful@precision.com',
      phone: '01811-223399',
      roleTitleBn: 'ক্লিনিক্যাল নিউট্রিশনিস্ট ও অনকোলজি ডায়েট বিশেষজ্ঞ',
      roleTitleEn: 'Clinical Nutritionist & Oncology Diet Specialist',
      licenseNumber: 'BMDC-48291',
      specialtyBn: 'কিডনি রোগ (CKD), ফ্যাটি লিভার, ক্যান্সার নিউট্রিশন ও পেডিয়াট্রিক গ্রোথ',
      specialtyEn: 'Renal (CKD), Fatty Liver, Oncology Nutrition & Pediatric Growth',
      institutionBn: 'এভারকেয়ার ক্লিনিক্যাল নিউট্রিশন ইউনিট, ঢাকা',
      institutionEn: 'Evercare Clinical Nutrition Unit, Dhaka',
      experienceYears: 9,
      consultationFeeBdt: 1000,
      availableDaysBn: 'রবি - শুক্রবার (সন্ধ্যা ৬:০০ - রাত ১০:০০)',
      availableDaysEn: 'Sun - Fri (6:00 PM - 10:00 PM)',
      availableSlots: ['06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM'],
      bioBn: 'ক্যান্সার কেমোথেরাপি, সিকেডি এবং জটিল লিভার রোগীদের ক্লিনিক্যাল ডায়েট পরিকল্পনায় বিশেষজ্ঞ।',
      bioEn: 'Specialist in clinical diet planning for oncology, chronic kidney disease, and hepatic recovery.',
      avatarEmoji: '👨‍⚕️',
      rating: 4.8,
      reviewsCount: 112,
      status: 'approved',
      isFeatured: true,
      featuredRequested: true,
      defaultMeetUrl: 'https://meet.google.com/new',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 60).toISOString(),
    },
    {
      id: 'NUTRI-3',
      userId: 'DOC-TASNIMA',
      fullNameBn: 'পুষ্টিবিদ তাসনিমা চৌধুরী (Tasnima Chowdhury)',
      fullNameEn: 'Nutritionist Tasnima Chowdhury, MSc (DU)',
      email: 'tasnima.nutri@gmail.com',
      phone: '01612-887766',
      roleTitleBn: 'মাতৃ ও শিশু পুষ্টি বিশেষজ্ঞ (Maternal & Child Dietitian)',
      roleTitleEn: 'Maternal & Pediatric Clinical Dietitian (INFS, DU)',
      licenseNumber: 'BNDC-3319',
      specialtyBn: 'গর্ভকালীন মাসানুমাসিক ডায়েট, ল্যাকটেশন ও শিশুর ওজন-উচ্চতা বৃদ্ধি',
      specialtyEn: 'Pregnancy Trimester Diet, Lactation & Child Catch-Up Growth',
      institutionBn: 'গ্রীন লাইফ হসপিটাল কনসালটেশন সেন্টার',
      institutionEn: 'Green Life Hospital Consultation Center',
      experienceYears: 6,
      consultationFeeBdt: 600,
      availableDaysBn: 'প্রতিদিন (বিকাল ৪:০০ - রাত ৮:০০)',
      availableDaysEn: 'Daily (4:00 PM - 8:00 PM)',
      availableSlots: ['04:00 PM', '05:30 PM', '07:00 PM'],
      bioBn: 'ঢাকা বিশ্ববিদ্যালয়ের পুষ্টি ও খাদ্য বিজ্ঞান ইনস্টিটিউট থেকে স্নাতকোত্তর; গর্ভবতী মা ও শিশুর পুষ্টিতে বিশেষজ্ঞ।',
      bioEn: 'MSc in Nutrition & Food Science (University of Dhaka); specialized in pregnancy and child nutrition.',
      avatarEmoji: '🩺',
      rating: 4.9,
      reviewsCount: 64,
      status: 'pending',
      isFeatured: false,
      featuredRequested: true,
      defaultMeetUrl: 'https://meet.google.com/new',
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
  ],
  bookings: [
    {
      id: 'BK-2001',
      nutritionistId: 'NUTRI-1',
      nutritionistNameBn: 'ডা. ফারহানা রহমান (Dr. Farhana Rahman)',
      nutritionistNameEn: 'Dr. Farhana Rahman, Clinical Dietitian',
      nutritionistEmail: 'dr.farhana@precision.com',
      patientUserId: 'USR-7912',
      patientName: 'নুসরাত জাহান (Nusrat Jahan)',
      patientEmail: 'nusrat.jahan@gmail.com',
      patientPhone: '01819-339102',
      appointmentDate: todayIsoDate(),
      appointmentSlot: '06:00 PM',
      healthConcern: 'পিসিওএস (PCOS), অনিয়মিত পিরিয়ড এবং ইনসুলিন রেজিস্ট্যান্সের জন্য ডায়েট চার্ট ও পরামর্শ প্রয়োজন।',
      consultationFeeBdt: 800,
      paymentMethod: 'nagad',
      senderNumber: '01819-339102',
      transactionId: 'NGD77K19QA',
      paymentId: 'PAY-1002',
      status: 'pending_admin',
      paymentStatus: 'pending',
      sessionReadiness: 'awaiting_payment',
      clinicalBriefPrepared: true,
      nutritionistReady: false,
      patientReady: false,
      durationMinutes: 45,
      sessionRating: 4.9,
      adminNotes: 'নগদ ট্রানজেকশন যাচাইয়ের অপেক্ষায়।',
      googleMeetLink: 'https://meet.google.com/new',
      createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    },
    {
      id: 'BK-2000',
      nutritionistId: 'NUTRI-2',
      nutritionistNameBn: 'ডা. আরিফুল ইসলাম (Dr. Ariful Islam)',
      nutritionistNameEn: 'Dr. Ariful Islam, Metabolic & Renal Nutritionist',
      nutritionistEmail: 'dr.ariful@precision.com',
      patientUserId: 'USR-3100',
      patientName: 'কামরুল হাসান (Kamrul Hasan)',
      patientEmail: 'kamrul.hasan@gmail.com',
      patientPhone: '01713-556677',
      appointmentDate: todayIsoDate(),
      appointmentSlot: '08:00 PM',
      healthConcern: 'গ্রেড-২ ফ্যাটি লিভার এবং উচ্চ ট্রাইগ্লিসারাইড কমানোর জন্য ফাংশনাল ডায়েট পরামর্শ।',
      consultationFeeBdt: 1000,
      paymentMethod: 'bkash',
      senderNumber: '01713-556677',
      transactionId: 'BKX55P10ZZ',
      paymentId: 'PAY-1000',
      status: 'confirmed_for_nutritionist',
      paymentStatus: 'verified',
      sessionReadiness: 'ready_for_session',
      clinicalBriefPrepared: true,
      nutritionistReady: true,
      patientReady: true,
      durationMinutes: 60,
      sessionRating: 5.0,
      adminNotes: 'পেমেন্ট ভেরিফাইড এবং পুষ্টিবিদ ও রোগীর কাছে মিট লিংক পাঠানো হয়েছে।',
      googleMeetLink: 'https://meet.google.com/lookup/precision-nutri-bk2000',
      createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      approvedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    },
    {
      id: 'BK-2002',
      nutritionistId: 'NUTRI-3',
      nutritionistNameBn: 'পুষ্টিবিদ তাসনিমা চৌধুরী (Tasnima Chowdhury)',
      nutritionistNameEn: 'Nutritionist Tasnima Chowdhury, MSc (DU)',
      nutritionistEmail: 'tasnima.nutri@gmail.com',
      patientUserId: 'USR-8840',
      patientName: 'ফারজানা করিম (Farzana Karim)',
      patientEmail: 'farzana.karim@gmail.com',
      patientPhone: '01618-445566',
      appointmentDate: todayIsoDate(),
      appointmentSlot: '05:30 PM',
      healthConcern: 'গর্ভকালীন ৭ম মাসের মাসানুমাসিক ডায়েট এবং হিমোগ্লোবিন (৯.৮ g/dL) বৃদ্ধির খাদ্য তালিকা।',
      consultationFeeBdt: 600,
      paymentMethod: 'bkash',
      senderNumber: '01618-445566',
      transactionId: 'BKX88M12TR',
      paymentId: 'PAY-1003',
      status: 'confirmed_for_nutritionist',
      paymentStatus: 'verified',
      sessionReadiness: 'in_progress',
      clinicalBriefPrepared: true,
      nutritionistReady: true,
      patientReady: true,
      durationMinutes: 45,
      sessionRating: 4.9,
      adminNotes: 'সেশন চলমান (Live Consultation Room Active)।',
      googleMeetLink: 'https://meet.google.com/lookup/precision-maternal-bk2002',
      createdAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
      approvedAt: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
    },
    {
      id: 'BK-1999',
      nutritionistId: 'NUTRI-1',
      nutritionistNameBn: 'ডা. ফারহানা রহমান (Dr. Farhana Rahman)',
      nutritionistNameEn: 'Dr. Farhana Rahman, Clinical Dietitian',
      nutritionistEmail: 'dr.farhana@precision.com',
      patientUserId: 'USR-5410',
      patientName: 'তানভীর আহমেদ (Tanvir Ahmed)',
      patientEmail: 'tanvir.ahmed@gmail.com',
      patientPhone: '01711-223344',
      appointmentDate: todayIsoDate(),
      appointmentSlot: '06:00 PM',
      healthConcern: 'টাইপ-২ ডায়াবেটিস (HbA1c 7.8%) ও পোস্ট-মিল সুগার স্পাইক নিয়ন্ত্রণে গ্লাইসেমিক ডায়েট রিভিউ।',
      consultationFeeBdt: 800,
      paymentMethod: 'bkash',
      senderNumber: '01711-223344',
      transactionId: 'BKX91D44KL',
      paymentId: 'PAY-0999',
      status: 'completed',
      paymentStatus: 'verified',
      sessionReadiness: 'completed',
      clinicalBriefPrepared: true,
      nutritionistReady: true,
      patientReady: true,
      durationMinutes: 60,
      sessionRating: 5.0,
      adminNotes: 'সেশন সফলভাবে সম্পন্ন এবং ফলো-আপ চার্ট প্রদান করা হয়েছে।',
      googleMeetLink: 'https://meet.google.com/lookup/precision-nutri-bk1999',
      createdAt: new Date(Date.now() - 1000 * 60 * 320).toISOString(),
      approvedAt: new Date(Date.now() - 1000 * 60 * 280).toISOString(),
    },
  ],
  notifications: [],
  approvedPremiumEmails: ['ramkrisna97@gmail.com'],
  cloudflareSyncMeta: {
    lastSyncedAt: new Date().toISOString(),
    d1TablesCount: 8,
    totalRowsSynced: 14,
    workerEndpoint: '/api/cloudflare/sync',
    tierStatus: 'Cloudflare Free Tier (D1 + KV Ready)',
  },
});

type Listener = (state: PlatformHubState) => void;
const listeners = new Set<Listener>();

export const loadPlatformState = (): PlatformHubState => {
  if (typeof window === 'undefined') return getInitialPlatformState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialPlatformState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw) as Partial<PlatformHubState>;
    const fallback = getInitialPlatformState();
    return {
      payments: parsed.payments || fallback.payments,
      stores: parsed.stores || fallback.stores,
      foodSuggestions: parsed.foodSuggestions || fallback.foodSuggestions,
      moderationIncidents: parsed.moderationIncidents || fallback.moderationIncidents,
      bannedUsers: parsed.bannedUsers || fallback.bannedUsers,
      communityPosts: parsed.communityPosts || fallback.communityPosts,
      nutritionists: parsed.nutritionists || fallback.nutritionists,
      bookings: parsed.bookings || fallback.bookings,
      notifications: parsed.notifications || fallback.notifications,
      approvedPremiumEmails: parsed.approvedPremiumEmails || fallback.approvedPremiumEmails,
      cloudflareSyncMeta: parsed.cloudflareSyncMeta || fallback.cloudflareSyncMeta,
    };
  } catch {
    return getInitialPlatformState();
  }
};

const syncToCloudflareAndFirestore = async (state: PlatformHubState) => {
  // 1. Sync with Express Server Cloudflare Free-Tier D1/KV Adapter
  try {
    await fetch('/api/cloudflare/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state }),
    });
  } catch {
    // Non-blocking in offline mode
  }

  // 2. Sync with Firestore if user is signed in with Firebase Auth
  if (auth.currentUser) {
    const path = 'platform_hub/global_state';
    try {
      await setDoc(
        doc(db, 'platform_hub', 'global_state'),
        {
          updatedAt: new Date().toISOString(),
          updatedByEmail: auth.currentUser.email || 'anonymous',
          paymentsCount: state.payments.length,
          storesCount: state.stores.length,
          foodSuggestionsCount: state.foodSuggestions.length,
          bookingsCount: state.bookings.length,
          approvedPremiumEmails: state.approvedPremiumEmails,
          payloadJson: JSON.stringify(state),
        },
        { merge: true }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }
};

export const savePlatformState = (updater: (prev: PlatformHubState) => PlatformHubState): PlatformHubState => {
  const prev = loadPlatformState();
  const next = updater(prev);
  const totalRows =
    next.payments.length +
    next.stores.length +
    next.foodSuggestions.length +
    next.moderationIncidents.length +
    next.bannedUsers.length +
    next.communityPosts.length +
    next.nutritionists.length +
    next.bookings.length;

  const enriched: PlatformHubState = {
    ...next,
    cloudflareSyncMeta: {
      ...next.cloudflareSyncMeta,
      lastSyncedAt: new Date().toISOString(),
      totalRowsSynced: totalRows,
    },
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(enriched));
  }
  listeners.forEach((fn) => fn(enriched));
  void syncToCloudflareAndFirestore(enriched);
  return enriched;
};

export const subscribePlatformState = (listener: Listener): (() => void) => {
  listeners.add(listener);
  listener(loadPlatformState());
  return () => {
    listeners.delete(listener);
  };
};

export const pullFromFirestoreOrServer = async (): Promise<PlatformHubState> => {
  try {
    if (auth.currentUser) {
      const snap = await getDoc(doc(db, 'platform_hub', 'global_state'));
      if (snap.exists() && snap.data()?.payloadJson) {
        const remote = JSON.parse(snap.data().payloadJson) as PlatformHubState;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
        listeners.forEach((fn) => fn(remote));
        return remote;
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'platform_hub/global_state');
  }

  try {
    const res = await fetch('/api/cloudflare/sync');
    if (res.ok) {
      const data = await res.json();
      if (data?.state) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.state));
        listeners.forEach((fn) => fn(data.state));
        return data.state;
      }
    }
  } catch {
    // ignore
  }
  return loadPlatformState();
};

// ============================================================================
// 1. MANUAL PAYMENT & SUBSCRIPTION APPROVAL + EMAIL NOTIFICATION
// ============================================================================

export const submitManualPayment = (params: {
  userId: string;
  userName: string;
  userEmail: string;
  paymentType: 'subscription' | 'consultation';
  planName: string;
  amountBdt: number;
  method: PaymentMethodType;
  senderNumber: string;
  transactionId: string;
  notes?: string;
  relatedBookingId?: string;
}): ManualPaymentSubmission => {
  const newPayment: ManualPaymentSubmission = {
    id: `PAY-${Math.floor(1000 + Math.random() * 9000)}`,
    ...params,
    status: 'pending',
    submittedAt: new Date().toISOString(),
  };

  savePlatformState((prev) => ({
    ...prev,
    payments: [newPayment, ...prev.payments],
  }));

  return newPayment;
};

export const approveManualPaymentByAdmin = async (
  paymentId: string,
  customMeetLink?: string
): Promise<{ payment?: ManualPaymentSubmission; emailSubject: string; emailBody: string }> => {
  let targetPayment: ManualPaymentSubmission | undefined;
  let emailSubject = '';
  let emailBody = '';

  savePlatformState((prev) => {
    const payment = prev.payments.find((p) => p.id === paymentId);
    if (!payment) return prev;

    const isConsultation = payment.paymentType === 'consultation';
    const meetUrl =
      customMeetLink?.trim() ||
      `https://meet.google.com/lookup/precision-${(payment.relatedBookingId || payment.id).toLowerCase()}`;

    emailSubject = isConsultation
      ? `✅ আপনার পুষ্টিবিদ কনসালটেশন বুকিং ও পেমেন্ট অ্যাপ্রুভ হয়েছে (Precision Nutrition)`
      : `👑 অভিনন্দন! আপনার প্রিমিয়াম সাবস্ক্রিপশন অ্যাপ্রুভ হয়েছে — আপনি এখন প্রিমিয়াম সাবস্ক্রাইবার`;

    emailBody = isConsultation
      ? `প্রিয় ${payment.userName},\n\nআপনার ম্যানুয়াল পেমেন্ট (TrxID: ${payment.transactionId}, পরিমাণ: ৳${payment.amountBdt}) অ্যাডমিন প্যানেল থেকে ভেরিফাই ও অ্যাপ্রুভ করা হয়েছে।\n\nআপনার পুষ্টিবিদ অ্যাপয়েন্টমেন্ট এখন কনফার্ম করা হয়েছে এবং পুষ্টিবিদের ড্যাশবোর্ডে যুক্ত হয়েছে।\n📅 প্ল্যান/বুকিং: ${payment.planName}\n🎥 সরাসরি কথা বলার Google Meet লিংক: ${meetUrl}\n\nনির্ধারিত সময়ে এই Google Meet লিংকে ক্লিক করে পুষ্টিবিদের সাথে সরাসরি কথা বলতে পারবেন।\n\nশুভেচ্ছান্তে,\nPrecision Nutrition Admin Panel (ramkrisna97@gmail.com)`
      : `প্রিয় ${payment.userName},\n\nঅভিনন্দন! আপনার ম্যানুয়াল পেমেন্ট (TrxID: ${payment.transactionId}, মাধ্যম: ${payment.method.toUpperCase()}, পরিমাণ: ৳${payment.amountBdt}) অ্যাডমিন প্যানেল কর্তৃক অনুমোদিত (Approved) হয়েছে।\n\n👑 আপনি এখন আনুষ্ঠানিকভাবে একজন প্রিমিয়াম সাবস্ক্রাইবার (Premium Subscriber)!\nএখন থেকে আপনি ডায়েট মেকার, ৪-ফেজ ক্লিনিক্যাল ডায়েট চার্ট, ভয়েস কুকবুক, ফ্যামিলি পট এবং প্রিমিয়াম হেলথ ট্র্যাকার কোনো সীমাবদ্ধতা ছাড়াই ব্যবহার করতে পারবেন।\n\nশুভেচ্ছান্তে,\nPrecision Nutrition Admin Panel (ramkrisna97@gmail.com)`;

    const updatedPayment: ManualPaymentSubmission = {
      ...payment,
      status: 'approved',
      reviewedAt: new Date().toISOString(),
      approvalEmailSent: true,
      approvalEmailSubject: emailSubject,
      approvalEmailBody: emailBody,
    };
    targetPayment = updatedPayment;

    const nextPayments = prev.payments.map((p) => (p.id === paymentId ? updatedPayment : p));
    const nextEmails = payment.userEmail
      ? Array.from(new Set([...prev.approvedPremiumEmails, payment.userEmail.trim().toLowerCase()]))
      : prev.approvedPremiumEmails;

    // Also if this payment is linked to a consultation booking, activate the booking for the nutritionist!
    const nextBookings = prev.bookings.map((bk) => {
      if (bk.paymentId === paymentId || bk.id === payment.relatedBookingId) {
        return {
          ...bk,
          status: 'confirmed_for_nutritionist' as const,
          paymentStatus: 'verified' as const,
          sessionReadiness: 'ready_for_session' as const,
          clinicalBriefPrepared: true,
          nutritionistReady: true,
          patientReady: true,
          googleMeetLink: meetUrl,
          approvedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
      return bk;
    });

    const newNotification: UserNotificationItem = {
      id: `NOTIF-${Date.now()}`,
      targetEmail: payment.userEmail,
      targetUserId: payment.userId,
      titleBn: isConsultation
        ? '🎥 পুষ্টিবিদ বুকিং অ্যাপ্রুভ হয়েছে (Google Meet প্রস্তুত)'
        : '👑 আপনার প্রিমিয়াম সাবস্ক্রিপশন অ্যাপ্রুভ হয়েছে!',
      titleEn: isConsultation
        ? '🎥 Nutritionist Booking Approved (Google Meet Ready)'
        : '👑 Your Premium Subscription is Approved!',
      messageBn: emailBody,
      messageEn: `Dear ${payment.userName}, your payment (TrxID: ${payment.transactionId}) has been approved by Admin. ${
        isConsultation
          ? `Your nutritionist appointment is confirmed. Join via Google Meet: ${meetUrl}`
          : 'You are now an active Premium Subscriber!'
      }`,
      type: isConsultation ? 'booking_confirmed' : 'payment_approved',
      emailSubject,
      emailBody,
      googleMeetLink: isConsultation ? meetUrl : undefined,
      createdAt: new Date().toISOString(),
      read: false,
    };

    return {
      ...prev,
      payments: nextPayments,
      approvedPremiumEmails: nextEmails,
      bookings: nextBookings,
      notifications: [newNotification, ...prev.notifications],
    };
  });

  // Trigger backend email notification record
  if (targetPayment) {
    try {
      await fetch('/api/admin/send-approval-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: targetPayment.userEmail,
          subject: emailSubject,
          body: emailBody,
          paymentId: targetPayment.id,
        }),
      });
    } catch {
      // Non-blocking
    }
  }

  return { payment: targetPayment, emailSubject, emailBody };
};

export const rejectManualPaymentByAdmin = (paymentId: string) => {
  savePlatformState((prev) => ({
    ...prev,
    payments: prev.payments.map((p) =>
      p.id === paymentId ? { ...p, status: 'rejected', reviewedAt: new Date().toISOString() } : p
    ),
    bookings: prev.bookings.map((b) =>
      b.paymentId === paymentId
        ? {
            ...b,
            status: 'rejected',
            paymentStatus: 'rejected',
            sessionReadiness: 'awaiting_payment',
            updatedAt: new Date().toISOString(),
          }
        : b
    ),
  }));
};

// ============================================================================
// 2. MARKETPLACE STORE REGISTRATION & ADMIN APPROVAL
// ============================================================================

export const registerMarketplaceStore = (
  params: Omit<MarketplaceStoreRegistration, 'id' | 'status' | 'submittedAt'>
): MarketplaceStoreRegistration => {
  const store: MarketplaceStoreRegistration = {
    id: `STR-${Math.floor(100 + Math.random() * 900)}`,
    ...params,
    status: 'pending',
    submittedAt: new Date().toISOString(),
  };

  savePlatformState((prev) => ({
    ...prev,
    stores: [store, ...prev.stores],
  }));

  return store;
};

export const reviewMarketplaceStoreByAdmin = (
  storeId: string,
  decision: 'approved' | 'rejected'
) => {
  savePlatformState((prev) => {
    const store = prev.stores.find((s) => s.id === storeId);
    const nextStores = prev.stores.map((s) =>
      s.id === storeId ? { ...s, status: decision, reviewedAt: new Date().toISOString() } : s
    );

    const nextNotifications = [...prev.notifications];
    if (store && decision === 'approved') {
      nextNotifications.unshift({
        id: `NOTIF-${Date.now()}`,
        targetEmail: store.ownerEmail,
        targetUserId: store.ownerUserId,
        titleBn: `🏪 আপনার মার্কেটপ্লেস স্টোর "${store.storeName}" অ্যাপ্রুভ হয়েছে!`,
        titleEn: `🏪 Your Marketplace Store "${store.storeName}" is Approved!`,
        messageBn: `অভিনন্দন ${store.ownerName}! অ্যাডমিন প্যানেল আপনার "${store.storeName}" দোকানটি অনুমোদন করেছে। এখন আপনি পণ্য যুক্ত ও বিক্রি করতে পারবেন।`,
        messageEn: `Congratulations ${store.ownerName}! Admin has approved your store "${store.storeName}". You can now list and sell products.`,
        type: 'store_approved',
        createdAt: new Date().toISOString(),
      });
    }

    return {
      ...prev,
      stores: nextStores,
      notifications: nextNotifications,
    };
  });
};

// ============================================================================
// 3. FOOD SUGGESTION BOX & ADMIN APPROVAL
// ============================================================================

export const submitFoodSuggestion = (
  params: Omit<FoodSuggestionSubmission, 'id' | 'status' | 'submittedAt'>
): FoodSuggestionSubmission => {
  const item: FoodSuggestionSubmission = {
    id: `FSUG-${Math.floor(1000 + Math.random() * 9000)}`,
    ...params,
    status: 'pending',
    submittedAt: new Date().toISOString(),
  };

  savePlatformState((prev) => ({
    ...prev,
    foodSuggestions: [item, ...prev.foodSuggestions],
  }));

  return item;
};

export const reviewFoodSuggestionByAdmin = (
  suggestionId: string,
  decision: 'approved' | 'rejected',
  overrideZone?: TrafficLightZone
) => {
  savePlatformState((prev) => ({
    ...prev,
    foodSuggestions: prev.foodSuggestions.map((f) =>
      f.id === suggestionId
        ? {
            ...f,
            status: decision,
            suggestedZone: overrideZone || f.suggestedZone,
            reviewedAt: new Date().toISOString(),
          }
        : f
    ),
  }));
};

// ============================================================================
// 4. COMMUNITY HUB AI AUTO-MODERATION, USER REPORTING & ADMIN BAN
// ============================================================================

const HARMFUL_OR_OFFENSIVE_PATTERNS = [
  /পাগল/i,
  /ফালতু/i,
  /ভুয়া/i,
  /চোর/i,
  /বাটপার/i,
  /প্রতারক/i,
  /বেয়াদব/i,
  /মূর্খ/i,
  /গাধা/i,
  /ছাগল/i,
  /idiot/i,
  /stupid/i,
  /scam/i,
  /fraud/i,
  /fake/i,
  /loser/i,
  /shut up/i,
  /useless/i,
  /hate you/i,
  /garbage/i,
  /nonsense/i,
  /বাজে কথা/i,
  /আজেবাজে/i,
];

const OFF_TOPIC_SPAM_PATTERNS = [
  /crypto/i,
  /bitcoin/i,
  /betting/i,
  /casino/i,
  /1xbet/i,
  /baji/i,
  /জুয়া/i,
  /লটারি/i,
  /ক্রিপ্টো/i,
  /টাকা আয় করুন/i,
  /earn money fast/i,
  /forex/i,
  /রাজনীতি/i,
  /নির্বাচন/i,
  /ভোট দিন/i,
  /movie download/i,
];

export const evaluateCommunityContentWithAI = async (
  content: string,
  authorName: string,
  targetType: 'post' | 'comment',
  authorId?: string,
  authorEmail?: string
): Promise<{
  allowed: boolean;
  reasonBn?: string;
  reasonEn?: string;
}> => {
  const trimmed = content.trim();
  if (!trimmed) {
    return { allowed: false, reasonBn: 'খালি পোস্ট বা কমেন্ট গ্রহণযোগ্য নয়।', reasonEn: 'Empty content.' };
  }

  // 1. Check if user is banned
  const state = loadPlatformState();
  const isBanned = state.bannedUsers.some(
    (b) =>
      (authorId && b.userId === authorId) ||
      (authorEmail && b.userEmail?.toLowerCase() === authorEmail.toLowerCase()) ||
      b.userName.toLowerCase() === authorName.toLowerCase()
  );

  if (isBanned) {
    return {
      allowed: false,
      reasonBn: 'কমিউনিটি নীতিমালা লঙ্ঘনের কারণে অ্যাডমিন আপনার অ্যাকাউন্টটি ব্যান করেছেন।',
      reasonEn: 'Your account has been banned by Admin for violating community guidelines.',
    };
  }

  // 2. Deterministic instant check for offensive/harassing or spam/off-topic patterns
  for (const pat of HARMFUL_OR_OFFENSIVE_PATTERNS) {
    if (pat.test(trimmed)) {
      const reason =
        'AI Auto-Moderation: আক্রমণাত্মক, অপমানজনক বা নেতিবাচক ভাষা শনাক্ত হওয়ায় অটোমেটিক ডিলিট করা হয়েছে।';
      logAutoDeletedContent(targetType, authorName, trimmed, reason, authorId, authorEmail);
      return {
        allowed: false,
        reasonBn: reason,
        reasonEn:
          'AI Auto-Moderation: Automatically deleted due to disrespectful, offensive, or harmful language.',
      };
    }
  }

  for (const pat of OFF_TOPIC_SPAM_PATTERNS) {
    if (pat.test(trimmed)) {
      const reason =
        'AI Auto-Moderation: পুষ্টি ও স্বাস্থ্য বহির্ভূত (Off-topic / Spam) বিষয়বস্তু হওয়ায় অটোমেটিক ডিলিট করা হয়েছে।';
      logAutoDeletedContent(targetType, authorName, trimmed, reason, authorId, authorEmail);
      return {
        allowed: false,
        reasonBn: reason,
        reasonEn:
          'AI Auto-Moderation: Automatically deleted because it is unrelated to nutrition, diet, or health.',
      };
    }
  }

  // 3. Call server-side Gemini AI Moderator (`/api/community/moderate`)
  try {
    const res = await fetch('/api/community/moderate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: trimmed, targetType }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.allowed === false) {
        const reason =
          data.reasonBn ||
          'AI Auto-Moderation: পুষ্টি ও স্বাস্থ্য বহির্ভূত বা অনুপযুক্ত বিষয়বস্তু হওয়ায় অটোমেটিক ডিলিট করা হয়েছে।';
        logAutoDeletedContent(targetType, authorName, trimmed, reason, authorId, authorEmail);
        return {
          allowed: false,
          reasonBn: reason,
          reasonEn:
            data.reasonEn ||
            'AI Auto-Moderation: Content removed for violating clinical community standards.',
        };
      }
    }
  } catch {
    // Fallback passed
  }

  return { allowed: true };
};

const logAutoDeletedContent = (
  targetType: 'post' | 'comment',
  offenderName: string,
  contentSnippet: string,
  reason: string,
  offenderUserId?: string,
  offenderEmail?: string
) => {
  const incident: CommunityModerationIncident = {
    id: `MOD-${Math.floor(1000 + Math.random() * 9000)}`,
    type: 'ai_auto_deleted',
    targetType,
    postId: `AUTO-${Date.now()}`,
    offenderName,
    offenderUserId,
    offenderEmail,
    contentSnippet,
    reason,
    status: 'auto_removed',
    createdAt: new Date().toISOString(),
  };

  savePlatformState((prev) => ({
    ...prev,
    moderationIncidents: [incident, ...prev.moderationIncidents],
  }));
};

export const reportCommunityContent = (params: {
  targetType: 'post' | 'comment';
  postId: string;
  commentId?: string;
  offenderName: string;
  offenderUserId?: string;
  offenderEmail?: string;
  contentSnippet: string;
  reason: string;
  reportedByName: string;
}): CommunityModerationIncident => {
  const incident: CommunityModerationIncident = {
    id: `REP-${Math.floor(1000 + Math.random() * 9000)}`,
    type: 'user_reported',
    ...params,
    status: 'pending_review',
    createdAt: new Date().toISOString(),
  };

  savePlatformState((prev) => ({
    ...prev,
    moderationIncidents: [incident, ...prev.moderationIncidents],
  }));

  return incident;
};

export const adminDeleteContentAndBanUser = (incidentId: string, alsoBanUser: boolean) => {
  savePlatformState((prev) => {
    const incident = prev.moderationIncidents.find((i) => i.id === incidentId);
    if (!incident) return prev;

    // Remove post or comment from communityPosts
    const nextPosts = prev.communityPosts
      .filter((p) => !(incident.targetType === 'post' && p.id === incident.postId))
      .map((p) => {
        if (incident.targetType === 'comment' && p.id === incident.postId) {
          return {
            ...p,
            comments: p.comments.filter((c) => c.id !== incident.commentId),
          };
        }
        return p;
      });

    const nextBanned = [...prev.bannedUsers];
    if (
      alsoBanUser &&
      !nextBanned.some((b) => b.userName.toLowerCase() === incident.offenderName.toLowerCase())
    ) {
      nextBanned.unshift({
        id: `BAN-${Date.now()}`,
        userId: incident.offenderUserId,
        userName: incident.offenderName,
        userEmail: incident.offenderEmail,
        reason: incident.reason,
        bannedAt: new Date().toISOString(),
      });
    }

    const nextIncidents = prev.moderationIncidents.map((i) =>
      i.id === incidentId ? { ...i, status: 'deleted_and_banned' as const } : i
    );

    return {
      ...prev,
      communityPosts: nextPosts,
      bannedUsers: nextBanned,
      moderationIncidents: nextIncidents,
    };
  });
};

export const adminUnbanUser = (banId: string) => {
  savePlatformState((prev) => ({
    ...prev,
    bannedUsers: prev.bannedUsers.filter((b) => b.id !== banId),
  }));
};

// ============================================================================
// 5. NUTRITIONIST / DIETITIAN HUB, FEATURED APPROVAL & BOOKING WITH GOOGLE MEET
// ============================================================================

export const registerNutritionistListing = (
  params: Omit<NutritionistProfileListing, 'id' | 'rating' | 'reviewsCount' | 'status' | 'isFeatured' | 'createdAt'>
): NutritionistProfileListing => {
  const listing: NutritionistProfileListing = {
    id: `NUTRI-${Math.floor(100 + Math.random() * 900)}`,
    ...params,
    rating: 5.0,
    reviewsCount: 1,
    status: 'pending',
    isFeatured: false,
    createdAt: new Date().toISOString(),
  };

  savePlatformState((prev) => ({
    ...prev,
    nutritionists: [listing, ...prev.nutritionists],
  }));

  return listing;
};

export const adminUpdateNutritionistStatus = (
  nutritionistId: string,
  status: 'approved' | 'rejected',
  isFeatured: boolean
) => {
  savePlatformState((prev) => ({
    ...prev,
    nutritionists: prev.nutritionists.map((n) =>
      n.id === nutritionistId ? { ...n, status, isFeatured } : n
    ),
  }));
};

export const adminUpdateNutritionistDetails = (
  nutritionistId: string,
  updates: Partial<
    Pick<
      NutritionistProfileListing,
      | 'fullNameBn'
      | 'fullNameEn'
      | 'roleTitleBn'
      | 'roleTitleEn'
      | 'specialtyBn'
      | 'specialtyEn'
      | 'institutionBn'
      | 'institutionEn'
      | 'experienceYears'
      | 'consultationFeeBdt'
      | 'availableDaysBn'
      | 'availableDaysEn'
      | 'availableSlots'
      | 'bioBn'
      | 'bioEn'
      | 'defaultMeetUrl'
      | 'phone'
      | 'email'
      | 'licenseNumber'
    >
  >
) => {
  savePlatformState((prev) => {
    const nextNutritionists = prev.nutritionists.map((n) =>
      n.id === nutritionistId ? { ...n, ...updates } : n
    );
    const updatedNutri = nextNutritionists.find((n) => n.id === nutritionistId);

    // Keep linked booking names in sync if nutritionist name changed
    const nextBookings = updatedNutri
      ? prev.bookings.map((b) =>
          b.nutritionistId === nutritionistId
            ? {
                ...b,
                nutritionistNameBn: updatedNutri.fullNameBn,
                nutritionistNameEn: updatedNutri.fullNameEn,
                nutritionistEmail: updatedNutri.email,
              }
            : b
        )
      : prev.bookings;

    return {
      ...prev,
      nutritionists: nextNutritionists,
      bookings: nextBookings,
    };
  });
};

export const adminUpdatePaymentSubmission = (
  paymentId: string,
  updates: Partial<
    Pick<
      ManualPaymentSubmission,
      'amountBdt' | 'planName' | 'userName' | 'userEmail' | 'senderNumber' | 'transactionId' | 'notes'
    >
  >
) => {
  savePlatformState((prev) => {
    const targetPay = prev.payments.find((p) => p.id === paymentId);
    if (!targetPay) return prev;

    const nextPayments = prev.payments.map((p) =>
      p.id === paymentId ? { ...p, ...updates } : p
    );

    const nextBookings =
      updates.amountBdt !== undefined && targetPay.relatedBookingId
        ? prev.bookings.map((b) =>
            b.id === targetPay.relatedBookingId
              ? { ...b, consultationFeeBdt: updates.amountBdt! }
              : b
          )
        : prev.bookings;

    return {
      ...prev,
      payments: nextPayments,
      bookings: nextBookings,
    };
  });
};

export const submitNutritionistBookingWithPayment = (params: {
  nutritionist: NutritionistProfileListing;
  patientUserId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  appointmentDate: string;
  appointmentSlot: string;
  healthConcern: string;
  paymentMethod: PaymentMethodType;
  senderNumber: string;
  transactionId: string;
}): { booking: NutritionistBooking; payment: ManualPaymentSubmission } => {
  const bookingId = `BK-${Math.floor(1000 + Math.random() * 9000)}`;
  const paymentId = `PAY-${Math.floor(1000 + Math.random() * 9000)}`;

  const payment: ManualPaymentSubmission = {
    id: paymentId,
    userId: params.patientUserId,
    userName: params.patientName,
    userEmail: params.patientEmail,
    paymentType: 'consultation',
    planName: `পুষ্টিবিদ অ্যাপয়েন্টমেন্ট (${params.nutritionist.fullNameBn} • ${params.appointmentDate} ${params.appointmentSlot})`,
    amountBdt: params.nutritionist.consultationFeeBdt,
    method: params.paymentMethod,
    senderNumber: params.senderNumber,
    transactionId: params.transactionId,
    notes: params.healthConcern,
    status: 'pending',
    submittedAt: new Date().toISOString(),
    relatedBookingId: bookingId,
  };

  const booking: NutritionistBooking = {
    id: bookingId,
    nutritionistId: params.nutritionist.id,
    nutritionistNameBn: params.nutritionist.fullNameBn,
    nutritionistNameEn: params.nutritionist.fullNameEn,
    nutritionistEmail: params.nutritionist.email,
    patientUserId: params.patientUserId,
    patientName: params.patientName,
    patientEmail: params.patientEmail,
    patientPhone: params.patientPhone,
    appointmentDate: params.appointmentDate,
    appointmentSlot: params.appointmentSlot,
    healthConcern: params.healthConcern,
    consultationFeeBdt: params.nutritionist.consultationFeeBdt,
    paymentMethod: params.paymentMethod,
    senderNumber: params.senderNumber,
    transactionId: params.transactionId,
    paymentId,
    // Strictly pending_admin first — invisible as active appointment on Nutritionist profile until Admin approves payment
    status: 'pending_admin',
    paymentStatus: 'pending',
    sessionReadiness: 'awaiting_payment',
    clinicalBriefPrepared: true,
    nutritionistReady: false,
    patientReady: false,
    durationMinutes: 45,
    sessionRating: params.nutritionist.rating || 4.9,
    googleMeetLink: params.nutritionist.defaultMeetUrl || 'https://meet.google.com/new',
    createdAt: new Date().toISOString(),
  };

  savePlatformState((prev) => ({
    ...prev,
    payments: [payment, ...prev.payments],
    bookings: [booking, ...prev.bookings],
  }));

  return { booking, payment };
};

export const adminUpdateBookingManagement = (
  bookingId: string,
  updates: {
    status?: NutritionistBooking['status'];
    paymentStatus?: 'pending' | 'verified' | 'rejected';
    sessionReadiness?: SessionReadinessStatus;
    googleMeetLink?: string;
    appointmentDate?: string;
    appointmentSlot?: string;
    nutritionistId?: string;
    nutritionistNameBn?: string;
    nutritionistNameEn?: string;
    nutritionistEmail?: string;
    patientName?: string;
    patientEmail?: string;
    patientPhone?: string;
    healthConcern?: string;
    consultationFeeBdt?: number;
    senderNumber?: string;
    transactionId?: string;
    nutritionistReady?: boolean;
    patientReady?: boolean;
    clinicalBriefPrepared?: boolean;
    durationMinutes?: number;
    sessionRating?: number;
    adminNotes?: string;
  }
) => {
  savePlatformState((prev) => {
    const targetBooking = prev.bookings.find((b) => b.id === bookingId);
    if (!targetBooking) return prev;

    const nowIso = new Date().toISOString();

    // Determine synchronized booking status & readiness
    let nextStatus = updates.status ?? targetBooking.status;
    let nextPaymentStatus =
      updates.paymentStatus ??
      targetBooking.paymentStatus ??
      (targetBooking.status === 'confirmed_for_nutritionist' || targetBooking.status === 'completed'
        ? 'verified'
        : targetBooking.status === 'rejected'
        ? 'rejected'
        : 'pending');
    let nextReadiness = updates.sessionReadiness ?? targetBooking.sessionReadiness ?? 'awaiting_payment';

    if (updates.paymentStatus === 'verified' && nextStatus === 'pending_admin') {
      nextStatus = 'confirmed_for_nutritionist';
      if (nextReadiness === 'awaiting_payment') {
        nextReadiness = 'ready_for_session';
      }
    } else if (updates.paymentStatus === 'rejected') {
      nextStatus = 'rejected';
      nextReadiness = 'awaiting_payment';
    }

    if (updates.sessionReadiness === 'completed') {
      nextStatus = 'completed';
    } else if (
      (updates.sessionReadiness === 'ready_for_session' || updates.sessionReadiness === 'in_progress') &&
      nextStatus === 'pending_admin'
    ) {
      nextStatus = 'confirmed_for_nutritionist';
      nextPaymentStatus = 'verified';
    }

    // If nutritionistId was updated, sync nutritionist names and email automatically
    let resolvedNutriFields: Partial<NutritionistBooking> = {};
    if (updates.nutritionistId && updates.nutritionistId !== targetBooking.nutritionistId) {
      const matchedNutri = prev.nutritionists.find((n) => n.id === updates.nutritionistId);
      if (matchedNutri) {
        resolvedNutriFields = {
          nutritionistId: matchedNutri.id,
          nutritionistNameBn: matchedNutri.fullNameBn,
          nutritionistNameEn: matchedNutri.fullNameEn,
          nutritionistEmail: matchedNutri.email,
        };
      }
    }

    const updatedBooking: NutritionistBooking = {
      ...targetBooking,
      ...updates,
      ...resolvedNutriFields,
      status: nextStatus,
      paymentStatus: nextPaymentStatus,
      sessionReadiness: nextReadiness,
      approvedAt:
        nextPaymentStatus === 'verified' && !targetBooking.approvedAt
          ? nowIso
          : targetBooking.approvedAt,
      updatedAt: nowIso,
    };

    const nextBookings = prev.bookings.map((b) => (b.id === bookingId ? updatedBooking : b));

    // Synchronize linked ManualPaymentSubmission status and pricing/details if changed
    const nextPayments = prev.payments.map((p) => {
      if (p.id === targetBooking.paymentId || p.relatedBookingId === bookingId) {
        const mappedPaymentStatus =
          nextPaymentStatus === 'verified'
            ? 'approved'
            : nextPaymentStatus === 'rejected'
            ? 'rejected'
            : 'pending';
        return {
          ...p,
          userName: updatedBooking.patientName || p.userName,
          userEmail: updatedBooking.patientEmail || p.userEmail,
          amountBdt:
            updates.consultationFeeBdt !== undefined ? updates.consultationFeeBdt : p.amountBdt,
          senderNumber: updates.senderNumber !== undefined ? updates.senderNumber : p.senderNumber,
          transactionId:
            updates.transactionId !== undefined ? updates.transactionId : p.transactionId,
          planName: `পুষ্টিবিদ অ্যাপয়েন্টমেন্ট (${updatedBooking.nutritionistNameBn} • ${updatedBooking.appointmentDate} ${updatedBooking.appointmentSlot})`,
          status: mappedPaymentStatus as ManualPaymentSubmission['status'],
          reviewedAt: nowIso,
        };
      }
      return p;
    });

    return {
      ...prev,
      bookings: nextBookings,
      payments: nextPayments,
    };
  });
};

export const adminDispatchBookingReadinessAlert = (bookingId: string) => {
  savePlatformState((prev) => {
    const bk = prev.bookings.find((b) => b.id === bookingId);
    if (!bk) return prev;

    const nowIso = new Date().toISOString();
    const meetUrl = bk.googleMeetLink || 'https://meet.google.com/new';

    const nextBookings = prev.bookings.map((b) =>
      b.id === bookingId
        ? {
            ...b,
            status: b.status === 'pending_admin' ? ('confirmed_for_nutritionist' as const) : b.status,
            paymentStatus: 'verified' as const,
            sessionReadiness:
              b.sessionReadiness === 'in_progress' || b.sessionReadiness === 'completed'
                ? b.sessionReadiness
                : ('ready_for_session' as const),
            nutritionistReady: true,
            patientReady: true,
            clinicalBriefPrepared: true,
            updatedAt: nowIso,
          }
        : b
    );

    const newNotification: UserNotificationItem = {
      id: `NOTIF-RDY-${Date.now()}`,
      targetEmail: bk.patientEmail,
      targetUserId: bk.patientUserId,
      titleBn: `🩺 কনসালটেশন সেশন প্রস্তুত (${bk.nutritionistNameBn})`,
      titleEn: `🩺 Consultation Session Ready (${bk.nutritionistNameEn})`,
      messageBn: `প্রিয় ${bk.patientName}, আপনার ${bk.appointmentDate} (${bk.appointmentSlot}) এর কনসালটেশন সেশন সম্পূর্ণ প্রস্তুত। Google Meet লিংক: ${meetUrl}`,
      messageEn: `Dear ${bk.patientName}, your consultation session on ${bk.appointmentDate} (${bk.appointmentSlot}) with ${bk.nutritionistNameEn} is ready. Google Meet Link: ${meetUrl}`,
      type: 'booking_confirmed',
      googleMeetLink: meetUrl,
      createdAt: nowIso,
      read: false,
    };

    return {
      ...prev,
      bookings: nextBookings,
      notifications: [newNotification, ...prev.notifications],
    };
  });
};

// ============================================================================
// 6. CLOUDFLARE FREE-TIER D1 SQL SCHEMA & WORKER TEMPLATE GENERATOR
// ============================================================================

export const getCloudflareD1SqlSchema = (): string => `-- Cloudflare D1 (SQLite Serverless) Free-Tier Schema for Precision Nutrition BD
-- 5 GB Storage & 5 Million Reads/Day Free on Cloudflare Workers & D1 (No Custom Domain Required)

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  firebase_uid TEXT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'self',
  is_pro INTEGER DEFAULT 0,
  is_admin INTEGER DEFAULT 0,
  profile_json TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS manual_payments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  payment_type TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  amount_bdt INTEGER NOT NULL,
  method TEXT NOT NULL,
  sender_number TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  related_booking_id TEXT,
  submitted_at TEXT NOT NULL,
  reviewed_at TEXT
);

CREATE TABLE IF NOT EXISTS marketplace_stores (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  owner_phone TEXT NOT NULL,
  store_name TEXT NOT NULL,
  license_number TEXT NOT NULL,
  location TEXT NOT NULL,
  category_focus TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  submitted_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS food_suggestions (
  id TEXT PRIMARY KEY,
  submitted_by_name TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  name_en TEXT NOT NULL,
  category TEXT NOT NULL,
  calories_per_100g REAL DEFAULT 100,
  suggested_zone TEXT DEFAULT 'green',
  health_benefits_bn TEXT,
  status TEXT DEFAULT 'pending',
  submitted_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS nutritionists (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  full_name_bn TEXT NOT NULL,
  full_name_en TEXT NOT NULL,
  email TEXT NOT NULL,
  license_number TEXT NOT NULL,
  specialty_bn TEXT NOT NULL,
  consultation_fee_bdt INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  is_featured INTEGER DEFAULT 0,
  google_meet_url TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS nutritionist_bookings (
  id TEXT PRIMARY KEY,
  nutritionist_id TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  patient_email TEXT NOT NULL,
  appointment_date TEXT NOT NULL,
  appointment_slot TEXT NOT NULL,
  payment_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending_admin',
  google_meet_link TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS community_moderation (
  id TEXT PRIMARY KEY,
  incident_type TEXT NOT NULL,
  offender_name TEXT NOT NULL,
  content_snippet TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);
`;

export const getCloudflareWorkerScript = (): string => `// Cloudflare Worker Free-Tier API Adapter (workers.dev subdomain — No paid domain needed)
export interface Env {
  DB: D1Database; // Bound to Cloudflare D1 Free Tier
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    if (url.pathname === "/api/cloudflare/sync" && request.method === "POST") {
      const body = await request.json() as any;
      // Persist snapshot in D1 KV table for zero-cost free tier sync across devices
      await env.DB.prepare(
        "CREATE TABLE IF NOT EXISTS kv_snapshots (key TEXT PRIMARY KEY, payload TEXT, updated_at TEXT)"
      ).run();
      await env.DB.prepare(
        "INSERT OR REPLACE INTO kv_snapshots (key, payload, updated_at) VALUES ('global_state', ?, ?)"
      ).bind(JSON.stringify(body.state), new Date().toISOString()).run();

      return Response.json({ ok: true, tier: "Cloudflare D1 Free Tier" }, { headers: corsHeaders });
    }

    return Response.json({ status: "Precision Nutrition Cloudflare D1 Worker Active" }, { headers: corsHeaders });
  }
};
`;
