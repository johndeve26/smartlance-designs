CREATE TYPE "IndustryGroupKind" AS ENUM ('proven', 'supported');

CREATE TYPE "ResourceKind" AS ENUM ('guide', 'comparison', 'checklist', 'glossary', 'template', 'tool');

CREATE TYPE "CurationPlacement" AS ENUM ('RESOURCES_HUB', 'HOMEPAGE_WORK', 'HOMEPAGE_INSIGHT', 'WORK_ARCHIVE');

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Industry" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "group" "IndustryGroupKind" NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "hasVerifiedProjectExperience" BOOLEAN NOT NULL DEFAULT false,
    "relatedServiceLinks" JSONB NOT NULL,
    "relatedSolutionSlugs" JSONB,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "ogImagePath" TEXT,
    "noIndex" BOOLEAN NOT NULL DEFAULT false,
    "canonicalOverride" TEXT,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Industry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkProject" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "clientName" TEXT,
    "industryLabel" TEXT NOT NULL,
    "projectType" TEXT,
    "shortDescription" TEXT,
    "overview" TEXT,
    "challenge" TEXT NOT NULL,
    "solution" TEXT NOT NULL,
    "approach" TEXT,
    "designNotes" TEXT,
    "developmentNotes" TEXT,
    "seoNotes" TEXT,
    "resultSummary" TEXT,
    "results" JSONB,
    "measurableResults" JSONB,
    "goals" JSONB,
    "servicesLabels" JSONB NOT NULL,
    "technologies" JSONB,
    "platformId" TEXT,
    "platformLabel" TEXT,
    "platformsLabels" JSONB,
    "websiteUrl" TEXT,
    "oldUrl" TEXT,
    "year" INTEGER,
    "coverImagePath" TEXT,
    "coverImageAlt" TEXT,
    "heroImagePath" TEXT,
    "heroImageAlt" TEXT,
    "gallery" JSONB,
    "relatedServiceHrefs" JSONB,
    "relatedWorkSlugs" JSONB,
    "featuredHomepage" BOOLEAN NOT NULL DEFAULT false,
    "featuredWorkArchive" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "heroStatement" TEXT,
    "challenges" JSONB,
    "approachSteps" JSONB,
    "solutionPoints" JSONB,
    "highlights" JSONB,
    "platformContext" TEXT,
    "outcomeHeading" TEXT,
    "seoTitle" TEXT NOT NULL,
    "seoDescription" TEXT NOT NULL,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "ogImagePath" TEXT,
    "noIndex" BOOLEAN NOT NULL DEFAULT false,
    "canonicalOverride" TEXT,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndustryWork" (
    "industryId" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "IndustryWork_pkey" PRIMARY KEY ("industryId","workId")
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "legacyId" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "company" TEXT NOT NULL,
    "serviceLabel" TEXT,
    "avatarPath" TEXT,
    "workProjectId" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "internalSource" TEXT,
    "internalSourceUrl" TEXT,
    "internalVerificationNote" TEXT,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Insight" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "bodyMarkdown" TEXT NOT NULL,
    "categoryLabel" TEXT NOT NULL,
    "author" TEXT,
    "readingTime" TEXT,
    "heroImagePath" TEXT,
    "heroImageAlt" TEXT,
    "relatedServiceHrefs" JSONB,
    "tags" JSONB,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "legacyUrl" TEXT,
    "originalPublishedAt" TIMESTAMP(3) NOT NULL,
    "materialUpdatedAt" TIMESTAMP(3),
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "ogImagePath" TEXT,
    "noIndex" BOOLEAN NOT NULL DEFAULT false,
    "canonicalOverride" TEXT,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Insight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsightTopic" (
    "insightId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,

    CONSTRAINT "InsightTopic_pkey" PRIMARY KEY ("insightId","topicId")
);

-- CreateTable
CREATE TABLE "CmsResource" (
    "id" TEXT NOT NULL,
    "type" "ResourceKind" NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "deck" TEXT,
    "href" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "featuredOnResources" BOOLEAN NOT NULL DEFAULT false,
    "featuredOrder" INTEGER NOT NULL DEFAULT 0,
    "readingTime" TEXT,
    "author" TEXT,
    "heroImagePath" TEXT,
    "heroImageAlt" TEXT,
    "relatedServiceHrefs" JSONB,
    "relatedSolutionSlugs" JSONB,
    "relatedPlatformSlugs" JSONB,
    "relatedInsightSlugs" JSONB,
    "relatedResourceIds" JSONB,
    "aliases" JSONB,
    "acronym" TEXT,
    "shortDefinition" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "ogImagePath" TEXT,
    "noIndex" BOOLEAN NOT NULL DEFAULT false,
    "canonicalOverride" TEXT,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "materialUpdatedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CmsResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CmsResourceTopic" (
    "resourceId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,

    CONSTRAINT "CmsResourceTopic_pkey" PRIMARY KEY ("resourceId","topicId")
);

-- CreateTable
CREATE TABLE "ContentCuration" (
    "id" TEXT NOT NULL,
    "placement" "CurationPlacement" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentCuration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetReference" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "alt" TEXT,
    "kind" TEXT NOT NULL,
    "entityHint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentImportMarker" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "report" JSONB,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentImportMarker_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Topic_slug_key" ON "Topic"("slug");

-- CreateIndex
CREATE INDEX "Topic_active_displayOrder_idx" ON "Topic"("active", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Industry_slug_key" ON "Industry"("slug");

-- CreateIndex
CREATE INDEX "Industry_status_idx" ON "Industry"("status");

-- CreateIndex
CREATE INDEX "Industry_group_idx" ON "Industry"("group");

-- CreateIndex
CREATE INDEX "Industry_displayOrder_idx" ON "Industry"("displayOrder");

-- CreateIndex
CREATE INDEX "Industry_hasVerifiedProjectExperience_idx" ON "Industry"("hasVerifiedProjectExperience");

-- CreateIndex
CREATE UNIQUE INDEX "WorkProject_slug_key" ON "WorkProject"("slug");

-- CreateIndex
CREATE INDEX "WorkProject_status_idx" ON "WorkProject"("status");

-- CreateIndex
CREATE INDEX "WorkProject_publishedAt_idx" ON "WorkProject"("publishedAt");

-- CreateIndex
CREATE INDEX "WorkProject_displayOrder_idx" ON "WorkProject"("displayOrder");

-- CreateIndex
CREATE INDEX "WorkProject_featuredHomepage_idx" ON "WorkProject"("featuredHomepage");

-- CreateIndex
CREATE INDEX "WorkProject_featuredWorkArchive_idx" ON "WorkProject"("featuredWorkArchive");

-- CreateIndex
CREATE INDEX "WorkProject_platformId_idx" ON "WorkProject"("platformId");

-- CreateIndex
CREATE INDEX "IndustryWork_workId_idx" ON "IndustryWork"("workId");

-- CreateIndex
CREATE UNIQUE INDEX "Testimonial_legacyId_key" ON "Testimonial"("legacyId");

-- CreateIndex
CREATE INDEX "Testimonial_status_idx" ON "Testimonial"("status");

-- CreateIndex
CREATE INDEX "Testimonial_verified_idx" ON "Testimonial"("verified");

-- CreateIndex
CREATE INDEX "Testimonial_displayOrder_idx" ON "Testimonial"("displayOrder");

-- CreateIndex
CREATE INDEX "Testimonial_workProjectId_idx" ON "Testimonial"("workProjectId");

-- CreateIndex
CREATE UNIQUE INDEX "Insight_slug_key" ON "Insight"("slug");

-- CreateIndex
CREATE INDEX "Insight_status_idx" ON "Insight"("status");

-- CreateIndex
CREATE INDEX "Insight_publishedAt_idx" ON "Insight"("publishedAt");

-- CreateIndex
CREATE INDEX "Insight_originalPublishedAt_idx" ON "Insight"("originalPublishedAt");

-- CreateIndex
CREATE INDEX "Insight_categoryLabel_idx" ON "Insight"("categoryLabel");

-- CreateIndex
CREATE INDEX "Insight_featured_idx" ON "Insight"("featured");

-- CreateIndex
CREATE INDEX "InsightTopic_topicId_idx" ON "InsightTopic"("topicId");

-- CreateIndex
CREATE INDEX "CmsResource_status_idx" ON "CmsResource"("status");

-- CreateIndex
CREATE INDEX "CmsResource_type_status_idx" ON "CmsResource"("type", "status");

-- CreateIndex
CREATE INDEX "CmsResource_publishedAt_idx" ON "CmsResource"("publishedAt");

-- CreateIndex
CREATE INDEX "CmsResource_featuredOnResources_featuredOrder_idx" ON "CmsResource"("featuredOnResources", "featuredOrder");

-- CreateIndex
CREATE UNIQUE INDEX "CmsResource_type_slug_key" ON "CmsResource"("type", "slug");

-- CreateIndex
CREATE INDEX "CmsResourceTopic_topicId_idx" ON "CmsResourceTopic"("topicId");

-- CreateIndex
CREATE INDEX "ContentCuration_placement_active_sortOrder_idx" ON "ContentCuration"("placement", "active", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ContentCuration_placement_entityType_entityId_key" ON "ContentCuration"("placement", "entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "AssetReference_path_key" ON "AssetReference"("path");

-- CreateIndex
CREATE INDEX "AssetReference_kind_idx" ON "AssetReference"("kind");

-- AddForeignKey
ALTER TABLE "Industry" ADD CONSTRAINT "Industry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Industry" ADD CONSTRAINT "Industry_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkProject" ADD CONSTRAINT "WorkProject_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkProject" ADD CONSTRAINT "WorkProject_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkProject" ADD CONSTRAINT "WorkProject_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndustryWork" ADD CONSTRAINT "IndustryWork_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndustryWork" ADD CONSTRAINT "IndustryWork_workId_fkey" FOREIGN KEY ("workId") REFERENCES "WorkProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_workProjectId_fkey" FOREIGN KEY ("workProjectId") REFERENCES "WorkProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Insight" ADD CONSTRAINT "Insight_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Insight" ADD CONSTRAINT "Insight_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsightTopic" ADD CONSTRAINT "InsightTopic_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES "Insight"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsightTopic" ADD CONSTRAINT "InsightTopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CmsResource" ADD CONSTRAINT "CmsResource_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CmsResource" ADD CONSTRAINT "CmsResource_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CmsResourceTopic" ADD CONSTRAINT "CmsResourceTopic_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "CmsResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CmsResourceTopic" ADD CONSTRAINT "CmsResourceTopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

