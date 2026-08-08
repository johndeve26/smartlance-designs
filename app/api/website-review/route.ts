import { websiteReviewSchema } from "@/lib/validations";
import {
  getClientIp,
  isFormRateLimited,
  jsonError,
  jsonSuccess,
  publicContactEmail,
} from "@/lib/forms";
import {
  hashIpForRateLimit,
  submitWebsiteReviewEnquiry,
} from "@/lib/enquiries/service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body");
  }

  const parsed = websiteReviewSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      parsed.error.issues[0]?.message ?? "Validation failed",
      400,
    );
  }

  if (parsed.data._gotcha) {
    return jsonSuccess(
      "Thanks — your website review request has been received.",
    );
  }

  const ip = getClientIp(request);
  if (isFormRateLimited(`website-review:${hashIpForRateLimit(ip)}`)) {
    return jsonError("Too many requests. Please try again later.", 429);
  }

  const { _gotcha, ...payload } = parsed.data;
  void _gotcha;

  const result = await submitWebsiteReviewEnquiry({
    data: payload,
    sourcePath: "/free-website-review",
  });

  if (!result.ok) {
    if (result.code === "FORM_DISABLED") {
      return jsonError(
        `${result.message} Please email us at ${publicContactEmail()}.`,
        503,
      );
    }
    return jsonError(
      `We could not save your request right now. Please email us directly at ${publicContactEmail()} or try again shortly.`,
      502,
    );
  }

  return jsonSuccess(
    "Thanks — your website review request has been received.",
    { reference: result.reference },
  );
}
