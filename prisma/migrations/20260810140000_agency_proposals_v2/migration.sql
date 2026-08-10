-- Agency Operations V2 — Proposals & Scope Management

-- AlterTable
ALTER TABLE "AgencyProject" ADD COLUMN "sourceProposalId" TEXT;
ALTER TABLE "AgencyProject" ADD COLUMN "sourceProposalAcceptanceId" TEXT;

-- CreateEnum
CREATE TYPE "AgencyProposalStatus" AS ENUM ('DRAFT', 'INTERNAL_REVIEW', 'SENT', 'CHANGES_REQUESTED', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'ARCHIVED');
CREATE TYPE "AgencyProposalLineItemType" AS ENUM ('SERVICE', 'ADD_ON', 'DISCOUNT', 'OTHER');
CREATE TYPE "AgencyProposalClientRole" AS ENUM ('VIEWER', 'DECISION_MAKER');
CREATE TYPE "AgencyProposalClientResponseType" AS ENUM ('CHANGES_REQUESTED', 'DECLINED');
CREATE TYPE "AgencyProposalActivityType" AS ENUM ('PROPOSAL_CREATED', 'VERSION_CREATED', 'SENT', 'VIEWED', 'CHANGES_REQUESTED', 'DECLINED', 'ACCEPTED', 'PROJECT_CREATED');
CREATE TYPE "AgencyProposalSectionType" AS ENUM ('OVERVIEW', 'GOALS', 'SCOPE', 'DELIVERABLES', 'TIMELINE', 'PRICING', 'ASSUMPTIONS', 'EXCLUSIONS', 'REVISION_POLICY', 'NEXT_STEPS', 'CLIENT_RESPONSIBILITIES');

-- CreateTable
CREATE TABLE "AgencyProposalCounter" (
    "year" INTEGER NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencyProposalCounter_pkey" PRIMARY KEY ("year")
);

CREATE TABLE "AgencyProposal" (
    "id" TEXT NOT NULL,
    "proposalNumber" TEXT NOT NULL,
    "dealId" TEXT,
    "companyId" TEXT,
    "primaryContactId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "status" "AgencyProposalStatus" NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "currentVersionId" TEXT,
    "acceptedVersionId" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "internalNotes" TEXT,
    "sentAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencyProposal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyProposalVersion" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "versionNumber" INT NOT NULL,
    "title" TEXT NOT NULL,
    "intro" TEXT,
    "scopeSummary" TEXT,
    "timelineSummary" TEXT,
    "estimatedStart" TIMESTAMP(3),
    "estimatedDuration" TEXT,
    "pricingSubtotal" DECIMAL(12,2) NOT NULL,
    "discountAmount" DECIMAL(12,2),
    "taxAmount" DECIMAL(12,2),
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "assumptionsText" TEXT,
    "exclusionsText" TEXT,
    "termsSummary" TEXT,
    "revisionPolicy" TEXT,
    "validUntil" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "AgencyProposalVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyProposalSection" (
    "id" TEXT NOT NULL,
    "proposalVersionId" TEXT NOT NULL,
    "sectionType" "AgencyProposalSectionType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "position" INTEGER NOT NULL,

    CONSTRAINT "AgencyProposalSection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyProposalScopeItem" (
    "id" TEXT NOT NULL,
    "proposalVersionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL,
    "included" BOOLEAN NOT NULL DEFAULT true,
    "clientVisible" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AgencyProposalScopeItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyProposalDeliverableItem" (
    "id" TEXT NOT NULL,
    "proposalVersionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "position" INTEGER NOT NULL,

    CONSTRAINT "AgencyProposalDeliverableItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyProposalLineItem" (
    "id" TEXT NOT NULL,
    "proposalVersionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "position" INTEGER NOT NULL,
    "type" "AgencyProposalLineItemType" NOT NULL DEFAULT 'SERVICE',
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "isSelectedByDefault" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AgencyProposalLineItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyProposalClientAccess" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "portalUserId" TEXT,
    "role" "AgencyProposalClientRole" NOT NULL DEFAULT 'VIEWER',
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "grantedById" TEXT NOT NULL,
    "firstViewedAt" TIMESTAMP(3),
    "lastViewedAt" TIMESTAMP(3),

    CONSTRAINT "AgencyProposalClientAccess_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyProposalClientResponse" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "portalUserId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "responseType" "AgencyProposalClientResponseType" NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgencyProposalClientResponse_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyProposalAcceptance" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "acceptedVersionId" TEXT NOT NULL,
    "portalUserId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedTotal" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "selectedOptionalItemIds" JSONB NOT NULL,
    "scopeHash" TEXT,
    "termsAcknowledged" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AgencyProposalAcceptance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyProposalActivity" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "type" "AgencyProposalActivityType" NOT NULL,
    "summary" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorPortalUserId" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "clientVisible" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgencyProposalActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AgencyProposal_proposalNumber_key" ON "AgencyProposal"("proposalNumber");
CREATE INDEX "AgencyProposal_status_updatedAt_idx" ON "AgencyProposal"("status", "updatedAt");
CREATE INDEX "AgencyProposal_ownerId_status_idx" ON "AgencyProposal"("ownerId", "status");
CREATE INDEX "AgencyProposal_dealId_idx" ON "AgencyProposal"("dealId");
CREATE INDEX "AgencyProposal_companyId_idx" ON "AgencyProposal"("companyId");
CREATE INDEX "AgencyProposal_primaryContactId_idx" ON "AgencyProposal"("primaryContactId");

CREATE UNIQUE INDEX "AgencyProposalVersion_proposalId_versionNumber_key" ON "AgencyProposalVersion"("proposalId", "versionNumber");
CREATE INDEX "AgencyProposalVersion_proposalId_idx" ON "AgencyProposalVersion"("proposalId");

CREATE INDEX "AgencyProposalSection_proposalVersionId_position_idx" ON "AgencyProposalSection"("proposalVersionId", "position");
CREATE INDEX "AgencyProposalScopeItem_proposalVersionId_position_idx" ON "AgencyProposalScopeItem"("proposalVersionId", "position");
CREATE INDEX "AgencyProposalDeliverableItem_proposalVersionId_position_idx" ON "AgencyProposalDeliverableItem"("proposalVersionId", "position");
CREATE INDEX "AgencyProposalLineItem_proposalVersionId_position_idx" ON "AgencyProposalLineItem"("proposalVersionId", "position");

CREATE UNIQUE INDEX "AgencyProposalClientAccess_proposalId_contactId_key" ON "AgencyProposalClientAccess"("proposalId", "contactId");
CREATE INDEX "AgencyProposalClientAccess_portalUserId_proposalId_idx" ON "AgencyProposalClientAccess"("portalUserId", "proposalId");
CREATE INDEX "AgencyProposalClientAccess_contactId_idx" ON "AgencyProposalClientAccess"("contactId");

CREATE INDEX "AgencyProposalClientResponse_proposalId_createdAt_idx" ON "AgencyProposalClientResponse"("proposalId", "createdAt");

CREATE UNIQUE INDEX "AgencyProposalAcceptance_proposalId_key" ON "AgencyProposalAcceptance"("proposalId");
CREATE INDEX "AgencyProposalAcceptance_acceptedVersionId_idx" ON "AgencyProposalAcceptance"("acceptedVersionId");

CREATE INDEX "AgencyProposalActivity_proposalId_createdAt_idx" ON "AgencyProposalActivity"("proposalId", "createdAt");

CREATE UNIQUE INDEX "AgencyProject_sourceProposalId_key" ON "AgencyProject"("sourceProposalId");
CREATE UNIQUE INDEX "AgencyProject_sourceProposalAcceptanceId_key" ON "AgencyProject"("sourceProposalAcceptanceId");

-- AddForeignKey
ALTER TABLE "AgencyProject" ADD CONSTRAINT "AgencyProject_sourceProposalId_fkey" FOREIGN KEY ("sourceProposalId") REFERENCES "AgencyProposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyProject" ADD CONSTRAINT "AgencyProject_sourceProposalAcceptanceId_fkey" FOREIGN KEY ("sourceProposalAcceptanceId") REFERENCES "AgencyProposalAcceptance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AgencyProposal" ADD CONSTRAINT "AgencyProposal_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "CrmDeal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyProposal" ADD CONSTRAINT "AgencyProposal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CrmCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyProposal" ADD CONSTRAINT "AgencyProposal_primaryContactId_fkey" FOREIGN KEY ("primaryContactId") REFERENCES "CrmContact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgencyProposal" ADD CONSTRAINT "AgencyProposal_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgencyProposal" ADD CONSTRAINT "AgencyProposal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AgencyProposalVersion" ADD CONSTRAINT "AgencyProposalVersion_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "AgencyProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyProposalVersion" ADD CONSTRAINT "AgencyProposalVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AgencyProposalSection" ADD CONSTRAINT "AgencyProposalSection_proposalVersionId_fkey" FOREIGN KEY ("proposalVersionId") REFERENCES "AgencyProposalVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyProposalScopeItem" ADD CONSTRAINT "AgencyProposalScopeItem_proposalVersionId_fkey" FOREIGN KEY ("proposalVersionId") REFERENCES "AgencyProposalVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyProposalDeliverableItem" ADD CONSTRAINT "AgencyProposalDeliverableItem_proposalVersionId_fkey" FOREIGN KEY ("proposalVersionId") REFERENCES "AgencyProposalVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyProposalLineItem" ADD CONSTRAINT "AgencyProposalLineItem_proposalVersionId_fkey" FOREIGN KEY ("proposalVersionId") REFERENCES "AgencyProposalVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AgencyProposalClientAccess" ADD CONSTRAINT "AgencyProposalClientAccess_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "AgencyProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyProposalClientAccess" ADD CONSTRAINT "AgencyProposalClientAccess_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyProposalClientAccess" ADD CONSTRAINT "AgencyProposalClientAccess_portalUserId_fkey" FOREIGN KEY ("portalUserId") REFERENCES "ClientPortalUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyProposalClientAccess" ADD CONSTRAINT "AgencyProposalClientAccess_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AgencyProposalClientResponse" ADD CONSTRAINT "AgencyProposalClientResponse_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "AgencyProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyProposalClientResponse" ADD CONSTRAINT "AgencyProposalClientResponse_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "AgencyProposalVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyProposalClientResponse" ADD CONSTRAINT "AgencyProposalClientResponse_portalUserId_fkey" FOREIGN KEY ("portalUserId") REFERENCES "ClientPortalUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgencyProposalClientResponse" ADD CONSTRAINT "AgencyProposalClientResponse_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AgencyProposalAcceptance" ADD CONSTRAINT "AgencyProposalAcceptance_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "AgencyProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyProposalAcceptance" ADD CONSTRAINT "AgencyProposalAcceptance_portalUserId_fkey" FOREIGN KEY ("portalUserId") REFERENCES "ClientPortalUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgencyProposalAcceptance" ADD CONSTRAINT "AgencyProposalAcceptance_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AgencyProposalActivity" ADD CONSTRAINT "AgencyProposalActivity_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "AgencyProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyProposalActivity" ADD CONSTRAINT "AgencyProposalActivity_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyProposalActivity" ADD CONSTRAINT "AgencyProposalActivity_actorPortalUserId_fkey" FOREIGN KEY ("actorPortalUserId") REFERENCES "ClientPortalUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
