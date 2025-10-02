/**
 * Destination Intelligence Agent - UNIVERSAL VERSION
 * Uses Perplexity Pro for real-time research + Claude 4.5 for synthesis
 * Works for ANY study abroad destination worldwide
 */

import { sendOpenAIMessage } from './openai-client';
import { locationParser } from './location-parser';
import { perplexityService } from './perplexity-agents';
import { cacheService } from './services/cache-service';
import { newsAPIService } from './services/news-service';
import { currencyService } from './services/currency-service';
import type {
  DestinationQuery,
  DestinationIntelligence,
} from './types/destination';
import type { ParsedLocation, UserOrigin } from './location-parser';
import type { PerplexityResearchResults } from './perplexity-agents';

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
const USE_PERPLEXITY = process.env.USE_PERPLEXITY === 'true' && process.env.PERPLEXITY_API_KEY && process.env.PERPLEXITY_API_KEY.length > 0;
// Default to OpenAI for faster responses (single call vs 5 Perplexity calls)

export class DestinationIntelligenceAgent {
  /**
   * Parse natural language query into structured data
   * ENHANCED: Uses location parser for better city/country validation
   */
  async parseQuery(rawQuery: string): Promise<DestinationQuery> {
    const systemPrompt = `You are an expert at parsing study abroad queries. Extract structured information from natural language.

Extract:
- University name (if mentioned)
- Destination (city and/or country - can be just "Barcelona" or "Barcelona, Spain")
- Duration (convert to months)
- Budget and currency
- Interests/hobbies
- Dietary restrictions (if mentioned)
- Origin location (can be city, state, or country)

Return ONLY valid JSON with this structure:
{
  "university": "string or null",
  "destination": "city and/or country as mentioned",
  "duration": "string",
  "durationMonths": number,
  "budget": number,
  "currency": "string (3-letter code like USD, EUR, BRL)",
  "interests": ["array", "of", "strings"],
  "dietaryRestrictions": ["array or empty"],
  "origin": "origin location as mentioned"
}`;

    const prompt = `Parse this study abroad query:\n\n"${rawQuery}"\n\nReturn structured JSON:`;

    try {
      const response = await sendOpenAIMessage(prompt, systemPrompt);
      const parsed = JSON.parse(response);

      // Use location parser to validate and enhance location data
      let parsedLocation: ParsedLocation;
      let parsedOrigin: UserOrigin;

      try {
        parsedLocation = await locationParser.parseDestination(parsed.destination);
        parsedOrigin = await locationParser.parseOrigin(parsed.origin);
      } catch (error) {
        console.warn('Location parsing fallback:', error);
        // Fallback to basic parsing
        return this.fallbackParse(rawQuery);
      }

      return {
        rawQuery,
        university: parsed.university,
        city: parsedLocation.city,
        country: parsedLocation.country,
        duration: parsed.duration,
        durationMonths: parsed.durationMonths,
        budget: parsed.budget,
        currency: parsed.currency,
        interests: parsed.interests || [],
        dietaryRestrictions: parsed.dietaryRestrictions || [],
        origin: {
          city: parsedOrigin.city,
          state: parsedOrigin.state,
          country: parsedOrigin.country,
        },
        metadata: {
          parsedLocation,
          parsedOrigin,
        },
      };
    } catch (error) {
      console.error('Error parsing query:', error);
      // Fallback parsing for demo
      return this.fallbackParse(rawQuery);
    }
  }

  /**
   * Generate comprehensive destination intelligence
   * ENHANCED VERSION: Uses multi-source data with smart caching and fallback
   */
  async generateIntelligence(query: DestinationQuery): Promise<DestinationIntelligence> {
    // Check cache first
    const cacheKey = cacheService.generateKey(
      `${query.city},${query.country}`,
      query.origin.city || query.origin.state || query.origin.country,
      query.budget,
      query.interests,
      query.durationMonths
    );

    const cached = cacheService.get<DestinationIntelligence>(cacheKey);
    if (cached) {
      console.log('[DestAgent] ✓ Using cached intelligence');
      return cached;
    }

    // Demo mode: skip research, use mock data
    if (DEMO_MODE) {
      console.log('[DestAgent] Demo mode: Using mock destination intelligence');
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return this.getMockIntelligence(query);
    }

    // Get location metadata from query
    const parsedLocation = query.metadata?.parsedLocation;
    const parsedOrigin = query.metadata?.parsedOrigin;

    if (!parsedLocation || !parsedOrigin) {
      console.warn('[DestAgent] Missing location metadata, using fallback');
      return this.getMockIntelligence(query);
    }

    try {
      console.log('[DestAgent] 🔄 Generating fresh intelligence with multi-source data...');
      console.log('[DestAgent] ========== SERVICE STATUS ==========');

      // Check which services are enabled
      const perplexityEnabled = USE_PERPLEXITY && perplexityService.isConfigured();
      const newsEnabled = newsAPIService.isConfigured();
      const currencyEnabled = currencyService.isConfigured();

      console.log(`[Agent] Perplexity: ${perplexityEnabled ? 'ENABLED' : 'DISABLED'}`);
      console.log(`[Agent] OpenAI: ENABLED (primary synthesis)`);
      console.log(`[Agent] Currency: ${currencyEnabled ? 'ENABLED' : 'DISABLED'}`);
      console.log(`[Agent] News: ${newsEnabled ? 'ENABLED' : 'DISABLED'}`);
      console.log(`[Agent] YouTube: SKIPPED (disabled for demo)`);
      console.log(`[Agent] Reddit: SKIPPED (disabled for demo)`);
      console.log(`[Agent] Gemini: SKIPPED (disabled for demo)`);
      console.log('[DestAgent] ====================================');

      // Step 1: Gather data from all sources in parallel
      const [
        perplexityResearch,
        newsAlerts,
        currencyData,
      ] = await Promise.allSettled([
        // Primary: Perplexity research (if configured)
        perplexityEnabled
          ? (async () => {
              console.log('[Agent] Perplexity: Calling API...');
              const result = await perplexityService.conductResearch(parsedLocation, parsedOrigin, query);
              console.log('[Agent] Perplexity: SUCCESS');
              return result;
            })()
          : Promise.resolve(null),

        // News API
        newsEnabled
          ? (async () => {
              console.log('[Agent] News: Calling API...');
              const result = await newsAPIService.getNewsAlerts(query.city, query.country).catch((err) => {
                console.log('[Agent] News: FAILED -', err.message);
                return null;
              });
              if (result) console.log('[Agent] News: SUCCESS');
              return result;
            })()
          : Promise.resolve(null),

        // Currency API
        currencyEnabled
          ? (async () => {
              console.log('[Agent] Currency: Calling API...');
              console.log(`[Agent] Currency: Converting ${query.currency} -> ${this.getLocalCurrency(query.country)} for budget ${query.budget}`);
              const result = await currencyService.getCurrencyData(query.currency, this.getLocalCurrency(query.country), query.budget).catch((err) => {
                console.log('[Agent] Currency: FAILED -', err.message);
                return null;
              });
              if (result) {
                console.log('[Agent] Currency: SUCCESS');
                console.log('[Agent] Currency: 🔍 Received data:', JSON.stringify(result, null, 2));
              } else {
                console.log('[Agent] Currency: ⚠️ Result is NULL');
              }
              return result;
            })()
          : Promise.resolve(null),
      ]);

      // Extract successful results
      const perplexity = perplexityResearch.status === 'fulfilled' ? perplexityResearch.value : null;
      const news = newsAlerts.status === 'fulfilled' ? newsAlerts.value : null;
      const currency = currencyData.status === 'fulfilled' ? currencyData.value : null;

      console.log('[DestAgent] ========== FINAL STATUS ==========');
      console.log(`[Agent] Perplexity: ${perplexity ? 'SUCCESS' : 'NULL'}`);
      console.log(`[Agent] News: ${news ? 'SUCCESS' : 'NULL'}`);
      console.log(`[Agent] Currency: ${currency ? 'SUCCESS' : 'NULL'}`);
      console.log(`[Agent] YouTube: SKIPPED`);
      console.log(`[Agent] Reddit: SKIPPED`);
      console.log('[DestAgent] ====================================');

      // Step 2: Synthesize all data with OpenAI
      console.log('[Agent] OpenAI: Calling synthesis API...');
      const intelligence = await this.synthesizeMultiSourceData(
        query,
        { perplexity, reddit: null, youtube: null, news, currency }
      );
      console.log('[Agent] OpenAI: SUCCESS');

      // Step 3: Cache the result
      cacheService.set(cacheKey, intelligence);
      console.log('[DestAgent] ✓ Intelligence cached');

      return intelligence;
    } catch (error) {
      console.error('[DestAgent] Intelligence generation failed:', error);
      console.log('[DestAgent] Falling back to mock data');
      return this.getMockIntelligence(query);
    }
  }

  /**
   * Synthesize multi-source data into comprehensive intelligence
   * Combines Perplexity, Reddit, YouTube, News, and Currency data
   */
  private async synthesizeMultiSourceData(
    query: DestinationQuery,
    sources: {
      perplexity: PerplexityResearchResults | null;
      reddit: any;
      youtube: any;
      news: any;
      currency: any;
    }
  ): Promise<DestinationIntelligence> {
    // If we have Perplexity data, use it as the base
    if (sources.perplexity) {
      const intelligence = await this.synthesizePerplexityResearch(query, sources.perplexity, sources.currency);

      // Enhance with social insights
      if (sources.reddit || sources.youtube || sources.news) {
        intelligence.socialInsights = {
          reddit: sources.reddit || undefined,
          youtube: sources.youtube || undefined,
          news: sources.news || undefined,
        };
      }

      // Enhance currency data if available - USE THE REAL API DATA
      if (sources.currency) {
        console.log('[DestAgent] 💰 Applying REAL currency data from API:', JSON.stringify(sources.currency, null, 2));
        intelligence.costAnalysis.currency = sources.currency;
      }

      // Update confidence score based on data sources
      const sourceCount = Object.values(sources).filter(s => s !== null).length;
      intelligence.confidence = Math.min(0.95, 0.7 + (sourceCount * 0.05));

      return intelligence;
    }

    // Fallback to Claude-only generation with enhanced context
    return await this.generateWithClaudeEnhanced(query, sources);
  }

  /**
   * Generate intelligence with Claude using enhanced context from free APIs
   */
  private async generateWithClaudeEnhanced(
    query: DestinationQuery,
    sources: {
      reddit: any;
      youtube: any;
      news: any;
      currency: any;
    }
  ): Promise<DestinationIntelligence> {
    const systemPrompt = `You are an expert study abroad advisor. Return ONLY valid JSON - no markdown, no explanations.

CRITICAL: You MUST return a JSON object with this EXACT structure:

{
  "summary": "Brief overview...",
  "costAnalysis": {
    "flights": {
      "currentPrice": {
        "amount": 850,
        "currency": "USD",
        "route": "Virginia → São Paulo"
      },
      "priceRange": {
        "min": 650,
        "max": 1200,
        "average": 850
      },
      "trend": "stable",
      "prediction": "Price prediction text",
      "bookingRecommendation": "Booking advice",
      "bestTimeToBook": "Best time to book"
    },
    "housing": {
      "studentHousing": {
        "monthly": { "min": 300, "max": 600, "average": 450 },
        "availability": "high",
        "options": ["Dormitories", "Student houses"]
      },
      "airbnb": {
        "monthly": { "min": 500, "max": 1200, "average": 800 },
        "neighborhoods": ["Pinheiros", "Vila Madalena"]
      },
      "apartments": {
        "monthly": { "min": 400, "max": 900, "average": 650 },
        "typical": "Studio description"
      },
      "recommendations": ["Housing tips"]
    },
    "livingCosts": {
      "food": {
        "monthly": { "min": 200, "max": 400, "average": 300 },
        "groceries": 150,
        "restaurants": 100,
        "studentMeals": 50
      },
      "transport": {
        "monthly": { "min": 40, "max": 80, "average": 60 },
        "publicTransport": "Metro description",
        "studentDiscounts": ["Discounts"]
      },
      "entertainment": {
        "monthly": { "min": 50, "max": 200, "average": 100 },
        "activities": ["Activities list"]
      },
      "utilities": {
        "monthly": { "min": 40, "max": 60, "average": 50 },
        "included": ["What's included"]
      },
      "total": {
        "monthly": { "min": 600, "max": 1500, "average": 1000 }
      }
    },
    "currency": {
      "exchangeRate": 5.2,
      "fromCurrency": "USD",
      "toCurrency": "BRL",
      "trend": "stable",
      "impact": "Impact description",
      "budgetInLocalCurrency": 10400,
      "recommendation": "Currency advice"
    }
  },
  "culturalGuide": {
    "localCustoms": { ... },
    "studentLife": { ... },
    "language": {
      "primaryLanguage": "Portuguese",
      "essentialPhrases": [{"phrase": "Olá", "translation": "Hello", "pronunciation": "oh-LAH"}],
      "englishProficiency": "medium",
      "languageLearningResources": []
    },
    "safety": {
      "overallRating": 7,
      "safeNeighborhoods": ["Pinheiros", "Vila Madalena"],
      "areasToAvoid": [],
      "emergencyContacts": [],
      "safetyTips": []
    },
    "culturalContext": { ... }
  },
  "budgetPlan": {
    "totalBudget": 2000,
    "duration": 4,
    "breakdown": {
      "housing": {"amount": 433, "percentage": 53, "recommendation": "..."},
      "food": {"amount": 184, "percentage": 22, "recommendation": "..."},
      "transport": {"amount": 50, "percentage": 6, "recommendation": "..."},
      "activities": {"amount": 100, "percentage": 12, "recommendation": "..."},
      "utilities": {"amount": 50, "percentage": 6, "recommendation": "..."},
      "emergency": {"amount": 0, "percentage": 0, "recommendation": "..."}
    },
    "monthlyAllocation": [],
    "savingTips": ["Tips..."],
    "costOptimizationStrategies": ["Strategies..."],
    "feasibility": "tight",
    "warningFlags": []
  },
  "recommendations": {
    "basedOnInterests": [{"interest": "art", "recommendations": ["..."]}],
    "basedOnOrigin": { ... },
    "basedOnBudget": { ... },
    "studentSpecific": { ... }
  },
  "alerts": {
    "priceAlerts": [],
    "currencyAlerts": [],
    "seasonalAlerts": []
  }
}

CRITICAL REQUIRED FIELDS:
- budgetPlan.feasibility MUST be one of: "comfortable", "tight", or "insufficient"
- All nested objects must include ALL required fields

Return ONLY this JSON structure - no markdown code blocks, no extra text.`;

    let contextData = '';

    if (sources.reddit) {
      contextData += `\n**REDDIT COMMUNITY INSIGHTS:**\n`;
      contextData += `Key Insights: ${sources.reddit.keyInsights?.join(', ') || 'None'}\n`;
      contextData += `Popular Topics: ${sources.reddit.popularTopics?.join(', ') || 'None'}\n`;
      contextData += `Warnings: ${sources.reddit.warnings?.join(', ') || 'None'}\n`;
    }

    if (sources.youtube) {
      contextData += `\n**YOUTUBE VIDEO INSIGHTS:**\n`;
      contextData += `Top Videos: ${sources.youtube.videos?.length || 0} relevant videos found\n`;
      contextData += `Topics Covered: ${sources.youtube.topicsFound?.join(', ') || 'None'}\n`;
    }

    if (sources.news) {
      contextData += `\n**CURRENT NEWS & SAFETY:**\n`;
      contextData += `Safety Level: ${sources.news.safetyLevel}\n`;
      contextData += `Summary: ${sources.news.summary}\n`;
      contextData += `Recent Articles: ${sources.news.articles?.length || 0}\n`;
    }

    if (sources.currency) {
      contextData += `\n**LIVE CURRENCY DATA:**\n`;
      contextData += `Exchange Rate: 1 ${sources.currency.fromCurrency} = ${sources.currency.exchangeRate} ${sources.currency.toCurrency}\n`;
      contextData += `Trend: ${sources.currency.trend}\n`;
      contextData += `Budget in Local Currency: ${sources.currency.budgetInLocalCurrency.toFixed(2)}\n`;
    }

    const prompt = `Analyze this study abroad plan with enhanced real-time data:

**Query:** "${query.rawQuery}"

**Structured Data:**
- Destination: ${query.city}, ${query.country}
- University: ${query.university || 'Not specified'}
- Duration: ${query.durationMonths} months
- Budget: ${query.currency} ${query.budget}
- Interests: ${query.interests.join(', ')}
- Origin: ${query.origin.city || query.origin.state || query.origin.country}

${contextData}

Provide comprehensive destination intelligence with realistic current data for 2024-2025, incorporating the community insights, video content, news alerts, and currency data provided above.

Return DestinationIntelligence JSON:`;

    try {
      const response = await sendOpenAIMessage(prompt, systemPrompt, 4000);
      console.log('[DestAgent] OpenAI response length:', response.length, 'chars');

      const intelligence = JSON.parse(response);

      console.log('[DestAgent] Parsed intelligence keys:', Object.keys(intelligence));
      console.log('[DestAgent] costAnalysis keys:', Object.keys(intelligence.costAnalysis || {}));
      console.log('[DestAgent] flights structure:', JSON.stringify(intelligence.costAnalysis?.flights, null, 2));
      console.log('[DestAgent] budgetPlan keys:', Object.keys(intelligence.budgetPlan || {}));
      console.log('[DestAgent] budgetPlan.feasibility:', intelligence.budgetPlan?.feasibility);

      // Validate and fix flights structure if needed
      if (!intelligence.costAnalysis?.flights?.currentPrice) {
        console.error('[DestAgent] ❌ MISSING flights.currentPrice - OpenAI returned wrong structure');
        console.error('[DestAgent] Current flights object:', JSON.stringify(intelligence.costAnalysis?.flights, null, 2));
        console.error('[DestAgent] Applying fallback structure...');

        intelligence.costAnalysis = intelligence.costAnalysis || {};
        intelligence.costAnalysis.flights = {
          currentPrice: {
            amount: intelligence.costAnalysis.flights?.amount || 800,
            currency: 'USD',
            route: `${query.origin.state || query.origin.country} → ${query.city}`,
          },
          priceRange: {
            min: intelligence.costAnalysis.flights?.priceRange?.min || 600,
            max: intelligence.costAnalysis.flights?.priceRange?.max || 1100,
            average: intelligence.costAnalysis.flights?.priceRange?.average || 800,
          },
          trend: intelligence.costAnalysis.flights?.trend || 'stable',
          prediction: intelligence.costAnalysis.flights?.prediction || 'Prices vary by season',
          bookingRecommendation: intelligence.costAnalysis.flights?.bookingRecommendation || 'Book 6-8 weeks in advance',
          bestTimeToBook: intelligence.costAnalysis.flights?.bestTimeToBook || 'Weekdays offer better rates',
        };
      } else {
        console.log('[DestAgent] ✅ flights.currentPrice structure is correct');
      }

      // Validate and fix budgetPlan.feasibility if needed
      if (!intelligence.budgetPlan?.feasibility) {
        console.error('[DestAgent] ❌ MISSING budgetPlan.feasibility');
        console.error('[DestAgent] budgetPlan structure:', JSON.stringify(intelligence.budgetPlan, null, 2));

        intelligence.budgetPlan = intelligence.budgetPlan || {};

        // Calculate feasibility based on budget
        const monthlyBudget = query.budget / query.durationMonths;
        const estimatedMonthlyCost = intelligence.budgetPlan.totalEstimatedMonthlyCost ||
                                    intelligence.costAnalysis?.livingCosts?.total?.monthly?.average ||
                                    1000;

        let feasibility: 'comfortable' | 'tight' | 'insufficient';
        if (monthlyBudget >= estimatedMonthlyCost * 1.2) {
          feasibility = 'comfortable';
        } else if (monthlyBudget >= estimatedMonthlyCost * 0.9) {
          feasibility = 'tight';
        } else {
          feasibility = 'insufficient';
        }

        intelligence.budgetPlan.feasibility = feasibility;
        console.log('[DestAgent] Set fallback feasibility:', feasibility);
      } else {
        console.log('[DestAgent] ✅ budgetPlan.feasibility is set:', intelligence.budgetPlan.feasibility);
      }

      // Add social insights
      const socialInsights: any = {};
      if (sources.reddit) socialInsights.reddit = sources.reddit;
      if (sources.youtube) socialInsights.youtube = sources.youtube;
      if (sources.news) socialInsights.news = sources.news;

      return {
        ...intelligence,
        query,
        socialInsights: Object.keys(socialInsights).length > 0 ? socialInsights : undefined,
        generatedAt: new Date().toISOString(),
        confidence: 0.85, // Higher confidence with multi-source data
      };
    } catch (error) {
      console.error('[DestAgent] Enhanced Claude generation failed:', error);
      throw error;
    }
  }

  /**
   * Get local currency code for a country
   */
  private getLocalCurrency(country: string): string {
    const currencies: Record<string, string> = {
      'brazil': 'BRL',
      'spain': 'EUR',
      'japan': 'JPY',
      'mexico': 'MXN',
      'united kingdom': 'GBP',
      'france': 'EUR',
      'germany': 'EUR',
      'italy': 'EUR',
      'china': 'CNY',
      'south korea': 'KRW',
      'thailand': 'THB',
      'australia': 'AUD',
      'canada': 'CAD',
    };
    return currencies[country.toLowerCase()] || 'USD';
  }

  /**
   * Synthesize Perplexity research using Claude
   * Claude parses research text and structures it as DestinationIntelligence
   */
  private async synthesizePerplexityResearch(
    query: DestinationQuery,
    research: PerplexityResearchResults,
    currencyData?: any
  ): Promise<DestinationIntelligence> {
    const systemPrompt = `You are a travel data analyst expert at parsing research into structured destination intelligence.

Parse the research below and extract key information into a structured JSON format matching the DestinationIntelligence interface.

Key requirements:
1. Extract ALL numerical data (prices, costs, ranges) with proper currency codes
2. Extract cultural tips, language phrases, and safety information
3. Calculate feasibility of budget based on extracted costs
4. Generate personalized recommendations based on user interests
5. Include warnings if budget seems insufficient

CRITICAL: The costAnalysis.flights object MUST have this exact structure:
{
  "currentPrice": {
    "amount": <number>,
    "currency": "USD",
    "route": "<origin> → <destination>"
  },
  "priceRange": {
    "min": <number>,
    "max": <number>,
    "average": <number>
  },
  "trend": "stable" | "increasing" | "decreasing",
  "prediction": "<string>",
  "bookingRecommendation": "<string>",
  "bestTimeToBook": "<string>"
}

🔴 CRITICAL: Essential Phrases MUST be in the LOCAL LANGUAGE, not English placeholders!
For culturalGuide.language.essentialPhrases, you MUST provide at least 5 REAL phrases in the destination's native language with:
- "phrase": The actual phrase in the local language (e.g., "Olá" for Portuguese, not "Hello")
- "translation": The English meaning
- "pronunciation": Simple phonetic spelling (e.g., "oh-LAH")

Required phrases to include:
1. Hello/Hi
2. Thank you
3. Please
4. How much does this cost?
5. Where is...?

Example for Brazil:
{
  "phrase": "Quanto custa?",
  "translation": "How much does this cost?",
  "pronunciation": "KWAN-too KOOS-tah"
}

DO NOT use generic placeholders like "Local hello" - provide REAL language phrases!

Return ONLY valid JSON - no markdown, no explanations, just the JSON object.`;

    const prompt = `Parse this destination research for ${query.city}, ${query.country}:

**User Context:**
- Origin: ${query.origin.city || query.origin.state || query.origin.country}
- Duration: ${query.durationMonths} months
- Budget: ${query.currency} ${query.budget}
- Interests: ${query.interests.join(', ')}

${currencyData ? `
**LIVE CURRENCY EXCHANGE RATE (USE THIS FOR COST CONVERSIONS):**
- Exchange Rate: 1 ${currencyData.fromCurrency} = ${currencyData.exchangeRate} ${currencyData.toCurrency}
- Budget in Local Currency: ${currencyData.budgetInLocalCurrency.toFixed(2)} ${currencyData.toCurrency}

🔴 CRITICAL: The research below contains costs in ${currencyData.toCurrency}. You MUST convert these to USD using the exchange rate above: divide by ${currencyData.exchangeRate}.
For example: ${currencyData.toCurrency} 5,000 ÷ ${currencyData.exchangeRate} = $${(5000 / currencyData.exchangeRate).toFixed(2)} USD
` : ''}

**RESEARCH FROM 5 AGENTS:**

=== HOUSING RESEARCH ===
${research.housing}

=== CULTURAL INTELLIGENCE ===
${research.cultural}

=== SAFETY & NEWS ===
${research.safety}

=== COST OF LIVING ===
${research.costs}

=== FLIGHT INTELLIGENCE ===
${research.flights}

===

Synthesize this research into comprehensive destination intelligence JSON with:
- costAnalysis (extract all prices${currencyData ? ` in ${currencyData.toCurrency} and convert to USD using the exchange rate ${currencyData.exchangeRate}` : ' and convert to USD'})
- culturalGuide (customs, phrases, safety ratings)
- budgetPlan (calculate monthly breakdown based on ${query.budget} for ${query.durationMonths} months)
- recommendations (personalized for interests: ${query.interests.join(', ')})
- alerts (price, currency, seasonal warnings)

Return structured DestinationIntelligence JSON:`;

    try {
      const response = await sendOpenAIMessage(prompt, systemPrompt, 4000);
      console.log('[DestAgent/Perplexity] OpenAI response length:', response.length, 'chars');

      const intelligence = JSON.parse(response);

      console.log('[DestAgent/Perplexity] Parsed intelligence keys:', Object.keys(intelligence));
      console.log('[DestAgent/Perplexity] flights structure:', JSON.stringify(intelligence.costAnalysis?.flights, null, 2));

      // Validate and fix flights structure if needed
      if (!intelligence.costAnalysis?.flights?.currentPrice) {
        console.error('[DestAgent/Perplexity] ❌ MISSING flights.currentPrice in Perplexity synthesis');
        console.error('[DestAgent/Perplexity] Current flights object:', JSON.stringify(intelligence.costAnalysis?.flights, null, 2));
        console.error('[DestAgent/Perplexity] Applying fallback structure...');

        intelligence.costAnalysis = intelligence.costAnalysis || {};
        intelligence.costAnalysis.flights = {
          currentPrice: {
            amount: intelligence.costAnalysis.flights?.amount || 800,
            currency: 'USD',
            route: `${query.origin.state || query.origin.country} → ${query.city}`,
          },
          priceRange: {
            min: intelligence.costAnalysis.flights?.priceRange?.min || 600,
            max: intelligence.costAnalysis.flights?.priceRange?.max || 1100,
            average: intelligence.costAnalysis.flights?.priceRange?.average || 800,
          },
          trend: intelligence.costAnalysis.flights?.trend || 'stable',
          prediction: intelligence.costAnalysis.flights?.prediction || 'Prices vary by season',
          bookingRecommendation: intelligence.costAnalysis.flights?.bookingRecommendation || 'Book 6-8 weeks in advance for best prices',
          bestTimeToBook: intelligence.costAnalysis.flights?.bestTimeToBook || 'Weekdays typically offer better rates',
        };
      } else {
        console.log('[DestAgent/Perplexity] ✅ flights.currentPrice structure is correct');
      }

      // Validate and fix housing structure if needed
      console.log('[DestAgent/Perplexity] housing structure:', JSON.stringify(intelligence.costAnalysis?.housing, null, 2));
      
      // Check if housing structure exists and is valid
      const housing = intelligence.costAnalysis?.housing;
      
      if (!housing || !housing.studentHousing || !housing.airbnb || !housing.apartments) {
        console.error('[DestAgent/Perplexity] ❌ INVALID housing structure - rebuilding from scratch...');
        
        // Extract any available price info
        let baseMin = 300, baseMax = 600, baseAvg = 450;
        
        if (housing && housing.monthlyRange) {
          baseMin = housing.monthlyRange.min || 300;
          baseMax = housing.monthlyRange.max || 600;
          baseAvg = Math.round((baseMin + baseMax) / 2);
        }
        
        // Rebuild complete housing structure
        intelligence.costAnalysis = intelligence.costAnalysis || {};
        intelligence.costAnalysis.housing = {
          studentHousing: {
            monthly: {
              min: baseMin,
              max: baseMax,
              average: baseAvg
            },
            availability: housing?.availability || 'medium',
            options: housing?.options || ['Student housing', 'Shared apartments', 'Dormitories']
          },
          airbnb: {
            monthly: {
              min: Math.round(baseMin * 1.5),
              max: Math.round(baseMax * 2),
              average: Math.round(baseAvg * 1.7)
            },
            neighborhoods: ['City center', 'Student districts', 'Popular areas']
          },
          apartments: {
            monthly: {
              min: Math.round(baseMin * 1.2),
              max: Math.round(baseMax * 1.5),
              average: Math.round(baseAvg * 1.4)
            },
            typical: housing?.type || 'Studio and one-bedroom apartments available'
          },
          recommendations: housing?.recommendations || [
            'Consider shared housing to reduce costs',
            'Check university housing office for verified listings',
            'Student areas often offer better value and community'
          ]
        };
        console.log('[DestAgent/Perplexity] ✅ Rebuilt complete housing structure');
      } else {
        // Housing types exist, but check if monthly is missing in each
        if (housing.studentHousing && !housing.studentHousing.monthly) {
          console.error('[DestAgent/Perplexity] ❌ MISSING studentHousing.monthly - fixing...');
          const sh = housing.studentHousing;
          
          if (typeof sh.min === 'number' || typeof sh.average === 'number') {
            intelligence.costAnalysis.housing.studentHousing = {
              monthly: {
                min: sh.min || 300,
                max: sh.max || 600,
                average: sh.average || 450
              },
              availability: sh.availability || 'medium',
              options: sh.options || ['Student housing', 'Dormitories']
            };
            console.log('[DestAgent/Perplexity] ✅ Fixed studentHousing structure');
          }
        }
        
        if (housing.airbnb && !housing.airbnb.monthly) {
          console.error('[DestAgent/Perplexity] ❌ MISSING airbnb.monthly - fixing...');
          const ab = housing.airbnb;
          
          if (typeof ab.min === 'number' || typeof ab.average === 'number') {
            intelligence.costAnalysis.housing.airbnb = {
              monthly: {
                min: ab.min || 500,
                max: ab.max || 1200,
                average: ab.average || 800
              },
              neighborhoods: ab.neighborhoods || ['City center', 'Student areas']
            };
            console.log('[DestAgent/Perplexity] ✅ Fixed airbnb structure');
          }
        }
        
        if (housing.apartments && !housing.apartments.monthly) {
          console.error('[DestAgent/Perplexity] ❌ MISSING apartments.monthly - fixing...');
          const apt = housing.apartments;
          
          if (typeof apt.min === 'number' || typeof apt.average === 'number') {
            intelligence.costAnalysis.housing.apartments = {
              monthly: {
                min: apt.min || 400,
                max: apt.max || 900,
                average: apt.average || 650
              },
              typical: apt.typical || 'Studio apartments available'
            };
            console.log('[DestAgent/Perplexity] ✅ Fixed apartments structure');
          }
        }
      }

      // Validate and fix livingCosts structure
      console.log('[DestAgent/Perplexity] livingCosts structure:', JSON.stringify(intelligence.costAnalysis?.livingCosts, null, 2));
      
      const livingCosts = intelligence.costAnalysis?.livingCosts;
      
      if (!livingCosts || !livingCosts.food || !livingCosts.transport || !livingCosts.entertainment || !livingCosts.utilities || !livingCosts.total) {
        console.error('[DestAgent/Perplexity] ❌ INVALID livingCosts structure - rebuilding...');
        
        // Calculate base estimates from housing if available
        const housingAvg = intelligence.costAnalysis?.housing?.studentHousing?.monthly?.average || 450;
        
        intelligence.costAnalysis = intelligence.costAnalysis || {};
        intelligence.costAnalysis.livingCosts = {
          food: {
            monthly: { min: 200, max: 400, average: 300 },
            groceries: 150,
            restaurants: 100,
            studentMeals: 50
          },
          transport: {
            monthly: { min: 40, max: 80, average: 60 },
            publicTransport: 'Public transport pass available',
            studentDiscounts: ['Student discounts available']
          },
          entertainment: {
            monthly: { min: 50, max: 200, average: 100 },
            activities: ['Movies', 'Cafes', 'Cultural events']
          },
          utilities: {
            monthly: { min: 40, max: 100, average: 60 },
            included: ['Often included in student housing']
          },
          total: {
            monthly: { 
              min: Math.round(housingAvg * 0.5 + 330),
              max: Math.round(housingAvg + 780),
              average: Math.round(housingAvg + 520)
            }
          }
        };
        console.log('[DestAgent/Perplexity] ✅ Rebuilt livingCosts structure');
      } else {
        // Validate individual components have monthly nested structure
        ['food', 'transport', 'entertainment', 'utilities', 'total'].forEach(category => {
          if (livingCosts[category] && !livingCosts[category].monthly) {
            console.error(`[DestAgent/Perplexity] ❌ MISSING ${category}.monthly - fixing...`);
            const cat = livingCosts[category];
            
            if (typeof cat.min === 'number' || typeof cat.average === 'number') {
              intelligence.costAnalysis.livingCosts[category] = {
                ...cat,
                monthly: {
                  min: cat.min || 50,
                  max: cat.max || 200,
                  average: cat.average || 100
                }
              };
              console.log(`[DestAgent/Perplexity] ✅ Fixed ${category} structure`);
            }
          }
        });
      }

      // Validate currency structure - DO NOT default to 1.0, only validate structure
      if (!intelligence.costAnalysis?.currency || !intelligence.costAnalysis.currency.exchangeRate || intelligence.costAnalysis.currency.exchangeRate === 1.0) {
        console.error('[DestAgent/Perplexity] ❌ INVALID currency data - OpenAI did not properly use the real exchange rate!');
        console.error('[DestAgent/Perplexity] Current currency object:', JSON.stringify(intelligence.costAnalysis?.currency, null, 2));
        
        // If we have real currency data from the API, it will be injected later in synthesizeMultiSourceData
        // For now, just ensure the structure exists so it can be replaced
        const localCurrency = this.getLocalCurrency(query.country);
        
        intelligence.costAnalysis = intelligence.costAnalysis || {};
        intelligence.costAnalysis.currency = {
          exchangeRate: 0, // PLACEHOLDER - will be replaced with real API data
          fromCurrency: query.currency || 'USD',
          toCurrency: localCurrency,
          trend: 'stable',
          impact: 'Fetching live exchange rates...',
          budgetInLocalCurrency: 0, // PLACEHOLDER
          recommendation: 'Live currency data will be loaded'
        };
        console.log('[DestAgent/Perplexity] ⚠️ Added placeholder currency structure (will be replaced with real API data)');
      } else {
        console.log('[DestAgent/Perplexity] ✅ Currency structure exists');
      }

      // Validate budgetPlan structure
      if (!intelligence.budgetPlan || !intelligence.budgetPlan.breakdown || !intelligence.budgetPlan.feasibility) {
        console.error('[DestAgent/Perplexity] ❌ MISSING budgetPlan - rebuilding...');
        
        const monthlyBudget = query.budget / query.durationMonths;
        const housingCost = intelligence.costAnalysis?.housing?.studentHousing?.monthly?.average || 450;
        const foodCost = intelligence.costAnalysis?.livingCosts?.food?.monthly?.average || 300;
        const transportCost = intelligence.costAnalysis?.livingCosts?.transport?.monthly?.average || 60;
        const entertainmentCost = intelligence.costAnalysis?.livingCosts?.entertainment?.monthly?.average || 100;
        const utilitiesCost = intelligence.costAnalysis?.livingCosts?.utilities?.monthly?.average || 60;
        
        const totalMonthlyCost = housingCost + foodCost + transportCost + entertainmentCost + utilitiesCost;
        
        let feasibility: 'comfortable' | 'tight' | 'insufficient';
        if (monthlyBudget >= totalMonthlyCost * 1.2) {
          feasibility = 'comfortable';
        } else if (monthlyBudget >= totalMonthlyCost * 0.9) {
          feasibility = 'tight';
        } else {
          feasibility = 'insufficient';
        }
        
        intelligence.budgetPlan = {
          totalBudget: query.budget,
          duration: query.durationMonths,
          breakdown: {
            housing: {
              amount: housingCost,
              percentage: Math.round((housingCost / totalMonthlyCost) * 100),
              recommendation: 'Consider shared housing for better value'
            },
            food: {
              amount: foodCost,
              percentage: Math.round((foodCost / totalMonthlyCost) * 100),
              recommendation: 'Mix cooking at home with affordable local restaurants'
            },
            transport: {
              amount: transportCost,
              percentage: Math.round((transportCost / totalMonthlyCost) * 100),
              recommendation: 'Get a student transport pass'
            },
            activities: {
              amount: entertainmentCost,
              percentage: Math.round((entertainmentCost / totalMonthlyCost) * 100),
              recommendation: 'Take advantage of free cultural events'
            },
            utilities: {
              amount: utilitiesCost,
              percentage: Math.round((utilitiesCost / totalMonthlyCost) * 100),
              recommendation: 'Often included in student housing'
            },
            emergency: {
              amount: 0,
              percentage: 0,
              recommendation: 'Set aside emergency funds if possible'
            }
          },
          monthlyAllocation: [],
          savingTips: [
            'Cook at home to save on food costs',
            'Use public transportation with student discounts',
            'Look for free cultural events and activities',
            'Share accommodation to reduce housing costs',
            'Buy groceries at local markets'
          ],
          costOptimizationStrategies: [
            'Live with roommates to split costs',
            'Cook meals at home',
            'Use student discounts wherever possible'
          ],
          feasibility: feasibility,
          warningFlags: feasibility === 'insufficient' ? ['Budget may be insufficient for comfortable living'] : []
        };
        console.log('[DestAgent/Perplexity] ✅ Rebuilt budgetPlan structure');
      }

      // Validate culturalGuide structure
      if (!intelligence.culturalGuide || !intelligence.culturalGuide.language || !intelligence.culturalGuide.safety) {
        console.error('[DestAgent/Perplexity] ❌ MISSING culturalGuide - rebuilding...');
        
        intelligence.culturalGuide = {
          localCustoms: {
            greetings: ['Hello', 'Good morning', 'Good evening'],
            diningEtiquette: ['Wait to be seated', 'Table manners'],
            socialNorms: ['Be respectful', 'Learn basic phrases'],
            tipping: 'Tipping is customary at 10-15%',
            importantDos: ['Respect local customs', 'Learn basic language', 'Be punctual'],
            importantDonts: ['Avoid loud behavior', 'Don\'t assume everyone speaks English']
          },
          studentLife: {
            popularActivities: ['Student clubs', 'Sports', 'Cultural events'],
            studentDiscounts: ['Museums', 'Transportation', 'Entertainment'],
            socialGroups: ['International student association', 'Study groups'],
            upcomingEvents: ['Orientation', 'Welcome week', 'Cultural festivals'],
            bestNeighborhoods: ['University district', 'Student areas']
          },
          language: {
            primaryLanguage: 'Local language',
            essentialPhrases: [
              { phrase: 'Hello', translation: 'Local hello', pronunciation: 'Pronunciation' },
              { phrase: 'Thank you', translation: 'Local thank you', pronunciation: 'Pronunciation' },
              { phrase: 'Please', translation: 'Local please', pronunciation: 'Pronunciation' },
              { phrase: 'Excuse me', translation: 'Local excuse me', pronunciation: 'Pronunciation' },
              { phrase: 'How much?', translation: 'Local how much', pronunciation: 'Pronunciation' },
              { phrase: 'Where is...?', translation: 'Local where is', pronunciation: 'Pronunciation' }
            ],
            englishProficiency: 'medium',
            languageLearningResources: ['Language apps', 'Local classes', 'Language exchange']
          },
          safety: {
            overallRating: 7,
            safeNeighborhoods: ['City center', 'University area', 'Residential districts'],
            areasToAvoid: ['Avoid isolated areas at night'],
            emergencyContacts: [
              { service: 'Emergency', number: '911' },
              { service: 'Police', number: 'Local police' },
              { service: 'Hospital', number: 'Local hospital' }
            ],
            safetyTips: [
              'Stay aware of your surroundings',
              'Keep valuables secure',
              'Use registered transportation',
              'Travel in groups at night'
            ]
          },
          culturalContext: {
            connectionToOrigin: [`Connections to ${query.origin.country}`],
            similarities: ['Cultural similarities'],
            differences: ['Cultural differences to be aware of'],
            adaptationTips: ['Be open-minded', 'Ask questions', 'Embrace new experiences']
          }
        };
        console.log('[DestAgent/Perplexity] ✅ Rebuilt culturalGuide structure');
      } else {
        // Validate sub-structures
        if (!intelligence.culturalGuide.language.essentialPhrases || !Array.isArray(intelligence.culturalGuide.language.essentialPhrases)) {
          intelligence.culturalGuide.language.essentialPhrases = [
            { phrase: 'Hello', translation: 'Local hello', pronunciation: 'Pronunciation' },
            { phrase: 'Thank you', translation: 'Local thank you', pronunciation: 'Pronunciation' }
          ];
        }
        if (!intelligence.culturalGuide.safety.safeNeighborhoods || !Array.isArray(intelligence.culturalGuide.safety.safeNeighborhoods)) {
          intelligence.culturalGuide.safety.safeNeighborhoods = ['City center', 'University area'];
        }
        if (!intelligence.culturalGuide.safety.areasToAvoid || !Array.isArray(intelligence.culturalGuide.safety.areasToAvoid)) {
          intelligence.culturalGuide.safety.areasToAvoid = [];
        }
        if (typeof intelligence.culturalGuide.safety.overallRating !== 'number') {
          intelligence.culturalGuide.safety.overallRating = 7;
        }
      }

      // Validate recommendations structure
      if (!intelligence.recommendations || !intelligence.recommendations.basedOnInterests) {
        console.error('[DestAgent/Perplexity] ❌ MISSING recommendations - rebuilding...');
        
        // Build recommendations based on user interests
        const interestRecs = query.interests.map(interest => ({
          interest: interest,
          recommendations: [
            `${interest} activities in ${query.city}`,
            `Best places for ${interest}`,
            `Student-friendly ${interest} spots`
          ]
        }));
        
        intelligence.recommendations = {
          basedOnInterests: interestRecs.length > 0 ? interestRecs : [
            { interest: 'culture', recommendations: ['Local cultural sites', 'Museums', 'Art galleries'] },
            { interest: 'food', recommendations: ['Local restaurants', 'Street food', 'Markets'] }
          ],
          basedOnOrigin: {
            culturalConnections: [`Communities from ${query.origin.country}`, 'International student groups'],
            foodSimilarities: ['International cuisine options', 'Familiar food stores'],
            communityGroups: ['Expat groups', 'Student associations']
          },
          basedOnBudget: {
            affordable: ['Free walking tours', 'Public parks', 'Student discounts'],
            splurgeWorthy: ['Special cultural events', 'Weekend trips', 'Fine dining'],
            free: ['Free museums', 'Public events', 'Parks and beaches']
          },
          studentSpecific: {
            campusLife: ['Student clubs', 'Campus events', 'Study groups'],
            academicResources: ['Libraries', 'Study spaces', 'Academic support'],
            networkingOpportunities: ['Student mixers', 'Career fairs', 'Alumni networks']
          }
        };
        console.log('[DestAgent/Perplexity] ✅ Rebuilt recommendations structure');
      } else {
        // Validate basedOnInterests is an array
        if (!Array.isArray(intelligence.recommendations.basedOnInterests)) {
          intelligence.recommendations.basedOnInterests = [
            { interest: 'culture', recommendations: ['Local cultural sites'] }
          ];
        }
      }

      return {
        ...intelligence,
        query,
        generatedAt: new Date().toISOString(),
        confidence: 0.95, // High confidence from real research
      };
    } catch (error) {
      console.error('[DestAgent] Synthesis failed:', error);
      throw error;
    }
  }

  /**
   * Fallback query parser (simple pattern matching)
   */
  private fallbackParse(rawQuery: string): DestinationQuery {
    // Enhanced extraction patterns with broader coverage

    // Extract location - try multiple patterns
    const locationPatterns = [
      // "Tokyo, Japan" format (city, country)
      /^([A-Za-zÀ-ÿ\s]+),\s*([A-Za-zÀ-ÿ\s]+?)\s*(?:-|for|with|$)/i,
      // "studying at FGV in São Paulo"
      /studying\s+(?:at|in)\s+\w+\s+in\s+([A-Za-zÀ-ÿ\s]+?)(?:,|\s+for|\s+with)/i,
      // "going to Barcelona", "to Barcelona", "in Barcelona"
      /(?:going\s+to|to|in)\s+([A-Za-zÀ-ÿ\s]+?)(?:\s+for|\s+with|\s+,|\s+€|\s+\$|$)/i,
      // "Bolivia for 6 months" (bare country/city at start)
      /^([A-Za-zÀ-ÿ\s]+?)(?:\s+for|\s+with|\s+\$)/i,
      // "London study abroad" (city THEN study keyword)
      /^([A-Za-zÀ-ÿ\s]+?)\s+(?:study|studying|semester)/i,
    ];

    let destination: string | null = null;
    let specifiedCountry: string | null = null;

    for (const pattern of locationPatterns) {
      const match = rawQuery.match(pattern);
      if (match && match[1]) {
        destination = match[1].trim();
        // Check if pattern captured country separately (pattern 1)
        if (match[2]) {
          specifiedCountry = match[2].trim();
        }
        break;
      }
    }

    // Extract budget with improved number parsing
    // IMPORTANT: Must look for budget context to avoid matching duration numbers
    const budgetPatterns = [
      // "budget of $3500", "$3500 budget", "with $3500", etc.
      /(?:budget\s+(?:of\s+)?|with\s+)(\$|€|£|¥|R\$)?\s*(\d+(?:,\d{3})*(?:\.\d+)?)/i,
      // Currency symbol + number (but NOT followed by "month" to avoid duration)
      /(\$|€|£|¥|R\$)\s*(\d+(?:,\d{3})*(?:\.\d+)?)(?!\s*month)/i,
      // "2000 USD", "1500 EUR" format
      /(\d+(?:,\d{3})*(?:\.\d+)?)\s+(USD|EUR|GBP|JPY|BRL|dollars?|euros?|pounds?)/i,
    ];

    let budgetValue = 2000; // Default fallback
    let currency = 'USD';

    for (const pattern of budgetPatterns) {
      const match = rawQuery.match(pattern);
      if (match) {
        // Extract number - could be in group 1 or 2 depending on pattern
        let numberStr: string;
        if (/^\d/.test(match[1])) {
          // Pattern 3: number is in group 1
          numberStr = match[1].replace(/,/g, '');
        } else {
          // Patterns 1-2: number is in group 2
          numberStr = match[2].replace(/,/g, '');
        }
        budgetValue = parseFloat(numberStr);

        // Determine currency from symbol or text
        const currencyIndicator = match[1] || match[2] || match[3] || '';
        if (currencyIndicator === '€' || currencyIndicator.toLowerCase().includes('eur')) {
          currency = 'EUR';
        } else if (currencyIndicator === '£' || currencyIndicator.toLowerCase().includes('pound') || currencyIndicator.toLowerCase().includes('gbp')) {
          currency = 'GBP';
        } else if (currencyIndicator === 'R$' || currencyIndicator.toLowerCase().includes('brl')) {
          currency = 'BRL';
        } else if (currencyIndicator === '¥' || currencyIndicator.toLowerCase().includes('jpy')) {
          currency = 'JPY';
        }

        break;
      }
    }

    // Extract duration
    const durationMatch = rawQuery.match(/(\d+)\s*(month|months|semester|week|weeks)/i);
    let durationMonths = 4; // Default
    if (durationMatch) {
      const number = parseInt(durationMatch[1]);
      const unit = durationMatch[2].toLowerCase();
      durationMonths = unit.includes('week') ? Math.ceil(number / 4) :
                       unit.includes('semester') ? 4 : number;
    }

    // Extract interests
    const interests: string[] = [];
    if (/art/i.test(rawQuery)) interests.push('art');
    if (/food|culinary|cuisine/i.test(rawQuery)) interests.push('food');
    if (/museum/i.test(rawQuery)) interests.push('museums');
    if (/night|club/i.test(rawQuery)) interests.push('nightlife');
    if (/tech|technology|engineering/i.test(rawQuery)) interests.push('technology');
    if (/architecture/i.test(rawQuery)) interests.push('architecture');
    if (/music|concert/i.test(rawQuery)) interests.push('music');
    if (/sport|fitness/i.test(rawQuery)) interests.push('sports');
    if (/beach|surf/i.test(rawQuery)) interests.push('beaches');
    if (/nature|hiking|outdoor/i.test(rawQuery)) interests.push('nature');

    // Extract origin - MUST have context words to avoid matching destination
    const originPatterns = [
      // "from Virginia" or "coming from Bolivia" - explicit origin context
      /(?:from|coming from|currently in|living in)\s+([A-Za-zÀ-ÿ\s]+?)(?:,|\s+|$)/i,
    ];

    let originCountry = 'United States'; // Default
    let originState: string | undefined;

    for (const pattern of originPatterns) {
      const match = rawQuery.match(pattern);
      if (match && match[1]) {
        const location = match[1].trim();

        // Check if it's a US state
        if (/Virginia|California|New York|Texas|Florida|Illinois|Washington|Massachusetts/i.test(location)) {
          originCountry = 'United States';
          originState = location;
          break;
        }

        // Check if it's a Latin American country
        if (/Bolivia|Honduras|Mexico|Brazil|Colombia|Argentina|Peru|Venezuela/i.test(location)) {
          originCountry = location;
          originState = undefined;
          break;
        }
      }
    }

    // Parse destination using location parser if possible
    let city = destination || 'Barcelona'; // More neutral default
    let country = specifiedCountry || 'Spain'; // More neutral default

    if (destination) {
      // Capitalize destination properly
      city = destination.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

      // If country was specified explicitly in query (e.g., "Tokyo, Japan")
      if (specifiedCountry) {
        // Normalize and map country names
        const countryNormalizations: Record<string, string> = {
          'japan': 'Japan',
          'spain': 'Spain',
          'uk': 'United Kingdom',
          'united kingdom': 'United Kingdom',
          'england': 'United Kingdom',
          'brazil': 'Brazil',
          'france': 'France',
          'germany': 'Germany',
          'italy': 'Italy',
          'usa': 'United States',
          'us': 'United States',
          'united states': 'United States',
        };
        country = countryNormalizations[specifiedCountry.toLowerCase()] ||
                  specifiedCountry.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      } else {
        // Try to infer country from city name
        const lowerDest = destination.toLowerCase();

        // Check against known city-country mappings
        const cityCountryMap: Record<string, { city: string; country: string }> = {
          'barcelona': { city: 'Barcelona', country: 'Spain' },
          'são paulo': { city: 'São Paulo', country: 'Brazil' },
          'sao paulo': { city: 'São Paulo', country: 'Brazil' },
          'tokyo': { city: 'Tokyo', country: 'Japan' },
          'london': { city: 'London', country: 'United Kingdom' },
          'paris': { city: 'Paris', country: 'France' },
          'berlin': { city: 'Berlin', country: 'Germany' },
          'rome': { city: 'Rome', country: 'Italy' },
          'madrid': { city: 'Madrid', country: 'Spain' },
          'amsterdam': { city: 'Amsterdam', country: 'Netherlands' },
          'bolivia': { city: 'La Paz', country: 'Bolivia' },
          'honduras': { city: 'Tegucigalpa', country: 'Honduras' },
          'mexico': { city: 'Mexico City', country: 'Mexico' },
          'colombia': { city: 'Bogotá', country: 'Colombia' },
          'peru': { city: 'Lima', country: 'Peru' },
        };

        const match = cityCountryMap[lowerDest];
        if (match) {
          city = match.city;
          country = match.country;
        } else {
          country = 'Unknown';
        }
      }
    }

    // Create parsed location metadata for currency service
    const parsedLocation: ParsedLocation = {
      city,
      country,
      countryCode: 'XX', // Fallback mode doesn't have country code
      timezone: 'UTC',
      primaryLanguage: 'English',
      currency,
      coordinates: {
        lat: 0,
        lng: 0,
      },
    };

    const parsedOrigin: UserOrigin = {
      city: undefined,
      state: originState,
      country: originCountry,
      countryCode: 'XX', // Fallback mode doesn't have country code
    };

    return {
      rawQuery,
      city,
      country,
      duration: `${durationMonths} months`,
      durationMonths,
      budget: budgetValue,
      currency,
      interests: interests.length > 0 ? interests : ['culture', 'food'],
      origin: {
        country: originCountry,
        state: originState,
      },
      metadata: {
        parsedLocation,
        parsedOrigin,
      },
    };
  }

  /**
   * Mock intelligence data for demo mode or API fallback
   */
  private getMockIntelligence(query: DestinationQuery): DestinationIntelligence {
    const isSaoPaulo = query.city.toLowerCase().includes('são paulo') || query.city.toLowerCase().includes('sao paulo');

    if (isSaoPaulo) {
      return {
        query,
        summary: `Comprehensive analysis for studying in São Paulo, Brazil for ${query.durationMonths} months with a budget of ${query.currency} ${query.budget}. São Paulo offers excellent value for students with vibrant cultural scene and affordable living costs.`,
        costAnalysis: {
          flights: {
            currentPrice: {
              amount: 850,
              currency: 'USD',
              route: 'Washington DC (IAD) → São Paulo (GRU)',
            },
            priceRange: { min: 650, max: 1200, average: 850 },
            trend: 'stable',
            prediction: 'Prices typically increase 15-20% during December-January (summer season in Brazil)',
            bookingRecommendation: 'Book 6-8 weeks in advance for best prices. Avoid booking during Brazilian holidays.',
            bestTimeToBook: 'March-May and September-November for lowest fares',
          },
          housing: {
            studentHousing: {
              monthly: { min: 300, max: 600, average: 450 },
              availability: 'high',
              options: ['FGV dormitories', 'Republic houses (shared student homes)', 'University partnerships'],
            },
            airbnb: {
              monthly: { min: 500, max: 1200, average: 800 },
              neighborhoods: ['Vila Madalena (bohemian, artistic)', 'Pinheiros (trendy, student-friendly)', 'Jardins (upscale)'],
            },
            apartments: {
              monthly: { min: 400, max: 900, average: 650 },
              typical: 'Studio apartments near FGV range from $400-700/month. Share with roommate to save 30-40%.',
            },
            recommendations: [
              'Stay near Pinheiros or Vila Madalena for easy access to FGV and cultural activities',
              'Shared republics are popular among students - culturally immersive and budget-friendly',
              'Check FGV housing office for verified listings and roommate matching',
            ],
          },
          livingCosts: {
            food: {
              monthly: { min: 200, max: 400, average: 300 },
              groceries: 150,
              restaurants: 100,
              studentMeals: 50,
            },
            transport: {
              monthly: { min: 40, max: 80, average: 60 },
              publicTransport: 'Bilhete Único (metro + bus): ~$50/month with student discount',
              studentDiscounts: ['50% off metro with student ID', 'Student bus pass available'],
            },
            entertainment: {
              monthly: { min: 100, max: 300, average: 200 },
              activities: ['Museums (many free on specific days)', 'Live music venues', 'Art galleries', 'Parks and markets'],
            },
            utilities: {
              monthly: { min: 50, max: 100, average: 75 },
              included: ['Often included in student housing', 'Internet and water usually separate'],
            },
            total: {
              monthly: { min: 390, max: 880, average: 635 },
            },
          },
          currency: {
            exchangeRate: 5.2,
            fromCurrency: 'USD',
            toCurrency: 'BRL',
            trend: 'stable',
            impact: `Your $${query.budget} equals approximately R$${(query.budget * 5.2).toFixed(2)} Brazilian Reais. The Real has been relatively stable against USD, making budget planning easier.`,
            budgetInLocalCurrency: query.budget * 5.2,
            recommendation: 'Open a Brazilian bank account (Nubank or C6 Bank) to avoid international transaction fees. Use Wise/Remitly for currency exchange.',
          },
        },
        culturalGuide: {
          localCustoms: {
            greetings: [
              'Brazilians greet with a kiss on the cheek (or two in São Paulo)',
              'Handshakes are common in formal settings',
              'First names are used frequently, even in professional contexts',
            ],
            diningEtiquette: [
              'Lunch is the main meal (12-2pm), dinner is late (8-10pm)',
              'Service charge (10%) is expected at restaurants',
              'Sharing food is common and encouraged',
              'Try pão de queijo, feijoada, and brigadeiros',
            ],
            socialNorms: [
              'Brazilians are warm, friendly, and physically expressive',
              'Being 15-30 minutes late is socially acceptable ("Brazilian time")',
              'Family is central to Brazilian culture',
              'Football (soccer) is a major conversation topic',
            ],
            tipping: '10% service charge is standard and often included in the bill',
            importantDos: [
              'Learn basic Portuguese - effort is appreciated',
              'Join in social events and festivals',
              'Try local foods and street markets',
              'Attend a Samba school or football match',
            ],
            importantDonts: [
              'Don\'t make the "OK" hand gesture (offensive in Brazil)',
              'Avoid discussing Argentina vs Brazil football rivalry',
              'Don\'t be overly punctual - flexibility is valued',
              'Don\'t refuse food/drink offers - it\'s considered rude',
            ],
          },
          studentLife: {
            popularActivities: [
              'MASP (São Paulo Museum of Art) - free on Tuesdays',
              'Ibirapuera Park - largest urban park, great for picnics',
              'Saturday morning at Municipal Market (Mercadão)',
              'Beco do Batman - street art alley in Vila Madalena',
              'Avenida Paulista - cultural center with free events',
            ],
            studentDiscounts: [
              'Museums: 50% off or free with student ID',
              'Cinema: Student tickets available at all major chains',
              'Transport: 50% discount on metro/bus',
              'Theater: Student rush tickets common',
            ],
            socialGroups: [
              'FGV International Students Association',
              'Couchsurfing São Paulo meetups',
              'Language exchange groups (Facebook: "São Paulo Language Exchange")',
              'Meetup.com events for expats and international students',
            ],
            upcomingEvents: [
              'Carnaval (February) - massive street parties',
              'Virada Cultural (May) - 24-hour cultural festival',
              'São Paulo Fashion Week',
              'International Film Festival (October)',
            ],
            bestNeighborhoods: [
              'Vila Madalena - bohemian, artistic, lots of students',
              'Pinheiros - trendy, near FGV, great nightlife',
              'Itaim Bibi - young professionals, safe, modern',
              'Jardins - upscale but accessible, many cultural venues',
            ],
          },
          language: {
            primaryLanguage: 'Portuguese (Brazilian)',
            essentialPhrases: [
              { phrase: 'Bom dia', translation: 'Good morning', pronunciation: 'bohm DEE-ah' },
              { phrase: 'Obrigado/a', translation: 'Thank you', pronunciation: 'oh-bree-GAH-doh/dah' },
              { phrase: 'Por favor', translation: 'Please', pronunciation: 'pohr fah-VOHR' },
              { phrase: 'Quanto custa?', translation: 'How much?', pronunciation: 'KWAN-toh KOO-stah' },
              { phrase: 'Não entendo', translation: 'I don\'t understand', pronunciation: 'now en-TEN-doh' },
              { phrase: 'Onde fica...?', translation: 'Where is...?', pronunciation: 'OHN-jee FEE-kah' },
            ],
            englishProficiency: 'medium',
            languageLearningResources: [
              'Duolingo Portuguese course',
              'FGV language exchange program',
              'Portuguese classes at Casa do Saber',
              'Practice with locals at language meetups',
            ],
          },
          safety: {
            overallRating: 7,
            safeNeighborhoods: [
              'Pinheiros - well-lit, active, student-friendly',
              'Vila Madalena - busy, safe during day and evening',
              'Jardins - upscale, very safe',
              'Itaim Bibi - business district, secure',
            ],
            areasToAvoid: [
              'Cracolândia (downtown area with drug activity)',
              'Far periphery neighborhoods at night',
              'Empty streets late at night',
            ],
            emergencyContacts: [
              { service: 'Police', number: '190' },
              { service: 'Ambulance', number: '192' },
              { service: 'US Embassy São Paulo', number: '+55 11 5186-7000' },
            ],
            safetyTips: [
              'Don\'t flash expensive electronics or jewelry',
              'Use Uber/99 instead of street taxis at night',
              'Keep copies of passport separate from original',
              'Be aware of surroundings in crowded areas',
              'Stay in well-lit, populated areas at night',
            ],
          },
          culturalContext: {
            connectionToOrigin: [
              'Both US and Brazil are large, diverse countries with immigrant histories',
              'Love of sports and outdoor activities is shared',
              'Musical cultures influence each other (Bossa Nova, Jazz)',
            ],
            similarities: [
              'Friendly, outgoing people',
              'Casual dress in everyday life',
              'Love of coffee and café culture',
              'Appreciation for diversity and multiculturalism',
            ],
            differences: [
              'More physical affection in greetings (kisses, hugs)',
              'Flexible approach to time and scheduling',
              'Greater emphasis on family and social relationships',
              'Less individualistic, more community-oriented',
            ],
            adaptationTips: [
              'Embrace "Brazilian time" - flexibility is key',
              'Make effort to speak Portuguese, even poorly',
              'Join social activities to build your Brazilian network',
              'Be open to different communication styles',
              'Understand that personal space is smaller here',
            ],
          },
        },
        budgetPlan: {
          totalBudget: query.budget,
          duration: query.durationMonths,
          breakdown: {
            housing: {
              amount: 450 * query.durationMonths,
              percentage: 28,
              recommendation: 'Opt for shared student housing or republic to stay within budget',
            },
            food: {
              amount: 300 * query.durationMonths,
              percentage: 19,
              recommendation: 'Cook at home 4-5 days/week, eat at university restaurant, explore local markets',
            },
            transport: {
              amount: 60 * query.durationMonths,
              percentage: 4,
              recommendation: 'Get student metro pass immediately for 50% discount',
            },
            activities: {
              amount: 200 * query.durationMonths,
              percentage: 13,
              recommendation: 'Take advantage of free museum days and student discounts',
            },
            utilities: {
              amount: 75 * query.durationMonths,
              percentage: 5,
              recommendation: 'Usually included in student housing; if not, budget accordingly',
            },
            emergency: {
              amount: query.budget * 0.15,
              percentage: 15,
              recommendation: 'Keep as emergency fund in separate account',
            },
          },
          monthlyAllocation: Array.from({ length: query.durationMonths }, (_, i) => ({
            month: i + 1,
            planned: query.budget / query.durationMonths,
            recommended: 500,
            notes: i === 0 ? 'First month: Higher costs for setup, deposits, initial purchases' : 'Standard month',
          })),
          savingTips: [
            'Cook at home using local markets (Mercadão, Feira de Pinheiros)',
            'Take advantage of free cultural events on Avenida Paulista',
            'Share accommodation with other students',
            'Use student discounts everywhere - always show ID',
            'Buy SIM card locally instead of international roaming',
            'Eat at university restaurant (bandejão) - very affordable',
          ],
          costOptimizationStrategies: [
            'First month budget buffer: Plan $200-300 extra for setup costs',
            'Get Brazilian bank account to avoid forex fees',
            'Buy monthly transport pass instead of pay-per-ride',
            'Join FGV student groups for free/discounted activities',
            'Share textbooks or use library instead of buying',
          ],
          feasibility: query.budget >= 1800 ? 'comfortable' : query.budget >= 1500 ? 'tight' : 'insufficient',
          warningFlags: query.budget < 1500 ? [
            'Budget may be tight for 4 months in São Paulo',
            'Consider part-time work or additional funding',
            'Prioritize essential expenses first',
          ] : [],
        },
        recommendations: {
          basedOnInterests: [
            {
              interest: 'art',
              recommendations: [
                'MASP (Museum of Art) - architectural icon with amazing collection',
                'Pinacoteca - Brazilian art museum, free on Saturdays',
                'Instituto Tomie Ohtake - contemporary art center',
                'Beco do Batman street art alley',
                'Gallery hopping in Vila Madalena on Saturday afternoons',
              ],
            },
            {
              interest: 'food',
              recommendations: [
                'Mercadão Municipal - iconic food market with local specialties',
                'Feira de Pinheiros - Saturday morning market with local produce',
                'Food tour of Liberdade (Japanese neighborhood)',
                'Learn to make brigadeiros and pão de queijo',
                'Try authentic churrascaria (Brazilian barbecue)',
                'Explore street food scene (pastel, coxinha, açaí)',
              ],
            },
          ],
          basedOnOrigin: {
            culturalConnections: [
              'Join American-Brazilian Chamber of Commerce events',
              'Connect with other US students through FGV international office',
              'Virginia has strong ties to Brazilian educational institutions',
            ],
            foodSimilarities: [
              'Both cultures love BBQ (churrasco is Brazilian-style)',
              'Similar café culture and coffee appreciation',
              'Shared love of comfort foods and social dining',
            ],
            communityGroups: [
              'Americans in São Paulo Facebook group',
              'FGV buddy program pairs you with local students',
              'InterNations São Paulo (expat networking)',
            ],
          },
          basedOnBudget: {
            affordable: [
              'Free concerts at SESC venues',
              'Ibirapuera Park for exercise and picnics',
              'Language exchange meetups (free)',
              'Sunday street markets',
              'University cultural events',
            ],
            splurgeWorthy: [
              'Dinner at D.O.M. or Maní (world-class restaurants)',
              'Weekend trip to Rio de Janeiro ($150-200)',
              'Attend a football match at Morumbi Stadium',
              'Rooftop bar in Jardins neighborhood',
            ],
            free: [
              'Avenida Paulista on Sundays (car-free)',
              'Free museums on specific days',
              'Walking tours of historic downtown',
              'Street art tours in Vila Madalena',
              'Parque do Povo for outdoor activities',
            ],
          },
          studentSpecific: {
            campusLife: [
              'Join FGV student organizations and clubs',
              'Attend guest lectures and networking events',
              'Use FGV career services for internship opportunities',
              'Participate in intramural sports',
            ],
            academicResources: [
              'FGV library - excellent business and economics collection',
              'Study groups organized through student association',
              'Professor office hours - Brazilian professors are very accessible',
              'Academic writing center for Portuguese help',
            ],
            networkingOpportunities: [
              'FGV hosts numerous corporate events and career fairs',
              'Connect with Brazilian business leaders through university',
              'Alumni network in both Brazil and internationally',
              'Internship opportunities with multinational companies in São Paulo',
            ],
          },
        },
        alerts: {
          priceAlerts: [
            'Flight prices typically spike during December-February (summer vacation)',
            'Housing costs increase near university start dates (March and August)',
            'Book accommodation at least 1 month before arrival',
          ],
          currencyAlerts: [
            'Brazilian Real can fluctuate ±10% based on political/economic news',
            'Keep some budget in USD as hedge against currency volatility',
            'Use Wise or similar for best exchange rates',
          ],
          seasonalAlerts: [
            'Summer (Dec-Feb): Higher prices, hotter weather, Carnaval crowds',
            'Winter (Jun-Aug): Cooler weather, fewer tourists, lower prices',
            'Rainy season: January-March (afternoon thunderstorms)',
          ],
        },
        generatedAt: new Date().toISOString(),
        confidence: 0.95,
      };
    }

    // Generic fallback for other cities
    return {
      query,
      summary: `Analysis for ${query.city}, ${query.country} is being generated. This is demo data.`,
      costAnalysis: {
        flights: {
          currentPrice: { amount: 800, currency: 'USD', route: `${query.origin.country} → ${query.city}` },
          priceRange: { min: 600, max: 1100, average: 800 },
          trend: 'stable',
          prediction: 'Prices typically vary by season',
          bookingRecommendation: 'Book 6-8 weeks in advance',
          bestTimeToBook: 'Midweek for best prices',
        },
        housing: {
          studentHousing: {
            monthly: { min: 400, max: 800, average: 600 },
            availability: 'medium',
            options: ['University dorms', 'Shared apartments'],
          },
          airbnb: {
            monthly: { min: 700, max: 1500, average: 1000 },
            neighborhoods: ['City center', 'University area'],
          },
          apartments: {
            monthly: { min: 500, max: 1000, average: 750 },
            typical: 'Studio apartments',
          },
          recommendations: ['Stay near campus', 'Share with roommates'],
        },
        livingCosts: {
          food: {
            monthly: { min: 250, max: 500, average: 375 },
            groceries: 200,
            restaurants: 150,
            studentMeals: 25,
          },
          transport: {
            monthly: { min: 50, max: 100, average: 75 },
            publicTransport: 'Student discount available',
            studentDiscounts: ['Metro pass', 'Bus pass'],
          },
          entertainment: {
            monthly: { min: 100, max: 300, average: 200 },
            activities: ['Museums', 'Concerts', 'Parks'],
          },
          utilities: {
            monthly: { min: 75, max: 150, average: 100 },
            included: ['Sometimes included in rent'],
          },
          total: {
            monthly: { min: 475, max: 1050, average: 750 },
          },
        },
        currency: {
          exchangeRate: 1,
          fromCurrency: query.currency,
          toCurrency: 'Local Currency',
          trend: 'stable',
          impact: 'Currency impact analysis',
          budgetInLocalCurrency: query.budget,
          recommendation: 'Monitor exchange rates',
        },
      },
      culturalGuide: {
        localCustoms: {
          greetings: ['Local greetings'],
          diningEtiquette: ['Dining customs'],
          socialNorms: ['Social norms'],
          tipping: '10-15% typical',
          importantDos: ['Be respectful', 'Learn local language'],
          importantDonts: ['Avoid stereotypes'],
        },
        studentLife: {
          popularActivities: ['Campus events', 'Local attractions'],
          studentDiscounts: ['Student ID discounts'],
          socialGroups: ['Student associations'],
          upcomingEvents: ['Check local calendar'],
          bestNeighborhoods: ['Near campus'],
        },
        language: {
          primaryLanguage: 'Local language',
          essentialPhrases: [
            { phrase: 'Hello', translation: 'Hello', pronunciation: 'hello' },
            { phrase: 'Thank you', translation: 'Thanks', pronunciation: 'thanks' },
          ],
          englishProficiency: 'medium',
          languageLearningResources: ['Language apps', 'University courses'],
        },
        safety: {
          overallRating: 7,
          safeNeighborhoods: ['Safe areas near campus'],
          areasToAvoid: ['Check local advice'],
          emergencyContacts: [
            { service: 'Police', number: '112' },
            { service: 'Ambulance', number: '112' },
          ],
          safetyTips: ['Stay aware', 'Use common sense'],
        },
        culturalContext: {
          connectionToOrigin: ['Cultural similarities'],
          similarities: ['Shared values'],
          differences: ['Cultural differences'],
          adaptationTips: ['Be open-minded', 'Ask questions'],
        },
      },
      budgetPlan: {
        totalBudget: query.budget,
        duration: query.durationMonths,
        breakdown: {
          housing: { amount: 600 * query.durationMonths, percentage: 30, recommendation: 'Share accommodation' },
          food: { amount: 375 * query.durationMonths, percentage: 19, recommendation: 'Cook at home' },
          transport: { amount: 75 * query.durationMonths, percentage: 4, recommendation: 'Student pass' },
          activities: { amount: 200 * query.durationMonths, percentage: 10, recommendation: 'Use student discounts' },
          utilities: { amount: 100 * query.durationMonths, percentage: 5, recommendation: 'Check if included' },
          emergency: { amount: query.budget * 0.15, percentage: 15, recommendation: 'Emergency fund' },
        },
        monthlyAllocation: [],
        savingTips: ['Cook at home', 'Use student discounts', 'Share accommodation'],
        costOptimizationStrategies: ['Budget carefully', 'Track expenses'],
        feasibility: 'tight',
        warningFlags: [],
      },
      recommendations: {
        basedOnInterests: query.interests.map(interest => ({
          interest,
          recommendations: [`Activities related to ${interest}`],
        })),
        basedOnOrigin: {
          culturalConnections: ['Expat communities'],
          foodSimilarities: ['Familiar cuisines available'],
          communityGroups: ['International student groups'],
        },
        basedOnBudget: {
          affordable: ['Budget-friendly activities'],
          splurgeWorthy: ['Special experiences'],
          free: ['Free attractions'],
        },
        studentSpecific: {
          campusLife: ['Campus activities'],
          academicResources: ['Library', 'Study groups'],
          networkingOpportunities: ['Career events'],
        },
      },
      alerts: {
        priceAlerts: ['Monitor flight prices'],
        currencyAlerts: ['Watch exchange rates'],
        seasonalAlerts: ['Check seasonal variations'],
      },
      generatedAt: new Date().toISOString(),
      confidence: 0.7,
    };
  }
}

export const destinationAgent = new DestinationIntelligenceAgent();
