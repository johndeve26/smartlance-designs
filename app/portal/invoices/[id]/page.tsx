import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getPortalUser } from "@/lib/portal/session";
import { getPortalInvoiceDetail } from "@/lib/portal/billing";
import { PortalInvoiceView } from "@/components/portal/PortalInvoiceView";

export const dynamic = "force-dynamic";

export default async function PortalInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getPortalUser();
  if (!user) redirect("/portal/login");

  const { id } = await params;

  try {
    const invoice = await getPortalInvoiceDetail({
      invoiceId: id,
      portalUserId: user.id,
      contactId: user.contactId,
    });
    return (
      <div className="space-y-4">
        <Link href="/portal/billing" className="text-sm text-neutral-600 hover:underline">
          ← Billing
        </Link>
        <PortalInvoiceView invoice={invoice} />
      </div>
    );
  } catch {
    notFound();
  }
}
