# 📦 Repository Organization Summary

This document provides an overview of the repository structure and organization.

## 📂 Root Directory Files

| File | Purpose |
|------|---------|
| **README.md** | Main project documentation with setup instructions |
| **QUICKSTART.md** | 5-minute quick start guide for new users |
| **CONTRIBUTING.md** | Guide for contributors |
| **DEPLOYMENT.md** | Production deployment guide |
| **.env.example** | Template for environment variables |
| **.gitignore** | Git ignore rules |
| **package.json** | Dependencies and scripts |

## 🗂️ Directory Structure

```
claudeclub_project/
│
├── 📄 Documentation (Root)
│   ├── README.md              # Main documentation
│   ├── QUICKSTART.md          # Quick start guide
│   ├── CONTRIBUTING.md        # Contribution guide
│   ├── DEPLOYMENT.md          # Deployment guide
│   └── .env.example           # Environment template
│
├── 📱 app/                    # Next.js 14 App Router
│   ├── api/                   # API routes
│   │   └── destination/
│   │       └── analyze/       # Main analysis endpoint
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Homepage
│
├── 🎨 components/             # React Components
│   ├── DestinationAnalyzer.tsx
│   ├── CurrencyWidget.tsx
│   ├── NewsAlerts.tsx
│   └── ...
│
├── 🧠 lib/                    # Core Business Logic
│   ├── destination-agent.ts   # Main intelligence agent
│   ├── perplexity-agents.ts   # Research service
│   ├── location-parser.ts     # Location parsing
│   ├── services/              # External services
│   │   ├── cache-service.ts   # Caching layer
│   │   ├── currency-service.ts
│   │   └── news-service.ts
│   └── types/                 # TypeScript types
│
├── 🔧 scripts/                # Utility Scripts
│   ├── seed-cache.ts          # Cache seeding
│   └── verify-setup.sh        # Setup verification
│
├── 📚 docs/                   # Documentation
│   ├── api_specifications.md
│   ├── back-end.md
│   ├── front-end.md
│   └── tasks/                 # Task tracking docs
│
└── 📝 md files/               # Historical docs
    └── (older planning docs)
```

## 🚀 Available Commands

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run verify` | Verify setup is correct |
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run type-check` | TypeScript type checking |
| `npm run lint` | Run ESLint |
| `npm run cache:seed` | Seed cache with examples |

## 📖 Documentation Guide

### For New Users
1. Start with **README.md** for overview
2. Follow **QUICKSTART.md** for fast setup
3. Use `npm run verify` to check setup

### For Contributors
1. Read **CONTRIBUTING.md** for guidelines
2. Check **docs/api_specifications.md** for API details
3. Review **docs/back-end.md** and **docs/front-end.md**

### For Deployment
1. Follow **DEPLOYMENT.md** for platform guides
2. Check **.env.example** for required variables
3. Use `npm run build` to test production build

## 🔑 Key Files to Understand

### Business Logic
- `lib/destination-agent.ts` - Main intelligence orchestration
- `lib/perplexity-agents.ts` - Real-time research
- `lib/location-parser.ts` - Query parsing

### API Layer
- `app/api/destination/analyze/route.ts` - Main endpoint
- `lib/services/cache-service.ts` - Caching strategy

### Frontend
- `app/page.tsx` - Homepage
- `components/DestinationAnalyzer.tsx` - Main UI

## 🎯 Quick Reference

### Setup New Environment
```bash
git clone <repo>
cd claudeclub_project
npm install
cp .env.example .env.local
npm run verify
npm run dev
```

### Pre-Demo Checklist
```bash
npm run cache:seed      # Seed cache
npm run type-check      # Verify types
npm run build           # Test build
npm run verify          # Final check
```

### Deployment Checklist
```bash
npm run type-check      # Types pass
npm run lint            # Linting passes
npm run build           # Build succeeds
# Add env vars to platform
# Deploy!
```

## 📊 Repository Statistics

- **Primary Language:** TypeScript
- **Framework:** Next.js 14
- **UI Library:** React 18
- **Styling:** Tailwind CSS
- **Node Version:** 18.0+
- **Package Manager:** npm

## 🔄 Typical Workflow

1. **Clone & Setup**
   ```bash
   git clone <repo>
   npm install
   cp .env.example .env.local
   ```

2. **Configure**
   - Add API keys to `.env.local`
   - Run `npm run verify`

3. **Develop**
   ```bash
   npm run dev
   ```

4. **Test**
   ```bash
   npm run type-check
   npm run lint
   npm run build
   ```

5. **Deploy**
   - Follow DEPLOYMENT.md
   - Add env vars to platform
   - Deploy to production

## 🆘 Getting Help

- **Setup Issues:** Run `npm run verify`
- **Development:** Check README.md
- **Contributing:** Read CONTRIBUTING.md
- **Deployment:** Follow DEPLOYMENT.md
- **Bugs:** Open GitHub issue

## 📝 Notes

- All task/planning docs moved to `docs/tasks/`
- Historical docs in `md files/`
- Backup files ignored by git
- API keys never committed

---

Last Updated: 2025-10-02
