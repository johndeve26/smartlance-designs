import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";
import { parseReferencesChain, normalizeMessageId } from "@/lib/email/inbound/threading";
import type { ParsedInboundMessage } from "@/lib/email/inbound/types";

export type ThreadMatchResult = {
  confidence: "EXACT_THREAD" | "EXACT_EMAIL" | "UNMATCHED";
  contactId: string | null;
  leadId: string | null;
  dealId: string | null;
  replyToOutboundId: string | null;
  threadId: string | null;
  exactThread: boolean;
};

export async function matchInboundMessage(
  db: Pick<
    PrismaClient,
    "crmEmail" | "crmContact" | "crmEmailThread"
  >,
  parsed: ParsedInboundMessage,
  mailboxIdentityEmails: string[],
): Promise<ThreadMatchResult> {
  const selfEmails = new Set(
    mailboxIdentityEmails.map((e) => e.toLowerCase()),
  );
  if (selfEmails.has(parsed.fromAddress)) {
    return emptyMatch();
  }

  const refIds = parseReferencesChain({
    inReplyTo: parsed.inReplyToMessageId,
    references: parsed.referencesHeader,
  });

  for (const refId of refIds) {
    const outbound = await db.crmEmail.findFirst({
      where: {
        direction: "OUTBOUND",
        OR: [
          { internetMessageId: refId },
          { providerMessageId: refId },
          { providerMessageId: `<${refId}>` },
        ],
      },
    });
    if (outbound) {
      const threadId =
        outbound.threadId ??
        (await ensureThread(db, {
          contactId: outbound.contactId,
          leadId: outbound.leadId,
          dealId: outbound.dealId,
          subject: parsed.subject,
        }));
      return {
        confidence: "EXACT_THREAD",
        contactId: outbound.contactId,
        leadId: outbound.leadId,
        dealId: outbound.dealId,
        replyToOutboundId: outbound.id,
        threadId,
        exactThread: true,
      };
    }
  }

  const contact = await db.crmContact.findFirst({
    where: { emailNormalized: parsed.fromAddress },
    select: { id: true },
  });

  if (contact) {
    return {
      confidence: "EXACT_EMAIL",
      contactId: contact.id,
      leadId: null,
      dealId: null,
      replyToOutboundId: null,
      threadId: null,
      exactThread: false,
    };
  }

  return emptyMatch();
}

function emptyMatch(): ThreadMatchResult {
  return {
    confidence: "UNMATCHED",
    contactId: null,
    leadId: null,
    dealId: null,
    replyToOutboundId: null,
    threadId: null,
    exactThread: false,
  };
}

async function ensureThread(
  db: Pick<PrismaClient, "crmEmailThread" | "crmContact">,
  input: {
    contactId: string | null;
    leadId: string | null;
    dealId: string | null;
    subject: string;
  },
) {
  let assignedToId: string | null = null;
  if (input.contactId) {
    const contact = await db.crmContact.findUnique({
      where: { id: input.contactId },
      select: { ownerId: true },
    });
    assignedToId = contact?.ownerId ?? null;
  }

  const thread = await db.crmEmailThread.create({
    data: {
      contactId: input.contactId,
      leadId: input.leadId,
      dealId: input.dealId,
      subjectNormalized: input.subject.slice(0, 200),
      lastMessageAt: new Date(),
      lastActivityAt: new Date(),
      assignedToId,
      workflowStatus: "CLOSED",
    },
  });
  return thread.id;
}

export function normalizeOutboundMessageId(messageId: string | null | undefined) {
  return normalizeMessageId(messageId);
}
