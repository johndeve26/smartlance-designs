import { prisma } from "@/lib/db";
import { listAccessibleProjectIds, getPortalProjectRole, portalProjectRoleCanAct } from "@/lib/portal/access";
import { getPortalBillingHome } from "@/lib/portal/billing";
import { getPortalContractsHome } from "@/lib/portal/contracts";
import { getPortalProposalsHome } from "@/lib/portal/proposals";
import { getPortalOnboardingAttention } from "@/lib/portal/onboarding";
import { getPortalChangeRequestAttention } from "@/lib/portal/change-requests";
import { getPortalSupportAttention } from "@/lib/portal/support";
import { isInvoiceOverdue } from "@/lib/billing/display";
import { INVOICE_PAYABLE_STATUSES } from "@/lib/billing/constants";
import { formatMinorAmount } from "@/lib/money/format";
import {
  PORTAL_DELIVERABLE_STATUS,
  PORTAL_REQUIREMENT_STATUS,
  formatPortalDate,
} from "@/lib/portal/status-labels";
import { AGENCY_MILESTONE_STATUS_LABELS } from "@/lib/agency/constants";

export type PortalAttentionType =
  | "DELIVERABLE_APPROVAL"
  | "ONBOARDING"
  | "CLIENT_REQUIREMENT"
  | "CLARIFICATION"
  | "CONTRACT_SIGNATURE"
  | "PROPOSAL_DECISION"
  | "INVOICE_DUE"
  | "INVOICE_OVERDUE"
  | "CHANGE_REQUEST_APPROVAL"
  | "CHANGE_REQUEST_CLARIFICATION"
  | "MILESTONE_REVIEW"
  | "SUPPORT_WAITING_ON_CLIENT";

export type PortalAttentionUrgency = "NORMAL" | "IMPORTANT" | "OVERDUE";

export type PortalAttentionItem = {
  id: string;
  type: PortalAttentionType;
  title: string;
  description: string;
  projectId?: string;
  projectName?: string;
  projectNumber?: string;
  dueAt?: Date | null;
  urgency: PortalAttentionUrgency;
  ctaLabel: string;
  ctaHref: string;
  canAct: boolean;
  createdAt: Date;
  sortPriority: number;
};

const PRIORITY = {
  INVOICE_OVERDUE: 10,
  INVOICE_DUE: 20,
  CONTRACT_SIGNATURE: 30,
  PROPOSAL_DECISION: 35,
  CHANGE_REQUEST_APPROVAL: 40,
  DELIVERABLE_APPROVAL: 50,
  MILESTONE_REVIEW: 55,
  CHANGE_REQUEST_CLARIFICATION: 60,
  CLARIFICATION: 65,
  ONBOARDING: 70,
  CLIENT_REQUIREMENT: 80,
  SUPPORT_WAITING_ON_CLIENT: 45,
} as const;

export async function getPortalAttentionItems(portalUserId: string, limit = 20) {
  const projectIds = await listAccessibleProjectIds(portalUserId);
  const items: PortalAttentionItem[] = [];

  const [
    requirements,
    deliverables,
    milestones,
    proposalsHome,
    contractsHome,
    billingHome,
    onboardingAttention,
    changeAttention,
    supportAttention,
  ] = await Promise.all([
    projectIds.length
      ? prisma.agencyClientRequirement.findMany({
          where: {
            projectId: { in: projectIds },
            clientVisible: true,
            status: { in: ["REQUESTED", "NEEDS_CLARIFICATION"] },
          },
          take: 15,
          orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
          select: {
            id: true,
            title: true,
            status: true,
            dueDate: true,
            createdAt: true,
            projectId: true,
            project: { select: { name: true, projectNumber: true } },
          },
        })
      : Promise.resolve([]),
    projectIds.length
      ? prisma.agencyDeliverable.findMany({
          where: {
            projectId: { in: projectIds },
            clientVisible: true,
            status: { in: ["READY_FOR_REVIEW", "CHANGES_REQUESTED"] },
          },
          take: 15,
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            title: true,
            status: true,
            updatedAt: true,
            projectId: true,
            project: { select: { name: true, projectNumber: true } },
          },
        })
      : Promise.resolve([]),
    projectIds.length
      ? prisma.agencyProjectMilestone.findMany({
          where: {
            projectId: { in: projectIds },
            clientVisible: true,
            status: "CLIENT_REVIEW",
          },
          take: 10,
          orderBy: { dueDate: "asc" },
          select: {
            id: true,
            title: true,
            dueDate: true,
            createdAt: true,
            projectId: true,
            project: { select: { name: true, projectNumber: true } },
          },
        })
      : Promise.resolve([]),
    getPortalProposalsHome(portalUserId).catch(() => ({ proposals: [], needsAttention: [] })),
    getPortalContractsHome(portalUserId).catch(() => ({ contracts: [], needsSignature: [] })),
    getPortalBillingHome(portalUserId).catch(() => null),
    getPortalOnboardingAttention(portalUserId).catch(() => []),
    getPortalChangeRequestAttention(portalUserId).catch(() => []),
    getPortalSupportAttention(portalUserId).catch(() => []),
  ]);

  for (const d of deliverables) {
    const role = await getPortalProjectRole({ projectId: d.projectId, portalUserId });
    items.push({
      id: `deliverable-${d.id}`,
      type: "DELIVERABLE_APPROVAL",
      title: d.title,
      description: PORTAL_DELIVERABLE_STATUS[d.status],
      projectId: d.projectId,
      projectName: d.project.name,
      projectNumber: d.project.projectNumber,
      urgency: "IMPORTANT",
      ctaLabel: portalProjectRoleCanAct(role) ? "Review" : "View",
      ctaHref: `/portal/projects/${d.projectId}?tab=overview#deliverable-${d.id}`,
      canAct: portalProjectRoleCanAct(role),
      createdAt: d.updatedAt,
      sortPriority: PRIORITY.DELIVERABLE_APPROVAL,
    });
  }

  for (const r of requirements) {
    const role = await getPortalProjectRole({ projectId: r.projectId, portalUserId });
    items.push({
      id: `requirement-${r.id}`,
      type: "CLIENT_REQUIREMENT",
      title: r.title,
      description: PORTAL_REQUIREMENT_STATUS[r.status],
      projectId: r.projectId,
      projectName: r.project.name,
      projectNumber: r.project.projectNumber,
      dueAt: r.dueDate,
      urgency: r.dueDate && r.dueDate < new Date() ? "IMPORTANT" : "NORMAL",
      ctaLabel: portalProjectRoleCanAct(role) ? "View" : "View",
      ctaHref: `/portal/projects/${r.projectId}?tab=overview#need-${r.id}`,
      canAct: portalProjectRoleCanAct(role),
      createdAt: r.createdAt,
      sortPriority: PRIORITY.CLIENT_REQUIREMENT,
    });
  }

  for (const m of milestones) {
    const role = await getPortalProjectRole({ projectId: m.projectId, portalUserId });
    items.push({
      id: `milestone-${m.id}`,
      type: "MILESTONE_REVIEW",
      title: m.title,
      description: AGENCY_MILESTONE_STATUS_LABELS.CLIENT_REVIEW,
      projectId: m.projectId,
      projectName: m.project.name,
      projectNumber: m.project.projectNumber,
      dueAt: m.dueDate,
      urgency: "IMPORTANT",
      ctaLabel: "View project",
      ctaHref: `/portal/projects/${m.projectId}`,
      canAct: portalProjectRoleCanAct(role),
      createdAt: m.createdAt,
      sortPriority: PRIORITY.MILESTONE_REVIEW,
    });
  }

  for (const row of proposalsHome.needsAttention) {
    items.push({
      id: `proposal-${row.proposal.id}`,
      type: "PROPOSAL_DECISION",
      title: row.proposal.title,
      description: "Proposal ready for your decision",
      urgency: "IMPORTANT",
      ctaLabel: "Review proposal",
      ctaHref: `/portal/proposals/${row.proposal.id}`,
      canAct: row.role === "DECISION_MAKER",
      createdAt: row.proposal.sentAt ?? new Date(),
      sortPriority: PRIORITY.PROPOSAL_DECISION,
    });
  }

  for (const row of contractsHome.needsSignature) {
    items.push({
      id: `contract-${row.contract.id}`,
      type: "CONTRACT_SIGNATURE",
      title: row.contract.title,
      description: "Needs your signature",
      urgency: "IMPORTANT",
      ctaLabel: "Review & sign",
      ctaHref: `/portal/contracts/${row.contract.id}`,
      canAct: row.role === "CLIENT_SIGNATORY",
      createdAt: row.contract.sentAt ?? new Date(),
      sortPriority: PRIORITY.CONTRACT_SIGNATURE,
    });
  }

  if (billingHome) {
    for (const { invoice, role } of billingHome.outstanding) {
      const canPay = role === "BILLING_ADMIN";
      const overdue = isInvoiceOverdue({
        status: invoice.status as never,
        dueDate: invoice.dueDate,
        amountDueMinor: invoice.amountDueMinor,
      });
      items.push({
        id: `invoice-${invoice.id}`,
        type: overdue ? "INVOICE_OVERDUE" : "INVOICE_DUE",
        title: invoice.invoiceNumber,
        description: `${formatMinorAmount(invoice.amountDueMinor, invoice.currency)}${
          invoice.dueDate ? ` · due ${formatPortalDate(invoice.dueDate)}` : ""
        }`,
        urgency: overdue ? "OVERDUE" : "IMPORTANT",
        ctaLabel: canPay ? "Pay invoice" : "View invoice",
        ctaHref: `/portal/invoices/${invoice.id}`,
        canAct: canPay,
        createdAt: invoice.updatedAt,
        dueAt: invoice.dueDate,
        sortPriority: overdue ? PRIORITY.INVOICE_OVERDUE : PRIORITY.INVOICE_DUE,
      });
    }
  }

  for (const ob of onboardingAttention) {
    const role = await getPortalProjectRole({ projectId: ob.projectId, portalUserId });
    items.push({
      id: `onboarding-${ob.onboardingId}`,
      type: ob.detail.includes("clarification") ? "CLARIFICATION" : "ONBOARDING",
      title: ob.title,
      description: ob.detail,
      projectId: ob.projectId,
      projectName: ob.projectName,
      projectNumber: ob.projectNumber,
      urgency: "NORMAL",
      ctaLabel: "Continue",
      ctaHref: ob.href,
      canAct: portalProjectRoleCanAct(role),
      createdAt: new Date(),
      sortPriority: ob.detail.includes("clarification")
        ? PRIORITY.CLARIFICATION
        : PRIORITY.ONBOARDING,
    });
  }

  const changeClarifications = projectIds.length
    ? await prisma.agencyChangeRequest.findMany({
        where: {
          projectId: { in: projectIds },
          status: "NEEDS_CLARIFICATION",
        },
        select: {
          id: true,
          title: true,
          changeRequestNumber: true,
          projectId: true,
          updatedAt: true,
          project: { select: { name: true, projectNumber: true } },
        },
        take: 10,
      })
    : [];

  for (const cr of changeClarifications) {
    items.push({
      id: `cr-clarify-${cr.id}`,
      type: "CHANGE_REQUEST_CLARIFICATION",
      title: cr.title,
      description: `${cr.changeRequestNumber} · clarification requested`,
      projectId: cr.projectId,
      projectName: cr.project.name,
      projectNumber: cr.project.projectNumber,
      urgency: "IMPORTANT",
      ctaLabel: "Respond",
      ctaHref: `/portal/projects/${cr.projectId}/changes/${cr.id}`,
      canAct: true,
      createdAt: cr.updatedAt,
      sortPriority: PRIORITY.CHANGE_REQUEST_CLARIFICATION,
    });
  }

  for (const cr of changeAttention) {
    items.push({
      id: `cr-approve-${cr.changeRequestId}`,
      type: "CHANGE_REQUEST_APPROVAL",
      title: cr.title,
      description: `${formatMinorAmount(cr.priceImpactMinor, cr.currency)}${
        cr.timelineImpactDays > 0 ? ` · +${cr.timelineImpactDays} days` : ""
      }`,
      projectId: cr.projectId,
      projectName: cr.projectName,
      projectNumber: cr.projectNumber,
      urgency: "IMPORTANT",
      ctaLabel: "Review change",
      ctaHref: cr.href,
      canAct: true,
      createdAt: new Date(),
      sortPriority: PRIORITY.CHANGE_REQUEST_APPROVAL,
    });
  }

  for (const sr of supportAttention) {
    items.push({
      id: `support-${sr.supportRequestId}`,
      type: "SUPPORT_WAITING_ON_CLIENT",
      title: sr.subject,
      description: `${sr.supportNumber} · Smartlance needs a response`,
      urgency: "IMPORTANT",
      ctaLabel: "Respond",
      ctaHref: sr.href,
      canAct: true,
      createdAt: new Date(),
      sortPriority: PRIORITY.SUPPORT_WAITING_ON_CLIENT,
    });
  }

  items.sort((a, b) => {
    if (a.sortPriority !== b.sortPriority) return a.sortPriority - b.sortPriority;
    if (a.urgency === "OVERDUE" && b.urgency !== "OVERDUE") return -1;
    if (b.urgency === "OVERDUE" && a.urgency !== "OVERDUE") return 1;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return items.slice(0, limit);
}

export async function getPortalAttentionCount(portalUserId: string) {
  const items = await getPortalAttentionItems(portalUserId, 50);
  return items.filter((i) => i.canAct).length;
}
