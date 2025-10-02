# 🌍 Study Abroad Destination Intelligence

> AI-powered platform providing comprehensive, personalized destination intelligence for study abroad students using real-time research and multi-source data synthesis.

![Next.js](https://img.shields.io/badge/Next.js-14.2-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)
![React](https://img.shields.io/badge/React-18.3-61dafb)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8)

## 🎯 What This Does

Instead of spending hours researching study abroad destinations across multiple websites, students can:

1. **Input a natural language query** like: *"I'm studying at FGV in São Paulo for 4 months, $2000 budget, love art and local food, coming from Virginia"*

2. **Get instant, comprehensive intelligence** including:
   - Flight prices and booking recommendations
   - Housing options (dorms, apartments, Airbnb) with costs
   - Monthly living expenses (food, transport, entertainment)
   - Cultural guide with local customs and essential phrases
   - Personalized budget breakdown with feasibility analysis
   - Safety information and recommended neighborhoods
   - Interest-based recommendations (art, food, nightlife, etc.)
   - Real-time currency conversion

3. **Works for ANY city worldwide** - Powered by Perplexity's real-time research API

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0 or higher
- **npm** 9.0 or higher
- **API Keys** (see [API Keys Setup](#-api-keys-setup) below)

### Installation

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd claudeclub_project

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys (see below)

# 4. Seed the cache with default examples (optional but recommended)
npm run cache:seed

# 5. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 API Keys Setup

### Required Keys (Core Functionality)

| API | Purpose | Free Tier | Get It Here |
|-----|---------|-----------|-------------|
| **OpenAI** | AI synthesis & processing | $5 free credit | [platform.openai.com](https://platform.openai.com/api-keys) |
| **Anthropic** | Claude 4.5 synthesis | $5 free credit | [console.anthropic.com](https://console.anthropic.com/) |

### Optional Keys (Enhanced Features)

| API | Purpose | Free Tier | Get It Here |
|-----|---------|-----------|-------------|
| **Perplexity** | Real-time research for any destination | 5 requests/day | [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api) |
| **OpenExchangeRates** | Live currency conversion | 1,000 requests/month | [openexchangerates.org](https://openexchangerates.org/signup/free) |
| **NewsAPI** | Current news & safety alerts | 100 requests/day | [newsapi.org](https://newsapi.org/register) |

> **Note:** App works without optional keys but uses fallback data. For best results with custom locations, use Perplexity API.

### Setting Up Your `.env.local`

1. Copy the example file:
```bash
cp .env.example .env.local
```

2. Edit `.env.local` and add your API keys:
```bash
# Required
CHATGPT_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Optional (for enhanced features)
PERPLEXITY_API_KEY=pplx-...
USE_PERPLEXITY=true
OPENEXCHANGERATES_API_KEY=...
NEWS_API_KEY=...

# Application settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEMO_MODE=false
```

---

## 📖 Available Commands

```bash
# Development
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Build for production
npm start            # Start production server
npm run type-check   # Run TypeScript type checking

# Cache Management
npm run cache:seed   # Pre-populate cache with default examples
                     # Run this before demos for instant load times!

# Testing
npm run lint         # Run ESLint
npm run test:claude  # Test Claude AI integration
```

---

## 🏗️ Project Structure

```
claudeclub_project/
├── app/                          # Next.js 14 App Router
│   ├── api/                      # API routes
│   │   └── destination/
│   │       └── analyze/          # Main destination analysis endpoint
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Homepage
│
├── components/                   # React components
│   ├── ui/                       # UI components (buttons, cards, etc.)
│   ├── DestinationAnalyzer.tsx  # Main analysis interface
│   └── ...
│
├── lib/                          # Core business logic
│   ├── destination-agent.ts      # Main intelligence agent
│   ├── perplexity-agents.ts      # Perplexity research service
│   ├── location-parser.ts        # Location parsing & validation
│   ├── services/                 # External API services
│   │   ├── cache-service.ts      # Smart caching with stale-while-revalidate
│   │   ├── currency-service.ts   # Currency conversion
│   │   └── news-service.ts       # News & safety alerts
│   └── types/                    # TypeScript type definitions
│
├── scripts/                      # Utility scripts
│   └── seed-cache.ts             # Cache seeding for default examples
│
├── docs/                         # Documentation
│   ├── api_specifications.md
│   ├── back-end.md
│   └── front-end.md
│
├── .env.example                  # Environment variables template
└── package.json                  # Dependencies and scripts
```

---

## 🎨 Key Features

### 1. **Pre-Research for Accuracy**
Before conducting main research, the system queries for city-specific facts (universities, neighborhoods, airports) and injects them into research prompts for more accurate results.

```typescript
// Example: Lisbon query
Pre-research extracts:
- Universities: University of Lisbon, New University of Lisbon
- Neighborhoods: Alvalade, Campo de Ourique, Bairro Alto
- Airport: LIS (Humberto Delgado Airport)

These keywords enhance the main research query for better accuracy.
```

### 2. **Smart Caching with Stale-While-Revalidate**
- Default examples load instantly from cache (< 3 seconds)
- Cache automatically refreshes in background when data is stale (> 1 hour)
- First request: 50+ seconds | Cached requests: < 3 seconds (95% improvement!)

### 3. **Multi-Source Data Synthesis**
Combines data from:
- Perplexity API (real-time research)
- OpenExchangeRates (live currency data)
- NewsAPI (current safety alerts)
- Claude 4.5 (intelligent synthesis)

### 4. **Universal Destination Support**
Works for ANY city worldwide, not just pre-defined locations. The AI researches and synthesizes data in real-time.

---

## 🎬 Demo Mode

For testing without API keys or to save API credits:

```bash
# In .env.local
NEXT_PUBLIC_DEMO_MODE=true
```

Demo mode uses high-quality mock data for:
- São Paulo, Brazil
- Barcelona, Spain
- Tokyo, Japan

---

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

```bash
# Or use Vercel CLI
npm install -g vercel
vercel
```

### Other Platforms

The app is a standard Next.js 14 application and can be deployed to:
- Netlify
- Railway
- Render
- DigitalOcean App Platform
- AWS Amplify

**Important:** Make sure to set all environment variables in your deployment platform.

---

## 📊 Performance Metrics

- **Accuracy Improvement:** Pre-research provides city-specific context for all queries
- **Speed Improvement:** 95% reduction in response time for cached queries (52s → 2.5s)
- **User Experience:** Default examples load nearly instantly from cache

---

## 🛠️ Technology Stack

- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS
- **UI Components:** Framer Motion, Recharts, Lucide Icons
- **AI/ML:** Anthropic Claude 4.5, OpenAI GPT-4
- **Real-time Research:** Perplexity API
- **Data Sources:** OpenExchangeRates, NewsAPI
- **State Management:** React Query
- **Styling:** Tailwind CSS with custom design system

---

## 📝 Environment Variables Reference

See [`.env.example`](./.env.example) for complete list with descriptions.

**Minimum required for basic functionality:**
```bash
CHATGPT_API_KEY=...        # OpenAI API key
ANTHROPIC_API_KEY=...      # Anthropic API key
```

**Recommended for full features:**
```bash
PERPLEXITY_API_KEY=...     # Real-time research
USE_PERPLEXITY=true
OPENEXCHANGERATES_API_KEY=... # Currency conversion
NEWS_API_KEY=...           # Safety alerts
```

---

## 🤝 Contributing

This is a competition MVP built in 48 hours. Contributions welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is part of a 48-hour competition MVP.

---

## 🙏 Acknowledgments

- Built with Claude Code AI assistance
- Perplexity API for real-time research capabilities
- Anthropic for Claude 4.5 Sonnet
- OpenAI for GPT-4 synthesis

---

## 📬 Support

Having issues? Check:

1. **API Keys:** Ensure all required keys are in `.env.local`
2. **Node Version:** Must be 18.0 or higher (`node --version`)
3. **Dependencies:** Run `npm install` to ensure all packages are installed
4. **Demo Mode:** Set `NEXT_PUBLIC_DEMO_MODE=true` to test without API keys

For bugs or questions, please open an issue on GitHub.

---

**Made with ❤️ for study abroad students worldwide**
