import Link from "next/link";
import { notFound } from "next/navigation";
import { getPortalUser } from "@/lib/portal/session";
import { redirect } from "next/navigation";
import { assertProjectAccess } from "@/lib/portal/access";
import { getPortalProjectChangeRequests } from "@/lib/portal/change-requests";
import { PortalChangeRequestForm } from "@/components/portal/PortalChangeRequestPanels";
import { formatMinorAmount } from "@/lib/money/format";

export const dynamic = "force-dynamic";

export default async function PortalProjectChangesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getPortalUser();
  if (!user) redirect("/portal/login");
  const { id: projectId } = await params;
  await assertProjectAccess({ projectId, portalUserId: user.id });

  const items = await getPortalProjectChangeRequests(user.id, projectId);

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/portal/projects/${projectId}`} className="text-sm text-neutral-600 hover:underline">
          ← Project
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Change Requests</h1>
      </div>

      <PortalChangeRequestForm projectId={projectId} />

      <section className="rounded border">
        <ul className="divide-y">
          {items.map((cr) => (
            <li key={cr.id} className="flex items-center justify-between gap-3 p-4 text-sm">
              <div>
                <Link
                  href={`/portal/projects/${projectId}/changes/${cr.id}`}
                  className="font-medium hover:underline"
                >
                  {cr.changeRequestNumber}
                </Link>
                <div className="text-neutral-600">{cr.title}</div>
              </div>
              <div className="text-right">
                <div>{cr.statusLabel}</div>
                {cr.priceImpactMinor != null ? (
                  <div className="text-neutral-600">
                    {formatMinorAmount(cr.priceImpactMinor, cr.currency ?? "USD")}
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
        {!items.length ? <p className="p-4 text-sm text-neutral-600">No change requests yet.</p> : null}
      </section>
    </div>
  );
}
