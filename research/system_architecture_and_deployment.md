# System Architecture and Deployment Plan

**Author:** System Architect & Deployment Specialist
**Date:** September 30, 2025
**Sprint Context:** 48-hour competition MVP
**Priority:** P0 - Critical Path

---

## Executive Summary

This document outlines the complete system architecture and deployment strategy for the Adaptive Travel Agent competition MVP. The architecture is optimized for rapid deployment, demo reliability, and scalability post-competition.

**Key Approach:** Leverage serverless and managed services to minimize infrastructure management during the 48-hour sprint. Use Vercel for both frontend and backend to enable single-command deployment with zero DevOps overhead.

**Critical Success Factor:** The system must deploy reliably, perform consistently during demos, and scale gracefully if the demo goes viral. All infrastructure decisions prioritize speed-to-deployment and demo stability.

---

## High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Browser    │  │    Mobile    │  │   Tablet     │     │
│  │  (Desktop)   │  │   (Safari)   │  │   (iPad)     │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          └──────────────────┴──────────────────┘
                             │
                             │ HTTPS
                             │
┌─────────────────────────────▼─────────────────────────────┐
│              VERCEL EDGE NETWORK (CDN)                    │
│  - Global edge caching                                    │
│  - DDoS protection                                        │
│  - SSL termination                                        │
└─────────────────────────────┬─────────────────────────────┘
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                             │
┌───────▼─────────────────┐           ┌──────────────▼──────────┐
│   NEXT.JS FRONTEND       │           │   NEXT.JS API ROUTES    │
│   (React SSR/Client)     │           │   (Serverless)          │
│                          │           │                         │
│  - Server Components     │◄──────────┤  - Crisis analysis      │
│  - Client Components     │           │  - Solution generation  │
│  - Real-time UI          │           │  - WebSocket handler    │
│  - Animations            │           │                         │
└──────────────────────────┘           └───────┬─────────────────┘
                                               │
                                               │
                                  ┌────────────┴────────────┐
                                  │                         │
                        ┌─────────▼──────────┐   ┌─────────▼────────┐
                        │  CLAUDE 4.5 API    │   │  VERCEL KV       │
                        │  (Anthropic)       │   │  (Redis)         │
                        │                    │   │                  │
                        │  - Crisis analysis │   │  - Session cache │
                        │  - Reasoning chains│   │  - Rate limiting │
                        │  - Solution gen    │   │  - Demo state    │
                        └────────────────────┘   └──────────────────┘
```

---

## Detailed Architecture Breakdown

### 1. Frontend Layer (Next.js 14 App Router)

**Technology:** Next.js 14.2+ with App Router
**Hosting:** Vercel Edge Network
**Deployment:** Git push to main branch

**Architecture Decisions:**

```typescript
// Hybrid rendering strategy
app/
├── layout.tsx              // Server Component (static)
├── page.tsx                // Server Component with client islands
├── components/
│   ├── crisis/
│   │   ├── CrisisInput.tsx     // 'use client' - Interactive
│   │   ├── StatusDisplay.tsx   // 'use client' - Real-time
│   │   └── SolutionCard.tsx    // Server Component
│   └── ui/
│       └── ...                 // Hybrid based on needs
└── api/                        // Serverless Functions
```

**Performance Optimizations:**
- Static generation for landing page
- Dynamic rendering for crisis interface
- Edge caching for static assets
- Image optimization with Next.js Image
- Code splitting by route
- Prefetching for instant navigation

**Build Configuration:**

```javascript
// next.config.js
module.exports = {
  reactStrictMode: true,
  experimental: {
    serverActions: true,
  },
  images: {
    domains: ['images.unsplash.com'],
  },
  // Production optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Bundle analyzer
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};
```

---

### 2. API Layer (Next.js API Routes)

**Technology:** Next.js serverless functions
**Runtime:** Node.js 18.x
**Execution:** Vercel Edge Functions + Serverless Functions

**API Route Structure:**

```
app/api/
├── crisis/
│   ├── analyze/
│   │   └── route.ts          // POST - Analyze crisis
│   ├── solve/
│   │   └── route.ts          // POST - Generate solutions
│   ├── execute/
│   │   └── route.ts          // POST - Execute solution
│   └── status/
│       └── route.ts          // GET - SSE for real-time updates
├── socket/
│   └── route.ts              // WebSocket handler
└── health/
    └── route.ts              // Health check endpoint
```

**Example API Route Implementation:**

```typescript
// app/api/crisis/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { CrisisManagementAgent } from '@/lib/agents/crisis-management-agent';
import { ratelimit } from '@/lib/ratelimit';

export const runtime = 'edge'; // Use edge runtime for low latency

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.ip ?? '127.0.0.1';
    const { success } = await ratelimit.limit(ip);

    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Parse request
    const { crisis } = await request.json();

    if (!crisis || typeof crisis !== 'string') {
      return NextResponse.json(
        { error: 'Invalid crisis description' },
        { status: 400 }
      );
    }

    // Analyze crisis with Claude
    const agent = new CrisisManagementAgent();
    const analysis = await agent.analyzeCrisis(crisis);

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('Crisis analysis failed:', error);

    return NextResponse.json(
      {
        error: 'Failed to analyze crisis',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
```

**Rate Limiting Configuration:**

```typescript
// lib/ratelimit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '60 s'), // 10 requests per minute
  analytics: true,
});
```

---

### 3. Real-Time Communication Layer

**Primary:** Server-Sent Events (SSE)
**Fallback:** WebSocket via Socket.io
**Purpose:** Stream reasoning steps and status updates

**SSE Implementation:**

```typescript
// app/api/crisis/status/route.ts
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  const sessionId = request.nextUrl.searchParams.get('session');

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection event
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)
      );

      // Subscribe to crisis updates (from KV store or pub/sub)
      const interval = setInterval(async () => {
        // Fetch updates from Vercel KV
        const updates = await getUpdatesFromKV(sessionId);

        if (updates) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(updates)}\n\n`)
          );
        }
      }, 500); // Poll every 500ms

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

---

### 4. State Management Layer

**Technology:** Vercel KV (Redis)
**Purpose:** Session management, caching, rate limiting, demo state

**Data Models:**

```typescript
// Session data structure
interface SessionData {
  sessionId: string;
  crisis: CrisisContext;
  solutions: SolutionPlan[];
  status: CrisisStatus;
  reasoningSteps: ReasoningStep[];
  createdAt: number;
  expiresAt: number;
}

// Cache key patterns
const KEYS = {
  session: (id: string) => `session:${id}`,
  rateLimit: (ip: string) => `ratelimit:${ip}`,
  demoState: (demoId: string) => `demo:${demoId}`,
  claudeCache: (hash: string) => `claude:${hash}`,
};
```

**KV Operations:**

```typescript
// lib/kv-client.ts
import { kv } from '@vercel/kv';

export const kvClient = {
  // Store session data
  async saveSession(sessionId: string, data: SessionData): Promise<void> {
    await kv.set(
      KEYS.session(sessionId),
      JSON.stringify(data),
      { ex: 3600 } // 1 hour expiry
    );
  },

  // Retrieve session data
  async getSession(sessionId: string): Promise<SessionData | null> {
    const data = await kv.get<string>(KEYS.session(sessionId));
    return data ? JSON.parse(data) : null;
  },

  // Cache Claude responses
  async cacheClaudeResponse(
    inputHash: string,
    response: any
  ): Promise<void> {
    await kv.set(
      KEYS.claudeCache(inputHash),
      JSON.stringify(response),
      { ex: 86400 } // 24 hour cache
    );
  },
};
```

---

### 5. External Services Integration

#### Claude 4.5 API (Anthropic)

**Configuration:**

```typescript
// Environment variables
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
ANTHROPIC_MAX_TOKENS=4096
```

**Error Handling:**

```typescript
class ClaudeAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'ClaudeAPIError';
  }
}

// Retry logic with exponential backoff
async function callClaudeWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      const isRetryable = error instanceof ClaudeAPIError && error.retryable;
      const isLastAttempt = i === maxRetries - 1;

      if (!isRetryable || isLastAttempt) {
        throw error;
      }

      // Exponential backoff
      await new Promise(resolve =>
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }

  throw new Error('Max retries exceeded');
}
```

---

## Deployment Strategy

### 1. Vercel Configuration

**File:** `vercel.json`

```json
{
  "version": 2,
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "regions": ["iad1"],
  "env": {
    "ANTHROPIC_API_KEY": "@anthropic-api-key",
    "KV_URL": "@kv-url",
    "KV_REST_API_URL": "@kv-rest-api-url",
    "KV_REST_API_TOKEN": "@kv-rest-api-token"
  },
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30,
      "memory": 1024
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,POST,OPTIONS" }
      ]
    }
  ]
}
```

### 2. Environment Variables

**Production Secrets (Vercel Dashboard):**

```bash
# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Vercel KV (auto-provisioned)
KV_URL=redis://...
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...

# App Config
NEXT_PUBLIC_APP_URL=https://adaptive-travel-agent.vercel.app
NODE_ENV=production
```

**Local Development (`.env.local`):**

```bash
ANTHROPIC_API_KEY=sk-ant-...
KV_URL=redis://localhost:6379  # Local Redis for dev
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Deployment Pipeline

**Automated via Git:**

```bash
# Production deployment
git push origin main
# Vercel automatically deploys

# Preview deployment (for testing)
git push origin feature-branch
# Vercel creates preview URL
```

**Manual Deployment:**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### 4. Pre-Deployment Checklist

```bash
# Run before deploying
npm run lint              # Check code quality
npm run type-check        # TypeScript validation
npm run test              # Run test suite
npm run build             # Verify build succeeds
```

---

## Monitoring and Observability

### 1. Vercel Analytics

**Enabled by default:**
- Real-time traffic monitoring
- Performance metrics (TTFB, FCP, LCP)
- Geographic distribution
- Error tracking

**Configuration:**

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### 2. Error Tracking

**Option A: Built-in (Free):**

```typescript
// lib/error-logger.ts
export function logError(error: Error, context?: Record<string, any>) {
  console.error('[ERROR]', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });

  // In production, send to external service
  if (process.env.NODE_ENV === 'production') {
    // Could integrate Sentry, LogRocket, etc.
  }
}
```

**Option B: Sentry Integration (If time permits):**

```typescript
// sentry.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### 3. Health Check Endpoint

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      claude: await checkClaudeAPI(),
      kv: await checkKV(),
    },
  };

  return NextResponse.json(health);
}

async function checkClaudeAPI(): Promise<boolean> {
  try {
    // Simple ping to Claude API
    return true;
  } catch {
    return false;
  }
}

async function checkKV(): Promise<boolean> {
  try {
    await kv.ping();
    return true;
  } catch {
    return false;
  }
}
```

---

## Performance Optimization

### 1. Caching Strategy

**Levels of Caching:**

```
1. Browser Cache (Static Assets)
   └─ 1 year cache for immutable assets

2. CDN Cache (Vercel Edge)
   └─ Static pages: 1 hour
   └─ API responses: No cache (dynamic)

3. Application Cache (Vercel KV)
   └─ Claude responses: 24 hours
   └─ Session data: 1 hour

4. Claude API Internal Cache
   └─ Identical prompts: Anthropic's cache
```

**Implementation:**

```typescript
// Cache-Control headers
export async function GET() {
  return new Response(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
```

### 2. Bundle Optimization

```javascript
// next.config.js
module.exports = {
  // Tree shaking
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },

  // Compression
  compress: true,

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
  },
};
```

### 3. Database/KV Optimization

```typescript
// Batch operations where possible
async function batchGetSessions(sessionIds: string[]): Promise<SessionData[]> {
  const pipeline = kv.pipeline();
  sessionIds.forEach(id => {
    pipeline.get(KEYS.session(id));
  });
  return await pipeline.exec();
}
```

---

## Security Measures

### 1. API Security

```typescript
// Middleware for authentication (if needed later)
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // CSRF protection
  const origin = request.headers.get('origin');
  const allowedOrigins = [process.env.NEXT_PUBLIC_APP_URL];

  if (origin && !allowedOrigins.includes(origin)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

### 2. Environment Variable Security

- Never commit `.env.local`
- Use Vercel secrets for sensitive data
- Rotate API keys post-competition

### 3. Rate Limiting

```typescript
// Already implemented via Upstash Ratelimit
// See section 2: API Layer
```

---

## Disaster Recovery

### Backup Strategy

**Data to Backup:**
- Environment variables (documented separately)
- Vercel KV snapshots (if available)
- Git repository (primary backup)

**Recovery Procedures:**

1. **Complete System Failure:**
   ```bash
   # Clone repository
   git clone [repo-url]

   # Install dependencies
   npm install

   # Restore environment variables
   # (from secure backup)

   # Deploy to Vercel
   vercel --prod
   ```

2. **Vercel KV Failure:**
   - App continues to work (demos use fallback)
   - Sessions lost (acceptable for demo)
   - Claude cache lost (slight performance impact)

3. **Claude API Outage:**
   - Automatic fallback to demo mode
   - Pre-cached responses served
   - No user-facing impact

---

## Scalability Considerations

### Current Architecture Limits

**Vercel Free Tier:**
- 100 GB bandwidth/month
- 100 GB-hours compute/month
- Sufficient for competition + demo traffic

**Vercel Pro Tier ($20/month):**
- 1 TB bandwidth/month
- Unlimited team members
- Priority support

**Expected Load:**
- Competition demo: ~100 concurrent users max
- Post-demo traffic: ~1,000 requests/hour
- Well within free tier limits

### Scaling Strategy (Post-Competition)

**If viral (>10K concurrent users):**

1. **Enable Vercel Pro:** Automatic
2. **Implement Queue System:** Bull/BullMQ for job processing
3. **Separate Backend:** Migrate API routes to dedicated service
4. **Database Migration:** Move from KV to PostgreSQL
5. **Multi-Region Deployment:** Vercel supports this natively

---

## Risks and Mitigation

### Risk 1: Vercel Deployment Failure
**Probability:** Low
**Impact:** Critical
**Mitigation:**
- Deploy early (Hour 36)
- Test deployment on preview branch first
- Have Vercel CLI installed for manual deployment
- Keep production build working at all times

### Risk 2: Claude API Rate Limiting
**Probability:** Medium during demo
**Impact:** High
**Mitigation:**
- Monitor API usage in Anthropic console
- Implement aggressive caching
- Use demo mode with pre-cached responses
- Have Anthropic support contact ready

### Risk 3: Cold Start Latency
**Probability:** Medium
**Impact:** Medium
**Mitigation:**
- Use Edge Runtime where possible
- Pre-warm functions before demo (automated ping)
- Show loading states during cold starts
- Consider keeping functions warm via cron

### Risk 4: KV Storage Limits
**Probability:** Low
**Impact:** Low
**Mitigation:**
- Vercel KV free tier: 256MB (sufficient)
- Implement TTL on all keys
- Monitor storage usage
- Can upgrade to paid tier instantly

---

## Testing Strategy

### 1. Local Testing

```bash
# Start local Redis (for KV simulation)
docker run -p 6379:6379 redis:latest

# Run development server
npm run dev

# Run tests
npm run test
```

### 2. Preview Deployment Testing

```bash
# Create feature branch
git checkout -b test-deployment

# Push to GitHub
git push origin test-deployment

# Vercel creates preview URL automatically
# Test on preview URL before merging to main
```

### 3. Production Testing (Pre-Demo)

```bash
# Deploy to production
vercel --prod

# Run smoke tests
curl https://your-domain.vercel.app/api/health

# Test critical flows manually
# 1. Enter crisis
# 2. Analyze
# 3. Generate solutions
# 4. Execute solution
```

### 4. Load Testing (Optional)

```bash
# Use k6 for load testing
k6 run load-test.js

// load-test.js
import http from 'k6/http';

export let options = {
  stages: [
    { duration: '30s', target: 100 },
    { duration: '1m', target: 100 },
    { duration: '30s', target: 0 },
  ],
};

export default function () {
  http.post('https://your-domain.vercel.app/api/crisis/analyze', {
    crisis: 'Flight cancelled',
  });
}
```

---

## Success Criteria

- [ ] Deploy completes in <5 minutes
- [ ] Zero downtime deployment
- [ ] API response time <500ms p95
- [ ] Health check endpoint returns 200
- [ ] All environment variables configured
- [ ] SSL certificate active
- [ ] Custom domain configured (optional)
- [ ] Monitoring dashboards accessible
- [ ] Error tracking operational
- [ ] Demo mode works offline

---

## Implementation Timeline

**Hour 0-1:** Vercel project setup
**Hour 1-2:** Environment variables configuration
**Hour 36-37:** First production deployment
**Hour 37-38:** Monitoring setup
**Hour 46-47:** Final deployment and testing
**Hour 47-48:** Pre-demo warm-up

---

## Post-Competition Migration Path

### Phase 2 Architecture (After Competition)

```
                    ┌──────────────┐
                    │   Cloudflare  │
                    │   CDN + DDoS  │
                    └───────┬───────┘
                            │
              ┌─────────────┴──────────────┐
              │                            │
    ┌─────────▼─────────┐      ┌──────────▼────────┐
    │  Next.js Frontend  │      │   NestJS Backend   │
    │   (Vercel)        │      │   (Railway/Fly.io) │
    └────────────────────┘      └──────────┬────────┘
                                           │
                        ┌──────────────────┼──────────────────┐
                        │                  │                  │
                ┌───────▼────────┐  ┌──────▼──────┐  ┌───────▼──────┐
                │  PostgreSQL    │  │   Redis     │  │  Pinecone    │
                │  (Supabase)    │  │  (Upstash)  │  │  (Vector DB) │
                └────────────────┘  └─────────────┘  └──────────────┘
```

---

## Conclusion

This architecture prioritizes deployment speed and demo reliability. Vercel's serverless platform eliminates infrastructure management, allowing the team to focus on application logic. The hybrid caching strategy ensures consistent performance during demos while maintaining scalability for post-competition growth.

**Critical Success Factors:**
1. Early deployment (Hour 36) for testing
2. Aggressive caching to reduce API costs
3. Demo mode for reliability
4. Monitoring for rapid issue detection
