import { redirect, notFound } from "next/navigation";
import { getPortalUser } from "@/lib/portal/session";
import {
  getPortalWebsiteDetail,
  listPortalWebsiteCareEvents,
  listPortalWebsiteSupport,
} from "@/lib/portal/websites";
import { PortalWebsiteHub } from "@/components/portal/PortalWebsiteHub";

export const dynamic = "force-dynamic";

export default async function PortalWebsiteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getPortalUser();
  if (!user) redirect("/portal/login");

  const { id } = await params;
  const detail = await getPortalWebsiteDetail(user.id, id);
  if (!detail) notFound();

  const [careEvents, support] = await Promise.all([
    listPortalWebsiteCareEvents(user.id, id),
    listPortalWebsiteSupport(user.id, id),
  ]);

  return (
    <PortalWebsiteHub
      websiteId={id}
      detail={detail}
      careEvents={careEvents}
      support={support}
    />
  );
}
