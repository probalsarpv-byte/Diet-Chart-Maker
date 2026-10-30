import {
  CrossBorderSubstitutionMode,
  CrossBorderSupermarketSwap,
  DietPhaseChart,
  FoodExchangeRow,
  HealthProfile,
  Language,
  Meal,
} from '../types';
import { prioritizeDietChartWithLocalHarvest } from './localHarvestDatabaseService';

export interface GlobalCountryCuisineProfile {
  code: string;
  flag: string;
  countryNameBn: string;
  countryNameEn: string;
  cuisineNameBn: string;
  cuisineNameEn: string;
  mainstreamSupermarketsBn: string;
  mainstreamSupermarketsEn: string;
  ethnicStoresBn: string;
  ethnicStoresEn: string;
  climateMetabolicNoteBn: string;
  climateMetabolicNoteEn: string;
  stapleSubstitutes: {
    fishAndProteinBn: string;
    fishAndProteinEn: string;
    grainsAndCarbsBn: string;
    grainsAndCarbsEn: string;
    greensAndVegBn: string;
    greensAndVegEn: string;
    gourdsAndSquashBn: string;
    gourdsAndSquashEn: string;
    lentilsAndLegumesBn: string;
    lentilsAndLegumesEn: string;
    oilsAndProbioticsBn: string;
    oilsAndProbioticsEn: string;
  };
  sampleNativeMeals: {
    breakfastBn: string;
    breakfastEn: string;
    breakfastDescBn: string;
    breakfastDescEn: string;
    lunchBn: string;
    lunchEn: string;
    lunchDescBn: string;
    lunchDescEn: string;
    snackBn: string;
    snackEn: string;
    snackDescBn: string;
    snackDescEn: string;
    dinnerBn: string;
    dinnerEn: string;
    dinnerDescBn: string;
    dinnerDescEn: string;
  };
}

export const GLOBAL_COUNTRIES_AND_CUISINES: GlobalCountryCuisineProfile[] = [
  {
    code: 'BD',
    flag: '🇧🇩',
    countryNameBn: 'বাংলাদেশ (Bangladesh)',
    countryNameEn: 'Bangladesh',
    cuisineNameBn: 'বাংলাদেশী / দেশি খাবার (Bangladeshi Cuisine)',
    cuisineNameEn: 'Bangladeshi / Deshi Cuisine',
    mainstreamSupermarketsBn: 'স্বপ্ন (Shwapno) · আগোরা (Agora) · মীনা বাজার · স্থানীয় কাঁচাবাজার',
    mainstreamSupermarketsEn: 'Shwapno · Agora · Meena Bazar · Local Fresh Wet Markets',
    ethnicStoresBn: 'স্থানীয় তাজা মাছ ও শাক-সবজির বাজার, অর্গানিক হাট',
    ethnicStoresEn: 'Local fresh river fish & seasonal organic markets',
    climateMetabolicNoteBn:
      'ক্রান্তীয় উষ্ণ ও আর্দ্র আবহাওয়া: ঘামের সাথে ইলেক্ট্রোলাইট ক্ষয় রোধে পর্যাপ্ত পানি, লেবু-পানি ও হালকা সহজপাচ্য ঝোল খাবার উপযোগী।',
    climateMetabolicNoteEn:
      'Tropical warm & humid climate: Prioritize electrolyte hydration, light digestive broths, and seasonal anti-inflammatory greens.',
    stapleSubstitutes: {
      fishAndProteinBn: 'তাজা শিং, মাগুর, রুই, কাতলা, পাবদা, দেশি মুরগি ও ডিম',
      fishAndProteinEn: 'Fresh Shing, Magur, Rui, Katla, Pabda, Deshi Chicken & Eggs',
      grainsAndCarbsBn: 'ঢেঁকিছাঁটা লাল চাল (Red Parboiled Rice), লাল আটার রুটি, ওটস',
      grainsAndCarbsEn: 'Red Parboiled Rice (Lal Chal), Whole Red Wheat Roti, Rolled Oats',
      greensAndVegBn: 'পালং শাক, লাল শাক, কলমি শাক, কচু শাক, সজনে পাতা',
      greensAndVegEn: 'Spinach (Palong), Red Amaranth (Lal Shak), Water Spinach, Taro Leaves, Moringa',
      gourdsAndSquashBn: 'লাউ, কাঁচা পেঁপে, চালকুমড়া, পটল, ঝিঙে, করলা',
      gourdsAndSquashEn: 'Bottle Gourd (Lau), Green Papaya, Ash Gourd, Pointed Gourd, Ridge Gourd, Bitter Melon',
      lentilsAndLegumesBn: 'মসুর ডাল, মুগ ডাল, ছোলা ও মাষকলাই ডাল',
      lentilsAndLegumesEn: 'Red Lentils (Masoor), Yellow Moong Dal, Chickpeas & Black Gram',
      oilsAndProbioticsBn: 'ঘানি ভাঙা সরিষার তেল, দেশি ঘি ও ঘরে পাতা টক দই',
      oilsAndProbioticsEn: 'Cold-Pressed Mustard Oil, Pure Deshi Ghee & Homemade Sour Curd (Tok Doi)',
    },
    sampleNativeMeals: {
      breakfastBn: 'লাল আটার রুটি / ওটস পরিজ, সবজি ও সিদ্ধ ডিম',
      breakfastEn: 'Red Wheat Roti / Rolled Oats Porridge, Mixed Greens & Boiled Egg',
      breakfastDescBn:
        'হালকা মসলায় রান্না লাউ-পেঁপে সবজি, ২টি পাতলা লাল আটার রুটি (অথবা ওটস) এবং ১-২টি দেশি সিদ্ধ ডিম।',
      breakfastDescEn:
        'Lightly spiced Bottle Gourd & Green Papaya medley with 2 thin Red Wheat Rotis (or Rolled Oats) and 1–2 boiled eggs.',
      lunchBn: 'ঢেঁকিছাঁটা লাল চালের ভাত, শিং/রুই মাছের পাতলা ঝোল, শাক ও মুগ ডাল',
      lunchEn: 'Red Parboiled Rice, Light Rui/Shing Fish Broth, Leafy Greens & Moong Dal',
      lunchDescBn:
        '১ কাপ লাল চালের ভাত, ১২০ গ্রাম মাছের ঝোল (হলুদ, জিরা ও আদা দিয়ে), পালং/লাল শাক ভাজি এবং ১ বাটি পাতলা ডাল ও টক দই।',
      lunchDescEn:
        '1 cup Red Parboiled Rice, 120g Fish Curry with turmeric-ginger broth, sautéed leafy greens, light Moong Dal, and probiotic curd.',
      snackBn: 'ভাজা ছোলা / কাঠবাদাম, পেয়ারা বা শসা ও গ্রিন টি',
      snackEn: 'Roasted Chickpeas / Almonds, Guava or Cucumber Slices & Herbal Tea',
      snackDescBn:
        '১ মুঠো কাঠবাদাম ও আখরোট বা ভাজা ছোলা, অর্ধেক পেয়ারা/শসা এবং আদা-তুলসী চা।',
      snackDescEn:
        'A handful of soaked almonds/walnuts or roasted chickpeas, fresh guava/cucumber, and ginger-tulsi infusion.',
      dinnerBn: 'লাউ-পেঁপে সিদ্ধ সবজি, গ্রিলড/ঝোল মাছ বা মুরগি ও ক্লিয়ার স্যুপ',
      dinnerEn: 'Steamed Bottle Gourd & Papaya Medley, Poached Fish/Chicken & Clear Soup',
      dinnerDescBn:
        'রাতে শর্করা নিয়ন্ত্রণে ভাতের পরিবর্তে ১ বাটি লাউ-পেঁপে-ফুলকপি সবজি, ১২০ গ্রাম মাছ বা দেশি মুরগির স্টু এবং ১ চামচ ঘি।',
      dinnerDescEn:
        'Low-glycemic vegetable-carb dinner with steamed Bottle Gourd/Papaya/Cauliflower, 120g fish or chicken stew, and 1 tsp Ghee.',
    },
  },
  {
    code: 'US',
    flag: '🇺🇸',
    countryNameBn: 'যুক্তরাষ্ট্র / আমেরিকা (United States)',
    countryNameEn: 'United States (USA)',
    cuisineNameBn: 'আমেরিকান / ওয়েস্টার্ন ক্লিনিক্যাল কুইজিন (American / Western)',
    cuisineNameEn: 'American / Clean Western Cuisine',
    mainstreamSupermarketsBn: 'Whole Foods · Walmart · Costco · Trader Joe’s · Kroger · Aldi',
    mainstreamSupermarketsEn: 'Whole Foods · Walmart · Costco · Trader Joe’s · Kroger · Aldi',
    ethnicStoresBn: 'Patel Brothers · H-Mart · local Bangladeshi / Deshi Halal Grocery (Jackson Heights, Devon, etc.)',
    ethnicStoresEn: 'Patel Brothers · H-Mart · Local Bangladeshi / South Asian Halal Grocers',
    climateMetabolicNoteBn:
      'উত্তর আমেরিকার আবহাওয়া ও ইনডোর হিটিং/এসি: শুষ্ক বাতাসে ত্বক ও গাট হাইড্রেশন বজায় রাখতে ইলেক্ট্রোলাইট ও কুসুম গরম পানি পান করুন এবং শীতপ্রধান রাজ্যে Vitamin D3 + K2 ও Omega-3 নিশ্চিত করুন।',
    climateMetabolicNoteEn:
      'North American climate & indoor HVAC/heating: Maintain warm electrolyte hydration against dry air and prioritize Vitamin D3 + K2 & Omega-3 in northern latitudes.',
    stapleSubstitutes: {
      fishAndProteinBn:
        'রুই/কাতলা/শিং মাছের বদলে: Wild-Caught Catfish, Cod, Tilapia, Trout বা Wild Alaskan Salmon (Whole Foods/Costco) · দেশি মুরগির বদলে: Organic Pasture-Raised Chicken Breast/Thigh',
      fishAndProteinEn:
        'For Rui/Katla/Shing: Wild-Caught Catfish, Cod, Tilapia, Rainbow Trout, or Wild Alaskan Salmon (Whole Foods/Costco) · For Deshi Chicken: Organic Pasture-Raised Chicken',
      grainsAndCarbsBn:
        'ঢেঁকিছাঁটা লাল চালের বদলে: Lundberg Red Cargo Rice / Organic Parboiled Brown Basmati / Quinoa · লাল আটার বদলে: Whole Wheat Tortilla বা Ezekiel Sprouted Bread / Sujata Chakki Atta',
      grainsAndCarbsEn:
        'For Red Parboiled Rice: Lundberg Red Cargo Rice / Organic Brown Basmati / Quinoa · For Red Atta: Whole Grain Tortilla, Ezekiel Sprouted Bread, or Whole Wheat Chakki Atta',
      greensAndVegBn:
        'পালং/লাল/কচু শাকের বদলে: Organic Baby Spinach, Tuscan Kale, Swiss Chard, Collard Greens বা Broccoli Rabe (Walmart/Whole Foods)',
      greensAndVegEn:
        'For Palong/Lal/Kochu Shak: Organic Baby Spinach, Lacinato Kale, Swiss Chard (closest to Beet/Lal Shak), or Collard Greens (closest to Kochu/Mustard greens)',
      gourdsAndSquashBn:
        'লাউ/পেঁপে/পটল/চালকুমড়ার বদলে: Zucchini, Yellow Summer Squash, Chayote Squash (Mirliton - একদম লাউ/পেঁপের মতো), বা Spaghetti Squash (বা H-Mart থেকে Opo Squash)',
      gourdsAndSquashEn:
        'For Lau/Green Papaya/Potol: Chayote Squash (identical texture/GI to Lau/Papaya), Green Zucchini, Yellow Squash, or Opo Squash at H-Mart',
      lentilsAndLegumesBn:
        'মসুর/মুগ ডালের বদলে: Red Split Lentils, Hulled Yellow Mung Beans, বা Organic Chickpeas (Garbanzo Beans)',
      lentilsAndLegumesEn:
        'For Masoor/Moong Dal: Red Split Lentils, Yellow Mung Dal, or Organic Garbanzo Beans (available at Trader Joe’s / Whole Foods)',
      oilsAndProbioticsBn:
        'টক দইয়ের বদলে: Plain Unsweetened Greek Yogurt (Fage 0%/2%) বা Kefir · তেলের বদলে: Organic Grass-Fed Ghee, Extra Virgin Olive Oil বা Avocado Oil',
      oilsAndProbioticsEn:
        'For Tok Doi: Plain Unsweetened Greek Yogurt (Fage/Chobani) or Lifeway Kefir · For Oils: Grass-Fed Ghee, Cold-Pressed Extra Virgin Olive Oil, or Avocado Oil',
    },
    sampleNativeMeals: {
      breakfastBn: 'স্টিল-কাট ওটস, বেরি, চিয়া সিড ও পোচড অর্গানিক ডিম',
      breakfastEn: 'Steel-Cut Oats with Berries, Chia Seeds & Pasture-Raised Poached Eggs',
      breakfastDescBn:
        'অ্যাভোকাডো ও বেবি স্পিনাচসহ ২টি অর্গানিক ডিম এবং ১/২ কাপ স্টিল-কাট ওটস ও ব্লুবেরি।',
      breakfastDescEn:
        '2 pasture-raised eggs with sautéed baby spinach & avocado, paired with ½ cup steel-cut oats and fresh blueberries.',
      lunchBn: 'গ্রিলড ওয়াইল্ড স্যামন/কড, কুইনোয়া/ব্রাউন রাইস ও রোস্টেড ব্রকলি-জুচিনি',
      lunchEn: 'Grilled Wild Salmon or Cod Bowl with Quinoa, Roasted Broccoli & Zucchini',
      lunchDescBn:
        '১৩০ গ্রাম গ্রিলড স্যামন বা চিকেন ব্রেস্ট, ১ কাপ কুইনোয়া বা ব্রাউন বাসমতি, অলিভ অয়েল ড্রেসিং ও গ্রিন সালাদ।',
      lunchDescEn:
        '130g wild-caught salmon or organic chicken breast, 1 cup quinoa or brown rice, roasted zucchini/broccoli, and extra-virgin olive oil.',
      snackBn: 'প্লেইন গ্রিক ইয়োগার্ট, ওয়ালনাট ও গ্রিন আপেল স্লাইস',
      snackEn: 'Plain Greek Yogurt with Walnuts, Cinnamon & Crisp Apple Slices',
      snackDescBn: '১/২ কাপ আনসুইটেনড গ্রিক ইয়োগার্ট, আখরোট ও দারুচিনি গুঁড়া।',
      snackDescEn: '½ cup unsweetened Greek yogurt topped with raw walnuts and Ceylon cinnamon.',
      dinnerBn: 'হার্ব-বেকড চিকেন/মাছ ও স্টিমড চাওটে স্কোয়াশ, কেল ও কলিফ্লাওয়ার রাইস',
      dinnerEn: 'Herb-Baked Fish or Chicken with Steamed Chayote, Kale & Cauliflower Rice',
      dinnerDescBn:
        'রাতে লো-কার্ব ডিনার: ফুলকপির রাইস, জুচিনি ও বেবি স্পিনাচের সাথে বেকড কড বা চিকেন স্যুপ।',
      dinnerDescEn:
        'Grain-free metabolic dinner featuring herb-baked cod or chicken breast over steamed cauliflower rice, zucchini, and Tuscan kale.',
    },
  },
  {
    code: 'GB',
    flag: '🇬🇧',
    countryNameBn: 'যুক্তরাজ্য / ব্রিটেন (United Kingdom)',
    countryNameEn: 'United Kingdom (UK)',
    cuisineNameBn: 'ব্রিটিশ ও মেডিটেরানিয়ান ক্লিন কুইজিন (British / Modern European)',
    cuisineNameEn: 'Modern British & European Clean Cuisine',
    mainstreamSupermarketsBn: 'Tesco · Sainsbury’s · Waitrose · Marks & Spencer · Asda · Aldi',
    mainstreamSupermarketsEn: 'Tesco · Sainsbury’s · Waitrose · M&S Food · Asda · Aldi UK',
    ethnicStoresBn: 'Whitechapel / Brick Lane Bangla Supermarkets · Taj Stores · Local Halal Grocers',
    ethnicStoresEn: 'East London / Birmingham Bangla Grocers · Taj Stores · Local South Asian Supermarkets',
    climateMetabolicNoteBn:
      'যুক্তরাজ্যের মেঘলা ও ঠান্ডা আবহাওয়া: সূর্যালোক কম থাকায় প্রতিদিন Vitamin D3 (2000 IU) গ্রহণ এবং ঠান্ডা-আর্দ্র আবহাওয়ায় আদা-গোলমরিচ-হলুদযুক্ত উষ্ণ স্যুপ ও খাবার গ্রহণ জরুরি।',
    climateMetabolicNoteEn:
      'UK overcast & damp maritime climate: Supplement Vitamin D3 daily during low-sunlight months and favor warming ginger-turmeric broths to counter damp Kapha-Vata chill.',
    stapleSubstitutes: {
      fishAndProteinBn:
        'দেশি মাছের বদলে: Wild Sea Bass, Haddock, Cod Loin, Mackerel বা Scottish Salmon (Tesco/Waitrose) · কিংবা বাংলা স্টোরের ফ্রোজেন শিং/রুই/বোয়াল',
      fishAndProteinEn:
        'For Deshi Fish: Sea Bass, Haddock, Cod Loin, Mackerel, or Scottish Salmon (Tesco/Waitrose) · or IQF Frozen Bengali fish at local Bangla grocers',
      grainsAndCarbsBn:
        'লাল চালের বদলে: Wholegrain Brown Basmati (Tilda), Scottish Porridge Oats বা Wholemeal Pitta/Roti',
      grainsAndCarbsEn:
        'For Red Rice: Tilda Wholegrain Brown Basmati, Scottish Pinhead/Rolled Oats, or Wholemeal Chapati Flour',
      greensAndVegBn:
        'দেশি শাকের বদলে: Cavolo Nero (Black Kale), Spring Greens, Baby Spinach বা Watercress (Sainsbury’s/Tesco)',
      greensAndVegEn:
        'For Deshi Greens: Cavolo Nero, Spring Greens (closest to Mustard/Deshi Shak), Baby Spinach, or Watercress',
      gourdsAndSquashBn:
        'লাউ/পেঁপে/পটলের বদলে: Courgette (Zucchini), Marrow (একদম লাউয়ের সমতুল্য!), Butternut Squash বা Swede',
      gourdsAndSquashEn:
        'For Lau/Papaya/Potol: British Marrow (virtually identical to Bottle Gourd/Lau), Courgette, or Butternut Squash',
      lentilsAndLegumesBn:
        'ডালের বদলে: Red Split Lentils, Puy Lentils, Yellow Mung Dal বা Chickpeas',
      lentilsAndLegumesEn:
        'For Dal: Red Split Lentils, Green Puy Lentils, Yellow Moong Dal, or Chickpeas',
      oilsAndProbioticsBn:
        'টক দইয়ের বদলে: Natural Live Bio Yogurt / Greek-Style Unsweetened Yogurt · ঘি ও Cold-Pressed Rapeseed / Olive Oil',
      oilsAndProbioticsEn:
        'For Tok Doi: Natural Live Bio Yogurt or Authentic Greek Yogurt · Organic Ghee & Cold-Pressed British Rapeseed or Olive Oil',
    },
    sampleNativeMeals: {
      breakfastBn: 'স্কটিশ ওটস পরিজ, ফ্ল্যাক্সসিড ও পোচড ফ্রি-রেঞ্জ ডিম',
      breakfastEn: 'Scottish Porridge Oats with Flaxseeds & Free-Range Poached Eggs',
      breakfastDescBn: 'গরম স্কটিশ ওটস, ২টি ফ্রি-রেঞ্জ ডিম এবং উইল্টেড বেবি স্পিনাচ।',
      breakfastDescEn: 'Warm Scottish oats with milled flaxseed, 2 free-range poached eggs, and wilted spinach.',
      lunchBn: 'প্যান-সিয়ার্ড সি বাস বা স্কটিশ স্যামন, ব্রাউন বাসমতি ও স্প্রিং গ্রিনস',
      lunchEn: 'Pan-Seared Sea Bass or Scottish Salmon with Brown Basmati & Spring Greens',
      lunchDescBn: '১৩০ গ্রাম সি বাস বা হ্যাডক ফিলে, ১ কাপ ব্রাউন বাসমতি ও স্টিমড কোর্জেট।',
      lunchDescEn: '130g sea bass or haddock fillet with brown basmati rice, steamed courgette, and spring greens.',
      snackBn: 'ন্যাচারাল বায়ো ইয়োগার্ট, ওয়ালনাট ও বেরি',
      snackEn: 'Natural Live Bio Yogurt with Walnuts & British Berries',
      snackDescBn: '১ ছোট বাটি আনসুইটেনড বায়ো ইয়োগার্ট ও এক মুঠো বাদাম।',
      snackDescEn: 'Unsweetened live yogurt with raw walnuts and seasonal berries.',
      dinnerBn: 'রোস্টেড চিকেন/হ্যাডক স্টু এবং কোর্জেট-ম্যারো-কলিফ্লাওয়ার মেডলি',
      dinnerEn: 'Herbed Haddock or Chicken Stew with Steamed Marrow, Courgette & Cavolo Nero',
      dinnerDescBn: 'রাতে ভাতের বদলে স্টিমড ম্যারো (লাউয়ের বিকল্প), কোর্জেট ও ক্লিয়ার প্রোটিন স্টু।',
      dinnerDescEn: 'Light evening stew with haddock or chicken breast, steamed marrow, courgette, and cavolo nero.',
    },
  },
  {
    code: 'CA',
    flag: '🇨🇦',
    countryNameBn: 'কানাডা (Canada)',
    countryNameEn: 'Canada',
    cuisineNameBn: 'কানাডিয়ান / নর্থ আমেরিকান ক্লিন কুইজিন (Canadian Clean)',
    cuisineNameEn: 'Canadian / North American Clean Cuisine',
    mainstreamSupermarketsBn: 'Loblaws · Sobeys · Metro · Costco Canada · No Frills · Whole Foods',
    mainstreamSupermarketsEn: 'Loblaws · Sobeys · Metro · Costco Canada · No Frills · Whole Foods',
    ethnicStoresBn: 'Danforth Bangla Stores (Toronto) · Iqbal Halal · T&T Supermarket · Chalo! FreshCo',
    ethnicStoresEn: 'Danforth Bangladeshi Grocers · Iqbal Halal · Chalo! FreshCo · T&T Supermarket',
    climateMetabolicNoteBn:
      'কানাডার দীর্ঘ শীতকাল: তীব্র ঠান্ডায় মেটাবলিক রেট ও গাট ফ্লোরা সচল রাখতে উষ্ণ খাবার, আদা-রসুন-হলুদ ব্রথ, পর্যাপ্ত ওমেগা-৩ এবং প্রতিদিন Vitamin D3 গ্রহণ আবশ্যক।',
    climateMetabolicNoteEn:
      'Canadian sub-zero winter adaptation: Prioritize warming thermogenic spices, bone/vegetable broths, Omega-3 fatty acids, and daily Vitamin D3 supplementation.',
    stapleSubstitutes: {
      fishAndProteinBn:
        'দেশি মাছের বদলে: Wild Pacific Halibut, Cod, Pickerel (Walleye - রুই/ভেটকির দারুণ বিকল্প), Rainbow Trout বা Wild Sockeye Salmon',
      fishAndProteinEn:
        'For Deshi Fish: Freshwater Pickerel/Walleye (closest to Bengali river fish), Rainbow Trout, Pacific Cod, or Wild Sockeye Salmon',
      grainsAndCarbsBn:
        'লাল চালের বদলে: Canadian Wild Rice blend, Parboiled Brown Basmati, বা Steel-Cut Canadian Oats',
      grainsAndCarbsEn:
        'For Red Rice: Parboiled Brown Basmati, Canadian Wild Rice blend, or Organic Rolled/Steel-Cut Oats',
      greensAndVegBn:
        'দেশি শাকের বদলে: Organic Baby Spinach, Kale, Swiss Chard, Bok Choy বা Rapini (Loblaws/Sobeys)',
      greensAndVegEn:
        'For Deshi Greens: Baby Spinach, Swiss Chard, Kale, Bok Choy, or Rapini (Broccoli Rabe)',
      gourdsAndSquashBn:
        'লাউ/পেঁপের বদলে: Chayote Squash, Zucchini, Fuzzy Melon (T&T/Chalo FreshCo-তে তাজা লাউ পাওয়া যায়) বা Spaghetti Squash',
      gourdsAndSquashEn:
        'For Lau/Papaya: Fresh Lau/Opo at Chalo FreshCo & T&T, or Zucchini and Chayote Squash at Loblaws/Sobeys',
      lentilsAndLegumesBn:
        'ডালের বদলে: Canadian Red Split Lentils, Green Laird Lentils, বা Yellow Mung Dal',
      lentilsAndLegumesEn:
        'For Dal: Saskatchewan Red Split Lentils, Green Lentils, Yellow Moong Dal, or Chickpeas',
      oilsAndProbioticsBn:
        'টক দইয়ের বদলে: Balkan-Style Plain Yogurt (Astro 2% Plain) বা Greek Yogurt · Grass-Fed Ghee ও Olive/Avocado Oil',
      oilsAndProbioticsEn:
        'For Tok Doi: Astro Original Balkan-Style Plain Yogurt (identical texture to Bengali Doi!) or 0% Greek Yogurt',
    },
    sampleNativeMeals: {
      breakfastBn: 'কানাডিয়ান রোল্ড ওটস, ফ্ল্যাক্সসিড ও ২টি পোচড ডিম',
      breakfastEn: 'Warm Canadian Rolled Oats, Ground Flax & 2 Poached Eggs',
      breakfastDescBn: 'উষ্ণ ওটমিল, দারুচিনি ও ২টি সিদ্ধ/পোচড ডিম এবং পালং শাক।',
      breakfastDescEn: 'Warm rolled oats with cinnamon and flaxseed alongside 2 poached eggs and sautéed spinach.',
      lunchBn: 'বেকড পিকারেল/ট্রাউট বা স্যামন, ব্রাউন রাইস ও রেড লেন্টিল স্যুপ',
      lunchEn: 'Baked Freshwater Pickerel/Trout or Salmon, Brown Rice & Red Lentil Soup',
      lunchDescBn: '১৩০ গ্রাম পিকারেল বা স্যামন মাছ, ১ কাপ ব্রাউন বাসমতি ও কানাডিয়ান মসুর ডাল।',
      lunchDescEn: '130g freshwater pickerel or salmon, 1 cup brown basmati rice, and Saskatchewan red lentil soup.',
      snackBn: 'বলকান প্লেইন ইয়োগার্ট, আমন্ড ও পাম্পকিন সিড',
      snackEn: 'Balkan-Style Plain Yogurt with Almonds & Pumpkin Seeds',
      snackDescBn: '১/২ কাপ আনসুইটেনড বলকান দই ও রোস্টেড পাম্পকিন সিড।',
      snackDescEn: '½ cup unsweetened Balkan yogurt topped with almonds and pumpkin seeds.',
      dinnerBn: 'গ্রিলড চিকেন/মাছ ও স্টিমড জুচিনি, বক চয় ও ফুলকপির স্টু',
      dinnerEn: 'Grilled Chicken or Cod with Steamed Zucchini, Bok Choy & Cauliflower Stew',
      dinnerDescBn: 'রাতে ভাতের বদলে উষ্ণ জুচিনি-ফুলকপি-বক চয় সবজি ও প্রোটিন ব্রথ।',
      dinnerDescEn: 'Warming grain-free dinner with grilled fish or chicken and steamed zucchini, bok choy, and cauliflower.',
    },
  },
  {
    code: 'AE',
    flag: '🇦🇪',
    countryNameBn: 'মধ্যপ্রাচ্য — UAE / সৌদি আরব / কাতার (Middle East / GCC)',
    countryNameEn: 'Middle East / GCC (UAE, Saudi Arabia, Qatar)',
    cuisineNameBn: 'মধ্যপ্রাচ্য ও আরবীয় ক্লিন কুইজিন (Middle Eastern / Levantine)',
    cuisineNameEn: 'Middle Eastern / Levantine Clean Cuisine',
    mainstreamSupermarketsBn: 'Lulu Hypermarket · Carrefour · Spinneys · Tamimi · Panda · Nesto',
    mainstreamSupermarketsEn: 'Lulu Hypermarket · Carrefour · Spinneys · Tamimi Markets · Nesto',
    ethnicStoresBn: 'Lulu ও Nesto-তে তাজা ও ফ্রোজেন বাংলাদেশী মাছ, লাউ, পটল ও দেশি শাক সহজেই পাওয়া যায়',
    ethnicStoresEn: 'Lulu & Nesto carry fresh flown-in Bangladeshi vegetables (Lau, Potol, Korola) and river fish',
    climateMetabolicNoteBn:
      'মরুভূমির তীব্র গরম ও এসি পরিবেশ: পানিশূন্যতা ও কিডনি স্টোন রোধে প্রতিদিন ৩–৩.৫ লিটার পানি, শসা, লাউ এবং কম সোডিয়াম ও পটাশিয়ামসমৃদ্ধ খাবার গ্রহণ অত্যন্ত জরুরি।',
    climateMetabolicNoteEn:
      'Arid desert heat & continuous AC exposure: Maintain 3–3.5L daily hydration with cooling gourds, cucumber, and balanced electrolytes to prevent dehydration and renal calculi.',
    stapleSubstitutes: {
      fishAndProteinBn:
        'দেশি মাছের বদলে: তাজা Hamour, Sultan Ibrahim, Sea Bream (Sheri), Kingfish বা Lulu-র বাংলাদেশী রুই/শিং মাছ',
      fishAndProteinEn:
        'For Deshi Fish: Fresh Arabian Sea Bream, Sultan Ibrahim, Hamour, or Bangladeshi Rui/Shing at Lulu/Carrefour',
      grainsAndCarbsBn:
        'লাল চালের বদলে: Matta Parboiled Red Rice (Lulu-তে সহজলভ্য), Brown Basmati, বা Whole Wheat Khubz (পাতলা আরবীয় রুটি)',
      grainsAndCarbsEn:
        'For Red Rice: Palakkadan Matta Red Parboiled Rice (widely sold at Lulu/Carrefour), Brown Basmati, or Whole Wheat Khubz',
      greensAndVegBn:
        'দেশি শাকের বদলে: Molokhia (পাট শাকের সমতুল্য!), Rocca (Arugula), Parsley, Spinach বা তাজা লাল/পালং শাক',
      greensAndVegEn:
        'For Deshi Greens: Molokhia (Jute mallow - identical to Bengali Pat Shak!), Rocca, Fresh Spinach, and Parsley',
      gourdsAndSquashBn:
        'লাউ/পেঁপের বদলে: Kousa (Middle Eastern Zucchini/Squash - একদম লাউ/পটলের মতো) বা Lulu-র তাজা লাউ ও পেঁপে',
      gourdsAndSquashEn:
        'For Lau/Potol: Kousa (Middle Eastern Marrow/Squash) or fresh Bottle Gourd & Green Papaya at Lulu Hypermarket',
      lentilsAndLegumesBn:
        'ডালের বদলে: Ads (Red/Yellow Lentils), Hummus/Chickpeas, বা Fava Beans (Foul)',
      lentilsAndLegumesEn:
        'For Dal: Red/Yellow Lentils (Shorbat Ads), Chickpeas, and Fava Beans',
      oilsAndProbioticsBn:
        'টক দইয়ের বদলে: Fresh Laban / Unsweetened Rob (Yogurt) · Extra Virgin Olive Oil ও Pure Ghee',
      oilsAndProbioticsEn:
        'For Tok Doi: Fresh Unsweetened Laban or Rob (Arabic Plain Yogurt) · Extra Virgin Olive Oil & Pure Cow Ghee',
    },
    sampleNativeMeals: {
      breakfastBn: 'হোল হুইট খবুজ/রুটি, শাকশুকা (পোচড ডিম ও টমেটো-পালং) ও লাবান',
      breakfastEn: 'Whole Wheat Khubz, Poached Egg Shakshuka with Spinach & Fresh Laban',
      breakfastDescBn: '১টি পাতলা লাল খবুজ রুটি, জলপাই তেল ও টমেটো-পালং শাকে পোচ করা ২টি ডিম এবং শসা।',
      breakfastDescEn: '1 thin whole-wheat Khubz with 2 eggs poached in tomato-spinach herb sauce and fresh cucumber.',
      lunchBn: 'গ্রিলড হামুর/সি ব্রিম মাছ বা চিকেন, ব্রাউন বাসমতি/মাত্তা রাইস ও লেন্টিল স্যুপ',
      lunchEn: 'Grilled Sea Bream or Chicken Shish, Parboiled Red/Brown Rice, Lentil Soup & Fattoush',
      lunchDescBn: '১৩০ গ্রাম গ্রিলড মাছ বা চিকেন, ১ কাপ লাল/ব্রাউন চাল, আরবীয় মসুর ডাল স্যুপ ও সালাদ।',
      lunchDescEn: '130g grilled fish or chicken breast, 1 cup Matta/brown rice, warm lentil soup, and lemon-olive greens.',
      snackBn: 'তাজা লাবান (মাঠা/টক দই), কাঠবাদাম ও শসা',
      snackEn: 'Chilled Unsweetened Laban, Raw Almonds & Cucumber Sticks',
      snackDescBn: '১ গ্লাস লাবান ও ১ মুঠো কাঁচা কাঠবাদাম।',
      snackDescEn: '1 glass probiotic Laban with raw almonds and hydrating cucumber.',
      dinnerBn: 'স্টিমড কুসা (লাউ/জুচিনি), মলোখিয়া শাক ও গ্রিলড ফিশ/চিকেন স্টু',
      dinnerEn: 'Steamed Kousa Squash & Molokhia Greens with Light Grilled Fish or Chicken',
      dinnerDescBn: 'রাতে ভাতের বদলে কুসা স্কোয়াশ ও মলোখিয়া শাকের স্যুপ এবং গ্রিলড প্রোটিন।',
      dinnerDescEn: 'Light grain-free dinner with steamed Kousa squash, Molokhia greens, and grilled fish or chicken.',
    },
  },
  {
    code: 'EU',
    flag: '🇪🇺',
    countryNameBn: 'ইউরোপ — জার্মানি / ফ্রান্স / ইতালি (Europe / EU)',
    countryNameEn: 'Europe / EU (Germany, France, Italy, Netherlands)',
    cuisineNameBn: 'ইউরোপিয়ান ও মেডিটেরানিয়ান কুইজিন (European / Mediterranean)',
    cuisineNameEn: 'European & Mediterranean Clean Cuisine',
    mainstreamSupermarketsBn: 'Carrefour · Edeka · Rewe · Lidl · Aldi · Albert Heijn · Esselunga',
    mainstreamSupermarketsEn: 'Carrefour · Edeka · Rewe · Lidl · Aldi · Albert Heijn · Esselunga',
    ethnicStoresBn: 'Asian / Turkish / Indian Afro-Asian Supermarkets in major EU cities',
    ethnicStoresEn: 'Local Asian, Turkish (Türkischer Supermarkt), and Indian/Bangla Grocers',
    climateMetabolicNoteBn:
      'ইউরোপের ঋতুভিত্তিক আবহাওয়া: শীতকালে ভিটামিন ডি, ওমেগা-৩ ও উষ্ণ স্যুপ এবং গ্রীষ্মকালে অলিভ অয়েল, তাজা শাক ও প্রোবায়োটিক ফার্মেন্টেড খাবার মেটাবলিজম ভালো রাখে।',
    climateMetabolicNoteEn:
      'Continental European climate: Emphasize Vitamin D3 & warming root/gourd stews in winter, and polyphenol-rich olive oil, greens, and fermented dairy year-round.',
    stapleSubstitutes: {
      fishAndProteinBn:
        'দেশি মাছের বদলে: Dorade (Sea Bream - রুই/ভেটকির মতো), Loup de Mer (Sea Bass), Trout (Forelle), বা Cod (Kabeljau)',
      fishAndProteinEn:
        'For Deshi Fish: Dorade (Gilthead Bream), Sea Bass, Freshwater Trout (Forelle), Zander, or Cod',
      grainsAndCarbsBn:
        'লাল চালের বদলে: Camargue Red Rice / Italian Integrale Brown Rice, Dinkel (Spelt) Roti/Bread বা Haferflocken (Oats)',
      grainsAndCarbsEn:
        'For Red Rice: Camargue Red Rice, Riso Integrale (Wholegrain Rice), Whole Spelt (Dinkel), or Rolled Oats',
      greensAndVegBn:
        'দেশি শাকের বদলে: Spinat (Spinach), Mangold (Swiss Chard - লাল/পালং শাকের মতো), Grünkohl (Kale) বা Rucola',
      greensAndVegEn:
        'For Deshi Greens: Mangold (Swiss Chard), Fresh Spinach, Kale (Grünkohl), Dandelion Greens, or Rucola',
      gourdsAndSquashBn:
        'লাউ/পেঁপের বদলে: Zucchini (Courgette), Hokkaido Squash, Fenchel (Fennel) বা Kohlrabi (শালগম/পেঁপের মতো!)',
      gourdsAndSquashEn:
        'For Lau/Papaya: Kohlrabi (identical crisp texture and low GI to Green Papaya!), Zucchini, and Squash',
      lentilsAndLegumesBn:
        'ডালের বদলে: Rote Linsen (Red Lentils), Beluga Lentils, বা Kichererbsen (Chickpeas) (Turkish/EU supermarkets)',
      lentilsAndLegumesEn:
        'For Dal: Red Split Lentils (Rote Linsen), Puy/Beluga Lentils, or Chickpeas',
      oilsAndProbioticsBn:
        'টক দইয়ের বদলে: Naturjoghurt (3.5% Plain Yogurt) / Skyr / Kefir · Extra Virgin Olive Oil ও Butterschmalz (Ghee)',
      oilsAndProbioticsEn:
        'For Tok Doi: Plain Naturjoghurt, Skyr, or Kefir · For Ghee/Oil: Butterschmalz (Clarified Butter) & Extra Virgin Olive Oil',
    },
    sampleNativeMeals: {
      breakfastBn: 'হাফারফ্লোকেন (ওটস), বেরি, ওয়ালনাট ও পোচড ডিম',
      breakfastEn: 'Rolled Oats (Haferflocken) with Berries, Walnuts & Poached Eggs',
      breakfastDescBn: 'ওটস পরিজ, ২টি সিদ্ধ ডিম এবং ম্যানগোল্ড/পালং শাক।',
      breakfastDescEn: 'Warm oats with walnuts and berries alongside 2 poached eggs and sautéed Swiss chard.',
      lunchBn: 'গ্রিলড ডোরাডে/ট্রাউট মাছ, ক্যামার্গ রেড রাইস ও রেড লেন্টিল স্টু',
      lunchEn: 'Grilled Dorade or Trout with Camargue Red Rice, Red Lentil Stew & Greens',
      lunchDescBn: '১৩০ গ্রাম গ্রিলড ডোরাডে বা ট্রাউট মাছ, ১ কাপ লাল চাল ও জুচিনি-শাক।',
      lunchDescEn: '130g grilled dorade or trout fillet, 1 cup Camargue red rice, red lentil soup, and steamed greens.',
      snackBn: 'প্লেইন স্কির/ন্যাচারাল ইয়োগার্ট ও আমন্ড',
      snackEn: 'Plain Skyr or Naturjoghurt with Raw Almonds',
      snackDescBn: '১/২ কাপ আনসুইটেনড স্কির বা টক দই এবং কাঠবাদাম।',
      snackDescEn: '½ cup high-protein plain Skyr or yogurt with raw almonds.',
      dinnerBn: 'স্টিমড কোলরাবি (পেঁপের বিকল্প), জুচিনি ও বেকড ফিশ/চিকেন স্যুপ',
      dinnerEn: 'Steamed Kohlrabi & Zucchini Medley with Poached Fish or Chicken Broth',
      dinnerDescBn: 'রাতে ভাতের বদলে কোলরাবি ও জুচিনি সিদ্ধ এবং হালকা মাছ বা মুরগির স্টু।',
      dinnerDescEn: 'Low-carb evening meal featuring steamed kohlrabi, zucchini, and herb-poached fish or chicken.',
    },
  },
  {
    code: 'AU',
    flag: '🇦🇺',
    countryNameBn: 'অস্ট্রেলিয়া ও নিউজিল্যান্ড (Australia & NZ)',
    countryNameEn: 'Australia & New Zealand',
    cuisineNameBn: 'অস্ট্রেলিয়ান প্যাসিফিক ক্লিন কুইজিন (Australian Clean)',
    cuisineNameEn: 'Modern Australian & Pacific Clean Cuisine',
    mainstreamSupermarketsBn: 'Woolworths · Coles · Aldi Australia · Harris Farm Markets · IGA',
    mainstreamSupermarketsEn: 'Woolworths · Coles · Aldi · Harris Farm Markets · Countdown NZ',
    ethnicStoresBn: 'Lakemba / Rockdale (Sydney) ও Melbourne-এর বাংলাদেশী ও সাউথ এশিয়ান গ্রোসারি',
    ethnicStoresEn: 'Lakemba / Harris Park / Dandenong Bangladeshi & South Asian Grocers',
    climateMetabolicNoteBn:
      'দক্ষিণ গোলার্ধের আবহাওয়া (উত্তর গোলার্ধের বিপরীত ঋতু): প্রখর রোদে পর্যাপ্ত হাইড্রেশন ও অ্যান্টিঅক্সিডেন্ট সমৃদ্ধ শাক-সবজি এবং শীতকালে উষ্ণ প্রোটিন ব্রথ গ্রহণ করুন।',
    climateMetabolicNoteEn:
      'Southern Hemisphere seasonal rhythm: Prioritize electrolyte hydration during warm Australian summers and warming ginger-turmeric broths during southern winters.',
    stapleSubstitutes: {
      fishAndProteinBn:
        'দেশি মাছের বদলে: Australian Barramundi (ভেটকি/কাতলার হুবহু স্বাদ!), Snapper, Flathead বা Tasmanian Salmon (Woolworths/Coles)',
      fishAndProteinEn:
        'For Deshi Fish: Australian Barramundi (identical to Bengali Bhetki!), Red Snapper, Flathead, or Tasmanian Salmon',
      grainsAndCarbsBn:
        'লাল চালের বদলে: SunRice Low GI Brown/Doongara Clever Rice বা Red Rice ও Rolled Oats',
      grainsAndCarbsEn:
        'For Red Rice: SunRice Doongara Low-GI Rice (GI 54), Wholegrain Brown Rice, or Australian Rolled Oats',
      greensAndVegBn:
        'দেশি শাকের বদলে: Silverbeet (Swiss Chard), English Spinach, Bok Choy বা Kale (Woolworths/Coles)',
      greensAndVegEn:
        'For Deshi Greens: Silverbeet, English Baby Spinach, Asian Greens (Choy Sum/Bok Choy), or Kale',
      gourdsAndSquashBn:
        'লাউ/পেঁপের বদলে: Choko (Chayote - অস্ট্রেলিয়ায় খুবই জনপ্রিয় এবং লাউ/পেঁপের হুবহু বিকল্প!), Green Pawpaw বা Zucchini',
      gourdsAndSquashEn:
        'For Lau/Papaya: Australian Choko (Chayote) & Green Pawpaw (sold at Woolworths/Coles/Harris Farm) or Courgette',
      lentilsAndLegumesBn:
        'ডালের বদলে: Australian Red Split Lentils, Yellow Mung Dal ও Chickpeas',
      lentilsAndLegumesEn:
        'For Dal: Australian Red Split Lentils, Yellow Split Peas, Moong Dal, and Chickpeas',
      oilsAndProbioticsBn:
        'টক দইয়ের বদলে: Jalna Pot-Set Natural Greek/Biodynamic Yogurt · Organic Ghee ও Extra Virgin Olive Oil',
      oilsAndProbioticsEn:
        'For Tok Doi: Jalna Pot-Set Natural Yogurt (closest to traditional Bengali matir-patrer Tok Doi!) & Olive Oil',
    },
    sampleNativeMeals: {
      breakfastBn: 'রোল্ড ওটস, চিয়া সিড ও পোচড ফ্রি-রেঞ্জ ডিম ও সিলভারবিট',
      breakfastEn: 'Australian Rolled Oats, Chia Seeds & Poached Eggs with Silverbeet',
      breakfastDescBn: 'ওটস পরিজ, ২টি ফ্রি-রেঞ্জ ডিম এবং সিলভারবিট/পালং শাক।',
      breakfastDescEn: 'Rolled oats with chia seeds alongside 2 poached eggs and sautéed silverbeet.',
      lunchBn: 'গ্রিলড বারামুন্ডি (ভেটকি), লো-জিআই ডুঙ্গারা রাইস ও রেড লেন্টিল ডাল',
      lunchEn: 'Grilled Barramundi Fillet with Low-GI Doongara Rice, Red Lentil Dal & Greens',
      lunchDescBn: '১৩০ গ্রাম বারামুন্ডি মাছের ঝোল বা গ্রিল, ১ কাপ লো-জিআই রাইস ও ডাল।',
      lunchDescEn: '130g Australian Barramundi fillet, 1 cup low-GI Doongara or brown rice, red lentil soup, and greens.',
      snackBn: 'জালনা পট-সেট টক দই ও ম্যাকাডেমিয়া/কাঠবাদাম',
      snackEn: 'Jalna Pot-Set Natural Yogurt with Macadamias & Almonds',
      snackDescBn: '১/২ কাপ পট-সেট টক দই ও বাদাম।',
      snackDescEn: '½ cup pot-set probiotic yogurt with raw almonds and macadamia nuts.',
      dinnerBn: 'স্টিমড চোকো (লাউ/পেঁপের বিকল্প), জুচিনি ও স্ন্যাপার/চিকেন ব্রথ',
      dinnerEn: 'Steamed Choko & Zucchini Medley with Poached Snapper or Chicken Broth',
      dinnerDescBn: 'রাতে ভাতের বদলে চোকো ও জুচিনি সবজি এবং বারামুন্ডি বা মুরগির হালকা স্টু।',
      dinnerDescEn: 'Grain-free dinner featuring steamed Australian choko, zucchini, and poached barramundi or chicken.',
    },
  },
  {
    code: 'IN',
    flag: '🇮🇳',
    countryNameBn: 'ভারত (India)',
    countryNameEn: 'India',
    cuisineNameBn: 'ভারতীয় থেরাপিউটিক ও আয়ুর্বেদিক কুইজিন (Indian Therapeutic)',
    cuisineNameEn: 'Indian Therapeutic & Ayurvedic Cuisine',
    mainstreamSupermarketsBn: 'BigBasket · Reliance Smart · Nature’s Basket · Spencer’s · Local Mandi',
    mainstreamSupermarketsEn: 'BigBasket · Reliance Smart · Nature’s Basket · Spencer’s · Local Fresh Markets',
    ethnicStoresBn: 'সব রাজ্যেই তাজা লাউ, পেঁপে, শাক, ডাল ও মাছ/পনির সহজলভ্য',
    ethnicStoresEn: 'Fresh gourds, leafy greens, lentils, millets, and freshwater fish widely available nationwide',
    climateMetabolicNoteBn:
      'ঋতুচক্র (ষড়ঋতু) অনুযায়ী আয়ুর্বেদিক অগ্নি ও দোষের ভারসাম্য রক্ষায় জিরা-ধনে-মৌরি ভেজানো পানি এবং স্থানীয় মৌসুমি সবজি ও মিলেট উপযোগী।',
    climateMetabolicNoteEn:
      'Follow Ayurvedic Ritucharya seasonal adaptation with CCF (Cumin-Coriander-Fennel) digestive water and low-GI regional staples.',
    stapleSubstitutes: {
      fishAndProteinBn: 'রুই, কাতলা, ভেটকি, দেশি মুরগি, ডিম অথবা নিরামিষভোজীদের জন্য লো-ফ্যাট ছানা/পনির ও টোফু',
      fishAndProteinEn: 'Rohu, Katla, Bhetki, Country Chicken, Eggs, or Homemade Cow-Milk Paneer/Chhena & Sprouted Legumes',
      grainsAndCarbsBn: 'লাল চাল (Matta/Red Rice), জোয়ার/বাজরা/রাগি মিলেট রুটি, বা মাল্টিগ্রেইন আটা',
      grainsAndCarbsEn: 'Red Parboiled/Matta Rice, Jowar/Bajra/Ragi Millet Roti, or Single-Grain Khapli Wheat Atta',
      greensAndVegBn: 'পালং (Palak), মেথি শাক, সর্ষে শাক, চৌলাই (Amaranth) ও সজনে পাতা',
      greensAndVegEn: 'Palak (Spinach), Methi (Fenugreek), Sarson, Chaulai (Amaranth), and Moringa leaves',
      gourdsAndSquashBn: 'লাউ (Lauki/Dudhi), তোরাই (Ridge Gourd), পেঁপে, করলা ও চালকুমড়া (Petha)',
      gourdsAndSquashEn: 'Lauki (Bottle Gourd), Turai (Ridge Gourd), Raw Papaya, Karela, and Ash Gourd (Petha)',
      lentilsAndLegumesBn: 'মুগ ডাল, মসুর ডাল, অড়হর (Toor) ডাল, কুলথি (Horse Gram) ও ছোলা',
      lentilsAndLegumesEn: 'Yellow Moong Dal, Masoor Dal, Toor Dal, Kulthi (Horse Gram), and Kala Chana',
      oilsAndProbioticsBn: 'ঘরে পাতা টক দই / ছাঁচ (Buttermilk), এ২ দেশি ঘি ও কাচ্চি ঘানি সরিষা/নারকেল তেল',
      oilsAndProbioticsEn: 'Homemade Bilona A2 Ghee, Spiced Chaas (Buttermilk), Curd, and Kachi Ghani Mustard/Coconut Oil',
    },
    sampleNativeMeals: {
      breakfastBn: 'রাগি/জোয়ার বা লাল আটার রুটি, লাউ সবজি ও সিদ্ধ ডিম/ছানা',
      breakfastEn: 'Millet / Khapli Wheat Roti with Lauki Sabzi & Boiled Eggs or Homemade Chhena',
      breakfastDescBn: '২টি পাতলা মিলেট বা লাল আটার রুটি, লাউ-পেঁপে সবজি এবং ২টি ডিম বা ছানা।',
      breakfastDescEn: '2 thin Jowar/Red wheat rotis with lightly spiced bottle gourd sabzi and 2 boiled eggs or paneer.',
      lunchBn: 'লাল চাল বা ব্রাউন রাইস, মাছের ঝোল/চিকেন বা মুগ ডাল তড়কা, পালং শাক ও ছাঁচ',
      lunchEn: 'Red/Brown Rice, Fish Curry or Moong Dal Tadka, Palak Greens & Spiced Chaas',
      lunchDescBn: '১ কাপ লাল চাল, ১২০ গ্রাম মাছ বা চিকেন ঝোল, পালং শাক ও ১ গ্লাস জিরা-ছাঁচ।',
      lunchDescEn: '1 cup unpolished rice, 120g fish curry or high-protein dal, sautéed palak, and digestive buttermilk.',
      snackBn: 'ভাজা মাখনা (Foxnuts) বা ভাজা ছোলা ও আদা-তুলসী চা',
      snackEn: 'Roasted Makhana (Foxnuts) or Chana with Ginger-Tulsi Infusion',
      snackDescBn: '১ বাটি ঘিয়ে ভাজা মাখনা বা ছোলা এবং ভেষজ চা।',
      snackDescEn: '1 bowl ghee-roasted makhana with turmeric-pepper and herbal tea.',
      dinnerBn: 'লাউ-তোরাই-পেঁপে স্টু ও গ্রিলড মাছ/চিকেন বা মুগ ডাল স্যুপ',
      dinnerEn: 'Steamed Lauki-Turai Medley with Poached Fish/Chicken or Moong Soup',
      dinnerDescBn: 'রাতে শস্যবিহীন হালকা ডিনার: লাউ-ঝিঙে সবজি এবং মাছ/মুরগি বা মুগ ডালের স্যুপ।',
      dinnerDescEn: 'Cereal-free evening meal with bottle gourd & ridge gourd stew alongside fish, chicken, or moong soup.',
    },
  },
  {
    code: 'EA',
    flag: '🇯🇵',
    countryNameBn: 'পূর্ব ও দক্ষিণ-পূর্ব এশিয়া — জাপান / সিঙ্গাপুর / মালয়েশিয়া (East & SE Asia)',
    countryNameEn: 'East & Southeast Asia (Japan, Singapore, Malaysia, Korea)',
    cuisineNameBn: 'এশিয়ান ও জাপানিজ লংজিভিটি কুইজিন (Asian / Okinawa Clean)',
    cuisineNameEn: 'East & Southeast Asian Clean Longevity Cuisine',
    mainstreamSupermarketsBn: 'Aeon · FairPrice · Cold Storage · Jaya Grocer · Don Don Donki · Lotte Mart',
    mainstreamSupermarketsEn: 'Aeon · NTUC FairPrice · Cold Storage · Jaya Grocer · Don Don Donki · Lotte Mart',
    ethnicStoresBn: 'Mustafa Centre (Singapore) · Brickfields (KL) · Shin-Okubo (Tokyo) Halal/Bangla Stores',
    ethnicStoresEn: 'Mustafa Centre (SG) · Little India / Bangla Grocers in KL, Tokyo & Seoul',
    climateMetabolicNoteBn:
      'আর্দ্র ও সামুদ্রিক আবহাওয়া: অন্ত্রের মাইক্রোবায়োম ভালো রাখতে ফার্মেন্টেড ব্রথ, সামুদ্রিক মাছ এবং হালকা স্টিমড শাক-সবজি অত্যন্ত কার্যকর।',
    climateMetabolicNoteEn:
      'Humid maritime climate: Leverage steamed greens, clean marine fish, and light ginger-turmeric infusions for gut and metabolic balance.',
    stapleSubstitutes: {
      fishAndProteinBn:
        'দেশি মাছের বদলে: Red Snapper (Ikan Merah), Threadfin (Ikan Kurau), Sea Bass (Siakap), Mackerel (Saba) বা Tofu/Edamame',
      fishAndProteinEn:
        'For Deshi Fish: Ikan Siakap (Barramundi/Bhetki), Ikan Merah (Snapper), Threadfin, Saba Mackerel, or Organic Tofu',
      grainsAndCarbsBn:
        'লাল চালের বদলে: Cargo Red Rice, Germinated Brown Rice (GABA Rice), বা Soba Buckwheat Noodles',
      grainsAndCarbsEn:
        'For Red Rice: Unpolished Cargo Red Rice, Germinated GABA Brown Rice, or 100% Buckwheat Soba',
      greensAndVegBn:
        'দেশি শাকের বদলে: Kangkung (কলমি শাক - সর্বত্র পাওয়া যায়!), Bok Choy, Kailan, Choy Sum বা Spinach',
      greensAndVegEn:
        'For Deshi Greens: Kangkung (Water Spinach - identical to Bengali Kolmi Shak!), Bok Choy, Choy Sum, and Spinach',
      gourdsAndSquashBn:
        'লাউ/পেঁপের বদলে: Winter Melon (চালকুমড়া), Daikon Radish (মুলা/লাউয়ের বিকল্প), Bitter Gourd (Goya/করলা) ও Green Papaya',
      gourdsAndSquashEn:
        'For Lau/Chalkumra: Winter Melon (identical to Chalkumra), Daikon Radish, Goya (Bitter Melon), and Green Papaya',
      lentilsAndLegumesBn:
        'ডালের বদলে: Mung Beans, Edamame, Adzuki Beans ও Red Lentils (FairPrice/Mustafa/Aeon)',
      lentilsAndLegumesEn:
        'For Dal: Hulled Mung Beans, Edamame, Red Lentils, and Chickpeas',
      oilsAndProbioticsBn:
        'টক দইয়ের বদলে: Plain Unsweetened Yogurt · Cold-Pressed Sesame/Olive Oil ও Ghee',
      oilsAndProbioticsEn:
        'For Tok Doi: Plain Unsweetened Probiotic Yogurt · Cold-Pressed Sesame, Coconut, or Olive Oil & Ghee',
    },
    sampleNativeMeals: {
      breakfastBn: 'স্টিমড ডিম, বক চয় ও গাবা ব্রাউন রাইস পরিজ বা ওটস',
      breakfastEn: 'Savory Oats or GABA Brown Rice Congee with Steamed Eggs & Bok Choy',
      breakfastDescBn: 'আদা কুচি দেওয়া উষ্ণ পরিজ, ২টি স্টিমড/সিদ্ধ ডিম ও সবুজ শাক।',
      breakfastDescEn: 'Ginger-infused warm oats or brown rice porridge with 2 soft-boiled eggs and steamed bok choy.',
      lunchBn: 'স্টিমড সিকাপ (ভেটকি) বা স্ন্যাপার মাছ, রেড কার্গো রাইস ও কাংকুং (কলমি শাক)',
      lunchEn: 'Steamed Siakap (Sea Bass) with Ginger-Turmeric, Red Cargo Rice & Stir-Fried Kangkung',
      lunchDescBn: '১৩০ গ্রাম আদা-রসুন-হলুদে স্টিম করা মাছ, ১ কাপ লাল চাল ও কলমি শাক।',
      lunchDescEn: '130g ginger-steamed sea bass, 1 cup unpolished red rice, and garlic-tossed water spinach (Kangkung).',
      snackBn: 'এডামামে (স্টিমড সয়া বিন) বা কাঠবাদাম ও গ্রিন টি',
      snackEn: 'Steamed Edamame Pods or Raw Almonds with Sencha Green Tea',
      snackDescBn: '১ বাটি স্টিমড এডামামে বা বাদাম এবং গ্রিন টি।',
      snackDescEn: 'Steamed edamame or raw almonds paired with antioxidant-rich green tea.',
      dinnerBn: 'উইন্টার মেলন (চালকুমড়া) ও ডাইকন স্যুপ এবং গ্রিলড মাছ বা চিকেন',
      dinnerEn: 'Clear Winter Melon & Daikon Broth with Poached Fish, Tofu & Greens',
      dinnerDescBn: 'রাতে ভাতের বদলে চালকুমড়া-মাশরুম-শাকের ক্লিয়ার স্যুপ ও গ্রিলড মাছ বা মুরগি।',
      dinnerDescEn: 'Light grain-free dinner featuring winter melon and daikon broth with poached fish or chicken breast.',
    },
  },
  {
    code: 'MED',
    flag: '🇬🇷',
    countryNameBn: 'মেডিটেরানিয়ান অঞ্চল (Mediterranean Diet)',
    countryNameEn: 'Mediterranean Region & Diet',
    cuisineNameBn: 'ক্লিনিক্যাল মেডিটেরানিয়ান কুইজিন (Clinical Mediterranean)',
    cuisineNameEn: 'Clinical Mediterranean Anti-Inflammatory Cuisine',
    mainstreamSupermarketsBn: 'Carrefour · Mercadona · Coop · Conad · Local Mediterranean Markets',
    mainstreamSupermarketsEn: 'Carrefour · Mercadona · Coop · Conad · Local Fresh Markets',
    ethnicStoresBn: 'স্থানীয় তাজা সামুদ্রিক মাছ, অলিভ ও সবজির বাজার',
    ethnicStoresEn: 'Local coastal fishmongers, olive mills, and produce markets',
    climateMetabolicNoteBn:
      'মেডিটেরানিয়ান অ্যান্টি-ইনফ্ল্যামেটরি প্রটোকল: পলিফেনলসমৃদ্ধ এক্সট্রা ভার্জিন অলিভ অয়েল, ওমেগা-৩ সমৃদ্ধ মাছ ও প্রচুর শাক-সবজি কার্ডিও-মেটাবলিক স্বাস্থ্যের জন্য বিশ্বসেরা।',
    climateMetabolicNoteEn:
      'Gold-standard cardiometabolic protocol: Rich in Extra Virgin Olive Oil polyphenols, wild marine Omega-3s, legumes, and bitter leafy greens.',
    stapleSubstitutes: {
      fishAndProteinBn: 'Sea Bream (Orata), Sea Bass (Branzino), Sardines, Mackerel ও Free-Range Chicken/Eggs',
      fishAndProteinEn: 'Orata (Sea Bream), Branzino (Sea Bass), Wild Sardines, Mackerel, and Pasture-Raised Eggs',
      grainsAndCarbsBn: 'Farro, Bulgur, Wholegrain Barley, Quinoa ও Brown Rice',
      grainsAndCarbsEn: 'Wholegrain Farro, Bulgur Wheat, Barley, Quinoa, and Unpolished Rice',
      greensAndVegBn: 'Swiss Chard, Dandelion Greens, Spinach, Arugula (Rocket) ও Artichokes',
      greensAndVegEn: 'Swiss Chard, Dandelion Greens (Horta), Baby Spinach, Arugula, and Artichokes',
      gourdsAndSquashBn: 'Zucchini, Eggplant (বেগুন), Fennel ও Tomatoes/Bell Peppers',
      gourdsAndSquashEn: 'Zucchini, Mediterranean Eggplant, Fennel Bulb, and Roma Tomatoes',
      lentilsAndLegumesBn: 'Green/Brown Lentils, Chickpeas (Garbanzo), Cannellini ও Fava Beans',
      lentilsAndLegumesEn: 'Castelluccio Lentils, Chickpeas, White Cannellini Beans, and Fava Beans',
      oilsAndProbioticsBn: 'Cold-Pressed Extra Virgin Olive Oil ও Authentic Strained Greek Yogurt',
      oilsAndProbioticsEn: 'Cold-Pressed Extra Virgin Olive Oil & Authentic Sheep/Cow Strained Greek Yogurt',
    },
    sampleNativeMeals: {
      breakfastBn: 'অলিভ অয়েলে পোচড ডিম, স্যঁতে স্পিনাচ, টমেটো ও হোলগ্রেইন ফারো/ওটস',
      breakfastEn: 'Olive-Oil Poached Eggs with Wilted Spinach, Tomatoes & Wholegrain Toast/Oats',
      breakfastDescBn: '২টি ডিম, পালং শাক, অলিভ অয়েল ও ওটস বা হোলগ্রেইন রুটি।',
      breakfastDescEn: '2 eggs cooked in extra-virgin olive oil with wilted greens, cherry tomatoes, and whole grain.',
      lunchBn: 'হার্ব-গ্রিলড ব্রানজিনো/সার্ডিন মাছ, লেন্টিল-কুইনোয়া সালাদ ও রোস্টেড জুচিনি',
      lunchEn: 'Herb-Grilled Branzino or Salmon with Warm Lentil-Quinoa Pilaf & Roasted Zucchini',
      lunchDescBn: '১৩০ গ্রাম লেবু-অরিগানো গ্রিলড মাছ, ১ কাপ লেন্টিল-রাইস ও গ্রিন সালাদ।',
      lunchDescEn: '130g lemon-oregano grilled fish over warm lentil-brown rice pilaf and roasted Mediterranean vegetables.',
      snackBn: 'গ্রিক ইয়োগার্ট, আখরোট ও তাজা বেরি/জলপাই',
      snackEn: 'Strained Greek Yogurt with Walnuts & Olives/Berries',
      snackDescBn: '১/২ কাপ গ্রিক দই ও ১ মুঠো আখরোট।',
      snackDescEn: '½ cup plain Greek yogurt with raw walnuts and cinnamon.',
      dinnerBn: 'স্টিমড হরতা (শাক), জুচিনি-ফেনেল স্টু ও পোচড ফিশ বা চিকেন স্যুপ',
      dinnerEn: 'Lemon-Olive Steamed Greens & Zucchini Stew with Poached Fish or Chicken',
      dinnerDescBn: 'রাতে শস্যবিহীন মেডিটেরানিয়ান ডিনার: জুচিনি, শাক ও গ্রিলড প্রোটিন।',
      dinnerDescEn: 'Light grain-free dinner of steamed dandelion/chard greens, zucchini, and lemon-poached fish or chicken.',
    },
  },
  {
    code: 'LATAM',
    flag: '🇲🇽',
    countryNameBn: 'ল্যাটিন আমেরিকা — মেক্সিকো / ব্রাজিল (Latin America)',
    countryNameEn: 'Latin America (Mexico, Brazil, Argentina, Colombia)',
    cuisineNameBn: 'ল্যাটিন আমেরিকান ক্লিন কুইজিন (Latin American Clean)',
    cuisineNameEn: 'Clean Latin American Metabolic Cuisine',
    mainstreamSupermarketsBn: 'Walmart · Soriana · Chedraui · Carrefour · Pão de Açúcar',
    mainstreamSupermarketsEn: 'Walmart · Soriana · Chedraui · Carrefour · Pão de Açúcar',
    ethnicStoresBn: 'Mercados Locales (তাজা পেঁপে, চাওটে/লাউ, মাছ ও শাক সর্বত্র পাওয়া যায়)',
    ethnicStoresEn: 'Local Mercados & Supermarkets (rich in fresh Chayote, Papaya, Nopales, and Snapper)',
    climateMetabolicNoteBn:
      'উষ্ণ ও নাতিশীতোষ্ণ আবহাওয়া: তাজা লেবু-পানি, শসা, চাওটে এবং উচ্চ ফাইবারযুক্ত বিনস ও মাছ রক্তে শর্করার ভারসাম্য রক্ষা করে।',
    climateMetabolicNoteEn:
      'Rich biodiversity of low-GI gourds (Chayote), cactus paddles (Nopales), and clean marine proteins ideal for glycemic control.',
    stapleSubstitutes: {
      fishAndProteinBn: 'Huachinango (Red Snapper), Róbalo (Sea Bass), Tilapia ও Pollo Orgánico (Chicken)',
      fishAndProteinEn: 'Huachinango (Red Snapper), Róbalo (Snook/Sea Bass), Tilapia, and Free-Range Chicken',
      grainsAndCarbsBn: 'Arroz Integral (Brown Rice), Quinoa ও Pure Nixtamal Corn Tortillas (Controlled)',
      grainsAndCarbsEn: 'Arroz Integral (Brown Rice), Andean Quinoa, and 100% Nixtamalized Corn Tortillas',
      greensAndVegBn: 'Espinaca (Spinach), Acelga (Swiss Chard), Nopales (Cactus - ডায়াবেটিসের জন্য দারুণ) ও Quelites',
      greensAndVegEn: 'Espinaca (Spinach), Acelga (Chard), Nopales (Prickly Pear Cactus - clinically lowers glucose), and Kale',
      gourdsAndSquashBn: 'Chayote (একদম লাউ/পেঁপের মতো!), Calabacita (Zucchini) ও Papaya Verde (Green Papaya)',
      gourdsAndSquashEn: 'Chayote (native staple identical to Lau/Papaya), Calabacita (Squash), and Green Papaya',
      lentilsAndLegumesBn: 'Lentejas (Lentils), Frijoles Negros (Black Beans) ও Garbanzos',
      lentilsAndLegumesEn: 'Lentejas (Lentils), Black Beans, Pinto Beans, and Chickpeas',
      oilsAndProbioticsBn: 'Yogurt Natural Sin Azúcar, Extra Virgin Avocado Oil ও Olive Oil',
      oilsAndProbioticsEn: 'Unsweetened Natural Yogurt, Cold-Pressed Avocado Oil, and Extra Virgin Olive Oil',
    },
    sampleNativeMeals: {
      breakfastBn: 'নোপালস ও পালং শাক দিয়ে স্ক্র্যাম্বলড ডিম, অ্যাভোকাডো ও ওটস/কুইনোয়া',
      breakfastEn: 'Huevos con Nopales & Spinach, Fresh Avocado & Warm Quinoa/Oats',
      breakfastDescBn: '২টি ডিম, ক্যাকটাস/পালং শাক, ১/৪ অ্যাভোকাডো ও ওটস।',
      breakfastDescEn: '2 eggs scrambled with glycemic-lowering nopales and spinach, ¼ avocado, and warm oats.',
      lunchBn: 'গ্রিলড রেড স্ন্যাপার (হুয়াচিনাঙ্গো), ব্রাউন রাইস, লেন্টিল স্যুপ ও ক্যালাবাসিতা',
      lunchEn: 'Grilled Red Snapper (Pescado a la Plancha) with Brown Rice, Lentil Soup & Calabacitas',
      lunchDescBn: '১৩০ গ্রাম গ্রিলড মাছ, ১ কাপ ব্রাউন রাইস, ডাল ও চাওটে-জুচিনি সবজি।',
      lunchDescEn: '130g grilled red snapper with lime-cilantro, 1 cup brown rice, lentil soup, and steamed calabacitas.',
      snackBn: 'প্লেইন ইয়োগার্ট, পেপিতাস (মিষ্টি কুমড়ার বিচি) ও পেয়ারা',
      snackEn: 'Plain Yogurt with Toasted Pepitas (Pumpkin Seeds) & Fresh Guava',
      snackDescBn: '১/২ কাপ টক দই, কুমড়ার বিচি ও পেয়ারা।',
      snackDescEn: '½ cup plain yogurt with toasted pumpkin seeds and low-GI guava.',
      dinnerBn: 'স্টিমড চাওটে-জুচিনি স্টু ও পোচড চিকেন বা ফিশ কালদো (ক্লিয়ার স্যুপ)',
      dinnerEn: 'Caldo de Pescado or Pollo (Clear Broth) with Steamed Chayote, Squash & Greens',
      dinnerDescBn: 'রাতে ভাতের বদলে চাওটে ও জুচিনি দেওয়া ক্লিয়ার চিকেন/ফিশ স্যুপ।',
      dinnerDescEn: 'Light grain-free evening soup with poached fish or chicken, steamed chayote, zucchini, and greens.',
    },
  },
];

const CROSS_BORDER_STORAGE_KEY = 'precision_cross_border_prefs_v1';

export interface StoredCrossBorderPrefs {
  residenceCountry: string;
  preferredCuisineCountry: string;
  supermarketSubstituteMode: CrossBorderSubstitutionMode;
  customResidenceName?: string;
  customCuisineName?: string;
}

export function loadStoredCrossBorderPrefs(): StoredCrossBorderPrefs {
  try {
    const raw = localStorage.getItem(CROSS_BORDER_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        residenceCountry: parsed.residenceCountry || 'BD',
        preferredCuisineCountry: parsed.preferredCuisineCountry || 'BD',
        supermarketSubstituteMode: parsed.supermarketSubstituteMode || 'show_equivalents',
        customResidenceName: parsed.customResidenceName || '',
        customCuisineName: parsed.customCuisineName || '',
      };
    }
  } catch {
    // ignore storage errors
  }
  return {
    residenceCountry: 'BD',
    preferredCuisineCountry: 'BD',
    supermarketSubstituteMode: 'show_equivalents',
  };
}

export function saveStoredCrossBorderPrefs(prefs: StoredCrossBorderPrefs): void {
  try {
    localStorage.setItem(CROSS_BORDER_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore storage errors
  }
}

export function getCountryCuisineProfile(codeOrName: string): GlobalCountryCuisineProfile {
  const normalized = (codeOrName || 'BD').trim();
  const found = GLOBAL_COUNTRIES_AND_CUISINES.find(
    (c) =>
      c.code.toLowerCase() === normalized.toLowerCase() ||
      c.countryNameEn.toLowerCase().includes(normalized.toLowerCase()) ||
      c.countryNameBn.includes(normalized)
  );
  if (found) return found;

  // Dynamic fallback for any custom country or cuisine entered by the user!
  return {
    code: normalized.toUpperCase().slice(0, 6) || 'GLOBAL',
    flag: '🌍',
    countryNameBn: `${normalized}`,
    countryNameEn: `${normalized}`,
    cuisineNameBn: `${normalized} ফুড কুইজিন`,
    cuisineNameEn: `${normalized} Cuisine`,
    mainstreamSupermarketsBn: `${normalized}-এর প্রধান সুপারমার্কেট ও ফ্রেশ মার্কেট`,
    mainstreamSupermarketsEn: `Major Local Supermarkets & Fresh Markets in ${normalized}`,
    ethnicStoresBn: `${normalized}-এর ইন্টারন্যাশনাল / এশিয়ান / এথনিক গ্রোসারি স্টোর`,
    ethnicStoresEn: `International, Asian & Ethnic Grocery Stores in ${normalized}`,
    climateMetabolicNoteBn: `${normalized}-এর স্থানীয় আবহাওয়া ও ঋতু অনুযায়ী পর্যাপ্ত পানি, ইলেক্ট্রোলাইট ও মৌসুমি তাজা সবজি গ্রহণ করুন।`,
    climateMetabolicNoteEn: `Adapt daily hydration, Vitamin D, and electrolytes to ${normalized}'s local climate and seasonal conditions.`,
    stapleSubstitutes: {
      fishAndProteinBn: 'স্থানীয় তাজা সাদা মাছ (Sea Bass, Cod, Tilapia, Snapper), স্যামন বা ফ্রি-রেঞ্জ মুরগি ও ডিম',
      fishAndProteinEn: 'Local fresh white fish (Sea Bass, Cod, Tilapia, Snapper), Salmon, or free-range poultry & eggs',
      grainsAndCarbsBn: 'আনপলিশড ব্রাউন/রেড রাইস, হোল হুইট ফ্লাওয়ার/রুটি ও রোল্ড ওটস',
      grainsAndCarbsEn: 'Unpolished Brown/Red Rice, Whole Wheat Flour/Flatbread, and Rolled Oats',
      greensAndVegBn: 'বেবি স্পিনাচ (পালং), কেল, সুইস চার্ড ও স্থানীয় সবুজ শাক',
      greensAndVegEn: 'Baby Spinach, Kale, Swiss Chard, and local dark leafy greens',
      gourdsAndSquashBn: 'জুচিনি (Zucchini), চাওটে স্কোয়াশ (Chayote), কাঁচা পেঁপে ও মিষ্টি কুমড়া',
      gourdsAndSquashEn: 'Zucchini, Chayote Squash, Green Papaya, and Marrow/Gourds',
      lentilsAndLegumesBn: 'রেড লেন্টিলস (মসুর ডাল), মুগ ডাল ও চিকপিস (ছোলা)',
      lentilsAndLegumesEn: 'Red Split Lentils, Yellow Mung Beans, and Chickpeas',
      oilsAndProbioticsBn: 'প্লেইন আনসুইটেনড ইয়োগার্ট (টক দই), ঘি ও এক্সট্রা ভার্জিন অলিভ অয়েল',
      oilsAndProbioticsEn: 'Plain Unsweetened Probiotic Yogurt, Pure Ghee, and Extra Virgin Olive Oil',
    },
    sampleNativeMeals: GLOBAL_COUNTRIES_AND_CUISINES[1].sampleNativeMeals,
  };
}

export function getEffectiveResidenceAndCuisine(profile?: HealthProfile | null) {
  const stored = loadStoredCrossBorderPrefs();
  const residenceCountry = profile?.residenceCountry || stored.residenceCountry || 'BD';
  const preferredCuisineCountry =
    profile?.preferredCuisineCountry || stored.preferredCuisineCountry || 'BD';
  const supermarketSubstituteMode: CrossBorderSubstitutionMode =
    profile?.supermarketSubstituteMode || stored.supermarketSubstituteMode || 'show_equivalents';

  const residenceProfile = getCountryCuisineProfile(residenceCountry);
  const cuisineProfile = getCountryCuisineProfile(preferredCuisineCountry);
  const isCrossBorder =
    residenceProfile.code.toLowerCase() !== cuisineProfile.code.toLowerCase();

  return {
    residenceCountry,
    preferredCuisineCountry,
    supermarketSubstituteMode,
    residenceProfile,
    cuisineProfile,
    isCrossBorder,
  };
}

/**
 * Resolves a specific food item, ingredient, or meal description from the user's
 * Preferred Cuisine Country into its exact Nutritionally Equivalent Local Supermarket
 * Substitute in the user's Current Residence Country.
 */
export function resolveFoodOrMealSupermarketSwap(
  textOrFoodName: string,
  residenceCodeOrName: string,
  cuisineCodeOrName: string,
  mode: CrossBorderSubstitutionMode,
  lang: Language
): CrossBorderSupermarketSwap {
  const isBn = lang === 'bn';
  const resProf = getCountryCuisineProfile(residenceCodeOrName);
  const cuiProf = getCountryCuisineProfile(cuisineCodeOrName);
  const lower = (textOrFoodName || '').toLowerCase();

  const matchesFish =
    /fish|মাছ|শিং|মাগুর|রুই|কাতলা|পাবদা|ইলিশ|ভেটকি|তেলাপিয়া|কই|shing|magur|rui|rohu|katla|hilsa|bhetki|tilapia|cod|salmon|snapper|barramundi/.test(
      lower
    );
  const matchesChickenOrEgg =
    /chicken|মুরগি|ডিম|egg|poultry|turkey|হাঁস/.test(lower);
  const matchesRiceOrGrain =
    /rice|ভাত|চাল|রুটি|আটা|ওটস|চিড়া|মুড়ি|roti|atta|oats|bread|quinoa|millet|khichuri|খিচুড়ি/.test(
      lower
    );
  const matchesGourd =
    /লাউ|পেঁপে|পটল|চালকুমড়া|ঝিঙে|চিচিঙ্গা|করলা|কাকরোল|gourd|lau|papaya|potol|zucchini|squash|chayote|marrow|karela/.test(
      lower
    );
  const matchesGreens =
    /শাক|পালং|লাল শাক|কলমি|কচু|সজনে|পুঁই|পাট|spinach|shak|amaranth|kale|chard|moringa|broccoli|কপি|বাঁধাকপি|ফুলকপি/.test(
      lower
    );
  const matchesDalOrLegume =
    /ডাল|মসুর|মুগ|ছোলা|বরবটি|শিম|dal|lentil|moong|masoor|chickpea|bean|এডামামে/.test(
      lower
    );
  const matchesDairyOrOil =
    /দই|টক দই|ঘি|তেল|সরিষা|ছানা|পনির|yogurt|curd|doi|ghee|oil|paneer|laban/.test(
      lower
    );

  const parts: string[] = [];
  if (matchesFish) {
    parts.push(
      isBn
        ? resProf.stapleSubstitutes.fishAndProteinBn
        : resProf.stapleSubstitutes.fishAndProteinEn
    );
  } else if (matchesChickenOrEgg) {
    parts.push(
      isBn
        ? 'অর্গানিক ফ্রি-রেঞ্জ / পাস্তুর-রেইজড চিকেন ব্রেস্ট বা থাই এবং ওমেগা-৩ সমৃদ্ধ ডিম'
        : 'Organic Pasture-Raised / Free-Range Chicken & Omega-3 Enriched Eggs'
    );
  }

  if (matchesRiceOrGrain) {
    parts.push(
      isBn
        ? resProf.stapleSubstitutes.grainsAndCarbsBn
        : resProf.stapleSubstitutes.grainsAndCarbsEn
    );
  }

  if (matchesGourd) {
    parts.push(
      isBn
        ? resProf.stapleSubstitutes.gourdsAndSquashBn
        : resProf.stapleSubstitutes.gourdsAndSquashEn
    );
  }

  if (matchesGreens) {
    parts.push(
      isBn
        ? resProf.stapleSubstitutes.greensAndVegBn
        : resProf.stapleSubstitutes.greensAndVegEn
    );
  }

  if (matchesDalOrLegume && parts.length < 2) {
    parts.push(
      isBn
        ? resProf.stapleSubstitutes.lentilsAndLegumesBn
        : resProf.stapleSubstitutes.lentilsAndLegumesEn
    );
  }

  if (matchesDairyOrOil && parts.length < 2) {
    parts.push(
      isBn
        ? resProf.stapleSubstitutes.oilsAndProbioticsBn
        : resProf.stapleSubstitutes.oilsAndProbioticsEn
    );
  }

  if (parts.length === 0) {
    parts.push(
      isBn
        ? `${resProf.stapleSubstitutes.fishAndProteinBn} · ${resProf.stapleSubstitutes.gourdsAndSquashBn}`
        : `${resProf.stapleSubstitutes.fishAndProteinEn} · ${resProf.stapleSubstitutes.gourdsAndSquashEn}`
    );
  }

  const equivalentItems =
    mode === 'ethnic_frozen_only'
      ? isBn
        ? `এথনিক/ফ্রোজেন স্টোর অপশন (${resProf.ethnicStoresBn}): আইকিউএফ (IQF) ফ্রোজেন দেশি মাছ, তাজা লাউ/করলা ও ঢেঁকিছাঁটা চাল`
        : `Ethnic/Frozen Store Option (${resProf.ethnicStoresEn}): IQF frozen native fish, fresh imported gourds & unpolished rice`
      : parts.slice(0, 2).join(' | ');

  const supermarketChains = isBn
    ? resProf.mainstreamSupermarketsBn
    : resProf.mainstreamSupermarketsEn;

  const ethnicStoreGuide = isBn
    ? resProf.ethnicStoresBn
    : resProf.ethnicStoresEn;

  const macroAndGiParityNote = isBn
    ? `১:১ পুষ্টি সমতা (Macro & GI Matched): প্রোটিন, গ্লাইসেমিক ইনডেক্স (GI < 55) ও ওমেগা-৩/মাইক্রোনিউট্রিয়েন্ট মান মূল খাবারের সমতুল্য।`
    : `1:1 Nutritional Parity (Macro & GI Matched): Identical protein density, low glycemic load (GI < 55), and micronutrient profile.`;

  return {
    residenceCountryCode: resProf.code,
    residenceCountryLabel: isBn ? resProf.countryNameBn : resProf.countryNameEn,
    preferredCuisineCode: cuiProf.code,
    preferredCuisineLabel: isBn ? cuiProf.cuisineNameBn : cuiProf.cuisineNameEn,
    equivalentItems,
    supermarketChains,
    ethnicStoreGuide,
    macroAndGiParityNote,
    availabilityType:
      mode === 'ethnic_frozen_only'
        ? 'ethnic_frozen'
        : mode === 'hybrid'
        ? 'hybrid_swap'
        : 'mainstream_fresh',
  };
}

/**
 * Adapts a Meal for the user's Preferred Cuisine Country AND attaches the
 * Cross-Border Local Supermarket Swap when Residence Country !== Preferred Cuisine Country.
 */
export function adaptMealForPreferredCuisine(
  meal: Meal,
  mealIndex: number,
  residenceCode: string,
  cuisineCode: string,
  mode: CrossBorderSubstitutionMode,
  lang: Language
): Meal {
  const isBn = lang === 'bn';
  const resProf = getCountryCuisineProfile(residenceCode);
  const cuiProf = getCountryCuisineProfile(cuisineCode);
  const isCrossBorder = resProf.code.toLowerCase() !== cuiProf.code.toLowerCase();

  let updatedMealName = meal.mealName;
  let updatedDescription = meal.description;

  const slotHint = `${meal.mealSlot || ''} ${meal.time || ''} ${meal.mealName || ''}`.toLowerCase();
  const isBreakfast = mealIndex === 0 || /breakfast|সকাল|morning/.test(slotHint);
  const isLunch = mealIndex === 1 || /lunch|দুপুর|mid/.test(slotHint);
  const isDinner =
    /dinner|রাত|night/.test(slotHint) ||
    (mealIndex >= 2 && !/snack|বিকেল|afternoon|সন্ধ্যা/.test(slotHint));
  const isSnack = !isBreakfast && !isLunch && !isDinner;

  // 1. If the user selected a non-BD cuisine (e.g., American, Mediterranean, Middle Eastern, etc.),
  // OR if mode === 'hybrid' and it's Breakfast/Snack (where user wants quick local Residence meals + Heritage Dinner):
  const activeMenuProfile =
    mode === 'hybrid' && (isBreakfast || isSnack) && isCrossBorder
      ? resProf
      : cuiProf;

  if (activeMenuProfile.code !== 'BD') {
    if (isBreakfast) {
      updatedMealName = isBn
        ? activeMenuProfile.sampleNativeMeals.breakfastBn
        : activeMenuProfile.sampleNativeMeals.breakfastEn;
      updatedDescription = isBn
        ? activeMenuProfile.sampleNativeMeals.breakfastDescBn
        : activeMenuProfile.sampleNativeMeals.breakfastDescEn;
    } else if (isLunch) {
      updatedMealName = isBn
        ? activeMenuProfile.sampleNativeMeals.lunchBn
        : activeMenuProfile.sampleNativeMeals.lunchEn;
      updatedDescription = isBn
        ? activeMenuProfile.sampleNativeMeals.lunchDescBn
        : activeMenuProfile.sampleNativeMeals.lunchDescEn;
    } else if (isSnack) {
      updatedMealName = isBn
        ? activeMenuProfile.sampleNativeMeals.snackBn
        : activeMenuProfile.sampleNativeMeals.snackEn;
      updatedDescription = isBn
        ? activeMenuProfile.sampleNativeMeals.snackDescBn
        : activeMenuProfile.sampleNativeMeals.snackDescEn;
    } else if (isDinner) {
      updatedMealName = isBn
        ? activeMenuProfile.sampleNativeMeals.dinnerBn
        : activeMenuProfile.sampleNativeMeals.dinnerEn;
      updatedDescription = isBn
        ? activeMenuProfile.sampleNativeMeals.dinnerDescBn
        : activeMenuProfile.sampleNativeMeals.dinnerDescEn;
    }
  }

  // 2. Attach Local Supermarket Swap whenever Residence Country !== Preferred Cuisine Country
  // (or even if same country when user wants supermarket guidance)
  const combinedText = `${updatedMealName} ${updatedDescription}`;
  const swap = resolveFoodOrMealSupermarketSwap(
    combinedText,
    residenceCode,
    cuisineCode,
    mode,
    lang
  );

  return {
    ...meal,
    mealName: updatedMealName,
    description: updatedDescription,
    localSupermarketSwap: isCrossBorder ? swap : undefined,
  };
}

/**
 * Enriches an entire DietPhaseChart with Cross-Border Climate Adaptation,
 * Preferred Cuisine Meals, and Local Supermarket Equivalent Substitutes.
 */
export function enrichChartWithCrossBorderEquivalents(
  chart: DietPhaseChart,
  profile: HealthProfile,
  lang: Language
): DietPhaseChart {
  const isBn = lang === 'bn';
  const {
    residenceCountry,
    preferredCuisineCountry,
    supermarketSubstituteMode,
    residenceProfile,
    cuisineProfile,
    isCrossBorder,
  } = getEffectiveResidenceAndCuisine(profile);

  const updatedWeeklySchedule = (chart.weeklySchedule || []).map((dayPlan) => ({
    ...dayPlan,
    meals: (dayPlan.meals || []).map((meal, mIdx) =>
      adaptMealForPreferredCuisine(
        meal,
        mIdx,
        residenceCountry,
        preferredCuisineCountry,
        supermarketSubstituteMode,
        lang
      )
    ),
  }));

  const updatedFoodExchangeTable: FoodExchangeRow[] | undefined = chart.foodExchangeTable
    ? chart.foodExchangeTable.map((row) => {
        const swap = resolveFoodOrMealSupermarketSwap(
          `${row.category} ${row.primaryFood} ${(row.greenSubstitutes || []).join(' ')}`,
          residenceCountry,
          preferredCuisineCountry,
          supermarketSubstituteMode,
          lang
        );
        return {
          ...row,
          localSupermarketSwap: isCrossBorder ? swap : undefined,
        };
      })
    : undefined;

  const climateNote = isBn
    ? residenceProfile.climateMetabolicNoteBn
    : residenceProfile.climateMetabolicNoteEn;

  const updatedWeatherAdaptation = chart.weatherAdaptation
    ? {
        ...chart.weatherAdaptation,
        nudge: isCrossBorder
          ? `${chart.weatherAdaptation.nudge} • [${
              isBn ? residenceProfile.countryNameBn : residenceProfile.countryNameEn
            }]: ${climateNote}`
          : chart.weatherAdaptation.nudge,
      }
    : {
        shieldMode: isBn
          ? `${residenceProfile.countryNameBn} ক্লাইমেট শিল্ড`
          : `${residenceProfile.countryNameEn} Climate Shield`,
        condition: isBn ? 'আবহাওয়া ও সুপারমার্কেট সমন্বয়' : 'Climate & Supermarket Sync',
        nudge: climateNote,
        adjustments: [
          isBn
            ? `খাদ্য সংস্কৃতি: ${cuisineProfile.cuisineNameBn}`
            : `Dietary Cuisine: ${cuisineProfile.cuisineNameEn}`,
          isBn
            ? `স্থানীয় সুপারমার্কেট: ${residenceProfile.mainstreamSupermarketsBn}`
            : `Local Supermarkets: ${residenceProfile.mainstreamSupermarketsEn}`,
        ],
      };

  const crossBorderChart: DietPhaseChart = {
    ...chart,
    weeklySchedule: updatedWeeklySchedule,
    foodExchangeTable: updatedFoodExchangeTable,
    weatherAdaptation: updatedWeatherAdaptation,
    crossBorderContext: {
      residenceCountryCode: residenceProfile.code,
      residenceCountryLabel: isBn
        ? residenceProfile.countryNameBn
        : residenceProfile.countryNameEn,
      preferredCuisineCode: cuisineProfile.code,
      preferredCuisineLabel: isBn
        ? cuisineProfile.cuisineNameBn
        : cuisineProfile.cuisineNameEn,
      supermarketChains: isBn
        ? residenceProfile.mainstreamSupermarketsBn
        : residenceProfile.mainstreamSupermarketsEn,
      climateMetabolicNote: climateNote,
      isCrossBorder,
      mode: supermarketSubstituteMode,
    },
  };

  return prioritizeDietChartWithLocalHarvest(crossBorderChart, residenceCountry, lang);
}

export type EquivalenceCategoryKey =
  | 'fish_protein'
  | 'grains_carbs'
  | 'leafy_greens'
  | 'gourds_squash'
  | 'lentils_legumes'
  | 'probiotics_oils';

export interface NutritionalFoodSideSpec {
  nameBn: string;
  nameEn: string;
  portionLabelBn: string;
  portionLabelEn: string;
  caloriesKcal: number;
  proteinGrams: number;
  carbsGrams: number;
  fiberGrams: number;
  fatsGrams: number;
  glycemicIndex: number;
  keyMicronutrientsBn: string;
  keyMicronutrientsEn: string;
  sourceStoreOrOriginBn: string;
  sourceStoreOrOriginEn: string;
}

export interface NutritionalEquivalencePair {
  id: string;
  category: EquivalenceCategoryKey;
  categoryLabelBn: string;
  categoryLabelEn: string;
  parityScorePercent: number;
  traditionalFood: NutritionalFoodSideSpec;
  localSupermarketSubstitute: NutritionalFoodSideSpec;
  ethnicStoreAlternativeBn: string;
  ethnicStoreAlternativeEn: string;
  clinicalParitySummaryBn: string;
  clinicalParitySummaryEn: string;
  culinaryAdaptationTipBn: string;
  culinaryAdaptationTipEn: string;
}

/**
 * Generates side-by-side nutritional equivalence comparisons between the user's
 * Traditional Cultural Foods (`preferredCuisineCode`) and Local Supermarket Substitutes
 * based on their current geo-location (`residenceCountryCode`).
 */
export function getNutritionalEquivalenceComparisons(
  residenceCountryCode: string = 'US',
  preferredCuisineCode: string = 'BD'
): NutritionalEquivalencePair[] {
  const resProf = getCountryCuisineProfile(residenceCountryCode);
  const cuiProf = getCountryCuisineProfile(preferredCuisineCode);
  const resCode = resProf.code;

  // Dynamic Country-Specific Supermarket Substitute Names
  const fishSubByCountry: Record<string, { bn: string; en: string }> = {
    US: {
      bn: 'Wild-Caught US Catfish / Tilapia বা Coho Salmon ফিশ ফিলে',
      en: 'Wild-Caught US Catfish, Tilapia, or Coho Salmon Fillet',
    },
    GB: {
      bn: 'Fresh Sea Bass (ভেটকি সমতুল্য), Rainbow Trout বা Scottish Salmon',
      en: 'Fresh Sea Bass, Rainbow Trout, or Scottish Mackerel/Salmon',
    },
    CA: {
      bn: 'Freshwater Pickerel (Walleye), Rainbow Trout বা Pacific Halibut',
      en: 'Freshwater Pickerel (Walleye), Rainbow Trout, or Pacific Cod',
    },
    AE: {
      bn: 'তাজা Hamour, Sultan Ibrahim বা Sea Bream (Sheri)',
      en: 'Fresh Arabian Hamour, Sea Bream (Sheri), or Sultan Ibrahim',
    },
    EU: {
      bn: 'তাজা Dorade (Sea Bream), Loup de Mer (Sea Bass) বা Trout',
      en: 'Fresh Dorade (Sea Bream), Sea Bass, or River Trout',
    },
    AU: {
      bn: 'তাজা Barramundi (হুবহু দেশি ভেটকি!), Snapper বা Ocean Trout',
      en: 'Wild Australian Barramundi (identical to Bhetki!), Snapper, or Trout',
    },
    BD: {
      bn: 'তাজা নদীর রুই, কাতলা, শিং বা মাগুর মাছ',
      en: 'Fresh River Rui, Katla, Shing, or Magur Fish',
    },
  };

  const grainSubByCountry: Record<string, { bn: string; en: string }> = {
    US: {
      bn: 'Lundberg California Red/Brown Basmati Rice বা Steel-Cut Oats',
      en: 'Lundberg California Red/Brown Basmati Rice or Steel-Cut Oats',
    },
    GB: {
      bn: 'Tilda Wholegrain Brown Basmati বা Red Camargue Rice',
      en: 'Tilda Wholegrain Brown Basmati or Red Camargue Rice',
    },
    CA: {
      bn: 'Canadian Wild & Brown Basmati Rice Blend বা Steel-Cut Oats',
      en: 'Canadian Wild & Brown Basmati Rice Blend or Steel-Cut Oats',
    },
    AE: {
      bn: 'Palakkadan Matta Parboiled Red Rice (Lulu/Carrefour) বা Brown Basmati',
      en: 'Palakkadan Matta Parboiled Red Rice or Wholegrain Brown Basmati',
    },
    EU: {
      bn: 'Riz de Camargue (Red Rice), Wholegrain Basmati বা Spelt (Dinkel)',
      en: 'Red Camargue Rice, Wholegrain Basmati, or Whole Spelt (Dinkel)',
    },
    AU: {
      bn: 'SunRice Low-GI Brown Doongara Rice বা Red Rice',
      en: 'SunRice Low-GI Doongara Brown Rice or Australian Red Rice',
    },
    BD: {
      bn: 'ঢেঁকিছাঁটা লাল চালের ভাত বা লাল আটার রুটি',
      en: 'Unpolished Dheki-Chata Red Rice or Whole Wheat Roti',
    },
  };

  const greenSubByCountry: Record<string, { bn: string; en: string }> = {
    US: {
      bn: 'Organic Baby Spinach, Red Swiss Chard ও Lacinato Kale',
      en: 'Organic Baby Spinach, Red Swiss Chard & Lacinato Kale',
    },
    GB: {
      bn: 'British Cavolo Nero (Black Kale), Baby Spinach ও Spring Greens',
      en: 'British Cavolo Nero, Baby Spinach & Spring Greens',
    },
    CA: {
      bn: 'Ontario/BC Baby Spinach, Rainbow Swiss Chard ও Bok Choy',
      en: 'Local Baby Spinach, Rainbow Swiss Chard & Baby Bok Choy',
    },
    AE: {
      bn: 'তাজা Molokhia (পাট শাকের সমতুল্য!), Rocca (Arugula) ও Spinach',
      en: 'Fresh Molokhia (Jute Mallow), Rocca Greens & Fresh Spinach',
    },
    EU: {
      bn: 'Mangold (Swiss Chard), Spinat (Baby Spinach) ও Grünkohl',
      en: 'Mangold (Swiss Chard), Fresh Spinach & Curly Kale',
    },
    AU: {
      bn: 'Australian Silverbeet, Baby Spinach ও Asian Choy Sum',
      en: 'Australian Silverbeet, Baby Spinach & Choy Sum',
    },
    BD: {
      bn: 'তাজা লাল শাক, পালং শাক, কলমি শাক ও পাট শাক',
      en: 'Fresh Red Amaranth (Lal Shak), Spinach & Water Spinach',
    },
  };

  const gourdSubByCountry: Record<string, { bn: string; en: string }> = {
    US: {
      bn: 'Chayote Squash (Mirliton — হুবহু লাউ/পেঁপের মতো!) ও Green Zucchini',
      en: 'Chayote Squash (Mirliton — 1:1 match for Lau/Papaya!) & Green Zucchini',
    },
    GB: {
      bn: 'Fresh Courgette (Zucchini), Marrow ও Swede/Celeriac',
      en: 'British Courgette (Zucchini), Vegetable Marrow & Celeriac',
    },
    CA: {
      bn: 'Chayote Squash, Green Zucchini ও Fuzzy Melon (Opo Squash)',
      en: 'Chayote Squash, Green Zucchini & Fuzzy Melon (Opo Squash)',
    },
    AE: {
      bn: 'Kousa Squash (আরবীয় লাউ/পটল সমতুল্য) ও তাজা লাউ/পেঁপে',
      en: 'Middle Eastern Kousa Squash & Fresh Bottle Gourd (Lau)',
    },
    EU: {
      bn: 'Courgette (Zucchini), Kohlrabi (ওলকপি) ও Fennel',
      en: 'Fresh Courgette (Zucchini), Kohlrabi & Fennel Bulb',
    },
    AU: {
      bn: 'Choko (Australian Chayote — হুবহু লাউ/পেঁপে!) ও Green Zucchini',
      en: 'Australian Choko (Chayote Squash) & Fresh Green Zucchini',
    },
    BD: {
      bn: 'তাজা দেশি লাউ, কাঁচা পেঁপে, পটল ও চালকুমড়া',
      en: 'Fresh Bottle Gourd (Lau), Green Papaya, Pointed Gourd & Ash Gourd',
    },
  };

  const fishSub = fishSubByCountry[resCode] || fishSubByCountry.US;
  const grainSub = grainSubByCountry[resCode] || grainSubByCountry.US;
  const greenSub = greenSubByCountry[resCode] || greenSubByCountry.US;
  const gourdSub = gourdSubByCountry[resCode] || gourdSubByCountry.US;

  return [
    {
      id: 'eq-fish-protein',
      category: 'fish_protein',
      categoryLabelBn: '🐟 মাছ ও লিন প্রোটিন (Fish & Protein)',
      categoryLabelEn: '🐟 Fish & Lean Protein',
      parityScorePercent: 98,
      traditionalFood: {
        nameBn: 'দেশি রুই / কাতলা / ভেটকি বা শিং মাছ (Rui / Katla / Bhetki)',
        nameEn: 'Traditional River Fish (Rui, Katla, Bhetki, Shing)',
        portionLabelBn: '১০০ গ্রাম (রান্না করা ১ টুকরো)',
        portionLabelEn: '100g cooked fillet',
        caloriesKcal: 128,
        proteinGrams: 22.4,
        carbsGrams: 0,
        fiberGrams: 0,
        fatsGrams: 3.8,
        glycemicIndex: 0,
        keyMicronutrientsBn: 'ওমেগা-৩ (EPA/DHA), সেলেনিয়াম, ভিটামিন B12 ও ফসফরাস',
        keyMicronutrientsEn: 'Omega-3 (EPA/DHA), Selenium, Vitamin B12 & Phosphorus',
        sourceStoreOrOriginBn: `${cuiProf.flag} ${cuiProf.countryNameBn} ঐতিহ্যবাহী উৎস`,
        sourceStoreOrOriginEn: `${cuiProf.flag} ${cuiProf.countryNameEn} Heritage Staple`,
      },
      localSupermarketSubstitute: {
        nameBn: fishSub.bn,
        nameEn: fishSub.en,
        portionLabelBn: '১০০ গ্রাম (স্কিনলেস ফিলে)',
        portionLabelEn: '100g skinless fillet',
        caloriesKcal: 124,
        proteinGrams: 22.8,
        carbsGrams: 0,
        fiberGrams: 0,
        fatsGrams: 3.5,
        glycemicIndex: 0,
        keyMicronutrientsBn: 'উচ্চ বায়ো-অ্যাভেইলেবল অ্যামিনো অ্যাসিড, ওমেগা-৩, ভিটামিন D ও B12',
        keyMicronutrientsEn: 'High Bioavailable Amino Acids, Marine Omega-3, Vitamin D & B12',
        sourceStoreOrOriginBn: `🛒 ${resProf.flag} ${resProf.mainstreamSupermarketsBn}`,
        sourceStoreOrOriginEn: `🛒 ${resProf.flag} ${resProf.mainstreamSupermarketsEn}`,
      },
      ethnicStoreAlternativeBn: `এথনিক স্টোরে: ${resProf.ethnicStoresBn}`,
      ethnicStoreAlternativeEn: `Ethnic Store Option: ${resProf.ethnicStoresEn}`,
      clinicalParitySummaryBn:
        'প্রোটিন ঘনত্ব (২২.৪g বনাম ২২.৮g) এবং গ্লাইসেমিক ইনডেক্স (GI 0) সম্পূর্ণ অভিন্ন। ইনসুলিন সেনসিটিভিটি ও পেশি গঠনে ১:১ সমতুল্য কাজ করে।',
      clinicalParitySummaryEn:
        'Protein density (22.4g vs 22.8g) and Glycemic Index (GI 0) are virtually identical, delivering 1:1 amino acid and metabolic parity.',
      culinaryAdaptationTipBn:
        'হলুদ, জিরা, আদা ও সামান্য সরিষা বা অলিভ অয়েল দিয়ে দেশি ঝোল বা ভুনা স্টাইলে রান্না করলে দেশি মাছের মতোই স্বাদ ও টেক্সচার পাওয়া যায়।',
      culinaryAdaptationTipEn:
        'Simmer with turmeric, cumin, ginger, and light mustard or olive oil for an authentic Bengali/South Asian fish jhol texture.',
    },
    {
      id: 'eq-grains-carbs',
      category: 'grains_carbs',
      categoryLabelBn: '🌾 ঢেঁকিছাঁটা লাল চাল ও শর্করা (Unpolished Grains)',
      categoryLabelEn: '🌾 Unpolished Grains & Complex Carbs',
      parityScorePercent: 97,
      traditionalFood: {
        nameBn: 'ঢেঁকিছাঁটা লাল চালের ভাত / লাল আটার রুটি',
        nameEn: 'Dheki-Chata Unpolished Red Parboiled Rice / Whole Roti',
        portionLabelBn: '১০০ গ্রাম (রান্না করা ১ কাপ)',
        portionLabelEn: '100g cooked (1 standard cup)',
        caloriesKcal: 112,
        proteinGrams: 2.7,
        carbsGrams: 23.0,
        fiberGrams: 2.4,
        fatsGrams: 0.9,
        glycemicIndex: 52,
        keyMicronutrientsBn: 'ম্যাগনেসিয়াম, ভিটামিন B1 (থায়ামিন), অ্যান্থোসায়ানিন ও গামা-অরিজানল',
        keyMicronutrientsEn: 'Magnesium, Vitamin B1 (Thiamine), Anthocyanins & Gamma-Oryzanol',
        sourceStoreOrOriginBn: `${cuiProf.flag} ${cuiProf.countryNameBn} ঐতিহ্যবাহী উৎস`,
        sourceStoreOrOriginEn: `${cuiProf.flag} ${cuiProf.countryNameEn} Heritage Staple`,
      },
      localSupermarketSubstitute: {
        nameBn: grainSub.bn,
        nameEn: grainSub.en,
        portionLabelBn: '১০০ গ্রাম (রান্না করা ১ কাপ)',
        portionLabelEn: '100g cooked (1 standard cup)',
        caloriesKcal: 114,
        proteinGrams: 2.8,
        carbsGrams: 22.8,
        fiberGrams: 2.6,
        fatsGrams: 1.0,
        glycemicIndex: 50,
        keyMicronutrientsBn: 'ম্যাগনেসিয়াম, সলিউবল ব্র্যান ফাইবার, বি-কমপ্লেক্স ও সেলেনিয়াম',
        keyMicronutrientsEn: 'Magnesium, Soluble Bran Fiber, B-Complex & Selenium',
        sourceStoreOrOriginBn: `🛒 ${resProf.flag} ${resProf.mainstreamSupermarketsBn}`,
        sourceStoreOrOriginEn: `🛒 ${resProf.flag} ${resProf.mainstreamSupermarketsEn}`,
      },
      ethnicStoreAlternativeBn:
        'এথনিক স্টোরে: বাংলাদেশী/কেরালা Matta Red Rice বা রাঁধুনি/প্রাণ ঢেঁকিছাঁটা লাল চাল পাওয়া যায়।',
      ethnicStoreAlternativeEn:
        'Ethnic Store Option: Authentic Bangladeshi Red Parboiled Rice or Kerala Matta Rice.',
      clinicalParitySummaryBn:
        'গ্লাইসেমিক ইনডেক্স (GI 52 বনাম GI 50) ও নেট কার্বোহাইড্রেট প্রায় হুবহু এক। খাবারের পর রক্তে গ্লুকোজ স্পাইক ধীর রাখে।',
      clinicalParitySummaryEn:
        'Glycemic Index (GI 52 vs GI 50) and bran fiber content match closely, preventing postprandial insulin spikes.',
      culinaryAdaptationTipBn:
        'রান্নার আগে ৩০ মিনিট ভিজিয়ে রেখে মাড় ঝরিয়ে রান্না করলে গ্লাইসেমিক লোড আরও ১৫% কমে এবং ভাত ঝরঝরে ও নরম হয়।',
      culinaryAdaptationTipEn:
        'Soak for 30 minutes before boiling and drain excess starch water to reduce glycemic load by an additional 15%.',
    },
    {
      id: 'eq-leafy-greens',
      category: 'leafy_greens',
      categoryLabelBn: '🥬 শাক ও পাতা জাতীয় সবজি (Leafy Greens)',
      categoryLabelEn: '🥬 Leafy Greens & Cruciferous',
      parityScorePercent: 99,
      traditionalFood: {
        nameBn: 'দেশি লাল শাক, পালং শাক, কলমি শাক ও পাট শাক',
        nameEn: 'Red Amaranth (Lal Shak), Deshi Spinach, Kolmi & Jute Leaves',
        portionLabelBn: '১০০ গ্রাম',
        portionLabelEn: '100g raw/steamed',
        caloriesKcal: 26,
        proteinGrams: 2.9,
        carbsGrams: 3.8,
        fiberGrams: 2.5,
        fatsGrams: 0.4,
        glycemicIndex: 15,
        keyMicronutrientsBn: 'নন-হিম আয়রন, ফোলেট (B9), ভিটামিন K1, লুটেইন ও পটাশিয়াম',
        keyMicronutrientsEn: 'Non-Heme Iron, Folate (B9), Vitamin K1, Lutein & Potassium',
        sourceStoreOrOriginBn: `${cuiProf.flag} ${cuiProf.countryNameBn} ঐতিহ্যবাহী উৎস`,
        sourceStoreOrOriginEn: `${cuiProf.flag} ${cuiProf.countryNameEn} Heritage Staple`,
      },
      localSupermarketSubstitute: {
        nameBn: greenSub.bn,
        nameEn: greenSub.en,
        portionLabelBn: '১০০ গ্রাম',
        portionLabelEn: '100g raw/steamed',
        caloriesKcal: 25,
        proteinGrams: 2.8,
        carbsGrams: 3.6,
        fiberGrams: 2.6,
        fatsGrams: 0.4,
        glycemicIndex: 15,
        keyMicronutrientsBn: 'ফোলেট (B9), আয়রন, ম্যাগনেসিয়াম, নাইট্রেট ও অ্যান্টিঅক্সিডেন্ট বিটালেইন',
        keyMicronutrientsEn: 'Folate (B9), Iron, Magnesium, Dietary Nitrates & Betalains',
        sourceStoreOrOriginBn: `🛒 ${resProf.flag} ${resProf.mainstreamSupermarketsBn}`,
        sourceStoreOrOriginEn: `🛒 ${resProf.flag} ${resProf.mainstreamSupermarketsEn}`,
      },
      ethnicStoreAlternativeBn:
        'এথনিক স্টোরে: ফ্রোজেন বা তাজা লাল শাক, পুঁই শাক ও পাট শাক পাওয়া যায়।',
      ethnicStoreAlternativeEn:
        'Ethnic Store Option: Fresh or frozen Lal Shak, Pui Shak, and Kolmi Shak.',
      clinicalParitySummaryBn:
        'Red Swiss Chard-এ লাল শাকের মতোই অ্যান্থোসায়ানিন ও বিটালেইন পিগমেন্ট থাকে এবং GI মাত্র ১৫—ডায়াবেটিস ও রক্তস্বল্পতায় ৯৯% সমতুল্য।',
      clinicalParitySummaryEn:
        'Red Swiss Chard and Baby Spinach share the exact betalain/folate profile and GI 15 of Red Amaranth (Lal Shak).',
      culinaryAdaptationTipBn:
        'রসুন ও শুকনো মরিচ ফোড়ন দিয়ে সামান্য অলিভ/সরিষার তেলে ৩-৪ মিনিট ভাজলে হুবহু দেশি শাক ভাজির স্বাদ পাওয়া যায়।',
      culinaryAdaptationTipEn:
        'Quickly sauté for 3–4 minutes with tempered garlic and whole chili for an authentic Bengali shak bhaji.',
    },
    {
      id: 'eq-gourds-squash',
      category: 'gourds_squash',
      categoryLabelBn: '🥒 লাউ, পেঁপে ও মৌসুমি সবজি (Gourds & Local Harvest)',
      categoryLabelEn: '🥒 Low-GI Gourds & Seasonal Harvest',
      parityScorePercent: 98,
      traditionalFood: {
        nameBn: 'দেশি লাউ, কাঁচা পেঁপে, পটল ও চালকুমড়া',
        nameEn: 'Bottle Gourd (Lau), Green Papaya, Potol & Ash Gourd',
        portionLabelBn: '১০০ গ্রাম',
        portionLabelEn: '100g cubed',
        caloriesKcal: 17,
        proteinGrams: 0.8,
        carbsGrams: 3.7,
        fiberGrams: 1.8,
        fatsGrams: 0.1,
        glycemicIndex: 20,
        keyMicronutrientsBn: '৯৪% জলীয় অংশ, প্যাপেইন এনজাইম, পটাশিয়াম ও ভিটামিন C',
        keyMicronutrientsEn: '94% Hydration Water, Digestive Enzymes, Potassium & Vitamin C',
        sourceStoreOrOriginBn: `${cuiProf.flag} ${cuiProf.countryNameBn} ঐতিহ্যবাহী উৎস`,
        sourceStoreOrOriginEn: `${cuiProf.flag} ${cuiProf.countryNameEn} Heritage Staple`,
      },
      localSupermarketSubstitute: {
        nameBn: gourdSub.bn,
        nameEn: gourdSub.en,
        portionLabelBn: '১০০ গ্রাম',
        portionLabelEn: '100g cubed',
        caloriesKcal: 19,
        proteinGrams: 0.9,
        carbsGrams: 4.1,
        fiberGrams: 1.9,
        fatsGrams: 0.1,
        glycemicIndex: 20,
        keyMicronutrientsBn: 'উচ্চ পটাশিয়াম, প্রিবায়োটিক ফাইবার, ফোলেট ও ভিটামিন C',
        keyMicronutrientsEn: 'High Potassium, Prebiotic Soluble Fiber, Folate & Vitamin C',
        sourceStoreOrOriginBn: `🛒 ${resProf.flag} ${resProf.mainstreamSupermarketsBn}`,
        sourceStoreOrOriginEn: `🛒 ${resProf.flag} ${resProf.mainstreamSupermarketsEn}`,
      },
      ethnicStoreAlternativeBn:
        'এথনিক স্টোরে: তাজা লাউ (Opo Squash), করলা (Bitter Melon) ও পটল পাওয়া যায়।',
      ethnicStoreAlternativeEn:
        'Ethnic Store Option: Fresh Opo Squash (Bottle Gourd), Bitter Melon, and Frozen Potol.',
      clinicalParitySummaryBn:
        'Chayote Squash এবং Zucchini গ্লাইসেমিক ইনডেক্স (GI 20), ক্যালোরি (১৭–১৯ kcal) ও লিভার কুলিং অ্যালকালাইন প্রোপার্টিতে লাউ ও পেঁপের ১:১ সমতুল্য।',
      clinicalParitySummaryEn:
        'Chayote Squash and Zucchini match Bottle Gourd and Green Papaya 1:1 in GI (20), hydration, and gut-soothing fiber.',
      culinaryAdaptationTipBn:
        'Chayote খোসা ছাড়িয়ে লাউ বা পেঁপের মতো ডাল, চিংড়ি বা মাছের ঝোলে দিলে স্বাদ ও নরম টেক্সচার একদম দেশি লাউয়ের মতো হয়!',
      culinaryAdaptationTipEn:
        'Peel and cube Chayote squash into dal or fish curry—its mild flavor and tender texture are indistinguishable from Lau or Green Papaya.',
    },
    {
      id: 'eq-lentils-legumes',
      category: 'lentils_legumes',
      categoryLabelBn: '🥣 ডাল ও উদ্ভিজ্জ প্রোটিন (Lentils & Dal)',
      categoryLabelEn: '🥣 Lentils, Dal & Plant Protein',
      parityScorePercent: 99,
      traditionalFood: {
        nameBn: 'দেশি মুগ ডাল, মসুর ডাল ও ছোলার ডাল',
        nameEn: 'Deshi Moong Dal, Red Masoor Dal & Chana Dal',
        portionLabelBn: '১০০ গ্রাম (রান্না করা ঘন ডাল)',
        portionLabelEn: '100g cooked dal',
        caloriesKcal: 116,
        proteinGrams: 9.0,
        carbsGrams: 20.1,
        fiberGrams: 7.9,
        fatsGrams: 0.4,
        glycemicIndex: 29,
        keyMicronutrientsBn: 'রেজিস্ট্যান্ট স্টার্চ, ফোলেট, আয়রন, জিঙ্ক ও পলিফেনল',
        keyMicronutrientsEn: 'Resistant Starch, Folate, Iron, Zinc & Polyphenols',
        sourceStoreOrOriginBn: `${cuiProf.flag} ${cuiProf.countryNameBn} ঐতিহ্যবাহী উৎস`,
        sourceStoreOrOriginEn: `${cuiProf.flag} ${cuiProf.countryNameEn} Heritage Staple`,
      },
      localSupermarketSubstitute: {
        nameBn: 'Red Split Lentils, Yellow Split Mung Beans ও Organic Chickpeas',
        nameEn: 'Red Split Lentils, Yellow Split Mung Beans & Chickpeas',
        portionLabelBn: '১০০ গ্রাম (রান্না করা)',
        portionLabelEn: '100g cooked',
        caloriesKcal: 115,
        proteinGrams: 9.1,
        carbsGrams: 19.8,
        fiberGrams: 7.8,
        fatsGrams: 0.4,
        glycemicIndex: 29,
        keyMicronutrientsBn: 'রেজিস্ট্যান্ট স্টার্চ, সলিউবল ফাইবার, ফোলেট ও ম্যাঙ্গানিজ',
        keyMicronutrientsEn: 'Resistant Starch, Soluble Prebiotic Fiber, Folate & Manganese',
        sourceStoreOrOriginBn: `🛒 ${resProf.flag} ${resProf.mainstreamSupermarketsBn}`,
        sourceStoreOrOriginEn: `🛒 ${resProf.flag} ${resProf.mainstreamSupermarketsEn}`,
      },
      ethnicStoreAlternativeBn:
        'যেকোনো মেইনস্ট্রিম সুপারমার্কেটেই Red Split Lentils (মসুর ডাল) সরাসরি পাওয়া যায়।',
      ethnicStoreAlternativeEn:
        'Red Split Lentils in mainstream supermarkets are identical to Masoor Dal.',
      clinicalParitySummaryBn:
        'উদ্ভিজ্জ প্রোটিন (৯g), ফাইবার (৭.৯g) এবং লো গ্লাইসেমিক ইনডেক্স (GI 29) ৯৯% অভিন্ন—গাট মাইক্রোবায়োমের শর্ট-চেইন ফ্যাটি অ্যাসিড বাড়ায়।',
      clinicalParitySummaryEn:
        '99% botanical and macronutrient identity (9g protein, 7.9g fiber, GI 29), supporting butyrate-producing gut flora.',
      culinaryAdaptationTipBn:
        'রান্নার আগে ২০ মিনিট ভিজিয়ে রেখে হলুদ, রসুন ও ধনেপাতা দিয়ে রান্না করলে গ্যাস/ব্লোটিং হয় না এবং হজম সহজ হয়।',
      culinaryAdaptationTipEn:
        'Soak for 20 minutes before cooking with turmeric, ginger, and cilantro to eliminate lectins and prevent bloating.',
    },
    {
      id: 'eq-probiotics-oils',
      category: 'probiotics_oils',
      categoryLabelBn: '🥛 টক দই, ঘি ও হেলদি ফ্যাট (Probiotics & Oils)',
      categoryLabelEn: '🥛 Probiotic Yogurt, Ghee & Healthy Oils',
      parityScorePercent: 97,
      traditionalFood: {
        nameBn: 'দেশি ঘরে পাতা টক দই ও খাঁটি গাওয়া ঘি / সরিষার তেল',
        nameEn: 'Traditional Sour Curd (Tok Doi), Cow Ghee & Cold-Pressed Mustard Oil',
        portionLabelBn: '১০০ গ্রাম টক দই',
        portionLabelEn: '100g unsweetened curd',
        caloriesKcal: 68,
        proteinGrams: 5.2,
        carbsGrams: 4.5,
        fiberGrams: 0,
        fatsGrams: 3.2,
        glycemicIndex: 24,
        keyMicronutrientsBn: 'ল্যাকটোব্যাসিলাস প্রোবায়োটিক, ক্যালসিয়াম, বিউটিরিক অ্যাসিড ও MUFA',
        keyMicronutrientsEn: 'Lactobacillus Probiotics, Calcium, Butyric Acid & MUFA',
        sourceStoreOrOriginBn: `${cuiProf.flag} ${cuiProf.countryNameBn} ঐতিহ্যবাহী উৎস`,
        sourceStoreOrOriginEn: `${cuiProf.flag} ${cuiProf.countryNameEn} Heritage Staple`,
      },
      localSupermarketSubstitute: {
        nameBn:
          'Plain Unsweetened Greek / Balkan Yogurt (বা Laban) ও Grass-Fed Ghee / Extra Virgin Olive Oil',
        nameEn:
          'Plain Unsweetened Greek / Balkan Yogurt (or Laban) & Grass-Fed Ghee / Extra Virgin Olive Oil',
        portionLabelBn: '১০০ গ্রাম আনসুইটেনড দই',
        portionLabelEn: '100g plain yogurt',
        caloriesKcal: 72,
        proteinGrams: 8.8,
        carbsGrams: 3.6,
        fiberGrams: 0,
        fatsGrams: 2.5,
        glycemicIndex: 20,
        keyMicronutrientsBn: 'লাইভ অ্যাক্টিভ কালচার (L. bulgaricus, S. thermophilus), উচ্চ প্রোটিন ও CLA',
        keyMicronutrientsEn: 'Live Active Probiotic Cultures, High Casein/Whey Protein & CLA',
        sourceStoreOrOriginBn: `🛒 ${resProf.flag} ${resProf.mainstreamSupermarketsBn}`,
        sourceStoreOrOriginEn: `🛒 ${resProf.flag} ${resProf.mainstreamSupermarketsEn}`,
      },
      ethnicStoreAlternativeBn:
        'এথনিক স্টোরে: দেশি স্বাদের Gopi/Deshi Plain Dahi ও খাঁটি সরিষার তেল পাওয়া যায়।',
      ethnicStoreAlternativeEn:
        'Ethnic Store Option: South Asian Plain Dahi and Cold-Pressed Kachi Ghani Mustard Oil.',
      clinicalParitySummaryBn:
        'Plain Greek/Balkan Yogurt-এ শর্করা আরও কম (৩.৬g) ও প্রোটিন বেশি (৮.৮g) এবং জীবন্ত প্রোবায়োটিক কালচার গাট রিস্টোরেশনে দেশি টক দইয়ের চেয়েও শক্তিশালী ভূমিকা রাখে।',
      clinicalParitySummaryEn:
        'Plain Greek/Balkan yogurt provides even higher protein (8.8g vs 5.2g) and lower lactose while matching Tok Doi probiotic benefits.',
      culinaryAdaptationTipBn:
        'Greek Yogurt ঘন মনে হলে সামান্য পানি ও ভাজা জিরা গুঁড়ো মিশিয়ে নিলে একদম দেশি টক দই বা ঘোল/বোরহানির টেক্সচার চলে আসে।',
      culinaryAdaptationTipEn:
        'Whisk 2 tbsp water and roasted cumin into plain Greek yogurt to recreate the exact pourable consistency of traditional Tok Doi.',
    },
  ];
}

