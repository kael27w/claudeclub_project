/**
 * Crisis Analysis API Route
 * POST /api/crisis/analyze
 * Analyzes a crisis situation and returns structured analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { crisisAgent } from '@/lib/claude-agent';
import type { CrisisContext, CrisisAnalysis } from '@/lib/types/crisis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/crisis/analyze
 * Request body: CrisisContext
 * Response: CrisisAnalysis
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.type || !body.description || !body.location) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: type, description, location',
        },
        { status: 400 }
      );
    }

    // Construct crisis context with defaults
    const crisisContext: CrisisContext = {
      type: body.type,
      description: body.description,
      location: body.location,
      userLocation: body.userLocation,
      constraints: {
        budget: body.constraints?.budget || 1000,
        timeframe: body.constraints?.timeframe || '24 hours',
        preferences: body.constraints?.preferences || [],
        urgency: body.constraints?.urgency || 'medium',
      },
      metadata: body.metadata,
    };

    // Analyze the crisis using the agent
    const analysis: CrisisAnalysis = await crisisAgent.analyzeSituation(crisisContext);

    // Return successful response
    return NextResponse.json(
      {
        success: true,
        data: analysis,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Crisis analysis error:', error);

    // Log more details for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze crisis',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/crisis/analyze
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Crisis Analysis API is operational',
    endpoint: 'POST /api/crisis/analyze',
  });
}
