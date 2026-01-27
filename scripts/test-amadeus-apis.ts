/**
 * Amadeus API Test Harness
 * 
 * Automated test suite for all Amadeus APIs
 * Tests each API, captures results, and generates comprehensive reports
 * 
 * Usage: npx ts-node scripts/test-amadeus-apis.ts
 */

import { TEST_CASES, APITestCase, EXPECTED_COUNTS } from './amadeus-test-cases';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// ============================================================================
// Types
// ============================================================================

interface TestResult {
  testCase: APITestCase;
  success: boolean;
  httpStatus?: number;
  responseTime: number;
  resultCount: number;
  error?: {
    message: string;
    code: string;
    statusCode: number;
    details?: string;
  };
  rawResponse?: any;
  timestamp: string;
  recommendation?: string;
}

interface TestSummary {
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  errors: number;
  deprecated: number;
  noData: number;
  totalTime: number;
  results: TestResult[];
  categories: {
    [key: string]: {
      total: number;
      passed: number;
      failed: number;
    };
  };
}

// ============================================================================
// Test Executor
// ============================================================================

async function runTest(testCase: APITestCase): Promise<TestResult> {
  const startTime = Date.now();
  
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Testing: ${testCase.name}`);
  console.log(`API Type: ${testCase.apiType}`);
  console.log(`Category: ${testCase.category}`);
  console.log(`Expected: ${testCase.expectedStatus}`);
  console.log(`${'='.repeat(70)}`);

  try {
    // Determine which endpoint to call
    let endpoint = '/api/amadeus/advanced';
    let body: any = {
      apiType: testCase.apiType,
      params: testCase.params,
    };

    // Handle existing APIs that use different endpoints
    if (testCase.apiType === 'flight-search') {
      endpoint = '/api/amadeus-test';
      body = {
        type: 'flight',
        params: testCase.params,
      };
    } else if (testCase.apiType === 'hotel-search') {
      endpoint = '/api/amadeus-test';
      body = {
        type: 'hotel',
        params: testCase.params,
      };
    } else if (testCase.apiType === 'airport-search') {
      endpoint = `/api/airports/search?keyword=${encodeURIComponent(testCase.params.keyword)}`;
      body = null; // GET request
    }

    console.log(`Endpoint: ${endpoint}`);
    console.log(`Params:`, JSON.stringify(testCase.params, null, 2));

    // Make the API call
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), testCase.timeout);

    const requestOptions: RequestInit = {
      method: body ? 'POST' : 'GET',
      signal: controller.signal,
    };

    if (body) {
      requestOptions.headers = { 'Content-Type': 'application/json' };
      requestOptions.body = JSON.stringify(body);
    }

    const response = await fetch(`http://localhost:3000${endpoint}`, requestOptions);
    clearTimeout(timeoutId);

    const responseTime = Date.now() - startTime;
    const data = await response.json();

    console.log(`Status: ${response.status}`);
    console.log(`Response Time: ${responseTime}ms`);

    // Analyze response
    const success = response.ok && (data.success !== false);
    let resultCount = 0;
    
    if (success) {
      if (Array.isArray(data.results)) {
        resultCount = data.results.length;
      } else if (data.airports && Array.isArray(data.airports)) {
        resultCount = data.airports.length;
      } else if (data.results) {
        resultCount = 1;
      }
      console.log(`✅ SUCCESS - ${resultCount} results`);
    } else {
      console.log(`❌ FAILED`);
      if (data.error) {
        console.log(`Error: ${data.error.message || data.error.details || 'Unknown error'}`);
        console.log(`Code: ${data.error.code || 'UNKNOWN'}`);
      }
    }

    const result: TestResult = {
      testCase,
      success,
      httpStatus: response.status,
      responseTime,
      resultCount,
      rawResponse: data,
      timestamp: new Date().toISOString(),
    };

    if (!success) {
      result.error = {
        message: data.error?.message || data.error || 'Unknown error',
        code: data.error?.code || 'UNKNOWN',
        statusCode: data.error?.statusCode || response.status,
        details: data.error?.details || data.error?.userMessage,
      };
      
      // Add recommendation
      result.recommendation = generateRecommendation(testCase, result);
    }

    return result;
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    
    console.log(`❌ EXCEPTION: ${error.message}`);
    
    return {
      testCase,
      success: false,
      responseTime,
      resultCount: 0,
      error: {
        message: error.message || 'Request failed',
        code: error.name === 'AbortError' ? 'TIMEOUT' : 'EXCEPTION',
        statusCode: 0,
        details: error.stack,
      },
      timestamp: new Date().toISOString(),
      recommendation: error.name === 'AbortError' 
        ? 'Request timed out - increase timeout or check API availability'
        : 'Network error - ensure dev server is running on localhost:3000',
    };
  }
}

// ============================================================================
// Recommendation Generator
// ============================================================================

function generateRecommendation(testCase: APITestCase, result: TestResult): string {
  const errorCode = result.error?.code || '';
  const statusCode = result.error?.statusCode || 0;
  const errorMessage = result.error?.message || '';

  // Timeout
  if (errorCode === 'TIMEOUT') {
    return 'Request timed out - API may be slow or unavailable in test environment';
  }

  // Authentication issues
  if (statusCode === 401 || statusCode === 403) {
    return 'Authentication failed - check AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET environment variables';
  }

  // Not found / Deprecated
  if (statusCode === 404 || statusCode === 410) {
    return 'Endpoint not found - API may be deprecated or URL incorrect. Check latest Amadeus documentation';
  }

  // Rate limiting
  if (statusCode === 429) {
    return 'Rate limit exceeded - wait before retrying or check rate limit quotas';
  }

  // SDK method issues
  if (errorMessage.includes('is not a function') || errorMessage.includes('undefined')) {
    return `SDK method ${testCase.sdkMethod} may not exist in Amadeus SDK v11.0.0 - verify method name or update SDK`;
  }

  // Parameter validation
  if (statusCode === 400 && errorMessage.includes('parameter')) {
    return 'Invalid parameters - check required fields and data types against API documentation';
  }

  // No data
  if (result.success && result.resultCount === 0) {
    return 'API works but returned no results - test data may not exist in test environment';
  }

  // Server errors
  if (statusCode >= 500) {
    return 'Amadeus server error - API may be temporarily unavailable';
  }

  // Generic
  return `Check API documentation at ${testCase.apiDocUrl || 'Amadeus developer portal'}`;
}

// ============================================================================
// Report Generators
// ============================================================================

function generateJSONReport(summary: TestSummary, outputPath: string): void {
  console.log(`\nGenerating JSON report: ${outputPath}`);
  
  const report = {
    ...summary,
    // Remove raw responses to keep file size manageable
    results: summary.results.map(r => ({
      ...r,
      rawResponse: undefined,
    })),
  };
  
  writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`✅ JSON report saved`);
}

function generateMarkdownReport(summary: TestSummary, outputPath: string): void {
  console.log(`\nGenerating Markdown report: ${outputPath}`);
  
  const lines: string[] = [];
  
  // Header
  lines.push('# Amadeus API Test Report');
  lines.push('');
  lines.push(`**Generated:** ${summary.timestamp}`);
  lines.push('');
  
  // Executive Summary
  lines.push('## Executive Summary');
  lines.push('');
  lines.push(`- **Total APIs Tested:** ${summary.totalTests}`);
  lines.push(`- **Passed:** ${summary.passed} (${((summary.passed / summary.totalTests) * 100).toFixed(1)}%)`);
  lines.push(`- **Failed:** ${summary.failed} (${((summary.failed / summary.totalTests) * 100).toFixed(1)}%)`);
  lines.push(`- **No Data:** ${summary.noData}`);
  lines.push(`- **Errors:** ${summary.errors}`);
  lines.push(`- **Total Time:** ${(summary.totalTime / 1000).toFixed(2)}s`);
  lines.push('');
  
  // Category Breakdown
  lines.push('## Results by Category');
  lines.push('');
  Object.entries(summary.categories).forEach(([category, stats]) => {
    const passRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : '0.0';
    lines.push(`### ${category.charAt(0).toUpperCase() + category.slice(1)}`);
    lines.push(`- Total: ${stats.total}`);
    lines.push(`- Passed: ${stats.passed}`);
    lines.push(`- Failed: ${stats.failed}`);
    lines.push(`- Pass Rate: ${passRate}%`);
    lines.push('');
  });
  
  // Detailed Results
  lines.push('## Detailed Test Results');
  lines.push('');
  
  // Group by category
  const categories = ['flight', 'hotel', 'airport', 'activity', 'transfer'];
  categories.forEach(category => {
    const categoryResults = summary.results.filter(r => r.testCase.category === category);
    if (categoryResults.length === 0) return;
    
    lines.push(`### ${category.charAt(0).toUpperCase() + category.slice(1)} APIs`);
    lines.push('');
    
    categoryResults.forEach((result, idx) => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      lines.push(`#### ${idx + 1}. ${result.testCase.name} ${status}`);
      lines.push('');
      lines.push(`- **API Type:** \`${result.testCase.apiType}\``);
      lines.push(`- **SDK Method:** \`${result.testCase.sdkMethod}\``);
      lines.push(`- **Response Time:** ${result.responseTime}ms`);
      lines.push(`- **HTTP Status:** ${result.httpStatus || 'N/A'}`);
      lines.push(`- **Results Count:** ${result.resultCount}`);
      
      if (!result.success && result.error) {
        lines.push('');
        lines.push('**Error Details:**');
        lines.push(`- Message: ${result.error.message}`);
        lines.push(`- Code: ${result.error.code}`);
        if (result.error.details) {
          lines.push(`- Details: ${result.error.details}`);
        }
        if (result.recommendation) {
          lines.push('');
          lines.push(`**Recommendation:** ${result.recommendation}`);
        }
      }
      
      if (result.testCase.apiDocUrl) {
        lines.push('');
        lines.push(`**Documentation:** ${result.testCase.apiDocUrl}`);
      }
      
      if (result.testCase.notes) {
        lines.push('');
        lines.push(`**Notes:** ${result.testCase.notes}`);
      }
      
      lines.push('');
    });
  });
  
  // Failed APIs Summary
  const failedResults = summary.results.filter(r => !r.success);
  if (failedResults.length > 0) {
    lines.push('## Failed APIs Summary');
    lines.push('');
    lines.push('| API | Error Code | Message | Recommendation |');
    lines.push('|-----|-----------|---------|----------------|');
    failedResults.forEach(result => {
      const name = result.testCase.name;
      const code = result.error?.code || 'UNKNOWN';
      const message = (result.error?.message || 'No error message').substring(0, 50);
      const rec = (result.recommendation || 'See details above').substring(0, 60);
      lines.push(`| ${name} | ${code} | ${message} | ${rec} |`);
    });
    lines.push('');
  }
  
  // APIs with No Data
  const noDataResults = summary.results.filter(r => r.success && r.resultCount === 0);
  if (noDataResults.length > 0) {
    lines.push('## APIs Returning No Data');
    lines.push('');
    lines.push('These APIs work but returned empty results in the test environment:');
    lines.push('');
    noDataResults.forEach(result => {
      lines.push(`- **${result.testCase.name}** - ${result.testCase.notes || 'No notes'}`);
    });
    lines.push('');
  }
  
  // Recommendations
  lines.push('## Overall Recommendations');
  lines.push('');
  
  // Count error types
  const errorCounts: { [key: string]: number } = {};
  failedResults.forEach(r => {
    const code = r.error?.code || 'UNKNOWN';
    errorCounts[code] = (errorCounts[code] || 0) + 1;
  });
  
  if (errorCounts['TIMEOUT']) {
    lines.push(`### Timeouts (${errorCounts['TIMEOUT']} APIs)`);
    lines.push('These APIs timed out - they may be slow or unavailable in the test environment.');
    lines.push('Consider increasing timeout values or checking API availability.');
    lines.push('');
  }
  
  if (errorCounts['UNKNOWN_ERROR'] || errorCounts['SDK_ERROR']) {
    lines.push('### SDK/Method Issues');
    lines.push('Some APIs failed due to SDK method errors. Recommendations:');
    lines.push('- Verify Amadeus SDK version (currently 11.0.0)');
    lines.push('- Check if methods exist in SDK documentation');
    lines.push('- Consider updating to latest SDK version');
    lines.push('');
  }
  
  if (summary.noData > 0) {
    lines.push('### Limited Test Data');
    lines.push(`${summary.noData} APIs returned no results. This is common in test environments.`);
    lines.push('These APIs may work fine in production with real data.');
    lines.push('');
  }
  
  // Next Steps
  lines.push('## Next Steps');
  lines.push('');
  lines.push('1. **Fix Critical Issues** - Address authentication and SDK method errors first');
  lines.push('2. **Verify Deprecated APIs** - Check Amadeus documentation for deprecated endpoints');
  lines.push('3. **Update SDK** - Consider upgrading to latest Amadeus SDK version');
  lines.push('4. **Test with Production** - Some APIs may work better with production data');
  lines.push('5. **Update Admin UI** - Disable or hide non-working APIs in admin panel');
  lines.push('');
  
  writeFileSync(outputPath, lines.join('\n'));
  console.log(`✅ Markdown report saved`);
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function runAllTests(): Promise<void> {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║          AMADEUS API COMPREHENSIVE TEST SUITE                     ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`Total Test Cases: ${TEST_CASES.length}`);
  console.log(`Expected Success: ${EXPECTED_COUNTS.success}`);
  console.log(`Expected Unknown: ${EXPECTED_COUNTS.unknown}`);
  console.log(`Expected Error: ${EXPECTED_COUNTS.error}`);
  console.log('');
  console.log('Starting tests...');
  console.log('');

  const startTime = Date.now();
  const results: TestResult[] = [];
  
  // Run tests sequentially to avoid rate limiting
  for (const testCase of TEST_CASES) {
    const result = await runTest(testCase);
    results.push(result);
    
    // Small delay between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  const totalTime = Date.now() - startTime;
  
  // Generate summary
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const errors = results.filter(r => r.error).length;
  const noData = results.filter(r => r.success && r.resultCount === 0).length;
  
  // Category breakdown
  const categories: { [key: string]: { total: number; passed: number; failed: number } } = {};
  ['flight', 'hotel', 'airport', 'activity', 'transfer'].forEach(cat => {
    const catResults = results.filter(r => r.testCase.category === cat);
    categories[cat] = {
      total: catResults.length,
      passed: catResults.filter(r => r.success).length,
      failed: catResults.filter(r => !r.success).length,
    };
  });
  
  const summary: TestSummary = {
    timestamp: new Date().toISOString(),
    totalTests: TEST_CASES.length,
    passed,
    failed,
    errors,
    deprecated: 0, // Will be determined from error codes
    noData,
    totalTime,
    results,
    categories,
  };
  
  // Print summary
  console.log('\n\n');
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║                      TEST SUITE COMPLETE                           ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`Total Tests: ${summary.totalTests}`);
  console.log(`✅ Passed: ${summary.passed} (${((passed / summary.totalTests) * 100).toFixed(1)}%)`);
  console.log(`❌ Failed: ${summary.failed} (${((failed / summary.totalTests) * 100).toFixed(1)}%)`);
  console.log(`⚠️  No Data: ${summary.noData}`);
  console.log(`Total Time: ${(totalTime / 1000).toFixed(2)}s`);
  console.log('');
  
  // Create output directory
  const outputDir = join(process.cwd(), 'test-results');
  try {
    mkdirSync(outputDir, { recursive: true });
  } catch (e) {
    // Directory exists
  }
  
  // Generate reports
  const jsonPath = join(outputDir, 'amadeus-api-test-results.json');
  const mdPath = join(process.cwd(), 'AMADEUS_API_TEST_REPORT.md');
  
  generateJSONReport(summary, jsonPath);
  generateMarkdownReport(summary, mdPath);
  
  console.log('');
  console.log('Reports generated:');
  console.log(`  - JSON: ${jsonPath}`);
  console.log(`  - Markdown: ${mdPath}`);
  console.log('');
}

// Run the test suite
runAllTests()
  .then(() => {
    console.log('✅ Test suite completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
