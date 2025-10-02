/**
 * Cache Seeding Script
 * Pre-loads the cache with fresh data for default examples
 * Run with: npm run cache:seed
 */

// Define the three default queries
const DEFAULT_QUERIES = [
  "I'm studying at FGV in São Paulo for 4 months, $2000 budget, love art and local food, coming from Virginia",
  "Barcelona exchange student for 5 months, €3500 budget, interested in architecture and nightlife, from California",
  "Tokyo semester abroad for 6 months, ¥500000 budget, love technology and anime culture, from New York"
];

const API_URL = 'http://localhost:3000/api/destination/analyze';

async function seedCache() {
  console.log('🌱 Starting cache seeding process...\n');

  for (let i = 0; i < DEFAULT_QUERIES.length; i++) {
    const query = DEFAULT_QUERIES[i];
    console.log(`[${i + 1}/${DEFAULT_QUERIES.length}] Seeding: "${query}"`);

    try {
      const startTime = Date.now();

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      const elapsedTime = Date.now() - startTime;

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`   ❌ FAILED: ${errorData.error || 'Unknown error'}`);
        console.error(`   Status: ${response.status}\n`);
        continue;
      }

      const data = await response.json();
      const location = data.data?.query?.city || 'Unknown';

      console.log(`   ✅ SUCCESS: Cached data for ${location}`);
      console.log(`   ⏱️  Time: ${elapsedTime}ms\n`);

    } catch (error) {
      console.error(`   ❌ ERROR: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    }
  }

  console.log('🎉 Cache seeding complete!\n');
  console.log('Next steps:');
  console.log('1. Start your development server: npm run dev');
  console.log('2. Open the app and test the default examples');
  console.log('3. They should now load in under 2 seconds from cache!\n');
}

// Run the seeding process
seedCache().catch(console.error);
