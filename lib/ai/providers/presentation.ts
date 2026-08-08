import type { AIProviderCatalogId, ProviderCatalogEntry } from "@/lib/ai/providers/catalog";
import { AI_PROVIDER_CATALOG, getCatalogEntry } from "@/lib/ai/providers/catalog";

/** UI-only presentation metadata — does not change provider IDs or adapters. */
const PROVIDER_BLURBS: Record<AIProviderCatalogId, string> = {
  openai: "GPT models for writing, editing and structured generation.",
  anthropic: "Claude models for long-form reasoning and editorial work.",
  google: "Gemini models for research and generation.",
  xai: "Grok models through the xAI API.",
  openrouter: "Access supported models through a compatible gateway.",
  agentrouter: "Internal or compatible routing endpoint.",
  custom: "Connect another OpenAI-compatible endpoint.",
};

const PROVIDER_INITIALS: Record<AIProviderCatalogId, string> = {
  openai: "OA",
  anthropic: "AN",
  google: "GE",
  xai: "XA",
  openrouter: "OR",
  agentrouter: "AR",
  custom: "CU",
};

export type ProviderPresentation = ProviderCatalogEntry & {
  blurb: string;
  initials: string;
};

export function getProviderPresentation(providerId: string): ProviderPresentation | undefined {
  const entry = getCatalogEntry(providerId);
  if (!entry) return undefined;
  return {
    ...entry,
    blurb: PROVIDER_BLURBS[entry.id] || entry.description,
    initials: PROVIDER_INITIALS[entry.id] || entry.id.slice(0, 2).toUpperCase(),
  };
}

export function listProviderPresentations(): ProviderPresentation[] {
  return AI_PROVIDER_CATALOG.map((entry) => ({
    ...entry,
    blurb: PROVIDER_BLURBS[entry.id] || entry.description,
    initials: PROVIDER_INITIALS[entry.id] || entry.id.slice(0, 2).toUpperCase(),
  }));
}

export const ROUTING_TASKS = [
  {
    id: "writing",
    title: "Writing",
    description: "Long-form article drafting and section generation.",
    providerField: "writingProviderId",
    modelField: "writingModel",
    role: "WRITING" as const,
  },
  {
    id: "research",
    title: "Research",
    description: "Research synthesis and source analysis.",
    providerField: "researchProviderId",
    modelField: "researchModel",
    role: "RESEARCH" as const,
  },
  {
    id: "editor",
    title: "Editor",
    description: "Editorial review, structure and refinement.",
    providerField: "editorProviderId",
    modelField: "editorModel",
    role: "EDITOR" as const,
  },
  {
    id: "fast",
    title: "Fast tasks",
    description: "Lightweight classification and utility operations.",
    providerField: "fastProviderId",
    modelField: "fastModel",
    role: "FAST" as const,
  },
] as const;
