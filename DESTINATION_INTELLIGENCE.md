# Study Abroad Destination Intelligence - Architecture

## 🎯 Core Mission
Replace outdated university fact sheets with real-time, AI-powered destination intelligence for study abroad students planning extended stays (1+ months) in foreign cities.

## 📋 Primary Use Case

**Target User:** Study abroad student planning a semester/year abroad
**Example Query:** "I'm studying at FGV in São Paulo for 4 months, $2000 budget, love art and local food, coming from Virginia"

**Expected Output:**
1. Real-time cost analysis (flights, housing, food, transport)
2. Cultural integration guidance (customs, activities, language)
3. Dynamic budget optimization (currency impact, spending breakdown)
4. Live monitoring alerts (price changes, currency fluctuations)
5. Personalized recommendations (based on background, interests, budget)

---

## 🏗️ System Architecture

### Phase 1: Core Intelligence Engine (MVP)

#### 1.1 Query Analysis System
**File:** `lib/destination-agent.ts`

```typescript
interface DestinationQuery {
  university?: string;
  city: string;
  country: string;
  duration: string;
  budget: number;
  currency: string;
  interests: string[];
  dietaryRestrictions?: string[];
  origin: string;
}

class DestinationIntelligenceAgent {
  async analyzeQuery(query: string): Promise<DestinationQuery>
  async generateIntelligence(query: DestinationQuery): Promise<DestinationIntelligence>
}
```

**Responsibilities:**
- Parse natural language query using Claude
- Extract structured data (location, budget, duration, interests)
- Identify user background/origin for cultural context
- Determine priority information needs

#### 1.2 Real-time Cost Intelligence
**File:** `lib/services/cost-intelligence.ts`

**Data Sources:**
- Flight prices: Amadeus API / Skyscanner
- Housing costs: Numbeo API / local rental sites
- Food/transport: Numbeo API
- Currency: XE.com API / Open Exchange Rates

```typescript
interface CostAnalysis {
  flights: {
    current: number;
    trend: 'increasing' | 'stable' | 'decreasing';
    prediction: string;
    bookingRecommendation: string;
  };
  housing: {
    studentHousing: MonthlyRange;
    airbnb: MonthlyRange;
    apartments: MonthlyRange;
    recommendations: string[];
  };
  livingCosts: {
    food: MonthlyRange;
    transport: MonthlyRange;
    entertainment: MonthlyRange;
    utilities: MonthlyRange;
  };
  currency: {
    exchangeRate: number;
    trend: string;
    impact: string;
  };
}
```

#### 1.3 Cultural Integration Engine
**File:** `lib/services/cultural-intelligence.ts`

```typescript
interface CulturalIntelligence {
  localCustoms: {
    greetings: string[];
    diningEtiquette: string[];
    socialNorms: string[];
    tipping: string;
  };
  studentLife: {
    popularActivities: Activity[];
    studentDiscounts: Discount[];
    socialGroups: string[];
    events: Event[];
  };
  language: {
    essentialPhrases: Phrase[];
    difficulty: 'easy' | 'medium' | 'hard';
    resources: Resource[];
  };
  safety: {
    rating: number;
    neighborhoods: Neighborhood[];
    emergencyContacts: Contact[];
  };
}
```

#### 1.4 Budget Optimization System
**File:** `lib/services/budget-optimizer.ts`

```typescript
interface BudgetOptimization {
  breakdown: {
    housing: { amount: number; percentage: number };
    food: { amount: number; percentage: number };
    transport: { amount: number; percentage: number };
    activities: { amount: number; percentage: number };
    emergency: { amount: number; percentage: number };
  };
  recommendations: Recommendation[];
  savingTips: string[];
  monthlyTracking: MonthlyBudget[];
}
```

---

## 🔌 API Integration Strategy

### Priority 1 APIs (MVP)

**1. Amadeus API** - Flight Search
```
Endpoint: GET /v2/shopping/flight-offers
Rate Limit: 2000 calls/month (free tier)
Purpose: Real-time flight prices and trends
```

**2. Numbeo API** - Cost of Living
```
Endpoint: GET /api/cost_of_living
Rate Limit: 500 calls/month (free tier)
Purpose: Housing, food, transport costs
```

**3. Open Exchange Rates** - Currency
```
Endpoint: GET /latest.json
Rate Limit: 1000 calls/month (free tier)
Purpose: Real-time exchange rates
```

**4. Google Places API** - Local Insights
```
Endpoint: GET /maps/api/place/nearbysearch/json
Rate Limit: $200 free credit/month
Purpose: Student areas, restaurants, activities
```

### API Fallback Strategy
```typescript
const fetchWithFallback = async (primary: API, fallback: API, cache: Cache) => {
  // 1. Check cache (5 minute TTL)
  const cached = await cache.get(key);
  if (cached) return cached;

  // 2. Try primary API
  try {
    const data = await primary.fetch();
    await cache.set(key, data);
    return data;
  } catch (error) {
    // 3. Try fallback API
    return await fallback.fetch();
  }
};
```

---

## 📊 Database Schema

### Core Tables

```sql
-- User queries and history
CREATE TABLE destination_queries (
  id UUID PRIMARY KEY,
  user_id UUID,
  query_text TEXT,
  parsed_query JSONB,
  created_at TIMESTAMP
);

-- Cached intelligence data
CREATE TABLE destination_intelligence (
  id UUID PRIMARY KEY,
  city TEXT,
  country TEXT,
  cost_data JSONB,
  cultural_data JSONB,
  cached_at TIMESTAMP,
  expires_at TIMESTAMP
);

-- Price monitoring
CREATE TABLE price_alerts (
  id UUID PRIMARY KEY,
  user_id UUID,
  destination TEXT,
  alert_type TEXT, -- 'flight', 'housing', 'currency'
  threshold DECIMAL,
  current_price DECIMAL,
  triggered BOOLEAN
);
```

---

## 🎨 UI Components Architecture

### Component Hierarchy

```
DestinationIntelligence (page.tsx)
├── QueryInput
│   ├── NaturalLanguageInput
│   └── ExampleQueries
├── IntelligenceDisplay
│   ├── CostAnalysis
│   │   ├── FlightPrices
│   │   ├── HousingCosts
│   │   ├── LivingExpenses
│   │   └── CurrencyImpact
│   ├── CulturalGuide
│   │   ├── LocalCustoms
│   │   ├── StudentLife
│   │   ├── LanguageGuide
│   │   └── SafetyInfo
│   ├── BudgetBreakdown
│   │   ├── MonthlyAllocation
│   │   ├── SavingTips
│   │   └── SpendingTracker
│   └── PriceAlerts
│       ├── AlertSetup
│       └── AlertsList
└── ExportOptions
    ├── PDFExport
    └── CalendarSync
```

### New Components to Build

**1. QueryInput** (`components/destination/QueryInput.tsx`)
- Natural language input with smart suggestions
- Parse location, duration, budget automatically
- Show confidence indicators

**2. CostAnalysis** (`components/destination/CostAnalysis.tsx`)
- Real-time flight price display with trends
- Housing cost comparison (student housing vs Airbnb vs apartments)
- Monthly expense breakdown with charts
- Currency impact visualization

**3. CulturalGuide** (`components/destination/CulturalGuide.tsx`)
- Local customs and etiquette tips
- Student-specific activities and discounts
- Language essentials with audio pronunciation
- Safety ratings and neighborhood guides

**4. BudgetBreakdown** (`components/destination/BudgetBreakdown.tsx`)
- Interactive budget allocation pie chart
- Month-by-month spending forecast
- Saving tips and cost optimization suggestions
- Comparison with other students' budgets

**5. PriceAlerts** (`components/destination/PriceAlerts.tsx`)
- Set alerts for flight price drops
- Currency fluctuation notifications
- Housing cost changes
- Seasonal price predictions

---

## 🚀 Implementation Roadmap

### Phase 1: MVP Foundation (Hours 1-12)
- [x] Crisis management backup completed
- [x] New landing page created
- [ ] Destination Intelligence Agent with Claude integration
- [ ] Query parsing and analysis system
- [ ] Basic cost intelligence API integration (Numbeo)
- [ ] Simple budget breakdown display
- [ ] Example query scenarios working end-to-end

### Phase 2: Core Intelligence (Hours 13-24)
- [ ] Flight price integration (Amadeus API)
- [ ] Housing cost intelligence
- [ ] Currency monitoring system
- [ ] Cultural guide data aggregation
- [ ] Budget optimization algorithm
- [ ] Real-time data caching layer

### Phase 3: Advanced Features (Hours 25-36)
- [ ] Price alert system with notifications
- [ ] Predictive cost modeling
- [ ] Cultural context based on user background
- [ ] Interactive budget planning tools
- [ ] PDF export functionality
- [ ] Mobile-responsive design polish

### Phase 4: Integration & Polish (Hours 37-48)
- [ ] Crisis management integration (secondary feature)
- [ ] User accounts and history tracking
- [ ] Performance optimization
- [ ] Demo scenarios for competition
- [ ] Documentation and presentation prep

---

## 🎯 Success Metrics

### User Experience Metrics
- Query to useful intelligence: < 5 seconds
- Information accuracy: > 95%
- User satisfaction: > 4.5/5

### Technical Metrics
- API response time: < 500ms (p95)
- Cache hit rate: > 80%
- Cost per query: < $0.10

### Business Metrics
- Free to premium conversion: > 15%
- Daily active users: Target 1000+
- Average session duration: > 5 minutes

---

## 🔧 Development Guidelines

### API Request Pattern
```typescript
// Always implement caching + fallback
const fetchCostData = async (city: string, country: string) => {
  const cacheKey = `cost:${city}:${country}`;

  // Check cache first
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Try primary API
  try {
    const data = await numbeoAPI.fetch(city, country);
    await redis.set(cacheKey, JSON.stringify(data), 'EX', 3600); // 1 hour TTL
    return data;
  } catch (error) {
    // Use mock data or alternative source
    return getMockCostData(city, country);
  }
};
```

### Claude Integration Pattern
```typescript
// Use Claude for intelligent data interpretation
const interpretCosts = async (costData: RawCostData, userQuery: DestinationQuery) => {
  const prompt = `
    Based on this cost data for ${userQuery.city}:
    ${JSON.stringify(costData)}

    And this user context:
    - Budget: ${userQuery.budget} ${userQuery.currency}
    - Duration: ${userQuery.duration}
    - Interests: ${userQuery.interests.join(', ')}
    - Origin: ${userQuery.origin}

    Provide personalized cost analysis and recommendations.
  `;

  return await claudeClient.sendMessage(prompt);
};
```

---

## 📝 Next Steps

1. **Immediate (Next 2 hours):**
   - Build DestinationIntelligenceAgent class
   - Implement query parsing with Claude
   - Create basic API integration for Numbeo
   - Build CostAnalysis component

2. **Short-term (Hours 3-6):**
   - Add flight price integration
   - Build cultural guide system
   - Implement budget optimization
   - Create demo scenarios

3. **Medium-term (Hours 7-12):**
   - Add price alert system
   - Build export functionality
   - Implement caching layer
   - Polish UI components

---

## 🔗 Integration with Crisis Management

The crisis management system (backed up in `/crisis-backup`) will be integrated as a secondary feature:

**Integration Points:**
1. Navigation link from destination intelligence to crisis management
2. Shared Claude agent infrastructure
3. Combined user dashboard showing both features
4. Crisis alerts during destination planning phase

**User Flow:**
```
Planning Phase → Destination Intelligence (Primary)
      ↓
During Study Abroad → Crisis Management (Emergency)
```

---

*Last Updated: September 30, 2025*
*Status: Architecture defined, ready for implementation*
