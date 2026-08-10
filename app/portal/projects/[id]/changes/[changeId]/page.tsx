import Link from "next/link";
import { notFound } from "next/navigation";
import { getPortalUser } from "@/lib/portal/session";
import { redirect } from "next/navigation";
import { getPortalChangeRequestDetail } from "@/lib/portal/change-requests";
import {
  PortalChangeApprovalActions,
  PortalClarificationForm,
} from "@/components/portal/PortalChangeRequestPanels";

export const dynamic = "force-dynamic";

export default async function PortalChangeRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string; changeId: string }>;
}) {
  const user = await getPortalUser();
  if (!user) redirect("/portal/login");
  const { id: projectId, changeId } = await params;

  let detail;
  try {
    detail = await getPortalChangeRequestDetail(user.id, projectId, changeId);
  } catch {
    notFound();
  }

  const { changeRequest, baseline, assessment, commercial, canApprove, canRespondToClarification } =
    detail;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/portal/projects/${projectId}/changes`}
          className="text-sm text-neutral-600 hover:underline"
        >
          ← Change Requests
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{changeRequest.changeRequestNumber}</h1>
        <p className="text-sm text-neutral-600">{changeRequest.title}</p>
        <p className="mt-1 text-sm">{changeRequest.statusLabel}</p>
      </div>

      <section className="rounded border p-4">
        <h2 className="font-semibold">Your request</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm">{changeRequest.requestDescription}</p>
      </section>

      <section className="rounded border p-4">
        <h2 className="font-semibold">Original agreed scope</h2>
        {baseline.source === "PROPOSAL_ACCEPTANCE" ? (
          <dl className="mt-2 space-y-1 text-sm">
            <div>
              <dt className="text-neutral-600">Proposal</dt>
              <dd>{baseline.proposalNumber}</dd>
            </div>
            <div>
              <dt className="text-neutral-600">Accepted value</dt>
              <dd>{commercial.originalAcceptedValue ?? "—"}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-2 text-sm text-neutral-600">Manual project scope.</p>
        )}
      </section>

      {assessment ? (
        <section className="rounded border p-4">
          <h2 className="font-semibold">Smartlance assessment</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-neutral-600">Classification</dt>
              <dd>{changeRequest.classificationLabel}</dd>
            </div>
            {assessment.clientScopeImpactSummary ? (
              <div>
                <dt className="text-neutral-600">Scope impact</dt>
                <dd className="whitespace-pre-wrap">{assessment.clientScopeImpactSummary}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-neutral-600">Additional cost</dt>
              <dd>{commercial.thisChangePrice}</dd>
            </div>
            <div>
              <dt className="text-neutral-600">Timeline impact</dt>
              <dd>
                {assessment.timelineImpactDays > 0
                  ? `+${assessment.timelineImpactDays} days`
                  : "No change"}
                {assessment.timelineImpactSummary ? ` — ${assessment.timelineImpactSummary}` : null}
              </dd>
            </div>
          </dl>
          <dl className="mt-4 grid gap-2 border-t pt-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-neutral-600">Original accepted value</dt>
              <dd>{commercial.originalAcceptedValue ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-neutral-600">Approved changes (total)</dt>
              <dd>{commercial.approvedChanges}</dd>
            </div>
            <div>
              <dt className="text-neutral-600">Current approved value</dt>
              <dd>{commercial.currentApprovedValue ?? "—"}</dd>
            </div>
          </dl>
        </section>
      ) : null}

      {canRespondToClarification ? (
        <PortalClarificationForm changeRequestId={changeRequest.id} />
      ) : null}

      {canApprove ? <PortalChangeApprovalActions changeRequestId={changeRequest.id} /> : null}

      {detail.approval ? (
        <section className="rounded border border-green-200 bg-green-50 p-4 text-sm">
          <h2 className="font-semibold">Approved</h2>
          <p className="mt-1">You approved this change on {new Date(detail.approval.approvedAt).toLocaleString()}.</p>
        </section>
      ) : null}

      {detail.decision ? (
        <section className="rounded border p-4 text-sm">
          <h2 className="font-semibold">Declined</h2>
          <p className="mt-1">{detail.decision.comment || "No comment provided."}</p>
        </section>
      ) : null}
    </div>
  );
}
