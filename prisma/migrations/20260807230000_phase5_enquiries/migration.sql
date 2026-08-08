-- Phase 5: Enquiry operations (Contact + Free Website Review)

CREATE TYPE "EnquiryType" AS ENUM ('CONTACT', 'WEBSITE_REVIEW');
CREATE TYPE "EnquiryStatus" AS ENUM ('NEW', 'REVIEWING', 'REPLIED', 'QUALIFIED', 'CLOSED', 'SPAM');
CREATE TYPE "NotificationStatus" AS ENUM ('NOT_ATTEMPTED', 'SENT', 'FAILED');

CREATE TABLE "Enquiry" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "type" "EnquiryType" NOT NULL,
    "status" "EnquiryStatus" NOT NULL DEFAULT 'NEW',
    "name" TEXT,
    "email" TEXT,
    "company" TEXT,
    "websiteUrl" TEXT,
    "service" TEXT,
    "projectDetails" TEXT,
    "budget" TEXT,
    "timeline" TEXT,
    "referralSource" TEXT,
    "mainConcern" TEXT,
    "sourcePath" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "statusChangedAt" TIMESTAMP(3),
    "notificationStatus" "NotificationStatus" NOT NULL DEFAULT 'NOT_ATTEMPTED',
    "notificationAttemptedAt" TIMESTAMP(3),
    "notificationProviderId" TEXT,
    "notificationErrorCode" TEXT,
    "lastNotificationError" TEXT,
    "anonymizedAt" TIMESTAMP(3),
    "isAnonymized" BOOLEAN NOT NULL DEFAULT false,
    "updatedById" TEXT,

    CONSTRAINT "Enquiry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Enquiry_reference_key" ON "Enquiry"("reference");
CREATE INDEX "Enquiry_type_status_submittedAt_idx" ON "Enquiry"("type", "status", "submittedAt");
CREATE INDEX "Enquiry_status_submittedAt_idx" ON "Enquiry"("status", "submittedAt");
CREATE INDEX "Enquiry_submittedAt_idx" ON "Enquiry"("submittedAt");
CREATE INDEX "Enquiry_email_idx" ON "Enquiry"("email");
CREATE INDEX "Enquiry_notificationStatus_idx" ON "Enquiry"("notificationStatus");
CREATE INDEX "Enquiry_isAnonymized_idx" ON "Enquiry"("isAnonymized");

ALTER TABLE "Enquiry" ADD CONSTRAINT "Enquiry_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "EnquiryNote" (
    "id" TEXT NOT NULL,
    "enquiryId" TEXT NOT NULL,
    "authorId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnquiryNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EnquiryNote_enquiryId_createdAt_idx" ON "EnquiryNote"("enquiryId", "createdAt");

ALTER TABLE "EnquiryNote" ADD CONSTRAINT "EnquiryNote_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "Enquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EnquiryNote" ADD CONSTRAINT "EnquiryNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
