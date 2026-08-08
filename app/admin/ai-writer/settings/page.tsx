import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { getBrandVoice, getOrCreateSettings } from "@/lib/ai/editorial-service";
import {
  getAIProviderStatus,
  getCatalogDefaultModel,
  getCatalogEntry,
} from "@/lib/ai/providers";
import { getResearchProviderStatus } from "@/lib/ai/research";
import { listProviderPresentations } from "@/lib/ai/providers/presentation";
import { canEncryptAiSecrets } from "@/lib/ai/secrets";
import { AISettingsNotice } from "@/components/admin/ai-writer/AISettingsNotice";
import { ProviderConnections } from "@/components/admin/ai-writer/ProviderConnections";
import { ModelRoutingSection } from "@/components/admin/ai-writer/ModelRoutingSection";
import { GenerationLimitsSection } from "@/components/admin/ai-writer/GenerationLimitsSection";
import { AIWriterSubnav } from "@/components/admin/ai-writer/AIWriterSubnav";
import { getDiscoveryProviderStatus } from "@/lib/ai/topic-intelligence/providers";

export const dynamic = "force-dynamic";

function spString(
  sp: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const v = sp[key];
  return typeof v === "string" ? v : undefined;
}

function buildNotice(sp: Record<string, string | string[] | undefined>): {
  message: string;
  tone: "success" | "warning" | "danger";
} | null {
  const notice = spString(sp, "notice");
  if (notice === "routing") return { message: "✓ Model routing saved", tone: "success" };
  if (notice === "limits") return { message: "✓ Generation limits saved", tone: "success" };
  if (notice === "provider") {
    const id = spString(sp, "saved");
    const label = (id && getCatalogEntry(id)?.label) || "Provider";
    return { message: `✓ ${label} configuration saved`, tone: "success" };
  }
  if (notice === "cleared") {
    const id = spString(sp, "cleared");
    const label = (id && getCatalogEntry(id)?.label) || "Provider";
    return { message: `✓ ${label} API key removed`, tone: "success" };
  }
  // Connection test results stay inside the provider card (open= + test=).
  if (notice === "test" || (spString(sp, "test") && !notice)) {
    return null;
  }
  // Legacy query params
  if (spString(sp, "assignment") === "saved") {
    return { message: "✓ Model routing saved", tone: "success" };
  }
  if (spString(sp, "saved") && notice !== "cleared") {
    const label = getCatalogEntry(spString(sp, "saved")!)?.label || "Provider";
    return { message: `✓ ${label} configuration saved`, tone: "success" };
  }
  return null;
}

export default async function AIWriterSettingsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminUser("manage_ai_settings");
  const settings = await getOrCreateSettings();
  const ai = await getAIProviderStatus();
  const research = getResearchProviderStatus();
  const brand = await getBrandVoice();
  const sp = (await searchParams) || {};
  const notice = buildNotice(sp);
  const encryptionReady = canEncryptAiSecrets();
  const providers = listProviderPresentations();
  const discoveryStatus = await getDiscoveryProviderStatus();
  const defaultProviderId = settings.defaultProviderId || "openai";
  const defaultAccount = ai.accounts.find((a) => a.providerId === defaultProviderId);
  const writingProviderId = settings.writingProviderId || defaultProviderId;
  const writingAccount = ai.accounts.find((a) => a.providerId === writingProviderId);
  const writingModel =
    settings.writingModel ||
    getCatalogDefaultModel(writingProviderId, "WRITING", writingAccount?.defaultModel);
  const defaultNeedsAttention =
    !defaultAccount?.configured || defaultAccount.enabled === false;
  const researchAiProviderId = settings.researchProviderId || defaultProviderId;
  const researchAiAccount = ai.accounts.find((a) => a.providerId === researchAiProviderId);

  const openId = spString(sp, "open");
  const testResult = spString(sp, "test")
    ? {
        providerId: spString(sp, "test")!,
        result: spString(sp, "result") || "fail",
        reason: spString(sp, "reason")
          ? decodeURIComponent(spString(sp, "reason")!)
          : undefined,
      }
    : null;

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-10">
      <header className="space-y-3">
        <nav className="text-sm text-neutral-500">
          <Link href="/admin/ai-writer" className="hover:text-neutral-800">
            AI Writer
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-neutral-800">Settings</span>
        </nav>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
              AI Writer Settings
            </h1>
            <p className="mt-1 text-sm text-neutral-600">
              Configure AI providers, model routing, research access and generation limits.
            </p>
          </div>
          <Link href="/admin/system" className="admin-btn">
            View System Status
          </Link>
        </div>
        <AIWriterSubnav current="/admin/ai-writer/settings" />
        <nav className="flex flex-wrap gap-3 text-sm">
          <a href="#providers" className="text-neutral-600 hover:text-neutral-900">
            Providers
          </a>
          <a href="#routing" className="text-neutral-600 hover:text-neutral-900">
            Model routing
          </a>
          <a href="#research" className="text-neutral-600 hover:text-neutral-900">
            Research
          </a>
          <a href="#discovery" className="text-neutral-600 hover:text-neutral-900">
            Discovery sources
          </a>
          <a href="#limits" className="text-neutral-600 hover:text-neutral-900">
            Limits
          </a>
        </nav>
      </header>

      {notice ? (
        <AISettingsNotice key={notice.message} message={notice.message} tone={notice.tone} />
      ) : null}

      {defaultNeedsAttention ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-medium">Needs attention</p>
          <p className="mt-1">
            Default AI provider is not configured.{" "}
            <a href="#routing" className="font-medium underline">
              Fix routing
            </a>{" "}
            or{" "}
            <a href="#providers" className="font-medium underline">
              connect a provider
            </a>
            .
          </p>
        </div>
      ) : null}

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          System overview
        </h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">AI provider</p>
            <p className="mt-1 text-sm font-semibold text-neutral-900">
              {getCatalogEntry(defaultProviderId)?.label || defaultProviderId}
            </p>
            <p className="mt-0.5 text-xs text-neutral-600">
              {defaultNeedsAttention ? "Needs attention" : "Connected"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">Writing model</p>
            <p className="mt-1 break-all font-mono text-sm font-semibold text-neutral-900">
              {writingModel}
            </p>
            <p className="mt-0.5 text-xs text-neutral-600">
              {getCatalogEntry(writingProviderId)?.label || writingProviderId}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">Research (AI)</p>
            <p className="mt-1 text-sm font-semibold text-neutral-900">
              {getCatalogEntry(researchAiProviderId)?.label || researchAiProviderId}
            </p>
            <p className="mt-0.5 text-xs text-neutral-600">
              {researchAiAccount?.configured && researchAiAccount.enabled
                ? "Configured"
                : "Not configured"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">Web research</p>
            <p className="mt-1 text-sm font-semibold text-neutral-900">
              {research.configured ? "Tavily" : "Manual only"}
            </p>
            <p className="mt-0.5 text-xs text-neutral-600">
              {research.configured ? "Connected" : "No web research provider configured"}
            </p>
          </div>
        </div>
      </section>

      <ProviderConnections
        providers={providers}
        accounts={ai.accounts.map((a) => ({
          providerId: a.providerId,
          enabled: a.enabled,
          configured: a.configured,
          apiKeyLast4: a.apiKeyLast4,
          baseUrl: a.baseUrl,
          defaultModel: a.defaultModel,
        }))}
        defaultProviderId={defaultProviderId}
        initialOpenId={openId || (defaultNeedsAttention ? defaultProviderId : null)}
        testResult={testResult}
        encryptionReady={encryptionReady}
      />

      <ModelRoutingSection settings={settings} accounts={ai.accounts} />

      <section id="research" className="scroll-mt-6 space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Research</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Separate AI research models from external web research access.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <p className="text-sm font-semibold text-neutral-900">AI research model</p>
            <p className="mt-1 text-sm text-neutral-600">
              Configured in{" "}
              <a href="#routing" className="underline">
                Model routing
              </a>
              .
            </p>
            <p className="mt-2 font-mono text-xs text-neutral-700">
              {settings.researchModel ||
                getCatalogDefaultModel(
                  researchAiProviderId,
                  "RESEARCH",
                  researchAiAccount?.defaultModel,
                )}
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <p className="text-sm font-semibold text-neutral-900">Web research</p>
            {research.configured ? (
              <>
                <p className="mt-1 text-sm text-neutral-600">Tavily · Connected</p>
                <p className="mt-2 text-xs text-neutral-500">
                  Configured via environment secret. Manual source URLs always work.
                </p>
              </>
            ) : (
              <>
                <p className="mt-1 text-sm text-neutral-600">Manual sources only</p>
                <p className="mt-2 text-xs text-neutral-500">
                  No web research provider configured. Set{" "}
                  <code className="font-mono">TAVILY_API_KEY</code> to enable.
                </p>
              </>
            )}
            <Link
              href="/admin/ai-writer/source-policy"
              className="mt-3 inline-flex text-sm font-medium text-neutral-800 underline-offset-2 hover:underline"
            >
              Manage source policy
            </Link>
          </div>
        </div>
      </section>

      <section id="discovery" className="scroll-mt-6 space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Discovery sources</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Topic Intelligence signal providers. Keys stay in environment secrets.
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase text-neutral-500">Web research</dt>
              <dd className="mt-0.5 font-medium">{discoveryStatus.webSearch.label}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-neutral-500">News</dt>
              <dd className="mt-0.5 font-medium">{discoveryStatus.news.label}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-neutral-500">Trends</dt>
              <dd className="mt-0.5 font-medium">{discoveryStatus.trends.label}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-neutral-500">RSS</dt>
              <dd className="mt-0.5 font-medium">{discoveryStatus.rss.label}</dd>
            </div>
          </dl>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <Link href="/admin/ai-writer/source-packs" className="underline">
              Manage Source Packs
            </Link>
            <Link href="/admin/ai-writer/watchlists" className="underline">
              Watchlists
            </Link>
            <Link href="/admin/ai-writer/discover" className="underline">
              Topic Discovery
            </Link>
          </div>
        </div>
      </section>

      <GenerationLimitsSection settings={settings} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-neutral-900">Editorial configuration</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/admin/ai-writer/brand-voice"
            className="rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-300"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-neutral-900">Brand voice</p>
              <span
                className={`rounded px-2 py-0.5 text-xs ${
                  brand.approved
                    ? "bg-emerald-50 text-emerald-900"
                    : "bg-amber-50 text-amber-950"
                }`}
              >
                {brand.approved ? "Approved" : "Needs approval"}
              </span>
            </div>
            <p className="mt-1 text-sm text-neutral-600">Manage how AI Writer sounds.</p>
          </Link>
          <Link
            href="/admin/ai-writer/source-policy"
            className="rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-300"
          >
            <p className="text-sm font-semibold text-neutral-900">Source policy</p>
            <p className="mt-1 text-sm text-neutral-600">
              Manage research-source preferences and restrictions.
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
}
