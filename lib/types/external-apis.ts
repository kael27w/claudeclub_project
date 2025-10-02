/**
 * External API Types and Interfaces
 * Shared type definitions for all third-party API integrations
 */

// ============================================================================
// COMMON TYPES
// ============================================================================

/**
 * Base API response wrapper for consistent error handling
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMetadata;
}

export interface ApiError {
  code: string;
  message: string;
  statusCode?: number;
  details?: Record<string, unknown>;
  retryable?: boolean;
}

export interface ApiMetadata {
  timestamp: string;
  source: string;
  cached?: boolean;
  cacheExpiry?: string;
  rateLimit?: RateLimitInfo;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: string; // ISO timestamp
}

// ============================================================================
// REDDIT API TYPES
// ============================================================================

export interface RedditServiceConfig {
  clientId: string;
  clientSecret: string;
  userAgent: string;
  accessToken?: string;
  tokenExpiry?: Date;
}

export interface RedditSearchParams {
  query: string;
  subreddits: string[]; // e.g., ['barcelona', 'studyabroad', 'spain']
  limit?: number;
  sort?: 'relevance' | 'hot' | 'top' | 'new' | 'comments';
  timeFilter?: 'all' | 'year' | 'month' | 'week' | 'day' | 'hour';
}

export interface RedditPost {
  id: string;
  title: string;
  content: string;
  author: string;
  subreddit: string;
  score: number;
  numComments: number;
  url: string;
  createdAt: string;
  permalink: string;
  flair?: string;
}

export interface RedditInsights {
  posts: RedditPost[];
  topTopics: string[];
  commonConcerns: string[];
  costInsights: CostInsight[];
  safetyTips: string[];
  housingAdvice: string[];
  studentExperiences: StudentExperience[];
  confidence: number; // 0-1 score based on post quality and recency
}

export interface CostInsight {
  category: string; // 'housing', 'food', 'transport', etc.
  insight: string;
  source: string; // post title
  score: number; // upvotes
}

export interface StudentExperience {
  summary: string;
  university?: string;
  duration?: string;
  budget?: number;
  positives: string[];
  negatives: string[];
  postUrl: string;
}

// ============================================================================
// YOUTUBE DATA API TYPES
// ============================================================================

export interface YouTubeServiceConfig {
  apiKey: string;
  quotaWarningThreshold?: number; // Warn when quota usage exceeds this %
}

export interface YouTubeSearchParams {
  query: string;
  maxResults?: number;
  order?: 'date' | 'rating' | 'relevance' | 'title' | 'viewCount';
  videoDuration?: 'any' | 'short' | 'medium' | 'long'; // <4min, 4-20min, >20min
  publishedAfter?: string; // ISO date string
  publishedBefore?: string;
  relevanceLanguage?: string; // ISO 639-1 code
}

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string;
  thumbnails: {
    default: string;
    medium: string;
    high: string;
  };
  viewCount: number;
  likeCount: number;
  commentCount: number;
  duration: string; // ISO 8601 duration (PT15M33S)
  url: string;
  embedUrl: string;
}

export interface YouTubeInsights {
  videos: YouTubeVideo[];
  categories: {
    costOfLiving: YouTubeVideo[];
    studentLife: YouTubeVideo[];
    cityTours: YouTubeVideo[];
    culturalGuides: YouTubeVideo[];
  };
  averageViewCount: number;
  totalVideos: number;
  recentTrends: string[]; // Common topics from recent videos
  confidence: number; // Based on video quality and recency
}

// ============================================================================
// OPENEXCHANGERATES API TYPES
// ============================================================================

export interface OpenExchangeRatesConfig {
  apiKey: string;
  baseCurrency?: string; // Default: USD
}

export interface CurrencyConversionParams {
  from: string; // 3-letter currency code (USD, EUR, BRL, etc.)
  to: string;
  amount?: number;
  date?: string; // YYYY-MM-DD for historical rates
}

export interface CurrencyRatesResponse {
  base: string;
  rates: Record<string, number>; // { "EUR": 0.85, "BRL": 5.25, ... }
  timestamp: number;
}

export interface HistoricalRatesParams {
  currencies: string[]; // Array of currency codes
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  base?: string; // Base currency (default: USD)
}

export interface HistoricalRatesResponse {
  base: string;
  rates: Record<string, DailyRate[]>; // { "EUR": [{date, rate}, ...] }
}

export interface DailyRate {
  date: string; // YYYY-MM-DD
  rate: number;
}

export interface CurrencyAnalysis {
  currentRate: number;
  trends: {
    day: number; // % change in last 24 hours
    week: number; // % change in last 7 days
    month: number; // % change in last 30 days
  };
  prediction: {
    direction: 'strengthening' | 'weakening' | 'stable';
    confidence: number; // 0-1
    recommendation: string;
  };
  impactOnBudget: {
    estimatedChange: number; // Dollar/Euro amount
    percentage: number;
    recommendation: string;
  };
  historicalData: DailyRate[];
}

// ============================================================================
// NEWSAPI TYPES
// ============================================================================

export interface NewsApiConfig {
  apiKey: string;
}

export interface NewsSearchParams {
  query?: string;
  country?: string; // ISO 3166-1 alpha-2 code (us, gb, br, etc.)
  category?: 'general' | 'business' | 'entertainment' | 'health' | 'science' | 'sports' | 'technology';
  language?: string; // ISO 639-1 code
  from?: string; // ISO date
  to?: string; // ISO date
  sortBy?: 'relevancy' | 'popularity' | 'publishedAt';
  pageSize?: number;
}

export interface NewsArticle {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string;
  content: string;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  category?: string;
  relevanceScore?: number;
}

export interface NewsInsights {
  articles: NewsArticle[];
  categories: {
    safety: NewsArticle[];
    events: NewsArticle[];
    housing: NewsArticle[];
    transportation: NewsArticle[];
    culture: NewsArticle[];
  };
  recentAlerts: NewsAlert[];
  sentiment: {
    overall: 'positive' | 'neutral' | 'negative';
    score: number; // -1 to 1
  };
  confidence: number;
}

export interface NewsAlert {
  type: 'safety' | 'weather' | 'strike' | 'event' | 'policy';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  actionRequired?: string;
}

// ============================================================================
// UNIFIED DESTINATION DATA (Aggregated from all sources)
// ============================================================================

export interface AggregatedDestinationData {
  destination: {
    city: string;
    country: string;
  };
  reddit: RedditInsights;
  youtube: YouTubeInsights;
  news: NewsInsights;
  currency: CurrencyAnalysis;
  aggregatedAt: string;
  confidence: {
    overall: number; // 0-1 score
    reddit: number;
    youtube: number;
    news: number;
    currency: number;
  };
  recommendations: string[];
  warnings: string[];
}

// ============================================================================
// CACHE TYPES
// ============================================================================

export interface CacheEntry<T> {
  data: T;
  timestamp: string;
  ttl: number; // seconds
  expiresAt: string;
  source: string;
}

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  key?: string; // Custom cache key
  forceRefresh?: boolean; // Bypass cache
}

// ============================================================================
// SERVICE CONFIGURATION
// ============================================================================

export interface ServiceConfig {
  reddit: RedditServiceConfig;
  youtube: YouTubeServiceConfig;
  openExchangeRates: OpenExchangeRatesConfig;
  newsApi: NewsApiConfig;
  cache: {
    enabled: boolean;
    defaultTtl: number; // 6 hours = 21600 seconds
    maxSize: number; // Max cache entries
  };
  rateLimits: {
    reddit: RateLimitConfig;
    youtube: RateLimitConfig;
    openExchangeRates: RateLimitConfig;
    newsApi: RateLimitConfig;
  };
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Time window in milliseconds
  strategy: 'fixed' | 'sliding';
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export enum ApiErrorCode {
  // Authentication errors
  INVALID_API_KEY = 'INVALID_API_KEY',
  EXPIRED_TOKEN = 'EXPIRED_TOKEN',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',

  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',

  // Request errors
  INVALID_PARAMS = 'INVALID_PARAMS',
  MISSING_PARAMS = 'MISSING_PARAMS',
  INVALID_QUERY = 'INVALID_QUERY',

  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

  // Data errors
  NO_DATA_FOUND = 'NO_DATA_FOUND',
  PARSE_ERROR = 'PARSE_ERROR',
  INVALID_RESPONSE = 'INVALID_RESPONSE',

  // Internal errors
  CACHE_ERROR = 'CACHE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class ExternalApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
    public statusCode?: number,
    public details?: Record<string, unknown>,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'ExternalApiError';
    Object.setPrototypeOf(this, ExternalApiError.prototype);
  }

  toJSON(): ApiError {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      retryable: this.retryable,
    };
  }
}

// ============================================================================
// RETRY CONFIGURATION
// ============================================================================

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
  retryableErrors: ApiErrorCode[];
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: [
    ApiErrorCode.NETWORK_ERROR,
    ApiErrorCode.TIMEOUT,
    ApiErrorCode.SERVICE_UNAVAILABLE,
    ApiErrorCode.RATE_LIMIT_EXCEEDED,
  ],
};
