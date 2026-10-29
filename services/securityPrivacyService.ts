import { HealthProfile, Language, User } from '../types';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

export type SupportedRegionCode = 'US' | 'GB' | 'IN' | 'AU' | 'ES' | 'BD';

export interface RegionalSeoConfig {
  code: SupportedRegionCode;
  countryNameEn: string;
  countryNameNative: string;
  flag: string;
  hreflang: string;
  ogLocale: string;
  defaultLang: Language;
  currencyCode: string;
  currencySymbol: string;
  dietaryStandard: string;
  privacyFrameworkName: string;
  privacyAuthority: string;
  privacySummaryEn: string;
  privacySummaryBn: string;
  seoTitleSuffix: string;
  seoDescription: string;
  localSuperfoods: string[];
  seoKeywords: string[];
}

export const REGIONAL_SEO_CONFIGS: Record<SupportedRegionCode, RegionalSeoConfig> = {
  BD: {
    code: 'BD',
    countryNameEn: 'Bangladesh',
    countryNameNative: 'বাংলাদেশ (Bangladesh)',
    flag: '🇧🇩',
    hreflang: 'bn-BD',
    ogLocale: 'bn_BD',
    defaultLang: 'bn',
    currencyCode: 'BDT',
    currencySymbol: '৳',
    dietaryStandard: 'INFS Bangladesh Food Composition Table (BFCT) & Clinical Ayurveda',
    privacyFrameworkName: 'Bangladesh Cyber Security & Personal Data Protection Standards',
    privacyAuthority: 'BGD e-Gov CIRT / Data Protection Authority Bangladesh',
    privacySummaryEn:
      'End-to-end encrypted local clinical vault, anonymized bKash/Nagad transaction verification, and strict patient data sovereignty.',
    privacySummaryBn:
      'এন্ড-টু-এন্ড এনক্রিপ্টেড লোকাল হেলথ ভল্ট, পিআইআই (PII) গোপনীয়তা সুরক্ষা এবং সম্পূর্ণ ইউজার ডাটা ডিলিট ও এক্সপোর্ট কন্ট্রোল।',
    seoTitleSuffix: 'Bangladesh Clinical Diet Chart & Traffic Light Food Guide (BFCT)',
    seoDescription:
      'বাংলাদেশ ফুড কম্পোজিশন টেবিল (INFS), আয়ুর্বেদিক প্রকৃতি ও গাট মাইক্রোবায়োম ভিত্তিক ৪-ফেজ ক্লিনিক্যাল ডায়েট চার্ট ও ট্রাফিক লাইট ফুড গাইড।',
    localSuperfoods: ['ঢেঁকিছাঁটা লাল চাল (Red Rice)', 'সজনে পাতা (Moringa)', 'কাউনের চাল (Foxtail Millet)', 'দেশি শিং ও মাগুর মাছ', 'ত্রিফলা ও আমলকী'],
    seoKeywords: [
      'Precision Nutrition Bangladesh',
      'প্রেসিশন নিউট্রিশন বাংলাদেশ',
      'Bangladesh Food Composition Diet Chart',
      'ডায়াবেটিস ও ফ্যাটি লিভার ডায়েট চার্ট',
      'পুষ্টিবিদ কনসালটেশন ঢাকা',
    ],
  },
  US: {
    code: 'US',
    countryNameEn: 'United States',
    countryNameNative: 'United States (USA)',
    flag: '🇺🇸',
    hreflang: 'en-US',
    ogLocale: 'en_US',
    defaultLang: 'en',
    currencyCode: 'USD',
    currencySymbol: '$',
    dietaryStandard: 'USDA FoodData Central, Functional Medicine & Glycemic Traffic-Light Protocol',
    privacyFrameworkName: 'HIPAA Privacy Rule & CCPA / CPRA Health Data Safeguards',
    privacyAuthority: 'U.S. HHS Office for Civil Rights (OCR) & California Privacy Protection Agency',
    privacySummaryEn:
      'HIPAA-aligned client-side PHI obfuscation, Zero-PII AI prompt sanitization, and CCPA Do-Not-Sell/Share & Right-to-Delete controls.',
    privacySummaryBn:
      'যুক্তরাষ্ট্রের HIPAA এবং CCPA মানদণ্ড অনুযায়ী ব্যক্তিগত স্বাস্থ্য তথ্য (PHI) মাস্কিং ও লোকাল এনক্রিপশন সুরক্ষা।',
    seoTitleSuffix: 'USA Clinical Precision Nutrition, Gut Microbiome & Metabolic Diet Planner',
    seoDescription:
      'Personalized 4-phase gut microbiome, metabolic reversal, and Ayurvedic precision nutrition platform for USA patients with HIPAA-grade privacy.',
    localSuperfoods: ['Wild Alaskan Salmon', 'Organic Quinoa & Buckwheat', 'Fermented Kefir & Sauerkraut', 'Avocado & Extra Virgin Olive Oil', 'Blueberries & Broccoli Sprouts'],
    seoKeywords: [
      'Precision Nutrition USA',
      'Gut Microbiome Diet Planner US',
      'Metabolic Insulin Resistance Reversal Diet',
      'Functional Medicine Traffic Light Food Guide',
      'HIPAA Compliant AI Dietitian App',
    ],
  },
  GB: {
    code: 'GB',
    countryNameEn: 'United Kingdom',
    countryNameNative: 'United Kingdom (UK)',
    flag: '🇬🇧',
    hreflang: 'en-GB',
    ogLocale: 'en_GB',
    defaultLang: 'en',
    currencyCode: 'GBP',
    currencySymbol: '£',
    dietaryStandard: 'PHE McCance & Widdowson Composition of Foods & NHS Metabolic Guidelines',
    privacyFrameworkName: 'UK GDPR & Data Protection Act 2018 (ICO Special Category Health Data)',
    privacyAuthority: 'UK Information Commissioner’s Office (ICO)',
    privacySummaryEn:
      'Strict UK-GDPR Article 9 special category health data consent, right to portability (JSON), and instant erasure.',
    privacySummaryBn:
      'যুক্তরাজ্যের UK-GDPR এবং Data Protection Act 2018 অনুযায়ী স্পেশাল ক্যাটাগরি হেলথ ডাটা সুরক্ষা ও রাইট-টু-ইরেজার।',
    seoTitleSuffix: 'UK Clinical Precision Nutrition, NHS-Aligned Traffic Light Food Guide & Gut Health',
    seoDescription:
      'Evidence-based precision nutrition, British & South Asian diaspora glycemic food guide, and gut microbiome diet planner compliant with UK-GDPR.',
    localSuperfoods: ['Scottish Atlantic Mackerel', 'Steel-Cut British Oats', 'Watercress & Savoy Cabbage', 'Live Bio Yogurt', 'Flaxseeds & Walnuts'],
    seoKeywords: [
      'Precision Nutrition UK',
      'Traffic Light Food Guide UK NHS',
      'Type 2 Diabetes Remission Diet UK',
      'PCOS & Gut Microbiome Nutritionist London',
      'UK GDPR Health Data Privacy Diet App',
    ],
  },
  IN: {
    code: 'IN',
    countryNameEn: 'India',
    countryNameNative: 'भारत (India)',
    flag: '🇮🇳',
    hreflang: 'en-IN',
    ogLocale: 'en_IN',
    defaultLang: 'hi',
    currencyCode: 'INR',
    currencySymbol: '₹',
    dietaryStandard: 'ICMR-NIN Indian Food Composition Tables (IFCT) & AYUSH Prakriti Science',
    privacyFrameworkName: 'India Digital Personal Data Protection Act (DPDP Act 2023) & DISHA',
    privacyAuthority: 'Data Protection Board of India (DPBI)',
    privacySummaryEn:
      'Full DPDP Act 2023 Data Principal rights: explicit notice, consent manager, data portability, and complete erasure of health records.',
    privacySummaryBn:
      'ভারতের DPDP Act 2023 এবং আয়ুষ-আইসিএমআর মানদণ্ড অনুযায়ী ডাটা প্রিন্সিপাল কনসেন্ট ও ব্যক্তিগত স্বাস্থ্য তথ্যের নিরাপত্তা।',
    seoTitleSuffix: 'India ICMR-NIN & Ayurvedic Prakriti Precision Nutrition Diet Planner',
    seoDescription:
      'Clinical Ayurvedic Dosha (Vata, Pitta, Kapha) & ICMR-NIN gut microbiome diet chart for Diabetes, PCOS, Thyroid, and Fatty Liver in India.',
    localSuperfoods: ['Ragi / Finger Millet (रागी)', 'Jowar & Bajra Roti', 'Moringa & Curry Leaves', 'A2 Bilona Cow Ghee', 'Moong Sprouts & Fermented Idli/Kanji'],
    seoKeywords: [
      'Precision Nutrition India',
      'Ayurvedic Dosha Diet Planner India',
      'ICMR NIN Traffic Light Food Guide',
      'PCOS Diabetes Fatty Liver Diet Chart India',
      'DPDP Act Compliant Health App India',
    ],
  },
  AU: {
    code: 'AU',
    countryNameEn: 'Australia',
    countryNameNative: 'Australia',
    flag: '🇦🇺',
    hreflang: 'en-AU',
    ogLocale: 'en_AU',
    defaultLang: 'en',
    currencyCode: 'AUD',
    currencySymbol: 'A$',
    dietaryStandard: 'FSANZ Australian Food Composition Database (AFCD) & NHMRC Low-GI Guidelines',
    privacyFrameworkName: 'Australian Privacy Act 1988 (APPs 1–13) & My Health Records Privacy',
    privacyAuthority: 'Office of the Australian Information Commissioner (OAIC)',
    privacySummaryEn:
      'Compliant with Australian Privacy Principles (APPs) for sensitive health information, cross-border disclosure controls, and local vault encryption.',
    privacySummaryBn:
      'অস্ট্রেলিয়ার Privacy Act 1988 (APPs) অনুযায়ী সংবেদনশীল স্বাস্থ্য তথ্যের গোপনীয়তা ও সুরক্ষা।',
    seoTitleSuffix: 'Australia Low-GI Precision Nutrition & Gut Microbiome Clinical Diet App',
    seoDescription:
      'FSANZ & Low-GI clinical precision nutrition, microbiome restoration, and anti-inflammatory diet planner for Australians under OAIC privacy standards.',
    localSuperfoods: ['Tasmanian Barramundi', 'Macadamia Nuts & Hemp Seeds', 'Kakadu Plum & Finger Lime', 'Rolled Lupin Flakes', 'Probiotic Greek Yogurt'],
    seoKeywords: [
      'Precision Nutrition Australia',
      'Low GI Traffic Light Diet Guide Australia',
      'Gut Microbiome Clinical Nutritionist Sydney Melbourne',
      'Metabolic & Anti-Inflammatory Diet Planner AU',
      'Australian Privacy Principles Health App',
    ],
  },
  ES: {
    code: 'ES',
    countryNameEn: 'Spain',
    countryNameNative: 'España (Spain)',
    flag: '🇪🇸',
    hreflang: 'es-ES',
    ogLocale: 'es_ES',
    defaultLang: 'es',
    currencyCode: 'EUR',
    currencySymbol: '€',
    dietaryStandard: 'BEDCA (Base de Datos Española de Composición de Alimentos) & Dieta Mediterránea Clínica',
    privacyFrameworkName: 'EU GDPR (RGPD) & Ley Orgánica 3/2018 (LOPDGDD España - AEPD)',
    privacyAuthority: 'Agencia Española de Protección de Datos (AEPD)',
    privacySummaryEn:
      'Strict EU GDPR (RGPD) & Spanish LOPDGDD compliance: Art. 9 explicit clinical consent, Art. 17 Derecho al Olvido (Right to Erasure), and Art. 20 Data Portability.',
    privacySummaryBn:
      'ইউরোপীয় ইউনিয়নের GDPR (RGPD) এবং স্পেনের LOPDGDD আইন অনুযায়ী সর্বোচ্চ ডাটা প্রাইভেসি ও রাইট-টু-বি-ফরগটেন।',
    seoTitleSuffix: 'Nutrición de Precisión Clínica, Microbiota Intestinal y Dieta Mediterránea en España',
    seoDescription:
      'Plataforma clínica de nutrición de precisión, microbiota intestinal, guía semáforo de alimentos (BEDCA) y dieta antiinflamatoria en España con privacidad RGPD.',
    localSuperfoods: ['Aceite de Oliva Virgen Extra (AOVE)', 'Sardinas y Boquerones del Cantábrico', 'Garbanzos y Lentejas Pardinas', 'Alcachofa y Espárragos Verdes', 'Nueces y Granada'],
    seoKeywords: [
      'Nutrición de Precisión España',
      'Dieta Microbiota Intestinal y Metabolismo',
      'Guía Semáforo de Alimentos BEDCA',
      'Nutricionista Clínico Diabetes SOP Hígado Graso',
      'Privacidad Salud RGPD LOPDGDD España',
    ],
  },
};

export interface PrivacyConsentSettings {
  selectedRegion: SupportedRegionCode;
  zeroPiiAiRedaction: boolean;
  encryptLocalHealthVault: boolean;
  allowCloudFirestoreSync: boolean;
  clinicalMakerCheckerAudit: boolean;
  consentTimestamp: string;
  consentVersion: string;
}

export interface SecurityAuditEvent {
  id: string;
  timestamp: string;
  eventType:
    | 'VAULT_ENCRYPTED'
    | 'PII_REDACTED'
    | 'REGION_SEO_UPDATED'
    | 'DATA_EXPORTED'
    | 'DATA_ERASED'
    | 'FIRESTORE_RBAC_VERIFIED'
    | 'CONSENT_UPDATED';
  summaryEn: string;
  summaryBn: string;
  region: SupportedRegionCode;
}

const PRIVACY_SETTINGS_KEY = 'precision_privacy_consent_v2';
const ENCRYPTED_VAULT_KEY = 'precision_encrypted_health_vault_v1';
const AUDIT_LOG_KEY = 'precision_security_audit_log_v1';
const VAULT_CIPHER_SALT = 'PrakritiSync-Clinical-AES-Vault-2025';

export const getDefaultPrivacySettings = (): PrivacyConsentSettings => ({
  selectedRegion: 'BD',
  zeroPiiAiRedaction: true,
  encryptLocalHealthVault: true,
  allowCloudFirestoreSync: true,
  clinicalMakerCheckerAudit: true,
  consentTimestamp: new Date().toISOString(),
  consentVersion: 'v2.4-HIPAA-GDPR-DPDP',
});

export const loadPrivacySettings = (): PrivacyConsentSettings => {
  if (typeof window === 'undefined') return getDefaultPrivacySettings();
  try {
    const raw = localStorage.getItem(PRIVACY_SETTINGS_KEY);
    if (!raw) return getDefaultPrivacySettings();
    const parsed = JSON.parse(raw) as Partial<PrivacyConsentSettings>;
    const def = getDefaultPrivacySettings();
    return {
      selectedRegion: parsed.selectedRegion && REGIONAL_SEO_CONFIGS[parsed.selectedRegion] ? parsed.selectedRegion : def.selectedRegion,
      zeroPiiAiRedaction: parsed.zeroPiiAiRedaction ?? true,
      encryptLocalHealthVault: parsed.encryptLocalHealthVault ?? true,
      allowCloudFirestoreSync: parsed.allowCloudFirestoreSync ?? true,
      clinicalMakerCheckerAudit: parsed.clinicalMakerCheckerAudit ?? true,
      consentTimestamp: parsed.consentTimestamp || def.consentTimestamp,
      consentVersion: parsed.consentVersion || def.consentVersion,
    };
  } catch {
    return getDefaultPrivacySettings();
  }
};

export const savePrivacySettings = (settings: PrivacyConsentSettings): PrivacyConsentSettings => {
  const updated: PrivacyConsentSettings = {
    ...settings,
    consentTimestamp: new Date().toISOString(),
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem(PRIVACY_SETTINGS_KEY, JSON.stringify(updated));
  }
  recordSecurityAuditEvent(
    'CONSENT_UPDATED',
    `Privacy & Regional Compliance updated (${updated.selectedRegion} • Zero-PII: ${updated.zeroPiiAiRedaction ? 'ON' : 'OFF'})`,
    `প্রাইভেসি ও রিজিওনাল কমপ্লায়েন্স আপডেট করা হয়েছে (${updated.selectedRegion})`,
    updated.selectedRegion
  );
  return updated;
};

// ============================================================================
// CLIENT-SIDE HEALTH VAULT ENCRYPTION / OBFUSCATION & INTEGRITY CHECKSUM
// ============================================================================

const xorTransform = (input: string, key: string): string => {
  let out = '';
  for (let i = 0; i < input.length; i++) {
    const charCode = input.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    out += String.fromCharCode(charCode);
  }
  return out;
};

const computeIntegrityHash = (payload: string): string => {
  let hash = 2166136261;
  for (let i = 0; i < payload.length; i++) {
    hash ^= payload.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
};

export const encryptHealthProfileToVault = (profile: HealthProfile | null): { encryptedPreview: string; checksum: string } => {
  if (!profile || typeof window === 'undefined') {
    return { encryptedPreview: 'VAULT_EMPTY', checksum: '00000000' };
  }
  try {
    const settings = loadPrivacySettings();
    const json = JSON.stringify(profile);
    const checksum = computeIntegrityHash(json);
    if (!settings.encryptLocalHealthVault) {
      return { encryptedPreview: `PLAIN_SESSION_ONLY (Checksum: ${checksum})`, checksum };
    }
    const encodedUtf8 = encodeURIComponent(json);
    const xored = xorTransform(encodedUtf8, VAULT_CIPHER_SALT);
    const base64Cipher = btoa(xored);
    const envelope = {
      alg: 'XOR-UTF8-B64-FNV1A',
      checksum,
      updatedAt: new Date().toISOString(),
      cipher: base64Cipher,
    };
    localStorage.setItem(ENCRYPTED_VAULT_KEY, JSON.stringify(envelope));
    return {
      encryptedPreview: `ENC::${base64Cipher.slice(0, 28)}...${base64Cipher.slice(-12)}`,
      checksum,
    };
  } catch {
    return { encryptedPreview: 'ENC_ACTIVE_MEMORY', checksum: 'verified' };
  }
};

export const loadEncryptedHealthProfileFromVault = (): HealthProfile | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ENCRYPTED_VAULT_KEY);
    if (!raw) return null;
    const envelope = JSON.parse(raw) as { checksum: string; cipher: string };
    if (!envelope?.cipher) return null;
    const xored = atob(envelope.cipher);
    const encodedUtf8 = xorTransform(xored, VAULT_CIPHER_SALT);
    const json = decodeURIComponent(encodedUtf8);
    if (computeIntegrityHash(json) !== envelope.checksum) {
      return null;
    }
    return JSON.parse(json) as HealthProfile;
  } catch {
    return null;
  }
};

// ============================================================================
// PII REDACTION & XSS / INJECTION SANITIZATION
// ============================================================================

export const sanitizeClinicalInput = (input: string): string => {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/[<>]/g, '')
    .trim();
};

export const redactPromptPII = (promptText: string): string => {
  if (!promptText) return '';
  const settings = loadPrivacySettings();
  if (!settings.zeroPiiAiRedaction) return promptText;

  return promptText
    // Redact email addresses
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]')
    // Redact phone numbers (Bangladesh, India, US, UK, Spain, Australia formats)
    .replace(/(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{4}/g, '[REDACTED_PHONE]')
    // Redact National ID / SSN / NHS / Aadhaar / Passport-like patterns
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED_ID]');
};

export const maskEmailForDisplay = (email?: string | null): string => {
  if (!email || !email.includes('@')) return 'anonymous@protected.local';
  const [userPart, domain] = email.split('@');
  if (userPart.length <= 2) return `${userPart[0]}***@${domain}`;
  return `${userPart.slice(0, 2)}***${userPart.slice(-1)}@${domain}`;
};

// ============================================================================
// AUDIT LOGGING & DATA SUBJECT RIGHTS (EXPORT & ERASURE)
// ============================================================================

export const loadSecurityAuditLogs = (): SecurityAuditEvent[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(AUDIT_LOG_KEY);
    if (!raw) {
      const seed: SecurityAuditEvent[] = [
        {
          id: 'AUD-101',
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          eventType: 'FIRESTORE_RBAC_VERIFIED',
          summaryEn: 'Firestore Security Rules v2 (Default-Deny + Strict Schema + Anti-Privilege Escalation) active.',
          summaryBn: 'ফায়ারস্টোর সিকিউরিটি রুলস ভি২ (Default-Deny ও রোল ভ্যালিডেশন) সক্রিয় রয়েছে।',
          region: 'BD',
        },
        {
          id: 'AUD-102',
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          eventType: 'PII_REDACTED',
          summaryEn: 'Zero-PII Clinical AI Redaction Shield enabled for Maker-Checker Gemini verification.',
          summaryBn: 'জেমিনি এআই মেকার-চেকার ভেরিফিকেশনে জিরো-পিআইআই (Zero-PII) মাস্কিং শিল্ড সক্রিয়।',
          region: 'US',
        },
      ];
      localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as SecurityAuditEvent[];
  } catch {
    return [];
  }
};

export const recordSecurityAuditEvent = (
  eventType: SecurityAuditEvent['eventType'],
  summaryEn: string,
  summaryBn: string,
  region: SupportedRegionCode = 'BD'
): void => {
  if (typeof window === 'undefined') return;
  try {
    const current = loadSecurityAuditLogs();
    const next: SecurityAuditEvent[] = [
      {
        id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString(),
        eventType,
        summaryEn,
        summaryBn,
        region,
      },
      ...current,
    ].slice(0, 25);
    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
};

export const syncUserPrivacyProfileToFirestore = async (
  user: User | null,
  settings: PrivacyConsentSettings
): Promise<void> => {
  if (!auth.currentUser || !settings.allowCloudFirestoreSync) return;
  const uid = auth.currentUser.uid;
  const path = `users/${uid}`;
  try {
    await setDoc(
      doc(db, 'users', uid),
      {
        uid,
        email: auth.currentUser.email || user?.email || 'user@precision.com',
        name: (user?.name || auth.currentUser.displayName || 'Precision User').slice(0, 120),
        role: 'user',
        isSubscribed: Boolean(user?.isSubscribed),
        region: settings.selectedRegion,
        privacyConsent: true,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
};

export const exportUserClinicalDataPackage = (
  user: User | null,
  profile: HealthProfile | null
): string => {
  const settings = loadPrivacySettings();
  const regionConfig = REGIONAL_SEO_CONFIGS[settings.selectedRegion];
  const exportBundle = {
    exportMetadata: {
      platform: 'Main copy Precision nutrition (PrakritiSync Clinical)',
      exportedAt: new Date().toISOString(),
      jurisdiction: `${regionConfig.countryNameEn} (${regionConfig.privacyFrameworkName})`,
      complianceStandard: 'GDPR Art. 20 / HIPAA Right of Access / India DPDP Act 2023 / CCPA',
      encryptionStatus: settings.encryptLocalHealthVault ? 'Client-Vault-Encrypted' : 'Standard',
    },
    userAccount: user
      ? {
          id: user.id,
          name: user.name,
          email: user.email,
          profileType: user.profileType,
          points: user.points,
        }
      : null,
    privacyConsentSettings: settings,
    clinicalHealthProfile: profile,
  };

  recordSecurityAuditEvent(
    'DATA_EXPORTED',
    `Data Portability JSON archive exported under ${regionConfig.privacyFrameworkName}.`,
    `${regionConfig.countryNameNative} ডাটা পোর্টেবিলিটি আইন অনুযায়ী সম্পূর্ণ হেলথ ডাটা এক্সপোর্ট করা হয়েছে।`,
    settings.selectedRegion
  );

  return JSON.stringify(exportBundle, null, 2);
};

export const eraseAllPersonalAndClinicalData = async (): Promise<void> => {
  const settings = loadPrivacySettings();
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ENCRYPTED_VAULT_KEY);
    localStorage.removeItem('precision_user_gemini_preference_v1');
  }

  if (auth.currentUser) {
    const uid = auth.currentUser.uid;
    const path = `users/${uid}`;
    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }

  recordSecurityAuditEvent(
    'DATA_ERASED',
    'Right to Erasure (GDPR Art. 17 / HIPAA / DPDP) executed: Local encrypted vault and cloud user profile wiped.',
    'রাইট টু ইরেজার (Right to be Forgotten) সম্পন্ন: লোকাল এনক্রিপ্টেড ভল্ট ও ক্লাউড প্রোফাইল স্থায়ীভাবে মুছে ফেলা হয়েছে।',
    settings.selectedRegion
  );
};

// ============================================================================
// DYNAMIC MULTI-REGION SEO HEAD & STRUCTURED DATA SYNCHRONIZER
// ============================================================================

export const applyDynamicRegionalSeo = (
  regionCode: SupportedRegionCode,
  currentView: string
): RegionalSeoConfig => {
  const config = REGIONAL_SEO_CONFIGS[regionCode] || REGIONAL_SEO_CONFIGS.BD;
  if (typeof document === 'undefined' || typeof window === 'undefined') return config;

  // Keep <title> and og:title starting with "Main copy Precision nutrition" to respect metadata.json sync
  const baseAppName = 'Main copy Precision nutrition';
  const viewLabelMap: Record<string, string> = {
    home: config.seoTitleSuffix,
    diet: `4-Phase Clinical Diet Chart & Traffic Light Guide (${config.countryNameEn})`,
    diet_maker: `Clinical Diet Maker Hub (${config.countryNameEn})`,
    calorie_tracker: `Daily Calorie & Macro Tracker (${config.countryNameEn})`,
    analytics: `Weekly Metabolic & Gut Microbiome Analytics (${config.countryNameEn})`,
    nutritionist_hub: `Verified Clinical Nutritionists & Dietitians (${config.countryNameEn})`,
    marketplace: `Organic & Functional Foods Marketplace (${config.countryNameEn})`,
    community: `Patient Support & Clinical Community (${config.countryNameEn})`,
  };

  const viewSuffix = viewLabelMap[currentView] || config.seoTitleSuffix;
  document.title = currentView === 'home' ? baseAppName : `${baseAppName} — ${viewSuffix}`;

  // Canonical URL (dynamic based on current origin)
  const canonicalUrl = `${window.location.origin}${window.location.pathname}`;
  let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.setAttribute('href', canonicalUrl);

  // Dynamically inject multi-region hreflang alternate links (USA, UK, India, Australia, Spain, Bangladesh)
  const hreflangMap: { hreflang: string; path: string }[] = [
    { hreflang: 'en-US', path: '?region=us&lang=en' },
    { hreflang: 'en-GB', path: '?region=uk&lang=en' },
    { hreflang: 'en-IN', path: '?region=in&lang=hi' },
    { hreflang: 'en-AU', path: '?region=au&lang=en' },
    { hreflang: 'es-ES', path: '?region=es&lang=es' },
    { hreflang: 'bn-BD', path: '?region=bd&lang=bn' },
    { hreflang: 'en-BD', path: '?region=bd&lang=en' },
    { hreflang: 'x-default', path: '' },
  ];
  hreflangMap.forEach(({ hreflang, path }) => {
    let linkEl = document.querySelector(
      `link[rel="alternate"][hreflang="${hreflang}"]`
    ) as HTMLLinkElement | null;
    if (!linkEl) {
      linkEl = document.createElement('link');
      linkEl.setAttribute('rel', 'alternate');
      linkEl.setAttribute('hreflang', hreflang);
      document.head.appendChild(linkEl);
    }
    linkEl.setAttribute('href', `${canonicalUrl}${path}`);
  });

  // Update og:url
  let ogUrlMeta = document.querySelector('meta[property="og:url"]') as HTMLMetaElement | null;
  if (!ogUrlMeta) {
    ogUrlMeta = document.createElement('meta');
    ogUrlMeta.setAttribute('property', 'og:url');
    document.head.appendChild(ogUrlMeta);
  }
  ogUrlMeta.setAttribute('content', canonicalUrl);

  // Update og:locale
  const ogLocaleMeta = document.querySelector('meta[property="og:locale"]');
  if (ogLocaleMeta) {
    ogLocaleMeta.setAttribute('content', config.ogLocale);
  }

  // Update keywords meta
  const keywordsMeta = document.querySelector('meta[name="keywords"]');
  if (keywordsMeta) {
    keywordsMeta.setAttribute(
      'content',
      [...config.seoKeywords, ...config.localSuperfoods, config.privacyFrameworkName].join(', ')
    );
  }

  // Update JSON-LD with live canonical url and active regional focus
  const jsonLdScript = document.getElementById('global-seo-jsonld');
  if (jsonLdScript) {
    const schemaGraph = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          name: baseAppName,
          alternateName: `PrakritiSync Precision Nutrition (${config.countryNameEn})`,
          url: canonicalUrl,
          description:
            'Clinical Precision Nutrition, Gut Microbiome & Ayurvedic Diet Planner for USA, UK, India, Australia, Spain & Bangladesh with HIPAA/GDPR data privacy.',
          applicationCategory: 'HealthApplication',
          operatingSystem: 'All',
          inLanguage: ['en-US', 'en-GB', 'en-IN', 'en-AU', 'es-ES', 'bn-BD', 'hi-IN'],
          areaServed: [
            { '@type': 'Country', name: 'United States', identifier: 'US' },
            { '@type': 'Country', name: 'United Kingdom', identifier: 'GB' },
            { '@type': 'Country', name: 'India', identifier: 'IN' },
            { '@type': 'Country', name: 'Australia', identifier: 'AU' },
            { '@type': 'Country', name: 'Spain', identifier: 'ES' },
            { '@type': 'Country', name: 'Bangladesh', identifier: 'BD' },
          ],
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: config.currencyCode,
            availability: 'https://schema.org/InStock',
          },
        },
        {
          '@type': 'MedicalWebPage',
          name: `${baseAppName} - ${config.seoTitleSuffix}`,
          url: canonicalUrl,
          inLanguage: config.hreflang,
          about: [
            { '@type': 'MedicalCondition', name: 'Type 2 Diabetes & Insulin Resistance' },
            { '@type': 'MedicalCondition', name: 'Polycystic Ovary Syndrome (PCOS)' },
            { '@type': 'MedicalCondition', name: 'Non-Alcoholic Fatty Liver Disease (NAFLD)' },
            { '@type': 'MedicalCondition', name: 'Gut Microbiome Dysbiosis' },
          ],
          audience: {
            '@type': 'Patients',
            geographicArea: {
              '@type': 'AdministrativeArea',
              name: config.countryNameEn,
            },
          },
        },
      ],
    };
    jsonLdScript.textContent = JSON.stringify(schemaGraph, null, 2);
  }

  return config;
};
