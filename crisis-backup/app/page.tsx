'use client';

/**
 * Main Page - Crisis Management Interface
 * Integrates all components for the full crisis resolution flow
 */

import { useState } from 'react';
import { CrisisInput, type CrisisData } from '@/components/CrisisInput';
import { StatusDisplay } from '@/components/StatusDisplay';
import { SolutionCard } from '@/components/SolutionCard';
import type { CrisisAnalysis, Solution, SolutionStep } from '@/lib/types/crisis';

type AppState = 'input' | 'analyzing' | 'solutions' | 'executing' | 'complete';

export default function Home() {
  const [state, setState] = useState<AppState>('input');
  const [analysis, setAnalysis] = useState<CrisisAnalysis | null>(null);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [selectedSolution, setSelectedSolution] = useState<Solution | null>(null);
  const [executionSteps, setExecutionSteps] = useState<SolutionStep[]>([]);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle crisis submission and analysis
   */
  const handleCrisisSubmit = async (crisis: CrisisData) => {
    try {
      setState('analyzing');
      setError(null);

      // Call analyze API
      const analyzeResponse = await fetch('/api/crisis/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(crisis),
      });

      if (!analyzeResponse.ok) {
        throw new Error('Failed to analyze crisis');
      }

      const analyzeData = await analyzeResponse.json();

      if (!analyzeData.success) {
        throw new Error(analyzeData.error || 'Analysis failed');
      }

      setAnalysis(analyzeData.data);

      // Automatically generate solutions after analysis
      await generateSolutions(crisis, analyzeData.data);
    } catch (err) {
      console.error('Crisis submission error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setState('input');
    }
  };

  /**
   * Generate solutions based on analysis
   */
  const generateSolutions = async (crisis: CrisisData, analysisData: CrisisAnalysis) => {
    try {
      // Call solve API
      const solveResponse = await fetch('/api/crisis/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crisis,
          analysis: analysisData,
        }),
      });

      if (!solveResponse.ok) {
        throw new Error('Failed to generate solutions');
      }

      const solveData = await solveResponse.json();

      if (!solveData.success) {
        throw new Error(solveData.error || 'Solution generation failed');
      }

      setSolutions(solveData.data.solutions);
      setState('solutions');
    } catch (err) {
      console.error('Solution generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate solutions');
      setState('input');
    }
  };

  /**
   * Handle solution selection and execution
   */
  const handleSolutionSelect = async (solution: Solution) => {
    try {
      setSelectedSolution(solution);
      setState('executing');
      setExecutionSteps(solution.steps);
      setError(null);

      // Call status API to execute
      const statusResponse = await fetch('/api/crisis/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solution }),
      });

      if (!statusResponse.ok) {
        throw new Error('Failed to execute solution');
      }

      const statusData = await statusResponse.json();

      if (!statusData.success) {
        throw new Error(statusData.error || 'Execution failed');
      }

      // Update steps with execution results
      setExecutionSteps(statusData.data.completedSteps);
      setState('complete');
    } catch (err) {
      console.error('Solution execution error:', err);
      setError(err instanceof Error ? err.message : 'Execution failed');
      setState('solutions');
    }
  };

  /**
   * Reset to start over
   */
  const handleReset = () => {
    setState('input');
    setAnalysis(null);
    setSolutions([]);
    setSelectedSolution(null);
    setExecutionSteps([]);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Error Display */}
        {error && (
          <div className="max-w-4xl mx-auto mb-6 p-4 bg-crisis-red/10 border-2 border-crisis-red rounded-lg">
            <p className="text-crisis-red font-medium">{error}</p>
          </div>
        )}

        {/* Crisis Input Stage */}
        {state === 'input' && (
          <CrisisInput
            onSubmit={handleCrisisSubmit}
            isLoading={false}
          />
        )}

        {/* Analyzing Stage */}
        {state === 'analyzing' && (
          <div className="max-w-4xl mx-auto">
            <CrisisInput
              onSubmit={handleCrisisSubmit}
              isLoading={true}
            />
            <div className="mt-8 text-center">
              <div className="animate-pulse">
                <div className="text-solution-blue text-xl font-semibold mb-2">
                  Claude AI is analyzing your crisis...
                </div>
                <p className="text-gray-600">
                  Identifying key issues, impacted services, and time constraints
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Solutions Stage */}
        {state === 'solutions' && analysis && (
          <div className="space-y-8">
            {/* Analysis Summary */}
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Crisis Analysis</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Severity</div>
                  <div className="font-semibold text-gray-900 capitalize">{analysis.severity}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Resolution Time</div>
                  <div className="font-semibold text-gray-900">{analysis.estimatedResolutionTime}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Key Issues</div>
                  <div className="font-semibold text-gray-900">{analysis.keyIssues.length}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Services Impacted</div>
                  <div className="font-semibold text-gray-900">{analysis.impactedServices.length}</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-700">{analysis.reasoning}</p>
              </div>
            </div>

            {/* Solutions Grid */}
            <div className="max-w-7xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
                Recommended Solutions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {solutions.map((solution) => (
                  <SolutionCard
                    key={solution.id}
                    solution={solution}
                    onSelect={handleSolutionSelect}
                    isSelected={selectedSolution?.id === solution.id}
                    isExecuting={false}
                  />
                ))}
              </div>

              {/* Reset Button */}
              <div className="mt-8 text-center">
                <button
                  onClick={handleReset}
                  className="px-6 py-3 text-gray-700 bg-white rounded-lg border-2 border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Start Over
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Executing Stage */}
        {(state === 'executing' || state === 'complete') && executionSteps.length > 0 && (
          <div className="space-y-8">
            <StatusDisplay
              steps={executionSteps}
              isActive={state === 'executing'}
              title={state === 'executing' ? 'Executing Solution' : 'Resolution Complete'}
            />

            {state === 'complete' && (
              <div className="max-w-4xl mx-auto text-center">
                <button
                  onClick={handleReset}
                  className="px-8 py-4 text-white bg-solution-blue rounded-lg font-semibold hover:bg-solution-blue-dark transition-colors shadow-lg"
                >
                  Handle Another Crisis
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
