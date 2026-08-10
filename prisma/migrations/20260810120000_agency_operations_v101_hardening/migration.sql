-- Agency Operations V1.0.1 — production hardening

ALTER TABLE "AgencyProjectCounter" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "AgencyProjectTemplate" ADD COLUMN "systemKey" TEXT;

CREATE UNIQUE INDEX "AgencyProjectTemplate_systemKey_key" ON "AgencyProjectTemplate"("systemKey");

-- Backfill systemKey for known starter templates (name match only for confident identification)
UPDATE "AgencyProjectTemplate" SET "systemKey" = 'website-design' WHERE "systemKey" IS NULL AND "isSystem" = true AND "name" = 'Website Design';
UPDATE "AgencyProjectTemplate" SET "systemKey" = 'website-redesign' WHERE "systemKey" IS NULL AND "isSystem" = true AND "name" = 'Website Redesign';
UPDATE "AgencyProjectTemplate" SET "systemKey" = 'landing-page' WHERE "systemKey" IS NULL AND "isSystem" = true AND "name" = 'Landing Page';
UPDATE "AgencyProjectTemplate" SET "systemKey" = 'ecommerce' WHERE "systemKey" IS NULL AND "isSystem" = true AND "name" = 'E-commerce Website';
UPDATE "AgencyProjectTemplate" SET "systemKey" = 'seo' WHERE "systemKey" IS NULL AND "isSystem" = true AND "name" = 'SEO Project';
UPDATE "AgencyProjectTemplate" SET "systemKey" = 'branding' WHERE "systemKey" IS NULL AND "isSystem" = true AND "name" = 'Branding';
UPDATE "AgencyProjectTemplate" SET "systemKey" = 'website-maintenance' WHERE "systemKey" IS NULL AND "isSystem" = true AND "name" = 'Website Maintenance';

-- Initialize yearly counters from existing canonical project numbers (SL-YYYY-NNNN+)
INSERT INTO "AgencyProjectCounter" ("year", "lastNumber", "updatedAt")
SELECT
  CAST(SUBSTRING("projectNumber" FROM 'SL-([0-9]{4})-') AS INTEGER) AS year,
  MAX(CAST(SUBSTRING("projectNumber" FROM 'SL-[0-9]{4}-([0-9]+)$') AS INTEGER)) AS lastNumber,
  CURRENT_TIMESTAMP AS "updatedAt"
FROM "AgencyProject"
WHERE "projectNumber" ~ '^SL-[0-9]{4}-[0-9]+$'
GROUP BY CAST(SUBSTRING("projectNumber" FROM 'SL-([0-9]{4})-') AS INTEGER)
ON CONFLICT ("year") DO UPDATE
SET "lastNumber" = GREATEST("AgencyProjectCounter"."lastNumber", EXCLUDED."lastNumber"),
    "updatedAt" = CURRENT_TIMESTAMP;
