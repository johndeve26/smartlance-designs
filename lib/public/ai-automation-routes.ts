export const AI_AUTOMATION_HUB = "/ai-automation";

export const aiAutomationSlugs = [
  "ai-agents",
  "workflow-automation",
  "voice-ai",
  "integrations",
  "crm-lead-automation",
  "custom-ai-tools",
] as const;

export type AiAutomationSlug = (typeof aiAutomationSlugs)[number];

export const aiAutomationPaths: Record<
  AiAutomationSlug,
  { path: string; label: string }
> = {
  "ai-agents": { path: "/ai-automation/ai-agents", label: "AI Agents" },
  "workflow-automation": {
    path: "/ai-automation/workflow-automation",
    label: "Workflow Automation",
  },
  "voice-ai": { path: "/ai-automation/voice-ai", label: "Voice AI" },
  integrations: { path: "/ai-automation/integrations", label: "Integrations" },
  "crm-lead-automation": {
    path: "/ai-automation/crm-lead-automation",
    label: "CRM & Lead Automation",
  },
  "custom-ai-tools": {
    path: "/ai-automation/custom-ai-tools",
    label: "Custom AI Tools",
  },
};

export const legacyAiServiceRedirects: Record<string, string> = {
  "/services/ai-solutions": AI_AUTOMATION_HUB,
  "/services/ai-agents": aiAutomationPaths["ai-agents"].path,
  "/services/workflow-automation": aiAutomationPaths["workflow-automation"].path,
  "/services/voice-ai": aiAutomationPaths["voice-ai"].path,
  "/services/ai-integrations": aiAutomationPaths.integrations.path,
  "/services/custom-ai-tools": aiAutomationPaths["custom-ai-tools"].path,
};

export function isAiAutomationSlug(value: string): value is AiAutomationSlug {
  return (aiAutomationSlugs as readonly string[]).includes(value);
}
