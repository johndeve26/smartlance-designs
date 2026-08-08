-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'EDITOR', 'CONTENT_MANAGER', 'REVIEWER');

-- CreateEnum
CREATE TYPE "AdminUserStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "PublishStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RedirectType" AS ENUM ('PERMANENT_301', 'TEMPORARY_302');

-- CreateEnum
CREATE TYPE "RedirectStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'EDITOR',
    "status" "AdminUserStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "userAgent" TEXT,
    "ipHash" TEXT,

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentRevision" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Redirect" (
    "id" TEXT NOT NULL,
    "sourcePath" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "type" "RedirectType" NOT NULL DEFAULT 'PERMANENT_301',
    "status" "RedirectStatus" NOT NULL DEFAULT 'ACTIVE',
    "reason" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Redirect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'site',
    "siteName" TEXT NOT NULL DEFAULT 'Smartlance Designs',
    "defaultMetaTitle" TEXT,
    "defaultMetaDescription" TEXT,
    "defaultOgImagePath" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomepageContent" (
    "id" TEXT NOT NULL DEFAULT 'home',
    "heroEyebrow" TEXT NOT NULL,
    "heroHeadline" TEXT NOT NULL,
    "heroHeadlineAccent" TEXT,
    "heroSupporting" TEXT NOT NULL,
    "primaryCtaLabel" TEXT NOT NULL,
    "primaryCtaHref" TEXT NOT NULL,
    "secondaryCtaLabel" TEXT NOT NULL,
    "secondaryCtaHref" TEXT NOT NULL,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "sections" JSONB NOT NULL,
    "sectionVisibility" JSONB NOT NULL,
    "curatedServiceItems" JSONB NOT NULL,
    "curatedTestimonialIds" JSONB NOT NULL,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "ogImagePath" TEXT,
    "noIndex" BOOLEAN NOT NULL DEFAULT false,
    "canonicalOverride" TEXT,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomepageContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortTitle" TEXT,
    "category" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tagline" TEXT,
    "narrativeTitle" TEXT,
    "narrative" TEXT,
    "seoConnection" TEXT,
    "audience" TEXT,
    "platformsNote" TEXT,
    "visualVariant" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "navigationFeatured" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "capabilities" JSONB,
    "idealFor" JSONB,
    "problems" JSONB,
    "deliverables" JSONB,
    "process" JSONB,
    "evaluationItems" JSONB,
    "faqs" JSONB,
    "relatedProjectSlugs" JSONB,
    "relatedServiceSlugs" JSONB,
    "relatedSeoSlugs" JSONB,
    "relatedPlatformSlugs" JSONB,
    "relatedSolutionSlugs" JSONB,
    "ctaTitle" TEXT,
    "ctaDescription" TEXT,
    "primaryCtaLabel" TEXT,
    "primaryCtaHref" TEXT,
    "secondaryCtaLabel" TEXT,
    "secondaryCtaHref" TEXT,
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

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Solution" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "eyebrow" TEXT,
    "heroStatement" TEXT,
    "heroSupporting" TEXT,
    "problemSymptoms" JSONB,
    "possibleCauses" JSONB,
    "whatWeReview" JSONB,
    "process" JSONB,
    "measurementPoints" JSONB,
    "relatedServiceHrefs" JSONB NOT NULL,
    "relatedPlatformSlugs" JSONB,
    "relatedIndustrySlugs" JSONB,
    "relatedProjectSlugs" JSONB,
    "relatedArticleSlugs" JSONB,
    "relatedServiceReasons" JSONB,
    "relatedSolutions" JSONB,
    "faqs" JSONB,
    "pageKind" TEXT,
    "pageContent" JSONB,
    "ctaTitle" TEXT,
    "ctaDescription" TEXT,
    "primaryCtaLabel" TEXT,
    "primaryCtaHref" TEXT,
    "secondaryCtaLabel" TEXT,
    "secondaryCtaHref" TEXT,
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

    CONSTRAINT "Solution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Platform" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tagline" TEXT,
    "icon" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "prominence" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "navigationFeatured" BOOLEAN NOT NULL DEFAULT false,
    "verifiedExperience" BOOLEAN NOT NULL DEFAULT false,
    "platformMatch" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "audiences" JSONB NOT NULL,
    "whenItFits" JSONB,
    "capabilities" JSONB NOT NULL,
    "challenges" JSONB,
    "seoSection" JSONB,
    "relatedServiceHrefs" JSONB NOT NULL,
    "relatedSeoHrefs" JSONB,
    "faqs" JSONB,
    "legacyUrl" TEXT,
    "conversionNote" TEXT,
    "migrationNote" TEXT,
    "ctaTitle" TEXT,
    "ctaDescription" TEXT,
    "seoTitle" TEXT NOT NULL,
    "seoDescription" TEXT NOT NULL,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "ogImagePath" TEXT,
    "noIndex" BOOLEAN NOT NULL DEFAULT false,
    "canonicalOverride" TEXT,
    "lastReviewedAt" TIMESTAMP(3),
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Platform_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "AdminUser_status_idx" ON "AdminUser"("status");

-- CreateIndex
CREATE INDEX "AdminUser_role_idx" ON "AdminUser"("role");

-- CreateIndex
CREATE UNIQUE INDEX "AdminSession_tokenHash_key" ON "AdminSession"("tokenHash");

-- CreateIndex
CREATE INDEX "AdminSession_userId_idx" ON "AdminSession"("userId");

-- CreateIndex
CREATE INDEX "AdminSession_expiresAt_idx" ON "AdminSession"("expiresAt");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "ContentRevision_entityType_entityId_idx" ON "ContentRevision"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentRevision_entityType_entityId_revision_key" ON "ContentRevision"("entityType", "entityId", "revision");

-- CreateIndex
CREATE UNIQUE INDEX "Redirect_sourcePath_key" ON "Redirect"("sourcePath");

-- CreateIndex
CREATE INDEX "Redirect_status_idx" ON "Redirect"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Service_href_key" ON "Service"("href");

-- CreateIndex
CREATE INDEX "Service_status_idx" ON "Service"("status");

-- CreateIndex
CREATE INDEX "Service_publishedAt_idx" ON "Service"("publishedAt");

-- CreateIndex
CREATE INDEX "Service_group_idx" ON "Service"("group");

-- CreateIndex
CREATE INDEX "Service_displayOrder_idx" ON "Service"("displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Solution_slug_key" ON "Solution"("slug");

-- CreateIndex
CREATE INDEX "Solution_status_idx" ON "Solution"("status");

-- CreateIndex
CREATE INDEX "Solution_publishedAt_idx" ON "Solution"("publishedAt");

-- CreateIndex
CREATE INDEX "Solution_category_idx" ON "Solution"("category");

-- CreateIndex
CREATE INDEX "Solution_displayOrder_idx" ON "Solution"("displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Platform_slug_key" ON "Platform"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Platform_href_key" ON "Platform"("href");

-- CreateIndex
CREATE INDEX "Platform_status_idx" ON "Platform"("status");

-- CreateIndex
CREATE INDEX "Platform_publishedAt_idx" ON "Platform"("publishedAt");

-- CreateIndex
CREATE INDEX "Platform_group_idx" ON "Platform"("group");

-- CreateIndex
CREATE INDEX "Platform_displayOrder_idx" ON "Platform"("displayOrder");

-- AddForeignKey
ALTER TABLE "AdminSession" ADD CONSTRAINT "AdminSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentRevision" ADD CONSTRAINT "ContentRevision_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Redirect" ADD CONSTRAINT "Redirect_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomepageContent" ADD CONSTRAINT "HomepageContent_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Solution" ADD CONSTRAINT "Solution_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Solution" ADD CONSTRAINT "Solution_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Platform" ADD CONSTRAINT "Platform_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Platform" ADD CONSTRAINT "Platform_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
