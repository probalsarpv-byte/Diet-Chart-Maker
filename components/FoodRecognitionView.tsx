import React, { useState } from 'react';
import { HealthProfile, Language, FoodItem } from '../types';
import { GeminiService } from '../services/geminiService';
import { translations } from '../i18n';

interface Props {
  profile: HealthProfile | null;
  lang: Language;
  darkMode?: boolean;
}

interface EnrichedFoodItem extends FoodItem {
  icon: string;
  glycemicTagBn: string;
  glycemicTagEn: string;
}

const INSTANT_BFCT_GLOSSARY: Record<
  string,
  { bn: EnrichedFoodItem[]; en: EnrichedFoodItem[] }
> = {
  fruits: {
    bn: [
      {
        icon: '🍐',
        name: 'দেশি পেয়ারা (Guava)',
        glycemicTagBn: 'লো গ্লাইসেমিক · GI 12',
        glycemicTagEn: 'Low GI · 12',
        description:
          'বাংলাদেশের অন্যতম সেরা লো-গ্লাইসেমিক ও উচ্চ ফাইবার সমৃদ্ধ ফল। ডায়াবেটিস, ফ্যাটি লিভার ও কোষ্ঠকাঠিন্য দূর করতে অত্যন্ত কার্যকর।',
        benefits: [
          'কমলালেবুর চেয়ে ৪ গুণ বেশি ভিটামিন-সি সমৃদ্ধ',
          'রক্তে শর্করার হঠাৎ বৃদ্ধি (Glucose Spike) রোধ করে',
          'গাট মাইক্রোবায়োম ও হজমশক্তি উন্নত করে',
        ],
        ayurvedicProperty: 'কষায় ও মধুর রস · শীত বীর্য · ত্রিদোষ নাশক (বিশেষত পিত্ত ও কফ প্রশমনকারী)',
        nutrition: 'উচ্চ ডায়েটারি ফাইবার, ভিটামিন সি, পটাশিয়াম ও লাইকোপেন অ্যান্টিঅক্সিডেন্ট সমৃদ্ধ।',
        composition: {
          energy: '68 kcal',
          protein: '2.5 g',
          fat: '0.9 g',
          carbohydrate: '14.3 g',
          fiber: '5.4 g',
          iron: '0.3 mg',
          calcium: '18 mg',
        },
      },
      {
        icon: '🍏',
        name: 'আমলকী (Amla / Indian Gooseberry)',
        glycemicTagBn: 'রসায়ন ফল · GI 15',
        glycemicTagEn: 'Rasayana · GI 15',
        description:
          'আয়ুর্বেদে শ্রেষ্ঠ রসায়ন (Rejuvenator)। লিভার ডিটক্স, চুল ও ত্বকের স্বাস্থ্য এবং ইনসুলিন সংবেদনশীলতা বাড়াতে অতুলনীয়।',
        benefits: [
          'লিভারের টক্সিন পরিষ্কার ও মেটাবলিজম বৃদ্ধি করে',
          'হাইপোঅ্যাসিডিটি ও হজমের দুর্বলতা দূর করে',
          'রোগ প্রতিরোধ ক্ষমতা ও কোলাজেন সংশ্লেষণ বাড়ায়',
        ],
        ayurvedicProperty: 'পঞ্চরস যুক্ত (অম্ল প্রধান) · শীত বীর্য · মধুর বিপাক · ত্রিদোষ সাম্যকারী',
        nutrition: 'বায়ো-অ্যাভেইলেবল ভিটামিন সি, পলিফেনল, গ্যালিক অ্যাসিড ও ট্যানিন সমৃদ্ধ।',
        composition: {
          energy: '44 kcal',
          protein: '0.9 g',
          fat: '0.6 g',
          carbohydrate: '10.2 g',
          fiber: '4.3 g',
          iron: '1.2 mg',
          calcium: '25 mg',
        },
      },
      {
        icon: '🫐',
        name: 'কালোজাম (Black Plum / Jamun)',
        glycemicTagBn: 'অ্যান্টি-ডায়াবেটিক · GI 25',
        glycemicTagEn: 'Anti-Diabetic · GI 25',
        description:
          'জাম্বোলিন ও জাম্বোসিন উপাদান সমৃদ্ধ দেশি মৌসুমি ফল, যা স্টার্চকে শক্তিতে রূপান্তর করে ব্লাড সুগার নিয়ন্ত্রণে রাখে।',
        benefits: [
          'অগ্ন্যাশয়ের বিটা কোষের কার্যকারিতা উন্নত করে',
          'অ্যান্থোসায়ানিন প্রদাহ ও অক্সিডেটিভ স্ট্রেস কমায়',
          'রক্ত পরিষ্কারক ও হিমোগ্লোবিন বৃদ্ধিতে সহায়ক',
        ],
        ayurvedicProperty: 'কষায় ও মধুর রস · শীত বীর্য · কফ ও পিত্ত নাশক',
        nutrition: 'অ্যান্থোসায়ানিন, আয়রন, পটাশিয়াম, ভিটামিন এ এবং সি সমৃদ্ধ।',
        composition: {
          energy: '60 kcal',
          protein: '0.7 g',
          fat: '0.2 g',
          carbohydrate: '14.0 g',
          fiber: '1.9 g',
          iron: '1.4 mg',
          calcium: '19 mg',
        },
      },
      {
        icon: '🍊',
        name: 'জাম্বুরা / বাতাবি লেবু (Pomelo)',
        glycemicTagBn: 'লিভার ডিটক্স · GI 30',
        glycemicTagEn: 'Liver Detox · GI 30',
        description:
          'সাইট্রাস ফ্ল্যাভোনয়েড (Naringenin) সমৃদ্ধ দেশি ফল, যা ফ্যাটি লিভার ও ট্রাইগ্লিসারাইড কমাতে সাহায্য করে।',
        benefits: [
          'লিভারে চর্বি জমা (Fatty Liver) প্রতিরোধ করে',
          'উচ্চ পটাশিয়াম রক্তচাপ নিয়ন্ত্রণে রাখে',
          'হজম এনজাইম সক্রিয় করে ও ক্ষুধা নিয়ন্ত্রণ করে',
        ],
        ayurvedicProperty: 'মধুর ও অম্ল রস · ঈষৎ উষ্ণ · বাত ও কফ প্রশমনকারী',
        nutrition: 'ভিটামিন সি, নারিনজেনিন, পটাশিয়াম ও সলিউবল ফাইবার সমৃদ্ধ।',
        composition: {
          energy: '38 kcal',
          protein: '0.8 g',
          fat: '0.1 g',
          carbohydrate: '9.6 g',
          fiber: '1.8 g',
          iron: '0.2 mg',
          calcium: '12 mg',
        },
      },
      {
        icon: '🍎',
        name: 'ডালিম / আনার (Pomegranate)',
        glycemicTagBn: 'গাট ও হার্ট হেলথ · GI 35',
        glycemicTagEn: 'Gut & Heart · GI 35',
        description:
          'পুনিক্যালাগিন অ্যান্টিঅক্সিডেন্ট সমৃদ্ধ ফল যা অন্ত্রের উপকারী ব্যাকটেরিয়া (Akkermansia) বৃদ্ধি করে এবং রক্তস্বল্পতা দূর করে।',
        benefits: [
          'হিমোগ্লোবিন ও রক্ত সঞ্চালন উন্নত করে',
          'অন্ত্রের মিউকোসাল লাইনিং ও গাট হেলথ মেরামত করে',
          'হৃদযন্ত্রের ধমনীর প্রদাহ কমায়',
        ],
        ayurvedicProperty: 'মধুর-কষায় রস · অনুষ্ণ বীর্য · ত্রিদোষঘ্ন ও হৃদযন্ত্রের বলকারক (হৃদ্য)',
        nutrition: 'পলিফেনল, এলাজিক অ্যাসিড, আয়রন, ফোলেট ও ভিটামিন কে সমৃদ্ধ।',
        composition: {
          energy: '83 kcal',
          protein: '1.7 g',
          fat: '1.2 g',
          carbohydrate: '18.7 g',
          fiber: '4.0 g',
          iron: '0.3 mg',
          calcium: '10 mg',
        },
      },
      {
        icon: '🍈',
        name: 'পাকা পেঁপে (Ripe Papaya)',
        glycemicTagBn: 'ডাইজেস্টিভ এনজাইম · GI 55',
        glycemicTagEn: 'Digestive Enzyme · GI 55',
        description:
          'প্যাপেইন এনজাইম সমৃদ্ধ সহজপাচ্য ফল, যা প্রোটিন হজমে সাহায্য করে এবং লিভার ও পেটের প্রদাহ কমায়।',
        benefits: [
          'প্যাপেইন এনজাইম গ্যাস ও বদহজম দূর করে',
          'বিটা-ক্যারোটিন ও ভিটামিন-এ চোখের জ্যোতি বাড়ায়',
          'কোষ্ঠকাঠিন্য দূর করে ও অন্ত্র পরিষ্কার রাখে',
        ],
        ayurvedicProperty: 'মধুর রস · ঈষৎ উষ্ণ বীর্য · বাত ও কফ নাশক',
        nutrition: 'প্যাপেইন, লাইকোপেন, ভিটামিন এ, সি এবং ফোলেট সমৃদ্ধ।',
        composition: {
          energy: '43 kcal',
          protein: '0.5 g',
          fat: '0.3 g',
          carbohydrate: '10.8 g',
          fiber: '1.7 g',
          iron: '0.3 mg',
          calcium: '20 mg',
        },
      },
      {
        icon: '🥥',
        name: 'ডাবের পানি ও শাঁস (Tender Coconut)',
        glycemicTagBn: 'ন্যাচারাল ইলেক্ট্রোলাইট · GI 35',
        glycemicTagEn: 'Electrolyte · GI 35',
        description:
          'প্রাকৃতিক পটাশিয়াম, ম্যাগনেসিয়াম ও ইলেক্ট্রোলাইটের সেরা উৎস। শরীরের অ্যালকালাইন ব্যালেন্স ও আর্দ্রতা বজায় রাখে।',
        benefits: [
          'অ্যাসিডিটি ও বুক জ্বালাপোড়া তাৎক্ষণিক কমায়',
          'কিডনি পরিষ্কার রাখে ও ইউরিনারি ট্র্যাক্ট সুস্থ রাখে',
          'ক্লান্তি ও ডিহাইড্রেশন দূর করে',
        ],
        ayurvedicProperty: 'মধুর রস · শীত বীর্য · পিত্ত ও বাত প্রশমনকারী',
        nutrition: 'পটাশিয়াম, সোডিয়াম, ম্যাগনেসিয়াম ও সাইটোকাইনিন সমৃদ্ধ।',
        composition: {
          energy: '24 kcal',
          protein: '0.7 g',
          fat: '0.2 g',
          carbohydrate: '4.8 g',
          fiber: '1.1 g',
          iron: '0.3 mg',
          calcium: '24 mg',
        },
      },
      {
        icon: '🍋',
        name: 'কাগজি লেবু (Bengali Key Lime)',
        glycemicTagBn: 'অ্যালকালাইজিং · GI 10',
        glycemicTagEn: 'Alkalizing · GI 10',
        description:
          'হাইপোঅ্যাসিডিটি দূর করতে এবং ভারী খাবারের আগে গ্যাস্ট্রিক জুস ও পিত্তরস নিঃসরণ বাড়াতে অপরিহার্য।',
        benefits: [
          'খাবার থেকে আয়রন ও ক্যালসিয়াম শোষণ বৃদ্ধি করে',
          'লিভারের বাইল ফ্লো ও ফ্যাট বিপাক উন্নত করে',
          'শরীরের অ্যালকালাইন রিজার্ভ উন্নত করে',
        ],
        ayurvedicProperty: 'অম্ল রস · উষ্ণ বীর্য · অগ্নিদীপক ও পাচক',
        nutrition: 'সাইট্রিক অ্যাসিড, ভিটামিন সি, হেসপেরিডিন ও ফ্ল্যাভোনয়েড সমৃদ্ধ।',
        composition: {
          energy: '29 kcal',
          protein: '1.1 g',
          fat: '0.3 g',
          carbohydrate: '9.3 g',
          fiber: '2.8 g',
          iron: '0.6 mg',
          calcium: '26 mg',
        },
      },
    ],
    en: [],
  },
  vegetables: {
    bn: [
      {
        icon: '🥒',
        name: 'লাউ / দুধ লাউ (Bottle Gourd)',
        glycemicTagBn: 'রাতের সেরা সবজি শর্করা · GI 15',
        glycemicTagEn: 'Night Veg Carb · GI 15',
        description:
          'রাতে ভাত বা রুটির বদলে শস্যবিহীন শর্করা (Vegetable Carb) হিসেবে লাউ সিদ্ধ বা লাউ ঝোল পেট ঠান্ডা রাখে এবং ইনসুলিন বাড়তে দেয় না।',
        benefits: [
          '৯২% জলীয় অংশ ও সলিউবল ফাইবার হজম সহজ করে',
          'লিভার প্রদাহ ও ফ্যাটি লিভার কমাতে অত্যন্ত কার্যকর',
          'রাতে খেলে গভীর ঘুম ও ওজন হ্রাসে সহায়তা করে',
        ],
        ayurvedicProperty: 'মধুর রস · শীত বীর্য · লঘু পাচ্য · পিত্ত ও বাত নাশক (হৃদ্য)',
        nutrition: 'কোলিন, ভিটামিন সি, পটাশিয়াম, জিংক ও সলিউবল ফাইবার সমৃদ্ধ।',
        composition: {
          energy: '15 kcal',
          protein: '0.6 g',
          fat: '0.1 g',
          carbohydrate: '3.4 g',
          fiber: '1.2 g',
          iron: '0.2 mg',
          calcium: '26 mg',
        },
      },
      {
        icon: '🍈',
        name: 'কাঁচা পেঁপে (Green Unripe Papaya)',
        glycemicTagBn: 'রাতের সবজি শর্করা ও গাট হিলার · GI 20',
        glycemicTagEn: 'Gut Healer · GI 20',
        description:
          'কাঁচা পেঁপে সিদ্ধ বা ঝোল প্রোটিন হজমে সহায়তা করে এবং রাতে শস্যবিহীন শর্করা হিসেবে অন্ত্রের প্রদাহ কমায়।',
        benefits: [
          'প্রাকৃতিক প্যাপেইন ও কাইমোপ্যাপেইন এনজাইম সমৃদ্ধ',
          'গ্যাস্ট্রিক, আইবিএস (IBS) ও ব্লোটিং কমাতে সেরা',
          'লিভার এনজাইম (SGPT/SGOT) স্বাভাবিক রাখতে সাহায্য করে',
        ],
        ayurvedicProperty: 'কটু-তিক্ত রস · লঘু · অগ্নিদীপক ও কফ-বাত নাশক',
        nutrition: 'প্যাপেইন এনজাইম, পটাশিয়াম, ম্যাগনেসিয়াম ও প্রি-বায়োটিক ফাইবার সমৃদ্ধ।',
        composition: {
          energy: '27 kcal',
          protein: '0.7 g',
          fat: '0.2 g',
          carbohydrate: '5.7 g',
          fiber: '1.9 g',
          iron: '0.5 mg',
          calcium: '28 mg',
        },
      },
      {
        icon: '🥬',
        name: 'লাল শাক ও পালং শাক (Leafy Greens)',
        glycemicTagBn: 'মাইক্রোনিউট্রিয়েন্ট পাওয়ারহাউস · GI 15',
        glycemicTagEn: 'Micronutrient Rich · GI 15',
        description:
          'সকালের নাস্তায় ডিম ও সিডের সাথে বা দুপুরে হালকা ভাপে রান্না করা শাক আয়রন, ফোলেট ও ম্যাগনেসিয়ামের ঘাটতি পূরণ করে।',
        benefits: [
          'রক্তস্বল্পতা (Anemia) দূর করতে প্রাকৃতিক আয়রনের উৎস',
          'অন্ত্রের পেরিস্টালসিস ও মাইক্রোবায়োম উন্নত করে',
          'নাইট্রেট উপাদান রক্তনালী প্রসারিত করে রক্তচাপ কমায়',
        ],
        ayurvedicProperty: 'মধুর ও কষায় রস · শীত বীর্য · রক্তবর্ধক',
        nutrition: 'আয়রন, ক্যালসিয়াম, ফোলেট, ভিটামিন এ, সি এবং কে সমৃদ্ধ।',
        composition: {
          energy: '28 kcal',
          protein: '3.0 g',
          fat: '0.4 g',
          carbohydrate: '4.1 g',
          fiber: '2.2 g',
          iron: '4.6 mg',
          calcium: '165 mg',
        },
      },
      {
        icon: '🥒',
        name: 'করলা / উচ্ছে (Bitter Gourd)',
        glycemicTagBn: 'ন্যাচারাল ইনসুলিন সেন্সিটাইজার · GI 15',
        glycemicTagEn: 'Insulin Sensitizer · GI 15',
        description:
          'চারান্টিন ও পলিপেপটাইড-পি (উদ্ভিজ্জ ইনসুলিন) সমৃদ্ধ সবজি, যা কোষের ইনসুলিন রেজিস্ট্যান্স কমাতে সরাসরি কাজ করে।',
        benefits: [
          'অগ্ন্যাশয় থেকে ইনসুলিন নিঃসরণ ও গ্লুকোজ গ্রহণ বাড়ায়',
          'লিভার ও রক্ত পরিষ্কার করে চর্মরোগ প্রতিরোধ করে',
          'কৃমি ও অন্ত্রের ক্ষতিকর পরজীবী দূর করে',
        ],
        ayurvedicProperty: 'তিক্ত ও কটু রস · লঘু · কফ ও পিত্ত নাশক, প্রমেহঘ্ন (ডায়াবেটিস নাশক)',
        nutrition: 'চারান্টিন, ভিসিন, ভিটামিন সি, ফোলেট ও জিংক সমৃদ্ধ।',
        composition: {
          energy: '25 kcal',
          protein: '1.6 g',
          fat: '0.2 g',
          carbohydrate: '4.3 g',
          fiber: '2.8 g',
          iron: '0.8 mg',
          calcium: '20 mg',
        },
      },
      {
        icon: '🥦',
        name: 'ফুলকপি ও ব্রকলি (Cauliflower / Broccoli)',
        glycemicTagBn: 'ভাতের বিকল্প (Cauliflower Rice) · GI 15',
        glycemicTagEn: 'Low-Carb Rice Swap · GI 15',
        description:
          'সালফোরাফেন সমৃদ্ধ ক্রুসিফেরাস সবজি। গ্রেট করে হালকা ভাপে ভাতের বিকল্প (ফুলকপির রাইস) হিসেবে রাতে বা দুপুরে খাওয়া যায়।',
        benefits: [
          'লিভারের ফেজ-২ ডিটক্সিফিকেশন সক্রিয় করে',
          'ইস্ট্রোজেন ডমিন্যান্স ও হরমোনাল ভারসাম্যহীনতা কমায়',
          'ভাতের তুলনায় ৭৫% কম কার্বোহাইড্রেট সম্পন্ন',
        ],
        ayurvedicProperty: 'কষায় ও মধুর রস · লঘু (মশলা ও আদা সহ রান্না করলে বাত বাড়ে না)',
        nutrition: 'সালফোরাফেন, ইনডোল-৩-কার্বিনল, ভিটামিন সি, কে এবং ফাইবার সমৃদ্ধ।',
        composition: {
          energy: '25 kcal',
          protein: '1.9 g',
          fat: '0.3 g',
          carbohydrate: '5.0 g',
          fiber: '2.0 g',
          iron: '0.4 mg',
          calcium: '22 mg',
        },
      },
      {
        icon: '🌿',
        name: 'সজনে ডাটা ও পাতা (Moringa Drumstick)',
        glycemicTagBn: 'সুপারফুড ও অ্যান্টি-ইনফ্ল্যামেটরি · GI 15',
        glycemicTagEn: 'Anti-Inflammatory · GI 15',
        description:
          'বাংলাদেশের অন্যতম পুষ্টিকর সুপারফুড। জয়েন্টের ব্যথা, প্রদাহ, থাইরয়েড ও উচ্চ রক্তচাপ নিয়ন্ত্রণে অনন্য।',
        benefits: [
          'দুধের চেয়ে বেশি ক্যালসিয়াম ও প্রচুর অ্যান্টিঅক্সিডেন্ট সমৃদ্ধ',
          'আইসোথায়োসায়ানেট উপাদান প্রদাহ ও ব্লাড সুগার কমায়',
          'রোগ প্রতিরোধ ক্ষমতা ও হাড়ের ঘনত্ব বৃদ্ধি করে',
        ],
        ayurvedicProperty: 'কটু ও তিক্ত রস · উষ্ণ বীর্য · কফ ও বাত নাশক',
        nutrition: 'ক্যালসিয়াম, আয়রন, ভিটামিন এ, সি, পটাশিয়াম ও অ্যামিনো অ্যাসিড সমৃদ্ধ।',
        composition: {
          energy: '37 kcal',
          protein: '2.1 g',
          fat: '0.2 g',
          carbohydrate: '8.5 g',
          fiber: '3.2 g',
          iron: '0.4 mg',
          calcium: '30 mg',
        },
      },
      {
        icon: '🫑',
        name: 'ঢেঁড়স (Okra / Lady Finger)',
        glycemicTagBn: 'মিউসিলেজ গাট প্রোটেক্টর · GI 20',
        glycemicTagEn: 'Gut Mucilage · GI 20',
        description:
          'প্রাকৃতিক মিউসিলেজ ও সলিউবল ফাইবার সমৃদ্ধ সবজি, যা অন্ত্র থেকে কোলেস্টেরল ও অতিরিক্ত সুগার শোষণে বাধা দেয়।',
        benefits: [
          'অন্ত্রের দেয়ালে সুরক্ষা আবরণ তৈরি করে গ্যাস্ট্রিক কমায়',
          'এলডিএল (LDL) কোলেস্টেরল বাইল অ্যাসিডের সাথে বের করে দেয়',
          'ফোলেট ও ভিটামিন কে সমৃদ্ধ',
        ],
        ayurvedicProperty: 'মধুর রস · শীত বীর্য · বাত ও পিত্ত প্রশমনকারী',
        nutrition: 'সলিউবল ফাইবার, ফোলেট, ম্যাগনেসিয়াম ও ভিটামিন সি সমৃদ্ধ।',
        composition: {
          energy: '33 kcal',
          protein: '1.9 g',
          fat: '0.2 g',
          carbohydrate: '7.5 g',
          fiber: '3.2 g',
          iron: '0.6 mg',
          calcium: '82 mg',
        },
      },
      {
        icon: '🍌',
        name: 'কাঁচা কলা / আনাজি কলা (Green Plantain)',
        glycemicTagBn: 'রেজিস্ট্যান্ট স্টার্চ · GI 35',
        glycemicTagEn: 'Resistant Starch · GI 35',
        description:
          'রেজিস্ট্যান্ট স্টার্চ ও পেকটিন সমৃদ্ধ দেশি সবজি, যা কোলনের উপকারী ব্যাকটেরিয়ার খাদ্য (Prebiotic) হিসেবে কাজ করে।',
        benefits: [
          'ডায়রিয়া, আইবিএস-ডি (IBS-D) ও দুর্বল অন্ত্র নিরাময় করে',
          'হিমোগ্লোবিন ও আয়রনের ঘাটতি পূরণ করে',
          'দীর্ঘক্ষণ পেট ভরা রাখে ও মেটাবলিজম স্থির রাখে',
        ],
        ayurvedicProperty: 'কষায় ও মধুর রস · শীত বীর্য · গ্রাহী (অন্ত্র সংযতকারী) ও রক্তপিত্ত নাশক',
        nutrition: 'রেজিস্ট্যান্ট স্টার্চ, পটাশিয়াম, ভিটামিন বি৬ ও আয়রন সমৃদ্ধ।',
        composition: {
          energy: '64 kcal',
          protein: '1.4 g',
          fat: '0.2 g',
          carbohydrate: '14.0 g',
          fiber: '2.3 g',
          iron: '0.6 mg',
          calcium: '10 mg',
        },
      },
    ],
    en: [],
  },
  lentils: {
    bn: [
      {
        icon: '🥣',
        name: 'মুগ ডাল (Split Yellow Moong Dal)',
        glycemicTagBn: 'সবচেয়ে সহজপাচ্য উদ্ভিজ্জ প্রোটিন · GI 38',
        glycemicTagEn: 'Most Digestible Lentil · GI 38',
        description:
          'আয়ুর্বেদে সকল ডালের মধ্যে মুগ ডালকে শ্রেষ্ঠ বলা হয়েছে কারণ এটি গ্যাস বা ব্লোটিং তৈরি না করেই উচ্চমানের উদ্ভিজ্জ প্রোটিন দেয়।',
        benefits: [
          'গাট ডিটক্স ও দুর্বল হজমশক্তিতে সবচেয়ে নিরাপদ প্রোটিন',
          'ফোলেট, ম্যাগনেসিয়াম ও পটাশিয়ামে ভরপুর',
          'রক্তের কোলেস্টেরল ও প্রদাহ কমাতে সহায়ক',
        ],
        ayurvedicProperty: 'কষায় ও মধুর রস · লঘু · শীত বীর্য · ত্রিদোষ সাম্যকারী (বিশেষত কফ ও পিত্ত নাশক)',
        nutrition: 'উদ্ভিজ্জ প্রোটিন, ফোলেট, ম্যাঙ্গানিজ, ভিটামিন বি১ ও ডায়েটারি ফাইবার সমৃদ্ধ।',
        composition: {
          energy: '348 kcal',
          protein: '24.5 g',
          fat: '1.2 g',
          carbohydrate: '59.9 g',
          fiber: '8.2 g',
          iron: '3.9 mg',
          calcium: '75 mg',
        },
      },
      {
        icon: '🍲',
        name: 'মসুর ডাল (Red Lentils / Masoor Dal)',
        glycemicTagBn: 'উচ্চ প্রোটিন ও আয়রন · GI 32',
        glycemicTagEn: 'High Protein & Iron · GI 32',
        description:
          'বাঙালির প্রতিদিনের খাদ্যতালিকার প্রধান উদ্ভিজ্জ প্রোটিন। লেবু ও শাকসবজির সাথে খেলে এর আয়রন সহজে শোষিত হয়।',
        benefits: [
          'প্রতি ১০০ গ্রামে প্রায় ২৫ গ্রাম প্রোটিন প্রদান করে',
          'কম গ্লাইসেমিক ইনডেক্স হওয়ায় সাদা ভাতের গ্লাইসেমিক লোড কমায়',
          'হৃদযন্ত্রের সুস্থতা ও পেশি গঠনে কার্যকর',
        ],
        ayurvedicProperty: 'মধুর ও কষায় রস · লঘু · শীত বীর্য · কফ ও পিত্ত প্রশমনকারী',
        nutrition: 'প্রোটিন, পলিফেনল, আয়রন, ফোলেট ও জিংক সমৃদ্ধ।',
        composition: {
          energy: '343 kcal',
          protein: '25.1 g',
          fat: '0.7 g',
          carbohydrate: '59.0 g',
          fiber: '10.7 g',
          iron: '7.5 mg',
          calcium: '69 mg',
        },
      },
      {
        icon: '🌾',
        name: 'ঢেঁকিছাঁটা লাল চালের ভাত (Brown / Red Cargo Rice)',
        glycemicTagBn: 'কমপ্লেক্স কার্বোহাইড্রেট · GI 50',
        glycemicTagEn: 'Complex Grain Carb · GI 50',
        description:
          'কুঁড়াসহ লাল চালে ভিটামিন বি-কমপ্লেক্স, ম্যাগনেসিয়াম ও ফাইবার অক্ষুণ্ণ থাকে, যা সাদা ভাতের মতো দ্রুত ব্লাড সুগার বাড়ায় না।',
        benefits: [
          'দীর্ঘস্থায়ী শক্তি দেয় এবং বারবার মিষ্টি খাওয়ার ক্রেভিং কমায়',
          'সেলেনিয়াম ও ম্যাঙ্গানিজ থাইরয়েড ও মেটাবলিজম উন্নত করে',
          'অন্ত্রের চলাচল স্বাভাবিক রাখে',
        ],
        ayurvedicProperty: 'মধুর রস · স্নিগ্ধ · বলকারক ও পিত্ত প্রশমনকারী (রক্তশালী)',
        nutrition: 'ফাইবার, ভিটামিন বি১, বি৩, বি৬, ম্যাগনেসিয়াম ও ফসফরাস সমৃদ্ধ।',
        composition: {
          energy: '346 kcal',
          protein: '7.9 g',
          fat: '2.7 g',
          carbohydrate: '72.0 g',
          fiber: '3.8 g',
          iron: '1.8 mg',
          calcium: '23 mg',
        },
      },
      {
        icon: '⚪',
        name: 'ভাজা মাখনা / পদ্মবীজ (Roasted Fox Nuts / Makhana)',
        glycemicTagBn: 'সেরা ক্লিনিক্যাল নাস্তা · GI 35',
        glycemicTagEn: 'Low-GI Clinical Snack · GI 35',
        description:
          'বিকেলের নাস্তায় বা শর্করার বিকল্প হিসেবে সামান্য ঘি ও হিমালয়ান পিংক সল্টে ভাজা মাখনা অত্যন্ত পুষ্টিকর ও গ্লুটেন-মুক্ত।',
        benefits: [
          'ক্যাম্পফেরল ফ্ল্যাভোনয়েড কোষের বার্ধক্য ও প্রদাহ রোধ করে',
          'কম সোডিয়াম ও উচ্চ পটাশিয়াম রক্তচাপ নিয়ন্ত্রণে রাখে',
          'ডায়াবেটিস ও কিডনি রোগীদের জন্য নিরাপদ হালকা নাস্তা',
        ],
        ayurvedicProperty: 'মধুর ও কষায় রস · শীত বীর্য · বৃষ্য ও বলকারক · বাত-পিত্ত নাশক',
        nutrition: 'ক্যালসিয়াম, ম্যাগনেসিয়াম, উদ্ভিজ্জ প্রোটিন ও অ্যান্টিঅক্সিডেন্ট সমৃদ্ধ।',
        composition: {
          energy: '347 kcal',
          protein: '9.7 g',
          fat: '0.1 g',
          carbohydrate: '76.9 g',
          fiber: '7.6 g',
          iron: '1.4 mg',
          calcium: '60 mg',
        },
      },
      {
        icon: '🫘',
        name: 'দেশি ছোলা / বুট (Bengal Gram / Chickpeas)',
        glycemicTagBn: 'স্লো-রিলিজ এনার্জি · GI 28',
        glycemicTagEn: 'Slow-Release Carb & Protein · GI 28',
        description:
          'সারা রাত ভিজিয়ে রেখে সিদ্ধ করা দেশি ছোলা প্রোটিন ও সলিউবল ফাইবারের চমৎকার উৎস।',
        benefits: [
          'রক্তে কোলেস্টেরল ও ফাস্টিং সুগার নিয়ন্ত্রণে রাখে',
          'দীর্ঘ সময় পেট ভরা রাখে ও পেশির ক্ষয় রোধ করে',
          'আয়রন ও ফোলেট রক্তস্বল্পতা দূর করে',
        ],
        ayurvedicProperty: 'কষায় রস · রুক্ষ · শীত বীর্য · কফ ও পিত্ত নাশক (আদা ও জিরা সহ ভক্ষণীয়)',
        nutrition: 'প্রোটিন, রেজিস্ট্যান্ট স্টার্চ, আয়রন, জিংক ও ফোলেট সমৃদ্ধ।',
        composition: {
          energy: '360 kcal',
          protein: '17.1 g',
          fat: '5.3 g',
          carbohydrate: '60.9 g',
          fiber: '12.2 g',
          iron: '4.6 mg',
          calcium: '150 mg',
        },
      },
      {
        icon: '🌾',
        name: 'রোলড ওটস (Whole Rolled Oats)',
        glycemicTagBn: 'বিটা-গ্লুকান ফাইবার · GI 51',
        glycemicTagEn: 'Beta-Glucan Rich · GI 51',
        description:
          'ইনস্ট্যান্ট ওটসের বদলে রোলড ওটস সবজি ও ডিমের সাথে খিচুড়ি বা পরিজ হিসেবে খেলে বিটা-গ্লুকান ফাইবার পাওয়া যায়।',
        benefits: [
          'বিটা-গ্লুকান ফাইবার এলডিএল (LDL) কোলেস্টেরল কমায়',
          'গাট ব্যাকটেরিয়ার জন্য প্রি-বায়োটিক হিসেবে কাজ করে',
          'সকাল বা দুপুরের খাবারে দীর্ঘস্থায়ী শক্তি দেয়',
        ],
        ayurvedicProperty: 'মধুর রস · স্নিগ্ধ · গুরু · বাত প্রশমনকারী',
        nutrition: 'বিটা-গ্লুকান, ম্যাঙ্গানিজ, ফসফরাস, ম্যাগনেসিয়াম ও প্রোটিন সমৃদ্ধ।',
        composition: {
          energy: '379 kcal',
          protein: '13.2 g',
          fat: '6.5 g',
          carbohydrate: '67.7 g',
          fiber: '10.1 g',
          iron: '4.3 mg',
          calcium: '52 mg',
        },
      },
    ],
    en: [],
  },
  herbs: {
    bn: [
      {
        icon: '🫚',
        name: 'কাঁচা আদা (Fresh Ginger / Shunti)',
        glycemicTagBn: 'বিশ্বভেষজ (হজম ও প্রদাহ নাশক)',
        glycemicTagEn: 'Universal Digestive Herb',
        description:
          'আয়ুর্বেদে আদাকে "বিশ্বভেষজ" বলা হয়। ভারী খাবারের আগে আদা, লেবু ও হিমালয়ান পিংক সল্ট শট হাইপোঅ্যাসিডিটি দূর করে।',
        benefits: [
          'গ্যাস্ট্রিক মোটিলিটি ও পাচক এনজাইম নিঃসরণ বাড়ায়',
          'জিঞ্জেরল উপাদান জয়েন্টের ব্যথা ও প্রদাহ কমায়',
          'বমি ভাব, গ্যাস ও পেট ফাঁপা (Bloating) দূর করে',
        ],
        ayurvedicProperty: 'কটু রস · উষ্ণ বীর্য · মধুর বিপাক · অগ্নিদীপক, পাচক ও বাত-কফ নাশক',
        nutrition: 'জিঞ্জেরল, শোগাওল, পটাশিয়াম, ম্যাগনেসিয়াম ও ম্যাঙ্গানিজ সমৃদ্ধ।',
        composition: {
          energy: '80 kcal',
          protein: '1.8 g',
          fat: '0.8 g',
          carbohydrate: '17.8 g',
          fiber: '2.0 g',
          iron: '0.6 mg',
          calcium: '16 mg',
        },
      },
      {
        icon: '🟡',
        name: 'কাঁচা হলুদ (Curcumin / Raw Turmeric)',
        glycemicTagBn: 'অ্যান্টি-ইনফ্ল্যামেটরি ও লিভার প্রোটেক্টর',
        glycemicTagEn: 'Systemic Anti-Inflammatory',
        description:
          'কারকিউমিন সমৃদ্ধ প্রাকৃতিক অ্যান্টি-ইনফ্ল্যামেটরি ভেষজ। গোলমরিচ ও সামান্য ঘি/তেলের সাথে খেলে এর শোষণ ২০০০% বৃদ্ধি পায়।',
        benefits: [
          'শরীরের দীর্ঘমেয়াদী প্রদাহ (CRP) ও ফ্যাটি লিভার কমায়',
          'ইনসুলিন রিসেপ্টর সংবেদনশীলতা উন্নত করে',
          'রক্ত পরিষ্কারক ও রোগ প্রতিরোধ ক্ষমতা বৃদ্ধিকারী',
        ],
        ayurvedicProperty: 'তিক্ত ও কটু রস · উষ্ণ বীর্য · কফ-পিত্ত নাশক, প্রমেহঘ্ন ও বর্ণ্য',
        nutrition: 'কারকিউমিনয়েডস, টারমেরোন, আয়রন ও ম্যাঙ্গানিজ সমৃদ্ধ।',
        composition: {
          energy: '312 kcal',
          protein: '9.7 g',
          fat: '3.3 g',
          carbohydrate: '67.1 g',
          fiber: '22.7 g',
          iron: '55.0 mg',
          calcium: '168 mg',
        },
      },
      {
        icon: '🌱',
        name: 'মেথি দানা (Fenugreek Seeds / Methi)',
        glycemicTagBn: 'গ্লুকোজ ও লিপিড ব্যালেন্সার',
        glycemicTagEn: 'Glucose & Lipid Regulator',
        description:
          '৪-হাইড্রক্সি-আইসোলিউসিন ও গ্যালাক্টোম্যানান ফাইবার সমৃদ্ধ বীজ, যা সকালের ডিটক্স ওয়াটার হিসেবে ডায়াবেটিস ও পিসিওএস (PCOS) নিয়ন্ত্রণে অদ্বিতীয়।',
        benefits: [
          'অন্ত্র থেকে শর্করা ও কোলেস্টেরল শোষণের গতি কমায়',
          'ফাস্টিং ব্লাড সুগার ও HbA1c কমাতে ক্লিনিক্যালি প্রমাণিত',
          'চুল পড়া রোধ ও হরমোনের ভারসাম্য বজায় রাখে',
        ],
        ayurvedicProperty: 'তিক্ত রস · উষ্ণ বীর্য · বাত ও কফ নাশক, অগ্নিদীপক',
        nutrition: 'গ্যালাক্টোম্যানান সলিউবল ফাইবার, প্রোটিন, আয়রন ও ম্যাগনেসিয়াম সমৃদ্ধ।',
        composition: {
          energy: '323 kcal',
          protein: '23.0 g',
          fat: '6.4 g',
          carbohydrate: '58.4 g',
          fiber: '24.6 g',
          iron: '33.5 mg',
          calcium: '176 mg',
        },
      },
      {
        icon: '⚫',
        name: 'কালোজিরা (Nigella Sativa / Black Seed)',
        glycemicTagBn: 'থাইমোকুইনোন ইমিউন মডুলেটর',
        glycemicTagEn: 'Thymoquinone Immune Herb',
        description:
          'থাইমোকুইনোন (Thymoquinone) সমৃদ্ধ মহৌষধি বীজ, যা অটোইমিউন প্রদাহ, অ্যালার্জি, থাইরয়েড ও মেটাবলিক সিনড্রোমে কার্যকর।',
        benefits: [
          'থাইরয়েড গ্রন্থির কার্যকারিতা ও মেটাবলিজম উন্নত করে',
          'শ্বাসতন্ত্রের প্রদাহ, সাইনাস ও অ্যালার্জি কমায়',
          'ট্রাইগ্লিসারাইড ও রক্তচাপ নিয়ন্ত্রণে সহায়তা করে',
        ],
        ayurvedicProperty: 'কটু ও তিক্ত রস · উষ্ণ বীর্য · কফ ও বাত নাশক, মেধ্য ও পাচক',
        nutrition: 'থাইমোকুইনোন, ওমেগা-৬ ও ওমেগা-৯ ফ্যাটি অ্যাসিড, জিংক ও আয়রন সমৃদ্ধ।',
        composition: {
          energy: '345 kcal',
          protein: '16.0 g',
          fat: '22.0 g',
          carbohydrate: '44.0 g',
          fiber: '10.5 g',
          iron: '18.5 mg',
          calcium: '570 mg',
        },
      },
      {
        icon: '🌿',
        name: 'চিয়া সিড ও তিসি বীজ (Chia & Flax Seeds)',
        glycemicTagBn: 'ওমেগা-৩ ও সলিউবল ফাইবার সোর্স',
        glycemicTagEn: 'Plant Omega-3 & Fiber',
        description:
          'সকালের নাস্তায় ভেজানো চিয়া সিড বা ভাজা তিসি গুঁড়া উদ্ভিজ্জ ওমেগা-৩ (ALA) এবং লিগনানের চমৎকার উৎস।',
        benefits: [
          'এইচডিএল (HDL) ভালো কোলেস্টেরল বাড়ায় ও প্রদাহ কমায়',
          'মিউসিলেজ ফাইবার কোষ্ঠকাঠিন্য দূর করে ও গাট পরিষ্কার রাখে',
          'হরমোনাল ব্যালেন্স ও ত্বকের উজ্জ্বলতা উন্নত করে',
        ],
        ayurvedicProperty: 'মধুর ও তিক্ত রস · স্নিগ্ধ · বাত প্রশমনকারী',
        nutrition: 'আলফা-লিনোলেনিক অ্যাসিড (Omega-3), ডায়েটারি ফাইবার, ক্যালসিয়াম ও ম্যাগনেসিয়াম সমৃদ্ধ।',
        composition: {
          energy: '486 kcal',
          protein: '16.5 g',
          fat: '30.7 g',
          carbohydrate: '42.1 g',
          fiber: '34.4 g',
          iron: '7.7 mg',
          calcium: '631 mg',
        },
      },
      {
        icon: '🪵',
        name: 'সিলন দারুচিনি ও জিরা (Cinnamon & Cumin)',
        glycemicTagBn: 'ইনসুলিন মিমিক ও ডাইজেস্টিভ ইনফিউশন',
        glycemicTagEn: 'Insulin Mimetic & Digestive',
        description:
          'দারুচিনির সিনামালডিহাইড কোষে ইনসুলিনের মতো কাজ করে গ্লুকোজ ঢোকাতে সাহায্য করে এবং জিরা হজম এনজাইম বাড়ায়।',
        benefits: [
          'খাবারের পর ব্লাড সুগার স্পাইক কমাতে অত্যন্ত কার্যকর',
          'পিসিওএস (PCOS) ও ইনসুলিন রেজিস্ট্যান্স কমায়',
          'রাতে জিরা-ধনিয়া-মৌরি পানি পেট ফাঁপা ও অ্যাসিডিটি দূর করে',
        ],
        ayurvedicProperty: 'কটু, তিক্ত ও মধুর রস · উষ্ণ বীর্য · কফ ও বাত নাশক',
        nutrition: 'সিনামালডিহাইড, পলিফেনল, কিউমিনালডিহাইড, আয়রন ও ক্যালসিয়াম সমৃদ্ধ।',
        composition: {
          energy: '247 kcal',
          protein: '4.0 g',
          fat: '1.2 g',
          carbohydrate: '80.6 g',
          fiber: '53.1 g',
          iron: '8.3 mg',
          calcium: '1002 mg',
        },
      },
    ],
    en: [],
  },
  animal_sourced: {
    bn: [
      {
        icon: '🐟',
        name: 'দেশি রুই ও কাতলা মাছ (Rohu & Catla Fish)',
        glycemicTagBn: 'হাই-বায়োঅ্যাভেইলেবল প্রোটিন · GI 0',
        glycemicTagEn: 'Lean River Fish Protein · GI 0',
        description:
          'বাঙালির প্রধান প্রাণিজ প্রোটিন। লাল মাংসের তুলনায় অত্যন্ত সহজপাচ্য এবং ওমেগা-৩ ও সম্পূর্ণ অ্যামিনো অ্যাসিড সমৃদ্ধ।',
        benefits: [
          'পেশি গঠন ও মেটাবলিক রেট (BMR) বজায় রাখতে সেরা প্রোটিন',
          'ওমেগা-৩ ফ্যাটি অ্যাসিড মস্তিষ্ক ও হৃদযন্ত্র সুস্থ রাখে',
          'ভিটামিন ডি, সেলেনিয়াম ও ফসফরাসের চমৎকার উৎস',
        ],
        ayurvedicProperty: 'মধুর রস · স্নিগ্ধ · বলকারক ও বাত প্রশমনকারী (হালকা ঝোলে রান্না)',
        nutrition: 'উচ্চমানের প্রোটিন, EPA/DHA ওমেগা-৩, ভিটামিন বি১২ ও সেলেনিয়াম সমৃদ্ধ।',
        composition: {
          energy: '97 kcal',
          protein: '16.6 g',
          fat: '1.4 g',
          carbohydrate: '0.0 g',
          fiber: '0.0 g',
          iron: '1.0 mg',
          calcium: '650 mg',
        },
      },
      {
        icon: '🐠',
        name: 'শিং, মাগুর ও পাবদা মাছ (Catfish & Pabda)',
        glycemicTagBn: 'ক্লিনিক্যাল রিকভারি ও রক্তবর্ধক · GI 0',
        glycemicTagEn: 'Clinical Recovery Protein · GI 0',
        description:
          'কম চর্বি এবং উচ্চ আয়রন ও জিঙ্ক সমৃদ্ধ দেশি জিওল মাছ। দুর্বলতা, রক্তস্বল্পতা ও অসুস্থতা পরবর্তী আরোগ্যে আদর্শ।',
        benefits: [
          'অত্যন্ত সহজপাচ্য (Low Fat, High Protein) — লিভার ও পেটের ওপর চাপ ফেলে না',
          'হিমোগ্লোবিন ও রক্তকণিকা গঠনে সরাসরি সাহায্য করে',
          'রাতের খাবারে পেঁপে বা লাউ ঝোলের সাথে সেরা প্রোটিন',
        ],
        ayurvedicProperty: 'মধুর রস · লঘু ও স্নিগ্ধ · রক্তবর্ধক, বলকারক ও ত্রিদোষ অনুকূল',
        nutrition: 'সম্পূর্ণ প্রোটিন, হিম-আয়রন, জিংক, ক্যালসিয়াম ও ভিটামিন বি১২ সমৃদ্ধ।',
        composition: {
          energy: '92 kcal',
          protein: '18.2 g',
          fat: '1.1 g',
          carbohydrate: '0.0 g',
          fiber: '0.0 g',
          iron: '2.1 mg',
          calcium: '380 mg',
        },
      },
      {
        icon: '🥚',
        name: 'দেশি মুরগি বা হাঁসের ডিম (Whole Egg)',
        glycemicTagBn: 'কমপ্লিট প্রোটিন ও কোলিন · GI 0',
        glycemicTagEn: 'Complete Amino Profile · GI 0',
        description:
          'সকালের নাস্তায় শাকসবজি ও সিডসের সাথে ১–২টি সিদ্ধ বা পোচ ডিম সারাদিনের রক্তের শর্করা ও ক্ষুধা হরমোন (Ghrelin) স্থির রাখে।',
        benefits: [
          'কোলিন (Choline) ফ্যাটি লিভার দূর করতে ও মস্তিষ্কের স্নায়ু সচল রাখতে অপরিহার্য',
          'সকল ৯টি অত্যাবশ্যকীয় অ্যামিনো অ্যাসিড শতভাগ শোষিত হয়',
          'লুটেইন ও জিয়াজ্যান্থিন চোখের রেটিনা সুরক্ষিত রাখে',
        ],
        ayurvedicProperty: 'মধুর রস · স্নিগ্ধ · বল্য ও ধাতুবর্ধক',
        nutrition: 'উচ্চমানের প্রোটিন, কোলিন, ভিটামিন ডি, বি১২, সেলেনিয়াম ও স্বাস্থ্যকর ফ্যাট সমৃদ্ধ।',
        composition: {
          energy: '143 kcal',
          protein: '12.6 g',
          fat: '9.5 g',
          carbohydrate: '0.7 g',
          fiber: '0.0 g',
          iron: '1.8 mg',
          calcium: '56 mg',
        },
      },
      {
        icon: '🍗',
        name: 'দেশি মুরগির মাংস — চামড়া ছাড়া (Free-Range Chicken)',
        glycemicTagBn: 'লিন প্রোটিন · GI 0',
        glycemicTagEn: 'Lean Animal Protein · GI 0',
        description:
          'ব্রয়লার মুরগির পরিবর্তে দেশি মুরগির চামড়া ছাড়া মাংস অ্যান্টিবায়োটিক ও অতিরিক্ত প্রদাহজনক ফ্যাট মুক্ত উচ্চ প্রোটিন প্রদান করে।',
        benefits: [
          'প্রতি ১০০ গ্রামে ২৪–২৬ গ্রাম বিশুদ্ধ প্রোটিন পাওয়া যায়',
          'ট্রিপটোফ্যান ও ভিটামিন বি৬ মানসিক শক্তি ও ঘুম উন্নত করে',
          'লাউ বা পেঁপে দিয়ে পাতলা ঝোল করে দুপুরে বা রাতে খাওয়ার উপযোগী',
        ],
        ayurvedicProperty: 'মধুর রস · লঘু-স্নিগ্ধ · বৃংহণ ও বাত নাশক',
        nutrition: 'লিন প্রোটিন, নিয়াসিন (B3), ভিটামিন বি৬, ফসফরাস ও জিংক সমৃদ্ধ।',
        composition: {
          energy: '119 kcal',
          protein: '24.7 g',
          fat: '1.9 g',
          carbohydrate: '0.0 g',
          fiber: '0.0 g',
          iron: '1.1 mg',
          calcium: '15 mg',
        },
      },
      {
        icon: '🥛',
        name: 'বাড়িতে পাতা টক দই ও ছানা (Probiotic Sour Curd & Chhena)',
        glycemicTagBn: 'প্রোবায়োটিক ও ক্যালসিয়াম · GI 28',
        glycemicTagEn: 'Live Probiotic · GI 28',
        description:
          'চিনি ছাড়া বাড়িতে পাতা টক দই বা ঘোল (Buttermilk) অন্ত্রের উপকারী ল্যাকটোব্যাসিলাস ব্যাকটেরিয়া বৃদ্ধি করে।',
        benefits: [
          'গাট মাইক্রোবায়োম ও হজমশক্তি শক্তিশালী করে',
          'ক্যালসিয়াম, ফসফরাস ও ভিটামিন বি১২ এর সহজলভ্য উৎস',
          'দুপুরের খাবারের পর টক দইয়ের ঘোল ব্লাড সুগার ও অ্যাসিডিটি কমায়',
        ],
        ayurvedicProperty: 'অম্ল-মধুর রস · দীপন ও গ্রাহী (দুপুরে ভক্ষণীয়, রাতে দই বর্জনীয়)',
        nutrition: 'লাইভ প্রোবায়োটিক কালচার, ক্যালসিয়াম, প্রোটিন ও ভিটামিন বি১২ সমৃদ্ধ।',
        composition: {
          energy: '61 kcal',
          protein: '3.5 g',
          fat: '3.3 g',
          carbohydrate: '4.7 g',
          fiber: '0.0 g',
          iron: '0.1 mg',
          calcium: '121 mg',
        },
      },
      {
        icon: '🧈',
        name: 'দেশি গরুর খাঁটি ঘি (Pure Grass-Fed Desi Ghee)',
        glycemicTagBn: 'বিউটারিক অ্যাসিড ও হেলদি ফ্যাট · GI 0',
        glycemicTagEn: 'Butyric Acid Lipid · GI 0',
        description:
          'দৈনিক ৫–১০ গ্রাম দেশি ঘি অন্ত্রের কোষ মেরামত করে এবং ভাতের গ্লাইসেমিক ইনডেক্স কমাতে সাহায্য করে।',
        benefits: [
          'বিউটারিক অ্যাসিড (Butyrate) লিকি গাট ও কোলনের প্রদাহ নিরাময় করে',
          'চর্বিতে দ্রবণীয় ভিটামিন (A, D, E, K2) শোষণে সাহায্য করে',
          'মস্তিষ্কের মেধা (Medhya) ও জয়েন্টের লুব্রিকেশন বজায় রাখে',
        ],
        ayurvedicProperty: 'মধুর রস · শীত বীর্য · অগ্নিদীপক, মেধ্য, চক্ষুষ্য ও বাত-পিত্ত নাশক',
        nutrition: 'শর্ট-চেইন ফ্যাটি অ্যাসিড (Butyrate), CLA, ভিটামিন এ, ডি, ই এবং কে২ সমৃদ্ধ।',
        composition: {
          energy: '900 kcal',
          protein: '0.0 g',
          fat: '99.5 g',
          carbohydrate: '0.0 g',
          fiber: '0.0 g',
          iron: '0.0 mg',
          calcium: '0 mg',
        },
      },
    ],
    en: [],
  },
};

const FoodRecognitionView: React.FC<Props> = ({ profile, lang, darkMode }) => {
  const t = translations[lang];
  const isBn = lang === 'bn';

  // Screen 1: selectedCategory === null (Overall Categories Screen)
  // Screen 2: selectedCategory !== null (Dedicated Category Full List Screen)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  // Popup Modal State: selectedFood !== null opens the Popup Modal
  const [selectedFood, setSelectedFood] = useState<EnrichedFoodItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [customAiFoods, setCustomAiFoods] = useState<Record<string, EnrichedFoodItem[]>>({});
  const [aiLoading, setAiLoading] = useState(false);

  const gemini = new GeminiService();

  const categories = [
    {
      id: 'fruits',
      label: t.fruits,
      subtitleBn: 'পেয়ারা, আমলকী, কালোজাম, জাম্বুরা, ডালিম ও দেশি ফল',
      subtitleEn: 'Guava, Amla, Jamun, Pomelo, Pomegranate & Local Fruits',
      icon: '🍉',
      accent: 'from-rose-500/15 to-orange-500/10 border-rose-500/30',
      count: INSTANT_BFCT_GLOSSARY.fruits.bn.length,
    },
    {
      id: 'vegetables',
      label: t.vegetables,
      subtitleBn: 'লাউ, কাঁচা পেঁপে, লাল শাক, করলা, ফুলকপি ও সজনে',
      subtitleEn: 'Bottle Gourd, Green Papaya, Leafy Greens, Bitter Gourd & Moringa',
      icon: '🥦',
      accent: 'from-emerald-500/15 to-teal-500/10 border-emerald-500/30',
      count: INSTANT_BFCT_GLOSSARY.vegetables.bn.length,
    },
    {
      id: 'lentils',
      label: t.lentils,
      subtitleBn: 'মুগ ডাল, মসুর ডাল, লাল চাল, মাখনা, ছোলা ও ওটস',
      subtitleEn: 'Moong Dal, Masoor Dal, Red Cargo Rice, Makhana & Chickpeas',
      icon: '🍲',
      accent: 'from-amber-500/15 to-yellow-500/10 border-amber-500/30',
      count: INSTANT_BFCT_GLOSSARY.lentils.bn.length,
    },
    {
      id: 'herbs',
      label: t.herbs,
      subtitleBn: 'আদা, কাঁচা হলুদ, মেথি, কালোজিরা, চিয়া সিড ও দারুচিনি',
      subtitleEn: 'Ginger, Raw Turmeric, Fenugreek, Black Seed, Chia & Cinnamon',
      icon: '🌿',
      accent: 'from-green-500/15 to-lime-500/10 border-green-500/30',
      count: INSTANT_BFCT_GLOSSARY.herbs.bn.length,
    },
    {
      id: 'animal_sourced',
      label: t.animal_food,
      subtitleBn: 'রুই মাছ, শিং-মাগুর, দেশি ডিম, দেশি মুরগি, টক দই ও ঘি',
      subtitleEn: 'River Fish, Catfish, Free-Range Eggs, Chicken, Probiotic Curd & Ghee',
      icon: '🐟',
      accent: 'from-indigo-500/15 to-blue-500/10 border-indigo-500/30',
      count: INSTANT_BFCT_GLOSSARY.animal_sourced.bn.length,
    },
  ];

  const handleOpenCategory = (catId: string) => {
    setSelectedCategory(catId);
    setSelectedFood(null);
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToAllCategories = () => {
    setSelectedFood(null);
    setSelectedCategory(null);
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFetchMoreFromAI = async () => {
    if (!selectedCategory || aiLoading) return;
    setAiLoading(true);
    try {
      const results = await gemini.fetchLocalFoods(profile, selectedCategory, lang);
      const enriched: EnrichedFoodItem[] = results.map((r) => ({
        ...r,
        icon: categories.find((c) => c.id === selectedCategory)?.icon || '🥗',
        glycemicTagBn: 'ক্লিনিক্যাল ডাটাবেস',
        glycemicTagEn: 'Clinical Entry',
      }));
      setCustomAiFoods((prev) => ({
        ...prev,
        [selectedCategory]: [...(prev[selectedCategory] || []), ...enriched],
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  const getTranslatedCompLabel = (key: string) => {
    const map: Record<string, string> = {
      energy: t.comp_energy,
      protein: t.comp_protein,
      fat: t.comp_fat,
      carbohydrate: t.comp_carbs,
      fiber: t.comp_fiber,
      iron: t.comp_iron,
      calcium: t.comp_calcium,
    };
    return map[key.toLowerCase()] || key;
  };

  const activeCategoryMeta = categories.find((c) => c.id === selectedCategory);
  const baseFoods = selectedCategory
    ? INSTANT_BFCT_GLOSSARY[selectedCategory]?.bn || []
    : [];
  const extraFoods = selectedCategory ? customAiFoods[selectedCategory] || [] : [];
  const allCategoryFoods = [...baseFoods, ...extraFoods].filter((f) =>
    !searchQuery.trim()
      ? true
      : f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300 pb-24 md:pb-12 px-2 md:px-4">
      {/* =================================================================== */}
      {/* SCREEN 1: OVERALL FOOD CATEGORIES INTERFACE                         */}
      {/* =================================================================== */}
      {!selectedCategory && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Compact Glossary Header */}
          <div
            className={`p-6 md:p-8 rounded-3xl border text-center ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div
              className={`w-14 h-14 md:w-16 md:h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl mb-3 shadow-md ${
                darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'
              }`}
            >
              📖
            </div>
            <h2
              className={`text-2xl md:text-4xl font-bold serif italic mb-1.5 ${
                darkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              {t.food_rec_title}
            </h2>
            <p
              className={`text-xs md:text-sm max-w-xl mx-auto ${
                darkMode ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              {isBn
                ? 'যেকোনো ক্যাটাগরিতে ক্লিক করলে সাথে সাথে সেই খাবারের সম্পূর্ণ তালিকা খুলে যাবে এবং প্রতিটি খাবারে ক্লিক করলে পপআপ আকারে পুষ্টিগুণ ও আয়ুর্বেদিক ডাটাবেস দেখতে পাবেন।'
                : t.food_rec_subtitle}
            </p>
          </div>

          {/* Unified Category Grid (Desktop 3+2 / Mobile 2-Column) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleOpenCategory(cat.id)}
                className={`group p-5 md:p-6 rounded-3xl border text-left transition-all hover:scale-[1.02] active:scale-95 flex flex-col justify-between gap-4 bg-gradient-to-br ${
                  cat.accent
                } ${
                  darkMode
                    ? 'bg-slate-900 hover:border-indigo-500/60'
                    : 'bg-white shadow-sm hover:border-indigo-400'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm ${
                      darkMode ? 'bg-slate-800' : 'bg-white'
                    }`}
                  >
                    {cat.icon}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-mono font-bold ${
                      darkMode
                        ? 'bg-slate-800 text-emerald-400'
                        : 'bg-white text-emerald-700 shadow-sm'
                    }`}
                  >
                    {cat.count}+ {isBn ? 'খাবার' : 'Items'}
                  </span>
                </div>

                <div>
                  <h3
                    className={`text-lg md:text-xl font-bold serif italic ${
                      darkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {cat.label}
                  </h3>
                  <p className="text-xs opacity-75 mt-1 leading-relaxed">
                    {isBn ? cat.subtitleBn : cat.subtitleEn}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200/50 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  <span>{isBn ? 'তালিকা ও ডাটাবেস দেখুন' : 'Open Category List'}</span>
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SCREEN 2: FULL CATEGORY FOOD LIST (REPLACES CATEGORY SCREEN)        */}
      {/* =================================================================== */}
      {selectedCategory && activeCategoryMeta && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Top Navigation Bar with Back Button & Quick Category Switcher */}
          <div
            className={`p-4 md:p-5 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-3 sticky top-16 z-30 backdrop-blur-md ${
              darkMode
                ? 'bg-slate-900/95 border-slate-800'
                : 'bg-white/95 border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleBackToAllCategories}
                className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 transition-all active:scale-95 ${
                  darkMode
                    ? 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700'
                    : 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm'
                }`}
              >
                <span>←</span>
                <span>{isBn ? 'ব্যাক (সব খাবার)' : 'Back to Categories'}</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-2xl">{activeCategoryMeta.icon}</span>
                <div>
                  <h2 className="text-base md:text-xl font-bold serif italic leading-tight">
                    {activeCategoryMeta.label}
                  </h2>
                  <p className="text-[11px] opacity-65">
                    {isBn
                      ? 'যেকোনো খাবারে ক্লিক করলে পপআপে বিস্তারিত ডাটাবেস খুলবে'
                      : 'Tap any item to view its clinical database popup'}
                  </p>
                </div>
              </div>
            </div>

            {/* Search & Category Quick Pills */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isBn ? 'খাবার খুঁজুন...' : 'Filter foods...'}
                className={`w-full md:w-52 px-3.5 py-2 rounded-xl text-xs border outline-none ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>
          </div>

          {/* Horizontal Quick Category Switcher Pills */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {categories.map((cat) => {
              const isCurrent = cat.id === selectedCategory;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleOpenCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                    isCurrent
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : darkMode
                      ? 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Instant Grid of Foods in Selected Category (Uniform Design for All Categories!) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {allCategoryFoods.map((food, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedFood(food)}
                className={`group p-4 md:p-5 rounded-3xl border text-left transition-all hover:scale-[1.02] active:scale-95 flex flex-col justify-between gap-3 ${
                  darkMode
                    ? 'bg-slate-900 border-slate-800 hover:border-indigo-500/60'
                    : 'bg-white border-slate-200 shadow-sm hover:border-indigo-400'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div
                      className={`w-11 h-11 md:w-12 md:h-12 rounded-2xl flex items-center justify-center text-2xl ${
                        darkMode ? 'bg-slate-800' : 'bg-indigo-50/70'
                      }`}
                    >
                      {food.icon}
                    </div>
                    <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {food.composition.energy}
                    </span>
                  </div>

                  <h3
                    className={`font-bold text-sm md:text-base leading-snug ${
                      darkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {food.name}
                  </h3>

                  <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-1">
                    {isBn ? food.glycemicTagBn : food.glycemicTagEn}
                  </p>

                  <p className="text-xs opacity-70 line-clamp-2 mt-1.5 leading-relaxed">
                    {food.description}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold">
                  <span className="opacity-70 font-mono">
                    P: {food.composition.protein} · Fb: {food.composition.fiber}
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                    {isBn ? 'পপআপ ↗' : 'View ↗'}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Bottom Bar: Back to Categories + Optional Load More via AI */}
          <div
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <button
              type="button"
              onClick={handleBackToAllCategories}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                darkMode
                  ? 'border-slate-700 text-slate-200 hover:bg-slate-800'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              ← {isBn ? 'সব খাবারের তালিকায় ফিরে যান' : 'Back to All Food Categories'}
            </button>

            <button
              type="button"
              onClick={handleFetchMoreFromAI}
              disabled={aiLoading}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-50"
            >
              {aiLoading
                ? isBn
                  ? 'নতুন খাবার যুক্ত হচ্ছে...'
                  : 'Loading more items...'
                : isBn
                ? '+ আরও আঞ্চলিক খাবার লোড করুন'
                : '+ Load More Regional Foods'}
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* POPUP MODAL: INDIVIDUAL FOOD CLINICAL & BFCT DATABASE               */}
      {/* =================================================================== */}
      {selectedFood && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setSelectedFood(null)}
          />

          {/* Modal Dialog */}
          <div
            className={`relative w-full max-w-2xl max-h-[88vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden ${
              darkMode
                ? 'bg-slate-900 border-slate-700 text-white'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Sticky Modal Header with Prominent Exit Button */}
            <div
              className={`p-4 md:p-6 border-b flex items-center justify-between gap-3 ${
                darkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-3xl shadow-sm ${
                    darkMode ? 'bg-slate-800' : 'bg-white'
                  }`}
                >
                  {selectedFood.icon}
                </div>
                <div>
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 block">
                    {isBn ? selectedFood.glycemicTagBn : selectedFood.glycemicTagEn}
                  </span>
                  <h3 className="text-lg md:text-2xl font-bold serif italic leading-snug">
                    {selectedFood.name}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedFood(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-sm transition-all active:scale-95 shrink-0 flex items-center gap-1.5"
              >
                <span>✕</span>
                <span>{isBn ? 'বন্ধ করুন (Exit)' : 'Exit'}</span>
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <div className="p-5 md:p-6 overflow-y-auto space-y-5">
              {/* Description */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
                  {t.food_description}
                </h4>
                <p className="text-xs md:text-sm leading-relaxed opacity-90">
                  {selectedFood.description}
                </p>
              </div>

              {/* Benefits & Ayurvedic Property Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className={`p-4 rounded-2xl border ${
                    darkMode
                      ? 'bg-slate-800/60 border-slate-700'
                      : 'bg-emerald-50/60 border-emerald-200'
                  }`}
                >
                  <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                    {t.food_benefits}
                  </h4>
                  <ul className="space-y-1.5">
                    {selectedFood.benefits.map((b, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed">
                        <span className="text-emerald-500 font-bold">✓</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3">
                  <div
                    className={`p-4 rounded-2xl border ${
                      darkMode
                        ? 'bg-slate-800/60 border-slate-700'
                        : 'bg-indigo-50/60 border-indigo-200'
                    }`}
                  >
                    <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                      {t.food_ayurveda}
                    </h4>
                    <p className="text-xs font-semibold leading-relaxed">
                      {selectedFood.ayurvedicProperty}
                    </p>
                  </div>

                  <div
                    className={`p-4 rounded-2xl border ${
                      darkMode
                        ? 'bg-slate-800/60 border-slate-700'
                        : 'bg-amber-50/60 border-amber-200'
                    }`}
                  >
                    <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-1">
                      {t.food_nutrition}
                    </h4>
                    <p className="text-xs leading-relaxed">{selectedFood.nutrition}</p>
                  </div>
                </div>
              </div>

              {/* BFCT Food Composition Table (Per 100g) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    {t.composition_title} (প্রতি ১০০ গ্রাম / Per 100g)
                  </h4>
                  <span className="text-[10px] font-mono opacity-60">BFCT Clinical Standard</span>
                </div>

                <div
                  className={`overflow-hidden rounded-2xl border ${
                    darkMode ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <table className="w-full text-xs tabular-nums">
                    <thead className={darkMode ? 'bg-slate-800' : 'bg-slate-100'}>
                      <tr>
                        <th className="px-4 py-2.5 text-left font-bold">{t.comp_parameter}</th>
                        <th className="px-4 py-2.5 text-right font-bold">{t.comp_value}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
                      {Object.entries(selectedFood.composition).map(([key, value]) => (
                        <tr key={key}>
                          <td className="px-4 py-2 font-semibold capitalize">
                            {getTranslatedCompLabel(key)}
                          </td>
                          <td className="px-4 py-2 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {value || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="mt-2 text-[10px] opacity-60 italic">
                  {isBn
                    ? 'উৎস: বাংলাদেশ ফুড কম্পোজিশন টেবিল (BFCT) এবং ক্লিনিক্যাল আয়ুর্বেদিক ডাটাবেস।'
                    : 'Source: Bangladesh Food Composition Table (BFCT) & Clinical Ayurvedic Mapping.'}
                </p>
              </div>
            </div>

            {/* Sticky Modal Footer with Exit Button to Check Another Food */}
            <div
              className={`p-4 border-t flex items-center justify-between gap-3 ${
                darkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <span className="text-xs opacity-70">
                {isBn
                  ? 'পপআপ বন্ধ করে তালিকার অন্য খাবার চেক করুন'
                  : 'Close popup to check another food in this category'}
              </span>
              <button
                type="button"
                onClick={() => setSelectedFood(null)}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-slate-900 dark:bg-emerald-600 text-white hover:opacity-90 transition-all"
              >
                {isBn ? '✕ বন্ধ করুন ও অন্য খাবার দেখুন' : '✕ Close & Check Another Food'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodRecognitionView;
