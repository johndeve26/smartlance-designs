export type AIProviderCatalogId =
  | "openai"
  | "anthropic"
  | "google"
  | "xai"
  | "openrouter"
  | "agentrouter"
  | "custom";

export type AIProviderAdapterKind = "openai-compatible" | "anthropic";

export type CatalogModelRole = "WRITING" | "RESEARCH" | "EDITOR" | "FAST";

export type CatalogModel = {
  id: string;
  label: string;
  /** Suggested default roles */
  roles?: CatalogModelRole[];
};

export type ProviderCatalogEntry = {
  id: AIProviderCatalogId;
  label: string;
  description: string;
  adapter: AIProviderAdapterKind;
  defaultBaseUrl: string | null;
  /** Primary default model when Admin role models are unset */
  defaultModel: string;
  /** Optional per-role defaults (falls back to defaultModel) */
  defaultModels?: Partial<Record<CatalogModelRole, string>>;
  /** Env var used as fallback when Admin key is empty */
  envKeyNames: string[];
  allowBaseUrlOverride: boolean;
  models: CatalogModel[];
  /** Extra headers for OpenAI-compatible gateways */
  extraHeaders?: Record<string, string>;
};

export const AI_PROVIDER_CATALOG: ProviderCatalogEntry[] = [
  {
    id: "openai",
    label: "OpenAI",
    description: "Official OpenAI Chat Completions API.",
    adapter: "openai-compatible",
    defaultBaseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o",
    defaultModels: {
      WRITING: "gpt-4o",
      RESEARCH: "gpt-4o-mini",
      EDITOR: "gpt-4o-mini",
      FAST: "gpt-4o-mini",
    },
    envKeyNames: ["OPENAI_API_KEY", "AI_PROVIDER_API_KEY"],
    allowBaseUrlOverride: true,
    models: [
      { id: "gpt-4o", label: "GPT-4o", roles: ["WRITING"] },
      { id: "gpt-4o-mini", label: "GPT-4o mini", roles: ["RESEARCH", "EDITOR", "FAST"] },
      { id: "o3-mini", label: "o3-mini", roles: ["RESEARCH", "FAST"] },
      { id: "gpt-4.1", label: "GPT-4.1", roles: ["WRITING"] },
      { id: "gpt-4.1-mini", label: "GPT-4.1 mini", roles: ["EDITOR", "FAST"] },
    ],
  },
  {
    id: "anthropic",
    label: "Anthropic (Claude)",
    description: "Claude via Anthropic Messages API.",
    adapter: "anthropic",
    defaultBaseUrl: "https://api.anthropic.com",
    defaultModel: "claude-sonnet-4-20250514",
    defaultModels: {
      WRITING: "claude-sonnet-4-20250514",
      RESEARCH: "claude-3-5-haiku-20241022",
      EDITOR: "claude-3-5-haiku-20241022",
      FAST: "claude-3-5-haiku-20241022",
    },
    envKeyNames: ["ANTHROPIC_API_KEY"],
    allowBaseUrlOverride: true,
    models: [
      { id: "claude-sonnet-4-20250514", label: "Claude Sonnet 4", roles: ["WRITING"] },
      { id: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku", roles: ["RESEARCH", "EDITOR", "FAST"] },
      { id: "claude-opus-4-20250514", label: "Claude Opus 4", roles: ["WRITING"] },
    ],
  },
  {
    id: "google",
    label: "Google (Gemini)",
    description: "Gemini via OpenAI-compatible endpoint.",
    adapter: "openai-compatible",
    defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    defaultModel: "gemini-2.5-pro",
    defaultModels: {
      WRITING: "gemini-2.5-pro",
      RESEARCH: "gemini-2.0-flash",
      EDITOR: "gemini-2.5-flash",
      FAST: "gemini-2.0-flash",
    },
    envKeyNames: ["GOOGLE_AI_API_KEY", "GEMINI_API_KEY"],
    allowBaseUrlOverride: true,
    models: [
      { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", roles: ["RESEARCH", "EDITOR", "FAST"] },
      { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", roles: ["WRITING"] },
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", roles: ["FAST", "EDITOR"] },
    ],
  },
  {
    id: "xai",
    label: "xAI (Grok)",
    description: "Grok via xAI OpenAI-compatible API.",
    adapter: "openai-compatible",
    defaultBaseUrl: "https://api.x.ai/v1",
    defaultModel: "grok-3",
    defaultModels: {
      WRITING: "grok-3",
      RESEARCH: "grok-3-mini",
      EDITOR: "grok-3-mini",
      FAST: "grok-3-mini",
    },
    envKeyNames: ["XAI_API_KEY"],
    allowBaseUrlOverride: true,
    models: [
      { id: "grok-3", label: "Grok 3", roles: ["WRITING"] },
      { id: "grok-3-mini", label: "Grok 3 mini", roles: ["RESEARCH", "EDITOR", "FAST"] },
    ],
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    description: "Multi-model gateway (OpenAI-compatible).",
    adapter: "openai-compatible",
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "openai/gpt-4o",
    defaultModels: {
      WRITING: "openai/gpt-4o",
      RESEARCH: "openai/gpt-4o-mini",
      EDITOR: "openai/gpt-4o-mini",
      FAST: "openai/gpt-4o-mini",
    },
    envKeyNames: ["OPENROUTER_API_KEY"],
    allowBaseUrlOverride: true,
    models: [
      { id: "openai/gpt-4o", label: "OpenAI GPT-4o", roles: ["WRITING"] },
      { id: "openai/gpt-4o-mini", label: "OpenAI GPT-4o mini", roles: ["RESEARCH", "EDITOR", "FAST"] },
      { id: "anthropic/claude-sonnet-4", label: "Claude Sonnet 4", roles: ["WRITING"] },
      { id: "google/gemini-2.0-flash-001", label: "Gemini 2.0 Flash", roles: ["FAST"] },
      { id: "x-ai/grok-3-mini", label: "Grok 3 mini", roles: ["EDITOR"] },
    ],
  },
  {
    id: "agentrouter",
    label: "Agent Router",
    description:
      "Unified OpenAI-compatible gateway (agentrouter.org). Uses allowlisted client headers required by their edge.",
    adapter: "openai-compatible",
    defaultBaseUrl: "https://agentrouter.org/v1",
    defaultModel: "gpt-4o",
    defaultModels: {
      WRITING: "gpt-4o",
      RESEARCH: "deepseek-chat",
      EDITOR: "claude-sonnet-4-5-20250929",
      FAST: "deepseek-chat",
    },
    envKeyNames: ["AGENT_ROUTER_TOKEN", "AGENTROUTER_API_KEY", "AGENT_ROUTER_API_KEY"],
    allowBaseUrlOverride: true,
    models: [
      { id: "gpt-5.5", label: "GPT-5.5", roles: ["WRITING"] },
      { id: "gpt-4o", label: "GPT-4o", roles: ["WRITING", "EDITOR"] },
      { id: "claude-opus-4-8", label: "Claude Opus 4.8", roles: ["WRITING"] },
      { id: "claude-sonnet-4-5-20250929", label: "Claude Sonnet 4.5", roles: ["WRITING", "EDITOR"] },
      { id: "glm-5.2", label: "GLM 5.2", roles: ["RESEARCH", "FAST"] },
      { id: "deepseek-chat", label: "DeepSeek Chat", roles: ["FAST", "RESEARCH"] },
    ],
  },
  {
    id: "custom",
    label: "Custom (OpenAI-compatible)",
    description: "Any OpenAI-compatible base URL and model ids.",
    adapter: "openai-compatible",
    defaultBaseUrl: null,
    defaultModel: "gpt-4o-mini",
    defaultModels: {
      WRITING: "gpt-4o",
      RESEARCH: "gpt-4o-mini",
      EDITOR: "gpt-4o-mini",
      FAST: "gpt-4o-mini",
    },
    envKeyNames: ["AI_PROVIDER_API_KEY", "OPENAI_API_KEY"],
    allowBaseUrlOverride: true,
    models: [],
  },
];

export function getCatalogEntry(providerId: string): ProviderCatalogEntry | undefined {
  return AI_PROVIDER_CATALOG.find((p) => p.id === providerId);
}

export function isCatalogProviderId(id: string): id is AIProviderCatalogId {
  return AI_PROVIDER_CATALOG.some((p) => p.id === id);
}

/** Map AIRoleModel → catalog role key */
export function catalogRoleFromAIRole(
  role: "RESEARCH_MODEL" | "WRITING_MODEL" | "EDITOR_MODEL" | "FAST_MODEL",
): CatalogModelRole {
  switch (role) {
    case "RESEARCH_MODEL":
      return "RESEARCH";
    case "EDITOR_MODEL":
      return "EDITOR";
    case "FAST_MODEL":
      return "FAST";
    default:
      return "WRITING";
  }
}

/** Resolve default model id for a provider (+ optional role), with optional Admin override. */
export function getCatalogDefaultModel(
  providerId: string,
  role: CatalogModelRole = "WRITING",
  adminDefaultModel?: string | null,
): string {
  const entry = getCatalogEntry(providerId);
  const admin = adminDefaultModel?.trim();
  if (!entry) return admin || "gpt-4o-mini";
  if (role === "WRITING" && admin) return admin;
  if (admin && !entry.defaultModels?.[role]) return admin;
  return (
    entry.defaultModels?.[role] ||
    admin ||
    entry.defaultModel ||
    entry.models[0]?.id ||
    "gpt-4o-mini"
  );
}

export function envFallbackKey(providerId: string): string {
  const entry = getCatalogEntry(providerId);
  if (!entry) return "";
  for (const name of entry.envKeyNames) {
    const v = process.env[name]?.trim();
    if (v) return v;
  }
  if (providerId === "openai" || providerId === "custom") {
    return (
      process.env.OPENAI_API_KEY?.trim() ||
      process.env.AI_PROVIDER_API_KEY?.trim() ||
      ""
    );
  }
  return "";
}
