'use client';

import { useState } from 'react';

/**
 * Study Abroad Destination Intelligence
 *
 * Main use case: Students planning extended stays (1+ months) in foreign cities
 * need current, live information to replace outdated university fact sheets.
 *
 * Example query: "I'm studying at FGV in São Paulo for 4 months, $2000 budget,
 * love art and local food, coming from Virginia"
 */

export default function DestinationIntelligence() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // TODO: Implement destination intelligence API call
    console.log('Query:', query);

    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  const exampleQueries = [
    {
      title: "São Paulo Study Abroad",
      query: "I'm studying at FGV in São Paulo for 4 months, $2000 budget, love art and local food, coming from Virginia"
    },
    {
      title: "Barcelona Exchange",
      query: "Exchange student going to Barcelona for 5 months, €3000 budget, interested in architecture and nightlife"
    },
    {
      title: "Tokyo Semester",
      query: "Study abroad in Tokyo for 6 months, ¥500000 budget, vegetarian, love tech and anime culture"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Study Abroad Destination Intelligence
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get real-time, personalized insights for your study abroad destination.
            Current costs, cultural tips, and budget optimization powered by AI.
          </p>
        </div>

        {/* Main Input Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="destination-query"
                className="block text-sm font-semibold text-gray-700 mb-3"
              >
                Describe your study abroad plans
              </label>
              <textarea
                id="destination-query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Example: I'm studying at FGV in São Paulo for 4 months, $2000 budget, love art and local food, coming from Virginia"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all min-h-[120px] resize-none text-gray-900 placeholder-gray-400"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="w-full bg-blue-600 text-white font-semibold py-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
            >
              {loading ? 'Analyzing...' : 'Get Destination Intelligence'}
            </button>
          </form>
        </div>

        {/* Example Queries */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Try an Example
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {exampleQueries.map((example, index) => (
              <button
                key={index}
                onClick={() => setQuery(example.query)}
                className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-500 hover:shadow-lg transition-all text-left group"
                disabled={loading}
              >
                <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600">
                  {example.title}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-3">
                  {example.query}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Feature Overview */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            What You'll Get
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-bold">💰</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Real-time Cost Analysis</h3>
                <p className="text-sm text-gray-600">
                  Current flight prices, housing costs, food expenses, and currency impact
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 font-bold">🎨</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Cultural Integration</h3>
                <p className="text-sm text-gray-600">
                  Local customs, student activities, language basics, and cultural tips
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 font-bold">📊</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Budget Optimization</h3>
                <p className="text-sm text-gray-600">
                  Dynamic budget breakdown, spending recommendations, and cost predictions
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-yellow-600 font-bold">🔔</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Live Monitoring</h3>
                <p className="text-sm text-gray-600">
                  Price alerts, currency fluctuations, and seasonal cost changes
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Crisis Management Link */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Already abroad and need emergency help?{' '}
            <a
              href="/crisis"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Visit Crisis Management
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
