import { redirect, notFound } from "next/navigation";
import { getPortalUser } from "@/lib/portal/session";
import { getBriefForAccess } from "@/lib/prospect/briefs/service";
import { WebsiteBriefBuilder } from "@/components/prospect/WebsiteBriefBuilder";

export default async function WorkspaceBriefDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getPortalUser();
  if (!user) redirect("/workspace/login");

  const { id } = await params;
  const brief = await getBriefForAccess(id, { portalUserId: user.id });
  if (!brief) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <WebsiteBriefBuilder
        briefId={id}
        isAuthenticated
        sourceReviewId={brief.sourceReviewId ?? undefined}
      />
    </div>
  );
}
