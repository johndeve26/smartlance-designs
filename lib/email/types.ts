export type SmtpSecurityMode = "AUTO" | "TLS" | "STARTTLS" | "NONE";

export type EmailProvider = "smtp" | "resend" | "none";

export type SendTransactionalEmailInput = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  inReplyTo?: string;
  references?: string;
  messageId?: string;
};

export type SendTransactionalEmailResult = {
  success: boolean;
  /** Transport may have accepted before client confirmation (V2.1). */
  ambiguous?: boolean;
  ambiguousCode?: string;
  messageId?: string;
  provider: EmailProvider;
  errorCode?: string;
  errorMessage?: string;
};

export type ResolvedSmtpConfig = {
  host: string;
  port: number;
  securityMode: SmtpSecurityMode;
  username: string | null;
  password: string | null;
  fromName: string | null;
  fromEmail: string;
  replyToEmail: string | null;
};

export type ActiveEmailTransport =
  | { kind: "smtp"; config: ResolvedSmtpConfig }
  | { kind: "resend"; apiKey: string; fromEmail: string }
  | { kind: "none" };
