# API Integration Instructions

## Overview
Complete the production-ready destination intelligence system by implementing free APIs, LLM research agents, web scrapers, and caching layer.

## Data Sources Strategy

### Tier 1: LLM Research Agents (PRIMARY)
- **Perplexity Pro API**: Real-time research for current data
- **Claude API**: Synthesis and reasoning for structured intelligence
- **Cost**: ~$0.03 per destination query

### Tier 2: Free APIs (SECONDARY) 
- **Reddit API**: Community insights, student experiences
- **YouTube Data API**: Cost-of-living vlogs, student experiences  
- **NewsAPI**: Current events, safety alerts
- **OpenExchangeRates**: Live currency conversion, trends

### Tier 3: Web Scrapers (FALLBACK)
- **Firecrawl**: 400 credits for critical missing data
- **ScraperAPI**: 5000 credits as emergency backup
- **ScrapingBee**: 1000 free calls alternative
- **Use only when APIs fail or data gaps exist**

## Phase 1: Caching Layer (PRIORITY)

### Implementation Requirements
- **LRU Cache**: 6-hour TTL, memory-based
- **Cache Keys**: `${destination}-${origin}-${budget}-${interests}-${duration}`
- **Cache Types**: Perplexity responses, API results, destination intelligence
- **Auto-invalidation**: After 6 hours
- **Methods**: `get()`, `set()`, `clear()`, `isExpired()`

## Phase 2: Free API Integrations

### A. Reddit API 
- **Purpose**: Community insights, student experiences
- **Target Subreddits**: r/[city], r/studyabroad, r/[country]
- **Extract**: Cost discussions, safety tips, housing advice
- **Return**: Post titles, scores, key insights as JSON

### B. YouTube Data API
- **Purpose**: Cost-of-living vlogs, student experiences
- **Search Terms**: "cost of living [city]", "student life [city]"
- **Filters**: >10k views, past 2 years
- **Return**: Video titles, URLs, view counts, dates

### C. NewsAPI
- **Purpose**: Current events, safety alerts
- **Filter**: Student-relevant topics (safety, housing, transport)
- **Return**: Article titles, URLs, dates, sources

### D. OpenExchangeRates
- **Purpose**: Live currency conversion, trends
- **Features**: Current rates, 30-day history
- **Return**: Conversion rates, timestamps, trends

## Phase 3: Web Scraper Integration (Emergency Only)

### When to Use Scrapers
- API rate limits exceeded
- Critical data missing from APIs
- Specific housing/pricing data unavailable

### Scraper Priority Order
1. **Firecrawl** (400 credits) - LLM-ready data output
2. **ScraperAPI** (5000 credits) - Handles anti-bot measures


### Scraping Targets
- Local housing websites (when RentCast API insufficient)
- University accommodation pages
- Local student forums without APIs
- Transportation pricing pages

## Phase 4: Integration Updates

### Update Destination Agent
- Integrate all data sources into intelligence generation
- Add caching to avoid redundant calls
- Update confidence scoring with additional sources
- Include social insights, visual content, current events
- Implement smart fallback: APIs → Scrapers → Cache → Mock

### Update Frontend
- Display Reddit insights in Cultural Guide
- Embed YouTube videos in "Student Experiences"
- Show news alerts in Safety section
- Live currency conversion with trends

## Phase 5: Configuration

### Required API Keys
```
PERPLEXITY_API_KEY=your_perplexity_api_key
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
YOUTUBE_API_KEY=your_youtube_api_key
NEWS_API_KEY=your_news_api_key
OPENEXCHANGERATES_API_KEY=your_openexchange_api_key

# Scraper APIs (fallback only)
FIRECRAWL_API_KEY=your_firecrawl_key
SCRAPERAPI_KEY=your_scraperapi_key

```

## Error Handling & Fallbacks

### Fallback Chain
1. **Primary**: Perplexity + Claude research
2. **Secondary**: Free APIs + Claude synthesis  
3. **Tertiary**: Web scrapers + Claude analysis
4. **Final**: Cache + mock data

### Error Scenarios
- API rate limits → next tier in chain
- Network failures → cached data
- Invalid API keys → graceful degradation
- Scraper blocks → alternative scraper

## Testing Goals
- Cache hit: 15s → <2s response time
- Live currency shows actual rates
- Reddit provides community perspective
- YouTube enhances cultural understanding
- News keeps safety information current
- Scrapers activate only when needed

## Implementation Priority
1. Caching layer (foundation)
2. OpenExchangeRates (immediate value)
3. Reddit API (community insights)
4. YouTube API (visual content)
5. NewsAPI (current events)
6. Scraper fallback system
7. Integration updates
8. Multi-city testing

## Cost Optimization
- **LLM Research**: ~$0.03/query with caching
- **Free APIs**: 0 cost within limits
- **Web Scrapers**: Only when APIs fail
- **Target**: <$0.05 per destination analysis