-- CreateTable
CREATE TABLE IF NOT EXISTS "ReservationDisplayGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReservationDisplayGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ReservationDisplayGroup_name_key" ON "ReservationDisplayGroup"("name");

-- AlterTable
ALTER TABLE "ReservationType" ADD COLUMN IF NOT EXISTS "displayGroupId" TEXT;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ReservationType_displayGroupId_fkey'
    ) THEN
        ALTER TABLE "ReservationType" ADD CONSTRAINT "ReservationType_displayGroupId_fkey" 
        FOREIGN KEY ("displayGroupId") REFERENCES "ReservationDisplayGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
