import { redirect } from "next/navigation";
import { getPortalUser } from "@/lib/portal/session";
import { listPortalWebsitesForSupportForm } from "@/lib/portal/support";
import { PortalPageHeader } from "@/components/portal/PortalShell";
import { PortalSupportCreateForm } from "@/components/portal/PortalSupportPanels";

export const dynamic = "force-dynamic";

export default async function PortalSupportNewPage({
  searchParams,
}: {
  searchParams: Promise<{ website?: string }>;
}) {
  const user = await getPortalUser();
  if (!user) redirect("/portal/login");

  const params = await searchParams;
  const websites = await listPortalWebsitesForSupportForm(user.id);

  return (
    <div>
      <PortalPageHeader
        title="Request support"
        description="Tell us what you need help with."
      />
      <PortalSupportCreateForm
        websites={websites}
        defaultWebsiteId={params.website}
      />
    </div>
  );
}
