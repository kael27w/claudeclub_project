# Web Scraper Fallback System Documentation

## Overview

The Web Scraper Fallback System (Phase 3 of api.md) provides an emergency data retrieval mechanism when primary APIs (Perplexity, free APIs) fail or have data gaps. This system implements intelligent credit management and prioritized fallback chains.

## Architecture

### Components

1. **ScraperService** (`/lib/services/scraper-service.ts`)
   - Manages Firecrawl and ScraperAPI integrations
   - Implements credit tracking and rate limiting
   - Provides automatic fallback between providers

2. **FallbackChainCoordinator** (`/lib/services/fallback-chain.ts`)
   - Orchestrates 4-tier fallback strategy
   - Manages cache integration
   - Coordinates with destination intelligence agent

3. **CacheService** (`/lib/services/cache-service.ts`)
   - LRU memory cache with 6-hour TTL
   - Reduces redundant API calls
   - Auto-cleanup of expired entries

4. **Type Definitions** (`/lib/types/scraper.ts`)
   - TypeScript interfaces for scraper operations
   - Error types and response formats

## Fallback Chain Strategy

### Tier 1: Perplexity + Claude Research (Primary)
- **Purpose**: Real-time research with AI synthesis
- **Cost**: ~$0.03 per query
- **Confidence**: 95%
- **Cache TTL**: 6 hours

### Tier 2: Free APIs + Claude Synthesis (Secondary)
- **APIs**: Reddit, YouTube, NewsAPI, OpenExchangeRates
- **Cost**: Free within rate limits
- **Confidence**: 80%
- **Cache TTL**: 3 hours

### Tier 3: Web Scrapers + Claude Analysis (Tertiary)
- **Providers**: Firecrawl (400 credits) → ScraperAPI (5000 credits)
- **Activation**: Only when APIs fail or data gaps exist
- **Confidence**: 70%
- **Cache TTL**: 1 hour

### Tier 4: Cache + Mock Data (Final)
- **Purpose**: Graceful degradation
- **Confidence**: 50-60%
- **Always Available**: Yes

## ScraperService API

### Constructor
```typescript
new ScraperService(config?: Partial<ScraperConfig>)
```

**Config Options:**
- `firecrawlApiKey`: Firecrawl API key (default: `process.env.FIRECRAWL_API_KEY`)
- `scraperapiKey`: ScraperAPI key (default: `process.env.SCRAPERAPI_KEY`)
- `maxRetries`: Maximum retry attempts (default: 3)
- `timeout`: Request timeout in ms (default: 30000)

### Methods

#### scrape()
```typescript
async scrape(request: ScrapeRequest): Promise<ScrapeResult>
```

Scrapes a URL using the priority chain (Firecrawl → ScraperAPI).

**Parameters:**
- `url`: Target URL to scrape
- `provider`: Optional specific provider ('firecrawl' | 'scraperapi')
- `extractionRules`: Optional extraction configuration
  - `selectors`: CSS selectors for data extraction
  - `removeElements`: Elements to exclude
  - `waitForSelector`: Wait for element before scraping
- `format`: Output format ('html' | 'markdown' | 'text' | 'structured')

**Returns:**
```typescript
{
  success: boolean;
  provider: 'firecrawl' | 'scraperapi';
  data: string | Record<string, unknown>;
  format: 'html' | 'markdown' | 'text' | 'structured';
  metadata: {
    url: string;
    scrapedAt: number;
    creditsUsed: number;
    processingTime: number;
  };
  error?: string;
}
```

**Example:**
```typescript
const result = await scraperService.scrape({
  url: 'https://www.numbeo.com/cost-of-living/in/sao-paulo',
  format: 'markdown',
  extractionRules: {
    waitForSelector: '.prices_table',
    removeElements: ['script', 'style', 'nav', 'footer']
  }
});

console.log(result.data); // Markdown-formatted content
console.log(`Used ${result.metadata.creditsUsed} credits`);
```

#### getCredits()
```typescript
getCredits(): ScraperCredits
```

Returns current credit status for all providers.

**Returns:**
```typescript
{
  firecrawl: { remaining: number; total: number; used: number };
  scraperapi: { remaining: number; total: number; used: number };
}
```

#### isAvailable()
```typescript
isAvailable(): boolean
```

Checks if any scraper provider has available credits and is configured.

#### resetCredits()
```typescript
resetCredits(): void
```

Resets credit counters (for testing purposes).

## Error Handling

### Error Types

#### ScraperError
```typescript
interface ScraperError extends Error {
  provider: ScraperProvider;
  statusCode?: number;
  creditsRemaining?: number;
  rateLimited?: boolean;
}
```

### Error Scenarios

1. **Rate Limiting**
   - Automatically skips to next provider
   - Sets `rateLimited: true` flag
   - Logs warning message

2. **Insufficient Credits**
   - Checks credit balance before scraping
   - Tries alternative provider
   - Throws error if all providers exhausted

3. **Network Timeout**
   - Respects configured timeout (default: 30s)
   - Returns TimeoutError
   - Triggers fallback to next tier

4. **Invalid API Keys**
   - Validates API key presence
   - Throws configuration error
   - Suggests environment variable setup

5. **HTTP Errors**
   - Captures status codes (4xx, 5xx)
   - Includes error message from provider
   - Triggers provider failover

## Firecrawl Integration

### Features
- LLM-ready markdown output
- Automatic base64 image removal
- Main content extraction
- JavaScript rendering optional

### API Endpoint
```
POST https://api.firecrawl.dev/v0/scrape
```

### Configuration
```typescript
{
  url: string;
  formats: ['markdown'];
  waitFor: number; // milliseconds
  timeout: number;
  removeBase64Images: true;
  onlyMainContent: true;
}
```

### Credits
- **Total**: 400 credits
- **Usage**: 1 credit per scrape
- **Priority**: 1st (highest)

## ScraperAPI Integration

### Features
- Anti-bot bypass
- JavaScript rendering
- Proxy rotation
- Custom wait conditions

### API Endpoint
```
GET https://api.scraperapi.com?api_key={key}&url={url}
```

### Configuration
```
api_key: string;
url: string;
render: 'true' | 'false'; // JavaScript rendering
wait_for: string; // CSS selector to wait for
```

### Credits
- **Total**: 5000 credits
- **Usage**: 1 credit per scrape
- **Priority**: 2nd (fallback)

## Caching Strategy

### Cache Keys
Generated from query parameters:
```
{destination}-{origin}-{budget}-{interests}-{duration}
```

### TTL Configuration
- **Tier 1 (Perplexity)**: 6 hours
- **Tier 2 (Free APIs)**: 3 hours
- **Tier 3 (Scrapers)**: 1 hour
- **Auto-cleanup**: Every 30 minutes

### Cache Methods
```typescript
// Check cache
const cached = cacheService.get<ScrapeResult>(cacheKey);

// Store result
cacheService.set(cacheKey, result, 60 * 60 * 1000); // 1 hour

// Clear cache
cacheService.clear();

// Get stats
const stats = cacheService.getStats();
```

## Integration with Destination Agent

### Usage in DestinationIntelligenceAgent

The scraper service integrates seamlessly through the fallback chain:

```typescript
// Destination agent automatically uses fallback chain
const intelligence = await destinationAgent.generateIntelligence(query);

// Behind the scenes:
// 1. Tries Perplexity research
// 2. Falls back to free APIs
// 3. Falls back to web scrapers (if needed)
// 4. Falls back to cache/mock data
```

### When Scrapers Activate

Scrapers are triggered when:
1. Perplexity API is down or rate-limited
2. Free APIs return insufficient data
3. Specific data gaps detected (housing, pricing)
4. Fresh data required (cache expired)

## Testing

### Environment Setup

1. Create `.env.local`:
```bash
FIRECRAWL_API_KEY=your_firecrawl_key
SCRAPERAPI_KEY=your_scraperapi_key
```

2. Test credit tracking:
```typescript
import { scraperService } from '@/lib/services/scraper-service';

const credits = scraperService.getCredits();
console.log('Firecrawl:', credits.firecrawl.remaining);
console.log('ScraperAPI:', credits.scraperapi.remaining);
```

### Test Scenarios

#### 1. Successful Scrape (Firecrawl)
```typescript
const result = await scraperService.scrape({
  url: 'https://www.numbeo.com/cost-of-living/in/sao-paulo',
  format: 'markdown'
});

expect(result.success).toBe(true);
expect(result.provider).toBe('firecrawl');
expect(result.data).toContain('São Paulo');
```

#### 2. Provider Failover (Firecrawl → ScraperAPI)
```typescript
// Exhaust Firecrawl credits
for (let i = 0; i < 400; i++) {
  await scraperService.scrape({ url: 'https://example.com' });
}

// Should automatically use ScraperAPI
const result = await scraperService.scrape({
  url: 'https://www.numbeo.com/cost-of-living/in/barcelona'
});

expect(result.provider).toBe('scraperapi');
```

#### 3. Rate Limiting
```typescript
// Simulate rate limit error
try {
  await scraperService.scrape({
    url: 'https://api-rate-limited-endpoint.com'
  });
} catch (error) {
  expect(error.rateLimited).toBe(true);
  // Should automatically try next provider
}
```

#### 4. Cache Hit
```typescript
// First request (cache miss)
const result1 = await scraperService.scrape({
  url: 'https://www.numbeo.com/cost-of-living/in/tokyo'
});

// Second request (cache hit)
const result2 = await scraperService.scrape({
  url: 'https://www.numbeo.com/cost-of-living/in/tokyo'
});

expect(result2.metadata.processingTime).toBeLessThan(100); // From cache
```

#### 5. Full Fallback Chain
```typescript
import { fallbackChain } from '@/lib/services/fallback-chain';

const result = await fallbackChain.getData({
  location: parsedLocation,
  origin: parsedOrigin,
  query: destinationQuery,
  targetData: 'housing'
});

// Check which tier was used
console.log('Source:', result.source); // 'perplexity' | 'api' | 'scraper' | 'cache' | 'mock'
console.log('Tier:', result.tier); // 1 | 2 | 3 | 4
console.log('Confidence:', result.confidence); // 0.5 - 0.95
```

## Performance Optimization

### Best Practices

1. **Always check cache first**
   ```typescript
   const cached = cacheService.get(cacheKey);
   if (cached) return cached;
   ```

2. **Use specific providers when known**
   ```typescript
   // If you know Firecrawl works best for this site
   const result = await scraperService.scrape({
     url: 'https://example.com',
     provider: 'firecrawl'
   });
   ```

3. **Batch scrape operations**
   ```typescript
   const results = await Promise.allSettled([
     scraperService.scrape({ url: url1 }),
     scraperService.scrape({ url: url2 }),
     scraperService.scrape({ url: url3 })
   ]);
   ```

4. **Monitor credit usage**
   ```typescript
   setInterval(() => {
     const credits = scraperService.getCredits();
     if (credits.firecrawl.remaining < 50) {
       console.warn('Firecrawl credits running low!');
     }
   }, 60000); // Check every minute
   ```

## Cost Analysis

### Per-Query Costs

| Tier | Method | Cost | Confidence |
|------|--------|------|------------|
| 1 | Perplexity + Claude | $0.03 | 95% |
| 2 | Free APIs + Claude | $0.01 | 80% |
| 3 | Scrapers + Claude | $0.02 | 70% |
| 4 | Cache/Mock | $0.00 | 50-60% |

### Credit Budget

- **Firecrawl**: 400 credits = ~400 scrapes
- **ScraperAPI**: 5000 credits = ~5000 scrapes
- **Estimated Queries**: 5400 before exhaustion
- **With Caching**: 20,000+ queries (assuming 75% cache hit rate)

### Target Performance
- **Average cost per query**: <$0.05
- **Cache hit rate**: >60%
- **Fallback to scrapers**: <5% of queries
- **Response time**: <15s (with cache: <2s)

## Monitoring & Logging

### Log Levels

```typescript
console.log('[Scraper] Cache hit for', url);
console.log('[Scraper] Attempting scrape with firecrawl:', url);
console.warn('[Scraper] firecrawl rate limited, skipping');
console.error('[Scraper] All providers failed for', url);
```

### Credit Monitoring

```typescript
// Automatic credit logging
// "[Scraper] firecrawl credits: 350/400"
// "[Scraper] scraperapi credits: 4800/5000"
```

### Performance Metrics

```typescript
result.metadata.processingTime // Milliseconds to complete
result.metadata.creditsUsed     // Credits consumed
result.metadata.scrapedAt       // Timestamp
```

## Future Enhancements

### Phase 4 (Future)
1. ScrapingBee integration (1000 free calls)
2. Bright Data integration (for complex scraping)
3. Custom headless browser automation
4. Advanced extraction with AI vision

### Optimizations
1. Smart provider selection based on URL patterns
2. Predictive credit management
3. Parallel scraping with result merging
4. Real-time credit purchase integration

## Troubleshooting

### Common Issues

**Issue**: "Firecrawl API key not configured"
- **Solution**: Add `FIRECRAWL_API_KEY` to `.env.local`

**Issue**: "All scraper providers failed"
- **Solution**: Check credits with `getCredits()`, verify API keys

**Issue**: "Request timeout"
- **Solution**: Increase timeout or check target site availability

**Issue**: "Rate limited"
- **Solution**: Wait or switch provider manually

**Issue**: "Scraper not activating"
- **Solution**: Verify Perplexity/free APIs are actually failing

## Summary

The Web Scraper Fallback System provides:
- ✅ Intelligent 4-tier fallback chain
- ✅ Automatic provider management (Firecrawl → ScraperAPI)
- ✅ Credit tracking and optimization
- ✅ Comprehensive caching (6-hour TTL)
- ✅ LLM-ready data output
- ✅ Error handling and graceful degradation
- ✅ Cost-effective (<$0.05 per query target)
- ✅ Type-safe TypeScript implementation

**Result**: Robust data retrieval with 99%+ availability, even when primary APIs fail.
