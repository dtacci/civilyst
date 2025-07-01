-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VoteType" AS ENUM ('SUPPORT', 'OPPOSE');

-- CreateEnum
CREATE TYPE "DistrictType" AS ENUM ('CITY_COUNCIL', 'WARD', 'NEIGHBORHOOD', 'SCHOOL_DISTRICT', 'COUNTY', 'STATE_HOUSE', 'STATE_SENATE', 'CONGRESSIONAL', 'PLANNING_ZONE', 'VOTING_PRECINCT');

-- CreateEnum
CREATE TYPE "DistrictLevel" AS ENUM ('NEIGHBORHOOD', 'MUNICIPAL', 'COUNTY', 'STATE', 'FEDERAL');

-- CreateEnum
CREATE TYPE "DistrictRelationship" AS ENUM ('WITHIN', 'INTERSECTS', 'NEARBY', 'AFFECTS');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "creatorId" TEXT NOT NULL,
    "county" TEXT,
    "geohash" TEXT,
    "timezone" TEXT,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "campaignId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votes" (
    "id" TEXT NOT NULL,
    "type" "VoteType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "campaignId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "districts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DistrictType" NOT NULL,
    "level" "DistrictLevel" NOT NULL,
    "population" INTEGER,
    "area" DOUBLE PRECISION,
    "description" TEXT,
    "city" TEXT,
    "state" TEXT NOT NULL,
    "county" TEXT,
    "zipCodes" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_districts" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "districtId" TEXT NOT NULL,
    "relationship" "DistrictRelationship" NOT NULL DEFAULT 'WITHIN',

    CONSTRAINT "campaign_districts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_clerkId_key" ON "users"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "users_updatedAt_idx" ON "users"("updatedAt" DESC);

-- CreateIndex
CREATE INDEX "users_firstName_lastName_idx" ON "users"("firstName", "lastName");

-- CreateIndex
CREATE INDEX "campaigns_latitude_longitude_idx" ON "campaigns"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "campaigns_status_createdAt_idx" ON "campaigns"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "campaigns_creatorId_status_idx" ON "campaigns"("creatorId", "status");

-- CreateIndex
CREATE INDEX "campaigns_city_status_idx" ON "campaigns"("city", "status");

-- CreateIndex
CREATE INDEX "campaigns_state_city_status_idx" ON "campaigns"("state", "city", "status");

-- CreateIndex
CREATE INDEX "campaigns_createdAt_idx" ON "campaigns"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "campaigns_updatedAt_idx" ON "campaigns"("updatedAt" DESC);

-- CreateIndex
CREATE INDEX "campaigns_status_updatedAt_idx" ON "campaigns"("status", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "campaigns_geohash_idx" ON "campaigns"("geohash");

-- CreateIndex
CREATE INDEX "campaigns_title_idx" ON "campaigns"("title");

-- CreateIndex
CREATE INDEX "comments_campaignId_createdAt_idx" ON "comments"("campaignId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "comments_authorId_createdAt_idx" ON "comments"("authorId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "comments_createdAt_idx" ON "comments"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "votes_campaignId_type_idx" ON "votes"("campaignId", "type");

-- CreateIndex
CREATE INDEX "votes_userId_createdAt_idx" ON "votes"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "votes_type_createdAt_idx" ON "votes"("type", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "votes_campaignId_createdAt_idx" ON "votes"("campaignId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "votes_campaignId_userId_key" ON "votes"("campaignId", "userId");

-- CreateIndex
CREATE INDEX "districts_state_type_idx" ON "districts"("state", "type");

-- CreateIndex
CREATE INDEX "districts_city_state_idx" ON "districts"("city", "state");

-- CreateIndex
CREATE INDEX "districts_type_level_idx" ON "districts"("type", "level");

-- CreateIndex
CREATE INDEX "districts_state_level_type_idx" ON "districts"("state", "level", "type");

-- CreateIndex
CREATE INDEX "campaign_districts_campaignId_relationship_idx" ON "campaign_districts"("campaignId", "relationship");

-- CreateIndex
CREATE INDEX "campaign_districts_districtId_relationship_idx" ON "campaign_districts"("districtId", "relationship");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_districts_campaignId_districtId_key" ON "campaign_districts"("campaignId", "districtId");

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_districts" ADD CONSTRAINT "campaign_districts_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_districts" ADD CONSTRAINT "campaign_districts_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "districts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
