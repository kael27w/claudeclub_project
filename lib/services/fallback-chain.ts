/**
 * Fallback Chain Coordinator - Intelligent Multi-Tier Data Retrieval
 * Implements the fallback strategy from api.md:
 * 1. Primary: Perplexity + Claude research
 * 2. Secondary: Free APIs + Claude synthesis
 * 3. Tertiary: Web scrapers + Claude analysis
 * 4. Final: Cache + mock data
 */

import { perplexityService } from '../perplexity-agents';
import { scraperService } from './scraper-service';
import { cacheService } from './cache-service';
import { sendMessage } from '../claude-client';
import type { ParsedLocation, UserOrigin } from '../location-parser';
import type { DestinationQuery, DestinationIntelligence } from '../types/destination';
import type { PerplexityResearchResults } from '../perplexity-agents';
import type { ScrapeResult } from '../types/scraper';

export interface FallbackContext {
  location: ParsedLocation;
  origin: UserOrigin;
  query: DestinationQuery;
  targetData: 'housing' | 'costs' | 'cultural' | 'safety' | 'flights' | 'full';
}

export interface FallbackResult<T> {
  data: T;
  source: 'perplexity' | 'api' | 'scraper' | 'cache' | 'mock';
  tier: 1 | 2 | 3 | 4;
  confidence: number;
  timestamp: number;
  fallbackReason?: string;
}

export type DataSourceFunction<T> = (context: FallbackContext) => Promise<T>;

export class FallbackChainCoordinator {
  /**
   * Execute fallback chain to retrieve data
   */
  async getData<T>(
    context: FallbackContext,
    cacheKey?: string
  ): Promise<FallbackResult<T>> {
    const effectiveCacheKey =
      cacheKey ||
      cacheService.generateKey(
        `${context.location.city},${context.location.country}`,
        `${context.origin.city || ''},${context.origin.country}`,
        context.query.budget,
        context.query.interests,
        context.query.durationMonths
      );

    // Tier 1: Perplexity + Claude Research
    try {
      console.log('[FallbackChain] Attempting Tier 1: Perplexity + Claude');
      const result = await this.tier1_PerplexityResearch(context);

      // Cache successful result
      cacheService.set(effectiveCacheKey, result, 6 * 60 * 60 * 1000);

      return {
        data: result as T,
        source: 'perplexity',
        tier: 1,
        confidence: 0.95,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.warn('[FallbackChain] Tier 1 failed:', error);
    }

    // Tier 2: Free APIs + Claude Synthesis
    try {
      console.log('[FallbackChain] Attempting Tier 2: Free APIs + Claude');
      const result = await this.tier2_FreeAPIs(context);

      // Cache successful result
      cacheService.set(effectiveCacheKey, result, 3 * 60 * 60 * 1000);

      return {
        data: result as T,
        source: 'api',
        tier: 2,
        confidence: 0.8,
        timestamp: Date.now(),
        fallbackReason: 'Perplexity unavailable, using free APIs',
      };
    } catch (error) {
      console.warn('[FallbackChain] Tier 2 failed:', error);
    }

    // Tier 3: Web Scrapers + Claude Analysis
    if (scraperService.isAvailable()) {
      try {
        console.log('[FallbackChain] Attempting Tier 3: Web Scrapers + Claude');
        const result = await this.tier3_WebScrapers(context);

        // Cache successful result
        cacheService.set(effectiveCacheKey, result, 1 * 60 * 60 * 1000);

        return {
          data: result as T,
          source: 'scraper',
          tier: 3,
          confidence: 0.7,
          timestamp: Date.now(),
          fallbackReason: 'APIs unavailable, using web scrapers',
        };
      } catch (error) {
        console.warn('[FallbackChain] Tier 3 failed:', error);
      }
    }

    // Tier 4: Cache + Mock Data
    console.log('[FallbackChain] Attempting Tier 4: Cache + Mock Data');
    const cachedResult = cacheService.get<T>(effectiveCacheKey);

    if (cachedResult) {
      return {
        data: cachedResult,
        source: 'cache',
        tier: 4,
        confidence: 0.6,
        timestamp: Date.now(),
        fallbackReason: 'All live sources failed, using cached data',
      };
    }

    // Final fallback: Mock data
    const mockResult = await this.tier4_MockData(context);

    return {
      data: mockResult as T,
      source: 'mock',
      tier: 4,
      confidence: 0.5,
      timestamp: Date.now(),
      fallbackReason: 'All sources failed, using mock data',
    };
  }

  /**
   * Tier 1: Perplexity Research + Claude Synthesis
   */
  private async tier1_PerplexityResearch(
    context: FallbackContext
  ): Promise<PerplexityResearchResults | Partial<DestinationIntelligence>> {
    if (!perplexityService.isConfigured()) {
      throw new Error('Perplexity API not configured');
    }

    // Conduct Perplexity research
    const research = await perplexityService.conductResearch(
      context.location,
      context.origin,
      context.query
    );

    // Return research for Claude to synthesize
    return research;
  }

  /**
   * Tier 2: Free APIs + Claude Synthesis
   * Placeholder for Reddit API, YouTube API, NewsAPI, OpenExchangeRates
   */
  private async tier2_FreeAPIs(
    _context: FallbackContext
  ): Promise<Partial<DestinationIntelligence>> {
    // TODO: Implement free API integrations
    // - Reddit API for community insights
    // - YouTube Data API for vlogs
    // - NewsAPI for current events
    // - OpenExchangeRates for currency

    console.log('[FallbackChain] Free APIs not yet implemented');
    throw new Error('Free APIs not yet implemented');
  }

  /**
   * Tier 3: Web Scrapers + Claude Analysis
   */
  private async tier3_WebScrapers(
    context: FallbackContext
  ): Promise<Partial<DestinationIntelligence>> {
    const { location, targetData } = context;

    // Define scraping targets based on data needed
    const targets = this.getScraperTargets(location, targetData);

    if (targets.length === 0) {
      throw new Error('No scraper targets defined for requested data');
    }

    // Scrape all targets in parallel
    const scrapeResults = await Promise.allSettled(
      targets.map((target) =>
        scraperService.scrape({
          url: target.url,
          format: 'markdown',
        })
      )
    );

    // Collect successful scrapes
    const successfulScrapes: ScrapeResult[] = scrapeResults
      .filter((result) => result.status === 'fulfilled')
      .map((result) => (result as PromiseFulfilledResult<ScrapeResult>).value);

    if (successfulScrapes.length === 0) {
      throw new Error('All scraper attempts failed');
    }

    // Use Claude to analyze scraped data
    const analysisPrompt = `
Analyze this web-scraped data about ${location.city}, ${location.country} and extract relevant information for study abroad students:

${successfulScrapes.map((scrape, i) => `
Source ${i + 1} (${scrape.metadata.url}):
${typeof scrape.data === 'string' ? scrape.data.substring(0, 2000) : JSON.stringify(scrape.data).substring(0, 2000)}
`).join('\n\n')}

Extract and synthesize:
1. Housing costs and options
2. Cost of living data
3. Cultural information
4. Safety information
5. Transportation details

Return structured JSON with the extracted information.
`;

    const analysis = await sendMessage(
      analysisPrompt,
      'You are a data analyst extracting structured information from web content.'
    );

    try {
      return JSON.parse(analysis);
    } catch {
      // If JSON parsing fails, return raw analysis
      return {
        rawAnalysis: analysis,
      } as Partial<DestinationIntelligence>;
    }
  }

  /**
   * Tier 4: Mock Data Fallback
   */
  private async tier4_MockData(
    context: FallbackContext
  ): Promise<Partial<DestinationIntelligence>> {
    const { location, query } = context;

    console.log(
      `[FallbackChain] Using mock data for ${location.city}, ${location.country}`
    );

    // Return generic mock data structure
    return {
      query,
      summary: `Mock destination intelligence for ${location.city}, ${location.country}. Using fallback data - API integrations pending.`,
      costAnalysis: {
        flights: {
          currentPrice: {
            amount: 500,
            currency: query.currency,
            route: `Mock data: ${query.origin} to ${location.city}`,
          },
          priceRange: {
            min: 400,
            max: 800,
            average: 600,
          },
          trend: 'stable' as const,
          prediction: 'Mock data: Prices expected to remain stable',
          bookingRecommendation: 'Mock data: Book 2-3 months in advance',
          bestTimeToBook: 'Mock data: Weekday mornings',
        },
        housing: {
          studentHousing: {
            monthly: { min: 300, max: 500, average: 400 },
            availability: 'medium' as const,
            options: ['Mock data: Dormitory options available'],
          },
          airbnb: {
            monthly: { min: 400, max: 700, average: 550 },
            neighborhoods: ['Mock data: Various neighborhoods'],
          },
          apartments: {
            monthly: { min: 600, max: 1000, average: 800 },
            typical: 'Mock data: Studio apartments',
          },
          recommendations: ['Mock data: Consider student housing first'],
        },
        livingCosts: {
          food: {
            monthly: { min: 200, max: 400, average: 300 },
            groceries: 150,
            restaurants: 100,
            studentMeals: 50,
          },
          transport: {
            monthly: { min: 50, max: 100, average: 75 },
            publicTransport: 'Mock data: Metro/bus pass available',
            studentDiscounts: ['Mock data: 50% student discount available'],
          },
          entertainment: {
            monthly: { min: 100, max: 200, average: 150 },
            activities: ['Mock data: Museums, parks, events'],
          },
          utilities: {
            monthly: { min: 50, max: 100, average: 75 },
            included: ['Mock data: Often included in rent'],
          },
          total: {
            monthly: { min: 400, max: 800, average: 600 },
          },
        },
        currency: {
          exchangeRate: 1.0,
          fromCurrency: query.currency,
          toCurrency: query.currency,
          trend: 'stable' as const,
          impact: 'Mock data: Stable exchange rate',
          budgetInLocalCurrency: query.budget,
          recommendation: 'Mock data: Monitor exchange rates before booking',
        },
      },
      culturalGuide: {
        localCustoms: {
          greetings: ['Mock: Standard greetings'],
          diningEtiquette: ['Mock: Dining customs'],
          socialNorms: ['Mock: Social expectations'],
          tipping: 'Mock: Tipping culture',
          importantDos: ['Mock: Things to do'],
          importantDonts: ['Mock: Things to avoid'],
        },
        studentLife: {
          popularActivities: ['Mock: Student activities'],
          studentDiscounts: ['Mock: Available discounts'],
          socialGroups: ['Mock: Student organizations'],
          upcomingEvents: ['Mock: Campus events'],
          bestNeighborhoods: ['Mock Neighborhood 1', 'Mock Neighborhood 2'],
        },
        language: {
          primaryLanguage: location.primaryLanguage,
          essentialPhrases: [
            { phrase: 'Hello', translation: '[Mock translation]', pronunciation: '[Mock]' },
            { phrase: 'Thank you', translation: '[Mock translation]', pronunciation: '[Mock]' },
          ],
          englishProficiency: 'medium' as const,
          languageLearningResources: ['Mock: Language apps', 'Mock: Local classes'],
        },
        safety: {
          overallRating: 7.5,
          safeNeighborhoods: ['Mock Safe Area 1', 'Mock Safe Area 2'],
          areasToAvoid: ['Mock: Areas to be cautious'],
          emergencyContacts: [
            { service: 'Police', number: '911' },
            { service: 'Ambulance', number: '911' },
            { service: 'Fire', number: '911' },
          ],
          safetyTips: ['Mock: Safety tip 1', 'Mock: Safety tip 2'],
        },
        culturalContext: {
          connectionToOrigin: [`Mock: Connection between ${query.origin} and ${location.city}`],
          similarities: ['Mock: Similar aspects'],
          differences: ['Mock: Different aspects'],
          adaptationTips: ['Mock: Adjustment tip 1', 'Mock: Adjustment tip 2'],
        },
      },
      budgetPlan: {
        totalBudget: query.budget,
        duration: query.durationMonths,
        breakdown: {
          housing: { amount: query.budget * 0.4, percentage: 40, recommendation: 'Mock: Student housing recommended' },
          food: { amount: query.budget * 0.25, percentage: 25, recommendation: 'Mock: Cook at home to save' },
          transport: { amount: query.budget * 0.1, percentage: 10, recommendation: 'Mock: Use student pass' },
          activities: { amount: query.budget * 0.15, percentage: 15, recommendation: 'Mock: Free events available' },
          utilities: { amount: query.budget * 0.05, percentage: 5, recommendation: 'Mock: Often included' },
          emergency: { amount: query.budget * 0.05, percentage: 5, recommendation: 'Mock: Keep as buffer' },
        },
        monthlyAllocation: Array.from({ length: query.durationMonths }, (_, i) => ({
          month: i + 1,
          planned: query.budget,
          recommended: query.budget,
          notes: 'Mock: Budget allocation',
        })),
        savingTips: [
          'Mock tip: Use public transportation',
          'Mock tip: Cook at home',
          'Mock tip: Look for student discounts',
        ],
        costOptimizationStrategies: ['Mock: Cook at home', 'Mock: Use student discounts'],
        feasibility: 'comfortable' as const,
        warningFlags: [],
      },
      recommendations: {
        basedOnInterests: query.interests.map((interest) => ({
          interest,
          recommendations: [`Mock ${interest} activity 1`, `Mock ${interest} activity 2`],
        })),
        basedOnOrigin: {
          culturalConnections: [`Mock: Connection between ${query.origin} and ${location.city}`],
          foodSimilarities: ['Mock: Similar cuisines'],
          communityGroups: ['Mock: Expat groups from your region'],
        },
        basedOnBudget: {
          affordable: ['Mock: Budget-friendly activity 1', 'Mock: Budget-friendly activity 2'],
          splurgeWorthy: ['Mock: Special experience 1', 'Mock: Special experience 2'],
          free: ['Mock: Free activity 1', 'Mock: Free activity 2'],
        },
        studentSpecific: {
          campusLife: ['Mock: Campus events', 'Mock: Student organizations'],
          academicResources: ['Mock: Libraries', 'Mock: Study spaces'],
          networkingOpportunities: ['Mock: Meetups', 'Mock: Career fairs'],
        },
      },
      alerts: {
        priceAlerts: ['Mock: Flight prices stable'],
        currencyAlerts: ['Mock: Exchange rate stable'],
        seasonalAlerts: ['Mock: No seasonal alerts'],
      },
      generatedAt: new Date().toISOString(),
      confidence: 0.5,
    };
  }

  /**
   * Get scraper targets based on location and data type
   */
  private getScraperTargets(
    location: ParsedLocation,
    targetData: FallbackContext['targetData']
  ): Array<{ url: string; type: string }> {
    const targets: Array<{ url: string; type: string }> = [];
    const city = location.city.toLowerCase().replace(/\s+/g, '-');

    // Common scraping targets (examples - replace with real URLs)
    switch (targetData) {
      case 'housing':
        targets.push({
          url: `https://www.numbeo.com/cost-of-living/in/${city}`,
          type: 'housing_costs',
        });
        break;

      case 'costs':
        targets.push({
          url: `https://www.numbeo.com/cost-of-living/in/${city}`,
          type: 'cost_of_living',
        });
        break;

      case 'cultural':
        // Could scrape local tourism sites, student forums, etc.
        break;

      case 'safety':
        // Could scrape local news, government travel advisories
        break;

      case 'full':
        // Scrape multiple sources for comprehensive data
        targets.push({
          url: `https://www.numbeo.com/cost-of-living/in/${city}`,
          type: 'cost_of_living',
        });
        break;
    }

    return targets;
  }

  /**
   * Check availability of each tier
   */
  async checkTierAvailability(): Promise<{
    tier1: boolean;
    tier2: boolean;
    tier3: boolean;
    tier4: boolean;
  }> {
    return {
      tier1: perplexityService.isConfigured(),
      tier2: false, // TODO: Check free API availability
      tier3: scraperService.isAvailable(),
      tier4: true, // Cache and mock always available
    };
  }
}

// Export singleton instance
export const fallbackChain = new FallbackChainCoordinator();
