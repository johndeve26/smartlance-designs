/**
 * Published Tools registry.
 * Only include Tools that are ready to ship — no placeholders.
 */

import type { ToolContent } from "@/data/resource-content-types";
import {
  PLATFORM_SELECTOR_BASE_QUESTION_COUNT,
  websitePlatformSelectorTool,
} from "@/data/tools/website-platform-selector";

export const tools: ToolContent[] = [websitePlatformSelectorTool];

export function getPublishedTools(): ToolContent[] {
  return tools.filter((item) => item.published);
}

export function getToolBySlug(slug: string): ToolContent | undefined {
  return getPublishedTools().find((item) => item.slug === slug);
}

export function getToolCount(): number {
  return getPublishedTools().length;
}

export function getToolQuestionCount(tool: ToolContent): number {
  if (tool.slug === "website-platform-selector") {
    return PLATFORM_SELECTOR_BASE_QUESTION_COUNT;
  }
  return tool.questionCount ?? 0;
}
