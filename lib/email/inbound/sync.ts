import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createImapProvider } from "@/lib/email/inbound/imap-provider";
import { parseInboundRawMessage } from "@/lib/email/inbound/parser";
import {
  INBOUND_SYNC_BATCH_MAX,
  INBOUND_SYNC_MAX_ATTEMPTS,
  type InboundSyncResult,
  type InboundMailboxProvider,
} from "@/lib/email/inbound/types";
import {
  buildImapConfigFromRow,
  getInboundEmailSettingsRecord,
  getMailboxState,
  resolveMailboxKeyFromConfig,
  upsertMailboxState,
} from "@/lib/repositories/inboundEmailSettingsRepository";
import { matchInboundMessage } from "@/lib/crm/inbound/matching";
import { handleVerifiedInboundReply } from "@/lib/crm/inbound/reply-handler";

export async function runInboundEmailSync(
  overrides?: { provider?: InboundMailboxProvider; db?: PrismaClient },
): Promise<InboundSyncResult> {
  const db = overrides?.db ?? prisma;
  const result: InboundSyncResult = {
    imported: 0,
    skipped: 0,
    failed: 0,
    duplicates: 0,
    needsReview: 0,
    verifiedReplies: 0,
    automated: 0,
    aborted: false,
    errorSafe: null,
  };

  const settings = overrides?.db
    ? await db.inboundEmailSettings.findUnique({ where: { id: "inbound" } })
    : await getInboundEmailSettingsRecord();
  if (!settings?.enabled) {
    result.aborted = true;
    result.errorSafe = "Inbound sync disabled.";
    return result;
  }

  const imapConfig = buildImapConfigFromRow(settings);
  if (!imapConfig && !overrides?.provider) {
    result.aborted = true;
    result.errorSafe = "Inbound mailbox not fully configured.";
    return result;
  }

  const actorId = settings.syncActorId ?? settings.updatedById;
  if (!actorId) {
    result.aborted = true;
    result.errorSafe = "No sync actor configured.";
    return result;
  }

  const mailboxKey = imapConfig
    ? resolveMailboxKeyFromConfig(imapConfig)
    : "mock-inbound-mailbox";
  const provider =
    overrides?.provider ??
    (imapConfig ? createImapProvider(imapConfig) : null);

  if (!provider) {
    result.aborted = true;
    result.errorSafe = "Inbound mailbox not fully configured.";
    return result;
  }

  const mailboxState = overrides?.db
    ? await db.inboundMailboxState.findUnique({ where: { mailboxKey } })
    : await getMailboxState(mailboxKey);
  let sinceUid = mailboxState?.lastSeenUid ?? BigInt(0);
  let storedUidValidity = mailboxState?.uidValidity ?? null;

  try {
    const test = await provider.testConnection();
    if (!test.ok) {
      result.aborted = true;
      result.errorSafe = test.error;
      await db.inboundEmailSettings.update({
        where: { id: "inbound" },
        data: {
          lastSyncedAt: new Date(),
          lastSyncErrorSafe: test.error,
        },
      });
      return result;
    }

    const { uidValidity, messages } = await provider.listNewMessages({
      sinceUid,
      uidValidity: storedUidValidity,
      limit: INBOUND_SYNC_BATCH_MAX,
    });

    if (storedUidValidity != null && storedUidValidity !== uidValidity) {
      sinceUid = BigInt(0);
    }

    const identityEmails = [
      imapConfig?.username,
      settings.crmReplyToEmail,
    ].filter((e): e is string => Boolean(e));

    let maxUid = sinceUid;

    for (const msg of messages) {
      if (BigInt(msg.uid) > maxUid) maxUid = BigInt(msg.uid);

      const existingImport = await db.inboundMessageImport.findUnique({
        where: {
          mailboxKey_uidValidity_mailboxUid: {
            mailboxKey: msg.mailboxKey,
            uidValidity: msg.uidValidity,
            mailboxUid: BigInt(msg.uid),
          },
        },
      });

      if (existingImport?.status === "SUCCESS") {
        result.duplicates++;
        continue;
      }

      try {
        const parsed = await parseInboundRawMessage(msg.source);
        const match = await matchInboundMessage(db, parsed, identityEmails);

        if (parsed.internetMessageId) {
          const dup = await db.crmEmail.findUnique({
            where: { internetMessageId: parsed.internetMessageId },
          });
          if (dup) {
            result.duplicates++;
            continue;
          }
        }

        let reviewStatus: "NEEDS_REVIEW" | "UNMATCHED" | "AUTOMATED" | "MATCHED" =
          match.confidence === "UNMATCHED" ? "UNMATCHED" : "NEEDS_REVIEW";
        if (parsed.isAutomated) reviewStatus = "AUTOMATED";
        else if (match.confidence !== "UNMATCHED") reviewStatus = "MATCHED";

        const email = await db.crmEmail.create({
          data: {
            contactId: match.contactId,
            leadId: match.leadId,
            dealId: match.dealId,
            threadId: match.threadId,
            replyToOutboundId: match.replyToOutboundId,
            origin: "INBOUND_SYNC",
            direction: "INBOUND",
            subject: parsed.subject,
            bodyText: parsed.bodyText,
            bodyHtml: parsed.bodyHtmlSanitized,
            deliveryStatus: "RECEIVED",
            reviewStatus,
            matchConfidence: match.confidence,
            internetMessageId: parsed.internetMessageId,
            inReplyToMessageId: parsed.inReplyToMessageId,
            referencesHeader: parsed.referencesHeader,
            fromAddress: parsed.fromAddress,
            toAddresses: parsed.toAddresses,
            ccAddresses: parsed.ccAddresses,
            mailboxKey: msg.mailboxKey,
            mailboxUid: BigInt(msg.uid),
            mailboxUidValidity: msg.uidValidity,
            isAutomated: parsed.isAutomated,
            bodyTruncated: parsed.bodyTruncated,
            attachmentMeta: parsed.attachmentMeta,
            receivedAt: parsed.receivedAt,
            createdById: actorId,
          },
        });

        await db.inboundMessageImport.upsert({
          where: {
            mailboxKey_uidValidity_mailboxUid: {
              mailboxKey: msg.mailboxKey,
              uidValidity: msg.uidValidity,
              mailboxUid: BigInt(msg.uid),
            },
          },
          create: {
            mailboxKey: msg.mailboxKey,
            uidValidity: msg.uidValidity,
            mailboxUid: BigInt(msg.uid),
            internetMessageId: parsed.internetMessageId,
            crmEmailId: email.id,
            status: "SUCCESS",
          },
          update: {
            crmEmailId: email.id,
            status: "SUCCESS",
            failureSafe: null,
          },
        });

        result.imported++;

        if (match.contactId) {
          if (parsed.isAutomated) result.automated++;
          if (match.exactThread && !parsed.isAutomated) result.verifiedReplies++;

          await handleVerifiedInboundReply({
            db,
            contactId: match.contactId,
            leadId: match.leadId,
            dealId: match.dealId,
            threadId: match.threadId,
            inboundEmailId: email.id,
            subject: parsed.subject,
            bodyText: parsed.bodyText,
            receivedAt: parsed.receivedAt,
            actorId,
            isAutomated: parsed.isAutomated,
            exactThread: match.exactThread,
          });

          if (match.threadId) {
            await db.crmEmailThread.update({
              where: { id: match.threadId },
              data: { lastMessageAt: parsed.receivedAt },
            });
          }
        } else {
          result.needsReview++;
        }
      } catch (err) {
        result.failed++;
        const safe = err instanceof Error ? err.message.slice(0, 120) : "Import failed.";
        const attempts = (existingImport?.attemptCount ?? 0) + 1;

        await db.inboundMessageImport.upsert({
          where: {
            mailboxKey_uidValidity_mailboxUid: {
              mailboxKey: msg.mailboxKey,
              uidValidity: msg.uidValidity,
              mailboxUid: BigInt(msg.uid),
            },
          },
          create: {
            mailboxKey: msg.mailboxKey,
            uidValidity: msg.uidValidity,
            mailboxUid: BigInt(msg.uid),
            status: attempts >= INBOUND_SYNC_MAX_ATTEMPTS ? "SKIPPED" : "FAILED",
            failureSafe: safe,
            attemptCount: attempts,
          },
          update: {
            status: attempts >= INBOUND_SYNC_MAX_ATTEMPTS ? "SKIPPED" : "FAILED",
            failureSafe: safe,
            attemptCount: attempts,
          },
        });

        if (attempts >= INBOUND_SYNC_MAX_ATTEMPTS) {
          result.skipped++;
        }
      }
    }

    if (overrides?.db) {
      await db.inboundMailboxState.upsert({
        where: { mailboxKey },
        create: {
          id: "primary",
          mailboxKey,
          uidValidity,
          lastSeenUid: maxUid,
          lastSyncedAt: new Date(),
          lastErrorSafe: null,
        },
        update: {
          uidValidity,
          lastSeenUid: maxUid,
          lastSyncedAt: new Date(),
          lastErrorSafe: null,
        },
      });
    } else {
      await upsertMailboxState({
        mailboxKey,
        uidValidity,
        lastSeenUid: maxUid,
        lastErrorSafe: null,
      });
    }

    await db.inboundEmailSettings.update({
      where: { id: "inbound" },
      data: {
        lastSyncedAt: new Date(),
        lastSuccessfulSyncAt: new Date(),
        lastSyncErrorSafe: null,
        lastImportCount: result.imported,
      },
    });
  } catch (err) {
    result.aborted = true;
    result.errorSafe =
      err instanceof Error ? err.message.slice(0, 120) : "Sync failed.";
    await db.inboundEmailSettings.update({
      where: { id: "inbound" },
      data: {
        lastSyncedAt: new Date(),
        lastSyncErrorSafe: result.errorSafe,
      },
    });
  } finally {
    await provider.disconnect();
  }

  return result;
}
