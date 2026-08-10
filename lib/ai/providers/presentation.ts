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
    title: "Website & prospect tools",
    description:
      "Free Website Review, Website Brief assists, and other visitor-facing AI on the public site.",
    providerField: "fastProviderId",
    modelField: "fastModel",
    role: "FAST" as const,
  },
] as const;

/** Live visitor-triggered AI — all use FAST_MODEL via Model routing → Public & prospect AI. */
export const PUBLIC_VISITOR_AI_FEATURES = [
  {
    id: "website-review",
    title: "Free Website Review (automated)",
    description:
      "After crawling the site, AI generates summary, priorities, strengths and findings.",
    publicPath: "/free-website-review",
    modelRole: "FAST_MODEL" as const,
  },
  {
    id: "website-brief-help",
    title: "Website Brief Builder — field help",
    description: 'Per-field "Improve with AI" while building a brief (anonymous or workspace).',
    publicPath: "/website-brief",
    modelRole: "FAST_MODEL" as const,
  },
] as const;

/** Brief AI helpers implemented but not yet exposed on public routes. */
export const PUBLIC_VISITOR_AI_PLANNED = [
  "Brief summary generation",
  "Suggest answers from linked website review",
  "Section explanations and missing-field prompts",
] as const;

/** Public routes with no runtime AI — rules/forms only. */
export const PUBLIC_NO_AI_FEATURES = [
  { title: "Project Planner", publicPath: "/project-planner" },
  { title: "Contact & human review enquiry forms", publicPath: "/contact" },
  { title: "All CMS pages (services, work, blog, etc.)", publicPath: null },
] as const;

/**
 * Admin-only AI that shapes what visitors read — configured in Model routing
 * (Writing / Editor / Research), not Public & prospect AI.
 */
export const ADMIN_CONTENT_AI_SURFACES = [
  "Services, Solutions, Work, Industries, Platforms",
  "Homepage copy assistant (draft only)",
  "Resources — guides, insights, templates, checklists",
  "Testimonials",
  "AI Writer editorial studio",
] as const;

/** @deprecated Use PUBLIC_VISITOR_AI_FEATURES */
export const PUBLIC_PROSPECT_AI_FEATURES = PUBLIC_VISITOR_AI_FEATURES;
