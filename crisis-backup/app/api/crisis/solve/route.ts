/**
 * Crisis Solution Generation API Route
 * POST /api/crisis/solve
 * Generates multiple solution options for a crisis
 */

import { NextRequest, NextResponse } from 'next/server';
import { crisisAgent } from '@/lib/claude-agent';
import type { CrisisContext, CrisisAnalysis, Solution } from '@/lib/types/crisis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/crisis/solve
 * Request body: { crisis: CrisisContext, analysis: CrisisAnalysis }
 * Response: { solutions: Solution[] }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.crisis || !body.analysis) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: crisis, analysis',
        },
        { status: 400 }
      );
    }

    const crisis: CrisisContext = body.crisis;
    const analysis: CrisisAnalysis = body.analysis;

    // Generate solutions using the agent
    const solutions: Solution[] = await crisisAgent.generateSolutions(crisis, analysis);

    // Return successful response
    return NextResponse.json(
      {
        success: true,
        data: {
          solutions,
          count: solutions.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Solution generation error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate solutions',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/crisis/solve
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Crisis Solution API is operational',
    endpoint: 'POST /api/crisis/solve',
  });
}
