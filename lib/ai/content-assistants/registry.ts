/**
 * Thin AI content-type registry — wires entity types to specialized modules.
 */

import type { ContentAssistantModule } from "@/lib/ai/content-assistants/types";
import type { ContentAssistantEntityType } from "@/lib/ai/content-assistants/types";
import { serviceAssistant } from "@/lib/ai/content-assistants/service";
import { solutionAssistant } from "@/lib/ai/content-assistants/solution";
import { platformAssistant } from "@/lib/ai/content-assistants/platform";
import { industryAssistant } from "@/lib/ai/content-assistants/industry";
import { workAssistant } from "@/lib/ai/content-assistants/work";
import { testimonialAssistant } from "@/lib/ai/content-assistants/testimonial";
import { guideAssistant } from "@/lib/ai/content-assistants/guide";
import { comparisonAssistant } from "@/lib/ai/content-assistants/comparison";
import { checklistAssistant } from "@/lib/ai/content-assistants/checklist";
import { glossaryAssistant } from "@/lib/ai/content-assistants/glossary";
import { templateAssistant } from "@/lib/ai/content-assistants/template";
import { toolAssistant } from "@/lib/ai/content-assistants/tool";
import { homepageAssistant } from "@/lib/ai/content-assistants/homepage";

const REGISTRY: Record<ContentAssistantEntityType, ContentAssistantModule> = {
  SERVICE: serviceAssistant,
  SOLUTION: solutionAssistant,
  PLATFORM: platformAssistant,
  INDUSTRY: industryAssistant,
  WORK: workAssistant,
  TESTIMONIAL: testimonialAssistant,
  GUIDE: guideAssistant,
  COMPARISON: comparisonAssistant,
  CHECKLIST: checklistAssistant,
  GLOSSARY: glossaryAssistant,
  TEMPLATE: templateAssistant,
  TOOL: toolAssistant,
  HOMEPAGE: homepageAssistant,
};

const KNOWN = new Set<string>(Object.keys(REGISTRY));

export function getContentAssistant(
  entityType: ContentAssistantEntityType | string,
): ContentAssistantModule {
  if (!KNOWN.has(entityType)) {
    throw new Error(`No content assistant registered for ${entityType}`);
  }
  return REGISTRY[entityType as ContentAssistantEntityType];
}

export function listContentAssistants(): ContentAssistantModule[] {
  return Object.values(REGISTRY);
}

export function getAssistantActions(entityType: ContentAssistantEntityType) {
  return getContentAssistant(entityType).actions;
}
