-- Add wall clock fields to Segment table
ALTER TABLE "Segment" ADD COLUMN "wall_start_date" DATE;
ALTER TABLE "Segment" ADD COLUMN "wall_end_date" DATE;

-- Add wall clock fields to Reservation table
ALTER TABLE "Reservation" ADD COLUMN "wall_start_date" DATE;
ALTER TABLE "Reservation" ADD COLUMN "wall_start_time" TIME;
ALTER TABLE "Reservation" ADD COLUMN "wall_end_date" DATE;
ALTER TABLE "Reservation" ADD COLUMN "wall_end_time" TIME;

-- Backfill existing Segment data (skip if timezone fields don't exist yet)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Segment' AND column_name = 'startTimeZoneId') THEN
    UPDATE "Segment"
    SET 
      "wall_start_date" = ("startTime" AT TIME ZONE 'UTC' AT TIME ZONE COALESCE("startTimeZoneId", 'UTC'))::date,
      "wall_end_date" = ("endTime" AT TIME ZONE 'UTC' AT TIME ZONE COALESCE("endTimeZoneId", 'UTC'))::date
    WHERE "startTime" IS NOT NULL OR "endTime" IS NOT NULL;
  END IF;
END $$;

-- Backfill existing Reservation data (skip if timezone fields don't exist yet)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Reservation' AND column_name = 'timeZoneId') THEN
    UPDATE "Reservation"
    SET 
      "wall_start_date" = ("startTime" AT TIME ZONE 'UTC' AT TIME ZONE COALESCE("timeZoneId", "departureTimezone", 'UTC'))::date,
      "wall_start_time" = ("startTime" AT TIME ZONE 'UTC' AT TIME ZONE COALESCE("timeZoneId", "departureTimezone", 'UTC'))::time,
      "wall_end_date" = ("endTime" AT TIME ZONE 'UTC' AT TIME ZONE COALESCE("timeZoneId", "arrivalTimezone", 'UTC'))::date,
      "wall_end_time" = ("endTime" AT TIME ZONE 'UTC' AT TIME ZONE COALESCE("timeZoneId", "arrivalTimezone", 'UTC'))::time
    WHERE "startTime" IS NOT NULL OR "endTime" IS NOT NULL;
  END IF;
END $$;

-- Create trigger function for Segment wall clock updates
CREATE OR REPLACE FUNCTION update_segment_wall_clock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."startTime" IS NOT NULL AND NEW."startTimeZoneId" IS NOT NULL THEN
    NEW."wall_start_date" := (NEW."startTime" AT TIME ZONE 'UTC' AT TIME ZONE NEW."startTimeZoneId")::date;
  END IF;
  
  IF NEW."endTime" IS NOT NULL AND NEW."endTimeZoneId" IS NOT NULL THEN
    NEW."wall_end_date" := (NEW."endTime" AT TIME ZONE 'UTC' AT TIME ZONE NEW."endTimeZoneId")::date;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for Segment
CREATE TRIGGER segment_wall_clock_trigger
  BEFORE INSERT OR UPDATE ON "Segment"
  FOR EACH ROW
  EXECUTE FUNCTION update_segment_wall_clock();

-- Create trigger function for Reservation wall clock updates
CREATE OR REPLACE FUNCTION update_reservation_wall_clock()
RETURNS TRIGGER AS $$
DECLARE
  start_tz TEXT;
  end_tz TEXT;
BEGIN
  -- Determine timezone for start (prefer timeZoneId, fall back to departureTimezone)
  start_tz := COALESCE(NEW."timeZoneId", NEW."departureTimezone", 'UTC');
  
  IF NEW."startTime" IS NOT NULL THEN
    NEW."wall_start_date" := (NEW."startTime" AT TIME ZONE 'UTC' AT TIME ZONE start_tz)::date;
    NEW."wall_start_time" := (NEW."startTime" AT TIME ZONE 'UTC' AT TIME ZONE start_tz)::time;
  END IF;
  
  -- Determine timezone for end (prefer timeZoneId, fall back to arrivalTimezone)
  end_tz := COALESCE(NEW."timeZoneId", NEW."arrivalTimezone", 'UTC');
  
  IF NEW."endTime" IS NOT NULL THEN
    NEW."wall_end_date" := (NEW."endTime" AT TIME ZONE 'UTC' AT TIME ZONE end_tz)::date;
    NEW."wall_end_time" := (NEW."endTime" AT TIME ZONE 'UTC' AT TIME ZONE end_tz)::time;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for Reservation
CREATE TRIGGER reservation_wall_clock_trigger
  BEFORE INSERT OR UPDATE ON "Reservation"
  FOR EACH ROW
  EXECUTE FUNCTION update_reservation_wall_clock();
