/**
 * QA Test Script: São Paulo Query
 * Tests currency conversion, Portuguese phrases, and cost accuracy
 */

async function testSaoPauloQuery() {
  console.log('\n🧪 Starting QA Test: São Paulo Query\n');
  console.log('=' .repeat(60));
  
  const query = {
    rawQuery: "I'm studying at FGV in São Paulo for 4 months, $2000 budget per month, love art and local food, coming from Virginia",
    city: "São Paulo",
    country: "Brazil",
    university: "FGV",
    durationMonths: 4,
    budget: 8000, // $2000/month * 4 months
    currency: "USD",
    interests: ["art", "local food"],
    origin: {
      city: "",
      state: "Virginia",
      country: "United States"
    }
  };

  try {
    console.log('📤 Sending request to /api/destination/analyze...\n');
    console.log('Query:', JSON.stringify(query, null, 2));
    
    const response = await fetch('http://localhost:3001/api/destination/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(query),
    });

    if (!response.ok) {
      console.error('❌ API request failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error body:', errorText);
      process.exit(1);
    }

    console.log('✅ Response received successfully\n');
    
    const data = await response.json();
    
    console.log('=' .repeat(60));
    console.log('\n📊 QA TEST RESULTS:\n');
    
    // Test 1: Currency Conversion
    console.log('1️⃣  CURRENCY CONVERSION TEST');
    console.log('-'.repeat(60));
    if (data.costAnalysis?.currency) {
      const rate = data.costAnalysis.currency.exchangeRate;
      const fromCurrency = data.costAnalysis.currency.fromCurrency;
      const toCurrency = data.costAnalysis.currency.toCurrency;
      
      console.log(`   Exchange Rate: 1 ${fromCurrency} = ${rate} ${toCurrency}`);
      console.log(`   From: ${fromCurrency} | To: ${toCurrency}`);
      console.log(`   Budget in Local Currency: ${data.costAnalysis.currency.budgetInLocalCurrency} ${toCurrency}`);
      
      if (rate > 5.0 && rate < 7.0) {
        console.log(`   ✅ PASS: Realistic BRL rate (${rate})`);
      } else if (rate === 1.0) {
        console.log(`   ❌ FAIL: Still showing default rate of 1.0!`);
      } else {
        console.log(`   ⚠️  WARNING: Rate ${rate} seems unusual (expected 5-7 for BRL)`);
      }
    } else {
      console.log('   ❌ FAIL: No currency data found!');
    }
    
    // Test 2: Portuguese Phrases
    console.log('\n2️⃣  PORTUGUESE PHRASES TEST');
    console.log('-'.repeat(60));
    if (data.culturalGuide?.language?.essentialPhrases) {
      const phrases = data.culturalGuide.language.essentialPhrases;
      console.log(`   Found ${phrases.length} phrases:`);
      
      let hasRealPortuguese = false;
      phrases.forEach((p: any, i: number) => {
        console.log(`   ${i + 1}. "${p.phrase}" = ${p.translation} (${p.pronunciation || 'no pronunciation'})`);
        
        // Check if it's real Portuguese (not generic placeholders)
        if (p.phrase && !p.phrase.toLowerCase().includes('local') && !p.phrase.toLowerCase().includes('hello') && p.phrase.length > 2) {
          hasRealPortuguese = true;
        }
      });
      
      if (hasRealPortuguese) {
        console.log('   ✅ PASS: Contains real Portuguese phrases');
      } else {
        console.log('   ❌ FAIL: Still showing generic placeholders!');
      }
    } else {
      console.log('   ❌ FAIL: No essential phrases found!');
    }
    
    // Test 3: Cost Data
    console.log('\n3️⃣  COST DATA TEST');
    console.log('-'.repeat(60));
    if (data.costAnalysis?.livingCosts) {
      const costs = data.costAnalysis.livingCosts;
      console.log('   Living Costs (converted to USD):');
      console.log(`     Food: $${costs.food?.monthly?.average || 'N/A'}/month`);
      console.log(`     Transport: $${costs.transport?.monthly?.average || 'N/A'}/month`);
      console.log(`     Entertainment: $${costs.entertainment?.monthly?.average || 'N/A'}/month`);
      console.log(`     Total: $${costs.total?.monthly?.average || 'N/A'}/month`);
      
      if (costs.total?.monthly?.average && costs.total.monthly.average > 0) {
        console.log('   ✅ PASS: Cost data present');
      } else {
        console.log('   ❌ FAIL: Missing or zero cost data');
      }
    }
    
    // Test 4: Housing
    console.log('\n4️⃣  HOUSING DATA TEST');
    console.log('-'.repeat(60));
    if (data.costAnalysis?.housing) {
      const housing = data.costAnalysis.housing;
      console.log('   Housing Options (in USD):');
      console.log(`     Student Housing: $${housing.studentHousing?.monthly?.average || 'N/A'}/month`);
      console.log(`     Airbnb: $${housing.airbnb?.monthly?.average || 'N/A'}/month`);
      console.log(`     Apartments: $${housing.apartments?.monthly?.average || 'N/A'}/month`);
      
      if (housing.studentHousing?.monthly?.average) {
        console.log('   ✅ PASS: Housing data present');
      } else {
        console.log('   ❌ FAIL: Missing housing data');
      }
    }
    
    // Test 5: Budget Plan
    console.log('\n5️⃣  BUDGET FEASIBILITY TEST');
    console.log('-'.repeat(60));
    if (data.budgetPlan) {
      console.log(`   Feasibility: ${data.budgetPlan.feasibility || 'N/A'}`);
      console.log(`   Total Estimated Monthly Cost: $${data.budgetPlan.totalEstimatedMonthlyCost || 'N/A'}`);
      console.log(`   User's Monthly Budget: $${query.budget / query.durationMonths}`);
      
      if (data.budgetPlan.feasibility) {
        console.log('   ✅ PASS: Budget analysis complete');
      } else {
        console.log('   ❌ FAIL: Missing feasibility assessment');
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ São Paulo test completed!\n');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  }
}

testSaoPauloQuery();
