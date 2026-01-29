/**
 * Simple tests for timezone date conversion utilities
 * Run with: npx ts-node lib/utils/date-timezone.test.ts
 */

import { dateToUTC, utcToDate } from "./date-timezone.js";

console.log("🧪 Testing Timezone Date Utilities\n");

// Test 1: Start date in California (PST = UTC-8)
console.log("Test 1: Start date (12:01 AM) in California");
const startDateStr = "2026-01-29";
const timezone = "America/Los_Angeles";
const startUTC = dateToUTC(startDateStr, timezone, false);
console.log(`  Input: ${startDateStr} in ${timezone}`);
console.log(`  Output (UTC): ${startUTC}`);
console.log(`  Expected: 2026-01-29T08:01:00.000Z (12:01 AM PST = 8:01 AM UTC)`);
console.log(`  ✅ Match: ${startUTC === "2026-01-29T08:01:00.000Z"}\n`);

// Test 2: End date in California (PST = UTC-8)
console.log("Test 2: End date (11:59:59 PM) in California");
const endUTC = dateToUTC(startDateStr, timezone, true);
console.log(`  Input: ${startDateStr} in ${timezone}`);
console.log(`  Output (UTC): ${endUTC}`);
console.log(`  Expected: 2026-01-30T07:59:59.000Z (11:59:59 PM PST = 7:59:59 AM UTC next day)`);
console.log(`  ✅ Match: ${endUTC === "2026-01-30T07:59:59.000Z"}\n`);

// Test 3: Round-trip conversion
console.log("Test 3: Round-trip (UTC → Local → UTC)");
const backToDate = utcToDate(startUTC, timezone);
console.log(`  Start: ${startDateStr}`);
console.log(`  To UTC: ${startUTC}`);
console.log(`  Back to date: ${backToDate}`);
console.log(`  ✅ Match: ${backToDate === startDateStr}\n`);

// Test 4: Different timezone (New York, EST = UTC-5)
console.log("Test 4: Start date in New York");
const nyTimezone = "America/New_York";
const nyStartUTC = dateToUTC(startDateStr, nyTimezone, false);
console.log(`  Input: ${startDateStr} in ${nyTimezone}`);
console.log(`  Output (UTC): ${nyStartUTC}`);
console.log(`  Expected: 2026-01-29T05:01:00.000Z (12:01 AM EST = 5:01 AM UTC)`);
console.log(`  ✅ Match: ${nyStartUTC === "2026-01-29T05:01:00.000Z"}\n`);

// Test 5: UTC timezone
console.log("Test 5: Start date in UTC");
const utcTimezone = "UTC";
const utcStartUTC = dateToUTC(startDateStr, utcTimezone, false);
console.log(`  Input: ${startDateStr} in ${utcTimezone}`);
console.log(`  Output (UTC): ${utcStartUTC}`);
console.log(`  Expected: 2026-01-29T00:01:00.000Z (12:01 AM UTC = 12:01 AM UTC)`);
console.log(`  ✅ Match: ${utcStartUTC === "2026-01-29T00:01:00.000Z"}\n`);

console.log("✅ All tests complete!");
