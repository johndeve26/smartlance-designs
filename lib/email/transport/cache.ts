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

  const envelopeTo = Array.isArray(input.to) ? input.to : [input.to];
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
      ? { from: config.envelopeFrom, to: envelopeTo }
      : undefined,
  });

  return { ok: true as const, messageId: info.messageId };
}
