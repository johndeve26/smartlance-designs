import { prisma } from "@/lib/db";
import { hashClaimToken } from "@/lib/prospect/tokens";

export type ClaimResourceType = "review" | "brief";

export async function claimProspectResource(input: {
  type: ClaimResourceType;
  resourceId: string;
  claimToken: string;
  portalUserId: string;
}): Promise<{ claimed: boolean; alreadyOwned?: boolean }> {
  const tokenHash = hashClaimToken(input.claimToken);

  if (input.type === "review") {
    const review = await prisma.agencyWebsiteReview.findUnique({
      where: { id: input.resourceId },
    });
    if (!review) throw new Error("Review not found.");
    if (review.portalUserId === input.portalUserId) {
      return { claimed: true, alreadyOwned: true };
    }
    if (review.portalUserId && review.portalUserId !== input.portalUserId) {
      throw new Error("This review belongs to another account.");
    }
    if (review.claimTokenHash !== tokenHash) {
      throw new Error("Invalid claim token.");
    }
    if (review.claimTokenUsedAt) {
      throw new Error("This claim link has already been used.");
    }

    await prisma.agencyWebsiteReview.update({
      where: { id: review.id },
      data: {
        portalUserId: input.portalUserId,
        claimTokenUsedAt: new Date(),
        claimTokenHash: null,
      },
    });
    return { claimed: true };
  }

  const brief = await prisma.agencyWebsiteBrief.findUnique({
    where: { id: input.resourceId },
  });
  if (!brief) throw new Error("Brief not found.");
  if (brief.portalUserId === input.portalUserId) {
    return { claimed: true, alreadyOwned: true };
  }
  if (brief.portalUserId && brief.portalUserId !== input.portalUserId) {
    throw new Error("This brief belongs to another account.");
  }
  if (brief.claimTokenHash !== tokenHash) {
    throw new Error("Invalid claim token.");
  }
  if (brief.claimTokenUsedAt) {
    throw new Error("This claim link has already been used.");
  }

  await prisma.agencyWebsiteBrief.update({
    where: { id: brief.id },
    data: {
      portalUserId: input.portalUserId,
      claimTokenUsedAt: new Date(),
      claimTokenHash: null,
    },
  });
  return { claimed: true };
}

export async function claimAllPendingForToken(input: {
  claimToken: string;
  portalUserId: string;
  reviewId?: string;
  briefId?: string;
}) {
  const results: ClaimResourceType[] = [];
  if (input.reviewId) {
    await claimProspectResource({
      type: "review",
      resourceId: input.reviewId,
      claimToken: input.claimToken,
      portalUserId: input.portalUserId,
    });
    results.push("review");
  }
  if (input.briefId) {
    await claimProspectResource({
      type: "brief",
      resourceId: input.briefId,
      claimToken: input.claimToken,
      portalUserId: input.portalUserId,
    });
    results.push("brief");
  }
  return results;
}
