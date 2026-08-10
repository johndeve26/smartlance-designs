import { prisma } from "@/lib/db";

export async function getDealProposalPrefill(dealId: string) {
  const deal = await prisma.crmDeal.findUnique({
    where: { id: dealId },
    include: {
      contact: { include: { company: true } },
      company: true,
      owner: { select: { id: true, name: true } },
    },
  });
  if (!deal) return null;

  const existingProposals = await prisma.agencyProposal.findMany({
    where: { dealId },
    select: { id: true, proposalNumber: true, status: true, title: true },
    orderBy: { updatedAt: "desc" },
  });

  const existingProject = await prisma.agencyProject.findUnique({
    where: { sourceDealId: dealId },
    select: { id: true, projectNumber: true, name: true },
  });

  return {
    deal,
    existingProposals,
    existingProject,
    prefill: {
      title: deal.title,
      primaryContactId: deal.contactId,
      companyId: deal.companyId ?? deal.contact.companyId,
      ownerId: deal.ownerId,
      currency: deal.currency ?? "USD",
      amount: deal.amount ? Number(deal.amount) : null,
      servicesInterested: deal.servicesInterested,
      summary: deal.lostNote?.trim() || null,
    },
  };
}
