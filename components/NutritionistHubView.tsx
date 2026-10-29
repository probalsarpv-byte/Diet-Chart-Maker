import React, { useState, useEffect } from 'react';
import {
  Language,
  NutritionistProfileListing,
  NutritionistBooking,
  PaymentMethodType,
  User,
} from '../types';
import {
  loadPlatformState,
  subscribePlatformState,
  registerNutritionistListing,
  submitNutritionistBookingWithPayment,
} from '../services/platformHubService';
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  PlusCircle,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserCheck,
  Video,
  X,
} from 'lucide-react';

interface Props {
  user: User | null;
  lang: Language;
  darkMode?: boolean;
}

const NutritionistHubView: React.FC<Props> = ({ user, lang, darkMode }) => {
  const isBn = lang === 'bn';

  const [hubState, setHubState] = useState(() => loadPlatformState());
  const [activeTab, setActiveTab] = useState<'browse' | 'my_bookings' | 'nutritionist_portal' | 'register'>('browse');
  const [selectedNutritionist, setSelectedNutritionist] = useState<NutritionistProfileListing | null>(null);
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState<string | null>(null);

  // Booking + Manual Payment Form State
  const [patientName, setPatientName] = useState(user?.name || '');
  const [patientEmail, setPatientEmail] = useState(user?.email || '');
  const [patientPhone, setPatientPhone] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [appointmentSlot, setAppointmentSlot] = useState('06:00 PM');
  const [healthConcern, setHealthConcern] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('bkash');
  const [senderNumber, setSenderNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [bookingError, setBookingError] = useState('');

  // Nutritionist Registration Form State
  const [regNameBn, setRegNameBn] = useState(user?.name || '');
  const [regNameEn, setRegNameEn] = useState(user?.name || '');
  const [regEmail, setRegEmail] = useState(user?.email || '');
  const [regPhone, setRegPhone] = useState('');
  const [regRoleBn, setRegRoleBn] = useState('ক্লিনিক্যাল ডায়েটিশিয়ান ও পুষ্টিবিদ');
  const [regLicense, setRegLicense] = useState('');
  const [regSpecialtyBn, setRegSpecialtyBn] = useState('ডায়াবেটিস, পিসিওএস, থাইরয়েড ও মেটাবলিক নিউট্রিশন');
  const [regInstitutionBn, setRegInstitutionBn] = useState('');
  const [regExperience, setRegExperience] = useState('5');
  const [regFee, setRegFee] = useState('700');
  const [regDaysBn, setRegDaysBn] = useState('শনি - বৃহস্পতি (বিকাল ৫:০০ - রাত ৯:০০)');
  const [regBioBn, setRegBioBn] = useState('');
  const [regMeetUrl, setRegMeetUrl] = useState('https://meet.google.com/new');
  const [regWantFeatured, setRegWantFeatured] = useState(true);
  const [regSubmitted, setRegSubmitted] = useState(false);

  useEffect(() => {
    return subscribePlatformState((st) => {
      setHubState(st);
    });
  }, []);

  const approvedNutritionists = hubState.nutritionists.filter((n) => n.status === 'approved');
  const featuredNutritionists = approvedNutritionists.filter((n) => n.isFeatured);

  // IMPORTANT RULE: Only bookings approved by Admin ('confirmed_for_nutritionist') appear in the Nutritionist's active schedule!
  const confirmedNutritionistBookings = hubState.bookings.filter(
    (b) => b.status === 'confirmed_for_nutritionist'
  );

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNutritionist) return;
    if (!patientName.trim() || !patientEmail.trim() || !patientPhone.trim() || !senderNumber.trim() || !transactionId.trim()) {
      setBookingError(
        isBn
          ? 'অনুগ্রহ করে রোগীর নাম, ইমেইল, মোবাইল নম্বর, প্রেরকের নম্বর এবং ট্রানজেকশন আইডি (TrxID) পূরণ করুন।'
          : 'Please complete Patient Name, Email, Phone, Sender Number, and Transaction ID.'
      );
      return;
    }

    submitNutritionistBookingWithPayment({
      nutritionist: selectedNutritionist,
      patientUserId: user?.id || `USR-${Math.floor(1000 + Math.random() * 9000)}`,
      patientName: patientName.trim(),
      patientEmail: patientEmail.trim(),
      patientPhone: patientPhone.trim(),
      appointmentDate,
      appointmentSlot,
      healthConcern:
        healthConcern.trim() ||
        (isBn ? 'ক্লিনিক্যাল ডায়েট চার্ট ও পুষ্টি পরামর্শ' : 'Clinical Diet & Nutrition Consultation'),
      paymentMethod,
      senderNumber: senderNumber.trim(),
      transactionId: transactionId.trim().toUpperCase(),
    });

    setBookingError('');
    setSelectedNutritionist(null);
    setBookingSuccessMsg(
      isBn
        ? 'আপনার অ্যাপয়েন্টমেন্ট বুকিং ও পেমেন্ট ফর্মটি অ্যাডমিন প্যানেলে পাঠানো হয়েছে! অ্যাডমিন পেমেন্ট অ্যাপ্রুভ করার পর এটি পুষ্টিবিদের প্রোফাইলে ("আজকে একটা বুকিং আছে") যুক্ত হবে এবং Google Meet লিংক সক্রিয় হবে।'
        : 'Your booking and manual payment have been sent to the Admin Panel! Once Admin approves the payment, the appointment will appear on the Nutritionist profile with a direct Google Meet link.'
    );
    setActiveTab('my_bookings');
  };

  const handleRegisterNutritionist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNameBn.trim() || !regEmail.trim() || !regLicense.trim()) return;

    registerNutritionistListing({
      userId: user?.id || `DOC-${Math.floor(1000 + Math.random() * 9000)}`,
      fullNameBn: regNameBn.trim(),
      fullNameEn: regNameEn.trim() || regNameBn.trim(),
      email: regEmail.trim(),
      phone: regPhone.trim() || '01700-000000',
      roleTitleBn: regRoleBn.trim(),
      roleTitleEn: 'Clinical Dietitian & Nutritionist',
      licenseNumber: regLicense.trim(),
      specialtyBn: regSpecialtyBn.trim(),
      specialtyEn: regSpecialtyBn.trim(),
      institutionBn: regInstitutionBn.trim() || 'প্রিসিশন নিউট্রিশন কনসালটেশন চেম্বার',
      institutionEn: regInstitutionBn.trim() || 'Precision Nutrition Chamber',
      experienceYears: parseInt(regExperience) || 5,
      consultationFeeBdt: parseInt(regFee) || 700,
      availableDaysBn: regDaysBn,
      availableDaysEn: regDaysBn,
      availableSlots: ['05:00 PM', '06:30 PM', '08:00 PM', '09:00 PM'],
      bioBn:
        regBioBn.trim() ||
        'ক্লিনিক্যাল নিউট্রিশন, মেটাবলিক হেলথ ও বাংলাদেশি খাবারের মাধ্যমে রোগ নিয়ন্ত্রণে অভিজ্ঞ পুষ্টিবিদ।',
      bioEn:
        regBioBn.trim() ||
        'Experienced clinical nutritionist specializing in metabolic health and therapeutic Bangladeshi diets.',
      avatarEmoji: '🩺',
      featuredRequested: regWantFeatured,
      defaultMeetUrl: regMeetUrl.trim() || 'https://meet.google.com/new',
    });

    setRegSubmitted(true);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-24">
      {/* Hero Banner */}
      <div
        className={`p-6 md:p-10 rounded-[36px] border relative overflow-hidden shadow-xl ${
          darkMode
            ? 'bg-gradient-to-br from-slate-900 via-teal-950/50 to-indigo-950/50 border-teal-500/30'
            : 'bg-gradient-to-br from-teal-50 via-emerald-50/70 to-indigo-50/70 border-teal-200'
        }`}
      >
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-extrabold bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-sm">
              <Stethoscope className="w-3.5 h-3.5" />
              <span>
                {isBn
                  ? 'ফিচার্ড ডায়েটিশিয়ান ও পুষ্টিবিদ কনসালটেশন হাব (Google Meet যুক্ত)'
                  : 'Featured Dietitian & Nutritionist Consultation Hub (With Google Meet)'}
              </span>
            </div>

            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
              {isBn
                ? 'বিশেষজ্ঞ পুষ্টিবিদ ও ডায়েটিশিয়ান অ্যাপয়েন্টমেন্ট'
                : 'Consult Verified Dietitians & Clinical Nutritionists'}
            </h1>
            <p className="text-xs md:text-sm opacity-80 leading-relaxed">
              {isBn
                ? 'আপনার পছন্দমতো পুষ্টিবিদ নির্বাচন করে শিডিউল ও ম্যানুয়াল পেমেন্ট সম্পন্ন করুন। অ্যাডমিন প্যানেল পেমেন্ট অ্যাপ্রুভ করলেই পুষ্টিবিদের প্রোফাইলে বুকিং যুক্ত হবে এবং আপনারা সরাসরি Google Meet-এ কথা বলতে পারবেন।'
                : 'Book a schedule with a verified nutritionist via manual payment. Once approved by the Admin Panel, the appointment activates on the Nutritionist dashboard with a live Google Meet room.'}
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('browse')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all ${
                activeTab === 'browse'
                  ? 'bg-teal-600 text-white shadow-lg'
                  : darkMode
                  ? 'bg-slate-800 text-slate-300'
                  : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              👩‍⚕️ {isBn ? 'পুষ্টিবিদ তালিকা' : 'Find Nutritionists'}
            </button>

            <button
              onClick={() => setActiveTab('my_bookings')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all ${
                activeTab === 'my_bookings'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : darkMode
                  ? 'bg-slate-800 text-slate-300'
                  : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              📅 {isBn ? 'আমার বুকিং ও Meet লিংক' : 'My Bookings & Meet'}
            </button>

            <button
              onClick={() => setActiveTab('nutritionist_portal')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all relative ${
                activeTab === 'nutritionist_portal'
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : darkMode
                  ? 'bg-slate-800 text-slate-300'
                  : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              🩺 {isBn ? 'পুষ্টিবিদ ড্যাশবোর্ড (আজকের বুকিং)' : 'Nutritionist Schedule'}
              {confirmedNutritionistBookings.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-950 font-black">
                  {confirmedNutritionistBookings.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('register')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all ${
                activeTab === 'register'
                  ? 'bg-amber-500 text-slate-950 shadow-lg'
                  : darkMode
                  ? 'bg-slate-800 text-amber-400'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              ✨ {isBn ? 'পুষ্টিবিদ রেজিস্ট্রেশন / ফিচার্ড আবেদন' : 'Register as Dietitian'}
            </button>
          </div>
        </div>
      </div>

      {bookingSuccessMsg && (
        <div className="p-5 rounded-3xl bg-emerald-500/15 border-2 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-xs md:text-sm font-bold leading-relaxed">{bookingSuccessMsg}</p>
          </div>
          <button onClick={() => setBookingSuccessMsg(null)} className="text-xs font-bold opacity-60 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* TAB 1: BROWSE FEATURED & VERIFIED NUTRITIONISTS */}
      {activeTab === 'browse' && (
        <div className="space-y-8">
          {/* Featured Dietitians Section */}
          {featuredNutritionists.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg md:text-xl font-extrabold">
                  {isBn
                    ? '🌟 ফিচার্ড ডায়েটিশিয়ান ও পুষ্টিবিদ (Featured Dietitians)'
                    : '🌟 Featured Dietitians & Clinical Specialists'}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {featuredNutritionists.map((nutri) => (
                  <div
                    key={nutri.id}
                    className={`p-6 rounded-[32px] border-2 relative overflow-hidden transition-all shadow-lg ${
                      darkMode
                        ? 'bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-900 border-amber-500/40'
                        : 'bg-gradient-to-br from-amber-50/70 via-white to-teal-50/40 border-amber-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center text-3xl shadow-md shrink-0">
                          {nutri.avatarEmoji}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500 text-slate-950 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              {isBn ? 'ফিচার্ড ডায়েটিশিয়ান' : 'Featured Dietitian'}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                              ✓ {nutri.licenseNumber}
                            </span>
                          </div>
                          <h3 className="text-lg font-extrabold mt-1.5">
                            {isBn ? nutri.fullNameBn : nutri.fullNameEn}
                          </h3>
                          <p className="text-xs font-bold text-teal-600 dark:text-teal-400">
                            {isBn ? nutri.roleTitleBn : nutri.roleTitleEn}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xl font-black text-amber-600 dark:text-amber-400">
                          ৳{nutri.consultationFeeBdt}
                        </div>
                        <div className="text-[10px] opacity-60 font-bold">
                          {isBn ? 'প্রতি সেশন' : 'Per Session'}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 text-xs">
                      <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/70">
                        <span className="font-extrabold opacity-70">
                          {isBn ? 'বিশেষজ্ঞতা: ' : 'Specialty: '}
                        </span>
                        <span className="font-semibold">
                          {isBn ? nutri.specialtyBn : nutri.specialtyEn}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] opacity-75 px-1">
                        <span>🏥 {isBn ? nutri.institutionBn : nutri.institutionEn}</span>
                        <span>⏳ {nutri.experienceYears}+ {isBn ? 'বছরের অভিজ্ঞতা' : 'Yrs Exp'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold px-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{isBn ? nutri.availableDaysBn : nutri.availableDaysEn}</span>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        <Video className="w-4 h-4" />
                        <span>{isBn ? 'Google Meet ভিডিও কনসালটেশন' : 'Google Meet Video Consult'}</span>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedNutritionist(nutri);
                          setAppointmentSlot(nutri.availableSlots[0] || '06:00 PM');
                        }}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold text-xs shadow-md"
                      >
                        {isBn ? 'অ্যাপয়েন্টমেন্ট বুক করুন →' : 'Book Appointment →'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Approved Nutritionists */}
          <div className="space-y-4">
            <h3 className="text-base font-extrabold opacity-80">
              {isBn ? 'সকল ভেরিফাইড পুষ্টিবিদ ও ডায়েটিশিয়ান' : 'All Verified Nutritionists & Dietitians'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {approvedNutritionists.map((nutri) => (
                <div
                  key={nutri.id}
                  className={`p-5 rounded-3xl border flex flex-col justify-between gap-4 ${
                    darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-teal-500/15 text-2xl flex items-center justify-center">
                        {nutri.avatarEmoji}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm">{isBn ? nutri.fullNameBn : nutri.fullNameEn}</h4>
                        <p className="text-[11px] opacity-65">{isBn ? nutri.specialtyBn : nutri.specialtyEn}</p>
                      </div>
                    </div>
                    <p className="text-xs opacity-75 leading-relaxed">{isBn ? nutri.bioBn : nutri.bioEn}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                    <span className="font-black text-sm text-teal-600 dark:text-teal-400">
                      ৳{nutri.consultationFeeBdt}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedNutritionist(nutri);
                        setAppointmentSlot(nutri.availableSlots[0] || '06:00 PM');
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-teal-600 text-white text-xs font-bold"
                    >
                      {isBn ? 'বুকিং করুন' : 'Book Slot'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PATIENT'S MY BOOKINGS & GOOGLE MEET LINK */}
      {activeTab === 'my_bookings' && (
        <div className="space-y-4">
          <h2 className="text-lg font-extrabold">
            {isBn ? '📅 আমার পুষ্টিবিদ অ্যাপয়েন্টমেন্ট ও Google Meet লিংক' : '📅 My Appointments & Google Meet Links'}
          </h2>
          {hubState.bookings.length === 0 ? (
            <div className="p-10 rounded-3xl border text-center opacity-60">
              {isBn ? 'এখনও কোনো অ্যাপয়েন্টমেন্ট বুক করা হয়নি।' : 'No appointments booked yet.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {hubState.bookings.map((bk) => {
                const isApproved = bk.status === 'confirmed_for_nutritionist';
                return (
                  <div
                    key={bk.id}
                    className={`p-6 rounded-3xl border-2 space-y-4 ${
                      isApproved
                        ? darkMode
                          ? 'bg-emerald-950/25 border-emerald-500/40'
                          : 'bg-emerald-50/60 border-emerald-300'
                        : darkMode
                        ? 'bg-slate-900 border-slate-800'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                            isApproved
                              ? 'bg-emerald-600 text-white'
                              : bk.status === 'rejected'
                              ? 'bg-red-500/20 text-red-500'
                              : 'bg-amber-500/20 text-amber-600 dark:text-amber-300'
                          }`}
                        >
                          {isApproved
                            ? isBn
                              ? '✓ অ্যাডমিন কর্তৃক অ্যাপ্রুভড ও কনফার্মড'
                              : '✓ Admin Approved & Confirmed'
                            : bk.status === 'rejected'
                            ? isBn
                              ? 'বাতিল'
                              : 'Rejected'
                            : isBn
                            ? '⏳ অ্যাডমিন পেমেন্ট অ্যাপ্রুভালের অপেক্ষায়'
                            : '⏳ Pending Admin Payment Approval'}
                        </span>
                        <h3 className="text-base font-extrabold mt-2">
                          {isBn ? bk.nutritionistNameBn : bk.nutritionistNameEn}
                        </h3>
                        <p className="text-xs opacity-70">
                          {isBn ? 'রোগী:' : 'Patient:'} {bk.patientName} • {bk.appointmentDate} ({bk.appointmentSlot})
                        </p>
                      </div>
                      <div className="text-right font-black text-sm text-teal-600">৳{bk.consultationFeeBdt}</div>
                    </div>

                    <p className="text-xs opacity-80 p-3 rounded-2xl bg-black/5 dark:bg-white/5">
                      {bk.healthConcern}
                    </p>

                    {isApproved ? (
                      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                          🎥 {isBn ? 'পুষ্টিবিদের সাথে সরাসরি কথা বলার লিংক প্রস্তুত:' : 'Direct Google Meet Consultation Ready:'}
                        </div>
                        <a
                          href={bk.googleMeetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs inline-flex items-center justify-center gap-2 shadow-md"
                        >
                          <Video className="w-4 h-4" />
                          <span>{isBn ? 'Google Meet-এ জয়েন করুন' : 'Join Google Meet'}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ) : (
                      <div className="text-[11px] opacity-65 italic">
                        {isBn
                          ? 'নোট: অ্যাডমিন প্যানেল আপনার পেমেন্ট (TrxID: ' +
                            bk.transactionId +
                            ') অ্যাপ্রুভ করার সাথে সাথে এখানে Google Meet লিংক চালু হবে এবং পুষ্টিবিদের প্রোফাইলে বুকিংটি দেখা যাবে।'
                          : `Note: Once Admin approves your payment (TrxID: ${bk.transactionId}), the Google Meet link will activate here and on the Nutritionist's dashboard.`}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: NUTRITIONIST PORTAL (ONLY SHOWS ADMIN-APPROVED BOOKINGS!) */}
      {activeTab === 'nutritionist_portal' && (
        <div className="space-y-6">
          <div
            className={`p-6 rounded-3xl border-2 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              darkMode
                ? 'bg-emerald-950/30 border-emerald-500/40'
                : 'bg-emerald-50/80 border-emerald-300'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-2xl shadow-md">
                🔔
              </div>
              <div>
                <h2 className="text-lg font-extrabold">
                  {isBn
                    ? `আজকে আপনার ${confirmedNutritionistBookings.length}টি কনফার্মড বুকিং আছে!`
                    : `You Have ${confirmedNutritionistBookings.length} Confirmed Consultation Booking(s) Today!`}
                </h2>
                <p className="text-xs opacity-75">
                  {isBn
                    ? 'অ্যাডমিন প্যানেল থেকে রোগীর পেমেন্ট ভেরিফাই ও অ্যাপ্রুভ হওয়ার পরই কেবল এই তালিকাটি পুষ্টিবিদের প্রোফাইলে প্রদর্শিত হয়।'
                    : 'Appointments appear here strictly AFTER the Admin Panel verifies and approves the patient payment.'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {confirmedNutritionistBookings.map((bk) => (
              <div
                key={bk.id}
                className={`p-6 rounded-3xl border-2 space-y-4 ${
                  darkMode ? 'bg-slate-900 border-teal-500/40' : 'bg-white border-teal-300 shadow-md'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-600 dark:text-emerald-300">
                      {isBn ? '🔔 আজকে বুকিং আছে • পেমেন্ট অ্যাপ্রুভড' : '🔔 Today Booking • Payment Approved'}
                    </span>
                    <h3 className="text-base font-extrabold mt-2">
                      {isBn ? 'রোগী:' : 'Patient:'} {bk.patientName}
                    </h3>
                    <p className="text-xs opacity-70">
                      📞 {bk.patientPhone} • ✉️ {bk.patientEmail}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-extrabold text-teal-600 dark:text-teal-400">
                      {bk.appointmentDate}
                    </div>
                    <div className="text-sm font-black">{bk.appointmentSlot}</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs">
                  <span className="font-bold opacity-70">{isBn ? 'রোগীর সমস্যা: ' : 'Chief Complaint: '}</span>
                  <span>{bk.healthConcern}</span>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <span className="text-[11px] font-bold opacity-70">
                    {isBn ? 'পুষ্টিবিদ:' : 'Assigned To:'} {isBn ? bk.nutritionistNameBn : bk.nutritionistNameEn}
                  </span>

                  <a
                    href={bk.googleMeetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs inline-flex items-center gap-2 shadow-lg"
                  >
                    <Video className="w-4 h-4" />
                    <span>{isBn ? 'Google Meet-এ রোগীর সাথে কথা বলুন' : 'Start Google Meet Consult'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: REGISTER AS NUTRITIONIST / REQUEST FEATURED DIETITIAN */}
      {activeTab === 'register' && (
        <div
          className={`max-w-2xl mx-auto p-6 md:p-8 rounded-[32px] border shadow-xl ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          {regSubmitted ? (
            <div className="text-center py-8 space-y-4">
              <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto" />
              <h3 className="text-xl font-extrabold">
                {isBn
                  ? 'আপনার পুষ্টিবিদ প্রোফাইল ও ফিচার্ড ডায়েটিশিয়ান আবেদন অ্যাডমিন প্যানেলে জমা হয়েছে!'
                  : 'Your Dietitian Profile & Featured Request Has Been Sent to the Admin Panel!'}
              </h3>
              <p className="text-xs opacity-75 max-w-md mx-auto">
                {isBn
                  ? 'অ্যাডমিন আপনার বিএমডিসি/লাইসেন্স যাচাই করে অ্যাপ্রুভ করলেই আপনার প্রোফাইলটি পুষ্টিবিদ হাবে এবং ফিচার্ড ডায়েটিশিয়ান তালিকায় যুক্ত হবে।'
                  : 'Once Admin verifies and approves your profile, you will appear in the Featured Dietitian showcase.'}
              </p>
              <button
                onClick={() => {
                  setRegSubmitted(false);
                  setActiveTab('browse');
                }}
                className="px-6 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-extrabold"
              >
                {isBn ? 'পুষ্টিবিদ তালিকায় ফিরে যান' : 'Back to Directory'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleRegisterNutritionist} className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <PlusCircle className="w-6 h-6 text-teal-500" />
                <div>
                  <h3 className="text-lg font-extrabold">
                    {isBn
                      ? 'পুষ্টিবিদ / ডায়েটিশিয়ান হিসেবে প্রোফাইল যুক্ত করুন'
                      : 'Register as a Clinical Nutritionist / Featured Dietitian'}
                  </h3>
                  <p className="text-xs opacity-65">
                    {isBn
                      ? 'অ্যাডমিন প্যানেল অ্যাপ্রুভ করলে রোগীরা আপনার শিডিউল বুক করতে এবং Google Meet-এ পরামর্শ নিতে পারবে।'
                      : 'Approved profiles receive patient bookings and Google Meet consultations.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold opacity-75">
                    {isBn ? 'পূর্ণ নাম (বাংলায়) *' : 'Full Name (Bangla) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={regNameBn}
                    onChange={(e) => setRegNameBn(e.target.value)}
                    placeholder="যেমন: ডা. তাসনিমা চৌধুরী"
                    className={`w-full p-3 rounded-xl border text-xs mt-1 ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold opacity-75">
                    {isBn ? 'পূর্ণ নাম (ইংরেজিতে)' : 'Full Name (English)'}
                  </label>
                  <input
                    type="text"
                    value={regNameEn}
                    onChange={(e) => setRegNameEn(e.target.value)}
                    placeholder="e.g. Dr. Tasnima Chowdhury"
                    className={`w-full p-3 rounded-xl border text-xs mt-1 ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold opacity-75">
                    {isBn ? 'ইমেইল *' : 'Email *'}
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="doctor@example.com"
                    className={`w-full p-3 rounded-xl border text-xs mt-1 ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold opacity-75">
                    {isBn ? 'বিএমডিসি / ডায়েটিশিয়ান রেজিস্ট্রেশন নম্বর *' : 'BMDC / Registration Number *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={regLicense}
                    onChange={(e) => setRegLicense(e.target.value)}
                    placeholder="BMDC-XXXXX / BNDC-XXXX"
                    className={`w-full p-3 rounded-xl border text-xs mt-1 ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold opacity-75">
                    {isBn ? 'বিশেষজ্ঞতা (Specialty)' : 'Specialty'}
                  </label>
                  <input
                    type="text"
                    value={regSpecialtyBn}
                    onChange={(e) => setRegSpecialtyBn(e.target.value)}
                    className={`w-full p-3 rounded-xl border text-xs mt-1 ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold opacity-75">
                    {isBn ? 'চেম্বার / হাসপাতাল' : 'Institution / Hospital'}
                  </label>
                  <input
                    type="text"
                    value={regInstitutionBn}
                    onChange={(e) => setRegInstitutionBn(e.target.value)}
                    placeholder="যেমন: স্কয়ার হাসপাতাল, ঢাকা"
                    className={`w-full p-3 rounded-xl border text-xs mt-1 ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold opacity-75">
                    {isBn ? 'কনসালটেশন ফি (৳ BDT)' : 'Consultation Fee (৳ BDT)'}
                  </label>
                  <input
                    type="number"
                    value={regFee}
                    onChange={(e) => setRegFee(e.target.value)}
                    className={`w-full p-3 rounded-xl border text-xs mt-1 ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold opacity-75">
                    {isBn ? 'আপনার Google Meet রুম লিংক' : 'Your Google Meet Room Link'}
                  </label>
                  <input
                    type="url"
                    value={regMeetUrl}
                    onChange={(e) => setRegMeetUrl(e.target.value)}
                    placeholder="https://meet.google.com/xxx-xxxx-xxx"
                    className={`w-full p-3 rounded-xl border text-xs mt-1 ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              <label className="flex items-center gap-2.5 p-3.5 rounded-2xl border border-amber-500/40 bg-amber-500/10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={regWantFeatured}
                  onChange={(e) => setRegWantFeatured(e.target.checked)}
                  className="w-4 h-4 accent-amber-500"
                />
                <span className="text-xs font-extrabold">
                  {isBn
                    ? '🌟 আমাকে "ফিচার্ড ডায়েটিশিয়ান (Featured Dietitian)" হিসেবে তালিকাভুক্ত করার জন্য অ্যাডমিনের কাছে আবেদন করুন'
                    : '🌟 Request Admin to list me as a "Featured Dietitian"'}
                </span>
              </label>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg"
              >
                {isBn ? 'অ্যাডমিন অনুমোদনের জন্য জমা দিন' : 'Submit for Admin Approval'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* BOOKING + MANUAL PAYMENT MODAL */}
      {selectedNutritionist && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedNutritionist(null)} />
          <div
            className={`relative w-full max-w-xl rounded-[32px] border-2 p-6 md:p-8 shadow-2xl my-8 ${
              darkMode ? 'bg-slate-900 border-teal-500/40 text-white' : 'bg-white border-teal-300 text-slate-900'
            }`}
          >
            <button
              onClick={() => setSelectedNutritionist(null)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-3xl">
                {selectedNutritionist.avatarEmoji}
              </div>
              <div>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-500">
                  {isBn ? 'অ্যাপয়েন্টমেন্ট ও ম্যানুয়াল পেমেন্ট' : 'Appointment & Manual Payment'}
                </span>
                <h3 className="text-lg font-extrabold mt-0.5">
                  {isBn ? selectedNutritionist.fullNameBn : selectedNutritionist.fullNameEn}
                </h3>
                <p className="text-xs font-bold text-amber-500">
                  {isBn ? 'কনসালটেশন ফি:' : 'Consultation Fee:'} ৳{selectedNutritionist.consultationFeeBdt} (bKash/Nagad: 01711-009988)
                </p>
              </div>
            </div>

            <form onSubmit={handleBookSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold opacity-75">
                    {isBn ? 'রোগীর নাম *' : 'Patient Name *'}
                  </label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border text-xs mt-1 ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold opacity-75">
                    {isBn ? 'রোগীর ইমেইল *' : 'Patient Email *'}
                  </label>
                  <input
                    type="email"
                    value={patientEmail}
                    onChange={(e) => setPatientEmail(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border text-xs mt-1 ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold opacity-75">
                    {isBn ? 'মোবাইল নম্বর *' : 'Mobile Number *'}
                  </label>
                  <input
                    type="text"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className={`w-full p-2.5 rounded-xl border text-xs mt-1 ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold opacity-75">
                    {isBn ? 'তারিখ নির্বাচন করুন *' : 'Appointment Date *'}
                  </label>
                  <input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border text-xs mt-1 ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold opacity-75">
                  {isBn ? 'সময় (Time Slot) নির্বাচন করুন' : 'Select Time Slot'}
                </label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedNutritionist.availableSlots.map((slot) => (
                    <button
                      type="button"
                      key={slot}
                      onClick={() => setAppointmentSlot(slot)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                        appointmentSlot === slot
                          ? 'bg-teal-600 text-white border-teal-600'
                          : darkMode
                          ? 'bg-slate-800 border-slate-700'
                          : 'bg-slate-100 border-slate-200'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold opacity-75">
                  {isBn ? 'আপনার শারীরিক সমস্যা / পরামর্শের বিষয়' : 'Health Concern / Chief Complaint'}
                </label>
                <textarea
                  rows={2}
                  value={healthConcern}
                  onChange={(e) => setHealthConcern(e.target.value)}
                  placeholder={isBn ? 'যেমন: ডায়াবেটিস, থাইরয়েড বা গর্ভকালীন ডায়েট...' : 'Describe your health goal...'}
                  className={`w-full p-2.5 rounded-xl border text-xs mt-1 ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              {/* Manual Payment Fields */}
              <div
                className={`p-4 rounded-2xl border space-y-3 ${
                  darkMode ? 'bg-slate-800/70 border-slate-700' : 'bg-amber-50/60 border-amber-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold">
                    💳 {isBn ? 'ম্যানুয়াল পেমেন্ট তথ্য (অ্যাডমিন অ্যাপ্রুভালের জন্য)' : 'Manual Payment Details'}
                  </span>
                  <span className="text-xs font-black text-amber-600">৳{selectedNutritionist.consultationFeeBdt}</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {(['bkash', 'nagad', 'rocket', 'bank'] as PaymentMethodType[]).map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={`py-1.5 rounded-lg text-[11px] font-black uppercase border ${
                        paymentMethod === m
                          ? 'bg-amber-500 text-slate-950 border-amber-500'
                          : darkMode
                          ? 'bg-slate-900 border-slate-700'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={senderNumber}
                    onChange={(e) => setSenderNumber(e.target.value)}
                    placeholder={isBn ? 'প্রেরকের নম্বর (017XXXXXXXX) *' : 'Sender Number *'}
                    className={`w-full p-2.5 rounded-xl border text-xs ${
                      darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'
                    }`}
                  />
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder={isBn ? 'ট্রানজেকশন আইডি (TrxID) *' : 'Transaction ID (TrxID) *'}
                    className={`w-full p-2.5 rounded-xl border text-xs font-mono uppercase ${
                      darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'
                    }`}
                  />
                </div>
              </div>

              {bookingError && <p className="text-xs text-red-500 font-bold">{bookingError}</p>}

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg"
              >
                {isBn
                  ? 'বুকিং ও পেমেন্ট অ্যাডমিন প্যানেলে জমা দিন'
                  : 'Submit Booking & Payment for Admin Approval'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NutritionistHubView;
