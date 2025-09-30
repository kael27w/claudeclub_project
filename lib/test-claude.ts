/**
 * Test script for Claude API connection
 * Run with: npx tsx lib/test-claude.ts
 */

import { testClaudeConnection } from './claude-client';

async function runTest() {
  console.log('🧪 Testing Claude API connection...\n');

  const result = await testClaudeConnection();

  if (result.success) {
    console.log('✅ Success!');
    console.log(`   Message: ${result.message}`);
    console.log(`   Model: ${result.model}`);
  } else {
    console.log('❌ Failed!');
    console.log(`   Error: ${result.message}`);
    process.exit(1);
  }
}

runTest();
