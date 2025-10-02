/**
 * TypeScript interfaces for Study Abroad Destination Intelligence
 */

export interface DestinationQuery {
  rawQuery: string;
  university?: string;
  city: string;
  country: string;
  duration: string;
  durationMonths: number;
  budget: number;
  currency: string;
  interests: string[];
  dietaryRestrictions?: string[];
  origin: {
    city?: string;
    state?: string;
    country: string;
  };
  metadata?: Record<string, any>;
}

export interface FlightCostAnalysis {
  currentPrice: {
    amount: number;
    currency: string;
    route: string;
  };
  priceRange: {
    min: number;
    max: number;
    average: number;
  };
  trend: 'increasing' | 'stable' | 'decreasing';
  prediction: string;
  bookingRecommendation: string;
  bestTimeToBook: string;
}

export interface HousingCostAnalysis {
  studentHousing: {
    monthly: { min: number; max: number; average: number };
    availability: 'high' | 'medium' | 'low';
    options: string[];
  };
  airbnb: {
    monthly: { min: number; max: number; average: number };
    neighborhoods: string[];
  };
  apartments: {
    monthly: { min: number; max: number; average: number };
    typical: string;
  };
  recommendations: string[];
}

export interface LivingCostAnalysis {
  food: {
    monthly: { min: number; max: number; average: number };
    groceries: number;
    restaurants: number;
    studentMeals: number;
  };
  transport: {
    monthly: { min: number; max: number; average: number };
    publicTransport: string;
    studentDiscounts: string[];
  };
  entertainment: {
    monthly: { min: number; max: number; average: number };
    activities: string[];
  };
  utilities: {
    monthly: { min: number; max: number; average: number };
    included: string[];
  };
  total: {
    monthly: { min: number; max: number; average: number };
  };
}

export interface CurrencyAnalysis {
  exchangeRate: number;
  fromCurrency: string;
  toCurrency: string;
  trend: 'strengthening' | 'stable' | 'weakening';
  impact: string;
  budgetInLocalCurrency: number;
  recommendation: string;
  historicalRates?: {
    date: string;
    rate: number;
  }[];
  lastUpdated?: string;
}

export interface RedditPost {
  title: string;
  subreddit: string;
  score: number;
  url: string;
  createdAt: string;
  keyTakeaway: string;
  relevance: 'high' | 'medium' | 'low';
}

export interface RedditInsights {
  posts: RedditPost[];
  communitySummary: string;
  topSubreddits: string[];
  commonTopics: string[];
}

export interface YouTubeVideo {
  title: string;
  videoId: string;
  url: string;
  channelName: string;
  viewCount: number;
  publishedAt: string;
  thumbnail: string;
  duration: string;
  relevance: 'high' | 'medium' | 'low';
}

export interface YouTubeInsights {
  videos: YouTubeVideo[];
  topicsFound: string[];
  averageViews: number;
}

export interface NewsArticle {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  description: string;
  category: 'safety' | 'housing' | 'transport' | 'general' | 'student';
  relevance: 'high' | 'medium' | 'low';
}

export interface NewsAlerts {
  articles: NewsArticle[];
  safetyLevel: 'safe' | 'caution' | 'warning';
  summary: string;
}

export interface CulturalIntelligence {
  localCustoms: {
    greetings: string[];
    diningEtiquette: string[];
    socialNorms: string[];
    tipping: string;
    importantDos: string[];
    importantDonts: string[];
  };
  studentLife: {
    popularActivities: string[];
    studentDiscounts: string[];
    socialGroups: string[];
    upcomingEvents: string[];
    bestNeighborhoods: string[];
  };
  language: {
    primaryLanguage: string;
    essentialPhrases: { phrase: string; translation: string; pronunciation: string }[];
    englishProficiency: 'high' | 'medium' | 'low';
    languageLearningResources: string[];
  };
  safety: {
    overallRating: number; // 1-10
    safeNeighborhoods: string[];
    areasToAvoid: string[];
    emergencyContacts: { service: string; number: string }[];
    safetyTips: string[];
  };
  culturalContext: {
    connectionToOrigin: string[];
    similarities: string[];
    differences: string[];
    adaptationTips: string[];
  };
}

export interface BudgetOptimization {
  totalBudget: number;
  duration: number;
  breakdown: {
    housing: { amount: number; percentage: number; recommendation: string };
    food: { amount: number; percentage: number; recommendation: string };
    transport: { amount: number; percentage: number; recommendation: string };
    activities: { amount: number; percentage: number; recommendation: string };
    utilities: { amount: number; percentage: number; recommendation: string };
    emergency: { amount: number; percentage: number; recommendation: string };
  };
  monthlyAllocation: {
    month: number;
    planned: number;
    recommended: number;
    notes: string;
  }[];
  savingTips: string[];
  costOptimizationStrategies: string[];
  feasibility: 'comfortable' | 'tight' | 'insufficient';
  warningFlags: string[];
}

export interface PersonalizedRecommendations {
  basedOnInterests: {
    interest: string;
    recommendations: string[];
  }[];
  basedOnOrigin: {
    culturalConnections: string[];
    foodSimilarities: string[];
    communityGroups: string[];
  };
  basedOnBudget: {
    affordable: string[];
    splurgeWorthy: string[];
    free: string[];
  };
  studentSpecific: {
    campusLife: string[];
    academicResources: string[];
    networkingOpportunities: string[];
  };
}

export interface DestinationIntelligence {
  query: DestinationQuery;
  summary: string;
  costAnalysis: {
    flights: FlightCostAnalysis;
    housing: HousingCostAnalysis;
    livingCosts: LivingCostAnalysis;
    currency: CurrencyAnalysis;
  };
  culturalGuide: CulturalIntelligence;
  budgetPlan: BudgetOptimization;
  recommendations: PersonalizedRecommendations;
  socialInsights?: {
    reddit?: RedditInsights;
    youtube?: YouTubeInsights;
    news?: NewsAlerts;
  };
  alerts: {
    priceAlerts: string[];
    currencyAlerts: string[];
    seasonalAlerts: string[];
  };
  generatedAt: string;
  confidence: number; // 0-1
}
