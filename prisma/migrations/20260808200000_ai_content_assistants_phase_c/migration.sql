-- Phase C: Case Study AI + Testimonial Assistant (additive)

ALTER TYPE "AIContentEntityType" ADD VALUE IF NOT EXISTS 'WORK';
ALTER TYPE "AIContentEntityType" ADD VALUE IF NOT EXISTS 'TESTIMONIAL';

ALTER TABLE "WorkProject" ADD COLUMN IF NOT EXISTS "approvedForAI" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "WorkProject" ADD COLUMN IF NOT EXISTS "approvedProjectFacts" JSONB;

ALTER TABLE "Testimonial" ADD COLUMN IF NOT EXISTS "originalQuote" TEXT;
ALTER TABLE "Testimonial" ADD COLUMN IF NOT EXISTS "displayExcerpt" TEXT;
ALTER TABLE "Testimonial" ADD COLUMN IF NOT EXISTS "themesJson" JSONB;

-- Preserve existing verified quotes exactly into originalQuote (additive, no rewrite)
UPDATE "Testimonial"
SET "originalQuote" = "quote"
WHERE "originalQuote" IS NULL AND "quote" IS NOT NULL AND "quote" <> '';
