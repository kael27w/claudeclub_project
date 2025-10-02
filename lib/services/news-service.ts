/**
 * NewsAPIService - Current Events & Safety Alerts
 * Fetches relevant news about destinations for safety and current events
 */

import { cacheService } from './cache-service';
import type { NewsArticle, NewsAlerts } from '../types/destination';

export class NewsAPIService {
  private apiKey: string | null;

  constructor() {
    this.apiKey = process.env.NEWS_API_KEY || null;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Get current news and safety alerts for a destination
   */
  async getNewsAlerts(
    city: string,
    country: string
  ): Promise<NewsAlerts> {
    const cacheKey = `news:${city}:${country}`;
    const cached = cacheService.get<NewsAlerts>(cacheKey);

    if (cached) {
      console.log('[NewsAPIService] Using cached alerts');
      return cached;
    }

    if (!this.isConfigured()) {
      console.log('[NewsAPIService] Not configured, returning empty alerts');
      return {
        articles: [],
        safetyLevel: 'safe',
        summary: 'No recent news alerts available',
      };
    }

    try {
      // Search queries for different categories
      const queries = [
        { q: `${city} ${country} safety student`, category: 'safety' as const },
        { q: `${city} housing accommodation`, category: 'housing' as const },
        { q: `${city} transportation public transport`, category: 'transport' as const },
        { q: `${city} university student`, category: 'student' as const },
        { q: `${city} ${country}`, category: 'general' as const },
      ];

      const allArticles: NewsArticle[] = [];

      for (const query of queries) {
        try {
          const articles = await this.searchNews(query.q, query.category);
          allArticles.push(...articles);
        } catch (error) {
          console.warn(`[NewsAPIService] Error searching "${query.q}":`, error);
        }
      }

      // Remove duplicates and rank by relevance
      const uniqueArticles = this.deduplicateArticles(allArticles);
      const rankedArticles = this.rankArticles(uniqueArticles, city, country);

      // Determine safety level based on news content
      const safetyLevel = this.assessSafetyLevel(rankedArticles);

      // Generate summary
      const summary = this.generateSummary(rankedArticles, safetyLevel);

      const result: NewsAlerts = {
        articles: rankedArticles.slice(0, 15), // Top 15 articles
        safetyLevel,
        summary,
      };

      // Cache for 6 hours
      cacheService.set(cacheKey, result);

      return result;
    } catch (error) {
      console.error('[NewsAPIService] Error fetching news alerts:', error);
      return {
        articles: [],
        safetyLevel: 'safe',
        summary: 'Unable to fetch current news. Please check local news sources.',
      };
    }
  }

  /**
   * Search NewsAPI for articles
   */
  private async searchNews(
    query: string,
    category: NewsArticle['category']
  ): Promise<NewsArticle[]> {
    if (!this.apiKey) {
      throw new Error('NewsAPI key not configured');
    }

    const url = new URL('https://newsapi.org/v2/everything');
    url.searchParams.set('q', query);
    url.searchParams.set('apiKey', this.apiKey);
    url.searchParams.set('sortBy', 'publishedAt');
    url.searchParams.set('language', 'en');
    url.searchParams.set('pageSize', '20');

    // Get articles from last 30 days
    const from = new Date();
    from.setDate(from.getDate() - 30);
    url.searchParams.set('from', from.toISOString().split('T')[0]);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`NewsAPI error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status === 'error') {
      throw new Error(`NewsAPI error: ${data.message}`);
    }

    return data.articles.map((article: any) => ({
      title: article.title,
      source: article.source.name,
      url: article.url,
      publishedAt: article.publishedAt,
      description: article.description || '',
      category,
      relevance: 'medium' as const,
    }));
  }

  /**
   * Remove duplicate articles
   */
  private deduplicateArticles(articles: NewsArticle[]): NewsArticle[] {
    const seen = new Set<string>();
    return articles.filter(article => {
      const key = `${article.title}:${article.source}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Rank articles by relevance
   */
  private rankArticles(
    articles: NewsArticle[],
    city: string,
    country: string
  ): NewsArticle[] {
    return articles
      .map(article => {
        let score = 0;
        const titleLower = article.title.toLowerCase();
        const descLower = article.description.toLowerCase();
        const text = `${titleLower} ${descLower}`;

        // City/country mention
        if (text.includes(city.toLowerCase())) score += 10;
        if (text.includes(country.toLowerCase())) score += 5;

        // Student-relevant keywords
        const studentKeywords = ['student', 'university', 'college', 'education', 'study'];
        for (const keyword of studentKeywords) {
          if (text.includes(keyword)) score += 3;
        }

        // Safety keywords
        const safetyKeywords = ['safe', 'safety', 'security', 'crime', 'incident'];
        for (const keyword of safetyKeywords) {
          if (text.includes(keyword)) score += 5;
        }

        // Housing/transport keywords
        const housingKeywords = ['housing', 'accommodation', 'rent', 'apartment'];
        const transportKeywords = ['transport', 'metro', 'bus', 'train'];
        for (const keyword of [...housingKeywords, ...transportKeywords]) {
          if (text.includes(keyword)) score += 2;
        }

        // Recency bonus (newer articles get higher score)
        const daysAgo = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysAgo < 7) score += 5;
        else if (daysAgo < 14) score += 3;
        else if (daysAgo < 30) score += 1;

        // Determine relevance
        let relevance: 'high' | 'medium' | 'low' = 'low';
        if (score >= 15) relevance = 'high';
        else if (score >= 8) relevance = 'medium';

        return { ...article, relevance, _score: score };
      })
      .sort((a, b) => (b as any)._score - (a as any)._score)
      .map(({ _score, ...article }) => article);
  }

  /**
   * Assess safety level based on news content
   */
  private assessSafetyLevel(articles: NewsArticle[]): 'safe' | 'caution' | 'warning' {
    const safetyArticles = articles.filter(a => a.category === 'safety');

    if (safetyArticles.length === 0) {
      return 'safe'; // No news is good news
    }

    const text = safetyArticles
      .map(a => `${a.title} ${a.description}`.toLowerCase())
      .join(' ');

    // Warning indicators
    const warningKeywords = [
      'terror', 'attack', 'emergency', 'evacuation', 'outbreak',
      'riot', 'protest', 'violence', 'war', 'conflict'
    ];
    for (const keyword of warningKeywords) {
      if (text.includes(keyword)) {
        return 'warning';
      }
    }

    // Caution indicators
    const cautionKeywords = [
      'crime', 'theft', 'robbery', 'incident', 'concern',
      'increase', 'alert', 'advisory', 'caution'
    ];
    let cautionCount = 0;
    for (const keyword of cautionKeywords) {
      if (text.includes(keyword)) cautionCount++;
    }

    if (cautionCount >= 3) {
      return 'caution';
    }

    return 'safe';
  }

  /**
   * Generate summary of news alerts
   */
  private generateSummary(
    articles: NewsArticle[],
    safetyLevel: 'safe' | 'caution' | 'warning'
  ): string {
    if (articles.length === 0) {
      return 'No recent news alerts. Destination appears stable with normal conditions.';
    }

    const categoryCount = {
      safety: articles.filter(a => a.category === 'safety').length,
      housing: articles.filter(a => a.category === 'housing').length,
      transport: articles.filter(a => a.category === 'transport').length,
      student: articles.filter(a => a.category === 'student').length,
      general: articles.filter(a => a.category === 'general').length,
    };

    let summary = '';

    if (safetyLevel === 'warning') {
      summary = '⚠️ Important safety alerts found. Review recent news carefully before travel. ';
    } else if (safetyLevel === 'caution') {
      summary = '⚡ Some safety concerns noted in recent news. Stay informed and take precautions. ';
    } else {
      summary = '✓ No major safety concerns in recent news. ';
    }

    const topics: string[] = [];
    if (categoryCount.student > 0) topics.push(`student life (${categoryCount.student})`);
    if (categoryCount.housing > 0) topics.push(`housing (${categoryCount.housing})`);
    if (categoryCount.transport > 0) topics.push(`transportation (${categoryCount.transport})`);

    if (topics.length > 0) {
      summary += `Recent coverage includes: ${topics.join(', ')}.`;
    }

    return summary;
  }
}

export const newsAPIService = new NewsAPIService();
