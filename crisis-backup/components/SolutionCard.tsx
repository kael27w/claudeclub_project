'use client';

/**
 * SolutionCard Component
 * Displays a solution option with details and selection capability
 */

import { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
} from 'lucide-react';
import type { Solution } from '@/lib/types/crisis';

interface SolutionCardProps {
  solution: Solution;
  onSelect: (solution: Solution) => void;
  isSelected?: boolean;
  isExecuting?: boolean;
}

export function SolutionCard({
  solution,
  onSelect,
  isSelected = false,
  isExecuting = false,
}: SolutionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getFeasibilityColor = (feasibility: Solution['feasibility']) => {
    switch (feasibility) {
      case 'high':
        return 'text-status-success bg-status-success/10';
      case 'medium':
        return 'text-status-warning bg-status-warning/10';
      case 'low':
        return 'text-status-error bg-status-error/10';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getFeasibilityIcon = (feasibility: Solution['feasibility']) => {
    switch (feasibility) {
      case 'high':
        return <TrendingUp className="w-4 h-4" />;
      case 'medium':
        return <TrendingUp className="w-4 h-4" />;
      case 'low':
        return <TrendingUp className="w-4 h-4" />;
    }
  };

  return (
    <div
      className={`
        bg-white rounded-xl shadow-lg transition-all duration-300
        ${isSelected ? 'ring-4 ring-solution-blue' : 'hover:shadow-xl'}
      `}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-grow">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{solution.title}</h3>
            <p className="text-gray-600 text-sm">{solution.description}</p>
          </div>

          {isSelected && (
            <CheckCircle2 className="w-6 h-6 text-solution-blue flex-shrink-0 ml-4" />
          )}
        </div>

        {/* Metrics */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          {/* Cost */}
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Estimated Cost</div>
              <div className="font-semibold text-gray-900">${solution.estimatedCost}</div>
            </div>
          </div>

          {/* Time */}
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Estimated Time</div>
              <div className="font-semibold text-gray-900">{solution.estimatedTime}</div>
            </div>
          </div>

          {/* Feasibility */}
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${getFeasibilityColor(solution.feasibility)}`}>
              {getFeasibilityIcon(solution.feasibility)}
            </div>
            <div>
              <div className="text-xs text-gray-500">Feasibility</div>
              <div className="font-semibold text-gray-900 capitalize">{solution.feasibility}</div>
            </div>
          </div>
        </div>

        {/* Pros and Cons Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="
            w-full flex items-center justify-between
            p-3 rounded-lg bg-gray-50 hover:bg-gray-100
            transition-colors text-sm font-medium text-gray-700
          "
        >
          <span>View Pros & Cons</span>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 space-y-4">
            {/* Pros */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ThumbsUp className="w-4 h-4 text-status-success" />
                <h4 className="font-semibold text-gray-900">Pros</h4>
              </div>
              <ul className="space-y-1 ml-6">
                {solution.pros.map((pro, index) => (
                  <li key={index} className="text-sm text-gray-600 list-disc">
                    {pro}
                  </li>
                ))}
              </ul>
            </div>

            {/* Cons */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ThumbsDown className="w-4 h-4 text-status-error" />
                <h4 className="font-semibold text-gray-900">Cons</h4>
              </div>
              <ul className="space-y-1 ml-6">
                {solution.cons.map((con, index) => (
                  <li key={index} className="text-sm text-gray-600 list-disc">
                    {con}
                  </li>
                ))}
              </ul>
            </div>

            {/* Steps Preview */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Steps ({solution.steps.length})
              </h4>
              <div className="space-y-2">
                {solution.steps.slice(0, 3).map((step, index) => (
                  <div key={step.id} className="flex items-start gap-2 text-sm">
                    <span className="text-solution-blue font-medium">{index + 1}.</span>
                    <span className="text-gray-600">{step.action}</span>
                  </div>
                ))}
                {solution.steps.length > 3 && (
                  <div className="text-sm text-gray-500 ml-4">
                    +{solution.steps.length - 3} more steps...
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Select Button */}
        <button
          onClick={() => onSelect(solution)}
          disabled={isExecuting}
          className={`
            mt-4 w-full py-3 px-4 rounded-lg font-semibold
            transition-all duration-200
            ${
              isSelected
                ? 'bg-solution-blue text-white'
                : 'bg-gray-100 text-gray-900 hover:bg-solution-blue hover:text-white'
            }
            ${isExecuting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {isSelected ? 'Selected Solution' : 'Select This Solution'}
        </button>
      </div>
    </div>
  );
}
