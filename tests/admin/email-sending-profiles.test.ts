import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  canEncryptDedicatedSecrets,
  decryptDedicatedSecret,
  encryptDedicatedSecret,
} from "@/lib/secrets/dedicated";
import {
  emailSendingProfileSchema,
  slugifyProfileName,
} from "@/lib/email/sending-profile-schema";
import {
  EMAIL_ROUTE_CATEGORIES,
  EMAIL_ROUTE_LABELS,
  isEmailRouteCategory,
} from "@/lib/email/routing/categories";
import { formatProfileFrom, formatProfileReplyTo } from "@/lib/email/routing/resolve-profile";
import type { ResolvedSendingProfile } from "@/lib/email/routing/resolve-profile";
import { encryptProfileSmtpPassword } from "@/lib/repositories/emailSendingProfileRepository";
import { can } from "@/lib/admin/rbac";

describe("email sending profile schema", () => {
  it("accepts valid profile input", () => {
    const result = emailSendingProfileSchema.safeParse({
      name: "Sales",
      slug: "sales",
      fromName: "Smartlance Sales",
      fromEmail: "sales@example.com",
      transportType: "SYSTEM_SMTP",
      isActive: true,
      isDefault: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid slug", () => {
    const result = emailSendingProfileSchema.safeParse({
      name: "Sales",
      slug: "Sales Team",
      fromName: "Smartlance Sales",
      fromEmail: "sales@example.com",
      transportType: "SYSTEM_SMTP",
      isActive: true,
      isDefault: false,
    });
    expect(result.success).toBe(false);
  });

  it("slugifies profile names", () => {
    expect(slugifyProfileName("Billing & Support")).toBe("billing-support");
  });
});

describe("email route categories", () => {
  it("includes all planned categories", () => {
    expect(EMAIL_ROUTE_CATEGORIES).toContain("AUTH_MAGIC_LINK");
    expect(EMAIL_ROUTE_CATEGORIES).toContain("CHANGE_REQUEST");
    expect(EMAIL_ROUTE_CATEGORIES).toContain("CRM_MANUAL");
    expect(EMAIL_ROUTE_CATEGORIES.length).toBeGreaterThanOrEqual(16);
  });

  it("has labels for every category", () => {
    for (const category of EMAIL_ROUTE_CATEGORIES) {
      expect(EMAIL_ROUTE_LABELS[category].length).toBeGreaterThan(0);
    }
  });

  it("validates category strings", () => {
    expect(isEmailRouteCategory("INVOICE")).toBe(true);
    expect(isEmailRouteCategory("NOT_A_CATEGORY")).toBe(false);
  });
});

describe("profile identity formatting", () => {
  const profile: ResolvedSendingProfile = {
    profileId: "p1",
    profileName: "Sales",
    fromName: "Smartlance Sales",
    fromEmail: "sales@example.com",
    replyToName: "Inbox",
    replyToEmail: "inbox@example.com",
    transportType: "SYSTEM_SMTP",
    source: "route",
    smtpConfig: null,
    resendApiKey: null,
    provider: "smtp",
  };

  it("formats From header", () => {
    expect(formatProfileFrom(profile)).toBe(
      '"Smartlance Sales" <sales@example.com>',
    );
  });

  it("formats Reply-To header", () => {
    expect(formatProfileReplyTo(profile)).toBe(
      '"Inbox" <inbox@example.com>',
    );
  });
});

describe("profile SMTP password encryption", () => {
  const prevAi = process.env.AI_SECRETS_ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.AI_SECRETS_ENCRYPTION_KEY = "test-dedicated-secrets-key-32!!";
  });

  afterEach(() => {
    if (prevAi === undefined) delete process.env.AI_SECRETS_ENCRYPTION_KEY;
    else process.env.AI_SECRETS_ENCRYPTION_KEY = prevAi;
  });

  it("encrypts profile SMTP password without exposing plaintext in DTO fields", () => {
    const enc = encryptProfileSmtpPassword("profile-smtp-secret");
    expect(enc.smtpPasswordCiphertext).not.toBe("profile-smtp-secret");
    expect(enc.smtpPasswordLast4).toBe("cret");
    expect(canEncryptDedicatedSecrets()).toBe(true);
    expect(
      decryptDedicatedSecret({
        ciphertext: enc.smtpPasswordCiphertext,
        iv: enc.smtpPasswordIv,
        tag: enc.smtpPasswordTag,
      }),
    ).toBe("profile-smtp-secret");
  });
});

describe("email profile RBAC", () => {
  it("allows SUPER_ADMIN to manage profiles and routing", () => {
    expect(can("SUPER_ADMIN", "manage_email_profiles")).toBe(true);
    expect(can("SUPER_ADMIN", "manage_email_routing")).toBe(true);
    expect(can("SUPER_ADMIN", "choose_email_sender")).toBe(true);
  });

  it("allows EDITOR to choose sender but not manage profiles", () => {
    expect(can("EDITOR", "choose_email_sender")).toBe(true);
    expect(can("EDITOR", "manage_email_profiles")).toBe(false);
    expect(can("EDITOR", "manage_email_routing")).toBe(false);
  });
});
