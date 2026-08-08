-- Phase B: Platform + Industry content assistants + TI industry handoff enum

ALTER TYPE "AIContentEntityType" ADD VALUE IF NOT EXISTS 'PLATFORM';
ALTER TYPE "AIContentEntityType" ADD VALUE IF NOT EXISTS 'INDUSTRY';

ALTER TYPE "TopicRecommendation" ADD VALUE IF NOT EXISTS 'UPDATE_INDUSTRY_PAGE';
ALTER TYPE "TopicContentFormat" ADD VALUE IF NOT EXISTS 'INDUSTRY_UPDATE';

ALTER TABLE "AIContentProposal" ADD COLUMN IF NOT EXISTS "opportunityId" TEXT;
CREATE INDEX IF NOT EXISTS "AIContentProposal_opportunityId_idx" ON "AIContentProposal"("opportunityId");
