import { redirect } from "next/navigation";
import { getPortalUser } from "@/lib/portal/session";
import { getPortalDocuments } from "@/lib/portal/documents";
import { PortalPageHeader } from "@/components/portal/PortalShell";
import { PortalDocumentsView } from "@/components/portal/PortalDocuments";

export const dynamic = "force-dynamic";

export default async function PortalDocumentsPage() {
  const user = await getPortalUser();
  if (!user) redirect("/portal/login");

  const { proposals, contracts } = await getPortalDocuments(user.id);

  return (
    <div>
      <PortalPageHeader
        title="Documents"
        description="Your proposals and contracts with Smartlance."
      />
      <PortalDocumentsView proposals={proposals} contracts={contracts} />
    </div>
  );
}
