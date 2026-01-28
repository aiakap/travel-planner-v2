#!/usr/bin/env tsx

/**
 * Get Lucky Test Script
 * 
 * Tests the "Surprise Trip" feature components without making API calls.
 * Run with: npx tsx scripts/test-get-lucky.ts
 */

import { zodToJsonSchema } from 'zod-to-json-schema';
import { expResponseSchema } from '../lib/schemas/exp-response-schema';
import { buildGetLuckySystemPrompt, buildGetLuckyUserMessage, type TripGenerationParams } from '../lib/ai/get-lucky-full-generation-prompt';
import { getActivityDensity } from '../lib/utils/profile-helpers';
import { validateOpenAISchema, formatValidationErrors, analyzeSchemaComplexity } from '../lib/utils/validate-openai-schema';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title: string) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60));
}

function test(name: string, passed: boolean, details?: string) {
  const icon = passed ? '✅' : '❌';
  const color = passed ? 'green' : 'red';
  log(`${icon} ${name}`, color);
  if (details) {
    log(`   ${details}`, 'gray');
  }
}

async function testGetLucky() {
  log('\n🧪 Get Lucky Feature Test Suite\n', 'bright');
  log('Testing all components without making API calls', 'cyan');
  
  let allTestsPassed = true;
  
  // ============================================================================
  // Test 1: Activity Density Calculation
  // ============================================================================
  section('Test 1: Activity Density Calculation');
  
  try {
    const densities = {
      'Relaxed': getActivityDensity('Relaxed'),
      'Moderate': getActivityDensity('Moderate'),
      'Active': getActivityDensity('Active'),
      'Adventurous': getActivityDensity('Adventurous'),
    };
    
    const expectedDensities = {
      'Relaxed': { activitiesPerDay: 1, restaurantsPerDay: 1 },
      'Moderate': { activitiesPerDay: 2, restaurantsPerDay: 2 },
      'Active': { activitiesPerDay: 2, restaurantsPerDay: 3 },
      'Adventurous': { activitiesPerDay: 3, restaurantsPerDay: 3 },
    };
    
    let densityTestPassed = true;
    for (const [level, density] of Object.entries(densities)) {
      const expected = expectedDensities[level as keyof typeof expectedDensities];
      const matches = density.activitiesPerDay === expected.activitiesPerDay && 
                     density.restaurantsPerDay === expected.restaurantsPerDay;
      
      test(
        `${level}: ${density.activitiesPerDay} activities, ${density.restaurantsPerDay} meals`,
        matches,
        matches ? 'Correct' : `Expected ${expected.activitiesPerDay} activities, ${expected.restaurantsPerDay} meals`
      );
      
      if (!matches) densityTestPassed = false;
    }
    
    allTestsPassed = allTestsPassed && densityTestPassed;
  } catch (error: any) {
    test('Activity Density Calculation', false, error.message);
    allTestsPassed = false;
  }
  
  // ============================================================================
  // Test 2: Prompt Building
  // ============================================================================
  section('Test 2: Prompt Building');
  
  try {
    const promptParams: TripGenerationParams = {
      destination: 'Barcelona, Spain',
      destinationHighlights: 'Sagrada Familia, Park Güell, Gothic Quarter',
      startDate: '2026-03-01',
      endDate: '2026-03-08',
      durationDays: 7,
      budgetLevel: 'moderate',
      activityLevel: 'Moderate',
      activityDensity: { activitiesPerDay: 2, restaurantsPerDay: 2 },
      accommodation: 'Hotel',
      travelPace: 'Balanced',
      travelers: 'solo traveler',
      homeCity: 'New York',
    };
    
    const systemPrompt = buildGetLuckySystemPrompt(promptParams);
    const userMessage = buildGetLuckyUserMessage(promptParams);
    
    test('System prompt generated', systemPrompt.length > 0, `${systemPrompt.length} characters`);
    test('User message generated', userMessage.length > 0, `${userMessage.length} characters`);
    test('Prompt contains destination', systemPrompt.includes('Barcelona'), 'Found in system prompt');
    test('Prompt contains activity density', systemPrompt.includes('2 activities per day'), 'Found in system prompt');
    test('Prompt contains budget level', systemPrompt.includes('moderate'), 'Found in system prompt');
    
    log(`\n   System prompt preview:`, 'gray');
    log(`   ${systemPrompt.substring(0, 200)}...`, 'gray');
  } catch (error: any) {
    test('Prompt Building', false, error.message);
    allTestsPassed = false;
  }
  
  // ============================================================================
  // Test 3: Schema Conversion
  // ============================================================================
  section('Test 3: Schema Conversion');
  
  let convertedSchema: any;
  try {
    const startTime = Date.now();
    convertedSchema = zodToJsonSchema(expResponseSchema, { target: 'openAi' });
    const duration = Date.now() - startTime;
    
    test('Schema converted successfully', true, `${duration}ms`);
    test('Schema has type property', !!convertedSchema.type, `Type: ${convertedSchema.type}`);
    test('Schema type is object', convertedSchema.type === 'object', `Expected 'object', got '${convertedSchema.type}'`);
    test('Schema has properties', !!convertedSchema.properties, `${Object.keys(convertedSchema.properties || {}).length} properties`);
    
    const schemaSize = JSON.stringify(convertedSchema).length;
    test('Schema size reasonable', schemaSize < 100000, `${schemaSize} bytes`);
    
    if (convertedSchema.properties) {
      const propertyKeys = Object.keys(convertedSchema.properties);
      log(`\n   Properties: ${propertyKeys.join(', ')}`, 'gray');
      
      const requiredProps = convertedSchema.required || [];
      log(`   Required: ${requiredProps.join(', ')}`, 'gray');
    }
  } catch (error: any) {
    test('Schema Conversion', false, error.message);
    allTestsPassed = false;
    convertedSchema = null;
  }
  
  // ============================================================================
  // Test 4: Schema Validation
  // ============================================================================
  section('Test 4: Schema Validation');
  
  if (convertedSchema) {
    try {
      const validation = validateOpenAISchema(convertedSchema);
      
      test('Schema validation completed', true);
      test('Schema is valid', validation.valid, validation.valid ? 'No errors' : `${validation.errors.length} errors`);
      
      if (validation.errors.length > 0) {
        log('\n   Validation Errors:', 'red');
        validation.errors.forEach((error, i) => {
          log(`   ${i + 1}. ${error}`, 'red');
        });
        allTestsPassed = false;
      }
      
      if (validation.warnings.length > 0) {
        log('\n   Validation Warnings:', 'yellow');
        validation.warnings.forEach((warning, i) => {
          log(`   ${i + 1}. ${warning}`, 'yellow');
        });
      }
      
      // Analyze complexity
      const complexity = analyzeSchemaComplexity(convertedSchema);
      log(`\n   Schema Complexity:`, 'cyan');
      log(`   - Total properties: ${complexity.totalProperties}`, 'gray');
      log(`   - Max depth: ${complexity.maxDepth}`, 'gray');
      log(`   - Has unions: ${complexity.hasUnions}`, 'gray');
      log(`   - Estimated size: ${complexity.estimatedSize} bytes`, 'gray');
      
    } catch (error: any) {
      test('Schema Validation', false, error.message);
      allTestsPassed = false;
    }
  } else {
    test('Schema Validation', false, 'Schema conversion failed, skipping validation');
    allTestsPassed = false;
  }
  
  // ============================================================================
  // Test 5: OpenAI Compatibility Check
  // ============================================================================
  section('Test 5: OpenAI Compatibility Check');
  
  if (convertedSchema) {
    try {
      // Check for common OpenAI incompatibilities
      const checks = {
        'No oneOf usage': !JSON.stringify(convertedSchema).includes('"oneOf"'),
        'No $ref usage': !JSON.stringify(convertedSchema).includes('"$ref"'),
        'Root is object': convertedSchema.type === 'object',
        'Has properties': !!convertedSchema.properties,
        'additionalProperties is false': convertedSchema.additionalProperties === false,
      };
      
      for (const [checkName, passed] of Object.entries(checks)) {
        test(checkName, passed);
        if (!passed) allTestsPassed = false;
      }
      
      // Check if schema would be accepted by OpenAI
      const wouldBeAccepted = Object.values(checks).every(v => v);
      test('Schema would be accepted by OpenAI', wouldBeAccepted, wouldBeAccepted ? 'All checks passed' : 'Some checks failed');
      
    } catch (error: any) {
      test('OpenAI Compatibility Check', false, error.message);
      allTestsPassed = false;
    }
  } else {
    test('OpenAI Compatibility Check', false, 'Schema conversion failed, skipping compatibility check');
    allTestsPassed = false;
  }
  
  // ============================================================================
  // Summary
  // ============================================================================
  section('Test Summary');
  
  if (allTestsPassed) {
    log('\n✅ All tests passed!', 'green');
    log('The Get Lucky feature is ready for testing with OpenAI.', 'cyan');
    log('\nNext steps:', 'bright');
    log('1. Open http://localhost:3000/admin/get-lucky-test', 'gray');
    log('2. Run a test with the debug harness', 'gray');
    log('3. Check server logs for detailed output', 'gray');
  } else {
    log('\n❌ Some tests failed!', 'red');
    log('Please review the errors above and fix the issues.', 'yellow');
    process.exit(1);
  }
  
  log('');
}

// Run tests
testGetLucky().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
