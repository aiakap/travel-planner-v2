-- CreateTable
CREATE TABLE "AirportTimezone" (
    "code" TEXT NOT NULL,
    "timeZoneId" TEXT NOT NULL,
    "airportName" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AirportTimezone_pkey" PRIMARY KEY ("code")
);

-- CreateIndex
CREATE INDEX "AirportTimezone_timeZoneId_idx" ON "AirportTimezone"("timeZoneId");
