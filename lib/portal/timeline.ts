import { prisma } from "@/lib/db";
import { listAccessibleProjectIds } from "@/lib/portal/access";
import { listAccessibleWebsiteIds } from "@/lib/client-success/website-access";
import { listAccessibleProposals } from "@/lib/proposals/portal-access";
import { listAccessibleContracts } from "@/lib/contracts/portal-access";
import { listAccessibleInvoices } from "@/lib/billing/portal-access";

export type PortalTimelineIcon =
  | "project"
  | "proposal"
  | "contract"
  | "billing"
  | "onboarding"
  | "change"
  | "deliverable"
  | "update"
  | "website"
  | "support";

export type PortalTimelineEvent = {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  projectId?: string | null;
  projectName?: string | null;
  occurredAt: Date;
  iconType: PortalTimelineIcon;
  href?: string | null;
};

function mapProjectActivity(row: {
  id: string;
  type: string;
  summary: string;
  projectId: string;
  createdAt: Date;
  project?: { name: string } | null;
}): PortalTimelineEvent {
  return {
    id: `pa-${row.id}`,
    type: row.type,
    title: row.summary,
    projectId: row.projectId,
    projectName: row.project?.name ?? null,
    occurredAt: row.createdAt,
    iconType: row.type.includes("DELIVERABLE") ? "deliverable" : "project",
    href: `/portal/projects/${row.projectId}?tab=timeline`,
  };
}

export async function getPortalTimeline(input: {
  portalUserId: string;
  projectId?: string;
  limit?: number;
  cursor?: Date;
}) {
  const limit = Math.min(input.limit ?? 10, 50);
  const projectIds = input.projectId
    ? (await listAccessibleProjectIds(input.portalUserId)).includes(input.projectId)
      ? [input.projectId]
      : []
    : await listAccessibleProjectIds(input.portalUserId);

  const events: PortalTimelineEvent[] = [];

  if (projectIds.length) {
    const [activities, updates, changeActivities, onboardingActivities] = await Promise.all([
      prisma.agencyProjectActivity.findMany({
        where: {
          projectId: { in: projectIds },
          clientVisible: true,
          ...(input.cursor ? { createdAt: { lt: input.cursor } } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          type: true,
          summary: true,
          projectId: true,
          createdAt: true,
          project: { select: { name: true } },
        },
      }),
      prisma.agencyProjectUpdate.findMany({
        where: {
          projectId: { in: projectIds },
          clientVisible: true,
          ...(input.cursor ? { createdAt: { lt: input.cursor } } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          title: true,
          body: true,
          projectId: true,
          createdAt: true,
          project: { select: { name: true } },
        },
      }),
      prisma.agencyChangeRequestActivity.findMany({
        where: {
          changeRequest: { projectId: { in: projectIds } },
          clientVisible: true,
          ...(input.cursor ? { createdAt: { lt: input.cursor } } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          type: true,
          summary: true,
          createdAt: true,
          changeRequest: {
            select: {
              id: true,
              projectId: true,
              project: { select: { name: true } },
            },
          },
        },
      }),
      prisma.agencyOnboardingActivity.findMany({
        where: {
          onboarding: { projectId: { in: projectIds } },
          clientVisible: true,
          ...(input.cursor ? { createdAt: { lt: input.cursor } } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          type: true,
          summary: true,
          createdAt: true,
          onboarding: {
            select: {
              projectId: true,
              project: { select: { name: true } },
            },
          },
        },
      }),
    ]);

    for (const a of activities) events.push(mapProjectActivity(a));
    for (const u of updates) {
      events.push({
        id: `pu-${u.id}`,
        type: "PROJECT_UPDATE",
        title: u.title,
        description: u.body.slice(0, 200),
        projectId: u.projectId,
        projectName: u.project.name,
        occurredAt: u.createdAt,
        iconType: "update",
        href: `/portal/projects/${u.projectId}?tab=overview`,
      });
    }
    for (const a of changeActivities) {
      events.push({
        id: `cr-${a.id}`,
        type: a.type,
        title: a.summary,
        projectId: a.changeRequest.projectId,
        projectName: a.changeRequest.project.name,
        occurredAt: a.createdAt,
        iconType: "change",
        href: `/portal/projects/${a.changeRequest.projectId}/changes/${a.changeRequest.id}`,
      });
    }
    for (const a of onboardingActivities) {
      events.push({
        id: `ob-${a.id}`,
        type: a.type,
        title: a.summary,
        projectId: a.onboarding.projectId,
        projectName: a.onboarding.project.name,
        occurredAt: a.createdAt,
        iconType: "onboarding",
        href: `/portal/projects/${a.onboarding.projectId}/onboarding`,
      });
    }
  }

  if (!input.projectId) {
    const [proposals, contracts, invoices] = await Promise.all([
      listAccessibleProposals(input.portalUserId),
      listAccessibleContracts(input.portalUserId),
      listAccessibleInvoices(input.portalUserId),
    ]);

    const proposalIds = proposals.map((p) => p.proposal.id);
    const contractIds = contracts.map((c) => c.contract.id);
    const invoiceIds = invoices.map((i) => i.invoice.id);

    const [proposalActs, contractActs, billingActs] = await Promise.all([
      proposalIds.length
        ? prisma.agencyProposalActivity.findMany({
            where: {
              proposalId: { in: proposalIds },
              clientVisible: true,
            },
            orderBy: { createdAt: "desc" },
            take: limit,
            select: {
              id: true,
              type: true,
              summary: true,
              createdAt: true,
              proposalId: true,
              proposal: { select: { title: true } },
            },
          })
        : Promise.resolve([]),
      contractIds.length
        ? prisma.agencyContractActivity.findMany({
            where: {
              contractId: { in: contractIds },
              clientVisible: true,
            },
            orderBy: { createdAt: "desc" },
            take: limit,
            select: {
              id: true,
              type: true,
              summary: true,
              createdAt: true,
              contractId: true,
              contract: { select: { title: true } },
            },
          })
        : Promise.resolve([]),
      invoiceIds.length
        ? prisma.agencyBillingActivity.findMany({
            where: {
              invoiceId: { in: invoiceIds },
              clientVisible: true,
            },
            orderBy: { createdAt: "desc" },
            take: limit,
            select: {
              id: true,
              type: true,
              summary: true,
              createdAt: true,
              invoiceId: true,
              invoice: { select: { invoiceNumber: true } },
            },
          })
        : Promise.resolve([]),
    ]);

    for (const a of proposalActs) {
      events.push({
        id: `prop-${a.id}`,
        type: a.type,
        title: a.summary,
        description: a.proposal.title,
        occurredAt: a.createdAt,
        iconType: "proposal",
        href: `/portal/proposals/${a.proposalId}`,
      });
    }
    for (const a of contractActs) {
      events.push({
        id: `con-${a.id}`,
        type: a.type,
        title: a.summary,
        description: a.contract.title,
        occurredAt: a.createdAt,
        iconType: "contract",
        href: `/portal/contracts/${a.contractId}`,
      });
    }
    for (const a of billingActs) {
      events.push({
        id: `bill-${a.id}`,
        type: a.type,
        title: a.summary,
        description: a.invoice?.invoiceNumber ?? null,
        occurredAt: a.createdAt,
        iconType: "billing",
        href: `/portal/invoices/${a.invoiceId}`,
      });
    }

    const websiteIds = await listAccessibleWebsiteIds(input.portalUserId);
    if (websiteIds.length) {
      const [careEvents, supportResolved, supportCreated] = await Promise.all([
        prisma.agencyWebsiteCareEvent.findMany({
          where: {
            websiteId: { in: websiteIds },
            clientVisible: true,
            status: "COMPLETED",
            ...(input.cursor ? { completedAt: { lt: input.cursor } } : {}),
          },
          orderBy: { completedAt: "desc" },
          take: limit,
          select: {
            id: true,
            title: true,
            clientSummary: true,
            completedAt: true,
            websiteId: true,
            website: { select: { name: true } },
          },
        }),
        prisma.agencySupportRequest.findMany({
          where: {
            websiteId: { in: websiteIds },
            status: { in: ["RESOLVED", "CLOSED"] },
            resolvedAt: { not: null },
            ...(input.cursor ? { resolvedAt: { lt: input.cursor } } : {}),
          },
          orderBy: { resolvedAt: "desc" },
          take: limit,
          select: {
            id: true,
            supportNumber: true,
            subject: true,
            resolvedAt: true,
            websiteId: true,
            website: { select: { name: true } },
          },
        }),
        prisma.agencySupportRequest.findMany({
          where: {
            websiteId: { in: websiteIds },
            ...(input.cursor ? { createdAt: { lt: input.cursor } } : {}),
          },
          orderBy: { createdAt: "desc" },
          take: limit,
          select: {
            id: true,
            supportNumber: true,
            subject: true,
            createdAt: true,
            websiteId: true,
            website: { select: { name: true } },
          },
        }),
      ]);

      for (const e of careEvents) {
        if (!e.completedAt) continue;
        events.push({
          id: `care-${e.id}`,
          type: "WEBSITE_CARE_COMPLETED",
          title: e.title,
          description: e.clientSummary ?? e.website.name,
          occurredAt: e.completedAt,
          iconType: "website",
          href: `/portal/websites/${e.websiteId}?tab=care`,
        });
      }
      for (const s of supportResolved) {
        if (!s.resolvedAt) continue;
        events.push({
          id: `sup-res-${s.id}`,
          type: "SUPPORT_RESOLVED",
          title: `Support resolved: ${s.subject}`,
          description: s.supportNumber,
          occurredAt: s.resolvedAt,
          iconType: "support",
          href: `/portal/support/${s.id}`,
        });
      }
      for (const s of supportCreated) {
        events.push({
          id: `sup-new-${s.id}`,
          type: "SUPPORT_CREATED",
          title: `Support request: ${s.subject}`,
          description: s.supportNumber,
          occurredAt: s.createdAt,
          iconType: "support",
          href: `/portal/support/${s.id}`,
        });
      }
    }
  }

  events.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
  return events.slice(0, limit);
}
