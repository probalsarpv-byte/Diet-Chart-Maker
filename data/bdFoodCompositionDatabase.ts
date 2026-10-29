import {
  FoodCategory,
  FoodExchangeRow,
  HealthProfile,
  TrafficLightFoodItem,
  TrafficLightGuide,
  TrafficLightZone,
} from '../types';
import { BD_FCT_RAW_FOODS, BdFctFoodRecord } from './bdFctRawFoods';

export { BD_FCT_RAW_FOODS };
export type { BdFctFoodRecord };

export interface BdFctCategoryDef {
  id: string;
  nameBn: string;
  nameEn: string;
  icon: string;
  clinicalCategory: FoodCategory;
  virtual?: boolean;
}

export type HealthLensKey =
  | 'diabetes'
  | 'hypertension'
  | 'ckd'
  | 'iron'
  | 'bone'
  | 'weight'
  | 'celiac'
  | 'constipation';

export interface HealthLensDef {
  id: HealthLensKey;
  nameBn: string;
  nameEn: string;
  icon: string;
}

export interface ExternalEvidenceSource {
  name: string;
  url: string;
}

export interface FunctionalMetricItem {
  status: string;
  className: string;
  value?: number | null;
  note: string;
  source: ExternalEvidenceSource;
}

export interface ExternalFunctionalProfile {
  gluten: FunctionalMetricItem;
  nightshade: FunctionalMetricItem;
  fodmap: FunctionalMetricItem;
  gi: FunctionalMetricItem;
  purine: FunctionalMetricItem;
  oxalate: FunctionalMetricItem;
  histamine: FunctionalMetricItem;
}

export const BD_FCT_SOURCE_LINE_BN =
  'উৎস: Food Composition Table for Bangladesh (2013), INFS / CARS, University of Dhaka (প্রতি ১০০ গ্রাম ভক্ষণযোগ্য অংশ)';
export const BD_FCT_SOURCE_LINE_EN =
  'Source: Food Composition Table for Bangladesh (2013), INFS / CARS, University of Dhaka (Per 100g edible portion)';

export const BD_FCT_EXT_SOURCES: Record<string, ExternalEvidenceSource> = {
  gi: {
    name: 'University of Sydney GI Database / International GI Tables 2021',
    url: 'https://glycemicindex.com/',
  },
  fodmap: {
    name: 'Monash University Low FODMAP Public Food Guidance',
    url: 'https://www.monashfodmap.com/',
  },
  gluten: {
    name: 'NIDDK Celiac Disease & Gluten-Free Diet Guidance',
    url: 'https://www.niddk.nih.gov/',
  },
  purine: {
    name: 'USDA / NIH 2025 Purine Analytical Dataset',
    url: 'https://www.ars.usda.gov/',
  },
  oxalate: {
    name: 'Peer-Reviewed Clinical Oxalate Variability Review (2014)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/',
  },
  histamine: {
    name: 'EFSA / Clinical Biogenic Amine & Histamine Guidance',
    url: 'https://www.efsa.europa.eu/',
  },
  nightshade: {
    name: 'Botanical Solanaceae Identity Mapping',
    url: 'https://www.britannica.com/plant/Solanaceae',
  },
};

export const BD_FCT_NUTRIENTS: [string, string, string, string, string][] = [
  ['energy_kcal', 'ক্যালরি', 'Energy', 'kcal', '🔥'],
  ['protein_g', 'প্রোটিন', 'Protein', 'g', '💪'],
  ['fat_g', 'ফ্যাট', 'Fat', 'g', '🥑'],
  ['carb_g', 'কার্বোহাইড্রেট', 'Carbohydrate', 'g', '⚡'],
  ['fibre_g', 'ডায়েটারি ফাইবার', 'Dietary Fibre', 'g', '🌿'],
  ['water_g', 'পানি', 'Water', 'g', '💧'],
  ['calcium_mg', 'ক্যালসিয়াম', 'Calcium', 'mg', '🦴'],
  ['iron_mg', 'আয়রন', 'Iron', 'mg', '🩸'],
  ['magnesium_mg', 'ম্যাগনেসিয়াম', 'Magnesium', 'mg', '✨'],
  ['phosphorus_mg', 'ফসফরাস', 'Phosphorus', 'mg', '🧪'],
  ['potassium_mg', 'পটাশিয়াম', 'Potassium', 'mg', '💓'],
  ['sodium_mg', 'সোডিয়াম', 'Sodium', 'mg', '🧂'],
  ['zinc_mg', 'জিঙ্ক', 'Zinc', 'mg', '🛡️'],
  ['copper_mg', 'কপার', 'Copper', 'mg', '🔸'],
  ['vitamin_a_mcg', 'ভিটামিন A', 'Vitamin A', 'µg', '👁️'],
  ['retinol_mcg', 'রেটিনল', 'Retinol', 'µg', '🟡'],
  ['beta_carotene_mcg', 'বিটা-ক্যারোটিন', 'Beta-Carotene', 'µg', '🥕'],
  ['vitamin_d_mcg', 'ভিটামিন D', 'Vitamin D', 'µg', '☀️'],
  ['vitamin_e_mg', 'ভিটামিন E', 'Vitamin E', 'mg', '🌻'],
  ['thiamin_mg', 'থায়ামিন (B1)', 'Thiamin (B1)', 'mg', 'B1'],
  ['riboflavin_mg', 'রিবোফ্লাভিন (B2)', 'Riboflavin (B2)', 'mg', 'B2'],
  ['niacin_mg', 'নায়াসিন (B3)', 'Niacin (B3)', 'mg', 'B3'],
  ['vitamin_b6_mg', 'ভিটামিন B6', 'Vitamin B6', 'mg', 'B6'],
  ['folate_mcg', 'ফোলেট (B9)', 'Folate (B9)', 'µg', '🍃'],
  ['vitamin_c_mg', 'ভিটামিন C', 'Vitamin C', 'mg', '🍊'],
];

export const BD_FCT_CATEGORIES: BdFctCategoryDef[] = [
  { id: 'all', nameBn: 'সব খাবার (৩৮১+)', nameEn: 'All Foods (381+)', icon: '✨', clinicalCategory: 'Proteins' },
  { id: '01', nameBn: 'শস্য ও শস্যজাত', nameEn: 'Cereals & Grains', icon: '🌾', clinicalCategory: 'Grains & Carbs' },
  { id: '02', nameBn: 'ডাল ও লেগিউম', nameEn: 'Pulses & Legumes', icon: '🫘', clinicalCategory: 'Proteins' },
  { id: '03', nameBn: 'সবজি', nameEn: 'Vegetables', icon: '🥒', clinicalCategory: 'Vegetables & Greens' },
  { id: '04', nameBn: 'শাকপাতা', nameEn: 'Leafy Vegetables', icon: '🥬', clinicalCategory: 'Vegetables & Greens' },
  { id: '05', nameBn: 'মূল ও কন্দজাত', nameEn: 'Starchy Roots & Tubers', icon: '🥔', clinicalCategory: 'Grains & Carbs' },
  { id: '06', nameBn: 'বাদাম ও বীজ', nameEn: 'Nuts & Seeds', icon: '🥜', clinicalCategory: 'Healthy Fats & Seeds' },
  { id: '07', nameBn: 'মসলা ও হার্বস', nameEn: 'Spices & Herbs', icon: '🌿', clinicalCategory: 'Healthy Fats & Seeds' },
  { id: '08', nameBn: 'ফলমূল', nameEn: 'Fruits', icon: '🍎', clinicalCategory: 'Fruits & Snacks' },
  {
    id: 'fish_fresh',
    nameBn: 'মিঠাপানি / দেশীয় মাছ',
    nameEn: 'Freshwater & Indigenous Fish',
    icon: '🐟',
    clinicalCategory: 'Proteins',
    virtual: true,
  },
  {
    id: 'fish_marine',
    nameBn: 'সামুদ্রিক মাছ ও চিংড়ি',
    nameEn: 'Marine Fish & Shellfish',
    icon: '🦐',
    clinicalCategory: 'Proteins',
    virtual: true,
  },
  { id: '10', nameBn: 'মাংস ও পোল্ট্রি', nameEn: 'Meat & Poultry', icon: '🍗', clinicalCategory: 'Proteins' },
  { id: '11', nameBn: 'ডিম', nameEn: 'Eggs', icon: '🥚', clinicalCategory: 'Proteins' },
  { id: '12', nameBn: 'দুধ ও দুগ্ধজাত', nameEn: 'Milk & Dairy', icon: '🥛', clinicalCategory: 'Proteins' },
  { id: '13', nameBn: 'তেল ও চর্বি', nameEn: 'Fats & Oils', icon: '🫒', clinicalCategory: 'Healthy Fats & Seeds' },
  { id: '14', nameBn: 'পানীয়', nameEn: 'Beverages', icon: '🥤', clinicalCategory: 'Fruits & Snacks' },
  { id: '15', nameBn: 'বিবিধ', nameEn: 'Miscellaneous', icon: '🍽️', clinicalCategory: 'Fruits & Snacks' },
];

export const BD_FCT_HEALTH_LENSES: Record<HealthLensKey, HealthLensDef> = {
  diabetes: { id: 'diabetes', nameBn: 'ডায়াবেটিস ও ইনসুলিন', nameEn: 'Diabetes & Insulin', icon: '🩺' },
  hypertension: { id: 'hypertension', nameBn: 'উচ্চ রক্তচাপ (BP)', nameEn: 'Hypertension (BP)', icon: '❤️' },
  ckd: { id: 'ckd', nameBn: 'কিডনি / CKD', nameEn: 'Kidney / CKD', icon: '🫘' },
  iron: { id: 'iron', nameBn: 'আয়রন ও রক্তস্বল্পতা', nameEn: 'Iron & Anemia', icon: '🩸' },
  bone: { id: 'bone', nameBn: 'হাড় ও ক্যালসিয়াম', nameEn: 'Bone & Calcium', icon: '🦴' },
  weight: { id: 'weight', nameBn: 'ওজন ও ফ্যাটি লিভার', nameEn: 'Weight & Fatty Liver', icon: '⚖️' },
  celiac: { id: 'celiac', nameBn: 'গ্লুটেন / সিলিয়াক', nameEn: 'Gluten / Celiac', icon: '🌾' },
  constipation: { id: 'constipation', nameBn: 'কোষ্ঠকাঠিন্য ও গাট ফাইবার', nameEn: 'Constipation & Fibre', icon: '🌿' },
};

const CANONICAL_NAMES: Record<string, { bn: string; en: string }> = {
  '03_0004': { bn: 'বিটরুট (Beetroot)', en: 'Beetroot, red, raw' },
  '01_0001': { bn: 'যব, গোটা (Whole Barley)', en: 'Barley, whole-grain, raw' },
  '01_0004': { bn: 'ভুট্টার আটা (Corn Flour)', en: 'Maize/Corn flour, whole, white' },
  '01_0005': { bn: 'ভুট্টা, শুকনা (Sweet Corn/Maize)', en: 'Maize/Corn, yellow, dried, raw' },
  '02_0015': { bn: 'মসুর ডাল সিদ্ধ (লবণ ছাড়া)', en: 'Lentils (Masoor Dal), boiled without salt' },
  '09_0005': { bn: 'সরপুঁটি মাছ (Sarpunti)', en: 'Olive barb / Sarpunti, raw' },
  '09_0033': { bn: 'ইলিশ মাছ (Hilsa)', en: 'Hilsa, raw' },
  '09_0059': { bn: 'রুই মাছ (Rohu)', en: 'Rohu, raw' },
};

const ALIASES: Record<string, string[]> = {
  mosur: ['lentil', 'masur', 'মসুর', 'মশুর'],
  মসুর: ['lentil', 'mosur', 'masur', 'মশুর'],
  dal: ['ডাল', 'lentil', 'pulse'],
  ডাল: ['dal', 'lentil', 'pulse'],
  alu: ['potato', 'আলু'],
  আলু: ['potato', 'alu'],
  begun: ['brinjal', 'eggplant', 'বেগুন'],
  বেগুন: ['brinjal', 'eggplant', 'begun'],
  tomato: ['টমেটো'],
  টমেটো: ['tomato'],
  potol: ['pointed gourd', 'পটল'],
  পটল: ['pointed gourd', 'potol'],
  lau: ['bottle gourd', 'লাউ'],
  লাউ: ['bottle gourd', 'lau'],
  kumra: ['pumpkin', 'কুমড়া', 'কুমড়া'],
  কুমড়া: ['pumpkin', 'kumra'],
  rui: ['rohu', 'রুই'],
  রুই: ['rohu', 'rui'],
  katla: ['catla', 'কাতলা'],
  কাতলা: ['catla', 'katla'],
  ilish: ['hilsa', 'ইলিশ'],
  ইলিশ: ['hilsa', 'ilish'],
  chingri: ['shrimp', 'prawn', 'চিংড়ি', 'চিংড়ি'],
  চিংড়ি: ['shrimp', 'prawn', 'chingri'],
  chal: ['rice', 'চাল'],
  চাল: ['rice', 'chal'],
  bhat: ['rice boiled', 'ভাত'],
  ভাত: ['rice boiled', 'bhat'],
  ata: ['wheat flour', 'আটা'],
  আটা: ['wheat flour', 'atta'],
  ruti: ['roti', 'chapati', 'রুটি'],
  রুটি: ['roti', 'chapati', 'ruti'],
  dudh: ['milk', 'দুধ'],
  দুধ: ['milk', 'dudh'],
  dim: ['egg', 'ডিম'],
  ডিম: ['egg', 'dim'],
  kola: ['banana', 'কলা'],
  কলা: ['banana', 'kola'],
  peyara: ['guava', 'পেয়ারা', 'পেয়ারা'],
  পেয়ারা: ['guava', 'peyara'],
  komola: ['orange', 'কমলা'],
  কমলা: ['orange', 'komola'],
  am: ['mango', 'আম'],
  আম: ['mango', 'aam'],
  papaya: ['পেঁপে', 'pepe'],
  পেঁপে: ['papaya', 'pepe'],
  palong: ['spinach', 'পালং'],
  পালং: ['spinach', 'palong'],
  shak: ['শাক', 'leafy vegetable'],
  শাক: ['shak', 'leafy vegetable'],
};

export function hasNum(v: unknown): boolean {
  return v !== undefined && v !== null && v !== '' && v !== 'Tr' && !Number.isNaN(Number(v));
}

export function nval(v: unknown): number | null {
  return hasNum(v) ? Number(v) : null;
}

export function fmtNutrient(v: unknown, decimals = 1, isBn = true): string {
  if (!hasNum(v)) return '—';
  const num = Number(v);
  return num.toLocaleString(isBn ? 'bn-BD' : 'en-US', {
    maximumFractionDigits: decimals,
  });
}

export function getBdFoodNameBn(f: BdFctFoodRecord): string {
  const c = CANONICAL_NAMES[f.code];
  const raw =
    (c && c.bn) ||
    f.name_bn ||
    f.bangla_name ||
    f.bengali ||
    f.english_name ||
    f.english ||
    f.code ||
    'খাবার';
  return String(raw).replace(/\s+/g, ' ').replace(/^[-,\s]+|[-,\s]+$/g, '').trim();
}

export function getBdFoodNameEn(f: BdFctFoodRecord): string {
  const c = CANONICAL_NAMES[f.code];
  const raw = (c && c.en) || f.name_en || f.english_name || f.english || '';
  return String(raw).replace(/\s+/g, ' ').replace(/^[-,\s]+|[-,\s]+$/g, '').trim();
}

function norm(s: unknown): string {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(s: unknown): string[] {
  return norm(s).split(' ').filter(Boolean);
}

function extHas(hay: string, words: string[]): boolean {
  return words.some((w) => hay.includes(norm(w)));
}

export function searchHay(f: BdFctFoodRecord): string {
  return norm([f.code, getBdFoodNameEn(f), getBdFoodNameBn(f), f.bengali_roman, f.scientific, f.category_bn, f.category].join(' '));
}

export function isMarineFish(f: BdFctFoodRecord): boolean {
  if ((f.code || '').slice(0, 2) !== '09') return false;
  const h = searchHay(f);
  const marine = [
    'pomfret',
    'tuna',
    'mackerel',
    'sardine',
    'shark',
    'sea',
    'marine',
    'oyster',
    'mussel',
    'clam',
    'crab',
    'lobster',
    'shrimp',
    'prawn',
    'hilsa',
    'ilish',
    'ইলিশ',
    'চিংড়ি',
    'চিংড়ি',
    'রূপচাঁদা',
    'লইট্টা',
    'ছুরি',
    'কোরাল',
    'ভেটকি',
  ];
  return marine.some((x) => h.includes(norm(x)));
}

export function getBdSubCategoryId(f: BdFctFoodRecord): string {
  const prefix = (f.code || '').slice(0, 2);
  if (prefix === '09') {
    return isMarineFish(f) ? 'fish_marine' : 'fish_fresh';
  }
  return prefix;
}

export function matchBdCategory(f: BdFctFoodRecord, categoryId: string): boolean {
  if (!categoryId || categoryId === 'all') return true;
  if (categoryId === 'fish_marine') return isMarineFish(f);
  if (categoryId === 'fish_fresh') return (f.code || '').slice(0, 2) === '09' && !isMarineFish(f);
  return (f.code || '').slice(0, 2) === categoryId;
}

export function getClinicalCategoryForBdFood(f: BdFctFoodRecord): FoodCategory {
  const prefix = (f.code || '').slice(0, 2);
  switch (prefix) {
    case '02':
    case '09':
    case '10':
    case '11':
    case '12':
      return 'Proteins';
    case '03':
    case '04':
      return 'Vegetables & Greens';
    case '01':
    case '05':
      return 'Grains & Carbs';
    case '06':
    case '07':
    case '13':
      return 'Healthy Fats & Seeds';
    case '08':
    case '14':
    case '15':
    default:
      return 'Fruits & Snacks';
  }
}

export function getExternalFunctionalProfile(f: BdFctFoodRecord): ExternalFunctionalProfile {
  const h = searchHay(f);
  const prefix = (f.code || '').slice(0, 2);

  const out: ExternalFunctionalProfile = {
    gluten: {
      status: 'Naturally gluten-free group',
      className: 'low',
      note: 'Cross-contact or added flour ingredients are evaluated separately.',
      source: BD_FCT_EXT_SOURCES.gluten,
    },
    nightshade: {
      status: 'No',
      className: 'low',
      note: 'Not in Solanaceae nightshade botanical group.',
      source: BD_FCT_EXT_SOURCES.nightshade,
    },
    fodmap: {
      status: 'Serving-dependent / Not mapped',
      className: 'neutral',
      note: 'Monash FODMAP ratings depend on exact serving weight and preparation.',
      source: BD_FCT_EXT_SOURCES.fodmap,
    },
    gi: {
      status: 'Low-to-moderate / Group reference',
      value: null,
      className: 'Low-Moderate',
      note: 'Glycemic index depends on botanical variety, processing, and cooking method.',
      source: BD_FCT_EXT_SOURCES.gi,
    },
    purine: {
      status: 'Low purine food group',
      className: 'low',
      note: 'Plant/non-meat foods generally have lower bioavailable purine load.',
      source: BD_FCT_EXT_SOURCES.purine,
    },
    oxalate: {
      status: 'Moderate / Variable',
      className: 'neutral',
      note: 'Boiling and discarding cooking water reduces soluble oxalate load.',
      source: BD_FCT_EXT_SOURCES.oxalate,
    },
    histamine: {
      status: 'Low when fresh',
      className: 'low',
      note: 'Consume fresh; prolonged storage or fermentation elevates biogenic amines.',
      source: BD_FCT_EXT_SOURCES.histamine,
    },
  };

  if (extHas(h, ['wheat', 'barley', 'semolina', 'bread', 'biscuit', 'ata', 'maida', 'suji', 'গম', 'যব', 'আটা', 'ময়দা', 'ময়দা', 'রুটি', 'পাউরুটি', 'বিস্কুট', 'সুজি', 'সেমাই'])) {
    out.gluten = {
      status: 'Contains Gluten (Wheat/Barley)',
      className: 'high',
      note: 'Contains gluten proteins (gliadin/hordein); strictly avoid in Celiac disease or non-celiac gluten sensitivity.',
      source: BD_FCT_EXT_SOURCES.gluten,
    };
  }

  if (extHas(h, ['tomato', 'টমেটো', 'potato', 'আলু', 'brinjal', 'eggplant', 'aubergine', 'বেগুন', 'chilli', 'chili', 'pepper', 'capsicum', 'মরিচ', 'ক্যাপসিকাম'])) {
    out.nightshade = {
      status: 'Yes (Solanaceae Nightshade)',
      className: 'info',
      note: 'Contains solanine/capsaicin alkaloids; monitor tolerance in autoimmune joint pain or mucosal sensitivity.',
      source: BD_FCT_EXT_SOURCES.nightshade,
    };
  }

  const fodLow = [
    'eggplant', 'aubergine', 'green bean', 'bok choy', 'green capsicum', 'carrot', 'cucumber',
    'lettuce', 'potato', 'orange', 'pineapple', 'kiwi', 'mandarin', 'blueberry', 'peanut',
    'pumpkin seed', 'walnut', 'egg', 'bottle gourd', 'লাউ', 'পেঁপে', 'পটল', 'ঝিঙে', 'চালকুমড়া', 'শসা', 'গাজর', 'পালং', 'লাল শাক',
  ];
  const fodHigh = [
    'artichoke', 'asparagus', 'garlic', 'green pea', 'leek', 'mushroom', 'onion', 'red capsicum',
    'apple', 'cherry', 'dried fruit', 'mango', 'nectarine', 'peach', 'pear', 'plum', 'watermelon',
    'cashew', 'pistachio', 'honey', 'রসুন', 'পেঁয়াজ', 'পেঁয়াজ', 'মটর', 'আপেল', 'আম', 'তরমুজ', 'কাজুবাদাম', 'মধু', 'কাঁঠাল',
  ];

  if (extHas(h, fodLow)) {
    out.fodmap = {
      status: 'Low FODMAP Option',
      className: 'low',
      note: 'Gentle on IBS and gut fermentation in standard clinical portions.',
      source: BD_FCT_EXT_SOURCES.fodmap,
    };
  }
  if (extHas(h, fodHigh)) {
    out.fodmap = {
      status: 'Higher FODMAP Example',
      className: 'high',
      note: 'Contains fermentable oligosaccharides/fructose/polyols; control portion in active IBS or bloating.',
      source: BD_FCT_EXT_SOURCES.fodmap,
    };
  }
  if (prefix === '02' && out.fodmap.className === 'neutral') {
    out.fodmap = {
      status: 'Moderate-High FODMAP (Soak & Boil)',
      className: 'warn',
      note: 'Legumes contain galacto-oligosaccharides (GOS); soaking overnight and cooking with ginger/asafoetida improves digestibility.',
      source: BD_FCT_EXT_SOURCES.fodmap,
    };
  }
  if (prefix === '09' || prefix === '10' || prefix === '11') {
    out.fodmap = {
      status: 'Zero/Low FODMAP Protein',
      className: 'low',
      note: 'Plain fish, poultry, and eggs are naturally free of fermentable carbohydrates.',
      source: BD_FCT_EXT_SOURCES.fodmap,
    };
  }
  if (prefix === '12' && extHas(h, ['milk', 'yoghurt', 'yogurt', 'custard', 'ice cream', 'condensed milk', 'দুধ', 'দই', 'ক্ষীর', 'পায়েস'])) {
    out.fodmap = {
      status: 'Contains Lactose (FODMAP Disaccharide)',
      className: 'warn',
      note: 'Sour curd (টক দই) has lower lactose due to fermentation compared to plain milk.',
      source: BD_FCT_EXT_SOURCES.fodmap,
    };
  }

  if (/bread, white|white bread|পাউরুটি|বিস্কুট|মুড়ি|চিড়া|চিনি|গুড়|মধু/.test(h)) {
    out.gi = {
      status: 'High GI (~70-85)',
      value: 75,
      className: 'High',
      note: 'Rapidly absorbed carbohydrate; triggers post-prandial glucose and insulin spike.',
      source: BD_FCT_EXT_SOURCES.gi,
    };
  } else if (/brown rice|লাল চাল|ঢেঁকি|যব|barley|oats|ওটস|কাউন/.test(h)) {
    out.gi = {
      status: 'Low-Medium GI (~50-59)',
      value: 55,
      className: 'Low-Medium',
      note: 'Intact bran fiber slows gastric emptying and blunts glycemic excursion.',
      source: BD_FCT_EXT_SOURCES.gi,
    };
  } else if (/white rice|rice, white|চাল|ভাত|পোলাও/.test(h)) {
    out.gi = {
      status: 'Medium-High GI (Variety Dependent)',
      value: 68,
      className: 'High/Variable',
      note: 'Parboiled rice paired with fiber, dal, and fish lowers overall meal glycemic load.',
      source: BD_FCT_EXT_SOURCES.gi,
    };
  } else if (/potato|আলু/.test(h)) {
    out.gi = {
      status: 'Often High GI',
      value: 72,
      className: 'High',
      note: 'Cooling boiled potatoes increases resistant starch, but diabetics should still restrict portion.',
      source: BD_FCT_EXT_SOURCES.gi,
    };
  } else if (prefix === '02' || prefix === '03' || prefix === '04') {
    out.gi = {
      status: 'Low GI Food Group (<40)',
      value: 30,
      className: 'Low',
      note: 'High viscous and insoluble fiber keeps glycemic impact minimal.',
      source: BD_FCT_EXT_SOURCES.gi,
    };
  }

  if (prefix === '09' || prefix === '10') {
    out.purine = {
      status: 'Category Reference: 96–448 mg/100g',
      className: 'moderate-high',
      note: 'USDA/NIH 2025 reference range for fish and meats; limit dried fish, organ meats, and red meat if uric acid is elevated.',
      source: BD_FCT_EXT_SOURCES.purine,
    };
  }

  if (extHas(h, ['spinach', 'পালং', 'কচু', 'পুঁই', 'beet', 'বিটরুট'])) {
    out.oxalate = {
      status: 'Higher Oxalate Group (364–1145 mg/100g)',
      className: 'high/variable',
      note: 'In calcium-oxalate kidney stone formers, pair with calcium or boil and discard excess water.',
      source: BD_FCT_EXT_SOURCES.oxalate,
    };
  }

  if (extHas(h, ['fermented', 'pickle', 'yogurt', 'yoghurt', 'cheese', 'dried fish', 'smoked fish', 'shrimp', 'prawn', 'hilsa', 'ilish', 'শুঁটকি', 'আচার', 'দই', 'পনির', 'চিংড়ি', 'ইলিশ', 'বেগুন'])) {
    out.histamine = {
      status: 'Histamine / Allergy Caution',
      className: 'warn',
      note: 'Can trigger histamine release or allergic flare in urticaria, eczema, or sinusitis-prone patients.',
      source: BD_FCT_EXT_SOURCES.histamine,
    };
  }

  return out;
}

export function getFoodFlags(f: BdFctFoodRecord): { key: string; label: string; icon: string }[] {
  const h = searchHay(f);
  const p = nval(f.protein_g);
  const fib = nval(f.fibre_g);
  const fe = nval(f.iron_mg);
  const ca = nval(f.calcium_mg);
  const vitc = nval(f.vitamin_c_mg);
  const na = nval(f.sodium_mg);
  const flags: { key: string; label: string; icon: string }[] = [];

  if (p !== null && p >= 10) flags.push({ key: 'protein', label: 'HIGH PROTEIN', icon: '💪' });
  if (fib !== null && fib >= 5) flags.push({ key: 'fibre', label: 'HIGH FIBRE', icon: '🌿' });
  if (fe !== null && fe >= 3) flags.push({ key: 'iron', label: 'IRON RICH', icon: '🩸' });
  if (ca !== null && ca >= 100) flags.push({ key: 'calcium', label: 'CALCIUM RICH', icon: '🦴' });
  if (vitc !== null && vitc >= 30) flags.push({ key: 'vitc', label: 'VIT C RICH', icon: '🍊' });
  if (na !== null && na <= 100) flags.push({ key: 'lowsodium', label: 'LOW SODIUM', icon: '🧂' });
  if (na !== null && na >= 400) flags.push({ key: 'highsodium', label: 'HIGH SODIUM', icon: '⚠️' });
  if (/whole|brown|লাল|ঢেঁকি|যব/.test(h)) flags.push({ key: 'wholegrain', label: 'WHOLE GRAIN', icon: '🌾' });

  const ext = getExternalFunctionalProfile(f);
  if (ext.gi.className) flags.push({ key: 'gi', label: `GI: ${ext.gi.className}`, icon: '📈' });
  if (ext.fodmap.className === 'low') flags.push({ key: 'fodmap', label: 'LOW FODMAP', icon: '🫘' });
  if (ext.gluten.className === 'high') flags.push({ key: 'gluten', label: 'GLUTEN', icon: '🌾' });
  if (ext.nightshade.status.startsWith('Yes')) flags.push({ key: 'nightshade', label: 'NIGHTSHADE', icon: '🌙' });

  return flags;
}

export function getHealthLensCue(
  f: BdFctFoodRecord,
  lens: HealthLensKey,
  isBn = true
): { symbol: string; text: string; tone: 'good' | 'warn' | 'bad' | 'neutral' } {
  const carb = nval(f.carb_g);
  const fib = nval(f.fibre_g);
  const kcal = nval(f.energy_kcal);
  const na = nval(f.sodium_mg);
  const k = nval(f.potassium_mg);
  const ph = nval(f.phosphorus_mg);
  const fe = nval(f.iron_mg);
  const ca = nval(f.calcium_mg);

  if (lens === 'diabetes') {
    if (carb === null) return { symbol: '○', text: isBn ? 'কার্বোহাইড্রেট ডেটা নেই' : 'No carb data', tone: 'neutral' };
    if (fib !== null && fib >= 5 && carb <= 30)
      return { symbol: '✓', text: isBn ? 'উচ্চ ফাইবার ও সুগার-বান্ধব' : 'High fibre, glycemic friendly', tone: 'good' };
    if (carb >= 35)
      return { symbol: '⚠', text: isBn ? `কার্বোহাইড্রেট বেশি (${carb}g); পরিমিত খান` : `High carb (${carb}g); control portion`, tone: 'warn' };
    return { symbol: '✓', text: isBn ? `কার্ব ${carb}g/100g — পরিমিত গ্রহণযোগ্য` : `Carb ${carb}g/100g — moderate`, tone: 'good' };
  }

  if (lens === 'hypertension') {
    if (na === null) return { symbol: '○', text: isBn ? 'সোডিয়াম ডেটা নেই' : 'No sodium data', tone: 'neutral' };
    if (na <= 120) return { symbol: '✓', text: isBn ? `কম সোডিয়াম (${na}mg) — BP বান্ধব` : `Low sodium (${na}mg) — BP safe`, tone: 'good' };
    if (na >= 400) return { symbol: '✕', text: isBn ? `উচ্চ সোডিয়াম (${na}mg) — বর্জনীয়` : `High sodium (${na}mg) — avoid`, tone: 'bad' };
    return { symbol: '○', text: isBn ? `মাঝারি সোডিয়াম (${na}mg)` : `Moderate sodium (${na}mg)`, tone: 'neutral' };
  }

  if (lens === 'ckd') {
    if ((k ?? 0) >= 350 || (ph ?? 0) >= 250 || (na ?? 0) >= 400) {
      return {
        symbol: '⚠',
        text: isBn
          ? `K: ${k ?? '—'}mg · P: ${ph ?? '—'}mg — কিডনি রোগে সতর্কতা`
          : `K: ${k ?? '—'}mg · P: ${ph ?? '—'}mg — CKD caution`,
        tone: 'warn',
      };
    }
    return {
      symbol: '✓',
      text: isBn ? `তুলনামূলক কম পটাশিয়াম/ফসফরাস` : `Moderate K/P renal profile`,
      tone: 'good',
    };
  }

  if (lens === 'iron') {
    if (fe === null) return { symbol: '○', text: isBn ? 'আয়রন ডেটা নেই' : 'No iron data', tone: 'neutral' };
    if (fe >= 3) return { symbol: '✓', text: isBn ? `উচ্চ আয়রন (${fe} mg/100g)` : `High Iron (${fe} mg/100g)`, tone: 'good' };
    return { symbol: '○', text: isBn ? `${fe} mg আয়রন / 100g` : `${fe} mg Iron / 100g`, tone: 'neutral' };
  }

  if (lens === 'bone') {
    if (ca === null) return { symbol: '○', text: isBn ? 'ক্যালসিয়াম ডেটা নেই' : 'No calcium data', tone: 'neutral' };
    if (ca >= 100) return { symbol: '✓', text: isBn ? `ক্যালসিয়াম সমৃদ্ধ (${ca} mg/100g)` : `Calcium Rich (${ca} mg/100g)`, tone: 'good' };
    return { symbol: '○', text: isBn ? `${ca} mg ক্যালসিয়াম / 100g` : `${ca} mg Calcium / 100g`, tone: 'neutral' };
  }

  if (lens === 'weight') {
    if (kcal === null) return { symbol: '○', text: isBn ? 'ক্যালরি ডেটা নেই' : 'No calorie data', tone: 'neutral' };
    if (kcal <= 110 && (fib ?? 0) >= 1.8)
      return { symbol: '✓', text: isBn ? 'কম ক্যালরি ও ফাইবার সমৃদ্ধ' : 'Low energy density + fibre', tone: 'good' };
    if (kcal >= 380)
      return { symbol: '⚠', text: isBn ? `উচ্চ ক্যালরি (${kcal} kcal); পরিমিত খান` : `Energy dense (${kcal} kcal); portion control`, tone: 'warn' };
    return { symbol: '○', text: isBn ? `${kcal} kcal / 100g` : `${kcal} kcal / 100g`, tone: 'neutral' };
  }

  if (lens === 'celiac') {
    const g = getExternalFunctionalProfile(f).gluten;
    if (g.className === 'high') return { symbol: '✕', text: isBn ? 'গ্লুটেন যুক্ত — বর্জনীয়' : g.status, tone: 'bad' };
    return { symbol: '✓', text: isBn ? 'প্রাকৃতিকভাবে গ্লুটেন-মুক্ত' : 'Naturally gluten-free', tone: 'good' };
  }

  if (lens === 'constipation') {
    if (fib === null) return { symbol: '○', text: isBn ? 'ফাইবার ডেটা নেই' : 'No fibre data', tone: 'neutral' };
    if (fib >= 4) return { symbol: '✓', text: isBn ? `উচ্চ ফাইবার (${fib}g/100g) — অন্ত্র পরিষ্কারক` : `High fibre (${fib}g/100g)`, tone: 'good' };
    return { symbol: '○', text: isBn ? `${fib}g ফাইবার / 100g` : `${fib}g fibre / 100g`, tone: 'neutral' };
  }

  return { symbol: '○', text: '', tone: 'neutral' };
}

function editDistance(a: string, b: string): number {
  const s1 = norm(a);
  const s2 = norm(b);
  if (!s1) return s2.length;
  if (!s2) return s1.length;
  const prev = Array.from({ length: s2.length + 1 }, (_, i) => i);
  for (let i = 1; i <= s1.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= s2.length; j++) {
      const old = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (s1[i - 1] === s2[j - 1] ? 0 : 1));
      diag = old;
    }
  }
  return prev[s2.length];
}

function fuzzyTokenMatch(qt: string, word: string): boolean {
  if (qt.length < 2) return false;
  if (word.startsWith(qt) || word.includes(qt)) return true;
  const maxDist = qt.length <= 4 ? 1 : 2;
  return editDistance(qt, word) <= maxDist;
}

export function scoreBdFoodSearch(f: BdFctFoodRecord, query: string): number {
  const nq = norm(query);
  if (!nq) return 1;
  const hay = searchHay(f);
  const bw = norm(getBdFoodNameBn(f));
  const ew = norm(getBdFoodNameEn(f));
  if (hay === nq) return 1200;
  let score = 0;
  if (bw === nq || ew === nq) score += 500;
  if (bw.startsWith(nq)) score += 280;
  if (ew.startsWith(nq)) score += 250;
  if (hay.includes(nq)) score += 140;

  const qs = tokens(nq);
  const hw = tokens(hay);
  for (const t of qs) {
    if (hw.some((w) => w === t)) score += 80;
    if (hw.some((w) => w.startsWith(t))) score += 60;
    if (hw.some((w) => fuzzyTokenMatch(t, w))) score += 35;
    const ex = ALIASES[t] || [];
    for (const a of ex) {
      const na = norm(a);
      if (hay.includes(na)) score += 70;
      else if (tokens(na).some((at) => hw.some((w) => fuzzyTokenMatch(at, w)))) score += 30;
    }
  }
  return score;
}

/**
 * Classifies any BD FCT food record into Green, Yellow, or Red Traffic Light Zone
 * personalized to the user's clinical profile, cohort, conditions, and Ayurvedic dosha.
 */
export function classifyBdFoodToTrafficLight(
  f: BdFctFoodRecord,
  profile?: HealthProfile | null
): TrafficLightFoodItem {
  const h = searchHay(f);
  const prefix = (f.code || '').slice(0, 2);
  const subCatId = getBdSubCategoryId(f);
  const subCatDef = BD_FCT_CATEGORIES.find((c) => c.id === subCatId);
  const clinicalCategory = getClinicalCategoryForBdFood(f);

  const kcal = Math.round(nval(f.energy_kcal) ?? 50);
  const prot = nval(f.protein_g) ?? 0;
  const carbs = nval(f.carb_g) ?? 0;
  const fat = nval(f.fat_g) ?? 0;
  const fib = nval(f.fibre_g) ?? 0;
  const fe = nval(f.iron_mg) ?? 0;
  const ca = nval(f.calcium_mg) ?? 0;
  const na = nval(f.sodium_mg) ?? 0;
  const k = nval(f.potassium_mg) ?? 0;
  const zn = nval(f.zinc_mg) ?? 0;
  const vitc = nval(f.vitamin_c_mg) ?? 0;
  const folate = nval(f.folate_mcg) ?? 0;

  const cond = ((profile?.medicalConditions || '') + ' ' + (profile?.dietGoals || '')).toLowerCase();
  const cohort = profile?.cohortType || 'adult_metabolic';
  const isPregnant = cohort === 'pregnancy_lactation';
  const isChild = cohort === 'child_pediatric';
  const isOncology = cohort === 'oncology_cancer';

  const hasDiabetesOrIR =
    cond.includes('diab') ||
    cond.includes('sugar') ||
    cond.includes('insulin') ||
    cond.includes('pcos') ||
    cond.includes('ডায়াবেটিস') ||
    cond.includes('সুগার') ||
    (profile?.metabolicType || '').toLowerCase().includes('resistant') ||
    (profile?.weight || 65) > 72;

  const hasFattyLiver =
    cond.includes('liver') ||
    cond.includes('fatty') ||
    cond.includes('লিভার') ||
    cond.includes('triglyceride');

  const hasHypertension =
    cond.includes('bp') ||
    cond.includes('hypertension') ||
    cond.includes('pressure') ||
    cond.includes('প্রেসার') ||
    cond.includes('রক্তচাপ');

  const hasCKD =
    cond.includes('ckd') ||
    cond.includes('kidney') ||
    cond.includes('renal') ||
    cond.includes('creatinine') ||
    cond.includes('কিডনি');

  const hasUricAcid =
    cond.includes('uric') ||
    cond.includes('gout') ||
    cond.includes('ইউরিক');

  const hasIBSOrGastritis =
    cond.includes('ibs') ||
    cond.includes('gas') ||
    cond.includes('acidity') ||
    cond.includes('ulcer') ||
    cond.includes('গ্যাস') ||
    cond.includes('অ্যাসিডিটি') ||
    Boolean(profile?.hasHypoacidity);

  let zone: TrafficLightZone = 'green';
  let reasonBn = '';
  let reasonEn = '';

  // 1. PREGNANCY STRICT CONTRAINDICATIONS
  if (isPregnant && /papaya.*unripe|green papaya|কাঁচা পেঁপে|পেঁপে, কাঁচা|pineapple|আনারস/.test(h)) {
    zone = 'red';
    reasonBn = 'গর্ভাবস্থায় কাঁচা পেঁপে (ল্যাটেক্স) ও আনারস (ব্রোমেলেন) জরায়ু সংকোচনের ঝুঁকি বাড়ায় — সম্পূর্ণ নিষিদ্ধ।';
    reasonEn = 'Raw papaya latex and pineapple bromelain risk premature uterine contractions during pregnancy — strictly avoid.';
  }
  // 2. INDUSTRIAL OILS, TRANS FATS, REFINED SUGAR, SOFT DRINKS, BAKERY, DEEP FRIED
  else if (
    /sugar|jaggery|molasses|soft drink|cola|biscuit|cake|bread, white|white bread|vanaspati|dalda|margarine|palm oil|soybean oil|sweetmeat|rosogolla|sandesh|jilapi|chanachur|singara|samucha|চিনি|গুড়|গুড়|কোল্ড|বিস্কুট|কেক|পাউরুটি|ডালডা|সয়াবিন তেল|সয়াবিন তেল|পাম তেল|মিষ্টি|রসগোল্লা|জিলাপি|চানাচুর|সিঙ্গারা/.test(
      h
    )
  ) {
    // Jaggery or honey in child/pregnancy without diabetes can be yellow, otherwise red
    if ((isChild || isPregnant) && !hasDiabetesOrIR && /jaggery|গুড়|গুড়|honey|মধু/.test(h)) {
      zone = 'yellow';
      reasonBn = `প্রাকৃতিক শক্তির উৎস (${kcal} kcal/100g, আয়রন ${fe}mg); তবে রক্তে সুগার নিয়ন্ত্রণে রাখতে পরিমিত পরিমাণে গ্রহণ করুন।`;
      reasonEn = `Natural energy source (${kcal} kcal/100g, Iron ${fe}mg); consume in small controlled amounts.`;
    } else {
      zone = 'red';
      reasonBn = `উচ্চ গ্লাইসেমিক রিফাইন্ড কার্ব বা প্রদাহজনক ফ্যাট (${kcal} kcal/100g) — ইনসুলিন রেজিস্ট্যান্স, ফ্যাটি লিভার ও কোষীয় প্রদাহ বাড়ায়।`;
      reasonEn = `Refined glycemic load or pro-inflammatory lipid (${kcal} kcal/100g) — triggers insulin spikes, hepatic steatosis, and gut dysbiosis.`;
    }
  }
  // 3. DRIED SALTED FISH (শুঁটকি) & HIGH SODIUM ITEMS
  else if (/dried|salted|শুঁটকি|শুটকি|pickle|আচার/.test(h) || na >= 450) {
    if (hasHypertension || hasCKD || isPregnant || isOncology) {
      zone = 'red';
      reasonBn = `অতিরিক্ত সোডিয়াম (${na}mg/100g) ও হিস্টামিন — উচ্চ রক্তচাপ, কিডনি ও গর্ভাবস্থায় ঝুঁকিপূর্ণ হওয়ায় বর্জনীয়।`;
      reasonEn = `Excess sodium (${na}mg/100g) and biogenic amines — strictly avoid in hypertension, renal care, or pregnancy.`;
    } else {
      zone = 'yellow';
      reasonBn = `উচ্চ প্রোটিন (${prot}g) ও ক্যালসিয়াম (${ca}mg) সমৃদ্ধ হলেও সোডিয়াম বেশি (${na}mg); ভালোভাবে গরম পানিতে ধুয়ে অল্প পরিমাণে খান।`;
      reasonEn = `High protein (${prot}g) & calcium (${ca}mg) but high sodium (${na}mg); wash thoroughly in warm water and eat sparingly.`;
    }
  }
  // 4. RED MEAT & ORGAN MEAT (Beef, Mutton, Liver, Brain)
  else if (prefix === '10' && /beef|mutton|lamb|goat|pork|buffalo|liver|brain|গরু|খাসি|মহিষ|কলিজা|মগজ/.test(h)) {
    if (hasFattyLiver || hasHypertension || hasUricAcid || hasCKD || isOncology) {
      zone = 'red';
      reasonBn = `রেড মিট / অর্গান মিট (${kcal} kcal, ফ্যাট ${fat}g) — স্যাচুরেটেড ফ্যাট, পিউরিন ও অ্যারাকিডোনিক অ্যাসিড প্রদাহ বাড়ায়।`;
      reasonEn = `Red/organ meat (${kcal} kcal, Fat ${fat}g) — high purines and saturated fat elevate uric acid and hepatic inflammation.`;
    } else if (/liver|কলিজা/.test(h) && (isPregnant || isChild)) {
      zone = 'yellow';
      reasonBn = `অত্যন্ত উচ্চ হিম-আয়রন (${fe}mg) ও ভিটামিন-এ সমৃদ্ধ; তবে সপ্তাহে ১ বারের বেশি নয় এবং পরিমিত পরিমাণে।`;
      reasonEn = `Exceptionally rich in heme-iron (${fe}mg) & B12; limit to once weekly in small well-cooked portions.`;
    } else {
      zone = 'yellow';
      reasonBn = `উচ্চ প্রোটিন (${prot}g) ও আয়রন (${fe}mg); চর্বি বাদ দিয়ে সপ্তাহে ১ দিন পাতলা ঝোল হিসেবে পরিমিত খাওয়া যাবে।`;
      reasonEn = `Rich in protein (${prot}g) & iron (${fe}mg); consume lean cuts occasionally in light broth.`;
    }
  }
  // 5. CEREALS & GRAINS (01) AND STARCHY ROOTS/TUBERS (05)
  else if (prefix === '01' || prefix === '05') {
    const isWholeLowGI = /barley|যব|brown|লাল চাল|ঢেঁকি|whole|কাউন|millet|oats|ওটস|sweet corn|ভুট্টা/.test(h);
    const isRefinedOrHighGI = /puffed|মুড়ি|চিড়া|খই|ময়দা|ময়দা|সুজি|সেমাই|পাউরুটি|potato|আলু/.test(h);

    if (isWholeLowGI) {
      zone = 'green';
      reasonBn = `জটিল শর্করা ও ডায়েটারি ফাইবার সমৃদ্ধ (ফাইবার ${fib}g, প্রোটিন ${prot}g/100g) — রক্তে সুগার ধীরগতিতে নিঃসরণ করে।`;
      reasonEn = `Whole complex carbohydrate rich in fibre (${fib}g) & protein (${prot}g/100g) for steady glycemic control.`;
    } else if (isRefinedOrHighGI && hasDiabetesOrIR) {
      zone = /ময়দা|ময়দা|পাউরুটি|সেমাই/.test(h) ? 'red' : 'yellow';
      reasonBn =
        zone === 'red'
          ? `রিফাইন্ড শর্করা (কার্ব ${carbs}g, ফাইবার মাত্র ${fib}g) — দ্রুত ব্লাড সুগার ও ইনসুলিন বাড়ায়।`
          : `উচ্চ গ্লাইসেমিক শর্করা (${carbs}g কার্ব/100g); ডায়াবেটিস বা ওজন নিয়ন্ত্রণে দুপুরে শাকসবজি ও প্রোটিনের সাথে অল্প পরিমাণে খান।`;
      reasonEn =
        zone === 'red'
          ? `Refined starch (${carbs}g carbs, only ${fib}g fibre) — causes rapid glycemic spikes.`
          : `Higher glycemic starch (${carbs}g carbs/100g); strictly pair with protein and fibre in small portions.`;
    } else {
      zone = 'yellow';
      reasonBn = `শক্তির উৎস (${kcal} kcal, কার্ব ${carbs}g/100g); প্রোটিন (মাছ/ডিম/ডাল) ও শাকসবজির সাথে পরিমিত পোরশনে গ্রহণ করুন।`;
      reasonEn = `Energy staple (${kcal} kcal, Carbs ${carbs}g/100g); consume in controlled portions alongside protein and greens.`;
    }
  }
  // 6. PULSES & LEGUMES (02)
  else if (prefix === '02') {
    const isGentlePulse = /mung|moong|মুগ|lentil|mosur|মসুর/.test(h);
    if (hasUricAcid || hasCKD) {
      zone = isGentlePulse ? 'yellow' : 'red';
      reasonBn =
        zone === 'yellow'
          ? `উদ্ভিজ্জ প্রোটিন (${prot}g) ও ফাইবার (${fib}g); ইউরিক অ্যাসিড/কিডনি প্রোটোকলে পাতলা করে ১ ছোট বাটি খাওয়া যাবে।`
          : `উচ্চ পিউরিন ও পটাশিয়াম (${k}mg/100g) — ইউরিক অ্যাসিড বা কিডনি সমস্যায় বর্জনীয়।`;
      reasonEn =
        zone === 'yellow'
          ? `Plant protein (${prot}g) & fibre (${fib}g); consume as thin broth in small portion for renal/uric care.`
          : `Higher purine and potassium (${k}mg/100g) — restrict in gout or CKD.`;
    } else if (isGentlePulse) {
      zone = 'green';
      reasonBn = `সহজপাচ্য উদ্ভিজ্জ প্রোটিন (${prot}g/100g), ফাইবার (${fib}g) ও আয়রন (${fe}mg) — অন্ত্র ও মেটাবলিজমের জন্য আদর্শ।`;
      reasonEn = `Gentle bioavailable plant protein (${prot}g/100g), fibre (${fib}g) & iron (${fe}mg) supporting gut & glucose balance.`;
    } else {
      zone = 'yellow';
      reasonBn = `উচ্চ প্রোটিন (${prot}g) ও ফাইবার (${fib}g/100g); গ্যাস এড়াতে ৮ ঘণ্টা ভিজিয়ে রেখে আদা-রসুন দিয়ে রান্না করে পরিমিত খান।`;
      reasonEn = `Rich in protein (${prot}g) & fibre (${fib}g/100g); soak well before cooking and consume in moderate portions.`;
    }
  }
  // 7. VEGETABLES (03) & LEAFY GREENS (04)
  else if (prefix === '03' || prefix === '04') {
    const isNightshadeCaution = /brinjal|eggplant|বেগুন/.test(h);
    const isHighOxalateSpinach = /spinach|পালং|কচু|পুঁই/.test(h);

    if (hasCKD && k >= 380) {
      zone = 'yellow';
      reasonBn = `পুষ্টিকর শাকসবজি কিন্তু পটাশিয়াম বেশি (${k}mg/100g); কিডনি রোগীরা পানিতে ভাপিয়ে পানি ফেলে রান্না করবেন।`;
      reasonEn = `Nutrient-dense green but high potassium (${k}mg/100g); leach/boil in water before cooking for CKD safety.`;
    } else if (isNightshadeCaution) {
      zone = 'yellow';
      reasonBn = `ফাইবার সমৃদ্ধ (${fib}g/100g) সবজি; তবে নাইটশেড ও অ্যালার্জি প্রবণতা থাকলে পরিমিত পরিমাণে গ্রহণ করুন।`;
      reasonEn = `Good fibre (${fib}g/100g), but as a Solanaceae nightshade, consume moderately if prone to allergies or joint inflammation.`;
    } else if (isHighOxalateSpinach && hasUricAcid) {
      zone = 'yellow';
      reasonBn = `আয়রন (${fe}mg) ও ক্যালসিয়াম (${ca}mg) সমৃদ্ধ; তবে অক্সালেট থাকায় ভালোভাবে সিদ্ধ করে পরিমিত পরিমাণে খান।`;
      reasonEn = `Rich in iron (${fe}mg) & calcium (${ca}mg); cook thoroughly and consume moderately due to oxalate content.`;
    } else {
      zone = 'green';
      reasonBn = `লো-ক্যালরি (${kcal} kcal), অ্যালকালাইন ফাইবার (${fib}g), আয়রন (${fe}mg) ও অ্যান্টিঅক্সিডেন্ট সমৃদ্ধ — নিয়মিত ও অবাধে খাওয়া যাবে।`;
      reasonEn = `Low-calorie (${kcal} kcal), alkaline fibre (${fib}g), iron (${fe}mg) & phytonutrient powerhouse — optimal daily healing food.`;
    }
  }
  // 8. FISH & SHELLFISH (09), POULTRY (10), EGGS (11)
  else if (prefix === '09' || prefix === '10' || prefix === '11') {
    const isPrawnOrCrab = /shrimp|prawn|crab|lobster|চিংড়ি|চিংড়ি|কাঁকড়া/.test(h);
    const isFattyHilsa = /hilsa|ilish|ইলিশ/.test(h);

    if (isPrawnOrCrab) {
      zone = 'yellow';
      reasonBn = `উচ্চ প্রোটিন (${prot}g/100g) ও জিঙ্ক (${zn}mg); তবে অ্যালার্জি বা কোলেস্টেরল প্রবণতা থাকলে পরিমিত পরিমাণে খান।`;
      reasonEn = `High protein (${prot}g/100g) & zinc (${zn}mg); enjoy in moderate portions if sensitive to shellfish or histamine.`;
    } else if (isFattyHilsa) {
      zone = 'yellow';
      reasonBn = `ওমেগা-৩ ফ্যাটি অ্যাসিড ও প্রোটিন (${prot}g, ফ্যাট ${fat}g) সমৃদ্ধ; হালকা ঝোল বা ভাপা করে পরিমিত ১ টুকরো খাওয়া উত্তম।`;
      reasonEn = `Rich in cardioprotective marine Omega-3s (${prot}g protein, ${fat}g fat); enjoy 1 piece steamed or in light broth.`;
    } else {
      zone = 'green';
      reasonBn = `উচ্চমানের বায়ো-অ্যাভেইলেবল প্রোটিন (${prot}g/100g), ক্যালসিয়াম (${ca}mg) ও আয়রন (${fe}mg) — কোষ মেরামত ও মেটাবলিজমের সেরা উৎস।`;
      reasonEn = `High-biological-value protein (${prot}g/100g), calcium (${ca}mg) & iron (${fe}mg) — ideal for cellular repair & metabolic health.`;
    }
  }
  // 9. MILK & DAIRY (12)
  else if (prefix === '12') {
    if (/sweet|condensed|মিষ্টি দই|ক্ষীর|পায়েস|আইসক্রিম/.test(h)) {
      zone = 'red';
      reasonBn = `অতিরিক্ত চিনি ও ল্যাকটোজ (${kcal} kcal/100g) — ইনসুলিন স্পাইক ও মিউকাস প্রদাহ তৈরি করে।`;
      reasonEn = `High added sugar and dairy fat (${kcal} kcal/100g) — triggers glycemic spikes and mucus inflammation.`;
    } else if (/curd|yoghurt|yogurt|টক দই|ছানা|ঘোল|মাঠা/.test(h)) {
      zone = 'green';
      reasonBn = `প্রোবায়োটিক ও ক্যালসিয়াম (${ca}mg/100g) সমৃদ্ধ — গাট মাইক্রোবায়োম ও হজমশক্তি উন্নত করে।`;
      reasonEn = `Rich in live probiotics and bioavailable calcium (${ca}mg/100g) — restores gut microbiome diversity.`;
    } else {
      zone = hasIBSOrGastritis ? 'yellow' : 'green';
      reasonBn = `ক্যালসিয়াম (${ca}mg) ও প্রোটিন (${prot}g/100g) সমৃদ্ধ; ল্যাকটোজ সংবেদনশীলতা থাকলে পরিমিত পরিমাণে বা হলুদ মিশিয়ে গ্রহণ করুন।`;
      reasonEn = `Provides calcium (${ca}mg) & protein (${prot}g/100g); take warm with a pinch of turmeric if lactose-sensitive.`;
    }
  }
  // 10. NUTS, SEEDS (06), SPICES & HERBS (07), FATS & OILS (13)
  else if (prefix === '06' || prefix === '07' || prefix === '13') {
    if (/ghee|ঘি|mustard oil|সরিষার তেল|olive|অলিভ|coconut oil|নারিকেল তেল|sesame|তিল|flax|তিসি|almond|কাঠবাদাম|walnut|আখরোট|pumpkin seed|কুমড়ার বীজ|chia|চিয়া/.test(h) || prefix === '07' || prefix === '06') {
      zone = 'green';
      reasonBn =
        prefix === '07'
          ? `অ্যান্টি-ইনফ্ল্যামেটরি ফাইটোকেমিক্যাল, আয়রন (${fe}mg) ও হজম এনজাইম উদ্দীপক ভেষজ মসলা।`
          : `স্বাস্থ্যকর ওমেগা-৩/মনোআনস্যাচুরেটেড ফ্যাট, প্রোটিন (${prot}g) ও মিনারেল (ম্যাগনেসিয়াম/জিঙ্ক) সমৃদ্ধ সুপারফুড।`;
      reasonEn =
        prefix === '07'
          ? `Anti-inflammatory culinary spice rich in antioxidants and digestive carminatives.`
          : `Healthy therapeutic lipid, plant protein (${prot}g) & essential mineral source.`;
    } else {
      zone = 'yellow';
      reasonBn = `উচ্চ ক্যালরিযুক্ত ফ্যাট (${kcal} kcal/100g); রান্নায় প্রতিদিন নির্ধারিত চামচ মেপে পরিমিত ব্যবহার করুন।`;
      reasonEn = `Calorie-dense fat (${kcal} kcal/100g); strictly measure daily cooking tsp allocation.`;
    }
  }
  // 11. FRUITS (08) & BEVERAGES/MISC (14, 15)
  else {
    const isHighSugarFruit = /mango, ripe|পাকা আম|jackfruit, ripe|পাকা কাঁঠাল|banana, ripe|পাকা কলা|litchi|লিচু|dates, dry|খেজুর|custard apple|আতা|sapodilla|সফেদা|grapes|আঙুর/.test(
      h
    );
    if (isHighSugarFruit && (hasDiabetesOrIR || hasFattyLiver)) {
      zone = 'yellow';
      reasonBn = `প্রাকৃতিক ভিটামিন সমৃদ্ধ হলেও মিষ্টি ও ফ্রুক্টোজ বেশি (কার্ব ${carbs}g/100g); ডায়াবেটিস বা ফ্যাটি লিভারে খুব অল্প পরিমাণে (২-৩ টুকরো) দিনের বেলায় খান।`;
      reasonEn = `Contains natural vitamins but higher fructose/sugar (${carbs}g carbs/100g); limit to a small daytime portion in diabetes/fatty liver.`;
    } else {
      zone = 'green';
      reasonBn = `ভিটামিন C (${vitc}mg), ফাইবার (${fib}g) ও অ্যান্টিঅক্সিডেন্ট সমৃদ্ধ দেশি ফল (${kcal} kcal/100g) — কোষীয় সজীবতা ও রোগ প্রতিরোধ ক্ষমতা বাড়ায়।`;
      reasonEn = `Rich in Vitamin C (${vitc}mg), fibre (${fib}g) & polyphenols (${kcal} kcal/100g) — supports cellular antioxidant defense.`;
    }
  }

  const isVegCarb =
    (prefix === '03' || prefix === '04') &&
    /bottle gourd|লাউ|papaya|পেঁপে|ash gourd|চালকুমড়া|cauliflower|ফুলকপি|ridge gourd|ঝিঙে|পটল|কচু|গাজর|বিটরুট|মিষ্টি কুমড়া/.test(h);

  const isCerealCarb = prefix === '01' || prefix === '05';

  const badges = getFoodFlags(f)
    .slice(0, 4)
    .map((b) => ({ key: b.key, icon: b.icon, label: b.label }));

  return {
    id: `bdfct_${f.code}`,
    bdFctCode: f.code,
    bdSubCategory: subCatId,
    bdSubCategoryBn: subCatDef?.nameBn || f.category_bn || 'খাবার',
    icon: f.icon || subCatDef?.icon || '🥗',
    nameBn: getBdFoodNameBn(f),
    nameEn: getBdFoodNameEn(f),
    scientific: f.scientific ? String(f.scientific).replace(/\s+/g, ' ').trim() : undefined,
    category: clinicalCategory,
    zone,
    caloriesPer100g: kcal,
    proteinG: prot,
    carbsG: carbs,
    fatG: fat,
    fiberG: fib,
    ironMg: fe,
    calciumMg: ca,
    sodiumMg: na,
    potassiumMg: k,
    zincMg: zn,
    vitaminCMg: vitc,
    folateMcg: folate,
    functionalBadges: badges,
    clinicalReasonBn: reasonBn,
    clinicalReasonEn: reasonEn,
    isVegetableCarb: isVegCarb,
    isCerealCarb,
  };
}

/**
 * Generates the comprehensive 381+ item Bangladesh Food Composition Traffic Light Guide
 * tailored to the user's clinical profile.
 */
export function generateComprehensiveTrafficLightGuide(profile?: HealthProfile | null): TrafficLightGuide {
  const cond = (profile?.medicalConditions || '').toLowerCase();
  const cohort = profile?.cohortType || 'adult_metabolic';

  const isDiabeticOrIR =
    cond.includes('diab') ||
    cond.includes('sugar') ||
    cond.includes('insulin') ||
    cond.includes('pcos') ||
    profile?.metabolicType?.toLowerCase().includes('resistant') ||
    profile?.metabolicType?.includes('ইনসুলিন') ||
    (profile?.weight || 65) > 72;

  const digAns = Object.entries(profile?.answers || {}).filter(([k]) => k.startsWith('digestion'));
  const hasHypoacidity =
    profile?.hasHypoacidity !== undefined
      ? profile.hasHypoacidity
      : digAns.some(([_, v]) => v === 'c' || v === 'a') ||
        cond.includes('gas') ||
        cond.includes('acidity') ||
        cond.includes('bloating') ||
        cond.includes('ibs') ||
        (profile?.microbiomeScore || 80) < 75;

  const recommendedMealFrequency: 3 | 4 =
    cohort === 'pregnancy_lactation' || cohort === 'child_pediatric' || cohort === 'oncology_cancer'
      ? 4
      : isDiabeticOrIR
      ? 3
      : 4;

  const recommendedDinnerCarbRule: 'vegetable_carbs' | 'cereal_allowed' | 'no_carbs' =
    cohort === 'pregnancy_lactation' || cohort === 'child_pediatric'
      ? 'cereal_allowed'
      : isDiabeticOrIR
      ? 'vegetable_carbs'
      : 'cereal_allowed';

  // Classify all 381 official BD FCT items
  const bdFctItems: TrafficLightFoodItem[] = BD_FCT_RAW_FOODS.map((f) =>
    classifyBdFoodToTrafficLight(f, profile)
  );

  // Add curated clinical signature items at the top of each category so users see familiar functional staples first,
  // followed by all 381 BD FCT database items!
  const curatedClinicalStaples: TrafficLightFoodItem[] = [
    {
      id: 'prot_egg',
      bdFctCode: '11_0002',
      bdSubCategory: '11',
      bdSubCategoryBn: 'ডিম',
      icon: '🥚',
      nameBn: 'দেশি মুরগির সিদ্ধ বা পোচ ডিম (Boiled Deshi Egg)',
      nameEn: 'Deshi Boiled / Poached Egg',
      category: 'Proteins',
      zone: 'green',
      caloriesPer100g: 158,
      proteinG: 13.3,
      carbsG: 0.8,
      fatG: 11.2,
      fiberG: 0,
      ironMg: 2.1,
      calciumMg: 60,
      functionalBadges: [
        { key: 'protein', icon: '💪', label: 'HIGH PROTEIN' },
        { key: 'fodmap', icon: '🫘', label: 'LOW FODMAP' },
      ],
      clinicalReasonBn: 'সকালের মেটাবলিজম সক্রিয় করতে সম্পূর্ণ অ্যামিনো অ্যাসিড ও কোলিনের সেরা উৎস।',
      clinicalReasonEn: 'Complete bioavailable protein & choline for morning metabolic activation.',
    },
    {
      id: 'veg_lau',
      bdFctCode: '03_0021',
      bdSubCategory: '03',
      bdSubCategoryBn: 'সবজি',
      icon: '🥒',
      nameBn: 'লাউ সিদ্ধ / হালকা লাউয়ের তরকারি (Bottle Gourd)',
      nameEn: 'Bottle Gourd (Lau) Boiled or Light Curry',
      category: 'Vegetables & Greens',
      zone: 'green',
      caloriesPer100g: 15,
      proteinG: 0.6,
      carbsG: 2.5,
      fatG: 0.1,
      fiberG: 1.2,
      ironMg: 0.3,
      calciumMg: 26,
      functionalBadges: [
        { key: 'gi', icon: '📈', label: 'GI: Low' },
        { key: 'fodmap', icon: '🫘', label: 'LOW FODMAP' },
      ],
      clinicalReasonBn: 'শরীর ক্ষারীয় রাখে, লিভার ঠান্ডা রাখে এবং রাতের খাবারে ভাত/রুটির বদলে সেরা সবজি শর্করা।',
      clinicalReasonEn: 'Alkaline cellular hydrator & ideal low-glycemic night vegetable carbohydrate.',
      isVegetableCarb: true,
    },
    {
      id: 'carb_red_rice',
      bdFctCode: '01_0023',
      bdSubCategory: '01',
      bdSubCategoryBn: 'শস্য ও শস্যজাত',
      icon: '🌾',
      nameBn: 'ঢেঁকি ছাঁটা লাল চালের ভাত (Unpolished Red/Brown Rice)',
      nameEn: 'Unpolished Red / Brown Rice',
      category: 'Grains & Carbs',
      zone: 'green',
      caloriesPer100g: 118,
      proteinG: 2.8,
      carbsG: 25.2,
      fatG: 0.9,
      fiberG: 3.4,
      ironMg: 1.8,
      calciumMg: 18,
      functionalBadges: [
        { key: 'wholegrain', icon: '🌾', label: 'WHOLE GRAIN' },
        { key: 'gi', icon: '📈', label: 'GI: Low-Medium' },
      ],
      clinicalReasonBn: 'ফাইবার, ম্যাগনেসিয়াম ও ভিটামিন বি১ সমৃদ্ধ ধীরগতির শর্করা; দুপুরের খাবারে রক্তে সুগার নিয়ন্ত্রণে রাখে।',
      clinicalReasonEn: 'Complex low-glycemic carbohydrate rich in bran fiber, magnesium, and B-vitamins.',
      isCerealCarb: true,
    },
    {
      id: 'fat_deshi_ghee',
      bdFctCode: '13_0003',
      bdSubCategory: '13',
      bdSubCategoryBn: 'তেল ও চর্বি',
      icon: '🧈',
      nameBn: 'খাঁটি দেশি গাওয়া ঘি (Pure A2 Deshi Ghee)',
      nameEn: 'Pure A2 Deshi Cow Ghee',
      category: 'Healthy Fats & Seeds',
      zone: 'green',
      caloriesPer100g: 898,
      proteinG: 0,
      carbsG: 0,
      fatG: 99.5,
      fiberG: 0,
      ironMg: 0,
      calciumMg: 0,
      functionalBadges: [{ key: 'fodmap', icon: '🫘', label: 'LOW FODMAP' }],
      clinicalReasonBn: 'বিউটিরিক অ্যাসিড সমৃদ্ধ যা অন্ত্রের প্রাচীর (Gut Lining) মেরামত করে এবং হজম অগ্নি প্রজ্বলিত করে।',
      clinicalReasonEn: 'Rich in short-chain butyric acid to heal colonocytes and kindle digestive Agni.',
    },
    {
      id: 'fat_chia_flax',
      bdFctCode: '06_0008',
      bdSubCategory: '06',
      bdSubCategoryBn: 'বাদাম ও বীজ',
      icon: '🥜',
      nameBn: 'ভেজানো চিয়া সিড ও রোস্টেড তিসি (Chia & Flaxseeds)',
      nameEn: 'Soaked Chia & Roasted Flaxseeds (Tishi)',
      category: 'Healthy Fats & Seeds',
      zone: 'green',
      caloriesPer100g: 510,
      proteinG: 18.3,
      carbsG: 28.9,
      fatG: 36.2,
      fiberG: 27.3,
      ironMg: 5.7,
      calciumMg: 255,
      functionalBadges: [
        { key: 'fibre', icon: '🌿', label: 'HIGH FIBRE' },
        { key: 'calcium', icon: '🦴', label: 'CALCIUM RICH' },
      ],
      clinicalReasonBn: 'ওমেগা-৩ আলফা-লিনোলেনিক অ্যাসিড ও সলিউবল ফাইবারের সেরা উৎস; ফ্যাটি লিভার ও কোলেস্টেরল কমায়।',
      clinicalReasonEn: 'Rich in plant Omega-3 ALA and soluble mucilage fiber to lower triglycerides and heal the gut.',
    },
  ];

  // Combine curated items + all 381 BD FCT items (putting Green first, then Yellow, then Red within each category)
  const zoneOrder: Record<TrafficLightZone, number> = { green: 0, yellow: 1, red: 2 };
  const allItems = [
    ...curatedClinicalStaples,
    ...bdFctItems.sort((a, b) => zoneOrder[a.zone] - zoneOrder[b.zone]),
  ];

  return {
    items: allItems,
    recommendedMealFrequency,
    mealFrequencyReasonBn:
      recommendedMealFrequency === 3
        ? 'ইনসুলিন রেজিস্ট্যান্স ও মেটাবলিক হিলিংয়ের জন্য দিনে ৩ বেলা প্রধান খাবার (মাঝে ৪-৫ ঘণ্টা বিরতি) সর্বোত্তম।'
        : 'শরীরের শক্তি, রক্তে সুগারের স্থিতিশীলতা এবং হজমের সুবিধার্থে দিনে ৪ বেলা পরিমিত আহারের পরামর্শ দেওয়া হয়েছে।',
    mealFrequencyReasonEn:
      recommendedMealFrequency === 3
        ? '3 structured meals allow 4-5 hours of insulin clearance and hepatic fat oxidation between meals.'
        : '4 balanced meals support steady energy, micronutrient absorption, and digestive comfort.',
    recommendedDinnerCarbRule,
    dinnerCarbReasonBn:
      recommendedDinnerCarbRule === 'vegetable_carbs'
        ? 'রাতের খাবারে ভাত/রুটির বদলে লাউ, পেঁপে বা চালকুমড়ার মতো সবজি শর্করা গ্রহণ করলে ফাস্টিং সুগার ও লিভার ফ্যাট দ্রুত কমে।'
        : 'রাতের খাবারে প্রোটিন ও সবজির সাথে পরিমিত লাল আটার রুটি বা নরম লাল চালের ভাত গ্রহণ করা যাবে।',
    dinnerCarbReasonEn:
      recommendedDinnerCarbRule === 'vegetable_carbs'
        ? 'Replacing cereal grains at dinner with low-glycemic gourd vegetables optimizes nocturnal insulin sensitivity.'
        : 'Controlled whole grains paired with protein and greens at dinner sustain overnight glycogen.',
    hasHypoacidity,
    clinicalSummaryBn: `বাংলাদেশ ফুড কম্পোজিশন টেবিল (BD FCT, INFS ঢাকা বিশ্ববিদ্যালয়) অনুযায়ী মোট ${allItems.length}টি দেশীয় খাবারের গ্রিন, ইয়েলো ও রেড জোন তালিকা।`,
    clinicalSummaryEn: `Complete Bangladesh Food Composition Table (BD FCT, INFS University of Dhaka) guide with ${allItems.length} classified foods across Green, Yellow, and Red zones.`,
  };
}

/**
 * Returns default selected food IDs (curated + top Green staples per category)
 * so new profiles start with a balanced set of ~28 Green foods selected while
 * allowing the user to select/deselect any of the 381+ BD FCT foods.
 */
export function getDefaultSelectedFoodIds(guide: TrafficLightGuide): string[] {
  const greenItems = guide.items.filter((i) => i.zone === 'green');
  const byCat: Record<string, string[]> = {};
  for (const item of greenItems) {
    if (!byCat[item.category]) byCat[item.category] = [];
    if (byCat[item.category].length < 8) {
      byCat[item.category].push(item.id);
    }
  }
  return Object.values(byCat).flat();
}

/**
 * Builds a rich, BD FCT-backed Food Exchange Table using the user's selected Green & Yellow foods.
 */
export function buildBdFctFoodExchangeTable(profile: HealthProfile, isBn = true): FoodExchangeRow[] {
  const guide = profile.trafficLightGuide || generateComprehensiveTrafficLightGuide(profile);
  const selectedSet = new Set(profile.selectedFoods || []);

  const pickBySubCat = (subCats: string[], zone: TrafficLightZone, limit = 5): string[] => {
    const matches = guide.items.filter(
      (i) => i.zone === zone && i.bdSubCategory && subCats.includes(i.bdSubCategory)
    );
    // Prioritize user-selected foods first
    const sorted = [...matches].sort(
      (a, b) => (selectedSet.has(b.id) ? 1 : 0) - (selectedSet.has(a.id) ? 1 : 0)
    );
    return sorted
      .slice(0, limit)
      .map((i) =>
        isBn
          ? `${i.nameBn} (${i.caloriesPer100g} kcal/100g)`
          : `${i.nameEn} (${i.caloriesPer100g} kcal/100g)`
      );
  };

  return [
    {
      category: isBn ? '🌾 শর্করা ও শস্য এক্সচেঞ্জ (BD FCT Grains & Tubers)' : '🌾 Grains & Carbs Exchange (BD FCT)',
      primaryFood: isBn ? 'ঢেঁকি ছাঁটা লাল চালের ভাত (১ কাপ / ১২০ গ্রাম)' : 'Unpolished Red/Brown Rice (1 Cup / 120g)',
      primaryPortion: '120g (~135 kcal)',
      greenSubstitutes: pickBySubCat(['01', '05'], 'green', 5),
      yellowSubstitutes: pickBySubCat(['01', '05'], 'yellow', 5),
      clinicalNote: isBn
        ? 'রাতে শস্য নিষেধ থাকলে লাল ভাতের বদলে লাউ সিদ্ধ (15 kcal/100g), কাঁচা পেঁপে বা চালকুমড়া গ্রহণ করুন।'
        : 'Swap cereal grains at dinner with boiled Bottle Gourd (15 kcal/100g) or Green Papaya for lower glycemic load.',
    },
    {
      category: isBn ? '🐟 মাছ, মাংস, ডিম ও ডাল প্রোটিন এক্সচেঞ্জ (BD FCT Proteins)' : '🐟 Fish, Poultry, Egg & Pulse Exchange (BD FCT)',
      primaryFood: isBn ? 'রুই / কাতলা / শিং মাছ (১০০ গ্রাম) বা ২টি দেশি ডিম' : 'Rohu / Catla / Shing Fish (100g) or 2 Deshi Eggs',
      primaryPortion: '100g (~110–155 kcal)',
      greenSubstitutes: pickBySubCat(['fish_fresh', '11', '10', '02'], 'green', 6),
      yellowSubstitutes: pickBySubCat(['fish_marine', '02', '10'], 'yellow', 5),
      clinicalNote: isBn
        ? 'দেশি ছোট মাছ (মলা, ঢেলা, কাঁচকি) ও শিং-মাগুর মাছ থেকে প্রাকৃতিক ক্যালসিয়াম, আয়রন ও ওমেগা-৩ পাওয়া যায়।'
        : 'Indigenous freshwater fish and eggs provide complete amino acids, bioavailable calcium, and anti-inflammatory Omega-3.',
    },
    {
      category: isBn ? '🥬 শাকসবজি ও রাতের সবজি শর্করা এক্সচেঞ্জ (BD FCT Vegetables & Leafy Greens)' : '🥬 Vegetables & Leafy Greens Exchange (BD FCT)',
      primaryFood: isBn ? 'লাউ, কাঁচা পেঁপে, পটল, ঝিঙে ও পালং/লাল শাক (১ বড় বাটি)' : 'Bottle Gourd, Green Papaya, Ridge Gourd & Leafy Greens (1 Bowl)',
      primaryPortion: '150–200g (~35–55 kcal)',
      greenSubstitutes: pickBySubCat(['03', '04'], 'green', 6),
      yellowSubstitutes: pickBySubCat(['03', '04'], 'yellow', 4),
      clinicalNote: isBn
        ? 'প্রতিদিন দুপুরে ও রাতে অন্তত ১ বাটি সবজি এবং ১ বাটি শাকপাতা রাখলে অন্ত্রের মাইক্রোবায়োম ও পটাশিয়াম ব্যালেন্স ঠিক থাকে।'
        : 'Include 1 bowl of non-starchy gourd vegetables and 1 bowl of leafy greens daily for prebiotic fiber and minerals.',
    },
    {
      category: isBn ? '🥜 স্বাস্থ্যকর ফ্যাট, তেল, বাদাম ও বীজ এক্সচেঞ্জ (BD FCT Fats, Nuts & Seeds)' : '🥜 Healthy Fats, Oils, Nuts & Seeds Exchange (BD FCT)',
      primaryFood: isBn ? 'খাঁটি ঘি (১ চামচ) + সরিষার তেল + ভেজানো বাদাম ও বীজ (১৫ গ্রাম)' : 'Pure Deshi Ghee (1 tsp) + Mustard Oil + Soaked Nuts & Seeds (15g)',
      primaryPortion: '15–20g (~110–135 kcal)',
      greenSubstitutes: pickBySubCat(['06', '13', '07'], 'green', 6),
      yellowSubstitutes: pickBySubCat(['06', '13'], 'yellow', 4),
      clinicalNote: isBn
        ? 'পরিশোধিত সয়াবিন বা পাম তেলের পরিবর্তে ঘানি ভাঙা সরিষার তেল, খাঁটি গাওয়া ঘি এবং বীজ থেকে স্বাস্থ্যকর ফ্যাট নিন।'
        : 'Replace industrial refined seed oils with cold-pressed mustard oil, A2 ghee, and soaked nuts/seeds.',
    },
    {
      category: isBn ? '🍎 দেশি ফলমূল ও প্রোবায়োটিক দই এক্সচেঞ্জ (BD FCT Fruits & Dairy)' : '🍎 Fruits & Probiotic Dairy Exchange (BD FCT)',
      primaryFood: isBn ? 'দেশি পেয়ারা, আমলকী, জাম্বুরা বা ঘরে পাতা টক দই (১০০ গ্রাম)' : 'Fresh Guava, Amla, Pomelo or Homemade Sour Curd (100g)',
      primaryPortion: '100g (~45–68 kcal)',
      greenSubstitutes: pickBySubCat(['08', '12'], 'green', 6),
      yellowSubstitutes: pickBySubCat(['08', '12'], 'yellow', 5),
      clinicalNote: isBn
        ? 'ফল সবসময় জুস না করে গোটা চিবিয়ে দিনের বেলায় (সকাল ১১টা বা বিকেল ৪টায়) খাবেন।'
        : 'Always consume whole fruits with intact fiber during daytime rather1 than fruit juices.',
    },
  ];
}
