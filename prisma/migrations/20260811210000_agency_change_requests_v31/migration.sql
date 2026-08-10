-- Agency Operations V3.1 — Change Requests & Scope Control

ALTER TYPE "AgencyInvoiceSource" ADD VALUE IF NOT EXISTS 'CHANGE_REQUEST';

CREATE TYPE "AgencyChangeRequestOrigin" AS ENUM ('CLIENT', 'ADMIN');
CREATE TYPE "AgencyChangeRequestStatus" AS ENUM (
  'DRAFT',
  'SUBMITTED',
  'NEEDS_CLARIFICATION',
  'UNDER_ASSESSMENT',
  'AWAITING_CLIENT_APPROVAL',
  'APPROVED',
  'DECLINED',
  'APPLIED',
  'IMPLEMENTED',
  'CANCELLED'
);
CREATE TYPE "AgencyChangeRequestClassification" AS ENUM ('UNASSESSED', 'IN_SCOPE', 'OUT_OF_SCOPE');
CREATE TYPE "AgencyChangeRequestClientRole" AS ENUM ('VIEWER', 'APPROVER');
CREATE TYPE "AgencyChangeRequestMessageType" AS ENUM ('CLIENT_CLARIFICATION', 'AGENCY_CLARIFICATION_REQUEST');
CREATE TYPE "AgencyChangeRequestWorkItemType" AS ENUM ('TASK', 'DELIVERABLE', 'REQUIREMENT');
CREATE TYPE "AgencyChangeRequestActivityType" AS ENUM (
  'CREATED',
  'SUBMITTED',
  'CLARIFICATION_REQUESTED',
  'CLARIFICATION_RECEIVED',
  'ASSESSMENT_STARTED',
  'ASSESSED_IN_SCOPE',
  'ASSESSED_OUT_OF_SCOPE',
  'SENT_FOR_APPROVAL',
  'APPROVED',
  'DECLINED',
  'INVOICE_CREATED',
  'APPLIED_TO_PROJECT',
  'IMPLEMENTED',
  'CANCELLED'
);

CREATE TABLE "AgencyChangeRequestCounter" (
    "year" INTEGER NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AgencyChangeRequestCounter_pkey" PRIMARY KEY ("year")
);

CREATE TABLE "AgencyChangeRequest" (
    "id" TEXT NOT NULL,
    "changeRequestNumber" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "proposalAcceptanceId" TEXT,
    "contractId" TEXT,
    "origin" "AgencyChangeRequestOrigin" NOT NULL DEFAULT 'ADMIN',
    "requestedByPortalUserId" TEXT,
    "requestedByAdminUserId" TEXT,
    "requestedByContactId" TEXT,
    "title" TEXT NOT NULL,
    "requestDescription" TEXT NOT NULL,
    "status" "AgencyChangeRequestStatus" NOT NULL DEFAULT 'DRAFT',
    "classification" "AgencyChangeRequestClassification" NOT NULL DEFAULT 'UNASSESSED',
    "ownerId" TEXT,
    "currency" TEXT,
    "currentAssessmentId" TEXT,
    "requirePaymentBeforeImplementation" BOOLEAN NOT NULL DEFAULT false,
    "contractAmendmentRecommended" BOOLEAN NOT NULL DEFAULT false,
    "internalNotes" TEXT,
    "submittedAt" TIMESTAMP(3),
    "assessedAt" TIMESTAMP(3),
    "sentForApprovalAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "appliedAt" TIMESTAMP(3),
    "implementedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AgencyChangeRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyChangeRequestRevision" (
    "id" TEXT NOT NULL,
    "changeRequestId" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdByPortalUserId" TEXT,
    "createdByAdminUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgencyChangeRequestRevision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyChangeRequestAssessment" (
    "id" TEXT NOT NULL,
    "changeRequestId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "classification" "AgencyChangeRequestClassification" NOT NULL,
    "scopeImpactSummary" TEXT,
    "clientScopeImpactSummary" TEXT,
    "timelineImpactDays" INTEGER NOT NULL DEFAULT 0,
    "timelineImpactSummary" TEXT,
    "priceImpactMinor" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL,
    "implementationSummary" TEXT,
    "assessmentHash" TEXT,
    "sentForApprovalAt" TIMESTAMP(3),
    "supersededAt" TIMESTAMP(3),
    "assessedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AgencyChangeRequestAssessment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyChangeRequestClientAccess" (
    "id" TEXT NOT NULL,
    "changeRequestId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "portalUserId" TEXT,
    "role" "AgencyChangeRequestClientRole" NOT NULL DEFAULT 'VIEWER',
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "grantedById" TEXT NOT NULL,
    CONSTRAINT "AgencyChangeRequestClientAccess_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyChangeRequestApproval" (
    "id" TEXT NOT NULL,
    "changeRequestId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "portalUserId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "clientNameSnapshot" TEXT NOT NULL,
    "clientEmailSnapshot" TEXT NOT NULL,
    "approvedPriceImpactMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "approvedTimelineImpactDays" INTEGER NOT NULL DEFAULT 0,
    "scopeImpactSnapshot" TEXT,
    "timelineImpactSnapshot" TEXT,
    "assessmentHash" TEXT,
    "consentTextSnapshot" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgencyChangeRequestApproval_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyChangeRequestDecision" (
    "id" TEXT NOT NULL,
    "changeRequestId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "portalUserId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "comment" TEXT,
    "declinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgencyChangeRequestDecision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyChangeRequestMessage" (
    "id" TEXT NOT NULL,
    "changeRequestId" TEXT NOT NULL,
    "type" "AgencyChangeRequestMessageType" NOT NULL,
    "body" TEXT NOT NULL,
    "clientVisible" BOOLEAN NOT NULL DEFAULT true,
    "actorUserId" TEXT,
    "actorPortalUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgencyChangeRequestMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyChangeRequestWorkItem" (
    "id" TEXT NOT NULL,
    "changeRequestId" TEXT NOT NULL,
    "type" "AgencyChangeRequestWorkItemType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "clientVisible" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgencyChangeRequestWorkItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyChangeRequestApplication" (
    "id" TEXT NOT NULL,
    "changeRequestId" TEXT NOT NULL,
    "appliedById" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "previousTargetDueDate" TIMESTAMP(3),
    "newTargetDueDate" TIMESTAMP(3),
    "applicationSnapshotJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgencyChangeRequestApplication_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyChangeRequestActivity" (
    "id" TEXT NOT NULL,
    "changeRequestId" TEXT NOT NULL,
    "type" "AgencyChangeRequestActivityType" NOT NULL,
    "summary" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorPortalUserId" TEXT,
    "clientVisible" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgencyChangeRequestActivity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyChangeRequestFile" (
    "id" TEXT NOT NULL,
    "changeRequestId" TEXT NOT NULL,
    "projectFileId" TEXT NOT NULL,
    "clientVisible" BOOLEAN NOT NULL DEFAULT true,
    "submittedByPortalUserId" TEXT,
    "submittedByAdminUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgencyChangeRequestFile_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AgencyProjectTask" ADD COLUMN IF NOT EXISTS "changeRequestId" TEXT;
ALTER TABLE "AgencyDeliverable" ADD COLUMN IF NOT EXISTS "changeRequestId" TEXT;
ALTER TABLE "AgencyClientRequirement" ADD COLUMN IF NOT EXISTS "changeRequestId" TEXT;
ALTER TABLE "AgencyInvoice" ADD COLUMN IF NOT EXISTS "changeRequestId" TEXT;

CREATE UNIQUE INDEX "AgencyChangeRequest_changeRequestNumber_key" ON "AgencyChangeRequest"("changeRequestNumber");
CREATE UNIQUE INDEX "AgencyChangeRequestRevision_changeRequestId_revisionNumber_key" ON "AgencyChangeRequestRevision"("changeRequestId", "revisionNumber");
CREATE UNIQUE INDEX "AgencyChangeRequestAssessment_changeRequestId_versionNumber_key" ON "AgencyChangeRequestAssessment"("changeRequestId", "versionNumber");
CREATE UNIQUE INDEX "AgencyChangeRequestClientAccess_changeRequestId_contactId_key" ON "AgencyChangeRequestClientAccess"("changeRequestId", "contactId");
CREATE UNIQUE INDEX "AgencyChangeRequestApproval_changeRequestId_key" ON "AgencyChangeRequestApproval"("changeRequestId");
CREATE UNIQUE INDEX "AgencyChangeRequestDecision_changeRequestId_key" ON "AgencyChangeRequestDecision"("changeRequestId");
CREATE UNIQUE INDEX "AgencyChangeRequestApplication_changeRequestId_key" ON "AgencyChangeRequestApplication"("changeRequestId");
CREATE UNIQUE INDEX "AgencyInvoice_changeRequestId_key" ON "AgencyInvoice"("changeRequestId") WHERE "changeRequestId" IS NOT NULL;

CREATE INDEX "AgencyChangeRequest_projectId_status_idx" ON "AgencyChangeRequest"("projectId", "status");
CREATE INDEX "AgencyChangeRequest_status_updatedAt_idx" ON "AgencyChangeRequest"("status", "updatedAt");
CREATE INDEX "AgencyChangeRequest_ownerId_status_idx" ON "AgencyChangeRequest"("ownerId", "status");
CREATE INDEX "AgencyChangeRequestActivity_changeRequestId_createdAt_idx" ON "AgencyChangeRequestActivity"("changeRequestId", "createdAt");

ALTER TABLE "AgencyChangeRequest" ADD CONSTRAINT "AgencyChangeRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "AgencyProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyChangeRequest" ADD CONSTRAINT "AgencyChangeRequest_proposalAcceptanceId_fkey" FOREIGN KEY ("proposalAcceptanceId") REFERENCES "AgencyProposalAcceptance"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyChangeRequest" ADD CONSTRAINT "AgencyChangeRequest_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "AgencyContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyChangeRequest" ADD CONSTRAINT "AgencyChangeRequest_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyChangeRequest" ADD CONSTRAINT "AgencyChangeRequest_requestedByPortalUserId_fkey" FOREIGN KEY ("requestedByPortalUserId") REFERENCES "ClientPortalUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyChangeRequest" ADD CONSTRAINT "AgencyChangeRequest_requestedByAdminUserId_fkey" FOREIGN KEY ("requestedByAdminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyChangeRequest" ADD CONSTRAINT "AgencyChangeRequest_requestedByContactId_fkey" FOREIGN KEY ("requestedByContactId") REFERENCES "CrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyChangeRequest" ADD CONSTRAINT "AgencyChangeRequest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AgencyChangeRequestRevision" ADD CONSTRAINT "AgencyChangeRequestRevision_changeRequestId_fkey" FOREIGN KEY ("changeRequestId") REFERENCES "AgencyChangeRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyChangeRequestAssessment" ADD CONSTRAINT "AgencyChangeRequestAssessment_changeRequestId_fkey" FOREIGN KEY ("changeRequestId") REFERENCES "AgencyChangeRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyChangeRequestAssessment" ADD CONSTRAINT "AgencyChangeRequestAssessment_assessedById_fkey" FOREIGN KEY ("assessedById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgencyChangeRequestClientAccess" ADD CONSTRAINT "AgencyChangeRequestClientAccess_changeRequestId_fkey" FOREIGN KEY ("changeRequestId") REFERENCES "AgencyChangeRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyChangeRequestClientAccess" ADD CONSTRAINT "AgencyChangeRequestClientAccess_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyChangeRequestClientAccess" ADD CONSTRAINT "AgencyChangeRequestClientAccess_portalUserId_fkey" FOREIGN KEY ("portalUserId") REFERENCES "ClientPortalUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyChangeRequestClientAccess" ADD CONSTRAINT "AgencyChangeRequestClientAccess_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgencyChangeRequestApproval" ADD CONSTRAINT "AgencyChangeRequestApproval_changeRequestId_fkey" FOREIGN KEY ("changeRequestId") REFERENCES "AgencyChangeRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyChangeRequestApproval" ADD CONSTRAINT "AgencyChangeRequestApproval_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "AgencyChangeRequestAssessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgencyChangeRequestApproval" ADD CONSTRAINT "AgencyChangeRequestApproval_portalUserId_fkey" FOREIGN KEY ("portalUserId") REFERENCES "ClientPortalUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgencyChangeRequestApproval" ADD CONSTRAINT "AgencyChangeRequestApproval_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgencyChangeRequestDecision" ADD CONSTRAINT "AgencyChangeRequestDecision_changeRequestId_fkey" FOREIGN KEY ("changeRequestId") REFERENCES "AgencyChangeRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyChangeRequestDecision" ADD CONSTRAINT "AgencyChangeRequestDecision_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "AgencyChangeRequestAssessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgencyChangeRequestDecision" ADD CONSTRAINT "AgencyChangeRequestDecision_portalUserId_fkey" FOREIGN KEY ("portalUserId") REFERENCES "ClientPortalUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgencyChangeRequestDecision" ADD CONSTRAINT "AgencyChangeRequestDecision_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgencyChangeRequestMessage" ADD CONSTRAINT "AgencyChangeRequestMessage_changeRequestId_fkey" FOREIGN KEY ("changeRequestId") REFERENCES "AgencyChangeRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyChangeRequestMessage" ADD CONSTRAINT "AgencyChangeRequestMessage_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyChangeRequestMessage" ADD CONSTRAINT "AgencyChangeRequestMessage_actorPortalUserId_fkey" FOREIGN KEY ("actorPortalUserId") REFERENCES "ClientPortalUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyChangeRequestWorkItem" ADD CONSTRAINT "AgencyChangeRequestWorkItem_changeRequestId_fkey" FOREIGN KEY ("changeRequestId") REFERENCES "AgencyChangeRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyChangeRequestApplication" ADD CONSTRAINT "AgencyChangeRequestApplication_changeRequestId_fkey" FOREIGN KEY ("changeRequestId") REFERENCES "AgencyChangeRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyChangeRequestApplication" ADD CONSTRAINT "AgencyChangeRequestApplication_appliedById_fkey" FOREIGN KEY ("appliedById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgencyChangeRequestActivity" ADD CONSTRAINT "AgencyChangeRequestActivity_changeRequestId_fkey" FOREIGN KEY ("changeRequestId") REFERENCES "AgencyChangeRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyChangeRequestActivity" ADD CONSTRAINT "AgencyChangeRequestActivity_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyChangeRequestActivity" ADD CONSTRAINT "AgencyChangeRequestActivity_actorPortalUserId_fkey" FOREIGN KEY ("actorPortalUserId") REFERENCES "ClientPortalUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyChangeRequestFile" ADD CONSTRAINT "AgencyChangeRequestFile_changeRequestId_fkey" FOREIGN KEY ("changeRequestId") REFERENCES "AgencyChangeRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyChangeRequestFile" ADD CONSTRAINT "AgencyChangeRequestFile_projectFileId_fkey" FOREIGN KEY ("projectFileId") REFERENCES "AgencyProjectFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AgencyProjectTask" ADD CONSTRAINT "AgencyProjectTask_changeRequestId_fkey" FOREIGN KEY ("changeRequestId") REFERENCES "AgencyChangeRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyDeliverable" ADD CONSTRAINT "AgencyDeliverable_changeRequestId_fkey" FOREIGN KEY ("changeRequestId") REFERENCES "AgencyChangeRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyClientRequirement" ADD CONSTRAINT "AgencyClientRequirement_changeRequestId_fkey" FOREIGN KEY ("changeRequestId") REFERENCES "AgencyChangeRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyInvoice" ADD CONSTRAINT "AgencyInvoice_changeRequestId_fkey" FOREIGN KEY ("changeRequestId") REFERENCES "AgencyChangeRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
