/**
 * Cache Service
 * LRU (Least Recently Used) cache implementation for API responses
 */

import { CacheEntry, CacheOptions } from '../types/external-apis';

// ============================================================================
// LRU CACHE NODE
// ============================================================================

class CacheNode<T> {
  constructor(
    public key: string,
    public value: CacheEntry<T>,
    public prev: CacheNode<T> | null = null,
    public next: CacheNode<T> | null = null
  ) {}
}

// ============================================================================
// LRU CACHE IMPLEMENTATION
// ============================================================================

export class LRUCache<T> {
  private capacity: number;
  private cache: Map<string, CacheNode<T>>;
  private head: CacheNode<T> | null;
  private tail: CacheNode<T> | null;
  private defaultTtl: number;

  constructor(capacity: number = 100, defaultTtl: number = 21600) {
    // 6 hours default TTL
    this.capacity = capacity;
    this.cache = new Map();
    this.head = null;
    this.tail = null;
    this.defaultTtl = defaultTtl;
  }

  /**
   * Get value from cache
   * Returns null if not found or expired
   */
  get(key: string): T | null {
    const node = this.cache.get(key);

    if (!node) {
      return null;
    }

    // Check if expired
    if (this.isExpired(node.value)) {
      this.delete(key);
      return null;
    }

    // Move to head (most recently used)
    this.moveToHead(node);

    return node.value.data;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T, options: CacheOptions = {}): void {
    const ttl = options.ttl || this.defaultTtl;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttl * 1000);

    const entry: CacheEntry<T> = {
      data: value,
      timestamp: now.toISOString(),
      ttl,
      expiresAt: expiresAt.toISOString(),
      source: 'cache',
    };

    const existingNode = this.cache.get(key);

    if (existingNode) {
      // Update existing node
      existingNode.value = entry;
      this.moveToHead(existingNode);
    } else {
      // Create new node
      const newNode = new CacheNode(key, entry);

      this.cache.set(key, newNode);
      this.addToHead(newNode);

      // Check capacity and remove LRU if needed
      if (this.cache.size > this.capacity) {
        const removed = this.removeTail();
        if (removed) {
          this.cache.delete(removed.key);
        }
      }
    }
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    const node = this.cache.get(key);

    if (!node) {
      return false;
    }

    this.removeNode(node);
    this.cache.delete(key);

    return true;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const node = this.cache.get(key);

    if (!node) {
      return false;
    }

    if (this.isExpired(node.value)) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear();
    this.head = null;
    this.tail = null;
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   */
  stats(): {
    size: number;
    capacity: number;
    keys: string[];
    oldestEntry: string | null;
    newestEntry: string | null;
  } {
    return {
      size: this.cache.size,
      capacity: this.capacity,
      keys: Array.from(this.cache.keys()),
      oldestEntry: this.tail?.key || null,
      newestEntry: this.head?.key || null,
    };
  }

  /**
   * Clean expired entries
   */
  cleanExpired(): number {
    let cleaned = 0;
    const keysToDelete: string[] = [];

    for (const [key, node] of this.cache.entries()) {
      if (this.isExpired(node.value)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.delete(key);
      cleaned++;
    }

    return cleaned;
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private isExpired(entry: CacheEntry<T>): boolean {
    return new Date(entry.expiresAt) < new Date();
  }

  private addToHead(node: CacheNode<T>): void {
    node.next = this.head;
    node.prev = null;

    if (this.head) {
      this.head.prev = node;
    }

    this.head = node;

    if (!this.tail) {
      this.tail = node;
    }
  }

  private removeNode(node: CacheNode<T>): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
  }

  private moveToHead(node: CacheNode<T>): void {
    this.removeNode(node);
    this.addToHead(node);
  }

  private removeTail(): CacheNode<T> | null {
    if (!this.tail) {
      return null;
    }

    const removed = this.tail;
    this.removeNode(removed);

    return removed;
  }
}

// ============================================================================
// CACHE SERVICE (Singleton)
// ============================================================================

export class CacheService {
  private static instance: CacheService;
  private caches: Map<string, LRUCache<unknown>>;

  private constructor() {
    this.caches = new Map();
  }

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Get or create a cache for a specific namespace
   */
  getCache<T>(namespace: string, capacity: number = 100, defaultTtl: number = 21600): LRUCache<T> {
    if (!this.caches.has(namespace)) {
      this.caches.set(namespace, new LRUCache<T>(capacity, defaultTtl));
    }
    return this.caches.get(namespace) as LRUCache<T>;
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    for (const cache of this.caches.values()) {
      cache.clear();
    }
  }

  /**
   * Clean expired entries from all caches
   */
  cleanAllExpired(): number {
    let totalCleaned = 0;
    for (const cache of this.caches.values()) {
      totalCleaned += cache.cleanExpired();
    }
    return totalCleaned;
  }

  /**
   * Get statistics for all caches
   */
  getAllStats(): Record<string, ReturnType<LRUCache<unknown>['stats']>> {
    const stats: Record<string, ReturnType<LRUCache<unknown>['stats']>> = {};
    for (const [namespace, cache] of this.caches.entries()) {
      stats[namespace] = cache.stats();
    }
    return stats;
  }
}

// ============================================================================
// CACHE KEY GENERATORS
// ============================================================================

export class CacheKeyGenerator {
  /**
   * Generate cache key for destination queries
   */
  static destinationKey(
    city: string,
    country: string,
    origin?: string,
    budget?: number,
    interests?: string[]
  ): string {
    const parts = [city.toLowerCase(), country.toLowerCase()];

    if (origin) parts.push(origin.toLowerCase());
    if (budget) parts.push(`budget-${budget}`);
    if (interests && interests.length > 0) {
      parts.push(`interests-${interests.sort().join('-').toLowerCase()}`);
    }

    return parts.join(':');
  }

  /**
   * Generate cache key for Reddit queries
   */
  static redditKey(query: string, subreddits: string[]): string {
    const sortedSubreddits = [...subreddits].sort().join(',');
    return `reddit:${query.toLowerCase()}:${sortedSubreddits}`;
  }

  /**
   * Generate cache key for YouTube queries
   */
  static youtubeKey(query: string, maxResults: number = 10): string {
    return `youtube:${query.toLowerCase()}:${maxResults}`;
  }

  /**
   * Generate cache key for currency conversion
   */
  static currencyKey(from: string, to: string): string {
    return `currency:${from.toUpperCase()}:${to.toUpperCase()}`;
  }

  /**
   * Generate cache key for news queries
   */
  static newsKey(query: string, country?: string): string {
    const parts = ['news', query.toLowerCase()];
    if (country) parts.push(country.toLowerCase());
    return parts.join(':');
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const cacheService = CacheService.getInstance();

// ============================================================================
// CACHE DECORATOR (for easy caching)
// ============================================================================

export function Cached(namespace: string, ttl: number = 21600) {
  return function (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const cache = cacheService.getCache(namespace);
      const cacheKey = JSON.stringify(args);

      // Try to get from cache
      const cachedResult = cache.get(cacheKey);
      if (cachedResult !== null) {
        console.log(`[Cache Hit] ${namespace}:${cacheKey}`);
        return cachedResult;
      }

      // Execute original method
      console.log(`[Cache Miss] ${namespace}:${cacheKey}`);
      const result = await originalMethod.apply(this, args);

      // Store in cache
      cache.set(cacheKey, result, { ttl });

      return result;
    };

    return descriptor;
  };
}
