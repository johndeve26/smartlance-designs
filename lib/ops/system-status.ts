import { hasDatabaseUrl, prisma } from "@/lib/db";
import {
  isMediaStorageConfigured,
  getConfiguredStorageProviderName,
} from "@/lib/media/storage";
import { fallbackPublicSiteSettings } from "@/lib/repositories/siteSettingsRepository";
import { formDeliveryConfigured } from "@/lib/forms";
import { getAIProviderStatus } from "@/lib/ai/providers";
import { getResearchProviderStatus } from "@/lib/ai/research";
import { getDiscoveryProviderStatus } from "@/lib/ai/topic-intelligence/providers";

export type ConfigState =
  | "configured"
  | "not_configured"
  | "partial"
  | "healthy"
  | "missing"
  | "disabled";

export type SystemStatus = {
  environment: "Development" | "Preview" | "Production";
  database: { state: ConfigState; label: string };
  mediaStorage: { state: ConfigState; label: string; provider?: string };
  emailDelivery: { state: ConfigState; label: string };
  canonicalHost: { state: ConfigState; label: string; value?: string };
  analytics: { state: ConfigState; label: string };
  adminBootstrap: { state: ConfigState; label: string };
  contentMigration: {
    phase3: ConfigState;
    phase4: ConfigState;
    label: string;
  };
  redirectEngine: { state: ConfigState; label: string; count?: number };
  publicPricing: { state: ConfigState; label: string };
  contactForm: { state: ConfigState; label: string };
  freeReviewForm: { state: ConfigState; label: string };
  enquiryPersistence: { state: ConfigState; label: string };
  contactNotification: { state: ConfigState; label: string };
  reviewNotification: { state: ConfigState; label: string };
  notificationFailures24h: { state: ConfigState; label: string; count: number };
  aiProvider: { state: ConfigState; label: string };
  researchProvider: { state: ConfigState; label: string };
  discoveryNews: { state: ConfigState; label: string };
  discoveryTrends: { state: ConfigState; label: string };
  discoveryRss: { state: ConfigState; label: string };
  discoveryPacks: { state: ConfigState; label: string };
  aiPendingJobs: { state: ConfigState; label: string; count: number };
  aiLastSuccess: { state: ConfigState; label: string };
  aiLastFailure: { state: ConfigState; label: string };
};

function envLabel(): SystemStatus["environment"] {
  if (process.env.VERCEL_ENV === "production") return "Production";
  if (process.env.VERCEL_ENV === "preview") return "Preview";
  if (process.env.NODE_ENV === "production") return "Production";
  return "Development";
}

export async function getSystemStatus(): Promise<SystemStatus> {
  const environment = envLabel();

  let database: SystemStatus["database"] = {
    state: "not_configured",
    label: "DATABASE_URL not set",
  };
  if (hasDatabaseUrl()) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      database = { state: "healthy", label: "Connected" };
    } catch {
      database = { state: "missing", label: "Connection failed" };
    }
  }

  let mediaStorage: SystemStatus["mediaStorage"];
  try {
    const ok = isMediaStorageConfigured();
    const provider = getConfiguredStorageProviderName();
    mediaStorage = ok
      ? {
          state: "configured",
          label: `Configured (${provider})`,
          provider,
        }
      : { state: "not_configured", label: "Not configured" };
  } catch (err) {
    mediaStorage = {
      state: "not_configured",
      label: err instanceof Error ? err.message : "Not configured",
    };
  }

  const emailOk = await formDeliveryConfigured();
  const emailDelivery = {
    state: (emailOk ? "configured" : "not_configured") as ConfigState,
    label: emailOk ? "Configured" : "Not configured",
  };

  const fallback = fallbackPublicSiteSettings();
  let canonicalHost: SystemStatus["canonicalHost"] = {
    state: "configured",
    label: "Using fallback host",
    value: fallback.canonicalHost || undefined,
  };
  let analytics: SystemStatus["analytics"] = {
    state: "not_configured",
    label: "Not configured",
  };
  let adminBootstrap: SystemStatus["adminBootstrap"] = {
    state: "not_configured",
    label: "No Super Admin",
  };
  let contentMigration: SystemStatus["contentMigration"] = {
    phase3: "missing",
    phase4: "missing",
    label: "Markers unknown",
  };
  let redirectEngine: SystemStatus["redirectEngine"] = {
    state: "not_configured",
    label: "Database required",
  };
  let publicPricing: SystemStatus["publicPricing"] = {
    state: "disabled",
    label: "Disabled",
  };
  let contactFormEnabled = true;
  let freeReviewFormEnabled = true;
  let failureCount24h = 0;

  if (hasDatabaseUrl() && database.state === "healthy") {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [settings, superAdmins, markers, redirectCount, failures] =
      await Promise.all([
        prisma.siteSettings.findUnique({ where: { id: "site" } }),
        prisma.adminUser.count({
          where: { role: "SUPER_ADMIN", status: "ACTIVE" },
        }),
        prisma.contentImportMarker.findMany(),
        prisma.redirect.count(),
        prisma.enquiry.count({
          where: {
            notificationStatus: "FAILED",
            notificationAttemptedAt: { gte: since },
          },
        }),
      ]);

    failureCount24h = failures;
    contactFormEnabled = settings?.contactFormEnabled ?? true;
    freeReviewFormEnabled = settings?.freeReviewFormEnabled ?? true;

    const host = settings?.canonicalHost || fallback.canonicalHost;
    canonicalHost = host
      ? { state: "configured", label: "Configured", value: host }
      : { state: "missing", label: "Canonical host missing" };

    const ga =
      settings?.gaMeasurementId || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    const gtm = settings?.gtmContainerId || process.env.NEXT_PUBLIC_GTM_ID;
    const clarity =
      settings?.clarityProjectId || process.env.NEXT_PUBLIC_CLARITY_ID;
    const count = [ga, gtm, clarity].filter(Boolean).length;
    analytics =
      count === 0
        ? { state: "not_configured", label: "Not configured" }
        : count < 2
          ? { state: "partial", label: "Partial" }
          : { state: "configured", label: "Configured" };

    adminBootstrap =
      superAdmins > 0
        ? { state: "healthy", label: "Healthy" }
        : { state: "missing", label: "No active Super Admin" };

    const phase3 = markers.some((m) => m.id === "phase3")
      ? "configured"
      : "missing";
    const phase4 = markers.some((m) => m.id === "phase4")
      ? "configured"
      : "missing";
    contentMigration = {
      phase3,
      phase4,
      label: `Phase 3: ${phase3 === "configured" ? "done" : "pending"}; Phase 4: ${phase4 === "configured" ? "done" : "pending"}`,
    };

    redirectEngine = {
      state: "healthy",
      label: "Healthy",
      count: redirectCount,
    };

    publicPricing = settings?.showPublicPricing
      ? { state: "configured", label: "Enabled" }
      : { state: "disabled", label: "Disabled" };
  }

  const aiOps = await getAiOpsStatus();

  return {
    environment,
    database,
    mediaStorage,
    emailDelivery,
    canonicalHost,
    analytics,
    adminBootstrap,
    contentMigration,
    redirectEngine,
    publicPricing,
    contactForm: {
      state: contactFormEnabled ? "configured" : "disabled",
      label: contactFormEnabled ? "Enabled" : "Disabled",
    },
    freeReviewForm: {
      state: freeReviewFormEnabled ? "configured" : "disabled",
      label: freeReviewFormEnabled ? "Enabled" : "Disabled",
    },
    enquiryPersistence: {
      state: database.state === "healthy" ? "healthy" : database.state,
      label:
        database.state === "healthy" ? "Healthy (PostgreSQL)" : database.label,
    },
    contactNotification: {
      state: emailOk ? "configured" : "not_configured",
      label: emailOk
        ? "Configured (not a delivery guarantee)"
        : "Not configured — Admin still receives persisted enquiries",
    },
    reviewNotification: {
      state: emailOk ? "configured" : "not_configured",
      label: emailOk
        ? "Configured (not a delivery guarantee)"
        : "Not configured — Admin still receives persisted enquiries",
    },
    notificationFailures24h: {
      state: failureCount24h > 0 ? "partial" : "healthy",
      label:
        failureCount24h > 0
          ? `${failureCount24h} unresolved failure(s) in last 24h`
          : "None in last 24h",
      count: failureCount24h,
    },
    ...aiOps,
  };
}

async function getAiOpsStatus(): Promise<{
  aiProvider: SystemStatus["aiProvider"];
  researchProvider: SystemStatus["researchProvider"];
  discoveryNews: SystemStatus["discoveryNews"];
  discoveryTrends: SystemStatus["discoveryTrends"];
  discoveryRss: SystemStatus["discoveryRss"];
  discoveryPacks: SystemStatus["discoveryPacks"];
  aiPendingJobs: SystemStatus["aiPendingJobs"];
  aiLastSuccess: SystemStatus["aiLastSuccess"];
  aiLastFailure: SystemStatus["aiLastFailure"];
}> {
  const ai = await getAIProviderStatus();
  const research = getResearchProviderStatus();
  const discovery = await getDiscoveryProviderStatus();
  const aiProvider: SystemStatus["aiProvider"] = {
    state: ai.configured ? "configured" : "not_configured",
    label: ai.configured
      ? `Configured (${ai.providerId})`
      : "Not Configured",
  };
  const researchProvider: SystemStatus["researchProvider"] = {
    state: research.configured ? "configured" : "not_configured",
    label: research.configured
      ? `Configured (${research.providerId})`
      : "Not Configured (manual sources OK)",
  };

  let pending = 0;
  let lastSuccessLabel = "None";
  let lastFailureLabel = "None";
  if (hasDatabaseUrl()) {
    try {
      pending = await prisma.aIEditorialRun.count({
        where: { status: { in: ["QUEUED", "RUNNING"] } },
      });
      const lastOk = await prisma.aIEditorialRun.findFirst({
        where: { status: "SUCCEEDED" },
        orderBy: { completedAt: "desc" },
        select: { operation: true, completedAt: true },
      });
      const lastFail = await prisma.aIEditorialRun.findFirst({
        where: { status: "FAILED" },
        orderBy: { completedAt: "desc" },
        select: { operation: true, completedAt: true, errorCode: true },
      });
      if (lastOk?.completedAt) {
        lastSuccessLabel = `${lastOk.operation} @ ${lastOk.completedAt.toISOString()}`;
      }
      if (lastFail?.completedAt) {
        lastFailureLabel = `${lastFail.operation}${lastFail.errorCode ? ` (${lastFail.errorCode})` : ""} @ ${lastFail.completedAt.toISOString()}`;
      }
    } catch {
      // tables may not exist yet before migrate
    }
  }

  return {
    aiProvider,
    researchProvider,
    discoveryNews: {
      state: discovery.news.configured ? "configured" : "not_configured",
      label: discovery.news.label,
    },
    discoveryTrends: {
      state: discovery.trends.configured ? "configured" : "not_configured",
      label: discovery.trends.label,
    },
    discoveryRss: {
      state: "configured",
      label: discovery.rss.label,
    },
    discoveryPacks: {
      state: discovery.industryPacksActive > 0 ? "configured" : "not_configured",
      label: `${discovery.industryPacksActive} active industry pack(s)`,
    },
    aiPendingJobs: {
      state: pending > 0 ? "partial" : "healthy",
      label: pending > 0 ? `${pending} pending/running` : "None",
      count: pending,
    },
    aiLastSuccess: { state: "configured", label: lastSuccessLabel },
    aiLastFailure: {
      state: lastFailureLabel === "None" ? "healthy" : "partial",
      label: lastFailureLabel,
    },
  };
}
