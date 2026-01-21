-- Add name and imageUrl to Segment with safe backfill
ALTER TABLE "Segment"
  ADD COLUMN IF NOT EXISTS "imageUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "name" TEXT NOT NULL DEFAULT 'Segment';


