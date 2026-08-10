import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  canEncryptDedicatedSecrets,
  decryptDedicatedSecret,
  encryptDedicatedSecret,
} from "@/lib/secrets/dedicated";
import {
  smtpSettingsUpdateSchema,
  parseNotificationRecipients,
} from "@/lib/email/smtp-schema";
import { normalizeSmtpError } from "@/lib/email/errors";
import {
  formatFromAddress,
  createSmtpTransport,
} from "@/lib/email/smtp";
import {
  contactNotificationSubject,
  formatContactEmailText,
} from "@/lib/email/templates";
import { escapeHeaderFragment } from "@/lib/email/send";
import { isFormRateLimited } from "@/lib/forms";
import { can } from "@/lib/admin/rbac";
import {
  encryptEmailPassword,
  resolveEmailSettingsSmtpConfig,
} from "@/lib/repositories/emailSettingsRepository";

describe("dedicated secrets encryption", () => {
  const prevAi = process.env.AI_SECRETS_ENCRYPTION_KEY;
  const prevApp = process.env.APP_SECRETS_ENCRYPTION_KEY;
  const prevSession = process.env.ADMIN_SESSION_SECRET;

  beforeEach(() => {
    process.env.AI_SECRETS_ENCRYPTION_KEY = "test-dedicated-secrets-key-32!!";
    delete process.env.APP_SECRETS_ENCRYPTION_KEY;
    delete process.env.ADMIN_SESSION_SECRET;
  });

  afterEach(() => {
    if (prevAi === undefined) delete process.env.AI_SECRETS_ENCRYPTION_KEY;
    else process.env.AI_SECRETS_ENCRYPTION_KEY = prevAi;
    if (prevApp === undefined) delete process.env.APP_SECRETS_ENCRYPTION_KEY;
    else process.env.APP_SECRETS_ENCRYPTION_KEY = prevApp;
    if (prevSession === undefined) delete process.env.ADMIN_SESSION_SECRET;
    else process.env.ADMIN_SESSION_SECRET = prevSession;
  });

  it("round-trips SMTP password encryption", () => {
    const enc = encryptDedicatedSecret("smtp-secret-password");
    expect(enc.ciphertext).not.toBe("smtp-secret-password");
    expect(decryptDedicatedSecret(enc)).toBe("smtp-secret-password");
  });

  it("does not accept session secret as dedicated encryption key", () => {
    delete process.env.AI_SECRETS_ENCRYPTION_KEY;
    process.env.ADMIN_SESSION_SECRET = "session-only-secret-32chars!!";
    expect(canEncryptDedicatedSecrets()).toBe(false);
    expect(() => encryptDedicatedSecret("x")).toThrow();
  });
});

describe("smtp settings schema", () => {
  it("rejects invalid host values", () => {
    const result = smtpSettingsUpdateSchema.safeParse({
      enabled: true,
      host: "https://smtp.example.com",
      port: 587,
      securityMode: "STARTTLS",
      username: null,
      fromName: null,
      fromEmail: "hello@example.com",
      replyToEmail: null,
      notificationRecipients: [],
      testRecipient: null,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid from email when enabled", () => {
    const result = smtpSettingsUpdateSchema.safeParse({
      enabled: true,
      host: "smtp.example.com",
      port: 587,
      securityMode: "STARTTLS",
      username: null,
      fromName: null,
      fromEmail: "not-an-email",
      replyToEmail: null,
      notificationRecipients: [],
      testRecipient: null,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid port", () => {
    const result = smtpSettingsUpdateSchema.safeParse({
      enabled: true,
      host: "smtp.example.com",
      port: 70000,
      securityMode: "STARTTLS",
      username: null,
      fromName: null,
      fromEmail: "hello@example.com",
      replyToEmail: null,
      notificationRecipients: [],
      testRecipient: null,
    });
    expect(result.success).toBe(false);
  });

  it("allows disabled config with incomplete fields", () => {
    const result = smtpSettingsUpdateSchema.safeParse({
      enabled: false,
      host: null,
      port: null,
      securityMode: "AUTO",
      username: null,
      fromName: null,
      fromEmail: null,
      replyToEmail: null,
      notificationRecipients: [],
      testRecipient: null,
    });
    expect(result.success).toBe(true);
  });

  it("parses bounded notification recipients", () => {
    expect(
      parseNotificationRecipients([
        "a@example.com",
        "bad",
        "a@example.com",
        "b@example.com",
      ]),
    ).toEqual(["a@example.com", "b@example.com"]);
  });
});

describe("smtp error normalization", () => {
  it("maps authentication failures to safe messages", () => {
    const normalized = normalizeSmtpError(new Error("535 Authentication failed"));
    expect(normalized.code).toBe("AUTH_FAILED");
    expect(normalized.message).not.toContain("535");
  });

  it("maps timeouts to safe messages", () => {
    const err = new Error("Timed out");
    err.name = "TimeoutError";
    const normalized = normalizeSmtpError(err);
    expect(normalized.code).toBe("TIMEOUT");
    expect(normalized.message).toBe("Connection timed out.");
  });
});

describe("email templates and headers", () => {
  it("uses visitor email only in body, not spoofed From formatting", () => {
    const text = formatContactEmailText(
      {
        reference: "ENQ-2026-ABC",
        name: "Ada",
        email: "visitor@gmail.com",
        service: "SEO",
        projectDetails: "Need help",
      },
      "2026-01-01T00:00:00.000Z",
    );
    expect(text).toContain("visitor@gmail.com");
    expect(formatFromAddress("hello@smartlance.com", "Smartlance")).toBe(
      '"Smartlance" <hello@smartlance.com>',
    );
  });

  it("sanitizes subject/header fragments", () => {
    expect(escapeHeaderFragment("hello\r\nBcc: evil@x.com")).toBe(
      "hello Bcc: evil@x.com",
    );
    expect(
      contactNotificationSubject({ reference: "ENQ-1\r\nInjected: true" }),
    ).not.toContain("\r");
  });
});

describe("smtp transport creation", () => {
  it("creates transport without disabling TLS verification", () => {
    const transport = createSmtpTransport({
      host: "smtp.example.com",
      port: 587,
      securityMode: "STARTTLS",
      username: "user",
      password: "secret",
      fromName: "Smartlance",
      fromEmail: "hello@example.com",
      replyToEmail: null,
    });
    const options = transport.options as {
      tls?: { rejectUnauthorized?: boolean };
      secure?: boolean;
      requireTLS?: boolean;
    };
    expect(options.tls?.rejectUnauthorized).not.toBe(false);
    expect(options.secure).toBe(false);
    expect(options.requireTLS).toBe(true);
    transport.close();
  });
});

describe("smtp test rate limiting", () => {
  it("limits repeated test actions", () => {
    const key = `smtp-test:test-user-${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      expect(isFormRateLimited(key, 5, 60_000)).toBe(false);
    }
    expect(isFormRateLimited(key, 5, 60_000)).toBe(true);
  });
});

describe("smtp admin rbac", () => {
  it("requires manage_settings for SMTP configuration", () => {
    expect(can("SUPER_ADMIN", "manage_settings")).toBe(true);
    expect(can("EDITOR", "manage_settings")).toBe(true);
    expect(can("CONTENT_MANAGER", "manage_settings")).toBe(false);
    expect(can("REVIEWER", "manage_settings")).toBe(false);
  });
});

describe("email settings SMTP resolution", () => {
  const prevAi = process.env.AI_SECRETS_ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.AI_SECRETS_ENCRYPTION_KEY = "test-dedicated-secrets-key-32!!";
  });

  afterEach(() => {
    if (prevAi === undefined) delete process.env.AI_SECRETS_ENCRYPTION_KEY;
    else process.env.AI_SECRETS_ENCRYPTION_KEY = prevAi;
  });

  it("detects unreadable stored passwords before SMTP auth", () => {
    const enc = encryptEmailPassword("mailbox-password");
    process.env.AI_SECRETS_ENCRYPTION_KEY = "different-encryption-key-32!!";
    const resolved = resolveEmailSettingsSmtpConfig({
      id: "site",
      enabled: true,
      host: "premium302.web-hosting.com",
      port: 587,
      securityMode: "STARTTLS",
      username: "contact@smartlancedesigns.com",
      passwordCiphertext: enc.passwordCiphertext,
      passwordIv: enc.passwordIv,
      passwordTag: enc.passwordTag,
      passwordLast4: enc.passwordLast4,
      fromName: "Smartlance Designs",
      fromEmail: "contact@smartlancedesigns.com",
      replyToEmail: null,
      notificationRecipients: [],
      testRecipient: null,
      lastTestedAt: null,
      lastTestSucceededAt: null,
      lastTestErrorSafe: null,
      updatedAt: new Date(),
      updatedById: null,
    });
    expect(resolved.ok).toBe(false);
    if (!resolved.ok) {
      expect(resolved.error).toMatch(/could not be decrypted/i);
    }
  });
});

describe("email delivery env detection", () => {
  const prevResend = process.env.RESEND_API_KEY;
  const prevTo = process.env.CONTACT_TO_EMAIL;
  const prevSmtpHost = process.env.SMTP_HOST;
  const prevSmtpPort = process.env.SMTP_PORT;
  const prevSmtpFrom = process.env.SMTP_FROM_EMAIL;

  afterEach(() => {
    if (prevResend === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = prevResend;
    if (prevTo === undefined) delete process.env.CONTACT_TO_EMAIL;
    else process.env.CONTACT_TO_EMAIL = prevTo;
    if (prevSmtpHost === undefined) delete process.env.SMTP_HOST;
    else process.env.SMTP_HOST = prevSmtpHost;
    if (prevSmtpPort === undefined) delete process.env.SMTP_PORT;
    else process.env.SMTP_PORT = prevSmtpPort;
    if (prevSmtpFrom === undefined) delete process.env.SMTP_FROM_EMAIL;
    else process.env.SMTP_FROM_EMAIL = prevSmtpFrom;
  });

  it("detects env resend configuration", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.CONTACT_TO_EMAIL = "team@example.com";
    const { isEmailDeliveryConfiguredFromEnv } = await import(
      "@/lib/email/config"
    );
    expect(isEmailDeliveryConfiguredFromEnv()).toBe(true);
  });

  it("detects env smtp configuration", async () => {
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_FROM_EMAIL = "hello@example.com";
    const { isEmailDeliveryConfiguredFromEnv } = await import(
      "@/lib/email/config"
    );
    expect(isEmailDeliveryConfiguredFromEnv()).toBe(true);
  });
});
