import { hasDatabaseUrl, prisma } from "@/lib/db";
import type {
  Prisma,
  SubscriberEventType,
  SubscriberSource,
  SubscriberStatus,
} from "@prisma/client";
import { sendTransactionalEmail } from "@/lib/email/send";
import {
  AUDIENCE_CONSENT_TEXT,
  AUDIENCE_CONSENT_VERSION,
  PUBLIC_SUBSCRIBE_SUCCESS_ACTIVE,
  PUBLIC_SUBSCRIBE_SUCCESS_PENDING,
} from "@/lib/audience/constants";
import {
  audienceConfirmationEmailContent,
  audienceWelcomeEmailContent,
} from "@/lib/audience/email-templates";
import {
  normalizeSourceUrl,
  normalizeSubscriberEmail,
  type SubscribeFormInput,
} from "@/lib/audience/schema";
import {
  confirmationExpiresAt,
  createSubscriberToken,
  hashSubscriberToken,
} from "@/lib/audience/tokens";
import { getSiteSettingsAdmin } from "@/lib/repositories/siteSettingsRepository";

export type AudienceSettings = {
  enabled: boolean;
  requireConfirmation: boolean;
};

export type SubscribeResult = {
  ok: true;
  message: string;
  /** Internal only — never expose to public API */
  _status?: SubscriberStatus;
};

export type AdminSubscriberDto = {
  id: string;
  email: string;
  name: string | null;
  status: SubscriberStatus;
  primarySource: SubscriberSource;
  primarySourceUrl: string | null;
  consentAt: string | null;
  consentText: string | null;
  consentVersion: string | null;
  subscribedAt: string | null;
  confirmedAt: string | null;
  unsubscribedAt: string | null;
  createdAt: string;
  events: Array<{
    id: string;
    type: SubscriberEventType;
    source: SubscriberSource | null;
    sourceUrl: string | null;
    createdAt: string;
  }>;
};

export async function getAudienceSettings(): Promise<AudienceSettings> {
  if (!hasDatabaseUrl()) {
    return { enabled: true, requireConfirmation: true };
  }
  const row = await getSiteSettingsAdmin();
  return {
    enabled: row?.audienceEnabled ?? true,
    requireConfirmation: row?.audienceRequireConfirmation ?? true,
  };
}

async function recordSubscriberEvent(input: {
  subscriberId: string;
  type: SubscriberEventType;
  source?: SubscriberSource | null;
  sourceUrl?: string | null;
}) {
  await prisma.subscriberEvent.create({
    data: {
      subscriberId: input.subscriberId,
      type: input.type,
      source: input.source ?? null,
      sourceUrl: input.sourceUrl ?? null,
    },
  });
}

async function sendConfirmationEmail(input: {
  email: string;
  name: string | null;
  confirmationToken: string;
}) {
  const content = await audienceConfirmationEmailContent({
    name: input.name,
    confirmationToken: input.confirmationToken,
  });
  return sendTransactionalEmail({
    to: input.email,
    subject: content.subject,
    text: content.text,
  });
}

async function sendWelcomeEmail(input: {
  email: string;
  name: string | null;
  unsubscribeToken: string;
}) {
  const content = await audienceWelcomeEmailContent({
    name: input.name,
    unsubscribeToken: input.unsubscribeToken,
  });
  return sendTransactionalEmail({
    to: input.email,
    subject: content.subject,
    text: content.text,
  });
}

function rotateTokens() {
  const confirmationToken = createSubscriberToken();
  const unsubscribeToken = createSubscriberToken();
  return {
    confirmationToken,
    confirmationTokenHash: hashSubscriberToken(confirmationToken),
    confirmationTokenExpiresAt: confirmationExpiresAt(),
    unsubscribeToken,
    unsubscribeTokenHash: hashSubscriberToken(unsubscribeToken),
  };
}

export async function subscribeToAudience(input: {
  name?: string | null;
  email: string;
  source: SubscriberSource;
  sourceUrl?: string | null;
  consentText?: string;
  consentVersion?: string;
}): Promise<SubscribeResult> {
  if (!hasDatabaseUrl()) {
    throw new Error("Subscription storage is unavailable.");
  }

  const settings = await getAudienceSettings();
  if (!settings.enabled) {
    throw new Error("Subscriptions are temporarily unavailable.");
  }

  const email = input.email.trim();
  const emailNormalized = normalizeSubscriberEmail(email);
  const name = input.name?.trim() || null;
  const sourceUrl = normalizeSourceUrl(input.sourceUrl);
  const now = new Date();
  const consentText = input.consentText || AUDIENCE_CONSENT_TEXT;
  const consentVersion = input.consentVersion || AUDIENCE_CONSENT_VERSION;

  const existing = await prisma.subscriber.findUnique({
    where: { emailNormalized },
  });

  if (existing?.status === "ACTIVE") {
    if (sourceUrl || input.source !== existing.primarySource) {
      await recordSubscriberEvent({
        subscriberId: existing.id,
        type: "SUBSCRIBED",
        source: input.source,
        sourceUrl,
      });
    }
    return {
      ok: true,
      message: PUBLIC_SUBSCRIBE_SUCCESS_ACTIVE,
      _status: "ACTIVE",
    };
  }

  const tokens = rotateTokens();
  const requireConfirmation = settings.requireConfirmation;

  if (existing?.status === "PENDING") {
    await prisma.subscriber.update({
      where: { id: existing.id },
      data: {
        name: name ?? existing.name,
        confirmationTokenHash: tokens.confirmationTokenHash,
        confirmationTokenExpiresAt: tokens.confirmationTokenExpiresAt,
        unsubscribeTokenHash: tokens.unsubscribeTokenHash,
        consentAt: now,
        consentText,
        consentVersion,
      },
    });

    if (requireConfirmation) {
      const emailResult = await sendConfirmationEmail({
        email,
        name: name ?? existing.name,
        confirmationToken: tokens.confirmationToken,
      });
      await recordSubscriberEvent({
        subscriberId: existing.id,
        type: "CONFIRMATION_SENT",
        source: input.source,
        sourceUrl,
      });
      if (!emailResult.success) {
        console.error("[audience:confirmation]", emailResult.errorCode);
      }
    }

    return {
      ok: true,
      message: requireConfirmation
        ? PUBLIC_SUBSCRIBE_SUCCESS_PENDING
        : PUBLIC_SUBSCRIBE_SUCCESS_ACTIVE,
      _status: "PENDING",
    };
  }

  if (existing?.status === "UNSUBSCRIBED") {
    const status: SubscriberStatus = requireConfirmation ? "PENDING" : "ACTIVE";
    await prisma.subscriber.update({
      where: { id: existing.id },
      data: {
        email,
        name,
        status,
        primarySource: existing.primarySource,
        primarySourceUrl: existing.primarySourceUrl,
        consentAt: now,
        consentText,
        consentVersion,
        subscribedAt: now,
        confirmedAt: requireConfirmation ? null : now,
        unsubscribedAt: null,
        unsubscribedById: null,
        confirmationTokenHash: requireConfirmation
          ? tokens.confirmationTokenHash
          : null,
        confirmationTokenExpiresAt: requireConfirmation
          ? tokens.confirmationTokenExpiresAt
          : null,
        unsubscribeTokenHash: tokens.unsubscribeTokenHash,
      },
    });

    await recordSubscriberEvent({
      subscriberId: existing.id,
      type: "RESUBSCRIBED",
      source: input.source,
      sourceUrl,
    });

    if (requireConfirmation) {
      const emailResult = await sendConfirmationEmail({
        email,
        name,
        confirmationToken: tokens.confirmationToken,
      });
      await recordSubscriberEvent({
        subscriberId: existing.id,
        type: "CONFIRMATION_SENT",
        source: input.source,
        sourceUrl,
      });
      if (!emailResult.success) {
        console.error("[audience:confirmation]", emailResult.errorCode);
      }
    } else {
      const welcome = await sendWelcomeEmail({
        email,
        name,
        unsubscribeToken: tokens.unsubscribeToken,
      });
      if (!welcome.success) {
        console.error("[audience:welcome]", welcome.errorCode);
      }
    }

    return {
      ok: true,
      message: requireConfirmation
        ? PUBLIC_SUBSCRIBE_SUCCESS_PENDING
        : PUBLIC_SUBSCRIBE_SUCCESS_ACTIVE,
      _status: status,
    };
  }

  const status: SubscriberStatus = requireConfirmation ? "PENDING" : "ACTIVE";

  let subscriber;
  try {
    subscriber = await prisma.subscriber.create({
      data: {
        email,
        emailNormalized,
        name,
        status,
        primarySource: input.source,
        primarySourceUrl: sourceUrl,
        consentAt: now,
        consentText,
        consentVersion,
        subscribedAt: now,
        confirmedAt: requireConfirmation ? null : now,
        confirmationTokenHash: requireConfirmation
          ? tokens.confirmationTokenHash
          : null,
        confirmationTokenExpiresAt: requireConfirmation
          ? tokens.confirmationTokenExpiresAt
          : null,
        unsubscribeTokenHash: tokens.unsubscribeTokenHash,
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint")
    ) {
      return subscribeToAudience(input);
    }
    throw error;
  }

  await recordSubscriberEvent({
    subscriberId: subscriber.id,
    type: "SUBSCRIBED",
    source: input.source,
    sourceUrl,
  });

  if (requireConfirmation) {
    const emailResult = await sendConfirmationEmail({
      email,
      name,
      confirmationToken: tokens.confirmationToken,
    });
    await recordSubscriberEvent({
      subscriberId: subscriber.id,
      type: "CONFIRMATION_SENT",
      source: input.source,
      sourceUrl,
    });
    if (!emailResult.success) {
      console.error("[audience:confirmation]", emailResult.errorCode);
    }
  } else {
    const welcome = await sendWelcomeEmail({
      email,
      name,
      unsubscribeToken: tokens.unsubscribeToken,
    });
    if (!welcome.success) {
      console.error("[audience:welcome]", welcome.errorCode);
    }
  }

  return {
    ok: true,
    message: requireConfirmation
      ? PUBLIC_SUBSCRIBE_SUCCESS_PENDING
      : PUBLIC_SUBSCRIBE_SUCCESS_ACTIVE,
    _status: status,
  };
}

export async function confirmSubscription(token: string) {
  if (!hasDatabaseUrl()) return { ok: false as const, code: "UNAVAILABLE" as const };

  const hash = hashSubscriberToken(token);
  const subscriber = await prisma.subscriber.findFirst({
    where: { confirmationTokenHash: hash },
  });

  if (!subscriber) {
    return { ok: false as const, code: "INVALID" as const };
  }

  if (
    subscriber.confirmationTokenExpiresAt &&
    subscriber.confirmationTokenExpiresAt.getTime() < Date.now()
  ) {
    return { ok: false as const, code: "EXPIRED" as const };
  }

  if (subscriber.status === "ACTIVE") {
    return { ok: true as const, code: "ALREADY_ACTIVE" as const };
  }

  const now = new Date();
  await prisma.subscriber.update({
    where: { id: subscriber.id },
    data: {
      status: "ACTIVE",
      confirmedAt: now,
      confirmationTokenHash: null,
      confirmationTokenExpiresAt: null,
    },
  });

  await recordSubscriberEvent({
    subscriberId: subscriber.id,
    type: "CONFIRMED",
  });

  return { ok: true as const, code: "CONFIRMED" as const };
}

export async function unsubscribeByToken(token: string) {
  if (!hasDatabaseUrl()) return { ok: false as const, code: "UNAVAILABLE" as const };

  const hash = hashSubscriberToken(token);
  const subscriber = await prisma.subscriber.findFirst({
    where: { unsubscribeTokenHash: hash },
  });

  if (!subscriber) {
    return { ok: false as const, code: "INVALID" as const };
  }

  if (subscriber.status === "UNSUBSCRIBED") {
    return { ok: true as const, code: "ALREADY_UNSUBSCRIBED" as const };
  }

  const now = new Date();
  await prisma.subscriber.update({
    where: { id: subscriber.id },
    data: {
      status: "UNSUBSCRIBED",
      unsubscribedAt: now,
    },
  });

  await recordSubscriberEvent({
    subscriberId: subscriber.id,
    type: "UNSUBSCRIBED",
  });

  return { ok: true as const, code: "UNSUBSCRIBED" as const };
}

export async function tryOptionalAudienceSubscribe(input: {
  name?: string | null;
  email: string;
  source: SubscriberSource;
  sourceUrl?: string | null;
  optedIn: boolean;
}): Promise<void> {
  if (!input.optedIn) return;
  try {
    await subscribeToAudience({
      name: input.name,
      email: input.email,
      source: input.source,
      sourceUrl: input.sourceUrl,
    });
  } catch (error) {
    console.error(
      "[audience:opt-in]",
      error instanceof Error ? error.message : "Optional subscribe failed",
    );
  }
}

export function toAdminSubscriberDto(
  row: Prisma.SubscriberGetPayload<{ include: { events: true } }>,
): AdminSubscriberDto {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    status: row.status,
    primarySource: row.primarySource,
    primarySourceUrl: row.primarySourceUrl,
    consentAt: row.consentAt?.toISOString() ?? null,
    consentText: row.consentText,
    consentVersion: row.consentVersion,
    subscribedAt: row.subscribedAt?.toISOString() ?? null,
    confirmedAt: row.confirmedAt?.toISOString() ?? null,
    unsubscribedAt: row.unsubscribedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    events: row.events.map((event) => ({
      id: event.id,
      type: event.type,
      source: event.source,
      sourceUrl: event.sourceUrl,
      createdAt: event.createdAt.toISOString(),
    })),
  };
}

export type SubscriberListFilters = {
  q?: string;
  status?: SubscriberStatus | "all";
  source?: SubscriberSource;
  from?: Date;
  to?: Date;
  page?: number;
  pageSize?: number;
};

export async function countSubscribersByStatus() {
  if (!hasDatabaseUrl()) {
    return { total: 0, active: 0, pending: 0, unsubscribed: 0, new30d: 0 };
  }
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [total, active, pending, unsubscribed, new30d] = await Promise.all([
    prisma.subscriber.count(),
    prisma.subscriber.count({ where: { status: "ACTIVE" } }),
    prisma.subscriber.count({ where: { status: "PENDING" } }),
    prisma.subscriber.count({ where: { status: "UNSUBSCRIBED" } }),
    prisma.subscriber.count({ where: { subscribedAt: { gte: since } } }),
  ]);
  return { total, active, pending, unsubscribed, new30d };
}

export async function listSubscribers(filters: SubscriberListFilters = {}) {
  if (!hasDatabaseUrl()) {
    return { items: [], total: 0, page: 1, pageSize: 25 };
  }

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(filters.pageSize ?? 25, 100);
  const where: Prisma.SubscriberWhereInput = {};

  if (filters.status && filters.status !== "all") {
    where.status = filters.status;
  }
  if (filters.source) where.primarySource = filters.source;
  if (filters.from || filters.to) {
    where.subscribedAt = {};
    if (filters.from) where.subscribedAt.gte = filters.from;
    if (filters.to) where.subscribedAt.lte = filters.to;
  }
  if (filters.q?.trim()) {
    const q = filters.q.trim();
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.subscriber.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        primarySource: true,
        primarySourceUrl: true,
        subscribedAt: true,
        confirmedAt: true,
        unsubscribedAt: true,
        createdAt: true,
      },
    }),
    prisma.subscriber.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getSubscriberById(id: string) {
  if (!hasDatabaseUrl()) return null;
  return prisma.subscriber.findUnique({
    where: { id },
    include: {
      events: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
}

export async function adminUnsubscribeSubscriber(input: {
  id: string;
  actorId: string;
}) {
  const subscriber = await prisma.subscriber.findUnique({
    where: { id: input.id },
  });
  if (!subscriber) throw new Error("Subscriber not found.");
  if (subscriber.status === "UNSUBSCRIBED") return subscriber;

  const updated = await prisma.subscriber.update({
    where: { id: input.id },
    data: {
      status: "UNSUBSCRIBED",
      unsubscribedAt: new Date(),
      unsubscribedById: input.actorId,
    },
  });

  await recordSubscriberEvent({
    subscriberId: updated.id,
    type: "UNSUBSCRIBED",
  });

  return updated;
}

export function escapeSubscriberCsvCell(value: string) {
  let v = value.replace(/\r\n/g, "\n");
  if (/^[=+\-@]/.test(v)) v = `'${v}`;
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export async function exportSubscribersCsv(input: { actorId: string }) {
  if (!hasDatabaseUrl()) throw new Error("Database unavailable.");

  const EXPORT_MAX = 5000;
  const items = await prisma.subscriber.findMany({
    orderBy: { createdAt: "desc" },
    take: EXPORT_MAX,
  });

  const header = [
    "email",
    "name",
    "status",
    "primarySource",
    "primarySourceUrl",
    "subscribedAt",
    "confirmedAt",
    "unsubscribedAt",
  ];

  const rows: string[][] = [header];
  for (const row of items) {
    rows.push([
      row.email,
      row.name || "",
      row.status,
      row.primarySource,
      row.primarySourceUrl || "",
      row.subscribedAt?.toISOString() || "",
      row.confirmedAt?.toISOString() || "",
      row.unsubscribedAt?.toISOString() || "",
    ]);
  }

  const csv = rows
    .map((row) => row.map((cell) => escapeSubscriberCsvCell(String(cell))).join(","))
    .join("\n");

  const { writeAuditLog } = await import("@/lib/repositories/auditRepository");
  await writeAuditLog({
    actorId: input.actorId,
    action: "subscriber_export",
    entityType: "Subscriber",
    entityId: null,
    metadata: { count: items.length, cappedAt: EXPORT_MAX },
  });

  return csv;
}

export function parseSubscribePayload(
  data: Omit<SubscribeFormInput, "_gotcha">,
) {
  return {
    name: data.name || null,
    email: data.email,
    source: data.source,
    sourceUrl: normalizeSourceUrl(data.sourceUrl),
  };
}
