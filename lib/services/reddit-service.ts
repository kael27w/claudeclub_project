/**
 * Reddit API Service
 * Fetches community insights, student experiences, and local knowledge
 *
 * API Documentation: https://www.reddit.com/dev/api/
 * Rate Limits: 60 requests per minute (authenticated)
 */

import {
  RedditServiceConfig,
  RedditSearchParams,
  RedditPost,
  RedditInsights,
  CostInsight,
  StudentExperience,
  ApiResponse,
} from '../types/external-apis';
import { ApiErrorHandler, createSuccessResponse } from '../utils/api-error-handler';
import { cacheService, CacheKeyGenerator } from '../utils/cache-service';

// ============================================================================
// REDDIT SERVICE CLASS
// ============================================================================

export class RedditService {
  private config: RedditServiceConfig;
  private baseUrl = 'https://oauth.reddit.com';
  private authUrl = 'https://www.reddit.com/api/v1';
  private cache = cacheService.getCache<RedditInsights>('reddit', 50, 21600); // 6 hours

  constructor(config: RedditServiceConfig) {
    this.config = config;
  }

  // ============================================================================
  // PUBLIC METHODS
  // ============================================================================

  /**
   * Check if service is configured
   */
  isConfigured(): boolean {
    return !!(this.config.clientId && this.config.clientSecret);
  }

  /**
   * Search Reddit for destination insights
   */
  async searchDestination(params: RedditSearchParams): Promise<ApiResponse<RedditInsights>> {
    const cacheKey = CacheKeyGenerator.redditKey(params.query, params.subreddits);

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return createSuccessResponse(cached, 'reddit', true);
    }

    // Fetch from API
    return ApiErrorHandler.handleApiCall(
      async () => {
        await this.ensureAuthenticated();

        const posts = await this.searchPosts(params);
        const insights = await this.analyzeInsights(posts, params.query);

        // Cache results
        this.cache.set(cacheKey, insights);

        return insights;
      },
      'reddit',
      {
        maxRetries: 2,
        baseDelay: 2000,
      }
    );
  }

  /**
   * Get insights for a specific city
   */
  async getCityInsights(
    city: string,
    country: string
  ): Promise<ApiResponse<RedditInsights>> {
    const subreddits = this.getRelevantSubreddits(city, country);
    const query = `${city} student OR study abroad OR cost living OR housing`;

    return this.searchDestination({
      query,
      subreddits,
      limit: 50,
      sort: 'top',
      timeFilter: 'year',
    });
  }

  // ============================================================================
  // AUTHENTICATION
  // ============================================================================

  /**
   * Ensure we have a valid access token
   */
  private async ensureAuthenticated(): Promise<void> {
    // Check if token is still valid
    if (this.config.accessToken && this.config.tokenExpiry) {
      if (this.config.tokenExpiry > new Date()) {
        return; // Token still valid
      }
    }

    // Get new token
    await this.authenticate();
  }

  /**
   * Authenticate with Reddit API using client credentials
   */
  private async authenticate(): Promise<void> {
    const auth = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString(
      'base64'
    );

    const response = await fetch(`${this.authUrl}/access_token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': this.config.userAgent,
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error(`Reddit authentication failed: ${response.statusText}`);
    }

    const data = await response.json();

    this.config.accessToken = data.access_token;
    // Tokens expire in 1 hour, refresh 5 minutes early
    this.config.tokenExpiry = new Date(Date.now() + (data.expires_in - 300) * 1000);
  }

  // ============================================================================
  // API CALLS
  // ============================================================================

  /**
   * Search posts across multiple subreddits
   */
  private async searchPosts(params: RedditSearchParams): Promise<RedditPost[]> {
    const allPosts: RedditPost[] = [];

    for (const subreddit of params.subreddits) {
      try {
        const posts = await this.searchSubreddit(subreddit, params);
        allPosts.push(...posts);
      } catch (error) {
        console.warn(`Failed to search r/${subreddit}:`, error);
        // Continue with other subreddits
      }
    }

    // Sort by score and limit
    return allPosts
      .sort((a, b) => b.score - a.score)
      .slice(0, params.limit || 50);
  }

  /**
   * Search a specific subreddit
   */
  private async searchSubreddit(
    subreddit: string,
    params: RedditSearchParams
  ): Promise<RedditPost[]> {
    const searchParams = new URLSearchParams({
      q: params.query,
      sort: params.sort || 'top',
      t: params.timeFilter || 'year',
      limit: String(params.limit || 25),
      restrict_sr: 'true',
    });

    const url = `${this.baseUrl}/r/${subreddit}/search?${searchParams}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
        'User-Agent': this.config.userAgent,
      },
    });

    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.statusText}`);
    }

    const data = await response.json();

    return this.parsePosts(data.data.children);
  }

  /**
   * Parse Reddit API response into RedditPost objects
   */
  private parsePosts(children: Array<{ data: Record<string, unknown> }>): RedditPost[] {
    return children.map((child) => {
      const post = child.data;
      return {
        id: String(post.id),
        title: String(post.title),
        content: String(post.selftext || ''),
        author: String(post.author),
        subreddit: String(post.subreddit),
        score: Number(post.score || 0),
        numComments: Number(post.num_comments || 0),
        url: String(post.url),
        createdAt: new Date(Number(post.created_utc) * 1000).toISOString(),
        permalink: `https://reddit.com${String(post.permalink)}`,
        flair: post.link_flair_text ? String(post.link_flair_text) : undefined,
      };
    });
  }

  // ============================================================================
  // INSIGHTS ANALYSIS
  // ============================================================================

  /**
   * Analyze posts to extract insights
   */
  private async analyzeInsights(posts: RedditPost[], _query: string): Promise<RedditInsights> {
    return {
      posts: posts.slice(0, 20), // Top 20 posts
      topTopics: this.extractTopics(posts),
      commonConcerns: this.extractConcerns(posts),
      costInsights: this.extractCostInsights(posts),
      safetyTips: this.extractSafetyTips(posts),
      housingAdvice: this.extractHousingAdvice(posts),
      studentExperiences: this.extractStudentExperiences(posts),
      confidence: this.calculateConfidence(posts),
    };
  }

  /**
   * Extract common topics from post titles and content
   */
  private extractTopics(posts: RedditPost[]): string[] {
    const topics = new Map<string, number>();
    const keywords = [
      'housing',
      'accommodation',
      'food',
      'transport',
      'metro',
      'bus',
      'safety',
      'nightlife',
      'museum',
      'university',
      'student',
      'visa',
      'budget',
      'cheap',
      'expensive',
    ];

    for (const post of posts) {
      const text = `${post.title} ${post.content}`.toLowerCase();

      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          topics.set(keyword, (topics.get(keyword) || 0) + 1);
        }
      }
    }

    // Return top 10 topics by frequency
    return Array.from(topics.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic]) => topic);
  }

  /**
   * Extract common concerns mentioned in posts
   */
  private extractConcerns(posts: RedditPost[]): string[] {
    const concerns: string[] = [];
    const concernKeywords = ['problem', 'issue', 'concern', 'careful', 'avoid', 'warning', 'scam'];

    for (const post of posts) {
      const text = `${post.title} ${post.content}`.toLowerCase();

      for (const keyword of concernKeywords) {
        if (text.includes(keyword) && post.score > 10) {
          concerns.push(post.title);
          break;
        }
      }
    }

    return concerns.slice(0, 5);
  }

  /**
   * Extract cost-related insights
   */
  private extractCostInsights(posts: RedditPost[]): CostInsight[] {
    const insights: CostInsight[] = [];
    const costKeywords = {
      housing: ['rent', 'apartment', 'flat', 'accommodation', 'housing'],
      food: ['food', 'groceries', 'restaurant', 'eating', 'meal'],
      transport: ['metro', 'bus', 'transport', 'uber', 'taxi'],
    };

    for (const post of posts) {
      const text = `${post.title} ${post.content}`.toLowerCase();

      // Check if post mentions costs
      if (!text.match(/\$|€|£|\d+\s*(dollar|euro|pound|per month|monthly)/i)) {
        continue;
      }

      for (const [category, keywords] of Object.entries(costKeywords)) {
        if (keywords.some((keyword) => text.includes(keyword))) {
          insights.push({
            category,
            insight: post.title,
            source: post.title,
            score: post.score,
          });
          break;
        }
      }
    }

    return insights.slice(0, 10);
  }

  /**
   * Extract safety tips from posts
   */
  private extractSafetyTips(posts: RedditPost[]): string[] {
    const tips: string[] = [];
    const safetyKeywords = ['safety', 'safe', 'dangerous', 'crime', 'secure', 'pickpocket'];

    for (const post of posts) {
      const text = `${post.title} ${post.content}`.toLowerCase();

      if (safetyKeywords.some((keyword) => text.includes(keyword)) && post.score > 5) {
        tips.push(post.title);
      }
    }

    return tips.slice(0, 5);
  }

  /**
   * Extract housing advice
   */
  private extractHousingAdvice(posts: RedditPost[]): string[] {
    const advice: string[] = [];
    const housingKeywords = ['housing', 'apartment', 'rent', 'accommodation', 'landlord', 'lease'];

    for (const post of posts) {
      const text = `${post.title} ${post.content}`.toLowerCase();

      if (housingKeywords.some((keyword) => text.includes(keyword)) && post.score > 10) {
        advice.push(post.title);
      }
    }

    return advice.slice(0, 5);
  }

  /**
   * Extract student experiences
   */
  private extractStudentExperiences(posts: RedditPost[]): StudentExperience[] {
    const experiences: StudentExperience[] = [];
    const studentKeywords = ['student', 'study abroad', 'exchange', 'university', 'semester'];

    for (const post of posts) {
      const text = `${post.title} ${post.content}`.toLowerCase();

      if (!studentKeywords.some((keyword) => text.includes(keyword))) {
        continue;
      }

      experiences.push({
        summary: post.title,
        positives: this.extractPositives(post.content),
        negatives: this.extractNegatives(post.content),
        postUrl: post.permalink,
      });
    }

    return experiences.slice(0, 3);
  }

  /**
   * Extract positive points from text
   */
  private extractPositives(text: string): string[] {
    const positives: string[] = [];
    const positiveKeywords = ['love', 'amazing', 'great', 'wonderful', 'recommend', 'enjoy'];

    const sentences = text.split(/[.!?]/);
    for (const sentence of sentences) {
      if (positiveKeywords.some((keyword) => sentence.toLowerCase().includes(keyword))) {
        positives.push(sentence.trim());
      }
    }

    return positives.slice(0, 3);
  }

  /**
   * Extract negative points from text
   */
  private extractNegatives(text: string): string[] {
    const negatives: string[] = [];
    const negativeKeywords = ['avoid', 'problem', 'issue', 'disappointing', 'bad', 'difficult'];

    const sentences = text.split(/[.!?]/);
    for (const sentence of sentences) {
      if (negativeKeywords.some((keyword) => sentence.toLowerCase().includes(keyword))) {
        negatives.push(sentence.trim());
      }
    }

    return negatives.slice(0, 3);
  }

  /**
   * Calculate confidence score based on post quality and recency
   */
  private calculateConfidence(posts: RedditPost[]): number {
    if (posts.length === 0) return 0;

    let score = 0;
    const now = Date.now();

    for (const post of posts) {
      // Score based on upvotes (max 10 points)
      const scorePoints = Math.min(post.score / 100, 10);

      // Score based on recency (max 10 points)
      const ageInDays = (now - new Date(post.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      const recencyPoints = Math.max(0, 10 - ageInDays / 30);

      // Score based on comments (max 5 points)
      const commentPoints = Math.min(post.numComments / 20, 5);

      score += scorePoints + recencyPoints + commentPoints;
    }

    // Normalize to 0-1 range
    const maxPossibleScore = posts.length * 25;
    return Math.min(score / maxPossibleScore, 1);
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Get relevant subreddits for a city
   */
  private getRelevantSubreddits(city: string, country: string): string[] {
    const subreddits = [
      'studyabroad',
      'IWantOut',
      'travel',
    ];

    // Add city-specific subreddit
    const cityName = city.toLowerCase().replace(/\s+/g, '');
    subreddits.push(cityName);

    // Add country-specific subreddit
    const countryName = country.toLowerCase().replace(/\s+/g, '');
    subreddits.push(countryName);

    return subreddits;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let redditServiceInstance: RedditService | null = null;

export function getRedditService(): RedditService | null {
  if (!redditServiceInstance) {
    const config: RedditServiceConfig = {
      clientId: process.env.REDDIT_CLIENT_ID || '',
      clientSecret: process.env.REDDIT_CLIENT_SECRET || '',
      userAgent: process.env.REDDIT_USER_AGENT || 'AdaptiveTravelAgent/1.0',
    };

    if (!config.clientId || !config.clientSecret) {
      console.warn('[Reddit] API credentials not configured - service will return null');
      return null;
    }

    redditServiceInstance = new RedditService(config);
  }

  return redditServiceInstance;
}

// Export singleton instance (null if not configured)
export const redditService = getRedditService();

// Export singleton getter as default
export default getRedditService;
