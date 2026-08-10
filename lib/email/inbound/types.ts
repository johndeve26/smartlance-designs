/** Inbound mailbox sync constants */
export const INBOUND_SYNC_BATCH_MAX = 50;
export const INBOUND_BODY_MAX_BYTES = 256 * 1024;
export const INBOUND_SYNC_MAX_ATTEMPTS = 3;
export const INBOUND_TEST_RATE_LIMIT = 5;
export const INBOUND_TEST_RATE_WINDOW_MS = 15 * 60 * 1000;

export type InboundProviderType = "IMAP";

export type ParsedInboundMessage = {
  fromAddress: string;
  fromName: string | null;
  toAddresses: string[];
  ccAddresses: string[];
  subject: string;
  bodyText: string;
  bodyHtmlSanitized: string | null;
  internetMessageId: string | null;
  inReplyToMessageId: string | null;
  referencesHeader: string | null;
  receivedAt: Date;
  isAutomated: boolean;
  attachmentMeta: Array<{ filename: string; contentType: string; size: number }>;
  bodyTruncated: boolean;
};

export type MailboxMessageRef = {
  uid: number;
  uidValidity: bigint;
  mailboxKey: string;
  source: Buffer | string;
};

export type InboundMailboxProvider = {
  testConnection(): Promise<{ ok: true } | { ok: false; error: string }>;
  listNewMessages(input: {
    sinceUid: bigint;
    uidValidity: bigint | null;
    limit: number;
  }): Promise<{
    uidValidity: bigint;
    messages: MailboxMessageRef[];
  }>;
  disconnect(): Promise<void>;
};

export type InboundSyncResult = {
  imported: number;
  skipped: number;
  failed: number;
  duplicates: number;
  needsReview: number;
  verifiedReplies: number;
  automated: number;
  aborted: boolean;
  errorSafe: string | null;
};
