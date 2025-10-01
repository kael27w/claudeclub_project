# Universal Destination Intelligence Architecture

## 🌍 Vision
Build a **truly universal** destination intelligence system that works for ANY study abroad location worldwide, using AI-powered research agents instead of static APIs or hardcoded data.

## 🎯 Core Strategy

### The Problem with Current Approach
- ❌ Hardcoded mock data (São Paulo, Barcelona, Tokyo only)
- ❌ Expensive APIs with limited coverage (Amadeus, Numbeo)
- ❌ Static data that becomes outdated quickly
- ❌ Can't handle arbitrary destinations

### The Universal Solution
- ✅ **Perplexity Pro API**: Real-time research for ANY destination
- ✅ **Claude 4.5**: Parse and synthesize research into structured intelligence
- ✅ **Free APIs**: Reddit, YouTube, NewsAPI, OpenExchangeRates for supporting data
- ✅ **Dynamic Location Processing**: Parse any city/country combination
- ✅ **Smart Caching**: 6-hour cache for research results

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Input                           │
│  "Studying in Barcelona for 5 months, $3000 budget,    │
│   coming from New York, love architecture and nightlife"│
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│            Location Parser & Validator                  │
│  - Extract: Barcelona, Spain, New York, USA            │
│  - Validate: City exists, country is correct           │
│  - Map: BCN airport code, timezone, language           │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│           Perplexity Research Agents (5 agents)         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  1. Housing Agent: Current rent prices near     │   │
│  │     universities, safe neighborhoods             │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  2. Cultural Intelligence Agent: Local customs,  │   │
│  │     language basics, student-friendly activities │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  3. Safety & News Agent: Current safety ratings, │   │
│  │     recent events, emergency contacts            │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  4. Cost of Living Agent: Food, transport,       │   │
│  │     utilities, entertainment costs               │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  5. Flight Intelligence Agent: Price trends,     │   │
│  │     booking windows, budget airlines             │   │
│  └─────────────────────────────────────────────────┘   │
└────────────────┬────────────────────────────────────────┘
                 │ Raw research text (5 responses)
                 ▼
┌─────────────────────────────────────────────────────────┐
│              Claude Processing Engine                   │
│  - Parse Perplexity research into structured JSON      │
│  - Extract prices, dates, recommendations              │
│  - Generate budget optimization plan                   │
│  - Create personalized suggestions based on interests  │
│  - Synthesize comprehensive destination report         │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│              Free API Integration Layer                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Reddit API: Pull insights from r/Barcelona,     │   │
│  │  r/studyabroad, r/expats subreddits             │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  YouTube Data API: Cost-of-living vlogs,         │   │
│  │  cultural orientation videos                     │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  NewsAPI: Current events, safety updates         │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  OpenExchangeRates: Live USD→EUR conversion      │   │
│  └─────────────────────────────────────────────────┘   │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│                Smart Caching Layer                      │
│  - Cache by city/country key for 6 hours              │
│  - Invalidate on user request or stale data           │
│  - Fallback to cache if APIs fail                     │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│             Destination Intelligence Output             │
│  {                                                      │
│    "city": "Barcelona",                                │
│    "country": "Spain",                                 │
│    "costAnalysis": { flights, housing, living },      │
│    "culturalGuide": { customs, phrases, safety },     │
│    "budgetPlan": { breakdown, tips, feasibility },    │
│    "recommendations": [ personalized based on user ]  │
│  }                                                      │
└─────────────────────────────────────────────────────────┘
```

---

## 🔬 Component Design

### 1. Location Parser (`lib/location-parser.ts`)

```typescript
interface ParsedLocation {
  city: string;
  country: string;
  countryCode: string; // ISO 3166-1 alpha-2
  airportCode?: string; // IATA code
  timezone: string;
  primaryLanguage: string;
  currency: string;
  coordinates: { lat: number; lng: number };
}

interface UserOrigin {
  city?: string;
  state?: string;
  country: string;
  countryCode: string;
  airportCode?: string;
}

class LocationParser {
  async parseDestination(input: string): Promise<ParsedLocation>
  async parseOrigin(input: string): Promise<UserOrigin>
  async validateLocation(city: string, country: string): Promise<boolean>
  async getNearestAirport(city: string): Promise<string>
}
```

**Features:**
- Parse natural language: "São Paulo", "Barcelona, Spain", "Tokyo, Japan"
- Handle multiple formats and common variations
- Validate against known cities/countries (use REST Countries API)
- Map to airport codes for flight searches
- Extract timezone and currency information

---

### 2. Perplexity Research Agents (`lib/perplexity-agents.ts`)

```typescript
interface ResearchAgent {
  name: string;
  prompt: (location: ParsedLocation, context: UserContext) => string;
  maxTokens: number;
}

class PerplexityResearchService {
  // 5 specialized research agents
  housingAgent: ResearchAgent;
  culturalIntelligenceAgent: ResearchAgent;
  safetyNewsAgent: ResearchAgent;
  costOfLivingAgent: ResearchAgent;
  flightIntelligenceAgent: ResearchAgent;

  async conductResearch(
    location: ParsedLocation,
    origin: UserOrigin,
    context: UserContext
  ): Promise<PerplexityResearchResults>;

  private async queryPerplexity(
    prompt: string,
    maxTokens: number
  ): Promise<string>;
}
```

**Agent Prompts (Dynamic):**

1. **Housing Agent:**
```
Find current student housing costs in {city}, {country}, including:
- University dormitories near major universities
- Shared apartments in safe neighborhoods
- Monthly Airbnb rates for 3-6 month stays
- Average utilities (electricity, water, internet)
- Security deposits and typical contracts
Focus on areas safe for international students within 30 minutes of universities.
```

2. **Cultural Intelligence Agent:**
```
Research {city} culture for international students from {user_origin_country}:
- 20 essential {local_language} phrases for daily life
- Student-friendly attractions and activities related to {user_interests}
- Local food costs (groceries vs restaurants)
- Cultural customs and etiquette that differ from {user_origin_country}
- Student discounts and special programs
- Social norms around friendships, dating, and nightlife
```

3. **Safety & News Agent:**
```
Current safety information for {city}, {country} international student areas:
- Safety ratings by neighborhood (use recent crime statistics)
- Recent news affecting international students (last 30 days)
- Transportation safety (public transit, taxis, walking at night)
- Emergency contacts (police, hospitals, embassy for {user_origin_country} citizens)
- Common scams targeting students
- Natural disaster risks and weather patterns
```

4. **Cost of Living Agent:**
```
Detailed monthly living costs in {city} for students:
- Food: groceries vs restaurants, local markets, dietary options
- Transportation: public transit passes, bike sharing, taxis
- Utilities: mobile plans, internet, electricity, water
- Entertainment: movies, concerts, clubs, sports events
- Other: laundry, toiletries, gym memberships
Provide specific numerical ranges in {local_currency} and USD.
```

5. **Flight Intelligence Agent:**
```
Flight pricing from {origin_city}, {origin_country} to {destination_city}, {destination_country}:
- Current price ranges (budget, standard, premium airlines)
- Seasonal price variations (cheapest and most expensive months)
- Best booking windows (how far in advance)
- Major airlines and typical routes
- Average flight duration and layover cities
- Tips for finding deals (flexible dates, nearby airports)
```

---

### 3. Claude Processing Engine (`lib/claude-processor.ts`)

```typescript
interface PerplexityResearchResults {
  housing: string;
  cultural: string;
  safety: string;
  costs: string;
  flights: string;
}

class ClaudeProcessor {
  async parseAndStructure(
    research: PerplexityResearchResults,
    location: ParsedLocation,
    query: DestinationQuery
  ): Promise<DestinationIntelligence>;

  private async extractHousingData(text: string): Promise<HousingCostAnalysis>;
  private async extractCulturalData(text: string): Promise<CulturalIntelligence>;
  private async generateBudgetPlan(
    costs: CostData,
    budget: number,
    duration: number
  ): Promise<BudgetOptimization>;
  private async personalizeRecommendations(
    data: any,
    interests: string[],
    origin: UserOrigin
  ): Promise<PersonalizedRecommendations>;
}
```

**Claude Prompting Strategy:**
```
You are a travel data analyst. Parse this research about {city}:

{perplexity_research}

Extract structured data as JSON:
{
  "housing": {
    "studentDorms": { "min": 450, "max": 800, "currency": "EUR" },
    "sharedApartments": { "min": 600, "max": 1200, "currency": "EUR" },
    "utilities": { "average": 150, "currency": "EUR" }
  },
  "costs": {
    "groceries": { "monthly": 250 },
    "restaurants": { "meal": 12 },
    "transport": { "monthly_pass": 40 }
  }
}

Be precise with numbers. If ranges given, use min/max. Convert all to USD.
```

---

### 4. Free API Integration (`lib/free-apis.ts`)

```typescript
class FreeAPIService {
  // Reddit API (OAuth not required for public subreddits)
  async fetchRedditInsights(
    city: string,
    country: string
  ): Promise<RedditInsight[]>;

  // YouTube Data API (free tier: 10,000 requests/day)
  async fetchYouTubeVideos(
    city: string,
    keywords: string[]
  ): Promise<YouTubeVideo[]>;

  // NewsAPI (free tier: 100 requests/day)
  async fetchRecentNews(
    city: string,
    country: string
  ): Promise<NewsArticle[]>;

  // OpenExchangeRates (free tier: 1000 requests/month)
  async getCurrencyConversion(
    fromCurrency: string,
    toCurrency: string
  ): Promise<ExchangeRate>;
}
```

**API Integration Details:**

1. **Reddit API:**
   - Subreddits: r/{city_name}, r/studyabroad, r/expats, r/{country}
   - Search for: "cost of living", "student life", "housing", "safety"
   - Parse top comments for insights
   - No auth required for public data

2. **YouTube Data API:**
   - Search: "{city} cost of living", "{city} student life"
   - Filter: Upload date within last year, high view count
   - Extract: Video titles, descriptions, channel names
   - Free tier: 10,000 quota units/day (1 search = 100 units)

3. **NewsAPI:**
   - Search: News from {city} in last 30 days
   - Filter: English language, relevant to students/expats
   - Extract: Headlines, summaries, source, date
   - Free tier: 100 requests/day (sufficient for demos)

4. **OpenExchangeRates:**
   - Get live exchange rates
   - Historical trends (last 6 months)
   - Calculate budget impact of currency fluctuations
   - Free tier: 1000 requests/month

---

### 5. Smart Caching Layer (`lib/cache-service.ts`)

```typescript
interface CacheKey {
  city: string;
  country: string;
  queryType: 'full' | 'housing' | 'costs' | 'cultural';
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class CacheService {
  private cache: Map<string, CacheEntry<any>>;
  private readonly TTL = 6 * 60 * 60 * 1000; // 6 hours

  async get<T>(key: CacheKey): Promise<T | null>;
  async set<T>(key: CacheKey, data: T): Promise<void>;
  async invalidate(key: CacheKey): Promise<void>;
  async clear(): Promise<void>;

  private generateKey(key: CacheKey): string;
  private isExpired(entry: CacheEntry<any>): boolean;
}
```

**Caching Strategy:**
- Cache Perplexity research for 6 hours (data doesn't change frequently)
- Cache free API responses for 1 hour
- Cache currency rates for 12 hours
- Implement LRU eviction if memory exceeds 100MB
- Fallback to stale cache if APIs fail

---

## 🚀 Implementation Priority

### Phase 1: Location Processing (Hours 5-6)
- [ ] Create `lib/location-parser.ts`
- [ ] Implement city/country extraction from natural language
- [ ] Add validation using REST Countries API
- [ ] Map to airport codes, timezones, currencies
- [ ] Unit tests for various input formats

### Phase 2: Perplexity Integration (Hours 6-8)
- [ ] Setup Perplexity API client
- [ ] Implement 5 research agents with dynamic prompts
- [ ] Create `lib/perplexity-agents.ts`
- [ ] Test with Barcelona, Tokyo, London examples
- [ ] Handle API errors gracefully

### Phase 3: Claude Processing (Hours 8-10)
- [ ] Create `lib/claude-processor.ts`
- [ ] Implement research parsing into structured JSON
- [ ] Add budget optimization logic
- [ ] Generate personalized recommendations
- [ ] Test with real Perplexity research results

### Phase 4: Free APIs (Hours 10-12)
- [ ] Integrate Reddit API (no auth required)
- [ ] Integrate YouTube Data API
- [ ] Integrate NewsAPI
- [ ] Integrate OpenExchangeRates
- [ ] Create `lib/free-apis.ts`

### Phase 5: Caching (Hours 12-13)
- [ ] Implement in-memory cache service
- [ ] Add TTL and LRU eviction
- [ ] Test cache hit/miss scenarios
- [ ] Add cache invalidation endpoint

### Phase 6: Integration & Testing (Hours 13-15)
- [ ] Update API route to use universal system
- [ ] Test with 5+ global destinations
- [ ] Verify data quality and accuracy
- [ ] Performance optimization

---

## 📊 Example Flow

**User Input:**
```
"I'm studying at FGV in São Paulo for 4 months, $2000 budget, love art and local food, coming from Virginia"
```

**Step 1: Location Parser**
```json
{
  "destination": {
    "city": "São Paulo",
    "country": "Brazil",
    "countryCode": "BR",
    "currency": "BRL",
    "airportCode": "GRU",
    "timezone": "America/Sao_Paulo"
  },
  "origin": {
    "state": "Virginia",
    "country": "United States",
    "countryCode": "US",
    "airportCode": "IAD" // Washington Dulles
  }
}
```

**Step 2: Perplexity Research (5 parallel queries)**
```
Agent 1 (Housing): "Current student housing costs in São Paulo, Brazil..."
Agent 2 (Cultural): "São Paulo culture for students from United States, focusing on art and local food..."
Agent 3 (Safety): "Current safety ratings for São Paulo international student areas..."
Agent 4 (Costs): "Detailed monthly living costs in São Paulo for students..."
Agent 5 (Flights): "Flight pricing from Washington DC area to São Paulo..."
```

**Step 3: Claude Processing**
- Parse 5 research responses
- Extract structured data (prices, recommendations, tips)
- Generate budget breakdown for $2000 over 4 months
- Create art-focused and food-focused recommendations
- Compare Brazilian vs American culture

**Step 4: Free API Enhancement**
- Reddit: Pull posts from r/saopaulo, r/Brazil, r/studyabroad
- YouTube: Find "São Paulo student life" and "São Paulo food guide" videos
- NewsAPI: Recent São Paulo news
- OpenExchangeRates: USD→BRL conversion ($2000 = ~R$10,000)

**Step 5: Final Output**
```json
{
  "city": "São Paulo",
  "summary": "São Paulo offers vibrant art scene and incredible food culture...",
  "costAnalysis": {
    "flights": {
      "price_range": { "min": 850, "max": 1200 },
      "seasonal_note": "Cheapest: May-June, Most expensive: Dec-Jan"
    },
    "housing": {
      "student_dorms": { "monthly": 450 },
      "shared_apartments": { "monthly": 650 }
    }
  },
  "culturalGuide": {
    "art_scene": "MASP, Pinacoteca, street art in Vila Madalena...",
    "food_recommendations": "Local markets like Mercado Municipal..."
  },
  "budgetPlan": {
    "feasibility": "Tight but doable",
    "monthly_breakdown": { "housing": 650, "food": 300, "transport": 80, "activities": 120 }
  }
}
```

---

## 🔑 API Keys Required

```env
# Primary AI APIs
ANTHROPIC_API_KEY=           # Claude 4.5
PERPLEXITY_API_KEY=          # Perplexity Pro (paid tier recommended)

# Free APIs (no credit card required)
OPENEXCHANGERATES_APP_ID=    # Free tier: 1000 requests/month
YOUTUBE_DATA_API_KEY=        # Free tier: 10,000 quota/day
NEWSAPI_API_KEY=             # Free tier: 100 requests/day

# Optional (Reddit API uses public endpoints, no auth required)
```

---

## ✅ Success Criteria

**Universal Coverage:**
- ✅ Works for ANY city/country combination worldwide
- ✅ No hardcoded city data
- ✅ Dynamic research adapts to user interests

**Data Quality:**
- ✅ Current data (Perplexity searches web in real-time)
- ✅ Accurate pricing information
- ✅ Relevant cultural insights

**Performance:**
- ✅ First query: 15-20 seconds (5 Perplexity queries + Claude processing)
- ✅ Cached queries: <2 seconds
- ✅ Graceful degradation if APIs fail

**Cost Efficiency:**
- ✅ Perplexity: ~$0.005 per query (5 queries = $0.025)
- ✅ Claude: ~$0.003 per processing
- ✅ Free APIs: $0
- ✅ **Total per destination: ~$0.03** vs $0 for cached queries

---

## 📈 Competitive Advantages

1. **Universal Coverage**: Works for 1000+ study abroad destinations vs competitors' 10-20 cities
2. **Current Data**: Real-time research vs outdated static data
3. **Personalized**: Adapts to user's origin, interests, budget
4. **Cost Effective**: $0.03 per query vs $1-5 for traditional APIs
5. **Intelligent**: Claude synthesizes insights vs raw data dumps

---

**This architecture transforms the destination intelligence system from a limited demo into a production-ready, universally applicable platform that can help students plan for ANY study abroad destination worldwide.**
