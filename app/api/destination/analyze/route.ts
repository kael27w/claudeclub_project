/**
 * API Route: Destination Intelligence Analysis
 * POST /api/destination/analyze
 *
 * Features:
 * - Stale-while-revalidate caching for instant responses
 * - Background refresh for stale data
 * - Pre-research for improved accuracy
 */

import { NextRequest, NextResponse } from 'next/server';
import { destinationAgent } from '@/lib/destination-agent';
import { cacheService } from '@/lib/services/cache-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    console.log('Analyzing destination query:', query);

    // Step 1: Parse the natural language query
    const parsedQuery = await destinationAgent.parseQuery(query);
    console.log('Parsed query:', parsedQuery);

    // Generate cache key
    const cacheKey = cacheService.generateKey(
      `${parsedQuery.city},${parsedQuery.country}`,
      parsedQuery.origin.city || parsedQuery.origin.state || parsedQuery.origin.country,
      parsedQuery.budget,
      parsedQuery.interests,
      parsedQuery.durationMonths
    );

    // Step 2: Check cache with stale-while-revalidate logic
    const cachedEntry = cacheService.getWithMetadata(cacheKey);

    if (cachedEntry) {
      console.log(`[API] ✓ Cache hit (age: ${Math.round(cachedEntry.age / 1000)}s, stale: ${cachedEntry.isStale})`);

      // If cache is stale, trigger background refresh (non-blocking)
      if (cachedEntry.isStale) {
        console.log('[API] 🔄 Triggering background refresh for stale cache...');

        // Background refresh - don't await
        destinationAgent.generateIntelligence(parsedQuery)
          .then(() => {
            console.log('[API] ✅ Background refresh complete');
          })
          .catch((error) => {
            console.error('[API] ⚠️ Background refresh failed:', error);
          });
      }

      // Return cached data immediately
      console.log('Generated intelligence for:', cachedEntry.data.query.city);
      console.log('Housing structure:', JSON.stringify(cachedEntry.data.costAnalysis.housing, null, 2));

      return NextResponse.json({
        success: true,
        data: cachedEntry.data,
        cached: true,
        stale: cachedEntry.isStale,
      });
    }

    // No cache - generate fresh intelligence
    console.log('[API] ⏳ Cache miss - generating fresh intelligence...');
    const intelligence = await destinationAgent.generateIntelligence(parsedQuery);
    console.log('Generated intelligence for:', intelligence.query.city);

    // DEBUG: Log the exact structure for housing data
    console.log('Housing structure:', JSON.stringify(intelligence.costAnalysis.housing, null, 2));

    return NextResponse.json({
      success: true,
      data: intelligence,
      cached: false,
    });
  } catch (error) {
    console.error('Destination analysis error:', error);

    return NextResponse.json(
      {
        error: 'Failed to analyze destination',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
