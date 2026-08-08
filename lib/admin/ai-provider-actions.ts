"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { assertSameOrigin, requireAdminUser } from "@/lib/admin/session";
import { writeAuditLog } from "@/lib/repositories/auditRepository";
import { prisma } from "@/lib/db";
import {
  canEncryptAiSecrets,
  decryptSecret,
  encryptSecret,
  maskSecretLast4,
} from "@/lib/ai/secrets";
import {
  createProviderForTest,
  getCatalogDefaultModel,
  getCatalogEntry,
  invalidateAIProviderCache,
  isCatalogProviderId,
} from "@/lib/ai/providers";
import { envFallbackKey } from "@/lib/ai/providers/catalog";
import { AIProviderRequestError } from "@/lib/ai/providers/types";

function revalidateProviderPaths() {
  revalidatePath("/admin/ai-writer");
  revalidatePath("/admin/ai-writer/settings");
  revalidatePath("/admin/system");
}

function testFailRedirect(providerId: string, reason: string) {
  const safe = reason
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
  redirect(
    `/admin/ai-writer/settings?notice=test&test=${providerId}&result=fail&reason=${encodeURIComponent(safe || "error")}&open=${providerId}`,
  );
}

export async function saveAIProviderAccountAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_ai_settings");
  const providerId = String(formData.get("providerId") || "").trim();
  if (!isCatalogProviderId(providerId)) {
    throw new Error("Unknown provider");
  }
  const catalog = getCatalogEntry(providerId)!;
  const enabled = String(formData.get("enabled")) === "on";
  const baseUrlRaw = String(formData.get("baseUrl") || "").trim();
  const defaultModelRaw = String(formData.get("defaultModel") || "").trim();
  const newKey = String(formData.get("apiKey") || "").trim();
  const clearKey = String(formData.get("clearKey")) === "1";
  const defaultModel = defaultModelRaw || catalog.defaultModel;

  if (newKey && !canEncryptAiSecrets()) {
    throw new Error(
      "Cannot store API keys: set AI_SECRETS_ENCRYPTION_KEY or ADMIN_SESSION_SECRET (≥16 chars).",
    );
  }

  const existing = await prisma.aIProviderAccount.findUnique({
    where: { providerId },
  });

  let apiKeyCiphertext = existing?.apiKeyCiphertext ?? null;
  let apiKeyIv = existing?.apiKeyIv ?? null;
  let apiKeyTag = existing?.apiKeyTag ?? null;
  let apiKeyLast4 = existing?.apiKeyLast4 ?? null;
  let keyAction: "unchanged" | "set" | "cleared" = "unchanged";

  if (clearKey) {
    apiKeyCiphertext = null;
    apiKeyIv = null;
    apiKeyTag = null;
    apiKeyLast4 = null;
    keyAction = "cleared";
  } else if (newKey) {
    const enc = encryptSecret(newKey);
    apiKeyCiphertext = enc.ciphertext;
    apiKeyIv = enc.iv;
    apiKeyTag = enc.tag;
    apiKeyLast4 = maskSecretLast4(newKey).replace(/^••••/, "");
    keyAction = "set";
  }

  await prisma.aIProviderAccount.upsert({
    where: { providerId },
    create: {
      providerId,
      label: catalog.label,
      enabled,
      baseUrl: baseUrlRaw || null,
      defaultModel,
      apiKeyCiphertext,
      apiKeyIv,
      apiKeyTag,
      apiKeyLast4,
      updatedById: user.id,
    },
    update: {
      label: catalog.label,
      enabled,
      baseUrl: baseUrlRaw || null,
      defaultModel,
      apiKeyCiphertext,
      apiKeyIv,
      apiKeyTag,
      apiKeyLast4,
      updatedById: user.id,
    },
  });

  invalidateAIProviderCache();

  await writeAuditLog({
    actorId: user.id,
    action: "ai_provider.updated",
    entityType: "AIProviderAccount",
    entityId: providerId,
    metadata: {
      providerId,
      enabled,
      keyAction,
      baseUrlSet: Boolean(baseUrlRaw),
      defaultModel,
    },
  });

  revalidateProviderPaths();
  redirect(`/admin/ai-writer/settings?notice=provider&saved=${providerId}&open=${providerId}`);
}

export async function clearAIProviderKeyAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_ai_settings");
  const providerId = String(formData.get("providerId") || "").trim();
  if (!isCatalogProviderId(providerId)) {
    throw new Error("Unknown provider");
  }

  const existing = await prisma.aIProviderAccount.findUnique({
    where: { providerId },
  });
  if (!existing) {
    redirect("/admin/ai-writer/settings");
  }

  await prisma.aIProviderAccount.update({
    where: { providerId },
    data: {
      apiKeyCiphertext: null,
      apiKeyIv: null,
      apiKeyTag: null,
      apiKeyLast4: null,
      updatedById: user.id,
    },
  });

  invalidateAIProviderCache();

  await writeAuditLog({
    actorId: user.id,
    action: "ai_provider.key_cleared",
    entityType: "AIProviderAccount",
    entityId: providerId,
    metadata: { providerId, keyAction: "cleared" },
  });

  revalidateProviderPaths();
  redirect(`/admin/ai-writer/settings?notice=cleared&cleared=${providerId}&open=${providerId}`);
}

export async function testAIProviderConnectionAction(formData: FormData) {
  await assertSameOrigin();
  await requireAdminUser("manage_ai_settings");
  const providerId = String(formData.get("providerId") || "").trim();
  if (!isCatalogProviderId(providerId)) {
    redirect("/admin/ai-writer/settings?notice=test&test=invalid&result=fail");
  }

  const account = await prisma.aIProviderAccount.findUnique({
    where: { providerId },
  });
  const catalog = getCatalogEntry(providerId)!;

  let apiKey = String(formData.get("apiKey") || "").trim();
  if (!apiKey && account?.apiKeyCiphertext && account.apiKeyIv && account.apiKeyTag) {
    try {
      apiKey = decryptSecret({
        ciphertext: account.apiKeyCiphertext,
        iv: account.apiKeyIv,
        tag: account.apiKeyTag,
      });
    } catch {
      apiKey = "";
    }
  }
  if (!apiKey) {
    apiKey = envFallbackKey(providerId);
  }

  if (!apiKey) {
    redirect(`/admin/ai-writer/settings?notice=test&test=${providerId}&result=nokey&open=${providerId}`);
  }

  const baseUrl =
    String(formData.get("baseUrl") || "").trim() ||
    account?.baseUrl ||
    catalog.defaultBaseUrl;

  if (providerId === "custom" && !baseUrl) {
    redirect(`/admin/ai-writer/settings?notice=test&test=${providerId}&result=nobase&open=${providerId}`);
  }

  const testModel =
    String(formData.get("defaultModel") || "").trim() ||
    account?.defaultModel ||
    getCatalogDefaultModel(providerId, "FAST");

  try {
    const provider = createProviderForTest({
      providerId,
      apiKey,
      baseUrl,
      defaultModel: String(formData.get("defaultModel") || "").trim() || account?.defaultModel,
    });
    const result = await provider.generateText({
      modelRole: "FAST_MODEL",
      model: testModel,
      maxTokens: 16,
      temperature: 0,
      messages: [{ role: "user", content: "Reply with exactly: ok" }],
    });
    if (!result.text.trim()) {
      redirect(`/admin/ai-writer/settings?notice=test&test=${providerId}&result=empty&open=${providerId}`);
    }
    redirect(`/admin/ai-writer/settings?notice=test&test=${providerId}&result=ok&open=${providerId}`);
  } catch (err) {
    // redirect() throws NEXT_REDIRECT — must not treat success as failure
    if (isRedirectError(err)) throw err;

    if (err instanceof AIProviderRequestError) {
      testFailRedirect(providerId, `${err.code}-${err.message}`);
    }
    const message = err instanceof Error ? err.message : "unknown-error";
    testFailRedirect(providerId, message);
  }
}
