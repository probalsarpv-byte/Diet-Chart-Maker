
import React, { useState, useRef, useEffect } from 'react';
import { HealthProfile, Language, GutAnalysisResult } from '../types';
import { translations } from '../i18n';
import { GeminiService } from '../services/geminiService';

interface Props {
  profile: HealthProfile;
  lang: Language;
  darkMode?: boolean;
}

const GutSoundAnalyzer: React.FC<Props> = ({ profile, lang, darkMode }) => {
  const t = translations[lang];
  const gemini = new GeminiService();
  
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const [result, setResult] = useState<GutAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' }); // Typically webm/ogg in browsers
        
        // Convert to Base64
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          const base64data = (reader.result as string).split(',')[1];
          await analyzeAudio(base64data);
        };

        // Stop tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setTimeLeft(10);
      visualizeAudio(stream);

    } catch (err) {
      console.error(err);
      setError("Microphone access denied. Please enable permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  };

  const analyzeAudio = async (base64Audio: string) => {
    setIsAnalyzing(true);
    try {
      const data = await gemini.analyzeGutSound(base64Audio, profile, lang);
      setResult(data);
    } catch (e) {
      setError("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    let interval: any;
    if (isRecording && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRecording) {
      stopRecording();
    }
    return () => clearInterval(interval);
  }, [isRecording, timeLeft]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
    };
  }, []);

  const visualizeAudio = (stream: MediaStream) => {
    if (!canvasRef.current) return;
    
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = audioContextRef.current.createMediaStreamSource(stream);
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 256;
    source.connect(analyserRef.current);

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyserRef.current!.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;
        ctx.fillStyle = darkMode ? `rgb(${barHeight + 100}, 50, 200)` : `rgb(${barHeight + 100}, 100, 150)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };

    draw();
  };

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-in slide-in-from-bottom duration-500 pb-32 px-4">
      {/* Header */}
      <div className={`p-10 rounded-[40px] border shadow-sm text-center ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-4xl mb-4 shadow-xl ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
          🩺
        </div>
        <h2 className={`text-3xl font-bold serif italic mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{t.gut_analyzer_title || "Gut Sound Analyzer"}</h2>
        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          {t.gut_analyzer_subtitle || "Record post-meal stomach sounds for microbiome analysis."}
        </p>
      </div>

      {/* Main Interface */}
      <div className={`relative p-8 rounded-[40px] border shadow-2xl flex flex-col items-center justify-center min-h-[400px] overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        
        {/* Error Message */}
        {error && (
           <div className="absolute top-6 left-6 right-6 bg-red-100 text-red-600 p-4 rounded-2xl text-center text-sm font-bold animate-pulse">
             {error}
           </div>
        )}

        {!result ? (
          <>
            {/* Visualizer Canvas */}
            <canvas 
                ref={canvasRef} 
                width="300" 
                height="100" 
                className={`absolute bottom-20 opacity-50 transition-opacity ${isRecording ? 'opacity-100' : 'opacity-0'}`} 
            />

            {/* Timer Ring */}
            <div className="relative">
                <svg className="w-64 h-64 transform -rotate-90">
                    <circle
                        cx="128"
                        cy="128"
                        r="120"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className={darkMode ? 'text-slate-800' : 'text-slate-100'}
                    />
                    {isRecording && (
                        <circle
                            cx="128"
                            cy="128"
                            r="120"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={753}
                            strokeDashoffset={753 - (753 * (10 - timeLeft)) / 10}
                            className="text-indigo-500 transition-all duration-1000 ease-linear"
                        />
                    )}
                </svg>
                
                {/* Record Button */}
                <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isAnalyzing}
                    className={`absolute inset-4 rounded-full flex flex-col items-center justify-center transition-all ${
                        isRecording 
                            ? 'bg-red-500 animate-pulse' 
                            : isAnalyzing 
                                ? 'bg-indigo-400 cursor-wait' 
                                : 'bg-indigo-600 hover:bg-indigo-500 shadow-xl hover:scale-105 active:scale-95'
                    }`}
                >
                    {isAnalyzing ? (
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                            <span className="text-white text-xs font-black uppercase tracking-widest">{t.analyzing}</span>
                        </div>
                    ) : isRecording ? (
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-4xl font-mono font-bold text-white">{timeLeft}s</span>
                            <span className="text-white/80 text-[10px] font-black uppercase tracking-widest">{t.recording}</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-5xl text-white">🎙️</span>
                            <span className="text-white text-xs font-black uppercase tracking-widest">{t.tap_record}</span>
                        </div>
                    )}
                </button>
            </div>
            <p className={`mt-8 text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                {isRecording ? t.hold_phone : t.quiet_env}
            </p>
          </>
        ) : (
          <div className="w-full space-y-8 animate-in zoom-in duration-500">
             {/* Score Display */}
             <div className="text-center">
                <div className={`inline-block px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-4 ${
                    result.status === 'Healthy' ? 'bg-emerald-100 text-emerald-700' :
                    result.status === 'Hyperactive' ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
                }`}>
                    {result.status}
                </div>
                <div className="text-7xl font-black mb-2" style={{ color: result.score > 80 ? '#10b981' : result.score > 50 ? '#f59e0b' : '#3b82f6' }}>
                    {result.score}
                </div>
                <p className={`text-xs font-bold uppercase tracking-widest opacity-50 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{t.gut_score}</p>
             </div>

             {/* Details Card */}
             <div className={`p-6 rounded-3xl border text-left space-y-4 ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">{t.gut_analysis}</h4>
                    <p className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{result.description}</p>
                </div>
                <div className={`p-4 rounded-2xl ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2">{t.ayur_rec}</h4>
                    <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{result.recommendation}</p>
                </div>
             </div>

             <button 
               onClick={() => { setResult(null); setError(null); }}
               className="w-full py-4 rounded-2xl font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
             >
               {t.record_again}
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GutSoundAnalyzer;
