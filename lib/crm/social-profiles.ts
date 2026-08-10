import type { CrmSocialPlatform } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  parseSocialUsername,
  validateSocialProfileUrl,
} from "@/lib/crm/social";

export async function listContactSocialProfiles(contactId: string) {
  return prisma.crmContactSocialProfile.findMany({
    where: { contactId },
    orderBy: [{ platform: "asc" }, { createdAt: "asc" }],
  });
}

export async function upsertContactSocialProfile(input: {
  contactId: string;
  platform: CrmSocialPlatform;
  url: string;
  label?: string | null;
}) {
  const validated = validateSocialProfileUrl(input.platform, input.url);
  if (!validated.ok) throw new Error(validated.error);

  const username = parseSocialUsername(input.platform, validated.url);
  const existing = await prisma.crmContactSocialProfile.findFirst({
    where: { contactId: input.contactId, platform: input.platform },
  });

  if (existing) {
    return prisma.crmContactSocialProfile.update({
      where: { id: existing.id },
      data: {
        url: validated.url,
        username,
        label: input.label?.trim() || null,
      },
    });
  }

  return prisma.crmContactSocialProfile.create({
    data: {
      contactId: input.contactId,
      platform: input.platform,
      url: validated.url,
      username,
      label: input.label?.trim() || null,
    },
  });
}

export async function deleteContactSocialProfile(id: string, contactId: string) {
  return prisma.crmContactSocialProfile.deleteMany({
    where: { id, contactId },
  });
}

export async function syncContactSocialProfiles(input: {
  contactId: string;
  profiles: Array<{ platform: CrmSocialPlatform; url: string }>;
}) {
  const results = [];
  for (const p of input.profiles) {
    if (!p.url.trim()) continue;
    results.push(
      await upsertContactSocialProfile({
        contactId: input.contactId,
        platform: p.platform,
        url: p.url,
      }),
    );
  }
  return results;
}
