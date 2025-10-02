import type { NewsAlerts as NewsAlertsType } from '@/lib/types/destination';

interface NewsAlertsProps {
  alerts: NewsAlertsType;
  city: string;
}

/**
 * NewsAlerts Component
 *
 * Displays current news and safety alerts including:
 * - Safety level indicator
 * - Recent news articles
 * - Category filters (safety, housing, transport, etc.)
 * - Source credibility indicators
 */
export default function NewsAlerts({ alerts, city: _city }: NewsAlertsProps) {
  if (!alerts || !alerts.articles || alerts.articles.length === 0) {
    return null;
  }

  // Format date to be human-readable
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Get safety level styling
  const getSafetyLevelStyle = (level: 'safe' | 'caution' | 'warning') => {
    switch (level) {
      case 'safe':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          border: 'border-green-300',
          icon: '✓',
        };
      case 'caution':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          border: 'border-yellow-300',
          icon: '⚠️',
        };
      case 'warning':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          border: 'border-red-300',
          icon: '⚠️',
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          border: 'border-gray-300',
          icon: 'ℹ️',
        };
    }
  };

  // Get category badge styling
  const getCategoryStyle = (category: string) => {
    switch (category) {
      case 'safety':
        return 'bg-red-100 text-red-800';
      case 'housing':
        return 'bg-blue-100 text-blue-800';
      case 'transport':
        return 'bg-purple-100 text-purple-800';
      case 'student':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const safetyStyle = getSafetyLevelStyle(alerts.safetyLevel);

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <span className="text-3xl mr-3">📰</span>
        Current News & Safety Alerts
      </h3>

      {/* Safety Level Indicator */}
      <div className={`mb-6 p-4 rounded-lg border-2 ${safetyStyle.bg} ${safetyStyle.border}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{safetyStyle.icon}</span>
            <div>
              <h4 className={`font-semibold ${safetyStyle.text}`}>
                Current Safety Level: {alerts.safetyLevel.charAt(0).toUpperCase() + alerts.safetyLevel.slice(1)}
              </h4>
              <p className="text-sm text-gray-700 mt-1">{alerts.summary}</p>
            </div>
          </div>
        </div>
      </div>

      {/* News Articles */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-900 mb-3">Recent Updates</h4>
        {alerts.articles.slice(0, 8).map((article, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getCategoryStyle(article.category)}`}>
                    {article.category}
                  </span>
                  <span className="text-xs text-gray-500">{article.source}</span>
                  <span className="text-xs text-gray-400">{formatDate(article.publishedAt)}</span>
                </div>

                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-900 font-semibold hover:text-blue-600 transition-colors block mb-2"
                >
                  {article.title}
                </a>

                {article.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {article.description}
                  </p>
                )}
              </div>

              {/* External Link Icon */}
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 text-gray-400 hover:text-blue-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Category Filter Legend */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Categories</h4>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs px-3 py-1 rounded-full bg-red-100 text-red-800 font-medium">
            Safety
          </span>
          <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-medium">
            Housing
          </span>
          <span className="text-xs px-3 py-1 rounded-full bg-purple-100 text-purple-800 font-medium">
            Transport
          </span>
          <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-800 font-medium">
            Student
          </span>
          <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-800 font-medium">
            General
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          News alerts are updated regularly from trusted sources.
          For emergencies, always contact local authorities or your embassy.
        </p>
      </div>
    </div>
  );
}
