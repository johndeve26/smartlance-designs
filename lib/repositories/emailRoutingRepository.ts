import type { EmailRouteCategory } from "@prisma/client";
import { prisma, hasDatabaseUrl } from "@/lib/db";
import { EMAIL_ROUTE_CATEGORIES, EMAIL_ROUTE_LABELS } from "@/lib/email/routing/categories";

export type AdminEmailRoutingRow = {
  category: EmailRouteCategory;
  label: string;
  sendingProfileId: string | null;
  sendingProfileName: string | null;
  sendingProfileFrom: string | null;
  profileActive: boolean | null;
  usesDefault: boolean;
};

export async function getEmailRoutingRule(category: EmailRouteCategory) {
  if (!hasDatabaseUrl()) return null;
  return prisma.emailRoutingRule.findUnique({
    where: { category },
    include: { sendingProfile: true },
  });
}

export async function listEmailRoutingForAdmin(): Promise<AdminEmailRoutingRow[]> {
  if (!hasDatabaseUrl()) {
    return EMAIL_ROUTE_CATEGORIES.map((category) => ({
      category,
      label: EMAIL_ROUTE_LABELS[category],
      sendingProfileId: null,
      sendingProfileName: null,
      sendingProfileFrom: null,
      profileActive: null,
      usesDefault: true,
    }));
  }

  const rules = await prisma.emailRoutingRule.findMany({
    include: { sendingProfile: true },
  });
  const byCategory = new Map(rules.map((r) => [r.category, r]));

  return EMAIL_ROUTE_CATEGORIES.map((category) => {
    const rule = byCategory.get(category);
    if (!rule) {
      return {
        category,
        label: EMAIL_ROUTE_LABELS[category],
        sendingProfileId: null,
        sendingProfileName: null,
        sendingProfileFrom: null,
        profileActive: null,
        usesDefault: true,
      };
    }
    return {
      category,
      label: EMAIL_ROUTE_LABELS[category],
      sendingProfileId: rule.sendingProfileId,
      sendingProfileName: rule.sendingProfile.name,
      sendingProfileFrom: rule.sendingProfile.fromEmail,
      profileActive: rule.sendingProfile.isActive,
      usesDefault: false,
    };
  });
}

export async function upsertEmailRoutingRule(input: {
  category: EmailRouteCategory;
  sendingProfileId: string;
  updatedById: string;
}) {
  return prisma.emailRoutingRule.upsert({
    where: { category: input.category },
    create: {
      category: input.category,
      sendingProfileId: input.sendingProfileId,
      updatedById: input.updatedById,
    },
    update: {
      sendingProfileId: input.sendingProfileId,
      updatedById: input.updatedById,
    },
  });
}

export async function deleteEmailRoutingRule(category: EmailRouteCategory) {
  return prisma.emailRoutingRule.deleteMany({ where: { category } });
}

export async function countRoutingRulesForProfile(profileId: string) {
  return prisma.emailRoutingRule.count({ where: { sendingProfileId: profileId } });
}
