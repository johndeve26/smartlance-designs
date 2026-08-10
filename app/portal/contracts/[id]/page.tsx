import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPortalContractDetail } from "@/lib/portal/contracts";
import { getPortalUser } from "@/lib/portal/session";
import { PortalContractView } from "@/components/portal/PortalContractView";

export const dynamic = "force-dynamic";

export default async function PortalContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getPortalUser();
  if (!user) redirect("/portal/login");

  const { id } = await params;

  try {
    const contract = await getPortalContractDetail({
      contractId: id,
      portalUserId: user.id,
      contactId: user.contactId,
    });

    return (
      <div className="space-y-4">
        <Link href="/portal/contracts" className="text-sm text-neutral-600 hover:underline">
          ← Contracts
        </Link>
        <PortalContractView contract={contract} />
      </div>
    );
  } catch {
    notFound();
  }
}
