/**
 * Perplexity Research Agents - Dynamic research for any destination worldwide
 * Uses Perplexity API to gather real-time information
 */

import type { ParsedLocation, UserOrigin } from './location-parser';
import type { DestinationQuery } from './types/destination';

export interface PerplexityResearchResults {
  housing: string;
  cultural: string;
  safety: string;
  costs: string;
  flights: string;
  timestamp: number;
}

export interface PreResearchData {
  universities: string[];
  neighborhoods: string[];
  airportCodes: string[];
}

export class PerplexityResearchService {
  private apiKey: string;
  private readonly baseURL = 'https://api.perplexity.ai/chat/completions';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.PERPLEXITY_API_KEY || '';
  }

  /**
   * Pre-research step: Get key local terms for better research accuracy
   */
  async conductPreResearch(
    location: ParsedLocation
  ): Promise<PreResearchData> {
    console.log('[Perplexity] Starting pre-research fact-finding for', location.city, location.country);

    const factFindingPrompt = `For the city of ${location.city}, ${location.country}, provide a brief, fact-only, comma-separated list for each category:
1. Top 3 universities:
2. 3 popular student-friendly neighborhoods:
3. Main international airport code(s):

Format your response as:
Universities: [name1, name2, name3]
Neighborhoods: [name1, name2, name3]
Airports: [CODE1, CODE2]`;

    const response = await this.queryPerplexity(factFindingPrompt, 500);
    console.log('[Perplexity] Pre-research response:', response);

    // Parse the response
    const universities: string[] = [];
    const neighborhoods: string[] = [];
    const airportCodes: string[] = [];

    // Extract universities
    const uniMatch = response.match(/Universities?:\s*([^\n]+)/i);
    if (uniMatch) {
      universities.push(...uniMatch[1].split(',').map(s => s.trim()).filter(s => s.length > 0));
    }

    // Extract neighborhoods
    const neighMatch = response.match(/Neighborhoods?:\s*([^\n]+)/i);
    if (neighMatch) {
      neighborhoods.push(...neighMatch[1].split(',').map(s => s.trim()).filter(s => s.length > 0));
    }

    // Extract airports
    const airportMatch = response.match(/Airports?:\s*([^\n]+)/i);
    if (airportMatch) {
      airportCodes.push(...airportMatch[1].split(',').map(s => s.trim()).filter(s => s.length > 0));
    }

    console.log('[Perplexity] Extracted pre-research data:', { universities, neighborhoods, airportCodes });

    return {
      universities: universities.slice(0, 3),
      neighborhoods: neighborhoods.slice(0, 3),
      airportCodes: airportCodes.slice(0, 2),
    };
  }

  /**
   * Conduct comprehensive research using Master Prompt Template
   */
  async conductResearch(
    location: ParsedLocation,
    origin: UserOrigin,
    query: DestinationQuery,
    preResearchData?: PreResearchData
  ): Promise<PerplexityResearchResults> {
    console.log('[Perplexity] Starting comprehensive research with Master Prompt Template');

    // Use new master prompt for single comprehensive query
    const masterPrompt = this.buildMasterPrompt(location, origin, query, preResearchData);
    const comprehensiveResearch = await this.queryPerplexity(masterPrompt, 3000);

    console.log('[Perplexity] Research completed, response length:', comprehensiveResearch.length, 'chars');

    // Return structured results (all in one comprehensive response)
    return {
      housing: comprehensiveResearch,
      cultural: comprehensiveResearch,
      safety: comprehensiveResearch,
      costs: comprehensiveResearch,
      flights: comprehensiveResearch,
      timestamp: Date.now(),
    };
  }

  /**
   * Build Master Prompt Template for comprehensive research
   */
  private buildMasterPrompt(
    location: ParsedLocation,
    origin: UserOrigin,
    query: DestinationQuery,
    preResearchData?: PreResearchData
  ): string {
    const university = query.university ? query.university : 'major universities';
    const interests = query.interests.length > 0 ? query.interests.join(', ') : 'general activities';
    const originLocation = origin.city || origin.state || origin.country;

    // Determine local currency
    const localCurrencyMap: Record<string, string> = {
      'Brazil': 'BRL (Brazilian Real)',
      'Japan': 'JPY (Japanese Yen)',
      'Spain': 'EUR (Euro)',
      'Mexico': 'MXN (Mexican Peso)',
      'United Kingdom': 'GBP (British Pound)',
      'France': 'EUR (Euro)',
      'Germany': 'EUR (Euro)',
      'Italy': 'EUR (Euro)',
      'China': 'CNY (Chinese Yuan)',
      'South Korea': 'KRW (Korean Won)',
      'Thailand': 'THB (Thai Baht)',
      'Australia': 'AUD (Australian Dollar)',
      'Canada': 'CAD (Canadian Dollar)',
    };

    const localCurrency = localCurrencyMap[location.country] || 'local currency';

    // Build keyword-enhanced prompts
    let universityContext = university;
    let neighborhoodContext = 'safe, student-friendly areas';
    let airportContext = location.city;

    if (preResearchData) {
      if (preResearchData.universities.length > 0) {
        universityContext = preResearchData.universities.join(', ');
      }
      if (preResearchData.neighborhoods.length > 0) {
        neighborhoodContext = `${preResearchData.neighborhoods.join(', ')}, and other safe, student-friendly areas`;
      }
      if (preResearchData.airportCodes.length > 0) {
        airportContext = `${preResearchData.airportCodes.join(' or ')}`;
      }
    }

    return `You are an expert travel research assistant compiling a detailed briefing for a study abroad student. Your response must be factual, concise, and structured in Markdown.

**Research Context:**
* **Destination:** ${location.city}, ${location.country}
* **Duration:** ${query.durationMonths} months
* **Budget:** ${query.budget} ${query.currency}
* **Student's Interests:** ${interests}
* **Student's Origin:** ${originLocation}
* **Key Universities:** ${universityContext}
* **Key Neighborhoods:** ${neighborhoodContext}
* **Main Airport(s):** ${airportContext}

🔴 CRITICAL: ALL cost estimates MUST be provided in ${localCurrency}. Do NOT convert to USD.
For example, if researching Brazil, provide costs in BRL (e.g., "R$ 1,500-2,500" not "$300-500").

**Required Information (provide numerical ranges where possible):**

### Cost of Living (ALL COSTS IN ${localCurrency})
-   Detailed monthly estimate for a single student on a budget.
-   Housing (shared apartment in ${neighborhoodContext}) - provide cost in ${localCurrency}.
-   Food (mix of groceries and cheap eats) - provide cost in ${localCurrency}.
-   Local Transportation (monthly pass) - provide cost in ${localCurrency}.
-   Utilities (internet, mobile plan) - provide cost in ${localCurrency}.

### Housing Options (COSTS IN ${localCurrency})
-   Typical cost for university dormitories vs. private shared apartments in ${localCurrency}.
-   Good, safe neighborhoods for students to live in, such as ${neighborhoodContext}, near ${universityContext}.

### Cultural Insights
-   Key social etiquette and customs that might differ from ${originLocation}.
-   Brief overview of the student social scene and nightlife.

### Safety Analysis
-   List 3-4 verifiably safe neighborhoods for students (include ${neighborhoodContext} if applicable).
-   List 1-2 areas to be more cautious in, especially at night.
-   Mention any common scams targeting tourists or students.

### Personalized Recommendations
-   Based on the student's interests in ${interests}, suggest 2-3 specific activities, locations, or experiences.`;
  }

  /**
   * Agent 1: Housing Research
   * Finds current student housing costs and options
   * NOTE: Legacy method - not currently used. Keeping for potential future use.
   */
  // @ts-ignore - Legacy method
  private async _housingAgent(
    location: ParsedLocation,
    _origin: UserOrigin,
    query: DestinationQuery
  ): Promise<string> {
    const prompt = `
Find current student housing costs in ${location.city}, ${location.country} for a ${query.durationMonths}-month stay:

1. University dormitories near major universities (monthly rent in ${location.currency})
2. Shared apartments in safe neighborhoods for international students (monthly rent)
3. Monthly Airbnb rates for 3-6 month stays
4. Average utilities cost (electricity, water, internet) per month
5. Security deposits and typical contract requirements
6. Specific neighborhoods recommended for students (safe, convenient, affordable)
7. Distance and transportation to major universities

Focus on practical, current information with specific price ranges. Include neighborhood names and proximity to public transport.
`;

    return this.queryPerplexity(prompt, 1000);
  }

  /**
   * Agent 2: Cultural Intelligence
   * Researches local culture, customs, and student life
   * NOTE: Legacy method - not currently used. Keeping for potential future use.
   */
  // @ts-ignore - Legacy method
  private async _culturalAgent(
    location: ParsedLocation,
    origin: UserOrigin,
    query: DestinationQuery
  ): Promise<string> {
    const interestsText = query.interests.length > 0
      ? ` especially related to ${query.interests.join(', ')}`
      : '';

    const prompt = `
Research ${location.city}, ${location.country} culture for international students from ${origin.country}${interestsText}:

1. 20 essential ${location.primaryLanguage} phrases for daily life (greetings, ordering food, asking directions, emergencies)
2. Student-friendly attractions and activities${interestsText}
3. Local food scene: typical costs for groceries vs restaurants, popular student hangouts
4. Cultural customs and etiquette that differ from ${origin.country} (greetings, tipping, punctuality, personal space)
5. Student discounts and special programs available for international students
6. Social norms around making friends, dating, and nightlife
7. Best ways to integrate into local student community
8. Cultural events and festivals during the academic year

Provide specific examples and practical advice. Include current prices in ${location.currency}.
`;

    return this.queryPerplexity(prompt, 1200);
  }

  /**
   * Agent 3: Safety & Current Events
   * Researches safety, news, and practical information
   * NOTE: Legacy method - not currently used. Keeping for potential future use.
   */
  // @ts-ignore - Legacy method
  private async _safetyAgent(
    location: ParsedLocation,
    origin: UserOrigin,
    _query: DestinationQuery
  ): Promise<string> {
    const prompt = `
Current safety information for ${location.city}, ${location.country} international student areas:

1. Safety ratings by neighborhood (use recent crime statistics from 2024-2025)
2. Recent news affecting international students (last 60 days)
3. Transportation safety: public transit, taxis, ride-sharing, walking at night
4. Emergency contacts: police, hospitals, embassy/consulate for ${origin.country} citizens
5. Common scams targeting students and tourists
6. Natural disaster risks (earthquakes, floods, typhoons) and weather patterns
7. Health and medical system: how to access healthcare as a student
8. Best mobile carriers and SIM card options for international students
9. Banking: best banks for international students, how to open account

Focus on practical, current safety information. Include specific phone numbers for emergencies.
`;

    return this.queryPerplexity(prompt, 1000);
  }

  /**
   * Agent 4: Cost of Living
   * Detailed breakdown of monthly living expenses
   * NOTE: Legacy method - not currently used. Keeping for potential future use.
   */
  // @ts-ignore - Legacy method
  private async _costsAgent(
    location: ParsedLocation,
    _origin: UserOrigin,
    query: DestinationQuery
  ): Promise<string> {
    const dietaryText = query.dietaryRestrictions && query.dietaryRestrictions.length > 0
      ? ` (${query.dietaryRestrictions.join(', ')} options)`
      : '';

    const prompt = `
Detailed monthly living costs in ${location.city}, ${location.country} for students:

1. Food costs${dietaryText}:
   - Weekly grocery shopping for basic meals
   - Eating at inexpensive local restaurants
   - Mid-range restaurant meals
   - Local markets vs supermarkets
   - Coffee shops and casual dining

2. Transportation:
   - Monthly public transit pass (subway, bus, tram)
   - Bike sharing programs
   - Taxi/Uber average costs
   - Bicycle purchase or rental

3. Utilities (if not included in rent):
   - Mobile phone plan with data (student rates)
   - Internet (shared apartment)
   - Electricity, water, gas

4. Entertainment and activities:
   - Movie tickets (student price)
   - Concert/event tickets
   - Gym membership
   - Sports activities
   - Nightlife (club cover charges, drinks)

5. Other essentials:
   - Laundry (coin-op or service)
   - Toiletries and household items
   - Clothing and shoes
   - Haircuts

Provide specific numerical ranges in ${location.currency} and convert to USD. Use current 2024-2025 prices.
`;

    return this.queryPerplexity(prompt, 1200);
  }

  /**
   * Agent 5: Flight Intelligence
   * Researches flight prices and booking strategies
   * NOTE: Legacy method - not currently used. Keeping for potential future use.
   */
  // @ts-ignore - Legacy method
  private async _flightsAgent(
    location: ParsedLocation,
    origin: UserOrigin,
    _query: DestinationQuery
  ): Promise<string> {
    const originAirport = origin.airportCode || `major airports near ${origin.city || origin.country}`;
    const destAirport = location.airportCode || location.city;

    const prompt = `
Flight pricing from ${originAirport} (${origin.country}) to ${destAirport} (${location.city}, ${location.country}):

1. Current price ranges for 2024-2025:
   - Budget airlines (basic economy)
   - Standard airlines (economy)
   - Premium economy options

2. Seasonal price variations:
   - Cheapest months to fly
   - Most expensive months
   - Typical price difference between seasons

3. Booking strategy:
   - Optimal booking window (how far in advance)
   - Best days of week to fly
   - Best days of week to book

4. Airlines and routes:
   - Major airlines serving this route
   - Typical layover cities
   - Direct flight availability and duration
   - Budget airline options

5. Money-saving tips:
   - Flexible date strategies
   - Nearby alternative airports
   - Student discount programs
   - Points and miles opportunities

Provide specific price ranges in both USD and ${location.currency}. Use current 2024-2025 market data.
`;

    return this.queryPerplexity(prompt, 1000);
  }

  /**
   * Query Perplexity API with a research prompt
   */
  private async queryPerplexity(
    prompt: string,
    maxTokens: number
  ): Promise<string> {
    // If no API key, return placeholder for development
    if (!this.apiKey || this.apiKey === '') {
      console.log('[Perplexity] No API key - returning placeholder');
      return `[Research placeholder - Perplexity API key not configured]\n\nPrompt was:\n${prompt}\n\nIn production, this would return real-time research from Perplexity.`;
    }

    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'sonar', // Perplexity's search model (replaces deprecated llama-3.1-sonar-large-128k-online)
          messages: [
            {
              role: 'system',
              content: 'You are a travel research assistant. Provide detailed, current, and accurate information with specific numbers, prices, and recommendations.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: maxTokens,
          temperature: 0.2, // Low temperature for factual research
          top_p: 0.9,
          // search_domain_filter removed - requires specific domains like "example.edu", not TLDs
          // The 'sonar' model already prioritizes quality sources
          return_images: false,
          return_related_questions: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Perplexity] API error:', response.status, errorText);
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content in Perplexity response');
      }

      return content;
    } catch (error) {
      console.error('[Perplexity] Query failed:', error);

      // Return informative error message
      return `[Perplexity research temporarily unavailable]\n\nPrompt: ${prompt.substring(0, 200)}...\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n\nWill use fallback data or cached results.`;
    }
  }

  /**
   * Check if Perplexity API is configured and available
   */
  isConfigured(): boolean {
    return this.apiKey !== '';
  }
}

// Export singleton instance
export const perplexityService = new PerplexityResearchService();
