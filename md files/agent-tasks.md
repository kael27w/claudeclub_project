# you don't have to follow this exactly but it is what i think the agents should do 
AGENT Recommended ASSIGNMENTS:

**backend-developer**: 
- Implement caching layer (Phase 1 priority)
- Build OpenExchangeRates currency service
- Create NewsAPI integration for safety alerts
- Handle API error handling and rate limiting

**api-architect**: 
- Design Reddit API service for community insights
- Build YouTube Data API service for video search
- Architect the scraper fallback system (Firecrawl, ScraperAPI)
- Create unified API response interfaces

**frontend-developer**:
- Update UI to display currency conversion with trends
- Add YouTube video embedding in "Student Experiences" section  
- Integrate Reddit community insights into Cultural Guide
- Show news alerts in Safety section

**ai-integration-planner**:
- Enhance Perplexity research agents with new data sources
- Update destination intelligence synthesis to include all APIs
- Implement smart fallback logic (LLM → APIs → Scrapers → Cache)
- Optimize confidence scoring with multiple data sources

**qa-testing-agent**:
- Test the 3-tier fallback system works properly
- Verify caching reduces response times from 15s to <2s
- Test API error handling and graceful degradation
- Validate multi-city functionality works