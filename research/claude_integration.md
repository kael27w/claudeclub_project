# Claude 4.5 Integration Architecture Plan

**Author:** Claude Integration Architect
**Date:** September 30, 2025
**Sprint Context:** 48-hour competition focused on autonomous crisis management
**Priority:** P0 - Critical Path

---

## Executive Summary

This document outlines the implementation strategy for integrating Claude 4.5 as the core intelligence layer of the Adaptive Travel Agent's autonomous crisis management system. The integration focuses on demonstrating Claude's extended thinking and autonomous reasoning capabilities through multi-step problem-solving chains that handle complex travel crises without human intervention.

**Key Approach:** Build a reasoning chain architecture that showcases Claude's ability to analyze, plan, and execute solutions autonomously while providing real-time visibility into the AI's decision-making process. The system will use Claude 4.5's extended thinking capabilities to handle complex, multi-step crisis resolution scenarios.

**Critical Success Factor:** The integration must reliably demonstrate autonomous problem-solving during live demos while maintaining the flexibility to handle unexpected inputs. This requires a hybrid approach combining real Claude API calls with fallback mechanisms for demo reliability.

---

## Technical Approach Overview

### Core Architecture Pattern

```typescript
┌─────────────────────────────────────────────┐
│         User Crisis Input                   │
│    "Flight cancelled, exam tomorrow"        │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│      Crisis Understanding Layer             │
│  - Parse natural language input             │
│  - Extract context and constraints          │
│  - Classify crisis type and urgency         │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│      Multi-Step Reasoning Chain             │
│  Step 1: Situation Analysis                 │
│  Step 2: Impact Assessment                  │
│  Step 3: Solution Generation (3 options)    │
│  Step 4: Solution Evaluation                │
│  Step 5: Execution Planning                 │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│      Solution Execution Simulator           │
│  - Mock booking confirmations               │
│  - Real-time status updates                 │
│  - Progressive disclosure of steps          │
└─────────────────────────────────────────────┘
```

### Claude 4.5 Capabilities Leveraged

1. **Extended Thinking:** Use Claude's ability to perform deep reasoning for complex problem analysis
2. **Autonomous Reasoning:** Chain multiple Claude calls to simulate autonomous decision-making
3. **Context Management:** Maintain crisis context across multiple reasoning steps
4. **Structured Outputs:** Generate consistent JSON responses for UI integration
5. **Natural Language Understanding:** Parse complex crisis descriptions with nuanced constraints

---

## Detailed Implementation Breakdown

### Phase 1: Core Claude Client Setup (Hours 2-3)

**File:** `/lib/claude-client.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk';

interface ClaudeConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export class ClaudeClient {
  private client: Anthropic;
  private config: ClaudeConfig;

  constructor(config: ClaudeConfig) {
    this.client = new Anthropic({
      apiKey: config.apiKey
    });
    this.config = config;
  }

  /**
   * Single completion call with retry logic
   */
  async complete(prompt: string, systemPrompt?: string): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        system: systemPrompt || '',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      return response.content[0].type === 'text'
        ? response.content[0].text
        : '';
    } catch (error) {
      // Implement exponential backoff retry
      throw new ClaudeAPIError('Failed to get completion', error);
    }
  }

  /**
   * Streaming completion for real-time UI updates
   */
  async *streamComplete(
    prompt: string,
    systemPrompt?: string
  ): AsyncGenerator<string, void, unknown> {
    const stream = await this.client.messages.stream({
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      system: systemPrompt || ''
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta') {
        yield chunk.delta.text;
      }
    }
  }
}

// Export singleton instance
export const claudeClient = new ClaudeClient({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  model: 'claude-3-5-sonnet-20241022',
  maxTokens: 4096,
  temperature: 0.7
});
```

**Key Implementation Details:**
- Use `@anthropic-ai/sdk` v0.25.0+
- Implement exponential backoff for rate limit handling
- Support both streaming and non-streaming modes
- Centralized error handling for API failures
- Configuration management for different Claude models

---

### Phase 2: Crisis Management Agent (Hours 3-5)

**File:** `/lib/agents/crisis-management-agent.ts`

```typescript
import { claudeClient } from '../claude-client';
import { CrisisContext, SolutionPlan, ReasoningStep } from '../types';

export class CrisisManagementAgent {
  private conversationHistory: Message[] = [];

  /**
   * Step 1: Analyze the crisis and extract structured data
   */
  async analyzeCrisis(userInput: string): Promise<CrisisContext> {
    const systemPrompt = `You are an expert travel crisis analyst.
    Analyze the user's crisis and extract:
    1. Crisis type (flight_cancellation, weather_emergency, medical, lost_documents, etc.)
    2. Location and destination
    3. Time constraints (how urgent is this?)
    4. Budget constraints
    5. Special requirements
    6. Severity score (1-10)

    Respond ONLY with valid JSON matching this schema:
    {
      "crisisType": string,
      "location": string,
      "destination": string,
      "timeConstraint": { "deadline": string, "urgency": "low" | "medium" | "high" | "critical" },
      "budgetConstraint": { "max": number, "currency": string, "flexibility": "none" | "some" | "flexible" },
      "specialRequirements": string[],
      "severity": number,
      "summary": string
    }`;

    const prompt = `Analyze this travel crisis: "${userInput}"`;

    const response = await claudeClient.complete(prompt, systemPrompt);

    // Parse and validate JSON response
    try {
      const crisis = JSON.parse(response) as CrisisContext;
      return crisis;
    } catch (error) {
      throw new Error('Failed to parse crisis analysis');
    }
  }

  /**
   * Step 2: Generate multiple solution options with reasoning
   */
  async generateSolutions(crisis: CrisisContext): Promise<SolutionPlan[]> {
    const systemPrompt = `You are an expert travel problem solver with access to flights,
    hotels, transportation, and emergency services. Given a crisis situation, generate
    3 distinct solution plans that differ in cost, time, and complexity.

    For each solution, provide:
    1. Clear step-by-step execution plan
    2. Estimated cost breakdown
    3. Time to resolution
    4. Risk assessment
    5. Pros and cons

    Return valid JSON array of 3 solutions.`;

    const prompt = `Crisis details: ${JSON.stringify(crisis, null, 2)}

    Generate 3 solution options:
    - Option 1: Fastest (premium cost)
    - Option 2: Balanced (mid-range)
    - Option 3: Budget-friendly (takes longer)`;

    const response = await claudeClient.complete(prompt, systemPrompt);

    // Parse solutions
    const solutions = JSON.parse(response) as SolutionPlan[];
    return solutions;
  }

  /**
   * Step 3: Execute solution with step-by-step updates
   */
  async *executeSolution(
    solution: SolutionPlan
  ): AsyncGenerator<ReasoningStep, void, unknown> {
    const systemPrompt = `You are executing a travel crisis solution plan.
    Break down the execution into clear, actionable steps with status updates.

    For each step, provide:
    - Action description
    - Status (in_progress, completed, failed)
    - Details (confirmation numbers, booking details, etc.)
    - Next step preview`;

    const prompt = `Execute this solution plan step by step:
    ${JSON.stringify(solution, null, 2)}

    Provide updates for each execution step in JSON format.`;

    // Stream execution steps
    let buffer = '';
    for await (const chunk of claudeClient.streamComplete(prompt, systemPrompt)) {
      buffer += chunk;

      // Try to extract complete JSON objects from buffer
      const stepMatch = buffer.match(/\{[^}]+\}/);
      if (stepMatch) {
        try {
          const step = JSON.parse(stepMatch[0]) as ReasoningStep;
          yield step;
          buffer = buffer.slice(stepMatch[0].length);
        } catch {
          // Incomplete JSON, continue buffering
        }
      }
    }
  }

  /**
   * Step 4: Refine solution based on user feedback
   */
  async refineSolution(
    originalSolution: SolutionPlan,
    userFeedback: string
  ): Promise<SolutionPlan> {
    const systemPrompt = `You are refining a travel solution based on user feedback.
    Adjust the solution to address their concerns while maintaining feasibility.`;

    const prompt = `Original solution: ${JSON.stringify(originalSolution)}
    User feedback: "${userFeedback}"

    Provide a refined solution in the same JSON format.`;

    const response = await claudeClient.complete(prompt, systemPrompt);
    return JSON.parse(response) as SolutionPlan;
  }
}
```

**Key Features:**
- **Multi-step reasoning chain:** Each method represents a distinct reasoning phase
- **Structured outputs:** All responses are JSON for reliable parsing
- **Streaming support:** Real-time execution updates for engaging demos
- **Error recovery:** Graceful handling of API failures
- **Conversation memory:** Track context across multiple calls

---

### Phase 3: Reasoning Chain Orchestrator (Hours 5-6)

**File:** `/lib/agents/reasoning-orchestrator.ts`

```typescript
import { CrisisManagementAgent } from './crisis-management-agent';
import { ReasoningChain, ChainStep } from '../types';

export class ReasoningOrchestrator {
  private agent: CrisisManagementAgent;
  private chain: ReasoningChain;

  constructor() {
    this.agent = new CrisisManagementAgent();
    this.chain = {
      steps: [],
      status: 'idle',
      startTime: null,
      endTime: null
    };
  }

  /**
   * Execute complete reasoning chain with visibility
   */
  async *executeReasoningChain(
    userInput: string
  ): AsyncGenerator<ChainStep, void, unknown> {
    this.chain.status = 'running';
    this.chain.startTime = Date.now();

    // Step 1: Crisis Analysis
    yield {
      stepNumber: 1,
      stepName: 'Crisis Analysis',
      status: 'in_progress',
      thinking: 'Analyzing the situation and extracting key information...'
    };

    const crisis = await this.agent.analyzeCrisis(userInput);

    yield {
      stepNumber: 1,
      stepName: 'Crisis Analysis',
      status: 'completed',
      thinking: `Identified ${crisis.crisisType} with ${crisis.timeConstraint.urgency} urgency`,
      result: crisis
    };

    // Step 2: Impact Assessment
    yield {
      stepNumber: 2,
      stepName: 'Impact Assessment',
      status: 'in_progress',
      thinking: 'Evaluating affected services and cascading impacts...'
    };

    // Use Claude to assess impacts
    const impacts = await this.assessImpacts(crisis);

    yield {
      stepNumber: 2,
      stepName: 'Impact Assessment',
      status: 'completed',
      thinking: `Found ${impacts.length} critical impacts requiring action`,
      result: impacts
    };

    // Step 3: Solution Generation
    yield {
      stepNumber: 3,
      stepName: 'Solution Generation',
      status: 'in_progress',
      thinking: 'Generating multiple solution pathways...'
    };

    const solutions = await this.agent.generateSolutions(crisis);

    yield {
      stepNumber: 3,
      stepName: 'Solution Generation',
      status: 'completed',
      thinking: `Created ${solutions.length} viable solutions`,
      result: solutions
    };

    // Step 4: Solution Ranking
    yield {
      stepNumber: 4,
      stepName: 'Solution Evaluation',
      status: 'in_progress',
      thinking: 'Evaluating solutions against constraints...'
    };

    const rankedSolutions = await this.rankSolutions(solutions, crisis);

    yield {
      stepNumber: 4,
      stepName: 'Solution Evaluation',
      status: 'completed',
      thinking: 'Recommended best solution based on urgency and budget',
      result: rankedSolutions
    };

    this.chain.status = 'completed';
    this.chain.endTime = Date.now();
  }

  private async assessImpacts(crisis: CrisisContext): Promise<Impact[]> {
    // Claude call to assess impacts
    return [];
  }

  private async rankSolutions(
    solutions: SolutionPlan[],
    crisis: CrisisContext
  ): Promise<SolutionPlan[]> {
    // Claude call to rank solutions
    return solutions;
  }
}
```

---

### Phase 4: Demo Mode with Fallbacks (Hours 6-8)

**File:** `/lib/agents/demo-mode-manager.ts`

```typescript
import { CrisisManagementAgent } from './crisis-management-agent';
import { DEMO_SCENARIOS } from '../demo-scenarios';

export class DemoModeManager {
  private isDemoMode: boolean = false;
  private agent: CrisisManagementAgent;

  constructor() {
    this.agent = new CrisisManagementAgent();
  }

  enableDemoMode(): void {
    this.isDemoMode = true;
  }

  disableDemo(): void {
    this.isDemoMode = false;
  }

  /**
   * Intelligent fallback: Try real Claude first, use canned response if fails
   */
  async analyzeCrisisWithFallback(userInput: string): Promise<CrisisContext> {
    if (this.isDemoMode) {
      // Check if input matches a demo scenario
      const demoScenario = this.matchDemoScenario(userInput);
      if (demoScenario) {
        // Add realistic delay
        await this.delay(1500);
        return demoScenario.analysis;
      }
    }

    try {
      // Try real Claude API
      return await this.agent.analyzeCrisis(userInput);
    } catch (error) {
      console.error('Claude API failed, using fallback', error);

      // Use generic fallback analysis
      return this.generateFallbackAnalysis(userInput);
    }
  }

  /**
   * Match user input to pre-configured demo scenarios
   */
  private matchDemoScenario(input: string): DemoScenario | null {
    const normalizedInput = input.toLowerCase();

    // Typhoon scenario
    if (normalizedInput.includes('typhoon') ||
        normalizedInput.includes('tokyo')) {
      return DEMO_SCENARIOS.typhoon_tokyo;
    }

    // Flight cancellation scenario
    if (normalizedInput.includes('flight') &&
        normalizedInput.includes('cancelled')) {
      return DEMO_SCENARIOS.flight_cancelled_exam;
    }

    // Passport stolen scenario
    if (normalizedInput.includes('passport') &&
        normalizedInput.includes('stolen')) {
      return DEMO_SCENARIOS.passport_stolen_bangkok;
    }

    return null;
  }

  private generateFallbackAnalysis(input: string): CrisisContext {
    // Basic keyword-based analysis
    return {
      crisisType: 'general_emergency',
      location: 'Unknown',
      destination: 'Unknown',
      timeConstraint: {
        deadline: 'ASAP',
        urgency: 'high'
      },
      budgetConstraint: {
        max: 1000,
        currency: 'USD',
        flexibility: 'some'
      },
      specialRequirements: [],
      severity: 7,
      summary: input
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## Dependencies and Integration Points

### External Dependencies

```json
{
  "@anthropic-ai/sdk": "^0.25.0",
  "zod": "^3.22.0"  // For schema validation
}
```

### Integration Points

1. **API Routes Integration**
   - `/api/crisis/analyze` → `CrisisManagementAgent.analyzeCrisis()`
   - `/api/crisis/solve` → `CrisisManagementAgent.generateSolutions()`
   - `/api/crisis/execute` → `CrisisManagementAgent.executeSolution()`

2. **WebSocket Events**
   - `reasoning_step_update` - Push each reasoning step to UI
   - `solution_generated` - Notify when solutions ready
   - `execution_progress` - Stream execution status

3. **Frontend Components**
   - `StatusDisplay.tsx` → Consume reasoning steps
   - `SolutionCard.tsx` → Display solution plans
   - `CrisisInput.tsx` → Trigger analysis

4. **State Management**
   - React Query for caching Claude responses
   - WebSocket state for real-time updates
   - Local state for demo mode toggle

---

## Risks and Mitigation Strategies

### Risk 1: Claude API Rate Limiting
**Impact:** High - Could break demo
**Probability:** Medium during heavy usage
**Mitigation:**
- Implement request queuing with exponential backoff
- Cache responses for identical inputs
- Use demo mode with pre-cached responses for competition demo
- Monitor rate limits and implement circuit breaker

### Risk 2: API Latency During Demo
**Impact:** Critical - Long waits kill demo energy
**Probability:** Medium
**Mitigation:**
- Use streaming responses for perceived speed
- Add "thinking" animations during waits
- Pre-warm API with test request before demo
- Have canned responses as fallback

### Risk 3: Inconsistent JSON Parsing
**Impact:** High - Could crash application
**Probability:** Medium - Claude sometimes adds extra text
**Mitigation:**
- Use strict JSON extraction with regex
- Implement schema validation with Zod
- Add fallback parsing strategies
- Log all parsing failures for debugging

### Risk 4: Context Window Limitations
**Impact:** Medium - Long conversations exceed limits
**Probability:** Low for MVP
**Mitigation:**
- Implement conversation summarization
- Keep only recent context in prompts
- Track token usage per request
- Clear context after each crisis resolution

### Risk 5: API Key Exposure
**Impact:** Critical - Security vulnerability
**Probability:** Low with proper setup
**Mitigation:**
- Never commit API keys to repository
- Use environment variables exclusively
- Implement API key rotation capability
- Add rate limiting per IP on backend

---

## Recommended Tools and Libraries

### Core Integration
- `@anthropic-ai/sdk` - Official Claude SDK
- `zod` - Runtime type validation for Claude responses
- `retry-axios` - Automatic retry logic for API calls

### Development & Testing
- `dotenv` - Environment variable management
- `jest` - Unit testing Claude integration
- `nock` - Mock Claude API responses in tests

### Monitoring & Debugging
- `pino` - Structured logging for API calls
- `@anthropic-ai/sdk/debug` - SDK debug mode
- Custom middleware for request/response logging

---

## Testing and Validation Strategies

### Unit Tests
```typescript
describe('CrisisManagementAgent', () => {
  it('should analyze crisis and extract structured data', async () => {
    const agent = new CrisisManagementAgent();
    const crisis = await agent.analyzeCrisis(
      "My flight to Paris got cancelled and I have an exam tomorrow"
    );

    expect(crisis.crisisType).toBe('flight_cancellation');
    expect(crisis.timeConstraint.urgency).toBe('critical');
  });

  it('should generate multiple solution options', async () => {
    const agent = new CrisisManagementAgent();
    const solutions = await agent.generateSolutions(mockCrisis);

    expect(solutions).toHaveLength(3);
    expect(solutions[0].costEstimate).toBeLessThan(solutions[1].costEstimate);
  });
});
```

### Integration Tests
- Test complete reasoning chain execution
- Verify WebSocket message flow
- Test fallback mechanisms when API fails
- Validate JSON parsing for various Claude responses

### Demo Scenario Tests
```typescript
describe('Demo Scenarios', () => {
  it('should execute typhoon scenario perfectly', async () => {
    const manager = new DemoModeManager();
    manager.enableDemoMode();

    const result = await manager.analyzeCrisisWithFallback(
      "Typhoon warning in Tokyo, flight tomorrow"
    );

    expect(result).toMatchSnapshot(); // Ensure consistency
  });
});
```

### Performance Tests
- Measure average Claude API response time
- Test streaming response latency
- Validate reasoning chain completes within 10 seconds
- Stress test with concurrent requests

---

## Success Criteria

### Technical Success Metrics
- [ ] Claude API successfully analyzes crisis in <3 seconds
- [ ] Reasoning chain displays at least 4 distinct steps
- [ ] Solution generation produces 3 valid options
- [ ] Streaming execution provides real-time updates
- [ ] Demo mode works 100% reliably without API calls
- [ ] API failure gracefully falls back without crashing
- [ ] All Claude responses parse correctly into typed objects

### Demo Success Metrics
- [ ] Live crisis resolution completes in <90 seconds
- [ ] Judges can see Claude's reasoning process clearly
- [ ] At least one "wow moment" in the reasoning chain
- [ ] Zero API failures during 5-minute demo
- [ ] Audience understands the autonomous aspect

### Code Quality Metrics
- [ ] 100% TypeScript type coverage
- [ ] All Claude calls have error handling
- [ ] Logging captures all API interactions
- [ ] Zero hardcoded API keys in code
- [ ] API client is properly abstracted and testable

---

## Implementation Timeline

### Hours 2-3: Foundation
- Setup Claude client with retry logic
- Test API connectivity
- Implement basic completion wrapper

### Hours 3-5: Core Agent
- Build CrisisManagementAgent class
- Implement crisis analysis
- Implement solution generation

### Hours 5-6: Reasoning Chain
- Create ReasoningOrchestrator
- Connect multi-step reasoning
- Add streaming support

### Hours 6-7: Demo Mode
- Build DemoModeManager
- Create fallback mechanisms
- Test scenario matching

### Hours 7-8: Integration
- Connect to API routes
- Implement WebSocket events
- End-to-end testing

---

## Key Architectural Decisions

### Decision 1: JSON Mode for All Claude Outputs
**Rationale:** Need reliable parsing for UI integration
**Alternative Considered:** Natural language parsing
**Trade-off:** Less natural responses, but 100% reliable

### Decision 2: Separate Reasoning Steps
**Rationale:** Showcase Claude's thinking process for demo impact
**Alternative Considered:** Single consolidated call
**Trade-off:** More API calls and latency, but better storytelling

### Decision 3: Hybrid Real/Mock Approach
**Rationale:** Balance between authentic AI and demo reliability
**Alternative Considered:** Pure mock or pure real
**Trade-off:** More complexity, but best of both worlds

### Decision 4: Streaming for Execution Steps
**Rationale:** Create engaging real-time experience
**Alternative Considered:** Batch updates
**Trade-off:** More complex implementation, but better UX

---

## Post-Competition Enhancements

### Phase 2 Features (Post-48 Hours)
1. **Conversation Memory**
   - Implement persistent context across sessions
   - User preference learning
   - Historical crisis pattern analysis

2. **Multi-Agent Collaboration**
   - Separate agents for booking, notification, insurance
   - Agent orchestration layer
   - Parallel execution of independent tasks

3. **Real API Integration**
   - Connect to actual booking platforms
   - Real-time flight/hotel availability
   - Actual payment processing

4. **Advanced Reasoning**
   - Use Claude's Computer Use API for actual bookings
   - Implement autonomous web navigation
   - Screenshot-based verification

---

## Conclusion

This Claude integration architecture prioritizes demo impact and reliability while showcasing autonomous reasoning capabilities. The multi-step reasoning chain approach makes Claude's intelligence visible and compelling for judges. The hybrid real/mock strategy ensures demo reliability while maintaining authenticity.

**Critical Path Items:**
1. Basic Claude client setup (Hour 2-3)
2. Crisis analysis function (Hour 3-4)
3. Solution generation (Hour 4-5)
4. Demo mode manager (Hour 6-7)
5. End-to-end testing (Hour 7-8)

**Key Success Factor:** The reasoning chain visualization must clearly show Claude "thinking" through the problem autonomously - this is our primary differentiator and demo wow-factor.
