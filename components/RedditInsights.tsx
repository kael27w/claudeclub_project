import type { RedditInsights as RedditInsightsType } from '@/lib/types/destination';

interface RedditInsightsProps {
  insights: RedditInsightsType;
  city: string;
}

/**
 * RedditInsights Component
 *
 * Displays community insights from Reddit including:
 * - Top posts from relevant subreddits
 * - Key takeaways from each post
 * - Community summary
 * - Common topics discussed
 */
export default function RedditInsights({ insights, city }: RedditInsightsProps) {
  if (!insights || !insights.posts || insights.posts.length === 0) {
    return null;
  }

  // Format date to be human-readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

  // Get relevance badge color
  const getRelevanceBadgeColor = (relevance: 'high' | 'medium' | 'low') => {
    switch (relevance) {
      case 'high':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <span className="text-3xl mr-3">🗣️</span>
        Community Insights from Reddit
      </h3>

      {/* Community Summary */}
      {insights.communitySummary && (
        <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
          <p className="text-gray-800 leading-relaxed">
            <strong className="text-orange-800">Community Overview:</strong> {insights.communitySummary}
          </p>
        </div>
      )}

      {/* Top Subreddits */}
      {insights.topSubreddits && insights.topSubreddits.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Active Communities</h4>
          <div className="flex flex-wrap gap-2">
            {insights.topSubreddits.map((subreddit, index) => (
              <a
                key={index}
                href={`https://reddit.com/r/${subreddit}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium hover:bg-orange-200 transition-colors"
              >
                r/{subreddit}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Reddit Posts */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-900 mb-3">Top Community Posts</h4>
        {insights.posts.slice(0, 5).map((post, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-900 font-semibold hover:text-orange-600 transition-colors"
                >
                  {post.title}
                </a>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-sm text-gray-600">
                    r/{post.subreddit}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatDate(post.createdAt)}
                  </span>
                  <span className="text-sm font-medium text-orange-600">
                    {post.score} upvotes
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getRelevanceBadgeColor(post.relevance)}`}>
                    {post.relevance}
                  </span>
                </div>
              </div>
            </div>

            {/* Key Takeaway */}
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong className="text-gray-900">Key Insight:</strong> {post.keyTakeaway}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Common Topics */}
      {insights.commonTopics && insights.commonTopics.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Frequently Discussed Topics</h4>
          <div className="flex flex-wrap gap-2">
            {insights.commonTopics.map((topic, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-white text-blue-700 rounded-full text-sm border border-blue-200"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Insights gathered from Reddit communities discussing {city}.
          Always verify information from multiple sources.
        </p>
      </div>
    </div>
  );
}
