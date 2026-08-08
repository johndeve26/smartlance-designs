/**
 * Shared context labeling for content assistants.
 * Never include Enquiries / sessions / credentials.
 */

import { AI_FORBIDDEN_CONTEXT_SOURCES } from "@/lib/ai/safety";
import { getBrandVoice } from "@/lib/ai/editorial-service";
import { prisma } from "@/lib/db";

export { AI_FORBIDDEN_CONTEXT_SOURCES };

export type LabeledContextBlock = {
  label:
    | "CURRENT_ENTITY"
    | "RELATED_SMARTLANCE_SERVICE"
    | "RELATED_SOLUTION"
    | "PUBLISHED_WORK"
    | "RESOURCE"
    | "PLATFORM"
    | "INDUSTRY"
    | "NEARBY_ENTITY"
    | "BRAND_VOICE"
    | "EDITOR_INSTRUCTION"
    | "SITE_POSITIONING";
  title?: string;
  data: unknown;
};

export function formatContextBlocks(blocks: LabeledContextBlock[]): string {
  return blocks
    .map((b) => {
      const header = b.title ? `${b.label}: ${b.title}` : b.label;
      return `<<<${header}>>>\n${JSON.stringify(b.data, null, 2)}\n<<<END_${b.label}>>>`;
    })
    .join("\n\n");
}

export async function loadBrandVoiceBlock(): Promise<LabeledContextBlock> {
  const voice = await getBrandVoice();
  return {
    label: "BRAND_VOICE",
    data: {
      approved: voice.approved,
      personality: voice.personality,
      audience: voice.audience,
      tone: voice.tone,
      sentenceStyle: voice.sentenceStyle,
      technicalDepth: voice.technicalDepth,
      ctaStyle: voice.ctaStyle,
      avoidedPhrases: voice.avoidedPhrases,
    },
  };
}

export async function loadSitePositioningBlock(): Promise<LabeledContextBlock | null> {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "site" },
      select: {
        siteName: true,
        businessName: true,
        defaultSiteDescription: true,
        defaultMetaTitle: true,
        defaultMetaDescription: true,
        footerDescription: true,
      },
    });
    if (!settings) return null;
    return {
      label: "SITE_POSITIONING",
      data: {
        siteName: settings.siteName,
        businessName: settings.businessName,
        description: settings.defaultSiteDescription,
        metaTitle: settings.defaultMetaTitle,
        metaDescription: settings.defaultMetaDescription,
        footerDescription: settings.footerDescription,
      },
    };
  } catch {
    return null;
  }
}

/** Guard: context builders must never query these models. */
export function assertNoForbiddenContextImports(sourceFileText: string) {
  for (const src of AI_FORBIDDEN_CONTEXT_SOURCES) {
    if (src.includes(".") ) continue;
    if (
      sourceFileText.includes(`prisma.${src.charAt(0).toLowerCase()}${src.slice(1)}`) ||
      sourceFileText.includes(`prisma.${src.toLowerCase()}`)
    ) {
      throw new Error(`Forbidden context source referenced: ${src}`);
    }
  }
}
