import { prisma } from "@/lib/db";
import { listAccessibleProjectIds, getPortalProjectRole, portalProjectRoleCanAct } from "@/lib/portal/access";
import { getPortalProposalsHome } from "@/lib/portal/proposals";
import { getPortalContractsHome } from "@/lib/portal/contracts";
import { getPortalChangeRequestAttention } from "@/lib/portal/change-requests";
import { formatMinorAmount } from "@/lib/money/format";
import { formatPortalDate, PORTAL_DELIVERABLE_STATUS } from "@/lib/portal/status-labels";

export type PortalApprovalItem = {
  id: string;
  kind:
    | "deliverable"
    | "proposal"
    | "contract"
    | "change_request";
  title: string;
  subtitle: string;
  projectName?: string | null;
  submittedAt: Date | null;
  submittedLabel: string | null;
  ctaLabel: string;
  ctaHref: string;
  canAct: boolean;
  meta?: string | null;
};

export type PortalApprovalHistoryItem = {
  id: string;
  kind: string;
  title: string;
  outcome: string;
  occurredAt: Date;
  href?: string;
};

export async function getPortalApprovals(portalUserId: string) {
  const projectIds = await listAccessibleProjectIds(portalUserId);
  const pending: PortalApprovalItem[] = [];
  const history: PortalApprovalHistoryItem[] = [];

  const [deliverables, proposalsHome, contractsHome, changeAttention] =
    await Promise.all([
      projectIds.length
        ? prisma.agencyDeliverable.findMany({
            where: {
              projectId: { in: projectIds },
              clientVisible: true,
              status: { in: ["READY_FOR_REVIEW", "CHANGES_REQUESTED"] },
            },
            orderBy: { updatedAt: "desc" },
            select: {
              id: true,
              title: true,
              status: true,
              updatedAt: true,
              projectId: true,
              project: { select: { name: true } },
              versions: {
                orderBy: { versionNumber: "desc" },
                take: 1,
                select: { submittedAt: true },
              },
            },
          })
        : Promise.resolve([]),
      getPortalProposalsHome(portalUserId),
      getPortalContractsHome(portalUserId),
      getPortalChangeRequestAttention(portalUserId),
    ]);

  for (const d of deliverables) {
    const role = await getPortalProjectRole({ projectId: d.projectId, portalUserId });
    pending.push({
      id: d.id,
      kind: "deliverable",
      title: d.title,
      subtitle: d.project.name,
      projectName: d.project.name,
      submittedAt: d.versions[0]?.submittedAt ?? d.updatedAt,
      submittedLabel: formatPortalDate(d.versions[0]?.submittedAt ?? d.updatedAt),
      ctaLabel: portalProjectRoleCanAct(role) ? "Review" : "View",
      ctaHref: `/portal/projects/${d.projectId}?tab=overview#deliverable-${d.id}`,
      canAct: portalProjectRoleCanAct(role),
      meta: PORTAL_DELIVERABLE_STATUS[d.status],
    });
  }

  for (const row of proposalsHome.needsAttention) {
    pending.push({
      id: row.proposal.id,
      kind: "proposal",
      title: row.proposal.title,
      subtitle: row.proposal.proposalNumber,
      submittedAt: row.proposal.sentAt,
      submittedLabel: formatPortalDate(row.proposal.sentAt),
      ctaLabel: "Review proposal",
      ctaHref: `/portal/proposals/${row.proposal.id}`,
      canAct: row.role === "DECISION_MAKER",
    });
  }

  for (const row of contractsHome.needsSignature) {
    pending.push({
      id: row.contract.id,
      kind: "contract",
      title: row.contract.title,
      subtitle: row.contract.contractNumber,
      submittedAt: row.contract.sentAt,
      submittedLabel: formatPortalDate(row.contract.sentAt),
      ctaLabel: "Review & sign",
      ctaHref: `/portal/contracts/${row.contract.id}`,
      canAct: row.role === "CLIENT_SIGNATORY",
    });
  }

  for (const cr of changeAttention) {
    pending.push({
      id: cr.changeRequestId,
      kind: "change_request",
      title: cr.title,
      subtitle: cr.projectName,
      projectName: cr.projectName,
      submittedAt: null,
      submittedLabel: null,
      ctaLabel: "Review change",
      ctaHref: cr.href,
      canAct: true,
      meta: `${formatMinorAmount(cr.priceImpactMinor, cr.currency)}${
        cr.timelineImpactDays > 0 ? ` · +${cr.timelineImpactDays} days` : ""
      }`,
    });
  }

  if (projectIds.length) {
    const [approvedDeliverables, acceptedProposals, signedContracts] = await Promise.all([
      prisma.agencyDeliverableReview.findMany({
        where: {
          reviewerPortalUserId: portalUserId,
          decision: "APPROVED",
        },
        orderBy: { createdAt: "desc" },
        take: 15,
        select: {
          id: true,
          createdAt: true,
          deliverable: {
            select: {
              id: true,
              title: true,
              projectId: true,
            },
          },
        },
      }),
      prisma.agencyProposalAcceptance.findMany({
        where: { portalUserId },
        orderBy: { acceptedAt: "desc" },
        take: 10,
        select: {
          id: true,
          acceptedAt: true,
          proposal: { select: { id: true, title: true } },
        },
      }),
      prisma.agencyContractSignature.findMany({
        where: { signerPortalUserId: portalUserId },
        orderBy: { signedAt: "desc" },
        take: 10,
        select: {
          id: true,
          signedAt: true,
          contract: { select: { id: true, title: true } },
        },
      }),
    ]);

    for (const r of approvedDeliverables) {
      history.push({
        id: r.id,
        kind: "deliverable",
        title: r.deliverable.title,
        outcome: "Approved",
        occurredAt: r.createdAt,
        href: `/portal/projects/${r.deliverable.projectId}`,
      });
    }
    for (const a of acceptedProposals) {
      history.push({
        id: a.id,
        kind: "proposal",
        title: a.proposal.title,
        outcome: "Accepted",
        occurredAt: a.acceptedAt,
        href: `/portal/proposals/${a.proposal.id}`,
      });
    }
    for (const s of signedContracts) {
      history.push({
        id: s.id,
        kind: "contract",
        title: s.contract.title,
        outcome: "Signed",
        occurredAt: s.signedAt,
        href: `/portal/contracts/${s.contract.id}`,
      });
    }
  }

  history.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());

  return { pending, history: history.slice(0, 20) };
}
