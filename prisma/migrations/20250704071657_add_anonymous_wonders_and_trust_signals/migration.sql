-- CreateEnum
CREATE TYPE "TrustSignalType" AS ENUM ('LOCATION_VERIFIED', 'RETURN_VISIT', 'CONTENT_QUALITY', 'COMMUNITY_VALIDATION', 'PROFILE_COMPLETION', 'EMAIL_VERIFIED', 'PHONE_VERIFIED', 'ADDRESS_VERIFIED', 'SOCIAL_CONNECTED', 'WONDER_CONVERTED', 'CAMPAIGN_SUCCESS', 'MODERATION_FLAG');

-- CreateEnum
CREATE TYPE "TrustLevel" AS ENUM ('BASIC', 'VERIFIED', 'TRUSTED', 'LEADER');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "trustLevel" "TrustLevel" NOT NULL DEFAULT 'BASIC',
ADD COLUMN     "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "verifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "AnonymousWonder" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "voiceUrl" TEXT,
    "location" JSONB,
    "category" "WonderCategory" NOT NULL DEFAULT 'GENERAL',
    "timeContext" "WonderTimeContext" NOT NULL DEFAULT 'ANYTIME',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedBy" TEXT,
    "claimedAt" TIMESTAMP(3),
    "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "convertedToWonderId" TEXT,

    CONSTRAINT "AnonymousWonder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrustSignal" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "deviceId" TEXT,
    "signalType" "TrustSignalType" NOT NULL,
    "signalValue" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "TrustSignal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnonymousWonder_deviceId_idx" ON "AnonymousWonder"("deviceId");

-- CreateIndex
CREATE INDEX "AnonymousWonder_createdAt_idx" ON "AnonymousWonder"("createdAt");

-- CreateIndex
CREATE INDEX "AnonymousWonder_location_idx" ON "AnonymousWonder"("location");

-- CreateIndex
CREATE INDEX "AnonymousWonder_claimedBy_idx" ON "AnonymousWonder"("claimedBy");

-- CreateIndex
CREATE INDEX "TrustSignal_userId_idx" ON "TrustSignal"("userId");

-- CreateIndex
CREATE INDEX "TrustSignal_deviceId_idx" ON "TrustSignal"("deviceId");

-- CreateIndex
CREATE INDEX "TrustSignal_signalType_idx" ON "TrustSignal"("signalType");

-- CreateIndex
CREATE INDEX "TrustSignal_createdAt_idx" ON "TrustSignal"("createdAt");

-- CreateIndex
CREATE INDEX "users_trustScore_idx" ON "users"("trustScore");

-- CreateIndex
CREATE INDEX "users_trustLevel_idx" ON "users"("trustLevel");

-- AddForeignKey
ALTER TABLE "AnonymousWonder" ADD CONSTRAINT "AnonymousWonder_convertedToWonderId_fkey" FOREIGN KEY ("convertedToWonderId") REFERENCES "wonders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustSignal" ADD CONSTRAINT "TrustSignal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
