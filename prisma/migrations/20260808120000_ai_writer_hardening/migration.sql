-- CreateEnum
CREATE TYPE "AIClaimEvidenceStrength" AS ENUM ('DIRECT', 'PARTIAL', 'CONTEXTUAL', 'INSUFFICIENT');

-- AlterTable AIEditorialProject
ALTER TABLE "AIEditorialProject" ADD COLUMN IF NOT EXISTS "analysisStale" JSONB;
ALTER TABLE "AIEditorialProject" ADD COLUMN IF NOT EXISTS "draftContentHash" TEXT;
ALTER TABLE "AIEditorialProject" ADD COLUMN IF NOT EXISTS "brandVoiceRevisionAt" TIMESTAMP(3);
ALTER TABLE "AIEditorialProject" ADD COLUMN IF NOT EXISTS "handoffRevisionId" TEXT;
ALTER TABLE "AIEditorialProject" ADD COLUMN IF NOT EXISTS "approvedById" TEXT;
ALTER TABLE "AIEditorialProject" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);

-- AlterTable AIClaimSource
ALTER TABLE "AIClaimSource" ADD COLUMN IF NOT EXISTS "evidenceStrength" "AIClaimEvidenceStrength" NOT NULL DEFAULT 'INSUFFICIENT';
ALTER TABLE "AIClaimSource" ADD COLUMN IF NOT EXISTS "evidenceSummary" TEXT;
ALTER TABLE "AIClaimSource" ADD COLUMN IF NOT EXISTS "checkedAt" TIMESTAMP(3);

-- AlterTable AIBrandVoice
ALTER TABLE "AIBrandVoice" ADD COLUMN IF NOT EXISTS "revision" INTEGER NOT NULL DEFAULT 1;

-- AlterTable AIWriterSettings
ALTER TABLE "AIWriterSettings" ADD COLUMN IF NOT EXISTS "dailyTokenWarningThreshold" INTEGER;
ALTER TABLE "AIWriterSettings" ADD COLUMN IF NOT EXISTS "staleJobMinutes" INTEGER NOT NULL DEFAULT 30;
ALTER TABLE "AIWriterSettings" ADD COLUMN IF NOT EXISTS "allowResultCache" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "AIWriterSettings" ADD COLUMN IF NOT EXISTS "modelPricingJson" JSONB;

-- CreateTable
CREATE TABLE IF NOT EXISTS "AIEvaluationSnapshot" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fixtureId" TEXT NOT NULL,
    "promptVersion" TEXT,
    "model" TEXT,
    "mode" TEXT NOT NULL DEFAULT 'mock',
    "dimensions" JSONB NOT NULL,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIEvaluationSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AIEvaluationSnapshot_fixtureId_createdAt_idx" ON "AIEvaluationSnapshot"("fixtureId", "createdAt");
CREATE INDEX IF NOT EXISTS "AIEvaluationSnapshot_createdAt_idx" ON "AIEvaluationSnapshot"("createdAt");

ALTER TABLE "AIEditorialProject" DROP CONSTRAINT IF EXISTS "AIEditorialProject_approvedById_fkey";
ALTER TABLE "AIEditorialProject" ADD CONSTRAINT "AIEditorialProject_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AIEvaluationSnapshot" DROP CONSTRAINT IF EXISTS "AIEvaluationSnapshot_createdById_fkey";
ALTER TABLE "AIEvaluationSnapshot" ADD CONSTRAINT "AIEvaluationSnapshot_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
