import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { analyzeWebsiteReview } from "@/lib/prospect/ai/review-analysis";
import {
  REQUEST_STATUS_LABELS,
  REVIEW_DIRECTION_LABELS,
  REVIEW_STATUS_LABELS,
} from "@/lib/prospect/constants";
import type {
  ProspectReviewDetailDto,
  ProspectReviewListItemDto,
} from "@/lib/prospect/dto";
import { createClaimToken, hashClaimToken } from "@/lib/prospect/tokens";
import { crawlWebsite, ReviewCrawlError } from "@/lib/prospect/review/crawler";
import {
  checkSitemap,
  runDeterministicChecks,
  type EvidenceInput,
} from "@/lib/prospect/review/checks";
import { normalizeWebsiteUrl } from "@/lib/prospect/review/url";

export type StartReviewInput = {
  websiteUrl: string;
  businessName?: string;
  goals?: string[];
  focusNote?: string;
  portalUserId?: string;
};

export async function startWebsiteReview(input: StartReviewInput) {
  const { url, domain } = normalizeWebsiteUrl(input.websiteUrl);
  const claimToken = input.portalUserId ? null : createClaimToken();
  const claimTokenHash = claimToken ? hashClaimToken(claimToken) : null;

  const review = await prisma.agencyWebsiteReview.create({
    data: {
      portalUserId: input.portalUserId ?? null,
      claimTokenHash,
      websiteUrl: url,
      normalizedDomain: domain,
      businessName: input.businessName?.trim() || null,
      goalJson: {
        goals: input.goals ?? [],
        focusNote: input.focusNote ?? null,
      } satisfies Prisma.InputJsonValue,
      status: "PENDING",
      startedAt: new Date(),
    },
  });

  void runReviewPipeline(review.id).catch((err) => {
    console.error("[prospect-review]", review.id, err);
  });

  return {
    reviewId: review.id,
    claimToken,
    status: review.status,
  };
}

async function runReviewPipeline(reviewId: string) {
  const review = await prisma.agencyWebsiteReview.findUniqueOrThrow({
    where: { id: reviewId },
  });

  await prisma.agencyWebsiteReview.update({
    where: { id: reviewId },
    data: { status: "FETCHING" },
  });

  let pages;
  try {
    const crawl = await crawlWebsite(review.websiteUrl);
    pages = crawl.pages;
  } catch (err) {
    const message =
      err instanceof ReviewCrawlError
        ? err.message
        : "We couldn't review this website right now.";
    await prisma.agencyWebsiteReview.update({
      where: { id: reviewId },
      data: {
        status: "FAILED",
        failedAt: new Date(),
        aiFailedMessage: message,
      },
    });
    return;
  }

  const pageRecords = await Promise.all(
    pages.map((p) =>
      prisma.agencyWebsiteReviewPage.create({
        data: {
          reviewId,
          url: p.url,
          title: p.extracted.title,
          statusCode: p.statusCode,
          contentHash: p.contentHash,
        },
      }),
    ),
  );

  const pageIdByUrl = new Map(pageRecords.map((p) => [p.url, p.id]));

  const evidenceInputs: EvidenceInput[] = runDeterministicChecks(
    pages.map((p) => ({ url: p.url, extracted: p.extracted, html: p.html })),
  );

  const sitemapEvidence = await checkSitemap(review.websiteUrl);
  if (sitemapEvidence) evidenceInputs.push(sitemapEvidence);

  const evidenceRows = await Promise.all(
    evidenceInputs.map((e) =>
      prisma.agencyWebsiteReviewEvidence.create({
        data: {
          reviewId,
          pageId: e.sourceUrl ? pageIdByUrl.get(e.sourceUrl) ?? null : null,
          category: e.category,
          type: e.type,
          label: e.label,
          valueText: e.valueText ?? null,
          valueNumber: e.valueNumber ?? null,
          booleanValue: e.booleanValue ?? null,
          sourceUrl: e.sourceUrl ?? null,
          sourceSelector: e.sourceSelector ?? null,
          excerpt: e.excerpt ?? null,
        },
      }),
    ),
  );

  await prisma.agencyWebsiteReview.update({
    where: { id: reviewId },
    data: { status: "ANALYZING" },
  });

  const goals =
    (review.goalJson as { goals?: string[]; focusNote?: string | null } | null)
      ?.goals ?? [];
  const focusNote =
    (review.goalJson as { focusNote?: string | null } | null)?.focusNote ?? null;

  const aiResult = await analyzeWebsiteReview({
    domain: review.normalizedDomain,
    businessName: review.businessName,
    goals,
    focusNote,
    evidence: evidenceRows.map((e) => ({
      id: e.id,
      category: e.category,
      type: e.type,
      label: e.label,
      valueText: e.valueText,
      valueNumber: e.valueNumber,
      booleanValue: e.booleanValue,
      excerpt: e.excerpt,
    })),
    pageSummaries: pages.map((p) => ({
      url: p.url,
      title: p.extracted.title,
      headings: p.extracted.headingsText,
      navLabels: p.extracted.navLabels,
      ctaLabels: p.extracted.ctaLabels,
      bodyExcerpt: p.extracted.bodyText,
    })),
  });

  if (aiResult.output) {
    const { output } = aiResult;
    let position = 0;

    for (const strength of output.strengths) {
      const finding = await prisma.agencyWebsiteReviewFinding.create({
        data: {
          reviewId,
          category: strength.category,
          severity: "LOW",
          title: strength.title,
          explanation: strength.explanation,
          confidence: strength.confidence,
          position: position++,
          isStrength: true,
        },
      });
      await prisma.agencyWebsiteReviewFindingEvidence.createMany({
        data: strength.evidenceIds.map((evidenceId) => ({
          findingId: finding.id,
          evidenceId,
        })),
        skipDuplicates: true,
      });
    }

    for (const finding of output.findings) {
      const row = await prisma.agencyWebsiteReviewFinding.create({
        data: {
          reviewId,
          category: finding.category,
          severity: finding.severity,
          title: finding.title,
          explanation: finding.explanation,
          recommendation: finding.recommendation ?? null,
          confidence: finding.confidence,
          position: position++,
          isStrength: false,
          isPriority: false,
        },
      });
      await prisma.agencyWebsiteReviewFindingEvidence.createMany({
        data: finding.evidenceIds.map((evidenceId) => ({
          findingId: row.id,
          evidenceId,
        })),
        skipDuplicates: true,
      });
    }

    for (const priority of output.priorities) {
      const row = await prisma.agencyWebsiteReviewFinding.create({
        data: {
          reviewId,
          category: priority.category,
          severity: priority.severity,
          title: priority.title,
          explanation: priority.explanation,
          recommendation: priority.recommendation ?? null,
          confidence: priority.confidence,
          position: position++,
          isStrength: false,
          isPriority: true,
        },
      });
      await prisma.agencyWebsiteReviewFindingEvidence.createMany({
        data: priority.evidenceIds.map((evidenceId) => ({
          findingId: row.id,
          evidenceId,
        })),
        skipDuplicates: true,
      });
    }

    await prisma.agencyWebsiteReview.update({
      where: { id: reviewId },
      data: {
        status: "COMPLETED",
        overallDirection: output.overallDirection,
        summary: output.executiveSummary,
        promptVersion: aiResult.promptVersion,
        modelMetadataSafe: (aiResult.modelMetadataSafe ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
        completedAt: new Date(),
        aiFailedMessage: null,
      },
    });
  } else {
    await prisma.agencyWebsiteReview.update({
      where: { id: reviewId },
      data: {
        status: "COMPLETED",
        overallDirection: null,
        summary: null,
        promptVersion: aiResult.promptVersion,
        modelMetadataSafe: (aiResult.modelMetadataSafe ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
        completedAt: new Date(),
        aiFailedMessage:
          aiResult.failureMessage ??
          "We checked your website and saved the observations below, but Smartlance's detailed analysis could not be generated right now. You can still use these checks to plan next steps, or try again later.",
      },
    });
  }
}

function toListItem(review: {
  id: string;
  websiteUrl: string;
  normalizedDomain: string;
  businessName: string | null;
  status: ProspectReviewListItemDto["status"];
  overallDirection: ProspectReviewListItemDto["overallDirection"];
  completedAt: Date | null;
  createdAt: Date;
}): ProspectReviewListItemDto {
  return {
    id: review.id,
    websiteUrl: review.websiteUrl,
    normalizedDomain: review.normalizedDomain,
    businessName: review.businessName,
    status: review.status,
    statusLabel: REVIEW_STATUS_LABELS[review.status],
    overallDirection: review.overallDirection,
    overallDirectionLabel: review.overallDirection
      ? REVIEW_DIRECTION_LABELS[review.overallDirection]
      : null,
    completedAt: review.completedAt?.toISOString() ?? null,
    createdAt: review.createdAt.toISOString(),
  };
}

export async function getReviewForAccess(
  reviewId: string,
  ctx: { portalUserId?: string; claimToken?: string },
): Promise<ProspectReviewDetailDto | null> {
  const review = await prisma.agencyWebsiteReview.findUnique({
    where: { id: reviewId },
    include: {
      evidence: true,
      findings: { include: { evidence: true }, orderBy: { position: "asc" } },
    },
  });
  if (!review) return null;

  const claimHash = ctx.claimToken ? hashClaimToken(ctx.claimToken) : null;
  const allowed =
    (ctx.portalUserId && review.portalUserId === ctx.portalUserId) ||
    (claimHash && review.claimTokenHash === claimHash);
  if (!allowed) return null;

  const goals =
    (review.goalJson as { goals?: string[] } | null)?.goals?.map(String) ?? [];

  const mapFinding = (f: (typeof review.findings)[0]) => ({
    id: f.id,
    category: f.category,
    severity: f.severity,
    title: f.title,
    explanation: f.explanation,
    recommendation: f.recommendation,
    confidence: f.confidence,
    isPriority: f.isPriority,
    isStrength: f.isStrength,
    evidenceIds: f.evidence.map((e) => e.evidenceId),
  });

  return {
    ...toListItem(review),
    summary: review.summary,
    aiFailedMessage: review.aiFailedMessage,
    goals,
    strengths: review.findings.filter((f) => f.isStrength).map(mapFinding),
    priorities: review.findings.filter((f) => f.isPriority).map(mapFinding),
    findings: review.findings.filter((f) => !f.isStrength && !f.isPriority).map(mapFinding),
    evidence: review.evidence.map((e) => ({
      id: e.id,
      category: e.category,
      type: e.type,
      label: e.label,
      valueText: e.valueText,
      valueNumber: e.valueNumber,
      booleanValue: e.booleanValue,
      sourceUrl: e.sourceUrl,
      excerpt: e.excerpt,
    })),
    reviewedOn: (review.completedAt ?? review.createdAt).toISOString(),
  };
}

export async function listReviewsForUser(portalUserId: string) {
  const reviews = await prisma.agencyWebsiteReview.findMany({
    where: { portalUserId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return reviews.map(toListItem);
}

export async function retryReviewAnalysis(reviewId: string) {
  const review = await prisma.agencyWebsiteReview.findUniqueOrThrow({
    where: { id: reviewId },
  });
  if (review.status !== "COMPLETED") {
    throw new Error("Review is not in a retryable state.");
  }
  await prisma.agencyWebsiteReviewFinding.deleteMany({ where: { reviewId } });
  await prisma.agencyWebsiteReview.update({
    where: { id: reviewId },
    data: {
      status: "ANALYZING",
      overallDirection: null,
      summary: null,
      aiFailedMessage: null,
      completedAt: null,
    },
  });
  void runReviewPipeline(reviewId).catch(console.error);
}

export { REQUEST_STATUS_LABELS };
