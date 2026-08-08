-- Phase 4: Media, Navigation, Settings expansion, Managed pages, Link health, Redirect origin

CREATE TYPE "RedirectOrigin" AS ENUM ('SLUG_CHANGE', 'LEGACY_MIGRATION', 'MANUAL');
CREATE TYPE "MediaSourceType" AS ENUM ('STATIC_EXISTING', 'UPLOADED', 'EXTERNAL');
CREATE TYPE "MediaAssetStatus" AS ENUM ('ACTIVE', 'ARCHIVED');
CREATE TYPE "NavigationMenuKey" AS ENUM (
  'HEADER_PRIMARY',
  'HEADER_RESOURCES',
  'HEADER_SERVICES',
  'HEADER_SEO',
  'HEADER_PLATFORMS',
  'HEADER_CTA',
  'FOOTER_SERVICES',
  'FOOTER_SEO',
  'FOOTER_PLATFORMS',
  'FOOTER_COMPANY',
  'FOOTER_RESOURCES',
  'FOOTER_LEGAL'
);
CREATE TYPE "NavigationItemStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "LinkHealthIssueType" AS ENUM (
  'BROKEN',
  'REDIRECTING',
  'UNPUBLISHED_DESTINATION',
  'ORPHAN',
  'INVALID_RELATION',
  'CANONICAL_MISMATCH',
  'OPTIONAL_WARNING'
);
CREATE TYPE "LinkHealthSeverity" AS ENUM ('ERROR', 'WARNING', 'INFO');

ALTER TABLE "Redirect" ADD COLUMN "origin" "RedirectOrigin" NOT NULL DEFAULT 'MANUAL';
CREATE INDEX "Redirect_origin_idx" ON "Redirect"("origin");

ALTER TABLE "SiteSettings" ADD COLUMN "businessName" TEXT NOT NULL DEFAULT 'Smartlance Designs';
ALTER TABLE "SiteSettings" ADD COLUMN "defaultSiteDescription" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "defaultLocale" TEXT NOT NULL DEFAULT 'en';
ALTER TABLE "SiteSettings" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'Africa/Lagos';
ALTER TABLE "SiteSettings" ADD COLUMN "canonicalHost" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "contactEmail" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "contactPhone" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "whatsapp" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "footerDescription" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "primaryLogoPath" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "logoOnDarkPath" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "brandMarkPath" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "faviconPath" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "defaultTitleTemplate" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "publisherName" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "gaMeasurementId" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "gtmContainerId" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "clarityProjectId" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "analyticsEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "SiteSettings" ADD COLUMN "contactFormEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "SiteSettings" ADD COLUMN "freeReviewFormEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "SiteSettings" ADD COLUMN "formSuccessMessage" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "formFallbackMessage" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "showPublicPricing" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SiteSettings" ADD COLUMN "robotsDefaultIndex" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "SiteSettings" ADD COLUMN "socialLinks" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "SiteSettings" ADD COLUMN "extras" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "SiteSettings" ADD COLUMN "updatedById" TEXT;

CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "storageProvider" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "publicUrl" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "altText" TEXT,
    "caption" TEXT,
    "title" TEXT,
    "sourceType" "MediaSourceType" NOT NULL DEFAULT 'UPLOADED',
    "status" "MediaAssetStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdById" TEXT,
    "updatedById" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MediaAsset_storageKey_key" ON "MediaAsset"("storageKey");
CREATE INDEX "MediaAsset_status_createdAt_idx" ON "MediaAsset"("status", "createdAt");
CREATE INDEX "MediaAsset_filename_idx" ON "MediaAsset"("filename");
CREATE INDEX "MediaAsset_sourceType_idx" ON "MediaAsset"("sourceType");
CREATE INDEX "MediaAsset_mimeType_idx" ON "MediaAsset"("mimeType");

ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "NavigationMenu" (
    "id" TEXT NOT NULL,
    "menuKey" "NavigationMenuKey" NOT NULL,
    "label" TEXT NOT NULL,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "draftItems" JSONB NOT NULL DEFAULT '[]',
    "publishedItems" JSONB NOT NULL DEFAULT '[]',
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedById" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NavigationMenu_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NavigationMenu_menuKey_key" ON "NavigationMenu"("menuKey");
CREATE INDEX "NavigationMenu_status_idx" ON "NavigationMenu"("status");

ALTER TABLE "NavigationMenu" ADD CONSTRAINT "NavigationMenu_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "NavigationItem" (
    "id" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "parentId" TEXT,
    "label" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "external" BOOLEAN NOT NULL DEFAULT false,
    "openInNewTab" BOOLEAN NOT NULL DEFAULT false,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "status" "NavigationItemStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NavigationItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NavigationItem_menuId_displayOrder_idx" ON "NavigationItem"("menuId", "displayOrder");
CREATE INDEX "NavigationItem_parentId_idx" ON "NavigationItem"("parentId");

ALTER TABLE "NavigationItem" ADD CONSTRAINT "NavigationItem_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "NavigationMenu"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NavigationItem" ADD CONSTRAINT "NavigationItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "NavigationItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ManagedPage" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "ogImagePath" TEXT,
    "noIndex" BOOLEAN NOT NULL DEFAULT false,
    "canonicalOverride" TEXT,
    "heroEyebrow" TEXT,
    "heroHeadline" TEXT,
    "heroSupporting" TEXT,
    "status" "PublishStatus" NOT NULL DEFAULT 'PUBLISHED',
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManagedPage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ManagedPage_key_key" ON "ManagedPage"("key");
CREATE UNIQUE INDEX "ManagedPage_route_key" ON "ManagedPage"("route");
CREATE INDEX "ManagedPage_status_idx" ON "ManagedPage"("status");

ALTER TABLE "ManagedPage" ADD CONSTRAINT "ManagedPage_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "LinkHealthRun" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "summary" JSONB,
    "triggeredById" TEXT,

    CONSTRAINT "LinkHealthRun_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "LinkHealthRun" ADD CONSTRAINT "LinkHealthRun_triggeredById_fkey" FOREIGN KEY ("triggeredById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "LinkHealthIssue" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "type" "LinkHealthIssueType" NOT NULL,
    "severity" "LinkHealthSeverity" NOT NULL DEFAULT 'WARNING',
    "sourceType" TEXT NOT NULL,
    "sourceLabel" TEXT NOT NULL,
    "sourcePath" TEXT,
    "targetPath" TEXT,
    "message" TEXT NOT NULL,
    "fixHint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LinkHealthIssue_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LinkHealthIssue_runId_type_idx" ON "LinkHealthIssue"("runId", "type");
CREATE INDEX "LinkHealthIssue_severity_idx" ON "LinkHealthIssue"("severity");

ALTER TABLE "LinkHealthIssue" ADD CONSTRAINT "LinkHealthIssue_runId_fkey" FOREIGN KEY ("runId") REFERENCES "LinkHealthRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
