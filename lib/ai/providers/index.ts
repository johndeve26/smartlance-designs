import type { AIProviderAccount, AIWriterSettings } from "@prisma/client";
import { prisma } from "@/lib/db";
import { decryptSecret } from "@/lib/ai/secrets";
import {
  AI_PROVIDER_CATALOG,
  catalogRoleFromAIRole,
  envFallbackKey,
  getCatalogDefaultModel,
  getCatalogEntry,
  isCatalogProviderId,
  type AIProviderCatalogId,
} from "@/lib/ai/providers/catalog";
import { AnthropicProvider } from "@/lib/ai/providers/anthropic";
import { OpenAICompatibleProvider } from "@/lib/ai/providers/openai-compatible";
import { agentRouterClientHeaders } from "@/lib/ai/providers/agentrouter-headers";
import type { AIProvider } from "@/lib/ai/providers/types";
import type { AIRoleModel } from "@/lib/ai/types";

export type AIProviderStatus = {
  configured: boolean;
  providerId: string;
  label: "Configured" | "Not Configured";
  defaultProviderId: string;
  accounts: Array<{
    providerId: string;
    label: string;
    enabled: boolean;
    configured: boolean;
    apiKeyLast4: string | null;
    baseUrl: string | null;
    defaultModel: string | null;
  }>;
};

type RoleModels = Partial<Record<AIRoleModel, string>>;

type CacheEntry = {
  fingerprint: string;
  provider: AIProvider;
};

const providerCache = new Map<string, CacheEntry>();

export function invalidateAIProviderCache() {
  providerCache.clear();
}

function roleToSettingsProviderField(
  role: AIRoleModel,
): keyof Pick<
  AIWriterSettings,
  "writingProviderId" | "researchProviderId" | "editorProviderId" | "fastProviderId"
> {
  switch (role) {
    case "RESEARCH_MODEL":
      return "researchProviderId";
    case "EDITOR_MODEL":
      return "editorProviderId";
    case "FAST_MODEL":
      return "fastProviderId";
    default:
      return "writingProviderId";
  }
}

function buildRoleModels(
  settings: AIWriterSettings,
  providerIdForRole: (role: AIRoleModel) => string,
  adminDefaultForProvider: (providerId: string) => string | null | undefined,
): RoleModels {
  const pick = (role: AIRoleModel, assigned: string | null | undefined) => {
    if (assigned?.trim()) return assigned.trim();
    const providerId = providerIdForRole(role);
    return getCatalogDefaultModel(
      providerId,
      catalogRoleFromAIRole(role),
      adminDefaultForProvider(providerId),
    );
  };
  return {
    WRITING_MODEL: pick("WRITING_MODEL", settings.writingModel),
    RESEARCH_MODEL: pick("RESEARCH_MODEL", settings.researchModel),
    EDITOR_MODEL: pick("EDITOR_MODEL", settings.editorModel),
    FAST_MODEL: pick("FAST_MODEL", settings.fastModel),
  };
}

function resolveApiKey(
  account: AIProviderAccount | null,
  providerId: string,
): { apiKey: string; source: "admin" | "env" | "none" } {
  if (
    account?.apiKeyCiphertext &&
    account.apiKeyIv &&
    account.apiKeyTag
  ) {
    try {
      const apiKey = decryptSecret({
        ciphertext: account.apiKeyCiphertext,
        iv: account.apiKeyIv,
        tag: account.apiKeyTag,
      });
      if (apiKey.trim()) return { apiKey: apiKey.trim(), source: "admin" };
    } catch {
      // Fall through to env
    }
  }
  const envKey = envFallbackKey(providerId);
  if (envKey) return { apiKey: envKey, source: "env" };
  return { apiKey: "", source: "none" };
}

function resolveBaseUrl(
  account: AIProviderAccount | null,
  providerId: string,
): string | undefined {
  const catalog = getCatalogEntry(providerId);
  const override = account?.baseUrl?.trim() || "";
  if (override) return override.replace(/\/$/, "");
  if (providerId === "openai" || providerId === "custom") {
    const envBase = process.env.OPENAI_BASE_URL?.replace(/\/$/, "");
    if (envBase) return envBase;
  }
  return catalog?.defaultBaseUrl || undefined;
}

function instantiateProvider(input: {
  providerId: string;
  apiKey: string;
  baseUrl?: string;
  models: RoleModels;
}): AIProvider {
  const catalog = getCatalogEntry(input.providerId);
  const adapter = catalog?.adapter || "openai-compatible";
  const extraHeaders =
    input.providerId === "openrouter"
      ? {
          "HTTP-Referer":
            process.env.NEXT_PUBLIC_SITE_URL || "https://smartlancedesigns.com",
          "X-Title": "Smartlance AI Editorial Studio",
        }
      : input.providerId === "agentrouter"
        ? agentRouterClientHeaders()
        : catalog?.extraHeaders;

  if (adapter === "anthropic") {
    return new AnthropicProvider({
      id: input.providerId,
      apiKey: input.apiKey,
      baseUrl: input.baseUrl,
      models: input.models,
      allowEnvFallback: false,
    });
  }

  return new OpenAICompatibleProvider({
    id: input.providerId,
    apiKey: input.apiKey,
    baseUrl: input.baseUrl,
    models: input.models,
    extraHeaders,
    allowEnvFallback: false,
  });
}

async function loadSettingsAndAccounts(): Promise<{
  settings: AIWriterSettings;
  accounts: AIProviderAccount[];
}> {
  const [settings, accounts] = await Promise.all([
    prisma.aIWriterSettings.upsert({
      where: { id: "default" },
      create: { id: "default" },
      update: {},
    }),
    prisma.aIProviderAccount.findMany(),
  ]);
  return { settings, accounts };
}

export function resolveProviderIdForRole(
  settings: AIWriterSettings,
  role: AIRoleModel = "WRITING_MODEL",
): string {
  const override = settings[roleToSettingsProviderField(role)];
  if (override && isCatalogProviderId(override)) return override;
  if (settings.defaultProviderId && isCatalogProviderId(settings.defaultProviderId)) {
    return settings.defaultProviderId;
  }
  return "openai";
}

/**
 * Create a provider instance for a model role using Admin config (keys encrypted in DB)
 * with env fallback when Admin key is missing.
 */
export async function createAIProviderForRole(
  role: AIRoleModel = "WRITING_MODEL",
): Promise<AIProvider> {
  const { settings, accounts } = await loadSettingsAndAccounts();
  const providerId = resolveProviderIdForRole(settings, role);
  const account = accounts.find((a) => a.providerId === providerId) || null;
  const adminDefaultForProvider = (id: string) =>
    accounts.find((a) => a.providerId === id)?.defaultModel ?? null;

  if (account && account.enabled === false) {
    // Try default if role override disabled
    const fallbackId = settings.defaultProviderId || "openai";
    const fallbackAccount =
      accounts.find((a) => a.providerId === fallbackId && a.enabled) || null;
    const key = resolveApiKey(fallbackAccount, fallbackId);
    const fingerprint = `${fallbackId}:${key.source}:${fallbackAccount?.updatedAt?.toISOString() || ""}:${settings.updatedAt.toISOString()}:${role}:${fallbackAccount?.defaultModel || ""}`;
    const cached = providerCache.get(fingerprint);
    if (cached) return cached.provider;
    const provider = instantiateProvider({
      providerId: fallbackId,
      apiKey: key.apiKey,
      baseUrl: resolveBaseUrl(fallbackAccount, fallbackId),
      models: buildRoleModels(
        settings,
        (r) => resolveProviderIdForRole(settings, r),
        adminDefaultForProvider,
      ),
    });
    providerCache.set(fingerprint, { fingerprint, provider });
    return provider;
  }

  const key = resolveApiKey(account, providerId);
  const fingerprint = `${providerId}:${key.source}:${account?.updatedAt?.toISOString() || ""}:${settings.updatedAt.toISOString()}:${role}:${account?.defaultModel || ""}`;
  const cached = providerCache.get(fingerprint);
  if (cached) return cached.provider;

  const provider = instantiateProvider({
    providerId,
    apiKey: key.apiKey,
    baseUrl: resolveBaseUrl(account, providerId),
    models: buildRoleModels(
      settings,
      (r) => resolveProviderIdForRole(settings, r),
      adminDefaultForProvider,
    ),
  });
  providerCache.set(fingerprint, { fingerprint, provider });
  return provider;
}

/** Default provider (writing role) — preferred entry for editorial runs. */
export async function createAIProvider(): Promise<AIProvider> {
  return createAIProviderOrTestOverride("WRITING_MODEL");
}

export async function getAIProviderStatus(): Promise<AIProviderStatus> {
  const { settings, accounts } = await loadSettingsAndAccounts();
  const byId = new Map(accounts.map((a) => [a.providerId, a]));

  const accountStatuses = AI_PROVIDER_CATALOG.map((entry) => {
    const account = byId.get(entry.id) || null;
    const key = resolveApiKey(account, entry.id);
    const enabled = account?.enabled ?? true;
    return {
      providerId: entry.id,
      label: entry.label,
      enabled,
      configured: Boolean(key.apiKey) && enabled,
      apiKeyLast4:
        account?.apiKeyLast4 ||
        (key.source === "env" ? "env" : null),
      baseUrl: account?.baseUrl || entry.defaultBaseUrl,
      defaultModel: account?.defaultModel || entry.defaultModel,
    };
  });

  const defaultId = settings.defaultProviderId || "openai";
  const active =
    accountStatuses.find((a) => a.providerId === defaultId) ||
    accountStatuses.find((a) => a.configured) ||
    accountStatuses[0];

  const configured = Boolean(active?.configured);
  return {
    configured,
    providerId: active?.providerId || defaultId,
    label: configured ? "Configured" : "Not Configured",
    defaultProviderId: defaultId,
    accounts: accountStatuses,
  };
}

/** Build a one-off provider for connection tests (does not use role cache). */
export function createProviderForTest(input: {
  providerId: AIProviderCatalogId | string;
  apiKey: string;
  baseUrl?: string | null;
  defaultModel?: string | null;
}): AIProvider {
  const models: RoleModels = {
    WRITING_MODEL: getCatalogDefaultModel(input.providerId, "WRITING", input.defaultModel),
    RESEARCH_MODEL: getCatalogDefaultModel(input.providerId, "RESEARCH", input.defaultModel),
    EDITOR_MODEL: getCatalogDefaultModel(input.providerId, "EDITOR", input.defaultModel),
    FAST_MODEL: getCatalogDefaultModel(input.providerId, "FAST", input.defaultModel),
  };
  return instantiateProvider({
    providerId: input.providerId,
    apiKey: input.apiKey,
    baseUrl: input.baseUrl || resolveBaseUrl(null, input.providerId),
    models,
  });
}

/** Sync helper for tests that inject a mock provider. */
let testOverride: AIProvider | null = null;

export function setAIProviderForTests(provider: AIProvider | null) {
  testOverride = provider;
  invalidateAIProviderCache();
}

export async function createAIProviderOrTestOverride(
  role: AIRoleModel = "WRITING_MODEL",
): Promise<AIProvider> {
  if (testOverride) return testOverride;
  return createAIProviderForRole(role);
}

export { AI_PROVIDER_CATALOG, getCatalogEntry, getCatalogDefaultModel, isCatalogProviderId };
export type { AIProviderCatalogId };
