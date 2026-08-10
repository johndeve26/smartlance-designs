import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPortalUser } from "@/lib/portal/session";
import { getReviewForAccess } from "@/lib/prospect/reviews/service";

const CLAIM_COOKIE = "smartlance_prospect_pending_claim";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const user = await getPortalUser();
  let claimToken: string | undefined;

  if (!user) {
    const jar = await cookies();
    const raw = jar.get(CLAIM_COOKIE)?.value;
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as {
          reviewId?: string;
          claimToken?: string;
        };
        if (parsed.reviewId === id) claimToken = parsed.claimToken;
      } catch {
        /* ignore */
      }
    }
  }

  const review = await getReviewForAccess(id, {
    portalUserId: user?.id,
    claimToken,
  });

  if (!review) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json(review, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
