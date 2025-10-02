'use client';

import { useState } from 'react';
import type { DestinationIntelligence } from '@/lib/types/destination';
import RedditInsights from '@/components/RedditInsights';
import YouTubeVideos from '@/components/YouTubeVideos';
import NewsAlerts from '@/components/NewsAlerts';
import CurrencyWidget from '@/components/CurrencyWidget';
import LoadingSkeleton from '@/components/LoadingSkeleton';

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
  const [intelligence, setIntelligence] = useState<DestinationIntelligence | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/destination/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to analyze destination');
      }

      setIntelligence(data.data);
    } catch (err) {
      console.error('Error analyzing destination:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze destination');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setIntelligence(null);
    setError(null);
    setQuery('');
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

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">
                <strong>Error:</strong> {error}
              </p>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="mb-8 space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Analyzing Your Destination...
              </h3>
              <p className="text-gray-600 mb-6">
                Gathering live data from multiple sources including flight prices, housing costs, community insights, and safety alerts
              </p>
              <div className="max-w-2xl mx-auto space-y-3">
                <LoadingSkeleton type="card" count={1} />
                <LoadingSkeleton type="text" count={3} />
              </div>
            </div>
          </div>
        )}

        {/* Results Display */}
        {intelligence && !loading && (
          <div className="mb-8 space-y-6">
            {/* Summary */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-3xl font-bold text-gray-900">
                  {intelligence.query.city}, {intelligence.query.country}
                </h2>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-all"
                >
                  New Search
                </button>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {intelligence.summary}
              </p>
            </div>

            {/* Cost Analysis */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-3xl mr-3">💰</span>
                Cost Analysis
              </h3>

              {/* Flights */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">✈️ Flights</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Current Price</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {intelligence.costAnalysis.flights.currentPrice.currency} ${intelligence.costAnalysis.flights.currentPrice.amount}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {intelligence.costAnalysis.flights.currentPrice.route}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Price Range</p>
                    <p className="text-lg font-semibold text-gray-900">
                      ${intelligence.costAnalysis.flights.priceRange.min} - ${intelligence.costAnalysis.flights.priceRange.max}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Trend: <span className="capitalize">{intelligence.costAnalysis.flights.trend}</span>
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-700">
                  <strong>Recommendation:</strong> {intelligence.costAnalysis.flights.bookingRecommendation}
                </p>
              </div>

              {/* Housing */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">🏠 Housing Options</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm font-semibold text-gray-700">Student Housing</p>
                    <p className="text-xl font-bold text-green-600">
                      ${intelligence.costAnalysis.housing.studentHousing.monthly.average}/mo
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      ${intelligence.costAnalysis.housing.studentHousing.monthly.min} - ${intelligence.costAnalysis.housing.studentHousing.monthly.max}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm font-semibold text-gray-700">Airbnb</p>
                    <p className="text-xl font-bold text-purple-600">
                      ${intelligence.costAnalysis.housing.airbnb.monthly.average}/mo
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      ${intelligence.costAnalysis.housing.airbnb.monthly.min} - ${intelligence.costAnalysis.housing.airbnb.monthly.max}
                    </p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm font-semibold text-gray-700">Apartments</p>
                    <p className="text-xl font-bold text-yellow-600">
                      ${intelligence.costAnalysis.housing.apartments.monthly.average}/mo
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      ${intelligence.costAnalysis.housing.apartments.monthly.min} - ${intelligence.costAnalysis.housing.apartments.monthly.max}
                    </p>
                  </div>
                </div>
              </div>

              {/* Living Costs */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">📊 Monthly Living Costs</h4>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-gray-700">🍽️ Food</span>
                    <span className="font-semibold text-gray-900">
                      ${intelligence.costAnalysis.livingCosts.food.monthly.average}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-gray-700">🚇 Transport</span>
                    <span className="font-semibold text-gray-900">
                      ${intelligence.costAnalysis.livingCosts.transport.monthly.average}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-gray-700">🎭 Entertainment</span>
                    <span className="font-semibold text-gray-900">
                      ${intelligence.costAnalysis.livingCosts.entertainment.monthly.average}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-gray-700">💡 Utilities</span>
                    <span className="font-semibold text-gray-900">
                      ${intelligence.costAnalysis.livingCosts.utilities.monthly.average}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Budget Plan */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-3xl mr-3">📊</span>
                Budget Optimization
              </h3>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Budget</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {intelligence.query.currency} ${intelligence.budgetPlan.totalBudget}
                    </p>
                    <p className="text-sm text-gray-500">
                      for {intelligence.budgetPlan.duration} months
                    </p>
                  </div>
                  <div className={`px-4 py-2 rounded-lg font-semibold ${
                    intelligence.budgetPlan.feasibility === 'comfortable' ? 'bg-green-100 text-green-800' :
                    intelligence.budgetPlan.feasibility === 'tight' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {intelligence.budgetPlan.feasibility ?
                      intelligence.budgetPlan.feasibility.charAt(0).toUpperCase() + intelligence.budgetPlan.feasibility.slice(1) :
                      'Unknown'}
                  </div>
                </div>

                {/* Budget Breakdown */}
                <div className="space-y-3">
                  {Object.entries(intelligence.budgetPlan.breakdown).map(([category, data]) => (
                    <div key={category} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-gray-700 capitalize">{category}</span>
                        <span className="text-gray-900 font-bold">${data.amount} ({data.percentage}%)</span>
                      </div>
                      <p className="text-sm text-gray-600">{data.recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Saving Tips */}
              <div className="mt-6 bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">💡 Saving Tips</h4>
                <ul className="space-y-1">
                  {intelligence.budgetPlan.savingTips.slice(0, 5).map((tip, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start">
                      <span className="text-green-600 mr-2">✓</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Cultural Guide */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-3xl mr-3">🎨</span>
                Cultural Guide
              </h3>

              {/* Essential Phrases */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">🗣️ Essential Phrases</h4>
                <div className="grid md:grid-cols-2 gap-3">
                  {intelligence.culturalGuide.language.essentialPhrases.slice(0, 6).map((phrase, index) => (
                    <div key={index} className="bg-purple-50 p-3 rounded-lg">
                      <p className="font-semibold text-gray-900">{phrase.phrase}</p>
                      <p className="text-sm text-gray-600">{phrase.translation}</p>
                      <p className="text-xs text-purple-600">{phrase.pronunciation}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safety */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">🛡️ Safety</h4>
                <div className="flex items-center mb-3">
                  <span className="text-sm text-gray-600 mr-3">Overall Safety Rating:</span>
                  <div className="flex">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <span key={i} className={i < intelligence.culturalGuide.safety.overallRating ? 'text-yellow-500' : 'text-gray-300'}>
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="ml-2 font-bold">{intelligence.culturalGuide.safety.overallRating}/10</span>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-green-700 mb-2">✓ Safe Neighborhoods</p>
                    <ul className="space-y-1">
                      {intelligence.culturalGuide.safety.safeNeighborhoods.slice(0, 3).map((area, index) => (
                        <li key={index} className="text-sm text-gray-700">{area}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-700 mb-2">⚠️ Areas to Avoid</p>
                    <ul className="space-y-1">
                      {intelligence.culturalGuide.safety.areasToAvoid.slice(0, 3).map((area, index) => (
                        <li key={index} className="text-sm text-gray-700">{area}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">🎯 Based on Your Interests</h4>
                {intelligence.recommendations.basedOnInterests.map((item, index) => (
                  <div key={index} className="mb-4">
                    <p className="text-sm font-semibold text-blue-600 capitalize mb-2">{item.interest}</p>
                    <ul className="space-y-1">
                      {item.recommendations.slice(0, 3).map((rec, i) => (
                        <li key={i} className="text-sm text-gray-700 flex items-start">
                          <span className="text-blue-500 mr-2">→</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Enhanced Currency Widget */}
            <CurrencyWidget currency={intelligence.costAnalysis.currency} />

            {/* Social Insights Section */}
            {intelligence.socialInsights && (
              <>
                {/* Reddit Community Insights */}
                {intelligence.socialInsights.reddit && (
                  <RedditInsights
                    insights={intelligence.socialInsights.reddit}
                    city={intelligence.query.city}
                  />
                )}

                {/* YouTube Student Experiences */}
                {intelligence.socialInsights.youtube && (
                  <YouTubeVideos
                    insights={intelligence.socialInsights.youtube}
                    city={intelligence.query.city}
                  />
                )}

                {/* News & Safety Alerts */}
                {intelligence.socialInsights.news && (
                  <NewsAlerts
                    alerts={intelligence.socialInsights.news}
                    city={intelligence.query.city}
                  />
                )}
              </>
            )}
          </div>
        )}

        {/* Example Queries */}
        {!intelligence && (
          <>
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

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 font-bold">🗣️</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Community Insights</h3>
                <p className="text-sm text-gray-600">
                  Real student experiences from Reddit and YouTube vlogs
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-red-600 font-bold">📰</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Safety News</h3>
                <p className="text-sm text-gray-600">
                  Current news alerts and safety information from trusted sources
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
          </>
        )}
      </div>
    </div>
  );
}
