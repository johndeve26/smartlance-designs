"use server";

import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { z } from "zod";
import { assertSameOrigin, requireAdminUser } from "@/lib/admin/session";
import { createAIProviderForRole } from "@/lib/ai/providers";
import { AIProviderRequestError } from "@/lib/ai/providers/types";

const pingSchema = z.object({
  overallDirection: z.enum(["INSUFFICIENT_DATA"]),
  executiveSummary: z.string().max(200),
  strengths: z.array(z.unknown()),
  findings: z.array(z.unknown()),
  priorities: z.array(z.unknown()),
  nextSteps: z.array(z.string()),
});

function failRedirect(reason: string) {
  const safe = reason
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
  redirect(
    `/admin/ai-writer/settings?notice=prospect-ai-test&result=fail&reason=${encodeURIComponent(safe || "error")}#prospect-ai`,
  );
}

/** Verifies FAST_MODEL can return structured JSON like website review requires. */
export async function testProspectReviewAIAction() {
  await assertSameOrigin();
  await requireAdminUser("manage_ai_settings");

  try {
    const provider = await createAIProviderForRole("FAST_MODEL");
    await provider.generateStructured({
      modelRole: "FAST_MODEL",
      schema: pingSchema,
      schemaName: "WebsiteReviewAnalysis",
      maxTokens: 512,
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "Return JSON only matching the schema. Use overallDirection INSUFFICIENT_DATA and a short executiveSummary.",
        },
        {
          role: "user",
          content:
            'Ping test for website review AI. Evidence: [ev1] title — Home page title. Return minimal valid JSON.',
        },
      ],
    });
    redirect(
      "/admin/ai-writer/settings?notice=prospect-ai-test&result=ok#prospect-ai",
    );
  } catch (err) {
    if (isRedirectError(err)) throw err;
    if (err instanceof AIProviderRequestError) {
      failRedirect(`${err.code}-${err.message}`);
    }
    failRedirect(err instanceof Error ? err.message : "unknown-error");
  }
}
