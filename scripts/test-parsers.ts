/**
 * Parser Verification Script
 * Tests budget and location parsing with real queries
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

import { DestinationIntelligenceAgent } from '../lib/destination-agent';

const agent = new DestinationIntelligenceAgent();

interface TestCase {
  query: string;
  expectedBudget: number;
  expectedCurrency: string;
  expectedCity: string;
  expectedCountry: string;
  expectedOrigin?: string;
}

const testCases: TestCase[] = [
  {
    query: 'Bolivia for 6 months with $3500 budget',
    expectedBudget: 3500,
    expectedCurrency: 'USD',
    expectedCity: 'La Paz',
    expectedCountry: 'Bolivia',
  },
  {
    query: 'I want to study in Barcelona for 4 months with €2000',
    expectedBudget: 2000,
    expectedCurrency: 'EUR',
    expectedCity: 'Barcelona',
    expectedCountry: 'Spain',
  },
  {
    query: 'Tokyo, Japan - 6 months - ¥500000',
    expectedBudget: 500000,
    expectedCurrency: 'JPY',
    expectedCity: 'Tokyo',
    expectedCountry: 'Japan',
  },
  {
    query: 'Studying at FGV in São Paulo for 4 months, $2000 budget, love art and local food, coming from Virginia',
    expectedBudget: 2000,
    expectedCurrency: 'USD',
    expectedCity: 'São Paulo',
    expectedCountry: 'Brazil',
    expectedOrigin: 'Virginia',
  },
  {
    query: 'London study abroad, budget of $4,500 for 5 months',
    expectedBudget: 4500,
    expectedCurrency: 'USD',
    expectedCity: 'London',
    expectedCountry: 'United Kingdom',
  },
  {
    query: 'Honduras exchange program, 3 months, $1200',
    expectedBudget: 1200,
    expectedCurrency: 'USD',
    expectedCity: 'Tegucigalpa',
    expectedCountry: 'Honduras',
  },
];

async function runTests() {
  console.log('='.repeat(70));
  console.log('🧪 PARSER VERIFICATION TESTS');
  console.log('='.repeat(70));

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    console.log(`\n📝 Testing: "${testCase.query}"`);
    console.log('-'.repeat(70));

    try {
      const result = await agent.parseQuery(testCase.query);

      console.log(`✓ Raw Query: ${result.rawQuery}`);
      console.log(`✓ Parsed Destination: ${result.city}, ${result.country}`);
      console.log(`✓ Budget: ${result.currency} ${result.budget}`);
      console.log(`✓ Duration: ${result.durationMonths} months`);
      console.log(`✓ Origin: ${result.origin.state || result.origin.country}`);
      console.log(`✓ Interests: ${result.interests.join(', ')}`);

      // Verify expectations
      const checks = [
        {
          name: 'Budget Amount',
          actual: result.budget,
          expected: testCase.expectedBudget,
          pass: result.budget === testCase.expectedBudget,
        },
        {
          name: 'Currency',
          actual: result.currency,
          expected: testCase.expectedCurrency,
          pass: result.currency === testCase.expectedCurrency,
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

      if (testCase.expectedOrigin) {
        checks.push({
          name: 'Origin',
          actual: result.origin.state || result.origin.country,
          expected: testCase.expectedOrigin,
          pass: (result.origin.state || result.origin.country) === testCase.expectedOrigin,
        });
      }

      const allPassed = checks.every(c => c.pass);

      console.log('\n📊 Verification:');
      checks.forEach(check => {
        const icon = check.pass ? '✅' : '❌';
        console.log(`  ${icon} ${check.name}: ${check.actual} ${check.pass ? '==' : '!='} ${check.expected}`);
      });

      if (allPassed) {
        console.log('\n✅ TEST PASSED');
        passed++;
      } else {
        console.log('\n❌ TEST FAILED');
        failed++;
      }
    } catch (error: any) {
      console.log(`\n❌ TEST ERROR: ${error.message}`);
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

// Run tests
runTests();
