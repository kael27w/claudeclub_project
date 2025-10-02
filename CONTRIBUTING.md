# Contributing to Study Abroad Destination Intelligence

Thank you for considering contributing to this project! This guide will help you get started.

## 🚀 Quick Setup for Contributors

1. **Fork the repository** on GitHub
2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/claudeclub_project.git
   cd claudeclub_project
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   # Add your API keys to .env.local
   ```

5. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

6. **Start development server:**
   ```bash
   npm run dev
   ```

## 📁 Project Structure

Understanding the codebase:

```
lib/                              # Core business logic
├── destination-agent.ts          # Main intelligence agent
├── perplexity-agents.ts          # Research service
├── location-parser.ts            # Location parsing
└── services/                     # External services
    ├── cache-service.ts          # Caching layer
    ├── currency-service.ts       # Currency API
    └── news-service.ts           # News API

app/                              # Next.js App Router
├── api/destination/analyze/      # Main API endpoint
└── page.tsx                      # Homepage

components/                       # React components
└── DestinationAnalyzer.tsx      # Main UI component
```

## 🧪 Testing Your Changes

1. **Type checking:**
   ```bash
   npm run type-check
   ```

2. **Linting:**
   ```bash
   npm run lint
   ```

3. **Test with demo mode** (no API calls):
   ```bash
   # In .env.local
   NEXT_PUBLIC_DEMO_MODE=true
   npm run dev
   ```

4. **Test with real APIs:**
   ```bash
   # In .env.local
   NEXT_PUBLIC_DEMO_MODE=false
   npm run dev
   ```

## 🎯 Areas for Contribution

### High Priority
- [ ] Add more default example cities
- [ ] Improve error handling and user feedback
- [ ] Add unit tests for core services
- [ ] Optimize bundle size
- [ ] Add loading states and skeleton screens

### Medium Priority
- [ ] Support for additional currencies
- [ ] Improved mobile responsiveness
- [ ] Add comparison feature (compare 2+ destinations)
- [ ] Export reports as PDF
- [ ] User authentication and saved searches

### Low Priority
- [ ] Dark mode support
- [ ] Internationalization (i18n)
- [ ] Integration with university databases
- [ ] Social sharing features

## 📝 Coding Standards

### TypeScript
- Use strict type checking
- Avoid `any` types when possible
- Document complex types with JSDoc comments

### React Components
- Prefer functional components with hooks
- Use TypeScript for all components
- Keep components focused and single-purpose
- Use Tailwind CSS for styling

### API Services
- Always handle errors gracefully
- Log important operations for debugging
- Use caching when appropriate
- Document API response formats

### Example Code Style

```typescript
/**
 * Parse a destination query and extract location data
 * @param rawQuery - Natural language query from user
 * @returns Parsed query with structured location data
 */
async function parseQuery(rawQuery: string): Promise<DestinationQuery> {
  try {
    const response = await sendOpenAIMessage(prompt, systemPrompt);
    const parsed = JSON.parse(response);

    // Validate and enhance location data
    const location = await locationParser.parseDestination(parsed.destination);

    return {
      ...parsed,
      city: location.city,
      country: location.country,
    };
  } catch (error) {
    console.error('Query parsing failed:', error);
    throw new Error('Failed to parse destination query');
  }
}
```

## 🔄 Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new features
3. **Ensure all tests pass:**
   ```bash
   npm run type-check
   npm run lint
   ```
4. **Update CHANGELOG.md** (if exists) with your changes
5. **Submit PR with clear description:**
   - What problem does it solve?
   - How did you test it?
   - Any breaking changes?
   - Screenshots (if UI changes)

### PR Title Format
```
feat: Add comparison feature for destinations
fix: Resolve currency conversion bug
docs: Update API documentation
refactor: Improve cache service performance
```

## 🐛 Reporting Bugs

When reporting bugs, please include:

1. **Description:** Clear description of the issue
2. **Steps to reproduce:** Numbered list of steps
3. **Expected behavior:** What should happen
4. **Actual behavior:** What actually happens
5. **Environment:**
   - OS: [e.g., macOS 13.0]
   - Browser: [e.g., Chrome 120]
   - Node version: [e.g., 18.17.0]
6. **Screenshots:** If applicable
7. **Error logs:** Console errors or server logs

## 💡 Suggesting Features

Feature requests are welcome! Please include:

1. **Use case:** Why is this needed?
2. **Proposed solution:** How should it work?
3. **Alternatives considered:** Other approaches?
4. **Impact:** Who benefits from this?

## 🤝 Code Review Process

All submissions require review. We'll:
- Check code quality and style
- Verify tests pass
- Ensure documentation is updated
- Test functionality manually
- Provide constructive feedback

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

## ❓ Questions?

Feel free to:
- Open an issue for discussion
- Join our community discussions
- Reach out to maintainers

Thank you for contributing! 🎉
