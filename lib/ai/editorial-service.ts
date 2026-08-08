import { createHash } from "crypto";
import type {
  AIEditorialMode,
  AIEditorialStatus,
  AIRunOperation,
  AISourceType,
  AIClaimEvidenceStrength,
  Prisma,
} from "@prisma/client";
import { prisma, hasDatabaseUrl } from "@/lib/db";
import { writeAuditLog } from "@/lib/repositories/auditRepository";
import { saveInsightDraft } from "@/lib/repositories/insightsRepository";
import { createAIProviderForRole, getAIProviderStatus } from "@/lib/ai/providers";
import type { AIProvider } from "@/lib/ai/providers/types";
import {
  AIProviderNotConfiguredError,
  AIProviderRequestError,
} from "@/lib/ai/providers/types";
import {
  createResearchProvider,
  classifySource,
  getResearchProviderStatus,
} from "@/lib/ai/research";
import { editorialKnowledge } from "@/lib/ai/knowledge";
import {
  PROMPT_VERSIONS,
  SYSTEM_GUARD,
  brandVoiceBlock,
} from "@/lib/ai/prompts";
import {
  assertSafeHttpUrl,
  isSafeHttpUrl,
  sandboxUntrustedText,
  slugifySuggestion,
  draftContentHash,
} from "@/lib/ai/safety";
import {
  DRAFT_INVALIDATES,
  SOURCE_INVALIDATES,
  BRIEF_INVALIDATES,
  mergeStale,
  clearStale,
} from "@/lib/ai/stale";
import { recoverStaleAiJobs } from "@/lib/ai/jobs";
import {
  getGlobalUsageWindow,
  getProjectUsageSummary,
  parseModelPricing,
  estimateCostUsd,
} from "@/lib/ai/cost";
import { computeEditorialBlockers, approvalSummary } from "@/lib/ai/blockers";
import { SMARTLANCE_BRAND_VOICE } from "@/lib/ai/brand-voice-defaults";
import {
  aiSearchReviewSchema,
  briefSchema,
  cannibalizationSchema,
  claimExtractSchema,
  internalLinkSuggestionSchema,
  outlineSchema,
  researchNotesSchema,
  seoReviewSchema,
  type CannibalizationResult,
} from "@/lib/ai/types";

function fingerprint(input: unknown): string {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex").slice(0, 24);
}

async function getOrCreateSettings() {
  return prisma.aIWriterSettings.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
  });
}

async function getBrandVoice() {
  return prisma.aIBrandVoice.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      personality: SMARTLANCE_BRAND_VOICE.personality,
      audience: SMARTLANCE_BRAND_VOICE.audience,
      tone: SMARTLANCE_BRAND_VOICE.tone,
      sentenceStyle: SMARTLANCE_BRAND_VOICE.sentenceStyle,
      technicalDepth: SMARTLANCE_BRAND_VOICE.technicalDepth,
      ctaStyle: SMARTLANCE_BRAND_VOICE.ctaStyle,
      formattingPrefs: SMARTLANCE_BRAND_VOICE.formattingPrefs,
      avoidedPhrases: [...SMARTLANCE_BRAND_VOICE.avoidedPhrases],
      approved: true,
    },
    update: {},
  });
}

export async function listAIProjects(filters?: {
  status?: AIEditorialStatus;
  mode?: AIEditorialMode;
  q?: string;
  linked?: "linked" | "unlinked";
}) {
  if (!hasDatabaseUrl()) return [];
  const where: Prisma.AIEditorialProjectWhereInput = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.mode) where.mode = filters.mode;
  if (filters?.linked === "linked") where.linkedInsightId = { not: null };
  if (filters?.linked === "unlinked") where.linkedInsightId = null;
  if (filters?.q?.trim()) {
    const q = filters.q.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { workingTopic: { contains: q, mode: "insensitive" } },
      { linkedInsight: { title: { contains: q, mode: "insensitive" } } },
    ];
  }
  return prisma.aIEditorialProject.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      linkedInsight: { select: { id: true, title: true, slug: true, status: true, updatedAt: true } },
    },
  });
}

export async function getAIProject(id: string) {
  return prisma.aIEditorialProject.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true } },
      updatedBy: { select: { id: true, name: true } },
      linkedInsight: true,
      sources: { orderBy: { createdAt: "asc" } },
      claims: { include: { sources: { include: { source: true } } }, orderBy: { createdAt: "asc" } },
      runs: { orderBy: { createdAt: "desc" }, take: 40 },
    },
  });
}

export async function createAIProject(input: {
  actorId: string;
  title: string;
  workingTopic: string;
  mode?: AIEditorialMode;
  targetAudience?: string;
  businessGoal?: string;
  primaryQuery?: string;
  secondaryQueries?: string[];
  targetRegion?: string;
  contentType?: string;
  serviceHref?: string;
  solutionSlug?: string;
  notes?: string;
  linkedInsightId?: string;
}) {
  const settings = await getOrCreateSettings();
  const row = await prisma.aIEditorialProject.create({
    data: {
      title: input.title.trim() || "Untitled editorial project",
      workingTopic: input.workingTopic.trim(),
      mode: input.mode || "NEW_ARTICLE",
      status: "IDEA",
      targetAudience: input.targetAudience,
      businessGoal: input.businessGoal,
      primaryQuery: input.primaryQuery,
      secondaryQueries: input.secondaryQueries ?? [],
      targetRegion: input.targetRegion,
      contentType: input.contentType,
      serviceHref: input.serviceHref,
      solutionSlug: input.solutionSlug,
      notes: input.notes,
      linkedInsightId: input.linkedInsightId,
      citationMode: settings.citationModeDefault,
      createdById: input.actorId,
      updatedById: input.actorId,
      insightSnapshotAt: input.linkedInsightId ? new Date() : undefined,
    },
  });
  await writeAuditLog({
    actorId: input.actorId,
    action: "ai_project.created",
    entityType: "AIEditorialProject",
    entityId: row.id,
    metadata: { mode: row.mode, title: row.title },
  });
  return row;
}

export async function updateAIProjectMeta(
  id: string,
  actorId: string,
  data: Prisma.AIEditorialProjectUncheckedUpdateInput,
) {
  const existing = await prisma.aIEditorialProject.findUnique({
    where: { id },
    select: {
      analysisStale: true,
      businessGoal: true,
      targetAudience: true,
      primaryQuery: true,
      uniqueValue: true,
      draftMarkdown: true,
    },
  });
  const briefChanged =
    (data.businessGoal !== undefined && data.businessGoal !== existing?.businessGoal) ||
    (data.targetAudience !== undefined &&
      data.targetAudience !== existing?.targetAudience) ||
    (data.primaryQuery !== undefined && data.primaryQuery !== existing?.primaryQuery) ||
    (data.uniqueValue !== undefined && data.uniqueValue !== existing?.uniqueValue);

  const row = await prisma.aIEditorialProject.update({
    where: { id },
    data: {
      ...data,
      updatedById: actorId,
      ...(briefChanged && existing?.draftMarkdown
        ? {
            analysisStale: mergeStale(existing.analysisStale, BRIEF_INVALIDATES),
          }
        : {}),
    },
  });
  return row;
}

export async function archiveAIProject(id: string, actorId: string) {
  return prisma.aIEditorialProject.update({
    where: { id },
    data: { status: "ARCHIVED", updatedById: actorId },
  });
}

export async function duplicateAIProject(id: string, actorId: string) {
  const src = await getAIProject(id);
  if (!src) throw new Error("Project not found");
  return createAIProject({
    actorId,
    title: `${src.title} (copy)`,
    workingTopic: src.workingTopic,
    mode: src.mode,
    targetAudience: src.targetAudience ?? undefined,
    businessGoal: src.businessGoal ?? undefined,
    primaryQuery: src.primaryQuery ?? undefined,
    secondaryQueries: Array.isArray(src.secondaryQueries)
      ? (src.secondaryQueries as string[])
      : undefined,
    notes: src.notes ?? undefined,
  });
}

async function startRun(input: {
  projectId: string;
  operation: AIRunOperation;
  actorId: string;
  provider: string;
  model?: string;
  promptVersion?: string;
  inputFingerprint?: string;
}) {
  return prisma.aIEditorialRun.create({
    data: {
      projectId: input.projectId,
      operation: input.operation,
      provider: input.provider,
      model: input.model,
      promptVersion: input.promptVersion,
      inputFingerprint: input.inputFingerprint,
      status: "RUNNING",
      startedAt: new Date(),
      createdById: input.actorId,
    },
  });
}

async function finishRun(
  runId: string,
  result: {
    status: "SUCCEEDED" | "FAILED" | "CANCELLED";
    usage?: { input?: number; output?: number };
    requestId?: string;
    errorCode?: string;
    errorSummary?: string;
    resultSummary?: Prisma.InputJsonValue;
  },
) {
  return prisma.aIEditorialRun.update({
    where: { id: runId },
    data: {
      status: result.status,
      completedAt: new Date(),
      tokenUsageInput: result.usage?.input,
      tokenUsageOutput: result.usage?.output,
      providerRequestId: result.requestId,
      errorCode: result.errorCode,
      errorSummary: result.errorSummary?.slice(0, 500),
      resultSummary: result.resultSummary,
    },
  });
}

async function withRun<T>(
  input: {
    projectId: string;
    operation: AIRunOperation;
    actorId: string;
    provider: AIProvider;
    modelRole?: "RESEARCH_MODEL" | "WRITING_MODEL" | "EDITOR_MODEL" | "FAST_MODEL";
    promptVersion: string;
    fingerprintInput?: unknown;
    /** When true, reuse recent identical SUCCEEDED run resultSummary as cache for analysis ops */
    allowCache?: boolean;
  },
  fn: (ctx: { model: string; runId: string }) => Promise<{
    data: T;
    usage?: { input?: number; output?: number };
    requestId?: string;
    resultSummary?: Prisma.InputJsonValue;
    /** When caching analysis, return reconstructed data from prior resultSummary */
    fromCache?: boolean;
  }>,
): Promise<T> {
  const settings = await getOrCreateSettings();
  await recoverStaleAiJobs(settings.staleJobMinutes ?? 30);

  const running = await prisma.aIEditorialRun.count({
    where: { status: "RUNNING" },
  });
  if (running >= settings.maxConcurrentJobs) {
    throw new Error("Too many concurrent AI jobs. Wait for one to finish and retry.");
  }

  const model = input.provider.resolveModel(input.modelRole);
  const fp = input.fingerprintInput
    ? fingerprint(input.fingerprintInput)
    : undefined;

  // Duplicate in-flight protection (double-click)
  if (fp) {
    const inFlight = await prisma.aIEditorialRun.findFirst({
      where: {
        projectId: input.projectId,
        operation: input.operation,
        inputFingerprint: fp,
        status: { in: ["QUEUED", "RUNNING"] },
      },
      orderBy: { createdAt: "desc" },
    });
    if (inFlight) {
      throw new Error(
        "An identical generation is already running. Wait for it to finish — duplicate launch blocked.",
      );
    }
  }

  // Result cache for identical analysis fingerprints (not drafts)
  const cacheableOps: AIRunOperation[] = [
    "CANNIBALIZATION_CHECK",
    "SEO_REVIEW",
    "AI_SEARCH_REVIEW",
    "INTERNAL_LINK_REVIEW",
    "EDITORIAL_REVIEW",
    "FACT_CHECK",
  ];
  if (
    settings.allowResultCache &&
    input.allowCache !== false &&
    fp &&
    cacheableOps.includes(input.operation)
  ) {
    const recent = await prisma.aIEditorialRun.findFirst({
      where: {
        projectId: input.projectId,
        operation: input.operation,
        inputFingerprint: fp,
        status: "SUCCEEDED",
        createdAt: { gte: new Date(Date.now() - 6 * 3600_000) },
      },
      orderBy: { createdAt: "desc" },
    });
    if (recent?.resultSummary && typeof recent.resultSummary === "object") {
      const cached = (recent.resultSummary as { cachedData?: T }).cachedData;
      if (cached !== undefined) {
        await prisma.aIEditorialRun.create({
          data: {
            projectId: input.projectId,
            operation: input.operation,
            provider: input.provider.id,
            model,
            promptVersion: input.promptVersion,
            inputFingerprint: fp,
            status: "SUCCEEDED",
            startedAt: new Date(),
            completedAt: new Date(),
            tokenUsageInput: 0,
            tokenUsageOutput: 0,
            createdById: input.actorId,
            resultSummary: {
              cacheHit: true,
              priorRunId: recent.id,
            },
          },
        });
        return cached;
      }
    }
  }

  const run = await startRun({
    projectId: input.projectId,
    operation: input.operation,
    actorId: input.actorId,
    provider: input.provider.id,
    model,
    promptVersion: input.promptVersion,
    inputFingerprint: fp,
  });

  try {
    if (!input.provider.isConfigured()) {
      throw new AIProviderNotConfiguredError(input.provider.id);
    }
    const out = await fn({ model, runId: run.id });
    // Re-check cancellation / still RUNNING before save
    const current = await prisma.aIEditorialRun.findUnique({
      where: { id: run.id },
      select: { status: true },
    });
    if (current?.status === "CANCELLED") {
      throw new Error("Run was cancelled; result discarded.");
    }
    await finishRun(run.id, {
      status: "SUCCEEDED",
      usage: out.usage,
      requestId: out.requestId,
      resultSummary: {
        ...(out.resultSummary && typeof out.resultSummary === "object"
          ? (out.resultSummary as object)
          : out.resultSummary
            ? { summary: out.resultSummary }
            : {}),
        ...(cacheableOps.includes(input.operation)
          ? { cachedData: out.data as unknown as Prisma.InputJsonValue }
          : {}),
      } as Prisma.InputJsonValue,
    });
    return out.data;
  } catch (err) {
    const code =
      err instanceof AIProviderNotConfiguredError
        ? "NOT_CONFIGURED"
        : err instanceof AIProviderRequestError
          ? err.code
          : err instanceof Error && /cancelled/i.test(err.message)
            ? "CANCELLED"
            : "FAILED";
    await finishRun(run.id, {
      status: code === "CANCELLED" ? "CANCELLED" : "FAILED",
      errorCode: code,
      errorSummary: err instanceof Error ? err.message : "Unknown error",
    });
    throw err;
  }
}

export async function runCannibalizationCheck(projectId: string, actorId: string) {
  const project = await getAIProject(projectId);
  if (!project) throw new Error("Project not found");
  const provider = await createAIProviderForRole("FAST_MODEL");
  const knowledge = await editorialKnowledge.searchSiteKnowledge(project.workingTopic, 20);
  const insights = knowledge.filter((k) => k.entityType === "Insight");
  const resources = knowledge.filter((k) => k.entityType === "CmsResource");

  const data = await withRun(
    {
      projectId,
      operation: "CANNIBALIZATION_CHECK",
      actorId,
      provider,
      modelRole: "FAST_MODEL",
      promptVersion: PROMPT_VERSIONS.cannibalization,
      fingerprintInput: { topic: project.workingTopic },
    },
    async () => {
      const result = await provider.generateStructured({
        modelRole: "FAST_MODEL",
        schema: cannibalizationSchema,
        schemaName: "cannibalization",
        messages: [
          { role: "system", content: SYSTEM_GUARD },
          {
            role: "user",
            content: [
              `Topic: ${project.workingTopic}`,
              `Primary query: ${project.primaryQuery || "(none)"}`,
              "Existing published Insights/Resources (candidates):",
              [...insights, ...resources]
                .map((i) => `- ${i.id} | ${i.title} | ${i.path} | ${i.summary.slice(0, 160)}`)
                .join("\n") || "(none)",
              "Classify overlap. Prefer UPDATE when substantial cannibalization.",
              "Return JSON matching cannibalization schema.",
            ].join("\n"),
          },
        ],
      });
      return {
        data: result.data,
        usage: result.usage,
        requestId: result.requestId,
        resultSummary: { classification: result.data.classification },
      };
    },
  );

  await prisma.aIEditorialProject.update({
    where: { id: projectId },
    data: {
      cannibalization: data as unknown as Prisma.InputJsonValue,
      updatedById: actorId,
    },
  });
  return data as CannibalizationResult;
}

export async function runResearch(projectId: string, actorId: string, queries?: string[]) {
  const project = await getAIProject(projectId);
  if (!project) throw new Error("Project not found");
  const settings = await getOrCreateSettings();
  const research = createResearchProvider();
  const provider = await createAIProviderForRole("WRITING_MODEL");

  await prisma.aIEditorialProject.update({
    where: { id: projectId },
    data: { status: "RESEARCHING", updatedById: actorId },
  });

  const qList = (
    queries?.length
      ? queries
      : [project.primaryQuery || project.workingTopic, project.workingTopic]
  )
    .map((q) => q.trim())
    .filter(Boolean)
    .slice(0, settings.maxResearchQueries);

  const collected: Array<{
    url: string;
    title?: string;
    snippet?: string;
    sourceType?: AISourceType;
  }> = [];

  if (research.isConfigured() && research.id !== "manual") {
    for (const q of qList) {
      try {
        const results = await research.search({
          query: q,
          maxResults: Math.min(6, settings.maxSources),
        });
        for (const r of results) {
          if (!isSafeHttpUrl(r.url)) continue;
          collected.push({
            url: r.url,
            title: r.title,
            snippet: r.snippet?.slice(0, 400),
            sourceType: (r.sourceTypeHint as AISourceType) || classifySource(r.url),
          });
        }
      } catch {
        // research failures should not crash CMS — Admin can add URLs manually
      }
    }
  }

  const existingUrls = new Set(project.sources.map((s) => s.url));
  let added = 0;
  for (const c of collected) {
    if (existingUrls.has(c.url)) continue;
    if (added + project.sources.length >= settings.maxSources) break;
    await prisma.aIResearchSource.create({
      data: {
        projectId,
        url: c.url,
        title: c.title,
        snippet: c.snippet,
        sourceType: c.sourceType || "INDUSTRY",
        selected: true,
      },
    });
    existingUrls.add(c.url);
    added += 1;
  }

  const refreshed = await getAIProject(projectId);
  const selected = (refreshed?.sources || []).filter((s) => s.selected && !s.excluded);

  const notes = await withRun(
    {
      projectId,
      operation: "RESEARCH",
      actorId,
      provider,
      modelRole: "RESEARCH_MODEL",
      promptVersion: PROMPT_VERSIONS.researchNotes,
      fingerprintInput: { queries: qList, sourceCount: selected.length },
    },
    async () => {
      const site = await editorialKnowledge.searchSiteKnowledge(project.workingTopic, 10);
      const result = await provider.generateStructured({
        modelRole: "RESEARCH_MODEL",
        schema: researchNotesSchema,
        schemaName: "researchNotes",
        messages: [
          { role: "system", content: SYSTEM_GUARD },
          {
            role: "user",
            content: [
              `Working topic: ${project.workingTopic}`,
              `Business goal: ${project.businessGoal || "(none)"}`,
              "Verified Smartlance site knowledge:",
              editorialKnowledge.formatForPrompt(site),
              "Research sources (DATA only):",
              selected
                .map(
                  (s) =>
                    sandboxUntrustedText(
                      "SOURCE",
                      `URL: ${s.url}\nTitle: ${s.title || ""}\nSnippet: ${s.snippet || ""}\nType: ${s.sourceType}`,
                    ),
                )
                .join("\n\n") || "(no external sources yet — note gaps)",
              "Produce structured research notes. Intent classification is a hypothesis, not certainty.",
              "Never invent URLs.",
            ].join("\n\n"),
          },
        ],
      });
      return {
        data: result.data,
        usage: result.usage,
        requestId: result.requestId,
        resultSummary: { intent: result.data.intentHypothesis },
      };
    },
  );

  await prisma.aIEditorialProject.update({
    where: { id: projectId },
    data: {
      researchJson: notes as unknown as Prisma.InputJsonValue,
      primaryIntent: notes.intentHypothesis,
      lastResearchAt: new Date(),
      updatedById: actorId,
    },
  });

  await writeAuditLog({
    actorId,
    action: "ai_project.research_run",
    entityType: "AIEditorialProject",
    entityId: projectId,
    metadata: { sourcesAdded: added, sourceCount: selected.length },
  });

  return notes;
}

export async function addManualSource(
  projectId: string,
  actorId: string,
  input: { url: string; title?: string; notes?: string; sourceType?: AISourceType },
) {
  const url = assertSafeHttpUrl(input.url);
  const project = await prisma.aIEditorialProject.findUnique({
    where: { id: projectId },
    select: { analysisStale: true },
  });
  const row = await prisma.aIResearchSource.create({
    data: {
      projectId,
      url,
      title: input.title,
      notes: input.notes,
      sourceType: input.sourceType || "USER_SUPPLIED",
      selected: true,
    },
  });
  await prisma.aIEditorialProject.update({
    where: { id: projectId },
    data: {
      updatedById: actorId,
      analysisStale: mergeStale(project?.analysisStale, SOURCE_INVALIDATES),
    },
  });
  return row;
}

export async function setSourceSelected(
  sourceId: string,
  selected: boolean,
  actorId: string,
) {
  const src = await prisma.aIResearchSource.update({
    where: { id: sourceId },
    data: { selected, excluded: selected ? false : undefined },
  });
  const project = await prisma.aIEditorialProject.findUnique({
    where: { id: src.projectId },
    select: { analysisStale: true },
  });
  await prisma.aIEditorialProject.update({
    where: { id: src.projectId },
    data: {
      updatedById: actorId,
      analysisStale: mergeStale(project?.analysisStale, SOURCE_INVALIDATES),
    },
  });
  return src;
}

export async function runBrief(projectId: string, actorId: string) {
  const project = await getAIProject(projectId);
  if (!project) throw new Error("Project not found");
  const provider = await createAIProviderForRole("RESEARCH_MODEL");
  const voice = await getBrandVoice();
  const site = await editorialKnowledge.searchSiteKnowledge(project.workingTopic, 12);
  const selected = project.sources.filter((s) => s.selected && !s.excluded);

  const brief = await withRun(
    {
      projectId,
      operation: "BRIEF",
      actorId,
      provider,
      modelRole: "RESEARCH_MODEL",
      promptVersion: PROMPT_VERSIONS.brief,
    },
    async () => {
      const result = await provider.generateStructured({
        modelRole: "RESEARCH_MODEL",
        schema: briefSchema,
        schemaName: "brief",
        messages: [
          { role: "system", content: SYSTEM_GUARD },
          {
            role: "user",
            content: [
              brandVoiceBlock(voice),
              `Topic: ${project.workingTopic}`,
              `Audience: ${project.targetAudience || "business decision-makers evaluating web/SEO work"}`,
              `Business goal: ${project.businessGoal || "Build authority"}`,
              `Cannibalization: ${JSON.stringify(project.cannibalization || {})}`,
              `Research notes: ${JSON.stringify(project.researchJson || {})}`,
              "Site knowledge:",
              editorialKnowledge.formatForPrompt(site),
              "Selected sources:",
              selected.map((s) => `- ${s.url} (${s.sourceType})`).join("\n"),
              "Require a UNIQUE VALUE STATEMENT. If commodity risk, set commodityRisk true.",
              "Return content brief JSON.",
            ].join("\n\n"),
          },
        ],
      });
      return {
        data: result.data,
        usage: result.usage,
        requestId: result.requestId,
        resultSummary: { title: result.data.workingTitle },
      };
    },
  );

  await prisma.aIEditorialProject.update({
    where: { id: projectId },
    data: {
      briefJson: brief as unknown as Prisma.InputJsonValue,
      uniqueValue: brief.uniqueValue,
      commodityWarning: brief.commodityRisk,
      title: brief.workingTitle || project.title,
      status: "BRIEF_READY",
      updatedById: actorId,
    },
  });
  return brief;
}

export async function runOutline(projectId: string, actorId: string) {
  const project = await getAIProject(projectId);
  if (!project) throw new Error("Project not found");
  if (project.commodityWarning && !project.uniqueValue?.trim()) {
    throw new Error(
      "This topic currently lacks a clear original Smartlance angle. Add a unique value statement before outlining.",
    );
  }
  const provider = await createAIProviderForRole("WRITING_MODEL");
  const voice = await getBrandVoice();

  const outline = await withRun(
    {
      projectId,
      operation: "OUTLINE",
      actorId,
      provider,
      modelRole: "WRITING_MODEL",
      promptVersion: PROMPT_VERSIONS.outline,
    },
    async () => {
      const result = await provider.generateStructured({
        modelRole: "WRITING_MODEL",
        schema: outlineSchema,
        schemaName: "outline",
        messages: [
          { role: "system", content: SYSTEM_GUARD },
          {
            role: "user",
            content: [
              brandVoiceBlock(voice),
              `Brief: ${JSON.stringify(project.briefJson)}`,
              `Unique value: ${project.uniqueValue}`,
              "Create an editable outline. Each section needs id (stable slug), heading, purpose, readerQuestion, keyPoints, estimatedDepth.",
              "Do not create 25 FAQ headings. Prefer useful structure.",
            ].join("\n\n"),
          },
        ],
      });
      return {
        data: result.data,
        usage: result.usage,
        requestId: result.requestId,
        resultSummary: { sections: result.data.sections.length },
      };
    },
  );

  await prisma.aIEditorialProject.update({
    where: { id: projectId },
    data: {
      outlineJson: outline as unknown as Prisma.InputJsonValue,
      status: "OUTLINE_READY",
      updatedById: actorId,
    },
  });
  return outline;
}

export async function saveOutline(
  projectId: string,
  actorId: string,
  outline: unknown,
) {
  const parsed = outlineSchema.parse(outline);
  await prisma.aIEditorialProject.update({
    where: { id: projectId },
    data: {
      outlineJson: parsed as unknown as Prisma.InputJsonValue,
      updatedById: actorId,
    },
  });
  return parsed;
}

export async function runFullDraft(projectId: string, actorId: string) {
  const project = await getAIProject(projectId);
  if (!project) throw new Error("Project not found");
  const provider = await createAIProviderForRole("WRITING_MODEL");
  const voice = await getBrandVoice();
  const site = await editorialKnowledge.searchSiteKnowledge(project.workingTopic, 10);
  const selected = project.sources.filter((s) => s.selected && !s.excluded);
  const outline = outlineSchema.safeParse(project.outlineJson);

  await prisma.aIEditorialProject.update({
    where: { id: projectId },
    data: { status: "DRAFTING", updatedById: actorId },
  });

  const draft = await withRun(
    {
      projectId,
      operation: "FULL_DRAFT",
      actorId,
      provider,
      modelRole: "WRITING_MODEL",
      promptVersion: PROMPT_VERSIONS.draft,
    },
    async () => {
      const result = await provider.generateText({
        modelRole: "WRITING_MODEL",
        maxTokens: 8000,
        messages: [
          { role: "system", content: SYSTEM_GUARD },
          {
            role: "user",
            content: [
              brandVoiceBlock(voice),
              "Write a Markdown Insight draft for Smartlance Designs.",
              "Use ## / ### headings matching the outline. No raw HTML.",
              "Answer-first when the topic is a question.",
              "Length from reader need — do not pad to competitor word counts.",
              "Citation mode: " + project.citationMode,
              project.citationMode === "VISIBLE_CITATIONS"
                ? "Include natural descriptive links to selected sources where claims need support."
                : "Do not dump a bibliography; research sources support accuracy but need not all appear.",
              `Title: ${project.title}`,
              `Unique value: ${project.uniqueValue}`,
              `Brief: ${JSON.stringify(project.briefJson)}`,
              `Outline: ${JSON.stringify(outline.success ? outline.data : project.outlineJson)}`,
              "Site knowledge (verified only):",
              editorialKnowledge.formatForPrompt(site),
              "Sources:",
              selected.map((s) => `- ${s.url} — ${s.title || ""}`).join("\n"),
              "Locked sections (do not overwrite if draftMarkdown present and locked):",
              outline.success
                ? outline.data.sections
                    .filter((s) => s.locked)
                    .map((s) => `### ${s.heading}\n${s.draftMarkdown || ""}`)
                    .join("\n\n")
                : "(none)",
              "Return Markdown only.",
            ].join("\n\n"),
          },
        ],
      });
      return {
        data: result.text,
        usage: result.usage,
        requestId: result.requestId,
        resultSummary: { chars: result.text.length },
      };
    },
  );

  await prisma.aIEditorialProject.update({
    where: { id: projectId },
    data: {
      draftMarkdown: draft,
      draftContentHash: draftContentHash(draft),
      analysisStale: mergeStale(project.analysisStale, DRAFT_INVALIDATES),
      status: "DRAFT_READY",
      updatedById: actorId,
      provider: provider.id,
    },
  });

  await writeAuditLog({
    actorId,
    action: "ai_project.draft_generated",
    entityType: "AIEditorialProject",
    entityId: projectId,
    metadata: { chars: draft.length },
  });

  return draft;
}

export async function saveDraftMarkdown(
  projectId: string,
  actorId: string,
  markdown: string,
) {
  const existing = await prisma.aIEditorialProject.findUnique({
    where: { id: projectId },
    select: { analysisStale: true },
  });
  await prisma.aIEditorialProject.update({
    where: { id: projectId },
    data: {
      draftMarkdown: markdown,
      draftContentHash: draftContentHash(markdown),
      analysisStale: mergeStale(existing?.analysisStale, DRAFT_INVALIDATES),
      updatedById: actorId,
      status: "DRAFT_READY",
    },
  });
  await writeAuditLog({
    actorId,
    action: "ai_project.draft_replaced",
    entityType: "AIEditorialProject",
    entityId: projectId,
    metadata: { chars: markdown.length },
  });
}

export async function runFactCheck(projectId: string, actorId: string) {
  const project = await getAIProject(projectId);
  if (!project?.draftMarkdown) throw new Error("Draft required");
  const provider = await createAIProviderForRole("EDITOR_MODEL");
  const selected = project.sources.filter((s) => s.selected && !s.excluded);
  const site = await editorialKnowledge.searchSiteKnowledge(project.workingTopic, 8);

  const extracted = await withRun(
    {
      projectId,
      operation: "FACT_CHECK",
      actorId,
      provider,
      modelRole: "EDITOR_MODEL",
      promptVersion: PROMPT_VERSIONS.factCheck,
      fingerprintInput: {
        draft: draftContentHash(project.draftMarkdown || ""),
        sources: selected.map((s) => s.url).sort(),
      },
    },
    async () => {
      const result = await provider.generateStructured({
        modelRole: "EDITOR_MODEL",
        schema: claimExtractSchema,
        schemaName: "claims",
        messages: [
          { role: "system", content: SYSTEM_GUARD },
          {
            role: "user",
            content: [
              "Extract factual claims from the draft.",
              "Flag unsupported stats, invented Smartlance results/testimonials/certifications, and time-sensitive platform/SEO claims.",
              "For each sourceUrl association, set sourceEvidence.strength: DIRECT | PARTIAL | CONTEXTUAL | INSUFFICIENT.",
              "Having a citation is NOT the same as the source supporting the claim. Misattributed sources → INSUFFICIENT.",
              "If a source supports only part of a compound claim, use PARTIAL and note the unsupported remainder.",
              "Only associate sourceUrls that appear in the supplied source list. Never invent URLs.",
              "Site knowledge:",
              editorialKnowledge.formatForPrompt(site),
              "Sources:",
              selected.map((s) => `${s.url} [${s.sourceType}] ${s.title || ""}`).join("\n"),
              "Draft:",
              sandboxUntrustedText("DRAFT", project.draftMarkdown || ""),
            ].join("\n\n"),
          },
        ],
      });
      return {
        data: result.data,
        usage: result.usage,
        requestId: result.requestId,
        resultSummary: { claimCount: result.data.claims.length },
      };
    },
  );

  await prisma.aIClaim.deleteMany({ where: { projectId } });
  const urlToId = new Map(selected.map((s) => [s.url, s.id]));

  for (const c of extracted.claims) {
    let support = c.support;
    // Citation without adequate evidence → treat as unsupported for blockers
    const evidence = c.sourceEvidence?.length
      ? c.sourceEvidence
      : c.sourceUrls.map((url) => ({
          url,
          strength: "INSUFFICIENT" as const,
          evidenceSummary: undefined as string | undefined,
        }));
    if (
      support === "SUPPORTED_EXTERNAL" &&
      evidence.every((e) => e.strength === "INSUFFICIENT" || !urlToId.has(e.url))
    ) {
      support = "UNSUPPORTED";
    }
    const claim = await prisma.aIClaim.create({
      data: {
        projectId,
        claimText: c.claimText,
        support,
        sectionHint: c.sectionHint,
        checkedAt: new Date(),
      },
    });
    for (const ev of evidence) {
      if (!isSafeHttpUrl(ev.url)) continue;
      const sid = urlToId.get(ev.url);
      if (!sid) continue;
      await prisma.aIClaimSource.create({
        data: {
          claimId: claim.id,
          sourceId: sid,
          evidenceStrength: ev.strength as AIClaimEvidenceStrength,
          evidenceSummary: ev.evidenceSummary?.slice(0, 400),
          checkedAt: new Date(),
        },
      });
    }
  }

  const refreshed = await getAIProject(projectId);
  const blockers = computeEditorialBlockers({
    draftMarkdown: project.draftMarkdown,
    uniqueValue: project.uniqueValue,
    factCheckJson: { completedAt: new Date().toISOString() },
    claims: refreshed?.claims,
    commodityWarning: project.commodityWarning,
    cannibalization: project.cannibalization,
  });

  const factCheckJson = {
    completedAt: new Date().toISOString(),
    claims: extracted.claims,
    blockers: blockers.filter((b) => b.severity === "BLOCKER"),
    warnings: blockers.filter((b) => b.severity === "WARNING"),
  };

  await prisma.aIEditorialProject.update({
    where: { id: projectId },
    data: {
      factCheckJson: factCheckJson as unknown as Prisma.InputJsonValue,
      analysisStale: clearStale(project.analysisStale, ["factCheck"]),
      status: "NEEDS_REVIEW",
      updatedById: actorId,
    },
  });

  return factCheckJson;
}

export async function runSeoAndAiSearchReviews(projectId: string, actorId: string) {
  const project = await getAIProject(projectId);
  if (!project?.draftMarkdown) throw new Error("Draft required");
  const provider = await createAIProviderForRole("EDITOR_MODEL");

  const seo = await withRun(
    {
      projectId,
      operation: "SEO_REVIEW",
      actorId,
      provider,
      modelRole: "EDITOR_MODEL",
      promptVersion: PROMPT_VERSIONS.seo,
    },
    async () => {
      const result = await provider.generateStructured({
        modelRole: "EDITOR_MODEL",
        schema: seoReviewSchema,
        schemaName: "seoReview",
        messages: [
          { role: "system", content: SYSTEM_GUARD },
          {
            role: "user",
            content: [
              "Run SEO review. Use severity PASS|WARNING|REVIEW|BLOCKER — never invent a 0–100 SEO score.",
              "Avoid clickbait titles (Ultimate, Guaranteed, Best, #1) unless genuinely appropriate.",
              "Suggest slug without requiring keyword-first placement.",
              `Topic: ${project.workingTopic}`,
              `Draft:\n${project.draftMarkdown}`,
            ].join("\n\n"),
          },
        ],
      });
      return {
        data: result.data,
        usage: result.usage,
        requestId: result.requestId,
        resultSummary: { findings: result.data.findings.length },
      };
    },
  );

  const aiSearch = await withRun(
    {
      projectId,
      operation: "AI_SEARCH_REVIEW",
      actorId,
      provider,
      modelRole: "EDITOR_MODEL",
      promptVersion: PROMPT_VERSIONS.aiSearch,
    },
    async () => {
      const result = await provider.generateStructured({
        modelRole: "EDITOR_MODEL",
        schema: aiSearchReviewSchema,
        schemaName: "aiSearchReview",
        messages: [
          { role: "system", content: SYSTEM_GUARD },
          {
            role: "user",
            content: [
              "AI Search review — NOT a GEO score. No special AI schema or llms.txt requirements.",
              "Check answer clarity, entities, extractable passages, original value, attribution.",
              "Ask: what here could only come from Smartlance or meaningful editorial work?",
              `Unique value: ${project.uniqueValue}`,
              `Draft:\n${project.draftMarkdown}`,
            ].join("\n\n"),
          },
        ],
      });
      return {
        data: result.data,
        usage: result.usage,
        requestId: result.requestId,
        resultSummary: { commodityRisk: result.data.commodityRisk },
      };
    },
  );

  if (seo.slugSuggestion) {
    seo.slugSuggestion = slugifySuggestion(seo.slugSuggestion);
  }

  await prisma.aIEditorialProject.update({
    where: { id: projectId },
    data: {
      seoJson: seo as unknown as Prisma.InputJsonValue,
      aiSearchJson: aiSearch as unknown as Prisma.InputJsonValue,
      commodityWarning: project.commodityWarning || aiSearch.commodityRisk,
      analysisStale: clearStale(project.analysisStale, ["seo", "aiSearch"]),
      updatedById: actorId,
    },
  });

  return { seo, aiSearch };
}

export async function runInternalLinkReview(projectId: string, actorId: string) {
  const project = await getAIProject(projectId);
  if (!project?.draftMarkdown) throw new Error("Draft required");
  const provider = await createAIProviderForRole("FAST_MODEL");
  const routes = await editorialKnowledge.listPublishedInternalRoutes();
  const publishedPaths = new Set(routes.map((r) => r.path));

  const raw = await withRun(
    {
      projectId,
      operation: "INTERNAL_LINK_REVIEW",
      actorId,
      provider,
      modelRole: "FAST_MODEL",
      promptVersion: PROMPT_VERSIONS.internalLinks,
    },
    async () => {
      const result = await provider.generateStructured({
        modelRole: "FAST_MODEL",
        schema: internalLinkSuggestionSchema,
        schemaName: "internalLinks",
        messages: [
          { role: "system", content: SYSTEM_GUARD },
          {
            role: "user",
            content: [
              "Suggest contextual internal links. No arbitrary link quotas. Prefer educational progression.",
              "Only use destination paths from the candidate list. Return entityId from candidates when possible.",
              "Candidates:",
              routes
                .slice(0, 120)
                .map((r) => `${r.entityType}|${r.id}|${r.path}|${r.title}`)
                .join("\n"),
              `Draft:\n${project.draftMarkdown}`,
            ].join("\n\n"),
          },
        ],
      });
      return {
        data: result.data,
        usage: result.usage,
        requestId: result.requestId,
        resultSummary: { count: result.data.suggestions.length },
      };
    },
  );

  const suggestions = raw.suggestions.filter((s) => {
    if (!s.destinationPath.startsWith("/")) return false;
    if (s.destinationPath.startsWith("javascript:")) return false;
    return publishedPaths.has(s.destinationPath);
  });

  const payload = { suggestions, rejected: raw.suggestions.length - suggestions.length };
  await prisma.aIEditorialProject.update({
    where: { id: projectId },
    data: {
      internalLinksJson: payload as unknown as Prisma.InputJsonValue,
      analysisStale: clearStale(project.analysisStale, ["internalLinks"]),
      updatedById: actorId,
    },
  });
  return payload;
}

export async function runEditorialQualityReview(projectId: string, actorId: string) {
  const project = await getAIProject(projectId);
  if (!project?.draftMarkdown) throw new Error("Draft required");
  const provider = await createAIProviderForRole("EDITOR_MODEL");

  const quality = await withRun(
    {
      projectId,
      operation: "EDITORIAL_REVIEW",
      actorId,
      provider,
      modelRole: "EDITOR_MODEL",
      promptVersion: PROMPT_VERSIONS.quality,
    },
    async () => {
      const result = await provider.generateStructured({
        modelRole: "EDITOR_MODEL",
        schema: seoReviewSchema.pick({ findings: true }),
        schemaName: "quality",
        messages: [
          { role: "system", content: SYSTEM_GUARD },
          {
            role: "user",
            content: [
              "Editorial quality review. Categories: repetition, filler, thin sections, unsupported assertions, jargon, keyword stuffing, fake expertise, commercial overreach.",
              "Use PASS/WARNING/REVIEW/BLOCKER — no numeric score.",
              `Draft:\n${project.draftMarkdown}`,
            ].join("\n\n"),
          },
        ],
      });
      return {
        data: result.data,
        usage: result.usage,
        requestId: result.requestId,
        resultSummary: { findings: result.data.findings.length },
      };
    },
  );

  await prisma.aIEditorialProject.update({
    where: { id: projectId },
    data: {
      qualityReviewJson: quality as unknown as Prisma.InputJsonValue,
      analysisStale: clearStale(project.analysisStale, ["quality"]),
      updatedById: actorId,
    },
  });
  return quality;
}

function hasCriticalClaimBlockers(project: NonNullable<Awaited<ReturnType<typeof getAIProject>>>) {
  const blockers = computeEditorialBlockers({
    draftMarkdown: project.draftMarkdown,
    uniqueValue: project.uniqueValue,
    factCheckJson: project.factCheckJson,
    claims: project.claims,
    commodityWarning: project.commodityWarning,
    analysisStale: project.analysisStale,
    cannibalization: project.cannibalization,
  });
  return blockers.some((b) => b.severity === "BLOCKER");
}

export function getProjectBlockerSummary(
  project: NonNullable<Awaited<ReturnType<typeof getAIProject>>>,
) {
  const blockers = computeEditorialBlockers({
    draftMarkdown: project.draftMarkdown,
    uniqueValue: project.uniqueValue,
    factCheckJson: project.factCheckJson,
    claims: project.claims,
    commodityWarning: project.commodityWarning,
    analysisStale: project.analysisStale,
    cannibalization: project.cannibalization,
  });
  return { blockers, ...approvalSummary(blockers) };
}

export async function approveForCms(
  projectId: string,
  actorId: string,
  opts?: { overrideReason?: string; checklistConfirmed?: boolean },
) {
  const project = await getAIProject(projectId);
  if (!project) throw new Error("Project not found");
  if (!project.draftMarkdown?.trim()) throw new Error("Draft required");
  if (!project.uniqueValue?.trim()) {
    throw new Error("Unique value statement required before CMS approval.");
  }
  if (!project.factCheckJson) {
    throw new Error("Fact check must be completed before approval.");
  }
  if (!opts?.checklistConfirmed) {
    throw new Error("Human editorial checklist must be confirmed before approval.");
  }
  const { blockers } = getProjectBlockerSummary(project);
  const hard = blockers.filter((b) => b.hard);
  if (hard.length) {
    throw new Error(hard[0]?.message || "Hard security blocker cannot be overridden.");
  }
  if (hasCriticalClaimBlockers(project) && !opts?.overrideReason?.trim()) {
    throw new Error(
      "Unresolved critical blockers prevent APPROVED_FOR_CMS. Resolve or provide override reason.",
    );
  }

  const row = await prisma.aIEditorialProject.update({
    where: { id: projectId },
    data: {
      status: "APPROVED_FOR_CMS",
      updatedById: actorId,
      approvedById: actorId,
      approvedAt: new Date(),
      completedAt: new Date(),
    },
  });

  await writeAuditLog({
    actorId,
    action: "ai_project.approved_for_cms",
    entityType: "AIEditorialProject",
    entityId: projectId,
    metadata: {
      override: Boolean(opts?.overrideReason),
      reason: opts?.overrideReason?.slice(0, 200),
      blockerCount: blockers.filter((b) => b.severity === "BLOCKER").length,
    },
  });
  return row;
}

export async function createInsightDraftFromProject(
  projectId: string,
  actorId: string,
) {
  const project = await getAIProject(projectId);
  if (!project) throw new Error("Project not found");
  if (project.status !== "APPROVED_FOR_CMS" && project.status !== "NEEDS_REVIEW") {
    // Allow NEEDS_REVIEW only if already approved path — enforce APPROVED
  }
  if (project.status !== "APPROVED_FOR_CMS") {
    throw new Error("Project must be APPROVED_FOR_CMS before creating an Insight draft.");
  }

  if (project.linkedInsightId && project.linkedInsight) {
    if (
      project.insightSnapshotAt &&
      project.linkedInsight.updatedAt > project.insightSnapshotAt
    ) {
      throw new Error(
        "This article has been edited since the AI draft was created. Import the current CMS content into a new AI revision workflow before overwriting.",
      );
    }
  }

  const seo = (project.seoJson || {}) as {
    seoTitle?: string;
    metaDescription?: string;
    slugSuggestion?: string;
  };
  const slugBase =
    seo.slugSuggestion ||
    slugifySuggestion(project.title) ||
    `insight-${Date.now()}`;

  let slug = slugBase;
  const existing = await prisma.insight.findUnique({ where: { slug } });
  if (existing && existing.id !== project.linkedInsightId) {
    slug = `${slugBase}-${Date.now().toString(36)}`;
  }

  const redirectHit = await prisma.redirect.findFirst({
    where: { sourcePath: `/insights/${slug}` },
  });
  if (redirectHit) {
    slug = `${slug}-new`;
  }

  const links = (project.internalLinksJson || {}) as {
    suggestions?: Array<{ destinationPath: string; entityType?: string }>;
  };
  const serviceHrefs = (links.suggestions || [])
    .filter((s) => s.entityType === "Service")
    .map((s) => s.destinationPath)
    .slice(0, 6);

  const insight = await saveInsightDraft({
    id: project.linkedInsightId || undefined,
    actorId,
    data: {
      slug,
      title: project.title,
      description:
        seo.metaDescription ||
        project.workingTopic.slice(0, 280) ||
        project.title,
      bodyMarkdown: project.draftMarkdown || "",
      categoryLabel: project.contentType || "Insights",
      author: null,
      seoTitle: seo.seoTitle || project.title,
      seoDescription: seo.metaDescription || undefined,
      relatedServiceHrefs: serviceHrefs.length
        ? serviceHrefs
        : project.serviceHref
          ? [project.serviceHref]
          : [],
      originalPublishedAt: project.linkedInsight?.originalPublishedAt || new Date(),
    },
  });

  await prisma.aIEditorialProject.update({
    where: { id: projectId },
    data: {
      linkedInsightId: insight.id,
      insightSnapshotAt: new Date(),
      handoffRevisionId: insight.id,
      updatedById: actorId,
    },
  });

  await prisma.aIEditorialRun.create({
    data: {
      projectId,
      operation: "CMS_HANDOFF",
      provider: "cms",
      promptVersion: "cms-handoff:v1",
      status: "SUCCEEDED",
      startedAt: new Date(),
      completedAt: new Date(),
      createdById: actorId,
      resultSummary: { insightId: insight.id, slug: insight.slug },
    },
  });

  await writeAuditLog({
    actorId,
    action: "ai_project.insight_created",
    entityType: "AIEditorialProject",
    entityId: projectId,
    metadata: { insightId: insight.id, slug: insight.slug },
  });

  return insight;
}

export async function getAIWriterDashboard() {
  if (!hasDatabaseUrl()) {
    return {
      drafting: 0,
      needsReview: 0,
      approved: 0,
      failedRuns: 0,
      recentInsights: [] as Array<{ id: string; title: string; createdAt: Date }>,
      provider: {
        configured: false,
        providerId: "openai",
        label: "Not Configured" as const,
        defaultProviderId: "openai",
        accounts: [],
      },
      research: getResearchProviderStatus(),
      usageToday: { runs: 0, input: 0, output: 0, failed: 0 },
      usageMonth: { runs: 0, input: 0, output: 0, failed: 0 },
      tokenWarning: null as string | null,
      staleJobsRecovered: 0,
    };
  }
  const settings = await getOrCreateSettings();
  const staleJobsRecovered = await recoverStaleAiJobs(settings.staleJobMinutes ?? 30);
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(startOfDay.getFullYear(), startOfDay.getMonth(), 1);

  const [drafting, needsReview, approved, failedRuns, recent, usageToday, usageMonth] =
    await Promise.all([
      prisma.aIEditorialProject.count({
        where: { status: { in: ["DRAFTING", "DRAFT_READY", "OUTLINE_READY", "BRIEF_READY"] } },
      }),
      prisma.aIEditorialProject.count({ where: { status: "NEEDS_REVIEW" } }),
      prisma.aIEditorialProject.count({ where: { status: "APPROVED_FOR_CMS" } }),
      prisma.aIEditorialRun.count({
        where: {
          status: "FAILED",
          createdAt: { gte: new Date(Date.now() - 7 * 864e5) },
        },
      }),
      prisma.aIEditorialProject.findMany({
        where: { linkedInsightId: { not: null } },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          updatedAt: true,
          linkedInsightId: true,
        },
      }),
      getGlobalUsageWindow(startOfDay),
      getGlobalUsageWindow(startOfMonth),
    ]);

  const threshold = settings.dailyTokenWarningThreshold;
  const tokenWarning =
    threshold != null && usageToday.input + usageToday.output >= threshold
      ? `Daily token usage ${usageToday.input + usageToday.output} reached warning threshold ${threshold}.`
      : null;

  return {
    drafting,
    needsReview,
    approved,
    failedRuns,
    recentInsights: recent,
    provider: await getAIProviderStatus(),
    research: getResearchProviderStatus(),
    usageToday,
    usageMonth,
    tokenWarning,
    staleJobsRecovered,
  };
}

export async function getProjectCostSummary(projectId: string) {
  const settings = await getOrCreateSettings();
  const usage = await getProjectUsageSummary(projectId);
  const pricing = parseModelPricing(settings.modelPricingJson);
  const project = await prisma.aIEditorialProject.findUnique({
    where: { id: projectId },
    select: { model: true },
  });
  const approx =
    pricing && project?.model
      ? estimateCostUsd(
          { input: usage.input, output: usage.output },
          pricing,
          project.model,
        )
      : null;
  return { ...usage, approxCostUsd: approx, pricingConfigured: Boolean(pricing) };
}

export async function saveAIWriterSettings(
  actorId: string,
  data: Prisma.AIWriterSettingsUncheckedUpdateInput,
) {
  const row = await prisma.aIWriterSettings.upsert({
    where: { id: "default" },
    create: { id: "default", ...(data as object) },
    update: data,
  });
  await writeAuditLog({
    actorId,
    action: "ai_settings.changed",
    entityType: "AIWriterSettings",
    entityId: "default",
    metadata: { keys: Object.keys(data) },
  });
  return row;
}

export async function saveBrandVoice(
  actorId: string,
  data: Prisma.AIBrandVoiceUncheckedUpdateInput,
) {
  const existing = await prisma.aIBrandVoice.findUnique({ where: { id: "default" } });
  const row = await prisma.aIBrandVoice.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      updatedById: actorId,
      revision: 1,
      ...(data as object),
    },
    update: {
      ...data,
      updatedById: actorId,
      revision: (existing?.revision ?? 0) + 1,
    },
  });
  await writeAuditLog({
    actorId,
    action: "ai_brand_voice.changed",
    entityType: "AIBrandVoice",
    entityId: "default",
    metadata: { approved: row.approved, revision: row.revision },
  });
  return row;
}

export { getOrCreateSettings, getBrandVoice };
