import { ImapFlow } from "imapflow";
import type { SmtpSecurityMode } from "@/lib/email/types";
import type {
  InboundMailboxProvider,
  MailboxMessageRef,
} from "@/lib/email/inbound/types";

export type ResolvedImapConfig = {
  host: string;
  port: number;
  securityMode: SmtpSecurityMode;
  username: string;
  password: string;
  mailboxFolder: string;
};

function resolveImapSecurity(
  securityMode: SmtpSecurityMode,
  port: number,
): { secure: boolean } {
  const mode =
    securityMode === "AUTO"
      ? port === 993
        ? "TLS"
        : "STARTTLS"
      : securityMode;
  return { secure: mode === "TLS" };
}

export function buildMailboxKey(config: ResolvedImapConfig): string {
  return `${config.host}|${config.username}|${config.mailboxFolder}`.toLowerCase();
}

export function createImapProvider(config: ResolvedImapConfig): InboundMailboxProvider {
  let client: ImapFlow | null = null;

  async function connect(): Promise<ImapFlow> {
    if (client) return client;
    const security = resolveImapSecurity(config.securityMode, config.port);
    client = new ImapFlow({
      host: config.host,
      port: config.port,
      secure: security.secure,
      auth: {
        user: config.username,
        pass: config.password,
      },
      logger: false,
      tls: {
        rejectUnauthorized: true,
      },
    });
    await client.connect();
    return client;
  }

  return {
    async testConnection() {
      try {
        const c = await connect();
        const lock = await c.getMailboxLock(config.mailboxFolder);
        lock.release();
        await c.logout();
        client = null;
        return { ok: true as const };
      } catch (err) {
        return {
          ok: false as const,
          error: err instanceof Error ? err.message.slice(0, 120) : "Connection failed.",
        };
      }
    },

    async listNewMessages(input) {
      const c = await connect();
      const lock = await c.getMailboxLock(config.mailboxFolder);
      try {
        const status = await c.status(config.mailboxFolder, { uidValidity: true });
        const uidValidity = BigInt(status.uidValidity ?? 0);

        if (input.uidValidity != null && input.uidValidity !== uidValidity) {
          return { uidValidity, messages: [] };
        }

        const sinceUid = input.sinceUid > BigInt(0) ? Number(input.sinceUid) + 1 : 1;
        const mailboxKey = buildMailboxKey(config);
        const messages: MailboxMessageRef[] = [];

        for await (const msg of c.fetch(`${sinceUid}:*`, {
          uid: true,
          source: true,
        })) {
          if (!msg.uid || !msg.source) continue;
          messages.push({
            uid: msg.uid,
            uidValidity,
            mailboxKey,
            source: msg.source,
          });
          if (messages.length >= input.limit) break;
        }

        return { uidValidity, messages };
      } finally {
        lock.release();
      }
    },

    async disconnect() {
      if (client) {
        try {
          await client.logout();
        } catch {
          // ignore
        }
        client = null;
      }
    },
  };
}
