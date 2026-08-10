-- Client Success V1: Managed Websites, Website Care, Support Requests

CREATE TYPE "AgencyManagedWebsiteStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'PAUSED', 'ARCHIVED');
CREATE TYPE "AgencyManagedWebsiteCareStatus" AS ENUM ('NOT_ENROLLED', 'ACTIVE', 'PAUSED', 'ENDED');
CREATE TYPE "AgencyManagedWebsitePlatform" AS ENUM ('WORDPRESS', 'SHOPIFY', 'WEBFLOW', 'FRAMER', 'CUSTOM', 'OTHER');
CREATE TYPE "AgencyManagedWebsiteClientRole" AS ENUM ('VIEWER', 'MEMBER', 'WEBSITE_ADMIN');
CREATE TYPE "AgencyWebsiteObservedStatus" AS ENUM ('ONLINE', 'UNKNOWN', 'ISSUE_DETECTED');
CREATE TYPE "AgencyWebsiteStatusSource" AS ENUM ('MANUAL', 'MONITORING_PROVIDER', 'UNKNOWN');
CREATE TYPE "AgencyWebsiteCareEventType" AS ENUM ('MAINTENANCE', 'UPDATE', 'BACKUP', 'SECURITY', 'PERFORMANCE', 'CONTENT', 'DEPLOYMENT', 'DOMAIN', 'SSL', 'OTHER');
CREATE TYPE "AgencyWebsiteCareEventStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NEEDS_ATTENTION');
CREATE TYPE "AgencySupportRequestCategory" AS ENUM ('WEBSITE_CHANGE', 'CONTENT_UPDATE', 'TECHNICAL_ISSUE', 'QUESTION', 'ACCESS_HELP', 'NEW_FEATURE', 'OTHER');
CREATE TYPE "AgencySupportRequestPriority" AS ENUM ('NORMAL', 'IMPORTANT', 'URGENT');
CREATE TYPE "AgencySupportRequestStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_ON_CLIENT', 'RESOLVED', 'CLOSED');
CREATE TYPE "AgencySupportWaitingOn" AS ENUM ('SMARTLANCE', 'CLIENT', 'NONE');
CREATE TYPE "AgencySupportMessageAuthorType" AS ENUM ('CLIENT', 'SMARTLANCE');

CREATE TABLE "AgencySupportRequestCounter" (
    "year" INTEGER NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AgencySupportRequestCounter_pkey" PRIMARY KEY ("year")
);

CREATE TABLE "AgencyManagedWebsite" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "primaryProjectId" TEXT,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "productionUrl" TEXT,
    "platform" "AgencyManagedWebsitePlatform",
    "status" "AgencyManagedWebsiteStatus" NOT NULL DEFAULT 'ACTIVE',
    "careStatus" "AgencyManagedWebsiteCareStatus" NOT NULL DEFAULT 'NOT_ENROLLED',
    "carePlanName" TEXT,
    "launchDate" TIMESTAMP(3),
    "clientSummary" TEXT,
    "clientVisibleNotes" TEXT,
    "nextMaintenanceAt" TIMESTAMP(3),
    "lastMaintenanceAt" TIMESTAMP(3),
    "observedStatus" "AgencyWebsiteObservedStatus" DEFAULT 'UNKNOWN',
    "statusSource" "AgencyWebsiteStatusSource" NOT NULL DEFAULT 'UNKNOWN',
    "lastCheckedAt" TIMESTAMP(3),
    "sslStatusLabel" TEXT,
    "hostingLabel" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),
    CONSTRAINT "AgencyManagedWebsite_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyManagedWebsiteClientAccess" (
    "id" TEXT NOT NULL,
    "websiteId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "portalUserId" TEXT,
    "role" "AgencyManagedWebsiteClientRole" NOT NULL DEFAULT 'MEMBER',
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "grantedById" TEXT NOT NULL,
    CONSTRAINT "AgencyManagedWebsiteClientAccess_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyWebsiteCareEvent" (
    "id" TEXT NOT NULL,
    "websiteId" TEXT NOT NULL,
    "type" "AgencyWebsiteCareEventType" NOT NULL DEFAULT 'MAINTENANCE',
    "status" "AgencyWebsiteCareEventStatus" NOT NULL DEFAULT 'SCHEDULED',
    "title" TEXT NOT NULL,
    "clientSummary" TEXT,
    "internalNotes" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "performedById" TEXT,
    "clientVisible" BOOLEAN NOT NULL DEFAULT true,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgencyWebsiteCareEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencySupportRequest" (
    "id" TEXT NOT NULL,
    "supportNumber" TEXT NOT NULL,
    "websiteId" TEXT NOT NULL,
    "projectId" TEXT,
    "submittedByPortalUserId" TEXT NOT NULL,
    "submittedByContactId" TEXT NOT NULL,
    "category" "AgencySupportRequestCategory" NOT NULL DEFAULT 'OTHER',
    "priority" "AgencySupportRequestPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "AgencySupportRequestStatus" NOT NULL DEFAULT 'OPEN',
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "waitingOn" "AgencySupportWaitingOn" NOT NULL DEFAULT 'SMARTLANCE',
    "assignedToId" TEXT,
    "changeRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    CONSTRAINT "AgencySupportRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencySupportMessage" (
    "id" TEXT NOT NULL,
    "supportRequestId" TEXT NOT NULL,
    "authorType" "AgencySupportMessageAuthorType" NOT NULL,
    "portalUserId" TEXT,
    "adminUserId" TEXT,
    "body" TEXT NOT NULL,
    "clientVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgencySupportMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencySupportRequestFile" (
    "id" TEXT NOT NULL,
    "supportRequestId" TEXT NOT NULL,
    "projectFileId" TEXT NOT NULL,
    "clientVisible" BOOLEAN NOT NULL DEFAULT true,
    "submittedByPortalUserId" TEXT,
    "submittedByAdminUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgencySupportRequestFile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AgencyManagedWebsite_domain_key" ON "AgencyManagedWebsite"("domain");
CREATE UNIQUE INDEX "AgencySupportRequest_supportNumber_key" ON "AgencySupportRequest"("supportNumber");
CREATE UNIQUE INDEX "AgencyManagedWebsiteClientAccess_websiteId_contactId_key" ON "AgencyManagedWebsiteClientAccess"("websiteId", "contactId");

CREATE INDEX "AgencyManagedWebsite_companyId_status_idx" ON "AgencyManagedWebsite"("companyId", "status");
CREATE INDEX "AgencyManagedWebsiteClientAccess_portalUserId_websiteId_idx" ON "AgencyManagedWebsiteClientAccess"("portalUserId", "websiteId");
CREATE INDEX "AgencyWebsiteCareEvent_websiteId_completedAt_idx" ON "AgencyWebsiteCareEvent"("websiteId", "completedAt");
CREATE INDEX "AgencySupportRequest_websiteId_status_idx" ON "AgencySupportRequest"("websiteId", "status");
CREATE INDEX "AgencySupportRequest_submittedByPortalUserId_idx" ON "AgencySupportRequest"("submittedByPortalUserId");
CREATE INDEX "AgencySupportRequest_updatedAt_idx" ON "AgencySupportRequest"("updatedAt");
CREATE INDEX "AgencySupportMessage_supportRequestId_createdAt_idx" ON "AgencySupportMessage"("supportRequestId", "createdAt");

ALTER TABLE "AgencyManagedWebsite" ADD CONSTRAINT "AgencyManagedWebsite_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CrmCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyManagedWebsite" ADD CONSTRAINT "AgencyManagedWebsite_primaryProjectId_fkey" FOREIGN KEY ("primaryProjectId") REFERENCES "AgencyProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyManagedWebsite" ADD CONSTRAINT "AgencyManagedWebsite_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AgencyManagedWebsiteClientAccess" ADD CONSTRAINT "AgencyManagedWebsiteClientAccess_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "AgencyManagedWebsite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyManagedWebsiteClientAccess" ADD CONSTRAINT "AgencyManagedWebsiteClientAccess_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyManagedWebsiteClientAccess" ADD CONSTRAINT "AgencyManagedWebsiteClientAccess_portalUserId_fkey" FOREIGN KEY ("portalUserId") REFERENCES "ClientPortalUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyManagedWebsiteClientAccess" ADD CONSTRAINT "AgencyManagedWebsiteClientAccess_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AgencyWebsiteCareEvent" ADD CONSTRAINT "AgencyWebsiteCareEvent_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "AgencyManagedWebsite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyWebsiteCareEvent" ADD CONSTRAINT "AgencyWebsiteCareEvent_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AgencySupportRequest" ADD CONSTRAINT "AgencySupportRequest_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "AgencyManagedWebsite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgencySupportRequest" ADD CONSTRAINT "AgencySupportRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "AgencyProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencySupportRequest" ADD CONSTRAINT "AgencySupportRequest_submittedByPortalUserId_fkey" FOREIGN KEY ("submittedByPortalUserId") REFERENCES "ClientPortalUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgencySupportRequest" ADD CONSTRAINT "AgencySupportRequest_submittedByContactId_fkey" FOREIGN KEY ("submittedByContactId") REFERENCES "CrmContact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgencySupportRequest" ADD CONSTRAINT "AgencySupportRequest_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencySupportRequest" ADD CONSTRAINT "AgencySupportRequest_changeRequestId_fkey" FOREIGN KEY ("changeRequestId") REFERENCES "AgencyChangeRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AgencySupportMessage" ADD CONSTRAINT "AgencySupportMessage_supportRequestId_fkey" FOREIGN KEY ("supportRequestId") REFERENCES "AgencySupportRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencySupportMessage" ADD CONSTRAINT "AgencySupportMessage_portalUserId_fkey" FOREIGN KEY ("portalUserId") REFERENCES "ClientPortalUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencySupportMessage" ADD CONSTRAINT "AgencySupportMessage_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AgencySupportRequestFile" ADD CONSTRAINT "AgencySupportRequestFile_supportRequestId_fkey" FOREIGN KEY ("supportRequestId") REFERENCES "AgencySupportRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencySupportRequestFile" ADD CONSTRAINT "AgencySupportRequestFile_projectFileId_fkey" FOREIGN KEY ("projectFileId") REFERENCES "AgencyProjectFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgencySupportRequestFile" ADD CONSTRAINT "AgencySupportRequestFile_submittedByPortalUserId_fkey" FOREIGN KEY ("submittedByPortalUserId") REFERENCES "ClientPortalUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencySupportRequestFile" ADD CONSTRAINT "AgencySupportRequestFile_submittedByAdminUserId_fkey" FOREIGN KEY ("submittedByAdminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
