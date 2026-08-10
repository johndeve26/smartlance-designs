import { prisma } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/db";
import { getBillingDashboardCounts } from "@/lib/billing/invoices";
import { countOnboardingDashboardMetrics } from "@/lib/onboarding/readiness";
import { getPipelineSummary } from "@/lib/crm/deals";
import { getSalesInboxCounts } from "@/lib/crm/inbox/threads";
import { listAuditLogs } from "@/lib/repositories/auditRepository";
import { ACTIVE_AGENCY_PROJECT_STATUSES } from "@/lib/agency/constants";
import { INACTIVE_LEAD_STATUSES } from "@/lib/crm/constants";

export type AdminAttentionItem = {
  id: string;
  label: string;
  detail: string;
  href: string;
  tone: "warning" | "danger" | "info";
};

export type AdminDashboardHome = {
  attention: AdminAttentionItem[];
  stats: Array<{ label: string; value: number | string; href?: string }>;
  pipeline: Array<{ stage: string; count: number; totalAmount: number }>;
  activeProjects: Array<{
    id: string;
    name: string;
    status: string;
    clientName: string | null;
    href: string;
  }>;
  recentActivity: Array<{ id: string; summary: string; createdAt: Date; href?: string }>;
};

export async function getAdminDashboardHome(): Promise<AdminDashboardHome> {
  if (!hasDatabaseUrl()) {
    return {
      attention: [],
      stats: [],
      pipeline: [],
      activeProjects: [],
      recentActivity: [],
    };
  }

  const [
    billing,
    onboarding,
    inbox,
    proposalsAwaiting,
    contractsAwaiting,
    projectsWaitingClient,
    openLeads,
    activeProjects,
    openSupport,
    pipeline,
    audit,
  ] = await Promise.all([
    getBillingDashboardCounts().catch(() => ({
      outstandingMinor: 0,
      overdueCount: 0,
      paidThisMonth: 0,
    })),
    countOnboardingDashboardMetrics().catch(() => ({
      active: 0,
      waitingOnClient: 0,
      needsReview: 0,
      overdue: 0,
    })),
    getSalesInboxCounts().catch(() => ({ inboxBadge: 0, needsReply: 0 })),
    prisma.agencyProposal.count({
      where: { status: { in: ["INTERNAL_REVIEW", "SENT"] } },
    }),
    prisma.agencyContract.count({
      where: { status: { in: ["READY_FOR_REVIEW", "SENT", "PARTIALLY_SIGNED"] } },
    }),
    prisma.agencyProject.count({
      where: { status: "CLIENT_REVIEW" },
    }),
    prisma.crmLead.count({
      where: { status: { notIn: INACTIVE_LEAD_STATUSES } },
    }),
    prisma.agencyProject.findMany({
      where: { status: { in: ACTIVE_AGENCY_PROJECT_STATUSES } },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: {
        id: true,
        name: true,
        status: true,
        clientCompany: { select: { name: true } },
      },
    }),
    prisma.agencySupportRequest.count({
      where: {
        status: { in: ["OPEN", "IN_PROGRESS"] },
        waitingOn: "SMARTLANCE",
      },
    }),
    getPipelineSummary().catch(() => []),
    listAuditLogs({ limit: 8 }).catch(() => ({ items: [] })),
  ]);

  const attention: AdminAttentionItem[] = [];

  if (proposalsAwaiting > 0) {
    attention.push({
      id: "proposals",
      label: `${proposalsAwaiting} proposal${proposalsAwaiting === 1 ? "" : "s"} awaiting action`,
      detail: "Review and send or follow up",
      href: "/admin/agency/proposals",
      tone: "warning",
    });
  }
  if (contractsAwaiting > 0) {
    attention.push({
      id: "contracts",
      label: `${contractsAwaiting} contract${contractsAwaiting === 1 ? "" : "s"} awaiting signature`,
      detail: "Track signer progress",
      href: "/admin/agency/contracts",
      tone: "warning",
    });
  }
  if (billing.overdueCount > 0) {
    attention.push({
      id: "invoices",
      label: `${billing.overdueCount} overdue invoice${billing.overdueCount === 1 ? "" : "s"}`,
      detail: "Follow up on payment",
      href: "/admin/agency/billing",
      tone: "danger",
    });
  }
  if (projectsWaitingClient > 0) {
    attention.push({
      id: "projects-client",
      label: `${projectsWaitingClient} project${projectsWaitingClient === 1 ? "" : "s"} waiting on client`,
      detail: "Client review or input needed",
      href: "/admin/agency/projects?status=CLIENT_REVIEW",
      tone: "info",
    });
  }
  if (onboarding.needsReview > 0) {
    attention.push({
      id: "onboarding",
      label: `${onboarding.needsReview} onboarding review${onboarding.needsReview === 1 ? "" : "s"}`,
      detail: "Client submissions need review",
      href: "/admin/agency/onboarding",
      tone: "warning",
    });
  }
  if (openSupport > 0) {
    attention.push({
      id: "support",
      label: `${openSupport} support request${openSupport === 1 ? "" : "s"} waiting for Smartlance`,
      detail: "Client needs a response",
      href: "/admin/agency/support",
      tone: "info",
    });
  }
  if (inbox.inboxBadge > 0) {
    attention.push({
      id: "inbox",
      label: `${inbox.inboxBadge} inbox thread${inbox.inboxBadge === 1 ? "" : "s"} need reply`,
      detail: "Sales inbox attention",
      href: "/admin/crm/inbox",
      tone: "info",
    });
  }

  const stats = [
    { label: "Open leads", value: openLeads, href: "/admin/crm/leads" },
    {
      label: "Active projects",
      value: activeProjects.length,
      href: "/admin/agency/projects",
    },
    {
      label: "Overdue invoices",
      value: billing.overdueCount,
      href: "/admin/agency/billing",
    },
    {
      label: "Open support",
      value: openSupport,
      href: "/admin/agency/support",
    },
  ].filter((s) => typeof s.value === "number" && s.value >= 0);

  return {
    attention,
    stats: stats.slice(0, 6),
    pipeline: pipeline.map((p) => ({
      stage: p.stage,
      count: p.count,
      totalAmount: p.totalAmount,
    })),
    activeProjects: activeProjects.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      clientName: p.clientCompany?.name ?? null,
      href: `/admin/agency/projects/${p.id}`,
    })),
    recentActivity: (audit.items ?? []).map((a) => ({
      id: a.id,
      summary: a.action,
      createdAt: a.createdAt,
    })),
  };
}
