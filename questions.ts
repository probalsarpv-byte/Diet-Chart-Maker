
export const QUESTION_CATEGORIES = [
  { id: 'basic', label: { en: 'Basic Profile', hi: 'मूल विवरण', es: 'Perfil Básico', bn: 'মৌলিক বিবরণ' } },
  { id: 'diet_habit', label: { en: 'Dietary History', hi: 'खानपान का इतिहास', es: 'Historial Dietético', bn: 'খাদ্যাভ্যাস ও ইতিহাস' } },
  { id: 'shakti', label: { en: 'Shakti (Cycle Sync)', hi: 'शक्ति (चक्र सिंक)', es: 'Shakti (Ciclo)', bn: 'শক্তি (চক্র সিঙ্ক)' } },
  { id: 'physical', label: { en: 'Vikriti (Current Imbalance)', hi: 'विकृति (वर्तमान असंतुलन)', es: 'Vikriti (Desequilibrio Actual)', bn: 'বিকৃতি (বর্তমান ভারসাম্যহীনতা)' } },
  { id: 'digestion', label: { en: 'Microbiome & Digestion', hi: 'माइक्रोबायोम और पाचन', es: 'Microbioma y Digestión', bn: 'মাইক্রোবায়োম এবং হজম' } },
  { id: 'metabolism', label: { en: 'Metabolic Health (Insulin)', hi: 'मेटाबॉलिक स्वास्थ्य', es: 'Salud Metabólica', bn: 'মেটাবলিক স্বাস্থ্য' } },
  { id: 'inflammation', label: { en: 'Inflammatory & Alkaline Status', hi: 'सूजन और क्षारीय स्थिति', es: 'Estado Inflamatorio y Alcalino', bn: 'প্রদাহ এবং ক্ষারীয় অবস্থা' } },
  { id: 'mind', label: { en: 'Psychological & Mood', hi: 'मनोविज्ञान और मनोदशा', es: 'Psicología y Ánimo', bn: 'মনোবিজ্ঞান এবং মেজাজ' } },
  { id: 'medical', label: { en: 'Medical History & Goals', hi: 'चिकित्सा इतिहास और लक्ष्य', es: 'Historia Médica y Objetivos', bn: 'চিকিৎসা ইতিহাস এবং লক্ষ্য' } }
];

const createQuestions = () => {
  const q: any[] = [];

  // 0. BASIC ANTHROPOMETRIC DATA
  const basicDetails = [
    { 
      id: 'basic_name', type: 'text', 
      text: { en: "Full Name", hi: "पूरा नाम", es: "Nombre completo", bn: "পুরো নাম" } 
    },
    { 
      id: 'basic_age', type: 'number', 
      text: { en: "Age (Years)", hi: "आयु (वर्ष)", es: "Edad (Años)", bn: "বয়স (বছর)" } 
    },
    { 
      id: 'basic_gender', type: 'select', 
      text: { en: "Gender", hi: "लिंग", es: "Género", bn: "লিঙ্গ" },
      options: [
        { value: 'Male', label: { en: "Male", hi: "पुरुष", es: "Masculino", bn: "পুরুষ" } },
        { value: 'Female', label: { en: "Female", hi: "महिला", es: "Femenino", bn: "মহিলা" } },
        { value: 'Other', label: { en: "Other", hi: "अन्य", es: "Otro", bn: "অন্যান্য" } }
      ]
    },
    { 
      id: 'basic_profession', type: 'select', 
      text: { en: "Profession", hi: "पेशा", es: "Profesión", bn: "পেশা" },
      options: [
        { value: 'Student', label: { en: "Student", hi: "छात्र", es: "Estudiante", bn: "ছাত্র" } },
        { value: 'Working Professional', label: { en: "Working Professional", hi: "कामकाजी पेशेवर", es: "Profesional", bn: "কর্মজীবী" } },
        { value: 'Homemaker', label: { en: "Homemaker", hi: "गृहिणी", es: "Ama de casa", bn: "গৃহিণী" } },
        { value: 'Other', label: { en: "Other", hi: "अन्य", es: "Otro", bn: "অন্যান্য" } }
      ]
    },
    { 
      id: 'basic_height', type: 'number', 
      text: { en: "Height (cm)", hi: "ऊंचाई (सेमी)", es: "Altura (cm)", bn: "উচ্চতা (সেমি)" } 
    },
    { 
      id: 'basic_weight', type: 'number', 
      text: { en: "Weight (kg)", hi: "वजन (किग्रा)", es: "Peso (kg)", bn: "ওজন (কেজি)" } 
    }
  ];

  basicDetails.forEach(item => {
    q.push({
      id: item.id,
      category: 'basic',
      text: item.text,
      type: item.type,
      options: item.options || [] 
    });
  });

  // 0.2 DIETARY HABITS
  const dietHabits = [
    {
      id: 'diet_breakfast', type: 'textarea',
      text: { en: "What do you typically eat for Breakfast? (Describe in detail)", hi: "आप आमतौर पर नाश्ते में क्या खाते हैं? (विस्तार से बताएं)", es: "¿Qué desayunas habitualmente? (Describa en detalle)", bn: "সকালের নাস্তায় সাধারণত কি খান? (বিস্তারিত লিখুন)" }
    },
    {
      id: 'diet_midmorning', type: 'textarea',
      text: { en: "Describe your Mid-Morning habits (approx. 11 AM)", hi: "अपने सुबह के नाश्ते की आदतों का वर्णन करें (लगभग 11 बजे)", es: "Describa sus hábitos de media mañana", bn: "আপনার সকালের মধ্যবর্তী সময়ের (১১ টা) খাবারের অভ্যাসের বর্ণনা দিন" }
    },
    {
      id: 'diet_lunch', type: 'textarea',
      text: { en: "What is your typical Lunch like? (Ingredients, portions, timing)", hi: "आपका सामान्य दोपहर का भोजन कैसा होता है? (सामग्री, मात्रा, समय)", es: "¿Cómo es su almuerzo típico? (Ingredientes, porciones, horario)", bn: "দুপুরের খাবারে সাধারণত কি কি থাকে? (উপাদান, পরিমাণ এবং সময়)" }
    },
    {
      id: 'diet_afternoon', type: 'textarea',
      text: { en: "Describe your Afternoon habits (4-5 PM snacks/drinks)", hi: "अपने दोपहर की आदतों का वर्णन करें (4-5 बजे का नाश्ता/पेय)", es: "Describa sus hábitos de la tarde (snacks/bebidas 4-5 PM)", bn: "আপনার বিকেলের (৪-৫ টা) নাস্তা বা পানীয়ের অভ্যাসের বর্ণনা দিন" }
    },
    {
      id: 'diet_dinner', type: 'textarea',
      text: { en: "Describe your typical Dinner timing and what you eat", hi: "अपने सामान्य रात के खाने के समय और आप क्या खाते हैं इसका वर्णन करें", es: "Describa su horario de cena y qué come", bn: "আপনার রাতের খাবারের সময় এবং কি কি খান তার বিস্তারিত বর্ণনা দিন" }
    },
    {
      id: 'diet_fluid', type: 'textarea',
      text: { en: "Describe your daily water and fluid intake (Tea, Coffee, Soft drinks, etc.)", hi: "अपने दैनिक पानी और तरल पदार्थ के सेवन का वर्णन करें", es: "Describa su ingesta diaria de agua y líquidos", bn: "আপনার প্রতিদিনের জল এবং অন্যান্য পানীয় (চা, কফি, কোল্ড ড্রিঙ্কস ইত্যাদি) গ্রহণের বর্ণনা দিন" }
    }
  ];

  dietHabits.forEach(item => {
    q.push({
      id: item.id,
      category: 'diet_habit',
      text: item.text,
      type: item.type,
      options: []
    });
  });

  // 0.5 SHAKTI CYCLE
  const shaktiDetails = [
    {
      id: 'shakti_last_period', type: 'date',
      text: { en: "First day of last period", hi: "अंतिम अवधि का पहला दिन", es: "Primer día del último período", bn: "শেষ মাসিকের প্রথম দিন" }
    },
    {
      id: 'shakti_cycle_length', type: 'number',
      text: { en: "Average Cycle Length (Days)", hi: "औसत चक्र की लंबाई (दिन)", es: "Duración media del ciclo (días)", bn: "গড় চক্রের দৈর্ঘ্য (দিন)" }
    },
    {
      id: 'shakti_pcos', type: 'select',
      text: { en: "Diagnosed with PCOS/PCOD?", hi: "PCOS/PCOD का निदान?", es: "¿Diagnosticado con SOP?", bn: "PCOS/PCOD নির্ণয় করা হয়েছে?" },
      options: [
        { value: 'Yes', label: { en: "Yes", hi: "हाँ", es: "Sí", bn: "হ্যাঁ" } },
        { value: 'No', label: { en: "No", hi: "नहीं", es: "No", bn: "না" } }
      ]
    }
  ];

  shaktiDetails.forEach(item => {
    q.push({
      id: item.id,
      category: 'shakti',
      text: item.text,
      type: item.type,
      options: item.options || []
    });
  });
  
  // 1. VIKRITI (CURRENT IMBALANCE)
  // Replaces static Physical traits with dynamic symptom-based questions
  const vikritiDetails = [
    { 
      text: { en: "Current Sleep Pattern", hi: "वर्तमान नींद का पैटर्न", es: "Patrón de sueño actual", bn: "বর্তমান ঘুমের ধরণ" }, 
      options: [
        { en: "Light, broken, or difficulty falling asleep", hi: "हल्की, टूटी हुई, या सोने में कठिनाई", es: "Ligero, interrumpido o dificultad para dormir", bn: "হালকা, বারবার ভেঙে যায় বা ঘুমাতে কষ্ট হয়" }, 
        { en: "Moderate, but wake up hot or thirsty", hi: "मध्यम, लेकिन गर्मी या प्यास के साथ जागना", es: "Moderado, pero despierta con calor o sed", bn: "মাঝারি, কিন্তু গরমে বা তৃষ্ণায় ঘুম ভাঙে" }, 
        { en: "Heavy, excessive, hard to wake up", hi: "भारी, अत्यधिक, जागने में कठिनाई", es: "Pesado, excesivo, difícil de despertar", bn: "গভীর, অতিরিক্ত ঘুম, সকালে উঠতে কষ্ট হয়" }
      ] 
    },
    { 
      text: { en: "Current Emotional State", hi: "वर्तमान भावनात्मक स्थिति", es: "Estado emocional actual", bn: "বর্তমান মানসিক অবস্থা" }, 
      options: [
        { en: "Anxious, worried, overthinking", hi: "चिंतित, डरा हुआ, अधिक सोचना", es: "Ansioso, preocupado, pensar demasiado", bn: "উদ্বেগ, দুশ্চিন্তা, অতিরিক্ত চিন্তা" }, 
        { en: "Irritable, angry, critical", hi: "चिड़चिड़ा, गुस्सा, आलोचनात्मक", es: "Irritable, enojado, crítico", bn: "খিটখিটে মেজাজ, রাগ, অধৈর্য" }, 
        { en: "Lethargic, unmotivated, attached", hi: "सुस्त, निरुत्साहित, मोह", es: "Letárgico, desmotivado, apegado", bn: "অলসতা, উদ্যমহীনতা, বিষণ্নতা" }
      ] 
    },
    { 
      text: { en: "Body Temperature Sensitivity", hi: "शरीर के तापमान की संवेदनशीलता", es: "Sensibilidad a la temperatura corporal", bn: "শারীরিক তাপমাত্রা ও অনুভূতি" }, 
      options: [
        { en: "Always cold, hands/feet cold", hi: "हमेशा ठंड, हाथ/पैर ठंडे", es: "Siempre frío, manos/pies fríos", bn: "সবসময় শীত লাগে, হাত-পা ঠান্ডা থাকে" }, 
        { en: "Always hot, sweating easily", hi: "हमेशा गर्मी, आसानी से पसीना", es: "Siempre calor, suda fácilmente", bn: "সবসময় গরম লাগে, সহজেই ঘাম হয়" }, 
        { en: "Cool, damp, clammy skin", hi: "ठंडी, नम, चिपचिपी त्वचा", es: "Piel fría, húmeda y pegajosa", bn: "ঠান্ডা, স্যাঁতসেঁতে বা চটচটে ত্বক" }
      ] 
    },
    { 
      text: { en: "Current Skin Condition", hi: "वर्तमान त्वचा की स्थिति", es: "Condición actual de la piel", bn: "বর্তমান ত্বকের অবস্থা" }, 
      options: [
        { en: "Dry, rough, cracking", hi: "सूखी, खुरदरी, फट रही है", es: "Seca, áspera, agrietada", bn: "শুষ্ক, রুক্ষ, ফাটা ভাব" }, 
        { en: "Inflamed, reddish, acne/rashes", hi: "सूजन, लालिमा, मुंहासे", es: "Inflamada, rojiza, acné", bn: "প্রদাহযুক্ত, লালচে ভাব, ব্রণ বা র‍্যাশ" }, 
        { en: "Oily, pale, congested", hi: "तैलीय, पीली, बंद रोमछिद्र", es: "Grasa, pálida, congestionada", bn: "তৈলাক্ত, ফ্যাকাশে, লোমকূপ বন্ধ" }
      ] 
    },
    { 
      text: { en: "Current Energy Level", hi: "वर्तमान ऊर्जा स्तर", es: "Nivel de energía actual", bn: "বর্তমান শক্তির মাত্রা" }, 
      options: [
        { en: "Fluctuating, restless bursts", hi: "उतार-चढ़ाव, बेचैनी", es: "Fluctuante, ráfagas inquietas", bn: "অস্থির, ওঠানামা করে" }, 
        { en: "Intense, burnout prone", hi: "तीव्र, बर्नआउट प्रवण", es: "Intenso, propenso al agotamiento", bn: "তীব্র, কিন্তু দ্রুত ক্লান্ত হয়ে পড়া (বার্নআউট)" }, 
        { en: "Slow, sluggish, hard to start", hi: "धीमा, सुस्त, शुरू करने में कठिन", es: "Lento, perezoso, difícil de arrancar", bn: "ধীর, অলস, কাজ শুরু করতে অনীহা" }
      ] 
    }
  ];
  
  vikritiDetails.forEach((item, i) => {
    q.push({
      id: `physical_${i+1}`,
      category: 'physical',
      text: item.text,
      type: 'select',
      options: [
        { value: 'Vata', label: item.options[0] },
        { value: 'Pitta', label: item.options[1] },
        { value: 'Kapha', label: item.options[2] }
      ]
    });
  });

  // 2. DIGESTION & MICROBIOME
  const digestionDetails = [
    { 
      text: { en: "Frequency of bloating after meals", hi: "भोजन के बाद पेट फूलने की आवृत्ति", es: "Frecuencia de hinchazón tras las comidas", bn: "খাওয়ার পর পেট ফাঁপার হার" }, 
      options: [
        { en: "Rarely", hi: "दुर्लभ", es: "Rara vez", bn: "খুবই কম" }, 
        { en: "Occasionally", hi: "कभी-कभी", es: "Ocasionalmente", bn: "মাঝে মাঝে" }, 
        { en: "Frequently", hi: "अक्सर", es: "Frecuentemente", bn: "প্রায়ই" }
      ] 
    },
    { 
      text: { en: "Morning tongue coating", hi: "सुबह जीभ पर परत", es: "Capa en la lengua por la mañana", bn: "সকালে জিভের ওপর আস্তরণ" }, 
      options: [
        { en: "None", hi: "कोई नहीं", es: "Ninguna", bn: "নেই" }, 
        { en: "Thin White", hi: "पतली सफेद", es: "Fina y blanca", bn: "পাতলা সাদা" }, 
        { en: "Thick Yellowish", hi: "मोटी पीली", es: "Gruesa y amarillenta", bn: "ঘন হলদেটে" }
      ] 
    },
    { 
      text: { en: "Appetite consistency", hi: "भूख की निरंतरता", es: "Consistencia del apetito", bn: "ক্ষুধার ধারাবাহিকতা" }, 
      options: [
        { en: "Variable", hi: "परिवर्तनशील", es: "Variable", bn: "পরিবর্তনশীল" }, 
        { en: "Strong", hi: "तेज", es: "Fuerte", bn: "তীব্র" }, 
        { en: "Low but steady", hi: "कम लेकिन स्थिर", es: "Bajo pero constante", bn: "কম কিন্তু স্থিতিশীল" }
      ] 
    },
    {
      text: { en: "Stool Consistency (Bristol Scale)", hi: "मल की स्थिरता (ब्रिस्टल स्केल)", es: "Consistencia de las heces", bn: "মলের ঘনত্ব (ব্রিস্টল স্কেল)" },
      options: [
        { en: "Hard lumps (Type 1-2)", hi: "कठोर गांठें", es: "Duro (Tipo 1-2)", bn: "শক্ত দলা (টাইপ ১-২)" },
        { en: "Smooth/Soft (Type 3-4)", hi: "मुलायम/चिकना", es: "Suave (Tipo 3-4)", bn: "মসৃণ/নরম (টাইপ ৩-৪)" },
        { en: "Loose/Liquid (Type 5-7)", hi: "ढीला/तरल", es: "Líquido (Tipo 5-7)", bn: "পাতলা/তরল (টাইপ ৫-৭)" }
      ]
    },
    {
      text: { en: "Reaction to Fermented Foods/Probiotics", hi: "किण्वित भोजन/प्रोबायोटिक्स पर प्रतिक्रिया", es: "Reacción a probióticos", bn: "গাজনযুক্ত খাবারের প্রতিক্রিয়া" },
      options: [
        { en: "Bloating/Gas", hi: "पेट फूलना/गैस", es: "Hinchazón/Gases", bn: "পেট ফাঁপা/গ্যাস" },
        { en: "Imপ্রoves Digestion", hi: "पाचन में सुधार", es: "Mejora la digestión", bn: "হজমের উন্নতি করে" },
        { en: "No Noticeable Change", hi: "कोई बदलाव नहीं", es: "Sin cambios", bn: "কোন পরিবর্তন নেই" }
      ]
    }
  ];

  digestionDetails.forEach((item, i) => {
    q.push({
      id: `digestion_${i+1}`,
      category: 'digestion',
      text: item.text,
      type: 'select',
      options: [
        { value: 'a', label: item.options[0] },
        { value: 'b', label: item.options[1] },
        { value: 'c', label: item.options[2] }
      ]
    });
  });

  // 3. METABOLISM & INSULIN
  const metabolismQuestions = [
    {
      text: { en: "Energy levels 1-2 hours after a heavy meal", hi: "भारी भोजन के 1-2 घंटे बाद ऊर्जा का स्तर", es: "Niveles de energía 1-2 horas después de una comida pesada", bn: "ভারী খাবারের ১-২ ঘণ্টা পর শক্তির মাত্রা" },
      options: [
        { en: "Stable/Energetic", hi: "स्थिर/ऊर्जावान", es: "Estable/Energético", bn: "স্থিতিশীল/শক্তিশালী" },
        { en: "Slight dip/Tired", hi: "थोड़ी गिरावट/थकान", es: "Ligera bajada/Cansado", bn: "সামান্য ক্লান্তি" },
        { en: "Strong need to sleep/Brain fog", hi: "सोने की तीव्र इच्छा/दिमाग सुन्न", es: "Necesidad fuerte de dormir/Niebla mental", bn: "ঘুমানোর প্রবল ইচ্ছা/মাথা ঝিমঝিম" }
      ]
    },
    {
      text: { en: "Frequency of sugar or starch cravings", hi: "चीनी या स्टार्च की लालसा की आवृत्ति", es: "Frecuencia de antojos de azúcar o almidón", bn: "चिनी या স্টার্চ জাতীয় খাবারের আকাঙ্ক্ষা" },
      options: [
        { en: "Rarely", hi: "शायद ही कभी", es: "Rara vez", bn: "খুব কম" },
        { en: "Occasional (Afternoons)", hi: "कभी-कभी (दोपहर)", es: "Ocasional (Tardes)", bn: "মাঝে মাঝে (বিকেলে)" },
        { en: "Frequent/Intense/Uncontrollable", hi: "अक्सर/तीव्र/अनियंत्रित", es: "Frecuente/Intenso", bn: "ঘন ঘন/তীব্র/অনিিয়ন্ত্রিত" }
      ]
    },
    {
       text: { en: "Reaction to missing a meal", hi: "भोजन छूटने पर प्रतिक्रिया", es: "Reacción al saltarse una comida", bn: "খাবার বাদ পড়লে প্রতিক্রিয়া" },
       options: [
         { en: "No problem/Can fast easily", hi: "कोई समस्या नहीं/आसानी से उपवास", es: "Sin problema/Ayuno fácil", bn: "সমস্যা নেই/সহজেই উপবাস সম্ভব" },
         { en: "Mild hunger/Irritation", hi: "हल्की भूख/चिड़चिड़ापन", es: "Hambre leve/Irritación", bn: "হালকা ক্ষুধা/বিরক্তি" },
         { en: "Shaky/Dizzy/Hangry", hi: "कंपकंपी/चक्कर/बेहद गुस्सा", es: "Temblores/Mareo/Malhumor", bn: "কাঁপুনি/মাথা ঘোরা/প্রচণ্ড ক্ষুধা" }
       ]
    },
    {
       text: { en: "Primary area of weight gain", hi: "वजन बढ़ने का मुख्य क्षेत्र", es: "Área principal de aumento de peso", bn: "ওজন বৃদ্ধির প্রধান স্থান" },
       options: [
         { en: "Hips/Thighs (Subcutaneous)", hi: "कूल्हे/जांघें", es: "Caderas/Muslos", bn: "কোমর/উরুর নিচে" },
         { en: "Evenly distributed", hi: "समान रूप से वितरित", es: "Distribuido uniformemente", bn: "সমানভাবে বিস্তৃত" },
         { en: "Belly/Midsection (Visceral)", hi: "पेट/मध्य भाग", es: "Vientre/Sección media", bn: "পেট/কোমর (ভিসেরা)" }
       ]
    },
    {
       text: { en: "Thirst and Urination frequency", hi: "प्यास और पेशाब की आवृत्ति", es: "Frecuencia de sed y micción", bn: "पिपাসা और প্রস্রাবের হার" },
       options: [
         { en: "Normal", hi: "सामान्य", es: "Normal", bn: "স্বাভাবিক" },
         { en: "Slightly higher than average", hi: "औसत से थोड़ा अधिक", es: "Ligeramente mayor al promedio", bn: "গড়ের চেয়ে সামান্য বেশি" },
         { en: "Frequent thirst/Night urination", hi: "बार-बार प्यास/रात में पेशाब", es: "Sed frecuente/Micción nocturna", bn: "ঘন ঘন পিপাসা/রাতে প্রস্রাব" }
       ]
    }
  ];

  metabolismQuestions.forEach((item, i) => {
    q.push({
      id: `metabolism_${i+1}`,
      category: 'metabolism',
      text: item.text,
      type: 'select',
      options: [
        { value: 'a', label: item.options[0] },
        { value: 'b', label: item.options[1] },
        { value: 'c', label: item.options[2] }
      ]
    });
  });

  // 4. INFLAMMATION
  const inflammationQuestions = [
    {
      text: { en: "Morning joint stiffness or pain", hi: "सुबह जोड़ों में अकड़न या दर्द", es: "Rigidez o dolor articular matutino", bn: "সকালে গাঁটে শক্ত ভাব বা ব্যথা" },
      options: [
        { en: "None", hi: "कोई नहीं", es: "Ninguno", bn: "নেই" },
        { en: "Mild/Goes away quickly", hi: "हल्का/जल्दी ठीक", es: "Leve/Desaparece rápido", bn: "মৃদু/দ্রুত চলে যায়" },
        { en: "Significant/Lasts hours", hi: "महत्वपूर्ण/घंटों रहता है", es: "Significativo/Dura horas", bn: "তীব্র/ঘণ্টা ধরে থাকে" }
      ]
    },
    {
       text: { en: "Skin sensitivity and reactions", hi: "त्वचा की संवेदनशीलता और प्रतिक्रियाएं", es: "Sensibilidad y reacciones cutáneas", bn: "ত্বকের সংবেদনশীলতা এবং প্রতিক্রিয়া" },
       options: [
         { en: "Resilient/Clear", hi: "लचीला/साफ", es: "Resistente/Clara", bn: "সুস্থ/পরিষ্কার" },
         { en: "Occasional redness/Dryness", hi: "कभी-कभी लालिमा/शुष्कता", es: "Enrojecimiento/Sequedad ocasional", bn: "माঝে মাঝে লালচে ভাব/শুষ্কতা" },
         { en: "Frequent rashes/Acne/Puffy", hi: "अक्सर दाने/मुंहासे/सूजन", es: "Erupciones frecuentes/Acné", bn: "ঘন ঘন ফুসকুড়ি/ব্রণ/ফোলা ভাব" }
       ]
    },
    {
       text: { en: "Recovery from physical exertion", hi: "शारीरिक परिश्रम से रिकवरी", es: "Recuperación del esfuerzo físico", bn: "শারীরিক পরিশ্রম থেকে পুনরুদ্ধার" },
       options: [
         { en: "Quick/Strong", hi: "तेज/मजबूत", es: "Rápido/Fuerte", bn: "দ্রুত/শক্তিশালী" },
         { en: "Average soreness", hi: "औसत दर्द", es: "Dolor promedio", bn: "গড় ব্যথা" },
         { en: "Prolonged soreness/Fatigue", hi: "लंबा दर्द/थकान", es: "Dolor prolongado/Fatiga", bn: "দীর্ঘস্থায়ী ব্যথা/ক্লান্তি" }
       ]
    },
    {
       text: { en: "Water retention / Puffiness", hi: "जल प्रतिधारण / सूजन", es: "Retención de líquidos / Hinchazón", bn: "জল জমে যাওয়া / ফোলা ভাব" },
       options: [
         { en: "Rarely", hi: "शायद ही कभी", es: "Rara vez", bn: "खুব কম" },
         { en: "Sometimes (Hormonal/Diet)", hi: "कभी-कभी", es: "A veces", bn: "माঝে মাঝে" },
         { en: "Constant (Face/Feet/Hands)", hi: "लगातार (चेहरा/पैर/हाथ)", es: "Constante (Cara/Pies/Manos)", bn: "সর্বদা (মুখ/পা/হাত)" }
       ]
    },
    {
       text: { en: "Overall fatigue levels", hi: "कुल थकान का स्तर", es: "Niveles generales de fatiga", bn: "সার্বিক ক্লান্তির মাত্রা" },
       options: [
         { en: "High energy all day", hi: "पूरे दिन उच्च ऊर्जा", es: "Alta energía todo el día", bn: "সারাদিন উচ্চ শক্তি" },
         { en: "Sluggish mornings", hi: "सुस्त सुबह", es: "Mañanas lentas", bn: "অলস সকাল" },
         { en: "Chronic tiredness/Unrefreshed", hi: "पुरानी थकान/ताजा महसूस नहीं", es: "Cansancio crónico", bn: "দীর্ঘস্থায়ী ক্লান্তি/সতেজ লাগে না" }
       ]
    }
  ];

  inflammationQuestions.forEach((item, i) => {
    q.push({
      id: `inflammation_${i+1}`,
      category: 'inflammation',
      text: item.text,
      type: 'select',
      options: [
        { value: 'a', label: item.options[0] },
        { value: 'b', label: item.options[1] },
        { value: 'c', label: item.options[2] }
      ]
    });
  });

  // 5. PSYCHOLOGICAL
  const mindDetails = [
    {
      text: { en: "Primary reaction to stress", hi: "तनाव पर प्राथमिक प्रतिक्रिया", es: "Reacción al estrés", bn: "মানসিক চাপের প্রতিক্রিয়া" },
      options: [
        { en: "Anxiety/Fear (Vata)", hi: "चिंता/डर", es: "Ansiedad/Miedo", bn: "উদ্বেগ/ভয়" },
        { en: "Anger/Frustration (Pitta)", hi: "गुस्सा/हताशा", es: "Ira/Frustración", bn: "রাগ/হতাশা" },
        { en: "Withdrawal/Silence (Kapha)", hi: "पीछे हटना/मौन", es: "Retraimiento/Silencio", bn: "প্রত্যাহার/নীরবতা" }
      ]
    },
    {
      text: { en: "Nature of Dreams", hi: "सपनों की प्रकृति", es: "Naturaleza de los sueños", bn: "স্বপ্নের ধরণ" },
      options: [
        { en: "Flying/Running/Active", hi: "उड़ना/दौड़ना", es: "Volar/Correr", bn: "ওড়া/দৌড়ানো" },
        { en: "Fire/Fighting/Problem Solving", hi: "आग/लड़ाई", es: "Fuego/Peleas", bn: "আগুন/লড়াই" },
        { en: "Water/Romantic/Slow", hi: "पानी/रोमांटिक", es: "Agua/Romántico", bn: "জল/রোমান্টিক" }
      ]
    },
    {
      text: { en: "Memory Style", hi: "याददाश्त की शैली", es: "Estilo de memoria", bn: "স্মৃতির ধরণ" },
      options: [
        { en: "Quick to learn, quick to forget", hi: "जल्दी सीखना, जल्दी भूलना", es: "Aprende/Olvida rápido", bn: "দ্রুত শেখা, দ্রুত ভোলা" },
        { en: "Sharp/Distinct", hi: "तेज/स्पष्ट", es: "Aguda/Distinta", bn: "তীক্ষ্ণ/স্পষ্ট" },
        { en: "Slow to learn, long retention", hi: "धीरे सीखना, लंबी याद", es: "Lento/Retiene mucho", bn: "ধীরে শেখা, দীর্ঘ মনে রাখা" }
      ]
    }
  ];

  mindDetails.forEach((item, i) => {
    q.push({
      id: `mind_${i+1}`,
      category: 'mind',
      text: item.text,
      type: 'select',
      options: [
        { value: 'a', label: item.options[0] },
        { value: 'b', label: item.options[1] },
        { value: 'c', label: item.options[2] }
      ]
    });
  });
  
  // 6. MEDICAL HISTORY
  const medicalDetails = [
    {
      id: 'med_conditions',
      type: 'textarea',
      text: { en: "What diagnosed diseases or conditions do you have?", hi: "आपको कौन सी बीमारियां या स्थितियां हैं?", es: "¿Qué enfermedades o condiciones diagnosticadas tiene?", bn: "আপনার কি কি রোগ বা শারীরিক সমস্যা আছে?" }
    },
    {
      id: 'emergency_name',
      type: 'text',
      text: { en: "Next of Kin Name (for Diabetes SOS)", hi: "निकटतम संबंधी का नाम (SOS के लिए)", es: "Nombre de contacto (para SOS)", bn: "নিকট আত্মীয়ের নাম (SOS এর জন্য)" }
    },
    {
      id: 'emergency_phone',
      type: 'number',
      text: { en: "Next of Kin WhatsApp Number", hi: "निकटतम संबंधी का व्हाट्सएप नंबर", es: "Número de WhatsApp (Contacto)", bn: "নিকট আত্মীয়ের হোয়াটসঅ্যাপ নম্বর" }
    },
    {
      id: 'med_medications',
      type: 'textarea',
      text: { en: "What medications are you currently taking?", hi: "आप वर्तमान में कौन सी दवाएं ले रहे हैं?", es: "¿Qué medicamentos está tomando actualmente?", bn: "আপনি বর্তমানে কি কি ঔষধ খাচ্ছেন?" }
    },
    {
      id: 'med_targets',
      type: 'textarea',
      text: { en: "What is your primary diet target/goal?", hi: "आपका प्राथमिक आहार लक्ष्य क्या है?", es: "¿Cuál es su objetivo principal de dieta?", bn: "আপনার ডায়েট করার মূল লক্ষ্য কি?" }
    },
    {
      id: 'med_reports',
      type: 'file',
      text: { en: "Upload Medical Reports (Optional)", hi: "मेडिकल रिपोर्ट अपलोड करें (वैकल्पिक)", es: "Subir informes médicos (Opcional)", bn: "মেডিকেল রিপোর্ট আপলোড করুন (ঐচ্ছিক)" }
    }
  ];

  medicalDetails.forEach(item => {
    q.push({
      id: item.id,
      category: 'medical',
      text: item.text,
      type: item.type === 'text' ? 'textarea' : item.type,
      options: []
    });
  });

  return q;
};

export const ALL_QUESTIONS = createQuestions();
