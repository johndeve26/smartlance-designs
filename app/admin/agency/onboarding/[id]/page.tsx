import Link from "next/link";
import { AdminDetailHeader } from "@/components/admin/patterns/AdminDetailHeader";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";
import { SemanticBadge } from "@/components/ui/status-badge";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { getOnboardingById, loadProgressContext } from "@/lib/onboarding";
import {
  ONBOARDING_REVIEW_STATUS_LABELS,
  ONBOARDING_STATUS_LABELS,
} from "@/lib/onboarding/constants";
import { AGENCY_REQUIREMENT_STATUS_LABELS } from "@/lib/agency/constants";
import { OnboardingAdminActions } from "@/components/admin/agency/OnboardingAdminActions";
import { OnboardingReviewPanel } from "@/components/admin/agency/OnboardingReviewPanel";
import { isEligibleToComplete } from "@/lib/onboarding/progress";

export const dynamic = "force-dynamic";

export default async function AgencyOnboardingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdminUser("view_onboarding");
  const { id } = await params;
  const onboarding = await getOnboardingById(id);
  if (!onboarding) notFound();

  const ctx = await loadProgressContext(id);
  const canManage = can(user.role, "manage_onboarding");
  const readyToComplete = isEligibleToComplete(ctx.progress);

  const responseByQuestion = new Map(onboarding.responses.map((r) => [r.questionId, r]));

  return (
    <div className="space-y-6">
      <Link href="/admin/agency/onboarding" className="text-sm text-muted hover:underline">
        ← Onboarding
      </Link>

      <AdminDetailHeader
        title={onboarding.project.name}
        subtitle={`${onboarding.project.projectNumber} · ${ONBOARDING_STATUS_LABELS[onboarding.status]}`}
        secondaryActions={
          <div className="flex gap-2">
            <SemanticBadge tone="info">{ctx.progress.percentComplete}% complete</SemanticBadge>
            {readyToComplete ? <SemanticBadge tone="success">Ready to complete</SemanticBadge> : null}
          </div>
        }
        primaryAction={
          canManage ? (
            <OnboardingAdminActions
              onboardingId={onboarding.id}
              projectId={onboarding.projectId}
              status={onboarding.status}
              readyToComplete={readyToComplete}
            />
          ) : undefined
        }
      />

      {onboarding.clientMessage ? (
        <AdminPanel>
          <h2 className="font-semibold">Client welcome message</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm">{onboarding.clientMessage}</p>
        </AdminPanel>
      ) : null}

      <AdminPanel>
        <h2 className="font-semibold">Questionnaire</h2>
        <div className="mt-4 space-y-6">
          {onboarding.sections.map((section) => (
            <div key={section.id}>
              <h3 className="font-medium">{section.title}</h3>
              <ul className="mt-2 divide-y text-sm">
                {onboarding.questions
                  .filter((q) => q.sectionId === section.id)
                  .map((q) => {
                    const response = responseByQuestion.get(q.id);
                    return (
                      <li key={q.id} className="py-2">
                        <div className="flex justify-between gap-2">
                          <span>
                            {q.label}
                            {q.required ? " *" : ""}
                          </span>
                          {response ? (
                            <SemanticBadge
                              tone={
                                response.reviewStatus === "ACCEPTED"
                                  ? "success"
                                  : response.reviewStatus === "NEEDS_CLARIFICATION"
                                    ? "warning"
                                    : "neutral"
                              }
                            >
                              {ONBOARDING_REVIEW_STATUS_LABELS[response.reviewStatus]}
                            </SemanticBadge>
                          ) : (
                            <span className="text-neutral-500">Unanswered</span>
                          )}
                        </div>
                        {response?.valueText ? (
                          <p className="mt-1 text-neutral-700">{response.valueText}</p>
                        ) : null}
                        {canManage && response ? (
                          <OnboardingReviewPanel
                            kind="response"
                            id={response.id}
                            expectedUpdatedAt={response.updatedAt.toISOString()}
                          />
                        ) : null}
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </div>
      </AdminPanel>

      <AdminPanel>
        <h2 className="font-semibold">Client requirements</h2>
        <ul className="mt-2 divide-y text-sm">
          {onboarding.requirements.map((req) => (
            <li key={req.id} className="py-2">
              <div className="flex justify-between gap-2">
                <span>
                  {req.title}
                  {req.required ? " *" : ""}
                </span>
                <SemanticBadge tone="neutral">{AGENCY_REQUIREMENT_STATUS_LABELS[req.status]}</SemanticBadge>
              </div>
              {req.clientReviewNote ? (
                <p className="mt-1 text-amber-800">{req.clientReviewNote}</p>
              ) : null}
              {canManage ? (
                <OnboardingReviewPanel
                  kind="requirement"
                  id={req.id}
                  expectedUpdatedAt={req.updatedAt.toISOString()}
                />
              ) : null}
            </li>
          ))}
        </ul>
      </AdminPanel>
    </div>
  );
}
