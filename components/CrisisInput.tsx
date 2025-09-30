'use client';

/**
 * CrisisInput Component
 * Main input interface for describing travel crises
 */

import { useState } from 'react';
import { AlertCircle, Send, Sparkles } from 'lucide-react';

interface CrisisInputProps {
  onSubmit: (crisis: CrisisData) => void;
  isLoading?: boolean;
}

export interface CrisisData {
  type: string;
  description: string;
  location: string;
  userLocation?: string;
  constraints: {
    budget: number;
    timeframe: string;
    urgency: 'low' | 'medium' | 'high' | 'critical';
    preferences: string[];
  };
}

const EXAMPLE_SCENARIOS = [
  {
    title: 'Flight Cancellation',
    type: 'flight_cancelled',
    description:
      'My flight FR423 to Paris just got cancelled. I have a final exam tomorrow at 2PM. Help!',
    location: 'London Heathrow',
    budget: 500,
    urgency: 'critical' as const,
  },
  {
    title: 'Typhoon Warning',
    type: 'natural_disaster',
    description:
      'Typhoon warning in Tokyo. All trains will stop at 6PM. My flight is tomorrow at 2PM.',
    location: 'Tokyo',
    budget: 800,
    urgency: 'high' as const,
  },
  {
    title: 'Lost Passport',
    type: 'lost_documents',
    description:
      'I lost my passport in Bangkok. My flight back home is in 3 days. What should I do?',
    location: 'Bangkok',
    budget: 300,
    urgency: 'high' as const,
  },
];

export function CrisisInput({ onSubmit, isLoading = false }: CrisisInputProps) {
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('1000');
  const [selectedExample, setSelectedExample] = useState<number | null>(null);

  const handleExampleClick = (index: number) => {
    const example = EXAMPLE_SCENARIOS[index];
    setDescription(example.description);
    setLocation(example.location);
    setBudget(example.budget.toString());
    setSelectedExample(index);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim() || !location.trim()) {
      alert('Please provide both a crisis description and location');
      return;
    }

    const crisisData: CrisisData = {
      type: selectedExample !== null ? EXAMPLE_SCENARIOS[selectedExample].type : 'general_emergency',
      description: description.trim(),
      location: location.trim(),
      constraints: {
        budget: parseInt(budget) || 1000,
        timeframe: '24 hours',
        urgency:
          selectedExample !== null ? EXAMPLE_SCENARIOS[selectedExample].urgency : 'medium',
        preferences: [],
      },
    };

    onSubmit(crisisData);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <AlertCircle className="w-10 h-10 text-crisis-red" />
          <h1 className="text-4xl font-bold text-gray-900">
            Travel Crisis Assistant
          </h1>
        </div>
        <p className="text-lg text-gray-600">
          Describe your travel emergency and let our AI help you resolve it
        </p>
      </div>

      {/* Example Scenarios */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-700 mb-3">
          Quick examples (click to use):
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {EXAMPLE_SCENARIOS.map((scenario, index) => (
            <button
              key={index}
              onClick={() => handleExampleClick(index)}
              disabled={isLoading}
              className={`
                p-4 rounded-lg border-2 text-left transition-all
                ${
                  selectedExample === index
                    ? 'border-solution-blue bg-blue-50'
                    : 'border-gray-200 hover:border-solution-blue bg-white'
                }
                ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="font-semibold text-gray-900 mb-1">
                {scenario.title}
              </div>
              <div className="text-xs text-gray-900 line-clamp-2">
                {scenario.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 md:p-8">
        {/* Crisis Description */}
        <div className="mb-6">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Crisis Description <span className="text-crisis-red">*</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your travel emergency in detail... What happened? Where are you? What do you need?"
            disabled={isLoading}
            rows={6}
            className="
              w-full px-4 py-3 rounded-lg border-2 border-gray-300
              focus:border-solution-blue focus:ring-2 focus:ring-solution-blue/20
              disabled:bg-gray-100 disabled:cursor-not-allowed
              transition-colors resize-none
            "
            required
          />
        </div>

        {/* Location and Budget */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Current Location <span className="text-crisis-red">*</span>
            </label>
            <input
              type="text"
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Tokyo, Paris, New York"
              disabled={isLoading}
              className="
                w-full px-4 py-3 rounded-lg border-2 border-gray-300
                focus:border-solution-blue focus:ring-2 focus:ring-solution-blue/20
                disabled:bg-gray-100 disabled:cursor-not-allowed
                transition-colors
              "
              required
            />
          </div>

          <div>
            <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-2">
              Budget (USD)
            </label>
            <input
              type="number"
              id="budget"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="1000"
              min="0"
              disabled={isLoading}
              className="
                w-full px-4 py-3 rounded-lg border-2 border-gray-300
                focus:border-solution-blue focus:ring-2 focus:ring-solution-blue/20
                disabled:bg-gray-100 disabled:cursor-not-allowed
                transition-colors
              "
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !description.trim() || !location.trim()}
          className="
            w-full py-4 px-6 rounded-lg font-semibold text-white
            bg-gradient-to-r from-solution-blue to-solution-blue-dark
            hover:from-solution-blue-dark hover:to-solution-blue
            disabled:from-gray-400 disabled:to-gray-400
            disabled:cursor-not-allowed
            transition-all duration-200
            flex items-center justify-center gap-3
            shadow-lg hover:shadow-xl
          "
        >
          {isLoading ? (
            <>
              <Sparkles className="w-5 h-5 animate-spin" />
              <span>AI is analyzing your crisis...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Get AI Assistance</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
