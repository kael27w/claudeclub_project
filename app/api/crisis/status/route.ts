/**
 * Crisis Solution Execution API Route
 * POST /api/crisis/status
 * Executes a solution and streams progress updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { crisisAgent } from '@/lib/claude-agent';
import type { Solution, SolutionStep, ExecutionResult } from '@/lib/types/crisis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/crisis/status
 * Request body: { solution: Solution, streamUpdates?: boolean }
 * Response: ExecutionResult (or SSE stream if streamUpdates is true)
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.solution) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: solution',
        },
        { status: 400 }
      );
    }

    const solution: Solution = body.solution;
    const streamUpdates = body.streamUpdates || false;

    // If streaming is requested, set up SSE
    if (streamUpdates) {
      return handleStreamingExecution(solution);
    }

    // Otherwise, execute and return final result
    const result: ExecutionResult = await crisisAgent.executeSolution(solution);

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Solution execution error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute solution',
      },
      { status: 500 }
    );
  }
}

/**
 * Handle streaming execution with Server-Sent Events
 */
async function handleStreamingExecution(solution: Solution) {
  const encoder = new TextEncoder();

  // Create a ReadableStream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Execute solution with progress callbacks
        const result = await crisisAgent.executeSolution(
          solution,
          (step: SolutionStep) => {
            // Send step update as SSE event
            const data = JSON.stringify({
              type: 'step_update',
              step,
              timestamp: new Date().toISOString(),
            });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
        );

        // Send final result
        const finalData = JSON.stringify({
          type: 'execution_complete',
          result,
          timestamp: new Date().toISOString(),
        });
        controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));

        // Close the stream
        controller.close();
      } catch (error) {
        // Send error event
        const errorData = JSON.stringify({
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        });
        controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        controller.close();
      }
    },
  });

  // Return SSE response
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

/**
 * GET /api/crisis/status
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Crisis Execution API is operational',
    endpoint: 'POST /api/crisis/status',
    features: ['Standard execution', 'SSE streaming (streamUpdates: true)'],
  });
}
