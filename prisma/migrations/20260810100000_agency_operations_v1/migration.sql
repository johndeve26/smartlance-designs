-- Agency Operations V1 — Projects & Client Delivery

CREATE TYPE "AgencyProjectStatus" AS ENUM ('PLANNING', 'ONBOARDING', 'IN_PROGRESS', 'CLIENT_REVIEW', 'ON_HOLD', 'COMPLETED', 'CANCELLED');
CREATE TYPE "AgencyProjectHealth" AS ENUM ('ON_TRACK', 'AT_RISK', 'BLOCKED');
CREATE TYPE "AgencyServiceType" AS ENUM ('WEBSITE_DESIGN', 'WEBSITE_REDESIGN', 'LANDING_PAGE', 'ECOMMERCE', 'SEO', 'BRANDING', 'WEBSITE_MAINTENANCE', 'DIGITAL_STRATEGY', 'OTHER');
CREATE TYPE "AgencyProjectMemberRole" AS ENUM ('OWNER', 'MEMBER', 'VIEWER');
CREATE TYPE "AgencyMilestoneStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'CLIENT_REVIEW', 'COMPLETED');
CREATE TYPE "AgencyProjectTaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'BLOCKED', 'REVIEW', 'DONE');
CREATE TYPE "AgencyProjectTaskPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
CREATE TYPE "AgencyRequirementType" AS ENUM ('CONTENT', 'BRAND_ASSET', 'ACCESS', 'APPROVAL', 'INFORMATION', 'OTHER');
CREATE TYPE "AgencyRequirementStatus" AS ENUM ('REQUESTED', 'RECEIVED', 'ACCEPTED', 'NOT_NEEDED');
CREATE TYPE "AgencyDeliverableType" AS ENUM ('DESIGN', 'DOCUMENT', 'WEBSITE_PREVIEW', 'COPY', 'REPORT', 'BRAND_ASSET', 'OTHER');
CREATE TYPE "AgencyDeliverableStatus" AS ENUM ('DRAFT', 'READY_FOR_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'ARCHIVED');
CREATE TYPE "AgencyDeliverableReviewDecision" AS ENUM ('APPROVED', 'CHANGES_REQUESTED');
CREATE TYPE "AgencyProjectActivityType" AS ENUM ('PROJECT_CREATED', 'STATUS_CHANGED', 'HEALTH_CHANGED', 'MILESTONE_COMPLETED', 'TASK_COMPLETED', 'DELIVERABLE_SUBMITTED', 'DELIVERABLE_APPROVED', 'DELIVERABLE_CHANGES_REQUESTED', 'REQUIREMENT_RECEIVED', 'UPDATE_POSTED', 'MEMBER_ADDED', 'CLIENT_ACCESS_GRANTED');
CREATE TYPE "AgencyCommentVisibility" AS ENUM ('CLIENT', 'INTERNAL');
CREATE TYPE "ClientPortalUserStatus" AS ENUM ('INVITED', 'ACTIVE', 'DISABLED');
CREATE TYPE "ClientPortalInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');
CREATE TYPE "AgencyProjectClientRole" AS ENUM ('CLIENT_ADMIN', 'CLIENT_MEMBER', 'VIEWER');

CREATE TABLE "AgencyProjectCounter" (
    "year" INTEGER NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "AgencyProjectCounter_pkey" PRIMARY KEY ("year")
);

CREATE TABLE "AgencyProject" (
    "id" TEXT NOT NULL,
    "projectNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "clientCompanyId" TEXT,
    "primaryContactId" TEXT NOT NULL,
    "sourceDealId" TEXT,
    "serviceType" "AgencyServiceType" NOT NULL,
    "customServiceName" TEXT,
    "cmsServiceSlug" TEXT,
    "status" "AgencyProjectStatus" NOT NULL DEFAULT 'PLANNING',
    "health" "AgencyProjectHealth" NOT NULL DEFAULT 'ON_TRACK',
    "ownerId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "targetDueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "budgetSnapshot" DECIMAL(12,2),
    "currency" TEXT DEFAULT 'USD',
    "summary" TEXT,
    "internalNotes" TEXT,
    "clientVisibilityEnabled" BOOLEAN NOT NULL DEFAULT true,
    "caseStudyCandidate" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AgencyProject_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyProjectMember" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "AgencyProjectMemberRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgencyProjectMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyProjectTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "serviceType" "AgencyServiceType" NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AgencyProjectTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyProjectTemplateMilestone" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL,
    "offsetDaysStart" INTEGER,
    "offsetDaysDue" INTEGER,
    "clientVisible" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "AgencyProjectTemplateMilestone_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyProjectTemplateTask" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "milestoneId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL,
    "priority" "AgencyProjectTaskPriority" NOT NULL DEFAULT 'NORMAL',
    "offsetDaysDue" INTEGER,
    "clientVisible" BOOLEAN NOT NULL DEFAULT false,
    "defaultRole" "AgencyProjectMemberRole",
    CONSTRAINT "AgencyProjectTemplateTask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyProjectTemplateRequirement" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "AgencyRequirementType" NOT NULL DEFAULT 'OTHER',
    "offsetDaysDue" INTEGER,
    "clientVisible" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "AgencyProjectTemplateRequirement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyProjectMilestone" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "AgencyMilestoneStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "position" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "clientVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AgencyProjectMilestone_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyProjectTask" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "milestoneId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "AgencyProjectTaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" "AgencyProjectTaskPriority" NOT NULL DEFAULT 'NORMAL',
    "assigneeId" TEXT,
    "createdById" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "clientVisible" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "blockedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AgencyProjectTask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyClientRequirement" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "milestoneId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "AgencyRequirementType" NOT NULL DEFAULT 'OTHER',
    "status" "AgencyRequirementStatus" NOT NULL DEFAULT 'REQUESTED',
    "dueDate" TIMESTAMP(3),
    "clientVisible" BOOLEAN NOT NULL DEFAULT true,
    "fulfilledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AgencyClientRequirement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyDeliverable" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "milestoneId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "AgencyDeliverableType" NOT NULL DEFAULT 'OTHER',
    "status" "AgencyDeliverableStatus" NOT NULL DEFAULT 'DRAFT',
    "clientVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AgencyDeliverable_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyDeliverableVersion" (
    "id" TEXT NOT NULL,
    "deliverableId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "externalUrl" TEXT,
    "notes" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgencyDeliverableVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyDeliverableReview" (
    "id" TEXT NOT NULL,
    "deliverableId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "reviewerContactId" TEXT,
    "reviewerPortalUserId" TEXT,
    "decision" "AgencyDeliverableReviewDecision" NOT NULL,
    "comment" TEXT,
    "isAdminOverride" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgencyDeliverableReview_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyProjectActivity" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "AgencyProjectActivityType" NOT NULL,
    "summary" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorPortalUserId" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "clientVisible" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgencyProjectActivity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyProjectUpdate" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "clientVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgencyProjectUpdate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyProjectNote" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgencyProjectNote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyProjectFile" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "versionId" TEXT,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "storageProvider" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgencyProjectFile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClientPortalUser" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "ClientPortalUserStatus" NOT NULL DEFAULT 'INVITED',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ClientPortalUser_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClientPortalInvite" (
    "id" TEXT NOT NULL,
    "portalUserId" TEXT NOT NULL,
    "projectId" TEXT,
    "tokenHash" TEXT NOT NULL,
    "status" "ClientPortalInviteStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClientPortalInvite_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClientPortalSession" (
    "id" TEXT NOT NULL,
    "portalUserId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    CONSTRAINT "ClientPortalSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyProjectClientAccess" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "portalUserId" TEXT,
    "role" "AgencyProjectClientRole" NOT NULL DEFAULT 'CLIENT_MEMBER',
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "grantedById" TEXT NOT NULL,
    CONSTRAINT "AgencyProjectClientAccess_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AgencyProject_projectNumber_key" ON "AgencyProject"("projectNumber");
CREATE UNIQUE INDEX "AgencyProject_sourceDealId_key" ON "AgencyProject"("sourceDealId");
CREATE INDEX "AgencyProject_status_targetDueDate_idx" ON "AgencyProject"("status", "targetDueDate");
CREATE INDEX "AgencyProject_ownerId_status_idx" ON "AgencyProject"("ownerId", "status");
CREATE INDEX "AgencyProject_clientCompanyId_idx" ON "AgencyProject"("clientCompanyId");
CREATE INDEX "AgencyProject_primaryContactId_idx" ON "AgencyProject"("primaryContactId");
CREATE INDEX "AgencyProject_createdAt_idx" ON "AgencyProject"("createdAt");

CREATE UNIQUE INDEX "AgencyProjectMember_projectId_userId_key" ON "AgencyProjectMember"("projectId", "userId");
CREATE INDEX "AgencyProjectMember_userId_idx" ON "AgencyProjectMember"("userId");

CREATE INDEX "AgencyProjectTemplate_isArchived_serviceType_idx" ON "AgencyProjectTemplate"("isArchived", "serviceType");
CREATE INDEX "AgencyProjectTemplateMilestone_templateId_position_idx" ON "AgencyProjectTemplateMilestone"("templateId", "position");
CREATE INDEX "AgencyProjectTemplateTask_templateId_position_idx" ON "AgencyProjectTemplateTask"("templateId", "position");
CREATE INDEX "AgencyProjectTemplateRequirement_templateId_idx" ON "AgencyProjectTemplateRequirement"("templateId");

CREATE INDEX "AgencyProjectMilestone_projectId_position_idx" ON "AgencyProjectMilestone"("projectId", "position");
CREATE INDEX "AgencyProjectMilestone_projectId_status_idx" ON "AgencyProjectMilestone"("projectId", "status");

CREATE INDEX "AgencyProjectTask_projectId_status_idx" ON "AgencyProjectTask"("projectId", "status");
CREATE INDEX "AgencyProjectTask_assigneeId_status_dueDate_idx" ON "AgencyProjectTask"("assigneeId", "status", "dueDate");
CREATE INDEX "AgencyProjectTask_projectId_position_idx" ON "AgencyProjectTask"("projectId", "position");

CREATE INDEX "AgencyClientRequirement_projectId_status_idx" ON "AgencyClientRequirement"("projectId", "status");
CREATE INDEX "AgencyDeliverable_projectId_status_idx" ON "AgencyDeliverable"("projectId", "status");

CREATE UNIQUE INDEX "AgencyDeliverableVersion_deliverableId_versionNumber_key" ON "AgencyDeliverableVersion"("deliverableId", "versionNumber");
CREATE INDEX "AgencyDeliverableVersion_deliverableId_idx" ON "AgencyDeliverableVersion"("deliverableId");

CREATE INDEX "AgencyDeliverableReview_deliverableId_createdAt_idx" ON "AgencyDeliverableReview"("deliverableId", "createdAt");
CREATE INDEX "AgencyProjectActivity_projectId_createdAt_idx" ON "AgencyProjectActivity"("projectId", "createdAt");
CREATE INDEX "AgencyProjectUpdate_projectId_createdAt_idx" ON "AgencyProjectUpdate"("projectId", "createdAt");
CREATE INDEX "AgencyProjectNote_projectId_createdAt_idx" ON "AgencyProjectNote"("projectId", "createdAt");

CREATE UNIQUE INDEX "AgencyProjectFile_versionId_key" ON "AgencyProjectFile"("versionId");
CREATE UNIQUE INDEX "AgencyProjectFile_storageKey_key" ON "AgencyProjectFile"("storageKey");
CREATE INDEX "AgencyProjectFile_projectId_idx" ON "AgencyProjectFile"("projectId");

CREATE UNIQUE INDEX "ClientPortalUser_contactId_key" ON "ClientPortalUser"("contactId");
CREATE INDEX "ClientPortalUser_email_idx" ON "ClientPortalUser"("email");
CREATE INDEX "ClientPortalUser_status_idx" ON "ClientPortalUser"("status");

CREATE UNIQUE INDEX "ClientPortalInvite_tokenHash_key" ON "ClientPortalInvite"("tokenHash");
CREATE INDEX "ClientPortalInvite_portalUserId_status_idx" ON "ClientPortalInvite"("portalUserId", "status");
CREATE INDEX "ClientPortalInvite_expiresAt_idx" ON "ClientPortalInvite"("expiresAt");

CREATE UNIQUE INDEX "ClientPortalSession_tokenHash_key" ON "ClientPortalSession"("tokenHash");
CREATE INDEX "ClientPortalSession_portalUserId_idx" ON "ClientPortalSession"("portalUserId");
CREATE INDEX "ClientPortalSession_expiresAt_idx" ON "ClientPortalSession"("expiresAt");

CREATE UNIQUE INDEX "AgencyProjectClientAccess_projectId_contactId_key" ON "AgencyProjectClientAccess"("projectId", "contactId");
CREATE INDEX "AgencyProjectClientAccess_portalUserId_projectId_idx" ON "AgencyProjectClientAccess"("portalUserId", "projectId");
CREATE INDEX "AgencyProjectClientAccess_contactId_idx" ON "AgencyProjectClientAccess"("contactId");

ALTER TABLE "AgencyProject" ADD CONSTRAINT "AgencyProject_clientCompanyId_fkey" FOREIGN KEY ("clientCompanyId") REFERENCES "CrmCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyProject" ADD CONSTRAINT "AgencyProject_primaryContactId_fkey" FOREIGN KEY ("primaryContactId") REFERENCES "CrmContact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgencyProject" ADD CONSTRAINT "AgencyProject_sourceDealId_fkey" FOREIGN KEY ("sourceDealId") REFERENCES "CrmDeal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyProject" ADD CONSTRAINT "AgencyProject_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgencyProject" ADD CONSTRAINT "AgencyProject_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AgencyProjectMember" ADD CONSTRAINT "AgencyProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "AgencyProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyProjectMember" ADD CONSTRAINT "AgencyProjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AgencyProjectTemplate" ADD CONSTRAINT "AgencyProjectTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgencyProjectTemplate" ADD CONSTRAINT "AgencyProjectTemplate_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AgencyProjectTemplateMilestone" ADD CONSTRAINT "AgencyProjectTemplateMilestone_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "AgencyProjectTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyProjectTemplateTask" ADD CONSTRAINT "AgencyProjectTemplateTask_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "AgencyProjectTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyProjectTemplateTask" ADD CONSTRAINT "AgencyProjectTemplateTask_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "AgencyProjectTemplateMilestone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyProjectTemplateRequirement" ADD CONSTRAINT "AgencyProjectTemplateRequirement_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "AgencyProjectTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AgencyProjectMilestone" ADD CONSTRAINT "AgencyProjectMilestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "AgencyProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyProjectTask" ADD CONSTRAINT "AgencyProjectTask_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "AgencyProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyProjectTask" ADD CONSTRAINT "AgencyProjectTask_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "AgencyProjectMilestone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyProjectTask" ADD CONSTRAINT "AgencyProjectTask_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyProjectTask" ADD CONSTRAINT "AgencyProjectTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AgencyClientRequirement" ADD CONSTRAINT "AgencyClientRequirement_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "AgencyProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyClientRequirement" ADD CONSTRAINT "AgencyClientRequirement_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "AgencyProjectMilestone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AgencyDeliverable" ADD CONSTRAINT "AgencyDeliverable_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "AgencyProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyDeliverable" ADD CONSTRAINT "AgencyDeliverable_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "AgencyProjectMilestone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyDeliverable" ADD CONSTRAINT "AgencyDeliverable_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AgencyDeliverableVersion" ADD CONSTRAINT "AgencyDeliverableVersion_deliverableId_fkey" FOREIGN KEY ("deliverableId") REFERENCES "AgencyDeliverable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyDeliverableVersion" ADD CONSTRAINT "AgencyDeliverableVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AgencyDeliverableReview" ADD CONSTRAINT "AgencyDeliverableReview_deliverableId_fkey" FOREIGN KEY ("deliverableId") REFERENCES "AgencyDeliverable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyDeliverableReview" ADD CONSTRAINT "AgencyDeliverableReview_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "AgencyDeliverableVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyDeliverableReview" ADD CONSTRAINT "AgencyDeliverableReview_reviewerContactId_fkey" FOREIGN KEY ("reviewerContactId") REFERENCES "CrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyDeliverableReview" ADD CONSTRAINT "AgencyDeliverableReview_reviewerPortalUserId_fkey" FOREIGN KEY ("reviewerPortalUserId") REFERENCES "ClientPortalUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AgencyProjectActivity" ADD CONSTRAINT "AgencyProjectActivity_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "AgencyProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyProjectActivity" ADD CONSTRAINT "AgencyProjectActivity_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyProjectActivity" ADD CONSTRAINT "AgencyProjectActivity_actorPortalUserId_fkey" FOREIGN KEY ("actorPortalUserId") REFERENCES "ClientPortalUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AgencyProjectUpdate" ADD CONSTRAINT "AgencyProjectUpdate_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "AgencyProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyProjectUpdate" ADD CONSTRAINT "AgencyProjectUpdate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AgencyProjectNote" ADD CONSTRAINT "AgencyProjectNote_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "AgencyProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyProjectNote" ADD CONSTRAINT "AgencyProjectNote_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AgencyProjectFile" ADD CONSTRAINT "AgencyProjectFile_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "AgencyProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyProjectFile" ADD CONSTRAINT "AgencyProjectFile_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "AgencyDeliverableVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyProjectFile" ADD CONSTRAINT "AgencyProjectFile_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ClientPortalUser" ADD CONSTRAINT "ClientPortalUser_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClientPortalInvite" ADD CONSTRAINT "ClientPortalInvite_portalUserId_fkey" FOREIGN KEY ("portalUserId") REFERENCES "ClientPortalUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClientPortalInvite" ADD CONSTRAINT "ClientPortalInvite_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "AgencyProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ClientPortalInvite" ADD CONSTRAINT "ClientPortalInvite_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ClientPortalSession" ADD CONSTRAINT "ClientPortalSession_portalUserId_fkey" FOREIGN KEY ("portalUserId") REFERENCES "ClientPortalUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AgencyProjectClientAccess" ADD CONSTRAINT "AgencyProjectClientAccess_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "AgencyProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyProjectClientAccess" ADD CONSTRAINT "AgencyProjectClientAccess_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyProjectClientAccess" ADD CONSTRAINT "AgencyProjectClientAccess_portalUserId_fkey" FOREIGN KEY ("portalUserId") REFERENCES "ClientPortalUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyProjectClientAccess" ADD CONSTRAINT "AgencyProjectClientAccess_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
