/**
 * CurrencyService - Live Currency Conversion & Trends
 * Uses OpenExchangeRates API for real-time rates and historical data
 */

import { cacheService } from './cache-service';

export interface CurrencyData {
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
  lastUpdated: string;
}

export class CurrencyService {
  private apiKey: string | null;
  private baseUrl: string = 'https://openexchangerates.org/api';

  constructor() {
    this.apiKey = process.env.OPENEXCHANGERATES_API_KEY || null;
    console.log('[CurrencyService] Constructor - API key configured:', !!this.apiKey);
  }

  isConfigured(): boolean {
    const configured = !!this.apiKey;
    console.log('[CurrencyService] isConfigured check:', configured);
    return configured;
  }

  /**
   * Get live currency conversion data with trends
   */
  async getCurrencyData(
    fromCurrency: string,
    toCurrency: string,
    budget: number
  ): Promise<CurrencyData> {
    const cacheKey = `currency:${fromCurrency}:${toCurrency}`;
    const cached = cacheService.get<CurrencyData>(cacheKey);

    if (cached) {
      console.log('[CurrencyService] Using cached rates');
      return cached;
    }

    if (!this.isConfigured()) {
      console.log('[CurrencyService] Not configured, using mock data');
      return this.getMockCurrencyData(fromCurrency, toCurrency, budget);
    }

    try {
      // Get current rate
      const currentRate = await this.getCurrentRate(fromCurrency, toCurrency);

      // Get historical rates (30 days)
      const historicalRates = await this.getHistoricalRates(fromCurrency, toCurrency, 30);

      // Calculate trend
      const trend = this.calculateTrend(historicalRates);

      // Generate impact analysis
      const impact = this.generateImpact(fromCurrency, toCurrency, currentRate, trend, budget);

      // Generate recommendation
      const recommendation = this.generateRecommendation(trend, toCurrency);

      const result: CurrencyData = {
        exchangeRate: currentRate,
        fromCurrency,
        toCurrency,
        trend,
        impact,
        budgetInLocalCurrency: budget * currentRate,
        recommendation,
        historicalRates,
        lastUpdated: new Date().toISOString(),
      };

      // Cache for 1 hour (currency data updates frequently)
      cacheService.set(cacheKey, result, 60 * 60 * 1000);

      return result;
    } catch (error) {
      console.error('[CurrencyService] Error fetching currency data:', error);
      return this.getMockCurrencyData(fromCurrency, toCurrency, budget);
    }
  }

  /**
   * Get current exchange rate
   * FREE TIER: Only USD base supported, use cross-rate calculation
   */
  private async getCurrentRate(from: string, to: string): Promise<number> {
    if (!this.apiKey) {
      throw new Error('OpenExchangeRates API key not configured');
    }

    // Same currency - return 1.0 immediately
    if (from === to) {
      return 1.0;
    }

    // FREE TIER: Always use USD as base (only supported option)
    const url = `${this.baseUrl}/latest.json?app_id=${this.apiKey}&symbols=${from},${to}`;

    console.log(`[CurrencyService] Fetching exchange rates: ${from} -> ${to}`);
    console.log(`[CurrencyService] API URL: ${this.baseUrl}/latest.json?app_id=***&symbols=${from},${to}`);

    const response = await fetch(url);

    console.log(`[CurrencyService] API response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[CurrencyService] API error body:`, errorBody);
      throw new Error(`OpenExchangeRates API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('[CurrencyService] 🔍 RAW API RESPONSE:', JSON.stringify(data, null, 2));
    console.log(`[CurrencyService] 🔍 Requested: ${from} -> ${to}`);
    console.log(`[CurrencyService] 🔍 Available rates keys:`, Object.keys(data.rates || {}));

    if (!data.rates) {
      console.error('[CurrencyService] ❌ No rates object in API response!');
      throw new Error('Invalid API response');
    }

    // If converting from USD, use direct rate
    if (from === 'USD') {
      console.log(`[CurrencyService] 🔍 Looking for USD -> ${to} rate`);
      console.log(`[CurrencyService] 🔍 data.rates[${to}] =`, data.rates[to]);
      
      if (!data.rates[to]) {
        console.error(`[CurrencyService] ❌ Exchange rate not found for USD to ${to}`);
        throw new Error(`Exchange rate not found for USD to ${to}`);
      }
      
      const rate = data.rates[to];
      console.log(`[CurrencyService] ✅ Found rate: 1 ${from} = ${rate} ${to}`);
      return rate;
    }

    // If converting to USD, use inverse rate
    if (to === 'USD') {
      if (!data.rates[from]) {
        throw new Error(`Exchange rate not found for ${from} to USD`);
      }
      return 1 / data.rates[from];
    }

    // For other currency pairs, calculate cross-rate via USD
    // Example: EUR -> GBP = (1 / USD_EUR) * USD_GBP
    if (!data.rates[from] || !data.rates[to]) {
      throw new Error(`Exchange rates not found for ${from} and ${to}`);
    }

    const crossRate = data.rates[to] / data.rates[from];
    return crossRate;
  }

  /**
   * Get historical exchange rates
   * DISABLED FOR FREE TIER: Historical data requires paid plan + 7 API calls
   * Returns empty array to save API quota
   */
  private async getHistoricalRates(
    _from: string,
    _to: string,
    _days: number = 30
  ): Promise<{ date: string; rate: number }[]> {
    // FREE TIER: Skip historical data to conserve API calls (1 call vs 7+ calls)
    console.log('[CurrencyService] Skipping historical rates (free tier optimization)');
    return [];
  }

  /**
   * Calculate trend from historical rates
   */
  private calculateTrend(
    historicalRates: { date: string; rate: number }[]
  ): 'strengthening' | 'stable' | 'weakening' {
    if (historicalRates.length < 2) {
      return 'stable';
    }

    const oldest = historicalRates[0].rate;
    const newest = historicalRates[historicalRates.length - 1].rate;
    const change = ((newest - oldest) / oldest) * 100;

    if (change > 2) {
      return 'strengthening'; // Base currency strengthening (you get more)
    } else if (change < -2) {
      return 'weakening'; // Base currency weakening (you get less)
    } else {
      return 'stable';
    }
  }

  /**
   * Generate impact analysis
   */
  private generateImpact(
    from: string,
    to: string,
    rate: number,
    trend: string,
    budget: number
  ): string {
    const localAmount = (budget * rate).toFixed(2);

    let impact = `Your ${from} ${budget} equals approximately ${to} ${localAmount} at the current exchange rate of ${rate.toFixed(4)}. `;

    if (trend === 'strengthening') {
      impact += `The ${from} has been strengthening against the ${to}, which is favorable for your budget. `;
      impact += `You're getting more local currency per dollar compared to a month ago, increasing your purchasing power.`;
    } else if (trend === 'weakening') {
      impact += `The ${from} has been weakening against the ${to}, which means you'll get less local currency. `;
      impact += `Budget accordingly as costs may be higher than expected.`;
    } else {
      impact += `The exchange rate has been relatively stable over the past month, making budget planning easier.`;
    }

    return impact;
  }

  /**
   * Generate recommendation
   */
  private generateRecommendation(trend: string, _toCurrency: string): string {
    let recommendation = '';

    if (trend === 'strengthening') {
      recommendation = `Consider exchanging currency soon to lock in favorable rates. `;
    } else if (trend === 'weakening') {
      recommendation = `Monitor rates closely. Consider hedging with prepaid travel cards or exchanging essential amounts only. `;
    } else {
      recommendation = `Exchange rates are stable. Use services like Wise or Revolut for best rates. `;
    }

    recommendation += `Open a local bank account (or use fintech like Nubank) to avoid international transaction fees. `;
    recommendation += `Avoid airport currency exchanges which typically have poor rates.`;

    return recommendation;
  }

  /**
   * Mock currency data for demo mode or fallback
   */
  private getMockCurrencyData(
    from: string,
    to: string,
    budget: number
  ): CurrencyData {
    // Mock exchange rates
    const mockRates: Record<string, Record<string, number>> = {
      USD: {
        BRL: 5.2,
        EUR: 0.92,
        GBP: 0.79,
        JPY: 149.5,
        MXN: 17.8,
      },
      EUR: {
        USD: 1.09,
        BRL: 5.65,
        GBP: 0.86,
        JPY: 162.7,
      },
    };

    const rate = mockRates[from]?.[to] || 1;

    // Generate mock historical rates with slight variation
    const historicalRates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (30 - i * 5));
      return {
        date: date.toISOString().split('T')[0],
        rate: rate * (0.98 + Math.random() * 0.04), // ±2% variation
      };
    });

    return {
      exchangeRate: rate,
      fromCurrency: from,
      toCurrency: to,
      trend: 'stable',
      impact: `Your ${from} ${budget} equals approximately ${to} ${(budget * rate).toFixed(2)} at the current exchange rate (demo data).`,
      budgetInLocalCurrency: budget * rate,
      recommendation: `Use services like Wise or Revolut for best exchange rates. Open a local bank account to avoid international fees.`,
      historicalRates,
      lastUpdated: new Date().toISOString(),
    };
  }
}

export const currencyService = new CurrencyService();
