-- Agency Operations V3 — Client Onboarding

-- Extend requirement status enum
ALTER TYPE "AgencyRequirementStatus" ADD VALUE IF NOT EXISTS 'SUBMITTED';
ALTER TYPE "AgencyRequirementStatus" ADD VALUE IF NOT EXISTS 'UNDER_REVIEW';
ALTER TYPE "AgencyRequirementStatus" ADD VALUE IF NOT EXISTS 'NEEDS_CLARIFICATION';

-- Extend project activity enum
ALTER TYPE "AgencyProjectActivityType" ADD VALUE IF NOT EXISTS 'ONBOARDING_STARTED';
ALTER TYPE "AgencyProjectActivityType" ADD VALUE IF NOT EXISTS 'ONBOARDING_SUBMITTED';
ALTER TYPE "AgencyProjectActivityType" ADD VALUE IF NOT EXISTS 'ONBOARDING_COMPLETED';

-- Project readiness gates
ALTER TABLE "AgencyProject" ADD COLUMN IF NOT EXISTS "requireOnboarding" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AgencyProject" ADD COLUMN IF NOT EXISTS "requireSignedContract" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AgencyProject" ADD COLUMN IF NOT EXISTS "requireDeposit" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AgencyProject" ADD COLUMN IF NOT EXISTS "requireInternalKickoff" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AgencyProject" ADD COLUMN IF NOT EXISTS "internalKickoffCompletedAt" TIMESTAMP(3);

-- Extend client requirements
ALTER TABLE "AgencyClientRequirement" ADD COLUMN IF NOT EXISTS "onboardingId" TEXT;
ALTER TABLE "AgencyClientRequirement" ADD COLUMN IF NOT EXISTS "onboardingSectionId" TEXT;
ALTER TABLE "AgencyClientRequirement" ADD COLUMN IF NOT EXISTS "sourceQuestionId" TEXT;
ALTER TABLE "AgencyClientRequirement" ADD COLUMN IF NOT EXISTS "sourceTemplateKey" TEXT;
ALTER TABLE "AgencyClientRequirement" ADD COLUMN IF NOT EXISTS "required" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "AgencyClientRequirement" ADD COLUMN IF NOT EXISTS "assignedContactId" TEXT;
ALTER TABLE "AgencyClientRequirement" ADD COLUMN IF NOT EXISTS "clientReviewNote" TEXT;
ALTER TABLE "AgencyClientRequirement" ADD COLUMN IF NOT EXISTS "internalReviewNote" TEXT;
ALTER TABLE "AgencyClientRequirement" ADD COLUMN IF NOT EXISTS "accessMetadataJson" JSONB;

CREATE TYPE "AgencyOnboardingStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'WAITING_ON_CLIENT', 'UNDER_REVIEW', 'COMPLETED', 'CANCELLED');
CREATE TYPE "AgencyOnboardingWaitingOn" AS ENUM ('CLIENT', 'AGENCY', 'NONE');
CREATE TYPE "AgencyOnboardingReminderMode" AS ENUM ('MANUAL', 'AUTOMATIC');
CREATE TYPE "AgencyOnboardingQuestionType" AS ENUM ('SHORT_TEXT', 'LONG_TEXT', 'EMAIL', 'PHONE', 'URL', 'NUMBER', 'DATE', 'SINGLE_SELECT', 'MULTI_SELECT', 'BOOLEAN', 'FILE_REQUEST');
CREATE TYPE "AgencyOnboardingReviewStatus" AS ENUM ('PENDING', 'ACCEPTED', 'NEEDS_CLARIFICATION');
CREATE TYPE "AgencyOnboardingTemplateStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
CREATE TYPE "AgencyOnboardingActivityType" AS ENUM ('ONBOARDING_CREATED', 'ONBOARDING_STARTED', 'QUESTION_ANSWERED', 'FILE_UPLOADED', 'REQUIREMENT_SUBMITTED', 'ONBOARDING_SUBMITTED', 'CLARIFICATION_REQUESTED', 'RESPONSE_ACCEPTED', 'REQUIREMENT_ACCEPTED', 'ONBOARDING_COMPLETED', 'ONBOARDING_REOPENED', 'ONBOARDING_CANCELLED', 'REMINDER_SENT');
CREATE TYPE "AgencyOnboardingReminderType" AS ENUM ('ONBOARDING', 'REQUIREMENT', 'CLARIFICATION');
CREATE TYPE "AgencyOnboardingReminderStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'CANCELLED');

CREATE TABLE "AgencyOnboardingTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "serviceType" "AgencyServiceType",
    "status" "AgencyOnboardingTemplateStatus" NOT NULL DEFAULT 'DRAFT',
    "systemKey" TEXT,
    "currentVersionId" TEXT,
    "welcomeText" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AgencyOnboardingTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyOnboardingTemplateVersion" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "welcomeText" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgencyOnboardingTemplateVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyOnboardingTemplateSection" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "clientVisible" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "AgencyOnboardingTemplateSection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyOnboardingTemplateQuestion" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "type" "AgencyOnboardingQuestionType" NOT NULL DEFAULT 'SHORT_TEXT',
    "required" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "placeholder" TEXT,
    "helpText" TEXT,
    "optionsJson" JSONB,
    "validationJson" JSONB,
    "clientVisible" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "AgencyOnboardingTemplateQuestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyOnboardingTemplateRequirement" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "sectionId" TEXT,
    "sourceKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "AgencyRequirementType" NOT NULL DEFAULT 'OTHER',
    "required" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "clientVisible" BOOLEAN NOT NULL DEFAULT true,
    "offsetDaysDue" INTEGER,
    CONSTRAINT "AgencyOnboardingTemplateRequirement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyProjectOnboarding" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "templateId" TEXT,
    "templateVersionId" TEXT,
    "status" "AgencyOnboardingStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "waitingOn" "AgencyOnboardingWaitingOn" NOT NULL DEFAULT 'NONE',
    "ownerId" TEXT,
    "primaryClientContactId" TEXT,
    "startedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "targetCompletionDate" TIMESTAMP(3),
    "clientMessage" TEXT,
    "internalNotes" TEXT,
    "reminderMode" "AgencyOnboardingReminderMode" NOT NULL DEFAULT 'MANUAL',
    "lastClientActivityAt" TIMESTAMP(3),
    "lastReminderAt" TIMESTAMP(3),
    "reminderCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AgencyProjectOnboarding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyOnboardingSection" (
    "id" TEXT NOT NULL,
    "onboardingId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "clientVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgencyOnboardingSection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyOnboardingQuestion" (
    "id" TEXT NOT NULL,
    "onboardingId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "type" "AgencyOnboardingQuestionType" NOT NULL DEFAULT 'SHORT_TEXT',
    "required" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "placeholder" TEXT,
    "helpText" TEXT,
    "optionsJson" JSONB,
    "validationJson" JSONB,
    "clientVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AgencyOnboardingQuestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyOnboardingResponse" (
    "id" TEXT NOT NULL,
    "onboardingId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "respondedByPortalUserId" TEXT,
    "contactId" TEXT,
    "valueText" TEXT,
    "valueJson" JSONB,
    "submittedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewStatus" "AgencyOnboardingReviewStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    CONSTRAINT "AgencyOnboardingResponse_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyOnboardingFileSubmission" (
    "id" TEXT NOT NULL,
    "onboardingId" TEXT NOT NULL,
    "requirementId" TEXT,
    "questionId" TEXT,
    "projectFileId" TEXT NOT NULL,
    "submittedByPortalUserId" TEXT,
    "supersededAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgencyOnboardingFileSubmission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyOnboardingActivity" (
    "id" TEXT NOT NULL,
    "onboardingId" TEXT NOT NULL,
    "type" "AgencyOnboardingActivityType" NOT NULL,
    "summary" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorPortalUserId" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "clientVisible" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgencyOnboardingActivity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyOnboardingReminder" (
    "id" TEXT NOT NULL,
    "onboardingId" TEXT NOT NULL,
    "requirementId" TEXT,
    "questionId" TEXT,
    "recipientContactId" TEXT,
    "recipientPortalUserId" TEXT,
    "type" "AgencyOnboardingReminderType" NOT NULL DEFAULT 'ONBOARDING',
    "dedupeKey" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "status" "AgencyOnboardingReminderStatus" NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgencyOnboardingReminder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AgencyOnboardingTemplate_systemKey_key" ON "AgencyOnboardingTemplate"("systemKey");
CREATE UNIQUE INDEX "AgencyOnboardingTemplateVersion_templateId_versionNumber_key" ON "AgencyOnboardingTemplateVersion"("templateId", "versionNumber");
CREATE UNIQUE INDEX "AgencyOnboardingTemplateQuestion_versionId_key_key" ON "AgencyOnboardingTemplateQuestion"("versionId", "key");
CREATE UNIQUE INDEX "AgencyOnboardingTemplateRequirement_versionId_sourceKey_key" ON "AgencyOnboardingTemplateRequirement"("versionId", "sourceKey");
CREATE UNIQUE INDEX "AgencyProjectOnboarding_active_project" ON "AgencyProjectOnboarding"("projectId") WHERE "status" NOT IN ('COMPLETED', 'CANCELLED');
CREATE UNIQUE INDEX "AgencyOnboardingQuestion_onboardingId_key_key" ON "AgencyOnboardingQuestion"("onboardingId", "key");
CREATE UNIQUE INDEX "AgencyOnboardingResponse_onboardingId_questionId_key" ON "AgencyOnboardingResponse"("onboardingId", "questionId");
CREATE UNIQUE INDEX "AgencyOnboardingReminder_dedupeKey_key" ON "AgencyOnboardingReminder"("dedupeKey");
CREATE UNIQUE INDEX "AgencyClientRequirement_onboarding_source_key" ON "AgencyClientRequirement"("onboardingId", "sourceTemplateKey") WHERE "sourceTemplateKey" IS NOT NULL;

CREATE INDEX "AgencyProjectOnboarding_status_targetCompletionDate_idx" ON "AgencyProjectOnboarding"("status", "targetCompletionDate");
CREATE INDEX "AgencyProjectOnboarding_ownerId_status_idx" ON "AgencyProjectOnboarding"("ownerId", "status");
CREATE INDEX "AgencyOnboardingQuestion_onboardingId_sectionId_position_idx" ON "AgencyOnboardingQuestion"("onboardingId", "sectionId", "position");
CREATE INDEX "AgencyOnboardingActivity_onboardingId_createdAt_idx" ON "AgencyOnboardingActivity"("onboardingId", "createdAt");
CREATE INDEX "AgencyOnboardingReminder_status_scheduledFor_idx" ON "AgencyOnboardingReminder"("status", "scheduledFor");
CREATE INDEX "AgencyClientRequirement_onboardingId_status_idx" ON "AgencyClientRequirement"("onboardingId", "status");

ALTER TABLE "AgencyOnboardingTemplate" ADD CONSTRAINT "AgencyOnboardingTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgencyOnboardingTemplateVersion" ADD CONSTRAINT "AgencyOnboardingTemplateVersion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "AgencyOnboardingTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyOnboardingTemplateVersion" ADD CONSTRAINT "AgencyOnboardingTemplateVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgencyOnboardingTemplateSection" ADD CONSTRAINT "AgencyOnboardingTemplateSection_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "AgencyOnboardingTemplateVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyOnboardingTemplateQuestion" ADD CONSTRAINT "AgencyOnboardingTemplateQuestion_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "AgencyOnboardingTemplateVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyOnboardingTemplateQuestion" ADD CONSTRAINT "AgencyOnboardingTemplateQuestion_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "AgencyOnboardingTemplateSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyOnboardingTemplateRequirement" ADD CONSTRAINT "AgencyOnboardingTemplateRequirement_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "AgencyOnboardingTemplateVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyOnboardingTemplateRequirement" ADD CONSTRAINT "AgencyOnboardingTemplateRequirement_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "AgencyOnboardingTemplateSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AgencyProjectOnboarding" ADD CONSTRAINT "AgencyProjectOnboarding_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "AgencyProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyProjectOnboarding" ADD CONSTRAINT "AgencyProjectOnboarding_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "AgencyOnboardingTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyProjectOnboarding" ADD CONSTRAINT "AgencyProjectOnboarding_templateVersionId_fkey" FOREIGN KEY ("templateVersionId") REFERENCES "AgencyOnboardingTemplateVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyProjectOnboarding" ADD CONSTRAINT "AgencyProjectOnboarding_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyProjectOnboarding" ADD CONSTRAINT "AgencyProjectOnboarding_primaryClientContactId_fkey" FOREIGN KEY ("primaryClientContactId") REFERENCES "CrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyProjectOnboarding" ADD CONSTRAINT "AgencyProjectOnboarding_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AgencyOnboardingSection" ADD CONSTRAINT "AgencyOnboardingSection_onboardingId_fkey" FOREIGN KEY ("onboardingId") REFERENCES "AgencyProjectOnboarding"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyOnboardingQuestion" ADD CONSTRAINT "AgencyOnboardingQuestion_onboardingId_fkey" FOREIGN KEY ("onboardingId") REFERENCES "AgencyProjectOnboarding"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyOnboardingQuestion" ADD CONSTRAINT "AgencyOnboardingQuestion_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "AgencyOnboardingSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyOnboardingResponse" ADD CONSTRAINT "AgencyOnboardingResponse_onboardingId_fkey" FOREIGN KEY ("onboardingId") REFERENCES "AgencyProjectOnboarding"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyOnboardingResponse" ADD CONSTRAINT "AgencyOnboardingResponse_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "AgencyOnboardingQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyOnboardingResponse" ADD CONSTRAINT "AgencyOnboardingResponse_respondedByPortalUserId_fkey" FOREIGN KEY ("respondedByPortalUserId") REFERENCES "ClientPortalUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyOnboardingResponse" ADD CONSTRAINT "AgencyOnboardingResponse_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyOnboardingResponse" ADD CONSTRAINT "AgencyOnboardingResponse_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AgencyOnboardingFileSubmission" ADD CONSTRAINT "AgencyOnboardingFileSubmission_onboardingId_fkey" FOREIGN KEY ("onboardingId") REFERENCES "AgencyProjectOnboarding"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyOnboardingFileSubmission" ADD CONSTRAINT "AgencyOnboardingFileSubmission_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "AgencyClientRequirement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyOnboardingFileSubmission" ADD CONSTRAINT "AgencyOnboardingFileSubmission_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "AgencyOnboardingQuestion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyOnboardingFileSubmission" ADD CONSTRAINT "AgencyOnboardingFileSubmission_projectFileId_fkey" FOREIGN KEY ("projectFileId") REFERENCES "AgencyProjectFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgencyOnboardingFileSubmission" ADD CONSTRAINT "AgencyOnboardingFileSubmission_submittedByPortalUserId_fkey" FOREIGN KEY ("submittedByPortalUserId") REFERENCES "ClientPortalUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AgencyOnboardingActivity" ADD CONSTRAINT "AgencyOnboardingActivity_onboardingId_fkey" FOREIGN KEY ("onboardingId") REFERENCES "AgencyProjectOnboarding"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyOnboardingActivity" ADD CONSTRAINT "AgencyOnboardingActivity_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyOnboardingActivity" ADD CONSTRAINT "AgencyOnboardingActivity_actorPortalUserId_fkey" FOREIGN KEY ("actorPortalUserId") REFERENCES "ClientPortalUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AgencyOnboardingReminder" ADD CONSTRAINT "AgencyOnboardingReminder_onboardingId_fkey" FOREIGN KEY ("onboardingId") REFERENCES "AgencyProjectOnboarding"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyOnboardingReminder" ADD CONSTRAINT "AgencyOnboardingReminder_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "AgencyClientRequirement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyOnboardingReminder" ADD CONSTRAINT "AgencyOnboardingReminder_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "AgencyOnboardingQuestion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AgencyClientRequirement" ADD CONSTRAINT "AgencyClientRequirement_onboardingId_fkey" FOREIGN KEY ("onboardingId") REFERENCES "AgencyProjectOnboarding"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyClientRequirement" ADD CONSTRAINT "AgencyClientRequirement_onboardingSectionId_fkey" FOREIGN KEY ("onboardingSectionId") REFERENCES "AgencyOnboardingSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyClientRequirement" ADD CONSTRAINT "AgencyClientRequirement_assignedContactId_fkey" FOREIGN KEY ("assignedContactId") REFERENCES "CrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
