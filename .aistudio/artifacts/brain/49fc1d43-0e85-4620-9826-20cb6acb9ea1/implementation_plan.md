# Unified Clinical Assessment Package Plan (35–42 Questions per Cohort)

## Overview
Currently, selecting a life-stage cohort routes to a standalone 8-question form that bypasses the core 30+ foundational clinical questions (Anthropometrics, Ayurvedic Vikriti, Microbiome & Gut Health, Functional Metabolism, Inflammatory Index, Female Cycle Sync, Dietary Habits, and Medication History) and uses placeholder metrics for BMI, Dosha, and Microbiome scores.

We will unify the entire clinical intake into a **single step-by-step category tab flow** where every user completes a comprehensive **35 to 42 question clinical package** tailored to their life stage, gender, and primary health condition.

---

## 1. Unified Step-by-Step Category Tab Flow

When a user selects any of the **5 Life-Stage & Clinical Cohorts** (Pregnancy & Lactation, Child 1–12 Yrs, Oncology / Cancer Care, Adolescent 10–19 Yrs, or Adult Metabolic & Chronic Care), they will move through a single, cohesive multi-step wizard with **Category Progress Tabs**:

### For Adult Metabolic, Oncology, Adolescent, and Pregnancy Cohorts (~38–42 Questions Total):
1. **Step 1: Anthropometrics & Vital Profile (6 Questions)**
   - Full Name, Age, Gender (`Male` / `Female` / `Other`), Occupation/Activity Level, Height (ft/in or cm with live converter), and Weight (kg) with live BMI calculation.
2. **Step 2: Female Focus — Shakti Cycle & Reproductive Health (4–5 Questions — Automatically shown for Female users)**
   - **First day of last menstrual period (Date picker)** (or Trimester/Lactation stage if in Pregnancy cohort)
   - Average menstrual cycle length (`28 days`, `21–35 days`, `Irregular`, `Menopause / Post-menopause`, `Pregnant / Lactating`)
   - Flow & Pain characteristics (`Normal`, `Heavy bleeding / clots`, `Severe cramps / dysmenorrhea`, `Spotting / oligomenorrhea`)
   - Hormonal / Gynecological history (`PCOS / PCOD`, `Endometriosis / Fibroids`, `Thyroid + Menstrual irregularity`, `Perimenopausal hot flashes`, `None`)
   - Pre-menstrual symptoms (`PMS mood swings`, `Breast tenderness / water retention`, `Sugar cravings before period`, `Migraine / fatigue`)
3. **Step 3: Daily Dietary Habits & Meal Timing (6 Questions)**
   - Typical Breakfast, Mid-morning snack, Lunch composition, Afternoon snack, Dinner timing & food, and Daily hydration / tea / coffee intake.
4. **Step 4: Ayurvedic Vikriti — Current Constitutional Imbalance (5 Questions)**
   - Sleep quality & pattern, Emotional response, Body temperature sensitivity, Skin & hair texture, and Daily stamina/energy rhythm (dynamically calculates **Vata / Pitta / Kapha** dominance).
5. **Step 5: Gut Microbiome & Digestive Function (5 Questions)**
   - Post-meal bloating/gas timing, Morning tongue coating (`Ama` assessment), Appetite intensity (`Agni`), Bristol Stool Scale pattern, and Reaction to fermented/prebiotic foods (dynamically calculates **Microbiome Score 0–100**).
6. **Step 6: Functional Nutrition — Insulin, Metabolism & Inflammation (10 Questions)**
   - **Metabolic & Insulin Sensitivity (5 Qs):** Post-lunch drowsiness ("food coma"), Sugar/carb cravings, Hypoglycemic shakiness when delaying meals, Central/visceral weight gain pattern, Nighttime thirst/urination.
   - **Systemic Inflammation & Cellular Acid-Alkaline Status (5 Qs):** Morning joint/heel stiffness, Skin/allergy reactivity, Recovery time after physical exertion, Facial/pedal water retention (edema), Chronic cellular fatigue.
7. **Step 7: Cohort & Condition-Specific Clinical Deep-Dive (8–10 Questions)**
   - Dynamically adapts to the chosen cohort and primary condition:
     - **Adult Metabolic & Chronic Care (8–10 Qs):** Primary condition selector (Type 2 Diabetes, Fatty Liver NAFLD Grade 1–3, Dyslipidemia, Hypertension, Kidney/Uric Acid, Thyroid/PCOS, or Gastritis/IBS) + 8 targeted clinical questions on lab stages, meal-to-sleep gap, snoring/sleep apnea, step count, and specific disease triggers.
     - **Oncology / Cancer Support (10 Qs):** Cancer type & site, Active treatment phase (Chemo, Radiation, Post-surgery, Remission), Cachexia / weight loss %, Dysgeusia (metallic taste), Oral mucositis / swallowing difficulty, Absolute Neutrophil Count (ANC / neutropenia safety), Chemo-induced nausea, Bowel changes, Tolerated food texture, and Caregiver cooking support.
     - **Pregnancy & Lactation (10 Qs):** Month-by-month Trimester (Month 1–9) or Lactation stage (0–6m / 6–12m), Morning sickness severity, Gestational Diabetes (GDM) status, BP & Edema / Preeclampsia screen, Hemoglobin / Anemia status, Heartburn & Constipation, Cravings & Food aversions, Prescribed prenatal supplements (Folic acid, Iron, Calcium, DHA), Fetal growth / Maternal weight gain trajectory, and Breastmilk supply / Postpartum recovery.
     - **Adolescent Growth & Puberty (9 Qs):** Age/Gender bracket (10–14 or 15–19), Height spurt & frame trajectory, Menstrual anemia / PCOS screen (for girls), Hormonal acne & skin health, Study focus & afternoon brain fog, Breakfast skipping habit, Sports/athletic intensity, Fast-food/soda frequency, and Late-night screen/sleep schedule.
8. **Step 8: Medical History, Medications & Optional Lab Biomarkers (6 Questions + Optional Lab Panel)**
   - Diagnosed co-morbidities, Current prescription medications & supplements (checked against food-drug interactions), Primary health goal, Emergency contact, Optional Lab Report upload, and Optional numerical lab inputs (HbA1c, SGPT, Creatinine, Hemoglobin, Vitamin D, etc.).

---

## 2. Dedicated Pediatric Package for Child Cohort (`child_pediatric`, Ages 1–12) — 32 Questions Total

When the user selects **Child & Pediatric Nutrition (Ages 1–12)**, the adult questions are replaced after Anthropometrics with a dedicated **32-question Pediatric Clinical & Developmental Package** organized into 6 child-focused tabs:

1. **Tab 1: Child Anthropometrics & Growth Trajectory (6 Questions)**
   - Child's Name, Exact Age (1–12 years), Gender, Height (cm/ft), Weight (kg), and Growth Percentile / Weight-for-Age trajectory (`Normal`, `Underweight / Faltering`, `Stunted linear height`, `Childhood Overweight`).
2. **Tab 2: Pediatric Feeding Behavior & Daily Tiffin Routine (6 Questions)**
   - Appetite & Picky eating behavior, Breakfast before school, School Tiffin box habit (finishes home tiffin vs. leaves half vs. canteen packaged snacks), Protein intake frequency (egg, fish, dal, milk), Vegetable & fruit acceptance, and Junk food / sweet beverage / packet chip frequency.
3. **Tab 3: Pediatric Gut Microbiome & Digestion (5 Questions)**
   - Stool consistency & regularity (pediatric constipation / hard pellets vs. loose stools), Recurrent colic / tummy ache after meals, Bloating or foul-smelling gas, Deworming history & worm symptoms (teeth grinding at night, anal itching), and History of antibiotic courses in the past 6 months.
4. **Tab 4: Immunity, Allergies & Respiratory Resilience (5 Questions)**
   - Frequency of cold, cough, tonsillitis, or viral fever, Allergic tendencies (childhood asthma, eczema/skin rashes, allergic rhinitis), Specific food allergies/intolerances (Cow's milk protein / lactose, egg, nuts, wheat/gluten), Wound healing & gum/dental health (caries/cavities), and Micronutrient deficiency signs (white spots on nails, pale conjunctiva, leg cramps at night).
5. **Tab 5: Pediatric Ayurvedic Prakriti & Neuro-Development (5 Questions)**
   - Child's constitutional temperament (Active/restless Vata, Sharp/hungry/warm Pitta, Calm/steady/mucus-prone Kapha), Sleep schedule & quality (mouth breathing/snoring, bedtime resistance), Screen time & mobile-feeding dependency, Concentration, memory & classroom energy, and Physical play / outdoor sunlight exposure.
6. **Tab 6: Pediatric Clinical History, Supplements & Lab Markers (5 Questions + Optional Labs)**
   - Current pediatrician-prescribed syrups/supplements (Iron, Zinc, Vitamin D3, Calcium, Multivitamins), Past medical history (febrile seizures, jaundice, recurrent UTI/diarrhea), Caregiver's #1 nutritional goal for the child, Emergency parent contact, and Optional Pediatric Lab Markers (Hemoglobin, Serum Ferritin, Vitamin D3, Stool R/E).

---

## 3. Real Clinical Scoring & Seamless Report Integration

- **No More Hardcoded Placeholders:** Completing any cohort assessment will dynamically compute real clinical scores from the 35–42 answers:
  - **Real BMI & Anthropometric Status** from entered Height & Weight
  - **Real Ayurvedic Dosha Profile** (`Vata`, `Pitta`, `Kapha` percentages)
  - **Real Gut Microbiome Score (0–100)** from digestive & antibiotic responses
  - **Real Metabolic Type & Inflammatory Index (1–10)**
  - **Real Female Cycle Phase** (`Menstrual`, `Follicular`, `Ovulatory`, `Luteal`) calculated from the user's Last Period Date (`shakti_1`) and cycle length (`shakti_2`)
  - **Real Food-Drug Interaction Alerts** from entered medications (`medical_2`) + cohort clinical rules
- **Full Bilingual Support (Bangla & English):** Every question, option, category tab, and clinical badge supports switching between বাংলা and English.
