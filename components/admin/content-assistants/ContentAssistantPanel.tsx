"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  applyContentProposalAction,
  generateContentProposalAction,
  rejectContentProposalAction,
} from "@/lib/admin/ai-content-assistant-actions";
import { formatFieldForDisplay } from "@/lib/ai/content-assistants/helpers";
import type {
  ProposedFieldChange,
  ProposalClaim,
  ProposalPayload,
  ReviewSeverity,
} from "@/lib/ai/content-assistants/types";

type ActionDef = {
  id: string;
  label: string;
  loadingLabel: string;
  researchPolicy?: "optional" | "recommended" | "required";
};

type EntityType =
  | "SERVICE"
  | "SOLUTION"
  | "PLATFORM"
  | "INDUSTRY"
  | "WORK"
  | "TESTIMONIAL"
  | "GUIDE"
  | "COMPARISON"
  | "CHECKLIST"
  | "GLOSSARY"
  | "TEMPLATE"
  | "TOOL"
  | "HOMEPAGE";

type ProposalDTO = {
  id: string;
  action: string;
  status: string;
  fields: ProposedFieldChange[];
  resultMode?: ProposalPayload["resultMode"];
  reviewFindings?: Array<{
    section: string;
    severity: ReviewSeverity;
    message: string;
  }>;
  suggestedRelations?: Array<{
    kind: string;
    id?: string;
    href?: string;
    slug?: string;
    title: string;
    reason?: string;
  }>;
  research?: ProposalPayload["research"];
  claims?: ProposalClaim[];
  createdAt: string;
};

type FieldState = {
  decision: "accept" | "keep" | "edit";
  editedText: string;
};

function severityClass(s: ReviewSeverity) {
  switch (s) {
    case "BLOCKER":
      return "border-red-300 bg-red-50 text-red-950";
    case "WARNING":
      return "border-amber-300 bg-amber-50 text-amber-950";
    case "REVIEW":
      return "border-sky-300 bg-sky-50 text-sky-950";
    default:
      return "border-emerald-200 bg-emerald-50 text-emerald-950";
  }
}

function initialFieldStates(fields: ProposedFieldChange[]): Record<string, FieldState> {
  const next: Record<string, FieldState> = {};
  for (const f of fields) {
    next[f.field] = {
      decision: "keep",
      editedText: formatFieldForDisplay(f.proposed),
    };
  }
  return next;
}

function ProposalReview({
  proposal,
  entityType,
  entityId,
  isNewDraft,
  generating,
  onError,
  onMutate,
  onApplied,
}: {
  proposal: ProposalDTO;
  entityType: EntityType;
  entityId: string;
  isNewDraft: boolean;
  generating: boolean;
  onError: (message: string | null) => void;
  onMutate: () => void;
  onApplied: (message: string) => void;
}) {
  const [fieldStates, setFieldStates] = useState(() =>
    initialFieldStates(proposal.fields),
  );
  const [showSources, setShowSources] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    setFieldStates(initialFieldStates(proposal.fields));
  }, [proposal.id]);

  const claimWarnings =
    proposal.claims?.filter(
      (c) => c.support === "BLOCKED" || c.support === "NEEDS_REVIEW",
    ) || [];
  const fieldBlockers = proposal.fields.filter((f) => f.claimBlockers?.length);

  function acceptAllEligible() {
    const next: Record<string, FieldState> = {};
    for (const f of proposal.fields) {
      if (f.claimBlockers?.length) {
        next[f.field] = {
          decision: "keep",
          editedText: formatFieldForDisplay(f.proposed),
        };
        continue;
      }
      next[f.field] = {
        decision: "accept",
        editedText: formatFieldForDisplay(f.proposed),
      };
    }
    setFieldStates(next);
  }

  const acceptedCount = proposal.fields.filter((f) => {
    const st = fieldStates[f.field];
    if (!st || st.decision === "keep") return false;
    if (st.decision === "accept" && f.claimBlockers?.length) return false;
    return true;
  }).length;

  function setFieldDecision(field: string, decision: FieldState["decision"]) {
    setFieldStates((prev) => {
      const change = proposal.fields.find((f) => f.field === field);
      const current = prev[field] || {
        decision: "keep" as const,
        editedText: change
          ? formatFieldForDisplay(change.proposed)
          : "",
      };
      return {
        ...prev,
        [field]: { ...current, decision },
      };
    });
  }

  function onApply() {
    if (applying || generating || proposal.status === "STALE") return;
    onError(null);
    setApplying(true);
    void (async () => {
      try {
        const decisions = proposal.fields.map((f) => {
          const st = fieldStates[f.field] || {
            decision: "keep" as const,
            editedText: "",
          };
          if (st.decision === "edit") {
            let editedValue: unknown = st.editedText;
            const cur = f.proposed;
            if (typeof cur !== "string") {
              try {
                editedValue = JSON.parse(st.editedText);
              } catch {
                editedValue = st.editedText;
              }
            }
            return { field: f.field, decision: "edit" as const, editedValue };
          }
          return { field: f.field, decision: st.decision };
        });
        const fd = new FormData();
        fd.set("proposalId", proposal.id);
        fd.set("entityType", entityType);
        fd.set("entityId", entityId);
        fd.set("decisionsJson", JSON.stringify(decisions));
        await applyContentProposalAction(fd);
        const appliedLabels = decisions
          .filter((d) => d.decision !== "keep")
          .map(
            (d) =>
              proposal.fields.find((f) => f.field === d.field)?.label || d.field,
          );
        onApplied(
          appliedLabels.length
            ? `Applied ${appliedLabels.join(", ")} to draft. CMS fields below were updated.`
            : "Proposal applied.",
        );
        onMutate();
      } catch (e) {
        onError(
          e instanceof Error
            ? e.message
            : "Could not apply proposal. Nothing was saved.",
        );
      } finally {
        setApplying(false);
      }
    })();
  }

  return (
    <div>
      {(claimWarnings.length > 0 || fieldBlockers.length > 0) && (
        <p
          role="status"
          className="mb-3 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950"
        >
          {fieldBlockers.length || claimWarnings.length} factual claim
          {fieldBlockers.length + claimWarnings.length === 1 ? "" : "s"} need
          review — affected fields cannot be accepted until edited or kept.
        </p>
      )}

      {proposal.research?.performed && (
        <div className="mb-4 rounded border border-neutral-200 bg-neutral-50 p-3 text-sm">
          <p className="text-xs font-medium text-neutral-700">Research used</p>
          <p className="mt-1 text-neutral-800">
            {proposal.research.sourceCount} sources reviewed ·{" "}
            {proposal.research.officialOrPrimaryCount} official/primary · Last
            checked:{" "}
            {proposal.research.checkedAt
              ? proposal.research.checkedAt.slice(0, 10)
              : "Unknown"}
          </p>
          <button
            type="button"
            className="mt-2 text-xs text-[#F47A48] underline-offset-2 hover:underline"
            onClick={() => setShowSources((v) => !v)}
            aria-expanded={showSources}
          >
            {showSources ? "Hide sources" : "View sources"}
          </button>
          {showSources && (
            <ul className="mt-2 space-y-2 text-xs text-neutral-700">
              {(proposal.research.sources ?? []).map((s) => (
                <li key={s.url} className="border-t border-neutral-200 pt-2">
                  <span className="font-medium">{s.title || s.domain || s.url}</span>
                  <span className="text-neutral-500"> · {s.sourceType}</span>
                  <div className="break-all text-neutral-500">{s.domain || s.url}</div>
                  {s.whyUsed ? <div className="mt-0.5">{s.whyUsed}</div> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {proposal.status === "STALE" && (
        <p
          role="status"
          className="mb-3 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950"
        >
          This proposal is stale because the content changed after it was
          generated. Regenerate before applying.
        </p>
      )}

      {proposal.reviewFindings && proposal.reviewFindings.length > 0 && (
        <ul className="mb-4 space-y-2">
          {proposal.reviewFindings.map((f, i) => (
            <li
              key={`${f.section}-${i}`}
              className={`rounded border px-3 py-2 text-sm ${severityClass(f.severity)}`}
            >
              <span className="font-medium">{f.section}</span>
              <span className="mx-2 text-xs uppercase opacity-70">{f.severity}</span>
              <p className="mt-0.5">{f.message}</p>
            </li>
          ))}
        </ul>
      )}

      {proposal.resultMode && typeof proposal.resultMode === "string" && (
          <p className="mb-3 text-xs text-neutral-600">
            Outcome:{" "}
            <span className="font-medium">
              {proposal.resultMode.replace(/_/g, " ")}
            </span>
          </p>
        )}

      {proposal.suggestedRelations && proposal.suggestedRelations.length > 0 && (
        <div className="mb-4 rounded border border-neutral-200 bg-neutral-50 p-3 text-sm">
          <p className="text-xs font-medium text-neutral-700">
            Suggested relationships
          </p>
          <ul className="mt-2 space-y-1">
            {proposal.suggestedRelations.map((r, i) => (
              <li key={`${r.kind}-${r.slug || r.href}-${i}`}>
                <span className="font-medium">{r.title}</span>
                <span className="text-neutral-500"> ({r.kind})</span>
                {r.reason ? ` — ${r.reason}` : ""}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-neutral-500">
            Suggestions are advisory. Accept field proposals below to apply
            verified IDs/slugs.
          </p>
        </div>
      )}

      {proposal.fields.length > 0 && (
        <>
          <div className="sticky top-0 z-20 -mx-1 mb-3 flex flex-wrap items-center gap-2 rounded-md border border-neutral-200 bg-white/95 px-2 py-2 shadow-sm backdrop-blur">
            <button
              type="button"
              className={`rounded border px-2 py-1 text-xs ${
                isNewDraft
                  ? "border-[#F47A48] text-[#F47A48]"
                  : "border-neutral-300 text-neutral-600"
              }`}
              disabled={applying || generating}
              onClick={acceptAllEligible}
            >
              Accept all eligible
            </button>
            <button
              type="button"
              className="rounded border border-neutral-900 bg-neutral-900 px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
              disabled={
                applying || generating || proposal.status === "STALE" || acceptedCount === 0
              }
              aria-busy={applying}
              onClick={onApply}
            >
              {applying
                ? "Applying…"
                : acceptedCount > 0
                  ? `Apply ${acceptedCount} accepted field${acceptedCount === 1 ? "" : "s"}`
                  : "Apply accepted fields"}
            </button>
            <form action={rejectContentProposalAction}>
              <input type="hidden" name="proposalId" value={proposal.id} />
              <input type="hidden" name="entityType" value={entityType} />
              <input type="hidden" name="entityId" value={entityId} />
              <button
                type="submit"
                className="rounded border border-neutral-300 px-2 py-1 text-xs text-neutral-600 disabled:opacity-50"
                disabled={applying || generating}
              >
                Reject proposal
              </button>
            </form>
            {acceptedCount > 0 ? (
              <span className="text-xs text-neutral-600">
                {acceptedCount} field{acceptedCount === 1 ? "" : "s"} marked to
                apply
              </span>
            ) : (
              <span className="text-xs text-neutral-500">
                Accept fields below, then apply
              </span>
            )}
          </div>

          <ul className="space-y-4">
            {proposal.fields.map((f) => {
              const st = fieldStates[f.field] || {
                decision: "keep" as const,
                editedText: formatFieldForDisplay(f.proposed),
              };
              return (
                <li
                  key={f.field}
                  className="rounded-md border border-neutral-200 p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-medium text-neutral-900">
                      {f.label}
                    </h3>
                    <div
                      className="relative z-10 flex flex-wrap gap-1"
                      role="group"
                      aria-label={`${f.label} decision`}
                    >
                      {(["accept", "keep", "edit"] as const).map((d) => {
                        const blocked =
                          d === "accept" && Boolean(f.claimBlockers?.length);
                        return (
                          <button
                            key={d}
                            type="button"
                            className={`rounded px-2 py-1 text-xs capitalize ${
                              st.decision === d
                                ? "bg-neutral-900 text-white"
                                : "border border-neutral-200 bg-white text-neutral-700"
                            } disabled:cursor-not-allowed disabled:opacity-40`}
                            disabled={blocked || applying || generating}
                            aria-pressed={st.decision === d}
                            onClick={() => setFieldDecision(f.field, d)}
                          >
                            {d === "keep"
                              ? "Keep current"
                              : d === "accept"
                                ? "Accept"
                                : "Edit proposal"}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                      {f.reason && (
                        <p className="mt-1 text-xs text-neutral-500">{f.reason}</p>
                      )}
                      {f.claimBlockers?.length ? (
                        <p className="mt-1 text-xs text-red-700" role="status">
                          Claim blocker: {f.claimBlockers.join(" ")}
                        </p>
                      ) : null}
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                        Current
                      </p>
                      <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap rounded bg-neutral-50 p-2 text-xs text-neutral-800">
                        {formatFieldForDisplay(f.current)}
                      </pre>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                        Proposed
                      </p>
                      {st.decision === "edit" ? (
                        <textarea
                          className="admin-input mt-1 min-h-[120px] text-xs"
                          value={st.editedText}
                          onChange={(e) =>
                            setFieldStates((prev) => ({
                              ...prev,
                              [f.field]: {
                                ...st,
                                editedText: e.target.value,
                              },
                            }))
                          }
                          aria-label={`Edit proposed ${f.label}`}
                        />
                      ) : (
                        <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap rounded bg-orange-50/60 p-2 text-xs text-neutral-800">
                          {formatFieldForDisplay(f.proposed)}
                        </pre>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {proposal.fields.length === 0 &&
        !proposal.reviewFindings?.length &&
        !proposal.suggestedRelations?.length && (
          <p className="text-sm text-neutral-600">
            {proposal.resultMode === "NO_CHANGE_RECOMMENDED" ||
            proposal.resultMode === "WRITING_PROVIDER_REQUIRED" ||
            proposal.resultMode === "RESEARCH_NEEDED"
              ? "No content changes recommended for this run."
              : "No field changes proposed for this action."}
          </p>
        )}
    </div>
  );
}

function resolveInitialAction(
  actions: readonly ActionDef[],
  actionHint?: string,
) {
  if (actionHint === "research") {
    return (
      actions.find((a) => a.id === "RESEARCH_AND_IMPROVE")?.id ||
      actions.find((a) => a.id === "RESEARCH_INDUSTRY_NEEDS")?.id ||
      actions[0]?.id ||
      ""
    );
  }
  if (actionHint === "improve") {
    return (
      actions.find((a) => a.id === "IMPROVE_INDUSTRY")?.id ||
      actions.find((a) => a.id.includes("IMPROVE"))?.id ||
      actions[0]?.id ||
      ""
    );
  }
  return actions[0]?.id || "";
}

export function ContentAssistantPanel({
  entityType,
  entityId,
  title,
  actions,
  proposals,
  providerConfigured,
  canUse,
  isNewDraft = false,
  opportunityId,
  lastReviewedAt,
  initialAction,
  showResearchHints,
  experienceMode,
  bannerMessage,
  actionsDisabledReason,
  scrollOnMount = false,
}: {
  entityType: EntityType;
  entityId: string;
  title: string;
  actions: readonly ActionDef[];
  proposals: ProposalDTO[];
  providerConfigured: boolean;
  canUse: boolean;
  isNewDraft?: boolean;
  opportunityId?: string;
  lastReviewedAt?: string | null;
  initialAction?: string;
  showResearchHints?: boolean;
  experienceMode?: "proven" | "supported";
  /** Proof-assistant helper (Case Study / Testimonial) */
  bannerMessage?: string;
  /** When set, generation controls are disabled (e.g. empty testimonial quote) */
  actionsDisabledReason?: string;
  scrollOnMount?: boolean;
}) {
  const [selectedAction, setSelectedAction] = useState(() =>
    resolveInitialAction(actions, initialAction),
  );
  const [instructions, setInstructions] = useState("");
  const [lockedFields, setLockedFields] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const [activeProposalId, setActiveProposalId] = useState(
    proposals[0]?.id || "",
  );

  useEffect(() => {
    if (!proposals.length) return;
    setActiveProposalId((prev) => {
      if (prev && proposals.some((p) => p.id === prev)) return prev;
      const match = proposals.find((p) => p.action === selectedAction);
      return match?.id || proposals[0]!.id;
    });
  }, [proposals, selectedAction]);

  useEffect(() => {
    if (!initialAction) return;
    const next = resolveInitialAction(actions, initialAction);
    if (next) setSelectedAction(next);
  }, [initialAction, actions]);

  useEffect(() => {
    if (!scrollOnMount) return;
    const el = document.getElementById("content-ai-panel");
    if (!el) return;
    const timer = window.setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 150);
    return () => window.clearTimeout(timer);
  }, [scrollOnMount]);

  const active =
    proposals.find((p) => p.id === activeProposalId) || proposals[0];

  const loadingLabel =
    actions.find((a) => a.id === selectedAction)?.loadingLabel ||
    "Generating proposal…";

  function selectAction(actionId: string) {
    setSelectedAction(actionId);
    setError(null);
    window.requestAnimationFrame(() => {
      document
        .getElementById("content-ai-actions")
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  const selectedActionLabel =
    actions.find((a) => a.id === selectedAction)?.label || "None";

  function proposalActionLabel(actionId: string) {
    if (actionId.startsWith("IMPROVE_FIELD:")) {
      const field = actionId.slice("IMPROVE_FIELD:".length);
      return `Improve ${field}`;
    }
    return actions.find((a) => a.id === actionId)?.label || actionId.replace(/_/g, " ");
  }

  if (!canUse) {
    return (
      <section className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
        <h2 className="font-medium text-neutral-900">{title}</h2>
        <p className="mt-1">
          You need AI Writer and draft edit permissions to use this assistant.
        </p>
      </section>
    );
  }

  function onGenerate() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("entityType", entityType);
        fd.set("entityId", entityId);
        fd.set("action", selectedAction);
        fd.set("customInstructions", instructions);
        fd.set("lockedFields", lockedFields);
        if (opportunityId) fd.set("opportunityId", opportunityId);
        if (!providerConfigured) fd.set("forceHeuristic", "1");
        await generateContentProposalAction(fd);
        router.refresh();
        window.requestAnimationFrame(() => {
          document
            .getElementById("content-ai-proposals")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Generation failed. Your current content was not changed.",
        );
      }
    });
  }

  return (
    <section
      id="content-ai-panel"
      className="scroll-mt-6 rounded-lg border border-neutral-200 bg-white shadow-sm"
      aria-labelledby="content-ai-heading"
    >
      <div className="pointer-events-none sticky top-0 z-10 rounded-t-lg border-b border-neutral-100 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="pointer-events-auto flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2
              id="content-ai-heading"
              className="text-sm font-semibold tracking-wide text-neutral-900"
            >
              {title}
            </h2>
            <p className="mt-1 text-xs text-neutral-500">
              Step 1: choose an action · Step 2: Generate proposal · Step 3:
              review and apply fields
            </p>
            <p className="mt-1 text-xs font-medium text-neutral-800">
              Selected: {selectedActionLabel}
            </p>
          </div>
          {!providerConfigured && (
            <p className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-950">
              AI Writer is not configured.{" "}
              <Link
                href="/admin/ai-writer/settings"
                className="underline underline-offset-2"
              >
                AI Settings
              </Link>
              {" — "}
              using safe offline proposals.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="text-xs text-neutral-600">
          {lastReviewedAt !== undefined && (
            <p>
              Last factual review:{" "}
              {lastReviewedAt ? lastReviewedAt.slice(0, 10) : "Not reviewed yet"}
            </p>
          )}
          {showResearchHints && !lastReviewedAt && (
            <p className="text-amber-800">
              Consider checking current platform information before generating
              factual copy.
            </p>
          )}
          {experienceMode === "supported" && (
            <p className="text-amber-900">
              Supported industry — proposals must not claim Smartlance project
              experience.
            </p>
          )}
          {bannerMessage ? <p className="text-neutral-700">{bannerMessage}</p> : null}
          {opportunityId && (
            <p className="text-neutral-500">
              Opened from Topic Intelligence opportunity{" "}
              <Link
                href={`/admin/ai-writer/discover/${opportunityId}`}
                className="underline underline-offset-2"
              >
                {opportunityId.slice(0, 8)}…
              </Link>
              . Generation still requires your action.
            </p>
          )}
        </div>

      <div className="space-y-3">
        {actionsDisabledReason ? (
          <p
            role="status"
            className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950"
          >
            {actionsDisabledReason}
          </p>
        ) : (
          <>
        <fieldset
          id="content-ai-actions"
          className="scroll-mt-24 rounded-md border border-neutral-100 bg-neutral-50/60 p-3"
        >
          <legend className="px-1 text-xs font-medium text-neutral-700">
            How can AI help?
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {actions.map((a) => (
              <button
                key={a.id}
                type="button"
                aria-pressed={selectedAction === a.id}
                className={`rounded border px-2.5 py-1.5 text-left text-xs transition-colors ${
                  selectedAction === a.id
                    ? "border-[#F47A48] bg-orange-50 text-neutral-900 ring-1 ring-[#F47A48]/30"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                }`}
                onClick={() => selectAction(a.id)}
              >
                {a.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-neutral-600">
            Then click Generate proposal below. Nothing is saved until you apply
            accepted fields.
          </p>
        </fieldset>

        <label className="block text-xs text-neutral-700">
          Optional instructions
          <textarea
            className="admin-input mt-1 min-h-[64px] text-sm"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="e.g. Make this clearer for a non-technical business owner."
          />
        </label>

        <label className="block text-xs text-neutral-700">
          Locked fields (comma-separated — will not be rewritten)
          <input
            className="admin-input mt-1 text-sm"
            value={lockedFields}
            onChange={(e) => setLockedFields(e.target.value)}
            placeholder="e.g. process, faqs"
          />
        </label>

        <button
          type="button"
          className="rounded bg-[#F47A48] px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          disabled={pending || !selectedAction}
          onClick={onGenerate}
          aria-busy={pending}
        >
          {pending ? loadingLabel : "Generate proposal"}
        </button>
          </>
        )}

        {error && (
          <p
            role="alert"
            className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900"
          >
            {error}
          </p>
        )}

        {success && (
          <p
            role="status"
            className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
          >
            {success}
          </p>
        )}

        {proposals.length === 0 && !pending && !actionsDisabledReason ? (
          <p className="text-sm text-neutral-600">
            Proposals appear below after you generate one. Review CURRENT vs
            PROPOSED, then accept selected fields — nothing is saved until you
            apply.
          </p>
        ) : null}
      </div>

      {proposals.length > 0 && (
        <div
          id="content-ai-proposals"
          className="mt-6 scroll-mt-24 border-t border-neutral-100 pt-4"
        >
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-neutral-700">
              Proposals
            </span>
            {proposals.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`rounded border px-2 py-1 text-xs ${
                  active?.id === p.id
                    ? "border-neutral-800"
                    : "border-neutral-200 text-neutral-600"
                }`}
                onClick={() => setActiveProposalId(p.id)}
              >
                {proposalActionLabel(p.action)} · {p.status}
              </button>
            ))}
          </div>

          {active && active.action !== selectedAction ? (
            <p className="mb-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
              This proposal was generated for{" "}
              <span className="font-medium">
                {proposalActionLabel(active.action)}
              </span>
              . Click{" "}
              <span className="font-medium">{selectedActionLabel}</span> above
              and Generate proposal again for a fresh{" "}
              {selectedActionLabel.toLowerCase()} run.
            </p>
          ) : null}

          {active && (
            <ProposalReview
              key={active.id}
              proposal={active}
              entityType={entityType}
              entityId={entityId}
              isNewDraft={isNewDraft}
              generating={pending}
              onError={(message) => {
                setSuccess(null);
                setError(message);
              }}
              onMutate={() => router.refresh()}
              onApplied={(message) => {
                setError(null);
                setSuccess(message);
              }}
            />
          )}
        </div>
      )}
      </div>
    </section>
  );
}
