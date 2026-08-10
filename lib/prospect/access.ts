import { prisma } from "@/lib/db";
import { hashClaimToken } from "@/lib/prospect/tokens";

export type ProspectAccessContext = {
  portalUserId?: string | null;
  claimToken?: string | null;
};

export async function assertReviewAccess(
  reviewId: string,
  ctx: ProspectAccessContext,
): Promise<{ id: string; portalUserId: string | null; claimTokenHash: string | null }> {
  const review = await prisma.agencyWebsiteReview.findUnique({
    where: { id: reviewId },
    select: { id: true, portalUserId: true, claimTokenHash: true },
  });
  if (!review) throw new ProspectAccessError("Review not found.");

  if (ctx.portalUserId && review.portalUserId === ctx.portalUserId) {
    return review;
  }

  if (ctx.claimToken && review.claimTokenHash) {
    const hash = hashClaimToken(ctx.claimToken);
    if (hash === review.claimTokenHash && !review.portalUserId) {
      return review;
    }
  }

  throw new ProspectAccessError("You do not have access to this review.");
}

export async function assertBriefAccess(
  briefId: string,
  ctx: ProspectAccessContext,
): Promise<{ id: string; portalUserId: string | null; claimTokenHash: string | null }> {
  const brief = await prisma.agencyWebsiteBrief.findUnique({
    where: { id: briefId },
    select: { id: true, portalUserId: true, claimTokenHash: true },
  });
  if (!brief) throw new ProspectAccessError("Brief not found.");

  if (ctx.portalUserId && brief.portalUserId === ctx.portalUserId) {
    return brief;
  }

  if (ctx.claimToken && brief.claimTokenHash) {
    const hash = hashClaimToken(ctx.claimToken);
    if (hash === brief.claimTokenHash && !brief.portalUserId) {
      return brief;
    }
  }

  throw new ProspectAccessError("You do not have access to this brief.");
}

export async function assertRequestAccess(
  requestId: string,
  portalUserId: string,
): Promise<{ id: string; portalUserId: string }> {
  const request = await prisma.agencyProspectRequest.findUnique({
    where: { id: requestId },
    select: { id: true, portalUserId: true },
  });
  if (!request || request.portalUserId !== portalUserId) {
    throw new ProspectAccessError("You do not have access to this request.");
  }
  return request;
}

export class ProspectAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProspectAccessError";
  }
}
