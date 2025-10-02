import type { YouTubeInsights } from '@/lib/types/destination';

interface YouTubeVideosProps {
  insights: YouTubeInsights;
  city: string;
}

/**
 * YouTubeVideos Component
 *
 * Displays student experience videos from YouTube including:
 * - Embedded video players or clickable thumbnails
 * - Video metadata (views, duration, channel)
 * - Relevance indicators
 * - Topics found in videos
 */
export default function YouTubeVideos({ insights, city }: YouTubeVideosProps) {
  if (!insights || !insights.videos || insights.videos.length === 0) {
    return null;
  }

  // Format view count to be human-readable
  const formatViews = (views: number): string => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    }
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  // Format date to be human-readable
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMonths = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 30));

    if (diffInMonths === 0) return 'This month';
    if (diffInMonths === 1) return 'Last month';
    if (diffInMonths < 12) return `${diffInMonths} months ago`;
    const years = Math.floor(diffInMonths / 12);
    return `${years} year${years > 1 ? 's' : ''} ago`;
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
        <span className="text-3xl mr-3">🎥</span>
        Student Experiences on YouTube
      </h3>

      {/* Average Views and Topics */}
      <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-gray-600">Average Views</p>
            <p className="text-2xl font-bold text-red-600">
              {formatViews(insights.averageViews)} views
            </p>
          </div>
          {insights.topicsFound && insights.topicsFound.length > 0 && (
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-2">Common Topics</p>
              <div className="flex flex-wrap gap-2">
                {insights.topicsFound.slice(0, 5).map((topic, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-white text-red-700 rounded-full text-xs border border-red-200"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Video Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {insights.videos.slice(0, 6).map((video, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg overflow-hidden hover:border-red-300 hover:shadow-lg transition-all"
          >
            {/* Video Thumbnail */}
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="relative block group"
            >
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-48 object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg
                    className="w-8 h-8 text-white ml-1"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
              {video.duration && (
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded">
                  {video.duration}
                </div>
              )}
            </a>

            {/* Video Details */}
            <div className="p-4">
              <a
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-900 font-semibold hover:text-red-600 transition-colors line-clamp-2"
              >
                {video.title}
              </a>

              <p className="text-sm text-gray-600 mt-2 mb-3">{video.channelName}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path
                        fillRule="evenodd"
                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {formatViews(video.viewCount)}
                  </span>
                  <span>{formatDate(video.publishedAt)}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getRelevanceBadgeColor(video.relevance)}`}>
                  {video.relevance}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Show More Link */}
      {insights.videos.length > 6 && (
        <div className="mt-6 text-center">
          <a
            href={`https://www.youtube.com/results?search_query=student+life+${encodeURIComponent(city)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
          >
            Find More Videos
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Videos filtered for relevance (minimum 10K views) and recent content about student life in {city}.
        </p>
      </div>
    </div>
  );
}
