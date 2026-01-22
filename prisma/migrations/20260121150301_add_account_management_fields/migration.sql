-- AlterTable
ALTER TABLE "Account" ADD COLUMN "isPrimaryLogin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "canLogin" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "lastLoginAt" TIMESTAMP(3),
ADD COLUMN "syncStatus" TEXT NOT NULL DEFAULT 'active';

-- CreateIndex
CREATE INDEX "Account_userId_canLogin_idx" ON "Account"("userId", "canLogin");
