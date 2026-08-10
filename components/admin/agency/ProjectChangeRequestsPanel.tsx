import Link from "next/link";
import { listProjectChangeRequests } from "@/lib/change-requests";
import { CHANGE_REQUEST_STATUS_LABELS } from "@/lib/change-requests/constants";
import { formatMinorAmount } from "@/lib/money/format";
import { CreateChangeRequestForm } from "@/components/admin/agency/CreateChangeRequestForm";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";

export async function ProjectChangeRequestsPanel({
  projectId,
  canManage,
}: {
  projectId: string;
  canManage: boolean;
}) {
  const items = await listProjectChangeRequests(projectId);

  return (
    <AdminPanel>
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">Change Requests</h2>
        <Link href="/admin/agency/change-requests" className="text-sm hover:underline">
          View all
        </Link>
      </div>

      {canManage ? <CreateChangeRequestForm projectId={projectId} /> : null}

      <ul className="mt-4 divide-y text-sm">
        {items.map((cr) => {
          const assessment = cr.assessments[0];
          const priceMinor =
            cr.approval?.approvedPriceImpactMinor ?? assessment?.priceImpactMinor ?? 0;
          const currency = cr.approval?.currency ?? assessment?.currency ?? "USD";
          return (
            <li key={cr.id} className="flex items-center justify-between gap-2 py-2">
              <div>
                <Link href={`/admin/agency/change-requests/${cr.id}`} className="font-medium hover:underline">
                  {cr.changeRequestNumber}
                </Link>
                <div className="text-neutral-600">{cr.title}</div>
              </div>
              <div className="text-right">
                <div>{CHANGE_REQUEST_STATUS_LABELS[cr.status]}</div>
                <div className="text-neutral-600">{formatMinorAmount(priceMinor, currency)}</div>
              </div>
            </li>
          );
        })}
      </ul>
      {!items.length ? <p className="mt-3 text-sm text-neutral-600">No change requests yet.</p> : null}
    </AdminPanel>
  );
}
