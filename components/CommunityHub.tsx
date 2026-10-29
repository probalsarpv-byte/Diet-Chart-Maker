import React, { useState, useEffect } from 'react';
import { CommunityPost, HealthProfile, Language, Phase, User } from '../types';
import { translations } from '../i18n';
import {
  loadPlatformState,
  subscribePlatformState,
  savePlatformState,
  evaluateCommunityContentWithAI,
  reportCommunityContent,
} from '../services/platformHubService';
import { AlertTriangle, Ban, CheckCircle2, Flag, ShieldCheck, Sparkles, X } from 'lucide-react';

interface Props {
  profile: HealthProfile;
  currentPhase: Phase;
  lang: Language;
  darkMode?: boolean;
  user?: User | null;
}

const CommunityHub: React.FC<Props> = ({ profile, currentPhase, lang, darkMode, user }) => {
  const t = translations[lang];
  const isBn = lang === 'bn';

  const [hubState, setHubState] = useState(() => loadPlatformState());
  const [newPost, setNewPost] = useState('');
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [checkingAI, setCheckingAI] = useState(false);
  const [aiModerationAlert, setAiModerationAlert] = useState<string | null>(null);
  const [reportModal, setReportModal] = useState<{
    targetType: 'post' | 'comment';
    postId: string;
    commentId?: string;
    offenderName: string;
    offenderUserId?: string;
    offenderEmail?: string;
    contentSnippet: string;
  } | null>(null);
  const [reportReason, setReportReason] = useState(
    isBn
      ? 'অন্যকে ছোট করে মন্তব্য / অপমানজনক ভাষা (Demeaning or Abusive Comment)'
      : 'Demeaning or Abusive Comment'
  );
  const [reportSuccessToast, setReportSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    return subscribePlatformState((st) => {
      setHubState(st);
    });
  }, []);

  const currentAuthorName =
    user?.name || (isBn ? 'আপনি (সদস্য)' : 'You (Community Member)');

  const isCurrentUserBanned = hubState.bannedUsers.some(
    (b) =>
      (user?.id && b.userId === user.id) ||
      (user?.email && b.userEmail?.toLowerCase() === user.email.toLowerCase()) ||
      b.userName.toLowerCase() === currentAuthorName.toLowerCase()
  );

  const handlePost = async () => {
    if (!newPost.trim() || checkingAI) return;
    setCheckingAI(true);
    setAiModerationAlert(null);

    const check = await evaluateCommunityContentWithAI(
      newPost,
      currentAuthorName,
      'post',
      user?.id,
      user?.email
    );
    setCheckingAI(false);

    if (!check.allowed) {
      setAiModerationAlert(
        isBn
          ? check.reasonBn ||
              'AI Auto-Moderation: পুষ্টি ও স্বাস্থ্য বহির্ভূত বা ক্ষতিকর পোস্ট হওয়ায় এটি অটোমেটিক ডিলিট করা হয়েছে।'
          : check.reasonEn ||
              'AI Auto-Moderation: Post automatically deleted for violating community guidelines.'
      );
      setNewPost('');
      return;
    }

    const post: CommunityPost = {
      id: Date.now().toString(),
      author: currentAuthorName,
      authorId: user?.id,
      authorEmail: user?.email,
      dosha: profile.dosha || 'Balanced',
      phase: currentPhase,
      experience: newPost.trim(),
      timestamp: new Date().toISOString(),
      likes: 0,
      comments: [],
    };

    savePlatformState((prev) => ({
      ...prev,
      communityPosts: [post, ...prev.communityPosts],
    }));
    setNewPost('');
  };

  const handleLike = (postId: string) => {
    savePlatformState((prev) => ({
      ...prev,
      communityPosts: prev.communityPosts.map((p) =>
        p.id === postId ? { ...p, likes: p.likes + 1 } : p
      ),
    }));
  };

  const handleComment = async (postId: string) => {
    const text = commentText[postId];
    if (!text || !text.trim() || checkingAI) return;

    setCheckingAI(true);
    setAiModerationAlert(null);

    const check = await evaluateCommunityContentWithAI(
      text,
      currentAuthorName,
      'comment',
      user?.id,
      user?.email
    );
    setCheckingAI(false);

    if (!check.allowed) {
      setAiModerationAlert(
        isBn
          ? check.reasonBn ||
              'AI Auto-Moderation: আক্রমণাত্মক বা পুষ্টি বহির্ভূত কমেন্ট হওয়ায় AI এটি অটোমেটিক ডিলিট করেছে।'
          : check.reasonEn ||
              'AI Auto-Moderation: Comment automatically deleted by AI moderator.'
      );
      setCommentText({ ...commentText, [postId]: '' });
      return;
    }

    savePlatformState((prev) => ({
      ...prev,
      communityPosts: prev.communityPosts.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            comments: [
              ...p.comments,
              {
                id: `c-${Date.now()}`,
                author: currentAuthorName,
                authorId: user?.id,
                authorEmail: user?.email,
                text: text.trim(),
                timestamp: new Date().toISOString(),
              },
            ],
          };
        }
        return p;
      }),
    }));
    setCommentText({ ...commentText, [postId]: '' });
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportModal) return;

    reportCommunityContent({
      targetType: reportModal.targetType,
      postId: reportModal.postId,
      commentId: reportModal.commentId,
      offenderName: reportModal.offenderName,
      offenderUserId: reportModal.offenderUserId,
      offenderEmail: reportModal.offenderEmail,
      contentSnippet: reportModal.contentSnippet,
      reason: reportReason,
      reportedByName: currentAuthorName,
    });

    setReportModal(null);
    setReportSuccessToast(
      isBn
        ? '🚩 রিপোর্টটি অ্যাডমিন প্যানেলে পাঠানো হয়েছে। অ্যাডমিন এটি যাচাই করে ডিলিট এবং অভিযুক্ত ইউজারকে ব্যান করতে পারবেন।'
        : '🚩 Report sent to the Admin Panel. Admin can now review, delete content, and ban the user.'
    );
    setTimeout(() => setReportSuccessToast(null), 6000);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom duration-500 max-w-4xl mx-auto pb-20">
      {/* AI Auto-Moderation Shield Banner */}
      <div
        className={`p-4 md:p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          darkMode
            ? 'bg-gradient-to-r from-slate-900 via-purple-950/35 to-emerald-950/30 border-purple-500/30'
            : 'bg-gradient-to-r from-purple-50 via-white to-emerald-50 border-purple-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs md:text-sm font-extrabold">
                {isBn
                  ? '🤖 AI অটো-মডারেশন ও সেফ কমিউনিটি গার্ড সক্রিয়'
                  : '🤖 AI Auto-Moderation & Safe Community Guard Active'}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                24/7 Active
              </span>
            </div>
            <p className="text-[11px] opacity-75">
              {isBn
                ? 'পুষ্টি ও স্বাস্থ্য বহির্ভূত পোস্ট বা অশালীন মন্তব্য AI অটোমেটিক ডিলিট করে দেয়। এছাড়া যেকোনো আপত্তিকর কমেন্ট রিপোর্ট করলে অ্যাডমিন প্যানেল থেকে সেই ইউজারকে ব্যান করা হবে।'
                : 'Off-topic or harmful posts are automatically deleted by AI. You can also report any post/comment to the Admin Panel for user ban.'}
            </p>
          </div>
        </div>
      </div>

      {/* Banned User Notice */}
      {isCurrentUserBanned && (
        <div className="p-5 rounded-3xl bg-red-500/15 border-2 border-red-500/40 text-red-500 flex items-center gap-3">
          <Ban className="w-6 h-6 shrink-0" />
          <div className="text-xs font-extrabold">
            {isBn
              ? 'কমিউনিটি নীতিমালা লঙ্ঘনের কারণে অ্যাডমিন প্যানেল থেকে আপনার অ্যাকাউন্টটি ব্যান করা হয়েছে। আপনি নতুন পোস্ট বা কমেন্ট করতে পারবেন না।'
              : 'Your account has been banned by the Admin Panel for violating community standards.'}
          </div>
        </div>
      )}

      {/* AI Auto-Deleted Warning Alert */}
      {aiModerationAlert && (
        <div className="p-5 rounded-3xl bg-rose-500/15 border-2 border-rose-500/40 text-rose-600 dark:text-rose-300 flex items-start justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-rose-500">
                {isBn ? 'AI স্বয়ংক্রিয়ভাবে ব্লক ও ডিলিট করেছে' : 'Automatically Blocked & Deleted by AI'}
              </h4>
              <p className="text-xs font-bold mt-1">{aiModerationAlert}</p>
            </div>
          </div>
          <button onClick={() => setAiModerationAlert(null)} className="text-xs font-bold opacity-60 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Report Success Toast */}
      {reportSuccessToast && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{reportSuccessToast}</span>
          </div>
          <button onClick={() => setReportSuccessToast(null)}>✕</button>
        </div>
      )}

      {/* Post Creator */}
      <div
        className={`p-6 rounded-3xl border transition-colors duration-300 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
        }`}
      >
        <h3 className={`font-bold text-lg mb-3 italic ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          {t.share_exp}
        </h3>
        <textarea
          value={newPost}
          disabled={isCurrentUserBanned}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder={
            isBn
              ? 'আপনার ডায়েট অভিজ্ঞতা, সুস্থতার অগ্রগতি, দেশি খাবারের রেসিপি বা স্বাস্থ্য বিষয়ক প্রশ্ন শেয়ার করুন...'
              : t.post_placeholder.replace('{phase}', currentPhase.toString())
          }
          className={`w-full p-4 rounded-2xl text-sm border focus:ring-2 focus:ring-emerald-500 outline-none transition-colors ${
            darkMode
              ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
              : 'bg-slate-50 border-slate-100 placeholder-slate-400'
          }`}
          rows={3}
        />
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-[11px] opacity-60 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            {isBn
              ? 'AI প্রতিটি পোস্ট ভেরিফাই করে প্রকাশ করে'
              : 'Every post is verified by AI for nutrition relevance'}
          </span>
          <button
            onClick={handlePost}
            disabled={checkingAI || isCurrentUserBanned}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all shadow-lg active:scale-95"
          >
            {checkingAI ? (isBn ? 'AI যাচাই করছে...' : 'AI Checking...') : t.post}
          </button>
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-6">
        {hubState.communityPosts.map((post) => (
          <div
            key={post.id}
            className={`p-6 rounded-3xl border transition-all ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex gap-3 items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${
                    darkMode ? 'bg-slate-800 text-emerald-400' : 'bg-slate-100 text-emerald-600'
                  }`}
                >
                  {post.author[0]}
                </div>
                <div>
                  <h4 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {post.author}
                  </h4>
                  <div className="flex gap-2 text-[10px] font-bold uppercase tracking-tighter opacity-60">
                    <span className={darkMode ? 'text-emerald-400' : 'text-emerald-600'}>{post.dosha}</span>
                    <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>
                      {t.phase} {post.phase}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-500 font-medium">
                  {new Date(post.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <button
                  onClick={() =>
                    setReportModal({
                      targetType: 'post',
                      postId: post.id,
                      offenderName: post.author,
                      offenderUserId: post.authorId,
                      offenderEmail: post.authorEmail,
                      contentSnippet: post.experience,
                    })
                  }
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-rose-500 hover:bg-rose-500/10 flex items-center gap-1 transition-colors"
                  title={isBn ? 'অ্যাডমিনের কাছে রিপোর্ট করুন' : 'Report to Admin'}
                >
                  <Flag className="w-3 h-3" />
                  <span>{isBn ? 'রিপোর্ট' : 'Report'}</span>
                </button>
              </div>
            </div>

            <p className={`text-sm leading-relaxed mb-6 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              {post.experience}
            </p>

            <div className="flex gap-6 border-t border-slate-100 dark:border-slate-800 pt-4 mb-6">
              <button
                onClick={() => handleLike(post.id)}
                className={`flex items-center gap-2 text-xs font-bold transition-colors ${
                  darkMode ? 'text-slate-400 hover:text-emerald-400' : 'text-slate-500 hover:text-emerald-600'
                }`}
              >
                ❤️ {t.nourish} ({post.likes})
              </button>
              <span
                className={`flex items-center gap-2 text-xs font-bold ${
                  darkMode ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                💬 {t.comment} ({post.comments.length})
              </span>
            </div>

            {/* Comments */}
            <div className="space-y-3">
              {post.comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`p-3.5 rounded-2xl text-xs flex items-start justify-between gap-3 ${
                    darkMode ? 'bg-slate-800/50' : 'bg-slate-50'
                  }`}
                >
                  <div className="flex gap-2">
                    <span className="font-bold text-emerald-500 shrink-0">{comment.author}:</span>
                    <span className={darkMode ? 'text-slate-300' : 'text-slate-700'}>{comment.text}</span>
                  </div>

                  <button
                    onClick={() =>
                      setReportModal({
                        targetType: 'comment',
                        postId: post.id,
                        commentId: comment.id,
                        offenderName: comment.author,
                        offenderUserId: comment.authorId,
                        offenderEmail: comment.authorEmail,
                        contentSnippet: comment.text,
                      })
                    }
                    className="text-[10px] font-bold text-rose-500 hover:underline shrink-0 flex items-center gap-1"
                  >
                    <Flag className="w-3 h-3" />
                    <span>{isBn ? 'রিপোর্ট' : 'Report'}</span>
                  </button>
                </div>
              ))}

              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  disabled={isCurrentUserBanned}
                  value={commentText[post.id] || ''}
                  onChange={(e) => setCommentText({ ...commentText, [post.id]: e.target.value })}
                  placeholder={t.feedback_placeholder}
                  className={`flex-1 p-3 rounded-xl text-xs border outline-none transition-all ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-100'
                  }`}
                  onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
                />
                <button
                  onClick={() => handleComment(post.id)}
                  disabled={checkingAI || isCurrentUserBanned}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl font-bold text-xs"
                >
                  {t.send}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* REPORT TO ADMIN MODAL */}
      {reportModal && (
        <div className="fixed inset-0 z-[230] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-md rounded-[28px] border-2 p-6 space-y-4 shadow-2xl ${
              darkMode ? 'bg-slate-900 border-rose-500/40 text-white' : 'bg-white border-rose-300 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-500 font-extrabold text-sm">
                <Flag className="w-4 h-4" />
                <span>
                  {isBn ? 'অ্যাডমিন প্যানেলে রিপোর্ট পাঠান' : 'Report Content to Admin Panel'}
                </span>
              </div>
              <button onClick={() => setReportModal(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 text-xs italic">
              <strong>{reportModal.offenderName}:</strong> "{reportModal.contentSnippet}"
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-3">
              <label className="text-xs font-bold block">
                {isBn ? 'রিপোর্টের কারণ নির্বাচন করুন:' : 'Select Reason for Report:'}
              </label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className={`w-full p-3 rounded-xl border text-xs ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <option value="অন্যকে ছোট করে মন্তব্য / অপমানজনক ভাষা (Demeaning or Abusive Comment)">
                  {isBn
                    ? 'অন্যকে ছোট করে মন্তব্য / অপমানজনক ভাষা'
                    : 'Demeaning or Abusive Comment'}
                </option>
                <option value="পুষ্টি ও স্বাস্থ্য বহির্ভূত আজেবাজে পোস্ট (Off-topic / Spam)">
                  {isBn ? 'পুষ্টি ও স্বাস্থ্য বহির্ভূত আজেবাজে পোস্ট (Spam)' : 'Off-topic / Spam'}
                </option>
                <option value="ভুল বা ক্ষতিকর চিকিৎসা তথ্য (Misleading Medical Advice)">
                  {isBn ? 'ভুল বা ক্ষতিকর চিকিৎসা তথ্য' : 'Misleading Medical Advice'}
                </option>
              </select>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg"
              >
                {isBn ? 'অ্যাডমিন প্যানেলে রিপোর্ট জমা দিন' : 'Submit Report to Admin'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityHub;
