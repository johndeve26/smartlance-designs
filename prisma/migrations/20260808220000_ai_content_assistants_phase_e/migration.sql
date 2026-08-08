-- Phase E: Homepage draft boundary + HOMEPAGE AI + TI Work/Homepage recommendations

ALTER TYPE "AIContentEntityType" ADD VALUE IF NOT EXISTS 'HOMEPAGE';
ALTER TYPE "TopicRecommendation" ADD VALUE IF NOT EXISTS 'UPDATE_WORK_PAGE';
ALTER TYPE "TopicRecommendation" ADD VALUE IF NOT EXISTS 'UPDATE_HOMEPAGE';

ALTER TABLE "HomepageContent" ADD COLUMN IF NOT EXISTS "draftJson" JSONB;
ALTER TABLE "HomepageContent" ADD COLUMN IF NOT EXISTS "draftUpdatedAt" TIMESTAMP(3);
ALTER TABLE "HomepageContent" ADD COLUMN IF NOT EXISTS "draftUpdatedById" TEXT;

DO $$ BEGIN
  ALTER TABLE "HomepageContent"
    ADD CONSTRAINT "HomepageContent_draftUpdatedById_fkey"
    FOREIGN KEY ("draftUpdatedById") REFERENCES "AdminUser"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Optional resolved target for TI handoffs (additive)
ALTER TABLE "EditorialOpportunity" ADD COLUMN IF NOT EXISTS "targetEntityType" TEXT;
ALTER TABLE "EditorialOpportunity" ADD COLUMN IF NOT EXISTS "targetEntityId" TEXT;
