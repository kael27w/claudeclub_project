/**
 * Comprehensive Test Script for All API Clients
 * Tests OpenAI, Gemini, Perplexity, and Currency Exchange clients
 */

// Load environment variables from .env.local
import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local from the project root
config({ path: resolve(__dirname, "../.env.local") });

import { generateChatCompletion } from "../apps/api/src/services/clients/openai.client";
import { generateGeminiContent } from "../apps/api/src/services/clients/gemini.client";
import { performOnlineSearch } from "../apps/api/src/services/clients/perplexity.client";
import { getExchangeRates } from "../apps/api/src/services/clients/currency.client";

// ANSI color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function printHeader(title: string) {
  console.log(
    `\n${colors.bright}${colors.blue}${"=".repeat(80)}${colors.reset}`
  );
  console.log(`${colors.bright}${colors.cyan}${title}${colors.reset}`);
  console.log(
    `${colors.bright}${colors.blue}${"=".repeat(80)}${colors.reset}\n`
  );
}

function printSuccess(message: string) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
}

function printError(message: string) {
  console.log(`${colors.red}✗ ${message}${colors.reset}`);
}

function printInfo(message: string) {
  console.log(`${colors.yellow}ℹ ${message}${colors.reset}`);
}

async function testOpenAIClient() {
  printHeader("TEST 1: OpenAI (ChatGPT) Client - gpt-4o");

  const testPrompt = "What are the top 3 tourist attractions in Paris? Be brief.";
  printInfo(`Prompt: "${testPrompt}"`);

  const result = await generateChatCompletion(testPrompt);

  if (result.success) {
    printSuccess("OpenAI client test PASSED");
    console.log(`\n${colors.bright}Response:${colors.reset}`);
    console.log(result.data);
  } else {
    printError(`OpenAI client test FAILED: ${result.error}`);
  }

  return result.success;
}

async function testGeminiClient() {
  printHeader("TEST 2: Google Gemini Client - gemini-pro");

  // Check if Gemini API key is available (including typo variant)
  if (!process.env.GEMINI_API_KEY && !process.env.GEMIINI_API_KEY && !process.env.GOOGLE_API_KEY) {
    printInfo("Gemini API key not configured - SKIPPING test");
    printInfo(
      "Note: YouTube API keys don't work for Gemini. You need a separate Gemini API key from Google AI Studio."
    );
    return null; // Return null to indicate skipped test
  }

  const testPrompt = "Explain quantum computing in one sentence.";
  printInfo(`Prompt: "${testPrompt}"`);

  const result = await generateGeminiContent(testPrompt);

  if (result.success) {
    printSuccess("Gemini client test PASSED");
    console.log(`\n${colors.bright}Response:${colors.reset}`);
    console.log(result.data);
  } else {
    printError(`Gemini client test FAILED: ${result.error}`);
  }

  return result.success;
}

async function testPerplexityClient() {
  printHeader("TEST 3: Perplexity Client - sonar-small-32k-online");

  const testPrompt = "What is the current cost of living in Lisbon?";
  printInfo(`Prompt: "${testPrompt}"`);

  const result = await performOnlineSearch(testPrompt);

  if (result.success) {
    printSuccess("Perplexity client test PASSED");
    console.log(`\n${colors.bright}Response:${colors.reset}`);
    console.log(result.data);
  } else {
    printError(`Perplexity client test FAILED: ${result.error}`);
  }

  return result.success;
}

async function testCurrencyClient() {
  printHeader("TEST 4: Currency Exchange Client - OpenExchangeRates");

  const baseCurrency = "USD";
  const targetCurrencies = ["BRL", "EUR", "GBP", "JPY"];
  printInfo(
    `Base: ${baseCurrency}, Targets: ${targetCurrencies.join(", ")}`
  );

  const result = await getExchangeRates(baseCurrency, targetCurrencies);

  if (result.success) {
    printSuccess("Currency client test PASSED");
    console.log(`\n${colors.bright}Exchange Rates:${colors.reset}`);
    console.log(JSON.stringify(result.data, null, 2));
  } else {
    printError(`Currency client test FAILED: ${result.error}`);
  }

  return result.success;
}

async function runAllTests() {
  console.log(
    `${colors.bright}${colors.cyan}\n🚀 Starting API Client Test Suite${colors.reset}`
  );
  console.log(`${colors.yellow}Testing all four core API clients...${colors.reset}\n`);

  const results: {
    openai: boolean | null;
    gemini: boolean | null;
    perplexity: boolean | null;
    currency: boolean | null;
  } = {
    openai: false,
    gemini: false,
    perplexity: false,
    currency: false,
  };

  // Run all tests sequentially
  try {
    results.openai = await testOpenAIClient();
  } catch (error) {
    printError(
      `OpenAI test crashed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }

  try {
    results.gemini = await testGeminiClient();
  } catch (error) {
    printError(
      `Gemini test crashed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }

  try {
    results.perplexity = await testPerplexityClient();
  } catch (error) {
    printError(
      `Perplexity test crashed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }

  try {
    results.currency = await testCurrencyClient();
  } catch (error) {
    printError(
      `Currency test crashed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }

  // Print final summary
  printHeader("TEST SUMMARY");

  const totalTests = Object.values(results).filter((r) => r !== null).length;
  const passedTests = Object.values(results).filter((r) => r === true).length;
  const skippedTests = Object.values(results).filter((r) => r === null).length;
  const failedTests = totalTests - passedTests;

  console.log(`${colors.bright}Total Tests:${colors.reset} ${totalTests + skippedTests}`);
  console.log(
    `${colors.green}${colors.bright}Passed:${colors.reset} ${passedTests}`
  );
  console.log(
    `${colors.red}${colors.bright}Failed:${colors.reset} ${failedTests}`
  );
  if (skippedTests > 0) {
    console.log(
      `${colors.yellow}${colors.bright}Skipped:${colors.reset} ${skippedTests}`
    );
  }
  console.log();

  console.log(`${colors.bright}Individual Results:${colors.reset}`);
  console.log(
    `  OpenAI (ChatGPT):     ${results.openai ? colors.green + "✓ PASS" : results.openai === null ? colors.yellow + "⊘ SKIP" : colors.red + "✗ FAIL"}${colors.reset}`
  );
  console.log(
    `  Google Gemini:        ${results.gemini ? colors.green + "✓ PASS" : results.gemini === null ? colors.yellow + "⊘ SKIP" : colors.red + "✗ FAIL"}${colors.reset}`
  );
  console.log(
    `  Perplexity:           ${results.perplexity ? colors.green + "✓ PASS" : results.perplexity === null ? colors.yellow + "⊘ SKIP" : colors.red + "✗ FAIL"}${colors.reset}`
  );
  console.log(
    `  Currency Exchange:    ${results.currency ? colors.green + "✓ PASS" : results.currency === null ? colors.yellow + "⊘ SKIP" : colors.red + "✗ FAIL"}${colors.reset}`
  );

  if (passedTests === totalTests) {
    console.log(
      `\n${colors.green}${colors.bright}🎉 ALL TESTS PASSED! 🎉${colors.reset}\n`
    );
    process.exit(0);
  } else if (failedTests === 0 && passedTests > 0) {
    console.log(
      `\n${colors.green}${colors.bright}✓ ALL CONFIGURED TESTS PASSED!${colors.reset}\n`
    );
    process.exit(0);
  } else {
    console.log(
      `\n${colors.red}${colors.bright}❌ SOME TESTS FAILED${colors.reset}\n`
    );
    process.exit(1);
  }
}

// Run the test suite
runAllTests().catch((error) => {
  console.error(
    `${colors.red}${colors.bright}Fatal error running tests:${colors.reset}`,
    error
  );
  process.exit(1);
});
