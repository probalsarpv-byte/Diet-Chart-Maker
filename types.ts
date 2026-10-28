
export enum Phase {
  DETOX = 1,
  RESTORATION = 2,
  STABILIZATION = 3,
  OPTIMIZATION = 4
}

export type Language = 'en' | 'hi' | 'es' | 'bn';

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlocked: boolean;
}

export interface ProfessionalProfile {
  fullName: string;
  role: 'Doctor' | 'Nutritionist';
  licenseNumber: string;
  specialty: string;
  institution: string;
  experienceYears: number;
}

export type ProfileRoleType = 'self' | 'family' | 'doctor';

export interface User {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  isPro: boolean; 
  profileType?: ProfileRoleType;
  isFamilyManager?: boolean;
  familyName?: string;
  familyMembers?: FamilyMember[];
  trialStartDate: string;
  points: number; 
  badges: Badge[]; 
  professionalProfile?: ProfessionalProfile; 
  isSeller?: boolean;
}

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  profile: HealthProfile;
}

export interface UnifiedMealPortion {
  memberName: string;
  portion: string;
  reason: string;
}

export interface UnifiedMeal {
  time: string;
  mealName: string;
  description: string;
  ingredients: string[];
  portions: UnifiedMealPortion[];
}

export interface UnifiedDailyPlan {
  day: string;
  meals: UnifiedMeal[];
}

export interface UnifiedFamilyDiet {
  familyName: string;
  overview: string;
  weeklySchedule: UnifiedDailyPlan[];
  shoppingList: string[];
}

export interface ProductReview {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Product {
  id: string;
  name: string;
  sellerName: string;
  price: number;
  image: string;
  description: string;
  category: 'Grains' | 'Supplements' | 'Oils' | 'Tea' | 'Snacks';
  doshaSuitability: string[];
  rating: number;
  reviews: ProductReview[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Seller {
  id: string;
  institutionName: string;
  licenseNumber: string;
  location: string;
  contactEmail: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

export interface DailyAdherence {
  date: string;
  score: number; 
  items: ChecklistItem[];
  pointsEarned: number;
  waterIntake?: number;
  weight?: number;
  energyLevel?: number;
  digestionRating?: number;
  notes?: string;
}

export interface AssessmentAnalysis {
  doshaBreakdown: { vata: number; pitta: number; kapha: number };
  microbiomeStatus: string;
  metabolicEfficiency: string;
  inflammatoryStatus: string;
  psychologicalProfile: string;
  alkalineScore: number;
  healthSummary: string;
  dietImpact?: string; 
}

// --- New Clinical Diet Maker Interfaces ---

export type TrafficLightZone = 'green' | 'yellow' | 'red';
export type FoodCategory = 'Proteins' | 'Vegetables & Greens' | 'Grains & Carbs' | 'Healthy Fats & Seeds' | 'Fruits & Snacks';

export interface TrafficLightFoodItem {
  id: string;
  nameEn: string;
  nameBn: string;
  category: FoodCategory;
  zone: TrafficLightZone;
  caloriesPer100g: number;
  clinicalReasonEn: string;
  clinicalReasonBn: string;
  isVegetableCarb?: boolean;
  isCerealCarb?: boolean;
}

export interface TrafficLightGuide {
  items: TrafficLightFoodItem[];
  recommendedMealFrequency: 3 | 4;
  mealFrequencyReasonEn: string;
  mealFrequencyReasonBn: string;
  recommendedDinnerCarbRule: 'vegetable_carbs' | 'cereal_allowed' | 'no_carbs';
  dinnerCarbReasonEn: string;
  dinnerCarbReasonBn: string;
  hasHypoacidity: boolean;
  clinicalSummaryEn: string;
  clinicalSummaryBn: string;
}

export interface FatOilAllocation {
  totalDailyFatGrams: number;
  cookingFatGrams: number;
  dietarySourceFatGrams: number;
  gheeGrams: number;
  cookingOilGrams: number;
  recommendedOilType: string;
  dietaryFatSources: string[];
  clinicalInstruction: string;
}

export interface FoodExchangeRow {
  category: string;
  primaryFood: string;
  primaryPortion: string;
  greenSubstitutes: string[];
  yellowSubstitutes: string[];
  clinicalNote: string;
}

export interface DetoxWaterItem {
  timing: 'Morning (Empty Stomach)' | 'Pre-Heavy Meal (Hypoacidity Shot)' | 'Night (Metabolic & Gut Calm)' | string;
  name: string;
  ingredients: string[];
  preparation: string;
  clinicalBenefit: string;
  isHypoaciditySpecific?: boolean;
}

export interface HealthProfile {
  age: number;
  gender: string;
  weight: number;
  height: number;
  dosha: string;
  profession?: string; 
  answers: Record<string, string>; 
  microbiomeScore: number;
  metabolicType: string;
  inflammatoryIndex: number;
  alkalineBalance: string;
  psychologicalProfile: string;
  medications: string;
  dietHistory: string;
  medicalConditions?: string;
  currentMedicationsList?: string;
  dietGoals?: string;
  medicalReportFiles?: string[];
  adherenceHistory?: DailyAdherence[];
  emergencyContact?: {
    name: string;
    phone: string;
  };
  cycleData?: {
    lastPeriodDate: string;
    cycleLength: number;
    hasPCOS: boolean;
  };
  analysis?: AssessmentAnalysis;
  location?: {
    latitude: number;
    longitude: number;
  };
  // Customizations from Traffic Light Food Guide
  trafficLightGuide?: TrafficLightGuide;
  selectedFoods?: string[];
  mealFrequency?: 3 | 4;
  dinnerCarbRule?: 'vegetable_carbs' | 'cereal_allowed' | 'no_carbs';
  hasHypoacidity?: boolean;

  // Cohort Specialization
  cohortType?: CohortType;
  pregnancyMonth?: number; // 1 to 9
  lactationStage?: '0-6m' | '6-12m';
  childAgeGroup?: '1-3' | '4-6' | '7-12';
  oncologyPhase?: 'chemo' | 'radio' | 'recovery' | 'remission';
  adolescentSubtype?: 'girl_anemia' | 'boy_growth' | 'sports';
  metabolicCondition?: string;
  cohortLabMarkers?: Record<string, string | number>;
  cohortSafetyAlerts?: CohortSafetyAlert[];
  nutrientBoosters?: NutrientBooster[];
}

export type CohortType =
  | 'pregnancy_lactation'
  | 'child_pediatric'
  | 'oncology_cancer'
  | 'adolescent_growth'
  | 'adult_metabolic';

export interface CohortLabMarker {
  id: string;
  nameBn: string;
  nameEn: string;
  unit: string;
  standardRange: string;
  normalMin?: number;
  normalMax?: number;
  userValue?: string | number;
  interpretationBn?: string;
  interpretationEn?: string;
}

export interface CohortQuestionOption {
  labelBn: string;
  labelEn: string;
  value: string;
  clinicalTag?: string;
}

export interface CohortQuestion {
  id: string;
  cohort: CohortType;
  category: 'clinical' | 'lifestyle' | 'symptom' | 'lab';
  titleBn: string;
  titleEn: string;
  subtitleBn?: string;
  subtitleEn?: string;
  type: 'radio' | 'checkbox' | 'number' | 'text';
  options?: CohortQuestionOption[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export interface MasanumasikaSampleMeal {
  slot: string;
  time: string;
  mealNameBn: string;
  mealNameEn: string;
  ingredientsBn: string;
  ingredientsEn: string;
  benefitsBn: string;
  benefitsEn: string;
}

export interface AyurvedicMasanumasikaMonth {
  monthNumber: number; // 1 to 9
  monthNameBn: string;
  monthNameEn: string;
  trimester: 1 | 2 | 3;
  fetusDevBn: string;
  fetusDevEn: string;
  ayurvedicFocusBn: string;
  ayurvedicFocusEn: string;
  dhatuFocus: string;
  functionalNutritionBn: string;
  functionalNutritionEn: string;
  keyKitchenFoodsBn: string[];
  keyKitchenFoodsEn: string[];
  prohibitedFoodsBn: string[];
  prohibitedFoodsEn: string[];
  zeroHerbsReminderBn: string;
  zeroHerbsReminderEn: string;
  sampleDayMenu: MasanumasikaSampleMeal[];
}

export interface CohortSafetyAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  descriptionEn: string;
  prohibitedFoods: string[];
}

export interface NutrientBooster {
  id: string;
  nutrientNameBn: string;
  nutrientNameEn: string;
  foodSourcesBn: string[];
  foodSourcesEn: string[];
  clinicalMechanismBn: string;
  clinicalMechanismEn: string;
  homeRecipeBn: string;
  homeRecipeEn: string;
  iconName?: string;
}


export interface UserGeminiAccountConfig {
  enabled: boolean;
  accountEmail?: string;
  accountName?: string;
  connectedAt?: string;
}

export interface MakerCheckerVerification {
  verified: boolean;
  makerUsedUserGemini: boolean;
  makerLabelBn: string;
  makerLabelEn: string;
  checkerLabelBn: string;
  checkerLabelEn: string;
  summaryBn: string;
  summaryEn: string;
  checksPassedBn: string[];
  checksPassedEn: string[];
  sanitizedItemsCount: number;
  sanitizationNoteBn?: string;
  sanitizationNoteEn?: string;
  verifiedAt: string;
}

export interface ChatMessage {
  id?: string;
  role?: 'user' | 'model';
  sender?: 'user' | 'ai';
  text: string;
  timestamp: Date;
  verification?: MakerCheckerVerification;
}

export interface JournalEntry {
  id: string;
  text: string;
  timestamp: Date;
}

export interface Meal {
  time: string;
  mealSlot?: string;
  mealName: string;
  description: string;
  quantity: string;
  calories: string;
  macroBreakdown?: {
    protein: string;
    carbs: string;
    fats: string;
    carbSourceType?: string;
  };
  benefits: string[];
}

export interface DailyPlan {
  day: string;
  meals: Meal[];
}

export interface Supplement {
  name: string;
  dosage: string;
  timing?: string;
  rationale: string;
  medicationSynergy?: string;
  phaseRole: string;
  tags: string[];
}

export interface StaplesAdvice {
  salt: string;
  saltGramsPerDay?: string;
  oil: string;
  water: string;
  waterLitersPerDay?: string;
}

export interface PhysicalActivity {
  type: 'Yoga' | 'Exercise' | 'Pranayama' | 'Cardio' | 'Strength';
  name: string;
  duration: string;
  frequency?: string;
  clinicalReason?: string;
  instructions: string;
  visualCue: string; 
}

export interface WeatherData {
  temp: number;
  humidity: number;
  isRaining: boolean;
  aqi: number;
  aqiLabel: 'Good' | 'Moderate' | 'Unhealthy' | 'Hazardous';
  seasonCode: 'Monsoon' | 'Summer' | 'Winter' | 'Spring';
  sunrise?: string;
  sunset?: string;
}

export interface InteractionWarning {
  medication: string;
  foodInteraction: string;
  severity: 'High' | 'Moderate';
  mechanism: string; 
  guidance: string; 
}

export interface DietPhaseChart {
  phase: number;
  currentWeek: number; 
  phaseName: string;
  focus: string;
  mealFrequency?: 3 | 4;
  totalDailyCalories?: number;
  calorieSplitSummary?: string;
  dinnerCarbStrategy?: string;
  medicalSafetyNote?: string;
  weatherAdaptation?: {
    shieldMode: string; 
    condition: string;
    nudge: string;
    adjustments: string[];
  };
  drugFoodInteractions?: InteractionWarning[];
  weeklySchedule: DailyPlan[];
  fatOilAllocation?: FatOilAllocation;
  foodExchangeTable?: FoodExchangeRow[];
  detoxWaterProtocol?: DetoxWaterItem[];
  recommendations: string[];
  forbiddenFoods: string[];
  supplements: Supplement[];
  staplesAdvice: StaplesAdvice; 
  activities: PhysicalActivity[]; 
  macros: {
    protein: number;
    fats: number;
    carbs: number;
  };
  title?: string;
  dailyCalorieTarget?: number;
  SampleDay?: any;
  verification?: MakerCheckerVerification;
}

export interface DinacharyaActivity {
  time: string;
  name: string;
  type: 'Wake' | 'Hygiene' | 'Meal' | 'Ritual' | 'Sleep' | 'Work';
  description: string;
  voiceScript: string;
  timerSeconds?: number;
}

export interface DinacharyaSchedule {
  scheduleName: string;
  doshaFocus: string;
  brahmaMuhurta: string;
  activities: DinacharyaActivity[];
}

export type AssessmentData = Record<string, string>;

export interface ShoppingItem {
  name: string;
  quantity: string;
  checked: boolean;
}

export interface ShoppingList {
  freshMarket: ShoppingItem[];
  groceryStore: ShoppingItem[];
  pantryTip: string;
}

export interface FoodItem {
  name: string;
  description: string;
  benefits: string[];
  ayurvedicProperty: string;
  nutrition: string;
  composition: Record<string, string>;
}

export interface CookingStep {
  instruction: string;
  spokenText: string;
  timerSeconds?: number;
  visualCue?: string;
}

export interface CookingSession {
  recipeName: string;
  steps: CookingStep[];
}

export interface GutAnalysisResult {
  status: string;
  score: number;
  description: string;
  recommendation: string;
}

export interface CommunityComment {
  id: string;
  author: string;
  text: string;
  timestamp: Date;
}

export interface CommunityPost {
  id: string;
  author: string;
  dosha: string;
  phase: number;
  experience: string;
  timestamp: Date;
  likes: number;
  comments: CommunityComment[];
}

export type MealSlotKey = 'morning' | 'midDay' | 'afternoon' | 'evening';

export interface LoggedFoodItem {
  id: string;
  slot: MealSlotKey;
  nameBn: string;
  nameEn: string;
  portion: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber?: number;
  matchedChartMeal?: boolean;
  timestamp: string;
}

export interface DailyCalorieLog {
  date: string; // YYYY-MM-DD
  dayLabelBn: string;
  dayLabelEn: string;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFats: number;
  waterGlasses: number;
  items: LoggedFoodItem[];
}

