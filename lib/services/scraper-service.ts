/**
 * Scraper Service - Web Scraping Fallback System (Phase 3)
 * Priority: Firecrawl (400 credits) � ScraperAPI (5000 credits)
 * Use only when APIs fail or data gaps exist
 */

import type {
  ScraperProvider,
  ScraperConfig,
  ScraperCredits,
  ScrapeRequest,
  ScrapeResult,
  ScraperError,
} from '../types/scraper';
import { cacheService } from './cache-service';

export class ScraperService {
  private config: ScraperConfig;
  private credits: ScraperCredits;

  constructor(config?: Partial<ScraperConfig>) {
    this.config = {
      firecrawlApiKey: config?.firecrawlApiKey || process.env.FIRECRAWL_API_KEY || '',
      scraperapiKey: config?.scraperapiKey || process.env.SCRAPERAPI_KEY || '',
      maxRetries: config?.maxRetries || 3,
      timeout: config?.timeout || 30000, // 30 seconds
    };

    // Initialize credit tracking (default values)
    this.credits = {
      firecrawl: {
        remaining: 400,
        total: 400,
        used: 0,
      },
      scraperapi: {
        remaining: 5000,
        total: 5000,
        used: 0,
      },
    };
  }

  /**
   * Scrape a URL using the priority chain: Firecrawl � ScraperAPI
   */
  async scrape(request: ScrapeRequest): Promise<ScrapeResult> {
    const { url, provider, extractionRules, format = 'markdown' } = request;

    // Check cache first
    const cacheKey = `scraper:${url}:${provider || 'auto'}`;

    const cached = cacheService.get<ScrapeResult>(cacheKey);
    if (cached) {
      console.log(`[Scraper] Cache hit for ${url}`);
      return cached;
    }

    // Determine provider priority
    const providers = this.determineProviderPriority(provider);
    let lastError: ScraperError | null = null;

    // Try each provider in order
    for (const currentProvider of providers) {
      try {
        console.log(`[Scraper] Attempting scrape with ${currentProvider}: ${url}`);

        const result = await this.scrapeWithProvider(
          url,
          currentProvider,
          extractionRules,
          format
        );

        // Cache successful result (1 hour TTL for scraper data)
        cacheService.set(cacheKey, result, 60 * 60 * 1000);

        // Update credit usage
        this.updateCredits(currentProvider, 1);

        return result;
      } catch (error) {
        console.error(`[Scraper] ${currentProvider} failed:`, error);
        lastError = error as ScraperError;

        // If rate limited, don't try this provider again
        if (lastError.rateLimited) {
          console.warn(`[Scraper] ${currentProvider} rate limited, skipping`);
          continue;
        }

        // If provider has insufficient credits, try next
        if (this.credits[currentProvider].remaining <= 0) {
          console.warn(`[Scraper] ${currentProvider} has no credits remaining`);
          continue;
        }
      }
    }

    // All providers failed
    throw this.createScraperError(
      'all',
      `All scraper providers failed for ${url}`,
      lastError
    );
  }

  /**
   * Scrape with specific provider
   */
  private async scrapeWithProvider(
    url: string,
    provider: ScraperProvider,
    extractionRules?: ScrapeRequest['extractionRules'],
    format: ScrapeRequest['format'] = 'markdown'
  ): Promise<ScrapeResult> {
    const startTime = Date.now();

    switch (provider) {
      case 'firecrawl':
        return await this.scrapeWithFirecrawl(url, extractionRules, format, startTime);
      case 'scraperapi':
        return await this.scrapeWithScraperAPI(url, extractionRules, format, startTime);
      default:
        throw this.createScraperError(
          provider,
          `Unknown provider: ${provider}`
        );
    }
  }

  /**
   * Scrape using Firecrawl API (LLM-ready output)
   */
  private async scrapeWithFirecrawl(
    url: string,
    extractionRules?: ScrapeRequest['extractionRules'],
    format: ScrapeRequest['format'] = 'markdown',
    startTime: number = Date.now()
  ): Promise<ScrapeResult> {
    const apiKey = this.config.firecrawlApiKey;

    if (!apiKey) {
      throw this.createScraperError('firecrawl', 'Firecrawl API key not configured');
    }

    if (this.credits.firecrawl.remaining <= 0) {
      throw this.createScraperError(
        'firecrawl',
        'Firecrawl credits exhausted',
        undefined,
        0
      );
    }

    try {
      const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          url,
          formats: [format],
          waitFor: extractionRules?.waitForSelector ? 5000 : 0,
          timeout: this.config.timeout,
          removeBase64Images: true, // Optimize for LLM processing
          onlyMainContent: true,
        }),
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        const errorText = await response.text();

        // Check for rate limiting
        if (response.status === 429) {
          throw this.createScraperError(
            'firecrawl',
            'Rate limited',
            undefined,
            undefined,
            true
          );
        }

        throw this.createScraperError(
          'firecrawl',
          `HTTP ${response.status}: ${errorText}`,
          undefined,
          response.status
        );
      }

      const data = await response.json();

      // Firecrawl returns LLM-ready markdown by default
      const content = data.markdown || data.html || data.text || '';

      return {
        success: true,
        provider: 'firecrawl',
        data: content,
        format: format || 'markdown',
        metadata: {
          url,
          scrapedAt: Date.now(),
          creditsUsed: 1,
          processingTime: Date.now() - startTime,
        },
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        throw this.createScraperError('firecrawl', 'Request timeout');
      }
      throw error;
    }
  }

  /**
   * Scrape using ScraperAPI (handles anti-bot measures)
   */
  private async scrapeWithScraperAPI(
    url: string,
    extractionRules?: ScrapeRequest['extractionRules'],
    format: ScrapeRequest['format'] = 'html',
    startTime: number = Date.now()
  ): Promise<ScrapeResult> {
    const apiKey = this.config.scraperapiKey;

    if (!apiKey) {
      throw this.createScraperError('scraperapi', 'ScraperAPI key not configured');
    }

    if (this.credits.scraperapi.remaining <= 0) {
      throw this.createScraperError(
        'scraperapi',
        'ScraperAPI credits exhausted',
        undefined,
        0
      );
    }

    try {
      // ScraperAPI uses query parameters
      const apiUrl = new URL('https://api.scraperapi.com');
      apiUrl.searchParams.set('api_key', apiKey);
      apiUrl.searchParams.set('url', url);
      apiUrl.searchParams.set('render', 'false'); // Set to 'true' for JavaScript rendering

      if (extractionRules?.waitForSelector) {
        apiUrl.searchParams.set('render', 'true');
        apiUrl.searchParams.set('wait_for', extractionRules.waitForSelector);
      }

      const response = await fetch(apiUrl.toString(), {
        method: 'GET',
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        const errorText = await response.text();

        // Check for rate limiting
        if (response.status === 429) {
          throw this.createScraperError(
            'scraperapi',
            'Rate limited',
            undefined,
            undefined,
            true
          );
        }

        throw this.createScraperError(
          'scraperapi',
          `HTTP ${response.status}: ${errorText}`,
          undefined,
          response.status
        );
      }

      let content = await response.text();

      // Apply extraction rules if provided
      if (extractionRules?.removeElements && extractionRules.removeElements.length > 0) {
        // Simple removal (in production, use a DOM parser)
        extractionRules.removeElements.forEach((selector) => {
          const regex = new RegExp(`<${selector}[^>]*>.*?</${selector}>`, 'gis');
          content = content.replace(regex, '');
        });
      }

      return {
        success: true,
        provider: 'scraperapi',
        data: content,
        format: format || 'html',
        metadata: {
          url,
          scrapedAt: Date.now(),
          creditsUsed: 1,
          processingTime: Date.now() - startTime,
        },
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        throw this.createScraperError('scraperapi', 'Request timeout');
      }
      throw error;
    }
  }

  /**
   * Determine provider priority based on credits and preference
   */
  private determineProviderPriority(
    preferredProvider?: ScraperProvider
  ): ScraperProvider[] {
    // If specific provider requested and has credits, use it first
    if (preferredProvider) {
      if (this.credits[preferredProvider].remaining > 0) {
        const others = (['firecrawl', 'scraperapi'] as ScraperProvider[]).filter(
          (p) => p !== preferredProvider && this.credits[p].remaining > 0
        );
        return [preferredProvider, ...others];
      }
    }

    // Default priority: Firecrawl (better LLM output) � ScraperAPI (more credits)
    const priority: ScraperProvider[] = [];

    if (this.credits.firecrawl.remaining > 0) {
      priority.push('firecrawl');
    }

    if (this.credits.scraperapi.remaining > 0) {
      priority.push('scraperapi');
    }

    return priority;
  }

  /**
   * Update credit tracking
   */
  private updateCredits(provider: ScraperProvider, used: number): void {
    this.credits[provider].used += used;
    this.credits[provider].remaining = Math.max(
      0,
      this.credits[provider].total - this.credits[provider].used
    );

    console.log(
      `[Scraper] ${provider} credits: ${this.credits[provider].remaining}/${this.credits[provider].total}`
    );
  }

  /**
   * Get current credit status
   */
  getCredits(): ScraperCredits {
    return { ...this.credits };
  }

  /**
   * Check if scraping is available (any provider has credits)
   */
  isAvailable(): boolean {
    return (
      (this.credits.firecrawl.remaining > 0 && !!this.config.firecrawlApiKey) ||
      (this.credits.scraperapi.remaining > 0 && !!this.config.scraperapiKey)
    );
  }

  /**
   * Reset credit counters (for testing)
   */
  resetCredits(): void {
    this.credits.firecrawl.used = 0;
    this.credits.firecrawl.remaining = this.credits.firecrawl.total;
    this.credits.scraperapi.used = 0;
    this.credits.scraperapi.remaining = this.credits.scraperapi.total;
  }

  /**
   * Create standardized scraper error
   */
  private createScraperError(
    provider: ScraperProvider | 'all',
    message: string,
    cause?: Error | ScraperError | null,
    statusCode?: number,
    rateLimited: boolean = false
  ): ScraperError {
    const error = new Error(message) as ScraperError;
    error.name = 'ScraperError';
    error.provider = provider as ScraperProvider;
    error.statusCode = statusCode;
    error.rateLimited = rateLimited;

    if (provider !== 'all') {
      error.creditsRemaining = this.credits[provider].remaining;
    }

    if (cause) {
      error.cause = cause;
    }

    return error;
  }
}

// Export singleton instance
export const scraperService = new ScraperService();
