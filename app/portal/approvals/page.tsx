import { redirect } from "next/navigation";
import { getPortalUser } from "@/lib/portal/session";
import { getPortalApprovals } from "@/lib/portal/approvals";
import { PortalPageHeader } from "@/components/portal/PortalShell";
import { ApprovalCenter } from "@/components/portal/ApprovalCenter";

export const dynamic = "force-dynamic";

export default async function PortalApprovalsPage() {
  const user = await getPortalUser();
  if (!user) redirect("/portal/login");

  const { pending, history } = await getPortalApprovals(user.id);

  return (
    <div>
      <PortalPageHeader
        title="Approvals"
        description="Everything that needs your review or signature."
      />
      <ApprovalCenter pending={pending} history={history} />
    </div>
  );
}
