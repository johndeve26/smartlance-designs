import { prisma } from "@/lib/db";

export async function upsertProspectProfile(input: {
  portalUserId: string;
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  phone?: string | null;
  primaryWebsite?: string | null;
}) {
  return prisma.agencyProspectProfile.upsert({
    where: { portalUserId: input.portalUserId },
    create: {
      portalUserId: input.portalUserId,
      firstName: input.firstName?.trim() || null,
      lastName: input.lastName?.trim() || null,
      companyName: input.companyName?.trim() || null,
      phone: input.phone?.trim() || null,
      primaryWebsite: input.primaryWebsite?.trim() || null,
    },
    update: {
      ...(input.firstName !== undefined
        ? { firstName: input.firstName?.trim() || null }
        : {}),
      ...(input.lastName !== undefined
        ? { lastName: input.lastName?.trim() || null }
        : {}),
      ...(input.companyName !== undefined
        ? { companyName: input.companyName?.trim() || null }
        : {}),
      ...(input.phone !== undefined ? { phone: input.phone?.trim() || null } : {}),
      ...(input.primaryWebsite !== undefined
        ? { primaryWebsite: input.primaryWebsite?.trim() || null }
        : {}),
    },
  });
}

export async function getProspectProfile(portalUserId: string) {
  return prisma.agencyProspectProfile.findUnique({
    where: { portalUserId },
  });
}
