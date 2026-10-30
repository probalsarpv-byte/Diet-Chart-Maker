import React, { useState, useEffect } from 'react';
import { HealthProfile, Language, Phase, ProfileRoleType, User, UserGeminiAccountConfig } from '../types';
import { translations } from '../i18n';
import HealthPortal from './HealthPortal';
import FamilyManagerDashboard from './FamilyManagerDashboard';
import DoctorDashboard from './DoctorDashboard';
import PregnancyMilestonesDashboard from './PregnancyMilestonesDashboard';
import ChildDevelopmentMilestones from './ChildDevelopmentMilestones';
import {
  getUserGeminiAccount,
  toggleUserGeminiAccount,
  subscribeUserGeminiAccount,
} from '../services/aiModeService';
import {
  loadPlatformState,
  subscribePlatformState,
  updateNutritionistPhoto,
} from '../services/platformHubService';
import {
  formatByteSize,
  CompressedPhotoResult,
} from '../services/imageCompressionService';
import { useDeviceLayout as useDeviceSkin } from '../services/deviceSkinService';
import ProfilePhotoCropModal from './ProfilePhotoCropModal';
import CrossBorderCuisineBar from './CrossBorderCuisineBar';
import { signInWithGoogleAccount, signOutGoogleAccount, isAdminEmail } from '../firebase';
import { Camera, CreditCard, ExternalLink, LogOut, Mail, ShieldCheck, Sparkles, Upload, Video } from 'lucide-react';

interface Props {
  user: User;
  profile: HealthProfile;
  currentPhase: Phase;
  lang: Language;
  darkMode?: boolean;
  onNavigateToDiet: () => void;
  onNavigateToDietMaker?: () => void;
  onNavigateToFamilyPot?: () => void;
  onNavigateToDashboard?: () => void;
  onOpenPaywall?: () => void;
  onNavigateToAdmin?: () => void;
  onNavigateToNutritionistHub?: () => void;
  onUpdateUser?: (updated: User) => void;
  onUpdateProfile?: (updated: HealthProfile) => void;
}

const ProfileView: React.FC<Props> = ({
  user,
  profile,
  currentPhase,
  lang,
  darkMode,
  onNavigateToDiet,
  onNavigateToDietMaker,
  onNavigateToFamilyPot,
  onNavigateToDashboard,
  onOpenPaywall,
  onNavigateToAdmin,
  onNavigateToNutritionistHub,
  onUpdateUser,
  onUpdateProfile,
}) => {
  const t = translations[lang];
  const isBn = lang === 'bn';
  const { isMobileSkin } = useDeviceSkin();
  const [copied, setCopied] = useState(false);
  const [showPortal, setShowPortal] = useState(false);
  const [hubState, setHubState] = useState(() => loadPlatformState());
  const [geminiAccount, setGeminiAccount] = useState<UserGeminiAccountConfig>(() =>
    getUserGeminiAccount()
  );
  const [doctorPhotoStats, setDoctorPhotoStats] = useState<CompressedPhotoResult | null>(null);
  const [pendingDoctorPhotoFile, setPendingDoctorPhotoFile] = useState<File | null>(null);
  const [doctorPhotoMsg, setDoctorPhotoMsg] = useState('');

  useEffect(() => {
    const unsub1 = subscribeUserGeminiAccount((cfg) => {
      setGeminiAccount(cfg);
    });
    const unsub2 = subscribePlatformState((st) => {
      setHubState(st);
    });
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  const isAuthenticatedAdmin = Boolean(
    user.isAdmin && user.firebaseUid && isAdminEmail(user.email)
  );

  const handleConnectGoogleProfile = async () => {
    try {
      const fbUser = await signInWithGoogleAccount();
      const adminStatus = isAdminEmail(fbUser.email);
      if (onUpdateUser) {
        onUpdateUser({
          ...user,
          name: fbUser.displayName || user.name,
          email: fbUser.email || user.email,
          photoUrl: fbUser.photoURL || user.photoUrl,
          firebaseUid: fbUser.uid,
          isAdmin: adminStatus,
          isPro: adminStatus ? true : user.isPro,
        });
      }
    } catch (err) {
      console.error('Google Sign-In error:', err);
    }
  };

  const handleDisconnectGoogleProfile = async () => {
    try {
      await signOutGoogleAccount();
      if (onUpdateUser) {
        onUpdateUser({
          ...user,
          firebaseUid: undefined,
          isAdmin: false,
        });
      }
    } catch (err) {
      console.error('Google Sign-Out error:', err);
    }
  };

  // Bookings confirmed by Admin for Nutritionist
  const confirmedBookingsForDoctor = hubState.bookings.filter(
    (b) => b.status === 'confirmed_for_nutritionist'
  );

  const initialRole: ProfileRoleType =
    user.profileType || (user.id.startsWith('DOC-') ? 'doctor' : user.isFamilyManager ? 'family' : 'self');

  const [activeRoleTab, setActiveRoleTab] = useState<ProfileRoleType>(initialRole);

  useEffect(() => {
    setActiveRoleTab(initialRole);
  }, [initialRole]);

  const handleRoleSwitch = (role: ProfileRoleType) => {
    setActiveRoleTab(role);
    if (onUpdateUser) {
      onUpdateUser({
        ...user,
        profileType: role,
        isFamilyManager: role === 'family' ? true : user.isFamilyManager,
      });
    }
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const prof = user.professionalProfile || {
    fullName: user.name || (isBn ? 'ডা. আরিফুল ইসলাম' : 'Dr. Ariful Islam'),
    role: 'Doctor' as const,
    licenseNumber: 'BMDC-48291',
    specialty: isBn ? 'ফাংশনাল মেডিসিন ও ক্লিনিকাল নিউট্রিশন' : 'Functional Medicine & Clinical Nutrition',
    institution: isBn ? 'প্রিসিশন ক্লিনিকাল সেন্টার' : 'Precision Clinical Center',
    experienceYears: 8,
  };

  // Clean User Gemini Preference Card (No internal mechanism instructions exposed)
  const renderGeminiAccountCard = () => (
    <div
      className={`p-4 md:p-5 rounded-[28px] border shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors ${
        darkMode
          ? 'bg-gradient-to-r from-slate-900 via-emerald-950/40 to-teal-950/40 border-emerald-800/50'
          : 'bg-gradient-to-r from-emerald-50/70 via-teal-50/50 to-white border-emerald-200/80'
      }`}
    >
      <div className="flex items-center gap-3.5">
        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
            geminiAccount.enabled
              ? 'bg-emerald-600 text-white'
              : darkMode
              ? 'bg-slate-800 text-emerald-400 border border-slate-700'
              : 'bg-white text-emerald-700 border border-emerald-200'
          }`}
        >
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm md:text-base font-extrabold">
            {isBn
              ? 'আপনি কি আপনার নিজস্ব Gemini ব্যবহার করতে চান?'
              : 'Would you like to use your own Gemini?'}
          </h3>
        </div>
      </div>

      <div className="flex items-center gap-3 self-end md:self-center shrink-0">
        <span
          className={`text-xs font-extrabold ${
            geminiAccount.enabled ? 'text-emerald-600 dark:text-emerald-400' : 'opacity-60'
          }`}
        >
          {geminiAccount.enabled
            ? isBn
              ? 'চালু আছে (ON)'
              : 'Connected (ON)'
            : isBn
            ? 'বন্ধ আছে (OFF)'
            : 'Off'}
        </span>
        <button
          type="button"
          onClick={() =>
            toggleUserGeminiAccount(!geminiAccount.enabled, user.email, user.name)
          }
          role="switch"
          aria-checked={geminiAccount.enabled}
          className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            geminiAccount.enabled ? 'bg-emerald-600' : 'bg-slate-400 dark:bg-slate-700'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
              geminiAccount.enabled ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );

  // Role Switcher Header (3 Profile Types -> 3 Distinct Interfaces)
  const renderRoleSwitcher = () => (
    <div className={isMobileSkin ? 'space-y-3' : 'space-y-4'}>
      {renderGeminiAccountCard()}
      <div
        className={`${
          isMobileSkin ? 'p-3.5 rounded-2xl' : 'p-4 md:p-5 rounded-[28px]'
        } border shadow-md flex flex-col md:flex-row items-center justify-between gap-3 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
        }`}
      >
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <span className="text-xl">🎛️</span>
          <div>
            <h3 className="text-xs md:text-sm font-bold">
              {isBn ? 'প্রোফাইল ইন্টারফেস মোড (৩ ধরনের প্রোফাইল)' : 'Profile Interface Mode (3 Profile Types)'}
            </h3>
            {!isMobileSkin && (
              <p className="text-[11px] opacity-60">
                {isBn
                  ? 'নিজের জন্য, ফ্যামিলির জন্য অথবা ডাক্তার হিসেবে আপনার ইন্টারফেস দেখুন'
                  : 'Switch between Personal, Family, and Clinical Doctor interfaces'}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5 md:gap-2 w-full md:w-auto">
          <button
            onClick={() => handleRoleSwitch('self')}
            className={`${
              isMobileSkin ? 'px-2 py-2.5 text-[11px]' : 'px-4 py-2.5 text-xs'
            } rounded-2xl font-bold flex items-center justify-center gap-1 transition-all ${
              activeRoleTab === 'self'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : darkMode
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>👤</span>
            <span>{isBn ? 'নিজের জন্য' : 'Myself'}</span>
          </button>

          <button
            onClick={() => handleRoleSwitch('family')}
            className={`${
              isMobileSkin ? 'px-2 py-2.5 text-[11px]' : 'px-4 py-2.5 text-xs'
            } rounded-2xl font-bold flex items-center justify-center gap-1 transition-all ${
              activeRoleTab === 'family'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : darkMode
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>👨‍👩‍👧‍👦</span>
            <span>{isBn ? 'ফ্যামিলি' : 'Family'}</span>
          </button>

          <button
            onClick={() => handleRoleSwitch('doctor')}
            className={`${
              isMobileSkin ? 'px-2 py-2.5 text-[11px]' : 'px-4 py-2.5 text-xs'
            } rounded-2xl font-bold flex items-center justify-center gap-1 transition-all ${
              activeRoleTab === 'doctor'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : darkMode
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>🩺</span>
            <span>{isBn ? 'ডাক্তার' : 'Doctor'}</span>
          </button>
        </div>
      </div>

      {/* Firebase Google Account Login in User Profile + Manual Payment Subscription + Admin Access Bar */}
      <div
        className={`p-4 md:p-5 rounded-[28px] border shadow-sm flex flex-wrap items-center justify-between gap-3 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
        }`}
      >
        <div className="flex items-center gap-3">
          {user.photoUrl ? (
            <img src={user.photoUrl} alt={user.name} className="w-10 h-10 rounded-full border" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 flex items-center justify-center font-black">
              G
            </div>
          )}
          <div>
            <div className="text-xs font-extrabold flex flex-wrap items-center gap-2">
              <span>{user.email || 'user@precision.com'}</span>
              {user.firebaseUid ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/15 text-emerald-500 font-black">
                  ✓ {isBn ? 'Google সাইন ইন সম্পন্ন' : 'Signed In'}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 font-black">
                  {isBn ? 'সাইন ইন করা হয়নি' : 'Not Signed In'}
                </span>
              )}
            </div>
            <p className="text-[11px] opacity-65">
              {isBn
                ? 'আপনার প্রোফাইল সংরক্ষণে Google অ্যাকাউন্ট দিয়ে সাইন ইন করুন'
                : 'Sign in with your Google account to sync your profile'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleConnectGoogleProfile}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold shadow-md"
          >
            {user.firebaseUid
              ? isBn
                ? '🔄 অন্য Google অ্যাকাউন্ট ব্যবহার করুন'
                : '🔄 Switch Google Account'
              : isBn
              ? '🔗 Google দিয়ে সাইন ইন করুন'
              : '🔗 Sign in with Google'}
          </button>

          {user.firebaseUid && (
            <button
              type="button"
              onClick={handleDisconnectGoogleProfile}
              className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
                darkMode
                  ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isBn ? 'লগআউট' : 'Sign Out'}</span>
            </button>
          )}

          {onOpenPaywall && (
            <button
              type="button"
              onClick={onOpenPaywall}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{isBn ? 'প্রিমিয়াম প্ল্যান' : 'Premium Plan'}</span>
            </button>
          )}

          {isAuthenticatedAdmin && onNavigateToAdmin && (
            <button
              type="button"
              onClick={onNavigateToAdmin}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-md flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isBn ? 'অ্যাডমিন প্যানেল' : 'Admin Panel'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Latest Notifications */}
      {hubState.notifications.length > 0 && (
        <div
          className={`p-4 md:p-5 rounded-[28px] border-2 space-y-2 ${
            darkMode
              ? 'bg-emerald-950/25 border-emerald-500/40'
              : 'bg-emerald-50/80 border-emerald-300'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-black text-emerald-600 dark:text-emerald-400">
            <Mail className="w-4 h-4" />
            <span>
              {isBn
                ? 'নোটিফিকেশন ও আপডেট'
                : 'Notifications & Updates'}
            </span>
          </div>
          {hubState.notifications.slice(0, 2).map((notif) => (
            <div
              key={notif.id}
              className={`p-3.5 rounded-2xl border text-xs space-y-1 ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="font-extrabold">{isBn ? notif.titleBn : notif.titleEn}</div>
              <pre className="whitespace-pre-wrap font-sans text-[11px] opacity-80">
                {isBn ? notif.messageBn : notif.messageEn}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ============================================================================
  // INTERFACE 3: DOCTOR PROFILE INTERFACE (ডাক্তার হিসেবে)
  // ============================================================================
  if (activeRoleTab === 'doctor') {
    return (
      <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom duration-500 pb-24">
        {renderRoleSwitcher()}

        {/* Doctor Hero Card */}
        <div
          className={`p-6 md:p-10 rounded-[40px] border shadow-xl flex flex-col md:flex-row gap-8 items-center relative overflow-hidden transition-colors ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          }`}
        >
          <div className="flex flex-col items-center gap-2.5 shrink-0">
            <label
              className="relative w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center font-bold text-4xl serif italic shadow-xl bg-blue-600 text-white overflow-hidden cursor-pointer group border-2 border-blue-400/60"
              title={isBn ? 'প্রোফাইল ফটো যুক্ত বা ক্রপ করতে ক্লিক করুন' : 'Click to upload & crop profile photo'}
            >
              {user.professionalProfile?.photoUrl || user.photoUrl ? (
                <img
                  src={user.professionalProfile?.photoUrl || user.photoUrl}
                  alt={prof.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                prof.fullName[0] || 'D'
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-extrabold gap-1">
                <Camera className="w-5 h-5" />
                <span>{isBn ? 'ফেস ক্রপ' : 'Crop Face'}</span>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setDoctorPhotoMsg('');
                    setPendingDoctorPhotoFile(file);
                  }
                  e.target.value = '';
                }}
              />
            </label>

            <label className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-extrabold cursor-pointer inline-flex items-center gap-1.5 shadow-sm">
              <Upload className="w-3 h-3" />
              <span>{isBn ? 'ফটো যুক্ত ও ক্রপ করুন' : 'Upload & Crop Photo'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setDoctorPhotoMsg('');
                    setPendingDoctorPhotoFile(file);
                  }
                  e.target.value = '';
                }}
              />
            </label>
          </div>

          <ProfilePhotoCropModal
            file={pendingDoctorPhotoFile}
            lang={lang}
            darkMode={darkMode}
            onCancel={() => setPendingDoctorPhotoFile(null)}
            onConfirm={(result) => {
              setPendingDoctorPhotoFile(null);
              setDoctorPhotoStats(result);
              if (onUpdateUser) {
                onUpdateUser({
                  ...user,
                  photoUrl: result.dataUrl,
                  professionalProfile: {
                    ...prof,
                    photoUrl: result.dataUrl,
                  },
                });
              }
              updateNutritionistPhoto({
                userId: user.id,
                userEmail: user.email,
                photoUrl: result.dataUrl,
              });
              setDoctorPhotoMsg(
                isBn
                  ? '✓ প্রোফাইল ফটো সফলভাবে সংরক্ষিত হয়েছে'
                  : '✓ Profile photo saved'
              );
            }}
          />

          <div className="text-center md:text-left flex-1 space-y-3">
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-2.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full">
                🩺 {isBn ? 'ডাক্তার ও নিউট্রিশনিস্ট প্রোফাইল' : t.verified_practitioner}
              </span>
              <button
                onClick={() => handleCopyId(user.id)}
                className={`text-xs font-mono font-bold px-3 py-1 rounded-full border flex items-center gap-2 transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                ID: {user.id}
                {copied ? <span className="text-emerald-500">✓</span> : <span className="opacity-40 text-[10px]">COPY</span>}
              </button>
            </div>

            <h2 className={`text-3xl md:text-4xl font-bold serif italic leading-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {prof.fullName}
            </h2>
            <p className="text-xs md:text-sm font-bold opacity-60 italic">
              {prof.role} • {prof.specialty} • {prof.institution} ({prof.experienceYears}+ Yrs)
            </p>
            {doctorPhotoMsg && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-[11px] font-extrabold">
                <span>{doctorPhotoMsg}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
            <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/40 text-center">
              <div className="text-2xl font-black text-blue-600">12</div>
              <div className="text-[9px] font-black uppercase tracking-wider opacity-60">{t.active_patients}</div>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/40 text-center">
              <div className="text-2xl font-black text-emerald-600">94%</div>
              <div className="text-[9px] font-black uppercase tracking-wider opacity-60">{t.adherence_avg}</div>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/40 text-center">
              <div className="text-2xl font-black text-amber-600">✓</div>
              <div className="text-[9px] font-black uppercase tracking-wider opacity-60">
                {isBn ? 'ভেরিফাইড' : 'Verified'}
              </div>
            </div>
          </div>
        </div>

        {/* TODAY'S CONSULTATION BOOKINGS WITH GOOGLE MEET */}
        <div
          className={`p-6 md:p-8 rounded-[36px] border-2 space-y-4 ${
            darkMode
              ? 'bg-gradient-to-r from-slate-900 via-teal-950/40 to-emerald-950/30 border-teal-500/40'
              : 'bg-gradient-to-r from-teal-50 via-emerald-50/60 to-white border-teal-300 shadow-lg'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-2xl shadow-md">
                🔔
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-600 dark:text-emerald-300">
                  {isBn
                    ? 'কনফার্মড অ্যাপয়েন্টমেন্ট • Google Meet'
                    : 'Confirmed Appointments • Google Meet'}
                </span>
                <h3 className="text-lg font-extrabold mt-0.5">
                  {isBn
                    ? `আজকে আপনার ${confirmedBookingsForDoctor.length}টি কনফার্মড বুকিং আছে!`
                    : `You Have ${confirmedBookingsForDoctor.length} Confirmed Consultation Booking(s) Today!`}
                </h3>
              </div>
            </div>

            {onNavigateToNutritionistHub && (
              <button
                onClick={onNavigateToNutritionistHub}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold"
              >
                {isBn ? 'পুষ্টিবিদ হাব ও ফিচার্ড প্রোফাইল দেখুন →' : 'Open Nutritionist Hub →'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {confirmedBookingsForDoctor.map((bk) => (
              <div
                key={bk.id}
                className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 ${
                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-teal-600 dark:text-teal-400">
                    <span>
                      📅 {bk.appointmentDate} • {bk.appointmentSlot}
                    </span>
                    <span>✓ Paid (৳{bk.consultationFeeBdt})</span>
                  </div>
                  <h4 className="font-extrabold text-sm mt-1">
                    {isBn ? 'রোগী:' : 'Patient:'} {bk.patientName} ({bk.patientPhone})
                  </h4>
                  <p className="text-xs opacity-75 mt-1">{bk.healthConcern}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] opacity-65">
                    {isBn ? bk.nutritionistNameBn : bk.nutritionistNameEn}
                  </span>
                  <a
                    href={bk.googleMeetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-xs inline-flex items-center gap-1.5 shadow-md"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>{isBn ? 'Google Meet-এ কথা বলুন' : 'Join Google Meet'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inline Clinical Doctor Workspace */}
        <DoctorDashboard
          user={user}
          profile={profile}
          currentPhase={currentPhase}
          lang={lang}
          darkMode={darkMode}
          inlineMode={true}
          onSubscribeSuccess={() => {}}
        />
      </div>
    );
  }

  // ============================================================================
  // INTERFACE 2: FAMILY PROFILE INTERFACE (ফ্যামিলির জন্য)
  // ============================================================================
  if (activeRoleTab === 'family') {
    return (
      <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom duration-500 pb-24">
        {renderRoleSwitcher()}

        <FamilyManagerDashboard
          user={user}
          primaryProfile={profile}
          lang={lang}
          darkMode={darkMode}
          inlineMode={true}
          onUpdateUser={onUpdateUser}
          onOpenFamilyPot={onNavigateToFamilyPot}
          onOpenDietMaker={onNavigateToDietMaker || onNavigateToDiet}
        />
      </div>
    );
  }

  // ============================================================================
  // INTERFACE 1: SELF / PERSONAL PROFILE INTERFACE (নিজের জন্য)
  // ============================================================================
  let cycleDay = 1;
  let cyclePhase = t.cycle_menstrual;
  let phaseColor = 'text-red-500';
  let advice = '';

  if (profile.gender === 'Female' && profile.cycleData) {
    const today = new Date();
    const lastPeriod = new Date(profile.cycleData.lastPeriodDate);
    const diffTime = Math.abs(today.getTime() - lastPeriod.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    cycleDay = (diffDays % profile.cycleData.cycleLength) + 1;

    if (cycleDay <= 5) {
      cyclePhase = t.cycle_menstrual;
      phaseColor = 'text-red-500';
      advice = t.shakti_menstrual_advice;
    } else if (cycleDay <= 13) {
      cyclePhase = t.cycle_follicular;
      phaseColor = 'text-pink-400';
      advice = t.shakti_follicular_advice;
    } else if (cycleDay <= 16) {
      cyclePhase = t.cycle_ovulatory;
      phaseColor = 'text-purple-500';
      advice = t.shakti_ovulatory_advice;
    } else {
      cyclePhase = t.cycle_luteal;
      phaseColor = 'text-amber-500';
      advice = t.shakti_luteal_advice;
    }
  }

  const healthId = `AM-${(profile.dosha || 'VATA').toUpperCase()}-${((profile.age || 35) * 1234).toString().slice(0, 4)}`;

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom duration-500 pb-24">
      {renderRoleSwitcher()}

      {showPortal && (
        <HealthPortal
          user={user}
          profile={profile}
          currentPhase={currentPhase}
          lang={lang}
          darkMode={darkMode}
          onClose={() => setShowPortal(false)}
        />
      )}

      {/* Global Residence Location vs. Preferred Food Cuisine Selector */}
      <CrossBorderCuisineBar
        profile={profile}
        lang={lang}
        darkMode={darkMode}
        onUpdateProfile={onUpdateProfile}
      />

      {/* Hero Section: Personal Identity & Quick Actions */}
      <div
        className={`p-6 md:p-10 rounded-[40px] border shadow-xl flex flex-col md:flex-row gap-8 items-center relative overflow-hidden transition-colors ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
        }`}
      >
        <div
          className={`w-24 h-24 md:w-28 md:h-28 rounded-[32px] flex items-center justify-center font-bold text-4xl serif italic shadow-xl shrink-0 ${
            darkMode ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-white'
          }`}
        >
          {profile.dosha?.[0] || 'P'}
        </div>

        <div className="text-center md:text-left flex-1 space-y-3">
          <div>
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-2.5 mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full">
                👤 {isBn ? 'নিজের জন্য প্রোফাইল ইন্টারফেস' : t.verified_bio}
              </span>
              <button
                onClick={() => handleCopyId(healthId)}
                className={`text-xs font-mono font-bold px-3 py-1 rounded-full border flex items-center gap-2 transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                ID: {healthId}
                {copied ? <span className="text-emerald-500">✓</span> : <span className="opacity-40 text-[10px]">COPY</span>}
              </button>
            </div>

            <h2 className={`text-3xl md:text-4xl font-bold serif italic leading-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {user.name || t.welcome.replace('{dosha}', profile.dosha || 'Patient')}
            </h2>
          </div>

          <div className="flex flex-wrap justify-center md:justify-start gap-2.5">
            <div
              className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold ${
                darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}
            >
              {profile.age} yrs • {profile.gender} • {profile.weight}kg • {profile.dosha}
            </div>
            <div className="bg-amber-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-md flex items-center gap-1.5">
              {user.points} {t.pts} <span>⭐</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 w-full md:w-auto">
          <button
            onClick={onNavigateToDietMaker || onNavigateToDiet}
            className="w-full px-7 py-3.5 rounded-2xl font-bold uppercase tracking-wider text-xs shadow-lg transition-all active:scale-95 bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            🍱 {isBn ? 'ডায়েট মেকার ও চার্ট খুলুন' : t.diet_chart}
          </button>
          <button
            onClick={() => setShowPortal(true)}
            className={`w-full px-6 py-3 rounded-2xl font-bold uppercase tracking-wider text-xs shadow-md transition-all active:scale-95 ${
              darkMode ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            {t.patient_portal}
          </button>
        </div>
      </div>

      {/* Pregnancy Milestones Dashboard (Strictly visible ONLY when profile.cohortType === 'pregnancy_lactation') */}
      {profile.cohortType === 'pregnancy_lactation' && (
        <PregnancyMilestonesDashboard
          currentPregnancyMonth={profile.pregnancyMonth || 1}
          lang={lang}
          darkMode={darkMode}
          onSyncPregnancyMonth={(newMonth) => {
            if (onUpdateProfile) {
              onUpdateProfile({ ...profile, pregnancyMonth: newMonth });
            }
          }}
        />
      )}

      {/* Child Development Milestones & Catch-Up Engine (Strictly visible ONLY when profile.cohortType === 'child_pediatric') */}
      {profile.cohortType === 'child_pediatric' && (
        <ChildDevelopmentMilestones
          childAgeGroup={profile.childAgeGroup || '1-3'}
          childAgeYears={profile.age}
          childWeightKg={profile.weight}
          childHeightCm={profile.height}
          lang={lang}
          darkMode={darkMode}
          onSyncAgeGroup={(newBracket) => {
            if (onUpdateProfile) {
              onUpdateProfile({ ...profile, childAgeGroup: newBracket });
            }
          }}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Health Synthesis Dashboard */}
        <div
          className={`md:col-span-2 p-6 md:p-8 rounded-[36px] border shadow-sm space-y-6 transition-colors ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          }`}
        >
          <div className="flex justify-between items-center border-b border-inherit pb-4">
            <h3 className={`text-xl font-bold serif italic ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
              {t.clinical_synthesis}
            </h3>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-40">
              {isBn ? 'শারীরিক বিশ্লেষণ' : 'Overall Health Condition'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-5">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2">
                  {t.microbiome} Diversity
                </h4>
                <div className="flex items-end gap-2 mb-1.5">
                  <span className="text-3xl font-black">{profile.microbiomeScore}%</span>
                  <span className="text-[10px] font-bold opacity-50 pb-1">Optimal</span>
                </div>
                <div className="h-1.5 bg-slate-700/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-1000"
                    style={{ width: `${profile.microbiomeScore}%` }}
                  />
                </div>
              </div>
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-2">
                  {t.inflam_status} Index
                </h4>
                <div className="flex items-end gap-2 mb-1.5">
                  <span className="text-3xl font-black">{profile.inflammatoryIndex}/10</span>
                  <span className="text-[10px] font-bold opacity-50 pb-1">
                    {profile.inflammatoryIndex < 4 ? 'Optimal' : 'Attention'}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-700/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all duration-1000"
                    style={{ width: `${profile.inflammatoryIndex * 10}%` }}
                  />
                </div>
              </div>
            </div>

            <div
              className={`p-5 rounded-3xl border ${
                darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500 font-black text-xs">pH</div>
                <h4 className="text-xs font-black uppercase tracking-widest opacity-60">{t.alkaline_score}</h4>
              </div>
              <div className="text-4xl font-black mb-2 text-indigo-500">{profile.analysis?.alkalineScore || 7.4}</div>
              <p className="text-[11px] font-medium leading-relaxed opacity-65 italic">
                {profile.analysis?.alkalineScore && profile.analysis.alkalineScore > 7.3
                  ? isBn
                    ? 'কোষীয় পরিবেশ ক্ষারীয় ও মেটাবলিক ডিটক্সের জন্য অনুকূল।'
                    : 'Cellular environment is optimally alkaline, supporting metabolic detox.'
                  : isBn
                  ? 'মেটাবলিক অ্যাসিডিটি কমাতে ক্ষারীয় শাকসবজি ও খাবারের ওপর জোর দেওয়া হয়েছে।'
                  : 'Metabolic acidity detected; protocol focuses on shift to alkalinity.'}
              </p>
            </div>
          </div>

          <div
            className={`p-5 rounded-3xl border-2 border-dashed ${
              darkMode ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50/50 border-amber-200'
            }`}
          >
            <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1.5">
              {isBn ? 'ক্লিনিকাল ও আয়ুর্বেদিক সারসংক্ষেপ' : 'Ayurvedic Perspective'}
            </h4>
            <p className={`text-xs md:text-sm leading-relaxed font-medium italic ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              {profile.analysis?.healthSummary ||
                `Profile synthesis suggests dominant ${profile.dosha} Dosha with good cellular resilience.`}
            </p>
          </div>
        </div>

        {/* Secondary Sidebar */}
        <div className="space-y-6">
          {profile.gender === 'Female' && profile.cycleData ? (
            <div
              className={`p-6 rounded-[36px] border shadow-sm relative overflow-hidden transition-colors ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
              }`}
            >
              <div className={`absolute top-0 right-0 p-4 opacity-10 font-serif italic text-6xl ${phaseColor}`}>
                {cycleDay}
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">🌺</span>
                  <h3 className="font-bold text-base serif italic">{t.cycle_sync}</h3>
                </div>
                <div className="mb-4">
                  <div className={`text-2xl font-black ${phaseColor} mb-1`}>{cyclePhase}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest opacity-50">
                    Day {cycleDay} of {profile.cycleData.cycleLength}
                  </div>
                </div>
                <div
                  className={`p-4 rounded-2xl text-xs font-bold leading-relaxed ${
                    darkMode ? 'bg-slate-800 text-emerald-400' : 'bg-emerald-50 text-emerald-800'
                  }`}
                >
                  {advice}
                </div>
              </div>
            </div>
          ) : (
            <div
              className={`p-6 rounded-[36px] border shadow-sm transition-colors ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
              }`}
            >
              <h3 className="font-bold mb-4 italic serif text-lg">{t.goal_tracking}</h3>
              <div className="space-y-3">
                <div className={`p-4 rounded-2xl ${darkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <span className="text-[9px] font-black uppercase opacity-40 block mb-1">{t.primary_target}</span>
                  <span className="text-sm font-bold">{profile.dietGoals || 'Phase 1 Recalibration'}</span>
                </div>
                <div className={`p-4 rounded-2xl ${darkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <span className="text-[9px] font-black uppercase opacity-40 block mb-1">{t.metabolic_type}</span>
                  <span className="text-sm font-bold">{profile.metabolicType}</span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div
              className={`p-5 rounded-3xl border text-center ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
              }`}
            >
              <div className="text-2xl font-black text-emerald-500">{profile.adherenceHistory?.length || 0}</div>
              <div className="text-[9px] font-black uppercase tracking-widest opacity-50">{t.healing_streak}</div>
            </div>
            <div
              className={`p-5 rounded-3xl border text-center ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
              }`}
            >
              <div className="text-2xl font-black text-blue-500">#{currentPhase}</div>
              <div className="text-[9px] font-black uppercase tracking-widest opacity-50">{t.active_phase_label}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
