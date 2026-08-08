-- Admin-managed multi-provider AI accounts (encrypted keys) + role assignments

CREATE TABLE "AIProviderAccount" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "apiKeyCiphertext" TEXT,
    "apiKeyIv" TEXT,
    "apiKeyTag" TEXT,
    "apiKeyLast4" TEXT,
    "baseUrl" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIProviderAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AIProviderAccount_providerId_key" ON "AIProviderAccount"("providerId");
CREATE INDEX "AIProviderAccount_enabled_idx" ON "AIProviderAccount"("enabled");

ALTER TABLE "AIProviderAccount" ADD CONSTRAINT "AIProviderAccount_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AIWriterSettings" ADD COLUMN "defaultProviderId" TEXT NOT NULL DEFAULT 'openai';
ALTER TABLE "AIWriterSettings" ADD COLUMN "writingProviderId" TEXT;
ALTER TABLE "AIWriterSettings" ADD COLUMN "researchProviderId" TEXT;
ALTER TABLE "AIWriterSettings" ADD COLUMN "editorProviderId" TEXT;
ALTER TABLE "AIWriterSettings" ADD COLUMN "fastProviderId" TEXT;
