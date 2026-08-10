import { NextResponse } from "next/server";
import { z } from "zod";
import { getClientIp, isFormRateLimited } from "@/lib/forms";
import { getPortalUser } from "@/lib/portal/session";
import { startWebsiteReview } from "@/lib/prospect/reviews/service";
import { cookies } from "next/headers";

const startSchema = z.object({
  websiteUrl: z.string().min(3).max(500),
  businessName: z.string().max(200).optional(),
  goals: z.array(z.string()).max(10).optional(),
  focusNote: z.string().max(1000).optional(),
});

const CLAIM_COOKIE = "smartlance_prospect_pending_claim";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (isFormRateLimited(`prospect-review:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many review requests. Please try again later." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = startSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const user = await getPortalUser();

  if (user) {
    const accountLimit = isFormRateLimited(
      `prospect-review-account:${user.id}`,
      10,
      24 * 60 * 60 * 1000,
    );
    if (accountLimit) {
      return NextResponse.json(
        { error: "Daily review limit reached." },
        { status: 429 },
      );
    }
  }

  try {
    const result = await startWebsiteReview({
      ...parsed.data,
      portalUserId: user?.id,
    });

    if (result.claimToken) {
      const jar = await cookies();
      jar.set(
        CLAIM_COOKIE,
        JSON.stringify({
          reviewId: result.reviewId,
          claimToken: result.claimToken,
        }),
        { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 },
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not start review.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
