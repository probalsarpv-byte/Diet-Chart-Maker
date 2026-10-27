
import { GoogleGenAI, Type } from "@google/genai";
import { HealthProfile, DietPhaseChart, AssessmentData, Language, ChatMessage, ShoppingList, FoodItem, WeatherData, CookingSession, GutAnalysisResult, DinacharyaSchedule, FamilyMember, UnifiedFamilyDiet } from "../types";

export class GeminiService {
  private getClient(): GoogleGenAI {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  private getLangName(lang: Language): string {
    const langMap: Record<Language, string> = {
      en: 'English',
      bn: 'Bengali',
      hi: 'Hindi',
      es: 'Spanish'
    };
    return langMap[lang] || 'English';
  }

  async generateUnifiedFamilyDiet(familyMembers: FamilyMember[], lang: Language): Promise<UnifiedFamilyDiet> {
    const ai = this.getClient();
    const targetLang = this.getLangName(lang);
    
    // Construct a context string for all members
    const membersContext = familyMembers.map(m => `
      Name: ${m.name} (${m.relation})
      Profile: Age ${m.profile.age}, Dosha (Imbalance): ${m.profile.dosha}, Weight ${m.profile.weight}kg, Conditions: ${m.profile.medicalConditions || 'None'}
    `).join('\n');

    const prompt = `
      Act as a Family Nutritionist Expert. Create a UNIFIED 7-day diet plan for a family.
      
      Family Members:
      ${membersContext}

      GOAL: The family cooks ONE main pot for each meal (Breakfast, Lunch, Dinner). 
      The ingredients must be safe for everyone (lowest common denominator for health conditions).
      However, the PORTION sizes and specific additions/exclusions must vary per member based on their needs.

      OUTPUT: JSON format ONLY.
      Language: ${targetLang}. All descriptions, names, and reasons must be in ${targetLang}.

      Structure:
      {
        "familyName": "string",
        "overview": "string (Summary of the strategy used - Translated)",
        "weeklySchedule": [
          {
            "day": "Day 1",
            "meals": [
              {
                "time": "Breakfast",
                "mealName": "string (Common Meal Name - Translated)",
                "description": "string (Brief desc - Translated)",
                "ingredients": ["string (Common Ingredient 1)", "string (Common Ingredient 2)"],
                "portions": [
                   { "memberName": "${familyMembers[0].name}", "portion": "string (e.g. 1 bowl)", "reason": "string (Why this amount? - Translated)" },
                   ... (for each member)
                ]
              }
              ... (Lunch, Dinner)
            ]
          }
          ... (7 Days)
        ],
        "shoppingList": ["string", "string"]
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: "application/json" }
    });

    return JSON.parse(response.text.trim());
  }

  async generateDinacharyaSchedule(profile: HealthProfile, sunrise: string, sunset: string, isRamadan: boolean, lang: Language): Promise<DinacharyaSchedule> {
    const ai = this.getClient();
    const targetLang = this.getLangName(lang);
    const mode = isRamadan ? "Ramadan Mode (Fast starts at Sunrise, ends at Sunset)" : "Standard Ayurvedic Mode";

    const prompt = `
      Act as an Ayurvedic Dinacharya Expert. Create a personalized daily rhythm sync for a person with the following profile:
      Vikriti (Current Imbalance): ${profile.dosha}, Age: ${profile.age}, Gender: ${profile.gender}, Job: ${profile.profession || "Standard"}.
      Local Solar Data: Sunrise at ${sunrise}, Sunset at ${sunset}.
      Current Mode: ${mode}.
      Language: ${targetLang}.

      Instructions:
      1. Align wake-up time with Brahma Muhurta (approx 90 mins before sunrise).
      2. Include essential rituals: Tongue scraping, Oil pulling (Gandusha), Abhyanga self-massage (specify oil for their Imbalance).
      3. Plan meal windows based on Agni (digestive fire) peak (12pm-2pm).
      4. If Ramadan is active, shift all hygiene rituals and schedule Suhoor before sunrise and Iftar at sunset.
      5. Provide 'voiceScript' for each activity - short, encouraging guidance to be spoken by an AI coach in ${targetLang}.
      6. Include 'timerSeconds' for rituals like oil pulling (300s) or meditation (600s).

      Return ONLY a JSON object matching the DinacharyaSchedule interface.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: "application/json" }
    });

    return JSON.parse(response.text.trim());
  }

  async analyzeHealthAndPhase(profile: HealthProfile, currentPhase: number, currentWeek: number, lang: Language, assessment?: AssessmentData, weather?: WeatherData): Promise<DietPhaseChart> {
    const ai = this.getClient();
    const locationInfo = profile.location ? `User Location: Lat ${profile.location.latitude}, Lng ${profile.location.longitude}.` : "User Location: Unknown.";
    const targetLang = this.getLangName(lang);

    let weatherContext = "";
    if (weather) {
      weatherContext = `REAL-TIME WEATHER CONTEXT: Condition: ${weather.isRaining ? "Rain" : "Clear"}, Temp: ${weather.temp}°C, Humidity: ${weather.humidity}%. AQI: ${weather.aqi}.`;
    }

    // Calculate BMR and Target Calories
    let bmr = 1500;
    if (profile.weight && profile.height && profile.age && profile.gender) {
      const isMale = profile.gender.toLowerCase().startsWith('m');
      const offset = isMale ? 5 : -161;
      bmr = Math.round((10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age) + offset);
    }

    let caloriesInstruction = "";
    if (currentPhase === 1) {
      caloriesInstruction = `Phase 1 (Detox): The total daily calorie target must be EXACTLY BMR + 100 (${bmr + 100} kcal).`;
    } else if (currentPhase === 2) {
      caloriesInstruction = `Phase 2 (Restoration): The total daily calorie target must be EXACTLY BMR (${bmr} kcal).`;
    } else if (currentPhase === 3) {
      caloriesInstruction = `Phase 3 (Stabilization): The total daily calorie target must be EXACTLY BMR - 100 (${bmr - 100} kcal).`;
    } else {
      caloriesInstruction = `Phase 4 (Maintenance): The total daily calorie target must be Maintenance Level (${Math.round(bmr * 1.2)} kcal).`;
    }

    let fastingInstruction = "";
    if (currentPhase === 1) {
      fastingInstruction = "Intermittent Fasting Protocol: 14:10 (14 hours fasting, 10 hours eating window). All meals MUST fit within this 10-hour window.";
    } else if (currentPhase === 2) {
      fastingInstruction = "Intermittent Fasting Protocol: 16:8 (16 hours fasting, 8 hours eating window). All meals MUST fit within this 8-hour window.";
    } else if (currentPhase === 3) {
      fastingInstruction = "Intermittent Fasting Protocol: 2 days of 24-hour fasting, and the other 5 days 16:8. Clearly indicate the 24-hour fast days in the schedule with only 0-calorie liquids allowed.";
    } else {
      fastingInstruction = "Intermittent Fasting Protocol: 15:9 (15 hours fasting, 9 hours eating window). All meals MUST fit within this 9-hour window.";
    }

    const fullLangName = this.getLangName(lang);

    const prompt = `
      Act as a holistic physician. You are an expert in Functional Medicine, Metabolic Nutrition, and Traditional Ayurveda.
      Generate a comprehensive 7-DAY DIET CHART for Phase ${currentPhase} (WEEK ${currentWeek}) in ${targetLang}.
      The whole system and the generated chart MUST be based strictly on the integrated principles of Functional medicine, metabolic nutrition, and Ayurveda.
      
      ${locationInfo} ${weatherContext}
      PATIENT PROFILE: 
      Current Vikriti (Imbalance): ${profile.dosha}. 
      This is the detected imbalance that NEEDS PACIFYING. The diet must explicitly focus on balancing ${profile.dosha}.
      Age ${profile.age}, Gender: ${profile.gender}, Medications: ${profile.currentMedicationsList}.
      Calculated BMR: ${bmr} kcal.
      
      CALORIE & MACRO REQUIREMENT:
      ${caloriesInstruction}
      Distribute these calories across the meals for each day.
      - Total Protein Target: Exactly ${Math.round(profile.weight || 60)}g (Calculated as 1g per kg of body weight for a ${profile.weight || 60}kg individual).
      - Macro Ratio: You MUST strictly divide the total daily calorie with 40% Carbohydrates, 30% Protein, and 30% Fats.
      - Protein Sourcing: You MUST combine animal protein and plant protein in the diet.
      - Calorie Calculation: You MUST use the Bangladesh food composition table to calculate the calories for the recommended foods.
      
      FASTING REQUIREMENT:
      ${fastingInstruction}
      Ensure that the 'time' of the meals in the weekly schedule strictly aligns with this eating window. You MUST explicitly mention the applied Intermittent Fasting protocol in the 'recommendations' array.

      CRITICAL: You MUST return a raw JSON object. Do not use markdown formatting.
      IMPORTANT: All string values (descriptions, names, advice, rationales, staples advice, recommendations, etc.) MUST be in ${targetLang}. 
      The JSON KEYS (e.g., "phaseName", "weeklySchedule", "staplesAdvice") must remain in English. The JSON VALUES must be in ${targetLang}.

      
      Strictly follow this JSON structure:
      {
        "phase": ${currentPhase},
        "currentWeek": ${currentWeek},
        "phaseName": "string (e.g. ${profile.dosha} Pacifying Detox - Translated)",
        "focus": "string (Short summary of how this plan balances ${profile.dosha} - Translated)",
        "medicalSafetyNote": "string (Optional safety warning based on meds - Translated)",
        "weatherAdaptation": {
          "shieldMode": "string (Translated)",
          "condition": "string (Translated)",
          "nudge": "string (Translated)",
          "adjustments": ["string (Translated)"]
        },
        "drugFoodInteractions": [
           { "medication": "string", "foodInteraction": "string", "severity": "High/Moderate", "mechanism": "string (Translated)", "guidance": "string (Translated)" }
        ],
        "weeklySchedule": [
          {
            "day": "Day 1",
            "meals": [
               { 
                 "time": "08:00 AM", 
                 "mealName": "string (Translated)", 
                 "description": "string (ingredients - Translated)", 
                 "quantity": "string (Translated)",
                 "calories": "string (e.g. 350 kcal)",
                 "benefits": ["string (Translated)"] 
               }
            ]
          }
          // ... Generate for Day 1 to Day 7
        ],
        "recommendations": ["string (Lifestyle tip 1 - Translated)", "string (Lifestyle tip 2 - Translated)", "string (Lifestyle tip 3 - Translated)"],
        "forbiddenFoods": ["string (Translated)", "string (Translated)"],
        "supplements": [
           { "name": "string (Translated)", "dosage": "string (Translated)", "rationale": "string (Translated)", "phaseRole": "string", "tags": ["string"] }
        ],
        "staplesAdvice": { "salt": "string (Advice on salt type/amount - Translated)", "oil": "string (Advice on oil type - Translated)", "water": "string (Advice on water intake - Translated)" },
        "activities": [
           { "type": "Yoga", "name": "string (Translated)", "duration": "string (Translated)", "instructions": "string (Translated)", "visualCue": "pose_name" }
        ],
        "macros": { "protein": 30, "fats": 30, "carbs": 40 }
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: "application/json" }
    });

    return JSON.parse(response.text.trim());
  }

  async fetchLocalFoods(profile: HealthProfile | null, category: string, lang: Language): Promise<FoodItem[]> {
    const ai = this.getClient();
    const targetLang = this.getLangName(lang);
    const locationStr = profile?.location ? `(Lat: ${profile.location.latitude}, Lng: ${profile.location.longitude})` : "";
    
    const prompt = `
      List 10 popular local food items for category '${category}' available in the region ${locationStr}.
      PROVIDE THE OUTPUT STRICTLY IN ${targetLang}.
      
      You MUST return a raw JSON array (no markdown, no code blocks) where each object strictly follows this interface:
      {
        "name": "string (in ${targetLang})",
        "description": "string (1-2 sentences in ${targetLang})",
        "benefits": ["string (in ${targetLang})", "string", "string"],
        "ayurvedicProperty": "string (e.g. Balances Vata, Increases Pitta - in ${targetLang})",
        "nutrition": "string (summary in ${targetLang})",
        "composition": {
          "energy": "string (e.g. 50 kcal)",
          "protein": "string",
          "fat": "string",
          "carbohydrate": "string",
          "fiber": "string",
          "iron": "string",
          "calcium": "string"
        }
      }
    `;
    
    try {
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: { parts: [{ text: prompt }] },
          config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text.trim());
    } catch (e) {
        console.error("Failed to fetch foods", e);
        return [];
    }
  }

  async generateFamilyPot(profile: HealthProfile, currentPhase: number, adults: number, kids: number, mealType: string, lang: Language): Promise<any> {
    const ai = this.getClient();
    const targetLang = this.getLangName(lang);
    const prompt = `Create Family Pot recipe for Phase ${currentPhase} in ${targetLang}. Adults: ${adults}, Kids: ${kids}. Return JSON.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text.trim());
  }

  async generateGroceryList(profile: HealthProfile, currentPhase: number, lang: Language): Promise<ShoppingList> {
    const ai = this.getClient();
    const targetLang = this.getLangName(lang);
    const prompt = `Generate Shopping List for Phase ${currentPhase} in ${targetLang}. Return JSON.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text.trim());
  }

  async coachChat(profile: HealthProfile, currentPhase: number, messages: ChatMessage[], lang: Language): Promise<string> {
    const ai = this.getClient();
    const targetLang = this.getLangName(lang);
    const last = messages[messages.length - 1];
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ text: `Act as a Precision Nutrition Coach. Reply in ${targetLang} to: ${last.text}` }] }
    });
    return response.text || "";
  }

  async generateCookingSession(recipeName: string, profile: HealthProfile, lang: Language): Promise<CookingSession> {
    const ai = this.getClient();
    const targetLang = this.getLangName(lang);
    const prompt = `Create voice cooking session for ${recipeName} in ${targetLang}. Return JSON.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text.trim());
  }

  async suggestIngredientSubstitute(ingredient: string, recipeContext: string, profile: HealthProfile, lang: Language): Promise<string> {
    const ai = this.getClient();
    const targetLang = this.getLangName(lang);
    const prompt = `Suggest substitute for ${ingredient} in ${recipeContext} for ${profile.dosha} in ${targetLang}. 1 sentence.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ text: prompt }] }
    });
    return response.text?.trim() || "";
  }

  async analyzeGutSound(audioBase64: string, profile: HealthProfile, lang: Language): Promise<GutAnalysisResult> {
    const ai = this.getClient();
    const targetLang = this.getLangName(lang);
    const prompt = `Analyze gut sound audio for ${profile.dosha}. Return JSON. The 'description' and 'recommendation' fields MUST be in ${targetLang}.`;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        contents: { parts: [{ inlineData: { mimeType: "audio/wav", data: audioBase64 } }, { text: prompt }] },
        config: { responseMimeType: "application/json" }
      });
      return JSON.parse(response.text.trim());
    } catch {
      return { status: "Inconclusive", score: 0, description: "Failed", recommendation: "Try again" };
    }
  }
}
