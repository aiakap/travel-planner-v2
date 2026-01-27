-- CreateTable
CREATE TABLE "ImagePrompt" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lightness" TEXT,
    "style" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ImagePrompt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageQueue" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "notes" TEXT,
    "imageUrl" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "promptId" TEXT,
    "logId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImageQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageGenerationLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityName" TEXT,
    "promptId" TEXT,
    "promptName" TEXT,
    "promptStyle" TEXT,
    "fullPrompt" TEXT NOT NULL,
    "aiReasoning" TEXT,
    "selectionReason" TEXT,
    "availablePrompts" TEXT,
    "callerFunction" TEXT,
    "callerSource" TEXT,
    "userId" TEXT,
    "status" TEXT NOT NULL,
    "imageUrl" TEXT,
    "errorMessage" TEXT,
    "generationTimeMs" INTEGER,
    "imageProvider" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImageGenerationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ImagePrompt_name_key" ON "ImagePrompt"("name");

-- CreateIndex
CREATE INDEX "ImagePrompt_category_isDefault_idx" ON "ImagePrompt"("category", "isDefault");

-- CreateIndex
CREATE INDEX "ImagePrompt_category_isActive_sortOrder_idx" ON "ImagePrompt"("category", "isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "ImageQueue_status_createdAt_idx" ON "ImageQueue"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ImageQueue_entityType_entityId_idx" ON "ImageQueue"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ImageGenerationLog_entityType_entityId_idx" ON "ImageGenerationLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ImageGenerationLog_promptId_idx" ON "ImageGenerationLog"("promptId");

-- CreateIndex
CREATE INDEX "ImageGenerationLog_status_idx" ON "ImageGenerationLog"("status");

-- CreateIndex
CREATE INDEX "ImageGenerationLog_createdAt_idx" ON "ImageGenerationLog"("createdAt");

-- AlterTable Trip - add imagePromptId column if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Trip' AND column_name='imagePromptId') THEN
    ALTER TABLE "Trip" ADD COLUMN "imagePromptId" TEXT;
  END IF;
END $$;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_imagePromptId_fkey" FOREIGN KEY ("imagePromptId") REFERENCES "ImagePrompt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
