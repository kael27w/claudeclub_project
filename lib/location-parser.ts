/**
 * Location Parser - Universal location parsing and validation
 * Handles any city/country combination worldwide
 */

export interface ParsedLocation {
  city: string;
  country: string;
  countryCode: string; // ISO 3166-1 alpha-2
  airportCode?: string; // IATA code (nearest major airport)
  timezone: string;
  primaryLanguage: string;
  currency: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface UserOrigin {
  city?: string;
  state?: string;
  country: string;
  countryCode: string;
  airportCode?: string;
}

interface CountryData {
  name: string;
  code: string;
  currency: string;
  languages: string[];
  timezone: string;
}

/**
 * Major city to airport code mapping
 * Covers top 100 study abroad destinations
 */
const CITY_AIRPORT_CODES: Record<string, string> = {
  // Brazil
  'são paulo': 'GRU',
  'sao paulo': 'GRU',
  'rio de janeiro': 'GIG',
  'brasília': 'BSB',
  'brasilia': 'BSB',

  // Spain
  'barcelona': 'BCN',
  'madrid': 'MAD',
  'valencia': 'VLC',
  'seville': 'SVQ',
  'málaga': 'AGP',
  'malaga': 'AGP',

  // Japan
  'tokyo': 'NRT',
  'osaka': 'KIX',
  'kyoto': 'KIX', // Uses Osaka airport
  'fukuoka': 'FUK',
  'sapporo': 'CTS',

  // UK
  'london': 'LHR',
  'manchester': 'MAN',
  'edinburgh': 'EDI',
  'glasgow': 'GLA',
  'birmingham': 'BHX',

  // France
  'paris': 'CDG',
  'lyon': 'LYS',
  'marseille': 'MRS',
  'nice': 'NCE',
  'toulouse': 'TLS',

  // Germany
  'berlin': 'BER',
  'munich': 'MUC',
  'frankfurt': 'FRA',
  'hamburg': 'HAM',
  'cologne': 'CGN',

  // Italy
  'rome': 'FCO',
  'milan': 'MXP',
  'florence': 'FLR',
  'venice': 'VCE',
  'naples': 'NAP',

  // USA
  'new york': 'JFK',
  'los angeles': 'LAX',
  'chicago': 'ORD',
  'san francisco': 'SFO',
  'boston': 'BOS',
  'washington': 'IAD',
  'seattle': 'SEA',
  'miami': 'MIA',
  'atlanta': 'ATL',
  'philadelphia': 'PHL',

  // Australia
  'sydney': 'SYD',
  'melbourne': 'MEL',
  'brisbane': 'BNE',
  'perth': 'PER',
  'adelaide': 'ADL',

  // Canada
  'toronto': 'YYZ',
  'vancouver': 'YVR',
  'montreal': 'YUL',
  'calgary': 'YYC',
  'ottawa': 'YOW',

  // Netherlands
  'amsterdam': 'AMS',
  'rotterdam': 'RTM',

  // Portugal
  'lisbon': 'LIS',
  'porto': 'OPO',

  // Austria
  'vienna': 'VIE',

  // Switzerland
  'zurich': 'ZRH',
  'geneva': 'GVA',

  // Ireland
  'dublin': 'DUB',

  // Denmark
  'copenhagen': 'CPH',

  // Sweden
  'stockholm': 'ARN',

  // Norway
  'oslo': 'OSL',

  // South Korea
  'seoul': 'ICN',
  'busan': 'PUS',

  // China
  'beijing': 'PEK',
  'shanghai': 'PVG',
  'hong kong': 'HKG',
  'guangzhou': 'CAN',

  // Singapore
  'singapore': 'SIN',

  // Thailand
  'bangkok': 'BKK',
  'chiang mai': 'CNX',

  // Mexico
  'mexico city': 'MEX',
  'guadalajara': 'GDL',
  'monterrey': 'MTY',

  // Argentina
  'buenos aires': 'EZE',

  // Chile
  'santiago': 'SCL',

  // Colombia
  'bogotá': 'BOG',
  'bogota': 'BOG',
  'medellín': 'MDE',
  'medellin': 'MDE',

  // Peru
  'lima': 'LIM',

  // New Zealand
  'auckland': 'AKL',
  'wellington': 'WLG',

  // South Africa
  'cape town': 'CPT',
  'johannesburg': 'JNB',

  // UAE
  'dubai': 'DXB',
  'abu dhabi': 'AUH',

  // India
  'delhi': 'DEL',
  'mumbai': 'BOM',
  'bangalore': 'BLR',
  'chennai': 'MAA',
};

/**
 * US state abbreviation to full name mapping
 */
const US_STATES: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
  'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
  'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
  'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
  'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
  'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
  'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
  'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
  'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
  'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
  'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia'
};

/**
 * Common country name variations and their standard names
 */
const COUNTRY_VARIATIONS: Record<string, string> = {
  'usa': 'United States',
  'us': 'United States',
  'america': 'United States',
  'united states of america': 'United States',
  'uk': 'United Kingdom',
  'england': 'United Kingdom',
  'britain': 'United Kingdom',
  'great britain': 'United Kingdom',
  'uae': 'United Arab Emirates',
};

export class LocationParser {
  /**
   * Parse a destination from natural language input
   * Examples:
   * - "São Paulo"
   * - "Barcelona, Spain"
   * - "Tokyo, Japan"
   * - "London"
   */
  async parseDestination(input: string): Promise<ParsedLocation> {
    const normalized = input.trim().toLowerCase();

    // Try to split by comma first
    const parts = normalized.split(',').map(p => p.trim());

    let city: string;
    let country: string | undefined;

    if (parts.length >= 2) {
      // Format: "City, Country"
      city = this.capitalizeCity(parts[0]);
      country = this.capitalizeCountry(parts[1]);
    } else {
      // Just city name, need to infer country
      city = this.capitalizeCity(parts[0]);
      country = await this.inferCountryFromCity(city);
    }

    // Get country data
    const countryData = await this.getCountryData(country);

    // Get airport code
    const airportCode = this.getAirportCode(normalized);

    // Get coordinates (placeholder - in production would use geocoding API)
    const coordinates = this.getCoordinatesForCity(city);

    return {
      city,
      country: countryData.name,
      countryCode: countryData.code,
      airportCode,
      timezone: countryData.timezone,
      primaryLanguage: countryData.languages[0],
      currency: countryData.currency,
      coordinates,
    };
  }

  /**
   * Parse user's origin location
   * Examples:
   * - "Virginia"
   * - "New York, USA"
   * - "California"
   * - "United States"
   */
  async parseOrigin(input: string): Promise<UserOrigin> {
    const normalized = input.trim().toLowerCase();
    const parts = normalized.split(',').map(p => p.trim());

    let city: string | undefined;
    let state: string | undefined;
    let country: string;

    // Check if it's a US state
    const stateMatch = Object.entries(US_STATES).find(
      ([abbr, name]) =>
        normalized === name.toLowerCase() ||
        normalized === abbr.toLowerCase()
    );

    if (stateMatch) {
      state = stateMatch[1];
      country = 'United States';
    } else if (parts.length >= 2) {
      // Format: "City, Country" or "City, State"
      city = this.capitalizeCity(parts[0]);
      const secondPart = this.capitalizeCountry(parts[1]);

      // Check if second part is a US state
      const isState = Object.values(US_STATES).includes(secondPart);
      if (isState) {
        state = secondPart;
        country = 'United States';
      } else {
        country = secondPart;
      }
    } else {
      // Just a country name
      country = this.capitalizeCountry(parts[0]);
    }

    const countryData = await this.getCountryData(country);

    // Get airport code if city is known
    let airportCode: string | undefined;
    if (city) {
      airportCode = this.getAirportCode(city.toLowerCase());
    } else if (state) {
      // For US states, try to get major airport
      airportCode = this.getAirportCodeForState(state);
    }

    return {
      city,
      state,
      country: countryData.name,
      countryCode: countryData.code,
      airportCode,
    };
  }

  /**
   * Validate if a location exists
   */
  async validateLocation(_city: string, country: string): Promise<boolean> {
    try {
      await this.getCountryData(country);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get nearest major airport code for a city
   */
  private getAirportCode(cityLower: string): string | undefined {
    return CITY_AIRPORT_CODES[cityLower];
  }

  /**
   * Get major airport for a US state
   */
  private getAirportCodeForState(state: string): string | undefined {
    const stateAirports: Record<string, string> = {
      'California': 'LAX',
      'New York': 'JFK',
      'Texas': 'DFW',
      'Florida': 'MIA',
      'Illinois': 'ORD',
      'Pennsylvania': 'PHL',
      'Georgia': 'ATL',
      'Massachusetts': 'BOS',
      'Virginia': 'IAD',
      'Washington': 'SEA',
      'District of Columbia': 'IAD',
    };
    return stateAirports[state];
  }

  /**
   * Infer country from city name using common knowledge
   */
  private async inferCountryFromCity(city: string): Promise<string> {
    const cityLower = city.toLowerCase();

    // Common city-country mappings
    const cityCountryMap: Record<string, string> = {
      'barcelona': 'Spain',
      'madrid': 'Spain',
      'valencia': 'Spain',
      'seville': 'Spain',
      'paris': 'France',
      'lyon': 'France',
      'marseille': 'France',
      'london': 'United Kingdom',
      'manchester': 'United Kingdom',
      'edinburgh': 'United Kingdom',
      'berlin': 'Germany',
      'munich': 'Germany',
      'frankfurt': 'Germany',
      'rome': 'Italy',
      'milan': 'Italy',
      'florence': 'Italy',
      'venice': 'Italy',
      'tokyo': 'Japan',
      'osaka': 'Japan',
      'kyoto': 'Japan',
      'sydney': 'Australia',
      'melbourne': 'Australia',
      'são paulo': 'Brazil',
      'sao paulo': 'Brazil',
      'rio de janeiro': 'Brazil',
      'amsterdam': 'Netherlands',
      'lisbon': 'Portugal',
      'porto': 'Portugal',
      'vienna': 'Austria',
      'zurich': 'Switzerland',
      'dublin': 'Ireland',
      'copenhagen': 'Denmark',
      'stockholm': 'Sweden',
      'oslo': 'Norway',
      'seoul': 'South Korea',
      'beijing': 'China',
      'shanghai': 'China',
      'singapore': 'Singapore',
      'bangkok': 'Thailand',
      'dubai': 'United Arab Emirates',
    };

    return cityCountryMap[cityLower] || 'Unknown';
  }

  /**
   * Get country data (currency, language, timezone, code)
   * In production, would use REST Countries API
   */
  private async getCountryData(countryName: string): Promise<CountryData> {
    // Normalize country name
    const normalized = countryName.toLowerCase();
    const standardName = COUNTRY_VARIATIONS[normalized] || countryName;

    // Hardcoded data for common study abroad countries
    // In production, would fetch from REST Countries API (https://restcountries.com)
    const countryDatabase: Record<string, CountryData> = {
      'Spain': { name: 'Spain', code: 'ES', currency: 'EUR', languages: ['Spanish'], timezone: 'Europe/Madrid' },
      'France': { name: 'France', code: 'FR', currency: 'EUR', languages: ['French'], timezone: 'Europe/Paris' },
      'Germany': { name: 'Germany', code: 'DE', currency: 'EUR', languages: ['German'], timezone: 'Europe/Berlin' },
      'Italy': { name: 'Italy', code: 'IT', currency: 'EUR', languages: ['Italian'], timezone: 'Europe/Rome' },
      'United Kingdom': { name: 'United Kingdom', code: 'GB', currency: 'GBP', languages: ['English'], timezone: 'Europe/London' },
      'Japan': { name: 'Japan', code: 'JP', currency: 'JPY', languages: ['Japanese'], timezone: 'Asia/Tokyo' },
      'Brazil': { name: 'Brazil', code: 'BR', currency: 'BRL', languages: ['Portuguese'], timezone: 'America/Sao_Paulo' },
      'United States': { name: 'United States', code: 'US', currency: 'USD', languages: ['English'], timezone: 'America/New_York' },
      'Australia': { name: 'Australia', code: 'AU', currency: 'AUD', languages: ['English'], timezone: 'Australia/Sydney' },
      'Canada': { name: 'Canada', code: 'CA', currency: 'CAD', languages: ['English', 'French'], timezone: 'America/Toronto' },
      'Netherlands': { name: 'Netherlands', code: 'NL', currency: 'EUR', languages: ['Dutch'], timezone: 'Europe/Amsterdam' },
      'Portugal': { name: 'Portugal', code: 'PT', currency: 'EUR', languages: ['Portuguese'], timezone: 'Europe/Lisbon' },
      'Austria': { name: 'Austria', code: 'AT', currency: 'EUR', languages: ['German'], timezone: 'Europe/Vienna' },
      'Switzerland': { name: 'Switzerland', code: 'CH', currency: 'CHF', languages: ['German', 'French'], timezone: 'Europe/Zurich' },
      'Ireland': { name: 'Ireland', code: 'IE', currency: 'EUR', languages: ['English'], timezone: 'Europe/Dublin' },
      'Denmark': { name: 'Denmark', code: 'DK', currency: 'DKK', languages: ['Danish'], timezone: 'Europe/Copenhagen' },
      'Sweden': { name: 'Sweden', code: 'SE', currency: 'SEK', languages: ['Swedish'], timezone: 'Europe/Stockholm' },
      'Norway': { name: 'Norway', code: 'NO', currency: 'NOK', languages: ['Norwegian'], timezone: 'Europe/Oslo' },
      'South Korea': { name: 'South Korea', code: 'KR', currency: 'KRW', languages: ['Korean'], timezone: 'Asia/Seoul' },
      'China': { name: 'China', code: 'CN', currency: 'CNY', languages: ['Chinese'], timezone: 'Asia/Shanghai' },
      'Singapore': { name: 'Singapore', code: 'SG', currency: 'SGD', languages: ['English'], timezone: 'Asia/Singapore' },
      'Thailand': { name: 'Thailand', code: 'TH', currency: 'THB', languages: ['Thai'], timezone: 'Asia/Bangkok' },
      'United Arab Emirates': { name: 'United Arab Emirates', code: 'AE', currency: 'AED', languages: ['Arabic'], timezone: 'Asia/Dubai' },
      'Mexico': { name: 'Mexico', code: 'MX', currency: 'MXN', languages: ['Spanish'], timezone: 'America/Mexico_City' },
      'Argentina': { name: 'Argentina', code: 'AR', currency: 'ARS', languages: ['Spanish'], timezone: 'America/Argentina/Buenos_Aires' },
      'Chile': { name: 'Chile', code: 'CL', currency: 'CLP', languages: ['Spanish'], timezone: 'America/Santiago' },
      'Colombia': { name: 'Colombia', code: 'CO', currency: 'COP', languages: ['Spanish'], timezone: 'America/Bogota' },
      'Peru': { name: 'Peru', code: 'PE', currency: 'PEN', languages: ['Spanish'], timezone: 'America/Lima' },
      'New Zealand': { name: 'New Zealand', code: 'NZ', currency: 'NZD', languages: ['English'], timezone: 'Pacific/Auckland' },
      'South Africa': { name: 'South Africa', code: 'ZA', currency: 'ZAR', languages: ['English'], timezone: 'Africa/Johannesburg' },
      'India': { name: 'India', code: 'IN', currency: 'INR', languages: ['Hindi', 'English'], timezone: 'Asia/Kolkata' },
    };

    const data = countryDatabase[standardName];
    if (!data) {
      throw new Error(`Country not found: ${countryName}`);
    }

    return data;
  }

  /**
   * Get approximate coordinates for a city
   * In production, would use geocoding API
   */
  private getCoordinatesForCity(city: string): { lat: number; lng: number } {
    const cityCoords: Record<string, { lat: number; lng: number }> = {
      'São Paulo': { lat: -23.5505, lng: -46.6333 },
      'Barcelona': { lat: 41.3851, lng: 2.1734 },
      'Tokyo': { lat: 35.6762, lng: 139.6503 },
      'London': { lat: 51.5074, lng: -0.1278 },
      'Paris': { lat: 48.8566, lng: 2.3522 },
      'Berlin': { lat: 52.5200, lng: 13.4050 },
      'Rome': { lat: 41.9028, lng: 12.4964 },
      'Madrid': { lat: 40.4168, lng: -3.7038 },
      'Amsterdam': { lat: 52.3676, lng: 4.9041 },
      'Sydney': { lat: -33.8688, lng: 151.2093 },
    };

    return cityCoords[city] || { lat: 0, lng: 0 };
  }

  /**
   * Capitalize city name properly
   */
  private capitalizeCity(city: string): string {
    return city.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Capitalize country name properly
   */
  private capitalizeCountry(country: string): string {
    const normalized = country.toLowerCase();
    const standard = COUNTRY_VARIATIONS[normalized] || country;
    return standard.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

// Export singleton instance
export const locationParser = new LocationParser();
