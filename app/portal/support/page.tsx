import Link from "next/link";
import { redirect } from "next/navigation";
import { getPortalUser } from "@/lib/portal/session";
import { listPortalSupportHome } from "@/lib/portal/support";
import { PortalPageHeader, PortalPrimaryButton } from "@/components/portal/PortalShell";
import { PortalSupportList } from "@/components/portal/PortalSupportPanels";

export const dynamic = "force-dynamic";

export default async function PortalSupportPage() {
  const user = await getPortalUser();
  if (!user) redirect("/portal/login");

  const support = await listPortalSupportHome(user.id);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <PortalPageHeader
          title="Support"
          description="Track help requests for your managed websites."
        />
        <PortalPrimaryButton href="/portal/support/new">New request</PortalPrimaryButton>
      </div>
      <PortalSupportList
        needsResponse={support.needsResponse}
        open={support.open}
        resolved={support.resolved}
      />
      <p className="mt-4 text-sm text-neutral-600">
        <Link href="/portal/websites" className="text-[#F47A48] hover:underline">
          View your websites
        </Link>
      </p>
    </div>
  );
}
