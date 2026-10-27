
import { Language } from './types';

export const getPhaseMetadata = (lang: Language) => {
  const metadata: Record<number, { name: string; description: string; color: string }> = {
    1: {
      name: lang === 'hi' ? "चरण 1: गहन डिटॉक्स और क्षारीयता" : 
            lang === 'es' ? "Fase 1: Detox Profundo y Alcalinidad" : 
            lang === 'bn' ? "ধাপ ১: গভীর ডিটক্স এবং ক্ষারীয়তা" : 
            "Phase 1: Deep Detox & Alkalinity",
      description: lang === 'hi' ? "शारीरिक सूजन को कम करने और आयुर्वेदिक सफाई सिद्धांतों का उपयोग करने पर ध्यान केंद्रित करता है।" : 
                   lang === 'es' ? "Se enfoca en reducir la inflamación sistémica y alcalinizar el cuerpo usando principios ayurvédicos." : 
                   lang === 'bn' ? "শরীরের প্রদাহ কমাতে এবং আয়ুর্বেদিক ক্লিনজিং নীতির ওপর গুরুত্ব দেয়।" : 
                   "Focuses on reducing systemic inflammation and shifting the body towards an alkaline state using Ayurvedic cleansing principles.",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200"
    },
    2: {
      name: lang === 'hi' ? "चरण 2: माइक्रोबायोम बहाली" : 
            lang === 'es' ? "Fase 2: Restauración del Microbioma" : 
            lang === 'bn' ? "ধাপ ২: মাইক্রোবায়োম পুনরুদ্ধার" : 
            "Phase 2: Microbiome Restoration",
      description: lang === 'hi' ? "स्वस्थ आंतों के फ्लोरा के पुनर्निर्माण के लिए विविध फाइबर और प्रीबायोटिक्स का परिचय देता है।" : 
                   lang === 'es' ? "Introduce fibra diversa y prebióticos para reconstruir la flora intestinal saludable." : 
                   lang === 'bn' ? "স্বাস্থ্যকর অন্ত্রের ফ্লোরা পুনর্গঠনের জন্য বৈচিত্র্যময় ফাইবার এবং প্রিবায়োটিক যোগ করা হয়।" : 
                   "Introduces diverse fiber and prebiotics to rebuild a healthy gut flora while maintaining low insulin spikes.",
      color: "bg-blue-50 text-blue-700 border-blue-200"
    },
    3: {
      name: lang === 'hi' ? "चरण 3: चयापचय स्थिरीकरण" : 
            lang === 'es' ? "Fase 3: Estabilización Metabólica" : 
            lang === 'bn' ? "ধাপ ৩: মেটাবলিক স্থিতিশীলতা" : 
            "Phase 3: Metabolic Stabilization",
      description: lang === 'hi' ? "इंसुलिन संवेदनशीलता और ऊर्जा उत्पादन में सुधार के लिए लो ग्लाइसेमिक लोड पर ध्यान केंद्रित करता है।" : 
                   lang === 'es' ? "Se enfoca en carga glucémica baja para mejorar la sensibilidad a la insulina y la energía." : 
                   lang === 'bn' ? "ইনসুলিন সংবেদনশীলতা এবং শক্তি উৎপাদনের উন্নতির জন্য লো গ্লাইসেমিক লোডের ওপর গুরুত্ব দেয়।" : 
                   "Focuses on Low Glycemic Load and metabolic health to improve insulin sensitivity and energy production.",
      color: "bg-amber-50 text-amber-700 border-amber-200"
    },
    4: {
      name: lang === 'hi' ? "चरण 4: भूमध्यसागरीय अनुकूलन" : 
            lang === 'es' ? "Fase 4: Optimización Mediterránea" : 
            lang === 'bn' ? "ধাপ ৪: ভূমধ্যসাগরীয় অপ্টিমাইজেশন" : 
            "Phase 4: Mediterranean Optimization",
      description: lang === 'hi' ? "दीर्घायु के लिए भूमध्यसागरीय सिद्धांतों और रुक-रुक कर उपवास को शामिल करना।" : 
                   lang === 'es' ? "Vida sostenible incorporando principios mediterráneos y ayuno intermitente para la longevidad." : 
                   lang === 'bn' ? "দীর্ঘায়ু নিশ্চিত করতে ভূমধ্যসাগরীয় নীতি এবং ইন্টারমিটেন্ট ফাস্টিং-এর সমন্বয়।" : 
                   "Long-term sustainable living incorporating Mediterranean principles and intermittent fasting for longevity.",
      color: "bg-indigo-50 text-indigo-700 border-indigo-200"
    }
  };
  return metadata;
};
