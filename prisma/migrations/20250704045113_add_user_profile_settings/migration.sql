-- AlterTable
ALTER TABLE "users" ADD COLUMN     "allowMentions" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "autoDetectLocation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "defaultLocation" TEXT,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "notificationPreferences" TEXT,
ADD COLUMN     "showActivity" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showLocation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showStats" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "users_location_idx" ON "users"("location");

-- CreateIndex
CREATE INDEX "users_isPublic_idx" ON "users"("isPublic");
