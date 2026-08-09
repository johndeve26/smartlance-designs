-- Additive: site-wide Admin SMTP configuration (singleton).
CREATE TABLE "EmailSettings" (
    "id" TEXT NOT NULL DEFAULT 'site',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "host" TEXT,
    "port" INTEGER,
    "securityMode" TEXT NOT NULL DEFAULT 'STARTTLS',
    "username" TEXT,
    "passwordCiphertext" TEXT,
    "passwordIv" TEXT,
    "passwordTag" TEXT,
    "passwordLast4" TEXT,
    "fromName" TEXT,
    "fromEmail" TEXT,
    "replyToEmail" TEXT,
    "notificationRecipients" JSONB NOT NULL DEFAULT '[]',
    "testRecipient" TEXT,
    "lastTestedAt" TIMESTAMP(3),
    "lastTestSucceededAt" TIMESTAMP(3),
    "lastTestErrorSafe" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "EmailSettings_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "EmailSettings" ADD CONSTRAINT "EmailSettings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
