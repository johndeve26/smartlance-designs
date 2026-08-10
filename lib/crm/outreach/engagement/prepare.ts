import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getOutreachSettings } from "@/lib/crm/outreach/settings";
import { ensureOutreachOptOutToken } from "@/lib/crm/outreach/opt-out";
import { getSiteOrigin } from "@/lib/seo/canonical";
import {
  appendOpenPixel,
  extractAnchors,
  isTrackableHttpUrl,
  plainTextToHtml,
  replaceAnchorHref,
  stripHtmlTags,
} from "@/lib/crm/outreach/engagement/html";
import {
  buildClickTrackingUrl,
  buildOpenPixelUrl,
  buildOutreachUnsubscribeUrl,
} from "@/lib/crm/outreach/engagement/urls";
import {
  createEngagementToken,
  hashEngagementToken,
} from "@/lib/crm/outreach/engagement/tokens";

export type PreparedTrackedEmail = {
  text: string;
  html: string | null;
  bodyHtml: string | null;
  openTrackingEnabled: boolean;
  clickTrackingEnabled: boolean;
};

export async function prepareTrackedOutreachEmail(input: {
  db?: Pick<
    PrismaClient,
    "crmEmail" | "crmTrackedLink" | "crmOutreachSettings"
  >;
  emailId: string;
  contactId: string;
  bodyText: string;
  trackOpens?: boolean;
  trackClicks?: boolean;
  includeUnsubscribe?: boolean;
}): Promise<PreparedTrackedEmail> {
  const db = input.db ?? prisma;
  const settings = await getOutreachSettings();
  const trackOpens = input.trackOpens ?? settings.trackEmailOpens;
  const trackClicks = input.trackClicks ?? settings.trackEmailClicks;

  let text = input.bodyText;
  const origin = await getSiteOrigin();

  if (input.includeUnsubscribe !== false) {
    const optOutToken = await ensureOutreachOptOutToken(input.contactId);
    if (optOutToken) {
      const unsubUrl = buildOutreachUnsubscribeUrl(origin, optOutToken);
      text = `${text}\n\n---\nOpt out of sales outreach: ${unsubUrl}`;
    }
  }

  const displayHtml = plainTextToHtml(input.bodyText);
  let sendHtml = plainTextToHtml(text);
  const updateData: {
    openTrackingEnabled: boolean;
    clickTrackingEnabled: boolean;
    bodyHtml: string;
    openTokenHash?: string;
  } = {
    openTrackingEnabled: trackOpens,
    clickTrackingEnabled: trackClicks,
    bodyHtml: displayHtml,
  };

  if (trackClicks) {
    const anchors = extractAnchors(sendHtml);
    let position = 0;
    for (const anchor of anchors) {
      if (!isTrackableHttpUrl(anchor.href)) continue;
      const rawToken = createEngagementToken();
      const tokenHash = hashEngagementToken(rawToken);
      const label = stripHtmlTags(anchor.inner).slice(0, 120) || null;

      await db.crmTrackedLink.create({
        data: {
          crmEmailId: input.emailId,
          destinationUrl: anchor.href,
          tokenHash,
          label,
          position,
        },
      });

      const trackedUrl = await buildClickTrackingUrl(rawToken);
      sendHtml = replaceAnchorHref(sendHtml, anchor.href, trackedUrl);
      position++;
    }
  }

  if (trackOpens) {
    const openToken = createEngagementToken();
    updateData.openTokenHash = hashEngagementToken(openToken);
    const pixelUrl = await buildOpenPixelUrl(openToken);
    sendHtml = appendOpenPixel(sendHtml, pixelUrl);
  }

  await db.crmEmail.update({
    where: { id: input.emailId },
    data: updateData,
  });

  const hasTracking = trackOpens || trackClicks;
  return {
    text,
    html: hasTracking ? sendHtml : null,
    bodyHtml: displayHtml,
    openTrackingEnabled: trackOpens,
    clickTrackingEnabled: trackClicks,
  };
}
