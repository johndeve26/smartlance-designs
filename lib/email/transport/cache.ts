import { createSmtpTransport } from "@/lib/email/smtp";
import type { ResolvedSmtpConfig } from "@/lib/email/types";

type CacheEntry = {
  fingerprint: string;
  transport: ReturnType<typeof createSmtpTransport>;
};

const cache = new Map<string, CacheEntry>();

function fingerprint(config: ResolvedSmtpConfig): string {
  return [
    config.host,
    config.port,
    config.securityMode,
    config.username ?? "",
    config.password ?? "",
  ].join("|");
}

export function getCachedSmtpTransport(
  cacheKey: string,
  config: ResolvedSmtpConfig,
): ReturnType<typeof createSmtpTransport> {
  const fp = fingerprint(config);
  const existing = cache.get(cacheKey);
  if (existing && existing.fingerprint === fp) {
    return existing.transport;
  }
  if (existing) {
    try {
      existing.transport.close();
    } catch {
      /* ignore */
    }
  }
  const transport = createSmtpTransport(config);
  cache.set(cacheKey, { fingerprint: fp, transport });
  return transport;
}

export function invalidateSmtpTransportCache(profileId: string) {
  const entry = cache.get(profileId);
  if (entry) {
    try {
      entry.transport.close();
    } catch {
      /* ignore */
    }
    cache.delete(profileId);
  }
}

export function clearSmtpTransportCacheForTests() {
  for (const entry of cache.values()) {
    try {
      entry.transport.close();
    } catch {
      /* ignore */
    }
  }
  cache.clear();
}

export async function sendViaCachedSmtp(
  cacheKey: string,
  config: ResolvedSmtpConfig,
  input: {
    to: string | string[];
    subject: string;
    text: string;
    html?: string;
    replyTo?: string;
    inReplyTo?: string;
    references?: string;
    messageId?: string;
  },
) {
  const transport = getCachedSmtpTransport(cacheKey, config);
  const headers: Record<string, string> = {};
  if (input.inReplyTo) headers["In-Reply-To"] = input.inReplyTo;
  if (input.references) headers.References = input.references;
  if (input.messageId) headers["Message-ID"] = input.messageId;

  const from =
    config.fromName?.trim()
      ? `"${config.fromName.replace(/[\r\n"]/g, " ")}" <${config.fromEmail}>`
      : config.fromEmail;

  // #region agent log
  {
    const { agentDebugLog } = await import("@/lib/debug/agent-log");
    agentDebugLog({
      hypothesisId: "E",
      location: "transport/cache.ts:sendViaCachedSmtp",
      message: "smtp from header about to send",
      data: {
        cacheKey,
        fromHeader: from,
        configFromEmail: config.fromEmail,
        configFromName: config.fromName ?? null,
        envelopeFrom: config.envelopeFrom ?? null,
        smtpUser: config.username ?? null,
      },
      runId: "post-fix",
    });
  }
  // #endregion

  const info = await transport.sendMail({
    from,
    to: input.to,
    replyTo: input.replyTo || config.replyToEmail || undefined,
    subject: input.subject,
    text: input.text,
    html: input.html,
    headers: Object.keys(headers).length ? headers : undefined,
    messageId: input.messageId,
    envelope: config.envelopeFrom
      ? { from: config.envelopeFrom, to: input.to }
      : undefined,
  });

  // #region agent log
  {
    const { agentDebugLog } = await import("@/lib/debug/agent-log");
    agentDebugLog({
      hypothesisId: "E",
      location: "transport/cache.ts:sendViaCachedSmtp:after",
      message: "smtp sendMail completed",
      data: {
        cacheKey,
        fromHeader: from,
        messageId: info.messageId ?? null,
        response: typeof info.response === "string" ? info.response.slice(0, 200) : null,
        envelopeFrom:
          info.envelope && typeof info.envelope === "object" && "from" in info.envelope
            ? String((info.envelope as { from?: string }).from ?? "")
            : null,
      },
    });
  }
  // #endregion

  return { ok: true as const, messageId: info.messageId };
}
