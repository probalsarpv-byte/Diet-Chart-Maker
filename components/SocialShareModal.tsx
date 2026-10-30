import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  X,
  Sparkles,
  MessageCircle,
  Globe,
  Send,
} from 'lucide-react';
import { Language } from '../types';
import { triggerHapticFeedback } from '../services/alarmAndHapticsService';

export interface SharePayload {
  titleBn: string;
  titleEn: string;
  badgeBn: string;
  badgeEn: string;
  summaryBn: string;
  summaryEn: string;
  highlights?: Array<{ label: string; value: string }>;
  shareTextBn: string;
  shareTextEn: string;
  shareUrl?: string;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  payload: SharePayload | null;
  lang: Language;
  darkMode?: boolean;
}

export const SocialShareModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  payload,
  lang,
  darkMode = false,
}) => {
  const [copied, setCopied] = useState(false);
  const isBn = lang === 'bn';

  if (!isOpen || !payload) return null;

  const shareUrl =
    payload.shareUrl ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://precision-nutrition.app');
  const fullText = `${isBn ? payload.shareTextBn : payload.shareTextEn}\n🔗 ${shareUrl}`;
  const encodedText = encodeURIComponent(fullText);
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedQuote = encodeURIComponent(isBn ? payload.shareTextBn : payload.shareTextEn);

  const whatsappHref = `https://wa.me/?text=${encodedText}`;
  const facebookHref = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedQuote}`;
  const telegramHref = `https://t.me/share/url?url=${encodedUrl}&text=${encodedQuote}`;
  const twitterHref = `https://twitter.com/intent/tweet?text=${encodedText}`;

  const handleCopy = async () => {
    triggerHapticFeedback('item_check');
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = fullText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    triggerHapticFeedback('item_check');
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: isBn ? payload.titleBn : payload.titleEn,
          text: isBn ? payload.shareTextBn : payload.shareTextEn,
          url: shareUrl,
        });
      } catch {
        // User cancelled or blocked by iframe policy
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg rounded-[32px] border-2 p-6 shadow-2xl space-y-5 relative ${
          darkMode
            ? 'bg-slate-900 border-emerald-500/40 text-white'
            : 'bg-white border-emerald-200 text-slate-900'
        }`}
      >
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {isBn ? payload.badgeBn : payload.badgeEn}
              </span>
              <h3 className="text-base md:text-lg font-black mt-1 leading-snug">
                {isBn ? payload.titleBn : payload.titleEn}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Close share modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visual Share Card Preview */}
        <div
          className={`p-4 rounded-2xl border space-y-3 ${
            darkMode
              ? 'bg-gradient-to-br from-emerald-950/60 via-slate-800 to-teal-950/50 border-emerald-500/30'
              : 'bg-gradient-to-br from-emerald-50 via-white to-teal-50/70 border-emerald-200'
          }`}
        >
          <p className="text-xs md:text-sm font-bold leading-relaxed">
            {isBn ? payload.summaryBn : payload.summaryEn}
          </p>

          {payload.highlights && payload.highlights.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {payload.highlights.map((h, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-xl text-center border ${
                    darkMode
                      ? 'bg-slate-900/80 border-slate-700'
                      : 'bg-white border-emerald-100 shadow-2xs'
                  }`}
                >
                  <span className="text-[10px] font-bold opacity-65 block">{h.label}</span>
                  <span className="text-xs md:text-sm font-black text-emerald-600 dark:text-emerald-400">
                    {h.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div
            className={`p-3 rounded-xl text-[11px] font-mono whitespace-pre-wrap leading-relaxed border ${
              darkMode
                ? 'bg-slate-950/70 border-slate-800 text-slate-300'
                : 'bg-slate-50 border-slate-200/80 text-slate-700'
            }`}
          >
            {isBn ? payload.shareTextBn : payload.shareTextEn}
          </div>
        </div>

        {/* Social Media Platform Buttons (WhatsApp, Facebook, Telegram, X) */}
        <div className="space-y-2.5">
          <div className="text-[11px] font-black uppercase tracking-wider opacity-65">
            {isBn
              ? 'সোশ্যাল মিডিয়ায় শেয়ার করুন (Share to Social Media):'
              : 'Share Directly to Social Platforms:'}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => triggerHapticFeedback('item_check')}
              className="py-3 px-3 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>WhatsApp</span>
            </a>

            <a
              href={facebookHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => triggerHapticFeedback('item_check')}
              className="py-3 px-3 rounded-2xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
            >
              <Globe className="w-4 h-4" />
              <span>Facebook</span>
            </a>

            <a
              href={telegramHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => triggerHapticFeedback('item_check')}
              className="py-3 px-3 rounded-2xl bg-[#0088cc] hover:bg-[#0077b5] text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>Telegram</span>
            </a>

            <a
              href={twitterHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => triggerHapticFeedback('item_check')}
              className="py-3 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>X / Post</span>
            </a>
          </div>
        </div>

        {/* Bottom Actions: Copy Text & Native Share */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleCopy}
            className={`flex-1 py-3 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 border transition-all active:scale-95 ${
              copied
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg'
                : darkMode
                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                : 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>
              {copied
                ? isBn
                  ? '✓ টেক্সট কপি হয়েছে! (এখন যেকোনো অ্যাপে পেস্ট করুন)'
                  : '✓ Copied to Clipboard!'
                : isBn
                ? 'শেয়ার টেক্সট কপি করুন'
                : 'Copy Share Text'}
            </span>
          </button>

          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="py-3 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>{isBn ? 'অন্যান্য অ্যাপে শেয়ার' : 'More Apps'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SocialShareModal;
