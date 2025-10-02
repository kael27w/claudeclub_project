/**
 * Crisis Management Agent
 * Autonomous AI agent for handling travel crises using Claude 4.5
 */

import { sendMessage } from './claude-client';
import { getMockAnalysis, getMockSolutions } from './mock-data';
import type {
  CrisisContext,
  CrisisAnalysis,
  Solution,
  SolutionStep,
  ExecutionResult,
} from './types/crisis';

// Check if demo mode is enabled
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

/**
 * Main Crisis Management Agent class
 * Handles the full crisis resolution pipeline: analyze → generate solutions → execute
 */
export class CrisisManagementAgent {
  /**
   * Analyze a crisis situation using Claude's reasoning capabilities
   * @param crisis - The crisis context including type, location, and constraints
   * @returns Detailed analysis of the crisis
   */
  async analyzeSituation(crisis: CrisisContext): Promise<CrisisAnalysis> {
    // Use mock data in demo mode
    if (DEMO_MODE) {
      console.log('Demo mode: Using mock crisis analysis');
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API delay
      return getMockAnalysis(crisis.description);
    }

    const systemPrompt = `You are an expert travel crisis management assistant. Your role is to analyze travel emergencies and provide clear, actionable insights.

When analyzing a crisis:
1. Identify the severity level (low, medium, high, critical)
2. List all key issues that need to be addressed
3. Identify which services are impacted (flights, hotels, transportation, etc.)
4. Determine time sensitivity and deadlines
5. Estimate realistic resolution timeframe
6. Provide clear reasoning for your assessment

Respond in JSON format with the following structure:
{
  "severity": "low|medium|high|critical",
  "keyIssues": ["issue1", "issue2", ...],
  "impactedServices": ["service1", "service2", ...],
  "timeConstraints": {
    "immediate": true|false,
    "deadline": "description or null"
  },
  "estimatedResolutionTime": "e.g., 2-4 hours",
  "reasoning": "detailed explanation"
}`;

    const prompt = `Analyze this travel crisis:

Type: ${crisis.type}
Description: ${crisis.description}
Location: ${crisis.location}
User Location: ${crisis.userLocation || 'Not specified'}

Constraints:
- Budget: $${crisis.constraints.budget}
- Timeframe: ${crisis.constraints.timeframe}
- Urgency: ${crisis.constraints.urgency}
- Preferences: ${crisis.constraints.preferences.join(', ')}

${crisis.metadata ? `Additional context: ${JSON.stringify(crisis.metadata)}` : ''}

Provide a comprehensive analysis of this crisis situation.`;

    try {
      const response = await sendMessage(prompt, systemPrompt);

      // Parse the JSON response
      const analysisData = this.parseJsonResponse(response);

      return {
        crisisType: crisis.type,
        severity: analysisData.severity,
        keyIssues: analysisData.keyIssues,
        impactedServices: analysisData.impactedServices,
        timeConstraints: analysisData.timeConstraints,
        estimatedResolutionTime: analysisData.estimatedResolutionTime,
        reasoning: analysisData.reasoning,
      };
    } catch (error) {
      console.error('Error analyzing crisis:', error);
      console.log('API failed, falling back to mock data');
      // Fallback to mock data if API fails
      return getMockAnalysis(crisis.description);
    }
  }

  /**
   * Generate multiple solution options based on crisis analysis
   * @param crisis - The original crisis context
   * @param analysis - The analysis from analyzeSituation()
   * @returns Array of possible solutions ranked by feasibility
   */
  async generateSolutions(
    crisis: CrisisContext,
    analysis: CrisisAnalysis
  ): Promise<Solution[]> {
    // Use mock data in demo mode
    if (DEMO_MODE) {
      console.log('Demo mode: Using mock solutions');
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate API delay
      return getMockSolutions(analysis.crisisType);
    }

    const systemPrompt = `You are an expert travel crisis resolution specialist. Your role is to generate practical, actionable solutions to travel emergencies.

Generate exactly 3 different solution approaches:
1. FAST: Quickest resolution (may cost more)
2. BALANCED: Good balance of time and cost
3. ECONOMICAL: Most budget-friendly (may take longer)

For each solution provide:
- Clear title and description
- Step-by-step action plan
- Estimated cost and time
- Feasibility rating (low/medium/high)
- Pros and cons

Respond in JSON format as an array of solutions.`;

    const prompt = `Based on this crisis analysis, generate 3 alternative solutions:

Crisis Type: ${crisis.type}
Description: ${crisis.description}
Severity: ${analysis.severity}
Key Issues: ${analysis.keyIssues.join(', ')}
Impacted Services: ${analysis.impactedServices.join(', ')}

Constraints:
- Budget: $${crisis.constraints.budget}
- Timeframe: ${crisis.constraints.timeframe}
- Urgency: ${crisis.constraints.urgency}

Analysis reasoning: ${analysis.reasoning}

Generate 3 distinct solutions (Fast, Balanced, Economical) in JSON array format.`;

    try {
      const response = await sendMessage(prompt, systemPrompt);

      const solutionsData = this.parseJsonResponse(response);
      const solutions: Solution[] = Array.isArray(solutionsData)
        ? solutionsData
        : [solutionsData];

      // Transform and validate solutions
      return solutions.map((sol, index) => ({
        id: `solution-${Date.now()}-${index}`,
        title: sol.title || `Solution ${index + 1}`,
        description: sol.description || '',
        steps: this.transformSteps(sol.steps || []),
        estimatedCost: sol.estimatedCost || 0,
        estimatedTime: sol.estimatedTime || 'Unknown',
        feasibility: sol.feasibility || 'medium',
        pros: sol.pros || [],
        cons: sol.cons || [],
      }));
    } catch (error) {
      console.error('Error generating solutions:', error);
      console.log('API failed, falling back to mock data');
      // Fallback to mock data if API fails
      return getMockSolutions(analysis.crisisType);
    }
  }

  /**
   * Execute a selected solution with simulated real-time updates
   * @param solution - The solution to execute
   * @param onProgress - Callback for real-time progress updates
   * @returns Execution result with completed/failed steps
   */
  async executeSolution(
    solution: Solution,
    onProgress?: (step: SolutionStep) => void
  ): Promise<ExecutionResult> {
    const completedSteps: SolutionStep[] = [];
    const failedSteps: SolutionStep[] = [];

    try {
      // Simulate execution of each step
      for (const step of solution.steps) {
        // Update step status to in_progress
        step.status = 'in_progress';
        if (onProgress) onProgress(step);

        // Simulate processing time (in real implementation, this would make actual API calls)
        await this.simulateStepExecution(step);

        // Mark as completed
        step.status = 'completed';
        completedSteps.push(step);
        if (onProgress) onProgress(step);
      }

      return {
        success: true,
        solutionId: solution.id,
        completedSteps,
        message: 'Solution executed successfully',
        nextActions: this.generateNextActions(solution),
      };
    } catch (error) {
      return {
        success: false,
        solutionId: solution.id,
        completedSteps,
        failedSteps,
        message: `Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Helper: Parse JSON from Claude's response, handling markdown code blocks
   */
  private parseJsonResponse(response: string): any {
    try {
      // Remove markdown code blocks if present
      const cleaned = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      return JSON.parse(cleaned);
    } catch (error) {
      console.error('Failed to parse JSON response:', response);
      throw new Error('Invalid JSON response from Claude');
    }
  }

  /**
   * Helper: Transform raw steps into typed SolutionStep objects
   */
  private transformSteps(rawSteps: any[]): SolutionStep[] {
    return rawSteps.map((step, index) => ({
      id: `step-${Date.now()}-${index}`,
      action: step.action || step.title || `Step ${index + 1}`,
      description: step.description || '',
      estimatedDuration: step.estimatedDuration || step.duration || '10-15 minutes',
      status: 'pending',
      dependencies: step.dependencies || [],
    }));
  }

  /**
   * Helper: Simulate step execution with realistic delays
   */
  private async simulateStepExecution(_step: SolutionStep): Promise<void> {
    // In demo mode, simulate realistic processing time
    // In a real implementation, we could use _step data to determine execution time
    const delay = Math.random() * 2000 + 1000; // 1-3 seconds
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Helper: Generate next action recommendations
   */
  private generateNextActions(_solution: Solution): string[] {
    // In a real implementation, we could customize recommendations based on solution type
    return [
      'Monitor execution status',
      'Keep emergency contacts updated',
      'Save confirmation numbers',
      'Document any changes for insurance',
    ];
  }
}

// Export singleton instance
export const crisisAgent = new CrisisManagementAgent();
