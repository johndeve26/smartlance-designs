"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getClientIp, isFormRateLimited } from "@/lib/forms";
import { getPortalUser } from "@/lib/portal/session";
import {
  acceptProspectMagicLink,
  registerProspectAccount,
  requestProspectMagicLink,
} from "@/lib/prospect/auth";
import { claimAllPendingForToken } from "@/lib/prospect/claim";
import { createBrief, saveBrief } from "@/lib/prospect/briefs/service";
import { submitProspectRequest, respondToClarification } from "@/lib/prospect/requests/service";
import { startWebsiteReview } from "@/lib/prospect/reviews/service";
import { upsertProspectProfile } from "@/lib/prospect/profile";
import type { TemplateValues } from "@/components/templates/brief-plain-text";
import type { AgencyProspectRequestSourceDetail } from "@prisma/client";

const CLAIM_COOKIE = "smartlance_prospect_pending_claim";

export async function startReviewAction(formData: FormData) {
  const websiteUrl = String(formData.get("websiteUrl") ?? "");
  const businessName = String(formData.get("businessName") ?? "") || undefined;
  const goals = formData.getAll("goals").map(String);
  const focusNote = String(formData.get("focusNote") ?? "") || undefined;

  const user = await getPortalUser();

  const result = await startWebsiteReview({
    websiteUrl,
    businessName,
    goals,
    focusNote,
    portalUserId: user?.id,
  });

  if (result.claimToken) {
    const jar = await cookies();
    jar.set(
      CLAIM_COOKIE,
      JSON.stringify({ reviewId: result.reviewId, claimToken: result.claimToken }),
      { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 },
    );
  }

  return result;
}

export async function registerProspectAction(input: {
  email: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  phone?: string;
  primaryWebsite?: string;
  claimReviewId?: string;
  claimBriefId?: string;
}) {
  const { portalUser } = await registerProspectAccount(input);

  const jar = await cookies();
  const pending = jar.get(CLAIM_COOKIE)?.value;
  if (pending) {
    try {
      const parsed = JSON.parse(pending) as {
        reviewId?: string;
        briefId?: string;
        claimToken?: string;
      };
      if (parsed.claimToken) {
        await claimAllPendingForToken({
          claimToken: parsed.claimToken,
          portalUserId: portalUser.id,
          reviewId: input.claimReviewId ?? parsed.reviewId,
          briefId: input.claimBriefId ?? parsed.briefId,
        });
      }
    } catch {
      /* ignore */
    }
    jar.delete(CLAIM_COOKIE);
  }

  redirect("/workspace");
}

export async function requestMagicLinkAction(email: string) {
  return requestProspectMagicLink(email);
}

export async function saveBriefAction(briefId: string, answers: TemplateValues) {
  const user = await getPortalUser();
  if (!user) throw new Error("Sign in required.");
  return saveBrief({ briefId, portalUserId: user.id, answers });
}

export async function createBriefAction(sourceReviewId?: string) {
  const user = await getPortalUser();
  const result = await createBrief({
    portalUserId: user?.id,
    sourceReviewId,
  });
  if (result.claimToken) {
    const jar = await cookies();
    jar.set(
      CLAIM_COOKIE,
      JSON.stringify({ briefId: result.briefId, claimToken: result.claimToken }),
      { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 },
    );
  }
  return result;
}

export async function submitRequestAction(input: {
  briefId: string;
  reviewId?: string;
  submissionIdempotencyKey: string;
  sourceDetail: AgencyProspectRequestSourceDetail;
}) {
  const user = await getPortalUser();
  if (!user) throw new Error("Sign in required.");
  return submitProspectRequest({
    portalUserId: user.id,
    ...input,
  });
}

export async function respondClarificationAction(requestId: string, body: string) {
  const user = await getPortalUser();
  if (!user) throw new Error("Sign in required.");
  await respondToClarification({
    requestId,
    portalUserId: user.id,
    body,
  });
}

export async function updateAccountAction(input: {
  firstName?: string;
  lastName?: string;
  companyName?: string;
  phone?: string;
  primaryWebsite?: string;
}) {
  const user = await getPortalUser();
  if (!user) throw new Error("Sign in required.");
  await upsertProspectProfile({
    portalUserId: user.id,
    ...input,
  });
}

export async function getPendingClaimFromCookie() {
  const jar = await cookies();
  const raw = jar.get(CLAIM_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as {
      reviewId?: string;
      briefId?: string;
      claimToken?: string;
    };
  } catch {
    return null;
  }
}
