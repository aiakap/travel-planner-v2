-- Add SegmentType table and required relation on Segment with backfill to "Other"
CREATE TABLE IF NOT EXISTS "SegmentType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SegmentType_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SegmentType_name_key" ON "SegmentType"("name");

INSERT INTO "SegmentType" ("id", "name")
SELECT 'segment-type-other', 'Other'
WHERE NOT EXISTS (
    SELECT 1 FROM "SegmentType" WHERE "name" = 'Other'
);

ALTER TABLE "Segment" ADD COLUMN IF NOT EXISTS "segmentTypeId" TEXT;

UPDATE "Segment"
SET "segmentTypeId" = (
    SELECT "id" FROM "SegmentType" WHERE "name" = 'Other' LIMIT 1
)
WHERE "segmentTypeId" IS NULL;

ALTER TABLE "Segment" ALTER COLUMN "segmentTypeId" SET NOT NULL;

ALTER TABLE "Segment"
ADD CONSTRAINT "Segment_segmentTypeId_fkey"
FOREIGN KEY ("segmentTypeId") REFERENCES "SegmentType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
