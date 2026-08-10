"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  applyChangeRequestAction,
  approveInScopeAction,
  beginAssessmentAction,
  cancelChangeRequestAction,
  createChangeInvoiceAction,
  markImplementedAction,
  requestClarificationAction,
  saveAssessmentAction,
  saveWorkItemsAction,
  sendForApprovalAction,
} from "@/lib/admin/change-request-actions";

type Props = {
  changeRequestId: string;
  status: string;
  classification: string;
  updatedAt: string;
  canManage: boolean;
  projectContacts: Array<{ id: string; label: string }>;
  workItemsJson: string;
  requirePaymentBeforeImplementation: boolean;
  hasInvoice: boolean;
  approvedPriceMinor: number;
};

export function ChangeRequestAdminActions({
  changeRequestId,
  status,
  classification,
  updatedAt,
  canManage,
  projectContacts,
  workItemsJson,
  requirePaymentBeforeImplementation,
  hasInvoice,
  approvedPriceMinor,
}: Props) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (!canManage) return null;

  function refresh() {
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {["SUBMITTED", "NEEDS_CLARIFICATION"].includes(status) ? (
        <button
          type="button"
          disabled={pending}
          className="admin-btn admin-btn-primary"
          onClick={() =>
            startTransition(async () => {
              await beginAssessmentAction(changeRequestId);
              refresh();
            })
          }
        >
          Begin assessment
        </button>
      ) : null}

      {status === "UNDER_ASSESSMENT" && classification === "IN_SCOPE" ? (
        <button
          type="button"
          disabled={pending}
          className="admin-btn admin-btn-primary"
          onClick={() =>
            startTransition(async () => {
              await approveInScopeAction(changeRequestId);
              refresh();
            })
          }
        >
          Approve in scope
        </button>
      ) : null}

      {status === "APPROVED" ? (
        <>
          {approvedPriceMinor > 0 && !hasInvoice ? (
            <button
              type="button"
              disabled={pending}
              className="admin-btn"
              onClick={() =>
                startTransition(async () => {
                  await createChangeInvoiceAction(changeRequestId);
                  refresh();
                })
              }
            >
              Create change invoice
            </button>
          ) : null}
          <button
            type="button"
            disabled={pending}
            className="admin-btn admin-btn-primary"
            onClick={() =>
              startTransition(async () => {
                const fd = new FormData();
                fd.set("changeRequestId", changeRequestId);
                fd.set("applyTargetDate", "on");
                fd.set("itemsJson", workItemsJson);
                await saveWorkItemsAction(fd);
                await applyChangeRequestAction(fd);
                refresh();
              })
            }
          >
            Apply to project
          </button>
        </>
      ) : null}

      {status === "APPLIED" ? (
        <button
          type="button"
          disabled={pending}
          className="admin-btn admin-btn-primary"
          onClick={() =>
            startTransition(async () => {
              await markImplementedAction(changeRequestId);
              refresh();
            })
          }
        >
          Mark implemented
        </button>
      ) : null}

      {!["APPLIED", "IMPLEMENTED", "DECLINED", "CANCELLED"].includes(status) ? (
        <button
          type="button"
          disabled={pending}
          className="admin-btn admin-btn-danger"
          onClick={() =>
            startTransition(async () => {
              const fd = new FormData();
              fd.set("changeRequestId", changeRequestId);
              await cancelChangeRequestAction(fd);
              refresh();
            })
          }
        >
          Cancel
        </button>
      ) : null}
    </div>
  );
}

export function ChangeRequestAssessmentForm({
  changeRequestId,
  updatedAt,
  classification,
  defaultValues,
  canManage,
  projectContacts,
}: {
  changeRequestId: string;
  updatedAt: string;
  classification: string;
  canManage: boolean;
  projectContacts: Array<{ id: string; label: string }>;
  defaultValues: {
    scopeImpactSummary: string;
    clientScopeImpactSummary: string;
    timelineImpactDays: number;
    timelineImpactSummary: string;
    priceImpactMinor: number;
    implementationSummary: string;
    requirePaymentBeforeImplementation: boolean;
    contractAmendmentRecommended: boolean;
  };
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (!canManage) return null;

  return (
    <form
      className="space-y-2"
      data-cr-id={changeRequestId}
      action={(fd) => {
        startTransition(async () => {
          fd.set("changeRequestId", changeRequestId);
          fd.set("expectedUpdatedAt", updatedAt);
          await saveAssessmentAction(fd);
          router.refresh();
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          Classification
          <select name="classification" defaultValue={classification} className="admin-input mt-1 w-full">
            <option value="IN_SCOPE">In scope</option>
            <option value="OUT_OF_SCOPE">Out of scope</option>
          </select>
        </label>
        <label className="block text-sm">
          Price impact (minor units)
          <input
            name="priceImpactMinor"
            type="number"
            min={0}
            defaultValue={defaultValues.priceImpactMinor}
            className="admin-input mt-1 w-full"
          />
        </label>
        <label className="block text-sm">
          Timeline impact (days)
          <input
            name="timelineImpactDays"
            type="number"
            min={0}
            defaultValue={defaultValues.timelineImpactDays}
            className="admin-input mt-1 w-full"
          />
        </label>
      </div>
      <label className="block text-sm">
        Internal scope impact
        <textarea
          name="scopeImpactSummary"
          rows={3}
          defaultValue={defaultValues.scopeImpactSummary}
          className="admin-input mt-1 w-full"
        />
      </label>
      <label className="block text-sm">
        Client-facing scope impact
        <textarea
          name="clientScopeImpactSummary"
          rows={3}
          defaultValue={defaultValues.clientScopeImpactSummary}
          className="admin-input mt-1 w-full"
        />
      </label>
      <label className="block text-sm">
        Timeline impact summary
        <textarea
          name="timelineImpactSummary"
          rows={2}
          defaultValue={defaultValues.timelineImpactSummary}
          className="admin-input mt-1 w-full"
        />
      </label>
      <label className="block text-sm">
        Implementation notes
        <textarea
          name="implementationSummary"
          rows={2}
          defaultValue={defaultValues.implementationSummary}
          className="admin-input mt-1 w-full"
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="requirePaymentBeforeImplementation"
          defaultChecked={defaultValues.requirePaymentBeforeImplementation}
        />
        Require payment before implementation
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="contractAmendmentRecommended"
          defaultChecked={defaultValues.contractAmendmentRecommended}
        />
        Contract amendment may be required
      </label>
      <button type="submit" disabled={pending} className="admin-btn admin-btn-primary">
        Save assessment
      </button>

      <div className="border-t pt-4">
        <h3 className="font-medium">Send for client approval</h3>
        <p className="text-sm text-neutral-600">Select approver contacts (out-of-scope only).</p>
        <div className="mt-2 space-y-1">
          {projectContacts.map((c) => (
            <label key={c.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="approverContactIds" value={c.id} />
              {c.label}
            </label>
          ))}
        </div>
        <button
          type="button"
          disabled={pending}
          className="admin-btn mt-3"
          onClick={() => {
            const form = document.querySelector<HTMLFormElement>(
              `form[data-cr-id="${changeRequestId}"]`,
            );
            if (!form) return;
            const fd = new FormData(form);
            fd.set("changeRequestId", changeRequestId);
            fd.set("expectedUpdatedAt", updatedAt);
            startTransition(async () => {
              await sendForApprovalAction(fd);
              router.refresh();
            });
          }}
        >
          Send for approval
        </button>
      </div>
    </form>
  );
}

export function ChangeRequestClarificationForm({
  changeRequestId,
  canManage,
}: {
  changeRequestId: string;
  canManage: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  if (!canManage) return null;

  return (
    <form
      className="space-y-2"
      action={(fd) => {
        startTransition(async () => {
          fd.set("changeRequestId", changeRequestId);
          await requestClarificationAction(fd);
          router.refresh();
        });
      }}
    >
      <textarea name="message" rows={3} className="admin-input w-full" placeholder="Ask the client for clarification…" required />
      <button type="submit" disabled={pending} className="admin-btn">
        Request clarification
      </button>
    </form>
  );
}

export function ChangeRequestWorkItemsEditor({
  changeRequestId,
  canManage,
  initialItems,
}: {
  changeRequestId: string;
  canManage: boolean;
  initialItems: Array<{ type: string; title: string; description?: string | null; clientVisible: boolean }>;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  if (!canManage) return null;

  const defaultJson = JSON.stringify(
    initialItems.length
      ? initialItems.map((i) => ({
          type: i.type,
          title: i.title,
          description: i.description ?? "",
          clientVisible: i.clientVisible,
        }))
      : [{ type: "TASK", title: "", description: "", clientVisible: false }],
  );

  return (
    <form
      className="space-y-2"
      action={(fd) => {
        startTransition(async () => {
          fd.set("changeRequestId", changeRequestId);
          await saveWorkItemsAction(fd);
          router.refresh();
        });
      }}
    >
      <textarea name="itemsJson" rows={6} defaultValue={defaultJson} className="admin-input w-full font-mono text-xs" />
      <button type="submit" disabled={pending} className="admin-btn">
        Save work items
      </button>
    </form>
  );
}
