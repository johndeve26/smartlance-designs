"use client";

import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import {
  clearAIProviderKeyAction,
  saveAIProviderAccountAction,
  testAIProviderConnectionAction,
} from "@/lib/admin/ai-provider-actions";
import { SecretKeyField } from "@/components/admin/ai-writer/SecretKeyField";
import type { ProviderPresentation } from "@/lib/ai/providers/presentation";

export type ProviderAccountView = {
  providerId: string;
  enabled: boolean;
  configured: boolean;
  apiKeyLast4: string | null;
  baseUrl: string | null;
  defaultModel: string | null;
};

function StatusPill({
  configured,
  enabled,
  isDefault,
}: {
  configured: boolean;
  enabled: boolean;
  isDefault: boolean;
}) {
  if (!enabled) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs text-neutral-600">
        <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" aria-hidden />
        Disabled
      </span>
    );
  }
  if (configured) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-900">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" aria-hidden />
        Connected
        {isDefault ? <span className="ml-1 font-semibold uppercase tracking-wide">Default</span> : null}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs text-neutral-600">
      <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" aria-hidden />
      Not configured
    </span>
  );
}

export function ProviderConnections({
  providers,
  accounts,
  defaultProviderId,
  initialOpenId,
  testResult,
  encryptionReady,
}: {
  providers: ProviderPresentation[];
  accounts: ProviderAccountView[];
  defaultProviderId: string;
  initialOpenId?: string | null;
  testResult?: { providerId: string; result: string; reason?: string } | null;
  encryptionReady: boolean;
}) {
  const accountById = useMemo(
    () => new Map(accounts.map((a) => [a.providerId, a])),
    [accounts],
  );
  const connectedCount = accounts.filter((a) => a.configured && a.enabled).length;
  const attentionId =
    initialOpenId ||
    (testResult?.result && testResult.result !== "ok" ? testResult.providerId : null) ||
    (accountById.get(defaultProviderId)?.configured ? defaultProviderId : null);

  const [openId, setOpenId] = useState<string | null>(attentionId);
  const [confirmClearId, setConfirmClearId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const confirmTitleId = useId();
  const cancelClearRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!confirmClearId) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    cancelClearRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setConfirmClearId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      restoreFocusRef.current?.focus?.();
    };
  }, [confirmClearId]);

  return (
    <section id="providers" className="scroll-mt-6 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Provider connections</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Connect the AI providers available to the Editorial Studio.
          </p>
        </div>
        <p className="text-xs text-neutral-500">
          <span className="font-medium text-neutral-800">{connectedCount} connected</span>
          {" · "}
          {providers.length} available
        </p>
      </div>

      {!encryptionReady ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Set <code className="font-mono text-xs">AI_SECRETS_ENCRYPTION_KEY</code> or{" "}
          <code className="font-mono text-xs">ADMIN_SESSION_SECRET</code> (≥16 chars) before storing
          keys in Admin. Env fallback keys still work.
        </p>
      ) : null}

      {!connectedCount ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white px-4 py-6 text-center">
          <p className="text-sm font-medium text-neutral-900">No AI provider connected</p>
          <p className="mt-1 text-sm text-neutral-600">
            Connect at least one provider to enable AI generation.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {["openai", "anthropic"].map((id) => (
              <button
                key={id}
                type="button"
                className="admin-btn"
                onClick={() => setOpenId(id)}
              >
                Configure {providers.find((p) => p.id === id)?.label || id}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        {providers.map((entry) => {
          const account = accountById.get(entry.id);
          const configured = Boolean(account?.configured);
          const enabled = account?.enabled ?? true;
          const isDefault = defaultProviderId === entry.id;
          const isOpen = openId === entry.id;
          const showTest =
            testResult?.providerId === entry.id ? testResult : null;
          const hasCustomBase =
            Boolean(account?.baseUrl) &&
            account?.baseUrl !== entry.defaultBaseUrl &&
            entry.id !== "custom";

          return (
            <div
              key={entry.id}
              className={`overflow-hidden rounded-lg border bg-white ${
                isDefault && configured ? "border-[color-mix(in_srgb,var(--admin-accent)_45%,#e6e3df)]" : "border-neutral-200"
              }`}
            >
              <button
                type="button"
                className="flex w-full items-start gap-3 px-4 py-3.5 text-left hover:bg-neutral-50"
                aria-expanded={isOpen}
                onClick={() => setOpenId(isOpen ? null : entry.id)}
              >
                <span
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-neutral-200 bg-neutral-50 font-mono text-xs font-semibold text-neutral-700"
                  aria-hidden
                >
                  {entry.initials}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[15px] font-semibold text-neutral-900">{entry.label}</span>
                    <StatusPill configured={configured} enabled={enabled} isDefault={isDefault} />
                  </span>
                  <span className="mt-0.5 block text-sm text-neutral-600">{entry.blurb}</span>
                  <span className="mt-1 block font-mono text-xs text-neutral-500">
                    Default: {account?.defaultModel || entry.defaultModel}
                    {hasCustomBase ? " · Custom base URL" : ""}
                  </span>
                </span>
                <span className="shrink-0 self-center text-sm font-medium text-neutral-700">
                  {isOpen ? "Close" : "Configure"}
                </span>
              </button>

              {isOpen ? (
                <form
                  action={saveAIProviderAccountAction}
                  className="space-y-5 border-t border-neutral-200 px-4 py-4"
                >
                  <input type="hidden" name="providerId" value={entry.id} />

                  {showTest ? (
                    <p
                      className={`rounded-md border px-3 py-2 text-sm ${
                        showTest.result === "ok"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                          : "border-amber-200 bg-amber-50 text-amber-950"
                      }`}
                    >
                      {showTest.result === "ok"
                        ? "Connection successful"
                        : showTest.result === "nokey"
                          ? "Connection failed — no API key configured."
                          : showTest.result === "nobase"
                            ? "Connection failed — base URL required."
                            : showTest.result === "empty"
                              ? "Connection failed — empty model response."
                              : `Connection failed${showTest.reason ? `: ${showTest.reason}` : "."}`}
                    </p>
                  ) : null}

                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Connection
                    </h3>
                    <label className="flex items-start gap-3 text-sm">
                      <input
                        type="checkbox"
                        name="enabled"
                        defaultChecked={enabled}
                        className="mt-1"
                      />
                      <span>
                        <span className="font-medium text-neutral-800">Provider enabled</span>
                        <span className="mt-0.5 block text-xs text-neutral-500">
                          Allow this provider to be selected for AI Writer tasks.
                        </span>
                      </span>
                    </label>

                    {entry.id === "custom" || hasCustomBase ? (
                      <label className="block text-sm">
                        <span className="font-medium text-neutral-800">Base URL</span>
                        <input
                          name="baseUrl"
                          defaultValue={account?.baseUrl || entry.defaultBaseUrl || ""}
                          placeholder={entry.defaultBaseUrl || "https://…/v1"}
                          className="admin-input mt-1 font-mono"
                          required={entry.id === "custom"}
                        />
                        <span className="mt-1 block text-xs text-neutral-500">
                          Only change this when using a compatible gateway or custom endpoint.
                        </span>
                      </label>
                    ) : (
                      <details className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2">
                        <summary className="cursor-pointer text-sm font-medium text-neutral-700">
                          Advanced connection settings
                        </summary>
                        <label className="mt-3 block text-sm">
                          <span className="font-medium text-neutral-800">Base URL</span>
                          <input
                            name="baseUrl"
                            defaultValue={account?.baseUrl || entry.defaultBaseUrl || ""}
                            placeholder={entry.defaultBaseUrl || "https://…/v1"}
                            className="admin-input mt-1 font-mono"
                          />
                          <span className="mt-1 block text-xs text-neutral-500">
                            Leave as default unless you use a gateway.
                          </span>
                        </label>
                      </details>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Model
                    </h3>
                    <label className="block text-sm">
                      <span className="font-medium text-neutral-800">Default model</span>
                      <input
                        name="defaultModel"
                        list={`default-model-${entry.id}`}
                        defaultValue={account?.defaultModel || entry.defaultModel}
                        placeholder={entry.defaultModel}
                        className="admin-input mt-1 font-mono"
                      />
                      <datalist id={`default-model-${entry.id}`}>
                        {entry.models.map((m) => (
                          <option key={`${entry.id}-${m.id}`} value={m.id}>
                            {m.label}
                          </option>
                        ))}
                      </datalist>
                      <span className="mt-1 block text-xs text-neutral-500">
                        Used when no task-specific model override is configured.
                      </span>
                    </label>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Authentication
                    </h3>
                    <SecretKeyField
                      configured={configured}
                      fingerprintLast4={account?.apiKeyLast4}
                    />
                  </div>

                  <details className="text-sm">
                    <summary className="cursor-pointer text-neutral-600">Technical details</summary>
                    <dl className="mt-2 grid gap-1 font-mono text-xs text-neutral-500">
                      <div>Provider ID: {entry.id}</div>
                      <div>Endpoint: {account?.baseUrl || entry.defaultBaseUrl || "—"}</div>
                      <div>
                        Key:{" "}
                        {account?.apiKeyLast4
                          ? account.apiKeyLast4 === "env"
                            ? "env fallback"
                            : `…${account.apiKeyLast4}`
                          : "none"}
                      </div>
                    </dl>
                  </details>

                  <div className="flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-4">
                    <button type="submit" className="admin-btn-primary" disabled={pending}>
                      Save changes
                    </button>
                    <button
                      type="submit"
                      formAction={testAIProviderConnectionAction}
                      className="admin-btn"
                      disabled={pending}
                    >
                      Test connection
                    </button>
                    <div className="ml-auto">
                      {configured && account?.apiKeyLast4 && account.apiKeyLast4 !== "env" ? (
                        <button
                          type="button"
                          className="admin-btn-danger"
                          onClick={() => setConfirmClearId(entry.id)}
                        >
                          Remove key
                        </button>
                      ) : null}
                    </div>
                  </div>
                </form>
              ) : null}

              {confirmClearId === entry.id ? (
                <div
                  className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4"
                  role="presentation"
                  onClick={() => setConfirmClearId(null)}
                >
                  <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={confirmTitleId}
                    className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-5 shadow-lg"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3 id={confirmTitleId} className="text-base font-semibold text-neutral-900">
                      Remove {entry.label} API key?
                    </h3>
                    <p className="mt-2 text-sm text-neutral-600">
                      {entry.label} will become unavailable for AI Writer tasks that use this
                      provider until another key is configured.
                    </p>
                    <div className="mt-5 flex justify-end gap-2">
                      <button
                        ref={cancelClearRef}
                        type="button"
                        className="admin-btn"
                        onClick={() => setConfirmClearId(null)}
                      >
                        Cancel
                      </button>
                      <form
                        action={clearAIProviderKeyAction}
                        onSubmit={() => {
                          setConfirmClearId(null);
                          startTransition(() => undefined);
                        }}
                      >
                        <input type="hidden" name="providerId" value={entry.id} />
                        <button type="submit" className="admin-btn-danger">
                          Remove key
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
