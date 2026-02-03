/**
 * Test Script: Local Time Refactor Verification
 * 
 * This script tests the entire local time flow:
 * 1. Create a test trip
 * 2. Create segments with local dates
 * 3. Update segments with local dates
 * 4. Create reservations with local dates
 * 5. Update reservations with local dates
 * 6. Read and verify wall_* fields are correct
 * 7. Verify UTC fields are correctly calculated
 * 8. Clean up all test records
 * 
 * Run with: npx tsx scripts/test-local-time-refactor.ts
 */

import { prisma } from "../lib/prisma";
import { 
  localToUTC, 
  pgDateToString, 
  pgTimeToString, 
  stringToPgDate, 
  stringToPgTime,
  formatLocalDate,
  formatLocalTime,
  getLocalDateRange
} from "../lib/utils/local-time";

// Test configuration
const TEST_PREFIX = "__TEST_LOCAL_TIME__";
const TEST_TIMEZONE = "America/Los_Angeles"; // PST/PDT
const TEST_TIMEZONE_NAME = "Pacific Time";

// Test data
const testData = {
  trip: {
    title: `${TEST_PREFIX}Test Trip`,
    startDate: "2026-03-15",
    endDate: "2026-03-22",
  },
  segment: {
    name: `${TEST_PREFIX}Stay in San Francisco`,
    startDate: "2026-03-15",
    endDate: "2026-03-18",
    startTitle: "San Francisco, CA",
    endTitle: "San Francisco, CA",
  },
  segmentUpdate: {
    startDate: "2026-03-16",
    endDate: "2026-03-19",
  },
  reservation: {
    name: `${TEST_PREFIX}Hotel Reservation`,
    startDate: "2026-03-15",
    startTime: "15:00",
    endDate: "2026-03-18",
    endTime: "11:00",
  },
  reservationUpdate: {
    startDate: "2026-03-16",
    startTime: "14:00",
    endDate: "2026-03-19",
    endTime: "12:00",
  },
};

// Test results tracking
const results: { test: string; passed: boolean; error?: string }[] = [];

function logTest(name: string, passed: boolean, error?: string) {
  results.push({ test: name, passed, error });
  const status = passed ? "✅ PASS" : "❌ FAIL";
  console.log(`  ${status}: ${name}${error ? ` - ${error}` : ""}`);
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

async function runTests() {
  console.log("=".repeat(60));
  console.log("🧪 Local Time Refactor Test Suite");
  console.log("=".repeat(60));
  console.log();

  let testTripId: string | null = null;
  let testSegmentId: string | null = null;
  let testReservationId: string | null = null;
  let testUserId: string | null = null;
  let testSegmentTypeId: string | null = null;
  let testReservationTypeId: string | null = null;
  let testReservationStatusId: string | null = null;

  try {
    // ===================
    // SETUP
    // ===================
    console.log("📋 Setting up test environment...\n");

    // Get or create test user
    let testUser = await prisma.user.findFirst({
      where: { email: "test@example.com" },
    });
    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          email: "test@example.com",
          name: "Test User",
        },
      });
    }
    testUserId = testUser.id;
    console.log(`  Using test user: ${testUser.email}`);

    // Get segment type
    const segmentType = await prisma.segmentType.findFirst({
      where: { name: "Stay" },
    });
    if (!segmentType) {
      throw new Error("Stay segment type not found. Run db:seed first.");
    }
    testSegmentTypeId = segmentType.id;

    // Get reservation type
    const reservationType = await prisma.reservationType.findFirst({
      where: { 
        name: "Hotel",
        category: { name: "Stay" }
      },
      include: { category: true },
    });
    if (!reservationType) {
      throw new Error("Hotel reservation type not found. Run db:seed first.");
    }
    testReservationTypeId = reservationType.id;

    // Get reservation status
    const reservationStatus = await prisma.reservationStatus.findFirst({
      where: { name: "Confirmed" },
    });
    if (!reservationStatus) {
      throw new Error("Confirmed status not found. Run db:seed first.");
    }
    testReservationStatusId = reservationStatus.id;

    console.log();

    // ===================
    // TEST 1: Utility Functions
    // ===================
    console.log("1️⃣ Testing Utility Functions\n");

    try {
      // Test localToUTC
      const utcDate = localToUTC("2026-03-15", "14:30", TEST_TIMEZONE, false);
      assert(utcDate instanceof Date, "localToUTC should return a Date");
      assert(!isNaN(utcDate.getTime()), "localToUTC should return valid date");
      logTest("localToUTC() returns valid Date", true);
    } catch (e: any) {
      logTest("localToUTC() returns valid Date", false, e.message);
    }

    try {
      // Test pgDateToString
      const date = new Date(Date.UTC(2026, 2, 15)); // March 15, 2026
      const dateStr = pgDateToString(date);
      assert(dateStr === "2026-03-15", `Expected 2026-03-15, got ${dateStr}`);
      logTest("pgDateToString() formats correctly", true);
    } catch (e: any) {
      logTest("pgDateToString() formats correctly", false, e.message);
    }

    try {
      // Test pgTimeToString
      const time = new Date(Date.UTC(1970, 0, 1, 14, 30, 0));
      const timeStr = pgTimeToString(time);
      assert(timeStr === "14:30", `Expected 14:30, got ${timeStr}`);
      logTest("pgTimeToString() formats correctly", true);
    } catch (e: any) {
      logTest("pgTimeToString() formats correctly", false, e.message);
    }

    try {
      // Test stringToPgDate
      const date = stringToPgDate("2026-03-15");
      assert(date !== null, "stringToPgDate should not return null");
      assert(date!.getUTCFullYear() === 2026, "Year should be 2026");
      assert(date!.getUTCMonth() === 2, "Month should be March (2)");
      assert(date!.getUTCDate() === 15, "Day should be 15");
      logTest("stringToPgDate() parses correctly", true);
    } catch (e: any) {
      logTest("stringToPgDate() parses correctly", false, e.message);
    }

    try {
      // Test stringToPgTime
      // Note: stringToPgTime creates a Date using local time constructor,
      // so we must use getHours()/getMinutes() to read back the values
      const time = stringToPgTime("14:30");
      assert(time !== null, "stringToPgTime should not return null");
      assert(time!.getHours() === 14, "Hours should be 14");
      assert(time!.getMinutes() === 30, "Minutes should be 30");
      logTest("stringToPgTime() parses correctly", true);
    } catch (e: any) {
      logTest("stringToPgTime() parses correctly", false, e.message);
    }

    try {
      // Test formatLocalDate
      const formatted = formatLocalDate("2026-03-15", "short");
      assert(formatted === "Mar 15", `Expected "Mar 15", got "${formatted}"`);
      logTest("formatLocalDate() formats correctly", true);
    } catch (e: any) {
      logTest("formatLocalDate() formats correctly", false, e.message);
    }

    try {
      // Test formatLocalTime
      const formatted = formatLocalTime("14:30", "12h");
      assert(formatted === "2:30 PM", `Expected "2:30 PM", got "${formatted}"`);
      logTest("formatLocalTime() formats correctly", true);
    } catch (e: any) {
      logTest("formatLocalTime() formats correctly", false, e.message);
    }

    try {
      // Test getLocalDateRange
      const range = getLocalDateRange("2026-03-15", "2026-03-17");
      assert(range.length === 3, `Expected 3 dates, got ${range.length}`);
      assert(range[0] === "2026-03-15", `First date should be 2026-03-15`);
      assert(range[2] === "2026-03-17", `Last date should be 2026-03-17`);
      logTest("getLocalDateRange() generates correct range", true);
    } catch (e: any) {
      logTest("getLocalDateRange() generates correct range", false, e.message);
    }

    console.log();

    // ===================
    // TEST 2: Create Trip
    // ===================
    console.log("2️⃣ Testing Trip Creation\n");

    try {
      const trip = await prisma.trip.create({
        data: {
          title: testData.trip.title,
          description: "Test trip for local time refactor verification",
          startDate: new Date(testData.trip.startDate),
          endDate: new Date(testData.trip.endDate),
          userId: testUserId,
        },
      });
      testTripId = trip.id;
      assert(trip.id !== null, "Trip should have an ID");
      logTest("Create test trip", true);
    } catch (e: any) {
      logTest("Create test trip", false, e.message);
      throw e; // Can't continue without trip
    }

    console.log();

    // ===================
    // TEST 3: Create Segment with Local Dates
    // ===================
    console.log("3️⃣ Testing Segment Creation with Local Dates\n");

    try {
      const segment = await prisma.segment.create({
        data: {
          name: testData.segment.name,
          tripId: testTripId!,
          segmentTypeId: testSegmentTypeId!,
          startTitle: testData.segment.startTitle,
          endTitle: testData.segment.endTitle,
          startLat: 37.7749,
          startLng: -122.4194,
          endLat: 37.7749,
          endLng: -122.4194,
          // Local time fields (primary)
          wall_start_date: stringToPgDate(testData.segment.startDate),
          wall_end_date: stringToPgDate(testData.segment.endDate),
          // Timezone
          startTimeZoneId: TEST_TIMEZONE,
          startTimeZoneName: TEST_TIMEZONE_NAME,
          endTimeZoneId: TEST_TIMEZONE,
          endTimeZoneName: TEST_TIMEZONE_NAME,
          // UTC fields (for sorting)
          startTime: localToUTC(testData.segment.startDate, null, TEST_TIMEZONE, false),
          endTime: localToUTC(testData.segment.endDate, null, TEST_TIMEZONE, true),
          order: 0,
        },
      });
      testSegmentId = segment.id;
      logTest("Create segment with wall_* fields", true);
    } catch (e: any) {
      logTest("Create segment with wall_* fields", false, e.message);
      throw e;
    }

    // Verify segment was created correctly
    try {
      const segment = await prisma.segment.findUnique({
        where: { id: testSegmentId! },
      });
      
      assert(segment !== null, "Segment should exist");
      assert(segment!.wall_start_date !== null, "wall_start_date should be set");
      assert(segment!.wall_end_date !== null, "wall_end_date should be set");
      assert(segment!.startTime !== null, "startTime (UTC) should be set");
      assert(segment!.endTime !== null, "endTime (UTC) should be set");
      
      const wallStartStr = pgDateToString(segment!.wall_start_date!);
      assert(wallStartStr === testData.segment.startDate, 
        `wall_start_date should be ${testData.segment.startDate}, got ${wallStartStr}`);
      
      const wallEndStr = pgDateToString(segment!.wall_end_date!);
      assert(wallEndStr === testData.segment.endDate,
        `wall_end_date should be ${testData.segment.endDate}, got ${wallEndStr}`);
      
      logTest("Segment wall_* fields stored correctly", true);
    } catch (e: any) {
      logTest("Segment wall_* fields stored correctly", false, e.message);
    }

    console.log();

    // ===================
    // TEST 4: Update Segment with Local Dates
    // ===================
    console.log("4️⃣ Testing Segment Update with Local Dates\n");

    try {
      await prisma.segment.update({
        where: { id: testSegmentId! },
        data: {
          wall_start_date: stringToPgDate(testData.segmentUpdate.startDate),
          wall_end_date: stringToPgDate(testData.segmentUpdate.endDate),
          startTime: localToUTC(testData.segmentUpdate.startDate, null, TEST_TIMEZONE, false),
          endTime: localToUTC(testData.segmentUpdate.endDate, null, TEST_TIMEZONE, true),
        },
      });
      logTest("Update segment with new local dates", true);
    } catch (e: any) {
      logTest("Update segment with new local dates", false, e.message);
    }

    // Verify update
    try {
      const segment = await prisma.segment.findUnique({
        where: { id: testSegmentId! },
      });
      
      const wallStartStr = pgDateToString(segment!.wall_start_date!);
      assert(wallStartStr === testData.segmentUpdate.startDate,
        `Updated wall_start_date should be ${testData.segmentUpdate.startDate}, got ${wallStartStr}`);
      
      const wallEndStr = pgDateToString(segment!.wall_end_date!);
      assert(wallEndStr === testData.segmentUpdate.endDate,
        `Updated wall_end_date should be ${testData.segmentUpdate.endDate}, got ${wallEndStr}`);
      
      logTest("Segment update persisted correctly", true);
    } catch (e: any) {
      logTest("Segment update persisted correctly", false, e.message);
    }

    console.log();

    // ===================
    // TEST 5: Create Reservation with Local Dates/Times
    // ===================
    console.log("5️⃣ Testing Reservation Creation with Local Dates/Times\n");

    try {
      const reservation = await prisma.reservation.create({
        data: {
          name: testData.reservation.name,
          segmentId: testSegmentId!,
          reservationTypeId: testReservationTypeId!,
          reservationStatusId: testReservationStatusId!,
          // Local time fields (primary)
          wall_start_date: stringToPgDate(testData.reservation.startDate),
          wall_start_time: stringToPgTime(testData.reservation.startTime),
          wall_end_date: stringToPgDate(testData.reservation.endDate),
          wall_end_time: stringToPgTime(testData.reservation.endTime),
          // Timezone
          timeZoneId: TEST_TIMEZONE,
          timeZoneName: TEST_TIMEZONE_NAME,
          // UTC fields (for sorting)
          startTime: localToUTC(testData.reservation.startDate, testData.reservation.startTime, TEST_TIMEZONE, false),
          endTime: localToUTC(testData.reservation.endDate, testData.reservation.endTime, TEST_TIMEZONE, true),
        },
      });
      testReservationId = reservation.id;
      logTest("Create reservation with wall_* fields", true);
    } catch (e: any) {
      logTest("Create reservation with wall_* fields", false, e.message);
      throw e;
    }

    // Verify reservation was created correctly
    try {
      const reservation = await prisma.reservation.findUnique({
        where: { id: testReservationId! },
      });
      
      assert(reservation !== null, "Reservation should exist");
      assert(reservation!.wall_start_date !== null, "wall_start_date should be set");
      assert(reservation!.wall_start_time !== null, "wall_start_time should be set");
      assert(reservation!.wall_end_date !== null, "wall_end_date should be set");
      assert(reservation!.wall_end_time !== null, "wall_end_time should be set");
      
      const wallStartDateStr = pgDateToString(reservation!.wall_start_date!);
      assert(wallStartDateStr === testData.reservation.startDate,
        `wall_start_date should be ${testData.reservation.startDate}, got ${wallStartDateStr}`);
      
      const wallStartTimeStr = pgTimeToString(reservation!.wall_start_time!);
      assert(wallStartTimeStr === testData.reservation.startTime,
        `wall_start_time should be ${testData.reservation.startTime}, got ${wallStartTimeStr}`);
      
      logTest("Reservation wall_* fields stored correctly", true);
    } catch (e: any) {
      logTest("Reservation wall_* fields stored correctly", false, e.message);
    }

    console.log();

    // ===================
    // TEST 6: Update Reservation with Local Dates/Times
    // ===================
    console.log("6️⃣ Testing Reservation Update with Local Dates/Times\n");

    try {
      await prisma.reservation.update({
        where: { id: testReservationId! },
        data: {
          wall_start_date: stringToPgDate(testData.reservationUpdate.startDate),
          wall_start_time: stringToPgTime(testData.reservationUpdate.startTime),
          wall_end_date: stringToPgDate(testData.reservationUpdate.endDate),
          wall_end_time: stringToPgTime(testData.reservationUpdate.endTime),
          startTime: localToUTC(testData.reservationUpdate.startDate, testData.reservationUpdate.startTime, TEST_TIMEZONE, false),
          endTime: localToUTC(testData.reservationUpdate.endDate, testData.reservationUpdate.endTime, TEST_TIMEZONE, true),
        },
      });
      logTest("Update reservation with new local dates/times", true);
    } catch (e: any) {
      logTest("Update reservation with new local dates/times", false, e.message);
    }

    // Verify update
    try {
      const reservation = await prisma.reservation.findUnique({
        where: { id: testReservationId! },
      });
      
      const wallStartDateStr = pgDateToString(reservation!.wall_start_date!);
      assert(wallStartDateStr === testData.reservationUpdate.startDate,
        `Updated wall_start_date should be ${testData.reservationUpdate.startDate}, got ${wallStartDateStr}`);
      
      const wallStartTimeStr = pgTimeToString(reservation!.wall_start_time!);
      assert(wallStartTimeStr === testData.reservationUpdate.startTime,
        `Updated wall_start_time should be ${testData.reservationUpdate.startTime}, got ${wallStartTimeStr}`);
      
      logTest("Reservation update persisted correctly", true);
    } catch (e: any) {
      logTest("Reservation update persisted correctly", false, e.message);
    }

    console.log();

    // ===================
    // TEST 7: UTC Calculation Verification
    // ===================
    console.log("7️⃣ Testing UTC Calculation from Local Time\n");

    try {
      // Create a known local time and verify UTC conversion
      // March 15, 2026 at 2:30 PM Pacific should be:
      // - PDT (Daylight Saving Time starts March 8, 2026)
      // - UTC offset is -7 hours
      // - So 14:30 PDT = 21:30 UTC
      
      const localDate = "2026-03-15";
      const localTime = "14:30";
      const utcTime = localToUTC(localDate, localTime, TEST_TIMEZONE, false);
      
      // The UTC hour should be 14 + 7 = 21 (since March 15 is during PDT)
      const utcHour = utcTime.getUTCHours();
      const expectedUtcHour = 21;
      
      assert(utcHour === expectedUtcHour,
        `UTC hour should be ${expectedUtcHour}, got ${utcHour} (March is in PDT)`);
      
      logTest("localToUTC correctly handles PDT timezone offset", true);
    } catch (e: any) {
      logTest("localToUTC correctly handles PDT timezone offset", false, e.message);
    }

    try {
      // Test a date in PST (January) to verify correct offset
      const localDate = "2026-01-15";
      const localTime = "14:30";
      const utcTime = localToUTC(localDate, localTime, TEST_TIMEZONE, false);
      
      // January is PST, UTC offset is -8 hours
      // 14:30 PST = 22:30 UTC
      const utcHour = utcTime.getUTCHours();
      const expectedUtcHour = 22;
      
      assert(utcHour === expectedUtcHour,
        `UTC hour should be ${expectedUtcHour}, got ${utcHour} (January is in PST)`);
      
      logTest("localToUTC correctly handles PST timezone offset", true);
    } catch (e: any) {
      logTest("localToUTC correctly handles PST timezone offset", false, e.message);
    }

    console.log();

    // ===================
    // TEST 8: Read Back and Verify Round Trip
    // ===================
    console.log("8️⃣ Testing Complete Round Trip (Write → Read → Display)\n");

    try {
      // Create a segment, read it back, format for display
      const testSegment = await prisma.segment.findUnique({
        where: { id: testSegmentId! },
      });
      
      // Read from wall_* fields
      const displayStartDate = formatLocalDate(testSegment!.wall_start_date!, "long");
      const displayEndDate = formatLocalDate(testSegment!.wall_end_date!, "long");
      
      // These should match the updated dates
      assert(displayStartDate === "March 16, 2026",
        `Display start date should be "March 16, 2026", got "${displayStartDate}"`);
      assert(displayEndDate === "March 19, 2026",
        `Display end date should be "March 19, 2026", got "${displayEndDate}"`);
      
      logTest("Segment round trip: write → read → display", true);
    } catch (e: any) {
      logTest("Segment round trip: write → read → display", false, e.message);
    }

    try {
      // Same for reservation
      const testReservation = await prisma.reservation.findUnique({
        where: { id: testReservationId! },
      });
      
      const displayDate = formatLocalDate(testReservation!.wall_start_date!, "short");
      const displayTime = formatLocalTime(testReservation!.wall_start_time!, "12h");
      
      assert(displayDate === "Mar 16",
        `Display date should be "Mar 16", got "${displayDate}"`);
      assert(displayTime === "2:00 PM",
        `Display time should be "2:00 PM", got "${displayTime}"`);
      
      logTest("Reservation round trip: write → read → display", true);
    } catch (e: any) {
      logTest("Reservation round trip: write → read → display", false, e.message);
    }

    console.log();

  } catch (error: any) {
    console.error("\n❌ Test suite failed with error:", error.message);
  } finally {
    // ===================
    // CLEANUP
    // ===================
    console.log("🧹 Cleaning up test records...\n");

    try {
      // Delete test reservation
      if (testReservationId) {
        await prisma.reservation.delete({ where: { id: testReservationId } });
        console.log("  ✓ Deleted test reservation");
      }

      // Delete test segment
      if (testSegmentId) {
        await prisma.segment.delete({ where: { id: testSegmentId } });
        console.log("  ✓ Deleted test segment");
      }

      // Delete test trip
      if (testTripId) {
        await prisma.trip.delete({ where: { id: testTripId } });
        console.log("  ✓ Deleted test trip");
      }

      // Verify cleanup
      const orphanedRecords = await prisma.segment.count({
        where: { name: { startsWith: TEST_PREFIX } },
      });
      const orphanedReservations = await prisma.reservation.count({
        where: { name: { startsWith: TEST_PREFIX } },
      });
      
      if (orphanedRecords === 0 && orphanedReservations === 0) {
        console.log("  ✓ No orphaned test records found");
      } else {
        console.log(`  ⚠️ Found ${orphanedRecords} orphaned segments, ${orphanedReservations} orphaned reservations`);
      }
    } catch (cleanupError: any) {
      console.error("  ❌ Cleanup failed:", cleanupError.message);
    }

    // ===================
    // SUMMARY
    // ===================
    console.log("\n" + "=".repeat(60));
    console.log("📊 Test Results Summary");
    console.log("=".repeat(60));
    
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const total = results.length;
    
    console.log(`\n  Total tests: ${total}`);
    console.log(`  Passed: ${passed} ✅`);
    console.log(`  Failed: ${failed} ❌`);
    console.log(`  Pass rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log("\n  Failed tests:");
      results.filter(r => !r.passed).forEach(r => {
        console.log(`    - ${r.test}: ${r.error}`);
      });
    }
    
    console.log("\n" + "=".repeat(60));
    
    if (failed === 0) {
      console.log("✅ All tests passed! Local time refactor is working correctly.");
    } else {
      console.log("❌ Some tests failed. Please review the errors above.");
      process.exit(1);
    }

    await prisma.$disconnect();
  }
}

// Run tests
runTests();
