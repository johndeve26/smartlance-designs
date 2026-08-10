import type { PrismaClient } from "@prisma/client";
import type { InboundMailboxProvider } from "@/lib/email/inbound/types";
import { TEST_PREFIX } from "./fixtures";

export function buildTestRawEmail(input: {
  from: string;
  to: string;
  subject: string;
  body: string;
  messageId?: string;
  inReplyTo?: string;
  references?: string;
  autoSubmitted?: string;
}) {
  const lines = [
    `From: ${input.from}`,
    `To: ${input.to}`,
    `Subject: ${input.subject}`,
    ...(input.messageId ? [`Message-ID: <${input.messageId}>`] : []),
    ...(input.inReplyTo ? [`In-Reply-To: <${input.inReplyTo}>`] : []),
    ...(input.references ? [`References: ${input.references}`] : []),
    ...(input.autoSubmitted ? [`Auto-Submitted: ${input.autoSubmitted}`] : []),
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "",
    input.body,
  ];
  return Buffer.from(lines.join("\r\n"));
}

export async function ensureInboundSettingsEnabled(
  db: PrismaClient,
  adminId: string,
) {
  await db.inboundEmailSettings.upsert({
    where: { id: "inbound" },
    create: {
      id: "inbound",
      enabled: true,
      providerType: "IMAP",
      syncEnabledAt: new Date(),
      syncActorId: adminId,
      updatedById: adminId,
    },
    update: {
      enabled: true,
      syncActorId: adminId,
      updatedById: adminId,
    },
  });
}

export function createMockInboundProvider(
  messages: Array<{
    uid: number;
    source: Buffer;
    uidValidity?: bigint;
  }>,
): InboundMailboxProvider {
  const uidValidity = messages[0]?.uidValidity ?? BigInt(1);
  const mailboxKey = `${TEST_PREFIX}mock-mailbox`;

  return {
    async testConnection() {
      return { ok: true as const };
    },
    async listNewMessages() {
      return {
        uidValidity,
        messages: messages.map((m) => ({
          uid: m.uid,
          uidValidity,
          mailboxKey,
          source: m.source,
        })),
      };
    },
    async disconnect() {},
  };
}
