import { prisma } from "@/lib/db";
import { listAccessibleProjectIds } from "@/lib/portal/access";
import { listAccessibleProposals } from "@/lib/proposals/portal-access";
import type { ProspectHomeDto } from "@/lib/prospect/dto";
import { listBriefsForUser } from "@/lib/prospect/briefs/service";
import { listRequestsForUser } from "@/lib/prospect/requests/service";
import { listReviewsForUser } from "@/lib/prospect/reviews/service";

export async function getProspectHome(portalUserId: string): Promise<ProspectHomeDto> {
  const [profile, reviews, briefs, requests, projectIds, proposals] =
    await Promise.all([
      prisma.agencyProspectProfile.findUnique({ where: { portalUserId } }),
      listReviewsForUser(portalUserId),
      listBriefsForUser(portalUserId),
      listRequestsForUser(portalUserId),
      listAccessibleProjectIds(portalUserId),
      listAccessibleProposals(portalUserId),
    ]);

  const inProgressReview =
    reviews.find((r) => r.status === "FETCHING" || r.status === "ANALYZING") ??
    reviews.find((r) => r.status === "COMPLETED") ??
    null;

  const inProgressBrief =
    briefs.find((b) => b.status === "DRAFT" && b.completionPercent > 0) ??
    briefs.find((b) => b.status === "DRAFT") ??
    null;

  const activeRequest =
    requests.find(
      (r) =>
        r.status === "SUBMITTED" ||
        r.status === "BEING_REVIEWED" ||
        r.status === "NEEDS_INFORMATION",
    ) ??
    requests.find((r) => r.status === "PROPOSAL_READY") ??
    null;

  const proposalReady = proposals
    .filter(
      (row) =>
        row.proposal.status === "SENT" ||
        row.proposal.status === "CHANGES_REQUESTED",
    )
    .map((row) => ({
      proposalId: row.proposal.id,
      title: row.proposal.title,
      requestId: null as string | null,
    }));

  const proposalReadyRequests = requests.filter((r) => r.status === "PROPOSAL_READY");

  return {
    firstName: profile?.firstName ?? null,
    continueReview: inProgressReview,
    continueBrief: inProgressBrief,
    activeRequest,
    proposalReady: [
      ...proposalReady,
      ...proposalReadyRequests.map((r) => ({
        proposalId: "",
        title: r.title,
        requestId: r.id,
      })),
    ],
    hasClientAccess: projectIds.length > 0,
    recentReviews: reviews.slice(0, 5),
    recentBriefs: briefs.slice(0, 5),
  };
}

export async function getProspectAccount(portalUserId: string) {
  const user = await prisma.clientPortalUser.findUniqueOrThrow({
    where: { id: portalUserId },
    include: { contact: true, prospectProfile: true },
  });

  return {
    firstName: user.prospectProfile?.firstName ?? user.contact.firstName,
    lastName: user.prospectProfile?.lastName ?? user.contact.lastName,
    email: user.email,
    companyName: user.prospectProfile?.companyName ?? null,
    phone: user.prospectProfile?.phone ?? user.contact.phone,
    primaryWebsite: user.prospectProfile?.primaryWebsite ?? null,
  };
}
