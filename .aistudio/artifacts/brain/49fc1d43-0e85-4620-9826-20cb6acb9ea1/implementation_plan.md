# Universal Residence vs. Dietary Heritage & Cross-Border Supermarket Substitute Engine

Decouples a user's **Current Country of Residence** (climate, seasonal metabolism, and local retail grocery availability) from their **Preferred Dietary Cuisine / Food Heritage** (cultural meals, traditional staples, and familiar recipes), while automatically providing nutritionally equivalent **Local Supermarket Substitutes** for any residence–heritage country pair worldwide.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and UX decisions reflect your confirmed choices and establish how cross-border nutrition planning works for any nationality living anywhere in the world.

- **Confirmed Decision 1 — Dual Independent Selectors (Residence vs. Food Heritage)**: Users explicitly select two independent parameters in their profile, onboarding assessment, and diet header:
  1. **Current Country of Residence (বর্তমান অবস্থানরত দেশ)**: Governs climate/weather adaptation, seasonal hydration, circadian timing, and which local supermarket chains exist around the user.
  2. **Preferred Dietary Cuisine / Food Country (পছন্দের খাবারের দেশ / খাদ্য সংস্কৃতি)**: Governs the primary meals, recipes, spices, and staple foods used to construct the clinical diet chart.
- **Confirmed Decision 2 — Dual-Layer Meal & Ingredient Display (Heritage Food + Local Supermarket Equivalent)**: Whenever a user's Current Country of Residence differs from their Preferred Food Country (Cross-Border / Expat / Diaspora Mode), every meal slot, food exchange row, and Food Glossary card displays the **Primary Heritage Food** alongside its **Nutritionally Equivalent Local Supermarket Substitute** (matched for protein, glycemic index, fatty acid profile, and micronutrients) plus ethnic/frozen grocery availability notes.
- **Confirmed Decision 3 — Universal Global Coverage (Any Country to Any Country)**: Rather than hardcoding a single diaspora pair, the engine supports a universal global matrix of residence regions and culinary heritages (Bangladesh, India, USA, Canada, UK, Europe, Middle East / GCC, East & Southeast Asia, Latin America, Mediterranean, Australia, and Custom Country entry).

---

## 1. Overview & Core Concept

- **What It Does**:
  - Allows any user living abroad (for example, a Bangladeshi living in the USA, an Indian in the UK, a Mexican in Canada, or an American in Japan) to receive a clinical diet chart built around their **own home-country cuisine** while adapting hydration, thermogenic spices, and Vitamin D / seasonal guidance to the **climate of their current country**, and mapping hard-to-find native ingredients to **exact nutritional equivalents sold in local supermarkets** (e.g., Walmart, Whole Foods, Costco, Tesco, Carrefour, Aldi, Woolworths).
- **Target Audience / Persona**:
  - Expatriates, immigrants, international students, travelers, and multicultural households worldwide who want clinical therapeutic nutrition using familiar home-cooked meals without struggling to source unavailable native ingredients.
- **Key Value**:
  - Eliminates the false choice between "eating unfamiliar local western/foreign diet food" and "guessing how to buy native ingredients abroad" by pairing every traditional dish with verified local grocery equivalents and macro-matched swaps.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Dual Country & Cuisine Selector Bar (Assessment, Profile & Diet Header)**:
     - Users see two clean, side-by-side selectors:
       - **🌍 Current Residence Country (বর্তমান অবস্থানরত দেশ — আবহাওয়া ও সুপারমার্কেট)**: e.g., United States, United Kingdom, Canada, UAE / Saudi Arabia, Australia, Germany / EU, Japan, Bangladesh, India, etc.
       - **🍲 Preferred Dietary Cuisine (পছন্দের খাবারের দেশ — ডায়েট মেনু)**: e.g., Bangladeshi (বাঙালি খাবার), Indian (North/South), Mediterranean, American / Western, Middle Eastern / Arabic, East Asian, Latin American, or Mixed Global.
     - When `Residence Country !== Preferred Food Country`, a **Cross-Border Smart Substitution Banner** activates automatically, showing the active pairing (e.g., `Living in USA 🇺🇸 · Eating Bangladeshi Cuisine 🇧🇩 · Local Supermarket Equivalents Active`).
  2. **Diet Chart Meal Cards & Food Exchange Table**:
     - Each meal slot shows the **Primary Heritage Menu** (e.g., *Shing/Magur Jhol with Red Parboiled Rice & Lau Shak*) and an expandable/inline **Local Supermarket Equivalent Strip** for the user's current residence country (e.g., *US Supermarket Swap at Whole Foods / Walmart / H-Mart: Wild Catfish or Tilapia/Cod fillet + Red Cargo / Brown Basmati Rice + Bottle Gourd / Zucchini & Baby Spinach*).
  3. **Food Glossary & Smart Bazaar Integration**:
     - In the Food Glossary and Smart Bazaar shopping list, each item displays a **Local Grocery Equivalence line** tailored to the user's Residence Country, categorizing items into:
       - *Available Fresh in Local Mainstream Supermarkets*
       - *Available Frozen in Local Ethnic / International Aisles*
       - *1:1 Nutritionally Equivalent Local Substitute (Macro & GI Matched)*
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: High-precision clinical nutrition workspace with warm editorial clarity, single-elevation cards (`1px` subtle borders), and zero-pill inline metadata separated by `·` typographic dividers.
  - *Color Palette & Mood*: Neutral slate/ivory surfaces (`#FFFFFF` / `#0F172A`), clinical emerald primary accents (`#059669`) for verified heritage foods, and warm amber/indigo indicators (`#D97706` / `#4F46E5`) for cross-border supermarket equivalents.
  - *Typography & Hierarchy*: Clean bilingual sans-serif hierarchy for Bangla and English descriptions paired with `tabular-nums` monospace figures for macro comparisons (`kcal`, `Protein`, `GI`) between the native food and its local supermarket substitute.
- **Interactive Feedback & Motion**:
  - Changing either the **Current Residence Country** or **Preferred Food Country** immediately updates the Cross-Border Equivalence layer across the Diet Chart, Food Exchange Table, Smart Bazaar, and Food Glossary, with a one-tap **"Re-adapt Diet Chart for Location & Cuisine"** trigger.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Decoupling Environmental Context from Culinary Identity**
  - *Chosen Approach*: Store `residenceCountry` and `preferredCuisineCountry` as two distinct first-class attributes on the user's health profile, plus a `crossBorderSubstitutionMode` setting (`auto_equivalent` | `strict_heritage_only` | `hybrid_meals`).
  - *Why*: Physical location dictates temperature, humidity, daylight hours (Vitamin D), and local grocery store chains, whereas cultural food identity dictates gut microbiome familiarity, spice tolerance, and long-term diet compliance.
  - *Alternatives Considered*: Using GPS location alone to pick both weather and food—rejected because it forces expatriates to eat unfamiliar foreign meals and causes rapid diet drop-off.
- **Decision 2: Hybrid Deterministic + AI Global Food Equivalence Engine**
  - *Chosen Approach*: Build a comprehensive deterministic **Global Cross-Border Food Equivalence Matrix** covering major staple categories (freshwater/marine fish, rice & ancient grains, leafy greens, gourds & vegetables, lentils/legumes, cooking oils, and fermented gut foods) across global regions, combined with prompt-grounded AI generation when a user's personal Gemini account is active.
  - *Why*: Guarantees instant, zero-latency, clinically accurate supermarket substitutes even offline or without AI network calls, while allowing unlimited custom country pairs when AI is enabled.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌────────────────────────────────────────────────────────────────────────────┐
│                   USER HEALTH PROFILE & GLOBAL CONTEXT                     │
│  • residenceCountry (Climate, Season, Local Supermarket Ecosystem)         │
│  • preferredCuisineCountry (Cultural Meals, Recipes, Traditional Staples)  │
│  • crossBorderMode ('dual_equivalent' | 'heritage_frozen' | 'hybrid')      │
└───────────────────┬────────────────────────────────────┬───────────────────┘
                    │                                    │
                    ▼                                    ▼
┌───────────────────────────────────────┐  ┌─────────────────────────────────┐
│  CLIMATE & METABOLIC ADAPTER          │  │ GLOBAL FOOD EQUIVALENCE ENGINE  │
│  • Weather & Hydration Adjustment     │  │ • Heritage Food Database        │
│  • Seasonal Dosha & Vitamin D Cues    │  │ • Macro & GI-Matched Local Swap │
│  • Local Timezone Meal Slot Sync      │  │ • Mainstream vs Ethnic Store Map│
└───────────────────┬───────────────────┘  └─────────────────┬───────────────┘
                    │                                        │
                    └───────────────────┬────────────────────┘
                                        ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                        UNIFIED USER INTERFACE                              │
│  ┌──────────────────────┐ ┌──────────────────────┐ ┌────────────────────┐  │
│  │ Dual Country/Cuisine │ │ Diet Chart & Meal    │ │ Food Glossary &    │  │
│  │ Selector Bar         │ │ Equivalent Swaps     │ │ Smart Bazaar List  │  │
│  └──────────────────────┘ └──────────────────────┘ └────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - Extend `HealthProfile` with:
    - `residenceCountry`: Country/region code & label where the user currently lives (e.g., `'US'`, `'GB'`, `'CA'`, `'AE'`, `'AU'`, `'EU'`, `'JP'`, `'BD'`, `'IN'`, or custom country name).
    - `preferredCuisineCountry`: Country/culture of the food the user wants to eat (e.g., `'BD'`, `'IN'`, `'MED'`, `'US'`, `'ME'`, `'EA'`, `'LATAM'`, or custom).
    - `supermarketSubstituteMode`: `'show_equivalents'` (default) | `'ethnic_frozen_only'` | `'hybrid'`.
  - Extend `Meal` and `FoodExchangeRow` with optional `localSupermarketSwap` metadata (`substituteName`, `supermarketChains`, `nutritionalParityNote`, `availabilityType`).
- **Interactive Component & State Mapping**:
  - **Dual Country & Cuisine Switcher Component**: Reusable control bar embedded in `DietView`, `ProfileView`, `CohortAssessmentForm`, and `FoodRecognitionView` allowing instant switching of Residence Country and Preferred Food Country with persistent storage in `localStorage` and Service Worker offline cache.
  - **Cross-Border Equivalence Resolver**: Pure service function that takes `(foodItemOrMeal, preferredCuisineCountry, residenceCountry, lang)` and returns the localized supermarket equivalent, store chain examples (e.g., *Walmart / Whole Foods / Costco* in US; *Tesco / Sainsbury's / Asda* in UK; *Loblaws / Costco* in Canada; *Carrefour / Lulu* in UAE/GCC; *Woolworths / Coles* in Australia), and clinical macro parity note.
