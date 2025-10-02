'use client';

/**
 * Crisis Management Page
 * Provides emergency assistance for students already abroad facing urgent issues
 * 
 * Examples:
 * - Lost passport
 * - Medical emergencies
 * - Housing issues
 * - Financial problems
 * - Safety concerns
 */

import { useState } from 'react';
import { CrisisInput, type CrisisData } from '@/components/CrisisInput';
import { StatusDisplay } from '@/components/StatusDisplay';
import { SolutionCard } from '@/components/SolutionCard';
import type { CrisisAnalysis, Solution, SolutionStep } from '@/lib/types/crisis';
import Link from 'next/link';

type AppState = 'input' | 'analyzing' | 'solutions' | 'executing' | 'complete';

export default function CrisisManagement() {
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
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-orange-50">
      {/* Header with Navigation */}
      <div className="bg-white border-b border-red-100 shadow-sm">
        <div className="container mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-red-600">🚨 Crisis Management</h1>
              <p className="text-sm text-gray-600">Emergency assistance for students abroad</p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium hover:bg-blue-50 rounded-lg transition-colors"
            >
              ← Back to Destination Planning
            </Link>
          </div>
        </div>
      </div>

      <main className="py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Error Display */}
          {error && (
            <div className="max-w-4xl mx-auto mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
              <div className="flex items-start">
                <span className="text-2xl mr-3">⚠️</span>
                <div>
                  <p className="text-red-800 font-semibold mb-1">Error</p>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Crisis Input Stage */}
          {state === 'input' && (
            <div className="space-y-6">
              {/* Info Banner */}
              <div className="max-w-4xl mx-auto bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                <h2 className="text-xl font-bold text-blue-900 mb-2">How Crisis Management Works</h2>
                <div className="text-blue-800 space-y-2">
                  <p>1. <strong>Describe your emergency</strong> - Be specific about what happened</p>
                  <p>2. <strong>AI analyzes</strong> - Claude evaluates severity and urgency</p>
                  <p>3. <strong>Get solutions</strong> - Receive multiple actionable plans</p>
                  <p>4. <strong>Execute steps</strong> - Follow guided resolution process</p>
                </div>
              </div>

              <CrisisInput
                onSubmit={handleCrisisSubmit}
                isLoading={false}
              />
            </div>
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
                  <div className="text-blue-600 text-xl font-semibold mb-2">
                    🤖 Claude AI is analyzing your crisis...
                  </div>
                  <p className="text-gray-600">
                    Identifying key issues, impacted services, and time constraints
                  </p>
                  <div className="mt-4 flex justify-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Solutions Stage */}
          {state === 'solutions' && analysis && (
            <div className="space-y-8">
              {/* Analysis Summary */}
              <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                <div className="flex items-start mb-4">
                  <span className="text-3xl mr-3">📋</span>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Crisis Analysis</h2>
                    <p className="text-gray-600">Claude has evaluated your situation</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Severity</div>
                    <div className={`font-bold text-lg capitalize ${
                      analysis.severity === 'critical' ? 'text-red-600' :
                      analysis.severity === 'high' ? 'text-orange-600' :
                      analysis.severity === 'medium' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {analysis.severity}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Resolution Time</div>
                    <div className="font-bold text-lg text-gray-900">{analysis.estimatedResolutionTime}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Key Issues</div>
                    <div className="font-bold text-lg text-gray-900">{analysis.keyIssues.length}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Services Impacted</div>
                    <div className="font-bold text-lg text-gray-900">{analysis.impactedServices.length}</div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-gray-700 leading-relaxed">{analysis.reasoning}</p>
                </div>
              </div>

              {/* Solutions Grid */}
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Recommended Solutions
                  </h2>
                  <p className="text-gray-600">Select the approach that works best for your situation</p>
                </div>
                
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
                    className="px-6 py-3 text-gray-700 bg-white rounded-lg border-2 border-gray-300 hover:bg-gray-50 transition-colors font-medium"
                  >
                    ← Start Over
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
                title={state === 'executing' ? '⚙️ Executing Solution' : '✅ Resolution Complete'}
              />

              {state === 'complete' && (
                <div className="max-w-4xl mx-auto">
                  <div className="bg-green-50 border-2 border-green-300 rounded-xl p-8 text-center mb-6">
                    <div className="text-5xl mb-4">🎉</div>
                    <h3 className="text-2xl font-bold text-green-900 mb-2">Crisis Resolved!</h3>
                    <p className="text-green-800">
                      All steps have been completed. We hope your situation is now under control.
                    </p>
                  </div>
                  
                  <div className="text-center space-x-4">
                    <button
                      onClick={handleReset}
                      className="px-8 py-4 text-white bg-blue-600 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
                    >
                      Handle Another Crisis
                    </button>
                    <Link
                      href="/"
                      className="inline-block px-8 py-4 text-blue-600 bg-white border-2 border-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                    >
                      Return to Destination Planning
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
