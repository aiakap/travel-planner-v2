-- Add timezone fields to Segment table
ALTER TABLE "Segment" ADD COLUMN "startTimeZoneId" TEXT;
ALTER TABLE "Segment" ADD COLUMN "startTimeZoneName" TEXT;
ALTER TABLE "Segment" ADD COLUMN "endTimeZoneId" TEXT;
ALTER TABLE "Segment" ADD COLUMN "endTimeZoneName" TEXT;

-- Add location and timezone fields to Reservation table
ALTER TABLE "Reservation" ADD COLUMN "vendor" TEXT;
ALTER TABLE "Reservation" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "Reservation" ADD COLUMN "longitude" DOUBLE PRECISION;
ALTER TABLE "Reservation" ADD COLUMN "timeZoneId" TEXT;
ALTER TABLE "Reservation" ADD COLUMN "timeZoneName" TEXT;
