import type { z } from "zod";
import type {
  AIProvider,
  GenerateStructuredOptions,
  GenerateTextOptions,
} from "@/lib/ai/providers/types";
import type {
  AIRoleModel,
  GenerateStructuredResult,
  GenerateTextResult,
} from "@/lib/ai/types";

/**
 * Deterministic mock provider for Vitest — never calls paid APIs.
 */
export class MockAIProvider implements AIProvider {
  readonly id = "mock";
  private handlers = new Map<string, (messages: GenerateTextOptions["messages"]) => string>();

  isConfigured(): boolean {
    return true;
  }

  resolveModel(_role?: AIRoleModel, override?: string): string {
    return override || "mock-model";
  }

  onPromptContains(needle: string, response: string | ((msgs: GenerateTextOptions["messages"]) => string)) {
    this.handlers.set(needle, typeof response === "function" ? response : () => response);
  }

  async generateText(options: GenerateTextOptions): Promise<GenerateTextResult> {
    const blob = options.messages.map((m) => m.content).join("\n");
    for (const [needle, fn] of this.handlers) {
      if (blob.includes(needle)) {
        const text = fn(options.messages);
        return {
          text,
          model: this.resolveModel(options.modelRole, options.model),
          provider: this.id,
          usage: { input: 10, output: 20 },
          requestId: "mock-req",
        };
      }
    }
    return {
      text: JSON.stringify({ ok: true, echo: blob.slice(0, 200) }),
      model: this.resolveModel(options.modelRole, options.model),
      provider: this.id,
      usage: { input: 5, output: 5 },
      requestId: "mock-default",
    };
  }

  async generateStructured<T>(
    options: GenerateStructuredOptions<T>,
  ): Promise<GenerateStructuredResult<T>> {
    const result = await this.generateText(options);
    let parsed: unknown;
    try {
      parsed = JSON.parse(result.text);
    } catch {
      parsed = {};
    }
    const data = options.schema.parse(parsed) as T;
    return {
      data,
      usage: result.usage,
      requestId: result.requestId,
      model: result.model,
      provider: result.provider,
      rawText: result.text,
    };
  }
}

export function mockJsonResponse<T>(schema: z.ZodType<T>, data: T): string {
  return JSON.stringify(schema.parse(data));
}
