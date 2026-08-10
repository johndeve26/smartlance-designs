-- Prospect Experience V1

-- AlterEnum
ALTER TYPE "CrmContactSource" ADD VALUE 'PROSPECT_WORKSPACE';

-- AlterTable
ALTER TABLE "AgencyProposal" ADD COLUMN "sourceProspectRequestId" TEXT;

-- CreateEnum
CREATE TYPE "AgencyWebsiteReviewStatus" AS ENUM ('PENDING', 'FETCHING', 'ANALYZING', 'COMPLETED', 'FAILED');
CREATE TYPE "AgencyWebsiteReviewOverallDirection" AS ENUM ('STRONG_FOUNDATION', 'FOCUSED_IMPROVEMENTS', 'SIGNIFICANT_OPPORTUNITY', 'INSUFFICIENT_DATA');
CREATE TYPE "AgencyWebsiteReviewFindingSeverity" AS ENUM ('HIGH', 'MEDIUM', 'LOW');
CREATE TYPE "AgencyWebsiteReviewFindingConfidence" AS ENUM ('HIGH', 'MEDIUM', 'LOW');
CREATE TYPE "AgencyWebsiteBriefStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'ARCHIVED');
CREATE TYPE "AgencyProspectRequestStatus" AS ENUM ('SUBMITTED', 'BEING_REVIEWED', 'NEEDS_INFORMATION', 'PROPOSAL_READY', 'CLOSED');
CREATE TYPE "AgencyProspectRequestSourceDetail" AS ENUM ('FREE_WEBSITE_REVIEW', 'WEBSITE_BRIEF', 'PROSPECT_WORKSPACE');
CREATE TYPE "AgencyProspectRequestMessageAuthorType" AS ENUM ('PORTAL_USER', 'SMARTLANCE');
CREATE TYPE "AgencyProspectRequestActivityType" AS ENUM ('REQUEST_SUBMITTED', 'INFORMATION_REQUESTED', 'PROSPECT_RESPONDED', 'STATUS_CHANGED', 'PROPOSAL_READY');

-- CreateTable
CREATE TABLE "AgencyProspectProfile" (
    "id" TEXT NOT NULL,
    "portalUserId" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "companyName" TEXT,
    "phone" TEXT,
    "primaryWebsite" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencyProspectProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyWebsiteReview" (
    "id" TEXT NOT NULL,
    "portalUserId" TEXT,
    "claimTokenHash" TEXT,
    "claimTokenUsedAt" TIMESTAMP(3),
    "websiteUrl" TEXT NOT NULL,
    "normalizedDomain" TEXT NOT NULL,
    "businessName" TEXT,
    "goalJson" JSONB,
    "status" "AgencyWebsiteReviewStatus" NOT NULL DEFAULT 'PENDING',
    "overallDirection" "AgencyWebsiteReviewOverallDirection",
    "summary" TEXT,
    "aiFailedMessage" TEXT,
    "promptVersion" TEXT,
    "modelMetadataSafe" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencyWebsiteReview_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyWebsiteReviewPage" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "statusCode" INTEGER,
    "contentHash" TEXT,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgencyWebsiteReviewPage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyWebsiteReviewEvidence" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "pageId" TEXT,
    "category" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "valueText" TEXT,
    "valueNumber" DOUBLE PRECISION,
    "booleanValue" BOOLEAN,
    "sourceUrl" TEXT,
    "sourceSelector" TEXT,
    "excerpt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgencyWebsiteReviewEvidence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyWebsiteReviewFinding" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" "AgencyWebsiteReviewFindingSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "recommendation" TEXT,
    "confidence" "AgencyWebsiteReviewFindingConfidence" NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isPriority" BOOLEAN NOT NULL DEFAULT false,
    "isStrength" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgencyWebsiteReviewFinding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyWebsiteReviewFindingEvidence" (
    "findingId" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,

    CONSTRAINT "AgencyWebsiteReviewFindingEvidence_pkey" PRIMARY KEY ("findingId","evidenceId")
);

CREATE TABLE "AgencyWebsiteBrief" (
    "id" TEXT NOT NULL,
    "portalUserId" TEXT,
    "claimTokenHash" TEXT,
    "claimTokenUsedAt" TIMESTAMP(3),
    "title" TEXT NOT NULL DEFAULT 'Website Project Brief',
    "projectType" TEXT,
    "status" "AgencyWebsiteBriefStatus" NOT NULL DEFAULT 'DRAFT',
    "sourceReviewId" TEXT,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "answersJson" JSONB NOT NULL DEFAULT '{}',
    "completionPercent" INTEGER NOT NULL DEFAULT 0,
    "completedSectionIds" JSONB NOT NULL DEFAULT '[]',
    "submittedSnapshotJson" JSONB,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencyWebsiteBrief_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyProspectRequestCounter" (
    "year" INTEGER NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencyProspectRequestCounter_pkey" PRIMARY KEY ("year")
);

CREATE TABLE "AgencyProspectRequest" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "portalUserId" TEXT NOT NULL,
    "prospectProfileId" TEXT,
    "contactId" TEXT,
    "briefId" TEXT,
    "reviewId" TEXT,
    "status" "AgencyProspectRequestStatus" NOT NULL DEFAULT 'SUBMITTED',
    "title" TEXT NOT NULL,
    "projectType" TEXT,
    "sourceDetail" "AgencyProspectRequestSourceDetail" NOT NULL,
    "submissionIdempotencyKey" TEXT NOT NULL,
    "briefSnapshotJson" JSONB NOT NULL,
    "reviewSnapshotJson" JSONB,
    "contactSnapshotJson" JSONB,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "AgencyProspectRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyProspectRequestMessage" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "authorType" "AgencyProspectRequestMessageAuthorType" NOT NULL,
    "portalUserId" TEXT,
    "adminUserId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgencyProspectRequestMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyProspectRequestActivity" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "type" "AgencyProspectRequestActivityType" NOT NULL,
    "summary" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgencyProspectRequestActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AgencyProspectProfile_portalUserId_key" ON "AgencyProspectProfile"("portalUserId");
CREATE INDEX "AgencyProspectProfile_updatedAt_idx" ON "AgencyProspectProfile"("updatedAt");

CREATE UNIQUE INDEX "AgencyWebsiteReview_claimTokenHash_key" ON "AgencyWebsiteReview"("claimTokenHash");
CREATE INDEX "AgencyWebsiteReview_portalUserId_createdAt_idx" ON "AgencyWebsiteReview"("portalUserId", "createdAt");
CREATE INDEX "AgencyWebsiteReview_normalizedDomain_createdAt_idx" ON "AgencyWebsiteReview"("normalizedDomain", "createdAt");
CREATE INDEX "AgencyWebsiteReview_status_idx" ON "AgencyWebsiteReview"("status");

CREATE INDEX "AgencyWebsiteReviewPage_reviewId_idx" ON "AgencyWebsiteReviewPage"("reviewId");
CREATE INDEX "AgencyWebsiteReviewEvidence_reviewId_category_idx" ON "AgencyWebsiteReviewEvidence"("reviewId", "category");
CREATE INDEX "AgencyWebsiteReviewFinding_reviewId_position_idx" ON "AgencyWebsiteReviewFinding"("reviewId", "position");
CREATE INDEX "AgencyWebsiteReviewFindingEvidence_evidenceId_idx" ON "AgencyWebsiteReviewFindingEvidence"("evidenceId");

CREATE UNIQUE INDEX "AgencyWebsiteBrief_claimTokenHash_key" ON "AgencyWebsiteBrief"("claimTokenHash");
CREATE INDEX "AgencyWebsiteBrief_portalUserId_updatedAt_idx" ON "AgencyWebsiteBrief"("portalUserId", "updatedAt");
CREATE INDEX "AgencyWebsiteBrief_portalUserId_status_idx" ON "AgencyWebsiteBrief"("portalUserId", "status");

CREATE UNIQUE INDEX "AgencyProspectRequest_requestNumber_key" ON "AgencyProspectRequest"("requestNumber");
CREATE UNIQUE INDEX "AgencyProspectRequest_submissionIdempotencyKey_key" ON "AgencyProspectRequest"("submissionIdempotencyKey");
CREATE INDEX "AgencyProspectRequest_portalUserId_status_idx" ON "AgencyProspectRequest"("portalUserId", "status");
CREATE INDEX "AgencyProspectRequest_portalUserId_submittedAt_idx" ON "AgencyProspectRequest"("portalUserId", "submittedAt");
CREATE INDEX "AgencyProspectRequest_contactId_idx" ON "AgencyProspectRequest"("contactId");

CREATE INDEX "AgencyProspectRequestMessage_requestId_createdAt_idx" ON "AgencyProspectRequestMessage"("requestId", "createdAt");
CREATE INDEX "AgencyProspectRequestActivity_requestId_createdAt_idx" ON "AgencyProspectRequestActivity"("requestId", "createdAt");

CREATE UNIQUE INDEX "AgencyProposal_sourceProspectRequestId_key" ON "AgencyProposal"("sourceProspectRequestId");

-- AddForeignKey
ALTER TABLE "AgencyProposal" ADD CONSTRAINT "AgencyProposal_sourceProspectRequestId_fkey" FOREIGN KEY ("sourceProspectRequestId") REFERENCES "AgencyProspectRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AgencyProspectProfile" ADD CONSTRAINT "AgencyProspectProfile_portalUserId_fkey" FOREIGN KEY ("portalUserId") REFERENCES "ClientPortalUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AgencyWebsiteReview" ADD CONSTRAINT "AgencyWebsiteReview_portalUserId_fkey" FOREIGN KEY ("portalUserId") REFERENCES "ClientPortalUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AgencyWebsiteReviewPage" ADD CONSTRAINT "AgencyWebsiteReviewPage_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "AgencyWebsiteReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AgencyWebsiteReviewEvidence" ADD CONSTRAINT "AgencyWebsiteReviewEvidence_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "AgencyWebsiteReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyWebsiteReviewEvidence" ADD CONSTRAINT "AgencyWebsiteReviewEvidence_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "AgencyWebsiteReviewPage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AgencyWebsiteReviewFinding" ADD CONSTRAINT "AgencyWebsiteReviewFinding_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "AgencyWebsiteReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AgencyWebsiteReviewFindingEvidence" ADD CONSTRAINT "AgencyWebsiteReviewFindingEvidence_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "AgencyWebsiteReviewFinding"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyWebsiteReviewFindingEvidence" ADD CONSTRAINT "AgencyWebsiteReviewFindingEvidence_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "AgencyWebsiteReviewEvidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AgencyWebsiteBrief" ADD CONSTRAINT "AgencyWebsiteBrief_portalUserId_fkey" FOREIGN KEY ("portalUserId") REFERENCES "ClientPortalUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyWebsiteBrief" ADD CONSTRAINT "AgencyWebsiteBrief_sourceReviewId_fkey" FOREIGN KEY ("sourceReviewId") REFERENCES "AgencyWebsiteReview"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AgencyProspectRequest" ADD CONSTRAINT "AgencyProspectRequest_portalUserId_fkey" FOREIGN KEY ("portalUserId") REFERENCES "ClientPortalUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyProspectRequest" ADD CONSTRAINT "AgencyProspectRequest_prospectProfileId_fkey" FOREIGN KEY ("prospectProfileId") REFERENCES "AgencyProspectProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyProspectRequest" ADD CONSTRAINT "AgencyProspectRequest_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyProspectRequest" ADD CONSTRAINT "AgencyProspectRequest_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "AgencyWebsiteBrief"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyProspectRequest" ADD CONSTRAINT "AgencyProspectRequest_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "AgencyWebsiteReview"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AgencyProspectRequestMessage" ADD CONSTRAINT "AgencyProspectRequestMessage_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "AgencyProspectRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyProspectRequestMessage" ADD CONSTRAINT "AgencyProspectRequestMessage_portalUserId_fkey" FOREIGN KEY ("portalUserId") REFERENCES "ClientPortalUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyProspectRequestMessage" ADD CONSTRAINT "AgencyProspectRequestMessage_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AgencyProspectRequestActivity" ADD CONSTRAINT "AgencyProspectRequestActivity_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "AgencyProspectRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
