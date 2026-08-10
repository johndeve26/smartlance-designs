"use server";

import { prisma } from "@/lib/db";
import { requireAdminUser } from "@/lib/admin/session";
import { listContactPropertyDefinitions } from "@/lib/crm/properties/definitions";
import { parsePropertyOptions } from "@/lib/crm/properties/options";
import {
  buildStandardFilterFields,
  customPropertyToFilterField,
  type FilterFieldDef,
} from "@/lib/crm/filters/filter-ui-registry";
import { listCountryOptions } from "@/lib/crm/country";

export type ContactFilterMetadata = {
  fields: FilterFieldDef[];
  countries: Array<{ code: string; name: string }>;
  companies: Array<{ id: string; name: string }>;
  owners: Array<{ id: string; name: string }>;
};

export async function getContactFilterMetadataAction(): Promise<ContactFilterMetadata> {
  await requireAdminUser("view_crm");

  const [properties, companies, owners] = await Promise.all([
    listContactPropertyDefinitions({ includeInactive: true }),
    prisma.crmCompany.findMany({
      where: { isArchived: false },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 500,
    }),
    prisma.adminUser.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const customFields = properties.map((p) =>
    customPropertyToFilterField({
      id: p.id,
      label: p.label,
      fieldType: p.fieldType,
      options: parsePropertyOptions(p),
      isActive: p.isActive,
    }),
  );

  return {
    fields: [...buildStandardFilterFields(), ...customFields],
    countries: listCountryOptions(),
    companies,
    owners,
  };
}
