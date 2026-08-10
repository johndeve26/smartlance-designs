import type { z } from "zod";
import type {
  AIRoleModel,
  GenerateStructuredResult,
  GenerateTextResult,
} from "@/lib/ai/types";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type GenerateTextOptions = {
  modelRole?: AIRoleModel;
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
};

export type GenerateStructuredOptions<T> = GenerateTextOptions & {
  schema: z.ZodType<T>;
  schemaName?: string;
  repairAttempts?: number;
};

/**
 * Provider abstraction — business logic must depend on this interface,
 * not a concrete LLM vendor SDK.
 */
export interface AIProvider {
  readonly id: string;
  isConfigured(): boolean;
  resolveModel(role?: AIRoleModel, override?: string): string;
  generateText(options: GenerateTextOptions): Promise<GenerateTextResult>;
  generateStructured<T>(
    options: GenerateStructuredOptions<T>,
  ): Promise<GenerateStructuredResult<T>>;
  streamText?(
    options: GenerateTextOptions,
  ): AsyncIterable<string>;
  embed?(texts: string[]): Promise<number[][]>;
}

export class AIProviderNotConfiguredError extends Error {
  constructor(providerId = "ai") {
    super(
      `AI provider "${providerId}" is not configured. Add an API key in Admin → AI → Settings (or set the env fallback) and retry.`,
    );
    this.name = "AIProviderNotConfiguredError";
  }
}

export class AIProviderRequestError extends Error {
  code: string;
  constructor(message: string, code = "PROVIDER_ERROR") {
    super(message);
    this.name = "AIProviderRequestError";
    this.code = code;
  }
}
