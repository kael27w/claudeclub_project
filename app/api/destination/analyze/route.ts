/**
 * API Route: Destination Intelligence Analysis
 * POST /api/destination/analyze
 */

import { NextRequest, NextResponse } from 'next/server';
import { destinationAgent } from '@/lib/destination-agent';

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

    // Step 2: Generate comprehensive intelligence
    const intelligence = await destinationAgent.generateIntelligence(parsedQuery);
    console.log('Generated intelligence for:', intelligence.query.city);
    
    // DEBUG: Log the exact structure for housing data
    console.log('Housing structure:', JSON.stringify(intelligence.costAnalysis.housing, null, 2));

    return NextResponse.json({
      success: true,
      data: intelligence,
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
