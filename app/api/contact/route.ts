import { contactFormSchema } from "@/lib/validations";
import {
  getClientIp,
  isFormRateLimited,
  jsonError,
  jsonSuccess,
  publicContactEmail,
} from "@/lib/forms";
import {
  hashIpForRateLimit,
  submitContactEnquiry,
} from "@/lib/enquiries/service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body");
  }

  const parsed = contactFormSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      parsed.error.issues[0]?.message ?? "Validation failed",
      400,
    );
  }

  // Honeypot — pretend success, do not persist
  if (parsed.data._gotcha) {
    return jsonSuccess("Thanks — your message has been received.");
  }

  const ip = getClientIp(request);
  if (isFormRateLimited(`contact:${hashIpForRateLimit(ip)}`)) {
    return jsonError(
      "Too many requests. Please try again later.",
      429,
    );
  }

  const { _gotcha, ...payload } = parsed.data;
  void _gotcha;

  const result = await submitContactEnquiry({
    data: payload,
    sourcePath: "/contact",
  });

  if (!result.ok) {
    if (result.code === "FORM_DISABLED") {
      return jsonError(
        `${result.message} Please email us at ${publicContactEmail()}.`,
        503,
      );
    }
    return jsonError(
      `We couldn’t save your enquiry right now. Please try again or email us directly at ${publicContactEmail()}.`,
      502,
    );
  }

  // Persistence succeeded — notification failure does not force resubmit
  return jsonSuccess(
    "Thanks — your message has been received. We’ll review it and follow up with the most useful next step.",
    { reference: result.reference },
  );
}
