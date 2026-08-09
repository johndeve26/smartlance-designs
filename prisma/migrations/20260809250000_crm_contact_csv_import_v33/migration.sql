-- CRM V3.3 Contact CSV Import

CREATE TYPE "CrmContactImportStatus" AS ENUM ('PREVIEWED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE "CrmContactImportIssueSeverity" AS ENUM ('ERROR', 'WARNING');

ALTER TYPE "CrmActivityType" ADD VALUE 'CONTACT_IMPORTED';

CREATE TABLE "CrmContactImport" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "status" "CrmContactImportStatus" NOT NULL DEFAULT 'PREVIEWED',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "validRows" INTEGER NOT NULL DEFAULT 0,
    "invalidRows" INTEGER NOT NULL DEFAULT 0,
    "createdContacts" INTEGER NOT NULL DEFAULT 0,
    "updatedContacts" INTEGER NOT NULL DEFAULT 0,
    "skippedContacts" INTEGER NOT NULL DEFAULT 0,
    "duplicateRows" INTEGER NOT NULL DEFAULT 0,
    "createdCompanies" INTEGER NOT NULL DEFAULT 0,
    "createdLeads" INTEGER NOT NULL DEFAULT 0,
    "mappingJson" JSONB NOT NULL,
    "optionsJson" JSONB NOT NULL,
    "summaryJson" JSONB,
    "createdById" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureSafe" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CrmContactImport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CrmContactImportIssue" (
    "id" TEXT NOT NULL,
    "importId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "severity" "CrmContactImportIssueSeverity" NOT NULL,
    "code" TEXT NOT NULL,
    "field" TEXT,
    "message" TEXT NOT NULL,
    "rowSnapshotJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CrmContactImportIssue_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CrmContactImport_createdById_createdAt_idx" ON "CrmContactImport"("createdById", "createdAt");
CREATE INDEX "CrmContactImport_fileHash_createdAt_idx" ON "CrmContactImport"("fileHash", "createdAt");
CREATE INDEX "CrmContactImport_status_createdAt_idx" ON "CrmContactImport"("status", "createdAt");
CREATE INDEX "CrmContactImportIssue_importId_rowNumber_idx" ON "CrmContactImportIssue"("importId", "rowNumber");
CREATE INDEX "CrmContactImportIssue_importId_severity_idx" ON "CrmContactImportIssue"("importId", "severity");

ALTER TABLE "CrmContactImport" ADD CONSTRAINT "CrmContactImport_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CrmContactImportIssue" ADD CONSTRAINT "CrmContactImportIssue_importId_fkey" FOREIGN KEY ("importId") REFERENCES "CrmContactImport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
