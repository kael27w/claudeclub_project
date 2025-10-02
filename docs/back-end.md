# Backend Documentation

## Overview
This document contains comprehensive documentation for all backend services, APIs, database schemas, security measures, and performance optimizations.

---

## Caching Layer

### CacheService

**Location:** `/apps/api/src/services/cache-service.ts`

Production-ready LRU (Least Recently Used) cache with TTL (Time-To-Live) support for destination intelligence data. Implements memory-efficient caching with automatic expiration and eviction policies.

#### Features

- **LRU Eviction Policy**: Automatically removes least recently used entries when cache reaches max size (100 entries)
- **TTL Support**: Configurable time-to-live with default of 6 hours
- **Type Safety**: Fully typed with TypeScript generics
- **Memory Efficient**: Automatic cleanup of expired entries
- **Statistics Tracking**: Hit rate, miss rate, memory usage monitoring
- **Type-based Namespacing**: Organize cache entries by data type

#### Configuration

```typescript
interface ICacheConfig {
  maxSize: number;           // Default: 100
  defaultTtl: number;        // Default: 6 hours (21600000 ms)
  autoCleanup: boolean;      // Default: true
  cleanupInterval: number;   // Default: 30 minutes (1800000 ms)
}
```

#### Cache Types

```typescript
enum CacheType {
  PERPLEXITY_RESPONSE = 'perplexity',
  API_RESULT = 'api',
  DESTINATION_INTELLIGENCE = 'destination',
  CURRENCY_RATES = 'currency',
  REDDIT_INSIGHTS = 'reddit',
  YOUTUBE_DATA = 'youtube',
  NEWS_DATA = 'news'
}
```

#### Usage Examples

##### Basic Usage

```typescript
import { CacheService, CacheType } from '@/services/cache-service';

const cache = new CacheService();

// Store data with default TTL (6 hours)
cache.set('my-key', { data: 'value' });

// Retrieve data
const result = cache.get<MyDataType>('my-key');
if (result) {
  console.log('Cache hit:', result);
} else {
  console.log('Cache miss or expired');
}

// Clear specific entry
cache.clear('my-key');

// Clear entire cache
cache.clear();
```

##### Destination Intelligence Caching

```typescript
import { CacheService, CacheType } from '@/services/cache-service';

// Generate standardized cache key
const cacheKey = CacheService.generateKey(
  'São Paulo',           // destination
  'Virginia',            // origin
  2000,                  // budget
  'art,food,culture',    // interests
  120,                   // duration (days)
  CacheType.DESTINATION_INTELLIGENCE
);

// Check if cached
if (cache.has(cacheKey)) {
  const cachedResult = cache.get<DestinationIntelligence>(cacheKey);
  return cachedResult;
}

// Generate new intelligence
const intelligence = await generateDestinationIntelligence(params);

// Cache result with custom 12-hour TTL
cache.set(cacheKey, intelligence, 12 * 60 * 60 * 1000);
```

##### API Response Caching

```typescript
// Cache Perplexity API responses
const perplexityKey = CacheService.generateKey(
  destination,
  origin,
  budget,
  interests,
  duration,
  CacheType.PERPLEXITY_RESPONSE
);

// Check cache before API call
let response = cache.get<PerplexityResponse>(perplexityKey);
if (!response) {
  response = await callPerplexityAPI(query);
  cache.set(perplexityKey, response, 6 * 60 * 60 * 1000); // 6 hours
}
```

##### Currency Rate Caching

```typescript
// Cache currency rates with shorter TTL (1 hour)
const currencyKey = `${CacheType.CURRENCY_RATES}:USD-BRL`;
let rates = cache.get<CurrencyRates>(currencyKey);

if (!rates) {
  rates = await fetchCurrencyRates('USD', 'BRL');
  cache.set(currencyKey, rates, 60 * 60 * 1000); // 1 hour TTL
}
```

#### Advanced Features

##### Cache Statistics

```typescript
const stats = cache.getStats();
console.log(`
  Cache Size: ${stats.size} entries
  Hit Rate: ${stats.hitRate}%
  Total Hits: ${stats.hits}
  Total Misses: ${stats.misses}
  Memory Usage: ${(stats.memoryUsage / 1024).toFixed(2)} KB
`);
```

##### Type-Specific Operations

```typescript
// Get all keys for specific type
const destinationKeys = cache.getKeysByType(CacheType.DESTINATION_INTELLIGENCE);
console.log(`Cached destinations: ${destinationKeys.length}`);

// Clear all entries of specific type
const removed = cache.clearByType(CacheType.CURRENCY_RATES);
console.log(`Cleared ${removed} currency rate entries`);
```

##### Manual Cleanup

```typescript
// Remove expired entries
const removedCount = cache.cleanupExpired();
console.log(`Cleaned up ${removedCount} expired entries`);
```

##### Graceful Shutdown

```typescript
// Destroy cache and stop cleanup interval
process.on('SIGTERM', () => {
  cache.destroy();
  process.exit(0);
});
```

#### API Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `get<T>(key)` | `key: string` | `T \| null` | Retrieve cached value or null if expired/not found |
| `set<T>(key, data, ttl?)` | `key: string, data: T, ttl?: number` | `void` | Store value with optional custom TTL |
| `has(key)` | `key: string` | `boolean` | Check if valid (non-expired) entry exists |
| `isExpired(key)` | `key: string` | `boolean` | Check if entry is expired |
| `clear(key?)` | `key?: string` | `void` | Clear specific entry or entire cache |
| `keys()` | - | `string[]` | Get all valid (non-expired) cache keys |
| `getKeysByType(type)` | `type: CacheType` | `string[]` | Get keys matching specific type |
| `clearByType(type)` | `type: CacheType` | `number` | Clear all entries of type, returns count |
| `getStats()` | - | `ICacheStats` | Get cache statistics |
| `cleanupExpired()` | - | `number` | Remove expired entries, returns count |
| `destroy()` | - | `void` | Cleanup and stop intervals |

#### Static Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `generateKey()` | `destination, origin, budget, interests, duration, type?` | `string` | Generate standardized cache key |

#### Performance Characteristics

- **Get Operation**: O(1) - Constant time lookup
- **Set Operation**: O(1) average - May trigger O(n) LRU eviction
- **Has Operation**: O(1) - Constant time check
- **Clear All**: O(n) - Linear time to clear all entries
- **Cleanup**: O(n) - Linear scan of all entries
- **LRU Eviction**: O(n) - Scans all entries to find LRU

#### Memory Management

- **Max Entries**: 100 (configurable)
- **Estimated Size**: ~50-200 KB per 100 entries (varies by data)
- **Auto Cleanup**: Every 30 minutes (configurable)
- **Eviction Policy**: LRU when max size reached

#### Best Practices

1. **Use Type-Safe Keys**
   ```typescript
   // Good: Use generateKey for consistency
   const key = CacheService.generateKey(dest, origin, budget, interests, duration);

   // Avoid: Manual key construction
   const key = `${dest}-${origin}-${budget}`;
   ```

2. **Choose Appropriate TTL**
   ```typescript
   // Currency rates: 1 hour
   cache.set(key, rates, 60 * 60 * 1000);

   // Destination intelligence: 6 hours (default)
   cache.set(key, intelligence);

   // Static content: 24 hours
   cache.set(key, data, 24 * 60 * 60 * 1000);
   ```

3. **Monitor Cache Performance**
   ```typescript
   // Log stats periodically
   setInterval(() => {
     const stats = cache.getStats();
     if (stats.hitRate < 50) {
       console.warn('Low cache hit rate:', stats.hitRate);
     }
   }, 5 * 60 * 1000); // Every 5 minutes
   ```

4. **Handle Cache Misses Gracefully**
   ```typescript
   async function getDestinationData(params) {
     const key = CacheService.generateKey(...params);

     // Try cache first
     let data = cache.get<DestinationData>(key);
     if (data) return data;

     // Fetch fresh data
     data = await fetchDestinationData(params);

     // Cache result
     cache.set(key, data);

     return data;
   }
   ```

5. **Use Singleton Instance**
   ```typescript
   // Good: Use provided singleton
   import { cacheService } from '@/services/cache-service';

   // Avoid: Creating multiple instances
   const cache1 = new CacheService();
   const cache2 = new CacheService();
   ```

#### Integration with Destination Intelligence

The cache service is designed to integrate with the destination intelligence system:

```typescript
// In destination-intelligence-agent.ts
import { cacheService, CacheService, CacheType } from '@/services/cache-service';

async function analyzeDestination(query: DestinationQuery): Promise<DestinationIntelligence> {
  // Generate cache key
  const cacheKey = CacheService.generateKey(
    query.destination,
    query.userContext.origin,
    query.userContext.budget,
    query.userContext.interests.join(','),
    query.duration,
    CacheType.DESTINATION_INTELLIGENCE
  );

  // Check cache
  const cached = cacheService.get<DestinationIntelligence>(cacheKey);
  if (cached) {
    console.log('[Cache] Hit for destination intelligence');
    return cached;
  }

  console.log('[Cache] Miss - generating new intelligence');

  // Generate new intelligence
  const intelligence = await generateIntelligence(query);

  // Cache result
  cacheService.set(cacheKey, intelligence);

  return intelligence;
}
```

#### Error Handling

The cache service handles errors gracefully:

```typescript
// Cache failures don't break application flow
try {
  const cached = cache.get<Data>(key);
  if (cached) return cached;
} catch (error) {
  console.error('[Cache] Error retrieving from cache:', error);
  // Continue with fresh data fetch
}

try {
  cache.set(key, data);
} catch (error) {
  console.error('[Cache] Error storing in cache:', error);
  // Data still returned to user
}
```

#### Testing

Example test cases for cache service:

```typescript
import { CacheService, CacheType } from '@/services/cache-service';

describe('CacheService', () => {
  let cache: CacheService;

  beforeEach(() => {
    cache = new CacheService({ maxSize: 5 });
  });

  afterEach(() => {
    cache.destroy();
  });

  test('should store and retrieve values', () => {
    cache.set('key1', { data: 'value1' });
    const result = cache.get('key1');
    expect(result).toEqual({ data: 'value1' });
  });

  test('should respect TTL', async () => {
    cache.set('key2', { data: 'value2' }, 100); // 100ms TTL
    expect(cache.get('key2')).toBeTruthy();

    await new Promise(resolve => setTimeout(resolve, 150));
    expect(cache.get('key2')).toBeNull();
  });

  test('should evict LRU when max size reached', () => {
    for (let i = 0; i < 6; i++) {
      cache.set(`key${i}`, { data: `value${i}` });
    }
    expect(cache.getStats().size).toBe(5);
    expect(cache.has('key0')).toBe(false); // First entry evicted
  });

  test('should update LRU on access', () => {
    for (let i = 0; i < 5; i++) {
      cache.set(`key${i}`, { data: `value${i}` });
    }

    cache.get('key0'); // Access first entry
    cache.set('key5', { data: 'value5' }); // Trigger eviction

    expect(cache.has('key0')).toBe(true); // Still present
    expect(cache.has('key1')).toBe(false); // Evicted instead
  });

  test('should generate consistent keys', () => {
    const key1 = CacheService.generateKey('São Paulo', 'Virginia', 2000, 'art,food', 120);
    const key2 = CacheService.generateKey('são paulo', 'virginia', 2000, 'food,art', 120);
    expect(key1).toBe(key2); // Same after normalization
  });
});
```

---

## API Endpoints

### Destination Intelligence

**Endpoint:** `POST /api/destination-intelligence/analyze`

**Request:**
```typescript
{
  destination: string;      // e.g., "São Paulo"
  origin: string;           // e.g., "Virginia"
  budget: number;           // e.g., 2000
  interests: string;        // e.g., "art,food,culture"
  duration: number;         // e.g., 120 (days)
  userContext: {
    culturalBackground?: string;
    dietaryRestrictions?: string;
  }
}
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    costAnalysis: { ... };
    culturalGuide: { ... };
    budgetOptimization: { ... };
    personalizedRecommendations: { ... };
    metadata: { ... };
  }
}
```

**Caching:**
- Cache Key: Generated using `CacheService.generateKey()`
- TTL: 6 hours (default)
- Cache Type: `DESTINATION_INTELLIGENCE`

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  profile_data JSONB,
  preferences JSONB,
  subscription_tier VARCHAR(50) DEFAULT 'free',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Itineraries Table
```sql
CREATE TABLE itineraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  destination VARCHAR(255) NOT NULL,
  dates DATERANGE,
  activities JSONB,
  budget DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Security Measures

### Authentication
- JWT-based authentication with 30-minute session timeout
- Refresh token rotation for extended sessions
- bcrypt password hashing (12 rounds)

### Input Validation
```typescript
// All API inputs validated using Zod schemas
import { z } from 'zod';

const destinationQuerySchema = z.object({
  destination: z.string().min(1).max(100),
  origin: z.string().min(1).max(100),
  budget: z.number().positive().max(1000000),
  interests: z.string().max(500),
  duration: z.number().positive().max(365)
});
```

### Rate Limiting
- Public endpoints: 100 requests per 15 minutes
- Authenticated users: 1000 requests per 15 minutes
- Premium users: 5000 requests per 15 minutes

---

## Performance Optimizations

### Caching Strategy
1. **L1 Cache**: In-memory LRU cache (CacheService) - 6 hour TTL
2. **L2 Cache**: Redis (planned) - 24 hour TTL
3. **L3 Cache**: CDN for static assets

### Response Time Targets
- Cache hit: <100ms
- Cache miss (with API calls): <2s
- API endpoint p95: <200ms

### Monitoring
- Sentry for error tracking
- Custom metrics for cache hit rates
- API response time logging

---

## Environment Variables

### Required
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/db

# APIs
ANTHROPIC_API_KEY=sk-ant-xxx
PERPLEXITY_API_KEY=pplx-xxx

# Security
JWT_SECRET=your-secret-key
```

### Optional
```env
# Caching
REDIS_URL=redis://localhost:6379

# External APIs
YOUTUBE_API_KEY=xxx
NEWS_API_KEY=xxx
OPENEXCHANGERATES_API_KEY=xxx
```

---

## Deployment Procedures

### Pre-deployment Checklist
- [ ] All tests passing
- [ ] TypeScript compilation successful
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Cache service initialized
- [ ] Error tracking enabled

### Deployment Steps
1. Build application: `npm run build`
2. Run migrations: `npm run db:migrate`
3. Deploy backend: Push to Railway
4. Verify health endpoint: `GET /health`
5. Monitor error rates and cache performance

---

## Troubleshooting

### High Cache Miss Rate
- Verify cache key generation is consistent
- Check if TTL is too short
- Review cache size limits
- Monitor memory usage

### Slow API Responses
- Check cache hit rate
- Review external API latency
- Verify database query performance
- Check for N+1 query problems

### Memory Issues
- Review cache size limits
- Verify automatic cleanup is running
- Check for memory leaks in long-running processes

---

**Last Updated:** 2025-10-01
**Version:** 1.0.0
