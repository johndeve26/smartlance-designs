import { redirect, notFound } from "next/navigation";
import { getPortalUser } from "@/lib/portal/session";
import { getPortalSupportDetail } from "@/lib/portal/support";
import { PortalSupportDetailView } from "@/components/portal/PortalSupportPanels";

export const dynamic = "force-dynamic";

export default async function PortalSupportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getPortalUser();
  if (!user) redirect("/portal/login");

  const { id } = await params;

  try {
    const detail = await getPortalSupportDetail(user.id, id);
    return <PortalSupportDetailView detail={detail} />;
  } catch {
    notFound();
  }
}
