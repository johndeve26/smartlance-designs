"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { AIEditorialMode, AISourceType } from "@prisma/client";
import { assertSameOrigin, requireAdminUser } from "@/lib/admin/session";
import { assertCan } from "@/lib/admin/rbac";
import {
  addManualSource,
  approveForCms,
  archiveAIProject,
  createAIProject,
  createInsightDraftFromProject,
  duplicateAIProject,
  runBrief,
  runCannibalizationCheck,
  runEditorialQualityReview,
  runFactCheck,
  runFullDraft,
  runInternalLinkReview,
  runOutline,
  runResearch,
  runSeoAndAiSearchReviews,
  saveAIWriterSettings,
  saveBrandVoice,
  saveDraftMarkdown,
  saveOutline,
  setSourceSelected,
  updateAIProjectMeta,
  getOrCreateSettings,
} from "@/lib/ai/editorial-service";
import { outlineSchema } from "@/lib/ai/types";
import { prisma } from "@/lib/db";
import { runMockGoldenSuite } from "@/lib/ai/evaluation/evaluate";
import { PROMPT_VERSIONS } from "@/lib/ai/prompts";
import { createAIProvider, invalidateAIProviderCache, isCatalogProviderId } from "@/lib/ai/providers";
import { writeAuditLog } from "@/lib/repositories/auditRepository";

function revalidateAi(id?: string) {
  revalidatePath("/admin/ai-writer");
  if (id) revalidatePath(`/admin/ai-writer/${id}`);
  revalidatePath("/admin/system");
}

export async function createAIProjectAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("use_ai_writer");
  const mode = String(formData.get("mode") || "NEW_ARTICLE") as AIEditorialMode;
  const row = await createAIProject({
    actorId: user.id,
    title: String(formData.get("title") || "").trim() || "Untitled project",
    workingTopic: String(formData.get("workingTopic") || "").trim(),
    mode,
    targetAudience: String(formData.get("targetAudience") || "") || undefined,
    businessGoal: String(formData.get("businessGoal") || "") || undefined,
    primaryQuery: String(formData.get("primaryQuery") || "") || undefined,
    secondaryQueries: String(formData.get("secondaryQueries") || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    targetRegion: String(formData.get("targetRegion") || "") || undefined,
    contentType: String(formData.get("contentType") || "") || undefined,
    serviceHref: String(formData.get("serviceHref") || "") || undefined,
    solutionSlug: String(formData.get("solutionSlug") || "") || undefined,
    notes: String(formData.get("notes") || "") || undefined,
    linkedInsightId: String(formData.get("linkedInsightId") || "") || undefined,
  });
  revalidateAi(row.id);
  redirect(`/admin/ai-writer/${row.id}`);
}

export async function updateProjectMetaAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("use_ai_writer");
  const id = String(formData.get("id"));
  await updateAIProjectMeta(id, user.id, {
    title: String(formData.get("title") || ""),
    workingTopic: String(formData.get("workingTopic") || ""),
    uniqueValue: String(formData.get("uniqueValue") || "") || null,
    notes: String(formData.get("notes") || "") || null,
    businessGoal: String(formData.get("businessGoal") || "") || null,
    targetAudience: String(formData.get("targetAudience") || "") || null,
    primaryQuery: String(formData.get("primaryQuery") || "") || null,
    citationMode: String(formData.get("citationMode") || "RESEARCH_ONLY"),
  });
  revalidateAi(id);
}

export async function runCannibalizationAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("use_ai_writer");
  const id = String(formData.get("id"));
  await runCannibalizationCheck(id, user.id);
  revalidateAi(id);
}

export async function runResearchAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("use_ai_writer");
  const id = String(formData.get("id"));
  await runResearch(id, user.id);
  revalidateAi(id);
}

export async function addSourceAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("use_ai_writer");
  const id = String(formData.get("id"));
  await addManualSource(id, user.id, {
    url: String(formData.get("url") || ""),
    title: String(formData.get("title") || "") || undefined,
    notes: String(formData.get("notes") || "") || undefined,
    sourceType: (String(formData.get("sourceType") || "USER_SUPPLIED") as AISourceType),
  });
  revalidateAi(id);
}

export async function toggleSourceAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("use_ai_writer");
  const sourceId = String(formData.get("sourceId"));
  const selected = String(formData.get("selected")) === "1";
  const src = await setSourceSelected(sourceId, selected, user.id);
  revalidateAi(src.projectId);
}

export async function runBriefAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("use_ai_writer");
  const id = String(formData.get("id"));
  await runBrief(id, user.id);
  revalidateAi(id);
}

export async function runOutlineAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("use_ai_writer");
  const id = String(formData.get("id"));
  await runOutline(id, user.id);
  revalidateAi(id);
}

export async function saveOutlineAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("use_ai_writer");
  const id = String(formData.get("id"));
  const raw = String(formData.get("outlineJson") || "");
  const parsed = outlineSchema.parse(JSON.parse(raw));
  await saveOutline(id, user.id, parsed);
  revalidateAi(id);
}

export async function runDraftAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("use_ai_writer");
  const id = String(formData.get("id"));
  await runFullDraft(id, user.id);
  revalidateAi(id);
}

export async function saveDraftAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("use_ai_writer");
  const id = String(formData.get("id"));
  await saveDraftMarkdown(id, user.id, String(formData.get("draftMarkdown") || ""));
  revalidateAi(id);
}

export async function runFactCheckAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("use_ai_writer");
  const id = String(formData.get("id"));
  await runFactCheck(id, user.id);
  revalidateAi(id);
}

export async function runSeoAiSearchAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("use_ai_writer");
  const id = String(formData.get("id"));
  await runSeoAndAiSearchReviews(id, user.id);
  revalidateAi(id);
}

export async function runInternalLinksAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("use_ai_writer");
  const id = String(formData.get("id"));
  await runInternalLinkReview(id, user.id);
  revalidateAi(id);
}

export async function runQualityAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("use_ai_writer");
  const id = String(formData.get("id"));
  await runEditorialQualityReview(id, user.id);
  revalidateAi(id);
}

export async function approveForCmsAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("approve_ai_cms");
  const id = String(formData.get("id"));
  const overrideReason = String(formData.get("overrideReason") || "") || undefined;
  const checklistConfirmed = String(formData.get("checklistConfirmed")) === "on";
  await approveForCms(id, user.id, { overrideReason, checklistConfirmed });
  revalidateAi(id);
}

export async function createInsightFromAiAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("use_ai_writer");
  assertCan(user.role, "edit_draft");
  const id = String(formData.get("id"));
  const insight = await createInsightDraftFromProject(id, user.id);
  revalidateAi(id);
  revalidatePath("/admin/insights");
  redirect(`/admin/insights/${insight.id}`);
}

export async function archiveProjectAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("use_ai_writer");
  const id = String(formData.get("id"));
  await archiveAIProject(id, user.id);
  revalidateAi(id);
  redirect("/admin/ai-writer");
}

export async function duplicateProjectAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("use_ai_writer");
  const id = String(formData.get("id"));
  const copy = await duplicateAIProject(id, user.id);
  revalidateAi(copy.id);
  redirect(`/admin/ai-writer/${copy.id}`);
}

export async function saveAISettingsAction(formData: FormData) {
  // Backward-compatible combined save (routing then limits) for any legacy callers.
  // Prefer saveAIRoutingAction / saveAILimitsAction from the redesigned UI.
  await assertSameOrigin();
  const user = await requireAdminUser("manage_ai_settings");
  const current = await getOrCreateSettings();

  const defaultProviderId = String(formData.get("defaultProviderId") || current.defaultProviderId || "openai").trim();
  if (!isCatalogProviderId(defaultProviderId)) {
    throw new Error("Invalid default provider");
  }

  const optionalProvider = (key: string) => {
    const v = String(formData.get(key) || "").trim();
    if (!v) return null;
    if (!isCatalogProviderId(v)) throw new Error(`Invalid provider for ${key}`);
    return v;
  };

  await saveAIWriterSettings(user.id, {
    defaultProviderId,
    writingProviderId: optionalProvider("writingProviderId"),
    researchProviderId: optionalProvider("researchProviderId"),
    editorProviderId: optionalProvider("editorProviderId"),
    fastProviderId: optionalProvider("fastProviderId"),
    writingModel: String(formData.get("writingModel") || "") || null,
    researchModel: String(formData.get("researchModel") || "") || null,
    editorModel: String(formData.get("editorModel") || "") || null,
    fastModel: String(formData.get("fastModel") || "") || null,
    citationModeDefault: String(formData.get("citationModeDefault") || current.citationModeDefault || "RESEARCH_ONLY"),
    maxResearchQueries: Number(formData.get("maxResearchQueries") || current.maxResearchQueries || 8),
    maxSources: Number(formData.get("maxSources") || current.maxSources || 12),
    maxDraftRegens: Number(formData.get("maxDraftRegens") || current.maxDraftRegens || 20),
    maxConcurrentJobs: Number(formData.get("maxConcurrentJobs") || current.maxConcurrentJobs || 2),
    dailyTokenWarningThreshold: formData.get("dailyTokenWarningThreshold")
      ? Number(formData.get("dailyTokenWarningThreshold"))
      : current.dailyTokenWarningThreshold,
    staleJobMinutes: Number(formData.get("staleJobMinutes") || current.staleJobMinutes || 30),
    allowResultCache: formData.has("allowResultCache")
      ? String(formData.get("allowResultCache")) === "on"
      : (current.allowResultCache ?? true),
    sourcePolicyNotes: formData.has("sourcePolicyNotes")
      ? String(formData.get("sourcePolicyNotes") || "") || null
      : current.sourcePolicyNotes,
    disclosureMode: String(formData.get("disclosureMode") || current.disclosureMode || "none"),
  });

  invalidateAIProviderCache();
  revalidatePath("/admin/ai-writer/settings");
  revalidatePath("/admin/system");
  redirect("/admin/ai-writer/settings?notice=routing");
}

export async function saveAIRoutingAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_ai_settings");
  const current = await getOrCreateSettings();

  const defaultProviderId = String(formData.get("defaultProviderId") || current.defaultProviderId || "openai").trim();
  if (!isCatalogProviderId(defaultProviderId)) {
    throw new Error("Invalid default provider");
  }

  const optionalProvider = (key: string) => {
    const v = String(formData.get(key) || "").trim();
    if (!v) return null;
    if (!isCatalogProviderId(v)) throw new Error(`Invalid provider for ${key}`);
    return v;
  };

  const writingProviderId = optionalProvider("writingProviderId");
  const researchProviderId = optionalProvider("researchProviderId");
  const editorProviderId = optionalProvider("editorProviderId");
  const fastProviderId = optionalProvider("fastProviderId");

  await saveAIWriterSettings(user.id, {
    defaultProviderId,
    writingProviderId,
    researchProviderId,
    editorProviderId,
    fastProviderId,
    writingModel: String(formData.get("writingModel") || "") || null,
    researchModel: String(formData.get("researchModel") || "") || null,
    editorModel: String(formData.get("editorModel") || "") || null,
    fastModel: String(formData.get("fastModel") || "") || null,
    // Preserve limits / editorial fields
    citationModeDefault: current.citationModeDefault,
    maxResearchQueries: current.maxResearchQueries,
    maxSources: current.maxSources,
    maxDraftRegens: current.maxDraftRegens,
    maxConcurrentJobs: current.maxConcurrentJobs,
    dailyTokenWarningThreshold: current.dailyTokenWarningThreshold,
    staleJobMinutes: current.staleJobMinutes,
    allowResultCache: current.allowResultCache,
    sourcePolicyNotes: current.sourcePolicyNotes,
    disclosureMode: current.disclosureMode,
  });

  invalidateAIProviderCache();

  await writeAuditLog({
    actorId: user.id,
    action: "ai_settings.provider_assignment",
    entityType: "AIWriterSettings",
    entityId: "default",
    metadata: {
      defaultProviderId,
      writingProviderId,
      researchProviderId,
      editorProviderId,
      fastProviderId,
    },
  });

  revalidatePath("/admin/ai-writer/settings");
  revalidatePath("/admin/system");
  redirect("/admin/ai-writer/settings?notice=routing");
}

export async function saveAILimitsAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_ai_settings");
  const current = await getOrCreateSettings();

  await saveAIWriterSettings(user.id, {
    defaultProviderId: current.defaultProviderId,
    writingProviderId: current.writingProviderId,
    researchProviderId: current.researchProviderId,
    editorProviderId: current.editorProviderId,
    fastProviderId: current.fastProviderId,
    writingModel: current.writingModel,
    researchModel: current.researchModel,
    editorModel: current.editorModel,
    fastModel: current.fastModel,
    citationModeDefault: String(formData.get("citationModeDefault") || current.citationModeDefault || "RESEARCH_ONLY"),
    maxResearchQueries: Number(formData.get("maxResearchQueries") || current.maxResearchQueries || 8),
    maxSources: Number(formData.get("maxSources") || current.maxSources || 12),
    maxDraftRegens: Number(formData.get("maxDraftRegens") || current.maxDraftRegens || 20),
    maxConcurrentJobs: Number(formData.get("maxConcurrentJobs") || current.maxConcurrentJobs || 2),
    dailyTokenWarningThreshold: formData.get("dailyTokenWarningThreshold")
      ? Number(formData.get("dailyTokenWarningThreshold"))
      : null,
    staleJobMinutes: Number(formData.get("staleJobMinutes") || current.staleJobMinutes || 30),
    allowResultCache: String(formData.get("allowResultCache")) === "on",
    sourcePolicyNotes: String(formData.get("sourcePolicyNotes") || "") || null,
    disclosureMode: String(formData.get("disclosureMode") || current.disclosureMode || "none"),
  });

  invalidateAIProviderCache();

  await writeAuditLog({
    actorId: user.id,
    action: "ai_settings.limits_changed",
    entityType: "AIWriterSettings",
    entityId: "default",
    metadata: { scope: "limits" },
  });

  revalidatePath("/admin/ai-writer/settings");
  redirect("/admin/ai-writer/settings?notice=limits");
}

export async function saveBrandVoiceAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_ai_settings");
  const avoided = String(formData.get("avoidedPhrases") || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  await saveBrandVoice(user.id, {
    personality: String(formData.get("personality") || "") || null,
    audience: String(formData.get("audience") || "") || null,
    tone: String(formData.get("tone") || "") || null,
    sentenceStyle: String(formData.get("sentenceStyle") || "") || null,
    technicalDepth: String(formData.get("technicalDepth") || "") || null,
    ctaStyle: String(formData.get("ctaStyle") || "") || null,
    formattingPrefs: String(formData.get("formattingPrefs") || "") || null,
    avoidedPhrases: avoided,
    approved: String(formData.get("approved")) === "on",
  });
  revalidatePath("/admin/ai-writer/brand-voice");
}

/** Intentional mock golden suite — no paid API calls. */
export async function runMockEvaluationSuiteAction() {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_ai_settings");
  const results = runMockGoldenSuite();
  const provider = await createAIProvider();
  for (const row of results) {
    await prisma.aIEvaluationSnapshot.create({
      data: {
        name: `mock-suite:${row.fixtureId}`,
        fixtureId: row.fixtureId,
        promptVersion: PROMPT_VERSIONS.systemGuard,
        model: provider.resolveModel("FAST_MODEL"),
        mode: "mock",
        dimensions: row.dimensions,
        notes: `pass=${row.passed} warn=${row.warned} fail=${row.failed}`,
        createdById: user.id,
      },
    });
  }
  revalidatePath("/admin/ai-writer/evaluations");
  redirect("/admin/ai-writer/evaluations");
}

/** Topic Intelligence calibration suite — offline mocked signals only. */
export async function runTopicCalibrationSuiteAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_ai_settings");
  const includeHoldout = String(formData.get("includeHoldout")) === "on";
  const {
    runTopicCalibrationSuite,
    suiteResultToSnapshotDimensions,
  } = await import("@/lib/ai/topic-intelligence/calibration/evaluate");
  const result = runTopicCalibrationSuite({ includeHoldout });
  await prisma.aIEvaluationSnapshot.create({
    data: {
      name: includeHoldout
        ? "topic-intelligence-calibration:with-holdout"
        : "topic-intelligence-calibration",
      fixtureId: "topic-intelligence-suite",
      promptVersion: PROMPT_VERSIONS.opportunityAnalysis,
      model: "heuristic:opportunity-analysis:v1",
      mode: "mock",
      dimensions: suiteResultToSnapshotDimensions(result),
      notes: `matches=${result.totals.decisionMatches}/${result.totals.fixtures} fpWrite=${result.totals.falsePositiveWriteNew} fnStrong=${result.totals.falseNegativeStrong} holdout=${includeHoldout}`,
      createdById: user.id,
    },
  });
  revalidatePath("/admin/ai-writer/evaluations");
  redirect("/admin/ai-writer/evaluations");
}
