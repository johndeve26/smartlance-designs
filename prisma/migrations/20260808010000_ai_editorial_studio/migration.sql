-- CreateEnum
CREATE TYPE "AIEditorialMode" AS ENUM ('NEW_ARTICLE', 'UPDATE_EXISTING', 'BRIEF_ONLY', 'OUTLINE_ONLY', 'IMPROVE_DRAFT');

-- CreateEnum
CREATE TYPE "AIEditorialStatus" AS ENUM ('IDEA', 'RESEARCHING', 'BRIEF_READY', 'OUTLINE_READY', 'DRAFTING', 'DRAFT_READY', 'NEEDS_REVIEW', 'APPROVED_FOR_CMS', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AIRunStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AIRunOperation" AS ENUM ('TOPIC_ANALYSIS', 'RESEARCH', 'SERP_ANALYSIS', 'BRIEF', 'OUTLINE', 'SECTION_DRAFT', 'FULL_DRAFT', 'FACT_CHECK', 'SEO_REVIEW', 'AI_SEARCH_REVIEW', 'INTERNAL_LINK_REVIEW', 'EDITORIAL_REVIEW', 'META_GENERATION', 'FAQ_GENERATION', 'REFRESH_ANALYSIS', 'CANNIBALIZATION_CHECK', 'BRAND_VOICE_SUGGEST', 'CONTENT_IDEAS', 'CMS_HANDOFF');

-- CreateEnum
CREATE TYPE "AISourceType" AS ENUM ('PRIMARY', 'OFFICIAL', 'RESEARCH', 'INDUSTRY', 'COMMUNITY', 'COMPETITOR', 'USER_SUPPLIED');

-- CreateEnum
CREATE TYPE "AIClaimSupport" AS ENUM ('SUPPORTED_EXTERNAL', 'SUPPORTED_INTERNAL', 'GENERAL_KNOWLEDGE', 'EDITORIAL_OPINION', 'UNSUPPORTED', 'TIME_SENSITIVE');

-- CreateTable
CREATE TABLE "AIEditorialProject" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "workingTopic" TEXT NOT NULL,
    "mode" "AIEditorialMode" NOT NULL DEFAULT 'NEW_ARTICLE',
    "status" "AIEditorialStatus" NOT NULL DEFAULT 'IDEA',
    "targetAudience" TEXT,
    "businessGoal" TEXT,
    "primaryIntent" TEXT,
    "primaryQuery" TEXT,
    "secondaryQueries" JSONB,
    "targetRegion" TEXT,
    "contentType" TEXT,
    "serviceHref" TEXT,
    "solutionSlug" TEXT,
    "notes" TEXT,
    "uniqueValue" TEXT,
    "commodityWarning" BOOLEAN NOT NULL DEFAULT false,
    "cannibalization" JSONB,
    "briefJson" JSONB,
    "researchJson" JSONB,
    "outlineJson" JSONB,
    "draftMarkdown" TEXT,
    "seoJson" JSONB,
    "aiSearchJson" JSONB,
    "factCheckJson" JSONB,
    "internalLinksJson" JSONB,
    "qualityReviewJson" JSONB,
    "citationMode" TEXT NOT NULL DEFAULT 'RESEARCH_ONLY',
    "provider" TEXT,
    "model" TEXT,
    "promptVersion" TEXT,
    "lastResearchAt" TIMESTAMP(3),
    "insightSnapshotAt" TIMESTAMP(3),
    "linkedInsightId" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AIEditorialProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIEditorialRun" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "operation" "AIRunOperation" NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT,
    "promptVersion" TEXT,
    "inputFingerprint" TEXT,
    "status" "AIRunStatus" NOT NULL DEFAULT 'QUEUED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "tokenUsageInput" INTEGER,
    "tokenUsageOutput" INTEGER,
    "providerRequestId" TEXT,
    "errorCode" TEXT,
    "errorSummary" TEXT,
    "resultSummary" JSONB,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIEditorialRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIResearchSource" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "publisher" TEXT,
    "publishedAt" TIMESTAMP(3),
    "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceType" "AISourceType" NOT NULL DEFAULT 'INDUSTRY',
    "notes" TEXT,
    "snippet" TEXT,
    "selected" BOOLEAN NOT NULL DEFAULT true,
    "excluded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIResearchSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIClaim" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "claimText" TEXT NOT NULL,
    "support" "AIClaimSupport" NOT NULL DEFAULT 'UNSUPPORTED',
    "sectionHint" TEXT,
    "checkedAt" TIMESTAMP(3),
    "actionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIClaimSource" (
    "claimId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,

    CONSTRAINT "AIClaimSource_pkey" PRIMARY KEY ("claimId","sourceId")
);

-- CreateTable
CREATE TABLE "AIBrandVoice" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "personality" TEXT,
    "audience" TEXT,
    "tone" TEXT,
    "sentenceStyle" TEXT,
    "technicalDepth" TEXT,
    "preferredTerms" JSONB,
    "avoidedPhrases" JSONB,
    "ctaStyle" TEXT,
    "formattingPrefs" TEXT,
    "exemplarInsightIds" JSONB,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIBrandVoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIWriterSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "writingModel" TEXT,
    "researchModel" TEXT,
    "editorModel" TEXT,
    "fastModel" TEXT,
    "citationModeDefault" TEXT NOT NULL DEFAULT 'RESEARCH_ONLY',
    "maxResearchQueries" INTEGER NOT NULL DEFAULT 8,
    "maxSources" INTEGER NOT NULL DEFAULT 12,
    "maxDraftRegens" INTEGER NOT NULL DEFAULT 20,
    "maxConcurrentJobs" INTEGER NOT NULL DEFAULT 2,
    "sourcePolicyNotes" TEXT,
    "disclosureMode" TEXT NOT NULL DEFAULT 'none',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIWriterSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AIEditorialProject_linkedInsightId_key" ON "AIEditorialProject"("linkedInsightId");

-- CreateIndex
CREATE INDEX "AIEditorialProject_status_updatedAt_idx" ON "AIEditorialProject"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "AIEditorialProject_mode_idx" ON "AIEditorialProject"("mode");

-- CreateIndex
CREATE INDEX "AIEditorialProject_createdById_idx" ON "AIEditorialProject"("createdById");

-- CreateIndex
CREATE INDEX "AIEditorialProject_workingTopic_idx" ON "AIEditorialProject"("workingTopic");

-- CreateIndex
CREATE INDEX "AIEditorialRun_projectId_createdAt_idx" ON "AIEditorialRun"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "AIEditorialRun_status_idx" ON "AIEditorialRun"("status");

-- CreateIndex
CREATE INDEX "AIEditorialRun_operation_idx" ON "AIEditorialRun"("operation");

-- CreateIndex
CREATE INDEX "AIResearchSource_projectId_selected_idx" ON "AIResearchSource"("projectId", "selected");

-- CreateIndex
CREATE INDEX "AIResearchSource_projectId_excluded_idx" ON "AIResearchSource"("projectId", "excluded");

-- CreateIndex
CREATE INDEX "AIClaim_projectId_support_idx" ON "AIClaim"("projectId", "support");

-- AddForeignKey
ALTER TABLE "AIEditorialProject" ADD CONSTRAINT "AIEditorialProject_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIEditorialProject" ADD CONSTRAINT "AIEditorialProject_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIEditorialProject" ADD CONSTRAINT "AIEditorialProject_linkedInsightId_fkey" FOREIGN KEY ("linkedInsightId") REFERENCES "Insight"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIEditorialRun" ADD CONSTRAINT "AIEditorialRun_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "AIEditorialProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIEditorialRun" ADD CONSTRAINT "AIEditorialRun_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIResearchSource" ADD CONSTRAINT "AIResearchSource_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "AIEditorialProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIClaim" ADD CONSTRAINT "AIClaim_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "AIEditorialProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIClaimSource" ADD CONSTRAINT "AIClaimSource_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "AIClaim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIClaimSource" ADD CONSTRAINT "AIClaimSource_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "AIResearchSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIBrandVoice" ADD CONSTRAINT "AIBrandVoice_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
