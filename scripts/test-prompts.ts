/**
 * Prompt Testing Script
 * 
 * Tests both the default and EXP1 prompts with various queries
 * to ensure they return valid JSON responses.
 * 
 * Usage:
 *   npx tsx scripts/test-prompts.ts
 */

import { generatePlaceSuggestions } from "@/lib/ai/generate-place-suggestions";
import { EXP_BUILDER_SYSTEM_PROMPT } from "@/app/exp/lib/exp-prompts";
import { validateAIResponse, formatValidationErrors } from "@/lib/ai/validate-ai-response";

interface TestResult {
  query: string;
  promptType: string;
  success: boolean;
  duration: number;
  error?: string;
  stats?: {
    textLength: number;
    placesCount: number;
    transportCount: number;
    hotelsCount: number;
  };
  validation?: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
}

async function testPrompt(query: string, useExpPrompt: boolean): Promise<TestResult> {
  const promptType = useExpPrompt ? "EXP1" : "DEFAULT";
  const startTime = Date.now();
  
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Testing: ${query}`);
  console.log(`Prompt: ${promptType}`);
  console.log("=".repeat(60));
  
  try {
    const result = await generatePlaceSuggestions(
      query,
      undefined,
      undefined,
      useExpPrompt ? EXP_BUILDER_SYSTEM_PROMPT : undefined
    );
    
    const duration = Date.now() - startTime;
    
    // Validate the response
    const validation = validateAIResponse(result);
    
    const stats = {
      textLength: result.text.length,
      placesCount: result.places.length,
      transportCount: (result as any).transport?.length || 0,
      hotelsCount: (result as any).hotels?.length || 0,
    };
    
    console.log("✅ Success!");
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Text length: ${stats.textLength} chars`);
    console.log(`   Places: ${stats.placesCount}`);
    console.log(`   Transport: ${stats.transportCount}`);
    console.log(`   Hotels: ${stats.hotelsCount}`);
    
    if (!validation.valid) {
      console.error("❌ Validation failed:", formatValidationErrors(validation));
    } else if (validation.warnings.length > 0) {
      console.warn("⚠️  Warnings:", formatValidationErrors(validation));
    }
    
    return {
      query,
      promptType,
      success: true,
      duration,
      stats,
      validation,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error("❌ Failed:", errorMessage);
    
    return {
      query,
      promptType,
      success: false,
      duration,
      error: errorMessage,
    };
  }
}

async function runTests() {
  console.log("\n" + "=".repeat(80));
  console.log("PROMPT TESTING SUITE");
  console.log("=".repeat(80));
  
  const testQueries = [
    "Plan a trip to Paris",
    "Show me restaurants in Tokyo",
    "Add flights from NYC to London",
    "I want to visit Bali for 2 weeks",
    "Suggest hotels in Rome",
  ];
  
  const results: TestResult[] = [];
  
  // Test each query with both prompts
  for (const query of testQueries) {
    // Test default prompt
    results.push(await testPrompt(query, false));
    
    // Test EXP1 prompt
    results.push(await testPrompt(query, true));
  }
  
  // Print summary
  console.log("\n" + "=".repeat(80));
  console.log("TEST SUMMARY");
  console.log("=".repeat(80));
  
  const defaultResults = results.filter(r => r.promptType === "DEFAULT");
  const exp1Results = results.filter(r => r.promptType === "EXP1");
  
  const defaultSuccess = defaultResults.filter(r => r.success).length;
  const exp1Success = exp1Results.filter(r => r.success).length;
  
  console.log(`\nDEFAULT Prompt: ${defaultSuccess}/${defaultResults.length} passed`);
  console.log(`EXP1 Prompt: ${exp1Success}/${exp1Results.length} passed`);
  
  // Show failures
  const failures = results.filter(r => !r.success);
  if (failures.length > 0) {
    console.log("\n❌ FAILURES:");
    failures.forEach(f => {
      console.log(`   ${f.promptType} - "${f.query}": ${f.error}`);
    });
  }
  
  // Show validation issues
  const validationIssues = results.filter(r => r.validation && !r.validation.valid);
  if (validationIssues.length > 0) {
    console.log("\n⚠️  VALIDATION ISSUES:");
    validationIssues.forEach(r => {
      console.log(`   ${r.promptType} - "${r.query}": ${formatValidationErrors(r.validation!)}`);
    });
  }
  
  // Average durations
  const avgDefaultDuration = defaultResults.reduce((sum, r) => sum + r.duration, 0) / defaultResults.length;
  const avgExp1Duration = exp1Results.reduce((sum, r) => sum + r.duration, 0) / exp1Results.length;
  
  console.log("\n⏱️  AVERAGE RESPONSE TIMES:");
  console.log(`   DEFAULT: ${avgDefaultDuration.toFixed(0)}ms`);
  console.log(`   EXP1: ${avgExp1Duration.toFixed(0)}ms`);
  
  console.log("\n" + "=".repeat(80));
  
  // Exit with error code if any tests failed
  const allPassed = results.every(r => r.success && r.validation?.valid);
  if (!allPassed) {
    console.error("\n❌ Some tests failed or had validation issues");
    process.exit(1);
  } else {
    console.log("\n✅ All tests passed!");
    process.exit(0);
  }
}

// Run the tests
runTests().catch(error => {
  console.error("Fatal error running tests:", error);
  process.exit(1);
});
