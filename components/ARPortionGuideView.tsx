
import React, { useState, useEffect, useRef } from 'react';
import { Language } from '../types';
import { translations } from '../i18n';

interface Props {
  lang: Language;
  darkMode?: boolean;
}

const ARPortionGuideView: React.FC<Props> = ({ lang, darkMode }) => {
  const t = translations[lang];
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFood, setSelectedFood] = useState('rice');
  const [scale, setScale] = useState(1); // To simulate depth/distance

  const foods = [
    { 
      id: 'rice', 
      label: t.ar_rice, 
      portion: '150g', 
      visual: 'tennis_ball', 
      color: '#f5f5f5', 
      desc: 'Size of a Tennis Ball',
      shape: (
        <svg viewBox="0 0 100 100" className="w-full h-full opacity-80 drop-shadow-2xl">
           <circle cx="50" cy="50" r="40" fill="white" stroke="#e5e7eb" strokeWidth="2" />
           {/* 3D shading effect */}
           <path d="M20 50 Q50 20 80 50" fill="none" stroke="#d1d5db" strokeWidth="1" opacity="0.5" />
           <path d="M25 60 Q50 90 75 60" fill="none" stroke="#d1d5db" strokeWidth="1" opacity="0.5" />
           <circle cx="65" cy="35" r="5" fill="white" opacity="0.8" />
        </svg>
      )
    },
    { 
      id: 'dal', 
      label: t.ar_dal, 
      portion: '200ml', 
      visual: 'bowl', 
      color: '#fbbf24', 
      desc: 'Small Bowl (Katori)',
      shape: (
         <svg viewBox="0 0 100 100" className="w-full h-full opacity-80 drop-shadow-2xl">
            <ellipse cx="50" cy="50" rx="45" ry="35" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />
            <ellipse cx="50" cy="50" rx="35" ry="25" fill="#fcd34d" />
            <path d="M30 40 Q50 60 70 40" fill="none" stroke="#fff" strokeWidth="2" opacity="0.6" />
         </svg>
      )
    },
    { 
      id: 'protein', 
      label: t.ar_protein, 
      portion: '100g', 
      visual: 'palm', 
      color: '#f87171', 
      desc: 'Deck of Cards / Palm',
      shape: (
        <svg viewBox="0 0 100 100" className="w-full h-full opacity-80 drop-shadow-2xl">
           <rect x="25" y="25" width="50" height="60" rx="5" fill="#f87171" stroke="#b91c1c" strokeWidth="2" />
           <rect x="30" y="30" width="40" height="50" rx="2" fill="#fca5a5" />
        </svg>
      )
    },
    { 
      id: 'veggies', 
      label: t.ar_veggies, 
      portion: '200g', 
      visual: 'hands', 
      color: '#4ade80', 
      desc: 'Two Cupped Hands',
      shape: (
        <svg viewBox="0 0 100 100" className="w-full h-full opacity-80 drop-shadow-2xl">
           <path d="M10 50 Q30 80 50 80 Q70 80 90 50 Q80 20 50 20 Q20 20 10 50 Z" fill="#4ade80" stroke="#15803d" strokeWidth="2" />
           <path d="M30 40 Q50 60 70 40" fill="none" stroke="#fff" strokeWidth="2" opacity="0.4" />
        </svg>
      )
    }
  ];

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setError(t.camera_error);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const currentFood = foods.find(f => f.id === selectedFood) || foods[0];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom duration-500 pb-32">
      {/* Header */}
      <div className={`p-8 rounded-[40px] border shadow-sm text-center ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <h2 className={`text-3xl font-bold serif italic mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{t.ar_title}</h2>
        <p className={`max-w-lg mx-auto ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          {t.ar_subtitle}
        </p>
      </div>

      <div className={`relative rounded-[40px] overflow-hidden shadow-2xl bg-black aspect-[3/4] md:aspect-video flex flex-col ${darkMode ? 'border border-slate-800' : 'border border-slate-200'}`}>
        {!stream ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-6">
             <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center">
               <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
             </div>
             {error ? (
                <p className="text-red-400 font-bold">{error}</p>
             ) : (
                <p className="text-slate-400 max-w-xs">{t.ar_instruction}</p>
             )}
             <button 
               onClick={startCamera}
               className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-lg active:scale-95"
             >
               {t.start_camera}
             </button>
          </div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="absolute inset-0 w-full h-full object-cover"
            />
            
            {/* AR Overlay Layer */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* Distance/Scale Guide Circle */}
              <div 
                 className="border-2 border-white/50 border-dashed rounded-full animate-pulse absolute"
                 style={{ width: `${300 * scale}px`, height: `${300 * scale}px`, transition: 'all 0.2s' }}
              />
              
              {/* Food 3D Projection Simulation */}
              <div 
                className="relative z-10 transition-all duration-300 drop-shadow-[0_20px_20px_rgba(0,0,0,0.5)]"
                style={{ width: `${200 * scale}px`, height: `${200 * scale}px` }}
              >
                {currentFood.shape}
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl text-white text-center min-w-[150px]">
                  <div className="font-bold text-lg leading-none">{currentFood.portion}</div>
                  <div className="text-[10px] uppercase font-bold opacity-80">{currentFood.desc}</div>
                </div>
              </div>
            </div>

            {/* Instruction Overlay */}
            <div className="absolute top-6 left-0 right-0 flex justify-center">
              <div className="bg-black/60 backdrop-blur-md px-6 py-2 rounded-full text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                 {t.align_plate}
              </div>
            </div>
            
            {/* Distance Slider */}
             <div className="absolute right-6 top-1/2 -translate-y-1/2 h-64 bg-black/40 backdrop-blur-md rounded-full w-12 flex flex-col items-center py-4 gap-2">
                <span className="text-[10px] text-white font-bold uppercase rotate-90 origin-center translate-y-2">Scale</span>
                <input 
                  type="range" 
                  min="0.5" 
                  max="1.5" 
                  step="0.05"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="h-full w-2 appearance-none bg-white/30 rounded-full outline-none vertical-slider"
                  style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                />
             </div>
          </>
        )}
      </div>

      {/* Controls */}
      <div className={`p-6 rounded-[32px] border overflow-x-auto scrollbar-hide ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
         <div className="flex gap-4 min-w-max px-2">
            {foods.map(food => (
              <button
                key={food.id}
                onClick={() => setSelectedFood(food.id)}
                className={`flex flex-col items-center gap-3 p-4 rounded-3xl min-w-[100px] transition-all border-2 ${
                  selectedFood === food.id 
                    ? (darkMode ? 'bg-slate-800 border-emerald-500' : 'bg-slate-50 border-emerald-500')
                    : (darkMode ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-100 hover:bg-slate-50')
                }`}
              >
                <div 
                  className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-xl font-bold transition-transform"
                  style={{ backgroundColor: food.color, transform: selectedFood === food.id ? 'scale(1.1)' : 'scale(1)' }}
                >
                  {/* Simple icon representation */}
                  {food.id === 'rice' && '🍚'}
                  {food.id === 'dal' && '🥘'}
                  {food.id === 'protein' && '🍗'}
                  {food.id === 'veggies' && '🥦'}
                </div>
                <div className="text-center">
                  <div className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{food.label}</div>
                  <div className="text-[10px] font-bold opacity-50">{food.portion}</div>
                </div>
              </button>
            ))}
         </div>
      </div>
    </div>
  );
};

export default ARPortionGuideView;
