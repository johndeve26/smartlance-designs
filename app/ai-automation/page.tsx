import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { AiAutomationHubPage } from "@/components/ai-automation/ai-automation-hub";
import { AI_AUTOMATION_HUB } from "@/lib/public/ai-automation-routes";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "AI & Automation for Business Workflows",
    description:
      "Practical AI, workflow automation, CRM lead handling, voice AI, integrations and custom tools — built around real business problems.",
    path: AI_AUTOMATION_HUB,
  });
}

export default function AiAutomationHubRoute() {
  return <AiAutomationHubPage />;
}
