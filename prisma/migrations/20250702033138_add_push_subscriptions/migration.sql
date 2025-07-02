/*
  Warnings:

  - The values [CITY_COUNCIL,WARD,NEIGHBORHOOD,SCHOOL_DISTRICT,PLANNING_ZONE,VOTING_PRECINCT] on the enum `DistrictType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `relationship` on the `campaign_districts` table. All the data in the column will be lost.
  - You are about to drop the column `county` on the `campaigns` table. All the data in the column will be lost.
  - You are about to drop the column `timezone` on the `campaigns` table. All the data in the column will be lost.
  - You are about to drop the column `area` on the `districts` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `districts` table. All the data in the column will be lost.
  - You are about to drop the column `county` on the `districts` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `districts` table. All the data in the column will be lost.
  - You are about to drop the column `level` on the `districts` table. All the data in the column will be lost.
  - You are about to drop the column `population` on the `districts` table. All the data in the column will be lost.
  - You are about to drop the column `zipCodes` on the `districts` table. All the data in the column will be lost.
  - You are about to drop the column `clerkId` on the `users` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DistrictType_new" AS ENUM ('CONGRESSIONAL', 'STATE_SENATE', 'STATE_HOUSE', 'COUNTY', 'CITY', 'SCHOOL');
ALTER TABLE "districts" ALTER COLUMN "type" TYPE "DistrictType_new" USING ("type"::text::"DistrictType_new");
ALTER TYPE "DistrictType" RENAME TO "DistrictType_old";
ALTER TYPE "DistrictType_new" RENAME TO "DistrictType";
DROP TYPE "DistrictType_old";
COMMIT;

-- DropIndex
DROP INDEX "campaign_districts_campaignId_relationship_idx";

-- DropIndex
DROP INDEX "campaign_districts_districtId_relationship_idx";

-- DropIndex
DROP INDEX "campaigns_createdAt_idx";

-- DropIndex
DROP INDEX "campaigns_status_createdAt_idx";

-- DropIndex
DROP INDEX "campaigns_status_updatedAt_idx";

-- DropIndex
DROP INDEX "campaigns_updatedAt_idx";

-- DropIndex
DROP INDEX "comments_authorId_createdAt_idx";

-- DropIndex
DROP INDEX "comments_campaignId_createdAt_idx";

-- DropIndex
DROP INDEX "comments_createdAt_idx";

-- DropIndex
DROP INDEX "districts_city_state_idx";

-- DropIndex
DROP INDEX "districts_state_level_type_idx";

-- DropIndex
DROP INDEX "districts_type_level_idx";

-- DropIndex
DROP INDEX "users_clerkId_key";

-- DropIndex
DROP INDEX "users_createdAt_idx";

-- DropIndex
DROP INDEX "users_updatedAt_idx";

-- DropIndex
DROP INDEX "votes_campaignId_createdAt_idx";

-- DropIndex
DROP INDEX "votes_type_createdAt_idx";

-- DropIndex
DROP INDEX "votes_userId_createdAt_idx";

-- AlterTable
ALTER TABLE "campaign_districts" DROP COLUMN "relationship";

-- AlterTable
ALTER TABLE "campaigns" DROP COLUMN "county",
DROP COLUMN "timezone",
ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "districts" DROP COLUMN "area",
DROP COLUMN "city",
DROP COLUMN "county",
DROP COLUMN "description",
DROP COLUMN "level",
DROP COLUMN "population",
DROP COLUMN "zipCodes",
ADD COLUMN     "boundary" JSONB,
ALTER COLUMN "state" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "clerkId";

-- DropEnum
DROP TYPE "DistrictLevel";

-- DropEnum
DROP TYPE "DistrictRelationship";

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT,
    "auth" TEXT,
    "userAgent" TEXT,
    "subscriptionData" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- CreateIndex
CREATE INDEX "PushSubscription_isActive_idx" ON "PushSubscription"("isActive");

-- CreateIndex
CREATE INDEX "PushSubscription_createdAt_idx" ON "PushSubscription"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_userId_endpoint_key" ON "PushSubscription"("userId", "endpoint");

-- CreateIndex
CREATE INDEX "campaign_districts_campaignId_idx" ON "campaign_districts"("campaignId");

-- CreateIndex
CREATE INDEX "campaign_districts_districtId_idx" ON "campaign_districts"("districtId");

-- CreateIndex
CREATE INDEX "campaigns_status_createdAt_idx" ON "campaigns"("status", "createdAt");

-- CreateIndex
CREATE INDEX "campaigns_createdAt_idx" ON "campaigns"("createdAt");

-- CreateIndex
CREATE INDEX "campaigns_updatedAt_idx" ON "campaigns"("updatedAt");

-- CreateIndex
CREATE INDEX "comments_campaignId_createdAt_idx" ON "comments"("campaignId", "createdAt");

-- CreateIndex
CREATE INDEX "comments_authorId_createdAt_idx" ON "comments"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "comments_createdAt_idx" ON "comments"("createdAt");

-- CreateIndex
CREATE INDEX "districts_type_idx" ON "districts"("type");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE INDEX "users_updatedAt_idx" ON "users"("updatedAt");

-- CreateIndex
CREATE INDEX "votes_userId_createdAt_idx" ON "votes"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "votes_type_createdAt_idx" ON "votes"("type", "createdAt");

-- CreateIndex
CREATE INDEX "votes_createdAt_idx" ON "votes"("createdAt");

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
