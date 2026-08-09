-- Additive: Audience / Subscriber system
CREATE TYPE "SubscriberStatus" AS ENUM ('PENDING', 'ACTIVE', 'UNSUBSCRIBED', 'BOUNCED', 'COMPLAINED');
CREATE TYPE "SubscriberSource" AS ENUM ('FOOTER', 'INSIGHT', 'RESOURCE', 'GUIDE', 'CHECKLIST', 'TEMPLATE', 'CONTACT', 'WEBSITE_REVIEW', 'PROJECT_PLANNER', 'OTHER');
CREATE TYPE "SubscriberEventType" AS ENUM ('SUBSCRIBED', 'CONFIRMATION_SENT', 'CONFIRMED', 'UNSUBSCRIBED', 'RESUBSCRIBED');

ALTER TABLE "SiteSettings" ADD COLUMN "audienceEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "SiteSettings" ADD COLUMN "audienceRequireConfirmation" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "Subscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailNormalized" TEXT NOT NULL,
    "name" TEXT,
    "status" "SubscriberStatus" NOT NULL DEFAULT 'PENDING',
    "primarySource" "SubscriberSource" NOT NULL,
    "primarySourceUrl" TEXT,
    "consentAt" TIMESTAMP(3),
    "consentText" TEXT,
    "consentVersion" TEXT,
    "subscribedAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "unsubscribedAt" TIMESTAMP(3),
    "confirmationTokenHash" TEXT,
    "confirmationTokenExpiresAt" TIMESTAMP(3),
    "unsubscribeTokenHash" TEXT,
    "unsubscribedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscriber_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SubscriberEvent" (
    "id" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "type" "SubscriberEventType" NOT NULL,
    "source" "SubscriberSource",
    "sourceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriberEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Subscriber_emailNormalized_key" ON "Subscriber"("emailNormalized");
CREATE INDEX "Subscriber_status_createdAt_idx" ON "Subscriber"("status", "createdAt");
CREATE INDEX "Subscriber_primarySource_createdAt_idx" ON "Subscriber"("primarySource", "createdAt");
CREATE INDEX "SubscriberEvent_subscriberId_createdAt_idx" ON "SubscriberEvent"("subscriberId", "createdAt");

ALTER TABLE "Subscriber" ADD CONSTRAINT "Subscriber_unsubscribedById_fkey" FOREIGN KEY ("unsubscribedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SubscriberEvent" ADD CONSTRAINT "SubscriberEvent_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "Subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;
