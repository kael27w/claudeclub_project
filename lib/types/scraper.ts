/**
 * Scraper Service Types
 * Defines interfaces for web scraping fallback system
 */

export type ScraperProvider = 'firecrawl' | 'scraperapi';

export interface ScraperConfig {
  firecrawlApiKey?: string;
  scraperapiKey?: string;
  maxRetries: number;
  timeout: number;
}

export interface ScraperCredits {
  firecrawl: {
    remaining: number;
    total: number;
    used: number;
  };
  scraperapi: {
    remaining: number;
    total: number;
    used: number;
  };
}

export interface ScrapeRequest {
  url: string;
  provider?: ScraperProvider;
  extractionRules?: {
    selectors?: Record<string, string>;
    removeElements?: string[];
    waitForSelector?: string;
  };
  format?: 'html' | 'markdown' | 'text' | 'structured';
}

export interface ScrapeResult {
  success: boolean;
  provider: ScraperProvider;
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

export interface ScraperTargetConfig {
  name: string;
  url: string;
  provider: ScraperProvider;
  extractionRules: {
    selectors: Record<string, string>;
    removeElements: string[];
  };
  cacheTTL: number; // milliseconds
}

// Common scraping targets for destination intelligence
export interface DestinationScraperTargets {
  housing: ScraperTargetConfig[];
  university: ScraperTargetConfig[];
  transport: ScraperTargetConfig[];
  forums: ScraperTargetConfig[];
}

export interface ScraperError extends Error {
  provider: ScraperProvider;
  statusCode?: number;
  creditsRemaining?: number;
  rateLimited?: boolean;
}
