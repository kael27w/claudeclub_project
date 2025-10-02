/**
 * Currency Exchange Rate API Route
 *
 * Fetches live exchange rates from OpenExchangeRates API
 * NO MOCK DATA - All data comes from real API calls
 */

import { NextRequest, NextResponse } from 'next/server';

const OPENEXCHANGERATES_API_KEY = process.env.OPENEXCHANGERATES_API_KEY;
const OPENEXCHANGERATES_BASE_URL = 'https://openexchangerates.org/api';

interface CurrencyRateRequest {
  baseCurrency: string;
  targetCurrencies: string[];
}

interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  timestamp: string;
}

/**
 * POST /api/currency
 *
 * Request body:
 * {
 *   baseCurrency: "USD",
 *   targetCurrencies: ["EUR", "BRL", "GBP"]
 * }
 *
 * Response:
 * {
 *   success: true,
 *   rates: [
 *     { fromCurrency: "USD", toCurrency: "EUR", rate: 0.85, timestamp: "..." },
 *     { fromCurrency: "USD", toCurrency: "BRL", rate: 5.2, timestamp: "..." },
 *     { fromCurrency: "USD", toCurrency: "GBP", rate: 0.74, timestamp: "..." }
 *   ]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Validate API key
    if (!OPENEXCHANGERATES_API_KEY) {
      console.error('[CurrencyAPI] Missing OPENEXCHANGERATES_API_KEY');
      return NextResponse.json(
        { success: false, error: 'Currency API not configured' },
        { status: 500 }
      );
    }

    // Parse request body
    const body: CurrencyRateRequest = await request.json();
    const { baseCurrency, targetCurrencies } = body;

    // Validate request
    if (!baseCurrency || !targetCurrencies || targetCurrencies.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid request: baseCurrency and targetCurrencies required' },
        { status: 400 }
      );
    }

    console.log(`[CurrencyAPI] Fetching rates: ${baseCurrency} -> [${targetCurrencies.join(', ')}]`);

    // Call OpenExchangeRates API
    const apiUrl = `${OPENEXCHANGERATES_BASE_URL}/latest.json?app_id=${OPENEXCHANGERATES_API_KEY}&base=${baseCurrency}&symbols=${targetCurrencies.join(',')}`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[CurrencyAPI] OpenExchangeRates API error:', errorData);
      return NextResponse.json(
        { success: false, error: errorData.message || 'Failed to fetch exchange rates' },
        { status: response.status }
      );
    }

    const data = await response.json();

    console.log('[CurrencyAPI] ✅ Successfully fetched rates from OpenExchangeRates');
    console.log('[CurrencyAPI] Response:', JSON.stringify({
      base: data.base,
      timestamp: new Date(data.timestamp * 1000).toISOString(),
      rates: data.rates
    }, null, 2));

    // Transform API response into our format
    const rates: ExchangeRate[] = Object.entries(data.rates).map(([currency, rate]) => ({
      fromCurrency: baseCurrency,
      toCurrency: currency,
      rate: rate as number,
      timestamp: new Date(data.timestamp * 1000).toISOString(),
    }));

    return NextResponse.json({
      success: true,
      rates,
    });

  } catch (error: any) {
    console.error('[CurrencyAPI] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/currency?from=USD&to=EUR,BRL,GBP
 *
 * Alternative query param format for simpler usage
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get('from') || 'USD';
    const to = searchParams.get('to');

    if (!to) {
      return NextResponse.json(
        { success: false, error: 'Missing "to" query parameter' },
        { status: 400 }
      );
    }

    const targetCurrencies = to.split(',').map(c => c.trim().toUpperCase());

    // Reuse POST logic
    const body = { baseCurrency: from, targetCurrencies };
    const mockRequest = {
      json: async () => body
    } as NextRequest;

    return POST(mockRequest);

  } catch (error: any) {
    console.error('[CurrencyAPI] GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
