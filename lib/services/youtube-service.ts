/**
 * YouTubeService - Video Content & Student Experiences
 * Fetches relevant videos about destination, cost of living, student life
 */

import { cacheService } from './cache-service';
import type { YouTubeVideo, YouTubeInsights } from '../types/destination';

export class YouTubeService {
  private apiKey: string | null;

  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY || null;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Search for relevant YouTube videos about the destination
   */
  async getVideoInsights(
    city: string,
    country: string,
    interests: string[]
  ): Promise<YouTubeInsights> {
    const cacheKey = `youtube:${city}:${country}:${interests.join(',')}`;
    const cached = cacheService.get<YouTubeInsights>(cacheKey);

    if (cached) {
      console.log('[YouTubeService] Using cached insights');
      return cached;
    }

    if (!this.isConfigured()) {
      console.log('[YouTubeService] Not configured, returning empty insights');
      return {
        videos: [],
        topicsFound: [],
        averageViews: 0,
      };
    }

    try {
      const searchQueries = [
        `cost of living ${city} ${country}`,
        `student life ${city}`,
        `study abroad ${city}`,
        ...interests.map(interest => `${interest} ${city}`),
      ];

      const allVideos: YouTubeVideo[] = [];

      for (const query of searchQueries) {
        try {
          const videos = await this.searchVideos(query, 5);
          allVideos.push(...videos);
        } catch (error) {
          console.warn(`[YouTubeService] Error searching "${query}":`, error);
        }
      }

      // Remove duplicates and sort by relevance
      const uniqueVideos = this.deduplicateVideos(allVideos);
      const sortedVideos = this.rankVideos(uniqueVideos, city, interests);

      // Extract topics
      const topics = this.extractTopics(sortedVideos);

      // Calculate average views
      const averageViews = sortedVideos.length > 0
        ? Math.round(sortedVideos.reduce((sum, v) => sum + v.viewCount, 0) / sortedVideos.length)
        : 0;

      const result: YouTubeInsights = {
        videos: sortedVideos.slice(0, 10), // Top 10 videos
        topicsFound: topics,
        averageViews,
      };

      // Cache for 6 hours
      cacheService.set(cacheKey, result);

      return result;
    } catch (error) {
      console.error('[YouTubeService] Error fetching video insights:', error);
      return {
        videos: [],
        topicsFound: [],
        averageViews: 0,
      };
    }
  }

  /**
   * Search YouTube API for videos
   */
  private async searchVideos(query: string, maxResults: number = 5): Promise<YouTubeVideo[]> {
    if (!this.apiKey) {
      throw new Error('YouTube API key not configured');
    }

    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('q', query);
    url.searchParams.set('type', 'video');
    url.searchParams.set('maxResults', maxResults.toString());
    url.searchParams.set('order', 'relevance');
    url.searchParams.set('key', this.apiKey);
    url.searchParams.set('videoDefinition', 'any');
    url.searchParams.set('videoDuration', 'medium'); // 4-20 minutes
    url.searchParams.set('publishedAfter', this.getTwoYearsAgo());

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Get video IDs to fetch statistics
    const videoIds = data.items.map((item: any) => item.id.videoId).join(',');

    // Fetch video statistics
    const statsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    statsUrl.searchParams.set('part', 'statistics,contentDetails');
    statsUrl.searchParams.set('id', videoIds);
    statsUrl.searchParams.set('key', this.apiKey);

    const statsResponse = await fetch(statsUrl.toString());
    const statsData = await statsResponse.json();

    // Combine search results with statistics
    return data.items.map((item: any, index: number) => {
      const stats = statsData.items?.[index];
      const viewCount = stats?.statistics?.viewCount || 0;

      return {
        title: item.snippet.title,
        videoId: item.id.videoId,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        channelName: item.snippet.channelTitle,
        viewCount: parseInt(viewCount, 10),
        publishedAt: item.snippet.publishedAt,
        thumbnail: item.snippet.thumbnails.medium.url,
        duration: stats?.contentDetails?.duration || 'PT0S',
        relevance: 'medium' as const,
      };
    });
  }

  /**
   * Remove duplicate videos
   */
  private deduplicateVideos(videos: YouTubeVideo[]): YouTubeVideo[] {
    const seen = new Set<string>();
    return videos.filter(video => {
      if (seen.has(video.videoId)) {
        return false;
      }
      seen.add(video.videoId);
      return true;
    });
  }

  /**
   * Rank videos by relevance to query
   */
  private rankVideos(
    videos: YouTubeVideo[],
    city: string,
    interests: string[]
  ): YouTubeVideo[] {
    return videos
      .map(video => {
        let score = 0;
        const titleLower = video.title.toLowerCase();

        // City mention
        if (titleLower.includes(city.toLowerCase())) {
          score += 10;
        }

        // Interest match
        for (const interest of interests) {
          if (titleLower.includes(interest.toLowerCase())) {
            score += 5;
          }
        }

        // Key topics
        const topics = [
          'cost of living',
          'student',
          'study abroad',
          'budget',
          'guide',
          'tips',
        ];
        for (const topic of topics) {
          if (titleLower.includes(topic)) {
            score += 3;
          }
        }

        // View count bonus (log scale)
        if (video.viewCount > 100000) {
          score += 5;
        } else if (video.viewCount > 10000) {
          score += 3;
        }

        // Determine relevance
        let relevance: 'high' | 'medium' | 'low' = 'low';
        if (score >= 15) {
          relevance = 'high';
        } else if (score >= 8) {
          relevance = 'medium';
        }

        return { ...video, relevance, _score: score };
      })
      .sort((a, b) => (b as any)._score - (a as any)._score)
      .map(({ _score, ...video }) => video);
  }

  /**
   * Extract common topics from video titles
   */
  private extractTopics(videos: YouTubeVideo[]): string[] {
    const topicCounts = new Map<string, number>();

    const commonTopics = [
      'cost of living',
      'housing',
      'food',
      'transportation',
      'student life',
      'culture',
      'nightlife',
      'things to do',
      'budget',
      'safety',
      'guide',
      'tips',
      'travel',
    ];

    for (const video of videos) {
      const titleLower = video.title.toLowerCase();
      for (const topic of commonTopics) {
        if (titleLower.includes(topic)) {
          topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
        }
      }
    }

    return Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic);
  }

  /**
   * Get ISO 8601 date for 2 years ago
   */
  private getTwoYearsAgo(): string {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 2);
    return date.toISOString();
  }

  /**
   * Parse ISO 8601 duration to human-readable format
   */
  static formatDuration(duration: string): string {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return 'Unknown';

    const hours = match[1] ? parseInt(match[1]) : 0;
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const seconds = match[3] ? parseInt(match[3]) : 0;

    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 && hours === 0) parts.push(`${seconds}s`);

    return parts.join(' ') || '0s';
  }
}

export const youtubeService = new YouTubeService();
