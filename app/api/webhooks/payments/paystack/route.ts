import { NextResponse } from "next/server";
import { processPaymentWebhook } from "@/lib/billing/webhook";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  try {
    const result = await processPaymentWebhook({
      provider: "PAYSTACK",
      rawBody,
      signature,
    });
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error("[paystack:webhook]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Webhook failed" },
      { status: 400 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
