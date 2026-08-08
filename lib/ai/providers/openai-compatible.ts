import type { z } from "zod";
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
import type { AIRoleModel, GenerateStructuredResult, GenerateTextResult } from "@/lib/ai/types";

const DEFAULT_MODELS: Record<AIRoleModel, string> = {
  RESEARCH_MODEL: "gpt-4o-mini",
  WRITING_MODEL: "gpt-4o",
  EDITOR_MODEL: "gpt-4o-mini",
  FAST_MODEL: "gpt-4o-mini",
};

/**
 * OpenAI Chat Completions–compatible provider (OpenAI, Gemini OpenAI endpoint, xAI, OpenRouter, custom).
 */
export class OpenAICompatibleProvider implements AIProvider {
  readonly id: string;

  constructor(
    private readonly options?: {
      id?: string;
      apiKey?: string;
      baseUrl?: string;
      models?: Partial<Record<AIRoleModel, string>>;
      timeoutMs?: number;
      extraHeaders?: Record<string, string>;
      /** When false, do not fall back to OPENAI_* env (Admin-only key path). */
      allowEnvFallback?: boolean;
    },
  ) {
    this.id = options?.id || "openai-compatible";
  }

  private apiKey() {
    const explicit = this.options?.apiKey?.trim() || "";
    if (explicit) return explicit;
    if (this.options?.allowEnvFallback === false) return "";
    return (
      process.env.OPENAI_API_KEY?.trim() ||
      process.env.AI_PROVIDER_API_KEY?.trim() ||
      ""
    );
  }

  private baseUrl() {
    return (
      this.options?.baseUrl?.replace(/\/$/, "") ||
      process.env.OPENAI_BASE_URL?.replace(/\/$/, "") ||
      "https://api.openai.com/v1"
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
    const body = {
      model,
      messages: options.messages,
      temperature: options.temperature ?? 0.4,
      max_tokens: options.maxTokens ?? 4096,
    };
    const res = await this.fetchChat(body, options.signal);
    const text = res.choices?.[0]?.message?.content;
    if (typeof text !== "string" || !text.trim()) {
      throw new AIProviderRequestError("Empty model response", "EMPTY_RESPONSE");
    }
    return {
      text,
      model,
      provider: this.id,
      requestId: res.id,
      usage: {
        input: res.usage?.prompt_tokens,
        output: res.usage?.completion_tokens,
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
        ...options.messages,
        ...(repairHint
          ? ([{ role: "user", content: repairHint }] as ChatMessage[])
          : []),
      ];
      const result = await this.generateText({
        ...options,
        messages: [
          {
            role: "system",
            content:
              "You are a structured editorial assistant. Respond with JSON only. No markdown fences.",
          },
          ...messages,
        ],
      });
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

  private async fetchChat(
    body: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<{
    id?: string;
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  }> {
    const timeoutMs = this.options?.timeoutMs ?? 90_000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const onAbort = () => controller.abort();
    signal?.addEventListener("abort", onAbort);
    try {
      const res = await fetch(`${this.baseUrl()}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey()}`,
          "Content-Type": "application/json",
          ...(this.options?.extraHeaders || {}),
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
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number };
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
      void body;
    }
  }
}

export function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1].trim() : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return JSON.parse(candidate.slice(start, end + 1));
  }
  const aStart = candidate.indexOf("[");
  const aEnd = candidate.lastIndexOf("]");
  if (aStart >= 0 && aEnd > aStart) {
    return JSON.parse(candidate.slice(aStart, aEnd + 1));
  }
  return JSON.parse(candidate);
}

/** Zod re-export helper for callers that need schema typing without importing zod twice. */
export type StructuredSchema<T> = z.ZodType<T>;
