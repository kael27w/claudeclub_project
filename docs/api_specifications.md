# API Integration Specifications
**Adaptive Travel Agent - External API Architecture**

**Document Version:** 1.0  
**Last Updated:** October 1, 2025  
**Status:** Design Complete - Ready for Implementation

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Data Flow & Integration Strategy](#data-flow--integration-strategy)
3. [Reddit API Integration](#reddit-api-integration)
4. [YouTube Data API Integration](#youtube-data-api-integration)
5. [OpenExchangeRates Integration](#openexchangerates-integration)
6. [NewsAPI Integration](#newsapi-integration)
7. [Caching Strategy](#caching-strategy)
8. [Error Handling & Fallbacks](#error-handling--fallbacks)
9. [Rate Limiting & Quotas](#rate-limiting--quotas)
10. [Security & Authentication](#security--authentication)
11. [Implementation Checklist](#implementation-checklist)

---

## Architecture Overview

### System Design Principles
- **Graceful Degradation**: Each API failure falls back to next tier
- **Smart Caching**: 6-hour TTL with LRU eviction
- **Parallel Fetching**: All API calls execute simultaneously
- **Type Safety**: Full TypeScript coverage with strict mode
- **Observability**: Comprehensive logging and error tracking

### Data Source Hierarchy
```
Tier 1: Perplexity Pro (Primary Research)
   ↓ (fallback)
Tier 2: Free APIs (Reddit, YouTube, News, Currency)
   ↓ (fallback)
Tier 3: Cached Data
   ↓ (fallback)
Tier 4: Mock Data (Demo Mode)
```

### Service Dependencies
```typescript
DestinationAgent
├── Perplexity Service (primary)
├── Reddit Service (community insights)
├── YouTube Service (visual content)
├── News Service (current events)
├── Currency Service (live rates)
└── Cache Service (persistence)
```

---

## Data Flow & Integration Strategy

### Request Flow Diagram
```
User Query
    ↓
DestinationAgent.parseQuery()
    ↓
DestinationAgent.generateIntelligence()
    ├── Check Cache → Return if fresh
    ├── Promise.allSettled([
    │   ├── Perplexity Research
    │   ├── Reddit Insights
    │   ├── YouTube Videos
    │   ├── News Alerts
    │   └── Currency Data
    │   ])
    ↓
synthesizeMultiSourceData()
    ├── Claude synthesis
    ├── Confidence scoring
    └── Cache result
    ↓
Return DestinationIntelligence
```

### Integration Points
**File:** `/lib/destination-agent.ts`  
**Method:** `generateIntelligence(query: DestinationQuery)`

```typescript
const [
  perplexityResearch,
  redditInsights,
  youtubeInsights,
  newsAlerts,
  currencyData,
] = await Promise.allSettled([
  perplexityService.conductResearch(...),
  redditService.getCommunityInsights(...),
  youtubeService.getVideoInsights(...),
  newsAPIService.getNewsAlerts(...),
  currencyService.getCurrencyData(...),
]);
```

---

## Reddit API Integration

### Overview
**Purpose**: Extract community insights, student experiences, cost discussions  
**Rate Limit**: 60 requests/minute (OAuth 2.0)  
**Documentation**: https://www.reddit.com/dev/api/

### API Endpoints Used

#### 1. OAuth Token Endpoint
```http
POST https://www.reddit.com/api/v1/access_token
Headers:
  Authorization: Basic {base64(client_id:client_secret)}
  Content-Type: application/x-www-form-urlencoded
  User-Agent: AdaptiveTravelAgent/1.0
Body:
  grant_type=client_credentials
  
Response:
{
  "access_token": "eyJ0...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

#### 2. Subreddit Search Endpoint
```http
GET https://oauth.reddit.com/r/{subreddit}/search
Headers:
  Authorization: Bearer {access_token}
  User-Agent: AdaptiveTravelAgent/1.0
Query Parameters:
  q: string (search query)
  sort: top | new | hot | relevance | comments
  t: all | year | month | week | day | hour
  limit: number (max 100)
  restrict_sr: true
  
Response:
{
  "data": {
    "children": [
      {
        "data": {
          "id": "abc123",
          "title": "Cost of living in Barcelona as a student",
          "selftext": "I spent 4 months in Barcelona...",
          "author": "username",
          "subreddit": "barcelona",
          "score": 142,
          "num_comments": 38,
          "created_utc": 1696118400,
          "permalink": "/r/barcelona/comments/abc123/...",
          "url": "https://reddit.com/r/barcelona/...",
          "link_flair_text": "Discussion"
        }
      }
    ]
  }
}
```

### Service Interface

```typescript
interface RedditService {
  // Core Methods
  getCommunityInsights(city: string, country: string): Promise<RedditInsights>;
  searchDestination(params: RedditSearchParams): Promise<ApiResponse<RedditInsights>>;
  
  // Configuration
  isConfigured(): boolean;
  ensureAuthenticated(): Promise<void>;
}

interface RedditInsights {
  posts: RedditPost[];              // Top 20 relevant posts
  topTopics: string[];               // Most discussed topics
  commonConcerns: string[];          // Frequently mentioned issues
  costInsights: CostInsight[];       // Price-related discussions
  safetyTips: string[];              // Safety advice from community
  housingAdvice: string[];           // Accommodation recommendations
  studentExperiences: StudentExperience[];  // Detailed experiences
  confidence: number;                // 0-1 score based on post quality
}
```

### Data Extraction Logic

#### Subreddit Selection Strategy
```typescript
function getRelevantSubreddits(city: string, country: string): string[] {
  return [
    city.toLowerCase().replace(/\s+/g, ''),    // r/barcelona
    country.toLowerCase().replace(/\s+/g, ''), // r/spain
    'studyabroad',                              // r/studyabroad
    'IWantOut',                                 // r/IWantOut
    'travel'                                    // r/travel
  ];
}
```

#### Search Query Construction
```typescript
const query = `${city} student OR study abroad OR cost living OR housing`;
// Example: "Barcelona student OR study abroad OR cost living OR housing"
```

#### Post Filtering Criteria
- **Minimum Score**: 5 upvotes for safety tips, 10+ for housing advice
- **Time Range**: Past 12 months (configurable)
- **Relevance**: Title/content must contain destination keywords
- **Quality**: Higher scores = higher priority

#### Confidence Scoring Algorithm
```typescript
function calculateConfidence(posts: RedditPost[]): number {
  let score = 0;
  const now = Date.now();
  
  for (const post of posts) {
    // Score components (max 25 points per post):
    const scorePoints = Math.min(post.score / 100, 10);    // Upvotes
    const ageInDays = (now - new Date(post.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    const recencyPoints = Math.max(0, 10 - ageInDays / 30); // Recency
    const commentPoints = Math.min(post.numComments / 20, 5); // Engagement
    
    score += scorePoints + recencyPoints + commentPoints;
  }
  
  return Math.min(score / (posts.length * 25), 1); // Normalize to 0-1
}
```

### Caching Strategy
- **Cache Key**: `reddit:{query}:{subreddits}`
- **TTL**: 6 hours (21600 seconds)
- **Invalidation**: Manual refresh or TTL expiry
- **Storage**: LRU cache with 50 entry capacity

### Error Handling
```typescript
// Authentication Errors
401/403 → throw ExternalApiError(AUTHENTICATION_FAILED, retryable: false)

// Rate Limiting
429 → throw ExternalApiError(RATE_LIMIT_EXCEEDED, retryable: true)
      Extract Retry-After header, wait specified time

// Network Errors
ECONNREFUSED/TIMEOUT → throw ExternalApiError(NETWORK_ERROR, retryable: true)

// Data Errors
Empty response → Return empty insights with confidence: 0
Parse error → Log warning, continue with other subreddits
```

### Implementation Checklist
- [ ] Create `RedditService` class
- [ ] Implement OAuth 2.0 token management with auto-refresh
- [ ] Build multi-subreddit search aggregation
- [ ] Extract insights (topics, concerns, costs, safety, housing)
- [ ] Calculate confidence scores
- [ ] Integrate with cache service
- [ ] Add comprehensive error handling
- [ ] Write unit tests for extraction logic
- [ ] Add integration tests with mock API responses

---

## YouTube Data API Integration

### Overview
**Purpose**: Visual content discovery (vlogs, cost-of-living videos, student experiences)  
**Rate Limit**: 10,000 quota units/day (search = 100 units, video details = 1 unit)  
**Documentation**: https://developers.google.com/youtube/v3

### API Endpoints Used

#### 1. Search Endpoint
```http
GET https://www.googleapis.com/youtube/v3/search
Query Parameters:
  key: {API_KEY}
  part: snippet
  q: string (search query)
  type: video
  maxResults: number (max 50)
  order: date | rating | relevance | viewCount
  publishedAfter: ISO 8601 timestamp
  relevanceLanguage: ISO 639-1 code
  videoDuration: short | medium | long
  
Response:
{
  "items": [
    {
      "id": {
        "videoId": "dQw4w9WgXcQ"
      },
      "snippet": {
        "publishedAt": "2024-09-15T10:00:00Z",
        "channelId": "UC...",
        "title": "Cost of Living in Barcelona as a Student - 2024",
        "description": "In this video, I break down...",
        "thumbnails": {
          "default": { "url": "https://i.ytimg.com/...", "width": 120, "height": 90 },
          "medium": { "url": "https://i.ytimg.com/...", "width": 320, "height": 180 },
          "high": { "url": "https://i.ytimg.com/...", "width": 480, "height": 360 }
        },
        "channelTitle": "StudentAbroad"
      }
    }
  ]
}
```

#### 2. Videos Endpoint (for statistics)
```http
GET https://www.googleapis.com/youtube/v3/videos
Query Parameters:
  key: {API_KEY}
  part: statistics,contentDetails
  id: comma-separated video IDs
  
Response:
{
  "items": [
    {
      "id": "dQw4w9WgXcQ",
      "statistics": {
        "viewCount": "125847",
        "likeCount": "3241",
        "commentCount": "186"
      },
      "contentDetails": {
        "duration": "PT15M33S"  // ISO 8601 duration
      }
    }
  ]
}
```

### Service Interface

```typescript
interface YouTubeService {
  // Core Methods
  getVideoInsights(city: string, country: string, interests: string[]): Promise<YouTubeInsights>;
  searchVideos(params: YouTubeSearchParams): Promise<ApiResponse<YouTubeInsights>>;
  
  // Configuration
  isConfigured(): boolean;
  getQuotaUsage(): { used: number; limit: number; remaining: number };
}

interface YouTubeInsights {
  videos: YouTubeVideo[];           // Filtered, relevant videos
  categories: {
    costOfLiving: YouTubeVideo[];   // Budget/cost videos
    studentLife: YouTubeVideo[];    // Campus/social life
    cityTours: YouTubeVideo[];      // City exploration
    culturalGuides: YouTubeVideo[]; // Culture/customs
  };
  averageViewCount: number;
  totalVideos: number;
  recentTrends: string[];           // Common topics
  confidence: number;               // Based on video quality
}
```

### Search Query Construction

```typescript
function buildSearchQueries(city: string, country: string, interests: string[]): string[] {
  const baseQueries = [
    `cost of living ${city}`,
    `${city} student life`,
    `study abroad ${city}`,
    `${city} expat experience`
  ];
  
  // Add interest-specific queries
  const interestQueries = interests.map(interest => 
    `${city} ${interest}`
  );
  
  return [...baseQueries, ...interestQueries];
}
```

### Video Filtering Criteria
- **View Count**: Minimum 10,000 views (indicates quality)
- **Recency**: Published within last 2 years
- **Duration**: 5-30 minutes (optimal for student content)
- **Relevance**: Title/description matches destination + keywords
- **Language**: Primarily English (configurable)

### Video Categorization Logic

```typescript
function categorizeVideo(video: YouTubeVideo): string[] {
  const title = video.title.toLowerCase();
  const description = video.description.toLowerCase();
  const text = `${title} ${description}`;
  
  const categories: string[] = [];
  
  // Cost of Living
  if (/cost|budget|price|expensive|cheap|afford/i.test(text)) {
    categories.push('costOfLiving');
  }
  
  // Student Life
  if (/student|university|campus|dorm|class/i.test(text)) {
    categories.push('studentLife');
  }
  
  // City Tours
  if (/tour|walk|explore|neighborhood|area|district/i.test(text)) {
    categories.push('cityTours');
  }
  
  // Cultural Guides
  if (/culture|custom|tradition|language|etiquette/i.test(text)) {
    categories.push('culturalGuides');
  }
  
  return categories.length > 0 ? categories : ['general'];
}
```

### Quota Management Strategy

```typescript
interface QuotaTracker {
  dailyLimit: 10000;
  operations: {
    search: 100,      // Search query = 100 units
    videos: 1,        // Video details = 1 unit
    channels: 1       // Channel details = 1 unit
  };
  
  // Conservative limits to avoid exhaustion
  maxSearchesPerRequest: 3;  // 300 units
  maxVideoDetailsPerRequest: 50;  // 50 units
  // Total per request: ~350 units
  // Max requests per day: ~28
}
```

### Caching Strategy
- **Cache Key**: `youtube:{city}:{country}:{interests}`
- **TTL**: 24 hours (86400 seconds) - video content changes slowly
- **Invalidation**: Manual refresh or TTL expiry
- **Storage**: LRU cache with 100 entry capacity

### Error Handling
```typescript
// Authentication Errors
403 (quotaExceeded) → Return cached data or empty insights with warning

// Invalid API Key
401/403 (keyInvalid) → throw ExternalApiError(INVALID_API_KEY, retryable: false)

// Quota Exceeded
403 (quotaExceeded) → Fall back to cache, disable service until next day

// Network Errors
TIMEOUT → Retry with exponential backoff (max 2 retries)

// Data Errors
No results → Return empty insights with confidence: 0
```

### Implementation Checklist
- [ ] Create `YouTubeService` class
- [ ] Implement search with multiple queries
- [ ] Fetch video statistics (views, likes, comments)
- [ ] Build video categorization engine
- [ ] Implement quota tracking and warnings
- [ ] Extract trending topics from video titles
- [ ] Calculate confidence scores based on view counts
- [ ] Integrate with cache service
- [ ] Add comprehensive error handling
- [ ] Write unit tests for categorization
- [ ] Add integration tests with mock API responses

---

## OpenExchangeRates Integration

### Overview
**Purpose**: Live currency conversion, historical trends, budget impact analysis  
**Rate Limit**: 1,000 requests/month (free tier)  
**Documentation**: https://openexchangerates.org/documentation

### API Endpoints Used

#### 1. Latest Rates Endpoint
```http
GET https://openexchangerates.org/api/latest.json
Query Parameters:
  app_id: {API_KEY}
  base: USD (default, changeable with paid plan)
  symbols: EUR,BRL,JPY,GBP (comma-separated)
  
Response:
{
  "disclaimer": "...",
  "license": "...",
  "timestamp": 1696118400,
  "base": "USD",
  "rates": {
    "EUR": 0.85,
    "BRL": 5.25,
    "JPY": 110.5,
    "GBP": 0.73
  }
}
```

#### 2. Historical Rates Endpoint
```http
GET https://openexchangerates.org/api/historical/{YYYY-MM-DD}.json
Query Parameters:
  app_id: {API_KEY}
  base: USD
  symbols: EUR,BRL,JPY,GBP
  
Response:
{
  "timestamp": 1696032000,
  "base": "USD",
  "rates": {
    "EUR": 0.84,
    "BRL": 5.28,
    "JPY": 109.8,
    "GBP": 0.72
  }
}
```

### Service Interface

```typescript
interface CurrencyService {
  // Core Methods
  getCurrencyData(fromCurrency: string, toCurrency: string, amount: number): Promise<CurrencyAnalysis>;
  getHistoricalRates(params: HistoricalRatesParams): Promise<HistoricalRatesResponse>;
  convertAmount(from: string, to: string, amount: number): Promise<number>;
  
  // Configuration
  isConfigured(): boolean;
  getCurrentRate(from: string, to: string): Promise<number>;
}

interface CurrencyAnalysis {
  currentRate: number;              // Current exchange rate
  trends: {
    day: number;                    // % change last 24h
    week: number;                   // % change last 7 days
    month: number;                  // % change last 30 days
  };
  prediction: {
    direction: 'strengthening' | 'weakening' | 'stable';
    confidence: number;             // 0-1
    recommendation: string;         // Actionable advice
  };
  impactOnBudget: {
    estimatedChange: number;        // Dollar amount impact
    percentage: number;             // % change in budget
    recommendation: string;         // Budget adjustment advice
  };
  historicalData: DailyRate[];     // 30-90 day history
}
```

### Currency Mapping

```typescript
const COUNTRY_CURRENCIES: Record<string, string> = {
  'brazil': 'BRL',
  'spain': 'EUR',
  'france': 'EUR',
  'germany': 'EUR',
  'italy': 'EUR',
  'japan': 'JPY',
  'united kingdom': 'GBP',
  'mexico': 'MXN',
  'china': 'CNY',
  'south korea': 'KRW',
  'thailand': 'THB',
  'australia': 'AUD',
  'canada': 'CAD',
  'argentina': 'ARS',
  // ... add more as needed
};
```

### Trend Analysis Algorithm

```typescript
function analyzeTrends(historicalRates: DailyRate[]): {
  day: number;
  week: number;
  month: number;
} {
  const current = historicalRates[historicalRates.length - 1].rate;
  
  // 24-hour change
  const yesterday = historicalRates[historicalRates.length - 2]?.rate;
  const dayChange = yesterday ? ((current - yesterday) / yesterday) * 100 : 0;
  
  // 7-day change
  const weekAgo = historicalRates[historicalRates.length - 8]?.rate;
  const weekChange = weekAgo ? ((current - weekAgo) / weekAgo) * 100 : 0;
  
  // 30-day change
  const monthAgo = historicalRates[0]?.rate;
  const monthChange = monthAgo ? ((current - monthAgo) / monthAgo) * 100 : 0;
  
  return {
    day: Math.round(dayChange * 100) / 100,
    week: Math.round(weekChange * 100) / 100,
    month: Math.round(monthChange * 100) / 100
  };
}
```

### Prediction Logic

```typescript
function predictTrend(trends: { day: number; week: number; month: number }): {
  direction: 'strengthening' | 'weakening' | 'stable';
  confidence: number;
  recommendation: string;
} {
  const avgChange = (trends.day + trends.week + trends.month) / 3;
  
  // Determine direction
  let direction: 'strengthening' | 'weakening' | 'stable';
  if (Math.abs(avgChange) < 0.5) {
    direction = 'stable';
  } else if (avgChange > 0) {
    direction = 'strengthening';
  } else {
    direction = 'weakening';
  }
  
  // Calculate confidence based on trend consistency
  const consistency = Math.abs(trends.day - trends.week) < 1 && 
                      Math.abs(trends.week - trends.month) < 2;
  const confidence = consistency ? 0.8 : 0.5;
  
  // Generate recommendation
  let recommendation: string;
  if (direction === 'strengthening') {
    recommendation = 'Local currency gaining strength. Consider converting budget sooner.';
  } else if (direction === 'weakening') {
    recommendation = 'Local currency weakening. You may get more for your money if you wait.';
  } else {
    recommendation = 'Currency relatively stable. Good time for budget planning.';
  }
  
  return { direction, confidence, recommendation };
}
```

### Budget Impact Calculation

```typescript
function calculateBudgetImpact(
  currentRate: number,
  monthAgoRate: number,
  budgetUSD: number
): {
  estimatedChange: number;
  percentage: number;
  recommendation: string;
} {
  const currentInLocal = budgetUSD * currentRate;
  const monthAgoInLocal = budgetUSD * monthAgoRate;
  const changeInLocal = currentInLocal - monthAgoInLocal;
  const changeInUSD = changeInLocal / currentRate;
  const percentage = (changeInLocal / monthAgoInLocal) * 100;
  
  let recommendation: string;
  if (Math.abs(percentage) < 2) {
    recommendation = 'Minimal currency impact on your budget. Proceed with current plans.';
  } else if (percentage > 5) {
    recommendation = `Currency strengthening significantly. You'll have ~${Math.abs(changeInUSD).toFixed(0)} USD less purchasing power. Consider increasing budget.`;
  } else if (percentage < -5) {
    recommendation = `Currency weakening significantly. You'll have ~${Math.abs(changeInUSD).toFixed(0)} USD more purchasing power. Great time to travel!`;
  } else {
    recommendation = 'Moderate currency fluctuation. Monitor trends and adjust budget if needed.';
  }
  
  return {
    estimatedChange: Math.round(changeInUSD),
    percentage: Math.round(percentage * 10) / 10,
    recommendation
  };
}
```

### Caching Strategy
- **Cache Key**: `currency:{fromCurrency}:{toCurrency}`
- **TTL**: 1 hour (3600 seconds) - refresh frequently for accuracy
- **Invalidation**: TTL expiry or manual refresh
- **Storage**: LRU cache with 200 entry capacity (many currency pairs)

### Error Handling
```typescript
// Authentication Errors
401/403 → throw ExternalApiError(INVALID_API_KEY, retryable: false)

// Rate Limiting (1000 requests/month)
429 → Fall back to cache, return stale data with warning

// Invalid Currency Code
400 (invalid_currency) → throw ExternalApiError(INVALID_PARAMS, retryable: false)

// Network Errors
TIMEOUT → Retry once, then fall back to cache

// Data Errors
No historical data → Use current rate only, lower confidence
```

### Implementation Checklist
- [ ] Create `CurrencyService` class
- [ ] Implement latest rates fetching
- [ ] Implement historical rates fetching (30-90 days)
- [ ] Build trend analysis algorithm
- [ ] Build prediction engine
- [ ] Calculate budget impact
- [ ] Implement rate caching with 1-hour TTL
- [ ] Add comprehensive error handling
- [ ] Handle free tier limitations (1000 requests/month)
- [ ] Write unit tests for trend analysis
- [ ] Add integration tests with mock API responses

---

## NewsAPI Integration

### Overview
**Purpose**: Current events, safety alerts, relevant news for destination  
**Rate Limit**: 100 requests/day (free tier)  
**Documentation**: https://newsapi.org/docs

### API Endpoints Used

#### 1. Everything Endpoint (Search)
```http
GET https://newsapi.org/v2/everything
Query Parameters:
  apiKey: {API_KEY}
  q: string (search query)
  language: en
  sortBy: publishedAt | relevancy | popularity
  from: YYYY-MM-DD (start date)
  to: YYYY-MM-DD (end date)
  pageSize: number (max 100)
  
Response:
{
  "status": "ok",
  "totalResults": 245,
  "articles": [
    {
      "source": {
        "id": "bbc-news",
        "name": "BBC News"
      },
      "author": "John Smith",
      "title": "Barcelona Implements New Student Housing Regulations",
      "description": "New rules aim to increase affordable housing...",
      "url": "https://bbc.com/news/...",
      "urlToImage": "https://bbc.com/images/...",
      "publishedAt": "2024-09-28T14:30:00Z",
      "content": "Barcelona's city council has approved..."
    }
  ]
}
```

#### 2. Top Headlines Endpoint
```http
GET https://newsapi.org/v2/top-headlines
Query Parameters:
  apiKey: {API_KEY}
  country: us | gb | es | br (ISO 3166-1 alpha-2)
  category: general | business | health | science | sports | technology
  q: string (keyword)
  pageSize: number (max 100)
  
Response:
{
  "status": "ok",
  "totalResults": 38,
  "articles": [...]
}
```

### Service Interface

```typescript
interface NewsAPIService {
  // Core Methods
  getNewsAlerts(city: string, country: string): Promise<NewsInsights>;
  searchNews(params: NewsSearchParams): Promise<ApiResponse<NewsInsights>>;
  
  // Configuration
  isConfigured(): boolean;
  getQuotaUsage(): { used: number; limit: number; remaining: number };
}

interface NewsInsights {
  articles: NewsArticle[];          // Filtered relevant articles
  categories: {
    safety: NewsArticle[];          // Safety-related news
    events: NewsArticle[];          // Upcoming events
    housing: NewsArticle[];         // Housing market news
    transportation: NewsArticle[];  // Transport updates
    culture: NewsArticle[];         // Cultural events
  };
  recentAlerts: NewsAlert[];        // High-priority alerts
  sentiment: {
    overall: 'positive' | 'neutral' | 'negative';
    score: number;                  // -1 to 1
  };
  confidence: number;               // Based on article recency/relevance
}

interface NewsAlert {
  type: 'safety' | 'weather' | 'strike' | 'event' | 'policy';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  actionRequired?: string;          // What user should do
}
```

### Search Query Construction

```typescript
function buildNewsQueries(city: string, country: string): string[] {
  return [
    // Safety and events
    `${city} safety OR crime OR security`,
    `${city} student OR housing OR accommodation`,
    `${city} strike OR protest OR demonstration`,
    
    // Transportation
    `${city} metro OR transport OR airport`,
    
    // Cultural events
    `${city} festival OR event OR concert`,
    
    // General news
    `${country} travel advisory OR warning`
  ];
}
```

### Article Categorization

```typescript
function categorizeArticle(article: NewsArticle): string[] {
  const text = `${article.title} ${article.description}`.toLowerCase();
  const categories: string[] = [];
  
  // Safety
  if (/safety|crime|theft|security|police|danger|warning/i.test(text)) {
    categories.push('safety');
  }
  
  // Events
  if (/festival|concert|event|celebration|conference/i.test(text)) {
    categories.push('events');
  }
  
  // Housing
  if (/housing|rent|accommodation|apartment|tenant|landlord/i.test(text)) {
    categories.push('housing');
  }
  
  // Transportation
  if (/transport|metro|bus|train|strike|airport|flight/i.test(text)) {
    categories.push('transportation');
  }
  
  // Culture
  if (/culture|museum|art|theater|music|exhibition/i.test(text)) {
    categories.push('culture');
  }
  
  return categories.length > 0 ? categories : ['general'];
}
```

### Alert Generation Logic

```typescript
function generateAlerts(articles: NewsArticle[]): NewsAlert[] {
  const alerts: NewsAlert[] = [];
  
  for (const article of articles) {
    const text = `${article.title} ${article.description}`.toLowerCase();
    
    // Critical Safety Alert
    if (/terror|attack|shooting|explosion|emergency/i.test(text)) {
      alerts.push({
        type: 'safety',
        severity: 'critical',
        title: article.title,
        summary: article.description,
        url: article.url,
        publishedAt: article.publishedAt,
        actionRequired: 'Avoid affected areas. Contact local authorities if needed.'
      });
    }
    
    // High Severity Alerts
    if (/strike|protest|shutdown|closure/i.test(text)) {
      alerts.push({
        type: 'strike',
        severity: 'high',
        title: article.title,
        summary: article.description,
        url: article.url,
        publishedAt: article.publishedAt,
        actionRequired: 'Plan alternative transportation. Expect delays.'
      });
    }
    
    // Weather Alerts
    if (/storm|hurricane|flood|earthquake|disaster/i.test(text)) {
      alerts.push({
        type: 'weather',
        severity: 'high',
        title: article.title,
        summary: article.description,
        url: article.url,
        publishedAt: article.publishedAt,
        actionRequired: 'Follow local emergency procedures. Have emergency supplies ready.'
      });
    }
    
    // Policy Changes
    if (/visa|immigration|policy|regulation|law change/i.test(text)) {
      alerts.push({
        type: 'policy',
        severity: 'medium',
        title: article.title,
        summary: article.description,
        url: article.url,
        publishedAt: article.publishedAt,
        actionRequired: 'Review new requirements. Update documents if necessary.'
      });
    }
  }
  
  // Sort by severity
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}
```

### Sentiment Analysis

```typescript
function analyzeSentiment(articles: NewsArticle[]): {
  overall: 'positive' | 'neutral' | 'negative';
  score: number;
} {
  let totalScore = 0;
  
  for (const article of articles) {
    const text = `${article.title} ${article.description}`.toLowerCase();
    
    // Positive keywords
    const positiveWords = ['safe', 'improve', 'growth', 'success', 'award', 'celebration'];
    const positiveCount = positiveWords.filter(word => text.includes(word)).length;
    
    // Negative keywords
    const negativeWords = ['danger', 'crime', 'warning', 'crisis', 'problem', 'threat'];
    const negativeCount = negativeWords.filter(word => text.includes(word)).length;
    
    totalScore += (positiveCount - negativeCount);
  }
  
  const averageScore = totalScore / articles.length;
  const normalizedScore = Math.max(-1, Math.min(1, averageScore / 3)); // Normalize to -1 to 1
  
  let overall: 'positive' | 'neutral' | 'negative';
  if (normalizedScore > 0.2) {
    overall = 'positive';
  } else if (normalizedScore < -0.2) {
    overall = 'negative';
  } else {
    overall = 'neutral';
  }
  
  return { overall, score: normalizedScore };
}
```

### Caching Strategy
- **Cache Key**: `news:{city}:{country}`
- **TTL**: 3 hours (10800 seconds) - balance freshness with quota
- **Invalidation**: TTL expiry or manual refresh
- **Storage**: LRU cache with 100 entry capacity

### Quota Management
```typescript
interface NewsQuotaTracker {
  dailyLimit: 100;
  requestsUsed: number;
  resetTime: Date;
  
  // Conservative limits
  maxArticlesPerRequest: 50;
  maxRequestsPerDestination: 2; // For multiple query searches
}

// Only fetch news if critical or cache expired
function shouldFetchNews(cacheAge: number, priority: 'high' | 'low'): boolean {
  if (priority === 'high') return true;
  if (cacheAge > 3 * 60 * 60) return true; // 3 hours
  return false;
}
```

### Error Handling
```typescript
// Authentication Errors
401 → throw ExternalApiError(INVALID_API_KEY, retryable: false)

// Rate Limiting
429 → Fall back to cache, disable until next day

// No Results
0 articles → Return empty insights with warning

// Network Errors
TIMEOUT → Retry once, then fall back to cache

// Data Errors
Invalid response → Log error, return cached data or empty insights
```

### Implementation Checklist
- [ ] Create `NewsAPIService` class
- [ ] Implement article search with multiple queries
- [ ] Build article categorization engine
- [ ] Implement alert generation logic
- [ ] Build sentiment analysis
- [ ] Implement quota tracking and management
- [ ] Calculate confidence scores
- [ ] Integrate with cache service
- [ ] Add comprehensive error handling
- [ ] Write unit tests for categorization and sentiment
- [ ] Add integration tests with mock API responses

---

## Caching Strategy

### LRU Cache Implementation

#### Architecture
```
CacheService (Singleton)
├── Multiple Cache Namespaces
│   ├── reddit-cache (capacity: 50, TTL: 6h)
│   ├── youtube-cache (capacity: 100, TTL: 24h)
│   ├── currency-cache (capacity: 200, TTL: 1h)
│   ├── news-cache (capacity: 100, TTL: 3h)
│   └── destination-cache (capacity: 50, TTL: 6h)
```

#### Cache Key Structure
```typescript
// Destination Intelligence
`destination:${city}:${country}:${origin}:${budget}:${interests}`
// Example: "destination:barcelona:spain:virginia:2000:art,food"

// Reddit Insights
`reddit:${query}:${subreddits.join(',')}`
// Example: "reddit:barcelona student:barcelona,spain,studyabroad"

// YouTube Insights
`youtube:${city}:${country}:${interests.join(',')}`
// Example: "youtube:barcelona:spain:art,food"

// Currency Data
`currency:${fromCurrency}:${toCurrency}`
// Example: "currency:USD:EUR"

// News Insights
`news:${city}:${country}`
// Example: "news:barcelona:spain"
```

#### TTL Configuration
```typescript
const CACHE_TTL = {
  REDDIT: 21600,        // 6 hours (community data changes slowly)
  YOUTUBE: 86400,       // 24 hours (video content is static)
  CURRENCY: 3600,       // 1 hour (exchange rates need freshness)
  NEWS: 10800,          // 3 hours (balance freshness with quota)
  DESTINATION: 21600    // 6 hours (comprehensive intelligence)
};
```

#### Cache Operations

```typescript
// Get with automatic expiry check
const cached = cache.get(key);
if (cached) {
  console.log('[Cache Hit]', key);
  return cached;
}

// Set with custom TTL
cache.set(key, data, { ttl: 3600 }); // 1 hour

// Force refresh
cache.delete(key);
const fresh = await fetchFromAPI();
cache.set(key, fresh);

// Periodic cleanup
setInterval(() => {
  const cleaned = cache.cleanExpired();
  console.log(`Cleaned ${cleaned} expired entries`);
}, 3600000); // Every hour
```

#### Cache Statistics

```typescript
interface CacheStats {
  size: number;           // Current entries
  capacity: number;       // Max entries
  hitRate: number;        // % of hits
  missRate: number;       // % of misses
  evictions: number;      // LRU evictions count
  oldestEntry: string;    // Least recently used
  newestEntry: string;    // Most recently used
}

// Get stats for monitoring
const stats = cacheService.getAllStats();
console.log('Cache Performance:', stats);
```

---

## Error Handling & Fallbacks

### Error Hierarchy
```
ExternalApiError (base)
├── AuthenticationError (401/403)
├── RateLimitError (429)
├── NetworkError (timeout, connection refused)
├── ValidationError (400, invalid params)
├── ServiceUnavailableError (500, 502, 503, 504)
└── DataError (parsing, empty response)
```

### Fallback Chain

```typescript
async function fetchDataWithFallback<T>(
  primary: () => Promise<T>,
  fallbacks: Array<() => Promise<T | null>>
): Promise<T> {
  try {
    return await primary();
  } catch (primaryError) {
    console.warn('Primary source failed:', primaryError);
    
    for (const [index, fallback] of fallbacks.entries()) {
      try {
        console.log(`Trying fallback ${index + 1}...`);
        const result = await fallback();
        if (result) return result;
      } catch (fallbackError) {
        console.warn(`Fallback ${index + 1} failed:`, fallbackError);
      }
    }
    
    // All fallbacks exhausted
    throw new Error('All data sources failed');
  }
}

// Usage
const redditInsights = await fetchDataWithFallback(
  // Primary: API call
  () => redditService.getCommunityInsights(city, country),
  
  // Fallbacks
  [
    // 1. Cached data
    () => cache.get(cacheKey),
    
    // 2. Partial data from other sources
    () => getPartialInsightsFromYouTube(),
    
    // 3. Empty insights
    () => Promise.resolve(createEmptyInsights())
  ]
);
```

### Retry Strategy

```typescript
interface RetryConfig {
  maxRetries: 3;
  baseDelay: 1000;        // 1 second
  maxDelay: 10000;        // 10 seconds
  backoffMultiplier: 2;   // Exponential backoff
  retryableErrors: [
    'NETWORK_ERROR',
    'TIMEOUT',
    'SERVICE_UNAVAILABLE',
    'RATE_LIMIT_EXCEEDED'
  ];
}

// Exponential backoff calculation
function calculateDelay(attempt: number, config: RetryConfig): number {
  const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);
  return Math.min(delay, config.maxDelay);
}

// Example retry delays:
// Attempt 1: 1000ms (1s)
// Attempt 2: 2000ms (2s)
// Attempt 3: 4000ms (4s)
// Max delay: 10000ms (10s)
```

### Error Recovery Patterns

#### 1. Graceful Degradation
```typescript
try {
  const fullData = await fetchCompleteData();
  return { ...fullData, confidence: 1.0 };
} catch (error) {
  console.warn('Falling back to partial data');
  const partialData = await fetchPartialData();
  return { ...partialData, confidence: 0.6, warning: 'Limited data available' };
}
```

#### 2. Circuit Breaker
```typescript
class CircuitBreaker {
  private failures = 0;
  private threshold = 5;
  private timeout = 60000; // 1 minute
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private nextAttempt: Date;
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt.getTime()) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }
  
  private onFailure() {
    this.failures++;
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = new Date(Date.now() + this.timeout);
      console.warn('Circuit breaker opened. Retrying in 1 minute.');
    }
  }
}
```

#### 3. Timeout Handling
```typescript
async function fetchWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 5000
): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
  );
  
  return Promise.race([promise, timeout]);
}

// Usage
const data = await fetchWithTimeout(
  redditService.getCommunityInsights('barcelona', 'spain'),
  10000 // 10 second timeout
);
```

---

## Rate Limiting & Quotas

### API Quota Limits

| Service | Free Tier Limit | Rate Limit | Reset Period |
|---------|----------------|------------|--------------|
| Reddit | Unlimited | 60 req/min | Rolling |
| YouTube | 10,000 units/day | 100 units/search | Daily (midnight PT) |
| OpenExchangeRates | 1,000 req/month | No rate limit | Monthly |
| NewsAPI | 100 req/day | No rate limit | Daily (UTC) |

### Quota Tracking

```typescript
interface QuotaTracker {
  service: string;
  limit: number;
  used: number;
  remaining: number;
  resetTime: Date;
  warningThreshold: number; // % of limit (e.g., 80%)
  
  increment(cost: number): void;
  canMakeRequest(cost: number): boolean;
  getStatus(): QuotaStatus;
}

interface QuotaStatus {
  available: boolean;
  remaining: number;
  percentage: number;
  resetIn: number; // milliseconds
  warning?: string;
}

// Usage
const youtubeQuota = new QuotaTracker('youtube', 10000, 0, new Date(), 80);

if (youtubeQuota.canMakeRequest(100)) {
  await youtubeService.search(query);
  youtubeQuota.increment(100);
} else {
  console.warn('YouTube quota exhausted. Using cache.');
  return cache.get(cacheKey);
}
```

### Request Batching

```typescript
// Batch multiple currency conversions into single API call
async function batchCurrencyRequests(requests: CurrencyRequest[]): Promise<CurrencyResult[]> {
  const uniquePairs = [...new Set(requests.map(r => `${r.from}:${r.to}`))];
  
  // Single API call with multiple symbols
  const rates = await currencyService.getMultipleRates(
    uniquePairs.map(pair => pair.split(':')[1])
  );
  
  // Map results back to original requests
  return requests.map(req => ({
    ...req,
    rate: rates[req.to],
    amount: req.amount * rates[req.to]
  }));
}
```

### Priority-Based Throttling

```typescript
enum RequestPriority {
  CRITICAL = 0,  // User-facing requests
  HIGH = 1,      // Background data refresh
  LOW = 2        // Pre-fetching/warming cache
}

class PriorityQueue {
  private queues: Map<RequestPriority, Array<() => Promise<any>>> = new Map();
  private processing = false;
  
  async add<T>(priority: RequestPriority, fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const queue = this.queues.get(priority) || [];
      queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.queues.set(priority, queue);
      this.process();
    });
  }
  
  private async process() {
    if (this.processing) return;
    this.processing = true;
    
    // Process queues in priority order
    for (const priority of [RequestPriority.CRITICAL, RequestPriority.HIGH, RequestPriority.LOW]) {
      const queue = this.queues.get(priority);
      if (queue && queue.length > 0) {
        const fn = queue.shift()!;
        await fn();
        break;
      }
    }
    
    this.processing = false;
    
    // Continue processing if queues not empty
    if (this.hasRequests()) {
      setTimeout(() => this.process(), 100);
    }
  }
  
  private hasRequests(): boolean {
    return Array.from(this.queues.values()).some(q => q.length > 0);
  }
}
```

---

## Security & Authentication

### API Key Management

#### Environment Variables
```bash
# .env.local (NEVER commit this file)
REDDIT_CLIENT_ID=your_client_id_here
REDDIT_CLIENT_SECRET=your_client_secret_here
REDDIT_USER_AGENT=AdaptiveTravelAgent/1.0

YOUTUBE_API_KEY=your_api_key_here

OPENEXCHANGERATES_API_KEY=your_api_key_here

NEWS_API_KEY=your_api_key_here

# Optional: Scraper APIs (fallback only)
FIRECRAWL_API_KEY=your_firecrawl_key
SCRAPERAPI_KEY=your_scraperapi_key
```

#### Configuration Validation
```typescript
function validateConfig(): void {
  const required = {
    reddit: ['REDDIT_CLIENT_ID', 'REDDIT_CLIENT_SECRET'],
    youtube: ['YOUTUBE_API_KEY'],
    currency: ['OPENEXCHANGERATES_API_KEY'],
    news: ['NEWS_API_KEY']
  };
  
  const missing: string[] = [];
  
  for (const [service, keys] of Object.entries(required)) {
    for (const key of keys) {
      if (!process.env[key]) {
        missing.push(`${service}: ${key}`);
      }
    }
  }
  
  if (missing.length > 0) {
    console.warn('Missing API configuration:', missing);
    console.warn('Services will fall back to cached data.');
  }
}

// Run on service initialization
validateConfig();
```

### Authentication Patterns

#### 1. Reddit OAuth 2.0
```typescript
class RedditAuth {
  private accessToken?: string;
  private tokenExpiry?: Date;
  
  async getToken(): Promise<string> {
    // Check if token is still valid
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }
    
    // Request new token
    const auth = Buffer.from(
      `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`
    ).toString('base64');
    
    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': process.env.REDDIT_USER_AGENT || 'AdaptiveTravelAgent/1.0'
      },
      body: 'grant_type=client_credentials'
    });
    
    if (!response.ok) {
      throw new Error('Reddit authentication failed');
    }
    
    const data = await response.json();
    this.accessToken = data.access_token;
    // Refresh 5 minutes before expiry
    this.tokenExpiry = new Date(Date.now() + (data.expires_in - 300) * 1000);
    
    return this.accessToken;
  }
}
```

#### 2. API Key in Headers
```typescript
// YouTube, NewsAPI, OpenExchangeRates
const headers = {
  'Authorization': `Bearer ${apiKey}`, // or 'X-Api-Key', depending on service
  'User-Agent': 'AdaptiveTravelAgent/1.0',
  'Content-Type': 'application/json'
};
```

#### 3. API Key in Query Parameters
```typescript
// Some services require key in URL
const url = new URL('https://api.example.com/endpoint');
url.searchParams.append('apiKey', process.env.API_KEY);
url.searchParams.append('query', searchTerm);

const response = await fetch(url.toString());
```

### Request Security

#### HTTPS Only
```typescript
function ensureHttps(url: string): string {
  if (url.startsWith('http://')) {
    console.warn('Upgrading HTTP to HTTPS:', url);
    return url.replace('http://', 'https://');
  }
  return url;
}
```

#### Input Sanitization
```typescript
function sanitizeQuery(query: string): string {
  // Remove potentially dangerous characters
  return query
    .replace(/[<>]/g, '') // HTML tags
    .replace(/[;&|]/g, '') // Shell metacharacters
    .replace(/\\/g, '') // Escape characters
    .trim()
    .slice(0, 500); // Max length
}
```

#### Rate Limiting Per User
```typescript
// Prevent abuse from single users
const userRateLimits = new Map<string, { count: number; resetTime: Date }>();

function checkUserRateLimit(userId: string, maxRequests: number = 10): boolean {
  const now = new Date();
  const userLimit = userRateLimits.get(userId);
  
  if (!userLimit || userLimit.resetTime < now) {
    // Reset or initialize
    userRateLimits.set(userId, {
      count: 1,
      resetTime: new Date(now.getTime() + 60000) // 1 minute window
    });
    return true;
  }
  
  if (userLimit.count >= maxRequests) {
    return false; // Rate limit exceeded
  }
  
  userLimit.count++;
  return true;
}
```

---

## Implementation Checklist

### Phase 1: Foundation (Completed)
- [x] Design comprehensive TypeScript interfaces (`/lib/types/external-apis.ts`)
- [x] Implement error handling utilities (`/lib/utils/api-error-handler.ts`)
- [x] Implement LRU cache service (`/lib/utils/cache-service.ts`)
- [x] Define retry strategies and circuit breakers
- [x] Create API specifications document (this file)

### Phase 2: Service Implementations (Next)
- [ ] **Reddit Service** (`/lib/services/reddit-service.ts`)
  - [ ] OAuth 2.0 authentication with auto-refresh
  - [ ] Multi-subreddit search aggregation
  - [ ] Insights extraction (topics, concerns, costs, safety, housing, experiences)
  - [ ] Confidence scoring algorithm
  - [ ] Cache integration (6-hour TTL)
  - [ ] Unit tests for extraction logic
  - [ ] Integration tests with mock responses

- [ ] **YouTube Service** (`/lib/services/youtube-service.ts`)
  - [ ] Search with multiple queries
  - [ ] Video statistics fetching (views, likes, duration)
  - [ ] Video categorization (cost, student life, tours, culture)
  - [ ] Trending topic extraction
  - [ ] Quota tracking and warnings
  - [ ] Cache integration (24-hour TTL)
  - [ ] Unit tests for categorization
  - [ ] Integration tests with mock responses

- [ ] **Currency Service** (`/lib/services/currency-service.ts`)
  - [ ] Latest rates fetching
  - [ ] Historical rates fetching (30-90 days)
  - [ ] Trend analysis (day, week, month changes)
  - [ ] Prediction engine (direction, confidence)
  - [ ] Budget impact calculation
  - [ ] Cache integration (1-hour TTL)
  - [ ] Unit tests for trend analysis
  - [ ] Integration tests with mock responses

- [ ] **News Service** (`/lib/services/news-service.ts`)
  - [ ] Article search with multiple queries
  - [ ] Article categorization (safety, events, housing, transport, culture)
  - [ ] Alert generation (critical, high, medium, low)
  - [ ] Sentiment analysis
  - [ ] Quota tracking (100 requests/day)
  - [ ] Cache integration (3-hour TTL)
  - [ ] Unit tests for categorization and sentiment
  - [ ] Integration tests with mock responses

### Phase 3: Integration
- [ ] Update `DestinationAgent` to call all services
- [ ] Implement `synthesizeMultiSourceData()` method
- [ ] Add service configuration checks (`isConfigured()`)
- [ ] Handle partial data gracefully (some services may fail)
- [ ] Update confidence scoring based on available sources
- [ ] Add social insights to `DestinationIntelligence` type

### Phase 4: Testing & Optimization
- [ ] End-to-end integration tests
- [ ] Performance testing (parallel API calls)
- [ ] Cache hit rate optimization
- [ ] Error handling edge cases
- [ ] Rate limit adherence verification
- [ ] Load testing for multiple concurrent users

### Phase 5: Monitoring & Observability
- [ ] Add structured logging for all API calls
- [ ] Implement metrics tracking (latency, errors, cache hits)
- [ ] Set up quota monitoring and alerts
- [ ] Create dashboard for API health status
- [ ] Document operational runbook

---

## Appendix

### API Cost Analysis (Monthly)
- **Reddit API**: Free (with OAuth 2.0)
- **YouTube Data API**: Free (10,000 units/day = 100 searches/day)
- **OpenExchangeRates**: Free (1,000 requests/month)
- **NewsAPI**: Free (100 requests/day)
- **Total Monthly Cost**: $0 (within free tier limits)

### Alternative Services (If Free Tier Exhausted)
- **Reddit**: Direct web scraping (legal, but less reliable)
- **YouTube**: Direct web scraping or RSS feeds
- **Currency**: Alternative free APIs (ExchangeRate-API, Fixer.io free tier)
- **News**: Alternative free APIs (GNews, Currents API)

### Related Documentation
- [CLAUDE.md](../CLAUDE.md) - Project guidelines and standards
- [PLANNING.md](../PLANNING.md) - Sprint plan and milestones
- [TASKS.md](../TASKS.md) - Detailed task tracking
- [api.md](../api.md) - API integration instructions (original requirements)

### Revision History
| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-10-01 | Initial comprehensive specification | API Architect |

---

**End of API Integration Specifications**

*This document serves as the authoritative reference for all external API integrations. All implementations must adhere to these specifications for consistency, reliability, and maintainability.*
