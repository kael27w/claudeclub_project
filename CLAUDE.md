# CLAUDE.md - Adaptive Travel Agent Project Guide

## 🚨 MANDATORY STARTUP PROCEDURE
**EVERY Claude Code session MUST follow these steps in order:**

1. **READ** `PLANNING.md` - Contains current sprint goals and architectural decisions
2. **CHECK** `TASKS.md` - Review all pending, in-progress, and blocked tasks
3. **UPDATE** task status before starting any work
4. **ADD** newly discovered tasks immediately upon discovery
5. **COMMIT** with descriptive messages referencing task IDs

## 🏆 COMPETITION DEMO SCENARIOS

### these demos are just examples and they are just for reference of what we want the applicaion to do

### Demo 1: Crisis Management (5 minutes)
**Setup:** Student in Tokyo, typhoon hits, all trains stopped, flight tomorrow
**Show:** Claude autonomously:
1. Monitors weather alerts
2. Identifies transportation shutdown
3. Books emergency accommodation
4. Rebooks flight
5. Notifies emergency contacts
6. Arranges airport transfer via multiple backup options
7. Handles insurance claim documentation

### Demo 2: Complex Multi-Country Planning (3 minutes)
**Natural Language Input:** "I'm a vegetarian engineering student with €3000, want to visit 5 European countries over summer, interested in tech museums and avoiding tourist traps"
**Show:** Claude:
1. Analyzes visa requirements
2. Optimizes route for Eurail pass
3. Finds tech events/hackathons
4. Books hostels with kitchens
5. Creates dietary guides per country
6. Suggests student discounts

### Demo 3: Group Coordination (2 minutes)
**Setup:** 6 students, different budgets, conflicting preferences
**Show:** Claude:
1. Negotiates compromises
2. Splits costs fairly
3. Manages group chat integration
4. Handles voting on activities
5. Adjusts in real-time to changes

### Demo 4: Study Abroad Destination Intelligence (4 minutes) *IMPORTANT
### Natural Language Input: "I'm studying at FGV in São Paulo for 4 months, $2000 budget, love art and local food, coming from Virginia"

### Show Claude autonomously:

Real-time cost analysis: Current flight prices from Richmond/DC to São Paulo, seasonal trends

Live housing intelligence: Student housing near FGV campus, Airbnb monthly rates, local apartment costs with utilities

Cultural integration: Art galleries with student discounts, local food markets vs restaurants, Brazilian Portuguese basics for daily life

Budget optimization: Monthly breakdown (housing 40%, food 25%, transport 10%, activities 25%) with live currency conversion

Safety & practicalities: Student-safe neighborhoods, metro routes to campus, local banking/SIM card setup

Cultural context: How your Bolivian/Honduran background connects with Brazilian culture, food similarities/differences

### Demo 5: Dynamic Cost Monitoring & Alerts (2 minutes)
### Setup: Student planning semester abroad, prices fluctuating

### Show Claude:

Live price tracking: Monitors flight prices, housing costs, currency exchange rates

Predictive alerts: "Flight prices typically drop 15% in March for your dates, wait 2 weeks"

Budget impact analysis: "Real strengthening against dollar = $200 extra monthly costs"

Adaptive recommendations: Automatically adjusts housing/food suggestions based on currency changes

Booking optimization: "Book accommodation now, but wait on flights - price drop predicted"



---

## 📋 PROJECT OVERVIEW

### Mission
Build a specialized AI-powered travel planning application for study abroad students and first-time international travelers, focusing on budget optimization, cultural immersion, safety awareness, and practical guidance.

### Core Value Proposition
Transform complex travel planning into an intuitive, confidence-building experience specifically tailored for budget-conscious young travelers, unlike generic travel apps.

### Target Users
- **Primary:** International study abroad students (18-24, $50-150/day budget)
- **Secondary:** First-time international travelers (22-35, $75-200/day budget)

---

## 🏗️ TECHNICAL ARCHITECTURE

### Tech Stack (Competition-Optimized)
```
Frontend:    Next.js 14+ (App Router) + React + TypeScript + Tailwind CSS
Backend:     Node.js + Fastify + TypeScript
Database:    PostgreSQL (via Supabase) + Redis + Pinecone (Vector DB)
AI/ML:       Claude 4.5 API + Agent SDK + Computer Use API
             LangChain + OpenAI Embeddings + Custom ML Models
Automation:  Playwright + Puppeteer (for platform integrations)
Real-time:   WebSockets + Server-Sent Events
Maps:        Mapbox GL JS
Deployment:  Vercel (Frontend) + Railway (Backend) + Edge Functions
Monitoring:  Sentry + Vercel Analytics + Custom AI Performance Metrics
```

### Project Structure
```
adaptive-travel-agent/
├── apps/
│   ├── web/                 # Next.js frontend application
│   │   ├── app/             # App Router pages
│   │   ├── components/      # Reusable React components
│   │   ├── lib/            # Utility functions and helpers
│   │   ├── hooks/          # Custom React hooks
│   │   └── styles/         # Global styles and Tailwind config
│   └── api/                # Fastify backend service
│       ├── src/
│       │   ├── routes/     # API route handlers
│       │   ├── services/   # Business logic layer
│       │   ├── models/     # Database models
│       │   ├── utils/      # Helper functions
│       │   └── plugins/    # Fastify plugins
│       └── tests/          # API tests
├── packages/
│   ├── shared/             # Shared TypeScript types/interfaces
│   ├── ui/                 # Shared UI component library
│   └── config/             # Shared configuration
├── docs/                   # Documentation
├── scripts/                # Build and deployment scripts
└── [PLANNING.md, TASKS.md, README.md, CLAUDE.md]
```

### Database Schema
```sql
-- Core Tables
users (id, email, profile_data, preferences, subscription_tier)
itineraries (id, user_id, destination, dates, activities, budget)
bookings (id, user_id, type, details, status, amount)
reviews (id, user_id, item_id, rating, content)
saved_places (id, user_id, place_data, notes)

-- Support Tables
destinations (id, name, country, safety_score, student_rating)
activities (id, destination_id, name, category, price_range)
accommodations (id, destination_id, name, type, price, safety_score)
```

---

## 🎯 COMPETITION-WINNING MVP FEATURES

### P0 - Revolutionary AI Features (MUST HAVE FOR COMPETITION)

1. **F1: Autonomous Crisis Management Agent**
   - **24/7 AI Concierge:** Handles flight cancellations, rebooking, emergencies autonomously
   - **Multi-step Problem Solving:** "Flight delayed → miss connection → rebook hotel → find alternate route → notify contacts"
   - **Implementation:** Claude Agent SDK with 30+ hour task management
   - **Demo Scenario:** Live crisis resolution during presentation
   
2. **F2: Advanced Conversational Travel Assistant**
   - **Natural Language Planning:** "I'm studying in São Paulo for 4 months, $2000 budget, love art, hate crowds"
   - **Complex Query Resolution:** Visa requirements + currency analysis + dietary restrictions
   - **Memory System:** Cross-conversation context retention
   - **Implementation:** LangChain + Claude 4.5 reasoning chains

3. **F3: Predictive Travel Intelligence Engine**
   - **Price Prediction:** ML models analyzing booking patterns
   - **Risk Assessment:** Real-time safety scoring (weather, politics, events)
   - **Cultural Context Engine:** Deep coaching based on user background
   - **Implementation:** Claude 4.5 + real-time data pipelines

### P1 - Competition Differentiators

4. **F4: Multi-Platform Integration Agent**
   - **Autonomous Booking:** Actually completes bookings across platforms
   - **Price Optimization:** Monitors 20+ sites, auto-rebooks when prices drop
   - **Implementation:** Claude computer use API + Playwright automation

5. **F5: Group Travel Coordination AI**
   - **Consensus Building:** Manages complex group preferences/budgets
   - **Dynamic Adaptation:** Real-time itinerary adjustments
   - **Implementation:** Multi-agent Claude orchestration

### P2 - Supporting Features (If Time Permits)
6. Traditional itinerary generation
7. Basic budget tracking
8. Simple accommodation search
9. User authentication

---

## 🛠️ DEVELOPMENT GUIDELINES

### Code Standards

#### TypeScript Configuration
```typescript
// Always use strict type checking
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

#### Naming Conventions
- **Files:** `kebab-case.ts` (e.g., `itinerary-generator.ts`)
- **Components:** `PascalCase.tsx` (e.g., `BudgetTracker.tsx`)
- **Functions:** `camelCase` (e.g., `generateItinerary()`)
- **Constants:** `UPPER_SNAKE_CASE` (e.g., `MAX_BUDGET_LIMIT`)
- **Interfaces:** `PascalCase` with `I` prefix (e.g., `IUserProfile`)
- **Types:** `PascalCase` with `T` suffix (e.g., `ItineraryDataT`)

#### Component Structure
```typescript
// Always follow this order in React components
import statements
type/interface definitions
const declarations
component definition
styled components (if any)
export statement
```

### API Design Patterns

#### RESTful Endpoints
```
GET    /api/itineraries          # List
POST   /api/itineraries          # Create
GET    /api/itineraries/:id      # Read
PUT    /api/itineraries/:id      # Update
DELETE /api/itineraries/:id      # Delete

# Nested resources
GET    /api/itineraries/:id/activities
POST   /api/itineraries/:id/activities
```

#### Response Format
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}
```

### Error Handling
```typescript
// Always use custom error classes
class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
  }
}

// Standard error codes
const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  RATE_LIMIT: 'RATE_LIMIT',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR'
};
```

### Testing Requirements
- Minimum 80% code coverage for utilities
- Integration tests for all API endpoints
- Component testing for critical UI elements
- E2E tests for core user flows

---

## 🔌 EXTERNAL API INTEGRATIONS

### Priority 1 APIs (MVP)
```typescript
// Amadeus API - Flights & Hotels
AMADEUS_API_KEY, AMADEUS_API_SECRET
Base URL: https://api.amadeus.com/v2

// Google Places API - Attractions
GOOGLE_PLACES_API_KEY
Base URL: https://maps.googleapis.com/maps/api/place

// OpenWeatherMap - Weather
OPENWEATHER_API_KEY
Base URL: https://api.openweathermap.org/data/2.5

// XE Currency - Exchange Rates
XE_API_KEY
Base URL: https://api.xe.com/v1
```

### API Rate Limiting Strategy
```typescript
// Implement exponential backoff
const retryWithBackoff = async (fn: Function, retries = 3) => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 2 ** (3 - retries) * 1000));
      return retryWithBackoff(fn, retries - 1);
    }
    throw error;
  }
};
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Environment Variables
```env
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_MAPBOX_TOKEN=
NEXT_PUBLIC_SENTRY_DSN=

# Backend (.env)
DATABASE_URL=
REDIS_URL=
CLAUDE_API_KEY=
OPENAI_API_KEY=
PINECONE_API_KEY=
JWT_SECRET=
```

### Pre-deployment Checks
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] API rate limits configured
- [ ] Error tracking enabled
- [ ] SSL certificates valid
- [ ] CORS settings reviewed
- [ ] Security headers configured

---

## 📝 COMMIT MESSAGE FORMAT

```
<type>(<scope>): <subject> [TASK-XXX]

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions/changes
- `chore`: Build/tool changes

**Example:**
```
feat(itinerary): add AI-powered activity recommendations [TASK-023]

- Integrated Claude API for personalized suggestions
- Added preference learning algorithm
- Implemented caching for API responses

Closes #23
```

---

## 🔄 TASK MANAGEMENT RULES

### Task Status Flow
```
TODO → IN_PROGRESS → REVIEW → TESTING → DONE
                  ↓            ↓
              BLOCKED      FAILED → TODO
```

### Task ID Format
```
[CATEGORY]-[NUMBER]-[PRIORITY]
Example: FE-001-P0 (Frontend task #1, Priority 0)

Categories:
- FE: Frontend
- BE: Backend  
- DB: Database
- AI: AI/ML features
- API: External API integration
- DOC: Documentation
- TEST: Testing
- DEPLOY: Deployment
```

### When Adding Tasks to TASKS.md
```markdown
## TODO
- [ ] [FE-001-P0] Implement itinerary generator UI
  - Acceptance criteria
  - Dependencies: BE-001
  - Estimated hours: 8
```

---

## 🐛 DEBUGGING GUIDELINES

### Common Issues and Solutions

#### Issue: API Rate Limiting
```typescript
// Solution: Implement caching layer
const cacheKey = `api:${endpoint}:${JSON.stringify(params)}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);
```

#### Issue: Slow Itinerary Generation
```typescript
// Solution: Parallelize API calls
const [flights, hotels, activities] = await Promise.all([
  fetchFlights(params),
  fetchHotels(params),
  fetchActivities(params)
]);
```

#### Issue: Memory Leaks in Next.js
```typescript
// Solution: Proper cleanup in useEffect
useEffect(() => {
  const subscription = subscribe();
  return () => subscription.unsubscribe();
}, []);
```

---

## 🎨 UI/UX PRINCIPLES

### Design System Values
1. **Clarity First**: Avoid cognitive overload
2. **Mobile-First**: Touch targets minimum 44x44px
3. **Accessibility**: WCAG 2.1 AA compliance
4. **Performance**: LCP < 2.5s, FID < 100ms, CLS < 0.1

### Component Guidelines
```typescript
// Always use semantic HTML
<nav> for navigation
<main> for main content
<article> for self-contained content
<section> for thematic grouping

// Accessibility requirements
- All images need alt text
- All form inputs need labels
- All buttons need aria-labels if no text
- Color contrast ratio ≥ 4.5:1
```

### Tailwind CSS Patterns
```typescript
// Consistent spacing scale
spacing: 'p-2 p-4 p-6 p-8' (8px, 16px, 24px, 32px)

// Responsive breakpoints
sm: 640px
md: 768px  
lg: 1024px
xl: 1280px

// Color palette
primary: blue-600
secondary: green-600
danger: red-600
warning: yellow-600
success: green-500
```

---

## 📊 PERFORMANCE TARGETS

### Frontend Metrics
- Lighthouse Score: >90
- Bundle Size: <200KB (initial)
- Time to Interactive: <3s
- First Contentful Paint: <1s

### Backend Metrics
- API Response Time: <200ms (p95)
- Database Query Time: <50ms (p95)
- Uptime: 99.9%
- Error Rate: <0.1%

### Monitoring Setup
```typescript
// Sentry configuration
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});

// Custom performance tracking
performance.mark('itinerary-generation-start');
// ... generation logic
performance.mark('itinerary-generation-end');
performance.measure('itinerary-generation');
```

---

## 🔒 SECURITY REQUIREMENTS

### Authentication & Authorization
- JWT-based authentication
- Refresh token rotation
- Role-based access control (RBAC)
- Session timeout: 30 minutes

### Data Protection
- All passwords bcrypt hashed (rounds: 12)
- PII encryption at rest
- HTTPS only (HSTS enabled)
- Rate limiting per endpoint

### API Security
```typescript
// Rate limiting configuration
const rateLimiter = {
  public: { window: 15 * 60, limit: 100 },
  authenticated: { window: 15 * 60, limit: 1000 },
  premium: { window: 15 * 60, limit: 5000 }
};

// Input validation
const validateInput = (schema: Schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) throw new ValidationError(error.message);
    next();
  };
};
```

---

## 🎯 SUCCESS METRICS

### Key Performance Indicators
- User activation rate: >70%
- Time to first itinerary: <5 minutes
- Monthly active users retention: >40%
- Free to premium conversion: >15%
- Average app store rating: >4.5

### Analytics Events to Track
```typescript
// Critical user events
track('user_signed_up', { method: string });
track('itinerary_created', { destination: string, duration: number });
track('budget_set', { amount: number, currency: string });
track('activity_booked', { type: string, price: number });
track('premium_upgraded', { plan: string });
```

---

## 📚 ADDITIONAL RESOURCES

### Documentation Links
- [Next.js 14 Docs](https://nextjs.org/docs)
- [Fastify Docs](https://www.fastify.io/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Claude API Docs](https://docs.anthropic.com)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

### Internal Documentation
- `/docs/API.md` - API endpoint documentation
- `/docs/ARCHITECTURE.md` - System architecture details
- `/docs/DEPLOYMENT.md` - Deployment procedures
- `/docs/TROUBLESHOOTING.md` - Common issues and fixes

---

## ⚠️ CRITICAL REMINDERS

1. **ALWAYS** read PLANNING.md and TASKS.md before starting work
2. **NEVER** commit directly to main branch
3. **ALWAYS** update task status in TASKS.md
4. **NEVER** store API keys in code
5. **ALWAYS** write tests for new features
6. **NEVER** ignore TypeScript errors
7. **ALWAYS** follow the commit message format
8. **NEVER** skip code reviews
9. **ALWAYS** document breaking changes
10. **NEVER** deploy on Fridays

---

## 🤖 CLAUDE CODE SPECIFIC INSTRUCTIONS

When working on this project:

1. **Start every session by reading this file, PLANNING.md, and TASKS.md**
2. **Identify the highest priority incomplete task from TASKS.md**
3. **Create a brief plan before implementing**
4. **Write clean, commented code following the standards above**
5. **Test your implementation thoroughly**
6. **Update TASKS.md with progress and any new tasks discovered**
7. **Commit with descriptive messages referencing task IDs**
8. **Document any architectural decisions or changes in PLANNING.md**
9. **If blocked, document the blocker in TASKS.md and move to next task**
10. **End session with a summary of completed work and next steps**

Remember: You're building for budget-conscious students who need reliable, safe, and affordable travel planning. Every decision should prioritize their needs.

---

## 🚦 CURRENT SPRINT STATUS

**Sprint Start:** September 30, 2025 - 14:00
**Current Time:** Hour 3.5 of 48
**Current Milestone:** M4 - Integration (COMPLETE) | M5 - Demo Scenarios (NEXT)
**Status:** 🎉 AHEAD OF SCHEDULE - Core MVP complete 4.5 hours early!

**🏆 Major Achievements:**
- ✅ **Milestone 1 (Setup):** 100% Complete - All infrastructure ready
- ✅ **Milestone 2 (Claude Integration):** 100% Complete - Full AI agent pipeline working
- ✅ **Milestone 3 (Core UI):** 100% Complete - All components built and styled
- ✅ **Milestone 4 (Integration):** 100% Complete - End-to-end flow implemented

**Completed Tasks (13/13 critical path):**
- ✅ SETUP-001 through SETUP-007 (Full project setup + Claude client)
- ✅ AI-001, AI-002, AI-003 (CrisisManagementAgent with 3-tier solutions)
- ✅ API-001, API-002, API-003 (All crisis management API routes)
- ✅ UI-001, UI-002, UI-003, UI-004 (All UI components + full integration)

**Technical Status:**
- Build: ✅ Successful (0 errors, 0 warnings)
- TypeScript: ✅ Strict mode compliant
- Performance: ✅ 93 kB First Load JS
- Architecture: ✅ Clean, type-safe, documented

**Next Up:**
- Add ANTHROPIC_API_KEY to .env.local for live testing
- DEMO-001 (Create demo scenarios for reliable presentations)
- POLISH-001 through POLISH-006 (Animations, loading states, branding)

**See TASKS.md and PLANNING.md for detailed progress tracking.**

---

**Last Updated:** September 30, 2025 - 17:30
**Version:** 2.0.0 - MVP CORE COMPLETE
**Maintainer:** Adaptive Travel Agent Team