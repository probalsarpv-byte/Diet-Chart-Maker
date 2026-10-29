import React, { useState } from 'react';
import { Language, PaymentMethodType, User } from '../types';
import { submitManualPayment } from '../services/platformHubService';
import { CheckCircle2, CreditCard, Mail, ShieldCheck, Sparkles, X } from 'lucide-react';

interface Props {
  onSubscribe: () => void;
  onClose: () => void;
  lang: Language;
  darkMode?: boolean;
  featureName?: string;
  user?: User | null;
}

const PLANS = [
  {
    id: 'monthly',
    nameBn: '১ মাস প্রিমিয়াম প্ল্যান (Monthly Pro)',
    nameEn: '1 Month Premium Plan (Monthly Pro)',
    amountBdt: 499,
    badgeBn: 'জনপ্রিয়',
    badgeEn: 'Popular',
  },
  {
    id: '6months',
    nameBn: '৬ মাস প্রিমিয়াম ক্লিনিক্যাল প্ল্যান (6 Months Pro)',
    nameEn: '6 Months Clinical Pro Plan',
    amountBdt: 1299,
    badgeBn: 'সেরা সাশ্রয়',
    badgeEn: 'Best Value',
  },
  {
    id: 'yearly',
    nameBn: '১ বছর ফ্যামিলি ও পার্সোনাল প্রো (Yearly Pro)',
    nameEn: '1 Year Personal & Family Pro',
    amountBdt: 2499,
    badgeBn: 'ফুল অ্যাক্সেস',
    badgeEn: 'Full Access',
  },
];

const PAYMENT_NUMBERS: Record<PaymentMethodType, { label: string; number: string; color: string }> = {
  bkash: { label: 'bKash (বিকাশ মার্চেন্ট/সেন্ড মানি)', number: '01711-009988', color: 'from-pink-600 to-rose-600' },
  nagad: { label: 'Nagad (নগদ সেন্ড মানি)', number: '01819-009988', color: 'from-orange-500 to-amber-600' },
  rocket: { label: 'Rocket (রকেট)', number: '01911-009988-7', color: 'from-purple-600 to-indigo-600' },
  bank: { label: 'Bank Transfer (সিটি ব্যাংক / ডাচ-বাংলা)', number: 'A/C: 1402938471001 (Precision Nutrition)', color: 'from-emerald-600 to-teal-600' },
};

const PaywallModal: React.FC<Props> = ({ onClose, lang, darkMode, featureName, user }) => {
  const isBn = lang === 'bn';

  const [selectedPlan, setSelectedPlan] = useState(PLANS[1]);
  const [method, setMethod] = useState<PaymentMethodType>('bkash');
  const [userName, setUserName] = useState(user?.name || '');
  const [userEmail, setUserEmail] = useState(user?.email || '');
  const [senderNumber, setSenderNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim() || !senderNumber.trim() || !transactionId.trim()) {
      setErrorMsg(
        isBn
          ? 'অনুগ্রহ করে আপনার নাম, ইমেইল, প্রেরকের নম্বর এবং ট্রানজেকশন আইডি (TrxID) পূরণ করুন।'
          : 'Please fill in your Name, Email, Sender Number, and Transaction ID (TrxID).'
      );
      return;
    }

    submitManualPayment({
      userId: user?.id || `USR-${Math.floor(1000 + Math.random() * 9000)}`,
      userName: userName.trim(),
      userEmail: userEmail.trim(),
      paymentType: 'subscription',
      planName: isBn ? selectedPlan.nameBn : selectedPlan.nameEn,
      amountBdt: selectedPlan.amountBdt,
      method,
      senderNumber: senderNumber.trim(),
      transactionId: transactionId.trim().toUpperCase(),
      notes: notes.trim() || (featureName ? `Requested for: ${featureName}` : undefined),
    });

    setErrorMsg('');
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div
        className={`relative w-full max-w-2xl rounded-[36px] overflow-hidden shadow-2xl border-2 my-8 ${
          darkMode ? 'bg-slate-900 border-amber-500/40 text-white' : 'bg-white border-amber-400 text-slate-900'
        }`}
      >
        {/* Top Header */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 p-6 md:p-8 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shadow-lg">
              👑
            </div>
            <div>
              <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/25 text-amber-100">
                <Sparkles className="w-3 h-3" />
                {isBn ? 'ম্যানুয়াল পেমেন্ট ও প্রিমিয়াম সাবস্ক্রিপশন ফর্ম' : 'Manual Payment & Premium Subscription Form'}
              </span>
              <h2 className="text-xl md:text-2xl font-extrabold mt-1">
                {isBn ? 'প্রিমিয়াম সাবস্ক্রিপশন অ্যাক্টিভেশন' : 'Activate Premium Subscription'}
              </h2>
              <p className="text-xs text-amber-50/90 mt-0.5">
                {isBn
                  ? 'পেমেন্ট ফর্মটি পূরণ করলে তা অ্যাডমিন প্যানেলে যাবে। অ্যাডমিন অ্যাপ্রুভ করার সাথে সাথে আপনার ইমেইলে কনফার্মেশন মেইল যাবে।'
                  : 'Submit your payment details below. Once approved by the Admin Panel, you will receive an approval confirmation email.'}
              </p>
            </div>
          </div>
        </div>

        {submitted ? (
          <div className="p-8 md:p-10 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-11 h-11" />
            </div>

            <div className="space-y-2">
              <span className="px-3.5 py-1 rounded-full text-xs font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                {isBn ? 'অ্যাডমিন প্যানেলে জমা হয়েছে' : 'Sent to Admin Panel Queue'}
              </span>
              <h3 className="text-2xl font-extrabold">
                {isBn
                  ? 'আপনার পেমেন্ট তথ্য সফলভাবে অ্যাডমিন প্যানেলে পাঠানো হয়েছে!'
                  : 'Your Payment Details Have Been Sent to the Admin Panel!'}
              </h3>
              <p className="text-xs md:text-sm opacity-75 max-w-lg mx-auto leading-relaxed">
                {isBn
                  ? `ট্রানজেকশন আইডি (${transactionId.toUpperCase()}) যাচাই করে অ্যাডমিন প্যানেল থেকে অ্যাপ্রুভ করার সাথে সাথে আপনার "${userEmail}" ইমেইলে একটি কনফার্মেশন মেইল যাবে যে আপনি এখন প্রিমিয়াম সাবস্ক্রাইবার।`
                  : `Once Admin verifies Transaction ID (${transactionId.toUpperCase()}) and approves it, an email will be sent to "${userEmail}" confirming that you are now a Premium Subscriber.`}
              </p>
            </div>

            <div
              className={`p-5 rounded-2xl border text-left text-xs space-y-2 max-w-md mx-auto ${
                darkMode ? 'bg-slate-800/70 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex justify-between">
                <span className="opacity-60">{isBn ? 'প্ল্যান:' : 'Plan:'}</span>
                <span className="font-bold">{isBn ? selectedPlan.nameBn : selectedPlan.nameEn}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">{isBn ? 'পরিমাণ:' : 'Amount:'}</span>
                <span className="font-extrabold text-amber-500">৳{selectedPlan.amountBdt}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">{isBn ? 'পেমেন্ট মাধ্যম:' : 'Method:'}</span>
                <span className="font-bold uppercase">{method}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">{isBn ? 'ইমেইল নোটিফিকেশন:' : 'Notification Email:'}</span>
                <span className="font-bold text-emerald-500">{userEmail}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg"
            >
              {isBn ? 'ঠিক আছে, ফিরে যান' : 'Done & Close'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmitPayment} className="p-6 md:p-8 space-y-6">
            {/* Step 1: Choose Plan */}
            <div className="space-y-2.5">
              <label className="text-xs font-extrabold uppercase tracking-wider opacity-75">
                {isBn ? '১. প্রিমিয়াম সাবস্ক্রিপশন প্ল্যান নির্বাচন করুন' : '1. Select Subscription Plan'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PLANS.map((plan) => {
                  const active = selectedPlan.id === plan.id;
                  return (
                    <button
                      type="button"
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        active
                          ? 'border-amber-500 bg-amber-500/10 shadow-md'
                          : darkMode
                          ? 'border-slate-800 bg-slate-800/50 hover:border-slate-700'
                          : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300">
                        {isBn ? plan.badgeBn : plan.badgeEn}
                      </span>
                      <div className="font-extrabold text-xs mt-2 leading-snug">
                        {isBn ? plan.nameBn : plan.nameEn}
                      </div>
                      <div className="text-xl font-black text-amber-500 mt-1">৳{plan.amountBdt}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Payment Method */}
            <div className="space-y-2.5">
              <label className="text-xs font-extrabold uppercase tracking-wider opacity-75">
                {isBn ? '২. পেমেন্ট মাধ্যম নির্বাচন করুন (ম্যানুয়াল পেমেন্ট)' : '2. Choose Manual Payment Method'}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(['bkash', 'nagad', 'rocket', 'bank'] as PaymentMethodType[]).map((m) => (
                  <button
                    type="button"
                    key={m}
                    onClick={() => setMethod(m)}
                    className={`py-2.5 px-3 rounded-xl font-extrabold text-xs uppercase border-2 transition-all ${
                      method === m
                        ? `bg-gradient-to-r ${PAYMENT_NUMBERS[m].color} text-white border-transparent shadow-md`
                        : darkMode
                        ? 'bg-slate-800 border-slate-700 text-slate-300'
                        : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <div
                className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                  darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-amber-50/80 border-amber-200'
                }`}
              >
                <div>
                  <span className="opacity-70">{PAYMENT_NUMBERS[method].label}: </span>
                  <span className="font-mono font-black text-sm text-amber-600 dark:text-amber-400">
                    {PAYMENT_NUMBERS[method].number}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  {isBn ? `প্রদেয় টাকা: ৳${selectedPlan.amountBdt}` : `Payable: ৳${selectedPlan.amountBdt}`}
                </span>
              </div>
            </div>

            {/* Step 3: User & Transaction Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold opacity-75">
                  {isBn ? 'আপনার পূর্ণ নাম *' : 'Your Full Name *'}
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder={isBn ? 'আপনার নাম লিখুন' : 'Enter your name'}
                  className={`w-full p-3 rounded-xl border text-xs font-medium outline-none focus:border-amber-500 ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold opacity-75 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{isBn ? 'ইমেইল (অ্যাপ্রুভাল মেইল পাওয়ার জন্য) *' : 'Email (For Approval Mail) *'}</span>
                </label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className={`w-full p-3 rounded-xl border text-xs font-medium outline-none focus:border-amber-500 ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold opacity-75">
                  {isBn ? 'যে নম্বর থেকে টাকা পাঠিয়েছেন (Sender Number) *' : 'Sender Mobile / Account No *'}
                </label>
                <input
                  type="text"
                  value={senderNumber}
                  onChange={(e) => setSenderNumber(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className={`w-full p-3 rounded-xl border text-xs font-medium outline-none focus:border-amber-500 ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold opacity-75">
                  {isBn ? 'ট্রানজেকশন আইডি (Transaction ID / TrxID) *' : 'Transaction ID (TrxID) *'}
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="e.g. BKX94M28LP"
                  className={`w-full p-3 rounded-xl border text-xs font-mono font-bold uppercase outline-none focus:border-amber-500 ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold opacity-75">
                {isBn ? 'অতিরিক্ত নোট (ঐচ্ছিক)' : 'Additional Note (Optional)'}
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={isBn ? 'কোনো মন্তব্য থাকলে লিখুন...' : 'Any note for admin...'}
                className={`w-full p-3 rounded-xl border text-xs outline-none focus:border-amber-500 ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold">
                {errorMsg}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 text-[11px] opacity-75">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  {isBn
                    ? 'অ্যাডমিন প্যানেল অ্যাপ্রুভ করলেই আপনার ইমেইলে প্রিমিয়াম কনফার্মেশন মেইল যাবে।'
                    : 'Admin approval automatically sends your Premium confirmation email.'}
                </span>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-xl flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>{isBn ? 'পেমেন্ট ডিটেইলস জমা দিন' : 'Submit Payment Details'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default PaywallModal;
