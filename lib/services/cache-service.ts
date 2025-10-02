/**
 * CacheService - LRU Cache with TTL
 * Memory-based caching to avoid redundant API calls
 * 6-hour default TTL with auto-invalidation
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class CacheService {
  private cache: Map<string, CacheEntry<any>>;
  private readonly defaultTTL: number;
  private readonly maxSize: number;

  constructor(defaultTTL: number = 6 * 60 * 60 * 1000, maxSize: number = 100) {
    this.cache = new Map();
    this.defaultTTL = defaultTTL; // 6 hours default
    this.maxSize = maxSize;
  }

  /**
   * Generate cache key from query parameters
   */
  generateKey(
    destination: string,
    origin: string,
    budget: number,
    interests: string[],
    duration: number
  ): string {
    const normalized = {
      destination: destination.toLowerCase().trim(),
      origin: origin.toLowerCase().trim(),
      budget: Math.round(budget),
      interests: interests.sort().join(',').toLowerCase(),
      duration,
    };
    return `dest:${normalized.destination}:${normalized.origin}:${normalized.budget}:${normalized.interests}:${normalized.duration}`;
  }

  /**
   * Get cached data if not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cache data with optional custom TTL
   */
  set<T>(key: string, data: T, customTTL?: number): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: customTTL || this.defaultTTL,
    });
  }

  /**
   * Check if cache entry is expired
   */
  isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Clear specific cache entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate?: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }

  /**
   * Clean up expired entries (run periodically)
   */
  cleanup(): number {
    let removed = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        removed++;
      }
    }
    return removed;
  }
}

// Export singleton instance
export const cacheService = new CacheService();

// Run cleanup every hour
if (typeof window === 'undefined') {
  setInterval(() => {
    const removed = cacheService.cleanup();
    if (removed > 0) {
      console.log(`[CacheService] Cleaned up ${removed} expired entries`);
    }
  }, 60 * 60 * 1000); // 1 hour
}
