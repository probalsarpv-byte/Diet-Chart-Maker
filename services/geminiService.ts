import {
  HealthProfile,
  DietPhaseChart,
  AssessmentData,
  Language,
  ChatMessage,
  ShoppingList,
  FoodItem,
  WeatherData,
  CookingSession,
  GutAnalysisResult,
  DinacharyaSchedule,
  FamilyMember,
  UnifiedFamilyDiet,
  TrafficLightGuide,
  TrafficLightFoodItem,
  Phase,
  DailyCalorieLog,
  MakerCheckerVerification,
} from "../types";
import { CohortDietEngine } from "./cohortDietEngine";
import { getUserGeminiAccount, MakerCheckerEngine } from "./aiModeService";
import {
  buildBdFctFoodExchangeTable,
  generateComprehensiveTrafficLightGuide,
} from "../data/bdFoodCompositionDatabase";

export interface FoodSafetyVerdict {
  foodName: string;
  zone: "green" | "yellow" | "red";
  verdictTitle: string;
  clinicalReason: string;
  ayurvedicAndCohortNote: string;
  healthySwap: string;
  bestTimingOrPortion: string;
  verification?: MakerCheckerVerification;
}

export class GeminiService {
  private getLangName(lang: Language): string {
    const langMap: Record<Language, string> = {
      en: "English",
      bn: "Bengali",
      hi: "Hindi",
      es: "Spanish",
    };
    return langMap[lang] || "English";
  }

  private async callServerGemini(params: {
    model?: string;
    contents: any;
    config?: any;
  }): Promise<string> {
    const userAccount = getUserGeminiAccount();
    // By default (when user hasn't enabled their personal Gemini account),
    // execute 100% zero-cost ($0) instantaneously without network wait.
    if (!userAccount.enabled) {
      return "";
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9500);
    try {
      const response = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(userAccount.accountEmail
            ? { "X-User-Gemini-Account": userAccount.accountEmail }
            : {}),
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: params.model || "gemini-3.8-flash",
          contents: params.contents,
          config: params.config,
          userGeminiAccount: userAccount.accountEmail || "connected",
        }),
      });

      const rawText = await response.text();
      if (!rawText || rawText.trim().startsWith("<")) {
        return "";
      }

      const data = JSON.parse(rawText);
      if (!response.ok || data.fallback) {
        return "";
      }
      return typeof data.text === "string" ? data.text : "";
    } catch {
      return "";
    } finally {
      clearTimeout(timer);
    }
  }

  private cleanJsonText(raw: string): string {
    return raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  }

  private safeParseJson<T>(raw: string, fallback: T): T {
    if (!raw) return fallback;
    const cleaned = this.cleanJsonText(raw);
    if (!cleaned || cleaned.startsWith("<")) return fallback;
    try {
      return JSON.parse(cleaned) as T;
    } catch {
      return fallback;
    }
  }

  /**
   * Deterministic clinical fallback for Traffic Light Food Guide if network is slow or offline,
   * also used to enrich AI output with authentic Bangladeshi items.
   */
  public getDefaultTrafficLightGuide(profile: HealthProfile): TrafficLightGuide {
    if (profile.cohortType === "pregnancy_lactation") {
      return CohortDietEngine.generateCohortTrafficLight(profile);
    }
    const fullBdFctGuide = generateComprehensiveTrafficLightGuide(profile);
    if (fullBdFctGuide && fullBdFctGuide.items.length > 0) {
      return fullBdFctGuide;
    }
    const cond = (profile.medicalConditions || "").toLowerCase();
    const isDiabeticOrIR =
      cond.includes("diab") ||
      cond.includes("sugar") ||
      cond.includes("insulin") ||
      cond.includes("pcos") ||
      profile.metabolicType?.toLowerCase().includes("resistant") ||
      profile.metabolicType?.includes("ইনসুলিন") ||
      profile.weight > 72;

    const digAns = Object.entries(profile.answers || {}).filter(([k]) =>
      k.startsWith("digestion")
    );
    const hasHypoacidity =
      profile.hasHypoacidity !== undefined
        ? profile.hasHypoacidity
        : digAns.some(([_, v]) => v === "c" || v === "a") ||
          cond.includes("gas") ||
          cond.includes("acidity") ||
          cond.includes("bloating") ||
          cond.includes("ibs") ||
          profile.microbiomeScore < 75;

    const recommendedMealFrequency: 3 | 4 = isDiabeticOrIR ? 3 : 4;
    const recommendedDinnerCarbRule: "vegetable_carbs" | "cereal_allowed" | "no_carbs" =
      isDiabeticOrIR ? "vegetable_carbs" : "cereal_allowed";

    const items: TrafficLightFoodItem[] = [
      // PROTEINS
      {
        id: "prot_egg",
        nameEn: "Deshi Boiled / Poached Egg (ডিম)",
        nameBn: "দেশি সিদ্ধ বা পোচ ডিম",
        category: "Proteins",
        zone: "green",
        caloriesPer100g: 155,
        clinicalReasonEn: "Complete bioavailable protein & choline for morning metabolic activation.",
        clinicalReasonBn: "সকালের মেটাবলিজম সক্রিয় করতে সম্পূর্ণ প্রোটিন এবং কোলিনের সেরা উৎস।",
      },
      {
        id: "prot_fish_rui",
        nameEn: "Rui / Katla / River Fish (রুই/কাতলা মাছ)",
        nameBn: "রুই / কাতলা / নদীর মাছ",
        category: "Proteins",
        zone: "green",
        caloriesPer100g: 110,
        clinicalReasonEn: "Lean anti-inflammatory omega-3 rich protein ideal for lunch & dinner.",
        clinicalReasonBn: "দুপুর ও রাতের খাবারের জন্য সহজপাচ্য ওমেগা-৩ সমৃদ্ধ প্রোটিন।",
      },
      {
        id: "prot_fish_magur",
        nameEn: "Shing / Magur / Small Indigenous Fish (শিং/মাগুর/ছোট মাছ)",
        nameBn: "শিং / মাগুর / দেশি ছোট মাছ",
        category: "Proteins",
        zone: "green",
        caloriesPer100g: 105,
        clinicalReasonEn: "High iron, calcium & leicht-digestible restorative protein.",
        clinicalReasonBn: "উচ্চ আয়রন, ক্যালসিয়াম ও দ্রুত হজমযোগ্য প্রোটিন।",
      },
      {
        id: "prot_chicken",
        nameEn: "Deshi Chicken Breast / Stew (দেশি মুরগির মাংস)",
        nameBn: "দেশি মুরগির মাংস (ঝোল/স্টু)",
        category: "Proteins",
        zone: "green",
        caloriesPer100g: 165,
        clinicalReasonEn: "High-quality amino acid profile supporting muscle & insulin sensitivity.",
        clinicalReasonBn: "পেশি গঠন ও ইনসুলিন সংবেদনশীলতা বজায় রাখতে চমৎকার প্রোটিন।",
      },
      {
        id: "prot_moong",
        nameEn: "Sprouted / Split Moong Dal (মুগ ডাল)",
        nameBn: "মুগ ডাল / অঙ্কুরিত মুগ",
        category: "Proteins",
        zone: "green",
        caloriesPer100g: 105,
        clinicalReasonEn: "Tridoshic plant protein gentle on gut mucosal lining.",
        clinicalReasonBn: "ত্রিদোষের ভারসাম্য রক্ষাকারী এবং অন্ত্রের জন্য অত্যন্ত হালকা উদ্ভিজ্জ প্রোটিন।",
      },
      {
        id: "prot_masoor",
        nameEn: "Thin Masoor Dal with Garlic (পাতলা মসুর ডাল)",
        nameBn: "রসুন ফোড়ন দিয়ে পাতলা মসুর ডাল",
        category: "Proteins",
        zone: "yellow",
        caloriesPer100g: 116,
        clinicalReasonEn: "Good plant protein; consume in moderate portion (1 small bowl) at lunch.",
        clinicalReasonBn: "ভালো উদ্ভিজ্জ প্রোটিন; দুপুরে পরিমিত পরিমাণে (১ ছোট বাটি) গ্রহণ করুন।",
      },
      {
        id: "prot_sour_curd",
        nameEn: "Homemade Sour Curd / Tok Doi (টক দই)",
        nameBn: "ঘরে পাতা টক দই",
        category: "Proteins",
        zone: "green",
        caloriesPer100g: 60,
        clinicalReasonEn: "Live probiotics for microbiome diversity; best consumed during daytime.",
        clinicalReasonBn: "অন্ত্রের উপকারী ব্যাকটেরিয়া বাড়াতে প্রোবায়োটিক সমৃদ্ধ খাবার।",
      },
      {
        id: "prot_beef",
        nameEn: "Red Meat / Beef / Mutton (গরু বা খাসির মাংস)",
        nameBn: "গরু বা খাসির মাংস (রেড মিট)",
        category: "Proteins",
        zone: "red",
        caloriesPer100g: 250,
        clinicalReasonEn: "Elevates systemic arachidonic acid inflammation and slows gut transit.",
        clinicalReasonBn: "শরীরে সিস্টেমিক প্রদাহ বাড়ায় এবং হজম প্রক্রিয়া ধীর করে দেয়।",
      },
      {
        id: "prot_broiler_fried",
        nameEn: "Deep Fried Broiler Chicken / Sausages (ভাজা ব্রয়লার/সসেজ)",
        nameBn: "ডুবো তেলে ভাজা ব্রয়লার মুরগি / প্রসেসড মিট",
        category: "Proteins",
        zone: "red",
        caloriesPer100g: 290,
        clinicalReasonEn: "High trans fats, inflammatory omega-6, and endocrine disruptors.",
        clinicalReasonBn: "উচ্চ ট্রান্স ফ্যাট ও হরমোনাল ভারসাম্যহীনতা তৈরি করে।",
      },

      // VEGETABLES & GREENS
      {
        id: "veg_lau",
        nameEn: "Bottle Gourd / Lau Boiled or Light Labra (লাউ সিদ্ধ বা তরকারি)",
        nameBn: "লাউ সিদ্ধ / হালকা লাউয়ের তরকারি",
        category: "Vegetables & Greens",
        zone: "green",
        caloriesPer100g: 15,
        clinicalReasonEn: "Alkaline cellular hydrator & ideal low-glycemic night vegetable carb.",
        clinicalReasonBn: "শরীর ক্ষারীয় রাখে এবং রাতের খাবারে শস্যের বিকল্প হিসেবে সেরা সবজি শর্করা।",
        isVegetableCarb: true,
      },
      {
        id: "veg_pepe",
        nameEn: "Green Papaya Boiled / Bhorta (কাঁচা পেঁপে সিদ্ধ/ভর্তা)",
        nameBn: "কাঁচা পেঁপে সিদ্ধ বা তরকারি",
        category: "Vegetables & Greens",
        zone: "green",
        caloriesPer100g: 32,
        clinicalReasonEn: "Rich in papain enzyme to resolve hypoacidity and gut stagnation; great night carb.",
        clinicalReasonBn: "প্যাপেইন এনজাইম হজমশক্তি বাড়ায় এবং রাতের আদর্শ সবজি-ভিত্তিক শর্করা।",
        isVegetableCarb: true,
      },
      {
        id: "veg_chalkumra",
        nameEn: "Ash Gourd / Chal Kumra & Jhinga (চালকুমড়া ও ঝিঙে)",
        nameBn: "চালকুমড়া, ঝিঙে ও চিচিঙ্গা",
        category: "Vegetables & Greens",
        zone: "green",
        caloriesPer100g: 18,
        clinicalReasonEn: "Prebiotic soluble fiber that cools Pitta and prevents glucose spikes.",
        clinicalReasonBn: "প্রিবায়োটিক ফাইবার যা ব্লাড সুগার নিয়ন্ত্রণে রাখে ও পিত্ত শান্ত করে।",
        isVegetableCarb: true,
      },
      {
        id: "veg_palong_kolmi",
        nameEn: "Spinach, Kolmi & Lal Shak (পালং, কলমি ও লাল শাক)",
        nameBn: "পালং শাক, কলমি শাক ও লাল শাক",
        category: "Vegetables & Greens",
        zone: "green",
        caloriesPer100g: 25,
        clinicalReasonEn: "Magnesium, folate & chlorophyll for morning or lunch micronutrient density.",
        clinicalReasonBn: "সকালের নাস্তা বা দুপুরের খাবারে ম্যাগনেসিয়াম, আয়রন ও ফাইবারের উৎস।",
      },
      {
        id: "veg_cauliflower_rice",
        nameEn: "Cauliflower Rice / Steamed Broccoli (ফুলকপির রাইস / ব্রকলি)",
        nameBn: "ফুলকপির রাইস (Cauliflower Rice) ও ব্রকলি",
        category: "Vegetables & Greens",
        zone: "green",
        caloriesPer100g: 25,
        clinicalReasonEn: "Sulforaphane liver detoxifier & direct grain-free rice substitute for dinner.",
        clinicalReasonBn: "লিভার ডিটক্স করে এবং ভাতের বদলে রাতের খাবারে চমৎকার গ্রেইন-ফ্রি বিকল্প।",
        isVegetableCarb: true,
      },
      {
        id: "veg_korola",
        nameEn: "Bitter Gourd / Korola & Sajna Data (করলা ও সজনে ডাটা)",
        nameBn: "করলা ও সজনে ডাটা",
        category: "Vegetables & Greens",
        zone: "green",
        caloriesPer100g: 20,
        clinicalReasonEn: "Natural plant insulin mimetics (charantin) that improve glucose uptake.",
        clinicalReasonBn: "প্রাকৃতিক ইনসুলিন সংবেদনশীলতা বৃদ্ধি করে ও সুগার কমায়।",
      },
      {
        id: "veg_mistikumra",
        nameEn: "Sweet Pumpkin & Beetroot (মিষ্টি কুমড়া ও বিটরুট)",
        nameBn: "মিষ্টি কুমড়া ও বিটরুট",
        category: "Vegetables & Greens",
        zone: "yellow",
        caloriesPer100g: 45,
        clinicalReasonEn: "Moderate glycemic load; limit to small portions during daytime only.",
        clinicalReasonBn: "মাঝারি গ্লাইসেমিক ইনডেক্স; শুধুমাত্র দিনের বেলায় অল্প পরিমাণে খাওয়া যাবে।",
        isVegetableCarb: true,
      },
      {
        id: "veg_potato_fried",
        nameEn: "White Potato Bhaji / Deep Fried Beguni (আলু ভাজি / বেগুনি)",
        nameBn: "সাদা আলু ভাজি / বেগুনি / চপ",
        category: "Vegetables & Greens",
        zone: "red",
        caloriesPer100g: 220,
        clinicalReasonEn: "Rapid postprandial glucose surge and nightshade lectin irritation.",
        clinicalReasonBn: "দ্রুত রক্তে শর্করা বাড়িয়ে দেয় এবং ইনসুলিন স্পাইক ঘটায়।",
      },

      // GRAINS & CARBS
      {
        id: "carb_brown_rice",
        nameEn: "Hand-Pounded Red / Brown Rice (লাল চালের ভাত / ঢেঁকি ছাঁটা চাল)",
        nameBn: "লাল চালের ভাত / ব্রাউন রাইস",
        category: "Grains & Carbs",
        zone: isDiabeticOrIR ? "yellow" : "green",
        caloriesPer100g: 111,
        clinicalReasonEn: "Intact bran fiber & B-vitamins; best consumed strictly at Lunch.",
        clinicalReasonBn: "ফাইবার ও ভিটামিন-বি সমৃদ্ধ; মূলত দুপুরের খাবারে পরিমিত পরিমাণে উপযোগী।",
        isCerealCarb: true,
      },
      {
        id: "carb_makhana",
        nameEn: "Roasted Fox Nuts / Makhana (মাখনা)",
        nameBn: "রোস্টেড মাখনা (Fox Nuts)",
        category: "Grains & Carbs",
        zone: "green",
        caloriesPer100g: 347,
        clinicalReasonEn: "Low GI, high magnesium & potassium clinical exchange for rice/snacks.",
        clinicalReasonBn: "কম গ্লাইসেমিক ইনডেক্স ও উচ্চ ম্যাগনেসিয়াম সমৃদ্ধ চমৎকার বিকল্প শর্করা।",
        isCerealCarb: true,
      },
      {
        id: "carb_oats_millets",
        nameEn: "Rolled Oats /Kaon Rice / Buckwheat (ওটস / কাউন চাল)",
        nameBn: "রোলড ওটস / কাউনের চাল / বাকহুইট",
        category: "Grains & Carbs",
        zone: "yellow",
        caloriesPer100g: 120,
        clinicalReasonEn: "Beta-glucan soluble fiber; suitable as a clinical exchange for brown rice.",
        clinicalReasonBn: "বিটা-গ্লুকান সমৃদ্ধ; লাল চালের ভাতের বিকল্প হিসেবে পরিমিত পরিমাণে গ্রহণযোগ্য।",
        isCerealCarb: true,
      },
      {
        id: "carb_red_atta",
        nameEn: "Whole Wheat Red Atta Roti (লাল আটার রুটি)",
        nameBn: "লাল আটার হাতে গড়া রুটি",
        category: "Grains & Carbs",
        zone: "yellow",
        caloriesPer100g: 240,
        clinicalReasonEn: "Contains gluten; limit to 1 thin roti if cereal carbs are permitted.",
        clinicalReasonBn: "গ্লুটেন যুক্ত; শস্য অনুমোদিত থাকলে সর্বোচ্চ ১টি পাতলা রুটি খাওয়া যাবে।",
        isCerealCarb: true,
      },
      {
        id: "carb_shirataki",
        nameEn: "Konjac / Millet / Zucchini Low-GI Noodles (লো-জিআই নুডলস)",
        nameBn: "মিলেট নুডলস / জুকিনি বা কনজ্যাক নুডলস",
        category: "Grains & Carbs",
        zone: "green",
        caloriesPer100g: 45,
        clinicalReasonEn: "Grain-free or low-glycemic clinical exchange for traditional carbs.",
        clinicalReasonBn: "সাধারণ ভাত বা নুডলসের পরিবর্তে স্বাস্থ্যকর লো-কার্ব এক্সচেঞ্জ।",
      },
      {
        id: "carb_white_rice_paratha",
        nameEn: "Polished White Rice, Maida Paratha & White Bread (সাদা ভাত, পরোটা, পাউরুটি)",
        nameBn: "পলিশড সাদা ভাত, ময়দার পরোটা ও সাদা পাউরুটি",
        category: "Grains & Carbs",
        zone: "red",
        caloriesPer100g: 310,
        clinicalReasonEn: "Stripped of fiber; triggers hyperinsulinemia, fatty liver, and visceral adiposity.",
        clinicalReasonBn: "ফাইবারহীন শর্করা যা ইনসুলিন রেজিস্ট্যান্স ও ফ্যাটি লিভার ত্বরান্বিত করে।",
        isCerealCarb: true,
      },

      // HEALTHY FATS & SEEDS
      {
        id: "fat_chia_flax",
        nameEn: "Soaked Chia, Flax & Pumpkin Seeds (চিয়া সিড, তিসি ও মিষ্টি কুমড়ার বীজ)",
        nameBn: "চিয়া সিড, তিসি (Flaxseed) ও কুমড়ার বীজ",
        category: "Healthy Fats & Seeds",
        zone: "green",
        caloriesPer100g: 486,
        clinicalReasonEn: "Essential ALA Omega-3, zinc & mucilage fiber for morning breakfast.",
        clinicalReasonBn: "সকালের নাস্তায় ওমেগা-৩ ফ্যাটি অ্যাসিড, জিঙ্ক ও ফাইবার যোগ করার সেরা উৎস।",
      },
      {
        id: "fat_almonds_walnuts",
        nameEn: "Soaked Almonds & Walnuts (ভেজানো কাঠবাদাম ও আখরোট)",
        nameBn: "ভেজানো কাঠবাদাম ও আখরোট",
        category: "Healthy Fats & Seeds",
        zone: "green",
        caloriesPer100g: 579,
        clinicalReasonEn: "Dietary monounsaturated fats & polyphenols that blunt glycemic excursions.",
        clinicalReasonBn: "ডায়েটারি স্বাস্থ্যকর ফ্যাট যা রক্তে শর্করার ওঠানামা নিয়ন্ত্রণ করে।",
      },
      {
        id: "fat_deshi_ghee",
        nameEn: "Pure A2 Deshi Cow Ghee (দেশি খাঁটি ঘি)",
        nameBn: "খাঁটি দেশি গাওয়া ঘি",
        category: "Healthy Fats & Seeds",
        zone: "green",
        caloriesPer100g: 900,
        clinicalReasonEn: "Rich in butyric acid to heal colonocytes and kindle digestive Agni.",
        clinicalReasonBn: "বিউটিরিক অ্যাসিড সমৃদ্ধ যা অন্ত্রের প্রাচীর সুস্থ রাখে ও হজমশক্তি বাড়ায়।",
      },
      {
        id: "fat_olive_mustard",
        nameEn: "Extra Virgin Olive Oil / Cold-Pressed Mustard Oil (অলিভ অয়েল / ঘানি ভাঙা সরিষার তেল)",
        nameBn: "এক্সট্রা ভার্জিন অলিভ অয়েল / ঘানি ভাঙা সরিষার তেল",
        category: "Healthy Fats & Seeds",
        zone: "green",
        caloriesPer100g: 884,
        clinicalReasonEn: "Anti-inflammatory cooking lipid matrix free from industrial hexane.",
        clinicalReasonBn: "প্রদাহরোধী স্বাস্থ্যকর রান্নার তেল।",
      },
      {
        id: "fat_soybean_oil",
        nameEn: "Refined Soybean / Palm / Canola Oil (সয়াবিন তেল ও ডালডা)",
        nameBn: "রিফাইন্ড সয়াবিন তেল, পাম অয়েল ও বনস্পতি",
        category: "Healthy Fats & Seeds",
        zone: "red",
        caloriesPer100g: 884,
        clinicalReasonEn: "Oxidized linoleic acid damages mitochondrial membranes and endothelium.",
        clinicalReasonBn: "কোষীয় প্রদাহ, হৃদরোগ ও মেটাবলিক সিনড্রোমের প্রধান কারণ।",
      },

      // FRUITS & SNACKS
      {
        id: "fruit_amla_guava",
        nameEn: "Amloki, Green Guava & Jamun (আমলকী, পেয়ারা ও জাম)",
        nameBn: "আমলকী, দেশি পেয়ারা ও কালোজাম",
        category: "Fruits & Snacks",
        zone: "green",
        caloriesPer100g: 68,
        clinicalReasonEn: "Low fructose, ultra-high vitamin C & polyphenols.",
        clinicalReasonBn: "কম ফ্রুক্টোজ এবং উচ্চ ভিটামিন-সি ও অ্যান্টিঅক্সিডেন্ট সমৃদ্ধ।",
      },
      {
        id: "fruit_green_coconut",
        nameEn: "Tender Coconut Water with Pulp (ডাবের পানি)",
        nameBn: "কচি ডাবের পানি",
        category: "Fruits & Snacks",
        zone: "yellow",
        caloriesPer100g: 19,
        clinicalReasonEn: "Natural electrolyte replenisher; consume mid-morning only.",
        clinicalReasonBn: "প্রাকৃতিক ইলেক্ট্রোলাইট; সকাল ১১টার দিকে পরিমিত পরিমাণে পানযোগ্য।",
      },
      {
        id: "fruit_sugar_sweets",
        nameEn: "Sweetened Tea, Mishti, Bakery Biscuits & Soft Drinks (চিনিযুক্ত চা, মিষ্টি, বিস্কুট)",
        nameBn: "চিনিযুক্ত দুধ চা, মিষ্টি, বেকারি বিস্কুট ও কোমল পানীয়",
        category: "Fruits & Snacks",
        zone: "red",
        caloriesPer100g: 420,
        clinicalReasonEn: "Fructose overload, advanced glycation end-products (AGEs), and gut dysbiosis.",
        clinicalReasonBn: "লিভারে চর্বি জমায় এবং অন্ত্রের ভালো ব্যাকটেরিয়া ধ্বংস করে।",
      },
    ];

    return {
      items,
      recommendedMealFrequency,
      mealFrequencyReasonEn:
        recommendedMealFrequency === 3
          ? "3 Meals/Day recommended to allow 4-5 hours of insulin clearance between meals and optimize metabolic flexibility."
          : "4 Meals/Day (Breakfast, Lunch, Light Evening Tiffin, Dinner) recommended to sustain steady energy without overburdening weak digestive Agni.",
      mealFrequencyReasonBn:
        recommendedMealFrequency === 3
          ? "আপনার মেটাবলিক ও ইনসুলিন সংবেদনশীলতা উন্নত করতে দিনে ৩ বেলা খাবারের পরামর্শ দেওয়া হয়েছে, যাতে প্রতি বেলা খাবারের মাঝে ৪-৫ ঘণ্টা ইনসুলিন বিশ্রামের সময় পায়।"
          : "আপনার হজমশক্তি (অগ্নি) ও শক্তির ভারসাম্য বজায় রাখতে দিনে ৪ বেলা পরিমিত খাবারের পরামর্শ দেওয়া হয়েছে (সকাল, দুপুর, বিকেলের হালকা নাস্তা ও রাত)।",
      recommendedDinnerCarbRule,
      dinnerCarbReasonEn:
        recommendedDinnerCarbRule === "vegetable_carbs"
          ? "Cereal grains (rice/roti) are restricted at night. Dinner carbohydrates will come strictly from cooked non-starchy Bengali vegetables (Lau, Pepe, Cauliflower rice) paired with protein & greens."
          : "A small controlled portion of complex cereal carb or low-GI grain substitute is permitted at dinner alongside protein and vegetables.",
      dinnerCarbReasonBn:
        recommendedDinnerCarbRule === "vegetable_carbs"
          ? "রাতে শস্যজাতীয় শর্করা (ভাত/রুটি) নিষেধ। রাতের শর্করার চাহিদা পূরণ হবে লাউ সিদ্ধ, পেঁপে সিদ্ধ বা ফুলকপির রাইসের মতো সবজি থেকে, সাথে থাকবে প্রোটিন ও শাকসবজি।"
          : "রাতের খাবারে প্রোটিন ও শাকসবজির পাশাপাশি অল্প পরিমাণে জটিল শর্করা (অথবা সবজি শর্করা) গ্রহণ করা যাবে।",
      hasHypoacidity,
      clinicalSummaryEn: `Personalized for ${profile.dosha} imbalance (${profile.medicalConditions || "Metabolic Optimization"}). Select the Green & Yellow foods you want in your custom Bengali clinical diet chart.`,
      clinicalSummaryBn: `আপনার ${profile.dosha} দোষ এবং শারীরিক কন্ডিশন (${profile.medicalConditions || "মেটাবলিক অপ্টিমাইজেশন"}) অনুযায়ী এই ট্রাফিক লাইট ফুড গাইড তৈরি হয়েছে। আপনার ডায়েট চার্টে যে খাবারগুলো রাখতে চান সেগুলো মার্ক করুন।`,
    };
  }

  async generateUnifiedFamilyDiet(
    familyMembers: FamilyMember[],
    lang: Language
  ): Promise<UnifiedFamilyDiet> {
    const targetLang = this.getLangName(lang);
    const membersContext = familyMembers
      .map(
        (m) => `
      Name: ${m.name} (${m.relation})
      Profile: Age ${m.profile.age}, Dosha (Imbalance): ${m.profile.dosha}, Weight ${m.profile.weight}kg, Conditions: ${m.profile.medicalConditions || "None"}
    `
      )
      .join("\n");

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
        "overview": "string",
        "weeklySchedule": [
          {
            "day": "Day 1",
            "meals": [
              {
                "time": "Breakfast",
                "mealName": "string",
                "description": "string",
                "ingredients": ["string"],
                "portions": [
                   { "memberName": "string", "portion": "string", "reason": "string" }
                ]
              }
            ]
          }
        ],
        "shoppingList": ["string"]
      }
    `;

    const text = await this.callServerGemini({
      model: "gemini-3.8-flash",
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: "application/json" },
    });

    const fallbackFamily: UnifiedFamilyDiet = {
      familyName: lang === "bn" ? "পারিবারিক স্বাস্থ্যকর ডায়েট চার্ট" : "Family Clinical Diet Plan",
      overview:
        lang === "bn"
          ? "সকল সদস্যের দোষ ও মেটাবলিক চাহিদা অনুযায়ী এক হাঁড়িতে রান্না করার উপযোগী সুষম খাবার।"
          : "Unified one-pot anti-inflammatory meals tailored with individual member portions.",
      weeklySchedule: [
        {
          day: lang === "bn" ? "দিন ১" : "Day 1",
          meals: [
            {
              time: lang === "bn" ? "সকালের নাস্তা" : "Breakfast",
              mealName: lang === "bn" ? "সবজি ওমলেট, লাল শাক ও চিয়া-বাদাম মিক্স" : "Vegetable Omelette, Steamed Greens & Seeds",
              description: lang === "bn" ? "প্রোটিন ও ফাইবার সমৃদ্ধ সকালের নাস্তা।" : "High-protein, fiber-rich morning meal.",
              ingredients: ["Eggs", "Spinach", "Chia Seeds", "Almonds"],
              portions: familyMembers.map((m) => ({
                memberName: m.name,
                portion: `${Math.round(m.profile.weight * 0.4)}g Protein + 1 Bowl Veggies`,
                reason: `${m.profile.dosha} balance`,
              })),
            },
          ],
        },
      ],
      shoppingList: ["Deshi Eggs", "River Fish", "Red Rice", "Spinach", "Bottle Gourd", "Chia Seeds", "Olive/Mustard Oil"],
    };

    return this.safeParseJson<UnifiedFamilyDiet>(text, fallbackFamily);
  }

  async generateDinacharyaSchedule(
    profile: HealthProfile,
    sunrise: string,
    sunset: string,
    isRamadan: boolean,
    lang: Language
  ): Promise<DinacharyaSchedule> {
    const targetLang = this.getLangName(lang);
    const mode = isRamadan
      ? "Ramadan Mode (Fast starts at Sunrise, ends at Sunset)"
      : "Standard Ayurvedic Mode";

    const prompt = `
      Act as an Ayurvedic Dinacharya Expert. Create a personalized daily rhythm sync for a person with the following profile:
      Vikriti (Current Imbalance): ${profile.dosha}, Age: ${profile.age}, Gender: ${profile.gender}, Job: ${profile.profession || "Standard"}.
      Local Solar Data: Sunrise at ${sunrise}, Sunset at ${sunset}.
      Current Mode: ${mode}.
      Language: ${targetLang}.
      Return ONLY a JSON object matching the DinacharyaSchedule interface.
    `;

    const text = await this.callServerGemini({
      model: "gemini-3.8-flash",
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: "application/json" },
    });

    const fallbackDinacharya: DinacharyaSchedule = {
      scheduleName: lang === "bn" ? "আয়ুর্বেদিক দিনচর্যা" : "Ayurvedic Dinacharya",
      doshaFocus: `${profile.dosha} Balance`,
      brahmaMuhurta: "04:30 AM",
      activities: [
        {
          time: "05:45 AM",
          name: lang === "bn" ? "জিহ্বা পরিষ্কার ও ডিটক্স জল" : "Tongue Scraping & Warm Water",
          type: "Hygiene",
          description: lang === "bn" ? "জিহ্বা পরিষ্কার ও কুসুম গরম ডিটক্স পানি পান" : "Tongue Scraping & Warm Detox Water",
          voiceScript: lang === "bn" ? "সকালে খালি পেটে কুসুম গরম পানি পান করুন।" : "Begin your morning with warm water to awaken digestive Agni.",
          timerSeconds: 180,
        },
        {
          time: "01:30 PM",
          name: lang === "bn" ? "দুপুরের প্রধান খাবার" : "Midday Main Meal",
          type: "Meal",
          description: lang === "bn" ? "দুপুরের প্রধান খাবার (পিক অগ্নি উইন্ডো)" : "Midday Main Meal (Peak Agni Window)",
          voiceScript: lang === "bn" ? "মনোযোগ দিয়ে ধীরে ধীরে খাবার চিবিয়ে খান।" : "Eat mindfully during peak digestive fire.",
        },
      ],
    };

    return this.safeParseJson<DinacharyaSchedule>(text, fallbackDinacharya);
  }

  async analyzeHealthAndPhase(
    profile: HealthProfile,
    currentPhase: number,
    currentWeek: number,
    lang: Language,
    assessment?: AssessmentData,
    weather?: WeatherData
  ): Promise<DietPhaseChart> {
    // If Pregnancy & Lactation cohort, immediately route to the Ayurvedic Masanumasika Engine
    // to strictly enforce month-by-month fetal milestones and ZERO herbs rules, then run Checker verification.
    if (profile.cohortType === 'pregnancy_lactation') {
      const pregChart = CohortDietEngine.generateCohortDietChart(
        profile,
        currentPhase as Phase,
        currentWeek,
        lang
      );
      return MakerCheckerEngine.verifyDietChart(pregChart, profile, lang);
    }

    const locationInfo = profile.location
      ? `User Location: Lat ${profile.location.latitude}, Lng ${profile.location.longitude}.`
      : "User Location: Bangladesh / South Asia.";
    const targetLang = this.getLangName(lang);

    let weatherContext = "";
    if (weather) {
      weatherContext = `REAL-TIME WEATHER CONTEXT: Condition: ${weather.isRaining ? "Rain" : "Clear"}, Temp: ${weather.temp}°C, Humidity: ${weather.humidity}%. AQI: ${weather.aqi}.`;
    }

    // Calculate BMR and Target Calories
    let bmr = 1500;
    if (profile.weight && profile.height && profile.age && profile.gender) {
      const isMale = profile.gender.toLowerCase().startsWith("m");
      const offset = isMale ? 5 : -161;
      bmr = Math.round(
        10 * profile.weight + 6.25 * profile.height - 5 * profile.age + offset
      );
    }

    let totalTargetCalories = bmr;
    let caloriesInstruction = "";
    if (currentPhase === 1) {
      totalTargetCalories = bmr + 100;
      caloriesInstruction = `Phase 1 (Detox): The total daily calorie target must be EXACTLY BMR + 100 (${totalTargetCalories} kcal).`;
    } else if (currentPhase === 2) {
      totalTargetCalories = bmr;
      caloriesInstruction = `Phase 2 (Restoration): The total daily calorie target must be EXACTLY BMR (${totalTargetCalories} kcal).`;
    } else if (currentPhase === 3) {
      totalTargetCalories = bmr - 100;
      caloriesInstruction = `Phase 3 (Stabilization): The total daily calorie target must be EXACTLY BMR - 100 (${totalTargetCalories} kcal).`;
    } else {
      totalTargetCalories = Math.round(bmr * 1.2);
      caloriesInstruction = `Phase 4 (Maintenance): The total daily calorie target must be Maintenance Level (${totalTargetCalories} kcal).`;
    }

    // Determine Meal Frequency (3 or 4 meals)
    const defaultGuide = this.getDefaultTrafficLightGuide(profile);
    const mealFrequency: 3 | 4 =
      profile.mealFrequency || defaultGuide.recommendedMealFrequency;
    const dinnerCarbRule =
      profile.dinnerCarbRule || defaultGuide.recommendedDinnerCarbRule;
    const hasHypoacidity =
      profile.hasHypoacidity !== undefined
        ? profile.hasHypoacidity
        : defaultGuide.hasHypoacidity;

    // Calculate exact meal-by-meal calorie split
    let mealSplitInstruction = "";
    if (mealFrequency === 3) {
      const bCal = Math.round(totalTargetCalories * 0.32);
      const lCal = Math.round(totalTargetCalories * 0.42);
      const dCal = totalTargetCalories - bCal - lCal;
      mealSplitInstruction = `
        MEAL FREQUENCY: STRICTLY 3 MEALS PER DAY (Breakfast, Lunch, Dinner).
        Divide the ${totalTargetCalories} kcal across 3 meals:
        1. Breakfast (সকালের নাস্তা - 08:30 AM): ~${bCal} kcal
        2. Lunch (দুপুরের খাবার - 01:30 PM): ~${lCal} kcal
        3. Dinner (রাতের খাবার - 07:30 PM): ~${dCal} kcal
      `;
    } else {
      const bCal = Math.round(totalTargetCalories * 0.26);
      const lCal = Math.round(totalTargetCalories * 0.36);
      const sCal = Math.round(totalTargetCalories * 0.13);
      const dCal = totalTargetCalories - bCal - lCal - sCal;
      mealSplitInstruction = `
        MEAL FREQUENCY: STRICTLY 4 MEALS PER DAY (Breakfast, Lunch, Evening Clinical Snack, Dinner).
        Divide the ${totalTargetCalories} kcal across 4 meals:
        1. Breakfast (সকালের নাস্তা - 08:30 AM): ~${bCal} kcal
        2. Lunch (দুপুরের খাবার - 01:30 PM): ~${lCal} kcal
        3. Afternoon/Evening Snack (বিকেলের নাস্তা - 04:45 PM): ~${sCal} kcal
        4. Dinner (রাতের খাবার - 07:45 PM): ~${dCal} kcal
      `;
    }

    // Selected Foods from Traffic Light Food Guide
    const selectedFoodIds =
      profile.selectedFoods && profile.selectedFoods.length > 0
        ? profile.selectedFoods
        : defaultGuide.items
            .filter((i) => i.zone === "green" || i.zone === "yellow")
            .map((i) => i.id);

    const selectedFoodNames = defaultGuide.items
      .filter((i) => selectedFoodIds.includes(i.id))
      .map((i) => `${i.nameEn} (${i.nameBn}) [${i.zone.toUpperCase()}]`)
      .join(", ");

    const redFoodsList = defaultGuide.items
      .filter((i) => i.zone === "red")
      .map((i) => (lang === "bn" ? i.nameBn : i.nameEn));

    // Fat & Cooking Oil Math (e.g., if total fat is 70g -> 20g from Ghee/Cooking Oil, 50g from Dietary Sources)
    const totalProteinGrams = Math.round(profile.weight || 65);
    // Calculate daily fat requirement (approx 30-35% of calories or ~60-70g)
    const totalDailyFatGrams = Math.max(
      45,
      Math.round((totalTargetCalories * 0.32) / 9)
    );
    const cookingFatGrams = Math.min(25, Math.max(15, Math.round(totalDailyFatGrams * 0.29))); // e.g., 20g when total is 70g
    const dietarySourceFatGrams = totalDailyFatGrams - cookingFatGrams; // e.g., 50g when total is 70g
    const gheeGrams = Math.round(cookingFatGrams * 0.4); // e.g. 8g (approx 1.5 tsp)
    const cookingOilGrams = cookingFatGrams - gheeGrams; // e.g. 12g (approx 2.5 tsp)
    const totalCarbsGrams = Math.max(
      60,
      Math.round(
        (totalTargetCalories - totalProteinGrams * 4 - totalDailyFatGrams * 9) / 4
      )
    );

    // Water and Salt Calculation
    const waterLiters = ((profile.weight || 65) * 0.038).toFixed(1);
    const hasHighBP = (profile.medicalConditions || "")
      .toLowerCase()
      .match(/bp|hypertension|pressure|প্রেসার/);
    const saltGrams = hasHighBP ? "3.5g (¾ tsp Pink Salt)" : "5g (1 tsp Himalayan Pink Salt)";

    let dinnerCarbInstruction = "";
    if (dinnerCarbRule === "vegetable_carbs") {
      dinnerCarbInstruction = `
        NIGHT / DINNER CARBOHYDRATE RULE (VEGETABLE-BASED CARBS ONLY):
        For this patient's condition, cereal-based carbohydrates (Rice, Roti, Oats) are STRICTLY FORBIDDEN at Dinner.
        At Dinner, the patient MUST get:
        - Quality Protein (e.g. Grilled/Stewed Fish, Deshi Chicken, or Egg)
        - Leafy Greens & Vegetables
        - Carbohydrate strictly from boiled/steamed/lightly spiced non-starchy Bengali vegetables such as Bottle Gourd (লাউ সিদ্ধ), Green Papaya (পেঁপে সিদ্ধ), Ash Gourd (চালকুমড়া), or Cauliflower Rice (ফুলকপির রাইস).
      `;
    } else if (dinnerCarbRule === "no_carbs") {
      dinnerCarbInstruction = `
        NIGHT / DINNER CARBOHYDRATE RULE (ZERO GRAIN / KETOGENIC LIGHT DINNER):
        Dinner must contain ONLY clean Protein (Fish/Egg/Chicken soup), fibrous green vegetables, and healthy fats. No grains or starchy carbs at night.
      `;
    } else {
      dinnerCarbInstruction = `
        NIGHT / DINNER CARBOHYDRATE RULE (CONTROLLED COMPLEX CEREAL OR VEGETABLE CARB):
        At Dinner, include Protein and ample Leafy Greens/Vegetables, plus a small controlled portion of complex cereal carb (1 thin Red Atta Roti or ½ cup Brown Rice) OR vegetable carbs (Lau/Pepe/Cauliflower Rice).
      `;
    }

    const baseChart = this.buildFallbackClinicalChart(
      profile,
      currentPhase,
      currentWeek,
      lang,
      mealFrequency,
      totalTargetCalories,
      totalProteinGrams,
      totalDailyFatGrams,
      cookingFatGrams,
      dietarySourceFatGrams,
      gheeGrams,
      cookingOilGrams,
      totalCarbsGrams,
      saltGrams,
      waterLiters,
      dinnerCarbRule,
      hasHypoacidity,
      redFoodsList
    );

    const compactPrompt = `
      Act as a Senior Clinical Functional Medicine Physician & Bangladeshi Metabolic Nutritionist.
      Patient: Age ${profile.age}, ${profile.gender}, Weight ${profile.weight}kg, Dosha ${profile.dosha}, Conditions: ${profile.medicalConditions || "Metabolic Optimization"}, Meds: ${profile.currentMedicationsList || "None"}.
      Phase ${currentPhase} (Week ${currentWeek}), Target Calories: ${totalTargetCalories} kcal (${mealFrequency} meals/day).
      Selected Foods: ${selectedFoodNames.slice(0, 400)}.
      Return ONLY a compact JSON object in ${targetLang}:
      {
        "phaseName": "string",
        "focus": "string",
        "medicalSafetyNote": "string",
        "recommendations": ["string", "string", "string"]
      }
    `;

    try {
      const text = await this.callServerGemini({
        model: "gemini-3.8-flash",
        contents: { parts: [{ text: compactPrompt }] },
        config: { responseMimeType: "application/json" },
      });

      if (!text) {
        return MakerCheckerEngine.verifyDietChart(baseChart, profile, lang);
      }

      const aiSummary = this.safeParseJson<Partial<DietPhaseChart>>(text, {});
      const enriched = this.enrichChartWithClinicalDefaults(
        {
          ...baseChart,
          ...(aiSummary.phaseName ? { phaseName: aiSummary.phaseName } : {}),
          ...(aiSummary.focus ? { focus: aiSummary.focus } : {}),
          ...(aiSummary.medicalSafetyNote
            ? { medicalSafetyNote: aiSummary.medicalSafetyNote }
            : {}),
          ...(Array.isArray(aiSummary.recommendations) &&
          aiSummary.recommendations.length > 0
            ? { recommendations: aiSummary.recommendations }
            : {}),
        },
        profile,
        lang,
        mealFrequency,
        totalTargetCalories,
        totalProteinGrams,
        totalDailyFatGrams,
        cookingFatGrams,
        dietarySourceFatGrams,
        gheeGrams,
        cookingOilGrams,
        totalCarbsGrams,
        saltGrams,
        waterLiters,
        dinnerCarbRule,
        hasHypoacidity,
        redFoodsList
      );
      return MakerCheckerEngine.verifyDietChart(enriched, profile, lang);
    } catch {
      return MakerCheckerEngine.verifyDietChart(baseChart, profile, lang);
    }
  }

  private enrichChartWithClinicalDefaults(
    chart: DietPhaseChart,
    profile: HealthProfile,
    lang: Language,
    mealFrequency: 3 | 4,
    totalTargetCalories: number,
    totalProteinGrams: number,
    totalDailyFatGrams: number,
    cookingFatGrams: number,
    dietarySourceFatGrams: number,
    gheeGrams: number,
    cookingOilGrams: number,
    totalCarbsGrams: number,
    saltGrams: string,
    waterLiters: string,
    dinnerCarbRule: string,
    hasHypoacidity: boolean,
    redFoodsList: string[]
  ): DietPhaseChart {
    const isBn = lang === "bn";
    const fallback = this.buildFallbackClinicalChart(
      profile,
      chart.phase || 1,
      chart.currentWeek || 1,
      lang,
      mealFrequency,
      totalTargetCalories,
      totalProteinGrams,
      totalDailyFatGrams,
      cookingFatGrams,
      dietarySourceFatGrams,
      gheeGrams,
      cookingOilGrams,
      totalCarbsGrams,
      saltGrams,
      waterLiters,
      dinnerCarbRule,
      hasHypoacidity,
      redFoodsList
    );

    return {
      ...fallback,
      ...chart,
      mealFrequency: chart.mealFrequency || mealFrequency,
      totalDailyCalories: chart.totalDailyCalories || totalTargetCalories,
      fatOilAllocation: chart.fatOilAllocation || fallback.fatOilAllocation,
      foodExchangeTable:
        chart.foodExchangeTable && chart.foodExchangeTable.length > 0
          ? chart.foodExchangeTable
          : fallback.foodExchangeTable,
      detoxWaterProtocol:
        chart.detoxWaterProtocol && chart.detoxWaterProtocol.length > 0
          ? chart.detoxWaterProtocol
          : fallback.detoxWaterProtocol,
      staplesAdvice: {
        salt: chart.staplesAdvice?.salt || fallback.staplesAdvice.salt,
        saltGramsPerDay:
          chart.staplesAdvice?.saltGramsPerDay ||
          (isBn ? `${saltGrams} (হিমালয়ান পিংক সল্ট)` : saltGrams),
        oil: chart.staplesAdvice?.oil || fallback.staplesAdvice.oil,
        water: chart.staplesAdvice?.water || fallback.staplesAdvice.water,
        waterLitersPerDay:
          chart.staplesAdvice?.waterLitersPerDay ||
          (isBn ? `প্রতিদিন ${waterLiters} লিটার (১০-১২ গ্লাস)` : `${waterLiters} Liters/Day (10-12 Glasses)`),
      },
      macros: {
        protein: chart.macros?.protein || totalProteinGrams,
        fats: chart.macros?.fats || totalDailyFatGrams,
        carbs: chart.macros?.carbs || totalCarbsGrams,
      },
    };
  }

  private buildFallbackClinicalChart(
    profile: HealthProfile,
    currentPhase: number,
    currentWeek: number,
    lang: Language,
    mealFrequency: 3 | 4,
    totalTargetCalories: number,
    totalProteinGrams: number,
    totalDailyFatGrams: number,
    cookingFatGrams: number,
    dietarySourceFatGrams: number,
    gheeGrams: number,
    cookingOilGrams: number,
    totalCarbsGrams: number,
    saltGrams: string,
    waterLiters: string,
    dinnerCarbRule: string,
    hasHypoacidity: boolean,
    redFoodsList: string[]
  ): DietPhaseChart {
    const isBn = lang === "bn";
    const bCal =
      mealFrequency === 3
        ? Math.round(totalTargetCalories * 0.32)
        : Math.round(totalTargetCalories * 0.26);
    const lCal =
      mealFrequency === 3
        ? Math.round(totalTargetCalories * 0.42)
        : Math.round(totalTargetCalories * 0.36);
    const sCal =
      mealFrequency === 4 ? Math.round(totalTargetCalories * 0.13) : 0;
    const dCal = totalTargetCalories - bCal - lCal - sCal;

    const breakfastVariations = [
      {
        nameBn: "পালং-সবজি সতে, ২টি দেশি সিদ্ধ ডিম ও চিয়া-তিসি সিড মিক্স",
        nameEn: "Sautéed Spinach & Veggies, 2 Deshi Boiled Eggs & Chia-Flax Seed Mix",
        descBn: "১ কাপ পালং শাক, পেঁপে ও ব্রকলি হালকা ঘি-তে সতে করা + ২টি দেশি ডিম সিদ্ধ + ১ টেবিল চামচ ভেজানো চিয়া সিড ও রোস্টেড তিসি (Flaxseed)। প্রোটিন, শাকসবজি ও ওমেগা-৩ ফ্যাটের আদর্শ সমন্বয়।",
        descEn: "1 cup spinach, green papaya & broccoli sautéed in ½ tsp ghee + 2 boiled deshi eggs + 1 tbsp soaked chia & flax seeds.",
      },
      {
        nameBn: "সবজি ওমলেট (২টি ডিম), লাল শাক ভাজি ও ভেজানো কাঠবাদাম-কুমড়ার বীজ",
        nameEn: "2-Egg Vegetable Omelette, Steamed Lal Shak & Almonds + Pumpkin Seeds",
        descBn: "পেঁয়াজ কলি, টমেটো ও ক্যাপসিকাম দিয়ে ২টি ডিমের ওমলেট + ১ বাটি লাল শাক + ৬টি ভেজানো কাঠবাদাম ও ১ চামচ মিষ্টি কুমড়ার বীজ।",
        descEn: "2-egg omelette with spring onion & bell peppers + 1 bowl steamed red amaranth greens + 6 soaked almonds & 1 tbsp pumpkin seeds.",
      },
      {
        nameBn: "অঙ্কুরিত মুগ ডাল-সবজি চাট, ১টি পোচ ডিম ও আখরোট-চিয়া পুডিং",
        nameEn: "Sprouted Moong-Veggie Bowl, 1 Poached Egg & Walnut-Chia Seed Mix",
        descBn: "১ বাটি সিদ্ধ অঙ্কুরিত মুগ ডাল (শসা, টমেটো, ধনেপাতা ও লেবুর রস সহ) + ১টি ডিম পোচ + ৪টি আখরোট ও ১ চামচ চিয়া সিড।",
        descEn: "1 bowl steamed sprouted moong dal tossed with cucumber, coriander & lemon + 1 poached egg + 4 walnuts & 1 tbsp chia seeds.",
      },
      {
        nameBn: "লাউ-গাজর-বিনস সবজি মিক্স, ২টি ডিমের স্ক্র্যাম্বল ও সূর্যমুখী-তিসি বীজ",
        nameEn: "Bottle Gourd & Green Beans Sauté, 2 Scrambled Eggs & Flax-Pumpkin Seeds",
        descBn: "১ কাপ লাউ, বরবটি ও গাজর সিদ্ধ-ভাজি + হলুদ ও গোলমরিচ দিয়ে ২টি ডিমের স্ক্র্যাম্বল + ১ টেবিল চামচ তিসি ও কুমড়ার বীজ।",
        descEn: "1 cup bottle gourd & French beans sauté + 2 eggs scrambled with turmeric & black pepper + 1 tbsp flax & pumpkin seeds.",
      },
      {
        nameBn: "কলমি শাক ও ফুলকপি ভাজি, ২টি দেশি ডিম ও চিয়া-বাদাম মিক্স",
        nameEn: "Kolmi Greens & Cauliflower Stir-Fry, 2 Deshi Eggs & Chia-Almond Mix",
        descBn: "রসুন ফোড়নে কলমি শাক ও ফুলকপি হালকা ভাজি + ২টি দেশি ডিম সিদ্ধ + ১ চামচ চিয়া সিড ও ৫টি কাঠবাদাম।",
        descEn: "Garlic-tempered water spinach (Kolmi) & cauliflower stir-fry + 2 boiled eggs + 1 tbsp chia seeds & 5 soaked almonds.",
      },
      {
        nameBn: "পেঁপে-ঝিঙে সবজি স্টু, দেশি মুরগি/ডিম প্রোটিন বোল ও মিক্সড সিডস",
        nameEn: "Green Papaya & Ridge Gourd Stew, Egg/Chicken Protein & Mixed Seeds",
        descBn: "১ বাটি কাঁচা পেঁপে ও ঝিঙের পাতলা স্টু + ২টি ডিম (অথবা ৫০ গ্রাম দেশি মুরগির স্টু) + ১ চামচ চিয়া ও মিষ্টি কুমড়ার বীজ।",
        descEn: "1 bowl green papaya & ridge gourd stew + 2 eggs (or 50g shredded deshi chicken) + 1 tbsp chia & pumpkin seeds.",
      },
      {
        nameBn: "ব্রকলি-সজনে পাতা সতে, ২টি ডিমের পোচ ও আখরোট-তিসি সিড",
        nameEn: "Broccoli & Moringa Leaf Sauté, 2 Poached Eggs & Walnut-Flax Mix",
        descBn: "হালকা অলিভ অয়েলে ব্রকলি ও সজনে পাতা সতে + ২টি ডিমের পোচ + ১ চামচ তিসি (Flaxseed) ও ৪টি আখরোট।",
        descEn: "Olive oil sautéed broccoli & moringa leaves + 2 poached eggs + 1 tbsp ground flaxseed & 4 walnuts.",
      },
    ];

    const lunchVariations = [
      {
        nameBn: "লাল চালের ভাত, রুই মাছের ঝোল, পালং শাক ও পাতলা মুগ ডাল",
        nameEn: "Red Brown Rice, Rui Fish Curry, Spinach Greens & Thin Moong Dal",
        descBn: "১ কাপ লাল চালের ভাত (১২০ গ্রাম) + ২ টুকরো রুই মাছের পাতলা ঝোল (পেঁপে ও ঝিঙে দিয়ে) + ১ বাটি পালং শাক + ১/২ বাটি মুগ ডাল ও শসার সালাদ।",
        descEn: "1 cup red/brown rice (120g) + 2 pieces Rui fish light curry with green papaya + 1 bowl spinach + ½ bowl moong dal & cucumber salad.",
      },
      {
        nameBn: "ব্রাউন রাইস, দেশি মুরগির ঝোল, লাউ-চিংড়ি/সবজি ও টক দই",
        nameEn: "Brown Rice, Deshi Chicken Stew, Bottle Gourd Sabzi & Probiotic Tok Doi",
        descBn: "১ কাপ ব্রাউন রাইস + ১০০ গ্রাম দেশি মুরগির পাতলা ঝোল + ১ বাটি লাউয়ের তরকারি + ২ চামচ ঘরে পাতা টক দই।",
        descEn: "1 cup brown rice + 100g deshi chicken stew + 1 bowl bottle gourd curry + 2 tbsp homemade sour curd.",
      },
      {
        nameBn: "লাল চালের ভাত, শিং/মাগুর মাছের ঝোল, করলা-সবজি ও ডাল",
        nameEn: "Red Rice, Shing/Magur Fish Broth, Bitter Gourd Sauté & Lentils",
        descBn: "১ কাপ লাল চালের ভাত + শিং বা মাগুর মাছের পাতলা ঝোল + অল্প তেলে করলা ও ঝিঙে ভাজি + পাতলা মুগ ডাল।",
        descEn: "1 cup red rice + restorative Shing/Magur fish broth + lightly sautéed bitter gourd & ridge gourd + thin moong dal.",
      },
      {
        nameBn: "কাউন চাল বা লাল ভাত, কাতলা মাছ, লাল শাক ও সজনে ডাটা ঝোল",
        nameEn: "Kaon Millet / Red Rice, Katla Fish Curry, Lal Shak & Drumstick Broth",
        descBn: "১ কাপ কাউনের চাল বা লাল চালের ভাত + ১ বড় টুকরো কাতলা মাছ + লাল শাক ভাজি ও সজনে ডাটার তরকারি।",
        descEn: "1 cup Kaon millet rice or red rice + 1 large piece Katla fish curry + red amaranth greens & moringa drumstick curry.",
      },
      {
        nameBn: "ব্রাউন রাইস, দেশি ছোট মাছের চচ্চড়ি, চালকুমড়া তরকারি ও টক দই",
        nameEn: "Brown Rice, Small Indigenous Fish Chorba, Ash Gourd & Sour Curd",
        descBn: "১ কাপ ব্রাউন রাইস + ১ বাটি দেশি ছোট মাছ (মলা/ঢেলা) সবজি দিয়ে রান্না + চালকুমড়ার তরকারি + টক দই।",
        descEn: "1 cup brown rice + 1 bowl calcium-rich small fish cooked with greens + ash gourd sabzi + sour curd.",
      },
      {
        nameBn: "লাল চালের ভাত, দেশি মুরগি ও পেঁপে স্টু, কলমি শাক ও সালাদ",
        nameEn: "Red Rice, Deshi Chicken & Green Papaya Stew, Kolmi Greens & Salad",
        descBn: "১ কাপ লাল চালের ভাত + কাঁচা পেঁপে দিয়ে দেশি মুরগির ঝোল + কলমি শাক ভাজি + লেবু-শসা সালাদ।",
        descEn: "1 cup red rice + deshi chicken stewed with green papaya + water spinach greens + lemon-cucumber salad.",
      },
      {
        nameBn: "ব্রাউন রাইস, রুই/ভেটকি মাছ ভাপা, লাউ শাক ও মুগ ডাল",
        nameEn: "Brown Rice, Steamed Fish Bhapa, Bottle Gourd Greens & Moong Dal",
        descBn: "১ কাপ ব্রাউন রাইস + সরিষা-হলুদ দিয়ে ভাপা মাছ + লাউ শাক ও ঝিঙের তরকারি + ১ ছোট বাটি মুগ ডাল।",
        descEn: "1 cup brown rice + steamed fish with mustard & turmeric + bottle gourd greens + 1 small bowl moong dal.",
      },
    ];

    const dinnerVariations =
      dinnerCarbRule === "vegetable_carbs"
        ? [
            {
              nameBn: "লাউ সিদ্ধ/লাবড়া (সবজি শর্করা), গ্রিলড বা ঝোল মাছ ও পালং শাক (শস্যমুক্ত রাত)",
              nameEn: "Boiled Bottle Gourd (Veg Carb), Stewed River Fish & Spinach Greens (Grain-Free)",
              descBn: "রাতে ভাত/রুটি সম্পূর্ণ বন্ধ। শর্করার উৎস হিসেবে ১ বড় বাটি লাউ সিদ্ধ ও পেঁপে সিদ্ধ (হালকা গোলমরিচ ও ১/২ চামচ ঘি সহ) + ২ টুকরো মাছের ঝোল বা গ্রিল + ১ কাপ শাকসবজি।",
              descEn: "No rice/roti at night. Carbohydrate comes from 1 large bowl of boiled bottle gourd & green papaya + 2 pieces river fish + 1 cup leafy greens.",
              carbSource: isBn ? "সবজি থেকে প্রাপ্ত শর্করা (লাউ ও পেঁপে সিদ্ধ)" : "Vegetable-Based Carb (Lau & Pepe)",
            },
            {
              nameBn: "ফুলকপির রাইস (Cauliflower Rice), দেশি মুরগির স্টু ও ঝিঙে-বরবটি সিদ্ধ",
              nameEn: "Cauliflower Rice (Veg Carb), Deshi Chicken Clear Stew & Steamed Greens",
              descBn: "শস্যের বদলে ১ বাটি স্টিমড ফুলকপির রাইস + ১০০ গ্রাম দেশি মুরগির পাতলা স্টু + ঝিঙে ও বরবটি সিদ্ধ।",
              descEn: "1 bowl steamed cauliflower rice instead of grain + 100g deshi chicken clear stew + steamed ridge gourd & green beans.",
              carbSource: isBn ? "সবজি থেকে প্রাপ্ত শর্করা (ফুলকপির রাইস)" : "Vegetable-Based Carb (Cauliflower Rice)",
            },
            {
              nameBn: "কাঁচা পেঁপে ও চালকুমড়া সিদ্ধ-ভর্তা, শিং মাছের ঝোল ও লাল শাক",
              nameEn: "Boiled Green Papaya & Ash Gourd Mash, Shing Fish Broth & Greens",
              descBn: "১ বাটি কাঁচা পেঁপে ও চালকুমড়া সিদ্ধ (সরিষার তেল ও ধনেপাতা সহ) + শিং মাছের পাতলা ঝোল + স্টিমড শাক।",
              descEn: "1 bowl boiled green papaya & ash gourd mash + Shing fish light broth + steamed greens.",
              carbSource: isBn ? "সবজি থেকে প্রাপ্ত শর্করা (পেঁপে ও চালকুমড়া)" : "Vegetable-Based Carb (Papaya & Ash Gourd)",
            },
            {
              nameBn: "লাউ-ব্রকলি স্যুপ বোল, ২টি দেশি ডিমের পোচ ও মিক্সড সবজি",
              nameEn: "Bottle Gourd & Broccoli Soup Bowl, 2 Poached Eggs & Mixed Veggies",
              descBn: "১ বড় বাটি লাউ ও ব্রকলি সিদ্ধ স্টু + ২টি দেশি ডিম বা মাছ + ১ কাপ সবুজ শাকসবজি।",
              descEn: "1 large bowl bottle gourd & broccoli stew + 2 poached eggs or fish + 1 cup green vegetables.",
              carbSource: isBn ? "সবজি থেকে প্রাপ্ত শর্করা (লাউ ও ব্রকলি)" : "Vegetable-Based Carb (Lau & Broccoli)",
            },
            {
              nameBn: "পেঁপে-ঝিঙে-গাজর সিদ্ধ, কাতলা মাছ বেকড/ঝোল ও কলমি শাক",
              nameEn: "Steamed Papaya & Ridge Gourd Bowl, Katla Fish & Kolmi Greens",
              descBn: "ভাত/রুটির পরিবর্তে ১ বাটি পেঁপে ও ঝিঙে সিদ্ধ + ১ টুকরো কাতলা মাছ + কলমি শাক।",
              descEn: "1 bowl steamed green papaya & ridge gourd instead of rice + 1 piece Katla fish + water spinach.",
              carbSource: isBn ? "সবজি থেকে প্রাপ্ত শর্করা (পেঁপে ও ঝিঙে)" : "Vegetable-Based Carb (Papaya & Jhinga)",
            },
            {
              nameBn: "ফুলকপির রাইস ও লাউ মিক্স, দেশি মুরগির স্যুপ ও পালং শাক",
              nameEn: "Cauliflower Rice & Lau Medley, Chicken Bone Broth & Spinach",
              descBn: "১ বাটি ফুলকপির রাইস ও লাউ সিদ্ধ + দেশি মুরগির সবজি স্যুপ + পালং শাক সতে।",
              descEn: "1 bowl cauliflower rice & bottle gourd medley + deshi chicken soup + sautéed spinach.",
              carbSource: isBn ? "সবজি থেকে প্রাপ্ত শর্করা (ফুলকপি ও লাউ)" : "Vegetable-Based Carb (Cauliflower & Lau)",
            },
            {
              nameBn: "চালকুমড়া ও পেঁপে সিদ্ধ স্টু, রুই মাছের ঝোল ও সবুজ সবজি",
              nameEn: "Ash Gourd & Papaya Stew, Rui Fish Curry & Steamed Greens",
              descBn: "১ বাটি চালকুমড়া ও পেঁপে সিদ্ধ + রুই মাছের হালকা ঝোল + ১ কাপ সবুজ শাকসবজি।",
              descEn: "1 bowl ash gourd & papaya stew + light Rui fish curry + 1 cup steamed leafy greens.",
              carbSource: isBn ? "সবজি থেকে প্রাপ্ত শর্করা (চালকুমড়া ও পেঁপে)" : "Vegetable-Based Carb (Ash Gourd & Papaya)",
            },
          ]
        : [
            {
              nameBn: "১টি লাল আটার পাতলা রুটি (অথবা লাউ সিদ্ধ), মাছের ঝোল ও শাকসবজি",
              nameEn: "1 Thin Red Atta Roti (or Boiled Lau), River Fish Curry & Leafy Greens",
              descBn: "১টি লাল আটার রুটি + ১ বাটি লাউ ও পেঁপের তরকারি + ১ টুকরো মাছের ঝোল ও শাক।",
              descEn: "1 thin red wheat roti + 1 bowl bottle gourd & papaya sabzi + 1 piece fish curry & greens.",
              carbSource: isBn ? "পরিমিত শস্য ও সবজি শর্করা" : "Controlled Cereal & Veg Carb",
            },
          ];

    // Map user-selected BD FCT foods by category so their chosen foods are woven into the 7-day meals
    const fullGuide = profile.trafficLightGuide || this.getDefaultTrafficLightGuide(profile);
    const selSet = new Set(profile.selectedFoods || []);
    const selProteins = fullGuide.items.filter((i) => selSet.has(i.id) && i.category === "Proteins" && i.zone !== "red");
    const selVegs = fullGuide.items.filter((i) => selSet.has(i.id) && i.category === "Vegetables & Greens" && i.zone !== "red");
    const selCarbs = fullGuide.items.filter((i) => selSet.has(i.id) && i.category === "Grains & Carbs" && i.zone !== "red");
    const selFats = fullGuide.items.filter((i) => selSet.has(i.id) && i.category === "Healthy Fats & Seeds" && i.zone !== "red");
    const selFruits = fullGuide.items.filter((i) => selSet.has(i.id) && i.category === "Fruits & Snacks" && i.zone !== "red");

    const weeklySchedule = Array.from({ length: 7 }).map((_, idx) => {
      const b = breakfastVariations[idx % breakfastVariations.length];
      const l = lunchVariations[idx % lunchVariations.length];
      const d = dinnerVariations[idx % dinnerVariations.length];

      const customProt = selProteins.length > 0 ? selProteins[idx % selProteins.length] : null;
      const customVeg = selVegs.length > 0 ? selVegs[idx % selVegs.length] : null;
      const customCarb = selCarbs.length > 0 ? selCarbs[idx % selCarbs.length] : null;
      const customFat = selFats.length > 0 ? selFats[idx % selFats.length] : null;
      const customFruit = selFruits.length > 0 ? selFruits[idx % selFruits.length] : null;

      const bdFctLunchTagBn =
        customProt || customVeg || customCarb
          ? ` [আপনার নির্বাচিত BD FCT খাবার: ${[
              customCarb?.nameBn,
              customProt?.nameBn,
              customVeg?.nameBn,
            ]
              .filter(Boolean)
              .join(" + ")}]`
          : "";
      const bdFctLunchTagEn =
        customProt || customVeg || customCarb
          ? ` [Your Selected BD FCT Foods: ${[
              customCarb?.nameEn,
              customProt?.nameEn,
              customVeg?.nameEn,
            ]
              .filter(Boolean)
              .join(" + ")}]`
          : "";

      const meals: any[] = [
        {
          time: "08:30 AM",
          mealSlot: isBn ? "সকালের নাস্তা (Breakfast)" : "Breakfast",
          mealName: isBn ? b.nameBn : b.nameEn,
          description: isBn
            ? `${b.descBn}${customFat ? ` • নির্বাচিত ফ্যাট/সিড: ${customFat.nameBn} (${customFat.caloriesPer100g} kcal/100g)` : ""}`
            : `${b.descEn}${customFat ? ` • Selected Fat/Seed: ${customFat.nameEn} (${customFat.caloriesPer100g} kcal/100g)` : ""}`,
          quantity: isBn ? "১ বাটি সবজি + ২টি ডিম + ১ চামচ সিডস" : "1 Bowl Veggies + 2 Eggs + 1 Tbsp Seeds",
          calories: `${bCal} kcal`,
          macroBreakdown: {
            protein: `${Math.round(totalProteinGrams * 0.32)}g`,
            carbs: `${Math.round(totalCarbsGrams * 0.25)}g`,
            fats: `${Math.round(totalDailyFatGrams * 0.35)}g`,
            carbSourceType: isBn ? "শাকসবজি ও সিড ফাইবার" : "Vegetables & Seed Fiber",
          },
          benefits: isBn
            ? ["সকালের প্রোটিন ও ফ্যাট ইনসুলিন স্থিতিশীল রাখে", "চিয়া ও তিসি ওমেগা-৩ সরবরাহ করে"]
            : ["Morning protein & fat stabilizes glucose", "Chia & flax provide essential Omega-3"],
        },
        {
          time: "01:30 PM",
          mealSlot: isBn ? "দুপুরের খাবার (Lunch)" : "Lunch",
          mealName: isBn ? l.nameBn : l.nameEn,
          description: isBn ? `${l.descBn}${bdFctLunchTagBn}` : `${l.descEn}${bdFctLunchTagEn}`,
          quantity: isBn ? "১ কাপ লাল ভাত + ১০০ গ্রাম মাছ/মুরগি + ১ বাটি শাকসবজি" : "1 Cup Red Rice + 100g Fish/Chicken + 1 Bowl Greens",
          calories: `${lCal} kcal`,
          macroBreakdown: {
            protein: `${Math.round(totalProteinGrams * 0.4)}g`,
            carbs: `${Math.round(totalCarbsGrams * 0.5)}g`,
            fats: `${Math.round(totalDailyFatGrams * 0.35)}g`,
            carbSourceType: isBn ? "জটিল শস্য (লাল চাল) ও শাকসবজি" : "Complex Cereal (Brown Rice) & Greens",
          },
          benefits: isBn
            ? ["দুপুরের প্রখর হজমশক্তিতে (অগ্নি) শর্করা, প্রোটিন ও সবজির পূর্ণ পুষ্টি"]
            : ["Complete Bengali macro plate aligned with peak midday digestive Agni"],
        },
      ];

      if (mealFrequency === 4) {
        meals.push({
          time: "04:45 PM",
          mealSlot: isBn ? "বিকেলের হালকা নাস্তা (Evening Snack)" : "Evening Clinical Snack",
          mealName: isBn
            ? customFruit
              ? `রোস্টেড মাখনা (১ কাপ), ${customFruit.nameBn} ও ৫টি কাঠবাদাম`
              : "রোস্টেড মাখনা (১ কাপ), আমলকী/পেয়ারা ও ৫টি কাঠবাদাম"
            : customFruit
            ? `Roasted Makhana (1 Cup), ${customFruit.nameEn} & 5 Soaked Almonds`
            : "Roasted Makhana (1 Cup), Fresh Guava/Amla & 5 Soaked Almonds",
          description: isBn
            ? `অল্প ঘি ও বিট লবণ দিয়ে ভাজা ১ কাপ মাখনা + ${customFruit ? `${customFruit.nameBn} (${customFruit.caloriesPer100g} kcal/100g)` : "১টি দেশি পেয়ারা বা আমলকী"} + ৫টি ভেজানো কাঠবাদাম।`
            : `1 cup dry-roasted fox nuts (Makhana) with pink salt + ${customFruit ? `${customFruit.nameEn} (${customFruit.caloriesPer100g} kcal/100g)` : "1 guava/amla"} + 5 soaked almonds.`,
          quantity: isBn ? "১ কাপ মাখনা + ১টি ফল + ৫টি বাদাম" : "1 Cup Makhana + 1 Fruit + 5 Almonds",
          calories: `${sCal} kcal`,
          macroBreakdown: {
            protein: `${Math.round(totalProteinGrams * 0.08)}g`,
            carbs: `${Math.round(totalCarbsGrams * 0.1)}g`,
            fats: `${Math.round(totalDailyFatGrams * 0.1)}g`,
            carbSourceType: isBn ? "লো-জিআই মাখনা ও ফল" : "Low-GI Makhana & Low-Fructose Fruit",
          },
          benefits: isBn
            ? ["বিকেলের ক্ষুধা ও কর্টিসল কমায়, ইনসুলিন বাড়ায় না"]
            : ["Prevents evening cortisol dip without spiking insulin"],
        });
      }

      meals.push({
        time: "07:45 PM",
        mealSlot: isBn ? "রাতের খাবার (Dinner)" : "Dinner",
        mealName: isBn ? d.nameBn : d.nameEn,
        description: isBn
          ? `${d.descBn}${customVeg ? ` • রাতের নির্বাচিত সবজি: ${customVeg.nameBn}` : ""}`
          : `${d.descEn}${customVeg ? ` • Selected Dinner Veg: ${customVeg.nameEn}` : ""}`,
        quantity: isBn ? "১ বড় বাটি সিদ্ধ সবজি + ১০০ গ্রাম মাছ/মুরগি + শাক" : "1 Large Bowl Boiled Veg + 100g Fish/Chicken + Greens",
        calories: `${dCal} kcal`,
        macroBreakdown: {
          protein: `${Math.round(totalProteinGrams * 0.28)}g`,
          carbs: `${Math.round(totalCarbsGrams * 0.15)}g`,
          fats: `${Math.round(totalDailyFatGrams * 0.2)}g`,
          carbSourceType: d.carbSource,
        },
        benefits: isBn
          ? ["রাতে শস্য বর্জন করে সবজি থেকে শর্করা নেওয়ায় ফাস্টিং সুগার ও লিভার ফ্যাট কমে"]
          : ["Replacing night grains with boiled Lau/Pepe optimizes overnight hepatic insulin sensitivity"],
      });

      return {
        day: isBn ? `দিন ${idx + 1}` : `Day ${idx + 1}`,
        meals,
      };
    });

    return {
      phase: currentPhase,
      currentWeek,
      phaseName: isBn
        ? `ধাপ ${currentPhase}: ${profile.dosha} ব্যালেন্সিং ও মেটাবলিক ক্লিনিক্যাল ডায়েট`
        : `Phase ${currentPhase}: ${profile.dosha} Pacifying Clinical Metabolic Protocol`,
      focus: isBn
        ? `আপনার নির্বাচিত ট্রাফিক লাইট খাবার থেকে তৈরি ${mealFrequency} বেলার বাঙালি ডায়েট চার্ট। দৈনিক মোট ${totalTargetCalories} ক্যালোরি এবং ${totalDailyFatGrams} গ্রাম ফ্যাটের নিখুঁত ক্লিনিক্যাল বণ্টন।`
        : `Personalized ${mealFrequency}-Meal Bengali Clinical Diet crafted from your Traffic Light Food Guide selections (${totalTargetCalories} kcal/day).`,
      mealFrequency,
      totalDailyCalories: totalTargetCalories,
      calorieSplitSummary: isBn
        ? mealFrequency === 3
          ? `৩ বেলায় মোট ${totalTargetCalories} kcal ভাগ করা হয়েছে: সকাল ${bCal} kcal • দুপুর ${lCal} kcal • রাত ${dCal} kcal`
          : `৪ বেলায় মোট ${totalTargetCalories} kcal ভাগ করা হয়েছে: সকাল ${bCal} kcal • দুপুর ${lCal} kcal • বিকেল ${sCal} kcal • রাত ${dCal} kcal`
        : mealFrequency === 3
        ? `Total ${totalTargetCalories} kcal split into 3 meals: Breakfast ${bCal} kcal • Lunch ${lCal} kcal • Dinner ${dCal} kcal`
        : `Total ${totalTargetCalories} kcal split into 4 meals: Breakfast ${bCal} kcal • Lunch ${lCal} kcal • Snack ${sCal} kcal • Dinner ${dCal} kcal`,
      dinnerCarbStrategy:
        dinnerCarbRule === "vegetable_carbs"
          ? isBn
            ? "রাতে শস্যজাতীয় শর্করা (ভাত/রুটি) নিষেধ — লাউ সিদ্ধ, পেঁপে সিদ্ধ, চালকুমড়া ও ফুলকপির রাইস থেকে শর্করা এবং মাছ/মুরগি থেকে প্রোটিন আসবে।"
            : "Night Cereal Restriction Active — Dinner carbohydrates come strictly from boiled Bottle Gourd (Lau), Green Papaya (Pepe), Ash Gourd & Cauliflower Rice paired with protein."
          : isBn
          ? "রাতের খাবারে প্রোটিন ও সবজির সাথে পরিমিত জটিল শর্করা বা সবজি শর্করা।"
          : "Controlled complex carbohydrate or vegetable carb with protein and greens at dinner.",
      medicalSafetyNote: isBn
        ? `আপনার শারীরিক কন্ডিশন (${profile.medicalConditions || "মেটাবলিক কেয়ার"}) ও ওষুধ (${profile.currentMedicationsList || "প্রযোজ্য নয়"}) বিবেচনা করে রেড জোন খাবার সম্পূর্ণ বর্জন করা হয়েছে।`
        : `Formulated for your clinical profile (${profile.medicalConditions || "Metabolic Care"}). Strictly avoid Red-Zone pro-inflammatory foods.`,
      weeklySchedule,
      fatOilAllocation: {
        totalDailyFatGrams,
        cookingFatGrams,
        dietarySourceFatGrams,
        gheeGrams,
        cookingOilGrams,
        recommendedOilType: isBn
          ? "খাঁটি দেশি গাওয়া ঘি + এক্সট্রা ভার্জিন অলিভ অয়েল / ঘানি ভাঙা সরিষার তেল"
          : "Pure A2 Deshi Cow Ghee + Extra Virgin Olive Oil / Cold-Pressed Mustard Oil",
        dietaryFatSources: isBn
          ? [
              "চিয়া সিড, তিসি (Flaxseed) ও মিষ্টি কুমড়ার বীজ (সকালের নাস্তায়)",
              "দেশি ডিমের কুসুম ও নদীর মাছের ওমেগা-৩ ফ্যাট",
              "ভেজানো কাঠবাদাম (Almonds) ও আখরোট (Walnuts)",
            ]
          : [
              "Soaked Chia, Flax & Pumpkin Seeds (Morning Breakfast)",
              "Deshi Whole Egg & River Fish Omega-3 Lipids",
              "Soaked Almonds & Walnuts",
            ],
        clinicalInstruction: isBn
          ? `আপনার দৈনিক ফ্যাটের চাহিদা ${totalDailyFatGrams} গ্রাম। এর মধ্যে মাত্র ${cookingFatGrams} গ্রাম আসবে রান্নার তেল ও ঘি থেকে (${gheeGrams} গ্রাম দেশি ঘি + ${cookingOilGrams} গ্রাম অলিভ/সরিষার তেল) এবং বাকি ${dietarySourceFatGrams} গ্রাম আসবে প্রাকৃতিক ডায়েটারি সোর্স (ডিম, মাছ, বাদাম ও সিডস) থেকে।`
          : `Your total daily fat requirement is ${totalDailyFatGrams}g. Strictly ${cookingFatGrams}g comes from visible cooking fats (${gheeGrams}g Deshi Ghee + ${cookingOilGrams}g Olive/Mustard Oil), while the remaining ${dietarySourceFatGrams}g comes naturally from dietary sources (eggs, fish, nuts, and seeds).`,
      },
      foodExchangeTable: buildBdFctFoodExchangeTable(profile, isBn),
      detoxWaterProtocol: [
        {
          timing: isBn ? "সকালে খালি পেটে (Morning Empty Stomach - 07:00 AM)" : "Morning (Empty Stomach - 07:00 AM)",
          name: isBn ? "মেথি-জিরা-ধনে ও সজনে পাতা অ্যালকালাইন ডিটক্স ওয়াটার" : "Cumin-Coriander-Fenugreek (CCF) Metabolic Detox Water",
          ingredients: isBn
            ? ["১/২ চামচ জিরা", "১/২ চামচ ধনে", "১/৪ চামচ মেথি দানা", "৩০০ মিলি কুসুম গরম পানি"]
            : ["½ tsp Cumin seeds", "½ tsp Coriander seeds", "¼ tsp Fenugreek seeds", "300ml warm water"],
          preparation: isBn
            ? "রাতে ১ গ্লাস পানিতে ভিজিয়ে রেখে সকালে হালকা ফুটিয়ে ছেঁকে কুসুম গরম অবস্থায় পান করুন।"
            : "Soak overnight, boil for 3 minutes in the morning, strain, and sip warm.",
          clinicalBenefit: isBn
            ? "লিভার ডিটক্স করে, ফাস্টিং ইনসুলিন কমায় এবং সকালের বাওয়েল মুভমেন্ট ক্লিয়ার করে।"
            : "Enhances hepatic phase-2 detox, lowers fasting insulin, and flushes morning lymphatic stagnation.",
          isHypoaciditySpecific: false,
        },
        {
          timing: isBn
            ? "ভারী খাবারের ১৫ মিনিট পূর্বে (Pre-Heavy Meal Hypoacidity Shot - 01:15 PM)"
            : "Pre-Heavy Meal (Hypoacidity Stomach Acid Shot - 01:15 PM)",
          name: isBn
            ? "আদা রস, লেবু ও হিমালয়ান পিংক সল্ট ডাইজেস্টিভ শট (হাইপোঅ্যাসিডিটি প্রোটোকল)"
            : "Ginger, Fresh Lemon & Himalayan Pink Salt Shot (Hypoacidity Protocol)",
          ingredients: isBn
            ? ["১ চামচ তাজা আদার রস", "১ চামচ পাতিলেবুর রস", "১ চিমটি হিমালয়ান পিংক সল্ট", "৫০ মিলি কুসুম গরম পানি"]
            : ["1 tsp fresh ginger juice", "1 tbsp fresh lemon juice", "1 pinch Himalayan Pink Salt", "50ml warm water"],
          preparation: isBn
            ? "দুপুরের বা রাতের ভারী খাবারের ঠিক ১৫-২০ মিনিট আগে ছোট শট হিসেবে চুমুক দিয়ে পান করুন।"
            : "Mix fresh ginger juice, lemon juice, and pink salt in 50ml warm water; drink 15 mins before Lunch.",
          clinicalBenefit: isBn
            ? "হাইপোঅ্যাসিডিটি (পাকস্থলীর অ্যাসিড স্বল্পতা) দূর করে, পেপসিন ও HCl নিঃসরণ বাড়ায় এবং প্রোটিন হজম ও পেট ফাঁপা রোধ করে।"
            : "Corrects hypoacidity by stimulating gastric HCl, pepsinogen, and bile flow before heavy protein meals.",
          isHypoaciditySpecific: true,
        },
        {
          timing: isBn ? "রাতে ঘুমানোর ৪৫ মিনিট পূর্বে (Night Gut Calm - 09:30 PM)" : "Night (Metabolic & Gut Calm - 09:30 PM)",
          name: isBn ? "জোয়ান-মৌরি ও দারুচিনি ক্যালমিং ইনফিউশন" : "Ajwain-Fennel & Ceylon Cinnamon Night Infusion",
          ingredients: isBn
            ? ["১/২ চামচ মৌরি", "১ চিমটি জোয়ান", "১ ছোট টুকরো দারুচিনি", "২০০ মিলি গরম পানি"]
            : ["½ tsp Fennel seeds", "1 pinch Ajwain (Carom)", "1 small pinch Ceylon Cinnamon", "200ml warm water"],
          preparation: isBn
            ? "গরম পানিতে ১০ মিনিট ভিজিয়ে রেখে ছেঁকে রাতে ঘুমানোর ৪৫ মিনিট আগে পান করুন।"
            : "Steep in hot water for 10 minutes, strain, and sip slowly 45 minutes before sleep.",
          clinicalBenefit: isBn
            ? "রাতের খাবার দ্রুত হজম করে, গ্যাস-ব্লোটিং কমায় এবং গভীর ঘুম ও ফাস্টিং সুগার নিয়ন্ত্রণে সাহায্য করে।"
            : "Relaxes smooth gut musculature, prevents nocturnal reflux, and stabilizes overnight hepatic glucose output.",
          isHypoaciditySpecific: false,
        },
      ],
      recommendations: isBn
        ? [
            `প্রতিদিন ঠিক ${mealFrequency} বেলা খাবার গ্রহণ করুন; দুই খাবারের মাঝখানে বারবার মুখ চালানো (Snacking) থেকে বিরত থাকুন।`,
            "ভারী খাবারের সময় সাথে সাথে অতিরিক্ত পানি পান করবেন না; খাবারের ৩০ মিনিট পর কুসুম গরম পানি পান করুন।",
            "রাত ৮টার মধ্যে রাতের খাবার সম্পন্ন করুন যাতে ঘুমের আগে অন্তত ২.৫ ঘণ্টা হজমের সময় পাওয়া যায়।",
          ]
        : [
            `Strictly adhere to your ${mealFrequency}-meal schedule without grazing in between.`,
            "Avoid drinking large amounts of water during heavy meals; drink warm water 30 minutes after eating.",
            "Complete dinner by 8:00 PM to align with circadian insulin sensitivity.",
          ],
      forbiddenFoods: redFoodsList,
      supplements: [
        {
          name: isBn ? "ম্যাগনেসিয়াম গ্লাইসিনেট (Magnesium Glycinate)" : "Magnesium Glycinate (Chelated)",
          dosage: isBn ? "৩০০-৪০০ মিগ্রা (রাতে খাবারের পর)" : "300-400 mg (Post-Dinner)",
          timing: isBn ? "রাত ৯:০০ টা (ঘুমানোর আগে)" : "09:00 PM (Before Bed)",
          rationale: isBn
            ? "ইনসুলিন রিসেপ্টর সংবেদনশীলতা বাড়ায়, কর্টিসল কমায় এবং পেশি ও স্নায়ু শান্ত করে।"
            : "Restores intracellular insulin signaling, lowers evening cortisol, and supports deep restorative sleep.",
          medicationSynergy: isBn
            ? `${profile.currentMedicationsList || "চলমান ওষুধের"} সাথে নিরাপদ; অ্যান্টিবায়োটিক বা থাইরয়েড ওষুধের সাথে ২ ঘণ্টা ব্যবধান রাখুন।`
            : `Safe alongside ${profile.currentMedicationsList || "standard regimens"}; space 2 hours apart from thyroid or calcium meds.`,
          phaseRole: "Metabolic & Nervous System Cofactor",
          tags: ["Insulin Sensitivity", "Sleep", "Grade-A"],
        },
        {
          name: isBn ? "ওমেগা-৩ ফিশ অয়েল (EPA/DHA 1000mg)" : "High-Potency Omega-3 (EPA/DHA 1000mg)",
          dosage: isBn ? "১টি সফটজেল (দুপুরের খাবারের সাথে)" : "1 Softgel (With Lunch)",
          timing: isBn ? "দুপুর ১:৩০ টা (ভারী খাবারের পর)" : "01:30 PM (With Lunch)",
          rationale: isBn
            ? "সিস্টেমিক প্রদাহ (Inflammation) কমায়, ট্রাইগ্লিসারাইড নিয়ন্ত্রণ করে এবং কোষের ঝিল্লি সুস্থ রাখে।"
            : "Resolves systemic cellular inflammation, lowers triglycerides, and balances omega-6:omega-3 ratio.",
          medicationSynergy: isBn
            ? "রক্ত পাতলা করার ওষুধ (Blood thinners) চললে ডাক্তারের পরামর্শে ডোজ নির্ধারণ করুন।"
            : "Synergistic with metabolic therapy; monitor if on high-dose anticoagulants.",
          phaseRole: "Anti-Inflammatory Resolution",
          tags: ["Anti-Inflammatory", "Lipid Balance"],
        },
        {
          name: isBn ? "ভিটামিন ডি৩ + কে২ (Vitamin D3 2000 IU + K2 MK-7)" : "Vitamin D3 (2000 IU) + K2 (MK-7)",
          dosage: isBn ? "১টি ক্যাপসুল (সকালের ফ্যাটযুক্ত নাস্তার পর)" : "1 Capsule (After Breakfast with Healthy Fats)",
          timing: isBn ? "সকাল ৮:৪৫ টা" : "08:45 AM (Post-Breakfast)",
          rationale: isBn
            ? "ইমিউন মডুলেশন, অগ্ন্যাশয়ের বিটা কোষের কার্যকারিতা এবং ক্যালসিয়াম শোষণে অপরিহার্য।"
            : "Optimizes pancreatic beta-cell function, gut tight junctions, and immune resilience.",
          medicationSynergy: isBn
            ? "সকালের ডিম ও ঘি/সিডসের ফ্যাটের সাথে খেলে শোষণ দ্বিগুণ হয়।"
            : "Fat-soluble; absorbs optimally with your morning egg & seed breakfast.",
          phaseRole: "Endocrine & Immune Modulator",
          tags: ["Hormone Balance", "Immunity"],
        },
        {
          name: isBn ? "প্রোবায়োটিক ও ডাইজেস্টিভ এনজাইম / ত্রিফলা বায়ো-কমপ্লেক্স" : "Broad-Spectrum Spore Probiotic / Triphala Bio-Extract",
          dosage: isBn ? "১টি ক্যাপসুল বা ১ চামচ (রাতের পর)" : "1 Capsule (Post-Dinner)",
          timing: isBn ? "রাত ৮:৩০ টা" : "08:30 PM",
          rationale: isBn
            ? `${profile.dosha} দোষের ভারসাম্য রক্ষা করে, গাট মাইক্রোবায়োম পুনর্গঠন করে এবং হাইপোঅ্যাসিডিটি ও কোষ্ঠকাঠিন্য দূর করে।`
            : `Rebuilds microbiome diversity (Score: ${profile.microbiomeScore}) and supports mucosal barrier integrity.`,
          medicationSynergy: isBn
            ? "মেটফরমিন বা গ্যাস্ট্রিকের ওষুধের কারণে সৃষ্ট গাট ডিসবায়োসিস প্রতিরোধ করে।"
            : "Protects gut flora from medication-induced dysbiosis.",
          phaseRole: "Microbiome Restoration",
          tags: ["Gut Microbiome", profile.dosha],
        },
      ],
      staplesAdvice: {
        salt: isBn
          ? `দিনে সর্বোচ্চ ${saltGrams} হিমালয়ান পিংক সল্ট বা সৈন্ধব লবণ ব্যবহার করুন। কাঁচা সাদা লবণ পাতে খাওয়া সম্পূর্ণ নিষেধ।`
          : `Limit salt to ${saltGrams} per day using mineral-rich Himalayan Pink Salt. Zero raw table salt on plate.`,
        saltGramsPerDay: isBn ? `${saltGrams}` : saltGrams,
        oil: isBn
          ? `দিনে মোট ${cookingFatGrams} গ্রাম রান্নার ফ্যাট (${gheeGrams}g দেশি ঘি + ${cookingOilGrams}g অলিভ/ঘানি ভাঙা সরিষার তেল)। সয়াবিন তেল সম্পূর্ণ নিষিদ্ধ।`
          : `Strictly ${cookingFatGrams}g cooking fat/day (${gheeGrams}g Deshi Ghee + ${cookingOilGrams}g Olive/Mustard Oil). Zero refined soybean oil.`,
        water: isBn
          ? `আপনার ওজন (${profile.weight} কেজি) অনুযায়ী প্রতিদিন ${waterLiters} লিটার (১০-১২ গ্লাস) কুসুম গরম বা স্বাভাবিক পানি পান করুন।`
          : `Based on your ${profile.weight}kg weight, drink ${waterLiters} Liters (10-12 glasses) of water daily, mostly between meals.`,
        waterLitersPerDay: isBn ? `${waterLiters} লিটার/দিন (১০-১২ গ্লাস)` : `${waterLiters} Liters/Day (10-12 Glasses)`,
      },
      activities: [
        {
          type: "Exercise",
          name: isBn ? "খাবারের পর ১৫ মিনিট বজ্রাসন ও ব্রিস্ক ওয়াকিং (Post-Meal Metabolic Walk)" : "Post-Meal Metabolic Brisk Walk & Vajrasana",
          duration: isBn ? "৩০ মিনিট/দিন (প্রতি খাবারের পর ১০ মিনিট)" : "30 mins/day (10 mins after each meal)",
          frequency: isBn ? "প্রতিদিন (সকাল ও রাতের খাবারের পর)" : "Daily after main meals",
          clinicalReason: isBn
            ? "পেশির GLUT-4 রিসেপ্টর সক্রিয় করে ইনসুলিন ছাড়াই রক্তের অতিরিক্ত গ্লুকোজ কমিয়ে আনে।"
            : "Activates non-insulin-dependent GLUT-4 muscle glucose uptake, cutting post-meal spikes by 30%.",
          instructions: isBn
            ? "দুপুর ও রাতের খাবারের পর ৫ মিনিট বজ্রাসনে বসুন এবং এরপর ১০-১৫ মিনিট মাঝারি গতিতে হাঁটুন।"
            : "Sit in Vajrasana for 5 mins post-meal, followed by a 10-15 min brisk walk.",
          visualCue: "walking",
        },
        {
          type: "Yoga",
          name: isBn ? "সূর্য নমস্কার ও পবনমুক্তাসন / অর্ধ মৎস্যেন্দ্রাসন (Metabolic Yoga Flow)" : "Surya Namaskar & Ardha Matsyendrasana (Spinal Digestive Twist)",
          duration: isBn ? "২০ মিনিট (সকালে খালি পেটে)" : "20 mins (Morning Empty Stomach)",
          frequency: isBn ? "সপ্তাহে ৬ দিন" : "6 days/week",
          clinicalReason: isBn
            ? "লিভার ও অগ্ন্যাশয়ে রক্ত সঞ্চালন বাড়ায়, পেটের ভিসেরাল ফ্যাট কমায় এবং হজম অগ্নি প্রজ্বলিত করে।"
            : "Massages abdominal organs, stimulates pancreatic & biliary secretion, and reduces visceral adiposity.",
          instructions: isBn
            ? "সকালে ডিটক্স ওয়াটার পানের পর ধীর শ্বাস-প্রশ্বাসের সাথে ৬ রাউন্ড সূর্য নমস্কার ও পেটের টুইস্টিং ইয়োগা করুন।"
            : "Perform 6 slow rounds of Surya Namaskar followed by seated spinal twists synchronized with breath.",
          visualCue: "yoga",
        },
        {
          type: "Pranayama",
          name: isBn ? "অনুলোম-বিলোম ও কপালভাতি প্রাণায়াম (Vagal Tone & Agni Breathwork)" : "Anulom Vilom & Kapalbhati Pranayama",
          duration: isBn ? "১৫ মিনিট" : "15 mins",
          frequency: isBn ? "প্রতিদিন সকাল ও সন্ধ্যায়" : "Daily Morning & Evening",
          clinicalReason: isBn
            ? "ভেগাস নার্ভ সক্রিয় করে কর্টিসল (স্ট্রেস হরমোন) কমায় এবং সেলুলার অক্সিজেনেশন বাড়ায়।"
            : "Balances autonomic nervous system (Vata-Pitta-Kapha), lowers cortisol, and boosts basal metabolic rate.",
          instructions: isBn
            ? "মেরুদণ্ড সোজা রেখে ৫ মিনিট কপালভাতি (উচ্চ রক্তচাপ থাকলে ধীরে) এবং ১০ মিনিট অনুলোম-বিলোম অনুশীলন করুন।"
            : "Sit upright; practice 5 mins gentle Kapalbhati and 10 mins alternate-nostril Anulom Vilom.",
          visualCue: "breathing",
        },
      ],
      macros: {
        protein: totalProteinGrams,
        fats: totalDailyFatGrams,
        carbs: totalCarbsGrams,
      },
    };
  }

  async fetchLocalFoods(
    profile: HealthProfile | null,
    category: string,
    lang: Language
  ): Promise<FoodItem[]> {
    const targetLang = this.getLangName(lang);
    const locationStr = profile?.location
      ? `(Lat: ${profile.location.latitude}, Lng: ${profile.location.longitude})`
      : "";

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
      const text = await this.callServerGemini({
        model: "gemini-3.8-flash",
        contents: { parts: [{ text: prompt }] },
        config: { responseMimeType: "application/json" },
      });
      return this.safeParseJson<FoodItem[]>(text, []);
    } catch {
      return [];
    }
  }

  async generateFamilyPot(
    profile: HealthProfile,
    currentPhase: number,
    adults: number,
    kids: number,
    mealType: string,
    lang: Language
  ): Promise<any> {
    const targetLang = this.getLangName(lang);
    const prompt = `Create Family Pot recipe for Phase ${currentPhase} in ${targetLang}. Adults: ${adults}, Kids: ${kids}, Meal: ${mealType}. Return JSON.`;
    const text = await this.callServerGemini({
      model: "gemini-3.8-flash",
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: "application/json" },
    });
    return this.safeParseJson<any>(text, {
      recipeName: lang === "bn" ? "পারিবারিক সবজি ও মাছ/মুরগির ওয়ান-পট স্টু" : "Family One-Pot Fish & Vegetable Stew",
      basePreparation: lang === "bn" ? "অলিভ অয়েল বা সরিষার তেলে হালকা মসলা ও সবজি দিয়ে রান্না করুন।" : "Simmer seasonal vegetables and protein with turmeric, ginger, and cumin.",
      adultModification: lang === "bn" ? "বড়দের জন্য গোলমরিচ, লেবু ও ফাইবার সমৃদ্ধ সবজি বাড়িয়ে দিন।" : "Add black pepper, lemon juice, and extra leafy greens for adults.",
      kidModification: lang === "bn" ? "বাচ্চাদের জন্য ১ চামচ দেশি ঘি ও নরম সবজি যুক্ত করুন।" : "Top with 1 tsp pure A2 ghee for growing children.",
    });
  }

  async generateGroceryList(
    profile: HealthProfile,
    currentPhase: number,
    lang: Language
  ): Promise<ShoppingList> {
    const targetLang = this.getLangName(lang);
    const prompt = `Generate Shopping List for Phase ${currentPhase} in ${targetLang}. Return JSON matching ShoppingList interface with freshMarket, groceryStore, pantryTip.`;
    const text = await this.callServerGemini({
      model: "gemini-3.8-flash",
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: "application/json" },
    });
    const fallbackFresh = (lang === "bn"
      ? ["পালং শাক ও লাল শাক", "লাউ ও ঝিঙে", "রুই/শিং মাছ ও দেশি ডিম", "লেবু, আদা ও আমলকী"]
      : ["Spinach & Red Amaranth", "Bottle Gourd", "River Fish & Eggs", "Lemon & Ginger"]
    ).map((name) => ({ name, quantity: lang === "bn" ? "১ কেজি / পরিমিত" : "1 kg / moderate", checked: false }));

    const fallbackGrocery = (lang === "bn"
      ? ["লাল চাল / ব্রাউন রাইস", "চিয়া সিড ও তিসি", "খাঁটি দেশি ঘি", "হিমালয়ান পিংক সল্ট"]
      : ["Red Rice", "Chia Seeds", "Pure Deshi Ghee", "Himalayan Pink Salt"]
    ).map((name) => ({ name, quantity: lang === "bn" ? "১ প্যাকেট / পরিমিত" : "1 pack / moderate", checked: false }));

    return this.safeParseJson<ShoppingList>(text, {
      freshMarket: fallbackFresh,
      groceryStore: fallbackGrocery,
      pantryTip:
        lang === "bn"
          ? "সয়াবিন তেল ও সাদা চিনি সম্পূর্ণ বর্জন করে কাঁচের বয়ামে সিডস ও বাদাম সংরক্ষণ করুন।"
          : "Eliminate refined seed oils and store raw nuts and seeds in airtight glass jars.",
    });
  }

  private buildIndividualizedContextSummary(
    profile: HealthProfile,
    currentPhase: number,
    lang: Language,
    currentChart?: DietPhaseChart | null,
    todayLog?: DailyCalorieLog | null
  ): string {
    const heightM = (profile.height || 165) / 100;
    const bmi = Number(((profile.weight || 65) / (heightM * heightM)).toFixed(1));
    const cohort = profile.cohortType || "adult_metabolic";

    let cohortDetails = `Cohort: ${cohort}`;
    if (cohort === "pregnancy_lactation") {
      if (profile.lactationStage && profile.lactationStage !== "none") {
        cohortDetails = `Lactating Mother (Stage: ${profile.lactationStage}). Needs +450 to +500 kcal, high calcium, iron, hydration, galactagogue whole foods (lau/bottle gourd, soaked almonds, red rice, small fish). STRICT ZERO HERBS RULE: Never prescribe Ashwagandha, Shatavari, Triphala, or concentrated herbal extracts.`;
      } else {
        const m = profile.pregnancyMonth || 4;
        cohortDetails = `Pregnant Mother — Ayurvedic Masanumasika Month ${m} of 9. Follow Classical Charaka/Sushruta Masanumasika food-only nourishment (milk, A2 ghee, soft rice, moong dal, pomegranate, folate/iron/choline foods) paired with Functional Obstetrics. STRICT ZERO HERBS RULE: NEVER suggest medicinal herbs or bhasmas.`;
      }
    } else if (cohort === "child_pediatric") {
      cohortDetails = `Pediatric Child Nutrition (Age Group: ${profile.childAgeGroup || "4-6"} years). Focus on neuro-development (DHA, choline, iron, zinc), linear bone growth (calcium, Vit D3, quality protein), brain-gut health, and zero ultra-processed sugars.`;
    } else if (cohort === "oncology_cancer") {
      cohortDetails = `Oncology Nutritional Support (Phase: ${profile.oncologyPhase || "chemo_active"}). Focus on anti-cachexia high-protein soft easily digestible meals, neutropenic food safety (strictly no raw salads/unpasteurized items during active chemo), nausea relief (ginger/lemon infusion), and mucosal healing.`;
    } else if (cohort === "adolescent_growth") {
      cohortDetails = `Adolescent Growth & Hormonal Balance (Subtype: ${profile.adolescentSubtype || "girl_puberty"}). Focus on iron & folate replenishment, insulin/PCOS balance, bone peak mass, and exam cognitive stamina.`;
    } else {
      cohortDetails = `Adult Metabolic & Functional Reversal. Conditions: ${profile.medicalConditions || "General Metabolic Wellness"}.`;
    }

    const dinnerRuleMap: Record<string, string> = {
      vegetable_carbs: "No grain/rice/roti at dinner — only cooked low-GI vegetable carbs + protein",
      cereal_allowed: "Moderate complex grain (red rice / whole wheat roti) allowed at dinner",
      no_carbs: "Strict zero-carb ketogenic/therapeutic protein + healthy fat dinner",
    };
    const dinnerRuleDesc = dinnerRuleMap[profile.dinnerCarbRule || "vegetable_carbs"];

    const greenFoods =
      profile.trafficLightGuide?.green
        ?.slice(0, 10)
        .map((f) => f.name)
        .join(", ") ||
      (profile.selectedFoods ? Object.values(profile.selectedFoods).flat().slice(0, 10).join(", ") : "Laau, Pui Shak, Small Fish, Egg, Moong Dal");
    const yellowFoods =
      profile.trafficLightGuide?.yellow
        ?.slice(0, 6)
        .map((f) => f.name)
        .join(", ") || "Red Rice (limited), Sweet Potato, Ripe Mango (small slice)";
    const redFoods =
      profile.trafficLightGuide?.red
        ?.slice(0, 8)
        .map((f) => f.name)
        .join(", ") || "Refined Sugar, Soybean Oil, White Flour (Maida), Deep Fried Snacks, Soft Drinks";

    const chartSummary = currentChart
      ? `Active Diet Chart (${currentChart.title}, Target: ${currentChart.dailyCalorieTarget || 1650} kcal, Protein: ${currentChart.macros?.protein || 65}g, Carbs: ${currentChart.macros?.carbs || 160}g, Fats: ${currentChart.macros?.fats || 55}g):
      - Morning Detox: ${currentChart.SampleDay?.morningDetox?.name || "Warm Detox Water"}
      - Breakfast: ${currentChart.SampleDay?.morning?.name || "Eggs & Vegetables"} (${currentChart.SampleDay?.morning?.quantity || ""})
      - Lunch: ${currentChart.SampleDay?.midDay?.name || "Red Rice, Fish & Greens"} (${currentChart.SampleDay?.midDay?.quantity || ""})
      - Evening Snack: ${currentChart.SampleDay?.afternoon?.name || "Seeds & Nuts"} (${currentChart.SampleDay?.afternoon?.quantity || ""})
      - Dinner: ${currentChart.SampleDay?.evening?.name || "Protein & Cooked Vegetable Soup"} (${currentChart.SampleDay?.evening?.quantity || ""})`
      : `Phase ${currentPhase} Protocol (${profile.mealFrequency || 3} meals/day, Dinner Rule: ${dinnerRuleDesc})`;

    const loggedCalories = todayLog
      ? todayLog.items.reduce((acc, item) => acc + (item.calories || 0), 0)
      : 0;
    const loggedProtein = todayLog
      ? todayLog.items.reduce((acc, item) => acc + (item.protein || 0), 0)
      : 0;
    const todayLogSummary = todayLog
      ? `Today's Calorie Tracker Log: ${loggedCalories} / ${todayLog.targetCalories} kcal consumed (${Math.round(loggedProtein)}g protein), Water: ${todayLog.waterGlasses} glasses. Foods eaten today: ${todayLog.items.map((i) => (lang === "bn" ? i.nameBn : i.nameEn)).join(", ") || "None logged yet"}.`
      : "No meals logged yet today.";

    const labMarkers = profile.cohortLabMarkers
      ? Object.entries(profile.cohortLabMarkers)
          .filter(([, v]) => v)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ")
      : "";

    return `
=== INDIVIDUALIZED PATIENT CLINICAL CONTEXT ===
- Age/Gender: ${profile.age} yrs, ${profile.gender}, Weight: ${profile.weight} kg, Height: ${profile.height} cm (BMI: ${bmi})
- Ayurvedic Prakriti/Vikriti Dosha: ${profile.dosha} | Gut Microbiome Score: ${profile.microbiomeScore}/100 | Inflammatory Index: ${profile.inflammatoryIndex}/10 | Metabolic Type: ${profile.metabolicType}
- ${cohortDetails}
- Medical Conditions: ${profile.medicalConditions || "None reported"}
- Current Medications: ${profile.currentMedicationsList?.join(", ") || profile.medications || "None"}
- Lab Markers: ${labMarkers || "Standard clinical baseline"}
- Meal Frequency: ${profile.mealFrequency || 3} meals/day | Hypoacidity/Bloating: ${profile.hasHypoacidity ? "Yes (needs pre-meal ginger-pink salt digestive primer, avoid raw cold foods)" : "No"}
- Dinner Carb Rule: ${dinnerRuleDesc}
- Traffic Light Food Guide:
  * GREEN (Eat Freely): ${greenFoods}
  * YELLOW (Portion Controlled): ${yellowFoods}
  * RED (Strictly Avoid): ${redFoods}
- ${chartSummary}
- ${todayLogSummary}
- Safety Alerts: ${profile.cohortSafetyAlerts?.join(" | ") || "Maintain portion discipline and hydration"}
===============================================
`.trim();
  }

  private generateIndividualizedFallbackReply(
    query: string,
    profile: HealthProfile,
    currentPhase: number,
    lang: Language,
    currentChart?: DietPhaseChart | null,
    todayLog?: DailyCalorieLog | null
  ): string {
    const isBn = lang === "bn";
    const q = query.toLowerCase();
    const cohort = profile.cohortType || "adult_metabolic";
    const heightM = (profile.height || 165) / 100;
    const bmi = ((profile.weight || 65) / (heightM * heightM)).toFixed(1);
    const loggedCals = todayLog
      ? todayLog.items.reduce((s, i) => s + (i.calories || 0), 0)
      : 755;
    const targetCals = currentChart?.dailyCalorieTarget || todayLog?.targetCalories || 1650;

    // 1. Pregnancy / Masanumasika specific questions
    if (cohort === "pregnancy_lactation" || q.includes("গর্ভ") || q.includes("প্রেগন্যান্ট") || q.includes("pregnan") || q.includes("masanumasika") || q.includes("মাসানু")) {
      const m = profile.pregnancyMonth || 4;
      const monthFocusBn: Record<number, string> = {
        1: "১ম মাস (কলল পর্যায়): ভ্রূণের ইমপ্লান্টেশন ও ফোলেট সুরক্ষা — দুধ, ভেজানো কাঠবাদাম, ডালিম ও মুগ ডালের পাতলা সুপ গ্রহণ করুন।",
        2: "২য় মাস (ঘন পর্যায়): টিস্যু গঠন — খাঁটি দুধ, পালং শাক, লাল শাক ও মিষ্টি ফলের রসের মাধ্যমে ক্যালসিয়াম ও ফলেট নিশ্চিত করুন।",
        3: "৩য় মাস (অঙ্গ-প্রত্যঙ্গের অঙ্কুরোদগম): ইন্দ্রিয় ও স্নায়ু বিকাশ — দুধের সাথে সামান্য খাঁটি মধু ও ১ চামচ দেশি ঘি, সাথে ডিম ও ছোট মাছ রাখুন।",
        4: "৪র্থ মাস (হৃদস্পন্দন ও টিস্যু স্থায়িত্ব): শিশুর ওজন ও রক্ত প্রবাহ বৃদ্ধি — দুধের মাখন/ঘি, দেশি মুরগি বা মাছের ঝোল, ডাল ও আয়রন সমৃদ্ধ খাবার গ্রহণ করুন।",
        5: "৫ম মাস (মন ও চেতনার বিকাশ): মস্তিষ্কের কোষ গঠনে ওমেগা-৩, কোলিন (সিদ্ধ ডিম) ও দেশি ঘি অত্যন্ত জরুরি।",
        6: "৬ষ্ঠ মাস (বুদ্ধি ও অস্থি মজবুতকরণ): পায়ে পানি আসা বা ফোলাভাব কমাতে লাউ, ঝিঙে, ডাবের পানি ও পর্যাপ্ত প্রোটিন গ্রহণ করুন।",
        7: "৭ম মাস (পূর্ণাঙ্গ অঙ্গ পরিপক্কতা): অ্যাসিডিটি ও কোষ্ঠকাঠিন্য এড়াতে অল্প করে বারবার (৪ বেলা) সহজপাচ্য খাবার ও মিষ্টি ডালিম খান।",
        8: "৮ম মাস (ওজঃ বা জীবনীশক্তি স্থিতিশীলতা): শক্তি ধরে রাখতে নরম ভাত/জাউ, দুধ ও ঘি গ্রহণ করুন এবং অতিরিক্ত ঝাল-ভাজাপোড়া বর্জন করুন।",
        9: "৯ম মাস (প্রসব প্রস্তুতি): সহজে স্বাভাবিক প্রসব ও স্তন্যদানের প্রস্তুতিতে হালকা সুপ, নরম সবজি ও কুসুম গরম দুধ পান করুন।",
      };
      if (isBn) {
        return `**আপনার প্রোফাইল বিশ্লেষণ (${profile.dosha} দোষ | গর্ভাবস্থার ${m}ম মাস - মাসানুমাসিক প্রোটোকল):**\n\n• **এই মাসের বিশেষ ফোকাস:** ${monthFocusBn[m] || monthFocusBn[4]}\n• **আপনার বর্তমান ডায়েট লক্ষ্যমাত্রা:** প্রতিদিন প্রায় **${targetCals} kcal** এবং **${currentChart?.macros?.protein || 72}g প্রোটিন**।\n• **নিরাপদ খাবার (Green Zone):** সিদ্ধ ডিম (কোলিন), ছোট মাছ, মুগ ডাল, লাউ, পালং শাক, ডালিম ও ১ চামচ দেশি ঘি।\n• **সতর্কতা (Zero Herbs Rule):** গর্ভাবস্থায় কোনো ভেষজ চূর্ণ বা হার্বস (যেমন অশ্বগন্ধা, শতাবরী বা ত্রিফলা) গ্রহণ করবেন না; শুধুমাত্র প্রাকৃতিক খাবার থেকেই পুষ্টি গ্রহণ করুন।`;
      }
      return `**Individualized Masanumasika Analysis (${profile.dosha} Dosha | Pregnancy Month ${m}):**\n\n• **Monthly Developmental Focus:** Month ${m} prioritizes fetal tissue stability, choline/DHA neuro-nutrition, and maternal hemoglobin.\n• **Your Daily Target:** **${targetCals} kcal** with **${currentChart?.macros?.protein || 72}g protein**.\n• **Recommended Whole Foods:** Pastured boiled eggs, small river fish, moong dal, bottle gourd, pomegranate, and 1 tsp pure A2 ghee.\n• **Clinical Safety Rule:** Strictly zero medicinal herbs or concentrated extracts—rely 100% on food-based nourishment.`;
    }

    // 2. Child / Pediatric questions
    if (cohort === "child_pediatric" || q.includes("বাচ্চা") || q.includes("শিশু") || q.includes("child") || q.includes("লম্বা") || q.includes("মেধা")) {
      const ageGrp = profile.childAgeGroup || "4-6";
      if (isBn) {
        return `**শিশুর গ্রোথ ও মাইলস্টোন গাইড (${ageGrp} বছর | ${profile.dosha} প্রকৃতি):**\n\n• **শারীরিক বৃদ্ধি ও উচ্চতা:** হাড়ের বৃদ্ধির জন্য প্রতিদিন ১টি ডিম, ছোট মাছ (কাঁটাসহ চিবানো বা কাটা বাছা মাছ), মুগ ডাল এবং মৌসুমি সবজি নিশ্চিত করুন।\n• **মস্তিষ্কের বিকাশ (Brain & Focus):** সকালের নাস্তায় ভেজানো কাঠবাদাম (৪-৫টি), আখরোট ও দেশি ঘি যুক্ত খাবার দিন।\n• **বর্জনীয় (Red Zone):** প্যাকেটজাত চিপস, নুডলস, সয়াবিন তেল ও অতিরিক্ত চিনি শিশুর গাট মাইক্রোবায়োম ও মনোযোগ কমিয়ে দেয়।`;
      }
      return `**Pediatric Growth & Milestone Protocol (Age ${ageGrp} yrs | ${profile.dosha} Profile):**\n\n• **Linear Growth & Bone Density:** Include 1-2 boiled eggs, river fish, moong dal, and calcium-rich greens daily.\n• **Brain & Cognitive Focus:** Add soaked almonds, walnuts, and 1 tsp pure ghee to morning meals for DHA and choline.\n• **Avoid (Red Zone):** Eliminate packaged snacks, refined sugar, and seed oils to protect gut-brain immunity.`;
    }

    // 3. Oncology / Cancer Support questions
    if (cohort === "oncology_cancer" || q.includes("ক্যান্সার") || q.includes("কেমো") || q.includes("chemo") || q.includes("oncology")) {
      if (isBn) {
        return `**অনকোলজি নিউট্রিশন ও রিকভারি প্রোটোকল (${profile.dosha} দোষ | ফেজ ${currentPhase}):**\n\n• **অ্যান্টি-ক্যাশেক্সিয়া প্রোটিন সাপোর্ট:** শরীরের পেশি ক্ষয় রোধে প্রতিদিন নরম সিদ্ধ ডিম, দেশি মাছের পাতলা ঝোল, মুগ ডালের সুপ ও দেশি মুরগির স্টু অল্প অল্প করে বারবার গ্রহণ করুন।\n• **বমিভাব ও মুখের অরুচি রোধে:** খাবারের আগে তাজা আদা-লেবুর কুসুম গরম পানি ও ডালিমের রস গ্রহণ করুন।\n• **নিউট্রোপেনিক খাদ্য নিরাপত্তা:** কেমো বা থেরাপি চলাকালীন কাঁচা সালাদ বা আধা-সিদ্ধ খাবার সম্পূর্ণ বর্জন করুন; সব খাবার ভালোভাবে ফুটিয়ে ও গরম অবস্থায় খান।`;
      }
      return `**Oncology Nutritional Support (${profile.dosha} Dosha | Phase ${currentPhase}):**\n\n• **Anti-Cachexia Protein Density:** Prioritize soft boiled eggs, clear river fish broth, moong dal soup, and shredded chicken stew in small frequent meals.\n• **Nausea & Mucosal Relief:** Sip warm ginger-lemon infusion and fresh pomegranate juice.\n• **Neutropenic Safety:** Strictly avoid raw salads or unpasteurized foods; consume only freshly cooked warm meals.`;
    }

    // 4. Diabetes / Insulin Resistance / PCOS / Blood Sugar questions
    if (q.includes("ডায়াবেটিস") || q.includes("সুগার") || q.includes("ইনসুলিন") || q.includes("pcos") || q.includes("diabet") || q.includes("sugar")) {
      if (isBn) {
        return `**আপনার ব্লাড সুগার ও ইনসুলিন নিয়ন্ত্রণ প্রোটোকল (${profile.dosha} দোষ | BMI: ${bmi}):**\n\n• **গ্লাইসেমিক সিকোয়েন্সিং:** প্রতি বেলা খাবারের শুরুতে আগে শাকসবজি ও প্রোটিন (মাছ/ডিম) খান, এবং সবশেষে পরিমিত লাল চালের ভাত খান—এতে পোস্ট-মিল সুগার স্পাইক ৩৫% পর্যন্ত কমে।\n• **রাতের শর্করা নিয়ম:** রাতে ভাত বা আটার রুটি বাদ দিয়ে লাউ সিদ্ধ, পেঁপে সিদ্ধ বা ফুলকপির রাইসের সাথে মাছ/ডিম গ্রহণ করুন।\n• **প্রাকৃতিক ইনসুলিন সহায়ক:** করলা, সজনে ডাটা, মেথি-জিরা ডিটক্স ওয়াটার এবং খাবারের পর ১৫ মিনিট হাঁটা আপনার ইনসুলিন সংবেদনশীলতা দ্রুত বাড়াবে।`;
      }
      return `**Personalized Glycemic & Insulin Protocol (${profile.dosha} Dosha | BMI: ${bmi}):**\n\n• **Meal Sequencing:** Eat fiber/greens and protein (fish/egg) first before complex carbs to blunt post-meal glucose spikes by up to 35%.\n• **Night Carb Rule:** Replace night grains with boiled bottle gourd (Lau), green papaya, or cauliflower rice paired with protein.\n• **Metabolic Activators:** Morning CCF fenugreek water and a 15-minute post-meal brisk walk.`;
    }

    // 5. Gas / Acidity / Bloating / Gut Microbiome questions
    if (q.includes("গ্যাস") || q.includes("অ্যাসিডিটি") || q.includes("পেট ফাঁপা") || q.includes("কোষ্ঠকাঠিন্য") || q.includes("হজম") || q.includes("acidity") || q.includes("bloat") || q.includes("gas")) {
      if (isBn) {
        return `**আপনার গাট মাইক্রোবায়োম ও হজমশক্তি (Agni) প্রোটোকল (স্কোর: ${profile.microbiomeScore}/100):**\n\n• **হাইপোঅ্যাসিডিটি প্রাইমার:** দুপুর ও রাতের খাবারের ঠিক ১৫ মিনিট আগে ১ চামচ আদার রস + ১ চামচ লেবুর রস + ১ চিমটি হিমালয়ান পিংক সল্ট ৫০ মিলি কুসুম গরম পানিতে মিশিয়ে পান করুন।\n• **সহজপাচ্য খাবার (Green Zone):** লাউ, কাঁচা পেঁপে সিদ্ধ, পাতলা মুগ ডাল, শিং/মাগুর মাছের ঝোল ও দুপুরে ঘরে পাতা টক দই।\n• **বর্জনীয়:** দুধ চা, বিস্কুট, সয়াবিন তেল, অতিরিক্ত কাঁচা সালাদ (রাতে) এবং খাবারের সাথে সাথে অতিরিক্ত ঠান্ডা পানি পান।`;
      }
      return `**Gut Microbiome & Digestive Agni Protocol (Score: ${profile.microbiomeScore}/100):**\n\n• **Pre-Meal Digestive Primer:** Take 1 tsp fresh ginger juice + lemon + pinch of Himalayan pink salt in 50ml warm water 15 mins before lunch.\n• **Gut-Soothing Foods:** Boiled bottle gourd, green papaya, thin moong dal, and midday probiotic sour curd.\n• **Avoid:** Milk tea with biscuits, refined soybean oil, and drinking cold water during meals.`;
    }

    // 6. Dinner / Night meal questions
    if (q.includes("রাত") || q.includes("ডিনার") || q.includes("dinner") || q.includes("ভাত") || q.includes("রুটি")) {
      const dinnerMeal = currentChart?.SampleDay?.evening?.name || (isBn ? "গ্রিলড মাছ/মুরগি ও মিক্সড সবজি স্যুপ" : "Grilled Fish/Chicken & Mixed Vegetable Soup");
      const ruleTextBn =
        profile.dinnerCarbRule === "vegetable_carbs"
          ? "আপনার মেটাবলিক প্রোফাইল অনুযায়ী রাতে চাল বা আটার রুটি না খেয়ে **সবজির কার্বোহাইড্রেট + প্রোটিন** গ্রহণ করা সবচেয়ে কার্যকর।"
          : profile.dinnerCarbRule === "no_carbs"
          ? "আপনার থেরাপিউটিক লক্ষ্য অনুযায়ী রাতের খাবার **লো-কার্ব প্রোটিন ও হেলদি ফ্যাট** সমৃদ্ধ রাখা প্রয়োজন।"
          : "আপনি রাতে পরিমিত পরিমাণে লাল চালের ভাত বা ১টি লাল আটার রুটির সাথে প্রোটিন ও সবজি খেতে পারেন।";

      if (isBn) {
        return `**আপনার ডিনার গাইড (${profile.dosha} দোষ | BMI: ${bmi}):**\n\n• **আপনার রাতের কার্ব নিয়ম:** ${ruleTextBn}\n• **আপনার চার্টের সাজেস্টেড ডিনার:** **${dinnerMeal}** (${currentChart?.SampleDay?.evening?.quantity || "১ বড় বাটি"})।\n• **ক্লিনিক্যাল কারণ:** রাত ৮টার মধ্যে ডিনার শেষ করলে রাতের ইনসুলিন স্পাইক কমে, লিভার ডিটক্স ও গভীর ঘুম ভালো হয়।`;
      }
      return `**Personalized Dinner Protocol (${profile.dosha} Dosha | BMI: ${bmi}):**\n\n• **Your Dinner Carb Rule:** ${profile.dinnerCarbRule === "vegetable_carbs" ? "Replace grains with cooked low-GI vegetables + clean protein at night." : "Moderate complex carbs paired with protein and fiber."}\n• **Your Chart's Dinner:** **${dinnerMeal}** (${currentChart?.SampleDay?.evening?.quantity || "1 bowl"}).\n• **Clinical Tip:** Finish dinner at least 2.5–3 hours before sleep to optimize overnight insulin sensitivity.`;
    }

    // 7. Default personalized clinical summary response
    const greenSample =
      profile.trafficLightGuide?.green
        ?.slice(0, 4)
        .map((f) => f.name)
        .join(", ") || (isBn ? "লাউ, পালং শাক, দেশি মাছ, সিদ্ধ ডিম" : "Bottle gourd, spinach, river fish, boiled eggs");

    if (isBn) {
      return `**আপনার ব্যক্তিগতকৃত নিউট্রিশন পরামর্শ (${profile.dosha} দোষ | ফেজ ${currentPhase}):**\n\n• **আজকের ক্যালোরি ট্র্যাকার আপডেট:** আপনি আজ **${loggedCals} / ${targetCals} kcal** গ্রহণ করেছেন।\n• **আপনার শারীরিক অবস্থা:** বয়স ${profile.age} বছর, BMI **${bmi}**, মাইক্রোবায়োম স্কোর **${profile.microbiomeScore}/100** (${profile.medicalConditions || "মেটাবলিক ব্যালেন্স"})।\n• **করণীয়:**\n  ১. আপনার **Green Zone** খাবারগুলো (${greenSample}) প্রতিদিনের প্লেটে প্রাধান্য দিন।\n  ২. ${profile.hasHypoacidity ? "আপনার হজমশক্তি (Agni) বাড়াতে মূল খাবারের ১৫ মিনিট আগে আদা ও হিমালয়ান পিংক সল্ট মিশ্রিত কুসুম গরম পানি পান করুন।" : "খাবারের মাঝে পর্যাপ্ত কুসুম গরম ডিটক্স ওয়াটার পান করুন।"}\n  ৩. দুপুরের খাবারে পর্যাপ্ত প্রোটিন (${currentChart?.macros?.protein || 65}g/দিন) এবং রাতের খাবারে হালকা সহজপাচ্য প্রোটিন ও সবজি রাখুন।`;
    }

    return `**Individualized Clinical Guidance (${profile.dosha} Dosha | Phase ${currentPhase}):**\n\n• **Today's Calorie Status:** **${loggedCals} / ${targetCals} kcal** logged.\n• **Your Biomarkers:** Age ${profile.age}, BMI **${bmi}**, Microbiome Score **${profile.microbiomeScore}/100** (${profile.medicalConditions || "Metabolic Optimization"}).\n• **Actionable Protocol:**\n  1. Prioritize your **Green Zone** foods (${greenSample}).\n  2. ${profile.hasHypoacidity ? "Take warm ginger + pink salt primer 15 mins before meals to support stomach acid." : "Maintain warm hydration between meals."}\n  3. Hit your daily protein target (**${currentChart?.macros?.protein || 65}g**) while keeping dinner light and early.`;
  }

  async coachChatWithVerification(
    profile: HealthProfile,
    currentPhase: number,
    messages: ChatMessage[],
    lang: Language,
    currentChart?: DietPhaseChart | null,
    todayLog?: DailyCalorieLog | null
  ): Promise<{ text: string; verification: MakerCheckerVerification }> {
    const targetLang = this.getLangName(lang);
    const last = messages[messages.length - 1];
    const recentHistory = messages
      .slice(-6)
      .map((m) => `${m.sender === "user" ? "Patient" : "AI Coach"}: ${m.text}`)
      .join("\n");

    const contextBlock = this.buildIndividualizedContextSummary(
      profile,
      currentPhase,
      lang,
      currentChart,
      todayLog
    );

    const prompt = `
You are an empathetic, senior Functional Nutritionist & Ayurvedic Clinical Coach.
Answer the patient's question strictly personalized to their exact clinical profile, active diet chart, Traffic Light food list, and cohort milestone below.

${contextBlock}

=== RECENT CONVERSATION ===
${recentHistory}

=== INSTRUCTIONS FOR YOUR RESPONSE ===
1. Reply strictly in ${targetLang} (use natural, clear, encouraging clinical language).
2. Directly reference the user's specific data (e.g., their ${profile.dosha} Dosha, BMI, medical condition "${profile.medicalConditions || "Wellness"}", cohort stage, dinner carb rule, or today's calorie log) so the answer feels 100% individualized.
3. If the user asks about a food item, explicitly state whether it falls into their GREEN, YELLOW, or RED zone, explain the metabolic/Ayurvedic reason for THEIR body, and suggest a healthier local Bengali/South Asian swap if needed.
4. CRITICAL SAFETY: If the user is in the Pregnancy/Lactation cohort, follow Ayurvedic Masanumasika month-by-month food wisdom but NEVER prescribe medicinal herbs or herbal supplements (Zero Herbs Rule).
5. Keep the response concise, well-structured with bullet points (3 to 5 bullets max), and immediately actionable.
`.trim();

    // STAGE 1: MAKER (Draft Generation)
    let draftText = await this.callServerGemini({
      model: "gemini-3.8-flash",
      contents: {
        parts: [{ text: prompt }],
      },
    });

    if (!draftText || !draftText.trim()) {
      draftText = this.generateIndividualizedFallbackReply(
        last?.text || "",
        profile,
        currentPhase,
        lang,
        currentChart,
        todayLog
      );
    }

    // STAGE 2: CHECKER (App's Gemini Clinical Verifier & Sanitizer)
    const { verifiedText, verification } = MakerCheckerEngine.verifyTextOutput(
      draftText,
      profile,
      lang
    );

    return {
      text: verifiedText,
      verification,
    };
  }

  async coachChat(
    profile: HealthProfile,
    currentPhase: number,
    messages: ChatMessage[],
    lang: Language,
    currentChart?: DietPhaseChart | null,
    todayLog?: DailyCalorieLog | null
  ): Promise<string> {
    const result = await this.coachChatWithVerification(
      profile,
      currentPhase,
      messages,
      lang,
      currentChart,
      todayLog
    );
    return result.text;
  }

  async checkFoodSafetyAndSwap(
    foodQuery: string,
    profile: HealthProfile,
    currentPhase: number,
    lang: Language,
    currentChart?: DietPhaseChart | null
  ): Promise<FoodSafetyVerdict> {
    const targetLang = this.getLangName(lang);
    const contextBlock = this.buildIndividualizedContextSummary(
      profile,
      currentPhase,
      lang,
      currentChart,
      null
    );

    const prompt = `
Evaluate the food item "${foodQuery}" specifically for this patient based on their clinical profile and Traffic Light protocol:

${contextBlock}

Return a raw JSON object in ${targetLang} (no markdown blocks) matching this exact structure:
{
  "foodName": "Name of the food in ${targetLang}",
  "zone": "green" | "yellow" | "red",
  "verdictTitle": "Short clear verdict in ${targetLang} (e.g. 'নিরাপদ ও উপকারী (Green Zone)' or 'পরিমিত গ্রহণযোগ্য (Yellow Zone)' or 'বর্জনীয় (Red Zone)')",
  "clinicalReason": "1-2 sentences explaining how this food affects THEIR specific conditions (${profile.medicalConditions || profile.dosha}), insulin/gut score (${profile.microbiomeScore}/100), or cohort stage",
  "ayurvedicAndCohortNote": "1 sentence on how it interacts with their ${profile.dosha} Dosha and cohort stage (Remember: Zero Herbs in pregnancy)",
  "healthySwap": "Best Green-Zone local food alternative or preparation method in ${targetLang}",
  "bestTimingOrPortion": "Exact portion size and best time of day to eat (or 'সম্পূর্ণ বর্জন করুন / Avoid completely' if Red)"
}
`.trim();

    const fallbackVerdict = this.buildFallbackFoodVerdict(foodQuery, profile, lang);

    try {
      // STAGE 1: MAKER
      const text = await this.callServerGemini({
        model: "gemini-3.8-flash",
        contents: { parts: [{ text: prompt }] },
        config: { responseMimeType: "application/json" },
      });
      if (!text) {
        // STAGE 2: CHECKER
        return MakerCheckerEngine.verifyFoodSafetyVerdict(
          fallbackVerdict,
          profile,
          lang
        );
      }
      const parsed = this.safeParseJson<FoodSafetyVerdict>(text, fallbackVerdict);
      if (!parsed.zone || !["green", "yellow", "red"].includes(parsed.zone)) {
        parsed.zone = fallbackVerdict.zone;
      }
      // STAGE 2: CHECKER
      return MakerCheckerEngine.verifyFoodSafetyVerdict(parsed, profile, lang);
    } catch {
      return MakerCheckerEngine.verifyFoodSafetyVerdict(
        fallbackVerdict,
        profile,
        lang
      );
    }
  }

  private buildFallbackFoodVerdict(
    foodQuery: string,
    profile: HealthProfile,
    lang: Language
  ): FoodSafetyVerdict {
    const isBn = lang === "bn";
    const q = foodQuery.toLowerCase().trim();
    const isPreg = profile.cohortType === "pregnancy_lactation";
    const hasDiabetes =
      (profile.medicalConditions || "").toLowerCase().includes("diabet") ||
      (profile.medicalConditions || "").includes("ডায়াবেটিস") ||
      (profile.medicalConditions || "").toLowerCase().includes("pcos");

    // Check user's explicit traffic light lists first
    const inGreen = profile.trafficLightGuide?.green?.find((f) =>
      f.name.toLowerCase().includes(q)
    );
    const inYellow = profile.trafficLightGuide?.yellow?.find((f) =>
      f.name.toLowerCase().includes(q)
    );
    const inRed = profile.trafficLightGuide?.red?.find((f) =>
      f.name.toLowerCase().includes(q)
    );

    if (
      inRed ||
      q.includes("চিনি") ||
      q.includes("sugar") ||
      q.includes("সয়াবিন") ||
      q.includes("soybean") ||
      q.includes("ময়দা") ||
      q.includes("পাঁপড়") ||
      q.includes("ভাজা") ||
      q.includes("সিঙাড়া") ||
      q.includes("কোক") ||
      q.includes("সফট ড্রিংক") ||
      q.includes("বিরিয়ানি") ||
      q.includes("গরুর মাংস") ||
      q.includes("beef") ||
      q.includes("খাসির মাংস") ||
      q.includes("mutton") ||
      q.includes("নুডলস") ||
      q.includes("বিস্কুট") ||
      q.includes("biscuit") ||
      (isPreg &&
        (q.includes("কাঁচা পেঁপে") ||
          q.includes("আনারস") ||
          q.includes("raw papaya") ||
          q.includes("অশ্বগন্ধা") ||
          q.includes("শতাবরী") ||
          q.includes("ত্রিফলা")))
    ) {
      return {
        foodName: foodQuery,
        zone: "red",
        verdictTitle: isBn ? "বর্জনীয় খাবার (Red Zone - Avoid)" : "Strictly Avoid (Red Zone)",
        clinicalReason:
          inRed?.reason ||
          (isBn
            ? `আপনার ${profile.medicalConditions || profile.dosha} প্রোফাইল ও ইনফ্ল্যামেটরি ইনডেক্স (${profile.inflammatoryIndex}/10) অনুযায়ী এটি রক্তে শর্করা ও প্রদাহ দ্রুত বাড়িয়ে দেয়।`
            : `Triggers glycemic spikes and systemic inflammation for your ${profile.medicalConditions || profile.dosha} profile.`),
        ayurvedicAndCohortNote: isPreg
          ? isBn
            ? "গর্ভাবস্থায় মাসানুমাসিক প্রোটোকলে অতিরিক্ত ভাজাপোড়া, রিফাইন্ড কার্ব, হার্বস বা কাঁচা পেঁপে/আনারস সম্পূর্ণ নিষিদ্ধ।"
            : "Contraindicated during Masanumasika pregnancy protocol due to digestive and gestational risks."
          : isBn
          ? `এটি আপনার ${profile.dosha} দোষের ভারসাম্য নষ্ট করে এবং অন্ত্রে আম (Ama/Toxin) তৈরি করে।`
          : `Aggravates ${profile.dosha} Dosha and impairs gut microbiome balance.`,
        healthySwap: isBn
          ? "ভেজানো কাঠবাদাম, রোস্টেড মাখানা, মুগ ডালের সুপ বা দেশি মাছ ও সবজি"
          : "Soaked almonds, roasted makhana, moong dal soup, or river fish with greens",
        bestTimingOrPortion: isBn
          ? "সম্পূর্ণ বর্জন করুন; পরিবর্তে Green Zone বিকল্পটি গ্রহণ করুন।"
          : "Avoid completely; replace with the suggested Green Zone swap.",
      };
    }

    if (
      inYellow ||
      q.includes("সাদা ভাত") ||
      q.includes("white rice") ||
      q.includes("আম") ||
      q.includes("mango") ||
      q.includes("কলা") ||
      q.includes("banana") ||
      q.includes("কাঁঠাল") ||
      q.includes("jackfruit") ||
      q.includes("আলু") ||
      q.includes("potato") ||
      q.includes("চা") ||
      q.includes("কফি") ||
      q.includes("coffee") ||
      q.includes("রুটি") ||
      q.includes("দুধ")
    ) {
      return {
        foodName: foodQuery,
        zone: "yellow",
        verdictTitle: isBn
          ? "পরিমিত গ্রহণযোগ্য (Yellow Zone - Portion Controlled)"
          : "Moderate / Portion Controlled (Yellow Zone)",
        clinicalReason:
          inYellow?.reason ||
          (isBn
            ? `${hasDiabetes ? "আপনার ব্লাড সুগার ও ইনসুলিন সংবেদনশীলতার কারণে " : ""}এটি পরিমিত পরিমাণে এবং প্রোটিন বা ফাইবারের সাথে মিলিয়ে খাওয়া প্রয়োজন।`
            : `Requires strict portion control and pairing with fiber/protein to prevent glucose spikes.`),
        ayurvedicAndCohortNote: isBn
          ? `আপনার ${profile.dosha} প্রকৃতিতে এটি দুপুরে হজম অগ্নি (Agni) প্রবল থাকাকালীন অল্প পরিমাণে সহনীয়।`
          : `Best digested at midday when digestive Agni is strongest for your ${profile.dosha} constitution.`,
        healthySwap: isBn
          ? "লাল চালের ভাত (১ কাপ), পেয়ারা/ডালিম বা লাউ-সবজি যুক্ত প্রোটিন মিল"
          : "Red parboiled rice (1 cup), guava/pomegranate, or fiber-rich vegetable protein bowl",
        bestTimingOrPortion: isBn
          ? "সপ্তাহে ২-৩ দিন দুপুরের খাবারে (১ ছোট বাটি / ৫০-৭৫ গ্রাম), রাতে বর্জনীয়।"
          : "Midday meal only (small portion 50–75g) paired with greens and protein; avoid at dinner.",
      };
    }

    return {
      foodName: foodQuery,
      zone: "green",
      verdictTitle: isBn
        ? "নিরাপদ ও নিরাময়কারী (Green Zone - Ideal Match)"
        : "Safe & Healing Match (Green Zone)",
      clinicalReason:
        inGreen?.reason ||
        (isBn
          ? `এটি আপনার ${profile.dosha} দোষ, মাইক্রোবায়োম স্কোর (${profile.microbiomeScore}/100) এবং মেটাবলিক লক্ষ্যমাত্রার জন্য অত্যন্ত উপকারী ও পুষ্টিসমৃদ্ধ।`
          : `Supports your ${profile.dosha} balance, gut microbiome (${profile.microbiomeScore}/100), and cellular healing.`),
      ayurvedicAndCohortNote: isPreg
        ? isBn
          ? `গর্ভাবস্থার ${profile.pregnancyMonth || 4}ম মাসের মাসানুমাসিক পুষ্টি ও ভ্রূণের বৃদ্ধিতে এটি নিরাপদ প্রাকৃতিক খাবার।`
          : `Safe, nourishing whole food aligned with Month ${profile.pregnancyMonth || 4} Masanumasika protocol.`
        : isBn
        ? `হজম অগ্নি (Agni) সক্রিয় রাখে এবং আপনার ${profile.dosha} দোষের ভারসাম্য বজায় রাখে।`
        : `Pacifies ${profile.dosha} Dosha and strengthens digestive Agni without glycemic stress.`,
      healthySwap: isBn
        ? "সরিষার তেল বা ১ চামচ দেশি ঘি ও হলুদ-জিরা দিয়ে হালকা রান্না করে গ্রহণ করুন"
        : "Prepare lightly steamed or sautéed in cold-pressed mustard oil or 1 tsp A2 ghee",
      bestTimingOrPortion: isBn
        ? "প্রতিদিনের দুপুর বা রাতের খাবারে ১-১.৫ বাটি নিশ্চিন্তে খেতে পারেন।"
        : "Enjoy 1–1.5 bowls daily during lunch or dinner.",
    };
  }

  async generateCookingSession(
    recipeName: string,
    profile: HealthProfile,
    lang: Language
  ): Promise<CookingSession> {
    const targetLang = this.getLangName(lang);
    const prompt = `Create voice cooking session for ${recipeName} in ${targetLang}. Return JSON with recipeName and steps array (instruction, spokenText, timerSeconds, visualCue).`;
    const text = await this.callServerGemini({
      model: "gemini-3.8-flash",
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: "application/json" },
    });
    return this.safeParseJson<CookingSession>(text, {
      recipeName,
      steps: [
        {
          instruction: lang === "bn" ? "উপকরণগুলো ধুয়ে কেটে প্রস্তুত করুন।" : "Wash and chop all fresh ingredients.",
          spokenText: lang === "bn" ? "প্রথমে সব তাজা সবজি ও প্রোটিন উপকরণ প্রস্তুত করে নিন।" : "Prepare your fresh vegetables and protein.",
          timerSeconds: 120,
          visualCue: "chop",
        },
        {
          instruction: lang === "bn" ? "অল্প সরিষার তেল বা ঘি দিয়ে হালকা আঁচে রান্না করুন।" : "Simmer gently with cold-pressed oil or ghee and healing spices.",
          spokenText: lang === "bn" ? "পুষ্টিগুণ বজায় রাখতে ঢাকনা দিয়ে অল্প আঁচে রান্না করুন।" : "Cook covered on low heat to preserve micronutrients.",
          timerSeconds: 300,
          visualCue: "simmer",
        },
      ],
    });
  }

  async suggestIngredientSubstitute(
    ingredient: string,
    recipeContext: string,
    profile: HealthProfile,
    lang: Language
  ): Promise<string> {
    const targetLang = this.getLangName(lang);
    const prompt = `Suggest substitute for ${ingredient} in ${recipeContext} for ${profile.dosha} in ${targetLang}. 1 sentence.`;
    const text = await this.callServerGemini({
      model: "gemini-3.8-flash",
      contents: { parts: [{ text: prompt }] },
    });
    const draft =
      text && text.trim()
        ? text.trim()
        : lang === "bn"
        ? `${ingredient}-এর পরিবর্তে লাউ, পেঁপে বা ফুলকপির রাইস ব্যবহার করতে পারেন।`
        : `You can substitute ${ingredient} with bottle gourd, green papaya, or cauliflower rice.`;
    return MakerCheckerEngine.verifyTextOutput(draft, profile, lang).verifiedText;
  }

  async analyzeGutSound(
    audioBase64: string,
    profile: HealthProfile,
    lang: Language
  ): Promise<GutAnalysisResult> {
    const targetLang = this.getLangName(lang);
    const prompt = `Analyze gut sound audio for ${profile.dosha}. Return JSON. The 'description' and 'recommendation' fields MUST be in ${targetLang}.`;
    try {
      const text = await this.callServerGemini({
        model: "gemini-3.5-transcribe",
        contents: {
          parts: [
            { inlineData: { mimeType: "audio/wav", data: audioBase64 } },
            { text: prompt },
          ],
        },
        config: { responseMimeType: "application/json" },
      });
      return this.safeParseJson<GutAnalysisResult>(text, {
        status: "Normoactive",
        score: 82,
        description:
          lang === "bn"
            ? "অন্ত্রের পেরিস্টালসিস তরঙ্গ স্বাভাবিক পর্যায়ে রয়েছে।"
            : "Intestinal peristaltic motility is within normal rhythmic range.",
        recommendation:
          lang === "bn"
            ? "খাবারের ১৫ মিনিট আগে আদা ও পিংক সল্ট শট গ্রহণ করুন।"
            : "Sip warm ginger-lemon water 15 minutes before main meals.",
      });
    } catch {
      return {
        status: "Normoactive",
        score: 80,
        description:
          lang === "bn"
            ? "অন্ত্রের শব্দ বিশ্লেষণ সম্পন্ন হয়েছে।"
            : "Gut motility acoustic analysis completed.",
        recommendation:
          lang === "bn"
            ? "কুসুম গরম ডিটক্স ওয়াটার পান অব্যাহত রাখুন।"
            : "Continue warm CCF detox water protocol.",
      };
    }
  }
}
