import { isTimeoutError } from "@/lib/ops/request-timeout";

const AUTH_PATTERNS = [
  /auth/i,
  /credentials/i,
  /535/i,
  /534/i,
  /authentication/i,
  /invalid login/i,
  /username and password/i,
];

const SENDER_PATTERNS = [
  /sender/i,
  /from address/i,
  /mail from/i,
  /550/i,
  /553/i,
];

const CONNECTION_PATTERNS = [
  /connect/i,
  /econnrefused/i,
  /enotfound/i,
  /getaddrinfo/i,
  /certificate/i,
  /tls/i,
  /ssl/i,
  /handshake/i,
];

export function normalizeSmtpError(error: unknown): {
  code: string;
  message: string;
} {
  if (isTimeoutError(error)) {
    return {
      code: "TIMEOUT",
      message: "Connection timed out.",
    };
  }

  const raw =
    error instanceof Error
      ? `${error.name}: ${error.message}`.slice(0, 500)
      : String(error).slice(0, 500);

  if (AUTH_PATTERNS.some((p) => p.test(raw))) {
    return {
      code: "AUTH_FAILED",
      message: "Authentication was rejected.",
    };
  }

  if (SENDER_PATTERNS.some((p) => p.test(raw))) {
    return {
      code: "SENDER_REJECTED",
      message: "Sender configuration was rejected.",
    };
  }

  if (CONNECTION_PATTERNS.some((p) => p.test(raw))) {
    return {
      code: "CONNECTION_FAILED",
      message: "Could not connect to SMTP server.",
    };
  }

  return {
    code: "DELIVERY_FAILED",
    message: "Email delivery failed.",
  };
}

/** Safe diagnostic for server logs — strips credential-like substrings. */
export function safeSmtpLogDetail(error: unknown): string {
  const normalized = normalizeSmtpError(error);
  return `${normalized.code}: ${normalized.message}`;
}
