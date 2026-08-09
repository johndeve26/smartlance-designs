-- CRM V3.4 Contact Properties, Location, Social, Custom Fields, Saved Views

CREATE TYPE "CrmSocialPlatform" AS ENUM ('LINKEDIN', 'X', 'FACEBOOK', 'INSTAGRAM', 'GITHUB', 'YOUTUBE', 'TIKTOK', 'OTHER');
CREATE TYPE "CrmPropertyObjectType" AS ENUM ('CONTACT', 'COMPANY', 'LEAD', 'DEAL');
CREATE TYPE "CrmPropertyFieldType" AS ENUM ('TEXT', 'MULTILINE_TEXT', 'NUMBER', 'BOOLEAN', 'DATE', 'SINGLE_SELECT', 'MULTI_SELECT', 'URL', 'EMAIL', 'PHONE');

ALTER TABLE "CrmContact" ADD COLUMN "countryCode" TEXT;
ALTER TABLE "CrmContact" ADD COLUMN "countryName" TEXT;
ALTER TABLE "CrmContact" ADD COLUMN "stateRegion" TEXT;
ALTER TABLE "CrmContact" ADD COLUMN "city" TEXT;
ALTER TABLE "CrmContact" ADD COLUMN "postalCode" TEXT;
ALTER TABLE "CrmContact" ADD COLUMN "timezone" TEXT;

CREATE INDEX "CrmContact_countryCode_idx" ON "CrmContact"("countryCode");
CREATE INDEX "CrmContact_city_idx" ON "CrmContact"("city");

CREATE TABLE "CrmContactSocialProfile" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "platform" "CrmSocialPlatform" NOT NULL,
    "url" TEXT NOT NULL,
    "username" TEXT,
    "label" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CrmContactSocialProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CrmPropertyDefinition" (
    "id" TEXT NOT NULL,
    "objectType" "CrmPropertyObjectType" NOT NULL,
    "label" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "fieldType" "CrmPropertyFieldType" NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "optionsJson" JSONB,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CrmPropertyDefinition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CrmContactPropertyValue" (
    "id" TEXT NOT NULL,
    "definitionId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "textValue" TEXT,
    "numberValue" DECIMAL(18,4),
    "booleanValue" BOOLEAN,
    "dateValue" TIMESTAMP(3),
    "jsonValue" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CrmContactPropertyValue_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CrmContactView" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "filterJson" JSONB NOT NULL,
    "filterVersion" INTEGER NOT NULL DEFAULT 3,
    "sortJson" JSONB,
    "createdById" TEXT NOT NULL,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CrmContactView_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CrmContactSocialProfile_contactId_platform_idx" ON "CrmContactSocialProfile"("contactId", "platform");
CREATE UNIQUE INDEX "CrmPropertyDefinition_objectType_key_key" ON "CrmPropertyDefinition"("objectType", "key");
CREATE INDEX "CrmPropertyDefinition_objectType_isActive_displayOrder_idx" ON "CrmPropertyDefinition"("objectType", "isActive", "displayOrder");
CREATE UNIQUE INDEX "CrmContactPropertyValue_definitionId_contactId_key" ON "CrmContactPropertyValue"("definitionId", "contactId");
CREATE INDEX "CrmContactPropertyValue_definitionId_textValue_idx" ON "CrmContactPropertyValue"("definitionId", "textValue");
CREATE INDEX "CrmContactPropertyValue_definitionId_numberValue_idx" ON "CrmContactPropertyValue"("definitionId", "numberValue");
CREATE INDEX "CrmContactPropertyValue_definitionId_dateValue_idx" ON "CrmContactPropertyValue"("definitionId", "dateValue");
CREATE INDEX "CrmContactPropertyValue_contactId_idx" ON "CrmContactPropertyValue"("contactId");
CREATE INDEX "CrmContactView_createdById_updatedAt_idx" ON "CrmContactView"("createdById", "updatedAt");
CREATE INDEX "CrmContactView_isShared_updatedAt_idx" ON "CrmContactView"("isShared", "updatedAt");

ALTER TABLE "CrmContactSocialProfile" ADD CONSTRAINT "CrmContactSocialProfile_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmPropertyDefinition" ADD CONSTRAINT "CrmPropertyDefinition_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmPropertyDefinition" ADD CONSTRAINT "CrmPropertyDefinition_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmContactPropertyValue" ADD CONSTRAINT "CrmContactPropertyValue_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "CrmPropertyDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CrmContactPropertyValue" ADD CONSTRAINT "CrmContactPropertyValue_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmContactView" ADD CONSTRAINT "CrmContactView_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
