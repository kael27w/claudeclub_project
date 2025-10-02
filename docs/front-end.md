# Frontend Documentation - Destination Intelligence UI

## Overview
This document details the frontend implementation for the Study Abroad Destination Intelligence application, specifically covering the new data sources integration (Reddit, YouTube, News, and Currency).

## Architecture

### Component Structure
```
app/
├── page.tsx                          # Main destination intelligence page
├── layout.tsx                        # Root layout
components/
├── RedditInsights.tsx               # Reddit community insights display
├── YouTubeVideos.tsx                # YouTube video insights display
├── NewsAlerts.tsx                   # News and safety alerts display
├── CurrencyWidget.tsx               # Live currency conversion widget
└── LoadingSkeleton.tsx              # Loading state components
lib/
└── types/
    └── destination.ts               # TypeScript interfaces
```

## Component Details

### 1. RedditInsights Component (`/components/RedditInsights.tsx`)

**Purpose:** Displays community insights from Reddit including top posts, key takeaways, and common topics.

**Props:**
```typescript
interface RedditInsightsProps {
  insights: RedditInsights;
  city: string;
}
```

**Features:**
- Displays top community posts with upvote counts
- Shows key takeaways from each post
- Lists active subreddits
- Highlights frequently discussed topics
- Color-coded relevance badges (high/medium/low)
- Links to original Reddit posts
- Human-readable date formatting

**Styling:**
- Orange theme (matching Reddit branding)
- Responsive grid layout
- Hover effects on post cards
- Mobile-friendly design

**Data Structure:**
```typescript
interface RedditInsights {
  posts: RedditPost[];
  communitySummary: string;
  topSubreddits: string[];
  commonTopics: string[];
}

interface RedditPost {
  title: string;
  subreddit: string;
  score: number;
  url: string;
  createdAt: string;
  keyTakeaway: string;
  relevance: 'high' | 'medium' | 'low';
}
```

---

### 2. YouTubeVideos Component (`/components/YouTubeVideos.tsx`)

**Purpose:** Displays student experience videos from YouTube with thumbnails and metadata.

**Props:**
```typescript
interface YouTubeVideosProps {
  insights: YouTubeInsights;
  city: string;
}
```

**Features:**
- Video thumbnail display with hover play button
- Video duration overlay
- View count formatting (1.2M, 45K)
- Publication date formatting
- Channel name display
- Relevance indicators
- Average views statistics
- Topic tags
- Direct links to YouTube

**Styling:**
- Red theme (matching YouTube branding)
- 2-column grid on desktop, 1-column on mobile
- Hover animations on thumbnails
- Responsive image sizing

**Data Structure:**
```typescript
interface YouTubeInsights {
  videos: YouTubeVideo[];
  topicsFound: string[];
  averageViews: number;
}

interface YouTubeVideo {
  title: string;
  videoId: string;
  url: string;
  channelName: string;
  viewCount: number;
  publishedAt: string;
  thumbnail: string;
  duration: string;
  relevance: 'high' | 'medium' | 'low';
}
```

---

### 3. NewsAlerts Component (`/components/NewsAlerts.tsx`)

**Purpose:** Displays current news articles and safety alerts for the destination.

**Props:**
```typescript
interface NewsAlertsProps {
  alerts: NewsAlerts;
  city: string;
}
```

**Features:**
- Safety level indicator (safe/caution/warning)
- News article cards with descriptions
- Category badges (safety, housing, transport, student, general)
- Source attribution
- Time-based formatting
- External link icons
- Color-coded safety alerts

**Styling:**
- Color-coded safety levels (green/yellow/red)
- Category-specific badge colors
- Responsive article grid
- Accessible contrast ratios

**Data Structure:**
```typescript
interface NewsAlerts {
  articles: NewsArticle[];
  safetyLevel: 'safe' | 'caution' | 'warning';
  summary: string;
}

interface NewsArticle {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  description: string;
  category: 'safety' | 'housing' | 'transport' | 'general' | 'student';
  relevance: 'high' | 'medium' | 'low';
}
```

---

### 4. CurrencyWidget Component (`/components/CurrencyWidget.tsx`)

**Purpose:** Displays live exchange rates, trends, and budget impact analysis.

**Props:**
```typescript
interface CurrencyWidgetProps {
  currency: CurrencyAnalysis;
}
```

**Features:**
- Large, prominent exchange rate display
- 30-day trend sparkline chart
- Trend indicators (strengthening/weakening/stable)
- Budget conversion calculator
- Historical rates visualization
- Last updated timestamp
- Recommendations based on trends

**Styling:**
- Blue/purple gradient theme
- SVG-based sparkline chart
- Responsive number formatting
- Color-coded trend indicators
- Mobile-optimized layout

**Data Structure:**
```typescript
interface CurrencyAnalysis {
  exchangeRate: number;
  fromCurrency: string;
  toCurrency: string;
  trend: 'strengthening' | 'stable' | 'weakening';
  impact: string;
  budgetInLocalCurrency: number;
  recommendation: string;
  historicalRates?: {
    date: string;
    rate: number;
  }[];
  lastUpdated?: string;
}
```

---

### 5. LoadingSkeleton Component (`/components/LoadingSkeleton.tsx`)

**Purpose:** Provides animated loading states for different content types.

**Props:**
```typescript
interface LoadingSkeletonProps {
  type?: 'card' | 'text' | 'video' | 'chart' | 'list';
  count?: number;
}
```

**Features:**
- Multiple skeleton types (card, text, video, chart, list)
- Pulsing animation
- Configurable count
- Matches actual component layouts

---

## Main Page Integration (`/app/page.tsx`)

### Component Flow
1. User enters destination query
2. Loading state displays with skeleton components
3. API call to `/api/destination/analyze`
4. Results displayed with all components
5. Social insights conditionally rendered

### Error Handling
- Network errors display user-friendly messages
- Graceful degradation when optional data unavailable
- Retry functionality available
- Error boundaries prevent full page crashes

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Touch-friendly interactions (44px minimum tap targets)
- Optimized for portrait and landscape orientations

---

## TypeScript Interfaces

### Extended DestinationIntelligence
The main `DestinationIntelligence` interface was extended to include social insights:

```typescript
export interface DestinationIntelligence {
  query: DestinationQuery;
  summary: string;
  costAnalysis: {
    flights: FlightCostAnalysis;
    housing: HousingCostAnalysis;
    livingCosts: LivingCostAnalysis;
    currency: CurrencyAnalysis;  // Enhanced with historical rates
  };
  culturalGuide: CulturalIntelligence;
  budgetPlan: BudgetOptimization;
  recommendations: PersonalizedRecommendations;
  socialInsights?: {              // NEW
    reddit?: RedditInsights;
    youtube?: YouTubeInsights;
    news?: NewsAlerts;
  };
  alerts: {
    priceAlerts: string[];
    currencyAlerts: string[];
    seasonalAlerts: string[];
  };
  generatedAt: string;
  confidence: number;
}
```

---

## Styling Guidelines

### Tailwind CSS Classes Used
- Layout: `flex`, `grid`, `space-y-*`, `gap-*`
- Colors: Theme-specific (orange for Reddit, red for YouTube, blue for currency)
- Typography: `text-*`, `font-*`, `leading-*`
- Spacing: `p-*`, `m-*`, `mx-*`, `my-*`
- Borders: `border-*`, `rounded-*`
- Effects: `shadow-*`, `hover:*`, `transition-*`

### Color Palette
```css
Reddit:    orange-50, orange-100, orange-600, orange-800
YouTube:   red-50, red-100, red-600, red-700, red-800
News:      green/yellow/red based on safety level
Currency:  blue-50, blue-100, blue-600, purple-50
```

### Accessibility
- WCAG 2.1 AA compliance
- Color contrast ratio ≥ 4.5:1 for text
- Semantic HTML elements
- ARIA labels where necessary
- Keyboard navigation support
- Screen reader friendly

---

## Performance Optimizations

### Image Loading
- Lazy loading for YouTube thumbnails (`loading="lazy"`)
- Optimized image sizes
- Responsive image serving

### Component Rendering
- Conditional rendering to avoid unnecessary DOM nodes
- React keys for list items
- Memoization opportunities for pure components

### Data Handling
- Optional chaining for nested data access
- Null checks before rendering
- Fallback UI for missing data

---

## API Integration

### Request Format
```typescript
POST /api/destination/analyze
{
  query: string  // Natural language query
}
```

### Response Format
```typescript
{
  success: boolean;
  data?: DestinationIntelligence;
  message?: string;
}
```

### Error States
- Network errors: Display retry button
- Invalid data: Show error message with details
- Timeout: Show loading state with option to cancel
- API unavailable: Fallback to cached or mock data

---

## Testing Scenarios

### Component Testing
1. **RedditInsights**
   - Renders with valid data
   - Handles empty posts array
   - Formats dates correctly
   - Opens external links in new tab

2. **YouTubeVideos**
   - Displays video thumbnails
   - Formats view counts (1M, 1K)
   - Handles missing duration
   - Responsive grid layout

3. **NewsAlerts**
   - Shows correct safety level
   - Color-codes categories
   - Displays article descriptions
   - Handles missing data gracefully

4. **CurrencyWidget**
   - Renders sparkline chart
   - Formats exchange rates correctly
   - Shows trend indicators
   - Calculates budget conversion

### Integration Testing
1. Full page load with all components
2. Loading state transition
3. Error handling and recovery
4. Mobile responsiveness
5. Cross-browser compatibility

---

## Future Enhancements

### Planned Features
1. **Interactive Charts**: Replace SVG sparkline with Chart.js
2. **Video Embeds**: Allow inline YouTube playback
3. **Reddit Thread Previews**: Show top comments inline
4. **Currency Alerts**: Set up notifications for rate changes
5. **Saved Searches**: Cache user queries for quick access

### Performance Improvements
1. Implement React.memo for expensive components
2. Virtual scrolling for long lists
3. Image optimization with next/image
4. Code splitting by route
5. Service worker for offline capability

---

## Development Workflow

### Local Development
```bash
npm run dev          # Start dev server on localhost:3001
npm run build        # Production build
npm run lint         # Run ESLint
npm run type-check   # TypeScript validation
```

### Environment Variables
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_DEMO_MODE=true
```

### Code Quality
- TypeScript strict mode enabled
- ESLint configured for React best practices
- Prettier for code formatting
- Git hooks for pre-commit validation

---

## Troubleshooting

### Common Issues

**Issue: Components not rendering**
- Check if `socialInsights` exists in response
- Verify data structure matches TypeScript interfaces
- Check browser console for errors

**Issue: Styling not applied**
- Ensure Tailwind classes are not purged
- Check responsive breakpoints
- Verify class names are spelled correctly

**Issue: API errors**
- Verify API endpoint is correct
- Check CORS configuration
- Validate request/response format
- Check network tab for details

---

## Component File Locations

All files use absolute paths from project root:

```
/Users/yhaellopez/Desktop/claude_project/claudeclub_project/
├── app/page.tsx
├── components/
│   ├── RedditInsights.tsx
│   ├── YouTubeVideos.tsx
│   ├── NewsAlerts.tsx
│   ├── CurrencyWidget.tsx
│   └── LoadingSkeleton.tsx
├── lib/types/destination.ts
└── docs/front-end.md
```

---

## Contact & Support

For questions or issues related to the frontend implementation, please refer to:
- CLAUDE.md for project guidelines
- PLANNING.md for architecture decisions
- TASKS.md for current development status

**Last Updated:** October 1, 2025
**Version:** 1.0.0
**Status:** Production Ready
