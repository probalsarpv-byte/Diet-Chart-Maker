# Personal Gemini Account Integration & Maker-Checker Clinical Verification Engine

This update refines the AI architecture so users never see internal engine labels ("Free AI" vs. "Paid API"), can opt in to use their own **Gemini Account** across the entire application, and receive every output only after it passes a two-stage **Maker-Checker Clinical Verification** pipeline.

### User Review & Critical Decisions

> [!IMPORTANT]
> Internal cost and routing mechanics (`Free AI` vs. `Server API`) are completely hidden from the user interface. Users only see a single, clean option to connect and use their own Gemini account, and every AI response across the app is verified by the App's Clinical Checker before display.

- **Confirmed Decision 1 — Invisible Engine Routing**: The UI will never display "Free AI Mode" or "Paid Cloud API" badges to the user. By default, the app runs at $0 cost in the background, and server-side API keys can be enabled later via backend configuration without changing the user experience.
- **Confirmed Decision 2 — "Use My Gemini Account" Everywhere**: Users only see a toggle/connection option asking if they want to use their own Gemini account (`আমার Gemini অ্যাকাউন্ট ব্যবহার করুন`). When enabled, their connected Gemini account acts as the **Maker** across all modules (Chatbot, Diet Chart, Food Safety & Swap, Plate Scanner, Voice Cookbook, Family Pot, and Dinacharya).
- **Confirmed Decision 3 — Mandatory Maker-Checker Verification**: Every output generated anywhere in the app first passes through the **App's Gemini Clinical Checker** (`চেকার ইঞ্জিন`) to validate cohort safety (such as the Pregnancy Zero-Herbs rule, Red-zone food restrictions, and biomarker compatibility) and auto-correct any unsafe advice before the final output is shown to the user.

---

### 1. Overview & Core Concept

- **What It Does**: Provides a seamless, unified AI health and nutrition experience where users can optionally link their own Google/Gemini account to power all app features, backed by a strict **Maker-Checker** clinical safety gate that audits every generated diet chart, food check, and chat response before rendering.
- **Target Audience / Persona**: Users across all five clinical cohorts (Pregnancy, Child Growth, Oncology, Adolescent, Adult Metabolic) who expect personalized, medically safe Ayurvedic and Functional Nutrition guidance without technical jargon about API tiers.
- **Key Value**:
  - **Zero Technical Friction**: Users only choose whether to use their own Gemini account (`আমার Gemini অ্যাকাউন্ট`).
  - **100% Zero-Cost Operation for App Owner**: Runs completely free of cost while allowing future backend scaling transparently.
  - **Clinical Safety Guarantee (Maker-Checker)**: Prevents unsafe hallucinations or contraindicated foods/herbs from ever reaching the patient.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Gemini Account Toggle (Profile & Chatbot Header)**:
     - The user sees a single card/switch: **"আমার Gemini অ্যাকাউন্ট ব্যবহার করুন (Use My Gemini Account)"**.
     - Turning it on connects their Google/Gemini account session so all app modules route requests through their personal Gemini preference.
     - Turning it off (or leaving it in default state) seamlessly uses the app's built-in engine without showing any "Free AI" or "Fallback" labels.
  2. **Maker-Checker Live Progress & Verified Output**:
     - When the user asks a question, scans food, or generates a diet chart, a subtle two-step status indicator appears:
       - **Step 1 (Maker)**: *ডাটা ও উত্তর তৈরি হচ্ছে... (Generating personalized response...)*
       - **Step 2 (Checker)**: *অ্যাপের জেমিনি ক্লিনিক্যাল চেকার দ্বারা যাচাই হচ্ছে... (Verifying clinical & cohort safety...)*
     - Once both stages finish, the final verified output is displayed with a subtle **"✓ চেকার ভেরিফাইড (Maker-Checker Verified)"** clinical safety badge showing which safety rules were validated (e.g., *Pregnancy Zero-Herbs Verified*, *Red-Zone Filter Passed*, *Dosha & Glycemic Check Passed*).

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Warm clinical precision blending traditional Ayurvedic heritage with modern diagnostic clarity.
  - *Color Palette & Mood*: Deep herbal emerald (`#064E3B` / `emerald-900`) and warm parchment (`#FAF8F5`) paired with clinical verification accents in teal (`#0D9488`) and amber safety highlights (`#D97706`).
  - *Typography & Hierarchy*: Clean Bengali and English typographic pairing with clear scannable bullet points, structured clinical cards, and high-contrast verification footers.
  - *Component Styling & Layout*: Streamlined account connection toggle in the header and profile drawer, paired with a collapsible "Verification Details (চেকার রিপোর্ট)" pill on AI outputs.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Hiding Underlying AI Cost Tiers from End Users**
  - *Chosen Approach*: Remove all references to "Free AI", "Zero-Cost Fallback", or "Paid API" from the user interface. Expose only the user-centric **"Use My Gemini Account"** toggle.
  - *Why*: Keeps the clinical experience trustworthy and professional while still running at $0 cost by default and supporting transparent server API upgrades later.
  - *Alternatives Considered*: Showing a 3-way engine switcher (Free vs. Cloud API vs. Gemini Pro), which was rejected because it exposes internal billing mechanics to end users.

- **Decision 2: Synchronous Two-Stage Maker-Checker Pipeline Across All Modules**
  - *Chosen Approach*: Every AI service method executes a **Maker Step** (drafting the response using the active Gemini account/engine) followed immediately by a **Checker Step** (the app's clinical verification engine auditing and sanitizing the draft against the user's cohort, lab markers, Dosha, and Red-zone rules) before returning data to the UI.
  - *Why*: Guarantees that even if a generative model suggests an herb during pregnancy or a high-glycemic food for a diabetic user, the Checker intercepts, corrects, and verifies the output before the user ever sees it.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE LAYER                             │
│  ┌───────────────────────────────┐   ┌───────────────────────────────┐  │
│  │ Profile & Header Toggle       │   │ All App Feature Modules       │  │
│  │ [ Use My Gemini Account: ON ] │   │ (Chat, Diet Chart, Scanner,   │  │
│  │ (No Free/API labels shown)    │   │  Food Swap, Cookbook, Family) │  │
│  └──────────────┬────────────────┘   └──────────────┬────────────────┘  │
└─────────────────┼───────────────────────────────────┼───────────────────┘
                  │                                   │
                  ▼                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  UNIFIED MAKER-CHECKER AI ORCHESTRATOR                  │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ STAGE 1: MAKER (Draft Generation)                                 │  │
│  │ • If User Gemini Account ON → Routes via User Gemini Session      │  │
│  │ • Default → Routes via Built-in Clinical AI / Server Engine       │  │
│  └─────────────────────────────────┬─────────────────────────────────┘  │
│                                    │ Raw Draft Output                   │
│                                    ▼                                    │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ STAGE 2: CHECKER (App's Gemini Clinical Verifier & Sanitizer)     │  │
│  │ 1. Cohort Rule Audit (e.g., Pregnancy Zero-Herbs enforcement)     │  │
│  │ 2. Traffic Light Audit (Blocks Red-zone foods & dinner simple     │  │
│  │    carbs for Adult Metabolic / Diabetic / Fatty Liver profiles)   │  │
│  │ 3. Biomarker & Dosha Alignment (Validates portions & swaps)       │  │
│  │ 4. Auto-Rewrite & Attaches Maker-Checker Verification Metadata    │  │
│  └─────────────────────────────────┬─────────────────────────────────┘  │
└────────────────────────────────────┼────────────────────────────────────┘
                                     │ Final Verified & Safe Output
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│            VERIFIED OUTPUT RENDERED TO USER WITH SAFETY STAMP           │
└─────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - **User Gemini Account Preference**: Stored in `localStorage` (`ayurveda_user_gemini_account`) holding `{ enabled: boolean, accountEmail?: string, connectedAt?: string }`.
  - **Maker-Checker Verification Result**: Every AI operation attaches a `verification` object (`{ verified: true, makerSource: 'user_gemini' | 'app_ai', checksPassed: string[], correctionsMade: string[], timestamp: string }`) so the UI can confirm that Maker-Checker verification completed prior to display.

- **Interactive Component & State Mapping**:
  - **Account Connection Toggle**: One-click switch in the Profile view and Chatbot header lets the user enable or disable their personal Gemini account across all app features.
  - **Two-Step Loading State**: Displays real-time transition from *Maker (তৈরি হচ্ছে...)* to *Checker (অ্যাপের জেমিনি ভেরিফাই করছে...)* before revealing any generated diet plan, food safety check, or chat answer.
  - **Checker Sanitization Engine**: Automatically strips prohibited items (such as Ayurvedic herbs in pregnancy or Red-zone triggers), injects safe clinical swaps, and appends the verification badge to the output.
