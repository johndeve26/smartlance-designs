import { subscribeFormSchema, parseSubscribePayload, subscribeToAudience } from "@/lib/audience";
import {
  getClientIp,
  isFormRateLimited,
  jsonError,
  jsonSuccess,
} from "@/lib/forms";
import { hashIpForRateLimit } from "@/lib/enquiries/service";
import { normalizeSubscriberEmail } from "@/lib/audience/schema";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body");
  }

  const parsed = subscribeFormSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Validation failed", 400);
  }

  if (parsed.data._gotcha) {
    return jsonSuccess("Thanks — check your inbox to confirm your subscription.");
  }

  const ip = getClientIp(request);
  const emailKey = normalizeSubscriberEmail(parsed.data.email);
  if (
    isFormRateLimited(`subscribe:ip:${hashIpForRateLimit(ip)}`, 8, 60 * 60 * 1000) ||
    isFormRateLimited(`subscribe:email:${emailKey}`, 5, 60 * 60 * 1000)
  ) {
    return jsonError("Too many requests. Please try again later.", 429);
  }

  const { _gotcha, ...rest } = parsed.data;
  void _gotcha;

  try {
    const result = await subscribeToAudience(parseSubscribePayload(rest));
    return jsonSuccess(result.message);
  } catch (error) {
    if (error instanceof Error && error.message.includes("unavailable")) {
      return jsonError("Subscriptions are temporarily unavailable.", 503);
    }
    console.error("[subscribe:api]", error instanceof Error ? error.message : "failed");
    return jsonError("We could not process your subscription. Please try again later.", 502);
  }
}
