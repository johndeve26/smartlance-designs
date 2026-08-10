import Link from "next/link";
import type { AIWriterSettings } from "@prisma/client";
import { AI_ADMIN_LABELS } from "@/lib/admin/ai-settings-labels";
import { testProspectReviewAIAction } from "@/lib/admin/ai-prospect-actions";
import {
  ADMIN_CONTENT_AI_SURFACES,
  PUBLIC_NO_AI_FEATURES,
  PUBLIC_VISITOR_AI_FEATURES,
  PUBLIC_VISITOR_AI_PLANNED,
} from "@/lib/ai/providers/presentation";
import {
  getCatalogDefaultModel,
  getCatalogEntry,
} from "@/lib/ai/providers";
import type { ProviderAccountView } from "@/components/admin/ai-writer/ProviderConnections";

type PublicProspectAISectionProps = {
  settings: AIWriterSettings;
  accounts: ProviderAccountView[];
  testResult?: { result: string; reason?: string } | null;
};

export function PublicProspectAISection({
  settings,
  accounts,
  testResult,
}: PublicProspectAISectionProps) {
  const defaultProviderId = settings.defaultProviderId || "openai";
  const fastProviderId = settings.fastProviderId || defaultProviderId;
  const fastAccount = accounts.find((a) => a.providerId === fastProviderId);
  const fastModel =
    settings.fastModel ||
    getCatalogDefaultModel(fastProviderId, "FAST", fastAccount?.defaultModel);
  const configured = Boolean(fastAccount?.configured && fastAccount.enabled !== false);

  return (
    <section id="prospect-ai" className="scroll-mt-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">
          {AI_ADMIN_LABELS.websiteAiSection}
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          Tools visitors use on the public site. All route through{" "}
          <a href="#routing" className="underline">
            Model routing → {AI_ADMIN_LABELS.websiteToolsRouting}
          </a>
          . Provider keys are configured once in{" "}
          <strong>{AI_ADMIN_LABELS.settingsNavPath}</strong> — the same connections
          power the editorial studio and website tools.
        </p>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {AI_ADMIN_LABELS.websiteToolsRouting}
            </p>
            <p className="mt-1 text-sm font-semibold text-neutral-900">
              {getCatalogEntry(fastProviderId)?.label || fastProviderId}
              <span className="font-normal text-neutral-600"> · </span>
              <span className="font-mono text-[0.8125rem]">{fastModel}</span>
            </p>
            <p className="mt-1 text-sm text-neutral-600">
              {configured
                ? "Provider connected — visitor AI should be able to run."
                : "Provider not configured — reviews show checks only; brief AI help will fail."}
            </p>
          </div>
          <form action={testProspectReviewAIAction}>
            <button
              type="submit"
              className="admin-btn-secondary whitespace-nowrap"
              disabled={!configured}
            >
              Test website review AI
            </button>
          </form>
        </div>

        {testResult ? (
          <p
            className={`mt-4 rounded-md px-3 py-2 text-sm ${
              testResult.result === "ok"
                ? "bg-emerald-50 text-emerald-950"
                : "bg-red-50 text-red-950"
            }`}
          >
            {testResult.result === "ok"
              ? "Structured review AI test succeeded."
              : `Structured review AI test failed${testResult.reason ? `: ${testResult.reason}` : "."}`}
          </p>
        ) : null}

        <div className="mt-5 space-y-5 border-t border-neutral-100 pt-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Live on the website (visitor-triggered)
            </p>
            <ul className="mt-2 divide-y divide-neutral-100">
              {PUBLIC_VISITOR_AI_FEATURES.map((feature) => (
                <li
                  key={feature.id}
                  className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">
                      {feature.title}
                    </p>
                    <p className="text-sm text-neutral-600">{feature.description}</p>
                  </div>
                  <Link
                    href={feature.publicPath}
                    className="text-sm font-medium text-neutral-800 underline-offset-2 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open page
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Public tools without AI
            </p>
            <ul className="mt-2 space-y-2 text-sm text-neutral-600">
              {PUBLIC_NO_AI_FEATURES.map((item) => (
                <li key={item.title}>
                  {item.title}
                  {item.publicPath ? (
                    <>
                      {" "}
                      (
                      <Link href={item.publicPath} className="underline">
                        {item.publicPath}
                      </Link>
                      )
                    </>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Brief builder — coded but not live yet
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-600">
              {PUBLIC_VISITOR_AI_PLANNED.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Admin-only AI (shapes public content, not visitor runtime)
            </p>
            <p className="mt-1 text-sm text-neutral-600">
              Uses <strong>Writing</strong>, <strong>Editor</strong>, and{" "}
              <strong>Research</strong> model routing — configured above, not under{" "}
              {AI_ADMIN_LABELS.websiteToolsRouting}.
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-600">
              {ADMIN_CONTENT_AI_SURFACES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
