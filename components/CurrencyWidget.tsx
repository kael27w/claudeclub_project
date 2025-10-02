import type { CurrencyAnalysis } from '@/lib/types/destination';

interface CurrencyWidgetProps {
  currency: CurrencyAnalysis;
}

/**
 * CurrencyWidget Component
 *
 * Displays live currency conversion and trends including:
 * - Current exchange rate
 * - 30-day historical trend chart
 * - Budget impact analysis
 * - Trend indicators
 * - Last updated timestamp
 */
export default function CurrencyWidget({ currency }: CurrencyWidgetProps) {
  if (!currency) {
    return null;
  }

  // Format exchange rate to appropriate decimals
  const formatRate = (rate: number): string => {
    if (rate < 0.01) return rate.toFixed(6);
    if (rate < 1) return rate.toFixed(4);
    if (rate < 100) return rate.toFixed(3);
    return rate.toFixed(2);
  };

  // Get trend styling
  const getTrendStyle = (trend: 'strengthening' | 'stable' | 'weakening') => {
    switch (trend) {
      case 'strengthening':
        return {
          color: 'text-green-600',
          bg: 'bg-green-100',
          icon: '↑',
          label: 'Strengthening',
        };
      case 'weakening':
        return {
          color: 'text-red-600',
          bg: 'bg-red-100',
          icon: '↓',
          label: 'Weakening',
        };
      case 'stable':
        return {
          color: 'text-blue-600',
          bg: 'bg-blue-100',
          icon: '→',
          label: 'Stable',
        };
      default:
        return {
          color: 'text-gray-600',
          bg: 'bg-gray-100',
          icon: '→',
          label: 'Unknown',
        };
    }
  };

  const trendStyle = getTrendStyle(currency.trend);

  // Format timestamp
  const formatTimestamp = (timestamp?: string): string => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  // Simple sparkline chart using historical rates
  const renderSparkline = () => {
    if (!currency.historicalRates || currency.historicalRates.length === 0) {
      return (
        <div className="h-24 flex items-center justify-center bg-gray-50 rounded text-gray-400 text-sm">
          No historical data available
        </div>
      );
    }

    const rates = currency.historicalRates.map(r => r.rate);
    const minRate = Math.min(...rates);
    const maxRate = Math.max(...rates);
    const range = maxRate - minRate || 1;

    // Normalize values to 0-100 for visualization
    const normalized = rates.map(rate => ((rate - minRate) / range) * 100);

    // Create SVG path
    const width = 100;
    const height = 100;
    const step = width / (normalized.length - 1);

    const points = normalized.map((value, index) => ({
      x: index * step,
      y: height - value,
    }));

    const pathData = points.reduce((path, point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`;
      return `${path} L ${point.x} ${point.y}`;
    }, '');

    return (
      <div className="h-24 bg-gradient-to-br from-blue-50 to-purple-50 rounded p-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Area fill */}
          <path
            d={`${pathData} L ${width} ${height} L 0 ${height} Z`}
            fill="url(#gradient)"
            opacity="0.3"
          />
          {/* Line */}
          <path
            d={pathData}
            fill="none"
            stroke={currency.trend === 'strengthening' ? '#10b981' : currency.trend === 'weakening' ? '#ef4444' : '#3b82f6'}
            strokeWidth="2"
          />
          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={currency.trend === 'strengthening' ? '#10b981' : currency.trend === 'weakening' ? '#ef4444' : '#3b82f6'} stopOpacity="0.5" />
              <stop offset="100%" stopColor={currency.trend === 'strengthening' ? '#10b981' : currency.trend === 'weakening' ? '#ef4444' : '#3b82f6'} stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <span className="text-3xl mr-3">💱</span>
        Live Currency Conversion
      </h3>

      {/* Main Exchange Rate Display */}
      <div className="mb-6 p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Exchange Rate</p>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold text-gray-700">
                1 {currency.fromCurrency}
              </span>
              <span className="text-gray-400">=</span>
              <span className="text-3xl font-bold text-blue-600">
                {formatRate(currency.exchangeRate)}
              </span>
              <span className="text-lg font-semibold text-gray-700">
                {currency.toCurrency}
              </span>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-lg ${trendStyle.bg} flex items-center gap-2`}>
            <span className={`text-2xl ${trendStyle.color}`}>{trendStyle.icon}</span>
            <span className={`font-semibold ${trendStyle.color}`}>{trendStyle.label}</span>
          </div>
        </div>

        {currency.lastUpdated && (
          <p className="text-xs text-gray-500">
            Last updated: {formatTimestamp(currency.lastUpdated)}
          </p>
        )}
      </div>

      {/* 30-Day Trend Chart */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">30-Day Trend</h4>
        {renderSparkline()}
        {currency.historicalRates && currency.historicalRates.length > 0 && (
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>{new Date(currency.historicalRates[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            <span>{new Date(currency.historicalRates[currency.historicalRates.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        )}
      </div>

      {/* Budget Impact */}
      <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Budget Impact</h4>
        <p className="text-sm text-gray-700">{currency.impact}</p>
      </div>

      {/* Budget Conversion */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Your Budget</p>
          <p className="text-2xl font-bold text-gray-900">
            {currency.fromCurrency} 1,000
          </p>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">In Local Currency</p>
          <p className="text-2xl font-bold text-blue-600">
            {currency.toCurrency} {(1000 * currency.exchangeRate).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Recommendation */}
      {currency.recommendation && (
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <h4 className="text-sm font-semibold text-green-900 mb-2 flex items-center">
            <span className="mr-2">💡</span>
            Recommendation
          </h4>
          <p className="text-sm text-gray-700">{currency.recommendation}</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Exchange rates update regularly. For large transactions, consult your bank for current rates.
        </p>
      </div>
    </div>
  );
}
