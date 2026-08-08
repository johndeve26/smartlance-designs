/**
 * Server-side permission gates for CMS content assistants.
 * AI permission never exceeds CMS edit permission.
 */

import type { AdminRole } from "@prisma/client";
import { assertCan, can } from "@/lib/admin/rbac";
import type { ContentAssistantEntityType } from "@/lib/ai/content-assistants/types";

export function assertCanUseContentAssistant(role: AdminRole) {
  assertCan(role, "use_ai_writer");
  assertCan(role, "edit_draft");
}

export function canUseContentAssistant(role: AdminRole): boolean {
  return can(role, "use_ai_writer") && can(role, "edit_draft");
}

export function entityLabel(entityType: ContentAssistantEntityType): string {
  switch (entityType) {
    case "SERVICE":
      return "Service";
    case "SOLUTION":
      return "Solution";
    case "PLATFORM":
      return "Platform";
    case "INDUSTRY":
      return "Industry";
    case "WORK":
      return "WorkProject";
    case "TESTIMONIAL":
      return "Testimonial";
    case "GUIDE":
      return "CmsResource";
    case "COMPARISON":
      return "CmsResource";
    case "CHECKLIST":
      return "CmsResource";
    case "GLOSSARY":
      return "CmsResource";
    case "TEMPLATE":
      return "CmsResource";
    case "TOOL":
      return "CmsResource";
    case "HOMEPAGE":
      return "HomepageContent";
    default:
      return entityType;
  }
}
