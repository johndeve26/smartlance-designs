import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { OUTBOUND_TIMEOUTS } from "@/lib/ops/request-timeout";
import type { ResolvedSmtpConfig, SmtpSecurityMode } from "@/lib/email/types";

const SMTP_TIMEOUT_MS = OUTBOUND_TIMEOUTS.notification;

function resolveTransportSecurity(
  securityMode: SmtpSecurityMode,
  port: number,
): Pick<SMTPTransport.Options, "secure" | "requireTLS" | "ignoreTLS"> {
  const mode =
    securityMode === "AUTO"
      ? port === 465
        ? "TLS"
        : "STARTTLS"
      : securityMode;

  switch (mode) {
    case "TLS":
      return { secure: true };
    case "STARTTLS":
      return { secure: false, requireTLS: true };
    case "NONE":
      return { secure: false, ignoreTLS: true };
    default:
      return { secure: false, requireTLS: true };
  }
}

export function formatFromAddress(fromEmail: string, fromName: string | null) {
  const email = fromEmail.trim();
  const name = fromName?.trim();
  if (!name) return email;
  const safeName = name.replace(/[\r\n"]/g, " ");
  return `"${safeName}" <${email}>`;
}

export function createSmtpTransport(config: ResolvedSmtpConfig) {
  const security = resolveTransportSecurity(config.securityMode, config.port);
  const options: SMTPTransport.Options = {
    host: config.host,
    port: config.port,
    ...security,
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS,
    tls: {
      // Certificate verification remains enabled (rejectUnauthorized defaults true).
    },
  };

  if (config.username) {
    options.auth = {
      user: config.username,
      pass: config.password ?? "",
    };
  }

  return nodemailer.createTransport(options);
}

export async function verifySmtpConnection(config: ResolvedSmtpConfig) {
  const transport = createSmtpTransport(config);
  try {
    await transport.verify();
    return { ok: true as const };
  } finally {
    transport.close();
  }
}

export async function sendViaSmtp(
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
  const transport = createSmtpTransport(config);
  const headers: Record<string, string> = {};
  if (input.inReplyTo) headers["In-Reply-To"] = input.inReplyTo;
  if (input.references) headers.References = input.references;
  if (input.messageId) headers["Message-ID"] = input.messageId;

  try {
    const info = await transport.sendMail({
      from: formatFromAddress(config.fromEmail, config.fromName),
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
    return { ok: true as const, messageId: info.messageId };
  } finally {
    transport.close();
  }
}
