import { prisma } from "@/lib/db";
import { decimalToMinorUnits } from "@/lib/money/minor-units";

export type ProjectCommercialScopeSummary = {
  currency: string;
  originalAcceptedValueMinor: number | null;
  approvedChangesMinor: number;
  currentApprovedValueMinor: number | null;
  invoicedChangeValueMinor: number;
  paidChangeValueMinor: number;
  unbilledApprovedChangeMinor: number;
};

export async function getProjectApprovedChangeValue(projectId: string) {
  const approved = await prisma.agencyChangeRequest.findMany({
    where: {
      projectId,
      status: { in: ["APPROVED", "APPLIED", "IMPLEMENTED"] },
    },
    include: {
      approval: { select: { approvedPriceImpactMinor: true, currency: true } },
      assessments: {
        where: { supersededAt: null },
        orderBy: { versionNumber: "desc" },
        take: 1,
        select: { priceImpactMinor: true, currency: true, classification: true },
      },
    },
  });

  let totalMinor = 0;
  let currency = "USD";

  for (const cr of approved) {
    if (cr.approval) {
      totalMinor += cr.approval.approvedPriceImpactMinor;
      currency = cr.approval.currency;
    } else {
      const assessment = cr.assessments[0];
      if (assessment?.classification === "IN_SCOPE") continue;
      totalMinor += assessment?.priceImpactMinor ?? 0;
      if (assessment?.currency) currency = assessment.currency;
    }
  }

  return { approvedChangesMinor: totalMinor, currency };
}

export async function getProjectCommercialScopeSummary(
  projectId: string,
): Promise<ProjectCommercialScopeSummary> {
  const project = await prisma.agencyProject.findUniqueOrThrow({
    where: { id: projectId },
    select: {
      currency: true,
      sourceProposalAcceptance: {
        select: { acceptedTotal: true, currency: true },
      },
    },
  });

  const originalAcceptedValueMinor = project.sourceProposalAcceptance
    ? decimalToMinorUnits(
        project.sourceProposalAcceptance.acceptedTotal,
        project.sourceProposalAcceptance.currency,
      )
    : null;

  const currency =
    project.sourceProposalAcceptance?.currency ?? project.currency ?? "USD";

  const { approvedChangesMinor } = await getProjectApprovedChangeValue(projectId);

  const changeInvoices = await prisma.agencyInvoice.findMany({
    where: {
      projectId,
      changeRequestId: { not: null },
      status: { notIn: ["VOID", "WRITTEN_OFF"] },
    },
    select: {
      status: true,
      totalMinor: true,
      amountPaidMinor: true,
      currency: true,
    },
  });

  let invoicedChangeValueMinor = 0;
  let paidChangeValueMinor = 0;
  for (const inv of changeInvoices) {
    if (inv.status === "DRAFT") continue;
    invoicedChangeValueMinor += inv.totalMinor;
    paidChangeValueMinor += inv.amountPaidMinor;
  }

  const currentApprovedValueMinor =
    originalAcceptedValueMinor != null
      ? originalAcceptedValueMinor + approvedChangesMinor
      : approvedChangesMinor > 0
        ? approvedChangesMinor
        : null;

  const unbilledApprovedChangeMinor = Math.max(
    0,
    approvedChangesMinor - invoicedChangeValueMinor,
  );

  return {
    currency,
    originalAcceptedValueMinor,
    approvedChangesMinor,
    currentApprovedValueMinor,
    invoicedChangeValueMinor,
    paidChangeValueMinor,
    unbilledApprovedChangeMinor,
  };
}

export async function getChangeRequestBaseline(projectId: string) {
  const project = await prisma.agencyProject.findUniqueOrThrow({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      projectNumber: true,
      currency: true,
      summary: true,
      sourceProposalAcceptanceId: true,
      sourceProposalAcceptance: {
        select: {
          id: true,
          acceptedAt: true,
          acceptedTotal: true,
          currency: true,
          scopeHash: true,
          proposal: {
            select: {
              id: true,
              proposalNumber: true,
              title: true,
              currentVersionId: true,
            },
          },
          acceptedVersionId: true,
        },
      },
      contracts: {
        where: { status: { in: ["SIGNED", "PARTIALLY_SIGNED", "SENT"] } },
        orderBy: { updatedAt: "desc" },
        take: 1,
        select: { id: true, contractNumber: true, status: true },
      },
    },
  });

  const acceptance = project.sourceProposalAcceptance;
  let scopeItems: Array<{ id: string; title: string; description: string | null }> = [];
  let deliverables: Array<{ id: string; title: string; description: string | null }> = [];

  if (acceptance?.acceptedVersionId) {
    const version = await prisma.agencyProposalVersion.findUnique({
      where: { id: acceptance.acceptedVersionId },
      select: {
        scopeItems: { orderBy: { position: "asc" }, select: { id: true, title: true, description: true } },
        deliverables: {
          orderBy: { position: "asc" },
          select: { id: true, title: true, description: true },
        },
      },
    });
    scopeItems = version?.scopeItems ?? [];
    deliverables = version?.deliverables ?? [];
  }

  return {
    source: acceptance ? ("PROPOSAL_ACCEPTANCE" as const) : ("MANUAL_PROJECT" as const),
    project,
    acceptance,
    scopeItems,
    deliverables,
    contract: project.contracts[0] ?? null,
  };
}
