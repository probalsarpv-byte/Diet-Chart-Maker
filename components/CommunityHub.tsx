
import React, { useState } from 'react';
import { CommunityPost, HealthProfile, Language, Phase } from '../types';
import { translations } from '../i18n';

interface Props {
  profile: HealthProfile;
  currentPhase: Phase;
  lang: Language;
  darkMode?: boolean;
}

const CommunityHub: React.FC<Props> = ({ profile, currentPhase, lang, darkMode }) => {
  const t = translations[lang];
  const [posts, setPosts] = useState<CommunityPost[]>([
    {
      id: '1',
      author: 'Aria S.',
      dosha: 'Pitta',
      phase: 2,
      experience: lang === 'hi' ? "चरण 2 मेरे पेट के स्वास्थ्य के लिए अद्भुत रहा है। सूजन 80% कम हो गई है! मैं इस स्तर पर सभी को अदरक के पानी की सलाह देती हूँ।" : 
                  lang === 'es' ? "La Fase 2 ha sido increíble para mi salud intestinal. ¡La hinchazón bajó un 80%! Recomiendo agua con jengibre a todos en esta etapa." : 
                  lang === 'bn' ? "ধাপ ২ আমার হজমের জন্য দারুণ কাজ করেছে। পেট ফাঁপা ৮০% কমেছে! এই পর্যায়ে সবাইকে আদা জল খাওয়ার পরামর্শ দিচ্ছি।" :
                  "Phase 2 has been amazing for my gut health. Bloating is down by 80%! Recommending the ginger-infused water to everyone in this stage.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      likes: 12,
      comments: [
        { id: 'c1', author: 'Dr. Holistic', text: lang === 'hi' ? "यह उत्कृष्ट प्रगति है! पित्त-आधारित पाचन गर्मी को शांत करने के लिए अदरक एकदम सही है।" : "That's excellent progress! Ginger is perfect for calming Pitta-based digestive heat.", timestamp: new Date() }
      ]
    },
    {
      id: '2',
      author: 'Raj K.',
      dosha: 'Vata',
      phase: 1,
      experience: lang === 'hi' ? "चरण 1 डिटॉक्स शुरू कर रहा हूँ। आज ऊर्जा थोड़ी कम लग रही है, क्या यह सामान्य है?" : "Starting Phase 1 Detox. Feeling a bit low energy today, is this normal during the alkaline shift?",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
      likes: 8,
      comments: [
        { id: 'c2', author: 'Aria S.', text: lang === 'hi' ? "हिम्मत मत हारो राज! पहले 3 दिन सबसे कठिन होते हैं।" : "Hang in there Raj! The first 3 days are the hardest, but the clarity afterward is worth it.", timestamp: new Date() }
      ]
    }
  ]);

  const [newPost, setNewPost] = useState('');
  const [commentText, setCommentText] = useState<Record<string, string>>({});

  const handlePost = () => {
    if (!newPost.trim()) return;
    const post: CommunityPost = {
      id: Date.now().toString(),
      author: 'You',
      dosha: profile.dosha,
      phase: currentPhase,
      experience: newPost,
      timestamp: new Date(),
      likes: 0,
      comments: []
    };
    setPosts([post, ...posts]);
    setNewPost('');
  };

  const handleLike = (postId: string) => {
    setPosts(posts.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
  };

  const handleComment = (postId: string) => {
    const text = commentText[postId];
    if (!text || !text.trim()) return;
    
    setPosts(posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: [...p.comments, {
            id: Date.now().toString(),
            author: 'You',
            text: text,
            timestamp: new Date()
          }]
        };
      }
      return p;
    }));
    setCommentText({ ...commentText, [postId]: '' });
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
      {/* Post Creator */}
      <div className={`p-6 rounded-3xl border transition-colors duration-300 ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
      }`}>
        <h3 className={`font-bold text-lg mb-4 italic ${darkMode ? 'text-white' : 'text-slate-900'}`}>{t.share_exp}</h3>
        <textarea
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder={t.post_placeholder.replace('{phase}', currentPhase.toString())}
          className={`w-full p-4 rounded-2xl text-sm border focus:ring-2 focus:ring-emerald-500 outline-none transition-colors ${
            darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-100 placeholder-slate-400'
          }`}
          rows={3}
        />
        <div className="mt-4 flex justify-end">
          <button
            onClick={handlePost}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95"
          >
            {t.post}
          </button>
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-6">
        {posts.map(post => (
          <div key={post.id} className={`p-6 rounded-3xl border transition-all ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
          }`}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex gap-3 items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${
                  darkMode ? 'bg-slate-800 text-emerald-400' : 'bg-slate-100 text-emerald-600'
                }`}>
                  {post.author[0]}
                </div>
                <div>
                  <h4 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-slate-900'}`}>{post.author === 'You' ? (lang === 'hi' ? 'आप' : lang === 'es' ? 'Tú' : lang === 'bn' ? 'আপনি' : 'You') : post.author}</h4>
                  <div className="flex gap-2 text-[10px] font-bold uppercase tracking-tighter opacity-60">
                    <span className={darkMode ? 'text-emerald-400' : 'text-emerald-600'}>{post.dosha}</span>
                    <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>{t.phase} {post.phase}</span>
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">
                {new Date(post.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
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
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.42 4.58a5.4 5.4 0 0 0-7.63 0L12 5.37l-.79-.79a5.4 5.4 0 0 0-7.63 7.63L12 20.5l8.42-8.29a5.4 5.4 0 0 0 0-7.63z"/></svg>
                {t.nourish} ({post.likes})
              </button>
              <button className={`flex items-center gap-2 text-xs font-bold transition-colors ${
                  darkMode ? 'text-slate-400 hover:text-blue-400' : 'text-slate-500 hover:text-blue-600'
                }`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                {t.comment} ({post.comments.length})
              </button>
            </div>

            {/* Comments */}
            <div className="space-y-4">
              {post.comments.map(comment => (
                <div key={comment.id} className={`p-4 rounded-2xl text-xs flex gap-3 ${
                  darkMode ? 'bg-slate-800/50' : 'bg-slate-50'
                }`}>
                  <div className="font-bold text-emerald-500 flex-shrink-0">{comment.author === 'You' ? (lang === 'hi' ? 'आप' : lang === 'es' ? 'Tú' : lang === 'bn' ? 'আপনি' : 'You') : comment.author}:</div>
                  <div className={darkMode ? 'text-slate-400' : 'text-slate-600'}>{comment.text}</div>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentText[post.id] || ''}
                  onChange={(e) => setCommentText({ ...commentText, [post.id]: e.target.value })}
                  placeholder={t.feedback_placeholder}
                  className={`flex-1 p-3 rounded-xl text-xs border outline-none transition-all ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-100'
                  }`}
                  onKeyPress={(e) => e.key === 'Enter' && handleComment(post.id)}
                />
                <button
                  onClick={() => handleComment(post.id)}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl font-bold text-xs"
                >
                  {t.send}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommunityHub;
