-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'ACTIVE', 'FUNDED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PledgeStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EscrowStatus" AS ENUM ('PROCESSING', 'HELD', 'RELEASED', 'REFUNDED', 'FAILED');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'SUBMITTED', 'VERIFIED', 'COMPLETED', 'DISPUTED');

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "fundingGoal" DOUBLE PRECISION NOT NULL,
    "fundingDeadline" TIMESTAMP(3) NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "creatorId" TEXT NOT NULL,
    "campaignId" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pledges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "PledgeStatus" NOT NULL DEFAULT 'PENDING',
    "escrowRef" TEXT,
    "paymentMethod" TEXT,
    "paymentIntentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),

    CONSTRAINT "pledges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escrow_transactions" (
    "id" TEXT NOT NULL,
    "pledgeId" TEXT NOT NULL,
    "milestoneId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "EscrowStatus" NOT NULL DEFAULT 'PROCESSING',
    "escrowTransactionId" TEXT,
    "releaseCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "escrow_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_milestones" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "fundingAmount" DOUBLE PRECISION NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "status" "MilestoneStatus" NOT NULL DEFAULT 'PENDING',
    "completionEvidence" TEXT,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "project_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_skill_needs" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "hoursNeeded" INTEGER,
    "description" TEXT,
    "isFilled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_skill_needs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_skills" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "proficiencyLevel" INTEGER NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "portfolioUrl" TEXT,
    "endorsements" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_skills_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "projects_campaignId_key" ON "projects"("campaignId");

-- CreateIndex
CREATE INDEX "projects_creatorId_idx" ON "projects"("creatorId");

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");

-- CreateIndex
CREATE INDEX "projects_fundingDeadline_idx" ON "projects"("fundingDeadline");

-- CreateIndex
CREATE INDEX "pledges_userId_idx" ON "pledges"("userId");

-- CreateIndex
CREATE INDEX "pledges_projectId_idx" ON "pledges"("projectId");

-- CreateIndex
CREATE INDEX "pledges_status_idx" ON "pledges"("status");

-- CreateIndex
CREATE INDEX "pledges_createdAt_idx" ON "pledges"("createdAt");

-- CreateIndex
CREATE INDEX "escrow_transactions_pledgeId_idx" ON "escrow_transactions"("pledgeId");

-- CreateIndex
CREATE INDEX "escrow_transactions_milestoneId_idx" ON "escrow_transactions"("milestoneId");

-- CreateIndex
CREATE INDEX "escrow_transactions_status_idx" ON "escrow_transactions"("status");

-- CreateIndex
CREATE INDEX "project_milestones_projectId_idx" ON "project_milestones"("projectId");

-- CreateIndex
CREATE INDEX "project_milestones_status_idx" ON "project_milestones"("status");

-- CreateIndex
CREATE INDEX "project_milestones_orderIndex_idx" ON "project_milestones"("orderIndex");

-- CreateIndex
CREATE INDEX "project_skill_needs_projectId_idx" ON "project_skill_needs"("projectId");

-- CreateIndex
CREATE INDEX "project_skill_needs_skillId_idx" ON "project_skill_needs"("skillId");

-- CreateIndex
CREATE INDEX "project_skill_needs_isFilled_idx" ON "project_skill_needs"("isFilled");

-- CreateIndex
CREATE UNIQUE INDEX "skills_name_key" ON "skills"("name");

-- CreateIndex
CREATE INDEX "skills_category_idx" ON "skills"("category");

-- CreateIndex
CREATE INDEX "skills_name_idx" ON "skills"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_skills_userId_skillId_key" ON "user_skills"("userId", "skillId");

-- CreateIndex
CREATE INDEX "user_skills_userId_idx" ON "user_skills"("userId");

-- CreateIndex
CREATE INDEX "user_skills_skillId_idx" ON "user_skills"("skillId");

-- CreateIndex
CREATE INDEX "user_skills_proficiencyLevel_idx" ON "user_skills"("proficiencyLevel");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pledges" ADD CONSTRAINT "pledges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pledges" ADD CONSTRAINT "pledges_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_transactions" ADD CONSTRAINT "escrow_transactions_pledgeId_fkey" FOREIGN KEY ("pledgeId") REFERENCES "pledges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_transactions" ADD CONSTRAINT "escrow_transactions_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "project_milestones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_milestones" ADD CONSTRAINT "project_milestones_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_skill_needs" ADD CONSTRAINT "project_skill_needs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_skill_needs" ADD CONSTRAINT "project_skill_needs_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;