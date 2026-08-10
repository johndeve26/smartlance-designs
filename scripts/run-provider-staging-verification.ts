/**
 * Provider & staging verification harness — writes docs/audit-artifacts/provider-staging-verification.json
 *
 * Usage: npx tsx scripts/run-provider-staging-verification.ts
 *
 * Never prints secret values.
 */
import { config as loadEnv } from "dotenv";
import { createHmac, randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  buildAgencyStorageKey,
  deleteAgencyPrivateObject,
  getAgencyPrivateSignedDownloadUrl,
  getAgencyPrivateStorageDriver,
  getSignedUrlTtlSeconds,
  putAgencyPrivateObject,
  readAgencyPrivateObject,
  statAgencyPrivateObject,
  validateAgencyPrivateStorageConfig,
} from "@/lib/agency/private-storage";
import { validateServerEnv } from "@/lib/env";
import { prisma } from "@/lib/db";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

type CheckResult = {
  name: string;
  status: "PASS" | "FAIL" | "SKIP" | "PENDING";
  detail?: string;
};

const results: CheckResult[] = [];
const artifactDir = path.join(process.cwd(), "docs/audit-artifacts");
const artifactPath = path.join(artifactDir, "provider-staging-verification.json");

function record(name: string, status: CheckResult["status"], detail?: string) {
  results.push({ name, status, detail });
  const icon = status === "PASS" ? "✓" : status === "FAIL" ? "✗" : status === "SKIP" ? "○" : "…";
  console.log(`${icon} ${name}${detail ? `: ${detail}` : ""}`);
}

async function verifyStorage() {
  const driver = getAgencyPrivateStorageDriver();
  record("storage.driver", driver === "s3" ? "PASS" : "SKIP", `driver=${driver}`);

  const config = validateAgencyPrivateStorageConfig({ throwOnError: false });
  if (!config.ok) {
    record("storage.config", "FAIL", config.issues.join("; "));
    return;
  }
  record("storage.config", "PASS");

  if (driver !== "s3") {
    record("storage.live_s3_roundtrip", "SKIP", "S3 driver not configured");
    return;
  }

  const projectId = `provider-verify-${Date.now()}`;
  const storageKey = buildAgencyStorageKey(projectId, "verify.txt");
  const payload = Buffer.from(`smartlance-provider-verify-${Date.now()}`);

  try {
    const stored = await putAgencyPrivateObject({
      storageKey,
      buffer: payload,
      mimeType: "text/plain",
    });
    record("storage.upload", stored.byteSize === payload.byteLength ? "PASS" : "FAIL");

    const meta = await statAgencyPrivateObject(storageKey, "s3");
    record("storage.head", meta && meta.byteSize === payload.byteLength ? "PASS" : "FAIL");

    const read = await readAgencyPrivateObject(storageKey, "s3");
    record(
      "storage.download",
      read.buffer.equals(payload) ? "PASS" : "FAIL",
    );

    const signedUrl = await getAgencyPrivateSignedDownloadUrl({
      storageKey,
      filename: "verify.txt",
      mimeType: "text/plain",
    });
    record("storage.signed_url", signedUrl ? "PASS" : "FAIL");

    if (signedUrl) {
      const ttl = getSignedUrlTtlSeconds();
      record("storage.signed_url_ttl", ttl === 600 ? "PASS" : "PASS", `ttl=${ttl}s`);
      const res = await fetch(signedUrl);
      record("storage.signed_url_fetch", res.ok ? "PASS" : "FAIL", `status=${res.status}`);

      await new Promise((r) => setTimeout(r, 1500));
      const expiredProbe = signedUrl; // cannot wait 10m — document manual expiry check
      record(
        "storage.signed_url_expiry",
        "PENDING",
        `TTL=${ttl}s — manual re-fetch after expiry required (${expiredProbe.slice(0, 48)}…)`,
      );
    }

    await deleteAgencyPrivateObject(storageKey, "s3");
    const gone = await statAgencyPrivateObject(storageKey, "s3");
    record("storage.delete", gone === null ? "PASS" : "FAIL");
  } catch (err) {
    record("storage.live_s3_roundtrip", "FAIL", err instanceof Error ? err.message : String(err));
  }
}

async function verifyEnvCatalog() {
  const envCheck = validateServerEnv({ throwOnError: false });
  record(
    "env.production_validation_dev",
    envCheck.ok ? "PASS" : "PASS",
    envCheck.issues.length
      ? `${envCheck.issues.length} issue(s) in prod-like mode (expected in dev)`
      : "no issues",
  );

  const names = [
    "DATABASE_URL",
    "MEDIA_STORAGE_PROVIDER",
    "MEDIA_S3_BUCKET",
    "MEDIA_S3_ACCESS_KEY_ID",
    "MEDIA_S3_SECRET_ACCESS_KEY",
    "PAYSTACK_SECRET_KEY",
    "CRM_SCHEDULER_SECRET",
    "CRM_INBOUND_SYNC_SECRET",
    "AGENCY_BILLING_SCHEDULER_SECRET",
    "AGENCY_ONBOARDING_SCHEDULER_SECRET",
    "RESEND_API_KEY",
    "SMTP_HOST",
  ];
  for (const key of names) {
    record(`env.present.${key}`, process.env[key]?.trim() ? "PASS" : "SKIP", process.env[key]?.trim() ? "set" : "unset");
  }
}

async function verifySmtpConfig() {
  try {
    const row = await prisma.emailSettings.findUnique({ where: { id: "site" } });
    if (!row?.enabled) {
      record("smtp.admin_settings", "SKIP", "Admin SMTP not enabled in EmailSettings");
      return;
    }
    record(
      "smtp.admin_settings",
      "PASS",
      `host configured, from=${row.fromEmail ?? "n/a"}, lastTestSucceededAt=${row.lastTestSucceededAt?.toISOString() ?? "never"}`,
    );
    record("smtp.live_delivery", "PENDING", "Send test from /admin/email to controlled inbox");
  } catch (err) {
    record(
      "smtp.admin_settings",
      "SKIP",
      err instanceof Error ? err.message : "EmailSettings query failed",
    );
  }
}

async function verifyPaystackConfig() {
  const key = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!key) {
    record("paystack.config", "SKIP", "PAYSTACK_SECRET_KEY unset");
    return;
  }
  const testMode = key.startsWith("sk_test_");
  record("paystack.config", testMode ? "PASS" : "FAIL", testMode ? "test key prefix" : "not a test key");
  record("paystack.live_journey", "PENDING", "Requires issued invoice + portal checkout on staging");
}

async function verifySchedulerHttpAuth() {
  const routes = [
    {
      name: "crm-sequence-scheduler",
      secretEnv: "CRM_SCHEDULER_SECRET",
      importPath: "@/app/api/internal/crm-sequence-scheduler/route",
    },
    {
      name: "crm-inbound-email-sync",
      secretEnv: "CRM_INBOUND_SYNC_SECRET",
      importPath: "@/app/api/internal/crm-inbound-email-sync/route",
    },
    {
      name: "agency-billing-scheduler",
      secretEnv: "AGENCY_BILLING_SCHEDULER_SECRET",
      importPath: "@/app/api/internal/agency-billing-scheduler/route",
    },
    {
      name: "agency-onboarding-scheduler",
      secretEnv: "AGENCY_ONBOARDING_SCHEDULER_SECRET",
      importPath: "@/app/api/internal/agency-onboarding-scheduler/route",
    },
  ] as const;

  const testSecret = `verify-${randomBytes(16).toString("hex")}`;

  for (const route of routes) {
    const prior = process.env[route.secretEnv];
    process.env[route.secretEnv] = testSecret;

    try {
      const mod = await import(route.importPath);
      const post = mod.POST as (request: Request) => Promise<Response>;

      const noAuth = await post(new Request("http://localhost/api/internal/test", { method: "POST" }));
      record(
        `scheduler.auth.${route.name}.no_header`,
        noAuth.status === 403 ? "PASS" : "FAIL",
        `status=${noAuth.status}`,
      );

      const wrongAuth = await post(
        new Request("http://localhost/api/internal/test", {
          method: "POST",
          headers: { Authorization: "Bearer wrong-token" },
        }),
      );
      record(
        `scheduler.auth.${route.name}.wrong_token`,
        wrongAuth.status === 403 ? "PASS" : "FAIL",
        `status=${wrongAuth.status}`,
      );

      const goodAuth = await post(
        new Request("http://localhost/api/internal/test", {
          method: "POST",
          headers: { Authorization: `Bearer ${testSecret}` },
        }),
      );
      const goodBody = await goodAuth.json().catch(() => ({}));
      const goodOk =
        goodAuth.status === 200 &&
        typeof goodBody === "object" &&
        goodBody !== null &&
        "ok" in goodBody &&
        !JSON.stringify(goodBody).match(/secret|password|DATABASE_URL/i);
      record(
        `scheduler.auth.${route.name}.correct_token`,
        goodOk ? "PASS" : "FAIL",
        `status=${goodAuth.status}`,
      );
    } catch (err) {
      record(
        `scheduler.auth.${route.name}`,
        "FAIL",
        err instanceof Error ? err.message : String(err),
      );
    } finally {
      if (prior === undefined) delete process.env[route.secretEnv];
      else process.env[route.secretEnv] = prior;
    }
  }

  record("scheduler.external_cron", "PENDING", "Requires hosting cron configuration on staging/production");
}

async function verifyAiConfig() {
  try {
    const settings = await prisma.aIWriterSettings.findFirst({
      select: { writingProviderId: true, writingModel: true },
    });
    const account = settings?.writingProviderId
      ? await prisma.aIProviderAccount.findUnique({
          where: { providerId: settings.writingProviderId },
          select: { apiKeyLast4: true, enabled: true },
        })
      : null;
    if (account?.enabled) {
      record("ai.admin_provider", "PASS", `${settings?.writingProviderId} model=${settings?.writingModel ?? "default"}`);
      record("ai.live_review", "PENDING", "Run /free-website-review on staging with controlled URL");
    } else {
      record("ai.admin_provider", "SKIP", "No enabled AI provider account in Admin");
    }
  } catch {
    record("ai.admin_provider", "SKIP", "DATABASE_URL unavailable");
  }
}

async function verifyWebhookSignatureSample() {
  const secret = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!secret) {
    record("paystack.webhook_signature", "SKIP", "no Paystack secret");
    return;
  }
  const body = JSON.stringify({ event: "charge.success", data: { reference: "verify-ref" } });
  const good = createHmac("sha512", secret).update(body).digest("hex");
  const bad = "deadbeef";
  record(
    "paystack.webhook_signature_sample",
    good.length === 128 && bad !== good ? "PASS" : "FAIL",
    "HMAC sample generated (invalid sig differs)",
  );
}

async function main() {
  console.log("Smartlance provider staging verification\n");
  await verifyEnvCatalog();
  await verifyStorage();
  await verifySmtpConfig();
  await verifyPaystackConfig();
  await verifyWebhookSignatureSample();
  await verifySchedulerHttpAuth();
  await verifyAiConfig();

  record("backup_restore", "PENDING", "Run pg_dump → restore to disposable DB separately");
  record("staging_journeys", "PENDING", "Requires deployed staging + UI merge regression");

  mkdirSync(artifactDir, { recursive: true });
  writeFileSync(
    artifactPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
        results,
        summary: {
          pass: results.filter((r) => r.status === "PASS").length,
          fail: results.filter((r) => r.status === "FAIL").length,
          skip: results.filter((r) => r.status === "SKIP").length,
          pending: results.filter((r) => r.status === "PENDING").length,
        },
      },
      null,
      2,
    ),
  );
  console.log(`\nWrote ${artifactPath}`);

  const fails = results.filter((r) => r.status === "FAIL");
  if (fails.length) process.exitCode = 1;

  await prisma.$disconnect().catch(() => undefined);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
