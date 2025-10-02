/**
 * Currency Exchange API Client
 * Provides real-time currency exchange rates using OpenExchangeRates
 */

interface ExchangeRatesData {
  [currencyCode: string]: number;
}

interface CurrencyResponse {
  success: boolean;
  data: ExchangeRatesData | null;
  error: string | null;
}

/**
 * Get current exchange rates for specified currencies
 * @param baseCurrency - The base currency code (e.g., "USD", "EUR")
 * @param targetCurrencies - Array of target currency codes to get rates for
 * @returns Promise with standardized response object containing exchange rates
 */
export async function getExchangeRates(
  baseCurrency: string,
  targetCurrencies: string[]
): Promise<CurrencyResponse> {
  try {
    // Support both APP_ID and API_KEY naming conventions
    const appId = process.env.OPENEXCHANGERATES_APP_ID || process.env.OPENEXCHANGERATES_API_KEY;

    if (!appId) {
      return {
        success: false,
        data: null,
        error: "OPENEXCHANGERATES_APP_ID or OPENEXCHANGERATES_API_KEY is not configured",
      };
    }

    // Validate inputs
    if (!baseCurrency || baseCurrency.length !== 3) {
      return {
        success: false,
        data: null,
        error: "Invalid base currency code. Must be a 3-letter currency code.",
      };
    }

    if (!targetCurrencies || targetCurrencies.length === 0) {
      return {
        success: false,
        data: null,
        error: "At least one target currency must be specified.",
      };
    }

    // Build URL with query parameters
    const symbols = targetCurrencies.join(",");
    const url = new URL("https://openexchangerates.org/api/latest.json");
    url.searchParams.append("app_id", appId);
    url.searchParams.append("base", baseCurrency.toUpperCase());
    url.searchParams.append("symbols", symbols.toUpperCase());

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        data: null,
        error: `OpenExchangeRates API error: ${response.status} - ${
          errorData.description || response.statusText
        }`,
      };
    }

    const data = await response.json();

    // Extract rates object
    const rates = data.rates;

    if (!rates || typeof rates !== "object") {
      return {
        success: false,
        data: null,
        error: "No rates data returned from OpenExchangeRates API",
      };
    }

    return {
      success: true,
      data: rates,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: `Currency client error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}
