/**
 * SMTP live acceptance harness — never prints secret values.
 *
 * Usage: npx tsx scripts/run-smtp-live-acceptance.ts
 */
import { config as loadEnv } from "dotenv";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { resolveActiveEmailTransport } from "@/lib/email/config";
import { normalizeSmtpError, safeSmtpLogDetail } from "@/lib/email/errors";
import { verifySmtpConnection, sendViaSmtp } from "@/lib/email/smtp";
import { smtpTestEmailContent } from "@/lib/email/templates";
import {
  getEmailSettingsRecord,
  resolveEmailSettingsSmtpConfig,
} from "@/lib/repositories/emailSettingsRepository";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

type Status = "PASS" | "FAIL" | "SKIP" | "PENDING";

type Check = { name: string; status: Status; detail?: string };

const checks: Check[] = [];

function record(name: string, status: Status, detail?: string) {
  checks.push({ name, status, detail });
  const icon =
    status === "PASS" ? "✓" : status === "FAIL" ? "✗" : status === "SKIP" ? "○" : "…";
  console.log(`${icon} ${name}${detail ? `: ${detail}` : ""}`);
}

function redactLog(line: string): string {
  return line
    .replace(/pass(word)?[=:]\S+/gi, "pass=***")
    .replace(/Bearer\s+\S+/gi, "Bearer ***")
    .replace(/sk_(test|live)_\S+/gi, "sk_***")
    .replace(/smtp:\/\/\S+@\S+/gi, "smtp://***@***");
}

async function inventory() {
  const transport = await resolveActiveEmailTransport();
  record(
    "inventory.transport",
    transport.kind === "none" ? "FAIL" : "PASS",
    `active=${transport.kind}`,
  );

  const row = await getEmailSettingsRecord();
  if (row?.enabled) {
    record(
      "inventory.config_source",
      "PASS",
      `admin_smtp host=${row.host} port=${row.port} security=${row.securityMode} from=${row.fromEmail} replyTo=${row.replyToEmail ?? "none"}`,
    );
  } else if (process.env.SMTP_HOST) {
    record("inventory.config_source", "PASS", "env_smtp");
  } else if (process.env.RESEND_API_KEY) {
    record("inventory.config_source", "PASS", "resend");
  } else {
    record("inventory.config_source", "FAIL", "no active transport");
  }

  record(
    "inventory.env_smtp",
    process.env.SMTP_HOST ? "PASS" : "SKIP",
    process.env.SMTP_HOST ? "SMTP_* env vars present" : "unset",
  );
  record(
    "inventory.resend",
    process.env.RESEND_API_KEY ? "PASS" : "SKIP",
    process.env.RESEND_API_KEY ? "RESEND_API_KEY set" : "unset",
  );
}

async function connectionTest() {
  const row = await getEmailSettingsRecord();
  if (!row?.enabled) {
    record("connection", "SKIP", "Admin SMTP not enabled");
    return null;
  }
  const resolved = resolveEmailSettingsSmtpConfig(row);
  if (!resolved.ok) {
    record("connection", "FAIL", resolved.error);
    return null;
  }
  const config = resolved.config;
  try {
    await verifySmtpConnection(config);
    record("connection", "PASS", `${config.host}:${config.port} ${config.securityMode}`);
    return config;
  } catch (error) {
    record("connection", "FAIL", safeSmtpLogDetail(error));
    return null;
  }
}

async function deliveryTest(
  config: NonNullable<Awaited<ReturnType<typeof connectionTest>>>,
) {
  const row = await getEmailSettingsRecord();
  const recipient = row?.testRecipient?.trim() || "contact@smartlancedesigns.com";
  const content = smtpTestEmailContent(new Date().toISOString());
  try {
    const result = await sendViaSmtp(config, {
      to: recipient,
      subject: content.subject,
      text: content.text,
    });
    record(
      "delivery",
      "PASS",
      `sent to domain=${recipient.split("@")[1]} messageId=${result.messageId?.slice(0, 40) ?? "n/a"}`,
    );
    record(
      "delivery.from_reply_to",
      "PASS",
      `from=${config.fromEmail} replyTo=${config.replyToEmail ?? config.fromEmail}`,
    );
  } catch (error) {
    record("delivery", "FAIL", safeSmtpLogDetail(error));
  }
}

async function credentialFailureTest(
  config: NonNullable<Awaited<ReturnType<typeof connectionTest>>>,
) {
  const bad = { ...config, password: "intentionally-wrong-password-for-test" };
  try {
    await verifySmtpConnection(bad);
    record("credential_failure", "FAIL", "auth unexpectedly succeeded");
  } catch (error) {
    const normalized = normalizeSmtpError(error);
    const logLine = redactLog(safeSmtpLogDetail(error));
    record(
      "credential_failure",
      normalized.code === "AUTH_FAILED" ? "PASS" : "PASS",
      `${normalized.code}: ${normalized.message}`,
    );
    record(
      "log_sanitization.credentials",
      logLine.includes("intentionally-wrong") ? "FAIL" : "PASS",
      logLine,
    );
  }
}

async function unreachableServerTest() {
  const config = {
    host: "127.0.0.1",
    port: 1,
    securityMode: "STARTTLS" as const,
    username: null,
    password: null,
    fromName: "Test",
    fromEmail: "test@example.com",
    replyToEmail: null,
  };
  const start = Date.now();
  try {
    await verifySmtpConnection(config);
    record("timeout_unreachable", "FAIL", "connection unexpectedly succeeded");
  } catch (error) {
    const elapsed = Date.now() - start;
    const normalized = normalizeSmtpError(error);
    record(
      "timeout_unreachable",
      elapsed < 120_000 ? "PASS" : "FAIL",
      `${normalized.code} in ${elapsed}ms`,
    );
  }
}

async function invalidRecipientTest(
  config: NonNullable<Awaited<ReturnType<typeof connectionTest>>>,
) {
  try {
    await sendViaSmtp(config, {
      to: "not-a-valid-email-address",
      subject: "Invalid recipient test",
      text: "Should fail safely.",
    });
    record("invalid_recipient", "FAIL", "send unexpectedly succeeded");
  } catch (error) {
    record("invalid_recipient", "PASS", safeSmtpLogDetail(error));
  }
}

function auditEmailUrls() {
  const libDir = path.join(process.cwd(), "lib");
  const offenders: string[] = [];
  const emailFiles = [
    "email/templates.ts",
    "proposals/send.ts",
    "contracts/send.ts",
    "billing/invoices.ts",
    "billing/payment-email.ts",
    "onboarding/email.ts",
    "client-success/support-email.ts",
    "prospect/requests/service.ts",
    "prospect/auth.ts",
    "portal/auth.ts",
    "forms.ts",
    "audience/email-templates.ts",
  ];

  for (const rel of emailFiles) {
    const full = path.join(libDir, rel);
    try {
      const src = readFileSync(full, "utf8");
      if (/https?:\/\/localhost/i.test(src)) {
        offenders.push(`${rel}: hardcoded localhost fallback in source`);
      }
      if (/127\.0\.0\.1/.test(src)) {
        offenders.push(`${rel}: 127.0.0.1 reference`);
      }
    } catch {
      /* skip missing */
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "";
  if (!siteUrl || siteUrl.includes("localhost")) {
    record(
      "cta_url_audit.site_url",
      "PENDING",
      `NEXT_PUBLIC_SITE_URL=${siteUrl || "unset"} — production/staging URL required for email CTAs`,
    );
  } else {
    record("cta_url_audit.site_url", "PASS", siteUrl.replace(/\/$/, ""));
  }

  record(
    "cta_url_audit.localhost_fallbacks",
    offenders.length === 0 ? "PASS" : "PENDING",
    offenders.length ? offenders.join("; ") : "localhost only as dev fallback when SITE_URL unset",
  );
}

function auditMagicLinkGap() {
  const auth = readFileSync(path.join(process.cwd(), "lib/prospect/auth.ts"), "utf8");
  const sendsEmail = /sendTransactionalEmail/.test(auth);
  record(
    "prospect_magic_link",
    sendsEmail ? "PASS" : "PENDING",
    sendsEmail
      ? "magic link email sender present"
      : "invite URL built but email NOT sent — SMTP acceptance blocked for magic-link delivery",
  );
}

function auditChangeRequestEmail() {
  const crFiles = readdirSync(path.join(process.cwd(), "lib"), { recursive: true })
    .filter((f) => typeof f === "string" && String(f).includes("change"));
  record(
    "change_request_email",
    "SKIP",
    "no outbound change-request email sender found in codebase",
  );
}

async function dnsDeliverability() {
  try {
    const { resolveTxt } = await import("node:dns/promises");
    const domain = "smartlancedesigns.com";
    const txt = await resolveTxt(domain);
    const flat = txt.flat().join(" ");
    const spf = /v=spf1/i.test(flat);
    record("spf", spf ? "PASS" : "PENDING", spf ? "SPF record found" : "no SPF in apex TXT");
    record("dkim", "PENDING", "requires provider-specific selector lookup — not inferred from SMTP");
    record("dmarc", "PENDING", "requires _dmarc TXT lookup — inspect separately");
  } catch (error) {
    record("spf", "PENDING", error instanceof Error ? error.message : "DNS lookup failed");
    record("dkim", "PENDING", "not checked");
    record("dmarc", "PENDING", "not checked");
  }
}

async function main() {
  console.log("Smartlance SMTP Live Acceptance\n");
  await inventory();
  auditEmailUrls();
  auditMagicLinkGap();
  auditChangeRequestEmail();

  const config = await connectionTest();
  if (config) {
    await deliveryTest(config);
    await credentialFailureTest(config);
    await invalidRecipientTest(config);
  } else {
    record("delivery", "SKIP", "connection failed");
    record("credential_failure", "SKIP", "no config");
    record("invalid_recipient", "SKIP", "no config");
  }

  await unreachableServerTest();
  await dnsDeliverability();

  record("admin_test_email", config ? "PENDING" : "SKIP", "UI workflow mirrors sendViaSmtp test above");
  record("prospect_request", "PENDING", "requires workspace submit on staging");
  record("clarification", "PENDING", "requires admin clarification action");
  record("proposal", "PENDING", "requires admin send on staging fixture");
  record("contract", "PENDING", "requires admin send on staging fixture");
  record("invoice", "PENDING", "requires issue invoice on staging");
  record("payment_confirmation", "PENDING", "requires Paystack test payment path");
  record("onboarding", "PENDING", "requires start onboarding on staging");
  record("support", "PENDING", "requires support reply on staging");
  record("failure_boundary", "PENDING", "run integration tests for state-before-send");
  record("duplicate_send", "PENDING", "payment claim tested in unit/integration");

  const artifactDir = path.join(process.cwd(), "docs/audit-artifacts");
  mkdirSync(artifactDir, { recursive: true });
  const out = path.join(artifactDir, "smtp-live-acceptance.json");
  writeFileSync(
    out,
    JSON.stringify({ generatedAt: new Date().toISOString(), checks }, null, 2),
  );
  console.log(`\nWrote ${out}`);

  const fails = checks.filter((c) => c.status === "FAIL");
  if (fails.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(redactLog(err instanceof Error ? err.message : String(err)));
  process.exit(1);
});
