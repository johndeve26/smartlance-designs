import Link from "next/link";
import { redirect } from "next/navigation";
import { getPortalUser } from "@/lib/portal/session";
import { portalVerifyPaymentReturn } from "@/lib/portal/billing-actions";

export const dynamic = "force-dynamic";

export default async function PortalBillingReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  const user = await getPortalUser();
  if (!user) redirect("/portal/login");

  const sp = await searchParams;
  const reference = sp.reference?.trim();
  if (!reference) {
    return (
      <div className="rounded border bg-white p-6">
        <h1 className="text-xl font-semibold">Payment status unknown</h1>
        <p className="mt-2 text-sm text-neutral-600">
          We could not verify your payment from this link. Check your invoice for the latest status.
        </p>
        <Link href="/portal/billing" className="mt-4 inline-block text-sm hover:underline">
          ← Billing
        </Link>
      </div>
    );
  }

  const result = await portalVerifyPaymentReturn(reference);

  return (
    <div className="rounded border bg-white p-6">
      <h1 className="text-xl font-semibold">
        {result.confirmed ? "Payment confirmed" : "Verifying payment"}
      </h1>
      <p className="mt-2 text-sm text-neutral-600">
        {result.confirmed
          ? "Thank you — your payment has been recorded."
          : "We're verifying your payment with the provider. Your invoice will update once confirmation is complete. Returning from checkout alone does not mark an invoice paid."}
      </p>
      {result.invoiceId ? (
        <Link href={`/portal/invoices/${result.invoiceId}`} className="mt-4 inline-block text-sm hover:underline">
          View invoice
        </Link>
      ) : (
        <Link href="/portal/billing" className="mt-4 inline-block text-sm hover:underline">
          ← Billing
        </Link>
      )}
    </div>
  );
}
