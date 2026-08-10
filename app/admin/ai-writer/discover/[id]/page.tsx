import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { AIWriterSubnav } from "@/components/admin/ai-writer/AIWriterSubnav";
import { PageHeader } from "@/components/ui/page-header";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";
import {
  convertOpportunityAction,
  updateOpportunityStatusAction,
} from "@/lib/admin/topic-intelligence-actions";
import {
  commercialActionLabel,
  forcesInsightOverride,
  isCommercialPageRecommendation,
  isResourceExpandRecommendation,
  resolveCommercialAssistantHandoff,
} from "@/lib/ai/topic-intelligence/content-assistant-handoff";

export const dynamic = "force-dynamic";

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminUser("use_ai_writer");
  const { id } = await params;
  const opp = await prisma.editorialOpportunity.findUnique({ where: { id } });
  if (!opp) notFound();

  const existing = Array.isArray(opp.existingContentJson)
    ? (opp.existingContentJson as Array<{ title?: string; path?: string; type?: string }>)
    : [];
  const signals = Array.isArray(opp.supportingSignalsJson)
    ? (opp.supportingSignalsJson as string[])
    : [];
  const dimensions =
    opp.dimensionsJson && typeof opp.dimensionsJson === "object"
      ? (opp.dimensionsJson as Record<string, string>)
      : {};
  const needsForce = forcesInsightOverride(opp.recommendation);

  let commercialHandoff = null;
  let handoffError: string | null = null;
  if (
    isCommercialPageRecommendation(opp.recommendation) ||
    isResourceExpandRecommendation(opp.recommendation)
  ) {
    try {
      commercialHandoff = await resolveCommercialAssistantHandoff(opp.id);
    } catch (err) {
      handoffError =
        err instanceof Error
          ? err.message
          : "Topic Intelligence could not confidently identify the page to update.";
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-10">
      <PageHeader
        title={opp.workingTitle}
        description={
          <>
            <nav className="text-sm text-muted">
              <Link href="/admin/ai-writer/discover" className="hover:text-foreground">
                Topic Discovery
              </Link>
              <span className="mx-1.5">/</span>
              <span className="text-foreground">Opportunity</span>
            </nav>
            <span className="mt-2 block text-xs uppercase tracking-wide text-muted">
              Working title (not final)
            </span>
            <span className="mt-2 flex flex-wrap gap-2 text-sm">
              <span className="rounded border border-border px-2 py-0.5">{opp.badge || opp.recommendation}</span>
              <span className="rounded border border-border px-2 py-0.5">{opp.status}</span>
              <span className="rounded border border-border px-2 py-0.5">{opp.timeliness}</span>
              {opp.higherFactualReview ? (
                <span className="rounded border border-warning bg-warning-soft/40 px-2 py-0.5 text-warning-text">
                  Higher factual review
                </span>
              ) : null}
              {opp.recurringSignal ? (
                <span className="rounded border border-border px-2 py-0.5">Recurring signal</span>
              ) : null}
            </span>
          </>
        }
      />
      <AIWriterSubnav current="/admin/ai-writer/discover" />

      <AdminPanel className="space-y-4 text-sm">
        <Block title="Topic" body={opp.coreTopic} />
        <Block title="Reader need / question" body={opp.question || "—"} />
        <Block title="Why now" body={opp.whyNow || "—"} />
        <Block title="Why Smartlance" body={opp.whySmartlance || "—"} />
        <Block title="Unique value" body={opp.uniqueValue || "—"} />
        <Block title="Audience" body={opp.audience || "—"} />
        <Block title="Commercial connection" body={opp.commercialRelationship || "—"} />
        <Block title="Suggested format" body={opp.suggestedFormat} />
        <Block title="Suggested CTA" body={opp.suggestedCta || "—"} />
        <Block title="Recommendation" body={opp.recommendation.replace(/_/g, " ")} />
        {opp.aiOriginalRecommendation &&
        opp.aiOriginalRecommendation !== opp.recommendation ? (
          <Block
            title="AI original recommendation"
            body={opp.aiOriginalRecommendation.replace(/_/g, " ")}
          />
        ) : null}
        {opp.humanDecisionNote ? (
          <Block title="Human decision note" body={opp.humanDecisionNote} />
        ) : null}
        {opp.editorialFeedback ? (
          <Block
            title="Editorial feedback"
            body={`${opp.editorialFeedback.replace(/_/g, " ")}${
              opp.editorialFeedbackNote ? ` — ${opp.editorialFeedbackNote}` : ""
            }`}
          />
        ) : null}

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Existing Smartlance coverage
          </h2>
          <ul className="mt-2 space-y-1">
            {existing.slice(0, 10).map((e, i) => (
              <li key={i}>
                {e.path ? (
                  <Link href={e.path} className="underline">
                    [{e.type}] {e.title}
                  </Link>
                ) : (
                  <span>
                    [{e.type}] {e.title}
                  </span>
                )}
              </li>
            ))}
            {!existing.length ? <li className="text-neutral-500">No close overlaps found.</li> : null}
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Signals & sources
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {signals.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
            {!signals.length ? <li className="text-neutral-500">No signals listed.</li> : null}
          </ul>
          {opp.runId ? (
            <p className="mt-2 text-xs text-neutral-500">Discovery run: {opp.runId}</p>
          ) : null}
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Dimensions (not a score)
          </h2>
          <dl className="mt-2 grid gap-1 sm:grid-cols-2">
            {Object.entries(dimensions).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2 border-b border-neutral-100 py-1">
                <dt className="text-neutral-500">{k}</dt>
                <dd className="font-medium text-neutral-800">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </AdminPanel>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-900">Actions</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Human selection required. No generate & publish.
        </p>

        {commercialHandoff ? (
          <div className="mt-3 space-y-2">
            <Link
              href={commercialHandoff.href}
              className="inline-flex admin-btn-primary"
            >
              {commercialActionLabel(opp.recommendation)}
            </Link>
            <p className="text-xs text-neutral-500">
              Opens {commercialHandoff.label}. Does not create an Insight AI
              project. You still choose when to generate a proposal.
            </p>
            {commercialHandoff.routingReason ? (
              <p className="text-xs text-neutral-600">
                <span className="font-medium">Why: </span>
                {commercialHandoff.routingReason}
              </p>
            ) : null}
            {opp.targetEntityType || opp.targetEntityId ? (
              <p className="text-xs text-neutral-500">
                Target: {opp.targetEntityType || "—"}
                {opp.targetEntityId ? ` · ${opp.targetEntityId}` : ""}
              </p>
            ) : null}
          </div>
        ) : null}

        {handoffError ? (
          <p className="mt-3 text-sm text-amber-800">{handoffError}</p>
        ) : null}

        {!commercialHandoff &&
        !handoffError &&
        (isCommercialPageRecommendation(opp.recommendation) ||
          isResourceExpandRecommendation(opp.recommendation)) ? (
          <p className="mt-3 text-sm text-amber-800">
            Topic Intelligence could not confidently identify the page to
            update. Choose the correct CMS record manually — do not guess.
          </p>
        ) : null}

        {opp.linkedAIProjectId ? (
          <Link
            href={`/admin/ai-writer/${opp.linkedAIProjectId}`}
            className="mt-3 inline-flex admin-btn-primary"
          >
            Open linked AI project
          </Link>
        ) : (
          <form action={convertOpportunityAction} className="mt-3 space-y-2">
            <input type="hidden" name="id" value={opp.id} />
            {needsForce ? (
              <label className="flex items-start gap-2 text-sm text-amber-950">
                <input type="checkbox" name="force" className="mt-1" />
                <span>
                  Override recommendation ({opp.recommendation}). I still want to create an Insight project.
                </span>
              </label>
            ) : null}
            <button type="submit" className="admin-btn">
              Create Insight Project
            </button>
          </form>
        )}

        <form action={updateOpportunityStatusAction} className="mt-4 flex flex-wrap gap-2">
          <input type="hidden" name="id" value={opp.id} />
          <button type="submit" name="status" value="REVIEWING" className="admin-btn">
            Mark reviewing
          </button>
          <button type="submit" name="status" value="APPROVED" className="admin-btn">
            Approve to backlog
          </button>
          <button type="submit" name="status" value="MONITORING" className="admin-btn">
            Monitor
          </button>
        </form>

        <form action={updateOpportunityStatusAction} className="mt-4 space-y-2 border-t border-neutral-100 pt-4">
          <input type="hidden" name="id" value={opp.id} />
          <p className="text-sm font-medium text-neutral-800">Override recommendation</p>
          <p className="text-xs text-neutral-500">
            Preserves the AI original recommendation for calibration. Does not auto-train the
            engine.
          </p>
          <label className="block text-sm">
            Final recommendation
            <select
              name="recommendation"
              defaultValue={opp.recommendation}
              className="admin-input mt-1"
            >
              <option value="WRITE_NEW">Write new</option>
              <option value="UPDATE_EXISTING">Update existing</option>
              <option value="EXPAND_EXISTING_RESOURCE">Expand resource</option>
              <option value="SUPPORT_COMMERCIAL_PAGE">Support commercial page</option>
              <option value="UPDATE_SERVICE_PAGE">Update service page</option>
              <option value="UPDATE_SOLUTION_PAGE">Update solution page</option>
              <option value="UPDATE_PLATFORM_PAGE">Update platform page</option>
              <option value="UPDATE_INDUSTRY_PAGE">Update industry page</option>
              <option value="MONITOR">Monitor</option>
              <option value="IGNORE">Ignore</option>
            </select>
          </label>
          <label className="block text-sm">
            Decision note
            <input
              name="humanDecisionNote"
              defaultValue={opp.humanDecisionNote || ""}
              className="admin-input mt-1"
              placeholder="Why this decision?"
            />
          </label>
          <button type="submit" className="admin-btn">
            Save recommendation
          </button>
        </form>

        <form action={updateOpportunityStatusAction} className="mt-4 space-y-2 border-t border-neutral-100 pt-4">
          <input type="hidden" name="id" value={opp.id} />
          <p className="text-sm font-medium text-neutral-800">Lightweight feedback</p>
          <label className="block text-sm">
            Feedback
            <select
              name="editorialFeedback"
              defaultValue={opp.editorialFeedback || ""}
              className="admin-input mt-1"
            >
              <option value="">—</option>
              <option value="GOOD_RECOMMENDATION">Good recommendation</option>
              <option value="WRONG_FORMAT">Wrong format</option>
              <option value="DUPLICATE_MISSED">Duplicate missed</option>
              <option value="WEAK_ANGLE">Weak angle</option>
              <option value="IRRELEVANT">Irrelevant</option>
              <option value="STRONG_REFRESH">Strong refresh idea</option>
              <option value="USEFUL_SOURCE">Useful source discovery</option>
            </select>
          </label>
          <label className="block text-sm">
            Note
            <input
              name="editorialFeedbackNote"
              defaultValue={opp.editorialFeedbackNote || ""}
              className="admin-input mt-1"
            />
          </label>
          <button type="submit" className="admin-btn">
            Save feedback
          </button>
        </form>

        <form action={updateOpportunityStatusAction} className="mt-4 space-y-2 border-t border-neutral-100 pt-4">
          <input type="hidden" name="id" value={opp.id} />
          <input type="hidden" name="status" value="REJECTED" />
          <label className="block text-sm">
            Reject reason
            <select name="rejectionReason" className="admin-input mt-1" required>
              <option value="DUPLICATE">Duplicate</option>
              <option value="WEAK_RELEVANCE">Weak relevance</option>
              <option value="NO_UNIQUE_ANGLE">No unique angle</option>
              <option value="POOR_SOURCE_QUALITY">Poor source quality</option>
              <option value="OUTSIDE_STRATEGY">Outside strategy</option>
              <option value="TOO_TEMPORARY">Too temporary</option>
              <option value="ALREADY_COVERED">Already covered</option>
              <option value="OTHER">Other</option>
            </select>
          </label>
          <label className="block text-sm">
            Note
            <input name="rejectionNote" className="admin-input mt-1" />
          </label>
          <button type="submit" className="admin-btn-danger">
            Reject
          </button>
        </form>

        <form action={updateOpportunityStatusAction} className="mt-4 flex flex-wrap items-end gap-2 border-t border-neutral-100 pt-4">
          <input type="hidden" name="id" value={opp.id} />
          <label className="block text-sm">
            Editorial priority
            <select name="priority" defaultValue={opp.priority} className="admin-input mt-1">
              <option value="HIGH">High</option>
              <option value="NORMAL">Normal</option>
              <option value="LOW">Low</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="pinned" defaultChecked={opp.pinned} />
            Pin
          </label>
          <label className="block text-sm">
            Planned for
            <input
              type="date"
              name="plannedFor"
              defaultValue={opp.plannedFor ? opp.plannedFor.toISOString().slice(0, 10) : ""}
              className="admin-input mt-1"
            />
          </label>
          <button type="submit" className="admin-btn">
            Save planning
          </button>
        </form>
      </section>
    </div>
  );
}

function Block({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{title}</h2>
      <p className="mt-1 whitespace-pre-wrap text-neutral-800">{body}</p>
    </div>
  );
}
