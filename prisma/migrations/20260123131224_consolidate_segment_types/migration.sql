-- Add description field to SegmentType table
ALTER TABLE "SegmentType" ADD COLUMN IF NOT EXISTS "description" TEXT;

-- Create new segment types with descriptions
INSERT INTO "SegmentType" (id, name, description, "createdAt")
VALUES 
  (gen_random_uuid(), 'Travel', 'Flights, trains, ferries, and transfers', NOW()),
  (gen_random_uuid(), 'Stay', 'Hotels and accommodation periods', NOW()),
  (gen_random_uuid(), 'Tour', 'Guided experiences and sightseeing', NOW()),
  (gen_random_uuid(), 'Retreat', 'Relaxation, wellness, and spa time', NOW()),
  (gen_random_uuid(), 'Road Trip', 'Self-drive adventures and scenic routes', NOW())
ON CONFLICT (name) DO NOTHING;

-- Migrate existing segments
-- Flight → Travel
UPDATE "Segment" 
SET "segmentTypeId" = (SELECT id FROM "SegmentType" WHERE name = 'Travel')
WHERE "segmentTypeId" IN (SELECT id FROM "SegmentType" WHERE name = 'Flight');

-- Train → Travel
UPDATE "Segment" 
SET "segmentTypeId" = (SELECT id FROM "SegmentType" WHERE name = 'Travel')
WHERE "segmentTypeId" IN (SELECT id FROM "SegmentType" WHERE name = 'Train');

-- Ferry → Travel
UPDATE "Segment" 
SET "segmentTypeId" = (SELECT id FROM "SegmentType" WHERE name = 'Travel')
WHERE "segmentTypeId" IN (SELECT id FROM "SegmentType" WHERE name = 'Ferry');

-- Drive → Road Trip
UPDATE "Segment" 
SET "segmentTypeId" = (SELECT id FROM "SegmentType" WHERE name = 'Road Trip')
WHERE "segmentTypeId" IN (SELECT id FROM "SegmentType" WHERE name = 'Drive');

-- Walk → Tour
UPDATE "Segment" 
SET "segmentTypeId" = (SELECT id FROM "SegmentType" WHERE name = 'Tour')
WHERE "segmentTypeId" IN (SELECT id FROM "SegmentType" WHERE name = 'Walk');

-- Other → Stay
UPDATE "Segment" 
SET "segmentTypeId" = (SELECT id FROM "SegmentType" WHERE name = 'Stay')
WHERE "segmentTypeId" IN (SELECT id FROM "SegmentType" WHERE name = 'Other');

-- Delete old segment types (after migration)
DELETE FROM "SegmentType" WHERE name IN ('Flight', 'Drive', 'Train', 'Ferry', 'Walk', 'Other');
