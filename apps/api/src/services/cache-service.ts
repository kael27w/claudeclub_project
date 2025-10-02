/**
 * Production-Ready Caching Layer
 *
 * LRU (Least Recently Used) cache with TTL support for destination intelligence data.
 * Implements memory-efficient caching with automatic expiration and eviction policies.
 *
 * Features:
 * - LRU eviction policy (max 100 entries)
 * - TTL support (default 6 hours, configurable)
 * - Type-safe cache operations
 * - Memory-efficient implementation
 * - Automatic cleanup of expired entries
 *
 * @module CacheService
 */

/**
 * Cache entry structure with data, timestamp, and TTL
 */
interface ICacheEntry<T> {
  /** Cached data of any type */
  data: T;
  /** Unix timestamp when entry was created (milliseconds) */
  timestamp: number;
  /** Time-to-live in milliseconds */
  ttl: number;
  /** Last access timestamp for LRU tracking */
  lastAccessed: number;
}

/**
 * Cache statistics for monitoring and debugging
 */
interface ICacheStats {
  /** Total number of entries in cache */
  size: number;
  /** Number of cache hits */
  hits: number;
  /** Number of cache misses */
  misses: number;
  /** Hit rate percentage */
  hitRate: number;
  /** Total memory usage estimate (bytes) */
  memoryUsage: number;
}

/**
 * Cache configuration options
 */
interface ICacheConfig {
  /** Maximum number of entries before LRU eviction */
  maxSize: number;
  /** Default TTL in milliseconds */
  defaultTtl: number;
  /** Enable automatic cleanup of expired entries */
  autoCleanup: boolean;
  /** Cleanup interval in milliseconds */
  cleanupInterval: number;
}

/**
 * Cache types for different data categories
 */
export enum CacheType {
  PERPLEXITY_RESPONSE = 'perplexity',
  API_RESULT = 'api',
  DESTINATION_INTELLIGENCE = 'destination',
  CURRENCY_RATES = 'currency',
  REDDIT_INSIGHTS = 'reddit',
  YOUTUBE_DATA = 'youtube',
  NEWS_DATA = 'news'
}

/**
 * Production-ready LRU cache with TTL support
 *
 * @example
 * ```typescript
 * const cache = new CacheService();
 *
 * // Set a value with default TTL (6 hours)
 * cache.set('key', { data: 'value' });
 *
 * // Set a value with custom TTL (1 hour)
 * cache.set('key', { data: 'value' }, 3600000);
 *
 * // Get a value
 * const result = cache.get<MyType>('key');
 *
 * // Clear specific key
 * cache.clear('key');
 *
 * // Clear all entries
 * cache.clear();
 * ```
 */
export class CacheService {
  /** Internal cache storage using Map for O(1) operations */
  private cache: Map<string, ICacheEntry<any>>;

  /** Cache configuration */
  private config: ICacheConfig;

  /** Cache statistics */
  private stats: {
    hits: number;
    misses: number;
  };

  /** Cleanup interval ID for automatic cleanup */
  private cleanupIntervalId?: NodeJS.Timeout;

  /**
   * Default configuration values
   */
  private static readonly DEFAULT_CONFIG: ICacheConfig = {
    maxSize: 100,
    defaultTtl: 6 * 60 * 60 * 1000, // 6 hours in milliseconds
    autoCleanup: true,
    cleanupInterval: 30 * 60 * 1000 // 30 minutes
  };

  /**
   * Create a new CacheService instance
   *
   * @param config Optional configuration overrides
   */
  constructor(config: Partial<ICacheConfig> = {}) {
    this.cache = new Map();
    this.config = { ...CacheService.DEFAULT_CONFIG, ...config };
    this.stats = {
      hits: 0,
      misses: 0
    };

    // Start automatic cleanup if enabled
    if (this.config.autoCleanup) {
      this.startAutoCleanup();
    }
  }

  /**
   * Generate cache key from destination query parameters
   *
   * @param destination Target city/country
   * @param origin User's origin location
   * @param budget Budget amount
   * @param interests User interests (comma-separated)
   * @param duration Trip duration in days
   * @param type Cache type for namespacing
   * @returns Normalized cache key
   */
  public static generateKey(
    destination: string,
    origin: string,
    budget: number,
    interests: string,
    duration: number,
    type: CacheType = CacheType.DESTINATION_INTELLIGENCE
  ): string {
    // Normalize inputs to ensure consistent keys
    const normalizedDestination = destination.toLowerCase().trim();
    const normalizedOrigin = origin.toLowerCase().trim();
    const normalizedInterests = interests.toLowerCase().trim().split(',').sort().join(',');

    return `${type}:${normalizedDestination}-${normalizedOrigin}-${budget}-${normalizedInterests}-${duration}`;
  }

  /**
   * Retrieve value from cache
   *
   * @param key Cache key
   * @returns Cached value or null if not found/expired
   */
  public get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    // Cache miss
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (this.isExpired(key)) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Cache hit - update access time for LRU
    entry.lastAccessed = Date.now();
    this.stats.hits++;

    return entry.data as T;
  }

  /**
   * Store value in cache
   *
   * @param key Cache key
   * @param data Data to cache
   * @param ttl Optional custom TTL in milliseconds
   */
  public set<T>(key: string, data: T, ttl?: number): void {
    // Enforce max size with LRU eviction
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    const now = Date.now();
    const entry: ICacheEntry<T> = {
      data,
      timestamp: now,
      ttl: ttl ?? this.config.defaultTtl,
      lastAccessed: now
    };

    this.cache.set(key, entry);
  }

  /**
   * Check if cache entry is expired
   *
   * @param key Cache key
   * @returns True if expired or not found
   */
  public isExpired(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return true;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    return age > entry.ttl;
  }

  /**
   * Clear cache entry or entire cache
   *
   * @param key Optional key to clear. If omitted, clears entire cache
   */
  public clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
      this.stats.hits = 0;
      this.stats.misses = 0;
    }
  }

  /**
   * Get cache statistics
   *
   * @returns Cache statistics object
   */
  public getStats(): ICacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0
      ? (this.stats.hits / totalRequests) * 100
      : 0;

    // Estimate memory usage (rough approximation)
    let memoryUsage = 0;
    this.cache.forEach((entry, key) => {
      // Key size + entry overhead
      memoryUsage += key.length * 2; // UTF-16 characters
      memoryUsage += JSON.stringify(entry.data).length * 2;
      memoryUsage += 32; // Timestamp, TTL, lastAccessed overhead
    });

    return {
      size: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      memoryUsage
    };
  }

  /**
   * Remove all expired entries from cache
   *
   * @returns Number of entries removed
   */
  public cleanupExpired(): number {
    let removedCount = 0;
    const now = Date.now();

    Array.from(this.cache.entries()).forEach(([key, entry]) => {
      const age = now - entry.timestamp;
      if (age > entry.ttl) {
        this.cache.delete(key);
        removedCount++;
      }
    });

    return removedCount;
  }

  /**
   * Check if cache has a valid (non-expired) entry for key
   *
   * @param key Cache key
   * @returns True if key exists and is not expired
   */
  public has(key: string): boolean {
    return this.cache.has(key) && !this.isExpired(key);
  }

  /**
   * Get all cache keys (excluding expired entries)
   *
   * @returns Array of valid cache keys
   */
  public keys(): string[] {
    return Array.from(this.cache.keys()).filter(key => !this.isExpired(key));
  }

  /**
   * Get cache entries by type prefix
   *
   * @param type Cache type to filter by
   * @returns Array of keys matching the type
   */
  public getKeysByType(type: CacheType): string[] {
    const prefix = `${type}:`;
    return this.keys().filter(key => key.startsWith(prefix));
  }

  /**
   * Clear all entries of a specific type
   *
   * @param type Cache type to clear
   * @returns Number of entries cleared
   */
  public clearByType(type: CacheType): number {
    const keys = this.getKeysByType(type);
    keys.forEach(key => this.cache.delete(key));
    return keys.length;
  }

  /**
   * Destroy cache and stop cleanup interval
   * Call this when shutting down the service
   */
  public destroy(): void {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = undefined;
    }
    this.cache.clear();
  }

  /**
   * Evict least recently used entry from cache
   * @private
   */
  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruTime = Infinity;

    // Find least recently used entry
    Array.from(this.cache.entries()).forEach(([key, entry]) => {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    });

    // Remove LRU entry
    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  /**
   * Start automatic cleanup interval
   * @private
   */
  private startAutoCleanup(): void {
    this.cleanupIntervalId = setInterval(() => {
      const removed = this.cleanupExpired();
      if (removed > 0) {
        console.log(`[CacheService] Auto-cleanup removed ${removed} expired entries`);
      }
    }, this.config.cleanupInterval);

    // Ensure cleanup doesn't prevent process exit
    if (this.cleanupIntervalId.unref) {
      this.cleanupIntervalId.unref();
    }
  }
}

/**
 * Singleton instance for global cache usage
 */
export const cacheService = new CacheService();

/**
 * Export types for external use
 */
export type { ICacheEntry, ICacheStats, ICacheConfig };
