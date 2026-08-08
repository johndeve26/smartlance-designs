import { ContentAssistantPanel } from "@/components/admin/content-assistants/ContentAssistantPanel";
import { listPendingProposals, proposalFields } from "@/lib/ai/content-assistants/proposals";
import { getAssistantActions } from "@/lib/ai/content-assistants/registry";
import { canUseContentAssistant } from "@/lib/ai/content-assistants/security";
import { getAIProviderStatus } from "@/lib/ai/providers";
import type { SessionUser } from "@/lib/admin/session";
import type { ProposalPayload } from "@/lib/ai/content-assistants/types";

function mapProposals(
  rows: Awaited<ReturnType<typeof listPendingProposals>>,
) {
  return rows.map((row) => {
    const payload = row.payloadJson as unknown as ProposalPayload;
    return {
      id: row.id,
      action: row.action,
      status: row.status,
      fields: proposalFields(row),
      reviewFindings: payload.reviewFindings,
      suggestedRelations: payload.suggestedRelations,
      research: payload.research,
      claims: payload.claims,
      resultMode: payload.resultMode,
      createdAt: row.createdAt.toISOString(),
    };
  });
}

export async function ServiceAiPanel({
  serviceId,
  user,
  status,
  opportunityId,
  initialAction,
  scrollOnMount,
}: {
  serviceId: string;
  user: SessionUser;
  status: string;
  opportunityId?: string;
  initialAction?: string;
  scrollOnMount?: boolean;
}) {
  const canUse = canUseContentAssistant(user.role);
  const provider = await getAIProviderStatus();
  const rows = canUse ? await listPendingProposals("SERVICE", serviceId) : [];

  return (
    <ContentAssistantPanel
      entityType="SERVICE"
      entityId={serviceId}
      title="Service AI"
      actions={getAssistantActions("SERVICE")}
      proposals={mapProposals(rows)}
      providerConfigured={provider.configured}
      canUse={canUse}
      isNewDraft={status === "DRAFT"}
      opportunityId={opportunityId}
      initialAction={initialAction}
      scrollOnMount={scrollOnMount}
    />
  );
}

export async function SolutionAiPanel({
  solutionId,
  user,
  status,
  opportunityId,
  initialAction,
  scrollOnMount,
}: {
  solutionId: string;
  user: SessionUser;
  status: string;
  opportunityId?: string;
  initialAction?: string;
  scrollOnMount?: boolean;
}) {
  const canUse = canUseContentAssistant(user.role);
  const provider = await getAIProviderStatus();
  const rows = canUse ? await listPendingProposals("SOLUTION", solutionId) : [];

  return (
    <ContentAssistantPanel
      entityType="SOLUTION"
      entityId={solutionId}
      title="Solution AI"
      actions={getAssistantActions("SOLUTION")}
      proposals={mapProposals(rows)}
      providerConfigured={provider.configured}
      canUse={canUse}
      isNewDraft={status === "DRAFT"}
      opportunityId={opportunityId}
      initialAction={initialAction}
      scrollOnMount={scrollOnMount}
    />
  );
}

export async function PlatformAiPanel({
  platformId,
  user,
  status,
  lastReviewedAt,
  opportunityId,
  initialAction,
}: {
  platformId: string;
  user: SessionUser;
  status: string;
  lastReviewedAt?: Date | null;
  opportunityId?: string;
  initialAction?: string;
}) {
  const canUse = canUseContentAssistant(user.role);
  const provider = await getAIProviderStatus();
  const rows = canUse ? await listPendingProposals("PLATFORM", platformId) : [];

  return (
    <ContentAssistantPanel
      entityType="PLATFORM"
      entityId={platformId}
      title="Platform AI"
      actions={getAssistantActions("PLATFORM")}
      proposals={mapProposals(rows)}
      providerConfigured={provider.configured}
      canUse={canUse}
      isNewDraft={status === "DRAFT"}
      opportunityId={opportunityId}
      lastReviewedAt={lastReviewedAt ? lastReviewedAt.toISOString() : null}
      initialAction={initialAction}
      showResearchHints
    />
  );
}

export async function IndustryAiPanel({
  industryId,
  user,
  status,
  opportunityId,
  verifiedExperience,
  initialAction,
  scrollOnMount,
}: {
  industryId: string;
  user: SessionUser;
  status: string;
  opportunityId?: string;
  verifiedExperience?: boolean;
  initialAction?: string;
  scrollOnMount?: boolean;
}) {
  const canUse = canUseContentAssistant(user.role);
  const provider = await getAIProviderStatus();
  const rows = canUse ? await listPendingProposals("INDUSTRY", industryId) : [];

  return (
    <ContentAssistantPanel
      entityType="INDUSTRY"
      entityId={industryId}
      title="Industry AI"
      actions={getAssistantActions("INDUSTRY")}
      proposals={mapProposals(rows)}
      providerConfigured={provider.configured}
      canUse={canUse}
      isNewDraft={status === "DRAFT"}
      opportunityId={opportunityId}
      experienceMode={verifiedExperience ? "proven" : "supported"}
      initialAction={initialAction}
      scrollOnMount={scrollOnMount}
    />
  );
}

export async function WorkAiPanel({
  workId,
  user,
  status,
  enoughFacts,
  approvedForAI,
  opportunityId,
}: {
  workId: string;
  user: SessionUser;
  status: string;
  enoughFacts: boolean;
  approvedForAI: boolean;
  opportunityId?: string;
}) {
  const canUse = canUseContentAssistant(user.role);
  const provider = await getAIProviderStatus();
  const rows = canUse ? await listPendingProposals("WORK", workId) : [];

  const banner = !enoughFacts
    ? "More project information is needed. Case Study AI can improve verified material, but it won't invent missing project facts."
    : !approvedForAI
      ? "Approved project facts are not opted in — AI will only use existing public Case Study fields as known copy."
      : "Case Study AI writes presentation from verified project facts. It will not invent metrics, platforms, or services.";

  return (
    <ContentAssistantPanel
      entityType="WORK"
      entityId={workId}
      title="Case Study AI"
      actions={getAssistantActions("WORK")}
      proposals={mapProposals(rows)}
      providerConfigured={provider.configured}
      canUse={canUse}
      isNewDraft={status === "DRAFT"}
      opportunityId={opportunityId}
      bannerMessage={
        opportunityId
          ? `${banner} Suggested by Topic Intelligence — generate only when you choose.`
          : banner
      }
    />
  );
}

export async function TestimonialAiPanel({
  testimonialId,
  user,
  status,
  hasQuote,
}: {
  testimonialId: string;
  user: SessionUser;
  status: string;
  hasQuote: boolean;
}) {
  const canUse = canUseContentAssistant(user.role);
  const provider = await getAIProviderStatus();
  const rows = canUse
    ? await listPendingProposals("TESTIMONIAL", testimonialId)
    : [];

  return (
    <ContentAssistantPanel
      entityType="TESTIMONIAL"
      entityId={testimonialId}
      title="Testimonial Assistant"
      actions={getAssistantActions("TESTIMONIAL")}
      proposals={mapProposals(rows)}
      providerConfigured={provider.configured}
      canUse={canUse}
      isNewDraft={status === "DRAFT"}
      bannerMessage="Testimonial Assistant can format or excerpt verified feedback. It will not generate or invent client quotes. Preserve the client's words."
      actionsDisabledReason={
        hasQuote
          ? undefined
          : "Add the client's verified feedback before using Testimonial Assistant."
      }
    />
  );
}

const RESOURCE_PANEL: Record<
  "GUIDE" | "COMPARISON" | "CHECKLIST" | "GLOSSARY" | "TEMPLATE" | "TOOL",
  { title: string; banner: string; showResearchHints?: boolean }
> = {
  GUIDE: {
    title: "Guide AI",
    banner:
      "Deep evergreen education. Preserve section IDs. Research when facts are volatile.",
    showResearchHints: true,
  },
  COMPARISON: {
    title: "Comparison AI",
    banner:
      "Neutral decision support. No universal winners or fabricated ratings. Research both options.",
    showResearchHints: true,
  },
  CHECKLIST: {
    title: "Checklist AI",
    banner:
      "Improve actionable wording. Stable item IDs are protected for local progress.",
  },
  GLOSSARY: {
    title: "Glossary AI",
    banner:
      "Plain-English definitions first. Prefer official sources for technical terms.",
    showResearchHints: true,
  },
  TEMPLATE: {
    title: "Template Assistant",
    banner:
      "Improve labels, help, and placeholders only. Field IDs and conditionals are protected.",
  },
  TOOL: {
    title: "Tool Copy Assistant",
    banner:
      "Improve public ToolContent copy and SEO. Scoring and question engine IDs are not editable here.",
  },
};

export async function HomepageAiPanel({
  user,
  opportunityId,
}: {
  user: SessionUser;
  opportunityId?: string;
}) {
  const canUse = canUseContentAssistant(user.role);
  const provider = await getAIProviderStatus();
  const rows = canUse ? await listPendingProposals("HOMEPAGE", "home") : [];

  return (
    <ContentAssistantPanel
      entityType="HOMEPAGE"
      entityId="home"
      title="Homepage Copy Assistant"
      actions={getAssistantActions("HOMEPAGE")}
      proposals={mapProposals(rows)}
      providerConfigured={provider.configured}
      canUse={canUse}
      isNewDraft={false}
      opportunityId={opportunityId}
      bannerMessage="Assists Homepage copy and SEO on the draft. Does not redesign layout, invent trust metrics, or publish."
    />
  );
}

export async function ResourceAiPanel({
  entityType,
  resourceId,
  user,
  status,
  opportunityId,
}: {
  entityType: "GUIDE" | "COMPARISON" | "CHECKLIST" | "GLOSSARY" | "TEMPLATE" | "TOOL";
  resourceId: string;
  user: SessionUser;
  status: string;
  opportunityId?: string;
}) {
  const meta = RESOURCE_PANEL[entityType];
  const canUse = canUseContentAssistant(user.role);
  const provider = await getAIProviderStatus();
  const rows = canUse ? await listPendingProposals(entityType, resourceId) : [];

  return (
    <ContentAssistantPanel
      entityType={entityType}
      entityId={resourceId}
      title={meta.title}
      actions={getAssistantActions(entityType)}
      proposals={mapProposals(rows)}
      providerConfigured={provider.configured}
      canUse={canUse}
      isNewDraft={status === "DRAFT"}
      opportunityId={opportunityId}
      bannerMessage={meta.banner}
      showResearchHints={meta.showResearchHints}
    />
  );
}
