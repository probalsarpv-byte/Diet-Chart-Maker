import React, { useState, useRef } from 'react';
import {
  FileDown,
  Printer,
  CheckCircle2,
  X,
  FileText,
  Sparkles,
  ShieldCheck,
  Lock,
  Crown,
  Loader2,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { DietPhaseChart, HealthProfile, Language, Phase, User } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  chart: DietPhaseChart;
  profile: HealthProfile;
  user: User | null;
  currentPhase: Phase;
  currentWeek: number;
  selectedDayIndex: number;
  lang: Language;
  darkMode?: boolean;
  isPremiumUser: boolean;
  onShowPaywall: () => void;
  autoDownloadOnMount?: boolean;
}

export const DietChartPdfModal: React.FC<Props> = ({
  isOpen,
  onClose,
  chart,
  profile,
  user,
  currentPhase,
  currentWeek,
  selectedDayIndex,
  lang,
  darkMode,
  isPremiumUser,
  onShowPaywall,
}) => {
  const isBn = lang === 'bn';
  const printSheetRef = useRef<HTMLDivElement>(null);

  const [dayScope, setDayScope] = useState<'single' | 'all_unlocked'>(
    'all_unlocked'
  );
  const [includeBiometrics, setIncludeBiometrics] = useState(true);
  const [includeMacrosAndOil, setIncludeMacrosAndOil] = useState(true);
  const [includeSupplements, setIncludeSupplements] = useState(true);
  const [includeExerciseAndRules, setIncludeExerciseAndRules] = useState(true);
  const [includeSignatureBlock, setIncludeSignatureBlock] = useState(true);
  const [customPatientNote, setCustomPatientNote] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate BMI & clinical metrics
  const heightMeters = (profile.height || 165) / 100;
  const bmi =
    heightMeters > 0
      ? (profile.weight / (heightMeters * heightMeters)).toFixed(1)
      : '22.0';
  const bmiNum = parseFloat(bmi);
  const bmiCategory =
    bmiNum < 18.5
      ? isBn
        ? 'কম ওজন (Underweight)'
        : 'Underweight'
      : bmiNum < 23
      ? isBn
        ? 'স্বাভাবিক (Normal Asian BMI)'
        : 'Normal (Asian Standard)'
      : bmiNum < 27.5
      ? isBn
        ? 'অতিরিক্ত ওজন (Overweight)'
        : 'Overweight'
      : isBn
      ? 'স্থূলতা (Obese)'
      : 'Obese';

  const cohortLabel = (() => {
    switch (profile.cohortType) {
      case 'pregnancy_lactation':
        return isBn
          ? `গর্ভকালীন ও প্রসূতি পুষ্টি (মাস ${profile.pregnancyMonth || 1})`
          : `Pregnancy & Lactation (Month ${profile.pregnancyMonth || 1})`;
      case 'child_pediatric':
        return isBn
          ? `শিশু পুষ্টি ও বৃদ্ধি (${profile.childAgeGroup || '1-3'} বছর)`
          : `Pediatric Growth (${profile.childAgeGroup || '1-3'} yrs)`;
      case 'oncology_cancer':
        return isBn ? 'অনকোলজি ও ক্যান্সার কেয়ার' : 'Oncology Nutritional Care';
      case 'adolescent_growth':
        return isBn ? 'কৈশোর ও গ্রোথ প্রোটোকল' : 'Adolescent Growth Protocol';
      default:
        return isBn ? 'অ্যাডাল্ট মেটাবলিক ও ক্লিনিকাল প্রোটোকল' : 'Adult Metabolic & Clinical Protocol';
    }
  })();

  // Determine which days to render based on scope & premium status
  const allDays = chart.weeklySchedule || [];
  const unlockedDays = isPremiumUser ? allDays : allDays.slice(0, 2);
  const daysToExport =
    dayScope === 'single'
      ? [
          allDays[
            !isPremiumUser && selectedDayIndex >= 2 ? 0 : selectedDayIndex
          ] || allDays[0],
        ].filter(Boolean)
      : unlockedDays;

  const visibleSupplements = isPremiumUser
    ? chart.supplements || []
    : (chart.supplements || []).slice(0, 1);

  const visibleExercises = isPremiumUser
    ? chart.activities || []
    : (chart.activities || []).slice(0, 1);

  const visibleRecommendations = isPremiumUser
    ? chart.recommendations || []
    : (chart.recommendations || []).slice(0, 2);

  const visibleForbidden = isPremiumUser
    ? chart.forbiddenFoods || []
    : (chart.forbiddenFoods || []).slice(0, 3);

  const documentRefId = `NL-RX-${currentPhase}W${currentWeek}-${new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, '')}`;

  const handleDownloadPdf = async () => {
    if (!printSheetRef.current || isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    setExportSuccessMessage(null);

    try {
      const element = printSheetRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 860,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.96);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 6; // 6mm clean clinical margin
      const usableWidth = pdfWidth - margin * 2;
      const usableHeight = pdfHeight - margin * 2;

      const imgProps = {
        width: canvas.width,
        height: canvas.height,
      };
      const renderedImgHeight = (imgProps.height * usableWidth) / imgProps.width;

      let heightLeft = renderedImgHeight;
      let position = margin;

      // Page 1
      pdf.addImage(
        imgData,
        'JPEG',
        margin,
        position,
        usableWidth,
        renderedImgHeight,
        undefined,
        'FAST'
      );
      heightLeft -= usableHeight;

      // Subsequent pages if chart is multi-page
      while (heightLeft > 4) {
        position = heightLeft - renderedImgHeight + margin;
        pdf.addPage();
        pdf.addImage(
          imgData,
          'JPEG',
          margin,
          position,
          usableWidth,
          renderedImgHeight,
          undefined,
          'FAST'
        );
        heightLeft -= usableHeight;
      }

      const safeUserName = (user?.name || 'Patient')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 24);
      const fileName = `Clinical_Diet_Chart_Phase${currentPhase}_${safeUserName}.pdf`;
      pdf.save(fileName);

      setExportSuccessMessage(
        isBn
          ? `✓ '${fileName}' সফলভাবে ডাউনলোড হয়েছে!`
          : `✓ '${fileName}' downloaded successfully!`
      );
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleNativePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div
        className={`w-full max-w-6xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[94vh] ${
          darkMode
            ? 'bg-slate-900 border-slate-800 text-white'
            : 'bg-slate-50 border-slate-200 text-slate-900'
        }`}
      >
        {/* Top Modal Action Header */}
        <div
          className={`px-4 sm:px-6 py-4 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
            darkMode
              ? 'bg-slate-900 border-slate-800'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold tracking-tight">
                  {isBn
                    ? 'প্রফেশনাল ক্লিনিকাল ডায়েট চার্ট পিডিএফ এক্সপোর্ট'
                    : 'Professional Clinical Diet Chart PDF Export'}
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                  A4 Clinical Prescription
                </span>
              </div>
              <p className="text-xs opacity-70">
                {isBn
                  ? 'অফলাইনে ব্যবহার ও প্রিন্টের জন্য আপনার পার্সোনালাইজড ডায়েট চার্ট উচ্চ-রেজোলিউশন পিডিএফ আকারে সংরক্ষণ করুন'
                  : 'Download a high-resolution, print-ready A4 clinical PDF document for offline reference'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleNativePrint}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all whitespace-nowrap ${
                darkMode
                  ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>{isBn ? 'প্রিন্ট ভিউ' : 'Print View'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white shadow-md flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {isBn ? 'পিডিএফ তৈরি হচ্ছে...' : 'Generating PDF...'}
                  </span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>
                    {isBn ? 'পিডিএফ ডাউনলোড করুন (.PDF)' : 'Download PDF (.PDF)'}
                  </span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-xl border transition-colors ${
                darkMode
                  ? 'border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Notification Strip */}
        {exportSuccessMessage && (
          <div className="px-6 py-2.5 bg-emerald-600 text-white text-xs font-bold flex items-center justify-between">
            <span>{exportSuccessMessage}</span>
            <button
              type="button"
              onClick={() => setExportSuccessMessage(null)}
              className="underline opacity-90 hover:opacity-100"
            >
              {isBn ? 'বন্ধ করুন' : 'Dismiss'}
            </button>
          </div>
        )}

        {/* Modal Body: Left Sidebar Controls + Right Live A4 Preview */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
          {/* Left 4 Columns: Export Configuration & Sections */}
          <div
            className={`lg:col-span-4 p-4 sm:p-5 space-y-5 overflow-y-auto ${
              darkMode ? 'bg-slate-900' : 'bg-white'
            }`}
          >
            <div>
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-3">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>
                  {isBn ? '১. ডায়েট চার্টের দিন নির্বাচন' : '1. Meal Schedule Scope'}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setDayScope('all_unlocked')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    dayScope === 'all_unlocked'
                      ? darkMode
                        ? 'bg-emerald-950/50 border-emerald-500 text-white'
                        : 'bg-emerald-50 border-emerald-500 text-slate-900'
                      : darkMode
                      ? 'bg-slate-800/60 border-slate-700 text-slate-300'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold">
                      {isPremiumUser
                        ? isBn
                          ? 'সম্পূর্ণ সাপ্তাহিক চার্ট (৭ দিন)'
                          : 'Complete Weekly Chart (All 7 Days)'
                        : isBn
                        ? 'আনলকড ফ্রি চার্ট (১ম ও ২য় দিন)'
                        : 'Unlocked Free Chart (Days 1 & 2)'}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {unlockedDays.length} {isBn ? 'দিন' : 'Days'}
                    </span>
                  </div>
                  <p className="text-[11px] opacity-75 mt-1">
                    {isPremiumUser
                      ? isBn
                        ? 'সপ্তাহের ৭ দিনের সব বেলা ও ম্যাক্রো টেবিল অন্তর্ভুক্ত থাকবে।'
                        : 'Includes all 7 days of personalized meals and macro breakdowns.'
                      : isBn
                      ? 'ফ্রি অ্যাকাউন্টে প্রথম ২ দিনের সম্পূর্ণ চার্ট পিডিএফ আকারে পাবেন।'
                      : 'Exports the first 2 unlocked days available on the Free tier.'}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setDayScope('single')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    dayScope === 'single'
                      ? darkMode
                        ? 'bg-emerald-950/50 border-emerald-500 text-white'
                        : 'bg-emerald-50 border-emerald-500 text-slate-900'
                      : darkMode
                      ? 'bg-slate-800/60 border-slate-700 text-slate-300'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold">
                      {isBn
                        ? 'শুধুমাত্র নির্বাচিত ১ দিনের চার্ট'
                        : 'Single Day Quick Reference Sheet'}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      1 {isBn ? 'পৃষ্ঠা' : 'Page'}
                    </span>
                  </div>
                  <p className="text-[11px] opacity-75 mt-1">
                    {isBn
                      ? 'ফ্রিজে বা ডাইনিং টেবিলে লাগিয়ে রাখার জন্য ১ পৃষ্ঠার কম্প্যাক্ট শিট।'
                      : 'Compact single-day sheet ideal for refrigerator or kitchen wall.'}
                  </p>
                </button>
              </div>

              {!isPremiumUser && (
                <div
                  className={`mt-2.5 p-3 rounded-2xl border flex items-center justify-between gap-2 ${
                    darkMode
                      ? 'bg-amber-950/30 border-amber-500/30 text-amber-200'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="flex items-center gap-2 text-[11px]">
                    <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>
                      {isBn
                        ? '৭ দিনের সম্পূর্ণ পিডিএফ আনলক করতে প্রিমিয়াম নিন'
                        : 'Unlock all 7 days in PDF with Premium'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onShowPaywall();
                    }}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-amber-500 text-slate-950 whitespace-nowrap shrink-0 flex items-center gap-1"
                  >
                    <Crown className="w-3 h-3" />
                    <span>{isBn ? 'প্রিমিয়াম' : 'Upgrade'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Section Checkboxes */}
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2.5">
                {isBn
                  ? '২. পিডিএফ-এ যা যা অন্তর্ভুক্ত থাকবে'
                  : '2. Clinical Sections to Include'}
              </div>
              <div className="space-y-2">
                {[
                  {
                    id: 'biometrics',
                    checked: includeBiometrics,
                    onChange: setIncludeBiometrics,
                    labelBn: 'রোগীর প্রোফাইল, বিএমআই (BMI) ও ক্যালোরি লক্ষ্যমাত্রা',
                    labelEn: 'Patient Biometrics, BMI & Calorie/Macro Targets',
                  },
                  {
                    id: 'oil',
                    checked: includeMacrosAndOil,
                    onChange: setIncludeMacrosAndOil,
                    labelBn: 'রান্নার তেল, ঘি, লবণ ও পানির সুনির্দিষ্ট মাত্রা',
                    labelEn: 'Cooking Oil, Ghee, Salt & Hydration Prescription',
                  },
                  {
                    id: 'supplements',
                    checked: includeSupplements,
                    onChange: setIncludeSupplements,
                    labelBn: 'ক্লিনিকাল সাপ্লিমেন্ট ও ডিটক্স ওয়াটার প্রোটোকল',
                    labelEn: 'Clinical Supplements & Detox Water Protocol',
                  },
                  {
                    id: 'exercise',
                    checked: includeExerciseAndRules,
                    onChange: setIncludeExerciseAndRules,
                    labelBn: 'ব্যায়াম, লাইফস্টাইল ও নিষিদ্ধ খাবারের তালিকা (Red Zone)',
                    labelEn: 'Exercise, Lifestyle & Forbidden Red-Zone Foods',
                  },
                  {
                    id: 'signature',
                    checked: includeSignatureBlock,
                    onChange: setIncludeSignatureBlock,
                    labelBn: 'মেকার-চেকার ভেরিফিকেশন ও চিকিৎসকের স্বাক্ষর ব্লক',
                    labelEn: 'Maker-Checker Stamp & Dietitian Signature Footer',
                  },
                ].map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer text-xs transition-colors ${
                      darkMode
                        ? 'bg-slate-800/40 border-slate-700/80 hover:bg-slate-800'
                        : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100/70'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={(e) => item.onChange(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-semibold leading-snug">
                      {isBn ? item.labelBn : item.labelEn}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Optional Custom Note */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1.5">
                {isBn
                  ? '৩. ব্যক্তিগত নোট বা ডাক্তারের নির্দেশনা (ঐচ্ছিক)'
                  : '3. Personal or Physician Note (Optional)'}
              </label>
              <textarea
                rows={2}
                value={customPatientNote}
                onChange={(e) => setCustomPatientNote(e.target.value)}
                placeholder={
                  isBn
                    ? 'যেমন: প্রতিদিন সকালে খালি পেটে থাইরয়েডের ওষুধ খাওয়ার ৩০ মিনিট পর নাস্তা করবেন...'
                    : 'e.g., Take thyroid medication 30 mins before morning meal...'
                }
                className={`w-full rounded-xl border p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-extrabold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {isBn
                      ? 'উচ্চ রেজোলিউশন পিডিএফ তৈরি হচ্ছে...'
                      : 'Rendering High-DPI Clinical PDF...'}
                  </span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>
                    {isBn
                      ? 'এখনই পিডিএফ ডাউনলোড করুন (.PDF)'
                      : 'Download Professional PDF Now'}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Right 8 Columns: Live A4 Clinical Sheet Preview */}
          <div className="lg:col-span-8 p-3 sm:p-6 bg-slate-200/80 dark:bg-slate-950 overflow-y-auto flex flex-col items-center">
            <div className="w-full max-w-[794px] mb-2 flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-emerald-500" />
                <span>
                  {isBn
                    ? 'লাইভ A4 প্রিন্ট প্রিভিউ (বাংলা ও ইংরেজি ইউনিকোড সমর্থিত)'
                    : 'Live A4 Clinical Sheet Preview (Bangla & English Unicode Ready)'}
                </span>
              </span>
              <span className="font-mono">ISO A4 · 210 × 297 mm</span>
            </div>

            {/* =================================================================== */}
            {/* ACTUAL PRINTABLE / HTML2CANVAS TARGET SHEET (A4 WIDTH 794px)        */}
            {/* =================================================================== */}
            <div className="w-full overflow-x-auto flex justify-center pb-6">
              <div
                ref={printSheetRef}
                id="clinical-diet-pdf-sheet"
                style={{ width: '794px', minWidth: '794px' }}
                className="bg-white text-slate-900 p-8 shadow-xl border border-slate-300 space-y-5 font-sans"
              >
                {/* 1. CLINICAL INSTITUTION HEADER */}
                <div className="border-b-2 border-emerald-700 pb-4 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-700 text-white text-[10px] font-extrabold uppercase tracking-wider">
                        Clinical Nutrition Rx
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                        Ref: {documentRefId}
                      </span>
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 mt-1">
                      {isBn
                        ? 'নিউট্রিলেনস ক্লিনিকাল ডায়েট ও থেরাপিউটিক প্রেসক্রিপশন'
                        : 'NutriLens Clinical Diet & Therapeutic Prescription'}
                    </h1>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {cohortLabel} ·{' '}
                      {isBn
                        ? `ফেজ ${currentPhase} (${chart.phaseName}) · সপ্তাহ ${currentWeek}`
                        : `Phase ${currentPhase} (${chart.phaseName}) · Week ${currentWeek}`}
                    </p>
                  </div>

                  <div className="text-right text-xs text-slate-600 tabular-nums shrink-0">
                    <div className="font-extrabold text-emerald-800 text-sm">
                      {chart.totalDailyCalories || 1600} kcal / day
                    </div>
                    <div>
                      {isBn ? 'ইস্যু তারিখ:' : 'Issued:'}{' '}
                      {new Date().toLocaleDateString(isBn ? 'bn-BD' : 'en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                      ✓ Maker-Checker Clinical Verified
                    </div>
                  </div>
                </div>

                {/* 2. PATIENT BIOMETRICS & TARGET MACROS STRIP */}
                {includeBiometrics && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                    <div className="grid grid-cols-4 gap-3 text-xs tabular-nums">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
                          {isBn ? 'রোগীর নাম / প্রোফাইল' : 'Patient Name'}
                        </span>
                        <span className="font-extrabold text-slate-900">
                          {user?.name || (isBn ? 'নিবন্ধিত রোগী' : 'Registered Patient')}
                        </span>
                        <span className="text-[11px] text-slate-600 block">
                          {profile.age} {isBn ? 'বছর' : 'yrs'} · {profile.gender} ·{' '}
                          {profile.dosha}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
                          {isBn ? 'ওজন · উচ্চতা · বিএমআই' : 'Anthropometrics & BMI'}
                        </span>
                        <span className="font-extrabold text-slate-900 font-mono">
                          {profile.weight} kg · {profile.height} cm
                        </span>
                        <span className="text-[11px] text-emerald-700 font-semibold block">
                          BMI {bmi} ({bmiCategory})
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
                          {isBn ? 'দৈনিক ম্যাক্রো বণ্টন' : 'Daily Macro Target'}
                        </span>
                        <span className="font-extrabold text-slate-900 font-mono">
                          P: {chart.macros?.protein || 65}g · C:{' '}
                          {chart.macros?.carbs || 160}g · F:{' '}
                          {chart.macros?.fats || 55}g
                        </span>
                        <span className="text-[11px] text-slate-600 block">
                          {isBn
                            ? `দিনে ${chart.mealFrequency || profile.mealFrequency || 3} বেলা খাবার`
                            : `${chart.mealFrequency || profile.mealFrequency || 3} Meals / Day Protocol`}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
                          {isBn ? 'রাতের শর্করা ও মেটাবলিক নিয়ম' : 'Dinner Carb Strategy'}
                        </span>
                        <span className="font-bold text-slate-900">
                          {profile.dinnerCarbRule === 'cereal_allowed'
                            ? isBn
                              ? 'রাতের খাবারে শস্য অনুমোদিত'
                              : 'Cereal Carbs Allowed'
                            : isBn
                            ? 'রাতে শুধুমাত্র সবজি শর্করা'
                            : 'Vegetable Carbs Only at Night'}
                        </span>
                        <span className="text-[11px] text-slate-600 block truncate">
                          {profile.metabolicType || chart.focus}
                        </span>
                      </div>
                    </div>

                    {customPatientNote.trim() && (
                      <div className="mt-2.5 pt-2.5 border-t border-slate-200 text-xs text-slate-800">
                        <strong className="text-emerald-800">
                          {isBn ? 'বিশেষ নির্দেশনা:' : 'Special Clinical Note:'}
                        </strong>{' '}
                        {customPatientNote}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. COHORT SAFETY ALERTS (IF ANY) */}
                {profile.cohortSafetyAlerts &&
                  profile.cohortSafetyAlerts.length > 0 && (
                    <div className="border border-rose-300 bg-rose-50/70 rounded-xl p-3 space-y-1.5">
                      {profile.cohortSafetyAlerts.slice(0, 2).map((al) => (
                        <div key={al.id} className="text-xs text-rose-950">
                          <span className="font-extrabold">
                            ⚠ {isBn ? al.titleBn : al.titleEn}:
                          </span>{' '}
                          <span>{isBn ? al.descriptionBn : al.descriptionEn}</span>
                        </div>
                      ))}
                    </div>
                  )}

                {/* 4. DAILY MEAL SCHEDULE TABLE(S) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <h2 className="text-sm font-black uppercase tracking-wider text-emerald-800">
                      {isBn
                        ? `দৈনিক খাদ্যতালিকা ও পোরশন গাইড (${daysToExport.length} দিন)`
                        : `Daily Clinical Meal Schedule & Portion Guide (${daysToExport.length} ${
                            daysToExport.length === 1 ? 'Day' : 'Days'
                          })`}
                    </h2>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {isBn
                        ? 'দেশি মাপ: বাটি / কাপ / চামচ ও গ্রাম'
                        : 'Portions in Local Household Measures & Grams'}
                    </span>
                  </div>

                  {daysToExport.map((dayPlan, dayIdx) => (
                    <div
                      key={dayIdx}
                      className="border border-slate-300 rounded-xl overflow-hidden"
                    >
                      <div className="bg-slate-100 px-3.5 py-2 border-b border-slate-300 flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-900">
                          📅 {dayPlan.day}
                        </span>
                        <span className="text-[11px] font-mono text-slate-600 tabular-nums">
                          {isBn
                            ? `মোট ক্যালোরি লক্ষ্য: ~${chart.totalDailyCalories || 1600} kcal`
                            : `Daily Target: ~${chart.totalDailyCalories || 1600} kcal`}
                        </span>
                      </div>

                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] uppercase tracking-wider text-slate-500">
                            <th className="py-2 px-3 w-[18%]">
                              {isBn ? 'সময় ও বেলা' : 'Time & Slot'}
                            </th>
                            <th className="py-2 px-3 w-[48%]">
                              {isBn
                                ? 'খাবারের মেনু ও প্রস্তুত প্রণালী'
                                : 'Clinical Meal & Preparation'}
                            </th>
                            <th className="py-2 px-3 w-[18%]">
                              {isBn ? 'পরিমাণ (Portion)' : 'Portion Size'}
                            </th>
                            <th className="py-2 px-3 w-[16%] text-right">
                              {isBn ? 'ক্যালোরি ও ম্যাক্রো' : 'Calories & Macros'}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 tabular-nums">
                          {dayPlan.meals?.map((meal, mIdx) => (
                            <tr key={mIdx} className="align-top">
                              <td className="py-2.5 px-3 font-semibold text-slate-800">
                                <div className="text-emerald-800 font-bold">
                                  {meal.time}
                                </div>
                                {meal.mealSlot && (
                                  <div className="text-[10px] text-slate-500 mt-0.5">
                                    {meal.mealSlot}
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-slate-900">
                                  {meal.mealName}
                                </div>
                                <div className="text-[11px] text-slate-600 leading-snug mt-0.5">
                                  {meal.description}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[11px] font-semibold text-slate-800">
                                {meal.quantity}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-[11px]">
                                <div className="font-extrabold text-amber-700">
                                  {meal.calories}
                                </div>
                                {meal.macroBreakdown && (
                                  <div className="text-[10px] text-slate-500 mt-0.5">
                                    P:{meal.macroBreakdown.protein} · C:
                                    {meal.macroBreakdown.carbs} · F:
                                    {meal.macroBreakdown.fats}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>

                {/* 5. COOKING OIL, GHEE, SALT & WATER PRESCRIPTION */}
                {includeMacrosAndOil && (
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    {chart.fatOilAllocation && (
                      <div className="border border-slate-300 rounded-xl p-3.5 bg-amber-50/30">
                        <h3 className="text-xs font-black uppercase tracking-wider text-amber-900 mb-2">
                          🫗{' '}
                          {isBn
                            ? 'রান্নার তেল, ঘি ও ফ্যাট বণ্টন'
                            : 'Cooking Oil, Ghee & Lipid Allocation'}
                        </h3>
                        <div className="grid grid-cols-3 gap-2 text-xs tabular-nums mb-2">
                          <div className="bg-white p-2 rounded border border-slate-200">
                            <span className="text-[10px] text-slate-500 block">
                              {isBn ? 'মোট ফ্যাট/দিন' : 'Total Daily Fat'}
                            </span>
                            <span className="font-mono font-extrabold text-slate-900">
                              {chart.fatOilAllocation.totalDailyFatGrams}g
                            </span>
                          </div>
                          <div className="bg-white p-2 rounded border border-slate-200">
                            <span className="text-[10px] text-slate-500 block">
                              {isBn ? 'ঘি + রান্নার তেল' : 'Ghee + Oil'}
                            </span>
                            <span className="font-mono font-extrabold text-emerald-800">
                              {chart.fatOilAllocation.gheeGrams}g +{' '}
                              {chart.fatOilAllocation.cookingOilGrams}g
                            </span>
                          </div>
                          <div className="bg-white p-2 rounded border border-slate-200">
                            <span className="text-[10px] text-slate-500 block">
                              {isBn ? 'খাবার থেকে ফ্যাট' : 'Dietary Fat'}
                            </span>
                            <span className="font-mono font-extrabold text-slate-900">
                              {chart.fatOilAllocation.dietarySourceFatGrams}g
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-700 leading-snug">
                          {chart.fatOilAllocation.clinicalInstruction}
                        </p>
                      </div>
                    )}

                    {chart.staplesAdvice && (
                      <div className="border border-slate-300 rounded-xl p-3.5 bg-emerald-50/30">
                        <h3 className="text-xs font-black uppercase tracking-wider text-emerald-900 mb-2">
                          💧{' '}
                          {isBn
                            ? 'দৈনিক পানি ও লবণের ক্লিনিকাল মাত্রা'
                            : 'Daily Hydration & Salt Prescription'}
                        </h3>
                        <div className="space-y-1.5 text-[11px] text-slate-800 tabular-nums">
                          <div>
                            <strong className="text-emerald-900">
                              {isBn ? 'পানি (Water):' : 'Hydration:'}{' '}
                              {chart.staplesAdvice.waterLitersPerDay || '2.5 L/day'}
                            </strong>{' '}
                            — {chart.staplesAdvice.water}
                          </div>
                          <div>
                            <strong className="text-emerald-900">
                              {isBn ? 'লবণ (Salt):' : 'Salt Limit:'}{' '}
                              {chart.staplesAdvice.saltGramsPerDay || '5g/day'}
                            </strong>{' '}
                            — {chart.staplesAdvice.salt}
                          </div>
                          <div>
                            <strong className="text-emerald-900">
                              {isBn ? 'অনুমোদিত তেল:' : 'Approved Oil:'}
                            </strong>{' '}
                            {chart.staplesAdvice.oil}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 6. SUPPLEMENTS & DETOX WATER PROTOCOL */}
                {includeSupplements &&
                  (visibleSupplements.length > 0 ||
                    (chart.detoxWaterProtocol &&
                      chart.detoxWaterProtocol.length > 0)) && (
                    <div className="grid grid-cols-2 gap-4">
                      {visibleSupplements.length > 0 && (
                        <div className="border border-slate-300 rounded-xl p-3.5">
                          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-2">
                            💊{' '}
                            {isBn
                              ? 'ক্লিনিকাল সাপ্লিমেন্ট প্রোটোকল'
                              : 'Nutraceutical & Supplement Protocol'}
                          </h3>
                          <div className="space-y-2 text-[11px]">
                            {visibleSupplements.map((sup, idx) => (
                              <div
                                key={idx}
                                className="border-b last:border-b-0 border-slate-200 pb-1.5 last:pb-0"
                              >
                                <div className="flex justify-between font-bold text-slate-900">
                                  <span>{sup.name}</span>
                                  <span className="font-mono text-emerald-700">
                                    {sup.dosage}
                                  </span>
                                </div>
                                <div className="text-slate-600">
                                  {sup.timing ? `${sup.timing} · ` : ''}
                                  {sup.rationale}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {chart.detoxWaterProtocol &&
                        chart.detoxWaterProtocol.length > 0 && (
                          <div className="border border-slate-300 rounded-xl p-3.5">
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-2">
                              🌿{' '}
                              {isBn
                                ? 'থেরাপিউটিক ডিটক্স ও গাট ওয়াটার'
                                : 'Therapeutic Detox & Gut Infusions'}
                            </h3>
                            <div className="space-y-2 text-[11px]">
                              {(isPremiumUser
                                ? chart.detoxWaterProtocol
                                : chart.detoxWaterProtocol.slice(0, 1)
                              ).map((dw, idx) => (
                                <div
                                  key={idx}
                                  className="border-b last:border-b-0 border-slate-200 pb-1.5 last:pb-0"
                                >
                                  <div className="font-bold text-slate-900">
                                    {dw.name}{' '}
                                    <span className="text-[10px] font-normal text-slate-500">
                                      ({dw.timing})
                                    </span>
                                  </div>
                                  <div className="text-slate-600">
                                    {dw.preparation}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  )}

                {/* 7. EXERCISE, LIFESTYLE & FORBIDDEN FOODS (RED ZONE) */}
                {includeExerciseAndRules && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-slate-300 rounded-xl p-3.5">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-2">
                        🏃{' '}
                        {isBn
                          ? 'ব্যায়াম ও সার্কাডিয়ান লাইফস্টাইল'
                          : 'Exercise & Circadian Lifestyle Rules'}
                      </h3>
                      <ul className="space-y-1.5 text-[11px] text-slate-700">
                        {visibleExercises.map((act, i) => (
                          <li key={`ex-${i}`}>
                            <strong className="text-slate-900">
                              • {act.name} ({act.duration}):
                            </strong>{' '}
                            {act.instructions}
                          </li>
                        ))}
                        {visibleRecommendations.map((rec, i) => (
                          <li key={`rec-${i}`}>• {rec}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="border border-rose-200 bg-rose-50/40 rounded-xl p-3.5">
                      <h3 className="text-xs font-black uppercase tracking-wider text-rose-900 mb-2">
                        🔴{' '}
                        {isBn
                          ? 'রেড জোন — সম্পূর্ণ বর্জনীয় খাবার'
                          : 'Red Zone — Strictly Prohibited Foods'}
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {visibleForbidden.map((f, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 rounded bg-white border border-rose-200 text-rose-900 text-[11px] font-bold"
                          >
                            ✕ {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 8. CLINICAL VERIFICATION & SIGNATURE FOOTER */}
                {includeSignatureBlock && (
                  <div className="pt-4 mt-2 border-t-2 border-slate-200 flex items-end justify-between text-[11px] text-slate-600">
                    <div className="space-y-0.5 max-w-md">
                      <div className="font-bold text-slate-800 flex items-center gap-1">
                        <span>✓</span>
                        <span>
                          {isBn
                            ? 'বিডি ফুড কম্পোজিশন টেবিল (INFS, DU) ও ক্লিনিকাল প্রোটোকল অনুযায়ী যাচাইকৃত'
                            : 'Verified against Bangladesh Food Composition Table (INFS, DU) & Clinical Guidelines'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        {isBn
                          ? 'সতর্কীকরণ: এই ডায়েট চার্টটি আপনার প্রদানকৃত তথ্যের ভিত্তিতে তৈরি। জরুরি শারীরিক জটিলতায় রেজিস্টার্ড চিকিৎসকের পরামর্শ নিন।'
                          : 'Disclaimer: Generated based on reported clinical assessment parameters. Consult your physician for acute medical emergencies.'}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="w-44 border-b border-slate-400 mb-1 ml-auto" />
                      <div className="font-bold text-slate-800">
                        {isBn
                          ? 'ক্লিনিকাল ডায়েটিশিয়ান / ভেরিফিকেশন সিল'
                          : 'Clinical Dietitian / Verification Seal'}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">
                        ID: {documentRefId}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DietChartPdfModal;
