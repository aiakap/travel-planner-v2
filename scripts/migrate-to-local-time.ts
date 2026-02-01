/**
 * Migration Script: Populate wall_* (local time) fields
 * 
 * This script migrates existing segments and reservations to populate
 * the wall_start_date, wall_end_date, wall_start_time, wall_end_time fields
 * from the existing UTC startTime/endTime fields using stored timezone information.
 * 
 * Run with: npx ts-node scripts/migrate-to-local-time.ts
 * 
 * Options:
 *   --dry-run    Preview changes without writing to database
 *   --verbose    Show detailed progress for each record
 */

import { prisma } from "../lib/prisma";

// Parse command line arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose');

// Statistics
const stats = {
  segments: { total: 0, updated: 0, skipped: 0, errors: 0 },
  reservations: { total: 0, updated: 0, skipped: 0, errors: 0 },
};

/**
 * Convert a UTC Date to a local date string (YYYY-MM-DD) in the specified timezone
 */
function utcToLocalDateString(utcDate: Date, timeZoneId: string | null): string | null {
  if (!utcDate || !timeZoneId) return null;
  
  try {
    // Format date in the target timezone using en-CA locale for YYYY-MM-DD format
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timeZoneId,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(utcDate);
  } catch (error) {
    console.error(`Error converting date to timezone ${timeZoneId}:`, error);
    return null;
  }
}

/**
 * Convert a UTC Date to a local time string (HH:mm) in the specified timezone
 */
function utcToLocalTimeString(utcDate: Date, timeZoneId: string | null): string | null {
  if (!utcDate || !timeZoneId) return null;
  
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZoneId,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return formatter.format(utcDate);
  } catch (error) {
    console.error(`Error converting time to timezone ${timeZoneId}:`, error);
    return null;
  }
}

/**
 * Convert a date string (YYYY-MM-DD) to a Date object at UTC midnight
 * for PostgreSQL DATE field storage
 */
function stringToPgDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

/**
 * Convert a time string (HH:mm) to a Date object with time set
 * for PostgreSQL TIME field storage
 */
function stringToPgTime(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return new Date(Date.UTC(1970, 0, 1, hours, minutes, 0, 0));
}

/**
 * Migrate segments to populate wall_* fields
 */
async function migrateSegments(): Promise<void> {
  console.log('\n📍 Migrating Segments...\n');
  
  // Find segments that need migration (have startTime but no wall_start_date)
  const segments = await prisma.segment.findMany({
    where: {
      startTime: { not: null },
      wall_start_date: null,
    },
    select: {
      id: true,
      name: true,
      startTime: true,
      endTime: true,
      startTimeZoneId: true,
      endTimeZoneId: true,
      wall_start_date: true,
      wall_end_date: true,
    },
  });
  
  stats.segments.total = segments.length;
  console.log(`Found ${segments.length} segments to migrate`);
  
  for (const segment of segments) {
    try {
      // Skip if no timezone info
      if (!segment.startTimeZoneId) {
        if (VERBOSE) {
          console.log(`  ⏭️  Skipping ${segment.name} - no timezone info`);
        }
        stats.segments.skipped++;
        continue;
      }
      
      // Convert UTC dates to local date strings
      const startDateStr = segment.startTime 
        ? utcToLocalDateString(segment.startTime, segment.startTimeZoneId)
        : null;
      const endDateStr = segment.endTime
        ? utcToLocalDateString(segment.endTime, segment.endTimeZoneId || segment.startTimeZoneId)
        : null;
      
      if (!startDateStr) {
        if (VERBOSE) {
          console.log(`  ⏭️  Skipping ${segment.name} - could not convert start date`);
        }
        stats.segments.skipped++;
        continue;
      }
      
      // Prepare update data
      const updateData: any = {
        wall_start_date: stringToPgDate(startDateStr),
      };
      
      if (endDateStr) {
        updateData.wall_end_date = stringToPgDate(endDateStr);
      }
      
      if (VERBOSE) {
        console.log(`  📅 ${segment.name}`);
        console.log(`     UTC: ${segment.startTime?.toISOString()} - ${segment.endTime?.toISOString()}`);
        console.log(`     Local: ${startDateStr} - ${endDateStr || 'N/A'}`);
        console.log(`     Timezone: ${segment.startTimeZoneId}`);
      }
      
      if (!DRY_RUN) {
        await prisma.segment.update({
          where: { id: segment.id },
          data: updateData,
        });
      }
      
      stats.segments.updated++;
    } catch (error) {
      console.error(`  ❌ Error migrating segment ${segment.id} (${segment.name}):`, error);
      stats.segments.errors++;
    }
  }
}

/**
 * Migrate reservations to populate wall_* fields
 */
async function migrateReservations(): Promise<void> {
  console.log('\n🎫 Migrating Reservations...\n');
  
  // Find reservations that need migration (have startTime but no wall_start_date)
  const reservations = await prisma.reservation.findMany({
    where: {
      startTime: { not: null },
      wall_start_date: null,
    },
    select: {
      id: true,
      name: true,
      startTime: true,
      endTime: true,
      timeZoneId: true,
      wall_start_date: true,
      wall_end_date: true,
      wall_start_time: true,
      wall_end_time: true,
      segment: {
        select: {
          startTimeZoneId: true,
        },
      },
    },
  });
  
  stats.reservations.total = reservations.length;
  console.log(`Found ${reservations.length} reservations to migrate`);
  
  for (const reservation of reservations) {
    try {
      // Get timezone - prefer reservation's own timezone, fall back to segment's
      const timeZoneId = reservation.timeZoneId || reservation.segment?.startTimeZoneId;
      
      if (!timeZoneId) {
        if (VERBOSE) {
          console.log(`  ⏭️  Skipping ${reservation.name} - no timezone info`);
        }
        stats.reservations.skipped++;
        continue;
      }
      
      // Convert UTC dates and times to local strings
      const startDateStr = reservation.startTime 
        ? utcToLocalDateString(reservation.startTime, timeZoneId)
        : null;
      const startTimeStr = reservation.startTime
        ? utcToLocalTimeString(reservation.startTime, timeZoneId)
        : null;
      const endDateStr = reservation.endTime
        ? utcToLocalDateString(reservation.endTime, timeZoneId)
        : null;
      const endTimeStr = reservation.endTime
        ? utcToLocalTimeString(reservation.endTime, timeZoneId)
        : null;
      
      if (!startDateStr) {
        if (VERBOSE) {
          console.log(`  ⏭️  Skipping ${reservation.name} - could not convert start date`);
        }
        stats.reservations.skipped++;
        continue;
      }
      
      // Prepare update data
      const updateData: any = {
        wall_start_date: stringToPgDate(startDateStr),
        timeZoneId: timeZoneId, // Ensure timezone is stored
      };
      
      if (startTimeStr) {
        updateData.wall_start_time = stringToPgTime(startTimeStr);
      }
      
      if (endDateStr) {
        updateData.wall_end_date = stringToPgDate(endDateStr);
      }
      
      if (endTimeStr) {
        updateData.wall_end_time = stringToPgTime(endTimeStr);
      }
      
      if (VERBOSE) {
        console.log(`  🎫 ${reservation.name}`);
        console.log(`     UTC: ${reservation.startTime?.toISOString()} - ${reservation.endTime?.toISOString()}`);
        console.log(`     Local: ${startDateStr} ${startTimeStr || ''} - ${endDateStr || ''} ${endTimeStr || ''}`);
        console.log(`     Timezone: ${timeZoneId}`);
      }
      
      if (!DRY_RUN) {
        await prisma.reservation.update({
          where: { id: reservation.id },
          data: updateData,
        });
      }
      
      stats.reservations.updated++;
    } catch (error) {
      console.error(`  ❌ Error migrating reservation ${reservation.id} (${reservation.name}):`, error);
      stats.reservations.errors++;
    }
  }
}

/**
 * Main migration function
 */
async function main(): Promise<void> {
  console.log('='.repeat(60));
  console.log('🚀 Local Time Migration Script');
  console.log('='.repeat(60));
  
  if (DRY_RUN) {
    console.log('\n⚠️  DRY RUN MODE - No changes will be written to database\n');
  }
  
  try {
    // Run migrations
    await migrateSegments();
    await migrateReservations();
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary');
    console.log('='.repeat(60));
    
    console.log('\nSegments:');
    console.log(`  Total found: ${stats.segments.total}`);
    console.log(`  Updated: ${stats.segments.updated}`);
    console.log(`  Skipped: ${stats.segments.skipped}`);
    console.log(`  Errors: ${stats.segments.errors}`);
    
    console.log('\nReservations:');
    console.log(`  Total found: ${stats.reservations.total}`);
    console.log(`  Updated: ${stats.reservations.updated}`);
    console.log(`  Skipped: ${stats.reservations.skipped}`);
    console.log(`  Errors: ${stats.reservations.errors}`);
    
    if (DRY_RUN) {
      console.log('\n⚠️  This was a dry run. Run without --dry-run to apply changes.');
    } else {
      console.log('\n✅ Migration complete!');
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
main();
