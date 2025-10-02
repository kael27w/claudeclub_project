/**
 * Cache Service Usage Examples
 *
 * This file demonstrates practical usage of the CacheService for destination intelligence.
 * Run with: ts-node cache-service.example.ts
 */

import { CacheService, CacheType, cacheService } from '../cache-service';

// Example data types
interface DestinationIntelligence {
  destination: string;
  costAnalysis: {
    avgMonthlyLiving: number;
    flightEstimate: number;
  };
  culturalGuide: {
    language: string;
    customs: string[];
  };
}

interface CurrencyRates {
  from: string;
  to: string;
  rate: number;
  timestamp: number;
}

/**
 * Example 1: Basic cache operations
 */
function example1_BasicOperations() {
  console.log('\n--- Example 1: Basic Operations ---');

  const cache = new CacheService();

  // Store data
  cache.set('user:123', { name: 'John', email: 'john@example.com' });

  // Retrieve data
  const user = cache.get<{ name: string; email: string }>('user:123');
  console.log('Retrieved user:', user);

  // Check if exists
  console.log('User exists:', cache.has('user:123'));

  // Clear specific key
  cache.clear('user:123');
  console.log('User after clear:', cache.get('user:123'));

  cache.destroy();
}

/**
 * Example 2: Destination intelligence caching
 */
function example2_DestinationCaching() {
  console.log('\n--- Example 2: Destination Intelligence ---');

  const cache = new CacheService();

  // Generate cache key for destination query
  const cacheKey = CacheService.generateKey(
    'São Paulo',
    'Virginia',
    2000,
    'art,food,culture',
    120,
    CacheType.DESTINATION_INTELLIGENCE
  );

  console.log('Generated cache key:', cacheKey);

  // Simulate destination intelligence data
  const intelligence: DestinationIntelligence = {
    destination: 'São Paulo',
    costAnalysis: {
      avgMonthlyLiving: 800,
      flightEstimate: 600
    },
    culturalGuide: {
      language: 'Portuguese',
      customs: ['Greet with kisses', 'Dinner starts late']
    }
  };

  // Cache the intelligence
  cache.set(cacheKey, intelligence);

  // Retrieve from cache
  const cached = cache.get<DestinationIntelligence>(cacheKey);
  console.log('Cached intelligence:', JSON.stringify(cached, null, 2));

  // Check cache statistics
  const stats = cache.getStats();
  console.log('Cache stats:', stats);

  cache.destroy();
}

/**
 * Example 3: TTL and expiration
 */
async function example3_TTLExpiration() {
  console.log('\n--- Example 3: TTL and Expiration ---');

  const cache = new CacheService();

  // Store with 1 second TTL
  cache.set('short-lived', { data: 'expires soon' }, 1000);

  console.log('Immediately after set:', cache.get('short-lived'));
  console.log('Is expired?', cache.isExpired('short-lived'));

  // Wait 1.5 seconds
  await new Promise(resolve => setTimeout(resolve, 1500));

  console.log('After 1.5 seconds:', cache.get('short-lived'));
  console.log('Is expired?', cache.isExpired('short-lived'));

  cache.destroy();
}

/**
 * Example 4: LRU eviction
 */
function example4_LRUEviction() {
  console.log('\n--- Example 4: LRU Eviction ---');

  // Create cache with max size of 3
  const cache = new CacheService({ maxSize: 3 });

  // Add 3 entries
  cache.set('key1', { value: 1 });
  cache.set('key2', { value: 2 });
  cache.set('key3', { value: 3 });

  console.log('After adding 3 entries:');
  console.log('Cache size:', cache.getStats().size);
  console.log('Has key1:', cache.has('key1'));

  // Access key1 to make it recently used
  cache.get('key1');
  console.log('\nAfter accessing key1');

  // Add 4th entry - should evict key2 (least recently used)
  cache.set('key4', { value: 4 });

  console.log('\nAfter adding key4 (should evict key2):');
  console.log('Cache size:', cache.getStats().size);
  console.log('Has key1:', cache.has('key1'));
  console.log('Has key2:', cache.has('key2'));
  console.log('Has key3:', cache.has('key3'));
  console.log('Has key4:', cache.has('key4'));

  cache.destroy();
}

/**
 * Example 5: Type-based operations
 */
function example5_TypeBasedOps() {
  console.log('\n--- Example 5: Type-Based Operations ---');

  const cache = new CacheService();

  // Add entries of different types
  cache.set(
    CacheService.generateKey('Paris', 'NYC', 3000, 'art', 90, CacheType.DESTINATION_INTELLIGENCE),
    { destination: 'Paris' }
  );

  cache.set(
    CacheService.generateKey('London', 'LA', 4000, 'museums', 60, CacheType.DESTINATION_INTELLIGENCE),
    { destination: 'London' }
  );

  cache.set(
    `${CacheType.CURRENCY_RATES}:USD-EUR`,
    { from: 'USD', to: 'EUR', rate: 0.85, timestamp: Date.now() }
  );

  cache.set(
    `${CacheType.CURRENCY_RATES}:USD-GBP`,
    { from: 'USD', to: 'GBP', rate: 0.73, timestamp: Date.now() }
  );

  // Get keys by type
  const destinationKeys = cache.getKeysByType(CacheType.DESTINATION_INTELLIGENCE);
  const currencyKeys = cache.getKeysByType(CacheType.CURRENCY_RATES);

  console.log('Destination keys:', destinationKeys.length);
  console.log('Currency keys:', currencyKeys.length);

  // Clear specific type
  const cleared = cache.clearByType(CacheType.CURRENCY_RATES);
  console.log('Cleared currency entries:', cleared);
  console.log('Remaining destination keys:', cache.getKeysByType(CacheType.DESTINATION_INTELLIGENCE).length);

  cache.destroy();
}

/**
 * Example 6: Singleton usage (recommended)
 */
function example6_SingletonUsage() {
  console.log('\n--- Example 6: Singleton Usage ---');

  // Use global singleton instance
  cacheService.set('global-key', { shared: 'data' });

  const data = cacheService.get<{ shared: string }>('global-key');
  console.log('Data from singleton:', data);

  const stats = cacheService.getStats();
  console.log('Singleton cache stats:', stats);

  cacheService.clear();
}

/**
 * Example 7: Cache statistics and monitoring
 */
function example7_Statistics() {
  console.log('\n--- Example 7: Cache Statistics ---');

  const cache = new CacheService();

  // Generate some cache activity
  for (let i = 0; i < 10; i++) {
    const key = `item:${i}`;
    cache.set(key, { index: i });
  }

  // Mix of hits and misses
  cache.get('item:5');  // hit
  cache.get('item:5');  // hit
  cache.get('item:99'); // miss
  cache.get('item:3');  // hit
  cache.get('item:88'); // miss

  const stats = cache.getStats();
  console.log('Statistics:');
  console.log(`  Size: ${stats.size} entries`);
  console.log(`  Hits: ${stats.hits}`);
  console.log(`  Misses: ${stats.misses}`);
  console.log(`  Hit Rate: ${stats.hitRate}%`);
  console.log(`  Memory Usage: ${(stats.memoryUsage / 1024).toFixed(2)} KB`);

  cache.destroy();
}

/**
 * Example 8: Practical destination intelligence flow
 */
async function example8_PracticalFlow() {
  console.log('\n--- Example 8: Practical Flow ---');

  const cache = new CacheService();

  // Simulate destination intelligence fetch
  async function fetchDestinationIntelligence(
    destination: string,
    origin: string,
    budget: number,
    interests: string,
    duration: number
  ): Promise<DestinationIntelligence> {
    // Generate cache key
    const cacheKey = CacheService.generateKey(
      destination,
      origin,
      budget,
      interests,
      duration,
      CacheType.DESTINATION_INTELLIGENCE
    );

    // Check cache first
    const cached = cache.get<DestinationIntelligence>(cacheKey);
    if (cached) {
      console.log('✅ Cache HIT - returning cached data');
      return cached;
    }

    console.log('❌ Cache MISS - generating new intelligence');

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Generate new intelligence
    const intelligence: DestinationIntelligence = {
      destination,
      costAnalysis: {
        avgMonthlyLiving: 800,
        flightEstimate: 600
      },
      culturalGuide: {
        language: 'Portuguese',
        customs: ['Custom 1', 'Custom 2']
      }
    };

    // Cache the result
    cache.set(cacheKey, intelligence);

    return intelligence;
  }

  // First call - cache miss
  const result1 = await fetchDestinationIntelligence(
    'São Paulo',
    'Virginia',
    2000,
    'art,food',
    120
  );

  // Second call - cache hit
  const result2 = await fetchDestinationIntelligence(
    'São Paulo',
    'Virginia',
    2000,
    'art,food',
    120
  );

  // Different query - cache miss
  const result3 = await fetchDestinationIntelligence(
    'Rio de Janeiro',
    'Virginia',
    2000,
    'art,food',
    120
  );

  console.log('\nFinal cache statistics:');
  console.log(cache.getStats());

  cache.destroy();
}

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log('=== Cache Service Examples ===\n');

  example1_BasicOperations();
  example2_DestinationCaching();
  await example3_TTLExpiration();
  example4_LRUEviction();
  example5_TypeBasedOps();
  example6_SingletonUsage();
  example7_Statistics();
  await example8_PracticalFlow();

  console.log('\n=== All Examples Complete ===');
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}

export {
  example1_BasicOperations,
  example2_DestinationCaching,
  example3_TTLExpiration,
  example4_LRUEviction,
  example5_TypeBasedOps,
  example6_SingletonUsage,
  example7_Statistics,
  example8_PracticalFlow
};
