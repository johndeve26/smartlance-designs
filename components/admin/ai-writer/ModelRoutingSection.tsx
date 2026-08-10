import type { AIWriterSettings } from "@prisma/client";
import { saveAIRoutingAction } from "@/lib/admin/ai-writer-actions";
import { getCatalogDefaultModel } from "@/lib/ai/providers";
import { listProviderPresentations, ROUTING_TASKS } from "@/lib/ai/providers/presentation";
import type { ProviderAccountView } from "@/components/admin/ai-writer/ProviderConnections";

import { AI_ADMIN_LABELS } from "@/lib/admin/ai-settings-labels";

export function ModelRoutingSection({
  settings,
  accounts,
}: {
  settings: AIWriterSettings;
  accounts: ProviderAccountView[];
}) {
  const providers = listProviderPresentations();
  const accountById = new Map(accounts.map((a) => [a.providerId, a]));
  const defaultProviderId = settings.defaultProviderId || "openai";
  const sortedProviders = [...providers].sort((a, b) => {
    const ac = accountById.get(a.id)?.configured ? 0 : 1;
    const bc = accountById.get(b.id)?.configured ? 0 : 1;
    return ac - bc || a.label.localeCompare(b.label);
  });

  return (
    <section id="routing" className="scroll-mt-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">Model routing</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Assign providers and models by task — editorial studio, content assistants,{" "}
          {AI_ADMIN_LABELS.websiteToolsRouting.toLowerCase()}, and research.
        </p>
      </div>

      <form action={saveAIRoutingAction} className="space-y-4 rounded-lg border border-neutral-200 bg-white p-4">
        <label className="block text-sm">
          <span className="font-medium text-neutral-800">Default provider</span>
          <select
            name="defaultProviderId"
            defaultValue={defaultProviderId}
            className="admin-input mt-1"
          >
            {sortedProviders.map((p) => {
              const acc = accountById.get(p.id);
              const status = !acc?.enabled
                ? "Disabled"
                : acc?.configured
                  ? "Connected"
                  : "Not configured";
              return (
                <option key={p.id} value={p.id}>
                  {p.label} — {status}
                </option>
              );
            })}
          </select>
          <span className="mt-1 block text-xs text-neutral-500">
            Used when a task is set to “Use default provider”.
          </span>
        </label>

        <div className="divide-y divide-neutral-100 rounded-md border border-neutral-200">
          {ROUTING_TASKS.map((task) => {
            const providerField = task.providerField as keyof AIWriterSettings;
            const modelField = task.modelField as keyof AIWriterSettings;
            const assignedProvider = String(settings[providerField] || "");
            const effectiveProvider = assignedProvider || defaultProviderId;
            const acc = accountById.get(effectiveProvider);
            const warn = !acc?.configured || acc.enabled === false;
            const modelDefault =
              String(settings[modelField] || "") ||
              getCatalogDefaultModel(effectiveProvider, task.role, acc?.defaultModel);

            return (
              <div key={task.id} className="grid gap-3 px-3 py-3 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.2fr)] sm:items-start">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{task.title}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">{task.description}</p>
                  {warn ? (
                    <p className="mt-2 text-xs text-amber-800">
                      Provider is not configured. Generation for this task will fail until a key is
                      added.
                    </p>
                  ) : null}
                </div>
                <label className="block text-sm">
                  <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                    Provider
                  </span>
                  <select
                    name={task.providerField}
                    defaultValue={assignedProvider}
                    className="admin-input mt-1"
                  >
                    <option value="">
                      Default — {providers.find((p) => p.id === defaultProviderId)?.label || defaultProviderId}
                    </option>
                    {sortedProviders.map((p) => {
                      const a = accountById.get(p.id);
                      const status = !a?.enabled
                        ? "Disabled"
                        : a?.configured
                          ? "Connected"
                          : "Not configured";
                      return (
                        <option key={`${task.id}-${p.id}`} value={p.id}>
                          {p.label} — {status}
                        </option>
                      );
                    })}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                    Model
                  </span>
                  <input
                    name={task.modelField}
                    list={`${task.modelField}-routing-list`}
                    defaultValue={modelDefault}
                    placeholder={getCatalogDefaultModel(effectiveProvider, task.role, acc?.defaultModel)}
                    className="admin-input mt-1 font-mono"
                  />
                  <datalist id={`${task.modelField}-routing-list`}>
                    {providers.flatMap((p) =>
                      p.models.map((m, i) => (
                        <option
                          key={`${task.modelField}-${p.id}-${m.id}-${i}`}
                          value={m.id}
                        >
                          {p.label}: {m.label}
                        </option>
                      )),
                    )}
                  </datalist>
                </label>
              </div>
            );
          })}
        </div>

        <button type="submit" className="admin-btn-primary">
          Save model routing
        </button>
      </form>
    </section>
  );
}
