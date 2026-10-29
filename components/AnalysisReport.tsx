import React, { useState, useEffect, useMemo } from 'react';
import { HealthProfile, Language, TrafficLightGuide, TrafficLightFoodItem, FoodCategory, User } from '../types';
import { DietSubTab } from './DietView';
import { translations } from '../i18n';
import { GeminiService } from '../services/geminiService';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import PregnancyMilestonesDashboard from './PregnancyMilestonesDashboard';
import ChildDevelopmentMilestones from './ChildDevelopmentMilestones';
import {
  BD_FCT_NUTRIENTS,
  BD_FCT_RAW_FOODS,
  BD_FCT_SOURCE_LINE_BN,
  BD_FCT_SOURCE_LINE_EN,
  BdFctFoodRecord,
  fmtNutrient,
  getDefaultSelectedFoodIds,
  getExternalFunctionalProfile,
} from '../data/bdFoodCompositionDatabase';

interface Props {
  profile: HealthProfile;
  lang: Language;
  darkMode?: boolean;
  initialStep?: 'report' | 'traffic_light';
  user?: User | null;
  onShowPaywall?: () => void;
  onProceed: (customizedProfile?: HealthProfile, targetSubTab?: DietSubTab) => void;
}

const CATEGORIES: FoodCategory[] = [
  'Grains & Carbs',
  'Proteins',
  'Vegetables & Greens',
  'Fruits & Snacks',
  'Healthy Fats & Seeds',
];

const CATEGORY_SHORT_BN: Record<FoodCategory, string> = {
  'Grains & Carbs': '🌾 সিরিয়ালস ও শর্করা (ভাত/রুটি/ওটস)',
  'Proteins': '🐟 প্রোটিন সোর্স (অ্যানিমেল ও প্ল্যান্ট)',
  'Vegetables & Greens': '🥬 শাকসবজি (লাউ/পেঁপে/শাক)',
  'Fruits & Snacks': '🍎 ফলমূল ও পানীয়',
  'Healthy Fats & Seeds': '🥥 ফ্যাট, ঘি, তেল ও বাদাম',
};

const CATEGORY_SHORT_EN: Record<FoodCategory, string> = {
  'Grains & Carbs': '🌾 Cereals & Carbs (Rice/Roti/Oats)',
  'Proteins': '🐟 Protein Sources (Animal & Plant)',
  'Vegetables & Greens': '🥬 Vegetables & Leafy Greens',
  'Fruits & Snacks': '🍎 Fruits & Beverages',
  'Healthy Fats & Seeds': '🥥 Healthy Fats, Oil & Seeds',
};

const CATEGORY_LABELS_BN: Record<FoodCategory, string> = {
  'Grains & Carbs': 'সিরিয়ালস ও শর্করা (ভাত, চাল, রুটি, ওটস ও কন্দজাত)',
  'Proteins': 'প্রোটিন সোর্স (অ্যানিমেল প্রোটিন ও প্ল্যান্ট প্রোটিন)',
  'Vegetables & Greens': 'শাকসবজি ও রাতের সবজি শর্করা (লাউ, পেঁপে, শাক ও সবজি)',
  'Fruits & Snacks': 'দেশি ফলমূল ও স্বাস্থ্যকর পানীয়',
  'Healthy Fats & Seeds': 'স্বাস্থ্যকর ফ্যাট, ঘি, রান্নার তেল, বাদাম ও মসলা',
};

interface StructuredSubCategory {
  id: string;
  labelBn: string;
  labelEn: string;
  descBn: string;
  descEn: string;
  icon: string;
  proteinBranch?: 'animal' | 'plant';
  matcher: (item: TrafficLightFoodItem) => boolean;
}

const itemHay = (item: TrafficLightFoodItem): string =>
  `${item.nameBn} ${item.nameEn} ${item.bdSubCategoryBn || ''} ${item.scientific || ''} ${item.id}`.toLowerCase();

const STRUCTURED_SUBCATEGORIES: Record<FoodCategory, StructuredSubCategory[]> = {
  'Grains & Carbs': [
    {
      id: 'rice_group',
      labelBn: 'ভাত ও চাল জাতীয় (Rice)',
      labelEn: 'Rice & Parboiled/Brown Rice',
      descBn: 'লাল চালের ভাত, ঢেঁকি ছাঁটা চাল, সিদ্ধ চাল, আতপ চাল, মুড়ি, চিড়া ও কাউন',
      descEn: 'Red/Brown rice, parboiled rice, puffed/flattened rice & foxtail millet',
      icon: '🍚',
      matcher: (item) =>
        item.category === 'Grains & Carbs' &&
        /rice|bhat|chal|ভাত|চাল|ঢেঁকি|কাউন|মুড়ি|চিড়া|খই|পোলাও|জাউ|makhana|মাখনা/.test(itemHay(item)),
    },
    {
      id: 'wheat_roti_group',
      labelBn: 'রুটি, আটা ও গম জাতীয় (Wheat & Roti)',
      labelEn: 'Wheat, Roti & Flour',
      descBn: 'লাল আটার রুটি, গম, আটা, সুজি, সেমাই ও পাউরুটি',
      descEn: 'Whole wheat red atta roti, wheat flour, semolina & bread',
      icon: '🫓',
      matcher: (item) =>
        item.category === 'Grains & Carbs' &&
        /wheat|roti|ruti|atta|ata|bread|semolina|maida|গম|আটা|রুটি|সুজি|ময়দা|ময়দা|পাউরুটি|সেমাই|পরোটা/.test(
          itemHay(item)
        ),
    },
    {
      id: 'oats_barley_corn',
      labelBn: 'ওটস, যব, ভুট্টা ও দানা শস্য (Oats, Barley & Corn)',
      labelEn: 'Oats, Barley, Corn & Millets',
      descBn: 'ওটস, যব (Barley), ভুট্টা, মিলেট ও লো-জিআই শস্য',
      descEn: 'Rolled oats, whole barley, sweet corn, buckwheat & noodles',
      icon: '🥣',
      matcher: (item) =>
        item.category === 'Grains & Carbs' &&
        (item.bdSubCategory === '01' || !item.bdSubCategory) &&
        !/rice|bhat|chal|ভাত|চাল|ঢেঁকি|কাউন|মুড়ি|চিড়া|খই|পোলাও|জাউ|makhana|মাখনা|wheat|roti|ruti|atta|ata|bread|semolina|maida|গম|আটা|রুটি|সুজি|ময়দা|ময়দা|পাউরুটি|সেমাই|পরোটা/.test(
          itemHay(item)
        ),
    },
    {
      id: 'roots_tubers',
      labelBn: 'মিষ্টি আলু, কচু ও মূলজাতীয় (Roots & Tubers)',
      labelEn: 'Sweet Potato, Taro & Tubers',
      descBn: 'মিষ্টি আলু, কচুমুখী, ওলকচু ও আলু জাতীয় খাবার',
      descEn: 'Sweet potato, taro/aroids, yam & starchy tubers',
      icon: '🥔',
      matcher: (item) =>
        item.category === 'Grains & Carbs' &&
        (item.bdSubCategory === '05' || /potato|taro|yam|আলু|কচু|ওল/.test(itemHay(item))),
    },
  ],
  'Proteins': [
    {
      id: 'fish_fresh',
      labelBn: 'দেশি ও নদীর মাছ (Freshwater Fish)',
      labelEn: 'Freshwater & Indigenous Fish',
      descBn: 'রুই, কাতলা, শিং, মাগুর, মলা, ঢেলা, পুঁটি, কৈ, টাকি ও বোয়াল মাছ',
      descEn: 'Rohu, Catla, Shing, Magur, Mola, Punti & river fish',
      icon: '🐟',
      proteinBranch: 'animal',
      matcher: (item) =>
        item.category === 'Proteins' &&
        (item.bdSubCategory === 'fish_fresh' ||
          item.id === 'prot_fish_rui' ||
          item.id === 'prot_fish_magur' ||
          (/fish|মাছ|রুই|কাতলা|শিং|মাগুর|মলা|পুঁটি|কৈ|টাকি|বোয়াল|পাঙাশ|তেলাপিয়া/.test(itemHay(item)) &&
            item.bdSubCategory !== 'fish_marine')),
    },
    {
      id: 'fish_marine',
      labelBn: 'সামুদ্রিক মাছ ও চিংড়ি (Marine Fish & Shrimp)',
      labelEn: 'Marine Fish, Hilsa & Shellfish',
      descBn: 'ইলিশ, রূপচাঁদা, কোরাল/ভেটকি, লইট্টা, টুনা, ছুরি মাছ ও চিংড়ি',
      descEn: 'Hilsa, Pomfret, Sea bass, Tuna, Mackerel & Prawns/Shrimp',
      icon: '🦐',
      proteinBranch: 'animal',
      matcher: (item) =>
        item.category === 'Proteins' &&
        (item.bdSubCategory === 'fish_marine' ||
          /hilsa|ilish|ইলিশ|চিংড়ি|চিংড়ি|রূপচাঁদা|কোরাল|ভেটকি|লইট্টা|সামুদ্রিক|shrimp|prawn|crab|pomfret|tuna/.test(
            itemHay(item)
          )),
    },
    {
      id: 'egg_poultry_meat',
      labelBn: 'ডিম, দেশি মুরগি ও মাংস (Egg, Chicken & Meat)',
      labelEn: 'Eggs, Poultry & Meat',
      descBn: 'দেশি মুরগির ডিম, হাঁসের ডিম, দেশি মুরগির মাংস, কবুতর ও মাংস',
      descEn: 'Deshi eggs, chicken breast/stew, duck, pigeon & meat',
      icon: '🥚',
      proteinBranch: 'animal',
      matcher: (item) =>
        item.category === 'Proteins' &&
        (item.bdSubCategory === '10' ||
          item.bdSubCategory === '11' ||
          item.id === 'prot_egg' ||
          item.id === 'prot_chicken' ||
          item.id === 'prot_beef' ||
          item.id === 'prot_broiler_fried' ||
          /egg|chicken|hen|duck|pigeon|meat|beef|mutton|liver|ডিম|মুরগি|হাঁস|কবুতর|মাংস|গরু|খাসি|কলিজা/.test(
            itemHay(item)
          )),
    },
    {
      id: 'dairy_curd',
      labelBn: 'দুধ, টক দই ও দুগ্ধজাত (Curd, Milk & Dairy)',
      labelEn: 'Sour Curd, Milk & Dairy',
      descBn: 'ঘরে পাতা টক দই, ছানা, দুধ, ঘোল/মাঠা ও পনির',
      descEn: 'Homemade probiotic sour curd (Tok Doi), chhana, milk & buttermilk',
      icon: '🥛',
      proteinBranch: 'animal',
      matcher: (item) =>
        item.category === 'Proteins' &&
        (item.bdSubCategory === '12' ||
          item.id === 'prot_sour_curd' ||
          /milk|curd|yogurt|yoghurt|cheese|chhana|দুধ|দই|ছানা|পনির|মাঠা|ঘোল|ক্ষীর|পায়েস/.test(itemHay(item))),
    },
    {
      id: 'pulses_dal',
      labelBn: 'ডাল জাতীয় প্ল্যান্ট প্রোটিন (Lentils & Dal)',
      labelEn: 'Lentils & Split Pulses (Dal)',
      descBn: 'মুগ ডাল, মসুর ডাল, মাষকলাই ডাল, অড়হর ও খেসারি ডাল',
      descEn: 'Moong dal, Masoor dal, Black gram (Mashkalai) & Pigeon pea',
      icon: '🥣',
      proteinBranch: 'plant',
      matcher: (item) =>
        item.category === 'Proteins' &&
        (item.bdSubCategory === '02' || item.id === 'prot_moong' || item.id === 'prot_masoor') &&
        /lentil|mung|moong|masoor|mosur|dal|gram|pea|ডাল|মুগ|মসুর|মাষকলাই|মাসকলাই|খেসারি|অড়হর/.test(
          itemHay(item)
        ) &&
        !/chickpea|ছোলা|বুট|soy|সয়া|সয়া|bean|শিম|রাজমা/.test(itemHay(item)),
    },
    {
      id: 'chickpea_beans_soy',
      labelBn: 'ছোলা, মটর, শিমের বিচি ও সয়া (Chickpeas, Beans & Soy)',
      labelEn: 'Chickpeas, Beans, Peas & Soy Protein',
      descBn: 'ছোলা/বুট, মটরশুঁটি, শিমের বিচি, রাজমা ও সয়াবিন প্রোটিন',
      descEn: 'Chickpeas (Chhola), green peas, country bean seeds, kidney beans & soy',
      icon: '🌱',
      proteinBranch: 'plant',
      matcher: (item) =>
        item.category === 'Proteins' &&
        item.bdSubCategory === '02' &&
        (/chickpea|ছোলা|বুট|soy|সয়া|সয়া|bean|শিম|রাজমা|মটর/.test(itemHay(item)) ||
          !/lentil|mung|moong|masoor|mosur|dal|ডাল|মুগ|মসুর|মাষকলাই|মাসকলাই|খেসারি|অড়হর/.test(
            itemHay(item)
          )),
    },
    {
      id: 'plant_nuts_seeds_prot',
      labelBn: 'উচ্চ প্রোটিন বাদাম ও বীজ (Protein Nuts & Seeds)',
      labelEn: 'High-Protein Nuts & Seeds',
      descBn: 'চিনাবাদাম, কাঠবাদাম, চিয়া সিড, তিসি (Flaxseed), কুমড়ার বীজ ও সূর্যমুখী বীজ',
      descEn: 'Peanuts, almonds, chia seeds, flaxseeds, pumpkin & sunflower seeds',
      icon: '🥜',
      proteinBranch: 'plant',
      matcher: (item) =>
        item.bdSubCategory === '06' || item.id === 'fat_chia_flax' || item.id === 'fat_almonds_walnuts',
    },
  ],
  'Vegetables & Greens': [
    {
      id: 'gourd_veg_carbs',
      labelBn: 'লাউ, পেঁপে ও পানিজাতীয় সবজি (Gourd & Night Veg Carbs)',
      labelEn: 'Bottle Gourd, Green Papaya & Gourds',
      descBn: 'লাউ, কাঁচা পেঁপে, চালকুমড়া, ঝিঙে, পটল, চিচিঙ্গা, ধুন্দুল ও করলা',
      descEn: 'Lau, green papaya, ash gourd, ridge gourd, pointed gourd & bitter gourd',
      icon: '🥒',
      matcher: (item) =>
        item.category === 'Vegetables & Greens' &&
        item.bdSubCategory !== '04' &&
        (Boolean(item.isVegetableCarb) ||
          /gourd|papaya|lau|pepe|potol|jhinga|korola|cucumber|লাউ|পেঁপে|চালকুমড়া|ঝিঙে|পটল|চিচিঙ্গা|ধুন্দুল|করলা|শসা|মিষ্টি কুমড়া|কাকরোল/.test(
            itemHay(item)
          )),
    },
    {
      id: 'leafy_greens',
      labelBn: 'শাকপাতা (Leafy Greens / শাক)',
      labelEn: 'Spinach & Indigenous Leafy Greens',
      descBn: 'পালং শাক, লাল শাক, কলমি শাক, পুঁই শাক, সজনে পাতা, মেথি ও ডাটা শাক',
      descEn: 'Spinach, red amaranth, water spinach (Kolmi), malabar spinach & moringa leaves',
      icon: '🥬',
      matcher: (item) =>
        item.category === 'Vegetables & Greens' &&
        (item.bdSubCategory === '04' || /spinach|amaranth|leaf|leaves|shak|শাক|পাতা|পালং|কলমি|পুঁই/.test(itemHay(item))),
    },
    {
      id: 'cruciferous_other_veg',
      labelBn: 'ফুলকপি, ব্রকলি ও অন্যান্য সবজি (Other Vegetables)',
      labelEn: 'Cauliflower, Broccoli & Other Vegetables',
      descBn: 'ফুলকপি, বাঁধাকপি, ব্রকলি, গাজর, বিটরুট, টমেটো, সজনে ডাটা, শিম ও ঢ্যাঁড়শ',
      descEn: 'Cauliflower, cabbage, broccoli, carrot, beetroot, tomato, drumstick & okra',
      icon: '🥦',
      matcher: (item) =>
        item.category === 'Vegetables & Greens' &&
        item.bdSubCategory !== '04' &&
        !Boolean(item.isVegetableCarb) &&
        !/gourd|papaya|lau|pepe|potol|jhinga|korola|cucumber|লাউ|পেঁপে|চালকুমড়া|ঝিঙে|পটল|চিচিঙ্গা|ধুন্দুল|করলা|শসা|মিষ্টি কুমড়া|কাকরোল|spinach|amaranth|leaf|leaves|shak|শাক|পাতা|পালং|কলমি|পুঁই/.test(
          itemHay(item)
        ),
    },
  ],
  'Fruits & Snacks': [
    {
      id: 'low_gi_fruits',
      labelBn: 'লো-গ্লাইসেমিক দেশি ফল (Low-GI Daily Fruits)',
      labelEn: 'Low-GI Indigenous Fruits',
      descBn: 'পেয়ারা, আমলকী, জাম্বুরা, কালোজাম, ডালিম/বেদানা, কামরাঙা, বরই ও বাঙ্গি',
      descEn: 'Guava, Amla, Pomelo, Jamun, Pomegranate, Starfruit, Jujube & Melon',
      icon: '🍏',
      matcher: (item) =>
        item.category === 'Fruits & Snacks' &&
        (item.bdSubCategory === '08' || !item.bdSubCategory) &&
        /guava|amla|emblic|pomelo|jamun|pomegranate|starfruit|jujube|melon|apple|pear|orange|পেয়ারা|পেয়ারা|আমলকী|জাম্বুরা|বাতাবি|জাম|ডালিম|বেদানা|কামরাঙা|বরই|বাঙ্গি|আপেল|নাশপাতি|কমলা|মাল্টা|লেবু|চালতা|জলপাই|ডেউয়া|লটকন/.test(
          itemHay(item)
        ),
    },
    {
      id: 'seasonal_fruits',
      labelBn: 'মৌসুমি ও মিষ্টি ফল (Seasonal & Sweet Fruits)',
      labelEn: 'Seasonal & Sweet Fruits',
      descBn: 'পাকা পেঁপে, কলা, পাকা আম, কাঁঠাল, লিচু, আনারস, খেজুর ও তরমুজ',
      descEn: 'Ripe papaya, banana, mango, jackfruit, litchi, pineapple, dates & watermelon',
      icon: '🥭',
      matcher: (item) =>
        item.category === 'Fruits & Snacks' &&
        (item.bdSubCategory === '08' || !item.bdSubCategory) &&
        !/guava|amla|emblic|pomelo|jamun|pomegranate|starfruit|jujube|melon|apple|pear|orange|পেয়ারা|পেয়ারা|আমলকী|জাম্বুরা|বাতাবি|জাম|ডালিম|বেদানা|কামরাঙা|বরই|বাঙ্গি|আপেল|নাশপাতি|কমলা|মাল্টা|লেবু|চালতা|জলপাই|ডেউয়া|লটকন|coconut water|ডাব|tea|coffee|চা|কফি|drink|পানীয়/.test(
          itemHay(item)
        ),
    },
    {
      id: 'beverages_snacks',
      labelBn: 'ডাবের পানি ও পানীয় (Coconut Water & Beverages)',
      labelEn: 'Coconut Water, Tea & Misc',
      descBn: 'কচি ডাবের পানি, গ্রিন টি, লাল চা, আখের রস ও অন্যান্য পানীয়',
      descEn: 'Tender coconut water, green/black tea & beverages',
      icon: '🥥',
      matcher: (item) =>
        item.category === 'Fruits & Snacks' &&
        (item.bdSubCategory === '14' ||
          item.bdSubCategory === '15' ||
          /coconut water|ডাব|tea|coffee|চা|কফি|drink|পানীয়|juice|রস|মধু|গুড়|চিনি|মিষ্টি|বিস্কুট/.test(
            itemHay(item)
          )),
    },
  ],
  'Healthy Fats & Seeds': [
    {
      id: 'cooking_oils_ghee',
      labelBn: 'দেশি ঘি ও রান্নার তেল (Ghee & Cooking Oils)',
      labelEn: 'Deshi Ghee & Cooking Oils',
      descBn: 'খাঁটি দেশি গাওয়া ঘি, ঘানি ভাঙা সরিষার তেল, অলিভ অয়েল, নারিকেল তেল ও মাখন',
      descEn: 'Pure A2 Deshi Ghee, cold-pressed mustard oil, olive oil & coconut oil',
      icon: '🧈',
      matcher: (item) =>
        item.category === 'Healthy Fats & Seeds' &&
        (item.bdSubCategory === '13' ||
          item.id === 'fat_deshi_ghee' ||
          item.id === 'fat_olive_mustard' ||
          item.id === 'fat_soybean_oil' ||
          /ghee|oil|butter|fat|ঘি|তেল|মাখন|ডালডা/.test(itemHay(item))),
    },
    {
      id: 'nuts_seeds_fat',
      labelBn: 'বাদাম ও সুপার সিডস (Nuts & Seeds)',
      labelEn: 'Nuts & Super Seeds',
      descBn: 'চিয়া সিড, তিসি (Flaxseed), কাঠবাদাম, আখরোট, চিনাবাদাম, কাজুবাদাম, তিল ও কুমড়ার বীজ',
      descEn: 'Chia seeds, flaxseeds, almonds, walnuts, peanuts, cashews, sesame & pumpkin seeds',
      icon: '🥜',
      matcher: (item) =>
        item.category === 'Healthy Fats & Seeds' &&
        (item.bdSubCategory === '06' ||
          item.id === 'fat_chia_flax' ||
          item.id === 'fat_almonds_walnuts' ||
          /seed|nut|almond|walnut|cashew|peanut|sesame|flax|chia|বাদাম|বীজ|তিল|তিসি|চিয়া|আখরোট|নারিকেল/.test(
            itemHay(item)
          )),
    },
    {
      id: 'spices_herbs',
      labelBn: 'ভেষজ মসলা ও হার্বস (Spices & Herbs)',
      labelEn: 'Culinary Spices & Herbs',
      descBn: 'হলুদ, আদা, রসুন, দারুচিনি, মেথি, কালোজিরা, জিরা, ধনিয়া, লবঙ্গ ও এলাচ',
      descEn: 'Turmeric, ginger, garlic, cinnamon, fenugreek, nigella, cumin & coriander',
      icon: '🌿',
      matcher: (item) =>
        item.category === 'Healthy Fats & Seeds' &&
        (item.bdSubCategory === '07' ||
          (!/ghee|oil|butter|fat|ঘি|তেল|মাখন|ডালডা|seed|nut|almond|walnut|cashew|peanut|sesame|flax|chia|বাদাম|বীজ|তিল|তিসি|চিয়া|আখরোট/.test(
            itemHay(item)
          ) &&
            item.bdSubCategory !== '13' &&
            item.bdSubCategory !== '06')),
    },
  ],
};

const AnalysisReport: React.FC<Props> = ({
  profile,
  lang,
  darkMode,
  initialStep = 'report',
  user,
  onShowPaywall,
  onProceed,
}) => {
  const t = translations[lang];
  const isBn = lang === 'bn';
  const isPremiumUser = Boolean(user?.isPro || user?.isSubscribed || user?.isAdmin);
  const [screenStep, setScreenStep] = useState<'report' | 'traffic_light'>(initialStep);
  const [mobileChartTab, setMobileChartTab] = useState<'dosha' | 'markers'>('dosha');
  const [activeCategoryTab, setActiveCategoryTab] = useState<FoodCategory>('Grains & Carbs');
  const [activeProteinBranch, setActiveProteinBranch] = useState<'animal' | 'plant'>('animal');
  const [activeSubCatId, setActiveSubCatId] = useState<string>('rice_group');

  // By default, ONLY show Green & Yellow Zone foods; Red Zone stays hidden unless user clicks the Red Zone tab!
  const [activeZoneFilter, setActiveZoneFilter] = useState<'green_yellow' | 'green' | 'yellow' | 'red'>(
    'green_yellow'
  );
  const [foodSearchQuery, setFoodSearchQuery] = useState<string>('');
  const [inspectingBdFood, setInspectingBdFood] = useState<{
    item: TrafficLightFoodItem;
    raw?: BdFctFoodRecord;
  } | null>(null);

  const analysis = profile.analysis || {
    doshaBreakdown: { vata: 33, pitta: 34, kapha: 33 },
    microbiomeStatus: 'Diverse & Healthy',
    metabolicEfficiency: 'Flexible',
    inflammatoryStatus: 'Minimal',
    psychologicalProfile: 'Balanced',
    alkalineScore: 7.35,
    healthSummary: 'Clinical baseline established.',
    dietImpact: 'Ready for personalized nutrition.',
  };

  const gemini = new GeminiService();
  const defaultGuide: TrafficLightGuide = useMemo(() => {
    const freshGuide = gemini.getDefaultTrafficLightGuide(profile);
    if (profile.trafficLightGuide && profile.trafficLightGuide.items.length >= 100) {
      return profile.trafficLightGuide;
    }
    if (profile.trafficLightGuide && profile.trafficLightGuide.items.length > 0) {
      const existingIds = new Set(profile.trafficLightGuide.items.map((i) => i.id));
      return {
        ...freshGuide,
        items: [
          ...profile.trafficLightGuide.items,
          ...freshGuide.items.filter((i) => !existingIds.has(i.id)),
        ],
      };
    }
    return freshGuide;
  }, [profile]);

  const [selectedFoods, setSelectedFoods] = useState<string[]>(() => {
    if (profile.selectedFoods && profile.selectedFoods.length >= 8) {
      return profile.selectedFoods;
    }
    return getDefaultSelectedFoodIds(defaultGuide);
  });

  const [mealFrequency, setMealFrequency] = useState<3 | 4>(
    profile.mealFrequency || defaultGuide.recommendedMealFrequency
  );

  const [dinnerCarbRule, setDinnerCarbRule] = useState<
    'vegetable_carbs' | 'cereal_allowed' | 'no_carbs'
  >(profile.dinnerCarbRule || defaultGuide.recommendedDinnerCarbRule);

  const [hasHypoacidity, setHasHypoacidity] = useState<boolean>(
    profile.hasHypoacidity !== undefined ? profile.hasHypoacidity : defaultGuide.hasHypoacidity
  );

  useEffect(() => {
    setScreenStep(initialStep);
  }, [initialStep]);

  useEffect(() => {
    if (!profile.selectedFoods || profile.selectedFoods.length < 8) {
      setSelectedFoods(getDefaultSelectedFoodIds(defaultGuide));
    }
  }, [profile, defaultGuide]);

  const handleCategoryChange = (cat: FoodCategory) => {
    setActiveCategoryTab(cat);
    const subList = STRUCTURED_SUBCATEGORIES[cat] || [];
    if (cat === 'Proteins') {
      const firstInBranch = subList.find((s) => s.proteinBranch === activeProteinBranch);
      setActiveSubCatId(firstInBranch ? firstInBranch.id : subList[0]?.id || 'all');
    } else {
      setActiveSubCatId(subList[0]?.id || 'all');
    }
  };

  const handleProteinBranchChange = (branch: 'animal' | 'plant') => {
    setActiveProteinBranch(branch);
    const subList = STRUCTURED_SUBCATEGORIES['Proteins'].filter((s) => s.proteinBranch === branch);
    if (subList.length > 0) {
      setActiveSubCatId(subList[0].id);
    }
  };

  const toggleFoodSelection = (item: TrafficLightFoodItem) => {
    if (item.zone === 'red') return;
    setSelectedFoods((prev) =>
      prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]
    );
  };

  const goToStep = (next: 'report' | 'traffic_light') => {
    setScreenStep(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const doshaData = [
    { name: 'Vata', value: analysis.doshaBreakdown.vata, color: '#3b82f6' },
    { name: 'Pitta', value: analysis.doshaBreakdown.pitta, color: '#ef4444' },
    { name: 'Kapha', value: analysis.doshaBreakdown.kapha, color: '#10b981' },
  ];

  const markerData = [
    { name: 'Microbiome', value: profile.microbiomeScore },
    { name: 'Metabolic', value: 100 - profile.inflammatoryIndex * 10 },
    { name: 'Alkaline', value: Math.min(100, Math.max(0, (analysis.alkalineScore - 6) * 100)) },
  ];

  // --- Clinical Calculations ---
  const heightM = (profile.height || 165) / 100;
  const bmi = ((profile.weight || 65) / (heightM * heightM)).toFixed(1);

  const minWeight = (18.5 * heightM * heightM).toFixed(1);
  const maxWeight = (24.9 * heightM * heightM).toFixed(1);
  const standardWeightRange = `${minWeight} - ${maxWeight} kg`;

  let bmr =
    10 * (profile.weight || 65) + 6.25 * (profile.height || 165) - 5 * (profile.age || 35);
  bmr += profile.gender === 'Male' ? 5 : -161;
  bmr = Math.round(bmr);

  const tdee = Math.round(bmr * 1.375);
  const phase1TargetCal = bmr + 100;

  const mealSplitPreview =
    mealFrequency === 3
      ? [
          {
            slot: isBn ? 'সকাল (প্রোটিন + সবজি + সিড)' : 'Breakfast (Protein + Greens + Seeds)',
            kcal: Math.round(phase1TargetCal * 0.32),
            pct: '32%',
          },
          {
            slot: isBn ? 'দুপুর (শর্করা + প্রোটিন + সবজি)' : 'Lunch (Carb + Protein + Veggies)',
            kcal: Math.round(phase1TargetCal * 0.42),
            pct: '42%',
          },
          {
            slot: isBn
              ? dinnerCarbRule === 'vegetable_carbs'
                ? 'রাত (প্রোটিন + সবজি শর্করা: লাউ/পেঁপে)'
                : 'রাত (প্রোটিন + সবজি + পরিমিত শস্য)'
              : dinnerCarbRule === 'vegetable_carbs'
              ? 'Dinner (Protein + Boiled Lau/Pepe Carb)'
              : 'Dinner (Protein + Greens + Controlled Carb)',
            kcal:
              phase1TargetCal -
              Math.round(phase1TargetCal * 0.32) -
              Math.round(phase1TargetCal * 0.42),
            pct: '26%',
          },
        ]
      : [
          {
            slot: isBn ? 'সকাল (প্রোটিন + সবজি + সিড)' : 'Breakfast (Protein + Greens + Seeds)',
            kcal: Math.round(phase1TargetCal * 0.26),
            pct: '26%',
          },
          {
            slot: isBn ? 'দুপুর (শর্করা + প্রোটিন + সবজি)' : 'Lunch (Carb + Protein + Veggies)',
            kcal: Math.round(phase1TargetCal * 0.36),
            pct: '36%',
          },
          {
            slot: isBn ? 'বিকেল (মাখনা / বাদাম / পেয়ারা)' : 'Evening (Makhana / Nuts / Guava)',
            kcal: Math.round(phase1TargetCal * 0.13),
            pct: '13%',
          },
          {
            slot: isBn
              ? dinnerCarbRule === 'vegetable_carbs'
                ? 'রাত (প্রোটিন + সবজি শর্করা: লাউ/পেঁপে)'
                : 'রাত (প্রোটিন + সবজি + পরিমিত শস্য)'
              : dinnerCarbRule === 'vegetable_carbs'
              ? 'Dinner (Protein + Boiled Lau/Pepe Carb)'
              : 'Dinner (Protein + Greens + Controlled Carb)',
            kcal:
              phase1TargetCal -
              Math.round(phase1TargetCal * 0.26) -
              Math.round(phase1TargetCal * 0.36) -
              Math.round(phase1TargetCal * 0.13),
            pct: '25%',
          },
        ];

  const handleConfirmAndGenerate = (targetSubTab: DietSubTab = 'meals') => {
    const customizedProfile: HealthProfile = {
      ...profile,
      trafficLightGuide: defaultGuide,
      selectedFoods,
      mealFrequency,
      dinnerCarbRule,
      hasHypoacidity,
    };
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onProceed(customizedProfile, targetSubTab);
  };

  const currentCatIndex = CATEGORIES.indexOf(activeCategoryTab);

  // Subcategories visible for the active category (and active protein branch if Proteins)
  const visibleSubCategories = useMemo(() => {
    const allForCat = STRUCTURED_SUBCATEGORIES[activeCategoryTab] || [];
    if (activeCategoryTab === 'Proteins') {
      return allForCat.filter((s) => s.proteinBranch === activeProteinBranch);
    }
    return allForCat;
  }, [activeCategoryTab, activeProteinBranch]);

  const activeSubCategoryObj = useMemo(() => {
    const allForCat = STRUCTURED_SUBCATEGORIES[activeCategoryTab] || [];
    return allForCat.find((s) => s.id === activeSubCatId) || null;
  }, [activeCategoryTab, activeSubCatId]);

  // Base items for active category + subcategory (or across all categories if user is typing a search query)
  const categoryBaseItems = useMemo(() => {
    const q = foodSearchQuery.trim().toLowerCase();
    if (q) {
      return defaultGuide.items.filter((item) => {
        const hay = `${item.nameBn} ${item.nameEn} ${item.bdFctCode || ''} ${item.bdSubCategoryBn || ''} ${item.scientific || ''}`.toLowerCase();
        return hay.includes(q);
      });
    }

    if (activeSubCategoryObj) {
      return defaultGuide.items.filter((item) => activeSubCategoryObj.matcher(item));
    }

    if (activeCategoryTab === 'Proteins') {
      const branchSubs = STRUCTURED_SUBCATEGORIES['Proteins'].filter(
        (s) => s.proteinBranch === activeProteinBranch
      );
      return defaultGuide.items.filter((item) => branchSubs.some((s) => s.matcher(item)));
    }

    return defaultGuide.items.filter((item) => item.category === activeCategoryTab);
  }, [
    defaultGuide.items,
    activeCategoryTab,
    activeProteinBranch,
    activeSubCategoryObj,
    foodSearchQuery,
  ]);

  const greenCountInView = useMemo(
    () => categoryBaseItems.filter((i) => i.zone === 'green').length,
    [categoryBaseItems]
  );
  const yellowCountInView = useMemo(
    () => categoryBaseItems.filter((i) => i.zone === 'yellow').length,
    [categoryBaseItems]
  );
  const redCountInView = useMemo(
    () => categoryBaseItems.filter((i) => i.zone === 'red').length,
    [categoryBaseItems]
  );

  // Filter by Zone: Default 'green_yellow' hides Red Zone completely unless user clicks Red Zone tab
  const filteredCategoryItems = useMemo(() => {
    return categoryBaseItems.filter((item) => {
      if (activeZoneFilter === 'green_yellow') {
        return item.zone === 'green' || item.zone === 'yellow';
      }
      return item.zone === activeZoneFilter;
    });
  }, [categoryBaseItems, activeZoneFilter]);

  const handleSelectAllGreenInSubCategory = () => {
    const greenIds = categoryBaseItems.filter((i) => i.zone === 'green').map((i) => i.id);
    setSelectedFoods((prev) => Array.from(new Set([...prev, ...greenIds])));
  };

  const handleClearSubCategorySelection = () => {
    const catIds = new Set(categoryBaseItems.map((i) => i.id));
    setSelectedFoods((prev) => prev.filter((id) => !catIds.has(id)));
  };

  const handleOpenFoodDetail = (e: React.MouseEvent, item: TrafficLightFoodItem) => {
    e.stopPropagation();
    const raw = item.bdFctCode
      ? BD_FCT_RAW_FOODS.find((f) => f.code === item.bdFctCode)
      : undefined;
    setInspectingBdFood({ item, raw });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5 md:space-y-6 animate-in fade-in duration-500 pb-36 md:pb-28">
      {/* Top Unified Step Progress Header (Report → Food Guide → Diet Chart → Supplements → Exercise) */}
      <div
        className={`p-3.5 md:p-5 rounded-2xl md:rounded-3xl border flex flex-col lg:flex-row items-center justify-between gap-3 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-1.5 w-full lg:w-auto overflow-x-auto scrollbar-hide pb-1 lg:pb-0">
          <button
            type="button"
            onClick={() => goToStep('report')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              screenStep === 'report'
                ? 'bg-emerald-600 text-white shadow-sm'
                : darkMode
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>01.</span>
            <span>{isBn ? 'ক্লিনিক্যাল রিপোর্ট' : 'Clinical Report'}</span>
          </button>

          <span className="text-slate-400 font-bold text-xs">→</span>

          <button
            type="button"
            onClick={() => goToStep('traffic_light')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              screenStep === 'traffic_light'
                ? 'bg-emerald-600 text-white shadow-sm'
                : darkMode
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>02.</span>
            <span>🚦 {isBn ? 'ট্রাফিক লাইট ফুড গাইড' : 'Traffic Light Food Guide'}</span>
          </button>

          <span className="text-slate-400 font-bold text-xs">→</span>

          <button
            type="button"
            onClick={() => handleConfirmAndGenerate('meals')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 border ${
              darkMode
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50'
                : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <span>03.</span>
            <span>🥗 {isBn ? 'ডায়েট চার্ট' : 'Diet Chart'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleConfirmAndGenerate('supplements')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 border ${
              darkMode
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>04.</span>
            <span>💊 {isBn ? 'সাপ্লিমেন্ট পেজ' : 'Supplements'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleConfirmAndGenerate('exercise')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 border ${
              darkMode
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>05.</span>
            <span>🏃 {isBn ? 'এক্সারসাইজ পেজ' : 'Exercise'}</span>
          </button>
        </div>

        <div className="hidden xl:flex items-center gap-2.5 text-xs font-mono tabular-nums shrink-0">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
            {isBn ? `লক্ষ্য: ${phase1TargetCal} kcal` : `Target: ${phase1TargetCal} kcal`}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
            {isBn ? `${selectedFoods.length}টি খাবার নির্বাচিত` : `${selectedFoods.length} Selected`}
          </span>
        </div>
      </div>

      {/* =================================================================== */}
      {/* SCREEN 1: CLINICAL REPORT (SINGLE-SCREEN DESKTOP & MOBILE VIEW)     */}
      {/* =================================================================== */}
      {screenStep === 'report' && (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Left Column: Biometric & Clinical Baseline (5 cols on Desktop) */}
            <div
              className={`lg:col-span-5 p-5 md:p-7 rounded-3xl border flex flex-col justify-between gap-4 ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {isBn ? 'স্ক্রিন ১/২ · বায়োমেট্রিক রিপোর্ট' : 'Screen 1/2 · Biometric Synthesis'}
                  </span>
                  <span className="text-xs font-mono font-bold opacity-60 tabular-nums">
                    {profile.dosha}
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold serif italic mb-4">
                  {t.clinical_synthesis}
                </h2>

                {/* 2x2 Compact Metric Grid */}
                <div className="grid grid-cols-2 gap-3 tabular-nums">
                  <div
                    className={`p-3.5 rounded-2xl border ${
                      darkMode ? 'bg-slate-800/70 border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-[11px] font-semibold opacity-60 block">{t.metric_bmi}</span>
                    <span
                      className={`text-xl md:text-2xl font-bold ${
                        parseFloat(bmi) > 25 ? 'text-amber-500' : 'text-emerald-500'
                      }`}
                    >
                      {bmi}
                    </span>
                  </div>
                  <div
                    className={`p-3.5 rounded-2xl border ${
                      darkMode ? 'bg-slate-800/70 border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-[11px] font-semibold opacity-60 block">
                      {t.metric_std_weight}
                    </span>
                    <span className="text-base md:text-lg font-bold">{standardWeightRange}</span>
                  </div>
                  <div
                    className={`p-3.5 rounded-2xl border ${
                      darkMode ? 'bg-slate-800/70 border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-[11px] font-semibold opacity-60 block">{t.metric_bmr}</span>
                    <span className="text-xl md:text-2xl font-bold text-indigo-500">
                      {bmr} <span className="text-[10px]">{t.metric_kcal}</span>
                    </span>
                  </div>
                  <div
                    className={`p-3.5 rounded-2xl border ${
                      darkMode ? 'bg-slate-800/70 border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-[11px] font-semibold opacity-60 block">{t.metric_tdee}</span>
                    <span className="text-xl md:text-2xl font-bold text-blue-500">
                      {tdee} <span className="text-[10px]">{t.metric_kcal}</span>
                    </span>
                  </div>
                </div>

                {/* Condition & Diet Impact */}
                <div className="space-y-2.5 mt-4">
                  <div
                    className={`p-3.5 rounded-2xl border ${
                      darkMode ? 'bg-red-950/20 border-red-900/50' : 'bg-red-50/70 border-red-200'
                    }`}
                  >
                    <span className="text-[11px] font-bold text-red-600 dark:text-red-400 block">
                      {t.metric_condition}
                    </span>
                    <p
                      className={`text-xs md:text-sm font-semibold mt-0.5 ${
                        darkMode ? 'text-slate-200' : 'text-slate-800'
                      }`}
                    >
                      {profile.medicalConditions ||
                        (isBn ? 'মেটাবলিক ও গাট রিস্টোরেশন' : 'Metabolic & Gut Restoration')}
                    </p>
                  </div>
                  <div
                    className={`p-3.5 rounded-2xl border ${
                      darkMode
                        ? 'bg-amber-950/20 border-amber-900/50'
                        : 'bg-amber-50/70 border-amber-200'
                    }`}
                  >
                    <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 block">
                      {t.metric_diet_error}
                    </span>
                    <p
                      className={`text-xs md:text-sm font-semibold mt-0.5 line-clamp-2 ${
                        darkMode ? 'text-slate-200' : 'text-slate-800'
                      }`}
                    >
                      {analysis.dietImpact}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="opacity-70">
                  {isBn ? 'ফেজ ১ ক্যালোরি টার্গেট:' : 'Phase 1 Calorie Target:'}
                </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {phase1TargetCal} kcal / day (40% C · 30% P · 30% F)
                </span>
              </div>
            </div>

            {/* Right Column: Dosha & Biological Markers (7 cols on Desktop, Tabbed on Mobile) */}
            <div
              className={`lg:col-span-7 p-5 md:p-7 rounded-3xl border flex flex-col justify-between ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex md:hidden p-1 rounded-xl bg-slate-100 dark:bg-slate-800 mb-4">
                <button
                  type="button"
                  onClick={() => setMobileChartTab('dosha')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    mobileChartTab === 'dosha'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {t.prakriti_const}
                </button>
                <button
                  type="button"
                  onClick={() => setMobileChartTab('markers')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    mobileChartTab === 'markers'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {t.bio_markers}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center flex-1">
                {/* Prakriti Chart */}
                <div className={`${mobileChartTab === 'dosha' ? 'block' : 'hidden md:block'}`}>
                  <h3 className="text-base font-bold serif italic mb-2">{t.prakriti_const}</h3>
                  <div className="h-40 md:h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={doshaData}
                          innerRadius={45}
                          outerRadius={68}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {doshaData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-3 gap-2 tabular-nums mt-2">
                    {doshaData.map((d) => (
                      <div
                        key={d.name}
                        className={`p-2 rounded-xl text-center ${
                          darkMode ? 'bg-slate-800/60' : 'bg-slate-50'
                        }`}
                      >
                        <div className="text-[11px] font-semibold opacity-60">{d.name}</div>
                        <div className="text-base font-bold" style={{ color: d.color }}>
                          {d.value}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Biological Markers (Partially covered for non-premium users) */}
                <div className={`${mobileChartTab === 'markers' ? 'block' : 'hidden md:block'} relative`}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="text-base font-bold serif italic">{t.bio_markers}</h3>
                    {!isPremiumUser && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                        {isBn ? 'আংশিক প্রিভিউ' : 'Partial Preview'}
                      </span>
                    )}
                  </div>
                  <div className="h-40 md:h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={markerData} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis
                          dataKey="name"
                          type="category"
                          axisLine={false}
                          tickLine={false}
                          width={85}
                          style={{ fontWeight: 'bold', fontSize: '11px' }}
                        />
                        <Tooltip />
                        <Bar dataKey="value" fill="#10b981" radius={[0, 8, 8, 0]} barSize={22} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {isPremiumUser ? (
                    <div className="space-y-2 text-xs tabular-nums mt-2">
                      <div className="flex justify-between items-center">
                        <span className="opacity-70">{t.inflam_status}:</span>
                        <span className="font-bold text-red-500">{analysis.inflammatoryStatus}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="opacity-70">{t.alkaline_score}:</span>
                        <span
                          className={`font-bold ${
                            analysis.alkalineScore > 7.3 ? 'text-blue-500' : 'text-red-500'
                          }`}
                        >
                          {analysis.alkalineScore}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="opacity-70">{t.microbiome_type}:</span>
                        <span className="font-bold text-emerald-500">{analysis.microbiomeStatus}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between items-center text-xs tabular-nums">
                        <span className="opacity-70">{t.inflam_status}:</span>
                        <span className="font-bold text-red-500">{analysis.inflammatoryStatus}</span>
                      </div>
                      <div className="relative rounded-xl overflow-hidden border border-amber-500/30 p-2.5">
                        <div className="blur-[5px] select-none pointer-events-none opacity-50 space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span>{t.alkaline_score}:</span>
                            <span>{analysis.alkalineScore}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{t.microbiome_type}:</span>
                            <span>{analysis.microbiomeStatus}</span>
                          </div>
                        </div>
                        <div className="inset-0 absolute flex items-center justify-between px-3 bg-slate-900/75 text-white backdrop-blur-[1px]">
                          <span className="text-[11px] font-bold">
                            🔒 {isBn ? 'বাকি বায়ো-মার্কার ঢাকা রয়েছে' : 'Remaining Markers Covered'}
                          </span>
                          {onShowPaywall && (
                            <button
                              type="button"
                              onClick={onShowPaywall}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-amber-500 text-slate-950"
                            >
                              {isBn ? 'আনলক' : 'Unlock'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Pregnancy Milestones Dashboard */}
              {profile.cohortType === 'pregnancy_lactation' && (
                <div className="mt-6">
                  <PregnancyMilestonesDashboard
                    currentPregnancyMonth={profile.pregnancyMonth || 1}
                    lang={lang}
                    darkMode={darkMode}
                  />
                </div>
              )}

              {/* Child Development Milestones */}
              {profile.cohortType === 'child_pediatric' && (
                <div className="mt-6">
                  <ChildDevelopmentMilestones
                    childAgeGroup={profile.childAgeGroup || '1-3'}
                    childAgeYears={profile.age}
                    childWeightKg={profile.weight}
                    childHeightCm={profile.height}
                    lang={lang}
                    darkMode={darkMode}
                  />
                </div>
              )}

              {/* Next Screen Action Inside Report */}
              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs opacity-75">
                  {isBn
                    ? 'পরবর্তী ধাপে ক্যাটাগরি অনুযায়ী ট্রাফিক লাইট ফুড গাইড দেখুন অথবা সরাসরি ডায়েট চার্টে যান।'
                    : 'Proceed to select foods by category in the Traffic Light Guide or open your Diet Chart.'}
                </p>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => goToStep('traffic_light')}
                    className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-2xl font-bold text-xs md:text-sm tracking-wide transition-all shadow-lg active:scale-95 whitespace-nowrap"
                  >
                    {isBn ? '🚦 ট্রাফিক লাইট ফুড গাইড →' : '🚦 Traffic Light Guide →'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfirmAndGenerate('meals')}
                    className="flex-1 sm:flex-initial bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-2xl font-bold text-xs md:text-sm tracking-wide transition-all shadow-lg active:scale-95 whitespace-nowrap"
                  >
                    {isBn ? '🥗 সরাসরি ডায়েট চার্ট →' : '🥗 Direct to Diet Chart →'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SCREEN 2: TRAFFIC LIGHT FOOD GUIDE (CATEGORY -> SUBCATEGORY FLOW)   */}
      {/* =================================================================== */}
      {screenStep === 'traffic_light' && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Top Compact Meal Protocol & Night Carb Bar */}
          <div
            className={`p-4 md:p-6 rounded-3xl border ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
              {/* 3 vs 4 Meals */}
              <div className="lg:col-span-4 space-y-2">
                <label className="block text-xs font-bold opacity-80">
                  {isBn
                    ? '১. খাবারের বেলা নির্বাচন (ক্যালোরি স্বয়ংক্রিয়ভাবে ভাগ হবে):'
                    : '1. Daily Meal Frequency:'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMealFrequency(3)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      mealFrequency === 3
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                        : darkMode
                        ? 'border-slate-800 bg-slate-800/50 text-slate-300'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="text-xs md:text-sm font-bold">
                      {isBn ? '৩ বেলা খাবার' : '3 Meals / Day'}
                    </div>
                    <div className="text-[10px] opacity-75 mt-0.5">
                      {isBn ? 'সকাল · দুপুর · রাত' : 'Breakfast · Lunch · Dinner'}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMealFrequency(4)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      mealFrequency === 4
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                        : darkMode
                        ? 'border-slate-800 bg-slate-800/50 text-slate-300'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="text-xs md:text-sm font-bold">
                      {isBn ? '৪ বেলা খাবার' : '4 Meals / Day'}
                    </div>
                    <div className="text-[10px] opacity-75 mt-0.5">
                      {isBn ? 'সকাল · দুপুর · বিকেল · রাত' : 'Includes Evening Snack'}
                    </div>
                  </button>
                </div>
              </div>

              {/* Night Carb Rule & Hypoacidity */}
              <div className="lg:col-span-4 space-y-2">
                <label className="block text-xs font-bold opacity-80">
                  {isBn ? '২. রাতের শর্করা ও হজম প্রোটোকল:' : '2. Night Carb & Digestive Rule:'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDinnerCarbRule('vegetable_carbs')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      dinnerCarbRule === 'vegetable_carbs'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                        : darkMode
                        ? 'border-slate-800 bg-slate-800/50 text-slate-300'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold">
                      {isBn ? 'রাতে সবজি শর্করা' : 'Night: Veg Carbs'}
                    </div>
                    <div className="text-[10px] opacity-75 mt-0.5">
                      {isBn ? 'লাউ/পেঁপে সিদ্ধ + প্রোটিন' : 'Boiled Gourd + Protein'}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDinnerCarbRule('cereal_allowed')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      dinnerCarbRule === 'cereal_allowed'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                        : darkMode
                        ? 'border-slate-800 bg-slate-800/50 text-slate-300'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold">
                      {isBn ? 'রাতে শস্য অনুমোদিত' : 'Night: Cereal Carb'}
                    </div>
                    <div className="text-[10px] opacity-75 mt-0.5">
                      {isBn ? '১টি লাল রুটি/ভাত + প্রোটিন' : '1 Red Roti + Protein'}
                    </div>
                  </button>
                </div>
              </div>

              {/* Calorie Split Summary Badges */}
              <div className="lg:col-span-4">
                <div
                  className={`p-3 rounded-2xl border space-y-1.5 tabular-nums ${
                    darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {isBn
                        ? `${mealFrequency} বেলায় ${phase1TargetCal} kcal বণ্টন`
                        : `${mealFrequency}-Meal Split (${phase1TargetCal} kcal)`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setHasHypoacidity(!hasHypoacidity)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        hasHypoacidity
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300'
                          : 'opacity-60'
                      }`}
                    >
                      {hasHypoacidity
                        ? isBn
                          ? '✓ হাইপোঅ্যাসিডিটি শট'
                          : '✓ Hypoacidity Shot'
                        : isBn
                        ? '+ হাইপোঅ্যাসিডিটি শট'
                        : '+ Hypoacidity Shot'}
                    </button>
                  </div>
                  {mealSplitPreview.map((m, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-[11px] border-t pt-1 border-slate-200/60 dark:border-slate-700/60"
                    >
                      <span className="truncate pr-2 opacity-85">{m.slot}</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                        {m.kcal} kcal
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* =============================================================== */}
          {/* HIERARCHICAL TRAFFIC LIGHT FOOD GUIDE CARD                      */}
          {/* =============================================================== */}
          <div
            className={`p-4 md:p-7 rounded-3xl border ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            {/* Header & Zone Filter (Green & Yellow Default; Red Zone Hidden Unless Clicked) */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    {isBn
                      ? `বাংলাদেশ ফুড কম্পোজিশন টেবিল (BD FCT) • ক্যাটাগরি ওয়াইজ গাইড`
                      : `Bangladesh Food Composition Table (BD FCT) • Category Guide`}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                    {isBn
                      ? `${selectedFoods.length}টি খাবার আপনার ডায়েট চার্টে নির্বাচিত`
                      : `${selectedFoods.length} Foods Selected for Diet Chart`}
                  </span>
                </div>
                <h2 className="text-lg md:text-2xl font-bold serif italic">
                  {isBn
                    ? '🚦 ক্যাটাগরি ও সাব-ক্যাটাগরি অনুযায়ী খাবার নির্বাচন করুন'
                    : '🚦 Select Foods by Category & Subcategory'}
                </h2>
                <p className="text-xs opacity-75 mt-0.5">
                  {isBn
                    ? 'ডিফল্টভাবে শুধু 🟢 গ্রিন ও 🟡 ইয়েলো জোনের খাবার দেখানো হচ্ছে। 🔴 রেড জোন (বর্জনীয় খাবার) দেখতে ডানদিকের রেড জোন ট্যাবে ক্লিক করুন।'
                    : 'Showing 🟢 Green & 🟡 Yellow Zone foods by default. Click the 🔴 Red Zone tab on the right to view restricted foods.'}
                </p>
              </div>

              {/* Zone Filter Tabs: Green+Yellow (Default), Green Only, Yellow Only, Red (Hidden by default) */}
              <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-x-auto scrollbar-hide">
                <button
                  type="button"
                  onClick={() => setActiveZoneFilter('green_yellow')}
                  className={`px-3 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                    activeZoneFilter === 'green_yellow'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700'
                  }`}
                >
                  🟢🟡{' '}
                  {isBn
                    ? `গ্রিন ও ইয়েলো জোন (${greenCountInView + yellowCountInView})`
                    : `Green & Yellow (${greenCountInView + yellowCountInView})`}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveZoneFilter('green')}
                  className={`px-3 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                    activeZoneFilter === 'green'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-emerald-700 dark:text-emerald-400 hover:bg-white/50 dark:hover:bg-slate-700'
                  }`}
                >
                  🟢 {isBn ? `শুধু গ্রিন (${greenCountInView})` : `Green (${greenCountInView})`}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveZoneFilter('yellow')}
                  className={`px-3 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                    activeZoneFilter === 'yellow'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-amber-700 dark:text-amber-400 hover:bg-white/50 dark:hover:bg-slate-700'
                  }`}
                >
                  🟡 {isBn ? `শুধু ইয়েলো (${yellowCountInView})` : `Yellow (${yellowCountInView})`}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveZoneFilter('red')}
                  className={`px-3 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all border ${
                    activeZoneFilter === 'red'
                      ? 'bg-red-600 text-white border-red-600 shadow-sm'
                      : 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20'
                  }`}
                >
                  🔴{' '}
                  {isBn
                    ? `রেড জোন দেখুন (${redCountInView})`
                    : `View Red Zone (${redCountInView})`}
                </button>
              </div>
            </div>

            {/* ============================================================= */}
            {/* STEP 1: 5 PRIMARY FOOD CATEGORIES (প্রধান ক্যাটাগরি)           */}
            {/* ============================================================= */}
            <div className="pt-4 pb-3 border-b border-slate-200/70 dark:border-slate-800">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
                {isBn
                  ? 'ধাপ ১: প্রধান খাদ্য বিভাগ নির্বাচন করুন (যেমন: ভাতের জন্য সিরিয়ালস, মাছ/মাংস/ডালের জন্য প্রোটিন সোর্স)'
                  : 'Step 1: Choose Main Food Category (e.g., Cereals for Rice, Protein Sources for Fish/Dal)'}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {CATEGORIES.map((cat) => {
                  const catItems = defaultGuide.items.filter(
                    (i) => i.category === cat && i.zone !== 'red'
                  );
                  const selectedInCat = defaultGuide.items.filter(
                    (i) => i.category === cat && selectedFoods.includes(i.id)
                  ).length;
                  const isActive = activeCategoryTab === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryChange(cat)}
                      className={`p-3 rounded-2xl text-left transition-all border flex flex-col justify-between gap-1.5 ${
                        isActive
                          ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                          : darkMode
                          ? 'bg-slate-800/90 border-slate-700 text-slate-200 hover:border-emerald-500/50'
                          : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-emerald-500/50'
                      }`}
                    >
                      <span className="text-xs font-extrabold leading-snug">
                        {isBn ? CATEGORY_SHORT_BN[cat] : CATEGORY_SHORT_EN[cat]}
                      </span>
                      <div className="flex items-center justify-between text-[10px] font-mono pt-1">
                        <span className={isActive ? 'text-emerald-100' : 'opacity-70'}>
                          {isBn ? `নির্বাচিত: ${selectedInCat}` : `Selected: ${selectedInCat}`}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded-md font-bold ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {catItems.length} {isBn ? 'টি' : 'items'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ============================================================= */}
            {/* STEP 2A: IF PROTEINS -> ANIMAL PROTEIN vs PLANT PROTEIN TABS  */}
            {/* ============================================================= */}
            {activeCategoryTab === 'Proteins' && (
              <div className="pt-4 pb-2 border-b border-slate-200/70 dark:border-slate-800">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">
                  {isBn
                    ? 'ধাপ ২ (ক): প্রোটিনের উৎস নির্বাচন করুন — অ্যানিমেল প্রোটিন নাকি প্ল্যান্ট প্রোটিন?'
                    : 'Step 2A: Choose Protein Source Type — Animal Protein or Plant Protein'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleProteinBranchChange('animal')}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 ${
                      activeProteinBranch === 'animal'
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                        : darkMode
                        ? 'bg-slate-800/80 border-slate-700 text-slate-200 hover:border-indigo-500/50'
                        : 'bg-indigo-50/50 border-indigo-200 text-slate-800 hover:border-indigo-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🐟🥚🍗</span>
                      <div>
                        <div className="text-xs md:text-sm font-extrabold">
                          {isBn
                            ? 'অ্যানিমেল প্রোটিন / প্রাণীজ প্রোটিন (Animal Protein)'
                            : 'Animal Protein (Fish, Egg, Poultry & Dairy)'}
                        </div>
                        <div
                          className={`text-[11px] mt-0.5 ${
                            activeProteinBranch === 'animal' ? 'text-indigo-100' : 'opacity-75'
                          }`}
                        >
                          {isBn
                            ? 'দেশি মাছ, সামুদ্রিক মাছ, ডিম, দেশি মুরগি, টক দই ও দুধ'
                            : 'Freshwater fish, marine fish, deshi eggs, poultry & probiotic curd'}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-xl text-xs font-extrabold shrink-0 ${
                        activeProteinBranch === 'animal'
                          ? 'bg-white text-indigo-700'
                          : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                      }`}
                    >
                      {activeProteinBranch === 'animal' ? (isBn ? '✓ নির্বাচিত' : '✓ Active') : isBn ? 'দেখুন →' : 'View →'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleProteinBranchChange('plant')}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 ${
                      activeProteinBranch === 'plant'
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                        : darkMode
                        ? 'bg-slate-800/80 border-slate-700 text-slate-200 hover:border-emerald-500/50'
                        : 'bg-emerald-50/50 border-emerald-200 text-slate-800 hover:border-emerald-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🫘🌱🥜</span>
                      <div>
                        <div className="text-xs md:text-sm font-extrabold">
                          {isBn
                            ? 'প্ল্যান্ট প্রোটিন / উদ্ভিজ্জ প্রোটিন (Plant Protein)'
                            : 'Plant Protein (Lentils, Chickpeas, Beans & Seeds)'}
                        </div>
                        <div
                          className={`text-[11px] mt-0.5 ${
                            activeProteinBranch === 'plant' ? 'text-emerald-100' : 'opacity-75'
                          }`}
                        >
                          {isBn
                            ? 'মুগ ডাল, মসুর ডাল, ছোলা, মটর, শিমের বিচি, সয়া এবং প্রোটিন বাদাম/বীজ'
                            : 'Moong/Masoor dal, chickpeas, beans, soy & protein-rich nuts/seeds'}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-xl text-xs font-extrabold shrink-0 ${
                        activeProteinBranch === 'plant'
                          ? 'bg-white text-emerald-700'
                          : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {activeProteinBranch === 'plant' ? (isBn ? '✓ নির্বাচিত' : '✓ Active') : isBn ? 'দেখুন →' : 'View →'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* STEP 2: SUBCATEGORY CARDS (সাব-ক্যাটাগরি কার্ডস)              */}
            {/* ============================================================= */}
            <div className="py-3.5 space-y-3 border-b border-slate-200/70 dark:border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {isBn
                    ? 'ধাপ ২: নির্দিষ্ট খাবারের সাব-ক্যাটাগরিতে ক্লিক করুন (একবারে অল্প ও গোছানো তালিকা দেখার জন্য)'
                    : 'Step 2: Click a Specific Subcategory Below to View & Select Foods'}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveSubCatId('all')}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
                    activeSubCatId === 'all'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : darkMode
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  ✨ {isBn ? 'এই বিভাগের সব খাবার একসাথে দেখুন' : 'Show All in Category'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {visibleSubCategories.map((sub) => {
                  const subItems = defaultGuide.items.filter((i) => sub.matcher(i));
                  const safeSubCount = subItems.filter((i) => i.zone !== 'red').length;
                  const selectedSubCount = subItems.filter((i) =>
                    selectedFoods.includes(i.id)
                  ).length;
                  const isSubActive = activeSubCatId === sub.id;

                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setActiveSubCatId(sub.id)}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                        isSubActive
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                          : darkMode
                          ? 'bg-slate-800/70 border-slate-700 text-slate-200 hover:border-indigo-500/50'
                          : 'bg-white border-slate-200 text-slate-800 hover:border-indigo-400 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{sub.icon}</span>
                          <span className="text-xs font-extrabold leading-snug">
                            {isBn ? sub.labelBn : sub.labelEn}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold shrink-0 ${
                            isSubActive
                              ? 'bg-white/20 text-white'
                              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {selectedSubCount}/{safeSubCount}
                        </span>
                      </div>
                      <p
                        className={`text-[10px] line-clamp-1 ${
                          isSubActive ? 'text-indigo-100' : 'opacity-70'
                        }`}
                      >
                        {isBn ? sub.descBn : sub.descEn}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Search Bar & Bulk Actions */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pt-1">
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    value={foodSearchQuery}
                    onChange={(e) => setFoodSearchQuery(e.target.value)}
                    placeholder={
                      isBn
                        ? '🔎 সরাসরি খাবার খুঁজুন (যেমন: ভাত, রুই, লাউ, মুগ ডাল, ডিম, পেয়ারা)...'
                        : '🔎 Quick search any food (e.g., Rice, Rohu, Lau, Egg, Moong Dal)...'
                    }
                    className={`w-full px-3.5 py-2 rounded-xl text-xs border outline-none transition-all ${
                      darkMode
                        ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
                    }`}
                  />
                  {foodSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setFoodSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs opacity-60 hover:opacity-100"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllGreenInSubCategory}
                    className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors"
                  >
                    ✓ {isBn ? 'এই তালিকার সব গ্রিন মার্ক করুন' : 'Select All Green Here'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFoods(getDefaultSelectedFoodIds(defaultGuide))}
                    className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/25 transition-colors"
                  >
                    ↺ {isBn ? 'প্রস্তাবিত ডিফল্ট সিলেকশন' : 'Recommended Default'}
                  </button>
                  <button
                    type="button"
                    onClick={handleClearSubCategorySelection}
                    className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
                  >
                    ✕ {isBn ? 'এই তালিকা ক্লিয়ার' : 'Clear Current List'}
                  </button>
                </div>
              </div>
            </div>

            {/* Active Subcategory Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-4 mb-3">
              <div>
                <h3 className="text-sm md:text-base font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <span>
                    {foodSearchQuery
                      ? isBn
                        ? `🔎 "${foodSearchQuery}" অনুসন্ধানের ফলাফল (${filteredCategoryItems.length}টি খাবার)`
                        : `🔎 Search Results for "${foodSearchQuery}" (${filteredCategoryItems.length} foods)`
                      : activeSubCategoryObj
                      ? `${activeSubCategoryObj.icon} ${
                          isBn ? activeSubCategoryObj.labelBn : activeSubCategoryObj.labelEn
                        } (${filteredCategoryItems.length}টি খাবার)`
                      : isBn
                      ? `${CATEGORY_LABELS_BN[activeCategoryTab]} (${filteredCategoryItems.length}টি খাবার)`
                      : `${activeCategoryTab} (${filteredCategoryItems.length} foods)`}
                  </span>
                </h3>
                <p className="text-xs opacity-70 mt-0.5">
                  {activeZoneFilter === 'red'
                    ? isBn
                      ? '🔴 রেড জোন (বর্জনীয় খাবার): এগুলো আপনার কন্ডিশনের জন্য ক্ষতিকর, তাই ডায়েট চার্টে সিলেক্ট করা যাবে না।'
                      : '🔴 Red Zone (Restricted): Strictly avoid these foods for your condition.'
                    : isBn
                    ? '🟢 গ্রিন ও 🟡 ইয়েলো জোন: আপনার পছন্দের খাবারে ক্লিক করে টিক (✓) দিন। রেড জোন লুকানো আছে।'
                    : '🟢 Green & 🟡 Yellow Zone: Tap any food card to include/exclude from your Diet Chart. Red Zone is hidden.'}
                </p>
              </div>

              {activeZoneFilter !== 'red' && redCountInView > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveZoneFilter('red')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/25 hover:bg-red-500/20 self-start sm:self-auto shrink-0"
                >
                  🔴 {isBn ? `এই বিভাগের বর্জনীয় খাবার দেখুন (${redCountInView}টি)` : `See Restricted Red Foods (${redCountInView})`}
                </button>
              )}
              {activeZoneFilter === 'red' && (
                <button
                  type="button"
                  onClick={() => setActiveZoneFilter('green_yellow')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white self-start sm:self-auto shrink-0"
                >
                  🟢🟡 {isBn ? 'গ্রিন ও ইয়েলো জোনে ফিরে যান' : 'Back to Green & Yellow Foods'}
                </button>
              )}
            </div>

            {/* Food Grid for the Active Subcategory */}
            {filteredCategoryItems.length === 0 ? (
              <div className="py-10 text-center space-y-2.5 opacity-80">
                <div className="text-3xl">{activeZoneFilter === 'red' ? '🎉' : '🔎'}</div>
                <div className="font-bold text-sm">
                  {activeZoneFilter === 'red'
                    ? isBn
                      ? 'এই সাব-ক্যাটাগরিতে কোনো রেড জোন (নিষিদ্ধ) খাবার নেই!'
                      : 'No Red Zone (restricted) foods in this subcategory!'
                    : isBn
                    ? 'এই ফিল্টারে কোনো খাবার পাওয়া যায়নি'
                    : 'No foods matched this filter'}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveZoneFilter('green_yellow');
                    setFoodSearchQuery('');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white"
                >
                  {isBn ? '🟢🟡 গ্রিন ও ইয়েলো জোনের খাবার দেখুন' : 'Show Green & Yellow Foods'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredCategoryItems.map((item) => {
                  const isSelected = selectedFoods.includes(item.id);
                  const isRed = item.zone === 'red';
                  const isGreen = item.zone === 'green';

                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleFoodSelection(item)}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 ${
                        isRed
                          ? darkMode
                            ? 'bg-red-950/15 border-red-900/40 opacity-85 cursor-not-allowed'
                            : 'bg-red-50/60 border-red-200 opacity-90 cursor-not-allowed'
                          : isSelected
                          ? isGreen
                            ? darkMode
                              ? 'bg-emerald-950/35 border-emerald-500 cursor-pointer shadow-sm'
                              : 'bg-emerald-50/90 border-emerald-500 cursor-pointer shadow-sm'
                            : darkMode
                            ? 'bg-amber-950/35 border-amber-500 cursor-pointer shadow-sm'
                            : 'bg-amber-50/90 border-amber-500 cursor-pointer shadow-sm'
                          : darkMode
                          ? 'bg-slate-800/40 border-slate-700/80 hover:border-slate-500 cursor-pointer'
                          : 'bg-slate-50/80 border-slate-200 hover:border-slate-400 cursor-pointer'
                      }`}
                    >
                      <div className="space-y-2">
                        {/* Top row: Icon, Category/Code tag, Checkbox */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <span className="text-xl shrink-0 mt-0.5">{item.icon || '🥗'}</span>
                            <div>
                              <span className="font-bold text-xs md:text-sm leading-snug block">
                                {isBn ? item.nameBn : item.nameEn}
                              </span>
                              <span className="text-[10px] opacity-65 block">
                                {isBn ? item.nameEn : item.nameBn}
                                {item.bdFctCode ? ` • BD FCT #${item.bdFctCode}` : ''}
                              </span>
                            </div>
                          </div>

                          {isRed ? (
                            <span className="px-2 py-0.5 rounded-md bg-red-500/15 text-[10px] font-bold text-red-600 dark:text-red-400 shrink-0">
                              {isBn ? 'বর্জনীয় ✕' : 'Avoid ✕'}
                            </span>
                          ) : (
                            <span
                              className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 border transition-transform ${
                                isSelected
                                  ? isGreen
                                    ? 'bg-emerald-600 border-emerald-600 text-white scale-105'
                                    : 'bg-amber-500 border-amber-500 text-white scale-105'
                                  : 'border-slate-400 dark:border-slate-600'
                              }`}
                            >
                              {isSelected ? '✓' : '+'}
                            </span>
                          )}
                        </div>

                        {/* BD FCT Per-100g Macro & Micro Strip */}
                        <div
                          className={`grid grid-cols-4 gap-1 p-2 rounded-xl text-center tabular-nums text-[10px] ${
                            darkMode ? 'bg-slate-900/70' : 'bg-white/90 border border-slate-200/60'
                          }`}
                        >
                          <div>
                            <b className="block text-xs font-mono text-emerald-600 dark:text-emerald-400">
                              {item.caloriesPer100g}
                            </b>
                            <span className="opacity-65">kcal</span>
                          </div>
                          <div>
                            <b className="block text-xs font-mono">
                              {item.proteinG !== undefined ? `${item.proteinG}g` : '—'}
                            </b>
                            <span className="opacity-65">{isBn ? 'প্রোটিন' : 'Prot'}</span>
                          </div>
                          <div>
                            <b className="block text-xs font-mono">
                              {item.carbsG !== undefined ? `${item.carbsG}g` : '—'}
                            </b>
                            <span className="opacity-65">{isBn ? 'কার্ব' : 'Carb'}</span>
                          </div>
                          <div>
                            <b className="block text-xs font-mono">
                              {item.fiberG !== undefined ? `${item.fiberG}g` : '—'}
                            </b>
                            <span className="opacity-65">{isBn ? 'ফাইবার' : 'Fibre'}</span>
                          </div>
                        </div>

                        {/* Functional V6 Badges */}
                        {item.functionalBadges && item.functionalBadges.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.functionalBadges.slice(0, 3).map((b, bIdx) => (
                              <span
                                key={bIdx}
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  darkMode
                                    ? 'bg-slate-800 text-slate-300 border border-slate-700'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200/80'
                                }`}
                              >
                                {b.icon} {b.label}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Clinical Reason */}
                        <p className="text-[11px] opacity-80 leading-relaxed">
                          {isBn ? item.clinicalReasonBn : item.clinicalReasonEn}
                        </p>
                      </div>

                      {/* Card Footer: Zone Label + BD FCT 26-Nutrient Popup Trigger */}
                      <div className="flex items-center justify-between text-[10px] pt-2 border-t border-slate-200/50 dark:border-slate-700/50 tabular-nums">
                        <span className="font-bold">
                          {item.zone === 'green'
                            ? isBn
                              ? '🟢 গ্রিন জোন (অবাধে)'
                              : '🟢 Green Zone'
                            : item.zone === 'yellow'
                            ? isBn
                              ? '🟡 ইয়েলো জোন (পরিমিত)'
                              : '🟡 Yellow Zone'
                            : isBn
                            ? '🔴 রেড জোন (বর্জনীয়)'
                            : '🔴 Red Zone'}
                        </span>

                        {item.bdFctCode ? (
                          <button
                            type="button"
                            onClick={(e) => handleOpenFoodDetail(e, item)}
                            className="px-2 py-0.5 rounded-md font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                          >
                            {isBn ? '🔬 পুষ্টিমান (BD FCT) ↗' : '🔬 BD FCT Info ↗'}
                          </button>
                        ) : (
                          <span className="opacity-60">100g edible</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* In-card Category Stepper & Final Generate Action Bar */}
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                <button
                  type="button"
                  onClick={() => goToStep('report')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold border ${
                    darkMode
                      ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  ← {isBn ? 'ক্লিনিক্যাল রিপোর্ট' : 'Report'}
                </button>

                {currentCatIndex < CATEGORIES.length - 1 && (
                  <button
                    type="button"
                    onClick={() => handleCategoryChange(CATEGORIES[currentCatIndex + 1])}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold border ${
                      darkMode
                        ? 'border-emerald-700 text-emerald-400 hover:bg-emerald-950/40'
                        : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    {isBn ? 'পরবর্তী ক্যাটাগরি →' : 'Next Category →'}
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleConfirmAndGenerate('meals')}
                  className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3.5 rounded-2xl font-bold text-xs md:text-sm tracking-wide transition-all shadow-lg active:scale-95 whitespace-nowrap"
                >
                  {isBn
                    ? `🥗 ডায়েট চার্ট দেখুন (${selectedFoods.length}টি খাবার) →`
                    : `🥗 View Diet Chart (${selectedFoods.length} foods) →`}
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmAndGenerate('supplements')}
                  className="px-4 py-3.5 rounded-2xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md whitespace-nowrap"
                >
                  💊 {isBn ? 'সাপ্লিমেন্ট' : 'Supplements'}
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmAndGenerate('exercise')}
                  className="px-4 py-3.5 rounded-2xl font-bold text-xs bg-teal-600 hover:bg-teal-500 text-white transition-all shadow-md whitespace-nowrap"
                >
                  🏃 {isBn ? 'এক্সারসাইজ' : 'Exercise'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* FLOATING STICKY ACTION BAR (NO SCROLLING NEEDED TO GO TO NEXT PAGE) */}
      {/* =================================================================== */}
      <div className="fixed bottom-16 md:bottom-4 left-1/2 -translate-x-1/2 z-40 w-[96%] max-w-5xl pointer-events-none">
        <div
          className={`pointer-events-auto p-2.5 md:p-3.5 rounded-2xl border shadow-2xl backdrop-blur-xl flex flex-wrap items-center justify-between gap-2 ${
            darkMode
              ? 'bg-slate-900/95 border-emerald-500/50 text-white'
              : 'bg-white/95 border-emerald-500/50 text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold font-mono">
              ✓ {isBn ? `${selectedFoods.length}টি খাবার নির্বাচিত` : `${selectedFoods.length} Selected`}
            </span>
            {screenStep === 'traffic_light' && currentCatIndex < CATEGORIES.length - 1 && (
              <button
                type="button"
                onClick={() => handleCategoryChange(CATEGORIES[currentCatIndex + 1])}
                className={`hidden sm:inline-flex px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {isBn ? 'পরবর্তী ক্যাটাগরি →' : 'Next Category →'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            {screenStep === 'report' && (
              <button
                type="button"
                onClick={() => goToStep('traffic_light')}
                className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm whitespace-nowrap"
              >
                🚦 {isBn ? 'ফুড গাইড' : 'Food Guide'}
              </button>
            )}
            <button
              type="button"
              onClick={() => handleConfirmAndGenerate('meals')}
              className="px-4 py-2 rounded-xl text-xs md:text-sm font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg whitespace-nowrap"
            >
              🥗 {isBn ? 'পরবর্তী পেজ: ডায়েট চার্ট দেখুন →' : 'Next Page: Diet Chart →'}
            </button>
            <button
              type="button"
              onClick={() => handleConfirmAndGenerate('supplements')}
              className={`px-3 py-2 rounded-xl text-xs font-extrabold border whitespace-nowrap transition-all ${
                darkMode
                  ? 'bg-slate-800 border-slate-700 text-indigo-300 hover:bg-slate-700'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              💊 {isBn ? 'সাপ্লিমেন্ট' : 'Supplements'}
            </button>
            <button
              type="button"
              onClick={() => handleConfirmAndGenerate('exercise')}
              className={`px-3 py-2 rounded-xl text-xs font-extrabold border whitespace-nowrap transition-all ${
                darkMode
                  ? 'bg-slate-800 border-slate-700 text-teal-300 hover:bg-slate-700'
                  : 'bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100'
              }`}
            >
              🏃 {isBn ? 'এক্সারসাইজ' : 'Exercise'}
            </button>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* MODAL: 26-NUTRIENT BD FCT & FUNCTIONAL V6 DETAIL POPUP              */}
      {/* =================================================================== */}
      {inspectingBdFood && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setInspectingBdFood(null)}
          />
          <div
            className={`relative w-full max-w-2xl max-h-[88vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden ${
              darkMode
                ? 'bg-slate-900 border-slate-700 text-white'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div
              className={`p-4 md:p-6 border-b flex items-center justify-between gap-3 ${
                darkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-2xl">
                  {inspectingBdFood.item.icon || '🥗'}
                </div>
                <div>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block">
                    {inspectingBdFood.item.bdSubCategoryBn} • BD FCT #{inspectingBdFood.item.bdFctCode}
                  </span>
                  <h3 className="text-lg md:text-xl font-bold leading-snug">
                    {isBn ? inspectingBdFood.item.nameBn : inspectingBdFood.item.nameEn}
                  </h3>
                  <p className="text-xs opacity-70">{inspectingBdFood.item.nameEn}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingBdFood(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white"
              >
                ✕ {isBn ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>

            <div className="p-5 md:p-6 overflow-y-auto space-y-5">
              {/* Clinical Reason Banner */}
              <div
                className={`p-4 rounded-2xl border ${
                  inspectingBdFood.item.zone === 'green'
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : inspectingBdFood.item.zone === 'yellow'
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                <div className="text-xs font-bold mb-1">
                  {inspectingBdFood.item.zone === 'green'
                    ? isBn
                      ? '🟢 গ্রিন জোন (আপনার জন্য আদর্শ পথ্য)'
                      : '🟢 Green Zone (Optimal for You)'
                    : inspectingBdFood.item.zone === 'yellow'
                    ? isBn
                      ? '🟡 ইয়েলো জোন (পরিমিত পোরশনে গ্রহণযোগ্য)'
                      : '🟡 Yellow Zone (Portion Controlled)'
                    : isBn
                    ? '🔴 রেড জোন (বর্জনীয়)'
                    : '🔴 Red Zone (Avoid)'}
                </div>
                <p className="text-xs leading-relaxed">
                  {isBn ? inspectingBdFood.item.clinicalReasonBn : inspectingBdFood.item.clinicalReasonEn}
                </p>
              </div>

              {/* 26 Official BD FCT Nutrients Table */}
              {inspectingBdFood.raw && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
                    {isBn
                      ? '📊 বাংলাদেশ ফুড কম্পোজিশন টেবিল (প্রতি ১০০ গ্রাম ভক্ষণযোগ্য অংশ)'
                      : '📊 Bangladesh Food Composition Table (Per 100g Edible Portion)'}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {BD_FCT_NUTRIENTS.map(([key, labelBn, labelEn, unit, icon]) => (
                      <div
                        key={key}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs tabular-nums ${
                          darkMode ? 'bg-slate-800/70 border-slate-700' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <span className="opacity-80 truncate pr-1">
                          {icon} {isBn ? labelBn : labelEn}
                        </span>
                        <b className="font-mono text-emerald-600 dark:text-emerald-400 shrink-0">
                          {fmtNutrient(inspectingBdFood.raw?.[key], 1, isBn)} {unit}
                        </b>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Functional Nutrition V6 Evidence Layer */}
              {inspectingBdFood.raw && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">
                    {isBn
                      ? '🧬 ফাংশনাল নিউট্রিশন এভিডেন্স লেয়ার (GI, FODMAP, Gluten, Purine, Oxalate)'
                      : '🧬 Functional Nutrition V6 Evidence Layer'}
                  </h4>
                  {(() => {
                    const ext = getExternalFunctionalProfile(inspectingBdFood.raw!);
                    const rows = [
                      ['📈', 'Glycemic Index (GI)', ext.gi.status, ext.gi.note],
                      ['🫘', 'FODMAP (Gut)', ext.fodmap.status, ext.fodmap.note],
                      ['🌾', 'Gluten Status', ext.gluten.status, ext.gluten.note],
                      ['🌙', 'Nightshade', ext.nightshade.status, ext.nightshade.note],
                      ['🧬', 'Purine (Uric Acid)', ext.purine.status, ext.purine.note],
                      ['💎', 'Oxalate (Kidney)', ext.oxalate.status, ext.oxalate.note],
                      ['🧪', 'Histamine / Allergy', ext.histamine.status, ext.histamine.note],
                    ];
                    return (
                      <div className="space-y-2">
                        {rows.map(([ic, title, status, note], rIdx) => (
                          <div
                            key={rIdx}
                            className={`p-3 rounded-xl border text-xs ${
                              darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between font-bold mb-0.5">
                              <span>
                                {ic} {title}
                              </span>
                              <span className="text-indigo-600 dark:text-indigo-400">{status}</span>
                            </div>
                            <p className="text-[11px] opacity-75">{note}</p>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              <p className="text-[11px] opacity-60 italic">
                {isBn ? BD_FCT_SOURCE_LINE_BN : BD_FCT_SOURCE_LINE_EN}
              </p>
            </div>

            <div
              className={`p-4 border-t flex items-center justify-between gap-3 ${
                darkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'
              }`}
            >
              {inspectingBdFood.item.zone !== 'red' ? (
                <button
                  type="button"
                  onClick={() => {
                    toggleFoodSelection(inspectingBdFood.item);
                    setInspectingBdFood(null);
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  {selectedFoods.includes(inspectingBdFood.item.id)
                    ? isBn
                      ? '✓ ডায়েট চার্টে নির্বাচিত (বাদ দিতে ক্লিক করুন)'
                      : '✓ Selected in Diet Chart (Tap to Remove)'
                    : isBn
                    ? '+ ডায়েট চার্টে যুক্ত করুন'
                    : '+ Add to My Diet Chart'}
                </button>
              ) : (
                <span className="text-xs font-bold text-red-500">
                  {isBn ? '🔴 রেড জোন খাবার ডায়েট চার্টে নিষিদ্ধ' : '🔴 Red Zone food restricted'}
                </span>
              )}
              <button
                type="button"
                onClick={() => setInspectingBdFood(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700"
              >
                {isBn ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisReport;
