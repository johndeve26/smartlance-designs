import Link from "next/link";
import { AdminDetailHeader } from "@/components/admin/patterns/AdminDetailHeader";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";
import { StatusBadge, SemanticBadge } from "@/components/ui/status-badge";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import {
  getChangeRequestBaseline,
  getChangeRequestById,
  getProjectCommercialScopeSummary,
  previewChangeApplication,
} from "@/lib/change-requests";
import {
  CHANGE_REQUEST_CLASSIFICATION_LABELS,
  CHANGE_REQUEST_ORIGIN_LABELS,
} from "@/lib/change-requests/constants";
import {
  ChangeRequestAdminActions,
  ChangeRequestAssessmentForm,
  ChangeRequestClarificationForm,
  ChangeRequestWorkItemsEditor,
} from "@/components/admin/agency/ChangeRequestDetailPanels";
import { formatMinorAmount } from "@/lib/money/format";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AgencyChangeRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdminUser("view_change_requests");
  const { id } = await params;
  const cr = await getChangeRequestById(id);
  if (!cr) notFound();

  const canManage = can(user.role, "manage_change_requests");
  const baseline = await getChangeRequestBaseline(cr.projectId);
  const commercial = await getProjectCommercialScopeSummary(cr.projectId);
  const preview =
    cr.status === "APPROVED" ? await previewChangeApplication(cr.id) : null;

  const currentAssessment = cr.assessments.find((a) => !a.supersededAt) ?? cr.assessments[0];

  const projectAccess = await prisma.agencyProjectClientAccess.findMany({
    where: { projectId: cr.projectId, revokedAt: null },
    include: {
      contact: {
        select: { id: true, displayName: true, firstName: true, lastName: true, email: true },
      },
    },
  });

  const projectContacts = projectAccess.map((a) => ({
    id: a.contact.id,
    label:
      a.contact.displayName?.trim() ||
      [a.contact.firstName, a.contact.lastName].filter(Boolean).join(" ") ||
      a.contact.email ||
      a.contact.id,
  }));

  const workItemsJson = JSON.stringify(
    cr.workItems.map((w) => ({
      type: w.type,
      title: w.title,
      description: w.description ?? "",
      clientVisible: w.clientVisible,
    })),
  );

  return (
    <div className="space-y-6">
      <Link href="/admin/agency/change-requests" className="text-sm text-muted hover:underline">
        ← Change Requests
      </Link>

      <AdminDetailHeader
        title={cr.changeRequestNumber}
        subtitle={cr.title}
        status={{ domain: "change", value: cr.status }}
        secondaryActions={
          <div className="flex flex-wrap gap-2">
            <SemanticBadge tone="neutral">
              {CHANGE_REQUEST_CLASSIFICATION_LABELS[cr.classification]}
            </SemanticBadge>
            <SemanticBadge tone="neutral">{CHANGE_REQUEST_ORIGIN_LABELS[cr.origin]}</SemanticBadge>
          </div>
        }
        primaryAction={
          <ChangeRequestAdminActions
            changeRequestId={cr.id}
            status={cr.status}
            classification={cr.classification}
            updatedAt={cr.updatedAt.toISOString()}
            canManage={canManage}
            projectContacts={projectContacts}
            workItemsJson={workItemsJson}
            requirePaymentBeforeImplementation={cr.requirePaymentBeforeImplementation}
            hasInvoice={Boolean(cr.invoice)}
            approvedPriceMinor={cr.approval?.approvedPriceImpactMinor ?? 0}
          />
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminPanel>
          <h2 className="font-semibold">Client request</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm">{cr.requestDescription}</p>
        </AdminPanel>

        <AdminPanel>
          <h2 className="font-semibold">Baseline scope</h2>
          {baseline.source === "PROPOSAL_ACCEPTANCE" && baseline.acceptance ? (
            <dl className="mt-2 space-y-1 text-sm">
              <div>
                <dt className="text-neutral-600">Proposal</dt>
                <dd>{baseline.acceptance.proposal.proposalNumber}</dd>
              </div>
              <div>
                <dt className="text-neutral-600">Accepted value</dt>
                <dd>
                  {formatMinorAmount(
                    commercial.originalAcceptedValueMinor ?? 0,
                    baseline.acceptance.currency,
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-neutral-600">Accepted</dt>
                <dd>{new Date(baseline.acceptance.acceptedAt).toLocaleDateString()}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-2 text-sm text-neutral-600">Manual project scope (no proposal acceptance).</p>
          )}
          {cr.contractAmendmentRecommended ? (
            <p className="mt-3 text-sm text-amber-800">Contract amendment may be required.</p>
          ) : null}
        </AdminPanel>
      </div>

      <AdminPanel>
        <h2 className="font-semibold">Commercial summary</h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-neutral-600">Original accepted value</dt>
            <dd>
              {commercial.originalAcceptedValueMinor != null
                ? formatMinorAmount(commercial.originalAcceptedValueMinor, commercial.currency)
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-neutral-600">Approved changes</dt>
            <dd>{formatMinorAmount(commercial.approvedChangesMinor, commercial.currency)}</dd>
          </div>
          <div>
            <dt className="text-neutral-600">Current approved value</dt>
            <dd>
              {commercial.currentApprovedValueMinor != null
                ? formatMinorAmount(commercial.currentApprovedValueMinor, commercial.currency)
                : "—"}
            </dd>
          </div>
        </dl>
      </AdminPanel>

      {["UNDER_ASSESSMENT", "AWAITING_CLIENT_APPROVAL", "SUBMITTED"].includes(cr.status) ? (
        <AdminPanel>
          <h2 className="font-semibold">Assessment</h2>
          <ChangeRequestAssessmentForm
            changeRequestId={cr.id}
            updatedAt={cr.updatedAt.toISOString()}
            classification={currentAssessment?.classification ?? cr.classification}
            canManage={canManage}
            projectContacts={projectContacts}
            defaultValues={{
              scopeImpactSummary: currentAssessment?.scopeImpactSummary ?? "",
              clientScopeImpactSummary: currentAssessment?.clientScopeImpactSummary ?? "",
              timelineImpactDays: currentAssessment?.timelineImpactDays ?? 0,
              timelineImpactSummary: currentAssessment?.timelineImpactSummary ?? "",
              priceImpactMinor: currentAssessment?.priceImpactMinor ?? 0,
              implementationSummary: currentAssessment?.implementationSummary ?? "",
              requirePaymentBeforeImplementation: cr.requirePaymentBeforeImplementation,
              contractAmendmentRecommended: cr.contractAmendmentRecommended,
            }}
          />
        </AdminPanel>
      ) : null}

      {canManage && ["SUBMITTED", "UNDER_ASSESSMENT"].includes(cr.status) ? (
        <AdminPanel>
          <h2 className="font-semibold">Request clarification</h2>
          <ChangeRequestClarificationForm changeRequestId={cr.id} canManage={canManage} />
        </AdminPanel>
      ) : null}

      {cr.messages.length ? (
        <AdminPanel>
          <h2 className="font-semibold">Clarifications</h2>
          <ul className="mt-3 space-y-3 text-sm">
            {cr.messages.map((m) => (
              <li key={m.id} className="rounded border p-3">
                <p className="text-xs text-neutral-600">{m.type.replace(/_/g, " ")}</p>
                <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
              </li>
            ))}
          </ul>
        </AdminPanel>
      ) : null}

      {cr.approval ? (
        <AdminPanel>
          <h2 className="font-semibold">Client approval (immutable)</h2>
          <dl className="mt-2 space-y-1 text-sm">
            <div>
              <dt className="text-neutral-600">Approved by</dt>
              <dd>
                {cr.approval.clientNameSnapshot} ({cr.approval.clientEmailSnapshot})
              </dd>
            </div>
            <div>
              <dt className="text-neutral-600">Price impact</dt>
              <dd>
                {formatMinorAmount(cr.approval.approvedPriceImpactMinor, cr.approval.currency)}
              </dd>
            </div>
            <div>
              <dt className="text-neutral-600">Timeline</dt>
              <dd>+{cr.approval.approvedTimelineImpactDays} days</dd>
            </div>
            <div>
              <dt className="text-neutral-600">Consent</dt>
              <dd className="whitespace-pre-wrap">{cr.approval.consentTextSnapshot}</dd>
            </div>
          </dl>
        </AdminPanel>
      ) : null}

      {cr.decision ? (
        <AdminPanel>
          <h2 className="font-semibold">Client declined</h2>
          <p className="mt-2 text-sm">{cr.decision.comment || "No comment provided."}</p>
        </AdminPanel>
      ) : null}

      {cr.invoice ? (
        <AdminPanel>
          <h2 className="font-semibold">Billing</h2>
          <p className="mt-2 text-sm">
            <Link href={`/admin/agency/invoices/${cr.invoice.id}`} className="hover:underline">
              {cr.invoice.invoiceNumber}
            </Link>{" "}
            · {cr.invoice.status} · {formatMinorAmount(cr.invoice.totalMinor, cr.invoice.currency)}
          </p>
        </AdminPanel>
      ) : null}

      {["APPROVED", "APPLIED"].includes(cr.status) ? (
        <AdminPanel>
          <h2 className="font-semibold">Work items & application</h2>
          {preview ? (
            <p className="mb-3 text-sm text-neutral-600">
              Target date:{" "}
              {preview.currentTargetDueDate
                ? new Date(preview.currentTargetDueDate).toLocaleDateString()
                : "—"}{" "}
              →{" "}
              {preview.proposedTargetDueDate
                ? new Date(preview.proposedTargetDueDate).toLocaleDateString()
                : "unchanged"}
              {!preview.paymentGateSatisfied && cr.requirePaymentBeforeImplementation
                ? " · Payment required before apply"
                : null}
            </p>
          ) : null}
          <ChangeRequestWorkItemsEditor
            changeRequestId={cr.id}
            canManage={canManage}
            initialItems={cr.workItems}
          />
        </AdminPanel>
      ) : null}

      {cr.internalNotes ? (
        <AdminPanel>
          <h2 className="font-semibold">Internal notes</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm">{cr.internalNotes}</p>
        </AdminPanel>
      ) : null}
    </div>
  );
}
