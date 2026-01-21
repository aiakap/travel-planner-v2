-- DropForeignKey (safe)
ALTER TABLE IF EXISTS "Location" DROP CONSTRAINT IF EXISTS "Location_tripId_fkey";

-- Drop existing tables to avoid conflicts when rerunning
DROP TABLE IF EXISTS "Location";
DROP TABLE IF EXISTS "Segment";

-- CreateTable
CREATE TABLE "Segment" (
    "id" TEXT NOT NULL,
    "startTitle" TEXT NOT NULL,
    "startLat" DOUBLE PRECISION NOT NULL,
    "startLng" DOUBLE PRECISION NOT NULL,
    "endTitle" TEXT NOT NULL,
    "endLat" DOUBLE PRECISION NOT NULL,
    "endLng" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "tripId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Segment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Segment" ADD CONSTRAINT "Segment_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

