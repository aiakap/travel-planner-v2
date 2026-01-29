-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN "metadata" JSONB;

-- CreateIndex (optional performance indexes)
CREATE INDEX "idx_reservation_metadata_flight" ON "Reservation" USING GIN ((metadata->'flight')) WHERE metadata->'flight' IS NOT NULL;

CREATE INDEX "idx_reservation_metadata_hotel" ON "Reservation" USING GIN ((metadata->'hotel')) WHERE metadata->'hotel' IS NOT NULL;
