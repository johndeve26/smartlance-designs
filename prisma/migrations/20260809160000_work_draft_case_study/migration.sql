-- CreateEnum
CREATE TYPE "CaseStudyKind" AS ENUM ('WEBSITE', 'PRODUCT');

-- AlterTable
ALTER TABLE "WorkProject" ADD COLUMN "caseStudyKind" "CaseStudyKind" NOT NULL DEFAULT 'WEBSITE',
ADD COLUMN "caseStudyContent" JSONB,
ADD COLUMN "heroEyebrow" TEXT,
ADD COLUMN "heroSupportingCopy" TEXT,
ADD COLUMN "externalLinkLabel" TEXT,
ADD COLUMN "draftJson" JSONB,
ADD COLUMN "draftUpdatedAt" TIMESTAMP(3),
ADD COLUMN "draftUpdatedById" TEXT;
