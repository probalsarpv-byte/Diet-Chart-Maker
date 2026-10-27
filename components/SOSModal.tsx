
import React, { useEffect, useState, useRef } from 'react';
import { translations } from '../i18n';
import { Language } from '../types';

interface Props {
  lang: Language;
  onDismiss: () => void;
  emergencyContact?: {
    name: string;
    phone: string;
  };
}

const SOSModal: React.FC<Props> = ({ lang, onDismiss, emergencyContact }) => {
  const t = translations[lang];
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes in seconds
  const [emergencyTimer, setEmergencyTimer] = useState(300); // 5 minutes in seconds
  const [locationSent, setLocationSent] = useState(false);
  
  useEffect(() => {
    // 1. Voice Command
    const speak = () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Clear any pending
        const utterance = new SpeechSynthesisUtterance(t.sos_voice_msg);
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        utterance.volume = 1;
        // Try to match language if supported, else default (likely English/System)
        // utterance.lang = lang; 
        window.speechSynthesis.speak(utterance);
      }
    };
    speak();
    
    // Repeat voice command every 30 seconds if not dismissed
    const voiceInterval = setInterval(speak, 30000);

    // 2. Main Symptom Check Timer
    const timerInterval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    // 3. Emergency Contact Timer
    const emergencyInterval = setInterval(() => {
      setEmergencyTimer((prev) => {
        if (prev <= 1) {
          clearInterval(emergencyInterval);
          handleEmergencySend();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timerInterval);
      clearInterval(emergencyInterval);
      clearInterval(voiceInterval);
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleEmergencySend = () => {
    setLocationSent(true);
    
    // Get location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        
        let message = `Emergency! Hypoglycemia Alert. Location: https://maps.google.com/?q=${latitude},${longitude}`;
        
        if (emergencyContact) {
            // If diabetes/next of kin info is available
            message = `EMERGENCY: ${emergencyContact.name}, patient needs help! Hypoglycemia/SOS Alert. Location: https://maps.google.com/?q=${latitude},${longitude}`;
            const cleanPhone = emergencyContact.phone.replace(/\D/g, ''); // remove non-digits
            
            // 1. Open WhatsApp to specific person
            window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
            
            // 2. Trigger Phone Call
            window.location.href = `tel:${cleanPhone}`;
        } else {
            // Fallback generic share
            window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
        }

      }, () => {
         // Fallback if location fails
         let message = "Emergency! Hypoglycemia Alert. User is unresponsive to app check. Location unknown.";
         if (emergencyContact) {
            const cleanPhone = emergencyContact.phone.replace(/\D/g, '');
            window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
            window.location.href = `tel:${cleanPhone}`;
         } else {
            window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
         }
      });
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-red-600 flex flex-col items-center justify-center p-4 text-white animate-in zoom-in duration-300">
      
      <div className="max-w-md w-full text-center space-y-8">
        {/* Flashing Header */}
        <div className="animate-pulse space-y-2">
           <div className="w-24 h-24 mx-auto bg-white rounded-full flex items-center justify-center">
             <span className="text-6xl">🚑</span>
           </div>
           <h1 className="text-4xl font-black uppercase tracking-tighter">{t.sos_title}</h1>
        </div>

        {/* Instructions Card */}
        <div className="bg-white text-red-600 p-8 rounded-[40px] shadow-2xl space-y-6">
           <div className="space-y-2">
             <h2 className="text-2xl font-black uppercase underline">{t.sos_instruction}</h2>
           </div>
           
           <div className="p-4 bg-red-50 rounded-2xl border-2 border-red-100">
             <p className="text-xl font-bold">{t.sos_action}</p>
             <p className="text-lg font-medium mt-2">🍯 🍪 {t.sos_foods}</p>
           </div>

           <p className="text-sm font-bold uppercase tracking-widest text-red-400">
             ⚠️ {t.sos_warning}
           </p>
        </div>

        {/* Timers */}
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-red-800/50 p-4 rounded-2xl border border-red-400/30">
             <div className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">{t.sos_timer_label}</div>
             <div className="text-3xl font-mono font-bold">{formatTime(timeLeft)}</div>
           </div>
           <div className={`p-4 rounded-2xl border ${locationSent ? 'bg-green-600 border-green-400' : 'bg-red-800/50 border-red-400/30'}`}>
             <div className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">{t.sos_emergency_label}</div>
             {locationSent ? (
               <div className="text-xs font-bold leading-tight">
                   {emergencyContact ? `Alerting ${emergencyContact.name}...` : t.sos_contact_sent}
               </div>
             ) : (
               <div className="text-3xl font-mono font-bold animate-pulse text-yellow-300">{formatTime(emergencyTimer)}</div>
             )}
           </div>
        </div>

        {/* Dismiss */}
        <button 
          onClick={onDismiss}
          className="w-full py-6 bg-white hover:bg-red-50 text-red-600 rounded-[30px] font-black text-xl uppercase tracking-widest shadow-xl active:scale-95 transition-all"
        >
          {t.sos_dismiss}
        </button>
      </div>
    </div>
  );
};

export default SOSModal;
