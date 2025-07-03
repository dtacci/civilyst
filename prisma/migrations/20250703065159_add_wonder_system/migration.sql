-- CreateEnum
CREATE TYPE "WonderCategory" AS ENUM ('GENERAL', 'BUSINESS', 'RECREATION', 'INFRASTRUCTURE', 'COMMUNITY', 'ENVIRONMENT');

-- CreateEnum
CREATE TYPE "WonderTimeContext" AS ENUM ('MORNING', 'LUNCH', 'EVENING', 'WEEKEND', 'ANYTIME');

-- CreateEnum
CREATE TYPE "WonderStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'CONVERTED_TO_CAMPAIGN');

-- CreateEnum
CREATE TYPE "PatternStatus" AS ENUM ('EMERGING', 'STRONG', 'ACTIONABLE', 'CONVERTED');

-- CreateTable
CREATE TABLE "wonders" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "category" "WonderCategory" NOT NULL DEFAULT 'GENERAL',
    "authorId" TEXT,
    "locationContext" TEXT,
    "timeContext" "WonderTimeContext" NOT NULL DEFAULT 'ANYTIME',
    "responseCount" INTEGER NOT NULL DEFAULT 0,
    "patternDetected" BOOLEAN NOT NULL DEFAULT false,
    "campaignId" TEXT,
    "status" "WonderStatus" NOT NULL DEFAULT 'ACTIVE',
    "isSeeded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wonders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wonder_responses" (
    "id" TEXT NOT NULL,
    "wonderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "audioUrl" TEXT,
    "transcription" TEXT,
    "textResponse" TEXT,
    "parsedLocation" TEXT,
    "parsedNeed" TEXT,
    "parsedSentiment" TEXT,
    "extractedEntities" JSONB,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "geohash" TEXT,
    "isProcessed" BOOLEAN NOT NULL DEFAULT false,
    "processingError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wonder_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wonder_patterns" (
    "id" TEXT NOT NULL,
    "wonderId" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "supportCount" INTEGER NOT NULL DEFAULT 0,
    "locationCluster" TEXT,
    "centerLatitude" DOUBLE PRECISION,
    "centerLongitude" DOUBLE PRECISION,
    "radius" DOUBLE PRECISION,
    "suggestedCampaignTitle" TEXT,
    "campaignId" TEXT,
    "status" "PatternStatus" NOT NULL DEFAULT 'EMERGING',
    "threshold" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wonder_patterns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wonders_status_createdAt_idx" ON "wonders"("status", "createdAt");

-- CreateIndex
CREATE INDEX "wonders_category_status_idx" ON "wonders"("category", "status");

-- CreateIndex
CREATE INDEX "wonders_timeContext_status_idx" ON "wonders"("timeContext", "status");

-- CreateIndex
CREATE INDEX "wonders_responseCount_idx" ON "wonders"("responseCount");

-- CreateIndex
CREATE INDEX "wonders_patternDetected_idx" ON "wonders"("patternDetected");

-- CreateIndex
CREATE INDEX "wonders_authorId_idx" ON "wonders"("authorId");

-- CreateIndex
CREATE INDEX "wonder_responses_wonderId_createdAt_idx" ON "wonder_responses"("wonderId", "createdAt");

-- CreateIndex
CREATE INDEX "wonder_responses_userId_createdAt_idx" ON "wonder_responses"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "wonder_responses_parsedLocation_idx" ON "wonder_responses"("parsedLocation");

-- CreateIndex
CREATE INDEX "wonder_responses_geohash_idx" ON "wonder_responses"("geohash");

-- CreateIndex
CREATE INDEX "wonder_responses_isProcessed_idx" ON "wonder_responses"("isProcessed");

-- CreateIndex
CREATE INDEX "wonder_responses_createdAt_idx" ON "wonder_responses"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "wonder_responses_wonderId_userId_key" ON "wonder_responses"("wonderId", "userId");

-- CreateIndex
CREATE INDEX "wonder_patterns_wonderId_confidence_idx" ON "wonder_patterns"("wonderId", "confidence");

-- CreateIndex
CREATE INDEX "wonder_patterns_status_supportCount_idx" ON "wonder_patterns"("status", "supportCount");

-- CreateIndex
CREATE INDEX "wonder_patterns_locationCluster_idx" ON "wonder_patterns"("locationCluster");

-- CreateIndex
CREATE INDEX "wonder_patterns_createdAt_idx" ON "wonder_patterns"("createdAt");

-- AddForeignKey
ALTER TABLE "wonders" ADD CONSTRAINT "wonders_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wonders" ADD CONSTRAINT "wonders_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wonder_responses" ADD CONSTRAINT "wonder_responses_wonderId_fkey" FOREIGN KEY ("wonderId") REFERENCES "wonders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wonder_responses" ADD CONSTRAINT "wonder_responses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wonder_patterns" ADD CONSTRAINT "wonder_patterns_wonderId_fkey" FOREIGN KEY ("wonderId") REFERENCES "wonders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wonder_patterns" ADD CONSTRAINT "wonder_patterns_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
