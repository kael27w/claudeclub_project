/**
 * Destination Intelligence Agent - UNIVERSAL VERSION
 * Uses Perplexity Pro for real-time research + Claude 4.5 for synthesis
 * Works for ANY study abroad destination worldwide
 */

import { sendMessage } from './claude-client';
import { locationParser } from './location-parser';
import { perplexityService } from './perplexity-agents';
import type {
  DestinationQuery,
  DestinationIntelligence,
} from './types/destination';
import type { ParsedLocation, UserOrigin } from './location-parser';
import type { PerplexityResearchResults } from './perplexity-agents';

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
const USE_PERPLEXITY = process.env.PERPLEXITY_API_KEY && process.env.PERPLEXITY_API_KEY.length > 0;

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
      const response = await sendMessage(prompt, systemPrompt);
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
   * UNIVERSAL VERSION: Uses Perplexity research + Claude synthesis
   */
  async generateIntelligence(query: DestinationQuery): Promise<DestinationIntelligence> {
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
      // Step 1: Conduct Perplexity research (if configured)
      let perplexityResearch: PerplexityResearchResults | null = null;

      if (USE_PERPLEXITY && perplexityService.isConfigured()) {
        console.log('[DestAgent] Conducting Perplexity research for', query.city);
        perplexityResearch = await perplexityService.conductResearch(
          parsedLocation,
          parsedOrigin,
          query
        );
        console.log('[DestAgent] Perplexity research complete');
      } else {
        console.log('[DestAgent] Perplexity not configured, using Claude direct generation');
      }

      // Step 2: Use Claude to synthesize research or generate from scratch
      if (perplexityResearch) {
        return await this.synthesizePerplexityResearch(query, perplexityResearch);
      } else {
        return await this.generateWithClaude(query);
      }
    } catch (error) {
      console.error('[DestAgent] Intelligence generation failed:', error);
      console.log('[DestAgent] Falling back to mock data');
      return this.getMockIntelligence(query);
    }
  }

  /**
   * Synthesize Perplexity research using Claude
   * Claude parses research text and structures it as DestinationIntelligence
   */
  private async synthesizePerplexityResearch(
    query: DestinationQuery,
    research: PerplexityResearchResults
  ): Promise<DestinationIntelligence> {
    const systemPrompt = `You are a travel data analyst expert at parsing research into structured destination intelligence.

Parse the research below and extract key information into a structured JSON format matching the DestinationIntelligence interface.

Key requirements:
1. Extract ALL numerical data (prices, costs, ranges) with proper currency codes
2. Extract cultural tips, language phrases, and safety information
3. Calculate feasibility of budget based on extracted costs
4. Generate personalized recommendations based on user interests
5. Include warnings if budget seems insufficient

Return ONLY valid JSON - no markdown, no explanations, just the JSON object.`;

    const prompt = `Parse this destination research for ${query.city}, ${query.country}:

**User Context:**
- Origin: ${query.origin.city || query.origin.state || query.origin.country}
- Duration: ${query.durationMonths} months
- Budget: ${query.currency} ${query.budget}
- Interests: ${query.interests.join(', ')}

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
- costAnalysis (extract all prices and convert to USD)
- culturalGuide (customs, phrases, safety ratings)
- budgetPlan (calculate monthly breakdown based on ${query.budget} for ${query.durationMonths} months)
- recommendations (personalized for interests: ${query.interests.join(', ')})
- alerts (price, currency, seasonal warnings)

Return structured DestinationIntelligence JSON:`;

    try {
      const response = await sendMessage(prompt, systemPrompt, 4000);
      const intelligence = JSON.parse(response);

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
   * Generate intelligence using Claude only (no Perplexity)
   * Falls back to Claude's knowledge when Perplexity unavailable
   */
  private async generateWithClaude(query: DestinationQuery): Promise<DestinationIntelligence> {
    const systemPrompt = `You are an expert study abroad advisor with deep knowledge of international destinations, costs, culture, and student life. Provide comprehensive, accurate, and actionable intelligence based on your knowledge.

Focus on:
1. REAL-TIME COST ANALYSIS: Current flight prices, housing costs, living expenses, currency impact
2. CULTURAL INTEGRATION: Local customs, student activities, language tips, safety
3. BUDGET OPTIMIZATION: Smart allocation, saving strategies, feasibility assessment
4. PERSONALIZED RECOMMENDATIONS: Based on interests, origin, and budget

Return ONLY valid JSON matching the DestinationIntelligence interface.`;

    const prompt = `Analyze this study abroad plan:

**Query:** "${query.rawQuery}"

**Structured Data:**
- Destination: ${query.city}, ${query.country}
- University: ${query.university || 'Not specified'}
- Duration: ${query.durationMonths} months
- Budget: ${query.currency} ${query.budget}
- Interests: ${query.interests.join(', ')}
- Origin: ${query.origin.city || query.origin.state || query.origin.country}

Provide comprehensive destination intelligence with realistic current data for 2024-2025.

Return DestinationIntelligence JSON:`;

    try {
      const response = await sendMessage(prompt, systemPrompt, 3000);
      const intelligence = JSON.parse(response);

      return {
        ...intelligence,
        query,
        generatedAt: new Date().toISOString(),
        confidence: 0.8, // Lower confidence without real-time research
      };
    } catch (error) {
      console.error('[DestAgent] Claude generation failed:', error);
      throw error;
    }
  }

  /**
   * Fallback query parser (simple pattern matching)
   */
  private fallbackParse(rawQuery: string): DestinationQuery {
    // Simple extraction patterns
    const cityMatch = rawQuery.match(/(?:in|at|to|studying at [A-Z]+\s+in)\s+([A-Za-z\s]+?)(?:,|\s+for)/i);
    const budgetMatch = rawQuery.match(/(\$|€|£|¥|R\$)?\s*(\d+(?:,\d+)?(?:\.\d+)?)\s*(USD|EUR|GBP|JPY|BRL|dollars?|euros?)?/i);
    const durationMatch = rawQuery.match(/(\d+)\s*(month|months|semester)/i);

    const city = cityMatch ? cityMatch[1].trim() : 'São Paulo';
    const budget = budgetMatch ? parseFloat(budgetMatch[2].replace(',', '')) : 2000;
    const durationMonths = durationMatch ? parseInt(durationMatch[1]) : 4;

    // Extract interests
    const interests: string[] = [];
    if (/art/i.test(rawQuery)) interests.push('art');
    if (/food/i.test(rawQuery)) interests.push('food');
    if (/museum/i.test(rawQuery)) interests.push('museums');
    if (/night|club/i.test(rawQuery)) interests.push('nightlife');
    if (/tech|technology/i.test(rawQuery)) interests.push('technology');
    if (/architecture/i.test(rawQuery)) interests.push('architecture');

    return {
      rawQuery,
      city,
      country: city.toLowerCase().includes('são paulo') ? 'Brazil' : 'Unknown',
      duration: `${durationMonths} months`,
      durationMonths,
      budget,
      currency: 'USD',
      interests: interests.length > 0 ? interests : ['culture', 'food'],
      origin: {
        country: rawQuery.toLowerCase().includes('virginia') ? 'USA' : 'USA',
        state: rawQuery.toLowerCase().includes('virginia') ? 'Virginia' : undefined,
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
