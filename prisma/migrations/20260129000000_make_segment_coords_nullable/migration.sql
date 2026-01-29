-- AlterTable: Make segment coordinates nullable for async enrichment
-- This allows segments to be created immediately without blocking on geocoding

ALTER TABLE "Segment" ALTER COLUMN "startLat" DROP NOT NULL;
ALTER TABLE "Segment" ALTER COLUMN "startLng" DROP NOT NULL;
ALTER TABLE "Segment" ALTER COLUMN "endLat" DROP NOT NULL;
ALTER TABLE "Segment" ALTER COLUMN "endLng" DROP NOT NULL;
