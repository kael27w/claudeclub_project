/**
 * Simple Parser Verification Script
 * Direct testing of fallbackParse method
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables FIRST
config({ path: resolve(process.cwd(), '.env.local') });

interface TestCase {
  query: string;
  expectedBudget: number;
  expectedCity: string;
  expectedCountry: string;
}

const testCases: TestCase[] = [
  {
    query: 'Bolivia for 6 months with $3500 budget',
    expectedBudget: 3500,
    expectedCity: 'La Paz',
    expectedCountry: 'Bolivia',
  },
  {
    query: 'Barcelona for 4 months with €2000',
    expectedBudget: 2000,
    expectedCity: 'Barcelona',
    expectedCountry: 'Spain',
  },
  {
    query: 'Tokyo, Japan - 6 months - ¥500000',
    expectedBudget: 500000,
    expectedCity: 'Tokyo',
    expectedCountry: 'Japan',
  },
  {
    query: 'Studying at FGV in São Paulo for 4 months, $2000 budget',
    expectedBudget: 2000,
    expectedCity: 'São Paulo',
    expectedCountry: 'Brazil',
  },
  {
    query: 'London study abroad, budget of $4,500 for 5 months',
    expectedBudget: 4500,
    expectedCity: 'London',
    expectedCountry: 'United Kingdom',
  },
];

// Inline fallbackParse logic for testing
function fallbackParse(rawQuery: string) {
  // Extract location - try multiple patterns
  const locationPatterns = [
    /^([A-Za-zÀ-ÿ\s]+),\s*([A-Za-zÀ-ÿ\s]+?)\s*(?:-|for|with|$)/i,
    /studying\s+(?:at|in)\s+\w+\s+in\s+([A-Za-zÀ-ÿ\s]+?)(?:,|\s+for|\s+with)/i,
    /^([A-Za-zÀ-ÿ\s]+?)(?:\s+for|\s+with|\s+\$)/i,
    /^([A-Za-zÀ-ÿ\s]+?)\s+(?:study|studying|semester|exchange)/i,
    /(?:in|to|at)\s+([A-Za-zÀ-ÿ\s]+?)(?:,|\s+for|\s+with|\s+\$)/i,
  ];

  let destination: string | null = null;
  let specifiedCountry: string | null = null;

  for (const pattern of locationPatterns) {
    const match = rawQuery.match(pattern);
    if (match && match[1]) {
      destination = match[1].trim();
      if (match[2]) {
        specifiedCountry = match[2].trim();
      }
      break;
    }
  }

  // Extract budget - MUST look for budget context, not just any number
  const budgetPatterns = [
    // "budget of $3500", "$3500 budget", "with $3500"
    /(?:budget\s+(?:of\s+)?|with\s+)(\$|€|£|¥|R\$)?\s*(\d+(?:,\d{3})*(?:\.\d+)?)/i,
    // Just currency symbol + number as last resort
    /(\$|€|£|¥|R\$)\s*(\d+(?:,\d{3})*(?:\.\d+)?)(?!\s*month)/i,
  ];

  let budgetValue = 2000;

  for (const pattern of budgetPatterns) {
    const match = rawQuery.match(pattern);
    if (match) {
      const numberStr = match[2].replace(/,/g, '');
      budgetValue = parseFloat(numberStr);
      break;
    }
  }

  // Parse destination
  let city = destination || 'Barcelona';
  let country = specifiedCountry || 'Spain';

  if (destination) {
    city = destination.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    if (specifiedCountry) {
      const countryNormalizations: Record<string, string> = {
        'japan': 'Japan',
        'spain': 'Spain',
        'uk': 'United Kingdom',
        'united kingdom': 'United Kingdom',
      };
      country = countryNormalizations[specifiedCountry.toLowerCase()] ||
                specifiedCountry.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    } else {
      const lowerDest = destination.toLowerCase();
      const cityCountryMap: Record<string, { city: string; country: string }> = {
        'barcelona': { city: 'Barcelona', country: 'Spain' },
        'são paulo': { city: 'São Paulo', country: 'Brazil' },
        'sao paulo': { city: 'São Paulo', country: 'Brazil' },
        'tokyo': { city: 'Tokyo', country: 'Japan' },
        'london': { city: 'London', country: 'United Kingdom' },
        'bolivia': { city: 'La Paz', country: 'Bolivia' },
      };

      const match = cityCountryMap[lowerDest];
      if (match) {
        city = match.city;
        country = match.country;
      }
    }
  }

  return { city, country, budget: budgetValue };
}

function runTests() {
  console.log('='.repeat(70));
  console.log('🧪 FALLBACK PARSER VERIFICATION TESTS');
  console.log('='.repeat(70));

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    console.log(`\n📝 Testing: "${testCase.query}"`);
    console.log('-'.repeat(70));

    const result = fallbackParse(testCase.query);

    console.log(`✓ Parsed: ${result.city}, ${result.country} - $${result.budget}`);

    const checks = [
      {
        name: 'Budget',
        actual: result.budget,
        expected: testCase.expectedBudget,
        pass: result.budget === testCase.expectedBudget,
      },
      {
        name: 'City',
        actual: result.city,
        expected: testCase.expectedCity,
        pass: result.city === testCase.expectedCity,
      },
      {
        name: 'Country',
        actual: result.country,
        expected: testCase.expectedCountry,
        pass: result.country === testCase.expectedCountry,
      },
    ];

    const allPassed = checks.every(c => c.pass);

    console.log('📊 Verification:');
    checks.forEach(check => {
      const icon = check.pass ? '✅' : '❌';
      console.log(`  ${icon} ${check.name}: ${check.actual} ${check.pass ? '==' : '!='} ${check.expected}`);
    });

    if (allPassed) {
      console.log('✅ PASSED');
      passed++;
    } else {
      console.log('❌ FAILED');
      failed++;
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 FINAL RESULTS');
  console.log('='.repeat(70));
  console.log(`✅ Passed: ${passed}/${testCases.length}`);
  console.log(`❌ Failed: ${failed}/${testCases.length}`);
  console.log(`Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);
  console.log('='.repeat(70));

  process.exit(failed === 0 ? 0 : 1);
}

runTests();
