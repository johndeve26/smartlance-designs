import type { AgencyServiceType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createProject } from "@/lib/agency/projects";

export function inferServiceType(deal: {
  servicesInterested: string[];
  title: string;
}): AgencyServiceType {
  const haystack = [deal.title, ...deal.servicesInterested].join(" ").toLowerCase();

  if (/e-?commerce|shopify|store|woocommerce/.test(haystack)) return "ECOMMERCE";
  if (/redesign|refresh|rebuild/.test(haystack)) return "WEBSITE_REDESIGN";
  if (/landing page|campaign page/.test(haystack)) return "LANDING_PAGE";
  if (/\bseo\b|search engine/.test(haystack)) return "SEO";
  if (/brand|logo|identity/.test(haystack)) return "BRANDING";
  if (/maintenance|support|retainer|care plan/.test(haystack)) {
    return "WEBSITE_MAINTENANCE";
  }
  if (/website|web design|web development/.test(haystack)) return "WEBSITE_DESIGN";
  return "OTHER";
}

export async function getDealPrefill(dealId: string) {
  const deal = await prisma.crmDeal.findUnique({
    where: { id: dealId },
    include: {
      contact: { include: { company: true } },
      company: true,
      owner: { select: { id: true, name: true } },
    },
  });
  if (!deal) return null;

  const existingProject = await prisma.agencyProject.findUnique({
    where: { sourceDealId: dealId },
    select: { id: true, name: true, projectNumber: true },
  });

  return { deal, existingProject };
}

export async function convertWonDealToProject(input: {
  dealId: string;
  actorUserId: string;
  name?: string;
  serviceType?: AgencyServiceType;
  ownerId?: string | null;
  templateId?: string | null;
}) {
  const existing = await prisma.agencyProject.findUnique({
    where: { sourceDealId: input.dealId },
  });
  if (existing) {
    return { project: existing, created: false as const };
  }

  const deal = await prisma.crmDeal.findUniqueOrThrow({
    where: { id: input.dealId },
    include: {
      contact: true,
      company: true,
    },
  });

  if (deal.stage !== "WON") {
    throw new Error("Only won deals can be converted to agency projects.");
  }

  const serviceType = input.serviceType ?? inferServiceType(deal);
  const name =
    input.name?.trim() ||
    deal.title.trim() ||
    `Project — ${deal.contact.displayName ?? deal.contact.email ?? deal.id}`;

  const created = await createProject({
    name,
    primaryContactId: deal.contactId,
    clientCompanyId: deal.companyId ?? deal.contact.companyId,
    serviceType,
    ownerId: input.ownerId ?? deal.ownerId ?? input.actorUserId,
    createdById: input.actorUserId,
    targetDueDate: deal.expectedCloseAt,
    budgetSnapshot: deal.amount ? Number(deal.amount) : null,
    currency: deal.currency,
    summary: deal.lostNote?.trim() || null,
    templateId: input.templateId ?? null,
  });

  if (!created) {
    throw new Error("Failed to create agency project from deal.");
  }

  try {
    const project = await prisma.agencyProject.update({
      where: { id: created.id },
      data: { sourceDealId: deal.id },
    });
    return { project, created: true as const };
  } catch (err) {
    const raced = await prisma.agencyProject.findUnique({
      where: { sourceDealId: input.dealId },
    });
    if (raced) {
      return { project: raced, created: false as const };
    }
    throw err;
  }
}
