import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPortalProjectOnboarding } from "@/lib/portal/onboarding";
import { getPortalUser } from "@/lib/portal/session";
import { PortalOnboardingWorkspace } from "@/components/portal/PortalOnboardingWorkspace";

export const dynamic = "force-dynamic";

export default async function PortalProjectOnboardingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getPortalUser();
  if (!user) redirect("/portal/login");

  const { id: projectId } = await params;
  const data = await getPortalProjectOnboarding(user.id, projectId);
  if (!data) notFound();

  return (
    <div className="space-y-4">
      <Link href={`/portal/projects/${projectId}`} className="text-sm text-neutral-600 hover:underline">
        ← Back to project
      </Link>
      <PortalOnboardingWorkspace data={data} />
    </div>
  );
}
