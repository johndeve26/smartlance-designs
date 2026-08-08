import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

async function main() {
  const { prisma } = await import("../lib/db");
  const { SMARTLANCE_BRAND_VOICE } = await import("../lib/ai/brand-voice-defaults");

  const existing = await prisma.aIBrandVoice.findUnique({ where: { id: "default" } });
  const row = await prisma.aIBrandVoice.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      personality: SMARTLANCE_BRAND_VOICE.personality,
      audience: SMARTLANCE_BRAND_VOICE.audience,
      tone: SMARTLANCE_BRAND_VOICE.tone,
      sentenceStyle: SMARTLANCE_BRAND_VOICE.sentenceStyle,
      technicalDepth: SMARTLANCE_BRAND_VOICE.technicalDepth,
      ctaStyle: SMARTLANCE_BRAND_VOICE.ctaStyle,
      formattingPrefs: SMARTLANCE_BRAND_VOICE.formattingPrefs,
      avoidedPhrases: [...SMARTLANCE_BRAND_VOICE.avoidedPhrases],
      approved: true,
      revision: 1,
    },
    update: {
      personality: SMARTLANCE_BRAND_VOICE.personality,
      audience: SMARTLANCE_BRAND_VOICE.audience,
      tone: SMARTLANCE_BRAND_VOICE.tone,
      sentenceStyle: SMARTLANCE_BRAND_VOICE.sentenceStyle,
      technicalDepth: SMARTLANCE_BRAND_VOICE.technicalDepth,
      ctaStyle: SMARTLANCE_BRAND_VOICE.ctaStyle,
      formattingPrefs: SMARTLANCE_BRAND_VOICE.formattingPrefs,
      avoidedPhrases: [...SMARTLANCE_BRAND_VOICE.avoidedPhrases],
      approved: true,
      revision: (existing?.revision ?? 0) + 1,
    },
  });

  console.log(
    JSON.stringify(
      {
        id: row.id,
        approved: row.approved,
        revision: row.revision,
        personalityChars: row.personality?.length ?? 0,
        audienceChars: row.audience?.length ?? 0,
        toneChars: row.tone?.length ?? 0,
        sentenceStyleChars: row.sentenceStyle?.length ?? 0,
        technicalDepthChars: row.technicalDepth?.length ?? 0,
        ctaStyleChars: row.ctaStyle?.length ?? 0,
        formattingPrefsChars: row.formattingPrefs?.length ?? 0,
        avoidedCount: Array.isArray(row.avoidedPhrases) ? row.avoidedPhrases.length : 0,
      },
      null,
      2,
    ),
  );

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
