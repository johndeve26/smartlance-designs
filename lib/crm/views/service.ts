import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import {
  parseContactFilterV3,
  type ContactFilterV3,
} from "@/lib/crm/filters/contact-filter-schema";

function jsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function listContactViews(userId: string) {
  return prisma.crmContactView.findMany({
    where: {
      OR: [{ createdById: userId }, { isShared: true }],
    },
    orderBy: [{ updatedAt: "desc" }],
    include: { createdBy: { select: { id: true, name: true } } },
  });
}

export async function getContactViewById(id: string, userId: string) {
  return prisma.crmContactView.findFirst({
    where: {
      id,
      OR: [{ createdById: userId }, { isShared: true }],
    },
  });
}

export async function createContactView(input: {
  name: string;
  description?: string | null;
  filter: ContactFilterV3;
  sortJson?: Record<string, unknown> | null;
  isShared?: boolean;
  actorId: string;
}) {
  const filter = parseContactFilterV3(input.filter);
  return prisma.crmContactView.create({
    data: {
      name: input.name.trim().slice(0, 120),
      description: input.description?.trim() || null,
      filterJson: jsonValue(filter),
      filterVersion: filter.version,
      sortJson: input.sortJson ? jsonValue(input.sortJson) : undefined,
      isShared: input.isShared ?? false,
      createdById: input.actorId,
    },
  });
}

export async function updateContactView(input: {
  id: string;
  name?: string;
  description?: string | null;
  filter?: ContactFilterV3;
  sortJson?: Record<string, unknown> | null;
  isShared?: boolean;
  actorId: string;
}) {
  const view = await prisma.crmContactView.findUniqueOrThrow({ where: { id: input.id } });
  if (view.createdById !== input.actorId) {
    throw new Error("You can only edit your own views.");
  }

  return prisma.crmContactView.update({
    where: { id: input.id },
    data: {
      ...(input.name != null ? { name: input.name.trim().slice(0, 120) } : {}),
      ...(input.description !== undefined ? { description: input.description?.trim() || null } : {}),
      ...(input.filter ? { filterJson: jsonValue(parseContactFilterV3(input.filter)), filterVersion: 3 } : {}),
      ...(input.sortJson !== undefined ? { sortJson: input.sortJson ? jsonValue(input.sortJson) : undefined } : {}),
      ...(input.isShared != null ? { isShared: input.isShared } : {}),
    },
  });
}

export async function deleteContactView(id: string, actorId: string) {
  const view = await prisma.crmContactView.findUniqueOrThrow({ where: { id } });
  if (view.createdById !== actorId) throw new Error("You can only delete your own views.");
  return prisma.crmContactView.delete({ where: { id } });
}
