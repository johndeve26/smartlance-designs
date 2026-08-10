import type { CrmEngagementClassification, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  classifyEngagementRequest,
  ENGAGEMENT_DEDUPE_WINDOW_MS,
  type EngagementRequestContext,
} from "@/lib/crm/outreach/engagement/classifier";
import { hashEngagementFingerprint } from "@/lib/crm/outreach/engagement/tokens";

type Db = Pick<
  PrismaClient,
  | "crmEmail"
  | "crmEmailEngagementEvent"
  | "crmTrackedLink"
  | "crmActivity"
  | "$transaction"
>;

function hashIp(ip: string | null): string | null {
  if (!ip?.trim()) return null;
  return hashEngagementFingerprint(`ip:${ip.trim()}`);
}

function hashUserAgent(ua: string | null): string | null {
  if (!ua?.trim()) return null;
  return hashEngagementFingerprint(`ua:${ua.trim().slice(0, 200)}`);
}

async function shouldDedupeEvent(
  db: Db,
  input: {
    crmEmailId: string;
    type: "OPEN_DETECTED" | "LINK_CLICKED";
    trackedLinkId?: string | null;
    userAgentHash?: string | null;
  },
): Promise<boolean> {
  const since = new Date(Date.now() - ENGAGEMENT_DEDUPE_WINDOW_MS);
  const recent = await db.crmEmailEngagementEvent.findFirst({
    where: {
      crmEmailId: input.crmEmailId,
      type: input.type,
      trackedLinkId: input.trackedLinkId ?? null,
      userAgentHash: input.userAgentHash ?? null,
      occurredAt: { gte: since },
    },
    select: { id: true },
  });
  return Boolean(recent);
}

async function recordFirstEngagementActivity(
  db: Db,
  input: {
    crmEmailId: string;
    contactId: string | null;
    type: "OPEN_DETECTED" | "LINK_CLICKED";
    subject: string;
    classification: CrmEngagementClassification;
  },
) {
  if (!input.contactId) return;

  const activityType =
    input.type === "OPEN_DETECTED" ? "EMAIL_OPEN_DETECTED" : "EMAIL_LINK_CLICKED";

  const existing = await db.crmActivity.findFirst({
    where: {
      contactId: input.contactId,
      type: activityType,
      metadata: { path: ["emailId"], equals: input.crmEmailId },
    },
    select: { id: true },
  });
  if (existing) return;

  await db.crmActivity.create({
    data: {
      contactId: input.contactId,
      type: activityType,
      subject: input.subject,
      metadata: {
        emailId: input.crmEmailId,
        classification: input.classification,
        approximate: input.type === "OPEN_DETECTED",
      },
    },
  });
}

export async function recordOpenEvent(input: {
  db?: Db;
  openTokenHash: string;
  ctx: EngagementRequestContext;
}): Promise<{ recorded: boolean }> {
  const db = input.db ?? prisma;
  const email = await db.crmEmail.findUnique({
    where: { openTokenHash: input.openTokenHash },
    select: {
      id: true,
      contactId: true,
      subject: true,
      openTrackingEnabled: true,
      direction: true,
      firstOpenDetectedAt: true,
    },
  });

  if (!email?.openTrackingEnabled || email.direction !== "OUTBOUND") {
    return { recorded: false };
  }

  const userAgentHash = hashUserAgent(input.ctx.userAgent);
  const ipHash = hashIp(input.ctx.ip);
  const classification = classifyEngagementRequest(input.ctx, "OPEN_DETECTED");

  if (
    await shouldDedupeEvent(db, {
      crmEmailId: email.id,
      type: "OPEN_DETECTED",
      userAgentHash,
    })
  ) {
    return { recorded: false };
  }

  const now = new Date();
  const isFirstOpen = !email.firstOpenDetectedAt;

  await db.$transaction(async (tx) => {
    await tx.crmEmailEngagementEvent.create({
      data: {
        crmEmailId: email.id,
        type: "OPEN_DETECTED",
        classification,
        userAgentHash,
        ipHash,
        occurredAt: now,
      },
    });

    await tx.crmEmail.update({
      where: { id: email.id },
      data: {
        openDetectedCount: { increment: 1 },
        lastOpenDetectedAt: now,
        ...(isFirstOpen ? { firstOpenDetectedAt: now } : {}),
      },
    });
  });

  if (isFirstOpen) {
    await recordFirstEngagementActivity(db, {
      crmEmailId: email.id,
      contactId: email.contactId,
      type: "OPEN_DETECTED",
      subject: `Open detected — ${email.subject}`,
      classification,
    });
  }

  return { recorded: true };
}

export async function recordClickEvent(input: {
  db?: Db;
  linkTokenHash: string;
  ctx: EngagementRequestContext;
}): Promise<{ recorded: boolean; destinationUrl: string | null }> {
  const db = input.db ?? prisma;
  const link = await db.crmTrackedLink.findUnique({
    where: { tokenHash: input.linkTokenHash },
    include: {
      crmEmail: {
        select: {
          id: true,
          contactId: true,
          subject: true,
          clickTrackingEnabled: true,
          direction: true,
          firstClickDetectedAt: true,
        },
      },
    },
  });

  if (!link?.crmEmail.clickTrackingEnabled || link.crmEmail.direction !== "OUTBOUND") {
    return { recorded: false, destinationUrl: null };
  }

  const userAgentHash = hashUserAgent(input.ctx.userAgent);
  const ipHash = hashIp(input.ctx.ip);
  const classification = classifyEngagementRequest(input.ctx, "LINK_CLICKED");
  const dedupe = await shouldDedupeEvent(db, {
    crmEmailId: link.crmEmailId,
    type: "LINK_CLICKED",
    trackedLinkId: link.id,
    userAgentHash,
  });

  const now = new Date();
  const isFirstClick = !link.crmEmail.firstClickDetectedAt;

  if (!dedupe) {
    await db.$transaction(async (tx) => {
      await tx.crmEmailEngagementEvent.create({
        data: {
          crmEmailId: link.crmEmailId,
          trackedLinkId: link.id,
          type: "LINK_CLICKED",
          classification,
          userAgentHash,
          ipHash,
          occurredAt: now,
        },
      });

      await tx.crmEmail.update({
        where: { id: link.crmEmailId },
        data: {
          clickDetectedCount: { increment: 1 },
          lastClickDetectedAt: now,
          ...(isFirstClick ? { firstClickDetectedAt: now } : {}),
          ...(classification === "LIKELY_HUMAN"
            ? { likelyHumanClickCount: { increment: 1 } }
            : {}),
        },
      });

      await tx.crmTrackedLink.update({
        where: { id: link.id },
        data: {
          clickCount: { increment: 1 },
          lastClickAt: now,
          ...(link.firstClickAt ? {} : { firstClickAt: now }),
        },
      });
    });

    if (isFirstClick) {
      const label = link.label ? ` — ${link.label}` : "";
      await recordFirstEngagementActivity(db, {
        crmEmailId: link.crmEmailId,
        contactId: link.crmEmail.contactId,
        type: "LINK_CLICKED",
        subject: `Link click detected${label}`,
        classification,
      });
    }
  }

  return { recorded: !dedupe, destinationUrl: link.destinationUrl };
}

export function parseEngagementRequest(request: Request): EngagementRequestContext {
  const prefetch =
    request.headers.get("x-moz") ??
    request.headers.get("x-purpose") ??
    request.headers.get("purpose");
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? null;
  return {
    method: request.method,
    userAgent: request.headers.get("user-agent"),
    ip,
    prefetchHeader: prefetch,
  };
}

import { hashEngagementToken } from "@/lib/crm/outreach/engagement/tokens";
