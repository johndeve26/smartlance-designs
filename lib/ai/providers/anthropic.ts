import type {
  AIProvider,
  ChatMessage,
  GenerateStructuredOptions,
  GenerateTextOptions,
} from "@/lib/ai/providers/types";
import {
  AIProviderNotConfiguredError,
  AIProviderRequestError,
} from "@/lib/ai/providers/types";
import { extractJson } from "@/lib/ai/providers/openai-compatible";
import type { AIRoleModel, GenerateStructuredResult, GenerateTextResult } from "@/lib/ai/types";

const DEFAULT_MODELS: Record<AIRoleModel, string> = {
  RESEARCH_MODEL: "claude-3-5-haiku-20241022",
  WRITING_MODEL: "claude-sonnet-4-20250514",
  EDITOR_MODEL: "claude-3-5-haiku-20241022",
  FAST_MODEL: "claude-3-5-haiku-20241022",
};

const ANTHROPIC_VERSION = "2023-06-01";

/** Exported for unit tests — maps Chat Completions-style messages to Anthropic Messages. */
export function mapMessagesForAnthropic(messages: ChatMessage[]): {
  system?: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
} {
  const systemParts: string[] = [];
  const mapped: Array<{ role: "user" | "assistant"; content: string }> = [];
  for (const m of messages) {
    if (m.role === "system") {
      systemParts.push(m.content);
      continue;
    }
    const role = m.role === "assistant" ? "assistant" : "user";
    const last = mapped[mapped.length - 1];
    if (last && last.role === role) {
      last.content = `${last.content}\n\n${m.content}`;
    } else {
      mapped.push({ role, content: m.content });
    }
  }
  if (mapped.length === 0) {
    mapped.push({ role: "user", content: "Continue." });
  }
  if (mapped[0]?.role !== "user") {
    mapped.unshift({ role: "user", content: "(context)" });
  }
  return {
    system: systemParts.length ? systemParts.join("\n\n") : undefined,
    messages: mapped,
  };
}

/**
 * Anthropic Messages API provider (Claude).
 */
export class AnthropicProvider implements AIProvider {
  readonly id: string;

  constructor(
    private readonly options?: {
      id?: string;
      apiKey?: string;
      baseUrl?: string;
      models?: Partial<Record<AIRoleModel, string>>;
      timeoutMs?: number;
      allowEnvFallback?: boolean;
    },
  ) {
    this.id = options?.id || "anthropic";
  }

  private apiKey() {
    const explicit = this.options?.apiKey?.trim() || "";
    if (explicit) return explicit;
    if (this.options?.allowEnvFallback === false) return "";
    return process.env.ANTHROPIC_API_KEY?.trim() || "";
  }

  private baseUrl() {
    return (
      this.options?.baseUrl?.replace(/\/$/, "") ||
      "https://api.anthropic.com"
    );
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey());
  }

  resolveModel(role: AIRoleModel = "WRITING_MODEL", override?: string): string {
    if (override?.trim()) return override.trim();
    const fromEnv =
      role === "RESEARCH_MODEL"
        ? process.env.AI_RESEARCH_MODEL
        : role === "EDITOR_MODEL"
          ? process.env.AI_EDITOR_MODEL
          : role === "FAST_MODEL"
            ? process.env.AI_FAST_MODEL
            : process.env.AI_WRITING_MODEL;
    return (
      this.options?.models?.[role] ||
      fromEnv?.trim() ||
      DEFAULT_MODELS[role]
    );
  }

  async generateText(options: GenerateTextOptions): Promise<GenerateTextResult> {
    if (!this.isConfigured()) {
      throw new AIProviderNotConfiguredError(this.id);
    }
    const model = this.resolveModel(options.modelRole, options.model);
    const mapped = mapMessagesForAnthropic(options.messages);
    const body: Record<string, unknown> = {
      model,
      max_tokens: options.maxTokens ?? 4096,
      temperature: options.temperature ?? 0.4,
      messages: mapped.messages,
    };
    if (mapped.system) body.system = mapped.system;

    const res = await this.fetchMessages(body, options.signal);
    const text = extractTextContent(res.content);
    if (!text.trim()) {
      throw new AIProviderRequestError("Empty model response", "EMPTY_RESPONSE");
    }
    return {
      text,
      model,
      provider: this.id,
      requestId: res.id,
      usage: {
        input: res.usage?.input_tokens,
        output: res.usage?.output_tokens,
      },
    };
  }

  async generateStructured<T>(
    options: GenerateStructuredOptions<T>,
  ): Promise<GenerateStructuredResult<T>> {
    const attempts = Math.max(1, Math.min(options.repairAttempts ?? 2, 3));
    let lastError: unknown;
    for (let i = 0; i < attempts; i++) {
      const repairHint =
        i === 0
          ? ""
          : `\n\nPrevious response was invalid JSON for schema "${options.schemaName ?? "response"}". Return ONLY valid JSON matching the schema. Error: ${String(lastError)}`;
      const messages: ChatMessage[] = [
        {
          role: "system",
          content:
            "You are a structured editorial assistant. Respond with JSON only. No markdown fences.",
        },
        ...options.messages,
        ...(repairHint
          ? ([{ role: "user", content: repairHint }] as ChatMessage[])
          : []),
      ];
      const result = await this.generateText({ ...options, messages });
      try {
        const parsed = extractJson(result.text);
        const data = options.schema.parse(parsed) as T;
        return {
          data,
          usage: result.usage,
          requestId: result.requestId,
          model: result.model,
          provider: result.provider,
          rawText: result.text,
        };
      } catch (err) {
        lastError = err;
      }
    }
    throw new AIProviderRequestError(
      `Structured output failed after ${attempts} attempts: ${String(lastError)}`,
      "INVALID_STRUCTURED_OUTPUT",
    );
  }

  async *streamText(options: GenerateTextOptions): AsyncIterable<string> {
    const result = await this.generateText(options);
    yield result.text;
  }

  private async fetchMessages(
    body: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<{
    id?: string;
    content?: Array<{ type?: string; text?: string }>;
    usage?: { input_tokens?: number; output_tokens?: number };
  }> {
    const timeoutMs = this.options?.timeoutMs ?? 90_000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const onAbort = () => controller.abort();
    signal?.addEventListener("abort", onAbort);
    try {
      const res = await fetch(`${this.baseUrl()}/v1/messages`, {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey(),
          "anthropic-version": ANTHROPIC_VERSION,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        const snippet = body.replace(/\s+/g, " ").slice(0, 180);
        throw new AIProviderRequestError(
          snippet
            ? `Provider HTTP ${res.status}: ${snippet}`
            : `Provider HTTP ${res.status}`,
          res.status === 429
            ? "RATE_LIMITED"
            : res.status === 401 || res.status === 403
              ? "AUTH_ERROR"
              : "HTTP_ERROR",
        );
      }
      return (await res.json()) as {
        id?: string;
        content?: Array<{ type?: string; text?: string }>;
        usage?: { input_tokens?: number; output_tokens?: number };
      };
    } catch (err) {
      if (err instanceof AIProviderRequestError) throw err;
      if ((err as Error)?.name === "AbortError") {
        throw new AIProviderRequestError("Provider request timed out", "TIMEOUT");
      }
      throw new AIProviderRequestError(
        err instanceof Error ? err.message : "Provider request failed",
        "NETWORK_ERROR",
      );
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    }
  }
}

function extractTextContent(
  content?: Array<{ type?: string; text?: string }>,
): string {
  if (!content?.length) return "";
  return content
    .filter((b) => b.type === "text" && typeof b.text === "string")
    .map((b) => b.text!)
    .join("\n")
    .trim();
}
