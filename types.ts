
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

export interface User {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  isPro: boolean; 
  isFamilyManager?: boolean; // New flag
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
  waterIntake?: number; // glasses
  weight?: number; // kg
  energyLevel?: number; // 1-10
  digestionRating?: number; // 1-10
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
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface JournalEntry {
  id: string;
  text: string;
  timestamp: Date;
}

export interface Meal {
  time: string;
  mealName: string;
  description: string;
  quantity: string;
  calories: string; // Added calories field
  benefits: string[];
}

export interface DailyPlan {
  day: string;
  meals: Meal[];
}

export interface Supplement {
  name: string;
  dosage: string;
  rationale: string;
  phaseRole: string;
  tags: string[];
}

export interface StaplesAdvice {
  salt: string;
  oil: string;
  water: string;
}

export interface PhysicalActivity {
  type: 'Yoga' | 'Exercise' | 'Pranayama';
  name: string;
  duration: string;
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
  medicalSafetyNote?: string;
  weatherAdaptation?: {
    shieldMode: string; 
    condition: string;
    nudge: string;
    adjustments: string[];
  };
  drugFoodInteractions?: InteractionWarning[];
  weeklySchedule: DailyPlan[];
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
