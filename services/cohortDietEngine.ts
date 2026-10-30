import {
  HealthProfile,
  DietPhaseChart,
  Phase,
  DailyPlan,
  Meal,
  TrafficLightGuide,
  TrafficLightFoodItem,
  CohortType,
  CohortSafetyAlert,
  NutrientBooster,
  AyurvedicMasanumasikaMonth,
} from '../types';
import {
  AYURVEDIC_MASANUMASIKA_MONTHS,
  COHORT_NUTRIENT_BOOSTERS,
  ZERO_HERBS_WARNING_BN,
  ZERO_HERBS_WARNING_EN,
} from '../data/cohortData';
import { generateComprehensiveTrafficLightGuide } from '../data/bdFoodCompositionDatabase';

export class CohortDietEngine {
  /**
   * Determine pregnancy month (1-9) from profile answers or defaults to Month 1
   */
  public static getPregnancyMonth(profile: HealthProfile): number {
    if (profile.pregnancyMonth && profile.pregnancyMonth >= 1 && profile.pregnancyMonth <= 9) {
      return profile.pregnancyMonth;
    }
    const stage = profile.answers?.['preg_stage'] || '';
    if (stage.startsWith('m')) {
      const parsed = parseInt(stage.replace('m', ''), 10);
      if (parsed >= 1 && parsed <= 9) return parsed;
    }
    return 1;
  }

  /**
   * Builds cohort-specific clinical safety alerts
   */
  public static generateSafetyAlerts(profile: HealthProfile): CohortSafetyAlert[] {
    const alerts: CohortSafetyAlert[] = [];
    const cohort = profile.cohortType || 'adult_metabolic';

    if (cohort === 'pregnancy_lactation') {
      // 1. Mandatory Zero Herbs Alert
      alerts.push({
        id: 'preg_zero_herbs',
        severity: 'critical',
        titleBn: 'কঠোর সতর্কতা: কোনো ঔষধি হার্বস গ্রহণ করবেন না (Zero Herbs Rule)',
        titleEn: 'Strict Safety Alert: Zero Medicinal Herbs Allowed',
        descriptionBn: ZERO_HERBS_WARNING_BN,
        descriptionEn: ZERO_HERBS_WARNING_EN,
        prohibitedFoods: [
          'শতাবরী (Shatavari)',
          'অশ্বগন্ধা (Ashwagandha)',
          'গোক্ষুর (Gokshura)',
          'বালা (Bala)',
          'যষ্টিমধু (Licorice/Yashtimadhu)',
          'বাণিজ্যিক হার্বাল বড়ি বা মিশ্রণ',
        ],
      });

      // 2. Papaya and Pineapple Uterine Contraction Alert
      alerts.push({
        id: 'preg_papaya_pineapple',
        severity: 'critical',
        titleBn: 'খাদ্য নিষেধাজ্ঞা: কাঁচা পেঁপে ও অতিরিক্ত আনারস বর্জন',
        titleEn: 'Contraindicated Foods: Raw Papaya & Pineapple',
        descriptionBn:
          'কাঁচা বা আধাপাকা পেঁপেতে থাকা ল্যাটেক্স ও প্যাপেইন জরায়ুর পেশি সংকোচন ঘটাতে পারে। আনারসের ব্রোমেলেন জরায়ুমুখ নরম করে সময়ের আগেই প্রসবের ঝুঁকি তৈরি করতে পারে।',
        descriptionEn:
          'Unripe green papaya latex triggers uterine smooth muscle contractions. Excess pineapple bromelain can induce premature cervical effacement.',
        prohibitedFoods: ['কাঁচা পেঁপে', 'আধাপাকা পেঁপে', 'আনারস', 'অতিরিক্ত কাঁচা রসুন'],
      });

      // Check GDM
      const gdm = profile.answers?.['preg_blood_sugar'];
      if (gdm === 'gdm_diet' || gdm === 'gdm_insulin' || gdm === 'borderline') {
        alerts.push({
          id: 'preg_gdm_alert',
          severity: 'warning',
          titleBn: 'জিডিএম সতর্কতা: গ্লাইসেমিক ইনডেক্স ও সাদা চিনি নিয়ন্ত্রণ',
          titleEn: 'Gestational Diabetes (GDM) Blood Sugar Shield',
          descriptionBn:
            'রক্তে গ্লুকোজ ৯২ mg/dL এর নিচে রাখতে সাদা চিনি, মিষ্টি, ময়দা ও কোমল পানীয় সম্পূর্ণ পরিহার করুন। লাল চাল ও মুগ ডালের জটিল কার্বোহাইড্রেট গ্রহণ করুন।',
          descriptionEn:
            'Maintain fasting glucose <92 mg/dL. Strictly eliminate table sugar, sweet desserts, and refined flour; prioritize unpolished red rice and legumes.',
          prohibitedFoods: ['সাদা চিনিযুক্ত মিষ্টি', 'কোল্ড ড্রিংকস', 'ময়দার পরোটা', 'প্যাকেটজাত ফলের রস'],
        });
      }

      // Check BP
      const bp = profile.answers?.['preg_bp_edema'];
      if (bp === 'high_bp' || bp === 'preeclampsia') {
        alerts.push({
          id: 'preg_bp_alert',
          severity: 'critical',
          titleBn: 'প্রি-এক্লাম্পসিয়া প্রতিরোধ: কাঁচা লবণ ও অতিরিক্ত সোডিয়াম নিষেধ',
          titleEn: 'Preeclampsia Warning: Strict Sodium & BP Monitoring',
          descriptionBn:
            'উচ্চ রক্তচাপ প্রতিরোধে পাতে কাঁচা লবণ, চিপস ও নোনতা খাবার সম্পূর্ণ বন্ধ রাখুন। ধনে ও মৌরি ভেজানো জল পানে শরীর থেকে অতিরিক্ত তরল নিষ্কাশন করুন।',
          descriptionEn:
            'Strictly ban added table salt and salty processed snacks. Sip coriander-fennel infusion for natural fluid elimination.',
          prohibitedFoods: ['পাতে কাঁচা লবণ', 'লবণাক্ত চিপস ও চানাচুর', 'অতিরিক্ত আচার'],
        });
      }
    } else if (cohort === 'oncology_cancer') {
      const anc = profile.answers?.['onco_neutropenia_wbc'];
      if (anc === 'severe_neutropenia' || anc === 'mild_neutropenia') {
        alerts.push({
          id: 'onco_neutropenic_diet',
          severity: 'critical',
          titleBn: 'কঠোর নিউট্রোপেনিক সতর্কতা: কাঁচা খাবার ও জীবাণুযুক্ত খাবার সম্পূর্ণ নিষিদ্ধ',
          titleEn: 'Strict Neutropenic Diet Protocol (Low ANC Infection Risk)',
          descriptionBn:
            'শ্বেত রক্তকণিকা কম থাকায় ইনফেকশন জীবনের জন্য ঝুঁকিপূর্ণ। কোনো কাঁচা সালাদ, না ধোয়া ফল, কাঁচা দুধ বা রাস্তার খাবার খাবেন না। সব খাবার অন্তত ১০০°C তাপমাত্রায় ভালো করে ফুটিয়ে রান্না করতে হবে।',
          descriptionEn:
            'Absolute zero raw vegetables, unpeeled fruits, unpasteurized milk, or street snacks. All foods must be thoroughly boiled and cooked above 100°C to destroy micro-pathogens.',
          prohibitedFoods: ['কাঁচা শসা/টমেটো সালাদ', 'খোসাযুক্ত কাঁচা ফল', 'রাস্তার খাবার', 'কাঁচা ডিম বা দুধ'],
        });
      }
    } else if (cohort === 'child_pediatric') {
      alerts.push({
        id: 'child_zero_junk_preservatives',
        severity: 'warning',
        titleBn: 'শিশু পুষ্টি সতর্কতা: প্রিজারভেটিভ ও কৃত্রিম মিষ্টি বর্জন',
        titleEn: 'Pediatric Warning: Zero Artificial Colors & Excess Sugar',
        descriptionBn:
          'প্যাকেটজাত জুস ও চিপসের অ্যাডিটিভ শিশুদের মনোযোগের ঘাটতি (ADHD) এবং অন্ত্রের ভালো ব্যাকটেরিয়ার বিনাশ ঘটায়। ঘরে তৈরি তাজা খাবার দিন।',
        descriptionEn:
          'Synthetic food colorings and high fructose corn syrup deplete gut microbiome and aggravate behavioral hyperactivity.',
        prohibitedFoods: ['প্যাকেটজাত রঙিন জুস', 'চিপস ও কুড়কুড়ে', 'চকলেট ও কৃত্রিম ক্যান্ডি'],
      });
    } else if (cohort === 'adolescent_growth') {
      alerts.push({
        id: 'adol_skip_breakfast_warning',
        severity: 'info',
        titleBn: 'কৈশোর পুষ্টি গাইড: সকালের নাশতা না খাওয়ার ক্ষতিকর প্রভাব',
        titleEn: 'Adolescent Nutrition: Never Skip Morning Fuel',
        descriptionBn:
          'সকালে নাশতা না খেলে মেটাবলিজম ধীর হয়ে যায় এবং বিকেলে ফাস্টফুডের তীব্র ক্রেভিং তৈরি হয়। ডিম ও লাল আটার রুটি দিয়ে দিন শুরু করুন।',
        descriptionEn:
          'Skipping breakfast causes morning cortisol spikes and evening bingeing on trans-fat snacks. Anchor mornings with protein.',
        prohibitedFoods: ['কার্বনেটেড কোল্ড ড্রিংকস', 'ডিপ ফ্রাইড ফাস্টফুড', 'ইনস্ট্যান্ট নুডলস'],
      });
    } else if (cohort === 'adult_metabolic') {
      alerts.push({
        id: 'adult_refined_carb_alert',
        severity: 'warning',
        titleBn: 'মেটাবলিক শিল্ড: রিফাইন্ড কার্বোহাইড্রেট ও ফ্রুক্টোজ নিয়ন্ত্রণ',
        titleEn: 'Metabolic Shield: Eliminate Industrial Seed Oils & Refined Carbs',
        descriptionBn:
          'ফ্যাটি লিভার ও ইনসুলিন রেজিস্ট্যান্স দূর করতে পরিশোধিত সয়াবিন তেল, চিনি ও সাদা ভাতের পরিমাণ নিয়ন্ত্রণ করে ভালো চর্বি (ঘি, সরিষার তেল) গ্রহণ করুন।',
        descriptionEn:
          'Cut industrial seed oils, table sugar, and refined grains to allow liver de-steatosis and restore insulin sensitivity.',
        prohibitedFoods: ['সয়াবিন/পাম তেল', 'সাদা চিনিযুক্ত মিষ্টি ও বেকারি', 'অতিরিক্ত সাদা চাল'],
      });
    } else if (cohort === 'underweight_nutrition') {
      alerts.push({
        id: 'uw_clean_brumhana_surplus',
        severity: 'info',
        titleBn: 'বৃংহণ (Brumhana) পুষ্টি নীতি: ফাস্টফুড বা ট্রান্স-ফ্যাট দিয়ে ওজন বাড়ানো নিষেধ',
        titleEn: 'Clean Brumhana Rule: Healthy Caloric Surplus Without Junk Trans-Fats',
        descriptionBn:
          'ওজন বাড়ানোর জন্য ডুবো তেলে ভাজা খাবার, বেকারি বা চিনিযুক্ত কোমল পানীয় খেলে শুধু পেটে ভিসেরাল চর্বি ও ফ্যাটি লিভার তৈরি হয়। খাঁটি দেশি ঘি, ভেজানো বাদাম-খেজুর, ছাতু, ডিম, মাছ ও সহজপাচ্য শর্করার মাধ্যমে লিন মাসল গঠন করুন।',
        descriptionEn:
          'Never use deep-fried fast foods or refined sugars to gain weight—they cause visceral belly fat and gut dysbiosis. Build lean muscle mass using A2 ghee, soaked nuts, dates, roasted gram sattu, eggs, and fish.',
        prohibitedFoods: ['ডুবো তেলে ভাজা ফাস্টফুড', 'কৃত্রিম মিষ্টি ও কোল্ড ড্রিংকস', 'পাম/সয়াবিন তেলের বেকারি খাবার'],
      });

      const rootCauses = profile.answers?.['uw_root_cause_screening'] || '';
      if (rootCauses.includes('hyperthyroid')) {
        alerts.push({
          id: 'uw_hyperthyroid_alert',
          severity: 'warning',
          titleBn: 'হাইপারথাইরয়েড মেটাবলিক ওভারবার্ন সতর্কতা',
          titleEn: 'Hyperthyroid Catabolic Overburn Shield',
          descriptionBn:
            'হাইপারথাইরয়েডিজমে শরীরের মেটাবলিক রেট অস্বাভাবিক বেশি থাকে। ক্যাফেইন (কড়া চা/কফি) বুক ধড়ফড়ানি ও ওজন ক্ষয় বাড়িয়ে দেয়—তাই ক্যাফেইন বর্জন করুন এবং দিনে ৪–৫ বার প্রোটিন ও স্নিগ্ধ ঘি-যুক্ত খাবার গ্রহণ করুন।',
          descriptionEn:
            'Hyperthyroidism accelerates catabolic burn. Avoid caffeine/strong coffee which worsens tachycardia and weight loss; maintain frequent protein and ghee-enriched meals.',
          prohibitedFoods: ['কড়া কফি ও এনার্জি ড্রিংকস', 'অতিরিক্ত ঝাল ও উত্তেজক মসলা', 'দীর্ঘক্ষণ না খেয়ে থাকা'],
        });
      }

      const gutMal = profile.answers?.['uw_gut_malabsorption'] || '';
      const fatTol = profile.answers?.['uw_calorie_dense_tolerance'] || '';
      if (gutMal === 'post_meal_ibs_rush' || gutMal === 'bloating_mucus_stool' || fatTol === 'milk_lactose_issue') {
        alerts.push({
          id: 'uw_agni_deepana_malabsorption_alert',
          severity: 'warning',
          titleBn: 'গাট ম্যালঅ্যাবজর্পশন ও অগ্নি দীপন প্রোটোকল (IBS / Lactose Guard)',
          titleEn: 'Gut Malabsorption & Agni Deepana Protocol',
          descriptionBn:
            'আপনার অন্ত্রের শোষণ ক্ষমতা (Villi Absorption) দুর্বল থাকায় সরাসরি গরুর দুধ বা অতিরিক্ত ভারী খাবার খেলে পেট ফাঁপা বা লুজ মোশন হতে পারে। দুধের বদলে ঘোলের শরবত (Takra), ঘরে পাতা টক দই, ছাতু ও আদা-জিরা-ঘি ফোড়ন দেওয়া নরম খাবার গ্রহণ করুন।',
          descriptionEn:
            'Due to sensitive gut absorption/IBS, replace plain liquid cow milk with probiotic buttermilk (Takra), curd, roasted sattu, and ginger-cumin tempered easy-to-assimilate meals.',
          prohibitedFoods: ['খালি পেটে সরাসরি কাঁচা/তরল দুধ', 'অতিরিক্ত কাঁচা সালাদ', 'বাসি ও গুরুপাক ভাজাপোড়া'],
        });
      }
    }

    return alerts;
  }

  /**
   * Generates cohort-specific Traffic Light Food Guide
   */
  public static generateCohortTrafficLight(profile: HealthProfile): TrafficLightGuide {
    const cohort = profile.cohortType || 'adult_metabolic';
    const month = this.getPregnancyMonth(profile);

    if (cohort === 'pregnancy_lactation') {
      const masanumasika = AYURVEDIC_MASANUMASIKA_MONTHS[month] || AYURVEDIC_MASANUMASIKA_MONTHS[1];
      const items: TrafficLightFoodItem[] = [
        // GREEN ZONE (Nutrient powerhouses)
        {
          id: 'preg_green_ghee',
          nameBn: 'খাঁটি দেশি গাওয়া ঘি (A2 Deshi Ghee)',
          nameEn: 'Pure A2 Deshi Cow Ghee',
          category: 'Healthy Fats & Seeds',
          zone: 'green',
          caloriesPer100g: 900,
          clinicalReasonBn:
            'আয়ুর্বেদ মতে গর্ভকালে ঘি অপান বায়ুকে শান্ত রাখে, বাচ্চার স্নায়ুকোষ গড়ে এবং প্রসব সহজ করে।',
          clinicalReasonEn:
            'Classical Ayurvedic staple for fetal neuro-development, maternal tissue elasticity, and Apana Vayu regulation.',
        },
        {
          id: 'preg_green_pomegranate',
          nameBn: 'মিষ্টি ডালিম / বেদানা (Pomegranate)',
          nameEn: 'Fresh Sweet Pomegranate',
          category: 'Fruits & Snacks',
          zone: 'green',
          caloriesPer100g: 83,
          clinicalReasonBn:
            'প্রাকৃতিক নন-হিম আয়রন ও পলিফেনল যা প্লাসেন্টায় রক্ত ও অক্সিজেন সরবরাহ বহুগুণ বাড়ায়।',
          clinicalReasonEn:
            'High natural bioavailable iron and polyphenols optimizing placental capillary perfusion.',
        },
        {
          id: 'preg_green_dates',
          nameBn: 'নরম খেজুর (Medjool Dates)',
          nameEn: 'Soft Fresh Dates',
          category: 'Fruits & Snacks',
          zone: 'green',
          caloriesPer100g: 277,
          clinicalReasonBn:
            'রক্তাল্পতা দূর করে এবং বিশেষ করে ৩য় ত্রৈমাসিকে নিয়মিত সেবনে প্রসবের সময় সারভিক্স নরম করতে বৈজ্ঞানিকভাবে প্রমাণিত।',
          clinicalReasonEn:
            'Evidence-based cervical ripening agent; shortens labor duration and provides rapid clean glycogen.',
        },
        {
          id: 'preg_green_milk_porridge',
          nameBn: 'দুধ ও সুগন্ধি চালের নরম জাউ (Ksheera Yavagu)',
          nameEn: 'Nourishing Milk-Rice Gruel (Yavagu)',
          category: 'Grains & Carbs',
          zone: 'green',
          caloriesPer100g: 140,
          clinicalReasonBn:
            'সহজে হজমযোগ্য এবং ওজস (রোগ প্রতিরোধ শক্তি) ও ভ্রূণের মাংসপেশি গঠনের সেরা আয়ুর্বেদিক পথ্য।',
          clinicalReasonEn:
            'Easily assimilable, bio-available glucose and protein for steady maternal-fetal energy.',
        },
        {
          id: 'preg_green_moong',
          nameBn: 'মুগ ডালের পাতলা ঝোল (Yellow Split Moong)',
          nameEn: 'Yellow Split Moong Broth',
          category: 'Proteins',
          zone: 'green',
          caloriesPer100g: 105,
          clinicalReasonBn:
            'সহজলভ্য প্রোটিন ও ফোলেট; পেটে গ্যাস বা বমি ভাব তৈরি করে না।',
          clinicalReasonEn:
            'Gentlest legume on maternal GI tract, rich in natural folate without gas or bloating.',
        },
        {
          id: 'preg_green_coconut_water',
          nameBn: 'কচি ডাবের পানি (Tender Coconut Water)',
          nameEn: 'Tender Coconut Water',
          category: 'Fruits & Snacks',
          zone: 'green',
          caloriesPer100g: 19,
          clinicalReasonBn:
            'প্রাকৃতিক পটাশিয়াম ও ম্যাগনেসিয়াম যা পায়ের ক্র্যাম্প কমায় এবং ডিহাইড্রেশন দূর করে।',
          clinicalReasonEn:
            'Natural isotonic electrolyte replenisher preventing maternal muscle cramps and heat.',
        },

        // YELLOW ZONE (Caution / Portion controlled)
        {
          id: 'preg_yellow_caffeine',
          nameBn: 'দুধ চা বা কফি (সর্বোচ্চ ১ ছোট কাপ)',
          nameEn: 'Tea / Coffee (Max 1 Small Cup)',
          category: 'Fruits & Snacks',
          zone: 'yellow',
          caloriesPer100g: 45,
          clinicalReasonBn:
            'অতিরিক্ত ক্যাফেইন গর্ভস্থ শিশুর ওজন কমাতে পারে; দিনে ১ কাপের বেশি নয়।',
          clinicalReasonEn:
            'Limit caffeine to <200mg/day to avoid fetal tachycardia and low birth weight.',
        },
        {
          id: 'preg_yellow_tamarind',
          nameBn: 'টক তেঁতুল বা আচার (পরিমিত)',
          nameEn: 'Tamarind & Sour Pickles',
          category: 'Fruits & Snacks',
          zone: 'yellow',
          caloriesPer100g: 120,
          clinicalReasonBn:
            'বমি ভাব কমাতে সামান্য খাওয়া গেলেও বেশি খেলে বুক জ্বালা ও অম্বল বাড়ে।',
          clinicalReasonEn:
            'Can ease morning sickness in tiny amounts, but excess aggravates reflux and hypertension.',
        },

        // RED ZONE (Strict Contraindication — Zero Herbs, Raw Papaya, Pineapple)
        {
          id: 'preg_red_herbs',
          nameBn: 'ঔষধি হার্বস (শতাবরী, অশ্বগন্ধা, গোক্ষুর, যষ্টিমধু ইত্যাদি)',
          nameEn: 'Medicinal Herbs (Shatavari, Ashwagandha, Bala, etc.)',
          category: 'Healthy Fats & Seeds',
          zone: 'red',
          caloriesPer100g: 0,
          clinicalReasonBn:
            'গর্ভকালে কোনো প্রকার ঔষধি ভেষজ খাওয়া সম্পূর্ণ নিষিদ্ধ; শিশুর ওপর ক্ষতিকর পার্শ্বপ্রতিক্রিয়ার ঝুঁকি থাকে।',
          clinicalReasonEn:
            'Strictly prohibited during pregnancy. Unknown phytoestrogens and uterine stimulation risks.',
        },
        {
          id: 'preg_red_papaya',
          nameBn: 'কাঁচা বা আধা পাকা পেঁপে (Raw Papaya)',
          nameEn: 'Raw / Semi-Ripe Green Papaya',
          category: 'Fruits & Snacks',
          zone: 'red',
          caloriesPer100g: 32,
          clinicalReasonBn:
            'কাঁচা পেঁপের ল্যাটেক্স জরায়ুর তীব্র সংকোচন ও গর্ভপাতের ঝুঁকি তৈরি করে।',
          clinicalReasonEn:
            'Contains concentrated latex and papain which trigger acute uterine prostaglandins.',
        },
        {
          id: 'preg_red_pineapple',
          nameBn: 'আনারস ও আনারসের কোর (Pineapple)',
          nameEn: 'Pineapple (Bromelain Core)',
          category: 'Fruits & Snacks',
          zone: 'red',
          caloriesPer100g: 50,
          clinicalReasonBn:
            'ব্রোমেলেন এনজাইম জরায়ুমুখ অকালে নরম করে দিতে পারে।',
          clinicalReasonEn:
            'Bromelain proteolytic activity can soften cervical collagen prematurely.',
        },
        {
          id: 'preg_red_raw_meats',
          nameBn: 'কাঁচা বা আধা সেদ্ধ মাংস, ডিম ও অপাস্তুরিত দুধ',
          nameEn: 'Raw/Undercooked Meat, Eggs & Unpasteurized Dairy',
          category: 'Proteins',
          zone: 'red',
          caloriesPer100g: 220,
          clinicalReasonBn:
            'লিস্টেরিয়া ও টক্সোপ্লাজমা ব্যাকটেরিয়ার মারাত্মক সংক্রমণ গর্ভস্থ শিশুর ক্ষতি করতে পারে।',
          clinicalReasonEn:
            'High risk of Listeria monocytogenes and Toxoplasma gondii causing fetal sepsis.',
        },
      ];

      const bdFctGuide = generateComprehensiveTrafficLightGuide(profile);
      return {
        items: [...items, ...bdFctGuide.items],
        recommendedMealFrequency: 4,
        mealFrequencyReasonBn:
          'গর্ভাবস্থায় জরায়ুর চাপের কারণে একসাথে বেশি না খেয়ে দিনে ৪-৫ বার অল্প অল্প করে পুষ্টিকর স্নিগ্ধ আহার গ্রহণ করা সর্বোত্তম।',
        mealFrequencyReasonEn:
          'Small, frequent, unctuous meals (4-5 times daily) relieve diaphragmatic pressure, combat nausea, and sustain glucose.',
        recommendedDinnerCarbRule: 'cereal_allowed',
        dinnerCarbReasonEn: 'Soft grains like rice-milk gruel (Yavagu) provide nocturnal glucose stability.',
        dinnerCarbReasonBn: 'রাতে নরম চালের জাউ বা পাতলা ফুলকো রুটি রক্তের সুগার স্থির রাখে ও অপান বায়ু স্বাভাবিক রাখে।',
        hasHypoacidity: false,
        clinicalSummaryEn: 'Ayurvedic Masanumasika & Bangladesh Food Composition (BD FCT) guide with zero medicinal herbs.',
        clinicalSummaryBn: 'কোনো ঔষধি হার্বস ছাড়া সম্পূর্ণ ঘরোয়া আয়ুর্বেদিক মাসানুক্রমিক ও বাংলাদেশ ফুড কম্পোজিশন (BD FCT) খাদ্য নির্দেশিকা।',
      };
    }

    // Default for all other cohorts (Oncology, Pediatric, Adolescent, Adult Metabolic, Geriatric)
    return generateComprehensiveTrafficLightGuide(profile);
  }

  /**
   * Builds the complete personalized DietPhaseChart for the given cohort
   */
  public static generateCohortDietChart(
    profile: HealthProfile,
    phase: Phase = Phase.DETOX,
    week: number = 1,
    lang: string = 'bn'
  ): DietPhaseChart {
    const isBn = lang === 'bn';
    const cohort = profile.cohortType || 'adult_metabolic';

    if (cohort === 'pregnancy_lactation') {
      const month = this.getPregnancyMonth(profile);
      const masanumasika = AYURVEDIC_MASANUMASIKA_MONTHS[month] || AYURVEDIC_MASANUMASIKA_MONTHS[1];

      const daysOfWeekBn = ['শনিবার', 'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার'];
      const daysOfWeekEn = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

      const weeklySchedule: DailyPlan[] = daysOfWeekBn.map((dayBn, idx) => {
        const meals: Meal[] = masanumasika.sampleDayMenu.map((m) => ({
          time: m.time,
          mealSlot: m.slot,
          mealName: isBn ? m.mealNameBn : m.mealNameEn,
          description: isBn ? `${m.ingredientsBn}. ${m.benefitsBn}` : `${m.ingredientsEn}. ${m.benefitsEn}`,
          quantity: isBn ? '১ পরিমিত অংশ' : '1 moderate serving',
          calories: '220 - 450 kcal',
          macroBreakdown: {
            protein: '15-25g',
            carbs: '35-50g',
            fats: '10-18g',
            carbSourceType: isBn ? 'জটিল শর্করা ও আঁশ' : 'Complex unpolished carbs',
          },
          benefits: isBn ? [m.benefitsBn] : [m.benefitsEn],
        }));

        return {
          day: isBn ? dayBn : daysOfWeekEn[idx],
          meals,
        };
      });

      return {
        phase,
        currentWeek: week,
        phaseName: isBn ? `গর্ভাবস্থা: ${masanumasika.monthNameBn}` : `Pregnancy: ${masanumasika.monthNameEn}`,
        focus: isBn
          ? `আয়ুর্বেদিক মাসানুক্রমিক পথ্য (${masanumasika.dhatuFocus}) ও ফাংশনাল নিউট্রিশন সমন্বয়ে শিশুর নিরাপদ বিকাশ। কোনো ঔষধি হার্বস ছাড়া ১০০% ঘরোয়া নিরাপদ পথ্য।`
          : `Ayurvedic Masanumasika Paricharya (${masanumasika.dhatuFocus}) harmonized with functional nutrition. 100% wholesome kitchen foods without medicinal herbs.`,
        mealFrequency: 4,
        totalDailyCalories: 1850,
        calorieSplitSummary: isBn ? 'সকাল ৫০০ • দুপুর ৬০০ • বিকেল ২৫০ • রাত ৫০০ kcal' : 'B 500 • L 600 • S 250 • D 500 kcal',
        dinnerCarbStrategy: isBn ? 'নরম খিচুড়ি বা ফুলকো রুটি ও খাঁটি ঘি' : 'Soft Khichuri / Wholemeal Roti & Deshi Ghee',
        medicalSafetyNote: isBn ? ZERO_HERBS_WARNING_BN : ZERO_HERBS_WARNING_EN,
        recommendations: isBn
          ? [
              `শিশুর বর্তমান বিকাশ: ${masanumasika.fetusDevBn}`,
              `আয়ুর্বেদিক লক্ষ্য: ${masanumasika.ayurvedicFocusBn}`,
              `ফাংশনাল নিউট্রিশন: ${masanumasika.functionalNutritionBn}`,
              `কঠোর সতর্কতা: কোনো ঔষধি ভেষজ (হার্বস) গ্রহণ করবেন না। শুধুমাত্র রান্নাঘরের খাঁটি উপাদান গ্রহণ করুন।`,
            ]
          : [
              `Fetal milestone: ${masanumasika.fetusDevEn}`,
              `Ayurvedic focus: ${masanumasika.ayurvedicFocusEn}`,
              `Functional nutrition: ${masanumasika.functionalNutritionEn}`,
              `Strict safety: Zero medicinal herbs. Only pure culinary kitchen ingredients.`,
            ],
        forbiddenFoods: isBn ? masanumasika.prohibitedFoodsBn : masanumasika.prohibitedFoodsEn,
        weeklySchedule,
        supplements: [
          {
            name: isBn ? 'প্রাকৃতিক আয়রন ও ভিটামিন সি কম্বিনেশন (No Herbs)' : 'Natural Dietary Iron + Vit C Pairing',
            dosage: isBn ? 'সকাল ১১টায় ১ বাটি বেদানার দানা ও ভেজানো কিশমিশ' : '1 cup fresh pomegranate seeds & soaked raisins',
            timing: '11:00 AM',
            rationale: isBn
              ? 'হিমোগ্লোবিন বাড়ায় ও প্লাসেন্টায় অক্সিজেন সরবরাহ নিশ্চিত করে।'
              : 'Elevates maternal ferritin without digestive distress.',
            phaseRole: isBn ? 'ভ্রূণের অঙ্গ পোষণ' : 'Fetal Oxygenation',
            tags: ['Dietary Iron', 'Folate', 'No Herbs'],
          },
          {
            name: isBn ? 'খাঁটি গাওয়া ঘি ও দুধের অমৃত (A2 Deshi Ghee Milk)' : 'Pure Cow Ghee & Milk Elixir',
            dosage: isBn ? 'রাতে ঘুমানোর পূর্বে ১ কাপ কুসুম গরম দুধে ১ চামচ ঘি' : '1 cup warm milk with 1 tsp A2 deshi ghee at bedtime',
            timing: '09:45 PM',
            rationale: isBn
              ? 'মস্তিষ্কের স্নায়ুকোষ মজবুত করে এবং অপান বায়ুকে স্বাভাবিক রাখে।'
              : 'Nourishes brain myelin sheath and supports pelvic tissue elasticity.',
            phaseRole: isBn ? 'স্নিগ্ধতা ও ওজস রক্ষা' : 'Ojas & Vitality',
            tags: ['Healthy Fats', 'Ayurvedic Classic', 'No Herbs'],
          },
        ],
        staplesAdvice: {
          salt: isBn ? 'পরিমিত আয়োডিনযুক্ত রান্না করা লবণ (পাতে কাঁচা লবণ সম্পূর্ণ নিষেধ)' : 'Cooked iodized salt only (never raw table salt)',
          saltGramsPerDay: '3-4g',
          oil: isBn ? 'রান্নায় খাঁটি গাওয়া ঘি ও ঘানি ভাঙা সরিষার তেল' : 'Pure deshi ghee and cold-pressed mustard oil',
          water: isBn ? 'দিনে ৮-১০ গ্লাস ফোটানো কুসুম গরম জল ও ডাবের পানি' : '8-10 glasses boiled warm water and tender coconut water',
          waterLitersPerDay: '2.5 - 3.0 Liters',
        },
        activities: [
          {
            type: 'Yoga',
            name: isBn ? 'মৃদু গর্ভকালীন হাঁটা ও শান্ত গভীর শ্বাস-প্রশ্বাস' : 'Gentle Prenatal Walking & Pranayama',
            duration: isBn ? '১৫-২০ মিনিট' : '15-20 min',
            frequency: isBn ? 'প্রতিদিন' : 'Daily',
            instructions: isBn ? 'শান্তভাবে হাঁটুন এবং ক্লান্তি এলে বিশ্রাম নিন।' : 'Walk at conversational pace, rest when fatigued.',
            visualCue: 'prenatal_walk',
          },
        ],
        macros: {
          protein: 70,
          fats: 60,
          carbs: 220,
        },
      };
    }

    // Fallback for non-pregnancy cohorts
    return {
      phase,
      currentWeek: week,
      phaseName: isBn ? 'ক্লিনিক্যাল থেরাপিউটিক ডায়েট প্ল্যান' : 'Clinical Therapeutic Diet Plan',
      focus: isBn
        ? 'মেটাবলিক ব্যালেন্স ও কোষীয় প্রদাহ হ্রাসকরণ।'
        : 'Metabolic equilibrium and systemic inflammation reduction.',
      recommendations: [
        isBn ? 'সকালে পুষ্টিকর নাস্তা দিয়ে শুরু করুন।' : 'Start your day with high-protein whole foods.',
        isBn ? 'পর্যাপ্ত জল পান করুন এবং রিফাইন্ড চিনি এড়িয়ে চলুন।' : 'Stay well hydrated and eliminate refined sugars.',
      ],
      forbiddenFoods: isBn ? ['সাদা চিনি', 'সয়াবিন তেল', 'কোল্ড ড্রিঙ্কস'] : ['Refined sugar', 'Soybean oil', 'Soft drinks'],
      weeklySchedule: [],
      supplements: [],
      staplesAdvice: {
        salt: isBn ? 'পরিমিত লবণ' : 'Moderate salt',
        oil: isBn ? 'খাঁটি সরিষার তেল ও ঘি' : 'Cold-pressed oils and ghee',
        water: isBn ? '৮-১০ গ্লাস জল' : '8-10 glasses water',
      },
      activities: [],
      macros: {
        protein: 65,
        fats: 50,
        carbs: 160,
      },
    };
  }
}

