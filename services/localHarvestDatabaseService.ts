import {
  DietPhaseChart,
  Language,
  LocalHarvestCountrySeasonSnapshot,
  LocalHarvestVegetableItem,
} from '../types';

interface CountryHarvestDefinition {
  countryCode: string;
  countryNameBn: string;
  countryNameEn: string;
  flag: string;
  hemisphere: 'Northern' | 'Southern' | 'Tropical';
  vegetables: LocalHarvestVegetableItem[];
}

export const LOCAL_HARVEST_COUNTRY_CATALOG: CountryHarvestDefinition[] = [
  {
    countryCode: 'BD',
    countryNameBn: 'বাংলাদেশ (Bangladesh)',
    countryNameEn: 'Bangladesh',
    flag: '🇧🇩',
    hemisphere: 'Tropical',
    vegetables: [
      {
        id: 'bd-lau',
        nameBn: 'দেশি লাউ (Bottle Gourd)',
        nameEn: 'Fresh Bottle Gourd (Lau)',
        localMarketName: 'লাউ (Shwapno / কাঁচাবাজার)',
        category: 'gourd_squash',
        glycemicIndex: 15,
        fiberPer100g: 2.1,
        keyMicronutrients: 'Potassium 170mg · Choline · Vitamin C',
        clinicalBenefitBn: 'যকৃত ঠান্ডা রাখে, অম্লতা ও গ্যাস্ট্রিক কমায় এবং ডিনারে ভাতের সেরা বিকল্প।',
        clinicalBenefitEn: 'Hepato-protective, cooling, alkalizing, and ideal low-GI dinner carb.',
        heritageEquivalentBn: 'দেশি কচি লাউ',
        heritageEquivalentEn: 'Native Tender Bottle Gourd',
        peakMonths: [1, 2, 3, 9, 10, 11, 12],
      },
      {
        id: 'bd-palong',
        nameBn: 'দেশি পালং শাক (Winter Spinach)',
        nameEn: 'Fresh Bengali Spinach (Palong Shak)',
        localMarketName: 'পালং শাক (শীতকালীন হারভেস্ট)',
        category: 'leafy_green',
        glycemicIndex: 15,
        fiberPer100g: 2.6,
        keyMicronutrients: 'Folate 194mcg · Iron 2.7mg · Magnesium 79mg',
        clinicalBenefitBn: 'রক্তস্বল্পতা দূর করে এবং ইনসুলিন সেন্সিটিভিটি বাড়ায়।',
        clinicalBenefitEn: 'Boosts hemoglobin, folate reserves, and insulin sensitivity.',
        heritageEquivalentBn: 'দেশি পালং শাক',
        heritageEquivalentEn: 'Native Palong Shak',
        peakMonths: [1, 2, 10, 11, 12],
      },
      {
        id: 'bd-pepe',
        nameBn: 'কাঁচা পেঁপে (Green Papaya)',
        nameEn: 'Raw Green Papaya (Kacha Pepe)',
        localMarketName: 'কাঁচা পেঁপে (বারোমাসি হারভেস্ট)',
        category: 'gourd_squash',
        glycemicIndex: 25,
        fiberPer100g: 1.8,
        keyMicronutrients: 'Papain Enzyme · Vitamin C · Potassium',
        clinicalBenefitBn: 'প্যাপেইন এনজাইম প্রোটিন হজমে সাহায্য করে ও অন্ত্র পরিষ্কার রাখে।',
        clinicalBenefitEn: 'Rich in papain proteolytic enzyme for gut motility and hypoacidity relief.',
        heritageEquivalentBn: 'কাঁচা পেঁপে',
        heritageEquivalentEn: 'Green Papaya',
        peakMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      },
      {
        id: 'bd-sajna',
        nameBn: 'সজনে ডাটা ও পাতা (Moringa Drumstick)',
        nameEn: 'Moringa Pods & Leaves (Sajna)',
        localMarketName: 'সজনে ডাটা ও পাতা',
        category: 'pod_herb',
        glycemicIndex: 20,
        fiberPer100g: 3.2,
        keyMicronutrients: 'Calcium 185mg · Iron 4mg · Quercetin',
        clinicalBenefitBn: 'ব্লাড সুগার ও প্রদাহ কমায় এবং রোগ প্রতিরোধ ক্ষমতা বাড়ায়।',
        clinicalBenefitEn: 'Potent anti-inflammatory and glycemic stabilizer rich in bioavailable calcium.',
        heritageEquivalentBn: 'সজনে ডাটা ও পাতা',
        heritageEquivalentEn: 'Moringa Drumstick & Leaves',
        peakMonths: [2, 3, 4, 5, 6],
      },
      {
        id: 'bd-potol-jhinge',
        nameBn: 'পটল ও ঝিঙে (Pointed & Ridge Gourd)',
        nameEn: 'Pointed Gourd & Ridge Gourd (Potol & Jhinge)',
        localMarketName: 'তাজা পটল ও ঝিঙে (গ্রীষ্ম-বর্ষা হারভেস্ট)',
        category: 'gourd_squash',
        glycemicIndex: 20,
        fiberPer100g: 2.0,
        keyMicronutrients: 'Vitamin A · Lutein · Dietary Water 92%',
        clinicalBenefitBn: 'গ্রীষ্ম ও বর্ষায় শরীর হাইড্রেটেড রাখে ও মেটাবলিজম সহজ করে।',
        clinicalBenefitEn: 'High-hydration summer/monsoon gourds that ease digestion and lower glycemic load.',
        heritageEquivalentBn: 'পটল ও ঝিঙে',
        heritageEquivalentEn: 'Pointed & Ridge Gourd',
        peakMonths: [4, 5, 6, 7, 8, 9],
      },
      {
        id: 'bd-phulkopi-sim',
        nameBn: 'ফুলকপি ও দেশি শিম (Cauliflower & Flat Beans)',
        nameEn: 'Winter Cauliflower & Hyacinth Beans (Phulkopi & Sheem)',
        localMarketName: 'ফুলকপি, বাঁধাকপি ও শিম',
        category: 'cruciferous',
        glycemicIndex: 15,
        fiberPer100g: 2.9,
        keyMicronutrients: 'Sulforaphane · Vitamin C · Plant Protein',
        clinicalBenefitBn: 'লিভার ডিটক্সিফিকেশন ও রাতে ভাতের বদলে ফুলকপির রাইসের জন্য আদর্শ।',
        clinicalBenefitEn: 'Sulforaphane-rich cruciferous harvest for phase-2 liver detox and grain-free dinner.',
        heritageEquivalentBn: 'ফুলকপি ও দেশি শিম',
        heritageEquivalentEn: 'Cauliflower & Country Beans',
        peakMonths: [1, 2, 10, 11, 12],
      },
    ],
  },
  {
    countryCode: 'US',
    countryNameBn: 'যুক্তরাষ্ট্র / আমেরিকা (United States)',
    countryNameEn: 'United States (USA)',
    flag: '🇺🇸',
    hemisphere: 'Northern',
    vegetables: [
      {
        id: 'us-lacinato-kale',
        nameBn: 'টাস্কান কেল / ডাইনোসর কেল (Lacinato Kale)',
        nameEn: 'Organic Lacinato (Tuscan) Kale',
        localMarketName: 'Lacinato Kale (Whole Foods / Trader Joe’s / Walmart)',
        category: 'leafy_green',
        glycemicIndex: 15,
        fiberPer100g: 4.1,
        keyMicronutrients: 'Vitamin K1 390mcg · Lutein · Calcium 254mg',
        clinicalBenefitBn: 'কচু শাক ও লাল শাকের সমতুল্য আয়রন ও ক্যালসিয়াম সমৃদ্ধ শরৎ-শীতকালীন হারভেস্ট।',
        clinicalBenefitEn: 'Peak autumn-winter US harvest matching Bengali Kochu/Lal Shak in mineral density.',
        heritageEquivalentBn: 'কচু শাক ও লাল শাকের ১:১ বিকল্প',
        heritageEquivalentEn: '1:1 Swap for Kochu Shak & Lal Shak',
        peakMonths: [1, 2, 3, 9, 10, 11, 12],
      },
      {
        id: 'us-chayote-zucchini',
        nameBn: 'চাওটে স্কোয়াশ ও গ্রিন জুচিনি (Chayote & Zucchini)',
        nameEn: 'Fresh Chayote Squash (Mirliton) & Green Zucchini',
        localMarketName: 'Chayote / Zucchini (Walmart / Kroger / Costco / H-Mart)',
        category: 'gourd_squash',
        glycemicIndex: 15,
        fiberPer100g: 2.2,
        keyMicronutrients: 'Folate 93mcg · Potassium 260mg · Vitamin C',
        clinicalBenefitBn: 'স্বাদ, টেক্সচার ও লো-জিআই মানে দেশি লাউ ও কাঁচা পেঁপের হুবহু আমেরিকান হারভেস্ট বিকল্প।',
        clinicalBenefitEn: 'Identical texture, low glycemic index (GI 15), and digestive ease to Bangladeshi Lau & Green Papaya.',
        heritageEquivalentBn: 'দেশি লাউ ও কাঁচা পেঁপের ১:১ বিকল্প',
        heritageEquivalentEn: '1:1 Swap for Bottle Gourd (Lau) & Green Papaya',
        peakMonths: [5, 6, 7, 8, 9, 10, 11],
      },
      {
        id: 'us-swiss-chard',
        nameBn: 'রেইনবো সুইস চার্ড ও বেবি স্পিনাচ (Swiss Chard & Spinach)',
        nameEn: 'Rainbow Swiss Chard & Organic Baby Spinach',
        localMarketName: 'Rainbow Chard & Baby Spinach (Whole Foods / Aldi)',
        category: 'leafy_green',
        glycemicIndex: 15,
        fiberPer100g: 2.4,
        keyMicronutrients: 'Magnesium 81mg · Betalains · Iron 2.7mg',
        clinicalBenefitBn: 'লাল শাক ও পালং শাকের সমতুল্য বিটালেইন অ্যান্টিঅক্সিডেন্ট ও ম্যাগনেসিয়াম সমৃদ্ধ।',
        clinicalBenefitEn: 'Rich in betalains and magnesium—direct culinary and clinical match for Palong & Pui Shak.',
        heritageEquivalentBn: 'পালং শাক ও পুঁই শাকের বিকল্প',
        heritageEquivalentEn: '1:1 Swap for Palong & Pui Shak',
        peakMonths: [3, 4, 5, 6, 9, 10, 11],
      },
      {
        id: 'us-broccoli-cauliflower',
        nameBn: 'ব্রকলি ও রাইসড কলিফ্লাওয়ার (Broccoli & Cauliflower)',
        nameEn: 'Fresh Broccoli Crowns & Cauliflower Florets',
        localMarketName: 'Organic Broccoli & Cauliflower (Costco / Trader Joe’s)',
        category: 'cruciferous',
        glycemicIndex: 15,
        fiberPer100g: 3.0,
        keyMicronutrients: 'Sulforaphane · Indole-3-Carbinol · Vitamin C 89mg',
        clinicalBenefitBn: 'ইনসুলিন রেজিস্ট্যান্স ও ফ্যাটি লিভার কমাতে রাতের ভাতের সেরা আমেরিকান হারভেস্ট বিকল্প।',
        clinicalBenefitEn: 'Peak cool-season cruciferous harvest for estrogen/liver detox and low-carb dinner swaps.',
        heritageEquivalentBn: 'ফুলকপি ও বাঁধাকপির বিকল্প',
        heritageEquivalentEn: 'Swap for Bengali Phulkopi & Badhakopi',
        peakMonths: [1, 2, 3, 4, 9, 10, 11, 12],
      },
      {
        id: 'us-spaghetti-butternut',
        nameBn: 'স্প্যাগেটি স্কোয়াশ ও ইয়েলো সামার স্কোয়াশ (Squash Harvest)',
        nameEn: 'Spaghetti Squash & Yellow Summer Squash',
        localMarketName: 'Spaghetti / Yellow Squash (Walmart / Whole Foods)',
        category: 'gourd_squash',
        glycemicIndex: 20,
        fiberPer100g: 2.3,
        keyMicronutrients: 'Beta-Carotene · Manganese · Vitamin B6',
        clinicalBenefitBn: 'চালকুমড়া ও মিষ্টি কুমড়ার লো-কার্ব বিকল্প হিসেবে ঝোল বা ভাজিতে দারুণ মানায়।',
        clinicalBenefitEn: 'Local North American gourd harvest ideal for Bengali jhol, labra, or low-carb noodle swaps.',
        heritageEquivalentBn: 'চালকুমড়া ও পটলের বিকল্প',
        heritageEquivalentEn: 'Swap for Chalkumra & Potol',
        peakMonths: [7, 8, 9, 10, 11, 12],
      },
    ],
  },
  {
    countryCode: 'GB',
    countryNameBn: 'যুক্তরাজ্য / ব্রিটেন (United Kingdom)',
    countryNameEn: 'United Kingdom (UK)',
    flag: '🇬🇧',
    hemisphere: 'Northern',
    vegetables: [
      {
        id: 'gb-cavolo-spring-greens',
        nameBn: 'ক্যাভোলো নেরো ও ব্রিটিশ স্প্রিং গ্রিনস (Cavolo Nero & Spring Greens)',
        nameEn: 'British Cavolo Nero (Black Kale) & Spring Greens',
        localMarketName: 'Cavolo Nero & Spring Greens (Tesco / Sainsbury’s / Waitrose)',
        category: 'leafy_green',
        glycemicIndex: 15,
        fiberPer100g: 3.8,
        keyMicronutrients: 'Folate · Iron · Calcium · Lutein',
        clinicalBenefitBn: 'রসুন ও সরিষার তেলে ভাজি করলে দেশি শাকের মতোই স্বাদ ও পুষ্টি দেয়।',
        clinicalBenefitEn: 'Hardier British leafy harvest that sautés identically to Bengali Deshi Shak with garlic & mustard oil.',
        heritageEquivalentBn: 'দেশি সর্ষে শাক ও পালং শাকের বিকল্প',
        heritageEquivalentEn: '1:1 Swap for Mustard Greens & Palong Shak',
        peakMonths: [1, 2, 3, 4, 9, 10, 11, 12],
      },
      {
        id: 'gb-courgette-marrow',
        nameBn: 'ব্রিটিশ ম্যারো ও কোর্জেট (British Marrow & Courgette)',
        nameEn: 'British Garden Marrow & Fresh Courgette',
        localMarketName: 'Courgette & Marrow (Tesco / Asda / M&S Food)',
        category: 'gourd_squash',
        glycemicIndex: 15,
        fiberPer100g: 2.0,
        keyMicronutrients: 'Potassium · Vitamin C · 94% Hydration',
        clinicalBenefitBn: 'ব্রিটিশ ম্যারো ও কোর্জেট মাছের ঝোল বা ডালের সাথে রান্না করলে একদম লাউয়ের স্বাদ দেয়।',
        clinicalBenefitEn: 'British Marrow is botanically and culinarily a direct match for Bangladeshi Bottle Gourd (Lau) in fish jhol.',
        heritageEquivalentBn: 'দেশি লাউ ও ঝিঙের ১:১ বিকল্প',
        heritageEquivalentEn: '1:1 Swap for Bottle Gourd (Lau) & Jhinge',
        peakMonths: [6, 7, 8, 9, 10, 11],
      },
      {
        id: 'gb-savoy-cauliflower',
        nameBn: 'স্যাভয় ক্যাবেজ, ব্রকলি ও ব্রিটিশ ফুলকপি (Savoy & Cauliflower)',
        nameEn: 'Savoy Cabbage, Tenderstem Broccoli & British Cauliflower',
        localMarketName: 'Tenderstem Broccoli & Cauliflower (Waitrose / Sainsbury’s)',
        category: 'cruciferous',
        glycemicIndex: 15,
        fiberPer100g: 3.1,
        keyMicronutrients: 'Glucosinolates · Vitamin C · Folate',
        clinicalBenefitBn: 'শীতকালীন ইউকে হারভেস্ট যা ডায়াবেটিস ও কোলেস্টেরল নিয়ন্ত্রণে রাখে।',
        clinicalBenefitEn: 'Year-round British brassica harvest supporting glycemic control and gut microbiome diversity.',
        heritageEquivalentBn: 'ফুলকপি ও বাঁধাকপির বিকল্প',
        heritageEquivalentEn: 'Swap for Phulkopi & Badhakopi',
        peakMonths: [1, 2, 3, 9, 10, 11, 12],
      },
      {
        id: 'gb-watercress-spinach',
        nameBn: 'ওয়াটারক্রেস ও বেবি স্পিনাচ (Watercress & Baby Spinach)',
        nameEn: 'Hampshire Watercress & Organic Baby Spinach',
        localMarketName: 'Watercress & Spinach (Tesco / Waitrose)',
        category: 'leafy_green',
        glycemicIndex: 15,
        fiberPer100g: 2.5,
        keyMicronutrients: 'Iron · Nitrates · Vitamin K · Beta-Carotene',
        clinicalBenefitBn: 'কলমি শাক ও হেলেঞ্চা শাকের সমতুল্য রক্ত পরিষ্কারক ও আয়রন সমৃদ্ধ শাক।',
        clinicalBenefitEn: 'Aquatic leafy green matching Bengali Kolmi/Helencha Shak in iron and vascular nitric oxide support.',
        heritageEquivalentBn: 'কলমি শাক ও পালং শাকের বিকল্প',
        heritageEquivalentEn: 'Swap for Kolmi Shak & Spinach',
        peakMonths: [4, 5, 6, 7, 8, 9, 10],
      },
    ],
  },
  {
    countryCode: 'CA',
    countryNameBn: 'কানাডা (Canada)',
    countryNameEn: 'Canada',
    flag: '🇨🇦',
    hemisphere: 'Northern',
    vegetables: [
      {
        id: 'ca-kale-chard',
        nameBn: 'কানাডিয়ান কেল, সুইস চার্ড ও বেবি স্পিনাচ (Kale & Chard)',
        nameEn: 'Ontario/BC Kale, Swiss Chard & Baby Spinach',
        localMarketName: 'Kale & Swiss Chard (Loblaws / Sobeys / Metro)',
        category: 'leafy_green',
        glycemicIndex: 15,
        fiberPer100g: 3.6,
        keyMicronutrients: 'Magnesium · Iron · Vitamin K1 · Folate',
        clinicalBenefitBn: 'কানাডার গ্রিনহাউস ও সিজনাল হারভেস্ট যা দেশি পালং ও লাল শাকের পুষ্টি পূরণ করে।',
        clinicalBenefitEn: 'Fresh Canadian greenhouse and field greens providing year-round folate and iron.',
        heritageEquivalentBn: 'পালং ও লাল শাকের বিকল্প',
        heritageEquivalentEn: '1:1 Swap for Palong & Lal Shak',
        peakMonths: [1, 2, 5, 6, 7, 8, 9, 10, 11, 12],
      },
      {
        id: 'ca-zucchini-fuzzy-melon',
        nameBn: 'জুচিনি, চাওটে ও ফাজি মেলন (Zucchini, Chayote & Fuzzy Melon)',
        nameEn: 'Canadian Zucchini, Chayote & Fuzzy Melon (Mo Qua)',
        localMarketName: 'Zucchini / Chayote / Fuzzy Melon (Loblaws / T&T / Chalo FreshCo)',
        category: 'gourd_squash',
        glycemicIndex: 15,
        fiberPer100g: 2.1,
        keyMicronutrients: 'Potassium · Vitamin C · Soluble Fiber',
        clinicalBenefitBn: 'ফাজি মেলন ও চাওটে স্কোয়াশ মাছের ঝোলে রান্না করলে হুবহু দেশি লাউ ও চালকুমড়ার স্বাদ দেয়।',
        clinicalBenefitEn: 'Fuzzy Melon and Chayote are widely stocked across Canada and cook identically to Lau & Chalkumra.',
        heritageEquivalentBn: 'লাউ ও চালকুমড়ার ১:১ বিকল্প',
        heritageEquivalentEn: '1:1 Swap for Lau & Chalkumra',
        peakMonths: [6, 7, 8, 9, 10, 11],
      },
      {
        id: 'ca-bokchoy-rapini',
        nameBn: 'বক চয়, রাপিনি ও ব্রকলি (Bok Choy, Rapini & Broccoli)',
        nameEn: 'Baby Bok Choy, Rapini & Canadian Broccoli',
        localMarketName: 'Baby Bok Choy & Broccoli (Costco Canada / No Frills)',
        category: 'cruciferous',
        glycemicIndex: 15,
        fiberPer100g: 2.8,
        keyMicronutrients: 'Calcium · Sulforaphane · Vitamin C',
        clinicalBenefitBn: 'হালকা ভাপিয়ে বা রসুন ফোড়নে রান্না করলে দেশি শাক ও সবজির চমৎকার বিকল্প।',
        clinicalBenefitEn: 'Low-GI brassica greens rich in bioavailable calcium and liver-protective glucosinolates.',
        heritageEquivalentBn: 'সর্ষে শাক ও ফুলকপির বিকল্প',
        heritageEquivalentEn: 'Swap for Mustard Greens & Cauliflower',
        peakMonths: [1, 2, 3, 4, 9, 10, 11, 12],
      },
    ],
  },
  {
    countryCode: 'AE',
    countryNameBn: 'মধ্যপ্রাচ্য — UAE / সৌদি আরব / কাতার (Middle East / GCC)',
    countryNameEn: 'Middle East / GCC (UAE, Saudi Arabia, Qatar)',
    flag: '🇦🇪',
    hemisphere: 'Tropical',
    vegetables: [
      {
        id: 'ae-kousa-lau',
        nameBn: 'কুসা স্কোয়াশ ও তাজা লাউ (Kousa Squash & Fresh Bottle Gourd)',
        nameEn: 'Local Kousa Marrow Squash & Fresh Bottle Gourd',
        localMarketName: 'Kousa & Fresh Lau (Lulu Hypermarket / Carrefour / Spinneys)',
        category: 'gourd_squash',
        glycemicIndex: 15,
        fiberPer100g: 2.0,
        keyMicronutrients: 'Potassium · Electrolytes · 94% Cellular Water',
        clinicalBenefitBn: 'মরুভূমির গরমে শরীর ঠান্ডা ও হাইড্রেটেড রাখতে কুসা স্কোয়াশ ও লাউ অতুলনীয়।',
        clinicalBenefitEn: 'Locally grown GCC Kousa squash and fresh Lau prevent desert dehydration and soothe gastric mucosa.',
        heritageEquivalentBn: 'দেশি লাউ ও পটলের ১:১ বিকল্প',
        heritageEquivalentEn: '1:1 Swap for Lau & Potol',
        peakMonths: [1, 2, 3, 4, 10, 11, 12],
      },
      {
        id: 'ae-molokhia-rocca',
        nameBn: 'মলোখিয়া (পাট শাক), রোক্কা ও তাজা পালং (Molokhia, Rocca & Spinach)',
        nameEn: 'Fresh Molokhia (Jute Leaves), Rocca (Arugula) & Spinach',
        localMarketName: 'Molokhia, Rocca & Palak (Lulu / Tamimi / Nesto)',
        category: 'leafy_green',
        glycemicIndex: 15,
        fiberPer100g: 3.3,
        keyMicronutrients: 'Soluble Mucilage Fiber · Iron · Magnesium · Folate',
        clinicalBenefitBn: 'আরবীয় মলোখিয়া শাক আসলে বাংলাদেশের দেশি পাট শাক! এটি কোষ্ঠকাঠিন্য ও গ্যাস্ট্রিক দূর করে।',
        clinicalBenefitEn: 'Molokhia is botanically identical to Bengali Pat Shak (Jute Mallow), rich in gut-healing prebiotic mucilage.',
        heritageEquivalentBn: 'দেশি পাট শাক ও পালং শাকের হুবহু বিকল্প',
        heritageEquivalentEn: 'Exact Match for Bengali Pat Shak & Spinach',
        peakMonths: [1, 2, 3, 4, 5, 9, 10, 11, 12],
      },
      {
        id: 'ae-cucumber-okra',
        nameBn: 'লোকাল গ্রিনহাউস শসা, ঢেঁড়স (Bamia) ও ফুলকপি',
        nameEn: 'Local Greenhouse Cucumber, Bamia (Okra) & Cauliflower',
        localMarketName: 'Local Cucumber & Bamia (Carrefour / Lulu)',
        category: 'pod_herb',
        glycemicIndex: 15,
        fiberPer100g: 2.5,
        keyMicronutrients: 'Silica · Potassium · Soluble Fiber',
        clinicalBenefitBn: 'ব্লাড সুগার কমাতে ও পানিশূন্যতা রোধে মধ্যপ্রাচ্যের তাজা বামিয়া (ঢেঁড়স) ও শসা অত্যন্ত কার্যকর।',
        clinicalBenefitEn: 'Slows post-meal glucose absorption and replenishes electrolytes in arid climates.',
        heritageEquivalentBn: 'দেশি ঢেঁড়স ও শসার সমতুল্য',
        heritageEquivalentEn: 'Match for Deshi Dherosh (Okra) & Cucumber',
        peakMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      },
    ],
  },
  {
    countryCode: 'EU',
    countryNameBn: 'ইউরোপ — জার্মানি / ফ্রান্স / ইতালি (Europe / EU)',
    countryNameEn: 'Europe / EU (Germany, France, Italy, Netherlands)',
    flag: '🇪🇺',
    hemisphere: 'Northern',
    vegetables: [
      {
        id: 'eu-kohlrabi-zucchini',
        nameBn: 'কোলরাবি (ওলকপি) ও জুচিনি (Kohlrabi & Zucchini)',
        nameEn: 'European Kohlrabi & Courgette (Zucchini)',
        localMarketName: 'Kohlrabi & Zucchini (Edeka / Rewe / Carrefour / Lidl)',
        category: 'gourd_squash',
        glycemicIndex: 15,
        fiberPer100g: 3.6,
        keyMicronutrients: 'Vitamin C 62mg · Potassium 350mg · Glucosinolates',
        clinicalBenefitBn: 'ইউরোপের সুপারমার্কেটে সহজলভ্য কোলরাবি রান্না করলে কাঁচা পেঁপে ও লাউয়ের হুবহু স্বাদ ও টেক্সচার পাওয়া যায়।',
        clinicalBenefitEn: 'Kohlrabi has the exact crisp texture, mild sweetness, and low GI of Bangladeshi Green Papaya & Lau in curries.',
        heritageEquivalentBn: 'কাঁচা পেঁপে ও লাউয়ের ১:১ বিকল্প',
        heritageEquivalentEn: '1:1 Swap for Green Papaya & Bottle Gourd',
        peakMonths: [4, 5, 6, 7, 8, 9, 10, 11],
      },
      {
        id: 'eu-mangold-spinat',
        nameBn: 'ম্যানগোল্ড (সুইস চার্ড), স্পিনাট ও গ্রুনকোল (Mangold, Spinach & Kale)',
        nameEn: 'Fresh Mangold (Swiss Chard), Spinat & Grünkohl (Kale)',
        localMarketName: 'Mangold & Blattspinat (Rewe / Aldi / Albert Heijn)',
        category: 'leafy_green',
        glycemicIndex: 15,
        fiberPer100g: 2.7,
        keyMicronutrients: 'Iron · Magnesium · Vitamin K1 · Folate',
        clinicalBenefitBn: 'ম্যানগোল্ড ও পালং শাক রসুন দিয়ে ভাজি করলে দেশি লাল শাক ও পালং শাকের পুষ্টি দেয়।',
        clinicalBenefitEn: 'Continental European leafy harvest rich in magnesium and folate for metabolic optimization.',
        heritageEquivalentBn: 'পালং শাক ও লাল শাকের বিকল্প',
        heritageEquivalentEn: 'Swap for Palong & Lal Shak',
        peakMonths: [3, 4, 5, 6, 9, 10, 11, 12],
      },
      {
        id: 'eu-fenchel-blumenkohl',
        nameBn: 'ফেনেল (মৌরি সবজি), ব্রকলি ও ফুলকপি (Fennel & Cauliflower)',
        nameEn: 'Fresh Fennel Bulb (Fenchel), Broccoli & Cauliflower',
        localMarketName: 'Fenchel & Blumenkohl (Carrefour / Edeka / Esselunga)',
        category: 'cruciferous',
        glycemicIndex: 15,
        fiberPer100g: 3.1,
        keyMicronutrients: 'Anethole Digestive Oils · Sulforaphane · Potassium',
        clinicalBenefitBn: 'গ্যাস্ট্রিক ও পেট ফাঁপা কমাতে এবং ডিনারে ভাতের বিকল্প হিসেবে ফেনেল ও ফুলকপি অসাধারণ।',
        clinicalBenefitEn: 'Carminative fennel and cruciferous florets relieve bloating and serve as grain-free dinner carbs.',
        heritageEquivalentBn: 'ফুলকপি ও চালকুমড়ার বিকল্প',
        heritageEquivalentEn: 'Swap for Cauliflower & Ash Gourd',
        peakMonths: [1, 2, 3, 9, 10, 11, 12],
      },
    ],
  },
  {
    countryCode: 'AU',
    countryNameBn: 'অস্ট্রেলিয়া ও নিউজিল্যান্ড (Australia & NZ)',
    countryNameEn: 'Australia & New Zealand',
    flag: '🇦🇺',
    hemisphere: 'Southern',
    vegetables: [
      {
        id: 'au-choko-pawpaw',
        nameBn: 'অস্ট্রেলিয়ান চোকো ও গ্রিন প’প’ (Choko & Green Pawpaw)',
        nameEn: 'Australian Choko (Chayote) & Green Pawpaw (Raw Papaya)',
        localMarketName: 'Choko, Green Pawpaw & Zucchini (Woolworths / Coles / Harris Farm)',
        category: 'gourd_squash',
        glycemicIndex: 15,
        fiberPer100g: 2.2,
        keyMicronutrients: 'Papain · Folate · Potassium · Vitamin C',
        clinicalBenefitBn: 'অস্ট্রেলিয়ায় উৎপাদিত চোকো এবং গ্রিন প’প’ দেশি লাউ ও কাঁচা পেঁপের ১০০% সমতুল্য!',
        clinicalBenefitEn: 'Locally grown Australian Choko and Green Pawpaw are exact culinary and nutritional matches for Lau & Pepe.',
        heritageEquivalentBn: 'দেশি লাউ ও কাঁচা পেঁপের হুবহু বিকল্প',
        heritageEquivalentEn: 'Exact Match for Bottle Gourd & Green Papaya',
        peakMonths: [1, 2, 3, 4, 5, 10, 11, 12],
      },
      {
        id: 'au-silverbeet-spinach',
        nameBn: 'সিলভারবিট, ইংলিশ স্পিনাচ ও এশিয়ান গ্রিনস (Silverbeet & Asian Greens)',
        nameEn: 'Australian Silverbeet, English Spinach & Choy Sum',
        localMarketName: 'Silverbeet & Baby Spinach (Woolworths / Coles / Aldi)',
        category: 'leafy_green',
        glycemicIndex: 15,
        fiberPer100g: 2.6,
        keyMicronutrients: 'Iron · Magnesium · Folate · Lutein',
        clinicalBenefitBn: 'দক্ষিণ গোলার্ধের শীত ও বসন্তে (মে–অক্টোবর) তাজা সিলভারবিট দেশি শাকের সেরা বিকল্প।',
        clinicalBenefitEn: 'Peak Southern Hemisphere cool-season greens rich in bioavailable iron and magnesium.',
        heritageEquivalentBn: 'পালং শাক ও পুঁই শাকের বিকল্প',
        heritageEquivalentEn: 'Swap for Palong & Pui Shak',
        peakMonths: [4, 5, 6, 7, 8, 9, 10],
      },
      {
        id: 'au-broccolini-cauliflower',
        nameBn: 'ব্রকলিনি ও অস্ট্রেলিয়ান ফুলকপি (Broccolini & Cauliflower)',
        nameEn: 'Australian Broccolini & Fresh Cauliflower',
        localMarketName: 'Broccolini & Cauliflower (Coles / Woolworths)',
        category: 'cruciferous',
        glycemicIndex: 15,
        fiberPer100g: 3.0,
        keyMicronutrients: 'Sulforaphane · Vitamin C · Calcium',
        clinicalBenefitBn: 'রাতের লো-কার্ব ডিনারে ভাতের বদলে স্টিমড ব্রকলিনি ও ফুলকপি রাইস আদর্শ।',
        clinicalBenefitEn: 'Low-glycemic Southern winter brassica harvest ideal for metabolic dinner bowls.',
        heritageEquivalentBn: 'ফুলকপি ও সজনে ডাটার বিকল্প',
        heritageEquivalentEn: 'Swap for Cauliflower & Tender Stems',
        peakMonths: [5, 6, 7, 8, 9, 10],
      },
    ],
  },
];

function getSeasonMetadata(
  month: number,
  hemisphere: 'Northern' | 'Southern' | 'Tropical'
): {
  code: 'Spring' | 'Summer' | 'Monsoon_Autumn' | 'Winter';
  nameBn: string;
  nameEn: string;
} {
  if (hemisphere === 'Southern') {
    if (month >= 6 && month <= 8) {
      return {
        code: 'Winter',
        nameBn: 'দক্ষিণ গোলার্ধের শীতকালীন হারভেস্ট (Southern Winter Harvest)',
        nameEn: 'Southern Hemisphere Winter Harvest',
      };
    }
    if (month >= 9 && month <= 11) {
      return {
        code: 'Spring',
        nameBn: 'দক্ষিণ গোলার্ধের বসন্তকালীন হারভেস্ট (Southern Spring Harvest)',
        nameEn: 'Southern Hemisphere Spring Harvest',
      };
    }
    if (month === 12 || month <= 2) {
      return {
        code: 'Summer',
        nameBn: 'দক্ষিণ গোলার্ধের গ্রীষ্মকালীন হারভেস্ট (Southern Summer Harvest)',
        nameEn: 'Southern Hemisphere Summer Harvest',
      };
    }
    return {
      code: 'Monsoon_Autumn',
      nameBn: 'দক্ষিণ গোলার্ধের শরৎকালীন হারভেস্ট (Southern Autumn Harvest)',
      nameEn: 'Southern Hemisphere Autumn Harvest',
    };
  }

  if (hemisphere === 'Tropical') {
    if (month >= 11 || month <= 2) {
      return {
        code: 'Winter',
        nameBn: 'শীতকালীন তাজা মৌসুমি সবজি (Peak Winter Harvest)',
        nameEn: 'Peak Tropical Cool/Winter Harvest',
      };
    }
    if (month >= 3 && month <= 5) {
      return {
        code: 'Summer',
        nameBn: 'গ্রীষ্মকালীন হাইড্রেটিং সবজি (Summer Hydrating Harvest)',
        nameEn: 'Summer Hydrating Gourd & Greens Harvest',
      };
    }
    return {
      code: 'Monsoon_Autumn',
      nameBn: 'বর্ষা ও শরৎকালীন মৌসুমি সবজি (Monsoon & Autumn Harvest)',
      nameEn: 'Monsoon & Autumn Local Harvest',
    };
  }

  // Northern Hemisphere (US, GB, CA, EU, etc.)
  if (month >= 11 || month <= 2) {
    return {
      code: 'Winter',
      nameBn: 'উত্তর গোলার্ধের শীতকালীন হারভেস্ট (Northern Winter Harvest)',
      nameEn: 'Northern Winter Brassica & Root Harvest',
    };
  }
  if (month >= 3 && month <= 5) {
    return {
      code: 'Spring',
      nameBn: 'বসন্তকালীন তাজা শাক ও সবজি (Spring Tender Greens Harvest)',
      nameEn: 'Spring Tender Greens & Herb Harvest',
    };
  }
  if (month >= 6 && month <= 8) {
    return {
      code: 'Summer',
      nameBn: 'গ্রীষ্মকালীন স্কোয়াশ ও গার্ডেন হারভেস্ট (Summer Squash & Garden Harvest)',
      nameEn: 'Peak Summer Squash & Leafy Harvest',
    };
  }
  return {
    code: 'Monsoon_Autumn',
    nameBn: 'শরৎকালীন হারভেস্ট (Autumn Harvest)',
    nameEn: 'Peak Autumn Harvest (Kale, Squash, Crucifers)',
  };
}

/**
 * Resolves the Local Harvest Seasonal Snapshot for any country code or custom country name.
 */
export function getLocalHarvestSnapshotForCountry(
  countryCodeOrName?: string,
  targetMonth?: number
): LocalHarvestCountrySeasonSnapshot {
  const norm = (countryCodeOrName || 'BD').trim();
  const currentMonth = targetMonth || new Date().getMonth() + 1;

  let matched = LOCAL_HARVEST_COUNTRY_CATALOG.find(
    (c) =>
      c.countryCode.toLowerCase() === norm.toLowerCase() ||
      c.countryNameEn.toLowerCase().includes(norm.toLowerCase()) ||
      c.countryNameBn.includes(norm)
  );

  // Map IN -> BD/Tropical, EA/MED/LATAM -> closest seasonal profile if not explicitly separate
  if (!matched) {
    if (norm.toUpperCase() === 'IN' || norm.toUpperCase() === 'EA') {
      matched = {
        ...LOCAL_HARVEST_COUNTRY_CATALOG[0],
        countryCode: norm.toUpperCase(),
        countryNameBn: norm.toUpperCase() === 'IN' ? 'ভারত (India)' : 'পূর্ব ও দক্ষিণ-পূর্ব এশিয়া (East & SE Asia)',
        countryNameEn: norm.toUpperCase() === 'IN' ? 'India' : 'East & Southeast Asia',
        flag: norm.toUpperCase() === 'IN' ? '🇮🇳' : '🇯🇵',
      };
    } else if (norm.toUpperCase() === 'MED') {
      matched = {
        ...LOCAL_HARVEST_COUNTRY_CATALOG[5], // EU/Mediterranean
        countryCode: 'MED',
        countryNameBn: 'মেডিটেরানিয়ান অঞ্চল (Mediterranean)',
        countryNameEn: 'Mediterranean Region',
        flag: '🇬🇷',
      };
    } else if (norm.toUpperCase() === 'LATAM') {
      matched = {
        ...LOCAL_HARVEST_COUNTRY_CATALOG[1], // Chayote, Zucchini, Spinach, Greens
        countryCode: 'LATAM',
        countryNameBn: 'ল্যাটিন আমেরিকা (Latin America)',
        countryNameEn: 'Latin America',
        flag: '🇲🇽',
      };
    } else {
      matched = {
        ...LOCAL_HARVEST_COUNTRY_CATALOG[1],
        countryCode: norm.toUpperCase().slice(0, 6) || 'GLOBAL',
        countryNameBn: norm,
        countryNameEn: norm,
        flag: '🌍',
      };
    }
  }

  const seasonMeta = getSeasonMetadata(currentMonth, matched.hemisphere);

  // Filter vegetables currently in their peak harvest month; if fewer than 2 match, include all
  const inSeasonVeg = matched.vegetables.filter((v) =>
    v.peakMonths.includes(currentMonth)
  );
  const prioritizedVegetables =
    inSeasonVeg.length >= 2 ? inSeasonVeg : matched.vegetables;

  const topNamesBn = prioritizedVegetables.map((v) => v.nameBn).join(' · ');
  const topNamesEn = prioritizedVegetables.map((v) => v.nameEn).join(' · ');

  return {
    countryCode: matched.countryCode,
    countryNameBn: matched.countryNameBn,
    countryNameEn: matched.countryNameEn,
    flag: matched.flag,
    hemisphere: matched.hemisphere,
    activeSeasonCode: seasonMeta.code,
    activeSeasonNameBn: seasonMeta.nameBn,
    activeSeasonNameEn: seasonMeta.nameEn,
    currentMonth,
    harvestHighlightBn: `🌱 লোকাল হারভেস্ট (${matched.countryNameBn} — ${seasonMeta.nameBn}): ডায়েট চার্টে বর্তমানে স্থানীয়ভাবে উৎপাদিত মৌসুমি সবজি (${topNamesBn}) অগ্রাধিকার দেওয়া হয়েছে।`,
    harvestHighlightEn: `🌱 Local Harvest Priority (${matched.countryNameEn} — ${seasonMeta.nameEn}): Diet Chart prioritizes peak-season local vegetables (${topNamesEn}).`,
    prioritizedVegetables,
    allCountryHarvestVegetables: matched.vegetables,
    cachedAt: new Date().toISOString(),
  };
}

/**
 * Returns the complete multi-country Local Harvest Database dictionary so the Service Worker
 * can cache all countries offline at `/offline-cache/local-harvest-db.json`.
 */
export function getAllCountriesLocalHarvestDatabase(
  targetMonth?: number
): Record<string, LocalHarvestCountrySeasonSnapshot> {
  const db: Record<string, LocalHarvestCountrySeasonSnapshot> = {};
  const codes = ['BD', 'US', 'GB', 'CA', 'AE', 'EU', 'AU', 'IN', 'EA', 'MED', 'LATAM'];
  codes.forEach((code) => {
    db[code] = getLocalHarvestSnapshotForCountry(code, targetMonth);
  });
  return db;
}

/**
 * Enriches a DietPhaseChart so its daily meals, Food Exchange Table, and Weather/Seasonal
 * notes actively prioritize the user's Current Country's in-season Local Harvest vegetables.
 */
export function prioritizeDietChartWithLocalHarvest(
  chart: DietPhaseChart,
  residenceCountryCodeOrName: string,
  lang: Language,
  cachedSnapshot?: LocalHarvestCountrySeasonSnapshot | null
): DietPhaseChart {
  const isBn = lang === 'bn';
  const harvestSnap =
    cachedSnapshot &&
    cachedSnapshot.countryCode.toLowerCase() ===
      (residenceCountryCodeOrName || 'BD').trim().toLowerCase()
      ? cachedSnapshot
      : getLocalHarvestSnapshotForCountry(residenceCountryCodeOrName);

  const seasonalVegs = harvestSnap.prioritizedVegetables;
  if (!seasonalVegs || seasonalVegs.length === 0) {
    return { ...chart, localHarvestSnapshot: harvestSnap };
  }

  const leafyPicks = seasonalVegs.filter((v) => v.category === 'leafy_green');
  const gourdAndCruciferPicks = seasonalVegs.filter(
    (v) => v.category === 'gourd_squash' || v.category === 'cruciferous' || v.category === 'pod_herb'
  );

  const updatedWeeklySchedule = (chart.weeklySchedule || []).map((dayPlan, dIdx) => ({
    ...dayPlan,
    meals: (dayPlan.meals || []).map((meal, mIdx) => {
      // Pick 2 seasonal vegetables rotated by day and meal slot
      const primaryPick =
        mIdx === 1 && leafyPicks.length > 0
          ? leafyPicks[dIdx % leafyPicks.length]
          : gourdAndCruciferPicks[(dIdx + mIdx) % Math.max(1, gourdAndCruciferPicks.length)] ||
            seasonalVegs[(dIdx + mIdx) % seasonalVegs.length];

      const secondaryPick =
        seasonalVegs[(dIdx + mIdx + 1) % seasonalVegs.length];

      const mealHarvestList =
        primaryPick && secondaryPick && primaryPick.id !== secondaryPick.id
          ? [primaryPick, secondaryPick]
          : primaryPick
          ? [primaryPick]
          : [];

      // Also enrich localSupermarketSwap if present so seasonal harvest is front-and-center
      const updatedSwap = meal.localSupermarketSwap
        ? {
            ...meal.localSupermarketSwap,
            equivalentItems: `${meal.localSupermarketSwap.equivalentItems} · 🌱 ${
              isBn ? 'মৌসুমি লোকাল হারভেস্ট অগ্রাধিকার:' : 'Seasonal Local Harvest Priority:'
            } ${mealHarvestList
              .map((v) => (isBn ? `${v.nameBn} [${v.localMarketName}]` : `${v.nameEn} [${v.localMarketName}]`))
              .join(', ')}`,
          }
        : undefined;

      return {
        ...meal,
        localHarvestSeasonalVeg: mealHarvestList,
        localSupermarketSwap: updatedSwap,
      };
    }),
  }));

  const updatedFoodExchangeTable = chart.foodExchangeTable
    ? chart.foodExchangeTable.map((row) => {
        const isVegRow = /শাক|সবজি|লাউ|পেঁপে|vegetable|green|gourd|carb/i.test(
          `${row.category} ${row.primaryFood}`
        );
        return {
          ...row,
          localHarvestSeasonalVeg: isVegRow ? seasonalVegs.slice(0, 3) : row.localHarvestSeasonalVeg,
        };
      })
    : undefined;

  const harvestRec = isBn
    ? harvestSnap.harvestHighlightBn
    : harvestSnap.harvestHighlightEn;

  const existingRecs = Array.isArray(chart.recommendations) ? chart.recommendations : [];
  const updatedRecs = existingRecs.some((r) => r.includes('🌱'))
    ? existingRecs
    : [harvestRec, ...existingRecs];

  return {
    ...chart,
    weeklySchedule: updatedWeeklySchedule,
    foodExchangeTable: updatedFoodExchangeTable,
    recommendations: updatedRecs,
    localHarvestSnapshot: harvestSnap,
  };
}
