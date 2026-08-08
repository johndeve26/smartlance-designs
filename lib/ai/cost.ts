import { prisma, hasDatabaseUrl } from "@/lib/db";

export type TokenTotals = {
  runs: number;
  input: number;
  output: number;
  failed: number;
  succeeded: number;
};

export type ModelPrice = {
  model: string;
  inputPer1MUsd: number;
  outputPer1MUsd: number;
};

export function estimateCostUsd(
  tokens: { input: number; output: number },
  pricing: ModelPrice[] | null | undefined,
  model?: string | null,
): number | null {
  if (!pricing?.length || !model) return null;
  const row = pricing.find((p) => p.model === model);
  if (!row) return null;
  return (
    (tokens.input / 1_000_000) * row.inputPer1MUsd +
    (tokens.output / 1_000_000) * row.outputPer1MUsd
  );
}

export async function getProjectUsageSummary(projectId: string) {
  if (!hasDatabaseUrl()) {
    return { runs: 0, input: 0, output: 0, byOperation: {} as Record<string, TokenTotals> };
  }
  const runs = await prisma.aIEditorialRun.findMany({
    where: { projectId },
    select: {
      operation: true,
      status: true,
      tokenUsageInput: true,
      tokenUsageOutput: true,
      model: true,
    },
  });
  const byOperation: Record<string, TokenTotals> = {};
  let input = 0;
  let output = 0;
  for (const r of runs) {
    const key = r.operation;
    if (!byOperation[key]) {
      byOperation[key] = { runs: 0, input: 0, output: 0, failed: 0, succeeded: 0 };
    }
    byOperation[key].runs += 1;
    byOperation[key].input += r.tokenUsageInput ?? 0;
    byOperation[key].output += r.tokenUsageOutput ?? 0;
    if (r.status === "FAILED") byOperation[key].failed += 1;
    if (r.status === "SUCCEEDED") byOperation[key].succeeded += 1;
    input += r.tokenUsageInput ?? 0;
    output += r.tokenUsageOutput ?? 0;
  }
  return { runs: runs.length, input, output, byOperation };
}

export async function getGlobalUsageWindow(since: Date) {
  if (!hasDatabaseUrl()) {
    return { runs: 0, input: 0, output: 0, failed: 0 };
  }
  const runs = await prisma.aIEditorialRun.findMany({
    where: { createdAt: { gte: since } },
    select: {
      status: true,
      tokenUsageInput: true,
      tokenUsageOutput: true,
    },
  });
  return {
    runs: runs.length,
    input: runs.reduce((a, r) => a + (r.tokenUsageInput ?? 0), 0),
    output: runs.reduce((a, r) => a + (r.tokenUsageOutput ?? 0), 0),
    failed: runs.filter((r) => r.status === "FAILED").length,
  };
}

export function parseModelPricing(json: unknown): ModelPrice[] | null {
  if (!Array.isArray(json)) return null;
  const out: ModelPrice[] = [];
  for (const row of json) {
    if (
      row &&
      typeof row === "object" &&
      typeof (row as ModelPrice).model === "string" &&
      typeof (row as ModelPrice).inputPer1MUsd === "number" &&
      typeof (row as ModelPrice).outputPer1MUsd === "number"
    ) {
      out.push(row as ModelPrice);
    }
  }
  return out.length ? out : null;
}
