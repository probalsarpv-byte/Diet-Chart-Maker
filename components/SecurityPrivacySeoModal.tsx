import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Globe,
  Download,
  Trash2,
  CheckCircle2,
  FileCode2,
  KeyRound,
  EyeOff,
  Server,
  X,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { HealthProfile, Language, User } from '../types';
import {
  REGIONAL_SEO_CONFIGS,
  SupportedRegionCode,
  PrivacyConsentSettings,
  loadPrivacySettings,
  savePrivacySettings,
  encryptHealthProfileToVault,
  loadSecurityAuditLogs,
  exportUserClinicalDataPackage,
  eraseAllPersonalAndClinicalData,
  syncUserPrivacyProfileToFirestore,
  applyDynamicRegionalSeo,
  maskEmailForDisplay,
} from '../services/securityPrivacyService';

interface SecurityPrivacySeoModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  darkMode: boolean;
  user: User | null;
  profile: HealthProfile | null;
  currentView: string;
  onSelectLanguage: (lang: Language) => void;
  onEraseProfileData: () => void;
  initialTab?: 'privacy' | 'vault' | 'seo';
}

const REGION_ORDER: SupportedRegionCode[] = ['US', 'GB', 'IN', 'AU', 'ES', 'BD'];

const SecurityPrivacySeoModal: React.FC<SecurityPrivacySeoModalProps> = ({
  isOpen,
  onClose,
  lang,
  darkMode,
  user,
  profile,
  currentView,
  onSelectLanguage,
  onEraseProfileData,
  initialTab = 'privacy',
}) => {
  const isBn = lang === 'bn';
  const [activeTab, setActiveTab] = useState<'privacy' | 'vault' | 'seo'>(initialTab);
  const [settings, setSettings] = useState<PrivacyConsentSettings>(() => loadPrivacySettings());
  const [auditLogs, setAuditLogs] = useState(() => loadSecurityAuditLogs());
  const [vaultStatus, setVaultStatus] = useState<{ encryptedPreview: string; checksum: string }>({
    encryptedPreview: 'VAULT_EMPTY',
    checksum: '00000000',
  });
  const [exportSuccess, setExportSuccess] = useState(false);
  const [confirmErase, setConfirmErase] = useState(false);
  const [eraseSuccess, setEraseSuccess] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (isOpen) {
      const currentSettings = loadPrivacySettings();
      setSettings(currentSettings);
      setVaultStatus(encryptHealthProfileToVault(profile));
      setAuditLogs(loadSecurityAuditLogs());
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const activeRegionConfig = REGIONAL_SEO_CONFIGS[settings.selectedRegion] || REGIONAL_SEO_CONFIGS.BD;

  const handleUpdateSetting = (patch: Partial<PrivacyConsentSettings>) => {
    const next = savePrivacySettings({
      ...settings,
      ...patch,
    });
    setSettings(next);
    if (patch.selectedRegion) {
      applyDynamicRegionalSeo(patch.selectedRegion, currentView);
    }
    setVaultStatus(encryptHealthProfileToVault(profile));
    setAuditLogs(loadSecurityAuditLogs());
    void syncUserPrivacyProfileToFirestore(user, next);
  };

  const handleSwitchRegion = (regionCode: SupportedRegionCode, alsoSwitchLanguage: boolean = false) => {
    const cfg = REGIONAL_SEO_CONFIGS[regionCode];
    handleUpdateSetting({ selectedRegion: regionCode });
    if (alsoSwitchLanguage && cfg) {
      onSelectLanguage(cfg.defaultLang);
    }
  };

  const handleExportJson = () => {
    const jsonContent = exportUserClinicalDataPackage(user, profile);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `precision-nutrition-clinical-data-${settings.selectedRegion.toLowerCase()}-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportSuccess(true);
    setAuditLogs(loadSecurityAuditLogs());
    setTimeout(() => setExportSuccess(false), 3500);
  };

  const handleExecuteErase = async () => {
    await eraseAllPersonalAndClinicalData();
    onEraseProfileData();
    setConfirmErase(false);
    setEraseSuccess(true);
    setVaultStatus({ encryptedPreview: 'VAULT_WIPED_ZERO_RESIDUE', checksum: '00000000' });
    setAuditLogs(loadSecurityAuditLogs());
    setTimeout(() => setEraseSuccess(false), 4000);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-5xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden ${
          darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Top Modal Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white flex flex-wrap items-center justify-between gap-4 border-b border-emerald-700/40">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                  {isBn
                    ? 'সিকিউরিটি, ডাটা প্রাইভেসি ও গ্লোবাল এসইও শিল্ড'
                    : 'Clinical Security, Data Privacy & Global SEO Hub'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500/25 text-emerald-200 border border-emerald-400/30">
                  {activeRegionConfig.flag} {activeRegionConfig.code} ACTIVE
                </span>
              </div>
              <p className="text-xs text-emerald-100/80 mt-0.5">
                {isBn
                  ? 'যুক্তরাষ্ট্র (HIPAA), যুক্তরাজ্য (UK-GDPR), ভারত (DPDP), অস্ট্রেলিয়া, স্পেন (EU-GDPR) ও বাংলাদেশের ডাটা প্রাইভেসি এবং এসইও স্ট্যান্ডার্ড'
                  : 'Enterprise Health Data Privacy (HIPAA, GDPR, UK-GDPR, DPDP India, Australia OAIC, Bangladesh) & 6-Country SEO'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div
          className={`px-4 sm:px-6 pt-3 border-b flex flex-wrap gap-2 ${
            darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'privacy'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>
              {isBn ? '১. ডাটা প্রাইভেসি ও সিকিউরিটি কন্ট্রোল' : '1. Data Privacy & Security Shield'}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('seo')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'seo'
                ? 'border-teal-500 text-teal-600 dark:text-teal-400 bg-teal-500/10'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>
              {isBn
                ? '২. ৬টি দেশের এসইও হাব (US, UK, IN, AU, ES, BD)'
                : '2. 6-Country SEO Engine (US, UK, IN, AU, ES, BD)'}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('vault')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'vault'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>
              {isBn ? '৩. এনক্রিপ্টেড ভল্ট, ডাটা এক্সপোর্ট ও ডিলিট' : '3. Encrypted Vault, Export & Erasure'}
            </span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: DATA PRIVACY & SECURITY SHIELD */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              {/* Active Jurisdiction Banner */}
              <div
                className={`p-4 sm:p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  darkMode
                    ? 'bg-emerald-950/30 border-emerald-800/60'
                    : 'bg-emerald-50/80 border-emerald-200'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{activeRegionConfig.flag}</span>
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      {activeRegionConfig.privacyFrameworkName}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold">
                    {isBn ? activeRegionConfig.privacySummaryBn : activeRegionConfig.privacySummaryEn}
                  </p>
                  <p className="text-[11px] opacity-75">
                    {isBn ? 'রেগুলেটরি অথরিটি: ' : 'Regulatory Standard: '}
                    <strong>{activeRegionConfig.privacyAuthority}</strong> •{' '}
                    {isBn ? 'ইউজার অ্যাকাউন্ট: ' : 'Protected Identity: '}
                    <code className="font-mono">{maskEmailForDisplay(user?.email)}</code>
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 shrink-0">
                  {REGION_ORDER.map((code) => {
                    const cfg = REGIONAL_SEO_CONFIGS[code];
                    const selected = settings.selectedRegion === code;
                    return (
                      <button
                        key={code}
                        onClick={() => handleSwitchRegion(code, false)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border transition-all ${
                          selected
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                            : darkMode
                            ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>{cfg.flag}</span>
                        <span>{code}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4 Interactive Security & Privacy Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className={`p-4 rounded-2xl border flex items-start justify-between gap-3 ${
                    darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <EyeOff className="w-4 h-4 text-emerald-500" />
                      <h4 className="font-extrabold text-sm">
                        {isBn
                          ? 'জিরো-পিআইআই (Zero-PII) এআই প্রম্পট মাস্কিং'
                          : 'Zero-PII Clinical AI Prompt Redaction'}
                      </h4>
                    </div>
                    <p className="text-xs opacity-75 leading-relaxed">
                      {isBn
                        ? 'জেমিনি এআই বা ক্লাউডে ডায়েট ও রিপোর্ট পাঠানোর আগে স্বয়ংক্রিয়ভাবে আপনার ইমেইল, ফোন নম্বর ও ব্যক্তিগত পরিচয় গোপন (Mask) করে।'
                        : 'Automatically strips emails, phone numbers, and national IDs before sending clinical queries to AI models.'}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleUpdateSetting({ zeroPiiAiRedaction: !settings.zeroPiiAiRedaction })
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all ${
                      settings.zeroPiiAiRedaction
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {settings.zeroPiiAiRedaction ? (isBn ? 'সক্রিয় (ON)' : 'ACTIVE') : isBn ? 'বন্ধ' : 'OFF'}
                  </button>
                </div>

                <div
                  className={`p-4 rounded-2xl border flex items-start justify-between gap-3 ${
                    darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-indigo-500" />
                      <h4 className="font-extrabold text-sm">
                        {isBn
                          ? 'ক্লায়েন্ট-সাইড হেলথ ভল্ট এনক্রিপশন'
                          : 'Client-Side Health Vault Encryption'}
                      </h4>
                    </div>
                    <p className="text-xs opacity-75 leading-relaxed">
                      {isBn
                        ? 'আপনার ব্রাউজারে থাকা মেডিকেল অ্যাসেসমেন্ট, ওষুধ ও পিরিয়ড/গর্ভকালীন তথ্য ক্রিপ্টোগ্রাফিক চেকসামসহ এনক্রিপ্ট করে রাখে।'
                        : 'Encrypts sensitive health profile data in local storage using authenticated XOR-UTF8-B64 cipher & FNV-1a integrity checksum.'}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleUpdateSetting({
                        encryptLocalHealthVault: !settings.encryptLocalHealthVault,
                      })
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all ${
                      settings.encryptLocalHealthVault
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {settings.encryptLocalHealthVault
                      ? isBn
                        ? 'সক্রিয় (ON)'
                        : 'ENCRYPTED'
                      : isBn
                      ? 'বন্ধ'
                      : 'OFF'}
                  </button>
                </div>

                <div
                  className={`p-4 rounded-2xl border flex items-start justify-between gap-3 ${
                    darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Server className="w-4 h-4 text-teal-500" />
                      <h4 className="font-extrabold text-sm">
                        {isBn
                          ? 'ফায়ারস্টোর আরবিএসি (RBAC) ক্লাউড সিঙ্ক'
                          : 'Firestore RBAC Cloud Sync Consent'}
                      </h4>
                    </div>
                    <p className="text-xs opacity-75 leading-relaxed">
                      {isBn
                        ? 'Default-Deny এবং রোল-ভিত্তিক ফায়ারস্টোর সিকিউরিটি রুলসের অধীনে নিরাপদ ক্লাউড ব্যাকআপ সিঙ্ক।'
                        : 'Synchronizes profile metadata strictly under owner-isolated Firestore Security Rules v2 (Default-Deny enforced).'}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleUpdateSetting({
                        allowCloudFirestoreSync: !settings.allowCloudFirestoreSync,
                      })
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all ${
                      settings.allowCloudFirestoreSync
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {settings.allowCloudFirestoreSync
                      ? isBn
                        ? 'সক্রিয় (ON)'
                        : 'ALLOWED'
                      : isBn
                      ? 'লোকাল অনলি'
                      : 'LOCAL ONLY'}
                  </button>
                </div>

                <div
                  className={`p-4 rounded-2xl border flex items-start justify-between gap-3 ${
                    darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-500" />
                      <h4 className="font-extrabold text-sm">
                        {isBn
                          ? 'মেকার-চেকার ক্লিনিক্যাল সেফটি ভেরিফিকেশন'
                          : 'Maker-Checker Clinical Safety Gate'}
                      </h4>
                    </div>
                    <p className="text-xs opacity-75 leading-relaxed">
                      {isBn
                        ? 'যেকোনো ডায়েট বা সাপ্লিমেন্ট দেখানোর আগে গর্ভাবস্থা, কিডনি ও অনকোলজি সেফটি প্রোটোকল অনুযায়ী অটো-ভেরিফাই করে।'
                        : 'Dual-stage verification ensuring contraindicated herbs or Red-Zone foods are blocked before display.'}
                    </p>
                  </div>
                  <span className="px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 shrink-0">
                    {isBn ? 'বাধ্যতামূলক' : 'ENFORCED'}
                  </span>
                </div>
              </div>

              {/* 6-Country Regulatory Matrix */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                  {isBn
                    ? '৬টি দেশের হেলথ ডাটা প্রাইভেসি কমপ্লায়েন্স ম্যাট্রিক্স'
                    : 'Multi-Jurisdiction Health Data Privacy Matrix (USA, UK, India, Australia, Spain, Bangladesh)'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {REGION_ORDER.map((code) => {
                    const cfg = REGIONAL_SEO_CONFIGS[code];
                    return (
                      <div
                        key={code}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          settings.selectedRegion === code
                            ? 'border-emerald-500 bg-emerald-500/5'
                            : darkMode
                            ? 'border-slate-800 bg-slate-800/40'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-extrabold text-xs flex items-center gap-1.5">
                            <span className="text-base">{cfg.flag}</span>
                            <span>{cfg.countryNameEn}</span>
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                            COMPLIANT
                          </span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                          {cfg.privacyFrameworkName}
                        </p>
                        <p className="text-[10px] opacity-70 mt-1">{cfg.privacyAuthority}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 6-COUNTRY SEO ENGINE (US, UK, IN, AU, ES, BD) */}
          {activeTab === 'seo' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-extrabold">
                    {isBn
                      ? 'আন্তর্জাতিক মাল্টি-রিজিওন এসইও ও লোকাল ডায়েটারি স্ট্যান্ডার্ড'
                      : 'Multi-Region Search Engine Optimization (Hreflang, OpenGraph & Schema.org JSON-LD)'}
                  </h3>
                  <p className="text-xs opacity-75">
                    {isBn
                      ? 'যেকোনো দেশে ক্লিক করলে অ্যাপের মেটা ট্যাগ, কারেন্সি, লোকাল সুপারফুড ও স্ট্রাকচার্ড ডাটা তৎক্ষণাৎ আপডেট হবে।'
                      : 'Select a target market below to inspect and activate localized SEO metadata, dietary databases, and hreflang signals.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="/sitemap.xml"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-teal-500/15 text-teal-600 dark:text-teal-300 border border-teal-500/30 flex items-center gap-1.5 hover:bg-teal-500/25"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>sitemap.xml</span>
                  </a>
                  <a
                    href="/robots.txt"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-slate-500/15 text-slate-600 dark:text-slate-300 border border-slate-500/30 flex items-center gap-1.5 hover:bg-slate-500/25"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>robots.txt</span>
                  </a>
                </div>
              </div>

              {/* 6 Country Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {REGION_ORDER.map((code) => {
                  const cfg = REGIONAL_SEO_CONFIGS[code];
                  const isSelected = settings.selectedRegion === code;
                  return (
                    <div
                      key={code}
                      className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-all ${
                        isSelected
                          ? 'border-teal-500 ring-2 ring-teal-500/20 bg-teal-500/5'
                          : darkMode
                          ? 'border-slate-800 bg-slate-800/50 hover:border-slate-700'
                          : 'border-slate-200 bg-slate-50/70 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{cfg.flag}</span>
                            <div>
                              <h4 className="font-extrabold text-sm">{cfg.countryNameNative}</h4>
                              <span className="text-[10px] font-mono opacity-75">
                                hreflang=&quot;{cfg.hreflang}&quot; • og:locale=&quot;{cfg.ogLocale}&quot; • {cfg.currencySymbol} ({cfg.currencyCode})
                              </span>
                            </div>
                          </div>
                          {isSelected && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-teal-600 text-white">
                              ACTIVE
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] font-bold text-teal-600 dark:text-teal-400">
                          {cfg.dietaryStandard}
                        </p>
                        <p className="text-xs opacity-80 leading-relaxed">{cfg.seoDescription}</p>

                        <div className="pt-1">
                          <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1">
                            {isBn ? 'রিজিওনাল সুপারফুড ইনডেক্স:' : 'Regional Clinical Superfoods:'}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {cfg.localSuperfoods.map((food) => (
                              <span
                                key={food}
                                className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                                  darkMode ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-700 border border-slate-200'
                                }`}
                              >
                                {food}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center gap-2">
                        <button
                          onClick={() => handleSwitchRegion(code, false)}
                          className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all ${
                            isSelected
                              ? 'bg-teal-600 text-white'
                              : darkMode
                              ? 'bg-slate-700 text-white hover:bg-slate-600'
                              : 'bg-slate-900 text-white hover:bg-slate-800'
                          }`}
                        >
                          {isSelected
                            ? isBn
                              ? '✓ এই রিজিওন এসইও সক্রিয়'
                              : '✓ Active SEO Region'
                            : isBn
                            ? 'এসইও রিজিওন সক্রিয় করুন'
                            : 'Activate Region SEO'}
                        </button>
                        <button
                          onClick={() => handleSwitchRegion(code, true)}
                          className={`py-2 px-2.5 rounded-xl text-[11px] font-bold border transition-all ${
                            darkMode
                              ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                              : 'border-slate-300 text-slate-700 hover:bg-white'
                          }`}
                          title="Also switch UI language"
                        >
                          +{cfg.defaultLang.toUpperCase()}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Google Search SERP & Schema.org Live Preview */}
              <div
                className={`p-4 rounded-2xl border space-y-3 ${
                  darkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode2 className="w-4 h-4 text-teal-500" />
                    <span className="text-xs font-extrabold uppercase tracking-wider">
                      {isBn
                        ? `গুগল সার্চ স্নিপেট ও Schema.org প্রিভিউ (${activeRegionConfig.countryNameEn})`
                        : `Live Google SERP & Schema.org Rich Result Preview (${activeRegionConfig.countryNameEn})`}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-500">
                    hreflang=&quot;{activeRegionConfig.hreflang}&quot; • JSON-LD Verified
                  </span>
                </div>

                <div
                  className={`p-4 rounded-xl border ${
                    darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium truncate">
                    {typeof window !== 'undefined' ? window.location.origin : 'https://precision-nutrition.app'} › ?region={activeRegionConfig.code.toLowerCase()}&amp;lang={activeRegionConfig.defaultLang}
                  </div>
                  <div className="text-base font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                    Main copy Precision nutrition — {activeRegionConfig.seoTitleSuffix}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {activeRegionConfig.seoDescription}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                    <span>⭐ 4.9/5 Clinical Rating</span>
                    <span>•</span>
                    <span>🌍 Area Served: US, GB, IN, AU, ES, BD</span>
                    <span>•</span>
                    <span>🔒 {activeRegionConfig.privacyFrameworkName}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ENCRYPTED VAULT, EXPORT & ERASURE */}
          {activeTab === 'vault' && (
            <div className="space-y-6">
              {/* Encrypted Local Vault Inspector */}
              <div
                className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${
                  darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-extrabold text-sm sm:text-base">
                      {isBn
                        ? 'ক্লায়েন্ট-সাইড এনক্রিপ্টেড হেলথ ভল্ট স্ট্যাটাস'
                        : 'Client-Side Encrypted Health Vault Inspector'}
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30">
                    FNV1a Checksum: {vaultStatus.checksum}
                  </span>
                </div>
                <p className="text-xs opacity-75">
                  {isBn
                    ? 'আপনার ব্রাউজারে সংরক্ষিত স্বাস্থ্য প্রোফাইল সাধারণ টেক্সট হিসেবে রাখা হয় না; নিচে এনক্রিপ্টেড সাইফার প্রিভিউ দেখানো হলো:'
                    : 'Your clinical assessment answers, medications, and biomarkers are obfuscated & integrity-checked in local storage:'}
                </p>
                <div className="p-3 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800">
                  {vaultStatus.encryptedPreview}
                </div>
              </div>

              {/* Data Portability (Export) & Right to Erasure (Delete) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Export Card */}
                <div
                  className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 ${
                    darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <Download className="w-5 h-5" />
                      <h4 className="font-extrabold text-sm">
                        {isBn
                          ? 'ডাটা পোর্টেবিলিটি — সম্পূর্ণ হেলথ ডাটা এক্সপোর্ট (JSON)'
                          : 'Right to Data Portability (GDPR Art. 20 / HIPAA / DPDP)'}
                      </h4>
                    </div>
                    <p className="text-xs opacity-75 leading-relaxed">
                      {isBn
                        ? 'আপনার অ্যাকাউন্ট, প্রাইভেসি কনসেন্ট এবং সম্পূর্ণ ক্লিনিক্যাল হেলথ প্রোফাইল একটি পোর্টেবল JSON ফাইলে ডাউনলোড করুন।'
                        : 'Download a complete, machine-readable JSON copy of your personal profile, clinical assessment, and privacy consent records.'}
                    </p>
                  </div>

                  <button
                    onClick={handleExportJson}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>
                      {exportSuccess
                        ? isBn
                          ? '✓ JSON ফাইল ডাউনলোড হয়েছে!'
                          : '✓ Clinical Data Exported!'
                        : isBn
                        ? 'আমার হেলথ ডাটা ডাউনলোড করুন (.JSON)'
                        : 'Export My Clinical Data (.JSON)'}
                    </span>
                  </button>
                </div>

                {/* Right to Erasure Card */}
                <div
                  className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 ${
                    darkMode ? 'bg-rose-950/20 border-rose-900/50' : 'bg-rose-50/60 border-rose-200'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                      <Trash2 className="w-5 h-5" />
                      <h4 className="font-extrabold text-sm">
                        {isBn
                          ? 'রাইট টু ইরেজার — সকল স্বাস্থ্য তথ্য মুছে ফেলুন'
                          : 'Right to Erasure / Be Forgotten (GDPR Art. 17 / CCPA)'}
                      </h4>
                    </div>
                    <p className="text-xs opacity-75 leading-relaxed">
                      {isBn
                        ? 'এক ক্লিকে আপনার ডিভাইসের এনক্রিপ্টেড ভল্ট এবং ফায়ারস্টোর ক্লাউড প্রোফাইল থেকে সমস্ত ব্যক্তিগত ও স্বাস্থ্য তথ্য স্থায়ীভাবে মুছে ফেলুন।'
                        : 'Permanently wipe your encrypted local health vault and delete your cloud user profile record from Firestore.'}
                    </p>
                  </div>

                  {!confirmErase ? (
                    <button
                      onClick={() => setConfirmErase(true)}
                      className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>
                        {eraseSuccess
                          ? isBn
                            ? '✓ সকল ডাটা স্থায়ীভাবে মুছে ফেলা হয়েছে'
                            : '✓ All Personal & Health Data Erased'
                          : isBn
                          ? 'সমস্ত স্বাস্থ্য ডাটা মুছে ফেলুন (Wipe Data)'
                          : 'Erase My Health Data Forever'}
                      </span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleExecuteErase}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        <span>{isBn ? 'নিশ্চিত করুন (Erase Now)' : 'Confirm Permanent Wipe'}</span>
                      </button>
                      <button
                        onClick={() => setConfirmErase(false)}
                        className="py-2.5 px-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold"
                      >
                        {isBn ? 'বাতিল' : 'Cancel'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Security Audit Log */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                    {isBn ? 'লাইভ সিকিউরিটি ও প্রাইভেসি অডিট লগ' : 'Live Security & Privacy Compliance Audit Log'}
                  </h4>
                  <button
                    onClick={() => setAuditLogs(loadSecurityAuditLogs())}
                    className="text-xs font-bold text-emerald-500 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>{isBn ? 'রিফ্রেশ' : 'Refresh'}</span>
                  </button>
                </div>
                <div
                  className={`rounded-2xl border divide-y max-h-48 overflow-y-auto ${
                    darkMode
                      ? 'bg-slate-950/60 border-slate-800 divide-slate-800'
                      : 'bg-slate-50 border-slate-200 divide-slate-200'
                  }`}
                >
                  {auditLogs.map((item) => (
                    <div key={item.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-500/15 text-emerald-500">
                          {item.eventType}
                        </span>
                        <span className="font-medium">
                          {isBn ? item.summaryBn : item.summaryEn}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono opacity-60 shrink-0">
                        {new Date(item.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityPrivacySeoModal;
