-- CreateEnum
CREATE TYPE "TopicSignalType" AS ENUM ('NEWS', 'TREND', 'PRODUCT_UPDATE', 'INDUSTRY_UPDATE', 'OFFICIAL_GUIDANCE', 'RESEARCH', 'QUESTION', 'CONTENT_GAP', 'FIRST_PARTY_SEARCH', 'USER_SEED', 'COMPETITOR_COVERAGE');

-- CreateEnum
CREATE TYPE "TopicSignalStatus" AS ENUM ('ACTIVE', 'SUPERSEDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TopicOpportunityStatus" AS ENUM ('NEW', 'REVIEWING', 'APPROVED', 'MONITORING', 'REJECTED', 'CONVERTED_TO_PROJECT', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TopicRecommendation" AS ENUM ('WRITE_NEW', 'UPDATE_EXISTING', 'EXPAND_EXISTING_RESOURCE', 'SUPPORT_COMMERCIAL_PAGE', 'UPDATE_SERVICE_PAGE', 'UPDATE_SOLUTION_PAGE', 'UPDATE_PLATFORM_PAGE', 'MONITOR', 'IGNORE');

-- CreateEnum
CREATE TYPE "TopicFreshnessClass" AS ENUM ('EVERGREEN', 'TIMELY', 'HYBRID');

-- CreateEnum
CREATE TYPE "TopicDiscoveryMode" AS ENUM ('MIXED', 'EXPLORE_SUGGESTION', 'SITE_GAPS', 'NEWS', 'INDUSTRY', 'PLATFORMS', 'TRENDS', 'EXISTING_CONTENT');

-- CreateEnum
CREATE TYPE "TopicSourceAuthority" AS ENUM ('OFFICIAL', 'PRIMARY', 'RESEARCH', 'INDUSTRY', 'NEWS', 'COMMUNITY', 'COMPETITOR');

-- CreateEnum
CREATE TYPE "TopicSeedType" AS ENUM ('TOPIC', 'QUESTION', 'INDUSTRY', 'SERVICE', 'SOLUTION', 'PLATFORM', 'COMPETITOR_THEME', 'SOURCE_URL', 'EDITORIAL_NOTE');

-- CreateEnum
CREATE TYPE "TopicContentFormat" AS ENUM ('INSIGHT', 'GUIDE', 'COMPARISON', 'CHECKLIST', 'GLOSSARY', 'TEMPLATE', 'TOOL', 'SERVICE_UPDATE', 'SOLUTION_UPDATE', 'PLATFORM_UPDATE');

-- CreateEnum
CREATE TYPE "TopicPriority" AS ENUM ('HIGH', 'NORMAL', 'LOW');

-- CreateEnum
CREATE TYPE "TopicRejectionReason" AS ENUM ('DUPLICATE', 'WEAK_RELEVANCE', 'NO_UNIQUE_ANGLE', 'POOR_SOURCE_QUALITY', 'OUTSIDE_STRATEGY', 'TOO_TEMPORARY', 'ALREADY_COVERED', 'OTHER');

-- AlterTable
ALTER TABLE "AIWriterSettings" ADD COLUMN     "maxDiscoveryProviderCalls" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN     "maxDiscoveryQueries" INTEGER NOT NULL DEFAULT 6,
ADD COLUMN     "maxDiscoveryResultsPerSource" INTEGER NOT NULL DEFAULT 8;

-- CreateTable
CREATE TABLE "TopicStrategySettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "priorityThemesJson" JSONB,
    "lowerPriorityThemesJson" JSONB,
    "marketsJson" JSONB,
    "contentGoalsJson" JSONB,
    "industryFocusJson" JSONB,
    "pausedTopicsJson" JSONB,
    "defaultMarket" TEXT NOT NULL DEFAULT 'global_en',
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TopicStrategySettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicSourcePack" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "market" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 50,
    "officialDomainsJson" JSONB,
    "rssFeedsJson" JSONB,
    "researchOrgsJson" JSONB,
    "publicationsJson" JSONB,
    "changelogUrlsJson" JSONB,
    "newsQueriesJson" JSONB,
    "keywordsJson" JSONB,
    "excludedDomainsJson" JSONB,
    "relatedServiceHrefsJson" JSONB,
    "relatedSolutionSlugsJson" JSONB,
    "relatedPlatformSlugsJson" JSONB,
    "relatedIndustrySlugsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "TopicSourcePack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicWatchlist" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "marketsJson" JSONB,
    "keywordsJson" JSONB,
    "conceptsJson" JSONB,
    "relatedServiceHrefsJson" JSONB,
    "relatedSolutionSlugsJson" JSONB,
    "relatedPlatformSlugsJson" JSONB,
    "sourcePackId" TEXT,
    "scheduleCron" TEXT,
    "scheduleEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastScanAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "TopicWatchlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicSeed" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "seedType" "TopicSeedType" NOT NULL DEFAULT 'TOPIC',
    "market" TEXT,
    "industry" TEXT,
    "notes" TEXT,
    "watchlistId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "analyzedAt" TIMESTAMP(3),

    CONSTRAINT "TopicSeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicDiscoveryRun" (
    "id" TEXT NOT NULL,
    "watchlistId" TEXT,
    "mode" "TopicDiscoveryMode" NOT NULL DEFAULT 'MIXED',
    "status" "AIRunStatus" NOT NULL DEFAULT 'QUEUED',
    "seedText" TEXT,
    "market" TEXT,
    "industry" TEXT,
    "freshnessPreference" TEXT,
    "commercialGoal" TEXT,
    "sourcePreference" TEXT,
    "forceRefresh" BOOLEAN NOT NULL DEFAULT false,
    "providersUsedJson" JSONB,
    "signalsFound" INTEGER NOT NULL DEFAULT 0,
    "clustersCreated" INTEGER NOT NULL DEFAULT 0,
    "opportunitiesCreated" INTEGER NOT NULL DEFAULT 0,
    "tokenUsageInput" INTEGER,
    "tokenUsageOutput" INTEGER,
    "providerCalls" INTEGER NOT NULL DEFAULT 0,
    "errorCode" TEXT,
    "errorSummary" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TopicDiscoveryRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicSignal" (
    "id" TEXT NOT NULL,
    "runId" TEXT,
    "provider" TEXT NOT NULL,
    "type" "TopicSignalType" NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "sourceUrl" TEXT,
    "sourceDomain" TEXT,
    "publishedAt" TIMESTAMP(3),
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "market" TEXT,
    "language" TEXT DEFAULT 'en',
    "entitiesJson" JSONB,
    "topicsJson" JSONB,
    "rawProviderId" TEXT,
    "sourceAuthorityType" "TopicSourceAuthority" NOT NULL DEFAULT 'INDUSTRY',
    "freshness" "TopicFreshnessClass" NOT NULL DEFAULT 'HYBRID',
    "status" "TopicSignalStatus" NOT NULL DEFAULT 'ACTIVE',
    "fingerprint" TEXT NOT NULL,
    "clusterKey" TEXT,
    "provenanceJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TopicSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EditorialOpportunity" (
    "id" TEXT NOT NULL,
    "workingTitle" TEXT NOT NULL,
    "coreTopic" TEXT NOT NULL,
    "question" TEXT,
    "status" "TopicOpportunityStatus" NOT NULL DEFAULT 'NEW',
    "recommendation" "TopicRecommendation" NOT NULL DEFAULT 'MONITOR',
    "intent" TEXT,
    "audience" TEXT,
    "market" TEXT,
    "timeliness" "TopicFreshnessClass" NOT NULL DEFAULT 'HYBRID',
    "evergreenPotential" BOOLEAN NOT NULL DEFAULT true,
    "commercialRelationship" TEXT,
    "uniqueValue" TEXT,
    "reasonToExist" TEXT,
    "whyNow" TEXT,
    "whySmartlance" TEXT,
    "existingContentJson" JSONB,
    "supportingSignalsJson" JSONB,
    "sourceSummaryJson" JSONB,
    "suggestedServicesJson" JSONB,
    "suggestedSolutionsJson" JSONB,
    "suggestedPlatformsJson" JSONB,
    "suggestedResourcesJson" JSONB,
    "suggestedFormat" "TopicContentFormat" NOT NULL DEFAULT 'INSIGHT',
    "suggestedCta" TEXT,
    "dimensionsJson" JSONB,
    "badge" TEXT,
    "priority" "TopicPriority" NOT NULL DEFAULT 'NORMAL',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "plannedFor" TIMESTAMP(3),
    "rejectionReason" "TopicRejectionReason",
    "rejectionNote" TEXT,
    "higherFactualReview" BOOLEAN NOT NULL DEFAULT false,
    "mergeKey" TEXT,
    "evidenceCount" INTEGER NOT NULL DEFAULT 0,
    "recurringSignal" BOOLEAN NOT NULL DEFAULT false,
    "seedId" TEXT,
    "runId" TEXT,
    "linkedAIProjectId" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EditorialOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TopicSourcePack_slug_key" ON "TopicSourcePack"("slug");

-- CreateIndex
CREATE INDEX "TopicSourcePack_enabled_priority_idx" ON "TopicSourcePack"("enabled", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "TopicWatchlist_slug_key" ON "TopicWatchlist"("slug");

-- CreateIndex
CREATE INDEX "TopicWatchlist_active_idx" ON "TopicWatchlist"("active");

-- CreateIndex
CREATE INDEX "TopicSeed_createdAt_idx" ON "TopicSeed"("createdAt");

-- CreateIndex
CREATE INDEX "TopicSeed_seedType_idx" ON "TopicSeed"("seedType");

-- CreateIndex
CREATE INDEX "TopicDiscoveryRun_status_createdAt_idx" ON "TopicDiscoveryRun"("status", "createdAt");

-- CreateIndex
CREATE INDEX "TopicDiscoveryRun_watchlistId_status_idx" ON "TopicDiscoveryRun"("watchlistId", "status");

-- CreateIndex
CREATE INDEX "TopicSignal_status_discoveredAt_idx" ON "TopicSignal"("status", "discoveredAt");

-- CreateIndex
CREATE INDEX "TopicSignal_clusterKey_idx" ON "TopicSignal"("clusterKey");

-- CreateIndex
CREATE INDEX "TopicSignal_type_discoveredAt_idx" ON "TopicSignal"("type", "discoveredAt");

-- CreateIndex
CREATE INDEX "TopicSignal_runId_idx" ON "TopicSignal"("runId");

-- CreateIndex
CREATE UNIQUE INDEX "TopicSignal_fingerprint_key" ON "TopicSignal"("fingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "EditorialOpportunity_linkedAIProjectId_key" ON "EditorialOpportunity"("linkedAIProjectId");

-- CreateIndex
CREATE INDEX "EditorialOpportunity_status_updatedAt_idx" ON "EditorialOpportunity"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "EditorialOpportunity_recommendation_status_idx" ON "EditorialOpportunity"("recommendation", "status");

-- CreateIndex
CREATE INDEX "EditorialOpportunity_mergeKey_idx" ON "EditorialOpportunity"("mergeKey");

-- CreateIndex
CREATE INDEX "EditorialOpportunity_priority_status_idx" ON "EditorialOpportunity"("priority", "status");

-- CreateIndex
CREATE INDEX "EditorialOpportunity_market_idx" ON "EditorialOpportunity"("market");

-- AddForeignKey
ALTER TABLE "TopicSourcePack" ADD CONSTRAINT "TopicSourcePack_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicWatchlist" ADD CONSTRAINT "TopicWatchlist_sourcePackId_fkey" FOREIGN KEY ("sourcePackId") REFERENCES "TopicSourcePack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicWatchlist" ADD CONSTRAINT "TopicWatchlist_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicSeed" ADD CONSTRAINT "TopicSeed_watchlistId_fkey" FOREIGN KEY ("watchlistId") REFERENCES "TopicWatchlist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicSeed" ADD CONSTRAINT "TopicSeed_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicDiscoveryRun" ADD CONSTRAINT "TopicDiscoveryRun_watchlistId_fkey" FOREIGN KEY ("watchlistId") REFERENCES "TopicWatchlist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicDiscoveryRun" ADD CONSTRAINT "TopicDiscoveryRun_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicSignal" ADD CONSTRAINT "TopicSignal_runId_fkey" FOREIGN KEY ("runId") REFERENCES "TopicDiscoveryRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditorialOpportunity" ADD CONSTRAINT "EditorialOpportunity_seedId_fkey" FOREIGN KEY ("seedId") REFERENCES "TopicSeed"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditorialOpportunity" ADD CONSTRAINT "EditorialOpportunity_runId_fkey" FOREIGN KEY ("runId") REFERENCES "TopicDiscoveryRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditorialOpportunity" ADD CONSTRAINT "EditorialOpportunity_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditorialOpportunity" ADD CONSTRAINT "EditorialOpportunity_linkedAIProjectId_fkey" FOREIGN KEY ("linkedAIProjectId") REFERENCES "AIEditorialProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
