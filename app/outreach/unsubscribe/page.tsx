import Link from "next/link";
import { processOutreachOptOut } from "@/lib/crm/outreach/opt-out";

export const dynamic = "force-dynamic";

export default async function OutreachOptOutPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const sp = await searchParams;
  const token = sp.token?.trim();

  if (!token) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Invalid link</h1>
        <p className="mt-2 text-neutral-600">This opt-out link is not valid.</p>
      </main>
    );
  }

  const result = await processOutreachOptOut(token);

  return (
    <main className="mx-auto max-w-lg px-4 py-16 text-center">
      {result.ok ? (
        <>
          <h1 className="text-xl font-semibold">You&apos;ve been opted out</h1>
          <p className="mt-2 text-neutral-600">
            We will not send further sales outreach emails to this address.
            This does not affect any separate marketing subscriptions you may have
            managed elsewhere.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-xl font-semibold">Link expired or invalid</h1>
          <p className="mt-2 text-neutral-600">
            If you need help, please contact us directly.
          </p>
        </>
      )}
      <Link href="/" className="mt-6 inline-block text-sm text-neutral-700 underline">
        Return to site
      </Link>
    </main>
  );
}
