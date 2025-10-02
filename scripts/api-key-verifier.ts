/**
 * API Key Verification Script
 * Tests all API keys to establish a truthful baseline of system capabilities
 */

import Anthropic from '@anthropic-ai/sdk';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

// Load environment variables with correct naming from .env.local
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const OPENEXCHANGERATES_APP_ID = process.env.OPENEXCHANGERATES_API_KEY; // Note: different name in .env.local
const YOUTUBE_DATA_API_KEY = process.env.YOUTUBE_API_KEY; // Note: different name in .env.local
const NEWSAPI_API_KEY = process.env.NEWS_API_KEY; // Note: different name in .env.local
const REDDIT_CLIENT_ID = process.env.REDDIT_CLIENT_ID;
const REDDIT_CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET;

interface VerificationResult {
  name: string;
  status: 'VALID' | 'INVALID' | 'MISSING' | 'ERROR';
  message?: string;
  details?: any;
}

const results: VerificationResult[] = [];

/**
 * Verify Anthropic/Claude API Key
 */
async function verifyAnthropicKey(): Promise<VerificationResult> {
  console.log('\n🔍 Testing Anthropic API Key...');

  if (!ANTHROPIC_API_KEY) {
    return {
      name: 'Anthropic Claude API',
      status: 'MISSING',
      message: 'ANTHROPIC_API_KEY not found in environment'
    };
  }

  try {
    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 50,
      messages: [{
        role: 'user',
        content: 'Hello, respond with just "OK"'
      }]
    });

    const content = response.content[0];
    const text = content.type === 'text' ? content.text : '';

    return {
      name: 'Anthropic Claude API',
      status: 'VALID',
      message: 'Successfully connected',
      details: {
        model: response.model,
        responseText: text,
        usage: response.usage
      }
    };
  } catch (error: any) {
    return {
      name: 'Anthropic Claude API',
      status: 'ERROR',
      message: error.message,
      details: error.status
    };
  }
}

/**
 * Verify Perplexity API Key
 */
async function verifyPerplexityKey(): Promise<VerificationResult> {
  console.log('\n🔍 Testing Perplexity API Key...');

  if (!PERPLEXITY_API_KEY) {
    return {
      name: 'Perplexity API',
      status: 'MISSING',
      message: 'PERPLEXITY_API_KEY not found in environment'
    };
  }

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [{
          role: 'user',
          content: 'What is 2+2? Answer with just the number.'
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        name: 'Perplexity API',
        status: 'ERROR',
        message: data.error?.message || 'API request failed',
        details: { status: response.status, data }
      };
    }

    return {
      name: 'Perplexity API',
      status: 'VALID',
      message: 'Successfully connected',
      details: {
        model: data.model,
        responseText: data.choices?.[0]?.message?.content || '',
        usage: data.usage
      }
    };
  } catch (error: any) {
    return {
      name: 'Perplexity API',
      status: 'ERROR',
      message: error.message
    };
  }
}

/**
 * Verify OpenExchangeRates API Key
 */
async function verifyOpenExchangeRatesKey(): Promise<VerificationResult> {
  console.log('\n🔍 Testing OpenExchangeRates API Key...');

  if (!OPENEXCHANGERATES_APP_ID) {
    return {
      name: 'OpenExchangeRates API',
      status: 'MISSING',
      message: 'OPENEXCHANGERATES_APP_ID not found in environment'
    };
  }

  try {
    const response = await fetch(
      `https://openexchangerates.org/api/latest.json?app_id=${OPENEXCHANGERATES_APP_ID}&base=USD`
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        name: 'OpenExchangeRates API',
        status: 'ERROR',
        message: data.message || 'API request failed',
        details: { status: response.status, data }
      };
    }

    return {
      name: 'OpenExchangeRates API',
      status: 'VALID',
      message: 'Successfully connected',
      details: {
        base: data.base,
        timestamp: new Date(data.timestamp * 1000).toISOString(),
        sampleRates: {
          EUR: data.rates.EUR,
          GBP: data.rates.GBP,
          JPY: data.rates.JPY
        }
      }
    };
  } catch (error: any) {
    return {
      name: 'OpenExchangeRates API',
      status: 'ERROR',
      message: error.message
    };
  }
}

/**
 * Verify YouTube Data API Key
 */
async function verifyYouTubeKey(): Promise<VerificationResult> {
  console.log('\n🔍 Testing YouTube Data API Key...');

  if (!YOUTUBE_DATA_API_KEY) {
    return {
      name: 'YouTube Data API',
      status: 'MISSING',
      message: 'YOUTUBE_DATA_API_KEY not found in environment'
    };
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&type=video&maxResults=1&key=${YOUTUBE_DATA_API_KEY}`
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        name: 'YouTube Data API',
        status: 'ERROR',
        message: data.error?.message || 'API request failed',
        details: { status: response.status, data }
      };
    }

    return {
      name: 'YouTube Data API',
      status: 'VALID',
      message: 'Successfully connected',
      details: {
        resultsCount: data.items?.length || 0,
        pageInfo: data.pageInfo
      }
    };
  } catch (error: any) {
    return {
      name: 'YouTube Data API',
      status: 'ERROR',
      message: error.message
    };
  }
}

/**
 * Verify NewsAPI Key
 */
async function verifyNewsAPIKey(): Promise<VerificationResult> {
  console.log('\n🔍 Testing NewsAPI Key...');

  if (!NEWSAPI_API_KEY) {
    return {
      name: 'NewsAPI',
      status: 'MISSING',
      message: 'NEWSAPI_API_KEY not found in environment'
    };
  }

  try {
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=travel&pageSize=1&apiKey=${NEWSAPI_API_KEY}`
    );

    const data = await response.json();

    if (!response.ok || data.status === 'error') {
      return {
        name: 'NewsAPI',
        status: 'ERROR',
        message: data.message || 'API request failed',
        details: { status: response.status, data }
      };
    }

    return {
      name: 'NewsAPI',
      status: 'VALID',
      message: 'Successfully connected',
      details: {
        totalResults: data.totalResults,
        articlesReturned: data.articles?.length || 0
      }
    };
  } catch (error: any) {
    return {
      name: 'NewsAPI',
      status: 'ERROR',
      message: error.message
    };
  }
}

/**
 * Verify Reddit API Credentials
 */
async function verifyRedditKey(): Promise<VerificationResult> {
  console.log('\n🔍 Testing Reddit API Credentials...');

  if (!REDDIT_CLIENT_ID || !REDDIT_CLIENT_SECRET) {
    return {
      name: 'Reddit API',
      status: 'MISSING',
      message: 'REDDIT_CLIENT_ID or REDDIT_CLIENT_SECRET not found in environment'
    };
  }

  try {
    // First, get access token
    const authResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    const authData = await authResponse.json();

    if (!authResponse.ok || authData.error) {
      return {
        name: 'Reddit API',
        status: 'ERROR',
        message: authData.error_description || authData.error || 'Authentication failed',
        details: { status: authResponse.status, authData }
      };
    }

    // Test the access token with a simple API call
    const testResponse = await fetch('https://oauth.reddit.com/api/v1/me', {
      headers: {
        'Authorization': `Bearer ${authData.access_token}`,
        'User-Agent': 'AdaptiveTravelAgent/1.0'
      }
    });

    const testData = await testResponse.json();

    if (!testResponse.ok) {
      return {
        name: 'Reddit API',
        status: 'ERROR',
        message: 'Access token validation failed',
        details: { status: testResponse.status, testData }
      };
    }

    return {
      name: 'Reddit API',
      status: 'VALID',
      message: 'Successfully connected',
      details: {
        tokenType: authData.token_type,
        expiresIn: authData.expires_in
      }
    };
  } catch (error: any) {
    return {
      name: 'Reddit API',
      status: 'ERROR',
      message: error.message
    };
  }
}

/**
 * Main verification function
 */
async function runVerification() {
  console.log('='.repeat(60));
  console.log('🔐 API KEY VERIFICATION SCRIPT');
  console.log('='.repeat(60));

  // Run all verifications
  results.push(await verifyAnthropicKey());
  results.push(await verifyPerplexityKey());
  results.push(await verifyOpenExchangeRatesKey());
  results.push(await verifyYouTubeKey());
  results.push(await verifyNewsAPIKey());
  results.push(await verifyRedditKey());

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('='.repeat(60));

  results.forEach(result => {
    const icon = result.status === 'VALID' ? '✅' :
                 result.status === 'MISSING' ? '⚠️' : '❌';
    console.log(`\n${icon} ${result.name}: ${result.status}`);
    if (result.message) {
      console.log(`   Message: ${result.message}`);
    }
    if (result.details) {
      console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
    }
  });

  // Print final counts
  const validCount = results.filter(r => r.status === 'VALID').length;
  const invalidCount = results.filter(r => r.status === 'ERROR').length;
  const missingCount = results.filter(r => r.status === 'MISSING').length;

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Valid Keys: ${validCount}/${results.length}`);
  console.log(`❌ Invalid/Error Keys: ${invalidCount}/${results.length}`);
  console.log(`⚠️  Missing Keys: ${missingCount}/${results.length}`);
  console.log('='.repeat(60));

  // Exit with appropriate code
  process.exit(validCount === results.length ? 0 : 1);
}

// Run verification
runVerification();
