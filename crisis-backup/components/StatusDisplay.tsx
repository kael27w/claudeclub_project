'use client';

/**
 * StatusDisplay Component
 * Shows real-time status updates during crisis resolution
 */

import { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Clock, Loader2 } from 'lucide-react';
import type { SolutionStep } from '@/lib/types/crisis';

interface StatusDisplayProps {
  steps: SolutionStep[];
  isActive: boolean;
  title?: string;
}

export function StatusDisplay({ steps, isActive, title = 'Resolution in Progress' }: StatusDisplayProps) {
  const [displayedSteps, setDisplayedSteps] = useState<SolutionStep[]>([]);

  useEffect(() => {
    setDisplayedSteps(steps);
  }, [steps]);

  const getStepIcon = (status: SolutionStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-status-success" />;
      case 'in_progress':
        return <Loader2 className="w-5 h-5 text-solution-blue animate-spin" />;
      case 'failed':
        return <Circle className="w-5 h-5 text-status-error" />;
      default:
        return <Circle className="w-5 h-5 text-gray-300" />;
    }
  };

  const getStepStatusColor = (status: SolutionStep['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-status-success/10 border-status-success';
      case 'in_progress':
        return 'bg-solution-blue/10 border-solution-blue';
      case 'failed':
        return 'bg-status-error/10 border-status-error';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (!isActive && displayedSteps.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          {isActive ? (
            <Loader2 className="w-6 h-6 text-solution-blue animate-spin" />
          ) : (
            <CheckCircle2 className="w-6 h-6 text-status-success" />
          )}
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        </div>

        {/* Progress Steps */}
        <div className="space-y-4">
          {displayedSteps.map((step, index) => (
            <div
              key={step.id}
              className={`
                relative p-4 rounded-lg border-2 transition-all duration-300
                ${getStepStatusColor(step.status)}
              `}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getStepIcon(step.status)}
                </div>

                {/* Content */}
                <div className="flex-grow">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {step.action}
                      </h3>
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 whitespace-nowrap">
                      <Clock className="w-4 h-4" />
                      {step.estimatedDuration}
                    </div>
                  </div>

                  {/* Status Badge */}
                  {step.status === 'in_progress' && (
                    <div className="mt-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-grow bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div className="bg-solution-blue h-full animate-pulse-slow w-2/3"></div>
                        </div>
                        <span className="text-xs text-solution-blue font-medium">
                          In Progress
                        </span>
                      </div>
                    </div>
                  )}

                  {step.status === 'completed' && (
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-1 text-xs text-status-success font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        Completed
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Connection Line */}
              {index < displayedSteps.length - 1 && (
                <div className="absolute left-8 top-full w-0.5 h-4 bg-gray-200"></div>
              )}
            </div>
          ))}
        </div>

        {/* Overall Progress */}
        {isActive && (
          <div className="mt-6 p-4 bg-solution-blue/5 rounded-lg">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-solution-blue animate-spin" />
              <span className="text-sm text-gray-700">
                AI is working on your crisis resolution...
              </span>
            </div>
          </div>
        )}

        {!isActive && displayedSteps.every((s) => s.status === 'completed') && (
          <div className="mt-6 p-4 bg-status-success/10 rounded-lg border-2 border-status-success">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-status-success" />
              <span className="text-sm text-gray-700 font-medium">
                Resolution complete! All steps have been executed successfully.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
