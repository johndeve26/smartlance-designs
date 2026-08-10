import { NextResponse } from "next/server";
import { z } from "zod";
import { getClientIp, isFormRateLimited } from "@/lib/forms";
import { getPortalUser } from "@/lib/portal/session";
import { improveBriefField } from "@/lib/prospect/ai/brief-assistant";

const contextRowSchema = z.object({
  fieldId: z.string().max(100),
  label: z.string().max(200),
  value: z.string().max(500),
});

const schema = z.object({
  fieldId: z.string().max(100),
  fieldLabel: z.string().max(200),
  currentValue: z.string().max(5000),
  roughNotes: z.string().max(2000).optional(),
  fieldHelp: z.string().max(500).optional(),
  fieldPlaceholder: z.string().max(500).optional(),
  sectionTitle: z.string().max(200).optional(),
  briefContext: z.array(contextRowSchema).max(12).optional(),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (isFormRateLimited(`prospect-brief-ai:${ip}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  const user = await getPortalUser();
  if (user) {
    if (
      isFormRateLimited(`prospect-brief-ai-user:${user.id}`, 30, 60 * 60 * 1000)
    ) {
      return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
    }
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  try {
    const result = await improveBriefField(parsed.data);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Could not generate suggestion right now." },
      { status: 503 },
    );
  }
}
