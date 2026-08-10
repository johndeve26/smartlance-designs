import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPortalProposalDetail } from "@/lib/portal/proposals";
import { getPortalUser } from "@/lib/portal/session";
import { PortalProposalView } from "@/components/portal/PortalProposalView";

export const dynamic = "force-dynamic";

export default async function PortalProposalDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ version?: string }>;
}) {
  const user = await getPortalUser();
  if (!user) redirect("/portal/login");

  const { id } = await params;
  const sp = await searchParams;

  try {
    const proposal = await getPortalProposalDetail({
      proposalId: id,
      portalUserId: user.id,
      contactId: user.contactId,
      versionId: sp.version,
    });

    return (
      <div className="space-y-4">
        <Link href="/portal/proposals" className="text-sm text-neutral-600 hover:underline">
          ← Proposals
        </Link>
        <PortalProposalView proposal={proposal} />
      </div>
    );
  } catch {
    notFound();
  }
}
