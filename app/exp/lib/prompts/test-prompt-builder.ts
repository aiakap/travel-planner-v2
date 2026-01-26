/**
 * Manual test script to verify the prompt builder works
 * Run with: npx ts-node app/exp/lib/prompts/test-prompt-builder.ts
 */

import { buildExpPrompt } from './build-exp-prompt';
import { PromptBuildContext } from './types';

console.log('🧪 Testing Prompt Builder System\n');
console.log('='.repeat(80));

// Test 1: Simple trip creation
console.log('\n📝 Test 1: Trip Creation (new user, first message)');
const test1: PromptBuildContext = {
  userMessage: 'Plan a trip to Tokyo',
  messageCount: 1,
  hasExistingTrip: false
};
const result1 = buildExpPrompt(test1);
console.log(`✅ Active plugins: ${result1.activePlugins.join(', ')}`);
console.log(`   Prompt length: ${result1.stats.totalLength} chars`);
console.log(`   Plugin count: ${result1.stats.pluginCount}`);

// Test 2: Email parsing
console.log('\n📝 Test 2: Hotel Confirmation Email');
const test2: PromptBuildContext = {
  userMessage: 'Here is my confirmation number ABC123 for my hotel booking',
  messageCount: 5,
  hasExistingTrip: true
};
const result2 = buildExpPrompt(test2);
console.log(`✅ Active plugins: ${result2.activePlugins.join(', ')}`);
console.log(`   Prompt length: ${result2.stats.totalLength} chars`);
console.log(`   Plugin count: ${result2.stats.pluginCount}`);

// Test 3: Vague dates
console.log('\n📝 Test 3: Vague Temporal Info');
const test3: PromptBuildContext = {
  userMessage: 'I want to go next summer',
  messageCount: 2,
  hasExistingTrip: false
};
const result3 = buildExpPrompt(test3);
console.log(`✅ Active plugins: ${result3.activePlugins.join(', ')}`);
console.log(`   Prompt length: ${result3.stats.totalLength} chars`);
console.log(`   Plugin count: ${result3.stats.pluginCount}`);

// Test 4: Focused conversation
console.log('\n📝 Test 4: Segment-Focused Conversation');
const test4: PromptBuildContext = {
  userMessage: 'Update this segment',
  messageCount: 10,
  hasExistingTrip: true,
  chatType: 'SEGMENT'
};
const result4 = buildExpPrompt(test4);
console.log(`✅ Active plugins: ${result4.activePlugins.join(', ')}`);
console.log(`   Prompt length: ${result4.stats.totalLength} chars`);
console.log(`   Plugin count: ${result4.stats.pluginCount}`);

// Test 5: Simple query (minimal plugins)
console.log('\n📝 Test 5: Simple Query (should be minimal)');
const test5: PromptBuildContext = {
  userMessage: 'What time is checkout?',
  messageCount: 15,
  hasExistingTrip: true
};
const result5 = buildExpPrompt(test5);
console.log(`✅ Active plugins: ${result5.activePlugins.join(', ')}`);
console.log(`   Prompt length: ${result5.stats.totalLength} chars`);
console.log(`   Plugin count: ${result5.stats.pluginCount}`);

// Summary
console.log('\n' + '='.repeat(80));
console.log('📊 Summary:');
console.log(`   Test 1 (Trip Creation): ${result1.stats.totalLength} chars, ${result1.stats.pluginCount} plugins`);
console.log(`   Test 2 (Email Parsing): ${result2.stats.totalLength} chars, ${result2.stats.pluginCount} plugins`);
console.log(`   Test 3 (Vague Dates): ${result3.stats.totalLength} chars, ${result3.stats.pluginCount} plugins`);
console.log(`   Test 4 (Segment Focus): ${result4.stats.totalLength} chars, ${result4.stats.pluginCount} plugins`);
console.log(`   Test 5 (Simple Query): ${result5.stats.totalLength} chars, ${result5.stats.pluginCount} plugins`);
console.log('\n✅ All tests completed successfully!');
